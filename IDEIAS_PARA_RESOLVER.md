# IDEIAS PARA RESOLVER O PROBLEMA DO SISTEMA ORIGINAL

**Data:** 24/09/2026 · **Autor:** manutenção técnica (Arena) · **Versão do sistema:** 7.0.12 · **Motor:** 5.26.8

Este documento é o que o dono pediu: **ideias**, sem compromisso, para resolver o problema do sistema
que já existe. Nada aqui foi feito ainda. Cada ideia diz: o que resolve, como seria, quanto custa, qual
o risco, e se bate de frente com alguma regra dele.

> Regra deste documento: **nenhuma ideia vira trabalho sem ele escolher.** O núcleo novo foi apagado a
> pedido dele; não vou começar outro por conta própria.

---

## 1. O diagnóstico (medido hoje, não é opinião)

Rodei a medição nos arquivos que **entram de verdade** no `app.bundle.js` (a lista do
`bundle-manifest.json`, que é a ordem em que tudo carrega):

| O que medi | Número | Por que isso importa |
|---|---|---|
| Arquivos `.js` na raiz | **482** | muita coisa para um sistema mantido por uma pessoa |
| Entram no `app.bundle.js` | **225** | cada um pode redefinir o que o outro fez |
| Definições de função global (`window.X = ...`) nos 225 | **1.100** | cada definição **sobrescreve** a anterior em silêncio |
| Nomes definidos em 4 ou mais arquivos | **63** | `navigateTo` **33×**, `showApp` 22×, `renderConfig` 19×, `renderVendas` 17×, `openModalChamadoCompleto` 16×, `renderFinanceiro` 16× |
| Escritas de HTML na mão (`innerHTML`/`outerHTML`) | **706**, em 123 arquivos | onde nasce tela torta / botão mudo |
| Gravações espalhadas (`saveDB`/`db.save`) | **246**, em 109 arquivos | **não existe um lugar só que grava** |
| `localStorage`/`sessionStorage` | **112**, em 24 arquivos | estado que vive fora do banco |
| Vigias permanentes (`setInterval`) | **35**, em 32 arquivos | coisa rodando de fundo o tempo todo |
| Esperas curtas para "dar tempo" (`setTimeout` ≤ 50 ms) | **44**, em 40 arquivos | a ordem das coisas depende do relógio |
| `confirm()` nativo | **35**, em 20 arquivos | a janela feia do navegador (parte está embrulhada no popup do sistema) |
| `prompt()` nativo vivo | **0** | as 5 ocorrências são comentários contando que foi corrigido (regra 16 de pé) |
| Telas no `index.html` | **14** (`view-*`) | o sistema inteiro dele |
| Testes automáticos que rodam hoje | **217 em ~36 s** | a rede de proteção existe e é barata |

**O problema central, em uma frase:** o sistema funciona por **camadas que se sobrescrevem**. O mesmo
nome (`renderVendas`, `navigateTo`, `vosGerarHtmlNotinha`) é reescrito por 10, 17, 33 arquivos
diferentes — e **quem ganha é o último que carrega**. Quando algo quebra, ninguém consegue dizer "foi
esta linha": a resposta honesta é "foi a última camada que mexeu nesse nome". Foi assim que já
apareceram, nesta auditoria, caso do `proximoNumeroVendaLimpo` (função viva que não está no caminho) e
do `notinha_patch.js` (arquivo inteiro que ninguém chama). **Não é desleixo:** é o resultado natural de
anos de correção em cima de correção, e cada correção foi legítima no dia em que foi feita.

Consequência prática: **cada defeito novo custa horas** e o risco de consertar uma coisa e quebrar
outra é alto — não pelo sistema ser grande, mas por não haver onde "encostar" a mudança.

---

## 2. As ideias

Todas as ideias são para o sistema **que ele usa hoje**. Nenhuma troca de banco, de linguagem ou de
motor. Estão em ordem de **retorno pelo esforço**.

### A) Guarda-corpo: transformar as reclamações dele em teste (antes de mexer em qualquer coisa)

- **Problema que resolve:** hoje, quando ele diz "isso voltou a dar problema", o conserto é na sorte.
- **Como seria:** para cada reclamação que já apareceu (dado que sumiu, botão que ficou mudo, tela que
  não abriu, chat que falha, venda que não grava), escrever **um teste que reproduz aquilo**. O sistema
  já tem 217 testes e roda em 36 segundos; o custo de acrescentar é baixo.
