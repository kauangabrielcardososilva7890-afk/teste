# Handoff de QA — PR #33 — Digicopy ERP v7.3.9

**Data:** 01/10/2026  
**Repositório:** `kauangabrielcardososilva7890-afk/teste`  
**Branch:** `fix/dialogos-nativos-733`  
**Commit das correções:** `1a75e61ca3976c1f1d4f61ccfb026527d6cc2d02`  
**PR:** [#33 — fix: remover diálogos nativos dos fluxos de estorno](https://github.com/kauangabrielcardososilva7890-afk/teste/pull/33)  
**Estado final do PR:** **Fechado sem merge**, conforme solicitado.  

## Resumo executivo

A auditoria de Produtos/Recargas e Locação foi concluída em v7.3.9. Os defeitos identificados foram registrados antes das correções em `AUDITORIA_TECNICA.md`; as regressões foram acrescentadas aos testes temáticos existentes. A branch do PR recebeu o commit acima. O check remoto **Cloudflare Pages passou**. Não houve merge, deploy de produção nem alteração de Worker ou banco real.

## Escopo coberto

### Produtos e Recargas

Trabalho herdado e verificado nesta rodada: validações numéricas, isolamento por empresa em edição/exclusão, prevenção de códigos/preços inválidos ou ambíguos, coerência do modo estoque infinito, confirmação única/falha fechada e preservação de foco/cursor durante buscas. Os cenários e decisões estão registrados nas seções correspondentes da auditoria técnica.

### Locação > Contratos

- **Contratos e Impressoras:** fluxo básico de cadastro verificado anteriormente; exigência de número de série e vínculo do parque/contrato cobertos por QA/regressões existentes.
- **Leituras:** validações de campo vazio, negativo e redução abaixo do contador anterior; cálculo por medidor, leitura aberta, faturamento/estorno e impressão têm cobertura em testes temáticos existentes.
- **Chamados:** isolamento do Scanner em relação aos contadores Preto/Color; filtros Abertos/Finalizados/Cancelados/Todos; badge coerente para Cancelado/Fechado; confirmação ao remover peça; preservação de contador Preto ao editar chamado finalizado; reidratação do Color após detectar a impressora; preservação do Color histórico quando o campo está desativado.
- **Impressão:** testes/regressões existentes cobrem impressão direta do Chamado e template/saída do contrato; a rota de faturamento de Leituras também possui teste de confirmação do sistema.

## Correções finais em v7.3.9

1. Filtros de status são aplicados depois da renderização externa da lista de Chamados, mantendo o valor vazio como **Todos**.
2. Os badges refletem o estado semântico (`Aberto`, `Finalizado`, `Cancelado`, `Fechado`, entre outros), sem apresentar Cancelado como Aberto.
3. O contador Preto/Color de uma leitura é selecionado pela chave do medidor; Scanner não sobrescreve Preto.
4. Ao editar um Chamado concluído, os valores Preto e Color já salvos são reidratados após a configuração da impressora.
5. Ao salvar, Color editável vazio continua `null`; Color desativado preserva o valor histórico do Chamado existente, sem criar leitura Color em um Chamado novo.

## Verificações executadas

| Verificação | Resultado |
|---|---|
| `node test_msg_04_clientes.js` | **29 seções passaram**, 0 falhas |
| `npm test` | **11 passaram**, 0 falharam, 1 não rodou por falta de `jsdom` |
| `npm run check` | Bundle coerente: **233 scripts**; SHA-256 do `app.bundle.js`: `a277a9f569addf52e267a557bc33ee840856a5ee31246f0d4d24f8f1cd84a433` |
| `npm run sync:check` | **Sync OK v7.3.9**, 233 scripts no bundle, 0 soltos, 13 entradas em `build.files` |
| `git diff --check` | OK |
| Check remoto do PR | **Cloudflare Pages — pass** |

O único teste não executado depende da instalação de `jsdom`; não foi reportado como falha de produto.

## Validação visual e limitação da sessão final

A build local v7.3.9 foi aberta no navegador isolado do Sandbox. Foi possível confirmar a navegação até **Locação > Contratos**. Nesta origem temporária, porém, o sistema mostrou o portão obrigatório de primeira conexão com a nuvem e, sem essa conexão, manteve as listas vazias.

Nenhuma credencial foi solicitada, fornecida ou inserida. Para preservar o limite de segurança, não conectei a nuvem nem tentei acessar dados reais. No browser de QA, chamadas de API observadas após a instalação do interceptor (`/v1/snapshot`, `/v1/status`, `/v1/changes`) foram bloqueadas localmente antes do envio; houve **zero chamadas a `saveDB`**. O armazenamento local da origem temporária e os fixtures sintéticos foram limpos ao final.

Assim, as regras novas de Color passaram por regressão pura e a reprodução da falha anterior está registrada em `AUDITORIA_TECNICA.md` (§54.1–§54.3), mas o fluxo de salvar Color desativado **não foi reexecutado visualmente no build final** nesta origem sem autorização de nuvem. A auditoria não afirma cobertura visual final onde a autenticação impediu o fluxo.

## Notas de release e encerramento

- Versão final: **v7.3.9**; bundle e cópia `mobile/www` sincronizados mecanicamente.
- `sync:check` manteve o aviso de divergência entre `package.json > digicopy.branch` (`arena/01a0d9c3-teste`) e a branch do PR (`fix/dialogos-nativos-733`). O metadado foi deixado intacto para não redirecionar links de download/publicação para outra branch.
- As mudanças foram enviadas explicitamente à branch do PR; não foi usado `npm run guardar`.
- PR #33 foi fechado **sem merge**, de acordo com a instrução do usuário. Nenhum deploy de produção foi feito.

Para a trilha de evidências, defeitos e decisões de correção, consulte [`AUDITORIA_TECNICA.md`](./AUDITORIA_TECNICA.md).

---

## Reforço de handoff — sessão `arena/01a0d9c3-teste` (01/10/2026, depois do PR #34)

### Estado do versionamento (conferido, não narrado)

- PR #34 (`fix/dialogos-nativos-733` → `arena/01a0d9c3-teste`) **mesclado** em 01/10/2026 18:23:36Z → merge commit `ac15daa8b56b42289a1f187ebab8d34f4353ac04` (7 commits, 35 arquivos, +1868/−423).
- App **v7.3.9**; `app.bundle.js` SHA-256 `36c2da9d63405e2f…` = `package.json > digicopy.bundleSha256Expected`; manifest com 233 scripts.
- Suíte no ponto do merge: `node test_runner.js` → **11 passaram, 0 falharam, 1 pulada** (`test_msg_11_jsdom.js` — sem `jsdom` no sandbox). `npm run sync:check` → OK.
- Árvore local comparada com `ac15daa` por `diff -rq` de um worktree temporário: **idêntica** (só `teste-auto/` é scratch, fora do versionamento).

### Publicação do site — o "problema engraçado", já provado por A+B

| Medição | Como | Resultado |
|---|---|---|
| Merge no GitHub | `gh pr view 34`, `git ls-remote` | ✅ branch em `ac15daa8`, 7.3.9 |
| Deploy automático da branch | `arena-01a0d9c3-teste.teste-60f.pages.dev/package.json` e `/HANDOFF_PR33_v7.3.9.md` | ✅ **7.3.9 já no ar** no alias da branch |
| Link principal | `teste-60f.pages.dev/package.json` (com `?cb=`) | ❌ ainda **7.3.3** |
| Cache do navegador? | `_headers` → `Cache-Control: no-cache` + requisição cache-busted | ❌ **não** é cache |

- **Causa:** o *Production branch* do projeto Pages `teste-60f` era outra branch (o projeto nasceu em 12/09/2026 com produção em `arena/01a0683d-teste` — ver `RELATORIO_SESSAO.md`, seção "NUVEM: GitHack → Cloudflare Pages"). Para o Pages, push em branch que **não** é a de produção gera só preview; por isso o merge apareceu no alias e não no link principal.
- **Detalhe que custa caro:** mudar a Production branch no painel **não dispara build nenhum** — ela vale para o *próximo* push. A cura é: trocar a branch **e** empurrar um commit (ou `Deployments → ⋯ → Switch to this deployment`).
- Este arquivo foi comitado e empurrado nesta branch exatamente para servir de **gatilho** do build de produção (só docs: nada de código mudou, o app publicado continua byte a byte o do merge `ac15daa`).
- Limitação honesta: o sandbox não tem credencial Cloudflare (sem `CLOUDFLARE_*` no ambiente, `wrangler` não instalado) e o repo não tem workflow nem script de deploy — quem vê a fila de builds e o log de falha é o painel do dono. Confirmação de sucesso: rodapé de `https://teste-60f.pages.dev` com **Ctrl+F5** = **v7.3.9** e `app.bundle.js?v=7.3.9-36c2da9d6340`.

### Continuidade (nada disso foi esquecido)

1. ~~§47 (contador de Leituras sem validação)~~ — **FECHADO na r66**, v7.3.10: ver §47.3 e §55.1 da auditoria.
2. Prova de **toque no celular** do submenu de Cadastros (r64): não executada.
3. Adiados para depois de sexta: redesenho das telas apertadas, revisão do corte de botões, ciclo E2E completo, nuvem PURO.
4. `package.json > digicopy.branch` continua `arena/01a0d9c3-teste` — não mexer para não redirecionar link de download/publicação.
5. Regras permanentes: senha de conexão ≠ senha de gerente; nunca token, senha, CSC ou certificado no repositório, no guia ou no chat; criar arquivo só quando o serviço não sai sem ele.


## Reforço r66 — v7.3.10 (01/10/2026, mesma sessão, depois do deploy do 7.3.9)

Ordem dele: *"já faça tudo o que está pendente, menos os outros sistemas tipo celular, comercial"*.

| Item pendente | O que saiu desta rodada |
|---|---|
| **§47 Leituras** (contador sem validação) | **Corrigido.** `leitura_detalhada_departamentos_patch.js` v4.9.48: validador puro `validarContadorLancamento` (exportado no `LEITURA_DETALHADA_DEPARTAMENTOS_PURE`) + `min=0 step=1 inputmode=numeric` no campo. Vazio, letra, decimal, negativo, acima de inteiro seguro e abaixo do anterior = **falha fechada** (nada gravado, parque vivo intacto, modal aberto). Teste novo: seção `test_r66_contador_leitura.js` em `test_msg_04_clientes.js` (27 asserções puras + integração). |
| **Revisão do corte de botões** | **Feita com varredura.** 5 handlers inline chamavam função inexistente no bundle: os 3 do "baixa múltipla" do Financeiro foram **removidos** (a etiqueta EXTORNADO ficou) e os 2 do seletor de impressora da OS foram **religados** ao `autoPreencherDadosChamado` que já existia. `auditar_mortos.js`: 0 testes órfãos, 233 no bundle de 266 .js. |
| **Telas apertadas** | **Começado pelo que prende botão:** `menus_tela_pequena_patch.js` v5.22.69 passou a cuidar do modal (corpo rola, caixa presa a 94/96`vh`, grades → `auto-fit` ≤1200px e coluna única ≤820px, sem cor fixa para não furar o modo escuro). Regressão: seção `test_r66_telas_e_botoes.js` em `test_msg_05_telas.js`. **O resto do redesenho depende dos prints dele** (qual tela ainda corta informação) — sem navegador de layout aqui. |
| **Ciclo E2E** | Rodado o que roda aqui: `npm test` (11 ✅ / 0 ❌ / 1 pulado), `npm run check` (bundle + `node --check` em tudo), `mapa_camadas`, `auditar_mortos`. **O E2E de `jsdom` não roda neste sandbox**: `npm install` não tem saída de rede para o registry. No PC dele: `npm install` e `node test_msg_11_jsdom.js`. |
| **Nuvem PURO** | **Verificado, sem código novo** — e é decisão de operação, não pendência de programa. O corte existe (`🔒 Texto-puro` → `db.config.seguranca.corteTextoPuro`), o envio já risca `senha` de `usuarios`/`empresas` quando ligado, o Worker só aceita a prova velha enquanto houver `senha` no registro, e há teste (`test_msg_09_login.js:674-677)). Ligar com PC da loja ainda no app velho trava login → fica com o dono, depois de todos atualizados e senhas trocadas. |
| **Celular / comercial** | **Fora por ordem dele.** Só o `mobile/sync-www.js` mecânico (cópia do bundle no `www`) para a cópia não ficar divergindo; nada de APK, toque no Cadastros, ou loja de apps. |

Estado do build publicado nesta rodada: **v7.3.10**, `app.bundle.js` sha256 `c5d909a40abc31d1`, 233 scripts, manifest sem mudança de contagem, `sync:check` OK, suíte 11 ✅ / 0 ❌. Commit desta rodada = gatilho do build de produção do Pages (a regra aprendida na r65 está registrada acima: trocar a Production branch não republica sozinho).


## Reforço r67 — v7.3.11 (01/10/2026, depois das 19:40Z): o relatório do QA externo virou código

Conferi o relatório dele ponto a ponto (tudo verídico, inclusive as citações de linha; duas frases dele já envelheceram porque a r66 tinha saído 15 minutos antes — ver §56.1). Do que era acionável, apliquei dois pontos, sem tocar no mecanismo de sincronização:

- **o estado mudo que ele achou agora fala**: `ajustes_v7015_nuvem_explica_patch.js` caso 1b — sem token do aparelho **e** com escrita local pendente, a faixa diz "fica só neste navegador e não aparece em outro PC (N esperando o envio)" com "Conectar agora". Sem escrita pendente, fica calada.
- **o "mandar erro" passa a levar a nuvem no topo**: `ajustes_v7020_mandar_erro_patch.js` acrescenta `nuvem: conectado=… | fila=… | so-aqui=… | cursor=… | ultimoOk=… | ultimoErro=… | freioAte=…`, tudo pelo `redigir()` (nenhuma credencial sai). Isso é o que faltava para o print dele responder sozinho a pergunta "salvou e perdeu, ou o PC está desconectado?".
- **a pergunta em aberto dele foi respondida estaticamente**: não existe handler de negócio que grave no `db` e esqueça de persistir — os 27 suspeitos da varredura são ajudantes de migração salvos pelo agregador (prova nas linhas citadas da §56.1).
- Novo teste: `test_r67_nuvem_sem_token_fala.js` em `test_msg_02_nuvem.js` (23 asserções). Contagem de avisos do `test_faixa_botoes_r46.js`: 5 → 6.
- Estado do build: **v7.3.11**, bundle sha `617d53cac6cc`, suíte 11 ✅ / 0 ❌ / 1 pulada (`jsdom` — sem egress de rede no sandbox; no PC dele: `npm install && node test_msg_11_jsdom.js`). O push desta rodada é o gatilho do build do Pages.
- Continua **fora por ordem dele**: celular/APK e a frente comercial. Continua **com o dono**: ligar o corte 🔒 Texto-puro (código e teste prontos desde a r54; é operação, não pendência) e os prints das telas que ainda cortam informação para o resto do redesenho.
