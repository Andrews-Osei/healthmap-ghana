"""Demand forecasting — project facility shortfalls under population growth."""
from __future__ import annotations
import numpy as np
import pandas as pd

from .config import ANNUAL_GROWTH_RATE, BASE_YEAR

WHO_MIN_FACILITIES_PER_100K = 9.0   # WHO minimum primary-care benchmark


def project_population(base_pop: float, target_year: int,
                       growth: float = ANNUAL_GROWTH_RATE) -> float:
    years = target_year - BASE_YEAR
    return base_pop * (1.0 + growth) ** years


def build_forecast_table(districts: pd.DataFrame,
                         horizons=(2026, 2030, 2035)) -> pd.DataFrame:
    """For each district + year produce projected population & shortfall."""
    rows = []
    for _, row in districts.iterrows():
        pop_base = row["district_pop_proxy"]
        for year in horizons:
            pop = project_population(pop_base, year)
            required = pop / 100_000 * WHO_MIN_FACILITIES_PER_100K
            shortfall = max(0.0, required - row["total_facilities"])
            rows.append({
                "district":          row["district"],
                "region":            row["region"],
                "year":              year,
                "projected_pop":     round(pop),
                "current_facilities":row["total_facilities"],
                "required_facilities": round(required, 1),
                "projected_shortfall": round(shortfall, 1),
            })
    return pd.DataFrame(rows)
