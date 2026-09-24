# PLANO — REDESENHO DO DIGICOPY

**24/09/2026 · documento de decisão.** Nada foi apagado nem trocado: esta rodada só mediu,
diagnosticou e propôs. **O que eu preciso de você está no item 9.**

---

## 1) O que você me autorizou

Seu pedido, literal: *"eu dou a permissão de você redesenhar TUDO novamente, pode fazer tudo
denovo, os dados que contenho não são necessários, e pode me falar o que precisa, pode
redesenhar TUDO, porém aí tem que fazer funcionar sem NENHUM problema, qualquer coisa pode
pedir pra mim o que precisar"*.

Isso **revoga** a regra antiga de "não reescrever o projeto" — a partir de agora eu posso
propor reconstrução. O que **não** foi revogado, e eu vou continuar seguindo:

- **nada de operação destrutiva nem apagar base** sem você mandar;
- **nada de deploy de produção** sem você mandar (a nuvem quem publica é você);
- **não quebrar o que funciona hoje**, em nenhum passo;
- tudo na branch desta sessão, com registro no `RELATORIO_SESSAO.md`.

E uma coisa que eu preciso te dizer antes de qualquer coisa, com honestidade:
**"funcionar sem NENHUM problema" é o objetivo, mas ninguém entrega 150 mil linhas de
software com zero defeito — nem eu, nem nenhuma equipe.** O que **dá** para garantir, e é
o que eu proponho aqui: **nada do que você usa hoje para de funcionar em nenhum momento**,
cada pedaço novo só entra **provado por teste**, e o sistema novo é **menor** (quanto menos
peça, menos lugar para dar problema). Se eu te prometesse "zero defeito", estaria mentindo
— e você já me pegou uma vez inventando coisa, não quero repetir.

---

## 1.1) AS SUAS DECISÕES (24/09/2026) — e o que muda no plano

**Sua pergunta, direta: *"daria certo refazer do zero mas seguindo a mesma temática que
foi feita a anterior?"* — Sim, dá certo, e é assim que eu vou fazer.** "Temática" aqui é a
cara que você conhece: **os mesmos nomes de menu, as mesmas telas, o mesmo padrão visual,
os mesmos fluxos** (o link do orçamento, o WhatsApp, o modal do sistema). O que muda é o
**miolo** — e é exatamente aí que mora a causa dos problemas de hoje (item 3). Você **não**
vai reaprender a usar o sistema.

| Sua resposta | O que fica decidido | Onde eu registro |
|---|---|---|
| "refazer do zero, mesma temática" | reconstrução do zero, **mantendo telas, nomes e fluxos** | `REDESENHO_BLUEPRINT.md` |
| "uso tudo, incluindo o fiscal" | **fiscal entra já** — começando em **homologação** (nota de teste, sem valor fiscal). Produção só com a palavra `PRODUCAO` e a sua ação: isso é regra fiscal, não escolha minha (item 22 das `REGRAS_PERMANENTES.md`) | blueprint, item 3 |
| "prefiro de uma vez, mas se for bom fazer por fase pra eu explicar ela, eu falo pra você" | **construção por partes, virada da chave UMA vez só** (o de hoje fica no ar até lá). Quando um pedaço ficar pronto eu te mostro e **você decide se quer testar** — você não é obrigado a testar pedaço nenhum | fases, item 7 |
| "dá um backup de emergência e depois zera, **MAS ANTES eu preciso ter esse backup**" | **o backup vem primeiro e fica na sua mão.** Enquanto você não tiver o arquivo guardado, **nada é zerado** — e quem faz o arquivo é você, pelos botões que já existem no sistema (eu não tenho acesso ao banco de produção) | item 9 |

**Resposta ao seu motivo** ("assim você tem mais controle e mais noção de onde vem o
problema"): é exatamente isso que eu ganho com o sistema menor — **um mapa** (o
`REDESENHO_BLUEPRINT.md`, item por item) e **uma regra escrita uma vez só**. Hoje a mesma
regra (ex.: exclusão) está decidida em **82 pontos diferentes**; no novo, em um.

### O que eu NÃO vou fazer sem você mandar (nem agora, nem depois)

- **não zero nada** — nem aqui, nem na nuvem. O "zerar" só acontece na virada da chave,
  depois do backup estar **na sua mão**, e com você acompanhando;
- **não apago a base atual** — ela fica arquivada (nota fiscal precisa ficar guardável);
- **não publico nada em produção** — a nuvem quem publica é você;
- **não mexo no que está funcionando** no sistema de hoje enquanto o novo não estiver
  provado: as correções das rodadas 12 a 16 continuam valendo.

---

## 2) O que o sistema é hoje (medido agora, não é achismo)

