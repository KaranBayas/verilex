import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

@dataclass(frozen=True)
class Settings:
    gnani_api_key: str = os.getenv("GNANI_API_KEY", "").strip()
    stt_model: str = os.getenv("GNANI_STT_MODEL", "prisma-v2.5")
    tts_model: str = os.getenv("GNANI_TTS_MODEL", "timbre-v2.5")
    tts_voice: str = os.getenv("GNANI_TTS_VOICE", "Nalini")
    tts_voice_mr: str = os.getenv("GNANI_TTS_VOICE_MR", os.getenv("GNANI_TTS_VOICE", "Nalini"))
    tts_voice_en: str = os.getenv("GNANI_TTS_VOICE_EN", "Kaveri")
    evon_base_url: str = os.getenv("EVON_BASE_URL", "").rstrip("/")
    evon_api_key: str = os.getenv("EVON_API_KEY", "")
    evon_model: str = os.getenv("EVON_MODEL", "")
    frontend_origins: tuple[str, ...] = tuple(x.strip() for x in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",") if x.strip())
    use_evon: bool = os.getenv("USE_EVON", "false").lower() == "true"

settings = Settings()
