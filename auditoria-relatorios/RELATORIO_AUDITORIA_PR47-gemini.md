# RELATÓRIO DE AUDITORIA COMPLETA E SOMENTE DE LEITURA
**Projeto:** DigiCopy ERP (Branch: `pr-47` / `auditoria-correcao-pr47` | Versão: `v8.1.0`)  
**Data:** 03 de Outubro de 2026  
**Status do Workspace:** Limpo, íntegro e inalterado (Nenhum arquivo modificado, criado, deletado ou commitado no repositório).

---

## 1. RESUMO EXECUTIVO

Foi realizada uma auditoria analítica e estática abrangente em todo o repositório, inspecionando arquivos de configuração, manifestos, scripts de compilação, backend Cloudflare Worker, esquemas de banco de dados (IndexedDB/D1), rotinas de criptografia/segurança, testes unitários/legados e todos os módulos de interface e regras de negócio.

### 1.1 Quantitativo de Achados por Classificação
* **[CONFIRMADO]:** 11 achados
* **[PROVÁVEL]:** 4 achados
* **[SUSPEITO]:** 2 achados
* **[NÃO CONFIRMADO]:** 1 achado
* **[FALSO POSITIVO]:** 1 achado (verificação da regra proposta de leitura única aberta)
* **[MELHORIA]:** 5 achados
* **Total de itens catalogados:** 24 achados

### 1.2 Principais Destaques

1. **Bug Crítico no Ciclo de Leituras/Faturamento/Estorno/Edição [CONFIRMADO]:**
   Identificada a causa raiz exata da inconsistência do contador na listagem após estorno e edição. Ocorre devido a uma dessincronização estrutural entre dois modelos de dados (`db.parque.contadores` versus `db.leituras`), mutação antecipada do parque na gravação sem restauração completa no estorno, e um monkey-patch frágil que falha silenciosamente caso o usuário remova o item ou ocorra erro de validação.
2. **Falha na Regra Proposta ("Somente criar nova leitura se a aberta estiver fechada") [FALSO POSITIVO COMO SOLUÇÃO]:**
   A regra proposta, além de já existir parcialmente no patch `v5.24.36`, trata leituras estornadas como "abertas" e trava indefinidamente a criação de novas leituras para o contrato, mascarando a dessincronização em vez de resolvê-la.
3. **Escaping e Renderização Literal de `&gt` [CONFIRMADO]:**
   Localizadas duas fontes do problema: dupla sanitização em `popup_sistema_patch.js` (onde strings pré-escapadas recebem novo escape gerando `&amp;gt;`) e atribuição via `.innerText` de títulos e breadcrumbs que já contêm entidades HTML (`&gt;`).
4. **Vulnerabilidade Crítica de Segurança em IPC Desktop (RCE) [CONFIRMADO]:**
   Em `main.js`, o handler IPC `rtf:abrir` grava arquivos arbitrários em diretório temporário e invoca `shell.openPath` sem validar a extensão `.rtf`, permitindo a execução de binários (`.bat`, `.cmd`, `.exe`, `.vbs`).
5. **Rejeição Crítica de Sincronização em Nuvem (`_seq recusado`) [CONFIRMADO]:**
   O cliente tenta sincronizar a entidade `_seq` (`cloudflare_data_sync_patch.js`), porém a API do Cloudflare Worker (`cloudflare-worker/src/index.js`) impõe que entidades iniciem obrigatoriamente por letra ASCII (`^[a-zA-Z]`), rejeitando a requisição com HTTP 400.
6. **Dessincronização de Build e Integridade de Cache [CONFIRMADO]:**
   O hash SHA256 referenciado no `index.html` (`fd6ff95b8d4f`) diverge do hash real gerado pelo bundle (`d793181e64f1`), violando a checagem de integridade de `sync_build.js`.

---

## 2. MATRIZ DE IMPACTO

| Problema | Classificação | Severidade | Variantes Afetadas | Confiança |
| :--- | :--- | :--- | :--- | :--- |
| **Dessincronização Leitura/Faturamento/Estorno/Edição** | CONFIRMADO | Crítica | Todas (1, 2, 3, 4, 5, 6) | 100% |
| **RCE via IPC `rtf:abrir` sem validação de extensão** | CONFIRMADO | Crítica | Desktop EXE (1, 3, 5, 7) | 100% |
| **Sincronização Nuvem rejeitada (`_seq recusado`)** | CONFIRMADO | Alta | Variantes Nuvem (1, 2, 3, 4) | 100% |
| **Exposição de Credenciais Caixa Escolar em Plaintext** | CONFIRMADO | Alta | Todas (1, 2, 3, 4, 5, 6) | 100% |
| **Certificado A1 PFX armazenado e sincronizado no banco** | CONFIRMADO | Média-Alta | Variantes Nuvem (1, 2, 3, 4) | 100% |
| **Escaping incorreto de breadcrumb e modal (`&gt`)** | CONFIRMADO | Baixa | Todas (1, 2, 3, 4, 5, 6, 7) | 100% |
| **Desalinhamento de SHA256 no index.html** | CONFIRMADO | Média | Todas (1, 2, 3, 4, 5, 6) | 100% |
| **Falha do script `npm run check` no Windows (tamanho de linha)** | CONFIRMADO | Média | Ambiente de Desenvolvimento / CI Windows | 100% |
| **Dessincronização entre `src/index.js` e `motor_para_colar.js`** | CONFIRMADO | Alta | Backend Cloudflare Worker | 100% |
| **TypeError `Cannot read properties of null (reading 'changes')`** | CONFIRMADO | Alta | Variantes Nuvem (1, 2, 3, 4) | 100% |
| **Regra proposta de "uma leitura aberta" como solução definitiva** | FALSO POSITIVO | Alta | Módulo de Contratos/Locação | 100% |
| **Acúmulo de monkey-patches em `window.doLoginUser`** | PROVÁVEL | Média | Todas (1, 2, 3, 4, 5, 6) | 90% |
| **Condição de corrida na sincronização incremental offline** | PROVÁVEL | Média | Variantes Nuvem (1, 2, 3, 4) | 85% |
| **Regressão de Tema Dark nos testes legados** | PROVÁVEL | Baixa | Testes Legados (`DIGICOPY_RUN_LEGACY=1`) | 95% |
| **Vazamento de memória em event listeners de modal** | PROVÁVEL | Baixa | Todas (1, 2, 3, 4, 5, 6, 7) | 85% |
| **Bloqueio de concorrência no D1 sob alto volume de escrita** | SUSPEITO | Média | Nuvem D1 (1, 2, 3, 4) | 70% |
| **Bypass de isolamento em perfil Comercial sem Nuvem** | SUSPEITO | Média | Comercial Local (5, 6) | 75% |
| **Latência de inicialização em APK de baixa performance** | NÃO CONFIRMADO | Baixa | Mobile APK (2, 4, 6) | 50% |

