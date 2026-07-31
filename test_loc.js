const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const codeLoc = fs.readFileSync('locacao_contratos_patch.js', 'utf8');
const ctx = { window: {}, db: { contratos: [], parque: [], leituras: [], os: [], equipamentos: [] } };
new Function('window', 'db', codeLoc)(ctx.window, ctx.db);

const LOC = ctx.window.LOC_PURE;

console.log('== LOC_PURE: ehEstoqueBaixo ==');
ok('estoque 4 com mín 4 → false (igual não notifica)', !LOC.ehEstoqueBaixo(4, 4));
ok('estoque 3 com mín 4 → true', LOC.ehEstoqueBaixo(3, 4));
ok('estoque 0 com mín 5 → true', LOC.ehEstoqueBaixo(0, 5));
ok('estoque 10 com mín 5 → false', !LOC.ehEstoqueBaixo(10, 5));

console.log('== LOC_PURE: calcLeituraExcedente ==');
{
  const r1 = LOC.calcLeituraExcedente(14015, 15051, 0, 0.15, 'global');
  ok('utilizado global correto (1036)', r1.utilizado === 1036);
  ok('excedente global correto (1036)', r1.excedente === 1036);
  ok('valor excedente global correto', Math.abs(r1.valorExcedente - 155.40) < 0.001);

  const r2 = LOC.calcLeituraExcedente(1000, 1200, 500, 0.10, 'global');
  ok('abaixo da franquia → 0 excedente', r2.utilizado === 200 && r2.excedente === 0 && r2.valorExcedente === 0);

  const r3 = LOC.calcLeituraExcedente(1000, 1600, 500, 0.10, 'global');
  ok('acima da franquia → calcula excedente', r3.utilizado === 600 && r3.excedente === 100 && Math.abs(r3.valorExcedente - 10.00) < 0.001);

  const r4 = LOC.calcLeituraExcedente(100, 300, 0, 0.20, 'impressao');
  ok('modo por impressao → cobra todas as paginas', r4.excedente === 200 && Math.abs(r4.valorExcedente - 40.00) < 0.001);

  const r5 = LOC.calcLeituraExcedente(100, 500, 0, 0.50, 'mes_fixo');
  ok('modo mes fixo → excedente e valor zero', r5.excedente === 0 && r5.valorExcedente === 0);
}

console.log('== LOC_PURE: calcContadoresChamado ==');
{
  const c1 = LOC.calcContadoresChamado(53200, 54200);
  ok('qtd impressos calculada (1000)', c1.quantidadeImpressos === 1000);
  const c2 = LOC.calcContadoresChamado(10000, 9000);
  ok('não permite qtd negativa (0)', c2.quantidadeImpressos === 0);
}

console.log('== LOC_PURE: ehVencidoChamado ==');
{
  const ont = new Date(Date.now() - 86400000).toISOString();
  const hoj = new Date().toISOString();
  ok('chamado de ontem aberto → vencido', LOC.ehVencidoChamado(ont, 'aberto'));
  ok('chamado de hoje aberto → não vencido', !LOC.ehVencidoChamado(hoj, 'aberto'));
  ok('chamado de ontem concluído → não vencido', !LOC.ehVencidoChamado(ont, 'concluido'));
}

console.log('\nRESULTADO: Todos os novos testes de Locação/Contratos passaram!');
