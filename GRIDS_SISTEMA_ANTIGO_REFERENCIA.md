# GRIDS DO SISTEMA ANTIGO — REFERÊNCIA (o que o dono colou)

> **De onde veio:** em **22/09/2026** o dono usou a área de importação
> (`importar.html`) para ler a pasta **`Grids`** do sistema antigo e **colou** o
> resultado aqui na conversa. Nada foi anexado, nada foi enviado para fora: a
> leitura é 100% local no PC dele.
>
> **O que chegou:** **as 9 grades da pasta**, em duas colagens — `FormContasPagarcxGridContasPagarDBTableView.grd`
> e `FormCadProdutoscxGridProductsDBTableView.grd` em **texto** (formato INI) + **7 arquivos binários** em base64:
> `FormCadClienteDBGrid5`, `FormConsuChamadoDBGrid1`, `FormImpressorasOnlineDBGrid3`,
> `FormLeiturasColetivaDBGrid1`, `FormLeiturasDBGrid1`, `FormLocacao2DBGrid1`,
> `FormLocacaoDBGrid1`.
>
> **O que é isso:** no sistema antigo (Delphi), cada tela guardava a **arrumação
> da grade** num `.grd` — quais colunas aparecem, em que ordem, com que largura,
> e com que título. Ou seja: **aqui estão os nomes REAIS dos campos e os títulos
> REAIS das telas**. É a referência para o item **(vi) "nomes reais"**.
>
> **Como foi lido:** os binários são streams Delphi (`TPF0` +
> `TColumnsWrapper`), não são texto. O leitor está em `_ref/grids_decode.py`
> (grava `_ref/grids.json`) e o resultado impresso em
> `_ref/grids_decodificado.txt`. **Nada disso entra no programa** — é referência
> de conferência, como manda a regra 31.

---

## 1. Cadastro de Produtos — `FormCadProdutoscxGridProductsDBTableView.grd` (texto/INI)

Único que veio como texto. Ordem das colunas = campo `Index`; `AlignmentHorz`
(0 = esquerda, 1 = direita, 2 = centro).

| # | Campo (nome real) | Título na tela | Largura | Alinhamento |
|---|---|---|---|---|
| 1 | `COD_PRODUTO` | (código) | 49 | centro |
| 2 | `DESCRICAO` | Descrição | 422 | esquerda |
| 3 | `VALOR_CUSTO_IMPOSTOS` | Valor custo + impostos | 66 | direita |
| 4 | `VALOR_TOTAL2` | Valor total (2) | 84 | direita |
| 5 | `VALOR_TOTAL` | Valor total | 68 | direita |
| 6 | `QTDE` | Quantidade | 52 | centro |
| 7 | `UND_MEDIDA` | Unidade | 60 | esquerda |
| 8 | `NOME_CAT` | Categoria | 304 | esquerda |
| 9 | `CONTROLAR_ESTOQUE` | Controlar estoque | 20 | esquerda |
| 10 | `QTDE_MINIMA` | Quantidade mínima | 64 | direita |
| 11 | `LOCALIZACAO` | Localização | 150 | esquerda |

**Ordenação que ele tinha escolhido:** `DESCRICAO` com `SortOrder=soDescending`
(descendo) — a única coluna com ordenação salva neste arquivo.

**Regras de cor (coluna M, `ConditionalFormattingProvider`, `Areas="M1:M"`)** —
situação da nota pintando a linha:

| Condição (texto) | Cor de fundo (número do arquivo) | Cor da letra |
|---|---|---|
| `"Autorizada"` | 9610862 | -16777196 |
| `"Cancelada"` | 4868823 | 16777215 |
| `"Denegada"` | 12566272 | -16777196 |

> Os números são cores do Windows (TColor), não RGB direto. Ficam aqui como
> **referência** — quando a tabela escura (item A3) for feita, a gente confere a
> cor certa com ele antes de pintar.

---

## 2. Contas a Pagar — `FormContasPagarcxGridContasPagarDBTableView.grd` (texto/INI)

Também veio como **texto** (formato INI). É a maior das grades: **37 colunas**,
das quais **10 apareciam na tela** e 27 estavam cadastradas mas ocultas.

**As que ele via na tela (na ordem):**

