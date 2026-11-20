import asyncio
import base64
import io
import json
import time
import wave
from uuid import uuid4

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from config import settings
from gnani import TTSFailure, close_http_client, connect_stt, tts, tts_with_retry
from pipeline import analyze, warning_text

print(f"key loaded: {bool(settings.gnani_api_key)}")

app = FastAPI(title="VeriLex API")
app.add_middleware(CORSMiddleware, allow_origins=list(settings.frontend_origins), allow_credentials=False, allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def close_shared_http_client():
    await close_http_client()

@app.get("/health")
async def health():
    return {"ok": True, "gnani_key_loaded": bool(settings.gnani_api_key), "evon_enabled": bool(settings.use_evon and settings.evon_base_url and settings.evon_model)}

class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1500)
    language: str = "hi-IN"
    voice: str | None = None
    speed: float = Field(default=1.0, ge=0.5, le=2.0)

@app.post("/api/tts")
async def api_tts(body: TTSRequest):
    try:
        audio = await tts(body.text, body.language, body.voice, body.speed)
    except TTSFailure as exc:
        return JSONResponse(status_code=exc.status, content=exc.as_dict())
    return Response(audio, media_type="audio/wav")


def _wav_duration(audio: bytes) -> float:
    try:
        with wave.open(io.BytesIO(audio), "rb") as wav:
            return wav.getnframes() / float(wav.getframerate())
    except (wave.Error, EOFError, ZeroDivisionError):
        return 0.0


async def build_warning(category: str, language: str, document: dict, finding_id: str, claimed_value=None) -> dict:
    fact = document.get(category)
    text = warning_text(category, claimed_value, fact, "contradiction", language)
    warning = {"type": "warning", "text": text, "audio_b64": None, "finding_id": finding_id, "category": category}
    try:
        audio = await tts_with_retry(text, language)
        warning["audio_b64"] = base64.b64encode(audio).decode("ascii")
        warning["_duration"] = _wav_duration(audio)
    except TTSFailure as exc:
        warning["tts_error"] = exc.reason
    return warning


async def _prewarm_warnings(language: str, document: dict):
    defaults = {"processing_fee": 2, "prepayment_penalty": 4, "interest_rate": 11}
    facts = {category: document.get(category, default) for category, default in defaults.items()}
    claims = {"processing_fee": 0, "prepayment_penalty": 0, "interest_rate": 12}
    for category, fact in facts.items():
        if not isinstance(fact, (int, float)):
            continue
        phrase = warning_text(category, claims[category], fact, "contradiction", language)
        try: await tts_with_retry(phrase, language)
        except TTSFailure: pass


@app.get("/api/tts-check")
async def tts_check(language: str = "hi-IN"):
    started = time.perf_counter()
    phrase = "This is a voice check." if language.startswith("en") else "हा आवाज तपास आहे." if language.startswith("mr") else "यह आवाज़ जांच है।"
    try:
        audio = await tts(phrase, language)
    except TTSFailure as exc:
        return JSONResponse(status_code=exc.status, content=exc.as_dict())
    return {"ok": True, "bytes": len(audio), "ms": int((time.perf_counter() - started) * 1000)}


class TestWarningRequest(BaseModel):
    language: str = "hi-IN"
    category: str = "processing_fee"


@app.post("/api/test-warning")
async def test_warning(body: TestWarningRequest):
    if body.category not in ("processing_fee", "prepayment_penalty", "interest_rate"):
        raise HTTPException(status_code=422, detail="Unsupported warning category")
    doc = {"processing_fee": 2, "prepayment_penalty": 4, "interest_rate": 11}
    claimed = {"processing_fee": 0, "prepayment_penalty": 0, "interest_rate": 12}[body.category]
    warning = await build_warning(body.category, body.language, doc, f"test-{uuid4().hex}", claimed)
    warning.pop("_duration", None)
    return warning

