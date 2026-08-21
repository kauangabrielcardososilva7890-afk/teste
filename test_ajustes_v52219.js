const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const fil=fs.readFileSync('ajustes_v52219_filtros_busca_patch.js','utf8');
const pix=fs.readFileSync('ajustes_v52219_pix_link_publico_patch.js','utf8');
const wrk=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[fil,pix].join('\n'))(ctx.window,ctx.document);
const F=ctx.window.FILTROS_BUSCA_PURE;
const P=ctx.window.PIX_LINK_PUBLICO_PURE;

console.log('== FILTROS BUSCA / PIX LINK ==');
ok('campos cliente iguais ao menu', F.CAMPOS_CLIENTE.some(c=>c[0]==='nome') && F.CAMPOS_CLIENTE.some(c=>c[0]==='documento'));
ok('categorias sem Recarga', F.CATS_PRODUTO.indexOf('Recarga')<0 && F.CATS_PRODUTO.indexOf('Produto')>=0);
ok('todas categorias existe no patch', /Todas categorias/.test(fil));
ok('filtra cliente por nome', F.filtraClientes([{nome:'Colégio Ávila',documento:'1'}],'avila','nome').length===1);
ok('filtra cliente por campo errado vazio', F.filtraClientes([{nome:'Colégio Ávila',documento:'1'}],'avila','documento').length===0);
ok('produto recarga some', F.filtraProdutos([{nome:'Recarga HP',categoria:'Recarga'},{nome:'Toner',categoria:'Produto'}],'','').map(p=>p.nome).join()==='Toner');
ok('produto por categoria', F.filtraProdutos([{nome:'A',categoria:'Chip'},{nome:'B',categoria:'Produto'}], '','Chip').map(p=>p.nome).join()==='A');
ok('recarga por marca', F.filtraRecargas([{nome:'HP 85A',marca:'HP',codigo:'1'},{nome:'Samsung',marca:'Samsung',codigo:'2'}],'hp','marca').length===1);
ok('eh recarga', F.ehRecargaCat('Recarga de toner')===true);

ok('PIX url pública', P.PIX_PUBLICO.indexOf('workers.dev/pix')>0);
ok('PIX monta query', P.pixUrlPublico('000201').indexOf('?c=000201')>0);
ok('não usa githack no link', !/githack/.test(pix));
ok('worker tem /pix', wrk.includes("url.pathname === '/pix'") && wrk.includes('function handlePix'));
ok('pix_pagar no exe', fs.readFileSync('package.json','utf8').includes('pix_pagar.html'));

ok('patches no bundle', manifest.includes('ajustes_v52219_filtros_busca_patch.js') && manifest.includes('ajustes_v52219_pix_link_publico_patch.js'));
ok('versão 5.22.19', pkg.version==='5.22.19' && html.includes('app.bundle.js?v=5.22.19'));
ok('APK quieto', !/mobile/.test(fil+pix));
ok('etiqueta mesma caixa', /vos-item-cartucho/.test(fil) && /escreve e segue/.test(fil));

console.log('\nRESULTADO: v5.22.19 passou!');
