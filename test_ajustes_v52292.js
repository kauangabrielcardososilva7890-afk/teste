// Teste v5.22.92 — orçamento nunca some do banco por mandado da nuvem
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.92 — travas anti-sumidouro de orçamento ==');
const s = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');

ok(s.indexOf("change.entity==='orcamentos'") >= 0 && s.indexOf("arr[idx].status='excluido'") >= 0,
  'delete que VEM da nuvem para orçamento vira "excluído" (não some do banco)');
// v7.0.9 — a trava "nunca manda delete de orçamento" saiu: ela fazia o orçamento
// apagado PELA FICHA DO CLIENTE voltar (a ordem mais nova dele, v5.24.5, escrita
// no próprio módulo da ficha, diz "deletar é DE VEZ... a nuvem recebe o comando de
// apagar"). A proteção da v5.22.92 que importa — delete vindo DA NUVEM não remove o
// orçamento daqui — continua no lugar (conferida na linha acima), e o envio só
// acontece para o que ELE apagou (marca da v7.0.7), nunca por sumiço sozinho.
ok(s.indexOf("entity==='orcamentos')continue") < 0,
  'este PC PODE mandar delete de orçamento que ele mesmo apagou (v7.0.9)');
ok(s.indexOf("delete vindo DA NUVEM não remove o") >= 0,
  'a proteção contra sumiço por ordem da nuvem continua documentada');
ok(s.indexOf('ORÇAMENTO NUNCA SOME POR MANDADO DA NUVEM') >= 0,
  'a regra está comentada para o próximo leitor');

// regressões de orçamento continuam
const v237 = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
ok(v237.indexOf('__orc_render_ids') >= 0, 'snapshot da lista (v5.22.91) continua');
ok(v237.indexOf("o.status!=='excluido'") >= 0, 'lista de trabalho continua escondendo os excluídos');
const v261 = fs.readFileSync('ajustes_v52261_orcamento_nao_volta_patch.js', 'utf8');
ok(v261.indexOf('function orcamentoPodeFicar') >= 0, 'vassoura de ressuscitados continua (excluído não volta sozinho)');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.92!');
