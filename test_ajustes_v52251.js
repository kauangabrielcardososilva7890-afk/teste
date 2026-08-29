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

const src = fs.readFileSync('ajustes_v52251_exe_resiliencia_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const mainJs = fs.readFileSync('main.js', 'utf8');
const P = load(src).EXE_RESILIENCIA_V52251_PURE;

ok('versão 5.22.51', P.VERSAO === '5.22.51' && pkg.version === '5.22.51');
ok('anti tela branca ativo', P.antiTelaBranca === true && P.recuperacaoAutomatica === true);
ok('patch no manifesto do bundle', manifest.includes('ajustes_v52251_exe_resiliencia_patch.js') && manifest[manifest.length - 1] === 'ajustes_v52251_exe_resiliencia_patch.js');
ok('patch no files do electron-builder', pkg.build.files.indexOf('ajustes_v52251_exe_resiliencia_patch.js') >= 0);
ok('index carrega os scripts na versão 5.22.51', /app\.bundle\.js\?v=5\.22\.51/.test(html) && /ajustes_v52251_exe_resiliencia_patch\.js\?v=5\.22\.51/.test(html));
ok('rodapé 5.22.51', /footer-version/.test(html) && /v5\.22\.51/.test(html));
ok('main.js tem fallback seguro de exibição da janela', mainJs.includes('setTimeout') && mainJs.includes('win.show()'));
ok('verificação de sessão segura', P.verificarSessaoSegura(null).logado === false && P.verificarSessaoSegura({ usuarioNome: 'Teste' }).logado === true);
ok('sem nome pessoal novo', !/kauan/i.test(src.replace(/__KAUAN_REFINO_STATE__/g, '').replace(/kauangabrielcardososilva7890-afk/g, '')));

console.log('\nRESULTADO: v5.22.51 passou!');
