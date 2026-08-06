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
- Versão atual implementada: **v4.9.66**
- Último commit publicado no PR: `f4128993b862e225b4c9d71a6d6123d2d62b4653` — registro parcial do Buscador Escola v4.9.66.
- Link de teste atual: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/d0193b1934e76f4cbad71973b8bac24947623eea/index.html?v=4.9.66`.
- ZIP da branch: `https://github.com/kauangabrielcardososilva7890-afk/teste/archive/refs/heads/arena/019fb6d3-teste.zip`.
- Situação do PR: aberto, **não fazer merge sem confirmação explícita do usuário**.

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

- **v4.9.49**

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

- **v4.9.49**

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

- **v4.9.49**

---


## 8AF. Modo apresentação em `.exe` — v4.9.49

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

- **v4.9.49**

---


## 8AG. Ajustes do relatório de avaliação — v4.9.49

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

- **v4.9.49**

---


## 8AH. Correção definitiva: modalidades na impressora e leitura detalhada — v4.9.49

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

- **v4.9.49**

---


## 8AI. Fluxo correto contrato > leitura > lançamento — v4.9.49

Correção após o usuário esclarecer o fluxo exato esperado.

Arquivo criado:

- `fluxo_contrato_leitura_corrigido_patch.js`

Ações tomadas:

- Modalidades ficam definitivamente no cadastro da impressora dentro do contrato.
- Novo contrato permanece simples, sem modalidades.
- Tela do contrato mostra apenas um botão `Nova Impressora`.
- Botão `Leituras` do contrato abre o histórico de leituras únicas, igual a lista de contratos.
- No histórico é possível selecionar uma leitura já feita para abrir ou faturar.
- Botão `Novo` no histórico cria uma nova leitura e abre os detalhes.
- Detalhe da leitura mostra as impressoras/medidores já lançados.
- Botão `Novo lançamento` abre uma aba separada para lançar contador.
- No lançamento há select fechado de impressora, select fechado dos medidores ativos da impressora e campo aberto somente para digitar contador.
- Faturamento ficou ligado à leitura selecionada.

Teste criado:

- `test_fluxo_contrato_leitura_corrigido.js`

Versão publicada:

- **v4.9.49**

---


## 8AJ. Busca de impressora na leitura e acesso por duplo clique — v4.9.49

Correção após o usuário apontar que a tela ainda tinha botão/radio de seleção e que contratos com muitas impressoras precisam de busca personalizada.

Arquivo criado:

- `leitura_busca_fluxo_patch.js`

Ações tomadas:

- Histórico de leituras removeu coluna/botão de selecionar.
- Leitura agora é acessada somente por duplo clique na linha.
- Faturamento fica dentro da leitura aberta, não por botão de seleção no histórico.
- Lista de impressoras do contrato removeu a coluna de tipos/medidores; edição por duplo clique.
- Novo lançamento de contador ganhou busca de impressoras por:
  - Impressora;
  - Serial;
  - Patrimônio;
  - Departamento;
  - Localização.
- Campo da impressora não mostra mais os tipos ativos ao lado.
- Impressora some da lista de lançamento quando todos os medidores ativos dela já foram lançados naquela leitura.
- Se uma impressora tiver mais de um medidor ativo, ela continua aparecendo até todos serem lançados.

Teste criado:

- `test_leitura_busca_fluxo.js`

Versão publicada:

- **v4.9.49**

---


## 8AK. Leitura detalhada por departamento e lançamentos editáveis — v4.9.49

Implementação com base nas respostas completas do usuário e nas imagens de exemplo da notinha de leitura.

Arquivo criado:

- `leitura_detalhada_departamentos_patch.js`

Ações tomadas:

- Dentro da leitura, lançamentos podem ser editados com duplo clique.
- Lançamentos podem ser removidos.
- Ao remover, o medidor volta para a lista de pendentes.
- Leitura faturada bloqueia edição/remoção e exige estorno para alterar.
- Novo lançamento mantém busca por impressora, serial, patrimônio, departamento/localização.
- Remanejadas aparecem separadas apenas como histórico e não podem receber leitura.
- Impressão da leitura agora agrupa por departamento.
- Cada departamento soma utilizado, excedente e valor.
- Cada impressora/medidor mostra serial, departamento, franquia, valor por página, excedente, contador anterior, contador atual, utilizado, acréscimo, valor excedente e total.
- Rodapé soma total utilizado, total excedente e valor geral.

Teste criado:

- `test_leitura_detalhada_departamentos.js`

Versão publicada:

- **v4.9.49**

---


## 8AL. Notinha de leitura compacta e aba Produtos visível — v4.9.49

Correções solicitadas após teste da leitura impressa e menu de produtos.

Arquivo criado:

- `leitura_impressao_compacta_produtos_patch.js`

Ações tomadas:

- Notinha de leitura ficou mais compacta.
- Impressão de leitura agora contém logo, dados da loja/empresa e dados completos do cliente.
- Criada opção para imprimir todos os departamentos ou apenas um departamento.
- A impressão continua agrupando por departamento e totalizando usado/excedente/valor.
- Garantido botão/aba Produtos no menu superior e no menu lateral, caso algum patch anterior esconda.

Teste criado:

- `test_leitura_impressao_compacta_produtos.js`

Versão publicada:

- **v4.9.49**

---


## 8AM. Alinhamento assistido do banco antigo — v4.9.49

Implementado para o usuário validar onde cada tabela migrada deve entrar sem precisar conhecer a estrutura do banco.

Arquivo criado:

- `alinhamento_banco_assistido_patch.js`

Ações tomadas:

- Adicionada área em Configurações chamada `Alinhamento do banco antigo`.
- O sistema analisa automaticamente as tabelas migradas e sugere destino:
  - Clientes;
  - Contratos/locação;
  - Impressoras do contrato;
  - Leituras;
  - Contadores;
  - Chamados;
  - Vendas;
  - Itens de venda;
  - Financeiro;
  - Produtos;
  - Cartuchos;
  - Fiscal;
  - Usuários;
  - Fornecedores;
  - Auxiliares;
  - Ignorar/técnico.
- Cada tabela tem uma chave/checkbox para marcar se a sugestão está errada.
- Usuário pode escolher o destino correto em uma caixa fechada.
- Usuário pode preencher observação por tabela.
- Módulos esperados podem ser marcados como presente/faltando/não usa/não sei.
- Botão para aplicar alinhamento automático chama as automações já criadas.
- Botão para carregar dados da nuvem fica disponível nessa mesma área.
- Botão para baixar relatório completo gera TXT com tudo que pertence, o que foi marcado errado e o que falta.

Teste criado:

- `test_alinhamento_banco_assistido.js`

Versão publicada:

- **v4.9.49**

---

## 8AN. Exemplos das tabelas no alinhamento do banco antigo — v4.9.50

Pedido do usuário:

- Mostrar exemplos das tabelas antigas para ele conseguir identificar melhor o que é cada tabela antes de marcar destino errado/correto.

Implementado:

- Criado patch separado `alinhamento_banco_exemplos_patch.js`.
- A área `Configurações > Alinhamento do banco antigo` agora recebe uma coluna `Exemplo`.
- Cada tabela mostra uma amostra curta dos primeiros registros, com alguns campos e valores.
- Botão `Ver exemplos` abre modal com até 3 exemplos e os campos encontrados na tabela.
- O relatório `.txt` baixado agora inclui a seção `Exemplos seguros das tabelas`.
- Senhas, documentos, telefones e e-mails são mascarados/reduzidos quando possível para não expor dado sensível sem necessidade.
- Corrigido escape local do patch de alinhamento para evitar erro ao abrir Configurações.

Teste criado:

- `test_alinhamento_banco_exemplos.js`

Versão publicada:

- **v4.9.50**

---

## 8AO. Aprendizado do vídeo público de configurações — v4.9.51

Motivo:

- O usuário enviou vídeo público de treinamento de configurações do sistema antigo e pediu para extrair o máximo de informação possível e já entender onde cada dado do banco deve ficar.

Principais conclusões funcionais extraídas:

- Tabelas de configuração não devem ser tratadas automaticamente como técnico/ignorar. Muitas guardam regra de negócio importante.
- Configurações relevantes identificadas por módulo:
  - empresa/dados da loja: razão social, fantasia, CNPJ, WhatsApp/e-mail público, logo, empresa ativa e recursos usados;
  - funcionários/usuários: login, senha antiga, categoria administrativa/técnica/venda, comissão e e-mails adicionais;
  - permissões: visualizar, cadastrar, alterar, deletar, faturar, relatório e exportar;
  - clientes: limite de crédito, dia de vencimento, campos obrigatórios e vendedor vinculado;
  - produtos/estoque: custo, estoque, estoque mínimo, margem, desconto por perfil, importação por XML e custo médio;
  - locação/leitura: controle sequencial fiscal da leitura, bloqueio após faturar, impressão/notinha e configuração fiscal de locação;
  - recarga/cartucho: etiqueta, histórico, técnico padrão, insumos, status e comunicação com cliente;
  - financeiro/caixa: contas a receber, recebimento, caixa diário, contas/bancos/cofre, transferência, vencimento no mês seguinte, cartão/taxas;
  - comunicação: SMTP, e-mail, SMS/WhatsApp, pesquisa de satisfação e avisos ao administrador;
  - vendas/orçamentos: cliente balcão, bloqueio de venda finalizada, estorno com motivo, garantia de OS e mensagens padrão.

