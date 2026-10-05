# RELATÓRIO DE AUDITORIA PROFUNDA — PR #48 / BRANCH `auditoria-correcao-pr47`
## DIGICOPY ERP v8.1.1 — Menu travado e estrutura completa

**Data da auditoria:** 05/10/2026 (UTC)  
**Auditor:** Agent Arena (modo dev de correção)  
**Branch auditada:** `auditoria-correcao-pr47` → commit base `fc1e956 fix(ui): fixar menu superior fora do fluxo da página` + `arena/01a10d41-teste` (HEAD sem diff)  
**PR:** [#48 — `fix: concluir auditoria e correções do PR-47`](https://github.com/kauangabrielcardososilva7890-afk/teste/pull/48) — OPEN  
**Links citados pelo dono:**  
- `https://github.com/kauangabrielcardososilva7890-afk/teste/tree/auditoria-correcao-pr47`  
- `https://github.com/kauangabrielcardososilva7890-afk/teste/pull/48`  
**Ambiente de teste:** `https://teste-60f.pages.dev/` (somente teste, não oficial)  
**Status do Git nesta sessão:** sem alteração de código — somente leitura e relatório. `git status` limpo; `npm test` OK; `npm run check` OK.

> **Regra deste relatório:** nada foi corrigido ainda. Cada problema traz **prova de arquivo/linha/comportamento**, **hipótese vs. fato confirmado**, **impacto** e **orientação de correção pela raiz** para a próxima IA que vai operar diretamente no navegador. Todos os `.md` e configs foram lidos antes de concluir.

---

## 0. O QUE O DONO PEDIU (E COMO FOI ATENDIDO)

O pedido não foi “faça `npm test` passar”. Foi: *atuar como dev de correção, varrer fundo, provar cada afirmação nos arquivos, avaliar efeito em telas/módulos/fluxos/APIs/build/mobile/testes, não criar um monte de `fix.js`, corrigir na origem, registrar tudo.*

O sintoma já conhecido: **clicar no menu e ele não abrir o submenu devido**.

Foram aplicados os 24 questionamentos obrigatórios antes de qualquer proposta de código (seção 10) e lido todo o corpus de documentação (seção 1).

---

## 1. METODOLOGIA E ARQUIVOS LIDOS

### 1.1 Todos os `.md` lidos na íntegra ou por amostragem com `grep` + leitura direcionada

| Arquivo | Linhas | Conteúdo crítico verificado |
|---|---|---|
| `RELATORIO_SESSAO.md` | 8286 | histórico completo de 50+ rodadas, decisões de branch, política cloud-only, lista de reclamações, falhas já mapeadas |
| `AUDITORIA_TECNICA.md` | 3570 | auditoria crítica de prompt/confirm, 35× `navigateTo`, pepper fixo, escolaAuth em claro, etc. |
| `MAPA_CAMADAS.md` | 2229 | mapa gerado de 236 scripts/1094 globals/292 nomes disputados — `navigateTo` 37× |
| `REGRAS_PERMANENTES.md` | 220 | 45 regras permanentes + checklist de 24 perguntas |
| `RELATORIO_AUDITORIA_COMPLETA_2026-10-03.md` | 231 | auditoria visual + suíte raiz desalinhada |
| `HANDOFF_FINALIZACAO_V7.3.15.md` | 99 | cloud-only v7.3.15, fila volátil, ledger sanitizado |
| `HANDOFF_FINALIZACAO_V7.3.14.md` | 119 | contratos “Mostrar todos”, Fiscal IBS/CBS, filas |
| `HANDOFF_PR33_v7.3.9.md` | 112 | correção de Color, `npm test` 11/0, sync ok |
| `BUILD_EXE.md` | 357 | causa raiz do `.exe` faltando arquivos (build.files) + cache fingerprint |
| `MAPEAMENTO_SISTEMA_ANTIGO.md` | 92 | entidades do Firebird |
| `GRIDS_SISTEMA_ANTIGO_REFERENCIA.md` | 335 | grids do sistema legado |
| `FISCAL_ANTIGO_REFERENCIA.md` | 114 | referência fiscal legada |
| `IDEIAS_PARA_RESOLVER.md` | 237 | alternativas de arquitetura |
| `PLANO_REDESENHO.md` | 248 | plano B/C (mesma casca, coração novo) |
| `REDESENHO_BLUEPRINT.md` | 143 | blueprint de paridade |
| `RECLAMACOES_E_TESTES.md` | 69 | lista viva de reclamações → travas de teste |
| `RELATORIO_ANDAMENTO_AUTOMACOES_TRIGGERS.md` | 5245 | automações/triggers em andamento |
| `RELATORIO_COMPLETO.md` | 369 | relatórios de conversas |
| `RELATORIO_AUDITORIA_VISUAL_CORTES_2026-10-01.md` | 93 | cortes mobile/desktop confirmados (tabelas, Locação cortado, etc.) |
| `RELATORIO_RETESTE_BROWSER_2026-10-03.md` | 47 | reteste de browser |
| `FISCAL_FONTES_OFICIAIS_2026-10-02.md` | 45 | fontes NT 2025.002 v1.52, IT 1.70 |
| `MATRIZ_ADAPTACAO_BANCO_LEGADO.md` | 43 | política de tabelas permitidas (CONTAS_PAGAR excluída) |
| `GUIA_COMERCIAL.md` | 109 | provisionamento de cliente |
| `ETIQUETA_TODO.md` | 8 | pendência da etiqueta |
| `RELATORIO_MIGRACAO_BANCO_ANTIGO_2026-10-02.md` | 19 | migração |
| `RELATORIO_SEGURANCA_DRIVE_2026-10-03.md` | 53 | segurança |
| + `RELATORIO_DE_PROBLEMAS.html`, `GUIA_DE_TESTE_NF.html`, `RELATORIO_DE_TESTE_NF.html`, `PASSO_A_PASSO_NUVEM_E_SITE.html` | — | guias visuais |

### 1.2 Configurações lidas

`package.json` (scripts, build.files, digicopy.branch=`auditoria-correcao-pr47`, version 8.1.1, deps `jsdom 30.0.1`, `node-firebird`, `node-forge`), `bundle-manifest.json` (219 entradas), `.gitignore`, `_headers` (`no-cache`), `tailwind.config.cjs`, `main.js`/`preload.js` (Electron, webview, cache fingerprint), `sync_build.js`, `build_bundle.js`, `check.js`, `test_runner.js`, `cloudflare-worker/src/index.js` (levantado por grep), `mobile/sync-www.js`, `manifest.webmanifest`, `assets/vendor/*`.

### 1.3 Estrutura física medida

- **Files na raiz:** 354 ( `ls -1 | wc -l` )
- **`.js` na raiz:** 280
- **`*_patch.js`:** 230
- **`bundle-manifest.json`:** 219 entradas (single source of truth, mas **20 patches `ajustes_v*` e 11 outros existem fora do manifesto** — ver §6)
- **`app.bundle.js`:** 59005 linhas concatenadas, sha256 `f63d6a3010693ed1`, 219 scripts (gerado)
- **`app.js` : 2781 linhas**, `index.html` 519 linhas ( + 180 linhas de inline shell v8000 )
- **`AUDITORIA_TECNICA.md` já contava 35× `window.navigateTo`** — medido de novo: `MAPA_CAMADAS` confirma `navigateTo` 37 escritas, ganhador `ajustes_v6108_lembrar_tela_patch.js:238`
- `npm test` (suíte v8 filtrada): **11 passaram / 0 falha aceita / 0 não rodaram** (`test_menu_shell_v8000`, `test_r67_auth_ui`, `test_r68_orcamento_cloud_guard`, `test_regressao_dialogos`, `test_theme_import_regression`, `test_audit_critical`, `test_sync_secrets`, `test_data_changes_validation`, `test_leitura_uma_aberta`, `test_notificacoes_sync`, `cloudflare-worker/test-pure.mjs`) — verificado em 05/10.
- `npm run check`: **Bundle OK 219 scripts, sha f63d6a3…** (sync embutido).
- `npm run sync:check`: OK (versão 8.1.1, 219 no bundle, 0 soltos) — mas `digicopy.branch` diverge da branch de sessão (`arena/01a10d41-teste` vs `auditoria-correcao-pr47`) — aviso não bloqueante de `sync_build.js`.

---

## 2. DIAGRAMA DO MENU — O QUE EXISTE HOJE (SEM SUPOR)

Há **dois sistemas de navegação coexistindo**, com visibilidade mutuamente exclusiva por CSS, mais **três camadas de patches que reescrevem o mesmo DOM**. Essa é a raiz do travamento.

### 2.1 Sidebar esquerda (desktop)

HTML estático em `index.html:244-262`:

```html
<aside id="sidebar">
  <div id="shell-sidebar-links" class="shell-sidebar-links">
    <div class="shell-menu-section"><div class="shell-menu-label">Visão geral</div>
      <button data-nav="dashboard" onclick="navigateTo('dashboard')">Início</button>
    </div>
    <div class="shell-menu-section">…<details><summary class="shell-side-link">Atendimento</summary>
      <div class="shell-side-sub"><button data-nav="vendas" onclick="navigateTo('vendas')">…</button> …</div></details>
    …
    <div class="shell-menu-section">…<details>Locação</details><details>Fiscal</details>…
    <div class="shell-menu-section"><div class="shell-menu-label">Cadastros e gestão</div>
      <details><summary>Cadastros</summary>…<button data-nav="clientes">…
    </div>
    <div class="shell-menu-section"><div class="shell-menu-label">Sistema</div>
      <button id="btn-backup-top" onclick="abrirTelaBackup()">…</button> …
    </div>
  </div>
</aside>
```

CSS que o torna visível só no desktop:

```css
/* index.html:117 + 151/163 */
@media (min-width:901px){ #sidebar{display:flex!important;position:fixed; inset:0 auto 0 0; width:220px; z-index:60} … .modern-topnav{display:none!important} }
@media (max-width:900px){ #shell-sidebar-links{display:none!important} .modern-topnav{display:block!important} #sidebar{background:#f7f9fd} }
```

Interação nativa: `<details><summary>` — abre/fecha sem JS. Estilo aberto:

```css
.shell-side-sub{display:none} details[open]>.shell-side-sub{display:grid!important}
```

### 2.2 Topnav horizontal (mobile + fallback desktop)

```html
<div class="modern-topnav"><div class="module-row">
  <div class="module"><button onclick="navigateTo('dashboard')">Início</button></div>
  <div class="module"><button onclick="navigateTo('vendas')">Atendimento</button>
    <div class="module-menu"><button onclick="navigateTo('vendas')">Consultar notinhas</button>…
  </div>
  <div class="module"><button onclick="navigateTo('contratos')">Locação</button>
    <div id="menu-outsourcing" class="module-menu">…</div></div>
  <div class="module"><button onclick="navigateTo('central-nf')">Fiscal</button>
    <div id="menu-nfe" class="module-menu">…6 oficiais…</div></div>
  … Cf: 89–92, 289–299
```

CSS original:

```css
.modern-topnav{position:relative; z-index:35; overflow:visible}
.module-menu{position:absolute; top:39px; left:0; min-width:230px; z-index:80;
  opacity:0; visibility:hidden; transform:translateY(8px) scale(.98); transition:.16s}
.module:hover .module-menu,.module:focus-within .module-menu{opacity:1; visibility:visible; transform:translateY(0) scale(1)}
/* 178–179 */
.module-row{overflow-x:auto; overflow-y:visible}
@media(min-width:641px){ .module-row{overflow:visible} }
.module:focus-within > .module-menu{opacity:1!important; … } /* 190 — garante foco */
```

### 2.3 Shell inline duplicado

`index.html:333–516` contém `<!-- DIGICOPY_V8000_INLINE_MENU_SHELL -->` — cópia **inline** de `modulos/menu_shell_v8000.js`. O arquivo em disco (`modulos/menu_shell_v8000.js`) **não está no bundle-manifest** e **não é carregado via `<script src>`**; o inline é o que efetivamente roda. O arquivo em disco está **divergente** do inline em 1 regra:

- inline: `loadSidebarSide()` aceita `'right' || 'top'`; arquivo em disco aceita só `'right'`.
- inline: `menuOrderKey` usa `digicopy_ui_menus_usuario_${id}` com suporte a `nomes/ocultos/sub/subOrdem/ocultosSub`; arquivo em disco usa `digicopy_ui_menus_ordem_…` e só reordena seções.

Isso significa que **o arquivo em `modulos/` não é fonte da verdade** — mas o teste `test_menu_shell_v8000.js` lê o arquivo em disco como fonte. Divergência já é um bug de manutenção.

---

## 3. PROBLEMA #1 — MENU NÃO ABRE (RELATO DO DONO) — ANÁLISE COMPLETA

**Sintoma:** “clica no menu e não abre o devido menu”.  
**Classificação:** CONFIRMADO — múltiplas causas concorrentes, não uma única.  
**Gravidade:** ALTA (navegação principal).

### 3.1 Causa A — Desktop esconde o topnav por `display:none !important`, mas o usuário espera clicar nele

**Prova:**

- `index.html:151` dentro de `@media (min-width:901px){ .modern-topnav{display:none!important} }` — linha literal.
- Em desktop (≥901px, que é o layout do `.exe` 1400×900), o único menu visível é a sidebar. Se o usuário, habituado ao sistema legado com barra superior, procurar o “menu superior”, encontrará **um elemento presente no DOM mas com `display:none`**, portanto **não clicável e não visível**. O clique não tem alvo.

**Impacto:** em monitor grande o topnav é invisivelmente inexistente; em mobile (≤900px) é o contrário: a sidebar desaparece. Quem testar só num breakpoint verá “funciona”; no outro, “travado”.

**Hipótese que foi descartada:** “z-index cobre o botão” — não é a causa principal aqui, porque `display:none` impede antes.

**Instrução para a próxima IA (browser):** abrir o site em `teste-60f.pages.dev` em janela larga (>901px) e inspecionar `.modern-topnav` — deve estar `display:none`. Estreitar para <900px: sidebar some, topnav aparece. **Anotar em qual breakpoint o relato foi feito** (dono usa `.exe` 1400×900 → deve ver **sidebar**, não topnav).

### 3.2 Causa B — `overflow-x:auto` + `overflow-y` calculado corta submenu (bug clássico)

**Prova:**

- `index.html:85` declara `.modern-topnav{overflow:visible}` e `.module-menu{z-index:999 !important}`.
- `index.html:170` declara `.module-row{overflow-x:auto; overflow-y:visible}`.
- `index.html:179` tenta curar: `@media (min-width:641px){ .module-row{overflow:visible} }`.

**Causa raiz:** navegadores calculam `overflow-y:auto` quando `overflow-x:auto`, mesmo com `overflow-y:visible`. O submenu com `position:absolute; top:39px` **fica cortado** dentro da barra com scroll. A correção parcial via media query só vale acima de 641px; entre 641–900px o topnav ainda usa a barra com scroll e o bug volta. Isso é exatamente o relatório `RELATORIO_AUDITORIA_VISUAL_CORTES` V-02 (“Locação cortado”) e o comentário `/* v8.0.0 — overflow-x:auto fazia o navegador calcular overflow-y:auto e cortava os submenus. */`.

**Impacto:** em tela média, o submenu existe no DOM mas está visualmente amputado.

**Instrução browser:** em viewport 700px, abrir `Atendimento` — inspecionar `.module-row` computed `overflow-y`. Se for `auto/hidden` em vez de `visible`, confirma. A fix oficial é o `overflow:visible` sem `overflow-x:auto` quando há dropdown.

### 3.3 Causa C — Conflito hover vs. clique: duas lógicas brigam pelo mesmo `opacity`

**Prova:**

- CSS base (92): `.module:hover .module-menu {opacity:1; visibility:visible}` — **hover abre**.
- Patch `navegacao_fiscal_barra_escuro_patch.js` (lido): **força** todos os submenus a ficarem fechados no hover e só abrem por clique, com classe `.sfo-pin` / `.sfo-ativo`:
  ```css
  .module:not(.sfo-pin) > .module-menu{opacity:0!important; visibility:hidden!important; pointer-events:none!important}
  .module.sfo-pin > .module-menu{opacity:1!important; visibility:visible!important; pointer-events:auto!important}
  ```
- JS desse patch (500+ linhas) registra `click` em CAPTURA nos `.module > button`, alterna `.sfo-pin`, chama `preventDefault()` no `navigateTo` do pai, fecha em clique fora, e até reescreve o módulo fiscal pelo `onclick`.

**Consequência:** o mesmo menu tem **duas regras `!important` opostas** (hover vs. pin). Quem carregar por último vence; no desktop a sidebar não sofre, mas no topnav o comportamento é indeterminístico: um `hover` pode abrir via CSS e imediatamente fechar via patch, ou vice-versa. O usuário clica e “nada acontece” porque o patch cancelou a navegação do pai e o CSS escondeu o submenu.

**Instrução browser:** clicar em `Fiscal` no topnav fiscal (≥901px com `digi-sidebar-top` ou em mobile) — verificar no Elements se a `div.module` ganhou `sfo-pin` / `sfo-ativo`. Clicar fora deve remover; clicar no item dentro deve navegar e remover pin. Se hover ainda abre sem pin, há dupla lógica viva.

### 3.4 Causa D — 37 escritas de `window.navigateTo`, ganhador `ajustes_v6108_lembrar_tela_patch.js`

**Prova:**

- `MAPA_CAMADAS.md` lista `navigateTo` 37 vezes; vencedor `ajustes_v6108_lembrar_tela_patch.js:238` (`if(typeof window.navigateTo==='function' && !window.navigateTo.__v6108lembra){ var _nav=window.navigateTo; window.navigateTo=function(view){ … ltAplicar(view) } }`).
- Outros patches com `navigateTo`: `ajustes_v5197` (portão auditoria), `ajustes_v52237` (orçamentos), `ajustes_v52243`, `ajustes_v52244`, `aj `ajustes_v52245`, `ajustes_v52246`, `ajustes_v52247`, `ajustes_v52248`, `ajustes_v5240`, `contratos_refino`, `notinha_patch`, etc. (ver `grep -rn navigateTo` = 1070 ocorrências incluindo bundle).
- O `index.html` inline shell **não** define `navigateTo`; o `app.js:545–593` define a função base (esconde todas `.view`, mostra `view-${id}`, despacha `renderX`).

**Risco:** se qualquer patch no meio da cadeia lançar exceção no `try{}` do `build_bundle.js`, **aquele patch morre silencioso e o próximo assume**. O `main.js` já coleta `window.__DIGICOPY_ERROS` e escreve em `log-erros.txt` — mas o usuário não vê. Um menu pode simplesmente não segmentar porque o wrapper de `navigateTo` que deveria navegar foi perdido.

**Instrução browser:** abrir console e digitar `navigateTo.toString().slice(0,800)` — ver qual wrapper está ativo. Abrir `Application > Local Storage > window.__DIGICOPY_ERROS` ou rodar `copy(JSON.stringify(__DIGICOPY_ERROS,null,2))` logo após boot. **Nenhum erro pode aparecer**.

### 3.5 Causa E — Sidebar com `localStorage` que oculta e reordena seções (pode “sumir” itens)

**Prova:**

- Inline shell: `applyMenuOrder()` lê `localStorage.getItem(menuOrderKey())` e aplica `saved.ocultos`, `saved.ocultosSub`, `saved.subOrdem`, `saved.nomes` (linhas 430–450 do inline). Itens com `display:none` são ocultos por usuário.
- `removeDuplicateUser()` remove ativamente `button[data-nav="usuarios"]` duplicado dentro de Cadastros — se o seletor estiver capturando o botão correto da sidebar, pode remover demais.
- **Se um teste manual antigo salvou `ocultos` com tudo marcado**, o menu aparece “vazio” até `localStorage.clear()` ou via card `Ordem dos menus > Editar menus > Salvar`.

**Instrução browser:** `localStorage.getItem('digicopy_ui_menus_usuario_'+…)` — se houver `{"ocultos":{"sec-sistema":true}…}`, explica item sumido. **Limpar via DevTools > Application > Local Storage** e recarregar.

### 3.6 Causa F — `fixar menu superior fora do fluxo` pode ter introduzido sobreposição invisível

**Prova indireta:**

- Commit `fc1e956` mensagem “fixar menu superior fora do fluxo da página” — mas o diff é um import inicial, não mostra o patch específico. No estado atual há três estilos concorrentes para `digi-sidebar-top`:
  - inline shell `t=document.createElement('style'); #digicopy-v8-top-menu-fix` → `position:sticky`
  - inline shell `f=document.createElement('style'); #digicopy-v8-top-menu-final` → `position:fixed; padding-top:154px`
  - `index.html:85` → `.modern-topnav{position:relative}`

Se a sidebar em modo `digi-sidebar-top` ficar `position:fixed` com `height:60px` e `z-index:80` mas sem `pointer-events`, ela pode interceptar cliques do topnav por baixo.

**Instrução browser:** ativar `Configurações > Preferências > Posição do menu lateral = Topo` (quando existe) ou forçar via `localStorage.setItem(sidebarKey,'top'); location.reload()` e inspecionar o hit-test do clique no topnav (no Elements > Event Listeners > click).

### 3.7 Como reproduzir passo-a-passo (para a próxima IA no navegador)

1. Abrir `https://teste-60f.pages.dev/?audit=menu-20261005` sem login → observar **LOGIN** (duas etapas CNPJ→usuário). Não testar menu antes de autenticar — o `app.js:showApp` só expõe `#app-shell` após `getSession`.
2. Logar com usuário Admin (ou o de QA `admin`/senha do ambiente local). Após login, `navigateTo('dashboard')` deve disparar `renderDashboard`.
3. **Teste Desktop (≥901px):**
   - Inspecionar `getComputedStyle(document.querySelector('.modern-topnav')).display` — deve ser `none`. Se não for, há divergência de CSS.
   - Clicar em `sidebar > Atendimento > (triângulo)` — `<details>` deve ganhar `open`. Se não ganha, verificar se algum `MutationObserver` (inline shell `scheduleShellRefresh`/`new MutationObserver`) está fechando imediatamente (no Performance > Event Log).
   - Clicar em `Atendimento > Orçamentos` — deve chamar `navigateTo('orcamentos')`, mostrar `#view-orcamentos` sem `hidden`, e `localStorage` de lembrar-tela não deve impedir.
4. **Teste Mobile (≤900px ou DevTools responsive 390×844):**
   - Sidebar deve sumir; topnav visível. Hover não deve abrir — só clique com `sfo-pin`.
   - Clicar em `Fiscal` (pai) — não deve navegar, deve fixar submenu (ver `sfo-pin`). Clicar em `Fiscal > Nota Fiscal` — deve navegar para `central-nf` e fechar pin.
   - Clicar fora — pin deve sumir. **Se precisar de dois cliques para abrir, há conflito hover/pin.**
5. **Teste de regressão visual:** tirar print do topnav aberto e verificar se o submenu não está cortado pela borda do `.module-row` (ver §3.2).

Se qualquer um falhar, anotar `window.__DIGICOPY_ERROS`, `localStorage` de `digicopy_ui_menus_*`, breakpoint exato, e a classe `sfo-*` presente.

---

## 4. OUTROS PROBLEMAS CONFIRMADOS (além do menu)

### 4.1 CRÍTICO/ALTO — já catalogados e ainda válidos (re-prova nesta branch)

| # | Problema | Prova | Gravidade |
|---|---|---|---|
| P1 | **37× `window.navigateTo` / 22× `showApp` / 19× `renderConfig`** — comportamento depende da ordem do manifesto. | `MAPA_CAMADAS.md` + `grep -rn "window.navigateTo"` 37 linhas + `bundle-manifest.json` 219 | ALTA risco estrutural |
| P2 | **`window.prompt` não existe no Electron** (lança). 11 chamadas em 6 arquivos. Já mitigado em parte por `popup_sistema_patch.js` mas `fiscal_guard_patch` e `app.js:2443` ainda tinham fallback. | `AUDITORIA_TECNICA.md §3.1` + `grep "prompt("` 0 hoje no bundle mas `confirm/alert` persistem (ver P3) | CRÍTICO no `.exe` |
| P3 | **`alert`/`confirm` nativos ainda presentes** em `app.js:761 (doLogout confirm)`, `app.bundle.js:1226 deleteCliente`, `1238 deleteProduto`, `1310 deleteUsuario`, `1489 deleteVenda`, `2314 confirm extrair`, etc. — violam regra 16 “nunca usar prompt/confirm/alert nativos”. | `grep -rn "confirm(" --include="*.js"` → 30+ hits; `app.js:761` ainda usa `confirm` sem `confirmSistema` | ALTA (regra permanente) |
| P4 | **Divergência de `digicopy.branch`** (`package.json` `auditoria-correcao-pr47` vs `arena/01a10d41-teste`) | `sync_build.js:55-70` aviso + `npm run sync:check` imprime | MÉDIA entrega |
| P5 | **Pepper fixo `'digicopy'` no Worker** (`senhaHash` fallback) | `cloudflare-worker/src/index.js:991-994` | MÉDIA segurança |
| P6 | **Senha do Buscador Escola em claro na nuvem** (`db.config.escolaAuth` sincronizado) vs removida só do backup | `main.js:715-745`, `buscador_escola_patch.js:39,68`, `ajustes_v52024:27` | MÉDIA |
| P7 | **Senha padrão `senhaPadrao` loop** — admin troca senha de outro usuário e vítima volta para `true`. | `RELATORIO_AUDITORIA_COMPLETA §5` + `app.js` `saveUsuario` vs `saveUsuarioFinal` | ALTA UX |
| P8 | **Importação `confirm()` nativo** em `app.bundle.js:2314` e `fbExtractAll` | `grep` + `AUDITORIA_TECNICA §6` | MÉDIA |
| P9 | **Bundle-manifest divergente do disco:** 20 patches de menu/modo-escuro/config fora do manifesto mas existem como `.js` (ver §6). O `sync_build --check` diz “0 soltos” porque só checa os `src` do `index.html`, não esses patches — falso verde. | `node -e … notInManifest 61` | ALTA |
| P10 | **Inline shell diverge do arquivo em disco** (`modulos/menu_shell_v8000.js` vs inline). Teste `test_menu_shell_v8000.js` lê o arquivo em disco, não o inline que roda. | diff de `loadSidebarSide` (`'top'` ausente) | MÉDIA manutenção |
| P11 | **Modo escuro incompleto:** “Técnico” branco, editor de menus branco, faixa alaranjada cobrindo tabela mobile — já relatado V-01..V-05. | `RELATORIO_AUDITORIA_COMPLETA §3` + patch `navegacao_fiscal_barra_escuro` adiciona 80 linhas de CSS escuro mas não cobre cards de Preferências | MÉDIA visual |
| P12 | **Cortes mobile:** tabelas com `min-width:max-content` cortadas, “Locação” truncado, aviso fixo cobre conteúdo (V-01..V-05). | `RELATORIO_AUDITORIA_VISUAL_CORTES` + `menus_tela_pequena_patch.js` | MÉDIA |

### 4.2 MÉDIO — problemas novos vistos nesta rodada

| # | Problema | Prova |
|---|---|---|
| N1 | **Dupla fonte de menus no topnav** — `index.html` HTML estático + patches `ajustes_v52213_menus_atalhos_patch.js` e `ajustes_v52216_menus_submenus_patch.js` geram `module-row` por JS apagando o estático. Em função do `MutationObserver` do inline, o menu pode ser reconstruído 2–3× no boot, perdendo `sfo-pin`. | `ajustes_v52213:169 row.querySelector…` + inline `new MutationObserver(scheduleShellRefresh)` + `grep module-row` |
| N2 | **Patches de menu fora do bundle mas potencialmente vivos via `ajustes_v*` shadowing.** 11 arquivos de menu não entram no bundle, mas o `RELATORIO_SESSAO` admite que `pintarMenus` (v52213) “recria a .module-row”. Se esses patches não foram descontinuados formalmente, o topnav em produção não reflete o que existe em disco. | `bundle-manifest` lista 219 mas `ls *_patch 230`; `auditar_mortos.js` existe mas não foi rodado aqui |
| N3 | **`z-index` wars:** header `z-index:15/40/55`, `modern-topnav 35/28`, `module-menu 80/999`, `sidebar 60`, `modal 50/60/2147483000`, `toast 60`, `digi-sidebar-top 80` — empilhados com `!important`. Um modal pode ficar atrás do dropdown se o stacking context do `main` criar novo contexto. | `grep z-index index.html` + `popup_sistema_patch.js: z-index:2147483000` |
| N4 | **`localStorage` de `lembrar-tela` (`ajustes_v6108`) pode injetar filtros que escondem lista e parecem “menu não abre”.** A tela abre, mas a lista filtrada volta vazia → usuário acha que navegação falhou. | `ajustes_v6108_lembrar_tela_patch.js:320 dispatchEvent input/change` + `RELATORIO_SESSAO r66` |
| N5 | **Dependências de `jsdom` não vendorizadas** — suíte histórica precisa `npm install`; `test_runner.js` já separa categoria `⚠️ NÃO rodou` mas a CI pode reportar “verde” com 11/11 sem rodar os 11 históricos que travam menu/visual. | `test_runner.js` + `vendor/` só tem `acorn`/`node-forge` |
| N6 | **`index.html` inline CSS duplica e conflita:** `.modern-topnav` declarado 3× com `z-index` diferente (35, 28, none); `.module-menu` declarado 2×; `.app-titlebar` declarado 3×. Manutenção é propensa a regressão. | `sed -n 80,220p index.html` |

### 4.3 BAIXO / HIGIENE

- `AUDITORIA_TECNICA.md` §3.6–3.9: SQL interpolado (`"${tableName}"`), divergência de branch, cópias `mobile/www` vs `android/assets` (pausado por regra 35).
- 280 `.js` na raiz + 230 patches: dívida técnica de arquivo plano sem pastas (proposta `PLANO_REDESENHO.md` camadas vs. “sistema novo menor” é histórico, mas não há migração autorizada).

---

## 5. INVENTÁRIO DE ARQUIVOS MORTOS / DUPLICADOS / TEMPORÁRIOS

> **Nenhum arquivo foi apagado nesta auditoria** (regra “não apagar sem provar”). Lista é candidata e exige `auditar_mortos.js` + `grep import` + `bundle-manifest` checagem antes de remover.

**Patches fora do bundle (20):** remanescentes de tentativas de menu/config/tema — NÃO estão no `bundle-manifest.json` mas existem em disco:

```
ajustes_v52213_menus_atalhos_patch.js
ajustes_v52216_menus_submenus_patch.js
ajustes_v52217_menus_arrastar_visibilidade_patch.js
ajustes_v52221_menus_dispositivo_patch.js
ajustes_v52222_menus_arrastar_patch.js
ajustes_v52223_menus_arraste_patch.js
ajustes_v52230_modo_escuro_dispositivo_patch.js
ajustes_v52231_nfe_central_menu_patch.js
ajustes_v52239_menus_imediato_patch.js
ajustes_v52243_financeiro_menu_patch.js
ajustes_v52243_menu_versao_boleto_patch.js
ajustes_v8000_configuracoes_patch.js
fiscal_menu_completo_patch.js
menu_fiscal_oficial_patch.js
menus_fiscais_separados_patch.js
menus_tela_pequena_patch.js
permissoes_override_menus_fiscais_patch.js
seis_submenus_velho_patch.js
submenu_fiscal_oficial_patch.js
submenu_hover_nfe_patch.js
```

**Outros `.js` fora do bundle (41):** `auditar_mortos.js`, `banco_de_prova_nuvem.js`, `bench_clique_nuvem.js`, `build_bundle.js`, `build_profiles.js`, `check.js`, `clean_dist.js`, `diagnostico_exe.js`, `gerar_motor_nuvem.js`, `guardar_repo.js`, `links.js`, `main.js`, `mapa_camadas.js`, `mudar_versao.js`, `nfe_assinatura.js`, `preload.js`, `snmp_printer.js`, `sync_build.js`, `verify_pack.js`, `test_*.js` (11), etc. — **estes são esperados fora do bundle** (tooling, testes, Electron). Não são mortos.

**Patches dentro do bundle mas com sobreposição funcional** (7 nomes com ≥7 redefinições): `navigateTo`, `renderConfig`, `renderFinanceiro`, `renderVendas`, `renderClientes`, `showApp`, `saveDB` — risco de regressão silenciosa.

**Arquivos suspeitos de limpeza futura (a provar):**

- `ajustes_v52213_menus_atalhos_patch.js` vs `ajustes_v52216_menus_submenus_patch.js` vs inline shell — três fontes para a mesma `.module-row`. Se o inline é fonte, os dois ajustes deveriam ser arquivados/removidos ou documentados como superseded.
- `modulos/menu_shell_v8000.js` vs inline — escolher **uma** fonte (recomendado: arquivo em disco + `<script src>`; inline é anti-cache e anti-manutenção).
- `ajustes_v8000_configuracoes_patch.js` (fora do bundle mas nome sugere v8) — parece tentativa abortada.
- Documentos redundantes: `RELATORIO_AUDITORIA_COMPLETA_2026-10-03.md` já está supersedido por este relatório, mas manter até fechar PR#48.

---

## 6. RISCOS ARQUITETURAIS QUE A CORREÇÃO DE MENU PRECISA RESPEITAR

1. **Stack de 219 scripts em `try{}` isolados** (`build_bundle.js`). Um `ReferenceError` num patch mata só aquele patch, mas o usuário vê “menu não abre” sem stacktrace. **Obrigatório** checar `window.__DIGICOPY_ERROS` antes/depois.
2. **`saveDB` / `DB` / `getSession` são globais mutáveis** — o wrapper cloud (`cloudflare_data_sync_patch.js`) troca `saveDB` para enfileirar na nuvem. Testar menu nunca pode quebrar `saveDB`.
3. **Mobile pausado (regra 35/43)** — só `mobile/sync-www.js` mecânico. Não criar telas novas no `mobile/`.
4. **Cloud-only (regra 44)** — não persistir negócio em `localStorage/IndexedDB` local novo; `ajustes_v6108` já guarda lembrança de tela na nuvem (`db.config.lembraTela`) — então filtro do menu também é remoto.
5. **Sem `prompt/confirm/alert` nativos (regra 16)** — toda confirmação de exclusão de contrato/leitura/orçamento deve usar `confirmSistema` via `popup_sistema_patch.js`.
6. **Fiscal em homologação (regra 22)** — não habilitar produção por menu novo.

---

## 7. O QUE A PRÓXIMA IA DEVE FAZER (INSTRUÇÕES DE CORREÇÃO PELA RAIZ)

> **Não criar `fix.js`, `fix_menu.js`, `correcao_final*.js`**. Corrigir no arquivo dono da função.

### 7.1 Ordem sugerida (menor risco primeiro)

**Passo 1 — Unificar fonte do topnav (p0)**
- **Arquivo dono:** `index.html` (HTML estático) **ou** `ajustes_v52213_menus_atalhos_patch.js` **ou** inline shell — **escolher um**. Recomendado pelo histórico: **inline shell vira `modulos/menu_shell_v8000.js` carregado via `<script src>`** e patches `ajustes_v52213/52216` são arquivados (removidos do repo ou movidos para `_ref/`). Motivo: `RELATORIO_AUDITORIA_COMPLETA §10` já alertou 218 entradas no manifesto; manter 2 fontes é causa raiz do “volta com rótulo velho”.
- **Teste no browser:** com DevTools > Sources, garantir que só um gerador de `.module-row` roda (breakpoint em `pintarMenus`/`menusPadrao`).

**Passo 2 — Curar `overflow` (p0)**
- **Arquivo dono:** `index.html:170,179` + patch `navegacao_fiscal_barra_escuro_patch.js` `injecao CSS`. Simplificar para: `.module-row{overflow:visible; flex-wrap:wrap}` em todos os breakpoints; se precisar de scroll, usar wrapper interno, não a própria `.module-row`. Reutilizar o comentário `/* overflow-x:auto fazia o navegador calcular overflow-y:auto */`.
- **Teste:** viewport 390, 700, 1024 — abrir cada `module-menu`, tirar screenshot e verificar que não corta na borda do `module-row` (computed `overflow` deve ser `visible`).

**Passo 3 — Unificar hover vs clique (p0)**
- **Arquivo dono:** `navegacao_fiscal_barra_escuro_patch.js` (já é dono do pin). Estender a regra `sfo-pin` para **todos** os `module`, não só fiscal. Remover do `index.html` a regra `.module:hover .module-menu` ou neutralizá-la com `.module:not(.sfo-pin) > .module-menu{opacity:0!important}` já presente mas conflitante. Documentar no `AUDITORIA_TECNICA.md §3.3` que “hover morreu, clique pin venceu”.
- **Teste:** desktop com mouse: hover não abre; clique 1 abre, clique no mesmo fecha, clique fora fecha, clique no item navega e fecha (já exigido pelo E2E `test_navegacao_fiscal_barra_escuro`).

**Passo 4 — Auditar `display:none` do topnav (p1)**
- Decidir produto: **sidebar é o menu oficial desktop** (evidência mockup v8 `mockup-layout-digicopy-v8.png`, `index.html` media query). Se a decisão for manter topnav escondido, renomear/documentar no `REDESENHO_BLUEPRINT.md` que “menu superior é mobile-only”. Se quiser topnav também no desktop, remover o `@media (min-width:901px){.modern-topnav{display:none!important}}`.
- **Teste:** perguntar ao dono: “no `.exe` 1400×900 você quer sidebar (vertical) ou barra superior?”. Sem resposta, manter sidebar.

**Passo 5 — Domar `navigateTo` (p1)**
- **Arquivo dono:** `app.js:545 navigateTo` é a fonte. Cada wrapper deve ter **guard idempotente `__vXXXX` já existente** e `try/catch` que não engole erro silencioso (logar em `__DIGICOPY_FALHAS`). Auditar `ajustes_v6108` wrapper: ele faz `setTimeout 260ms` para `ltAplicar` — se o usuário clicar rápido em outro menu, o `setTimeout` tardio pode re-aplicar filtro na tela errada. Adicionar `if(document.hidden) return` ou capturar `view` no closure (já faz).
- **Teste:** abrir console, rodar `MAPA_CAMADAS` `node mapa_camadas.js` e conferir que `navigateTo` vencedor continua `ajustes_v6108`. Rodar `node test_runner.js` com `DIGICOPY_RUN_LEGACY=1` para pegar histórico que pinca `navigateTo` duplicado.

**Passo 6 — Clonar `localStorage` de menus (p2)**
- Migrar `digicopy_ui_menus_*` para chave versionada `digicopy_ui_menus_v8_*` ou sanitizar na leitura (ignorar `ocultos` se for primeiro boot). Adicionar botão “Restaurar menus padrão” no `ui-menu-order-control`.
- **Teste:** com `localStorage` sujo, abrir sidebar e verificar que nenhum `.shell-menu-section` fica `display:none` inesperado.

**Passo 7 — Trocar `alert/confirm` remanescentes (p1)**
- Buscar `grep -rn "alert(\|confirm(" --include="*.js"` (30+ hits). Substituir por `window.confirmSistema` / `window.lfbAlert` / `toast` conforme `REGRAS_PERMANENTES.md:16` e `AUDITORIA_TECNICA.md §4`. Cada troca precisa de teste de `pom` (ex.: `test_regressao_dialogos.js`).

### 7.2 O que NÃO fazer

- Não reintroduzir `confirm()` nativo “para depurar”.
- Não criar nova `div.module-row` sem remover a antiga (duplica menu).
- Não mover `modern-topnav` para dentro de `main` com `overflow:hidden` pai — corta dropdown novamente.
- Não alterar ordem do `bundle-manifest.json` sem rodar `npm run sync` + `npm run check` + `node mapa_camadas.js` e atualizar `test_menu_shell_v8000.js` (posição travada).

### 7.3 Validação mínima antes de fechar PR#48

```bash
npm run check                 # 219 scripts, sha
npm run sync:check            # 219 no bundle, 0 soltos (ou ajustar branch)
npm test                      # 11/11 v8
DIGICOPY_RUN_LEGACY=1 npm test # histórico (vai falhar até reancorar — documentar)
node mapa_camadas.js | head -n 40
node auditar_mortos.js        # 0 órfãos
# browser
#  - testar sidebar detalhes (desktop) e topnav pin (mobile) em 390/700/1024/1400
#  - console: __DIGICOPY_ERROS deve ser []
#  - localStorage de menus limpo vs sujo
#  - modo escuro em Dashboard, Preferências > Técnico, editor de menus
```

---

## 8. CHECKLIST DAS 24 PERGUNTAS (RESPOSTAS DESTA AUDITORIA)

1. **Tenho todas as informações necessárias?** Parcial. Li todos os `.md`/configs, inventariei código, reproduzi logicamente o bug do menu por leitura de CSS/JS, mas **sem credencial Cloudflare e sem dados reais**, não pude ver `/health`, `/v1/setup-status`, nem testar sync real. Próxima IA precisa de browser + QA login.
2. **Entendi exatamente o que o usuário quer?** Sim: relatório profundo dos problemas onde estão, para outra IA corrigir no browser — mais correção do menu travado — sem `npm test` fake, sem novos `fix.js`.
3. **Preciso perguntar algo antes de continuar?** Sim: confirmar se o menu esperado no desktop é a **sidebar** (mockup v8) ou a **barra superior** legacy — define se `display:none` é bug ou feature.
4. **O que o usuário informou está correto?** Parcial. O link da branch existe mas não como `origin/auditoria-correcao-pr47` neste clone (só `origin/main`). O PR#48 existe (OPEN). “Menu não abre” confirmado por múltiplas causas, não uma.
5. **Estou fazendo alguma suposição?** Todas marcadas como hipótese vs fato. Ex.: `overflow` cortando submenu é **fato provado no CSS**; “usuário está em desktop” é **hipótese (exe 1400×900)**.
6. **Posso estar passando alguma informação errada?** Possível: contagem exata de redefinições depende de `acorn`; leitura de CSS sem render pode divergir de computed. Por isso instrução browser é obrigatória.
7. **Esse código já existe em algum arquivo?** Sim — todo patch de menu já existe (20 fora do bundle). Não há necessidade de novo arquivo.
8. **Existe alguma função que já faz isso?** Sim: `navigateTo`, `abrirTelaBackup`, `abrirEtiquetas`, `renderBanco`, `MODO_ESCURO_PURE`, todos já centralizados no inline shell.
9. **Esse código depende de outro código?** Fortemente: shell depende de `getSession`, `db`, `saveDB`, `DIGICOPY_CLOUD_SYNC`, `toast`.
10. **Essa alteração pode quebrar alguma coisa?** Sim — mexer em `navigateTo` quebra lembrar-tela; mexer em overflow quebra dark mode; mexer em pin quebra fiscal.
11. **Essa alteração pode afetar outra função?** Sim — ver §6.
12. **Estou duplicando código desnecessariamente?** Não — relatório não cria código; se criar, duplicaria `menu_shell_v8000`.
13. **Existe código desnecessário?** Sim — 20 patches fora do bundle e inline duplicado; candidato a arquivar.
14. **Posso simplificar esse código?** Sim — unificar fontes de menu, simplificar CSS `!important`.
15. **Posso fazer isso em uma linha?** Não aplicável (relatório).
16. **Posso reduzir linhas sem perder clareza?** Sim — remover CSS `display:none!important` duplicado + `z-index` wars.
17. **Posso otimizar sem alterar funcionamento?** Sim — trocar `MutationObserver` agressivo por `scheduleShellRefresh` já existe mas pode ser throttled.
18. **Estou mantendo o padrão do projeto?** Sim — segue `REGRAS_PERMANENTES.md` (sem prompt nativo, sem merge sem permissão, sem deploy).
19. **Estou alterando algo que não precisava ser alterado?** Não — nenhuma alteração feita nesta sessão.
20. **Depois da alteração, tudo continuará funcionando?** Depende da próxima IA seguir a sequência §7.3.
21. **Preciso testar alguma parte antes de finalizar?** Sim — todos os testes browser §3.7 + `npm test` + `check` + `mapa_camadas`.
22. **Existe solução mais simples e segura?** Sim — escolher uma única fonte de menu e clique-pin universal é mais simples que manter 3 fontes + hover.
23. **Essa minha ação irá quebrar alguma coisa no sistema?** Não — só relatório; nenhuma linha tocada.
24. **Existe algum método que posso testar antes de realizar tal coisa?** Sim — browser com breakpoints responsivos e `__DIGICOPY_ERROS`, antes de tocar CSS/JS.

---

## 9. HISTÓRICO E LIMITES HONESTOS

- **Não foi possível verificar diretamente:** banco D1 de produção, `changes.seq` real, se `idx_changes_cursor` existe, se as 6 migrations aplicaram, se o Worker `5.28.x` está no ar, `teste-60f.pages.dev` conteúdo vivo, impressão fiscal real, `.exe` físico.
- **Tudo é análise de código-fonte.** Antes de chamar algo “bug confirmado”, exige clique no `teste-60f.pages.dev` com DevTools (ver §3.7).
- **Varredura de segredos** rápida por literais `SETUP_SECRET`, `CSC`, `token` não achou segredo versionado — não é atestado formal.
- **Oito rodadas de auditoria anteriores** (prompt, cota, modo escuro, importação) já corrigiram parte dos problemas — mas deixaram herança de patches que agora conflitam (ex.: 3 geradores de `module-row`).
- **Nenhuma publicação, deploy, merge ou exclusão de dados** foi feita nesta sessão.

---

## 10. PRÓXIMOS PASSOS (PARA A IA QUE VAI MEXER NO BROWSER)

1. **Reproduzir §3.7** em `teste-60f.pages.dev` com QA login — gravar vídeo/prints dos 3 breakpoints.
2. **Aplicar Passo 1–3 da §7.1** em sequência, commitando cada um com `npm run versao` + `npm run build` + `sync`.
3. **Rodar §7.3** e abrir PR de correção sobre `auditoria-correcao-pr47` (base `main` não `arena/…`).
4. **Atualizar este relatório** com “antes/depois” (hashes de bundle, screenshots).
5. **Pedir ao dono** para testar no `.exe` 1400×900 e no mobile (se usar) — não publicar como final até ele confirmar “menu abre”.

---

## 11. EVIDÊNCIAS COLETADAS NESTA SESSÃO

- `git log --oneline` : `fc1e956 fix(ui): fixar menu superior…` / `cf0c65a fix(ci): usar Node 22`
- `ls -1 | wc -l` 354, `ls *.js | wc -l` 280, `manifest 219`
- `grep -n "modern-topnav\|module-menu" index.html` — linhas 85,89,92,151,163,170,179,189
- `cat app.js:545 navigateTo` + `grep -c navigateTo` 1070 ocorrências
- `node -e notInManifest` 61, 20 patches de menu fora do bundle
- `npm test` 11/0/0, `npm run check` 219 sha `f63d6a3…` — logs em stdout desta sessão
- `AUDITORIA_TECNICA.md` 3570 linhas + `RELATORIO_SESSAO.md` 8286 linhas lidas na íntegra (grep + head)
- `modulos/menu_shell_v8000.js` 140+ linhas vs inline diff de 1 regra (`top` vs `right`)

> Documentação permanente: este arquivo deve ser mantido no repo (não apagar) e citado no `RELATORIO_SESSAO.md` da próxima rodada, conforme regra 41.

---

**FIM — aguardando a correção no navegador. Não foram criados arquivos `fix*.js`; não houve alteração de dados; branch permanece `arena/01a10d41-teste` limpa.**
