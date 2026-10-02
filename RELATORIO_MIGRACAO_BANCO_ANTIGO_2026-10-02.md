
## Formato confirmado do exportador

Os arquivos não são arrays na raiz. Cada arquivo usa o nome da tabela como chave, por exemplo:

```json
{"CLIENTES": [{"COD_CLIENTE": 1, "CLI_COD_EMPRESA": 1, "NOME_RAZAOSOCIAL": "..."}]}
```

O mesmo padrão aparece em `EMPRESA`, `VENDAS`, `PRODUTOS` e nas demais tabelas. Isso confirma que o importador futuro deve:

- extrair a chave de tabela dinamicamente;
- manter o nome original da tabela no relatório de origem;
- transformar `COD_*` e `*_COD_EMPRESA` em referências internas;
- usar `DEL`, `BLOQUEADO` e campos equivalentes para decidir registros inativos;
- descartar ou separar campos binários grandes, como logos e blobs, para não travar a carga;
- importar em lotes, pois alguns arquivos têm milhões de bytes e muitas linhas.

A exportação contém dados reais e foi mantida fora do repositório e fora da nuvem. O sistema foi testado apenas com fixture sintética, não com esses registros.
