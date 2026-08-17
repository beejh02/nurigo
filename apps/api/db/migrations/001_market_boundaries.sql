BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE market_boundary_status AS ENUM (
  'draft',
  'verified',
  'retired'
);

CREATE TABLE markets (
  id text PRIMARY KEY,
  name text NOT NULL,
  region_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT markets_id_format
    CHECK (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT markets_name_not_blank
    CHECK (btrim(name) <> ''),
  CONSTRAINT markets_region_code_not_blank
    CHECK (btrim(region_code) <> '')
);

CREATE INDEX markets_region_code_idx
  ON markets (region_code);

CREATE TABLE market_boundaries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  market_id text NOT NULL REFERENCES markets (id) ON DELETE RESTRICT,
  revision integer NOT NULL,
  status market_boundary_status NOT NULL DEFAULT 'draft',
  boundary geometry(MultiPolygon, 4326) NOT NULL,
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  valid_from timestamptz,
  valid_to timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT market_boundaries_revision_positive
    CHECK (revision > 0),
  CONSTRAINT market_boundaries_revision_unique
    UNIQUE (market_id, revision),
  CONSTRAINT market_boundaries_not_empty
    CHECK (NOT ST_IsEmpty(boundary)),
  CONSTRAINT market_boundaries_valid_geometry
    CHECK (ST_IsValid(boundary)),
  CONSTRAINT market_boundaries_valid_period
    CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to > valid_from),
  CONSTRAINT market_boundaries_verified_at_required
    CHECK (status <> 'verified' OR verified_at IS NOT NULL)
);

CREATE UNIQUE INDEX market_boundaries_one_verified_per_market_idx
  ON market_boundaries (market_id)
  WHERE status = 'verified';

CREATE INDEX market_boundaries_boundary_gist_idx
  ON market_boundaries
  USING gist (boundary);

CREATE INDEX market_boundaries_market_status_idx
  ON market_boundaries (market_id, status);

COMMIT;
