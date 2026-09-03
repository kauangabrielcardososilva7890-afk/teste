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

const src = fs.readFileSync('ajustes_v52252_resolucao_loop_patch.js', 'utf8');
const p50 = fs.readFileSync('ajustes_v52250_exe_bundle_patch.js', 'utf8');
const p49 = fs.readFileSync('ajustes_v52249_relatorio_patch.js', 'utf8');
const p46 = fs.readFileSync('ajustes_v52246_nuvem_nao_autorizar_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const P = load(src).RESOLUCAO_LOOP_V52252_PURE;

ok('versão 5.22.52 base', P.VERSAO === '5.22.52' && /^5\.22\.\d+/.test(pkg.version));
ok('sem loop de observer ativo', P.semLoopObserver === true);
ok('patch 50 sem MutationObserver em documentElement', !p50.includes('MutationObserver'));
ok('patch 49 sem MutationObserver em documentElement', !p49.includes('MutationObserver'));
ok('patch 46 sem MutationObserver em documentElement', !p46.includes('MutationObserver'));
ok('patch no manifesto do bundle', manifest.includes('ajustes_v52252_resolucao_loop_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52252_resolucao_loop_patch.js'));
ok('index carrega os scripts na versão 5.22', /app\.bundle\.js\?v=5\.22\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52252_resolucao_loop_patch.js'));
ok('rodapé na versão 5.22', /footer-version/.test(html) && /v5\.22\.\d+/.test(html));
ok('sem nome pessoal novo', !/kauan/i.test(src.replace(/__KAUAN_REFINO_STATE__/g, '').replace(/kauangabrielcardososilva7890-afk/g, '')));

console.log('\nRESULTADO: v5.22.52 passou!');
