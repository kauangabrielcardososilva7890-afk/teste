const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('otimizacao_profunda_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'c1',empresaId:'emp',nome:'A'},{id:'c2',empresaId:'emp2',nome:'B'}],
  modulosDinamicos:{
    VISITAS:{dados:[{COD_VISITA:1,DATA:'2026-08-01'},{COD_VISITA:2,DATA:'2026-08-02'}]},
    CONTADOR_PAGINAS:{dados:[{COD_CONTADOR:1,CP_VALOR_TOTAL:10}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db',code)(ctx.window, ctx.db);
const P = ctx.window.DIGI_TURBO_PURE;

console.log('== OTIMIZACAO_PROFUNDA_PURE ==');
const sig1 = P.fingerprintTables(db, ['VISITAS','CONTADOR_PAGINAS']);
const sig2 = P.fingerprintTables(db, ['VISITAS','CONTADOR_PAGINAS']);
ok('assinatura determinística de tabelas', sig1 === sig2 && sig1.includes('VISITAS:2'));
ok('assinatura de arrays por empresa', P.fingerprintArrays(db, ['clientes'], 'emp').includes('clientes:1'));
ok('primeira assinatura deve rodar', P.deveRodarAssinatura(db, 'teste', sig1) === true);
ok('mesma assinatura não roda de novo', P.deveRodarAssinatura(db, 'teste', sig1) === false);
const sig3 = sig1 + '|novo';
ok('assinatura nova roda', P.deveRodarAssinatura(db, 'teste', sig3) === true);
console.log('\nRESULTADO: Testes de otimização profunda passaram!');