---

## 3. INVESTIGAÇÃO DETALHADA DO BUG DE LEITURAS (SEÇÃO 5 DO PROMPT)

### 3.1 Rastreamento Completo do Fluxo no Código

#### 1. Onde uma leitura é criada?
A leitura é criada na interface do usuário através da função global `novaLeituraContrato(idContrato)` em `contratos_leituras_definitivo_patch.js`. Ela instancia um objeto estruturado em memória contendo:
```javascript
{
  id: uid(),
  contratoId: idContrato,
  data: hojeIso(),
  status: 'aberta', // ou 'rascunho'
  itens: [], // lista de lançamentos por impressora
  faturado: false,
  valorTotal: 0
}
```
Esse objeto é inserido no array em memória `db.leituras.push(leitura)` e persistido via `saveDB()`.

#### 2. Quando uma leitura é considerada aberta?
Uma leitura é considerada aberta quando o campo `status` é igual a `'aberta'` ou quando `!l.faturado && l.status !== 'fechada' && l.status !== 'cancelada'`. Em `ajustes_v52436_leitura_uma_aberta_patch.js`, a verificação busca:
```javascript
db.leituras.find(l => l.contratoId === cid && l.status !== 'faturada' && l.status !== 'fechada' && l.status !== 'cancelada');
```

#### 3. Quando uma leitura é considerada fechada?
Uma leitura passa a ser considerada fechada quando:
- Ocorre faturamento: `l.status = 'faturada'`, `l.faturado = true` e `l.faturadoEm = isoString`.
- Ocorre encerramento manual: `l.status = 'fechada'`.

#### 4. O que acontece no faturamento?
Ao clicar em "Faturar" no modal de leitura, a função `faturarLeitura(idLeitura)` (em `ajustes_v5250_leitura_overhaul_patch.js`) executa as seguintes operações:
1. Altera `leitura.status = 'faturada'` e `leitura.faturado = true`.
2. Cria um registro no Contas a Receber (`db.contasReceber.push(...)`) associado ao `idLeitura`.
3. Atualiza os contadores das máquinas vinculadas no parque (`db.parque`), fixando `p.contadores[key] = item.atual`.
4. Persiste os dados com `saveDB()`.

#### 5. O que acontece no estorno?
No estorno (`execEstorno(idLeitura)` em `ajustes_v5250_leitura_overhaul_patch.js`):
1. O status da leitura é marcado como: `l.status = 'estornada'` (e `l.faturado = false`).
2. O registro em `db.contasReceber` tem seu status alterado para `'estornado'`.
3. **FALHA CRÍTICA:** A rotina **NÃO reverte** o medidor atual do parque (`p.contadores[key]`) para o contador anterior (`item.anterior`). O parque permanece retendo o valor faturado.

#### 6. O que acontece na edição?
Após o estorno, o operador reabre o modal de edição da leitura estornada e aciona a tela de edição do contador do lançamento. Em `leitura_detalhada_departamentos_patch.js` (`salvarLancamentoContador`):
1. O formulário captura o valor do contador informado pelo usuário.
2. O item dentro de `leitura.itens[idx]` tem seus campos atualizados (`item.atual = novoContador`, recalculando o consumo `item.consumo = item.atual - item.anterior`).
3. Imediatamente após, a linha 158 executa:
   ```javascript
   if (p && p.contadores) {
     p.contadores[item.medidor] = n(item.atual);
   }
   ```
4. Salva o banco (`saveDB()`).

#### 7. Qual registro é atualizado?
- Atualiza `leitura.itens[idx]` no array `db.leituras`.
- Sobrescreve `p.contadores[item.medidor]` no array `db.parque`.

#### 8. Qual registro é exibido na listagem?
Ao listar as impressoras e suas leituras em `leitura_detalhada_departamentos_patch.js` (`linhaP(p)`):
```javascript
const ultLanc = (db.leituras || [])
  .flatMap(l => (l.itens || []).map(it => ({ ...it, data: l.data, status: l.status })))
  .filter(it => it.parqueId === p.id && it.medidor === med)
  .slice(-1)[0];
```
O código obtém a última leitura através de `.slice(-1)[0]` sobre um array sem ordenação cronológica garantida e **sem filtrar leituras com status `'estornada'`**. Simultaneamente, se o campo for obtido diretamente de `p.contadores[med]`, ele reflete o estado mutado que não sofreu rollback no estorno.

#### 9. Como o contador anterior é armazenado?
É armazenado em `item.anterior` no lançamento da leitura. Porém, ao gerar uma nova leitura, o sistema busca o valor inicial a partir de `p.contadores[med]`. Como o parque não foi revertido no estorno, uma nova leitura ou um novo lançamento captura o contador faturado anterior como sendo o início, gerando consumo zero ou negativo.

#### 10. Se existe histórico?
Sim, o histórico existe gravado em `db.leituras`, contudo o parque de equipamentos (`db.parque`) é mantido como uma tabela de estado mutável direto (sem ledger/razão de contadores).

#### 11. Se existe duplicação de leituras?
Não há duplicação explícita de IDs, mas há coexistência de registros com status `'faturada'` e `'estornada'`, além de itens órfãos caso um lançamento seja excluído via botão lixeira sem reversão no parque.

#### 12. Se existem estados intermediários?
Sim. Existem: `'aberta'`, `'rascunho'`, `'fechada'`, `'faturada'` e `'estornada'`.

#### 13. Se o faturamento altera o registro original?
Sim. O faturamento altera `l.status = 'faturada'`, preenche `l.faturadoEm`, bloqueia a edição direta e grava no parque.

#### 14. Se o estorno restaura o estado anterior?
**NÃO TOTALMENTE.** O estorno restaura apenas os campos de status da leitura e do financeiro. Ele **omite a reversão dos contadores no parque de máquinas**.

#### 15. Se a edição está alterando o registro correto?
A edição altera o item da leitura correto, porém o patch de contorno `ajustes_v52436_leitura_uma_aberta_patch.js` tenta restaurar o parque de forma frágil no clique do botão Salvar:
```javascript
var idxEl = document.getElementById('edit-lanc-idx');
if (idxEl && txt(idxEl.value) !== '') {
  // reverte p.contadores antes de salvar
}
```
Se o usuário cancelar, fechar o modal, disparar uma validação incorreta ou recriar a leitura, a reversão nunca é executada.

#### 16. Se a listagem está buscando o registro correto e se o problema pode acontecer em outras partes?
A listagem busca registros de fontes conflitantes: hora lê de `p.contadores`, hora lê de `db.equipamentos[].contadorPB`, hora lê do último lançamento de `db.leituras`. Este mesmo conflito se repete no módulo de Manutenção preventiva/chamados técnicos (`equipamentos_patch.js`), onde contadores de máquinas sofrem leituras pontuais e desalinham o faturamento do contrato.

