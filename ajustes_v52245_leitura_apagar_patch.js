// ═══════════════════════════════════════════════════════════════════════════
// v5.22.45 — Apagar leitura: confirma no popup do sistema e devolve o
//            contador da impressora ao valor de antes do lançamento.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function n(v){ var x=Number(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:0; }

window.LEITURA_APAGAR_V52245_PURE = {
  contadorDepoisDeApagar: function(eq, leitura){
    var out = Object.assign({}, eq||{});
    if(leitura && leitura.contadorPBAnterior!=null && leitura.contadorPBAnterior!==''){
      out.contadorPB = n(leitura.contadorPBAnterior);
    }
    if(leitura && leitura.contadorCorAnterior!=null && leitura.contadorCorAnterior!==''){
      out.contadorCor = n(leitura.contadorCorAnterior);
    }
    return out;
  },
  mensagem: 'Deseja apagar essa leitura? Ela fará os contadores voltar ao que estava antes de lançar.'
};

if(typeof document==='undefined') return;

window.deleteLeituraContrato = function(leiId, contratoId){
  var msg = window.LEITURA_APAGAR_V52245_PURE.mensagem;
  var run = function(){
    if(typeof db==='undefined') return;
    var l = (db.leituras||[]).find(function(x){ return x && x.id===leiId; });
    if(l && l.equipamentoId){
      var eq = (db.equipamentos||[]).find(function(e){ return e && e.id===l.equipamentoId; });
      if(eq){
        var next = window.LEITURA_APAGAR_V52245_PURE.contadorDepoisDeApagar(eq, l);
        eq.contadorPB = next.contadorPB;
        eq.contadorCor = next.contadorCor;
      }
    }
    db.contasReceber = (db.contasReceber||[]).filter(function(cr){ return !cr || cr.leituraId!==leiId; });
    db.leituras = (db.leituras||[]).filter(function(x){ return x && x.id!==leiId; });
    if(typeof saveDB==='function') saveDB();
    if(typeof abrirLeiturasContrato==='function') abrirLeiturasContrato(contratoId);
    if(typeof renderFinanceiro==='function') renderFinanceiro();
    if(typeof toast==='function') toast('Leitura apagada. Contadores voltaram.','success');
  };
  if(typeof window.confirmSistema==='function'){
    window.confirmSistema(msg,'Apagar leitura').then(function(ok){ if(ok) run(); });
    return;
  }
  run();
};

console.log('[DIGICOPY] v5.22.45 leitura: apagar devolve contador');
})();
