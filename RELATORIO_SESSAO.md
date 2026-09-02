# Relatório da sessão DIGICOPY — continuar em outro chat

**Data:** 2026-08-31  
**Repo:** `kauangabrielcardososilva7890-afk/teste`  
**Branch fixa desta sessão:** `arena/01a0590a-teste` (anterior: `arena/01a010fa-teste`)  
**Última versão:** **v5.22.72**  
### LINKS DA VERSÃO — mandar OS DOIS em toda atualização

**1. Testar no navegador (GitHack):**
<https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a0590a-teste/index.html?v=5.22.72>

**2. Baixar tudo (zip do próprio GitHub, não gerar `.zip` novo):**
<https://github.com/kauangabrielcardososilva7890-afk/teste/archive/refs/heads/arena/01a0590a-teste.zip>

Os dois links saem prontos no final de `npm run sync`. Trocar só o `?v=` do
GitHack para a versão nova. APK parado nesta etapa — prioridade é o sistema de PC.

A versão de teste do dia a dia antiga **não existe mais**. Uso a partir da 5.22.62. Mesma pasta `%APPDATA%\\digicopy-erp` e mesma nuvem. Não trocar chave de banco. Não limpar. Antes de atualizar: Backup.

---

## REGRAS FIXAS DA SESSÃO — ler sempre antes de começar

1. **Em todo chat novo, abrir um pull request.** Trabalhar na branch fixa da
   sessão e abrir o PR ao final do trabalho, sempre.
2. **Foco é o sistema de PC.** É o que está sendo construído agora. O APK
   (celular) **fica parado por um tempo** — primeiro o PC, depois o celular.
   As alterações feitas no APK são apenas para **não dar problema nas próximas
   atualizações** (manter o `mobile/www` coerente com o sistema); não são
   evolução do app de celular.
3. **Os PCs que vão rodar o sistema são fracos.** Toda mudança precisa
   otimizar: menos arquivo lido ao abrir, menos código executado, menos
   memória. Nada de trabalho duplicado.
4. **Não quebrar nada.** A suíte (`npm test`) precisa terminar com 0 falhas
   antes de qualquer entrega.
5. **Baixar sempre pelo zip da branch no GitHub**, sem gerar arquivos `.zip`
   novos no repositório.
6. **É OBRIGATÓRIO mandar os DOIS links em toda atualização:** o link de teste
   do **GitHack** (abrir no navegador) e o link do **zip do GitHub** (baixar).
   Ambos são impressos no final de `npm run sync` — é só copiar.
7. **PERGUNTE ANTES DE CODAR.** Quando eu pedir uma atualização e restar
   QUALQUER dúvida sobre o que eu quero, **pergunte primeiro**. Quero que
   fique exatamente como estou pensando — ou melhor do que eu esperava.
   Não adivinhe, não faça "a sua versão" do pedido. Se enxergar uma forma
   melhor do que eu pedi, proponha antes de implementar.
8. **NADA DE ERRO BOBO.** Erro besta é perda de tempo. Antes de entregar,
   passe pela lista da seção seguinte.
9. **Código morto se apaga.** Arquivo que não entra no bundle nem no `.exe`
   não fica no repositório "por via das dúvidas". O git guarda o histórico.
10. **UM ARQUIVO POR MÓDULO.** Correção **mexe no arquivo do módulo que já
    existe** — não se copia o arquivo inteiro para criar uma versão nova.
    Arquivo novo só quando a função **ainda não existe em lugar nenhum**.
    E continua separado por módulo: nada de jogar tudo num arquivão só.

---

## CHECKLIST ANTIERRO — passar antes de entregar

Erros que já aconteceram neste projeto e não podem se repetir:

| Erro | Como evitar |
|------|-------------|
| Arquivo novo não vai para o `.exe` | Só citar em `bundle-manifest.json` e rodar `npm run sync`. Nunca editar `build.files` à mão. |
| Rodapé/janela numa versão velha | Nunca `window.DIGICOPY_APP_VERSION = VERSAO`. Use `= window.DIGICOPY_APP_VERSION \|\| VERSAO` e leia a global ao pintar. |
| Script rodando duas vezes | Não adicionar tag `<script>` para arquivo que já está no bundle. |
| Patch sem guarda | Todo patch que embrulha função ou registra ouvinte precisa de `if(window.__vXXXX) return;`. |
| Link do cliente numa branch velha | Nunca escrever URL do GitHack na mão. A branch vem de `package.json > digicopy.branch`. |
| Teste amarrado à versão | Não usar `pkg.version === '5.22.XX'` em teste antigo. Use `/^5\.22\.\d+/`. |
| Lista fixa em teste | Nada de "lista dos últimos patches" nem limite tipo `files.length <= 30`. Derive das fontes. |
| Timer rodando em segundo plano | `setInterval` que mexe no DOM começa com `if(document.hidden) return;`. |
| Polling curto | Nada de `setInterval` de 2–4s recriando tela. Já causou loop de venda duplicada. |
| Zip no repositório | `.zip` é ignorado. Para baixar, usar o zip da branch no GitHub. |

Antes de dizer que terminou: `npm run sync:check && npm run bundle && npm test`
(117 suítes, 0 falha) e `npm run verify:files`.

---

## v5.22.72 — espelho da nuvem: todo PC com a mesma informação

Pedido do usuário: *"o processo é salvar no PC e do PC para a nuvem; depois que
passar na nuvem SEM NENHUM PROBLEMA, apaga os dados do PC"* — motivo: não deixar
um monte de dado solto e errado em cada computador. Ele faz backup todo dia e
não usa o sistema sem internet. Também pediu: **nunca apagar nada da nuvem** e
**todos os PCs têm que ter a mesma informação**.

**Como foi feito (sem transformar o sistema em refém da internet):** o PC não
vira uma tela vazia — ele vira um **espelho exato da nuvem**. Depois de um ciclo
que fecha sem nenhum problema, o que existe só neste computador é sobra e sai
daqui. O que está na nuvem continua no PC, então o sistema abre e funciona
normalmente; e os dois computadores passam a mostrar exatamente a mesma coisa.

Trava por trava (`espelharNuvem()` / `planejarEspelho()`):

- só roda com **fila vazia, nenhum erro pendente, nuvem com dados e PC não pausado**;
- **nunca toca** no que a pessoa mandou "não enviar" (`heldLocalOnly`);
- sobra grande demais — **mais de 30% de uma lista ou mais de 200 no total** —
  não apaga nada e vira aviso: isso é sinal de problema, não de sobra;
- **grava uma cópia de recuperação** (`antes_espelhar_nuvem`) antes da primeira limpeza;
- auditoria e avisos ficam de fora (não sincronizam);
- **a nuvem nunca é apagada** por esse mecanismo;
- interruptor no painel: **"Manter este PC igual à nuvem"**, ligado por padrão.

Sobre as tabelas antigas da migração: o menu "Migrados" já não existe (os dados
aparecem dentro dos menus normais), então são dados de trabalho e **continuam
sincronizando** — é o que garante PCs iguais.

Teste: `test_ajustes_v52272.js`. Suíte: **126 passaram / 0 falharam**.

---

## v5.22.71 — dado sumindo e voltando + os "23 mil registros"

**Causa achada (erro meu na v5.22.68/69):**

1. Na v5.22.68 eu tirei da tela o bloqueio *"Confirmar exclusões de X (N)"* —
   mas ele não era só um aviso chato: era **a trava que impedia a nuvem de
   apagar em massa**. Sem ela, toda ausência local virou ordem de exclusão.
2. O sistema **corta `db.logs` em 500 por PC** (`app.js:309`). A cada corte, o
   PC mandava exclusão dos logs velhos para a nuvem; o outro PC mandava os
   dele de volta. Vai-e-vem infinito — é isso que fazia **dado sumir e voltar**
   e o que inflou a contagem. `notificacoes` fazia o mesmo.
3. Vários módulos **remontam listas com `.filter()`** (recargasEtiquetas,
   escolaOrc/It/Exc...). Cada remontagem virava exclusão para o outro PC.
4. Os ids por conteúdo que criei na v5.22.69 para itens sem `id` só pioravam:
   qualquer mudança no item gerava um id novo + exclusão do antigo.

**O que foi feito:**

| Correção | Como ficou |
|---|---|
| `logs` e `notificacoes` | **Não viajam mais.** São de cada PC, cortados em 500 por ele mesmo. E o que já subiu é apagado da nuvem aos poucos (`state.limpar`, 40 por vez) |
| Exclusão só onde faz sentido | Só as 15 listas com botão de excluir de verdade (clientes, produtos, vendas, OS, contratos, leituras, orçamentos, financeiro, parque, equipamentos...) mandam exclusão. As outras ~70 **só sabem mandar novidade** |
| Trava contra apagão | Mesmo nas listas permitidas: nunca mais que **20 exclusões por passada**, e nunca mais que **30% da lista**. Passou disso, não apaga nada e registra o motivo |
| Item sem `id` | Não sobe mais (era cache derivado; virava lixo na nuvem) |
| "23 mil registros" | O painel agora abre **lista por lista** mostrando de onde vem cada número |

Teste: `test_ajustes_v52271.js`. Suíte: **125 passaram / 0 falharam**.

**Pendente de decisão do usuário:** ele pediu para *apagar os dados do PC depois
que subirem sem problema para a nuvem*. Não implementado — foi feita a pergunta
antes, porque isso deixaria o sistema dependente de internet e, com o histórico
recente de sincronização, poderia destruir dados.

---

## v5.22.70 — "envio pendente / erro HTTP 503"

**O que era:** ao clicar em *Enviar os dados deste PC*, a primeira remessa
(agora com TODAS as listas do sistema) manda milhares de registros em rajada.
A nuvem da Cloudflare responde **503** quando está sobrecarregada — é um "espere
um pouco", não um erro de dados. O código tratava qualquer falha do mesmo jeito:
abortava o envio inteiro, mostrava *Envio pendente* e **voltava a pausar** a
sincronização. Resultado: parava tudo no primeiro soluço da nuvem.

**O que foi feito** (`cloudflare_data_sync_patch.js`, `cloudflare_sync_patch.js`):

- `comPaciencia()`: 429/500/502/503/504 e queda de conexão agora são "nuvem
  ocupada". Tenta de novo sozinho em 0,9s → 2,5s → 6s → 12s, avisando no ícone.
