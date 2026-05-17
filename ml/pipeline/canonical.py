"""Canonical district registry.

The geoBoundaries ADM2 GeoJSON in `data/geo/ghana_adm2.geojson` is the
authoritative list of Ghanaian districts (currently 261). Every pipeline
run reconciles the scored set against this canonical list so that:

  * any district present in OSM but missing from canonical is flagged
  * any canonical district missing from OSM is BACKFILLED as
    `data_status = "no_data_yet"` — visible in the API, ranking it as
    pending, ready to be auto-populated when OSM coverage improves.

This makes the platform future-proof: rerun the pipeline next month and
newly-mapped districts seamlessly transition from "no_data_yet" to a real
score with no code changes.
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import List, Dict, Optional

from .config import DATA_DIR

GEOJSON = DATA_DIR / "geo" / "ghana_adm2.geojson"

# Region name lookups for the canonical layer.  geoBoundaries doesn't carry
# adm1 names on adm2 features, so we use a small lookup based on first-letter
# of the district pcode (e.g. "GH07..." -> Greater Accra) maintained here.
_PCODE_PREFIX_TO_REGION = {
    "GH01": "Western",
    "GH02": "Central",
    "GH03": "Greater Accra",
    "GH04": "Volta",
    "GH05": "Eastern",
    "GH06": "Ashanti",
    "GH07": "Western North",
    "GH08": "Ahafo",
    "GH09": "Bono",
    "GH10": "Bono East",
    "GH11": "Oti",
    "GH12": "Northern",
    "GH13": "Savannah",
    "GH14": "Northern East",
    "GH15": "Upper East",
    "GH16": "Upper West",
}


def _norm(name: str) -> str:
    return "".join(c for c in name.lower() if c.isalnum())


def load_canonical_districts() -> List[Dict]:
    """Return one dict per canonical district from the geoBoundaries file.

    Each dict: { canonical_name, region (best-effort), pcode (if present) }
    If the file is missing, returns []  and the pipeline continues with only
    the OSM-derived 212 districts (graceful degradation).
    """
    if not GEOJSON.exists():
        print(f"  [canonical] {GEOJSON} not found - skipping backfill.")
        return []

    gj = json.loads(GEOJSON.read_text(encoding="utf-8"))
    out: List[Dict] = []
    for feat in gj.get("features", []):
        p = feat.get("properties", {}) or {}
        name = (p.get("shapeName") or p.get("NAME_2") or p.get("name")
                or p.get("adm2_name") or p.get("ADM2_EN"))
        if not name:
            continue
        pcode = p.get("shapeID") or p.get("pcode") or p.get("ADM2_PCODE") or ""
        region: Optional[str] = None
        for prefix, rname in _PCODE_PREFIX_TO_REGION.items():
            if str(pcode).startswith(prefix):
                region = rname
                break
        out.append({
            "canonical_name": name,
            "region":         region,
            "pcode":          pcode,
        })
    print(f"  [canonical] {len(out)} districts in canonical registry.")
    return out


def reconcile(scored_districts, canonical_districts):
    """Compare the scored set against canonical. Return three lists:

      matched_names    -- canonical names that ALSO exist in scored set
      missing_canonical -- canonical districts NOT in scored set (need backfill)
      orphaned_scored   -- scored districts NOT in canonical (OSM-only)
    """
    scored_index = {_norm(d["district"]): d for d in scored_districts}
    canonical_index = {_norm(c["canonical_name"]): c
                       for c in canonical_districts}

    matched   = [c for c in canonical_districts
                 if _norm(c["canonical_name"]) in scored_index]
    missing   = [c for c in canonical_districts
                 if _norm(c["canonical_name"]) not in scored_index]
    orphaned  = [d for d in scored_districts
                 if _norm(d["district"]) not in canonical_index]
    return matched, missing, orphaned


def build_pending_stub(canonical: Dict) -> Dict:
    """Build a 'no_data_yet' district record matching the scored schema."""
    name = canonical["canonical_name"]
    region = canonical.get("region") or "Unknown"
    return {
        "district_id":       f"{region.replace(' ', '_')}__{name.replace(' ', '_')}",
        "district":          name,
        "region":            region,
        "rank":              None,
        "CVI_0_100":         None,
        "risk_tier":         "No Data Yet",
        "total_facilities":  0,
        "hospitals_clinics": 0,
        "pharmacies":        0,
        "type_diversity":    0,
        "median_nn_km_hosp": None,
        "hosp_per_100k":     0.0,
        "pharm_per_100k":    0.0,
        "facilities_per_100k": 0.0,
        "district_pop_proxy":  0,
        "region_population_2021": 0,
        "is_urban":          0,
        "lat_centroid":      0.0,
        "lon_centroid":      0.0,
        "data_status":       "no_data_yet",
    }
