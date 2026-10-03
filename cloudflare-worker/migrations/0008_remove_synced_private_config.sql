-- Remove credenciais escolares e o PFX A1 que versões anteriores guardaram
-- dentro do registro config sincronizado. Novas escritas e respostas também
-- passam pelo filtro correspondente no Worker.
UPDATE records
SET data_json = json_remove(data_json, '$.escolaAuth', '$.fiscal.a1Nuvem.data')
WHERE entity = 'config'
  AND json_valid(data_json)
  AND (json_type(data_json, '$.escolaAuth') IS NOT NULL
    OR json_type(data_json, '$.fiscal.a1Nuvem.data') IS NOT NULL);

UPDATE changes
SET data_json = json_remove(data_json, '$.escolaAuth', '$.fiscal.a1Nuvem.data')
WHERE entity = 'config'
  AND json_valid(data_json)
  AND (json_type(data_json, '$.escolaAuth') IS NOT NULL
    OR json_type(data_json, '$.fiscal.a1Nuvem.data') IS NOT NULL);
