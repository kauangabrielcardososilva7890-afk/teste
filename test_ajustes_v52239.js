const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const print=fs.readFileSync('ajustes_v52239_print_escolha_patch.js','utf8');
const patri=fs.readFileSync('ajustes_v52239_patri_nao_obrigatorio_patch.js','utf8');
const erro=fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js','utf8');
const menus=fs.readFileSync('ajustes_v52239_menus_imediato_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const P=load(print).V52239_PRINT_PURE;
const base='<html><head><style>x</style></head><body><div class="pagina meia">NOTA</div>\n  <script>1</script></body></html>';
const duasVenda=P.montarVias(base,'venda',2);
const duasOs=P.montarVias(base.replace('meia','inteira'),'os',2);
ok('2 vias venda duplica a meia folha', (duasVenda.match(/NOTA/g)||[]).length===2);
ok('2 vias venda não força outra folha', !/page-break-after:always/.test(duasVenda));
ok('2 vias OS são folhas separadas', /page-break-after:always/.test(duasOs) && (duasOs.match(/NOTA/g)||[]).length===2);
ok('venda tira EPSON', P.aplicarTipo('<div class="aviso-epson">x</div>','venda').indexOf('aviso-epson')<0);

const T=load(patri).V52239_PATRI_PURE;
ok('OS completa sem patrimônio', T.osCompletaSemPatri({modelo:'HP',numeroSerie:'1',tecnico:'João'})===true);
ok('OS sem técnico não fecha', T.osCompletaSemPatri({modelo:'HP',numeroSerie:'1',patrimonio:'P',tecnico:''})===false);

const E=load(erro).V52239_ERRO_PURE;
ok('ruído ResizeObserver ignorado', E.ignoraRuido('ResizeObserver loop')===true);
ok('erro real não ignorado', E.ignoraRuido('Cannot read properties of null')===false);
ok('detalhe cabe na auditoria', E.detalheErro('falhou','a.js:10').indexOf('falhou')>=0);

const M=load(menus).V52239_MENUS_PURE;
const loc=M.garantirLocacao([{id:'locacao',items:[{id:'contratos',label:'Contratos'}]}]);
ok('locação guarda leituras e parque', loc[0].items.some(function(i){return i.id==='leituras';}) && loc[0].items.some(function(i){return i.id==='parque';}));

ok('orçamentos já no HTML', /navigateTo\('orcamentos'\)/.test(html));
ok('patches no bundle', ['ajustes_v52239_print_escolha_patch.js','ajustes_v52239_patri_nao_obrigatorio_patch.js','ajustes_v52239_avisos_erro_auditoria_patch.js','ajustes_v52239_menus_imediato_patch.js'].every(function(f){return manifest.includes(f);}));
ok('versão no patch', /v5.22.39/.test(print+patri+erro+menus));
ok('APK quieto', ![print,patri,erro,menus].some(function(s){return /mobile\//.test(s);}));
console.log('\nRESULTADO: v5.22.39 passou!');
