import os
import logging
from pydantic_settings import BaseSettings
from typing import Optional

logger = logging.getLogger("causalguard.config")

_DEFAULT_SECRET = "causalguard_super_secret_key_for_hackathon_2026"

class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY", _DEFAULT_SECRET)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours

    # Declare environment variables to prevent Pydantic validation errors
    GEMINI_API_KEY: Optional[str] = None
    NEWS_API_KEY: Optional[str] = None
    USE_GEMINI: bool = True
    USE_WHISPER: bool = False
    USE_XTTS: bool = False
    USE_NEWS_API: bool = True
    USE_OSRM: bool = True

    # Pydantic v2 configuration style
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()

# Warn if using the default hardcoded secret key (acceptable for hackathon, not for production)
if settings.SECRET_KEY == _DEFAULT_SECRET:
    logger.warning(
        "⚠️  Using default SECRET_KEY. Set a unique SECRET_KEY environment variable for production."
    )
