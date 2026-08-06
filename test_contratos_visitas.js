const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('contratos_visitas_vinculo_patch.js','utf8');
const db = {
  clientes:[{id:'cli78', empresaId:'emp', codigo:'78', nome:'Cliente 78'}],
  contratos:[{id:'ct51', empresaId:'emp', numero:'51', codigoAntigo:'51', clienteId:null, equipamentos:[]}],
  equipamentos:[], parque:[], leituras:[], os:[],
  modulosDinamicos:{
    VISITAS:{dados:[{COD_LOCACAO:51, COD_VISITA:18, VI_COD_CLIENTE:78, VI_COD_EQUIPAMENTO:2, VI_COD_ITENS_LOCACAO:113, VI_COD_DEPARTAMENTO:7, VI_PATRIMONIO:'2018027', VI_SERIAL:'M5585401175'}]},
    DEPARTAMENTOS:{dados:[{DEP_COD_DEPARTAMENTO:7, DEP_DESCRICAO:'OBRAS'}]},
    CONTADOR_PAGINAS:{dados:[{COD_ITENS_LOCACAO:113, CP_COD_EQUIPAMENTO:2, CP_DEPARTAMENTO:'OBRAS', CP_FRANQUIA:0, CP_VALOR_PAGINAS:0.076}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db',code)(ctx.window, ctx.db);
const P = ctx.window.CONTRATOS_VISITAS_PURE;
console.log('== CONTRATOS_VISITAS_PURE ==');
ok('código simples', P.cod('LC-000051') === '51');
const changed = P.vincularPorVisitas('emp');
ok('alterou vínculos', changed > 0);
ok('contrato vinculado ao cliente da visita', db.contratos[0].clienteId === 'cli78');
ok('equipamento criado pela visita', db.equipamentos.length === 1 && db.equipamentos[0].patrimonio === '2018027');
ok('parque criado dentro do contrato', db.parque.length === 1 && db.parque[0].contratoId === 'ct51' && db.parque[0].setor === 'OBRAS');
console.log('\nRESULTADO: Testes de vínculos por visitas passaram!');