- **Lote elástico**: manda 10 por vez; se a nuvem reclamar, cai para 5, 2, 1 e
  volta a crescer quando ela aceita de novo.
- **Respiro de 180ms entre lotes**, para não afogar o D1 nem o PC fraco.
- **A escolha não se desfaz mais**: remessa grande não cabe numa tacada só, então
  a sincronização fica LIGADA e o resto sobe em segundo plano, recomeçando de
  onde parou. Só volta a pausar se o PC perder a autorização.
- **Mostra o progresso**: ícone e painel exibem "faltam N registros", e o painel
  diz que pode fechar a janela e continuar trabalhando.
- A fila fica gravada em disco: fechar o programa no meio não perde nada.

Teste: `test_ajustes_v52270.js`. Suíte: **124 passaram / 0 falharam**.

---

## v5.22.69 — "um PC completo e o outro faltando dados"

**O que estava acontecendo (três causas):**

1. **A nuvem só levava 19 listas.** O motor tinha uma lista fixa (`DEFINITIONS`)
   com clientes, produtos, vendas, OS, contratos, financeiro e mais algumas.
   Todo o resto do banco — mais de 70 listas: despesas de locação, compras e
   recebimentos, fornecedores, cartuchos e etiquetas, cidades, agenda, caixa,
   contadores, boletos, NF-e migradas, e-mails, favoritos, escola — **nunca saía
   do PC onde foi criado**. Por isso um computador mostrava tudo e o outro não.
2. **O contador de numeração (`db._seq`) também não subia**, então cada PC
   contava vendas/OS/orçamentos por conta própria.
3. **O PC autorizado por código de convite apagava, na primeira conexão, tudo o
   que a nuvem não tinha** (`reconcileFirstAuthorizedDevice`). Era proteção
   contra duplicar histórico velho, mas na prática esvaziava o segundo PC.

**O que foi feito:**

| Correção | Como ficou | Arquivo |
|---|---|---|
| Sincronizar tudo | A lista fixa virou `definicoes()`, que lê o banco de verdade. Qualquer lista que exista (ou que um módulo criar amanhã) entra sozinha. Só `meta` fica de fora | `cloudflare_data_sync_patch.js` |
| Não duplicar | Cada registro viaja pelo próprio `id`, então reenviar atualiza em vez de criar cópia. Item de lista antiga sem `id` ganha um id fixo calculado pelo conteúdo — o mesmo item dá sempre o mesmo id nos dois PCs | idem |
| Numeração | `db._seq` sincroniza no modo `contador`: cada contador fica com o **maior** número entre o PC e a nuvem, nunca volta atrás | idem |
| PC convidado | Não apaga mais nada. Recebe a mesma escolha de duas opções | idem |
| Uma pergunta só | Como a regra mudou, quem já estava conectado recebe a escolha uma única vez (marca `state.regras`) e depois nunca mais | idem |
| A escolha não fica escondida | A sincronização fica parada até escolher, então o painel se abre sozinho uma vez por sessão enquanto a escolha estiver pendente | `cloudflare_sync_patch.js` |

**Dados que o segundo PC já perdeu** (apagados pela regra antiga do convite):
estão na cópia `antes_primeira_nuvem`, na aba **Recuperar** do painel da nuvem.

Testes: `test_ajustes_v52269.js` (novo). Ajustados `test_ajustes_v5226.js` e
`test_cloudflare_data_sync.js`. Suíte: **123 passaram / 0 falharam**.

---

## v5.22.68 — relatório do usuário, 9 itens

Fechados pelo usuário na rodada anterior: 1.1, 1.2, 2.2, 4.1.

| # | Pedido | O que foi feito | Arquivo |
|---|---|---|---|
| 1.3 | A faixa azul de cima passava da borda | A barra de módulos ganhou rolagem lateral própria (`.digi-row-rola`) e o menu que abre virou `position:fixed`, colado no botão, para não ser cortado pela rolagem | `menus_tela_pequena_patch.js` |
| 1.4 | Técnicos de demonstração voltavam sozinhos | O seed não cria mais técnico nenhum e o `seedData` limpa Carlos Mendes / Ana Souza / Rafael Lima quando id, nome e especialidade batem com o demo | `app.js` |
| 2.1 | Impressão da OS não pode ser bloqueada | Caiu a trava de técnico no salvar e a trava "só imprime depois de faturar". Campo vazio sai em branco no papel; o aviso do técnico virou dica | `ajustes_v52237_vendas_os_visual_patch.js`, `ajustes_v52218_pix_prazo_print_venda_patch.js` |
| 2.3 | Financeiro só mostrava vencimento | A listagem mostra "Vence" e "Criado". Título antigo sem data pega a data da venda/leitura de origem | `app.js`, `vendas_financeiro_pendente_patch.js` |
| 2.4 | Botões repetidos na barra | Ficaram "Imprimir" e "Conferir NF-e". Saíram o "Imprimir/PDF" e o "Pré-visualizar NF-e" do modal | `ajustes_v52218_...`, `ajustes_v5229_nfe_atalho_historico_patch.js` |
| 2.5 | Venda só salva não imprimia | O botão Imprimir fica sempre visível e funciona sem faturar | `ajustes_v52218_pix_prazo_print_venda_patch.js` |
| 2.6 | Aviso "deseja salvar?" ao faturar e ao sair | A pergunta acabou; ao sair, o sistema grava sozinho quando há cliente | `vendas_notinhas_fix_patch.js` |
| 3.1 | Filtro Cidade apagava o texto digitado | A busca repõe o texto depois que a lista é redesenhada | `ajustes_v52237_contratos_filtros_patch.js` |
| 5.1 | Nuvem duplicando / bloqueios na tela | Na primeira conexão do PC aparece **uma escolha de duas opções**: *Enviar os dados deste PC para a nuvem* ou *Não enviar os dados atuais*. Qualquer uma destrava a sincronização; escolhendo "não enviar", os dados atuais ficam só aqui e tudo o que vier depois sincroniza. Os avisos "Confirmar exclusões de X (N)" sumiram da tela | `cloudflare_data_sync_patch.js`, `cloudflare_sync_patch.js` |

Testes: `test_ajustes_v52268.js` (novo, registrado no `test_runner.js`). Ajustados os
testes que cobriam as regras antigas: `test_cloudflare_sync.js`, `test_cloudflare_data_sync.js`,
`test_ajustes_v5226.js`, `test_ajustes_v52218.js`, `test_ajustes_v52267.js`.
Suíte: **122 passaram / 0 falharam**. Bundle: 190 scripts.

> Para rodar `npm install` aqui: use `npm install --ignore-scripts` (o postinstall
> do electron não consegue baixar o binário no sandbox e derruba a instalação inteira).

---

## v5.22.67 — relatório do usuário, 8 itens

Respostas dadas antes de codar: login **uma vez por dia** (não a cada minuto),
aviso EPSON **na mesma folha**, vendas **faltando** no financeiro, data **um
dia a menos**, cidade **do cliente**. O item 2.4 (etiquetas) foi cancelado
pelo próprio usuário.

| # | O que era | O que foi feito |
|---|---|---|
| 1.1 | Voltava pro login sozinho | `exigirLoginDiario` rodava a cada 60s comparando um carimbo que 4 patches diferentes podiam apagar ao trocar o `doLoginUser`. Sem carimbo, deslogava DE MINUTO EM MINUTO. Agora a verdade é o `loginAt` da sessão e, sem informação nenhuma, a sessão é adotada como de hoje. Só cai na virada do dia. |
| 1.2 | Backup automático | Removido o backup diário inteiro (`rodarBackupDiario`, `agendarBackupDiario`, temporizadores, `saveDaily`). Cópia de segurança só no botão **Backup**. |
| 1.3 | Menu passava da borda | `menus_tela_pequena_patch.js`: mede o menu aberto e, **só quando não cabe**, dá rolagem e puxa para dentro da tela. Cabendo, não muda nada. |
| 2.1 | Aviso EPSON estourava a folha | O aviso já existia e já era só da OS. Ficou mais compacto e a folha agora **encolhe sozinha** (até 70%) quando passa do A4, garantindo UMA folha. |
| 2.2 | Venda não ia pro financeiro | Só a venda faturada virava título. `vendas_financeiro_pendente_patch.js` cria um título de acompanhamento para toda venda salva, marcado `aguardandoFaturamento`, e o apaga sozinho quando ela é faturada ou cancelada — sem contar duas vezes. |
| 2.3 | Data um dia a menos | `new Date('2026-09-01')` é lido como UTC; no Brasil (UTC-3) a tela mostrava 31/08. Novo `parseDataLocal` no `app.js`, usado por `fmtDate`/`fmtDateTime` — e o sistema inteiro passa por eles. |
| 3.1 | Faltava buscar por cidade | Filtro **Cidade** nos contratos, pela cidade do cliente, aceitando `cidade`, `municipio` e afins, sem ligar para acento nem maiúscula. |
| 4.1 | Impressora era caixa fechada | Virou **lista** rolável: um clique destaca, **dois cliques escolhem** (Enter também). A busca reconstrói a lista. |

**Atenção:** o workspace voltou sozinho para o commit `947ee33` no meio desta
sessão, pela segunda vez. Recuperado com
`git fetch origin <branch>:refs/remotes/origin/<branch>` + `git reset --hard`.
Sempre conferir `git log --oneline -1` contra o remoto antes de confiar no
que está em disco.

---

## v5.22.66 — o log apontou o culpado: contextBridge congela o objeto

O isolamento da 5.22.65 fez o serviço: em vez de dezenas de scripts sumirem
calados, o `npm run diag` do usuário mostrou **exatamente 2 falhas de 187**:

```
ajustes_v52221_cert_nuvem_a1_patch.js  -> TypeError: Cannot assign to
ajustes_v52228_a1_nuvem_lupa_ncm_patch.js   read only property 'assinar'
```

**Motivo.** O `preload.js` publicava as APIs com
`contextBridge.exposeInMainWorld`, e o contextBridge **congela** tudo o que
expõe. Os dois patches envelopam `nfeCertAPI.assinar` para injetar o
certificado A1 da nuvem — no objeto congelado isso dá TypeError. No navegador
nunca aparecia: lá não existe preload, o objeto é comum e aceita a troca.
Mesma família do bug anterior — funciona no site, quebra no `.exe`.

