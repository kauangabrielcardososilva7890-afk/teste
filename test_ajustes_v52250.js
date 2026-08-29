const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}
function load(src){
  const ctx = { window: {}, document: undefined };
  new Function('window', 'document', src)(ctx.window, ctx.document);
  return ctx.window;
}

const src = fs.readFileSync('ajustes_v52250_exe_bundle_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const P = load(src).EXE_BUNDLE_V52250_PURE;

ok('versão 5.22.50', P.VERSAO === '5.22.50' && pkg.version === '5.22.50');
ok('bundle completo ativo', P.bundleCompleto === true);
ok('patch no bundle', manifest.includes('ajustes_v52250_exe_bundle_patch.js') && manifest[manifest.length - 1] === 'ajustes_v52250_exe_bundle_patch.js');
ok('patch também entra no files do electron-builder', pkg.build.files.indexOf('ajustes_v52250_exe_bundle_patch.js') >= 0);
ok('index carrega os scripts na versão 5.22.50', /app\.bundle\.js\?v=5\.22\.50/.test(html) && /ajustes_v52250_exe_bundle_patch\.js\?v=5\.22\.50/.test(html));
ok('rodapé 5.22.50', /footer-version/.test(html) && /v5\.22\.50/.test(html));
ok('sem nome pessoal novo', !/kauan/i.test(src.replace(/__KAUAN_REFINO_STATE__/g, '').replace(/kauangabrielcardososilva7890-afk/g, '')));

console.log('\nRESULTADO: v5.22.50 passou!');