| # | Campo (nome real) | Largura | Alinhamento |
|---|---|---|---|
| 1 | `COD_PAGAR` | 52 | direita |
| 2 | `PARCELA` | 34 | esquerda |
| 3 | `NOME_CREDOR` | 294 | esquerda |
| 4 | `NOME_CATEGORIA` | 126 | esquerda |
| 6 | `DATA_VENCIMENTO` | 76 | esquerda |
| 7 | `DATA_PAGAMENTO` | 76 | esquerda |
| 9 | `NOME_RECEBIMENTO` | 66 | esquerda |
| 10 | `VALOR_PARCELA` | 69 | direita |
| 11 | `DESCRICAO` | 344 | esquerda |
| 37 | `NOME_CONTA` | 129 | esquerda |

**As que existiam mas estavam ocultas** (úteis para saber o que a tela antiga já tinha):

| Campo (nome real) | Largura | Observação |
|---|---|---|
| `DESC_FINANCEIRO` | 122 |  |
| `JUROS` | 100 |  |
| `VALOR_NORMAL_PARC` | 100 |  |
| `COD_FORNECEDOR` | 64 |  |
| `COD_COMPRA` | 64 |  |
| `LOCAL_PG` | 244 |  |
| `COD_FUNCIONARIO` | 64 |  |
| `COD_RECEBIMENTO` | 64 |  |
| `CP_COD_CAIXA` | 64 |  |
| `ESTORNAR` | 20 | marcação de estorno |
| `TIPO` | 20 |  |
| `COD_CAT_CONTAS_PAGAR` | 64 |  |
| `CP_COD_CHEQUE` | 64 | cheque |
| `CP_PREVISAO` | 20 | previsão (pago/não pago) |
| `CP_COD_RETIRADA` | 64 |  |
| `DATA_CADASTRO` | 64 |  |
| `DOCUMENTO` | 244 | documento da conta |
| `HORA_CADASTRO` | 64 |  |
| `VALOR_TOTAL` | 118 |  |
| `DESC_PARCELA` | 64 |  |
| `CON_COD_EMPRESA` | 64 | código da empresa (multiempresa) |
| `CP_COD_CENTRO_CUSTO` | 64 | centro de custo já existia |
| `OBS` | 6004 | largura 6004 no arquivo — defeito do sistema antigo (ele nunca mostrou essa coluna) |
| `CP_COD_CONTA` | 64 | conta bancária |
| `CP_COD_PIX` | 64 | campo de **Pix** já existia na conta a pagar |
| `COD_DESMEMBRADO` | 64 |  |
| `NOME_FORNECEDOR` | 364 | fornecedor por nome (além do nome do credor) |

**Regras de cor:** as mesmas 3 do arquivo de Produtos (`Areas="O1:O"`) —
mesmos textos e mesmos números de cor, o que indica que o bloco foi **copiado de uma
tela para a outra** no sistema antigo:

| Condição (texto) | Fundo | Letra |
|---|---|---|
| `"Autorizada"` | 9610862 | -16777196 |
| `"Cancelada"` | 4868823 | 16777215 |
| `"Denegada"` | 12566272 | -16777196 |

> Como aqui a coluna pintada não é a de situação da nota, o mais provável é
> ser **sobra da cópia** — as cores (verde/vermelho/laranja) é que valem como
> referência do padrão que ele usava para autorizada/cancelada/denegada.

---

## 3. As 7 telas binárias (nomes reais, coluna por coluna)

Legenda: "Largura" = o quanto ele tinha esticado a coluna (— = o arquivo não
guardou largura); "Aparecia?" = se a coluna estava ligada na tela (nos **7
arquivos que chegaram, todas estavam** ligadas — nenhuma oculta).

### Cadastro de Clientes — `FormCadClienteDBGrid5.grd` (10 colunas, 10 apareciam na tela)

| # | Campo (nome real) | Título na tela | Largura | Aparecia? |
|---|---|---|---|---|
| 1 | `ATIVO` | Sel | 20 | sim |
| 2 | `CODK_CLIENT` | Codigo | — | sim |
| 3 | `NOME_RAZAOSOCIAL` | Nome do Cliente | 415 | sim |
| 4 | `TELEFONE` | Telefone (taCenter) | 89 | sim |
| 5 | `CPF_CNPJ` | CPF/CNPJ | 114 | sim |
| 6 | `NOME_FANTASIA` | Nome Fantasia | 227 | sim |
| 7 | `RUA` | Endereço | 199 | sim |
| 8 | `NUMERO` | Número | — | sim |
| 9 | `BAIRRO` | Bairro | 142 | sim |
| 10 | `CIDADE` | Cidade | 132 | sim |

> `Alignment` = alinhamento que ele deixou na coluna (o resto é o padrão do sistema antigo).

### Consulta de Chamados (visitas) — `FormConsuChamadoDBGrid1.grd` (16 colunas, 16 apareciam na tela)

