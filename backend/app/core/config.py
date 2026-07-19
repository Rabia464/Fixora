from typing import Optional
from pydantic import PostgresDsn, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Fixora API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    # Database setup
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def assemble_db_connection(cls, values: dict) -> dict:
        if not values.get("SQLALCHEMY_DATABASE_URI"):
            user = values.get("POSTGRES_USER", "")
            password = values.get("POSTGRES_PASSWORD", "")
            host = values.get("POSTGRES_SERVER", "")
            port = values.get("POSTGRES_PORT", "5432")
            db = values.get("POSTGRES_DB", "")
            values["SQLALCHEMY_DATABASE_URI"] = (
                f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"
            )
        return values

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
