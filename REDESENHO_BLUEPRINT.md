# REDESENHO DO DIGICOPY — MAPA DO SISTEMA (o que o novo precisa ter)

**v0.1 · 24/09/2026.** Este é o mapa que eu vou seguir para reconstruir. **Nada aqui é
invenção:** cada lista, tela e fluxo abaixo existe hoje no código e tem dono em algum
arquivo. O que ainda não estiver detalhado eu detalho na fase 1, **lendo o módulo e
escrevendo o teste dele antes de reescrever**.

---

## 1) As listas que o sistema guarda (o "o quê")

Fonte: `app.js` (linhas 11-18, o modelo base) + a lista de entidades que a sincronização
já conhece (`cloudflare_data_sync_patch.js:324`).

| # | Lista | O que é | Onde vive hoje |
|---|---|---|---|
| 1 | `empresas` | os CNPJs/lojas (identidade, dados fiscais) | `app.js` |
| 2 | `usuarios` | quem entra, com cargo (Admin, Dono, Gerente, Funcionário) e permissões | `app.js` + `permissoes_*` |
| 3 | `clientes` | cadastro de clientes (com abas) | `app.js` + `ajustes_v5243_cliente_abas_patch.js` |
| 4 | `produtos` | catálogo (produto e serviço, preço) | `app.js` |
| 5 | `recargas` | recarga de cartucho/tinteiro | `app.js` |
| 6 | `equipamentos` | equipamentos/impressoras cadastrados | `app.js` |
| 7 | `contratos` | contratos de locação (com as impressoras dentro) | `locacao_contratos_patch.js` |
| 8 | `parque` | parque instalado (cliente ↔ impressora ↔ contrato) | `ajustes_v52232_parque_monitor_hub_patch.js` |
| 9 | `leituras` | leituras de contador (base do faturamento) | `ajustes_v5250_leitura_overhaul_patch.js` |
| 10 | `os` | ordens de serviço | `vendas_os_patch.js` |
| 11 | `vendas` | vendas (status, origem do orçamento, notinha) | `vendas_patch.js` + `notinha_patch.js` |
| 12 | `orcamentos` | orçamentos (com o **link público** de aprovação) | `ajustes_v52237_orcamentos_menu_patch.js` |
| 13 | `contasReceber` / `contasPagar` | financeiro | `app.js` |
| 14 | `tecnicos` | técnicos (chamados/visitas) | `app.js` + `locacao_chamados_fix_patch.js` |
| 15 | `notificacoes` | o sino de avisos | `notificacoes_patch.js` |
| 16 | `modulosDinamicos` | listas criadas dentro do sistema (fora do padrão) | `app.js` |
| 17 | `logs` / auditoria | histórico de ações | `app.js` |
| 18 | **fiscal** | notas NF-e/NFC-e emitidas, eventos e o certificado A1 | 13 arquivos `fiscal_*` / `nf_*` |

---

## 2) As telas de hoje (para o novo ter as mesmas)

**16 telas + 10 modais** (nomes reais das funções no `app.js`): Dashboard · Clientes ·
Produtos · Vendas · Orçamentos · OS · Contratos · Parque · Leituras · Equipamentos ·
Financeiro · Recargas · Usuários · Auditoria · Banco/Backup · Configurações · Módulos
dinâmicos — e os modais de Cliente, Produto, Venda/Entrada, OS, Contrato, Equipamento,
Leitura, Usuário, Conta a Pagar e Conta a Receber.

**Telas que os patches somam** (entram na fase 1, cada uma com nome e dono no código):
Orçamentos (menu + link público), Fiscal (NF-e/NFC-e), Chamados, Parque/Monitor,
Leituras (revisão), Locação/Contratos, Notinhas, Navegador embutido, Buscador Escola,
Painel do Gerente, Automações (grades do sistema antigo — **a confirmar com você quais
usa**).

---

## 3) Os fluxos que NÃO podem mudar de comportamento