| # | Campo (nome real) | Título na tela | Largura | Aparecia? |
|---|---|---|---|---|
| 1 | `ATIVO` | Sel | — | sim |
| 2 | `VI_ORDEM` | Ordem | 38 | sim |
| 3 | `COD_VISITA` | Código | — | sim |
| 4 | `NOME_FUNC_RESP` | Atribuído | 80 | sim |
| 5 | `DATA` | Data (o arquivo não trouxe o título) | — | sim |
| 6 | `NOME_RAZAOSOCIAL` | Cliente | 250 | sim |
| 7 | `VI_RUA` | Endereço | 200 | sim |
| 8 | `VI_NUMERO` | Numero | 50 | sim |
| 9 | `VI_BAIRRO` | Bahrro | 150 | sim |
| 10 | `VI_CIDADE` | Cidade | 150 | sim |
| 11 | `NOME_MOTIVO` | Motivo do Chamado | 202 | sim |
| 12 | `EQUIPAMENTO` | Produto | 183 | sim |
| 13 | `VI_SERIAL` | Serial | 142 | sim |
| 14 | `VI_PATRIMONIO` | Patrimônio | 74 | sim |
| 15 | `VI_LOCALIZACAO` | Localização | 73 | sim |
| 16 | `VI_CODENDA T` | (sem título no arquivo) | 69 | sim |

### Impressoras Online (contadores) — `FormImpressorasOnlineDBGrid3.grd` (19 colunas, 19 apareciam na tela)

| # | Campo (nome real) | Título na tela | Largura | Aparecia? |
|---|---|---|---|---|
| 1 | `CON_DATA` | Última Conexão | 120 | sim |
| 2 | `CON_SITUACAO` | S | 18 | sim |
| 3 | `CON_NOME_EMPRESA` | Local | 200 | sim |
| 4 | `CON_MODELO_IMPRESSORA` | Impressora | 200 | sim |
| 5 | `CON_SERIAL` | Serial | 130 | sim |
| 6 | `CON_IP` | IP | 100 | sim |
| 7 | `CON_TOTAL_IMPRESSAO_DIA` | Impressões | 80 | sim |
| 8 | `CON_CONTADOR_GERAL` | Contador Geral | 80 | sim |
| 9 | `CON_CONTADORPRETOA4` | Contador Preto | 80 | sim |
| 10 | `CON_CONTADORCOLORA4` | Contador Color | 80 | sim |
| 11 | `CON_STATUS` | Status da Impressora | 200 | sim |
| 12 | `CON_TOTALPRINT` | Cont. Imp | 55 | sim |
| 13 | `CON_TOTALCOPY` | Cont. Cópia | 66 | sim |
| 14 | `CON_TOTALFAX` | Cont. Fax | 55 | sim |
| 15 | `CON_IMPMONO` | Imp. Preto | 55 | sim |
| 16 | `CON_IMPCOLOR` | Imp. Color | 55 | sim |
| 17 | `CON_COPMONO` | Cop Mono | 55 | sim |
| 18 | `CON_COPCOLOR` | Cop Color | 55 | sim |
| 19 | `CON_CONTADORSCAN` | Scanner | 55 | sim |

### Leituras Coletivas — `FormLeiturasColetivaDBGrid1.grd` (19 colunas, 19 apareciam na tela)

| # | Campo (nome real) | Título na tela | Largura | Aparecia? |
|---|---|---|---|---|
| 1 | `COD_CONTADOR` | Seq | 30 | sim |
| 2 | `IT_PATRIMONIO` | Patrim | 40 | sim |
| 3 | `STATUS` | S | 17 | sim |
| 4 | `DESCRICAO` | Impressora | 163 | sim |
| 5 | `CP_DEPARTAMENTO` | Departamento | 171 | sim |
| 6 | `IT_SERIAL` | Serial | 142 | sim |
| 7 | `IT_LOCALIZACAO` | Localização | 65 | sim |
| 8 | `CP_TIPO` | Tipo | 66 | sim |
| 9 | `CP_MODALIDADE` | Modalidade | 65 | sim |
| 10 | `CP_CONTADOR_ANTERIOR` | Anterior | 62 | sim |
| 11 | `PAGINAS_ATUAL` | Atual | 65 | sim |
| 12 | `CP_PAGINAS` | Utilizado | 65 | sim |
| 13 | `PAGINAS_EXCEDENTE` | Qtde Exced | 65 | sim |
| 14 | `CP_VALOR_EXCEDENTE` | Valor Exced | 65 | sim |
| 15 | `CP_VALOR_ACRESCIMO` | Acréscimo | 65 | sim |
| 16 | `CP_VALOR_TOTAL` | Valor Total | 65 | sim |
| 17 | `DATA_LEITURA` | Lançado em | 120 | sim |
| 18 | `CP_DATA_CAPTURADO` | Capturado em | 83 | sim |
| 19 | `CP_OBS` | Observação | 300 | sim |