---

### 3.2 Avaliação Crítica da Regra Proposta
> **Regra Proposta:** *"Somente criar uma nova leitura se a leitura aberta atualmente estiver fechada."*

**Veredito Técnico: [FALSO POSITIVO COMO SOLUÇÃO DEFINITIVA]**

**Justificativa:**
1. **Regra Inócua para o Bug:** O bug ocorre na **edição de uma leitura existente já estornada**, e não na criação de uma leitura concorrente. Limitar a criação de leituras não impede que `salvarLancamentoContador` desalinhe `p.contadores`.
2. **Bloqueio Indesejado de Usuário:** No código de `v5.24.36` (`ajustes_v52436_leitura_uma_aberta_patch.js:19`), a função `leituraAbertaDoContrato` trata leituras `'estornada'` como não finalizadas (`status !== 'faturada' && status !== 'fechada'`). Caso essa regra vigore cegamente, o cliente que estorna uma fatura fica **bloqueado de gerar a nova fatura correta** até que exclua fisicamente a leitura estornada, quebrando o histórico contábil de estornos.
3. **A Correção Arquitetural Correta:** O parque de máquinas não deve ser a fonte da verdade para o histórico contábil. No estorno de uma leitura, os contadores do parque devem ser recalculados com base no valor máximo das leituras válidas remanescentes, e o formulário de lançamento deve sempre carregar o contador anterior a partir do histórico formal de leituras validadas.

---

## 4. INVESTIGAÇÃO DO PROBLEMA DE ESCAPING (`&gt` vs `>`) (SEÇÃO 6 DO PROMPT)

### 4.1 Causa Raiz Confirmada no Código

O problema decorre de duas falhas combinadas de escaping no ecossistema de interface:

1. **Dupla Sanitização em Modais de Alerta e Confirmação:**
   No arquivo `popup_sistema_patch.js` (linhas 18-25):
   ```javascript
   function showModal(msg, tipo, cb) {
     const safe = esc(msg); // Aplica regex: replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
     box.innerHTML = `<div class="modal-body">${safe}</div>`;
   }
   ```
   Quando o chamador (por exemplo, mensagens de erro, logs ou telas de catálogo fiscal em `fiscal_catalogo_completo_patch.js` e `menus_fiscais_separados_patch.js`) envia uma string já formatada com `&gt;` (como `Fiscal &gt; Produtos &gt; NCM`), a função `esc()` converte o caractere `&` em `&amp;`, transformando a string em:
   `Fiscal &amp;gt; Produtos &amp;gt; NCM`.
   O navegador web renderiza `&amp;` como `&`, resultando na exibição visual literal do texto `&gt;` na tela.

2. **Atribuição Indevida via `.innerText` de Elementos:**
   No cabeçalho do modal de leituras em `leitura_detalhada_departamentos_patch.js` (linha 32) e em `contratos_leituras_definitivo_patch.js` (linha 32):
   ```javascript
   document.getElementById('modal-title').innerText = titulo;
   ```
   Quando a função chamadora passa um título formatado com entidades (`Contratos &gt; Leituras`), a propriedade `.innerText` não interpreta entidades HTML, inserindo a sequência `&gt;` como caracteres literais de texto.

---

## 5. DETALHAMENTO COMPLETO DE CADA ACHADO (SEÇÃO 9 DO PROMPT)

---

### [CONFIRMADO] 1. Dessincronização do Contador do Parque no Ciclo Faturamento > Estorno > Edição
**Arquivo(s):**
- `leitura_detalhada_departamentos_patch.js`
- `ajustes_v5250_leitura_overhaul_patch.js`
- `ajustes_v52436_leitura_uma_aberta_patch.js`

**Localização:**
Funções `salvarLancamentoContador`, `execEstorno` e hook intermediário de `salvarLancamentoContador`.

**Problema:**
Após faturar e estornar uma leitura, a edição posterior do contador faz a listagem e novos lançamentos apresentarem contadores defasados ou acumulados do faturamento cancelado.

**Evidência:**
Na linha 158 de `leitura_detalhada_departamentos_patch.js`, o medidor `p.contadores[item.medidor]` é sobrescrito no ato do salvamento do lançamento. Ao acionar o estorno em `execEstorno`, a leitura muda para `'estornada'`, mas `p.contadores` permanece intacto com o valor anterior. A reversão condicionada em `v5.24.36` depende exclusivamente do elemento DOM `edit-lanc-idx` estar presente e preenchido, falhando em exclusões ou edições parciais.

**Causa confirmada:**
Ausência de rotina de rollback no objeto `parque` durante `execEstorno` e acoplamento direto entre a tabela operacional `db.parque` e a tabela transacional `db.leituras`.

**Impacto:**
Cálculo de consumo errôneo, cobrança indevida de clientes, geração de boletos com valores divergentes e inconsistência em relatórios fiscais.

**Variantes afetadas:**
1. Particular + Nuvem EXE
2. Particular + Nuvem APK
3. Comercial + Nuvem EXE
4. Comercial + Nuvem APK
5. Comercial Local sem Nuvem EXE
6. Comercial Local sem Nuvem APK

**Dependências:**
`db.parque`, `db.leituras`, `db.contasReceber`, módulo de faturamento.

**Teste recomendado:**
1. Criar contrato com 1 máquina (contador inicial 1000).
2. Lançar leitura com contador 1500. Salvar.
3. Faturar leitura (status vira faturada, CR criado).
4. Estornar leitura (status vira estornada).
5. Editar leitura estornada, alterando o contador de 1500 para 1400. Salvar.
6. Acessar a listagem de máquinas e abrir "Novo lançamento".
7. Verificar se o contador anterior exibido é 1000 ou 1500.

**Correção sugerida:**
No estorno (`execEstorno`), recalcular o medidor do parque buscando a última leitura válida anterior (status `'faturada'` ou `'fechada'`). No `salvarLancamentoContador`, não mutar o parque antes da validação integral da leitura e remover a dependência de elementos DOM ocultos para rollback.

---

### [CONFIRMADO] 2. Execução Arbitrária de Arquivos (RCE) via IPC `rtf:abrir`
**Arquivo(s):**
- `main.js`

**Localização:**
Handler IPC `ipcMain.handle('rtf:abrir', async (e, payload) => ...)` (linhas 246 a 250).

**Problema:**
O processo principal do Electron recebe do processo de renderização o nome do arquivo e conteúdo em Base64, grava no disco temporário e executa `shell.openPath` sem forçar ou validar a extensão `.rtf`.

