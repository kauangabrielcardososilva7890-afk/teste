const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const src=fs.readFileSync('ajustes_v52220_lupa_alinha_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
console.log('== LUPA ALINHA ==');
ok('pure ok', ctx.window.LUPA_ALINHA_PURE && ctx.window.LUPA_ALINHA_PURE.ok===true);
ok('monta linha filtro', /data-filtro-row/.test(src) && /absolute/.test(src));
ok('não usa flex no pai da lupa absoluta', /tiraFlexQuebrado/.test(src));
ok('no bundle', manifest.includes('ajustes_v52220_lupa_alinha_patch.js'));
ok('versão 5.22.20', pkg.version==='5.22.20' && html.includes('app.bundle.js?v=5.22.20'));
ok('APK quieto', !/mobile/.test(src));
console.log('\nRESULTADO: v5.22.20 passou!');
