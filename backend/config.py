import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "causalguard_super_secret_key_for_hackathon_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours

    # Declare environment variables to prevent Pydantic validation errors
    GEMINI_API_KEY: Optional[str] = None
    NEWS_API_KEY: Optional[str] = None
    USE_GEMINI: Optional[str] = "true"
    USE_WHISPER: Optional[str] = "false"
    USE_XTTS: Optional[str] = "false"
    USE_NEWS_API: Optional[str] = "true"
    USE_OSRM: Optional[str] = "true"

    # Pydantic v2 configuration style
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
