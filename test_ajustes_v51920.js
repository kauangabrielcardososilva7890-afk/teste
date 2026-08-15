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
ok('concluidoMarcado false', P.concluidoMarcado(doc({}), ['ko-concluido']) === false);
{
  const d = doc({ 'ko-concluido': '' }); d.getElementById('ko-concluido').checked = true;
  ok('concluidoMarcado true', P.concluidoMarcado(d, ['ko-concluido']) === true);
}
{
  const db = { parque: [{ equipamentoId:'e1', medidoresConfig: { colorA4: { modalidade:'individual' } } }] };
  ok('impressora com color', P.impressoraTemColor(db, 'e1') === true);
  ok('impressora sem color', P.impressoraTemColor({ parque: [{ equipamentoId:'e2', medidoresConfig: {} }] }, 'e2') === false);
  ok('color inativo', P.impressoraTemColor({ parque: [{ equipamentoId:'e3', medidoresConfig: { colorA4: { modalidade:'inativo' } } }] }, 'e3') === false);
}

console.log('\nRESULTADO: Testes do ajustes_v51920 passaram!');
