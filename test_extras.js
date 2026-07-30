// Testes unitários dos novos módulos v4.7.0 (notificacoes, vendas_extra, migrados_print)
// Uso: node test_extras.js
const fs = require('fs');
function extrai(arquivo, marca){
  const re = new RegExp('/\\* ' + marca + '_START \\*/([\\s\\S]*?)/\\* ' + marca + '_END \\*/');
  const m = fs.readFileSync(__dirname + '/' + arquivo, 'utf8').match(re);
  if(!m){ console.error('FALHOU: seção ' + marca + ' não encontrada em ' + arquivo); process.exit(1); }
  return m[1];
}
const NOTIF_PURE = eval(extrai('notificacoes_patch.js','NOTIF_PURE') + '\n; NOTIF_PURE;');
const EXTRA_PURE = eval(extrai('vendas_extra_patch.js','EXTRA_PURE') + '\n; EXTRA_PURE;');
const MIGPRINT_PURE = eval(extrai('migrados_print_patch.js','MIGPRINT_PURE') + '\n; MIGPRINT_PURE;');

let pass = 0, fail = 0;
function eq(nome, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok){ pass++; console.log('  ✔', nome); }
  else { fail++; console.error('  ✘', nome, '\n     obtido:', JSON.stringify(got), '\n     esperado:', JSON.stringify(want)); }
}
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

console.log('== numeroVisivel (notinha sem prefixo) ==');
{
  eq('VD-000123', EXTRA_PURE.numeroVisivel('VD-000123'), '000123');
  eq('VD-2026-0081', EXTRA_PURE.numeroVisivel('VD-2026-0081'), '2026-0081');
  eq('VENDA-55', EXTRA_PURE.numeroVisivel('VENDA-55'), '55');
  eq('número puro intacto', EXTRA_PURE.numeroVisivel('0081'), '0081');
  eq('legado cru 9847', EXTRA_PURE.numeroVisivel('9847'), '9847');
  eq('vazio não quebra', EXTRA_PURE.numeroVisivel(''), '');
  eq('só prefixo cai pro original', EXTRA_PURE.numeroVisivel('VD-'), 'VD-');
}

console.log('== podeRefaturar (desfazer QR/trocar forma) ==');
{
  const v = { id:'v1', status:'faturado' };
  eq('faturada sem título pago → pode', EXTRA_PURE.podeRefaturar(v, [{vendaId:'v1',status:'aberto'}]).ok, true);
  ok('venda migrada → bloqueia', !EXTRA_PURE.podeRefaturar({id:'v2',status:'faturado',origemMigracao:true}, []).ok);
  ok('não faturada → bloqueia', !EXTRA_PURE.podeRefaturar({id:'v3',status:'aberta'}, []).ok);
  const comPaga = EXTRA_PURE.podeRefaturar(v, [{vendaId:'v1',status:'pago',descricao:'Parcela 1'}]);
  ok('parcela baixada manualmente → bloqueia', !comPaga.ok);
  ok('motivo aponta o estorno', /Financeiro/i.test(comPaga.motivo));
  const autoVista = EXTRA_PURE.podeRefaturar(v, [{vendaId:'v1',status:'pago',autoBaixa:true,descricao:'Venda • à vista (Pix)'}]);
  eq('à vista auto-baixado (Pix) → PODE refazer', autoVista.ok, true);
}

console.log('== scanEstoqueBaixo ==');
{
  const prods = [
    {id:'p1', empresaId:'E', nome:'Toner A', estoque:3, estoqueMin:5, status:'ativo'},
    {id:'p2', empresaId:'E', nome:'Toner B', estoque:5, estoqueMin:5, status:'ativo'},
    {id:'p3', empresaId:'E', nome:'Toner C', estoque:40, estoqueMin:5, status:'ativo'},
    {id:'p4', empresaId:'E', nome:'Toner D', estoque:0, estoqueMin:2, status:'inativo'},
    {id:'p5', empresaId:'OUTRA', nome:'Toner E', estoque:0, estoqueMin:9, status:'ativo'}
  ];
  const r = NOTIF_PURE.scanEstoqueBaixo(prods, 'E');
  eq('só da empresa, ativos, estoque<=mínimo', r.map(x=>x.ref).sort(), ['p1','p2']);
  eq('ordenado pelos mais críticos (zerado/abaixo primeiro)', r[0].ref, 'p1');
  eq('traz dados p/ o aviso', {nome:r[1].nome, min:r[1].min}, {nome:'Toner B', min:5});
}

