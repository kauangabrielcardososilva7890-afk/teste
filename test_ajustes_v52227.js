const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const lupa=fs.readFileSync('ajustes_v52227_lupa_filtro_cli_patch.js','utf8');
const ncm=fs.readFileSync('ajustes_v52227_ncm_origem_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[lupa,ncm].join('\n'))(ctx.window,ctx.document);
const L=ctx.window.LUPA_FILTRO_CLI_PURE;
const N=ctx.window.NCM_ORIGEM_PURE;

ok('reconhece enfeite', L.ehEnfeite({tagName:'I', className:'ph ph-magnifying-glass absolute left-3'})===true);
ok('não apaga botão', L.ehEnfeite({tagName:'BUTTON', className:'ph-magnifying-glass'})===false);
ok('origens oficiais 0 a 8', N.ORIGENS.length===9 && N.ORIGENS[0].indexOf('0 -')===0 && N.ORIGENS[8].indexOf('8 -')===0);
ok('origem 6 existe', N.origemPorCodigo('6').indexOf('CAMEX')>=0);
ok('NCM só dígito', N.soNcm('8443.99.32')==='84439932');
ok('busca Enter/lupa no patch', /key==='Enter'/.test(ncm) && /buscarNcmProduto/.test(ncm));
ok('patches no bundle', manifest.includes('ajustes_v52227_lupa_filtro_cli_patch.js') && manifest.includes('ajustes_v52227_ncm_origem_patch.js'));
ok('versão 5.22.27', pkg.version==='5.22.27' && html.includes('app.bundle.js?v=5.22.27'));
ok('APK quieto', !/mobile\//.test(lupa+ncm));
console.log('\nRESULTADO: v5.22.27 passou!');
