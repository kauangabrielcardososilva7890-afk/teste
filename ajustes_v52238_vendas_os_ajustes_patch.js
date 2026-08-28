// ═══════════════════════════════════════════════════════════════════════════
// v5.22.38 — Vendas/OS: lupa da série ao lado da caixa, OS sai na impressão
//            quando tem dados, aviso EPSON só na OS, técnico vazio, * nos
//            obrigatórios, salvar só com cliente, Salvar não pergunta
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function ehVazioTec(v){ return !txt(v) || /^selecione$/i.test(txt(v)); }

function osTemDado(os){
  if(!os) return false;
  return ['numeroSerie','modelo','patrimonio','contador','defeito','servicos','pecas','acessorios','tecnico','tipoOS']
    .some(function(k){ return txt(os[k]) && !ehVazioTec(os[k]); });
}

window.V52238_VENDAS_PURE = {
  osTemDado: osTemDado,
  ehVazioTec: ehVazioTec
};

if(typeof document==='undefined') return;

function serieAoLado(){
  var inp=document.getElementById('vos-os-serie');
  if(!inp) return;
  var lupa=document.getElementById('vos-os-serie-lupa');
  var lab=inp.closest('label')||inp.parentNode;
  if(!lab) return;
  lab.classList.remove('relative');
  var hold=document.getElementById('vos-os-serie-hold');
  if(!hold){
    hold=document.createElement('div');
    hold.id='vos-os-serie-hold';
    hold.className='mt-1 flex items-center gap-1';
    inp.parentNode.insertBefore(hold, inp);
    hold.appendChild(inp);
    inp.classList.add('flex-1');
    inp.classList.remove('mt-1');
    if(!lupa){
      lupa=document.createElement('button');
      lupa.id='vos-os-serie-lupa';
      lupa.type='button';
      lupa.title='Buscar série';
      lupa.innerHTML='<i class="ph ph-magnifying-glass"></i>';
    }
    lupa.className='shrink-0 w-10 h-[40px] rounded-xl bg-[#0a1e8a] text-white grid place-items-center';
    lupa.onclick=function(e){ e.preventDefault(); if(typeof window.vosBuscarSerial==='function') window.vosBuscarSerial(inp.value); };
    hold.appendChild(lupa);
  }
  inp.onkeydown=function(e){
    if(e.key==='Enter'){ e.preventDefault(); if(typeof window.vosBuscarSerial==='function') window.vosBuscarSerial(inp.value); }
  };
}

