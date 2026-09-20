# REGRAS PARA SEGUIR SEMPRE — DIGICOPY

> Documento canônico de regras de trabalho, produto, segurança, dados, fiscal,
> nuvem, build e entrega.
>
> Criado em 20/09/2026 a partir da consolidação dos documentos do projeto.
> Deve ser lido antes de qualquer alteração. Os relatórios continuam existindo
> como histórico e evidência; quando um relatório antigo divergir deste arquivo,
> prevalecem, nesta ordem: pedido mais recente e explícito do usuário, código
> atualmente vivo, testes atuais, `package.json`/manifesto e este documento.
>
> **Não confundir regra ativa com histórico:** versões, branches, números de
> testes, links GitHack e decisões já substituídas que aparecem nos diários não
> devem ser reutilizados sem conferência no código atual.

## 1. Regra de fonte da verdade e método

1. Conferir fatos, código, testes e arquivos antes de concordar com uma afirmação
   ou implementar uma ideia. Nunca concordar automaticamente.
2. Se a afirmação estiver errada ou incompleta, explicar isso com evidência antes
   de agir.
3. Antes de responder que algo chegou, não chegou, existe ou não existe, varrer
   os arquivos relevantes, especialmente `RELATORIO_SESSAO.md`,
   `MAPEAMENTO_SISTEMA_ANTIGO.md` e o histórico Git.
4. Antes de codar, responder mentalmente as 14 perguntas permanentes:
   - este código precisa existir?
   - já existe código vivo que resolve isso?
   - a linguagem ou plataforma já resolve isso nativamente?
   - dá para fazer de modo mais simples e leve?
   - um arquivo novo é realmente necessário?
   - vai funcionar no navegador, Electron, nuvem e mobile quando aplicável?
   - pode causar bug, travamento, duplicação ou perda de dados?
   - entendi exatamente o pedido?
   - tenho contexto e ferramentas suficientes?
   - falta perguntar alguma coisa antes?
   - a documentação ficará completa para outro chat?
   - há código desnecessário?
   - estou fazendo o que foi pedido, e não uma interpretação própria?
5. Se houver ambiguidade real, perguntar antes de codar. Não criar uma versão
   própria do pedido sem autorização. Se houver uma alternativa melhor, propor
   primeiro.
6. Um pedido que afeta uma funcionalidade deve ser rastreado em todas as telas,
   módulos, fluxos, cópias, APIs e testes relacionados antes da entrega.
7. Responder em português simples e direto, sem tom condescendente.
8. Manter a documentação necessária no repositório, mas não guardar segredos,
   senhas, tokens, arquivos pessoais ou dumps sensíveis nela.
9. Em cada chat de desenvolvimento, trabalhar na branch fixa da sessão e abrir
   um PR ao final do trabalho. Não fazer merge sem confirmação humana explícita.

## 2. Organização do código e dos módulos

10. Manter um arquivo por módulo.
11. Correção em módulo existente deve editar o arquivo vivo existente; não copiar
    o módulo inteiro para criar uma segunda versão.
12. Criar arquivo novo somente quando a função ainda não existir em nenhum módulo
    vivo ou quando houver um módulo realmente novo.
13. Funcionalidade nova deve permanecer separada por módulo, sem transformar o
    projeto em um arquivão.
14. Não deixar código morto no repositório por precaução. Antes de remover algo,
    ler o arquivo inteiro, verificar efeitos colaterais e dependências, provar
    que está morto e executar a suíte antes e depois. Remoções em lote exigem
    aprovação quando forem parte de uma poda planejada.
15. Nunca adicionar uma tag `<script>` no `index.html` para arquivo que já está
    no `bundle-manifest.json`; isso executa o código duas vezes.
16. Não editar `build.files` nem `scripts.check` manualmente: eles devem ser
    derivados por `sync_build.js`.
17. Todo patch que embrulha função, registra listener ou cria timer precisa de
    guarda idempotente (`window.__v...`, ou equivalente), para não executar duas
    vezes.
18. Não redefinir uma função sem conferir a cadeia viva e a função vencedora.
    Preservar a referência anterior quando o wrap for necessário.

## 3. Desempenho e comportamento de telas

