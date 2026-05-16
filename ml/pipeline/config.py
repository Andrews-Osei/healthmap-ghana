"""Centralised configuration — paths, constants, weights."""
from __future__ import annotations
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ML_DIR     = Path(__file__).resolve().parents[1]              # ml/
REPO_ROOT  = ML_DIR.parent                                     # healthmap-ghana/
DATA_DIR   = REPO_ROOT / "data"
GPKG_PATH  = DATA_DIR / "facilities" / "health_facilities.gpkg"
OUT_DIR    = ML_DIR / "outputs"
BACKEND_DATA_DIR = REPO_ROOT / "backend" / "app" / "data"

for d in (OUT_DIR, BACKEND_DATA_DIR, DATA_DIR / "facilities",
          DATA_DIR / "geo", DATA_DIR / "population"):
    d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Composite Vulnerability Index weights — must sum to 1.0
# ---------------------------------------------------------------------------
CVI_WEIGHTS = {
    "hosp_per_100k":       0.30,   # sign -1
    "pharm_per_100k":      0.20,   # sign -1
    "type_diversity":      0.15,   # sign -1
    "median_nn_km_hosp":   0.20,   # sign +1
    "facilities_per_100k": 0.15,   # sign -1
}

# ---------------------------------------------------------------------------
# Risk-tier labels (ordered worst → best)
# ---------------------------------------------------------------------------
TIER_LABELS = ["Critical Risk", "High Risk", "Moderate Risk", "Low Risk"]

# ---------------------------------------------------------------------------
# Ghana 2021 PHC regional populations (Ghana Statistical Service)
# ---------------------------------------------------------------------------
REGION_POPULATION_2021 = {
    "Western":       2_060_585,
    "Central":       2_859_821,
    "Greater Accra": 5_455_692,
    "Volta":         1_659_040,
    "Eastern":       2_917_039,
    "Ashanti":       5_440_463,
    "Western North":   880_921,
    "Ahafo":           564_668,
    "Bono":          1_208_649,
    "Bono East":     1_203_400,
    "Oti":             747_257,
    "Northern":      2_310_939,
    "Savannah":        653_266,
    "Northern East":   658_946,
    "Upper East":    1_301_221,
    "Upper West":      901_502,
}

# Annual population growth rate (Ghana 2020-2030 World Bank/UN projection)
ANNUAL_GROWTH_RATE = 0.0190
BASE_YEAR = 2021

# Facility categories used by the ML pipeline
HOSPITAL_TIER = {"hospital", "clinic", "health_post", "doctors", "CHPs"}
