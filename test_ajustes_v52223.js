const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const cat=fs.readFileSync('ajustes_v52223_cat_letra_patch.js','utf8');
const men=fs.readFileSync('ajustes_v52223_menus_arraste_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[cat,men].join('\n'))(ctx.window,ctx.document);
const C=ctx.window.CAT_LETRA_PURE;
const M=ctx.window.MENUS_ARRASTE_PURE;

console.log('== LETRA FILTRO ==');
ok('P vira Produto', C.letraParaNome('P')==='Produto' && C.letraParaNome('p')==='Produto');
ok('S/I/C/E', C.letraParaNome('S')==='Serviço' && C.letraParaNome('i')==='Insumo' && C.letraParaNome('C')==='Cartucho' && C.letraParaNome('e')==='Equipamento');
ok('Chip não é letra', C.ehLetraFiltro('Chip')===false && C.letraParaNome('Chip')==='Chip');
ok('só letra isolada', C.ehLetraFiltro('P')===true && C.ehLetraFiltro('Produto')===false);

console.log('== MENUS ==');
ok('apaga seta de verdade', /b.remove()/.test(men) && typeof M.apagarSetas==='function');
ok('segue o mouse', /pointermove/.test(men) && /ghost/.test(men));

ok('patches no bundle', manifest.includes('ajustes_v52223_cat_letra_patch.js') && manifest.includes('ajustes_v52223_menus_arraste_patch.js'));
ok('versão 5.22.23', pkg.version==='5.22.23' && html.includes('app.bundle.js?v=5.22.23'));
ok('APK quieto', !/mobile\//.test(cat+men));
console.log('\nRESULTADO: v5.22.23 passou!');
