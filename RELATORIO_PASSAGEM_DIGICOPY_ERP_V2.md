# RELATÓRIO COMPLETO DE PASSAGEM — DIGICOPY ERP (Versão 2 — v4.9.12)

> **Para o agente do NOVO CHAT:** leia este documento INTEIRO antes de mexer em qualquer coisa.
> Ele contém o contexto do projeto, tudo o que já foi feito até a **v4.9.12** (com **240+ testes automatizados passando**), o que o usuário (Kauan) quer fazer a seguir (na ordem) e as regras de comportamento obrigatórias.
> O Kauan vai colar este relatório no novo chat e dar continuidade **exatamente de onde parou**.
>
> **Para o Kauan:** depois que o novo chat ler e confirmar que entendeu tudo, este arquivo pode ser apagado do repositório (peça ao novo chat para removê-lo, se quiser).

---

## 1. O projeto e a empresa
- **Empresa:** DIGICOPY (Bocaiúva/MG, Brasil) — locação de impressoras, recarga de cartuchos, assistência técnica e vendas.
- **Produto:** **DIGICOPY ERP** — novo sistema da empresa, substituindo o sistema antigo (base Firebird num arquivo `.FDB`). Está em construção, em uso paralelo.
- **Forma de uso hoje:** roda no navegador (SPA estático, sem build). Testes pelo link raw.githack.
  **No futuro vira `.exe` (Electron)** — os arquivos `main.js`, `preload.js` e `package.json` já estão preparados para isso.
- **Computadores de destino:** **FRACOS (máquinas da loja)**. Toda decisão de código deve priorizar leveza e performance (evitar recálculos pesados, não re-renderizar telas ocultas).

## 2. Acessos e credenciais
- **Login no sistema (2 etapas):**
  1. CNPJ da empresa: `08.385.589/0001-03` + senha do CNPJ: `digicopy8698`
  2. Usuário e senha (ex.: `carlos`/`123`, `admin`/`admin` — sendo que `admin` foi unificado com `Kauan Gabriel`).
- **Repositório:** `kauangabrielcardososilva7890-afk/teste` (GitHub). O chat novo terá um **branch próprio de sessão** criado a partir da `main` — trabalhar SÓ nele, nunca na `main` direto, comentando as versões no PR da sessão.
- **Firebase (nuvem):** projeto `digicopy-sistema-nuvem`, região southamerica-east1, plano Standard.
- **Link de teste (navegador):**
  ⚠️ **O githack usa CDN com cache agressivo.** Para furar o cache em 100%, use sempre o link contendo o **hash exato do commit mais recente** na URL no lugar do nome do branch (ou use parâmetros novos como `?v=X.Y.Z&z=999`) e **confira o número da versão no canto superior esquerdo da barra azul**.

## 3. Arquitetura técnica e Regras de Ouro (ESSENCIAIS — NUNCA VIOLAR)
1. **Responder sempre em português (PT-BR), simples e direto** — o usuário NÃO é técnico.
2. **Nunca** escrever "inspirado no SisPrinter", "não é cópia", "layout inspirado" — em código, comentários, markdown ou interface.
3. **SPA sem build em ordem empilhada:** `index.html` carrega os scripts na ordem:
   `lz.js`, `logo_data.js`, `app.js`, `vendas_patch.js`, `evolucao_patch.js`, `notinha_patch.js`, `locacao_patch.js`, `sync_client.js`, `vendas_os_patch.js`, `performance_patch.js`, `pix_patch.js`, `notificacoes_patch.js`, `vendas_extra_patch.js`, `migrados_print_patch.js`, `clientes_patch.js`, `interface_patch.js`, `firebase_config.js`, `firebase_client.js`, `vendas_otimizacao_patch.js`, `login_otimizacao_patch.js`, `render_gate_patch.js`, `locacao_contratos_patch.js`.
4. **REGRA DO USUÁRIO (obrigatória):** toda funcionalidade nova vai em **arquivo patch NOVO e separado** no fim da ordem de carga (nunca engordar arquivo existente).
5. **Sem busca "enquanto digita" (PROIBIDO oninput):** pesquisa só no Enter ou na lupa (o usuário odeia lista mudando ao digitar e isso inutiliza o botão da lupa).
6. **Sem barra de alfabeto A..Z:** não incluir barra de busca por inicial A..Z em nenhuma tela ou tabela.
7. **Ordenação Crescente por padrão (`asc`):** ao clicar em qualquer título de coluna (Código, Descrição, Impressora, Modelo), ordenar por padrão **do menor para o maior**.
8. **Formatação de Nomes (Sem CAPSLOCK):** nomes de pessoas (clientes, técnicos, usuários, vendedores) devem ser formatados em *Title Case* (apenas a primeira letra maiúscula, ex.: `Maria da Silva`, `Recepção`, `Kauan Gabriel`).
9. **Códigos numéricos sequenciais monotônicos:** códigos de cliente/venda/OS nunca são reutilizados e vendas/OS são SÓ NÚMERO (sem prefixo `VD-`/ano).
10. **Regra de Impressão da Notinha:** OS só sai em folha inteira A4 se tiver Modelo + Nº Série + (Patrimônio OU Contador); senão, meia folha A4. (Vendas migradas com dados de OS são impressas como folha inteira).
11. **Faturamento sem boleto:** formas fixas Dinheiro, Prazo, Cartão crédito/débito, Cheque, Conta, Pix, Grátis.
12. **Testes automatizados (SEMPRE RODAR ANTES DE COMMITAR):** `npm run check` (sintaxe) e `npm test` (executa todos os `test_*.js`). **Todos os 240+ testes devem passar.**

