// ═══════════════════════════════════════════════════════════════════════════
// v5.22.39 — Se algo quebrar: aviso na tela. Detalhe técnico só na auditoria.
//            O foco é funcionar sem erro; o aviso é só se der problema.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function detalheErro(msg, extra){
  var d=String(msg==null?'erro':msg);
  if(extra) d+=' | '+String(extra);
  if(d.length>800) d=d.slice(0,800);
  return d;
}

function ignoraRuido(msg){
  var t=String(msg||'').toLowerCase();
  if(!t) return true;
  if(/resizeobserver|script error\.|canceled|abort|the operation was aborted/.test(t)) return true;
  return false;
}

window.V52239_ERRO_PURE = {
  detalheErro: detalheErro,
  ignoraRuido: ignoraRuido
};

if(typeof document==='undefined') return;

var ultimoAviso=0;

function gravarAuditoria(det){
  try{
    if(typeof db==='undefined' || !db) return;
    db.logs=db.logs||[];
    var sess=typeof getSession==='function'?getSession():null;
    db.logs.unshift({
      id: typeof uid==='function'?uid('log'):('log_'+Date.now()),
      dataHora: new Date().toISOString(),
      empresaId: sess&&sess.empresaId,
      usuarioId: sess&&sess.usuarioId,
      usuarioNome: (sess&&sess.usuarioNome)||'sistema',
      usuarioLogin: (sess&&sess.login)||'',
      entidade: 'sistema',
      acao: 'erro',
      entidadeId: null,
      detalhes: det
    });
    if(db.logs.length>500) db.logs=db.logs.slice(0,500);
    try{
      if(typeof saveDB==='function' && !window.__v52239salvandoErro){
        window.__v52239salvandoErro=true;
        saveDB();
        window.__v52239salvandoErro=false;
      }
    }catch(e){ window.__v52239salvandoErro=false; }
  }catch(e){}
}

function avisarTela(){
  var agora=Date.now();
  if(agora-ultimoAviso<8000) return;
  ultimoAviso=agora;
  try{
    if(typeof window.lfbAlert==='function') window.lfbAlert('Ocorreu um problema. O detalhe foi gravado na auditoria.','Aviso');
    else if(typeof toast==='function') toast('Ocorreu um problema. Veja a auditoria.','error');
  }catch(e){}
}

window.registrarErroSistema=function(msg, extra){
  var det=detalheErro(msg, extra);
  if(ignoraRuido(det)) return;
  gravarAuditoria(det);
  avisarTela();
};

window.addEventListener('error', function(ev){
  var msg=(ev&&ev.message)||'erro';
  var extra=[ev&&ev.filename, ev&&ev.lineno, ev&&ev.colno].filter(Boolean).join(':');
  window.registrarErroSistema(msg, extra);
});

window.addEventListener('unhandledrejection', function(ev){
  var r=ev&&ev.reason;
  var msg=r&&(r.message||r);
  window.registrarErroSistema(msg||'promessa rejeitada', r&&r.stack);
});

console.log('[DIGICOPY] v5.22.39 avisos de erro na tela, detalhe na auditoria');
})();