1. **Login em 2 etapas** (CNPJ → usuário) e sessão por empresa.
2. **Orçamento com link público**: cliente abre, autoriza/recusa, nasce a venda e o aviso;
   WhatsApp da loja abre sempre.
3. **Contratos com impressoras dentro + leituras** → base do faturamento.
4. **Fiscal**: NF-e/NFC-e começam em **homologação** (`NOTA DE TESTE, SEM VALOR FISCAL`);
   produção só com a palavra `PRODUCAO`, permissão e ação manual.
5. **Nuvem**: sincronização incremental, backup diário às 18:30 (sem PC ligado), painel.
6. **Backup manual** (`📸 Backup manual`): guarda na nuvem **e** baixa o arquivo no PC;
   `📥 Baixar todos os backups` gera um `.zip`. **O backup leva a base inteira** (registros
   paginados + aparelhos, **sem** token nenhum) — é o arquivo de emergência dele.
7. **Permissões por cargo dentro do executor real** (não só escondendo botão) + auditoria.
8. **Nunca** `prompt`/`confirm`/`alert` nativos — sempre o modal do sistema.
9. **Buscador Escola**: não pode ser deletado; só trabalha com a aba dele aberta.
10. **Modo SÓ NUVEM** (o PC não é depósito): a cópia local só é solta quando a nuvem
    confirma que já tem tudo.

---

## 4) INVENTÁRIO DE PARIDADE — **TUDO entra** (decisão dele, 24/09/2026)

*"Cada funçãozinha que tinha o sistema é útil, eu vou querer"*. Então este item deixou de ser
pergunta e virou **lista de conferência**: cada linha abaixo tem de existir no sistema novo,
igual funciona hoje. Se faltar, é defeito — e eu quero que você me cobre.

Legenda: **✔** = já inventariado com dono no código · **◻** = inventariado, detalhe do
comportamento a levantar no dia da reescrita daquela tela.

| Bloco | O que é | Origem (arquivos) |
|---|---|---|
| 13 automações herdadas | caixa/chat auxiliares · compras, recebimentos e contadores · contratos/caixa/fiscal · locação e visitas · financeiro e estoque · fiscal/cartuchos · orçamentos e clientes auxiliares · PIX/contadores · procedures operacionais · **triggers** · vendas/compras/cadastros · finais de locação | `automacoes_*.js` (13) ✔ |
| Fiscal | NF-e/NFC-e, catálogo (NCM/CEST/CFOP), tributação, certificado A1, transmissão, guarda, eventos | `fiscal_*.js` (13) + `nf_*` ✔ |
| Orçamentos | menu, link público de aprovação, trava e atalho, revalidação com OS | `ajustes_v52237/52238/52240/52254/52258/52260_*` ✔ |
| Contratos e locação | contratos, filtros, RTF (modelo), visitas, vínculo com leituras, chamados | `contratos_*.js`, `locacao_*.js` ✔ |
| Parque / impressora | monitor do parque, hub, SNMP, etiquetas de recarga | `ajustes_v52232_*`, `snmp*`, `etiqueta_*` ✔ |
| Leituras | revisão completa (overhaul) e contadores | `ajustes_v5250_leitura_overhaul_patch.js` ✔ |
| Vendas | venda, notinha, estorno, permissões de estorno, chamados de reparo | `vendas_*.js`, `notinha_patch.js` ✔ |
| Estoque | alerta de estoque, voltar do zero, cartuchos | `estoque_*`, `cartuchos_*` ✔ |
| Financeiro | contas a pagar/receber, datas, PIX, caixa | `financeiro_*`, `pix_*` ✔ |
| Cadastros | clientes (abas), produtos, serviços, códigos, nomes | `clientes_*`, `cadastros_*`, `codigo_*` ✔ |
| Nuvem | painel, backups, certificado na nuvem, celular, autocura de empresa, CNPJ/gerente | `ajustes_v52296_*`, `cloudflare_*`, `cert_nuvem_*`, `cnpj_*`, `autocura_*` ✔ |
| Buscador Escola | buscador (menu próprio) + tela de login | `buscador_escola_patch.js`, `escola_*.html` ✔ |
| Navegador embutido | aba de navegação dentro do sistema | `navegador_embutido_patch.js` ✔ |
| Utilitários | popup do sistema, avisos/erro/auditoria, permissões, configurações, rodapé/versão, tema escuro, login 2 etapas, atalhos de menu | `popup_sistema_patch.js`, `avisos_*`, `permissoes_*`, `ajustes_v52213_*` ✔ |
| **Seleção inteligente** (o filtro auxiliar) | o campo **"onde buscar"** ao lado da caixa de digitar, com lupa e Enter, em **9 lugares** (venda, nova venda, financeiro, contratos, contas a receber, orçamento, clientes…) + a **caixa de sugestão** dentro da venda + **categoria** no produto + **etiqueta** na recarga | `ajustes_v52219_*`, `ajustes_v52236_*`, `clientes_patch.js` (`CLI_PURE`), `notinha_patch.js` ✔ — **núcleo novo: `novo/selecao.js`, paridade provada caso a caso (`test_selecao.js`)** |
| Módulos dinâmicos | listas criadas dentro do sistema | `app.js` (`modulosDinamicos`) ◻ |
| Empacotamento | `.exe` (Electron), atualização do programa, cache, resiliência, bundle | `main.js`, `exe_*`, `build_*` ✔ |