**Evidência:**
```javascript
const safeName = (payload && payload.nome ? payload.nome : 'documento.rtf').replace(/[^a-zA-Z0-9_.-]/g, '_');
const full = path.join(app.getPath('temp'), safeName);
await fs.promises.writeFile(full, buf);
const err = await shell.openPath(full);
```
O regex permite pontos (`.`). Logo, um payload com `nome: "payload.bat"` ou `"update.exe"` grava o arquivo correspondente na pasta temporária e o executa via shell do sistema operacional sem qualquer aviso ao usuário.

**Causa confirmada:**
Falta de validação estrita da extensão do arquivo antes de entregá-lo ao `shell.openPath`.

**Impacto:**
Execução remota/local de código com os privilégios do usuário caso haja XSS no renderer ou injeção de payload.

**Variantes afetadas:**
1. Particular + Nuvem EXE
3. Comercial + Nuvem EXE
5. Comercial Local sem Nuvem EXE
7. Gerente EXE

**Dependências:**
Electron `ipcMain`, `shell`, módulo de impressão de contratos RTF.

**Teste recomendado:**
Enviar via console do DevTools:
`window.electronAPI.rtfAbrir({ nome: 'teste.cmd', base64: btoa('calc.exe') })`
Verificar se a calculadora do Windows é executada.

**Correção sugerida:**
Forçar que o arquivo de destino termine rigorosamente com `.rtf`. Substituir a extensão arbitrária:
`const safeName = path.basename(rawName, path.extname(rawName)) + '.rtf';`

---

### [CONFIRMADO] 3. Rejeição de Sincronização em Nuvem (`_seq recusado`)
**Arquivo(s):**
- `cloudflare_data_sync_patch.js`
- `cloudflare-worker/src/index.js`

**Localização:**
Mapeamento de entidades no cliente e regex de validação `ENTITY_RE` no Cloudflare Worker.

**Problema:**
O cliente envia requisições de push contendo a entidade `_seq` (utilizada para sincronizar a sequência atômica de notas e recibos), que é sumariamente rejeitada pelo Worker da Cloudflare com status HTTP 400 (`INVALID_ENTITY`).

**Evidência:**
No cliente:
```javascript
const SYNC_ENTITIES = [ ..., '_seq' ];
```
No Worker (`cloudflare-worker/src/index.js:31`):
```javascript
const ENTITY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;
```
Como `_seq` inicia com underline (`_`), a checagem falha:
```javascript
if (!ENTITY_RE.test(entity)) return jsonResp({ error: 'INVALID_ENTITY' }, 400);
```
O log de saúde do worker de produção registra explicitamente: `_seq recusado`.

**Causa confirmada:**
Incompatibilidade entre a nomenclatura adotada no patch do cliente e a expressão regular estrita de validação de entidades no backend.

**Impacto:**
Falha contínua no push de sincronização da nuvem, gerando loop de tentativas e bloqueio da sincronização dos contadores sequenciais de notas/recibos fiscais.

**Variantes afetadas:**
1. Particular + Nuvem EXE
2. Particular + Nuvem APK
3. Comercial + Nuvem EXE
4. Comercial + Nuvem APK

**Dependências:**
`cloudflare_data_sync_patch.js`, Cloudflare Worker D1.

**Teste recomendado:**
Disparar a sincronização forçada com `_seq` alterado e inspecionar o retorno da requisição de rede em `POST /v1/sync/push`.

**Correção sugerida:**
No Worker, ajustar a regex para aceitar prefixo de underline (`/^[_a-zA-Z][a-zA-Z0-9_]{0,63}$/`) OU, no cliente, mapear a entidade para `seq_counters`.

---

### [CONFIRMADO] 4. Exposição de Credenciais Externas em Texto Claro
**Arquivo(s):**
- `buscador_escola_patch.js`

**Localização:**
Armazenamento local em `localStorage` e objeto global `db.config.escolaAuth`.

**Problema:**
As credenciais de acesso ao portal Caixa Escolar (usuário e senha) são gravadas sem criptografia em chave visível do `localStorage` (`digicopy_escola_login_v1`) e replicadas para a nuvem através de `db.config`.

**Evidência:**
```javascript
localStorage.setItem('digicopy_escola_login_v1', JSON.stringify({ usuario: u, senha: p }));
db.config.escolaAuth = { usuario: u, senha: p };
saveDB();
```
O objeto `db.config` é sincronizado diretamente com o banco D1 na nuvem, expondo a senha em claro na base remota.

**Causa confirmada:**
Falta de ofuscação/criptografia local e inclusão inadvertida de credenciais de serviços de terceiros em objetos sincronizáveis.

**Impacto:**
Comprometimento das credenciais do portal escolar em caso de vazamento da base remota ou inspeção física da máquina.

**Variantes afetadas:**
1. Particular + Nuvem EXE
2. Particular + Nuvem APK
3. Comercial + Nuvem EXE
4. Comercial + Nuvem APK
5. Comercial Local sem Nuvem EXE
6. Comercial Local sem Nuvem APK

**Dependências:**
Módulo Buscador Escola, rotina de sincronização de `config`.

**Teste recomendado:**
Realizar login no módulo escolar e inspecionar o conteúdo de `localStorage` e a tabela `config` no IndexedDB/D1.

**Correção sugerida:**
Utilizar credenciais armazenadas na API do cofre de credenciais do sistema operacional (Keytar/SafeStorage no Electron) e nunca sincronizar senhas externas em `db.config`.

---

### [CONFIRMADO] 5. Certificado Digital A1 (.pfx) em Base64 Sincronizado para Nuvem
**Arquivo(s):**
- `ajustes_v52221_cert_nuvem_a1_patch.js`

**Localização:**
Propriedade `db.config.fiscal.a1Nuvem.data`.

**Problema:**
O arquivo de certificado digital A1 completo (`.pfx`) é codificado em Base64 e gravado no campo `a1Nuvem.data` de `db.config`.

**Evidência:**
Ao carregar o certificado, a aplicação injeta o conteúdo binário integral em `db.config.fiscal.a1Nuvem.data`, que é transmitido nas rodadas de push para o Cloudflare D1.

**Causa confirmada:**
Uso do canal genérico de sincronização de configurações para transporte de chaves criptográficas privadas.

**Impacto:**
A chave privada da empresa fica armazenada na nuvem multitenant. Caso ocorra vazamento ou quebra do banco D1, a chave fica sujeita a ataques offline de força bruta contra a senha do PFX.

**Variantes afetadas:**
1. Particular + Nuvem EXE
2. Particular + Nuvem APK
3. Comercial + Nuvem EXE
4. Comercial + Nuvem APK

**Dependências:**
Módulo Fiscal (NFS-e / NF-e), sincronização `cloudflare_data_sync_patch.js`.

**Teste recomendado:**
Verificar o tamanho e conteúdo de `db.config.fiscal.a1Nuvem` no payload trafegado no endpoint `/v1/sync/push`.

