# REGRAS PERMANENTES DO DONO

> Documento canônico das regras que devem ser seguidas em toda tarefa do
> DIGICOPY. Consolidado em 20/09/2026 a partir das regras explícitas dos
> relatórios, do guia de build, do mapa de migração, dos READMEs operacionais,
> do código e dos testes.
>
> **Importante:** nem tudo que aparece nos relatórios é regra. A seção 12 separa
> decisões normativas de fatos históricos de atualizações. Versões, nomes de
> patches, contagens de testes, branches antigas, PRs antigos e descrições de
> correções realizadas não viram regra só porque foram registrados.
>
> Quando houver conflito, usar esta ordem: pedido mais recente e explícito do
> usuário → código atualmente vivo → testes atuais → `package.json` e manifesto
> → histórico dos relatórios.

## 1. Método de trabalho

1. Conferir código, fatos e evidências antes de concordar ou implementar.
2. Se o pedido ou a afirmação estiver errado/incompleto, explicar com prova antes
   de agir; nunca concordar automaticamente.
3. Antes de afirmar que algo chegou, não chegou, existe ou não existe, varrer os
   arquivos relevantes, especialmente `RELATORIO_SESSAO.md`,
   `MAPEAMENTO_SISTEMA_ANTIGO.md` e o histórico Git.
4. Antes de codar, conferir mentalmente: se o código precisa existir; se já existe
   função viva; se a linguagem resolve nativamente; se há solução mais simples;
   se o arquivo novo é necessário; se entendi o pedido; se vai funcionar nos
   ambientes envolvidos; se pode causar bug, travamento, duplicação ou perda de
   dados; se tenho contexto suficiente; se devo perguntar antes; se a
   documentação ficará completa; e se estou fazendo exatamente o solicitado.
5. Perguntar antes de codar quando houver ambiguidade real. Não inventar uma
   interpretação própria; propor alternativas antes de implementar.
6. Varrer os efeitos relacionados em telas, módulos, APIs, build, mobile e testes
   antes de entregar uma alteração.
7. Responder em português simples, direto e sem tom condescendente.
8. Em cada tarefa de desenvolvimento, permanecer na branch fixa da sessão. O PR
   deve ter como base `main`, salvo decisão explícita diferente, e não deve ser
   mesclado sem confirmação humana explícita.
9. Não trocar de branch, criar outra branch ou publicar em branch diferente da
   branch fixa da sessão.

## 2. Organização do código

10. Manter um arquivo por módulo e separar funcionalidades por módulo.
11. Correção deve editar o módulo vivo existente; não copiar o arquivo inteiro
    para criar uma segunda versão.
12. Criar arquivo novo somente quando a função/módulo ainda não existir ou quando
    houver um módulo realmente novo.
13. Funcionalidade nova não deve virar um arquivão misturando assuntos.
14. Antes de remover código aparentemente morto, ler o arquivo inteiro, conferir
    listeners, atalhos, cadeia de funções e dependências, provar que está morto e
    executar os testes antes/depois. Remoções em lote exigem aprovação quando
    forem uma poda planejada.
15. Não deixar código duplicado por precaução. O Git guarda o histórico.
16. Não usar o nome do sistema antigo nem nome pessoal do usuário em arquivos,
    módulos ou identificadores novos.
17. Códigos internos, códigos novos e etiquetas devem ser somente numéricos,
    sem prefixo, letras ou ano, salvo chave técnica separada exigida por uma
    integração.

## 3. Desempenho e telas

18. O foco é o sistema de PC; os computadores são fracos. Toda mudança deve
    reduzir ou preservar leitura, parse, memória, renderização e rede.
19. Não duplicar scripts, listeners, timers, consultas ou trabalho de tela.
20. Não usar polling curto, especialmente `setInterval` de 2–4 segundos recriando
    telas ou consultando a nuvem.
21. Timer que mexe no DOM ou acessa rede deve respeitar `document.hidden` e a tela
    relevante; tela fechada não faz trabalho pesado.
22. O Buscador Escola só atualiza enquanto a aba dele estiver aberta. Fora dela,
    não deve fazer login, busca, gravação ou sincronização invisível.