@app.websocket("/ws/session")
async def session_socket(browser: WebSocket):
    await browser.accept()
    gnani = None
    sender = None
    speaker = "agent"
    document = {}
    language = "en-IN"
    carry = bytearray()
    last_warning: dict[str, float] = {}
    tasks: set[asyncio.Task] = set()
    ignore_analysis_until = 0.0
    tts_error_sent = False
    prewarm_task = None
    try:
        start = await browser.receive_json()
        if start.get("type") != "start":
            await browser.send_json({"type": "error", "message": "First message must start a session."}); return
        language = str(start.get("language", "en-IN"))
        document = start.get("document") if isinstance(start.get("document"), dict) else {}
        gnani = await connect_stt(language)
        prewarm_task = asyncio.create_task(_prewarm_warnings(language, document))

        async def emit_finding(transcript: str):
            nonlocal ignore_analysis_until, tts_error_sent
            try:
                for finding in await analyze(transcript, document, language):
                    finding_id = f"finding-{uuid4().hex}"
                    await browser.send_json({"type": "finding", "finding_id": finding_id, **finding})
                    category = finding["category"]
                    if finding["verdict"] == "contradiction" and finding["severity"] in ("high", "medium") and time.monotonic() - last_warning.get(category, -1e9) >= 60:
                        last_warning[category] = time.monotonic()
                        warning = await build_warning(category, language, document, finding_id, finding.get("claimed_value"))
                        duration = warning.pop("_duration", 0.0)
                        await browser.send_json(warning)
                        ignore_analysis_until = max(ignore_analysis_until, time.monotonic() + duration + 1.5)
                        if warning.get("tts_error") and not tts_error_sent:
                            tts_error_sent = True
                            await browser.send_json({"type": "error", "message": f"Voice warning unavailable: {warning['tts_error']}"})
            except Exception:
                await browser.send_json({"type": "error", "message": "Could not analyze the transcript."})

        async def from_gnani():
            async for raw in gnani:
                try:
                    message = json.loads(raw)
                    kind = message.get("type")
                    if kind == "error":
                        await browser.send_json({"type": "error", "message": str(message.get("message", "Speech recognition error"))[:500]})
                    elif kind == "transcript" and str(message.get("text", "")).strip():
                        text = str(message["text"]).strip()
                        await browser.send_json({"type": "transcript", "text": text, "final": True, "ts": message.get("timestamp", time.time())})
                        if speaker == "agent" and time.monotonic() >= ignore_analysis_until:
                            task = asyncio.create_task(emit_finding(text)); tasks.add(task); task.add_done_callback(tasks.discard)
                except (ValueError, TypeError):
                    continue
        sender = asyncio.create_task(from_gnani())
        await browser.send_json({"type": "connected"})
        while True:
            message = await browser.receive()
            if message.get("type") == "websocket.disconnect": break
            data = message.get("bytes")
            if data is not None:
                carry.extend(data)
                while len(carry) >= 1024:
                    frame = bytes(carry[:1024]); del carry[:1024]
                    await gnani.send(frame)
                    await asyncio.sleep(0.032)
                continue
            raw = message.get("text")
            if not raw: continue
            try: control = json.loads(raw)
            except ValueError: continue
            if control.get("type") == "speaker" and control.get("who") in ("user", "agent"):
                speaker = control["who"]
            elif control.get("type") == "commit":
                if carry:
                    carry.extend(b"\x00" * (1024 - len(carry) % 1024))
                    while len(carry) >= 1024:
                        frame = bytes(carry[:1024]); del carry[:1024]; await gnani.send(frame)
                await gnani.send(json.dumps({"type": "commit"}))
            elif control.get("type") == "stop": break
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try: await browser.send_json({"type": "error", "message": str(exc)[:500] if isinstance(exc, RuntimeError) else "Speech recognition connection failed."})
        except Exception: pass
    finally:
        if prewarm_task:
            prewarm_task.cancel()
            await asyncio.gather(prewarm_task, return_exceptions=True)
        if sender:
            sender.cancel()
            await asyncio.gather(sender, return_exceptions=True)
        for task in tasks: task.cancel()
        if gnani:
            try: await gnani.close()
            except Exception: pass
        try: await browser.close()
        except Exception: pass
