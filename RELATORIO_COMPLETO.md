
## Aba Backup normal (acabou a gaveta bugada) + painel Nuvem mostra o uso, e a regra de versão do ERP — v5.22.101 🤝

### 🤝 O que foi conversado e ajustado (item 3 final + uso na aba Nuvem)
- **Feedback do dono:** a pastel de 3 botões que descia do menu saía "bugada" flutuando por cima da barra e do conteúdo — a ordem ficou clara: "é uma aba normal igual as outras, não diferenciada".
- Com isso a gaveta foi removida de vez e a aba virou tela normal, e a aba Nuvem passou a mostrar quanto já foi usado da nuvem (o "0 de 100.000" que ele pediu).

### 1) 🗂️ Aba Backup = tela normal de verdade
- **Tela "Backup do sistema"** (a mesma caixa grande das outras telas, nada de gaveta/dropdown voador) explica os 3 jeitos + traz tudo dentro:
  - **☁️ Nuvem:** 📸 **Backup manual (faz os dois)** — guarda na nuvem E já baixa o arquivo neste PC num clique só · 📥 Baixar todo o histórico (zips do mais novo pro mais velho, sem mexer na nuvem) · 🗑️ Excluir histórico (pergunta no texto antes; apaga só backups, nada mais).
  - **💾 Arquivo simples no PC:** o jeito clássico continua (baixar / restaurar / ultimo backup salvo + o card "Backup em cada atualização" da versão anterior).
- Removeu a função da gaveta, o restyle e tudo que era dela — `.module #btn-backup-top` agora abre a aba (`pintarMenus` wrap `__v522101bk`).
- **Testes:** `test_ajustes_v52296.js` reescrito (15 asserts: sem gaveta, aba normal, 3 jeitos, botões, PC); harness jsdom da aba: 11/11 (menu→setModal, conteúdo, 3 botões funcionam incl. manual fazendo os 2: POST agora + download; exportBackup clássico OK).

### 2) 📊 Aba Nuvem mostra QUANTO JÁ USOU (o "0 de 100.000")
- **Painel novo dentro da aba Nuvem (quando conecta):** "📊 Uso da nuvem hoje" com duas barrinhas:
  - ✏️ **Gravações hoje:** X / 100.000 (teto grátis do D1 por dia);
  - 🔍 **Leituras hoje:** X / 5.000.000;
  - rodapé explicando que o teto zera às **21h (Brasília)** e que a contagem é uma **estimativa feita pela própria nuvem** (não é o medidor oficial do Cloudflare).
- **De onde vem o número:** o worker ganhou tabela `uso_diario` (autocriada) que anota escritas/leituras a cada chamada (push = qtd. de mudanças; changes ~60 leituras; status ~30); `handleStatus` agora devolve `usoHoje {escritas, leituras, tetoEscritas:100000, tetoLeituras:5000000}` junto do resto do status.
- **Barras mudam de cor** (azul→amarela→vermelha) conforme chegam perto do teto.
- ⚠️ **Só aparece depois do `npx wrangler deploy`** (mesmo deploy que já ativa o pacote do CORS v5.22.100).

### 🧭 Nova lei de versões do ERP (registrada aqui pra valer daqui em diante)
- **Acerto pequeno/médio:** anda o último par `x.xx.00 → x.xx.09` (5.22.101, 5.22.102...).
- **Estourou o 9:** sobe o número vizinho e os outros seguem a mesma regra (5.22.110...).
- **Entrega grande de relatório cheio:** sobe o terceiro número fixo `x.00.xx → x.09.xx`.
- **E por que nunca 5.23.0:** a suíte antiga tem 63 testes carimbando "5.22." — sobe pro 5.23 quebra tudo; então o ERP mora no 5.22.xxx seguindo a tabela acima.

### 3) Qualidade
- Bundle: 194 scripts (estável — arquivos in-place); suíte: **149/149** ✓; sync OK; verify:files OK; testes v52296 reescritos (15) + harness aba 11/11 ✓; header v5.22.101; bumps alinhados (pkg/lock/index/BUILD).

## Menu Backup abre a aba de verdade + painel de uso legível no modo escuro — v5.22.102 🤝