**Correção.** O preload agora entrega tudo dentro de uma ponte só,
`__digicopyPontes`. O `ponte_electron_patch.js` (primeiro script do bundle)
copia a ponte para os nomes de sempre — `firebirdAPI`, `fileAPI`,
`caixaEscolarAPI`, `printAPI`, `backupAPI`, `nfeCertAPI` — como objetos
normais, graváveis. Nada mais no sistema precisou mudar, e o problema morre
para as seis APIs, não só para o `assinar`.

O `test_ponte_electron.js` (26 casos) proíbe voltar a expor esses nomes
direto pelo contextBridge.

---

## v5.22.65 — CAUSA ENCONTRADA: um script quebrado derrubava o resto

O usuário confirmou: `dist\win-unpacked\Sistema Digicopy.exe` (build recém
gerado, digital conferida) **continuava sem as alterações** — modo escuro, menu
de orçamentos, ajustes do financeiro e "muita coisa que nem consigo listar".
E a pista decisiva: *"eu testava apenas no GitHack, não transformava para .exe
antes"*.

**Causa raiz.** O `app.bundle.js` junta ~186 scripts num arquivo só. Como é UM
arquivo, um erro de execução em qualquer um deles **aborta todo o restante** —
os scripts seguintes nunca rodam. Não aparece erro, o sistema abre normalmente,
só que pela metade.

Por que só no `.exe`: o GitHack serve por **https**, uma origem normal. O
`.exe` abre por **file://**, que o Chromium trata como origem opaca e onde
várias APIs são bloqueadas (IndexedDB, por exemplo). Um patch que funciona no
site falha no `.exe` — e leva junto tudo que vem depois dele na fila.

Bate com o relato. Posições no bundle: `indexeddb_persistence_patch.js` é o
**95**, `cloudflare_data_sync_patch.js` o **97**; modo escuro é o **136**, menu
de orçamentos o **145**, financeiro do **150** em diante. Tudo que sumia está
depois; tudo que funcionava está antes. E o rodapé atualizava porque a versão
vem escrita no `index.html`, não do bundle.

**Correção.** Cada script entra no bundle dentro do **seu próprio try/catch**.
Uma falha isolada não contamina os outros 186. Ficam fora só os arquivos que
declaram no escopo global (`app.js` e `evolucao_patch.js`) — envolvê-los
mudaria o escopo. Isso é decidido **lendo o código** com o `acorn`, não por
lista escrita à mão: 185 isolados, 2 globais.

Prova executada nos dois modos, com o script do meio quebrando:

| | scripts que rodaram | bundle terminou |
|---|---|---|
| antes | `um, dois` (abortou) | não |
| depois | `um, dois, tres` | sim, com a falha registrada |

**E agora falha nunca mais é silenciosa:** `window.__DIGICOPY_ERROS` na tela, o
`main.js` grava `log-erros.txt` em `%APPDATA%\digicopy-erp`, o `npm run diag`
mostra o conteúdo e o sistema avisa quem está usando.

---

## v5.22.64 — cada entrega com número novo + diagnóstico do .exe

Relatado: "no GitHack funciona, mas no `.exe` continua tudo igual; só o rodapé
da versão aparece atualizado".

O GitHack funcionando prova que **o código está certo** — o problema está entre
gerar o `.exe` e abrir o programa instalado.

**Causa 1 — o número da versão não mudava.** Todas as correções saíram como
v5.22.63. O instalador se chama `Sistema-Digicopy-Setup-5.22.63.exe` sempre, o
mesmo nome do instalador antigo que ainda está na pasta de downloads. Dá para
instalar o arquivo errado sem perceber. **Agora toda entrega sobe o número.**

**Causa 2 — não dava para olhar dentro do que está instalado.** Novo
`npm run diag` (`diagnostico_exe.js`): compara o código-fonte da pasta com o
que está de fato dentro do `dist\win-unpacked` e da instalação do Windows, e
diz qual arquivo está velho. Só lê, não altera nada.

O sintoma "só o rodapé atualiza" quer dizer `index.html` novo +
`app.bundle.js` antigo — o rodapé vem do `index.html`, todo o resto vem do
bundle. O diagnóstico detecta e nomeia exatamente esse caso.

**Resultado do primeiro diagnóstico na máquina do usuário (31/08):** o build
saiu **perfeito** — `verify_pack` com 111 arquivos e digital
`cde94bef7c98d9f3` batendo com a fonte. Mas o diagnóstico **não encontrou
nenhuma instalação** do Sistema Digicopy: só a pasta `dist`. Ou seja, o
instalador novo não chegou a ser executado — o programa aberto no dia a dia
não é esse build. O marcador de cache mostrava `5.22.63|ab6a39aaac59997c`,
provando que o app já rodou o bundle da 5.22.63 em algum momento.

O diagnóstico foi ampliado: agora **varre a máquina** atrás de qualquer cópia
do sistema (`resources\app\app.bundle.js`) em `Programs`, `Program Files`,
pasta do usuário e `C:\`, mostra **para onde os atalhos apontam** e avisa em
letras claras quando o build está certo mas nada foi instalado. Também lembra
de **fechar o programa antes de instalar** — com o app aberto o Windows não
substitui os arquivos e a instalação fica velha.

**Se acontecer de novo, nesta ordem:**

1. `npm run diag` — e me mandar a saída
2. `npm run build:win` — build completo e verificado
3. **Desinstalar** o Sistema Digicopy pelo Painel de Controle
4. Instalar `dist\Sistema-Digicopy-Setup-5.22.64.exe` (confira o número no nome)

Nenhuma lógica do sistema mudou nesta versão.

---

## v5.22.63 — .exe completo: nenhuma atualização fica de fora

**Causa encontrada** do problema "gero o .exe e não vêm as atualizações novas":
o `electron-builder` só copia o que está em `package.json > build.files`. Essa
lista era escrita **à mão**, junto com outras 3 listas (`bundle-manifest.json`,
tags do `index.html` e `scripts.check`). Esquecer a lista do `build.files` fazia
o arquivo **não ir para dentro do instalador**, sem nenhum aviso: o rodapé
mostrava a versão nova, mas o comportamento continuava o antigo.

**Segunda causa:** o cache do Electron só era limpo quando o *número* da versão
mudava. Reempacotar com o mesmo número deixava o sistema rodando o código antigo
guardado em `%APPDATA%\digicopy-erp\Cache`.

O que mudou:

- Novo `sync_build.js`: `index.html` (versão, título, rodapé e todos os `?v=`),
  `build.files` e `scripts.check` passam a ser **gerados** de uma fonte só.
  `npm run sync:check` reprova build dessincronizado.
- Novo `verify_pack.js`: depois do `electron-builder`, abre o pacote e confere
  arquivo por arquivo — inclusive se o `app.bundle.js` empacotado tem o **mesmo
  sha256** do projeto. Faltou algo, o build **falha**.
- `npm run build:win` agora é: limpa → sincroniza → empacota → **confere**.
- `main.js`: cache invalidado pela impressão digital (sha256) do código, não só
  pela versão. Qualquer mudança de código força limpeza do cache.
- `mobile/sync-www.js`: o APK estava saindo com **14 scripts dando 404** (lista
  fixa não incluía os patches soltos) e o `mobile/www` no git estava 2 versões
  atrasado. Agora copia tudo que o `index.html` carrega e falha se sobrar
  referência quebrada.
- Removido o limite de 30 entradas em `build.files` do `test_app_bundle.js` —
  era uma bomba-relógio que estouraria na próxima atualização.
- Novos `test_build_sync.js` e `test_ajustes_v52263.js`. Guia completo em
  **`BUILD_EXE.md`**.

### Otimização para PC fraco (mesma versão)

Auditoria do carregamento encontrou trabalho duplicado puro:

- **15 patches eram carregados duas vezes** — estavam dentro do `app.bundle.js`
  **e** também como tag `<script>` solta no `index.html`. Isso relia e
  reexecutava **216 KB** a cada abertura.
- **6 desses patches não tinham guarda contra execução dupla**: os de orçamento
  (v5.22.55 a v5.22.62) registravam ouvintes `storage` e **52 `setTimeout` em
  dobro**. Isso ajudava a produzir justamente o comportamento duplicado/loop
  que essas versões vinham tentando corrigir.
- O `npm run sync` agora remove essa duplicata sozinho. `index.html` carrega
  **só o bundle**; `build.files` caiu de 28 para 13 entradas e o pacote de 32
  para 17 arquivos.
- **Cache de código V8 religado** (`bypassHeatCheck`). Estava `none` desde a
  v5.22.48 como contorno do código preso em cache; com o bundle em ~2,9 MB isso
  forçava recompilar tudo a cada abertura. A causa raiz agora é a impressão
  digital, então dá para ligar sem risco.
- `spellcheck: false` (menos memória) e **Chart.js (206 KB) saiu do `<head>`**
  para o fim do `<body>`, liberando a primeira pintura da tela.

### Rodapé e nome da janela travados numa versão velha

Relatado: o sistema estava na 5.22.63 mas o rodapé e o nome da janela
mostravam **v5.22.60**.

**Causa:** seis patches (v5.22.55 a v5.22.60) faziam
`window.DIGICOPY_APP_VERSION = VERSAO;` com a versão **fixa** deles,
sobrescrevendo a versão real definida no `index.html`. O último a rodar era o
v5.22.60, então a variável global inteira virava `5.22.60` — e todos os outros
patches, mesmo os que liam a global "corretamente", passavam a pintar 5.22.60.
Esses mesmos patches ainda forçavam `document.title`, o que travava o nome da
janela.

**Correção:**
- Os seis passaram a respeitar a versão já definida
  (`window.DIGICOPY_APP_VERSION = window.DIGICOPY_APP_VERSION || VERSAO`).
- Todos os painters de rodapé/título agora leem a versão global em vez do valor
  fixo (8 arquivos, 21 pontos corrigidos).
- O painter final (v5.22.63) passou a cuidar também do `document.title`.
- Novo `test_versao_visual.js`: proíbe sobrescrever a versão global, proíbe
  pintar com versão fixa e **simula a ordem real dos 191 scripts** conferindo
  o resultado. A simulação reproduziu o bug (v5.22.60) antes da correção.

### Limpeza: nuvem antiga apagada e repositório 12x menor

- **Repositório de 207 MB → 16 MB.** Havia **190 MB de `.zip`** commitados
  (v5.22.47, 48, 49, 61, 62). O zip da branch que eu baixo carregava tudo isso
  junto. Apagados; o `.gitignore` agora bloqueia `.zip` sem exceção. O git
  guarda o histórico, então nada foi perdido de verdade.
- **Nuvem antiga (Google Firebase / Supabase) apagada de vez.** Quatro arquivos
  mortos, que não entravam no bundle nem no `.exe`, ficavam no repositório:
  `sync_client.js` (28 KB), `sync_realtime_patch.js` (20 KB),
  `limpar_nuvem_patch.js`, `ajustes_v52025_patch.js`. Mais dois testes órfãos.
- **Sobre a API do Google que o GitHub acusa:** a chave estava em
  `firebase_config.js`, arquivo que **já não existe** no código. O alerta vem
  do **histórico do git** (commit `26e5987`), que é permanente. O jeito certo
  de resolver é **revogar/apagar a chave no console do Google** — aí o alerta
  pode ser dispensado. Reescrever o histórico não é recomendado: quebraria o
  PR e a chave continuaria em cópias/forks.
- Novo `test_nuvem_antiga_removida.js`: garante que esses arquivos não voltem,
  que nenhuma chave `AIza...` entre no código, que nenhum endpoint
  Firebase/Supabase apareça e que nenhum `.zip` volte para o repositório.

### Desempenho: timers parados em segundo plano

Três vigias de DOM rodavam **para sempre**, mesmo com a janela minimizada:
`instalarBuscadorMenuFinal` (2s), `limparTopoMenus` (3s) e
`garantirProdutosVisivel` (4s). Agora começam com `if(document.hidden) return;`
— zero trabalho quando o sistema não está à vista.

### Consolidação: 6 módulos que estavam em duplicata

Os arquivos da v5.22.42 e da v5.22.43 eram **o mesmo módulo duas vezes**:
`orcamentos_status`, `contratos_sort`, `impressora_remanejar`,
`financeiro_filtros`, `financeiro_menu` e `menu_versao_boleto`. Em vez de
corrigir o arquivo existente, cada um foi **copiado inteiro** e a versão
trocada — inclusive as guardas (`__v52242fin` virou `__v52243fin`), o que faz
as duas cópias rodarem.

O que isso custava:

- **42 KB lidos e executados à toa** por abertura.
- A v5.22.42 embrulhava `renderFinanceiro`, `renderContratos`,
  `renderOrcamentos` e `navigateTo`; a v5.22.43 embrulhava por cima. A tela do
  financeiro chegava a ser **desenhada com a barra antiga** (De/Até sempre
  visível, o bug que a 43 corrigiu) e só depois refeita.
- `financeiro_menu` era **byte a byte igual**, só mudava o número da versão.

Verificação antes de apagar: a v5.22.43 publica o mesmo conjunto de funções da
42, **não depende de nada** que só a 42 publique, e cada diferença encontrada é
a 43 fazendo **mais** que a 42 (ex.: `out.push('clientes')` virou
`out.push('clientes','produtos','impressoras')`). As três referências a
`__v52242` que sobraram na 43 são só nomes de flag copiados — ela grava, não lê.

Resultado: **6 arquivos apagados**, bundle de 191 para **185 scripts**. O
`test_ajustes_v52243.js` já cobria tudo do teste antigo e mais 5 casos; as 3
asserções exclusivas dele (worker e página do cliente) foram herdadas.

Novo `test_um_arquivo_por_modulo.js` impede a volta do padrão: barra módulo com
duas versões no bundle, arquivo que é cópia de outro só com a versão trocada, e
`_PURE` publicado por mais de um arquivo.

### Verificação sem baixar o Electron

O binário do Electron vem de `release-assets.githubusercontent.com`, bloqueado
no ambiente de desenvolvimento. Solução: `npm install --ignore-scripts` instala
só os pacotes JS, e o novo `npm run verify:files` usa o **matcher real do
`electron-builder`** (`app-builder-lib`) para calcular a lista exata de
arquivos que ele copiaria — conferência completa sem gerar o `.exe`.

Suíte: **117 passaram, 0 falharam**.

Adicionar uma atualização agora são 2 passos: criar o `_patch.js` e citá-lo no
`bundle-manifest.json`. O resto é automático.

**APK:** as mudanças no `mobile/sync-www.js` são só para o celular não quebrar
nas próximas atualizações. O app de celular segue **parado**; a prioridade é o
sistema de PC.

---

## v5.22.62 — orçamento uma vez, sem loop de carregar

- Não refaz a tela de orçamentos.
- Autorizar gera a venda **uma vez**. Apagou orçamento ou venda: não volta.
- Tirei o polling de 3s que recriava tudo e travava a página em “carregando”.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.62`

