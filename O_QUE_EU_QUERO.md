# O que eu quero — DIGICOPY

Documento único do que o usuário pediu. Nada além disso deve ser feito.

**Estado atual:** v5.20.24, commit `f9c42503e29a8e3a7c530e2c6fae983f45e85bfd`, branch `arena/01a00b4d-teste`.
**Link:** https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/f9c42503e29a8e3a7c530e2c6fae983f45e85bfd/index.html?v=5.20.24

---

## 1. Botões de excluir — FEITO (aprovado)

- **Clientes:** botão de excluir com seleção de vários de uma vez.
- **Financeiro:** botão de excluir com seleção de vários de uma vez.
- Excluir é **deletar de verdade**, nunca ocultar da tela.
- Nenhuma funcionalidade que já existia pode ser removida por causa disso.

## 2. Tirar o "pagar" junto com o filtro — FEITO (aprovado)

- Contas a pagar fora da tela.
- O filtro de tipo (`#neo-fin-tipo`) não mostra mais a opção "pagar".

## 3. Excluir cliente com histórico — FEITO (aprovado)

- Não bloqueia mais o cliente que tem histórico.
- 1º aviso: mostra o que será apagado junto.
- 2º aviso: "tem certeza que deseja fazer isso".
- Confirmando os dois, apaga o cliente e todo o histórico dele.

## 4. Botão de exportar backup — FEITO (aprovado)

- Removido do menu Configurações.

## 5. Botão de importar — PENDENTE

- Remover o botão de importar **quando o usuário mandar**, não antes.
- O usuário vai importar os dados primeiro e depois avisar.
- Depois disso, deixar pronto para o sistema final.

---

## Regras de trabalho

- Fazer **só** o que foi pedido. Não incluir melhoria, correção ou ajuste que não foi solicitado.
- Na dúvida, **perguntar antes** de escrever código.
- Não mexer em usuários, empresa, sessão, login ou sincronização sem pedido explícito.
- Avisos pela tela do sistema (`lfbAlert` / `confirmSistema`). O `confirm` do navegador está desativado e não funciona.
- Português, direto ao ponto.
- Cada entrega: link GitHack clicável com `?v=`, commit e resumo curto.
- Não gerar .zip.
- Branch fixa: `arena/01a00b4d-teste`.

## Erros que não podem se repetir

- Ir além do pedido "para ajudar". Foi o que aconteceu nas v5.20.25 e v5.20.26 — revertidas.
- Tratar sintoma como bug sem confirmar com o usuário qual é o problema real.
- Mexer em várias coisas de uma vez quando o pedido era pontual.