Ajuste implementado no alinhamento assistido:

- Adicionados novos destinos no seletor:
  - `Empresas / dados da loja`;
  - `Configurações do sistema`;
  - `Permissões de usuários`;
  - `Caixa / contas`;
  - `Comunicação / e-mail / SMS`;
  - `Comissões`;
  - `Orçamentos / propostas`.
- A heurística deixou de mandar qualquer tabela com `CONFIG` direto para `Ignorar / técnico`.
- `CONFIG_FINANCEIRO`, `CONFIG_CLIENTES`, `CONFIG_PRODUTOS`, `CONFIG_VENDAS`, `CONFIG_LOCACAO`, `CONFIG_RECARGA`, etc. agora tendem a cair em `Configurações do sistema`.
- `EMPRESAS`/`LOJAS`/`FILIAIS` caem em `Empresas / dados da loja`.
- `RESTRICAO`/`PERMISSAO`/`PERFIL` caem em `Permissões de usuários`.
- `CAIXA`, `FLUXO_CAIXA`, `CONTA_BANCARIA`, `TRANSFERENCIA`, `RETIRADA` caem em `Caixa / contas`.
- `SMTP`, `EMAIL`, `SMS`, `WHATS`, `PUBLICIDADE`, `PESQUISA`, `NOTIFICACAO`, `MENSAGEM` caem em `Comunicação / e-mail / SMS`.

Regra de cuidado:

- O vídeo serve apenas como referência de fluxo e regra de negócio observável. Não copiar visual, nome, marca, código ou identidade do sistema antigo.

Teste atualizado:

- `test_alinhamento_banco_assistido.js` agora valida configurações, empresas, permissões e caixa.

Versão publicada:

- **v4.9.51**

---

## 8AP. Vídeo público de recarga/cartuchos e etiquetas — v4.9.52

Motivo:

- O usuário enviou vídeo público do módulo de recarga/cartucho e pediu para pegar o máximo possível, com atenção especial à geração de etiquetas a partir de 9:28.
- Usar apenas como referência funcional/operacional, sem copiar visual, marca, nome, código ou identidade do sistema antigo.

Principais regras funcionais extraídas do vídeo:

- Antes de operar recarga, o modelo do cartucho precisa estar cadastrado.
- Cada modelo de cartucho pode ter insumos padrão associados.
- Insumos podem vir de produtos/estoque e compras/XML.
- O custo da recarga é calculado pelos insumos somados a outros custos.
- Cada cartucho físico pode receber uma etiqueta perpétua, funcionando como identidade do cartucho.
- Etiqueta ajuda a rastrear histórico de recargas, clientes por onde passou, datas, defeitos, garantia e insumos usados.
- Etiqueta pode ser digitada ou lida por código de barras.
- Para o DIGICOPY ERP, etiqueta nova deve seguir a regra do usuário: somente números, sem prefixo, sem letras e sem ano.
- Existe fluxo de remanufaturado em estoque, mas no DIGICOPY ERP não deve criar “cartucho vazio” como produto separado.
- Venda/notinha pode ter recarga, remanufaturado, produto comum e OS, mas o ERP novo deve manter as regras já definidas pelo usuário para notinhas/chamados.
- Logística de recarga tem status como recebido/reciclando/pronto/defeito/garantia/entregue e filtros por toner/tinta/status/técnico.
- Garantia de recarga não gera financeiro.
- Relatórios úteis: recargas por período, técnico, modelo, tipo toner/tinta, garantia, insumos gastos e rastreamento por etiqueta.

Implementado:

- Criado patch separado `cartuchos_etiquetas_config_patch.js`.
- Adicionado card em `Configurações > Etiquetas de cartuchos`.
- O card gera etiquetas numéricas próprias para cartuchos com código de barras, prontas para imprimir em folha A4.
- O sistema lê etiquetas antigas de tabelas como `ITENS_VENDA`, `PRODUTOS_VARIACAO`, cartuchos/recargas/remanufaturados/logística e sugere o próximo número.
- Criadas configurações automáticas em `db.config.cartuchosRecargas`:
  - layout padrão de etiquetas;
  - regra `codigoSomenteNumerico`;
  - regra `cartuchoVazioComoProduto=false`;
  - status de logística;
  - resumo das etiquetas antigas encontradas.
- Adicionado botão `Atualizar e enviar nuvem` para aplicar as regras, limpar produtos indevidos e enviar a base atualizada para a nuvem quando a conexão estiver disponível.
- Corrigida automação de cartuchos para não criar mais produto `Cartucho Vazio`.
- Adicionada limpeza automática de produtos gerados anteriormente como `Cartucho Vazio` / `CARTVAZ-*`, respeitando a regra já pedida pelo usuário.
- Melhorado alinhamento assistido para classificar `ROTEIRO`, `COLETA`, `ENTREGA`, `LOGISTICA` e `MOTOBOY` como `Coleta / entrega / logística`.
- Melhorado alinhamento para classificar `REMAN`/`REMANUFATURADO` em `Cartuchos / recargas`.

Testes criados/atualizados:

- `test_cartuchos_etiquetas_config.js`
- `test_automacoes_fiscal_cartuchos.js`
- `test_alinhamento_banco_assistido.js`

Versão publicada:

- **v4.9.52**

---

## 8AQ. Estado real após os vídeos e pedido para não fazer merge — v4.9.52

Registro importante:

- O botão de pedir merge foi clicado por engano pelo usuário.
- **Não foi feito merge do PR.**
- O trabalho continua somente na branch `arena/019fb6d3-teste` e no PR #11.

Resposta objetiva ao usuário:

### 1. Tudo que foi coletado dos vídeos foi implementado?

- **Não 100%.**
- Foi implementado o que era seguro, claro e prioritário para este ciclo:
  - mapeamento mais correto das tabelas antigas;
  - separação de configurações, permissões, empresas, caixa, comunicação, comissões, orçamentos e logística;
  - exemplos das tabelas para conferência manual;
  - configurações de cartuchos/recargas;
  - etiquetas numéricas para cartuchos com código de barras;
  - uso das etiquetas antigas para sugerir o próximo número;
  - remoção da regra antiga de criar `Cartucho Vazio` como produto separado.
- O restante virou base funcional documentada para continuar sem perder contexto, especialmente:
  - venda/notinha completa;
  - recarga/cartucho com fluxo operacional completo;
  - logística/coleta/entrega;
  - relatórios de recarga;
  - garantia de cartucho;
  - financeiro/caixa completo;
  - chamados/OS;
  - clientes;
  - RTF/modelos.

### 2. Foi otimizado para não travar?

- **Sim, em várias partes**, mas ainda precisa validação com a base real do usuário.
- O que já existe para desempenho:
  - renderizar somente a tela aberta;
  - não manter telas fechadas processando;
  - busca pesada por Enter/lupa, não filtrando a cada letra;
  - sincronização incremental por partes;
  - cache/assinatura para automações não rodarem sem necessidade;
  - modo leve/manual para testes;
  - card de etiquetas e alinhamento trabalhando com amostras/limites, sem listar tudo pesado de uma vez.
- Mesmo assim, com a base real, ainda pode aparecer travamento em alguma tela específica. Se acontecer, precisa identificar a tela e otimizar ela separadamente.

### 3. Os dados antigos já estão alocados nos devidos lugares?

- **Parcialmente, sim. 100% confirmado ainda não.**
- Já existem automações e mapeamentos para levar dados antigos para:
  - Clientes;
  - Contratos/locação;
  - Impressoras do contrato;
  - Leituras;
  - Contadores;
  - Chamados/visitas;
  - Vendas/notinhas;
  - Itens da venda;
  - Financeiro/contas a receber;
  - Produtos/estoque;
  - Cartuchos/recargas;
  - Fiscal/notas;
  - Usuários/funcionários;
  - Empresas/dados da loja;
  - Permissões;
  - Caixa/contas;
  - Comunicação;
  - Comissões;
  - Orçamentos/propostas;
  - Coleta/entrega/logística;
  - Auxiliares.
- Porém, a confirmação final depende do usuário abrir a v4.9.52, carregar a nuvem, aplicar alinhamento e baixar o relatório.
- O ambiente Arena não consegue validar a nuvem real com segurança por limitação de rede/TLS, então o relatório gerado no PC do usuário continua sendo a prova principal.
- Importante: alguns dados antigos ficam preservados como fonte/histórico em `modulosDinamicos` e coleções migradas, mas não devem aparecer como menus principais. Eles servem para conferência e para reprocessamento seguro.

### 4. Sobre remover dados da nuvem

- Não apagar dados antigos em massa sem confirmação.
- Pode remover/limpar apenas dados claramente indevidos e já definidos pelo usuário, como `Cartucho Vazio` criado automaticamente como produto separado.
- Para isso foi criado botão em `Configurações > Etiquetas de cartuchos > Atualizar e enviar nuvem`.
- Qualquer outro descarte deve passar por relatório/conferência antes.

