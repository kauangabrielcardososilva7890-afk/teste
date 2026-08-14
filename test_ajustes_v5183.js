const fs = require('fs');
const src = fs.readFileSync('ajustes_v5183_leituras_chamados_patch.js','utf8');
const pdf = fs.readFileSync('ajustes_v5182_patch.js','utf8');
function ok(cond,msg){ if(!cond) throw new Error(msg); }
ok(src.includes('acima de R$ 3.000,00'), 'alerta de leitura acima de 3 mil ausente');
ok(src.includes('fef9c3'), 'cor amarela de contador zerado ausente');
ok(src.includes('Contador inválido'), 'bloqueio de contador menor ausente');
ok(src.includes('p.contadores[item.medidor]=n(item.anterior)'), 'restauração do contador anterior ausente');
ok(src.includes('Deseja salvar a leitura antes de fechar?'), 'confirmação ao fechar leitura ausente');
ok(pdf.includes('IMPRESSORA / EQUIPAMENTO'), 'seção de impressora no PDF ausente');
ok(pdf.includes('Patrimônio') && pdf.includes('Serial'), 'patrimônio/serial não aparecem no PDF');
ok(pdf.includes('o.contratoId?'), 'PDF não separa chamado de contrato e avulso');
console.log('test_ajustes_v5183: OK');
