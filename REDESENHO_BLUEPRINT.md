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

## 4) O que ainda vou confirmar com você (na fase 1 — não vou inventar)

- As **12 "automações"** (`automacoes_*.js`, as grades do sistema antigo: compras,
  recebimentos, contadores, caixa, chat auxiliares…): **quais dessas você usa de verdade?**
  Se não usar nenhuma, elas **não entram** — o sistema novo já nasce menor.
- **Navegador embutido**, **PIX**, **chat auxiliar**: entram ou ficam de fora?
- **Módulos dinâmicos**: quais listas você criou por lá que precisam existir no novo?

---

## 5) Regras que o sistema novo já nasce cumprindo

Sai direto das `REGRAS_PERMANENTES.md`: local-first e incremental; nada de apagar dado
automaticamente; nada de senha/token/CSC em código, relatório ou HTML; fiscal em
homologação primeiro; mobile/APK pausado; versão coerente em `package.json`, bundle,
HTMLs e `mobile/www`; e **cada tela só entra com teste** que a prova funcionando.