19. O alvo principal é o sistema de PC. PCs fracos são requisito de projeto:
    evitar leitura, parse, memória, renderização e rede duplicados.
20. Não usar polling curto, especialmente `setInterval` de 2–4 segundos para
    recriar telas ou consultar a nuvem.
21. Timers que alteram DOM ou fazem rede devem respeitar tela oculta; fora da
    tela relevante devem sair antes de qualquer trabalho.
22. O Buscador Escola só pode atualizar automaticamente enquanto sua aba estiver
    aberta. Não fazer login, busca, gravação ou sincronização invisível em outra
    tela.
23. O APK/mobile permanece pausado. Só sincronizar o `mobile/www` para manter
    coerência e evitar quebra de futuras atualizações; não evoluir funcionalidade
    mobile até nova autorização.
24. Buscas pesadas não devem filtrar a cada tecla: usar Enter, lupa ou filtro
    explícito. Uma exceção só vale quando estiver documentada e comprovada para
    um campo específico cujo filtro em tempo real foi pedido e testado.
25. Não usar barra A–Z como mecanismo de navegação/listagem.
26. Listagens grandes devem iniciar leves e só carregar tudo quando o usuário
    pesquisar, aplicar filtro ou pedir explicitamente "mostrar todos".
27. Códigos internos, etiquetas e códigos novos devem ser somente numéricos,
    sem prefixo, letras ou ano, salvo uma integração que exija outra chave
    técnica separada.
28. Não renderizar novamente a área em que o usuário está digitando. Preservar
    texto, foco, seleção e formulário em falhas e transições.
29. O sistema deve denunciar erro indevido com aviso claro e registro em
    `erro.txt`, sem entrar em loop de erro. O usuário deve conseguir abrir ou
    baixar o arquivo conforme o ambiente.

## 4. Popups, navegação e interface

30. Nunca usar `prompt`, `confirm` ou `alert` nativos do navegador.
31. Toda confirmação, erro ou decisão deve usar popup/modal próprio do sistema,
    com botão X e, quando apropriado, fechamento por ESC.
32. O popup deve ficar na frente da tela e ter foco/z-index correto.
33. Ao fechar uma aba/modal interna por X ou ESC, voltar à aba anterior quando
    houver pilha de navegação, em vez de fechar toda a aplicação.
34. Não deixar botão morto, silencioso ou com promessa falsa. Todo caminho de
    erro deve mostrar motivo e manter os dados digitados quando possível.
35. O visual deve respeitar o padrão do sistema em modo claro e escuro.
36. O Menu Fiscal deve ser um menu real na barra superior, com submenu próprio;
    não usar overlay ou conteúdo fiscal flutuando dentro da tela.
37. Os seis itens fiscais oficiais devem permanecer no submenu do Fiscal, e a
    barra reconstruída pelos menus deve manter o mesmo resultado.
38. O clique do menu Backup deve abrir a aba normal de Backup e nunca baixar um
    arquivo por engano. Botões de exportação dentro das telas continuam podendo
    exportar quando essa for a ação explícita.

## 5. Segurança, credenciais e dados sensíveis

39. Nunca colocar no código, commit, relatório, teste, bundle, HTML público,
    `.env` versionado ou documentação: tokens, senhas, CSC, senha de certificado,
    chaves de API, credenciais, cookies, `.pfx`, dumps sensíveis ou dados reais
    desnecessários.
40. Nunca pedir ao usuário que envie senha, token, CSC ou certificado pelo chat.
    A credencial deve ser digitada no fluxo próprio e seguro do sistema.
41. Se uma credencial for colada em chat, terminal compartilhado ou arquivo
    indevido, tratá-la como exposta: revogar/rotacionar antes de reutilizar.
42. O CSC do dump antigo foi descartado. Não copiar, recuperar ou reutilizar esse
    CSC. Quando NFC-e for ativada, o dono gera/confere o CSC na SEFAZ-MG e o
    informa diretamente na Central Fiscal.
43. A senha do certificado digital nunca fica salva em código, banco, nuvem,
    relatório ou commit. Deve ser pedida somente no momento de validar, assinar
    ou transmitir.