- **Custo:** 1 a 2 rodadas. **Risco:** quase zero (teste não muda o sistema).
- **Regra dele:** nenhuma em conflito. É o único caminho honesto para "não prometer zero defeito, mas
  provar o que foi corrigido".
- **Por que é a primeira:** sem isso, todo conserto é aposta.

### B) Limpeza do que está morto *com prova* (o que ele já autorizou)

- **Problema que resolve:** 482 arquivos para 225 espaços de carga; parte do código não está no caminho
  vivo e confunde todo mundo (inclusive eu).
- **Como seria:** listar arquivo por arquivo, com **prova** de que ninguém chama (nenhum `onclick`, nenhum
  override posterior, nenhum teste que dependa), e só então arquivar/remover — em blocos pequenos, um
  commit por bloco, com a suíte rodando antes e depois.
- **Custo:** 1 rodada por bloco (dá para fazer 3 a 5 blocos numa rodada). **Risco:** médio — por isso a
  prova e o commit separado para poder voltar.
- **Regra dele:** ele autorizou deletar código morto. **Exceção:** código que existe só para consertar
  outro comportamento **não é morto** — e é exatamente onde eu erro se for rápido demais.

### C) Um mapa: "quem define o quê, e quem carrega por cima de quem"

- **Problema que resolve:** os 1.100 nomes globais e os 63 repetidos. Hoje responder "onde está o
  `navigateTo` de verdade" exige ler 33 arquivos.
- **Como seria:** um **relatório gerado** (script no próprio repositório) que lista, para cada nome
  global, todos os arquivos que o definem, na ordem de carga, marcando **qual é o que está valendo**.
  Sai um `MAPA_FUNCOES.md` atualizado a cada build.
- **Custo:** meia rodada. **Risco:** quase zero (é só leitura).
- **Valor:** é o que transforma "33 camadas" em "33 camadas listadas" — e é a base para as ideias D a F.

### D) Trava contra o defeito mais caro: "quem ganha" em cada nome

- **Problema que resolve:** um patch novo redefine uma função antiga **e esquece de reaproveitar** o que
  ela fazia (ex.: o embrulho do popup do sistema, o gate de permissão, a baixa de estoque). O defeito
  aparece depois, longe do lugar onde foi causado.
- **Como seria:** um teste que lê o mapa da ideia C e **recusa** um arquivo novo que redefine algum nome
  já definido **sem** citar a função antiga dentro dele (`orig`, `anterior`, `viva`, etc.) ou sem um
  comentário dizendo o que foi preservado. É um aviso na hora de escrever, não um bloqueio no uso.
- **Custo:** 1 rodada. **Risco:** baixo (o teste só olha arquivo; o sistema não muda).
- **Regra dele:** nenhuma. Continua valendo "preservar antes de corrigir" — só passa a ser cobrado
  automaticamente.

### E) Um lugar só que grava (o "portão de gravação")

- **Problema que resolve:** **246 lugares** gravam direto. Quando um dado some/volta/duplica, não existe
  registro de quem gravou. Já apareceu nesta auditoria o caso do dado que ia para a fila errada e o do
  delete da nuvem que virava exclusão — dois sintomas do mesmo buraco: **não há portão**.
- **Como seria:** criar **uma função única de gravação** (`salvarAlteracao(lista, registro, motivo)`) que
  anota quem mudou, quando e por qual tela, e que fala com a nuvem. Os 246 pontos **não** mudam de uma
  vez: a função nova entra primeiro **por baixo** (o portão existe e registra), e os pontos migram em
  blocos, com teste comparando o antes e o depois de cada bloco.
- **Custo:** 1 rodada para o portão + 4 a 6 blocos de migração. **Risco:** médio (é o caminho do dado) —
  mitigado por blocos e pela suíte.
- **Regra dele:** **não** fere o "só nuvem" (a fila e o envio continuam por nuvem; nada vai para o PC
  do jeito que ele proibiu). Fere sim, se feita errada, a regra de ouro dele: não quebrar o que funciona
  — por isso entra por baixo e por partes, medindo.
- **Ganho colateral:** resolve a maior parte do "dado que some" e do "dado que volta".

### F) Fim da "espera cega" (relógio mandando no lugar do evento)

- **Problema que resolve:** 44 `setTimeout` curtos e 35 vigias permanentes. Duas coisas que dependem de
  tempo quebram quando a máquina está lenta (ou mais rápida), e é o tipo de defeito que só aparece na
  loja dele, no meio do movimento.