Próximo passo recomendado ao usuário:

1. Abrir link v4.9.52.
2. Ir em `Configurações > Alinhamento do banco antigo`.
3. Clicar em `Carregar nuvem`, se os dados não aparecerem.
4. Clicar em `Aplicar alinhamento automático`.
5. Ir em `Configurações > Etiquetas de cartuchos` e clicar em `Atualizar e enviar nuvem`.
6. Baixar o relatório `.txt`.
7. Mandar o relatório no chat para fechar o mapeamento definitivo.

---

## 8AR. Atualização manual do relatório solicitada pelo usuário — v4.9.52

Data da atualização: 2026-08-05.

Objetivo desta atualização:

- Reforçar o estado real do projeto após a análise dos vídeos públicos e após o clique acidental no botão de merge.
- Deixar claro para qualquer continuação futura que **não deve fazer merge agora**.
- Separar o que já foi implementado, o que está parcialmente resolvido e o que ainda depende de conferência com a base real.

Estado do PR:

- PR #11 continua aberto.
- Branch fixa: `arena/019fb6d3-teste`.
- Última versão de código: **v4.9.52**.
- Último link funcional de teste da v4.9.52:
  - `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/37bc9a24661c71d8e41c7132589e347671490b53/index.html?v=4.9.52`
- **Não fazer merge** sem o usuário pedir novamente de forma intencional.

O que já foi aplicado no código a partir dos vídeos/análises:

1. Alinhamento assistido do banco antigo:
   - sugestões de destino por tabela;
   - usuário pode marcar tabela errada;
   - usuário pode escolher destino correto;
   - relatório `.txt`;
   - exemplos seguros de registros por tabela.
2. Novos destinos no alinhamento:
   - clientes;
   - contratos/locação;
   - impressoras do contrato;
   - leituras;
   - contadores;
   - chamados/visitas;
   - vendas/notinhas;
   - itens da venda;
   - contas a receber;
   - caixa/contas;
   - produtos/estoque;
   - cartuchos/recargas;
   - usuários/funcionários;
   - permissões;
   - empresas/dados da loja;
   - configurações;
   - comunicação;
   - comissões;
   - orçamentos/propostas;
   - coleta/entrega/logística;
   - fiscal/notas;
   - fornecedores;
   - auxiliares;
   - ignorar/técnico.
3. Cartuchos/etiquetas:
   - card `Etiquetas de cartuchos` em Configurações;
   - geração de etiquetas numéricas próprias;
   - código de barras;
   - próximo número sugerido a partir de etiquetas antigas;
   - regra de etiqueta nova: somente números, sem letras, sem prefixo e sem ano;
   - configuração `db.config.cartuchosRecargas`;
   - limpeza de produtos indevidos `Cartucho Vazio` / `CARTVAZ-*`.
4. Regra corrigida:
   - cartucho vazio não deve virar produto separado.
5. Otimizações já existentes:
   - renderização somente da tela aberta;
   - busca pesada por Enter/lupa;
   - cache/assinatura de automações;
   - sincronização por partes;
   - modo leve;
   - exemplos/amostras limitadas para não carregar tudo de uma vez.

O que **não** está 100% finalizado ainda:

- O sistema ainda não está totalmente fechado para substituir o antigo.
- Os vídeos renderam várias regras, mas nem todas viraram tela completa.
- Ainda precisam evolução prática:
  - vendas/notinhas completas;
  - recarga/cartucho em tela operacional completa;
  - logística/coleta/entrega;
  - chamados/OS;
  - financeiro/caixa;
  - relatórios de recarga;
  - clientes com detalhes finais;
  - RTF/modelos de contrato/proposta.

Estado real da alocação dos dados antigos:

- O mapeamento automático está bem mais completo, mas ainda é **parcialmente confirmado**.
- Para confirmar 100%, o usuário precisa gerar o relatório pela própria base carregada da nuvem.
- Passos para confirmar:
  1. abrir v4.9.52;
  2. ir em `Configurações > Alinhamento do banco antigo`;
  3. clicar em `Carregar nuvem`;
  4. clicar em `Aplicar alinhamento automático`;
  5. revisar exemplos/destinos;
  6. ir em `Configurações > Etiquetas de cartuchos`;
  7. clicar em `Atualizar e enviar nuvem`;
  8. voltar ao alinhamento e baixar o relatório `.txt`;
  9. enviar o relatório no chat.

Cuidados para continuidade:

- Não apagar tabelas antigas úteis.
- Não remover dados em massa da nuvem sem confirmação.
- Só remover automaticamente o que já foi definido pelo usuário como indevido, exemplo: `Cartucho Vazio` como produto separado.
- Manter dados migrados fora do menu principal, mas preservados para conferência/reprocessamento.
- Continuar priorizando:
  1. Leituras;
  2. Contratos;
  3. Vendas/notinhas;
  4. Chamados/OS;
  5. Clientes;
  6. Estoque;
  7. Financeiro;
  8. Impressão/RTF.

Validação desta atualização documental:

- `npm run check` executado com sucesso.
- `npm test` executado com sucesso.

---

## 8AS. Reparo de vendas realizadas, notinha Pix e chamado avulso — v4.9.53

Motivo:

- Usuário relatou que, comparando com a v4.9.48, algumas funções de venda realizada/chamado ficaram difíceis de acessar.
- Pediu para restaurar funções úteis, manter notinha de venda em meia folha mesmo com QR Code e completar dados da loja.
- Pediu chamado avulso parecido com o chamado dentro do contrato, porém listando todos os chamados, sem mexer no fluxo de chamado específico do contrato.

Implementado em patch separado:

- `vendas_chamados_reparo_patch.js`

Vendas/notinha:

- Garantido atalho `showVenda` / `abrirVendaRealizada` apontando para o histórico da venda.
- Notinha Pix agora usa bloco de QR Code compacto para continuar cabendo em meia folha.
- Removido bloco extra de aviso Pix fora da página impressa para evitar virar folha maior.
- Dados da loja na notinha foram reforçados:
  - nome fantasia;
  - razão social;
  - CNPJ;
  - endereço completo quando disponível;
  - telefone;
  - WhatsApp para envio do comprovante/QR: `+55 38 99109-8698`.
- Notinha relacionada a chamado agora mostra aviso e botão para abrir o chamado.

Chamado avulso / histórico geral:

- `renderOs` foi substituído por uma tela de histórico geral de chamados.
- A tela mostra chamados avulsos e chamados ligados a contrato em uma lista única, com busca por Enter/lupa.
- Duplo clique abre o chamado.
- Botões por linha:
  - abrir;
  - imprimir modelo técnico;
  - imprimir chamado final quando faturado;
  - abrir notinha relacionada quando existir.

Formulário de chamado avulso:

- Adicionados/organizados campos:
  - cliente;
  - impressora/equipamento;
  - modelo;
  - patrimônio;
  - serial;
  - local;
  - motivo/defeito;
  - serviço executado;
  - técnico;
  - status;
  - contador preto anterior;
  - contador preto atual;
  - páginas preto usadas;
  - contador color anterior;
  - contador color atual;
  - páginas color usadas;
  - itens/peças usadas.
- Ao escolher impressora, o contador atual fica vazio para o usuário preencher manualmente.
- Contador color atual não é obrigatório.
- Para faturar o chamado é obrigatório:
  - cliente;
  - modelo da impressora;
  - motivo do chamado;
  - serviço executado;
  - contador preto atual.
- O chamado faturado não gera financeiro automaticamente.
- Se tiver item/peça, cria uma notinha relacionada ao chamado.
- A notinha do chamado recebe campo `chamadoId` e aviso no histórico.
- Importante: chamado não altera contador oficial da impressora. Só leitura altera contador oficial.

Impressões do chamado:

- Criado modelo 1: `Modelo técnico`:
  - pode imprimir antes de faturar;
  - vem com dados básicos, mas deixa áreas em branco para preencher em campo;
  - campos em branco para serviço executado, data de atendimento, item/quantidade, contador preto atual, contador color atual e observações;
  - assinatura do técnico e cliente.
- Criado modelo 2: `Chamado final`:
  - só imprime depois de faturar/concluir;
  - preenche automaticamente os dados lançados no sistema;
  - inclui dados completos da loja.

Exemplos de teste:

- Adicionado botão `Exemplos teste` na tela de chamados.
- Ele cria um cliente, uma impressora, um produto e um chamado de exemplo para o usuário conferir o fluxo sem depender da base antiga.
- Esses exemplos são marcados com `exemploTesteFluxo:true`.

Testes:

- Criado `test_vendas_chamados_reparo.js`.
- Testa:
  - dados completos da empresa;
  - validação do chamado antes de faturar;
  - contador color opcional;
  - cálculo de contador;
  - próximo número interno somente numérico.

Versão publicada:

- **v4.9.53**

---

## 8AT. Buscador Escola integrado ao ERP — v4.9.54

Pedido do usuário:

- Integrar ao DIGICOPY ERP um projeto separado que originalmente era Flask/SQLite para navegador.
- Adaptar para funcionar dentro do app atual, sem depender de servidor Python.
- Criar um menu único chamado `Buscador Escola`, posicionado antes de `Configurações`.

Implementado:

- Criado patch separado `buscador_escola_patch.js`.
- Criado teste `test_buscador_escola.js`.
- Criado menu lateral `Buscador Escola`, inserido antes de `Configurações`.
- Criada tela própria com:
  - configuração da API;
  - CNPJ/CPF;
  - senha local;
  - status padrão `NAEN`;
  - limite de páginas;
  - botão `Sincronizar API`;
  - busca por produto/item;
  - botão `Importar dados antigos`;
  - botão `Excel`;
  - botão `Exemplos`;
  - lista de resultados ordenada por região/distância;
  - lista de descartados/restaurar.

Adaptação técnica do projeto original:

- A estrutura SQLite foi adaptada para o banco interno do ERP:
  - `db.escolaOrcamentos`;
  - `db.escolaItens`;
  - `db.escolaExcluidos`;
  - `db.config.buscadorEscola`.
- O Flask foi substituído por JavaScript integrado ao Electron/Web.
- A senha não é salva no banco/nuvem; fica somente no `localStorage` do computador.
- A sincronização é assíncrona/paginada, com pausas curtas, para não travar a interface.
- A busca não filtra pesado enquanto digita; usa Enter/lupa.
- A exportação Excel foi adaptada para `.xls` em HTML compatível com Excel, sem depender de `openpyxl`.
- O cálculo de distância usa fórmula Haversine no próprio JavaScript.
- Base padrão: Janaúba/MG.
- Prioridade regional:
  - distância até 250 km = prioridade Norte/região próxima;
  - acima disso = longe.

Integração com API externa:

- Criado IPC no Electron em `main.js` e `preload.js`:
  - `caixaEscolarAPI.request(...)`;
  - evita bloqueio de CORS no app `.exe`;
  - tenta até 3 vezes em erros 500/502/503/504.
- No navegador comum, o módulo tenta usar `fetch` direto. Se a API bloquear CORS, o funcionamento completo será pelo Electron.
- Endpoint padrão configurado:
  - `https://api.caixaescolar.mg.gov.br`
- Fluxo implementado:
  1. POST `/login`;
  2. pega token;
  3. GET `/orcamentos?status=NAEN&page=N`;
  4. GET `/orcamentos/{id}/itens`;
  5. salva/atualiza orçamento;
  6. salva itens;
  7. descarta como removido/expirado se sumir da API.

Dados antigos:

- Criada função `Importar dados antigos`, que tenta localizar em `modulosDinamicos` tabelas com nomes relacionados a orçamento/escola/caixa.
- A importação heurística procura campos como:
  - `NOME_ESCOLA`;
  - `ESCOLA`;
  - `MUNICIPIO`;
  - `CIDADE`;
  - `DATA_FIM`;
  - `VALOR_TOTAL`;
  - `DESCRICAO`;
  - `ITEM`;
  - `PRODUTO`;
  - `QUANTIDADE`;
  - `VALOR_UNITARIO`.
- Isso permite aproveitar dados antigos se existirem tabelas compatíveis.

Cuidados:

- Não colocar CNPJ/senha real no código.
- Não salvar senha na nuvem.
- Validar a API real no PC do usuário, preferencialmente no Electron, porque o navegador pode bloquear CORS.
- Se a API real tiver campos diferentes dos descritos, ajustar o normalizador depois do teste.

Testes:

- `test_buscador_escola.js` valida:
  - normalização sem acento;
  - cálculo de distância;
  - prioridade regional;
  - importação heurística de dados antigos;
  - busca por descrição de item;
  - descartar/restaurar;
  - geração de Excel HTML.

Versão publicada:

- **v4.9.54**

---

## 8AU. Correções de erros do Buscador Escola antigo — v4.9.55

Motivo:

- Usuário enviou logs do projeto antigo do Buscador Escola com erros reais.
- Erros recebidos:
  - `PermissionError: Permission denied: log_orcamentos_deletados.txt`;
  - `sqlite3.OperationalError: database is locked`;
  - `404 Not Found` no Flask.

Correções/adaptações no ERP:

1. Erro de permissão no arquivo de log:
   - O ERP não usa mais arquivo `log_orcamentos_deletados.txt`.
   - Descartes e erros ficam em log interno no banco do ERP: `db.escolaLogs`.
   - A tela do Buscador Escola agora mostra um painel `Log interno`.
   - Isso evita erro de permissão em pasta protegida, OneDrive ou arquivo travado.

2. Erro `database is locked` do SQLite:
   - O ERP não usa SQLite separado para esse buscador.
   - Os dados ficam em arrays internos do ERP e são salvos pela persistência já existente.
   - Foi adicionado bloqueio para impedir duas sincronizações ao mesmo tempo: se uma já estiver rodando, o sistema avisa e não inicia outra.
   - A sincronização salva em lotes/páginas e faz pausas curtas para não travar a tela.

3. Erro `404 Not Found`:
   - O app não usa Flask, então não existe mais rota web local quebrando por endereço errado.
   - Para a API externa, foram adicionadas `Rotas avançadas da API` na tela:
     - rota de login;
     - rota de orçamentos;
     - rota de itens.
   - Se a API real tiver caminho diferente, o usuário ajusta na tela sem alterar código.
   - Erros 404 agora aparecem na interface e são gravados no log interno, sem estourar exceção sem tratamento.

Melhorias extras:

- Normalização de itens agora aceita o formato antigo dos logs:
  - `id_budget`;
  - `tipo`;
  - `descricao`.
- Busca agora procura também pelo `tipo` do item.
- Exportação Excel ganhou coluna `Tipo`.
- Importação dos dados antigos tenta reaproveitar `ID_BUDGET` e `TIPO`.
- O normalizador de JSON da API ficou mais tolerante para respostas em formatos como:
  - `content`;
  - `data`;
  - `items`;
  - `results`;
  - `orcamentos`;
  - `itens`.
- Token de login agora tenta ler `token`, `access_token`, `accessToken` ou `jwt`.

Dados que ainda podem ser úteis se o usuário tiver:

- Um exemplo real do JSON de login da API, sem senha/token real.
- Um exemplo real de um orçamento retornado pela API.
- Um exemplo real dos itens de um orçamento.
- Lista exata de filtros/colunas que existiam no projeto antigo e que o usuário quer manter.
- Lista de cidades prioritárias além da base Janaúba/MG, se quiser ranqueamento mais fino.

Testes atualizados:

- `test_buscador_escola.js` agora valida:
  - `id_budget`;
  - `tipo`;
  - busca por tipo;
  - log interno ao descartar;
  - Excel com coluna tipo.

Versão publicada:

- **v4.9.55**

---

## 8AV. Buscador Escola ajustado com app.py real — v4.9.56

Motivo:

- Usuário enviou o `app.py` e o `index.html` originais do projeto próprio do Buscador Escola.
- A versão anterior estava genérica; agora foi ajustada para os endpoints e campos reais do projeto original.

Ajustes principais:

- API padrão corrigida para:
  - `https://api.caixaescolar.educacao.mg.gov.br`
- Login corrigido para o endpoint real:
  - `POST /auth/login`
  - corpo compatível com `txCpfCnpj` e `txPassword`.
- Lista de orçamentos corrigida para:
  - `GET /budget-proposal/summary-by-supplier-profile`
  - parâmetros `filter.supplierStatus=$eq:NAEN`, `page` e `limit`.
- Itens corrigidos para:
  - `GET /budget-item/by-subprogram/{idSubprogram}/by-school/{idSchool}/by-budget/{idBudget}`
  - com paginação `page` e `limit`.
- Normalização de orçamento agora entende:
  - `idBudget`;
  - `idSchool`;
  - `idSubprogram`;
  - `schoolName`;
  - `countyName`;
  - `nuBudgetOrder`.
- Normalização de itens agora entende:
  - `txBudgetItemType`;
  - `txDescription`;
  - além dos campos antigos `id_budget`, `tipo` e `descricao`.

Melhorias de busca e resultado:

- Adicionado filtro de região igual ao projeto original:
  - MG todo;
  - Norte de Minas;
  - Norte prioritário.
- Adicionado intervalo de resultados no estilo `1-10`.
- Busca considera tipo e descrição do item.
- Ordenação melhorada para aproximar a lógica original:
  - primeiro orçamentos que têm apenas o produto pesquisado;
  - depois cidades prioritárias quando aplicável;
  - depois menor quantidade de produtos extras;
  - depois menor distância.
- Tabela agora mostra:
  - prioridade;
  - código/escola;
  - município;
  - distância;
  - tipo/produto;
  - quantidade de extras;
  - link para abrir orçamento no portal.

Melhorias de sincronização:

- Criado botão `Atualizar` para sincronização incremental.
- Criado botão `Baixar tudo`, que limpa os orçamentos/itens do Buscador Escola e baixa novamente.
- Mantido bloqueio contra sincronização dupla, evitando o problema antigo de concorrência.
- No Electron, `main.js` agora retorna cookies da autenticação e aceita cookie nas requisições seguintes, além de Bearer token. Isso cobre API por token ou sessão/cookie.

Segurança:

- Não foi colocado CNPJ/senha real no código.
- Senha continua salva somente localmente no computador, não na nuvem/código.

Testes atualizados:

- `test_buscador_escola.js` valida:
  - campos reais da API;
  - rota real de orçamentos;
  - rota real de itens;
  - item com `txBudgetItemType` e `txDescription`;
  - filtro Norte de Minas;
  - descarte/restauração;
  - exportação Excel HTML.

Versão publicada:

- **v4.9.56**

---

## 8AW. Sistema virgem, usuários oficiais e proteção casual do código — v4.9.57

Pedido do usuário:

- Remover dados do banco antigo e deixar o sistema virgem.
- Preservar somente clientes existentes, pois os clientes reais serão reenviados.
- Publicar a base limpa na nuvem.
- Remover login por CNPJ.
- Criar usuários oficiais:
  - Kauan / 6132;
  - Recepção / 3232;
  - Katia / 1524;
  - Denivaldo / 1234 inicialmente.
- Denivaldo deve trocar senha no primeiro acesso, com aviso para colocar a senha do usuário do banco antigo.
- Reforçar proteção casual do código no `.exe`.

Implementado:

- Criado patch separado `sistema_virgem_usuarios_patch.js`.
- Criado teste `test_sistema_virgem_usuarios.js`.
- Ao abrir esta versão, se a base ainda não tiver sido marcada como virgem:
  - limpa dados operacionais antigos/migrados;
  - remove `modulosDinamicos`;
  - remove vendas, contratos, leituras, chamados, produtos, equipamentos, financeiro, fiscal migrado, buscador escola e demais arrays operacionais;
  - preserva `db.clientes`;
  - recria usuários oficiais;
  - remove admin/admin123;
  - marca `db.config.sistemaVirgem`.
- Login passa a ser direto por usuário/senha, sem CNPJ.
- Usuários oficiais configurados.
- Kauan fica como Admin total.
- Denivaldo entra com senha temporária `1234` e recebe modal obrigatório:
  - `mude a senha, coloque a senha do usuario do banco antigo`
- Depois que Denivaldo troca, passa a usar a nova senha.
- Em Configurações foi adicionado card `Sistema virgem / Nuvem` com botão para publicar base virgem.
- Após login, o sistema tenta publicar a base virgem na nuvem usando `syncEnviarParaNuvem({forcar:true})`.
- `sync_client.js` foi ampliado para sincronizar também dados do Buscador Escola:
  - `escolaOrcamentos`;
  - `escolaItens`;
  - `escolaExcluidos`;
  - `escolaLogs`.

Proteção casual do código:

- Em `main.js`, devtools foi desativado no `BrowserWindow` com `devTools:false`.
- Atalhos F12 e Ctrl/Shift/I/J/C são bloqueados.
- Menu e botão direito continuam bloqueados.
- Observação importante: Electron/ASAR/ofuscação dificulta acesso casual, mas não torna impossível alguém extrair/ler código. Não prometer segurança absoluta.
- Não existe “código DLL próprio” do ERP para ofuscar; as DLLs são do runtime Electron/Windows. O código do app está em JavaScript dentro do pacote.

Resposta honesta sobre funcionamento:

- `npm run check` e `npm test` passam, então o código não está quebrando nos testes automatizados.
- As funções principais estão implementadas e salvam no banco interno/local e na nuvem quando sincronização funciona.
- Porém, não afirmar que “tudo está 100% perfeito” sem teste real do usuário no fluxo completo. O correto é testar no PC com dados reais de clientes.
- A partir desta versão, sem dados antigos, os registros novos devem salvar normalmente e ir para a nuvem pelo mecanismo já implementado.

Versão publicada:

- **v4.9.57**

---

## 8AX. Login diário, nome Sistema Digicopy, dados da loja e importação de clientes — v4.9.58

Pedido do usuário:

- Todo dia, na primeira inicialização, pedir login novamente.
- Remover o nome `ERP` da interface e deixar somente `Sistema Digicopy`.
- Criar área para preencher dados completos da loja e usar em qualquer relatório/notinha.
- Explicar onde importar os clientes.
- Importar somente clientes do banco antigo.
- Manter continuação do código dos clientes.
- Códigos devem ser somente número, sem letras e sem formato `0001`.
- Demais módulos começam do 1 porque o sistema está virgem.

Implementado:

- Criado patch separado `sistema_clientes_loja_patch.js`.
- Criado teste `test_sistema_clientes_loja.js`.
- Login diário:
  - cada sessão recebe `loginDia`;
  - se abrir o sistema em outro dia, a sessão é removida e pede login novamente;
  - se já logou no mesmo dia, continua podendo usar enquanto a sessão existir.
- Nome visual ajustado para `Sistema Digicopy` em pontos principais da interface, título da janela e pacote.
- `main.js` agora usa título `Sistema Digicopy`.
- `package.json` agora usa `Sistema Digicopy` como nome do produto/atalho/instalador.

Dados da loja:

- Adicionado card em `Configurações`:
  - `Dados da loja para relatórios e notinhas`.
- Campos:
  - nome fantasia;
  - razão social;
  - CNPJ;
  - telefone;
  - WhatsApp;
  - rua/avenida;
  - número;
  - bairro;
  - cidade;
  - UF;
  - CEP;
  - e-mail.
- Salva em:
  - `db.config.loja`;
  - `db.config.empresa`;
  - primeira empresa em `db.empresas`.
- Isso permite que notinhas/chamados/relatórios usem os dados completos da loja.

Importação dos clientes:

- Adicionado card na tela `Clientes` para importar JSON.
- O usuário deve abrir:
  - `Clientes > Importar clientes reais`.
- Arquivos recomendados:
  - `CLIENTES.json`;
  - `CLIENTES_FINAL.json`.
- Arquivos `CLIENTES_USUARIOS.json` e `CLIENTES_USUARIOS_RESTRICAO.json` não são necessários para os clientes, pois usuários agora são fixos. O importador ignora arquivos com `USUARIOS`/`RESTRICAO` no nome para não misturar dados.
- O importador aceita formatos:
  - array direto;
  - `{dados:[...]}`;
  - `{data:[...]}`;
  - `{rows:[...]}`;
  - `{items:[...]}`.
- Campos aceitos para cliente incluem:
  - `COD_CLIENTE`, `CODIGO`, `ID`;
  - `NOME_RAZAOSOCIAL`, `RAZAO_SOCIAL`, `NOME`;
  - `FANTASIA`, `NOME_FANTASIA`;
  - `CPF_CNPJ`, `CNPJ`, `CPF`, `DOCUMENTO`;
  - telefone/celular/WhatsApp;
  - e-mail;
  - endereço, número, bairro, cidade, UF, CEP;
  - RG/IE.
- Código do cliente é convertido para número puro:
  - `00025` vira `25`;
  - sem prefixo;
  - sem letras;
  - sem zeros à esquerda.
- Se cliente já existir por documento ou código, atualiza. Caso contrário, cria.
- O próximo cliente continua do maior código importado.

Observação para continuidade:

- Depois que o usuário confirmar que importou os clientes corretamente, fazer a versão final removendo abas administrativas/teste/nuvem conforme solicitado.
- Ainda não remover essas áreas agora, porque o usuário precisa importar clientes e confirmar.

Testes:

- `test_sistema_clientes_loja.js` valida:
  - extração de linhas JSON;
  - mapeamento de cliente;
  - código numérico puro;
  - ignorar arquivos de usuários/restrição;
  - continuação de código;
  - salvar dados completos da loja;
  - formato do login diário.

Versão publicada:

- **v4.9.58**

---

## 8AY. Finalização operacional, menus finais e clientes ordenáveis — v4.9.59

Pedido do usuário:

- Ao clicar no X, fechar modal/aba ou apertar ESC, voltar para a aba anterior.
- Ao salvar/faturar, permanecer na mesma tela e atualizar automaticamente.
- Remover menus migrados e menus administrativos extras, como nuvem/importação/testes.
- Garantir menu `Buscador Escola` visível.
- Restaurar cliente com ordenação clicando em Código/Nome/Fantasia etc., padrão por código de cliente.
- Manter principalmente notinhas/impressões com dados da loja completos e layout já solicitado.
- Preparar versão final para baixar.

Implementado:

- Criado patch separado `finalizacao_sistema_patch.js`.
- Criado teste `test_finalizacao_sistema.js`.
- Histórico de abas:
  - `navigateTo` agora guarda aba anterior;
  - fechamento por X/ESC do modal chama volta para aba anterior.
- Fechamento por ação programática de salvar/faturar não força voltar para outra aba.
- Funções comuns de salvar/faturar são envolvidas para atualizar a tela atual e permanecer no módulo atual.
- Menus finais:
  - removidos itens migrados/dinâmicos;
  - removidos atalhos visíveis de importação/migração/nuvem/teste/backup;
  - removidos relatórios/contas a pagar/nova despesa do menu final;
  - removidos cards administrativos extras de alinhamento e sistema virgem da tela final.
- `Buscador Escola` agora é reinserido de forma reforçada:
  - no menu lateral antes de Configurações;
  - também no menu superior, antes de Configurações, quando disponível.
- Clientes:
  - nova tela final de clientes;
  - padrão ordenado por código crescente;
  - cabeçalhos clicáveis para ordenar por código, nome, fantasia, telefone, CPF/CNPJ e cidade;
  - busca por Enter/lupa;
  - sem barra A-Z;
  - código mostrado como número puro.