44. O certificado A1 pode ser selecionado/armazenado conforme o fluxo seguro do
    aplicativo, mas a senha permanece somente na operação em que for necessária.
45. Credenciais do Buscador Escola só podem ser informadas dentro do Sistema,
    em configuração controlada. Não registrar senha real em código ou relatório.
46. Identificadores públicos de conta/banco não são segredos, mas não confundir
    identificador com token. Tokens de Cloudflare devem ficar em Secret/cofre.
47. Não expor APIs Electron diretamente pelo nome final no `contextBridge`.
    Adicionar a API à ponte única (`__digicopyPontes`) e deixar o patch vivo
    criar os nomes compatíveis.
48. Manter `contextIsolation`, sandbox, `nodeIntegration: false`, lista branca
    de URLs externas e bloqueios de DevTools conforme o código de segurança atual.
49. Mensagens de erro não devem vazar senha, token, certificado ou dados pessoais
    além do necessário para diagnosticar.

## 6. Fiscal: NF-e, NFC-e e certificado

50. Homologação é sempre o primeiro ambiente. Produção só pode ser liberada com
    a palavra `PRODUCAO` digitada, permissão adequada e auditoria.
51. Nada emite nota automaticamente ao finalizar venda, por timer ou em segundo
    plano. Emissão exige ação manual, permissão e senha do certificado na hora.
52. Toda ação fiscal relevante deve ser auditada em `db.logs`/trilha fiscal,
    inclusive tentativa negada, assinatura, transmissão, cancelamento,
    inutilização, manifestação, CC-e e consulta quando aplicável.
53. Em homologação, DANFE e prévias devem deixar claro: `NOTA DE TESTE, SEM
    VALOR FISCAL`.
54. Sem ponte Electron, certificado ou resposta real da SEFAZ, nunca mostrar
    sucesso falso: salvar como não gerada/pendente e explicar a limitação.
55. Nota autorizada não pode ser editada ou excluída. Orientar CC-e,
    cancelamento ou clonagem conforme o caso.
56. Excluir rascunho, gerar nota, manifestar e inutilizar exigem a permissão
    fiscal correspondente. O bloqueio deve existir no executor, não apenas no
    botão escondido.
57. CC-e deve respeitar validação do texto, confirmação extra em produção,
    sequência, histórico, XML guardado e auditoria.
58. Testar serviço da SEFAZ deve assinar na hora, não salvar a senha e tratar
    respostas reais; sem ponte, mostrar instrução, nunca sucesso fabricado.
59. Pacote mensal para contador deve ser gerado com os XMLs e eventos do mês
    escolhido; mês vazio gera aviso e não inventa arquivo.
60. O padrão atual é NF-e modelo 55 primeiro. NFC-e modelo 65 só avança quando
    o fluxo e o CSC real forem confirmados.
61. O texto legal do Simples nasce vazio. Não inserir valores fiscais prontos do
    dump antigo sem confirmação; só usar o texto preenchido e aplicá-lo no
    ambiente permitido.
62. NCM de referência não deve virar cadastro de produto automaticamente.
    NCM por tipo de item deve seguir a regra atual e ser conferido antes de
    alterar XML.
63. Configurações fiscais antigas são referência, não comando automático:
    conferir CRT, série, ambiente, frete, versão, CSOSN e demais campos com a
    contabilidade e com a fonte atual.

## 7. Permissões, sessão e cura de dados

64. Caixas de permissão só podem ser vistas/alteradas por Admin/Dono conforme a
    regra vigente do módulo. Alterações devem ser auditadas.
65. Padrões de compatibilidade não podem travar usuários existentes: apagar e
    estornar permanecem liberados por padrão quando essa for a regra consolidada;
    emitir NF permanece desmarcado por padrão.
66. A permissão deve ser verificada no executor real de excluir/estornar, e não
    somente escondendo botões.
67. Tentativa negada deve usar popup do sistema e gerar trilha em Auditoria.
68. Admin/Dono não podem ser trancados por sua própria configuração e não se
    pode excluir o último administrador/dono.
69. Cura automática de empresa/sessão nunca pode chutar. Só carimbar a sessão
    quando houver exatamente uma empresa válida; com duas ou mais, orientar novo
    login.
