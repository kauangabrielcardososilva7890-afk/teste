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
- Versão atual implementada: **v4.9.23**
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
| Parte 4 | Pendente | Aguardando envio |
| Parte 5 | Pendente | Aguardando envio |
| Parte 6 | Pendente | Aguardando envio |
| Parte 7 | Pendente | Aguardando envio |
| Parte 8 | Pendente | Aguardando envio |
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
