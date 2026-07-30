# Teste da migração para a nuvem

## Fluxo de validação

1. Exportar as tabelas do Firebird pelo DBeaver em JSON.
2. Confirmar que cada arquivo contém uma lista de registros e está válido.
3. Abrir o ERP pelo GitHack.
4. Selecionar os arquivos JSON na tela de migração.
5. Confirmar que as 174 tabelas foram reconhecidas.
6. Clicar em **Importar TUDO para o ERP**.
7. Conferir os módulos dinâmicos criados no menu.
8. Testar a conexão com a nuvem (Google Firebase).
9. Clicar em **Enviar para nuvem** somente depois da conferência local.
10. Abrir o ERP em outro computador/janela anônima e clicar em **Carregar da nuvem**.

## Testes graduais

Antes de enviar os 174 arquivos, validar nesta ordem:

- 1 arquivo pequeno;
- 5 arquivos;
- 20 arquivos;
- os 174 arquivos.

Em cada etapa, registrar:

- quantidade de arquivos selecionados;
- quantidade reconhecida;
- quantidade de registros;
- mensagem exibida;
- erro do Console do navegador, se houver;
- código da requisição no Network, se houver.

Não enviar credenciais, chaves ou tokens ao compartilhar os erros.