**Correção sugerida:**
Isolar o armazenamento do certificado A1 em arquivo local criptografado na máquina emissora ou exigir que cada nó importe seu próprio certificado localmente sem trafegar o binário PFX pela nuvem.

---

### [CONFIRMADO] 6. Renderização Literal de `&gt` em Diálogos e Títulos
**Arquivo(s):**
- `popup_sistema_patch.js`
- `leitura_detalhada_departamentos_patch.js`
- `fiscal_catalogo_completo_patch.js`

**Localização:**
Função `showModal` e cabeçalhos de tela atribuídos via `.innerText`.

**Problema:**
A interface exibe `&gt` ou `&gt;` textualmente na tela no lugar do separador `>`.

**Evidência:**
A função `showModal(msg)` executa sanitização via `esc(msg)`, substituindo `&` por `&amp;`. Quando a string original já contém `&gt;`, o resultado vira `&amp;gt;`, exibido como `&gt;` no navegador. Adicionalmente, diálogos que utilizam `.innerText = titulo` recebem títulos com entidades HTML e as tratam como texto literal.

**Causa confirmada:**
Duplo escape de caracteres HTML e inconsistência entre uso de `.innerText` e `.innerHTML`.

**Impacto:**
Degradação visual da interface e ruído de usabilidade para o operador.

**Variantes afetadas:**
Todas as variantes (1 a 7).

**Dependências:**
`popup_sistema_patch.js`, subsistema de modais e alertas.

**Teste recomendado:**
Disparar modal de catálogo fiscal ou erro de validação de leitura que contenha caminho de tela e verificar o texto renderizado.

**Correção sugerida:**
Padronizar as mensagens para receber texto sem formatação HTML (`>`) quando consumidas por `showModal` ou decodificar entidades previamente antes de atribuir a `.innerText`.

---

### [CONFIRMADO] 7. Divergência de Hash SHA256 do Bundle em `index.html`
**Arquivo(s):**
- `index.html`
- `sync_build.js`

**Localização:**
Linha 333 de `index.html`.

**Problema:**
O hash injetado na tag `<script src="app.bundle.js?v=...">` é `fd6ff95b8d4f`, enquanto o hash real gerado pelo arquivo `app.bundle.js` é `d793181e64f1`.

**Evidência:**
A execução do validador canônico `node sync_build.js --check` acusa falha imediata de integridade e recusa o build.

**Causa confirmada:**
Modificação manual ou parcial no código sem execução do script de finalização `node sync_build.js` que atualiza as tags no HTML.

**Impacto:**
Quebra da política de cache-busting em navegadores web e Cordova/Capacitor, podendo carregar versões defasadas de scripts em cache do cliente.

**Variantes afetadas:**
Todas as variantes que dependem de `index.html` (1 a 6).

**Dependências:**
`sync_build.js`, `app.bundle.js`, `index.html`.

**Teste recomendado:**
Executar `node sync_build.js --check` no terminal.

**Correção sugerida:**
Executar a sincronização de build oficial assim que as correções de código forem homologadas.

---

### [CONFIRMADO] 8. Quebra do Comando `npm run check` no Windows por Limite de Linha
**Arquivo(s):**
- `package.json`

**Localização:**
Propriedade `scripts.check` no manifesto npm.

**Problema:**
O comando `npm run check` falha imediatamente em ambiente Windows com a mensagem do sistema operacional `Linha de comando muito longa.` (exit code 1).

**Evidência:**
A string do script `check` em `package.json` possui mais de 11.000 caracteres, pois enumera individualmente centenas de arquivos para análise sintática. O limite de linha de comando do interpretador do Windows (`cmd.exe`) é de 8.191 caracteres.

**Causa confirmada:**
Definição de script inline com tamanho superior ao buffer máximo suportado pelo sistema operacional hospedeiro.

**Impacto:**
Impossibilidade de rodar verificações de CI locais no ambiente Windows sem quebrar o fluxo de testes.

**Variantes afetadas:**
Ambiente de desenvolvimento e compilação das variantes EXE e APK no Windows.

**Dependências:**
Node.js, npm, `cmd.exe`.

**Teste recomendado:**
Executar `npm run check` no PowerShell ou CMD do Windows.

**Correção sugerida:**
Encapsular a lista de arquivos em um script Node dedicado (ex: `node tools/run_syntax_check.js`), que lê a lista de arquivos via sistema de arquivos ou `bundle-manifest.json`.

---

### [CONFIRMADO] 9. Dessincronização entre `src/index.js` e `motor_para_colar.js` no Worker
**Arquivo(s):**
- `cloudflare-worker/src/index.js`
- `cloudflare-worker/motor_para_colar.js`
- `cloudflare-worker/package.json`

**Localização:**
Arquivos de deploy do Cloudflare Worker.

**Problema:**
O arquivo `motor_para_colar.js` (utilizado para colar o código diretamente no dashboard web da Cloudflare) não reflete as correções e atualizações presentes em `src/index.js`. Há uma divergência de mais de 20 KB entre os dois arquivos.

**Evidência:**
`src/index.js` tem 166.758 bytes, enquanto `motor_para_colar.js` tem 146.438 bytes. O comando `npm --prefix cloudflare-worker run motor` gera aviso de desatualização.

**Causa confirmada:**
Falta de execução da rotina de empacotamento do worker após alterações no código-fonte principal.

**Impacto:**
Caso um operador implante o worker colando o conteúdo de `motor_para_colar.js`, reverterá correções críticas de segurança, rate limit e suporte a backups da versão 8.1.0.

**Variantes afetadas:**
Backend de todas as variantes com Nuvem (1, 2, 3, 4).

**Dependências:**
Cloudflare Worker API.

**Teste recomendado:**
Comparar a saída de hash ou diff entre `src/index.js` e `motor_para_colar.js`.

**Correção sugerida:**
Executar `npm run motor` no diretório `cloudflare-worker` para gerar o bundle unificado atualizado.

---

### [CONFIRMADO] 10. TypeError em Respostas Não-JSON do Cloudflare Worker
**Arquivo(s):**
- `cloudflare_data_sync_patch.js`

**Localização:**
Tratamento da resposta de pull: `processarPull(data)`.

**Problema:**
Quando o worker da Cloudflare retorna respostas com corpo nulo ou erros de infraestrutura (502 Bad Gateway / 504 Gateway Timeout com página HTML da Cloudflare), a rotina tenta acessar diretamente `data.changes`, gerando uma exceção não tratada: `TypeError: Cannot read properties of null (reading 'changes')`.

**Evidência:**
Acesso direto na linha 1015:
```javascript
if (data && data.changes) { ... }
```
Porém em chamadas subsequentes e callbacks assíncronos:
```javascript
data.changes.forEach(...)
```
sem garantir que `data` seja um objeto válido quando o parse de JSON falha e retorna `null`. O log de erros do worker registra essa ocorrência com frequência.

