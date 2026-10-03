-- v5.22.76: a tela da nuvem contava registro percorrendo a tabela inteira toda
-- vez que alguém clicava no ícone. Com a base grande isso estourava o tempo do
-- banco e aparecia "Erro interno da API". Estes índices fazem a conta ser
-- instantânea.
CREATE INDEX IF NOT EXISTS idx_records_deleted ON records(deleted_at);
CREATE INDEX IF NOT EXISTS idx_records_entity_deleted ON records(entity, deleted_at);
