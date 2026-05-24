"""Mode router — strictly partitions Patient vs Decision-Maker logic.

Never lets one mode produce output intended for the other.
"""
from __future__ import annotations
from typing import Optional, Dict, Literal

from . import patient, decision_maker

Mode = Literal["patient", "decision_maker"]


def route(mode: Mode,
          query: Optional[str] = None,
          user_lat: Optional[float] = None,
          user_lon: Optional[float] = None,
          user_region: Optional[str] = None,
          filter_region: Optional[str] = None,
          place: Optional[str] = None) -> Dict:
    if mode == "patient":
        if not query:
            return {
                "mode": "patient",
                "error": "Please describe your symptoms.",
            }
        return patient.respond(symptoms=query,
                               user_lat=user_lat, user_lon=user_lon,
                               user_region=user_region, place=place)

    if mode == "decision_maker":
        return decision_maker.respond(query=query,
                                      filter_region=filter_region)

    return {"error": f"Unknown mode '{mode}'. Use 'patient' or 'decision_maker'."}