70. Login de usuário, autorização do aparelho, perfil local e empresa da sessão
    são coisas diferentes; diagnosticar cada camada antes de dizer que os dados
    sumiram.
71. Um pull inicial incompleto ou uma rede caída não pode apagar sobras locais.
    Só reconciliar depois de confirmar que o pull terminou completo.
72. Conflito de sincronização não pode descartar a edição local em silêncio.
    Aplicar a versão correta, reenviar a intenção quando seguro e avisar quando
    houver conflito repetido.
73. Não apagar dados automaticamente durante atualização, login, cura, migração,
    sincronização ou troca de versão.
74. Reset da nuvem exige ação explícita, frase exata, condições de segurança e
    backup completo antes; não resetar se o backup falhar.

## 8. Vendas, locação, chamados, clientes, Pix e histórico

75. Extorno marca o registro como extornado e preserva o histórico; não apagar
    simplesmente a venda ou o título financeiro.
76. Extorno de venda deve tratar financeiro, estoque e reabertura sem duplicar
    baixa/devolução. Conferir caixa quando houver pagamento já recebido.
77. Títulos extornados ficam identificados e fora das somas de aberto, recebido e
    vencido; não transformar extorno em exclusão silenciosa.
78. Pix não faz baixa automática. Preservar histórico e exigir comprovante ou
    ação manual conforme o fluxo atual.
79. Não criar venda automaticamente durante migração, conversão ou importação sem
    conferência explícita, para não duplicar vendas.
80. Orçamento aprovado, recusado, vendido ou excluído deve manter status e
    origem; não sumir por uma sincronização ou exclusão local indevida.
81. Cadastro manual não deve ser sobrescrito por importação. Importadores devem
    deduplicar com a prioridade definida (documento, código, nome) e apenas
    completar campos vazios quando essa for a regra.
82. Não apagar movimentações, estoque, histórico de insumos ou valores antigos
    automaticamente. Não executar limpeza em massa sem confirmação explícita.
83. Impressoras de locação pertencem ao contrato/parque, não ao menu Produtos.
    Modalidades ficam na impressora do contrato, não no cadastro geral do
    contrato.
84. Uma leitura deve respeitar o fluxo contrato → impressora → medidor ativo →
    lançamento. Remanejadas permanecem como histórico e não recebem leitura nova.
85. Não deixar duas telas/leitura do mesmo fluxo abertas quando a regra do módulo
    exigir uma única aberta.
86. Exclusão de chamado ligado a contrato deve avisar que também remove da lista
    do contrato; exclusão de chamado avulso deve deixar claro que é definitiva.
87. Filtros/listas de vendas, clientes, contratos, orçamentos e leituras devem
    permanecer leves e acionados explicitamente, salvo exceção documentada.
88. Relatórios e RTF devem usar os campos reais mapeados e deixar vazio somente
    o que realmente não existir no cadastro; não inventar dados.

## 9. Migração do sistema antigo

89. Migração só começa quando solicitada explicitamente.
90. O dump antigo é mapa de referência, não fonte para copiar cegamente. Antes de
    usar qualquer campo, conferir se é regra real, lixo, credencial ou dado
    desatualizado.
91. Migrar dentro do aplicativo, mantendo os arquivos originais no PC do dono.
    Arquivos grandes, especialmente acima de 130 MB, não entram no repositório.
92. Sempre produzir mapa de campos e prévia antes de gravar.
93. Importar na ordem: núcleo, referências fiscais, operação/histórico por lotes.
94. Não ler senha, segredo, CSC ou certificado do sistema antigo.
95. NCM/CEST de referência devem ser tratados como dicionário, não como cadastro
    comercial automático.
96. Não migrar tabelas identificadas como lixo operacional, cache ou integrações
    antigas sem decisão específica.
97. Não copiar visual, nome, marca, código, identidade ou fluxo do sistema antigo
    literalmente; extrair apenas a regra de negócio confirmada.
98. Regras antigas de boleto, SMS, e-mail, loja online, NFS-e, agenda e integrações
    ficam fora até solicitação e confirmação de escopo.
99. Ao existir dúvida sobre a correspondência de tabelas/OS/visitas, parar e
    mostrar a prévia. Nunca chutar o destino.