| Medida | Número |
|---|---|
| Arquivos versionados no projeto | 702 |
| Arquivos `.js` na raiz | **482** |
| Peças de "remendo" (`*_patch.js`) | **219** |
| Telas/funções de tela no `app.js` | 26 |
| Linhas na raiz (js+html, sem o pacote) | 79.367 |
| Pacote único que o PC carrega (`app.bundle.js`) | 60.232 linhas |
| Motor de sincronização do PC | 2.067 linhas |
| Motor da nuvem (Worker) | 2.466 linhas |
| Arquivos de fiscal (NF-e/NFC-e e correlatos) | 13 (+27 com "nf" no nome) |

**Em uma frase:** um sistema grande, que cresceu **por camadas** — as telas de hoje são as
mesmas de sempre, mas o coração (dados + sincronização) foi remendado no lugar, com **219
arquivos de remendo** por cima.

---

## 3) Por que ele dá problema (a causa, com prova das rodadas)

Nenhum dos problemas graves das últimas rodadas estava na aparência do sistema — **todos
estavam no coração**:

- a **exclusão** é decidida em **82 pontos diferentes** do código (medido na rodada 16);
- na rodada 12, **6 caminhos diferentes** conseguiam ressuscitar um registro apagado;
- na rodada 15, a **recuperação automática** desfazia uma exclusão feita de propósito;
- na rodada 16, a nuvem montava uma **venda inteira a partir de um link público, sem teto**.

A causa é sempre a mesma: **a mesma regra está escrita em vários lugares** (ou em nenhum,
e cada tela faz do seu jeito). Quando eu conserto um lugar, preciso caçar os outros — e é
por isso que cada correção exige prova nova. **Refazer as telas não muda isso.** O que muda
isso é **um coração só**, com a regra escrita **uma vez**.

---

## 4) O que "apagar tudo e fazer de novo" resolve — e o que ele NÃO resolve

**Resolve:** a bagunça de camadas. Um sistema novo nasce com pouca peça e regra única.

**Não resolve, e ainda cria:**

1. **A loja para.** Enquanto o novo não existe, você fica sem sistema (meses, não dias).
2. **O fiscal é a parte mais cara de refazer.** NF-e/NFC-e tem regra de lei, homologação e
   histórico que não podem ser reinventados às pressas — é a última coisa que se mexe, não
   a primeira.
3. **Sistema novo nasce com defeito novo.** É da natureza da coisa: o defeito só aparece
   quando alguém usa.
4. **O que já funciona se perde.** Hoje você tem coisas que levam tempo para acertar
   (impressoras do contrato, leituras, orçamento com link, a própria nuvem). Jogar fora e
   refazer do zero é reabrir cada uma dessas feridas.

**Histórico fiscal:** as notas emitidas precisam ficar guardáveis por vários anos (regra
fiscal, não minha). Você disse que os dados não são necessários — respeitado —, mas a
**base atual eu não apago de jeito nenhum**: ela fica **arquivada**, parada, como está. Se
um dia precisar de uma nota antiga, ela existe. Apagar é a única coisa que não tem volta.

---

## 5) Os três caminhos (escolha sua — a recomendação é a **C**)

| | O que é | Bom | Ruim |
|---|---|---|---|
| **A** | Apagar tudo e refazer do zero, trocando num dia | fica tudo novo de uma vez | a loja para até ficar pronto; fiscal refeito na pressa; muito risco junto |
| **B** | Mesmas telas, coração novo | você não reaprende nada; risco baixo; a loja não para | leva mais rodadas; as telas antigas continuam feias por dentro |
| **C** ⭐ | **Sistema novo e menor, feito por partes, com o de hoje no ar** — o coração novo já nasce com as telas novas | nada para de funcionar; cada parte só entra provada; o sistema encolhe (fica só o que você usa); dá para desistir de um pedaço sem estragar o resto | é o caminho mais longo, e exige você me dizer o que usa |

**Minha recomendação: C.** É o único caminho em que você **nunca fica sem sistema** e em que
cada parte é provada antes de valer. "Maior e mais rápido" foi o que trouxe o sistema até
aqui; agora o ganho está em **menos peças**.

---

## 6) Como eu faria (a arquitetura alvo, em língua simples)

1. **Uma base só.** As listas que você usa (clientes, produtos, vendas, OS, orçamentos,
   contratos + impressoras, financeiro, leituras, chamados) com **um formato só** para cada
   coisa — hoje cada lista tem o seu.
2. **Cada registro com identidade clara:** id próprio, versão, e um **"apagado" explícito**
   (lápide). Acabou o "sumiu — será que volta?": apagado é apagado, e ponto.
3. **A tela nunca fala com a nuvem.** Ela lê e grava no núcleo; o núcleo cuida do resto.
   Hoje cada remendo fala com a nuvem do seu jeito.
