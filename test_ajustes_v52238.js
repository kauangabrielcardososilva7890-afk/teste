const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const orc=fs.readFileSync('ajustes_v52238_orcamentos_ajustes_patch.js','utf8');
const ven=fs.readFileSync('ajustes_v52238_vendas_os_ajustes_patch.js','utf8');
const pag=fs.readFileSync('orcamento_pagar.html','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const O=load(orc).ORCAMENTOS_V52238_PURE;
const V=load(ven).V52238_VENDAS_PURE;
const link=O.linkOrcamento({token:'tok',numero:'12',total:10,itens:[{descricao:'Toner',qtd:1,preco:10,subtotal:10}]},{nome:'Maria'},{whatsapp:'38991098698'});

ok('link NÃO é o Pages do Pix', link.indexOf('digicopy-pix.pages.dev')<0);
ok('link é a página de orçamento', /orcamento_pagar\.html\?d=/.test(link));
ok('recusa cita não autorizado', /NÃO foi autorizado/.test(O.msgRecusa({numero:'12'},{nome:'Maria'})));
ok('página pede escolher autorizar ou recusar', /Autorizar/.test(pag) && /Recusar/.test(pag) && /não é pagamento/i.test(pag));
ok('OS com dado conta na impressão', V.osTemDado({modelo:'HP',numeroSerie:'1'})===true);
ok('técnico Selecione é vazio', V.ehVazioTec('Selecione')===true && V.ehVazioTec('João')===false);
ok('patches no bundle', manifest.includes('ajustes_v52238_orcamentos_ajustes_patch.js') && manifest.includes('ajustes_v52238_vendas_os_ajustes_patch.js'));
ok('versão 5.22.38', pkg.version==='5.22.38' && html.includes('app.bundle.js?v=5.22.38'));
ok('APK quieto', !/mobile\//.test(orc+ven));
console.log('\nRESULTADO: v5.22.38 passou!');