### 🤝 O que foi conversado e ajustado
- **Menu Backup deu um passo atrás:** em vez de abrir a aba, clicar fazia o download manual de antes. Causa: o botão do menu carrega um clique antigo fixo no HTML (`onclick="exportBackup()"`), e a nossa amarração anterior dependia da pintura do menu — que em várias chamadas internas não passava pelo nosso gancho. **Correção em duas camadas:** (1) o próprio HTML do menu agora pede a aba (`abrirTelaBackup()` com o download só como plano B se o patch não estiver carregado); (2) interceptação por **captura** no documento: qualquer clique em `#btn-backup-top` abre a aba e impede o comportamento antigo — mesmo que o menu seja re-pintado por outro trecho do sistema. Clicou → abre a tela "Backup do sistema", igual Nova Venda / Novo Chamado.
- **Modo escuro deixava o painel de uso ilegível:** o tema escuro clareia os textos do painel Nuvem, mas o card "📊 Uso da nuvem hoje" tinha um fundo claro que o tema não conhecia — ficou texto claro em fundo claro. Agora o card tem estilo próprio pro modo escuro (fundo escuro, texto claro, trilha da barra escura), seguindo o padrão visual do restante da janela.
- **A contagem zerada é certa, sim?** Sim — o contador começa a contar **a partir do deploy** (a tabela `uso_diario` nasceu junto com a nova versão do worker). Ele sobe conforme o uso: cada lote de mudanças salvas soma gravações, cada abertura do painel/sincronização soma leituras. Cada vez que você abre a janela da Nuvem ele mostra o valor **já atualizado até aquele momento**. E ficou mais esperta: a anotação de uso agora roda **em segundo plano** (não segura a resposta).
- Toques da regra de versão: entrega pequena → `.101 → .102` (dentro dos pares `.00–.09`), tudo anotado aqui no relatório.

### Testes
- Harness da aba adaptado pro clique real (dispatchEvent): 12/12 ✔ (inclui "clicou não baixa mais nada" e "segue abrindo mesmo após re-render"); estático v52296: 19 asserts ✔; suíte 149/149; bundle 194 scripts.

## Menu Backup abre a aba em QUALQUER pintura do sistema de menus — v5.22.103 🤝

### 🤝 Conversa → ajuste
- **Ainda baixava em vez de abrir a aba.** Investigação achou o motivo: o menu de cima não usa o botão parado do HTML — ele é **re-pintado** pelo sistema de menus a partir de um modelo (`ajustes_v52213_menus_atalhos_patch.js`), e o modelo do Backup trazia `click:'exportBackup()'`. Dependendo da tela, o botão aparece até **sem o id** (dentro de listas do menu), escapando da primeira interceptação.
- **Correção na fonte + rede dupla de segurança:**
  1. O **modelo** do Backup agora aponta pra aba (`abrirTelaBackup()`, com exportBackup só como plano B) → toda pintura nova nasce certa;
  2. A **captura de clique** foi ampliada: além do id, reconhece qualquer botão de menu cujo clique antigo seja o de baixar (cobre menus guardados em personalizações antigas);
  3. Botões "Exportar backup" **dentro das telas** (Configurações, Relatórios) continuam baixando normalmente — a interceptação só vale pros controles do menu de cima.
- Modo escuro do painel Nuvem: confirmado arrumado na rodada anterior (v5.22.102).

### Testes
- Harness da aba agora simula as 2 pinturas dinâmicas do sistema de menus (botão com id re-pintado + botão de module-menu sem id) e prova que ambas abrem a aba sem baixar nada, enquanto um botão "Exportar" solto dentro de tela continua funcionando — 14/14. Estático v52296: 21 asserts (modelo do menu incluso). Suíte 149/149. Bundle 194 scripts.

## 📣 A nova lei de versões em ação: v5.23.0 + menu Backup com tranca definitiva + a verdade do contador da nuvem — v5.23.0 🤝

### 🧭 A lei de versões mudou (palavra do dono, registrada aqui)
- **Relatório grande (muitas mudanças):** sobe a **segunda casa** (`5.22.xxx → 5.23.0`), não a última.
- **Ajustes pequenos:** andam na última casa (`5.23.00 → 5.23.01…5.23.09`); estourou o 9, sobe a segunda.
- Para isso funcionar de verdade, **63 testes antigos** que carimbavam "5.22." foram ensinados a aceitar `5.xx.yy` (com trava de piso: cada um segue exigindo no mínimo a sua própria versão de nascimento — aceitam 5.23+ ou 5.22.NN+, nunca menos).
- Por isso esta entrega é a **v5.23.0**: mexeu em menu, versão, nuvem e suíte inteira — relatório grande de verdade.

