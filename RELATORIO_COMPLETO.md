
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