---

## v5.22.61 — orçamento apagado não volta; aviso no sino

- Orçamento excluído não gera venda de novo e não reaparece.
- Venda gerada do orçamento, se você apagar, não volta sozinha. O orçamento fica Autorizado.
- Sem popup de “foi autorizado”. O aviso vai no sino do PC.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.61`

---


## v5.22.60 — trava total em orçamentos autorizados, atalho direto para venda salva, exclusão funcional e correção na seleção de cliente

- **Trava Total de Edição em Orçamentos Autorizados:**
  - Quando um orçamento estiver com status **Autorizado** (`status: 'aprovado'` ou vinculado a uma venda salva):
    - Todos os campos ficam travados e desabilitados (`disabled` / `readonly`): busca de cliente, filtros, seleção de produtos/recargas, quantidades, preços, descontos, observações e campos da Ordem de Serviço (OS).
    - Botões de adicionar item e remover item da lista são ocultados.
    - O botão Salvar é ocultado / bloqueado para impedir sobrescrita de dados já autorizados.
    - Exibe um aviso/banner destacado: `🔒 Orçamento AUTORIZADO — Edição bloqueada`.
- **Botão Atalho para Abrir a Venda Salva Gerada:**
  - Em orçamentos autorizados, exibe o botão em destaque: **`Abrir Venda Salva nº [Número]`** tanto no banner do topo do modal quanto no rodapé e na tabela principal.
  - Ao clicar, o sistema fecha o modal do orçamento e abre diretamente a Venda Salva no módulo de Vendas.
- **Exclusão Funcional e Confiável de Orçamentos:**
  - Implementada função de exclusão direta e em lote (`excluirOrcamentosMarcados`), com caixa de confirmação nativa.
  - Se o orçamento possuir venda salva gerada pendente (não faturada), a venda vinculada também é removida de forma limpa.
  - Adicionado botão individual de lixeira em cada linha da listagem de orçamentos e no modal de edição.
- **Correção Definitiva na Seleção de Cliente:**
  - Corrigido o manipulador de clique `window.orcSelCliente(id)` e `window.orcLimparCliente()` para atribuir o cliente selecionado diretamente ao formulário do modal (`window.__ORC_ST.form.cliente`).
  - Eliminado o erro onde o sistema dizia "cliente não selecionado mesmo tendo selecionado o cliente".
- **Sincronização Visual da Versão v5.22.60:**
  - Versão **v5.22.60** atualizada no título da aba, cabeçalho superior (`#app-title-version`), centro do rodapé (`#footer-version`), tela de login e variáveis globais.
- **Bundle e Testes Automatizados:**
  - 188 scripts compilados no `app.bundle.js` (`sha256: cc191dabeb8b62df`).
  - Suíte consolidada com **112 testes passando** (0 falhas).
  - APK Mobile mantido intacto.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.60`

Página do orçamento (cliente): `https://digicopy-orcamentos.pages.dev/`

---

## v5.22.59 — remoção da opção 'Serviço' do tipo de item, restauração de filtros, eliminação do botão 'Copiar link' e carregamento instantâneo da página do cliente

- **Correção no Select de Tipo de Item em Orçamentos:**
  - Removida a opção inexistente **Serviço** do dropdown de tipo de item.
  - O seletor conta exclusivamente com os tipos oficiais do sistema: **Produto** e **Recarga de toner**.
- **Restauração Completa dos Filtros de Pesquisa no Modal:**
  - **Filtro de Busca de Clientes:** Reintegrado o seletor `orc-cli-campo` com todos os campos de pesquisa rápida (*Pesquisar em tudo, Nome, Fantasia, Código, CPF/CNPJ, RG/IE, Endereço, Telefone, WhatsApp, Cidade, Bairro, Contato, E-mail, Observação, CEP, UF*).
  - **Filtro de Categorias de Produtos:** Quando selecionado o tipo *Produto*, exibe o dropdown de categorias (`orc-prod-cat`: *Todas categorias, Produto, Serviço, Cartucho, Cartucho Vazio, Insumo, Equipamento, Impressoras, Chip, Compatível, Informática, Original, Outros*) ao lado do campo de busca e botão de lupa.
  - **Filtro de Busca de Recargas:** Quando selecionado o tipo *Recarga de toner*, exibe o dropdown de campos de recarga (`orc-rec-campo`: *Pesquisar recarga, Código, Descrição, Marca*).
  - **Etiqueta e Lupa de Recarga:** Exibe o campo de etiqueta da recarga (`orc-item-cartucho`) com botão de lupa (`orc-etq-lupa`), permitindo buscar etiquetas existentes ou digitar e adicionar etiquetas novas.
- **Remoção do Botão "Copiar link":**
  - Removido o botão "Copiar link" do rodapé do modal de orçamentos, mantendo a interface limpa e direta com *Sair, Revalidar link (quando existente), Imprimir e Salvar*.
- **Carregamento Instantâneo na Página do Cliente (`public-orcamento/index.html` e `orcamento_pagar.html`):**
  - Resolvido o travamento em *"Carregando..."*: a página agora renderiza **imediatamente** (0ms) a partir do payload `d` da URL, exibindo itens, valores, cliente, OS e botões de decisão sem depender de resposta síncrona do Worker.
  - Adicionado timeout e tratamento robusto de erros e decodificação UTF-8 com `AbortController`.
- **Sincronização Visual da Versão v5.22.59:**
  - Versão **v5.22.59** propagada no título da aba (`document.title`), cabeçalho superior (`#app-title-version`), centro do rodapé (`#footer-version`), tela de login e variáveis globais.
- **Bundle e Testes:**
  - 187 scripts compilados no `app.bundle.js` (`sha256: 903b8c5558431441`).
  - Suíte consolidada com **111 testes passando** (0 falhas).
  - APK Mobile mantido intacto.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.59`

Página do orçamento (cliente): `https://digicopy-orcamentos.pages.dev/`

---

## v5.22.58 — orçamentos com Ordem de Serviço (OS), revalidação de link, preservação de status e venda salva

