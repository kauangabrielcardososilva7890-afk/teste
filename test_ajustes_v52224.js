const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const cat=fs.readFileSync('ajustes_v52223_cat_letra_patch.js','utf8');
const uma=fs.readFileSync('ajustes_v52224_cat_letra_uma_vez_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

ok('52223 não envolve unificaCat', !/wrapUnifica/.test(cat) && !/unificaCat/.test(cat) && !/categoriaUnificada/.test(cat));
ok('52223 não grava produto', !/p\.categoria\s*=/.test(cat) && !/migrarCategoriasLetra/.test(cat));
ok('52224 não envolve unificaCat', !/unificaCat\s*=/.test(uma) && !/wrapUnifica/.test(uma) && !/\.unificaCat/.test(uma) && !/\.categoriaUnificada/.test(uma));

const ctx={window:{},document:undefined};
new Function('window','document',[cat,uma].join('\n'))(ctx.window,ctx.document);
const C=ctx.window.CAT_LETRA_PURE;
const U=ctx.window.CAT_LETRA_UMA_VEZ_PURE;

ok('helpers P/S/I/C/E', C.letraParaNome('P')==='Produto' && C.letraParaNome('S')==='Serviço' && C.letraParaNome('i')==='Insumo' && C.letraParaNome('C')==='Cartucho' && C.letraParaNome('e')==='Equipamento');
ok('Chip fica', C.ehLetraFiltro('Chip')===false && C.letraParaNome('Chip')==='Chip');

const prods=[{categoria:'P'},{categoria:'Chip'},{categoria:'Original'},{categoria:'S'},{categoria:'Produto'}];
const n=U.corrigirProdutosUmaVez(prods);
ok('só letra isolada no dado', n===2 && prods[0].categoria==='Produto' && prods[3].categoria==='Serviço');
ok('outros filtros ficam', prods[1].categoria==='Chip' && prods[2].categoria==='Original' && prods[4].categoria==='Produto');

ok('patches no bundle', manifest.includes('ajustes_v52223_cat_letra_patch.js') && manifest.includes('ajustes_v52224_cat_letra_uma_vez_patch.js'));
ok('versão 5.22.24', pkg.version==='5.22.24' && html.includes('app.bundle.js?v=5.22.24'));
ok('APK quieto', !/mobile\//.test(cat+uma));
console.log('\nRESULTADO: v5.22.24 passou!');