- **Como seria:** cada caso vira **evento** ("depois que a venda gravou, redesenha a lista") em vez de
  "espera 30 ms e torce". Os vigias permanentes viram eventos de verdade e ficam só os que precisam
  (ex.: acompanhar a nuvem).
- **Custo:** 2 a 4 rodadas, em blocos. **Risco:** médio. **Prioridade:** depois de A, B e C.

### G) Botão que aparece = permissão que confere no clique

- **Problema que resolve:** hoje há casos em que o botão aparece e a permissão é conferida depois (ou
  não é). Já está registrado como pendência o caso do **estornar venda**: existe um patch que esconde o
  botão de quem não tem a permissão.
- **Como seria:** uma tabela **ação → permissão** e uma conferência **no clique** (não só na hora de
  desenhar a tela), com aviso claro "sem permissão" pelo popup do sistema.
- **Custo:** 1 rodada para montar a tabela + 1 para aplicar. **Risco:** baixo/médio (pode esconder algo
  que ele usa hoje — por isso a tabela sai primeiro, para ele conferir).
- **Regra dele:** as **senhas estão encerradas** — isso continua. Aqui é permissão de ação, não senha.

### H) Desempenho medido, não chutado

- **Problema que resolve:** "o sistema fica lento" é queixa que não dá para resolver por palpite.
- **Como seria:** instrumentar **3 números que ele sente**: tempo para abrir cada tela, tempo para
  gravar uma venda, e tamanho do banco no aparelho. Com o número na mão, otimizar o que dói (provavelmente
  é desenho de tela grande e busca em lista inteira).
- **Custo:** meia rodada para medir + blocos para resolver. **Risco:** baixo (medir não muda nada).
- **Regra dele:** "sem otimização antes da hora" — é exatamente o que isto respeita: medir primeiro.

### I) Nuvem com fila explícita e "quem mudou"

- **Problema que resolve:** a nuvem hoje é acionada por interceptação da gravação. Dois aparelhos na
  mesma empresa podem se atropelar; e quando algo volta, não se sabe de onde veio.
- **Como seria:** cada mudança vira um **item de fila com dono** (aparelho, usuário, horário) e a
  reconciliação decide por regra escrita (a mesma ideia de lápide que ele já usa: nada volta sozinho).
- **Custo:** 2 a 3 rodadas. **Risco:** alto (é o caminho dos dados dele) → só depois de A, B, C e E.
- **Regra dele:** **respeita** o "SÓ NUVEM" (r11) e o "nada salvo no PC". É o mesmo desenho, com rastro.

### J) Backup e "voltar atrás" em um clique

- **Problema que resolve:** ele já pediu backup de emergência antes de qualquer virada, e tem razão. Hoje
  o rollback depende de procedimento manual.
- **Como seria:** um snapshot automático (diário e antes de qualquer mudança grande) com botão de
  **voltar para o snapshot anterior**, e o registro de qual versão do sistema gerou aquele snapshot.
- **Custo:** 1 a 2 rodadas. **Risco:** baixo. **Regra dele:** é o que ele já pediu — nada de zerar nada.

### K) Se um dia trocar uma peça de lugar, trocar **por dentro** — nunca ao lado

- **Problema que resolve:** a lição do núcleo novo, que ele mandou apagar com razão. Construir um sistema
  paralelo parece limpo, mas produz **duas verdades** para o mesmo dado: qual está certo? No dia da
  virada, ninguém sabe. E esteve a um passo de virar problema real (a mesma lista `contasReceber` com
  dois formatos diferentes, um na venda e outro no financeiro).
- **Como seria (se ele quiser trocar alguma peça):** a peça nova entra **no lugar da antiga**, atrás de
  uma chave de ligar/desligar por tela, com um teste que compara a peça nova com a viva **caso a caso**
  (foi assim que provei que o copia-e-cola do Pix saía igual byte a byte, e a conta da leitura igual).
  O sistema antigo continua ali como plano B **até** a chave virar — na mesma base de dados, sem cópia.
- **Custo:** depende da peça. **Risco:** controlado por comparação.
- **Regra dele:** é a única forma de trocar algo grande sem ferir o "não quebrar o que funciona".

### L) Um jeito de ele me mandar "o que quebrou" em 1 clique (sem trazer o botão do rodapé de volta)

