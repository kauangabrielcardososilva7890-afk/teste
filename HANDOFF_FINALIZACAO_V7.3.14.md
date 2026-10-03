# Handoff final — Digicopy ERP v7.3.14

- **Data da rodada:** 02/10/2026
- **Checkout:** `/home/ubuntu/teste-r66-review`
- **Branch local:** `work/r67-auth-cloud-ui`
- **Base verificada:** `origin/arena/01a0d9c3-teste` no commit `1d76e536`
- **Versão do produto no checkout:** `7.3.14`
- **Escopo:** finalização de uso pessoal/QA local, menus Locação e Fiscal, proteção de dados, UX de autenticação/Nuvem e sincronização dos espelhos desktop/mobile.

## 1. Estado final desta rodada

- Corrigido e testado o caso de **Contratos > Mostrar todos**: depois de aplicar uma busca, apagar o texto sem lupa/Enter e clicar em **Mostrar todos**, o texto antigo não reaparece.
- Restaurados os atalhos **Máquinas nos clientes** e **Leituras** no submenu **Locação**. A navegação mantém os destinos unificados existentes: Parque → Impressoras; Leituras → fluxo dentro de Contratos.
- Completado o layout de **Fiscal** com estrutura visual alinhada às capturas fornecidas e campos estruturais da Reforma Tributária IBS/CBS 2026. Nenhuma alíquota é preenchida automaticamente; o formulário não afirma conformidade nem transmite XML.
- Confirmados no navegador o popup de notas por versão, o diagnóstico da Nuvem pelo ponto pulsante, a tela Usuários/permissões sem a linha técnica de hierarquia, e o guardião de chamadas de orçamento.
- Versões desktop, web móvel e assets Android têm bundles idênticos.
- A suíte do repositório terminou em **14 passaram, 0 falharam, 0 omitidos**. O E2E Playwright terminou em **1 teste passado**, cobrindo **23/23 rotas**.
- Nenhum login real, dado de produção, serviço Cloudflare real, emissão fiscal ou sincronização real foi utilizado.

## 2. Correção de Contratos e navegação Locação

### Busca em Contratos

A divergência de estado entre `window.__CONTRATOS_FINAL_STATE__` e `window.__CTR_FILTRO_V52237` foi corrigida em `ajustes_v52237_contratos_filtros_patch.js:193+`. A ação **Mostrar todos** agora limpa o filtro do renderer principal e o da extensão, além de zerar o campo e o status antes de renderizar novamente. O teste Playwright reproduz a sequência real com `QA-2026-001` e verifica:

- `filterQuery=''` e `rendererQuery=''`;
- campo `todos` e status vazio;
- o input permanece vazio depois da ação;
- a linha da fixture permanece visível, sem recuperar o termo antigo.

A captura da tela corrigida está em [`evidence/contracts-search-mostrar-todos.png`](evidence/contracts-search-mostrar-todos.png); a captura anterior ao conserto, em [`evidence/contracts-search-restored.webp`](evidence/contracts-search-restored.webp).

### Menu Locação

`ajustes_v52213_menus_atalhos_patch.js:29-30` repõe os itens Parque e Leituras. `locacao_chamados_fix_patch.js:81-96` mantém os links visíveis e encaminha ao fluxo consolidado com aviso não bloqueante. As rotas Parque e Leituras foram abertas no browser e verificadas pelas telas/destinos existentes; não foi criada uma tela paralela que duplicasse contratos ou impressoras.

## 3. Fiscal e Reforma Tributária

Implementado em `fiscal_catalogo_completo_patch.js`, com regressões em `test_msg_08_fiscal.js` e referência normativa em [`FISCAL_FONTES_OFICIAIS_2026-10-02.md`](FISCAL_FONTES_OFICIAIS_2026-10-02.md).

### Tributação por item

- Cabeçalho dos dados do produto mantido visível junto da edição tributária.
- Seções **Tributação**, **Importação**, **Outros** e **Reforma Tributária**.
- Importação organizada em cartões para DI, desembaraço/data, adições, valores e país. Datas usam campos de data; demais dados são entradas editáveis.
- **Outros** dividido em CSOSN ICMS, ICMS ST, FCP, Efetivo e Outros dados comerciais/tributáveis.
- Campos incluem base, percentuais e valores separados; valores informados ficam persistidos na edição sintética ao alternar subabas.

### IBS/CBS

- Campos para CST IBS/CBS, classificação `cClassTrib`, bases, alíquotas e valores por item, incluindo subabas Padrão/Devolução.
- Perfil tributário e configuração de Reforma deixam códigos e percentuais sem preenchimento automático, com confirmação explícita antes de aplicar perfil.
- A tela de resumo IBS/CBS apresenta o que já foi lançado; não gera uma tributação presumida.
- A configuração fiscal tem 11 abas, incluindo **Reforma** e **Log Fiscal**. Os links para tabelas/fontes oficiais são auxiliares, não substituem validação contábil.
- No teste, os campos de DI, país e FCP foram preenchidos com fixture sintética e continuaram persistidos depois de navegar entre abas.

**Limite importante:** esta rodada implementa interface, campos e persistência local do rascunho. Não implementa validação jurídica/contábil automática, escolha automática de regime/alíquota ou transmissão/assinatura de NF-e/NFC-e. O contador/contador responsável deve confirmar CST, `cClassTrib`, percentuais, vigência e o XML antes de uso fiscal real.

## 4. Autenticação, Nuvem e notas de versão

