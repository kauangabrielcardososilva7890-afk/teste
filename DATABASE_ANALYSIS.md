# Análise preliminar do BANCO.FDB

Arquivo analisado anteriormente: `BANCO.FDB`  
Tamanho no repositório: aproximadamente **18 MB**  
Origem: sistema antigo usado como inspiração/migração para o novo ERP. O usuário informou que este `BANCO.FDB` pode estar desatualizado; a fonte correta será um `.RAR` atualizado armazenado externamente.

> Observação: o navegador/Githack não consegue abrir um banco Firebird diretamente. A extração real precisa rodar em backend/servidor com driver Firebird. Esta análise é preliminar, feita por inspeção dos metadados/textos presentes no arquivo.

## Tabelas/metadados encontrados

### Empresa e configuração

- `EMPRESA`
- `CONFIGURACAO`
- `EMPRESA_CNAE`
- Campos/strings relacionados a inscrição municipal, contador, CRC, PIS e configurações fiscais.

### Cadastros comerciais

- `CLIENTES`
- `FORNECEDORES`
- `FUNCIONARIOS`
- `CATEGORIA`
- `FABRICANTE`
- `UNIDADE_MEDIDA`
- `FORMA_PAGAMENTO`

### Produtos, cartuchos e estoque

- `PRODUTOS`
- `CARTUCHOS`
- `CARTUCHO_DEFEITO`
- Referências a produto/cartucho, recarga, controle de estoque e promoções.

### Vendas e orçamentos

- `VENDAS`
- `ITENS_VENDA`
- `ORCAMENTO`
- `ITENS_ORCAMENTO`
- Há referência a venda/orçamento, etiquetas, pagamento a prazo, cartão, cheque e parcelas.

### Financeiro

- `CONTAS_PAGAR`
- `CONTAS_RECEBER`
- `RECIBOS_EMITIDOS`
- Referências a recebimentos, despesas, avulsos e categorias de contas.

### Locação / outsourcing de impressoras

- `EQUIPAMENTOS`
- `LOCACAO`
- `ITENS_LOCACAO`
- `LEITURAS`
- `DESPESAS_LOCACAO`

## Mapeamento sugerido para o novo ERP

| Banco antigo | Novo ERP |
| --- | --- |
| `CLIENTES` | `clientes` |
| `PRODUTOS`, `CARTUCHOS` | `produtos` / `suprimentos` |
| `VENDAS`, `ITENS_VENDA` | `vendas` |
| `ORCAMENTO`, `ITENS_ORCAMENTO` | `orcamentos` ou `vendas` com status `orcamento` |
| `EQUIPAMENTOS` | `equipamentos` / `impressoras` |
| `LOCACAO`, `ITENS_LOCACAO` | `contratos` / `parque` |
| `LEITURAS` | `leituras` |
| `CONTAS_RECEBER` | `contasReceber` |
| `CONTAS_PAGAR` | `contasPagar` |
| `EMPRESA`, `FUNCIONARIOS` | `empresas`, `usuarios` |

## Próximo passo de migração

1. Subir um ambiente com Firebird client/driver.
2. Baixar o `.RAR` atualizado, extrair em ambiente seguro e conectar no Firebird em modo leitura.
3. Exportar tabelas principais para JSON/CSV.
4. Validar dados com o usuário no Githack usando importação JSON.
5. Criar scripts de carga para o banco em nuvem.

## Pontos de atenção

- Dados fiscais e financeiros precisam de validação antes de migrar para produção.
- Senhas de usuários do sistema antigo não devem ser reaproveitadas em texto puro.
- O novo sistema deve ter IDs próprios e manter o código legado como campo auxiliar para rastreabilidade.
- Para múltiplos computadores, o banco precisa ficar centralizado em nuvem, não dentro do `.exe`.