23. Busca pesada não filtra a cada tecla: usar Enter, lupa ou filtro explícito.
    Exceção somente quando for uma decisão específica, documentada e testada.
24. Não usar barra A–Z como mecanismo de listagem.
25. Listagens grandes devem iniciar leves e só carregar tudo após pesquisa, filtro
    ou pedido explícito de mostrar todos.
26. Não renderizar novamente o campo enquanto o usuário digita. Preservar texto,
    foco, seleção e dados do formulário em falhas e transições.
27. Nenhuma ação de erro pode ficar muda: mostrar motivo, preservar dados quando
    possível e registrar erro legível em `erro.txt` sem entrar em loop.

## 4. Interface, popups e navegação

28. Nunca usar `prompt`, `confirm` ou `alert` nativos do navegador.
29. Toda confirmação, erro ou decisão deve usar popup/modal próprio do sistema,
    com botão X e, quando aplicável, fechamento por ESC.
30. Popup deve ficar na frente da tela e ter foco/z-index correto.
31. Ao fechar modal/aba interna por X ou ESC, voltar à aba anterior quando houver
    pilha de navegação, sem fechar a aplicação inteira.
32. Nenhum botão pode ficar morto ou silencioso. Erros devem indicar o que houve
    e como continuar.
33. O visual deve respeitar o padrão do sistema em modo claro e escuro.
34. O Menu Fiscal deve ser um menu real na barra superior, com submenu próprio;
    não um overlay ou conteúdo fiscal flutuando dentro da tela.
35. Os seis itens fiscais oficiais devem permanecer no submenu do Fiscal mesmo
    quando os menus forem reconstruídos.
36. O menu Backup deve abrir a aba normal de Backup e nunca baixar arquivo por
    engano. Exportação dentro de uma tela só baixa quando a ação for explícita.
37. Não alterar uma interface para outro estilo/protótipo sem pedido específico;
    manter a linguagem visual do sistema já existente.

## 5. Segurança e credenciais

38. Nunca colocar em código, commit, relatório, teste, bundle, HTML público,
    `.env` versionado ou documentação: tokens, senhas, CSC, senha de certificado,
    chaves de API, cookies, `.pfx`, dumps sensíveis ou dados reais desnecessários.
39. Nunca pedir senha, token, CSC ou certificado pelo chat. A credencial deve ser
    digitada no fluxo próprio e seguro do sistema.
40. Se uma credencial for colada em chat, terminal compartilhado ou arquivo
    indevido, tratá-la como exposta: revogar/rotacionar antes de reutilizar.
41. O CSC do dump antigo foi descartado. Não copiar, recuperar ou reutilizar esse
    CSC; quando NFC-e for ativada, o dono gera/confere o CSC na SEFAZ-MG e o
    informa diretamente na Central Fiscal.
42. A senha do certificado nunca fica salva em código, banco, nuvem, relatório ou
    commit. Pedir somente no momento de validar, assinar ou transmitir.
43. Credenciais do Buscador Escola só podem ser informadas dentro do sistema, em
    configuração controlada; nunca registrar senha real no código ou relatório.
44. Identificador público de conta/banco não é token. Tokens Cloudflare ficam em
    Secret/cofre e nunca no app, PC, GitHub ou commit.
45. APIs Electron devem ser expostas pela ponte única (`__digicopyPontes`), não
    diretamente com o nome final no `contextBridge`.
46. Preservar `contextIsolation`, sandbox, `nodeIntegration: false`, webSecurity,
    lista branca de URLs externas e bloqueios de DevTools do código atual.
47. Mensagens de erro não devem vazar senha, token, certificado ou dados pessoais.
48. Credenciais de teste devem ser claramente fictícias e restritas ao teste;
    nunca deixar senha de demonstração como padrão de produção.

## 6. Fiscal

49. Homologação é sempre o primeiro ambiente.
50. Produção só pode ser liberada com a palavra `PRODUCAO` digitada, permissão
    adequada e auditoria.
