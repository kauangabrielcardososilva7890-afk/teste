const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52228_a1_nuvem_lupa_ncm_patch.js','utf8');
const ncm=fs.readFileSync('ajustes_v52227_ncm_origem_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const A=ctx.window.A1_NUVEM_USO_PURE;

ok('A1 da nuvem conta', A.temA1Nuvem({fiscal:{a1Nuvem:{data:'data:app;base64,AAA'}}})===true);
ok('sem A1 não conta', A.temA1Nuvem({fiscal:{}})===false);
ok('lupa no hold da caixa', /data-ncm-hold/.test(src) && /translateY\(-50%\)/.test(src));
ok('não pede senha no patch', !/senhaA1|type=\"password\"/.test(src));
ok('ainda não SEFAZ', /não emite na SEFAZ|Ainda não/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52228_a1_nuvem_lupa_ncm_patch.js'));
ok('versão 5.22.28', pkg.version==='5.22.28' && html.includes('app.bundle.js?v=5.22.28'));
ok('APK quieto', !/mobile\//.test(src+ncm));
console.log('\nRESULTADO: v5.22.28 passou!');
