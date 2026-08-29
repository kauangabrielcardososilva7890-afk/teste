// ═══════════════════════════════════════════════════════════════════════════
// v5.22.61 — Orçamento: apagou não volta. Aviso no sino do PC, sem popup.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var VERSAO = '5.22.61';

function txt(v){ return String(v==null?'':v).trim(); }

function getDb(){
  if(typeof window!=='undefined' && window.db) return window.db;
  if(typeof db!=='undefined') return db;
  return {};
}

function bloqueio(dbRef){
  dbRef = dbRef || {};
  if(!dbRef.__orcBloqueio || typeof dbRef.__orcBloqueio!=='object'){
    dbRef.__orcBloqueio = { orcIds:[], tokens:[], vendaIds:[], orcSemRecriarVenda:[] };
  }
  var b = dbRef.__orcBloqueio;
  b.orcIds = Array.isArray(b.orcIds)?b.orcIds:[];
  b.tokens = Array.isArray(b.tokens)?b.tokens:[];
  b.vendaIds = Array.isArray(b.vendaIds)?b.vendaIds:[];
  b.orcSemRecriarVenda = Array.isArray(b.orcSemRecriarVenda)?b.orcSemRecriarVenda:[];
  if(Array.isArray(dbRef.__orcExcluidos)){
    dbRef.__orcExcluidos.forEach(function(x){
      var s = txt(x);
      if(!s) return;
      if(s.indexOf('orc_tok_')===0 || s.length>20){ if(b.tokens.indexOf(s)<0) b.tokens.push(s); }
      if(b.orcIds.indexOf(s)<0) b.orcIds.push(s);
    });
  }
  return b;
}

function tem(arr, id){
  var s = txt(id);
  if(!s) return false;
  return (arr||[]).indexOf(s)>=0;
}

function addUniq(arr, id){
  var s = txt(id);
  if(!s) return arr;
  if(arr.indexOf(s)<0) arr.push(s);
  return arr;
}

function orcamentoBloqueado(o, dbRef){
  if(!o) return true;
  var b = bloqueio(dbRef);
  if(txt(o.status)==='excluido' || txt(o.status)==='estornado') return true;
  if(tem(b.orcIds, o.id) || tem(b.tokens, o.token)) return true;
  return false;
}

function naoRecriarVenda(o, dbRef){
  if(!o) return true;
  if(orcamentoBloqueado(o, dbRef)) return true;
  var b = bloqueio(dbRef);
  if(tem(b.orcSemRecriarVenda, o.id) || tem(b.orcSemRecriarVenda, o.token)) return true;
  if(o.vendaExcluidaPeloUsuario) return true;
  if(o.vendaId && tem(b.vendaIds, o.vendaId)) return true;
  return false;
}

function marcarOrcamentoExcluido(o, dbRef){
  if(!o) return;
  var b = bloqueio(dbRef);
  addUniq(b.orcIds, o.id);
  addUniq(b.tokens, o.token);
  addUniq(b.vendaIds, o.vendaId);
  addUniq(b.orcSemRecriarVenda, o.id);
  o.status = 'excluido';
  o.excluidoEm = o.excluidoEm || new Date().toISOString();
}

function marcarVendaExcluida(v, dbRef){
  if(!v) return;
  var b = bloqueio(dbRef);
  addUniq(b.vendaIds, v.id);
  var oid = v.origemOrcamentoId;
  if(oid){
    addUniq(b.orcSemRecriarVenda, oid);
    var o = ((dbRef&&dbRef.orcamentos)||[]).find(function(x){ return x && x.id===oid; });
    if(o){
      o.vendaExcluidaPeloUsuario = true;
      addUniq(b.orcSemRecriarVenda, o.token);
    }
  }
}

function vendaPodeFicar(v, dbRef){
  if(!v) return false;
  var b = bloqueio(dbRef);
  if(tem(b.vendaIds, v.id)) return false;
  if(v.origemOrcamentoId && tem(b.orcIds, v.origemOrcamentoId)) return false;
  if(v.origemOrcamentoId && tem(b.orcSemRecriarVenda, v.origemOrcamentoId)) return false;
  var o = ((dbRef&&dbRef.orcamentos)||[]).find(function(x){ return x && x.id===v.origemOrcamentoId; });
  if(o && orcamentoBloqueado(o, dbRef)) return false;
  if(o && naoRecriarVenda(o, dbRef)) return false;
  return true;
}