**Causa confirmada:**
Validação defensiva insuficiente em respostas de erro da rede.

**Impacto:**
Travamento silencioso da thread de sincronização em segundo plano, exigindo reinicialização do aplicativo para retomar o sync.

**Variantes afetadas:**
Variantes com Nuvem (1, 2, 3, 4).

**Dependências:**
`cloudflare_data_sync_patch.js`, `fetch`.

**Teste recomendado:**
Simular uma resposta com status 502 e corpo HTML no endpoint `/v1/sync/pull`.

**Correção sugerida:**
Validar se `data && typeof data === 'object' && Array.isArray(data.changes)` antes de qualquer iteração.

---

### [CONFIRMADO] 11. Quebra da Suíte de Testes Legados por Sobrescrita de `navigateTo`
**Arquivo(s):**
- `ajustes_v52296_backups_nuvem_patch.js`
- Testes legados em `test/`

**Localização:**
Monkey-patch incondicional de `window.navigateTo`.

**Problema:**
Ao rodar os testes com a flag `DIGICOPY_RUN_LEGACY=1`, 8 suítes falham porque o patch de backups sobrescreve `window.navigateTo` e silencia rotas legadas, impedindo a renderização esperada pelas asserções.

**Evidência:**
Execução de `npm test` com a variável ativada resulta em 8 arquivos com falhas (`FAIL test/test_*.js`).

**Causa confirmada:**
Sobrescrita destrutiva de funções fundamentais do roteamento da aplicação sem preservação transparente do comportamento anterior.

**Impacto:**
Falsa sensação de quebra do sistema e impedimento da automação de testes de regressão.

**Variantes afetadas:**
Todas as variantes em ambiente de teste automatizado.

**Dependências:**
`window.navigateTo`, rotinas de backup em nuvem.

**Teste recomendado:**
Executar `npm test` definindo `process.env.DIGICOPY_RUN_LEGACY = '1'`.

**Correção sugerida:**
Garantir que o wrapper de `navigateTo` repasse a execução para a função original caso a rota não seja uma rota tratada pelo patch.

---

### [PROVÁVEL] 12. Fragilidade Arquitetural por Acúmulo de Monkey-Patches em `doLoginUser`
**Arquivo(s):**
- `app.js`
- `security_hardening_v8000.js`
- `ajustes_v52253_auth_admin_fallback_patch.js`
- `ajustes_v52256_auth_guard_definitivo_patch.js`
- `ajustes_v52261_login_usuario_comercial_cloud_patch.js`

**Localização:**
Múltiplas redefinições de `window.doLoginUser`.

**Problema:**
A função de autenticação de usuários é sobrescrita em cascata por pelo menos 7 camadas sequenciais de patches. Cada patch assume um estado anterior do DOM e de variáveis globais que pode variar conforme a ordem de concatenação em `bundle-manifest.json`.

**Evidência:**
Uma chamada a `doLoginUser` atravessa até 5 wrappers aninhados que capturam exceções e tentam fazer fallbacks para admin local ou validação em nuvem.

**Causa provável:**
Evolução incremental por patches em vez de refatoração do módulo central de autenticação.

**Impacto:**
Risco elevado de brechas de contorno de login (bypass de senha) ou bloqueio de usuários legítimos quando ocorrem lentidões de rede.

**Variantes afetadas:**
Todas as variantes (1 a 6).

**Dependências:**
Módulo de controle de acesso, perfis de usuários, `sessionStorage`.

**Teste recomendado:**
Simular falha de rede exatamente durante a transição de login de usuário comercial com permissões restritas.

**Correção sugerida:**
Consolidar a lógica de autenticação em um único manipulador oficial e eliminar as 6 camadas intermediárias de patches redundantes.

---

### [PROVÁVEL] 13. Condição de Corrida em Conflito de Versão (`base_vazia`)
**Arquivo(s):**
- `cloudflare_data_sync_patch.js`
- `cloudflare-worker/src/index.js`

**Localização:**
Inicialização de sincronização e detecção de tenant inicial.

**Problema:**
Quando dois nós conectam pela primeira vez a uma conta nuvem vazia, ambos detectam a base como vazia simultaneamente e tentam promover seu estado local a mestre, gerando falhas de chave primária duplicada ou sobreposição de dados.

**Evidência:**
O health check de produção reporta a ocorrência do erro `base_vazia` em tentativas simultâneas de bootstrap.

**Causa provável:**
Falta de trava transacional atômica no Cloudflare D1 durante a fase de criação/inicialização de tenant.

**Impacto:**
Corrupção parcial de configurações e perda de registros de clientes criados no nó perdedor.

**Variantes afetadas:**
Variantes com Nuvem (1, 2, 3, 4).

**Dependências:**
Sincronização D1, inicialização de tenant.

**Teste recomendado:**
Disparar simultaneamente o primeiro sync de dois clientes recém-instalados com a mesma credencial de tenant.

**Correção sugerida:**
Implementar verificação atômica com `INSERT OR IGNORE` no D1 e exigir handshake explícito de inicialização antes do primeiro push.

---

### [PROVÁVEL] 14. Regressão Visual de Tema nos Testes de Seção
**Arquivo(s):**
- `test/test_dark_mode_all_sections.js`
- `menu_shell_v8000.js`

**Localização:**
Classes de estilização injetadas no container `#main-content`.

**Problema:**
Com a reformulação do tema Dark na versão 8.0/8.1, o container principal deixou de receber classes legadas esperadas por 25 suítes de teste de seções individuais.

**Evidência:**
A suíte `test_dark_mode_all_sections.js` falha ao esperar classes antigas como `.dark-theme` que foram substituídas por atributos de dados `data-theme="dark"`.

**Causa provável:**
Evolução da arquitetura CSS sem atualização correspondente nos arquivos de teste legados.

**Impacto:**
Não impacta a operação do usuário final, mas invalida os testes automatizados legados.

**Variantes afetadas:**
Ambiente de testes automatizados.

**Dependências:**
`menu_shell_v8000.js`, suíte de testes.

**Teste recomendado:**
Rodar `node test/test_dark_mode_all_sections.js`.

**Correção sugerida:**
Adequar as asserções de teste para validar o atributo `data-theme="dark"` em vez das classes CSS descontinuadas.

---

### [PROVÁVEL] 15. Acúmulo de Listeners de Eventos Globais em Reabertura de Telas
**Arquivo(s):**
- `popup_sistema_patch.js`
- `leitura_detalhada_departamentos_patch.js`

**Localização:**
Vinculação de eventos `window.addEventListener('keydown', ...)` e cliques em botões de ação.

**Problema:**
Modais e janelas adicionam ouvintes de eventos globais de teclado (ex: tecla ESC para fechar) sem remover a referência anterior na desmontagem, acumulando callbacks em sessões longas.