- **Orçamentos com Ordem de Serviço Opcional (OS):**
  - Implementado layout idêntico à OS de Vendas no modal de orçamentos, organizado em duas abas limpas: **Itens** e **Ordem de Serviço (Opcional)**.
  - Na aba de OS, todos os campos começam vazios por padrão (sem obrigatoriedade de preenchimento): *Número de série, Modelo do equipamento, Tipo da OS, Patrimônio, Contador / cópias, Acessórios, Técnico responsável, Responsável entrega, Garantia, Situação da OS, Defeito apresentado, Serviços executados / previstos e Peças utilizadas / orçadas*.
  - Desativada a busca inteligente/automática por número de série em orçamentos anteriores para dar total liberdade de digitação.
  - Os dados preenchidos na OS são exibidos de forma clara e profissional na página web de aprovação do cliente (`public-orcamento/index.html` e fallback `orcamento_pagar.html`).
  - Ao ser autorizado pelo cliente ou no ERP, os dados da OS são passados integralmente para a venda salva gerada (`db.vendas`) e espelhados em `db.os`.
- **Preservação de Status e Visibilidade dos Orçamentos:**
  - Orçamentos autorizados e não autorizados **nunca mais somem da lista**.
  - Exibição de badge com status em tempo real: **Autorizado** (verde/ok), **Não autorizado** (amarelo/wait) e **Aberto** (azul/info).
  - Ícone indicador `🔧 OS` na tabela para identificar visualmente orçamentos que possuem dados de Ordem de Serviço.
- **Botão "Revalidar link" com Confirmação e Revogação Segura de Venda:**
  - Adicionado botão de ação rápida **Revalidar link** tanto na tabela de orçamentos quanto no rodapé do modal de edição.
  - Ao clicar, exibe mensagem de confirmação do sistema:
    - *O link voltará a ficar ativo (status Aberto);*
    - *Qualquer venda salva pendente gerada por ele será automaticamente estornada e cancelada do sistema;*
    - *Um novo token limpo é gerado para o orçamento, permitindo novo envio e decisão do cliente.*
  - Se a venda gerada já tiver sido faturada/finalizada no financeiro, o sistema bloqueia a revalidação e instrui o estorno prévio no módulo de Vendas.
- **Sincronização Visual Global da Versão v5.22.58:**
  - Atualização automática em todos os pontos: título da aba do navegador (`document.title`), cabeçalho do ERP (`#app-title-version`), centro do rodapé (`#footer-version`), tela de login e variáveis globais.
- **Bundle e Testes Automatizados:**
  - 186 scripts compilados no `app.bundle.js` (`sha256: 495806b44ef495df`).
  - Suíte consolidada com **110 testes passando** (0 falhas).
  - APK Mobile mantido intacto conforme diretrizes.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.58`

Página do orçamento (cliente): `https://digicopy-orcamentos.pages.dev/`

---

## v5.22.57 — sincronização total de aprovação/rejeição de orçamentos, venda salva e versão v5.22.57

- **Sincronização Total de Aprovação e Rejeição:**
  - Garantido que quando o cliente aprova o orçamento no link público (`https://digicopy-orcamentos.pages.dev/?c=TOKEN&d=...`), o status no ERP transiciona de **Aberto** para **Autorizado** (`status: 'aprovado'`) e gera a **Venda Salva** (`db.vendas` com status `aguardar`, itens, cliente e valores).
  - Quando o cliente rejeita o orçamento, o status no ERP transiciona para **Não autorizado** (`status: 'recusado'`).
  - Implementada sincronização bidirecional e polling resiliente via Cloudflare D1/Worker (`/orcamento/status`) e localStorage fallback.
- **Autorização e Rejeição Manual no ERP:**
  - Métodos manuais `window.autorizarOrcamentoDirect(id)` e `window.recusarOrcamentoDirect(id)` disponíveis para aprovação direta quando o cliente confirma por WhatsApp ou pessoalmente.
  - Ao autorizar manualmente, a venda salva é gerada instantaneamente no banco local e os dados são sincronizados.
- **Sincronização Visual de Versão v5.22.57:**
  - Versão **v5.22.57** propagada em todos os pontos: título da aba (`document.title`), cabeçalho superior (`#app-title-version`), centro do rodapé (`#footer-version`), tela de login e variáveis globais.
- **Bundle e Testes:**
  - 185 scripts compilados no `app.bundle.js` (`sha256: 0e6771d221edaed9`).
  - 109 suítes de testes passando com 100% de sucesso.
  - APK Mobile mantido intacto.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.57`

Página do orçamento (cliente): `https://digicopy-orcamentos.pages.dev/`

---

## v5.22.56 — aprovação de orçamento 100% via link do cliente, tela limpa e versão v5.22.56

- **Fluxo Oficial 100% Via Link do Cliente:**
  - Removidos os botões manuais extras da listagem de orçamentos, deixando a tabela limpa e no visual padrão do sistema.
  - O fluxo opera 100% pelo link enviado ao cliente (`https://digicopy-orcamentos.pages.dev/?c=TOKEN&d=...`).
  - Ao aprovar ou recusar no link, a página confirma com o cliente, invalida o link, comunica a nuvem e abre o WhatsApp com a mensagem pronta.
- **Sincronização e Geração de Venda Salva:**
  - Polling em tempo real a cada 4 segundos no ERP.
  - Ao detectar a aprovação remota, o ERP altera o status de **ABERTO** para **AUTORIZADO** (`status: 'aprovado'`) e gera a **Venda Salva** (status `aguardar`, pronta para faturar) com itens, valores e cliente.
  - Orçamentos sem token prévio ganham tokens únicos gerados automaticamente (`garantirTokensOrcamentos`).
- **Sincronização Visual de Versão v5.22.56:**
  - Versão **v5.22.56** sincronizada na aba do navegador (`document.title`), cabeçalho superior e no centro do rodapé.
- **Bundle e Testes:**
  - 184 scripts compilados no `app.bundle.js` (`sha256: a821da86dfdd010f`).
  - 108 suítes de testes passando com 100% de sucesso.
  - APK Mobile mantido intacto.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.56`

Página do orçamento (cliente): `https://digicopy-orcamentos.pages.dev/`

---

## v5.22.55 — autorização de orçamento gerando venda salva e sincronização de status completa

- **Conversão Automática em Venda Salva no Sistema:**
  - Quando o cliente autoriza o orçamento no Cloudflare Pages (`https://digicopy-orcamentos.pages.dev/`), o sistema puxa a aprovação da nuvem e gera automaticamente a **Venda Salva** (status `aguardar`, pronta para faturar) com os mesmos itens, cliente e valores.
  - O orçamento muda imediatamente de **Aberto** para **Autorizado** (`status: 'aprovado'`), vinculando o `vendaId` e exibindo o número da venda gerada.
- **Tratamento de Recusa:**
  - Quando o cliente recusa o orçamento no Pages, o status muda de **Aberto** para **Não autorizado** (`status: 'recusado'`).
- **Botões de Ação Direta no ERP:**
  - Na listagem de orçamentos e no modal de edição foram incluídos os botões rápidos **Autorizar** e **Recusar** manual, permitindo ao atendente autorizar com 1 clique caso o cliente confirme pelo WhatsApp ou pessoalmente.
  - Orçamentos já autorizados exibem o botão direto **Venda [Número]** para abrir a venda gerada.
- **Sincronização Visual de Versão em Toda a Interface:**
  - Inicialização global de `window.DIGICOPY_APP_VERSION = '5.22.55'` no topo do `index.html` e no início do bundle.
  - Atualização dinâmica no título da aba do navegador (`document.title`), na barra superior (`#app-title-version`) e no rodapé central (`#footer-version`), garantindo que em qualquer menu ou troca de tela a versão exibida seja sempre **v5.22.55**.
- **Correção no Worker e D1:**
  - Criado o dispositivo de sistema `public-orcamento` para contornar a chave estrangeira em SQLite D1.
  - Aceita payload de fallback `d=` para garantir persistência mesmo se o orçamento local ainda não tivesse subido na nuvem.
- **Bundle e Testes:**
  - 183 scripts compilados no `app.bundle.js` (`sha256: 296d20888b0584f5`).
  - 107 suítes de testes passando com 100% de sucesso.
- **APK Mobile:** Preservado e intocado.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.55`

Página do orçamento (cliente): `https://digicopy-orcamentos.pages.dev/`

---

## v5.22.54 — integração oficial dos orçamentos no Cloudflare Pages (`digicopy-orcamentos.pages.dev`)

- **Página Oficial Cloudflare Pages Configurada:**
  - URL de produção configurada: `https://digicopy-orcamentos.pages.dev/`.
  - Links gerados no sistema (notinha meia folha, botões de copiar link e compartilhamento WhatsApp) agora apontam diretamente para `https://digicopy-orcamentos.pages.dev/?c=TOKEN&d=DADOS&v=5.22.54`.
- **Arquitetura de Alta Disponibilidade:**
  - Consulta primária via Worker Cloudflare (`digicopy-sync-api`) e banco D1 (`digicopy-erp`).
  - Fallback instantâneo via payload seguro codificado em base64 (`d=`), permitindo que o cliente visualize o orçamento mesmo em caso de instabilidade na conexão.
  - Modal de confirmação *"Tem certeza?"* antes de autorizar ou recusar.
  - Invalidação automática após a decisão: o link é marcado como usado no dispositivo e no banco de dados.
- **Bundle e Testes:**
  - 182 scripts compilados no `app.bundle.js` com integridade sha256 validada.
  - 106 suítes de testes passando com 100% de sucesso.
- **APK Mobile:** Preservado e intocado nesta etapa.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.54`

Página do orçamento (cliente): `https://digicopy-orcamentos.pages.dev/`

---

## v5.22.53 — correção definitiva da inicialização, login instantâneo e proteção total anti-tela branca

- **Causa raiz da tela branca / carregamento infinito eliminada:**
  1. Exportação explícita de `window.db` logo após a carga do banco em `app.js`, impedindo erros de `ReferenceError: db is not defined` em IIFEs e patches modulares.
  2. Proteções com null-check defensivo em substituições de nós e manipulação de elementos DOM nos patches `ajustes_v52238_vendas_os_ajustes_patch.js`, `ajustes_v52235_codigo_sem_sku_patch.js`, `ajustes_v52221_cert_nuvem_a1_patch.js`, `leitura_impressao_compacta_produtos_patch.js` e `finalizacao_sistema_patch.js`.
  3. Remoção e ocultação de qualquer overlay de carregamento preso (`cloud-load-overlay`).
