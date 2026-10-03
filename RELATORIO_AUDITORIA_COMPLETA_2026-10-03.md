# Relatório de auditoria completa — DigiCopy ERP v8.0.0

**Data:** 03/10/2026  
**Branch auditada:** `pr-47`  
**Commit de referência:** `3f457bb1dddb6776df0d256a5f74b08429610609` — `security: harden setup login and cloud endpoint validation`  
**Publicação testada:** https://teste-60f.pages.dev/?audit=full-20261003  
**Worker consultado:** https://digicopy-sync-api.digicopyonline.workers.dev

## 1. Escopo e método

A auditoria foi somente de leitura. Não foram excluídos arquivos, não foram alterados dados do usuário, não foi salva alteração de ordem de menus e o modo escuro foi restaurado ao estado original depois do teste.

Foram executados:

- `node test_menu_shell_v8000.js` — passou.
- `npm --prefix cloudflare-worker test` — passou.
- `npm test` — falhou na suíte histórica/consolidada; detalhes abaixo.
- Varredura de `TODO`, `FIXME`, `BUG`, `HACK`, funções centrais e duplicações.
- Inspeção do `bundle-manifest.json`.
- Consulta dos endpoints `/health` e `/v1/setup-status` do Worker.
- Teste visual no My Browser autenticado: Dashboard, Preferências, modo escuro e editor de menus.

## 2. Resultado executivo

**Estado atual: não considero pronto para entrega final.**

A publicação abre e a navegação principal funciona no cenário autenticado. O controle de posição do menu e o editor de ordem estão visíveis no perfil testado. Porém, foram confirmados problemas visuais e estruturais importantes:

1. O modo escuro ainda não cobre todos os cartões e modais.
2. O editor de menus fica parcialmente claro no modo escuro.
3. O cartão de Técnicos permanece branco no modo escuro.
4. O projeto ainda possui muitas camadas históricas que redefinem funções centrais.
5. A regra de senha padrão ainda abre o aviso/modal quando `senhaPadrao` permanece verdadeiro; o código atual contém esse fluxo em mais de um ponto efetivo.
6. A suíte raiz está desalinhada com a versão 8.0.0 e falha em diversos testes históricos, portanto não pode ser apresentada como verde.
7. A importação lê arquivos em lote, mas a gravação principal ainda passa por `fbImportToErp` e precisa de teste de carga real antes de afirmar que a lentidão foi resolvida.

## 3. Evidências do navegador

### 3.1 Dashboard em modo claro

O Dashboard carregou com:

- sidebar esquerda;
- seções Visão geral, Operação, Cadastros e gestão e Sistema;
- busca por etiqueta;
- cartões de Clientes, Produtos, Contratos e Financeiro;
- ações rápidas;
- status de nuvem sincronizada;
- texto indicando dados somente na nuvem.

A navegação para Configurações > Preferências funcionou.

### 3.2 Preferências

No perfil autenticado, foram exibidos:

- **Modo escuro**;
- **Posição do menu lateral**, com Esquerdo/Direito;
- **Editar menus**;
- Dados da loja, técnicos e Pix.

Isso confirma que a preferência de lado do menu não está restrita ao comercial no frontend publicado.

### 3.3 Modo escuro

Ao ativar o checkbox, o shell, sidebar, Dashboard e busca ficaram escuros em grande parte. Entretanto, foram observados:

- cartão **Técnico** branco na tela de Preferências;
- elementos internos claros em cartões/controles;
- editor de menus com blocos brancos;
- faixa inferior do modal do editor clara/branca;
- componentes de formulário que dependem de estilos antigos continuam com fundo claro.

O modo escuro foi desligado novamente ao final da auditoria.

### 3.4 Editor de menus

O botão abriu um modal com quatro seções, sem duplicatas aparentes:

1. Visão geral
2. Operação
3. Cadastros e gestão
4. Sistema

O editor abre, mas apresenta o problema visual descrito acima. A ordem não foi modificada nem salva.

## 4. Falhas automatizadas

### 4.1 Testes que passaram

- `test_menu_shell_v8000.js`: **OK**.
- `npm --prefix cloudflare-worker test`: **OK**; funções puras, políticas de rate limit, tokens e rotinas de backup passaram.

### 4.2 Suíte raiz

`npm test` retornou código **1**.

As falhas não são uma única regressão: há muitos testes históricos que ainda esperam versões antigas, posições antigas do manifesto, bundles antigos, carimbos antigos do Worker e estrutura anterior do index. Também apareceram falhas de tema e de sincronização.

Falhas relevantes registradas:

- expectativas de `worker 5.28.4/5.28.5` enquanto o Worker remoto responde versão diferente do histórico esperado;
- expectativas de cache-bust e carimbo do `index.html` incompatíveis com o estado v8;
- expectativa de bundles raiz/mobile idênticos;
- testes que esperam posições e quantidade antiga de scripts no manifesto;
- várias seções `TEMA FALHOU`;
- falhas relacionadas à sincronização e ao dado aparecer em outro PC;
- redefinição silenciosa de `navigateTo` identificada por teste de sobreposição.

**Conclusão:** a suíte raiz precisa ser reancorada para v8 ou separada entre testes históricos e testes de contrato atuais. Não se deve ignorar essas falhas.

## 5. Senha padrão e aviso repetido

O código efetivo ainda contém o comportamento:

```js
if(user.senhaPadrao&&typeof openModal==='function'){
  setTimeout(function(){
    toast('Senha padrão: troque pela sua senha','error');
    openModal('usuario', user.id);
  }, 900);
}
```

Esse fluxo aparece no `app.js` e também em patches/bundle efetivos. A gravação de usuário também mantém a regra:

```js
if(eraNovo) u.senhaPadrao = true;
else if(senhaDigitada && senhaDigitada !== senhaAntiga)
  u.senhaPadrao = (u.id === s.usuarioId) ? false : true;
```

Implicação: quando um administrador altera a senha de outro usuário, o usuário alterado continua marcado para trocar no próximo login. Isso pode ser intencional para usuários recém-criados, mas não deve acontecer com o administrador que já trocou sua própria senha. O sintoma relatado indica que pelo menos um registro ou um caminho de login continua com `senhaPadrao: true`.

Também há divergência entre `saveUsuario` antigo e `saveUsuarioFinal` posterior, o que aumenta o risco de um caminho limpar a flag e outro não.

## 6. Importação de dados

Há melhorias reais no leitor de múltiplos arquivos:

- `handleMultipleUpload` percorre vários JSON;
- atualiza progresso por arquivo;
- cede o controle ao navegador entre arquivos;
- monta `rawData` antes da gravação;
- usa mapas/índices em `fbImportToErp` para evitar `.find()` repetido em cada registro;
- trabalha com upsert para registros de migração.

Mas ainda há riscos e pontos a medir:

- a confirmação da importação tem fallback para `confirm()` nativo em `importarJsonDBeaver`;
- `fbImportToErp` é chamado como uma operação ampla após a leitura;
- a execução real com milhares de clientes, vendas e itens não foi feita nesta auditoria para não gravar dados do usuário;
- o caminho Electron/Firebird ainda usa `confirm()` nativo em `fbExtractAll`;
- o progresso observado é por arquivo e não prova tempo de gravação por tabela/registro.

## 7. Sobreposição e estrutura

O manifesto contém **218 entradas**. A varredura encontrou várias redefinições de funções centrais:

- `navigateTo`: dezenas de ocorrências;
- `renderUsuarios`: múltiplas ocorrências;
- `renderClientes`: múltiplas ocorrências;
- `renderVendas`: múltiplas ocorrências;
- `renderFinanceiro`: múltiplas ocorrências;
- `showApp`: múltiplas ocorrências;
- `renderConfig`: múltiplas ocorrências;
- `doLoginUser`: múltiplos caminhos;
- `saveDB`: múltiplas camadas.

Isso confirma a preocupação do usuário: há código que corrige por cima de outra implementação. O módulo `modulos/menu_shell_v8000.js` consolidou parte da sidebar e menus, mas a consolidação ainda não é global para todos os módulos.

### Candidatos a revisão, não a exclusão automática

Os seguintes arquivos não aparecem diretamente no manifesto atual ou são artefatos/testes auxiliares. Eles **não devem ser deletados sem confirmação**:

- patches antigos de menus e modo escuro;
- `app.bundle.js` gerado;
- scripts de diagnóstico e geração;
- testes `test_msg_*`, `test_r*.js` e `test_regressao_dialogos.js`;
- patches fiscais antigos;
- arquivos de Electron/preload e utilitários de build.

A ausência no manifesto não prova que um arquivo é morto: ele pode ser usado por testes, Electron, APK, documentação ou ferramentas de geração.

## 8. Worker e nuvem

Consulta realizada sem alterar dados:

- `/health`: API e D1 disponíveis; banco respondeu `ok`.
- `/v1/setup-status`: `configured: true`.
- O relatório do endpoint registrou ocorrências de saúde históricas, incluindo `base_vazia`, `_seq recusado` e uma falha com `changes` nulo. Isso deve ser investigado no painel de saúde, embora não tenha sido criado nenhum dado nesta auditoria.

## 9. Bugs confirmados para correção

Prioridade alta:

1. Unificar o caminho efetivo de login e limpar `senhaPadrao` de forma consistente quando a senha realmente foi trocada.
2. Remover ou adaptar os estilos claros do cartão Técnico para o tema escuro.
3. Adaptar o modal do editor de menus ao tema escuro, incluindo blocos e rodapé.
4. Revisar todos os componentes gerados por `renderConfig`, `renderBanco` e modais para não dependerem de `bg-white`/`bg-slate-*` sem regra equivalente.
5. Eliminar fallback para `alert`, `confirm` e `prompt` nativos em todos os caminhos ativos.
6. Definir a suíte oficial v8 e separar testes históricos incompatíveis.

Prioridade média:

7. Executar teste de carga controlado da importação com fixture sintética grande, sem dados reais.
8. Reduzir redefinições de `navigateTo`, `showApp`, `renderConfig` e demais funções centrais.
9. Validar igualdade ou diferença intencional entre bundles Web, `mobile/www` e APK.
10. Criar teste E2E de login para admin, usuário criado por admin e usuário que troca a própria senha.

## 10. Arquivos mortos candidatos

A auditoria não autoriza exclusão. A lista de candidatos deve ser revisada manualmente e por dependência antes de qualquer remoção. Recomenda-se primeiro:

- produzir um mapa de importação/referência;
- confirmar uso em `build_bundle.js`, `build_profiles.js`, Electron e Capacitor;
- executar os testes que referenciam cada arquivo;
- somente depois propor exclusão em lote revisável.

## 11. Decisão solicitada antes de corrigir

Para a próxima etapa, preciso da autorização explícita para:

1. corrigir os três problemas visuais confirmados do modo escuro;
2. consolidar o caminho de login e a flag `senhaPadrao`;
3. substituir todos os fallbacks nativos de diálogo nos caminhos ativos;
4. reancorar ou separar os testes históricos incompatíveis com v8;
5. fazer uma limpeza estrutural de patches, **sem deletar nenhum arquivo ainda**;
6. executar uma carga sintética de importação com dados de teste.

Nenhum arquivo foi deletado nesta auditoria e nenhuma correção foi aplicada depois do início desta varredura.