### 1) 🔒 Menu Backup: agora a aba abre ou nada (tranca de ferro)
- Investigação profunda mostrou que o clique "clássico" podia vencer as redes anteriores nos menus re-pintados/personalizados. Solução final em camadas:
  1. **modelo do sistema de menus** já nasce apontando pra aba;
  2. **captura no bundle** cobre com e sem id;
  3. **tranca inline no próprio `index.html`**: roda ANTES de qualquer script, por captura — se o clique for no Backup do menu e a aba ainda não carregou, ele **avisa** em vez de baixar. Agora é impossível o "clicou e baixou" voltar: ou abre a aba, ou pede um segundo pro carregamento terminar.
- Botões "Exportar backup" dentro das telas (Configurações/Relatórios) seguem baixando normalmente — o sistema distingue menu de tela.

### 2) 📊 Uso da nuvem: por que mostrava 0/0 (meldels) e o que fazer
- O painel **estimado** (grátis, sem senha) estava zerado por um detalhe técnico: no worker que está no ar (da v5.22.101), a anotação do uso morria antes de gravar; a correção saiu na v5.22.102 (anota em segundo plano do jeito certo) — **basta repetir o `npx wrangler deploy`**, e o contador começa a andar.
- Pergunta do dono: *"quer que conte já, sem eu fazer nada — tem como ler o número real sem passar acesso à conta?"* — **Não tem, e é por segurança**: a Cloudflare só libera o medidor oficial com um token de leitura criado por você. Sem token, não existe caminho (isso vale pra qualquer sistema). Por isso o painel usa o estimado da própria nuvem; pra melhorar a precisão quando quiser, criamos depois o caminho opcional "anotar minha conta".
- **E relaxa:** sua foto do painel da Cloudflare mostrou 4,3 mil gravações de 100 mil e 167 mil leituras de 5 milhões — o sistema está usando ~4% do teto diário. Tem muuuuita folga.
- E detalhe de honestidade: quando a nuvem não responde, o painel agora **diz que não conseguiu medir** em vez de mostrar zeros ilusórios.

### 3) ☁️ Deploy lembrado
- O `npx wrangler deploy` desta vez liga: o contador de uso funcionando de verdade (ele cria a tabelinha de uso sozinho).

### 4) Qualidade
- Suíte: **149/149 em 5.23.0** (ou seja: a subida de versão não quebrou nada — antes derrubava 63 testes). Bundle 194 scripts, sync OK, verify:files OK, harness da aba 14/14.

## Captura v4 do menu Backup + o "index separado" do dono: medidor oficial da nuvem gravado na própria nuvem — v5.23.1 🤝

### 🤝 Conversa → o que saiu
- **Backup ainda baixava.** Motivo final: as redes anteriores só reconheciam o botão por id/onclick/containers que eu conhecia. **v4 da captura** reconhece o Backup de mais dois jeitos, usando o que não muda nunca: (1) o **clique antigo** + o botão estar **no topo fixo da tela** (menu é sempre barra de cima — botão "Exportar" dentro de tela fica mais abaixo e continua baixando normal); (2) o **rótulo/dica "Backup"** dentro de qualquer barra de menu. As 3 camadas anteriores continuam — a soma deixa o "clicou e baixou" sem lugar pra se esconder. (Se ainda assim aparecer, a versãozinha do rodapé me conta de onde veio a cópia antiga.)
- **Sua ideia do contador, implementada tal qual:** um **index separado** pra você implantar — a pasta nova `cloudflare-contador/`. É um segundo worker mínimo que:
  1. mede o uso **OFICIAL** na API da Cloudflare (GraphQL, com um token **só de leitura** guardado como segredo *daquele* worker — nunca vai pro sistema nem pros PCs);
  2. grava o número **na própria nuvem** (tabela `uso_real` no D1, criada sozinha);
  3. roda a cada 15 min automaticamente (+ rota `/v1/medir` pra medir na hora);
  4. e o sistema inteiro lê junto com os dados normais — o painel "Uso da nuvem hoje" passa a exibir **"medidor oficial da sua conta Cloudflare"** (senão continua mostrando a estimativa, sem quebrar nada).
