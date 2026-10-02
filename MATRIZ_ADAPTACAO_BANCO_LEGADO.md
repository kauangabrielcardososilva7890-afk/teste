# Matriz de adaptação do banco legado

**Status:** adaptação do sistema, sem nova gravação na nuvem nesta rodada.

## Entidades aceitas pelo importador automático

| Tabela legada | Quantidade analisada | Destino no ERP | Tratamento |
|---|---:|---|---|
| `CLIENTES` | já importada anteriormente | Cadastros > Clientes | Upsert por código legado/documento; preservar cadastro manual |
| `PRODUTOS` | 1.111 | Produtos | Ignorar `DEL=S`; usar `COD_PRODUTO`, `DESCRICAO`, `QTDE`, `QTDE_MINIMA`, `VALOR_CUSTO` e `VALOR_TOTAL` |
| `EQUIPAMENTOS` | 301 | Locação > Cadastro de impressoras | Ignorar `EQ_DEL=S`; usar `COD_EQUIPAMENTO`, `DESCRICAO` e `EQ_TIPO`; gerar identificador legado estável quando não houver série |
| `VENDAS` | 14.707 | Atendimento > Notinhas | Ignorar `DEL=1` e `ESTORNAR=S`; usar `COD_VENDA`, `FINALIZADA`, `VALOR_TOTAL`, `COD_CLIENTE` e os campos de atendimento |
| `ITENS_VENDA` | 23.027 | Atendimento > Notinhas > Itens | Vincular por `COD_VENDA`; usar `COD_PRODUTO`, `QTDE`, `VALOR_UNITARIO` e `VALOR_TOTAL` |
| `CONTAS_RECEBER` | 16.761 | Financeiro > Contas a receber | Usar `COD_PARCELA`, `COD_CLIENTE`, `VALOR_PARCELA`, datas e `CR_SITUACAO` |
| `LOCACAO` | 216 | Locação > Contratos | Mantida como entidade autorizada para próxima etapa de mapeamento operacional |
| `LEITURAS` | 2.190 | Locação > Leituras | Mantida como entidade autorizada para próxima etapa de mapeamento operacional |

## Entidade deliberadamente excluída

| Tabela | Quantidade | Motivo |
|---|---:|---|
| `CONTAS_PAGAR` | 127 | O usuário informou que esse módulo não é usado corretamente e que esses dados são desnecessários. O importador agora ignora essa tabela e não a transforma em menu nem em registros financeiros. |

## Outras tabelas do ZIP

As tabelas auxiliares, logs, configurações, blobs, históricos, tokens, publicidade, auditoria, catálogo fiscal ainda não possuem destino validado no ERP atual. Elas **não entram mais automaticamente** e não criam menus dinâmicos.

Isso evita:

- poluir a interface com menus sem uso;
- gravar dados em entidades erradas;
- importar logs, tokens ou configurações antigas;
- aumentar a fila da nuvem sem necessidade;
- misturar estruturas fiscais e auxiliares com os cadastros operacionais.

## Alterações aplicadas

- Política explícita de tabelas permitidas no importador.
- `CONTAS_PAGAR` removida do fluxo automático.
- Campos reais do banco antigo reconhecidos em produtos, equipamentos, vendas, itens de venda e contas a receber.
- Registros marcados como excluídos/estornados são ignorados.
- O caminho alternativo de importação também respeita a política.
- Nenhum lote novo foi enviado ou gravado na nuvem durante esta adaptação.
