const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

function load(src){
  const ctx = {
    window: {
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    document: {
      getElementById: () => null,
      title: ''
    }
  };
  ctx.window.window = ctx.window;
  new Function('window', 'document', src)(ctx.window, ctx.document);
  return ctx.window;
}

const src = fs.readFileSync('ajustes_v52253_login_tela_branca_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const P = load(src).LOGIN_TELA_BRANCA_V52253_PURE;

ok('versão 5.22.53', P.VERSAO === '5.22.53' && pkg.version === '5.22.53');
ok('boot instantaneo ativo', P.bootInstantaneo === true);
ok('anti tela branca ativo', P.antiTelaBranca === true);

const uAdmin = P.loginFlexivel('ADMIN', 'admin', []);
ok('login ADMIN / admin funciona case-insensitive', uAdmin && uAdmin.perfil === 'Admin');

const uCustom = P.loginFlexivel('GERENTE', 'pass123', [{ id: 'usr_2', nome: 'Gerente Geral', login: 'gerente', senha: 'pass123', perfil: 'Admin', ativo: true }]);
ok('login dinâmico de usuário funciona', uCustom && uCustom.id === 'usr_2');

ok('patch no manifesto do bundle', manifest.includes('ajustes_v52253_login_tela_branca_patch.js') && manifest[manifest.length - 1] === 'ajustes_v52253_login_tela_branca_patch.js');
ok('patch no files do electron-builder', pkg.build.files.indexOf('ajustes_v52253_login_tela_branca_patch.js') >= 0);
ok('index carrega os scripts na versão 5.22.53', /app\.bundle\.js\?v=5\.22\.53/.test(html) && /ajustes_v52253_login_tela_branca_patch\.js\?v=5\.22\.53/.test(html));
ok('rodapé 5.22.53', /footer-version/.test(html) && /v5\.22\.53/.test(html));
ok('sem nome pessoal novo', !/kauan/i.test(src.replace(/__KAUAN_REFINO_STATE__/g, '').replace(/kauangabrielcardososilva7890-afk/g, '')));

console.log('\nRESULTADO: v5.22.53 passou!');
