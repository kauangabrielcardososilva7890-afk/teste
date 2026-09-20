// ═══════════════════════════════════════════════════════════════════════════
// v5.22.45 — Venda: Salvar grava e fecha (sem aviso no mesmo modal);
//            some o botão Sair (fica só o X); faturar não abre impressão.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

window.V52245_VENDA_PURE = {
  precisaCliente: function(form){ return !!(form && form.cliente); },
  faturarNaoImprime: true
};

if(typeof document==='undefined') return;

function telaVenda(){
  return !!(document.getElementById('vos-itens-body') || document.getElementById('vos-cli-search'));
}

function tirarBotaoSair(){
  var foot = document.getElementById('modal-footer');
  if(!foot || !telaVenda()) return;
  foot.querySelectorAll('button').forEach(function(b){
    var t = String(b.textContent||'').trim();
    if(/^sair$/i.test(t) || /ph-x-circle/.test(b.innerHTML||'') && /sair/i.test(t)){
      b.remove();
    }
  });
}

function gravarEFechar(){
  var f=window.__vosForm;
  if(!f) return false;
  if(!f.cliente){
    if(typeof window.lfbAlert==='function') window.lfbAlert('Escolha o cliente.','Venda');
    else if(typeof toast==='function') toast('Selecione o cliente','error');
    return false;
  }
  var gravar = window.vosGravarVenda;
  if(typeof gravar!=='function'){
    if(typeof window.lfbAlert==='function') window.lfbAlert('Não foi possível gravar a venda.','Venda');
    return false;
  }
  window.__vosIgnorarSair=true;
  var v=gravar(true);
  if(!v){
    window.__vosIgnorarSair=false;
    return false;
  }
  window.__vosPersistida=true;
  window.__vosDirty=false;
  if(typeof toast==='function') toast('Venda '+v.numero+' salva','success');
  if(typeof closeModal==='function') closeModal(true);
  window.__vosIgnorarSair=false;
  if(typeof renderVendas==='function') renderVendas();
  return true;
}

window.vosSalvarVenda=function(){
  gravarEFechar();
};

['novaVenda','vosCarregarVendaNaTela'].forEach(function(nome){
  if(typeof window[nome]!=='function' || window[nome].__v52245sair) return;
  var old=window[nome];
  window[nome]=function(){
    var r=old.apply(this, arguments);
    setTimeout(tirarBotaoSair, 0);
    setTimeout(tirarBotaoSair, 80);
    return r;
  };
  window[nome].__v52245sair=true;
});

if(typeof window.imprimirNotinha==='function' && !window.imprimirNotinha.__v52245noprint){
  var oldImp=window.imprimirNotinha;
  window.imprimirNotinha=function(){
    if(window.__vosFatSemPrint) return;
    return oldImp.apply(this, arguments);
  };
  window.imprimirNotinha.__v52245noprint=true;
}

if(typeof window.vosConcluirFaturamento==='function' && !window.vosConcluirFaturamento.__v52245noprint){
  var oldFat=window.vosConcluirFaturamento;
  window.vosConcluirFaturamento=function(){
    window.__vosFatSemPrint=true;
    try{ return oldFat.apply(this, arguments); }
    finally{
      setTimeout(function(){ window.__vosFatSemPrint=false; }, 800);
    }
  };
  window.vosConcluirFaturamento.__v52245noprint=true;
}

console.log('[DIGICOPY] v5.22.45 venda: salvar fecha, sem Sair, faturar sem imprimir');
})();