4. **Sincronização de um caminho só:** manda o que mudou, puxa o que mudou, com carimbo e
   lápide. **Sem** varredura de lista inteira e **sem** "recuperação" que adivinha o que
   fazer (foi de onde saíram os piores defeitos).
5. **Mesma conta da nuvem e mesmo endereço.** Nada de token novo para você criar; a base
   nova nasce **ao lado** da atual, e a atual não é tocada.
6. **Mesma entrega de hoje:** o programa abre no PC como sempre; nada muda no seu jeito de
   usar.

---

## 7) Fases (cada uma entrega algo que funciona — nenhuma deixa a loja parada)

**Como fica com as suas decisões:** eu **construo por partes** (para cada parte ter teste e
poder ser conferida), mas a **virada da chave é uma só, no fim** — como você preferiu. O
sistema de hoje fica publicado e funcionando o tempo todo; a troca acontece num dia que
**você** escolher. Em cada parte pronta eu te aviso: se você quiser olhar naquele momento,
olha; se preferir ver tudo junto no fim, vê tudo junto.

| Fase | O que entrego | Como você confere |
|---|---|---|
| **0 · Agora** | plano + mapa do sistema (`REDESENHO_BLUEPRINT.md`) + **backup de emergência na sua mão** | lê e guarda o arquivo |
| **1** | núcleo novo no PC + as primeiras telas (clientes/produtos), funcionando **ao lado** do de hoje | abre os dois, compara (se quiser) |
| **2** | nuvem nova (mesma conta dele) + backup e sincronização pelo núcleo | vê sincronizar entre 2 PCs |
| **3** | telas do dia (vendas/OS/orçamento/financeiro) | usa (se quiser) |
| **4** | o resto (contratos + parque + leituras, chamados, painel do gerente) | usa e me diz o que faltou |
| **5** | fiscal (NF-e/NFC-e) em homologação | homologação antes de valer |
| **6** | **a virada da chave** — uma vez só, com você mandando; o antigo fica de consulta até você pedir para arquivar | você decide o dia |

---

## 8) Riscos × travas

| Risco | Trava que eu já vou aplicar |
|---|---|
| a loja parar | o sistema de hoje continua publicado e funcionando até **você** mandar virar a chave (fase 6) |
| perder histórico / nota fiscal | a base atual **não é apagada** — fica arquivada; nada de operação destrutiva sem sua ordem |
| defeito novo passar | cada pedaço só entra com teste; roda a suíte antes de trocar; teste que reproduz o defeito antes de consertar |
| você perder tempo testando coisa torta | te entrego o "o que testar" em 3 linhas, não uma lista de links |
| mexer sem você saber | tudo na branch desta sessão, com registro no `RELATORIO_SESSAO.md` |
| zerar antes de ter o backup | **regra dura:** nada é zerado antes de o arquivo estar na mão dele (a fase 0 só termina com isso confirmado) |

---

## 9) O que eu preciso de você (respostas e o backup — **nenhuma senha, nenhum token**)

1. **As 4 respostas da tela de perguntas** (escopo, o que você usa, forma da troca, dados).
   Sem elas eu estaria adivinhando — e adivinhar é o que não quero fazer.
2. **Depois da fase 1:** abrir o sistema novo um dia em paralelo e me dizer o que faltou.
   Isso vale mais do que qualquer teste meu.
3. **Na hora da virada (fase 6):** publicar o motor da nuvem, do jeito que você já sabe
   (`atualizar_motor_nuvem.cmd`, ou colar no painel, ou o botão no GitHub).

## 10) O BACKUP DE EMERGÊNCIA — passo a passo (isto é com você, hoje)

Eu **não tenho acesso ao banco de produção** (nem quero: seu pedido e as regras da casa
dizem que token/senha não passam por chat). Então quem faz o arquivo é você — pelos botões
que **já existem** no sistema de hoje. São 4 passos, e o que sai é a **base inteira**
(registros + aparelhos, **sem** nenhuma senha ou token dentro):

1. Entre no sistema com um **usuário de cargo Admin** (o menu de backup é do Admin).
2. Abra o menu **Nuvem** → card **"Backups na nuvem"**.
3. Aperte **📸 Backup manual** — ele guarda na nuvem **e baixa o arquivo no PC**.
4. Aperte **📥 Baixar todos os backups** — desce um **`.zip`** com tudo.

**Depois:** guarde esses dois arquivos **fora do PC** (pen drive, e-mail para você mesmo, ou
Drive). Só quando você me disser "o backup está comigo" é que a gente pode pensar em zerar —
e o zerar acontece **na virada da chave**, com você acompanhando, nunca antes.

**Não preciso de:** senha, token, certificado, CSC, acesso ao banco, nem que você instale
nada agora. Se algum botão do item 3/4 não existir na tela que você abrir, me diga o que
apareceu — eu confiro no código e te digo o caminho certo.