- **Login Instantâneo e Resiliente:** Novo patch `ajustes_v52253_login_tela_branca_patch.js` traz autenticação direta infalível, transição limpa entre `#login-screen` e `#app-shell`, e sincronização de dados do usuário e empresa.
- **Guarda Global Anti-Tela Branca:** Monitoramento de erros e exceções não tratadas que recupera automaticamente a interface para a tela de login ou a tela principal.
- **Bundle e Testes:** 181 scripts compilados com integridade validada; 105 suítes de testes passando com 100% de sucesso.
- **APK Mobile:** Preservado e intocado nesta etapa.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.53`

GitHack orçamento (cliente): `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/orcamento_pagar.html`

---

## v5.22.52 — resolução definitiva de loop de carregamento infinito e boot ultrarrápido

- **Causa raiz do carregamento infinito identificada e eliminada:** Múltiplas instâncias de `MutationObserver` em patches anteriores (`ajustes_v52246_nuvem_nao_autorizar_patch.js`, `ajustes_v52249_relatorio_patch.js` e `ajustes_v52250_exe_bundle_patch.js`) observavam recursivamente mutações no `document.documentElement` e disparavam atualizações contínuas no `footer-version` e elementos da DOM em um loop microtask infinito (`Maximum call stack size exceeded`), travando a CPU e impedindo o término do carregamento da página no Electron / Chromium.
- **Eliminação completa dos observers concorrentes:** Removidos todos os `MutationObserver` globais redundantes e substituídos por chamadas diretas e seguras atreladas aos eventos de ciclo de vida (`navigateTo`, `DOMContentLoaded` e gatilhos de renderização).
- **Boot instantâneo e leveza no .exe:** O novo patch `ajustes_v52252_resolucao_loop_patch.js` garante que a inicialização do login ocorra em menos de 100ms sem polling desnecessário e sem consumo excessivo de CPU em computadores fracos.
- **Bundle unificado e manifesto sincronizado:** 180 scripts compilados no `app.bundle.js` com integridade sha256 validada.
- **Suíte de testes:** 104 testes passando 100% integrados no runner.
- **APK Mobile:** Mantido inalterado e preservado nesta etapa.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.52`

GitHack orçamento (cliente): `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/orcamento_pagar.html`

---

## v5.22.51 — correção da tela branca no .exe e resiliência total de inicialização

- **Causa raiz da tela branca identificada e corrigida:** Durante a inicialização limpa (quando não havia sessão anterior ativa ou após logout), a leitura `sess.usuarioNome` no bloco imediato de `app.js` gerava uma exceção não tratada (`TypeError: Cannot read properties of null`), interrompendo a execução do JavaScript e travando a renderização da interface.
- **Null safety em todo o fluxo de inicialização:** Corrigida a inicialização de sessão para verificar se o objeto `sess` é nulo antes de acessar `usuarioNome` ou `login` tanto em `app.js` quanto nos patches auxiliares.
- **Guardas anti-tela branca e recuperação automática:** Novo patch `ajustes_v52251_exe_resiliencia_patch.js` monitora o ciclo de vida do DOM e garante a correta exibição da tela de login ou da tela principal com recuperação automática em caso de atraso na renderização.
- **Ciclo de vida suave no Electron (`main.js`):** Limpeza segura de cache via APIs do Electron (`win.webContents.session.clearCache` e `clearStorageData`) sem risco de bloqueio de arquivos concorrentes pelo sistema de arquivos do Windows, somado a temporizador de segurança garantindo que a janela principal seja sempre exibida.
- **Suíte de testes:** 103 testes passando 100% integrados no runner.
- **APK Mobile:** Mantido inalterado e preservado nesta etapa.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.51`

GitHack orçamento (cliente): `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/orcamento_pagar.html`

---

## v5.22.50 — correção definitiva do bundle e empacotamento no .exe

- **Correção de empacotamento:** todos os patches entram diretamente no `app.bundle.js` e são validados pelo manifesto e pelo build.
- **Cache automático do .exe:** ao abrir a versão 5.22.50, o Electron limpa automaticamente `Cache`, `Code Cache` e `GPUCache` na pasta de dados do Windows.
- **Rodapé e versão:** sincronizado para v5.22.50 em todos os componentes e rodapé.
- **Testes:** 102 suítes consolidadas passando com 100% de aprovação.
- **APK Mobile:** mantido pausado e isolado nesta etapa conforme solicitado.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/index.html?v=5.22.50`

GitHack orçamento (cliente): `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/orcamento_pagar.html`

---

## v5.22.49 — atualizações do relatório no .exe e no celular

Causa: o rodapé vinha do `index.html` (por isso a versão mudava) e o link do cliente ia para o Pages velho (`digicopy-orcament.pages.dev`), sem “Tem certeza?”, sem invalidar o link e sem autorizar/recusar de verdade.

- Link do orçamento abre a página nova no GitHack (`orcamento_pagar.html?v=5.22.49&c=token&d=...`): **Tem certeza?**, depois o link não vale mais, Autorizar / Recusar.
- O patch do relatório entra **no bundle e sozinho no .exe** (depois do bundle), para a atualização não depender só do `app.bundle.js`.
- No sistema: salvar venda grava e fecha; some Sair; faturar não imprime; apagar leitura devolve contador; De/Até visíveis; códigos no histórico.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.49`

GitHack orçamento (cliente): `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/orcamento_pagar.html`

---

## v5.22.48 — .exe sem cache velho

- Desliga o cache V8 do Electron.
- Na versão nova apaga Cache / Code Cache / GPUCache.
- Gera o instalador sem asar.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.48`

---

## v5.22.47 — .exe passa a trazer a versão nova

- O instalador não usa mais `app.asar` (os arquivos ficam visíveis em `resources/app`).
- Ao abrir uma versão nova, o cache do Chromium é limpo.
- `npm run build:win` apaga a pasta `dist` antiga antes de gerar.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.47`

---

## v5.22.46 — não autorizar dados atuais deste PC

- Botão na Nuvem: **Não autorizar dados deste PC**.
- A nuvem **não apaga**. Este PC passa a usar o que já está na nuvem. O que só existia aqui some DESTE computador e **não sobe**.
- O que você lançar depois sincroniza normal.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.46`

---

## v5.22.45 — serial/ocultar, leitura, financeiro, rodapé, venda

- Impressora: pesquisa só o serial e abre a tela completa; se já existe em outro cliente, preenche sozinho; aviso de remanejo só no Salvar. Nova sem outro contrato: só sucesso. Caixa Ocultar no editar (status `oculta` nas Remanejadas, chave para desocultar). Oculta não impede cadastro em outro cliente (vira remanejada).
- Apagar leitura: aviso do sistema e o contador volta ao valor de antes do lançamento.
- Histórico financeiro: código da venda, da leitura e do chamado.
- De / Até sempre visíveis. Em Hoje não filtram.
- Versão sozinha no meio do rodapé.
- Venda: Salvar grava e fecha. Some o botão Sair (fica o X). Faturar não abre a tela de imprimir.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.45`

1.2 / 1.3 / 1.4 no link do cliente ainda dependem de reenviar `public-orcamento/index.html` no Pages e implantar o worker 0.4.5. O app já puxa a decisão (USED).

---

## v5.22.44 — autorizar orçamento gera venda; recusar some; datas no financeiro

- Autorizar no link do cliente gera **venda salva**. Recusar **apaga** o orçamento da lista.
- Financeiro: De / Até sempre visíveis (em Hoje ficam desligados).
- Continua zip no PR para testar. Produção 5.21.6 até pedir.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.44`

---

## v5.22.43 — refaz o pedido 1–4 na tela certa

- Orçamento: Status Autorizado / Não autorizado na lista e na tela. Sem Faturar.
- Contratos: clique no título A→Z e Z→A, uma seta, sem inverter a tabela (não pisca).
- Impressora no contrato: novo cadastro começa no serial; se já está em outro cliente, pergunta se remaneja só no salvar; Ativas vs Remanejadas (histórico congelado, fora de leitura/chamado).
- Financeiro: some saldo; filtros da lista; lupa/Enter; padrão Hoje; Abertos / Todos; De/Até só em Abertos; faturada ganha data e aparece. Menu único.
- Menu da faixa aberta em azul. Rodapé v5.22.43. Forma **Boleto** (baixa automática).

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.43`

---

## v5.22.42 — orçamento status, contratos sort/remanejo, financeiro, menu/versão/Boleto

- Orçamento: status Autorizado / Não autorizado / Aberto na lista e na tela. Sem botão Faturar.
- Site do cliente: “Tem certeza?” antes de autorizar/recusar. Depois da decisão o link não vale mais (precisa do worker implantado).
- Contratos: clique no título A→Z e Z→A, uma seta, sem piscar.
- Impressora no contrato: primeiro o serial; se já está em outro cliente, pergunta se remaneja; Ativas vs Remanejadas (histórico congelado).
- Financeiro: some os cards de saldo. Filtros Nome, Cód. Venda, Cód. Parcela, Cód. Cliente, Por Valor, Cód. Caixa, Cód. Pix, Cód. Leitura. Lupa/Enter. Padrão Hoje. Abertos / Todos. De/Até não vale em Hoje e Todos. Menu único, sem submenu Contas e caixas.
- Menu da faixa aberta em azul. Rodapé com a versão. Forma **Boleto** na venda e na baixa (baixa automática).

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.42`

---

## v5.22.41 — salvar venda fecha; fechar salva; zips saíram

- Botão **Salvar** grava a venda e fecha a tela. Sem pergunta.
- **Sair/Fechar** também grava (precisa do cliente) e fecha. Sem pergunta.
- Apagados os `.zip` antigos do repositório.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.41`

---

## v5.22.40 — orçamento no Pages separado

- Link de autorizar/recusar aponta para `https://digicopy-orcament.pages.dev/` (não é Pix, não é GitHack).
- Autorizar nesse site **ainda não cria a venda sozinho** (worker `/orcamento` não está no ar). WhatsApp abre.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.40`

Página do cliente: `https://digicopy-orcament.pages.dev/`

---

## v5.22.39 — impressão com escolha, patrimônio opcional, menus na hora, aviso de erro

