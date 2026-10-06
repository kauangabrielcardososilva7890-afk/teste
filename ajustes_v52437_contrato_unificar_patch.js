// ═══════════════════════════════════════════════════════════════════════════
// v5.24.37 — Unificar contratos duplicados do mesmo cliente (r49).
// Pedido do dono (28/09): "continue unificando sem eu dizer mais nada" — ele
// não sabe dizer qual contrato é o importante, então o sistema SUGERE sozinho
// e ele confirma com 1 clique. Nada é apagado: o duplicado aposenta com
// status "encerrado" e dá pra DESFAZER (volta tudo).
// Regra do "qual fica" (decidida aqui, documentada, testada):
//   1) criado por GENTE ganha de criado por migração/importação;
//   2) com MAIS impressoras ativas ganha;
//   3) MAIS ANTIGO (criadoEm/dataInicio) ganha;
//   4) MENOR código ganha.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v); }
function numCod(c){ var m=String((c&&(c.numero||c.codigo||c.codigoAntigo))||'').replace(/\D/g,''); return m==='' ? 9007199254740991 : Number(m); }
function idade(c){ var t=Date.parse((c&&(c.criadoEm||c.dataInicio))||''); return isFinite(t)?t:9007199254740991; }
function ehMigracao(c){ return !!(c && (c.criadoPor==='migracao' || c.migrado===true)); }
function nAtivas(c){
  try{
    if(typeof maquinasContrato==='function') return maquinasContrato(c).filter(function(p){ return p && p.status==='ativo'; }).length;
  }catch(e){}
  return 0;
}
function codMostra(c){
  try{ if(typeof codigoContrato==='function') return codigoContrato(c); }catch(e){}
  return (c&&(c.numero||c.codigo))||'?';
}

// PURA (testável sem banco): devolve {manter, aposentar} entre a e b.
// Nos testes, a contagem entra por __nAtivas; no app, calcula ao vivo.
function escolherPrincipal(a, b){
  var ma=ehMigracao(a)?1:0, mb=ehMigracao(b)?1:0;
  if(ma!==mb) return ma<mb ? {manter:a,aposentar:b} : {manter:b,aposentar:a};
  var na=(a&&typeof a.__nAtivas==='number')?a.__nAtivas:nAtivas(a);
  var nb=(b&&typeof b.__nAtivas==='number')?b.__nAtivas:nAtivas(b);
  if(na!==nb) return na>nb ? {manter:a,aposentar:b} : {manter:b,aposentar:a};
  var ia=idade(a), ib=idade(b);
  if(ia!==ib) return ia<ib ? {manter:a,aposentar:b} : {manter:b,aposentar:a};
  return numCod(a)<=numCod(b) ? {manter:a,aposentar:b} : {manter:b,aposentar:a};
}

function clienteIdDe(c){
  if(!c) return '';
  if(c.clienteId) return c.clienteId;
  try{ if(typeof clienteContrato==='function'){ var cl=clienteContrato(c); if(cl&&cl.id) return cl.id; } }catch(e){}
  return '';
}

function duplicadosDe(c){
  if(typeof db==='undefined'||!c) return [];
  var cid=clienteIdDe(c);
  if(!cid) return [];
  return (db.contratos||[]).filter(function(x){
    return x && x.id!==c.id && x.empresaId===c.empresaId && clienteIdDe(x)===cid && x.status!=='encerrado';
  });
}

function salvarBanco(){ try{ if(typeof saveDB==='function') saveDB(); }catch(e){} }
function auditar(acao, id, detalhes){
  try{ if(typeof logAction==='function'){ logAction('contrato', acao, id, detalhes||''); return; } }catch(e){}
  try{
    if(typeof db!=='undefined' && db && db.logs){
      var s=(typeof getSession==='function')?getSession():null;
      db.logs.unshift({id:'log_'+Date.now().toString(36)+Math.floor(Math.random()*9999), dataHora:new Date().toISOString(), empresaId:s?s.empresaId:'', usuarioId:s?s.usuarioId:'', usuarioNome:(s&&(s.usuarioNome||s.usuarioLogin))||'', entidade:'contrato', acao:acao, entidadeId:id, detalhes:detalhes||''});
    }
  }catch(e2){}
}
function avisar(m, tipo){
  try{ if(typeof toast==='function'){ toast(m, tipo||'success'); return; } }catch(e){}
  try{ if(typeof aviso==='function') aviso(m); }catch(e2){}
}
function refrescar(){
  try{ if(typeof renderContratos==='function') renderContratos(); }catch(e){}
}

function unificarContratos(idManter, idAposentar){
  if(typeof db==='undefined') return 'sem-banco';
  var keep=(db.contratos||[]).find(function(x){ return x&&x.id===idManter; });
  var drop=(db.contratos||[]).find(function(x){ return x&&x.id===idAposentar; });
  if(!keep||!drop) return 'nao-achei';
  if(keep.id===drop.id) return 'iguais';
  if(keep.empresaId!==drop.empresaId) return 'empresa-diferente';
  if(!clienteIdDe(keep)||clienteIdDe(keep)!==clienteIdDe(drop)) return 'cliente-diferente';
  if(drop.status==='encerrado') return 'ja-aposentado';
  var movidas=[];
  (db.parque||[]).forEach(function(p){
    if(p && p.contratoId===drop.id){ p.contratoIdAnterior=p.contratoId; p.contratoId=keep.id; movidas.push(p.id); }
  });
  drop.status='encerrado';
  var quem=''; try{ quem=((typeof getSession==='function'&&getSession())||{}).usuarioNome||''; }catch(e){}
  drop.unificadoEm={para:keep.id, linhas:movidas, em:new Date().toISOString(), por:quem};
  drop.observacoes=txt(drop.observacoes)+(txt(drop.observacoes)?'\n':'')+'[unificado em '+codMostra(keep)+' — dá pra desfazer na tela do contrato]';
  auditar('unificar', drop.id, 'Contrato '+codMostra(drop)+' unificado no '+codMostra(keep)+' ('+movidas.length+' impressoras movidas)');
  salvarBanco();
  avisar('Contratos unificados: ficou o nº '+codMostra(keep)+' ('+movidas.length+' impressoras)');
  refrescar();
  try{ if(typeof openContratoCompleto==='function') openContratoCompleto(keep.id); }catch(e2){}
  return 'ok';
}

