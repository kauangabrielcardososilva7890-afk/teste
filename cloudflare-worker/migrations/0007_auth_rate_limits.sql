-- v8.0.1 — janela de tentativas e bloqueio progressivo das rotas de autenticação.
-- key_hash é SHA-256 de endpoint + dimensão + valor; IP/CNPJ nunca ficam em claro.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key_hash TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_started_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  failures INTEGER NOT NULL DEFAULT 0,
  blocked_until INTEGER NOT NULL DEFAULT 0,
  last_seen_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_hash, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_auth_rate_blocked ON auth_rate_limits(blocked_until);
