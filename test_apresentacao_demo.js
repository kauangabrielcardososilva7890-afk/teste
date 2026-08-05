const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('apresentacao_demo_patch.js','utf8');
const db={empresas:[],usuarios:[{id:'x'}],clientes:[],produtos:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[],contasPagar:[],logs:[],modulosDinamicos:{TABELA:{dados:[{A:1}]}},config:{}};
const ctx={window:{},db,localStorage:{setItem(){},getItem(k){return k==='digicopy_modo_apresentacao'?'1':null;}}};
new Function('window','db','localStorage',code)(ctx.window,ctx.db,ctx.localStorage);
const A=ctx.window.APRESENTACAO_DEMO_PURE;
console.log('== APRESENTACAO_DEMO_PURE ==');
ok('modo leve ativo', ctx.window.DIGI_MODO_LEVE===true && ctx.window.DIGICOPY_APRESENTACAO_DEMO===true);
A.prepararDemo();
ok('somente admin fica no login', db.usuarios.length===1 && db.usuarios[0].login==='admin' && db.usuarios[0].senha==='admin123');
ok('modulos migrados removidos no modo apresentação', Object.keys(db.modulosDinamicos).length===0);
ok('empresa demo criada', db.empresas.length>=1);
console.log('\nRESULTADO: Testes do modo apresentação passaram!');
