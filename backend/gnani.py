import asyncio
import logging
import time
from collections import OrderedDict

import httpx
import websockets

from config import settings

logger = logging.getLogger("verilex.tts")
STT_URL = "wss://api.vachana.ai/stt/v3/stream"
TTS_URL = "https://api.vachana.ai/api/v1/tts/inference"
_http = httpx.AsyncClient(timeout=20.0)
_cache: OrderedDict[tuple[str, str, str, float], bytes] = OrderedDict()
_cache_lock = asyncio.Lock()
_CACHE_LIMIT = 256

async def close_http_client():
    await _http.aclose()


class TTSFailure(Exception):
    def __init__(self, status: int, reason: str):
        super().__init__(reason)
        self.status = status
        self.reason = reason

    def as_dict(self) -> dict:
        return {"ok": False, "status": self.status, "reason": self.reason}


def voice_for_language(language: str, requested_voice: str | None = None) -> str:
    if requested_voice:
        return requested_voice
    if language.startswith("mr"):
        return settings.tts_voice_mr
    if language.startswith("en"):
        return settings.tts_voice_en
    return settings.tts_voice


def stt_headers(language: str) -> dict[str, str]:
    return {"x-api-key-id": settings.gnani_api_key, "language_code": language, "model": settings.stt_model, "x-sample-rate": "16000", "x-vad-threshold": "0.5", "x-min-silence-ms": "600", "x-idle-timeout-sec": "60"}


async def connect_stt(language: str):
    if not settings.gnani_api_key:
        raise RuntimeError("GNANI_API_KEY is not configured")
    return await websockets.connect(STT_URL, additional_headers=stt_headers(language), max_size=2**20, ping_interval=20)


def _failure_reason(status: int) -> str:
    if status == 400:
        return "invalid voice or language"
    if status == 401:
        return "TTS authentication failed"
    if status == 403:
        return "TTS key, credits or permission problem"
    if status == 429:
        return "TTS rate limit reached"
    if status >= 500:
        return "Gnani TTS service unavailable"
    return "Gnani TTS request failed"


async def tts(text: str, language: str = "hi-IN", voice: str | None = None, speed: float = 1.0) -> bytes:
    selected_voice = voice_for_language(language, voice)
    cache_key = (text, language, selected_voice, float(speed))
    started = time.perf_counter()
    status = 0
    size = 0
    cached = False
    try:
        if not settings.gnani_api_key:
            raise TTSFailure(503, "GNANI_API_KEY is not configured")
        async with _cache_lock:
            audio = _cache.get(cache_key)
            if audio is not None:
                _cache.move_to_end(cache_key)
                cached = True
                status, size = 200, len(audio)
                return audio

        body = {"text": text, "voice": selected_voice, "model": settings.tts_model, "language": language, "speed": speed, "audio_config": {"sample_rate": 24000, "num_channels": 1, "sample_width": 2, "encoding": "linear_pcm", "container": "wav"}}
        response = None
        for attempt in range(2):
            try:
                response = await _http.post(TTS_URL, headers={"X-API-Key-ID": settings.gnani_api_key, "Content-Type": "application/json"}, json=body)
            except httpx.HTTPError as exc:
                if attempt == 0:
                    await asyncio.sleep(0.25)
                    continue
                raise TTSFailure(503, "Gnani TTS service unavailable") from exc
            status = response.status_code
            if status in (429, 500, 502, 503) and attempt == 0:
                await asyncio.sleep(0.3)
                continue
            break

        if response is None:
            raise TTSFailure(503, "Gnani TTS service unavailable")
        if response.is_error:
            raise TTSFailure(response.status_code, _failure_reason(response.status_code))
        audio = response.content
        size = len(audio)
        content_type = response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
        if not content_type.startswith("audio/"):
            raise TTSFailure(502, "Gnani returned a non-audio response")
        if not audio or not audio.startswith(b"RIFF"):
            raise TTSFailure(502, "Gnani returned an invalid WAV response")
        async with _cache_lock:
            _cache[cache_key] = audio
            _cache.move_to_end(cache_key)
            while len(_cache) > _CACHE_LIMIT:
                _cache.popitem(last=False)
        return audio
    except TTSFailure as exc:
        status = exc.status
        raise
    finally:
        elapsed = int((time.perf_counter() - started) * 1000)
        logger.info("tts text_length=%d language=%s voice=%s status=%d bytes=%d ms=%d cache=%s", len(text), language, selected_voice, status, size, elapsed, str(cached).lower())


async def tts_with_retry(text: str, language: str, voice: str | None = None, speed: float = 1.0) -> bytes:
    # Retries, validation, caching and safe logging live in tts().
    return await tts(text, language, voice, speed)
