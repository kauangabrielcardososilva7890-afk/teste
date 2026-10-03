# RELATÓRIO — auditoria técnica independente de `pr-47`

Auditoria somente leitura, baseada no código e nas instruções atuais do repositório. Não consultei relatórios de auditorias anteriores. O Git estava limpo em `pr-47` antes e depois da inspeção. Não executei testes automatizados: o runner pode criar dependências ou artefatos no projeto, e os relatórios do Playwright são gravados no repositório.

## RESUMO EXECUTIVO

**4 itens:** 2 `CONFIRMADOS`, 1 `NÃO CONFIRMADO` e 1 `FALSO POSITIVO`.

Entre os achados confirmados, há 1 de gravidade **ALTA** e 1 **MÉDIA**. Não encontrei falha crítica confirmada.

A arquitetura tem frontend JavaScript carregado em camadas conforme `bundle-manifest.json`, persistência local com sincronização incremental, API Cloudflare Worker/D1, app desktop Electron e builds mobile. Os perfis de produto compartilham grande parte do código da aplicação; o Gerente é um executável separado. A ordem das camadas importa porque patches posteriores substituem funções anteriores.

## ACHADOS CRÍTICOS E ALTOS

### AUD-001 — A criação de leitura pelo menu geral contorna a regra de uma leitura aberta por contrato

**Classificação:** CONFIRMADO
**Gravidade:** ALTA

**Local:** `ajustes_v52436_leitura_uma_aberta_patch.js:58`; `contratos_leituras_definitivo_patch.js:120`.

**Evidência e causa:** o patch de controle intercepta `novaLeituraContrato`, `criarLeituraDetalhada` e `criarLeituraDefinitiva`, esperando receber o ID do contrato como argumento. Porém, a tela geral chama `criarLeituraDefinitiva()` sem argumento, após guardar o contrato em uma variável interna. A verificação retorna sem encontrar contrato e a função original cria a leitura normalmente. A navegação do contrato usa outro caminho: `novaLeituraContrato(contratoId)`, que recebe o argumento e passa pelo bloqueio.

**Comportamento atual:** a regra de uma leitura aberta pode ser contornada pela tela geral “Leituras → Nova leitura”. A nova leitura é anexada ao mesmo `contratoId`, mesmo já existindo outra leitura não faturada.

**Comportamento esperado:** todos os caminhos de criação devem validar o contrato selecionado contra leituras abertas antes de gravar.

**Impacto:** duas leituras abertas podem registrar contadores para a mesma situação. Se ambas forem faturadas, podem gerar cobranças separadas. A gravidade alta considera o risco financeiro e o caminho reproduzível pelo código; não confirma que isso ocorreu em dados reais.

**Variantes afetadas:** Particular + Nuvem EXE/APK; Comercial + Nuvem EXE/APK; Comercial Local EXE/APK. A regra e as funções são compartilhadas. Não se aplica ao Gerente EXE, que é outro produto.

**Dependências:** `renderLeituras` → `novaLeituraDefinitiva` → `criarLeituraDefinitiva`; proteção em `ajustes_v52436_leitura_uma_aberta_patch.js`.

**Reprodução estática:** criar uma leitura aberta em um contrato; abrir a tela geral de Leituras; iniciar Nova leitura, escolher o mesmo contrato e confirmar. O caminho do contrato e o caminho da tela geral não têm a mesma proteção efetiva.

**Teste recomendado:** teste de integração que tente criar uma segunda leitura aberta para o mesmo contrato por cada caminho disponível; todos devem bloquear a criação e identificar a leitura existente.

**Correção recomendada:** validar pelo contrato efetivamente selecionado no momento da criação, sem depender de um argumento que esse caminho não fornece, e centralizar a regra para todos os criadores.

## FLUXO DE LEITURAS / FATURAMENTO / ESTORNO

### Fluxo encontrado

O caminho de contrato usa `abrirLeiturasContrato`, `novaLeituraContrato`, `abrirLancamentoContador` e `salvarLancamentoContador` em `fluxo_contrato_leitura_corrigido_patch.js`. A listagem do contrato filtra por `contratoId` e ordena por `dataLeitura` ou `criadoEm`, em ordem decrescente. A tela geral tem outro criador e outro formato de tela em `contratos_leituras_definitivo_patch.js`.

