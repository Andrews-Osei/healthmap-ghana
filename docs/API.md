# HealthMap Ghana — API reference

Base URL: `http://localhost:8000`
All resource endpoints live under `/api/v1`. Auto-generated interactive
docs at **`/docs`** (Swagger UI) and **`/redoc`**. The OpenAPI spec is at
`/openapi.json`.

---

## Health & metadata

### `GET /health`
Liveness probe.
```json
{ "status": "ok" }
```

### `GET /api/v1/manifest`
Dataset metadata + counts.
```json
{
  "generated_at": "2026-05-15T20:50:00Z",
  "facility_count": 2484,
  "district_count": 212,
  "region_count":   16,
  "tier_counts":    { "Critical Risk": 59, "High Risk": 101, ... },
  "data_sources":   { "facilities": "OSM ...", "population": "GSS ..." }
}
```

---

## Districts

### `GET /api/v1/districts`
Query params: `region`, `risk_tier`, `limit` (1-1000), `offset`.

Returns a list of district records:
```json
[{
  "district_id": "Central__Asikuma-Odoben-Brakwa",
  "district":    "Asikuma-Odoben-Brakwa",
  "region":      "Central",
  "rank":        1,
  "CVI_0_100":   100.0,
  "risk_tier":   "Critical Risk",
  "total_facilities": 1, "hospitals_clinics": 0, "pharmacies": 1,
  "type_diversity": 1, "median_nn_km_hosp": null,
  "hosp_per_100k": 0.0, "pharm_per_100k": 0.66, "facilities_per_100k": 0.66,
  "district_pop_proxy": 150518, "region_population_2021": 2859821,
  "is_urban": 0, "lat_centroid": 5.78, "lon_centroid": -0.97
}]
```

### `GET /api/v1/districts/{district_id}`
Single district + attached AI recommendations.
404 if not found.

---

## Regions

### `GET /api/v1/regions`
Region rollup, ordered by mean CVI desc.

```json
[{
  "region": "Savannah", "districts": 5, "total_facilities": 24,
  "mean_facilities_per_100k": 3.67, "mean_hosp_per_100k": 2.76,
  "mean_CVI": 81.87, "population_2021": 653266,
  "critical_count": 4, "high_count": 1
}]
```

---

## Facilities

### `GET /api/v1/facilities`
Query params: `region`, `district`, `amenity`, `bbox` (`minLon,minLat,maxLon,maxLat`),
`limit` (1-10000).

```json
[{ "id": "node/123", "name": "Korle Bu Teaching Hospital",
   "amenity": "hospital", "healthcare": "hospital",
   "region": "Greater Accra", "district": "Korle Klottey Municipal",
   "lat": 5.534, "lon": -0.226 }]
```

---

## Vulnerability

### `GET /api/v1/vulnerability/top?n=20`
Top-N most vulnerable districts.

### `GET /api/v1/vulnerability/distribution`
Histogram of CVI scores + tier counts (for charts).
```json
{ "score_histogram": { "0-25": 22, "25-50": 31, "50-75": 100, "75-100": 59 },
  "tier_counts":     { "Critical Risk": 59, "High Risk": 101,
                       "Moderate Risk": 31, "Low Risk": 21 } }
```

---

## Recommendations

### `GET /api/v1/recommendations/{district_id}`
AI-generated intervention list (max 5, ordered by priority).

```json
[{
  "id":              "build_phc",
  "title":           "Build additional primary healthcare centre",
  "rationale":       "Hospital + clinic supply is below 1.5 per 100k ...",
  "priority_score":  0.93
}]
```

---

## Forecast

### `GET /api/v1/forecast`
All forecast rows, optionally filtered by `region`, `district_id`, `year`.

### `GET /api/v1/forecast/{district_id}`
All horizons (2026, 2030, 2035) for one district.
```json
[{
  "district":            "Asikuma-Odoben-Brakwa", "region": "Central",
  "year":                2030, "projected_pop": 167219,
  "current_facilities":  1, "required_facilities": 15.05,
  "projected_shortfall": 14.05
}]
```

---

## Auth

### `POST /api/v1/auth/login`
OAuth2 password flow. Body (form-encoded): `username`, `password`.
Returns:
```json
{ "access_token": "<JWT>", "token_type": "bearer" }
```
Demo: `demo` / `demo` (analyst), `admin` / `admin` (admin).

### `GET /api/v1/auth/me`
Header `Authorization: Bearer <JWT>`. Returns the decoded user.

---

## Error format

All 4xx/5xx errors:
```json
{ "detail": "Human-readable error message" }
```
