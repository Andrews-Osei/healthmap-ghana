"""District-level feature engineering."""
from __future__ import annotations
import numpy as np
import pandas as pd

from .config import REGION_POPULATION_2021, HOSPITAL_TIER


def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dp = np.radians(lat2 - lat1)
    dl = np.radians(lon2 - lon1)
    a = (np.sin(dp / 2) ** 2
         + np.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2)
    return 2 * R * np.arcsin(np.sqrt(a))


def _median_nearest_neighbor_km(lats, lons) -> float:
    n = len(lats)
    if n < 2:
        return np.nan
    lats = np.asarray(lats); lons = np.asarray(lons)
    nn = np.full(n, np.inf)
    for i in range(n):
        d = _haversine_km(lats[i], lons[i], lats, lons)
        d[i] = np.inf
        nn[i] = d.min()
    return float(np.median(nn))


def build_district_features(facilities: pd.DataFrame) -> pd.DataFrame:
    """One row per (region, district) with engineered features."""
    df = facilities.dropna(subset=["adm2_name", "adm1_name"]).copy()
    df["is_hospital_tier"] = df["amenity"].isin(HOSPITAL_TIER)
    df["is_pharmacy"]      = df["amenity"].eq("pharmacy")

    rows = []
    for (region, district), g in df.groupby(["adm1_name", "adm2_name"]):
        hosp_g = g[g["is_hospital_tier"]]
        rows.append({
            "region":              region,
            "district":            district,
            "total_facilities":    len(g),
            "hospitals_clinics":   int(g["is_hospital_tier"].sum()),
            "pharmacies":          int(g["is_pharmacy"].sum()),
            "type_diversity":      int(g["amenity"].nunique()),
            "median_nn_km_hosp":   _median_nearest_neighbor_km(
                                       hosp_g["lat"].values,
                                       hosp_g["lon"].values),
            "lat_centroid":        float(g["lat"].mean()),
            "lon_centroid":        float(g["lon"].mean()),
        })
    out = pd.DataFrame(rows)

    # Per-capita features
    reg_n = out.groupby("region")["district"].count().rename("n_districts")
    out = out.merge(reg_n, left_on="region", right_index=True)
    out["region_population_2021"] = out["region"].map(REGION_POPULATION_2021)
    out["district_pop_proxy"]     = (out["region_population_2021"]
                                     / out["n_districts"])
    out["hosp_per_100k"]          = (out["hospitals_clinics"]
                                     / out["district_pop_proxy"] * 100_000)
    out["pharm_per_100k"]         = (out["pharmacies"]
                                     / out["district_pop_proxy"] * 100_000)
    out["facilities_per_100k"]    = (out["total_facilities"]
                                     / out["district_pop_proxy"] * 100_000)

    # Urban/rural heuristic: above-median per-region pop density proxy
    # (use facility count as a rough urbanisation proxy when no admin pop
    # data is available — to be replaced with worldpop in v2).
    out["is_urban"] = (out["total_facilities"]
                       > out["total_facilities"].median()).astype(int)
    return out