- Impressão/notinhas:
  - reforçada substituição dos dados da loja nas notinhas quando `db.config.loja` estiver preenchido.

Observação:

- Esta versão ainda mantém o código dos módulos antigos no pacote para não quebrar dependências internas, mas os menus administrativos/migrados ficam escondidos/removidos da interface final.
- O usuário informou que os dados já estão na nuvem; a versão passa a usar normalmente a base atual.

Testes:

- `test_finalizacao_sistema.js` valida:
  - ordenação numérica de código;
  - ordenação por nome;
  - filtro de clientes;
  - código numérico puro.

Versão publicada:

- **v4.9.59**

---

## 8AZ. Correção definitiva do menu Buscador Escola e planejamento mobile — v4.9.60

Pedido do usuário:

- O menu `Buscador Escola` ainda não aparecia.
- Perguntou se é possível transformar o sistema em app de celular mantendo a mesma nuvem online.

Correção implementada:

- O `Buscador Escola` agora foi colocado diretamente no `buildNav()` do `app.js`, não dependendo apenas de injeção posterior por patch.
- `navigateTo('buscador-escola')` agora cria a view pelo `ensureView('buscador-escola')` e chama `renderBuscadorEscola()` diretamente quando disponível.
- O menu superior também ganhou item fixo `Buscador Escola` antes de Configurações.
- Criado teste `test_menu_buscador_final.js` para validar:
  - menu lateral;
  - renderização via navigateTo;
  - menu superior fixo.

Sobre app para celular:

- É possível transformar o Sistema Digicopy em app mobile.
- Melhor caminho técnico recomendado:
  1. manter o sistema web/Electron como base;
  2. adaptar layout responsivo para celular;
  3. empacotar com Capacitor/Ionic ou transformar em PWA;
  4. manter a mesma nuvem/Firebase/sincronização online.
- O app mobile deve usar a mesma base online, mas precisa cuidados:
  - telas grandes viram listas/cards;
  - impressão vira PDF/compartilhamento;
  - busca sempre por botão/Enter para não travar;
  - offline/cache precisa ser pensado para não duplicar dados;
  - permissões e login diário permanecem.
- Não iniciar mobile antes de estabilizar a versão final desktop, para não duplicar bug em duas plataformas.

Versão publicada:

- **v4.9.60**

---

## 8BA. Clientes sem listar tudo por padrão e decisão mobile — v4.9.61

Pedido do usuário:

- Na tela de clientes, remover o padrão que mostra todos os clientes automaticamente.
- Só listar clientes quando pesquisar ou usar filtros.
- Confirmou que app mobile só deve ser feito depois que o sistema estiver 100%.

Implementado:

- Ajustado `finalizacao_sistema_patch.js`.
- Tela de clientes agora abre sem carregar/listar todos os clientes por padrão.
- A lista só aparece se:
  - digitar uma busca e apertar Enter/lupa;
  - escolher um campo específico de pesquisa;
  - aplicar filtro de status/condição.
- Filtros adicionados/visíveis:
  - ativos;
  - inadimplentes;
  - ocultos/inativos;
  - sem telefone;
  - sem endereço;
  - todos status.
- Mensagem inicial explica: `Pesquise ou escolha um filtro para listar os clientes. A lista não abre tudo por padrão para ficar leve.`
- Mantida ordenação por coluna, com padrão por código crescente quando a lista aparece.

Mobile:

- Decisão registrada: app para celular fica para depois que o sistema desktop estiver estabilizado/100%.
- Quando chegar nessa fase, manter a mesma nuvem online e adaptar layout para mobile/PWA/Capacitor.

Teste atualizado:

- `test_finalizacao_sistema.js` agora valida que clientes não lista tudo por padrão e lista ao pesquisar/filtrar.

Versão publicada:

- **v4.9.61**

---

## 8BB. Ajustes pós-final solicitados pelo usuário — v4.9.62

Pedido do usuário:

- Impressoras de locação não podem aparecer no menu Produtos.
- Ao sair de uma venda em andamento pelo botão sair, X ou ESC, perguntar se deseja salvar a notinha.
- Impressões/PDFs devem ter rodapé com dados completos da loja, sem repetir informações da empresa no rodapé da venda.
- Chamados devem destacar as áreas/seções como motivo, serviços, observações, contadores e itens.
- Atualizações não podem apagar/comprometer o banco de dados.
- Remover a barra superior duplicada do app, porque o `.exe` já tem barra própria.
- Usuários precisam ser modificáveis: nome, senha e perfil, com perfil alterável somente por Kauan ou Denivaldo.
- Adicionar assistente local para explicar funções do sistema.
- Etiquetas devem ser menores e usar número direto, sem `00001`.

Implementado:

- Criado patch separado `ajustes_pos_final_patch.js`.
- Criado teste `test_ajustes_pos_final.js`.

Correções:

1. Produtos / impressoras de locação:
   - Produtos identificados como impressora/equipamento de locação ficam ocultos do menu Produtos.
   - Produtos normais que apenas possuem a palavra impressora no nome continuam aparecendo.

2. Venda em andamento:
   - Ao tentar fechar modal de venda com dados/itens preenchidos, aparece confirmação:
     - OK: salva a notinha;
     - Cancelar: sai sem salvar.

3. Impressões/PDF:
   - Adicionado rodapé padrão com dados da loja para janelas HTML de impressão.
   - Evita repetir CNPJ/dados da empresa no audit/rodapé da notinha de venda.
   - Contrato RTF não é alterado.

4. Chamados:
   - Seções de chamado recebem faixa visual destacada para Motivo/Defeito, Serviço executado, Observações, Contadores, Itens/Peças.

5. Banco não apagar em atualização:
   - `sistema_virgem_usuarios_patch.js` foi ajustado para nunca limpar dados automaticamente em atualização.
   - Reset virgem destrutivo não roda mais sozinho.
   - Atualizações futuras não devem apagar clientes/vendas/contratos por causa desse patch.

6. Barra duplicada:
   - `.app-titlebar` foi ocultada. O `.exe` fica com a barra própria do sistema.

7. Usuários editáveis:
   - Usuário pode alterar nome/senha conforme permissão.
   - Perfil só pode ser alterado por Kauan ou Denivaldo.

8. Assistente local:
   - Adicionado botão flutuante `IA`.
   - É um assistente local de ajuda, não uma IA online paga.
   - Responde dúvidas sobre cliente, venda/notinha, chamado, leitura, contrato, Buscador Escola, etiquetas, Pix e financeiro.

9. Etiquetas:
   - Etiquetas agora são menores.
   - Layout padrão ajustado para 5 colunas por 13 linhas.
   - Sequência de etiquetas agora usa número direto: `1`, `2`, `3`, sem zeros à esquerda.

Testes atualizados:

- `test_cartuchos_etiquetas_config.js` ajustado para número direto e etiqueta pequena.
- `test_ajustes_pos_final.js` criado para validações pós-final.

Versão publicada:

- **v4.9.62**

---

## 8BC. Etiquetas 1–126, IA com ChatGPT opcional e resposta sobre Buscador — v4.9.63

Pedido do usuário:

- Etiquetas ainda estavam com espaço grande/comprido.
- Etiqueta usada na loja é pequena, como a imagem enviada.
- Padrão deve ir de `1` até `126`. Se alterar início para `509`, o final deve ir para `635`.
- Assistente local deve poder funcionar como ChatGPT.
- A barra/rodapé removido deixou área vazia; menus devem ocupar melhor o espaço.
- Usuário pediu retorno sobre o Buscador Escola.

Implementado:

- Etiquetas:
  - Layout padrão alterado para micro etiquetas em folha A4.
  - Agora usa 7 colunas por 18 linhas.
  - Etiqueta menor, com código de barras compacto e número abaixo.
  - Número direto, sem zeros à esquerda.
  - Adicionado campo `Número final`.
  - Padrão inicial/final: `1` até `126`.
  - Ao trocar o início para número maior, o final é sugerido como início + 126, atendendo o exemplo `509` → `635`.

- Assistente:
  - O botão `IA` continua como ajuda local.
  - Agora tem botão `GPT` para configurar uma chave de IA/OpenAI localmente.
  - A chave fica somente no computador do usuário (`localStorage`), não vai para o código nem para a nuvem.
  - No Electron, `main.js` ganhou IPC `ai:chat` para chamar ChatGPT/OpenAI sem expor lógica na tela.
  - Se não houver chave ou falhar internet/API, o assistente responde com ajuda local.

- Layout/topo:
  - Corrigida a barra superior duplicada com CSS para o menu superior ocupar o topo (`top:0`) sem deixar faixa vazia.

- Buscador Escola:
  - Já havia sido corrigido na v4.9.60 para aparecer direto no menu lateral e superior.
  - Nesta resposta deve deixar claro ao usuário que pode enviar todos os dados do Buscador, mas os dados sensíveis/senhas devem ser omitidos.
  - Se quiser “igual antes”, usar como base o app.py/index.html enviados e manter a tela limpa com termo, região, intervalo, Atualizar, Baixar Tudo, Excluídos e Excel.

Testes atualizados:

