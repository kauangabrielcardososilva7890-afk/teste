const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}
const src=fs.readFileSync('ajustes_v52248_exe_cache_patch.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const P=load(src).EXE_CACHE_V52248_PURE;
ok('v8 cache desligado', main.indexOf("v8CacheOptions: 'none'")>=0);
ok('apaga Code Cache na versão nova', main.indexOf('Code Cache')>=0 && main.indexOf('GPUCache')>=0);
ok('loadFile sem query', main.indexOf("loadFile(path.join(__dirname, 'index.html'))")>=0);
ok('asar continua off', pkg.build.asar===false);
ok('pure', P.VERSAO==='5.22.48' && P.v8Cache==='none');
ok('patch no bundle', manifest.includes('ajustes_v52248_exe_cache_patch.js'));
ok('versão', /^5\.22\.\d+/.test(pkg.version) && html.indexOf('app.bundle.js?v=')>=0 && /v5\.22\.\d+/.test(html));
ok('APK quieto', src.indexOf('mobile/')<0);
console.log('\nRESULTADO: v5.22.48 passou!');