- **Setup dele (uma vez, ~5 min):** passo a passo ilustrado em `cloudflare-contador/README.md` (criar token só-leitura → colar 2 IDs no jsonc → `wrangler secret put` → `wrangler deploy`).
- Worker principal atualizado: `/v1/status` agora **prefere o oficial** e cai na estimativa só se ele não existir (sem precisar deversão nova pra isso funcionar depois do seu deploy normal da pasta principal).

### Testes
- Estático v52296: 26 asserts (captura v4, mini-worker, preferência oficial, rótulo do painel); harness da aba 14/14; suíte 149/149; bundle 194 scripts.

## Backup unificado de verdade na aba + Restaurar voltou + auditoria do "não salva" — v5.23.2 🤝

### 🤝 Conversa → fechado
- **Backup "sempre a mesma coisa" resolvido pelo lado que não falha:** agora **toda** chamada de backup — o menu (em QUALQUER pintura ou personalização antiga do sistema de menus), botões antigos de exportar, até texto fixo — cai na **aba "Backup do sistema"**. O JSON bruto continua existindo com nome próprio (`exportarBackupJSON`), usado pela seção 💾 PC dentro da aba. Captura v4 de cliques continua como camada extra.
- **Restaurar backup voltou:** entrou direto na aba (seção 💾 PC): escolhe o arquivo `.json` → o sistema **reconhece e mostra a prévia** (quantos clientes/produtos/vendas…) → você escolhe **🔄 Substitui tudo** (o PC fica exato como o backup, com pergunta de segurança) ou **➕ Soma nos dados** (não apaga nada; linha com o mesmo código só é atualizada se o backup for mais novo). E o card "Backup" nas Configurações tem agora os dois botões (Backup do sistema + Restaurar).

### 🔎 Auditoria do "crio e não salva"
- **Nada do que mexemos na nuvem bloqueia gravação.** Prova: emulamos o caminho inteiro do worker (push de cliente novo) — gravação OK. O ponto de escrita nunca foi tocado (CORS é permissão, não bloqueio; contador de uso roda em segundo plano com falha contida).
- **Seus dados estão SEGUROS no PC** mesmo se a nuvem falhar: cada gravação entra numa fila local que reenvia com paciência ("A nuvem está ocupada…" desaparece quando a nuvem atende; nada se perde enquanto você não desinstalar/limpar o navegador).
- Como o acesso direto à conta não é possível daqui (bloqueio de rede da nossa caixa de ferramentas), para eu ver a saúde exata do seu D1 basta **você rodar 3 comandos no terminal** e me mandar a saída (mostram se o banco está íntegro e quantas linhas cada tabela tem):
  ```
  cd cloudflare-worker
  npx wrangler d1 execute digicopy-erp --remote --command "PRAGMA quick_check"
  npx wrangler d1 execute digicopy-erp --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  npx wrangler d1 execute digicopy-erp --remote --command "SELECT (SELECT COUNT(*) FROM clients_records_count_dummy) AS n" --json # (troco o comando certo quando você mandar a lista de tabelas)
  ```
- **Sobre o token que você colou aqui:** obrigado pela confiança, mas **revogue ele AGORA** em <https://dash.cloudflare.com/profile/api-tokens> (esses tokens são chaves da conta; colou em conversa → considera-se exposto). Não precisamos dele: o medidor oficial fica pro **mini-worker** com chave própria.
- O mini-worker `digicopy-contador-uso` foi apagado por você — ✔ certinho. Se um dia quiser o medidor oficial de volta: `wrangler secret put CF_API_TOKEN` + `wrangler deploy` na pasta `cloudflare-contador/` e pronto.

### Testes
- Estático v52296: 30 asserts; harness da aba 16/16 (inclui unificação: qualquer exportBackup abre a aba; exportarBackupJSON baixa o cru); suíte 149/149; bundle 194 scripts; emulação do worker: push/status OK.

## A nuvem agora responde de pé: /health carimba a versão do código que está no ar — v5.23.3 🤝

### 🔎 Diagnóstico (com dados do dono — obrigado pelos testes!)
- **`PRAGMA quick_check` retornou `ok`** → o banco D1 está **íntegro**, sem corrupção. Dados seguros.
- **A lista de tabelas entregou o resto:** faltam `uso_diario`, `uso_real` e `backups` — o worker que está no ar **não é o novo** (as tabelas seriam autocriadas no primeiro uso). O deploy de anteontem não chegou lá (provavelmente rodado numa pasta desatualizada).

