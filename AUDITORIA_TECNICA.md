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
- **Conclusão honesta:** não é bug visível hoje (não há botão ligado). É código morto que **vira bug no dia em que alguém religar o botão**. Não foi removido (regra: não apagar código morto sem provar e testar). Fica para decisão do dono.

### 10.4 INFORMATIVO — resíduo da nuvem antiga (Supabase) dentro do bundle

**Arquivo:** `performance_patch.js` (índice **9** do manifesto — entra no `.exe` e no site)

`performance_patch.js` ainda embrulha `syncEnviarParaNuvem`/`syncCarregarDaNuvem` com caminho Supabase (`I.supabaseRequest('app_state?on_conflict=key', …)`, `CLOUD_META_KEY`, cache por backend), lendo `window.__supabaseSyncInternals` — **que não é definido em lugar nenhum do repositório** (verificado por varredura). O caminho cai no `return {ok:false, erros:['sync interno indisponível']}`.

É **código morto**, mas **não é inofensivo**: as duas funções continuam reatribuídas (participam dos embrulhos de 10.3) e carregam trabalho de leitura de cache. `test_nuvem_antiga_removida.js` **não cobre isto** — ele procura arquivos apagados (`.supabase.co`, chaves `AIza…`), não símbolos internos como `__supabaseSyncInternals`.

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
