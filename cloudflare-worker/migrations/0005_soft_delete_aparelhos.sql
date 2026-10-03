PRAGMA foreign_keys = ON;

-- v5.24.34 — pedido dele: aparelho some da LISTA, dados NUNCA somem.
-- Delete físico quebrava nas FOREIGN KEY (records/changes/códigos apontam
-- pro aparelho). Exclusão vira carimbo: aparelho some de tudo que lista,
-- perde o acesso na hora, e o histórico de dados fica intacto.

ALTER TABLE devices ADD COLUMN excluido_em INTEGER;

UPDATE system_meta SET value = '3', updated_at = unixepoch() * 1000 WHERE key = 'schemaVersion';