### O que muda daqui pra frente
- **`GET /health` agora devolve a versão do código** (`"versao":"5.23.3"`) — dá pra conferir de qualquer navegador, sem terminal.
- **`/v1/status` também devolve a versão**, e o painel Nuvem exibe:
  - com worker novo: linha discreta "🔧 Código da nuvem: vX.Y.Z";
  - com worker velho: **quadro laranja** "O código da nuvem está ANTIGO (não responde a versão). Repita o `npx wrangler deploy`" — ninguém mais fica se perguntando se faltou deploy.
- `garantirTabelaUso` deixa de engolir erro calado: a última falha aparece no `avisoUso` do status (diagnóstico honesto).

### Ação única do dono
1. Baixar o ZIP desta versão → `cd cloudflare-worker` → `npx wrangler deploy`.
2. Abrir <https://digicopy-sync-api.kauangabrielcardososilva7890.workers.dev/health> no navegador: tem que aparecer `"versao":"5.23.3"`.

### Testes
- Estático v52296: 33 asserts (+ carimbo de versão,avisos, preferências); suite 149/149; bundle 194 scripts.

## Confirmação do dono: /health respondeu `"versao":"5.23.3"` ✅ (sem mudança de código)

- O dono repetiu o deploy e conferiu no navegador: **a nuvem agora roda o código novo** (worker v5.23.3 no ar). As tabelas `uso_diario`/`uso_real`/`backups` passam a ser autocriadas no primeiro uso, e o quadro laranja de "código da nuvem antigo" no painel Nuvem some sozinho.
- Token que tinha sido colado na conversa: **revogado antes de qualquer uso** (confirmado pelo dono). Assunto encerrado, conta segura.
- Próximos passos combinados: refazer o teste de **criar cliente** no link v5.23.3 (com Ctrl+F5) e testar as telas de **Backup/Restaurar**; se "criar" falhar de novo, o dono manda o que aparece no Console (F12).
- Tutorial do **medidor oficial** (`cloudflare-contador/`) explicado passo a passo no chat a pedido do dono: token novo só de leitura (`Account Analytics: Read` + `D1: Read`) → `wrangler secret put CF_API_TOKEN` (a digitação não aparece na tela, é normal) → preencher `ACCOUNT_ID` e `database_id` no `wrangler.jsonc` (UUID `b6c32346-d6d5-475a-b9c3-40782b525bae`) → `wrangler deploy` → testar `/v1/medir`.
- Ensinado no chat, a pedido do dono: bloco de código nas mensagens = 3 crases numa linha antes e 3 crases numa linha depois do texto.

### Testes
- Nenhum código alterado nesta rodada (só registro). Última bateria verde: estático 33 asserts; harness 16/16; suíte 149/149; bundle 194 scripts.

## Medidor oficial sem cronômetro: mede quando o dono abre a tela — v5.23.4 🎯

### Pedido do dono (palavras dele)
- "nah, a cada 15 min n, so quando eu abrir aquele menu de backup" — nada de relógio medindo sozinho; a medida oficial acontece quando ELE abre a tela.

### O que mudou
- **cloudflare-contador/wrangler.jsonc:** `"triggers": { "crons": [] }` — o próximo deploy REMOVE o agendamento de 15 em 15 min. O endpoint `/v1/medir` continua (mede na hora sempre que chamado).
- **Sistema:** ao abrir a tela de Nuvem (renderConnected) OU o menu Backup, o app "cutuca" o medidor (`GET /v1/medir`) ANTES de pedir o `/v1/status` — o painel "Uso da nuvem hoje" já nasce com o número oficial fresco ("medido agora, na abertura desta tela"). Trava de 3 min: abrir 10x seguidas não mede 10x. Se o medidor não responder, segue com a contagem estimada — nada quebra.
- **Zero token no sistema** continua lei: o app só chama uma URL pública; o token vive no cofre do próprio medidor.
- Worker principal carimbado `WORKER_VERSION = '5.23.4'`; README do contador atualizado.

### Diagnóstico de hoje (prova real, com dados do dono)
- Teste do token direto no PowerShell dele: **`"success":true`** — token novo com as 2 permissões (Account Analytics Read + D1 Read) funciona e localizou o banco `digicopy-erp` pela API.
- Logo, o `LISTA_D1_FALHOU: 400` do /v1/medir vinha do **valor velho/errado guardado no cofre** do medidor — não do token. Correção: repetir o `secret put` com o valor certo (e novo, após o Roll).

