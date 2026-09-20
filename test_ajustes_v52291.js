// Teste v5.22.91 — diagnóstico completo do "não achei esse orçamento"
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.91 — orçamento avisa com diagnóstico que fecha a causa ==');
const s = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
ok(s.indexOf("__orc_render_ids") >= 0, 'lista guarda os ids que mostrou (snapshot da tela)');
ok(s.indexOf("localStorage.setItem('__orc_render_ids'") >= 0, 'snapshot gravado a cada render');
ok(s.indexOf("localStorage.getItem('__orc_render_ids'") >= 0, 'passo 7 lê o snapshot');
ok(s.indexOf("ESTAVA sim") >= 0 && s.indexOf("NÃO estava") >= 0, 'aviso diz se o clicado estava na lista mostrada');
ok(s.indexOf('códigos que existem agora:') >= 0, 'aviso lista os códigos que existem no banco');
ok(s.indexOf('slice(0,20)') >= 0, 'códigos atuais vão curtos no aviso');
// regressão: textos das etapas anteriores continuam
ok(s.indexOf('Não achei esse orçamento neste PC agora') >= 0, 'texto claro do aviso continua');
ok(s.indexOf('orc_legado_') >= 0, 'autocura de orçamento legado continua');
if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.91!');
