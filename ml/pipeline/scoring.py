"""Composite Vulnerability Index + K-Means risk-tier clustering."""
from __future__ import annotations
import numpy as np
import pandas as pd

from .config import CVI_WEIGHTS, TIER_LABELS


def _zscore(s: pd.Series) -> pd.Series:
    mu, sd = s.mean(), s.std(ddof=0)
    if sd == 0 or np.isnan(sd):
        return pd.Series(np.zeros(len(s)), index=s.index)
    return (s - mu) / sd


def composite_vulnerability_index(d: pd.DataFrame) -> pd.DataFrame:
    """Adds CVI_raw and CVI_0_100 columns. Higher = more vulnerable."""
    d = d.copy()
    nn = d["median_nn_km_hosp"].fillna(d["median_nn_km_hosp"].max())
    cvi = (
        CVI_WEIGHTS["hosp_per_100k"]       * -_zscore(d["hosp_per_100k"])
        + CVI_WEIGHTS["pharm_per_100k"]      * -_zscore(d["pharm_per_100k"])
        + CVI_WEIGHTS["type_diversity"]      * -_zscore(d["type_diversity"])
        + CVI_WEIGHTS["median_nn_km_hosp"]   * +_zscore(nn)
        + CVI_WEIGHTS["facilities_per_100k"] * -_zscore(d["facilities_per_100k"])
    )
    d["CVI_raw"] = cvi.values
    lo, hi = cvi.min(), cvi.max()
    d["CVI_0_100"] = ((cvi - lo) / (hi - lo) * 100).round(2).values
    return d


def _kmeans(X: np.ndarray, k: int = 4, n_init: int = 10,
            max_iter: int = 200, seed: int = 42):
    rng = np.random.default_rng(seed)
    best_inertia, best_labels, best_centers = np.inf, None, None
    for _ in range(n_init):
        idx = rng.choice(len(X), size=k, replace=False)
        C = X[idx].copy()
        for _ in range(max_iter):
            d2 = ((X[:, None, :] - C[None, :, :]) ** 2).sum(-1)
            lbl = d2.argmin(1)
            new_C = np.vstack([
                X[lbl == j].mean(0) if (lbl == j).any() else C[j]
                for j in range(k)
            ])
            if np.allclose(new_C, C):
                break
            C = new_C
        inertia = ((X - C[lbl]) ** 2).sum()
        if inertia < best_inertia:
            best_inertia, best_labels, best_centers = inertia, lbl, C
    return best_labels, best_centers, best_inertia


def assign_risk_tiers(d: pd.DataFrame) -> pd.DataFrame:
    """K-Means (k=4) -> human-readable tiers ordered by mean CVI."""
    feats = ["hosp_per_100k", "pharm_per_100k", "type_diversity",
             "median_nn_km_hosp", "facilities_per_100k"]
    X = d[feats].copy()
    X["median_nn_km_hosp"] = X["median_nn_km_hosp"].fillna(
        X["median_nn_km_hosp"].max())
    Xz = (X - X.mean()) / X.std(ddof=0).replace(0, 1)
    labels, _, _ = _kmeans(Xz.values, k=len(TIER_LABELS))
    d = d.copy()
    d["_cluster"] = labels
    order = (d.groupby("_cluster")["CVI_raw"].mean()
                .sort_values(ascending=False).index.tolist())
    tier_map = {c: TIER_LABELS[i] for i, c in enumerate(order)}
    d["risk_tier"] = d["_cluster"].map(tier_map)
    return d.drop(columns=["_cluster"])
