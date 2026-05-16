"""AI recommendation engine endpoints."""
from __future__ import annotations
from typing import List
from fastapi import APIRouter, HTTPException

from ..schemas import Recommendation
from ..services import data_loader

router = APIRouter(prefix="/recommendations")


@router.get("/{district_id}", response_model=List[Recommendation],
            summary="AI-generated recommendations for a single district")
def for_district(district_id: str):
    dists = data_loader.districts()
    match = next((d for d in dists if d["district_id"] == district_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="District not found")
    recs_all = data_loader.recommendations()
    key = f"{match['region']}::{match['district']}"
    return recs_all.get(key, [])
