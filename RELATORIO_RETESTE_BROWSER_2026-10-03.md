# Relatório de reteste no navegador — 03/10/2026

## Fonte testada

- URL: https://teste-60f.pages.dev/?browser-check=810
- Ambiente: My Browser, sessão autenticada do usuário
- Usuário exibido: Kauan / ADMIN

## Versão observada

A publicação exibiu **Sistema Digicopy v8.0.0** no título, cabeçalho e rodapé.

Conclusão: a versão 8.1.0 está apenas no commit local `ad6e259`; o Pages ainda serve o branch remoto antigo `pr-47`, no commit `6ec3264`.

## Modo escuro

Teste realizado em `Configurações > Preferências > Modo escuro`.

Resultado:

- Dashboard, sidebar, busca e painéis principais ficaram escuros.
- O modo escuro é persistido no aparelho e o teste foi revertido para o modo claro ao final.
- Persistem áreas claras residuais, especialmente o cartão **Técnico** em Preferências e cartões internos/ícones claros do Dashboard.
- Portanto, o modo escuro ainda não atende completamente à regra de página inteira escura.

## Importar dados

Teste realizado em `Configurações > Importar dados`.

Resultado:

- O menu independente **Importar dados** aparece e abre corretamente.
- A tela mostra o seletor `upload-db` para múltiplos arquivos JSON.
- O fluxo explica Notinhas/Vendas, Clientes/Produtos, tabelas auxiliares e limpeza automática.
- Nenhum arquivo foi selecionado e nenhuma gravação foi executada, pois não havia um JSON fornecido nesta etapa e uma importação real altera dados da nuvem.

## Problemas encontrados

1. O Pages ainda está em 8.0.0 porque o commit 8.1.0 não foi enviado ao branch remoto.
2. O `package.json` aponta `digicopy.branch` para `arena/01a0d9c3-teste`, branch antiga em 7.3.18, em vez de `pr-47`.
3. O `sync_build.js` só atualiza cache-bust com `?v=`, enquanto o `index.html` usa `?h=9d33f8b8a0328659`; o hash esperado do bundle atual é diferente.
4. Quando a nuvem está configurada, o aviso visual e o portão de conexão podem aparecer simultaneamente.
5. O Worker responde saudável, mas informa identificadores antigos (`version 0.4.9` e `versao 5.28.5`).

## Console

Não foram observados erros JavaScript no console durante o reteste.