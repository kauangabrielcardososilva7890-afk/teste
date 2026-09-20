# REGRAS PERMANENTES DO DONO

> Este é o documento canônico das regras confirmadas para o DIGICOPY.
>
> **Importante:** este arquivo não é uma cópia de relatórios, testes ou do
> código. Uma observação histórica, um detalhe de uma implementação, um patch,
> uma versão, um número de testes ou uma decisão pontual não vira regra só por
> aparecer em algum arquivo. O número dos itens abaixo serve apenas para
> organização: são regras consolidadas, não 134 ordens diferentes.
>
> Quando houver conflito, conferir nesta ordem: pedido mais recente e explícito
> do dono → código e configuração atuais → testes atuais → documentação do
> projeto → histórico.

## 1. Trabalho e comunicação

1. Conferir código, fatos e evidências antes de concordar ou implementar. Se uma
   afirmação estiver errada ou incompleta, explicar com prova antes de agir.
2. Antes de responder que algo chegou, não chegou, existe ou não existe, varrer os
   arquivos relevantes, especialmente `RELATORIO_SESSAO.md`,
   `MAPEAMENTO_SISTEMA_ANTIGO.md` e o histórico Git.
3. Antes de entregar uma alteração, avaliar o efeito nas telas, módulos, fluxos,
   APIs, build, mobile e testes relacionados. Não corrigir só o primeiro ponto
   encontrado quando o mesmo comportamento existir em outros lugares.
4. Perguntar antes de codar quando houver ambiguidade real. Não inventar uma
   interpretação própria.
5. Responder em português simples, direto e sem tom condescendente.
6. Quando o dono passar algo para fazer, implementar, salvo quando ele disser que
   é somente para anotar, guardar ou registrar.
7. Relatórios devem separar **CORREÇÕES** e **ADIÇÕES**. Resultados de teste devem
   ser apresentados na conversa ou em HTML/TXT previsto, sem exigir que o dono
   preencha um Markdown.
8. Após cada atualização entregue, informar o link do site para teste e o ZIP da
   branch atual. Em repositório privado, avisar que o ZIP exige autenticação.

## 2. Organização do código e desempenho

9. Manter um arquivo por módulo e corrigir o módulo vivo; não copiar um arquivo
   inteiro para criar uma segunda versão da mesma função.
10. Criar arquivo novo somente quando houver função ou módulo realmente novo.
   Não transformar cada funcionalidade em um arquivão nem deixar código duplicado
   por precaução.
11. Antes de remover código aparentemente morto, conferir o arquivo inteiro,
    listeners, atalhos e dependências, provar que está morto e testar antes e
    depois. Poda em lote exige autorização quando for uma limpeza planejada.
12. O foco é o sistema de PC e os computadores são fracos. Toda mudança deve
    preservar ou melhorar leitura, memória, renderização, rede e responsividade.
    Não duplicar scripts, listeners, timers, consultas ou trabalho de tela; não
    usar polling curto para recriar telas ou consultar a nuvem.
13. Buscas e listagens pesadas devem ser acionadas por Enter, lupa, filtro ou
    pedido explícito de mostrar tudo, e não a cada tecla. Preservar texto, foco,
    seleção e dados enquanto o usuário digita.
14. O Buscador Escola não deve ser deletado e só pode trabalhar enquanto sua aba
    estiver aberta; não fazer login, busca, gravação ou sincronização invisível
    em outra tela.
15. Códigos internos, códigos novos e etiquetas devem ser numéricos, sem prefixo,
    letras ou ano, salvo chave técnica separada exigida por integração.

## 3. Interface e navegação

16. Nunca usar `prompt`, `confirm` ou `alert` nativos do navegador. Confirmações,
    erros e decisões devem usar popup/modal próprio do sistema, com X e foco
    correto.
17. Nenhum botão pode ficar morto ou silencioso. O erro deve informar o motivo e
    preservar os dados digitados quando possível. O visual deve respeitar o
    padrão do sistema nos modos claro e escuro.
18. O Menu Fiscal deve ser um menu real da barra superior, com submenu próprio,
    seguindo o visual do sistema. Não substituir a navegação por protótipo
    flutuante sem pedido específico.

## 4. Segurança, fiscal e permissões

19. Nunca colocar senha, token, CSC, certificado, chave de API, cookie, dump
    sensível ou dado real desnecessário em código, commit, relatório, teste,
    bundle ou HTML público. Nunca pedir essas credenciais pelo chat.
20. A senha do certificado só pode ser informada no momento da operação e nunca
    deve ser salva. O CSC antigo foi descartado e não pode ser recuperado ou
    reutilizado.
21. Manter as proteções atuais do Electron e da ponte entre processos; não expor
    APIs, credenciais ou dados pessoais sem necessidade. Mensagens de erro não
    devem vazar segredos.
22. Fiscal começa em homologação. Nada emite nota sozinho por timer ou em segundo
    plano; produção exige a palavra `PRODUCAO`, permissão, ação manual, senha na
    hora e auditoria. Homologação/prévia deve exibir `NOTA DE TESTE, SEM VALOR
    FISCAL`.
23. Ações fiscais relevantes e tentativas negadas devem ser auditadas. Nota
    autorizada não deve ser editada ou apagada como se fosse rascunho; seguir o
    fluxo fiscal correto.
24. Caixas de permissão só podem ser alteradas pelos perfis autorizados. O bloqueio
    deve existir no executor real, não apenas escondendo botão, e a tentativa
    negada deve ir para Auditoria. Padrões novos não podem bloquear usuários
    existentes sem decisão explícita.

## 5. Sessão, sincronização e preservação de dados

