const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('cartuchos_etiquetas_config_patch.js','utf8');
const db={
  config:{},
  produtos:[
    {id:'p1',empresaId:'emp',sku:'CARTVAZ-9',nome:'Cartucho Vazio TONER HP 85A',categoria:'Cartucho Vazio',cartuchoCodigoAntigo:'9'},
    {id:'p2',empresaId:'emp',sku:'20',nome:'Pó toner',categoria:'Insumo'}
  ],
  modulosDinamicos:{
    ITENS_VENDA:{dados:[{COD_ITENS_VENDA:1,COD_VENDA:10,COD_CARTUCHO:9,ETIQUETA:'000123',SITUACAO:'RECICLANDO'}]},
    PRODUTOS_VARIACAO:{dados:[{PRV_CODIGO:2,PRV_IDENTIFICACAO:'ABC-777',PRV_QTDE:1}]},
    CLIENTES:{dados:[{COD_CLIENTE:1,NOME:'Cliente'}]}
  }
};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.CARTUCHOS_ETIQUETAS_PURE;
console.log('== CARTUCHOS_ETIQUETAS_PURE ==');
ok('exporta funções puras', !!P && typeof P.extrairEtiquetasLegado==='function');
const etiquetas=P.extrairEtiquetasLegado(db);
ok('extrai etiquetas só de tabelas de cartucho/recarga', etiquetas.length===2 && etiquetas.some(e=>e.etiqueta==='000123') && etiquetas.some(e=>e.etiqueta==='ABC-777'));
ok('calcula maior número de etiqueta', P.maiorNumeroEtiqueta(etiquetas)===777);
ok('gera sequência numérica sem letras e sem zeros à esquerda', P.gerarSequenciaEtiquetas(778,3).join(',')==='778,779,780');
ok('capacidade padrão é máxima compacta na folha', P.ETQ_CAPACIDADE===126 && P.gerarSequenciaEtiquetas(1,999).length===126);
ok('gera intervalo manual de etiquetas do início ao final', P.gerarIntervaloEtiquetas(509,634).length===126 && P.gerarIntervaloEtiquetas(509,634)[125]==='634');
const r=P.aplicarConfiguracoesCartuchos(db,{empresaId:'emp'});
ok('aplica configuração e sugere próximo número', r.proximoNumero===778 && db.config.cartuchosRecargas.etiquetas.codigoSomenteNumerico===true);
ok('remove cartucho vazio do estoque de produtos', r.produtosCartuchoVazioRemovidos===1 && db.produtos.length===1 && db.produtos[0].id==='p2');
ok('regra mantém cartucho vazio fora de produtos', db.config.cartuchosRecargas.regras.cartuchoVazioComoProduto===false);
const svg=P.code39Svg('000778');
ok('gera código de barras em svg', svg.includes('<svg') && svg.includes('<rect'));
const html=P.htmlEtiquetas(['778','779']);
ok('html de impressão contém etiquetas pequenas', html.includes('778') && html.includes('DIGICOPY') && html.includes('14mm') && html.includes('repeat(7'));
console.log('\nRESULTADO: Testes de etiquetas/configuração de cartuchos passaram!');
