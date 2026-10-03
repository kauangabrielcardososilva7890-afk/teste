PRAGMA foreign_keys = ON;

-- v5.26.0 — CONEXÃO POR CNPJ + GERENTE + SITE RESTRITO + IMAGENS DO TUTORIAL.
--
-- Três pedidos do dono entregues juntos (mesmo motor):
--  1) PC novo entra com CNPJ + senha de conexão ÚNICA (sem código de convite
--     que vence em minutos — o convite continua como plano B).
--  2) Site de atualizações RESTRITO: CNPJ + senha de conexão (lembrado 30
--     dias) E link secreto que aparece como notificação no sistema — só
--     quando a versão nova é destinada ao CNPJ daquela instalação.
--  3) Programa separado no PC do dono (GERENTE) que joga/edita/exclui
--     atualizações e escolhe PRA QUEM cada uma aparece.
--
-- OBS: o motor também cria/ajusta tudo isto sozinho (idempotente) na primeira
-- requisição — esta migration é o registro oficial. Se rodar duas vezes e
-- der "duplicate column name", as colunas já estão aplicadas: prossiga.
-- NÃO alteramos system_meta.'schema_version': o /health exige '2' hoje.

-- senhas da nuvem (guardadas SÓ como hash, com pimenta do SETUP_SECRET):
CREATE TABLE IF NOT EXISTS connect_secrets (
  id TEXT PRIMARY KEY,             -- sempre 'main' (uma senha de conexão por nuvem)
  conn_hash TEXT NOT NULL DEFAULT '',
  gerente_hash TEXT NOT NULL DEFAULT '',
  owner_cnpj TEXT NOT NULL DEFAULT '',   -- só este CNPJ entra como GERENTE
  owner_nome TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL DEFAULT 0
);

-- empresas conhecidas (entram ao conectar PC por CNPJ ou cadastro manual):
CREATE TABLE IF NOT EXISTS empresas (
  cnpj TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  last_seen_at INTEGER NOT NULL DEFAULT 0
);

-- sessão do site restrito (cookie site_sess, 30 dias):
CREATE TABLE IF NOT EXISTS site_sessions (
  token TEXT PRIMARY KEY,
  cnpj TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL DEFAULT 0
);

-- sessão do gerente (header x-gerente-token, 7 dias):
CREATE TABLE IF NOT EXISTS gerente_sessions (
  token TEXT PRIMARY KEY,
  cnpj TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL DEFAULT 0
);

-- destinatário de cada atualização + link secreto + imagens do tutorial:
ALTER TABLE app_releases ADD COLUMN destino_tipo TEXT NOT NULL DEFAULT 'todos';  -- todos | lista | so_loja
ALTER TABLE app_releases ADD COLUMN destino_cnpjs TEXT NOT NULL DEFAULT '[]';    -- JSON de CNPJs (só dígitos)
ALTER TABLE app_releases ADD COLUMN slug TEXT NOT NULL DEFAULT '';               -- link secreto /a/<slug>
ALTER TABLE app_releases ADD COLUMN imagens TEXT NOT NULL DEFAULT '[]';          -- JSON de chaves R2 img/<v>/...

CREATE INDEX IF NOT EXISTS idx_empresas_nome ON empresas(nome);
CREATE INDEX IF NOT EXISTS idx_site_sessions_expira ON site_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_gerente_sessions_expira ON gerente_sessions(expires_at);