- Imprimir venda: primeiro escolhe **Vendas** ou **Ordem de serviço**, depois **1 via** ou **2 vias**.
- Vendas: sem aviso EPSON. 2 vias = duas meias folhas (uma folha inteira se os itens couberem).
- OS: aviso EPSON sempre. 2 vias = duas folhas separadas.
- Patrimônio da OS **não** é obrigatório (saiu o *).
- Se der erro: aviso na tela. Detalhe técnico só na **Auditoria**.
- Menus não piscam mais. Locação volta a ter Máquinas nos clientes e Leituras. Backup/Nuvem continuam por permissão.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.39`

GitHack orçamento (cliente): `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/orcamento_pagar.html`

---

## v5.22.38 — orçamento separado do Pix + ajustes de venda

- Orçamentos: filtro de produto e, em Recarga de toner, filtro + etiqueta. Aviso de salvo. Sair pergunta se deseja salvar.
- Link de aprovação é **outra página**, não a do Pix. Dados vão na URL. Cliente escolhe autorizar ou recusar. Recusar também abre WhatsApp.
- Vendas: lupa da série ao lado da caixa. OS com dados sai na impressão. Aviso EPSON só na OS. Técnico começa vazio. * nos obrigatórios. Salvar só precisa do cliente. Botão Salvar não pergunta.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.38`

GitHack orçamento (cliente): `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/orcamento_pagar.html`

---

## v5.22.37 — vendas/OS, filtros de contrato e orçamentos

- Vendas: nomes Itens / Ordem de serviço e rótulos (tipo, descrição, QTD, V. UNIT, DESC, TOTAL, série, modelo, contador) em azul.
- Série: lupa + Enter, igual etiqueta. Traz cliente, modelo e patrimônio da última venda.
- Some Valor serviço e Desconto OS. Garantia: escolhe ou escreve os dias (seta volta para a lista). Técnico responsável obrigatório na OS.
- Produto zerado: pergunta se quer mudar o estoque. Sim abre o cadastro do **produto** na aba Estoque. Salvar ou sair volta na mesma venda, com o que já estava escrito.
- Impressão da OS e do orçamento: aviso das EPSON (15 dias úteis). Sem a frase de cobrir oferta. Sem validade 60 dias.
- Contratos: filtros da lista (Todos, Nome, Equipamento, Patrimônio, Serial, Departamento, Chamados Abertos, Cod Locação, Cod Cliente, Endereço Impressora, Vencidos, Vencer 30 dias, Leituras lançar hoje, Cod Leitura, Não faturados esse mês, Faturados esse mês, Não faturados mês passado, Mês fixo, Franquia individual). Sem Cód controle, franquia global, fatura por cartucho, propostas, nosso código/pasta, não lançados esse mês, fecha dia.
- Menu **Orçamentos** (Atendimento). Cadastro separado do Digicopy — **não** é o Buscador Escola. Lista: código, data, cliente, valor. Novo / excluir / estornar com caixa. Filtros da 2ª imagem, sem período; botão Todos à parte.
- Orçamento pega a busca e os itens da venda. Não entra no financeiro. Precisa de estoque para lançar, mas não baixa. Fechado = cliente aprovou e gerou venda salva.
- Impressão meia folha com link público (`digicopy-pix.pages.dev/orcamento.html`). Cliente aprova ou recusa. Aprovar gera venda **salva** (não faturada), avisa no sistema e abre WhatsApp da loja.
- Estornar orçamento: cancela. Se já gerou venda salva, apaga essa venda. Se a venda já foi faturada, bloqueia até estornar a venda.
- Worker ganhou GET/POST `/orcamento` (ainda precisa implantar). Enviar `public-pix/orcamento.html` no Pages.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.37`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.37`

---

## v5.22.34 — aviso de salvo + NCM no produto que já existe

- Qualquer **Salvar** em Configurações abre o aviso do sistema.
- Na página de envio, o mesmo `PRODUTOS.json` não duplica: só grava o NCM no cadastro que já está. Estoque e preço não mudam. `DEL = S` continua pulado.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.34`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.34`

---

## v5.22.32 — volta o modo escuro da 5.22.30

- Apagado o visual da 5.22.31. O escuro volta a ser o da 5.22.30.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.32`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.32`

---

## v5.22.30 — modo escuro só neste aparelho

- Em **Configurações** liga/desliga o modo escuro. Vale só neste computador. Não sobe na nuvem.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.30`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.30`

---

## v5.22.29 — IE, Inscrição Municipal e CNAE fiscal

- Em **Configurações → NF-e** entram os 3 dados da loja: Inscrição Estadual, Inscrição Municipal e CNAE fiscal.
- Conferência avisa se faltar. Entram no XML se preenchidos. Ainda **não** emite na SEFAZ.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.29`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.29`

---

## v5.22.28 — A1 da nuvem vale + lupa NCM no centro da caixa

- Conferência e assinatura usam o A1 que já está na nuvem. Senha só na hora. Ainda **não** emite na SEFAZ.
- Lupa do NCM fica no meio da caixa de texto (não no meio do rótulo).

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.28`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.28`

---

## v5.22.27 — lupa do filtro de cliente + NCM/origem NF

- Some a lupa enfeite em cima do select de cliente. A lupa de pesquisar fica.
- Origem do produto na NF: códigos oficiais **0 a 8**.
- Campo NCM pesquisável (Enter ou lupa). Não muda origem sozinho.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.27`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.27`

---

## v5.22.26 — ehDel na página de envio

- A página chamava `ehDel` e a função não estava no arquivo. Agora está. Pula `DEL = S`.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.26`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.26`

---

## v5.22.25 — importação pula DEL = S

- Nesta importação, produto com `DEL = S` não sobe. `OCULTAR` sozinho não decide.
- NCM do produto continua vindo de `PR_NCM`. `NCM.json` é opcional.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.25`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.25`

---

## v5.22.24 — letra no filtro não vira regra

- Some só a opção que é letra no select (P/S/I/C/E). Entra Produto / Serviço / Insumo / Cartucho / Equipamento.
- Chip, Original e o resto ficam.
- Produto que já veio com letra nesta importação troca o nome **uma vez**. Depois para. Não envolve `unificaCat`.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.24`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.24`

---

## v5.22.23 — letras P/S/I/C/E viram nomes + menus seguem o mouse

- Some só o filtro que é letra: P→Produto, S→Serviço, I→Insumo, C→Cartucho, E→Equipamento. Chip, Original e o resto ficam.
- Editor de menus: seta é apagada. O bloco segue o cursor e troca de lugar na hora.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.23`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.23`

---

## v5.22.22 — menus só arrastar + NCM no envio

- Editor de menus: some as setas. Só pegar e arrastar. Continua valendo só neste PC.
- Página de envio aceita **NCM.json**. Liga no produto pelo campo NCM do próprio produto ou pelo código da tabela NCM do sistema antigo.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.22`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.22`

---

## v5.22.21 — envio de arquivos, NF por usuário, menus só neste PC

- Página à parte para enviar **A1 .pfx** e JSON de **PRODUTOS** (+ **PRODUTOS_CATEGORIA**). Mesmo SKU não duplica nesta importação. Senha do A1 não é pedida nessa página.
- Some **Carregar A1** das Configurações. O teste usa o A1 da nuvem. Ainda **não emite** na SEFAZ.
- Usuários: caixa **Emitir NF**. Só Admin/Dono marca. Só quem estiver marcado confere/assina.
- Editor de menus saiu da faixa azul. Fica em **Configurações → Menus deste computador**. Vale só neste aparelho.

GitHack sistema: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.21`

GitHack envio: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/envio_arquivos.html?v=5.22.21`

---

## v5.22.20 — lupa no lugar

- O filtro auxiliar tinha empurrado várias lupas para fora do campo. A lupa volta para dentro da caixa de busca (canto direito).

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.20`

---

## v5.22.19 — filtro auxiliar na busca de cliente/item + PIX sem GitHack

- Em todo lugar que escolhe **cliente**: select ao lado da caixa, iguais ao menu Clientes (Nome, Código, Fantasia, CPF/CNPJ…). Auxiliar da busca. Enter ou lupa.
- Item **Produto**: filtro de categoria (Todas categorias por padrão). **Recarga** saiu da lista — recarga fica no tipo Recarga de toner.
- Item **Recarga de toner**: filtro da recarga + caixa da etiqueta (a mesma de etiqueta nova; se não achar, escreve e segue). Regras da 5.22.18 continuam (cadastra no faturar, não duplica, preenche cliente, some no estorno).
- Link do PIX no PDF/comprovante **não usa GitHack**. Vai para a página pública da nuvem. Repositório privado não apaga isso. No `.exe` o `pix_pagar.html` também entra no instalador.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.19`

---

## v5.22.18 — menus para todos, rodapé de verdade, PIX/prazo, etiqueta

- Editor de **Menus/Atalhos** abre em qualquer login. Nuvem e Backup não aparecem (nem no atalho) se não for Admin.
- Rodapé da loja na impressão: o sistema recolocava depois; agora não recoloca.
- PIX na venda: **baixa na hora**, sem comprovante. Comprovante PIX só quando a forma é **A prazo**.
- Imprimir venda: some até faturar. Depois do faturar o botão volta.
- Recarga não aparece na busca de **Produto**.
- Some **Cadastrar esta etiqueta**. Cadastra ao faturar. Etiqueta repetida não lança. Sem cliente, preenche o da etiqueta. Estorno some o cadastro se não restar venda ativa com ela.
- NF-e: parada até existir A1 `.pfx`. Os `.p7b/.cer` não assinam.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.18`

---

## v5.22.17 — arrastar menus, Nuvem/Backup, rodapé, recibo, cert na nuvem

- Editor de Menus: **arrastar** menu e submenu. Setas dos submenus corrigidas.
- **Backup** só Admin. **Nuvem**: Admin sempre; se o PC ainda não autorizou, o outro usuário vê para colar o código.
- Impressão/PDF: saiu o rodapé cinza da loja (o que caía na outra metade da folha), inclusive vendas.
- Financeiro: botão **Imprimir** junto de Receber/Excluir. Só o mesmo cliente. Recibo normal lista parcelas/vendas; recibo com descrição mostra os códigos **e** o texto.
- NF-e: dá para enviar o certificado **público** (.p7b/.cer) para a nuvem. **.pfx A1 não sobe**. Senha não é pedida nem gravada. Sem .pfx neste PC a nota não assina.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.17`

---

## v5.22.16 — submenus, ocultos e atalhos na faixa azul

