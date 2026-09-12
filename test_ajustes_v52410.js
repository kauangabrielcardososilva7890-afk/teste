// Teste v5.24.11 — "o clientes não abre a lista que mostra os que eu quero":
//  • botão novo "Este cliente na lista" (ficha → módulo Clientes já filtrado
//    por este cadastro: ele + quem tem nome parecido, o grupinho dele);
//  • trava de segurança: sub desconhecido NÃO cai mais mudo em Leituras
//    (antes qualquer tropeço abria a lista errada sem avisar);
//  • carimbos 5.24.11.
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

console.log('-- este cliente na lista --');
ok(patch.indexOf('window.clitabAbrirClienteNaLista=function(){') >= 0, 'função existe');
ok(patch.indexOf("navigateTo('clientes')") >= 0, 'navega ao módulo Clientes');
ok(patch.indexOf("document.getElementById('search-clientes')") >= 0, 'preenche a busca do módulo Clientes');
ok(patch.indexOf('Este cliente na lista') >= 0, 'botão presente na barra de ações da ficha');

console.log('-- trava do senão --');
ok(patch.indexOf("Essa parte não tem lista de origem — use uma das abas do Histórico.") >= 0, 'sub desconhecido explica em vez de abrir lista errada');
ok(patch.indexOf("sub!=='vendas'&&sub!=='financeiro'&&sub!=='orcamentos'&&sub!=='chamados'&&sub!=='leituras'") >= 0, 'guarda dos 5 subs conhecidos');

console.log('-- integridade --');
ok(worker.indexOf("const WORKER_VERSION = '5.24.11'") >= 0, 'worker carimba v5.24.11');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf('clitabAbrirClienteNaLista') >= 0, 'função dentro do bundle');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '5.24.11'") >= 0 && indexHtml.indexOf('app.bundle.js?v=5.24.11') >= 0, 'index.html na v5.24.11');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '5.24.11'") >= 0, 'mobile/www/index.html na v5.24.11');
ok(pkg.version === '5.24.11', 'package.json v5.24.11');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) v5.24.11'); process.exit(1); }
console.log('\nTudo certo v5.24.11!');
