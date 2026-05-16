"""Lazy JSON loader with in-memory caching.

In v1 we serve pre-computed JSON artefacts produced by the ML pipeline.
In v2 these accessors will be backed by SQLAlchemy queries against the
PostgreSQL + PostGIS database — keeping the access pattern stable.
"""
from __future__ import annotations
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from ..config import settings


def _read(name: str) -> Any:
    path = Path(settings.data_dir) / name
    if not path.exists():
        raise FileNotFoundError(
            f"Missing data file: {path}.  Run `python -m pipeline.run_all` "
            "in the ml/ folder first."
        )
    return json.loads(path.read_text())


@lru_cache(maxsize=1)
def districts() -> list[dict]:
    return _read("districts.json")


@lru_cache(maxsize=1)
def regions() -> list[dict]:
    return _read("regions.json")


@lru_cache(maxsize=1)
def facilities() -> list[dict]:
    return _read("facilities.json")


@lru_cache(maxsize=1)
def recommendations() -> dict[str, list[dict]]:
    return _read("recommendations.json")


@lru_cache(maxsize=1)
def forecast() -> list[dict]:
    return _read("forecast.json")


@lru_cache(maxsize=1)
def manifest() -> dict:
    return _read("manifest.json")


def reload_all() -> None:
    """Clear caches — call after a pipeline rerun."""
    for fn in (districts, regions, facilities, recommendations,
               forecast, manifest):
        fn.cache_clear()
