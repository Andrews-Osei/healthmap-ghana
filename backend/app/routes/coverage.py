"""Coverage history endpoint — how data completeness evolves over runs."""
from __future__ import annotations
import json
from pathlib import Path
from typing import List

from fastapi import APIRouter

from ..config import settings
from ..schemas import CoverageEntry

router = APIRouter(prefix="/coverage")


@router.get("", response_model=List[CoverageEntry],
            summary="Append-only history of pipeline coverage runs")
def coverage():
    path = Path(settings.data_dir) / "coverage_history.json"
    if not path.exists():
        return []
    return json.loads(path.read_text())
