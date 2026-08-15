# Relatório da sessão DIGICOPY — continuar em outro chat

**Data:** 2026-08-14  
**Repo:** `kauangabrielcardososilva7890-afk/teste`  
**Branch fixa da sessão:** `arena/01a001ed-teste`  
**PR:** https://github.com/kauangabrielcardososilva7890-afk/teste/pull/15  
**Última versão:** **v5.19.13**  
**Commit:** atualizar após push  
**GitHack:** `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/HASH/index.html?v=5.19.13`

Não voltar para outras branches. Não reabrir etiquetas nem vendas (salvo pedido explícito).

---

## Como o usuário trabalha

- Português, direto. **Perguntar antes** se houver dúvida.
- Cada atualização: link GitHack `?v=...`, PR, commit, resumo objetivo + **atualizar este `.md`**.
- Remover = deletar de verdade. Avisos: `lfbAlert` / `confirmSistema`. `window.confirm` nativo quebrado.
- Chamados: o que pedir vale **nos dois** (contrato e submenu), salvo se disser que é só de um.

---

## Aceito

- Vendas/Notinhas v5.15.2; 1 impressora; 2.2 finalizar lista; 2.3 filtros; 3 impressoras; 4.3–4.6; 5 Todos; 6 busca impressora contrato; 7 sort; ESC sem loop.

---

## v5.19.13
- **Buscador Escola** — orçamento com vários itens pesquisados aparece em UM cartão só (itens listados juntos). Sem resultados, mostra "Nada encontrado para ...".

## v5.19.12
- **Buscador Escola** — tela não pisca mais durante a sincronização: o log acumula sem redesenhar; a contagem (orçamentos + itens) só é mostrada no final, quando o processo termina.

## v5.19.11
- **Buscador Escola — Atualizar agora é incremental**: o botão "Atualizar" (e o automático de 1h) só baixa os itens dos orçamentos **novos**; os já baixados são pulados (economiza muito tempo). "Baixar Tudo" continua limpando e baixando tudo. Progresso mais claro ("Página X", "Baixando itens do orçamento Y").

## v5.19.10
- **Buscador Escola** — credenciais (CNPJ + senha) mantidas no código (usuário vai deixar o repositório privado). Removido o botão "Login API" adicionado temporariamente.

## v5.19.9
- **Segurança (Buscador Escola)** — senha da Caixa Escolar removida do código-fonte. Adicionado botão "Login API" onde o CNPJ + senha são digitados uma vez e salvos no banco (local + nuvem), não no código.

## v5.19.8
- **Auditoria** — corrigido: antes escondia para TODO MUNDO (o ocultamento "grudava"). Agora alterna corretamente (mostra para Admin/Dono, esconde para os demais) e não age antes do login.
- **Senha CNPJ deletada de verdade** (não só ocultada) do app.js: título do modal "Novo usuário", campo de senha CNPJ, validação no saveUsuario e textos "Como funciona" da tela de usuários.

## v5.19.7
- **Auditoria** — agora só **Admin** e **Dono** veem a auditoria. Para os demais, o item some do menu lateral e do submenu Configurações, e a navegação é bloqueada.
- Arquivo novo: `ajustes_v5197_patch.js`.

## v5.19.6
- **Usuários e permissões** (hierarquia):
  - **0** — Removida toda a exigência de "senha CNPJ" na criação/edição de usuário.
  - **1/2** — Cada um edita só o próprio usuário. Editar os outros: só **Admin (Kauan)** e **Dono (Denivaldo)**.
  - **3** — Ao criar, perfil é sempre **Funcionário** (Admin/Dono ocultos). Troca de perfil só aparece para Admin/Dono editando outro usuário.
  - **4** — "Cadastrar para escolher em vendas/chamados" virou **"Novo técnico"** (só nome). Técnicos aparecem na listagem junto com usuários, com menos info e editar só o nome.
  - **5** — Quem não tem permissão não vê o botão de editar.
  - **6** — Campos abertos de "técnico" (chamados e vendas) viraram lista de seleção com os técnicos criados.
- Perfis agora: **Admin**, **Dono**, **Funcionário** (Comercial/Financeiro/Técnico passam a ser Funcionário).
- Arquivo novo: `ajustes_v5196_patch.js`.

## v5.19.5
- **Menu Cadastros** — Removido o item "Usuários" duplicado do submenu "Cadastros" (o acesso correto continua em Configurações → "Usuários e permissões").

## v5.19.4
- **Aba Clientes:** filtro **"Nome"** pré-selecionado por padrão (sem disparar a listagem — continua vazio até pesquisar ou clicar em "Todos").

