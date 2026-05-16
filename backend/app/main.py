"""FastAPI entrypoint."""
from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes import (
    districts as districts_route,
    facilities as facilities_route,
    vulnerability as vulnerability_route,
    recommendations as recommendations_route,
    forecast as forecast_route,
    regions as regions_route,
    auth as auth_route,
    health as health_route,
)

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "REST API for the HealthMap Ghana platform. Serves district-level "
        "healthcare vulnerability scores, facility locations, AI-generated "
        "intervention recommendations, and demand-forecasting projections."
    ),
    openapi_tags=[
        {"name": "Districts",       "description": "District-level CVI scoring"},
        {"name": "Regions",         "description": "Region rollups"},
        {"name": "Facilities",      "description": "Health facility records"},
        {"name": "Vulnerability",   "description": "Ranked vulnerability queries"},
        {"name": "Recommendations", "description": "AI intervention engine"},
        {"name": "Forecast",        "description": "Demand projections"},
        {"name": "Auth",            "description": "Auth scaffolding (JWT)"},
        {"name": "Health",          "description": "Service liveness"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api/v1"
app.include_router(health_route.router,            prefix="",      tags=["Health"])
app.include_router(health_route.manifest_router,   prefix=API_V1, tags=["Health"])
app.include_router(districts_route.router,         prefix=API_V1, tags=["Districts"])
app.include_router(regions_route.router,           prefix=API_V1, tags=["Regions"])
app.include_router(facilities_route.router,        prefix=API_V1, tags=["Facilities"])
app.include_router(vulnerability_route.router,     prefix=API_V1, tags=["Vulnerability"])
app.include_router(recommendations_route.router,   prefix=API_V1, tags=["Recommendations"])
app.include_router(forecast_route.router,          prefix=API_V1, tags=["Forecast"])
app.include_router(auth_route.router,              prefix=API_V1, tags=["Auth"])


@app.get("/", include_in_schema=False)
def root():
    return {
        "name":    settings.app_name,
        "version": settings.version,
        "docs":    "/docs",
        "openapi": "/openapi.json",
    }
