// ═══════════════════════════════════════════════════════════════════════════
// v5.22.41 — Venda: Salvar grava e fecha. Sair/Fechar também grava.
//            Sem pergunta. Só precisa do cliente.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }

function telaVenda(){
  return !!(document.getElementById('vos-itens-body') || document.getElementById('vos-cli-search'));
}

function gravarEFechar(){
  var f=window.__vosForm;
  if(!f) return false;
  if(!f.cliente){
    if(typeof window.lfbAlert==='function') window.lfbAlert('Escolha o cliente.','Venda');
    else if(typeof toast==='function') toast('Selecione o cliente','error');
    return false;
  }
  window.__vosIgnorarSair=true;
  var v=typeof window.vosGravarVenda==='function' ? window.vosGravarVenda(true) : null;
  if(!v){
    window.__vosIgnorarSair=false;
    return false;
  }
  window.__vosPersistida=true;
  window.__vosDirty=false;
  if(typeof window.lfbAlert==='function') window.lfbAlert('Salvo.','Salvo');
  else if(typeof toast==='function') toast('Venda '+v.numero+' salva','success');
  if(typeof closeModal==='function') closeModal(true);
  window.__vosIgnorarSair=false;
  if(typeof renderVendas==='function') renderVendas();
  return true;
}

window.V52241_VENDA_SALVAR_PURE = {
  precisaCliente: function(form){ return !!(form && form.cliente); }
};

if(typeof document==='undefined') return;

window.vosSalvarVenda=function(){
  gravarEFechar();
};

if(typeof window.closeModal==='function' && !window.closeModal.__v52241venda){
  var oldClose=window.closeModal;
  window.closeModal=function(force){
    if(window.__vosIgnorarSair || force===true){
      return oldClose.apply(this, arguments);
    }
    if(telaVenda() && window.__vosForm){
      var f=window.__vosForm;
      var tem=!!(f.cliente || (f.itens&&f.itens.length));
      if(tem){
        window.__vosIgnorarSair=true;
        if(!f.cliente){
          window.__vosIgnorarSair=false;
          if(typeof window.lfbAlert==='function') window.lfbAlert('Escolha o cliente.','Venda');
          return;
        }
        var v=typeof window.vosGravarVenda==='function' ? window.vosGravarVenda(true) : null;
        if(!v){
          window.__vosIgnorarSair=false;
          return;
        }
        window.__vosPersistida=true;
        window.__vosDirty=false;
      }
      window.__vosIgnorarSair=true;
      var r=oldClose.call(this, true);
      window.__vosIgnorarSair=false;
      if(typeof renderVendas==='function') renderVendas();
      return r;
    }
    return oldClose.apply(this, arguments);
  };
  window.closeModal.__v52241venda=true;
}

console.log('[DIGICOPY] v5.22.41 venda: salvar fecha, fechar salva');
})();
