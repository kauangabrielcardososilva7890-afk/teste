// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.22.89 — caça ao aviso "orçamento não encontrado" + autocura da lista
//
// 1) CARIMBO DE ORIGEM: qualquer aviso (popup central ou toast) que contenha
//    a palavra "encontrad" (encontrado/encontrada) ganha uma linha cinza no
//    final dizendo DE ONDE ele saiu: função @ arquivo : linha. Se o aviso
//    misterioso do orçamento aparecer de novo, é só mandar esse código —
//    acha-se a causa raiz na hora. Avisos sem "encontrad" ficam intactos.
// 2) AUTOCURA: orçamentos antigos SEM id (salvos por versões velhas) ganham
//    um id estável na renderização da lista e quando alguém tenta abrir —
//    sem isso, a linha da lista chamava abrirOrcamento('undefined').
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

window.AJUSTES_V52289_PURE = {
  interessa: function(msg){ return /encontrad/i.test(String(msg == null ? '' : msg)); }
};

if(typeof document === 'undefined') return;

// ── 1) carimbo de origem ────────────────────────────────────────────────────
function origemDoAviso(){
  try{
    var st = String((new Error()).stack || '');
    var linhas = st.split('\n').filter(function(l){
      return l.indexOf('ajustes_v52289') < 0 && l.indexOf('Error') < 0;
    });
    for(var i = 0; i < linhas.length; i++){
      var l = linhas[i];
      // Chrome: "at funcao (arquivo.js:123:45)" | Firefox: "funcao@arquivo.js:123:45"
      var m = l.match(/at\s+([^\s(]+)[^(]*\(([^()\s]+\.js)[^()\s]*?:(\d+):\d+\)/);
      if(!m) m = l.match(/([A-Za-z0-9_.$\[\]-]+)@([^()\s]+\.js)[^()\s]*?:(\d+):\d+/);
      if(!m) m = l.match(/at\s+([^()\s]+\.js)[^()\s]*?:(\d+):\d+/);
      if(m){
        var fn = m.length >= 4 ? (m[1] || 'anon') : 'anon';
        var arq = (m[m.length - 2] || '').split('/').pop();
        var lin = m[m.length - 1] || '?';
        if(arq){ return fn + ' @ ' + arq + ' : ' + lin; }
      }
    }
  }catch(e){}
  return '';
}

function carimbo(msg){
  if(!window.AJUSTES_V52289_PURE.interessa(msg)) return msg;
  var o = origemDoAviso();
  if(!o) return msg;
  return String(msg) + '<br><span style="display:block;margin-top:6px;font-size:10px;color:#94a3b8">código: ' + o + ' — mande ao suporte</span>';
}

if(typeof window.lfbAlert === 'function' && !window.lfbAlert.__v52289){
  var oldAlert = window.lfbAlert;
  window.lfbAlert = function(){ var a = Array.prototype.slice.call(arguments); a[0] = carimbo(a[0]); return oldAlert.apply(this, a); };
  window.lfbAlert.__v52289 = true;
}
if(typeof window.avisoSistema === 'function' && !window.avisoSistema.__v52289){
  var oldAviso = window.avisoSistema;
  window.avisoSistema = function(){ var a = Array.prototype.slice.call(arguments); a[0] = carimbo(a[0]); return oldAviso.apply(this, a); };
  window.avisoSistema.__v52289 = true;
}
if(typeof window.toast === 'function' && !window.toast.__v52289){
  var oldToast = window.toast;
  window.toast = function(){ var a = Array.prototype.slice.call(arguments); a[0] = carimbo(a[0]); return oldToast.apply(this, a); };
  window.toast.__v52289 = true;
}

// ── 2) orçamentos antigos sem id ganham id estável na renderização da lista ──
function garantirIdsOrcamentos(){
  try{
    var _db = (typeof db !== 'undefined') ? db : (window.db || null);
    if(!_db || !Array.isArray(_db.orcamentos)) return;
    var alterou = false;
    _db.orcamentos.forEach(function(o){
      if(o && !o.id){
        o.id = 'orc_legado_' + (o.token || ('n' + (String(o.numero || '').replace(/\D/g, '') || Math.random().toString(36).slice(2, 8))));
        alterou = true;
      }
    });
    if(alterou && typeof saveDB === 'function') saveDB();
  }catch(e){}
}

if(typeof window.renderOrcamentos === 'function' && !window.renderOrcamentos.__v52289ids){
  var oldRender = window.renderOrcamentos;
  window.renderOrcamentos = function(){
    garantirIdsOrcamentos();
    return oldRender.apply(this, arguments);
  };
  window.renderOrcamentos.__v52289ids = true;
}
// Roda uma vez na carga também (a lista pode nem ter sido aberta ainda)
setTimeout(garantirIdsOrcamentos, 1500);

console.log('[DIGICOPY] v5.22.89 carimbo de avisos + autocura da lista de orçamentos');
})();