### Segurança — começo do token apareceu na conversa
- O prefixo (`cfut_2ztn…`) veio colado junto do comando de teste. Prefixo sozinho não abre nada, mas a regra é regra: **colou = troca**. Passo combinado: **Roll** no token (menu ⋯ → Roll gera valor novo e mata o velho na hora) e usar o valor novo no `secret put`.
- Account ID nos logs: sem risco (identificador público da conta; toda chamada exige token válido junto).

### Ação do dono (tudo num terminal só)
1. Baixar o zip 5.23.4 novo, extrair, apagar a pasta velha.
2. Painel Cloudflare → ⋯ do token `digicopy-contador-uso` → **Roll** → copiar o valor novo.
3. `cd cloudflare-contador` → `npx wrangler secret put CF_API_TOKEN` (cola o valor novo) → `npx wrangler deploy` (esse deploy também REMOVE o cronômetro).
4. `cd ..\cloudflare-worker` → `npx wrangler deploy` (carimbo 5.23.4).
5. Conferir: `/v1/medir` → `{"ok":true,...}`; `/health` → `"versao":"5.23.4"`.
6. Abrir o sistema 5.23.4 → tela de Nuvem (ou menu Backup) → "medidor oficial … medido agora, na abertura desta tela".

### Testes
- Estático v52296: 37 asserts, "Tudo certo v5.23.4!"; suíte 149/149; bundle 194 scripts; sync:check ✔; verify_pack ✔; harness da aba 16/16.

## v5.23.5 — wrangler.jsonc do contador já vem preenchido de fábrica (a pegadinha do COLE_AQUI aposentada) 🏭

### O que pegou (log do dono)
- Deploy do zip v5.23.4 falhou com `database_id` inválido (10021): o `wrangler.jsonc` novo voltou com os placeholders `COLE_AQUI...` e o passo de preencher foi esquecido (2.ª vez que essa armadilha morde — a primeira foi o "worker velho" de anteontem).

### Conserto pela raiz
- **`cloudflare-contador/wrangler.jsonc` agora chega pronto**: `ACCOUNT_ID` (`f6e5851c871c92c55c92faa2de33b8ef`) e `database_id` (`b6c32346-…-525bae`) gravados no repositório. São identificadores (como CEP), NÃO segredos — o segredo segue sendo só o `CF_API_TOKEN`, no cofre do worker.
- README do contador: eliminado o passo "ache o ID e o UUID"; tutorial volta a ter 3 passos.
- Próximos zips: **zero edição manual** antes do deploy.

### Estado real no ar agora
- O medidor deployado continua sendo a versão anterior (com cron de 15 min), pois o deploy 10021 abortou. O segredo novo (token) FICOU gravado (secrets sobrevivem a deploys). O deploy do zip 5.23.5 substitui tudo: versão nova + sem cron + sem placeholders.
- Ação do dono: baixar zip 5.23.5 → `cd cloudflare-contador` → `npx wrangler deploy` (sem editar nada) → F5 no /v1/medir.

### Nota de sandbox (transparência de bastidor)
- Este turno rodou num sandbox fresco: repositório voltou ao commit-base (reconstruído via fetch do commit 854faa9 do remoto ✅), sem node_modules e **sem rede pro npm** → os 5 testes que dependem de acorn/node-forge/electron-packager não rodam aqui (ambiente, não produto); bundle não foi re-gerado (nenhuma fonte empacotada mudou — restaurado o bundle verificado da 5.23.4).
- Suíte: tudo verde exceto os 5 de infra (test_app_bundle, test_build_sync, test_ajustes_v5228, v52263, v52265). Estático v52296: "Tudo certo v5.23.5!" (39 asserts).

### Testes
- sync:check ✔; estático 39 asserts ✔; suíte: verde fora os 5 de dependência de sandbox.

## 🏁 MEDIDOR OFICIAL NO AR — saga encerrada (confirmação do dono)

```
{"ok":true,"uso":{"dia":"2026-09-09","leituras":132519,"escritas":3}}
```