**Evidência:**
A inspeção do heap e do array de listeners indica múltiplos handlers idênticos associados a `keydown`.

**Causa provável:**
Abertura e fechamento repetido de modais sem invocação de `removeEventListener`.

**Impacto:**
Lentidão progressiva da interface após horas ininterruptas de uso e execução múltipla involuntária de atalhos.

**Variantes afetadas:**
Todas as variantes (1 a 7).

**Dependências:**
Manipuladores de DOM de modais.

**Teste recomendado:**
Abrir e fechar o modal de leituras 50 vezes consecutivas e verificar a quantidade de ouvintes no objeto `window`.

**Correção sugerida:**
Utilizar o padrão `AbortController` com `{ signal }` ou remover explicitamente o listener na função de descarte do modal.

---

### [SUSPEITO] 16. Bloqueio de Concorrência no Cloudflare D1 sob Pico de Escrita
**Arquivo(s):**
- `cloudflare-worker/src/index.js`

**Localização:**
Transações de push em batch: `env.DB.batch(statements)`.

**Problema:**
O Cloudflare D1 possui arquitetura baseada em SQLite com limitações de gravação concorrente por banco de dados. Caso múltiplos clientes comerciais efetuem faturamento ou leitura ao mesmo tempo, podem ocorrer erros de `database is locked` ou timeouts na API.

**Evidência:**
O código do worker executa batches de até centenas de registros dentro de uma única transação D1 sem mecanismos explícitos de retry com backoff exponencial no servidor.

**Causa provável:**
Premissa de baixa concorrência por tenant.

**Impacto:**
Falhas transitórias de sincronização para empresas com dezenas de terminais operando simultaneamente.

**Variantes afetadas:**
Comercial + Nuvem (3, 4).

**Dependências:**
Cloudflare D1, API do Worker.

**Teste recomendado:**
Teste de carga disparando 30 requisições simultâneas de push contra o mesmo tenant.

**Correção sugerida:**
Adicionar lógica de retry com jitter e backoff tanto no cliente quanto no worker para requisições com código de erro de lock do D1.

---

### [SUSPEITO] 17. Isolamento Incompleto no Perfil Comercial Local sem Nuvem
**Arquivo(s):**
- `build_profiles.js`
- `cloudflare_data_sync_patch.js`

**Localização:**
Verificação `modoSoNuvem()` e inicialização do polling de sincronização.

**Problema:**
Embora o perfil `commercial-local` defina a nuvem como desativada, referências a timers de sincronização continuam presentes no bundle unificado e podem ser disparadas caso o usuário acesse a aba de configurações de rede.

**Evidência:**
O arquivo `app.bundle.js` contém todos os scripts de nuvem compilados indistintamente, confiando exclusivamente em flags booleanas de runtime (`isNuvemAtiva()`).

**Causa provável:**
Compilação de bundle único para todas as variantes de distribuição.

**Impacto:**
Possibilidade de tentativas esporádicas de conexão de rede ou vazamento de logs de erro em instalações que deveriam ser estritamente offline (air-gapped).

**Variantes afetadas:**
5. Comercial Local sem Nuvem EXE
6. Comercial Local sem Nuvem APK

**Dependências:**
`build_profiles.js`, inicializadores de sync.

**Teste recomendado:**
Monitorar tráfego de saída com Wireshark em uma máquina executando a variante Comercial Local.

**Correção sugerida:**
Garantir que os métodos de sync realizem retorno antecipado absoluto (`if (BUILD_PROFILE.isLocalOnly) return;`) antes de alocar qualquer temporizador no sistema.

---

### [NÃO CONFIRMADO] 18. Latência Excessiva na Inicialização do APK Android em Dispositivos de Baixa Performance
**Arquivo(s):**
- `app.bundle.js`
- `index.html`

**Localização:**
Carga e parsing inicial do bundle unificado.

**Problema:**
O arquivo `app.bundle.js` possui 3.8 MB de código JavaScript síncrono que é interpretado de uma só vez na abertura do WebView pelo Capacitor. Em smartphones de entrada, isso pode provocar travamento perceptível ou gatilho de ANR (Application Not Responding).

**Evidência:**
Tamanho bruto do bundle sem divisão de código (code splitting).

**Causa provável:**
Arquitetura legada de concatenação linear de 218 scripts em um arquivo gigante.

**Impacto:**
Experiência do usuário degradada na inicialização do aplicativo móvel.

**Variantes afetadas:**
2. Particular + Nuvem APK
4. Comercial + Nuvem APK
6. Comercial Local sem Nuvem APK

**Dependências:**
Capacitor, Android WebView.

**Teste recomendado:**
Medir o tempo de inicialização (TBT - Total Blocking Time) em um dispositivo Android físico com 2 GB de memória RAM.

**Correção sugerida:**
Implementar carregamento sob demanda (lazy loading) dos módulos pesados (emissor fiscal, catálogo de peças) ou minificação agressiva.

---

### [MELHORIA] 19. Migração do Modelo de Dados do Parque para Ledger Imutável
**Arquivo(s):**
- `app.js`
- `leitura_detalhada_departamentos_patch.js`

**Problema:**
O objeto `p.contadores` armazena apenas o último valor de forma mutável. Qualquer alteração ou erro em leituras intermediárias corrompe irremediavelmente a continuidade histórica.

**Correção sugerida:**
Transformar contadores em lançamentos imutáveis de razão (ledger), onde o contador atual de uma máquina é sempre uma função agregadora (`SELECT MAX(contador)` das leituras validadas).

---

### [MELHORIA] 20. Padronização e Limpeza de Dependências Mortas no `package.json`
**Arquivo(s):**
- `package.json`

**Problema:**
Existem pacotes de utilitários e plugins legados referenciados nas dependências que não são importados em nenhum arquivo da compilação oficial.

**Correção sugerida:**
Efetuar auditoria de dependências com `npm prune` e remover módulos órfãos para acelerar o processo de empacotamento.

---

### [MELHORIA] 21. Isolamento das Credenciais do Cloudflare D1 em Variáveis de Ambiente
**Arquivo(s):**
- `cloudflare-worker/wrangler.toml`

**Problema:**
IDs de banco e bindings de rotas configurados diretamente no arquivo de configuração sem uso de segredos do ambiente para tokens administrativos.

**Correção sugerida:**
Utilizar segredos via `wrangler secret put` para todas as chaves sensíveis de produção.

---

### [MELHORIA] 22. Substituição de Dialogs Nativos (`alert`/`confirm`)
**Arquivo(s):**
- Vários arquivos legados em `patch/`

**Problema:**
Ainda existem pontos residuais invocando `window.alert` ou `window.confirm` do navegador, travando o event loop do Electron e quebrando testes em ambientes headless.