### Leituras (faturamento) — `FormLeiturasDBGrid1.grd` (14 colunas, 14 apareciam na tela)

| # | Campo (nome real) | Título na tela | Largura | Aparecia? |
|---|---|---|---|---|
| 1 | `ATIVO` | Sel | — | sim |
| 2 | `LE_COD_LEITURA` | Código | 46 | sim |
| 3 | `LE_DATA` | Lançada em | 71 | sim |
| 4 | `LE_DATA_INICIO` | Inicio | — | sim |
| 5 | `LE_DATA_FINAL` | Final | 90 | sim |
| 6 | `LE_PAGINAS` | Utilizado | 75 | sim |
| 7 | `LE_PAGINAS_EXCEDENTES` | Qtde Exced | 67 | sim |
| 8 | `LE_VALOR_EXCEDENTES` | Valor Exced. | 70 | sim |
| 9 | `LE_VALOR_DESCONTO` | Desconto | 62 | sim |
| 10 | `LE_VALOR_ACRESCIMO` | Acréscimo | 65 | sim |
| 11 | `LE_VALOR_TOTAL` | Valor Total | 75 | sim |
| 12 | `LE_COD_NFSE` | NFS | 25 | sim |
| 13 | `LE_COD_NOTA_FISCAL` | NFe | 25 | sim |
| 14 | `LE_FINALIZAD@` | F (o arquivo não trouxe o título) | — | sim |

### Locação — itens/equipamentos — `FormLocacao2DBGrid1.grd` (16 colunas, 16 apareciam na tela)

| # | Campo (nome real) | Título na tela | Largura | Aparecia? |
|---|---|---|---|---|
| 1 | `IT_PATRIMONIO` | Patrim | 40 | sim |
| 2 | `IT_SERIAL` | Serial | 130 | sim |
| 3 | `IT_ON_DATA_ATUALIZADO` | ON | 18 | sim |
| 4 | `NOME_EQUIPAMENTO` | Equipamento | 200 | sim |
| 5 | `NOME_DEPARTAMENTO` | Departamento | 147 | sim |
| 6 | `IT_LOCALIZACAO` | Local | 128 | sim |
| 7 | `IT_ULTIMA_LEITURA` | Ultima Leitura | 77 | sim |
| 8 | `IT_VALOR_FIXO_PRETO_A4` | Acrésc Preto A4 | 130 | sim |
| 9 | `IT_VALOR_LOCACAO` | Valor Locação Preto A4 | 130 | sim |
| 10 | `IT_VALOR_FIXO_COLOR_A4` | Acrésc Color A4 | 130 | sim |
| 11 | `IT_VALoR_PAGINAS_COLOR` | Valor Locação Color A4 | 130 | sim |
| 12 | `IT_VALOR_FIXO_PRETO_A3` | Acrésc Preto A3 | 130 | sim |
| 13 | `IT_VALOR_LOCACAO_A3` | Valor Locação Preto A3 | 130 | sim |
| 14 | `IT_VALOR_FIZO_COLOR_A3` | Acrésc Color A3 | 130 | sim |
| 15 | `IT_VALOR_PAGINAS_COLOR_A3` | Valor Locação Color A3 | 130 | sim |
| 16 | `IT_VALOR_LOCACAO_SCANNER` | Valor Locação Scanner | 130 | sim |

### Locação — contratos — `FormLocacaoDBGrid1.grd` (10 colunas, 10 apareciam na tela)

| # | Campo (nome real) | Título na tela | Largura | Aparecia? |
|---|---|---|---|---|
| 1 | `COD_LOCACAO` | Locação (taLeftJustify) | — | sim |
| 2 | `LOC_NOSSO_CODIGO` | Nosso Código | 74 | sim |
| 3 | `NOME_RAZAOSOCIAL` | Cliente | 350 | sim |
| 4 | `CPF_CNPJ` | CNPJ | — | sim |
| 5 | `VALOR` | Valor Contrato (taLeftJustify) | 75 | sim |
| 6 | `VALOR_ULTIMAS_LEITURAS` | Valor Últ. Leit (taLeftJustify) | 75 | sim |
| 7 | `QTDE_VISITAS` | Cha (taLeftJustify) | 18 | sim |
| 8 | `QTDE_EQUIP` | Equip. (taLeftJustify) | 35 | sim |
| 9 | `ULTIMA_LEITURA` | Última Leitur (taLeftJustify) | 120 | sim |
| 10 | `LOC_DIA_FECHAMENTO` | Fecha Dia | 60 | sim |

