// test_ajustes_v5265.js — v6.0.6: O RALO DO BUSCADOR ESCOLA FECHADO DE VEZ.
//
// Causa raiz confirmada por ele: "o buscador consumia muita leitura da nuvem,
// FAZIA ISSO ATÉ QUANDO NÃO ESTAVA NA ABA". Agora ele tem plano pago — mas
// plano pago é pra USO, não pra robô invisível queimando cota com a loja
// fechada. Decreto travado aqui:
//  1) o relógio automático NÃO chama a rede se a aba do Buscador Escola não
//     estiver aberta na tela AGORA (zero login/página/gravação fora dela);
//  2) ABRIR a aba já confere a idade dos dados (uso de verdade, na hora);
//  3) os freios da v5.24.8 continuam intactos (1h velho, incremental, sem
//     login nem tenta, nunca limpa a base, nunca duas buscas juntas);
//  4) botões manuais (Atualizar / Baixar Tudo) intocados;
//  5) deps críticas (acorn/node-forge) vendorizadas no repo — build e testes
//     não quebram mais com node_modules ausente.
const fs = require('fs');
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const escola = fs.readFileSync('buscador_escola_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const runner = fs.readFileSync('test_runner.js', 'utf8');
const build = fs.readFileSync('build_bundle.js', 'utf8');

console.log('== RALO FECHADO: automático só com a aba aberta ==');
ok('esAbaAberta() existe (detecta o h3 "Buscador Escola" na tela)', escola.indexOf('function esAbaAberta()') >= 0 && escola.indexOf("indexOf('Buscador Escola')>=0") >= 0);
ok('esAutoTique sai cedo se a aba NÃO estiver aberta', /if\(!esAbaAberta\(\)\) return;/.test(escola));
ok('guarda antes de qualquer rede (a checagem da aba vem antes do login/velhice)', escola.indexOf('if(!esAbaAberta()) return;') < escola.indexOf('if(!loginDaNuvem()&&!loginDoNavegador()) return;'));
ok('abrir a aba já checa dados velhos na hora (renderBuscadorEscola chama o tique)', escola.indexOf('try{ esAutoTique(); }catch(e){}') >= 0);
ok('relógio barato continua (10 min) — zera rede, não zera a lógica', escola.indexOf('setInterval(esAutoTique,10*60*1000)') >= 0);
ok('freios da v5.24.8 intactos (1h, incremental, sem login nem tenta)', escola.indexOf('sync({auto:true,incremental:true})') >= 0 && escola.indexOf("if(window.__esSync && opt && opt.auto) return {ok:false,error:'em-andamento'}") >= 0);
ok('fechamento dentro do bundle gerado', bundle.indexOf('esAbaAberta') >= 0);

console.log('== SIMULAÇÃO: tique com/sem aba ==');
const chamadas = [];
const sandbox = {
  window: {}, document: undefined, setInterval: function(){ return 0; }, setTimeout: function(){}, clearInterval: function(){},
  console: console, db: { config: { escolaSync: { at: '2020-01-01T00:00:00Z' } }, escolaOrc: [], escolaIt: [], escolaExc: [] },
};
const trecho = escola.slice(escola.indexOf('function esAbaAberta'), escola.indexOf('if(typeof document'));
sandbox.syncFake = function(){ chamadas.push('sync'); };
const fonte = trecho
  .replace(/sync\(\{auto:true,incremental:true\}\)/g, 'syncFake()')
  .replace(/loginDaNuvem\(\)/g, 'true')
  .replace(/loginDoNavegador\(\)/g, 'false');
sandbox.elapsed = function(){ return 2 * 60 * 60 * 1000; };
sandbox.db = { config: { escolaSync: { at: '2020-01-01T00:00:00Z' } } };
vm.createContext(sandbox);
sandbox.document = { querySelectorAll: function(){ return []; } };
vm.runInContext('var document = this.document; var db = this.db; var elapsed = this.elapsed; var syncFake = this.syncFake; var window = this.window;' + fonte + '; esAutoTique();', sandbox);
ok('fora da aba (sem h3 na tela): ZERO sync disparada', chamadas.length === 0);
sandbox.document = { querySelectorAll: function(){ return [{ textContent: 'Buscador Escola' }]; } };
vm.runInContext('var document = this.document; var db = this.db; var elapsed = this.elapsed; var syncFake = this.syncFake; var window = this.window;' + fonte + '; esAutoTique();', sandbox);
ok('com a aba aberta e dados velhos: sync disparada 1x', chamadas.length === 1);

console.log('== DEPS VENDORIZADAS (build e teste sem node_modules) ==');
ok('vendor/acorn presente e carregável', fs.existsSync('vendor/acorn/package.json') && typeof require('./vendor/acorn').parse === 'function');
ok('vendor/node-forge presente', fs.existsSync('vendor/node-forge/package.json'));
ok('build_bundle cai no vendor se npm faltar', build.indexOf("require('./vendor/acorn')") >= 0 && build.indexOf("require('acorn')") >= 0);
ok('runner recria node_modules a partir do vendor (ensureDeps)', runner.indexOf('ensureDeps') >= 0 && runner.indexOf("path.join('vendor', pkg)") >= 0);

console.log('== CARIMBO 6.0.7 (app; worker e gerente intactos) ==');
ok('package.json na 6.0.7', pkg.version === '6.0.7');
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '6.0.7'") >= 0 && html.indexOf('>v6.0.7<') >= 0);
ok('script check valida o buscador_escola', pkg.scripts.check.indexOf('buscador_escola_patch.js') >= 0);
ok('worker SEGUE 5.26.3 (motor sem mudança)', fs.readFileSync('cloudflare-worker/src/index.js','utf8').indexOf("WORKER_VERSION = '5.26.3'") >= 0);
ok('gerente SEGUE 5.26.3', JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json','utf8')).version === '5.26.3');
ok('mobile sincronizado com o bundle novo', fs.readFileSync('mobile/www/app.bundle.js','utf8') === bundle);

console.log('\nTudo OK — v6.0.6 (ralo da escola FECHADO: automático só trabalha com a aba aberta; abriu a aba já busca; deps vendorizadas, build e testes à prova de node_modules sumido).');
