"""Application config — loads from environment variables."""
from __future__ import annotations
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "HealthMap Ghana API"
    version:  str = "1.0.0"

    # CORS
    allowed_origins: str = "http://localhost:3000"

    # Data
    data_dir: Path = Path(__file__).resolve().parent / "data"

    # Auth (scaffold — real auth in v1.1)
    secret_key: str = "please-change-me"
    algorithm:  str = "HS256"
    access_token_expire_minutes: int = 60

    # Optional database for v2
    database_url: str | None = None

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
