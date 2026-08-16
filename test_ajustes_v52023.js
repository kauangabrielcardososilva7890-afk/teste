const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v52023_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.AJUSTES_V52023_PURE;

console.log('== AJUSTES_V52023_PURE ==');

function dbFixture(){
  return {
    clientes: [
      { id:'c1', nome:'Com histórico', empresaId:'emp_digicopy' },
      { id:'c2', nome:'Sem histórico', empresaId:'emp_digicopy' },
      { id:'c3', nome:'Outro (intocado)', empresaId:'emp_digicopy' },
    ],
    contratos: [ { id:'ct1', clienteId:'c1' }, { id:'ct2', clienteId:'c3' } ],
    parque:    [ { id:'p1', clienteId:'c1', contratoId:'ct1', equipamentoId:'eq1', status:'ativo' },
                 { id:'p2', clienteId:'c3', contratoId:'ct2', equipamentoId:'eq2', status:'ativo' } ],
    leituras:  [ { id:'l1', clienteId:'c1', contratoId:'ct1', parqueId:'p1' }, { id:'l2', clienteId:'c3', contratoId:'ct2' } ],
    os:        [ { id:'os1', clienteId:'c1' }, { id:'os2', clienteId:'c3' } ],
    vendas:    [ { id:'v1', clienteId:'c1' }, { id:'v2', clienteId:'c3' } ],
    contasReceber: [ { id:'cr1', clienteId:'c1' }, { id:'cr2', vendaId:'v1' }, { id:'cr3', leituraId:'l1' }, { id:'cr4', clienteId:'c3' } ],
    contasPagar:   [ { id:'cp1', fornecedor:'Forn A' }, { id:'cp2', fornecedor:'Forn B' } ],
    equipamentos:  [ { id:'eq1', status:'locado' }, { id:'eq2', status:'locado' }, { id:'eq3', status:'locado' } ],
  };
}

// resumoHistorico: cliente com histórico vs sem histórico
{
  const db = dbFixture();
  const r1 = P.resumoHistorico(db, ['c1']);
  ok('resumo total de c1 = 8 (ct,prk,lei,os,vda,3 cr)', r1.total === 8 && r1.comHistorico === 1);
  ok('resumo texto menciona contrato e venda', /contrato/.test(r1.texto) && /venda/.test(r1.texto));
  const r2 = P.resumoHistorico(db, ['c2']);
  ok('c2 sem histórico (total 0)', r2.total === 0 && r2.comHistorico === 0);
  const r3 = P.resumoHistorico(db, ['c1','c2']);
  ok('mistura: comHistorico conta só quem tem', r3.comHistorico === 1 && r3.total === 8);
}

// excluirClientesCascata: apaga cliente + histórico junto, sem tocar nos outros
{
  const db = dbFixture();
  db.parque.push({ id:'p9', clienteId:'c3', equipamentoId:'eq3', status:'inativo' }); // eq3 sem parque ativo
  const r = P.excluirClientesCascata(db, ['c1','c2']);
  ok('2 clientes excluídos', r.clientes === 2);
  ok('cascata: 1 contrato, 1 parque, 1 leitura, 1 os, 1 venda, 3 contas', r.contratos===1 && r.parque===1 && r.leituras===1 && r.os===1 && r.vendas===1 && r.contasReceber===3);
  ok('c3 continua', db.clientes.some(c=>c.id==='c3'));
  ok('dados do c3 intactos', db.contratos.some(c=>c.id==='ct2') && db.vendas.some(v=>v.id==='v2') && db.contasReceber.some(c=>c.id==='cr4') && db.os.some(o=>o.id==='os2') && db.leituras.some(l=>l.id==='l2') && db.parque.some(p=>p.id==='p2'));
  ok('eq1 liberada (locado -> disponivel)', db.equipamentos.find(e=>e.id==='eq1').status === 'disponivel');
  ok('eq2 continua locado (parque ativo do c3)', db.equipamentos.find(e=>e.id==='eq2').status === 'locado');
  ok('eq3 NÃO liberada (não estava no parque apagado)', db.equipamentos.find(e=>e.id==='eq3').status === 'locado');
  ok('contasPagar intocadas', db.contasPagar.length === 2);
}

// excluirLancamentosFinanceiro: apaga de verdade cr/cp
{
  const db = dbFixture();
  const r = P.excluirLancamentosFinanceiro(db, [{tipo:'cr',id:'cr1'},{tipo:'cp',id:'cp2'}]);
  ok('1 a receber + 1 a pagar excluídos', r.receber===1 && r.pagar===1);
  ok('cr1 sumiu, cp2 sumiu', !db.contasReceber.some(c=>c.id==='cr1') && !db.contasPagar.some(c=>c.id==='cp2'));
  ok('outros lançamentos intactos', db.contasReceber.length===3 && db.contasPagar.length===1);
  const r0 = P.excluirLancamentosFinanceiro(db, []);
  ok('sem seleção não apaga nada', r0.receber===0 && r0.pagar===0 && db.contasReceber.length===3);
}

console.log('\nRESULTADO: Testes do ajustes_v52023 passaram!');