No fluxo de contrato, salvar um lançamento calcula o anterior usando o contador atual do parque, grava o novo valor no parque e acrescenta um item a `l.itens`. Faturar cria ou atualiza uma conta a receber relacionada por `leituraId` e marca a leitura como `faturado`. O patch de estorno marca a leitura como `estornada` e as contas relacionadas como `estornado`; não apaga os itens nem restaura diretamente o contador do parque.

A regra de uma leitura aberta considera aberta qualquer leitura do formato novo cujo status não seja `faturado`, incluindo `estornada`. Essa regra é consistente com a intenção documentada no próprio patch, mas o caminho alternativo de criação descrito no **AUD-001** a contorna.

### Causa do contador anterior

O patch `ajustes_v52436_leitura_uma_aberta_patch.js` identifica como causa o cálculo do contador anterior a partir do parque, em vez do valor congelado no item. Entretanto, no código atual, a tentativa de edição descrita não está implementada no fluxo ativo:

- A tela de detalhe do fluxo de contrato lista os itens, mas não contém botão de lápis nem campo de edição.
- A busca por `lan-edit-idx` encontra apenas o wrapper desse patch; não há código atual que crie esse campo.
- O wrapper tenta restaurar o contador anterior e então chama o salvamento original. Esse salvamento procura um medidor ainda pendente; como o item já existe, o medidor não é pendente e a função retorna sem substituir o item.

Assim, **não consegui confirmar que a lista atual exibe o contador faturado depois da edição**, pois a edição descrita não pode ser percorrida no fluxo que o código atual apresenta. O problema relatado pode depender de dados, build ou interface externa ao caminho encontrado. O que está confirmado é que a implementação atual não fornece a edição descrita e que o wrapper não a completa sozinho.

**A hipótese “só criar nova leitura quando a atual estiver fechada” é parcialmente suportada:** o patch tenta impor uma leitura não faturada por contrato e trata estorno como leitura ainda aberta. Mas ela não basta para evitar duplicatas, porque o criador pela tela geral contorna a proteção. Portanto, não é uma solução confirmada para o problema do contador.

### Outros caminhos de criação

Além do botão “Novo” no histórico do contrato, `novaLeituraDefinitiva` → `criarLeituraDefinitiva` cria leituras na tela geral. O código-base em `app.js` conserva funções legadas de leitura rápida, edição de leitura antiga e geração de faturas pendentes, mas a interface atual de Leituras é substituída pelas camadas de contratos. Sem executar a interface, não confirmei que esses caminhos legados estejam alcançáveis na navegação atual; por isso, não os classifico como defeitos ativos.

## PROBLEMA `&gt`

**Classificação do item:** `NÃO CONFIRMADO` para dados exibidos como texto literal; `FALSO POSITIVO` para entidades presentes em templates HTML.

A busca nos arquivos-fonte não encontrou ocorrências de `&gt`. A string aparece no bundle gerado em textos como “Config &gt; Tributação”. Nesse contexto, ela está dentro de HTML inserido no DOM e o navegador interpreta a entidade como `>`; isso, por si só, não confirma defeito visual nem escape duplo.

Não encontrei evidência no código-fonte de que o backend ou a serialização transformem `>` em `&gt`. O Worker recebe JSON e persiste `data_json`; a conversão pode ocorrer em dados já gravados, importados ou fornecidos por serviço externo. Também não tive acesso aos registros reais nem à produção para verificar esse conteúdo. Se um campo armazenar literalmente `&gt`, a renderização que escapa novamente o `&` pode exibir essa sequência como texto, mas a origem desse valor não está confirmada.

**Variantes afetadas:** os templates citados são compartilhados pelo bundle da aplicação; o defeito com dados específicos não pôde ser atribuído a uma variante.

## SEGURANÇA