> `Alignment` = alinhamento que ele deixou na coluna (o resto é o padrão do sistema antigo).


---

## 4. O que essa leitura já resolve / o que muda no nosso sistema

1. **Nomes reais das telas (item vi).** Cada tela do sistema novo pode usar o
   mesmo nome de campo e o mesmo título que ele já conhece:
   `Cliente` (Nome do Cliente, CPF/CNPJ, Endereço, Número, Bairro, Cidade),
   `Produto` (Descrição, Unidade, Categoria, Controlar estoque, Qtde mínima,
   Localização), `Chamado`/Visita (Ordem, Atribuído, Motivo do Chamado, Produto,
   Serial, Patrimônio, Localização), `Impressora online` (Última Conexão, Local,
   Impressora, Serial, IP, Contadores, Status), `Leitura` (Lançada em, Início,
   Final, Utilizado, Qtde Exced, Valor Exced., Desconto, Acréscimo, Valor Total,
   NFS, NFe), `Leitura coletiva` (Seq, Patrim, Impressora, Departamento, Tipo,
   Modalidade, Anterior, Atual, Capturado em, Observação) e `Locação`
   (Nosso Código, Cliente, CNPJ, Valor Contrato, Valor Últ. Leit, Cha, Equip.,
   Última Leitura, Fecha Dia) + itens da locação (patrimônio, serial, valores
   A4/A3 de preto/color e scanner) + `Contas a pagar` (Código, Parcela, Credor,
   Categoria, Vencimento, Pagamento, Recebimento, Valor da Parcela, Descrição,
   Conta) — e por baixo: **Pix**, **centro de custo**, cheque, estorno, previsão
   e documento já existiam nessa tela.
2. **A "arrumação das colunas" continua como ele decidiu:** *só o básico* —
   lembrar **a última ordenação e o último filtro** de cada tela, por usuário, na
   nuvem, salvando sozinho. Este documento **não** muda essa decisão; as larguras
   e colunas ocultas ficam só como referência (e como caminho de volta, se um dia
   ele quiser).
3. **Onde isso é útil desde já:** nome de coluna em tela, ordenação que ele já
   usava (`DESCRICAO` descendo em Produtos), e as **regras de cor por situação da
   nota** (Autorizada/Cancelada/Denegada) que batem com a ideia da coluna única de
   status no nosso fiscal.

## 5. O que ainda falta dessa pasta (dito com todas as letras)

| Item | Situação |
|---|---|
| **As 9 grades da pasta `Grids`** | ✅ **completas** (Contas a Pagar chegou na 2ª colagem) |
| Demais `.grd` da pasta `Grids` | se existirem outros, não apareceram — mas as 9 telas que ele citou estão todas aqui |
| `.xsd` de evento da `NSNFe` (CC-e, cancelamento) | não foram mandados — com o **navegador embutido** não fazem falta agora; ficam para o dia em que o fiscal for por API |
| `BANCO.FDB`, DLLs, `.exe` | **não pedir** — peso grande e não é o que a gente usa |

## 6. Arquivos desta leitura (para nunca precisar reler)

| Arquivo | O que tem |
|---|---|
| `_ref/grids_b64.py` | os 7 `.grd` binários como chegaram (base64) |
| `_ref/grids_decode.py` | o leitor do formato (`TPF0`/`TColumnsWrapper`) |
| `_ref/grids.json` | todas as colunas, campo, título, largura e visibilidade |
| `_ref/grids_decodificado.txt` | o mesmo, em texto, tela por tela |
| `_ref/grids_contaspagar.py` | a grade de **Contas a Pagar** (veio em texto/INI) já lida em lista |

**Quirk registrado:** no arquivo `FormConsuChamadoDBGrid1.grd` o campo
`VI_CODENDA` veio com um `\r` colado no fim do nome (defeito do próprio arquivo
do sistema antigo) e o título de 3 colunas (`DATA`, `VI_CODENDA`,
`LE_FINALIZAD@`) não está guardado no `.grd`. Nada que atrapalhe: os títulos
dessas três já foram lidos antes (`Data`, `Cod. Venda`, `F`).
