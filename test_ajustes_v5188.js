const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5188_patch.js', 'utf8');

// Avalia num ambiente mínimo com window + db globais
const g = {};
g.window = { DIGICOPY_LOGO: 'data:image/png;base64,ORIGINAL' };
g.db = {
  empresas: [{ id: 'e1', nome: 'Empresa Antiga', fantasia: 'DIGICOPY' }],
  config: { loja: { fantasia: 'Minha Loja', razaoSocial: 'Minha Loja LTDA', cnpj: '00.000.000/0001-00', logo: 'data:image/png;base64,CUSTOM' } }
};
g.getSession = () => ({ empresaId: 'e1' });
new Function('window', 'db', 'getSession', code)(g.window, g.db, g.getSession);

console.log('== AJUSTES_V5188: logo padrão + dados da loja ==');
ok('digicopyLogo usa SEMPRE a logo padrão (ignora custom)', g.window.digicopyLogo() === 'data:image/png;base64,ORIGINAL');
ok('digicopyLoja mescla empresa + loja (loja vence)', g.window.digicopyLoja().fantasia === 'Minha Loja');
ok('digicopyLoja traz razão social', g.window.digicopyLoja().razaoSocial === 'Minha Loja LTDA');

// Sem logo customizada => usa a original
const g2 = { window: { DIGICOPY_LOGO: 'data:image/png;base64,ORIGINAL' }, db: { empresas: [], config: { loja: {} } }, getSession: () => null };
new Function('window', 'db', 'getSession', code)(g2.window, g2.db, g2.getSession);
ok('sem logo customizada usa a original', g2.window.digicopyLogo() === 'data:image/png;base64,ORIGINAL');

console.log('\nRESULTADO: Testes do ajustes_v5188 passaram!');
