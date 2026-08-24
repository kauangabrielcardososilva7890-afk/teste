// ═══════════════════════════════════════════════════════════════════════════
// v5.22.37 — Vendas / OS: rótulos azuis, série com lupa, garantia escreve,
//            some valor/desconto OS, técnico obrigatório, aviso EPSON
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var AVISO_EPSON = [
  'Prezados clientes,',
  '',
  'Informamos que as manutenções em impressoras EPSON exigem um prazo maior para a conclusão. Para estes equipamentos, utilizamos produtos químicos específicos que demandam um tempo necessário de reação para garantir a eficácia do serviço. Por isso, solicitamos um prazo médio de 15 dias úteis para a entrega da manutenção.',
  '',
  'Vale ressaltar que o equipamento pode ficar pronto antes deste prazo, a depender da agilidade da reação dos produtos utilizados.',
  '',
  'Agradecemos a compreensão de todos e nos colocamos à disposição para eventuais dúvidas!'
].join('\n');

function txt(v){ return String(v==null?'':v).trim(); }
function azulLabels(root){
  if(!root) return;
  root.querySelectorAll('label.text-slate-500, thead.text-slate-500, #vos-tab-itens, #vos-tab-os').forEach(function(el){
    el.classList.remove('text-slate-500');
    el.classList.add('text-[#0a1e8a]');
  });
  ['vos-tab-itens','vos-tab-os'].forEach(function(id){
    var b=document.getElementById(id);
    if(b){ b.classList.add('text-[#0a1e8a]','font-extrabold'); }
  });
  var th=document.querySelector('#vos-aba-itens thead');
  if(th){ th.classList.remove('text-slate-500'); th.classList.add('text-[#0a1e8a]'); }
}

function aplicarGarantiaCombo(){
  var sel=document.getElementById('vos-os-garantia');
  if(!sel || sel.getAttribute('data-v52237')) return;
  sel.setAttribute('data-v52237','1');
  if(!Array.from(sel.options).some(function(o){ return o.value==='__escrever__'; })){
    var op=document.createElement('option');
    op.value='__escrever__';
    op.textContent='Escrever dias…';
    sel.appendChild(op);
  }
  var wrap=sel.parentNode;
  if(!wrap) return;
  wrap.classList.add('relative');
  if(!document.getElementById('vos-os-garantia-txt')){
    var inp=document.createElement('input');
    inp.id='vos-os-garantia-txt';
    inp.type='text';
    inp.inputMode='numeric';
    inp.placeholder='Qtd. de dias';
    inp.className='hidden mt-1 w-full h-[40px] px-2 pr-9 rounded-xl border bg-white text-[12.5px]';
    wrap.appendChild(inp);
    var seta=document.createElement('button');
    seta.type='button';
    seta.id='vos-os-garantia-seta';
    seta.title='Escolher garantia';
    seta.className='absolute right-1 bottom-1 w-8 h-8 rounded-lg text-[#0a1e8a] grid place-items-center';
    seta.innerHTML='<i class="ph ph-caret-down"></i>';
    seta.onclick=function(e){
      e.preventDefault();
      inp.classList.add('hidden');
      sel.classList.remove('hidden');
      sel.value='30 dias';
      sel.focus();
    };
    wrap.appendChild(seta);
  }
  sel.addEventListener('change', function(){
    var inp=document.getElementById('vos-os-garantia-txt');
    if(sel.value==='__escrever__'){
      sel.classList.add('hidden');
      if(inp){ inp.classList.remove('hidden'); inp.focus(); }
    }
  });
}

function aplicarSerieLupa(){
  var inp=document.getElementById('vos-os-serie');
  if(!inp || document.getElementById('vos-os-serie-lupa')) return;
  inp.removeAttribute('onchange');
  inp.oninput=null;
  inp.onchange=null;
  var lab=inp.closest('label')||inp.parentNode;
  if(lab){
    lab.classList.add('relative');
    inp.insertAdjacentHTML('afterend',
      '<button id="vos-os-serie-lupa" type="button" class="absolute right-1 bottom-1 w-8 h-[34px] rounded-lg bg-[#0a1e8a] text-white grid place-items-center" title="Buscar série">'
      +'<i class="ph ph-magnifying-glass"></i></button>');
  }
  inp.onkeydown=function(e){
    if(e.key==='Enter'){ e.preventDefault(); if(typeof window.vosBuscarSerial==='function') window.vosBuscarSerial(inp.value); }
  };
  var lupa=document.getElementById('vos-os-serie-lupa');
  if(lupa) lupa.onclick=function(e){ e.preventDefault(); if(typeof window.vosBuscarSerial==='function') window.vosBuscarSerial(inp.value); };
}