---

## 4. O que JÁ FOI FEITO até a v4.9.12 (Tudo testado e mergeado)

### A. Limpeza, Importação DBeaver (.JSON) e Nuvem Google
- **Remoção dos botões da nuvem:** ocultados os botões *"Enviar dados p/ nuvem"* e *"Baixar dados da nuvem"* do menu Configurações, mantendo a sincronização automática silenciosa em segundo plano sem travar o uso.
- **Expurgo de itens soltos na grade de Notinhas:** proibido que tabelas de itens (`ITENS_VENDA`, `VENDA_ITENS`, etc.) sejam tratadas como Notinhas avulsas. Antes de reimportar do DBeaver, o sistema limpa vendas migradas corrompidas, garantindo 100% de Notinhas reais com números corretos.
- **Associação de Itens Migrados:** os itens das tabelas filhas são associados automaticamente **dentro** do histórico de cada Notinha principal.
- **Aba "Importar arquivos" (`view-banco`) reformulada:** quadro de Upload dos arquivos `.json` posicionado no topo da tela, textos longos de tutorial removidos, resumo do Dashboard embutido e botão *"Ver Dashboard (Início)"* adicionado.
- **Pastas do DBeaver (Tabelas vs Visões/Índices):** o sistema lê arquivos `.json` exportados de qualquer pasta. As **Tables (Tabelas)** contêm 100% dos dados comerciais da empresa; pastas como *Índices* ou *Procedures* não contêm dados comerciais e não precisam ser importadas.

### B. Interface, Otimização de Performance e Gate de CPU
- **Gate de Renderização (`render_gate_patch.js`):** impede a execução de funções de renderização (`renderFinanceiro`, `renderProdutos`, `renderClientes`, etc.) quando a respectiva tela `<section>` está oculta (`.hidden`). Reduz o uso de CPU em computadores fracos da loja em até 90% ao salvar vendas.
- **Fechamento de Modal Anti-Lag:** fechamento de modais (`closeModal`) otimizado sem travar a interface.
- **Fim do espaço branco ao rolar a página:** estrutura flexbox contínua em `#app-shell` e `.desktop-home` sem alturas fixas em pixels (`100vh - 124px`), eliminando rolagem para o vazio.
- **Tela Início (`view-dashboard`) com Dashboard Completo:** painel com cards de KPI (Contratos, Parque, OS abertas, Disponíveis e Faturamento Mês), chamados recentes, leituras pendentes e logs de auditoria.

### C. Módulo Atendimento / Notinhas / Vendas (`vendas_otimizacao_patch.js`)
- **Limpeza do Filtro de Vendedores:** select de filtro de atendente ignora vendedores inativos/duplicados (`admin`, `N`, `S`, `Vendas - ordens`, `Kaio Geovane`), mantendo a lista limpa. (Nas notinhas antigas, o nome do técnico que realizou a venda permanece preservado).
- **Unificação Kauan/Admin:** usuário `admin` foi unificado a `Kauan Gabriel`. Registros atribuídos a `Vendas - ordens`, `N`, `S` ou `Importado` são exibidos como **Recepção**.
- **Botões no Histórico da Notinha:**
  1. **`Estornar / Cancelar Notinha`**: pede confirmação, altera status para cancelada/estornada, **devolve os itens para o estoque do produto** e marca títulos financeiros como estornados.
  2. **`Editar Notinha`**: abre modal para editar cliente, forma de pagamento, status ou observações de qualquer Notinha (nova ou do banco antigo).

### D. Módulo Login e Funcionários (`login_otimizacao_patch.js`)
- **Busca Case-Insensitive e Flexível:** no login, aceita qualquer formatação (`FULANO`, `Fulano`, `fulano`, `fUlAnO`), combinando pelo login, nome completo ou primeiro nome.
- **Funcionários como Usuários:** técnicos/funcionários migrados são cadastrados automaticamente como usuários de login (com senha predefinida `123` ou `123456`).

### E. Módulo Produtos (`# produtos: #`)
- **Estoque Mínimo Estrito (`<`):** notificação de estoque baixo ocorre **apenas quando estoque < estoqueMin**. Quantidade igual ao mínimo não emite aviso.
- **Categoria / Tipo Unificados:** no modal de produto, "Tipo de Cadastro" e "Categoria" foram unificados em um único campo.
- **Abas e Campos Limpos:** removidas abas F7 (Fornecedores), F8 (Imagem) e abas inferiores de Valores/Promoção/Varejo. Controle de estoque fixo sempre ativo.
- **Valor Venda Auxiliar:** salva o valor de venda no produto como sugestão ao lançar em uma venda nova.

