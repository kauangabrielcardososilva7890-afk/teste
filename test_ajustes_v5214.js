const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v5214_clientes_visiveis_patch.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const fin=fs.readFileSync('finalizacao_sistema_patch.js','utf8');
const idb=fs.readFileSync('indexeddb_persistence_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.CLIENTES_VISIVEIS_PURE;
console.log('== CLIENTES VISIVEIS v5.21.4 ==');
ok('exporta funções puras',!!P&&typeof P.pertenceEmpresa==='function');
ok('cliente sem empresaId aparece',P.pertenceEmpresa({nome:'A'},'emp_digicopy')===true);
ok('cliente da empresa aparece',P.pertenceEmpresa({empresaId:'emp_digicopy'},'emp_digicopy')===true);
ok('lista final aceita cliente sem empresaId',fin.includes('!c.empresaId||c.empresaId===s.empresaId'));
ok('seedData também preenche empresaId vazio',app.includes('r.empresaId !== emp.id'));
ok('IndexedDB reexecuta seedData depois de restaurar',idb.includes('seedData(false)'));
ok('patch entra no bundle',manifest.includes('ajustes_v5214_clientes_visiveis_patch.js'));
console.log('\nRESULTADO: clientes visíveis passou!');