function desfazerUnificacao(idAposentado){
  if(typeof db==='undefined') return 'sem-banco';
  var drop=(db.contratos||[]).find(function(x){ return x&&x.id===idAposentado; });
  if(!drop||!drop.unificadoEm) return 'sem-unificacao';
  var u=drop.unificadoEm;
  var voltas=0;
  (db.parque||[]).forEach(function(p){
    if(p && p.contratoId===u.para && p.contratoIdAnterior===drop.id){ p.contratoId=drop.id; delete p.contratoIdAnterior; voltas++; }
  });
  drop.status='ativo';
  delete drop.unificadoEm;
  auditar('desfazer-unificar', drop.id, 'Contrato '+codMostra(drop)+' separado de volta ('+voltas+' impressoras)');
  salvarBanco();
  avisar('Unificação desfeita: nº '+codMostra(drop)+' voltou');
  refrescar();
  try{ if(typeof openContratoCompleto==='function') openContratoCompleto(drop.id); }catch(e){}
  return 'ok';
}

var G=(typeof window!=='undefined')?window:{};
G.unificarContratos=unificarContratos;
G.desfazerUnificacao=desfazerUnificacao;
G.duplicadosDoContrato=duplicadosDe;
G.CONTRATO_UNIFICAR_PURE={escolherPrincipal:escolherPrincipal, numCod:numCod, idade:idade, ehMigracao:ehMigracao};
if(typeof window==='undefined' && typeof module!=='undefined' && module.exports){ module.exports=G.CONTRATO_UNIFICAR_PURE; }

if(typeof document==='undefined') return;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

function bannerUnificar(contratoId){
  if(typeof db==='undefined') return;
  var body=document.getElementById('modal-body'); if(!body) return;
  if(document.getElementById('v52437-uni')) return;
  var c=(db.contratos||[]).find(function(x){ return x&&x.id===contratoId; }); if(!c) return;
  var box=document.createElement('div'); box.id='v52437-uni';
  if(c.unificadoEm){
    var keep=(db.contratos||[]).find(function(x){ return x&&x.id===c.unificadoEm.para; });
    box.className='rounded-xl border border-slate-300 bg-slate-50 p-3 mb-3 text-[12.5px] text-slate-600';
    box.innerHTML='Este contrato foi <b>aposentado</b> numa unificação (ficou o nº '+esc(codMostra(keep||{numero:'?'}))+'). ';
    var btnD=document.createElement('button'); btnD.type='button';
    btnD.className='ml-2 h-8 px-3 rounded-lg bg-white border border-slate-300 font-bold text-[12px]';
    btnD.textContent='Desfazer';
    btnD.onclick=function(){ desfazerUnificacao(c.id); };
    box.appendChild(btnD);
    body.insertBefore(box, body.firstChild);
    return;
  }
  var dups=duplicadosDe(c); if(!dups.length) return;
  var o=dups[0], esc1=escolherPrincipal(c, o);
  box.className='rounded-xl border border-amber-300 bg-amber-50 p-3 mb-3 text-[12.5px]';
  var nOutros=dups.length>1 ? ' (+'+(dups.length-1)+' outros)' : '';
  box.innerHTML='⚠️ Este cliente tem <b>'+(dups.length+1)+' contratos</b> (nº '+esc(codMostra(c))+' e nº '+esc(codMostra(o))+nOutros+'). Sugestão: ficar com o <b>nº '+esc(codMostra(esc1.manter))+'</b>. ';
  var btn=document.createElement('button'); btn.type='button';
  btn.className='ml-2 h-8 px-3 rounded-lg bg-[#0a1e8a] text-white font-bold text-[12px]';
  btn.textContent='Unificar: manter nº '+codMostra(esc1.manter);
  btn.onclick=(function(manter, aposentar){ return function(){ unificarContratos(manter.id, aposentar.id); }; })(esc1.manter, esc1.aposentar);
  box.appendChild(btn);
  var obs=document.createElement('span'); obs.className='ml-2 text-[11.5px] text-slate-500'; obs.textContent='Dá pra desfazer depois.';
  box.appendChild(obs);
  body.insertBefore(box, body.firstChild);
}

if(typeof window.openContratoCompleto==='function' && !window.openContratoCompleto.__v52437uni){
  var oldOpen=window.openContratoCompleto;
  window.openContratoCompleto=function(contratoId){
    var r=oldOpen.apply(this, arguments);
    try{
      setTimeout(function(){ bannerUnificar(contratoId); }, 120);
      setTimeout(function(){ bannerUnificar(contratoId); }, 400);
    }catch(e){}
    return r;
  };
  window.openContratoCompleto.__v52437uni=true;
}

console.log('[DIGICOPY] v5.24.37 contrato: unificar duplicados + desfazer');
})();