51. Nada emite nota automaticamente ao finalizar venda, por timer ou em segundo
    plano. Emissão exige ação manual, permissão e senha do certificado na hora.
52. Ações fiscais relevantes devem ser auditadas: assinatura, transmissão,
    cancelamento, inutilização, manifestação, CC-e, consulta e tentativas negadas.
53. Homologação e prévias devem deixar claro `NOTA DE TESTE, SEM VALOR FISCAL`.
54. Sem ponte Electron, certificado ou resposta real da SEFAZ, nunca mostrar
    sucesso falso; explicar a limitação e manter o estado como não gerado/pendente.
55. Nota autorizada não pode ser editada ou excluída; orientar CC-e,
    cancelamento ou clonagem conforme o caso.
56. Excluir rascunho, gerar nota, manifestar e inutilizar exigem a permissão
    fiscal correspondente. Bloqueio deve existir no executor, não apenas no botão.
57. CC-e deve validar texto, exigir confirmação extra em produção, respeitar
    sequência, guardar XML, manter histórico e auditar.
58. Testar serviço da SEFAZ deve usar assinatura na hora, senha não salva e
    resposta real; sem ponte, mostrar instrução, nunca sucesso fabricado.
59. Pacote mensal do contador deve conter os XMLs/eventos do mês escolhido;
    mês vazio gera aviso e não inventa arquivo.
60. NF-e modelo 55 vem antes de NFC-e modelo 65. NFC-e só avança com CSC real e
    fluxo confirmado.
61. Valores do dump antigo não ligam produção nem definem tributação sozinhos.
    NCM, CRT, CSOSN, série, frete e texto legal devem ser conferidos.
62. NCM/CEST de referência não devem virar cadastro comercial automaticamente.
    Texto do Simples nasce vazio e só entra quando preenchido e permitido.

## 7. Permissões, sessão e dados

63. Caixas de permissão só podem ser vistas/alteradas pelos perfis autorizados
    pelo módulo, normalmente Admin/Dono; mudanças devem ser auditadas.
64. Padrões não devem travar usuários existentes. A permissão deve ser conferida
    no executor real de excluir/estornar/emitir, não apenas escondendo botão.
65. Tentativa negada deve gerar popup próprio e trilha em Auditoria.
66. Não permitir autoexclusão do último Admin/Dono nem deixar a configuração
    trancar todos os administradores.
67. Cura automática de empresa/sessão só pode carimbar quando houver exatamente
    uma empresa válida. Com duas ou mais, orientar relogar; nunca chutar.
68. Não confundir autorização do aparelho, usuário logado, perfil e empresa da
    sessão. Diagnosticar cada camada antes de afirmar que dado sumiu.
69. Pull inicial incompleto ou internet caída não pode apagar sobras locais.
    Só reconciliar depois de confirmar que o pull terminou completo.
70. Conflito de sincronização não pode descartar edição local em silêncio;
    aplicar a versão correta, reenviar a intenção quando seguro e avisar conflito.
71. Não apagar dados automaticamente durante atualização, login, cura, migração,
    sincronização ou troca de versão.
72. Reset da nuvem exige ação explícita, frase exata, condição de segurança e
    backup completo anterior; se o backup falhar, o reset não acontece.
73. Exclusão definitiva deve ser diferenciada de exclusão reversível/histórica,
    ter confirmação própria e nunca remover histórico por efeito colateral.

## 8. Regras funcionais do produto

74. Extorno marca o registro e preserva o histórico; não apagar simplesmente a
    venda ou o título financeiro.
75. Extorno de venda deve tratar financeiro, estoque e reabertura sem duplicar
    baixa/devolução. Conferir o caixa quando houver pagamento recebido.
76. Títulos extornados ficam identificados e fora das somas de aberto, recebido e
    vencido.
77. Pix não faz baixa automática no fluxo que exige comprovante/ação manual;
    preservar histórico e não inventar confirmação de pagamento.
78. Não criar venda automaticamente durante migração, importação ou conversão
    sem conferência explícita.
79. Orçamento aprovado, recusado, vendido ou excluído deve manter status e origem;
    não pode sumir por sincronização ou exclusão local indevida.