function orcamentoPodeFicar(o, dbRef){
  if(!o) return false;
  return !orcamentoBloqueado(o, dbRef);
}

window.ORCAMENTO_NAO_VOLTA_V52261_PURE = {
  VERSAO: VERSAO,
  orcamentoBloqueado: orcamentoBloqueado,
  naoRecriarVenda: naoRecriarVenda,
  marcarOrcamentoExcluido: marcarOrcamentoExcluido,
  marcarVendaExcluida: marcarVendaExcluida,
  vendaPodeFicar: vendaPodeFicar,
  orcamentoPodeFicar: orcamentoPodeFicar,
  avisoNoSino: true,
  semPopup: true
};

if(typeof document==='undefined') return;

function avisarSino(texto){
  if(typeof window.notificarEvento==='function'){
    window.notificarEvento('info', texto, { tipo:'orcamento' });
    return;
  }
  if(typeof toast==='function') toast(texto, 'info');
}

if(typeof window.lfbAlert==='function' && !window.lfbAlert.__v52261orc){
  var oldAlert = window.lfbAlert;
  window.lfbAlert = function(msg, tit){
    var m = String(msg||'');
    var t = String(tit||'');
    if(/orçamento autorizado/i.test(t) || /foi AUTORIZADO/i.test(m) || /gerou a VENDA SALVA/i.test(m)){
      avisarSino(m.replace(/\s+/g,' ').trim());
      return;
    }
    return oldAlert.apply(this, arguments);
  };
  window.lfbAlert.__v52261orc = true;
}

if(typeof window.fetch==='function' && !window.fetch.__v52261orc){
  var oldFetch = window.fetch;
  window.fetch = function(url, opts){
    try{
      var u = String(url||'');
      var method = String((opts&&opts.method)||'GET').toUpperCase();
      if(method==='GET' && u.indexOf('/orcamento')>=0){
        var m = /[?&]c=([^&]+)/.exec(u);
        var tok = m ? decodeURIComponent(m[1]) : '';
        var _db = getDb();
        var b = bloqueio(_db);
        if(tok && (tem(b.tokens, tok) || tem(b.orcSemRecriarVenda, tok) || tem(b.orcIds, tok))){
          return Promise.resolve(new Response(JSON.stringify({ ok:true, status:'aberto' }), { headers:{ 'content-type':'application/json' } }));
        }
      }
    }catch(e){}
    return oldFetch.apply(this, arguments);
  };
  window.fetch.__v52261orc = true;
}

function wrapGerar(nomeObj){
  var bag = window[nomeObj];
  if(!bag || typeof bag.gerarVendaSalvaDeOrcamento!=='function' || bag.gerarVendaSalvaDeOrcamento.__v52261) return;
  var old = bag.gerarVendaSalvaDeOrcamento;
  bag.gerarVendaSalvaDeOrcamento = function(orcId, origem){
    var _db = getDb();
    var o = (_db.orcamentos||[]).find(function(x){ return x && (x.id===orcId || x.token===orcId); });
    if(o && naoRecriarVenda(o, _db)) return null;
    var ja = o && o.vendaId && (_db.vendas||[]).some(function(v){ return v && v.id===o.vendaId; });
    var r = old.apply(this, arguments);
    if(r && !ja){
      avisarSino('Orçamento '+(o&&o.numero||'')+' autorizado. Venda salva '+(r.numero||'')+' gerada.');
    }
    return r;
  };
  bag.gerarVendaSalvaDeOrcamento.__v52261 = true;
}

['ORCAMENTO_APROVACAO_V52255_PURE','ORCAMENTO_APROVACAO_V52256_PURE','ORCAMENTO_APROVACAO_V52257_PURE'].forEach(wrapGerar);

if(typeof window.aprovarOrcamentoInterno==='function' && !window.aprovarOrcamentoInterno.__v52261){
  var oldInt = window.aprovarOrcamentoInterno;
  window.aprovarOrcamentoInterno = function(orcId, origem){
    var _db = getDb();
    var o = (_db.orcamentos||[]).find(function(x){ return x && (x.id===orcId || x.token===orcId); });
    if(o && naoRecriarVenda(o, _db)) return null;
    return oldInt.apply(this, arguments);
  };
  window.aprovarOrcamentoInterno.__v52261 = true;
}

