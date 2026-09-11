// Teste v5.24.10 — "abrir já mostrando o que eu escolhi" + 4.2 sem fantasma:
//  • o botão da ficha agora abre o REGISTRO no módulo (1 marcado abre direto;
//    vários = módulo filtrado pelo cliente + o 1º abre na hora);
//  • o abridor vai DIRETO PELO OBJETO — nunca re-caça por id na tela (era o
//    caminho que explodia no "Não achei esse orçamento" com código-fantasma);
//  • excluir varre as telas dos módulos (linha-fantasma apagada some dali,
//    então ninguém mais clica em registro morto).
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }
const patch  = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const orc37  = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM= fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- abrir selecionados: direto no registro, sempre pelo objeto --');
ok(patch.indexOf('window.clitabAbrirDireto=function(tipo, id, silencioso)') >= 0, 'abridor direto existe');
ok(patch.indexOf("if(ids.length){ setTimeout(function(){ try{ window.clitabAbrirDireto(sub, ids[0], true); }catch(e){} }, 260); }") >= 0, 'com seleção, o 1º abre na hora junto do módulo filtrado');
ok(patch.indexOf("openModal('contaReceber', c.id)") >= 0, 'Financeiro abre a CONTA (não só o menu)');
ok(patch.indexOf("window.abrirTelaOrcamento(o)") >= 0, 'orçamento abre direto pelo objeto (fora do caçador de id)');
ok(patch.indexOf("openModal('os', o.id)") >= 0 && patch.indexOf("abrirLeituraDetalhada(l.id)") >= 0, 'chamado e leitura abrem o registro');
ok(patch.indexOf("window.showVenda(v.id)") >= 0, 'venda abre o histórico da notinha');
ok(patch.indexOf("Abrir selecionado(s) ('+n+')") >= 0, 'botão mostra "Abrir selecionado(s) (N)" quando há marcação');

console.log('-- 4.2: sem linha-fantasma clicável --');
ok(patch.indexOf("sub==='orcamentos'&&typeof window.renderOrcamentos==='function'") >= 0 && patch.indexOf("sub==='chamados'&&typeof renderOs==='function'") >= 0 && patch.indexOf("sub==='leituras'&&typeof renderLeituras==='function'") >= 0, 'excluir varre orçamentos/chamados/leituras (fora o fantasma)');
ok(patch.indexOf('clitabAbrirRegistro=function(tipo, id){') >= 0 && patch.indexOf('String(x.id)===String(id)') >= 0, 'validação na hora do clique continua');
ok(orc37.indexOf("o.status!=='excluido'") >= 0, 'lista do módulo Orçamentos continua escondendo excluídos');

console.log('-- integridade --');
ok(worker.indexOf("const WORKER_VERSION = '5.24.10'") >= 0, 'worker carimba v5.24.10');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf('clitabAbrirDireto') >= 0, 'abridor presente no bundle');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '5.24.10'") >= 0 && indexHtml.indexOf('app.bundle.js?v=5.24.10') >= 0, 'index.html na v5.24.10');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '5.24.10'") >= 0, 'mobile/www/index.html na v5.24.10');
ok(pkg.version === '5.24.10', 'package.json v5.24.10');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) v5.24.10'); process.exit(1); }
console.log('\nTudo certo v5.24.10!');
