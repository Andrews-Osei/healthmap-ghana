"""End-to-end pipeline runner with canonical district backfill.

Outputs (into backend/app/data/):

    districts.json          all canonical districts (scored + no_data_yet)
    regions.json            region-level rollup
    facilities.json         all facilities (slim, frontend-ready)
    recommendations.json    {region::district: [ {title, rationale, priority} ]}
    forecast.json           per-district projections for 2026, 2030, 2035
    manifest.json           dataset metadata + coverage + version
    coverage_history.json   append-only log of coverage % per pipeline run
"""
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from .config import BACKEND_DATA_DIR, OUT_DIR, GPKG_PATH
from .etl import load_facilities
from .features import build_district_features
from .scoring import composite_vulnerability_index, assign_risk_tiers
from .forecast import build_forecast_table
from .recommendations import generate_all
from .canonical import load_canonical_districts, reconcile, build_pending_stub


PIPELINE_VERSION = "1.1.0"        # bump on schema changes
COVERAGE_LOG = BACKEND_DATA_DIR / "coverage_history.json"


def _write_json(path: Path, payload):
    path.write_text(json.dumps(payload, default=float, indent=2))
    print(f"  -> {path.relative_to(BACKEND_DATA_DIR.parent.parent)}")


def _append_coverage(payload: dict):
    """Append-only history of how coverage evolves over pipeline runs."""
    history = []
    if COVERAGE_LOG.exists():
        try:
            history = json.loads(COVERAGE_LOG.read_text())
        except Exception:
            history = []
    history.append(payload)
    COVERAGE_LOG.write_text(json.dumps(history, default=float, indent=2))


def main() -> None:
    print(f"HealthMap Ghana ML pipeline v{PIPELINE_VERSION} "
          f"(gpkg={GPKG_PATH.name})")

    print("[1/7] ETL ...")
    facilities = load_facilities()
    print(f"      {len(facilities):,} facilities loaded")

    print("[2/7] Features ...")
    districts = build_district_features(facilities)
    print(f"      {len(districts):,} OSM-derived districts")

    print("[3/7] Vulnerability score ...")
    districts = composite_vulnerability_index(districts)

    print("[4/7] Risk-tier clustering ...")
    districts = assign_risk_tiers(districts)
    districts = districts.sort_values("CVI_0_100",
                                      ascending=False).reset_index(drop=True)
    districts["rank"]        = districts.index + 1
    districts["data_status"] = "scored"

    # Stable district_id
    districts["district_id"] = (districts["region"].str.replace(" ", "_") + "__"
                                + districts["district"].str.replace(" ", "_"))

    scored_records = districts.to_dict("records")

    print("[5/7] Canonical reconciliation ...")
    canonical = load_canonical_districts()
    matched, missing, orphaned = reconcile(scored_records, canonical)
    print(f"      canonical: {len(canonical)}  "
          f"matched: {len(matched)}  "
          f"backfill (no_data_yet): {len(missing)}  "
          f"orphaned-from-OSM: {len(orphaned)}")

    pending_records = [build_pending_stub(c) for c in missing]
    all_districts = scored_records + pending_records

    print("[6/7] Forecasting + AI recommendations ...")
    forecast = build_forecast_table(districts)        # scored only
    recs     = generate_all(districts)                # scored only

    # ---- emit JSON artefacts --------------------------------------------
    print("[7/7] Writing JSON artefacts ...")
    _write_json(BACKEND_DATA_DIR / "districts.json", all_districts)

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

    # Add "districts awaiting data" count per region for transparency
    if pending_records:
        pending_by_region = (pd.DataFrame(pending_records)
                               .groupby("region").size()
                               .rename("pending_no_data"))
        region_summary = region_summary.merge(
            pending_by_region, left_on="region", right_index=True, how="left")
        region_summary["pending_no_data"] = (
            region_summary["pending_no_data"].fillna(0).astype(int))
    else:
        region_summary["pending_no_data"] = 0

    _write_json(BACKEND_DATA_DIR / "regions.json",
                region_summary.to_dict("records"))

    fac_slim = facilities[["id", "name", "amenity", "healthcare",
                           "adm1_name", "adm2_name", "lat", "lon"]].copy()
    fac_slim = fac_slim.rename(columns={"adm1_name": "region",
                                        "adm2_name": "district"})
    _write_json(BACKEND_DATA_DIR / "facilities.json",
                fac_slim.to_dict("records"))

    _write_json(BACKEND_DATA_DIR / "recommendations.json", recs)
    _write_json(BACKEND_DATA_DIR / "forecast.json",
                forecast.to_dict("records"))

    canonical_total = max(len(canonical), len(all_districts))
    coverage_pct = round(100 * len(scored_records) / canonical_total, 2) \
                   if canonical_total else 100.0

    manifest = {
        "pipeline_version":  PIPELINE_VERSION,
        "generated_at":      datetime.now(timezone.utc).isoformat(),
        "facility_count":    int(len(facilities)),
        "district_count":    int(len(all_districts)),
        "district_count_scored":      int(len(scored_records)),
        "district_count_no_data_yet": int(len(pending_records)),
        "district_count_canonical":   int(len(canonical)),
        "coverage_pct":      coverage_pct,
        "region_count":      int(districts["region"].nunique()),
        "tier_counts":       districts["risk_tier"].value_counts().to_dict(),
        "orphaned_districts": [d["district"] for d in orphaned],
        "weights":           {"see": "ml/pipeline/config.py"},
        "data_sources":      {
            "facilities":  "OSM Ghana Health Facilities (HOTOSM, ODbL)",
            "population":  "Ghana 2021 PHC (GSS)",
            "boundaries":  "geoBoundaries Ghana ADM2 (CC-BY)",
        },
    }
    _write_json(BACKEND_DATA_DIR / "manifest.json", manifest)

    # Append to coverage history so we can chart progress over months
    _append_coverage({
        "ts":               manifest["generated_at"],
        "pipeline_version": PIPELINE_VERSION,
        "scored":           len(scored_records),
        "no_data_yet":      len(pending_records),
        "canonical":        len(canonical),
        "coverage_pct":     coverage_pct,
        "facilities":       int(len(facilities)),
    })
    print(f"  -> coverage_history.json (appended; "
          f"now {len(json.loads(COVERAGE_LOG.read_text()))} entries)")

    print()
    print(f"Coverage: {coverage_pct}% "
          f"({len(scored_records)} scored / {canonical_total} canonical)")
    print("Tier distribution (scored only):")
    print(districts["risk_tier"].value_counts().to_string())
    if pending_records:
        print(f"\n{len(pending_records)} districts awaiting OSM data — "
              f"they appear with data_status='no_data_yet'.")


if __name__ == "__main__":
    main()
