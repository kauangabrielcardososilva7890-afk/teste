const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v51920_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.AJUSTES_V51920_PURE;

console.log('== AJUSTES_V51920_PURE ==');
function doc(fields){
  const m = {};
  Object.keys(fields).forEach(id => m[id] = { value: fields[id], checked: false });
  return { getElementById: id => m[id] || null };
}
ok('primeiroValor pega do primeiro preenchido', P.primeiroValor(doc({ 'ko-desc':'', 'kr-os-desc':'Teste' }), ['ko-desc','kr-os-desc']) === 'Teste');
ok('primeiroValor vazio', P.primeiroValor(doc({}), ['ko-desc','kr-os-desc']) === '');

console.log('\nRESULTADO: Testes do ajustes_v51920 passaram!');
