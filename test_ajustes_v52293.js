// NOTA (24/09/2026): o fim do bundle-manifest.json encolheu 3 posições — saíram
// `novo/nucleo.js`, `novo/ponte.js` e `ajustes_v7011_ponte_nucleo_patch.js` (o núcleo novo
// foi apagado por decisão do dono). A conferência abaixo conta DE TRÁS para a frente, então
// cada número caiu 3. Os patches conferidos e a ORDEM entre eles continuam os mesmos.
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
ok(m.indexOf('ajustes_v52293_orcamento_guardiao_patch.js') === m.length - 36, 'guardião logo antes da fila final (depois vêm volta-venda, backups, o v5.24.0, as abas do cliente v5.24.3, o remanejo final v5.24.35, a guarda de leitura v5.24.36, a revisão v5.25.0, o CNPJ+gerente v5.26.0, o login da nuvem primeiro v5.26.2 a data grande do chamado v5.26.4 e o Painel do Gerente v6.0.6; o anti-tela-branca v6.0.12 e, por último, a ribbon fiscal bonita v6.0.13 e a navegação+escuro v6.1.3, e o mandar-erro v7.0.20, e o portão de escrita v7.0.22, e a função única v7.0.24 fecha a fila);');

const v237 = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
ok(v237.indexOf('__orcResumoUltimaBaixa') >= 0, 'aviso "não achei" mostra a última baixa');
ok(v237.indexOf("códigos que existem agora: ' + _ids + '; ' + _baixa") >= 0, 'texto do aviso concatena a baixa');

const v922 = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
ok(v922.indexOf("change.entity==='orcamentos'") >= 0, 'trava v5.22.92 (delete da nuvem vira excluído) continua');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.93!');