## v5.19.3
- **Aba Clientes:**
  - **1** — "Tudo" saiu da caixa (select) e virou botão **"Todos"** separado (igual leituras/chamados), que lista todos os clientes.
  - **2** — Padrão continua sem listar nada; só aparece cliente ao pesquisar ou clicar em "Todos".
  - **3** — Ordenação padrão por **código crescente** (do primeiro ao último).
  - **4** — Ao alterar um cliente, se modificar qualquer informação e sair (Cancelar/X/fora/ESC), aparece "Deseja salvar as alterações antes de sair?" — só se realmente mudou algo.
- Arquivo novo: `ajustes_v5193_patch.js` + edição em `finalizacao_sistema_patch.js`.

## v5.19.2
- **Corrigido de vez o "Informe o motivo do chamado"** ao salvar/sair: a causa era que o formulário do chamado usa campos de um nome (`ko-*`/`ca-*`) e o salvar lia outro (`kr-os-*`), então achava o motivo vazio mesmo com texto. Agora, antes de salvar, o que está digitado é copiado para os campos que o salvar lê (motivo, modelo, patrimônio, serial, local, contadores, serviços, observação, técnico, impressora e "finalizado?").
- Arquivo novo: `ajustes_v5192_patch.js`.

## v5.19.1
- **Otimização / correção de interferência:**
  - Corrigido o bug da sincronização manual: "Enviar para nuvem" e "Carregar da nuvem" cancelavam sem fazer nada porque `window.confirm` foi desativado pelo sistema de popups (retorna false). Agora usam `confirmSistema` (assíncrono).
  - Logo padrão (logo.png) reaplicada por segurança após o carregamento (evita qualquer sobrescrita por logo customizada antiga).
  - Guard de performance nos observadores: não fazem trabalho quando não há modal de chamado aberto.
- Arquivo novo: `ajustes_v5191_patch.js`.

## v5.19.0
- **4 (Ctrl+P)** — No programa (.exe), o Ctrl+P agora é interceptado no `main.js` (evento `web-contents-created`) e imprime LIMPO (sem URL nem contador de páginas). No navegador (GitHack), o Ctrl+P é a janela do próprio navegador — aparece um aviso lembrando de desmarcar "Cabeçalhos e rodapés".
- Arquivo novo: `ajustes_v5190_patch.js` + edições em `main.js` e `preload.js`.

## v5.18.9
- **1** — Corrigido o erro "Informe o motivo do chamado" ao imprimir (a validação lia o campo errado; agora detecta o formulário certo — contrato `kr-os-*`/`ko-*` e avulso `ca-*`).
- **2** — Imprimir agora valida os campos obrigatórios (motivo; e cliente no chamado fora de contrato) e bloqueia se faltar.
- **3** — Logo volta a ser a padrão (logo.png; removido upload de logo da v5.18.8). Cabeçalho do PDF agora mostra os dados completos da loja (nome fantasia, razão social, CNPJ, telefone, e-mail, endereço) vindos de "Dados da loja para relatórios e notinhas".
- **4** — Impressão sem "about:blank" (título/URL limpos via history.replaceState). No .exe (Electron), impressão limpa (sem contador de páginas/URL) via printAPI (`print:clean` em main.js/preload.js). No navegador, o contador de páginas é opção do diálogo de impressão ("Cabeçalhos e rodapés").
- Arquivo novo: `ajustes_v5189_patch.js` + edições em `main.js` e `preload.js`.

## v5.18.8
- **Dados da loja + logo** — Adicionado upload de LOGO no card "Dados da loja para relatórios e notinhas" (salvo em `db.config.loja.logo`, base64).
- A logo configurada passa a ser usada nos **chamados (dentro e fora de contrato)**, **leituras** e **notinhas de vendas** (via `window.DIGICOPY_LOGO`, reaplicado com a logo da loja).
- Leitura (notinha compacta): cabeçalho agora lê nome fantasia, razão social, CNPJ, telefone, e-mail e endereço do card "Dados da loja".
- Arquivo novo: `ajustes_v5188_patch.js` + edição em `leitura_impressao_compacta_produtos_patch.js`.

## v5.18.7
- **3** — Ao imprimir o PDF do chamado, os dados digitados nas caixas (motivo, serviços, observação, contador, modelo/patrimônio/serial/local) são puxados automaticamente, mesmo sem salvar. Não altera o que está salvo.
- **5.1** — "Bem-vindo, Fulano!" agora é um aviso no CANTO da tela (some sozinho), sem popup.
- Arquivo novo: `ajustes_v5187_patch.js`.

