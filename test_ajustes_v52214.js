const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const ord=fs.readFileSync('ajustes_v52214_ordenacao_patch.js','utf8');
const rec=fs.readFileSync('ajustes_v52214_recargas_patch.js','utf8');
const fin=fs.readFileSync('ajustes_v52213_financeiro_receber_patch.js','utf8');
const men=fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js','utf8');
const hs=fs.readFileSync('historico_sort_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const cf=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const app=fs.readFileSync('app.js','utf8');

const ctx={window:{},document:undefined};
new Function('window','document',ord+'\n'+rec)(ctx.window,ctx.document);
const O=ctx.window.ORDENACAO_TITULO_PURE;
const R=ctx.window.RECARGAS_PURE;

console.log('== TRAVA / OBSERVER ==');
ok('financeiro sem MutationObserver no body', !/MutationObserver/.test(fin));
ok('menus sem MutationObserver no body', !/MutationObserver/.test(men));
ok('Receber não recria se já existe', /data-fin-receber/.test(fin) && /if\(actions\.querySelector\(\'\[data-fin-receber\]\'\)\) return/.test(fin));

console.log('== ORDENAÇÃO ==');
ok('toggle A→Z / Z→A', O.proximaDir('codigo','asc','codigo')==='desc' && O.proximaDir('codigo','desc','codigo')==='asc');
ok('coluna nova começa asc', O.proximaDir('codigo','desc','nome')==='asc');
ok('historico_sort pula tabela com onclick', /thJaOrdena/.test(hs) && /__hsSort='skip'/.test(hs));
ok('historico_sort stopImmediatePropagation', /stopImmediatePropagation/.test(hs));

console.log('== RECARGAS ==');
ok('código só números', R.soNumeros('AB12-3')==='123');
ok('próximo código', R.proximoCodigoRecarga([{codigo:'7'},{codigo:'12'}],'e1')==='13');
ok('tipo recarga', R.ehTipoRecarga('Recarga de toner') && !R.ehTipoRecarga('Produto'));
ok('sem estoque', R.recargaPodeVenderSemEstoque()===true);
const lista=R.filtrarRecargas([
  {id:'1',empresaId:'e',nome:'HP 85A',codigo:'1',marca:'HP'},
  {id:'2',empresaId:'e',nome:'Toner estoque',codigo:'2',status:'inativo'},
  {id:'3',empresaId:'x',nome:'HP 85A',codigo:'3'}
],'e','85');
ok('filtra recarga ativa da empresa', lista.length===1 && lista[0].id==='1');
ok('submenu Recargas no menu', /id:'recargas'/.test(men));
ok('venda não puxa produto no tipo recarga', /ehRecargaNaVenda/.test(rec) && /pintarBuscaRecargas/.test(rec));
ok('cadastro sem estoque', /semEstoque: true/.test(rec) && /Sem estoque/.test(rec));
ok('busca recargas Enter/lupa', /key==='Enter'/.test(rec) && /aplicarBuscaRecargas/.test(rec));
ok('db.recargas no núcleo', /recargas:\[\]/.test(app) && /'recargas'/.test(app));
ok('nuvem sincroniza recargas', /recargas:'array'/.test(cf));

ok('patches no bundle', manifest.includes('ajustes_v52214_ordenacao_patch.js') && manifest.includes('ajustes_v52214_recargas_patch.js'));
ok('versão 5.22.14', pkg.version==='5.22.14' && html.includes('app.bundle.js?v=5.22.14'));
ok('APK quieto', !/mobile/.test(ord+rec));

console.log('\nRESULTADO: v5.22.14 passou!');