**Chat auxiliar**: hoje vive dentro das automações de caixa — entra pela mesma linha das 13. ◻

---

## 4.1) COMO O SISTEMA NOVO ENTRA (a ponte) — decidido em 24/09/2026

Pedido dele: *"o mesmo Index, as mesmas funções, tudo, mas aí você muda o que precisa mudar
completamente"*. A peça que faz isso é a **ponte** (`novo/ponte.js`):

1. as telas de hoje **não mudam**: continuam mexendo nas listas (`db.clientes.push(...)`,
   `db.clientes = db.clientes.filter(...)`) e chamando `saveDB()`;
2. a ponte escuta `saveDB()`, conta ao coração o que entrou/editou e **transforma retirada
   em lápide** (quem/quando/por quê) — nunca mais "sumiço";
3. exclusão em massa (mais de 20 ou mais da metade da lista) **não** vira lápide automática:
   pede confirmação (regra 27);
4. a ponte começa em **modo observação** (relata sem gravar) e só depois vai a modo ligado;
5. conforme cada tela é migrada para o padrão novo, a ponte encolhe — até sobrar só o coração.

**Correção de rumo (medida em 24/09/2026, rodada 18-B):** o item 2 **muda**. Medido numa base de
**76.550 registros**, a ponte acompanhando **cada** gravação custa **137 ms** por gravação (239 ms antes
da assinatura FNV-1a; 1ª varredura ~270 ms). Isso é a lentidão que o dono reclamou — então a ponte **não
entra no `saveDB()` de produção**. Dentro do sistema de hoje ela entra como **conferência sob demanda**
(painel da Nuvem, botão "Conferir o núcleo novo"): custo zero no uso normal, 131-243 ms quando ele pede,
e **sem gravar nada**. O item 3 (massa pede confirmação) e o item 4 (modo observação) continuam valendo.
O modo ligado no `saveDB()` só volta à mesa quando existir **cadência de gravação em lote** (hoje cada
tela grava a base inteira) — é a mesma raiz da lentidão. Prova: `test_ponte_no_sistema.js` (39 ✔);
detalhes em `AUDITORIA_TECNICA.md` §28.

## 5) Regras que o sistema novo já nasce cumprindo

Sai direto das `REGRAS_PERMANENTES.md`: local-first e incremental; nada de apagar dado
automaticamente; nada de senha/token/CSC em código, relatório ou HTML; fiscal em
homologação primeiro; mobile/APK pausado; versão coerente em `package.json`, bundle,
HTMLs e `mobile/www`; e **cada tela só entra com teste** que a prova funcionando.