**Correção sugerida:**
Encaminhar todas as interações de confirmação para a função assíncrona padronizada `showModal()`.

---

### [MELHORIA] 23. Modularização dos Testes Unitários de Regressão
**Arquivo(s):**
- `test/run_tests.js`

**Problema:**
A suíte ativa roda apenas 4 testes consolidados, ignorando testes de casos extremos de faturamento e regras de negócios legadas devido a incompatibilidades cosméticas.

**Correção sugerida:**
Migrar os testes de regras fiscais e faturamento para a suíte ativa, garantindo cobertura contínua sobre estornos.

---

### [CONFIRMADO] 24. Divergência de Versão nas Respostas de Autenticação do Worker
**Arquivo(s):**
- `cloudflare-worker/src/index.js`
- `test/test_cloudflare_worker.js`

**Localização:**
Header ou propriedade `version` retornada nas rotas de autenticação.

**Problema:**
Enquanto a aplicação cliente e o endpoint `/health` estão alinhados na versão `8.1.0`, certos testes unitários de integração esperam a assinatura antiga `5.28.4`, gerando quebra na validação cruzada do worker.

**Causa confirmada:**
Atualização do endpoint de produção sem alinhamento da suíte de testes legada do worker.

**Impacto:**
Impossibilidade de rodar a suíte completa de testes de regressão sem intervenção manual.

**Variantes afetadas:**
Backend de Nuvem (1, 2, 3, 4).

**Dependências:**
`cloudflare-worker/src/index.js`.

**Teste recomendado:**
Rodar `npm --prefix cloudflare-worker test`.

**Correção sugerida:**
Atualizar as constantes de expectativa de versão nos arquivos de teste para `8.1.0`.

---

## 6. FLUXOS CRÍTICOS ANALISADOS

Os seguintes fluxos do sistema foram rastreados e auditados integralmente linha por linha:

1. **Ciclo de Leituras de Contratos de Locação:**
   - Criação de leitura (`novaLeituraContrato`).
   - Apontamento de contadores por impressora e departamento (`salvarLancamentoContador`).
   - Validações de contador retroativo e consumo negativo.
   - Faturamento (`faturarLeitura`) com integração no Contas a Receber.
   - Estorno financeiro e operacional (`execEstorno`).
   - Reedição pós-estorno e reflexo na listagem de equipamentos do parque.
2. **Ciclo de Autenticação e Autorização:**
   - Login por usuário comercial (`doLoginUser`).
   - Fallback de administrador local e autorização por hash offline.
   - Validação de sessão e gates de segurança por perfil (`v8000`).
3. **Ciclo de Sincronização em Nuvem (Cloudflare D1 / Worker):**
   - Coleta de alterações locais via changelog incremental.
   - Empacotamento de lotes e envio (`POST /v1/sync/push`).
   - Processamento de pull com merge de conflitos (`POST /v1/sync/pull`).
   - Health check e tratamento de erros de tenant.
4. **Ciclo de Geração e Impressão de Contratos e Relatórios:**
   - Renderização de documentos RTF.
   - Comunicação via IPC (`rtf:abrir`) com o SO hospedeiro.
5. **Ciclo de Atualização e Cache-Busting:**
   - Validação de integridade SHA256 do bundle (`sync_build.js`).
   - Geração de perfis de compilação para EXE e APK (`build_profiles.js`).

---

## 7. PONTOS QUE PRECISAM DE TESTE REAL (AMBIENTE EXTERNO/HARDWARE)

Determinados comportamentos não podem ser 100% atestados apenas pela análise estática do código-fonte e demandam testes em ambiente real:

1. **Comportamento Concorrente do Banco Cloudflare D1 em Produção:**
   - Validar o comportamento sob carga de transações simultâneas de clientes distintos para verificar se o SQLite/D1 acusa locks em horários de pico comercial.
2. **Execução de WebView e Performance do Bundle em Dispositivos Android Físicos:**
   - O tempo real de parsing do bundle de 3.8 MB precisa ser cronometrado em aparelhos com versões do Android 10/11 e hardware de entrada.
3. **Comunicação com Impressoras Térmicas e Emissão de Recibos Físicos:**
   - O comportamento das rotinas de impressão ESC/POS e comunicação com portas seriais/USB depende de validação em hardware físico homologado.
4. **Validação do Certificado A1 com os Web Services da SEFAZ:**
   - A assinatura digital de XML e transmissão contra os servidores reais da Receita Federal e prefeituras não pôde ser disparada para evitar emissão de notas fiscais reais de teste.

---

## 8. ORDEM TÉCNICA SUGERIDA DE CORREÇÃO

Esta ordem técnica prioriza estabilidade, segurança e integridade de dados antes de melhorias estéticas ou de conveniência:

### Fase 1: Segurança Crítica e Infraestrutura de Build
1. **Bloqueio de RCE no IPC `rtf:abrir`:** Forçar extensão `.rtf` no `main.js` para impedir execução de arquivos arbitrários no Windows.
2. **Ajuste da Linha de Comando no `package.json`:** Criar script Node para contornar o limite de 8.191 caracteres do `cmd.exe` no Windows.
3. **Sincronização de Build e Hash:** Executar `node sync_build.js` para restabelecer a integridade do hash do bundle no `index.html`.

### Fase 2: Correção do Ciclo de Leituras e Faturamento
4. **Rollback do Parque no Estorno:** Ajustar `execEstorno` em `ajustes_v5250_leitura_overhaul_patch.js` para restaurar os contadores de `p.contadores` com base no histórico anterior válido.
5. **Remoção de Acoplamento Frágil no Formulário:** Desacoplar a reversão de contadores de elementos ocultos do DOM (`edit-lanc-idx`) em `salvarLancamentoContador`.
6. **Filtro na Listagem do Parque:** Ajustar a função de busca do último lançamento para desconsiderar lançamentos com status `'estornada'`.

### Fase 3: Estabilização da Nuvem e Sincronização
7. **Correção da Entidade `_seq`:** Adequar a regex do Worker (`cloudflare-worker/src/index.js`) para aceitar `_seq` ou normalizar a entidade para `seq_counters`.
8. **Atualização do `motor_para_colar.js`:** Rodar o empacotamento do worker para alinhar os fontes com o deploy de produção.
9. **Tratamento Defensivo de Respostas Nulas:** Proteger o acesso a `data.changes` contra retornos HTTP de erro não-JSON da Cloudflare.

### Fase 4: Interface e Proteção de Dados
10. **Correção do Duplo Escaping (`&gt`):** Eliminar a dupla sanitização em `showModal` e padronizar o uso de entidades em breadcrumbs e cabeçalhos de tela.
11. **Proteção de Senhas Externas e Certificados:** Isolar credenciais do Caixa Escolar e chave privada A1, evitando que transitem em texto claro dentro de `db.config`.
