"""Assistant endpoint — dual-mode (patient + decision-maker)."""
from __future__ import annotations
from typing import Optional, Literal
from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.assistant.router import route

router = APIRouter(prefix="/assistant")


class AssistantRequest(BaseModel):
    mode:          Literal["patient", "decision_maker"]
    query:         Optional[str] = Field(
        None, description="Patient: symptom text. Decision-maker: optional question.")
    user_lat:      Optional[float] = None
    user_lon:      Optional[float] = None
    user_region:   Optional[str]   = None
    filter_region: Optional[str]   = None
    place:         Optional[str]   = Field(
        None, description="Patient: a town/city to search facilities near.")


@router.post("/query", summary="Dual-mode AI assistant")
def query(req: AssistantRequest):
    return route(
        mode=req.mode, query=req.query,
        user_lat=req.user_lat, user_lon=req.user_lon,
        user_region=req.user_region, filter_region=req.filter_region,
        place=req.place,
    )