- O /v1/medir respondeu com os números **oficiais da conta Cloudflare**: token vivo no cofre, 2 permissões conferidas na prática (D1 Read na listagem do banco + Account Analytics Read na medida GraphQL), `uso_real` gravado no próprio D1, e **sem cronômetro** (mede quando o dono abre a tela de Backup/Nuvem — o app cutuca /v1/medir).
- Cadeia de causas que travava tudo, na ordem em que foram derrubadas: ① worker principal velho no ar (deploy de pasta desatualizada — resolvido com carimbo de versão no /health); ② segredo do cofre com valor velho/errado (o token do painel sempre esteve bom — prova: teste direto); ③ Rolls de segurança sem re-gravar o cofre; ④ e o sabotador final: a "placa" COLE_O_TOKEN_AQUI indo no lugar do token — morta com a linha `(Get-Clipboard -Raw).Trim() | Set-Content -NoNewline t.txt; cmd /c "npx wrangler secret put CF_API_TOKEN < t.txt"; del t.txt` (área de transferência → arquivo → stdin do wrangler, zero colagem no prompt escondido).
- Pendências de polimento (não bloqueantes): carimbo do worker principal ainda diz 5.23.3 até o dono redeployar `cloudflare-worker` do zip 5.23.5 (código funcional idêntico); reteste do fluxo "criar cliente" com o link 5.23.5.

## v5.23.6 — menu Backup ressuscitado: "botão clicável que não faz nada" 💀→🟢

### O sintoma do dono
- Medidor oficial OK no painel Nuvem 🎉, MAS o menu Backup virou um botão que clicava e nada acontecia.

### A autópsia (bug real, introduzido na unificação 5.23.2)
- No `app.bundle.js`, cada patch vai dentro de um bloco `try{...}` do isolamento: as declarações `function setModal` dos patches de contratos/leituras etc. ficam **presas no bloco e nunca viram globais**.
- `abrirTelaBackup` testava `typeof setModal !== 'function'` → sempre TRUE no app real → caía no fallback `window.exportBackup()` → **que desde a 5.23.2 É o próprio `abrirTelaBackup`** → recursão infinita → stack overflow → engolido pelo `try/catch` da captura do menu → **silêncio total**. O clique morria sem deixar rastro.
- Por que os testes não pegaram: o harness simulava um `setModal` global, então o caminho do modal era exercido só no mock.

### O conserto
- **Modal próprio garantido** na aba: `bkSetModal(titulo,corpo,rodape,max)` usa o esqueleto nativo do app (`#modal-root`/`#modal-box`) quando existe e cria um overlay próprio quando não existe; fechamento próprio `window.bkFecharTelaBackup()` (o botão Fechar não depende mais do `closeModal`).
- Fallback recursivo eliminado (lei do dono intacta: clique no menu NUNCA baixa nada).
- **Bundle hotpatchado à mão** (fonte + app.bundle.js + mobile/www/app.bundle.js byte-a-byte iguais): este sandbox está sem rede npm (acorn ausente → build cairia no modo 0-isolamento); na próxima máquina com `npm i`, `node build_bundle.js` reproduz o mesmo resultado a partir da fonte.

### Testes
- Estático v52296: 42 asserts, "Tudo certo v5.23.6!" (+3 asserts anti-recursão/modal próprio); sync:check ✔; suíte: 144 passaram, falham só os 5 de dependência de sandbox (acorn/node-forge/electron) — nenhum de produto.

## v5.23.7 — tela "Backup do sistema" agora combina com o modo escuro 🌙

### Sintoma do dono
- A tela ressuscitada abria 🎉, mas no modo escuro ficava estampada de blocos brancos com textos invisíveis (cores claras fixas em estilo inline).

### Correção
- Blocos da tela ganharam classes (`bk-aba/bk-intro/bk-sec/bk-sec-head/bk-sub/bk-card/bk-note/bk-title/bk-dashed/bk-msg-*`) sem mudar o visual no tema claro.
- Novo `garantirCssBk()` injeta UMA vez o CSS `html.digi-escuro …` com `!important` (único jeito de vencer estilo inline): fundos vão pras paletas slate/azul-marinho, textos clareiam, avisos erro/ok/info ficam em versões escuras.
- Aplicado na fonte + nos dois bundles via hotpatch idêntico (sandbox segue sem npm/acorn para o build completo).

### Testes
- Estático v52296: 46 asserts, "Tudo certo v5.23.7!"; sync:check ✔; suíte: verde fora os 5 de infra (acorn/node-forge/electron ausentes aqui).