- Os ajustes de autenticação permanecem no patch `ajustes_v52253_login_tela_branca_patch.js`: hash/salt são a fonte de verdade quando existem; a validação local anterior não deve prevalecer sobre eles.
- **Usuários e permissões:** a linha técnica “hierarquia: ...” foi retirada; os testes incluem lista, edição, status e validação de persistência. O falso alerta ao salvar usuário Inativo foi corrigido.
- **Nuvem:** o indicador foi rebatizado e o ponto pulsante abre o modal de diagnóstico por evento delegado (`ajustes_v52267_diagnostico_nuvem_patch.js:96+`). O modal apresenta estado/diagnóstico sem disparar gravação de negócio.
- **Notas:** `patch_notes_local.js:30+` usa uma chave local derivada da versão (`digicopy_patch_visto_<versão>`). A auditoria v7.3.14 confirma que a nota apareceu na primeira sessão e ficou escondida após recarregar; uma versão anterior marcada como vista não suprimiu a nota nova.
- **Orçamentos:** `orcamento_cloud_guard_patch.js:2-94` bloqueia/deduplica a consulta legada de `/orcamento?c=...` sem autorização.

## 5. Testes, rede e integridade do bundle

### Resultados

| Validação | Resultado |
|---|---|
| `npm test` | **14 passaram, 0 falharam, 0 omitidos** |
| Playwright `personal-ui-audit.spec.js` | **1 passou**, Chromium local |
| Rotas visuais | **23 de 23** abertas e capturadas |
| Erros de página Playwright | 0 |
| Trace de chamadas de nuvem no audit | 0 |
| Requisições de teste | 4 mocks sintéticos; 2 chamadas abortadas antes da rede |
| Fiscal | fixture apenas sintética; transmissão tentada: `false` |
| `node sync_build.js --check` | sincronização validada |
| `mobile/npm run sync` | 4 arquivos + assets/vendor; 0 referências quebradas |
| `git diff --check` / `node --check` | sem erro de sintaxe/whitespace nos arquivos verificados |

A auditoria estruturada está em [`evidence/personal-ui-audit-v7314.json`](evidence/personal-ui-audit-v7314.json). As imagens individuais da execução visual permanecem em `evidence-visual-r67/`.

### Bundle sincronizado

- `app.bundle.js`, `mobile/www/app.bundle.js` e `mobile/android/app/src/main/assets/public/app.bundle.js` têm o mesmo SHA-256: `7a38b6ce9e33cbb5322ac127491e72524edee58c3fae3c33ff93ba31a4d2ff2b`.
- O bundle foi gerado com 236 scripts. O índice desktop referencia `7.3.14-7a38b6ce9e33`.
- O canal do app móvel continua identificado separadamente como 1.0; o conteúdo ERP e seu carimbo estão sincronizados.
- A sincronização para os assets do Android foi feita a partir de `mobile/www`. **Não foi compilado APK nem executado em aparelho físico**, porque a CLI/dependências Capacitor não estavam disponíveis localmente.

### Higiene de credenciais

Exemplos de redação em testes/comentários que coincidiam com credenciais numéricas foram substituídos por marcadores claramente sintéticos (`qa-only-not-secret` e `qa-user-redaction-test`), e os bundles foram reconstruídos. A varredura local não encontrou esses fragmentos em contextos de senha/token. Nenhuma credencial real foi enviada ao browser ou incluída nos fixtures desta rodada.

## 6. Ponto pendente: modo somente local versus cloud-only

A auditoria visual revelou um limite de produto que **não foi alterado**: `cloudflare_data_sync_patch.js:409` define `modoSoNuvem(){ return true; }`. Em modo não autorizado, `ajustes_v7015_nuvem_explica_patch.js:194-197` exibe a faixa “as listas aparecem vazias”. Na fixture de QA há um contrato local sintético visível, então a frase da faixa não descreve esse cenário, embora as telas tenham carregado e os testes tenham passado.

Transformar o ERP de cloud-only em local-only mudaria onde os dados são gravados, como a fila de sincronização funciona e o que ocorre ao reconectar. **Não fiz essa mudança silenciosamente** para não mudar a política de armazenamento/dados. Para terminar essa parte do uso pessoal, falta decidir se o produto deve:

1. continuar cloud-only, mantendo a faixa informativa mas ajustando seu texto/comportamento para não afirmar falsamente que a lista está vazia; ou
2. oferecer um modo pessoal local-only explícito, com gravação local e sincronização desativada por padrão.

## 7. Estado GitHub/entrega

- O PR #33 está **fechado sem merge**. O PR #34 foi mesclado anteriormente para `arena/01a0d9c3-teste`; a branch-base verificada é o commit `1d76e536`.
- A branch local atual é `work/r67-auth-cloud-ui`; a propriedade `package.json > digicopy.branch` aponta para `arena/01a0d9c3-teste`, que é o destino apropriado de revisão.
- O novo PR [#47](https://github.com/kauangabrielcardososilva7890-afk/teste/pull/47) está **aberto em Draft**, com `work/r67-auth-cloud-ui` como head e `arena/01a0d9c3-teste` como base.
- Nenhum PR foi mesclado/fechado; não houve deploy do app nem acesso a ambiente de produção.
- A decisão do item 6 ainda é necessária antes de considerar concluída a implementação de modo pessoal local-only.

## 8. Próxima ação para outro agente

1. Obter do usuário a decisão do item 6 (cloud-only com mensagem corrigida ou modo local-only explícito).
2. Se for local-only, desenhar e testar a separação de persistência/sync em um perfil isolado antes de mudar defaults; manter o guard contra polling remoto e adicionar testes de reinicialização/reconexão.
3. Validar o build nativo Android em ambiente com Capacitor/Gradle e um dispositivo/emulador, se fizer parte do uso pessoal.
4. Não mesclar nem fechar PR sem autorização expressa do usuário.
