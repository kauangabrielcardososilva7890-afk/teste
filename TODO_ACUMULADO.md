# TODO acumulado - DIGICOPY ERP

## Atualização v3.4 concluída

- [x] Iniciar mudança para **Modo Fácil** com botões grandes na tela inicial.
- [x] Renomear menus para linguagem mais simples: Início, Vender / Orçar, Estoque, Chamados, Máquinas nos clientes.
- [x] Documentar formas seguras de alocar o `.RAR` atualizado fora do GitHub público.
- [x] Atualizar tela de migração para considerar que o `.RAR` é a fonte correta, e o `BANCO.FDB` local pode estar desatualizado.


## Atualização v3.3 concluída

- [x] Corrigir menu **Banco antigo (.FDB)** que apontava para uma tela inexistente.
- [x] Criar página de migração do `BANCO.FDB` com plano de nuvem/multiusuário.
- [x] Adicionar importação de backup JSON local para testes.
- [x] Documentar credenciais demo e plano do executável.
- [x] Preparar scripts do `package.json` para checagem e build Windows.
- [x] Remover duplicados gerados em etapas anteriores (`final_app.js`, `index_final.html`) e arquivo compactado redundante (`BANCO.rar`).

## Próximas validações com o usuário

- [ ] Validar visual do novo Modo Fácil no Githack.
- [ ] Definir quais telas do sistema antigo devem ser copiadas primeiro: vendas, locação, estoque, financeiro ou OS.
- [ ] Decidir provedor de nuvem: Supabase, VPS própria, Firebase, Railway/Render ou servidor local com VPN.
- [ ] Confirmar se a importação inicial deve trazer tudo do Firebird ou apenas cadastros principais.

## Backlog técnico

- [ ] Criar extrator Firebird a partir do `.RAR` atualizado fora do navegador.
- [ ] Gerar `migration-export.json` com clientes/produtos/vendas/locações reais.
- [ ] Criar API REST com autenticação por empresa/CNPJ e usuário.
- [ ] Substituir `localStorage` por chamadas API.
- [ ] Criar permissões por perfil: Admin, Comercial, Técnico, Financeiro.
- [ ] Finalizar build `.exe` com `electron-builder`.
- [ ] Criar rotina de backup automático e auditoria em nuvem.
