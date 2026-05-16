-- HealthMap Ghana — PostgreSQL + PostGIS schema (v2)
-- ----------------------------------------------------
-- v1 of the platform serves pre-computed JSON.  This schema is the v2
-- migration target: the same access pattern, but backed by a relational
-- store with PostGIS spatial types.
--
-- Apply with:   psql -U healthmap -d healthmap -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 1. Reference: regions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regions (
  region_code        TEXT PRIMARY KEY,            -- e.g. 'GH07'
  region_name        TEXT NOT NULL UNIQUE,
  population_2021    INTEGER NOT NULL,
  geom               geometry(MultiPolygon, 4326),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_regions_geom ON regions USING GIST (geom);

-- ---------------------------------------------------------------------------
-- 2. Reference: districts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS districts (
  district_id        TEXT PRIMARY KEY,            -- '<Region>__<District>'
  district_name      TEXT NOT NULL,
  region_code        TEXT NOT NULL REFERENCES regions(region_code)
                                  ON DELETE CASCADE,
  geom               geometry(MultiPolygon, 4326),
  centroid           geometry(Point, 4326),
  pop_proxy          INTEGER NOT NULL,
  is_urban           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_districts_geom     ON districts USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_districts_centroid ON districts USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_districts_region   ON districts (region_code);
CREATE INDEX IF NOT EXISTS idx_districts_name_trgm
    ON districts USING GIN (district_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 3. Facilities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facilities (
  facility_id        TEXT PRIMARY KEY,
  name               TEXT,
  amenity            TEXT,                       -- hospital | clinic | ...
  healthcare         TEXT,
  operator_type      TEXT,
  district_id        TEXT REFERENCES districts(district_id) ON DELETE SET NULL,
  geom               geometry(Point, 4326) NOT NULL,
  source             TEXT NOT NULL DEFAULT 'OSM',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_facilities_geom    ON facilities USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_facilities_amenity ON facilities (amenity);
CREATE INDEX IF NOT EXISTS idx_facilities_district ON facilities (district_id);

-- ---------------------------------------------------------------------------
-- 4. Computed metrics (output of the ML pipeline)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS district_metrics (
  district_id        TEXT PRIMARY KEY REFERENCES districts(district_id)
                                       ON DELETE CASCADE,
  total_facilities       INTEGER NOT NULL,
  hospitals_clinics      INTEGER NOT NULL,
  pharmacies             INTEGER NOT NULL,
  type_diversity         INTEGER NOT NULL,
  median_nn_km_hosp      NUMERIC(8, 3),
  hosp_per_100k          NUMERIC(8, 3) NOT NULL,
  pharm_per_100k         NUMERIC(8, 3) NOT NULL,
  facilities_per_100k    NUMERIC(8, 3) NOT NULL,
  cvi_raw                NUMERIC(8, 4) NOT NULL,
  cvi_0_100              NUMERIC(6, 2) NOT NULL,
  risk_tier              TEXT NOT NULL CHECK (risk_tier IN
                            ('Critical Risk', 'High Risk',
                             'Moderate Risk',  'Low Risk')),
  rank                   INTEGER NOT NULL,
  computed_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_metrics_tier ON district_metrics (risk_tier);
CREATE INDEX IF NOT EXISTS idx_metrics_cvi  ON district_metrics (cvi_0_100 DESC);

-- ---------------------------------------------------------------------------
-- 5. AI recommendations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
  id                 BIGSERIAL PRIMARY KEY,
  district_id        TEXT NOT NULL REFERENCES districts(district_id)
                                    ON DELETE CASCADE,
  rule_id            TEXT NOT NULL,
  title              TEXT NOT NULL,
  rationale          TEXT NOT NULL,
  priority_score     NUMERIC(5, 3) NOT NULL,
  generated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recs_district ON recommendations (district_id);

-- ---------------------------------------------------------------------------
-- 6. Demand forecasts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS forecasts (
  id                 BIGSERIAL PRIMARY KEY,
  district_id        TEXT NOT NULL REFERENCES districts(district_id)
                                    ON DELETE CASCADE,
  horizon_year       INTEGER NOT NULL,
  projected_pop      INTEGER NOT NULL,
  current_facilities INTEGER NOT NULL,
  required_facilities NUMERIC(8, 2) NOT NULL,
  projected_shortfall NUMERIC(8, 2) NOT NULL,
  computed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (district_id, horizon_year)
);

-- ---------------------------------------------------------------------------
-- 7. Users (auth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id            BIGSERIAL PRIMARY KEY,
  username           TEXT NOT NULL UNIQUE,
  email              TEXT UNIQUE,
  hashed_password    TEXT NOT NULL,
  role               TEXT NOT NULL DEFAULT 'viewer'
                       CHECK (role IN ('viewer', 'analyst', 'admin')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 8. Convenient view — flat district + metric join
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_district_full AS
SELECT
  d.district_id,
  d.district_name AS district,
  r.region_name   AS region,
  d.pop_proxy     AS district_pop_proxy,
  d.is_urban,
  ST_X(d.centroid) AS lon_centroid,
  ST_Y(d.centroid) AS lat_centroid,
  m.*
FROM districts d
JOIN regions   r ON r.region_code = d.region_code
LEFT JOIN district_metrics m ON m.district_id = d.district_id;
