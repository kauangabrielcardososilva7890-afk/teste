const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52230_modo_escuro_dispositivo_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const store={};
const ctx={
  window:{},
  document:undefined,
  localStorage:{
    getItem:function(k){return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null;},
    setItem:function(k,v){store[k]=String(v);}
  }
};
new Function('window','document','localStorage',src)(ctx.window,ctx.document,ctx.localStorage);
const P=ctx.window.MODO_ESCURO_PURE;

ok('chave local do aparelho', P.KEY.indexOf('dispositivo')>0 && P.KEY.indexOf('escuro')>0);
ok('grava e lê', P.gravarEscuro(true)===true && P.lerEscuro()===true);
ok('desliga', P.gravarEscuro(false)===true && P.lerEscuro()===false);
ok('não usa db.config', !/db\.config\.escuro|db\.config\.dark/.test(src));
ok('card em Configurações', /ui-escuro-dispositivo-card/.test(src) && /Modo escuro/.test(src));
ok('index evita flash', /digicopy_ui_modo_escuro_dispositivo_v1/.test(html));
ok('patch no bundle', manifest.includes('ajustes_v52230_modo_escuro_dispositivo_patch.js'));
ok('versão 5.22.30+', /^5\.22\.\d+/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.30 passou!');