function esconderValorOS(){
  ['vos-os-valor','vos-os-desc'].forEach(function(id){
    var el=document.getElementById(id);
    var lab=el && el.closest('label');
    if(lab) lab.classList.add('hidden');
    if(el){ el.value='0'; }
  });
  var linha=document.getElementById('vos-sub-os');
  if(linha && linha.parentNode) linha.parentNode.classList.add('hidden');
}

function pintarVenda(){
  azulLabels(document.getElementById('modal-body'));
  aplicarGarantiaCombo();
  aplicarSerieLupa();
  esconderValorOS();
  var tecLab=document.querySelector('label[for="vos-os-tec"]') || Array.from(document.querySelectorAll('#vos-aba-os label')).find(function(l){ return /Técnico responsável/i.test(l.textContent||''); });
  if(tecLab && !/ \*/.test(tecLab.childNodes[0]&&tecLab.childNodes[0].textContent||tecLab.textContent)){
    /* já tem texto */
  }
}

window.V52237_VENDAS_OS_PURE = {
  AVISO_EPSON: AVISO_EPSON,
  osCompleta: function(os){
    if(!os) return false;
    return !!(txt(os.modelo) && txt(os.numeroSerie) && (txt(os.patrimonio)||txt(os.contador)) && txt(os.tecnico));
  },
  garantiaValor: function(sel, txtDias){
    if(sel==='__escrever__' || !sel){
      var n=parseInt(String(txtDias||'').replace(/\D/g,''),10);
      return n>0 ? (n+' dias') : 'Sem garantia';
    }
    return sel;
  }
};

if(typeof document==='undefined') return;

if(typeof window.vosOsCompleta==='function' && !window.vosOsCompleta.__v52237){
  var oldComp=window.vosOsCompleta;
  window.vosOsCompleta=function(os){
    if(!oldComp(os)) return false;
    return !!txt(os && os.tecnico);
  };
  window.vosOsCompleta.__v52237=true;
}
if(window.__vosPure && typeof window.__vosPure.vosOsCompleta==='function' && !window.__vosPure.vosOsCompleta.__v52237){
  var oldP=window.__vosPure.vosOsCompleta;
  window.__vosPure.vosOsCompleta=function(os){
    if(!oldP(os)) return false;
    return !!txt(os && os.tecnico);
  };
  window.__vosPure.vosOsCompleta.__v52237=true;
}

if(typeof window.vosBuscarSerial==='function' && !window.vosBuscarSerial.__v52237){
  var oldSer=window.vosBuscarSerial;
  window.vosBuscarSerial=function(serial){
    var r=oldSer.apply(this, arguments);
    try{
      var s=txt(serial).toLowerCase();
      if(!s || typeof getSession!=='function' || typeof db==='undefined') return r;
      var sess=getSession();
      var hist=(db.vendas||[]).filter(function(v){
        return v && v.empresaId===sess.empresaId && v.os && txt(v.os.numeroSerie||v.os.serie).toLowerCase()===s;
      }).sort(function(a,b){ return new Date(b.data||0)-new Date(a.data||0); });
      var ult=hist[0];
      if(!ult || !ult.os) return r;
      var set=function(id,val){ var el=document.getElementById(id); if(el && val) el.value=String(val); };
      set('vos-os-modelo', ult.os.modelo||ult.os.equipamentoModelo||'');
      set('vos-os-patri', ult.os.patrimonio||'');
      if(ult.clienteId && typeof window.vosVendaSelectCliente==='function') window.vosVendaSelectCliente(ult.clienteId);
    }catch(e){}
    return r;
  };
  window.vosBuscarSerial.__v52237=true;
}

