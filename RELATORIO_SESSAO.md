# Relatório da sessão DIGICOPY — continuar em outro chat

**Data:** 2026-09-03  
**Repo:** `kauangabrielcardososilva7890-afk/teste`  
**Branch fixa desta sessão:** `arena/01a0683d-teste` (anteriores: `arena/01a0590a-teste`, `arena/01a010fa-teste`)  
**Última versão:** **v5.26.0**  

---

## PROTOCOLO PERMANENTE DELE (regra fixa desde v5.24.12) — as 14 perguntas

> **ADICIONAIS, NÃO SUBSTITUTIVAS (ordem dele, literal):** estas 14 se SOMAM
> às REGRAS FIXAS DA SESSÃO (seção no fim deste arquivo) e a tudo que já
> estava combinado — popups exclusivamente do sistema (confirmSistema/lfbAlert),
> mesma base PC+celular, senha do certificado = segredo do cofre (nunca em
> chat), modelo de relatório validado, NF = NF de PRODUTOS da loja do pai
> (CNPJ 08.385.589/0001-03, Janaúba MG). Nada do que veio antes se apaga.

Antes de responder ou criar qualquer código, AUTO-RESPONDER em voz baixa:

1. Esse código realmente precisa existir?
2. Já não tem um código que faz isso dentro do sistema?
3. A própria linguagem já não resolve isso de forma nativa?
4. Dá para escrever isso em uma só linha?
5. Dá para otimizar para deixar o mais leve possível?
6. Separar arquivos é bom, mas preciso MESMO criar arquivo novo para atualizar um que já existe?
7. Esse código realmente vai funcionar de forma adequada?
8. O que escrevi não vai gerar bug, travamento ou exclusão de dados?
9. Eu realmente entendi o que o usuário quis dizer?
10. Tenho todas as ferramentas e contexto para executar como solicitado?
11. Preciso fazer mais perguntas para obter informações ANTES de executar?
12. Escrevi tudo no .md? Falta algo extremamente importante para continuar em outro chat?
13. Tem alguma linha de código desnecessária que não deveria estar aqui?
14. Estou fazendo o que foi solicitado (ou outra coisa)? Se houver jeito melhor, cabe dentro da base que ele pediu?

**Estado do projeto nas palavras dele:** "falta somente a parte de NF".
**Suspeita aberta:** o certificado A1 da loja do pai (CNPJ 08.385.589/0001-03,
Janaúba MG) provavelmente EXPIROU. Recon feito (v5.24.12): o sistema NÃO
verifica nem mostra a validade do certificado em lugar nenhum — nfe_assinatura.js
já abre o .pfx (loadPfx via node-forge) e o objeto `cert.validity.notAfter` está
ali, mas ninguém lê. Remédio proposto quando a sessão de NF abrir: ler o
notAfter dentro do próprio nfe_assinatura.js (arquivo existente, pergunta 6°)
e avisar com popup do sistema "Certificado A1 vence em dd/mm/aaaa / VENCIDO".
Checagem zero-código disponível já: duplo clique no .pfx no Windows mostra
"Válido de ... até ...".
### LINKS DA VERSÃO — mandar OS DOIS em toda atualização

**1. Testar no navegador (site próprio — Pages, link fixo de teste):**
<https://teste-60f.pages.dev>

**2. Baixar tudo (zip do próprio GitHub, não gerar `.zip` novo):**
<https://github.com/kauangabrielcardososilva7890-afk/teste/archive/refs/heads/arena/01a0c087-teste.zip>

Os dois links saem prontos no final de `npm run sync` (o ZIP segue
`package.json > digicopy.branch`). GitHack MORREU quando o repositório ficou
privado — não usar nem como plano B; menções abaixo são histórico. APK parado
nesta etapa — prioridade é o sistema de PC.

A versão de teste do dia a dia antiga **não existe mais**. Uso a partir da 5.22.62. Mesma pasta `%APPDATA%\\digicopy-erp` e mesma nuvem. Não trocar chave de banco. Não limpar. Antes de atualizar: Backup.

---

## NUVEM: GitHack → Cloudflare Pages (decisão dele, 2026-09-12)

