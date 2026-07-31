# RELATÓRIO COMPLETO DE PASSAGEM — DIGICOPY ERP (para o novo chat)

> **Para o agente do novo chat:** leia este documento INTEIRO antes de mexer em qualquer coisa.
> Ele contém o contexto do projeto, tudo o que já foi feito, o que o usuário quer fazer (na ordem),
> e as regras de comportamento que ele exige. O usuário (Kauan) vai colar este relatório no novo chat
> e dar continuidade **exatamente de onde parou**.
>
> **Para o Kauan:** depois que o novo chat ler e confirmar que entendeu tudo, este arquivo pode ser
> apagado do repositório (peça ao novo chat para removê-lo, se quiser).

---

## 1. O projeto e a empresa

- **Empresa:** DIGICOPY (Bocaiúva/MG, Brasil) — locação de impressoras, recarga de cartuchos,
  assistência técnica e vendas.
- **Produto:** **DIGICOPY ERP** — novo sistema da empresa, substituindo o sistema antigo
  (base Firebird num arquivo `.FDB`). Está em construção, em uso paralelo.
- **Forma de uso hoje:** roda no navegador (SPA estático, sem build). Testes pelo link raw.githack.
  **No futuro vira `.exe` (Electron)** — os arquivos `main.js`/`preload.js`/`package.json` já estão
  preparados para isso.
- **Computadores de destino:** **FRACOS**. Toda decisão de código deve priorizar leveza.

## 2. Acessos e credenciais

- **Login no sistema (2 etapas):**
  1. CNPJ da empresa: `08.385.589/0001-03` + senha do CNPJ: `digicopy8698`
  2. Usuário e senha (ex.: admin/admin, ou o usuário criado)
- **Repositório:** `kauangabrielcardososilva7890-afk/teste` (GitHub). O chat novo terá um **branch
  próprio de sessão** criado a partir da `main` — trabalhar SÓ nele, nunca na `main` direto,
  comentando as versões no PR da sessão.
- **Firebase (nuvem):** projeto `digicopy-sistema-nuvem`, região southamerica-east1, plano Standard.
  Config real em `firebase_config.js`. Console:
  `https://console.firebase.google.com/project/digicopy-sistema-nuvem`
- **Link de teste (navegador):**
  `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/main/index.html` (ou o branch da sessão)
  ⚠️ **O githack usa CDN com cache agressivo.** Após cada versão nova, teste com um parâmetro novo
  na URL (ex.: `?v=X.Y.Z&z=123`) e **confira o número da versão no canto superior esquerdo da barra
  azul** para ter certeza de que está na versão certa (Ctrl+Shift+R sozinho NÃO furta o cache do CDN).

## 3. Arquitetura técnica (essencial para não quebrar nada)

- **SPA sem build:** `index.html` carrega CDNs (tailwindcss, phosphor-icons, chart.js) e os JS locais
  em ordem empilhada. **Patches foguete: o último `window.X` definido vence.**
- **Ordem de carga dos scripts** (todas com `?v=VERSAO` no index.html):
  `lz.js`, `logo_data.js`, `app.js` (núcleo, ~275KB), `vendas_patch.js`, `evolucao_patch.js`,
  `notinha_patch.js`, `locacao_patch.js`, `sync_client.js`, `vendas_os_patch.js`,
  `performance_patch.js`, `pix_patch.js`, `notificacoes_patch.js`, `vendas_extra_patch.js`,
  `migrados_print_patch.js`, `clientes_patch.js`, `interface_patch.js`, `firebase_config.js`,
  `firebase_client.js`.
- **REGRA DO USUÁRIO (obrigatória):** toda funcionalidade nova vai em **arquivo patch NOVO e separado**
  (nunca engordar arquivo existente), adicionado no fim da ordem de carga. Usuário: *"tudo o que você
  for criar de novo, não deixe somente em um arquivo de programação, separa pra não ficar tão grande."*
- **Persistência local:** `localStorage` incremental fatiado — manifest (`digicopy_erp_v30_manifest`)
  + 1 chave por pedaço de entidade (`digicopy_erp_v30_part__*`), com hash por pedaço (pula o que não
  mudou) e time-slice de 25ms (`__saveTick`). `performance_patch.js` faz write-behind de 900ms
  (`window.saveDB` agendada; `saveDBAgora` para fluxos urgentes).
