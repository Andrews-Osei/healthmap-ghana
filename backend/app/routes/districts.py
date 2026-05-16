"""District listing + detail endpoints."""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from ..schemas import DistrictBase, DistrictDetail
from ..services import data_loader

router = APIRouter(prefix="/districts")


@router.get("", response_model=List[DistrictBase],
            summary="List districts (filter by region, tier)")
def list_districts(
    region: Optional[str] = Query(None, description="Filter by region name"),
    risk_tier: Optional[str] = Query(None,
        description="Critical Risk | High Risk | Moderate Risk | Low Risk"),
    limit: int = Query(500, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    rows = data_loader.districts()
    if region:
        rows = [r for r in rows if r["region"].lower() == region.lower()]
    if risk_tier:
        rows = [r for r in rows if r["risk_tier"].lower() == risk_tier.lower()]
    return rows[offset : offset + limit]


@router.get("/{district_id}", response_model=DistrictDetail,
            summary="Single district with attached AI recommendations")
def get_district(district_id: str):
    rows = data_loader.districts()
    match = next((r for r in rows if r["district_id"] == district_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="District not found")
    recs_all = data_loader.recommendations()
    key = f"{match['region']}::{match['district']}"
    return {**match, "recommendations": recs_all.get(key, [])}
