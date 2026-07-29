// Teste unitário dos helpers puros do vendas_os_patch.js (seção VOS_PURE)
// Uso: node test_vos.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/vendas_os_patch.js', 'utf8');
const m = src.match(/\/\* VOS_PURE_START \*\/([\s\S]*?)\/\* VOS_PURE_END \*\//);
if(!m){ console.error('FALHOU: seção VOS_PURE não encontrada'); process.exit(1); }
eval(m[1]);

let pass = 0, fail = 0;
function eq(nome, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok) { pass++; console.log('  ✔', nome); }
  else { fail++; console.error('  ✘', nome, '\n     obtido:', JSON.stringify(got), '\n     esperado:', JSON.stringify(want)); }
}
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

console.log('== vosOsCompleta (regra da impressão) ==');
ok('vazio → false', !vosOsCompleta(null) && !vosOsCompleta({}));
ok('só modelo+série → false (falta patrimônio/contador)', !vosOsCompleta({modelo:'HP M404', numeroSerie:'BR123'}));
ok('modelo+série+patrimônio → true', vosOsCompleta({modelo:'HP M404', numeroSerie:'BR123', patrimonio:'PAT-55'}));
ok('modelo+série+contador → true', vosOsCompleta({modelo:'HP M404', numeroSerie:'BR123', contador:'12000'}));
ok('modelo+série+contador 0 → true', vosOsCompleta({modelo:'HP M404', numeroSerie:'BR123', contador:0}));
ok('sem série → false', !vosOsCompleta({modelo:'HP M404', patrimonio:'PAT-55'}));
ok('espaços contam como vazio', !vosOsCompleta({modelo:'  ', numeroSerie:'BR123', patrimonio:'P'}));

console.log('== vosCalcParcelas — intervalo de dias, sem juros ==');
{
  const r = vosCalcParcelas(300, {parcelas:3, primeiroVencimento:'2026-08-10', intervaloDias:30, jurosMes:0, hoje:'2026-07-29'});
  eq('3 parcelas', r.parcelas.length, 3);
  eq('valores iguais', r.parcelas.map(p=>p.valor), [100,100,100]);
  eq('total', r.total, 300);
  eq('vencimentos a cada 30d', r.parcelas.map(p=>p.vencimento.slice(0,10)), ['2026-08-10','2026-09-09','2026-10-09']);
}
console.log('== vosCalcParcelas — vencimento todo dia 10 ==');
{
  const r = vosCalcParcelas(200, {parcelas:3, primeiroVencimento:'2026-08-15', diaFixo:10, jurosMes:0, hoje:'2026-07-29'});
  eq('vencimentos dia 10', r.parcelas.map(p=>p.vencimento.slice(0,10)), ['2026-08-10','2026-09-10','2026-10-10']);
}
console.log('== vosCalcParcelas — dia fixo em mês curto ==');
{
  const r = vosCalcParcelas(100, {parcelas:2, primeiroVencimento:'2026-01-31', diaFixo:31, jurosMes:0, hoje:'2026-01-01'});
  eq('fevereiro tem no máx 28', r.parcelas[1].vencimento.slice(0,10), '2026-02-28');
}
console.log('== vosCalcParcelas — juros proporcional % a.m. ==');
{
  const r = vosCalcParcelas(100, {parcelas:1, primeiroVencimento:'2026-08-28', intervaloDias:30, jurosMes:2, hoje:'2026-07-29'});
  // 30 dias → 100 * (1 + 0.02*1) = 102
  eq('1 parcela 30d com 2% a.m. = 102', r.parcelas[0].valor, 102);
}
{
  const r = vosCalcParcelas(100, {parcelas:2, primeiroVencimento:'2026-08-28', intervaloDias:30, jurosMes:2, hoje:'2026-07-29'});
  // p1: 50*(1+0.02*1)=51 ; p2: 50*(1+0.02*2)=52
  eq('p1=51 p2=52', r.parcelas.map(p=>p.valor), [51,52]);
  eq('total=103', r.total, 103);
}
console.log('== vosCalcParcelas — arredondamento centavos ==');
{
  const r = vosCalcParcelas(100, {parcelas:3, primeiroVencimento:'2026-08-28', jurosMes:0, hoje:'2026-07-29'});
  // 100/3 = 33.333... → base 33.33 x3 = 99.99
  eq('base arredondada', r.parcelas[0].valor, 33.33);
  eq('total 99.99', r.total, 99.99);
}
console.log('== vosNextNumero ==');
eq('sequência', vosNextNumero('VD', 2026, [{numero:'VD-2026-0001'},{numero:'VD-2026-0042'}]), 'VD-2026-0043');
eq('lista vazia', vosNextNumero('OS', 2026, []), 'OS-2026-0001');
eq('ignora fora de padrão', vosNextNumero('VD', 2026, [{numero:'VENDA ANTIGA'},{numero:'VD-2026-0007'}]), 'VD-2026-0008');
eq('vosNumeroInt', vosNumeroInt('VD-2026-0081'), 81);

console.log(`\nRESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
