"""Facility listing endpoints."""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Query

from ..schemas import Facility
from ..services import data_loader

router = APIRouter(prefix="/facilities")


@router.get("", response_model=List[Facility],
            summary="List facilities (filter by region, district, type)")
def list_facilities(
    region:   Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    amenity:  Optional[str] = Query(None,
        description="hospital | clinic | pharmacy | health_post | doctors | dentist"),
    bbox:     Optional[str] = Query(None,
        description="minLon,minLat,maxLon,maxLat — restrict to bounding box"),
    limit: int = Query(5000, ge=1, le=10000),
):
    rows = data_loader.facilities()
    if region:
        rows = [r for r in rows if (r.get("region") or "").lower() == region.lower()]
    if district:
        rows = [r for r in rows if (r.get("district") or "").lower() == district.lower()]
    if amenity:
        rows = [r for r in rows if (r.get("amenity") or "").lower() == amenity.lower()]
    if bbox:
        try:
            minLon, minLat, maxLon, maxLat = (float(x) for x in bbox.split(","))
            rows = [r for r in rows
                    if minLon <= r["lon"] <= maxLon and minLat <= r["lat"] <= maxLat]
        except Exception:
            pass
    return rows[:limit]
