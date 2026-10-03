# Colunas da grade de CONTAS A PAGAR (FormContasPagarcxGridContasPagarDBTableView.grd)
# O dono colou este arquivo em texto (formato INI do DevExpress). Aqui estão só os
# campos lidos, na ordem do "Index", para não precisar reler o arquivo gigante.
# align: 0 = esquerda, 1 = direita, 2 = centro (igual ao AlignmentHorz do INI)
COLUNAS = [
    (0,  "COD_PAGAR",            52,   1, True),
    (1,  "PARCELA",              34,   0, True),
    (2,  "NOME_CREDOR",          294,  0, True),
    (3,  "NOME_CATEGORIA",       126,  0, True),
    (4,  "DESC_FINANCEIRO",      122,  0, False),
    (5,  "DATA_VENCIMENTO",      76,   0, True),
    (6,  "DATA_PAGAMENTO",       76,   0, True),
    (7,  "JUROS",                100,  1, False),
    (8,  "NOME_RECEBIMENTO",     66,   0, True),
    (9,  "VALOR_PARCELA",        69,   1, True),
    (10, "DESCRICAO",            344,  0, True),
    (11, "VALOR_NORMAL_PARC",    100,  1, False),
    (12, "COD_FORNECEDOR",       64,   1, False),
    (13, "COD_COMPRA",           64,   1, False),
    (14, "LOCAL_PG",             244,  0, False),
    (15, "COD_FUNCIONARIO",      64,   1, False),
    (16, "COD_RECEBIMENTO",      64,   1, False),
    (17, "CP_COD_CAIXA",         64,   1, False),
    (18, "ESTORNAR",             20,   0, False),
    (19, "TIPO",                 20,   0, False),
    (20, "COD_CAT_CONTAS_PAGAR", 64,   1, False),
    (21, "CP_COD_CHEQUE",        64,   1, False),
    (22, "CP_PREVISAO",          20,   0, False),
    (23, "CP_COD_RETIRADA",      64,   1, False),
    (24, "DATA_CADASTRO",        64,   0, False),
    (25, "DOCUMENTO",            244,  0, False),
    (26, "HORA_CADASTRO",        64,   0, False),
    (27, "VALOR_TOTAL",          118,  1, False),
    (28, "DESC_PARCELA",         64,   1, False),
    (29, "CON_COD_EMPRESA",      64,   1, False),
    (30, "CP_COD_CENTRO_CUSTO",  64,   1, False),
    (31, "OBS",                  6004, 0, False),
    (32, "CP_COD_CONTA",         64,   1, False),
    (33, "CP_COD_PIX",           64,   1, False),
    (34, "COD_DESMEMBRADO",      64,   1, False),
    (35, "NOME_FORNECEDOR",      364,  0, False),
    (36, "NOME_CONTA",           129,  0, True),
]

# Regras de cor do arquivo (ConditionalFormattingProvider, Areas="O1:O")
REGRAS = [
    ("Autorizada", 9610862, -16777196, 536870912),
    ("Cancelada", 4868823, 16777215, 4342527),
    ("Denegada", 12566272, -16777196, 8421376),
]
