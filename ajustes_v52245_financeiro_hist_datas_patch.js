// ═══════════════════════════════════════════════════════════════════════════
// v5.22.45 — Financeiro: histórico mostra código da venda, da leitura e do
//            chamado; De / Até sempre visíveis (em Hoje não filtram).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function codigoNorm(v){
  var d=String(v==null?'':v).replace(/\D/g,'');
  if(!d) return '';
  return d.replace(/^0+/,'')||'0';
}
function esc(s){
  return typeof escapeHtml==='function'?escapeHtml(s):String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});
}

function refsDoLancamento(c, dbRef){
  dbRef = dbRef || (typeof db!=='undefined'?db:{});
  var out = [];
  if(!c) return out;
  var venda = null;
  if(c.vendaId){
    venda = ((dbRef.vendas)||[]).find(function(v){ return v && v.id===c.vendaId; })||null;
    out.push({tipo:'venda', codigo: txt((venda&&(venda.numero||venda.codigo))||c.vendaNumero||c.numeroVenda||codigoNorm(c.vendaId))});
  }
  if(c.leituraId){
    var l = ((dbRef.leituras)||[]).find(function(x){ return x && x.id===c.leituraId; })||null;
    out.push({tipo:'leitura', codigo: txt((l&&(l.numero||l.codigo||l.codigoAntigo))||c.leituraNumero||c.codLeitura||codigoNorm(c.leituraId))});
  }
  var os = null;
  if(c.osId || c.chamadoId){
    var oid = c.osId||c.chamadoId;
    os = ((dbRef.os)||[]).find(function(x){ return x && x.id===oid; })||null;
  }
  if(!os && venda){
    os = venda.os || ((dbRef.os)||[]).find(function(x){ return x && (x.vendaId===venda.id || x.id===venda.osId); })||null;
  }
  if(os){
    out.push({tipo:'chamado', codigo: txt(os.numero||os.codigo||c.osNumero||'')});
  }
  return out.filter(function(r){ return r.codigo; });
}

function htmlRefs(refs){
  if(!refs || !refs.length) return '';
  var mapa = {venda:'Venda', leitura:'Leitura', chamado:'Chamado'};
  return '<p class="text-[12px] text-slate-600 mt-2">'+refs.map(function(r){
    return (mapa[r.tipo]||r.tipo)+': <b class="text-[#0a1e8a]">'+esc(r.codigo)+'</b>';
  }).join(' • ')+'</p>';
}

window.FINANCEIRO_HIST_DATAS_V52245_PURE = {
  refsDoLancamento: refsDoLancamento,
  datasSempreVisiveis: true,
  aplicaDatas: function(modo){ return modo!=='hoje'; }
};

if(typeof document==='undefined') return;

var ST = window.__FIN_ST || (window.__FIN_ST = { campo:'nome', q:'', modo:'hoje', de:'', ate:'', tipo:'todos', ordem:'venc-asc' });

window.finModoV52243 = function(modo){
  ST.modo = modo||'hoje';
  if(typeof window.renderFinanceiro==='function') window.renderFinanceiro();
};
window.finModoV52244 = window.finModoV52243;
window.finModoV52245 = window.finModoV52243;

if(window.FINANCEIRO_V52243_PURE && typeof window.FINANCEIRO_V52243_PURE.filtraLancamentos==='function' && !window.FINANCEIRO_V52243_PURE.filtraLancamentos.__v52245){
  var oldF = window.FINANCEIRO_V52243_PURE.filtraLancamentos;
  window.FINANCEIRO_V52243_PURE.filtraLancamentos = function(list, opts){
    var out = oldF(list, opts)||[];
    opts = opts||{};
    if(opts.modo==='hoje') return out;
    var de = txt(opts.de), ate = txt(opts.ate);
    if(!de && !ate) return out;
    return out.filter(function(item){
      var c = item.ref||item;
      return window.FINANCEIRO_V52243_PURE.noIntervalo(c, de, ate);
    });
  };
  window.FINANCEIRO_V52243_PURE.filtraLancamentos.__v52245 = true;
}

