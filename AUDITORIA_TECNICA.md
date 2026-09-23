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