25. Cura automática não pode chutar: só carimbar quando houver exatamente uma
    empresa válida; com duas ou mais, orientar novo login. Não confundir usuário,
    aparelho, perfil e empresa da sessão.
26. Login, sincronização, atualização, migração e recuperação não podem apagar
    dados automaticamente. Pull incompleto, queda de internet ou conflito não
    pode descartar alteração local em silêncio.
27. Reset da nuvem, limpeza em massa, exclusão definitiva e qualquer operação
    destrutiva exigem confirmação explícita e backup/conferência prévios quando
    aplicável. Preservar clientes, vendas, contratos, estoque, configurações,
    histórico e valores antigos.
28. A sincronização deve continuar local-first, incremental e coerente com a
    configuração atual. Não substituir a base inteira nem instalar atualização
    automaticamente fora do fluxo autorizado.
29. Orçamentos, vendas, títulos, estoque, leituras, chamados e históricos devem
    manter status, origem e rastreabilidade. Extorno não é exclusão simples; Pix
    não confirma pagamento sozinho quando o fluxo exige comprovante ou ação
    manual.

## 6. Migração, build e entrega

30. Migração do sistema antigo só começa quando for solicitada. Antes de gravar,
    apresentar mapa de campos e prévia; manter os arquivos originais no PC do
    dono; não migrar senhas, segredos, lixo operacional ou dados sem confirmação.
31. O dump antigo é referência para investigação, não autorização para copiar
    visual, marca, identidade, credencial, tributação ou regra sem conferência.
32. A versão efetiva deve ser conferida nas fontes atuais. Mudança de código deve
    manter `package.json`, manifesto, bundle, build, documentação e cópia mobile
    coerentes, respeitando a régua de versão vigente.
33. Gerar o bundle pelo processo oficial, sincronizar os arquivos derivados e
    validar referências antes de entregar. Não editar manualmente manifesto ou
    listas geradas, nem carregar duas vezes um script já presente no bundle.
34. O fluxo de build deve limpar, sincronizar, gerar bundle, empacotar e verificar.
    Não gerar nem commitar ZIP novo; o download deve usar o ZIP da branch do
    GitHub.
35. O APK/mobile permanece pausado até autorização nova. Só sincronizar
    `mobile/www` quando uma origem que ele consome mudar, para não quebrar a
    coerência do projeto; não evoluir a frente mobile.
36. Antes de entregar, executar os checks aplicáveis, incluindo `npm run check`,
    `npm test`, `npm run sync:check`, validação do bundle/arquivos, testes do
    Worker e validação mobile quando houver impacto. Não esconder teste falhando;
    separar falha de infraestrutura de falha do produto.
37. O PR deve permanecer na branch da sessão e ter `main` como base, salvo pedido
    explícito diferente. Não fazer merge, deploy de produção, reset ou outra
    publicação destrutiva sem confirmação humana explícita.

## 7. Escopo congelado e histórico

38. Mobile/APK continua pausado até autorização nova; migração e NFC-e 65 só
    avançam quando os pré-requisitos e a autorização forem confirmados.
39. Fila, roadmap, versões antigas, nomes de patches, hashes, contagens de
    testes, branches antigas, PRs antigos, links antigos e descrições de
    correções já executadas são histórico ou pendência, não novas regras
    permanentes.
40. Quando uma nova regra for realmente confirmada, acrescentá-la aqui com sua
    origem e escopo. Não transformar automaticamente anotações de atualização,
    decisões pontuais ou detalhes de implementação em regra.

## Checklist obrigatória antes de programar

Antes de começar a programar, responder as 24 perguntas abaixo. A resposta deve
ser feita na análise da tarefa; quando alguma resposta mostrar falta de
informação ou ambiguidade, perguntar ao dono antes de continuar. Não é para
fingir que está tudo certo nem para fazer as perguntas ao dono quando elas
puderem ser verificadas no código, nos fatos ou nos testes.

1. Tenho todas as informações necessárias?
2. Entendi exatamente o que o usuário quer?
3. Preciso perguntar algo antes de continuar?
4. O que o usuário informou está correto?
5. Estou fazendo alguma suposição?
6. Posso estar passando alguma informação errada?
7. Esse código já existe em algum arquivo?
8. Existe alguma função que já faz isso?
9. Esse código depende de outro código?
10. Essa alteração pode quebrar alguma coisa?
11. Essa alteração pode afetar outra função?
12. Estou duplicando código desnecessariamente?
13. Existe código desnecessário?
14. Posso simplificar esse código?
15. Posso fazer isso em uma linha?
16. Posso reduzir a quantidade de linhas sem perder clareza?
17. Posso otimizar esse código sem alterar seu funcionamento?
18. Estou mantendo o padrão do projeto?
19. Estou alterando algo que não precisava ser alterado?
20. Depois da alteração, tudo continuará funcionando?
21. Preciso testar alguma parte antes de finalizar?
22. Existe uma solução mais simples e segura?
23. Essa minha ação irá quebrar alguma coisa no sistema?
24. Existe algum método que posso testar antes de realizar tal coisa?

## O que foi conferido

A consolidação foi comparada com a versão anterior de `REGRAS_PERMANENTES.md`,
com os relatórios e com o documento de regras criado nesta sessão. A versão
anterior explicitamente numerava 16 regras de trabalho/produto e mantinha as
orientações sobre implementação e conferência em duas seções adicionais; não
havia 134 ordens permanentes dadas pelo dono.

Os relatórios, o código e os testes continuam sendo fontes de evidência para
resolver tarefas, mas não aumentam este documento automaticamente.