function tecnicoVazio(){
  var el=document.getElementById('vos-os-tec');
  if(!el) return;
  var nomes=[];
  if(typeof db!=='undefined'){
    (db.tecnicos||[]).forEach(function(t){
      var n=txt(t.nome||t);
      if(n && !ehVazioTec(n)) nomes.push(n);
    });
  }
  if(el.tagName==='SELECT'){
    var atual=el.value;
    el.innerHTML='<option value=""></option>'+nomes.map(function(n){
      return '<option value="'+n.replace(/"/g,'&quot;')+'"'+(atual===n?' selected':'')+'>'+n.replace(/</g,'&lt;')+'</option>';
    }).join('');
    if(ehVazioTec(atual)) el.value='';
    return;
  }
  var sel=document.createElement('select');
  sel.id='vos-os-tec';
  sel.className=el.className||'mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]';
  sel.innerHTML='<option value=""></option>'+nomes.map(function(n){
    return '<option value="'+n.replace(/"/g,'&quot;')+'">'+n.replace(/</g,'&lt;')+'</option>';
  }).join('');
  var val=el.value;
  el.parentNode.replaceChild(sel, el);
  if(!ehVazioTec(val) && nomes.indexOf(val)>=0) sel.value=val;
  else sel.value='';
}

function asteriscos(){
  var mapa={
    'vos-os-serie':'Número de série *',
    'vos-os-modelo':'Modelo do equipamento *',
    'vos-os-patri':'Patrimônio *',
    'vos-os-contador':'Contador / qtd cópias *',
    'vos-os-tec':'Técnico responsável *'
  };
  Object.keys(mapa).forEach(function(id){
    var el=document.getElementById(id);
    var lab=el && el.closest('label');
    if(!lab || lab.getAttribute('data-v52238ast')) return;
    lab.setAttribute('data-v52238ast','1');
    var first=lab.childNodes[0];
    if(first && first.nodeType===3) first.textContent=mapa[id]+' ';
  });
}

function pintar(){
  serieAoLado();
  tecnicoVazio();
  asteriscos();
}

['novaVenda','vosCarregarVendaNaTela'].forEach(function(nome){
  if(typeof window[nome]!=='function' || window[nome].__v52238vis) return;
  var old=window[nome];
  window[nome]=function(){
    var r=old.apply(this, arguments);
    setTimeout(pintar, 50);
    return r;
  };
  window[nome].__v52238vis=true;
});

if(typeof window.vosColetarOS==='function' && !window.vosColetarOS.__v52238tec){
  var oldCol=window.vosColetarOS;
  window.vosColetarOS=function(){
    var os=oldCol.apply(this, arguments)||{};
    if(ehVazioTec(os.tecnico)) os.tecnico='';
    return os;
  };
  window.vosColetarOS.__v52238tec=true;
}

if(typeof window.vosOsCompleta==='function' && !window.vosOsCompleta.__v52238print){
  var oldComp=window.vosOsCompleta;
  window.vosOsCompleta=function(os){
    if(window.__vosPrintando) return osTemDado(os);
    var ok=oldComp.apply(this, arguments);
    if(ok && ehVazioTec(os && os.tecnico)) return false;
    return ok;
  };
  window.vosOsCompleta.__v52238print=true;
}

if(typeof window.vosGerarHtmlNotinha==='function' && !window.vosGerarHtmlNotinha.__v52238print){
  var oldHtml=window.vosGerarHtmlNotinha;
  window.vosGerarHtmlNotinha=function(){
    window.__vosPrintando=true;
    var html;
    try{ html=oldHtml.apply(this, arguments); }
    finally{ window.__vosPrintando=false; }
    if(!html) return html;
    var temOS=/class="os-div"|ORDEM DE SERVIÇO/.test(html) && !/pagina meia/.test(html);
    if(!temOS){
      html=html.replace(/<div class="aviso-epson"[\s\S]*?<\/div>/g,'');
    }
    return html;
  };
  window.vosGerarHtmlNotinha.__v52238print=true;
}

if(typeof window.vosGravarVenda==='function' && !window.vosGravarVenda.__v52238cli){
  var oldGr=window.vosGravarVenda;
  window.vosGravarVenda=function(silencioso){
    var f=window.__vosForm;
    var fake=false;
    if(f && f.cliente && !(f.itens||[]).length){
      f.itens=[{descricao:'', qtd:0, preco:0, subtotal:0, tipo:'Produto', _vazio:1}];
      fake=true;
    }
    var r=oldGr.apply(this, arguments);
    if(fake && f){
      f.itens=(f.itens||[]).filter(function(it){ return !it._vazio; });
      if(r && r.itens) r.itens=r.itens.filter(function(it){ return !it._vazio && (it.qtd||it.descricao); });
    }
    return r;
  };
  window.vosGravarVenda.__v52238cli=true;
}

if(typeof window.vosSalvarVenda==='function' && !window.vosSalvarVenda.__v52238ok){
  window.vosSalvarVenda=function(){
    window.__vosIgnorarSair=true;
    window.__vosDirty=false;
    var v=typeof window.vosGravarVenda==='function' ? window.vosGravarVenda(true) : null;
    window.__vosIgnorarSair=false;
    if(v){
      window.__vosPersistida=true;
      if(typeof toast==='function') toast('Venda '+v.numero+' salva','success');
    }
  };
  window.vosSalvarVenda.__v52238ok=true;
}

setTimeout(pintar, 400);
console.log('[DIGICOPY] v5.22.38 vendas/OS: série, impressão OS, EPSON só na OS, salvar só cliente');
})();