function garantirDatas(){
  var view = document.getElementById('view-financeiro');
  if(!view) return;
  var de = document.getElementById('neo-fin-de');
  var ate = document.getElementById('neo-fin-ate');
  function ligar(el, qual){
    if(!el) return;
    if(el.type==='hidden'){
      el.type='date';
      el.className='neo-input !w-[150px] !h-9';
    }
    el.disabled = false;
    el.style.display = '';
    el.removeAttribute('hidden');
    if(qual==='de') el.value = ST.de||el.value||'';
    if(qual==='ate') el.value = ST.ate||el.value||'';
    el.onchange = function(){
      if(qual==='de') ST.de = el.value||'';
      else ST.ate = el.value||'';
      if(typeof window.finBuscarV52243==='function') window.finBuscarV52243();
      else if(typeof window.renderFinanceiro==='function') window.renderFinanceiro();
    };
  }
  if(!de || !ate){
    var host = view.querySelector('.p-4.border-b .flex.flex-wrap.items-center.justify-center.gap-2:last-child')
      || view.querySelector('.p-4.border-b');
    if(!host) return;
    var wrap = document.getElementById('v52245-fin-datas');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id='v52245-fin-datas';
      wrap.className='flex flex-wrap items-center justify-center gap-2';
      wrap.innerHTML = '<label class="text-[11px] font-bold text-slate-500 uppercase">De</label>'
        +'<input id="neo-fin-de" type="date" class="neo-input !w-[150px] !h-9" value="'+esc(ST.de||'')+'">'
        +'<label class="text-[11px] font-bold text-slate-500 uppercase">Até</label>'
        +'<input id="neo-fin-ate" type="date" class="neo-input !w-[150px] !h-9" value="'+esc(ST.ate||'')+'">';
      host.insertBefore(wrap, host.firstChild);
    }
    de = document.getElementById('neo-fin-de');
    ate = document.getElementById('neo-fin-ate');
  } else {
    if(!document.getElementById('neo-fin-de-lab') && de.parentNode){
      var labDe=document.createElement('label');
      labDe.id='neo-fin-de-lab';
      labDe.className='text-[11px] font-bold text-slate-500 uppercase';
      labDe.textContent='De';
      de.parentNode.insertBefore(labDe, de);
    }
    if(!document.getElementById('neo-fin-ate-lab') && ate.parentNode){
      var labAte=document.createElement('label');
      labAte.id='neo-fin-ate-lab';
      labAte.className='text-[11px] font-bold text-slate-500 uppercase';
      labAte.textContent='Até';
      ate.parentNode.insertBefore(labAte, ate);
    }
  }
  ligar(de,'de');
  ligar(ate,'ate');
}

if(typeof window.renderFinanceiro==='function' && !window.renderFinanceiro.__v52245datas){
  var oldR = window.renderFinanceiro;
  window.renderFinanceiro = function(){
    var r = oldR.apply(this, arguments);
    try{ garantirDatas(); }catch(e){}
    return r;
  };
  window.renderFinanceiro.__v52245datas = true;
}

if(typeof window.historicoLancamento==='function' && !window.historicoLancamento.__v52245hist){
  var oldH = window.historicoLancamento;
  window.historicoLancamento = function(tipo,id){
    var r = oldH.apply(this, arguments);
    try{
      if(typeof db==='undefined') return r;
      var arr = tipo==='cp'?db.contasPagar:db.contasReceber;
      var c = (arr||[]).find(function(x){ return x && x.id===id; });
      var refs = refsDoLancamento(c, db);
      var body = document.getElementById('modal-body');
      if(body && refs.length && !document.getElementById('v52245-fin-refs')){
        var card = body.querySelector('.neo-card');
        var box = document.createElement('div');
        box.id='v52245-fin-refs';
        box.innerHTML = htmlRefs(refs);
        if(card) card.appendChild(box);
        else body.insertBefore(box, body.firstChild);
      }
    }catch(e){}
    return r;
  };
  window.historicoLancamento.__v52245hist = true;
}

console.log('[DIGICOPY] v5.22.45 financeiro: códigos no histórico, De/Até visíveis');
})();