console.log('== scanContasReceber ==');
{
  const contas = [
    {id:'c1', empresaId:'E', status:'aberto', vencimento:'2026-07-29T00:00:00.000Z', valor:100},
    {id:'c2', empresaId:'E', status:'aberto', vencimento:'2026-07-30T12:00:00.000Z', valor:50},
    {id:'c3', empresaId:'E', status:'aberto', vencimento:'2026-08-05T12:00:00.000Z', valor:70},
    {id:'c4', empresaId:'E', status:'aberto', vencimento:'2026-08-20T12:00:00.000Z', valor:90},
    {id:'c5', empresaId:'E', status:'pago',   vencimento:'2026-07-01T00:00:00.000Z', valor:10},
    {id:'c6', empresaId:'X', status:'aberto', vencimento:'2026-07-01T00:00:00.000Z', valor:10}
  ];
  const r = NOTIF_PURE.scanContasReceber(contas, 'E', '2026-07-30', 7);
  eq('vencidas (antes de hoje, não pagas, da empresa)', r.vencidas.map(c=>c.id), ['c1']);
  eq('a vencer em até 7 dias (hoje incluído)', r.aVencer.map(c=>c.id), ['c2','c3']);
  eq('não duplica vencida no a-vencer', r.aVencer.some(c=>c.id==='c1'), false);
}

console.log('== MIGPRINT: detecção de notinha antiga ==');
{
  ok('NOTINHA', MIGPRINT_PURE.ehTabelaNotinha('NOTINHAS'));
  ok('NOTAFISCAL', MIGPRINT_PURE.ehTabelaNotinha('nota_fiscal'));
  ok('CUPOM', MIGPRINT_PURE.ehTabelaNotinha('CUPOM_VENDA'));
  ok('SAIDA', MIGPRINT_PURE.ehTabelaNotinha('SAIDAS'));
  ok('movimento qualquer não', !MIGPRINT_PURE.ehTabelaNotinha('BAIRROS'));
}

console.log('== MIGPRINT: resumo + escape ==');
{
  eq('resumo pega NUMERO', MIGPRINT_PURE.resumoRegistro({NUMERO:'12345', TOTAL:'99,90'}), 'Numero: 12345');
  eq('resumo cai p/ CODIGO', MIGPRINT_PURE.resumoRegistro({FOO:'', CODIGO:'A-9'}), 'Codigo: A-9');
  eq('escapa HTML (sem XSS na impressão)', MIGPRINT_PURE.esc('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  const html = MIGPRINT_PURE.htmlDocRegistro({ tabela:'NOTINHAS', label:'Notinhas Antigas', row:{NUMERO:'555', CLIENTE:'Maria <b>', TOTAL:'10,00'}, indice:4, resumo:'Numero: 555', empresaNome:'DIGICOPY', logo:'' });
  ok('doc traz título, tabela e campos', html.includes('Notinhas Antigas') && html.includes('NOTINHAS') && html.includes('Numero') && html.includes('10,00'));
  ok('doc escapa valor malicioso', html.includes('Maria &lt;b&gt;') && !html.includes('Maria <b>'));
  ok('doc tem botão imprimir', html.includes('window.print()'));
}

console.log('== hojeISO ==');
{
  eq('formato yyyy-mm-dd', NOTIF_PURE.hojeISO('2026-07-30T15:00:00.000Z'), '2026-07-30');
}

console.log('\n══════════════════════════════════');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