### F. Módulo Contratos, Locação, Leituras e Chamados (`locacao_contratos_patch.js`)
- **Fim dos alertas de expiração:** removidos avisos automáticos de contratos expirando.
- **Tela de Contrato de Locação (Layout 2.1):** clique duplo na lista abre painel com KPIs (Impressoras Alocadas, Chamados Abertos, Valor Mensal, Estoque Toner), botões **🟢 Leituras** e **🔵 Chamados** (sem botões de Despesas/Pedidos e sem menu Observações).
- **Cadastro de Impressora no Contrato (4.1):**
  - **Reconhecimento Automático:** digitar Serial ou Patrimônio de impressora existente preenche modelo, departamento e local automaticamente.
  - **Modalidades:** suporte completo a *Global*, *Individual*, *Por Impressão*, *Mês Fixo* e *Inativo (Ocultar)*.
  - **Contador `0` Válido:** valor `0` aceito perfeitamente em "Contador Anterior".
- **Leituras Coletivas (12.1 / 14.1 / 15.1):**
  - Lançamento sem filtro obrigatório de meses antigos.
  - Cálculo automático de **Utilizado** (`Atual - Anterior`), **Qtde Excedente** e **Valor Excedente** conforme a modalidade.
  - **Relatório em PDF (Modelo 2.1):** geração de relatório A4 para conferência e impressão.
- **Chamados Técnicos Corretivos (16.1 / 17.1 / 18.1 / 19.1):**
  - Badge em vermelho indicando chamados **VENCIDOS** (abertos antes de hoje e não finalizados).
  - **Preenchimento Automático de Equipamento (19.1):** selecionar impressora preenche Serial, Patrimônio, Local/Departamento e busca automaticamente o **Contador Preto Antigo** (da última leitura/chamado).
  - **Cálculo de Quantidade Impressos:** digitar *Contador Atual* calcula instantaneamente `Atual - Antigo`.
  - **Chave de Baixa:** checkbox *"Este Chamado já foi Finalizado?"* para conclusão imediata.
  - **Impressão A4 (PDF 1.1):** botão **`🖨 Imprimir OS (PDF 1.1)`** com dados do cliente, motivo, contadores, serviços executados e assinaturas.

---

## 5. PRÓXIMOS PASSOS — INSTRUÇÕES EXATAS PARA O NOVO CHAT

O usuário (Kauan) vai dar continuidade ao projeto no novo chat. Siga exatamente esta ordem e prioridade:

### Passo 1 — Acompanhar Testes de Locação / Contratos / Leituras / Chamados (v4.9.12)
1. As funcionalidades completas descritas acima (telas 1.1 a 19.1 do SisPrinter, incluindo impressão dos PDFs Modelo 1.1, 2.1 e 3.1) foram publicadas na **v4.9.12**.
2. Peça ao Kauan para confirmar se os fluxos de Contrato, Lançamento de Leitura e Chamado Técnico Corretivo com cálculo de contadores estão 100% como ele espera nas rotinas da loja.
3. Se ele pedir qualquer ajuste de layout, campo ou cálculo em algum desses módulos, implemente em patch file mantendo os testes verdes.

### Passo 2 — Continuação da Migração Gradual dos Menus Roxos ("Explorar Migrados")
1. Conforme combinado no Passo 3 do plano original, o Kauan poderá enviar novos prints de telas do sistema antigo (SisPrinter) para implementarmos no ERP novo.
2. Cada menu configurado no ERP novo deve ir substituindo e removendo as abas roxas correspondentes do menu **Cadastros → Explorar Migrados**.
3. No final do processo, o menu "Explorar Migrados" desaparecerá totalmente.

### Passo 3 — Otimizações Adicionais de Performance para PCs Fracos (se solicitado)
1. Caso seja necessário otimizar ainda mais o tempo de abertura ou processamento de listas muito grandes (ex.: mais de 16 mil vendas), aplicar paginação sob demanda ou varredura de sujos em segundo plano, sempre sem alterar o comportamento visual ou quebrar testes.

### Passo 4 — Futuro (Quando o usuário pedir)
- **Pix dinâmico com Banco Inter:** integração via API PJ (OAuth2 + mTLS) com baixa automática de cobrança.
- **Módulo NF-e / NFC-e:** emissão fiscal na aba Nota Fiscal do produto/cliente.
- **Empacotamento Electron (`.exe`):** gerar o instalador para Windows rodando local.

---

## 6. Lembrete Final de Proteção Anti-Quebra
- Sempre execute `npm run check && npm test` antes de cada commit.
- Garanta o bump de versão nos 3 lugares (`package.json`, `app.js`, `index.html`) e comente a versão no PR do branch de trabalho.
- Nunca remova a regra do `render_gate_patch.js` (ela protege os computadores fracos da loja contra travamento de CPU).

**Fim do relatório.** Novo chat: confirme ao Kauan que leu e entendeu todo este documento e pergunte como foram os testes da **v4.9.12**! 🚀
