PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'device')),
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE TABLE IF NOT EXISTS enrollment_codes (
  code_hash TEXT PRIMARY KEY,
  created_by TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  uses_left INTEGER NOT NULL DEFAULT 1 CHECK (uses_left >= 0),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES devices(id)
);
CREATE INDEX IF NOT EXISTS idx_enrollment_expiry ON enrollment_codes(expires_at);

CREATE TABLE IF NOT EXISTS records (
  entity TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data_json TEXT,
  version INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  updated_by TEXT NOT NULL,
  PRIMARY KEY (entity, record_id),
  FOREIGN KEY (updated_by) REFERENCES devices(id)
);
CREATE INDEX IF NOT EXISTS idx_records_updated ON records(updated_at);

CREATE TABLE IF NOT EXISTS changes (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  mutation_id TEXT NOT NULL UNIQUE,
  entity TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
  data_json TEXT,
  version INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);
CREATE INDEX IF NOT EXISTS idx_changes_cursor ON changes(seq);
CREATE INDEX IF NOT EXISTS idx_changes_record ON changes(entity, record_id, seq);

CREATE TABLE IF NOT EXISTS system_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO system_meta(key, value, updated_at)
VALUES ('schema_version', '1', unixepoch() * 1000);