## 10. Nuvem, sincronização, backups e atualizações

100. A nuvem é local-first e incremental: nenhuma rota deve substituir a base
     inteira sem fluxo explícito de reset.
101. Alterações devem ser versionadas, idempotentes, atribuídas ao aparelho e
     protegidas contra conflito.
102. Token de aparelho deve ser armazenado no D1 somente como hash; convites são
     de uso único e expiram.
103. `SETUP_SECRET`, token de medição e qualquer credencial Cloudflare ficam como
     Secret. Nunca no app, PC, GitHub ou commit.
104. Backups não podem ser apagados automaticamente. A limpeza é manual e deve
     apagar somente backups, nunca dados de negócio.
105. Backup manual, diário, de atualização e de segurança devem manter nomes,
     pastas, compressão e retenção definidos no Worker atual.
106. Backup de troca de versão deve ocorrer antes de depender da nova versão e
     não deve duplicar o mesmo nome de versão.
107. O backup de segurança deve existir antes de zerar a nuvem; se falhar, o reset
     não acontece.
108. O medidor oficial usa token somente de leitura guardado no worker. O sistema
     nunca recebe esse token.
109. O contador oficial não deve usar cronômetro invisível se a regra vigente for
     medir quando a tela de Nuvem/Backup for aberta; não gastar cota para medir a
     própria cota.
110. O Gerente de Atualizações publica; o cliente decide quando baixar/instalar.
     Não instalar atualização automaticamente nos PCs dos clientes.
111. Portal, sininho, destino por empresa, expiração, histórico e arquivo `.exe`
     devem respeitar autorização e não expor releases ocultas ou destinatários.
112. Atualização não pode apagar ou comprometer clientes, vendas, contratos,
     configurações ou históricos.
113. Recuperação de acesso deve preservar dados de negócio e respeitar cooldown,
     auditoria e as condições de segurança do Worker.

## 11. Build, versão, bundle, Electron e mobile

114. A versão efetiva sempre deve ser confirmada no `package.json`, fontes,
     manifesto e testes atuais. Não confiar no número antigo de um relatório.
115. Alterou código, deve haver versão crescente; não reutilizar a mesma versão
     para uma entrega diferente. Ao trocar versão, deixar `package.json`,
     `package-lock`, `index.html`, bundle, mobile e documentos coerentes.
116. O número nunca pode ser sobrescrito por patch. Usar a global real
     `window.DIGICOPY_APP_VERSION` e ler dela ao pintar título, rodapé e janela.
117. Todo arquivo carregado pelo app deve existir e ser coberto por manifest,
     `index.html`, `build.files`, bundle, validação e cópia mobile quando
     aplicável.
118. O `app.bundle.js` deve ser gerado por `build_bundle.js`, com isolamento por
     script quando o parser permitir, e sua impressão digital deve bater com o
     projeto e o pacote.
119. A impressão digital do bundle deve invalidar cache de código quando houver
     mudança, mesmo que a versão numérica não tenha mudado durante um diagnóstico.
120. O build do `.exe` deve usar o fluxo oficial: limpar, sincronizar, gerar
     bundle, empacotar e verificar. Não entregar instalador incompleto.
121. A lista de arquivos do `.exe` não deve ser editada à mão. `sync_build.js`
     deve derivar `build.files` e `scripts.check` e falhar para referência ausente.
122. Dependências vendorizadas necessárias ao build devem continuar disponíveis;
     não depender silenciosamente de `node_modules` vazio.
123. O APK não é frente de desenvolvimento agora, mas qualquer alteração de
     origem que ele consuma deve sincronizar `mobile/www` e validar referências.
124. Não gerar nem commitar ZIP novo. Para baixar o projeto, usar o ZIP da branch
     no GitHub.
125. Não instalar versão antiga por engano: conferir rodapé, hash do bundle,
     diagnóstico e pasta do instalador. Se for limpar cache, nunca apagar dados;
     fazer backup antes.

## 12. Testes e checklist obrigatório de entrega