- **Nuvem (Firebase):** `firebase_client.js` = shim Firestore REST; documentos fatiados em 600 mil
  chars; auth **anônima** automática; `testarFirebase/testarNuvem` no console.
  `sync_client.js` define as entidades sincronizadas (empresas, usuarios, clientes, produtos,
  equipamentos, contratos, parque, leituras, os, vendas, contasReceber, contasPagar, logs(1500),
  notificacoes(200), modulosDinamicos, tecnicos, config). Sincronização automática idle (timer 75s,
  nunca atrapalha uso). Manuais: `window.syncEnviarParaNuvem({confirmar:true})` /
  `window.syncCarregarDaNuvem({confirmar:true})`.
- **Testes (rodar SEMPRE antes de commitar):**
  - `npm run check` → `node --check` de todos os JS (sintaxe)
  - `npm test` → 8 arquivos `test_*.js`, **199 testes devem passar**
  - Padrão de teste: seções `/* X_PURE_START */ ... /* X_PURE_END */` com funções puras nos patches,
    extraídas via regex + `eval` nos testes. Função pura nova = teste novo.
- **Versionamento (bumpar os 3 juntos sempre):** `APP_VERSION` em `app.js`, `"version"` em
  `package.json`, e todos os `?v=X.Y.Z` no `index.html`. Versão atual: **4.9.4**.
- **Códigos sequenciais monotônicos (REGRA FIXA DO USUÁRIO):** códigos de cliente/venda/OS **nunca
  são reutilizados**, nem excluindo o último (excluir o 57 não devolve o 57). Implementado via
  `window.seqObter(tipo, itens, empresaId, extrator)` (interface_patch.js) guardando contador em
  `db.config.seq` (sincroniza na nuvem). Novos cadastros DEVEM usar isso.
  **Códigos de venda/OS são SÓ O NÚMERO** (sem prefixo `VD-`/ano), via `window.proximoNumeroSimples`
  (vendas_os_patch.js). Registros antigos continuam exibindo com prefixo limpo na tela.

## 4. Estado atual — o que JÁ FUNCIONA (v4.9.4, merge feito na main)

- **Login 2 etapas** + usuários/permissões + auditoria de ações.
- **Clientes:** cadastro completo — obrigatórios (nome, telefone, rua, número, bairro) com borda
  vermelha; CNPJ automático (BrasilAPI); **CEP automático** (ViaCEP, botão + onblur); aba
  "Dados para Nota Fiscal" pronta para edição (rgIE, indIE, consumidorFinal, governamental);
  consulta com filtro auxiliar por 16 campos (acento-insensível, dígitos p/ doc/tel/cep), ordenação
  clicável nos títulos, render em lotes de 200, busca SÓ no Enter/lupa.
- **Vendas/Notinhas:** nova venda completa (abas Itens e OS), código automático **só número**,
  orçamento, faturamento (à vista conclui; a prazo gera parcelas + carnê, **sem boleto**), formas:
  Dinheiro, Prazo, Cartão crédito/débito, Cheque, Conta, Pix, Grátis. **Refazer faturamento**
  (desfaz títulos em aberto). **Regra de impressão fixa:** OS só sai na notinha folha inteira se
  tiver Modelo + Nº série + (Patrimônio OU Contador); senão meia folha.
- **Pix estático (BCB):** configuração da chave em Configurações (com detector de tipo), QR no
  faturamento e na notinha, copia-e-cola (EMV+CRC16 validados contra o vetor oficial do Bacen),
  `pix_pagar.html` (página pública do link). **Pix dinâmico NÃO foi feito** — ver seção de futuro.
- **Notificações (sino na barra azul):** estoque no mínimo, contas a receber vencidas/a vencer,
  eventos ("Fulano pagou R$ X"); painel com marcar lida/apagar; cache de 15s anti-travamento.
