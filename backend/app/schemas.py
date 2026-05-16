"""Pydantic response schemas."""
from __future__ import annotations
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


RiskTier = Literal["Critical Risk", "High Risk", "Moderate Risk", "Low Risk"]


class DistrictBase(BaseModel):
    district_id: str = Field(..., examples=["Central__Asikuma-Odoben-Brakwa"])
    district:    str
    region:      str
    rank:        int
    CVI_0_100:   float
    risk_tier:   RiskTier
    total_facilities:  int
    hospitals_clinics: int
    pharmacies:        int
    type_diversity:    int
    median_nn_km_hosp: Optional[float]
    hosp_per_100k:     float
    pharm_per_100k:    float
    facilities_per_100k: float
    district_pop_proxy:  float
    region_population_2021: int
    is_urban:    int
    lat_centroid: float
    lon_centroid: float


class Recommendation(BaseModel):
    id: str
    title: str
    rationale: str
    priority_score: float


class DistrictDetail(DistrictBase):
    recommendations: List[Recommendation] = []


class RegionSummary(BaseModel):
    region: str
    districts: int
    total_facilities: int
    mean_facilities_per_100k: float
    mean_hosp_per_100k: float
    mean_CVI: float
    population_2021: int
    critical_count: int
    high_count: int


class Facility(BaseModel):
    id: str
    name: Optional[str]
    amenity: str
    healthcare: Optional[str]
    region: Optional[str]
    district: Optional[str]
    lat: float
    lon: float


class ForecastRow(BaseModel):
    district: str
    region:   str
    year:     int
    projected_pop: int
    current_facilities:    int
    required_facilities:   float
    projected_shortfall:   float


class Manifest(BaseModel):
    generated_at: str
    facility_count: int
    district_count: int
    region_count:   int
    tier_counts:    dict
    weights:        dict
    data_sources:   dict


class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str