function wrapVerificar(nomeObj){
  var bag = window[nomeObj];
  if(!bag || typeof bag.verificarAprovacoesNuvem!=='function' || bag.verificarAprovacoesNuvem.__v52261) return;
  var oldV = bag.verificarAprovacoesNuvem;
  bag.verificarAprovacoesNuvem = function(){
    var _db = getDb();
    if(_db && Array.isArray(_db.orcamentos)){
      _db.orcamentos.forEach(function(o){
        if(o && naoRecriarVenda(o, _db) && o.status==='aprovado' && o.vendaId){
          o.__skipPoll = true;
        }
      });
    }
    return oldV.apply(this, arguments);
  };
  bag.verificarAprovacoesNuvem.__v52261 = true;
}
['ORCAMENTO_APROVACAO_V52255_PURE','ORCAMENTO_APROVACAO_V52256_PURE','ORCAMENTO_APROVACAO_V52257_PURE'].forEach(wrapVerificar);

if(typeof window.excluirVendaUnificado==='function' && !window.excluirVendaUnificado.__v52261){
  var oldExcV = window.excluirVendaUnificado;
  window.excluirVendaUnificado = function(){
    var _db = getDb();
    var checks = Array.from(document.querySelectorAll('input[name="venda-check-lote"]:checked'));
    var ids = checks.map(function(ch){ return ch.value; });
    if(!ids.length && (window.neoVendaSelecionada||window.vendaSelecionadaId)){
      ids = [window.neoVendaSelecionada||window.vendaSelecionadaId];
    }
    ids.forEach(function(id){
      var v = (_db.vendas||[]).find(function(x){ return x && x.id===id; });
      if(v) marcarVendaExcluida(v, _db);
    });
    return oldExcV.apply(this, arguments);
  };
  window.excluirVendaUnificado.__v52261 = true;
}

if(typeof window.excluirOrcamentosMarcados==='function' && !window.excluirOrcamentosMarcados.__v52261){
  var oldExcO = window.excluirOrcamentosMarcados;
  window.excluirOrcamentosMarcados = function(idUnico){
    var _db = getDb();
    var ids = idUnico ? [idUnico] : Array.from(document.querySelectorAll('input[name="orc-check"]:checked')).map(function(c){ return c.value; });
    if(!ids.length && window.neoOrcSel) ids = [window.neoOrcSel];
    ids.forEach(function(id){
      var o = (_db.orcamentos||[]).find(function(x){ return x && x.id===id; });
      if(o) marcarOrcamentoExcluido(o, _db);
    });
    return oldExcO.apply(this, arguments);
  };
  window.excluirOrcamentosMarcados.__v52261 = true;
  window.excluirOrcamento = window.excluirOrcamentosMarcados;
}

function varrerRessuscitadas(){
  var _db = getDb();
  if(!_db) return;
  bloqueio(_db);
  var mudou = false;
  if(Array.isArray(_db.vendas)){
    var nv = _db.vendas.filter(function(v){ return vendaPodeFicar(v, _db); });
    if(nv.length!==_db.vendas.length){ _db.vendas = nv; mudou = true; }
  }
  if(Array.isArray(_db.orcamentos)){
    var no = _db.orcamentos.filter(function(o){ return orcamentoPodeFicar(o, _db); });
    if(no.length!==_db.orcamentos.length){ _db.orcamentos = no; mudou = true; }
  }
  if(mudou && typeof saveDB==='function') saveDB();
}

setTimeout(varrerRessuscitadas, 800);
/* v5.22.62 sem varrer 2.5s (loop saveDB) */

function pintar(){
  var ver = document.getElementById('footer-version');
  if(ver) ver.textContent = 'v'+VERSAO;
}
pintar();
setTimeout(pintar, 200);
setTimeout(pintar, 900);
if(typeof window.navigateTo==='function' && !window.navigateTo.__v52261ver){
  var oldN = window.navigateTo;
  window.navigateTo = function(){
    var r = oldN.apply(this, arguments);
    try{ pintar(); wrapGerar('ORCAMENTO_APROVACAO_V52257_PURE'); }catch(e){}
    return r;
  };
  window.navigateTo.__v52261ver = true;
}

console.log('[DIGICOPY] v5.22.61 orçamento: apagou não volta, aviso no sino');
})();
