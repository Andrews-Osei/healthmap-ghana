"""End-to-end pipeline runner.

Outputs (into backend/app/data/):

    districts.json          list of all districts with score, tier, features
    regions.json            region-level rollup
    facilities.json         all facilities (slim, frontend-ready)
    recommendations.json    {region::district: [ {title, rationale, priority} ]}
    forecast.json           per-district projections for 2026, 2030, 2035
    manifest.json           dataset metadata + counts
"""
from __future__ import annotations
import json
from datetime import datetime, timezone

import pandas as pd

from .config import BACKEND_DATA_DIR, OUT_DIR, GPKG_PATH
from .etl import load_facilities
from .features import build_district_features
from .scoring import composite_vulnerability_index, assign_risk_tiers
from .forecast import build_forecast_table
from .recommendations import generate_all


def _write_json(path, payload):
    path.write_text(json.dumps(payload, default=float, indent=2))
    print(f"  -> {path.relative_to(BACKEND_DATA_DIR.parent.parent)}")


def main() -> None:
    print(f"HealthMap Ghana ML pipeline (gpkg={GPKG_PATH.name})")

    print("[1/6] ETL ...")
    facilities = load_facilities()
    print(f"      {len(facilities):,} facilities loaded")

    print("[2/6] Features ...")
    districts = build_district_features(facilities)
    print(f"      {len(districts):,} districts")

    print("[3/6] Vulnerability score ...")
    districts = composite_vulnerability_index(districts)

    print("[4/6] Risk-tier clustering ...")
    districts = assign_risk_tiers(districts)
    districts = districts.sort_values("CVI_0_100",
                                      ascending=False).reset_index(drop=True)
    districts["rank"] = districts.index + 1

    # Stable district_id for the API
    districts["district_id"] = (districts["region"].str.replace(" ", "_") + "__"
                                + districts["district"].str.replace(" ", "_"))

    print("[5/6] Forecasting ...")
    forecast = build_forecast_table(districts)

    print("[6/6] AI recommendations ...")
    recs = generate_all(districts)

    # ---- emit JSON for the API -------------------------------------------
    print("Writing JSON artefacts ...")
    _write_json(BACKEND_DATA_DIR / "districts.json",
                districts.to_dict("records"))

    region_summary = (districts.groupby("region")
        .agg(districts=("district", "count"),
             total_facilities=("total_facilities", "sum"),
             mean_facilities_per_100k=("facilities_per_100k", "mean"),
             mean_hosp_per_100k=("hosp_per_100k", "mean"),
             mean_CVI=("CVI_0_100", "mean"),
             population_2021=("region_population_2021", "first"),
             critical_count=("risk_tier",
                             lambda s: int((s == "Critical Risk").sum())),
             high_count=("risk_tier",
                         lambda s: int((s == "High Risk").sum())))
        .sort_values("mean_CVI", ascending=False)
        .reset_index())
    _write_json(BACKEND_DATA_DIR / "regions.json",
                region_summary.to_dict("records"))

    # Slim facilities feed for the map
    fac_slim = facilities[["id", "name", "amenity", "healthcare",
                           "adm1_name", "adm2_name", "lat", "lon"]].copy()
    fac_slim = fac_slim.rename(columns={"adm1_name": "region",
                                        "adm2_name": "district"})
    _write_json(BACKEND_DATA_DIR / "facilities.json",
                fac_slim.to_dict("records"))

    _write_json(BACKEND_DATA_DIR / "recommendations.json", recs)
    _write_json(BACKEND_DATA_DIR / "forecast.json",
                forecast.to_dict("records"))

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "facility_count": int(len(facilities)),
        "district_count": int(len(districts)),
        "region_count":   int(districts["region"].nunique()),
        "tier_counts":    districts["risk_tier"].value_counts().to_dict(),
        "weights":        {"see": "ml/pipeline/config.py"},
        "data_sources":   {
            "facilities":  "OSM Ghana Health Facilities (HOTOSM, ODbL)",
            "population":  "Ghana 2021 PHC (GSS)",
            "boundaries":  "geoBoundaries Ghana ADM2 (CC-BY)",
        },
    }
    _write_json(BACKEND_DATA_DIR / "manifest.json", manifest)

    print("\nDone. Tier distribution:")
    print(districts["risk_tier"].value_counts().to_string())


if __name__ == "__main__":
    main()
