BEGIN;

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assertions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assertions_data_subject ON assertions ((data->>'subject'));
CREATE INDEX IF NOT EXISTS idx_assertions_data_object ON assertions ((data->>'object'));
CREATE INDEX IF NOT EXISTS idx_relationships_data_subject ON relationships ((data->>'subject'));
CREATE INDEX IF NOT EXISTS idx_relationships_data_object ON relationships ((data->>'object'));
CREATE INDEX IF NOT EXISTS idx_evidence_data_source_id ON evidence ((data->>'sourceId'));
CREATE INDEX IF NOT EXISTS idx_evidence_data_assertion_id ON evidence ((data->>'assertionId'));
CREATE INDEX IF NOT EXISTS idx_evidence_data_entity_id ON evidence ((data->>'entityId'));

COMMIT;