- `test_cartuchos_etiquetas_config.js` atualizado para validar:
  - sequência sem zeros;
  - intervalo `509` até `635`;
  - layout pequeno 7 colunas.

Versão publicada:

- **v4.9.63**

---

## 8BD. Assistente IA trocado para Gemini — v4.9.64

Pedido do usuário:

- Usar Gemini por ter opção grátis/limitada.
- Remover OpenAI do assistente.
- Enviar novamente o link para pegar a API key do Gemini.

Implementado:

- Removida integração OpenAI/ChatGPT do código do assistente.
- `main.js` agora usa Gemini via endpoint:
  - `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Modelo padrão:
  - `gemini-1.5-flash`
- Botão do assistente mudou de `GPT` para `Gemini`.
- A chave agora é salva localmente em:
  - `localStorage.digicopy_gemini_api_key`
- A interface orienta pegar chave em:
  - `https://aistudio.google.com/app/apikey`
- Sem chave ou sem internet/API, o assistente continua respondendo com a ajuda local do sistema.
- A IA online recebe contexto para responder sobre o Sistema Digicopy e também perguntas gerais.

Teste criado:

- `test_assistente_gemini.js`

Valida:

- `main.js` usa endpoint Gemini;
- código não usa endpoint OpenAI;
- interface fala Gemini e usa chave local própria.

Versão publicada:

- **v4.9.64**

---

## 8BE. Chave Gemini salva no sistema e histórico apagado ao fechar — v4.9.65

Pedido do usuário:

- Não salvar a chave Gemini apenas localmente.
- Deixar a chave salva no sistema.
- Apagar histórico do chat ao fechar o sistema.
- Usuário colou uma chave no chat, mas por segurança ela não deve ser gravada no código/repositório.

Implementado:

- A chave Gemini agora é salva em `db.config.ia.geminiApiKey`, ou seja, no banco/configuração do sistema.
- A versão nova não usa `localStorage.setItem('digicopy_gemini_api_key')` para salvar a chave.
- Ao abrir o botão `Gemini`, o usuário cola a chave uma vez e ela fica salva no sistema para os PCs que sincronizam a base.
- Se a chave já estiver configurada, clicar em Cancelar mantém a chave.
- Se deixar vazio e confirmar, apaga a chave salva.
- Histórico do chat não é persistido.
- No `beforeunload`, o sistema também remove chaves antigas de histórico local se existirem.

Segurança:

- A chave enviada pelo usuário no chat não foi escrita no código.
- Recomendar ao usuário revogar/gerar outra chave no Google AI Studio porque uma chave colada no chat deve ser tratada como exposta.
- Link para gerar chave Gemini:
  - `https://aistudio.google.com/app/apikey`

Teste atualizado:

- `test_assistente_gemini.js` valida que:
  - o endpoint Gemini é usado;
  - OpenAI não é usado;
  - a interface fala Gemini;
  - a chave não é salva no localStorage antigo.

Versão publicada:

- **v4.9.65**

---

## 8BF. Remoção da IA, etiquetas ultra compactas e registro do Buscador — v4.9.66

Pedido do usuário:

- Esquecer/remover o sistema de IA.
- Etiquetas devem economizar o máximo de espaço possível em uma folha.
- O exemplo de 126 era apenas exemplo; o sistema deve calcular o máximo que cabe na folha automaticamente.
- Ao informar número inicial, o final deve ser preenchido automaticamente com a capacidade máxima da folha.
- Se o usuário alterar o final manualmente, deve diminuir a quantidade usada na folha sem alterar o início.
- Código visível da etiqueta continua número direto, sem zeros à esquerda.
- O usuário começou a reenviar o `app.py` do Buscador Escola para registro e avisou que enviará os códigos em partes até dizer `acabei`.

Implementado:

- Assistente IA removido da interface e do IPC:
  - removido `digicopyAI` do `preload.js`;
  - removido `ai:chat`/Gemini do `main.js`;
  - removido botão flutuante de IA do patch final;
  - removido `test_assistente_gemini.js` e referência do `npm test`.
- Etiquetas:
  - layout novo `A4_12X27_MICRO_MAX`;
  - 12 colunas por 27 linhas;
  - capacidade máxima padrão: 324 etiquetas por folha;
  - número inicial preenche automaticamente o final como `início + 323`;
  - se o usuário editar o número final manualmente, imprime somente do início ao final informado;
  - código visível continua direto: `1`, `2`, `3`, sem `00001`;
  - etiqueta contém texto pequeno `DIGICOPY`, código de barras compacto e número.

Registro do Buscador Escola:

- Usuário reenviou `app.py` original novamente.
- Pontos importantes confirmados no código enviado:
  - API base: `https://api.caixaescolar.educacao.mg.gov.br`;
  - login: `/auth/login`;
  - campos de login: `txCpfCnpj` e `txPassword`;
  - lista: `/budget-proposal/summary-by-supplier-profile`;
  - filtro: `filter.supplierStatus=$eq:NAEN`;
  - itens: `/budget-item/by-subprogram/{idSubprogram}/by-school/{idSchool}/by-budget/{idBudget}`;
  - campos de orçamento: `idBudget`, `idSchool`, `idSubprogram`, `schoolName`, `countyName`, `nuBudgetOrder`;
  - campos de item: `txBudgetItemType`, `txDescription`;
  - regiões prioritárias e Norte de Minas conforme lista já incorporada.
- Aguardar o usuário enviar todos os arquivos/códigos e a mensagem `acabei` antes de novas adaptações grandes do Buscador.
- Não gravar credenciais sensíveis no código/repositório. Se for necessário salvar login/senha do Buscador, preferir salvar em configuração do sistema/nuvem de forma controlada, não em arquivo de código.

Testes atualizados:

- `test_cartuchos_etiquetas_config.js` valida:
  - capacidade 324;
  - intervalo manual;
  - layout pequeno 12 colunas;
  - número sem zeros à esquerda.

Versão publicada:

- **v4.9.66**

---

## 8BG. Buscador Escola — index.html original recebido e cuidado com senha — v4.9.66

Contexto:

- Usuário enviou o `index.html` original da pasta `templates` do projeto próprio do Buscador Escola.
- Usuário informou que pretende enviar usuário/senha porque não quer digitar sempre.

Arquivo recebido nesta etapa:

- `templates/index.html` original do projeto Flask.

Elementos funcionais extraídos do HTML:

- Tela original possui cabeçalho `CAIXA ESCOLAR MG - BUSCADOR`.
- Cards no topo:
  - última atualização;
  - orçamentos em banco.
- Área de busca com:
  - termo de busca;
  - região;
  - intervalo;
  - botão pesquisar.
- Botões principais:
  - Atualizar;
  - Baixar Tudo;
  - Excluídos.
- Barra de progresso:
  - porcentagem;
  - mensagem de sincronização.
- Resultados em cards com:
  - código do orçamento;
  - link abrir orçamento;
  - botão excluir;
  - badge de prioritário;
  - badge verde quando orçamento contém apenas o produto pesquisado;
  - aviso amarelo/vermelho quando há produtos adicionais;
  - escola;
  - município;
  - distância de Janaúba;
  - produtos encontrados/total;
  - lista de produtos com tipo e descrição.
- Tela de excluídos com:
  - abrir orçamento;
  - ativar/restaurar;
  - motivo da exclusão.
- Exportação Excel usava `/api/exportar`.
- Intervalo de resultados usava formato `1-10`.

Pontos para adaptar no Sistema Digicopy quando o usuário disser `acabei`:

1. Fazer o Buscador Escola ficar visualmente mais próximo do fluxo antigo, porém com estética do Sistema Digicopy.
2. Manter:
   - termo;
   - região;
   - intervalo;
   - Atualizar;
   - Baixar Tudo;
   - Excluídos;
   - progresso de sincronização;
   - cards de resultado;
   - badges de apenas produto pesquisado e produtos extras;
   - link para abrir orçamento no portal;
   - exportação Excel.
3. Não usar Flask nem SQLite separado.
4. Continuar usando banco interno/nuvem do Sistema Digicopy.
5. Evitar travamento:
   - sincronização paginada;
   - renderização por intervalo;
   - busca somente por botão/Enter.

Sobre usuário/senha da API do Buscador:

- Não é recomendado o usuário enviar senha no chat.
- Melhor solução a implementar:
  - criar área de configuração do Buscador Escola no próprio Sistema Digicopy;
  - usuário digita usuário/senha uma vez dentro do app;
  - o sistema salva em `db.config.buscadorEscola.credenciais` ou estrutura equivalente;
  - campos aparecem mascarados;
  - sincroniza pela nuvem se o usuário quiser que todos os PCs usem;
  - não gravar credencial em arquivo de código/repositório.
- Se o usuário já tiver colado uma senha no chat, tratar como senha exposta e recomendar trocar depois.

Estado:

- Aguardar o usuário enviar os demais códigos/arquivos.
- Só fazer adaptação completa do Buscador quando o usuário escrever `acabei`.

---

## 8BH. Buscador Escola — `.env` original recebido parcialmente — v4.9.66

Contexto:

- Usuário enviou o conteúdo do `.env` do projeto original do Buscador Escola.
- O arquivo possuía duas variáveis principais:
  - `USUARIO` — CPF/CNPJ usado no login da API;
  - `SENHA` — senha da API.
