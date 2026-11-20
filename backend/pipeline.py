import json
import re
import httpx
from config import settings

CATEGORIES = {"processing_fee": "processing fee", "interest_rate": "interest rate", "prepayment_penalty": "prepayment penalty", "lock_in": "lock-in", "insurance": "insurance"}

def _json(text: str):
    return json.loads(re.sub(r"^\s*```(?:json)?|```\s*$", "", text.strip(), flags=re.I))

async def _evon(prompt: str):
    url = settings.evon_base_url + "/chat/completions"
    async with httpx.AsyncClient(timeout=25) as client:
        for attempt in range(2):
            response = await client.post(url, headers={"Authorization": f"Bearer {settings.evon_api_key}"}, json={"model": settings.evon_model, "temperature": 0, "messages": [{"role": "user", "content": prompt}]})
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            try: return _json(content)
            except (ValueError, TypeError, KeyError):
                if attempt: raise
                prompt += " Return valid JSON only, with the requested schema."

def _extract_rule(text: str):
    s = text.lower()
    commitments = []
    fee_negative = [r"no\s+(?:processing\s+)?fee", r"koi\s+(?:processing\s+)?(?:charge|fee)\s+nahi", r"zero\s+fee", r"no\s+hidden\s+charges", r"कोई\s+(?:चार्ज|फीस)\s+नहीं"]
    close = [r"close\s+anytime", r"no\s+penalty", r"kabhi\s+bhi\s+band", r"कभी\s+भी\s+बंद"]
    if any(re.search(p, s) for p in fee_negative): commitments.append({"category": "processing_fee", "claim": text[:160], "claimed_value": 0})
    if any(re.search(p, s) for p in close): commitments.append({"category": "prepayment_penalty", "claim": text[:160], "claimed_value": 0})
    if re.search(r"interest|ब्याज", s):
        match = re.search(r"(\d+(?:\.\d+)?)\s*(?:percent|per\s*cent|%)", s)
        if match: commitments.append({"category": "interest_rate", "claim": text[:160], "claimed_value": float(match.group(1))})
    return commitments

async def analyze(utterance: str, document: dict, language: str = "en-IN") -> list[dict]:
    commitments = None
    if settings.use_evon and settings.evon_base_url and settings.evon_model:
        try:
            data = await _evon('EXTRACT: Given one agent utterance (Hindi, Marathi, English or mixed), return ONLY JSON {"commitments":[{"category":"processing_fee|interest_rate|prepayment_penalty|lock_in|insurance|other","claim":"short claim","claimed_value":number|null}]}; only promises by the agent; empty list if none; never invent. Utterance: ' + utterance)
            raw = data.get("commitments")
            if not isinstance(raw, list): raise ValueError("bad commitments")
            commitments = [x for x in raw if isinstance(x, dict) and x.get("category") in (*CATEGORIES, "other") and isinstance(x.get("claim"), str) and (x.get("claimed_value") is None or isinstance(x.get("claimed_value"), (int, float))) ]
        except Exception:
            commitments = None
    if commitments is None: commitments = _extract_rule(utterance)

    findings = []
    for item in commitments:
        category, claim, value = item["category"], item["claim"], item.get("claimed_value")
        fact = document.get(category)
        verdict, severity, explanation = "unclear", "low", "The document could not be compared with this claim."
        if fact is None:
            verdict, explanation = "not_mentioned", "This term is not listed in the provided document facts."
        elif value is not None and isinstance(fact, (int, float)):
            verdict = "contradiction" if float(value) != float(fact) else "match"
            severity = "high" if verdict == "contradiction" else "low"
            explanation = f"The claim is {value:g}; the document states {fact:g}." if verdict == "contradiction" else "The claimed value matches the document."
        elif settings.use_evon and settings.evon_base_url and settings.evon_model:
            try:
                verify = await _evon(f'VERIFY: Given one claim and document facts, return ONLY JSON {{"verdict":"match|contradiction|not_mentioned|unclear","severity":"high|medium|low","explanation":"one sentence","whisper_text":"max 15 words, numbers written as words"}}; answer unclear if unsure. Claim: {claim}. Facts: {json.dumps(document, ensure_ascii=False)}')
                if verify.get("verdict") in ("match", "contradiction", "not_mentioned", "unclear") and verify.get("severity") in ("high", "medium", "low"):
                    verdict, severity, explanation = verify["verdict"], verify["severity"], str(verify.get("explanation", explanation))
            except Exception: pass
        whisper = _whisper(category, verdict, language, fact, value)
        findings.append({"category": category, "claim": claim, "claimed_value": value, "verdict": verdict, "severity": severity, "explanation": explanation, "whisper_text": whisper})
    return findings

