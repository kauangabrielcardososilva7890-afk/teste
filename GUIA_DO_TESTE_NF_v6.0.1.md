# 🧭 Guia do Teste — Nota Fiscal (v6.0.1)

> **Para você que vai testar:** obrigado por ajudar! Você **não precisa conhecer o sistema nem saber programar**. Este guia diz passo a passo o que clicar, o que deve acontecer e o que anotar. Leva de 40 minutos a 1 hora no total. Qualquer dúvida, anote no relatório — é exatamente pra isso que ele existe.

---

## 1. O que você vai testar (em 1 parágrafo, sem jargão)

O sistema ganhou a parte de **Nota Fiscal Eletrônica**. Pra ninguém emitir nota errada, ela nasce **em modo de teste**: as notas são enviadas pra um ambiente de "ensaios" da Receita Estadual (chama-se *homologação*). Ali, a nota é validada de verdade, mas **não vale fiscalmente** — ela sai escrita "SEM VALOR FISCAL". Sua missão é: conferir se tudo funciona direitinho nesse modo, achar problemas e sugerir melhorias. **Você não consegue "sujar" nada fiscal de verdade** — então teste sem medo (mas ligado nos detalhes!).

## 2. Antes de começar — o que você precisa em mãos

- [ ] Um **computador (Windows)** com internet.
- [ ] O **endereço do sistema e a senha** que o dono vai te passar (abre no navegador — Chrome de preferência).
- [ ] Para a **Parte B** (teste de emissão de verdade): o sistema **aberto pelo atalho do computador** (o app instalado, **não** o navegador) e o **certificado digital A1 com a senha** — o dono entrega isso pra você na hora.
- [ ] Um **celular ou o Print Screen do PC** pra tirar foto das telas importantes (no Windows: aperte `Win + Shift + S` e cole com `Ctrl + V`).
- [ ] O **relatório em branco** (arquivo separado que veio junto) — é nele que você vai escrevendo.

## 3. Regras de ouro (leia antes do primeiro clique!)

1. **Sempre em MODO TESTE.** Se em algum lugar aparecer escrito **"PRODUÇÃO — a nota vale de verdade"**, **NÃO prossiga**: anote e continue em modo teste. Você nunca vai digitar a palavra "PRODUCAO" em lugar nenhum durante o teste.
2. **Tudo que você emitir aparece com placa vermelha "HOMOLOGAÇÃO"** dizendo que é teste. É assim mesmo pra ser.
3. **Print de tudo** que der certo e, principalmente, de tudo que der errado.
4. Achou algo feio, confuso ou quebrado? **Isso é achado valioso. Anote.** O objetivo é caçar defeito.
5. Não precisa fazer nada especial no navegador (limpar cache, apertar teclas de atualização): **abra e use normalmente** — a versão que você ver já vai ser a certa.

---

## 4. Testes — PARTE A (navegador, sem certificado, ~20 min)

Pra cada teste: faça no sistema e preencha a linha correspondente no relatório em branco (Funcionou? O que apareceu? Print nº ___).

**A1 — Conferir a versão**
- Caminho: abra o endereço do sistema → tela de login.
- Deve acontecer: no rodapé da tela aparece **v6.0.1** (e fala também a versão da nuvem).
- Anote o número exato que apareceu.

**A2 — A placa do "Portão Fiscal"**
- Caminho: faça login → procure no menu o item **"Central de Nota Fiscal"** (ou peça ao dono onde fica) → abra.
- Deve acontecer: uma **placa vermelha escura** escrito **"HOMOLOGAÇÃO — MODO TESTE, SEM VALOR FISCAL"** logo no topo.
- Se não aparecer placa ou aparecer verde: **anote como correção**.

**A3 — Tentar habilitar produção SEM permissão**
- Caminho: dentro da Central, clique no botão **"⬆ Habilitar PRODUÇÃO"**.
- Deve acontecer: se o seu usuário não tiver permissão fiscal, o sistema **recusa** com aviso. Se tiver, ele pede pra **digitar a palavra PRODUCAO** → **NÃO DIGITE**, clique em Cancelar.
- Anote o que aconteceu (essa trava é o coração da segurança).

**A4 — Voltar e conferir a auditoria (com o dono)**
- Peça ao dono pra abrir a tela de **Auditoria** do sistema.
- Deve aparecer: registros de que você abriu a Central e tentou a troca de ambiente, com data/hora.
- Se os seus passos não estiverem lá: anote como correção.

**A5 — O "Painel Gerente" não atrapalha o fiscal**
- Caminho: menu → **Painel Gerente** (primeiro item da Gestão).
- Deve acontecer: números de hoje (vendas, OS, atrasadas). Nada aí emite nota: é só leitura.
- Confira que **não existe** nenhum botão de Nota Fiscal no painel.

**A6 — Buscador Escola não gasta à toa (se existir no menu)**
- Caminho: fique **fora** da aba "Buscador Escola" por uns minutos usando outras telas.
- Deve acontecer: **nenhuma** atualização automática de dados escolares acontecendo (só acontece quando a aba está aberta).
- Anote se perceber qualquer comportamento estranho de internet.

---

## 5. Testes — PARTE B (app do computador + certificado A1, ~30 min)

> Precisa: sistema aberto **pelo atalho do PC** (não navegador), arquivo do certificado (**.pfx**) e a senha dele. Sem isso, pule e marque "não testei".

