"""Geospatial reasoner — rank facilities by severity-appropriate tier, then proximity.

The patient assistant calls this after the symptom engine decides which
facility tier the situation needs. We then return the top-N facilities,
ordered by a composite suitability score that combines:

  - tier match     (the triage-appropriate tier dominates: a pharmacy leads
                    for minor issues, a hospital leads for emergencies)
  - distance       (CONTINUOUS — strictly closer ranks strictly higher, so the
                    genuinely nearest appropriate facility is always #1)
  - facility named (named facility > "Unnamed") — proxy for completeness
  - conventional   (herbal / spiritual "clinics" are gently de-prioritised —
                    this is a medical-triage tool)
"""
from __future__ import annotations
import math
from typing import List, Optional

from ..data_loader import facilities


# Continuous distance score (km -> 0..1). Smooth exponential decay means two
# facilities even 0.1 km apart get distinct scores, so the nearer one always
# wins ties. ~1.0 at 0 km, 0.78 at 1 km, 0.61 at 2 km, 0.29 at 5 km, 0.08 at 10 km.
def _proximity_score(km: float) -> float:
    return math.exp(-km / 4.0)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = (math.sin(dp / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(a))


# Care hierarchy from highest-acuity to lowest — used for "adjacent tier" scoring
_HIERARCHY = ["hospital", "clinic", "health_post", "doctors",
              "dentist", "pharmacy", "CHPs"]

# Names that signal non-conventional care — down-weighted for medical triage
_ALT_MED = ("herbal", "traditional", "spiritual", "prayer", "faith", "shrine")


def _tier_match_score(facility_amenity: str,
                      preferred_tiers: List[str]) -> float:
    """Steep tier scoring so the severity-appropriate tier wins decisively.

    exact preferred tier  -> 1.0
    other preferred tier  -> 0.8
    adjacent in hierarchy  -> 0.5 (gap 1), 0.3 (gap 2) ...
    unrelated              -> 0.25
    """
    if not preferred_tiers:
        return 0.5
    if facility_amenity == preferred_tiers[0]:
        return 1.0
    if facility_amenity in preferred_tiers:
        return 0.8
    if facility_amenity in _HIERARCHY and preferred_tiers[0] in _HIERARCHY:
        gap = abs(_HIERARCHY.index(facility_amenity)
                  - _HIERARCHY.index(preferred_tiers[0]))
        return max(0.2, 0.7 - 0.2 * gap)
    return 0.25


def rank_facilities(user_lat: Optional[float],
                    user_lon: Optional[float],
                    preferred_tiers: List[str],
                    user_region: Optional[str] = None,
                    top_n: int = 5) -> List[dict]:
    """Return the top-N facilities suited to the patient.

    Ordering: severity-appropriate tier first, then strictly nearest.
    If user_lat/lon are missing, falls back to region filter (tier only).
    """
    facs = facilities()
    if user_region and not user_lat:
        facs = [f for f in facs
                if (f.get("region") or "").lower() == user_region.lower()]

    scored = []
    for f in facs:
        tier = _tier_match_score(f.get("amenity") or "", preferred_tiers)
        if user_lat is not None and user_lon is not None:
            d = _haversine_km(user_lat, user_lon, f["lat"], f["lon"])
            prox = _proximity_score(d)
        else:
            d = None
            prox = 0.5
        name = (f.get("name") or "").strip()
        named = 1.0 if name else 0.6

        suit = 0.55 * tier + 0.35 * prox + 0.10 * named
        # Down-weight non-conventional care for a medical-triage recommendation
        if name and any(k in name.lower() for k in _ALT_MED):
            suit *= 0.80

        scored.append({
            "id":          f["id"],
            "name":        name or "Unnamed facility",
            "amenity":     f.get("amenity"),
            "region":      f.get("region"),
            "district":    f.get("district"),
            "lat":         f["lat"],
            "lon":         f["lon"],
            "distance_km": round(d, 2) if d is not None else None,
            "suitability": round(suit, 3),
        })

    # Primary: higher suitability. Tiebreaker: strictly nearer first.
    scored.sort(key=lambda x: (
        -x["suitability"],
        x["distance_km"] if x["distance_km"] is not None else 1e9,
    ))
    return scored[:top_n]


def navigation_url(from_lat: Optional[float], from_lon: Optional[float],
                   to_lat: float, to_lon: float) -> str:
    """Return an OpenStreetMap directions URL — no API key, always works."""
    if from_lat is None or from_lon is None:
        return (f"https://www.openstreetmap.org/?mlat={to_lat}&mlon={to_lon}"
                f"#map=15/{to_lat}/{to_lon}")
    return ("https://www.openstreetmap.org/directions?from="
            f"{from_lat},{from_lon}&to={to_lat},{to_lon}")


def resolve_place(place: Optional[str],
                  region: Optional[str]) -> Optional[dict]:
    """Resolve a typed town/city (and/or region) to a search coordinate,
    using the facility dataset itself as a gazetteer — no external geocoder.

    Strategy:
      1. If a town/city is typed, match it against facility names and district
         names (optionally within the chosen region) and use the centroid of
         the matches.
      2. Otherwise (or if no match) fall back to the centroid of the region.
    Returns {lat, lon, label, source, matched} or None.
    """
    facs = facilities()
    if region:
        facs = [f for f in facs
                if (f.get("region") or "").lower() == region.lower()]

    q = (place or "").strip().lower()
    if len(q) >= 2:
        matches = [f for f in facs
                   if q in (f.get("name") or "").lower()
                   or q in (f.get("district") or "").lower()]
        if matches:
            lat = sum(f["lat"] for f in matches) / len(matches)
            lon = sum(f["lon"] for f in matches) / len(matches)
            return {"lat": round(lat, 5), "lon": round(lon, 5),
                    "label": (place or "").strip().title(),
                    "source": "town", "matched": len(matches),
                    "region": region}

    if region and facs:
        lat = sum(f["lat"] for f in facs) / len(facs)
        lon = sum(f["lon"] for f in facs) / len(facs)
        return {"lat": round(lat, 5), "lon": round(lon, 5),
                "label": region, "source": "region",
                "matched": len(facs), "region": region}

    return None