## v5.18.6
- **1.2 / 4.1** — Refatorado para um **MutationObserver** que garante, em qualquer timing/formulário, que o chamado DENTRO do contrato tenha: (a) área de peças "igual vendas" (busca/lupa, qtd, valor, desconto, valor final, Adicionar item) e (b) faixas azuis de seção. Idempotente.
- **3** — PDF: caixa **Impressora** com Modelo, Patrimônio, Serial e Local (busca do equipamento quando o chamado não tiver os campos).
- **5** — Aviso de tela cheia "Carregando dados da nuvem..." antes da recarga automática; em erro, aviso "Não foi possível carregar a nuvem" com botões "Tentar novamente" / "Continuar mesmo assim".
- **5.1** — Aviso "Bem-vindo, Fulano!" com botão único (OK) após o login (o toast antigo era engolido pelo filtro anti-spam do v5.17.1).
- Arquivo novo: `ajustes_v5186_patch.js`.

## v5.18.5
- **4/1.2** — Correção definitiva da duplicação de peças: o patch v5.17.1 já removia o `#lc-pecas-wrap` (as 5 linhas), deixando o **rótulo** "Produtos / peças utilizadas" + textarea escondido pra trás. Agora removemos o bloco INTEIRO (via `#lc-pecas`), em qualquer timing (MutationObserver) e nos dois formulários (avulso + contrato).
- **3** — PDF do chamado: devolvida a caixa **Impressora** (modelo • patrimônio • serial • local), mantendo Cliente + Atendimento lado a lado.
- Arquivo novo: `ajustes_v5185_patch.js`.

## v5.18.4
- **3** — PDF do chamado: caixas "Dados do Cliente" (nome, doc., telefone, endereço) e "Dados de Atendimento" (técnico, motivo/defeito, cadastro, atendimento) **lado a lado**. "Data do atendimento" subiu para a caixa de atendimento; contadores continuam no rodapé em branco até finalizar.
- Arquivo novo: `ajustes_v5184_patch.js`.

## v5.18.3
- **4** — Removida a seção duplicada "Produtos / peças utilizadas" (a antiga de 5 linhas) que aparecia no chamado **fora de contrato** junto da nova "Produtos / Peças usadas" (igual vendas).
- **4.1** — Faixas azuis de seção (Motivo/Defeito, Contadores, Serviços, Observação, Peças) agora também no chamado **dentro do contrato**, igual ao de fora.
- **1.2** — Reforço para a área de peças do chamado de contrato ficar igual à do de fora (busca/lupa, qtd, valor, desconto, valor final, Adicionar item).
- **2.3** — Ao fechar o "Novo lançamento de contador" (leitura) com contador digitado, pergunta "Deseja lançar essa impressora na leitura?" (Sim = salva o lançamento; Não = volta sem lançar).
- Arquivo novo: `ajustes_v5183_patch.js`.

## v5.18.2
- PDF peças: só **Descrição, Quantidade, Valor**.
- Cadastro do item no chamado = vendas: busca (lupa/Enter), qtd, valor, desconto, valor final, Adicionar item.
- 1.2.1 e 1.2.2 **não** nesta versão.

## v5.18.1
- Peças no chamado: qtd, valor, desconto, valor final (igual vendas). Contrato e avulso.
- PDF: colunas Valor / Desc. / Valor final + total (só preenchido se finalizado).
- Finalizar chamado com peças: cria venda **faturada** e abre a tela normal de venda (estorno etc.), ligada ao chamado.
- Excluir venda de chamado: aviso e apaga o chamado junto (depois de estornar, se faturada).

## v5.18.0
- Contador no PDF **só tem número se o chamado estiver finalizado** (checkbox ou status). Aberto = linha em branco.
- Assinaturas + dados da loja **no fim da folha A4** (`height:277mm` + `margin-top:auto`), uma página.

## v5.17.9
- Avulso: ao escolher cliente some a lista; botão **Limpar** para trocar.
- PDF contrato: color se modalidade Color A4/A3 ativa (parque certo).
- Contadores do PDF sem número se o chamado não estiver finalizado.
- Rodapé da loja **dentro** da 1ª folha (não empurra 2ª página). Sem `min-height` estourando.

## v5.17.8
- Tirar peça: captura mousedown/click (não fecha chamado; aviso “Deseja remover esse item?”).
- PDF: assinaturas no **rodapé da folha A4** (`min-height:273mm` + `margin-top:auto`).

## v5.17.7

### 2.1
- Contador antigo do **último chamado** só no **chamado de contrato**.
- Avulso não usa essa regra.

### 4.1 (ambos)
- Busca de peça **só lupa ou Enter** (oninput antigo ignorado).
- Lupa no HTML + observer se o form recriar o input.
- **Tirar** item: aviso `Deseja remover esse item?`

### 4.2 PDF
- Contadores **em branco** (só linha) se o chamado **não** estiver finalizado.
- Finalizado: preenche preto/color.
- Assinaturas mais afastadas do rodapé (`margin-top: 88px`).

Arquivo novo: `ajustes_v5177_patch.js`.

---

## Pendente de teste

- Lupa visível e busca sem letra a letra nos dois forms.
- Remover peça com popup.
- PDF em aberto vs finalizado + espaço das assinaturas.
