# AUDITORIA TÉCNICA — DIGICOPY ERP

**Data:** 23/09/2026
**Repositório:** `kauangabrielcardososilva7890-afk/teste`
**Branch desta sessão:** `arena/01a0cf4a-teste` (base: `arena/01a0c087-teste`)
**Versão auditada:** v6.1.10 · HEAD `26649cc`
**Escopo desta rodada:** classe de bug do `prompt` nativo (Electron) + infraestrutura de teste + varredura estrutural

> **Aviso de honestidade (regra 24).** O projeto tem ~150.000 linhas e 702 arquivos.
> Esta rodada **não** é uma revisão linha-a-linha de tudo. A seção 8 diz, sem
> enfeite, **o que já foi auditado e o que ainda não foi**. Nada aqui foi marcado
> como "testado" sem ter sido realmente executado.

---

## 1. LINHA DE BASE (antes de qualquer alteração)

| Verificação | Comando | Resultado real |
|---|---|---|
| Bundle/manifesto | `npm run check` | ✅ `Bundle OK: 225 scripts, sha256 52c372ace67dbf7f` |
| Configuração de build | `npm run sync:check` | ✅ `Sync OK: v6.1.10 \| 225 no bundle \| 0 soltos \| 13 entradas em build.files` |
| Suíte de testes | `node test_runner.js` | ⚠️ **190 passaram, 0 falha aceita, 4 falharam** |

**Achado de documentação:** o commit do HEAD (`26649cc`) afirma *"suite 194/0"*.
O resultado real é **190 passaram + 4 falharam**. As 4 falhas são todas
`Cannot find module 'jsdom'` — falha de **infraestrutura**, não do produto.

---

## 2. INVENTÁRIO (Fase 1)

- **702 arquivos** no repositório: 534 `.js`, 34 `.png`, 17 `.html`, 16 `.json`, 14 `.md`, 11 `.xml`, 9 `.css`, 7 `.cmd`, 6 `.sql`, 6 `.gradle`.
- **Arquitetura:** aplicação JS "vanilla" (sem framework) empacotada para Electron, mais backends Cloudflare Workers.
  - `index.html` → carrega `app.bundle.js` (**gerado**) + `assets/vendor/*`. **0 scripts soltos.**
  - `app.bundle.js` = **3.812.328 bytes**, junção dos **225 scripts** de `bundle-manifest.json`.
  - ~300 arquivos `ajustes_v*.js` / `*_patch.js` na raiz, numerados por versão.
  - `main.js` (846 linhas) + `preload.js` = casca Electron desktop (`asar: false`).
  - `cloudflare-worker/src/index.js` (2.289 linhas) = API de sincronização; `cloudflare-worker/migrations/` (6 SQLs).
  - `mobile/` = Android/Capacitor **pausado** (cópia do bundle em `mobile/www` e em `mobile/android/.../public`).
  - `bundle-manifest.json` é a **fonte única de verdade**; `sync_build.js` deriva `index.html`, `build.files` e `scripts.check`.
- **Ponto de atenção estrutural:** o sistema é construído por **empilhamento de patches**. 225 scripts são concatenados num único arquivo, cada um isolado em `try/catch` próprio (`build_bundle.js`). O comportamento final depende da **ordem do manifesto**.

---

## 3. ACHADOS

### 3.1 CRÍTICO — `window.prompt` não existe no Electron: botões ficam mudos no `.exe`

**Tipo:** Bug (falha funcional em plataforma principal) · **Gravidade:** ALTO/CRÍTICO
**Arquivos:** `ajustes_v52232_parque_monitor_hub_patch.js:43`, `ajustes_v52239_avisos_erro_auditoria_patch.js:262-264`, `ajustes_v52231_nfe_central_menu_patch.js:75`, `nf_transmissao_patch.js:243` (+346/379), `fiscal_guard_patch.js:159`, `app.js:2443`, `ajustes_v52256_orcamento_venda_limpa_patch.js:368/371`

**Causa raiz (provada na fonte do Electron, `lib/renderer/window-setup.ts`):**

```js
// But we do not support prompt().
window.prompt = function () {
  throw new Error('prompt() is not supported.');
};
```

A função **existe** (portanto `typeof window.prompt === 'function'` é **`true`** no `.exe`), mas **lança exceção ao ser chamada**. Consequência: a guarda `typeof prompt === 'function' ? prompt(...) : null`, repetida em todo o sistema, **não protegia nada** — ela sempre entra no ramo que estoura.

`popup_sistema_patch.js` já trocava `window.alert` e `window.confirm` pelos popups do sistema, mas **`prompt` tinha ficado de fora**. Nenhum arquivo do repositório sobrescrevia `window.prompt`.

**Evidência:** 11 chamadas em 6 arquivos (varredura completa). Em `app.bundle.js` havia 0 implementações de `window.prompt`.

**Impacto confirmado (reproduzível no `.exe`, que é a plataforma foco):**

| Local | Botão | Efeito real no `.exe` |
|---|---|---|
| `ajustes_v52232:43` | **Ler status (rede)** (hub e parque) | exceção → `lerStatusRede` aborta → **nenhuma mensagem, nada acontece** |
| `ajustes_v52239:262` | **Editar notas/tutorial** (portal do gerente) | exceção no `onclick` → **botão mudo** |
| `ajustes_v52231:75` | Senha do certificado (ler validade) | ramo alternativo; o principal (`NFE_ASSINATURA_UI.pedirSenhaA1`) existe |
| `nf_transmissao_patch.js:243/346/379` | Senha/justificativa | ramos alternativos; o principal (`nfxPedirTexto`) existe |
| `fiscal_guard_patch.js:159` | Habilitar PRODUÇÃO | **código morto** (ver 3.2) |
| `app.js:2443`, `ajustes_v52256:368/371` | Copiar link | só quando a área de transferência não está disponível |

Isto viola a regra permanente **"Nenhum botão pode ficar morto ou silencioso"** e a regra **"Nunca usar `prompt`, `confirm` ou `alert` nativos"**.

### 3.2 INFORMATIVO — código morto: o botão antigo de PRODUÇÃO

**Tipo:** Código desnecessário (não removido de propósito) · **Gravidade:** BAIXO
**Arquivo:** `fiscal_guard_patch.js:143-170`

`nfgBotaoAmbiente()` desiste na primeira linha sem `#central-nfe-modal`
(`const central=document.getElementById('central-nfe-modal'); if(!central||...) return;`).
Esse modal **não é mais criado**: `window.abrirCentralNfe` é embrulhado 3 vezes, e o
embrulho mais externo (`autocura_empresa_central_nf_tela_patch.js:277-283`, índice 207
— o último do manifesto) só chama `window.navigateTo('central-nf')` e **nunca chama o
original** (`_cen2`). Logo `nfgBotaoAmbiente` nunca cria o botão e
`nfgAlternarAmbiente` nunca é chamado.

**A proteção de produção que vale hoje é outra** e está correta:
`autocura_empresa_central_nf_tela_patch.js:206-207` já usa
`await window.nfxPedirTexto('Habilitar PRODUÇÃO', …)` + `if(dig!=='PRODUCAO')`.

Por isso o item 3.1 nesta linha é **armadilha latente, não bug ativo**. O código
**não foi removido** (regra: não apagar código aparentemente morto sem provar e
testar antes) — apenas deixou de usar `prompt` nativo.

### 3.3 ALTO — Arquitetura de "patch sobre patch" nos globais

**Tipo:** Melhoria de arquitetura / risco de regressão · **Gravidade:** ALTO (risco)
**Evidência (contagem exata de atribuições `window.X =`, por arquivo):**

| Global reatribuído | Nº de arquivos do bundle |
|---|---|
| `window.navigateTo` | **35** |
| `window.showApp` | 22 |
| `window.renderConfig` | 19 |
| `window.renderFinanceiro` | 18 |
| `window.openModalChamadoCompleto` | 15 |
| `window.renderVendas` / `window.modalContext` | 14 |