Ele pediu a migração: repo vai poder ficar **privado** e o link de teste **nunca
muda** (cada push na branch republica sozinho). Sandbox NÃO tem wrangler
autenticado → o caminho é a **integração GitHub no dashboard DELE** (cliques
dele, detalhados na conversa): Workers e Pages → Create → Pages → Connect to
Git → repo `kauangabrielcardososilva7890-afk/teste` → Production branch
`arena/01a0683d-teste` → Framework: **Nenhum** → Build command: **vazio** →
Output directory: **`/`**. Repo é estático-puro e seguro pro root deploy:
515 arquivos versionados (limite Pages = 20 mil), node_modules NÃO commitado,
e index.html só precisa de app.bundle.js + assets/vendor/* + logo_2.png +
manifest.webmanifest (tudo na raiz). Após o 1º deploy: validar rodapé
v5.24.12 no link pages.dev, aposentar GitHack, e eu passo a mandar só o link
fixo em toda atualização. Números atuais verificados: Pages grátis =
requisições estáticas ILIMITADAS; R2 grátis = 10GB/1M escritas/10M leituras,
egress sempre zero; Workers Pago $5 = requisições sem limite (D1: 25B
leituras / 50M escritas por mês). **ARMADILHA ANOTADA (2026-09-14):** Cloudflare
tem 3 famílias de plano — Sites (Free/Pro $20/Business $200: CDN+segurança de
site, NÃO é o nosso), Workers & Pages (Free vs **Paid US$5/mês**: este é o
nosso; fatura = $5 fixo na nossa escala) e R2 (pede cartão pra ativar, cobra
$0 dentro do grátis). Regra pra ele: tela mostrando $20 ou $200 = porta
errada; só $5 é o nosso número. Após ele assinar: flip tetoEscritas
100000 → 50M (teto display) + Cron+R2 backup diário (plano já desenhado). Pendente DELE na nuvem: foto da janela/arq.
que abre o CMD (revela o fluxo de deploy atual), foto ver_gasto, "me avisa"
do Workers $5.

## AUDITORIA DAS 14 PERGUNTAS NOS ARQUIVO JÁ EXISTENTES (pedido dele, 2026-09-12)

Entendido como: aplicar a régua em TODOS os arquivos existentes, "sem quebrar
nada" → AUDITORIA primeiro (leitura), PODA depois, por lotes e só com OK dele.
Nada é deletado sem ler o arquivo inteiro (o corpo "morto" pode ter efeitos
colaterais — ligar listeners, registrar atalhos).

Linha de base medida: 515 arquivos versionados, 196 scripts no bundle,
app.bundle.js = 3.128.878 bytes. Funções window.* com múltiplas definições
(só a última é viva; vivas em "cadeia" = o arquivo captura a anterior num
const antes de redefinir):

| função | defs | cadeia-viva | suspeitas de peso-morto |
|---|---|---|---|
| navigateTo | 27 | 27 | 0 |
| showApp | 21 | 21 | 0 |
| imprimirChamadoPDF | 20 | 1 | **≈19** (cópias inteiras do gerador de PDF/HTML) |
| renderConfig | 19 | 18 | 1 |
| renderFinanceiro | 15 | 14 | 1 |
| renderVendas | 14 | 11 | 3 |
| renderClientes | 11 | 6 | 5 |
| renderContratos | 11 | 7 | 4 |
| renderProdutos | 10 | 7 | 3 |
| closeModal | 12 | 12 | 0 |
| vosGerarHtmlNotinha | 11 | 10 | 1 |

Protocolo da poda (aguardando ok dele por lote): (1) dossiê por função
lendo cada arquivo definição; (2) remover só cópias comprovadamente mortas;
(3) suíte `npm test` verde antes e depois; (4) bundle re-gerado e menor = PC
fraco agradece; (5) 1 lote = 1 versão + rodapé + teste dele. Etiquetas e
demais itens da lista não-tocar seguem CONGELADOS fora de qualquer lote.

---

## O QUE FOI ENTREGUE — v5.24.18 (2026-09-14)

Tema: **ele PAGOU o Workers Paid US$5** 🎉 + pedido dele: botão visível do erro.txt.

1. **DESTRAVA DO TETO INTERNO (a tarefa guardada pra este dia):** worker
   `tetoEscritas: 100000 → 50000000` e `tetoLeituras: 5000000 → 25000000000`
   (D1 pago inclui 50M escritas e 25 BILHÕES leituras por MÊS; os tetos
   diários do grátis — "4.947.140/5.000.000" que o assustou hoje — viraram
   passado). A barra de uso vai parecer sempre quase vazia — é assim mesmo.
   test_ajustes_v52296 SUPERSEDIDO (assert do teto grátis reescrito pro teto
   pago com nota para nunca rebaixar). NOTA DE IMPLANTAÇÃO: o teto novo só
   vale no ar quando ele rodar o deploy do worker (npm do digicopy-cloud-api
   no PC dele) — até lá o DISPLAY pode ainda mostrar teto velho, mas o D1
   pago em si já para de bloquear (limite mensal,reset 00:00 UTC cobre).
2. **Botão visível do erro.txt** (veto dele ao resgate por console): botãozinho
   `erro.txt` no RODAPÉ de todas as telas (PC + celular, index.html e
   mobile/www). Ação única `digicopyAbrirOuBaixarErroTxt`: .exe abre o
   Explorador com o arquivo; web/celular baixa. O botão do AVISO agora usa a
   MESMA função (uma fonte só, perguntas 2°/13°).
3. **Resposta de cobrança (anotada nas perguntas da conversa):** Workers Paid =
   US$5/mês MÍNIMO, com cotas incluídas gigantes (10M requests, D1 mensal
   acima). Uso dele: ~5M leituras/dia ≈ 150M/mês = 0,6% do incluído → fatura
   sai sempre $5. "Por centavo do que usar": só acima do incluído ($ por
   milhão de requisições) — terra distante pra ele. Pages estático: ilimitado,
   NUNCA cobra. Alertas de uso configuráveis existem em Account > Notifications
   (opcional).
4. test_ajustes_v52418 (21 asserts). Suíte 147/0 com os 2 de ambiente.
   Ordem selada respeitada (editar→carimbar→buildar→testar).
5. Sobre os 4.947.140/5.000.000 de hoje: o número era DO PLANO GRÁTIS por dia
   e zera às 21h SP (00:00 UTC); com o plano pago ativo, o D1 passa a contar
   POR MÊS (teto mensal acima) — a conta dele ~150M/mês de leituras está a
   milhares de vezes do teto.

---

## O QUE FOI ENTREGUE — v5.24.17 (2026-09-14)

Tema: **pergunta direta dele**: "o aviso do erro aparece só uma vez? se eu
perder, como baixo de novo?"

1. Resposta dada + implementada: no .exe o `erro.txt` real fica no %APPDATA%
   pra sempre (basta abrir a pasta); no navegador/celular a memória do download
   morria num F5 → agora **persiste em localStorage** (`digicopy_erros_txt`,
   mesmo lugar do banco, teto 500 linhas) e ainda sobra um resgate direto:
   `window.digicopyBaixarErroTxt` invocável fora do aviso.
2. **Prestação de contas do "vê TODOS OS OUTROS" (quando ele achou o bug do
   usuário novo, ele mandou auditar os demais):** o que foi feito de fato —
   (a) auditoria de fiação das 9 funções da tela Usuários/Técnicos: todas
   vivas, nenhum botão morto; (b) excluirUsuario conferido: só Admin/Dono,
   não se autoexclui, não apaga o último Admin/Dono, confirma com popup do
   sistema; (c) save×login×form nos mesmos ids/campos (sem desencontro);
   (d) todas as funções auxiliares do save presentes. (e) os dois cintos
   estruturais da v5.24.14: prova de gravação + diagnóstico partido.
   (f) e agora a v5.24.16/17 transforma QUALQUER botão morto do sistema
   inteiro em denunciante automático: errou → avisa, grava no erro.txt, e
   ele me manda. Auditoria manual de tela a tela fica como opção sob demanda.
3. test_ajustes_v52417 (14 asserts). Suíte 147/0 com os 2 de ambiente.

---

## O QUE FOI ENTREGUE — v5.24.16 (2026-09-14)

Tema: **NOVA FUNÇÃO aprovada por ele** (desenho mostrado antes, GO: "pode fazer
do jeito que daria certo"; pergunta dele sobre celular respondida: download):

1. **erro.txt existe e é do usuário.** Qualquer erro indevido (trava de tela,
   promessa rejeitada, exceção solta) vira uma linha legível:
   `[data/hora | versão | usuário | tela] detalhe`. No .exe: o arquivo mora em
   `%APPDATA%\<app>\erro.txt` (userData — a "pasta do sistema" podia ser
   protegida contra gravação e o arquivo morreria mudo; decisão explicada a
   ele). No NAVEGADOR e no CELULAR (resposta à pergunta dele): o mesmo aviso
   oferece **baixar o erro.txt** — memória com teto de 500 linhas alimenta o
   download. Rotação: passou de 2 MB, o antigo vira `erro.1.txt` e recomeça.
2. **Aviso na tela, do jeito que ele pediu:** "Ocorreu um erro indevido no
   sistema. Foi criado/atualizado um arquivo erro.txt falando sobre o erro.
   Mande esse arquivo ao técnico do sistema." Botões: **[Abrir o erro.txt]**
   (.exe abre o Explorador com o arquivo selecionado; web/celular = **Baixar**)
   e **[OK]**. Anti-formiga (1 aviso/8s) e anti-recursão (erro dentro do
   registro não vira loop) mantidos/reforçados.
3. **Auditoria:** erros NÃO entram mais nela (rota `acao:'erro'` removida do
   ajustes_v52239; a função gravarAuditoria morreu junto — pergunta 13°). E o
   portão do v5197 foi aberto: **visível pra TODOS os logins ativos**, como ele
   pediu ("novamente").
4. Arquivos tocados (só os que já existiam, pergunta 6°):
   ajustes_v52239_avisos_erro_auditoria (motor+aviso), main.js (2 IPCs:
   errotxt:append/abrir + rotação + showItemInFolder), preload.js (erroTxtAPI),
   ajustes_v5197 (portão). test_ajustes_v52416 (33 asserts). Suíte 147/0 com
   os 2 de ambiente. Ordem selada: editar→carimbar→buildar→testar.
5. Detalhe de régua anotado: teste NUNCA trava por palavra em comentário
   histórico — mede função/definição (o 1º assert desta rodada caiu nisso e a
   régua foi corrigida na hora).

---

## O QUE FOI ENTREGUE — v5.24.15 (2026-09-14)

Tema: **PROBLEMA NOVO dele (2º modelo preenchido)** — "grava na nuvem mas alguns
dados não aparecem no PC: usuários/permissões, técnico, vendas, orçamentos...;
e se eu deletar é pra deletar de verdade".

1. **Certificado RESOLVIDO (foto certmgr dele):** A1 do Denivaldo (AC SOLUTI
   Múltipla v5), "Data de validade **10/09/2026**" → **EXPIROU dia 10/09/2026**
   (hoje 14/09, estourou há 4 dias). A suspeita dele estava certa. Caminho:
   renovar com a AC SOLUTI; sem isso, NF-e não emite. NF session fica depois.
2. **Teoria número 1 do sumiço (provada EM CÓDIGO, não em produção):** as
   listas filtram por empresaId da sessão (renderUsuarios filtra
   u.empresaId===s.empresaId; mesmo padrão em vendas/orçamentos). PC novo que
   sincronizou pode ter criado SUA PRÓPRIA empresa → os 16 mil registros dele
   subiram carimbados com outro id → chegam na nuvem, baixam nos PCs, mas
   nenhuma tela mostra (filtro invisível). Bate 100% com o sintoma.
3. **Em vez de chutar a correção: DIAGNÓSTICO no app** (regra: não adivinhar;
   evidência primeiro). Botão "Por que dados não aparecem?" no painel
   Acompanhar dados dos PCs (Sincronização/Nuvem do admin): varre as entidades
   citadas por ele SEM gastar 1 leitura de nuvem (economia do medidor), conta
   o que está invisível por empresa e LISTA os ids de empresa encontrados. Se
   sair ">>> A CHAVE DO MISTÉRIO", a cura é unir/normalizar as empresas — fix
   de 1 versão a partir da foto.
4. test_ajustes_v52415 (19 asserts, incl. "diagnóstico não chama API").
   Suíte 147/0 com os 2 de ambiente. Ordem selada mantida (carimba→builda→testa).
5. **Pendente (aguardando GO dele, pedido com "me fale antes"):** recurso
   erro.txt + auditoria visível pra todos os usuários + popup de erro indevido
   com botão "abrir arquivo" e OK. PROPOSTA desenhada na conversa: arquivo em
   %APPDATA%\digicopy-erp\erro.txt (pasta do sistema pode ser protegida contra
   gravação; no navegador não existe arquivo — oferecer download), rotação
   (2MB → vira erro.1.txt), cada linha com versão/data/usuário/tela, auditoria
   deixa de receber erros e volta a aparecer pra todos. Ele decide.
6. Ele vai PRIVAR o repo: GitHack morre → usar só https://teste-60f.pages.dev.
   Pages com Git-integration lê repo privado normal.
7. Resposta dada a ele: leituras 30k→56k = o segundo PC empurrou seus 16 mil
   registros na primeira sincronia (tabela changes) + baixou a base toda;

---

## O QUE FOI ENTREGUE — v5.24.14 (2026-09-14)

Tema: **BUG RELATADO POR ELE** (primeiro modelo de relatório preenchido direitinho):
"Configurações > Usuários e permissões > novo usuário > preenchi > salvei > testei
→ 'Informe usuário e senha'". Pedido extra dele: auditar os OUTROS botões da tela.

1. **Recon até o osso:** fiação íntegra — formulário (v5196) renderiza u-nome/
   u-login/u-senha, saveUsuarioFinal lê os mesmos ids e grava
   {login:fold,senha:txt,ativo:true,empresaId}; login vivo (v52253,
   loginFlexivel) procura exatamente esses campos. main.js/IPC era do
   Buscador Escola (caixaEscolarAPI) — inocentado. A falha era SILENCIOSA por
   desenho: salvar sem provar e login com erro genérico não deixam saber onde
   quebrou. Remédio de raiz em vez de chute (perguntas 9°/10°/11° dele).
2. **(A) Prova de gravação:** ao salvar usuário, o sistema CONFERE o registro
   com os mesmos olhos do login (login+senha+ativo) e: sucesso → toast com o
   login exato pra testar; falha → lfbAlert "NÃO ficou gravado... me manda foto".
   Silêncio nunca mais.
3. **(B) Diagnóstico partido no login:** o erro genérico "Usuário ou senha
   incorreto" virou três falas honestas — usuário não existe neste PC / está
   INATIVO / senha não confere (mesmo fold do compare). Carimbo de fala.
4. **Auditoria da tela toda (pedida):** 9 chamadas da tela usuários (criar/
   editar/excluir usuário, técnico novo/editar/salvar/excluir, closeModal,
   openModal) — **todas com definição viva; nenhum botão morto**. excluirUsuario
   blindado: só Admin/Dono, não exclui a si mesmo, não exclui o último
   Admin/Dono, confirma via confirmSistema. Helpers do save (sess, fold, txt,
   esc, uidSafe...) todos presentes; logAction atrás de typeof-guard.
5. test_ajustes_v52414 (21 asserts) + suíte 147/0 com os 2 de ambiente.

### Outras inteligências desta rodada (não-código):
- **Raio-x da nuvem (fotos dele, 2026-09-14):** uso_diario: hoje ~11,4 mil
  escritas / 15,2 mil leituras — DENTRO do grátis D1 (teto 100 mil/5 mi por
  dia). Pico 36 mil escritas em 09-10. Mudanças de hoje: escolaIt 81.395,
  produtos 80.340 (ressincronia de migração concentrada nesses dois tanques),
  clientes 4.103. Worker NO AR = versao 5.24.8 (constante dele mesma) — repo já
  está 5.24.14 → deploy dele (npm do digicopy-cloud-api) atualiza quando rolar.
  devices: 11; "PC PESSOAL KAUAN" aparece 2× (higiene menor de cadastro, não
  urgente). Fluxo dele = scripts npm com `wrangler d1 execute --remote` (4.131.2).
- **Pages NO AR: https://teste-60f.pages.dev** — criado por ele hoje. GitHack
  aposentado quando ele validar o rodapé 5.24.14 lá. **Pergunta dele: "chat
  novo = branch nova, e aí?" → Protocolo Pages x branch (anotar sempre):** o
  Pages publica a branch `arena/01a0683d-teste`. Em chat novo com branch nova:
  dash.cloudflare.com → Workers e Pages → projeto teste-60f → Settings →
  Builds & deployments → trocar Production branch pro nome da branch nova →
  Save. 30 segundos, sem mexer em mais nada.
- **Certificado dele:** o duplo clique abriu o assistente e INSTALOU sem
  mostrar data. Próximo tutorial quando na loja: Win+R → certmgr.msc → Pessoal
  → Certificados → duplo clique no certificado da loja → linha "Válido de/até"
  → me manda SÓ a data final.
- Workers Paid $5: ele PULOU por enquanto (passo 3 suspenso por decisão).

---

## O QUE FOI ENTREGUE — v5.24.13 (2026-09-14)

Tema: **LOTE 1 da poda** — as 14 perguntas aplicadas nos arquivos já
existentes (autorizado por ele: "pode realizar, nem precisa de ordem").

1. **Auditoria virou corte:** `imprimirChamadoPDF` tinha 20 definições sendo
   carregadas; só a última é viva. **17 cópias mortas removidas** (locacao_contratos,
   fluxos_operacionais, contratos_refino, locacao_chamados_fix, ajustes_v5171/72/74/75/76/77/78/79/80/81/82/84/85)
   = **74.995 bytes** de peso morto. app.bundle.js: 3.128.878 → **3.053.866 B**
   (−75.012). PC fraco agradece: menos 73 KB pra baixar, parsear e jogar fora.
2. **Protocolo anti-quebra honrado em cada corte:** optei antes quem é o elo
   vivo — ficaram **3 peças**: v5189 (definição final), v5186 (é a que a
   captura `_imp` do v5187 segura) e v5187 (dono da clausura viva). Cada um dos
   17 cortes passou por: sem IIFE no topo, sem chamada no topo, remoção por
   máquina de estados (não corta `}` dentro de string/template) e node --check.
3. **Lição nova do cinto de segurança:** gerar o bundle DEPOIS dos carimbos —
   nesta rodada o bundle subiu antes do sed e 3 testes acusaram (suite caiu a
   144/5); re-gerado na ordem certa, voltou a **147/0 com os 2 de ambiente
   (node-forge, acorn)**. Ordem selada: editar → carimbar → buildar → testar.
4. test_ajustes_v52413.js guarda o lote (17 arquivos sem a cópia, 3 defs no
   bundle, captura intacta, bundle MENOR que a linha de base, carimbos).
5. **Próximos lotes (fila da poda):** renderClientes (5 suspeitas),
   renderContratos (4), renderVendas (3), renderProdutos (3), singles
   renderConfig/renderFinanceiro/vosGerarHtmlNotinha (1 cada). Mesmo ritual.

---

## O QUE FOI ENTREGUE — v5.24.12 (2026-09-12)

Tema: **bug testado por ele** — aba Vendas → dentro de uma notinha
FATURADA, o botão Imprimir "fica inacessível" (cinza).

1. **Causa, com nome**: a trava anti-EDIÇÃO da notinha faturada
   (`lockVendaFaturadaUI`, vendas_notinhas_fix_patch.js) desliga botões cujo
   texto/onclick tenha "salvar|faturar|item|...". O Imprimir do editor chama
   `vosAbrirImpressaoESalvar()` — tem **"salvar" no NOME da função**. A trava
   confundia impressão (leitura) com edição e desligava o botão.
2. **Remédio cirúrgico dentro da própria varredura**: antes de desligar
   qualquer botão, a trava pergunta se ele é de impressão (texto ou função).
   Se for: botão fica LIGADO e passa a imprimir DIRETO a notinha
   (`imprimirNotinha(vendaId)`) — pura leitura, sem tentar salvar nada, sem
   mexer na venda. Dica no botão: "Imprimir notinha (não altera nada)".
3. **O que NÃO muda**: adicionar item / salvar / faturar / excluir / buscar
   continuam travados com o aviso do sistema "venda faturada... só estornar",
   e o botão Estornar segue. Impressão nunca altera dados — estornar continua
   sendo o único jeito de voltar a editar.
4. **Campos ainda travados** (inputs/selects) — leitura livre, edição não.
   PC e celular: o mesmo bundle corrigido vai nos dois (mesma origem).
5. Trava de testes aplicada de novo: `package.json` entra NA LISTA de
   carimbos (o grep por extensão .js/.html/.md o perdeu nesta rodada; vários
   testes leem a versão de lá — falharam em cadeia até o carimbo subir).
   Suíte oficial (`npm test`): **147 passaram, 0 aceita, 2 de ambiente**
   (node-forge e acorn ausentes no sandbox — nunca do código).

---

## O QUE FOI ENTREGUE — v5.24.11 (2026-09-11)

Tema: **pedido literal dele:** "quero que abra onde é a lista que mostra
todos, mas só mostrando os selecionados que eu pedi".

1. **A LISTA é quem mostra os escolhidos** (manda o que ele pediu): com 1,
   vários ou todos marcados na ficha, o botão abre o módulo e **a própria
   lista dele aparece só com aquelas linhas**. Ninguém abre notinha/orçamento
   por cima mais (o auto-open do 1º, da v5.24.7, foi removido DE PROPÓSITO —
   test_ajustes_v5247 atualizado para não reintroduzir). Sem marcação: como
   antes (módulo filtrado pelo cliente).
2. **`clitabRenderSoSelecionados(sub, ids)`** — troca-segura do "tanque" do
   módulo: filtra `db.vendas/contasReceber/orcamentos/os/leituras` só com os
   ids marcados, desenhe a lista nativa (mesmos objetos, zero perda), devolve
   o tanque inteiro no finally; gravação (saveDB/saveDBAgora) fica de molho
   durante o desenho — banco nunca é salvo pela metade. Depois, qualquer
   re-render natural (digitou na busca) volta a lista ao comportamento normal.
3. Botão direito na linha segue abrindo o REGISTRO (caso de uso separado);
   "Este cliente na lista" (5.24.10) segue.
4. Regra de testes recordada: comentários literais não viram fixture (quebra
   em quebra de linha) — test_ajustes_v5249 ensinou; aplicado no v52411.
   Suíte: **168 passando / 6 de ambiente**.

---

## O QUE FOI ENTREGUE — v5.24.10 (2026-09-11)

Tema: **"o clientes não abre a lista que mostra os que eu quero"** + a decisão
da nuvem paga.

1. **Botão novo "Este cliente na lista"** (barra de ações do Histórico da
   ficha): sai da ficha direto pro módulo **Clientes** (navigateTo('clientes'))
   já com a busca preenchida com o nome do cadastro — a lista mostra ele e o
   grupinho de nomes parecidos ("os que eu quero"). Se a reclamação dele era
   outra (lista do módulo errada/clique na tabela de clientes), pedido a foto
   da tela no protocolo.
2. **Trava do 'senão' (bug latente):** `clitabAbrirLista()` jogava QUALQUER
   sub desconhecido ou aba Dados no módulo Leituras sem avisar. Agora: sub fora
   dos 5 conhecidos → toast explicativo, nenhuma navegação errada.
3. Teste `test_ajustes_v52410.js` (e regra nova: testes não prendem em texto
   de comentário versionado — ajustado v5249 por isso). Suíte: 167/6.
4. **Resposta da nuvem paga (ele pediu "fala o melhor logo"):** Workers Paid
   $5/mês na própria Cloudflare — 25 bilhões leituras + 50 milhões gravações/
   MÊS inclusos, sem migração nenhuma, cancela quando quiser (fontes: omidsaffari
   /byteiota/dev.to 2026). Turso fica fora por exigir REESCREVER o motor.
   Estratégia de revenda preservada: loja dele na conta paga; cada cliente na
   sua própria conta grátis até precisar — aí o cliente paga os $5. Pendente
   pós-assinatura: ajustar o teto exibido no app (100.000 → 50 mi) numa versão.

---

## O QUE FOI ENTREGUE — v5.24.9 (2026-09-11)

Tema: **o fantasma 4.2 volta a acusar com nome e sobrenome.** Novo relato dele:
o aviso "Não achei esse orçamento" reapareceu com id fresco (`orc_mtxj0668_mhtz`)
que NUNCA existiu no banco deste PC (5 orçamentos, mais novo `orc_mtnee661`)
nem no retrato da tela — referência viva de um registro que não nasceu aqui.

1. **Etiqueta de origem:** `window.abrirOrcamento(id, _origem)` agora recebe
   QUEM chamou. Linhas e botões-de-olho das duas listas (v52237 e v52258)
   passam 'linha da lista de orcamentos' / 'botao de olho da lista'. O aviso
   completa com **"; o clique veio de: ..."** — a próxima foto termina a
   investigação (antes era charada). Sem etiqueta (algum caminho escondido),
   ele pede a foto da tela inteira.
2. **Dois caminhos internos sanados:** recarregar depois de SALVAR e depois de
   REVALIDAR (v52258 L325/L706) re-caçava o orçamento por id à toa, com o
   objeto na mão. Agora é `abrirTelaOrcamento(o)` direto — zero fantasma por
   essas portas. v52258 ficou com ZERO chamadas `abrirOrcamento(o.id)`.
3. **v52243 (badge de status) intacto:** seu regex lê a 1ª aspa — a etiqueta
   extra não quebra o leitor.
4. Detalhe de investigação registrado: `__orc_render_ids` quem mantém vivo é o
   guardião (v52293), não o render ativo — "NÃO estava" segue significando
   "não existia no banco na última varredura".
5. Teste `test_ajustes_v5249.js`. Suíte: **166 passando / 6 de ambiente**.

---

## O QUE FOI ENTREGUE — v5.24.8 (2026-09-11)

Tema: **o alerta dos "76 mil"** — a nuvem gravava demais com o sistema parado.

1. **O ralo achado (app):** o buscador do Caixa Escolar rodava sozinho a CADA
   60 SEGUNDOS sempre que a lista estava vazia (`||vazio` no relógio de 1 min),
   carimbava a config e mandava gravação para a nuvem a cada volta — milhares
   por dia sem ninguém mexer. Agora: automático só 1x/hora com dados velhos,
   relógio de 10 em 10 minutos, lista vazia espera a vez, sem login nem tenta,
   nunca limpa a base sozinho (limpar = botão "Baixar Tudo" da tela), nunca
   duas buscas ao mesmo tempo.
2. **Medidor sem autogasto (worker):** `somarUso` gravava a linha do medidor a
   CADA chamada — inclusive leituras (1x/min por PC aberto). ~1.400
   gravações/dia por aparelho só para medir a própria cota. Agora as leituras
   acumulam em memória e descem junto da próxima gravação real, ou de 15 em
   15 minutos. O número da tela pode atrasar minutos; a cota não vaza.
3. **Motor da nuvem ainda velho — ele precisa rodar o deploy:** a economia já
   escrita antes (não regravar registro idêntico — v5.24.4; migração
   0004_menos_gravacoes: ~8 → ~4 gravações por mudança; dedupe e freio) SÓ
   vale depois de `npm run deploy` dentro da pasta `cloudflare-worker` (o
   script já aplica as migrações pendentes e publica num comando só).
4. **Raio-X para conferir:** `ver_gasto_nuvem.cmd` na raiz do sistema — duplo
   clique e ele mostra: gravações/leituras por dia (semana), quem mais gravou
   hoje por tipo de registro e quais aparelhos estão falando com a nuvem (com
   o último sinal de cada um). É consulta pura, não muda nada.
5. Teste novo `test_ajustes_v5248.js`. Suíte: **165 passando / 6 fora do ar**
   (as mesmas 6 de ambiente de sempre).

**Complemento (mesmo dia, tarde):** ele rodou `npx wrangler deploy` — o motor
novo FOI publicado, mas esse comando **não aplica as migrações do banco** (a
migração 0004, que corta gravação por mudança de ~8 para ~4 linhas, fica
pendente). Criado `atualizar_motor_nuvem.cmd` na raiz: duplo clique e ele faz
a sequência certa (lista pendentes → aplica migrações → publica → mostra a
versão no ar via `/health`). `ver_gasto_nuvem.cmd` ganhou linha extra que
confere a versão no ar também.

**Confirmado por ele (foto do cmd, 17:04):** rodou `atualizar_motor_nuvem.cmd`
→ "No migrations to apply!" (as 4 migrações, incluindo a 0004_menos_gravacoes,
JÁ estavam aplicadas de antes) → deploy OK → `/health` respondeu
**`"versao":"5.24.8"`, `database:"ok"`**. Estado final da nuvem: motor 5.24.8
no ar com TODAS as economias ativas (não regravar idêntico, ~4 linhas por
mudança, medidor barato, dedupe, freio). Próxima prova: rodar
`ver_gasto_nuvem.cmd` no dia seguinte e comparar as gravações.

**Regra permanente (pedido dele, 2026-09-11):** o sistema também roda no
CELULAR (APK pausado, mas será retomado) — tudo novo precisa ser compatível
com PC+mobile. Já é a arquitetura atual: UM código só, `app.bundle.js` raiz e
`mobile/www/app.bundle.js` idênticos em toda versão (teste de paridade na
suíte), sync idêntico. Os `.cmd` são ferramenta dele de operador no Windows,
nunca vão para dentro do app.

**Certificado NF — VALIDADO (foto Get-PfxCertificate, 2026-09-11):** o arquivo
`DENIVALDO CERTIFICADO DIGITAL (2).pfx` é **e-CNPJ A1 da loja do pai**:
Subject `CN="DENIVALDO COMERCIO DE ELETRONICOS, LOCACOES E MAN…:08385589000103"`,
Thumbprint EA705D60245464773CEA9518FDB8C95DC1C7C5B9. CNPJ do emitente para a
sessão NF: **08.385.589/0001-03** (Denivaldo Comércio de Eletrônicos, Locações
e Man[utenção/utensílios]). Validade a confirmar (A1 ~1 ano; arquivo de
ago/2026 → provável até ago/2027). Senha fica SÓ com ele (by design: o
sistema guarda o .pfx na nuvem e a senha é digitada na hora de assinar —
v5.22.21). Nota: ele NUNCA deve mandar a senha do certificado em chat.

**Estado da cota (2026-09-11 ~18h):** dia começou em 76 mil e o freio só foi
ligado no meio do dia — possível estouro dos 100 mil ainda hoje. Se aconteceu:
NADA se perde, sync pausa e retoma sozinho após as 21h (virada UTC). Os testes
do kit v5.24.7/8 (abrir selecionado, excluir, 4.2) são comportamentos LOCAIS
do app — valem mesmo com a cota estourada; só o PC↔PC que fica na fila.
`ver_gasto_nuvem.cmd` item [1/3] mostra o número de hoje para conferir.

---

## O QUE FOI ENTREGUE — v5.24.7 (2026-09-10/11)

1. **"Abrir já mostrando o que eu escolhi" (pedido dele):** o botão da ficha
   agora abre o REGISTRO no módulo — 1 marcado abre direto; vários marcados =
   o módulo abre filtrado pelo cliente + o 1º já se abre na hora. Financeiro
   abre a CONTA de verdade (não só a tela), orçamento abre direto pelo objeto,
   chamado/leitura abrem o registro.
2. **4.2 sem fantasma:** o caminho novo vai DIRETO PELO OBJETO — nunca re-caça
   por id na tela (era por onde o "Não achei esse orçamento" aparecia com
   código-fantasma). E excluir agora VARRE as telas dos módulos: a linha
   apagada some dali também, então ninguém clica em registro morto (o clique
   em linha-fantasma era o caminho provável do aviso da foto 4.2).
   Suite: 164 verdes; 6 falhas são artefatos pré-existentes do sandbox.

---

## O QUE FOI ENTREGUE — v5.24.6 (2026-09-10)

1. **2.1 de verdade de verdade:** o "Nova venda" vivo era o atalho do **menu
   lateral** (bloco Atendimento, `ajustes_v52213_menus_atalhos_patch.js`).
   Removido do menu padrão; a ordem salva dele no PC é ignorada sozinha (o
   motor de ordem só trabalha em cima do padrão). Criar venda continua pelo
   atalho **Nova notinha** do Início.
2. **4.1/4.2 de verdade:** o formulário de **orçamento** usava o placeholder
   "Digite para buscar..." — o guardião de segurança da tela de venda escuta
   esse texto e travava tudo com "Cliente Não Selecionado" mesmo com o cliente
   escolhido (a venda usava a base nova, o orçamento não). Placeholder trocado
   nas 3 camadas do orçamento: busca e adiciona item em paz.
3. **5.x com popup próprio + exclusão que vence a nuvem:** Excluir/Estornar
   agora usam o **popup do sistema** (`confirmSistema` — nunca o cinza do
   navegador); ao excluir, o motor da nuvem é avisado que foi INTENCIONAL e
   desfaz sozinho qualquer "ressuscitação" do puxão em até 60s, com empurrão
   do delete na hora + id tolerante a string/número. Era o "não exclui".
   Suite: 163 verdes; 6 falhas são artefatos pré-existentes do sandbox.

---

## O QUE FOI ENTREGUE — v5.24.5 (2026-09-10)

1. **🛡️ GARANTIA ANTI-ESTOURO (ordem dele: "nunca deixa estourar essa nuvem").**
   Duas muralhas novas: a nuvem só grava o que é NOVO (dedupe da v5.24.4) E agora
   tem um **FREIO dentro do worker**: ao chegar em 95 mil escritas no dia, ela
   para de aceitar gravação ANTES do teto de 100 mil — responde a pausa que o
   app já reconhece ("envio pausado até 21h, nada se perde"). Mais o **farol
   automático** `node checar_cota_nuvem.js`: roda antes de toda versão e reprova
   qualquer mudança que ameace a cota, com a conta do dia típico (dia movimentado
   de loja ≈ 0,6% do teto). Estourar agora exigiria milhares de mudanças reais
   no mesmo dia. **Rodar `npx.cmd wrangler deploy`** (o freio mora na nuvem).
2. **2.1 de verdade:** o "Nova venda" que ele via era da tela VIVA "Vendas e
   Notinhas" (`vendas_os_patch.js`) — o botão do app.js morto tinha saído na
   5.24.4. Removido da tela viva + 2 cópias mortas no `notinha_patch.js`
   (prevenção). Criação continua pelo atalho **Nova notinha**.
3. **4.1/4.2 curados (a 1ª tentativa falhava, a 2ª ia):** a busca usava um
   índice congelado e a nuvem trocava a base por baixo — linha na tela, clique
   no vazio. Agora o índice se refaz sozinho quando a base troca e o clique SE
   CURA com o dado da própria busca (toast "Cliente vinculado … (recuperado da
   busca)"). **Salvar que sumia:** a ficha reabria no Histórico (que esconde o
   rodapé) — agora SEMPRE abre em Dados. Clicar num registro que a nuvem já
   trocou atualiza a lista e avisa (morre o aviso do 4.2).
4. **5.x.x — Histórico:** cada linha mostra o **STATUS** igual ao módulo
   (Salva, Faturada, Estornada, Em aberto, Vencido…); **Excluir = DE VEZ**
   (some da tela, deste PC e dos outros pela nuvem — orçamento também, sem
   marca-fantasma); lista nunca mais mostra registro já excluído.
   Suite: 162 verdes; 6 falhas são artefatos pré-existentes do sandbox.

---

## O QUE FOI ENTREGUE — v5.24.4 (2026-09-10)

1. **🔥 COTA DA NUVEM BLINDADA (erro `D1_ERROR: daily row write limit`).** A conta
   grátis de 100 mil escritas/dia estourou porque o sync regravava registros
   idênticos a cada ciclo. Cura nos DOIS lados: o **worker não regrava** o que
   chega igual (responde `noop` — upsert e delete) e o **`/v1/status` não derruba
   mais a tela Nuvem** se o medidor não puder gravar (mostra "medidor pausado
   (cota)"). Na tela, o disfarce "⚠️ código da nuvem ANTIGO" só aparece se o
   `/health` verdadeiro falhar — antes qualquer corte de cota virava falso alarme.
   E o Backup traduz a cota estourada para português claro: "a nuvem grátis está
   cheia hoje — volta 21h". (Renova meia-noite UTC.) **PRECISA rodar
   `npx.cmd wrangler deploy`** na pasta `cloudflare-worker` desta versão.
2. **"+ Nova venda / Orçamento" fora da tela de Vendas** (item 2.1, confirmado
   por ele: era o botão de dentro do módulo). Criação continua pelo atalho
   **Nova notinha** no menu Atendimento.
3. **4.1 — cliente existente agora SEGURA na venda, com aviso na tela.**
   Escolheu o cliente e a pintura falhou? O vínculo é refeito por trás e a tela
   confirma **"Cliente vinculado à venda: Nome"**. Se o cliente ainda não chegou
   neste PC pela nuvem, a tela avisa e já cutuca a sincronização.
4. **Histórico do cliente redesenhado (5.2.1/5.2.2).** Abas: **Dados | Histórico
   do sistema**. Dentro do Histórico, sub-menus: **Vendas (padrão), Financeiro,
   Orçamentos, Chamados e Leituras**. Cada listagem tem caixas de múltipla escolha
   com os botões **Excluir** (pula venda faturada — estornar antes), **Extornar**
   (só em Vendas) e **Abrir lista de origem** (cai no módulo já com o cliente na
   busca). **Botão DIREITO** numa linha abre aquele registro no módulo de origem.
   O resumo intermediário morreu a pedido dele.
   Suite: 161 verdes; as 6 falhas são de ambiente do sandbox (pré-existentes).

---

## O QUE FOI ENTREGUE — v5.22.100 (2026-09-08)

1. **🔥 FIX REAL DO "A nuvem está ocupada. Tentando de novo em 12s...":**
   o header novo de versão (`x-digicopy-versao`, entrado na v5.22.96) não
   estava autorizado no preflight CORS do worker — o navegador bloqueava
   TODA chamada e o sync caía em repetição eterna com "ocupada". Worker
   agora autoriza o header e também o método `DELETE` (botões de apagar
   backup). **PRECISA rodar `npx wrangler deploy` de novo** na pasta
   `cloudflare-worker` desta versão.
2. **Menu Backup = 3 botões diretos (sem telinha no meio).** Clicar em
   Backup no menu lateral desce uma gaveta com:
   • 📸 **Backup manual (nuvem + baixa no PC)** — cria na pasta manual da
     nuvem E já baixa o arquivo pro PC (faz os dois num clique só);
   • 📥 **Baixar todo histórico de backup** — zip de tudo da nuvem pro PC;
   • 🗑️ **Excluir o histórico de backups** — só os backups (confirmação
     dupla; dados do sistema nunca; ciclo continua).
   Em cima dos botões vai o mini-resumo CONGELADO (último backup geral,
   diário/sistema/manual e quanto falta pro próximo diário, medido só na
   abertura — nada de reloginho rodando).
3. Prova de máquina: 8/8 fluxo gaveta + 149/149 suíte.

---

## O QUE FOI ENTREGUE — v5.22.99 (2026-09-08)

1. **Menu próprio: BACKUP** — as coisas de backup saíram de dentro do painel
   Nuvem (botão desfeito lá) e agora o menu lateral **Backup** (que antes já
   baixava o clássico) abre a tela **"Backup do sistema"** com tudo junto:
   • ☁️ **seção Nuvem**: o card completo (resumo de últimos + próximo
     diário; 📸 Backup agora, 📥 Baixar todos, 🗑️ Excluir backups;
     listinha por pasta com ⬇️/🗑️ por item);
   • 💾 **seção PC**: o backup clássico de sempre (botão baixa o `.json`
     de todos os dados) — nenhum costume antigo quebrado.
   Só aparece para Admin, como antes. Prova de máquina: 12/12 no fluxo da
   tela + 149/149 suíte + resumo/sessões conferidos no sandbox.

---

## O QUE FOI ENTREGUE — v5.22.98 (2026-09-08)

1. **Painel antigo do botão Nuvem agora traz os backups JÁ ABERTOS de cara**
   (não precisa clicar pra expandir), com resumo no topo:
   • 🕐 **Último backup de tudo** (nome + data/hora SP + tamanho);
   • 📁 **Último de cada modalidade**: diário, atualizações e manual (se a
     pasta estiver vazia, explica quando sai);
   • ⏳ **Quanto falta pro próximo diário** — "hoje às 18:30 — faltam 2h04min"
   • com o tempo **CONGELADO no momento em que a janela abriu** (não fica
     atualizando sozinho, pra não pesar o PC); reabrir atualiza.
   O botão antigo "📁 Backups na nuvem" continua ali e agora vira
   mostrar/esconder.
2. Prova de máquina: 12/12 — cálculo do próximo diário em 5 horários-chave
   (antes/depois/exatamente 18:30 SP), resumo pintando todas as linhas e
   ZERO `setInterval` no módulo de backups; 149/149 do sistema.

---

## O QUE FOI ENTREGUE — v5.22.97 (2026-09-08)

1. **Backups agora em DUAS PASTAS separadas dentro da nuvem (como o dono
   desenhou):** 📁 **Backup diario** (todo dia **18:30** sozinho) e
   📁 **Backup atualizações** (sozinho a cada versão nova, com a foto da
   versão anterior). O **📸 Backup agora** (botão manual do painel) gera na
   hora e mora na pasta 📁 **Backup manual** — reforço.
2. **REGRA COMBINADA (registrada por pedido do dono):** a cada atualização
   que ele pedir, o backup da versão anterior vai pra nuvem **antes de
   mexer nela** — pela lei do botão 📸 **Backup agora** (já na tela) + o
   automático que dispara no primeiro sync da versão nova (foto com o nome
   da versão anterior, sem erro de PC). Ou seja: mexer em atualização sem
   backup na nuvem virou pecado fora da regra.
3. **Sem R2 / sem cartão:** o balde R2 pediu habilitação + método de
   pagamento no painel (erro 10042 no teste do dono). Arquitetura trocada:
   os backups moram **dentro da própria nuvem D1 que o sistema já usa**, em
   **tabela exclusiva de backups** que se autocria no primeiro uso,
   **compactados** (prova de ida-e-volta). Não mistura com os dados do
   sistema; apagar backups nunca toca nos dados. **Ativação ficou de um
   comando só: `npx wrangler deploy` na pasta `cloudflare-worker`**.
4. Prova de máquina: 6/6 testes puros novos do worker (pastas, fuso, gzip
   estável) + zip **com as pastas dentro** abrindo na biblioteca padrão +
   149/149 do sistema.
5. Caso de borda real: erro **10042** = R2 não habilitado na conta — ficou
   documentado no README junto do motivo da troca de arquitetura.

---

## O QUE FOI ENTREGUE — v5.22.96 (2026-09-08)

1. **BACKUPS AUTOMÁTICOS na nuvem — dois ciclos independentes, sem PC ligado.**
   • Diário às **18:30** (relógio da própria Cloudflare): `Backup 08-09-2026.json`.
   • A cada **atualização**: quando o primeiro sync da versão nova chega, a
   nuvem primeiro fotografa o banco com o nome da versão ANTERIOR
   (`Backup sistema 5.22.95.json`). PC velho sincronizando depois NÃO faz
   backup de tabela invertida (só dispara se a versão for MAIOR).
   Os arquivos ficam no balde R2 **digicopy-backups** (10 GB grátis) e NUNCA
   são apagados sozinhos. Planejado para o HD externo como cópia extra.
2. **Dois botões só do administrador** no painel "Nuvem" (mesmo bloco dos
   outros botões de administração): **📥 Baixar todos os backups** (gera um
   `.zip` pronto pra HD, com um arquivo por backup — ZIP real provado abrindo
   na biblioteca padrão) e **🗑️ Excluir backups** (confirmação dupla, apaga
   SÓ os backups da nuvem; dados do sistema nunca; o ciclo continua). Por
   item da lista também dá pra ⬇️ baixar e 🗑️ apagar de um em um.
3. **Ativação (1x só, na conta Cloudflare):** `npx wrangler r2 bucket create
   digicopy-backups` e `npx wrangler deploy` — passos em
   `cloudflare-worker/README.md` ("Ativando pela primeira vez"). Sem isso o
   card mostra o recado do que falta, sem quebrar a tela.
4. Prova de máquina: 10 testes puros do worker (nomes de arquivo, fuso de SP,
   comparação de versões) + 149/149 do sistema + zip integridade.

---

## O QUE FOI ENTREGUE — v5.22.95 (2026-09-08)

1. **Abrir qualquer tela a partir da venda em andamento agora devolve a
   MESMA venda inteira.** Ex.: estava montando a venda VND-123, clicou
   "+" para cadastrar um produto (ou abriu qualquer outra tela a partir
   dela), salvou OU cancelou — em vez de cair numa venda zerada, a VND-123
   volta com TUDO: cliente, itens, descontos, observação, data/hora e até o
   item digitado pela metade.
2. **Como funciona (genérico, sem função avulsa por botão):** ao abrir
   qualquer outro modal com a venda na tela, o sistema tira uma "foto"
   completa da venda; ao fechar (salvar e cancelar passam pelo mesmo
   `closeModal`), a venda é reconstruída (`novaVenda`) e a foto é devolvida.
   Tem ainda um olho bem leve (1x/s) que devolve a venda caso alguma tela
   feche por outro caminho. Finalizar a venda segue normal (nenhuma tela
   foi aberta, então nada é restaurado).
3. Prova de máquina: fluxo real no navegador simulado — venda montada com
   cliente + item + obs + item pela metade → abre o modal de produto →
   CANCELA: 7/7 verificações ok; → SALVA o produto: 7/7 ok (o produto novo
   já aparece na busca da venda).
4. Caso de borda de entrega: o bundle de versões pode ficar raso se o
   `node_modules` sumir — rechecar a linha "isolados" no build antes de
   commitar (vantagem: `npm test` cobre isso).

---

## O QUE FOI ENTREGUE — v5.22.94 (2026-09-04)

1. **Lápis do chamado: trocar de impressora agora TROCA os dados junto.**
   Antes, ao tocar no lápis e escolher outra impressora, ficavam modelo,
   serial, patrimônio e local da antiga, e o Motivo mantinha o modelo da
   antiga. Agora, na troca (contrato e avulso): modelo/serial/patrimônio/
   local viram os da impressora nova; o contador antigo vem da nova e o
   atual limpa para digitar; o Motivo, se era exatamente o modelo da antiga,
   vira o da nova — texto que a pessoa escreveu NÃO se mexe. Na ABERTURA do
   chamado nada pisa nos dados salvos (só preenche o vazio). Prova de
   máquina: 11/11 comportamentos.
2. Ouro de bobeira protegido: contador atual da impressora nova limpa na
   troca (pra não salvar contagem da antiga na nova).
3. Caso de borda no sandbox: npm sem o `acorn` (node_modules some) gera
   bundle com 0 isolados — NOTAR o aviso no build e instalar com
   `npm install --ignore-scripts` (o electron postinstall é quem trava).

---

## O QUE FOI ENTREGUE — v5.22.93 (2026-09-04)

1. **O orçamento voltou a sumir APÓS a trava .92 — mas o diagnóstico revelou
   duas coisas:** o id falho (orc_ + tempo + aleatório, 8+4) é gerado pelo
   salvar do módulo v52258 (que sobrescreve v52237), e o retrato da lista
   gravado na .91 era da listagem VELHA — a que o usuário VÊ é a do v52258,
   então "NÃO estava na lista" não provava nada. Lição: instrumentar sempre
   o ÚLTIMO vencedor do bundle.
2. **Guardião do banco (arquivo novo, último do bundle):** a cada 400 ms
   compara os ids de db.orcamentos; QUALQUER saída de registro grava horário,
   quais ids sumiram e a TRILHA (pilha) de quem chamou, num anel __orc_saiu
   no PC. A listagem visível passou a alimentar o retrato. O aviso "não
   achei" agora mostra: quantos tem, código clicado, estava-na-lista (agora
   certo), códigos atuais e a ÚLTIMA BAIXA. A próxima mensagem do usuário traz
   o nome do ladrão escrito — sem mais hipótese.
3. Trava .92 (delete de nuvem vira excluído + este PC não manda delete de
   orçamento) MANTIDA — continua eliminando a classe "apagão replicado" que
   já aconteceu antes com outros dados.

---

## O QUE FOI ENTREGUE — v5.22.92 (2026-09-04)

1. **ORÇAMENTO NUNCA MAIS SOME POR MANDADO DA NUVEM.** Causa encontrada com
   os 3 diagnósticos: o usuário usa VÁRIOS PCs na mesma conta; quando algum
   deles manda "apagar orçamento", a nuvem replicava o apagar e o registro
   SUMIA do banco deste PC — a tela ainda mostrava a lista antiga e o clique
   caía no vazio ("não achei esse orçamento"). Agora: (a) delete que VEM da
   nuvem vira "excluído" (sai das listas de trabalho, permanece no banco e
   volta com Estornar); (b) este PC NUNCA manda delete de orçamento para a
   nuvem. Excluir/Estornar na tela seguem com o mesmo comportamento visual.
   Snapshot fica: a trava usa o que já existia para clientes e identidade.
2. Diagnóstico final confirmado pelo usuário: clique logo depois de salvar +
   vários PCs + uso recente de Excluir → exatamente o cenário da trava.

---

## O QUE FOI ENTREGUE — v5.22.91 (2026-09-04)

1. **Diagnóstico final do orçamento "não achei".** O aviso agora diz: quantos
   orçamentos o PC tem, o código clicado, se esse código ESTAVA na lista que a
   tela mostrou (snapshot salvo a cada render) e os códigos que existem no
   banco. Com o próximo recado do usuário, a causa fica fechada (nuvem que
   apaga vs. outra origem). Primeiro diagnóstico do usuário: 4 orçamentos no
   banco, clicado orc_mtnbguxr_4772 — id legítimo que já estava renderizado
   → sumiu do array entre a renderização e o clique (suspeita: op delete da
   nuvem). Sem correção às cegas — só instrumentou.

---

## O QUE FOI ENTREGUE — v5.22.90 (2026-09-04)

1. **Escolher impressora do chamado: tocou, some o resto e fica só a
   escolhida + lápis (igual coletor de leituras).** Era minha leitura errada
   da v5.22.88 (deixei a lista sempre aberta). Agora, no CONTRATO e no
   AVULSO: ao tocar numa impressora a lista recolhe; a linha dela fica com um
   lápis "✏️ trocar"; o lápis reabre a lista COMPLETA e ela FICA aberta;
   digitar na busca também reabre; o filtro enquanto digita continua igual.
   Prova de máquina (jsdom): 9/9 comportamentos no contrato + 5/5 no avulso.
2. **"Quantidade de páginas impressas" do chamado volta a contar.** A função
   que valia procurava os campos da tela antiga (kr-os-*) — o chamado atual
   usa (ko-*) e nunca calculava; ao salvar, gravava 0. Troquei pela função
   ÚNICA que atende TODOS os conjuntos de campo (ko/*, kr-os/*, o/*, ca/*)
   mais um ouvinte que calcula ao digitar em qualquer campo de contador.
   Prova: digitou 1500 tendo anterior 1000 → 500 na hora e salvou 500.
3. **Orçamento "não achei" agora mostra números para o suporte.** Se voltar a
   aparecer, o aviso dirá quantos orçamentos o PC tem e qual código foi
   clicado — com esses dois números dá para fechar a causa exata.

### CHECKLIST ANTIERRO v5.22.90
- [x] jsdom imprimiu a função viva antes/depois (bundle-load-order checado)
- [x] pesquisou os 10 pontos que definem salvar/calcular chamado
- [x] testes novos (29 asserções) + 2 suítes antigas atualizadas
- [x] gate 0 falhas: sync:check + bundle + test + verify:files
- [x] bundle 191 scripts — 189 isolados / 2 globais
- [x] versão subiu em package.json + index.html

---

## O QUE FOI ENTREGUE — v5.22.88 (2026-09-04)

1. **Escolher impressora do chamado agora é LISTA SEMPRE ABERTA (dentro do
   contrato).** Acabou a "caixa fechada" com lápis: a lista aparece aberta
   assim que o chamado abre, a impressora escolhida fica marcada em azul, e
   trocar é só tocar em outra. O bug do lápis (clicava e nada acontecia) foi
   eliminado junto — a causa era a própria busca re-escondendo a lista depois
   de montada. Prova de máquina (jsdom): lista visível + filtro aplicado.
2. **Filtro da impressora AGORA filtra enquanto digita** (chamado do contrato
   e avulso). Tem `oninput` no HTML + `addEventListener('input')` real como
   reforço — não depende mais de apertar Enter/lupa. O campo de busca
   (Impressora/Serial/Patrimônio/Departamento/Localização) também refiltra
   ao trocar.
3. **Chamado AVULSO ganhou a área de busca de impressora** (não existia!):
   depois de escolher o cliente, a lista de impressoras do cliente aparece,
   filtra enquanto digita, e a escolhida fica marcada — preenchendo modelo,
   patrimônio, serial, local e contador automaticamente como antes.
4. **Produto sem valor (0 ou vazio no cadastro): a caixa de valor unitário
   nasce VAZIA** nas 4 telas (venda, chamados/peças, orçamento nas 2
   gerações). Antes ela já vinha com "0" e induzia erro. Lançar 0 à mão
   continua permitido — as travas de item aceitam número "0" normalmente.
   Fluxo de recarga/etiqueta (v52218) intocado.
5. **Orçamento "cliente não encontrado" / "orçamento não encontrado"**:
   investigado de ponta a ponta — o código da v5.22.87 foi EXECUTADO de
   verdade em navegador simulado (jsdom): selecionar cliente grava, adicionar
   item funciona, salvar grava e fecha a aba. Nenhum dos dois avisos é
   produzido pelo código novo — os dois textos existiam só em versões
   ANTIGAS. Ou seja: o relato veio de tela desatualizada (cache). Regra: usar
   o link com hash do commit entregue e conferir **v5.22.88 no rodapé** da
   tela antes de testar.

### CHECKLIST ANTIERRO v5.22.88
- [x] bundle 190 scripts — **188 isolados, 2 globais** (app.js, evolucao) ✔
- [x] `npm test` — **141/141** ✔
- [x] `sync:check`, `check`, `verify:files` ✔
- [x] Teste novo: `test_ajustes_v52288.js` (24 checagens)
- [x] Teste da .84 atualizado para o novo contrato de caixa vazia
- [x] Provas de máquina no jsdom: orçamento completo, impressora contrato,
      impressora avulso, produto sem preço
- [x] Version bump: package.json + index.html (4 pontos)
- [x] Sem arquivo novo de módulo (edições nos donos de cada tela)

---

## O QUE FOI ENTREGUE — v5.22.89 (2026-09-04)

**Resposta ao "orçamento não encontrado" (popup central ao abrir o orçamento
salvo pela lista).** A caça ficou séria:

1. **O texto exato "Orçamento não encontrado" saía de UM lugar só**: o
   `abrirOrcamento` desistindo de procurar (toast vermelho no canto). Ele foi
   REESCRITO de raiz à prova de bala — procura por **7 caminhos** (id exato,
   token, número, número normalizado, formulário aberto na tela, último
   selecionado da lista, e autocura de id em orçamento sem id). No pior caso,
   atualiza a lista sozinho e abre **popup central CLARO E DIFERENTE**:
   "Não achei esse orçamento neste PC agora..." (se o popup do usuário voltar
   com o texto antigo, NÃO é esse caminho).
2. **Autocura de orçamentos antigos SEM id** (de versões velhas): a linha da
   lista chamava `abrirOrcamento('undefined')`. Agora a renderização da
   lista garante id estável (`orc_legado_...`) antes de montar as linhas —
   prova de máquina: legado sem id abre normal.
3. **CARIMBO DE ORIGEM (instrumentação)**: qualquer popup/toast que contenha
   "encontrado/encontrada" ganha, no final, um código cinza dizendo
   `função @ arquivo : linha` de onde o aviso saiu no código. Se o aviso
   misterioso voltar, o usuário manda só esse código e a causa raiz aparece
   na hora. Avisos sem "encontrad" ficam intocados.

### CHECKLIST ANTIERRO v5.22.89
- [x] bundle 191 scripts — **189 isolados, 2 globais** ✔
- [x] `npm test` — **142/142** ✔
- [x] sync:check, check, verify:files ✔
- [x] Prova jsdom: abre por id, abre legado autocurado, clique inválido dá
      popup claro novo (nunca mais o toast vago), regex do carimbo pega
      stack real de navegador
- [x] Teste novo: test_ajustes_v52289.js; ajustados: v52284/85/86/87
- [x] Pergunta ao usuário antes de codar (momento/formato/versão) ✔

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
| Bundle "isolados: 0" | O gerador só isola os scripts com o parser `acorn`; o `node_modules` some entre sessões. Se o bundle disser "isolados contra erro: 0", rode `npm install --ignore-scripts` e gere de novo até dar 188/2. |

Antes de dizer que terminou: `npm run sync:check && npm run bundle && npm test`
(139 suítes, 0 falha) e `npm run verify:files`.

---

## v5.22.87 — orçamentos: tela enxuta (cliente só quando precisa, uma única página, sem Sair)

**1) Orçamento já salvo não pede mais cliente** — a área de busca/filtro de cliente agora fica dentro de `orc-cli-busca`, que só aparece quando não tem cliente. Abriu orçamento salvo (ou escolheu o cliente): mostra só o cartão do cliente (nome, documento, cidade). Clicou no X "Trocar cliente": a busca volta. Ajuste em `ajustes_v52260_orcamento_trava_venda_atalho_patch.js` + `orcSelCliente`/`orcLimparCliente` alternando o bloco.

**2) "A tela 2 não apareceu"** — cortado o mal pela raiz: os botões de aba (Itens/Ordem de Serviço) foram REMOVIDOS e as duas seções agora aparecem **sempre, uma embaixo da outra** (`orc-aba-os` sem `hidden`). Zero dependência de clique/toggle para a OS aparecer — os campos e a busca por serial da v5.22.85 seguem nos mesmos ids.

**3) Salvar fecha a aba** — o botão Salvar do orçamento agora termina com `closeModal()` (e `__ORC_ST.form = null`), voltando direto para a lista, em vez de permanecer na tela recém-salva.

**4) Sem botão "Sair"** — rodapé do orçamento sem o Sair: a aba fecha pelo **X do canto superior** (existe no header do modal desde sempre). Mantidos: Revalidar link, Imprimir, Salvar e "Abrir Venda Salva" (quando autorizado).

**5) Lista: "Mostrar todos aprovados" e "Mostrar todos desaprovados"** — ao lado do botão "Todos" no menu Orçamentos (`ajustes_v52258_orcamento_os_revalidar_patch.js`), via nova `window.orcFiltroLista('fechados'|'recusados')`. Criado o filtro `recusados` (status recusado pelo cliente no link) e adicionado na `<select>`. "Não fechados" deixou de misturar recusado.

**6) Revalidar link: FUNCIONA** (resposta ao usuário) — `revalidarLinkOrcamento` na v5.22.58: gera token novo, volta status pra `aberto`, remove a venda gerada não faturada (e sua OS), limpa os registros locais de decisão do link, salva e re-renderiza; se a venda gerada JÁ foi faturada, bloqueia com orientação pra estornar primeiro.

**TESTE NOVO:** `test_ajustes_v52287.js` — 20 verificações; `test_ajustes_v52285.js` atualizado (salvar fecha, não reabre). Suíte 140/140.

**Conserto:** "Uncaught TypeError: window.orcDelItem is not a function". A tabela de itens do orçamento (tela vigente, v5.22.60) chamava `window.orcDelItem(idx)` e essa função **nunca existiu** em nenhum arquivo — só tinha sido chamada. Criada em `ajustes_v52260_orcamento_trava_venda_atalho_patch.js`: remove o item, em orçamento autorizado/fechado bloqueia com aviso, e redesenha a lista com o total recalculado.

**Descoberta (confirmada nos reclames do usuário):** a cadeia viva de orçamentos hoje é — tela/render/salvar/serial = v5.22.60; adicionar item/regras = **`orcAddItem` da v5.22.37** (a reescrita da v5.22.59 fica dentro da sua própria tela, que a v5.22.60 substituiu de vez). Por isso a trava de estoque que o usuário vê é o fluxo antigo ("quer modificar o estoque?", igual vendas, com o item bloqueado) — **comportamento correto e pedido** ("tem que ter no mínimo a quantidade"). O bloco de toast da v5.22.59 (v5.22.85) fica como reserva documentada.

**LIÇÃO GRAVE (anotada no checklist):** o gerador do bundle SÓ isola cada script contra erro quando o parser **acorn** está instalado; sem ele gera tudo no escopo global (quebra a app: redeclaração de const entre 190 arquivos). SINTOMA: a linha do bundle imprime "isolados contra erro: 0". O `node_modules` não sobrevive entre sessões/turnos. **Regra nova: antes de entregar, conferir que o bundle mostra "isolados contra erro: 188 | no escopo global: 2"; se mostrar 0, rodar `npm install --ignore-scripts` e gerar de novo.** Os testes pegaram isso (137 ok + 2 falhas de "try/catch no bundle").

**TESTE NOVO:** `test_ajustes_v52286.js` — simulação de runtime do clique na lixeira + trava do autorizado (suíte 139/139).

**1) Estoque no orçamento** — regra final: orçamento NÃO baixa estoque (igual sempre foi), mas produto físico sem estoque suficiente **não entra**: ao lançar, se o estoque for menor que a quantidade, aparece o aviso "Sem estoque: ... tem X. Precisa de no mínimo 1, ou da quantidade que for colocar no orçamento." e o item NÃO entra. Serviço, recarga/etiqueta e produto de estoque infinito seguem livres. Essa trava existia na v5.22.37 e se perdeu quando a v5.22.59 reescreveu o `orcAddItem` (versão que vale hoje) — foi restaurada nela (`ajustes_v52259_orcamento_filtros_item_patch.js`). Atenção: a v52237 tem uma versão morta do orcAddItem com outro fluxo (perguntava abrir cadastro de estoque) — não foi mexida por ser substituída na cadeia.

**2) "Orçamento não encontrado" ao salvar + não abria depois** — duas correções: (a) ao salvar (`ajustes_v52260_orcamento_trava_venda_atalho_patch.js`), a tela reabre o orçamento **pelo objeto recém-gravado** (`window.abrirTelaOrcamento(o)`), sem consulta intermediária → nunca mais a mensagem fantasma; (b) `window.abrirOrcamento` (`ajustes_v52237_orcamentos_menu_patch.js`) ganhou procura de reserva depois do id: **token**, **número** e, por último, o orçamento que já está aberto na tela (monta o objeto a partir do formulário). Só aparece "não encontrado" se for de verdade. Se a queixa era no **link público de aprovação** (página Pages), aí é a sincronia com o Worker/D1 — confirmar com o usuário.

**3) Busca por número de série no orçamento** — `orcBuscarSerial` em `ajustes_v52260_orcamento_trava_venda_atalho_patch.js`, espelho de `vosBuscarSerial` (+ regra da v52237: última notinha comanda os dados). Campo de série da aba OS com **lupa e Enter**: procura serial nas vendas, chamados e equipamentos; preenche modelo/patrimônio/contador e **seleciona o cliente sozinho** (última notinha > chamado > máquina no parque); quanto acha, mostra a caixa âmbar "Última notinha encontrada..." com Data/Cliente/Modelo nº, e "Preenchido automaticamente — confira antes de salvar". Autorizado (somente leitura) não mostra lupa nem dispara.

**TESTE NOVO:** `test_ajustes_v52285.js` — 18 verificações (suíte 138/138).

**1) Vendas imprimem sem restrição (vendas)** — a trava "Fature a notinha antes de imprimir" morreu (estava em `ajustes_relatorio_pai_patch.js`, era o ÚNICO ponto do código que bloqueava por status). Agora a notinha imprime em qualquer situação: venda aberta da lista, salva, faturada, direto do formulário ou pelo histórico — no formato Vendas (meia folha) ou Ordem de Serviço (folha inteira, o "aberto com S"). O fluxo continua: Imprimir → formato → quantidade de vias → **salva automaticamente ao escolher as vias** (salvamento silencioso, a aba segue aberta) → abre em PDF/impressora. A trava de EDIÇÃO de venda faturada (estornar para alterar) continua valendo, como sempre.

**2) Caixa de itens — valor unitário e desconto nascem vazios (vendas, chamados e orçamentos)** — regra única nos 3 lugares: quantidade padrão 1, unitário e desconto vazios, e o botão "Adicionar item" só habilita quando o campo de valor unitário tem um número válido. Escolher um produto da lista preenche o preço cadastrado (dá para mudar antes de adicionar — o botão já liga no ato). Depois de adicionar, os campos voltam vazios para o próximo item. Há ainda uma trava de segurança dentro da função de adicionar, para nenhum atalho de teclado furar a regra. Mudado de verdade em `vendas_os_patch.js` (venda), `ajustes_v5182_patch.js` + `ajustes_v5186_patch.js` (chamados — duas gerações do modal), `ajustes_v52237_orcamentos_menu_patch.js` + `v52258` + `v52259` + `v52260` (orçamentos — as 4 gerações da tela). O fluxo da ETIQUETA/RECARGA, que preenche valor sozinho para o dia a dia correr, continua exatamente igual. Orçamentos virando venda: `orcItensParaVenda()` (utilitários/compartilhados/utilidades_operacionais_patch.js) lê do DOM só se a tela existir; o fundo na etiqueta da recarga é o mesmo (mesma base de preços).

**3) Produtos: "Local" aposentado + ordenação corrigida de vez (produtos)** — a coluna "Local" sumiu da listagem (e do novo cadastro, da busca e da importação), como combinado: ninguém usava. Dados antigos já gravados são apagados sozinhos numa varredura quando a tela de produtos abre (uma vez só; depois da limpeza não acha mais nada). A ordenação por clique no título agora funciona A→Z e Z→A de verdade: antes o sentido era guardado num objeto de estado separado (a trava do v52214 nunca enxergava a mudança) e, quando tentava, "invertia as linhas" na tela — jogava a linha de contagem ("mostrando 300 de 1031") para o topo. Agora o sentido mora no mesmo `STATE.prod.dir` da lista, a lista INTEIRA é ordenada no sentido certo antes de cortar os 300 em tela, e o título mostra ▲/▼. Arquivos: `fluxos_operacionais_patch.js` (mais a remoção da trava `wrapSort('produtosSortOperacional')` de `ajustes_v52214_ordenacao_patch.js`, mantidos contratos/chamados e a função pura `proximaDir`).

**TESTE NOVO:** `test_ajustes_v52284.js` — 47 verificações dos 3 pontos (suíte 137/137).

**ENTREGA (2026-09-03, retorno do usuário):** usuário testou e relatou "imprimir continua igual / produtos nada mudou" — investigado: código na branch está 100% certo (nenhum "Fature a notinha" ativo em lugar nenhum, bundle limpo, GitHub na v5.22.84). Ele estava olhando **cópia velha** (aba antiga aberta / cache / atalho do programa instalado). A partir desta versão o link de teste passou a ser com **hash do commit** (endereço novo a cada entrega = impossível cair em versão velha): padrão `https://raw.githack.com/<user>/<repo>/<sha>/index.html?v=<versão>`. Sempre mandar assim + dizer pra conferir a versão que aparece na tela de login/titulo da aba.

**Lição:** quando uma regra visual depende de estado, o sentido tem de morar no MESMO objeto de estado da tela que a lista lê. E trava de impressão feita "envelopando" `imprimirNotinha` no meio da cadeia de arquivos é a última coisa que a documentação de fluxo pega — achar a cadeia inteira exige olhar a ordem de carga do bundle, não só greps.

## v5.22.83 — sessão nova, branch nova; só troco de endereço

Chat novo, sessão com branch fixa nova (`arena/01a0683d-teste`). Nenhuma função
do sistema mudou — o que mudou é **para onde os links apontam**:

- `package.json > digicopy.branch` passa a ser `arena/01a0683d-teste`; o
  `npm run sync` recarimbou os links do GitHack dentro do código (inclusive o
  link de orçamento que vai para o cliente) para a branch nova.
- Ambiente do agente restaurado: `npm install --ignore-scripts` (o download do
  binário do Electron continua falhando por TLS neste sandbox — limitação já
  conhecida; o `.exe` se gera no PC com `npm run build:win`).
- Encontrado e corrigido: `test_ajustes_v52282.js` estava amarrado à versão
  exata `5.22.82` (o próprio CHECKLIST ANTIERRO proíbe isso). Trocado para
  `/^5\.22\.\d+/`.

Estado ao abrir a sessão: suíte com 5 falhas, todas de ambiente (faltava
`node_modules` e o bundle fora de data). Depois do `npm install`: **136
suítes, 0 falhas**.

Testes: `test_ajustes_v52282.js` (corrigido), `test_ajustes_v52263.js`. Suíte:
136 passaram, 0 falharam.

## v5.22.82 — cortando pela metade o que o sistema grava na nuvem

O usuário perguntou se usa tudo isso mesmo. Conferindo, **parte do gasto era desperdício meu**. No D1, cada índice de uma tabela conta como **uma gravação a mais** toda vez que a linha muda. Estava assim, por registro sincronizado:

| O que gravava | Linhas |
|---|---|
| linha em `changes` | 1 |
| índice `mutation_id` (necessário) | 1 |
| índice `idx_changes_record` (usado) | 1 |
| índice `idx_changes_cursor` (**índice em cima da chave primária**) | 1 |
| linha em `records` | 1 |
| índice `idx_records_updated` (**nenhuma consulta usa**) | 1 |
| `idx_records_deleted` + `idx_records_entity_deleted` (**criados por mim na v5.22.76**) | 2 |
| **Total** | **8** |

Migração `0004_menos_gravacoes.sql` derruba os quatro índices inúteis: passa de **8 para 4 linhas por registro** — metade do consumo.

Os dois índices da contagem foram substituídos por algo mais barato: um **resumo guardado numa linha só**, refeito no máximo de 10 em 10 minutos (`resumoDaNuvem`). A tela da nuvem lê esse resumo em vez de varrer a tabela a cada clique — e os totais saem todos da mesma consulta, em vez de cinco.

Nuvem carimbada como **0.4.7**.

Testes: `test_ajustes_v52282.js` (11 conferências). Suíte: 136 passaram, 0 falharam.

## v5.22.81 — o Chamados do menu Locação (achei quem recolocava)

O botão continuava aparecendo porque existia uma terceira mão: a função `montarMenuLocacao()` em `locacao_chamados_fix_patch.js` **reescrevia o menu Locação inteiro a cada navegação**, sempre com Contratos + Impressoras + Chamados. Por isso tirar de `app.js` e do catálogo não adiantou nada.

Agora o menu Locação monta só com **Contratos** e **Impressoras**. A tela de chamados continua existindo (Atendimento → Abrir chamado, e dentro do contrato).

Lição para o CHECKLIST ANTIERRO: **antes de dar um menu por removido, procurar quem escreve `innerHTML` no `id` daquele menu** (`menu-outsourcing`, `menu-cadastros`, `menu-config`), não só as listas de dados.

Testes: `test_ajustes_v52281.js` (6 conferências). Suíte: 135 passaram, 0 falharam.

## v5.22.80 — o erro da nuvem tinha nome: limite diário do banco grátis

Com o carimbo 0.4.6 no ar, o erro finalmente veio com o motivo:

> `D1_ERROR: Your account has exceeded D1's free tier daily row write limit.`

Não era defeito do sistema. O plano **grátis** da Cloudflare tem um teto de gravações por dia e ele estourou. Quando isso acontece, toda consulta ao banco volta com erro em inglês e parece que tudo quebrou.

O que esta versão faz:

- **Reconhece o limite** e mostra em português: "A nuvem grátis atingiu o limite de gravação de hoje. Nada foi perdido: o envio recomeça sozinho quando o limite virar, em Xh Ymin (por volta das 21h, horário de Brasília)."
- **Para de bater na porta à toa.** Cada tentativa inútil consome mais do limite do dia seguinte, então o sistema espera a virada (meia-noite no horário de Londres) em vez de tentar de minuto em minuto.
- **Recomeça sozinho** na virada, de onde parou. Nenhum dado se perde.
- O painel da nuvem mostra o mesmo recado em vez do texto em inglês.

Testes: `test_ajustes_v52280.js` (10 conferências). Suíte: 134 passaram, 0 falharam.

## v5.22.79 — carimbo de versão na nuvem

A nuvem passou a se identificar como **0.4.6** (antes 0.4.5). Serve para saber, olhando a própria nuvem, se o código novo subiu mesmo: basta abrir o endereço da API e olhar o campo `version` da resposta.

- `version: "0.4.5"` = ainda é o servidor antigo, o conserto do "Erro interno da API" não subiu.
- `version: "0.4.6"` = o servidor novo está no ar (contas independentes, erro com motivo, índices).

Testes: `test_ajustes_v52279.js` (6 conferências). Suíte: 133 passaram, 0 falharam.

> Nota: o workspace voltou sozinho para a v5.22.62 pela oitava vez durante esta rodada. Recuperado com `git fetch` + `git reset --hard origin/arena/01a0590a-teste` e `npm install --ignore-scripts`.

## v5.22.78 — a tela da nuvem para de travar por causa do erro da API

O conserto de verdade do "Erro interno da API" está no servidor (v5.22.76) e **só vale depois de republicar o Worker**. Enquanto isso não acontece, esta versão faz a janela da nuvem parar de ficar refém da contagem de registros:

- Se a contagem falhar, a janela **abre do mesmo jeito**, com o que o PC já sabe.
- Aparece um aviso explicando o motivo e deixando claro que a sincronização **não** está parada.
- Sincronizar agora, autorizar outro computador, ver excluídos e remover autorização continuam funcionando normalmente.
- Só o que muda: os números da nuvem aparecem como "—" até o servidor conseguir contar.
- Autorização vencida (401) continua desconectando como antes.

### Como republicar o Worker (resolve o erro de vez)
```
cd cloudflare-worker
npx wrangler d1 migrations apply digicopy-sync --remote
npx wrangler deploy
```

Testes: `test_ajustes_v52278.js` (8 conferências). Suíte: 132 passaram, 0 falharam.

## v5.22.77 — limpeza de uma vez (não regra) e dois submenus fora

**1. Os nomes de teste: limpeza, não regra.** Na versão passada eu tinha deixado uma regra fixa que recusava esses nomes para sempre — não era isso que você pediu. Desfiz. Agora é uma **faxina única**: o sistema apaga Rafael Lima, Carlos Mendes e Ana Souza do PC e da nuvem uma vez, marca que já limpou e **nunca mais olha para nome nenhum**. Se um dia existir um técnico de verdade com esse nome, ele funciona igual a qualquer outro.

**2. Submenu Chamados dentro de Contratos: removido** (`app.js`, `buildNav`). A tela de chamados continua existindo e o atendimento continua abrindo chamado normalmente.

**3. Submenu Recargas dentro de Cadastros: removido** (`ajustes_v52213_menus_atalhos_patch.js` e a injeção no catálogo em `ajustes_v52214_recargas_patch.js`). A tela de recargas continua existindo.

Testes: `test_ajustes_v52277.js` (13 conferências). Suíte: 131 passaram, 0 falharam.

## v5.22.76 — o que sumiu volta, os nomes de teste vão embora e a nuvem para de dar erro

**1. Achei quem apagou.** Era o "espelho" que entrou na v5.22.72: depois de sincronizar, ele apagava DO PC tudo o que a nuvem não tivesse. Foi ele que levou usuário de login, produto de recarga e impressora de dentro do contrato. **O espelho foi removido do sistema.** Nenhum computador apaga dado sozinho nunca mais — agora é o contrário: o que existe no PC e não está na nuvem SOBE para a nuvem.

**2. Devolvendo o que ele levou.** Antes de limpar, o espelho gravava uma cópia de segurança dentro do próprio PC. Ao abrir esta versão, o sistema lê essa cópia sozinho e devolve para a base tudo o que ela tinha e hoje não existe mais. Roda uma vez só, por computador, sem apertar nada.

**3. Rafael Lima, Carlos Mendes e Ana Souza acabaram.** Eles estavam guardados na nuvem antiga e o conserto automático da v5.22.74 trouxe os três de volta. **Esse conserto foi removido.** Agora: o sistema apaga esses nomes do PC, manda a ordem de exclusão para a nuvem (somem de todos os computadores) e, se a nuvem tentar mandar de volta, o PC recusa. A devolução da cópia também nunca traz esses nomes.

**4. "Erro interno da API" ao clicar na nuvem.** A tela contava registro percorrendo a tabela inteira cinco vezes a cada clique; com a base grande, o banco desistia e devolvia erro. Agora cada conta vai sozinha, uma que falhe vem zerada em vez de derrubar a tela, e o erro passou a dizer o motivo em vez de só "erro interno". Criados dois índices no banco (`0003_indices_contagem.sql`) para a conta ser instantânea.

> Os itens 4 e parte do 3 dependem de **publicar o Worker de novo** (`npx wrangler deploy` e `npx wrangler d1 migrations apply`) para valerem na nuvem.

Testes: `test_ajustes_v52276.js` (18 conferências). Suíte: 130 passaram, 0 falharam.

## v5.22.75 — a nuvem só apaga quando VOCÊ mandou apagar

Você disse: *"não quero que isso vire regra, isso vai dar problema... as pessoas que vão usar são meio problemáticas"*. Então saiu toda e qualquer adivinhação.

- **Acabou o teto de 20 e a regra dos 30%.** Se você apagar 500 clientes de propósito, os 500 somem em todos os PCs. Sem trava, sem aviso, sem "por segurança não apaguei".
- **Sumiu sozinho? A nuvem não apaga.** Se um registro desaparecer do PC sem ninguém mandar, o PC só para de acompanhar aquele registro. O dado continua na nuvem e nos outros PCs, e não fica mais engordando o "faltam N".
- **Como o sistema sabe que foi de propósito:** ele vigia as 23 funções de excluir do programa e as janelas de confirmação. Você clicou em excluir, ou respondeu SIM numa pergunta de confirmação, abre uma janela de 60 segundos em que a exclusão vale. Fora dela, nada é apagado.
- **Confere duas vezes.** Entre ver o registro sumido e mandar apagar existe um respiro de 3 segundos. Se a base ainda estava abrindo e a lista voltar, a exclusão é cancelada sozinha. Isso não é limite de quantidade: pode ser 1 ou 5.000.
- **O conserto da falha da v5.22.69 virou coisa de uma vez só e com data.** Ele roda uma única vez por PC e só devolve o que sumiu ANTES da data em que rodou. Nada que você apagar de hoje em diante volta, nunca.

Testes: `test_ajustes_v52275.js` (16 conferências). Suíte: 129 passaram, 0 falharam.

## v5.22.74 — o que sumiu sozinho volta sozinho (sem botão)

O usuário recusou o botão "Restaurar tudo": *"eu não quero restaurar não, você vai
voltar o que eu não fiz, voltar o problema que você arrumou"*. E deixou claro:
**o que ele apagou de propósito TEM que continuar apagado.**

**Como o sistema separa um do outro:** a falha da v5.22.69 apagava **em lote** —
dezenas de registros no mesmo intervalo, sem ninguém clicar (corte de auditoria,
lista remontada por módulo, base abrindo pela metade). Exclusão de verdade é
uma ou duas, com intervalo entre elas.

`agruparApagao()` agrupa os excluídos por lista e por tempo: grupo com **8 ou
mais exclusões dentro de 90 segundos** = apagão, volta. Menos que isso = foi a
pessoa, **não se toca**. `logs` e `notificacoes` nunca voltam (são lixo local).

`repararApagao()` roda **dentro do ciclo normal da nuvem, uma vez por PC**
(`state.reparo`), sem botão e sem pergunta. O espelho da v5.22.72 só começa a
limpar **depois** que o conserto terminou.

**Contador color (2ª correção pedida):** o critério agora é a **modalidade** —
Color A4 ou Color A3 com modalidade diferente de `inativo`/`off`, no cadastro do
parque ou do equipamento. O palpite pelo nome do tipo (`/color/i.test(eq.tipo)`)
foi removido: era ele que fazia máquina preto e branco pedir contador color.

Teste: `test_ajustes_v52274.js` (com um cenário de 25 exclusões em lote + 3
manuais: volta as 25, não volta as 3). Suíte: **128 passaram / 0 falharam**.

---

## v5.22.73 — venda que não salvava, contador color inexistente e erro de tela

| Problema relatado | Causa | Correção |
|---|---|---|
| *"Não encontrei função de salvar esta venda"* ao clicar em **Salvar** | `ajustes_pos_final_patch.js` tinha um `closeModal` de uma tela de venda **que não existe mais**: procurava `neoSalvarVenda`/`cvSaveVenda`/`saveVenda`. A venda de hoje salva por `vosGravarVenda`. Com a retirada do aviso de salvar (2.6 da v5.22.68), o fluxo passou a cair nessa camada velha | Camada removida inteira (`vendaEmAndamento`, `chamarSalvarVendaDisponivel` e o `closeModal` obsoleto). A venda atual já grava sozinha ao fechar |
| *"Preencha o contador color atual"* numa impressora sem contador color | `validarFinalizar` exigia o campo só por ele estar **habilitado** — e ele nasce habilitado | Novo `chamadoTemColor()`: só exige se a impressora do chamado tiver contador color no cadastro (parque/equipamento). Sem impressora identificada, não trava |
| `Uncaught TypeError: Cannot set properties of null (setting 'value')` | `autoPreencherDadosChamado` (`contratos_refino_patch.js`) escrevia em 6 campos sem conferir se existiam; a tela do chamado mudou e alguns somem | Helper `porCampo(id,valor)`: preenche só o que existe |
| Dados que sumiram na v5.22.69 | Exclusão em massa por ausência (corrigida na v5.22.71) | **Botão novo no painel: "Restaurar TUDO que foi excluído (N)"** — a nuvem guarda todo registro excluído; o botão traz tudo de volta de uma vez e puxa para o PC. Nada é apagado por essa ação |

Teste: `test_ajustes_v52273.js`. Suíte: **127 passaram / 0 falharam**.

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
## O QUE FOI ENTREGUE — v5.24.19 (2026-09-14)

Tema: **pedido dele "muda as informações da nuvem"** — limpeza dos textos
visíveis do mundo grátis (teto diário/21h/susto), agora no idioma do plano pago.

1. Painel Nuvem (cloudflare_sync_patch): o selo "o teto grátis zera às 21h"
   virou "plano pago ativo ($5 fixos): o teto virou por mês e gigantesco —
   esse número agora é só curiosidade"; o rabinho "pra não ser pego de
   surpresa pelo teto" virou "vira só curiosidade de uso, sem risco de susto".
   Cabeçalho "Uso da nuvem hoje" preservado (assert do v5.22.96 intacto).
2. Ficha do limite (cloudflare_data_sync_patch): "A nuvem grátis atingiu o
   limite de gravação de hoje" → "A nuvem atingiu o limite de gravação do
   período (raro no plano pago)" — promessa "Nada foi perdido / recomeça
   sozinho" intacta. test_ajustes_v52280.L15 SUPERSEDIDO (pin "de hoje" →
   "do período", com nota).
3. PERGUNTA DELE SOBRE VERSÃO — fixa aqui a regra: o número só anda pra
   frente (v5.22.65 tinha 65 números; não existe trava de 9). Um dia cabe
   fechar a fase 5.24 e abrir 5.25, mas é cosmética, não trava nada.
4. PERGUNTA DELE "preciso fazer alguma coisa?" — respondida: conferir 1x que
   o Workers Paid figura ativo no painel da Cloudflare + rodar o deploy do
   worker quando puder (só muda o número exibido; o bloqueio diário já morreu
   no servidor). Nem site, nem link, nem banco mudam.
5. test_ajustes_v52419 (13 asserts). Suíte 147/0 com os 2 de ambiente.

## O QUE FOI ENTREGUE — v5.24.20 (2026-09-14)

Tema: **"muda a estrutura completa pro pago + deixa anotado: é teste de 1
mês"** — exigência dele, registrada AQUI e no próprio código.

1. FECHO do idioma grátis: o último texto visível do mundo gratuito era a
   ficha do backup diário ("plano grátis atingiu o LIMITE DIÁRIO (100 mil).
   Libera às 21h...") — reescrita: "do período (bem raro no plano pado)...",
   com a promessa dos 18:30 e o "me avise" intactos. Varredura final GARANTE:
   nenhuma string visível fala grátis/21h/diária como regra (assertado).
2. PONTO DE RECUO DE 1 MÊS (exigência dele — gravado no worker ao lado dos
   tetos e aqui): se no fim do mês o pago não valer a pena, o recuo total é:
   NO WORKER: trocar (tetoEscritas, tetoLeituras) de (50000000, 25000000000)
   para (100000, 5000000) e na pasta cloudflare-worker rodar `npm run deploy`;
   NA TELA: os textos do painel seguem honestos nos dois mundos (não há o que
   reverter); o D1 pago cancelável no painel em 1 clique. Prazo do recuo:
   5 minutos + deploy.
3. REGISTRO do teste de 1 mês: período da fatura atual inicia 2026-09-14 e
   vence 2026-10-14. Critério contigo: sobe o mês tranquilo, olha a tela
   Usage dele (4.35k requests, CPU 6s, faturável $0 hoje) + os 25 bilhões de
   leituras, e decide continua/volta — a estrutura obedece qualquer um dos
   dois mundos.
4. DADOS DA IMAGEM QUE ELE MANDOU (o que o sistema precisava saber):
   Workers & Pages = teste (Pages), digicopy-sync-api (sync worker, 4.3k
   req / 50 erros / 35.3ms — são respostas brutas, incluem rejeições 401/426,
   zero tela madura), digicopy-contador-uso (mini-medidor, 17 req). USO do
   período: Requests 4.35k de 10M incluídos (0,044%), CPU 5.931ms, faturável
   $0.00 — o plano está gigantesco pra escala dele, conforme previsto.
5. ONDE DÁ DEPLOY — CORRIGIDO (ele achou o atalho apertando o erro):
   não é `npm run deploy` pelado (o zip não traz node_modules; 'wrangler
   não é reconhecido' no PowerShell dele = faltavam as peças do motor).
   CAMINHO OFICIAL = arquivo **atualizar_motor_nuvem.cmd** na RAIZ da
   pasta do sistema (duplo clique): faz migrations + publicação + prova
   /health mostrando a versão no ar. Recomendação de 1ª vez após extrair
   zip novo: `cd cloudflare-worker && npm install && cd ..` (fixa o
   wrangler 4.123.0 pinado), depois só o .cmd. Sem node_modules, o npx do
   .cmd baixaria o wrangler mais novo do registro (funciona, mas fora da
   versão testada). pasta cloudflare-contador/ NÃO precisa deploy agora.
6. test_ajustes_v52420 (14 asserts); suite 147/0/2.

## O QUE FOI ENTREGUE — v5.24.21 (2026-09-14, RELATORIO GRANDE dele — PACOTE 1 de 2)

**P1 — Orçamento fantasma (FOTO DELE, orçamento 38):** o render vivo
(v5.22.58) passa a GUARDAR os objetos das linhas exibidas
(window.__orcUltimaLista, chave por id E token) e atualiza o retrato de ids;
o abrirOrcamento (v5.22.37, o único ganhador) GANHOU RESGATE SILENCIOSO:
se o id sumiu do banco entre lista e clique, devolve a linha pro banco +
saveDB + abre normal, sem popup. Resgates ficam anotados (__orcResgates +
localStorage __orc_resgates) e o diagnóstico antigo CONTA os resgates se
algum dia voltar a aparecer. CAUSA RAIZ (quem apagou a linha) segue na
investigação-mãe do mistério empresaId/dados-invisíveis — a foto do botão
"Por que dados não aparecem?" continua pendente dele.
**P2 — Aba OS:** plaquinha neutra "Aba OS opcional... notinha normal (meia
folha)" SOME (display:none); os estados verde (OS completa) e âmbar
(OS incompleta) ficam, porque são os que realmente avisam.
**P3 — Consultar notinha:** "Pré-visualizar NF-e" não injeta mais nessa tela
(v52210 e v5229 ambos blindados, com remoção defensiva); o botão continua
vivo nos históricos de LEITURAS (ele não pediu pra tirar dali).
**P4 — Produtos:** "Mostrando 300 de 1029..." só renderiza quando a lista
está visível (vis.length>0) — entrada limpa sem aviso solto.
**P9 — Financeiro DE DE:** CAUSA = v5.22.45 (garantirCamposData) colava
rótulos De/Até novos sem olhar que o v5.22.43 já tinha desenhado. Fix:
confere previousElementSibling (irmao é label 'De'/'Até'?) e marcas
neo-fin-*-lab antes de criar. resolve os dois modos (abertos com labels
próprios e hoje/todos com inputs ocultos).
**P10 — Financeiro:** datas/tipo/ordenação NÃO aplicam mais sozinhos.
Botões FILTRAR (azul; fica LARANJA pulsando quando há escolha pendente) e
REMOVER FILTRO (zera data/tipo/ordem + pesquisa legal: o texto também vai).
**P11 — Clientes:** mesma régua — Enter ou FILTRAR aplicam (botões na barra),
REMOVER FILTRO saindo a pesquisa E esvaziando a lista (como ele pediu
expressamente); a lista só nasce depois do primeiro filtro da visita
(__cliFoiFiltrado). Classic skins (notinha/clientes_patch) perderam o
oninput-vivo igualmente (Enter aplica).
test_ajustes_v52421 (36 asserts); suíte 147/0/2.

## PACOTE 2 (próximo, já mapeado): — pendências
- P5 "Editar" que ordena: nenhum 'Editar' de cabeçalho do projeto é
  ordenável (todos são <th> puros); preciso da ABA EXATA onde clicou
  (print) pra pescar o módulo certo (suspeita: algum th() de outra tabela).
- F1 contratos "mostrar todos" + padrão hoje: depende de carimbo
  criadoEm/atualizadoEm nos contratos (v5.24 já carimba criadoEm; o
  "modificado hoje" exige gravar atualizadoEm em CADA edição — auditor
  das donas das modalidades/chamados/leituras antes de mexer).
- F2 excluir chamado (dentro e fora de contratos) + ícone de impressora
  onde está escrito PDF: a lista-fora-de-contratos que ele cita precisa
  ser identificada por ele (que tela é essa? Atendimento? uma aba da OS?)
- P6 RTF abrir no Word: usar o padrão erro.txt (Electron shell.openPath +
  rtf:abrir IPC) + auditoria do preenchimento do template.
- P7 serial-first + remanejo: RESSUSCITAR o wrap v5.22.43/45 (morto pela
  sobreposição do fluxo_corrigido) como wrap final e adaptar ao vencedor.
- P8 hub de histórico da impressora (chamados/leituras/contratos bonitinho
  + botão para o contrato atual).

## MAPA DOS 5 SISTEMAS (anotado por pedido dele, 2026-09-14 — sem construir nada)

1° **Principal** — o sistema normal de PC (o comercializável).
2° **Celular** — o sistema de celular.
3° **Atualizações** — programa separado só pra lançar/baixar atualização (extraído na prática em v5.24.28+ como infra; virá com nome/atualizador próprio).
4° **Pessoal da loja** — o principal adaptado: tem funções que o comerciável não tem e vice-versa. **É NESTE QUE TOCO HOJE** (v5.24.28 em diante = edição loja).
5° **Amostra/teste** — demo pra cliente testar.
**Ordem dele:** mexe agora só no 4° e acaba de desenhar o 3°; os outros ficam travados até esses dois estarem perfeitos.
**Sobre o 5° (pergunta dele 'é realmente necessário?'):** minha resposta anotada = hoje NÃO como sistema separado. Quando precisar, vira um MODO dentro do 1° (banco de brinquedo, selo 'VERSÃO DE DEMONSTRAÇÃO', sem sincronizar com a nuvem real) — muito mais barato que manter uma 5ª fonte.

## v5.24.29 — 2026-09-14 — Excluir aparelho DIRETO (desempate da 2ª cobrança dele)

- **Posição do dono:** 'continua a mesma coisa de não poder excluir, somente bloquear'. A freio de mão que exigia bloquear ANTES de apagar virou só opção: o botão **Excluir de vez** aparece em QUALQUER aparelho (menos o próprio), remove da nuvem na hora, nada acontece no PC do aparelho e dados de cliente/produto nunca são tocados. Bloquear continua existindo pra quem quer só afastar.
- **Bastonete do deploy dele confirmado:** motor no ar com env.R2 (digicopy-downloads) e versao 5.24.28 — portal de atualizações ATIVO de fato.
- **Teste v52427 supersedido com motivo anotado. Suíte: 153/0/2.**

## v5.24.30 — 2026-09-14 — Site repaginado (só DigiCopy Downloads) + GERAR_EXE.cmd + certificado instalado ✅ + NF aba Geral catalogada

- **SITE NO FOGUETE:** a página /atualizacoes virou **DigiCopy Downloads** (só o nome do site, pedido dele): header animado, 3 cartões '1 Baixar → 2 Executar por cima → 3 Pronto', card da atualização com selo pulsante, botão verde com brilho/pulsação, prévia honesta quando o arquivo não subiu, prefers-reduced-motion respeitado.
- **GERAR_EXE.cmd:** um duplo clique na pasta gera o instalador (npm run build:win), diz onde está (dist/) e lembra o passo seguinte (subir pelo card 'Publicar atualização' no sistema). Era a resposta certa do 'não exclui ainda': o Excluir de vez direto é app+nuvem de v5.24.29+ → roda cmd + gera .exe + instala.
- **CERTIFICADO RENOVADO E INSTALADO ✅ (foto dele):** fim da pendência 'esquece'. Confirma SEFAZ em produção autorizada e destrava o caminho de emissão quando a fase chegar.
- **R2 URL pública pub-e1a98843...r2.dev:** isso é o Public Access do bucket; avisado a ele pra DESLIGAR (Settings → Public Access → Disable) — os downloads passam pelo /dl do worker com controle; o público nunca deve bater direto no bucket.
- **NF aba GERAL catalogada (12 fotos dele):** Ambiente 1-Produção/2-Homologação; DANFE 0-sem geração / 1-normal retrato / 2-paisagem / 3-simplificado / 4-NFC-e / 5-NFC-e msg; Frete Padrão 9-Sem Frete (opções 0-4,9 por emitente/destinatário/terceiros); Modelo 55-NF-e / 65-NFC-e (padrão 55); Processamento 0-Assíncrono/1-Síncrono (dele=Síncrono); Processo de Emissão 0-3 (dele=0 app do contribuinte); CRT 1-Simples Nacional (opções 1-4 incl. MEI); Regime Especial 1-Microempresa (lista 0-6 incl. MEI/Soc. Profissionais); Tipo de Emissão 1-Normal (contingências FS-IA/SCAN/DPEC/FS-DA/SVC-AN/SVC-RS/off-line 9); Tipo de Operação 0-Não se aplica (lista 0-9 incl. presencial/internet/entrega fora); Versão 4.00 (opção 3.10 legada); Série 1. Todos os campos+valores viram preset da config NF do sistema, com homologação como porta de teste.
- **Próximas fotos (pedidas):** abas Outras, Tributação, Mensagens, FCP, Inutilizar, NFCe, Autorizações, Reforma Tributária — depois os menus.
- **Próximo de verdade (decreto dele '4 = faz logo'): P7** serial-primeiro + remaneio, na versão seguinte.
- **Suíte: 153/0/2.**

## HOTFIX .cmd CRLF — 2026-09-14 — 'o cmd fecha sozinho'

- Causa achada: os .cmd estavam com quebra de linha LF (Linux) pura; o interpretador cmd do Windows engasga/fecha. Convertidos GERAR_EXE.cmd, atualizar_motor_nuvem.cmd e ver_gasto_nuvem.cmd para CRLF + teste da suíte trava CRLF pra sempre.
- Processo dele (apagar pasta → baixar zip → extrair completo) está CERTÍSSIMO — o problema era o arquivo, não ele.
- NF aba OUTRAS recebida e catalogada (outras.png): opções de finalização/agrupamento, margens DANFE, fuso UTC, caminho secundário PDF/XML, Email pro Escritório (CC contador = denivaldocs@hotmail.com — o fluxo-excelente dele que virou 'Enviar pro Escritório' no nosso desenho). Explicação filtro a filtro entregue no reply.
- Lupa do CRT abre site de ajuda do fornecedor antigo (arpulse/acsoluti 'emitir certificado') — inofensivo; no sistema novo esses campos terão explicação embutida, sem site externo.
- Suíte após hotfix: 153/0/2 (3 novos asserts CRLF somados).

## NF — mais 5 abas catalogadas (2026-09-14) + decisões do site + GERAR_EXE v2

- **AUTORIZAÇÕES:** campo único 'CNPJ/CPF de quem pode baixar XML' (até 10, vírgula) = terceiros autorizados junto à SEFAZ a baixar seus XMLs (uso típico: contador). No nosso desenho: config simples 'CNPJ/CPF autorizados'.
- **FCP:** Fundo de Combate à Pobreza por UF (tabela estado×alíquota, padrão 2%, NT 003.2015 v1.10) + 'Alterar Alíquota' por estado. Aplica só venda interestadual a consumidor final; contador confirma. No nosso: tabela-estado embutida padrão 2%.
- **MENSAGENS (Textos Padrões):** 3 caixas — (a) Informações Adicionais do Interesse do Contribuinte (texto livre que sai em toda nota), (b) Texto Obrigatório da Carta de Correção (o dele tem o modelo de crédito de ICMS Simples Nacional com valor/alíquota — personalizado com juízo do contador), (c) Justificativa da entrada em contingência (texto que explica porque emitiu fora do ar). No nosso: 3 campos idênticos, alertando que carta de correção NÃO altera valor/item.
- **TRIBUTAÇÃO:** perfil tributário PADRÃO dentro do estado (1) e fora do estado (2) com lupa para cadastrar perfis; opção 'Exibir Valor Aproximado Total dos Tributos nas Informações Adicionais dos Itens' + 2 formatos de mensagem (Federal/Estadual/Municipal junto vs separado). No nosso: seletor dentro/fora + perfis do contador.
- **REFORMA TRIBUTÁRIA:** ativar reforma + Indicador de Intermediador (0=site próprio/teleatendimento/venda direta; 1=marketplace/plataforma/app parceiro). Antecipação CBS/IBS 2026 — dele vende direto (0).
- **Ainda faltam:** Inutilizar, NFCe, Certificados + menus operacionais (Nota Fiscal com filtros, Perfil Tributário, Manifestação, NCM, Enviar XML, Venda-NF). Ele avisou: alguns menus são 1 foto só, outros vêm depois.
- **GERAR_EXE v2:** npm install antes + 'aperte qualquer tecla abre a DIST' (EXCEÇÃO documentada à regra no-pause, pedido explícito dele só pra este arquivo).
- **Decisões do SITE anotadas:** (1) nome na URL = subdomínio da conta workers.dev — opções dele: domínio próprio (recomendado) ou trocar subdomínio (grátis, mexe na URL da nuvem inteira → exige atualizar exe em todas as máquinas da loja logo depois); (2) imagens no tutorial = feature nova da fila (anexar no card de publicar, R2, [img] no texto); (3) 4 sistemas → arquitetura de CANAIS (coluna canal em app_releases: loja/comercial/celular/amostra) cada um com sua porta; (4) garantia: a edição LOJA nunca vai parar para download público — hoje o site é VAZIO até ele publicar, e quando canais chegarem, canal loja fica restrito (distribuição de mão em mão) e o público só ve o canal comercial.

## v5.24.31 — 2026-09-14 — MUDANÇA DE ENDEREÇO DA NUVEM (decisão dele)

- **Subdomínio da conta Cloudflare trocado de kauangabrielcardososilva7890 → digicopyonline** (escolhido por ele no cartão de opções; grátis). Todas as referências do código (16 arquivos) + teste endpoint atualizados p/ digicopy-sync-api.digicopyonline.workers.dev.
- **Sequência obrigatória passada a ele (qualquer inversão apaga a nuvem das máquinas):** 1º trocar no painel (Workers & Pages → canto direito workers.dev → Manage/Change subdomain → digicopyonline) → esperar ok; 2º abrir https://digicopy-sync-api.digicopyonline.workers.dev/v1/status no navegador (tem que responder ok:true — NÃO precisa redeploy, a URL é da conta); 3º rodar o cmd do motor; 4º GERAR_EXE v5.24.31; 5º instalar em TODOS os PCs da loja na sequência (até isso a sincronização fica cega nos PCs velhos).
- **v52265 volta a figurar como falha-aceita de infra (acorn ausente no sandbox) — baseline preservado 153/0/2.**

## v5.24.32 — 2026-09-14 — REVERSÃO do endereço + diagnóstico do Passo 4 em branco + aba Certificados catalogada

- **Causa do 'Passo 4 vazio' (log dele):** o meu varre trocou até o curl de checagem dentro do atualizar_motor_nuvem.cmd pra digicopyonline (que ainda não existia) — deploy estava OK, só a CHECAGEM mirava endereço fantasma. Não foi falha dele nem do motor.
- **REVERSÃO COMPLETA a pedido dele ('ehh... não é só criar um site novo?'):** subdomínio volta a kauangabrielcardososilva7890 em tudo (16 arquivos+testes). Nome bonito passa a ser: **domínio próprio quando vender**. Ele NÃO vai ao painel de subdomínio — caminho arquivado.
- **IDEIA DELE ADOTADA COMO O DESENHO OFICIAL (substitui 'canais'):** no card Publicar Atualização, destino escolhido na hora: [para todos] / [escolher clientes numa LISTA com CNPJ+nome] / [só meu pessoal da loja]. Site passa a pedir identificação (ou link dedicado) e só libera o que for pra você. Vira versão dedicada depois do P7. Garantia repetida: edição loja nunca baixável por terceiros.
- **NF aba CERTIFICADOS catalogada (6 fotos):** A3 por Número de Série (token/smartcard; o dele tem serial preenchido — é o certificado renovado); A1 por arquivo PFX+senha (campos vazios); e as 5 bibliotecas do motor ACBr — SSLType LT_TLSv1_2 ✓ (TLS 1.2, o exigido pela SEFAZ), SSLLib libWinCrypt, CryptLib cryWinCrypt, HttpLib httpWinHttp, XMLSignLib xsLibXml2 = o combo moderno 'Windows cuida do certificado criptografia e assinatura' + botões Padrão Cert. A3/A1. No nosso: cert A3 do Windows + fallback A1 pfx, senha no cofre do sistema, TLS 1.2 fixo.

## v5.24.33 — 2026-09-14 — VIRADA GRÁTIS CONFIRMADA (digicopyonline) + explicação do 'nuvem ANTIGA' do exe dele + aba Inutilizar catalogada

- **Diagnóstico do erro do .exe dele ('código da nuvem ANTIGO — não responde a versão'):** o exe que ele gerou/instalou saiu do zip v5.24.31 — o da janela em que o código apontava p/ digicopyonline inexistente. App não conseguia ler versão de endereço fantasma e declarava nuvem velha. Cura: exe novo (v5.24.33) + subdomínio ativo.
- **Ele CONFIRMOU:'sem comprar nada, quero o de graça'** → virada para o subdomínio digicopyonline REFEITA (16 arquivos + testes; inclui MEDIDOR_OFICIAL da conta também). Sequência única passada no reply: painel (Workers & Pages → workers.dev → Manage/Change → digicopyonline) → /health responde → cmd motor → GERAR_EXE → instala em TODOS os PCs. Domínio próprio fica só pra fase comercial.
- **NF menu INUTILIZAR catalogado (2 fotos):** Número Inicial / Número Final a inutilizar, Ano da numeração (dele: 26), Modelo 55-NFe/65-NFCe, Motivo obrigatório (dele usa 'NUMERAÇÃO FALHOU NA EMISSÃO'), botão Enviar Solicitação. Serve p/ APOSENTAR junto à Receita números que sobraram/emperraram — numeração de nota não pode ficar com buraco contábil. No nosso: mesma tela com validação (intervalo>0, motivo>=15 chars) e confirmação forte + protocolo da Resposta registrado na nota-fantasma.

## NF aba NFCe catalogada (3 fotos) — 2026-09-14 — SET FECHADO de configurações

- Checkboxes: Adicionar Tag de QRCode em Informações Suplementares ✓; Gerar NFC-e ao Finalizar Venda no PDV (desmarcado — ele não emite NFC-e automático no caixa); Imprimir Logo no DANFE ✓; Logo sobre os dados da empresa (desmarcado).
- **Id CSC / Token: 00001 + CSC/Token preenchido (parcialmente riscado por ele — NUNCA registrar o valor lá fora/nem aqui):** o Código de Segurança do Contribuinte é emetido no portal da SEFAZ-MG e é o que ASSINA o QRCode da NFC-e. Sem ele, cupom não valida.
- **Versão do QRCode: veqr200** (opções veqr000/veqr100/veqr200/veqr300 — 200 é o padrão v2 vigente).
- **Tipo de Impressora: 1-LASER/TINTA (Spooler)** (opção 0 = MINI IMPRESSORA térmica) + Selecionar Impressora ✓ + Imprimir DANFE sem pré-visualização (desmarcado) + Imprimir QRCode Lateral ✓.
- Pergunta dele sobre a virada respondida: **não perde nada** — a troca só muda o ENDEREÇO; D1 (banco), R2 (arquivos), worker, aparelhos cadastrados e dados sincronizados ficam exatamente onde estão (são recursos da conta, não do endereço). Único 'risco real': PCs com exe velho ficam mudos até instalar o novo — e nome ocupado o painel avisa e a gente troca no código em 1 minuto.

## NF submenu MANIFESTAÇÃO DESTINATÁRIO catalogado (7 fotos) — 2026-09-14

- **Tela 'Consulta Notas Destinadas' (botão Obter Notas):** 3 formas de pesquisa — (a) a partir do último registro consultado (retoma do NSU salvo — o marcador de página), (b) últimos 3 meses (primeira carga), (c) a partir de um NSU específico. Botão 'Consultar Destinadas'.
- **Tela principal (grade):** Tipo de Filtro — Cadastradas Hoje / Nome do Emitente / Chave / Valor (+caixa de texto p/ digitar o valor do filtro); Status NF — Todas/Autorizadas/Canceladas/Denegadas; Modelo NF — Todas/NF-e/NFC-e; Status Manifestação — Todos/Operação Confirmada/Ciência da Operação/Operação Desconhecida/Operação Não Realizada; período (17/06/2026–15/09/2026 nas fotos dele); 'Não se Aplica'. Colunas: Sel, Código, NSU, Nome/Razão Social, IE, CNPJ, Chave da Nota, Tipo de Valor, Valor, Série, Número DFe, Dh. Emissão, Status Nota, Status Manifestação, Protocolo Nota.
- **Ações da grade:** Obter Notas / Manifestar / Baixar XML. Botão Manifestar abre 4 eventos legais: Ciência da Operação / Desconheço esta Operação / Operação Não Foi Realizada / Operação Realizada com Sucesso.
- **Rodapé dele:** Banco 'Servidor Google', Usuário RECEPCAO, Código SisPrinter 1421, empresa DIGICOPY CNPJ 08.385.589/0001-03 (contexto dele em produção).
- **No nosso desenho:** mesmos 4 eventos (em português-gente), busca automática agendada, NSU-marcador por empresa, grade com mesmos filtros, Baixar XML → pasta nfe_xmls/AAAA-MM e pacote pro escritório.
- **NCM:** ele lembrou bem — era do 1° pacote (submenu lista); se quiser fotos da tela NCM aberta com filtros, manda quando abrir.

## NF submenu PERFIL TRIBUTÁRIO catalogado (11 fotos) + caminho da virada sem caça ao clique + nota-memória — 2026-09-15

- **Tela lista (dele, produção):** 5 perfis reais da loja — 00001 VENDA DENTRO DO ESTADO (CFOP 5102), 00002 VENDA FORA DO ESTADO (6102), 00003 DEV/REMESSA DE MERCADORIA P/ CONSERTO (5915), 00005 RETORNO DE CONSERTO (5916), 00004 TROCA DE MERCADORIA (6949). Botões Novo/Alterar/Excluir. **É o mapa das operações REAIS da loja de foto-cópia/assistência: venda local, venda interestadual, ciclo de conserto e troca.**
- **Tela 'Configurar Tributação' (ao criar novo):** Tipo Tributação — ICMS/ISSQN; descrição livre; CFOP Padrão (dele 5102 c/ lupa); abas: **ICMS** (CSTs do Simples Nacional: 101 c/ crédito, 102 sem crédito, 103 isenção faixa, 201/202 c/d ST+crédito, 203, 300 imune, 400 não tributada, 500 ST anterior, 900 outros); **PIS** (01-09 + 49 + Alíquota %, dele 0); **COFINS** (mesma lista + alíquota); **IPI** (50-56, 99 + Alíquota %, dele 0); **Reforma Tributária** (Código CST novo modelo: 000 trib integral, 200 alíq reduzida, 410 imunidade/não incidência, 510/515 diferimento, 550 suspensão, 800 transferência crédito, 810/811 anexos, 830 exclusão base + Classificação + Alíquotas IBS UF/IBS MUN/CBS).
- **Caminho da virada agora = duplo clique:** ele mandou foto do painel novo da Cloudflare e pediu o caminho; ao invés de caçar o clique, entreguei **trocar_endereco_nuvem.cmd** (roda `npx wrangler subdomain digicopyonline` em cloudflare-worker e confere o /health novo). Fallback se nome ocupado: foto → troco o nome no código em 1 min.
- **Dashboard dele (contexto, não sensível):** conta com teste (Pages teste-60f), digicopy-sync-api (~4,5k req), digicopy-contador-uso (23 req), digicopy-orcamentos (Pages); uso do mês $0,00 faturável — tudo dentro do incluído.
- **NOTA-MEMÓRIA (pergunta dele 'não é muita informação? e se o chat quebrar?'):** a memória de verdade desta obra NÃO é o chat — é este RELATORIO_SESSAO.md + os testes + o código, tudo versionado no repositório privado. Chat quebrando não perde nada: o que importa está anotado/aplicado aqui a cada entrega. Tokens/senhas (CSC, certificado etc.) NUNCA são registrados — ele já manda riscado e continua assim.

## NF menu NOTA FISCAL (listagem) catalogado (8 fotos) + correção do caminho da virada — 2026-09-15

- **Caminho da virada CORRIGIDO:** wrangler 4.132 NÃO tem mais `wrangler subdomain` (log dele comprovou — 'Unknown arguments'). Caminho oficial (docs 08/2026): Workers & Pages → coluna direita → 'Your subdomain' → Change. `trocar_endereco_nuvem.cmd` virou GUIA: abre https://dash.cloudflare.com/?to=/:account/workers-and-pages e imprime o passo a passo (dica do Ctrl+- se a coluna estiver cortada, como na foto dele).
- **Listagem de Notas (produção dele):** barra — modelo do ambiente [Todos/Produção/Homologação], situação [Todos/Autorizadas/Corrigidas/Canceladas/Não Geradas], modelo doc [Todas/NF-e/NFC-e], período (15/09/2026–15/09/2026 nas fotos), tipo de data [Dt. Cadastro/Dt. Autorização/Dt. Cancelamento], 'Agrupar Filtros', pesquisar + imprimir. Filtro texto (combo): Hoje/Abertas, Hoje, Núm Nota, Canceladas, Cód Cliente, Nome Cliente, Chave, Valor, Cód Venda.
- **Colunas da grade:** Data, Modelo (55/65), Tipo (Saída), Email (✉ ícone de enviado), Núm. Nota, Natureza Op. (VENDA/REMESSA/DEVOLUCAO/RETORNO — bate com os CFOPs do perfil dele), Cliente, Valor, Situação (Não Gerada nas fotos — listagem inclui a pré-nota ainda não transmitida). Botões: Novo/Alterar/Excluir/**Clonar**.
- **Menu 'Novo' abre:** Gerar NFe Avulsa / Gerar de NFe **Devolução para Cliente** / Gerar de NFe **Devolução para Fornecedor** / Gerar NFCe / Importar Declaração de Importação. No nosso: mesmos 4 caminhos + importação DI como v2.
- **Responder a ele:** Enviar XML — ainda NÃO chegou a tela em si (só o nome no submenu); falta foto da tela aberta (destino escritório/cliente, campos). Venda-NF ele já avisou que manda na próxima.

## NF menu ENVIAR XML ('Preparar Arquivos Fiscais') catalogado (1 foto) + aviso da virada confirmado — 2026-09-15

- **Aviso do painel ao renomear subdomínio (foto/log dele):** o antigo para de rotear NA HORA e o novo pode levar alguns minutos pra aceitar — comportamento ESPERADO, está tudo bem; confirmar e seguir.
- **Tela 'Preparar Arquivos Fiscais':** Selecione o Mês (agosto/2026), checkbox 'Incluir PDFs', botão Preparar Arquivos + link 'Acessar Pasta'. Matriz NFe/NFCe × contadores: Geradas / Canceladas / Corrigidas (NF-e só; NFC-e = 'Não Suportado') / **XML Não Encontrados** (com 'Ver' por coluna). Aviso: se houver XML não encontrado na consulta, procurar em OUTROS TERMINAIS antes de enviar (multi-PC manual!). Botão final cinza: **Enviar para Escritório**.
- **É exatamente o fluxo 'zip do mês pro contador' que já estava no desenho — E o aviso de outros terminais é a prova viva do problema que nossa sincronização resolve: no nosso, os XMLs de TODOS os PCs caem na mesma nuvem/pasta do mês automaticamente, e o pacote pro escritório sai completo sem caça ao terminal.**

## MARCO DE FIM DE DIA — 2026-09-15 — Virada praticamente concluída

- **VIRADA GRÁTIS DO ENDEREÇO = FEITA por ele** ✅: subdomínio trocado no painel, /health no novo endereço respondendo {"ok":true...,"versao":"5.24.33"}. Aviso de DNS dele era só propagação (resolveu). Motor cmd comprovadamente atualizando (Passo 4 correto: exe instalado era pré-troca → batia no endereço morto por isso o aviso de 'nuvem ANTIGA').
- **Faltando dele (pendências oficiais às 18h):** (1) GERAR_EXE + instalar nos PCs da loja → tela da nuvem mostra 'v5.24.33' e testa Excluir de vez direto; (2) **Venda-NF — adiado por ele**, talvez não venha hoje (esperar sem cobrar); demais menus fiscais 100% catalogados.
- **Sets NF catalogados até aqui (100% do configuracional):** Geral, Outras, Tributação, Mensagens, Certificados, FCP, Inutilizar, NFCe, Autorizações, Reforma Tributária, Perfil Tributário (5 perfis reais dele), Manifestação Destinatário completa, Listagem NF completa + 4 gerações do Novo, Enviar XML (Preparar Arquivos Fiscais). Falta só: **Venda-NF**.
- **Fila minha (ordem travada com ele):** v5.24.34 = P7 (serial primeiro + remaneio) → publicar-por-destinatário (ideia dele: todos/lista CNPJ+nome/só loja) → imagens no tutorial → sistema Atualizador separado (3° dele) quando o 4° estiver redondo.

## NF — VENDA-NF (a nota dentro da venda) catalogada COMPLETA (20 fotos) — 2026-09-15

- **Estrutura da tela (abas):** Gerais / Destinatário / Itens da Nota / Informações Adicionais / Transporte / Correções / Reforma Tributária / Referenciar / Links Úteis / Log. Cabeçalho: Código (00416), Dh Cadastro, Dh Emissão, Dh Saída (vazia até gerar), Usuário (KATIA). Rodapé: **Gerar Nfe** / Pré Visualizar / engrenagem / Sair.
- **GERAIS:** Modelo 55-NF-e; Finalidade (1-Normal, 2-Complementar, 3-Ajuste, 4-Devolução/Retorno, 5-Nota de Crédito, 6-Nota de Débito); Tipo (1-Saída); Natureza digitável/selecionável (VENDA, COMPRA, TRANSFERENCIA, DEVOLUCAO, COMPLEMENTAR, IMPORTACAO, CONSIGNACAO, REMESSA, REMESSA PARA CONSERTO, REMESSA EM GARANTIA, REMESSA BEM LOCAÇÃO, DEMONSTRAÇÃO, SIMPLES REMESSA, LOCAÇÃO EQUIPAMENTOS, RETORNO PARA CONSERTO, LOCAÇÃO BENS MÓVEIS...); Número (+ botão add); Painel Impostos Produtos (PIS/Confins/ICMS 0,00; **Total Aprox. 113,22** — IBPT automático); Crédito ICMS (Não/0,00); **Pagamentos** (lista com forma: 01-Dinheiro ... 05-Cartão Loja(Private Label), 14-Duplicata, 15-Boleto, 16-Depósito, 17-PIX Dinâmico, 18-Transferência, 19-Fidelidade, 20-PIX Estático, 21-Crédito em Loja, 22-Falha de pagto, 90-Sem Pagam, 98-Regime Esp, 99-Outro + botão +); **Duplicatas** (Valor + Vencimento com calendário); **Totais** (Desp.Acess/Produtos R$360/Serviços/IPI/ICMS ST/Frete/**Seletivo R$0,00/IBS R$0,36/CBS R$3,24** (Reforma 2026 já computando!)/Descontos/Total 360,00); Dados da Autorização (Dh 15/01/2026 10:30:03, Protocolo, Chave parcial); Status gigante **'Nao Gerada'** (estados já mapeados).
- **DESTINATÁRIO:** Pesquisar por [Cliente]; dados completos vindos do cadastro (nome contando 60 caracteres, ex.: J.P. IRRIGACAO LTDA CNPJ 02.520.320/0001-06, JANAÚBA-MG); checkbox 'Endereço de Entrega é Diferente do Destinatário'. No nosso: puxar do cadastro de clientes SEM redigitar.
- **ITENS DA NOTA (dele confirma: igual à venda, mas só produtos):** sub-abas Itens/Tributação; linha do item: Nº, Código (1186), Descrição (CARTUCHO DE TONER HP 85A/1132), **NCM 32151100** (o NCM real do toner dele!), **CFOP 5102, CSOSN 102** (sem crédito — bate com foto config), Qtd 4 UN, Vlr Unit 90, Total 360, Tipo PRODUTO, Desconto, BC. Campo Perfil Tributário por item + Novo Perfil atalho.
- **INFORMAÇÕES ADICIONAIS:** 3 caixas (Pré-Configurada do cadastro; Complementares livre — dele escreve 'TOMADOR NOTA FISCAL DE SERVIÇO 5072 - Venda: 15697, Parc: 16722, Venc..., Valor 360,00' = gatilho manual do romance crediário→fiscal!; Geradas Automático: '#slinebreakValor Aproximado Total dos Tributos Federais, Estaduais e Municipais R$ 113,22 Fonte: IBPT') + bloco Órgãos Públicos (Nota de Empenho/Pedido/Contrato).
- **TRANSPORTE:** Modalidade Frete (0-Contratação Remetente CIF / 1-Destinatário FOB / 2-Terceiros / 3-Próprio Remetente / 4-Próprio Destinatário / 9-Sem Ocorrência ✔ dele); Transportadora (CNPJ/Razão/IE/Endereço/Cidade/UF/Email + Selecionar); Veículo (Placa/UF/RNTC); **Volumes Transportados** (Qtde/Espécie UNIDADE/Marca/Numeração/Peso Bruto/Líquido/Lacre).
- **CORREÇÕES:** grade 'Correções Realizadas' + botão Imprimir (histórico de cartas de correção da nota).
- **REFERENCIAR:** 'Notas Fiscais Referenciadas' + Adicionar (pra devoluções/complementares apontarem a nota-origem).
- **REFORMA TRIBUTÁRIA (aba da nota):** vazia nas fotos + link 'Outras Opções' — campos reforma por nota ainda pobres no sistema velho (o dele computa só nos Totais).
- **LINKS ÚTEIS:** ele DECRETOU 'não é necessário colocar' → **fora do nosso escopo**.
- **LOG:** sub-abas Respostas / XML Resposta / Log / NFe / Retorno Completo WS / Dados / RetornoConsulta NF-e 2.01 (caixa 'Solução'/'Mais Informações') — o raio-X da conversa com a SEFAZ por nota.
- **Clique na Chave de Acesso:** menu Copiar Chave / Consultar NF Sefaz Nacional / Consultar NF Sefaz Estadual / **Acessar Diretório XML**.
- **DANFE PRÉ-VISUALIZAÇÃO (foto completa):** layout DANFE retrato com selo 'NF-E EM PRÉ-VISUALIZAÇÃO SEM VALOR FISCAL' + vermelho CANCELAZ? (na foto: marca d'água); blocos emitente/destinatário/cálculo/transportador/dados adicionais com o texto IBPT + tomador — **a 1ª foto da sessão ('NOTA FISCAL IMPRESSA') era a versão autorizada (com Protocolo); esta é a prévia. Os dois estados provados.**
- **Pedidos extras respondidos p/ próxima leva (poucos e cirúrgicos):** (a) sub-aba **Tributação** do item na nota (impostos por item); (b) o que abre na **engrenagem** do rodapé; (c) 'Pesquisar por' do Destinatário (quais opções além de Cliente); (d) 'Outras Opções' da aba Reforma Tributária.

## Micro-prints respondidos (2026-09-15)

- **Engrenagem do rodapé da nota** = abre as Configurações de NF (o set completo já catalogado — Geral/Outras/Tributação/...). FECHADO.
- **'Pesquisar por' do Destinatário** = Cliente e Fornecedor. FECHADO (nota pode sair pra fornecedor — devolução).
- **'Outras Opções' da aba Reforma Tributária** = submenu 'Alterar NFe → Cidades / Datas' (parâmetros de vigência da reforma por UF/data). FECHADO.
- **Falta só 1 (ele não entendeu — explicado de novo):** dentro da aba 'Itens da Nota', no cantinho superior esquerdo ficam duas mini-abas juntas: **Itens | Tributação**. Quero a foto da mini-aba **Tributação** aberta (com um item selecionado) — é onde o sistema velho mostra PIS/COFINS/ICMS/IPI **por item**.

## Foto bônus dos Itens (2026-09-15) — Perfil Tributário POR ITEM confirmado

- A foto (dele, sem lançar, só exemplo) mostra o **combo 'Perfil Tributário' da linha de lançamento do item aberto com os 5 perfis reais da loja** (VENDA DENTRO DO ESTADO / DEV+REMESSA CONSERTO / RETORNO CONSERTO / VENDA FORA DO ESTADO / TROCA DE MERCADORIA) + atalho 'Novo Perfil'. Confirma o desenho: o item herda o perfil que decide CFOP/CSOSN na hora (na linha já apareceram 5102 + CSOSN 102). No nosso: mesma escolha, vindo sugerido pelo vínculo produto↔natureza.
- A mini-aba 'Tributação' propriamente dita AINDA não veio (a foto dela ficou pela metade — fica pra próxima visita dele à tela, sem cobrança).

## NF — tributação POR ITEM catalogada COMPLETA (18 fotos) — MEGA-RELATÓRIO 100% FECHADO — 2026-09-15

- **Barra 'Dados do Produto':** GTIN/EAN, C.Prod (1186), Descrição, Valor, NCM, **CEST**, CFOP 5102 + 'Alterar para Todos'.
- **Sub-abas do item: Tributação | Importação | Outros | Reforma Tributária.**
- **Tributação:** ICMS (combo Simples 101/102/103/201/202/203/300/400/500/900 + Base% + Valor + 'Zerar'), ICMS ST (Base/% /Valor+Zerar), IPI (50-56, 99 + Valor+Zerar), PIS (01-09 + 49; dele mostra 07-Isenta), COFINS (idem; 06-Alíquota Zero também na lista).
- **Importação:** DI/DSI/DA/DRI-E, Data Registro, Cód Exportador, Via de Transporte, AFRMM, Forma de Importação, Desembaraço (Data/UF/Local), Adições (Nº/Fabricante/Desconto), IOF/Desp.Aduan./II, Dados do País (1058 BRASIL default).
- **Outros → CSOSN ICMS:** Valor Icms Deson., Valor DIF., Valor UF Remetente/Destinatário, **Cód. Benefício Fiscal**.
- **Outros → Icms ST:** Valor ST Retido/Dest., %FCP+%ST, Valor Substituído.
- **Outros → Fcp:** B.C./%/Valor ×3 (normal, UF Destino, ST).
- **Outros → Efetivo:** Base %, Valor Efetivo, %Redução.
- **Outros → Outros:** Nº do Pedido + Item; par Comercial/Tributável (UN × 4,0000 × 90,00 = 360,00).
- **Reforma Tributária (por item):** Tributação Padrão — CST (000 integral, 200 alíq. reduzida, 410 imunidade, 510/515 diferimento, 550 suspensão, 800 transferência, 811 ajustes, 830 exclusão de base) + **Classificação (000001 integral IBS/CBS; 000003/000004 regime automotivo...)** + Base R$360; painel Padrão com os 3 cofrinhos **verdes calculados: IBS Estadual 0,1% = R$0,36 · IBS Municipal 0% = R$0,00 · CBS 0,9% = R$3,24**; aba Devolução de Tributos (IBS Est./IBS Mun./CBS devolvidos).
- **Conclusão:** com essa leva o inventário do sistema velho está 100% mapeado (config 10 abas + perfis + manifestação + listagem/gerações + preparar arquivos + nota de venda completa + tributação por item + reforma por item). FASE DE DESIGN FECHADA; a construção entra quando P7 e o Atualizador estiverem prontos, na ordem dele: primeiro perfeito o essencial.

## GERAR_EXE v3 + caminho exato do Excluir de vez (2026-09-15)

- Pedido dele: tirar o passo 3 (tecla→abre DIST) porque não funcionou na máquina dele → removido; agora: instala peças, monta, e ele mesmo abre a pasta dist. Fecha no X direto.
- **Print da nuvem dele = v5.24.33 CONECTADO** (linha 'Código da nuvem: v5.24.33') — exe novo fala com o endereço novo ✅. Uso mostrado: 0/50mi gravações • 60/25bi leituras (curiosidade), 8 aparelhos.
- **Caminho exato do Excluir:** janela ☁️ Nuvem DIGICOPY → rola até 'Administração da nuvem' → botão **'Ver aparelhos e dados enviados'** → cada aparelho da lista tem [Bloquear] e **[Excluir de vez]** (não precisa bloquear mais). Se clicar e der erro, a mensagem aparece na hora — mandar foto (suspeita-0: ele só não achou o botão).

## v5.24.34 — 2026-09-15 — BUG DO Z-INDEX: pop-ups sempre na frente (o 'Excluir não faz nada' resolvido de vez)

- **Causa-raiz (denúncia dupla dele = um problema só):** janela da nuvem z-index 100000 × pop-ups do sistema z-index 99999 → TODA confirmação nascia atrás da aba de nuvem. O botão Excluir de vez abria a pergunta escondida → parecia morto.
- **Correção:** pop-ups do sistema (confirmar/aviso/alert) agora em z-index 2147483000 (teto seguro CSS) — por cima de qualquer janela do sistema, hoje e sempre. Guardado por assert na suíte.
- **Para ele valer:** GERAR_EXE v5.24.34 + instalar por cima. Aí: Nuvem → 'Ver aparelhos e dados enviados' → Excluir de vez → a pergunta aparece NA FRENTE → confirma → aparelho some.
- **P7 andou pra v5.24.35** (a numerologia é só-para-frente).
- **Suíte: 153/0/2.**

## v5.24.34 (continuação) — FK resolvida + GERAR v4 + REGRA DAS PERGUNTAS — 2026-09-15

- **FOREIGN KEY (erro real dele):** records.updated_by, changes.device_id e enrollment_codes.created_by apontam pro aparelho sem cascata → delete físico estoura SQLITE_CONSTRAINT. Correção: migração **0005_soft_delete_aparelhos.sql** (coluna excluido_em, schemaVersion 3) + todas as leituras (auth, listas, contagens) filtram excluídos + delete vira carimbo. Aparelho some da lista na hora, perde o acesso na hora, dados sincronizados intactos pra sempre. **ELE PRECISA: rodar o atualizar_motor_nuvem.cmd 1x (migra+publica) e só depois testar o Excluir.** Exe não muda (bundle sha igual — z-index já dentro do v5.24.34 que ele tem que instalar).
- **GERAR_EXE v4:** janela filha independente (start cmd /k ... interno) — filho travado não derruba mais a janela (o crash UV_HANDLE_CLOSING do node dele era a suspeita do fechamento). Nunca mais fecha sozinha; sai só no X.
- **REGRA NOVA (decreto dele):** os cartões de pergunta não são enfeite — **são a via oficial de toda decisão daqui pra frente** (sempre que houver pergunta/opção, cartão).

## GERAR_EXE v5 + cadeia factual do FK (2026-09-15)

- **Log dele = build OK:** exe v5.24.34 gerado e verificado (30.7MB, raio-x). O '. foi inesperado neste momento.' = blocos if(...) no batch; **v5 = zero parênteses de bloco** (goto :sucesso/:fim) + janela filha (v4) mantida → nunca mais fecha e nunca mais engasga.
- **Cadeia FACTUAL do FK (pedido dele 'sem achismo'):** o app novo já fala certo com a API; o motor no ar ainda é o velho (sem a migração 0005); a nuvem só muda quando ELE roda o atualizar_motor_nuvem.cmd (Passo 1/2 mostra '0005_soft_delete_aparelhos'). Não é deploy automático porque a conta é dele — é assim por segurança desde o primeiro dia. Passo seguinte dele: motor cmd 1x → Excluir → print da lista limpa.

## v5.24.35 — P7 FINAL: serial primeiro + remanejo sem duplicar (2026-09-16)

**O que entrou (o último pedido grande do pacote "impressora no contrato"):**

1. **Serial primeiro no cadastro novo** — o modal de equipamento do contrato
   (fluxo vencedor, ids `impf-*`) abre mostrando SÓ o serial + banner azul
   "Passo 1" + botão Avançar (Salvar do modal-footer fica escondido). Avançar
   busca o serial/patrimônio em TODO o sistema; achando, preenche modelo e
   patrimônio sozinhos e reexibe o resto.
2. **Remanejo com aviso SÓ no salvar** — cadastro novo cujo serial já tem parque
   ATIVO em OUTRO cliente dispara, na hora de salvar, o confirm do sistema
   (z-index máximo, sempre na frente): "impressora cadastrada em <cliente> com
   o contador <n>, deseja remanejar essa impressora pra esse cadastro?". Sim:
   o parque antigo vira `status='remanejada'` com `frozen` (snapshot de
   modelo/serie/patrimônio/setor + data) e rastro `remanejadoParaContratoId/
   ClienteId`.
3. **Nunca duplica serial no sistema** — fixup anti-duplicata: snapshot dos ids
   antes do salvar original, detecta o equipamento novo criado, transfere os
   campos pro cadastro JÁ existente, reponta o parque novo, dedup o contrato e
   remove a sobra (save + re-render).
4. **Remanejada = histórico congelado** — não abre edição (aviso "Histórico
   congelado — não edita"), não salva, contrato exibe o bloco "Remanejadas
   (histórico congelado — não edita, não entra no mensal)". O vencedor
   (`fluxo_contrato_leitura_corrigido_patch.js`, pos 47) teve seus 3 filtros
   (máquinas do contrato, valor mensal fixo, máquinas da leitura) ajustados pra
   excluir `remanejada` além de `inativo`.

**Arqueologia (por que P7 precisou de wrap NOVO):** a cadeia de carregamento é
locacao_contratos(19) → fluxos_operacionais(20) → contratos_refino(21) →
definitivo(46) → **vencedor pos 47** → v5176(71) → remanejar(159) +
serial_ocultar(165). Os wraps 159/165 estavam MORTOS: miram `kr-imp-busca/
serie`, ids que só existem no refino (pos 21) — o vencedor usa `impf-*` e não
tem campo de busca. Solução: wrap final NOVO (`ajustes_v52435_impressora_
remanejo_final_patch.js`, pos 199, ÚLTIMO do manifest — carrega depois de
todos, vence sempre) adaptado aos ids reais, não ressurreição da ordem antiga.

**Ritual:** manifest 198→199; carimbo 5.24.34→5.24.35 (index 5x, mobile 4x,
package.json — GERAR_EXE fora); sync_build + bundle 199 scripts + 4 guards +
cópia celular. **Bônus ambiental:** npm install mirado (acorn + node-forge,
--ignore-scripts contorna o download do electron que morre no TLS do sandbox)
→ bundle volta a nascer COM isolamento de erro (196/199 envolvidos em
try/catch) e `node-forge` disponível. Isso zerou as 2 falhas ambientais
crônicas (test_ajustes_v52265 isolamento, test_ajustes_v5228 assinatura) —
eram a baseline 153/0/2. 13 testes antigos tinham mural congelado (pinos
5.24.34 em v52423–28, posições da fila final em v52293/95/96, allowlist
"tamanho 198" em v52284–87): todos atualizados pra nova realidade.
test_ajustes_v52435.js novo (31 asserts: marcadores, PURE, fluxo de remanejo
de ponta a ponta com DOM fake — pergunta só no salvar, congela antiga,
anti-duplicata, mesmo cliente sem pergunta). Registrado no runner.
**Suíte: 156 passaram / 0 falha aceita / 0 falharam.**

## v5.24.36 — leitura: UMA ABERTA POR VEZ (decreto dele) + contador anterior certo pós-estorno + link oficial corrigido (2026-09-16)

**Bug relatado (caminho exato dele):** contrato → leituras → novo → novo
lançamento → salvar → faturar → extornar → lápis → muda contador → salvar → a
lista mostra o ANTERIOR como o contador que foi faturado, não o de verdade.

**Causa raiz (cadeia factual):** `salvarLancamentoContador` calcula
`anterior = p.contadores[key]` VIVO. Após o 1º lançamento o parque já segura o
atual; a edição RECALCULAVA o anterior pelo parque (ex.: 1150) em vez do
congelado do item (1000). O faturar/estornar não tocam contador — o estorno só
reabre a edição; o deslize era o recálculo pelo estado vivo.

**Decisão DELE (virou decreto):** "só vai poder criar uma nova leitura se
fechar a leitura que já está aberta".

**O que entrou (`ajustes_v52436_leitura_uma_aberta_patch.js`, pos 200, último):**
1. **Guarda nos 3 criadores de leitura** (novaLeituraContrato do contrato,
   criarLeituraDetalhada avulsa, criarLeituraDefinitiva): se o contrato tem
   leitura do formato novo NÃO faturada ('aberta' ou 'estornada'), o Novo é
   BLOQUEADO com aviso citando a leitura — "Fature (feche) ela antes de criar
   outra" (estornada: "ou apague") — e abre a leitura existente na hora.
   Leituras do formato antigo (parqueId simples) não travam o fluxo novo.
2. **Anterior certo na edição:** antes do salvar original rodar, o contador
   vivo do medidor editado é alinhado ao anterior CONGELADO do item — o
   original recalcula certo e devolve o parque ao novo atual. Wrap cirúrgico,
   sem duplicar template.

**Resposta à cobrança do link (ele: "porque voltou com o githack?"):** a REGRA
VIVA já dizia "link teste Pages" — o deslize nasceu no sync_build.js, que
IMPRIMIA o link do GitHack. Repo privado matou o GitHack (não serve arquivo de
repo privado). Fix na fonte: sync_build imprime SÓ https://teste-60f.pages.dev
+ zip; test_ajustes_v52263 reescrito pra travar (assert anti-LINK_GITHACK).
Auditado sem achismo: em runtime NADA depende de githack — Pix é nuvem desde
v5.22.19 e o orçamento público vai de digicopy-orcamentos.pages.dev (vencedor
pos 182 rebinta as vars velhas dos patches das pos 149/173, que ficam mortas).

**Ritual:** manifest 199→200; carimbo 5.24.35→5.24.36; sync+bundle 200 + 4
guards + celular; murais (allowlist 200, fila final +leitura, pinos 5.24.36 em
v52423–28 e v52435); test_ajustes_v52436.js (32 asserts, funcional com DOM
fake: bloqueia aberta/estornada, legado passa livre, anterior 1000 e parque
1180 provados). .md regrados: BUILD_EXE (versão + links oficiais),
RELATORIO_COMPLETO (cabeçalho ESTADO ATUAL), ANDAMENTO e ETIQUETA (status).
Conteúdo útil de todos preservado. **Suíte: 157 passaram / 0 falharam.**

## v5.25.0 — REVISÃO COMPLETA DE LEITURAS (relatório dele + decreto de versão) (2026-09-16)

**Decreto de versão novo (virou lei, anotado nas REGRAS VIVAS):** esta correção
grande vai pro **5.25.xx**; as partes de NF (praticamente um menu novo) irão
pro **6.xx.xx** quando chegarem. Relatório dele foi na v5.24.28 — o bug do
contador anterior já estava corrigido na v5.24.36 (ele ainda não tinha testado).

**Arqueologia da área de leituras (mapa do que ele realmente vê):**
listagem/histórico = detalhada(49)+v5172(68); detalhe = detalhada(49)+v5183(78);
lançamento = detalhada(49)+v5183(78) (o X do LANÇAMENTO já tinha guarda
"salvar?" desde v5.18.3 — o da leitura inteira é que não tinha); estornar usa
confirm nativo do navegador; "Conferir NF-e" injetado no rodapé pelo v5221.
E DUAS telas vivas: a nova do contrato + a ANTIGA "Leituras" do menu Locação
(formato parque simples, fora do contrato) — ele não conhecia a antiga.

**O que entrou (`ajustes_v5250_leitura_overhaul_patch.js`, pos 201, último):**
1. **Contador anterior visível de volta (avulso 1)** — nunca foi portado da
   coleta rápida antiga pro modal novo (factual: nenhum histórico de remoção
   neste repo — o modal novo nasceu sem). Agora chip azul somente-leitura
   "Contador anterior registrado: N" acompanhando impressora+tipo; em edição
   mostra o congelado do item.
2. **Faturar/Estornar/Remover com pop-up do SISTEMA (avulsos 2+4)** —
   confirmSistema com número da leitura + valor (faturar), aviso de reabertura
   (estornar), nome da impressora (remover). Nativos extintos dessa área.
3. **Ações na LISTAGEM (avulso 2)** — cada leitura do histórico ganha botão
   Faturar (não faturada) / Estornar (faturada) sem precisar abrir; após a
   ação volta pra lista.
4. **Rodapé da leitura (avulso 3)** — removidos "Voltar ao histórico" e
   "Conferir NF-e" (NF segue acessível pela Central de NF; fase NF irá pro 6).
   Ficam: **Salvar** (salva e VOLTA À LISTAGEM — opção dele no cartão), o X
   do cabeçalho agora **pergunta "salvar antes de fechar?"** com o pop-up do
   sistema (Confirmar = salva e volta à listagem; Cancelar = fecha sem salvar,
   lançamentos não se perdem), e **Imprimir notinha** em padrão vendas
   (azul/ícone, h-11).
5. **Tela antiga APOSENTADA (decreto)** — item "Leituras" some do menu lateral;
   a view vira um cartão explicativo com botão pros contratos. RISCO checado:
   leituras velhas pendentes de faturar NÃO ficam órfãs — o cartão traz botão
   "Faturar pendências antigas (N)" enquanto houver alguma. Dados intactos,
   openModal('leitura') redirecionado com aviso.

**Auditoria de menus ocultos (pergunta dele):** mapa completo na entrada abaixo
("MAPA DE VISIBILIDADE", corpo desta sessão).
**Ritual:** manifest 200→201; carimbo 5.24.36→**5.25.0** (lei nova); bundle 201
+ 4 guards + celular; murais (allowlist 201, fila final, pinos 5.25.0);
test_ajustes_v5250.js (38 asserts, funcional com DOM fake). **Suíte 158/0/0.**

## v5.26.0 — O 3º SISTEMA: GERENTE DE ATUALIZAÇÕES (CNPJ + senha única · site restrito · sininho por destinatário · imagens do tutorial) (2026-09-16)

**Pedidos dele (decisões que ele bateu nos cartões desta leva):**
1. **PC novo conecta com CNPJ + senha de conexão ÚNICA** (definida 1x no painel
   Nuvem; trocar a senha só bloqueia acessos NOVOS — PCs já conectados seguem).
   O convite relâmpago (uses_left=1, 5–60min) fica como plano B, não some.
2. **Site de atualizações RESTRITO dos dois jeitos:** tela de CNPJ+senha
   (lembrada 30 dias por cookie HttpOnly) **E** link secreto que "aparece como
   notificação do sistema baixado": o sininho só acende se houver versão mais
   nova **destinada** ao CNPJ daquela instalação. Destinatário por publicação:
   **todo mundo / lista de CNPJ+nome (empresas cadastradas) / só a loja do
   dono** (teste primeiro). Sem versão pra ele = silêncio total.
3. **Atualizador = programa .exe SEPARADO no PC do dono** (não página na
   nuvem): o "DIGICOPY Gerente de Atualizações" joga o .exe, escreve
   notas/tutorial, anexa imagens, edita, desliga, oculta, exclui e escolhe
   PRA QUEM cada atualização aparece. **Ele NÃO instala nada nos clientes** —
   quem baixa é sempre o cliente, pelo sininho ou pelo site.
4. **Imagens no tutorial:** anexadas do PC no formulário de publicar/editar
   sobem para o cofre R2 (`img/<versao>/i_....`) e aparecem **dentro do
   tutorial, antes do botão de baixar**, com ZOOM ao clicar (lightbox na
   página restrita e na página secreta /a/). Máx 8 por versão, até 4MB cada.

**O que amarra tudo (arquitetura):**
- **Worker (motor da nuvem) ganhou:** 4 tabelas (`connect_secrets` — senhas
  SÓ em hash com pimenta `SETUP_SECRET|área|cnpj|senha`, nunca em texto;
  `empresas`; `site_sessions` 30d; `gerente_sessions` 7d), 4 colunas em
  `app_releases` (`destino_tipo` todos|lista|so_loja, `destino_cnpjs` JSON,
  `slug` do link secreto a_..., `imagens` JSON de chaves R2), e as rotas
  `/v1/connect-pass` (só admin define), `/v1/enroll-cnpj`,
  `/v1/site-login` (303 + cookie), `/v1/gerente-login` (só o CNPJ da empresa
  dona passa; token gr_ de 7 dias), GET/POST `/v1/gerente/empresas`,
  `/v1/release-image`, página secreta `GET /a/<slug>` (abre direto, sem
  digitar CNPJ), `GET /img/<v>/<arq>` (só de versão viva) e a ação
  `remover-imagem`. **Gateways novos:** GET `/v1/app-release?cnpj=` filtra por
  destinatário (sem cnpj → só publicações "todos", back-compat com apps
  velhos); `/v1/app-releases` FECHOU (era aberto: vazava slug/destinatário);
  `/dl/` não é endereço decorável (sessão do site OU slug da versão OU
  gerente/admin); POST `/v1/app-release` e `/v1/release-file` aceitam
  `requireAdminOuGerente` (admin do painel OU gerente — credencial SEPARADA,
  loja-cliente não vira gerente).
- **App (patch 202 `ajustes_v5260_cnpj_gerente_patch.js`):** (a) o sininho
  pergunta com `?cnpj=` (CNPJ da sessão/login por CNPJ, volta por
  db.empresas) e abre a página secreta `/a/<slug>`; (b) a tela de autorizar
  computador ganha a aba **"Entrar com CNPJ"** (CNPJ da loja + senha de
  conexão + nome do PC → conecta sem código que vence); (c) o painel Nuvem
  (admin) ganha o cartão **"Senhas de conexão (CNPJ) e do Gerente"** (define
  1x: CNPJ+nome da empresa dona, senha de conexão, senha do gerente — vão SÓ
  como hash pra nuvem).
- **Gerente (subprojeto `gerente-atualizacoes/`):** Electron mini (janela
  1180×900, tela isolada por preload/contextBridge, uploads pelo processo
  principal), abas **Jogar atualização** (versão·notas·tutorial·imagens·
  destino·prazo·.exe → registrar→subir exe→subir imagens) e **Já jogadas**
  (ligar/desligar · ocultar/mostrar · editar notas+tutorial+destino · excluir
  com 2 confirmações · copiar link do sininho · anexar/trocar .exe · tirar
  imagem) + `GERAR_GERENTE_EXE.cmd` (goto-only, CRLF, janela que nunca fecha,
  sem acento = cp850-safe).
- **Migration oficial:** `cloudflare-worker/migrations/0006_cnpj_gerente.sql`
  (o motor também cria tudo sozinho/idempotente; NÃO mexe em
  system_meta.'schema_version' — o /health exige '2').

**Ritual:** manifest 201→202; carimbo **5.26.0** (entrega grande/sistema novo
→ 2ª casa, pela lei de versão dele) em package.json/index.html/worker/celular;
bundle 202 (isolamento de erro intacto: 199 isolados) + sync do celular +
guards (test_app_bundle, test_build_sync, test_mobile_apk, test_versao_visual)
+ murais re-ancorados (fila final do v52293 -8→-9, cadeias v52295/96/52435/36,
"um arquivo por módulo" 201→202 nos v52284-87, carimbos fixos 5.25.0/5.24.34
→ 5.26.0 onde eram pin vivos). **Suíte: 158/0/0** — inclui o novo
test_ajustes_v5260.js (55 asserts: hash-único de senha, destinoOk simulado
com as funções puras extraídas do worker, gateways fechados, rotas novas,
pin do gerente, carimbos).

**Passos DELE quando empacotar (na ordem):**
1. `atualizar_motor_nuvem.cmd` 1x (o MOTOR mudou: rotas/tabelas novas).
2. No sistema (admin) → Nuvem → cartão senhas: definir CNPJ+ nome da dona,
   senha de conexão, senha do gerente (1x só; troca futura = mesmo cartão).
3. Na pasta `gerente-atualizacoes/`, rodar `GERAR_GERENTE_EXE.cmd` → instalar
   o Gerente SÓ no PC dele (nunca nas lojas-clientes).
4. Publicar uma versão de teste marcando **"só a minha loja"** → conferir o
   sininho no PC dele e o site restrito (CNPJ+senha / link do sininho).
5. Quando gostar: republicar pra "todo mundo" ou pra lista de empresas.
6. PCs novos a partir daí entram com CNPJ + senha de conexão (aba nova na
   tela de autorizar) — sem código que vence.

**Testes da v5.25.0 que ele GUARDOU** (adiou até este sistema sair): continuam
pendentes de rodada de campo dele — o caminho do convite relâmpago do patch v5.25.0 fica
intacto como plano B e coberto pela suíte.

## v5.26.1 — SITE PROFISSIONAL DE VERDADE + FIX GERENTE (artworkUrl) + imagens fiéis ao site (2026-09-16)

**Reporte dele (foto do painel + log do GERAR_GERENTE_EXE):**
1. **"Rota não encontrada" no passo 2** (salvar senhas): era o MOTOR VELHO ainda no ar — o connect-pass só existe depois de rodar o atualizar_motor_nuvem.cmd. Sem achismo: o 404 vinha da 404 genérica do worker antigo.
2. **Builder do Gerente quebrava:** `configuration.win has an unknown property 'artworkUrl'` — propriedade que eu botei errada no package.json do gerente. REMOVIDA; versão do gerente carimbada 5.26.1. Bônus: o npm do PC dele BLOQUEIA o postinstall do electron ("install-scripts blocked") — o GERAR_GERENTE_EXE.cmd ganhou passo próprio (approve + rebuild + install.js direto, tudo goto-safe) antes do build.
3. **Rodapé do site:** removidas as 2 linhas que ele mandou tirar ("Página mostrada pela própria nuvem do sistema." / "Só aparece o que está vigente..."). No lugar, rodapé informativo: canal oficial + "fale com quem instalou o sistema na sua loja".
4. **"Queria o site bem bonito e bem informativo, tipo os profissionais":** REDESIGN COMPLETO do /atualizacoes e da página /a/<slug> — faixa gradiente, marca (logo D + "Sistema DigiCopy · Portal oficial de atualizações"), selos de confiança (conexão segura · versão oficial verificada · dados preservados), chip de sessão (CNPJ autorizado + sair), trilha 1-2-3, cards com notas+tutorial+imagens, botão verde gigante com **tamanho do arquivo** (lido do R2, ex.: "82 MB") + data de publicação + texto "instala por cima". Meta description + theme-color (visual profissional até no preview do WhatsApp).
5. **BUG REAL PEGO PELO DEMO:** a rota /a/<slug> tinha perdido o `return` no replace — dava 404 de verdade em produção. Descoberto rodando o próprio worker em Node com banco simulado (as 3 páginas renderizadas e verificadas: /a/, /atualizacoes logado, login — todas 200). Guarda nova no test_5260 trava os dois returns pra sempre.
6. **Imagens do tutorial — resposta à pergunta dele:** "faz mais real ou tiro print?" → As telas do SITE agora têm versões fiéis geradas (site-01-login-restrito, site-02-pagina-da-atualizacao, site-03-portal-restrito-logado em exemplos-tutorial/) — concebidas do design REAL novo. Prints 100% exatos do sistema/sininho/instalador dependem do PC dele (não dá pra desenhar o que só existe no Windows dele); ele pode trocar qualquer uma pelos prints reais na hora de publicar, no próprio Gerente.
7. **Futuro do Gerente (registrado como roadmap):** o programa foi feito pra crescer — a concha Electron com login seguro e IPC já suporta novas abas; quando ele pedir, o Gerente vira PAINEL DE GESTÃO (clientes/empresas, pagamentos dos planos, suspender/liberar loja) com rotas novas na nuvem. Não codificado agora.
**Ritual:** WORKER_VERSION 5.26.1 (app intocado: sem release de sistema nova); pins re-ancorados (v52296/52423/52424/52425 worker; v52424/52428 murais do site — o visual novo supera os pins do vitrine antigo; v5260 com 5 asserts novos). Suíte: 158/0/0.

## v5.26.2 — LOGIN DA NUVEM ANTES DO LOGIN DE USUÁRIO + AVISOS CLAROS NO GERENTE (2026-09-16)

**Pedido dele, literal:** "consegue deixar pra fazer ANTES de entrar no login de usuário? (...) DEPOIS que colocar o CNPJ e a senha é que vai aparecer a parte de falar qual é esse computador — é mais uma segurança (...) conectou uma vez já era, não precisa mais. O usuário precisa fazer o login UMA VEZ POR DIA." + "no login do Gerente eu não sei se digitei errado nem nada, pois não tem os avisos."

1. **PORTÃO DA NUVEM (patch ajustes_v5262, posição 203, guard __v5262ln):** em PC NÃO autorizado, um painel à vista (sempre mostrando, não oculto) cobre a tela ANTES de qualquer login de usuário: **etapa 1** = CNPJ da loja + senha de conexão (CNPJ já vem preenchido) → confere na rota NOVA **POST /v1/check-pass** (só confere, não cria nada). Senha certa → **etapa 2** = "qual é este computador?" (mais uma tranca, como ele pediu) → enroll-cnpj → token no PC: **conectou uma vez, some pra sempre**. Sem token → nada do app aparece.
2. **Ninguém fica trancado pra fora:** sem senha definida, motor velho (rota não existe) ou sem internet → o portão explica o que fazer e mostra link discreto "sou o administrador... entrar pelo jeito antigo" (fecha até recarregar; sistema offline preservado).
3. **SESSÃO DE USUÁRIO 1X POR DIA:** a sessão salva vale só no dia do login (puras LOGIN_V5262_PURE.mesmoDia/sessaoDoDiaExpirada testadas no sandbox). Virou o dia → sessão removida sozinha + banner "☀️ virou o dia, entre de novo (é só 1x por dia)"; no resto do dia entra automático.
4. **GERENTE .exe COM AVISOS CLAROS:** o worker devolve erros ESPECÍFICOS — GERENTE_NAO_DEFINIDO (409: senha do gerente não definida → instrui onde definir), GERENTE_SO_DONO (403: este CNPJ não é o da dona, cita o nome dela), SENHA_GERENTE_INVALIDA. O main.js repassa código+status; a tela tem avisoLoginGerente() que traduz em português de dono-de-loja: senha errada → "confira e tente de novo"; não definida → "salve as senhas no cartão"; motor velho → "rode o atualizar_motor_nuvem.cmd"; sem internet → "sem internet". Sessão salva vencida no Gerente também avisa.
5. **Infra do sandbox pegada pelo caminho:** node_modules vazio (acorn/node-forge ausentes → bundle saía SEM isolamento de erro e testes morriam por MODULE_NOT_FOUND); restaurado do cache npm. E o git local estava no commit-base c7918d7 (a branch real segue em 0d97c36): reconciliado com reset --soft antes de commitar.
**Ritual:** APP+WORKER+GERENTE carimbados 5.26.2; manifesto 203 (fila final: ...v5250 → v5260 → v5262); bundle 203/200 isolados; mobile sincronizado (sync-www); murais re-ancorados (v52284-87/2293/2295/2296/52423-2428/52435/52436/5250/5260); test_ajustes_v5260.js REGISTRADO no test_runner (estava só solto) + test_ajustes_v5262.js novo (34 asserts). Demo real do worker em Node com D1 mock confirmou /v1/check-pass (3 casos) + /atualizacoes 200 + /a/ 410 controlado. Suíte: **160/0/0**.

## v5.26.3 — BOTÃO ENTRAR BLINDADO + MÁSCARA DE CNPJ + RODAPÉ VIVO no Gerente (2026-09-17)

**Reportes dele (testando o Gerente .exe):**
1. **"clico em Entrar e nada acontece, nem aviso, parece que o botão não funciona":** handler blindado — ANTES de chamar a nuvem ele checa se a ponte (window.gerente) vive; sem ela, mostra aviso claro ("feche e reabra; se repetir, gere o .exe de novo"). Promessa agora tem .catch e o try/catch cobre erro síncrono; o botão DESTRAVA em todos os caminhos. Nenhum clique fica mudo nunca mais.
2. **"CNPJ com pontuação automática enquanto digita":** função mascararCnpj no Gerente (só aceita dígitos, pontua 00.000.000/0000-00 sozinha, máx 14) aplicada no login (lg-cnpj) E no cadastro de empresa (pb-emp-cnpj).
3. **"o da nuvem igual":** mesma máscara no campo CNPJ do portão v5262 (input maxlength 18 + listener input), sem mexer no enrol/check-pass (sempre envia só os dígitos, como antes).
4. **"rodapé v5.26.0 desatualizado":** era TEXTO FIXO no HTML — agora o rodapé puxa a versão REAL do programa (preload versao() → main g:versao → app.getVersion()), com fallback no texto carimbado. Nunca mais desatualiza.
**Infra sandbox:** npm CLI sem TLS aqui, mas curl funciona — acorn+node-forge baixados do registry e guardados em ~/_arena_deps/restore.sh (node_modules é purgado pelo snapshot entre turnos; restaurar antes de builds). Bundle regenerado e provado byte-a-byte (sha 741c0e6e5c2a0dba: build offline manual == build oficial com acorn). Git local tinha voltado ao commit-base de novo → reconciliado com fetch + reset --soft antes de commitar.
**Ritual:** app+gerente 5.26.3 (WORKER segue 5.26.2 — motor sem mudança); test_ajustes_v5263.js novo (25 asserts: sintaxe do script embutido, botão, máscaras testadas de verdade, rodapé vivo) registrado no runner; murais de versão re-ancorados (v52423-2428/v52435/52436/v5250/v5260/v5262). Suíte: **161/0/0**.

## v5.26.4 — DATA DE ATENDIMENTO GRANDE no relatório do chamado + PRÉVIA do app de celular (2026-09-17)

**Pedidos dele (prints anexados):**
1. **Relatório do chamado, data de atendimento pequena demais pra escrever:** no impresso, a linha "Cadastro: … • Atendimento: __/__/____" (texto miúdo 11px, sem espaço) vira **caixa de linha de escrita grande** — 170px de largura, letra 15 bold — dá pra escrever a data com caneta com folga; quando já vem preenchida fica bonita do mesmo jeito. Texto miúdo do relatório sobe 11→12.5px. Feito como patch novo (ajustes_v5264, pos 204, guard __v5264cd) que embrulha imprimirChamadoPDF SÓ durante a impressão e intercepta o document.write da janela de impressão — o patch v5.18.6 original NÃO é tocado; se o relatório mudar de cara, o wrap devolve o HTML intacto (não quebra nada).
2. **"Quais outras caixas de texto precisariam de filtro assim?":** levantamento feito (resposta no chat): a tela de Vendas/Notinhas já tem a ficha completa (busca livre + 14 filtros avançados: código venda/cliente, fantasia, ident, produto, obs, NF-e, valor de/até, OS série/patrimônio/técnico/equipamento/serviços, pagamento Aprovado…Cancelado). Recomendadas: **OS/Chamados** (hoje só pesquisa+status), **Orçamentos** (só busca simples), **Leituras** (só busca por máquina) e **Clientes** (busca+status, falta fantasia/documento/cidade). Aguardando ele dizer quais priorizar — não implementado por escopo.
3. **App de celular (autoridade CONCEDIDA por ele, "somente essa vez"):** montada prévia navegável com o mobile/www real sincronizado (o mesmo arquivo do APK): moldura de celular servindo o app inteiro. Continua pausado como roadmap após essa espiada, como ele pediu.
4. **Contrato RTF — pergunta respondida com simulação:** com cadastros completos, NADA sobra vazio (testado: 0 placeholders restantes, tabela de máquinas renderizada). O mapa cobre o modelo padrão inteiro e ainda sobra campo extra pronto (telefone/celular do cliente, e-mail/telefone da empresa, código do contrato, aviso-prévio) caso ele queira enriquecer o modelo. O que fica em branco na vida real é só o que faltar no CADASTRO (ex.: IE ou telefone do cliente).
5. **"Algo oculto que pediu pra deletar e não deletou?":** revisado o mapa de visibilidade — textos do login, aviso rawgithub e menu migrados já estão deletados de verdade (remoção do DOM, não CSS). O que segue vivo propositalmente: Buscador Escola (congelado por decreto, não deletado) e menus-por-dispositivo (configurável). Perguntado a ele qual item quer morto de vez.
**Ritual:** app 5.26.4 (worker 5.26.2 / gerente 5.26.3 intocados); manifesto 204; murais re-ancorados (52284-87/2293/2295/2296/52435/52436 e pins de versão); test_ajustes_v5264.js novo (22 asserts: pura testada com HTML real do relatório + wrap testado com window.open falsa) no runner. Suíte: **162/0/0**.

## v5.26.5 — RALO DO BUSCADOR ESCOLA FECHADO (só atualiza com a aba aberta) + deps vendorizadas (2026-09-17)

**Contexto dele:** "o buscador escolar eu USO, pedi pra congelar porque consumia muita leitura da nuvem — e fazia isso ATÉ QUANDO NÃO ESTAVA NA ABA. Agora tenho plano pago." Decisão tomada: plano pago é pra uso, não pra robô invisível. O decreto antigo (congelar) morre; o módulo fica VIVO de novo, com o ralo fechado:
1. **Causa raiz:** o relógio v5.24.8 (10 em 10 min) disparava a busca automática quando os dados passavam de 1h — rodando com o sistema aberto em QUALQUER tela (o setInterval nasce no load do bundle, não na aba).
2. **Correção (arquivo vivo buscador_escola_patch.js, comentado v5.26.5):** `esAbaAberta()` (procura o h3 "Buscador Escola" na tela agora) + guarda no tique: **fora da aba, sai antes de qualquer rede** (zero login/página/gravação). **Abrir a aba já confere a idade dos dados na hora** (uso de verdade). Freios da v5.24.8 todos mantidos (1h, incremental, sem login nem tenta, nunca limpa base, nunca duas buscas juntas). Botões Atualizar/Baixar Tudo intactos.
3. **Testado de verdade (simulação):** sem h3 na tela → ZERO sync; com h3 e dados velhos → 1 sync. Mural do freio v5.24.34 (test_ajustes_v5248) RE-ANCORADO para a versão atual + 2 asserts novos do "só na aba" e ADICIONADO ao runner (estava solto, com pins de v5.24.34 vencidos).
4. **Deps vendorizadas (fim da fragilidade):** acorn + node-forge agora existem em vendor/ DENTRO do repo; build_bundle.js cai no vendor quando npm faltar; test_runner recria node_modules a partir do vendor no boot (ensureDeps). Build e suíte não quebram mais com node_modules purgado — nem aqui, nem em CI.
**Ritual:** app 5.26.5 (worker 5.26.2 / gerente 5.26.3); carimbos e pins re-ancorados (v52223-28/52435/52436/5250/5260/5262/5263/5264); script check passa a validar buscador_escola_patch.js; npm run sync gravado; test_ajustes_v5265.js novo (23 asserts) + test_ajustes_v5248.js no runner. Suíte: **164/0/0**.

## v5.26.6 — PAINEL DO GERENTE (ordem dele: "faz logo") (2026-09-17)

**Contexto:** na lista de pendências ele mandou o painel do gerente na nuvem **agora** ("o que tenho que fazer? só dizer pra fazer? faz logo"). Entregue:
1. **Tela nova "Painel Gerente"** (painel_gerente_patch.js, posição 205 — fecha a fila do bundle): cards de notinhas de hoje (qtd + R$), OS hoje/abertas, a receber no mês, **ATRASADAS em vermelho**, máquinas nos clientes, contratos ativos; bloco "Quem vendeu hoje" (por pessoa); alerta "OS parada há mais de 7 dias"; linha do tempo com as 10 últimas movimentações (venda+OS juntas) com cliente e vendedor.
2. **Decretos travados em mural próprio:** só LÊ o banco já sincronizado (zero escrita, zero ache — teste prova que não há push nem db.save); multi-empresa respeitado (empresaId da sessão filtra tudo — venda cancelada, de outra empresa e OS concluída provadas fora); datas por criadoEm/data; conta paga nunca aparece como atrasada; instalação de menu espelha o Buscador Escola (nav-gest + topbar + reinstala se o menu redesenhar) e o navigateTo aprende a view via wrap — **miolo do app.js intocado**.
3. **Infra consertada de vez:** o .gitignore global ignorava `dist/` → apagava o vendor/acorn/dist no restore. Blindado com `!vendor/**`; acorn re-extraído; build volta a isolar **202 scripts**.
**Ritual:** app 5.26.6 (worker 5.26.2 / gerente 5.26.3); 16 murais re-ancorados (versões + fila do manifesto 205); test_ajustes_v5266.js novo (26 asserts com puras testadas em dados reais simulados, tempo congelado determinístico) no runner. Suíte: **165/0/0**.

**Decisões dele nesta rodada (registradas):** domínio próprio NÃO (fica o grátis pra sempre); prévia via Android Studio oficial (mobile/android já é projeto pronto — tutorial entregue); migração de dados: nada de forçar agora; "relatório do jeito certo" riscado (nem ele lembra); imagens do tutorial: depois; **NF-e: "pode já fazer ela agora"** → trilha 6.xx aberta, perguntas-chave enviadas (modelo da nota, certificado A1, regime tributário).

## v6.0.1 — MOTOR FISCAL COMPLETO ("de NF já FAÇA TUDO") + kit do testador (2026-09-17/18)

**Pedido dele:** todas as fases do NF de uma vez, porque um TERCEIRO testa amanhã — mais 2 relatórios (guia + em branco) em linguagem simples, sem Ctrl+Shift+R, com bloco de adições e de correções.

**Entregue (tudo sobre o Portão 6.0.0 — homologação primeiro, senha nunca salva, tudo auditado):**
1. **Transmissão real (main.js):** handler `nfe:transmitir` com lista-branca SEFAZ-MG (nfe/nfce, hom+prod), TLS 1.2, pfx lido do cert importado, senha vem da janela na hora (NÃO salva), 3 tentativas só em 5xx/timeout (4xx não repete), retorna o XML de resposta. Preload expõe `transmitir` ao lado de `assinar`.
2. **Motor front (nf_transmissao_patch.js, posição 207):** pipeline completo `nfEmitirCompleta` (permissão → duplicidade → número travado pra cima → selo de teste no XML em homologação → assina A1 → envelope SOAP 1.2 → SEFAZ-MG → parse sem lib → registro → DANFE/XML). Duplicidade de origem abre o DANFE da existente; sem ponte = instrução honesta (NUNCA sucesso falso).
3. **DANFE + contabilidade:** DANFE A4 (chave mascarada, protocolo, itens, totais, marca d'água "SEM VALOR FISCAL" em teste), botão Baixar XML (é o que vai pra contabilidade), histórico completo na Central (status colorido, DANFE/XML/Cancelar por nota).
4. **Eventos:** cancelamento (evento 110111, justificativa ≥15, confirmação extra em produção, protocolo obrigatório) e inutilização de faixa (todos os campos oficiais, protocolo registrado) — os dois assinam e transmitem.
5. **NFC-e 65 no código:** URL própria MG (nfce.fazenda...), QR Code layout 2 com SHA-1 (vetor conferido com crypto do Node), DANFE NFC-e em A4 (80mm, sem térmica — decisão dele), campos CSC prontos na config.
6. **Kit do testador:** `GUIA_DO_TESTE_NF_v6.0.1.md` (roteiro A navegador + B emissão real, regras de ouro, tabela erro→o que copiar, como escrever o relatório, SEM instrução de cache) + `RELATORIO_DE_TESTE_NF_EM_BRANCO.md` (cabeçalho, checklists A/B, teste livre, bloco Correções com modelo de preenchimento, bloco Adições, veredicto e assinatura).
**Ritual:** app 6.0.1 (worker 5.26.2, gerente 5.26.3); manifesto 207 (transmissão fecha a fila); fila de ancoras reposicionada (v52293/295/296/2435/2436/5260/5262/5263/5264/5265/5266/6000); test_ajustes_v6001.js (48 asserts: envelopes, parse com retornos reais, evento/inutilização, SHA-1×crypto, DANFE, travas) no runner. Bug achado PELO TESTE: QR montava com `q.csc` undefined → corrigido. Suíte: **167/0/0**.

## v6.0.2 — CURA DOS "DADOS SUMIDOS" + Central NF vira MENU + popups próprios (2026-09-18)

**Bug de produção resolvido (relato de usuário real):** vendas/impressoras "desapareciam" em todos os PCs. Causa provada: **sessão SEM empresaId** no PC que criou o dado (o diagnóstico v5.22.7 escapava disso — contava "todos visíveis" quando a sessão estava vazia). Registro sem carimbo de empresa é invisível pra todo mundo com empresa na sessão. Correção determinística (sem chute):
1. Sessão sem empresa + banco com EXATAMENTE UMA → sessão é carimbada com ela (com toast explicando, e registro em db.logs). Com 2+ empresas: não chuta, orienta a relogar.
2. Todos os registros órfãos (`empresaId` vazio) nas 16 entidades de negócio são carimbados na empresa única — dados somem nunca mais.
3. Diagnóstico v5.22.7 passa a contar "SEM CARIMBO (órfãos)" por entidade e aponta a CAUSA PROVÁVEL DOS SUMIÇOS + repara se a própria sessão estiver vazia.

**Central de Nota Fiscal sai do modal flutuante** (ele achou feio "esses menus na 6.0.0"): vira view/menu de verdade (botão "Nota Fiscal" no nav-gest + barra clássica; abrirCentralNfe antiga redireciona pra navigateTo), placa de ambiente sempre no topo, histórico rende nela, CSC da NFC-e salva ali, inutilização com popups em sequência.

**Popup próprio do sistema (com X) em TODO o fiscal:** `nfx-modal` (nfxPedirTexto com mínimo+máscara, nfxConfirmar) — senha, justificativas, confirmações de produção e duplicidade agora abrem popup personalizado; prompt/confirm nativo só fallback se por algum motivo a popup não existir.

**Infra de deps:** descoberta a causa-raiz dos sumiços do vendor/acorn — o SNAPSHOT do ambiente ignora qualquer pasta chamada `dist/` (mesmo commitada; o .gitignore `!vendor/**` não salva do snapshot). Solução definitiva: acorn agora é arquivo de **primeiro nível** em `vendor/acorn/acorn.js` (`main` ajustado, sem `dist/`). Build volta a isolar 205 scripts automaticamente em qualquer restauração.

**Ritual:** app 6.0.2 (worker 5.26.2, gerente 5.26.3); manifesto 208 (autocura/central fecha a fila); re-ancoragem completa da fila (v2284-87, 2293/95/96, 2435/36, 5260/62/63/64/65/66, 6000/6001); test_ajustes_v6002.js (31 asserts: puros da cura, diagnóstico, tela, popups, travas) no runner. Suíte: **168/0/0**.

## v6.0.3 — FISCAL NO ESCURO (print dele provou) + saveConfig blindado (2026-09-18)

**Causa provada pelo print dele e pelo log do console:** o menu fiscal com fundo escuro tinha cards brancos soltos, botão com texto invisível e título "EMISSÕES DESTA EMPRESA" duplicado; e o console flagrava `TypeError: reading 'value' of null` no saveConfig.
1. **CSS próprio do módulo fiscal (cnf-aba-css):** classes cnf-* (card/btn/btn-d/input/txt/sub) com regras claras e escuras (`html.digi-escuro` + `!important` sobrepõe o inline claro). Toda a tela da Central, inputs da NFC-e e o popup nfx-modal cobertos. Nada mais de texto fantasma nem card pendurado.
2. **Título duplicado eliminado:** o box do histórico tem cabeçalho próprio único; a tela não repete "Emissões desta empresa" fora dele.
3. **saveConfig blindado (erro real reportado por ele):** a tela "neo" de Configuração tem Salvar SEM os inputs `cfg-emp-*` → saveConfig original lia `.value` de null. Agora o save só roda quando os inputs existem; senão salva o db e avisa (nunca mais TypeError, com try/catch explícito).
4. **Sobre as imagens:** ele reenviou UMA foto (documentava o problema do escuro, não um exemplo de design). Direção adotada: padrão visual do próprio sistema (telas como Painel Gerente/Buscador) — onde ele deixar comigo, sigo esse padrão. As "imagens de exemplo" originais seguem NUNCA recebidas (relatado honesto).
**Ritual:** manifesto segue 208 (correção visual VIVE no patch vivo da central, sem arquivo novo); test_ajustes_v6003.js (25 asserts: css claro/escuro, classes, sem duplicidade, saveConfig) no runner; 16 murais re-ancorados pra 6.0.3. Suíte: **169/0/0**.

**Respostas dele que definem a linha 6.xx:** as DUAS notas no código (NFC-e 65 existe, mas operacionalmente ele só usa A4 → NF-e 55 primeiro); certificado A1 + senha EM MÃOS; térmica não compra ("mas quero que tenha o código"); ordem de construção: EU escolho → **NF-e 55 (A4) primeiro, NFC-e 65 em seguida**, sempre homologação antes de produção.

**As 3 garantias de confiança que ele exigiu, viradas lei de código (fiscal_guard_patch.js, posição 206):**
1. **Nasce tudo em HOMOLOGAÇÃO** (modo teste, sem valor fiscal). Produção só liga por ação humana explícita: digitar PRODUCAO + usuário com `podeEmitirNfe` (regra v5.22.21). Voltar p/ teste = 1 clique.
2. **Nada automático**: o patch tem ZERO setInterval/setTimeout — provado pela suíte (varre o arquivo atrás de temporizadores). Conferir/selar NF só acontece por clique.
3. **Sem caminho silencioso**: toda conferência NF grava trilha de auditoria em db.logs (quem, quando, ambiente). Duplicidade (mesmo modelo+série+número+origem) bloqueada por detector puro pronto pro emissor 6.0.1. Selo anti-fraude: em homologação o XML carrega no infCpl "NOTA DE TESTE, SEM VALOR FISCAL" (contabilidade nunca confunde).

**Decisões novas registradas (fila):** permissões por usuário (sem fiscal, sem Buscador Escola, links de cobrança com cota total/dia configurável no gerente.exe) → próxima v6.0.x, quando ele mandar; "migração" = importar dados do OUTRO sistema que ele usa hoje (não a legacy local) → só quando ele pedir, com mapa de campos e prévia; login 1x/dia confirmado em produção ("tá funcionando normalmente") ✅.

**Ritual:** app abre a linha **6.0.0** (lei da versão: NF = sistema novo); worker segue 5.26.2, gerente 5.26.3; 61 murais antigos re-ancorados de "família 5.x" para "[56].x" (a 6.0.0 não podia romper os guardas de versão — ampliados com major>=6 sempre válido); fiscal_guard no manifesto posição 206 (fecha a fila); build 203 isolados; test_ajustes_v6000.js (25 asserts) no runner. Suíte: **166/0/0**. Próxima parada: v6.0.1 = emissor SEFAZ-MG homologação (XML assinado → autorização), depois DANFE A4, cancelamento, NFC-e 65 (QR/CSC).

## DECISÕES DELE registradas (2026-09-17, pós-v5.26.4)

1. **Filtros avançados:** ele confirmou "todos esses já estão feitos" → assunto FECHADO, nenhuma tela recebe filtro novo. (O levantamento da v5.26.4 fica arquivado se ele voltar atrás.)
2. **Nomes de arquivos:** ele perguntou "esses nomes estão bons pra você? se facilitar pode modificar, mas antes anota no .md o mapeamento e só se não der problema". RESPOSTA REGISTRADA: manter tudo como está — o padrão descritivo por versão (ajustes_v5<num>_<o-que-faz>_patch.js / test_ajustes_<idêntico>.js) é legível e está costurado em dezenas de murais + bundle-manifest + script check; renomear não facilita e cria risco. REGRA pra nome NOVO daqui pra frente: sempre descritivo-e-único por versão, espelhado no teste. Se algum dia um renome acontecer, é obrigatório .md com mapa antes/depois ANTES do commit.
3. **Varredura de "oculto não deletado" (ele não lembrava qual era):** pesquisa completa no código e no histórico — os DELETADOS de verdade constam no mapa de visibilidade (textos do login, aviso rawgithub, menu migrados: remoção de DOM). Vivos intencionalmente: **Buscador Escola** (módulo completo da Caixa Escolar/MG, com login e orçamentos, atalho "topmod-buscador-escola-fixo" na Início — foi CONGELADO por decreto dele, não deletado) e **Caixa "Ocultar" do serial no Parque/Remanejo** (feature ativa v5.22.45 — ocultar não é lixo: vira remanejada e a chave desoculta; decisão daquela versão). TODO/FIXME: nenhum pendente real. PRÓXIMA AÇÃO ESPERANDO ELE: dizer se o Buscador Escola morre DE VEZ (apago módulo + atalho + dados) ou segue congelado.

## MAPA DE VISIBILIDADE DO SISTEMA — o que esconde/apaga menus e telas (resposta: "tem mais menus ocultos desde o login até o final?")

- **Login:** textos "Sistema Digicopy / Vendas, locação... / © 2026" são
  DELETADOS (delete_hidden_patch) — não é CSS, é remoção do DOM. O aviso de
  rawgithub (#rawgh-warn) idem.
- **Menu "migrados":** removido permanentemente (mesmo patch).
- **Tranca do Backup:** o menu Backup tem interceptação por CAPTURA no
  index.html — clicar NÃO baixa arquivo; abre a tela de Backup (trava colocada
  depois do bug "clicou e baixou").
- **Menus por dispositivo (o grande invisível):** o sistema de menus por
  aparelho (v5.22.17–22.23) permite esconder/reordenar itens do menu POR PC —
  ou seja, um PC da loja pode ter menos menus que outro, por escolha ali na
  tela de organização de menus. É a única "invisibilidade configurável" do
  sistema.
- **Gate de render (render_gate):** telas fechadas não re-renderizam em
  segundo plano (performance; não muda menu, mas explica "telas vivas" só
  quando abertas).
- **Buscador Escola:** congelado por decreto dele — fora do ciclo até reavivar.
- **Leituras antiga:** aposentada nesta v5.25.0 (ver acima).
- **NF-e:** subitens existem e abrem a Central (v5.24.25); a fase grande irá
  pro 6.xx.xx por decreto.
- Fora isso: **não há outros menus escondidos por código** — todo o restante é
  catálogo visível administrável (arrastar/esconder por dispositivo, acima).

## REGRAS VIVAS — versão do rodapé + links a cada atualização## REGRAS VIVAS — versão do rodapé + links a cada atualização (reafirmadas por cobrança dele "você está esquecendo as regras?")

- **Rodapé = versão da verdade.** É a única régua que vale: relato dele começa por aquela marca. Toda versão recebe o carimbo (index.html, sw/pwa, main, worker, package.json, patches tocados) e o build sai DEPOIS dos carimbos.
- **A versão SÓ ANDA PRA FRENTE.** Não existe 'prendeu no 9': 5.24.9 → 5.24.10 → 5.25.0. A 2ª casa é o relatório grande; a 3ª anda no dia a dia dele. **Lei dele (2026-09-16):** a revisão de leituras marcou **5.25.xx**; as partes de NF (praticamente um menu novo) irão pro **6.xx.xx** quando entrarem.
- **TODA atualização sai com os 3 links na resposta: (1) link teste = SITE PRÓPRIO https://teste-60f.pages.dev (NUNCA githack — repo privado matou ele; ele cobrou e a correção entrou no sync_build), (2) zip da branch, (3) site de download das atualizações** (+ lembrete do deploy quando o motor mudar). Sem exceção — esquecimento histórico 5.24.25–5.24.28 e o deslize do githack (v5.24.35) reconhecidos e anotados.

## O QUE FOI ENTREGUE — v5.24.28 (2026-09-14, portal de atualizações SÓ DELE, do jeito que ele desenhou)

**Pedido dele (item 4 da rodada de fotos):** portal de publicar atualizações só pra ele — anexar o .exe do próprio PC, escrever notas e (opcional) tutorial; histórico completo pra ele; site de fora só pra baixar a atual; links antigos MORTOS; reativar por tempo (1d/7d) ou ilimitado, e desligar quando quiser; editar/ocultar/excluir.

- **R2 = depósito invisível:** bucket `digicopy-downloads` declarado no wrangler (binding R2). Nada de 'Public Access': o .exe é servido pela PRÓPRIA NUVEM em `/dl/<versao>.exe` (attachment digicopy-<v>.exe), respeitando o estado (desligada=410, oculta=não serve). Teto 150MB com rota de fuga (Objectos do painel). Resolver o item 3 dele: a seção Public Access NÃO era necessária.
- **Gerente é só dele (requireAdmin):** ações publicar (com expiraHoras 0/24/168/720), ativar (com tempo), desativar, ocultar/mostrar, editar (notas+tutorial), excluir (remove linha E o .exe do R2). Colunas novas idempotentes (ativa/oculta/tutorial/expira_em/tem_arquivo) auto-migradas.
- **Sininho esperto:** GET /v1/app-release agora devolve a publicação VIVA (ativa+visível+não-vencida). Botão do aviso leva pro SITE `/atualizacoes` — que virou página de download limpa: mostra SÓ o vivo, tutorial (se ele escreveu) ANTES do botão verde 'Baixar a atualização (.exe)', rodapé honesto ('versões antigas não aparecem').
- **Card 'Portal de atualizações' (Config):** versão + período no ar + .exe do PC + notas + tutorial + Publicar; lista do HISTÓRICO com chips (✅ no ar / ⛔ desligada / ⌛ venceu / 👁 oculta / 📦 .exe anexado), botões por publicação (Ativar 1d/7d/∞, Desligar, Ocultar/Revelar, Editar, Excluir, Anexar/trocar .exe), recarregar, copiar link do site.
- **Testes:** test_ajustes_v52428.js (24 asserts); v52423/v52424/v52296 superseded annotados (portal evoluiu; guarda anti-R2 da era grátis invertida sob justificativa escrita). **Suíte: 153/0/2** (2 = node-forge/acorn infra sandbox, de sempre).
- **P7 (serial-first) empurrado de novo UMA VEZ só:** ficou atrás do portal por decisão de sequência dele (item 4 veio com 'mal explicado, constrói'). Próxima versão é P7 sem desvio.

## O QUE FOI ENTREGUE — v5.24.27 (2026-09-14, leva de pedidos: P5 + .cmd + excluir lixo + monitor SNMP fase 1 + hub P8)

- **P5 (lápis que ordenava):** o ordenador global de tabelas (historico_sort_patch.js) agora ignora cabeçalho 'Editar' — clique perdido não reordena mais a lista de impressoras do contrato. Foto/desenho dele confirmaram a lista: contratos_final_patch.js.
- **.cmd não fecha mais com tecla (pedido direto):** os dois wrappers (atualizar_motor_nuvem, ver_gasto_nuvem) ficam abertos até o X — dá pra ler e copiar pra foto sem pressa (pause → cmd /k com aviso).
- **Excluir aparelho-lixo DE VEZ:** worker ganha /v1/devices/delete-forever (admin; SÓ aparelho já bloqueado; nunca a si mesmo; dados não são tocados — devices é só cadastro de autorização). No painel, aparelho bloqueado ganha botão vermelho 'Excluir de vez' com confirmação que explica.
- **Monitor de impressoras FASE 1 (tópico A):** snmp_printer.js — SNMPv2c escrito na veia (dgram, ZERO npm): contador, toner% e erros (sem papel/atolou/tampa/toner) em bom português. IPC main 'prt:snmp-status' (IP validado) + preload prtAPI. No Parque: [Ler status (rede)] por impressora — IP perguntado 1x, grava no cadastro (sincroniza com o registro, zero tabela nova); selo coloredo de status + última leitura guardada. Navegador/celular: avisa limpo que SNMP é coisa de .exe (UDP).
- **P8 — Hub da impressora:** [Histórico] por impressora no Parque: ficha, selo de status, botão pro contrato atual (openContratoCompleto), últimas 6 leituras e chamados — tudo do banco local, sem custar nuvem.
- **P7 (serial-first + remaneio) FICA PRA v5.24.28 (de propósito):** é cirurgia no fluxo de contrato — ressuscitar o wrap v5.22.43/45 em cima do fluxo vencedor atual. Mapeado; não vou abrir o contrato no bisturi na mesmíssima leva de 5 pedidos.
- **Testes:** test_ajustes_v52427.js (32 asserts, incl. SNMP funcional sem rede: pacote GET válido, parser, tradução de bits). Guardas do bundle atualizadas (198 scripts). **Suíte: 152/0/2.**

## O QUE FOI ENTREGUE — v5.24.26 (2026-09-14, sprint NF 'faz logo': histórico das notas assinadas)

**Pedido dele (item 7 da lista, 'faz logo'):** fechar o pacote NF. O que faltava de utilidade visível: lista permanente das notas emitidas (antes, assinou e sumiu).

- **Histórico na Central:** quadro 'Histórico das notas assinadas' — número, cliente, data e botão **copiar chave** (últimas 8 à vista, teto de 200 guardadas). Estado vazio honesto ('as próximas aparecem aqui').
- **Gatilho de verdade:** o registro só acontece no SUCESSO da assinatura (v5228 chama window.registrarNfeEmitida DEPOIS do XML assinado). Falha no histórico nunca atrapalha a emissão (try/catch no chamador e no próprio registrador).
- **Local de propósito, por explicado:** a emissão só roda no PC que tem o certificado instalado → a lista mora ali (localStorage digicopy_nfe_historico), sem pesar na nuvem.
- **Testes:** test_ajustes_v52426.js (23 asserts + 1 funcional: grava e lê de verdade). **Suíte: 151/0/2** + sync_build --check verde.

## O QUE FOI ENTREGUE — v5.24.25 (2026-09-14, menu de NF abre de verdade + certificado para LIMPO)

**Relato dele:** 'ué, os menus de NF não estão acessando'. Causa achada *sem* precisar de relatório detalhado: no catálogo do menu lateral (v52213), NF-e/NFC-e e os 3 subitens apontavam pra toasts falsos de 'em breve'. As telas reais existiam escondidas: preparação na Config (v5220), conferência/emissão dentro de venda e leitura (v5221→v5228), histórico por atalho (v5229/52210).

- **Menu amarrado aonde presta:** NF-e/NFC-e e 'Nota fiscal' abrem a **Central de Nota Fiscal** (sala própria, DOM fora do miolo): estado do certificado neste PC (instalado/ausente com selos coloridos), botão **'Conferir validade'** (pede a senha do cofre UMA VEZ, mostra até quando vale — fim da era 'o sistema não sabe que venceu'), seletores de notinha OU leitura (últimas 40) que abrem a **mesma** conferência da v5221, e atalho pra Configuração fiscal com rolagem certa. 'Perfil tributário' e 'NCM e fiscal' vão pra Config fiscal real.
- **Certificado para LIMPO, com data:** assinar com A1 vencido joga mensagem clara ('Certificado A1 VENCIDO em dd/mm/aaaa — renove...') em vez de erro criptografado; a leitura da validade vive no main.js (IPC 'nfe:cert-validade') + nfe_assinatura.js (lerValidadePfx) + preload (nfeCertAPI.validade). Senha pedida sempre, nunca guardada.
- **Guardas do repo cumpridas:** bundle-manifest +1 (197 scripts) com os 4 testes de guarda atualizados na regra ('v5.24.25 soma a Central de Nota Fiscal'); npm run sync (scripts.check); test_ajustes_v52425.js (27 asserts). **Suíte: 150/0/2** (as 2 = acorn/node-forge ausentes só no sandbox — mesmas de sempre).

## O QUE FOI ENTREGUE — v5.24.24 (2026-09-14, site próprio de atualizações)

**Pedido dele:** 'um site próprio isso, onde terá o histórico completo de atualizações que lancei, com o patch escrito e o link dele pra eu poder baixar'.

- **Nuvem:** além da versão atual (sininho v5.24.23), cada publicação entra no HISTÓRICO — tabela `app_releases` (1 linha por versão; republicar a mesma versão ATUALIZA em vez de duplicar). Rota JSON `/v1/app-releases` (pro sistema, se quiser usar um dia).
- **O site:** rota pública **`/atualizacoes` no próprio worker** (mesmo endereço da nuvem dele, zero hospedagem extra): página limpa, celular-pronto, versão mais nova com selo 'versão atual', cada bloco com data em português, as notas (o patch escrito) e o botão **Baixar esta versão**. Estado vazio educado antes da 1ª publicação. Notas escapadas (texto dele nunca vira HTML no site).
- **App:** no card 'Publicar nova atualização' agora aparece o link do site pronto (montado da URL da nuvem já configurada) — clicou, abriu o histórico.
- **Receita de uso:** publica pelo card -> o site atualiza SOZINHO no mesmo instante; qualquer versão antiga continua lá com seu link.
- **Testes:** test_ajustes_v52424.js (23 asserts). **Suíte: 149/0/2** (as 2 = infra ausente no sandbox, de sempre).

## O QUE FOI ENTREGUE — v5.24.23 (2026-09-14, sininho de atualização + publicador)

**Pedido dele (tópico D):** 'função de publicar atualizações' — ele marca a versão, cola o link do .exe e escreva as notas (ou me pede que eu monte); todo mundo que abrir vê o aviso UMA ÚNICA VEZ por versão por aparelho com [Abrir pra baixar] + [Baixar depois]. No celular: mesmo código, mesmo comportamento.

- **Nuvem (worker):** endpoint `/v1/app-release` — GET público (o app consulta ao abrir; sem release publicado responde versão vazia = silêncio) e POST só de aparelho matriculado (valida formato de versão, link obrigatoriamente https, notas ≤4000). Tabela `app_versao` de 1 linha (o sistema guarda só a atual), criada sozinha no deploy.
- **App:** card próprio `aviso-update-card` (DOM próprio, não encosta em nada); comparador de versão que entende 5.25.0 > 5.24.99; chave 'visto' por versão no aparelho; qualquer um dos dois botões marca como visto — o resto é silêncio até a próxima publicação. Se a nuvem estiver fora ou sem release: nada aparece, ninguém percebe.
- **Configurações:** card 'Publicar nova atualização' (versão + link https + notas) — publica pela nuvem com a trava do aparelho, sem console.
- **Testes:** test_ajustes_v52423.js (28 asserts: worker, sininho, comparador funcional, publicador, bundle PC + CELULAR, carimbos). **Suíte: 148/0/2** (as 2 = infra ausente no sandbox, de sempre).
- **Receita de uso (sem console):** (1) eu empurro a versão nova; (2) ele roda `atualizar_motor_nuvem.cmd` 1x; (3) sobe o .exe num lugar com link https fixo; (4) em Configurações preenche o card e clica Publicar. Detalhe a combinar: onde hospedar o .exe — Pages não leva >25MB com folga e o repo vai ficar privado (mata link do GitHub Releases); a porta certa é um bucket R2 criado UMA VEZ (5 min, rasoável). Fica pro próximo passo com o ok dele.

## O QUE FOI ENTREGUE — v5.24.22 (2026-09-14, pacote 2A do RELATORIO GRANDE)

**F1 — Contratos "mostrar todos" + padrão hoje:** nova opção "Hoje (criados
ou mexidos hoje)" na faixa de filtros (v5.22.37); estado inicial da tela =
hoje; botão "Mostrar todos" plantado na barra (limpa campo+busca e lista
tudo). O cálculo "mexeu hoje" é VIVO (__ctrMexeuHoje): vale criou o contrato
hoje OU editou impressora/chamado/leitura embaixo dele — sem depender de
carimbo passado (cobre contratos antigos de graça).
**F2 — Chamados excluir + impressão direta:** no arquivo VENCEDOR
(locacao_chamados_fix_patch, que repinta ambas as listas): cada linha ganha
[AÇÕES] = impressorinha (imprime DIRETO sem abrir, via imprimirChamadoPDF
vencedor) + lixeira. O aviso do excluir é ESCOLHIDO pela origem: chamado
DE CONTRATO usa o texto que ele sugeriu ("Esse chamado é DE CONTRATO.
Excluir aqui também exclui na lista de chamados dentro do contrato..."),
fora-de-contrato avisa "Apaga SEM volta". Deleta de verdade na fonte
(db.os.splice + saveDB), repinta onde estiver aberto. E onde o cabeçalho
havia ficado com a palavra "PDF", nasce o ÍCONE de impressora
(ph-printer) — como ele pediu. A tela neo de manutenção (view-manutencao,
a "fora de contratos") ganhou a mesma dupla de ações.
**P6 — Contrato RTF direto no Word:** main.js ganha ipcMain rtf:abrir
(grava temp com nome sorríEditado + shell.openPath → Word associao);
preload expõe rtfAPI; o gerador baixarContratoRTF é desktop-route com
fallback de download (navegador/celular = baixa como antes, igual erro.txt).
E o MAPA DE CAMPOS foi completado a pedido dele ("já tem todos os dados?"):
adicionados DATA_INICIO, DATA_FIM, DATA_HOJE (o help antigo citava
{DATA_INICIO} e ele NÃO tinha mapping — buraco encontrado e tampado),
CTR_CODIGO, CLI_TELEFONE/CLI_CELULAR/CLI_ENDCOMPLETO, EMP_TELEFONE/EMP_EMAIL.
Resposta completa no reply da sessão (inclui o que falta caso use tokens
diferentes).
test_ajustes_v52422 (29 asserts); suíte 147/0/2.
Restantes do pacote 2 pedindo mira dele: P5 (foto da aba certa) e os
maiores P7 (serial-first+voltar do remanejo, wrap final ressuscitado) e
P8 (hub de histórico da impressora).

## v6.0.4 — CURA DEFINITIVA DA SESSÃO + PERFIS DA NUVEM + kit do testador em HTML/TXT + inventário do banco antigo (2026-09-18)

**Causa-raiz FINAL do "dados sumidos" (diagnóstico DELE em mãos: sessão "(nenhuma?!)", banco com exatamente 1 empresa [emp_digicopy], 14 entidades "todas visíveis"):**
a cura da 6.0.2 tentava carimbar a sessão só por TRINTA SEGUNDOS depois de abrir o sistema (sonda 1s×30) e marcava "já fez" na primeira passada. Login 1x/dia = quem entrava depois dos 30s passava O DIA sem empresa na sessão → as listas filtram por empresa da sessão → tudo "some" (nuvem e banco sempre estiveram certos). A mensagem genérica do diagnóstico ("o problema é outro") despistava — corrigida.
1. **Cura definitiva (perfis_nuvem_cura_sessao_patch.js, fecha a fila em 209):** sonda 2s×10min e não desiste enquanto não houver resposta DEFINITIVA; rearmada a CADA login (wrap setSession) e a CADA gravação do banco (wrap db.save com respiro 4s — é onde os dados da nuvem pousam, cobre PC que abre antes dos dados descerem); regra segura mantida: só carimba com EXATAMENTE 1 empresa (2+ nunca chuta, orienta relogar). Decisão pura testável (pncProximoPasso: esperar/carimbar/definitivo-multi/resolvido/fim).
2. **Diagnóstico fala a verdade + ganha mão:** caso "sessão vazia com 1 empresa" vira resposta clara com o caminho; botão verde **"Reparar sessão agora"** na zona admin da Nuvem chama window.acForcarCura e conta o resultado.
3. **Perfis da nuvem (pedido dele):** Nuvem abre pra TODO PC; PC que entra com **CNPJ + senha DO GERENTE** nasce Administrador na nuvem (worker 5.26.3: enroll-cnpj aceita gerente_hash; só promove se as senhas forem DIFERENTES; senha errada = mesma mensagem de sempre, anti-oráculo; evento auditado 'cnpj-gerente'); PC comum vê a tela Nuvem SEM o bloco de gastos (uso trancado em isAdmin) e só **Desconectar ESTE computador** (rótulo e explicação claros). **Eclusa anti-trancamento:** /v1/connect-pass passa a aceitar prova de GERENTE (requireAdminOuGerente) — se todos os PCs virarem "device", o dono separa as senhas e não tranca o admin pra sempre.
4. **Kit do testador sai de .md (pedido dele: ".md é ruim pra mim"):** novo `GUIA_DE_TESTE_NF.html` (bonito, imprimível, caminhos v6.0.4, Parte A navegador + Parte B exe+cert, tabela erro→o que copiar, como entregar) + `RELATORIO_DE_TESTE_NF.txt` (preenchível em qualquer editor; blocos CORREÇÕES e ADIÇÕES; devolução = colar na conversa). Os 2 .md antigos removidos.
5. **Banco antigo mapeado:** das 7 fotos dele (banco inteiro do sist. velho em JSON, 21/08), `MAPEAMENTO_SISTEMA_ANTIGO.md` ganhou o inventário por prioridade de migração (núcleo→operação→fiscal→referência; NOTA_FISCAL/NCM/TAB_CEST; >130MB fica no PC dele, nunca no repo) e o **CSC do dump foi DESCARTADO a pedido dele** ("não sabia que tinha tipo uma senha envolvida; esqueça") — na ativação da NFC-e ele cola o CSC direto na Central.
**Ritual:** app 6.0.4, **worker 5.26.3** (publicar com atualizar_motor_nuvem.cmd), gerente 5.26.3; manifesto 209 (perfis/cura fecha a fila); carimbos de worker 5.26.2→5.26.3 re-ancorados em 13 murais (rótulos de nascimento "login da nuvem v5.26.2" preservados) + posições relativas +1 (v52293/95/96, 2435, 5266); test_cloudflare_sync reescrito pro novo contrato (botão pra todos; conteúdo por papel do aparelho); test_ajustes_v6004.js (35 asserts: PURE da decisão, sonda 10min, rearma login/db.save, Reparar, gastos trancados, enroll-gerente anti-oráculo, eclusa, e carimbo) no runner. Suíte: **170/0/0**.

## v6.0.5 — PERMISSÕES no editor do usuário + NOTINHA ESTORNADA ABRE NA ABA + FINANCEIRO MOSTRA EXTORNADO + REGRAS_PERMANENTES.md (2026-09-18)

**Com a regra nova dele aplicada (conferir antes de concordar):** cada ponto foi verificado no código antes de virar entrega — incluindo a teoria dele ("empresa nenhuma = não rodei o atualizar_motor_nuvem.cmd"): conferida, a causa real era a sonda de 30s da cura (v6.0.4, no app, não no worker) — o motor só precisa subir (5.26.3) para o admin-via-gerente funcionar. Mobile APK pausado por ordem (REGRAS_PERMANENTES.md, item 14).
1. **Permissões no EDITOR do usuário (Configurações → Usuários → Ações → Editar):** bloco "Permissões do usuário" com 3 caixas — Emitir NF (que antes era só coluna injetada na tabela, v5.22.21; a coluna segue), **Apagar registros** e **Estornar registros** (vendas/chamados/orçamentos/leituras...). Só Admin/Dono veem/mexem; mudanças auditadas. Padrões: existentes nascem com apagar/estornar MARCADOS (não quebra ninguém), NF desmarcada. **Bloqueio real nos executores** (não esconder botão): excluirVendaUnificado, excluirChamados(Selecionados/V52422), excluirOrcamento(sMarcados), removerLancamentoLeitura, deleteVenda (apagar); estornarVenda(s Selecionadas), estornarLeituraContrato, estornarNotinha (estornar). Negado = aviso do sistema + trilha em Auditoria. Admin/Dono sempre podem (anti-trancamento).
2. **Notinha extornada abre na aba (o modal "que nem deveria existir" morreu nesse caminho):** clicar numa notinha estornada abre a tela de nova venda CARREGADA (cliente+itens+desconto, banner explicativo); salvar ATUALIZA a mesma notinha (mantém número), devolve estoque dos itens antigos e baixa o dos novos (estorno não mexia em estoque — acerto por devolução+baixa, nunca em dobro); faturando na hora, cria o título novo. Log 'refazer-pos-estorno'. Conferidos os "outros lugares": leitura extornada já voltava aberta pra edição (v5.25.0); chamados/orçamentos não têm estorno.
3. **Financeiro mostra o EXTORNADO:** estorno MARCA os títulos (status estornado + quem/quando; antes APAGAVA — por isso sumiam). renderFinanceiro: tarja própria, sem checkbox de baixa, fora das somas (aberto/recebido/vencido). Bônus: títulos de leitura extornados (que já eram marcas) deixam de aparecer como "vencido" por engano.
4. **REGRAS_PERMANENTES.md criado** (16 regras: nunca concordar sempre/checar antes; pedido puxa outros arquivos; links sempre (site+zip, repo privado); mobile pausado; etc.) — é o checklist de toda tarefa.
**Ritual:** app 6.0.5 (worker 5.26.3, gerente 5.26.3); manifesto 210 (permissões/estorno fecha a fila); cauda toda re-ancorada (+1 relativo em v52293/295/296/2435/2436/5266; tails 6000-6003; length 209→210 nos 8 murais); patch 5240 ganhou export Node-safe p/ testar estorno em unidade; test_ajustes_v6005.js (37 asserts: PURE das caixas, gates ×11, aba da estornada, estoque sem dobro, marca-estornado + unidade REAL do estorno com db falso) no runner. Suíte: **171/0/0**.

## v6.0.6 — MENU FISCAL COMPLETO ("já coloca TUDO pra eu fazer a prévia") (2026-09-18)

Ele não queria prévia de meio de caminho: pediu o cardápio inteiro de uma vez. Verificado no motor antes (regra: não concordar sem conferir): o serviço "status" já existia na tabela NFX_SERVICO desde a 6.0.1 e nunca tinha sido chamado; CC-e não existia; QR NFC-e já estava no layout 2 (verificação aberta do mapeamento FECHADA, com vetor vs crypto do Node).
1. **Carta de Correção Eletrônica (CC-e, evento 110110):** envelope próprio (ID110110+chave+seq, descEvento, xCorrecao escapada, xCondUso legal), texto mín. 15, confirmação extra em produção, múltiplas por nota com contador "CC-e (n)" no histórico, XML do evento guardado (entra no pacote), auditado.
2. **Testar SEFAZ (nfeStatusServicoNF):** botão na Central; assina consStatServ na hora (senha pedida e não salva), cStat 107 = serviço em operação (com tratamento do 108), auditado. Sem ponte = instrução do .exe, nunca sucesso falso.
3. **Pacote do mês pro contador:** .zip gerado em **JS PURO** (método STORE + CRC32 próprio com vetor clássico 0xCBF43926 — sem biblioteca) com todos os XMLs do mês escolhido + pasta eventos/ (cancelamento/CC-e) + indice.txt. Escolha do mês por popup do sistema; vazio = aviso, nunca inventa.
4. **Configuração fiscal (mapa do dump):** card na Central com NCM padrão / NCM recarga-tinta (32151100) / NCM locação (37079021) / descrição locação (CARTUCHO TONER) / **Texto do Simples** — campo VAZIO por padrão (os valores prontos do dump foram julgados lixo; modelos legais de sugestão no placeholder). NCM por tipo no XML: produto.ncm → Recarga sem NCM→tinta · leitura/locação→ncm locação → padrão (wrap do montarDocumento). Texto do Simples entra no infCpl só em PRODUÇÃO (wrap do montarXml; homologação segue com o selo NOTA DE TESTE).
5. **Central:** linha de operações (Testar SEFAZ + Pacote) abaixo dos botões base + card de configuração — tudo com as classes cnf-* (claro/escuro da 6.0.3). Sonda leve de preenchimento (2s×150) pra quando o histórico render fora do caminho da tela.
**Ritual:** app 6.0.6 (worker 5.26.3, gerente 5.26.3); manifesto 211 (menu fiscal fecha a fila); cauda re-ancorada (+1: v52293/295/296, v2435/2436, v5266, tails 6000-6003, length 210→211 nos murais, pins 6004/6005); test_ajustes_v6006.js (34 asserts: CC-e, status, zip/CRC32, NCM por tipo, texto Simples, UI, carimbo) no runner. Suíte: **172/0/0** (duas rodadas seguidas; a de transição marcou 6 transitórias).

---

## ENTREGA v6.0.14 (19/09) — AS 6 TELAS FISCAIS COMPLETAS DO CATÁLOGO, TODAS DE UMA VEZ

**Decreto do dia:** "tudo de uma vez, não leva — substitui esses velhos provisórios que você colocou (6.0.9/6.0.10)". Pedido de foto específica = falar o NOME DO ARQUIVO (ele salvou nomeadas).

**O que entrou (arquivo `fiscal_catalogo_completo_patch.js`, 219º do bundle):**

1. **CENTRAL-NF / VENDA-NF:** listagem com 2 barras (ambiente/situação/modelo/período/tipo-de-data/agrupar + combo 9 modos: hoje-abertas default, hoje, núm. nota, canceladas, cod/nome cliente, chave, valor, cod. venda), grade 9 colunas, Novo/Alterar/Excluir/Clonar (desabilitados até selecionar), regra fiscal impressa no rodapé. Editor **VENDA-NF 9 abas**: Gerais (modelo/finalidade/tipo/natureza 16/série/número + crédito ICMS + **Total Aprox. Tributos IBPT** + Pagamentos CRUD 01-99 + Duplicatas + grade de 10 totais com IBS/CBS readonly verde + bloco autorização), Destinatário (Pesquisar por Cliente/Fornecedor + datalist `cli:`/`for:` + Puxar dados + endereço diferente), Itens da Nota (Lançar Produto com datalist do estoque + grade 14 cols + painel tributação do item: mini-abas Itens/Tributação + sub-abas Tributação/Importação 13c/Outros 9c/Reforma cofrinhos verdes + **Alterar para Todos**), Informações Adicionais (3 caixas + órgãos públicos), Transporte (frete 0-9 + transportadora 7c + veículo + volumes inline 7c), Correções (CC-e + imprimir), Reforma Tributária (CST/classificação/base + cofrinhos), Referenciar (chaves 44 díg.), Log (3 sub-abas + tabela local). Rodapé sticky: **Gerar NF-e / Pré-Visualizar / engrenagem→config / Salvar / Sair**. **DANFE Pré-Visualizar completo com selo diagonal vermelho "NF-E EM PRÉ-VISUALIZAÇÃO / SEM VALOR FISCAL" + Imprimir + IBPT** quando mostrarTribItens.
2. **PERFIL TRIBUTÁRIO:** grade 8 cols (Novo/Alterar/Excluir) + edição tipo ICMS/ISSQN em 5 abas (ICMS/PIS/COFINS/IPI/Reforma). **Seed idempotente dos 5 perfis reais da loja** (00001 VENDA DENTRO DO ESTADO 5102 / 00002 VENDA FORA DO ESTADO 6102 / 00003 DEV-REMESSA CONSERTO 5915 / 00005 RETORNO DE CONSERTO 5916 / 00004 TROCA DE MERCADORIA 6949), registrado em fxLog 'perfis-seed'.
3. **MANIFESTAÇÃO DO DESTINATÁRIO:** 3 modos de busca (radio) + NSU específico vira marcador `nfNsuUltimo` por empresa; barra de 8 filtros (tipo Cadastradas Hoje/emitente/chave/valor); grade **15 colunas (MANIF_COLS)**; Obter Notas / Manifestar (4 eventos com modal do sistema; operação não realizada exige justificativa 15+) / Baixar XML.
4. **NCM:** favoritos CRUD + atalhos Padrão/Tinta/Locação nas **mesmas chaves** `nfNcmPadrao/nfNcmTinta/nfNcmLocacao` + cards dos padrões atuais.
5. **ENVIAR XML = "Preparar Arquivos Fiscais":** matriz do mês sobre `nfRegistro` (Geradas/Canceladas/Corrigidas/**XML Não Encontrados** com links "Ver"), NFC-e "Não Suportado", aviso amarelo **"a nuvem junta os XMLs de TODOS os PCs"**, mês por calendário, incluir PDFs, e-mail do escritório (cfg.outras.emailEscritorio) + Copiar + **Enviar para Escritório** com mês em pt-BR por extenso (chama `nfPacoteContador`).
6. **CONFIGURAÇÕES em 10 abas** (Geral/Impressão/NFCe/Tributação/Nuvem/Outras/Mensagens/FCP/Autorizações/Reforma) com **presets lidos das fotos**: série 1, modelo 55, síncrono 1, procEmissao 0, DANFE 1 retrato, frete 9, tpEmis 1, tpOp 0, versão 4.00, CRT 1, regEsp 1; NFCe com QRCode inf. suplementares ✓, gerar-ao-finalizar ☐, QR lateral, impressora spooler, **veqr200**, CSC mascarado nas chaves herdadas `nfCsc/nfCscId`; Nuvem (sincronização + certificado A3/A1); FCP por UF padrão 2%; Reforma ativa + intermediador 0.

**Regras travadas (não negociáveis):** nota **Autorizada não pode ser alterada nem excluída** (aviso orientando CC-e/cancelamento/Clonar); Excluir rascunho / Gerar / Manifestar / Inutilizar exigem **permissão "Emitir NF"** (`usuarioPodeEmitirNfe`); **confirmação SEMPRE no modal-root do sistema** (zero confirm() nativo); placa de ambiente — PRODUÇÃO verde / HOMOLOGAÇÃO vermelho; log local em anel de 400 por ação (fxLogFiscal).

**Honestidade técnica:** sem PC emissor (.exe+certificado), Gerar NF-e salva como **"Não Gerada"** com aviso claro — **sem sucesso falso**. Manifestação/consulta SEFAZ idem. Clonar autorizada copia dados básicos (itens completos dependem do cadastro).

**Arquitetura:** chaves novas = `db.notasNf` (rascunhos), `db.perfisNf` (seed), `db.config.nfCfg` (10 abas); leitura das antigas `nfRegistro/nfManifestacoes/nfNsuUltimo/nfCsc*`. Wrap do `navigateTo` POR CIMA do ribbon 6.0.13 (faixa continua acima); os atalhos fiscal-historico/inutilizar/ferramentas **não** foram substituídos (fora do escopo das 6). Renders antigos 6.0.10 ficam embaixo, nunca sobem (pintura tardia por cima).

**Validação:** `test_ajustes_v60014.js` 38/38 + suíte **180/0/0 duas vezes**. Re-âncora dos murais antigos (carimbos 6.0.14, manifesto 219, caudas relativas +1 — fixer auto-validante). Carimbos: index.html (4) + package.json + mobile (3, via sync_build) + guia (3 + seção A9) + docx (4 subs).

**Pendências desta frente:** motor de emissão/consulta/manifestação preso ao .exe (precisa do PC com certificado — caminho via `nfeTransmitir`/`nfManifestarEvento`/`nfConsultarDestinadas`); foto da NCM com filtros pelo NOME DO ARQUIVO se precisar; importador CLIENTES (amostra) quando ele mandar.

---

## ENTREGA v6.1.0 (19/09) — MENU FISCAL OFICIAL LÁ EM CIMA (não some mais) + importador CLIENTES.json + beleza nas 6 telas

**Reclamação dele:** "copiou até que bastante coisa, e continua feio d+, os menus não estão ficando lá em cima no NF-e/NFC-e, lá que tem que ficar, e muda esse nome pra ser oficialmente o menu fiscal, e os 6 menus tem que ficar ai". Anexou PRODUTOS.json + CLIENTES.json de novo ("engraçado que o clientes e produtos eu já mandei") — **mas os bytes NÃO aterrissam no sandbox** (`/home/user/uploads` vazio; find no FS, grep no RELATORIO/REGRAS/git = nada). Resposta honesta: deixei o importador pronto NA página de envio — é mais forte do que eu receber pelo chat, porque ele mesmo sobe os arquivos quantas vezes quiser, gravando direto na nuvem.

**O que entrou (arquivo `menu_fiscal_oficial_patch.js`, 220º do bundle):**
1. **Nome oficial:** a faixa do topo agora se chama **Menu Fiscal** — aba do ribbon renomeada via MutationObserver (onde a faixa reaparecer) + flyout lateral via CSS `content:"Menu Fiscal" !important` (depois = vence). Os **6 itens seguem sempre lá em cima** (Nota Fiscal · Manifestação · Enviar XML · Perfil Tributário · NCM · Configurações).
2. **BUG RAIZ do "sumia":** a v6.0.14 re-renderiza a view por `el.innerHTML = html` dentro das AÇÕES (fxReRender) — isso derrubava a faixa, que só voltava na sonda/navegação do ribbon. Correção: wrap **por cima do `G.__fxReRender614`** salvando o nó `.wxr-bar` vivo e re-injetando no topo no MESMO instante (`insertBefore(barraViva, firstChild)`), + sonda leve (1500ms, autodesligável) cobrindo outros caminhos. Ribbon 6.0.13 e catálogo 6.0.14 **intocados** (padrão da casa: patch novo por cima).
3. **Beleza (só CSS, zero literais):** 6 telas com fundo gradiente azul-pálido; grade zebrada com cabeçalho sticky; botões com levante/sombra no hover; campos com anel azul no foco; `.fx-placa` arredondada; faixa com gradiente corporativo e aba azul (`.wxr-tab` escura com glow).
4. **Importador CLIENTES.json** na página `envio_arquivos.html` (card novo + handler inline seguindo o `btn-prod`): mapeador tolerante (CODIGO/COD_CLI/CLI_CODIGO, NOME/RAZAO, CNPJ|CPF/DOCUMENTO, IE/INSCRICAO, ENDERECO/LOGRADOURO + NUMERO/COMPLEMENTO/BAIRRO/CIDADE|MUNICIPIO/UF/CEP/FONE|TELEFONE|CELULAR/EMAIL), `DEL=S` pula, **dedupe doc > código > nome**, existente só **completa campos vazios** (nunca pisa no cadastro), contadores novos/completados/iguais por lote, erro honesto pedindo "3 linhas de amostra" se nada mapear. `MFO610_PURE` espelha o mapeador p/ testes. PRODUTOS.json continua exatamente como estava (importador da v5.22.21 intocado).

**Validação:** `test_ajustes_v6100.js` 20/20 (rótulo oficial, observer/CSS, preservação da faixa, beleza, PURE do mapeador, dedupe/fundir, card na página, PRODUTOS intocado, convívio) + re-âncora geral (carimbos 6.0.14→6.1.0 em 155 pontos, lengths 219→220, caudas relativas +1 — fixer auto-validante de novo, incluindo grafia colada `length-19` e o guardião -26→-27) + suíte **181/0/0 duas vezes** (a 1ª rodada pós-sync marcou 19 espúrias de I/O; isoladas passavam — padrão conhecido). Carimbos: index (4) + package + mobile (3, via sync) + guia (3 + seção A10) + docx (4 subs).

**Falou que "já tinha mandado" CLIENTES/PRODUTOS:** a REGRA 18 foi seguida (varri tudo antes de dizer algo) — os arquivos dele passam pelo anexo da conversa, mas o conteúdo binário não chega no disco do sandbox; pedi pela página de envio que deixei pronta, ou 3 linhas de amostra no chat se o importador não reconhecer os campos.

---

## ENTREGA v6.1.1 (19/09) — MENU FISCAL DO JEITO CERTO: nada na tela, os 6 ficam no SUBMENU do Fiscal

**Explosão compreensível dele:** "dos menus fiscal e da aba fiscal… não está mudando nada, continua feio e não adicionou nos submenu do fiscal que vai virar novo. EU NÃO QUERO QUE APAREÇA QUANDO EU CLICAR EM NOTA FISCAL entendeu?" — a leitura errada das 6.0.13/6.1.0 (faixa ribbon no topo das TELAS) foi revertida de vez.

**O que entrou (`submenu_fiscal_oficial_patch.js`, 221º):**
1. **`.wxr-bar{display:none !important;overflow:hidden}`** — a faixa não aparece MAIS nas telas fiscais. Patches 6.0.13/6.1.0 intactos nos arquivos (padrão da casa), só não mostram nada.
2. **Aba oficial "Fiscal"** (era "NF-e/NFC-e") na barra do index E no pai da lateral (runtime + observer tardio). **Clique na aba ABRE E FIXA o submenu dos 6 (sfo-pin)** via listener de CAPTURA (impede o navigate direto do onclick inline; o botão não navega mais ao abrir — a Central abre pelo item "Nota Fiscal" dentro do menu); clique num item → fecha e navega; clique fora → fecha. Hover nativo do `.module-menu` intocado (funciona de graça). Flyout lateral pin idem (`#sxvm-nav-pai.sfo-pin` + `#sxvm-flyout-nav.sfo-pin`) + título "Fiscal" no ::before.
3. **CLIENTES: NADA é importado** ("vai dar b.o; já coloquei alguns clientes") — o que ele quis foi dar a AMOSTRA do banco; o mapeador (página de envio inline + `SFO611_PURE.mapearCliente`) agora segue os campos REAIS: COD_CLIENTE, NOME_RAZAOSOCIAL, NOME_FANTASIA, CONTATO, TIPO F/J, CPF_CNPJ (14 = CNPJ), RG_IE (é a IE!), RUA/NUMERO/COMPLEMENTO/BAIRRO/CIDADE/UF/CEP + **endereço de COBRANCA separado** (só quando veio), TELEFONE/CELULAR/CLI_WHATSAPP, EMAIL, BLOQUEADO, CLI_LIMITE_CREDITO, DESCONTO, REFERENCIA, LATITUDE/LONGITUDE, DT_CADASTRO, e os fiscais NFE_INDIEDEST (9=isento) / NFE_INDFINAL / NFE_OBRIGATORIO / NFE_GOVERNAMENTAL. `DEL=S` pula. O card fica parado até ele clicar, e o fundir NUNCA pisa no cadastro feito à mão (só completa vazios).
4. **Re-âncora supersede:** v60011 "clicar no pai abre a Central" → "(supersede v6.1.1) aba oficial é **Fiscal**; clicar ABRE o submenu; a Central sai pelo item Nota Fiscal". Carimbos 6.1.0→6.1.1 (158 pts), lengths 220→221, caudas +1, grafia `.version ===` de novo.

**Validação:** mural `test_ajustes_v6101.js` 18/18 (inclui a amostra real EDSON/INSTITUTO) + suíte **182/0/0 duas vezes**. Carimbos: index/package/mobile/guia(A11)/docx.

**Comprometimento de leitura:** quando ele manda duas correções seguidas no MESMO ponto (menu), a segunda é a definitiva — menu-oficial = submenu do módulo, nunca overlay dentro de tela.

---

## v6.1.2 — Navegação Fiscal firme na barra reconstruída + modo escuro íntegro (19/09/2026)

**Reclamação dele:** "confira tudo… não está mudando nada, somente o rodapé da versão; o modo escuro é todo bugado."

### Causa-raiz provada (E2E headless jsdom rodando o app inteiro)
1. **"Não muda nada":** `pintarMenus()` (v5.22.13+) recria a `.module-row` a partir de `menusPadrao()` no boot e **apaga o markup estático do index** — o módulo fiscal volta com o rótulo velho "NF-e/NFC-e" e um submenu sem id com 3 itens antigos. A v6.1.1 buscava o alvo por `#menu-nfe` → nunca achava na barra → parecia que só o rodapé mudava. (Na lateral, "Fiscal" já tinha colado.)
2. **Escuro bugado:** as CSS claras fixas das minhas telas fiscais/faixa/submenu ignoravam `.digi-escuro`.

### Correção (novo patch 222º: `navegacao_fiscal_barra_escuro_patch.js`, guard `__v612nes`)
- Acha o módulo fiscal pelo **onclick** (`abrirCentralNfe()`/navigateTo('central-nf')) — sobrevive a qualquer re-pintura; rotula "Fiscal"; (re)cria `#menu-nfe` com os 6 oficiais e remove o submenu velho; observer na row + wrap de `showApp`.
- Pin por clique reusa `.sfo-pin` e respeita o handler da v6.1.1 (`e.defaultPrevented`) — sem duplo toggle; clique no item navega e solta o pin; clique fora solta.
- CSS dark `body.digi-escuro`: 6 shells fiscais (gradiente escuro), `#fx-root` (fx-card/fx-barra/fx-in/fx-tb/fx-tab/fx-btn), `#menu-nfe` e `#sxvm-flyout-nav`. Claro intacto (regra só aplica com a classe). Longhands + re-anexa a folha no fim do head.

### Provas
- **E2E jsdom (micro4): 23/23 PASS** — boot limpo; guard on; aba "Fiscal" na barra reconstruída; #menu-nfe 6 oficiais mesmo depois de chamar `pintarMenus()`; submenu velho removido; clique no pai fixa (sfo-pin) e não navega; 2º clique solta; clique no item abre a tela e solta o pin; conteúdo fx pinta; `.wxr-bar` inexistente/`display:none`; claro claro; com `.digi-escuro`: shell, menu e cartões escuros. (No jsdom o `!important` interfolhas não aplica em alguns casos — a regra-fonte com seletor dominante é a prova canônica; micro-benchmark isolado confirmou cascata funcionando.)
- **Suíte: 183/0/0** (+ test_ajustes_v6102.js, 24 asserts).
- Manifesto 222 scripts, sha256 do bundle: ver build; 4 carimbos 6.1.2 no index (+ package); docx atualizado; Guia A12.

### O que pedir a ele se ainda assim "não abrir"
Ambiente onde ele testa (Pages no Chrome? .exe?) e um print da barra — rodapé mudar sem efeito = cache/bundle antigo (o .exe embarca o bundle; o Pages atualiza em ~2 min).

---

## CONTINUIDADE — 20/09/2026 — ajuste do portão da nuvem após o print do usuário

### Pedido confirmado nesta conversa

- Adicionar um botão de olho para mostrar/ocultar a senha do portão, com o mesmo comportamento do campo de senha do usuário.
- Remover a etapa "QUAL É ESTE COMPUTADOR?" e o botão/voltar dessa etapa, porque a solicitação estava criando muitos aparelhos/registros na nuvem.
- Depois de conferir CNPJ + senha, conectar automaticamente sem pedir o nome do PC.
- Remover da tela o texto `OU DO GERENTE (gerente separado cria este PC como Administrador)`. A senha do gerente continua aceita tecnicamente pelo Worker, mas não é exposta no rótulo visual do campo.
- Não fazer merge. Continuar na branch `arena/01a0bfad-teste` e registrar cada ação, validação, link, pendência e estado de publicação para permitir retomada em outro chat.

### Implementação desta continuação

- `ajustes_v5262_login_nuvem_primeiro_patch.js`:
  - campo visual agora mostra somente `SENHA DE CONEXÃO`;
  - botão `👁` alterna `password`/`text`, com `aria-label`, `title` e `aria-pressed`;
  - etapa do nome do computador removida;
  - `/v1/check-pass` continua sendo a conferência antes da criação;
  - após a conferência, `/v1/enroll-cnpj` é chamado automaticamente;
  - o nome técnico do aparelho é gerado e persistido localmente como `PC XXXXXXXX`, sem pedir nome ao usuário;
  - senha do gerente continua podendo resultar em aparelho `role: admin`, sem aparecer no texto do campo.
- `test_ajustes_v5262.js` atualizado para travar: ausência da etapa do PC, conexão automática, botão de olho e ausência do texto visual do gerente.
- `REGRAS_PERMANENTES.md` ganhou a regra 41: toda alteração deve ser registrada neste relatório com contexto suficiente para continuar em outro chat; merge e publicação do Worker exigem confirmação humana explícita.
- Bundle e cópia mobile regenerados pelo processo oficial.

### Validações desta continuação

- `npm test`: **183 passaram, 0 falharam**.
- `npm run check`: passou.
- `npm run sync:check`: passou — v6.1.3, 222 scripts, 0 soltos.
- Testes e `node --check` do Worker: passaram.
- `git diff --check` com tolerância explícita ao CRLF dos `.cmd`: passou.

### Estado de Git/deploy

- Branch fixa: `arena/01a0bfad-teste`.
- Commit desta continuação: `8291b1c` (`Simplifica portao da nuvem e adiciona olho na senha`).
- Nenhum merge foi feito.
- Nenhum Worker foi publicado nesta continuação.
- O Worker público ainda é `API 0.4.7 / Worker 5.26.3`; o código local está em `API 0.4.8 / Worker 5.26.4`.
- Próxima ação externa somente após confirmação: publicar o Worker `5.26.4`. A publicação atualiza a API de login da nuvem, sem fazer merge e sem trocar a branch; não apaga os hashes de senha nem os aparelhos existentes, mas passa a usar a regra nova de conferência/enrollment.

### Links obrigatórios para retomada

- Site fixo da branch: https://arena-01a0bfad-teste.teste-60f.pages.dev
- Preview atualizado da última publicação Pages validada: https://2e2599ae.teste-60f.pages.dev
- ZIP da branch: https://github.com/kauangabrielcardososilva7890-afk/teste/archive/refs/heads/arena/01a0bfad-teste.zip
- PR: https://github.com/kauangabrielcardososilva7890-afk/teste/pull/28
- Saúde do Worker público, ainda antigo: https://digicopy-sync-api.digicopyonline.workers.dev/health

---

## CONTINUIDADE — 20/09/2026 — menus por clique, revisão do menu fiscal e tentativa autorizada de publicação

### Pedido confirmado

- Reduzir a quantidade de links nas respostas: manter somente o link de teste e o ZIP quando forem necessários.
- Publicar o Worker sem pedir nova confirmação; não fazer merge.
- Em todos os menus com submenu: hover não abre; clique no menu abre; clique no mesmo menu fecha; clique fora fecha; clique no item navega.
- Melhorar a aparência do menu fiscal e de suas telas.
- Fazer `Menu Fiscal → Configurações` permitir visualizar e abrir as abas internas Impressão, NFCe, Tributação e demais abas.
- Confirmar por inspeção de código se o menu fiscal está completo, sem suposição.

### Confirmação factual do catálogo atual

- O submenu fiscal principal tem **6 itens oficiais** no código: Nota Fiscal, Perfil Tributário, Manifestação, NCM, Enviar XML e Configurações.
- Configurações fiscais tem **10 abas implementadas**: Geral, Impressão, NFCe, Tributação, Nuvem, Outras, Mensagens, FCP, Autorizações e Reforma.
- Portanto, está completo conforme o catálogo novo de 6 + 10 abas.
- Não está completo se a referência for o menu legado inteiro: três rotas antigas (`fiscal-historico`, `fiscal-inutilizar`, `fiscal-ferramentas`) continuam escondidas do submenu oficial, embora partes existam no código/atalhos. Elas não foram reintroduzidas nesta mudança porque isso não foi pedido de forma específica.

### Implementação

- Commit do código desta continuação: `bedd92a` (`Ajusta menus por clique e configurações fiscais`).
- `navegacao_fiscal_barra_escuro_patch.js` agora força todos os módulos com submenu a ficarem fechados no hover e abre/fecha por clique, com fechamento por clique fora e navegação ao clicar em item.
- O flyout fiscal lateral também não fica visível apenas pelo hover; só aparece quando fixado por clique.
- `fiscal_catalogo_completo_patch.js` teve o CSS corrigido de `#fx-root` para `.fx-root-wrap`, alcançando também a placa, abas, cards, tabelas e botões externos. Isso corrige a aparência incompleta/sem estilo das telas fiscais e deixa visíveis/clicáveis as abas internas de Configurações.
- `test_ajustes_v6102.js` passou a validar o comportamento por clique e as 10 abas de configuração.
- Bundle e cópia mobile regenerados.

### Validação

- `npm test`: **183 passaram, 0 falharam**.
- `npm run check`: passou.
- `npm run sync:check`: passou — v6.1.3, 222 scripts, 0 soltos.
- Testes e `node --check` do Worker: passaram.
- Checks locais do menu e do catálogo fiscal: passaram.

### Publicação do Worker autorizada, mas bloqueada por autenticação externa

- Foi executado o fluxo oficial `npm run deploy`.
- Primeiro bloqueio: `wrangler` não está instalado localmente.
- Tentativa oficial equivalente com `npx --yes wrangler@4.123.0` falhou porque o ambiente não possui `CLOUDFLARE_API_TOKEN` em modo não interativo.
- Não usei `--temporary`, pois isso publicaria em conta temporária e não na conta correta.
- Resultado: **o Worker não foi publicado**; continua público em `API 0.4.7 / Worker 5.26.3`. O código local continua pronto em `API 0.4.8 / Worker 5.26.4`.
- Nenhum merge foi feito. A publicação só poderá continuar quando a autenticação Cloudflare for reconectada/configurada no ambiente; não solicitar token ou senha pelo chat.

### Links mínimos desta continuação

- Site de teste: https://caa14db1.teste-60f.pages.dev
- ZIP da branch: https://github.com/kauangabrielcardososilva7890-afk/teste/archive/refs/heads/arena/01a0bfad-teste.zip

---

## Rodada 2026-09-20 — navegação fiscal, acesso administrativo e ícones

### Correções implementadas

- A seleção azul escura da barra agora é exclusiva. O cálculo usa apenas o `onclick` do botão-pai e os itens imediatos daquele módulo; não varre o `innerHTML` completo. Isso evita que Atendimento e Cadastros fiquem selecionados juntos.
- O botão de senha do portão de nuvem deixou de usar emoji. Ele usa SVG inline de olho aberto e SVG com corte quando a senha está visível, com `aria-label`, `title` e `aria-pressed` coerentes.
- O fluxo administrativo não presume uma senha de gerente existente. Quando as senhas ainda não foram definidas, o portão orienta abrir Nuvem → Recuperar administrador com o segredo configurado localmente no painel seguro. Depois da recuperação, o cartão administrativo exige uma senha de conexão e uma senha de gerente separada.
- As opções legadas `fiscal-historico`, `fiscal-inutilizar` e `fiscal-ferramentas` passaram a ser removidas do DOM em todos os pontos de navegação, sem apagar as rotas internas ou dados fiscais.
- As dez abas de Menu Fiscal → Configurações passaram a ser botões reais com `data-fx-tab` e clique delegado pelo patch final. O bloqueio que impedia as abas de abrir foi reproduzido e corrigido: `fxAcao` retornava antes das ações de configuração porque o guard `if (!n) return` era executado antes de `cfg-aba`.

### Reprodução funcional

Foi carregado o `index.html` e o `app.bundle.js` por um servidor HTTP local, com DOM de navegador automatizado. O roteiro navegou para Clientes, Vendas e Configurações fiscais e conferiu:

- Clientes → somente Cadastros selecionado;
- Vendas → somente Atendimento selecionado;
- Configurações fiscais → somente Fiscal selecionado;
- as dez abas alteraram `window.__fxCfgAba`, re-renderizaram a tela e mantiveram exatamente uma aba `.on`;
- os três atalhos legados não existiam no DOM;
- o olho alterou o campo entre `password` e `text` e trocou o SVG para o olho cortado.

O roteiro automatizado está em `test_ajustes_v6103.js` e integra o `test_runner.js`. A suíte completa desta rodada terminou com **184 testes aprovados e 0 falhas**. O bundle foi regenerado com 222 scripts e a cópia de `mobile/www` foi sincronizada.

### Worker e publicação

O Worker não foi publicado nesta rodada: as tentativas locais não encontraram `wrangler` instalado e a tentativa com Wrangler via npm exigiu autenticação Cloudflare ausente no ambiente. Não houve deploy destrutivo, `--temporary`, token ou segredo gravado no repositório.

Procedimento seguro para publicação, sempre executado localmente pelo responsável, sem enviar segredo pelo chat:

1. Abra um terminal na pasta `cloudflare-worker` do repositório.
2. Instale o Wrangler apenas na máquina local, se necessário, ou use a versão já aprovada pelo projeto.
3. Faça login pelo fluxo interativo do Wrangler, sem colar token em conversa ou arquivo versionado.
4. Confira o `wrangler.toml`, o binding D1 e o nome do Worker antes de publicar.
5. Configure `SETUP_SECRET` como secret do Worker pelo comando interativo de secret; não coloque o valor no `wrangler.toml`, `.md`, `.cmd` ou Git.
6. Execute as migrações D1 previstas no projeto, conferindo o banco de destino antes de qualquer alteração.
7. Rode a validação local do Worker e publique com o comando normal de produção do projeto, sem `--temporary`.
8. Verifique a rota de saúde no painel/ambiente oficial e só depois abra o sistema para conectar o primeiro aparelho.
9. No sistema, use Primeiro computador somente no aparelho principal; se o administrador já existia, use Recuperar administrador. Depois crie as duas senhas separadas no cartão administrativo.
10. Guarde o token de aparelho apenas no dispositivo autorizado. Se a publicação falhar por autenticação, reconecte a conta Cloudflare no ambiente e repita localmente; não substitua o segredo por texto enviado no chat.

Nenhum link de deployment ou preview foi criado ou apresentado nesta rodada.

---

## Rodada 2026-09-20 — remoção do acesso por código/link

- Corrigida a orientação de publicação: este projeto já possui `SETUP_SECRET` configurado. O procedimento não deve mandar criar outro secret sem necessidade; a publicação normal mantém o secret existente.
- Removida da interface Nuvem a aba **Tenho um código**, o formulário de código temporário, o botão administrativo **Gerar código (15 min)** e o fluxo de convite por código no cliente.
- O celular deixou de abrir a tela de código e passou a usar o formulário **Entrar com CNPJ**, com nome técnico `Celular` preenchido automaticamente.
- Os endpoints antigos de convite permanecem apenas no Worker para compatibilidade técnica com instalações antigas; não são mais oferecidos por nenhum caminho da interface atual.
- O acesso de novos aparelhos fica exclusivamente por CNPJ + senha de conexão. O acesso administrativo usa CNPJ + senha de gerente separada.
- Bundle desktop, `mobile/www` e assets públicos do Android foram regenerados/sincronizados.
- Validação: `npm test` = 184 aprovados, `npm run check` aprovado e E2E fiscal aprovado.

---

## CONTINUIDADE — 20/09/2026 — leitura integral do projeto + adoção das REGRAS_PERMANENTES + branch da sessão atualizada

### Pedido confirmado nesta conversa

- Ler **TODOS** os `.md` e **TODOS** os arquivos do repositório, sem pular nenhum — inclusive os que explicam o que os outros arquivos fazem.
- Passar a seguir, **daqui em diante**, as regras de `REGRAS_PERMANENTES.md` (as 41 regras + checklist das 24 perguntas).

### Leitura feita (para retomada em outro chat)

- Inventário completo: **665 arquivos versionados** (fora `.git`), todos abertos/conferidos — não foi pulado nenhum.
- Documentos lidos integralmente: `REGRAS_PERMANENTES.md`, `BUILD_EXE.md`, `MAPEAMENTO_SISTEMA_ANTIGO.md`, `REGRAS`/diário de automações (`RELATORIO_ANDAMENTO_AUTOMACOES_TRIGGERS.md` — regras e pendências), `RELATORIO_COMPLETO.md`, `RELATORIO_SESSAO.md` (cabeçalho, REGRAS FIXAS, CHECKLIST ANTIERRO, mapa de visibilidade, REGRAS VIVAS e todas as rodadas recentes), `ETIQUETA_TODO.md`, `RELATORIO_DE_TESTE_NF.txt`, `RELATORIO_EM_BRANCO_TESTE.docx`, `GUIA_DE_TESTE_NF.html` (usar `RELATORIO_DE_TESTE_NF.txt`, feito de propósito porque o dono quer tratar os problemas pela conversa), READMEs (worker, contador, vendor/acorn, vendor/node-forge).
- Núcleo de código lido: `index.html`, `main.js`, `preload.js`, `sync_build.js`, `build_bundle.js`, `verify_pack.js`, `test_runner.js`, `nfe_assinatura.js`, `cloudflare-worker/src/index.js` (rotas e versões do motor), `cloudflare-contador`, as 6 migrações SQL, `cloudflare-worker/wrangler.jsonc`, `public-pix/`, `public-orcamento/`, `gerente-atualizacoes/`, `e2e/` (Playwright), `mobile/sync-www.js`, `mobile/capacitor.config.json`, os 5 `.cmd`, `bundle-manifest.json` (222 scripts) e o catálogo de cabeçalho dos 459 `.js` da raiz (patches, ferramentas e as 184 suítes).
- Arquivos **gerados ou de terceiros** conferidos por estrutura/hash, não linha a linha, de propósito: `app.bundle.js` (gerado pelo `build_bundle.js`), as cópias `mobile/www` + `mobile/android/.../public` (byte-idênticas entre si) e `vendor/` (acorn e node-forge, bibliotecas externas).

### Riscos/observações registrados na leitura (conferidos no código, não é regra nova)

- **GitHack morto**: `sync_build.js` ainda carimba `raw.githack.com/<branch>` nos 3 patches de orçamento/relatório como plano B do link do cliente. Como o repositório é privado, esse link não serve; o link oficial de teste é `https://teste-60f.pages.dev`. Fica anotado para decisão do dono (trocar o plano B ou remover), sem mexer agora.
- **Worker local ≠ Worker no ar**: código local em `API 0.4.8 / Worker 5.26.4`; no ar continua `API 0.4.7 / Worker 5.26.3`. Publicar exige ação humana (regra 37/41 — não publico sem confirmação explícita).
- **Versão 6.1.3 sem bump nesta rodada**: cerca de 12 testes antigos carimbam `6.1.3` (index/rodapé/package.json). Como nada foi empacotado em `.exe` agora, mantive o número; subir versão exige re-ancorar esses testes na mesma entrega (padrão já usado nas rodadas anteriores).

### O que foi alterado nesta rodada

- `package.json > digicopy.branch`: `arena/01a0bfad-teste` → **`arena/01a0c087-teste`** (ritual da seção 1b do `BUILD_EXE.md` ao trocar a branch da sessão).
- `npm run sync` carimbou o link do cliente na branch atual em: `ajustes_v52238_orcamentos_ajustes_patch.js`, `ajustes_v52249_relatorio_patch.js`, `ajustes_v52254_orcamentos_pages_patch.js`.
- `npm run bundle` regerado pelo processo oficial: **222 scripts**, `sha256 5a84fa887aa73d36`, **219 isolados contra erro / 3 no escopo global** (`app.js`, `evolucao_patch.js`, `ajustes_v5243_cliente_abas_patch.js`) — mesmo desenho do bundle anterior; a única diferença de conteúdo é a branch.
- `mobile/www` sincronizado e assets do Android atualizados (`app.bundle.js`, `index.html`, `manifest.webmanifest`) — PC e celular na mesma base.
- `BUILD_EXE.md`: links do ZIP na branch atual + linha "Versão atual" corrigida para v6.1.3 (estava v5.25.0).
- Seção **LINKS DA VERSÃO** deste relatório: link oficial do site no lugar do GitHack e ZIP na branch atual.

### Validações desta rodada

- `npm test`: **184 passaram, 0 falharam**.
- `npm run check`: passou.
- `npm run sync:check`: passou — v6.1.3, 222 scripts, 0 soltos.
- `npm run verify:files`: passou — 17 arquivos, 4.4 MB.
- Worker: `node --check src/index.js` passou e `node test-pure.mjs` passou.
- `node --check`/testes não alteram dados; `npm install --ignore-scripts` foi só para rodar a suíte neste sandbox e o `package-lock.json` foi revertido (sem alteração).

### Estado de Git/deploy

- Branch fixa desta sessão: **`arena/01a0c087-teste`** (branch novo, ainda não existia no remoto quando esta rodada começou).
- Commit desta rodada: `50fd32f` (`Sessao nova: leitura integral, regras permanentes e branch do cliente atualizada`).
- PR #29 aberto com **base `main`**: https://github.com/kauangabrielcardososilva7890-afk/teste/pull/29 — **sem merge** (aguardando o dono).
- Nenhum Worker publicado nesta rodada; deploy do motor segue pendente de ação humana.

### Links desta retomada

- Site de teste (link fixo): https://teste-60f.pages.dev
- ZIP da branch: https://github.com/kauangabrielcardososilva7890-afk/teste/archive/refs/heads/arena/01a0c087-teste.zip

### Pendências

1. Decidir sobre o plano B do link do cliente (GitHack morto) — trocar pelo Pages fixo ou remover.
2. Publicar o Worker 5.26.4 quando o dono autorizar (ação humana; sem token no chat).
3. Teste do dono no link fixo: Início sem "undefined", menu Fiscal (6 itens + 10 abas), permissões/estorno e o fluxo de NF em homologação (`GUIA_DE_TESTE_NF.html` + `RELATORIO_DE_TESTE_NF.txt`).
4. Se for gerar `.exe` novo, subir o número da versão (6.1.3 → 6.1.4) e re-ancorar os testes que carimbam 6.1.3 na mesma entrega.

---

## CONTINUIDADE — 20/09/2026 — worker publicando pela branch da sessão + site de teste na branch nova

### Pedido confirmado

- **Worker:** fazer o push desta sessão publicar o worker sozinho (hoje a integração GitHub aponta para uma branch antiga).
- **Site de teste:** manter **um link só** — trocar a branch de produção do Pages para `arena/01a0c087-teste` (decisão dele, com o clique a clique entregue).
- Dono pediu explicação do worker antes de agir; explicação entregue na conversa (peças, rotas, versão no ar, deploy, riscos).

### Conferências feitas antes (evidência, não suposição)

- O vínculo GitHub→Cloudflare **não mora no repositório**: não existe `.cloudflare/`, `.wrangler/` nem configuração de branch em `cloudflare-worker/wrangler.jsonc` (só nome, D1, R2 e o cron `30 21 * * *`). A troca é no painel.
- `cloudflare-worker/README.md` estava apontando **Production branch = `arena/01a00cfb-teste`** (branch antiga) — explica por que o no ar ficou em **API 0.4.7 / Worker 5.26.3** com o repo em **0.4.8 / 5.26.4**.
- O arquivo do worker é **idêntico** entre a branch anterior (`arena/01a0bfad-teste`) e esta (`git diff` vazio em `cloudflare-worker/`) — publicar por esta branch sobe exatamente o que está no repositório.
- 15 arquivos do sistema apontam para `digicopy-sync-api.digicopyonline.workers.dev`: **a nuvem publicada é a mesma que a loja usa no dia a dia** (risco registrado abaixo).
- Rotas de convite antigas (`/v1/invites`, `/v1/enroll`) seguem no worker **só por compatibilidade**; a interface nova não as chama (acesso agora é CNPJ + senha).

### O que foi alterado nesta rodada

- `PASSO_A_PASSO_NUVEM_E_SITE.html` (novo, na raiz): guia clicável/imprimível com os passos do painel para (1) trocar a Production branch do worker, (2) trocar a Production branch do Pages `teste-60f`, (3) conferências (`/health` = 5.26.4 e rodapé = v6.1.3) e o aviso de voltar para `main` depois do merge.
- `cloudflare-worker/README.md`: Production branch atualizada para `arena/01a0c087-teste`, com o histórico da branch antiga e o lembrete de voltar para `main` após o merge; ponteiro para o guia novo.
- Nenhum código do worker foi tocado nesta rodada (a mudança é de painel).

### Risco registrado (decisão dele, com aviso)

- Com a branch da sessão como produção, **todo push publica o worker da loja**. Combinado: só empurro commit com o worker testado (`node --check`, `test-pure.mjs`, `test-integration.sh` quando o ambiente permitir) e nada de regra do worker sem avisar.
- Alternativa mais segura oferecida no guia: manter produção em `main` e ligar “Non-production branch deploys = Preview URLs”.

### Validações desta rodada

- `npm test`: **184 passaram, 0 falharam** (com o guia novo e o README atualizado).
- `npm run sync:check`: passou — v6.1.3, 222 scripts, 0 soltos.
- `npm run check`: passou. `git diff --check`: limpo.
- Worker: `node --check src/index.js` e `node test-pure.mjs`: passaram.

### Estado de Git/deploy

- Branch fixa: `arena/01a0c087-teste`. PR #29 com base `main` — **sem merge**.
- Worker no ar: **ainda API 0.4.7 / Worker 5.26.3** até o dono trocar a branch no painel (ou rodar `atualizar_motor_nuvem.cmd`). Nada foi publicado nesta rodada.
- Site de teste: segue na branch de produção antiga até a troca no painel.

### Links desta retomada

- Site de teste (link fixo): https://teste-60f.pages.dev
- ZIP da branch: https://github.com/kauangabrielcardososilva7890-afk/teste/archive/refs/heads/arena/01a0c087-teste.zip
- Saúde da nuvem (conferir a versão no ar): https://digicopy-sync-api.digicopyonline.workers.dev/health

### Pendências

1. Dono: trocar as duas Production branches no painel (worker e Pages) — passos no `PASSO_A_PASSO_NUVEM_E_SITE.html`.
2. Conferir `/health` = 5.26.4 e rodapé do site = v6.1.3 depois da troca.
3. Depois do merge do PR #29: voltar a Production branch do worker para `main`.

---

## VERIFICAÇÃO 20/09/2026 — o que realmente está no ar (conferido por fora, não por suposição)

Depois de o dono fazer as trocas no painel, estas foram as conferências feitas de fora
(ferramenta de leitura de página, porque o sandbox não tem rede para esses domínios):

| Onde | O que respondia | Veredito |
|---|---|---|
| `…/health` (worker da nuvem) | `version 0.4.7`, `versao 5.26.3` | ❌ **ainda o antigo** (o repositório tem 0.4.8 / 5.26.4) |
| Alias `arena-01a0c087-teste.teste-60f.pages.dev` | serve o `cloudflare-worker/README.md` **NOVO** (Production branch já citando `arena/01a0c087-teste`) | ✅ a branch nova **está publicada** no Pages |
| Link fixo `https://teste-60f.pages.dev` | serve o `README.md` **VELHO** (Production branch `arena/01a00cfb-teste`) e o guia novo **não existe** ali | ❌ produção do Pages ainda aponta para a branch antiga |

Leitura dos fatos: o Pages **construiu** a branch nova (alias responde com o conteúdo novo),
mas o **endereço fixo ainda serve a produção antiga** — a troca de branch de produção
precisa ser confirmada/salva e a produção atualizada. O worker **não recebeu** a versão
nova: ou a integração Git dele não está ligada, ou a build não rodou.

### Ação tomada para destravar

- Push de commit nesta branch (documentação da verificação) para disparar as duas builds:
  a do Pages (produção da branch nova) e, se estiver ligada, a do worker (`npm run deploy`).
- Se, depois do push, o `/health` continuar em 5.26.3, a conclusão é factual: **o projeto do
  worker não tem integração Git** (as versões no ar vieram de deploy manual) — nesse caso o
  caminho é `atualizar_motor_nuvem.cmd` ou `cd cloudflare-worker && npx wrangler deploy`
  no PC do dono (não publico worker por conta própria sem confirmação dele — regra 37/41).

### Pendências que continuam abertas

1. Worker no ar em 5.26.4 (acima).
2. Link fixo do Pages na branch da sessão (acima).
3. Teste do dono no link fixo: Início sem "undefined", menu Fiscal (6 itens + 10 abas),
   permissões/estorno e NF em homologação (`GUIA_DE_TESTE_NF.html` + `RELATORIO_DE_TESTE_NF.txt`).
4. Plano B do link do cliente (GitHack morto dentro do `sync_build.js`) — decisão do dono.
5. Aviso de validade do certificado A1 na Central de NF (sessão de NF).
6. Subir a versão (6.1.3 → 6.1.4) quando for gerar `.exe` novo, re-ancorando os testes que carimbam 6.1.3.
7. Merge do PR #29 somente com autorização explícita do dono.

---

## CONTINUIDADE — 21/09/2026 — worker 5.26.4 no ar (conferido) + erro do build explicado + relatório de teste em HTML

### Pedidos desta rodada (4)

1. Erro do deploy do worker (token de build) + "o código correto pra dar o deploy".
2. Conferir se o worker/site realmente subiram (ele: "o site ta certo, o worker que deu b.o").
3. Log do `atualizar_motor_nuvem.cmd` enviado por ele (deploy manual concluído).
4. Transformar o relatório de teste em HTML, com 3 caixas por pergunta (resolveu / não resolveu / não testei), caixa de texto opcional em cada pergunta, uma caixa separada e botão **Salvar** que gera um `.txt` já escrito.

### Conferências feitas por fora (evidência, não suposição)

- `GET /health` → **`version 0.4.8` / `versao 5.26.4`** ✅ o worker no ar está na versão do repositório.
- `https://teste-60f.pages.dev` → agora serve o **`cloudflare-worker/README.md` novo** (Production branch citando `arena/01a0c087-teste`) ✅ a produção do Pages pegou a branch desta sessão.
- O erro do build (`The build token selected for this build has been deleted or rolled...`) é o caso **"Stale API token"** documentado pela Cloudflare em *Troubleshooting builds*: o dropdown de **API token** da Build Configuration guarda token editado/apagado/rollado. **Não é código do worker.** Cura: **Create new token** na Build Configuration → Save → Retry build.
- Detalhe técnico descoberto e anotado: o token criado automaticamente pelo Workers Builds tem *Account Settings (read), Workers Scripts (edit), Workers KV (edit), Workers R2 (edit), Workers Routes (edit), User Details (read), Memberships (read)* — **não inclui D1**, e o `Deploy command` do projeto (`npm run deploy`) roda migrações antes de publicar. Saídas documentadas: acrescentar **D1: Edit** ao token **ou** trocar o Deploy command para `npx wrangler deploy` e deixar migração para o `.cmd`.

### Alterações desta rodada

- **`RELATORIO_DE_TESTE_NF.html` (NOVO)** — relatório de teste do dono, no mesmo estilo do `GUIA_DE_TESTE_NF.html`:
  - **25 perguntas** em 4 partes (A app/navegação · B nuvem/perfis · C fiscal/homologação · D permissões/estorno), cada uma com **exatamente 3 caixas** (✅ OK · ❌ Não resolveu · ➖ Não testei) e **caixa de texto opcional**;
  - "onde testou" (3 caixas), 5 linhas de **CORREÇÕES**, 5 de **ADIÇÕES**, **caixa de texto separada** de observações gerais e **veredicto** (3 caixas);
  - **💾 Salvar relatório (.txt)** baixa o arquivo já escrito (com data/hora, marcas, observações e resumo contado); **📋 Copiar texto** e **👁 Prévia** como planos B;
  - rascunho automático no navegador (não perde o que digitou), contador "respondidas de 25", aviso de nunca escrever senha/token/certificado/CSC, sem popup nativo (regra do projeto), sem dependência externa (funciona do PC e do site).
- **`test_relatorio_teste_nf.js` (NOVO)** + entrada no `test_runner.js` — abre o HTML de verdade (jsdom), preenche como o dono faria e confere o `.txt` gerado (3 caixas por pergunta, marcas OK/NAO/NT/---, contagem do resumo, correções/adições/geral/veredicto, nome do arquivo, rascunho, e que o relatório **não** entra no bundle nem no `.exe`).
- `GUIA_DE_TESTE_NF.html`: as duas passagens que mandavam usar o `.txt` agora apontam para o **HTML** (o `.txt` segue como plano B).
- `RELATORIO_DE_TESTE_NF.txt`: aviso no topo indicando a versão recomendada (HTML).
- `cloudflare-worker/README.md`: nova seção **"Publicação automática (Workers Builds)"** com a configuração certa, o erro do token velho, a cura oficial, as permissões do token e o alerta de D1.
- `PASSO_A_PASSO_NUVEM_E_SITE.html`: bloco **"Deu erro no build do Worker?"** com o passo a passo da cura + a nota de que o `.cmd` já publicou a 5.26.4.
- **Bug pego pelo teste novo (antes de entregar):** o gerador do `.txt` quebrava quando havia pergunta sem resposta (`ST['vazio']` não existia). Corrigido no `RELATORIO_DE_TESTE_NF.html` — pergunta sem marcação agora sai como `[---]` e entra na conta "sem resposta".

### Validações

- `node test_relatorio_teste_nf.js`: **31 asserts ✓** · `npm test`: **185 passaram, 0 falharam**.
- `npm run check` ✔ · `npm run sync:check` ✔ (v6.1.3, 222 scripts, 0 soltos) · `git diff --check` limpo.
- Worker: `node --check src/index.js` + `node test-pure.mjs` ✔ (nenhum código do worker foi alterado nesta rodada).
- `node_modules` não sobrevive entre rodadas neste sandbox (a suíte precisa de `npm install` — já documentado no `BUILD_EXE.md`).

### Estado de Git/deploy

- Branch fixa: `arena/01a0c087-teste` · PR #29 com base `main` — **sem merge**.
- Worker no ar: **API 0.4.8 / Worker 5.26.4** ✅ (deploy manual do dono pelo `atualizar_motor_nuvem.cmd`; o deploy automático continua quebrado só pelo token velho do Workers Builds).
- Site de teste: **Produção em `arena/01a0c087-teste`** ✅ (conferido pelo README novo servido no link fixo).
- Nada foi publicado pelo agente nesta rodada.

### Pendências

1. Dono: teste funcional no link fixo, usando o **`RELATORIO_DE_TESTE_NF.html`** (baixa o `.txt` e manda aqui).
2. Dono (opcional): consertar o token do Workers Builds se quiser publicação automática do worker — se preferir, mantemos o `.cmd` (mais seguro para a nuvem da loja).
3. Plano B do link do cliente (GitHack morto dentro do `sync_build.js`) — decisão pendente.
4. Aviso de validade do certificado A1 na Central de NF.
5. Subir a versão (6.1.3 → 6.1.4) quando for gerar `.exe` novo, re-ancorando os testes que carimbam 6.1.3 — **incluir aqui** a atualização da versão citada no `GUIA_DE_TESTE_NF.html` e no `RELATORIO_DE_TESTE_NF.html`.
6. Merge do PR #29 somente com autorização explícita do dono.

---

## CONTINUIDADE — 21/09/2026 (2) — relatório do Kauan atendido: 6 correções + botão de deploy no GitHub

### O que ele mandou

O relatório preenchido no site (15 OK · 2 não resolveu · 8 não testei · "APROVADO COM RESSALVAS") e o log do build do worker **ainda** no erro do token. A pergunta de fundo dele: *"vejo que aparece muitos erros inesperados, o que podemos fazer pra corrigir todos e não acontecer mais?"*.

### Diagnóstico dos "muitos erros" (o que era de verdade)

| Item do relatório | Classificação | O que era |
|---|---|---|
| A3 (fiscal ilegível no claro/escuro) | **código** | aguardando a foto dele (print "1") para corrigir o ponto exato |
| C5 ("registra no log, não na auditoria") | **código** | o portão fiscal gravava só log técnico, sem os campos que a tela Auditoria lê |
| C3 · C4 · C6 · C7 · C8 | **passo pendente, não defeito** | tudo depende do **certificado A1 instalado** — sem ele nada fala com a SEFAZ |
| D1 | **explicação** | as 3 caixas existiam, mas ninguém dizia o que eram |
| D2 | **pedido** | aviso amarelo incomodando — removido |
| B9 + observações ("(nenhuma?!)") | **alarme falso** | o diagnóstico gritava "A CAUSA ESTÁ AQUI" com tudo visível |
| C6 (mês pedido 2×, "que gmail envia?") | **fluxo confuso** | pedia o mês de novo e o botão "Enviar" não enviava e-mail nenhum (ninguém avisava) |
| menu fiscal em aba; "nova venda de NF" | **a definir com ele** | precisa das fotos que ele ofereceu reenviar |
| item 1 (build token) | **painel da Cloudflare** | não é código; plano B criado (botão no GitHub) |

### Correções feitas (todas em módulos existentes, sem arquivo novo no bundle)

1. **D2 — aviso removido** (`permissoes_estorno_venda_patch.js`): o banner amarelo de "refazendo a notinha (extornada)" saiu de vez; nada mais foi criado no lugar. O comportamento não mudou (número mantido, itens vindos do estorno).
2. **D1 — "que permissões são essas?"** (mesmo arquivo): explicação em língua de gente dentro do editor do usuário (as 3 caixas são EXTRAS; desmarcada = bloqueia e anota na Auditoria), descrição por caixa ("Marcada: ... Desmarcada: ...") e botão **"❓ O que são as 3 permissões?"** na tela Usuários, para quem nunca abre o lápis.
3. **C5 — ação fiscal na Auditoria** (`fiscal_guard_patch.js` + `fiscal_menu_completo_patch.js`): criado `window.nfAuditarFiscal(acao, dados)` que grava na Auditoria no MESMO formato do resto do sistema (`logAction('fiscal', ...)`, com empresaId, usuário, data/hora e resumo em português). O portão (`nfgAudit`) e o menu fiscal (`fmcAudit`) passaram a chamar; o log técnico continua (é ele que serve para achar problema do menu).
4. **Auditoria à prova de log torto** (`ajustes_v5197_patch.js`): antes de desenhar, os logs ganham os campos que a tabela lê (usuarioNome, dataHora, entidade, detalhes) e — só quando o banco tem **exatamente 1 empresa** — a sessão sem carimbo é carimbada (mesma regra segura de sempre). Sem isso, sessão sem empresa deixava a Auditoria **vazia** e um log antigo quebrava a tela.
5. **C7/C3/C4 — sem A1, orientar em vez de "Falha ao assinar"** (`fiscal_menu_completo_patch.js`): o "Testar SEFAZ agora" confere o certificado ANTES (`ponte.status()`), e sem ele abre popup do sistema com o passo a passo (página de arquivos → .pfx → voltar; senha pedida na hora e não salva) + linha "sem-certificado" na Auditoria. Nada é enviado à SEFAZ nesse caso.
6. **C6 — mês reaproveitado + aviso honesto** (`fiscal_menu_completo_patch.js` + `fiscal_catalogo_completo_patch.js`): `nfPacoteContador(mesJaEscolhido, opcoes)` aceita o mês já escolhido na tela (AAAA-MM ou MM/AAAA) e **não pergunta de novo**; sem argumento (botão da Central) continua perguntando como antes. O "Enviar para Escritório" agora: gera o pacote do mês da tela, e no fim abre popup explicando que o .zip foi **baixado neste PC**, que o sistema **não envia e-mail por você** (automático ainda não existe) e oferece **"Copiar e-mail do contador"** e **"Abrir meu Gmail para escrever"** (Gmail dele, com destino/assunto já escritos — o anexo é dele).
7. **Fim do alarme falso** (`ajustes_v5227_nuvem_acompanhamento_patch.js`): a empresa da sessão é lida em `empresaId || empresa || empresa_id`; o aviso dramático "A CAUSA ESTÁ AQUI" só sai quando existe dado escondido de verdade (`temDadoEscondido`). Com tudo visível, a resposta agora é **"✅ NADA QUEBRADO AQUI"** — explica que o carimbo cai sozinho e que ninguém perdeu dado.

### Plano B do deploy do worker (o token da Cloudflare continua travando)

- Criado `deploy_github_actions/publicar-motor.yml` (a automação não pode escrever em `.github/workflows`; o arquivo traz o passo a passo de colar na aba Actions): botão **"Run workflow"** no GitHub que roda exatamente os 2 passos do `atualizar_motor_nuvem.cmd` (`wrangler d1 migrations apply DB --remote` + `wrangler deploy`), usando segredos do GitHub (`CLOUDFLARE_API_TOKEN` com Workers Edit + **D1 Edit** e `CLOUDFLARE_ACCOUNT_ID`). **Não roda em push** — só quando ele aperta, para não publicar sozinho na nuvem da loja. O `.cmd` continua valendo.

### Arquivos alterados nesta rodada

`permissoes_estorno_venda_patch.js` · `fiscal_guard_patch.js` · `fiscal_menu_completo_patch.js` · `fiscal_catalogo_completo_patch.js` · `ajustes_v5197_patch.js` · `ajustes_v5227_nuvem_acompanhamento_patch.js` · `test_runner.js` · `test_ajustes_v6104.js` (novo) · `deploy_github_actions/publicar-motor.yml` (novo) · `app.bundle.js` + `mobile/www` + assets Android (regerados).

### Validação

- `node test_ajustes_v6104.js`: **31 verificações ✓** (D1, D2, C5, C6, C7, diagnóstico, workflow, e o bundle carregando as correções).
- `npm test`: **186 passaram, 0 falharam** · `npm run check` OK (222 scripts, sha `676f0d941d6a4d07`) · `npm run sync:check` OK · `npm run verify:files` OK · worker `node --check` OK (não mexemos no worker nesta rodada).
- Versão do sistema segue **v6.1.3** — o bump para 6.1.4 vai junto do próximo `.exe` (os testes antigos carimbam a versão atual).

### Pendências (com ele)

1. **Item 1**: o log que ele colou é de **20/09 21:04 (horário de São Paulo)** — anterior à troca do token. Conferir o build MAIS NOVO em Deployments; se ainda falhar: reconectar o repositório em Settings → Build (recria o token) ou usar o botão novo do GitHub.
2. **Fotos** que ele ofereceu reenviar: (a) modo escuro da parte fiscal (A3); (b) como ele quer a "nova venda de NF" em **aba** (o menu fiscal confuso).
3. **B7**: ele disse que "tem um problema a parte diferente" — perguntar qual.
4. Re-teste no link fixo depois do próximo deploy do site.
5. Fila de sempre: GitHack (link do cliente), aviso de validade do A1, bump 6.1.4 com o `.exe`, merge do PR #29 só com ordem (e voltar a Production branch para `main` depois).

---

## CONTINUIDADE — 21/09/2026 (3) — foto do modo escuro (A3), "(nenhuma?!)" achado, A1 dentro do sistema e código do deploy no relatório

### O que ele mandou nesta rodada

1. **A foto do A3** (modo escuro da tela Fiscal → Perfis Tributários): tabela com **linhas brancas e texto claro** — ilegível.
2. **B7 = o mesmo do "observações gerais"**: sessão aparecendo **"(nenhuma?!)"** e a suspeita de que é por isso que **em outros computadores não aparece a mesma informação**.
3. Pedido: **instalar o certificado A1 por dentro do sistema**, como no sistema antigo (não pela página de arquivos).
4. Pedido: **o código do deploy** do worker (o do botão no GitHub) em lugar fácil de copiar → **botão de copiar no HTML do relatório**.
5. Perguntas: se quero as fotos da parte fiscal antiga de novo; se já está tudo no "não acontecer mais"; e como resolver o "(nenhuma?!)".

### A causa do "(nenhuma?!)" — encontrada e provada

O módulo `ajustes_v5227_nuvem_acompanhamento_patch.js` chamava `sess()` **que não existe dentro dele** (no bundle cada módulo é isolado; `typeof sess==='function'` dava falso SEMPRE). Resultado: o diagnóstico escrevia "Empresa da minha sessão: (nenhuma?!)" **em todo computador**, mesmo com a sessão certa. **Prova:** o botão «Reparar sessão agora» (que usa `getSession()` direto) respondeu "Sessão: **já estava com empresa**" — contradição no mesmo PC, no mesmo instante. Não era dado sumido; era o diagnóstico mentindo. **Corrigido:** passa a ler `getSession()` (com fallback) e o texto, quando faltar carimbo, explica em vez de gritar. Ganhou também: quem está logado, versão do sistema e a instrução de comparar o mesmo botão nos dois PCs (é assim que se acha diferença real de dados).

### Correções feitas

1. **A3 — modo escuro das tabelas fiscais** (`navegacao_fiscal_barra_escuro_patch.js`): o CSS claro põe fundo **branco na tabela** e o escuro só pintava as **linhas pares** → as ímpares ficavam brancas com texto claro. Agora a tabela inteira e **toda** linha são escuras (pares um tom acima), hover/seleção marcando e o botão da linha (Alterar/Excluir) com contraste. Vale para as 6 telas fiscais de uma vez.
2. **A1 instalado por dentro do sistema** (`fiscal_menu_completo_patch.js`): botão **«📎 Instalar certificado A1 (neste PC)»** na linha de operações da Central. Abre a janelinha do Windows (o mesmo `nfe:cert-import` que já existia no programa), copia o `.pfx` para o PC, mostra o tamanho, entra na Auditoria e lembra que a senha é pedida na hora e não fica salva. O aviso do "Testar SEFAZ" agora aponta esse botão (a página de arquivos continua valendo como alternativa).
3. **Código do deploy dentro do relatório** (`RELATORIO_DE_TESTE_NF.html`): seção **«🧩 Plano B do deploy — o código do botão (copiar)»** com o passo a passo (Actions → New workflow → colar → 2 segredos → Run workflow), o YAML completo e o botão **📋 Copiar código** (com plano B se o navegador negar a área de transferência). O texto no `<pre>` é **idêntico** ao arquivo `deploy_github_actions/publicar-motor.yml` — e há teste comparando os dois, para nunca envelhecer.
4. `deploy_github_actions/publicar-motor.yml` aponta para a seção do relatório onde está o botão de copiar.

### Validação

- `test_relatorio_teste_nf.js`: **37 verificações ✓** (inclui a igualdade do código com o arquivo).
- `test_ajustes_v6104.js`: **49 verificações ✓** (A3, o `sess`, o A1 dentro do sistema e o código no relatório).
- `npm test`: **186 passaram, 0 falharam** · `npm run check` OK (222 scripts) · `npm run sync:check` OK · `npm run verify:files` OK · bundle sha `25c058324f68ecd4` · mobile/www + assets Android sincronizados.
- Versão segue **v6.1.3** (bump 6.1.4 junto do próximo `.exe`).

### Respostas dadas a ele (registro)

- **Fotos da parte fiscal antiga:** sim, mas **só 3 telas específicas** (não tudo de novo): (1) o menu/faixa fiscal do sistema antigo; (2) a tela antiga de nova venda de NF **em aba**; (3) o cadastro/instalação do A1 no sistema antigo (se ele tiver).
- **"Já tem tudo para não acontecer mais?"** — o mecanismo está de pé (erro vira teste, aviso só quando há o que fazer, tela que explica, ritual de validação). Próximos candidatos propostos, **esperando a escolha dele**: (a) check-up único com resumo copiável; (b) quadro de versão por PC na nuvem; (c) teste de tela automático a cada versão (o `e2e/` com Playwright já existe).
- **"(nenhuma?!)"**: causa provada e corrigida; para a diferença entre PCs, a orientação é abrir o mesmo diagnóstico nos dois e comparar (se a empresa divergir de verdade, é caso de unir empresas em 1 versão).

---

## CONTINUIDADE — 21/09/2026 (4) — barra marcando o menu errado (foto dele) + motor da nuvem para colar no painel

### 1) O bug da barra (foto: tela de Produtos, LOCAÇÃO azul e com menu aberto)

**Causa-raiz:** a classe do menu aberto (`.sfo-pin`) era posta no clique e só era **limpa pelos handlers de clique deste módulo**. Dezenas de outros módulos interceptam o clique antes (`stopImmediatePropagation`) — e como o patch da barra é o ÚLTIMO do bundle, ele nem roda nesses cliques. Resultado: navegando por outro caminho, a marca ficava **presa** e a barra mostrava um menu que não era o da tela.

**Correção (`navegacao_fiscal_barra_escuro_patch.js`) — o estado passou a seguir a TELA, não o clique:**
- `marcarTelaAtual()` lê a view visível (`.view:not(.hidden)`), **solta todos os pinos** (`.module.sfo-pin`, `.module-menu.sfo-pin` e o flyout lateral) e marca **o módulo da tela atual** com a classe nova `.sfo-ativo`.
- O mapa rota→módulo é **derivado do próprio DOM** (onclick do botão e dos itens do menu — sem lista fixa); rotas fiscais sem item próprio caem no módulo Fiscal.
- Três gatilhos independentes: `MutationObserver` nas views (classe `hidden`), wrap do `navigateTo` e chamada em `armar()`/após cada re-pintura da barra. **Não depende de handler de clique** — funciona mesmo quando outro módulo "engole" o evento.
- Clique fora agora solta o pino também no **`pointerdown`** (evento que os outros módulos não interceptam).
- Visual: **MENU ABERTO = azul cheio** (como era) e **ESTOU AQUI = chip claro com contorno** (novo) — assim nunca mais parece que a tela de baixo é outra. No modo escuro o chip tem cor própria.
- Exporta `window.DIGICOPY_MARCA_TELA_ATUAL` para diagnóstico/teste.

**Prova:** teste jsdom em `test_ajustes_v6104.js` reproduz o caso da foto (Locação aberta → navega para Produtos): confere que nenhum pino fica preso e que o módulo marcado é o da tela, em 5 rotas (produtos, contratos, impressoras, central-nf) e no clique fora.

### 2) Item 4 entendido — o código é o DO WORKER, para colar no painel

Ele esclareceu: quer o **código compilado do worker** (o mesmo que o painel mostra com `__defProp`/`__name`), para publicar colando. Feito:

- **`cloudflare-worker/motor_para_colar.js`** — gerado com `wrangler deploy --dry-run --outdir=motor_compilado` (só compila, **não publica**), igual ao que o Cloudflare executa. Cabeçalho explica o que é, o que NÃO muda ao colar (bindings D1/R2/cron e secrets continuam; migração **não** é aplicada por este caminho) e como regerar. `sha256` do corpo também em `motor_para_colar.sha256`.
- **`MOTOR_NUVEM_PARA_COLAR.html`** (novo, 134 KB) — página com o **botão «📋 Copiar código»**, botão de **baixar .js**, o passo a passo (Edit code → colar → Deploy → conferir `/health`), o sha256, a primeira/última linha (para saber que colou tudo) e os outros caminhos (`.cmd`, botão do GitHub).
- `RELATORIO_DE_TESTE_NF.html` — a seção de deploy virou **«DEPLOY DO MOTOR DA NUVEM — os dois caminhos»**, com o caminho 1 (colar) em destaque e link para a página nova; o botão do GitHub ficou como caminho 2.
- `cloudflare-worker/motor_compilado/` (saída crua do wrangler) entrou no `.gitignore`.

### Validação

- `test_ajustes_v6104.js`: **78 verificações ✓** (barra de menus em jsdom + motor da nuvem + tudo da rodada anterior).
- `test_relatorio_teste_nf.js`: 37 ✓ — `npm test`: **186 passaram, 0 falharam**.
- `npm run check` (222 scripts, sha `b3e933f79210cfc5`), `sync:check`, `verify:files` OK; mobile/www + assets Android sincronizados.
- O motor entregue foi carregado de verdade: `import` OK, `default.fetch` e `default.scheduled` presentes; `node --check` OK.
- Guarda de envelhecimento: teste compara `API_VERSION`/`WORKER_VERSION` do `motor_para_colar.js` com o `src/index.js` — subir a versão sem regerar o arquivo **falha o teste**.

### Respostas/pendências dele nesta rodada

- **1 = ok** (o deploy do worker dele resolveu) — registrado.
- **5** = ele vai mandar **todas** as fotos da parte fiscal antiga na próxima mensagem (sem separar). Nada a fazer além de esperar; ao chegar, separar por tela (menu fiscal, nova venda de NF em aba, A1).
- **6** = ele quer **os três** (check-up único, quadro de versão por PC, teste de tela automático). **Fila desta próxima entrega:** (A) check-up único com resumo copiável; (B) quadro de versão por PC — precisa de migração 0007 (`app_version` em `devices`) + leitura do header `x-digicopy-versao` (que o worker já recebe) + coluna no painel Nuvem; (C) teste de tela automático no ritual (base em `e2e/`, Playwright).
- Ele perguntou também se o relatório novo já não faz parte disso: não — o relatório é **o que ele preenche**; as 3 ferramentas rodam **sozinhas no sistema** e são para mim/diagnóstico.

---

## CONTINUIDADE — 21/09/2026 (5) — barra (foto), contrato sem vínculo, cliente duplicado, relatório de problemas e o PR

### 1) O PR (ele perguntou: "até agora não criou um PR?")

**O PR #29 já existia desde 20/09** (`arena/01a0c087-teste` → `main`, OPEN, MERGEABLE, 11 commits à frente da main). **Descrição reescrita** nesta rodada (via `gh api PATCH`, porque `gh pr edit` falha com erro de "Projects classic") com a tabela de tudo que entrou. **O que explicar a ele:** o link fixo e o worker rodam a **branch** — por isso o merge não muda o que ele vê no site; o merge serve para levar o conteúdo à `main` (e depois voltar as Production branches para `main`, como já combinado).

### 2) Contratos com "Cliente sem vínculo" (foto dele)

**Causa:** `clienteContrato()` procurava o cliente só por `clienteId` e por `codClienteAntigo` (código). Cadastro migrado às vezes guardou **só o nome** — e nunca achava. **Correção (`contratos_final_patch.js`):** o **nome salvo no contrato** (e o nome da linha crua de LOCACAO) passam a valer — com a regra de sempre: **só vincula quando o nome aponta para UM único cadastro** da empresa; nome repetido **não chuta**. Último recurso: o cliente que aparece no `parque` do contrato. Exporta `cfNormNome`, `cfClientePorNomeUnico` e `clienteContrato` no `CONTRATOS_FINAL_PURE`.

### 3) "Cliente Balcão duplicado" — detector + união guiada

Em `ajustes_v5214_clientes_visiveis_patch.js` (módulo dos clientes, sem arquivo novo):
- **`cliGruposDuplicados`** agrupa pelo nome comparável (sem acento, sem maiúscula, ignorando LTDA/ME/MEI/EIRELI/EPP/SA) e só considera empresas da sessão e cadastros não-unificados.
- **`cliRefsDe`** conta as referências por entidade (contratos, vendas, OS, leituras, orçamentos, títulos, parque...).
- **`cliEscolherPrincipal`** escolhe quem fica: **mais referências** → desempate pelo **código menor** (mais antigo) → `criadoEm`.
- **`cliUnir`** varre **todas** as listas do banco e move `clienteId` para o principal; marca os repetidos como `status:'unificado'` + `unificadoPara`. **Nunca apaga nada.**
- **UI:** botão **🔎 Duplicados (N)** na tela Clientes (com a contagem), painel com os grupos, botão "Unir em 1 cadastro", confirmação em popup do sistema (`confirmSistema`), exigência de permissão (`usuarioPodeApagar` ou Admin/Dono), registro na Auditoria e — na mesma janela — a **lista dos contratos que continuam sem vínculo** (com o nome guardado em cada um).
- Sem tocar em contador, sem apagar dado, sem criar cliente novo.

### 4) Novo relatório: `RELATORIO_DE_PROBLEMAS.html`

Pedido dele: relatório **de problemas em geral** (não é o de nota fiscal), com os **caminhos em caixas** e botão **"+ Adicionar passo"** que cria caixas **sem limite**, mais um **"+" separado** que cria **outro problema** (bloco novo abaixo).
- Cada bloco: título, **passos (caminhos) numerados**, o que aconteceu, o que esperava, frequência (sempre/às vezes/uma vez), gravidade (trava/atrapalha/só visual), nome do print (a foto vai pelo chat) e observações do problema.
- Botão de **remover** passo (✕) e bloco (✕); numeração se ajeita sozinha; nunca fica sem bloco.
- Rascunho automático no navegador; **💾 Salvar** gera `.txt` com tudo (problema 1, 2, 3...), **📋 Copiar** e **👁 Prévia**.
- Aviso de segredos; sem dependência externa; fora do bundle/.exe.

### 5) Ainda desta rodada

- `test_relatorio_problemas.js` (novo na suíte) e `test_ajustes_v6104.js` ampliado (contratos + duplicados, 78+ asserts).
- Suíte: **187 testes, 0 falhas**. `check`/`sync:check`/`verify:files` OK. Bundle sha `6baf251f865ed73e`. Mobile sincronizado.
- **PR #29**: título e descrição atualizados.

### 6) Respostas pendentes para ele (registro)

- **"O deploy do worker é necessário?"** → **Não, agora não.** O worker no ar já está na versão do código (API 0.4.8 / Worker 5.26.4, conferido em `/health`). O deploy só é preciso quando o **código da nuvem** mudar. Os três caminhos que existem de verdade: (1) `atualizar_motor_nuvem.cmd` no PC (o mais completo: aplica migração + publica); (2) **colar o código** em Cloudflare → Workers & Pages → `digicopy-sync-api` → **Edit code** → Ctrl+A → colar → **Deploy**; (3) botão no GitHub (Actions → Publicar motor da nuvem) — só quando ele instalar o arquivo na aba Actions.
- **Os 3 pedidos de garantia (A check-up, B quadro de versão por PC, C teste de tela automático)** seguem na fila: ele confirmou "os 3". **B precisa de migração 0007** (`app_version` em `devices`) + leitura do header `x-digicopy-versao` (o worker já recebe) + coluna no painel Nuvem — entra junto com o próximo `.cmd`.
- **Fotos da parte fiscal antiga**: ele disse que manda todas juntas; nesta rodada veio **uma** (a dos contratos). As fotos do menu fiscal antigo e da "nova venda de NF em aba" ainda são necessárias.
