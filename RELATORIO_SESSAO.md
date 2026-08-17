# Relatório da sessão DIGICOPY — continuar em outro chat

**Data:** 2026-08-16  
**Repo:** `kauangabrielcardososilva7890-afk/teste`  
**Branch fixa da sessão:** `arena/01a00cfb-teste` (continuação do PR #21 em uma nova sessão)  
**PR:** https://github.com/kauangabrielcardososilva7890-afk/teste/pull/22  
**Última versão:** **v5.21.4**  
**Commit:** `f3fe11c`  
**Zip:** gerar no PC do usuário com `npm run build:win`  
**GitHack:** `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/f3fe11c4ae41f52b1c80876e02bdecc322c2015c/index.html?v=5.21.4`  

---

## v5.21.4 — 1919 clientes existiam e não apareciam na tela

Causa: o painel Nuvem conta `db.clientes.length`. A tela de Clientes filtrava `empresaId === sessão`. Cadastro antigo sem empresa, ou restaurado do IndexedDB depois do `seedData`, ficava invisível.

- `seedData` agora preenche empresa também quando o campo está vazio.
- Depois do IndexedDB restaurar a base, o `seedData` roda de novo.
- A lista de clientes aceita cadastro sem `empresaId` e religa na empresa única.
- Continua: lista só aparece ao pesquisar ou clicar **Todos**.  

---

## v5.21.3 — zerar nuvem e publicar este PC (evitar duplicar)

Pedido: os dados deste PC devem ficar; o que está na nuvem pode ser apagado; depois publicar só este PC.

- Recolocado o botão **Zerar dados da nuvem** só para Admin.
- Dois avisos antes de apagar. A API continua exigindo aparelho admin único e a frase interna `APAGAR NUVEM`.
- Depois do reset a sincronização fica **pausada**. Nada sobe sozinho.
- O próximo passo é **Publicar este PC na nuvem**.
- Os dados deste computador não são apagados. Outros aparelhos precisam estar bloqueados antes do reset.

Passo a passo operacional:

1. Backup neste PC (botão Backup, só Admin).
2. Não abrir os outros PCs / celular.
3. Nuvem → Ver aparelhos → Bloquear todos, menos este.
4. Zerar dados da nuvem.
5. Conferir: Clientes na nuvem = 0 e texto PAUSADA.
6. Publicar este PC na nuvem.
7. Esperar Clientes neste PC = Clientes na nuvem e Pendentes = 0.
8. Só então gerar código para autorizar os outros aparelhos.

Não voltar para outras branches. Não reabrir etiquetas nem vendas (salvo pedido explícito).

---

## Como o usuário trabalha

- Português, direto. **Perguntar antes** se houver dúvida.
- Cada atualização: link GitHack `?v=...`, PR, commit, resumo objetivo + **atualizar este `.md`**.
- Remover = deletar de verdade. Avisos: `lfbAlert` / `confirmSistema`. `window.confirm` nativo quebrado.
- Chamados: o que pedir vale **nos dois** (contrato e submenu), salvo se disser que é só de um.

---

## Aceito

- Vendas/Notinhas v5.15.2; 1 impressora; 2.2 finalizar lista; 2.3 filtros; 3 impressoras; 4.3–4.6; 5 Todos; 6 busca impressora contrato; 7 sort; ESC sem loop.

---

## v5.21.2 — autorização possível antes de esconder Nuvem
- Regra corrigida: PC sem token mostra **Nuvem** para qualquer perfil, permitindo colar código. Após autorização, Nuvem some para não-Admin; Backup é sempre só Admin.
- Acesso direto pós-autorização também é negado para não-Admin. Token revogado é removido pelo sync e o botão reaparece para nova autorização.
- Runtime DOM validou três estados: Kauan vê ambos; Denivaldo antes de autorizar vê Nuvem mas não Backup; Denivaldo após token não vê nenhum.

## v5.21.1 — acabamento de permissões e operação
- Botões **Nuvem** e **Backup** aparecem somente para perfil de sistema `Admin`; `Dono`/Funcionário não veem. A chamada direta e `exportBackup()` também validam perfil.
- Sync incremental continua silencioso para todos os perfis/aparelhos autorizados.
- Interface da nuvem ficou só com operação normal: publicar/sincronizar, autorizar, listar/bloquear aparelhos, listar/restaurar excluídos. Botões temporários de limpar testes, dedupe, revisão e reset saíram da UI.
- `Ver aparelhos e dados enviados` mostra por PC: perfil, bloqueio, registros atuais cuja última atualização veio dele, total de alterações e último acesso.
- Runtime DOM confirmou: Kauan vê Nuvem/Backup; Denivaldo não vê; login, 14 views e painel sem erro.
- API 0.4.1 inclui contagens por aparelho. Suíte final: **52 passaram, 1 falha aceita, 0 novas**.

## v5.21.0 — auditoria consolidada e otimização estrutural
- **Bundle único:** 101 scripts separados foram auditados; quatro runtimes legados (Firebase config/transporte, sync antigo e force-sync) saíram da execução. Os 97 scripts ativos agora são gerados em `app.bundle.js` por manifesto ordenado e hash. `npm run check` falha se o bundle estiver desatualizado.
- **Electron enxuto:** `build.files` caiu da lista manual de ~100 entradas para 8 padrões: HTML, bundle, main/preload, logos/ícone e vendor. Evita `.exe` incompleto quando um patch novo não entra na lista.
- **IndexedDB v2 incremental:** cria stores `entities`/`meta`, migra snapshot v1 automaticamente, usa hashes do manifesto e grava somente entidades alteradas. Teste runtime com fake IndexedDB confirmou migração e apenas 1 entidade escrita após editar vendas.
- **Runtime DOM:** bundle carregado por HTTP em DOM completo, login Kauan executado, 14 views navegadas e painel Nuvem aberto; zero erros de runtime (limitações esperadas do simulador ignoradas). Foi endurecido fallback `innerText/textContent` encontrado pelo teste.
- **Suíte consolidada:** novo runner não para na falha aceita de etiquetas. Resultado: **51 suítes passaram, 1 falha aceita, 0 falhas novas**. Testes novos cobrem bundle, offline, confirmações, Cloudflare, IndexedDB e segurança Electron.
- **Segurança Electron:** sandbox/webSecurity ligados na principal e popups, conteúdo inseguro bloqueado, navegação HTTP externa negada e `window.open` com preload restrito a impressão local.
- **Limpeza runtime:** Firebase/sync legado não entram mais no bundle; Cloudflare segue como único motor.
- **Limitação do ambiente:** instalação do Electron/geração do instalador Windows não rodou porque o download do binário falhou por certificado/reset TLS. Não é erro de código; build real precisa ser executado em ambiente com download liberado.

## v5.20.42 — reset da nuvem realmente manual
- “Zerar dados da nuvem” cria snapshot, apaga negócio/histórico/tombstones e deixa `paused:true`. Nenhum save/foco/timer republica.
- “Publicar este PC na nuvem” é ação separada, com confirmação. Teste real local confirmou: nuvem 0 após reset e só voltou a ter registros após publicação explícita.

## v5.20.40 — interface offline + confirmações legadas funcionais
- v5.20.38: recuperação de admin marcada por tipo; admin recuperado também cria snapshot, baixa nuvem primeiro e não publica histórico velho. Teste PC C admin passou.
- v5.20.39: Tailwind, Phosphor Icons (woff2/CSS) e Chart.js empacotados em `assets/vendor`; Google Fonts removida; notinha sem `@import` externo; assets incluídos no Electron. Interface não depende mais de CDNs no `.exe`.
- v5.20.40: `popup_sistema_patch` não força mais `confirm()` a `false`. Wrappers confirmados liberam exatamente uma chamada síncrona interna; bypass expira no mesmo ciclo. Fluxos legados não migrados usam diálogo nativo como fallback em vez de cancelar silenciosamente.
- Testes `test_offline_assets.js` e `test_confirm_compat.js` + sintaxe completa: OK.

## v5.20.37 — limpeza de origem concluída, 1.919 clientes íntegros
- Produção: 50 duplicados seguros unidos; sete clientes realmente extras removidos pela origem histórica em aparelhos bloqueados; dois cadastros de origem bloqueada foram preservados porque substituíram originais na deduplicação.
- A revisão passou a usar o primeiro evento imutável do registro, não `updated_by`; remoção revalida origem e bloqueia cadastros que tenham original unido/excluído.
- Estado final confirmado: **1.919 clientes no PC = 1.919 na nuvem, pendentes 0, registros ativos 1.934, aparelhos ativos 1**.
- Excluídos 66 são tombstones recuperáveis de todas as entidades. O aumento de 57→66 incluiu sete ativos removidos e duas ordens para IDs já ausentes; ativos caíram exatamente sete (1.941→1.934), sem perda adicional.
- Teste D1 cobre registro criado em aparelho bloqueado, posteriormente atualizado pelo admin, classificação de versão substituta, bloqueio e limpeza seletiva.

## v5.20.34 — impedir histórico velho + reparar 57 clientes duplicados
- Produção confirmou falha: segundo navegador tinha 57 clientes locais antigos com IDs diferentes; nuvem passou de 1.919 para 1.976 clientes. Não era retry duplicado, eram IDs distintos.
- Primeiro sync de aparelho não-admin agora cria snapshot IndexedDB, baixa a nuvem e remove/quarentena registros locais anteriores ausentes da nuvem; teste real confirmou que cliente velho do PC B não foi publicado.
- Admin ganhou **Analisar clientes repetidos**: agrupa por código normalizado ou CPF/CNPJ, mantém cadastro mais referenciado/completo, preenche campos vazios, troca `clienteId`/`idCliente` em históricos, cria snapshot e exclui extras de forma recuperável.
- Usuário deve executar no PC admin; resultado esperado: remover 57 extras e voltar a 1.919 clientes ativos em PC/nuvem.

## v5.20.33 — administração de aparelhos e excluídos
- Admin lista aparelhos autorizados, perfil e bloqueio; não pode bloquear o próprio aparelho. Bloquear revoga token sem apagar negócio.
- Admin lista até 100 registros excluídos com entidade/nome e restaura individualmente; restauração entra no log incremental e chega aos demais PCs.
- API testada: dois aparelhos, listagem, bloqueio do segundo e token revogado recebendo 401; dados preservados.

## v5.20.32 — contagem confiável durante envio inicial
- Painel agora separa **Clientes neste PC**, **Clientes na nuvem**, total de registros e **Pendentes neste PC**; o antigo “Fila 100” era só o limite do lote, não o restante total.
- API `/v1/status` retorna contagem ativa/excluída agrupada por entidade.
- Lote por requisição reduzido de 25 para 10 para manter margem segura de subrequisições no Worker gratuito.
- Usuário informou 1.919 clientes; a captura com 412 registros não representava conclusão. Não importar nada até as duas contagens de clientes coincidirem e pendentes chegar a zero.

## v5.20.31 — armazenamento ampliado + limpeza segura dos testes
- Confirmado em uso: `localStorage` lotou. Novo `indexeddb_persistence_patch.js` mantém snapshot completo em IndexedDB, restaura antes do sync e espelha `saveDB`/`saveDBAgora`.
- Aviso de espaço antigo só aparece se o IndexedDB também não iniciar; o sync aguarda `DIGICOPY_DB_READY` para nunca publicar base parcial durante restauração.
- Botão **Backup** agora visível na barra superior (antes estava preso na sidebar oculta).
- Painel Nuvem desconectado oferece **Limpar dados de teste deste navegador** com dois avisos; remove apenas chaves DIGICOPY e IndexedDB local, não JSON baixado nem D1.
- Usuário confirmou que só o JSON externo dos clientes precisa ser preservado; produtos/demais dados atuais são testes.

## v5.20.30 — sincronização Cloudflare local-first funcionando
- Novo `cloudflare_data_sync_patch.js`: baixa primeiro, envia só alterações, cursor incremental, fila local durável, idempotência, versão por registro, conflito preservado e backoff.
- Sincroniza empresa, usuários, clientes, produtos, equipamentos, contratos, parque, leituras, chamados, vendas, financeiro, logs, técnicos, notificações, configuração e módulos dinâmicos.
- Em repouso autorizado: uma consulta por minuto somente com a aba visível; 5 PCs ≈ 7.200 solicitações/dia, abaixo das 100 mil/dia do Worker. Sem `setInterval`; foco/save agenda atualização e falhas aumentam o intervalo até 5 min.
- Nuvem vazia/ausência de registro nunca apaga o PC. Exclusão só nasce de registro previamente conhecido; exclusão inesperada de >=10 e >30% da entidade é bloqueada até confirmação no painel.
- Servidor mantém o conteúdo excluído; admin lista e restaura. API grava registro + evento em lote atômico.
- Teste real local com Worker+D1: PC A publicou cliente; PC B vazio baixou; edição B→A; exclusão A→B; conteúdo preservado; restauração voltou no B — tudo OK.
- Painel Nuvem mostra fila, registros, excluídos, sincronização manual e aprovação de exclusão em massa.

## v5.20.29 — aviso Firebase antigo eliminado
- Corrigido o popup `Não foi possível carregar a nuvem / Quota exceeded`: era a rotina antiga `autoCarregarNuvemSeVazio`, que ainda chamava o carregamento Firebase 4,5s após abrir.
- O patch Cloudflare agora marca a carga antiga como concluída e neutraliza todas as funções automáticas/manuais do sync legado.
- Teste de regressão confirma que Firebase automático, diagnóstico antigo e gatilho de carga não estão ativos.

## v5.20.28 — Cloudflare D1 pronta + autorização de aparelhos
- Worker `digicopy-sync-api` implantado pelo GitHub e D1 `digicopy-erp` vinculado; `/health` confirma API 0.2.0, esquema 2, segredo configurado e `ready:true`.
- API incremental versionada: aparelhos com token individual em hash, primeiro admin, convite de uso único, segundo admin, recuperação sem apagar negócio, lote idempotente, cursor e bloqueio de conflito por versão.
- Migrações D1 automáticas antes de cada deploy; testes locais completos com dois aparelhos simulados passaram.
- Novo `cloudflare_sync_patch.js`: botão **Nuvem** visível, ativação principal, ingresso por código, recuperação e geração de convite. O segredo nunca é salvo localmente.
- Firebase automático e diagnóstico antigo saíram do carregamento. A sincronização de dados Cloudflare ainda será habilitada na próxima etapa; **não importar clientes ainda**.
- Teste Playwright real foi preparado em `e2e/`; download local do Chromium foi bloqueado por reset TLS do sandbox. Workflow GitHub não pôde ser enviado porque o token do GitHub App não possui permissão `workflows`; testes estáticos e sintaxe passaram.

## v5.20.27 — consumo oculto de cota encontrado e removido
- Auditoria encontrou um segundo sincronizador automático legado em `sync_client.js`, ainda consultando `app_state` a cada **75 segundos**, embora o relatório anterior o considerasse inerte.
- Em 5 aparelhos, só esse timer podia fazer cerca de **5.760 consultas por dia**, concorrendo com o `sync_realtime_patch.js`. O patch `limpar_nuvem_patch.js` ainda forçava esse legado a permanecer ligado.
- O automático legado e seus disparadores foram desativados. As funções manuais antigas ficam apenas por compatibilidade; o único motor automático agora é o incremental `sync_realtime_patch.js` (`erp_rt`), sem `setInterval`.
- Novo `test_sync_quota_guard.js` impede a volta do timer, do force-enable e de polling no motor incremental.
- `npm run check` e teste de proteção de cota: OK.

## v5.20.26 — botão Teste nuvem realmente visível
- **Causa encontrada:** o botão da v5.20.25 foi colocado dentro de `#sidebar`, mas o próprio layout atual esconde permanentemente `#sidebar` com `display:none!important`. Por isso o HTML/teste dizia que ele existia, porém o usuário não conseguia vê-lo.
- O botão **Teste nuvem** foi movido para a **barra superior realmente usada pelo sistema**, imediatamente antes de **Sair**.
- O teste automatizado agora verifica que o botão está dentro de `.modern-topnav` e que não ficou preso na sidebar oculta.
- Cache do script atualizado para `v5.20.26`; lógica de diagnóstico e motor de sync preservados.
- Testes: `node test_ajustes_v52025.js` e `npm run check` OK. A única falha da suíte completa continua sendo a falha antiga aceita de etiquetas.

## v5.20.25 — "Teste da nuvem" de volta (sync parou em silêncio)
- Sintoma do usuário: "não está sincronizando" após a v5.20.24. Verificado: `sync_realtime_patch.js`/`firebase_*` **intocados** desde a versão que funcionava (diff vazio) — o motor é o mesmo; falha é ambiental e agora invisível (o diagnóstico automático foi removido na v5.20.15).
- **Recolocado o Teste da nuvem sob demanda:** botão **"☁ teste nuvem"** no rodapé do cartão do usuário (barra lateral, ao lado do relógio). Passos: **1** config Firebase → **2** login anônimo → **3** gravar → **4** ler → **5** "este aparelho já sincronizou alguma vez" + contagens locais + último backup. Mostra o **ERRO EXATO** (HTTP/código/mensagem) e a instrução: `traduzirErroSync` (403/PERMISSION_DENIED → republicar regras `match /{document=**}` com auth; 429/RESOURCE_EXHAUSTED → cota grátis estourada, reseta ~4h; 401/UNAUTHENTICATED → login anônimo desligado; Failed to fetch → sem internet/bloqueio).
- Só gasta cota quando CLICADO (não roda sozinho). O doc de teste `__diag_ping` é apagado da nuvem logo depois e qualquer resto local (`db.diagnostico`) é removido na carga e após o teste (não polui backup).
- **Pendência pro usuário:** clicar no ☁ no aparelho que não sincroniza e mandar o texto — provável COTA (50k leituras + 20k escritas/dia grátis; cada aparelho novo baixa a base toda 1x; reseta ~4h).

## v5.20.24 — Filtro "pagar" apagado, Excluir sempre visível, backup diário automático e seedData que nunca apaga usuário seu

Respostas às 4 perguntas feitas e confirmadas pelo usuário nesta sessão:

### 1. Financeiro: filtro de tipo APAGADO
- O filtro **"Receber + Pagar / Só a receber / Só a pagar"** (`neo-fin-tipo`) era o "pagar junto com o filtro" citado desde o item 2 — agora removido da tela (o Financeiro lista tudo junto, sem o seletor). O botão "Pagar" do cabeçalho (removido na v5.20.23) continua fora.

### 2. Backup: excluído o botão ANTIGO das Configurações
- Removidos do `notinha_patch.js` (renderConfig ativo): o botão "Exportar backup" do cabeçalho e o card "Backup". **Fica só o botão ⬇ da barra lateral** (ao lado do Sair), que funciona em qualquer tela.

### 3. Botões de Excluir SEMPRE visíveis no topo
- Causa de "não apareceu": na v5.20.23 os botões só surgiam **depois** de marcar a caixinha. Agora seguem o padrão já aceito (Produtos/Contratos): botão vermelho **"Excluir" fixo no topo** (Clientes: ao lado de "Novo cliente"; Financeiro: ao lado de "Receber"). Clicou sem marcar → aviso "Marque na caixinha ☐ da esquerda e clique de novo". Multi-seleção e exclusão real continuam (v5.20.23), com os DOIS avisos para cliente com histórico.

### 4. Backup AUTOMÁTICO 1x ao dia (sem clicar)
- Novo `ajustes_v52024_patch.js`: ~30s após abrir/logar, se for um dia novo, o sistema exporta o backup sozinho (mesmo formato do botão ⬇, sem o campo interno `_rt`).
- **No programinha (.exe):** salva direto em **`%APPDATA%\digicopy-erp\backups\digicopy-backup-AAAA-MM-DD.json`** — nova ponte `backupAPI` (`main.js` `registerBackupIPC` `backup:save-daily` + `preload.js`). Sem janela e sem clique.
- **No navegador (GitHack):** baixa o arquivo (cai em Downloads) — navegador não deixa escolher pasta.
- Um arquivo por dia; em .exe ANTIGO (sem a ponte) cai no comportamento de download. Toast discreto confirma.

### Empresa única fixa + "meus dados nunca vão deletar"
- **Criar empresa: impossível** — desde v5.20.23 não existe mais nenhum caminho de UI/código que crie empresa nova. A empresa é UMA fixa: `emp_digicopy`.
- **DEFEITO REAL corrigido no `seedData`:** antes ele apagava qualquer usuário com login `admin`/`carlos`/`ana`/`financeiro` — se o dono cadastrasse um funcionário "Ana", ela sumia na próxima carga. Agora só remove demo DE VERDADE (id de demo ou login demo criado pelo 'sistema'/sem dono). Usuário criado pela tela (`criadoPor` = quem criou) e legado migrado (`criadoPor: 'migracao'`) **nunca são apagados**.
- O que pode "apagar" hoje: (a) os botões Excluir (ação sua, com avisos); (b) o sync propaga para os outros PCs só o que VOCÊ apagou (lápide) — **ausência na nuvem nunca apaga o PC**; (c) o `seedData` só mexe em empresa/usuários demo; (d) backup automático diário + botão ⬇ = rede de segurança.
- Usuário confirmou que o **.exe sai incompleto** — combinado: **adiado** ("deixa pra quando resolvermos tudo"). A lista `build.files` já está correta no código; o instalador em si a gente gera juntos no final.
- Etiqueta funcionando normalmente — não tocar.

### Testes
- `test_ajustes_v52024.js` (13 asserts: regra de demo antigo, 1x/dia, nome do arquivo, JSON sem `_rt`) + `test_ajustes_v52023.js` + suítes principais OK. Falha pré-existente de etiquetas continua intocada (área aceita).

## v5.20.23 — Excluir em lote (Clientes/Financeiro) + backup fora das Config + UMA empresa só garantida

**Reaplicados nesta branch os itens 1–4 aceitos pelo usuário** (o repo estava na v5.20.22, sem eles — tinham sido feitos em outra conversa) **e respondidas as 2 perguntas dele.**

### 1. Excluir em lote — Clientes e Financeiro (de verdade)
- Novo `ajustes_v52023_patch.js` (carregado por último, antes do sync): envolve `renderClientes` e `renderFinanceiro` e injeta **caixinha de seleção** em cada linha + caixinha "marcar todas" no cabeçalho + botão vermelho **"Excluir selecionados (N)"** (aparece só quando tem algo marcado).
- **Exclui de verdade**: remove do banco e o sync propaga as lápides pros outros PCs sozinho.
- **Cliente sem histórico**: 1 aviso. **Cliente COM histórico**: **DOIS avisos** (o 1º lista o que existe: "3 vendas, 1 contrato, 2 chamados…"; o 2º é o último aviso "não dá pra desfazer") e apaga **o histórico junto** — vendas/notinhas, contratos, chamados, leituras, impressoras do contrato (parque) e lançamentos financeiros ligados ao cliente. Impressora que estava "locado" só naquele contrato volta pra "disponivel".

### 2. Tirado o "Pagar" do Financeiro
- O botão **"Pagar"** do cabeçalho da tela Financeiro **foi removido** (não tem mais botão de pagar junto do cabeçalho/filtro). O de "Receber" continua. O filtro "Só a pagar" continua pra **ver** os lançamentos antigos; só não cria mais por ali. Se ainda usa contas a pagar, avisar que volta.

### 4. Backup fora das Configurações
- Botão de **exportar backup (⬇)** adicionado no **cartão do usuário na barra lateral** (ao lado do botão Sair), visível em TODAS as telas. O de Configurações continua existindo.

### 5. Pendente (combinado: só quando o usuário mandar)
- Botão **"Importar clientes" continua na tela Clientes**. Remover DEPOIS que ele terminar de importar os dados dele — é a instrução pendente pro próximo chat.

### Pergunta 1 — "tem alguma coisa que cria mais de uma empresa?"
**Tinha, e foi achada e removida de verdade.** A tela **"Empresas (PDF)"** (menu lateral, do `evolucao_patch.js`) tinha o botão **"+ Nova empresa"** que salvava uma empresa DE VERDADE no banco (`db.empresas`) com **id aleatório** e ainda criava um usuário demo `admin/admin123`. Era isso que podia criar 2ª empresa. Removidos de verdade: a tela, o item de menu, o `openModalEmpresa`/`saveNovaEmpresa` (app.js) e o fallback do `doLoginCNPJ` que também podia criar empresa (`gen('emp')`).
- **Garantias de empresa única que já existiam e continuam:** `seedData` roda em toda carga e devolve o banco pra UMA empresa (`emp_digicopy`), apaga empresas extras e normaliza o `empresaId` de TODOS os dados pra ela; o sync faz o mesmo na hora de enviar/receber (`normalizarEmpresa`). Ou seja: **todos os usuários/PCs veem os mesmos dados**, independente de quem cadastrou.
- Dados da empresa que vão na notinha se editam em **Configurações → "Dados da loja"** (não precisava da tela removida).

### Pergunta 2 — "mais alguma outra coisa que é defeito?" (achados e correções)
- **`npm test` estava quebrado**: a cadeia apontava pra `test_login_buscador_ui_final.js`, que **não existe no repo**. Trocado pelo novo `test_ajustes_v52023.js` (16 asserts, passando). Resta 1 falha PRÉ-EXISTENTE e intocada: `test_cartuchos_etiquetas_config.js` ("capacidade padrão é máxima compacta na folha") — já falhava antes, é da área de etiquetas (aceita/fechada), não mexer sem pedido.
- **`build.files` do Electron desatualizado**: faltavam TODOS os patches modernos (v5.17+) e o `sync_realtime_patch.js` — o `.exe` sairia incompleto. Agora a lista é gerada dos `<script>` do `index.html`. Idem `check`.
- **`confirmarExcluirModulo` usava `confirm()` nativo** (quebrado → botão não fazia nada): migrado pra `confirmSistema`.
- Código morto legado que já era inacessível e continua sem ponto de entrada (não atrapalha; remoção total = refactor futuro): `renderBanco`, `renderMigrados`, `renderRelatorios`, deletes antigos individuais do app.js (substituídos pelos novos em lote).

- Testes: `node --check` em tudo OK; suítes principais OK (inclui `test_finalizacao_sistema` e a nova `test_ajustes_v52023`).
- Cache-bust: `app.js`/`evolucao_patch.js`/novo patch sobem com `?v=5.20.23` no index.html.

## v5.20.22 — Botão "Importar clientes" recolocado (p/ testar o sync)
- O botão de importar tinha sido removido a pedido do usuário ("tira as opções de importar"), mas ele precisa dele p/ testar a sincronização dos clientes. Recolocado no cabeçalho da tela Clientes (`finalizacao_sistema_patch.js`) com `<input type=file id=clientes-json-input>` + status.
- `importarClientesJsonFinal` recriado, usando a função pura `SISTEMA_CLIENTES_LOJA_PURE.importarClientesDeObjetos` (que continuou existindo no `sistema_clientes_loja_patch.js`).

## v5.20.21 — Sync: clientes NÃO apareciam (causa = empresaId antigo)
- **Sync confirmado funcionando pelo usuário** (PC + celular). MAS só os clientes não apareciam.
- **Causa raiz:** os clientes importados numa sessão antiga ficaram com `empresaId` ALEATÓRIO (a versão antiga gerava id de empresa aleatório). As telas filtram por `empresaId === emp_digicopy`, então eles entravam na base mas ficavam INVISÍVEIS.
- **Correção:** `normalizarEmpresa(rec)` no `sync_realtime_patch.js` força `empresaId = emp_digicopy` tanto no PULL (aplicarRemoto) quanto no PUSH (pushMudancas). E o `seedData` (app.js) normaliza o `empresaId` de todos os dados de negócio na carga.
- Observação: usuários/empresa "sincronizados" no teste eram na verdade criados pelo `seedData` local (não provavam sync); o teste real de sync é justamente os clientes — que agora devem aparecer.

## v5.20.20 — Botão de excluir TÉCNICO (qualquer usuário pode)
- Novo `window.excluirTecnico(id)` no `ajustes_v5196_patch.js`: **qualquer usuário logado** pode excluir um técnico (técnico é só um nome de lista p/ chamados/vendas, não é conta de acesso). Confirma com `confirmSistema`, loga e propaga via saveDB.
- Botão "🗑" adicionado na linha dos técnicos na tela Usuários (ao lado do lápis).
- Regras dos USUÁRIOS continuam: excluir usuário só Admin/Dono (e nunca a si mesmo).

## v5.20.19 — Botão de excluir usuário (só Admin/Dono)
- Novo `window.excluirUsuario(id)` no `ajustes_v5196_patch.js`: só Admin (Kauan) e Dono (Denivaldo) podem excluir; **não exclui a si mesmo**; **não exclui o último Admin/Dono**; confirma com `confirmSistema`; loga em auditoria e propaga via sync (saveDB).
- Botão "🗑" (lixeira) na coluna Ações da tela Usuários, visível **apenas para Admin/Dono**, e nunca na própria linha.

## v5.20.18 — seedData AUTORITATIVO (kauan/denivaldo sempre certos)
- Causa raiz do "não aparece": o seedData anterior SÓ adicionava kauan/denivaldo se faltassem; no localStorage antigo (GitHack) podia existir um "kauan" com senha errada/órfão, e aí não corrigia (senha errada → não loga; empresaId errado → não lista na tela de Usuários).
- Agora o seedData **corrige sempre**: força kauan/6132/Admin e denivaldo/3232/Dono (id, empresaId, senha, perfil, nome, ativo), mantém UMA empresa só (`emp_digicopy`), remove usuários demo (admin/carlos/ana/financeiro + `usr_admin`) e aponta qualquer usuário órfão pra empresa real.
- Ainda: se o usuário trocar a senha do kauan/denivaldo no futuro pela tela, o seed volta a 6132/3232 na próxima carga (comportamento intencional por agora — são credenciais fixas do dono; se quiser trocar de vez, me avisa).

## v5.20.17 — Logins REAIS garantidos (kauan Admin / denivaldo Dono)
- **Usuários reais viram o padrão** (não mais admin/admin123):
  - `kauan` / `6132` → perfil **Admin**
  - `denivaldo` / `3232` → perfil **Dono**
- `seedData` garante esses dois (idempotente) e **remove o antigo `admin/admin123`** (id `usr_admin`) quando o kauan existe — nunca fica sem acesso.
- Fallback do `login_dados_automaticos_patch.js` (`importarFuncionariosLegados`) trocado de admin/admin123 → kauan/6132.
- A hierarquia (`perfilEfetivo` em ajustes_v5196) já tratava kauan=Admin e denivaldo=Dono por nome de login, então está coerente.
- IMPORTANTE p/ o usuário: os dados dos clientes que ele importou continuam na nuvem; os outros usuários (carlos/ana/financeiro da demo) não voltam — só kauan e denivaldo são garantidos. Se quiser mais usuários (funcionários), cria na tela Usuários.

## v5.20.16 — Login se AUTO-RECRIA (nunca mais some)
- Causa raiz: o botão "Limpar todos os dados" (já removido) apagou empresa/usuários, e a auto-recriação antiga (`seedData`) só rodava quando a lista de empresas estava TOTALMENTE vazia — se sobrasse uma empresa "quebrada" (sem usuário ativo), não corrigia.
- Correção: `seedData` virou uma **garantia idempotente** que roda em TODA carga: garante a empresa `emp_digicopy` + o admin `admin`/`admin123` (só ADICIONA o que falta, nunca sobrescreve usuário/empresa existente). Chamado com `seedData(false)` sempre (antes era só `if(db.empresas.length===0)`).
- **Usuários com senha personalizada (kauan/denivaldo) NÃO são recriados automaticamente** (o sistema não sabe as senhas) — o usuário recria na tela Usuários, ou me passa as senhas que eu adiciono.

## v5.20.15 — Sistema limpo p/ teste final (removidas opções de teste/importar/apagar)
- **Removido o "Simular coleta automática"** (botão na tela Leituras + função `simularLeiturasLote`).
- **Removido o diagnóstico "Teste da nuvem"** (`__syncDiagnostico`, `__syncDiagnosticoAlert`, `diagnosticoInicial`, `mostrarDiagNaTela`, `errTexto`/`setErr`/`ultimoErro`) do `sync_realtime_patch.js`. O sync segue funcionando em silêncio.
- **Removido o "Importar clientes"** (botão no `finalizacao_sistema_patch.js` + injeção `inserirImportadorClientes`/`importarClientesJsonFinal` no `sistema_clientes_loja_patch.js`). As funções puras `importarClientesDeObjetos`/`mapClienteRow` permanecem como código morto (reutilizáveis), sem UI.
- **Removido o "Limpar todos os dados"** (botão no `notinha_patch.js` + arquivo `limpeza_dados_patch.js` DELETADO e sua `<script>` removida do index.html).
- **Mantido:** "Exportar backup" (Configurações) e "Gerar faturas pendentes" (Leituras) — são funcionalidades reais, não teste.
- Objetivo: versão limpa para o teste de sincronização de amanhã, sem botões de teste/importação/limpeza.

## v5.20.14 — Importador de clientes visível na tela FINAL de Clientes
- Causa raiz (igual ao botão de backup): o `finalizacao_sistema_patch.js` (último a carregar) SOBRESCREVE `renderClientes` inteiro, matando o card "Importar clientes" do `sistema_clientes_loja_patch.js` (que rodava antes e era substituído).
- Correção: botão **"Importar clientes"** adicionado direto no cabeçalho (`neo-actions`) da tela final de Clientes, com `<input type=file id=clientes-json-input>` escondido e status `#clientes-import-status`.
- `importarClientesJsonFinal` agora mostra o resultado num `lfbAlert` (importados/atualizados/ignorados + total). Lê `CLIENTES.json`/`CLIENTES_FINAL.json` e ignora `CLIENTES_USUARIOS*`.

## v5.20.13 — Botão "Exportar backup" agora VISÍVEL de verdade
- Causa raiz: havia **duas telas de Configurações** brigando. O `app.js` montava uma com o card "Backup" ("Exportar backup JSON"), mas o `notinha_patch.js` SOBRESCREVIA essa tela inteira com outra (que só tinha "Exportar backup local" pequeno no meio de um card). Por isso o botão que prometi "voltar" nunca aparecia.
- Correção: no `notinha_patch.js` (renderConfig ATIVO), os botões agora ficam no CABEÇALHO da tela: **"Exportar backup"** + **"Limpar todos os dados"** + "Salvar" — impossíveis de não ver.
- O `limpeza_dados_patch.js` continua com a injeção antiga (h4 "backup") só como fallback, mas agora o botão de limpar já está direto no renderConfig ativo.

## v5.20.12 — Deletado de vez TODOS os itens escondidos do menu
- **Removidos direto no `index.html` (fonte), não mais escondidos:** submenu "Início" (Área inicial / Pesquisa rápida), "Notinhas antigas", "Novo orçamento", "Explorar Migrados", "Nova despesa" (duplicada), "Relatórios" (stub).
- **Removido o código que ESCONDIA:** `removerElementosFinais()` (finalizacao_sistema_patch) e o CSS `display:none` de menu (`.modern-topnav .module:first-child .module-menu`, e o `instalarCssMenuLimpo`/`garantirBotaoDadosMigrados` em correcoes_uso_diario). `limparTopoMenus` neutralizado (não há mais o que limpar).
- **Efeito colateral bom:** o botão "Exportar backup JSON" (Configurações) volta a aparecer — o regex antigo de "backup" o escondia por engano.
- **Restam como código MORTO (sem ponto de entrada na UI, não aparecem):** `renderRelatorios`/`gerarRelatorio`, `renderMigrados`/`abrirNotinhasAntigas`, `renderBanco` + handlers Firebird. Não interferem; remoção total deles fica pra um refactor futuro se quiser.
- **Aviso do GitHack (banner "endereço PROVISÓRIO", `rawgh-banner`)** continua existindo em `app.js` (só aparece em raw.githack.com) — é aviso útil, não menu escondido; perguntar se quer remover.

## v5.20.11 — Deletado de VERDADE (não escondido): logo + "Importar arquivos"
- **Upload de "Logo da loja" REMOVIDO de verdade.** O `ajustes_v5188_patch.js` injetava o upload de logo no card "Dados da loja", e o `ajustes_v5189_patch.js` apenas o ESCONDIA via `removerUploadLogo()` (DOM). Agora o upload foi apagado da fonte (`ajustes_v5188_patch.js` só reaplica a logo padrão; `ajustes_v5189_patch.js` sem o hack de remover).
- **"Importar arquivos" REMOVIDO de verdade** (menu Configurações → Importar arquivos, que navegava pra view `banco` com upload JSON/DBeaver/Firebird): apagado o botão do menu (`index.html`), a `<section id="view-banco">`, e o branch `if(view==='banco')` do `navigateTo` (`app.js`). A função `renderBanco` + handlers viraram código morto (inacessível).
- **Fica honesto p/ o usuário:** ainda existem itens ESCONDIDOS via `removerElementosFinais()` em `finalizacao_sistema_patch.js` (regex): "Relatórios" (no submenu Config), "Explorar Migrados"/módulos dinâmicos (`mod_*`), "Notinhas antigas", "nova despesa", "contas a pagar", "sistema virgem", "alinhamento do banco", "exportar backup". E o código morto de migração (renderBanco/Firebird) segue no fonte. Perguntar o que remover de vez.

## v5.20.10 — "Começar do zero" seguro + importador de clientes reativado
- **Novo `limpeza_dados_patch.js`:** botão "🗑️ Limpar todos os dados" no card Backup das Configurações. É **manual** (só roda ao clicar, NUNCA automático — não repete o bug do "sistema virgem" que apagava a cada atualização). Pedido em 2 confirmações (`confirmSistema`).
- A limpeza: (1) limpa a **nuvem** (`__syncLimparNuvem` apaga a coleção `erp_rt`), (2) zera a empresa p/ id fixo `emp_digicopy` + mantém usuários reais (remove só `carlos`/`ana`/`financeiro` da demo, garante `admin`), (3) zera clientes/produtos/vendas/os/financeiro/tecnicos/modulosDinamicos/config/buscador, (4) limpa o estado do sync, (5) salva e recarrega.
- **`sync_realtime_patch.js`:** adicionado `rtListAll()` + `window.__syncLimparNuvem()` (lista e apaga todos os docs de `erp_rt` em lotes de 200).
- **Importador de clientes REATIVADO:** o card "Importar clientes reais" (em `sistema_clientes_loja_patch.js`, função `importarClientesJsonFinal`) estava sendo REMOVIDO pelo `finalizacao_sistema_patch.js` (estava na lista `['...','clientes-import-card']`). Removido da lista → o card volta a aparecer na aba Clientes, e lê `CLIENTES.json`/`CLIENTES_FINAL.json` (ignora `CLIENTES_USUARIOS*`).
- Fluxo pro usuário: baixar → limpar tudo → importar CLIENTES.json na aba Clientes → os clientes sincronizam entre os 5 PCs.

## v5.20.9 — Removida a DEMONSTRAÇÃO (dados fake) + login simples sem CNPJ
- **`seedData` em `app.js` não cria mais os dados fake** (empresa CNPJ 12.345.678/0001-90, 6 clientes de mentira, produtos, equipamentos, contratos, leituras, OS, vendas, contas + usuários carlos/ana/financeiro). Agora só garante **empresa única + admin** (`emp_digicopy` / `usr_admin`, login `admin`/`admin123`).
- **Login já era sem CNPJ** (o patch `login_dados_automaticos` escondia/removia a etapa de CNPJ) — mantido.
- **Ids fixos** pra empresa única e admin: `escolherEmpresaPadrao` e o fallback de admin do `login_dados_automaticos_patch.js` agora usam `emp_digicopy`/`usr_admin` (antes eram aleatórios → cada PC criava empresa diferente e duplicava na nuvem).
- **`defaultData.config.empresa`** limpo (sem CNPJ/telefone/email fake).
- **Sync:** removida a lógica `ehDemo()`/`limparDemo()` (conceito de demo acabou — nada mais bloqueia a sincronização). Adicionado **pull-primeiro** em PC novo (`!state.cursor`) pra não sobrescrever a empresa real com a empresa vazia recém-criada.
- Teste atualizado (23 ok, sem a seção de demo).
- **Importante p/ o usuário:** os dados antigos (demo + clientes) que já estão no `localStorage` do PC dele continuam lá — não são apagados sozinhos. Pra começar limpo, ele precisa limpar o localStorage (ou eu faço uma limpeza dos registros fake conhecidos, se ele pedir).

## v5.20.8 — Causa raiz de "clientes não vão pra nuvem"
- **Bug 1 (retry):** quando um envio falhava (ex.: cota 429), o `catch` engolia o erro e o `tick` só empurrava se `__dirty || !state.cursor`. Depois do 1º cursor setado, um envio falho **nunca era re-tentado** → o cliente ficava preso no PC. Corrigido: `pushMudancas` agora retorna `falhou`, e o `tick` **sempre tenta** empurrar (idempotente — só grava o que difere do snapshot), re-tentando o que falhou.
- **Bug 2 (poluição de demo):** os dados de demonstração (empresa fake + 6 clientes de mentira) estavam sendo **enviados pra nuvem**. Agora, se `ehDemo()` e a nuvem está vazia, o sistema **NÃO envia** a demo (só aguarda um PC real publicar). Demo nunca mais vai pra nuvem.
- **Pendente:** confirmar com o usuário se os clientes que ele quer salvar estão cadastrados na **empresa real (CNPJ dele)** ou na **demo (admin/admin123)** — porque só dados da empresa real sincronizam (a demo é local, por design).

## v5.20.7 — Removidos os botões legados de nuvem (Enviar/Carregar)
- **Deletado o painel morto "Migração e nuvem"** do `sync_client.js`: `cloudMigrationHtml()`, `openCloudMigration()`, `nuvemInfo()`, `copiarRegrasFirebase()`, `verificarBaseNaNuvem()` e os wrappers `enviarDadosLocaisParaNuvem`/`carregarDadosDaNuvem` (que ficavam só no código, sem aparecer na tela). Os botões "Enviar base de teste"/"Carregar base teste"/"Testar conexão" etc. não existem mais.
- **Botão de cartuchos/etiquetas** "Atualizar e enviar nuvem" → **"Atualizar"** (a nuvem agora é automática; aquele botão não envia mais manualmente).
- O motor legado `syncEnviarParaNuvem`/`syncCarregarDaNuvem` (full-replace, coleção `app_state`) segue no código mas **inerte** (nenhum botão chama) — remoção total dele fica pra uma limpeza futura, pois `interface_patch`, `ajustes_v5191`, `ajustes_v5186`, `performance_patch` e `login_dados_automaticos` ainda o referenciam na ordem de carga.
- **Ainda pendente (perguntar):** remover a área "Importar arquivos" (menu Configurações → Importar arquivos → JSON/DBeaver) e o botão "Exportar JSON atual". O backup continua disponível em Configurações → "Exportar backup JSON".

## v5.20.6 — Revisão de robustez + limpeza (enquanto aguarda a cota)
- **`_rt` não vaza mais no backup:** `exportBackup()` filtra o campo interno de sincronização (`_rt`) via `JSON.parse/stringify` com replacer.
- **Sync antigo (full-replace, coleção `app_state`) removido de 2 lugares que disparavam à toa** (gastava cota): `buscador_escola_patch.js` (após baixar orçamentos) e `cartuchos_etiquetas_config_patch.js` (`atualizarEEnviarNuvem`). O sync novo já envia tudo no `saveDB`.
- **Arquivos mortos deletados:** `recuperar_dados.html` e `ler_chaves_leveldb.js` (eram da migração de `.ldb`, que o usuário descartou).
- Pendências que dependem de decisão do usuário: (a) dados do Buscador Escola (`escolaOrc/escolaIt/escolaExc`) NÃO entram no sync novo — **DECIDIDO: manter local por PC (opção b)** — cada PC baixa da NAEN direto (custa ZERO de cota no Firebase e o dado fica sempre fresco). Sem mudança de código; (b) remover de vez os botões legados "Enviar/Carregar da nuvem" e a área importar/exportar JSON — ainda pendente.

## v5.20.5 — Sync por tela (sem poll, só quando há novidade naquela parte)
- Usuário pediu: atualizar **só ao navegar de tela** (clicar no menu), e **só redesenhar se houver algo novo naquela tela específica**. 5 PCs previstos.
- **Removido o `setInterval` (poll)** de vez — nada de consultar em segundo plano (economiza cota, acaba o piscar).
- Ao `navigateTo(view)`: renderiza com os dados atuais → puxa o que mudou (`pullMudancas` agora retorna um **Set de entidades** mudadas) → re-renderiza a view **só se** `viewRelevante(view, mudou)`.
- `VIEW_ENTS` mapeia view→entidades (clientes→clientes, vendas→vendas, financeiro→contasReceber+contasPagar, etc.). Views sem mapeamento (dashboard, relatorios, auditoria) recarregam se QUALQUER coisa mudou.
- `visibilitychange`/`focus` fazem só um pull silencioso (mantém `db` em dia), sem redesenhar.
- Push continua disparando no `saveDB` (agendaPush). Bootstrap continua uma vez no load.
- Teste atualizado: 26 asserts (inclui `viewRelevante`).

## v5.20.4 — Corta o consumo de cota do Firebase (era o que estourava)
- Erro `RESOURCE_EXHAUSTED / Quota exceeded` (HTTP 429): o poll de **1,5s** estourava a cota grátis (~50k leituras/dia) do Firestore. "Gravar" já funcionava (regras OK).
- Correções: poll de fundo **1,5s → 6s**; ao voltar pra aba/foco (`visibilitychange`/`focus`) faz **pull imediato + redesenho** (sensação instantânea sem consultar o tempo todo); **removido o diagnóstico automático** no startup (escrevia/lia doc de teste a cada load — era on-demand só).
- Cota grátis reseta todo dia (meia-noite horário do Pacífico ≈ 4h da manhã no Brasil). Se precisar de mais, opção: plano Blaze (pay-as-you-go, com franquia generosa).

## v5.20.3 — Para o "piscar" da tela
- A tela ficava se redesenhando a cada ~1,5s (o `refreshUI` chamava `navigateTo` a cada pull). Agora o sync continua **em background** (dados sempre atualizados + `saveDB`), mas a UI **só redesenha** quando: (a) o usuário navega pra outra view e volta, (b) a aba do navegador volta a ficar visível (`visibilitychange`) ou (c) a janela recupera o foco (`focus`).
- Flag `__mudouUI` marca que há mudança pendente; o render acontece sob demanda, sem piscar.

## v5.20.2 — Causa raiz do sync encontrada (2 bugs)
- Diagnóstico do usuário revelou:
  1. **`INVALID_ARGUMENT: Document name lacks "projects"`** — `rtWrite` mandava a URL completa no campo `name` do write. Corrigido: agora usa caminho de recurso (`RES = projects/{proj}/databases/(default)/documents`), não a URL.
  2. **`HTTP 403` no runQuery** — as regras do Firestore só liberavam `/app_state/{doc}`. A coleção nova `erp_rt` ficava de fora. Corrigido: `copiarRegrasFirebase()` agora gera `match /{document=**}` (libera tudo, exigindo auth). **Usuário precisa republicar as regras** no console (clicar "Copiar regras Firebase" no sistema → colar em Firestore → Regras → Publicar).

## v5.20.1 — Diagnóstico da nuvem (encontrar o erro exato)
- Usuário relatou que o sync NÃO funciona em nenhum ambiente (Electron, navegador, celular). Causa mais provável = config do Firebase (regras/auth), não o código.
- Adicionado `window.__syncDiagnostico()` (e `__syncDiagnosticoAlert()`): testa passo a passo **config → login anônimo (chamada crua, com o erro exato do Firebase) → gravar doc → ler → listar** e mostra tudo num `lfbAlert`. Roda sozinho ~1,2s após iniciar e avisa se algo falhar.
- `rtFetch` agora lança o erro com `code`/`status`/`message`/`body` (resposta crua do Firebase) e o loop guarda `ultimoErro`.
- Pendência: usuário rodar e colar o texto do alerta "Teste da nuvem" pra eu ver o erro exato.

## v5.20.0 — Sincronização AUTOMÁTICA com MESCLAGEM (novo motor)
- Novo `sync_realtime_patch.js` (carregado por último no `index.html`), coleção Firestore `erp_rt` (1 doc por registro), SEPARADA do `app_state` antigo.
- **Automático** (sem botão): sobe local em ~450ms após salvar; puxa remoto a cada ~1,5s (loop com `ocupado` + `__dirty` p/ não diffs vazios).
- **Junta, não substitui**: mescla por `id` do registro. Dois PCs cadastrando ao mesmo tempo → os DOIS aparecem. Edição do MESMO registro → ganha a hora do SERVIDOR (campo `ts` via `setToServerValue:REQUEST_TIME`, nunca o relógio do PC). Exclusão propaga via lápide (`t:true`).
- `tsKey()` normaliza fração p/ 9 dígitos (nanossegundos) e compara como string — corrige o bug de `Date.parse` truncar milissegundos.
- Auth anônima reaproveita a chave `digicopy_firebase_auth_v1` (não cria token novo).
- **Bootstrap PC novo (demo):** se `ehDemo()` (única empresa = CNPJ 12.345.678/0001-90) e a nuvem TEM dados → `limparDemo()` + pull + `location.reload()` 1x (pra tela de login mostrar a empresa real).
- Desliga o auto-carregar ANTIGO (`sessionStorage.setItem('digicopy_auto_load_try_v4939','1')`) pra não conflitar.
- `saveDB` e `navigateTo` são embrulhados (push rápido + re-render da view atual; não re-renderiza se usuário digitando ou sem login).
- Entidades array: empresas, usuarios, clientes, produtos, equipamentos, contratos, parque, leituras, os, vendas, contasReceber, contasPagar, tecnicos, notificacoes. Objetos: config, modulosDinamicos. `logs` fica local (auditoria por PC).
- Teste puro `test_sync_realtime.js` (21 asserts): mescla A+B, last-write-wins, lápide, config, demo, tsKey fracionário.
- **Ainda NÃO testado com 2 PCs reais.** Os botões antigos "Enviar/Carregar da nuvem" (full-replace, coleção `app_state`) continuam como fallback legado — provável remoção depois.
- **Importante:** precisa do Firestore com regras `allow read, write: if request.auth != null` + login Anônimo ativo (o que o usuário já fez = não expira em 30 dias).

## Diagnóstico de migração (após v5.19.25 — ainda não resolvido)
- v5.19.25 NÃO trouxe os dados: as chaves legadas chutadas (`digicopy_erp_v20`/`v10`/`digicopy_erp`/`digicopy_backup`) estão erradas. **Causa raiz: não sabemos o nome real da chave** que a versão antiga usava.
- Novo arquivo `ler_chaves_leveldb.js`: lê os `.ldb/.log/.old` e lista os textos (nomes de chave) em texto puro (os VALUES ficam comprimidos em Snappy, mas as CHAVES são texto puro). Usuário roda `node ler_chaves_leveldb.js "C:\Users\User\AppData\Roaming\digicopy-erp\Local Storage\leveldb"` e cola a saída.
- Assim que soubermos o nome exato da chave, `loadDB` lê `localStorage.getItem(chave)` (o Chromium descomprime sozinho) e migra. Commit `133cc2e`.
- DevTools está DESLIGADO no `main.js:28` (`closeDevTools`), por isso o diagnóstico é por script Node, não por console.

## v5.19.25
- **Recuperação de dados antigos (salvos localmente):** o `loadDB` agora também lê as chaves LEGADAS (`digicopy_erp_v20`, `digicopy_erp_v10`, `digicopy_erp`, `digicopy_backup`) que a versão antiga usava e a atual estava apagando sem ler. Com os arquivos `.ldb` antigos na pasta certa, os dados voltam sozinhos.

## v5.19.24
- **Chamados — validação em UM aviso só:** agora junta tudo que falta num único aviso ("Preencha o que falta: X, Y, Z"). O que já foi preenchido sai do aviso. Campos que faltam ficam destacados em vermelho (igual produtos). Inclui também a "Data de atendimento" ao finalizar (que a validação antiga exigia).

## v5.19.23
- **Chamados — duplicação de tudo (causa raiz):**
  - `ajustes_pos_final_patch.js` tinha uma função antiga (`destacarChamadoModal`) que adicionava faixa azul SEM esconder o título → nomes duplicados. Desativada (as faixas agora ficam só no `ajustes_v5186`).
  - `locacao_chamados_fix_patch.js` injetava "Contador Color" e "Produtos/peças" no chamado avulso, colidindo com o `ajustes_v5175` → duplicação. Desativado no avulso.
  - Corrigido o guard do `ajustes_v5175` (antes usava um id que nunca existia, permitindo injetar de novo).

## v5.19.22
- **Chamados — duplicação do contador/color (causa raiz):** três patches antigos (v5171, v5172, v5174) injetavam o bloco "Contador Color" de novo por cima do bloco que o v5175 já cria. Removidas essas injeções na origem — agora só o v5175 desenha contador preto + color (uma vez só).

## v5.19.21
- **Chamados** — corrigida a duplicação de nomes nas seções: a faixa azul agora SUBSTITUI o título original (que é escondido), em vez de ficar o nome repetido (faixa + título).

## v5.19.20
- **Chamados (validação obrigatória):**
  - Ao salvar: exige motivo/defeito, modelo e serial (e cliente no chamado fora de contrato).
  - A validação de contador ao finalizar NÃO foi duplicada (já existia em `validarFinalizar`).
- Arquivo novo: `ajustes_v51920_patch.js`.

## v5.19.19
- **3** — Botão "Excluir" de contratos agora fica ao lado de "Novo contrato" (na tela correta).
- **4** — Chamados: removida a caixa de seleção duplicada (reusa a que já existia para "finalizar selecionados").
- **5** — Produtos: adicionado botão "Mostrar todos".

## v5.19.18
- **1** — Removida a caixa "Busca geral" + lupa do topo.
- **3** — Botão "Excluir" de contratos agora fica junto do "Novo contrato" (não isolado).
- **4** — Chamados (fora de contrato): adicionado botão "Excluir" com seleção múltipla.
- **5** — Produtos: por padrão não lista nada (só ao pesquisar).
- **6** — Removido o botão "Entrada estoque".
- **7** — Adicionado botão "Estoque baixo" (mostra produtos abaixo do mínimo).

## v5.19.17
- **Excluir produto/contrato** — botão "Excluir" ÚNICO no topo (ao lado de "Novo"), com seleção múltipla. Removidas as lixeiras individuais de cada linha.

## v5.19.16
- **Venda faturada** — agora abre na tela PRINCIPAL (cadastro), travada (readonly), em vez da tela de histórico.
- **Excluir produto** — corrigido (o `confirm()` nativo estava quebrado) + seleção múltipla (checkbox + botão "Excluir" igual vendas).
- **Excluir contrato** — corrigido + seleção múltipla (igual vendas).
- Arquivo novo: `ajustes_v51916_patch.js`.

## v5.19.15
- **Buscador Escola — correção do botão Excluir**: a função local `uid()` tinha o mesmo nome da global e entrava em loop infinito ao gerar o id da exclusão (travava o botão). Corrigido para usar `window.uid`.

## v5.19.14
- **Buscador Escola — Excluir/Restaurar**:
  - Excluir agora pede confirmação ("Deseja realmente excluir?") e depois um campo para escrever o **motivo** (sem usar `prompt`, que não funciona no Electron).
  - Restaurar pede confirmação ("Deseja voltar?").
  - Limpeza automática: orçamento excluído que sair da NAEN some sozinho da aba Excluídos.

## v5.19.13
- **Buscador Escola** — orçamento com vários itens pesquisados aparece em UM cartão só (itens listados juntos). Sem resultados, mostra "Nada encontrado para ...".

## v5.19.12
- **Buscador Escola** — tela não pisca mais durante a sincronização: o log acumula sem redesenhar; a contagem (orçamentos + itens) só é mostrada no final, quando o processo termina.

## v5.19.11
- **Buscador Escola — Atualizar agora é incremental**: o botão "Atualizar" (e o automático de 1h) só baixa os itens dos orçamentos **novos**; os já baixados são pulados (economiza muito tempo). "Baixar Tudo" continua limpando e baixando tudo. Progresso mais claro ("Página X", "Baixando itens do orçamento Y").

## v5.19.10
- **Buscador Escola** — credenciais (CNPJ + senha) mantidas no código (usuário vai deixar o repositório privado). Removido o botão "Login API" adicionado temporariamente.

## v5.19.9
- **Segurança (Buscador Escola)** — senha da Caixa Escolar removida do código-fonte. Adicionado botão "Login API" onde o CNPJ + senha são digitados uma vez e salvos no banco (local + nuvem), não no código.

## v5.19.8
- **Auditoria** — corrigido: antes escondia para TODO MUNDO (o ocultamento "grudava"). Agora alterna corretamente (mostra para Admin/Dono, esconde para os demais) e não age antes do login.
- **Senha CNPJ deletada de verdade** (não só ocultada) do app.js: título do modal "Novo usuário", campo de senha CNPJ, validação no saveUsuario e textos "Como funciona" da tela de usuários.

## v5.19.7
- **Auditoria** — agora só **Admin** e **Dono** veem a auditoria. Para os demais, o item some do menu lateral e do submenu Configurações, e a navegação é bloqueada.
- Arquivo novo: `ajustes_v5197_patch.js`.

## v5.19.6
- **Usuários e permissões** (hierarquia):
  - **0** — Removida toda a exigência de "senha CNPJ" na criação/edição de usuário.
  - **1/2** — Cada um edita só o próprio usuário. Editar os outros: só **Admin (Kauan)** e **Dono (Denivaldo)**.
  - **3** — Ao criar, perfil é sempre **Funcionário** (Admin/Dono ocultos). Troca de perfil só aparece para Admin/Dono editando outro usuário.
  - **4** — "Cadastrar para escolher em vendas/chamados" virou **"Novo técnico"** (só nome). Técnicos aparecem na listagem junto com usuários, com menos info e editar só o nome.
  - **5** — Quem não tem permissão não vê o botão de editar.
  - **6** — Campos abertos de "técnico" (chamados e vendas) viraram lista de seleção com os técnicos criados.
- Perfis agora: **Admin**, **Dono**, **Funcionário** (Comercial/Financeiro/Técnico passam a ser Funcionário).
- Arquivo novo: `ajustes_v5196_patch.js`.

## v5.19.5
- **Menu Cadastros** — Removido o item "Usuários" duplicado do submenu "Cadastros" (o acesso correto continua em Configurações → "Usuários e permissões").

## v5.19.4
- **Aba Clientes:** filtro **"Nome"** pré-selecionado por padrão (sem disparar a listagem — continua vazio até pesquisar ou clicar em "Todos").

## v5.19.3
- **Aba Clientes:**
  - **1** — "Tudo" saiu da caixa (select) e virou botão **"Todos"** separado (igual leituras/chamados), que lista todos os clientes.
  - **2** — Padrão continua sem listar nada; só aparece cliente ao pesquisar ou clicar em "Todos".
  - **3** — Ordenação padrão por **código crescente** (do primeiro ao último).
  - **4** — Ao alterar um cliente, se modificar qualquer informação e sair (Cancelar/X/fora/ESC), aparece "Deseja salvar as alterações antes de sair?" — só se realmente mudou algo.
- Arquivo novo: `ajustes_v5193_patch.js` + edição em `finalizacao_sistema_patch.js`.

## v5.19.2
- **Corrigido de vez o "Informe o motivo do chamado"** ao salvar/sair: a causa era que o formulário do chamado usa campos de um nome (`ko-*`/`ca-*`) e o salvar lia outro (`kr-os-*`), então achava o motivo vazio mesmo com texto. Agora, antes de salvar, o que está digitado é copiado para os campos que o salvar lê (motivo, modelo, patrimônio, serial, local, contadores, serviços, observação, técnico, impressora e "finalizado?").
- Arquivo novo: `ajustes_v5192_patch.js`.

## v5.19.1
- **Otimização / correção de interferência:**
  - Corrigido o bug da sincronização manual: "Enviar para nuvem" e "Carregar da nuvem" cancelavam sem fazer nada porque `window.confirm` foi desativado pelo sistema de popups (retorna false). Agora usam `confirmSistema` (assíncrono).
  - Logo padrão (logo.png) reaplicada por segurança após o carregamento (evita qualquer sobrescrita por logo customizada antiga).
  - Guard de performance nos observadores: não fazem trabalho quando não há modal de chamado aberto.
- Arquivo novo: `ajustes_v5191_patch.js`.

## v5.19.0
- **4 (Ctrl+P)** — No programa (.exe), o Ctrl+P agora é interceptado no `main.js` (evento `web-contents-created`) e imprime LIMPO (sem URL nem contador de páginas). No navegador (GitHack), o Ctrl+P é a janela do próprio navegador — aparece um aviso lembrando de desmarcar "Cabeçalhos e rodapés".
- Arquivo novo: `ajustes_v5190_patch.js` + edições em `main.js` e `preload.js`.

## v5.18.9
- **1** — Corrigido o erro "Informe o motivo do chamado" ao imprimir (a validação lia o campo errado; agora detecta o formulário certo — contrato `kr-os-*`/`ko-*` e avulso `ca-*`).
- **2** — Imprimir agora valida os campos obrigatórios (motivo; e cliente no chamado fora de contrato) e bloqueia se faltar.
- **3** — Logo volta a ser a padrão (logo.png; removido upload de logo da v5.18.8). Cabeçalho do PDF agora mostra os dados completos da loja (nome fantasia, razão social, CNPJ, telefone, e-mail, endereço) vindos de "Dados da loja para relatórios e notinhas".
- **4** — Impressão sem "about:blank" (título/URL limpos via history.replaceState). No .exe (Electron), impressão limpa (sem contador de páginas/URL) via printAPI (`print:clean` em main.js/preload.js). No navegador, o contador de páginas é opção do diálogo de impressão ("Cabeçalhos e rodapés").
- Arquivo novo: `ajustes_v5189_patch.js` + edições em `main.js` e `preload.js`.

## v5.18.8
- **Dados da loja + logo** — Adicionado upload de LOGO no card "Dados da loja para relatórios e notinhas" (salvo em `db.config.loja.logo`, base64).
- A logo configurada passa a ser usada nos **chamados (dentro e fora de contrato)**, **leituras** e **notinhas de vendas** (via `window.DIGICOPY_LOGO`, reaplicado com a logo da loja).
- Leitura (notinha compacta): cabeçalho agora lê nome fantasia, razão social, CNPJ, telefone, e-mail e endereço do card "Dados da loja".
- Arquivo novo: `ajustes_v5188_patch.js` + edição em `leitura_impressao_compacta_produtos_patch.js`.

## v5.18.7
- **3** — Ao imprimir o PDF do chamado, os dados digitados nas caixas (motivo, serviços, observação, contador, modelo/patrimônio/serial/local) são puxados automaticamente, mesmo sem salvar. Não altera o que está salvo.
- **5.1** — "Bem-vindo, Fulano!" agora é um aviso no CANTO da tela (some sozinho), sem popup.
- Arquivo novo: `ajustes_v5187_patch.js`.

## v5.18.6
- **1.2 / 4.1** — Refatorado para um **MutationObserver** que garante, em qualquer timing/formulário, que o chamado DENTRO do contrato tenha: (a) área de peças "igual vendas" (busca/lupa, qtd, valor, desconto, valor final, Adicionar item) e (b) faixas azuis de seção. Idempotente.
- **3** — PDF: caixa **Impressora** com Modelo, Patrimônio, Serial e Local (busca do equipamento quando o chamado não tiver os campos).
- **5** — Aviso de tela cheia "Carregando dados da nuvem..." antes da recarga automática; em erro, aviso "Não foi possível carregar a nuvem" com botões "Tentar novamente" / "Continuar mesmo assim".
- **5.1** — Aviso "Bem-vindo, Fulano!" com botão único (OK) após o login (o toast antigo era engolido pelo filtro anti-spam do v5.17.1).
- Arquivo novo: `ajustes_v5186_patch.js`.

## v5.18.5
- **4/1.2** — Correção definitiva da duplicação de peças: o patch v5.17.1 já removia o `#lc-pecas-wrap` (as 5 linhas), deixando o **rótulo** "Produtos / peças utilizadas" + textarea escondido pra trás. Agora removemos o bloco INTEIRO (via `#lc-pecas`), em qualquer timing (MutationObserver) e nos dois formulários (avulso + contrato).
- **3** — PDF do chamado: devolvida a caixa **Impressora** (modelo • patrimônio • serial • local), mantendo Cliente + Atendimento lado a lado.
- Arquivo novo: `ajustes_v5185_patch.js`.

## v5.18.4
- **3** — PDF do chamado: caixas "Dados do Cliente" (nome, doc., telefone, endereço) e "Dados de Atendimento" (técnico, motivo/defeito, cadastro, atendimento) **lado a lado**. "Data do atendimento" subiu para a caixa de atendimento; contadores continuam no rodapé em branco até finalizar.
- Arquivo novo: `ajustes_v5184_patch.js`.

## v5.18.3
- **4** — Removida a seção duplicada "Produtos / peças utilizadas" (a antiga de 5 linhas) que aparecia no chamado **fora de contrato** junto da nova "Produtos / Peças usadas" (igual vendas).
- **4.1** — Faixas azuis de seção (Motivo/Defeito, Contadores, Serviços, Observação, Peças) agora também no chamado **dentro do contrato**, igual ao de fora.
- **1.2** — Reforço para a área de peças do chamado de contrato ficar igual à do de fora (busca/lupa, qtd, valor, desconto, valor final, Adicionar item).
- **2.3** — Ao fechar o "Novo lançamento de contador" (leitura) com contador digitado, pergunta "Deseja lançar essa impressora na leitura?" (Sim = salva o lançamento; Não = volta sem lançar).
- Arquivo novo: `ajustes_v5183_patch.js`.

## v5.18.2
- PDF peças: só **Descrição, Quantidade, Valor**.
- Cadastro do item no chamado = vendas: busca (lupa/Enter), qtd, valor, desconto, valor final, Adicionar item.
- 1.2.1 e 1.2.2 **não** nesta versão.

## v5.18.1
- Peças no chamado: qtd, valor, desconto, valor final (igual vendas). Contrato e avulso.
- PDF: colunas Valor / Desc. / Valor final + total (só preenchido se finalizado).
- Finalizar chamado com peças: cria venda **faturada** e abre a tela normal de venda (estorno etc.), ligada ao chamado.
- Excluir venda de chamado: aviso e apaga o chamado junto (depois de estornar, se faturada).

## v5.18.0
- Contador no PDF **só tem número se o chamado estiver finalizado** (checkbox ou status). Aberto = linha em branco.
- Assinaturas + dados da loja **no fim da folha A4** (`height:277mm` + `margin-top:auto`), uma página.

## v5.17.9
- Avulso: ao escolher cliente some a lista; botão **Limpar** para trocar.
- PDF contrato: color se modalidade Color A4/A3 ativa (parque certo).
- Contadores do PDF sem número se o chamado não estiver finalizado.
- Rodapé da loja **dentro** da 1ª folha (não empurra 2ª página). Sem `min-height` estourando.

## v5.17.8
- Tirar peça: captura mousedown/click (não fecha chamado; aviso “Deseja remover esse item?”).
- PDF: assinaturas no **rodapé da folha A4** (`min-height:273mm` + `margin-top:auto`).

## v5.17.7

### 2.1
- Contador antigo do **último chamado** só no **chamado de contrato**.
- Avulso não usa essa regra.

### 4.1 (ambos)
- Busca de peça **só lupa ou Enter** (oninput antigo ignorado).
- Lupa no HTML + observer se o form recriar o input.
- **Tirar** item: aviso `Deseja remover esse item?`

### 4.2 PDF
- Contadores **em branco** (só linha) se o chamado **não** estiver finalizado.
- Finalizado: preenche preto/color.
- Assinaturas mais afastadas do rodapé (`margin-top: 88px`).

Arquivo novo: `ajustes_v5177_patch.js`.

---

## Pendente de teste

- Lupa visível e busca sem letra a letra nos dois forms.
- Remover peça com popup.
- PDF em aberto vs finalizado + espaço das assinaturas.
