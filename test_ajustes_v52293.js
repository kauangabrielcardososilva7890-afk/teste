// Teste v5.22.93 — guardião do banco de orçamentos (quem tirou, fica anotado)
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.93 — guardião do banco de orçamentos ==');

const g = fs.readFileSync('ajustes_v52293_orcamento_guardiao_patch.js', 'utf8');
ok(g.indexOf("__orc_saiu") >= 0, 'anel de saídas gravado no PC (__orc_saiu)');
ok(g.indexOf('setInterval(function(){') >= 0 && g.indexOf(', 400)') >= 0, 'vigia compara os ids do array a cada 400 ms');
ok(g.indexOf('anotarSaida(') >= 0 && g.indexOf("new Error('vigia')") >= 0, 'toda saída grava ids que sumiram + trilha de quem chamou');
ok(g.indexOf('window.__orcResumoUltimaBaixa') >= 0, 'exposição do resumo da última baixa para o aviso');
ok(g.indexOf('renderOrcamentos') >= 0 && g.indexOf('__v52293') >= 0, 'amarra o retrato na listagem VISÍVEL (a última que existir)');

const m = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
ok(m.indexOf('ajustes_v52293_orcamento_guardiao_patch.js') === m.length - 1, 'guardião é o ÚLTIMO arquivo do bundle (wrap vence todo mundo)');

const v237 = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
ok(v237.indexOf('__orcResumoUltimaBaixa') >= 0, 'aviso "não achei" mostra a última baixa');
ok(v237.indexOf("códigos que existem agora: ' + _ids + '; ' + _baixa") >= 0, 'texto do aviso concatena a baixa');

const v922 = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
ok(v922.indexOf("change.entity==='orcamentos'") >= 0, 'trava v5.22.92 (delete da nuvem vira excluído) continua');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.93!');
