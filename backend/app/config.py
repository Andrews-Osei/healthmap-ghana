"""Application config — loads from environment variables and a .env file.

We load .env into os.environ *ourselves* (pure standard library) before
reading settings, for two reasons:

  1. The LLM client (services/assistant/llm.py) reads keys straight from
     os.environ. Pydantic's env_file only populates the Settings object, not
     os.environ, so without this the GEMINI_API_KEY in .env would be invisible
     to the assistant.
  2. We search upward from this file for .env, so it is found no matter which
     directory you launch uvicorn from (repo root or backend/).

Real environment variables always win over .env values.
"""
from __future__ import annotations
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


def _load_dotenv() -> Path | None:
    """Find the nearest .env walking up from this file, inject into os.environ.

    Existing real env vars are never overwritten. Returns the path used, or
    None if no .env was found.
    """
    here = Path(__file__).resolve()
    for parent in [here.parent, *here.parents]:
        candidate = parent / ".env"
        if candidate.is_file():
            try:
                for raw in candidate.read_text(encoding="utf-8").splitlines():
                    line = raw.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    if line.lower().startswith("export "):
                        line = line[7:]
                    key, _, val = line.partition("=")
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = val
            except Exception as e:  # never let env parsing crash startup
                print(f"[config] could not read {candidate}: {e}")
            return candidate
    return None


_DOTENV_PATH = _load_dotenv()

# Repo root = the folder that holds .env, else two levels above app/ (…/backend/app)
REPO_ROOT = _DOTENV_PATH.parent if _DOTENV_PATH else Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # env_file kept as a fallback; _load_dotenv above is the primary mechanism.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "HealthMap Ghana API"
    version:  str = "1.0.0"

    # CORS
    allowed_origins: str = "http://localhost:3000"

    # Data — absolute by default; a relative DATA_DIR is resolved against the
    # repo root below so it works regardless of the launch directory.
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

# Make data_dir robust: if it was supplied as a relative path (e.g. via
# DATA_DIR=./backend/app/data in .env), resolve it against the repo root, not
# the current working directory. This is what prevents the
# "Missing data file: backend/app/data/facilities.json" error when uvicorn is
# started from inside backend/.
if not settings.data_dir.is_absolute():
    settings.data_dir = (REPO_ROOT / settings.data_dir).resolve()