80. Importação não pode sobrescrever cadastro manual. Deduplicar pela prioridade
    definida e apenas completar campos vazios quando essa for a regra.
81. Não apagar movimentações, estoque, histórico de insumos ou valores antigos
    automaticamente; limpeza em massa exige confirmação explícita.
82. Impressoras de locação pertencem ao contrato/parque, não ao menu Produtos.
    Modalidades ficam na impressora do contrato, não no contrato geral.
83. Fluxo de leitura é contrato → impressora → medidor ativo → lançamento.
    Remanejadas ficam como histórico e não recebem leitura nova.
84. Não deixar duas leituras do mesmo fluxo abertas quando o módulo exigir uma.
85. Exclusão de chamado ligado a contrato deve avisar que também afeta a lista do
    contrato; chamado avulso deve avisar que a exclusão é definitiva.
86. Relatórios e RTF usam os campos reais mapeados; só fica vazio o que realmente
    não existir no cadastro. Nunca inventar dado.
87. Dados de demonstração, textos de marketing, promoção antiga, boleto, SMS,
    loja online, NFS-e e agenda não devem ser reativados só porque aparecem no
    sistema antigo ou em relatório histórico.

## 9. Migração do sistema antigo

88. Migração só começa quando solicitada explicitamente.
89. O dump antigo é mapa de referência, não verdade para copiar cegamente.
90. Migrar dentro do aplicativo e manter arquivos originais no PC do dono;
    arquivos grandes, especialmente acima de 130 MB, não entram no repositório.
91. Sempre apresentar mapa de campos e prévia antes de gravar.
92. Ordem de migração: núcleo, referências fiscais, operação/histórico por lotes.
93. Não ler senha, segredo, CSC ou certificado do sistema antigo.
94. Não migrar lixo operacional, cache ou integração antiga sem decisão específica.
95. Não copiar visual, marca, nome, código ou identidade do sistema antigo;
    extrair somente regra de negócio confirmada.
96. Havendo dúvida sobre tabela, OS, visita ou destino, parar na prévia e
    perguntar; nunca chutar.

## 10. Nuvem, backups e atualizações

97. A nuvem é local-first e incremental; nenhuma rota substitui a base inteira
    fora do fluxo explícito de reset.
98. Mutação deve ser versionada, idempotente, atribuída ao aparelho e protegida
    contra conflito.
99. Token de aparelho fica no D1 somente como hash; convite é único e expira.
100. Backups não são apagados sozinhos. Limpeza manual deve apagar somente
     backups, nunca dados do sistema.
101. Backup manual, diário, de atualização e de segurança devem respeitar o
     Worker atual, incluindo nome, pasta, compressão e retenção.
102. Backup de troca de versão deve registrar a versão anterior sem duplicar o
     mesmo nome.
103. Medidor oficial usa token somente leitura no worker; o sistema nunca recebe
     esse token nem usa cronômetro invisível para consumir cota.
104. O Gerente publica atualizações; o cliente decide quando baixar/instalar.
     Não instalar atualização automaticamente nos PCs dos clientes.
105. Portal, sininho, destino, expiração, histórico e `.exe` não podem expor
     release oculta nem destinatário indevido.
106. Atualização não pode apagar clientes, vendas, contratos, configurações ou
     históricos.

## 11. Build, versão, bundle, Electron e mobile

107. Confirmar a versão efetiva no `package.json`, fontes, manifesto e testes
     atuais; não confiar no número antigo de relatório.
108. Código alterado exige versão crescente. Manter `package.json`, lockfile,
     `index.html`, bundle, mobile e documentos coerentes.
109. Nenhum patch pode sobrescrever `window.DIGICOPY_APP_VERSION`; título e
     rodapé devem ler a global real.
110. Todo recurso carregado precisa existir e estar coberto por manifesto,
     `index.html`, bundle, build, validação e cópia mobile quando aplicável.
111. Gerar bundle com `build_bundle.js`; hash do bundle deve bater com o projeto e
     com o pacote.
112. A impressão digital do bundle deve invalidar cache de código quando houver
     mudança, sem apagar dados.
