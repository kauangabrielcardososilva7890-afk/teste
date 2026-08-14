const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('contratos_refino_patch.js', 'utf8');
const ctx = { window: {}, db: { parque: [] } };
new Function('window', 'db', code)(ctx.window, ctx.db);
const R = ctx.window.CONTRATOS_REFINO_PURE;

console.log('== CONTRATOS_REFINO_PURE: código numérico simples ==');
ok('OS-2026-0081 vira 81', R.codigoSimples('OS-2026-0081') === '81');
ok('CT-2024-0142 vira 142', R.codigoSimples('CT-2024-0142') === '142');
ok('000123 vira 123', R.codigoSimples('000123') === '123');
ok('sem número vira vazio', R.codigoSimples('ABC') === '');
ok('próximo código usa só o último bloco numérico', R.proximoCodigo([{empresaId:'e1', numero:'OS-2026-0081'}, {empresaId:'e1', numero:'82'}, {empresaId:'e2', numero:'999'}], 'e1') === '83');

console.log('== CONTRATOS_REFINO_PURE: medidores independentes ==');
{
  const p = { modalidade: 'global', franquiaPB: 1000, valorExcedentePB: 0.1, medidores: { scanner: { modalidade: 'impressao', franquia: 0, valor: 0.02 } } };
  const m = R.normalizarMedidores(p);
  ok('preto A4 herdou global', m.pretoA4.modalidade === 'global' && m.pretoA4.franquia === 1000);
  ok('scanner manteve configuração própria', m.scanner.modalidade === 'impressao' && m.scanner.valor === 0.02);
  ok('alterar scanner não muda preto A4', m.scanner.modalidade !== m.pretoA4.modalidade);
}

console.log('== CONTRATOS_REFINO_PURE: impressoras do cliente dentro do contrato ==');
{
  const db = { parque: [
    { id:'p1', contratoId:'ct1', clienteId:'cli1', status:'ativo' },
    { id:'p2', contratoId:'ct-old', clienteId:'cli1', status:'ativo' },
    { id:'p3', contratoId:'ct1', clienteId:'cli1', status:'inativo' },
    { id:'p4', contratoId:'ct2', clienteId:'cli2', status:'ativo' }
  ] };
  const contrato = { id:'ct1', clienteId:'cli1' };
  const ativos = R.parquesDoClienteContrato(db, contrato);
  const todos = R.parquesDoClienteContrato(db, contrato, { todos:true });
  ok('ativos inclui impressora do contrato e impressora já cadastrada no cliente', ativos.map(p=>p.id).join(',') === 'p1,p2');
  ok('todos inclui também inativa/remanejada para conferência', todos.map(p=>p.id).join(',') === 'p1,p2,p3');
}

console.log('== CONTRATOS_REFINO_PURE: chamado vencido ==');
{
  const ontem = new Date(Date.now() - 86400000).toISOString();
  const hoje = new Date().toISOString();
  ok('ontem aberto está vencido', R.chamadoVencido(ontem, 'aberto'));
  ok('hoje aberto não está vencido', !R.chamadoVencido(hoje, 'aberto'));
  ok('concluído não fica vencido', !R.chamadoVencido(ontem, 'concluido'));
}

console.log('\nRESULTADO: Testes do refino de contratos passaram!');
