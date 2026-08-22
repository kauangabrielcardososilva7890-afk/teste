const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52235_codigo_sem_sku_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const P=ctx.window.CODIGO_SEM_SKU_PURE;

ok('SKU vira Código', P.textoCodigo('SKU')==='Código' && P.textoCodigo('SKU: 12')==='Código: 12');
ok('Código / SKU vira Código', P.textoCodigo('Código / SKU')==='Código');
ok('Total SKUs some', P.textoCodigo('Total SKUs')==='Total de produtos');
ok('não apaga o campo interno', /campo interno continua sku/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52235_codigo_sem_sku_patch.js'));
ok('versão 5.22.35+', /^5\.22\.(3[5-9]|\d{3,})$/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.35 passou!');
