# HealthMap Ghana — Deployment guide

Three target environments are documented: **local dev**, **Docker Compose**,
and **cloud** (Render / Vercel / Fly.io / Kubernetes).

---

## 1. Local development (no Docker)

### Prerequisites
- Python 3.10+
- Node.js 18+

### Steps

```bash
# (a) Clone & enter the repo
git clone <your-repo-url> healthmap-ghana
cd healthmap-ghana

# (b) Run the ML pipeline — produces JSON for the API
cd ml
pip install -r requirements.txt
python -m pipeline.run_all          # writes ../backend/app/data/*.json

# (c) Fetch district boundaries (one-off)
cd ../data
python fetch_district_boundaries.py # downloads geoBoundaries Ghana ADM2

# (d) Backend
cd ../backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# (e) Frontend (new terminal)
cd ../frontend
npm install
npm run dev                          # http://localhost:3000
```

Visit the dashboard at <http://localhost:3000/dashboard>.
Backend OpenAPI docs at <http://localhost:8000/docs>.

---

## 2. Docker Compose (one command)

```bash
cp .env.example .env                 # edit secrets
docker compose up --build
```

Brings up three containers:
- `db`        — PostgreSQL 15 + PostGIS 3.4 (idle until v2 wires it in)
- `backend`   — FastAPI on :8000
- `frontend`  — Next.js on :3000

Stop: `docker compose down`. Reset DB: `docker compose down -v`.

---

## 3. Cloud deployment

### Frontend on Vercel
1. Push the `frontend/` folder as the project root in Vercel.
2. Set `NEXT_PUBLIC_API_BASE` env var → your backend URL + `/api/v1`.
3. Build command: `npm run build`. Output: `.next`.
4. Vercel auto-deploys on push.

### Backend on Render / Railway / Fly.io
1. Use the provided `backend/Dockerfile`.
2. Mount or bake the `app/data/*.json` artefacts at deploy time
   (in v1; in v2 connect to the managed Postgres).
3. Required env vars:
   - `ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app`
   - `SECRET_KEY=<openssl rand -hex 32>`
4. Health-check path: `/health`.

### Postgres on Supabase / Neon (v2 only)
1. Provision a Postgres instance with **PostGIS extension enabled**.
2. Apply schema:  `psql $DATABASE_URL -f db/schema.sql`.
3. Set `DATABASE_URL` on the backend service.

### Kubernetes
- One Deployment per service. The frontend can run as a static site if
  exported (`next export` — only the landing is fully static; the dashboard
  fetches from the backend on the client).
- Ingress: route `/api/*` to backend, everything else to frontend.
- Use a ReadOnlyMany PVC to share the JSON artefacts between pods, or
  bake them into the backend image.

---

## 4. Operations

### Re-running the ML pipeline
Schedule `python -m pipeline.run_all` from the `ml/` directory weekly
(GitHub Actions, Airflow, or a Kubernetes CronJob).

The backend's `services/data_loader.py` caches in-memory; restart the
container or call the planned `POST /admin/reload` endpoint to refresh.

### Monitoring
- **Liveness:** `GET /health`.
- **Readiness:** check that `manifest.json` is present and recent.
- Add Prometheus + Sentry as part of v1.1 (hooks reserved in `main.py`).

### Backups
- v1: artefacts are git-tracked or S3-mirrored.
- v2: nightly `pg_dump` on the Postgres instance.

---

## 5. Security checklist

- [ ] Change `SECRET_KEY` in `.env` (and rotate quarterly).
- [ ] Replace demo users in `services/security.py`.
- [ ] Restrict CORS `ALLOWED_ORIGINS` to your production domains.
- [ ] HTTPS-only behind your load balancer.
- [ ] Review API rate-limiting (planned middleware in v1.1).
- [ ] Audit data files before public release (no PII in v1, verify on each
      pipeline rerun).
