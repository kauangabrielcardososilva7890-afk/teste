// ═══════════════════════════════════════════════════════════════════════════
// v5.22.22 — Liga NCM no produto (tabela NCM do sistema antigo + campo no produto)
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function soNcm(v){ return txt(v).replace(/\D/g,'').slice(0,8); }
function ncmDaLinha(row){
  return soNcm(row && (row.NCM || row.PR_NCM || row.NC_NCM || row.CODIGO_NCM || row.ncm));
}
function refNcmDaLinha(row){
  return txt(row && (row.COD_NCM || row.PR_COD_NCM || row.NCM_ID || row.NC_CODIGO || row.CODIGO_NCM_TAB));
}
function skuDaLinha(row){
  return txt(row && (row.COD_PRODUTO || row.CODIGO_PRODUTO || row.SKU || row.PR_CODIGO || row.CODIGO));
}
function mapaNcm(rows){
  var porCodigo = {};
  var porSku = {};
  (rows||[]).forEach(function(r){
    var ncm = ncmDaLinha(r);
    var cod = txt(r && (r.NC_CODIGO || r.CODIGO || r.ID));
    var sku = skuDaLinha(r);
    if(cod && ncm) porCodigo[cod] = ncm;
    if(sku && ncm && sku !== cod) porSku[sku] = ncm;
  });
  return { porCodigo: porCodigo, porSku: porSku };
}
function ncmDoProduto(rowProd, catalogo){
  var direto = ncmDaLinha(rowProd);
  if(direto.length===8) return direto;
  catalogo = catalogo || { porCodigo:{}, porSku:{} };
  var ref = refNcmDaLinha(rowProd);
  if(ref && catalogo.porCodigo[ref]) return catalogo.porCodigo[ref];
  var sku = skuDaLinha(rowProd);
  if(sku && catalogo.porSku[sku]) return catalogo.porSku[sku];
  if(sku && catalogo.porCodigo[sku]) return catalogo.porCodigo[sku];
  return direto;
}

window.NCM_IMPORT_PURE = {
  soNcm: soNcm,
  ncmDaLinha: ncmDaLinha,
  refNcmDaLinha: refNcmDaLinha,
  mapaNcm: mapaNcm,
  ncmDoProduto: ncmDoProduto
};

if(window.IMPORT_PRODUTOS_PURE && typeof window.IMPORT_PRODUTOS_PURE.mapearProduto==='function' && !window.IMPORT_PRODUTOS_PURE.mapearProduto.__v52222ncm){
  var oldMap = window.IMPORT_PRODUTOS_PURE.mapearProduto;
  window.IMPORT_PRODUTOS_PURE.mapearProduto = function(row, cats, catalogo){
    var p = oldMap(row, cats);
    p.ncm = ncmDoProduto(row, catalogo);
    return p;
  };
  window.IMPORT_PRODUTOS_PURE.mapearProduto.__v52222ncm = true;
  window.IMPORT_PRODUTOS_PURE.ncmDoProduto = ncmDoProduto;
  window.IMPORT_PRODUTOS_PURE.mapaNcm = mapaNcm;
}

console.log('[DIGICOPY] v5.22.22 NCM no produto');
})();