function wrapColetar(){
  if(typeof window.vosColetarOS!=='function') return;
  if(window.vosColetarOS.__v52237) return;
  var old=window.vosColetarOS;
  window.vosColetarOS=function(){
    var os=old.apply(this, arguments)||{};
    os.valorServico=0;
    os.desconto=0;
    var sel=document.getElementById('vos-os-garantia');
    var inp=document.getElementById('vos-os-garantia-txt');
    os.garantia=window.V52237_VENDAS_OS_PURE.garantiaValor(sel&&sel.value, inp&&inp.value);
    return os;
  };
  window.vosColetarOS.__v52237=true;
}

if(typeof window.vosOsRuleHint==='function' && !window.vosOsRuleHint.__v52237){
  var oldHint=window.vosOsRuleHint;
  window.vosOsRuleHint=function(){
    var r=oldHint.apply(this, arguments);
    var el=document.getElementById('vos-os-rule');
    if(!el || typeof window.vosColetarOS!=='function') return r;
    var os=window.vosColetarOS();
    if(txt(os.modelo)&&txt(os.numeroSerie)&&(txt(os.patrimonio)||txt(os.contador)) && !txt(os.tecnico)){
      el.className='rounded-xl border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900';
      el.innerHTML='<i class="ph ph-warning"></i> Para ordem de serviço, escolha o <b>técnico responsável</b>.';
    }
    return r;
  };
  window.vosOsRuleHint.__v52237=true;
}

function wrapGravar(){
  if(typeof window.vosGravarVenda!=='function' || window.vosGravarVenda.__v52237) return;
  var old=window.vosGravarVenda;
  window.vosGravarVenda=function(){
    wrapColetar();
    var os = document.getElementById('vos-aba-os') && typeof window.vosColetarOS==='function' ? window.vosColetarOS() : null;
    var tem = os && ['numeroSerie','modelo','patrimonio','contador','defeito','servicos','pecas','acessorios','tecnico'].some(function(k){ return txt(os[k]); });
    if(tem && !txt(os.tecnico)){
      if(typeof window.lfbAlert==='function') window.lfbAlert('Para ordem de serviço, escolha o técnico responsável.','Ordem de serviço');
      else if(typeof toast==='function') toast('Escolha o técnico responsável','error');
      if(typeof window.vosSetAba==='function') window.vosSetAba('os');
      return null;
    }
    return old.apply(this, arguments);
  };
  window.vosGravarVenda.__v52237=true;
}

if(typeof window.vosGerarHtmlNotinha==='function' && !window.vosGerarHtmlNotinha.__v52237){
  var oldHtml=window.vosGerarHtmlNotinha;
  window.vosGerarHtmlNotinha=function(vendaId, opts){
    var html=oldHtml.apply(this, arguments);
    if(!html) return html;
    var aviso='<div class="aviso-epson" style="margin:3mm 0 0;padding:2.5mm 3mm;border:1.6px solid #0a1e8a;background:#eef2ff;border-radius:2mm;font-size:9.5px;line-height:1.35;color:#0a1e8a;white-space:pre-wrap;font-weight:600">'
      +AVISO_EPSON.replace(/</g,'&lt;')+'</div>';
    var temOS=/ORDEM DE SERVIÇO|os-div/.test(html);
    if(temOS){
      if(html.indexOf('aviso-epson')<0){
        if(html.indexOf('<p class="audit">')>=0) html=html.replace('<p class="audit">', aviso+'<p class="audit">');
        else html=html.replace('</div>\n  <div class="corte', aviso+'</div>\n  <div class="corte');
      }
    }
    return html;
  };
  window.vosGerarHtmlNotinha.__v52237=true;
}

['novaVenda','vosCarregarVendaNaTela'].forEach(function(nome){
  if(typeof window[nome]!=='function' || window[nome].__v52237vis) return;
  var old=window[nome];
  window[nome]=function(){
    var r=old.apply(this, arguments);
    setTimeout(function(){ wrapColetar(); wrapGravar(); pintarVenda(); }, 40);
    return r;
  };
  window[nome].__v52237vis=true;
});

setTimeout(function(){ wrapColetar(); wrapGravar(); }, 300);

console.log('[DIGICOPY] v5.22.37 vendas/OS visual, série, garantia, técnico, EPSON');
})();
