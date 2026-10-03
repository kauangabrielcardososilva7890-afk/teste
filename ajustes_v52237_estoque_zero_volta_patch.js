// ═══════════════════════════════════════════════════════════════════════════
// v5.22.37 — Produto zerado: avisa, abre cadastro na aba Estoque e volta
//            na mesma venda (nada some). Não adiciona o item sozinho.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function n(v){ var x=Number(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:0; }
function ehServico(p){
  if(!p) return true;
  var c=String(p.categoria||'')+' '+String(p.tipo||'');
  return /servi[cç]o|recarga/i.test(c);
}

function snapVenda(){
  var f=window.__vosForm;
  if(!f) return null;
  var os={};
  ['vos-os-serie','vos-os-modelo','vos-os-tipo','vos-os-patri','vos-os-contador','vos-os-acess','vos-os-tec','vos-os-entrega','vos-os-garantia','vos-os-garantia-txt','vos-os-situacao','vos-os-defeito','vos-os-servicos','vos-os-pecas'].forEach(function(id){
    var el=document.getElementById(id); if(el) os[id]=el.value;
  });
  var formCopy;
  try{ formCopy=structuredClone(f); }
  catch(e){ formCopy={vendaId:f.vendaId,codigo:f.codigo,data:f.data,hora:f.hora,itens:(f.itens||[]).map(function(it){return Object.assign({},it);}),cliente:f.cliente?Object.assign({},f.cliente):null,produtoSel:null}; }
  return {
    form: formCopy,
    os: os,
    campos: {
      destino: document.getElementById('vos-destino')&&document.getElementById('vos-destino').value||'',
      dataSaida: document.getElementById('vos-data-saida')&&document.getElementById('vos-data-saida').value||'',
      prazo: document.getElementById('vos-prazo-entrega')&&document.getElementById('vos-prazo-entrega').value||'',
      obs: document.getElementById('vos-obs')&&document.getElementById('vos-obs').value||'',
      status: document.getElementById('vos-status')&&document.getElementById('vos-status').value||'',
      desc: document.getElementById('vos-desc-venda')&&document.getElementById('vos-desc-venda').value||'0'
    },
    aba: document.getElementById('vos-aba-os') && !document.getElementById('vos-aba-os').classList.contains('hidden') ? 'os' : 'itens'
  };
}

function restaurar(snap){
  if(!snap || typeof window.novaVenda!=='function') return;
  window.__vosIgnorarSair=true;
  window.novaVenda();
  var f=window.__vosForm;
  if(f && snap.form){
    f.vendaId=snap.form.vendaId||null;
    f.codigo=snap.form.codigo||f.codigo;
    f.data=snap.form.data||f.data;
    f.hora=snap.form.hora||f.hora;
    f.itens=(snap.form.itens||[]).map(function(it){ return Object.assign({},it); });
    if(snap.form.cliente && snap.form.cliente.id && typeof window.vosVendaSelectCliente==='function'){
      window.vosVendaSelectCliente(snap.form.cliente.id);
    }
  }
  var c=snap.campos||{};
  function setv(id,v){ var el=document.getElementById(id); if(el && v!=null) el.value=v; }
  setv('vos-destino', c.destino); setv('vos-data-saida', c.dataSaida);
  setv('vos-prazo-entrega', c.prazo); setv('vos-obs', c.obs);
  setv('vos-status', c.status); setv('vos-desc-venda', c.desc);
  Object.keys(snap.os||{}).forEach(function(id){ setv(id, snap.os[id]); });
  var elCod=document.getElementById('vos-codigo');
  if(elCod && f && f.codigo) elCod.textContent=f.codigo;
  if(typeof window.vosRenderItens==='function') window.vosRenderItens();
  if(typeof window.vosResumoVenda==='function') window.vosResumoVenda();
  if(snap.aba==='os' && typeof window.vosSetAba==='function') window.vosSetAba('os');
  var modal=document.getElementById('modal-root');
  if(modal) modal.classList.remove('hidden');
  setTimeout(function(){ window.__vosIgnorarSair=false; }, 80);
}

