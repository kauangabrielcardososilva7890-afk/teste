const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('contratos_final_patch.js','utf8');
const db = {
  clientes: [{ id:'cli116', empresaId:'emp', codigo:'116', nome:'Fernando Seguros' }],
  contratos: [{ id:'ct82', empresaId:'emp', numero:'LC-000082', codigoAntigo:'82', codClienteAntigo:'116', clienteId:null, valorMensalFixo:120, dataInicio:'2018-07-29', dataFim:'2019-07-29' }],
  equipamentos: [], parque: [], leituras: [], os: [],
  modulosDinamicos: {
    ITENS_LOCACAO: { dados: [
      { COD_ITENS_LOCACAO:'1', COD_LOCACAO:'82', COD_CLIENTE:'116', PATRIMONIO:'446', MODELO:'BROTHER 8085', SERIAL:'ABC123', DEPARTAMENTO:'Secretaria', CONTADOR:'0' }
    ] }
  }
};
const ctx = { window: {}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const P = ctx.window.CONTRATOS_FINAL_PURE;
console.log('== CONTRATOS_FINAL_PURE ==');
ok('código pega último grupo', P.codigo('LC-000082') === '82');
const alterados = P.reconciliar('emp');
ok('reconciliação alterou vínculos', alterados > 0);
ok('contrato vinculou cliente 116', db.contratos[0].clienteId === 'cli116');
ok('criou equipamento do item de locação', db.equipamentos.length === 1 && db.equipamentos[0].patrimonio === '446');
ok('criou parque do contrato', db.parque.length === 1 && db.parque[0].contratoId === 'ct82' && db.parque[0].clienteId === 'cli116');
console.log('\nRESULTADO: Testes finais de contratos passaram!');
