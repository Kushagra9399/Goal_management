import os
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "In-House Goal Setting & Tracking Portal"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "atomquest_hackathon_super_secret_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./goal_portal.db")

    class Config:
        case_sensitive = True

settings = Settings()
