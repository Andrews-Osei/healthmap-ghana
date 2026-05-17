"""Pydantic response schemas."""
from __future__ import annotations
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


RiskTier = Literal["Critical Risk", "High Risk", "Moderate Risk",
                   "Low Risk", "No Data Yet"]
DataStatus = Literal["scored", "no_data_yet"]


class DistrictBase(BaseModel):
    district_id: str = Field(..., examples=["Central__Asikuma-Odoben-Brakwa"])
    district:    str
    region:      str
    rank:        Optional[int] = None
    CVI_0_100:   Optional[float] = None
    risk_tier:   RiskTier
    data_status: DataStatus = "scored"
    total_facilities:  int
    hospitals_clinics: int
    pharmacies:        int
    type_diversity:    int
    median_nn_km_hosp: Optional[float] = None
    hosp_per_100k:     float = 0.0
    pharm_per_100k:    float = 0.0
    facilities_per_100k: float = 0.0
    district_pop_proxy:  float = 0.0
    region_population_2021: int = 0
    is_urban:    int = 0
    lat_centroid: float = 0.0
    lon_centroid: float = 0.0


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
    pending_no_data: int = 0


class Facility(BaseModel):
    id: str
    name: Optional[str] = None
    amenity: str
    healthcare: Optional[str] = None
    region: Optional[str] = None
    district: Optional[str] = None
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
    pipeline_version: str = "1.0.0"
    generated_at:     str
    facility_count:   int
    district_count:   int
    district_count_scored:      int = 0
    district_count_no_data_yet: int = 0
    district_count_canonical:   int = 0
    coverage_pct:     float = 100.0
    region_count:     int
    tier_counts:      dict
    orphaned_districts: List[str] = []
    weights:          dict
    data_sources:     dict


class CoverageEntry(BaseModel):
    ts:               str
    pipeline_version: str
    scored:           int
    no_data_yet:      int
    canonical:        int
    coverage_pct:     float
    facilities:       int


class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str
