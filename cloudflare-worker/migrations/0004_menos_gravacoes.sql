-- v5.22.82: CORTAR GRAVAÇÕES NO BANCO
-- No D1, cada índice de uma tabela conta como UMA GRAVAÇÃO A MAIS toda vez que
-- a linha muda. Índice que ninguém usa é dinheiro (e limite diário) no lixo.
--
-- • idx_records_deleted e idx_records_entity_deleted: criados por mim na
--   v5.22.76 só para acelerar a contagem da tela da nuvem. Trocados por um
--   resumo guardado de 10 em 10 minutos, que não custa quase nada.
-- • idx_records_updated: existe desde o começo e NENHUMA consulta usa.
-- • idx_changes_cursor: índice sobre a coluna seq, que já é a chave primária.
--   Era um índice em cima de si mesmo.
--
-- Resultado: de ~8 linhas gravadas por registro sincronizado para ~4.
DROP INDEX IF EXISTS idx_records_deleted;
DROP INDEX IF EXISTS idx_records_entity_deleted;
DROP INDEX IF EXISTS idx_records_updated;
DROP INDEX IF EXISTS idx_changes_cursor;