- **Notinhas antigas (legado):** tabela de vendas mostra as antigas junto; histórico abre qualquer
  uma (aviso "sistema antigo"); impressão de registros migrados; menu Atendimento tem
  "Notinhas antigas".
- **Migrados (telas roxas):** tabelas do sistema antigo importadas viram menus dinâmicos
  (Explorar Migrados) + impressão com logo. **Serão removidas gradualmente** (ver plano).
- **Interface:** barra azul fina (versão à esquerda, tela ao centro, data + sino à direita), menu
  superior com módulos: **Início, Atendimento, Locação, NF-e/NFC-e, Cadastros, Financeiro,
  Configurações, Sair**. "Outsourcing" foi renomeado para **Locação** a pedido do usuário.
  Esc fecha qualquer modal/painel. Sem rótulos de atalho de teclado na UI. Nuvem silenciosa
  (avisos repetitivos suprimidos; erros aparecem).
- **Anti-travamento já aplicado:** não recria gráficos Chart.js escondidos; caches (notificações 15s,
  cliente id→objeto, legados por contagem de linhas); ordenação de vendas/financeiro com chave
  pré-calculada; limites de render (vendas 300, clientes 200, financeiro 200, produtos 300);
  saveDB write-behind + fatiado; debounce/índices na nova venda.
- **Cadastro de clientes/vendas com sequencial monotônico** (nunca reutiliza código), inclusive
  venda **e** OS só com número puro.
- **Nuvem (Firebase):** enviar/baixar dados funcionando via REST com fatiamento; auth anônima;
  config `pix` e `seq` sincronizam junto.

## 5. PRÓXIMOS PASSOS — NA ORDEM, COMEÇANDO DE ONDE O USUÁRIO PAROU

**O usuário vai dizer no novo chat quando cada etapa dele estiver feita. Siga a ordem:**

### Passo 1 — Importação dos dados antigos + remover os 2 botões da nuvem
1. **O usuário AINDA NÃO importou.** Ele vai exportar as tabelas do DBeaver e importar no sistema
   (menu Configurações → Importar arquivos → selecionar todos os `.json` → "Importar + Nuvem").
   Depois ele dirá no chat **"importei"**.
   - Lembrete DBeaver: botão direito nas tabelas → Export Data → JSON → **File name pattern
     `${table}`** (cada arquivo sai com o nome da tabela, ex.: `CLIENTES.json`; sem espaço/acento).
     O nome do arquivo vira o nome da tabela no sistema (`fbMapNomeTabela`).
   - Tabelas conhecidas são mapeadas para os módulos do ERP; o resto vira menu roxo (temporário).
   - Volumes esperados: **~2,6 mil clientes e ~16 mil vendas** — importação demora alguns minutos.
2. **Quando o usuário confirmar que importou e enviou para a nuvem:**
   - Conferir contagens com ele (clientes/vendas) e que a nuvem subiu ("Enviar dados p/ nuvem"
     ou o botão "Importar + Nuvem" da tela de importação).
   - **REMOVER os dois botões do menu Configurações: "Enviar dados p/ nuvem" e
     "Baixar dados da nuvem"** (NÃO remover as funções `window.syncEnviarParaNuvem` /
     `syncCarregarDaNuvem` — só ocultar os botões; a sincronização automática em segundo plano
     deve continuar funcionando).
   - ⚠️ Pré-requisito para a nuvem funcionar de verdade (pendências DO USUÁRIO no console
     Firebase): ativar provedor **Anônimo** em Authentication + colar as regras definitivas
     (`allow read, write: if request.auth != null;` — o sistema tem botão "Copiar regras Firebase"
     na tela de Configurações/banco). Cobrar isso dele com jeito se ainda não estiver feito.
     (Modo teste do Firestore expira ~29/08/2026.)

