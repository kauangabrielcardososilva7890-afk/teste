// Teste v5.24.9 — ETIQUETA DE ORIGEM no aviso do orçamento fantasma:
//  • o guard (7 buscas) agora recebe QUEM chamou e o aviso completa com
//    "o clique veio de: ..." — a próxima foto responde a investigação;
//  • os 2 recarregamentos internos (pós-salvar e pós-revalidar) viraram
//    direto-por-objeto — nunca mais re-caçam por id;
//  • linhas e botões de olho das duas listas carregam a etiqueta;
//  • carimbos 5.24.9.
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }
const orc37  = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
const orc58  = fs.readFileSync('ajustes_v52258_orcamento_os_revalidar_patch.js', 'utf8');
const orc43  = fs.readFileSync('ajustes_v52243_orcamentos_status_patch.js', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM= fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- etiqueta de origem --');
ok(orc37.indexOf('window.abrirOrcamento=function(id, _origem){') >= 0, 'guard aceita a etiqueta (_origem)');
ok(orc37.indexOf('o clique veio de:') >= 0 && orc37.indexOf('lugar não identificado — mande a foto da tela inteira') >= 0, 'aviso completa com a origem do clique');
ok(orc37.indexOf('linha da lista de orcamentos') >= 0 && orc37.indexOf('botao de olho da lista') >= 0, 'lista v52237 etiquetada (linha + olho)');
ok(orc58.indexOf('linha da lista de orcamentos') >= 0 && orc58.indexOf('botao de olho da lista') >= 0, 'lista v52258 etiquetada (linha + olho)');

console.log('-- recarregamentos internos direto-por-objeto --');
ok(orc58.indexOf('window.abrirOrcamento(o.id)') === -1, 'v52258 não re-caça mais por id em lugar nenhum');
const reabertos = orc58.split('window.abrirTelaOrcamento(o); // v5.24.9').length - 1;
ok(reabertos === 2, 'pós-salvar e pós-revalidar reabrem pelo objeto (2 pontos)');
ok(orc43.indexOf("abrirOrcamento\\\\('([^']+)'\\\\)") >= 0 || orc43.indexOf("abrirOrcamento\\('([^']+)'\\)") >= 0, 'v52243 (badge de status) continua casando a 1ª aspa — etiqueta não quebra o leitor');

console.log('-- integridade --');
ok(worker.indexOf("const WORKER_VERSION = '5.24.9'") >= 0, 'worker carimba v5.24.9');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf('o clique veio de:') >= 0 && bundle.indexOf('linha da lista de orcamentos') >= 0, 'etiquetas dentro do bundle');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '5.24.9'") >= 0 && indexHtml.indexOf('app.bundle.js?v=5.24.9') >= 0, 'index.html na v5.24.9');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '5.24.9'") >= 0, 'mobile/www/index.html na v5.24.9');
ok(pkg.version === '5.24.9', 'package.json v5.24.9');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) v5.24.9'); process.exit(1); }
console.log('\nTudo certo v5.24.9!');
