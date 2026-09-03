// ═══════════════════════════════════════════════════════════════════════════
// v5.22.62 — Orçamento gera venda UMA vez. Apagou não volta.
//            Para o loop de carregar (poll 3s + saveDB).
//            Não mexe no layout da tela de orçamentos.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
var VERSAO = '5.22.62';
window.ORCAMENTO_UMA_VEZ_V52262_PURE = {
  VERSAO: VERSAO,
  geraUmaVez: true,
  apagouNaoVolta: true,
  semPoll3s: true
};
if(typeof document==='undefined') return;

function overlayOff(){
  try{
    var cloud = document.getElementById('cloud-load-overlay');
    if(cloud){ cloud.style.display='none'; cloud.remove(); }
  }catch(e){}
}
overlayOff();
setTimeout(overlayOff, 200);
setTimeout(overlayOff, 1500);

function pintar(){
  var ver = document.getElementById('footer-version');
  var _vUI = (typeof window!=='undefined' && window.DIGICOPY_APP_VERSION) || VERSAO;
  if(ver) ver.textContent = 'v'+_vUI;
}
pintar();
setTimeout(pintar, 400);

if(typeof window.aprovarOrcamentoInterno==='function' && !window.aprovarOrcamentoInterno.__v52262){
  var old = window.aprovarOrcamentoInterno;
  window.aprovarOrcamentoInterno = function(orcId){
    var _db = (typeof db!=='undefined'?db:(window.db||{}));
    var o = (_db.orcamentos||[]).find(function(x){ return x && (x.id===orcId || x.token===orcId); });
    if(!o) return null;
    if(o.status==='excluido' || o.vendaExcluidaPeloUsuario || o.vendaGeradaUmaVez){
      if(o.vendaId){
        var ja = (_db.vendas||[]).find(function(v){ return v && v.id===o.vendaId; });
        if(ja) return ja;
      }
      return null;
    }
    return old.apply(this, arguments);
  };
  window.aprovarOrcamentoInterno.__v52262 = true;
}

console.log('[DIGICOPY] v5.22.62 orçamento: uma vez, sem loop de carregar');
})();
