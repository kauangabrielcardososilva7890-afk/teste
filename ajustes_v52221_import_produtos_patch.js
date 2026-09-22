// ═══════════════════════════════════════════════════════════════════════════
// v5.22.21 — Importação pontual PRODUTOS + PRODUTOS_CATEGORIA
// • Dedupe só nesta importação, por código/SKU
// • Não vira regra automática da nuvem
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function linhasDeJson(raw){
  if(Array.isArray(raw)) return raw;
  if(!raw || typeof raw !== 'object') return [];
  if(Array.isArray(raw.data)) return raw.data;
  if(Array.isArray(raw.dados)) return raw.dados;
  var keys = Object.keys(raw);
  for(var i=0;i<keys.length;i++){
    var k = keys[i];
    var v = raw[k];
    if(Array.isArray(v) && v.length && typeof v[0] === 'object') return v;
    if(v && typeof v === 'object' && Array.isArray(v.data)) return v.data;
  }
  return [];
}
function skuDe(row){
  return txt(row && (row.CODIGO || row.SKU || row.COD_PRODUTO || row.CODIGO_PRODUTO || row.codigo || row.sku));
}
function nomeDe(row){
  return txt(row && (row.DESCRICAO || row.NOME || row.PRODUTO || row.nome || row.descricao));
}
function mapaCategorias(rows){
  var mapa = {};
  (rows||[]).forEach(function(r){
    var c = txt(r.PRC_CODIGO || r.CODIGO || r.ID || r.COD_CATEGORIA);
    var n = txt(r.PRC_DESCRICAO || r.DESCRICAO || r.NOME || r.CATEGORIA);
    if(c && n) mapa[c] = n;
  });
  return mapa;
}
function categoriaDe(row, cats){
  var cod = txt(row && (row.COD_CATEGORIA || row.CATEGORIA_ID || row.PRC_CODIGO || row.GRUPO));
  if(cod && cats && cats[cod]) return cats[cod];
  return txt(row && (row.CATEGORIA || row.TIPO || row.GRUPO_NOME)) || 'Produto';
}
function mapearProduto(row, cats){
  return {
    sku: skuDe(row),
    nome: nomeDe(row),
    categoria: categoriaDe(row, cats),
    fabricante: txt(row && (row.FABRICANTE || row.MARCA || row.fabricante)),
    estoque: parseInt(row && (row.ESTOQUE || row.QTD || row.QUANTIDADE), 10) || 0,
    estoqueMin: parseInt(row && (row.ESTOQUE_MINIMO || row.ESTOQUE_MIN), 10) || 0,
    custo: parseFloat(row && (row.CUSTO || row.PRECO_CUSTO)) || 0,
    preco: parseFloat(row && (row.PRECO || row.VALOR || row.PRECO_VENDA)) || 0,
    // v5.22.84 — "Local" do produto aposentado: nem importado ele entra na base
    ncm: txt(row && (row.NCM || row.PR_NCM || row.ncm)).replace(/\D/g,'').slice(0,8),
    status: 'ativo'
  };
}
function dedupePorSku(existentes, novos){
  var seen = {};
  (existentes||[]).forEach(function(p){
    var k = txt(p && p.sku);
    if(k) seen[k] = p;
  });
  var out = [];
  (novos||[]).forEach(function(n){
    if(!n || !n.sku || !n.nome) return;
    var k = String(n.sku);
    if(seen[k]) out.push({ tipo:'upd', atual: seen[k], novo: n });
    else { seen[k] = n; out.push({ tipo:'new', novo: n }); }
  });
  return out;
}

window.IMPORT_PRODUTOS_PURE = {
  linhasDeJson: linhasDeJson,
  skuDe: skuDe,
  nomeDe: nomeDe,
  mapaCategorias: mapaCategorias,
  mapearProduto: mapearProduto,
  dedupePorSku: dedupePorSku
};

console.log('[DIGICOPY] v5.22.21 importação pontual de produtos');
})();
