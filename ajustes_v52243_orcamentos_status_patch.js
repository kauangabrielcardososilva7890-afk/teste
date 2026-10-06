// ═══════════════════════════════════════════════════════════════════════════
// v5.22.43 — Orçamentos: Status Autorizado / Não autorizado na lista e na
//            tela. Sem botão Faturar. FECHADO vira Autorizado.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

function rotuloStatus(o){
  var st = txt(o && o.status).toLowerCase();
  if(st==='aprovado' || (o && o.vendaId)) return 'Autorizado';
  if(st==='recusado') return 'Não autorizado';
  if(st==='estornado') return 'Estornado';
  if(st==='excluido') return 'Excluído';
  return 'Aberto';
}
function classeStatus(rotulo){
  if(rotulo==='Autorizado') return 'neo-status ok';
  if(rotulo==='Não autorizado') return 'neo-status wait';
  if(rotulo==='Estornado') return 'neo-status info';
  return 'neo-status info';
}

window.ORCAMENTOS_STATUS_V52243_PURE = { rotuloStatus: rotuloStatus, classeStatus: classeStatus };

if(typeof document==='undefined') return;

function badge(o){
  var r = rotuloStatus(o);
  return '<span class="'+classeStatus(r)+'">'+esc(r)+'</span>';
}
function idDaLinha(tr){
  var oc = (tr && tr.getAttribute('onclick'))||'';
  var m = oc.match(/abrirOrcamento\('([^']+)'\)/);
  if(m) return m[1];
  var btn = tr && tr.querySelector('button[onclick*="abrirOrcamento"]');
  var oc2 = (btn && btn.getAttribute('onclick'))||'';
  var m2 = oc2.match(/abrirOrcamento\('([^']+)'\)/);
  return m2 ? m2[1] : '';
}
function pintarLista(){
  var view = document.getElementById('view-orcamentos');
  if(!view) return;
  view.querySelectorAll('button').forEach(function(b){
    if(/^\s*faturar\s*$/i.test(b.textContent||'')) b.remove();
  });
  var thead = view.querySelector('thead tr');
  if(thead && !/Status/.test(thead.textContent||'')){
    var th = document.createElement('th');
    th.textContent = 'Status';
    th.setAttribute('data-orc-status-th','1');
    thead.insertBefore(th, thead.lastElementChild);
  }
  var list = (typeof db!=='undefined' && db.orcamentos)||[];
  view.querySelectorAll('tbody tr').forEach(function(tr){
    var id = idDaLinha(tr);
    if(!id) return;
    var o = list.find(function(x){ return x && x.id===id; });
    var td = tr.querySelector('[data-orc-status]');
    if(!td){
      td = document.createElement('td');
      td.setAttribute('data-orc-status','1');
      tr.insertBefore(td, tr.lastElementChild);
    }
    td.innerHTML = badge(o||{status:'aberto'});
    tr.querySelectorAll('.text-emerald-700').forEach(function(el){
      if(/fechado/i.test(el.textContent||'')) el.remove();
    });
  });
}

if(typeof window.renderOrcamentos==='function' && !window.renderOrcamentos.__v52243status){
  var oldR = window.renderOrcamentos;
  window.renderOrcamentos = function(){
    var r = oldR.apply(this, arguments);
    try{ pintarLista(); }catch(e){}
    return r;
  };
  window.renderOrcamentos.__v52243status = true;
}

if(typeof window.abrirTelaOrcamento==='function' && !window.abrirTelaOrcamento.__v52243status){
  var oldA = window.abrirTelaOrcamento;
  window.abrirTelaOrcamento = function(existente){
    var r = oldA.apply(this, arguments);
    try{
      var o = existente;
      if(!o && window.__ORC_ST && window.__ORC_ST.form && window.__ORC_ST.form.id && typeof db!=='undefined'){
        o = (db.orcamentos||[]).find(function(x){ return x.id===window.__ORC_ST.form.id; });
      }
      var body = document.getElementById('modal-body');
      var foot = document.getElementById('modal-footer');
      if(foot){
        foot.querySelectorAll('button').forEach(function(b){
          if(/faturar/i.test(b.textContent||'')) b.remove();
        });
      }
      var box = document.getElementById('orc-status-box');
      if(body && !box){
        box = document.createElement('div');
        box.id = 'orc-status-box';
        box.className = 'rounded-xl border p-3 flex items-center justify-between bg-slate-50';
        body.insertBefore(box, body.firstChild);
      }
      if(box){
        box.innerHTML = '<span class="text-[11px] font-bold uppercase text-[#0a1e8a]">Status</span>'+badge(o||{status:'aberto'});
      }
    }catch(e){}
    return r;
  };
  window.abrirTelaOrcamento.__v52243status = true;
}

console.log('[DIGICOPY] v5.22.43 orçamentos: status Autorizado / Não autorizado');
})();
