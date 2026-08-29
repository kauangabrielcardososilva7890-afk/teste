// ═══════════════════════════════════════════════════════════════════════════
// v5.22.44 — Link do cliente: Autorizar gera venda salva; Recusar some o
//            orçamento. O sistema consulta a nuvem mesmo quando o GET
//            responde USED.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var API = 'https://digicopy-sync-api.kauangabrielcardososilva7890.workers.dev';

function txt(v){ return String(v==null?'':v).trim(); }

function vendaIdDe(o){ return 'vda_orc_' + String(o && o.id || ''); }

function acharVenda(o){
  if(!o || typeof db==='undefined') return null;
  return (db.vendas||[]).find(function(v){
    return v && (v.id===o.vendaId || v.origemOrcamentoId===o.id || v.id===vendaIdDe(o));
  })||null;
}

function aplicarAprovado(o, j){
  if(!o || typeof db==='undefined') return null;
  if(j && j.vendaId) o.vendaId = o.vendaId || j.vendaId;
  if(j && j.vendaNumero) o.vendaNumero = j.vendaNumero;
  if(!o.vendaId) o.vendaId = vendaIdDe(o);
  var ja = acharVenda(o);
  if(ja){
    o.status='aprovado';
    o.vendaId=ja.id;
    o.vendaNumero=ja.numero||o.vendaNumero;
    return ja;
  }
  if(typeof window.aprovarOrcamentoInterno==='function'){
    var venda = window.aprovarOrcamentoInterno(o.id, 'cliente');
    if(venda && o.vendaId && venda.id!==o.vendaId && !(db.vendas||[]).some(function(v){ return v.id===o.vendaId && v!==venda; })){
      venda.id = o.vendaId;
    }
    return venda;
  }
  o.status='aprovado';
  return null;
}

function aplicarRecusado(o){
  if(!o) return;
  o.status='excluido';
  o.recusadoEm = o.recusadoEm || new Date().toISOString();
  if(typeof saveDB==='function') saveDB();
}

function aplicarDecisao(o, j){
  if(!o || !j) return;
  var st = txt(j.status).toLowerCase();
  if(j.excluido) st = 'recusado';
  if(j.error==='USED' && !st) st = 'recusado';
  if(st==='aprovado'){
    aplicarAprovado(o, j);
    if(typeof saveDB==='function') saveDB();
  } else if(st==='recusado' || st==='excluido'){
    aplicarRecusado(o);
  }
}

window.ORCAMENTOS_AUTORIZAR_V52244_PURE = {
  vendaIdDe: vendaIdDe,
  aplicarDecisao: function(o, j){
    var c = Object.assign({}, o||{});
    var st = txt(j && j.status).toLowerCase();
    if(j && j.excluido) st='recusado';
    if(st==='aprovado'){ c.status='aprovado'; c.vendaId=c.vendaId||(j&&j.vendaId)||vendaIdDe(c); }
    if(st==='recusado') c.status='excluido';
    return c;
  }
};

if(typeof document==='undefined') return;

function puxarAprovacoes(){
  if(typeof db==='undefined') return;
  (db.orcamentos||[]).filter(function(o){
    if(!o || !o.token || o.status==='excluido' || o.status==='estornado') return false;
    if(o.status==='aprovado' && acharVenda(o)) return false;
    return true;
  }).slice(0,15).forEach(function(o){
    if(o.status==='aprovado' && o.vendaId && acharVenda(o)) return;
    fetch(API+'/orcamento?c='+encodeURIComponent(o.token))
      .then(function(r){ return r.json().then(function(j){ return j; }); })
      .then(function(j){
        if(!j) return;
        aplicarDecisao(o, j);
        if(typeof window.renderOrcamentos==='function') window.renderOrcamentos();
        if(typeof window.renderVendas==='function') window.renderVendas();
      }).catch(function(){});
  });
}

window.puxarAprovacoesOrcamento = puxarAprovacoes;

if(typeof window.DIGICOPY_CLOUD_SYNC==='object' && window.DIGICOPY_CLOUD_SYNC.tick && !window.DIGICOPY_CLOUD_SYNC.tick.__v52244orc){
  var oldT=window.DIGICOPY_CLOUD_SYNC.tick;
  window.DIGICOPY_CLOUD_SYNC.tick=function(){
    var p=oldT.apply(this, arguments);
    /* v5.22.62 nao puxa no tick da nuvem */
    return p;
  };
  window.DIGICOPY_CLOUD_SYNC.tick.__v52244orc=true;
}

if(typeof window.salvarOrcamentoTela==='function' && !window.salvarOrcamentoTela.__v52244sync){
  var oldSal=window.salvarOrcamentoTela;
  window.salvarOrcamentoTela=function(){
    var r=oldSal.apply(this, arguments);
    try{
      if(window.DIGICOPY_CLOUD_SYNC && typeof window.DIGICOPY_CLOUD_SYNC.tick==='function'){
        window.DIGICOPY_CLOUD_SYNC.tick();
      }
    }catch(e){}
    return r;
  };
  window.salvarOrcamentoTela.__v52244sync=true;
}

if(typeof window.imprimirOrcamento==='function' && !window.imprimirOrcamento.__v52244sync){
  var oldImp=window.imprimirOrcamento;
  window.imprimirOrcamento=function(){
    try{
      if(typeof window.salvarOrcamentoTela==='function') window.salvarOrcamentoTela();
      if(window.DIGICOPY_CLOUD_SYNC && typeof window.DIGICOPY_CLOUD_SYNC.tick==='function'){
        window.DIGICOPY_CLOUD_SYNC.tick();
      }
    }catch(e){}
    return oldImp.apply(this, arguments);
  };
  window.imprimirOrcamento.__v52244sync=true;
}

if(typeof window.renderOrcamentos==='function' && !window.renderOrcamentos.__v52244orc){
  var oldR=window.renderOrcamentos;
  window.renderOrcamentos=function(){
    var r=oldR.apply(this, arguments);
    try{
      var agora=Date.now();
/* v5.22.62 render nao dispara poll */
    }catch(e){}
    return r;
  };
  window.renderOrcamentos.__v52244orc=true;
}

setTimeout(puxarAprovacoes, 2500);
/* v5.22.62 sem poll 20s */

console.log('[DIGICOPY] v5.22.44 orçamento: autorizar gera venda, recusar exclui');
})();
