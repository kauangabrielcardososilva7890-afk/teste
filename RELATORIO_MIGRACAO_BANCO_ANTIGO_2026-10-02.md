# Relatório de análise — banco antigo

**Arquivo analisado:** `BancodeDadosSistemaAntigo.zip`  
**Destino planejado:** base particular do usuário, nunca a base comercial  
**Status:** análise somente leitura; nenhum dado foi importado ou enviado para a nuvem.

## Resumo

O ZIP contém uma exportação grande e fragmentada por tabela, com **mais de 150 arquivos JSON**. A divisão do sistema antigo é útil como referência para a versão comercial, mas não deve ser copiada literalmente: existem tabelas de catálogo, tabelas operacionais, históricos, tabelas auxiliares do Firebird e tabelas vazias/legadas.

Os maiores conjuntos encontrados incluem `VENDAS.json`, `EMPRESA.json`, `CONTAS_RECEBER.json`, `PRODUTOS_HISTORICO.json`, `VISITAS.json`, `CONTADOR_PAGINAS.json`, `ITENS_VENDA.json`, `CLIENTES.json`, `NOTA_FISCAL.json`, `LEITURAS.json`, `ITENS_LOCACAO.json` e `CAIXA.json`.

## Divisão recomendada para o sistema novo

1. **Identidade e empresa**
   - `EMPRESA`, `FUNCIONARIOS`, `CONFIG`, `CONFIGURACAO`, `RESTRICAO`.
   - Usuários/login devem ser tratados separadamente e nunca importados como senha em texto puro.

2. **Cadastros principais**
   - `CLIENTES`, `FORNECEDORES`, `PRODUTOS`, `CATEGORIA`, `FABRICANTE`, `UNIDADE_MEDIDA`, `EQUIPAMENTOS`, `TECNICOS` quando existir.

3. **Locação e parque**
   - `LOCACAO`, `ITENS_LOCACAO`, `LOCALIZACAO`, `ITENS_LOCACAO_LOCALIZACAO`, `LEITURAS`, `VISITAS`, `EQUIPAMENTOS`.

4. **Vendas e estoque**
   - `VENDAS`, `ITENS_VENDA`, `MOVIMENTACAO`, `COMPRA`, `ITENS_COMPRA`, `CARTUCHOS`, `ITENS_INSUMOS`, `GASTOS_PRODUTO`.

5. **Financeiro**
   - `CONTAS_RECEBER`, `CONTAS_PAGAR`, `RECEBIMENTO`, `RECEBIMENTO_CONTAS_RECEBER`, `CAIXA`, `RETIRADA_CAIXA`, `BOLETOS`, `FORMAS_PAGAMENTO`.

6. **Fiscal**
   - `NOTA_FISCAL`, `ITENS_NOTA`, `FATURA_NFE`, `MANIFESTACAO_DFE`, `NCM`, `TAB_CEST`, `TRIBUTOS_PRODUTOS`, `FCP`.
   - A importação fiscal deve ser histórica; não deve retransmitir documentos automaticamente para a SEFAZ.

7. **Histórico e auditoria**
   - `LOG`, históricos de produtos/locação, estornos e tabelas de alterações.
   - Entram em área de histórico, não misturados com os registros ativos.

8. **Catálogos auxiliares**
   - `CIDADES`, `ESTADOS`, `BAIRROS`, `RUAS`, motivos, situações, bancos, cartões e tabelas de apoio.
   - Só entram quando houver referência válida ou necessidade do módulo.

## Como será feita a migração do banco mais atual

Quando o ZIP atual for enviado, o procedimento será:

1. preservar o arquivo original em área de quarentena;
2. calcular hash e inventariar tabelas, colunas, quantidade e tamanho;
3. detectar chaves, duplicidades, registros órfãos e referências entre tabelas;
4. mapear os dados para o modelo particular, com IDs novos e tabela de correspondência antiga → nova;
5. importar primeiro em uma base particular de homologação;
6. validar contagens, totais financeiros, saldos, contratos, leituras, estoque e notas históricas;
7. somente após aprovação, publicar os dados na conta particular — nunca na comercial;
8. manter um relatório de divergências e uma forma de desfazer a importação.

## Proteções obrigatórias

- **Não importar senhas antigas**; usuários serão recriados ou terão recuperação segura.
- **Não executar SQL nem arquivos do ZIP**; os JSON serão tratados como dados.
- **Não misturar `EMPRESA` de várias lojas** sem confirmação de escopo.
- **Não enviar dados para a nuvem durante a pré-validação**.
- **Não apagar o ZIP original**.
- **Não publicar a migração comercial**; a base particular terá identificador/tenant separado.

A aplicação já possui importação de múltiplos JSON exportados pelo DBeaver e mapeamentos de clientes/produtos; para este volume, será necessário ampliar o processo para importação em lotes, validação de relacionamentos e relatório de divergências antes da carga final.