**B1 — Importar o certificado**
- Caminho: Central de Nota Fiscal → botão de **certificado** → selecionar o arquivo .pfx do dono + senha.
- Deve acontecer: o sistema mostra que o certificado foi reconhecido (e a validade).
- **Print** da tela mostrando o certificado.

**B2 — Conferir uma venda antes de emitir**
- Caminho: abra uma **venda/notinha já salva** → botão **Conferir NF-e** (ou ícone de nota fiscal na venda).
- Deve acontecer: a tela de conferência mostra os dados da nota e avisa se falta algo (ex.: município do cliente).
- Se faltar dado, é **esperado**: anote o que faltou (é assim que o sistema protege de erro).

**B3 — Emitir a nota (modo teste)**
- Caminho: na mesma tela da conferência, botão de **Emitir**.
- O sistema vai: pedir a **senha do certificado** → assinar → enviar pra SEFAZ de teste.
- Deve acontecer: mensagem de **"Autorizada"** com número de **protocolo**, e a nota aparece no histórico com status verde.
- **Print da mensagem completa** com o protocolo. Anote também o **número da nota**.

**B4 — Ver o DANFE e baixar o XML**
- Caminho: no histórico da Central, clique em **DANFE** na nota que acabou de emitir → depois em **XML**.
- Deve acontecer: abrir uma página com o documento A4 (chave da nota espaçada, protocolo, itens, total e faixa "SEM VALOR FISCAL") e o XML baixar como arquivo `.xml` na pasta Downloads.
- **Print do DANFE.** Esse XML é o que vai pra contabilidade no futuro — guarde o arquivo.

**B5 — Prova de que duplicidade não passa**
- Caminho: tente **emitir de novo a MESMA venda** do teste B3.
- Deve acontecer: o sistema avisa que já existe nota autorizada e **oferece abrir o DANFE**, em vez de emitir outra.
- Anote o comportamento. Essa trava é importantíssima.

**B6 — Prova de que erro não vira nota**
- Peça ao dono uma venda com **dado fiscal incompleto/errado de propósito** (ex.: cliente sem cidade ou NCM faltando).
- Ao conferir/emitir, deve acontecer **uma de duas coisas**: o sistema bloqueia antes, **ou** a SEFAZ responde "Rejeitada" com o motivo.
- **Copie o código e o motivo da rejeição por inteiro** (ex.: "275 — Código do Município...") e anote no relatório. Mostrar que rejeições ficam visíveis é parte do teste!

**B7 — Cancelar uma nota do teste**
- Caminho: histórico → na nota autorizada do B3 → botão **Cancelar** → escreva uma justificativa com mais de 15 letras (ex.: "Teste de homologação do sistema") → senha do certificado.
- Deve acontecer: "Cancelamento registrado" e o status da nota muda pra **cancelada** (roxo).
- **Print.** Tente cancelar de novo: deve bloquear com aviso claro.

**B8 — Inutilizar uma faixa**
- Caminho: peça ao dono pra iniciar **Inutilizar faixa** na Central com um número que pulou (ex.: número que ficou perdido por ter rejeitado).
- Deve acontecer: pede justificativa (15+ letras) e senha, envia e responde "Inutilizada" com protocolo.
- **Print** e anote o protocolo.

**B9 — Troca de ambiente de verdade (ainda em teste!)**
- Caminho: dentro da Central → botão de alternar ambiente → dessa vez deixe o dono explorar a tela de produção **sem digitar nada e sem salvar**, só olhando os avisos, e depois volte.
- Deve acontecer: voltar pra homologação é um clique; a placa muda de cor; tudo fica auditado.
- Anote se os avisos fazem sentido pra quem nunca viu.

---

## 6. Como escrever seu relatório (no arquivo em branco)

1. **Um teste por linha**: resultado (✅ deu certo / ❌ deu errado / ⏭️ pulei) + o que apareceu na tela + número do print.
2. **Correção** = algo que está errado ou quebrado → uma linha por problema, com: onde clicou, o que fez, o que apareceu, o que era pra aparecer, print.
3. **Adição** = ideia sua de coisa nova ou jeito mais fácil → uma linha por ideia, escrita em frases simples ("seria bom se...").
4. **No fim**: escreva 2 ou 3 frases de veredicto ("deu pra usar tudo", "travei na parte X", etc.).
5. Quando terminar, **entregue o relatório preenchido e os prints ao dono** — é ele quem manda tudo de uma vez pro desenvolvedor.

## 7. Se der erro — o que copiar e mandar

| Situação | O que copiar/anotar |
|---|---|
| Rejeição da SEFAZ | O **código** (ex.: 275), o **motivo inteiro**, o horário e qual nota era |
| Falha "não achou o certificado" | Print da tela + nome do arquivo .pfx que tentou |
| Tela congelou | Print ou foto do que está na tela, o que clicou antes, e se voltou recarregando |
| Botão sumiu/desapareceu | Qual botão, em qual tela, print |
| Emissão "travou enviando" | Anote quanto tempo esperou e feche. Copie qualquer mensagem que aparecer depois |

**Lembretes finais:** você testa em modo ensaio — nada sai com valor fiscal de verdade. Teste pra quebrar mesmo: clicou duas vezes, cancelou no meio, fechou e abriu de novo — tudo isso é informação boa. Boa caçada! 🎯
