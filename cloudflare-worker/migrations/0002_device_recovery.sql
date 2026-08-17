ALTER TABLE enrollment_codes
ADD COLUMN role TEXT NOT NULL DEFAULT 'device'
CHECK (role IN ('admin', 'device'));

CREATE TABLE IF NOT EXISTS device_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  device_id TEXT,
  actor_id TEXT,
  details_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_device_events_created ON device_events(created_at);

UPDATE system_meta SET value = '2', updated_at = unixepoch() * 1000
WHERE key = 'schema_version';