**Problema:** o comportamento final é função da **ordem do manifesto**, e cada script
roda isolado em `try/catch`. Se **um** patch falhar ao carregar, o embrulho que ele
instalava some em silêncio e o sistema segue funcionando "pela metade" — que é
exatamente o sintoma descrito no cabeçalho do `build_bundle.js` ("faltar muita coisa
no `.exe`").

**Não foi alterado nesta rodada** — refatorar isso é reescrever o projeto, o que
contraria a orientação de não reescrever desnecessariamente. Fica registrado como o
maior risco estrutural, com o caminho de mitigação descrito na seção 7.

### 3.4 MÉDIO — Segurança: pepper com valor fixo no Worker

**Tipo:** Segurança · **Arquivo:** `cloudflare-worker/src/index.js:991-994`

```js
async function senhaHash(env, cnpj, senha){
  const pepper = (env && env.SETUP_SECRET) || 'digicopy';   // ← fallback embutido
  return sha256(pepper + '|' + soDigitos(cnpj) + '|' + String(senha || ''));
}
```

Se `SETUP_SECRET` não estiver configurado, os hashes de senha passam a usar um pepper
**fixo e público**. No resto do Worker a ausência desse segredo **falha fechada**
(`if (!env.SETUP_SECRET) throw …` nas linhas 235 e 338), então este ponto é
**inconsistente** com o padrão do próprio arquivo.

**Não foi alterado** de propósito: o pepper está embutido nos hashes **já gravados**
no banco. Trocar o fallback sem acesso ao banco de produção poderia **trancar o dono
fora do sistema**. Precisa de confirmação e janela de migração.

**Achados secundários no mesmo arquivo:**
- `senhaHash` usa **SHA-256 puro (1 rodada)** — hash rápido, brute-forçável se a senha for curta, ainda mais com o CNPJ conhecido. Correto seria um KDF (PBKDF2/bcrypt/Argon2) com salt. **Requer migração de hashes** — não alterado.
- `conferirSenha` (linha 1000) compara com `===`, embora exista o helper de tempo constante `sameSecret` no mesmo arquivo (linha 59). Inconsistência de baixo impacto.

### 3.5 MÉDIO — Segurança: senha do Buscador Escola no banco sincronizado

**Tipo:** Segurança / decisão de projeto · **Gravidade:** MÉDIO
**Arquivos:** `main.js:715-745` (`escola:login-save` / `escola:login-status`), `buscador_escola_patch.js:39,68`

- `escola:login-save` grava usuário e **senha em texto limpo** em `%APPDATA%/<app>/escola-login.json`.
- `escola:login-status` **devolve a senha em texto limpo** para o renderer.
- `salvarCredenciaisEscola` também grava em `db.config.escolaAuth` e chama `saveDB()` — ou seja, **a senha sobe para a nuvem**, junto do banco sincronizado.
- Em sentido oposto, `ajustes_v52024_patch.js:27` **remove** `config.escolaAuth` do **backup**.

**Não é descuido:** o `credenciaisEscola()` precisa da senha em texto para autenticar
na API da Caixa Escolar (login automático). É o que faz a função funcionar em vários
PCs — por isso **não foi alterado**: remover quebraria funcionalidade existente.

**Ponto de atenção para o dono:** há uma assimetria de decisão — a senha é protegida
no backup, mas está presente no banco da nuvem. Vale confirmar se essa é a intenção.

**Achado colateral (teste fraco):** `test_ajustes_v5223.js:15-16` valida
`!/db\.config\.escolaLogin/` e `!/escolaSenha/` — isto é, confere **nomes antigos de
campo**, não o comportamento. Como o campo vivo hoje é `escolaAuth`, o teste passa
mesmo com a credencial gravada no `db.config`. O teste dá **falsa confiança**.

### 3.6 BAIXO — Infraestrutura: 4 testes não rodam em checkout novo

**Tipo:** Melhoria de manutenção · **Arquivos:** `test_runner.js`, `test_ajustes_v6103.js`, `test_ajustes_v6104.js`, `test_relatorio_teste_nf.js`, `test_relatorio_problemas.js`

`test_runner.js` recria do `vendor/` apenas `acorn` e `node-forge`. O **`jsdom`** (dependência de desenvolvimento) não está no `vendor/` e é exigido por 4 testes que abrem DOM de verdade. Num checkout novo/CI sem `npm install`, eles **pareciam defeito do produto** (`❌` + `MODULE_NOT_FOUND`). **Corrigido** — ver seção 4.

### 3.7 INFORMATIVO — SQL com nome de tabela interpolado (Electron)

**Tipo:** Segurança (baixo risco) · **Arquivo:** `main.js:439, 470`

`SELECT FIRST ${lim} * FROM "${tableName}"` e `SELECT COUNT(*) FROM "${t}"` interpolam
o nome da tabela (vindo do renderer, ou do próprio banco) em vez de usar `.bind()`.
Como essas rotas são o **utilitário local de migração do Firebird** e o renderer é o
próprio sistema, o risco é baixo. Fica registrado porque o padrão difere do resto do
arquivo (`firebird:columns` usa `?` corretamente, linha 411). **Não alterado** — sem
acesso ao banco não dá para validar o comportamento de aspas/identificadores.

### 3.8 INFORMATIVO — Divergência de branch no `package.json`

`package.json > digicopy.branch` = `arena/01a0c087-teste`, mas a branch desta sessão é
`arena/01a0cf4a-teste`. Isso afeta o **ZIP de download** e a reescrita dos links
`raw.githack.com` feita pelo `sync_build.js`. O próprio `sync:check` emite o aviso.
**Não alterado** — mudar o campo troca os links publicados para os clientes e exige a
decisão do dono sobre qual branch é a oficial.

### 3.9 INFORMATIVO — Cópias derivadas do bundle

`mobile/www/app.bundle.js` **precisa** estar igual ao bundle (há teste que exige: `test_ajustes_v5262.js:103`). Já `mobile/android/app/src/main/assets/public/app.bundle.js` está **dessincronizado** e **nenhum teste cobre**. Como o mobile está **pausado** por regra, não foi tocado. Precisa de decisão quando o mobile for retomado.

---

## 4. CORREÇÕES REALIZADAS

Todas preservam o comportamento existente. Nenhum arquivo novo entrou no
`bundle-manifest.json` (o teste exige `manifest.length === 225` e índices fixos).

| Arquivo | Alteração | Motivo | Impacto esperado |
|---|---|---|---|
| `popup_sistema_patch.js` | Novos `window.pedirTextoSistema(msg,{titulo,mascara,valor})` (Promise → texto, `''` se vazio, `null` se desistir) e `window.mostrarTextoCopiar(titulo,texto)`. E `window.prompt` deixou de ser o nativo: agora nunca lança, mostra o popup do sistema e devolve `null` (registrando em `window.__DIGICOPY_PROMPT_NATIVO`). | É o módulo que já é dono dos popups (`alert`/`confirm` já eram dele). Fica no índice 57, **antes** de todos os pontos afetados (103+). | Fecha a classe do bug: nenhuma chamada de `prompt` pode mais derrubar um fluxo no `.exe`. Regra "nunca usar prompt nativo" cumprida. |
| `ajustes_v52232_parque_monitor_hub_patch.js` | O IP da impressora passou a ser pedido com `await pedirTextoSistema(...)`. | Botão **vivo** e **mudo** no `.exe`. | "Ler status (rede)" volta a funcionar em impressora sem IP gravado. |
| `ajustes_v52239_avisos_erro_auditoria_patch.js` | `run` virou `async`; as duas perguntas (notas/tutorial) usam `await pedirTextoSistema(...)`. | Botão **vivo** e **mudo** no `.exe`. | "Editar notas/tutorial" volta a funcionar. Cancelar e "vazio" mantêm a semântica antiga. |
| `ajustes_v52231_nfe_central_menu_patch.js` | Senha do certificado no popup do sistema, **com máscara**. | Era ramo alternativo + o prompt antigo mostrava a senha em texto limpo. | Melhora de segurança e coerência. |
| `nf_transmissao_patch.js` | `nfxPedirSenha` usa `pedirTextoSistema` como 2.º fallback e, sem nenhum popup, avisa e desiste. Justificativas: ramo alternativo virou `null`. | Nunca mais estoura dentro do fluxo de assinatura. | O caminho principal (`nfxPedirTexto`) permanece intacto e preferido. |
| `fiscal_guard_patch.js` | `nfgAlternarAmbiente` virou `async` e usa `pedirTextoSistema`/`nfxPedirTexto`; comentário registra a prova de que o caminho está morto. | Remover a armadilha sem remover o código. | Mantém `dig!=='PRODUCAO'` (exigido por teste) e deixa de usar `prompt` nativo. |
| `app.js` e `ajustes_v52256_orcamento_venda_limpa_patch.js` | Fallback de cópia de link passou a usar `mostrarTextoCopiar` (e um `toast` de reserva no `app.js`). | Mesma classe do bug. | Copiar link nunca mais fica mudo. |
| `test_runner.js` | Detecta `jsdom` ausente e reporta os 4 testes como **"NÃO rodou — falta a dependência"**, em categoria própria, com o comando de conserto. Mantém `exit 1` para falha real de produto. | Regra permanente: separar falha de infraestrutura de falha do produto. | O resultado passa a ser **verdadeiro e legível** em vez de 4 falsos "defeitos". |

---

## 5. SIMPLIFICAÇÕES E OTIMIZAÇÕES

- **Não houve otimização de performance nesta rodada.** O único ganho real de peso/ tempo seria mexer em consultas e renderização — áreas que exigem medição com o banco e o `.exe` reais. Fazer "otimização" sem medição aqui seria chute, e a regra é não fazer otimização prematura sem justificativa.
- **Simplificação aplicada:** os pontos migrados trocaram `(typeof prompt==='function')?prompt(...):null` — um padrão que era **logicamente inútil** no `.exe` — por uma chamada única ao popup do sistema, com a mesma semântica de retorno.
- **Remoção deliberadamente evitada:** nenhuma linha de código morto foi apagada (item 3.2), e nenhum arquivo ou script do bundle foi removido.

---

## 6. TESTES EXECUTADOS (e o que não foi)

| Verificação | Resultado |
|---|---|
| `npm run check` (bundle + `node --check` em 225 scripts) | ✅ `Bundle OK: 225 scripts, sha256 3234d8acb5b9489e` |
| `npm run sync:check` | ✅ `Sync OK: v6.1.10 \| 225 no bundle \| 0 soltos \| 13 entradas em build.files` |
| `node test_runner.js` (após as correções) | ✅ **190 passaram, 0 falha aceita, 4 não rodaram (falta jsdom), 0 falharam** |
| `node --check` nos 8 arquivos alterados | ✅ todos OK |
| `node mobile/sync-www.js` (sincronização obrigatória do derivado) | ✅ `www do celular 1.0 pronto: 4 arquivos + assets/vendor, 0 referências quebradas` |
| `test_confirm_compat.js` (guarda o shim de `confirm`) | ✅ passou — o `prompt` novo foi somado sem tocar no `confirm` |
| `test_ajustes_v52428.js` (exige `z-index:2147483000` no popup) | ✅ passou — os popups novos usam o mesmo z-index |
| `test_ajustes_v6002.js` (exige 225 manifestos, índices 207-215, `nfxPedirTexto`, `dig!=='PRODUCAO'`) | ✅ passou |

**Comparação com a linha de base:** conjunto de falhas **byte a byte idêntico** ao de antes das alterações (as mesmas 4 por `jsdom`). **Nenhuma regressão.**

**Não executados, com motivo declarado:**
- **`npm test` completo com jsdom:** não há acesso ao registro npm neste ambiente (`npm install` falha por TLS/rede) e o `jsdom` não está no `vendor/`. Os 4 testes de DOM/E2E **não foram executados** — por isso o `test_runner.js` agora os nomeia explicitamente em vez de mascará-los.
- **Testes do Worker / `wrangler`:** exigem credencial e rede da Cloudflare. Não executados.
- **Testes de Electron/`.exe`:** exigem build de Windows. Não executados.

---

## 7. PENDÊNCIAS E PRÓXIMOS PASSOS

1. **Confirmar a branch oficial** (`package.json > digicopy.branch`) — decisão do dono (item 3.8).
2. **Confirmar as duas decisões de segurança que exigem migração** e por isso **não** foram tomadas (itens 3.4 e 3.5): pepper/KDF do Worker e senha do Buscador na nuvem. Ambas podem trancar usuários ou quebrar funcionalidade se feitas sem janela de migração e sem acesso ao banco.
3. **Rodar `npm install` e a suíte inteira** para executar também os 4 testes de jsdom (validação final no PC do dono).
4. **Risco estrutural (item 3.3):** se um dia for atacado, o caminho de menor risco é **congelar a ordem** e passar a registrar, no carregamento, **qual script falhou** — o `build_bundle.js` já coleta `window.__DIGICOPY_ERROS` e o `main.js` já grava em `log-erros.txt`. Foi isso que fizemos surgir no diagnóstico; falta tornar isso visível para o dono sem abrir o console.
5. **`mobile/android/.../public/app.bundle.js` dessincronizado** (item 3.9) — decidir quando o mobile voltar.

---

## 8. COBERTURA: O QUE FOI E O QUE NÃO FOI AUDITADO

**Auditado nesta rodada (leitura efetiva):**
`main.js` (846 linhas, integral), `preload.js`, `build_bundle.js`, `sync_build.js`, `test_runner.js`, `popup_sistema_patch.js`, `fiscal_guard_patch.js`, `nf_transmissao_patch.js`, `autocura_empresa_central_nf_tela_patch.js` (parcial), `ajustes_v52231/52232/52239/52256`, `buscador_escola_patch.js` (parcial), `cloudflare-worker/src/index.js` (varredura dirigida: autenticação, hashing, SQL, rotas), `cloudflare-worker/migrations/` (listagem), `REGRAS_PERMANENTES.md`, `.gitignore`, `_headers`.

**Ainda NÃO auditado linha-a-linha (declaradamente):**
- `app.js` (249 KB) — só os pontos de contato (`prompt`, versão).
- `cloudflare-worker/motor_para_colar.js` (123 KB) e `cloudflare-contador/`.
- A maioria dos ~300 patches: `vendas_*.js`, `notinha_patch.js`, `fluxos_operacionais_patch.js`, `locacao_*.js`, `contratos_*.js`, `fiscal_catalogo_completo_patch.js`, `ajustes_v52237/52243/52244/52245/52249...`.
- 34 imagens, 17 HTML, 11 XML, 6 SQL de migração (conteúdo), `gerente-atualizacoes/`, `deploy_github_actions/`, `e2e/`.
- Correção de regra de negócio (financeiro, estoque, fiscal, locação) — **não revisada** nesta rodada.

**Sobre o banco de dados:** o banco fica na infraestrutura Cloudflare e **não há
acesso ao ambiente de produção**. Portanto **não foi verificado diretamente**:
existência real de índices, estado das tabelas, integridade dos dados, se as
migrations foram aplicadas, nem o comportamento real das consultas. Tudo o que se diz
sobre banco aqui é **análise de código-fonte** (SQL, migrations, ORM/queries).
Nenhuma alteração de schema ou de dados foi feita.

**Sobre segredos:** uma varredura dirigida por literais de chave/token/senha **não
encontrou** credencial versionada. Isso **não** é um atestado de ausência de segredos
— é o resultado de uma busca específica, não de uma auditoria completa de segredos.

---

## 10. RODADA 2 — AUDITORIA DA SINCRONIZAÇÃO (nuvem / banco)

**Pergunta do dono:** *"a parte do banco de dados/nuvem está sincronizando nos outros computadores sem problema nenhum?"*

> **Não foi possível verificar diretamente — acesso ao banco de produção indisponível.**
> Nada aqui é leitura de dados reais: é **auditoria de código** (Worker + cliente).

### 10.1 O QUE FOI VERIFICADO E ESTÁ BEM FEITO (não foi alterado)

O desenho trata o caso difícil (dois PCs editando junto) de propósito:

| Mecanismo | Onde | Por quê importa |
|---|---|---|
| Concorrência otimista por `baseVersion` | `applyMutation` (Worker) | Duas edições simultâneas não se sobrepõem em silêncio |
| `UPDATE ... WHERE version = ?` + transação `DB.batch` | Worker | Registro e evento entram juntos ou não entram |
| Idempotência por `mutation_id` (UNIQUE) | Worker | Reenvio/reconexão não duplica |
| `noop`: registro idêntico não regrava | Worker | Economia real de cota |
| Pull incremental por `cursor` (500/página) | `handleChanges` | Não relê a base inteira |
| `applyRemote` com trava de versão | Cliente | Mudança mais velha não sobrescreve a mais nova |
| Conflito → aplica a nuvem e **reenvia** com `baseVersion` nova | `pushOutbox` | **Não descarta a edição local** (era o "salvei e sumiu"); só cede em concorrência real e avisa no sino |
| Contador (`_seq`) pega o **maior** | `applyRemote` | Dois PCs não emitem o mesmo número |
| Exclusão de orçamento é **soft** | `applyRemote` | Orçamento não some por mandado da nuvem |
| Líder entre abas (lease de 90s) | `leader()` | Duas abas não empurram ao mesmo tempo |
| Sem polling agressivo (`setInterval`) | ambos | Preserva PC fraco (regra 12) |
| Portão fiscal no **executor real** | `nfxAmb()` lê `NFG_PURE.nfgAmbiente` | Produção exige permissão + digitar `PRODUCAO` + auditoria; endpoints trocam por ambiente |

### 10.2 ALTO — o freio preventivo de cota não era reconhecido pelo cliente · **CORRIGIDO** (commit `3276d82`)

**Tipo:** Bug (lógica entre dois arquivos) · **Arquivos:** `cloudflare-worker/src/index.js:545` ↔ `cloudflare_sync_patch.js:84-90` ↔ `cloudflare_data_sync_patch.js:737`

O Worker responde o freio preventivo assim:

```js
return json({ ok:false, quota:true,
  error:'pre-stop DIGICOPY: daily row write limit próximo do teto …' }, 429);
```

O comentário no próprio Worker diz que o texto carrega as palavras *"daily row write limit"* **de propósito**, porque "é assim que o app reconhece a pausa". Mas o cliente monta a mensagem lendo **apenas** `message`/`aviso` — então o recado cai em `err.code` (não em `err.message`), e o que sobra é `"Erro HTTP 429"`. E a detecção testa o **texto**:

```js
function ehLimiteDiario(msg){ return /free tier daily|daily row (write|read) limit|exceeded .*limit/i.test(msg); }
```

**Consequências (todas confirmadas por leitura de código):**
1. `ehLimiteDiario` dava `false` → `state.limiteAte` nunca era gravado → **o despertador da virada nunca era agendado**.
2. `ehSobrecarga(429)` dava `true` → o `comPaciencia` tentava 4× (900+2500+6000+12000 = **~21s**) **por rodada**, a cada heartbeat.
3. O usuário via **"Nuvem pendente: Erro HTTP 429"** em vez do recado em português.
4. **Efeito composto:** cada tentativa passa pelo `somarUso`, que conta a escrita **tentada** (roda antes do freio e antes de saber se houve conflito/duplicata/noop). O martelar **inflava o contador do dia** e fazia o freio disparar **cada vez mais cedo para todos os PCs**.

**Correção (aditiva, 2 linhas):** `err.quota=!!(data&&data.quota)` no cliente + `ehLimiteDiario(lastError)||!!(e&&e.quota)` no motor. Não altera nenhuma outra mensagem — o caminho do erro cru do D1 continua funcionando como antes. 5 asserts novos em `test_sync_quota_guard.js`, **comprovados não-vazios** (falham antes, passam depois).

**Não perde dado:** durante a janela, nada é descartado — as mudanças ficam na outbox de cada PC e sobem depois. **Mas nenhum PC recebe novidade dos outros enquanto a cota está travada.** O conserto **não precisa de deploy do Worker**: os dois arquivos corrigidos viajam no bundle.

### 10.3 INFORMATIVO — o botão "Enviar para nuvem" está desligado e é inalcançável

**Tipo:** Código morto + armadilha latente · **Arquivos:** `cloudflare_sync_patch.js:113-114`, `ajustes_v5191_patch.js:23-45`, `interface_patch.js:70-73`, `performance_patch.js:142-145`

`cloudflare_sync_patch.js` (índice 96) **sobrescreve** `window.syncEnviarParaNuvem` e `window.syncCarregarDaNuvem` com stubs desligados (`{ok:false,desligado:true,cloudflare:true}`). Como ele é o **último** da cadeia, são esses que valem no fim.

- **Armadilha latente:** `uiWrapSync` (índice 15) mostraria **"Pronto! Este PC enviou os dados para a nuvem ☁️"** mesmo com o stub não fazendo nada (o stub não lança exceção → `__uiSyncErro` fica `false`). Seria uma confirmação **falsa**.
- **Porém é inalcançável hoje:** uma varredura ampla (`.js`, `.html`, `onclick`, string dinâmica, fora do bundle/mobile/testes) **não achou nenhum chamador** de `enviarDadosLocaisParaNuvem` / `carregarDadosDaNuvem`. Os embrulhos de `ajustes_v5191` (índice 86) capturam `_envNuvem` mas **nunca chamam** — e ainda chamam `window.syncEnviarParaNuvem` dinamicamente, que já é o stub.
- **Conclusão honesta:** não é bug visível hoje (não há botão ligado). É código morto que **vira bug no dia em que alguém religar o botão**.

> **RESOLVIDO em 23/09/2026 (commit `1c6abce`, rodada 3):** o dono decidiu — *"não quero algo manual que envia pra nuvem, quero automático"*. As ações manuais foram **removidas** de `ajustes_v5191_patch.js` e `interface_patch.js` (junto com o `uiWrapSync`, que era o aviso verde falso). `test_ajustes_v5191.js` foi reescrito para provar o contrário do que provava antes: que o caminho manual **não existe mais**.

### 10.4 INFORMATIVO — resíduo da nuvem antiga (Supabase) dentro do bundle

**Arquivo:** `performance_patch.js` (índice **9** do manifesto — entra no `.exe` e no site)

`performance_patch.js` ainda embrulha `syncEnviarParaNuvem`/`syncCarregarDaNuvem` com caminho Supabase (`I.supabaseRequest('app_state?on_conflict=key', …)`, `CLOUD_META_KEY`, cache por backend), lendo `window.__supabaseSyncInternals` — **que não é definido em lugar nenhum do repositório** (verificado por varredura). O caminho cai no `return {ok:false, erros:['sync interno indisponível']}`.

É **código morto**, mas **não é inofensivo**: as duas funções continuam reatribuídas (participam dos embrulhos de 10.3) e carregam trabalho de leitura de cache. `test_nuvem_antiga_removida.js` **não cobre isto** — ele procura arquivos apagados (`.supabase.co`, chaves `AIza…`), não símbolos internos como `__supabaseSyncInternals`.

> **RESOLVIDO em 23/09/2026 (commit `1c6abce`, rodada 3):** o dono autorizou apagar código morto. As **240 linhas** do caminho Supabase saíram de `performance_patch.js` (344 → 110 linhas). Ficou só o que é vivo: os helpers puros (`perfHashStr`/`perfDiffPartes`/`perfEmLotes`, cobertos por `test_perf.js`) e o `saveDB` write-behind. A cobertura que faltava agora existe: `test_ajustes_v5191.js` confere, **sem os comentários**, que não sobrou uso de `__supabaseSyncInternals`, `supabaseRequest` nem `app_state` — e que os helpers vivos continuam lá.

### 10.5 INFORMATIVO — `somarUso` conta escrita **tentada**, não efetiva

**Arquivo:** `cloudflare-worker/src/index.js` (`handlePush`)

`somarUso(env, mutations.length, …)` roda **antes** do freio e antes de saber se houve conflito, duplicata ou `noop`. Logo um lote que **não grava nada** (tudo `noop`/duplicado) ainda **gasta cota do contador**. Foi o que transformou o item 10.2 num ciclo que se reforça. Não alterado: mexer nisso muda o comportamento do contador e exige medir em produção.

---

## 11. CONCLUSÃO DAS RODADAS

### Rodada 1 — botão mudo no `.exe` (commit `ac19e51`)

- **1 causa raiz encontrada e corrigida:** o `prompt` nativo do Electron, que transformava botões em nada-no-`.exe`. Todos os pontos foram migrados para o popup do sistema e ficou uma rede de segurança para que essa classe não volte.
- **2 bugs vivos** (Ler status da impressora, Editar notas/tutorial), **1 armadilha latente** (PRODUÇÃO), **4 ramos alternativos** endurecidos.
- **0 regressões:** suíte idêntica à linha de base; bundle e sync conferidos.
- **Registrado, não alterado:** o risco estrutural dos 35 `window.navigateTo`, e duas decisões de segurança que dependem de migração e de acesso ao banco.
- **Limite honesto:** a auditoria completa de 150.000 linhas **não** foi concluída. A seção 8 diz exatamente onde ela parou, para continuar na próxima rodada sem perder contexto.

### Rodada 2 — sincronização/nuvem (commit `3276d82`)

- **1 defeito real encontrado e corrigido** (item 10.2): o freio preventivo de cota do Worker não era reconhecido pelo cliente. O conserto **não precisa de deploy do Worker** (viaja no bundle dos PCs).
- **2 testes de cota** continuam passando + **5 asserts novos** prendendo as três pontas do encanamento (Worker → cliente → motor), comprovados não-vazios.
- **Desenho da sincronização verificado e aprovado** (item 10.1): conflito entre dois PCs é detectado, a edição local **não** é descartada, contador não regride e orçamento não some.
- **3 pendências registradas, não alteradas:** botão "Enviar para nuvem" desligado e inalcançável + toast falso latente (10.3); resíduo Supabase dentro do bundle, fora do alcance do teste que diz "nuvem antiga removida" (10.4); `somarUso` conta escrita tentada, não efetiva (10.5).
- **O que NÃO foi possível responder:** se está sincronizando **de fato** entre os computadores do dono. Isso exige ler o banco de produção, e **não há acesso ao ambiente de produção**. A conclusão é sobre o **código**, não sobre os dados.


### Rodada 3 — segurança do login e higiene dos testes (commit `1c6abce`)

- **1 achado CRÍTICO de segurança confirmado e corrigido** (12.1): o login aceitava um par de demonstração como Admin, **sempre** — e valia no sistema, porque esse patch é o último da cadeia que define `doLoginUser`. Comprovado antes/depois executando a função de verdade.
- **1 achado ALTO** (12.2): o login por CNPJ reativava usuário desativado pelo dono e sobrescrevia a senha do CNPJ configurada por ele. Corrigido **sem** tirar a credencial corporativa (tirar poderia trancar o dono fora).
- **1 achado BAIXO** (12.3): tela que listava as senhas de todos os usuários. Agora lista sem senha.
- **1 achado MÉDIO** (12.4): **36 testes nunca rodavam**. Rodei todos: 12 entraram na suíte → **190 → 202 passando, 0 falhando**. Os 23 que falham ficaram **de fora** e registrados, com causa raiz de cada grupo (19 são versão cravada à mão; 4 são testes quebrados ou de arquivo inexistente).
- **2 itens da rodada 2 fechados por decisão do dono:** envio manual para a nuvem **removido** (10.3) e resíduo Supabase **apagado** (10.4, 240 linhas).
- **Laudo externo conferido item por item** (12.5): confirmado no achado crítico, **vencido** no patch da pausa de regras (o código atual já despausa sozinho desde 22/09). O laudo foi produzido sobre v6.1.3/222; aqui está v6.1.10/225 — nada foi copiado sem conferência.
- **Nenhuma regressão:** `build_bundle.js --check` OK (225 scripts, sha `db55bcb615b6cf60`), `sync_build.js --check` OK (v6.1.10, 0 soltos), suíte 202/0/4-não-rodaram.
- **Não foi possível verificar diretamente — acesso ao banco de produção indisponível:** se as contas afetadas pelo backdoor foram usadas, quando, e por quem. A evidência existente é de **código** (o caminho existe e vence a cadeia), não de dados.

### Rodada 4 — versão v7.0.0, os dois pedidos do dono e a caçada ao que a versão quebrava

- **`listUsuariosDemo`: agora não mostra nada.** Antes de responder "pode tirar?", varri o repositório inteiro (`.js`, `.html`, bundle gerado, cópias do celular, `e2e/`): **nenhum chamador**. Não mostrar nada não quebra nada — a função continua de pé (responde sem vazar dado) e o teste passou a exigir isso.
- **`somarUso`: decisão tomada e aplicada no Worker.** A contagem passou para depois da validação e do freio — lote inválido (400) e lote recusado (429) não gravam nada e não podem mais inflar o contador do dia (era o ciclo que empurrava o freio para cedo em todos os PCs). Continua **antes das gravações** e conservador. 5 asserts novos prendem a ordem. **Depende de deploy do Worker** (o motor precisa ser regerado; o `npm run motor` não roda neste ambiente).
- **v7.0.0 publicada** e **63 testes consertados**: a suíte estava amarrada em `/^[56]\./` ("versão 5 ou 6"), ou seja, ela **rejeitava qualquer versão 7**. 84 ocorrências trocadas por aceitação de versão real (`\d+\.\d+\.\d+`), mantendo as conferências que importam (`?v=` do cache, rodapé, relatório/guia). Dois testes que fixavam a versão à mão passaram a ler o `package.json` — não precisam ser reescritos a cada publicação. Suíte: **202 passando, 0 falhando**.
- **Achado de manutenção no caminho:** `package.json > digicopy.branch` apontava para a **branch da sessão anterior**. Consequência prática: **todos os links impressos pelos scripts levavam para código velho** — inclusive o ZIP de download. Corrigido, junto com `BUILD_EXE.md`, `cloudflare-worker/README.md` (a instrução da *production branch* do Worker) e `PASSO_A_PASSO_NUVEM_E_SITE.html` (o guia que o dono segue no painel, que ensinava a apontar para a branch antiga e mostrava v6.1.3 na capa).
- **Nada no app compara versão** (varrido). No Worker, `compararVersao` compara pedaço numérico por pedaço — `7.0.0 > 6.1.10` corretamente, e o primeiro envio da versão nova **gera uma foto de backup rotulada com a versão anterior**.
- **Falso alarme registrado:** o sha do bundle impresso pelo build (corpo) difere do hash usado no `?v=` (arquivo inteiro). É por projeto — não "consertar".

---

## 12. RODADA 3 — SEGURANÇA DO LOGIN E HIGIENE DOS TESTES (commit `1c6abce`, 23/09/2026)

Esta rodada nasceu de duas frentes: as ações que o dono autorizou (tirar o envio
manual para a nuvem, apagar código morto) e a conferência, linha por linha, do
laudo técnico externo que ele recebeu. **O laudo estava certo no achado mais
grave** — e ele está detalhado em 12.1.

### 12.1 CRÍTICO — Segurança — porta dos fundos no login (`admin` + senha de demonstração)

**Arquivo/local:** `ajustes_v52253_login_tela_branca_patch.js`, função
`loginFlexivel` (dentro de `LOGIN_TELA_BRANCA_V52253_PURE`), chamada pelo
`window.doLoginUser` do mesmo arquivo.

**O que era:** antes de desistir, a função devolvia um usuário **fixo**,
`{id:'usr_admin', perfil:'Admin', ativo:true}`, para o login `admin` com senha
`admin`, `123` ou `admin123`. O comentário original dizia que era o "fallback
para admin inicial" — **mas ele valia sempre**, não só em instalação nova.

**Evidência de que era alcançável (não é teoria):**

| Verificação | Resultado |
|---|---|
| Quem define `window.doLoginUser` | 5 patches: `login_otimizacao_patch.js` (índice 97), `login_dados_automaticos_patch.js` (167), `sistema_clientes_loja_patch.js` (147), `ajustes_v5186_patch.js` (376) e `ajustes_v52253…` (**177, o último**) |
| Qual vale no fim | o **último** da ordem de carga → o de índice 177, que chama `loginFlexivel` |
| Onde eu poderia usar | tela de login, sem `usuarios`, sem empresa, sem log de auditoria |
| Onde o par de senhas ficava exposto | no `app.bundle.js`, que é **público** (site/`.exe`/zip) |

**Causa raiz:** um atalho de desenvolvimento ("se o banco está vazio, deixa
entrar") que nunca foi restringido à condição que o justificava.

**Correção aplicada:** o fallback continua existindo — porque para instalação
nova ele é legítimo e tirá-lo poderia trancar o dono fora de um PC zerado — mas
agora ele só vale **quando o banco ainda não tem nenhum Admin ativo**. Existindo
Admin ativo, quem manda é a senha cadastrada no banco.

**Comprovado nas duas pontas** (execução real da função):

| Cenário | Antes (git HEAD) | Depois |
|---|---|---|
| Banco **vazio** (PC novo) | entra como Admin | entra como Admin ✅ (preservado) |
| Banco **com** Admin ativo + par de demonstração | **entrava como Admin** ❌ | `null` (não entra) ✅ |
| Banco com Admin ativo + usuário e senha de verdade | entra | entra ✅ |
| Banco com Admin ativo + senha errada | entra | `null` ✅ |

**Trava contra reincidência:** `test_login_sem_backdoor.js` (novo, 19
verificações). Ele testa o comportamento e mais uma coisa que ninguém tinha
proteção: **confere que `ajustes_v52253…` continua sendo o ÚLTIMO arquivo do
bundle a definir `doLoginUser`** (ordem atual: `login_otimizacao` →
`login_dados_automaticos` → `sistema_clientes_loja` → `ajustes_v5186` →
`ajustes_v52253`). Se um patch novo passar na frente deste, a correção
morreria **em silêncio** — agora o teste acusa.

**Ação pendente para o dono (não faço sozinho):** as senhas que estavam
escritas no bundle precisam ser **trocadas** (e as que eram de demonstração,
apagadas). Não imprimo nenhuma delas no relatório. Enquanto o bundle antigo
circular em algum PC, o par continua válido — a correção vale a partir da
próxima atualização de cada máquina.

### 12.2 ALTO — Segurança — login por CNPJ reativava usuário e sobrescrevia a senha do dono

**Arquivo/local:** `app.js`, função `doLoginCNPJ`.

Três problemas no mesmo bloco (o "caminho da credencial corporativa única"):

1. **Reativação silenciosa de usuário.** `db.usuarios.filter(…).forEach(u => { if(u.senha===…) u.ativo=true; })` — quem tivesse uma senha de demonstração voltava a ficar **ativo** ao entrar por esse caminho, **desfazendo em silêncio** a desativação feita pelo dono. Desativar usuário é decisão do dono; nada pode reverter isso sem avisar.
2. **Sobrescrita da senha do CNPJ.** `emp.senha='…'` gravava a credencial corporativa fixa por cima da senha que o dono configurou, e chamava `saveDB()` — a troca ia para o banco de cada PC.
3. **A credencial corporativa em si é uma senha escrita no código**, em bundle público, para um CNPJ que é público. Concede acesso ao **passo 1** do login (a empresa). Combinada com o backdoor de 12.1, dava entrada completa no sistema.

**Correção aplicada:** os itens 1 e 2 foram **removidos** (o `saveDB()` do bloco continua, porque ele também grava o CNPJ/fantasia corretos). O item 3 **NÃO foi removido de propósito**: essa credencial é o que garante a entrada do dono, e tirá-la poderia **trancá-lo fora**. Fica registrado para ele decidir com calma. O comentário no código explica os três casos.

**Trava:** 5 verificações novas em `test_login_sem_backdoor.js` (não reativa, não sobrescreve, a credencial corporativa continua funcionando e nenhum outro ponto do `app.js` escreve `emp.senha`).

### 12.3 BAIXO — Segurança/Privacidade — tela que listava as senhas de todos os usuários

**Arquivo/local:** `app.js`, `listUsuariosDemo`.

Montava um texto com `login / senha / nome (perfil)` de **todos** os usuários da empresa e mostrava na tela — senha em texto puro, na frente de quem estivesse no PC. A função **não é chamada por nada** (verificado em `.js` e `.html`, fora do bundle gerado), então o risco real era baixo, mas o hábito é ruim e contraria a regra de nunca expor senha.

**Correção:** a lista continua (login, nome, perfil e marca de inativo), **sem as senhas**. Nada mais foi removido.

### 12.4 MÉDIO — Manutenção — 36 testes que nunca rodaram

**Arquivo/local:** `test_runner.js` (a lista de testes é fixa, não descobre arquivo por padrão).

O repositório tem **230 arquivos `test_*.js`** e o runner listava **194**. Ou seja: **36 testes existiam no repositório e nunca eram executados** — nem no `npm test`, nem em CI. Teste que não roda não protege nada, e pior: dá a sensação de cobertura.

Rodei **todos** os 36, um por um:

| Resultado | Quantos | O que fiz |
|---|---|---|
| Passam hoje | **12** | entraram na suíte (inclusive o novo `test_login_sem_backdoor.js`) |
| Falham por **versão cravada no código** | 19 | registrados aqui, **não** entraram (não mascaro falha) |
| Falham porque o **arquivo testado não existe** | 2 | registrados |
| Quebram no próprio teste (**mock incompleto**) | 2 | registrados |

**Resultado:** a suíte foi de **190 → 202 testes passando, 0 falhando**.

**Os 19 testes de versão — causa raiz e correção recomendada (próxima rodada):**
eles conferem se `package.json`, `index.html`, `mobile/www/index.html` e o Worker
têm **a mesma** versão — que é uma checagem útil. O defeito é que ela está escrita
**contra um número fixo** (`=== '5.24.34'`), então morre a cada troca de versão em
vez de conferir. Comprovei o diagnóstico: trocando apenas a versão em
`test_ajustes_v5243.js`, as falhas caem de 7 para 4 — e as 4 que sobram são
**contagens fixas** ("manifest tem 196 scripts", hoje são 225). A correção certa é
comparar **contra `package.json`/`bundle-manifest.json`**, não contra um número
escrito à mão. Não fiz isso nesta rodada porque são 19 arquivos e mexe em teste de
release: quero fazer um a um, conferindo cada assert, em vez de um `sed` global.
Também **não** apaguei nenhum deles.

**Os 4 restantes:**
- `test_correcoes_relatorio.js` e `test_vendas_chamados_reparo.js` leem `correcoes_relatorio_patch.js` e `vendas_chamados_reparo_patch.js` — **procurados no histórico do git e nunca existiram neste repositório**. Testam arquivo que não existe: nunca vão rodar. Sugestão: apagar os dois.
- `test_ajustes_v5184.js` espera que `ajustes_v5184_patch.js` defina `imprimirChamadoPDF`, mas a função vive em **outros** arquivos (`ajustes_v5175`, `ajustes_v5180`, `ajustes_v5186`, `ajustes_v52211`); o teste não monta o original que o patch embrulha.
- `test_ajustes_v5188.js` espera `digicopyLoja`, que **não existe em lugar nenhum do repositório hoje** (nem em `.html`, ou seja: ninguém quebrou). É resíduo de um patch que já não define mais essa função.

Nenhum dos 4 é defeito do sistema em uso — são testes desatualizados ou incompletos. Nenhum deles foi alterado nesta rodada.

### 12.5 Conferência do LAUDO externo — o que se confirmou e o que já estava vencido

O laudo foi produzido sobre uma **foto anterior** do sistema (**v6.1.3 / 222
scripts**); o repositório hoje está em **v6.1.10 / 225 scripts**. Por isso ele foi
**conferido contra o código atual**, ponto por ponto, e **não copiado**:

| Ponto do laudo | Situação conferida | Ação |
|---|---|---|
| Backdoor `admin` + senha de demonstração | **Confirmado e alcançável** (12.1) | ✅ corrigido + travado |
| `/v1/status` expõe o cursor de sincronização (`totals.cursor`) | Confirmado no Worker (`resumoDaNuvem` faz `MAX(seq)`) | informativo: o cursor não é dado sensível, mas revela volume |
| Pausa de sincronização em `escolha-inicial` | Confirmado que existe (`cloudflare_data_sync_patch.js`) | sem ação |
| Regras de negócio **desmarcadas de propósito** para não propagar exclusão | Confirmado: `PODE_EXCLUIR` tem **15** entidades de 22 do banco | deliberado — religar causou o vaivém de dados da v5.22.75; **não** mexer |
| "A migração de regras congela em toda carga" + patch para destravar | **JÁ VENCIDO**: o código atual usa `REGRAS='v6.1.7-conectou-sincroniza'` e **despausa sozinho** (`state.paused=false`), mudança feita em 22/09 por ordem do dono ("conecta e sincroniza na hora, sem apertar botão") | ⛔ **não aplicar** esse patch: ele reintroduziria a pausa que o dono mandou tirar |
| Login com trava de 15 min após 5 erros | **Não implementado** hoje — e o de hoje é **só no navegador**, o que qualquer um contorna | pendente de decisão (ver 12.6) |

**Lição de processo:** o laudo acertou no que mais importava (o backdoor) e errou
no que dependia de contexto (a pausa de regras já tinha sido resolvida). Nenhum
laudo externo entra no sistema sem ser conferido linha por linha contra o código
de hoje — foi essa conferência que trouxe os achados 12.2 e 12.3, que **não**
estavam no laudo.

### 12.6 Pendências registradas nesta rodada (não alteradas de propósito)

1. **Senhas escritas no bundle público** (12.1/12.2) → precisam ser **trocadas** pelo dono. Não imprimi nenhuma.
2. **Credencial corporativa de CNPJ** (12.2, item 3) → decisão do dono: manter como está (e trocar a senha) ou tirar e passar a exigir a senha cadastrada. Tirar sem aviso poderia trancá-lo fora.
3. **Trava de 15 min / 5 erros do laudo** → se for para existir, tem que ser **no Worker** (no navegador não vale nada: quem quiser contorna). Não implementei porque mexe em autenticação de servidor e o desenho certo depende de decidir onde guardar o contador.
4. **19 testes de versão + 4 testes quebrados** (12.4) → próxima rodada, um a um.
5. **Empresa com senha em texto puro sincronizando para a nuvem** (`escolaAuth`) e **pepper/KDF** do Worker → continuam pendentes de janela de migração (já registrados na rodada 1).

---

## 13. RODADA 4 — VERSÃO v7.0.0 E A CONSISTÊNCIA DE TODOS OS ARQUIVOS (23/09/2026)

### 13.1 INFORMATIVO — a tela de usuários: mostrar nada não quebra nada

**Pergunta do dono:** *"da tela que listava login, senha e nome, deixa mostrar nenhum, nada, ou isso causaria algum problema?"*

**Resposta:** não causa problema. Antes de mexer, a varredura cobriu `.js`, `.html`, o `app.bundle.js` gerado, `mobile/www` e `mobile/android` (cópias), `e2e/`, `.cmd` e docs: **nenhum chamador** de `listUsuariosDemo`. Sem chamador, esvaziar a tela não muda nada em uso. Feito: a função continua existindo (se alguém a chamar pelo console, responde sem vazar dado) e **não menciona mais** `login`, `nome`, `perfil`, `senha` nem `db.usuarios` — travado por teste.

### 13.2 ALTO — Performance/Cota — a contagem do dia contava lote que não grava

**Onde:** `cloudflare-worker/src/index.js`, `handlePush`. **Decisão do dono:** *"do somarUso deixo você fazer a melhor opção"*.

**O que foi decidido e por quê:** a chamada `somarUso(...)` estava **antes** da validação do lote e **antes** do freio. Lote inválido (`400 INVALID_MUTATION_BATCH`) e lote recusado pelo freio (`429` com `quota:true`) **não gravam nada** — mas somavam no contador do dia. Como o freio lê esse mesmo contador, cada recusa empurrava o freio para mais cedo em **todos** os PCs: um ciclo que se alimenta. Foi exatamente esse ciclo que a rodada 2 viu de ponta a ponta (o cliente batendo na porta + o contador subindo). Agora a contagem acontece **depois** da validação e do freio, e **antes das gravações**.

**Por que não fui além:** dava para contar só o que foi *efetivamente gravado* (depois do `applyMutation`, descontando duplicata/`noop`). Não fiz porque mexeria no significado do freio (o guarda passaria a poder *subestimar*), e subestimar cota é o lado perigoso — a Cloudflare corta o banco inteiro ao bater o teto. Contador a mais é seguro; a menos, não.

**Trava:** 5 asserts novos em `test_sync_quota_guard.js` (existe; depois da validação; depois do freio; antes das gravações; não sobrou a chamada antiga).

**Pendência declarada:** é código **do Worker**. Só passa a valer depois de regerar o motor (`npm run motor`) e publicar — **nenhum deploy foi feito** (regra: produção exige confirmação do dono).

### 13.3 MÉDIO — Manutenção — a suíte rejeitava qualquer versão 7

O dono pediu v7.0.0 e "conferir todos os arquivos para não dar problema". Ao subir, **63 testes quebraram**. Causa raiz única: asserção de versão escrita como `/^[56]\.\d+\./` — isto é, "a versão tem de começar com 5 ou 6". Não era amarrar a uma versão exata: era a suíte **não aceitar** uma versão maior. Foram **84 ocorrências** em 63 arquivos, trocadas por `/^\d+\.\d+\.\d+$/` e equivalentes — aceita qualquer versão real, e continua conferindo o que importa (o `?v=` do cache, o rodapé e o fato de o relatório/guia citarem a versão publicada). Dois testes que fixavam `=== '6.1.10'` passaram a **ler a versão do `package.json`** (não precisam mais ser reeditados a cada publicação — é a correção do padrão descrito em §12.4).

| Momento | Suíte |
|---|---|
| Antes do bump | 202 passaram / 0 falharam |
| Logo depois do bump | 139 passaram / **63 falharam** |
| Depois do conserto das asserções | **202 passaram / 0 falharam** |

### 13.4 ALTO — Manutenção — os links oficiais apontavam para a branch da sessão anterior

**Onde:** `package.json > digicopy.branch` = `arena/01a0c087-teste` (branch da sessão **anterior**, parada em `26649cc3`), enquanto o trabalho está em `arena/01a0cf4a-teste`.

**Impacto real:** `links.js`, `sync_build.js` e `guardar_repo.js` montam os links a partir desse campo. Ou seja: **o ZIP que o dono baixa e os links impressos a cada publicação levavam para código velho** — sem as correções de segurança da rodada 3 e sem v7.0.0. O `guardar_repo.js` ainda avisa que não empurra de outra branch (a proteção funcionou, mas o campo estava errado).

**Corrigido para `arena/01a0cf4a-teste`** e propagado para os lugares que ensinam isso ao dono: `BUILD_EXE.md`, `cloudflare-worker/README.md` (a *production branch* do Worker) e `PASSO_A_PASSO_NUVEM_E_SITE.html` — este último é o guia que ele segue no painel da Cloudflare e estava ensinando a apontar Pages/Worker para a branch antiga (e mostrava app v6.1.3/worker 5.26.4 na capa; atualizado para v7.0.0 e 5.26.5, mantendo o registro histórico do dia 21/09).

**Decisão de arquitetura sugerida (não feita, é dele):** a cada sessão a branch muda e esse campo envelhece de novo. O remédio de raiz é uma **branch fixa de publicação** (ex.: `publicacao`) que o dono sempre baixa, e o trabalho acontece nas branches de sessão.

### 13.5 INFORMATIVO — versões re-ancoradas e um falso alarme

- Re-ancorados para **v7.0.0**: `importar.html`, `GUIA_DE_TESTE_NF.html` (6 pontos), `RELATORIO_DE_TESTE_NF.html` (4 pontos). Referências ao **worker v5.26.5** e ao **gerente v5.26.3** mantidas de propósito (são outros componentes).
- **Nada no app compara versão** — varredura por `compareVersion`/`semver`/comparação de versão não achou nada. No Worker, `compararVersao` compara pedaço numérico por pedaço (correto para `7.0.0 > 6.1.10`), e `checarTrocaDeVersao` **tira uma foto de backup rotulada com a versão anterior** no primeiro envio da versão nova — comportamento esperado e desejável.
- **Falso alarme:** `build_bundle.js` imprime o sha256 do **corpo** do bundle; o `?v=` do cache usa o sha256 do **arquivo inteiro**. Dois números diferentes, ambos corretos, ambos com `--check` passando. Registrado para não ser "consertado" no futuro.

### 13.6 O que continua pendente depois desta rodada

1. **Trocar as senhas que estavam escritas no bundle** (rodada 3) — não imprimo nenhuma.
2. **Credencial corporativa de CNPJ**: manter (trocando a senha) ou remover e passar a exigir a senha cadastrada — decisão do dono; mexer sem aviso poderia trancá-lo fora.
3. **Trava de 15 min/5 erros**: só tem valor **no Worker** (no navegador se contorna). Não implementada.
4. **19 testes antigos** com versão cravada (`5.24.34`) e **4 testes quebrados** (§12.4): fora da suíte, não afetam uso; correção caso a caso.
5. **Publicar o Worker** (motor + deploy) para o conserto do `somarUso` chegar à nuvem — depende do dono.

## 14. RODADA 5 — O DUPLO CLIQUE DAS TABELAS (23/09/2026)

### 14.1 MÉDIO — Bug — o duplo clique de 5 tabelas abria o modal de PRODUTO

**Onde:** `app.js` linhas 1111 (usuários), 1121 (auditoria), 1190 (equipamentos),
1235 (leituras) e 1263 (ordens de serviço).

**O que era:**

```html
<tr ondblclick="openModal('produto','${p.id}')" class="hover:bg-slate-50 cursor-pointer">
```

Nas cinco telas a variável da linha é outra (`u` usuário, `l` log, `e` equipamento,
`o` OS). A variável `p` **não existe em nenhum lugar do arquivo** — a linha foi
copiada da tabela de produtos (de uma versão dela que tinha duplo clique) e o
`p.id` ficou junto.

**Por que ninguém viu o erro:** isso roda como atributo inline (`onclick`/`ondblclick`),
então o `ReferenceError` sai só no console do navegador. Para quem usa, o efeito é
"o duplo clique não faz nada" — sem mensagem, sem rastro. Na tabela de produtos o
duplo clique hoje nem existe mais; ou seja, o trecho sobreviveu cinco vezes como
resíduo de um comportamento que nem está mais lá.

**Causa raiz:** copiar/colar de bloco de `<tr>` entre telas. O `class="cursor-pointer"`
ficou junto e é o que dá a pista falsa de que a linha é clicável.

**Correção (5 linhas):** usuários → `openModal('usuario','${u.id}')`;
equipamentos → `openModal('equipamento','${e.id}')`; leituras →
`openModal('leitura','${l.id}')`; OS → `openModal('os','${o.id}')`. Na auditoria,
que é log e não tem tela de detalhe, o duplo clique foi removido (com o
`cursor-pointer`), porque apontava para um modal que não faz sentido para um registro
de log.

**Preservação:** a tabela de produtos não foi tocada; nenhum modal foi criado,
renomeado ou removido; as funções chamadas (`openModal` etc.) são as mesmas que os
botões de lápis da própria tabela já usavam — só passaram a valer para o duplo clique
também. **Teste:** `test_linhas_tabela_clique.js` (19 verificações) confere, tela por
tela, que o modal aberto é o da própria tabela e que a variável é a da própria linha;
ele quebra se alguém copiar a linha errada de novo. Registrado em `test_runner.js`.

**Varredura do padrão em todo o repo:** `grep -o 'ondblclick="openModal([^"]*"' app.js`
→ 4 ocorrências, todas corretas depois da correção; nenhuma outra tabela/patch usa
`${p.id}` em linha de outro tipo. Os 11 `${p.id}` restantes do `app.js` são de código
que realmente itera produtos (`db.parque.filter(p=>…)`, `db.produtos.filter(p=>…)`).

**Não foi possível verificar diretamente** o comportamento no navegador real a partir
deste ambiente (sem rede de saída). Verificação feita por leitura de código + teste
automatizado; a confirmação visual é um duplo clique em cada tela.

### 14.2 Resumo da rodada

| # | Gravidade | Tipo | Item | Estado |
|---|-----------|------|------|--------|
| 14.1 | MÉDIO | Bug | duplo clique de 5 tabelas chamava o modal de produto | CORRIGIDO + travado por teste |

Suíte: 203 passaram, 0 falharam (4 pulam por falta de `jsdom` no ambiente).
Bundle: 225 scripts, sha256 `06304bac1ecc2328`.

## 15. RODADA 6 — SINCRONIZAÇÃO, A IMPRESSORA QUE SUMIA E A SENHA DO DONO (23/09/2026)

### 15.1 CRÍTICO — Bug (perda de dados) — a impressora que sumia do contrato

**Onde:** `locacao_patch.js`, passo 6 ("LIMPEZA DE DADOS DE DEMONSTRAÇÃO"), linhas ~385-401.

**Evidência (código antes da correção):**

```js
const demoCtrIds = db.contratos
  .filter(c=>c.empresaId===empId && !jbEhMigracao(c) && !c.codigoAntigo && /^CT-\d{4}-\d{4}$/.test(c.numero||''))
  .map(c=>c.id);
if(demoCtrIds.length){
  db.contratos = db.contratos.filter(c=>!demoCtrIds.includes(c.id));
  db.parque    = db.parque.filter(p=>!demoCtrIds.includes(p.contratoId));   // ← as impressoras
  db.leituras  = db.leituras.filter(l=>!demoCtrIds.includes(l.contratoId) && ...);
  db.contasReceber = db.contasReceber.filter(cr=>!demoCtrIds.includes(cr.contratoId));
}
```

**Causa raiz:** o detector de "dado de exemplo" usava **o formato do número** como assinatura.
Só que esse formato é o que o **próprio sistema** gera para contrato real — `app.js`
`renderModalContrato`: `numero:'CT-'+ano+'-'+String(...).padStart(4,'0')` = `CT-2026-0001`.
Qualquer contrato criado na tela era, portanto, indistinguível do exemplo. O gatilho é a
**importação dos dados do sistema antigo** (o passo 6 só roda quando chega dado real:
`if(result.contratos>0 || result.parque>0 || ...)`), o que explica o relato "não sei quanto
tempo depois, ela some do nada". O **mesmo defeito** existia no filtro dos chamados
(`/^OS-\d{4}-\d{4}$/`, e `OS-2026-0001` é o formato gerado por `vosNextNumero`).

**Impacto:** perda de contrato + parque (impressoras) + leituras + faturas do dono, e a
propagação da exclusão para a nuvem pela fila de mutações.

**Correção:** a decisão passou a exigir, além do número, **ausência de dono humano**
(`jbSemDonoHumano`: `criadoPor` vazio, `'sistema'` ou `'demo'`). Registro criado na tela grava
`criadoPor = sess.usuarioId` → nunca mais entra na limpeza. Aplicado nos **dois** filtros
(contratos e chamados). A limpeza continua existindo para o caso legítimo (sobras do seed).
**Teste:** `test_contrato_impressora_nao_some.js` (17 verificações) executa a função real
extraída do arquivo e prova os dois lados.

**Varredura do padrão no repo (regra "consertar todas as ocorrências"):** nenhum outro ponto
apaga `contratos`/`parque`/`leituras` por formato de número. Os demais `filter` em `db.parque`
são: exclusão em cascata pedida pelo usuário (`ajustes_v52023_patch.js`), exclusões explícitas
da fila de sincronização (`PODE_EXCLUIR`) e a faxina de **técnicos** de demonstração
(`varrerDemonstracao`, que só olha `tecnicos`, uma vez, por nome — não toca contrato).

### 15.2 CRÍTICO — Segurança — a senha do dono não podia ser trocada

**Onde:** `app.js:369` (`seedData`, que roda em toda carga) e `patch_relatorio.js:43-49`.

**Evidência (antes):**

```js
if(u.senha !== g.senha){ u.senha = g.senha; mudou = true; }   // seed reimpõe a senha de fábrica
...
if(deni && deni.senha === '1234'){ deni.senha = '3232'; }     // patch troca a senha sozinho
```

**Causa raiz:** o seed foi escrito para "garantir os 2 usuários reais com as credenciais
corretas" e, para isso, reescrevia **a senha** a cada carga. Consequência prática: o dono
troca a senha na tela Usuários e ela **volta ao valor de fábrica** na próxima abertura — logo,
a senha que está no histórico do repositório (repo privado, mas histórico é histórico)
continua valendo para sempre. Impedia a rotação pedida.

**Correção:** a senha existente **não é mais tocada** (o padrão de fábrica serve só para
**criar** o usuário na primeira vez, em base vazia); `perfil`, `nome`, `id`, `empresaId` e
`ativo` continuam garantidos de propósito. A migração antiga do `patch_relatorio.js` passou a
rodar **uma única vez** (marca `senhaMigradaV701`), para nunca mais desfazer uma escolha do
dono. **Teste:** `test_senha_do_dono_manda.js` (10 verificações) — nenhuma senha real é lida
nem impressa; o teste confere só o formato do código (quem escreve o quê).

**Pendência que continua dele:** a **rotação das senhas** expostas no histórico (as contas de
acesso do programa e a senha de conexão da loja). Nada de senha é impresso em relatório.

### 15.3 ALTO — Performance/Manutenção — a sincronização demorava e parava escondida

**Onde:** `cloudflare_data_sync_patch.js` (`HEARTBEAT_MS=60000`, `scheduleHeartbeat`) e o
caminho de aplicação das mudanças (`pullAll` → `applyRemote`).

**Evidência:** `const HEARTBEAT_MS=60000;` e, no batimento,
`timer=setTimeout(()=>{if(!document.hidden)tick('heartbeat');else scheduleHeartbeat();},wait)`
— com a janela escondida ele **reagendava sem consultar**. Em cima disso, `applyRemote` grava
no `db` mas **não redesenha a tela**: a novidade existia no banco e não aparecia na lista.

**Impacto:** o que um PC fazia demorava até 60 s para aparecer no outro (e não aparecia
enquanto a janela do segundo estivesse atrás/escondida); a lista na tela só mudava ao trocar
de tela e voltar. É exatamente o relato do dono.

**Correção:** `HEARTBEAT_MS=15000` (janela à vista), `HEARTBEAT_OCULTO_MS=120000` (escondida:
continua consultando, mais devagar — aba oculta é estrangulada pelo navegador) e **tela ao
vivo**: quando a leitura traz mudança, o render da tela da frente é chamado, sob a regra pura
`podeRedesenharSync` (não faz com janela escondida, modal aberto, cursor em campo, tela de
documento fora da lista, nem em rajada < 4 s). Usa o **render** da tela, não o `navigateTo`
(que faria `scrollTo` no topo e mexeria na barra lateral). **Teste:**
`test_sync_tela_ao_vivo.js` (30 verificações).

### 15.4 BAIXO — Manutenção — duas remoções pedidas pelo dono

- **Botão `erro.txt` do rodapé** (`index.html:220` + cópia do celular): removido por ordem dele
  ("remove ele pfv"). O **motor** permanece — o aviso de erro continua abrindo/baixando o
  arquivo e a função `digicopyAbrirOuBaixarErroTxt` segue no sistema; o guia de teste foi
  atualizado (não era mais verdade que o botão estava lá).
- **Caixa "O que são as 3 permissões?"** (`permissoes_estorno_venda_patch.js`: injeção do botão
  `p605-ajuda-perm`): desligada; o texto da explicação (`window.permissoesAjuda`) continua
  disponível para reuso. Os dois testes que exigiam esses elementos foram reescritos para
  exigir o novo estado (a ordem do dono muda a especificação, então o teste acompanha).

### 15.5 INFORMATIVO — o que foi conferido e está de pé

- A faxina de demonstração de **técnicos** (`varrerDemonstracao`) **não** toca contrato, parque,
  leituras nem financeiro: só `tecnicos`, uma vez, por nome — sem relação com a perda relatada.
- A exclusão em cascata de cliente (`ajustes_v52023_patch.js`) é ação de tela (com resumo e
  contagem antes de apagar), não automática.
- A gravação da senha **na nuvem** continua em hash (Worker `senhaHash`/`conferirSenha`).
- `devolverSumidos()` (rotação de recuperação) pode trazer de volta registros que sumiram do PC
  vindos da foto `antes_espelhar_nuvem` do IndexedDB — é o caminho de recuperação em caso de
  perda, junto com as fotos de backup da nuvem.

### 15.6 Resumo da rodada

| # | Gravidade | Tipo | Item | Estado |
|---|-----------|------|------|--------|
| 15.1 | CRÍTICO | Bug | impressora/contrato apagados como "demonstração" na importação | CORRIGIDO + travado |
| 15.2 | CRÍTICO | Segurança | senha do dono reimposta pelo seed (rotação impossível) | CORRIGIDO + travado |
| 15.3 | ALTO | Performance | sync de 60 s e parada com janela escondida + tela sem redesenho | CORRIGIDO + travado |
| 15.4 | BAIXO | Manutenção | botão erro.txt e caixa "3 permissões" (ordem do dono) | REMOVIDOS |

Versão **v7.0.1**. Suíte: **206 passaram, 0 falharam** (4 pulam por falta de `jsdom` no
ambiente). Bundle: 225 scripts, sha256 `0e4a03cd9317f97c`.

## 16. RODADA 7 — RECUPERAÇÃO DO QUE SE PERDEU, CARGA COMPLETA E SENHA INVISÍVEL (23/09/2026)

### 16.1 CRÍTICO — Recuperação dos registros já apagados (perda de dados relatada)

**Relato:** "muitos contratos já perderam impressoras, por exemplo o CAIXA ESCOLAR
GERALDO TELES DE MENEZES, e vários outros, os dados dentro também".

**O que foi descoberto (e é o que permite recuperar):** a nuvem faz **exclusão lógica**.
`handleDeleted`/`handleRestore` (`cloudflare-worker/src/index.js`) mostram que o registro
excluído mantém `data_json` e a data da exclusão, e `/v1/restore` recoloca o registro a
partir desse conteúdo. Portanto os dados apagados pela faxina (`locacao_patch.js`,
corrigida em §15.1) **continuam no banco da nuvem** e podem voltar.

**Ferramenta entregue** (`ajustes_v52296_backups_nuvem_patch.js`, painel Nuvem → Backups):
botão "🩹 Trazer de volta o que foi excluído" — lê `/v1/deleted?limit=200`, filtra as
entidades de negócio (nunca `usuarios`/`empresas`/`config`/`_seq`), mostra o resumo por
entidade e o período, pede confirmação no modal do sistema e restaura em lote por
`/v1/restore`, sincronizando em seguida. Restrição real: **só ADMIN** (o Worker exige
`requireAdmin`) e a lista vem do mais novo para o mais antigo (200 por clique).

**Impacto do defeito original:** perda de contratos + parque (impressoras) + leituras +
faturas, propagada à nuvem pela fila de mutações. **Mitigação estrutural já aplicada:**
a causa raiz foi corrigida em §15.1 (a faxina não decide mais por formato de número) e
travada por teste; esta ferramenta devolve o que já havia sido perdido.

**Não foi possível verificar diretamente** o conteúdo real do banco de produção
(acesso indisponível) — vale o que o código do Worker mostra (exclusão lógica com
`data_json` preservado) e a lista que o próprio sistema exibe na tela.

**Nota de arquitetura (registrada de propósito):** o código da recuperação foi para
dentro do patch da tela de Backups porque o bundle tem a regra "um arquivo por módulo",
travada por 7 testes (`test_ajustes_v52284/85/86/87/52436/5260/5263`). A primeira versão
(arquivo novo) quebrou os 7 — foi revertida. Registro honesto: **não** se alteram as
travas de composição do bundle para abrir exceção; respeitou-se a regra.

### 16.2 ALTO — Performance — "os dados da nuvem aparecem de pouco em pouco"

**Causa:** a leitura da nuvem é paginada (`/v1/changes`, página de 500) e cada página era
aplicada com a tela visível — dava a sensação de base incompleta e enchia aos poucos.
Em cima disso, a tela ao vivo da §15.3 redesenha a cada mudança (correto no uso normal,
ruim durante a carga inicial).

**Correção:** (a) **aviso de carga completa** em tela cheia com contagem, ligado na
primeira sincronização (`!state.initialPull`) e no "baixar tudo"; a lista só aparece
quando tudo chegou, e o aviso some no fim ou em caso de erro; (b) redesenho automático
desligado enquanto a carga corre (`podeRedesenharSync` recebeu `cargaAberta`);
(c) página de **1000** registros (Worker `MAX_CHANGE_LIMIT` 500 → 1000; o cliente já pede
1000 — sem o deploy o Worker limita em 500 e nada quebra).

### 16.3 ALTO — Segurança — a senha do usuário ficava visível na tela

**Onde:** `ajustes_v5196_patch.js:193` (modal em uso), `ajustes_pos_final_patch.js` e
`app.js:1008` — os três renderizavam `<input ... value="${...u.senha}">`, isto é, a senha
ia **dentro do HTML** (visível por "inspecionar"/Ctrl+U, plugin, extensão).

**Correção:** campo nasce **vazio** nos três; criar usuário continua exigindo senha;
**editar com o campo em branco mantém a senha atual** (antes, salvar dependia da senha
estar no campo — com o campo vazio, a senha seria apagada). Varredura: nenhum outro
ponto do repo renderiza senha.

**Pendência declarada (não feita nesta rodada, de propósito):** o registro `usuarios` é
sincronizado inteiro, então a **senha do usuário continua viajando e ficando guardada em
claro na nuvem** (dentro do `data_json` e nos arquivos de backup). O conserto é mandar
apenas um hash e o login aceitar hash — mexe no caminho de login (módulo mais sensível,
já com teste de backdoor), então exige rodada própria: migração, compatibilidade com PCs
que ainda não atualizaram e teste dedicado. Registrado como **próximo item de segurança**.

### 16.4 Decisão do dono registrada: trava de 15 minutos — NÃO

O dono decidiu não instalar a trava local de tentativas de login ("precisa não"). A
proteção do Worker (acesso pela internet) permanece. Nada foi alterado.

### 16.5 Resumo da rodada

| # | Gravidade | Tipo | Item | Estado |
|---|-----------|------|------|--------|
| 16.1 | CRÍTICO | Bug/perda de dados | recuperação em massa do que já foi apagado | FERRAMENTA ENTREGUE + testada |
| 16.2 | ALTO | Performance | carga inicial "de pouco em pouco" | CORRIGIDO (aviso + 1000/página) |
| 16.3 | ALTO | Segurança | senha visível no HTML do modal | CORRIGIDO; hash na nuvem = próxima rodada |
| 16.4 | — | Decisão | trava de 15 min | NÃO instalar (decisão do dono) |

Versão **v7.0.2**. Suíte: **207 passaram, 0 falharam** (4 pulam por falta de `jsdom`).
Bundle: 225 scripts, sha256 `9bba7e4cd0187252`.

## 17. RODADA 8 — SINCRONIZAÇÃO DE 3 EM 3 SEGUNDOS E O FIM DA TELA NA FRENTE (23/09/2026)

### 17.1 ALTO — Bug — a "aba líder" esquecida segurava a atualização

**Onde:** `cloudflare_data_sync_patch.js` — guarda de liderança (`leader()`, constante
`LEADER_KEY`) no início de `tick()`: `if(state.paused||busy||!authorized()||!leader())return false;`.

**Evidência do defeito:** a liderança é um aluguel em `localStorage` (`{id, until: now+90s}`)
renovado a cada rodada pelo próprio dono. Uma aba **escondida mas viva** continua renovando o
aluguel indefinidamente. Como **só a líder puxava** novidades, a aba **visível** que o dono
estava olhando recebia `return false` a cada rodada e **nunca buscava** — e as duas abas têm
`db` em memória próprio (a leitura da aba escondida não aparece na tela da aba visível).
Efeito para o dono: tela velha, sem erro, sem aviso, "demora de chegar".

**Correção:** caminho `tickSohLeitura(reason)` — **qualquer aba visível puxa** (apenas leitura);
a aba visível não faz trabalho de líder (não envia remessa, não roda `varrerDemonstracao` nem
`devolverSumidos`); **aba escondida e não-líder não gasta consulta**. A liderança continua valendo
para o que **escreve** (uma remessa por navegador) — o motivo original do mecanismo.

### 17.2 ALTO — Performance — ritmo da consulta: 3 s

| Situação | v7.0.0 | v7.0.1 | v7.0.3 |
|---|---|---|---|
| Janela à vista | 60 s | 15 s | **3 s** |
| Janela escondida | não consultava | 120 s | 15 s |
| Ao focar a janela | 10 s de tolerância | 10 s | **na hora** (1 s) |

**Custo verificado no código (não presumido):**
- `/v1/changes` é **uma** consulta incremental por cursor; `changes.seq` é `INTEGER PRIMARY KEY`
  (rowid) com `idx_changes_cursor` — busca por índice, **não degrada** com o crescimento.
- `somarUso(env, 0, 60, ctx)` só soma **em memória** (`__USO_PEND`) e desce ao banco junto de uma
  gravação real ou a cada 15 min — ou seja, **consultar mais não gera gravação** e não aproxima
  o freio de cota.
- Ordem de grandeza: 3 s ≈ 20 consultas/min/PC ≈ 12 mil/dia útil. Plano pago: 25 bi leituras/mês,
  10 mi requisições/mês. O medidor **estima** 60 leituras por consulta — o número exibido na tela
  de uso vai crescer (estimativa conservadora, não gasto real); documentado para não virar susto.
- `PUSH_BATCH=10` e a escada de espera `comPaciencia` (900 ms→12 s) **intocados**
  (`test_cloudflare_data_sync.js` trava os dois).
- Regra 28 (REGRAS_PERMANENTES): segue **local-first, incremental**; nada de substituir a base
  inteira nem instalar atualização fora do fluxo autorizado.

### 17.3 MÉDIO — Manutenção — o aviso de carga aparecia quando não precisava

Ordem do dono: "de mostrar dados quero NADA que envolva eu fazer alguma coisa, só quero que
mostre normal". O aviso de carga completa (v7.0.2) foi restringido: **só aparece quando este PC
não tem base** (`localBusinessCount()===0`) — aí não há o que mostrar de qualquer forma. Com base
existente, a leitura corre **em silêncio** e a tela se atualiza no fim.

### 17.4 Opções registradas para "instantâneo de verdade" (decisão pendente do dono)

| Opção | Mecanismo | Ganho | Custo/risco |
|---|---|---|---|
| A (aplicada) | consulta 3 s + imediata no foco | 0–3 s | nenhum |
| B | long polling no Worker (segura a consulta ~20 s e responde na hora em que houver novidade) | < 1 s | exige **recuo automático** para o Worker antigo e mais CPU; só entra depois do deploy do motor |
| C | Durable Object + WebSocket (push real) | instantâneo | **mudança de arquitetura** (binding, migração, componente novo): exige justificativa escrita e rodada própria |

Recomendação técnica: manter **A** agora; avaliar **B** depois que o motor da nuvem for publicado
(ele ainda não rodou `atualizar_motor_nuvem.cmd`). Nada de **C** no meio de conserto.

### 17.5 Resumo da rodada

| # | Gravidade | Tipo | Item | Estado |
|---|-----------|------|------|--------|
| 17.1 | ALTO | Bug | aba líder esquecida impedia a aba visível de atualizar | CORRIGIDO + travado |
| 17.2 | ALTO | Performance | ritmo 60 s → 3 s; foco consulta na hora | CORRIGIDO + travado |
| 17.3 | MÉDIO | Manutenção | aviso de carga só em PC sem base | CORRIGIDO |

Versão **v7.0.3**. Suíte: **207 passaram, 0 falharam** (4 pulam por falta de `jsdom`;
**e2e/playwright não está instalado neste ambiente — não foi rodado**).
Bundle: 225 scripts, carimbo `?v=7.0.3-f9dec142dbc5`.

## 18. RODADA 9 — AVISO INSTANTÂNEO E RECUPERAÇÃO AUTOMÁTICA (23/09/2026)

### 18.1 ALTO — Performance — aviso instantâneo (long polling na nuvem)

**Pedido:** "não sabe o que é instantâneo já aparecer os dados?".

**Antes:** o PC perguntava ao servidor a cada 3 s (v7.0.3) — no melhor caso, 3 s de atraso.
**Agora:** o PC mantém um canal aberto (`GET /v1/changes/watch?cursor=...&timeout=20`); o motor
novo devolve **no instante** em que `changes` cresce. Latência percebida: a da rede (~0,1–0,5 s).

**Custo (conferido no código, não presumido):** a cada ~1 s uma consulta `SELECT MAX(seq) FROM
changes` — atendida pela chave primária (rowid), **não grava nada**, teto de 25 s por canal.
`Worker novo + PC antigo`: rota ociosa. `PC novo + Worker antigo`: 404 → o PC marca o canal como
indisponível e segue no ritmo de 3 s (recuo automático, sem erro na tela).

### 18.2 CRÍTICO — Bug — a recuperação não alcançava o que se perdeu (duas causas)

**Relato:** "NADA APARECEU NOS CONTRATOS NOVAMENTE, AS IMPRESSORAS, NADA".

1. **Lista curta:** `handleDeleted` devolvia no máximo 200 registros, sem paginação e sem filtro
   — se as exclusões do período da faxina estivessem além dos 200 mais recentes, **nunca eram
   alcançadas**. Corrigido: `before` (deleted_at < before), página de até 1000, `temMais` e
   `proximoBefore` na resposta; o PC varre em levas até o fim.
2. **Critério rígido demais:** a primeira versão só aceitava `criadoPor` de usuário de tela.
   Várias telas (contratos/visitas) gravam a impressora com `criadoPor:'migracao'` — dado **real**
   importado do sistema antigo. Corrigido: `migracao` é dono legítimo; ficam de fora apenas o
   dado de exemplo (`''`, `sistema`, `demo`).

### 18.3 ALTO — Manutenção — recuperação automática (sem ação do dono)

A passada que era um botão virou automática: ao conectar, o PC varre **todos** os excluídos da
nuvem, restaura os que têm dono de gente, varre também as **fotos internas do PC**
(`listSnapshots()` novo no módulo IndexedDB — para o caso de o dado nunca ter subido), registra
na Auditoria e avisa no sino. Garantias: **lista do que já trouxe** (não ressuscita duas vezes um
registro que o dono apagou de propósito depois), tentativa no máximo a cada 60 s em caso de
falha, e a passada única **não é consumida** enquanto o motor da nuvem for o antigo (fases: avisa
no sino uma vez e fica pendente até o deploy).

### 18.4 Decisão do dono registrada — senhas

Ele decidiu **não** trocar as senhas ("deixa a mesma senha, pois eu nunca nem compartilhei esse
site direito, somente eu e meu pai"). Item de rotação **encerrado por decisão dele** — não
reabrir nas próximas rodadas; se ele quiser trocar algum dia, é a tela Usuários (a troca passou a
funcionar na rodada 6). O que **continua valendo** da rodada 7: a senha não aparece mais em
nenhuma tela (item 16.3).

### 18.5 Estado do motor da nuvem (informado pelo dono)

Deploy feito por ele: migrações já aplicadas ("No migrations to apply") e
`digicopy-sync-api` publicado, respondendo `"versao":"5.26.5"`. **Pendente:** publicar de novo
para o **5.26.6** (canal instantâneo + varredura completa dos excluídos). Sem esse deploy, o
sistema continua correto: instantâneo não liga e a recuperação fica pendente (avisa uma vez).

### 18.6 Resumo da rodada

| # | Gravidade | Tipo | Item | Estado |
|---|-----------|------|------|--------|
| 18.1 | ALTO | Performance | aviso instantâneo por long polling | FEITO (liga com o Worker 5.26.6) |
| 18.2 | CRÍTICO | Bug | recuperação não alcançava exclusões antigas / ignorava 'migracao' | CORRIGIDO |
| 18.3 | ALTO | Manutenção | recuperação automática (nuvem + fotos do PC + Auditoria + sino) | FEITO |
| 18.4 | — | Decisão | senhas | encerrado por decisão do dono |

Versão **v7.0.4** · Worker **5.26.6** (a publicar) · Suíte **207/0** (4 pulam por falta de `jsdom`)
· Bundle 225 scripts, sha256 do corpo `0e8825dcca79cc3f`.

## 19. RODADA 10 — OS DEFEITOS DO PC (a tela que secava) — 23/09/2026

Contexto: o dono publicou o motor da nuvem 5.26.6 (confirmado por ele) e a lentidão continuou.
A investigação saiu da nuvem e foi para o cliente. **Cinco defeitos, todos no PC**, sendo o
primeiro introduzido pela própria auditoria na v7.0.1.

### 19.1 CRÍTICO — Bug — a tela deixava de se atualizar definitivamente

**Onde:** `cloudflare_data_sync_patch.js` — `podeRedesenharSync` / `redesenharTelaAtual`.

**Evidência (antes):** `focoEmCampo: /INPUT|TEXTAREA|SELECT|BUTTON/.test(a.tagName)`.

**Cadeia do defeito:** clicar em um item de menu deixa `document.activeElement` = aquele BOTÃO
(navegador não devolve o foco ao body) → `focoEmCampo` verdadeiro → redesenho recusado em todas
as rodadas seguintes → e, como `applyRemote` já marcou `state.versions[k]`, a mudança **nunca
mais** é novidade → nenhum evento futuro pede redesenho. A lista fica obsoleta de forma
permanente, sem erro e sem aviso. Corrige o sintoma "mudei no outro PC e aqui não aparece".

**Correção:** (a) `BUTTON` fora do teste (só `input/textarea/select` e `isContentEditable`);
(b) **redesenho pendente**: recusa não descarta mais a atualização — ela é reaplicada na primeira
brecha (clique, `focusout`, batimento de 3 s). A invariante nova: *toda leitura que trouxe
mudança termina com a tela em dia, não importa quantas vezes o redesenho tenha sido adiado.*

### 19.2 ALTO — o painel do contrato (impressoras) não era redesenhado

`renderContratos()` redesenha a tabela; o painel `#contrato-detail` (onde aparecem as impressoras
do contrato) é conteúdo separado e ficava velho. Agora, no redesenho, se o painel estiver
visível, o id do contrato é lido do próprio HTML do painel e `openContratoDetail(id)` é chamado —
sem depender da ordem de carga de patches (nenhum override novo).

### 19.3 ALTO — recuo de falha levava a espera a 5 minutos

`5 s·2^min(failures,6)` → até **300 s**. Com a janela à vista o recuo agora para em **30 s**;
escondida mantém o recuo longo. Leitura de aba visível também **zera** `failures` (antes só o
envio bem-sucedido zerava, então um erro de rede deixava o recuo "pegado").

### 19.4 ALTO — marca obsoleta de limite diário dormia o dia

`state.limiteAte` (persistido) podia estar no futuro por erro de versão antiga → o PC só voltava
às 21h. Agora é **sonda de 60 s** (`tick('limite-conferido')`), sem custo de gravação; o sucesso
limpa o estado pelo caminho normal. `test_ajustes_v52280.js` foi realinhado ao novo nome do
evento, preservando a intenção original (não bater na porta à toa).

### 19.5 MÉDIO — canal instantâneo podia morrer no arranque

Saída antecipada (nuvem ainda não autorizada) não reagendava. Agora reagenda em 5 s.

### 19.6 NOVO — Diagnóstico no painel da Nuvem

Mostra: versão do app deste PC, versão do motor da nuvem (`/health`), última sincronização
(`info.lastOk`), pendências (`info.pending`/`outbox`), aviso instantâneo ligado/desligado, estado
de pausa com motivo, último erro — e botão **"Conferir agora"** que executa `tick('diagnostico-manual')`
e informa em ms o resultado. Sem senha, token ou dado de negócio.

### 19.7 Resumo da rodada

| # | Gravidade | Tipo | Item | Estado |
|---|-----------|------|------|--------|
| 19.1 | CRÍTICO | Bug (regressão v7.0.1) | foco em botão travava o redesenho para sempre | CORRIGIDO + travado |
| 19.2 | ALTO | Bug | painel do contrato (impressoras) ficava velho | CORRIGIDO |
| 19.3 | ALTO | Performance | recuo de falha até 5 min | CORRIGIDO |
| 19.4 | ALTO | Bug | marca antiga de limite dormia o dia | CORRIGIDO |
| 19.5 | MÉDIO | Bug | canal instantâneo morria no arranque | CORRIGIDO |
| 19.6 | — | Manutenção | diagnóstico visível na Nuvem | FEITO |

Versão **v7.0.5** · Suíte **208/0** (4 pulam por falta de `jsdom`) · Bundle 225 scripts,
sha256 do corpo `3c7983444a38d6ad`.

**Responsabilidade registrada:** 19.1 nasceu na v7.0.1 (desta auditoria) e sobreviveu a três
rodadas de teste porque os testes verificavam a REGRA pura, não o que ela fazia com o foco do
navegador depois de um clique. Fica a lição aplicada: as regras de interface deste projeto
precisam de teste de integração com DOM real quando o `jsdom`/e2e estiver disponível.


## 20. RODADA 11 — "POR QUE FICA VOLTANDO?" O PC RELENDO O DIÁRIO INTEIRO (23/09/2026)

**Pedido do dono:** *"pq fica voltando, tem como resolver? tudo cadastrado ate
28-08-2026 ao atualizar o sistema sobe rapindinho e o que foi feito depois demora
atualizar e vai subindo aos poucos"*.

### 20.1 Como o problema foi localizado
Três leituras de código e **uma medição**:

1. `cloudflare_data_sync_patch.js:186` (`aplicarSoNuvem()`): no modo SÓ NUVEM (padrão,
   decisão do dono na v6.1.5 / regra 44) o arranque **zera `state.cursor`**, zera
   `state.versions` e marca `initialPull`. Somado a `soltarCopiaLocal()` (localhost +
   IndexedDB apagados), o resultado é: **em cada abertura o PC relê o diário inteiro**.
2. `applyRemote()`: `arr.findIndex(...)` para localizar o registro de cada mudança —
   **O(n) por mudança**, com o diário em ordem crescente de `seq`. Custo total
   O(mudanças × registros): bilhões de comparações numa base grande. O efeito
   percebido é exatamente o relatado: as listas pequenas do começo do diário
   passam rápido; o fim (o que foi feito por último) arrasta.
3. `persist()`: gravava `STATE_KEY` (versões + conhecidos + hashes de toda a base) +
   a fila **em cada chamada**, e `pushOutbox()` chama `persist()` **a cada lote de 10
   registros** → reescrever 6,5 MB por lote. `scanLocal()` era chamado a cada tick de
   3 s e **refazia a cópia (`clean`) e o hash de todos os registros** (≈200 ms por
   varredura numa base de 76 mil registros, bloqueando a linha de execução da tela).
4. `nuvemTemTudo()` chamava `/v1/status?fresh=1` a cada 3 s → o Worker refazia a
   contagem de todos os registros e mudanças (`resumoDaNuvem(env, true)`) para
   responder; com base grande isso concorre com as consultas que trazem os dados.

Medição (`banco_de_prova_nuvem.js`, base sintética de 76.550 registros / 91.862 mudanças, API
de nuvem instantânea — mede **o trabalho do PC**): 1ª carga **17.240 ms**; ciclo de
repouso **767 ms**.

### 20.2 Correções aplicadas (arquivo `cloudflare_data_sync_patch.js`, v7.0.6)
| # | Gravidade | Tipo | O que | Evidência |
|---|---|---|---|---|
| 1 | **CRÍTICO** | Performance | `INDICE_LISTA` + `posicaoNaLista()` no lugar do `findIndex`; índice cresce no fim, é conferido antes de responder e é refeito se a lista mudou de forma | 1ª carga 17.240 → **1.119 ms** |
| 2 | ALTO | Performance | `passeRapidoInicial()`: aplica as últimas 3.000 mudanças antes da leitura completa (1×/sessão, só com cursor 0) | estado de AGORA **1 ms** |
| 3 | ALTO | Performance | `persist()` = fila na hora + estado agrupado (300 ms) e só quando muda (rede de 30 s); `persistAgora()` nos pontos de decisão e ao fechar/esconder a janela | repouso 767 → 4 ms |
| 4 | ALTO | Performance | `scanLocal()` sob demanda (sujo/10 s) com `forcarVarredura` para pedido manual; `filaCheia` mantém a remessa correndo | idem |
| 5 | MÉDIO | Performance | `entriesFor()` não copia mais o registro inteiro (`clean`) só para conferir o hash; a limpeza foi para a montagem da remessa | idem |
| 6 | MÉDIO | Performance | `nuvemTemTudo()` com contagem fresca no máximo 1×/60 s | menos carga no Worker |

**Riscos avaliados antes de mudar** (regra "não quebrar o que funciona"):
- *Índice id → posição*: verificado no repo que **nenhum** ponto troca um registro
  no lugar com id diferente (`db.lista[i] = ...` com id novo não existe). Os casos
  que mexem na lista são `push` (79), `splice` (2), `unshift` (4) e troca da lista
  inteira (identidade). `splice`/troca/`unshift` são detectados pela conferência e
  pelo teste do "último registro no mesmo lugar"; o índice é refeito antes de
  responder. Teste novo cobre isso.
- *Passe rápido*: a trava de versão por registro (`change.version <= knownVersion`)
  garante que aplicar a mais nova primeiro **descarta** as antigas depois — não há
  como voltar versão. A leitura completa continua igual, do começo.
- *Gravação agrupada*: a fila (dado que ainda não subiu) continua sendo gravada
  imediatamente; o que é agrupado é o mapa de versões/hashes, que é **idempotente**
  (reaproveitar dele apenas faz o motor reaplicar/reconferir, e o Worker responde
  "já está igual" sem regravar). Rede de segurança de 30 s + gravação ao fechar.
- *Varredura sob demanda*: só é pulada quando a fila está vazia, nada foi gravado
  e nada foi apagado; o sistema avisa pelos 221 pontos de `saveDB`, pelo `saveDBAgora`
  e pelo vigia de exclusões; rede de segurança de 10 s.

### 20.3 Erro cometido e corrigido na mesma rodada
A 1ª versão do índice era **refeita a cada registro novo** (condição `c.len!==arr.length`),
o que na remontagem acontece em toda mudança → **144.020 ms** (8× pior que antes).
Encontrado pelo perfil de CPU (`posicaoNaLista` = 43,7% das amostras) e corrigido com
crescimento incremental. Registrado aqui porque **teste de regra não pega regressão
de performance**: só medição.

### 20.4 Testes e verificação
- Novo `test_nuvem_rapida.js` (**21 verificações**) — entra na lista do `test_runner.js`.
- Suíte: **209 passaram, 0 falharam, 4 não rodaram** (jsdom ausente no ambiente).
- `node build_bundle.js --check` OK (225 scripts, sha corpo `5f20ce56efb4f14b`);
  `sync_build.js --check` OK; `mobile/sync-www.js` OK; `?v=7.0.6-2e1f2b0f95ff`.
- **Não rodado:** testes de `e2e/` (Playwright não instalado) e os 4 que exigem `jsdom`.
- **Não foi possível verificar diretamente — acesso ao banco de produção indisponível:**
  quantas mudanças o diário da nuvem realmente tem hoje, o tamanho real de cada
  entidade e o tempo real de rede. A correção não depende disso (o defeito é do PC),
  mas o número exato do ganho no ambiente dele só ele pode confirmar no rodapé/painel.

### 20.5 Resposta dada ao dono (resumo)
"Volta" porque **em cada abertura o PC relê o diário inteiro da nuvem, em ordem** —
e a releitura era quadrática, então o que ele fez por último chegava por último.
Consertado em 6 pontos; medido antes/depois; ele só precisa atualizar o programa nos
PCs (site recarrega, `.exe` republicar) e conferir o rodapé **v7.0.6**. Nada mudou na
nuvem (motor 5.26.6 segue valendo) e nada de senha.


## 21. RODADA 12 — "APAGUEI E VOLTOU": A EXCLUSÃO QUE NUNCA CHEGAVA NA NUVEM (23/09/2026)

**Pedido do dono:** *"procure por mais problemas, se achar, verifique se aquilo
realmente é um problema, já que fica achando parecelado os problemas"*. Método
aplicado nesta rodada: **provar antes de afirmar** — prova executável com o motor
real para cada suspeita confirmada, e veredito com evidência para as descartadas.

### 21.1 Achado CRÍTICO confirmado — exclusão local nunca propagada (regressão de dado)
**Prova:** `test_exclusao_nao_volta.js` (permanente, roda na suíte), carregando
`cloudflare_data_sync_patch.js` por
`new Function` com `window`/`localStorage`/`document`/`db` e uma nuvem em memória
(diário + `/v1/changes` GET/POST). Usa o **mesmo caminho do sistema**: a função de
apagar é embrulhada pelo vigia do motor.

**Antes:** apagar um contrato e fechar o programa (ou perder a internet) antes de a
exclusão subir ⇒ o contrato **reaparece** na abertura seguinte e a nuvem **nunca**
recebe a exclusão. Causa raiz em dois níveis:
1. `houveIntencaoDeExcluir()` é baseado em `intencaoAte` — **variável de memória** com
   janela de 60 s (`JANELA_INTENCAO`). Fechou a janela/programa, a evidência some.
2. O `scanLocal()` só roda **depois** de `pullAll()` dentro do mesmo `try` do `tick()`
   ⇒ sem nuvem (ou com o pull falhando) a varredura local nunca acontece.
   Sem intenção viva, o ramo "ninguém mandou apagar" faz `delete state.known[k]` e o
   registro segue vivo na nuvem — que o devolve no próximo diário.

**Levantamento sistemático (mesmo padrão em todo o repositório):** um script varreu
todos os `.js` procurando quem tira registro das listas sincronizadas
(`db.<lista> = ...filter(` / `.splice(`), resolveu a função que contém a linha e
comparou com `FUNCOES_QUE_EXCLUEM`. Achados **confirmados um por um**:
| Função | Onde | Situação |
|---|---|---|
| `removerRegistro` | `ajustes_v5243_cliente_abas_patch.js:266` (ficha do cliente) | não vigiada ⇒ exclusão não chegava |
| `excluirChamadoV52422` | `locacao_chamados_fix_patch.js:259` | não vigiada |
| `estornarVenda` | `patch_vendas_financeiro.js:42` | não vigiada |
| `estornarOrcamentosMarcados` | `ajustes_v52237_orcamentos_menu_patch.js:278` | não vigiada |
| `excluirLeiturasMarcadas` | `ajustes_v52210_historico_checkbox_nfe_patch.js:69` | existe, mas é **interna do módulo** (não está em `window`) ⇒ o vigia não pode embrulhá-la |
| `mergeDuplicateClients` | `cloudflare_data_sync_patch.js` (Unir clientes repetidos) | removia só localmente ⇒ os duplicados voltavam |

### 21.2 Correções (v7.0.7, todas no motor + 2 arquivos de módulo)
1. `state.excluidosDeProposito` — marca **durável** por registro: `{em, v}` capturada
   por `marcarIntencaoDeExcluir()` (retrato antes) + `fecharIntencaoDeExclusao()`
   (retrato depois), chamados pelo vigia; poda em 24 h (`MARCA_EXCLUSAO_VALE`) e
   teto de 2.000 chaves.
2. `podeMarcarExclusao(k)` — só entidades de `PODE_EXCLUIR`, nunca `orcamentos`.
3. `scanLocal()`: `mandadoApagar(k) = houveIntencaoDeExcluir() || temMarcaDeExclusao(k)`;
   o ramo "ninguém mandou apagar" continua **intacto** (regra "nenhum computador apaga
   dado sozinho").
4. Passe de retorno: registro marcado que **voltou** da nuvem é removido de novo
   (`arr.splice`) e entra na fila; se `state.versions[k] > marca.v`, a edição de outro
   PC vence e a marca é descartada.
5. `pushOutbox()`: confirmação limpa a marca; recusa/erro também (sem laço de repetição).
6. `exclusaoVigiada(fn)` (ferramenta pública) + uso no botão do histórico de leituras;
   `registrarExclusaoDeProposito(entity,id)` para módulos que apagam dentro de laço.
7. `mergeDuplicateClients()`: marca os duplicados unidos (o comentário no código
   explica o "voltavam").
8. Liderança: `LEASE_MS=30000` (era 90 s fixo) + `devolverLideranca()` no `pagehide` —
   depois de F5/reabrir, o envio não fica esperando.

### 21.3 Achado MÉDIO confirmado — recuperação repetida por PC
`recuperarAutomatico()` usava só `state.recuperacaoV1` (**por PC**). Um PC novo, ou com
o localStorage limpo, refazia a recuperação e ressuscitava **todas** as exclusões da
história. Correção: carimbo `config.recuperacaoExcluidosEm` na nuvem (gravado só quando
`varreduraCompleta && !falhas`) e verificação na entrada; o botão manual do painel
permanece como recurso para o futuro.

### 21.4 Achado BAIXO — código morto
`ajustes_v52245_rodape_versao_patch.js`: `var btnErro = left.querySelector('button')` +
`left.appendChild(btnErro)` — o botão `erro.txt` **não existe em nenhuma tela**
(conferido no `index.html` e em todos os `.js`/`.html`; o comentário do v52239 fala do
botão, mas o código que o criava não existe mais). As duas linhas foram removidas com
comentário no lugar. **Item de auditoria antigo encerrado como "não era problema".**

### 21.5 Verificações que NÃO confirmaram problema (com evidência)
`renderContratos` (troca a lista só no desenho e restaura no `finally`);
`salvarImpressoraContrato` (cria e remove o duplicado no mesmo bloco síncrono);
`state.limpar` (só entidades de `NAO_SINCRONIZA`); `aplicarAutomacoesLeituras` (o ramo
que apaga conta a receber depende de `l.estornar==='S'`, e **nenhum ponto do sistema
liga essa flag**); `removeTecnico` (código morto — sem chamador em nenhum `.js`/`.html`);
`excluirTodos` (apaga backups da nuvem, não dados); `PUSH_BATCH=10`/`MAX_OUTBOX=100`
(freio de cota, por desenho); `soltarCopiaLocal` (em SÓ NUVEM não há o que apagar).

### 21.6 Possível problema (não confirmado — fora do escopo desta correção)
- `config` é entidade `'root'`: `applyRemote` substitui o objeto inteiro. Dois PCs
  mudando **campos diferentes** da configuração simultaneamente ⇒ última escrita vence.
  Confirmado no código; mudar exige decisão de produto e teste com dois PCs.
- Financeiro das leituras: se a flag de estorno voltar a ser usada, a recriação usa
  `uid('cr')` (id novo) e a conta antiga permanece na nuvem (duplicada).

### 21.7 Testes e verificação
- Novo `test_exclusao_nao_volta.js` (**31 verificações**): 3 cenários com o motor real
  (fechar na hora / cair a internet / caminho normal) + auditoria do repositório
  inteiro contra buracos na lista de exclusões. Entra no `test_runner.js`.
- Realinhados `test_ajustes_v52271.js` e `test_ajustes_v52275.js` (checavam a forma
  textual antiga do ramo; a **semântica** da regra "sem ordem não apaga nada" foi
  preservada e agora é checada explicitamente).
- Suíte: **210 passaram, 0 falharam, 4 não rodaram** (jsdom). Bundle 225 scripts,
  corpo `598b1d8283245b13`, `?v=7.0.7-2f04aed0f1ef`; `sync_build --check` e
  `mobile/sync-www.js` OK.
- **Não rodado:** `e2e/` (Playwright ausente) e os 4 de `jsdom`.
- **Não foi possível verificar diretamente — acesso ao banco de produção indisponível:**
  quantos registros excluídos existem hoje e quantos "voltaram" na prática; a prova
  usa nuvem de mentira com o motor real.


## 22. RODADA 13 — O PAGINADOR QUE PULAVA REGISTRO NA LISTA DE EXCLUÍDOS (23/09/2026)

**Pedido:** *"procure por mais problemas, se achar, verifique se aquil realmente é um
problema"*. Nesta rodada a verificação começou pelas mudanças da rodada anterior —
e uma delas estava errada.

### 22.1 Regressão da v7.0.7 (medida e corrigida) — custo do clique
`marcarIntencaoDeExcluir()` chamava `localKeysSnapshot()`, que monta `Set("entidade|id")`
de **toda a base** e é chamado **antes** de cada função de exclusão e por **todo**
`confirmSistema`/`confirm`. Medição com 76.550 registros: **marca 83 ms + fechamento
167 ms = 250 ms por clique**. Correção (`resumoDaBase()`): retrato **numérico**
(`{n, soma dos ids}` por lista), diferença para descobrir **quais listas mudaram**
durante o clique e, só para essas, varredura de `state.known` (`for..in`, sem alocar)
marcando os ids que desapareceram. Precisão preservada — só o que existe na nuvem pode
voltar, e é exatamente o que `state.known` guarda — e os 33 testes de exclusão seguem
verdes. Medição depois: **35 ms**.

### 22.2 CRÍTICO (motor) — `/v1/deleted` pulava registros por empate de `deleted_at`
**Causa:** `WHERE deleted_at IS NOT NULL AND deleted_at < ? ORDER BY deleted_at DESC
LIMIT ?`. `deleted_at` **não é único**: `handlePush` grava `const now = Date.now()` por
mutação, e o PC envia de 10 em 10 — o lote inteiro cai no mesmo milissegundo, e lotes
consecutivos também podem compartilhar o ms. Quando o limite da página corta um grupo
empatado, o resto do grupo passa a ser inalcançável (`deleted_at < X` exclui todos os
empatados em X, inclusive os que nunca foram devolvidos).
**Prova** (`test_recuperacao_completa.js`, réplica da consulta em memória):
3.000 exclusões em grupos de 1..10 ⇒ **2.944 alcançadas** (página 1000) e **2.599**
(página 200); cursor composto ⇒ **3.000**.
**Correção:** cursor composto `(deleted_at, entity, record_id)` com
`ORDER BY deleted_at DESC, entity DESC, record_id DESC` (coerente com a PK
`(entity, record_id)` da tabela), resposta com `proximoEntity`/`proximoId`, e o ramo
antigo (`before` sozinho) **preservado** para PC desatualizado. PC
(`listarExcluidosDaNuvem`): envia o par quando existe, `Set` do que já viu (sem
repetição), laço de 20 → 40 voltas.
**Interação verificada:** `varreduraCompleta` (que libera o carimbo
`config.recuperacaoExcluidosEm` na nuvem) **não pode** aceitar o motor que pula. Como o
5.26.6 já devolvia `temMais`, o critério passou a ser o **par do cursor**; e o aviso ao
dono usa `MOTOR_MINIMO='5.26.7'` (reaparece quando a exigência muda, em vez de ficar
mudo por já ter avisado antes).
**Dependência:** exige publicar o motor **5.26.7** (`atualizar_motor_nuvem.cmd`).

### 22.3 MÉDIO — memória de recuperação por id (colisão entre entidades)
`marcarRecuperado(recordId)` guardava a chave só pelo id; `jaVieram[String(r.recordId)]`
consultava igual. Contrato `7` e impressora de parque `7` se confundiam e a segunda
nunca era recuperada (prova no teste). Correção: chave `entidade|recordId` na escrita,
leitura aceitando as duas formas (compatibilidade com o que já está gravado), nos dois
usos (varredura da nuvem e fotos locais do IndexedDB).

### 22.4 Verificações que NÃO confirmaram problema
| Suspeita | Evidência |
|---|---|
| Faxina de demonstração apaga técnico real | `ehTecnicoDemo` (app.js) compara **id + nome + especialidade** com a lista fixa do demo; `varrerDemonstracao` roda uma vez (`state.faxina`) |
| `devolverSumidos` ressuscita dado apagado de propósito | roda **uma vez por PC** (`state.devolucao===DEVOLUCAO`), usa só a foto `antes_espelhar_nuvem` (era do espelho) e filtra demo — é a função de devolver o que o espelho levou, por desenho |
| `/v1/changes` pula registro | `changes.seq` é `INTEGER PRIMARY KEY AUTOINCREMENT` (único) — sem empate |
| `excluirTodos` | `DELETE /v1/backups` — apaga **backups**, não registros do sistema |
| `wrangler.toml` ausente | a configuração é `cloudflare-worker/wrangler.jsonc` (verificado em rodadas anteriores) |

### 22.5 Possível problema (não confirmado; sem mudança)
- `devolverSumidos` só devolve na primeira vez em cada PC; se um PC nunca rodou a
  devolução e tiver uma foto antiga, registros apagados de propósito **depois** da foto
  poderiam voltar. Para confirmar seria preciso inspecionar as fotos do IndexedDB nos
  PCs dele (não tenho acesso). Não alterei: é caminho de recuperação de dado e a função
  é, por desenho, de recuperar.

### 22.6 Testes e verificação
- Novo `test_recuperacao_completa.js` (**17 verificações**) no `test_runner.js`.
- Realinhados `test_recuperar_excluidos.js` (cursor composto, memória por entidade,
  carimbo 5.26.7), `test_ajustes_v52271.js`, `test_ajustes_v52275.js`,
  `test_ajustes_v5266.js` (a versão do **painel do gerente** é outra e ficou 5.26.6 —
  o `PAINEL_GERENTE v…` não é o motor da nuvem).
- Suíte: **211 passaram, 0 falharam, 4 não rodaram** (jsdom). Carimbo 5.26.7 propagado
  para 39 ocorrências em testes + 3 HTMLs de documento.
- Bundle 225 scripts (`58b583891c10d31c`), `?v=7.0.8-4bce5f155784`; `sync_build --check`
  e `mobile/sync-www.js` OK.
- **Não rodado:** `e2e/` (Playwright ausente) e os 4 de `jsdom`.
- **Não foi possível verificar diretamente — acesso ao banco de produção indisponível:**
  a distribuição real de `deleted_at` na tabela `records` e quantos registros ficaram de
  fora das varreduras anteriores.


## 23. RODADA 14 — ORÇAMENTO E MÓDULO VOLTANDO; UM DEFEITO MEU ACHADO PELO TESTE (23/09/2026)

**Pedido:** *"eu vou continuar falando a mesma coisa ate não achar nenhum problema.
procure por mais problemas, se achar, verifique se aquil realmente é um problema"*.

### 23.1 CRÍTICO — exclusão de orçamento nunca enviada (contradição ordem x código)
- `scanLocal()`: `if(!PODE_EXCLUIR.has(entity)||entity==='orcamentos')continue;` (v5.22.92).
- `podeMarcarExclusao()`: `PODE_EXCLUIR.has(ent)&&ent!=='orcamentos'`.
- Módulo `ajustes_v5243_cliente_abas_patch.js:266` (`removerRegistro('orcamento')`),
  comentário **v5.24.5** (ordem posterior): *"deletar é DE VEZ. Sai daqui, a nuvem recebe
  o comando de apagar e os outros PCs apagam também (sem marca-fantasma)"*.
**Prova:** cenário do orçamento em `test_exclusao_nao_volta.js` (motor real + nuvem em
memória, caminho do vigia): antes, o orçamento reaparecia na lista de trabalho e a nuvem
nunca recebia a exclusão. **Correção:** trava removida dos dois pontos; a proteção da
v5.22.92 (`applyRemote`: delete de orçamento vindo da nuvem ⇒ `status='excluido'`, sem
remover) foi **preservada** e continua travada por `test_ajustes_v52292.js` (realinhado
para exigir a parte que importa e documentar a saída da trava antiga).

### 23.2 CRÍTICO — "Excluir módulo" (tabela dinâmica) voltava com todos os registros
`confirmarExcluirModulo` (app.js, ação de tela) faz `delete db.modulosDinamicos[nome]`.
`modulosDinamicos` viaja como **mapa** (`DEFINITIONS`), não estava em `PODE_EXCLUIR` e o
passe "voltou da nuvem" (`state.excluidosDeProposito`) só tratava **array**
(`posicaoNaLista` retorna -1 para mapa). **Correção:** entidade adicionada a
`PODE_EXCLUIR`, função adicionada a `FUNCOES_QUE_EXCLUEM` e o passe passou a remover
também em mapa (com a mesma trava: se a versão da nuvem for mais nova que a da marca, a
edição vence).

### 23.3 DEFEITO DA v7.0.8 (meu) — `presentes` vazio para mapa
`fecharIntencaoDeExclusao()` (retrato numérico introduzido na rodada 13) montava o
conjunto de ids presentes apenas quando `Array.isArray(db[e])`; para entidade de **mapa**
o conjunto saía **vazio**, e a marca era aplicada a **todos** os registros daquele mapa
que o PC conhecia. Impacto: nenhum enquanto mapa não podia mandar exclusão (a marca só
seria usada depois); **grave** a partir da v7.0.9, quando `modulosDinamicos` passou a
poder. Descoberto pelo próprio teste novo ("módulo: o outro módulo continua inteiro" ✘,
com o módulo vizinho deletado). **Correção:** o conjunto cobre array e mapa (chaves
próprias do objeto), com comentário explicando o caso.

### 23.4 MÉDIO — poda da marca de exclusão podia perder a exclusão
`Object.keys(alvo).forEach(...)` podava por tempo (24 h) **sempre**, inclusive com fila
pendente ou erro de nuvem. **Correção:** poda só com o PC em dia (`!outbox.length &&
!lastError`), janela de **7 dias** e teto de 5.000 marcas (era 2.000).

### 23.5 MÉDIO — gravação recusada pelo navegador era silenciosa
`gravarEstado()` capturava a exceção e apenas anotava `lastError`. **Correção:**
descarta primeiro `state.versions` (derivado; remontado na leitura completa e zerado a
cada abertura no modo SÓ NUVEM), tenta gravar de novo, e avisa o dono uma vez
(`notificarEvento`) — o painel de Diagnóstico mostra o motivo pelo `lastError`. A fila
(`OUTBOX_KEY`) e as marcas de exclusão não são descartadas.

### 23.6 BAIXO — escape no painel de Diagnóstico
`linha.innerHTML` recebia `d.motivo` (`pauseReason`) e `d.erro` (`lastError`) sem escape
— texto que vem do servidor/rede. Criado `escDiag()` e aplicado nos três pontos
(inclusive a mensagem de erro do botão "Conferir agora"). Travado em
`test_ajustes_v52296.js`.

### 23.7 Verificado e NÃO é problema
| Suspeita | Evidência |
|---|---|
| `/v1/restore` não avisa os outros PCs | usa `applyMutation()` ⇒ grava `changes` (com `mutationId` idempotente) |
| Entidades que viajam e não aceitam exclusão | apenas `config` ('root') e `_seq` ('contador') — sem semântica de exclusão |
| Formas alternativas de apagar (`pop`, `shift`, `delete db.X[k]`, `length=0`) | varredura no repositório: só `delete db.modulosDinamicos[...]`, tratado em 23.2 |
| `recargasEtiquetas` sem exclusão na nuvem | lista **derivada** das vendas (o módulo a refaz no estorno da notinha) |
| `escola*`, `clientesDuplicadosSugeridos`, `itensRecebimentoMigrados` | listas **remontadas** por importação/sugestão — exclusão local não deve propagar |

### 23.8 Possível problema (não confirmado)
Estado da sincronização proporcional à base: **~6,5 MB para 76.550 registros** (banco de
prova). Acima do que o navegador costuma aceitar (≈5 MB por origem). Com a correção
23.5 o caso deixa de ser silencioso, mas o **tamanho real da base dele** não pode ser
verificado daqui — **Não foi possível verificar diretamente — acesso ao banco de
produção indisponível** (o painel da Nuvem mostra a contagem de registros).

### 23.9 Testes e verificação
- `test_exclusao_nao_volta.js`: **51 verificações** (3 cenários de contrato + orçamento +
  módulo + auditoria do repositório + os consertos desta rodada).
- `test_recuperacao_completa.js`: 17 · `test_nuvem_rapida.js`: 21 ·
  `test_ajustes_v52292.js` realinhado (trava antiga documentada) ·
  `test_ajustes_v52296.js` + escape.
- Suíte: **211 passaram, 0 falharam, 4 não rodaram** (jsdom ausente).
- Bundle 225 scripts (`1ed26ac13f913ee1`), `?v=7.0.9-326f1f40e4a6`;
  `sync_build --check` OK; `mobile/sync-www.js` OK.
- **Não rodado:** `e2e/` (Playwright ausente) e os 4 de `jsdom`.


## 24. RODADA 15 — A RECUPERAÇÃO AUTOMÁTICA CONTRA O DONO; AVISO PERDIDO; TETO DE PÁGINAS (23/09/2026)

**Pedido:** *"procure por mais problemas, se achar, verifique se aquil realmente é um problema"*.
Método mantido: todo achado abaixo foi reproduzido com o motor real + nuvem em memória.

### 24.1 CRÍTICO — recuperação automática ressuscitava o que foi apagado de propósito
- Filtro dos alvos (`recuperarAutomatico`): `excluidos.filter(... !jaRecuperado(...) && temDonoHumano(r) && [entidades] && r.data ...)`
  — **não** consultava `state.excluidosDeProposito` (a marca da v7.0.7).
- Efeito: exclusão deliberada feita pela tela podia ser desfeita pela recuperação
  (que roda a cada 60 s enquanto a passada não termina) → "apaguei e voltou".
- **Correção:** `ehExclusaoDele(k,versaoNaNuvem)` — se a versão da nuvem for **maior** que
  a da marca, a edição nova vence e a recuperação pode trazer (mesma regra do passe
  "voltou da nuvem"); senão, o registro é pulado.
- **Mesmo padrão corrigido em `recuperarDasFotosLocais()`** (fotos internas do PC): o
  filtro também não olhava a marca, e essa função restaura todo registro da foto que
  não está na base atual — superfície ainda maior.

### 24.2 ALTO — aviso do motor descartado quando não havia sessão (marca gravada assim mesmo)
- `notificacoes_patch.js:54`: `const sess=getSession(); if(!sess) return;` — o sino é por
  empresa. O motor, porém, começa no `load` (`if(authorized()){... setTimeout(recuperarAutomatico,4000)}`)
  e roda antes de qualquer login.
- `state.avisoMotorAntigo=MOTOR_MINIMO;persist();` era gravado **antes** de tentar o aviso,
  que era descartado → aviso perdido para sempre.
- **Correção:** `notificarEvento` devolve `true`/`false`; o motor tem fila de recados
  (`state.recadosPendentes` / `state.recadosEntregues`) entregue a cada `tick()`; os três
  avisos (motor antigo, sem espaço, precisa-admin) e o relatório da recuperação passaram
  a usar a fila; entregar marca o estado (persist) para não repetir depois de recarregar.

### 24.3 ALTO — teto de 40 páginas era tratado como fim da lista
- `for(let volta=0;volta<40;volta++)` + `if(r&&r.proximoEntity&&r.proximoId)varreduraCompleta=true`
  ⇒ ao estourar o teto, `varreduraCompleta` permanecia `true`, e o ramo `else` carimbava
  `db.config.recuperacaoExcluidosEm` (marca de "recuperação feita" na nuvem) + `recuperacaoV1`.
- **Correção:** nova flag `varreduraTerminou` (fim real da lista) separada de
  `varreduraCompleta` (motor sabe paginar); cursor de continuação em
  `state.recuperacaoCursor` (só na chamada automática — o painel e os testes pedem a lista
  do começo, como sempre); o ramo novo só persiste e deixa o próximo ciclo continuar.
  Cursor é limpo ao terminar e quando outro PC já carimbou a recuperação.

### 24.4 MÉDIO — `notificarEvento` podia lançar depois de já ter guardado o aviso
`saveDB()` e `ntfAtualizarBadge(true)` eram chamados sem proteção; erro aí subia para o
chamador (que concluiria "não registrou"). Agora ambos são opcionais e a função devolve
`true` (guardado) — o que também torna o novo mecanismo de fila confiável.

### 24.5 Verificado e NÃO é problema
| Suspeita | Evidência |
|---|---|
| Botão manual "🩹 Trazer de volta o que foi excluído" | usa `window.DIGICOPY_RECUPERAR` (plano + confirmação) e `/v1/restore` por item — não passa pelo filtro automático; ação explícita do dono |
| Exclusões da rodada 14 (orçamento, módulo) | `test_exclusao_nao_volta.js` 57 ✔ (antes 51) |
| Desempenho do clique de apagar | banco de prova 76.550 registros: 44 ms total (22+22) |

### 24.6 Possível problema (não confirmado)
Se a nuvem dele tiver **mais de 40.000 excluídos**, a varredura agora precisa de mais de
um ciclo (60 s cada) — comportamento novo e correto, mas só o painel informa ("varrendo a
nuvem agora"). **Não foi possível verificar diretamente — acesso ao banco de produção
indisponível.**

### 24.7 Testes e verificação
- `test_recuperacao_nao_ressuscita.js` (**novo**, 20 verificações): marca na varredura,
  marca na foto, aviso sem sessão→entregue depois, teto de páginas com cursor sobrevivendo
  ao recarregamento (46 páginas, nenhuma repetida).
- Suíte **212/0/4/0** (4 pulam sem `jsdom`); bundle `4b139844c79b1c6b`;
  `?v=7.0.10-c1d6e30ace7a`; `sync_build --check` OK; `mobile/sync-www.js` OK.

## 25. RODADA 16 — O CAMINHO PÚBLICO DO ORÇAMENTO (motor da nuvem 5.26.8) (24/09/2026)

**Pedido:** *"procure por mais problemas, se achar, verifique se aquil realmente é um problema"*.
**Método (novo, mais forte):** o motor da nuvem é importado como módulo e chamado com
`fetch(Request, env, ctx)` real, sobre **SQLite em memória** com as **migrations reais** do
projeto; o D1 é um adaptador de mentira com a mesma API (`prepare/bind/first/all/run/batch/exec`)
e as chaves estrangeiras ligadas (como o próprio projeto liga na 0001). O D1 é SQLite — então o
banco de prova tem as mesmas regras (inclusive `OR REPLACE`). Teste permanente:
`test_worker_publico.js`; script temporário de revogação: `_tmp_prova_revogacao.js` (apagado).

### 25.1 ALTO (Segurança) — criação "sem cadastro" sem teto por dia
- Local: `handleOrcamentoPost`, ramo `else` de `findOrcamentoByToken` (quando o token não existe na nuvem).
- Causa: caminho público por desenho (o cliente responde antes de o orçamento chegar na nuvem) e **sem
  limite**: monta venda/orçamento a partir de `parsePayloadD(body.d)`.
- Efeito: link forjado → vendas/avisos ilimitados na base do dono + cota do dia queimada.
- Correção: `CAP_PUBLICO_SEM_CADASTRO_DIA = 40` + `contarSemCadastro()` (`system_meta`,
  chave `orc_pub_sem_cadastro_<dia>`), `429 PUBLIC_FALLBACK_LIMIT` **antes de qualquer gravação**;
  marca `semCadastroNoSistema:true` na venda e no orçamento.
- Evidência: `test_worker_publico.js` cenário 5; contra o motor antigo, o teste reprova.

### 25.2 ALTO — freio preventivo e medidor não cobriam a rota pública
- Local: freio em `handlePush` (`LIMITE_ESCRITA_DIA = 95000`, v5.24.5) e `somarUso` só ali.
- Causa: a rota pública foi escrita antes do freio existir e nunca foi revisitada.
- Efeito: o **único** caminho anônimo do sistema era o único sem freio e sem contagem — o
  invariante "nunca deixar estourar" tinha um furo público.
- Correção: `freioDeCota(env, estimativa)` extraída e usada pelos dois caminhos (texto
  `daily row write limit próximo` preservado — o app reconhece por ele); `somarUso(env,
  acao==='aprovar' ? 3 : 1, 0, ctx)` no público; `ensurePublicDevice` + freio **depois** da
  validação; `handleOrcamentoPost(request, env, ctx)` e a rota passam o `ctx`.
- Evidência: cenário 4 — medidor do dia = 3 após autorizar; com `uso_diario = 95000`, 429 e
  nenhuma venda criada.

### 25.3 MÉDIO (Integridade) — `INSERT OR REPLACE` no aparelho público
- Local: `ensurePublicDevice` (ex-:1271).
- Causa: no SQLite, `OR REPLACE` = **apagar + criar**; a linha do aparelho era recriada a cada
  acesso do cliente.
- Efeito: `revoked_at` e `excluido_em` voltavam a **NULL** (revogação/exclusão feitas no painel
  não seguravam) e `created_at` virava "agora" (lista de aparelhos mentia).
- Secundário (mecanismo provado, hoje inalcançável em produção): o conflito pode ser de **outro**
  índice — `token_hash` é `UNIQUE` — e o `OR REPLACE` apagaria a linha de **outro** aparelho (o
  banco recusou por chave estrangeira no próprio teste).
- Correção: `INSERT INTO devices (...) ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at`.
- Evidência (antes × depois): `_tmp_prova_revogacao.js` — motor antigo: 555/666 → **NULL**;
  motor novo: 555/666 preservados e `created_at` intacto.

### 25.4 ALTO (Performance) — busca do token com varredura completa
- Local: `findOrcamentoByToken` (ex-:1279).
- Causa: `.all()` de todas as linhas `entity='orcamentos'` + `JSON.parse` por linha, a cada
  acesso público (abrir o link e responder).
- Efeito: cresce com o nº de orçamentos (rows read + CPU do Worker). Compromete o teto de CPU
  do motor — quem falha primeiro é o link do cliente.
- Correção: `record_id = ?` (índice primário) → `data_json LIKE ? ESCAPE '\'` com curingas
  `\ % _` escapados e **valor conferido no motor** (falso positivo cai no fallback) → laço
  antigo só como última tentativa.
- Evidência: cenário 3 — com 300 orçamentos, nenhuma consulta de lista completa; link antigo
  por id ainda abre.
- Melhoria futura (não pendência, exige migração + backfill): coluna `token` indexada.

### 25.5 BAIXO — pedido recusado (400) gravava a linha do aparelho
- Mesma lição da rodada 2 (`handlePush`): validar antes de gravar. Correção de ordem.
- Evidência: cenário 1 — "pedido recusado não grava NADA".

### 25.6 MÉDIO — unidade do contador × unidade do freio
- Local: `somarUso(env, Math.max(1, mutations.length), 0, ctx)` (lotes) contra
  `freioDeCota(env, mutations.length * 2)` (linhas: registro + evento).
- Causa: um lado mudou sem o outro.
- Efeito: no plano grátis (100 mil linhas/dia), o freio só ia disparar em ~190 mil linhas — depois
  do corte.
- Correção: `Math.max(1, mutations.length) * 2` (unidade = linhas, igual ao medidor oficial
  `rowsWritten` da Cloudflare) e checagem nova no `test_sync_quota_guard.js`.
- Nota: no plano pago (50 M/mês) não há efeito prático hoje; é blindagem para o recuo ao grátis
  documentado em `usoHoje()`.

### 25.7 Verificado e NÃO é problema (com evidência)
| Suspeita | Verificação | Veredito |
|---|---|---|
| Cliente fica na mão quando a nuvem pausa/recusa | a página do link abre o WhatsApp **sem olhar o status** da resposta | por desenho |
| Token do orçamento | `tokenNovo()` = 18 bytes `crypto.getRandomValues` (rodada 14) | forte |
| Responder o mesmo orçamento 2× | "Orçamento já processado." sem criar outra venda | ok |
| `applyMutation` / `handleDeleted` / `handleRestore` | inalterados nesta rodada; validações e cursores conferidos | ok |
| Painel do gerente / outros carimbos | versão própria (5.26.3) intacta; só o motor virou 5.26.8 | ok |

### 25.8 Testes, carimbos e o que não rodou
- Novo: `test_worker_publico.js` (32 ✔) incluído no `test_runner.js`; **antes × depois**:
  contra o motor antigo o teste **reprova**.
- Suíte: **213 ✔ / 0 ✘ / 4 não rodaram** (falta `jsdom`). `test_sync_quota_guard.js` +1 checagem.
- Carimbos re-ancorados: 17 arquivos `test_ajustes_v5xxx/v6xxx` + `test_recuperacao_completa`,
  `test_recuperar_excluidos`, `test_relatorio_teste_nf` e 3 HTMLs de doc → **5.26.8**.
  `cloudflare-worker/motor_para_colar.js` regerado (127.699 bytes) + `.sha256`;
  `package-lock.json` sincronizado (0.4.8 → 0.4.9).
- **Nada mudou no app** (v7.0.10): `MOTOR_MINIMO` segue 5.26.7; nenhum PC precisa atualizar.
- Não rodado: `e2e/` (Playwright ausente) e os 4 de `jsdom`.
- **Não foi possível verificar diretamente — acesso ao banco de produção indisponível:**
  quantos orçamentos existem hoje na base (peso real da varredura antiga) e se algum acesso de
  cliente já falhou por causa dela.

## 26. REDESENHO — FASE 1: O CORAÇÃO NOVO (novo/nucleo.js) E AS PRIMEIRAS TELAS (24/09/2026)

**Pedido:** *"cada funçãozinha que tinha o sistema é útil, eu vou querer"* + *"fiz o backup,
não só manual, fiz o backup todo"*. Registrado: **paridade total** (nenhuma função fica de
fora — `REDESENHO_BLUEPRINT.md` item 4 virou inventário de paridade com 15 blocos) e **fase 0
concluída** (backup na mão dele; recomendado guardar cópia fora do PC e não apagar a base
antes da virada).

### 26.1 Decisão de arquitetura — o coração com 5 regras (e por que)

A causa-raiz das rodadas 12-16 era sempre a mesma: a regra morava em vários lugares (a
exclusão em **82 pontos**) ou em nenhum (cada tela fazia do seu jeito). O núcleo novo
(`novo/nucleo.js`, v1.0.0) escreve cada regra **uma vez**:

| Regra | Onde mora | O que substitui |
|---|---|---|
| apagar é marcar (lápide com quem/quando/motivo) | `apagar()` | 82 pontos de `filter`/`splice` espalhados |
| conflito decidido em um lugar (versão → lápide → data → origem) | `decisao()` | regras duplicadas em `cloudflare_data_sync_patch.js` |
| nada volta sozinho (editar apagado é recusado) | `salvar()` | a "recuperação" que ressuscitava (rodada 15) |
| toda gravação vira 1 mudança na fila, na ordem | `salvar`/`apagar`/`restaurar` → `mudancas()` | outbox + remendos de envio |
| achar registro é pelo índice | `itemPorId()` | varreduras (`findIndex`) que causavam a lentidão |

As telas (`novo/telas.js`) **não** mexem no dado: pedem ao núcleo. Modal é o do sistema
(nunca `alert`/`confirm`/`prompt`), exclusão pede confirmação **e motivo**, lixeira mostra o
que foi apagado e "♻️ Restaurar" traz de volta — nada automático.

### 26.2 Defeitos meus, achados pelos testes ANTES de publicar (registro honesto)

| # | Defeito | Gravidade | Onde | Correção |
|---|---|---|---|---|
| 1 | O índice guarda **posição**, e a posição **0** era tratada como "não achei" (`obter`, `apagar`, `restaurar`, `salvar` do 1º registro) | ALTO | `novo/nucleo.js` | um único `itemPorId()` comparando com `undefined` |
| 2 | `somenteApagados` não devolvia os apagados (a checagem anterior engolia) | MÉDIO | `listar()` | a lixeira passou a ser um caso explícito |
| 3 | A validação olhava só os campos que chegavam → editar um campo acusava "faltou o nome" | MÉDIO | `salvar()` | valida o **registro completo** (existente + novo) |

Os três apareceram no `test_nucleo.js`/`test_telas.js` **antes** de qualquer publicação —
que é exatamente o critério combinado ("provar antes de valer"/"não quebrar o que funciona").

### 26.3 Achado: teste desatualizado cobrando o contrário da decisão do dono

- **Onde:** `test_ajustes_v6104.js:769`.
- **Problema:** cobrava que o botão `erro.txt` **continuasse** no rodapé. O dono mandou
  remover o botão em 23/09/2026 e o `ajustes_v52245_rodape_versao_patch.js` já não o
  recria (o próprio código traz o comentário da remoção).
- **Por que ninguém viu:** o teste **vivia pulado** — neste ambiente o `jsdom` não estava
  instalado (o runner pula quem faz `require('jsdom')`).
- **Gravidade:** BAIXO (teste, não produto) · **Tipo:** Manutenção/Regressão de teste.
- **Correção:** alinhado à decisão atual — agora ele cobra que o botão **não volte** no
  repintar e que o rodapé **não cite** `erro.txt`.
- **Verificação:** `test_ajustes_v6104.js` passou a rodar (com jsdom) e passa.

### 26.4 Suíte e verificação desta fase

- Novos: `test_nucleo.js` (**51 ✔**) e `test_telas.js` (**38 ✔**) — os dois entraram no
  `test_runner.js`.
- **Com `jsdom`:** a suíte inteira roda — **219 passaram, 0 falharam, 0 não rodaram**
  (inclusive os 5 que viviam pulando). Sem `jsdom`: 214/0/5 (comportamento antigo).
- `build_bundle.js --check` OK (225 scripts, `4b139844c79b1c6b`); `sync_build.js --check` OK.
- **Nada do sistema publicado mudou:** app **v7.0.10**, motor da nuvem **5.26.8**. A pasta
  `novo/` está fora do bundle e do empacotamento do `.exe`.
- **Como ver a fase 1:** abrir `novo/index.html` (servido de um servidor estático apontando
  para a pasta `novo/`). O rascunho desta fase usa `localStorage` com chave própria
  (`digicopy_novo_rascunho_v1`) — a nuvem nova entra na fase 2.
- **Não foi possível verificar diretamente — acesso ao banco de produção indisponível:**
  quantas listas vivas existem hoje em `modulosDinamicos` (é o que fecha o inventário de
  paridade dos módulos dinâmicos, item ◻ do blueprint).

## 27. REDESENHO — FASE 1·B: A PONTE (TELAS DE HOJE × CORAÇÃO NOVO) E A PÁGINA COM A MESMA CARA (24/09/2026)

**Decisão dele:** *"recriar praticamente O MESMO sistema, só que com núcleo diferente... acostumamos
com o mesmo Index, as mesmas funções, tudo, mas aí você muda o que precisa mudar completamente"*.
Isso fixa a estratégia: **mesma casca (index, menu, telas, funções), coração trocado**.

### 27.1 Arquitetura — a ponte (`novo/ponte.js`)

- **Ponto de integração escolhido:** `saveDB()` — conferido em código que `db` é global (`app.js:265`,
  `window.db` em `:266`) e que `saveDB` é **o** ponto de gravação (`app.js:175`). A ponte envolve esse
  ponto; **nenhuma tela é alterada**, nenhuma lista muda de formato.
- **Semântica nova:** o que sai da lista vira **lápide** (quem/quando/por quê) no coração, em vez de
  "sumiço". É a causa-raiz dos defeitos das rodadas 12/15 tratada no lugar certo.
- **Regra de ouro:** a ponte **não decide** conflito — pergunta ao coração (`aplicarDaNuvem`), que tem
  a decisão **em um lugar só** (`decisao()`), determinística (versão → lápide → data → origem).
- **`salvar(nome, dados, {semFila:true})`** (novo no coração): importa base existente sem gerar mudança
  para a nuvem — necessário para a primeira varredura não nascer sujando a fila.

### 27.2 Travas (cada uma é uma classe de defeito já vista)

| Trava | Defeito que ela fecha | Onde |
|---|---|---|
| Modo observação | trocar o coração "às cegas" numa base real | `ligar({modo:'observacao'})` |
| Exclusão em massa pede confirmação (>20 ou >metade) | reset/importação/erro de tela apagando base em cascata (regra 27) | `aoPrecisarConfirmar` + `pendentesDeConfirmacao`/`confirmarExclusaoEmMassa`/`recusarExclusaoEmMassa` |
| Comparação por id (2× o mesmo ≠ 2 registros) | duplicação ao reimportar | `importar()` |
| Formato das listas intacto | quebrar 482 arquivos de tela | nenhuma mudança de formato em `db.*` |
| A ponte não reimplementa o coração | duas fontes de verdade (a doença atual) | `aplicarDaNuvem`/`restaurar` delegam |

### 27.3 Página do sistema novo com o menu real

`novo/index.html` foi refeito com os **mesmos rótulos de menu do sistema de hoje** (extraídos do
`index.html` real): Início · Cadastros · Atendimento · Locação · Fiscal · Financeiro · Buscador Escola ·
Configurações — **18 itens**. Migrados: Clientes e Produtos (funcionam pelo coração novo). Não migrados:
avisam **em que fase entram** (nada de botão morto, regra 17 do `REGRAS_PERMANENTES.md`).

### 27.4 Testes desta fase (todos no `test_runner.js`)

| Teste | Verificações | O que prova |
|---|---|---|
| `test_ponte.js` | **50 ✔** | importar base sem perder/inventar; criar/editar; **excluir = lápide**; reabrir não ressuscita; massa pede confirmação (confirmar e recusar); modo observação não muda nada; restaurar devolve à lista da tela; exclusão/edição de outro PC; listas continuam normais; ponte não reimplementa decisão |
| `test_nucleo.js` | 53 ✔ | (ganhou o caso `semFila`) |
| `test_telas.js` | 38 ✔ | telas novas sobre o coração (inclui o teste que derruba `alert`/`confirm`/`prompt`) |
| `test_redesenho_pagina.js` | **24 ✔** | menu do sistema presente, telas migradas funcionando (preço com vírgula), aviso de fase, barra de status |

**Suíte completa:** **221 passaram, 0 falharam, 0 não rodaram** (com `jsdom` instalado no ambiente).
Sem `jsdom`: 216/0/5.

### 27.5 Pendências registradas (não são dúvidas minhas; são decisões de formato)

1. **Ligar a ponte no `index.html` de produção** — próximo passo, começando em **modo observação**
   (relata sem gravar). É a única mudança no sistema atual e é reversível: a ponte **não** altera o `db`.
2. **`modulosDinamicos`**: a ponte cobre arrays do `db` com `id`. As listas criadas dentro do sistema
   (sub-listas de `modulosDinamicos`) exigem decisão de formato antes de entrar — e **não foi possível
   verificar diretamente como estão chaveadas na nuvem (acesso ao banco de produção indisponível)**.
3. **`novo/`** está fora do bundle e do empacotamento: app publicado segue **v7.0.10**; motor da nuvem
   **5.26.8**. *(Mudou na rodada 18-B: `novo/nucleo.js` e `novo/ponte.js` entraram no bundle para a
   conferência sob demanda — ver §28; a página `novo/index.html` + `novo/telas.js` segue só como teste)*.

## 28. RODADA 18-B — O NÚCLEO NOVO DENTRO DO SISTEMA DE HOJE (conferência sob demanda) (24/09/2026)

**Pedido:** *"bora continuar, e me fala se precisar que eu faça algo"* + *"recriar praticamente O MESMO
sistema, só que com núcleo diferente... o mesmo Index, as mesmas funções, tudo"*.

### 28.1 A medição que decidiu o caminho (antes de escrever a peça)

Pergunta: dá para o coração novo **acompanhar cada gravação** do sistema de hoje (o `saveDB()` das telas)?
Medido com `_tmp_bench_ponte.js` sobre a base de prova de **76.550 registros** (13 listas):

| Momento | Custo |
|---|---|
| Primeira varredura da base | ~270 ms (404 ms antes de trocar a assinatura por FNV-1a) |
| **Por gravação** (assinatura `JSON.stringify` por item) | **239 ms** |
| **Por gravação** (assinatura FNV-1a, ordem-independente) | **137 ms** |
| Piso teórico do que sobra (comparar conteúdo) | ~40 ms |

**Decisão (com número na mão): a ponte NÃO entra no `saveDB()` de produção.** 137 ms a cada gravação é
exatamente a lentidão que o dono reclamou ("INSTANTÂNEO SEM NENHUM ERRO"). Vira **conferência sob
demanda**: custo zero no uso normal, custo só quando o dono pede.

### 28.2 O que entrou: `ajustes_v7011_ponte_nucleo_patch.js` (v7.0.11)

- **Onde:** painel da Nuvem, um bloco logo abaixo do "Diagnóstico deste computador" que já existia
  (mesmo padrão de instalação dele: `setInterval` de 2,5 s + clique). Botão **"🔎 Conferir o núcleo novo"**.
- **O que faz:** monta o coração novo **em memória** (`DIGICOPY_NUCLEO.criar`, sem função de gravar) e a
  ponte em `modo:'observacao'`; na primeira conferência só **aprende** a base; nas seguintes **compara**
  com a anterior e mostra: novos, **editados** (assinatura do coração), **retirados** — com **lista,
  nome e código** de até 5 deles — e **"voltaram sozinhos"** (registro que saiu e reapareceu: é
  literalmente o "apaguei e voltou"). Retirada em massa é sinalizada com o aviso de que o núcleo novo
  **seguraria e pediria confirmação**.
- **O que NÃO faz:** não grava nada (nem no `db`, nem na nuvem, nem em `localStorage`), não fala com a
  nuvem (nenhum `fetch`), não envolve o `saveDB`, não usa `alert`/`confirm`/`prompt` nativos, não mexe em
  nenhum botão/tela existente. É leitura pura — o sistema de hoje continua idêntico.
- **Custo medido na peça real:** 1ª conferência **243 ms**; as seguintes **131-160 ms** numa base de
  76.550 registros (uma cópia de ids+rótulos por clique).
- **Limite honesto:** o aprendizado vive na memória da página. Fechar/reabrir o sistema = a próxima
  conferência aprende de novo (não persiste nada — a regra 44 é "nada salvo no PC/navegador"). Se o
  dono quiser janelas maiores que uma sessão, isso pede gravação em algum lugar, e aí é decisão dele.

### 28.3 Provas (`test_ponte_no_sistema.js`, **39 ✔**, no `test_runner.js`)

Roda o arquivo de verdade em `jsdom`, com `db` de 76.550 registros, e cobra: o bloco entra no painel
**depois** do Diagnóstico e não duplica; a 1ª conferência só aprende (0/0/0) e acha 13 listas/76.550
registros; mexer na lista **não** dispara nada e nada é gravado; a 2ª conferência conta 3 novos, 1
editado e 3 retirados **mostrando quem saiu**; retirada de 100 em `os` é sinalizada como massa; um
retirado que volta é contado como "voltou sozinho" (e não como novo); o clique roda a conferência,
escreve o resultado, devolve o botão ao normal e continua sem gravar nada.

**Dois defeitos meus, pegos pelo teste antes de publicar:** (a) eu chamava a varredura de aprendizado a
**cada** clique, e isso **engolia a comparação** (tudo aparecia como 0); (b) o rótulo de quem saiu vinha
da cópia sem nomes — corrigido para uma cópia única **com** nome (limite de 200.000 registros: acima
disso só códigos, dito no próprio painel).

### 28.4 Ajuste de manutenção que a entrada no bundle exigiu (MÉDIO, Manutenção)

`novo/nucleo.js`, `novo/ponte.js` e o patch novo entraram no `bundle-manifest.json` (**225 → 228**),
**no fim da fila** (convenção do projeto), e 33 testes antigos que travavam **o tamanho** da fila
quebraram. Correção mínima e intencional: `manifest.length === 225` → `>= 225` (27 ocorrências — segue
pegando arquivo perdido, deixa de quebrar a cada peça nova); as cadeias de cauda
(`manifest[manifest.length - N]`, 7 arquivos) subiram para `N + 3`, mantendo a mesma ordem conferida; e o
E2E `test_ajustes_v6103.js` deixou de fixar 225 e passou a **ler o tamanho do manifesto** (não quebra
mais a cada patch novo).

### 28.5 Estado após esta rodada

- **Suíte: 222 passaram, 0 falharam, 0 não rodaram** (com `jsdom`). Sem `jsdom`: 215/0/7.
- App **v7.0.11** (rodapé e 4 HTMLs de doc carimbados), bundle **228 scripts**, sha256
  `3a341ce6d072e7de`, `?v=7.0.11-cd1b595e0a7b`; `build_bundle.js --check` OK; `sync_build.js --check`
  OK; `mobile/sync-www.js` OK (cópia do celular igual). Motor da nuvem segue **5.26.8** (publicação é
  ato do dono).
- `novo/index.html` + `novo/telas.js` seguem **fora** do bundle (página de teste da fase 1); o que entrou
  foram só o coração e a ponte, para a conferência.

## 29. RODADA 18-C — A CAIXA DE SELEÇÃO INTELIGENTE (e a decisão do caminho) (24/09/2026)

**Pedido do dono:** *"eu quero cada função que tinha antes, a caixa de seleção inteligente de
escolher cliente, produto... TUDO"* + *"eu só quero seguir o caminho que mais compensa seguir pra
resolver tudo... vou deixar nas suas mãos de TUDO, você escolhe, mas escolha o melhor caminho para dar
o menor problema possível"*.

### 29.1 A DECISÃO: continuar o redesenho (caminho **C**), com paridade obrigatória

Ele delegou a escolha. Decidido: **continuar o caminho C** (sistema novo por partes, o de hoje no ar
até a virada única), com uma regra dura acrescentada: **nenhuma função fica para trás — e isso é
provado, não prometido**.

Justificativa escrita (exigência da regra de mudança arquitetural):

| | O que é | Por que **sim** | Por que **não** |
|---|---|---|---|
| A | reescrever tudo e trocar num dia | fica tudo novo de uma vez | a loja para até terminar; fiscal refeito na pressa; risco concentrado. **Recusado** |
| B | manter as telas atuais, trocar só o miolo | risco baixo | não encolhe nada: cada tela velha continua com as regras próprias — a prova está nesta própria rodada (a mesma busca está **implementada 3 vezes** no sistema de hoje: `CLI_PURE`, o `filtraClientes` do v5.22.19 e o `cvSearchCliente` do notinha, com resultados diferentes) |
| **C** | **sistema novo por partes, o de hoje no ar** | nada para de funcionar; cada pedaço entra provado (esta rodada: **864 comparações** de busca iguais ao sistema de hoje); o sistema encolhe; dá para desistir de um pedaço sem estragar o resto | é o caminho mais longo. **Escolhido** |

**O que sustenta a escolha (e não é opinião):** no caminho C, a paridade deixa de ser promessa e vira
teste. Só nesta rodada, a **prova diferencial** pegou **2 divergências reais** que passariam batido numa
reescrita "no olho":
1. `campo = Código` com termo **sem número** devolve a **lista inteira** no sistema de hoje
   (`ajustes_v52236_*` envelopando o `CLI_PURE`) — reproduzido de propósito no módulo novo;
2. os campos de cliente do sistema de hoje se chamam **`telefone`/`codigo`/`documento`/`cep`** — o novo
   estava com `fone`. Corrigido no novo (`novo/telas.js`, `novo/index.html`, testes): sem isso, a busca
   por Telefone não achava nada **e** a migração de dados quebraria depois.

O risco conhecido do caminho C é **tempo** — e a trava continua a mesma: cada parte provada, sem
promessa de "zero defeito" (ver §1 do `PLANO_REDESENHO.md`).

### 29.2 O que foi construído: `novo/selecao.js` (v1.0.0)

A versão do núcleo novo do filtro auxiliar que ele usa hoje — **uma implementação só** para um
comportamento que hoje vive em **9 lugares** (`vos-cli-search`, `fin-cli-termo`, `ctr-cli-busca`,
`ctr-cli-busca-simples`, `ctrd-cli-busca`, `ca-busca-cliente`, `nv-cliente-search`, `cv-cliente-search`,
`neo-cli-search`):

- **Regras puras** (idênticas às de hoje): dobra de acento/maiúscula; termo numérico com 3+ dígitos
  acha dentro de CPF/CNPJ, telefone, WhatsApp e CEP; **Código é exato** (48 = 048 = código antigo 48,
  e não acha 480/1048); e-mail olha o e-mail 2; **produto** fora de Recarga/inativo/excluído e com
  **categoria unificada**; **recarga** por Código/Descrição/Marca.
- **A caixa**: campo "onde buscar" (os mesmos 16 campos, na mesma ordem), caixa de digitar, lupa,
  sugestões com **nome + documento/preço**, setas ↑/↓, **Enter escolhe**, **Esc fecha**, clique escolhe,
  "Nenhum cliente/produto/recarga", limite de 12 (cliente) e 14 (produto/recarga) por vez.
- **Não grava nada**: sem `db`, sem nuvem, sem `localStorage`, sem `alert/confirm/prompt`. É tela + busca.
- Nas telas já migradas a busca passou a usar essa regra: barra com o campo "onde buscar" (16 campos em
  Clientes, categorias em Produtos), busca por **Enter ou lupa** (regra do sistema de hoje), rodapé
  dizendo em qual campo filtrou. Sem o módulo carregado a tela continua funcionando (busca simples) —
  nunca quebra por dependência ausente.

### 29.3 Provas

| Teste | Verificações | O que prova |
|---|---|---|
| `test_selecao.js` (**novo**) | **35 ✔** | **paridade diferencial**: 544 comparações de cliente (16 campos × 34 termos), 288 de produto, 32 de recarga — **todas com a mesma resposta do sistema de hoje**, carregando de verdade o `CLI_PURE`, o `FILTROS_BUSCA_PURE` e o v5.22.36 do repositório; mais a lista de campos idêntica, o código exato, e a tela (digitar, setas, Enter, Esc, clique, limites, "não achei") |
| `test_redesenho_pagina.js` | **34 ✔** (era 24) | na página nova: o campo "onde buscar" com os 16 campos; "jose" acha "José Ávila" e "MARIA JOSE"; campo **Cidade** busca só na cidade; campo **Telefone** acha por número dentro do telefone; Produtos traz as categorias; rodapé diz o campo |
| `test_telas.js` / `test_ponte.js` | 38 ✔ / 50 ✔ | nada regrediu com a troca de `fone` → `telefone` |

**Suíte: 223 passaram, 0 falharam, 0 não rodaram** (com `jsdom`). Nada no sistema de hoje mudou nesta
rodada: o app publicado continua **v7.0.11** (`?v=7.0.11-cd1b595e0a7b`, bundle `3a341ce6d072e7de`) e o
motor da nuvem **5.26.8** (publicado — conferido no `/health`).

### 29.4 Paridade: onde estamos e qual é o próximo

- **Feito:** coração (lápide/dedup/outbox), ponte, telas Clientes/Produtos, conferência sob demanda no
  sistema de hoje, e agora a **seleção inteligente** (regra + caixa) com paridade provada.
- **Próximo (fase 3):** as telas do dia — **venda/notinha** (onde a caixa de seleção vive hoje: escolher
  cliente e produto, item a item, estoque, total, notinha), OS e orçamento — usando esta caixa. Depois
  financeiro, e na fase 4 contratos/parque/leituras/chamados/painel do gerente.
- **Pendências registradas:** os campos do cadastro completo de cliente (`codigo`, `documento`, `cep`,
  `whatsapp`, `fantasia`, `rgIE`, `endereco`, `bairro`, `contato`, `email`, `observacao`, `estado`) ainda
  não existem no núcleo novo — o seletor já os mostra (paridade do controle) e vão ganhar dados quando o
  cadastro completo entrar na fase 3/4. `modulosDinamicos` segue sem formato definido (fase 2/4).