- A senha real não foi registrada aqui.

Regra de segurança:

- Não salvar usuário/senha da API diretamente em código do repositório.
- Não colocar senha real no relatório.
- Para resolver a necessidade do usuário de não digitar sempre, criar configuração dentro do próprio Sistema Digicopy:
  - campo `Usuário/CNPJ da API`;
  - campo `Senha da API`;
  - botão `Salvar credenciais`;
  - campos mascarados;
  - dados salvos em configuração do banco do sistema/nuvem, não em arquivo `.env` nem no código.

Adaptação futura quando usuário disser `acabei`:

- Migrar a ideia do `.env` para `db.config.buscadorEscola.credenciais` ou estrutura equivalente.
- Manter endpoint real já identificado no `app.py`:
  - login `/auth/login`;
  - corpo com `txCpfCnpj` e `txPassword`.
- Não depender de arquivo `.env` no app final/Electron.

---

## 8BI. Buscador Escola — `.gitignore` original recebido — v4.9.66

Contexto:

- Usuário enviou o `.gitignore` original do projeto próprio do Buscador Escola.

Conteúdo recebido:

```gitignore
.env
*.db
__pycache__/
*.pyc
.pytest_cache/
*.xlsx
*.pdf
.DS_Store
```

Conclusões para adaptação ao Sistema Digicopy:

- O projeto original já tratava `.env` como arquivo sensível e fora do Git.
- O banco local `*.db` também não era versionado.
- Relatórios gerados (`*.xlsx`, `*.pdf`) não eram versionados.
- No Sistema Digicopy final:
  - não usar `.env` para credenciais do Buscador;
  - não salvar senha em código/repositório;
  - se credenciais forem necessárias, salvar em configuração do próprio sistema, com campo mascarado;
  - não gerar/guardar `.db` separado;
  - usar o banco/nuvem já existente do Sistema Digicopy;
  - exportações Excel/PDF devem continuar como arquivos gerados pelo usuário, não parte do código.

Estado:

- Aguardar o usuário enviar os demais arquivos/códigos e escrever `acabei` antes de adaptar o Buscador Escola completo.

---

## 8BJ. Buscador Escola — `.bat` de inicialização original recebido — v4.9.66

Contexto:

- Usuário enviou o arquivo `.bat` usado no projeto antigo para iniciar o Flask local e abrir o navegador.

Fluxo original do `.bat`:

```bat
@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo.
echo INICIANDO CAIXA ESCOLAR WEB
echo [*] Iniciando servidor...
start python app.py
timeout /t 3 /nobreak
echo [*] Abrindo navegador...
start http://127.0.0.1:5000
echo Servidor rodando em: http://127.0.0.1:5000
echo Para fechar tudo: Feche o navegador e aperte Ctrl+C aqui
pause
```

Conclusões para o Sistema Digicopy:

- No app final/Electron não deve existir esse `.bat` para abrir Flask.
- O Sistema Digicopy já abre como app/`.exe`, sem precisar iniciar `python app.py` nem abrir navegador local.
- O equivalente no app final será:
  - menu `Buscador Escola`;
  - botão `Atualizar`;
  - botão `Baixar Tudo`;
  - progresso dentro da tela;
  - dados salvos no banco/nuvem do próprio sistema.
- O código do `.bat` serve apenas para entender o fluxo antigo de uso, não para ser copiado para o app final.

Decisão do usuário registrada:

- Usuário disse que pode digitar usuário/senha dentro do próprio sistema uma vez.
- Depois que ele confirmar que colocou, remover/esconder o local de configuração de credenciais para não ficar aparecendo no uso normal.
- Implementação futura deve ser temporária:
  1. criar área de credenciais do Buscador;
  2. usuário preenche;
  3. sincroniza/salva;
  4. depois esconder/remover essa área quando o usuário avisar.

Estado:

- Aguardar os próximos arquivos/códigos.
- Só adaptar o Buscador Escola completo quando o usuário escrever `acabei`.

---

## 8BK. Buscador Escola — `instalar_dependencias.bat` original recebido — v4.9.66

Contexto:

- Usuário enviou o arquivo `instalar_dependencias.bat` original do projeto próprio do Buscador Escola.

Fluxo original do `.bat`:

```bat
@echo off
chcp 65001 > nul
cd /d "%~dp0"
python -m pip install --upgrade pip --quiet
python -m pip install flask --quiet
python -m pip install openpyxl --quiet
python -m pip install geopy --quiet
python -m pip install python-dotenv --quiet
python -m pip install requests --quiet
python -m pip install urllib3 --quiet
pause
```

Dependências originais e substituição no Sistema Digicopy:

- `flask`:
  - usado para servidor local antigo;
  - no Sistema Digicopy final não será usado, porque a tela fica dentro do Electron/app.
- `openpyxl`:
  - usado para gerar `.xlsx`;
  - no Sistema Digicopy pode ser substituído por exportação HTML/CSV compatível com Excel ou outra rotina JS.
- `geopy`:
  - usado para geolocalização/distância;
  - no Sistema Digicopy já existe cálculo JS por Haversine e lista de cidades. Se precisar mais precisão, adicionar tabela local de coordenadas.
- `python-dotenv`:
  - usado para `.env`;
  - não será usado. Credenciais devem ficar na configuração do sistema, não em arquivo `.env`.
- `requests` / `urllib3`:
  - usados para HTTP e retentativas;
  - no Sistema Digicopy/Electron será usado `fetch`/IPC com retry já implementado.

Conclusão para adaptação final:

- O app final não deve ter instalador Python para o Buscador Escola.
- Não usar `instalar_dependencias.bat`.
- O instalador único será o do Sistema Digicopy (`.exe` via Electron Builder).
- Quando o usuário escrever `acabei`, adaptar o Buscador mantendo o fluxo antigo, mas sem Python/Flask/SQLite/dependências externas.

Estado:

- Aguardar o usuário enviar os demais arquivos/códigos e escrever `acabei`.

---

## 8BL. Buscador Escola — confirmação de credenciais dentro do sistema e template completo — v4.9.66

Contexto:

- Usuário confirmou que aceita colocar usuário/senha dentro do próprio Sistema Digicopy.
- Depois que ele colocar e confirmar, a área para preencher credenciais deve ser escondida/removida do uso normal.
- Usuário reenviou o `templates/index.html` completo do projeto antigo para garantir que o layout/fluxo seja considerado.

Decisão funcional registrada:

- Criar área temporária no Buscador Escola para configurar credenciais:
  - usuário/CNPJ da API;
  - senha da API;
  - botão salvar;
  - campos mascarados.
- Essas credenciais não devem ficar em arquivo `.env`, `.bat`, código JS ou relatório.
- Devem ser salvas na configuração do sistema/banco, para evitar digitar toda hora.
- Depois que o usuário disser que colocou, esconder/remover a área de credenciais da tela final.

Layout/fluxo do template antigo que deve ser preservado em versão Sistema Digicopy:

- Header com resumo de:
  - última atualização;
  - total de orçamentos em banco.
- Busca com:
  - termo;
  - região;
  - intervalo.
- Botões/ações equivalentes:
  - Pesquisar;
  - Atualizar;
  - Baixar Tudo;
  - Excluídos;
  - Exportar Excel.
- Barra de progresso de sincronização.
- Resultados em cards com:
  - código;
  - abrir orçamento;
  - excluir;
  - município;
  - distância de Janaúba;
  - produtos encontrados/total;
  - produtos pesquisados com tipo/descrição.
- Destaques:
  - `Este orçamento contém APENAS o produto pesquisado`;
  - aviso para produtos adicionais/extras.
- Tela de excluídos com:
  - ativar/restaurar;
  - motivo da exclusão.

Aguardar:

- Usuário ainda está enviando arquivos/dados.
- Só implementar a adaptação completa do Buscador Escola quando o usuário escrever `acabei`.

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

1. Usuário testar a v4.9.52 com a base real na nuvem.
2. Usuário baixar e enviar o relatório de `Configurações > Alinhamento do banco antigo`.
3. Confirmar, pelo relatório real, se cada tabela antiga caiu no destino correto.
4. Ajustar mapeamento fino depois do relatório, sem apagar dados úteis.
5. Continuar prioridade funcional definida pelo usuário:
   - Leituras;
   - Contratos;
   - Vendas/notinhas;
   - Chamados/OS;
   - Clientes;
   - Estoque;
   - Financeiro;
   - Impressão/RTF.
6. Validar visualmente contratos com cliente, impressoras e leituras.
7. Confirmar modelos de contrato/proposta em `Modelos contrato`.
8. Evoluir recarga/cartuchos para tela operacional completa se o usuário aprovar o fluxo das etiquetas.

---

## 11. Observação sobre anexos `.txt`

O chat mostrou anexos `1.txt` até `12.txt`, mas eles não apareceram acessíveis no ambiente do agente.

Por isso, para segurança, considerar como recebido apenas o texto que foi colado diretamente na conversa.

Se o usuário conseguir reenviar anexos e eles aparecerem no ambiente, analisar os arquivos diretamente. Caso contrário, continuar por partes no chat.
