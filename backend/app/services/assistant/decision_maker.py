"""Decision-maker assistant — aggregate insights + policy guidance.

Pipeline:
  1. Pull pre-computed analytics (districts, regions, manifest)
  2. Build structured response (key insights, top underserved, gaps,
     coverage, geographic context, policy recommendations)
  3. LLM narrative summary (if a provider is set)
  4. Strict admin-only output (never patient triage data)
"""
from __future__ import annotations
from typing import Dict, Optional, List
from collections import Counter

from ..data_loader import districts, regions, manifest
from .llm import get_client, DECISION_SYSTEM


def _insights(filter_region: Optional[str]) -> List[str]:
    m  = manifest()
    ds = districts()
    rs = regions()
    if filter_region:
        ds = [d for d in ds if d["region"] == filter_region]
        rs = [r for r in rs if r["region"] == filter_region]

    scored  = [d for d in ds if d.get("data_status") == "scored"]
    pending = [d for d in ds if d.get("data_status") == "no_data_yet"]

    out = [
        f"{len(ds)} districts in scope ({len(scored)} scored, "
        f"{len(pending)} awaiting OSM coverage).",
        f"{m['facility_count']:,} facilities mapped across "
        f"{m['region_count']} regions.",
    ]
    if rs:
        rs_sorted = sorted(rs, key=lambda r: r["mean_CVI"], reverse=True)
        worst, best = rs_sorted[0], rs_sorted[-1]
        gap = best["mean_facilities_per_100k"] / max(
            0.001, worst["mean_facilities_per_100k"])
        out.append(
            f"Inequality: {best['region']} averages "
            f"{best['mean_facilities_per_100k']:.1f} facilities per 100k vs "
            f"{worst['region']} at {worst['mean_facilities_per_100k']:.1f} "
            f"(ratio {gap:.1f}x).")
        out.append(
            f"Highest-vulnerability region by mean CVI: {worst['region']} "
            f"({worst['mean_CVI']:.1f}).")
    return out


def _top_underserved(filter_region: Optional[str], n: int = 10) -> List[dict]:
    ds = [d for d in districts() if d.get("data_status") == "scored"]
    if filter_region:
        ds = [d for d in ds if d["region"] == filter_region]
    ds.sort(key=lambda d: d.get("CVI_0_100") or 0, reverse=True)
    return [{
        "rank":      d["rank"],
        "district":  d["district"],
        "region":    d["region"],
        "CVI":       d["CVI_0_100"],
        "tier":      d["risk_tier"],
        "facilities_per_100k": d["facilities_per_100k"],
        "hospitals_clinics":   d["hospitals_clinics"],
        "lat":       d.get("lat_centroid"),
        "lon":       d.get("lon_centroid"),
    } for d in ds[:n]]


def _resource_gaps(filter_region: Optional[str]) -> List[str]:
    ds = [d for d in districts() if d.get("data_status") == "scored"]
    if filter_region:
        ds = [d for d in ds if d["region"] == filter_region]
    zero_hospital = [d for d in ds if d["hospitals_clinics"] == 0]
    low_pharm     = [d for d in ds if d["pharm_per_100k"] < 1.0]
    sparse        = [d for d in ds
                     if (d.get("median_nn_km_hosp") or 0) > 20]
    return [
        f"{len(zero_hospital)} districts have zero mapped hospital-tier "
        f"facility (e.g. {', '.join(d['district'] for d in zero_hospital[:3])}).",
        f"{len(low_pharm)} districts have pharmacy supply below 1 per 100k.",
        f"{len(sparse)} districts have median inter-facility distance > 20 km "
        f"- mobile clinics likely needed.",
    ]


def _coverage_analysis(filter_region: Optional[str]) -> Dict:
    ds = districts()
    if filter_region:
        ds = [d for d in ds if d["region"] == filter_region]
    pending = [d for d in ds if d.get("data_status") == "no_data_yet"]
    return {
        "total_districts":    len(ds),
        "scored":             len(ds) - len(pending),
        "awaiting_data":      len(pending),
        "coverage_pct":       round(100 * (len(ds) - len(pending))
                                    / max(1, len(ds)), 1),
        "districts_awaiting": [d["district"] for d in pending[:10]],
    }


def _band(lat: Optional[float]) -> str:
    """Rough north-south band for Ghana (lat ~4.7 south to ~11.2 north)."""
    if lat is None:
        return "Unknown"
    if lat >= 8.5:
        return "Northern belt"
    if lat >= 6.5:
        return "Middle belt"
    return "Southern belt"


def _geographic_context(filter_region: Optional[str]) -> Dict:
    """Where on the map the worst gaps sit — feeds map-aware narrative."""
    ds = [d for d in districts() if d.get("data_status") == "scored"]
    if filter_region:
        ds = [d for d in ds if d["region"] == filter_region]

    critical = [d for d in ds if d["risk_tier"] == "Critical Risk"]
    crit_region = Counter(d["region"] for d in critical)
    crit_band   = Counter(_band(d.get("lat_centroid")) for d in critical)

    isolated = sorted(
        (d for d in ds if (d.get("median_nn_km_hosp") or 0) > 20),
        key=lambda d: d.get("median_nn_km_hosp") or 0, reverse=True)[:5]

    # Centroid of the critical cluster (a single point to "look at" on the map)
    lats = [d["lat_centroid"] for d in critical if d.get("lat_centroid")]
    lons = [d["lon_centroid"] for d in critical if d.get("lon_centroid")]
    cluster_center = (
        {"lat": round(sum(lats) / len(lats), 4),
         "lon": round(sum(lons) / len(lons), 4)}
        if lats and lons else None)

    return {
        "critical_by_band":   dict(crit_band.most_common()),
        "critical_by_region": dict(crit_region.most_common(5)),
        "critical_cluster_center": cluster_center,
        "most_isolated": [
            {"district": d["district"], "region": d["region"],
             "median_nn_km_hosp": d.get("median_nn_km_hosp"),
             "lat": d.get("lat_centroid"), "lon": d.get("lon_centroid")}
            for d in isolated
        ],
    }


