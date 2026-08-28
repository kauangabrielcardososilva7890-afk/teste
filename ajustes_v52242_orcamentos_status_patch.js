// ═══════════════════════════════════════════════════════════════════════════
// v5.22.42 — Orçamentos: status Autorizado / Não autorizado (lista e tela).
//            Sem botão Faturar. Link público leva token (?c=) + dados (?d=).
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

window.ORCAMENTOS_STATUS_V52242_PURE = {
  rotuloStatus: rotuloStatus,
  classeStatus: classeStatus
};

if(typeof document==='undefined') return;

function badge(o){
  var r = rotuloStatus(o);
  return '<span class="'+classeStatus(r)+'">'+esc(r)+'</span>';
}

if(typeof window.renderOrcamentos==='function' && !window.renderOrcamentos.__v52242status){
  var oldR = window.renderOrcamentos;
  window.renderOrcamentos = function(){
    var r = oldR.apply(this, arguments);
    try{
      var view = document.getElementById('view-orcamentos');
      if(!view) return r;
      var thead = view.querySelector('thead tr');
      if(thead && !/Status/.test(thead.textContent||'')){
        var ths = thead.querySelectorAll('th');
        if(ths.length){
          var th = document.createElement('th');
          th.textContent = 'Status';
          thead.insertBefore(th, thead.lastElementChild);
        }
      }
      var s = typeof getSession==='function'?getSession():null;
      var list = (typeof db!=='undefined' && db.orcamentos)||[];
      view.querySelectorAll('tbody tr').forEach(function(tr){
        if(tr.querySelector('[data-orc-status]')) return;
        var btn = tr.querySelector('button[onclick*="abrirOrcamento"]');
        var oc = (btn && btn.getAttribute('onclick'))||'';
        var m = oc.match(/abrirOrcamento\('([^']+)'\)/);
        if(!m) return;
        var o = list.find(function(x){ return x && x.id===m[1]; });
        if(!o) return;
        var td = document.createElement('td');
        td.setAttribute('data-orc-status','1');
        td.innerHTML = badge(o);
        tr.insertBefore(td, tr.lastElementChild);
        var cod = tr.children[1];
        if(cod){
          var fech = cod.querySelector('.text-emerald-700');
          if(fech) fech.remove();
        }
      });
    }catch(e){}
    return r;
  };
  window.renderOrcamentos.__v52242status = true;
}

if(typeof window.abrirTelaOrcamento==='function' && !window.abrirTelaOrcamento.__v52242status){
  var oldA = window.abrirTelaOrcamento;
  window.abrirTelaOrcamento = function(existente){
    var r = oldA.apply(this, arguments);
    try{
      var o = existente;
      if(!o && window.__ORC_ST && window.__ORC_ST.form && window.__ORC_ST.form.id && typeof db!=='undefined'){
        o = (db.orcamentos||[]).find(function(x){ return x.id===window.__ORC_ST.form.id; });
      }
      var body = document.getElementById('modal-body');
      if(body && o && !document.getElementById('orc-status-box')){
        var box = document.createElement('div');
        box.id = 'orc-status-box';
        box.className = 'rounded-xl border p-3 flex items-center justify-between bg-slate-50';
        box.innerHTML = '<span class="text-[11px] font-bold uppercase text-[#0a1e8a]">Status</span>'+badge(o);
        body.insertBefore(box, body.firstChild);
      } else if(body && !o && !document.getElementById('orc-status-box')){
        var boxN = document.createElement('div');
        boxN.id = 'orc-status-box';
        boxN.className = 'rounded-xl border p-3 flex items-center justify-between bg-slate-50';
        boxN.innerHTML = '<span class="text-[11px] font-bold uppercase text-[#0a1e8a]">Status</span><span class="neo-status info">Aberto</span>';
        body.insertBefore(boxN, body.firstChild);
      }
    }catch(e){}
    return r;
  };
  window.abrirTelaOrcamento.__v52242status = true;
}

if(window.ORCAMENTOS_V52240_PURE && typeof window.ORCAMENTOS_V52240_PURE.linkDe==='function' && !window.ORCAMENTOS_V52240_PURE.linkDe.__v52242c){
  var oldLink = window.ORCAMENTOS_V52240_PURE.linkDe;
  window.ORCAMENTOS_V52240_PURE.linkDe = function(o, cli, emp){
    var link = oldLink(o, cli, emp);
    var tok = o && o.token;
    if(tok && link && link.indexOf('?c=')<0){
      if(link.indexOf('?')>=0) link = link.replace('?', '?c='+encodeURIComponent(tok)+'&');
      else link += '?c='+encodeURIComponent(tok);
    }
    return link;
  };
  window.ORCAMENTOS_V52240_PURE.linkDe.__v52242c = true;
  if(window.ORCAMENTOS_V52238_PURE) window.ORCAMENTOS_V52238_PURE.linkOrcamento = window.ORCAMENTOS_V52240_PURE.linkDe;
}

console.log('[DIGICOPY] v5.22.42 orçamentos: status autorizado / não');
})();
