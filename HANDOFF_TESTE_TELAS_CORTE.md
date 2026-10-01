# Handoff — teste de telas que cortam informação (Digest: layout, não dados)

**Para:** quem vai testar pelo navegador (site), com leitura pontual de código como apoio.
**Data:** 01/10/2026 · **Build que deve aparecer no rodapé:** `v7.3.12` + carimbo curto do bundle.
**Onde:** `https://teste-60f.pages.dev` — abra com `?cb=<qualquer-coisa>` (ex.: `/index.html?cb=tela1`) para não cair em cache; o carimbo real está em `index.html` → `app.bundle.js?v=7.3.12-…`. Se o rodapé não mostrar **v7.3.12**, o teste não vale: anote o que apareceu e pare.

---

## 1. Missão

Encontrar **telas que cortam informação** — conteúdo que existe no sistema mas não chega ao olho do usuário. **Não é** teste de regra de negócio, nem de gravação, nem de nuvem. Nada de código deve ser alterado por você: o produto desta rodada é **lista de achados com prova visual**.

## 2. Disciplina (inegociável)

- **Nenhuma credencial, CNPJ real, token ou dado de cliente no relatório.** Se precisar citar um valor, invente (`QA-001`).
- **Não gravar nada de verdade**: não salvar formulários, não aprovar orçamento, não emitir nota, não mexer em estoque. Navegar, abrir, fechar, redimensionar, buscar — isso sim. Se precisar de dados na tela, use a empresa de teste que o dono fornecer; se não houver, registre "tela sem dados" e siga (isso é informação válida, não falha).
- **Proibido tocar** em: `Zerar`, `Apagar dados DESTE PC`, `Excluir` (lote ou item), `Conectar/autorizar aparelho`, qualquer botão que prometa limpar ou reconectar.
- **Não escrever no banco local de propósito.** `saveDB()` é fila assíncrona: se algo gravar sozinho durante a navegação, não se assuste — nada disso sobe sem token, e a faixa da nuvem avisa se algo ficar preso no navegador.
- Console: ao final de cada tela, leia `window.__DIGICOPY_ERROS`. Lista cheia = erro do sistema, vale acharado (cole o texto do erro, sem URL com token).

## 3. O que conta como "corta informação" (a lista fechada dos tipos)

| # | Tipo | Como reconhecer |
|---|---|---|
| A | **Texto truncado** | `…`, palavra cortada, valor que não cabe na célula, sem tooltip e sem quebra de linha. |
| B | **Coluna que não aparece e não tem rolagem** | a tabela tem mais colunas do que a janela mostra **e não há barra de rolagem horizontal** — a informação está perdida, não escondida. |
| C | **Botão/ação fora da dobra** | ação importante abaixo da dobra, coberta por rodapé fixo, ou encostada/atrás de outro botão. |
| D | **Valor maior que a caixa** | `input`/`select` com conteúdo cortado à direita (data, CNPJ, moeda com 5 dígitos, nome longo). |
| E | **Sobreposição** | `thead` sticky comendo a primeira linha; badge/ícone por cima de texto; modal com corpo maior que a janela sem rolagem própria. |
| F | **Some ao redimensionar / zoom** | informação que existia em 1920 e desaparece em 1366 ou com zoom do navegador em 110%/125% (não é "re-layout legítimo": é dado que sumiu). |

**Não é achado:** preferência estética, cor, espaçamento folgado, "fica bonito com mais uma linha". Se a tela reorganiza e continua mostrando tudo → **registre como OK** (a lista de OK é tão útil quanto a de defeitos).

## 4. Por onde começar (ordem de prioridade vem do código, não de palpite)

Varredura estática do repositório: **93 tabelas com 6 ou mais colunas**; dessas, **53 não têm wrapper com rolagem horizontal no markup** → são onde o corte é estrutural. As maiores, na ordem em que valem a pena:

| Tela (caminho do menu) | Arquivo no repo | Colunas | Rola? |
|---|---|---|---|
| Fiscal → catálogo NCM/CST (Central NF-e) | `fiscal_catalogo_completo_patch.js` | 15 | não |
| Vendas → lista de OS / vendas | `vendas_os_patch.js` | 13 / 12 | sim / **não** |
| Orçamentos · Vendas · Clientes (tabelas da loja) | `notinha_patch.js` | 14 / 12 / 10 | sim |
| Locação → Leituras por departamento | `leitura_detalhada_departamentos_patch.js` | 10 | não |
| Impressoras / Parque | `ajustes_v5171_patch.js` | 10 | sim |
| Dashboard + Vendas (uso diário) | `correcoes_uso_diario_patch.js` | 10 / 9 | sim / **não** |
| Configurações → Financeiro (filtros e contas) | `ajustes_v52243_financeiro_filtros_patch.js` | 9 | sim |
| Buscador Escola | `buscador_escola_patch.js` | 9 | não |
| Locação → Contratos (refino) e Manutenção | `contratos_refino_patch.js` | 9 | sim / **não** |
| Produtos / Contratos operacionais | `fluxos_operacionais_patch.js` | 9 | não |

Se sobrar tempo, a segunda metade da lista (tabelas de 6–8 colunas) vale o mesmo exame. Se faltar tempo, **faça as 10 acima em todas as larguras** antes de abrir tela nova.

## 5. Como testar cada tela

1. Redimensione a janela (ou use DevTools → dimensões fixas) nestas cinco larguras, **em cada tela**: `1920×1080`, `1600×900`, `1366×768` (a mais comum do balcão), `1280×800`, `1024×768`.
2. Uma tela por vez também com **zoom do navegador em 110% e 125%** (o corte por zoom é real e aparece só assim).
3. **820px de largura** serve para uma coisa só: confirmar que o layout colapsou em coluna única e continua mostrando tudo (isso foi entregue na v5.22.69; se alguma grade ainda cortar aí, é achado tipo F).
4. Abra 2 ou 3 linhas de detalhe/modal por tela (o modal é onde o corte costuma ficar escondido) e repita o exame nas mesmas larguras.
5. Não vale aumentar a fonte do sistema operacional para "melhorar" o resultado: teste como o usuário usa.

## 6. O que registrar por achado (formato fechado)

```
ACHADO <n> — <tipo A..F> — <nome da tela> (<caminho do menu>)
view: #view-<id>            (se não houver id na área, cole o seletor do contêiner)
largura/zoom: 1366×768 / 125%
o que está cortado: "<trecho literal do texto ou nome da coluna que sumiu>"
âncora no DOM: <id/classe do elemento> → <classe do contêiner>  (ex.: th.fixo / div.overflow)
por que não dá para contornar: (não tem rolagem / não tem tooltip / o botão está abaixo da dobra…)
screenshot: corte-<tela>-<largura>.webp
gravidade: ALTA (impede o trabalho) | MÉDIA (precisa esticar/rolar manual) | BAIXA (estética com custo)
```

E a lista de cobertura, no fim, no mesmo detalhe:

```
OK — <tela> — todas as informações visíveis em 1920/1600/1366/1280/1024 e no modal (larguras testadas: …)
```

**Não proponha correção no relatório** (nem CSS, nem "bastaria tirar a coluna X") — só descreva o que falta. A decisão de desenho é do dono, e sugestão sua vira viés no meu trabalho.

## 7. O que já está consertado — não re-relate como novo

- **Modal em tela apertada** (`menus_tela_pequena_patch.js` v5.22.69): corpo com rolagem própria, `#modal-box` preso a 94/96`vh`, grades viram coluna única ≤820px, rodapé sem quebrar rótulo. Só vale acharado se, **dentro dessas condições**, ainda cortar algo.
- **Locação → Contratos → "Mostrar todos"** (v7.3.12, r68): a busca antiga não volta mais sozinha na caixa; tabela, cartões e filtros batem. Se você vir Contratos com 1 linha e o cartão dizendo 2, isso **é** defeito novo — relate como bug de estado, não de layout.
- **Faixa do estado da nuvem** (v7.3.11, r67): PC sem token com escrita local pendente avisa "fica só neste navegador (N esperando o envio)". Isso é diagnóstico, não tela cortada.

## 8. Entrega

Um único arquivo `.md` (ou o texto na conversa), com, nesta ordem: carimbo da versão observada no rodapé → tabela-resumo (tela × tipo de corte × largura × gravidade) → os blocos do item 6 → a lista de OK → `window.__DIGICOPY_ERROS` do passeio. Sem screenshots não há como eu validar o corte: nomeie os arquivos como no formato acima e mande junto. Nada de credencial, nada de dado real, nada de patch seu.
