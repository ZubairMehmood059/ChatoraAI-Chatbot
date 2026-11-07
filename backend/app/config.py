from functools import lru_cache
from pathlib import Path
import re
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory points to the root of the project where .env lives
ROOT_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application configuration loaded from environment and .env file."""

    # Server Settings
    APP_NAME: str = "Chatora AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # CORS Settings
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://chatora.ai",
        "https://chatora-ai.netlify.app",
    ]

    # Gemini AI Provider Settings
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Supabase Settings
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    DATABASE_URL: str = ""

    # Request Limits
    MAX_MESSAGE_LENGTH: int = 8000
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16 MB

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @property
    def is_gemini_configured(self) -> bool:
        return bool(
            self.GEMINI_API_KEY
            and self.GEMINI_API_KEY != "your-gemini-api-key-here"
            and not self.GEMINI_API_KEY.startswith("your-")
        )

    @property
    def is_supabase_configured(self) -> bool:
        return bool(
            self.SUPABASE_URL
            and self.SUPABASE_URL.startswith("http")
            and "your-project" not in self.SUPABASE_URL
            and self.SUPABASE_ANON_KEY
            and not self.SUPABASE_ANON_KEY.startswith("your-")
        )

    @property
    def is_db_configured(self) -> bool:
        return bool(
            self.DATABASE_URL
            and "user:password" not in self.DATABASE_URL
            and not self.DATABASE_URL.startswith("postgresql://placeholder")
        )

    @property
    def async_database_url(self) -> str:
        """Return an async-compatible database connection URL for SQLAlchemy.
        
        Translates postgres:// and postgresql:// to postgresql+asyncpg://.
        Falls back to local instance SQLite when DATABASE_URL is not configured.
        """
        if not self.is_db_configured:
            instance_dir = ROOT_DIR / "instance"
            instance_dir.mkdir(parents=True, exist_ok=True)
            db_path = (instance_dir / "chatora.db").as_posix()
            return f"sqlite+aiosqlite:///{db_path}"

        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # asyncpg does not support sslmode= in the query string; strip or normalize if present
        if "sslmode=" in url:
            url = re.sub(r"[?&]sslmode=[^&]*", "", url)
        return url


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()

