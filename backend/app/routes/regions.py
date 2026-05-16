"""Region rollup endpoints."""
from __future__ import annotations
from typing import List
from fastapi import APIRouter

from ..schemas import RegionSummary
from ..services import data_loader

router = APIRouter(prefix="/regions")


@router.get("", response_model=List[RegionSummary],
            summary="Region-level summary (ordered by mean CVI desc)")
def list_regions():
    return data_loader.regions()
