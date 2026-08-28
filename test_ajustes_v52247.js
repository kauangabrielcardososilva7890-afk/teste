const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}
const src=fs.readFileSync('ajustes_v52247_exe_atualiza_patch.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const P=load(src).EXE_ATUALIZA_V52247_PURE;
ok('asar desligado no pack', pkg.build.asar===false && String(pkg.scripts['build:win']).indexOf('asar=false')>=0);
ok('limpa dist antes de gerar', String(pkg.scripts['build:win']).indexOf('clean_dist.js')>=0 && fs.existsSync('clean_dist.js'));
ok('package.json entra no exe', pkg.build.files.indexOf('package.json')>=0);
ok('main limpa cache na versão nova', main.indexOf('clearCache')>=0 && main.indexOf('app-version.txt')>=0 && main.indexOf('disable-http-cache')>=0);
ok('loadFile com versão', main.indexOf('APP_VERSION')>=0 && main.indexOf('loadFile')>=0);
ok('pure', P.asar===false && P.limpaCacheNaVersao===true && P.VERSAO==='5.22.47');
ok('patch no bundle', manifest.includes('ajustes_v52247_exe_atualiza_patch.js'));
ok('versão', String(pkg.version).indexOf('5.22.')===0 && html.indexOf('app.bundle.js?v=')>=0);
ok('APK quieto', src.indexOf('mobile/')<0 && main.indexOf('mobile/')<0);
console.log('\nRESULTADO: v5.22.47 passou!');
