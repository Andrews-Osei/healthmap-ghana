"""Liveness + manifest endpoints.

Two routers are exported:
  router          mounted at ""      for unversioned probes (/health)
  manifest_router mounted under /api/v1 for dataset metadata
"""
from __future__ import annotations
from fastapi import APIRouter

from ..services import data_loader
from ..schemas import Manifest

router = APIRouter()
manifest_router = APIRouter()


@router.get("/health", summary="Liveness probe")
def health():
    return {"status": "ok"}


@manifest_router.get("/manifest", response_model=Manifest,
                     summary="Dataset metadata + counts")
def manifest():
    return data_loader.manifest()
