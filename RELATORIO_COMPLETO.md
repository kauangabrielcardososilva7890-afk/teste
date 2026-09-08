
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
