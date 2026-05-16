"""Demand-forecasting endpoints."""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Query

from ..schemas import ForecastRow
from ..services import data_loader

router = APIRouter(prefix="/forecast")


@router.get("", response_model=List[ForecastRow],
            summary="All forecast projections (optionally filtered)")
def all_forecast(
    region:      Optional[str] = Query(None),
    district_id: Optional[str] = Query(None),
    year:        Optional[int] = Query(None, description="2026 | 2030 | 2035"),
):
    rows = data_loader.forecast()
    if region:
        rows = [r for r in rows if r["region"].lower() == region.lower()]
    if district_id:
        # district_id is "<Region>__<District>" — match the readable form
        target = district_id.replace("_", " ")
        rows = [r for r in rows
                if f"{r['region']}  {r['district']}".strip()
                   in target or r["district"].replace(" ", "_") in district_id]
    if year:
        rows = [r for r in rows if r["year"] == year]
    return rows


@router.get("/{district_id}", response_model=List[ForecastRow],
            summary="Forecast projections for one district (all horizons)")
def for_district(district_id: str):
    dists = data_loader.districts()
    match = next((d for d in dists if d["district_id"] == district_id), None)
    if not match:
        return []
    return [r for r in data_loader.forecast()
            if r["district"] == match["district"] and r["region"] == match["region"]]