113. Build do `.exe` segue limpar → sincronizar → bundle → empacotar → verificar.
     Não entregar instalador incompleto.
114. Não editar `build.files` ou `scripts.check` manualmente; `sync_build.js`
     deriva os dois e falha para referência ausente.
115. Não adicionar tag de script para arquivo já presente no bundle.
116. `mobile/www` deve ser sincronizado quando a origem que ele consome mudar,
     mas o APK permanece pausado como frente funcional.
117. Não gerar nem commitar ZIP novo. Para baixar o projeto, usar o ZIP da branch
     no GitHub.
118. Nunca apagar dados ao limpar cache ou diagnosticar instalação; fazer backup
     antes e conferir rodapé/hash/pasta do instalador.

## 12. Testes, documentação e entrega

119. Antes de entregar código, executar os checks aplicáveis, especialmente:
     `npm run check`, `npm test`, `npm run sync:check`, bundle, validação de
     arquivos, `verify:files`/`verify:exe`, sincronização mobile, testes do
     Worker e E2E quando houver impacto.
120. Não entregar com teste falhando sem explicar e sem autorização. Separar falha
     de infraestrutura de falha do produto.
121. Testes devem derivar dados das fontes atuais; não usar lista fixa de últimos
     patches, limite arbitrário de arquivos, comentário histórico como fixture
     ou versão antiga específica.
122. Testar comportamento e definição viva, não apenas presença de texto.
123. Relatórios e testes devem separar `CORREÇÕES` e `ADIÇÕES`.
124. Entregas de teste devem ser coladas na conversa ou usar HTML/TXT previsto;
     não exigir que o usuário preencha um `.md`.
125. Toda atualização deve informar o que corrigiu, o que adicionou, testes,
     pendências e divergências encontradas.

## 13. Links oficiais

126. Toda atualização deve informar o Pages de teste, o ZIP da branch da sessão e
     o portal público de atualizações.
127. GitHack/raw.githack está obsoleto porque o repositório é privado; nunca
     oferecer como plano B.
128. O link do cliente deve ser derivado da branch configurada e conferido contra
     a branch real; nunca escrever branch antiga à mão.
129. Se o repositório for privado, avisar que o ZIP exige autenticação no GitHub.

## 14. Escopo congelado e fila

130. Mobile/APK está pausado até autorização nova.
131. Migração só quando solicitada.
132. NFC-e 65 só quando o CSC real e o fluxo forem confirmados.
133. NCM por tipo, texto legal, etiquetas A4, permissões restantes, links de
     cobrança e demais itens da fila só entram quando solicitados/autorizados.
134. Poda destrutiva, deploy de produção, reset de nuvem, migração e emissão
     fiscal exigem evidência, permissão e confirmação humana.

## 15. O que não é regra permanente

Os itens abaixo continuam nos relatórios como histórico, mas não devem ser
tratados como regras novas automaticamente:

- versão, quantidade de testes, número de scripts, hash de bundle e nome de patch
  de uma atualização específica;
- descrição de uma correção que já foi feita;
- branch, PR, commit e link antigo de uma sessão passada;
- protótipo visual que foi descartado;
- mensagem ou pedido pontual já substituído por decisão posterior;
- valores do dump antigo sem confirmação atual;
- README de dependência vendorizada;
- comandos de deploy que dependem de confirmação/credencial do dono;
- fila/roadmap que não foi solicitada para implementação.

## 16. Fontes conferidas

- `RELATORIO_SESSAO.md`;
- `RELATORIO_COMPLETO.md`;
- `RELATORIO_ANDAMENTO_AUTOMACOES_TRIGGERS.md`;
- `REGRAS_PERMANENTES.md` anterior;
- `BUILD_EXE.md`;
- `MAPEAMENTO_SISTEMA_ANTIGO.md`;
- `cloudflare-worker/README.md`;
- `cloudflare-contador/README.md`;
- fontes e testes atuais.

Quando uma regra nova for definida, acrescentá-la aqui com data/origem e escopo.
Não deixá-la perdida no meio de um diário.
