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
- Versão atual implementada: **v4.9.21**
- Último commit publicado no PR: `f6cf4b9`
- Link de teste atual: usar o link raw.githack com o hash do commit `f6cf4b9` e parâmetro `v=4.9.21`.

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
| Parte 2 | Pendente | Aguardando envio |
| Parte 3 | Pendente | Aguardando envio |
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
