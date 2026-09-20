# Regras do projeto DIGICOPY (vale para todo chat)

Lista única e numerada. Se uma regra mudar, atualize AQUI (não espalhe em outros `.md`).

## Jeito de trabalhar
1. **Português simples e direto.** Se houver dúvida, **perguntar antes** — nunca adivinhar.
2. **Não pular fase; ler todos os `.md` e todos os arquivos.** Pode demorar o quanto precisar; não trazer problema de volta.
3. **Um patch separado por funcionalidade** (um arquivo por assunto, sem misturar).
4. **Antes de criar qualquer função nova, verificar se ela já existe no sistema.** Se existir ou houver dúvida, **perguntar** — nunca duplicar.
5. **Antes de publicar: `npm run check` + `npm test` passando.**
6. **Toda atualização manda: link do site Cloudflare + PR + commit + resumo objetivo + atualizar o `.md`.** Reenviar os links toda vez.
7. **NUNCA mandar link GitHack** (regra antiga deletada a pedido do usuário).
8. **Publicar via PR** (branch fixa da sessão; não trocar de branch).

## Código
9. **Remover = deletar de verdade.** Nada de esconder com CSS/regex nem fingir exclusão com código numérico ou flag 0/1.
10. **Avisos e confirmações: `lfbAlert` / `confirmSistema`.** Nunca `alert`/`confirm` direto no código novo.
11. **`window.confirm`: era quebrado, JÁ CORRIGIDO.** O popup v1 forçava `false` (botões cancelavam sozinhos); o `popup_sistema_patch` v2 corrigiu: fluxo migrado libera **um** "sim" interno (bypass que expira no mesmo ciclo) e fluxo antigo usa o diálogo nativo como fallback. Ver `popup_sistema_patch.js`.
12. **Códigos numéricos:** exclusão nunca usa código/flag numérica (ver regra 9). Flags internas 0/1 só onde documentado (ex.: o bypass da regra 11, que expira sozinho). *Se "códigos numéricos" se referia a outra coisa (códigos de cliente/contrato, erro 403 etc.), perguntar ao usuário.*
13. **Busca: só no Enter ou na lupa.** Nunca filtrar a cada tecla.
14. **Empresa única fixa** (`emp_digicopy`). Nenhum código/UI cria empresa nova; o `seedData` nunca apaga usuário real.
15. **Duplo clique na linha abre o registro: consertar, nunca remover.** Excluir/baixar/pagar/estornar/faturar/salvar NUNCA entram no duplo clique.
16. **Testes quebrados ou parados: consertar.** Só deletar teste se ele testar coisa que nunca existiu no git.
17. **Chamados: o que pedir vale nos DOIS** (dentro do contrato e avulso), salvo se o usuário disser que é só de um.

## Áreas
18. **Não reabrir etiquetas nem vendas** sem pedido explícito (áreas aceitas/fechadas).
19. **Áreas aceitas não mexer sem pedido** (lista do "Aceito" em `RELATORIO_SESSAO.md`).
20. **Rawgh-banner** (aviso de endereço provisório): REMOVIDO na v5.21.5 com aprovação do usuário.

## Pendências do usuário (não são regras, só para não esquecer)
- Nenhuma no momento. Perguntas do merge com o outro chat em `RELATORIO_SESSAO.md` ("Linha do site").
