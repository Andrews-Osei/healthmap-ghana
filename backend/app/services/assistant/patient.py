"""Patient assistant — symptom interpretation + facility recommendations.

Pipeline:
  1. Rule-based triage  -> deterministic urgency + facility tier
  2. Geo reasoner       -> ranked facilities with directions (map-aware)
  3. LLM narrative      -> conversational explanation (if a provider is set)
  4. Strict patient-only output (no admin/system data ever leaks)
"""
from __future__ import annotations
from typing import Optional, Dict

from .symptom_engine import triage
from .geo_reasoner import rank_facilities, navigation_url, resolve_place
from .llm import get_client, PATIENT_SYSTEM


GHANA_EMERGENCY_NUMBERS = {
    "Ambulance":         "112 / 193",
    "Police":            "191",
    "Fire":              "192",
    "Domestic violence": "1900",
}


def _facility_locator(facilities) -> Dict:
    """Compact, map-oriented summary of where care is — patient-safe."""
    if not facilities:
        return {"nearest": None, "count": 0, "others": []}
    top = facilities[0]
    return {
        "count": len(facilities),
        "nearest": {
            "name":     top.get("name"),
            "type":     top.get("amenity"),
            "district": top.get("district"),
            "region":   top.get("region"),
            "distance_km": top.get("distance_km"),
            "lat":      top.get("lat"),
            "lon":      top.get("lon"),
            "directions_url": top.get("navigation_url"),
        },
        "others": [
            {"name": f.get("name"), "type": f.get("amenity"),
             "district": f.get("district"),
             "distance_km": f.get("distance_km")}
            for f in facilities[1:3]
        ],
    }


def _build_llm_context(triage_res, facilities, symptoms: str,
                       user_region: Optional[str]) -> str:
    top = facilities[0] if facilities else None
    region_note = (f"User is in {user_region}." if user_region
                   else "User location not provided.")

    if top:
        dist = (f", about {top['distance_km']} km away"
                if top.get("distance_km") is not None else "")
        loc  = f" in {top['district']}" if top.get("district") else ""
        top_note = (f"Nearest suitable facility on their map: {top['name']} "
                    f"({top['amenity']}{loc}){dist}. "
                    f"Tap-for-directions is available in the app.")
    else:
        top_note = "No facilities matched their area."

    others = facilities[1:3]
    other_note = ("Other nearby options: "
                  + "; ".join(f"{f['name']} ({f['amenity']})" for f in others)
                  + ".") if others else ""

    return (
        f"User reported these symptoms: \"{symptoms}\"\n"
        f"Triage urgency: {triage_res.urgency.upper()}.\n"
        f"Triggered signals: {', '.join(triage_res.matched) or 'none'}.\n"
        f"Plain summary: {triage_res.plain_summary}\n"
        f"{region_note}\n"
        f"{top_note}\n"
        f"{other_note}\n\n"
        f"Write one short, calm paragraph (under 120 words) explaining what "
        f"this likely means and what they should do next. You may mention the "
        f"nearest facility by name and that directions are available on their "
        f"map, but do NOT repeat the whole facility list."
    )


def respond(symptoms: str,
            user_lat: Optional[float] = None,
            user_lon: Optional[float] = None,
            user_region: Optional[str] = None,
            place: Optional[str] = None) -> Dict:
    # Resolve where to search from: GPS coords win; else a typed town/region.
    search_location = None
    search_note = None
    if user_lat is not None and user_lon is not None:
        search_location = {"lat": user_lat, "lon": user_lon,
                           "label": "Your location", "source": "gps"}
    elif place or user_region:
        loc = resolve_place(place, user_region)
        if loc:
            user_lat, user_lon = loc["lat"], loc["lon"]
            search_location = loc
        elif place:
            search_note = (f"Could not locate \"{place}\". "
                           f"Try selecting a region as well.")

    t = triage(symptoms)
    facs = rank_facilities(user_lat, user_lon,
                           preferred_tiers=t.facility_types,
                           user_region=user_region,
                           top_n=5)
    for f in facs:
        f["navigation_url"] = navigation_url(user_lat, user_lon,
                                             f["lat"], f["lon"])

    # LLM narrative — gracefully degrades if no provider/key is configured
    llm = get_client()
    narrative = None
    if llm.is_available():
        narrative = llm.chat(
            system_prompt=PATIENT_SYSTEM,
            user_message=_build_llm_context(t, facs, symptoms, user_region),
            max_tokens=512, temperature=0.3,
        )
    narrative_source = "llm" if narrative else "rule_based"

    out = {
        "mode":             "patient",
        "urgency":          t.urgency,
        "narrative":        narrative or t.plain_summary,
        "narrative_source": narrative_source,
        "llm_model":        llm.model if narrative else None,
        "summary":          t.plain_summary,
        "what_to_do_now":   t.immediate_action,
        "recommended_facilities": facs,
        "map_locator":      _facility_locator(facs),
        "search_location":  search_location,
        "search_note":      search_note,
        "safety_notes":     t.safety_notes,
        "matched_signals":  t.matched,
        "disclaimer": (
            "HealthMap Ghana provides triage guidance only and is not a "
            "substitute for a qualified clinician. If in doubt, seek care."),
    }
    if t.urgency == "emergency":
        out["emergency_numbers"] = GHANA_EMERGENCY_NUMBERS
    return out
