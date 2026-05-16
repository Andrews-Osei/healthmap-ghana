# HealthMap Ghana — ML pipeline

End-to-end runner: `python -m pipeline.run_all` from the `ml/` folder.

## Stages

### 1. ETL (`pipeline/etl.py`)
- Reads `data/facilities/health_facilities.gpkg` (a SQLite-backed GeoPackage).
- Pure-Python GeoPackage WKB decoder — no GDAL / GeoPandas required.
- Returns a flat DataFrame: 2,484 rows × {id, name, amenity, healthcare,
  adm1_name, adm2_name, lat, lon, ...}.

### 2. Features (`pipeline/features.py`)
For every (region, district):
- `total_facilities`, `hospitals_clinics`, `pharmacies`
- `type_diversity`     — # distinct facility-type labels
- `median_nn_km_hosp`  — median nearest-neighbour distance among
                          hospital-tier facilities (haversine, km)
- `district_pop_proxy` — region 2021 population / # districts in region
- `hosp_per_100k`, `pharm_per_100k`, `facilities_per_100k`
- `is_urban` — heuristic: facility-count above district-median
                (replace with WorldPop in v2)

### 3. Vulnerability scoring (`pipeline/scoring.py`)

```
CVI(d) = 0.30 · -z(hosp_per_100k)
       + 0.20 · -z(pharm_per_100k)
       + 0.15 · -z(type_diversity)
       + 0.20 · +z(median_nn_km_hosp)
       + 0.15 · -z(facilities_per_100k)
```

Where `z(x) = (x - mean) / std`.

The result is rescaled to the 0-100 range. **Higher = more vulnerable**.

### 4. Risk-tier clustering (`pipeline/scoring.py:assign_risk_tiers`)
- K-Means (k=4), pure-NumPy implementation, 10 random initialisations,
  fixed seed (42) for reproducibility.
- Clusters are mapped to human-readable tiers — **Critical Risk, High Risk,
  Moderate Risk, Low Risk** — by ordering on mean CVI within cluster.

Validation: tier distribution on the v1 dataset
(212 districts) ⇒ 59 Critical, 101 High, 31 Moderate, 21 Low.

### 5. Demand forecasting (`pipeline/forecast.py`)

For each district × horizon ∈ {2026, 2030, 2035}:
- Project population: `pop_t = pop_2021 · (1 + g)^(t - 2021)`,
  where `g = 1.9 %` (UN/WB Ghana mid-projection).
- Required facilities: `pop_t / 100,000 · 9` (WHO primary-care benchmark).
- Projected shortfall: `max(0, required - current)`.

### 6. Recommendation engine (`pipeline/recommendations.py`)

Eight rules with deterministic triggers and priority weights:

| ID | Title | Trigger |
|---|---|---|
| `build_phc`               | Build additional PHC centre        | `hosp_per_100k < 1.5` |
| `deploy_chps`             | Deploy new CHPS compound           | `facilities_per_100k < 4 ∧ rural` |
| `mobile_clinic`           | Deploy mobile clinic services      | `median_nn_km_hosp > 15` |
| `pharmacy_expansion`      | Subsidise pharmacy expansion       | `pharm_per_100k < 2` |
| `specialty_diversification` | Add specialist provision         | `type_diversity ≤ 2` |
| `road_accessibility`      | Improve road accessibility         | `nn > 10 ∧ facilities_per_100k ≥ 4` |
| `personnel_allocation`    | Increase healthcare personnel      | `risk_tier ∈ {Critical, High}` |
| `emergency_capability`    | 24/7 emergency response            | `hosp_per_100k < 1 ∧ nn > 20` |

Final priority = `impact × (0.5 + CVI/200)`.
Top-5 returned per district.

## Outputs

Written to `backend/app/data/`:

| File | Shape |
|---|---|
| `districts.json`        | list[212]  |
| `regions.json`          | list[16]   |
| `facilities.json`       | list[2484] |
| `recommendations.json`  | dict[212] -> list[≤5] |
| `forecast.json`         | list[636]  (212 × 3 horizons) |
| `manifest.json`         | dict       |

## Reproducibility

- Single random seed (42).
- Pure NumPy/Pandas — no native dependencies.
- Run logs: every stage prints row counts. CI-friendly.
- Verification spot-check (`ml/tests/test_smoke.py` planned in v1.1):
  re-recompute headline numbers and assert against `manifest.json`.
