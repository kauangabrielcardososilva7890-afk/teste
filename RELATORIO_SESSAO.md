# Relatório da sessão DIGICOPY — continuar em outro chat

**Data:** 2026-08-18  
**Repo:** `kauangabrielcardososilva7890-afk/teste`  
**Branch fixa da sessão:** `arena/01a010fa-teste`  
**PR:** https://github.com/kauangabrielcardososilva7890-afk/teste/pull/23  
**Última versão:** **v5.22.3** (em construção — produção em uso continua **5.21.6**)  
**Commit:** (após push)  
**Zip:** gerar só quando o usuário pedir para atualizar  
**Produção atual do usuário:** 5.21.6 — não instalar 5.22 até a NF-e ficar pronta.

Os dados da 5.21.6 sobem para a versão nova: mesma pasta `%APPDATA%\\digicopy-erp` e mesma nuvem. Não trocar chave de banco. Não limpar. Antes de atualizar: Backup.

---

## v5.22.2 — NF-e isolada, sem mexer no resto

Pedido: a parte de NF não pode dar problema.

- Continua **sem instalar** na 5.21.6. O `.exe` atual não carrega esse código.
- Conferir NF-e **não grava** venda, leitura, estoque nem nuvem.
- Se a conferência falhar, a tela original abre do mesmo jeito.
- Ainda **não envia** nota para a SEFAZ.

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.2`

---

## v5.22.1 — conferência NF-e da venda e da leitura

Pedido: só um computador emite; o A1 já está instalado nesse PC; qualquer pessoa que mexer nesse PC pode emitir; venda e leitura.

- Regime gravado: **Simples Nacional (CRT 1)**, não é MEI, desde 01/07/2007
- Sem trava na nuvem. Sem A1 neste PC = não monta nota
- Botão **Conferir NF-e** no histórico da venda e na leitura
- Monta XML modelo 55 e mostra o que falta (IE, NCM, endereço, certificado)
- **Ainda não envia para a SEFAZ** e ainda não assina com a senha do A1

GitHack: `https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/index.html?v=5.22.1`

---

## v5.22.0 — preparação NF-e (ainda não emite)

Pedido: integrar NF-e. Usuário já tem A1. Continua usando 5.21.6 no dia a dia.

- Card **Configurações → NF-e — preparação**
- Campos: IE, regime (CRT), série, ambiente (homologação/produção)
- Botão **Carregar A1 (.pfx)** copia o certificado para `%APPDATA%\\digicopy-erp\\certs\\nfe-a1.pfx`
- Senha do A1 **não é salva** e **não vai para a nuvem**
- Emissão SEFAZ ainda não ligada

---

## v5.21.6 — Abrir orçamento da Caixa Escolar no navegador padrão

O botão **Abrir** do Buscador Escola não funcionava no `.exe` porque o Electron bloqueava janela externa. Agora abre no navegador padrão do Windows, só no site da Caixa Escolar.

---

## v5.21.5 — dados da loja + busca inteligente de CNPJ

Onde ficam os dados da empresa:
- Menu **Configurações**
- Card **Dados da loja para relatórios e notinhas**
- Salva em `db.config.loja` e na empresa única.

Busca de CNPJ:
- Na loja: botão **Buscar CNPJ** ao lado do campo.
- No cliente: o botão **Buscar** do cadastro continua, agora com fallback ReceitaWS se a BrasilAPI falhar.
- Preenche razão, fantasia, rua, número, bairro, cidade, UF, CEP, telefone e e-mail.  

---

## v5.21.4 — 1919 clientes existiam e não apareciam na tela

Causa: o painel Nuvem conta `db.clientes.length`. A tela de Clientes filtrava `empresaId === sessão`. Cadastro antigo sem empresa, ou restaurado do IndexedDB depois do `seedData`, ficava invisível.

- `seedData` agora preenche empresa também quando o campo está vazio.
- Depois do IndexedDB restaurar a base, o `seedData` roda de novo.
- A lista de clientes aceita cadastro sem `empresaId` e religa na empresa única.
- Continua: lista só aparece ao pesquisar ou clicar **Todos**.  

---

## v5.21.3 — zerar nuvem e publicar este PC (evitar duplicar)

Pedido: os dados deste PC devem ficar; o que está na nuvem pode ser apagado; depois publicar só este PC.

- Recolocado o botão **Zerar dados da nuvem** só para Admin.
- Dois avisos antes de apagar. A API continua exigindo aparelho admin único e a frase interna `APAGAR NUVEM`.
- Depois do reset a sincronização fica **pausada**. Nada sobe sozinho.
- O próximo passo é **Publicar este PC na nuvem**.
- Os dados deste computador não são apagados. Outros aparelhos precisam estar bloqueados antes do reset.

Passo a passo operacional:

1. Backup neste PC (botão Backup, só Admin).
2. Não abrir os outros PCs / celular.
3. Nuvem → Ver aparelhos → Bloquear todos, menos este.
4. Zerar dados da nuvem.
5. Conferir: Clientes na nuvem = 0 e texto PAUSADA.
6. Publicar este PC na nuvem.
7. Esperar Clientes neste PC = Clientes na nuvem e Pendentes = 0.
8. Só então gerar código para autorizar os outros aparelhos.

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

## v5.21.2 — autorização possível antes de esconder Nuvem
- Regra corrigida: PC sem token mostra **Nuvem** para qualquer perfil, permitindo colar código. Após autorização, Nuvem some para não-Admin; Backup é sempre só Admin.
- Acesso direto pós-autorização também é negado para não-Admin. Token revogado é removido pelo sync e o botão reaparece para nova autorização.
- Runtime DOM validou três estados: Kauan vê ambos; Denivaldo antes de autorizar vê Nuvem mas não Backup; Denivaldo após token não vê nenhum.

## v5.21.1 — acabamento de permissões e operação
- Botões **Nuvem** e **Backup** aparecem somente para perfil de sistema `Admin`; `Dono`/Funcionário não veem. A chamada direta e `exportBackup()` também validam perfil.
- Sync incremental continua silencioso para todos os perfis/aparelhos autorizados.
- Interface da nuvem ficou só com operação normal: publicar/sincronizar, autorizar, listar/bloquear aparelhos, listar/restaurar excluídos. Botões temporários de limpar testes, dedupe, revisão e reset saíram da UI.
- `Ver aparelhos e dados enviados` mostra por PC: perfil, bloqueio, registros atuais cuja última atualização veio dele, total de alterações e último acesso.
- Runtime DOM confirmou: Kauan vê Nuvem/Backup; Denivaldo não vê; login, 14 views e painel sem erro.
- API 0.4.1 inclui contagens por aparelho. Suíte final: **52 passaram, 1 falha aceita, 0 novas**.

## v5.21.0 — auditoria consolidada e otimização estrutural
- **Bundle único:** 101 scripts separados foram auditados; quatro runtimes legados (Firebase config/transporte, sync antigo e force-sync) saíram da execução. Os 97 scripts ativos agora são gerados em `app.bundle.js` por manifesto ordenado e hash. `npm run check` falha se o bundle estiver desatualizado.
- **Electron enxuto:** `build.files` caiu da lista manual de ~100 entradas para 8 padrões: HTML, bundle, main/preload, logos/ícone e vendor. Evita `.exe` incompleto quando um patch novo não entra na lista.
- **IndexedDB v2 incremental:** cria stores `entities`/`meta`, migra snapshot v1 automaticamente, usa hashes do manifesto e grava somente entidades alteradas. Teste runtime com fake IndexedDB confirmou migração e apenas 1 entidade escrita após editar vendas.
- **Runtime DOM:** bundle carregado por HTTP em DOM completo, login Kauan executado, 14 views navegadas e painel Nuvem aberto; zero erros de runtime (limitações esperadas do simulador ignoradas). Foi endurecido fallback `innerText/textContent` encontrado pelo teste.
- **Suíte consolidada:** novo runner não para na falha aceita de etiquetas. Resultado: **51 suítes passaram, 1 falha aceita, 0 falhas novas**. Testes novos cobrem bundle, offline, confirmações, Cloudflare, IndexedDB e segurança Electron.
- **Segurança Electron:** sandbox/webSecurity ligados na principal e popups, conteúdo inseguro bloqueado, navegação HTTP externa negada e `window.open` com preload restrito a impressão local.
- **Limpeza runtime:** Firebase/sync legado não entram mais no bundle; Cloudflare segue como único motor.
- **Limitação do ambiente:** instalação do Electron/geração do instalador Windows não rodou porque o download do binário falhou por certificado/reset TLS. Não é erro de código; build real precisa ser executado em ambiente com download liberado.

## v5.20.42 — reset da nuvem realmente manual
- “Zerar dados da nuvem” cria snapshot, apaga negócio/histórico/tombstones e deixa `paused:true`. Nenhum save/foco/timer republica.
- “Publicar este PC na nuvem” é ação separada, com confirmação. Teste real local confirmou: nuvem 0 após reset e só voltou a ter registros após publicação explícita.

## v5.20.40 — interface offline + confirmações legadas funcionais
- v5.20.38: recuperação de admin marcada por tipo; admin recuperado também cria snapshot, baixa nuvem primeiro e não publica histórico velho. Teste PC C admin passou.
- v5.20.39: Tailwind, Phosphor Icons (woff2/CSS) e Chart.js empacotados em `assets/vendor`; Google Fonts removida; notinha sem `@import` externo; assets incluídos no Electron. Interface não depende mais de CDNs no `.exe`.
- v5.20.40: `popup_sistema_patch` não força mais `confirm()` a `false`. Wrappers confirmados liberam exatamente uma chamada síncrona interna; bypass expira no mesmo ciclo. Fluxos legados não migrados usam diálogo nativo como fallback em vez de cancelar silenciosamente.
- Testes `test_offline_assets.js` e `test_confirm_compat.js` + sintaxe completa: OK.

## v5.20.37 — limpeza de origem concluída, 1.919 clientes íntegros
- Produção: 50 duplicados seguros unidos; sete clientes realmente extras removidos pela origem histórica em aparelhos bloqueados; dois cadastros de origem bloqueada foram preservados porque substituíram originais na deduplicação.
- A revisão passou a usar o primeiro evento imutável do registro, não `updated_by`; remoção revalida origem e bloqueia cadastros que tenham original unido/excluído.
- Estado final confirmado: **1.919 clientes no PC = 1.919 na nuvem, pendentes 0, registros ativos 1.934, aparelhos ativos 1**.
- Excluídos 66 são tombstones recuperáveis de todas as entidades. O aumento de 57→66 incluiu sete ativos removidos e duas ordens para IDs já ausentes; ativos caíram exatamente sete (1.941→1.934), sem perda adicional.
- Teste D1 cobre registro criado em aparelho bloqueado, posteriormente atualizado pelo admin, classificação de versão substituta, bloqueio e limpeza seletiva.

## v5.20.34 — impedir histórico velho + reparar 57 clientes duplicados
- Produção confirmou falha: segundo navegador tinha 57 clientes locais antigos com IDs diferentes; nuvem passou de 1.919 para 1.976 clientes. Não era retry duplicado, eram IDs distintos.
- Primeiro sync de aparelho não-admin agora cria snapshot IndexedDB, baixa a nuvem e remove/quarentena registros locais anteriores ausentes da nuvem; teste real confirmou que cliente velho do PC B não foi publicado.
- Admin ganhou **Analisar clientes repetidos**: agrupa por código normalizado ou CPF/CNPJ, mantém cadastro mais referenciado/completo, preenche campos vazios, troca `clienteId`/`idCliente` em históricos, cria snapshot e exclui extras de forma recuperável.
- Usuário deve executar no PC admin; resultado esperado: remover 57 extras e voltar a 1.919 clientes ativos em PC/nuvem.

## v5.20.33 — administração de aparelhos e excluídos
- Admin lista aparelhos autorizados, perfil e bloqueio; não pode bloquear o próprio aparelho. Bloquear revoga token sem apagar negócio.
- Admin lista até 100 registros excluídos com entidade/nome e restaura individualmente; restauração entra no log incremental e chega aos demais PCs.
- API testada: dois aparelhos, listagem, bloqueio do segundo e token revogado recebendo 401; dados preservados.

## v5.20.32 — contagem confiável durante envio inicial
- Painel agora separa **Clientes neste PC**, **Clientes na nuvem**, total de registros e **Pendentes neste PC**; o antigo “Fila 100” era só o limite do lote, não o restante total.
- API `/v1/status` retorna contagem ativa/excluída agrupada por entidade.
- Lote por requisição reduzido de 25 para 10 para manter margem segura de subrequisições no Worker gratuito.
- Usuário informou 1.919 clientes; a captura com 412 registros não representava conclusão. Não importar nada até as duas contagens de clientes coincidirem e pendentes chegar a zero.

## v5.20.31 — armazenamento ampliado + limpeza segura dos testes
- Confirmado em uso: `localStorage` lotou. Novo `indexeddb_persistence_patch.js` mantém snapshot completo em IndexedDB, restaura antes do sync e espelha `saveDB`/`saveDBAgora`.
- Aviso de espaço antigo só aparece se o IndexedDB também não iniciar; o sync aguarda `DIGICOPY_DB_READY` para nunca publicar base parcial durante restauração.
- Botão **Backup** agora visível na barra superior (antes estava preso na sidebar oculta).
- Painel Nuvem desconectado oferece **Limpar dados de teste deste navegador** com dois avisos; remove apenas chaves DIGICOPY e IndexedDB local, não JSON baixado nem D1.
- Usuário confirmou que só o JSON externo dos clientes precisa ser preservado; produtos/demais dados atuais são testes.

## v5.20.30 — sincronização Cloudflare local-first funcionando
- Novo `cloudflare_data_sync_patch.js`: baixa primeiro, envia só alterações, cursor incremental, fila local durável, idempotência, versão por registro, conflito preservado e backoff.
- Sincroniza empresa, usuários, clientes, produtos, equipamentos, contratos, parque, leituras, chamados, vendas, financeiro, logs, técnicos, notificações, configuração e módulos dinâmicos.
- Em repouso autorizado: uma consulta por minuto somente com a aba visível; 5 PCs ≈ 7.200 solicitações/dia, abaixo das 100 mil/dia do Worker. Sem `setInterval`; foco/save agenda atualização e falhas aumentam o intervalo até 5 min.
- Nuvem vazia/ausência de registro nunca apaga o PC. Exclusão só nasce de registro previamente conhecido; exclusão inesperada de >=10 e >30% da entidade é bloqueada até confirmação no painel.
- Servidor mantém o conteúdo excluído; admin lista e restaura. API grava registro + evento em lote atômico.
- Teste real local com Worker+D1: PC A publicou cliente; PC B vazio baixou; edição B→A; exclusão A→B; conteúdo preservado; restauração voltou no B — tudo OK.
- Painel Nuvem mostra fila, registros, excluídos, sincronização manual e aprovação de exclusão em massa.

## v5.20.29 — aviso Firebase antigo eliminado
- Corrigido o popup `Não foi possível carregar a nuvem / Quota exceeded`: era a rotina antiga `autoCarregarNuvemSeVazio`, que ainda chamava o carregamento Firebase 4,5s após abrir.
- O patch Cloudflare agora marca a carga antiga como concluída e neutraliza todas as funções automáticas/manuais do sync legado.
- Teste de regressão confirma que Firebase automático, diagnóstico antigo e gatilho de carga não estão ativos.

## v5.20.28 — Cloudflare D1 pronta + autorização de aparelhos
- Worker `digicopy-sync-api` implantado pelo GitHub e D1 `digicopy-erp` vinculado; `/health` confirma API 0.2.0, esquema 2, segredo configurado e `ready:true`.
- API incremental versionada: aparelhos com token individual em hash, primeiro admin, convite de uso único, segundo admin, recuperação sem apagar negócio, lote idempotente, cursor e bloqueio de conflito por versão.
- Migrações D1 automáticas antes de cada deploy; testes locais completos com dois aparelhos simulados passaram.
- Novo `cloudflare_sync_patch.js`: botão **Nuvem** visível, ativação principal, ingresso por código, recuperação e geração de convite. O segredo nunca é salvo localmente.
- Firebase automático e diagnóstico antigo saíram do carregamento. A sincronização de dados Cloudflare ainda será habilitada na próxima etapa; **não importar clientes ainda**.
- Teste Playwright real foi preparado em `e2e/`; download local do Chromium foi bloqueado por reset TLS do sandbox. Workflow GitHub não pôde ser enviado porque o token do GitHub App não possui permissão `workflows`; testes estáticos e sintaxe passaram.

## v5.20.27 — consumo oculto de cota encontrado e removido
- Auditoria encontrou um segundo sincronizador automático legado em `sync_client.js`, ainda consultando `app_state` a cada **75 segundos**, embora o relatório anterior o considerasse inerte.
- Em 5 aparelhos, só esse timer podia fazer cerca de **5.760 consultas por dia**, concorrendo com o `sync_realtime_patch.js`. O patch `limpar_nuvem_patch.js` ainda forçava esse legado a permanecer ligado.
- O automático legado e seus disparadores foram desativados. As funções manuais antigas ficam apenas por compatibilidade; o único motor automático agora é o incremental `sync_realtime_patch.js` (`erp_rt`), sem `setInterval`.
- Novo `test_sync_quota_guard.js` impede a volta do timer, do force-enable e de polling no motor incremental.
- `npm run check` e teste de proteção de cota: OK.

## v5.20.26 — botão Teste nuvem realmente visível
- **Causa encontrada:** o botão da v5.20.25 foi colocado dentro de `#side