126. Antes de entregar código, executar os checks aplicáveis, especialmente:
     - `npm run check`;
     - `npm test`;
     - `npm run sync:check`;
     - `npm run bundle` ou `npm run build_bundle.js --check`, conforme a etapa;
     - validação de referências/arquivos;
     - `verify:files`/`verify:exe` quando houver empacotamento;
     - `mobile/sync-www.js`/validação mobile quando houver impacto mobile;
     - testes do `cloudflare-worker` quando houver impacto no Worker;
     - testes E2E quando o fluxo de navegador for afetado.
127. Não entregar com teste falhando sem explicar e sem autorização. Falha de
     infraestrutura deve ser separada de falha do produto.
128. Testes não devem depender de comentário histórico, lista fixa dos últimos
     patches, limite arbitrário de arquivos ou uma versão antiga específica.
     Derivar dados das fontes atuais.
129. Teste deve verificar comportamento e definição viva, não apenas a existência
     de texto.
130. Relatórios e testes entregues ao usuário devem ter dois blocos distintos:
     **CORREÇÕES** e **ADIÇÕES**. Quando for necessário preencher algo, preferir
     colar na conversa ou usar HTML/TXT previsto; não exigir preenchimento de MD.
131. Ao relatar uma alteração, informar claramente o que foi corrigido, o que foi
     adicionado, o que foi testado, o que ficou pendente e qualquer divergência
     encontrada.

## 13. Links e comunicação de cada atualização

132. Toda atualização deve informar os links oficiais atuais:
     - Pages de teste: `https://teste-60f.pages.dev`;
     - ZIP da branch GitHub da sessão;
     - portal público de atualizações.
133. GitHack/raw.githack está obsoleto para este projeto privado e nunca deve ser
     oferecido como plano B.
134. O link do cliente nunca deve ser escrito com branch fixa antiga. Deve ser
     derivado da branch configurada e conferido contra a branch real da sessão.
135. Se o repositório for privado, avisar que o ZIP exige autenticação no GitHub;
     o site Pages e o portal continuam sendo os caminhos de teste/atualização
     previstos.

## 14. Regras de escopo e fila

136. Mobile/APK continua pausado até autorização nova.
137. Migração do sistema antigo só quando solicitada.
138. NFC-e 65 só quando o CSC real e o fluxo forem confirmados.
139. NCM por tipo de item, texto legal do Simples, etiquetas A4, permissões
     restantes, links de cobrança e demais itens de fila só entram quando o
     usuário pedir explicitamente ou autorizar a execução.
140. Poda de código, troca de arquitetura, deploy de produção, reset de nuvem,
     migração e emissão fiscal exigem evidência e confirmação humana quando
     representarem ação destrutiva, irreversível ou de produção.

## 15. O que é histórico, não regra ativa automática

- Branches antigas, PRs antigos, versões 5.22/5.24/5.25 e números de suíte
  registrados nos relatórios são contexto histórico.
- Links GitHack/raw.githack registrados em diários antigos não são atuais.
- Valores do dump antigo não ligam produção, não definem automaticamente
  tributação e não autorizam migração.
- Textos de marketing, integrações antigas, boletos, SMS, loja online e NFS-e
  não devem ser reativados só porque aparecem em um relatório.
- Fotos, vídeos e anexos são evidência de referência; só viram implementação
  depois de conferência e pedido/autoridade do usuário.
- Documentação upstream em `vendor/acorn` e `vendor/node-forge` descreve as
  dependências e não acrescenta regras do produto DIGICOPY.

## 16. Fontes consolidadas

Este documento consolidou regras e decisões encontradas em:

- `REGRAS_PERMANENTES.md`;
- `BUILD_EXE.md`;
- `MAPEAMENTO_SISTEMA_ANTIGO.md`;
- `RELATORIO_SESSAO.md`;
- `RELATORIO_COMPLETO.md`;
- `RELATORIO_ANDAMENTO_AUTOMACOES_TRIGGERS.md`;
- `cloudflare-worker/README.md`;
- `cloudflare-contador/README.md`;
- `ETIQUETA_TODO.md`, apenas nas pendências de escopo;
- fontes e testes atuais, usados para separar regra viva de histórico.

Se uma regra importante estiver faltando, ela deve ser acrescentada aqui com a
origem, data e escopo, em vez de ficar perdida no meio de um diário.