### Passo 2 — Separar/dividir o código para PCs FRACOS (sem quebrar nada)
**Objetivo do usuário:** *"separa os codigos para dar o minimo de travamento e gargalo possivel"*.
Regras de segurança: **um passo por vez; `npm run check` + `npm test` (199) verdes a cada passo;
bump de versão; se algo falhar, reverter o passo.** Sugestões concretas (avaliar e executar com
carinho, nesta ordem de segurança):
1. **Gate de render para telas escondidas:** `navigateTo` **já re-renderiza** cada tela ao entrar
   (linha dos `if(view==='x') renderX()` em app.js), então é seguro fazer `renderFinanceiro`,
   `renderProdutos`, `renderAuditoria`, `renderClientes`, `renderContratos`, `renderEquipamentos`
   etc. **não fazerem nada quando a própria `<section>` estiver `.hidden`**. Hoje, salvar uma venda
   re-renderiza 4 telas escondidas por precaução — é o maior desperdício restante. Criar um patch
   novo (ex.: `render_gate_patch.js`, fim da ordem) que embrulha essas funções.
2. **Revisar `renderFinanceiro`**: ainda faz filtros/reduces de KPIs e listinhas mesmo com tela
   escondida (cobre com o gate acima).
3. **Dividir o `app.js` (275KB)** aos poucos em módulos menores (ex.: `financeiro.js`,
   `cadastros.js`, `ui.js`) mantendo a ordem de carga e os testes verdes. Só mover código, sem
   mudar comportamento, um recorte por versão.
4. Avaliar o custo do `saveDB` (serializa entidades inteiras para hash). Se atacar, fazer com
   MUITO cuidado e teste duplo (risco de perda de dados = proibido). Alternativa menor: marcar
   entidades sujas via `logAction` + varredura completa periódica/no fechamento.
5. **Preparar o `.exe` (Electron):** `main.js`, `preload.js` e `package.json` (com `files`)
   já existem. Quando o usuário pedir, validar `npm start` local e depois o empacotamento
   (electron-builder, se já estiver nas devDependencies/config — conferir `package.json`).
   No Windows do usuário, usar `npm.cmd` (o `npm` puro é bloqueado no PowerShell dele).

### Passo 3 — Montar os menus novos com os prints e remover os roxos gradualmente
- Menus principais confirmados pelo usuário: **Início, Locação, NF-e/NFC-e, Cadastro, Financeiro**.
- Ele vai mandar **prints das telas do sistema antigo aos poucos**, com texto de apoio. Para cada
  menu configurado, **remover os submenus/telas roxas (migradas) correspondentes**.
- **No final, o "Explorar Migrados" some TOTALMENTE** (frase dele: *"praq vai ter esse menu ainda?"*).

### Passo 4 — Notinhas antigas com OS
- Algumas vendas antigas têm OS mas o sistema não identifica (imprimem meia folha). Vai depender de:
  o usuário mandar **print de uma notinha antiga que tem OS** + o **nome da tabela roxa das notinhas**
  (ex.: NOTA/NOTINHAS). Aí adaptar a detecção (→ folha inteira) e o histórico delas. Ele já confirmou
  os volumes (~2,6k clientes / ~16k vendas).

### Futuro distante (quando o usuário pedir; NA ORDEM DELE)
- **Pix dinâmico (baixa automática):** banco escolhido = **Banco Inter**; fazer **junto com a NF**
  (decisão do usuário). Pesquisado: QR estático grátis; Pix cobrança ≈ 0,9% (mín R$0,10, máx R$1,50)
  imediato / 0,99% (máx R$1,99) com vencimento; ⚠️ **conta PJ MEI do Inter NÃO tem API** — precisa
  conta PJ empresarial. Implementação: criar aplicação no portal do desenvolvedor do Inter
  (OAuth2 + certificado mTLS); webhook cai em `window.notificarEvento('pix', ...)` + baixa do título.
- **Módulo NF-e/NFC-e:** menu existe como placeholder; aba NF do cliente já preparada (v4.8).
- **Conflito multi-PC por registro:** hoje a publicação é de estado inteiro; fix definitivo =
  tabelas por registro (futuro).
- **Build `.exe`** (ver Passo 2 item 5).

## 6. Regras de ouro do usuário (NUNCA violar)

1. **Responder sempre em português (PT-BR), simples e direto** — o usuário NÃO é técnico.
2. **Nunca** escrever "inspirado no SisPrinter", "não é cópia", "layout inspirado" — em código,
   comentários, markdown ou interface.
