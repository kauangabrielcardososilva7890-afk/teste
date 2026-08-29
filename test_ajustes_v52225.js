const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const del=fs.readFileSync('ajustes_v52225_import_pula_del_patch.js','utf8');
const env=fs.readFileSync('envio_arquivos.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',del)(ctx.window,ctx.document);
const D=ctx.window.IMPORT_DEL_PURE;

ok('DEL S pula', D.ehDel({DEL:'S'})===true && D.ehDel({DEL:'s'})===true);
ok('DEL N entra', D.ehDel({DEL:'N'})===false && D.ehDel({DEL:null})===false && D.ehDel({})===false);
ok('OCULTAR sozinho não pula', D.ehDel({OCULTAR:'S',DEL:'N'})===false);
ok('filtra lista', D.linhasSemDel([{DEL:'S',COD_PRODUTO:1},{DEL:'N',COD_PRODUTO:2}]).length===1);
ok('página define ehDel', /function ehDel\s*\(/.test(env) && /Pulados DEL=S/.test(env));
ok('patch no bundle', manifest.includes('ajustes_v52225_import_pula_del_patch.js'));
ok('versão 5.22.25+', /^5\.22\.(2[5-9]|\d{2,})$/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(del+env));
console.log('\nRESULTADO: v5.22.25 passou!');
