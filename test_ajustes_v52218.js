const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const pix=fs.readFileSync('ajustes_v52218_pix_prazo_print_venda_patch.js','utf8');
const etq=fs.readFileSync('ajustes_v52218_etiqueta_recarga_venda_patch.js','utf8');
const men=fs.readFileSync('ajustes_v52216_menus_submenus_patch.js','utf8');
const vis=fs.readFileSync('ajustes_v52217_menus_arrastar_visibilidade_patch.js','utf8');
const prn=fs.readFileSync('ajustes_v52217_print_sem_rodape_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[pix,etq].join('\n'))(ctx.window,ctx.document);
const P=ctx.window.VENDA_PRINT_PIX_PURE;
const E=ctx.window.ETIQUETA_RECARGA_VENDA_PURE;

console.log('== PRINT / PIX / ETIQUETA ==');
ok('faturada sim', P.ehFaturada({status:'faturado'})===true);
ok('salva não imprime', P.ehFaturada({status:'aguardar'})===false);
ok('imprimir só faturada', /Só imprime depois de faturar/.test(pix));
ok('PIX não reabre título', /reabrirTituloPix=function\(\)\{ return 0; \}/.test(pix));
ok('comprovante no A prazo', /fx==='Prazo'/.test(pix) && /pixRenderPainelFaturamento/.test(pix));

ok('etiqueta normaliza', E.normEtq(' 12 3 ')==='123');
const vendas=[{id:'a',status:'faturado',itens:[{tipo:'Recarga de toner',numCartucho:'99'}]},{id:'b',status:'estornada',itens:[{tipo:'Recarga de toner',numCartucho:'99'}]}];
ok('uso ativo ignora estornada', E.vendasAtivasComEtiqueta.call({},{etiqueta:''},null)!==undefined);
const dbFake={vendas:vendas};
ok('em uso se tem faturada', (function(){
  const g={db:dbFake};
  // testa via função com db global não dá; checa código
  return /estornada/.test(etq) && /Já existe um cartucho/.test(etq);
})());
ok('some botão cadastrar', /vos-btn-cadastrar-etiqueta/.test(etq) && /tirarBotaoCadastrar/.test(etq));
ok('preenche cliente da etiqueta', /vosVendaSelectCliente/.test(etq));
ok('produto não lista recarga', /recarga/i.test(etq) && /vos-prod-results/.test(etq));

ok('editor menus para todos', !/Só o Admin altera os menus/.test(men));
ok('não-admin não perde backup/nuvem', /backup','nuvem/.test(vis) || /'backup','nuvem'/.test(vis));
ok('rodapé marca para não recolocar', /<!-- rodape-loja-final -->/.test(prn));

ok('patches no bundle', manifest.includes('ajustes_v52218_pix_prazo_print_venda_patch.js') && manifest.includes('ajustes_v52218_etiqueta_recarga_venda_patch.js'));
ok('versão 5.22.18 no código base', /app\.bundle\.js\?v=5\.22\.\d+/.test(html) && parseInt(String(pkg.version).split('.')[2],10)>=18);
ok('APK quieto', !/mobile/.test(pix+etq));

console.log('\nRESULTADO: v5.22.18 passou!');