3. **Não recriar arquivos .md de documentação** (o usuário mandou remover todos; este relatório é
   a exceção pedida por ele — pode ser apagado depois).
4. **Funcionalidade nova = arquivo patch novo separado** (não engordar arquivos existentes).
5. **Sem rótulos de atalho de teclado** na interface (F1/F2/F3 foram removidos). **Esc fecha**
   modal/painéis em qualquer tela (já implementado — manter).
6. **Sem busca "enquanto digita"** — pesquisa só no Enter ou na lupa (o usuário odeia lista
   mudando ao digitar).
7. **Códigos nunca reutilizados** (cliente/venda) — sequencial monotônico já implementado; manter
   `seqObter`/`proximoNumeroSimples` em todo cadastro novo.
8. **Código da venda/OS = só o número** (sem prefixo/ano) em tudo que for novo.
9. **Faturamento sem boleto**, formas fixas já listadas acima.
10. **Regra da impressão:** OS completa (modelo+série+(patrimônio OU contador)) = folha inteira;
    senão meia folha.
11. **O arquivo `.FDB` nunca vai para a nuvem** — os dados são importados como documentos Firestore.
12. **Credenciais:** nunca pedir senhas/tokens ao usuário; GitHub já está autenticado no sandbox.

## 7. Proteções anti-quebra (processo obrigatório a cada mudança)

1. `npm run check` e `npm test` (**199 testes**) verdes ANTES de commitar. Teste novo para função
   pura nova.
2. Bump de versão nos **3 lugares** (`APP_VERSION` app.js, `package.json`, `?v=` index.html).
3. Commit + push **somente no branch da sessão** + comentário da versão no PR da sessão.
4. Se o git local parecer resetado (HEAD antigo com arquivos novos na árvore):
   `git fetch origin <branch>:refs/remotes/origin/<branch>` → `git reset --soft origin/<branch>`
   → `git reset` (mixed) → conferir `git status` limpo/diff real → recomitar só o diff.
   **Nunca force-push.**
5. Nada de artefatos grandes no git (`dist/`, `node_modules/` já ignorados).
6. Mudanças de risco (dados/permissão de escrita): fazer de tarde/noite com o usuário avisado,
   um passo por versão.

## 8. Referência rápida — mapa de arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | shell: barra azul, topnav, sidebar, views, ordem dos scripts (`?v=`) |
| `app.js` | núcleo: sessão, persistência fatiada, renders base, financeiro, modais |
| `vendas_os_patch.js` | tela de vendas completa, OS, faturamento, carnê, `proximoNumeroSimples` |
| `clientes_patch.js` | formulário/consulta de clientes (completo) + CEP/CNPJ + aba NF |
| `interface_patch.js` | Esc global, nuvem quieta, clientes neo, `seqObter`, altura da home |
| `notinha_patch.js` | impressão da notinha, migrados render, `clienteDaVenda` (índice) |
| `pix_patch.js` / `pix_pagar.html` | Pix estático BCB + página pública do QR |
| `notificacoes_patch.js` | sino + varreduras (estoque/financeiro) com cache |
| `vendas_extra_patch.js` | refazer faturamento, histórico legado, número curto |
| `migrados_print_patch.js` | impressão de registros migrados, notinhas antigas |
| `performance_patch.js` | saveDB write-behind, índices/debounce nova venda |
| `locacao_patch.js` | locação (ex-outsourcing), limpeza de seeds demo |
| `sync_client.js` | entidades da nuvem, sync automático idle, enviar/baixar |
| `firebase_config.js` / `firebase_client.js` | config + shim REST Firestore |
| `logo_data.js` | logo em data URI (notinhas/impressões) |
| `main.js` / `preload.js` / `package.json` | Electron (futuro `.exe`) + scripts `test`/`check` |
| `test_*.js` (8 arquivos) | 199 testes (seções `*_PURE`) |

---

**Fim do relatório.** Novo chat: confirme ao usuário que leu tudo, recapitule o próximo passo
(Passo 1: ele vai importar e dizer "importei"; então remover os 2 botões da nuvem sem apagar as
funções) e siga a ordem sem pular etapas. Boa construção! 🚀
