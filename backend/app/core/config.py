from typing import Any, List, Optional

from pydantic import ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Fixora API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Security
    JWT_SECRET_KEY: str = "fixora-secret-key-for-development-32bytes"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database setup
    #
    # By default Fixora runs on a zero-dependency local SQLite file, so the
    # backend can start with no external services ("lighter, easier to host").
    # To use PostgreSQL, set the POSTGRES_* variables (see .env.example) or
    # provide a full SQLALCHEMY_DATABASE_URI directly. docker-compose sets the
    # POSTGRES_* vars, so the containerized stack uses Postgres automatically.
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_SERVER: Optional[str] = None
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "fixora"
    SQLITE_PATH: str = "fixora.db"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info: ValidationInfo) -> Any:
        if isinstance(v, str) and v:
            return v
        data = info.data
        server = data.get("POSTGRES_SERVER")
        # Only build a Postgres URL when a server host is explicitly configured;
        # otherwise fall back to a local SQLite file.
        if server:
            user = data.get("POSTGRES_USER") or "postgres"
            password = data.get("POSTGRES_PASSWORD") or "password"
            port = data.get("POSTGRES_PORT", "5432")
            db = data.get("POSTGRES_DB", "fixora")
            return f"postgresql+asyncpg://{user}:{password}@{server}:{port}/{db}"
        sqlite_path = data.get("SQLITE_PATH", "fixora.db")
        return f"sqlite+aiosqlite:///{sqlite_path}"

    @property
    def is_sqlite(self) -> bool:
        return str(self.SQLALCHEMY_DATABASE_URI).startswith("sqlite")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
