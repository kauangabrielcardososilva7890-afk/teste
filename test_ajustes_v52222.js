const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const men=fs.readFileSync('ajustes_v52222_menus_arrastar_patch.js','utf8');
const ncm=fs.readFileSync('ajustes_v52222_ncm_import_patch.js','utf8');
const env=fs.readFileSync('envio_arquivos.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{IMPORT_PRODUTOS_PURE:{mapearProduto:function(row){return {sku:'1',nome:'X'};}}},document:undefined};
new Function('window','document',[ncm,men].join('\n'))(ctx.window,ctx.document);
const N=ctx.window.NCM_IMPORT_PURE;
const M=ctx.window.MENUS_ARRASTAR_SO_PURE;

console.log('== MENUS ARRASTAR ==');
ok('esconde setas', typeof M.esconderSetas==='function' && /↑/.test(men));

console.log('== NCM ==');
ok('lê NCM da linha do produto', N.ncmDaLinha({PR_NCM:'8443.99.00'})==='84439900');
const cat=N.mapaNcm([{NC_CODIGO:'7',NC_NCM:'8471.30.12'}]);
ok('liga pelo código da tabela NCM', N.ncmDoProduto({CODIGO:'10',COD_NCM:'7'},cat)==='84713012');
ok('liga pelo sku no NCM', N.ncmDoProduto({CODIGO:'88'}, N.mapaNcm([{COD_PRODUTO:'88',NCM:'12345678'}]))==='12345678');
ok('página recebe NCM.json', /arq-ncm/.test(env) && /NCM\.json/.test(env));

ok('patches no bundle', manifest.includes('ajustes_v52222_menus_arrastar_patch.js') && manifest.includes('ajustes_v52222_ncm_import_patch.js'));
ok('versão 5.22.22+', /^5\.22\.(2[2-9]|\d{2,})$/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(men+ncm+env));
console.log('\nRESULTADO: v5.22.22 passou!');
