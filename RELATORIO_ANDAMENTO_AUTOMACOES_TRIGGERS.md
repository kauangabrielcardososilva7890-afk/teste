# RELATÓRIO DE ANDAMENTO — AUTOMAÇÕES, CONTRATOS, RTF E MIGRAÇÃO

> Documento de continuidade para evitar perda de contexto caso o chat trave.
>
> Atualizar este arquivo a cada nova parte de triggers/procedures enviada.
>
> Não colocar nomes pessoais do usuário neste arquivo nem nos códigos.

---

## 1. Estado atual do trabalho

- Repositório: projeto DIGICOPY ERP no GitHub
- Branch fixo da sessão: `arena/019fb6d3-teste`
- PR aberto: #11
- Versão atual implementada: **v4.9.44**
- Último commit publicado no PR: será informado na resposta/publicação da **v4.9.29**.
- Link de teste atual: será informado na resposta/publicação da **v4.9.29** com o hash final do commit.

---

## 2. Regras obrigatórias que continuam valendo

1. Responder sempre em português simples.
2. Funcionalidade nova sempre em patch separado.
3. Não juntar tudo num arquivo só.
4. Priorizar leveza para computadores fracos.
5. Busca não deve filtrar enquanto digita; usar Enter ou lupa.
6. Não usar barra A-Z.
7. Códigos internos devem ser apenas números.
8. Não colocar nome pessoal do usuário nos arquivos.
9. Não usar nome do sistema anterior nos arquivos.
10. Antes de publicar alteração, rodar:
   - `npm run check`
   - `npm test`

---

## 3. Arquivos patch criados nesta sequência

### Fluxos e contratos

- `fluxos_operacionais_patch.js`
- `contratos_refino_patch.js`
- `contratos_final_patch.js`
- `contratos_visitas_vinculo_patch.js`

### Modelos e diagnóstico

- `contratos_rtf_template_patch.js`
- `diagnostico_migracao_patch.js`
- `arquivos_modelos_diagnostico_patch.js`

### Cadastros, Pix e desempenho

- `cadastros_nomes_patch.js`
- `chamados_avulsos_aberto_patch.js`
- `pix_comprovante_manual_patch.js`
- `desktop_otimizacao_patch.js`

### Automações de triggers

- `automacoes_triggers_patch.js`
- `automacoes_financeiro_estoque_patch.js`
- `automacoes_locacao_visitas_patch.js`
- `automacoes_contratos_caixa_fiscal_patch.js`
- `automacoes_fiscal_cartuchos_patch.js`
- `automacoes_vendas_compras_cadastros_patch.js`
- `automacoes_orcamentos_clientes_auxiliares_patch.js`
- `automacoes_pix_contadores_auxiliares_patch.js`
- `automacoes_vendas_fiscal_auxiliares_patch.js`
- `automacoes_compras_recebimentos_contadores_patch.js`
- `automacoes_caixa_chat_auxiliares_patch.js`
- `automacoes_finais_locacao_auxiliares_patch.js`

---

## 4. O que já foi feito até a v4.9.21

### 4.1 Contratos e impressoras

- O sistema passou a tentar vincular contratos sem cliente usando dados migrados.
- Como as tabelas diretas de locação não apareceram no diagnóstico, foi criada vinculação usando:
  - `VISITAS.COD_LOCACAO`
  - `VISITAS.VI_COD_CLIENTE`
  - `VISITAS.VI_COD_EQUIPAMENTO`
  - `VISITAS.VI_PATRIMONIO`
  - `VISITAS.VI_SERIAL`
  - `VISITAS.VI_COD_ITENS_LOCACAO`
- Também usa `CONTADOR_PAGINAS.COD_ITENS_LOCACAO` para completar dados de leitura/parque.
- Foi removida a tentativa errada de colocar aba de impressoras dentro de Clientes.
- Impressoras devem ficar dentro do cadastro/abertura de Contratos.

### 4.2 RTF de contrato e proposta

- Criado motor de template RTF.
- Em Configurações há área para carregar/colar modelos RTF.
- Campos reconhecidos no RTF:
  - `{CLI_NOMERAZAO}`
  - `{CLI_CPFCNPJ}`
  - `{CLI_ENDERECO}`
  - `{CLI_NUMERO}`
  - `{CLI_BAIRRO}`
  - `{CLI_CIDADE}`
  - `{CLI_UF_EX}`
  - `{CLI_CEP}`
  - `{EMP_NOMERAZAO}`
  - `{EMP_CPFCNPJ}`
  - `{EMP_ENDERECO}`
  - `{EMP_CIDADE}`
  - `{DATA_INICIO}`
  - `{DATA_TERMINO}`
  - `{QTD_MAQUINAS}`
  - `{CTR_VALOR_MENSAL}`
  - `{CTR_FRANQUIA}`
  - `[TABLE]`
- Em v4.9.20 foi adicionada seleção de arquivo `.rtf` e `.txt` pelo navegador.

### 4.3 Diagnóstico por arquivos

- Criado diagnóstico por arquivos em **Importar arquivos / Banco**.
- Aceita selecionar muitos arquivos:
  - `.json`
  - `.rtf`
  - `.txt`
- O diagnóstico não importa e não altera dados.
- Apenas gera e baixa um `.txt`.
- O objetivo é analisar arquivos sem precisar mandar centenas de arquivos pelo chat.

### 4.4 Pix

- Pix mantém QR/copia e cola com valor exato da notinha.
- Baixa automática do Pix foi removida.
- Sistema exibe aviso para pedir comprovante no WhatsApp antes de baixar manualmente.

### 4.5 Cadastros sem nome

- Criado patch para corrigir clientes sem nome.
- Casos conhecidos já tratados:
  - Código `116`: `Fernando Seguros`
  - Código `166`: `Papelaria JK`
  - Código `175`: `Caixa Escolar Manoel Neto dos Santos`
- Também tenta preencher por fantasia, razão, contato ou `Cliente + código`.

---

## 5. Diagnóstico real já recebido das tabelas

O diagnóstico enviado mostrou:

- Total de tabelas migradas visíveis no ERP: `61`
- Tabelas relevantes encontradas:
  - `VISITAS` com `5796` registros
  - `CONTADOR_PAGINAS` com `11095` registros
  - `DEPARTAMENTOS` com `296` registros
  - `ENDERECOS` com `1202` registros
  - `ORCAMENTO` com `167` registros
  - `ITENS_ORCAMENTO` com `400` registros
  - `MOVIMENTACAO` com `3088` registros
  - `FUNCIONARIOS` com `20` registros
  - `CONFIGURACAO` com várias regras antigas

Observação importante:

- No diagnóstico enviado não apareceram tabelas chamadas diretamente `LOCACAO` e `ITENS_LOCACAO`.
- Por isso a estratégia atual usa `VISITAS` e `CONTADOR_PAGINAS` para reconstruir vínculo entre contrato, cliente e impressora.

---

## 6. Triggers/procedures — controle das partes recebidas

O usuário informou que existem muitos arquivos/trechos, possivelmente 12 partes ou mais.

### Status

| Parte | Situação | Observação |
|---|---|---|
| Parte 1 | Recebida e processada | Gerou v4.9.21 |
| Parte 2 | Recebida e processada | Gerou v4.9.22 |
| Parte 3 | Recebida e processada | Gerou v4.9.23 |
| Parte 4 | Recebida e processada | Gerou v4.9.24 |
| Parte 5 | Recebida e processada | Gerou v4.9.25 |
| Parte 6 | Recebida e processada | Gerou v4.9.26 |
| Parte 7 | Recebida e processada | Gerou v4.9.27 |
| Parte 8 | Recebida e processada | Gerou v4.9.28 |
| Parte 9 | Recebida e processada | Gerou v4.9.29 |
| Parte 10 | Recebida e processada | Gerou v4.9.30 |
| Parte 11 | Recebida e processada | Gerou v4.9.31 |
| Parte 12 | Recebida e processada | Gerou v4.9.32 — última parte enviada |

---

## 7. Parte 1 — triggers recebidas e interpretação

### 7.1 Triggers internas de log

Recebido:

- `IBE$LOG_TABLES_BD`

Interpretação:

- Limpa tabelas internas de log do banco.
- Não foi recriada no ERP porque não é regra comercial da loja.

### 7.2 Funcionários e permissões

Recebido:

- `FUNCIONARIOS_INC_ANTES`
- `FUNCIONARIOS_INC_DEPOIS`
- `FUNCIONARIOS_ALT_DEPOIS`
- `FUNCIONARIO_DEL_ANTES`

Interpretação:

- Gera código automático de funcionário.
- Garante empresa padrão.
- Define gerente/ocultar/pagamento de chamado.
- Cria ou atualiza permissões em `RESTRICAO`.
- Admin recebe tudo liberado.
- Não-admin recebe permissões bloqueadas.
- Atualização marca `USUARIO_LOGGOUT` em `CONFIG`.

Ação tomada:

- Não copiado cegamente para evitar travar o ERP novo.
- A lógica foi registrada para futura adaptação de usuários/permissões.
- O ERP novo já possui perfis e controle próprio.

### 7.3 Orçamentos

Recebido:

- `ORCAMENTO_INC_ANTES`
- `ORCAMENTO_ALT_ANTES`
- `ORCAMENTO_ALT_DEPOIS`
- `ORCAMENTO_DELETE_ANTES`

Interpretação:

- Gera código automático de orçamento.
- Situação padrão: `Aberto`.
- Total do orçamento é soma dos itens menos desconto, mais acréscimo/frete, aplicando percentual de desconto.
- Se cliente não existir e foi digitado avulso, cria cliente.
- Se orçamento foi marcado para gerar venda, cria venda e copia itens do orçamento para itens da venda.
- Remove itens quando orçamento é apagado.

Ação tomada na v4.9.21:

- Criado `automacoes_triggers_patch.js`.
- Orçamentos migrados agora são sincronizados para a lista de vendas/orçamentos do ERP.
- Itens de `ITENS_ORCAMENTO` recalculam o total.
- Cliente avulso do orçamento é criado automaticamente.
- Criada função para converter orçamento em venda sem apagar o orçamento original.

### 7.4 Itens de equipamentos / últimas visitas

Recebido:

- `ITENS_EQUIPAMENTOS_INC_ANTES`
- `ITENS_EQUIPAMENTOS_INC_DEPOIS`
- `ITENS_EQUIPAMENTOS_DEL_DEPOIS`

Interpretação:

- Gera código automático do item de equipamento.
- Atualiza a última visita no item de locação com base em roteiros/visitas.

Ação tomada:

- ERP passa a gravar `ultimaVisita` no parque a partir da tabela `VISITAS`.

### 7.5 Movimentação / caixa

Recebido:

- `MOVIMENTACAO_INC_ANTES`
- `MOVIMENTACAO_INC_DEPOIS`
- `MOVIMENTACAO_DEL_DEPOIS`
- `MOVIMENTACAO_DEL_ANTES`

Interpretação:

- Gera código automático da movimentação.
- Preenche data atual se estiver vazia.
- Garante entrada/saída como zero quando vazias.
- Recalcula saldo da conta após inserir/deletar movimentação.
- Atualiza ordem da conta.

Ação tomada:

- ERP calcula `saldosMovimentacao` por conta quando a tabela `MOVIMENTACAO` existir.

### 7.6 Relatórios

Recebido:

- `RELATORIOS_INC_ANTES`

Interpretação:

- Gera próximo código de relatório.
- Não precisa automação específica agora.

---

## 8. Patch gerado com base na Parte 1

Arquivo criado:

- `automacoes_triggers_patch.js`

Funções principais:

- `calcularTotalOrcamento`
- `sincronizarOrcamentos`
- `converterOrcamentoEmVenda`
- `atualizarUltimaVisitaParque`
- `recalcularSaldosMovimentacao`
- `aplicarAutomacoesTriggers`

Teste criado:

- `test_automacoes_triggers.js`

Versão publicada:

- **v4.9.21**

Commit:

- `f6cf4b9`

---

## 8A. Parte 2 — triggers recebidas e interpretação

### 8A.1 Localização de item de locação

Recebido:

- `ITENS_LOCACAO_LOCALIZACAO_BI0`
- `ITENS_LOCACAO_LOCALIZACAO_BU0`

O que faz no banco anterior:

- Gera código automático para localização do item de locação.
- Preenche data atual.
- Preenche funcionário padrão.
- Normaliza descrição trocando `\` por `/` e removendo espaços.

Ação no ERP novo:

- Criada função `normalizeLocalizacaoDescricao`.
- A regra deve ser usada para padronizar local/departamento de impressoras no contrato.

### 8A.2 Leituras

Recebido:

- `LEITURAS_INC_ANTES`
- `LEITURA_ALT_ANTES`
- `LEITURAS_AU0`
- `LEITURAS_DEL_ANTES`

O que faz no banco anterior:

- Ao criar leitura, zera desconto, acréscimo, páginas, franquia, excedente e total.
- Marca leitura como não finalizada e não estornada.
- Define período da leitura com base na última leitura do contrato.
- Busca franquia e valor total do contrato.
- Ao alterar leitura, soma `CONTADOR_PAGINAS.CP_VALOR_TOTAL` para recalcular total.
- Se estornar leitura, remove contas a receber e reabre contadores.
- Ao excluir leitura, apaga contas a receber, contador de páginas e seleção vinculada.
- Se leitura recebe NF/NFSe, propaga vínculo para contas a receber.

Ação no ERP novo:

- Criado cálculo leve por contadores em `automacoes_financeiro_estoque_patch.js`.
- Leitura recalcula valor a partir de `CONTADOR_PAGINAS`.
- Estorno de leitura remove financeiro vinculado e volta status para pendente.
- Exclusão de leitura agora remove contas a receber vinculadas.
- Vínculo de NFE/NFSe é preservado em contas a receber quando existir.

### 8A.3 Itens de nota fiscal

Recebido:

- `ITENS_NOTA_INC_ANTES`
- `ITENS_NOTA_INC_DEPOIS`
- `ITENS_NOTA_ALT_DEPOIS`
- `ITENS_NOTA_DEL_DEPOIS`

O que faz no banco anterior:

- Preenche muitos campos fiscais de item de nota.
- Calcula total do item: quantidade x valor unitário.
- Preenche NCM, CEST, origem, unidade, descrição e código do produto.
- Calcula impostos ICMS/IPI/PIS/COFINS e campos IBS/CBS.
- Ao inserir/alterar/deletar item, recalcula total da nota.
- Marca venda como tendo NFE quando item de nota está ligado à venda.
- Atualiza produto com NCM/CEST quando necessário.

Ação no ERP novo:

- Como módulo fiscal completo ainda é etapa futura, não foi copiada a regra fiscal inteira.
- Foi implementada somente a parte segura e leve:
  - total do item = quantidade x valor unitário;
  - se item tem NCM e não tem CEST, busca CEST em `TAB_CEST`;
  - atualiza produto com NCM/CEST se faltando;
  - marca venda como `nfe = 'S'` quando item fiscal está ligado à venda.

### 8A.4 Contas a pagar

Recebido:

- `CONTAS_PAGAR_INC_ANTES`
- `CONTAS_PAGAR_INC_DEPOIS`
- `CONTAS_PAGAR_ALT_ANTES`
- `CONTAS_PAGAR_ALT_DEPOIS`
- `CONTAS_PAGAR_DEL_ANTES`

O que faz no banco anterior:

- Gera código automático.
- Preenche data/hora de cadastro.
- Preenche descrição padrão se vazia.
- Define tipo, previsão, estorno, desconto, juros, parcela e valor.
- Se credor vazio, usa “FORNECEDOR NAO IDENTIFICADO”.
- Se for compra, categoriza como compras.
- Se não tem centro de custo, usa/cria “OUTROS”.
- Valor total = valor da parcela + juros.
- Ao pagar, cria recebimento/movimentação.
- Ao estornar ou excluir, remove recibos, movimentações e vínculos.

Ação no ERP novo:

- Criados defaults para contas a pagar:
  - descrição padrão;
  - fornecedor padrão;
  - tipo;
  - parcela;
  - status;
  - valor total.
- Estorno limpa pagamento e reabre título de forma leve.
- Não foi copiada a parte de boleto/recibo antigo de forma literal.

### 8A.5 Contas a receber

Recebido:

- `CONTAS_RECEBER_INC_ANTES`
- `CONTAS_RECEBER_INC_DEPOIS`
- `CONTAS_RECEBER_ALT_ANTES`
- `CONTAS_RECEBER_ALT_DEPOIS`
- `CONTAS_RECEBER_DEL_ANTES`

O que faz no banco anterior:

- Gera código automático de parcela.
- Puxa cliente pela venda se estiver vazio.
- Define forma de recebimento padrão do cliente ou prazo.
- Preenche data de cadastro, valores zerados, situação e recibo.
- Define tipo do título: venda, recarga, serviço, locação.
- Pix muda forma de recebimento para Pix, mas não necessariamente baixa se sem data de pagamento.
- Boleto muda forma para boleto/prazo.
- Cartão crédito/débito pode compensar automático e aplicar desconto de taxa.
- Ao pagar título, finaliza venda vinculada.
- Ao pagar título de leitura, finaliza leitura e contadores.
- Ao excluir/estornar, remove recibos/movimentações e reabre venda/leitura.

Ação no ERP novo:

- Criados defaults para contas a receber.
- Conta paga marca venda como faturada/paga.
- Conta paga ligada à leitura marca leitura como faturada/finalizada.
- Estorno reabre título.
- Pix continua sem baixa automática por regra atual do projeto.

### 8A.6 Produtos/histórico de estoque

Recebido:

- `PRODUTOS_HISTORICO_BI0`

O que faz no banco anterior:

- Gera código e data do histórico.
- Preenche funcionário.
- Preenche custo e valor de venda do produto.
- Calcula saldo do produto somando entradas menos saídas.
- Atualiza `PRODUTOS.QTDE`.
- Se houver variações, usa soma das variações como saldo.

Ação no ERP novo:

- Criado recálculo de estoque por `PRODUTOS_HISTORICO` quando existir.
- Soma entradas `E` e saídas `S`.
- Atualiza estoque do produto, ignorando serviços.
- Usa assinatura para não recalcular a mesma base sem necessidade.

### 8A.7 Itens de roteiro

Recebido:

- `ITENS_ROTEIRO_INC_ANTES`
- `ITENS_ROTEIRO_DEL_ANTES`

O que faz no banco anterior:

- Gera código automático para itens de roteiro.
- Ao excluir item de roteiro, remove itens de equipamento vinculados.

Ação no ERP novo:

- Não implementado agora.
- Depende de módulo de roteiros/logística, que ainda não está como rotina principal.

### 8A.8 Chaves referenciadas

Recebido:

- `CHAVE_REFERENCIADAS_INC_ANTES`
- `CHAVE_REFERENCIADAS_INC_DEPOIS`

O que faz no banco anterior:

- Gera código.
- Reprocessa itens de nota fiscal.
- Atualiza chave referenciada na nota.

Ação no ERP novo:

- Não implementado agora.
- Fica para módulo fiscal completo.

---

## 8B. Patch gerado com base na Parte 2

Arquivo criado:

- `automacoes_financeiro_estoque_patch.js`

Funções principais:

- `normalizeLocalizacaoDescricao`
- `calcularLeituraPorContadores`
- `aplicarDefaultsContaPagar`
- `aplicarDefaultsContaReceber`
- `aplicarAutomacoesLeituras`
- `aplicarAutomacoesContas`
- `aplicarAutomacoesProdutosHistorico`
- `aplicarAutomacoesItensNota`
- `aplicarAutomacoesFinanceiroEstoque`

Teste criado:

- `test_automacoes_financeiro_estoque.js`

Versão publicada:

- **v4.9.22**


---

## 8C. Parte 3 — triggers recebidas e interpretação

### 8C.1 Despesas de locação

Recebido:

- `DESPESAS_LOCACAO_INC_ANTES`
- `DESPESAS_LOCACAO_ALT_ANTES`
- `DESPESAS_LOCACAO_BD0`

O que faz no banco anterior:

- Gera código automático da despesa.
- Define situação padrão como despesa lançada.
- Se a despesa veio de uma visita, puxa:
  - item de locação;
  - motivo da visita;
  - custo da visita;
  - contrato da visita;
  - data da visita.
- Se a despesa veio de item de venda, puxa produto/cartucho, descrição, etiqueta e custo.
- Se a descrição for toner/cartucho/refil/recarga, cria histórico de estoque de locação.
- Usa vida útil do produto/cartucho para avisar lançamento fora da vida útil.
- Ao excluir despesa, remove histórico de estoque relacionado.

Ação no ERP novo:

- Criado `db.despesasLocacao` como estrutura leve para registrar despesas vinculadas à locação.
- Criado `db.locacaoEstoqueHistorico` para histórico de suprimentos da locação.
- Despesa vinculada a visita puxa motivo, custo, item de locação, contrato, cliente e data.
- Despesa de suprimento cria histórico com vida útil estimada pelo produto/cartucho quando possível.

### 8C.2 Itens de locação / impressoras no contrato

Recebido:

- `ITENS_LOCACAO_INC_ANTES`
- `ITENS_LOCACAO_INC_DEPOIS`
- `ITENS_LOCACAO_ALT_ANTES`
- `ITENS_LOCACAO_ALT_DEPOIS`
- `ITENS_LOCACAO_DEL_DEPOIS`

O que faz no banco anterior:

- Gera código do item de locação.
- Busca variação do produto pelo serial.
- Puxa descrição de localização quando tem localização cadastrada.
- Se não tem departamento, cria/usa departamento `OUTROS`.
- Normaliza serial.
- Preenche data de instalação/cadastro.
- Inicializa todos os contadores e valores de medidores em zero quando vazios.
- Controla medidores independentes:
  - Preto A4;
  - Color A4;
  - Scanner;
  - Preto A3;
  - Color A3.
- Cada medidor tem tipo próprio e valores próprios.
- Ao alterar/inserir/excluir, recalcula soma do contrato, franquias e informações da locação.
- Atualiza estoque/status do equipamento quando entra/sai/remaneja/oculta/defeito.
- Se situação é defeito, cria visita vinculada.

Ação no ERP novo:

- Criada normalização de `ITENS_LOCACAO` quando essa tabela estiver disponível.
- Cada item vira/atualiza um registro em `db.parque`.
- Cada medidor vira configuração independente em `parque.medidores`.
- Status do parque/equipamento é atualizado conforme situação.
- Departamento e localização são preservados.
- Equipamento entra no cadastro do contrato e alimenta leituras/chamados.

### 8C.3 Visitas / chamados técnicos

Recebido:

- `VISITAS_INC_ANTES`
- `VISITAS_INC_DEPOIS`
- `VISITAS_ALT_ANTES`
- `VISITAS_ALT_DEPOIS`
- `VISITAS_DEL_ANTES`
- `VISITAS_DEL_DEPOIS`

O que faz no banco anterior:

- Gera código da visita.
- Preenche funcionário, custo, valor extra, prioridade, situação, data e hora.
- Se atendimento é livre, limpa item de locação e contador.
- Puxa endereço do cliente.
- Se visita tem item de locação, puxa:
  - contato;
  - endereço específico;
  - equipamento;
  - serial;
  - patrimônio;
  - localização;
  - departamento;
  - contrato;
  - cliente.
- Preenche motivo padrão `OUTROS` quando faltando.
- Se finalizada, preenche data finalizada e técnico responsável.
- Cria/atualiza despesa de locação vinculada à visita.
- Pode gerar venda a partir da visita quando marcado.
- Atualiza situação da locação conforme chamado aberto/concluído.
- Atualiza última visita do item de locação.
- Atualiza contadores de uso de motivo/departamento/equipamento.
- Remove despesas/históricos ao excluir visita.

Ação no ERP novo:

- Visitas migradas agora atualizam chamados (`db.os`) com mais campos.
- Chamado puxa cliente, contrato, equipamento, parque, patrimônio, serial, motivo, custo, data e status.
- Visita finalizada vira chamado concluído.
- Visita com custo gera/atualiza despesa de locação.
- Visita marcada para gerar venda cria venda de serviço vinculada ao chamado, sem duplicar quando já existe.
- Contrato recebe situação de chamados (`C` ou `A`).
- Parque recebe última visita.

### 8C.4 Roteiros, veículos e assuntos

Recebido:

- `ROTEIROS_ALT_ANTES`
- `ROTEIROS_DEL_ANTES`
- `ASSUNTO_SMS_INC_ANTES`
- `VEICULOS_IND_ANTES`

O que faz no banco anterior:

- Roteiro calcula km rodado.
- Exclusão/alteração de roteiro remove itens vinculados.
- Assunto SMS e veículos apenas geram códigos automáticos.

Ação no ERP novo:

- Não implementado agora.
- Roteiros/logística e SMS não são rotina principal atual.
- Códigos automáticos já têm regra própria no ERP novo.

### 8C.5 Empresa/configuração inicial

Recebido:

- `EMPRESA_INC_ANTES`
- `EMPRESA_INC_DEPOIS`

O que faz no banco anterior:

- Gera código da empresa.
- Remove acentos da cidade.
- Preenche flags de módulos.
- Cria tributos padrão.
- Cria funcionário admin inicial.
- Cria produtos de exemplo de cartuchos/impressoras.
- Cria configuração padrão enorme.
- Cria cliente balcão, caixa e contas padrão.

Ação no ERP novo:

- Não copiado literalmente.
- ERP novo já tem configuração inicial, empresa, usuários e formas de pagamento próprias.
- Copiar produtos/clientes de exemplo poderia poluir a base real da loja.
- Regras úteis serão consideradas quando o módulo fiscal/permissões for finalizado.

---

## 8D. Patch gerado com base na Parte 3

Arquivo criado:

- `automacoes_locacao_visitas_patch.js`

Funções principais:

- `descricaoSuprimento`
- `tipoMedidorFromCodigo`
- `medidoresFromItemLocacao`
- `sincronizarItensLocacao`
- `sincronizarDespesasLocacao`
- `sincronizarVisitasAvancado`
- `aplicarAutomacoesLocacaoVisitas`

Teste criado:

- `test_automacoes_locacao_visitas.js`

Versão publicada:

- **v4.9.23**


---

## 8E. Parte 4 — triggers recebidas e interpretação

### 8E.1 Locação / contratos

Recebido:

- `LOCACAO_INC_ANTES`
- `LOCACAO_INC_DEPOIS`
- `LOCACAO_ALT_ANTES`
- `LOCACAO_ALT_DEPOIS`
- `LOCACAO_DELETE_ANTES`

O que faz no banco anterior:

- Gera código automático da locação.
- Preenche defaults de contrato, visitas e tipo.
- Valor do contrato é recalculado por `VALOR_LOCACAO` + valores globais de medidores:
  - preto A4;
  - color A4;
  - preto A3;
  - color A3;
  - scanner.
- Ao ocultar/ativar contrato, atualiza estoque/status dos equipamentos seriais vinculados.
- Ao excluir contrato, remove contas a receber e itens de locação.
- Ao inserir contrato, incrementa ordem do cliente.

Ação no ERP novo:

- Criado cálculo de `valorCalculadoMensal` do contrato.
- Se contrato não tem valor mensal definido e o cálculo encontrar valor, preenche `valorMensalFixo`.
- Normaliza defaults de contrato:
  - `cobrarExcedentesDias`;
  - `qtdeVisitas`;
  - `situacaoVisitas`;
  - `locTipo`;
  - `custoMedioVisitas`.
- Quando contrato é encerrado/excluído/inativo, parque é inativado e equipamento volta para disponível.

### 8E.2 Caixa

Recebido:

- `CAIXA_INC_ANTES`
- `CAIXA_ALT_ANTES`
- `CAIXA_DELETE_ANTES`

O que faz no banco anterior:

- Gera código automático do caixa.
- Preenche data, hora, situação aberta e todos os valores monetários como zero.
- Se caixa volta para aberto, remove movimentação de fechamento diário.
- Ao excluir caixa, remove itens de caixa, retiradas e movimentações vinculadas.

Ação no ERP novo:

- Criada normalização leve de caixas migrados em `db.caixasMigrados`.
- Preenche defaults sem mexer nas tabelas originais.
- Não foi implementado apagar movimentações automaticamente, para evitar perda de histórico real.

### 8E.3 Fatura NFE e nota fiscal

Recebido:

- `FATURA_NFE_INC_ANTES`
- `FATURA_NFE_UP_DEL`
- `NOTA_FISCAL_ALT_DEPOIS`

O que faz no banco anterior:

- Gera código automático de fatura de NFE.
- Se valor de duplicata muda ou fatura é removida, apaga itens de recebimento NFE.
- Nota fiscal vinculada a venda marca contas a receber com NFE.
- Nota fiscal vinculada a leitura marca contas a receber com NFE.
- Para NFE modelo 55, gera duplicatas com vencimento/valor a partir de contas abertas.
- Se nota é cancelada/denegada, remove vínculo da NFE no financeiro e na leitura.
- Se nota autorizada, atualiza produto com NCM, CEST e enquadramento IPI.

Ação no ERP novo:

- Criado `db.notasFiscaisMigradas` e `db.faturasNfe` como estruturas leves.
- Nota fiscal migrada marca venda, leitura e conta a receber com NFE.
- Cancelada/denegada limpa vínculo e registra observação no financeiro.
- Atualiza produto com NCM/CEST/enquadramento quando faltando.
- Gera faturas NFE a partir de contas abertas vinculadas.
- Cálculo fiscal completo continua reservado para módulo fiscal próprio.

### 8E.4 Motivos, contador alertas e cadastros auxiliares

Recebido:

- `MOTIVO_DEFEITO_DETALHE_BI0`
- `CONTADOR_ALERTAS_BI0`
- `CONTADOR_ALERTAS_CONFIG_BI0`
- `CONTADOR_LOCAL_OFF_BI0`
- `FATURA_NFE_INC_ANTES`
- `ASSUNTO_EMAIL_INC_ANTES`
- `ASSUNTO_SMS_INC_ANTES`
- `VEICULOS_IND_ANTES`
- `CORRECOES_INC_ANTES`
- `CORRECOES_INC_DEPOIS`
- `BAIRROS_DEL_ANTES`
- `PROX_COD_BAIRRO`

O que faz no banco anterior:

- Gera códigos automáticos.
- Preenche data atual.
- Normaliza descrição de detalhes de motivo em maiúsculo.
- Incrementa contadores/cliques.
- Impede excluir bairro se cliente usa.
- Correção de nota altera situação para corrigida.

Ação no ERP novo:

- Não copiado literalmente nesta etapa.
- A maioria é geração de código ou regra de cadastros auxiliares.
- Será reavaliado quando os módulos fiscal, SMS/agenda e cadastros auxiliares forem trabalhados.

### 8E.5 Produtos e equipamentos

Recebido:

- `PRODUTOS_INC_ALT_ANTES`
- `PRODUTOS_INC_DEPOIS`
- `PRODUTOS_ALT_DEPOIS`
- `PRODUTOS_DEL_ANTES`
- `EQUIPAMENTOS_INC_ANTES`
- `EQUIPAMENTOS_AIU0`

O que faz no banco anterior:

- Gera código de produto/equipamento.
- Define categoria por descrição ou equipamento.
- Vincula equipamento a produto auxiliar.
- Descobre fabricante pelo nome do equipamento.
- Preenche defaults de produto:
  - peso;
  - empresa;
  - lucros;
  - ordem;
  - origem;
  - categoria;
  - custo;
  - preço;
  - estoque;
  - unidade;
  - promoção;
  - tipo;
  - data de cadastro;
  - controle de estoque;
  - vida útil;
  - descontos máximos.
- Calcula custo com gastos/frete.
- Calcula preço e margens.
- Ao inserir produto, cria histórico de estoque inicial.
- Ao atualizar produto, incrementa ordem do NCM e atualiza custo dos insumos.
- Ao deletar produto, remove gastos e histórico.

Ação no ERP novo:

- Criados defaults de produto de forma leve.
- Equipamento cria/atualiza produto auxiliar de categoria `Impressoras`, sem duplicar.
- Descobre fabricante pelo modelo: HP, Brother, Kyocera, Epson etc.
- Não foi copiado controle de promoção/varejo/atacado, pois já foi removido por regra do projeto.
- Histórico inicial e recálculo de estoque já são tratados pelo patch de financeiro/estoque quando há `PRODUTOS_HISTORICO`.

### 8E.6 Ligações

Recebido:

- `LIGACOES_INC_ANTES`
- `LIGACOES_BU0`

O que faz no banco anterior:

- Gera código de ligação.
- Preenche data.
- Puxa empresa pelo cliente.
- Quando situação é concluído, limpa agendamento.

Ação no ERP novo:

- Não implementado agora.
- Módulo de ligações/CRM ainda não é rotina principal.

---

## 8F. Patch gerado com base na Parte 4

Arquivo criado:

- `automacoes_contratos_caixa_fiscal_patch.js`

Funções principais:

- `calcularValorContrato`
- `normalizarContrato`
- `aplicarAutomacoesContratos`
- `defaultsCaixa`
- `sincronizarCaixaMigrado`
- `sincronizarNotasFiscais`
- `fabricantePeloModelo`
- `defaultsProduto`
- `aplicarAutomacoesProdutosEquipamentos`
- `aplicarAutomacoesContratosCaixaFiscal`

Teste criado:

- `test_automacoes_contratos_caixa_fiscal.js`

Versão publicada:

- **v4.9.24**


---

## 8G. Parte 5 — triggers recebidas e interpretação

### 8G.1 Nota fiscal — preparação completa para módulo fiscal futuro

Recebido:

- `NOTA_FISCAL_INC_ANTES`
- `NOTA_FISCAL_DEL_ANTES`

O que faz no banco anterior:

- Preenche dados do cliente na nota fiscal: nome, CPF/CNPJ, IE/RG, e-mail, endereço, bairro, cidade, UF, CEP, telefone e indicadores fiscais.
- Preenche configuração fiscal padrão da empresa: modelo, série, ambiente, indicador de presença, frete.
- Gera código e número da nota.
- Inicializa todos os campos monetários em zero quando vazios.
- Preenche natureza, pagamento, situação, data e hora.
- Se nota vem de venda, monta observação com venda e parcelas.
- Se nota vem de leitura, monta observação com leitura.
- Calcula totais de produtos e serviços a partir dos itens da nota.
- Monta mensagem de tributos aproximados.
- Em exclusão de nota, remove itens, faturas, itens de recebimento NFE e limpa vínculo NFE do financeiro/venda/leitura.

Ação no ERP novo:

- Criada preparação fiscal leve em `automacoes_fiscal_cartuchos_patch.js`.
- O ERP cria/atualiza `db.notasFiscaisMigradas` com snapshot de cliente e dados fiscais principais.
- Nota puxa cliente, venda e leitura quando possível.
- Nota calcula totais de produtos/serviços pelos itens.
- Nota gera observações com venda/leitura e parcelas.
- Nota marca venda/leitura/contas a receber com NFE.
- Nota cancelada/denegada limpa vínculo e registra observação.
- O cálculo fiscal completo foi mantido para o módulo fiscal futuro.

### 8G.2 Produtos, equipamentos e variações

Recebido:

- `PRODUTOS_INC_ALT_ANTES`
- `PRODUTOS_INC_DEPOIS`
- `PRODUTOS_ALT_DEPOIS`
- `PRODUTOS_DEL_ANTES`
- `PRODUTOS_VARIACAO_BI0`
- `PRODUTOS_VARIACAO_ITENS_BI0`
- `EQUIPAMENTOS_INC_ANTES`
- `EQUIPAMENTOS_AIU0`

O que faz no banco anterior:

- Produto recebe defaults de descrição, categoria, empresa, unidade, estoque, custo, preço, origem, vida útil e descontos.
- Produto vinculado a equipamento vira tipo equipamento.
- Equipamento cria/atualiza produto auxiliar.
- Fabricante é sugerido pelo texto do equipamento.
- Variações recebem código, data, empresa, valores do produto e quantidade mínima 1.
- Quantidade negativa de variação vira zero.

Ação no ERP novo:

- Parte de produto/equipamento já havia sido iniciada na Parte 4.
- Nesta parte foi criada estrutura de variações migradas:
  - `db.produtosVariacaoMigrados`;
  - `db.produtosVariacaoItensMigrados`.
- Variações mantêm quantidade nunca negativa.
- Valores de custo/venda são herdados do produto quando faltam.

### 8G.3 Cartuchos e cartucho vazio

Recebido:

- `CARTUCHOS_INC_ANTES`
- `CARTUCHOS_INC_DEPOIS`
- `CARTUCHOS_ALT_ANTES`
- `CARTUCHOS_ALT_DEPOIS`
- `CARTUCHOS_DEL_ANTES`
- `CARTUCHO_VALOR_INC_ANTES`

O que faz no banco anterior:

- Gera código de cartucho.
- Inicializa valor de insumos e ocultar.
- Soma custo dos insumos do cartucho.
- Se configuração permitir, cria produto “Cartucho Vazio ...”.
- Ao deletar cartucho, remove insumos e valores.

Ação no ERP novo:

- Criado `db.cartuchosMigrados`.
- Soma `ITENS_INSUMOS` para calcular `valorInsumos`.
- Cria produto de categoria `Cartucho Vazio` quando houver cartucho migrado e ainda não existir produto equivalente.
- Não apaga histórico de insumos/valores automaticamente para preservar dados importados.

### 8G.4 Insumos gastos em recarga/remanufatura

Recebido:

- `ITENS_INSUMOS_GASTOS_INC_ANTES`
- `ITENS_INSUMOS_GASTOS_ALT_ANTES`
- `ITENS_INSUMOS_GASTOS_ALT_DEPOIS`
- `ITENS_INSUMOS_GASTOS_DEL_ANTES`
- `ITENS_INSUMOS_GASTOS_DEL_DEPOIS`

O que faz no banco anterior:

- Gera código de gasto de insumo.
- Preenche custo unitário a partir do produto.
- Calcula total e total de custo.
- Soma insumos no item de venda/recarga.
- Quando quantidade muda, movimenta histórico de produto como entrada/saída da diferença.
- Ao excluir gasto, devolve estoque via histórico.

Ação no ERP novo:

- Criado `db.insumosGastosMigrados`.
- Calcula total e total de custo de cada insumo gasto.
- Soma valor de insumos no item de venda quando for possível vincular por código antigo.
- Não faz baixa/devolução agressiva de estoque em massa, porque isso poderia duplicar movimentação histórica.

### 8G.5 Estornos

Recebido:

- `ESTORNOS_INC_ANTES`

O que faz no banco anterior:

- Gera código/data do estorno.
- Se estorno é de leitura, marca leitura para estornar e registra dados.
- Se estorno é de venda, remove contas a receber/despesas, marca venda como estornada e registra dados.
- Se estorno é de conta a receber, registra dados e tenta marcar venda como estornada.
- Se estorno é de boleto, remove conta a pagar relacionada.

Ação no ERP novo:

- Criado `db.estornosMigrados`.
- Estornos migrados marcam vendas/leituras/contas como estornadas quando o vínculo é encontrado.
- Não remove histórico financeiro em massa; preserva dados e marca status.

### 8G.6 Configurações, categorias, comissões e auxiliares

Recebido:

- `CONFIG_BI0`
- `MOTIVO_PERGUNTA_BI0`
- `LOG_BI0`
- `CATEGORIA_INC_ANTES`
- `CATEGORIA_CONTAS_PAGAR_BI`
- `COMISSAO_INC_ANTES`
- `FLUXO_CAIXA_INC_ANTES`
- `FLUXO_CAIXA_INC_DEPOIS`
- `FLUXO_CAIXA_DEL_DEPOIS`
- `LIGACOES_INC_ANTES`
- `LIGACOES_BU0`

O que faz no banco anterior:

- Principalmente geração de códigos automáticos.
- Configuração comentada de bancos/pix/acqio/gerencianet.
- Motivos e categorias são colocados em maiúsculo.
- Comissão começa como não paga.
- Ligação concluída limpa agendamento.

Ação no ERP novo:

- Não copiado literalmente agora.
- Códigos já seguem regra própria do ERP.
- Pix já foi adaptado para manual/comprovante.
- Comissões, fluxo de caixa avançado e ligações/CRM ficam para módulos próprios se forem priorizados.

---

## 8H. Patch gerado com base na Parte 5

Arquivo criado:

- `automacoes_fiscal_cartuchos_patch.js`

Funções principais:

- `defaultsNotaFiscal`
- `totaisNotaPorItens`
- `observacaoNota`
- `sincronizarNotasFiscaisPreparadas`
- `somarInsumosCartucho`
- `sincronizarCartuchos`
- `sincronizarVariacoes`
- `sincronizarInsumosGastos`
- `aplicarEstornosMigrados`
- `aplicarAutomacoesFiscalCartuchos`

Teste criado:

- `test_automacoes_fiscal_cartuchos.js`

Versão publicada:

- **v4.9.25**


---

## 8I. Parte 6 — triggers recebidas e interpretação

### 8I.1 Insumos gastos e itens de venda

Recebido:

- `ITENS_INSUMOS_GASTOS_INC_DEPOIS`
- `ITENS_VENDA_INC_ANTES`
- `ITENS_VENDA_INC_DEPOIS`
- `ITENS_VENDA_ALT_ANTES`
- `ITENS_VENDA_ALT_DEPOIS`
- `ITENS_VENDA_DEL_ANTES`
- `ITENS_VENDA_DEL_DEPOIS`
- `SOMA_INSUMOS_GASTOS_DELETE`

O que faz no banco anterior:

- Item de venda recebe código automático.
- Puxa empresa, cliente, data, item de locação e contrato pela venda.
- Para cartucho/recarga:
  - monta descrição com tipo, fabricante, número e cor;
  - puxa técnico padrão;
  - usa preço de recarga ou preço específico do cliente;
  - marca venda como tipo recarga;
  - cria gastos de insumos automaticamente a partir de `ITENS_INSUMOS`;
  - movimenta estoque de cartucho vazio quando marcado.
- Para produto:
  - puxa controle de estoque, descrição, tipo, custo, unidade e preço;
  - respeita preço específico do cliente, atacado, promoção ou varejo;
  - calcula custo e total.
- Ao alterar quantidade, movimenta histórico de produto pela diferença.
- Ao excluir item, devolve estoque, remove insumos gastos e zera descontos/acréscimos da venda.
- Após inserir/alterar/excluir, recalcula total da venda.
- Item ligado a locação cria despesa de locação.

Ação no ERP novo:

- Criado `automacoes_vendas_compras_cadastros_patch.js`.
- Itens de venda migrados são normalizados dentro da venda.
- Total do item é recalculado por quantidade, valor unitário e desconto.
- Venda recebe `totalItensCalculado`; se total estiver zerado, recebe o total calculado.
- Produto recebe `dataUltVenda`.
- Produto favorito por cliente é registrado em `db.produtosFavoritos`.
- Itens de cartucho geram insumos automáticos quando existir `ITENS_INSUMOS`.
- Item vinculado a locação cria/atualiza despesa de locação.
- Histórico de estoque é registrado em estruturas auxiliares, evitando mexer agressivamente no estoque real já importado.

### 8I.2 Compras e itens de compra

Recebido:

- `ITENS_COMPRA_INC_ANTES`
- `ITENS_COMPRA_INC_DEPOIS`
- `ITENS_COMPRA_ALT_DEPOIS`
- `ITENS_COMPRA_DEL_DEPOIS`

O que faz no banco anterior:

- Item de compra recebe código.
- Descrição fica em maiúsculo.
- Inicializa ICMS, ICMS-ST e IPI.
- Atualiza NCM e código de barras do produto.
- Calcula total do item.
- Calcula custo unitário considerando desconto, ICMS-ST, IPI, frete e acréscimos.
- Pode converter unidade KG/LT para GR/ML.
- Atualiza custo do produto e, se configurado, preço de venda.
- Gera histórico de estoque de entrada.
- Ao excluir/alterar, reverte histórico anterior e recalcula total da compra.

Ação no ERP novo:

- Criado `db.itensCompraMigrados`.
- Criado `db.comprasMigradas`.
- Criado `db.produtosHistoricoCompra` como histórico auxiliar.
- Produto recebe NCM/código de barras quando faltando.
- Produto recebe `ultimoCustoCompra` e `dataUltCompra`.
- Não foi alterado estoque real em massa para evitar duplicar estoque histórico já importado.

### 8I.3 Cidades, ruas e situações

Recebido:

- `CIDADES_INC_ANTES`
- `CIDADES_ALT_ANTES`
- `CIDADES_ALT_DEPOIS`
- `CIDADES_DEL_ANTES`
- `PROX_COD_RUA`
- `RUAS_DEL_ANTES`
- `SITUACAO_INC_ANTES`

O que faz no banco anterior:

- Gera código automático de cidade, rua e situação.
- Cidade é normalizada sem acento e em maiúsculo.
- UF é normalizada em maiúsculo.
- Código UF IBGE é preenchido pela sigla.
- Atualiza notas fiscais sem protocolo quando cidade/UF muda.
- Impede excluir cidade/rua usada por cliente, fornecedor ou funcionário.
- Situação fica em maiúsculo.

Ação no ERP novo:

- Criadas estruturas consultáveis:
  - `db.cidadesMigradas`;
  - `db.ruasMigradas`;
  - `db.situacoesMigradas`.
- Cidade recebe UF IBGE conforme sigla.
- Não foi implementada exclusão bloqueada porque esses cadastros auxiliares não são editados diretamente no ERP agora.

### 8I.4 Agenda

Recebido:

- `AGENDA_PERSONALIZADA_BEFORE`
- `AGENDA_PERSONALIZADA_AFTER`

O que faz no banco anterior:

- Gera código de agenda.
- Define status, tipo, reagendado.
- Tenta localizar cliente por telefone/e-mail/contato.
- Se não existe cliente pelo contato, cria cliente.
- Se início é maior/igual ao fim, ajusta fim pelo tempo padrão.
- Ao concluir agenda, pode gerar venda.
- Se estornar agenda, apaga venda gerada.

Ação no ERP novo:

- Criado `db.agendaMigrada`.
- Agenda cria cliente pelo contato quando não houver vínculo.
- Agenda registra se está concluída e se deveria gerar venda.
- Não foi criada venda automaticamente nesta etapa para evitar duplicar vendas sem conferência.

### 8I.5 Configuração de limite de crédito

Recebido:

- `CONFIGURACAO_ALT_DEPOIS`
- `CONFIGURACAO_INC_ANTES`

O que faz no banco anterior:

- Se limite de crédito padrão for preenchido, aplica para clientes sem limite.
- Define `orc_multi_empresa` como `S` quando vazio.

Ação no ERP novo:

- Clientes sem `limiteCredito` recebem o limite padrão quando a configuração migrada existir.
- Multiempresa de orçamento não foi copiado por não ser rotina atual.

---

## 8J. Patch gerado com base na Parte 6

Arquivo criado:

- `automacoes_vendas_compras_cadastros_patch.js`

Funções principais:

- `ufIbge`
- `normalizarCidade`
- `sincronizarCadastrosAuxiliares`
- `calcularItemCompra`
- `sincronizarItensCompra`
- `calcularItemVenda`
- `sincronizarItensVenda`
- `sincronizarAgenda`
- `aplicarAutomacoesVendasComprasCadastros`

Teste criado:

- `test_automacoes_vendas_compras_cadastros.js`

Versão publicada:

- **v4.9.26**


---

## 8K. Parte 7 — triggers recebidas e interpretação

### 8K.1 Itens de orçamento

Recebido:

- `ITENS_ORCAMENTO_INSERT_UPDATE_D`
- `ITENS_ORCAMENTO_INSERT_UPDATE`
- `ITENS_ORCAMENTO_DEL_DEPOIS`

O que faz no banco anterior:

- Se orçamento não está finalizado, item puxa produto/cartucho e define tipo.
- Produto define tipo de descrição: serviço, produto, cartucho, cartucho vazio ou insumo.
- Preço do produto vem por tabela: preço 1, 2 ou 3.
- Cartucho monta descrição de recarga/remanufatura usando tipo, fabricante, número e cor.
- Cartucho usa preço por tipo: recarga, trocar, remanufaturado, compatível ou original.
- Calcula valor total do item.
- Valida desconto por percentual ou por valor.
- Recalcula total do orçamento após inserir/alterar/deletar item.

Ação no ERP novo:

- Criado cálculo detalhado de item de orçamento em `automacoes_orcamentos_clientes_auxiliares_patch.js`.
- Orçamentos migrados recebem itens já normalizados com preço, descrição, tipo, desconto e subtotal.
- Total do orçamento é atualizado pelo total dos itens.
- Desconto é validado em faixa segura, evitando exceção que travaria o uso.

### 8K.2 Clientes e endereços

Recebido:

- `CLIENTES_INC_ANTES`
- `CLIENTES_ALT_ANTES`
- `CLIENTES_ALT_DEPOIS`
- `CLIENTE_DEL_ANTES`

O que faz no banco anterior:

- Gera código de cliente.
- Define e-mail em minúsculo.
- Define defaults: número, bairro, rua, cidade, UF, nome, limite de crédito, desconto, bloqueado e tipo.
- Remove acentos da cidade e normaliza em maiúsculo.
- Cria cidade, bairro e rua auxiliares se não existem.
- Atualiza cadastro de endereço.
- Atualiza dados fiscais em notas não autorizadas.
- Ao excluir cliente, remove valores por cliente e valores de cartucho por cliente.

Ação no ERP novo:

- Clientes são normalizados sem CAPSLOCK nos nomes.
- E-mail fica minúsculo.
- Defaults de endereço são preenchidos quando faltam.
- Cidade sem acento é mantida em campo auxiliar para busca.
- Limite de crédito padrão é preservado.
- Endereço do cliente gera registro em `db.enderecosMigrados`.
- Não foi implementada exclusão agressiva de valores/vínculos, para preservar histórico real.

### 8K.3 Boletos como legado

Recebido:

- `BOLETOS_INC_ANTES`
- `BOLETOS_INC_DEPOIS`
- `BOLETOS_ALT_ANTES`
- `BOLETOS_ALT_DEPOIS`
- `BOLETOS_DEL_ANTES`
- `BOLETOS_AD0`

O que faz no banco anterior:

- Gera código/número do boleto.
- Preenche datas e status.
- Normaliza status vindo de integração: waiting/open/late/paid/identified/unpaid/refunded/contested/canceled/settled/link/expired.
- Se boleto é pago, cria recebimento e movimentação.
- Pode criar conta a pagar com custo de boleto.
- Ao excluir boleto, limpa vínculo na conta a receber e registra log.

Ação no ERP novo:

- Como a regra atual do projeto é faturamento sem boleto, o boleto não foi reativado no faturamento.
- Criado `db.boletosLegado` apenas para consulta/histórico.
- Status de boleto antigo é normalizado.
- Não bloqueia cliente e não gera cobrança nova por boleto.

### 8K.4 NFSe

Recebido:

- `NFSE_BI0`
- `NFSE_BU0`

O que faz no banco anterior:

- Gera código de NFSe.
- Preenche data de emissão.
- Se status vira cancelado, preenche data de cancelamento.

Ação no ERP novo:

- Criado `db.nfseMigradas` como estrutura preparada para módulo fiscal.
- NFSe cancelada fica marcada com data de cancelamento.

### 8K.5 Portal/usuários de clientes e auxiliares

Recebido:

- `SHOP_ACESSOS_BI0`
- `SHOP_TOKEN_BI0`
- `CLIENTES_USUARIOS_AI0`
- `CLIENTES_USUARIOS_BI0`
- `CLIENTES_USUARIOS_RESTRICAO_BI0`
- `GRADES_BI0`
- `PRODUTOS_CATEGORIA_BI0`
- `VARIACAO_BI0`

O que faz no banco anterior:

- Gera códigos e datas.
- Víncula token de loja online ao cliente.
- Libera permissões padrão para usuário do cliente: FAQ, loja, pedidos, faturas, impressoras e chamados.
- Grades, categorias de produto e variações recebem código e data.

Ação no ERP novo:

- Criado `db.clientesUsuariosMigrados` com permissões de portal preservadas para uso futuro.
- Criado:
  - `db.gradesMigradas`;
  - `db.produtosCategoriaMigradas`;
  - `db.variacaoTiposMigrados`.
- Loja online/portal de cliente não foi ativado agora; só preservado como dados futuros.

### 8K.6 Outros auxiliares

Recebido:

- `ITENS_INSUMOS_INC_ANTES`
- `ITENS_INSUMOS_ALT_ANTES`
- `ITENS_INSUMOS_INC_DEPOIS`
- `ITENS_INSUMOS_DEL_DEPOIS`
- `SITUACAO_INC_ANTES`
- `CIDADES_*`
- `RUAS_*`

O que faz no banco anterior:

- Gera código automático.
- Calcula total de insumo do cartucho.
- Normaliza cidade, rua, situação e UF.
- Bloqueia exclusão de cidade/rua se estiver em uso.

Ação no ERP novo:

- O custo de insumo/cartucho já foi considerado nos patches de cartuchos e insumos.
- Cidade/rua/situação já foram migradas como estruturas auxiliares.
- Bloqueio de exclusão não foi aplicado por ainda não existir tela de edição desses auxiliares.

---

## 8L. Patch gerado com base na Parte 7

Arquivo criado:

- `automacoes_orcamentos_clientes_auxiliares_patch.js`

Funções principais:

- `calcularItemOrcamento`
- `sincronizarItensOrcamentoDetalhes`
- `normalizeCliente`
- `sincronizarClientesDetalhes`
- `statusBoleto`
- `sincronizarBoletosLegado`
- `sincronizarNfse`
- `sincronizarPortalEAuxiliares`
- `aplicarAutomacoesOrcClientesAux`

Teste criado:

- `test_automacoes_orcamentos_clientes_auxiliares.js`

Versão publicada:

- **v4.9.27**


---

## 8M. Parte 8 — triggers recebidas e interpretação

### 8M.1 Pix

Recebido:

- `PIX_INC_ANTES`
- `PIX_INC_DEPOIS`
- `PIX_ALT_ANTES`
- `PIX_ALT_DEPOIS`
- `PIX_DEL_ANTES`

O que faz no banco anterior:

- Gera código do Pix.
- Preenche data de cadastro, atualização, funcionário e vencimento.
- Define situação conforme pagamento/cancelamento/estorno.
- Ao pagar, cria histórico, recebimento, caixa e custo Pix.
- Ao cancelar/estornar, limpa vínculo em contas a receber, remove custo Pix e altera situação da venda.

Ação no ERP novo:

- Criado `db.pixMigrados` e `db.pixHistoricoMigrado`.
- Pix antigo vira histórico consultável.
- Pagamento Pix migrado NÃO faz baixa automática, obedecendo regra atual do projeto.
- Cancelado/estornado marca financeiro/venda quando vínculo exato é encontrado, sem apagar histórico em massa.

### 8M.2 Contadores automáticos / Print counter

Recebido:

- `CONTADOR_BIU0`
- `CONTADORES_BIU0`
- `CONTADOR_ALERTAS_BI0`
- `CONTADOR_ALERTAS_CONFIG_BI0`
- `CONTADOR_CAPTURAS_BI0`
- `CONTADOR_HOMOLOGAR_BI0`
- `CONTADOR_LOCAL_OFF_BI0`

O que faz no banco anterior:

- Gera código do contador.
- Associa contador ao item de locação pelo serial.
- Se não estiver em contrato, cadastra impressora em estoque.
- Calcula impressões do dia comparando com contador anterior.
- Copia níveis anteriores de toner/drum/fusor/rolo/waste quando vierem zerados.
- Evita datas futuras.
- Avalia configurações de alertas por status e níveis.
- Cria/atualiza `CONTADOR_ALERTAS` quando algum gatilho bate.

Ação no ERP novo:

- Criado `db.contadoresMigrados`.
- Contadores são associados a equipamento/parque por serial ou patrimônio.
- Atualiza contador PB do equipamento quando o contador capturado é maior.
- Calcula `totalImpressaoDia`.
- Cria `db.contadorAlertasMigrados` com alertas de status/níveis.
- Usa configuração de alerta quando existir; senão, usa gatilho padrão seguro para níveis baixos e status problemático.

### 8M.3 Contas/bancos

Recebido:

- `CONTAS_BIUD0`

O que faz no banco anterior:

- Gera código de conta.
- Preenche saldo/agência/número/dígitos com zero.
- Define se conta recebe boleto/cartão/Pix.
- Mapeia banco/cobrança para código de banco.

Ação no ERP novo:

- Criado `db.contasBancariasMigradas`.
- Preserva contas, banco, agência, número, saldo, custo Pix e flag de Pix.
- Não reativa boleto no faturamento novo.

### 8M.4 E-mails, links e auxiliares simples

Recebido:

- `EMAIL_BI0`
- `EMAIL_DEL_ANTES`
- `LINKS_BI0`
- `SHOP_ACESSOS_BI0`
- `SHOP_TOKEN_BI0`
- `MANIFESTACAO_DFE_BI0`
- `ITENS_RECEBIMENTO_NFE_INC_ANTES`
- `ITENS_RECEBIMENTO_NFE_AI0`
- `GASTOS_PRODUTO_INC_ANTES`
- `GASTOS_PRODUTO_INC_DEPOIS`
- `GASTOS_PRODUTO_DEL_DEPOIS`
- `HORARIO_ATENDIMENTO_BI0`
- `CATEGORIA_SUB_INC_ANTES`
- `CREDITOS_INC_ANTES`
- `CREDITOS_TRANSFERENCIA_INC_ANTE`
- `CUPONS_INC_ANTES`
- `PRODUTOS_PESQUISAS_ERRO_BI0`
- `RESTRICAO_AU0`

O que faz no banco anterior:

- Em geral, gera código e data.
- E-mail é normalizado para minúsculo e tenta vincular cliente por e-mail.
- Links/créditos/cupons/horários/categorias auxiliares preservam registros.
- Gastos de produto recalculam total de gastos do produto.
- Restrição atualizada força logout de usuário.

Ação no ERP novo:

- Criado `db.emailsMigrados`, vinculando cliente por e-mail quando possível.
- Criadas estruturas leves para links, créditos, cupons, horários, categorias auxiliares, manifestações e erros de pesquisa.
- Restrição/logout antigo não foi copiado literalmente porque o ERP novo usa sessão/perfis próprios.
- Gastos de produto foram preservados indiretamente nos cálculos de custos já existentes; a estrutura completa pode ser aprofundada se esse módulo virar prioridade.

---

## 8N. Patch gerado com base na Parte 8

Arquivo criado:

- `automacoes_pix_contadores_auxiliares_patch.js`

Funções principais:

- `pixStatus`
- `sincronizarPixMigrado`
- `bancoCodigo`
- `sincronizarContasBancarias`
- `sincronizarContadores`
- `gerarAlertasContador`
- `sincronizarEmailsLinksCreditos`
- `aplicarAutomacoesPixContadoresAux`

Teste criado:

- `test_automacoes_pix_contadores_auxiliares.js`

Versão publicada:

- **v4.9.28**


---


## 8O. Parte 9 — triggers recebidas e interpretação

### 8O.1 Cupons usados, endereços, encomendas e auxiliares de produto

Recebido:

- `CUPONS_ITENS_INC_ANTES`
- `ENDERECOS_INC_ANTES`
- `ENCOMENDAS_INC_ANTES`
- `ENCOMENDAS_ITENS_BI0`
- `PRODUTOS_FAVORITOS_BI0`
- `PRODUTOS_PROMOCAO_BI0`
- `PRODUTOS_TAGS_BI0`
- `PRODUTOS_DIMENSAO_BI0`
- `PRODUTOS_MOTIVO_PERGUNTA_BI0`
- `PRODUTOS_VALORES_BI0`

O que faz no banco anterior:

- Gera código automático e data de cadastro.
- Em cupom usado, completa valor/tipo a partir do cupom principal e quantidade padrão `1`.
- Em endereço, transforma CEP em branco em `NULL`.
- Em encomendas e itens, completa data e funcionário.
- Em produtos, preserva favoritos, promoções, tags, dimensões, perguntas e valores auxiliares.

Ação no ERP novo:

- Criado `db.cuponsItensMigrados` para histórico de uso de cupons.
- Criado complemento em `db.enderecosMigrados`, com CEP vazio salvo como `null` e preenchimento seguro no cliente quando o campo estava vazio.
- Criados `db.encomendasMigradas` e `db.encomendasItensMigrados`.
- Criadas estruturas leves para favoritos, promoções históricas, tags, dimensões, perguntas e tabelas de valores.
- Promoção antiga foi preservada como histórico, sem reativar tela/regra de promoção pesada.

### 8O.2 Campanhas de e-mail

Recebido:

- `EMAIL_CAMPANHA_BI0`
- `EMAIL_CAMPANHA_ENVIOS_BI0`

O que faz no banco anterior:

- Gera código, data e funcionário.
- Quando um envio vem sem campanha, procura/cria a campanha pela descrição.

Ação no ERP novo:

- Criado `db.emailCampanhasMigradas` e `db.emailCampanhaEnviosMigrados`.
- Envios antigos ficam somente como histórico.
- Não foi ativado disparo automático de e-mail.

### 8O.3 Cartões, bandeiras, pagamentos e comandas

Recebido:

- `CARTAO_BANDEIRA_BI0`
- `CARTAO_BI0`
- `CARTAO_ALT_DEPOIS`
- `CARTAO_HISTORICO_BI0`
- `CARTAO_PAGAMENTO_BI0`
- `COMANDAS_BI0`

O que faz no banco anterior:

- Gera código/data.
- Coloca titular do cartão em maiúsculo.
- Se cartão tem CPF e nascimento, preenche nascimento do cliente quando estava vazio.
- Preserva histórico e pagamentos de cartão.

Ação no ERP novo:

- Criado histórico seguro: `db.cartaoBandeirasMigradas`, `db.cartoesMigrados`, `db.cartaoHistoricoMigrado`, `db.cartaoPagamentosMigrados` e `db.comandasMigradas`.
- Número de cartão fica mascarado.
- Pagamentos de cartão NÃO fazem baixa automática.
- Data de nascimento do cliente é preenchida apenas quando encontrada por CPF e o cadastro estava vazio.

### 8O.4 Bancos, NCM, finalização, defeitos e tributos

Recebido:

- `PROX_COD_BANCO`
- `NCM_INC_ANTES`
- `TIPO_FINALIZACAO_INC_ANTES`
- `PROX_COD_CARTUCHO_DEFEITO`
- `TRIBUTOS_PRODUTOS_INC_ANTES`

O que faz no banco anterior:

- Gera código automático.
- Normaliza NCM removendo pontos.
- Define ordem e imposto de importação padrão.
- Define defaults de IBS/CBS: CST `000`, classificação `000001`, IBS UF `0.1`, IBS Município `0` e CBS `0.9`.

Ação no ERP novo:

- Criado `db.bancosMigrados`, `db.ncmMigrados`, `db.tiposFinalizacaoMigrados`, `db.cartuchosDefeitosMigrados` e `db.tributosProdutosMigrados`.
- NCM é salvo sem pontuação.
- Tributação fica preservada para consulta/futuro fiscal, sem recalcular nota pesada automaticamente.

### 8O.5 Vendas antes/depois de atualizar

Recebido:

- `VENDAS_ALT_ANTES`
- `VENDAS_ALT_DEPOIS`

O que faz no banco anterior:

- Atualiza data de alteração.
- Venda com equipamento vira serviço/OS.
- Venda não finalizada limpa flags e itens de recebimento.
- Preenche nome do cliente pelo código.
- Ao finalizar:
  - calcula garantia de serviço;
  - muda entrega de `BUSCAR` para `ENTREGAR` se configurado;
  - garante situação `FINALIZADA`;
  - preenche data/hora de saída;
  - limpa cancelamento.
- Define funcionário de comissão conforme configuração.
- Recalcula valores de serviço, peças, insumos e total.
- Se venda for excluída, desvincula agenda, despesas, orçamento e visita.
- Sincroniza empresa em contas a receber e gera chamado quando necessário.

Ação no ERP novo:

- Vendas migradas agora recebem totalização compatível com os itens antigos.
- Finalizadas ganham situação `FINALIZADA`, data/hora de saída, garantia e forma de entrega ajustada.
- Comissão é preservada como código antigo do funcionário quando possível.
- Vendas excluídas são marcadas como `excluida` e seus vínculos são limpos sem apagar histórico em massa.
- Venda de serviço/equipamento gera OS leve apenas quando necessário.

---

## 8P. Patch gerado com base na Parte 9

Arquivo criado:

- `automacoes_vendas_fiscal_auxiliares_patch.js`

Funções principais:

- `sincronizarCuponsItens`
- `sincronizarEnderecosLegado`
- `sincronizarEncomendas`
- `sincronizarProdutosAuxiliaresParte9`
- `sincronizarEmailCampanhas`
- `sincronizarCartoesEComandas`
- `sincronizarFiscalAuxParte9`
- `calcularTotaisVenda`
- `aplicarRegrasVendasParte9`
- `aplicarAutomacoesVendasFiscalAuxiliares`

Teste criado:

- `test_automacoes_vendas_fiscal_auxiliares.js`

Versão publicada:

- **v4.9.29**

---


## 8Q. Parte 10 — triggers recebidas e interpretação

### 8Q.1 Vendas — inclusão, exclusão e vínculos

Recebido:

- `VENDAS_INC_ANTES`
- `VENDAS_INC_DEPOIS`
- `VENDAS_DEL_ANTES`

O que faz no banco anterior:

- Gera sequência/código de venda.
- Preenche funcionário, empresa, cliente padrão, situação `ABERTA`, data/hora e flags padrão.
- Preenche valores numéricos com zero.
- Copia nome, telefone, e-mail e endereço do cliente para a venda.
- Se a venda tiver endereço, define entrega como `ENTREGAR`; senão `AGUARDAR`.
- Atualiza endereço do cliente com os dados da venda.
- Incrementa ordem/acesso do cliente e ordem do equipamento.
- Cria item de recebimento quando há forma de recebimento.
- Ao excluir venda, apaga/desvincula itens, recebimentos, despesas, orçamento, visitas, agenda e contas a receber.

Ação no ERP novo:

- Vendas migradas recebem defaults seguros sem sobrescrever venda manual.
- Cliente/endereço são completados quando estavam vazios ou com placeholder.
- Ordem de cliente/equipamento é recalculada por contagem, sem ficar incrementando a cada abertura da tela.
- Item de recebimento antigo é preservado como histórico, sem baixa automática.
- Venda excluída é marcada como `excluida`, vínculos ficam limpos e contas a receber são canceladas, sem apagar histórico em massa.
- Itens de remanufatura são preservados em histórico separado ao limpar venda excluída.

### 8Q.2 Compras

Recebido:

- `COMPRA_INC_ANTES`
- `COMPRA_ALT_ANTES`
- `COMPRA_ALT_DEPOIS`
- `COMPRAS_DEL_ANTES`

O que faz no banco anterior:

- Define situação padrão `AGUARDANDO ENTREGA`.
- Define empresa e data do fornecedor.
- Ao finalizar compra, cria produto automaticamente quando item não tem produto.
- Converte `KG` para `GR` e `LT` para `ML` quando configurado.
- Calcula custo unitário com desconto, ICMS ST, IPI, frete e acréscimo.
- Recalcula total da compra.
- Rateia frete, acréscimo e desconto entre os itens.
- Ao estornar, remove contas a pagar e movimentação.

Ação no ERP novo:

- `db.comprasMigradas` e `db.itensCompraMigrados` foram aprofundados.
- Rateio de frete/acréscimo/desconto agora fica gravado no item.
- Produto faltante pode ser criado pela compra finalizada com código numérico simples.
- Conversão `KG→GR` e `LT→ML` foi preservada quando a configuração antiga pedir.
- Estorno de compra cancela financeiro/movimentação histórica relacionada, sem remover em massa.

### 8Q.3 Contador de páginas / leituras

Recebido:

- `CONTADOR_PAGINAS_BI0`
- `CONTADOR_PAGINAS_INC_DEPOIS`
- `CONTADOR_PAGINAS_ALT_DEPOIS`
- `CONTADOR_PAGINAS_DEL_ANTES`
- `CONTADOR_PAGINAS_DEL_DEPOIS`

O que faz no banco anterior:

- Gera código do contador.
- Define leitura como não finalizada.
- Preenche data, funcionário, desconto zero e departamento.
- Recalcula total da leitura quando contador é inserido/alterado.
- Ao excluir contador, limpa financeiro vinculado e volta medidores do item de locação para a última leitura válida.

Ação no ERP novo:

- Criado `db.contadorPaginasMigrados` com dados do contador antigo.
- Leituras do ERP são recalculadas pela soma de `CP_VALOR_TOTAL`.
- Parque/contrato recebe última leitura e medidores iniciais por tipo:
  - preto;
  - color;
  - preto A3;
  - color A3;
  - scanner.
- Financeiro ligado a contador excluído será tratado como cancelamento histórico quando identificado, não como exclusão cega.

### 8Q.4 Carrinho da loja, tokens e acessos

Recebido:

- `PRODUTOS_CARRINHO_BI0`
- `PRODUTOS_CARRINHO_BIU0`
- `SHOP_TOKEN` relacionado pela trigger
- `SHOP_ACESSOS` relacionado pela trigger

O que faz no banco anterior:

- Gera código/data do carrinho.
- Define cliente padrão se faltar.
- Liga token da loja ao cliente.
- Atualiza acessos e token quando carrinho anônimo vira carrinho de cliente.
- Remove duplicidade de item quando token é associado a cliente.

Ação no ERP novo:

- Criado `db.produtosCarrinhoMigrados`, `db.shopTokensMigrados` e `db.shopAcessosMigrados`.
- Dados ficam históricos/consultáveis.
- Duplicidade de carrinho é marcada como removida por duplicidade, sem apagar o registro original.

### 8Q.5 Itens de recebimento e recebimento de contas

Recebido:

- `ITENS_RECEBIMENTO_BD0`
- `PROX_COD_ITENS_RECEBIMENTO`
- `PROX_COD_REC_CONTAS_RECEBER`
- `REC_CONTAS_RECEBER_INC_ANTES`
- `REC_CONTAS_RECEBER_INC_DEPOIS`
- `REC_CONTAS_RECECEBER_DEL_ANTES`
- `REC_CONTAS_RECEBER_DEL_DEPOIS`

O que faz no banco anterior:

- Gera código de item de recebimento.
- Preenche valor pelo total da venda quando vazio.
- Pode alterar forma de recebimento padrão do cliente conforme configuração.
- Recebimento total baixa conta a receber/pagar.
- Recebimento parcial reduz saldo.
- Gera movimentação bancária/caixa.
- Em cartão, calcula data de compensação por configuração.
- Excluindo recebimento, remove comissão, recibo e movimentação.

Ação no ERP novo:

- Criado/atualizado `db.itensRecebimentoMigrados`.
- Criado `db.recebimentosContasMigrados`, `db.movimentacaoRecebimentosMigrada` e `db.contasPagarParciaisMigradas`.
- Recebimento normal antigo pode marcar conta como paga/parcial por ser histórico do banco antigo.
- Pix continua com a regra atual do ERP: preserva histórico, exige comprovante e NÃO faz baixa automática.
- Recebimento ligado a venda excluída não reabre financeiro cancelado.

### 8Q.6 Auxiliares simples

Recebido:

- `RAMO_ITENS_BI0`
- `PROX_COD_FABRICANTE`
- `PROX_COD_MOTIVO_DEFEITO`
- `PROX_COD_VALOR_CLIENTE`

O que faz no banco anterior:

- Gera código/data.
- Motivo de defeito fica em maiúsculo e remove aspas/barra invertida.
- Valor por cliente guarda preço específico.

Ação no ERP novo:

- Criado `db.ramoItensMigrados`, `db.fabricantesMigrados`, `db.motivosDefeitoMigrados` e `db.valoresClienteMigrados`.
- Motivo de defeito é limpo e normalizado.

---

## 8R. Patch gerado com base na Parte 10

Arquivo criado:

- `automacoes_compras_recebimentos_contadores_patch.js`

Funções principais:

- `sincronizarVendasParte10`
- `limparVinculosVendaExcluida`
- `sincronizarComprasParte10`
- `sincronizarContadorPaginasParte10`
- `sincronizarCarrinhoLoja`
- `sincronizarItensRecebimento`
- `sincronizarRecebimentosContas`
- `sincronizarAuxiliaresParte10`
- `aplicarAutomacoesComprasRecebimentosContadores`

Teste criado:

- `test_automacoes_compras_recebimentos_contadores.js`

Versão publicada:

- **v4.9.30**

---


## 8S. Parte 11 — triggers recebidas e interpretação

### 8S.1 Retirada de caixa

Recebido:

- `PROX_COD_RETIRADA_CAIXA`
- `RETIRADA_CAIXA_INC_DEPOIS`
- `RETIRADA_CAIXA_DEL_ANTES`

O que faz no banco anterior:

- Gera código da retirada.
- Garante categoria de contas a pagar chamada `FECHAMENTO`.
- Se a retirada for entrada (`E`), cria conta a receber já paga.
- Se for saída (`S`), cria conta a pagar já paga.
- Ao excluir retirada, apaga movimentação e financeiro vinculado.

Ação no ERP novo:

- Criado `db.retiradasCaixaMigradas`.
- Criado `db.movimentacaoRetiradaCaixaMigrada`.
- Entradas geram conta a receber histórica paga.
- Saídas geram conta a pagar histórica paga na categoria `FECHAMENTO`.
- Não foi feita exclusão cega de financeiro; o histórico fica preservado.

### 8S.2 Fornecedores, transportadores e cidades

Recebido:

- `FORNECEDORES_INC_ANTES`
- `TRANSPORTADORES_INC_ALT_ANTES`

O que faz no banco anterior:

- Gera código do fornecedor.
- Preenche placeholders de endereço, bairro, cidade, UF, número e fantasia.
- Remove acentos da cidade.
- Garante cadastro da cidade por nome/UF.
- Transportador também cria/vincula cidade quando necessário.

Ação no ERP novo:

- Criado `db.fornecedoresMigrados`.
- Criado `db.transportadoresMigrados`.
- Cidades auxiliares são criadas em `db.cidadesMigradas` sem acento e em maiúsculo.
- Dados ficam como histórico/consulta, sem misturar fornecedor com cliente.

### 8S.3 Chat gerando chamado

Recebido:

- `CHAT_BI0`

O que faz no banco anterior:

- Gera código/data.
- Define cliente e empresa padrão quando faltam.
- Se o chat não tem visita, cria ou localiza uma visita/chamado aberto com motivo `CHAT`.
- Define origem como funcionário ou cliente.
- Se o chat tem visita mas não tem cliente, puxa o cliente da visita.

Ação no ERP novo:

- Criado `db.chatsMigrados`.
- Criado/garantido motivo `CHAT` em `db.motivosDefeitoMigrados`.
- Chat antigo vira chamado leve em `db.os` quando não existe vínculo.
- Se já existe chamado da visita, o chat é ligado a ele.
- Mensagens ficam em histórico dentro do chamado e também em `db.chatsMigrados`.

### 8S.4 Recibos, anexos e centro de custo

Recebido:

- `RECIBOS_EMITIDOS_INC_ANTES`
- `ANEXOS_BI0`
- `CENTRO_CUSTO_BI0`

O que faz no banco anterior:

- Gera códigos.
- Recibo com parcela puxa o último item de recebimento daquela parcela.
- Centro de custo recebe data, del `0`, ordem `0` e funcionário.

Ação no ERP novo:

- Criado `db.recibosEmitidosMigrados`.
- Criado `db.anexosMigrados`.
- Criado `db.centrosCustoMigrados`.
- Recibo antigo mantém vínculo com o recebimento quando encontrado.

### 8S.5 Departamentos, motivos, perguntas, localização e demais auxiliares

Recebido:

- `PROX_COD_SOLUCAO_DEFEITO`
- `PROX_SOMA_ITENS_INSUMOS_GASTOS`
- `DEPARTAMENTOS_INC_ANTES`
- `LOCALIZACAO_BI0`
- `ASSUNTOS_BI0`
- `MOTIVO_SITUACAO_BI0`
- `MOTIVO_SITUACAO_AI0`
- `PROX_ITENS_CAIXA`
- `PUBLICIDADE_BI`
- `MOTIVO_PERGUNTA_TAGS_INC_ANTES`
- `MOTIVO_RESPOSTA_INC_ANTES`
- `MOTIVOS_INC_ANTES`
- `VISITAS_HISTORICO_BI0`
- `ENQUETES_BI0`
- `ENQUETES_OPCOES_BI0`

O que faz no banco anterior:

- Em geral, gera código/data e defaults simples.
- Departamento e motivos ficam em maiúsculo.
- Solução/motivo remove caracteres ruins.
- Assunto e motivo de situação recebem ordem/defaults.

Ação no ERP novo:

- Criadas estruturas históricas leves para cada auxiliar.
- Departamento e motivos são normalizados em maiúsculo.
- Soluções/motivos são limpos de aspas e barra invertida.
- Nenhuma rotina pesada de publicidade/enquete foi ativada; apenas preservação dos dados.

### 8S.6 Avaliações

Recebido:

- `AVALIACAO_BI0`

O que faz no banco anterior:

- Gera código.
- Se a avaliação tem visita mas não tem cliente, busca o cliente pela visita.

Ação no ERP novo:

- Criado `db.avaliacoesMigradas`.
- Avaliação tenta vincular cliente e chamado pela visita antiga.

---

## 8T. Patch gerado com base na Parte 11

Arquivo criado:

- `automacoes_caixa_chat_auxiliares_patch.js`

Funções principais:

- `sincronizarRetiradasCaixa`
- `sincronizarFornecedoresTransportadores`
- `sincronizarChat`
- `sincronizarRecibosAnexosCentro`
- `sincronizarDepartamentosEAux`
- `sincronizarAvaliacoes`
- `aplicarAutomacoesCaixaChatAuxiliares`

Teste criado:

- `test_automacoes_caixa_chat_auxiliares.js`

Versão publicada:

- **v4.9.31**

---


## 8U. Parte 12 — triggers recebidas e interpretação

> Última parte enviada pelo usuário.

### 8U.1 Enquetes, votos e auxiliares de campanha

Recebido:

- `ENQUETES_PERGUNTA_BI0`
- `ENQUETES_VOTOS_BI0`
- `EMAIL_CAMPANHA_ENVIOS_EMAIL_BI0`

O que faz no banco anterior:

- Gera código de perguntas e votos.
- Votos recebem data.
- Evento de e-mail de campanha recebe código/data.
- Ocorrência acompanha a ação.
- Quando ação é maior que zero, incrementa contador de abertura do e-mail.

Ação no ERP novo:

- Criado `db.enquetesPerguntasMigradas` e `db.enquetesVotosMigrados`.
- Criado `db.emailCampanhaEventosMigrados`.
- Aberturas de e-mail migradas atualizam `emailAbriuMigrado`/`emailAbriu` em `db.emailsMigrados`.
- Nada de envio automático foi ativado.

### 8U.2 Cartão de cliente, contadores offline e e-mails offline

Recebido:

- `CARTAO_CLIENTE_BI0`
- `CONTADORES_OFF_BI0`
- `EMAIL_OFF_BI0`

O que faz no banco anterior:

- Gera código/data/funcionário.
- Preserva filas offline de cartão, contador e e-mail.

Ação no ERP novo:

- Criado `db.cartoesClienteMigrados`.
- Criado `db.contadoresOffMigrados`.
- Criado `db.emailsOffMigrados`.
- E-mails offline ficam somente como histórico, sem disparo automático.

### 8U.3 Configurações de cliente/sisprinter e contas avulsas

Recebido:

- `CONFIG_CLIENTES_BI0`
- `CONFIG_SISPRINTER_BI0`
- `CONTAS_RECEBER_AVULSA_BI0`

O que faz no banco anterior:

- Gera códigos de configurações.
- Conta avulsa classifica custos por descrição:
  - envio de e-mail;
  - SMS;
  - WhatsApp;
  - boleto;
  - Gerencianet;
  - NFC-e;
  - NF-e;
  - backup;
  - geolocalização.
- Busca valor configurado em `CONFIG_SISPRINTER` quando existir.
- Ignora registros importados de banco MySQL.

Ação no ERP novo:

- Criado `db.configClientesMigradas`.
- Criado `db.configSisprinterMigradas`.
- Criado `db.contasReceberAvulsasMigradas`.
- Os custos ficam apenas históricos/consultáveis e **não geram cobrança automática** no ERP novo.
- Registros com observação `Importado Banco Mysql` são ignorados como no banco antigo.

### 8U.4 Atacado, ramo, registros, selecionados e ramo/fabricante

Recebido:

- `PRODUTOS_ATACADO_BI0`
- `RAMO_BI0`
- `REGISTROS_BI0`
- `SELECIONADOS_BI`
- `RAMO_ITENS_FABRICANTE_BI0`

O que faz no banco anterior:

- Gera código/data.
- Guarda preço/quantidade de atacado, ramos, registros, seleção temporária e vínculo ramo/fabricante.

Ação no ERP novo:

- Criado `db.produtosAtacadoMigrados`.
- Criado `db.ramosMigrados`.
- Criado `db.registrosMigrados`.
- Criado `db.selecionadosMigrados`.
- Criado `db.ramoItensFabricanteMigrados`.
- Tudo fica como histórico leve.

### 8U.5 Histórico de boleto e Pix

Recebido:

- `BOLETOS_HISTORICO_BI0`
- `PIX_HISTORICO_INC_ANTES`

O que faz no banco anterior:

- Gera código/data.
- Histórico Pix recebe descrição do status por função antiga.

Ação no ERP novo:

- Criado `db.boletosHistoricoMigrado`.
- `db.pixHistoricoMigrado` foi aprofundado com histórico individual.
- Pix continua sem baixa automática.

### 8U.6 Estoque de toner da locação

Recebido:

- `LOCACAO_ESTOQUE_BI0`
- `LOCACAO_ESTOQUE_HISTORICO_BI0`
- `LOCACAO_ESTOQUE_HISTORICO_AD0`

O que faz no banco anterior:

- Gera código/data.
- Calcula média e máximo de impressão por dia usando contadores dos últimos 30 dias.
- Normaliza estoque e impressões negativas para zero.
- Calcula dias restantes e percentual de toner.
- Histórico de entrada/saída recalcula saldo de toner e impressões restantes.
- Quando a entrada vem de item de venda/cartucho/produto, tenta estimar rendimento por vida útil/quantidade de cópias.

Ação no ERP novo:

- Criado `db.locacaoEstoqueMigrado`.
- `db.locacaoEstoqueHistorico` foi reaproveitado/aprofundado.
- O sistema calcula:
  - estoque atual de toner;
  - impressões restantes;
  - média de impressões por dia;
  - máximo de impressões por dia;
  - dias estimados;
  - percentual estimado.
- O contrato recebe resumo de toner para conferência.
- Cálculo é histórico/operacional leve, sem rotina pesada em tempo real.

---

## 8V. Patch gerado com base na Parte 12

Arquivo criado:

- `automacoes_finais_locacao_auxiliares_patch.js`

Funções principais:

- `sincronizarEnquetesDetalhes`
- `sincronizarCartoesOffEmails`
- `sincronizarEmailCampanhaEventos`
- `sincronizarConfigsAvulsas`
- `sincronizarContasReceberAvulsas`
- `sincronizarProdutosAtacadoRamoRegistros`
- `sincronizarHistoricosBoletoPix`
- `sincronizarLocacaoEstoqueFinal`
- `aplicarAutomacoesFinaisLocacaoAux`

Teste criado:

- `test_automacoes_finais_locacao_auxiliares.js`

Versão publicada:

- **v4.9.32**

Status geral das partes enviadas:

- Partes 1 a 12 recebidas, analisadas, adaptadas em patches separados e testadas.

---


## 8W. Otimização profunda pós-Partes 1 a 12 — v4.9.33

Motivo:

- Depois de adaptar as 12 partes de automações, o carregamento ficou pesado em PCs fracos porque várias rotinas antigas verificavam dados grandes no login e em cada renderização.

Arquivo criado:

- `otimizacao_profunda_patch.js`

Ações tomadas:

- Automações pesadas passaram a entrar em uma fila ociosa, executando uma por vez, com respiro entre elas.
- Renderizações principais ganharam debounce final para evitar múltiplas renderizações seguidas.
- Busca em módulos migrados deixou de filtrar a cada tecla; agora é para Enter/lupa.
- Rotinas antigas sem assinatura ganharam assinatura/cache para não varrer `VISITAS`, `CONTADOR_PAGINAS`, contratos, parque, financeiro e compras toda hora.
- Reconciliadores de contratos/impressoras agora pulam quando nada mudou.

Arquivos ajustados para reduzir travamento:

- `automacoes_triggers_patch.js`
- `automacoes_financeiro_estoque_patch.js`
- `automacoes_locacao_visitas_patch.js`
- `automacoes_contratos_caixa_fiscal_patch.js`
- `contratos_final_patch.js`
- `contratos_visitas_vinculo_patch.js`
- patches de automações passaram a agendar execução via `DIGI_TURBO` em vez de rodar tudo imediatamente na renderização.

Teste criado:

- `test_otimizacao_profunda.js`

Versão publicada:

- **v4.9.33**

---


## 8X. Procedures operacionais — primeira remessa — v4.9.34

O usuário enviou a primeira remessa de **Procedures** depois das 12 partes de triggers.

### Grupos principais recebidos

Procedures relevantes recebidas nesta remessa:

- Fiscal/nota:
  - `ALTERAR_PERFIL_TRIBUTARIO`
  - `ITENS_NOTA_FISCAL`
  - `TOTAL_NOTA_FISCAL`
  - `GERAR_NFE`
  - `GERAR_NFSE`
  - `CLONAR_NFE`
  - `GERAR_DUPLICATAS_NFE`
- Produtos/estoque:
  - `ATUALIZAR_ESTOQUE`
  - `CORRIGIR_ESTOQUE`
  - `ATUALIZAR_VALORES_PRODUTOS`
  - `ATUALIZA_ESTOQUE_PRODUTO_SERIAL`
  - `PRODUTOS_CADASTRAR_EQUIPAMENTO`
  - `SOMA_ITENS_INSUMOS`
  - `TOTAL_GASTOS_PRODUTO`
- Locação/leitura:
  - `VALOR_LOCACAO`
  - `TOTAL_FRANQUIAS_LOCACAO`
  - `PROC_SOMA_LOCACAO`
  - `ATUALIZA_INFO_LOCACAO`
  - `ATUALIZA_ITENS_LOCACAO`
  - `ATUALIZA_TOTAL_LEITURAS`
  - `LOCACAO_ATUALIZA_VALOR_GLOBAL`
  - `LOCACAO_CADASTRAR_CONTADOR`
- Vendas/chamados/descontos:
  - `CADASTRAR_CHAMADO`
  - `CADASTRAR_CHAMADO_AVULSO`
  - `VENDA_ALTERAR_SITUACAO`
  - `VENDA_DELETAR`
  - `VENDA_DUPLICAR`
  - `VENDA_AGENDA`
  - `VENDA_COMANDA`
  - `REC_SITUACAO_CARTUCHO`
  - `ALTERAR_VLR_PROD_ITENS_VENDAS`
  - `AUTORIZAR_DESCONTO_PRODUTO`
  - `DISTRIBUIR_DESCONTOS_ITENS`
- Financeiro/Pix/cartão/boleto:
  - `GERAR_CONTAS_RECEBER`
  - `PIX_VALIDAR_EMISSAO`
  - `VENDA_CARTAO`
  - `VENDA_CARTAO_TRANSACAO`
  - `BOLETOS_GERAR`
  - `BOLETOS_GERAR_POR_PARCELAS`
  - `BOLETOS_ALTERAR_DADOS`
  - `REC_PARCIAL_CONTAS_RECEBER`
  - `REC_PARCIAL_CONTAS_PAGAR`
- Cadastros/utilitários:
  - `CLIENTE_UNIFICAR_CADASTRO`
  - `PESQUISAR_CLIENTE_AGENDA`
  - `ATUALIZA_CONFIG_CLIENTES`
  - `CONFIG_ATUALIZA`
  - `REMOVE_ACENTOS`
  - `SOMENTENUMEROS`
  - `ROUNDABNT`
  - `GERAR_CODIGO_NUMERICO_NF`
  - `COD_FUNCIONARIO_VALIDO`
  - `ATIVAR_DESATIVAR_TRIGGERS`
  - `CORRIGIR_GENERATORS`
  - `NEW_FIELD`
  - `CLONAR`
  - `CLONAR_PRODUTOS`

### O que foi implementado no ERP novo

Arquivo criado:

- `automacoes_procedures_operacionais_patch.js`

Implementado de forma leve e segura:

- Helpers puros equivalentes a procedures utilitárias:
  - `roundABNT`
  - `somenteNumeros`
  - remoção de acentos
  - código numérico de NF evitando sequências inválidas.
- Locação:
  - cálculo de valor do contrato por globais/medidores;
  - soma de franquias;
  - quantidade de equipamentos;
  - quantidade/situação de chamados;
  - atualização de leitura/contador no parque.
- Leituras:
  - total por `CONTADOR_PAGINAS`;
  - páginas/excedentes;
  - total por toner/tinta/A3/scanner quando houver dados.
- Estoque/produtos:
  - saldo por histórico de entrada/saída;
  - vínculo produto/equipamento/serial;
  - alteração de preço de item por tabela varejo/promoção/atacado.
- Vendas:
  - totalização de peças, serviços, insumos e descontos;
  - finalização de cartucho/recarga conforme configuração;
  - chamado gerado por venda/entrega quando configuração antiga pedir;
  - distribuição de desconto com arredondamento.
- Fiscal leve:
  - perfil tributário em item de nota;
  - CFOP, CSOSN/CST, ICMS, IPI, PIS, COFINS, ISSQN;
  - IBS/CBS preservados;
  - totalização leve de nota fiscal migrada.
- Pix:
  - validação para não gerar Pix por cima de boleto;
  - mantém regra atual: Pix **sem baixa automática** e com comprovante obrigatório.
- Clientes:
  - `CLIENTE_UNIFICAR_CADASTRO` virou sugestão de duplicados, sem mesclar/apagar automaticamente.
- Configuração operacional:
  - médias de tempo de aprovação/entrega preservadas como métricas internas.

### O que foi ignorado ou mantido apenas como referência

- `ATIVAR_DESATIVAR_TRIGGERS`, `CORRIGIR_GENERATORS`, `NEW_FIELD` e `CLONAR`:
  - são rotinas administrativas do banco antigo;
  - não fazem sentido no ERP novo em navegador/Electron.
- Boleto/Gerencianet:
  - não foi reativado como emissão automática;
  - apenas regras úteis e validações foram preservadas.
- NF-e completa:
  - não foi copiada literalmente porque é grande, pesada e depende de emissão fiscal real;
  - foi feita adaptação leve para preservar cálculo/campos importantes sem travar o sistema.
- Mesclagem automática de clientes:
  - não foi aplicada automaticamente para evitar apagar/vincular dados errados;
  - o ERP agora gera sugestão de duplicados para conferência.

Teste criado:

- `test_automacoes_procedures_operacionais.js`

Versão publicada:

- **v4.9.34**

---


## 8Y. Sequências legadas — v4.9.35

O usuário enviou a lista de generators/sequências do banco antigo.

Principais valores recebidos:

- `GEN_CLIENTES_ID`: `2593`
- `GEN_PRODUTOS_ID`: `1298`
- `GEN_VENDAS_ID`: `16932`
- `GEN_ITENS_LOCACAO_ID`: `1882`
- `GEN_LOCACAO_ID`: `480`
- `GEN_CONTAS_RECEBER_ID`: `18201`
- `GEN_VISITAS_ID`: `6304`
- `GEN_LEITURAS_ID`: `2604`
- `GEN_NOTA_FISCAL_ID`: `442`
- `GEN_ITENS_NOTA_ID`: `1406`
- `GEN_SEL_CONTROLE_ID`: `537`
- `GEN_SELECIONADOS_ID`: `539`

Arquivo criado:

- `sequencias_legado_patch.js`

Ação no ERP novo:

- Os últimos valores antigos foram preservados em `db.config.sequenciasLegado`.
- As sequências novas em `db.config.seq` usam esses valores como **piso**.
- Isso evita reaproveitar código antigo em clientes, vendas, OS/chamados, contratos, leituras, contas, nota fiscal etc.
- A regra atual continua: código novo é **somente número**, sem prefixo e sem ano.

Teste criado:

- `test_sequencias_legado.js`

Versão publicada:

- **v4.9.35**

---


## 8Z. Índices legados e limpeza de menus migrados — v4.9.36

O usuário enviou a lista de índices do banco antigo. A lista tinha muitos objetos, incluindo índices de sistema (`RDB$*`) e índices de log (`IBE$LOG_*`).

O que foi aproveitado:

- Campos críticos de vínculo e busca:
  - clientes por código/documento/nome;
  - vendas por código/cliente/situação/finalizada;
  - visitas por contrato/cliente/item/equipamento/venda;
  - contador de páginas por leitura/item/equipamento;
  - itens de locação por contrato/equipamento/serial/situação;
  - contas a receber por venda/leitura/cliente/boleto/Pix/vencimento;
  - itens de venda por venda/produto/cartucho/etiqueta/item de locação;
  - produtos por código/descrição/tributo/equipamento;
  - produto variação por serial;
  - nota fiscal por venda/leitura/data/cliente;
  - NCM por código.

Arquivo criado:

- `indices_legado_performance_patch.js`

Ações no ERP novo:

- Criado resumo dos índices úteis em `db.config.indicesLegadoResumo`.
- Criado cache rápido em memória `IDX_LEGADO` para consultas/vínculos internos.
- Índices internos do Firebird (`RDB$*`) e logs (`IBE$LOG_*`) foram ignorados como regra de negócio.
- Menus automáticos das tabelas migradas foram escondidos da navegação principal.
- As tabelas migradas continuam acessíveis por um único botão: **Dados migrados**.
- Os dados migrados não foram apagados; só deixaram de poluir o menu principal.

Teste criado:

- `test_indices_legado_performance.js`

Versão publicada:

- **v4.9.36**

---


## 8AA. Tipos de dados/domínios legados — v4.9.37

O usuário enviou os tipos/domínios do banco antigo.

Principais domínios recebidos:

- Documentos e contatos:
  - `CPF_CNPJ`
  - `RG_IE`
  - `TELEFONE`
  - `EMAIL`
  - `CEP`
  - `UF`
- Endereço/cadastro:
  - `RUA`
  - `BAIRRO`
  - `CIDADE`
  - `NUMERO`
  - `COMPLEMENTO`
  - `NOME`
- Descrições:
  - `DESCRICAO_50`
  - `DESCRICAO_1000`
  - `DESCRICAO_2000`
  - `DM_DESCRICAO_100`
  - `DM_DESCRICAO_250`
  - `DM_DESCRICAO_500`
- Valores:
  - `VALOR` com precisão `15` e escala `5`
  - `DM_VALOR_METRO` com precisão `12` e escala `2`
- Nativos:
  - `INTEGER`, `BIGINT`, `NUMERIC`, `DECIMAL`, `TIMESTAMP`, `VARCHAR`, `BLOB`, `BOOLEAN` etc.

Arquivo criado:

- `tipos_dados_legado_patch.js`

Ação no ERP novo:

- Os tipos foram preservados em `db.config.tiposDadosLegado`.
- Criados normalizadores/validadores leves para:
  - CPF/CNPJ;
  - CEP;
  - UF;
  - e-mail;
  - telefone;
  - valores monetários;
  - textos com limite.
- Nenhum dado existente foi reformatado automaticamente para não quebrar cadastros já importados.
- Esses tipos ficam como base para formulários, validações e futuro banco local do `.exe`.

Teste criado:

- `test_tipos_dados_legado.js`

Versão publicada:

- **v4.9.37**

---


## 8AB. Correções de uso diário e performance visual — v4.9.38

Correções solicitadas pelo usuário após testar a versão com dados migrados.

Arquivo criado:

- `correcoes_uso_diario_patch.js`

Ações tomadas:

- Removido aviso de endereço provisório do GitHack.
- `showApp` deixou de renderizar todas as telas escondidas ao entrar no sistema.
- Dashboard foi limpo para não inflar números com dados antigos migrados.
- Dashboard passa a contar movimento novo do ERP, mantendo os dados antigos guardados apenas para consulta/automação.
- Menus automáticos das tabelas migradas foram escondidos de forma mais agressiva.
- Acesso aos dados antigos ficou concentrado em **Dados migrados**.
- Área de vendas/notinhas:
  - removeu botões `Histórico`, `Imprimir` e `Excel/CSV` da barra principal;
  - manteve apenas `Nova notinha` e `Excluir`;
  - removeu aba `Orçamentos`;
  - padrão agora mostra somente notinhas de hoje;
  - busca e filtros consultam antigas quando usuário pedir;
  - busca por texto deixou de filtrar a cada tecla, usando Enter/lupa;
  - filtro por data/situação/pagamento foi refeito;
  - listagem ignora tabelas migradas que não são notinhas reais, como bairros/assuntos/orçamentos/itens;
  - histórico de notinha antiga agora mostra todos os campos originais do registro migrado e os itens vinculados quando encontrados;
  - método de pagamento antigo tenta usar `COD_RECEBIMENTO` quando não houver texto.

Teste criado:

- `test_correcoes_uso_diario.js`

Versão publicada:

- **v4.9.38**

---


## 8AC. Login direto, usuários migrados e carga automática — v4.9.40

Correções solicitadas pelo usuário após testar a tela inicial/login.

Arquivo criado:

- `login_dados_automaticos_patch.js`

Ações tomadas:

- Tela de login:
  - remove a etapa de login por CNPJ;
  - deixa somente usuário e senha;
  - painel esquerdo fica limpo, com logo grande;
  - remove textos explicativos e versão da área visual do login.
- Usuários:
  - importa `FUNCIONARIOS` do banco antigo como usuários do ERP quando os dados migrados existem;
  - preserva login/senha quando encontrados nas colunas antigas;
  - perfil antigo é convertido para Admin/Comercial/Técnico/Operador;
  - login aceita maiúsculas/minúsculas em qualquer combinação;
  - login também aceita nome completo ou primeiro nome;
  - admin demonstrativo é unido ao usuário administrador original migrado quando encontrado, sem duplicar usuário.
- Menus superiores:
  - remove submenu de `Início` e `Pesquisa rápida`;
  - clicar em `Início` abre direto a área inicial;
  - remove `Notinhas antigas` e `Novo orçamento` do menu Atendimento.
- Dados/nuvem:
  - quando o app abre sem banco migrado/local relevante, tenta carregar automaticamente da nuvem sem pedir confirmação;
  - se já houver dados locais/migrados, não sobrescreve automaticamente.

Teste criado:

- `test_login_dados_automaticos.js`

Versão publicada:

- **v4.9.44**

---


## 8AD. Correção do campo de login — v4.9.40

Correção emergencial após o usuário relatar que não conseguia digitar no campo de usuário.

Arquivo ajustado:

- `login_dados_automaticos_patch.js`

Ações tomadas:

- Recriada a área de login do usuário de forma direta e limpa.
- Inputs de usuário/senha agora ficam explicitamente habilitados, editáveis e com `pointer-events` ativo.
- O patch não re-renderiza a área enquanto o usuário está digitando.
- Mantida a tela sem etapa de CNPJ e com logo grande.

Versão publicada:

- **v4.9.44**

---


## 8AE. Modo leve de teste e reset de armazenamento local — v4.9.41

Correção após o usuário relatar travamento/congelamento.

Arquivo criado:

- `modo_leve_teste_patch.js`

Ações tomadas:

- Ativado modo leve de teste (`DIGI_MODO_LEVE`).
- Desligada sincronização automática para não travar tentando baixar base grande.
- Alterada a chave local do banco para uma base nova de teste (`v41_teste`), evitando carregar LocalStorage antigo pesado do navegador.
- App passa a iniciar com dados demo/teste locais.
- Automações pesadas agendadas pelo `DIGI_TURBO` não rodam automaticamente no modo leve.
- Reconciliações pesadas de contratos/visitas foram puladas no modo leve.
- Área de importar banco é escondida/removida do uso diário.
- Vendas não convertem milhares de notinhas antigas ao abrir; legado só é processado quando o usuário usar busca/filtro/todas.

Versão publicada:

- **v4.9.44**

---


## 8AF. Modo apresentação em `.exe` — v4.9.44

Ajuste solicitado para apresentação ao chefe/patrão.

Arquivo criado:

- `apresentacao_demo_patch.js`

Ações tomadas:

- Modo apresentação/demo ativado.
- Base local nova para o `.exe`, com dados de teste.
- Login travado para somente:
  - usuário: `admin`
  - senha: `admin123`
- Módulos/tabelas migradas removidos da apresentação.
- Menus de importação/migração escondidos.
- Navegação limpa para demonstração.
- Ao trocar de menu, a tela anterior é limpa para não ficar renderizando escondida.
- Build configurado com `asar`, nome `DIGICOPY ERP Demo`, instalador NSIS, atalho na Área de Trabalho e Menu Iniciar.
- Menu/devtools/context menu do Electron removidos para reduzir exposição casual do código.

Observação:

- Em Electron, código nunca fica 100% impossível de extrair, mas com `asar` e sem DevTools ele fica protegido o suficiente para apresentação/teste.
- Fixar automaticamente na barra de tarefas é bloqueado/limitado pelo Windows; o instalador cria atalho na Área de Trabalho e Menu Iniciar, e o app fica identificável para desinstalar como `DIGICOPY ERP Demo`.

Versão publicada:

- **v4.9.44**

---


## 8AG. Ajustes do relatório de avaliação — v4.9.44

Correções agrupadas após o usuário enviar relatório completo para avaliação do sistema antes de carregar banco oficial.

Arquivo criado:

- `ajustes_relatorio_pai_patch.js`

Ações tomadas:

- Modal com pilha/voltar: ao abrir uma aba dentro de outra, o botão volta para a tela anterior em vez de fechar tudo.
- Clientes: busca refeita no padrão de vendas, com Enter/lupa e sem filtrar a cada tecla.
- Contratos:
  - novo contrato não usa mais select fechado de cliente; cliente é escolhido por busca/lupa;
  - adicionada configuração de modalidades sem opção global;
  - padrão: Preto A4 ativo e demais medidores inativos;
  - modalidades Individual, Por Impressão e Mês Fixo mostram campos diferentes conforme solicitado.
- Leituras:
  - tela de leituras vira listagem com duplo clique para abrir detalhes;
  - nova leitura cria cabeçalho e depois abre tela detalhada;
  - dentro da leitura é possível lançar impressoras e escolher um dos medidores ativos;
  - cálculo mostra utilizado, excedente e valor total;
  - impressão de leitura gera notinha detalhada com todos os lançamentos e total.
- Vendas/notinhas:
  - busca de cliente/item dentro da nova notinha não abre resultados enquanto digita; busca só por Enter/lupa;
  - impressão/PDF bloqueada antes de faturar;
  - criada ação para estornar venda e permitir edição novamente.
- Geral:
  - faturado/finalizado mostra aviso ao tentar editar campos em modal de venda.

Teste criado:

- `test_ajustes_relatorio_pai.js`

Versão publicada:

- **v4.9.44**

---


## 8AH. Correção definitiva: modalidades na impressora e leitura detalhada — v4.9.44

Correção após o usuário apontar que as modalidades foram colocadas no cadastro do contrato, quando deveriam ficar no cadastro da impressora do contrato.

Arquivo criado:

- `contratos_leituras_definitivo_patch.js`

Ações tomadas:

- Novo contrato ficou simples: cliente por busca/lupa, início, término, vencimento e status.
- Modalidades foram movidas para `Nova Impressora`/`Alterar Impressora` dentro do contrato.
- Cada impressora possui medidores: Preto A4, Preto A3, Color A4, Color A3 e Scanner.
- Padrão de nova impressora: Preto A4 ativo; demais inativos.
- Modalidades por medidor: Individual, Por impressão, Mês fixo e Inativo.
- Opção Global removida.
- Leitura recebeu tela detalhada com lançamento por impressora e medidor ativo.
- Leitura agora possui área de faturamento e botão para gerar conta a receber.
- Impressão de leitura detalhada mostra cliente, contrato, período, impressora, tipo, contador anterior/atual, utilizado, excedente, valor e total.

Teste criado:

- `test_contratos_leituras_definitivo.js`

Versão publicada:

- **v4.9.44**

---

## 9. Como continuar quando o usuário mandar novas partes

Para cada nova parte recebida:

1. Ler as triggers/procedures.
2. Classificar cada uma como:
   - regra comercial útil;
   - automação técnica útil;
   - regra antiga que não deve copiar;
   - apenas geração de código;
   - apenas log interno.
3. Atualizar este relatório na seção da parte correspondente.
4. Se houver regra útil, criar patch separado ou ampliar patch específico sem misturar assuntos.
5. Criar/atualizar testes automatizados.
6. Rodar:
   - `npm run check`
   - `npm test`
7. Commitar e atualizar PR.

---

## 10. Pendências atuais

1. Usuário vai enviar o restante das triggers/procedures em partes.
2. Validar visualmente se contratos agora aparecem com cliente e impressoras após v4.9.19+.
3. Confirmar se os modelos RTF carregados pelo sistema estão preenchendo corretamente.
4. Se ainda houver contrato sem cliente/impressora, pedir novo diagnóstico da v4.9.20+ com:
   - dados convertidos de `contratos`
   - `clientes`
   - `equipamentos`
   - `parque`
   - `VISITAS`
   - `CONTADOR_PAGINAS`

---

## 11. Observação sobre anexos `.txt`

O chat mostrou anexos `1.txt` até `12.txt`, mas eles não apareceram acessíveis no ambiente do agente.

Por isso, para segurança, considerar como recebido apenas o texto que foi colado diretamente na conversa.

Se o usuário conseguir reenviar anexos e eles aparecerem no ambiente, analisar os arquivos diretamente. Caso contrário, continuar por partes no chat.