function abrirEstoque(p){
  window.__vosPendenteVoltaVenda={ produtoId:p.id, snap:snapVenda() };
  window.__vosIgnorarSair=true;
  if(typeof window.openModal==='function') window.openModal('produto', p.id);
  setTimeout(function(){
    if(typeof window.mudarAbaProdutoOperacional==='function') window.mudarAbaProdutoOperacional('estoque');
    var tab=document.getElementById('kp-tab-prod-estoque');
    if(tab) tab.click();
    window.__vosIgnorarSair=false;
  }, 80);
}

function perguntarZerado(p){
  var msg='O produto "'+(p.nome||'')+'" está com estoque zerado. Deseja modificar o estoque?';
  var tit='Estoque zerado';
  if(typeof window.confirmSistema==='function'){
    window.confirmSistema(msg, tit).then(function(ok){ if(ok) abrirEstoque(p); });
  } else if(typeof window.lfbAlert==='function'){
    window.lfbAlert(msg, tit);
  }
}

function voltarSePendente(){
  var pend=window.__vosPendenteVoltaVenda;
  if(!pend || !pend.snap) return false;
  window.__vosPendenteVoltaVenda=null;
  setTimeout(function(){ restaurar(pend.snap); }, 20);
  return true;
}

window.V52237_ESTOQUE_ZERO_PURE = {
  ehServico: ehServico,
  precisaAviso: function(p, qtd){
    if(!p || ehServico(p) || p.estoqueInfinito) return false;
    return n(p.estoque)<=0 || n(qtd)>n(p.estoque);
  }
};

if(typeof document==='undefined') return;

if(typeof window.vosAddItem==='function' && !window.vosAddItem.__v52237est){
  var oldAdd=window.vosAddItem;
  window.vosAddItem=function(){
    var f=window.__vosForm;
    var p=f && f.produtoSel;
    var qtd=n(document.getElementById('vos-item-qtd')&&document.getElementById('vos-item-qtd').value)||1;
    if(p && !ehServico(p) && !p.estoqueInfinito && n(p.estoque)<=0){
      perguntarZerado(p);
      return;
    }
    if(p && !ehServico(p) && !p.estoqueInfinito && qtd>n(p.estoque)){
      perguntarZerado(p);
      return;
    }
    return oldAdd.apply(this, arguments);
  };
  window.vosAddItem.__v52237est=true;
}

if(typeof window.vosVendaSelectProd==='function' && !window.vosVendaSelectProd.__v52237est){
  var oldSel=window.vosVendaSelectProd;
  window.vosVendaSelectProd=function(id){
    var r=oldSel.apply(this, arguments);
    var p=(typeof db!=='undefined' && db.produtos||[]).find(function(x){ return x.id===id; });
    if(p && !ehServico(p) && !p.estoqueInfinito && n(p.estoque)<=0) perguntarZerado(p);
    return r;
  };
  window.vosVendaSelectProd.__v52237est=true;
}

['salvarProdutoOperacional','saveProduto','salvarProdutoModal'].forEach(function(nome){
  if(typeof window[nome]!=='function' || window[nome].__v52237est) return;
  var old=window[nome];
  window[nome]=function(){
    var pend=window.__vosPendenteVoltaVenda;
    window.__vosIgnorarSair=true;
    var res=old.apply(this, arguments);
    if(pend) window.__vosPendenteVoltaVenda=pend;
    setTimeout(function(){
      window.__vosIgnorarSair=false;
      if(pend) voltarSePendente();
    }, 40);
    return res;
  };
  window[nome].__v52237est=true;
});

if(typeof window.closeModal==='function' && !window.closeModal.__v52237est){
  var oldClose=window.closeModal;
  window.closeModal=function(){
    if(window.__vosPendenteVoltaVenda && !document.getElementById('vos-itens-body')){
      var pend=window.__vosPendenteVoltaVenda;
      var r=oldClose.apply(this, arguments);
      window.__vosPendenteVoltaVenda=pend;
      voltarSePendente();
      return r;
    }
    return oldClose.apply(this, arguments);
  };
  window.closeModal.__v52237est=true;
}

console.log('[DIGICOPY] v5.22.37 estoque zerado volta na venda');
})();
