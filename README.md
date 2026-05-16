# HealthMap Ghana

**AI-powered geospatial healthcare intelligence platform** — predicts, scores
and visualises healthcare-access gaps across every district in Ghana.

Built for the **Ghana AI Innovation Challenge 2026 (Healthcare track)**.

---

## What it does

| Capability | Detail |
|---|---|
| Healthcare Vulnerability Index | Per-district score (0-100) combining facility scarcity, type diversity, inter-facility distance, and per-capita supply |
| Four-tier classification | Low / Moderate / High / Critical risk via K-Means clustering |
| Interactive choropleth | Leaflet map of Ghana districts coloured by vulnerability |
| Facility layer | 2,484 OSM-mapped facilities (hospitals, clinics, CHPS, pharmacies, doctors) |
| AI recommendations | Rule-based engine generates 3-5 prioritised interventions per district |
| Demand forecasting | Linear projection of facility shortage under 2030 / 2035 population scenarios |
| Real-time dashboard | Sidebar drill-down, multi-dimensional filters, top-20 underserved table |
| Landing page | Government-grade hero, animated stats, feature grid, dashboard preview |

---

## Architecture

```
                  ┌──────────────────────────┐
                  │  Next.js 14 frontend     │
                  │  React + TypeScript      │
                  │  Tailwind + Leaflet      │
                  │  Recharts + Plotly       │
                  └─────────────┬────────────┘
                                │  REST (JSON)
                                ▼
                  ┌──────────────────────────┐
                  │  FastAPI backend         │
                  │  /districts /facilities  │
                  │  /vulnerability          │
                  │  /recommendations        │
                  │  /forecast /auth         │
                  └─────────────┬────────────┘
                                │
            ┌───────────────────┴────────────────────┐
            ▼                                        ▼
   ┌──────────────────┐                  ┌────────────────────┐
   │ Pre-computed     │                  │ PostgreSQL+PostGIS │
   │ JSON (v1)        │                  │ (v2 upgrade path)  │
   └──────────────────┘                  └────────────────────┘
            ▲
            │  built by
            │
   ┌──────────────────────────────────────┐
   │ ML pipeline                          │
   │ ETL → features → scoring →           │
   │ clustering → forecasting →           │
   │ recommendation engine                │
   │ (NumPy + Pandas + scikit-learn)      │
   └──────────────────────────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

---

## Quick start

### Prerequisites

- Python 3.10+
- Node.js 18+
- (Optional) Docker + Docker Compose if you want everything containerised
- (Optional, v2) PostgreSQL 14+ with PostGIS

### 1. Clone and install

```bash
git clone <your-repo-url> healthmap-ghana
cd healthmap-ghana
```

### 2. Run the ML pipeline (pre-computes JSON for the API)

```bash
cd ml
pip install -r requirements.txt
python -m pipeline.run_all              # writes ../backend/app/data/*.json
```

### 3. Fetch Ghana district boundaries (one-off)

```bash
cd ../data
python fetch_district_boundaries.py     # downloads geoBoundaries Ghana ADM2 GeoJSON
```

### 4. Start the backend

```bash
cd ../backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend now serving on http://localhost:8000 — see http://localhost:8000/docs
for the auto-generated OpenAPI spec.

### 5. Start the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open http://localhost:3000

### 6. (Optional) Run the whole stack with Docker

```bash
docker compose up --build
```

---

## Repository layout

```
healthmap-ghana/
├── README.md                         this file
├── docker-compose.yml                full-stack orchestration
├── .env.example                      copy to .env, edit secrets
├── frontend/                         Next.js 14 + TypeScript + Tailwind
│   ├── src/app/page.tsx              landing page
│   ├── src/app/dashboard/page.tsx    interactive dashboard
│   └── src/components/               reusable UI (map, sidebar, table, ...)
├── backend/                          FastAPI service
│   ├── app/main.py                   API entrypoint
│   ├── app/routes/                   /districts /facilities /vulnerability ...
│   └── app/services/                 ML inference, recommendations, forecast
├── ml/                               machine-learning pipeline
│   ├── pipeline/                     ETL → features → scoring → forecast
│   └── outputs/                      generated artefacts
├── data/                             raw + reference datasets
│   ├── facilities/                   OSM Ghana health facilities (GeoPackage)
│   ├── geo/                          district boundaries (auto-fetched)
│   └── population/                   Ghana 2021 census regional totals
├── db/                               PostgreSQL + PostGIS schema (v2)
└── docs/                             architecture, API, ML, deployment
```

---

## Datasets

| Source | Used for | License |
|---|---|---|
| Ghana Health Facilities (OSM / HOTOSM) | 2,484 facility records | ODbL |
| Ghana 2021 Population & Housing Census (GSS) | Regional population for per-capita metrics | Public |
| geoBoundaries Ghana ADM2 | District polygons for choropleth | CC-BY |

The pipeline is licensed MIT. Underlying data licences apply to data.

---

## Vulnerability scoring

For each district `d`, the Composite Vulnerability Index is

```
CVI(d) = 0.30·(-z(hosp_per_100k))
       + 0.20·(-z(pharm_per_100k))
       + 0.15·(-z(type_diversity))
       + 0.20·(+z(median_nn_km_hosp))
       + 0.15·(-z(facilities_per_100k))
```

rescaled to 0-100, where higher = more vulnerable.

K-Means (k=4) on the standardised feature matrix produces the four risk tiers,
ordered by mean CVI: `Critical > High > Moderate > Low`.

See [docs/ML_PIPELINE.md](docs/ML_PIPELINE.md) for full methodology.

---

## API

Auto-generated docs at http://localhost:8000/docs. Highlights:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/districts` | All districts with score, tier, key stats |
| `GET` | `/api/v1/districts/{id}` | Single district + recommendations |
| `GET` | `/api/v1/facilities` | All facilities (filter by region, type) |
| `GET` | `/api/v1/vulnerability/top?n=20` | Top-N most underserved |
| `GET` | `/api/v1/recommendations/{district_id}` | AI-generated intervention list |
| `GET` | `/api/v1/forecast/{district_id}?year=2035` | Demand projection |
| `GET` | `/api/v1/regions` | Region-level rollup |
| `GET` | `/health` | Liveness probe |

See [docs/API.md](docs/API.md) for full schemas and examples.

---

## Roadmap

- v1.0 (this release) — Static JSON-backed analytics, landing + dashboard
- v1.1 — PostgreSQL + PostGIS migration, OAuth (Auth.js)
- v2.0 — Road-network accessibility (OSRM), ambulance routing
- v2.1 — Satellite-imagery accessibility overlays
- v3.0 — Disease-outbreak overlay, IoT sensor ingestion, disaster response

---

## Citation

> Andrews, O. et al. (2026). *AI-Driven District Prioritization for Ghana's
> Health Infrastructure: The HealthMap Ghana Platform.* Ghana AI Innovation
> Challenge 2026, Healthcare track.

---

## License

Code: MIT. See [LICENSE](LICENSE).
Data: see source-specific licences above.
