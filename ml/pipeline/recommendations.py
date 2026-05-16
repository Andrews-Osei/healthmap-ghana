"""Rule-based AI recommendation engine.

Each district produces a prioritised list of interventions. Rules trigger on
specific feature thresholds and rank by impact-weight × urgency-weight.
"""
from __future__ import annotations
from typing import List, Dict
import pandas as pd

RULES = [
    {
        "id": "build_phc",
        "title": "Build additional primary healthcare centre",
        "trigger": lambda r: r["hosp_per_100k"] < 1.5,
        "impact": 0.95,
        "rationale": "Hospital + clinic supply is below 1.5 per 100k people, "
                     "well under WHO primary-care benchmarks.",
    },
    {
        "id": "deploy_chps",
        "title": "Deploy new CHPS compound",
        "trigger": lambda r: r["facilities_per_100k"] < 4 and r["is_urban"] == 0,
        "impact": 0.90,
        "rationale": "Rural district with very low total facility density. "
                     "A CHPS compound is the lowest-cost, highest-coverage "
                     "intervention.",
    },
    {
        "id": "mobile_clinic",
        "title": "Deploy mobile clinic services",
        "trigger": lambda r: (r["median_nn_km_hosp"] or 0) > 15,
        "impact": 0.85,
        "rationale": "Facilities are sparsely distributed (median nearest-"
                     "neighbour distance > 15 km). Mobile units bridge the gap.",
    },
    {
        "id": "pharmacy_expansion",
        "title": "Subsidise pharmacy expansion",
        "trigger": lambda r: r["pharm_per_100k"] < 2,
        "impact": 0.70,
        "rationale": "Pharmacy density is below 2 per 100k — medication "
                     "access is constrained.",
    },
    {
        "id": "specialty_diversification",
        "title": "Add specialist healthcare provision",
        "trigger": lambda r: r["type_diversity"] <= 2,
        "impact": 0.65,
        "rationale": "Only a narrow set of facility types are present; "
                     "residents have to travel out of district for many "
                     "services.",
    },
    {
        "id": "road_accessibility",
        "title": "Improve road accessibility to existing facilities",
        "trigger": lambda r: ((r["median_nn_km_hosp"] or 0) > 10
                              and r["facilities_per_100k"] >= 4),
        "impact": 0.60,
        "rationale": "Facilities exist but are far apart — investment in "
                     "feeder roads multiplies their effective reach.",
    },
    {
        "id": "personnel_allocation",
        "title": "Increase healthcare personnel allocation",
        "trigger": lambda r: r["risk_tier"] in ("Critical Risk", "High Risk"),
        "impact": 0.75,
        "rationale": "Even where physical infrastructure exists, this risk "
                     "tier indicates under-staffing relative to need.",
    },
    {
        "id": "emergency_capability",
        "title": "Establish 24/7 emergency response capability",
        "trigger": lambda r: (r["hosp_per_100k"] < 1.0
                              and (r["median_nn_km_hosp"] or 0) > 20),
        "impact": 0.95,
        "rationale": "No hospital-tier facility within reasonable distance; "
                     "preventable mortality risk is high during emergencies.",
    },
]


def generate_for_district(row: pd.Series) -> List[Dict]:
    fired = []
    for rule in RULES:
        try:
            if rule["trigger"](row):
                # urgency scales with CVI
                urgency = float(row.get("CVI_0_100", 50)) / 100
                fired.append({
                    "id":        rule["id"],
                    "title":     rule["title"],
                    "rationale": rule["rationale"],
                    "priority_score": round(rule["impact"] * (0.5 + urgency / 2), 3),
                })
        except Exception:
            continue
    fired.sort(key=lambda x: x["priority_score"], reverse=True)
    return fired[:5]


def generate_all(districts: pd.DataFrame) -> Dict[str, List[Dict]]:
    out = {}
    for _, row in districts.iterrows():
        key = f"{row['region']}::{row['district']}"
        out[key] = generate_for_district(row)
    return out