Não confirmei vulnerabilidade crítica ou alta na inspeção estática. O Electron configura `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` e `webSecurity: true`; a ponte usa `contextBridge`. O código do Worker usa consultas preparadas para os acessos D1 examinados, mantém hashes de tokens e contém autenticação e controles administrativos. Isso não substitui uma avaliação de produção nem confirma a configuração dos segredos no painel Cloudflare.

Não consegui confirmar configuração operacional de Cloudflare, credenciais, permissões reais, dados de produção ou dependências instaladas e atualizadas no ambiente. A auditoria não fez análise dinâmica de injeção, teste de penetração ou inspeção do tráfego externo.

## PERFORMANCE

Não encontrei, nesta inspeção estática, gargalo único que justifique um achado confirmado. O projeto tem muitas camadas e redefinições de funções globais: isso aumenta o custo de rastrear qual implementação está ativa, mas a arquitetura de patches é deliberada e o manifesto define uma ordem de carregamento. Sem perfil de execução, não classifico isso como defeito de desempenho.

## ARQUITETURA / MANUTENIBILIDADE

A coexistência de formatos de leitura (legado por parque e formato novo com `itens`) e de mais de um criador dificulta garantir que regras de estado se apliquem a todos os caminhos. O bypass documentado no AUD-001 é uma consequência concreta dessa dispersão. A consolidação da regra de criação e do ciclo de vida é uma melhoria recomendada, não um achado adicional.

## TESTES

Há testes Node consolidados, testes históricos, testes E2E Playwright e script de integração do Worker. A busca nos testes não encontrou cobertura do ciclo leitura → faturamento → estorno → edição de contador, nem do bloqueio de múltiplas leituras abertas.

**Teste de regressão recomendado:** criar leitura e lançamento; faturar; estornar; editar contador; salvar; verificar valores anterior/atual, total da leitura e contador vigente do parque; voltar à lista e confirmar os dados mostrados. O caso deve verificar também que existe uma única conta a receber relacionada e que estorno/re-faturamento atualiza essa mesma conta.

**Outro teste necessário:** tentar criar outra leitura aberta pelo histórico do contrato e pela tela geral; validar bloqueio em ambos. Rodar os testes existentes e Playwright exigiria avaliar e limpar artefatos gerados; não executei essas verificações nesta auditoria.

## MELHORIAS

- Centralizar os criadores de leitura e a validação de “uma aberta por contrato”.
- Implementar e testar explicitamente a edição de item após estorno, incluindo atualização do parque, do item e do total.
- Acrescentar testes automatizados de estados intermediários, reentrada e repetição do faturamento.
- Documentar quais formatos legados continuam acessíveis e quais são apenas compatibilidade de dados.

## ITENS NÃO CONFIRMADOS

- A origem do `&gt` literal em dados exibidos: não há acesso aos dados reais ou ao ambiente remoto.
- A reprodução exata do contador “anterior” apresentado após edição: o caminho de edição descrito não aparece na implementação ativa inspecionada.
- Comportamento e integridade do D1/Cloudflare em produção, configuração de segredos, estado das migrações e sincronização entre aparelhos.
- Funcionamento real de EXE/APK e diferenças de ambiente/dispositivo: não foram construídos nem executados.

## FALSOS POSITIVOS

- `&gt;` em texto dentro de template HTML, como “Config &gt; Tributação”, é interpretado pelo navegador como `>`; a ocorrência no bundle não prova erro visual.
- Os patches e arquivos com nomes semelhantes não são duplicação descartável por si só: o manifesto os carrega em ordem, e as camadas posteriores substituem ou complementam funções.

## RECOMENDAÇÃO DE PRÓXIMOS PASSOS

1. Corrigir a proteção da criação para validar o contrato selecionado em todos os caminhos.
2. Especificar e implementar a edição pós-estorno como operação que atualize o item existente, recalcule totais e mantenha o contador coerente.
3. Adicionar os testes de regressão listados antes de alterar a lógica financeira.
4. Com acesso autorizado ao ambiente, verificar uma amostra de dado que apareça como `&gt`, distinguindo conteúdo armazenado de saída renderizada.
5. Executar a suíte, os testes Worker e os fluxos E2E em ambiente controlado, registrando separadamente falhas de infraestrutura e de produto.
