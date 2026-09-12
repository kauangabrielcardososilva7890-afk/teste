// Teste v5.24.12 — "quero a LISTA do módulo mostrando SÓ os selecionados":
//  • o botão da ficha NÃO abre mais o registro por cima — a lista do módulo
//    é desenhada somente com as linhas marcadas (troca-segura do tanque:
//    mesmos objetos, gravação de molho durante o desenho, tanque devolvido);
//  • sem seleção, continua como antes (módulo filtrado pelo cliente);
//  • carimbos 5.24.12.
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }
const patch  = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM= fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- a lista só com os marcados --');
ok(patch.indexOf('window.clitabRenderSoSelecionados=function(sub, ids){') >= 0, 'desenhista da lista filtrada existe');
ok(patch.indexOf("vendas:{arr:'vendas'") >= 0 && patch.indexOf("financeiro:{arr:'contasReceber'") >= 0 && patch.indexOf("orcamentos:{arr:'orcamentos'") >= 0 && patch.indexOf("chamados:{arr:'os'") >= 0 && patch.indexOf("leituras:{arr:'leituras'") >= 0, 'os 5 tanques mapeados (vendas/financeiro/orçamentos/chamados/leituras)');
ok(patch.indexOf('orig.filter(function(x){ return x && want[String(x.id)]; });') >= 0, 'filtra só os ids marcados');
ok(patch.indexOf('_db[def.arr]=orig;') >= 0 && patch.indexOf('window.saveDBAgora=sdA') >= 0, 'tanque devolvido e gravação voltando (troca segura)');
ok(patch.indexOf('clitabAbrirDireto(sub, ids[0], true)') === -1, 'NÃO abre mais o 1º registro por cima da lista');
ok(patch.indexOf('clitabRenderSoSelecionados(sub, ids)') >= 0, 'com seleção, a LISTA é quem mostra');
ok(patch.indexOf('que abra onde é a lista que mostra todos') >= 0 && patch.indexOf('que eu pedi') >= 0, 'regra dele gravada no comentário');

console.log('-- o que não muda --');
ok(patch.indexOf('window.clitabAbrirDireto=function(tipo, id, silencioso)') >= 0, 'botão direito continua abrindo o registro (caso de uso separado)');
ok(patch.indexOf('clitabAbrirClienteNaLista') >= 0, '"Este cliente na lista" da v5.24.10 segue');
ok(patch.indexOf('Abrir selecionado(s)') >= 0, 'botão continua contando os marcados');

console.log('-- integridade --');
ok(worker.indexOf("const WORKER_VERSION = '5.24.12'") >= 0, 'worker carimba v5.24.12');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf('clitabRenderSoSelecionados') >= 0, 'novo fluxo dentro do bundle');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '5.24.12'") >= 0 && indexHtml.indexOf('app.bundle.js?v=5.24.12') >= 0, 'index.html na v5.24.12');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '5.24.12'") >= 0, 'mobile/www/index.html na v5.24.12');
ok(pkg.version === '5.24.12', 'package.json v5.24.12');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) v5.24.12'); process.exit(1); }
console.log('\nTudo certo v5.24.12!');
