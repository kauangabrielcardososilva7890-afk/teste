# Análise BANCO.FDB - SisPrinter - 18.5 MB - Firebird 3.0.7

Extraído via strings sem engine (SSL bloqueado para libfbclient).

## Tabelas principais identificadas:
- CLIENTES, CIDADES, PRODUTOS, CARTUCHOS, VENDAS, ITENS_VENDA, ORCAMENTO, ITENS_ORCAMENTO, FORNECEDORES, EMPRESA, CONFIGURACAO, CONTAS_PAGAR, CONTAS_RECEBER, RECIBOS_EMITIDOS, UNIDADE_MEDIDA, CATEGORIA, FABRICANTE, FORMA_PAGAMENTO, FUNCIONARIOS, EQUIPAMENTOS, LOCACAO, ITENS_LOCACAO, LEITURAS, etc.

## Campos CLIENTES (confirmado print notinha):
Codigo, Nome, Nome Fantasia, Fone, Fone2, Endereço, Nº, Complemento, Bairro, CPF/CNPJ, RG/Inc Est, Contato, Cidade, UF, CEP, Email

## Campos VENDAS (print Venda 15625):
PARCELA, CÓD, VALOR, VENCIMENTO, PAGAMENTO, DESCRIÇÃO, DOCUMENTO, CÓD, DESCRIÇÃO, UNITÁRIO, QTD, TOTAL, SITUAÇÃO, OBS, Acré, Frete, Desc, Atendente, Entregar até

## Próximos passos:
1. Abrir BANCO.FDB com IBExpert/FlameRobin no Windows e exportar CSVs
2. Ou usar SisPrinter > Relatórios > Exportar CSV
3. Criar importador Node que lê CSVs e popula novo ERP com codigo preservado e auditoria

Arquivo: BANCO.FDB 18.5MB já no repo branch arena/019f9aff-teste
