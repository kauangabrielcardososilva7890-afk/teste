const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}
const code = fs.readFileSync('modo_escuro_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.MODO_ESCURO_PURE;
console.log('== MODO_ESCURO_PURE ==');
ok('exporta funções puras', !!P && typeof P.resolve === 'function' && typeof P.next === 'function');
ok('padrão é claro', P.resolve(null) === 'light' && P.resolve('') === 'light' && P.resolve('xxx') === 'light');
ok('dark válido', P.resolve('dark') === 'dark' && P.resolve('DARK') === 'dark');
ok('alterna claro->escuro', P.next('light') === 'dark');
ok('alterna escuro->claro', P.next('dark') === 'light');
ok('isDark confere', P.isDark('dark') === true && P.isDark('light') === false);
ok('chave própria no navegador', P.KEY === 'digicopy_theme_v1');
ok('usa data-theme no html', /dataset\.theme/.test(code));
ok('botão na barra do topo', /tema-btn/.test(code) && /ntf-btn/.test(code));
ok('cobre menus e neo', /module-menu/.test(code) && /neo-table/.test(code) && /neo-panel/.test(code));
ok('impressão volta ao claro', /@media print/.test(code));
ok('azul vira claro no escuro', /#9dbcff/.test(code));
ok('sem escape duplo no seletor', !/\\\\\\\\\[/.test(code));
ok('botão perigo visível no escuro', /\.neo-btn\.danger/.test(code));
ok('bordas do detalhe no escuro', /modal-root \.border-t/.test(code));
console.log('\nRESULTADO: Testes do modo escuro passaram!');