- **Problema que resolve:** quando ele relata "o chat falha"/"deu erro", eu quase sempre tenho o sintoma
  e não a causa. Um pacote com os últimos erros + a tela + a versão economiza rodadas inteiras.
- **Como seria:** o sistema **já escreve** registros de erro (é o mecanismo do `erro.txt`); a ideia é
  juntar os últimos N com a versão e o nome da tela num pacote só, acionado de um lugar que **não** seja
  o rodapé (o botão do rodapé foi removido a pedido dele e **não volta**).
- **Custo:** meia rodada. **Risco:** baixo. **Regra dele:** respeitada (nada de senha, token ou dado
  sensível no pacote — só erro, tela, versão e horário).

---

## 3. Ordem que eu recomendo (se ele disser "vai")

1. **A + B + C** (prova primeiro, limpeza com prova, mapa das camadas) — é o que devolve previsibilidade.
2. **D** (trava contra sobrescrever esquecendo o que existia) — segura o defeito mais caro.
3. **E** (portão de gravação) — é o que resolve "dado some/volta" na raiz.
4. **G + H + J** (permissão, medir desempenho, backup/rollback) — curto prazo e risco baixo.
5. **F + I** (fim das esperas cegas, fila da nuvem com dono) — mais fundo, só depois do resto.

---

## 4. Ideias que **batem de frente** com as regras dele (ele pediu para eu falar)

Ele autorizou falar tudo, inclusive o que as regras dele não deixam. Estas são as que **não** dá para
fazer do jeito "normal", e o motivo:

| Ideia comum no mercado | Por que **não** dá aqui | O que dá para fazer no lugar |
|---|---|---|
| Banco de dados de verdade (Postgres/MySQL) com servidor | troca de tecnologia e de motor; o motor de nuvem dele (5.26.8) é a fonte da verdade hoje | manter o motor e melhorar a fila/lápide (ideias E e I) |
| Guardar cópia local do banco no PC/navegador | **contra a regra dele (v6.1.5/44 — "só nuvem")** | portão de gravação + fila com dono (E, I) |
| Refazer o sistema do zero, ou em paralelo | foi o que ele mandou apagar agora; gera duas verdades | trocar peça por dentro, atrás de chave, com comparação (K) |
| Mexer no app de celular / APK | **pausado por ordem dele**; só a parte mecânica do build vale | nada — mobile segue parado |
| Mexer na emissão fiscal direto | **regra 22:** homologar antes; imposto errado é o único erro que não se conserta | homologação primeiro, quando ele mandar |
| Publicar/deploy de produção | **é dele** (o motor é publicado por ele) | eu preparo e testo aqui; publicação é o dono |
| Colocar senha/token/certificado em código, teste ou relatório | **proibido** (e é regra de segurança) | cofre + sinalizar rotação quando aparecer |
| Reabrir o assunto de senhas/trava de 15 min | **encerrado por ele** | seguir como está |

---

## 5. O que eu **não** recomendo (e por quê)

- **Outro núcleo/sistema paralelo.** Já tentamos, ele viu o custo e mandou apagar. Repetir seria gastar
  rodadas para criar de novo o problema das duas verdades.
- **Trocar tecnologia (framework, banco, linguagem).** Não é o problema: o problema é o acúmulo de
  camadas e a ausência de portão de gravação.
- **Renomear tudo / reorganizar arquivos em massa.** Dá a sensação de arrumação e quebra 217 testes de
  uma vez sem ganho para ele.
- **Otimizar sem medir.** Já está fora de cogitação pela própria regra dele.

---

## 6. O que eu preciso que ele responda (objetivo)

1. **Qual dor dói mais hoje:** (a) dado que some/volta, (b) tela/botão que falha, (c) lentidão,
   (d) conferência/permissão, ou (e) tudo misturado? Isso muda a ordem de tudo.
2. **Onde ele usa de verdade:** no `.exe` (PC da loja), no site, ou nos dois? (há coisas que só aparecem
   no `.exe`, como a limitação da janela nativa).
3. **Autoriza as ideias A, B, C e D** (prova, limpeza com prova, mapa das camadas e trava contra
   sobrescrever)? São as de menor risco e destravam o resto.
4. **O "portão de gravação" (E) pode entrar por baixo**, medindo e migrando por blocos? É o que resolve
   o dado que some — mas é o caminho do dado, então quero a palavra dele.

*(Sem essas respostas eu sigo com A, B e C, que são leitura/teste e não mudam o funcionamento.)*