def _policy_recommendations(filter_region: Optional[str]) -> List[Dict]:
    ds = [d for d in districts() if d.get("data_status") == "scored"]
    if filter_region:
        ds = [d for d in ds if d["region"] == filter_region]
    critical = [d for d in ds if d["risk_tier"] == "Critical Risk"]
    high     = [d for d in ds if d["risk_tier"] == "High Risk"]
    recs = []
    if critical:
        recs.append({
            "priority": "P0",
            "title":    "Build primary-care facilities in Critical-Risk districts",
            "rationale": f"{len(critical)} districts scored Critical Risk; "
                         f"prioritise CHPS compounds for the worst {min(5, len(critical))}.",
            "targets":   [d["district"] for d in critical[:5]],
        })
    if high:
        recs.append({
            "priority": "P1",
            "title":    "Deploy mobile clinic circuits to High-Risk districts",
            "rationale": f"{len(high)} districts in High Risk. Mobile units can "
                         f"stabilise access while permanent facilities are built.",
            "targets":   [d["district"] for d in high[:5]],
        })
    sparse = sorted((d for d in ds if (d.get("median_nn_km_hosp") or 0) > 20),
                    key=lambda d: d.get("median_nn_km_hosp") or 0, reverse=True)
    if sparse:
        recs.append({
            "priority": "P2",
            "title":    "Improve road accessibility to existing facilities",
            "rationale": f"{len(sparse)} districts with median nearest-facility "
                         f"distance over 20 km - feeder-road investment multiplies "
                         f"effective reach.",
            "targets":   [d["district"] for d in sparse[:5]],
        })
    recs.append({
        "priority": "P3",
        "title":    "Increase healthcare-personnel allocation",
        "rationale": "Even where infrastructure exists, supply-only metrics "
                     "underestimate gaps. Pair facility expansion with workforce "
                     "deployment to the same districts.",
        "targets":   [d["district"] for d in (critical + high)[:5]],
    })
    return recs


def _build_llm_context(scope: str, insights: List[str], top_underserved: List[dict],
                       gaps: List[str], coverage: Dict, geo: Dict, recs: List[Dict],
                       user_query: Optional[str]) -> str:
    bullets = "\n".join(f"- {x}" for x in insights)
    top3    = "; ".join(f"{d['district']} ({d['region']}, CVI {d['CVI']:.1f})"
                        for d in top_underserved[:3])
    gap_lines = "\n".join(f"- {g}" for g in gaps)
    rec_lines = "\n".join(f"- [{r['priority']}] {r['title']}" for r in recs)
    qs = f"\nUser question: \"{user_query}\"\n" if user_query else "\n"

    band_line = ", ".join(f"{k}: {v}" for k, v in geo["critical_by_band"].items()) \
                or "n/a"
    region_line = ", ".join(f"{k} ({v})"
                            for k, v in geo["critical_by_region"].items()) or "n/a"
    iso_line = "; ".join(
        f"{d['district']} ({d['region']}, {d['median_nn_km_hosp']:.0f} km)"
        for d in geo["most_isolated"] if d.get("median_nn_km_hosp")) or "n/a"

    return (
        f"Scope: {scope}\n"
        f"Coverage: {coverage['coverage_pct']}% "
        f"({coverage['scored']}/{coverage['total_districts']} districts scored)"
        f"{qs}"
        f"Key insights:\n{bullets}\n\n"
        f"Top 3 most underserved: {top3}\n\n"
        f"Geographic pattern of Critical-Risk districts:\n"
        f"- By band (north/middle/south): {band_line}\n"
        f"- By region: {region_line}\n"
        f"- Most isolated (median >20 km to nearest facility): {iso_line}\n\n"
        f"Resource gaps:\n{gap_lines}\n\n"
        f"Recommended actions:\n{rec_lines}\n\n"
        f"Write a brief executive summary (2-3 paragraphs, under 170 words). "
        f"Describe WHERE on the map the gaps cluster (which belt/regions), "
        f"cite specific districts and numbers, then name the single most "
        f"pressing policy action."
    )


def respond(query: Optional[str] = None,
            filter_region: Optional[str] = None) -> Dict:
    scope = filter_region or "national"
    insights = _insights(filter_region)
    top      = _top_underserved(filter_region, n=10)
    gaps     = _resource_gaps(filter_region)
    cov      = _coverage_analysis(filter_region)
    geo      = _geographic_context(filter_region)
    recs     = _policy_recommendations(filter_region)

    llm = get_client()
    narrative = None
    if llm.is_available():
        narrative = llm.chat(
            system_prompt=DECISION_SYSTEM,
            user_message=_build_llm_context(scope, insights, top, gaps,
                                            cov, geo, recs, query),
            max_tokens=768, temperature=0.3,
        )
    narrative_source = "llm" if narrative else "rule_based"

    return {
        "mode":                  "decision_maker",
        "scope":                 scope,
        "narrative":             narrative,
        "narrative_source":      narrative_source,
        "llm_model":             llm.model if narrative else None,
        "key_insights":          insights,
        "top_underserved":       top,
        "resource_gaps":         gaps,
        "coverage_analysis":     cov,
        "geographic_context":    geo,
        "policy_recommendations": recs,
        "disclaimer": (
            "Analytics derived from OSM, Ghana 2021 PHC, and geoBoundaries. "
            "Validate against Ministry of Health and Ghana Health Service "
            "records before acting on individual recommendations."),
    }