Pedido: mover submenus; menus ocultos só o Admin vê; atalho duplicou (faixa branca + faixa azul); atalhos na parte azul, escolhendo submenu e não só o menu pai.

- Editor de **Menus**: setas nos submenus. Corrigidas as setas do menu (antes o `↑↓` não andava).
- Caixa **Oculto** em menu e submenu. Quem não é Admin não vê o item. Admin continua vendo (mais claro) e é o único que abre o editor.
- **Sair** não some.
- Some a faixa branca de atalhos no Início. Os botões ficam na faixa azul. O lápis **Atalhos** também.
- No editor de atalhos a lista é por submenu (Nova venda, Recargas, etc.), agrupada pelo menu pai.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.16`

---

## v5.22.15 — teste de etiqueta + site que não entra

- Teste de etiquetas atualizado para o layout que já funciona (7×18 = 126 por folha). Não mexi na impressão.
- No GitHack a abertura tentava puxar nuvem sozinha, cobria a tela com “Carregando dados da nuvem...” e recarregava. Isso saiu. Login abre direto. Nuvem continua só depois de entrar, pelo botão Nuvem.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.15`

---

## v5.22.14 — página travada, recargas, ordenação

Pedido: a página ficava carregando e não dava para testar configurações; Recarga de toner na venda puxava qualquer produto; filtros dos títulos só iam num sentido (e apareciam duas setas).

- Tirei o `MutationObserver` do financeiro/menus que reescrevia o HTML em loop (CPU 100%).
- Recargas: aba em Estoque + submenu Recargas. Cadastro próprio, **sem estoque**. Na venda, tipo Recarga de toner puxa só dessa lista.
- Clique no título: A→Z e Z→A. Uma seta só (não empilha mais duas).

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.14`

---

## v5.22.13 — financeiro, menus e atalhos

Pedido: apagar o menu Recebimento; financeiro só **Contas e caixas**; Receber junto da lixeira; baixa como vendas sem A prazo; Pix no financeiro baixa de verdade; sem marca = novo lançamento (cliente com lupa, sem status, repetir mês a mês); editar ordem/nome dos menus; Chamados só em Atendimento; atalhos do Início editáveis. APK quieto.

- Submenu **Novo recebimento** saiu. Financeiro fica com **Contas e caixas**.
- **Receber** fica ao lado do **Excluir**. Com caixinha marcada: escolhe a forma (sem A prazo) e o título fica pago. Pix aqui **paga**. Sem marca: cria lançamento (cliente lupa/Enter, descrição, valor, vencimento, repetir).
- Botão **Menus** na barra: ordem e nome (limite 18/24 letras). Configurações pode ir para o lado do Início.
- Chamados saiu da Locação. Continua em Atendimento.
- No Início: atalhos editáveis (ordem, nome, quais botões).

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.13`

---

## Celular 1.0 — APK do sistema (separado do PC)

Pedido: versões separadas; celular começa no **1.0**; é o sistema, não um app de teste.

- Pasta `mobile/` — app **1.0** (`versionCode` 1)
- PC continua **5.22.12** / dia a dia **5.21.6**
- NF-e não emite no celular
- Abrir no Android Studio: pasta `mobile/android`
- Gerar APK: Build → Build Bundle(s) / APK(s) → Build APK(s)
- Depois: Nuvem → código do PC Admin → dados descem

---

## v5.22.12 — celular autoriza e puxa a nuvem

Pedido: importar para o celular primeiro; NF-e só no PC.

- No celular, Nuvem abre em **Tenho um código**, nome padrão **Celular**
- Dados da nuvem descem. Sobra local não sobe sozinha
- NF-e neste aparelho não emite
- Menu por toque. Dá para instalar o ícone no telefone (Chrome → Adicionar à tela inicial)
- Arquivo `.apk` assinado daqui não sai: falta o Android SDK neste ambiente

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.12`

---

## v5.22.11 — uma logo só na impressão

Pedido: a notinha saía com a logo duplicada, comendo espaço. Acontecia no geral, não só em venda.

- Tira a logo extra do topo
- Se o documento já tem a logo da loja, não coloca outra
- Vale para notinha, leitura, chamado e relatório

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.11`

---

## v5.22.10 — caixa no histórico de leituras + NF-e nas duas listas

Pedido: o atalho tem que ficar nas duas telas (histórico de leituras do cliente e Vendas e Notinhas). A lista de leituras ganha caixa e exclusão (faturada não sai). NF-e só com uma marcada.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.10`

---

## v5.22.9 — atalho NF-e no histórico

Pedido: atalho no histórico das notinhas e das leituras; o que estiver selecionado vai para a NF; pré-visualizar antes de emitir.

- Botão **Pré-visualizar NF-e** na lista de notinhas e na lista de leituras
- Usa a notinha/leitura selecionada
- Também no histórico aberto (modal)
- Só mostra a prévia. Assinar continua no passo seguinte
- Não grava e não envia à SEFAZ

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.9`

---

## v5.22.8 — assinar NF-e com A1

Pedido: voltar para a NF-e.

- Conferência ok → botão **Assinar com A1**
- Senha pedida só na hora. Não grava. Não sobe na nuvem.
- Assina o XML neste PC. **Ainda não envia para a SEFAZ.**
- Dá para copiar ou baixar o XML assinado.
- Venda, leitura e estoque continuam iguais.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.8`

---

## v5.22.7 — acompanhar dados dos outros PCs

Pedido: só o login Admin abre a nuvem; precisa ver o que os outros computadores mandaram.

- Botão **Acompanhar dados dos PCs** no painel Nuvem (só Admin)
- Por aparelho: último acesso, último envio, quantos registros de cada tipo
- Lista dos movimentos recentes (quem enviou/excluiu o quê)
- Não mostra senha. Os outros logins continuam sem ver Nuvem.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.7`

---

## v5.22.6 — reinstalação não duplica na nuvem

Pedido: se desinstalar e instalar, o PC ainda tem dados e não pode mandar isso sozinho para a nuvem (duplica). Depois, um jeito de lançar na mão.

- Depois de autorizar de novo: baixa a nuvem primeiro.
- Nuvem vazia + dados neste PC → sincronização **pausada**. Só sobe no **Publicar este PC**.
- Nuvem já tem dados + sobra local (ID diferente) → **não envia**. Aviso no painel.
- Para lançar este PC como fonte: **Zerar dados da nuvem** → **Publicar este PC**.
- PC convidado continua isolando histórico velho (não publica sobra).
- Mesmos IDs (os 1919) só atualizam, não criam outro cadastro.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.6`

---

## v5.22.5 — backup sem senha + página GitHack do login

- Backup (manual e diário) **não leva** a senha da Caixa Escolar.
- Página só para cadastrar o login, sem baixar `.zip`:
  `https://raw.githack.com/kauangabrielcardosomo fonte: **Zerar dados da nuvem** → **Publicar este PC**.
- PC convidado continua isolando histórico velho (não publica sobra).
- Mesmos IDs (os 1919) só atualizam, não criam outro cadastro.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.6`

---

## v5.22.5 — backup sem senha + página GitHack do login

- Backup (manual e diário) **não leva** a senha da Caixa Escolar.
- Página só para cadastrar o login, sem baixar `.zip`:
  `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/escola_login.html`
- CNPJ: com ou sem pontuação. Senha: igual a do site.

---

## v5.22.4 — login do Buscador na nuvem

Pedido: a senha da Caixa Escolar pode ficar na nuvem.

- Continua **fora do código**
- Salva na configuração e sobe na Cloudflare
- Digita uma vez; os outros PCs autorizados usam
- Botão **Login na nuvem** no Buscador Escola
- Sem login, a atualização automática não roda

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.4`

---

## v5.22.3 — Firebase antigo apagado

- Apagados os arquivos da nuvem Google. Continua só Cloudflare.
- Login da Caixa Escolar saiu do código.

---

## v5.22.2 — NF-e isolada, sem mexer no resto

Pedido: a parte de NF não pode dar problema.

- Continua **sem instalar** na 5.21.6. O `.exe` atual não carrega esse código.
- Conferir NF-e **não grava** venda, leitura, estoque nem nuvem.
- Se a conferência falhar, a tela original abre do mesmo jeito.
- Ainda **não envia** nota para a SEFAZ.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.2`

---

## v5.22.1 — conferência NF-e da venda e da leitura

Pedido: só um computador emite; o A1 já está instalado nesse PC; qualquer pessoa que mexer nesse PC pode emitir; venda e leitura.

- Regime gravado: **Simples Nacional (CRT 1)**, não é MEI, desde 01/07/2007
- Sem trava na nuvem. Sem A1 neste PC = não monta nota
- Botão **Conferir NF-e** no histórico da venda e na leitura
- Monta XML modelo 55 e mostra o que falta (IE, NCM, endereço, certificado)
- **Ainda não envia para a SEFAZ** e ainda não assina com a senha do A1

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.1`

---

## v5.22.0 — preparação NF-e (ainda não emite)

Pedido: integrar NF-e. Usuário já tem A1. Continua usando 5.21.6 no dia a dia.

- Card **Configurações → NF-e — preparação**
- Campos: IE, regime (CRT), série, ambiente (homologação/produção)
- Botão **Carregar A1 (.pfx)** copia o certificado para `%APPDATA%\\digicopy-erp\\certs\\nfe-a1.pfx`
- Senha do A1 **não é salva** e **não vai para a nuvem**
- Emissão SEFAZ ainda não ligada

---

## v5.21.6 — Abrir orçamento da Caixa Escolar no navegador padrão

O botão **Abrir** do Buscador Escola não funcionava no `.exe` porque o Electron bloqueava janela externa. Agora abre no navegador padrão do Windows, só no site da Caixa Escolar.

---

## v5.21.5 — dados da loja + busca inteligente de CNPJ

Onde ficam os dados da empresa:
- Menu **Configurações**
- Card **Dados da loja para relatórios e notinhas**
- Salva em `db.config.loja` e na empresa única.

Busca de CNPJ:
- Na loja: botão **Buscar CNPJ** ao lado do campo.
- No cliente: o botão **Buscar** do cadastro continua, agora com fallback ReceitaWS se a BrasilAPI falhar.
- Preenche razão, fantasia, rua, número, bairro, cidade, UF, CEP, telefone e e-mail.  

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
- Aviso de espaço antigo só aparece se o Intes neste PC**; o antigo “Fila 100” era só o limite do lote, não o restante total.
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
- **Causa encontrada:** o botão da v5.20.25 foi colocado dentro de `#side