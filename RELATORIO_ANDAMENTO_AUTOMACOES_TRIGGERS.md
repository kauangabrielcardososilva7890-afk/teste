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
- Versão atual implementada: **v4.9.28**
- Último commit publicado no PR: `9d5ff65`
- Link de teste atual: usar raw.githack com o hash do commit `9d5ff65` e parâmetro `v=4.9.22`.

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
| Parte 9 | Pendente | Aguardando envio |
| Parte 10 | Pendente | Aguardando envio |
| Parte 11 | Pendente | Aguardando envio |
| Parte 12 | Pendente | Aguardando envio |

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