_HI_NUMBERS = ["शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ", "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस", "बीस"]
_MR_NUMBERS = ["शून्य", "एक", "दोन", "तीन", "चार", "पाच", "सहा", "सात", "आठ", "नऊ", "दहा", "अकरा", "बारा", "तेरा", "चौदा", "पंधरा", "सोळा", "सतरा", "अठरा", "एकोणीस", "वीस"]
_EN_NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"]

def number_words(value, language="en-IN"):
    """Speak a value from zero to one hundred in the selected warning language."""
    number = float(value)
    whole = int(number)
    if whole < 0 or whole > 100:
        return str(value)
    words = _HI_NUMBERS if language.startswith("hi") else _MR_NUMBERS if language.startswith("mr") else _EN_NUMBERS
    if whole <= 20:
        result = words[whole]
    elif language.startswith("en"):
        tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
        result = "one hundred" if whole == 100 else tens[whole // 10] + (" " + words[whole % 10] if whole % 10 else "")
    else:
        tens_hi = {2:"बीस", 3:"तीस", 4:"चालीस", 5:"पचास", 6:"साठ", 7:"सत्तर", 8:"अस्सी", 9:"नब्बे", 10:"सौ"}
        tens_mr = {2:"वीस", 3:"तीस", 4:"चाळीस", 5:"पन्नास", 6:"साठ", 7:"सत्तर", 8:"ऐंशी", 9:"नव्वद", 10:"शंभर"}
        tens = tens_hi if language.startswith("hi") else tens_mr
        result = tens[whole // 10] if whole % 10 == 0 else f"{tens[whole // 10]} {words[whole % 10]}"
    fraction = str(number).partition(".")[2].rstrip("0")
    if fraction:
        decimal_joiner = "दशमलव" if language.startswith("hi") else "दशांश" if language.startswith("mr") else "point"
        result += " " + decimal_joiner + " " + " ".join(words[int(digit)] for digit in fraction)
    return result

def warning_text(category, claimed_value, document_value, verdict, language="en-IN"):
    amount = number_words(document_value, language) if document_value is not None else ("अलग शर्त" if language.startswith("hi") else "वेगळी अट" if language.startswith("mr") else "a different term")
    claimed = number_words(claimed_value, language) if claimed_value is not None else None
    if language.startswith("hi"):
        if category == "processing_fee": return f"उन्होंने कहा कोई प्रोसेसिंग फीस नहीं। दस्तावेज़ में {amount} प्रतिशत है।"
        if category == "prepayment_penalty": return f"उन्होंने कहा कभी भी बंद करें। दस्तावेज़ में {amount} प्रतिशत जुर्माना है।"
        if category == "interest_rate" and claimed: return f"उन्होंने {claimed} प्रतिशत ब्याज कहा। दस्तावेज़ में {amount} प्रतिशत है।"
        return f"दावा दस्तावेज़ से अलग है। दस्तावेज़ में {amount} है।"
    if language.startswith("mr"):
        if category == "processing_fee": return f"त्यांनी सांगितले प्रोसेसिंग फी नाही. कागदपत्रात {amount} टक्के आहे."
        if category == "prepayment_penalty": return f"त्यांनी कधीही बंद म्हणले. कागदपत्रात {amount} टक्के दंड आहे."
        if category == "interest_rate" and claimed: return f"त्यांनी {claimed} टक्के व्याज सांगितले. कागदपत्रात {amount} टक्के आहे."
        return f"दावा कागदपत्रापेक्षा वेगळा आहे. कागदपत्रात {amount} आहे."
    if verdict == "match":
        return f"The claimed {CATEGORIES.get(category, 'term')} matches the document."
    if category == "processing_fee": return f"He said no processing fee. The document says {amount} percent."
    if category == "prepayment_penalty": return f"He said close anytime. The document says {amount} percent penalty."
    if category == "interest_rate" and claimed: return f"He said {claimed} percent interest. The document says {amount} percent."
    return f"He made a different promise. The document says {amount}."

def _whisper(category, verdict, language, fact, claimed_value=None):
    return warning_text(category, claimed_value, fact, verdict, language)
