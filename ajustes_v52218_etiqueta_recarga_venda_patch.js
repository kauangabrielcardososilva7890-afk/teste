// ═══════════════════════════════════════════════════════════════════════════
// v5.22.18 — Etiqueta na recarga: sem botão cadastrar, duplicata bloqueada,
// preenche cliente sozinha, some no estorno se não restar venda ativa
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function normEtq(v){ return String(v==null?'':v).replace(/\s+/g,'').toUpperCase(); }
function ehRecargaTipo(tipo){ return /recarga/i.test(String(tipo||'')); }
function vendasAtivasComEtiqueta(etq, ignorarVendaId){
  var k=normEtq(etq); if(!k) return [];
  return (typeof db!=='undefined' && db.vendas||[]).filter(function(v){
    if(!v || v.id===ignorarVendaId) return false;
    var st=String(v.status||'').toLowerCase();
    if(st==='estornada'||st==='estornado'||st==='cancelada'||st==='cancelado') return false;
    return (v.itens||[]).some(function(it){ return normEtq(it.numCartucho||it.identificacao)===k; });
  });
}
function etiquetaEmUso(etq, ignorarVendaId){
  return vendasAtivasComEtiqueta(etq, ignorarVendaId).length>0;
}

window.ETIQUETA_RECARGA_VENDA_PURE = {
  normEtq: normEtq,
  ehRecargaTipo: ehRecargaTipo,
  vendasAtivasComEtiqueta: vendasAtivasComEtiqueta,
  etiquetaEmUso: etiquetaEmUso
};

if(typeof document==='undefined') return;

function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Aviso'); if(typeof toast==='function') toast(m,'info'); }
function storeEtq(){
  if(typeof db==='undefined') return [];
  db.recargasEtiquetas=db.recargasEtiquetas||[];
  return db.recargasEtiquetas;
}

function tirarBotaoCadastrar(){
  var btn=document.getElementById('vos-btn-cadastrar-etiqueta');
  if(btn){ btn.remove(); }
}

if(typeof window.vosCadastrarEtiquetaRecarga==='function'){
  window.vosCadastrarEtiquetaRecarga=function(){ tirarBotaoCadastrar(); };
}

if(typeof window.vosAddItem==='function' && !window.vosAddItem.__v52218etq){
  var oldAdd=window.vosAddItem;
  window.vosAddItem=function(){
    var tipo=(document.getElementById('vos-item-tipo')||{}).value;
    if(ehRecargaTipo(tipo)){
      var etq=String((document.getElementById('vos-item-cartucho')||{}).value||'').trim();
      if(etq){
        var f=window.__vosForm;
        var noForm=(f&&f.itens||[]).some(function(it){ return normEtq(it.numCartucho||it.identificacao)===normEtq(etq); });
        var vendaId=f&&f.vendaId;
        if(noForm || etiquetaEmUso(etq, vendaId)){
          aviso('Já existe um cartucho de recarga com essa etiqueta. Não dá para lançar a mesma etiqueta de novo.','Etiqueta repetida');
          return;
        }
      }
    }
    return oldAdd.apply(this, arguments);
  };
  window.vosAddItem.__v52218etq=true;
}

if(typeof window.vosVendaSearchProd==='function' && !window.vosVendaSearchProd.__v52218prod){
  var oldSearch=window.vosVendaSearchProd;
  window.vosVendaSearchProd=function(q){
    var tipo=(document.getElementById('vos-item-tipo')||{}).value;
    if(!ehRecargaTipo(tipo)){
      var r=oldSearch.apply(this, arguments);
      var el=document.getElementById('vos-prod-results');
      if(el){
        el.querySelectorAll('button').forEach(function(b){
          if(/recarga/i.test(b.textContent||'')) b.remove();
        });
      }
      return r;
    }
    return oldSearch.apply(this, arguments);
  };
  window.vosVendaSearchProd.__v52218prod=true;
}

if(typeof window.vosBuscarEtiquetaNaVenda==='function' && !window.vosBuscarEtiquetaNaVenda.__v52218){
  var oldBusca=window.vosBuscarEtiquetaNaVenda;
  window.vosBuscarEtiquetaNaVenda=function(){
    tirarBotaoCadastrar();
    var etq=String((document.getElementById('vos-item-cartucho')||{}).value||'').trim();
    var rec=(storeEtq()||[]).find(function(r){ return normEtq(r.etiqueta)===normEtq(etq); });
    var f=window.__vosForm;
    var temCli=f&&f.cliente;
    if(!temCli && rec && rec.clienteId && typeof window.vosVendaSelectCliente==='function'){
      window.vosVendaSelectCliente(rec.clienteId);
    } else if(!temCli){
      var vendas=vendasAtivasComEtiqueta(etq);
      if(vendas.length && vendas[0].clienteId && typeof window.vosVendaSelectCliente==='function'){
        window.vosVendaSelectCliente(vendas[0].clienteId);
      }
    }
    var cli=window.__vosForm&&window.__vosForm.cliente;
    if(rec && cli && rec.clienteId && rec.clienteId!==cli.id){
      var nome=rec.clienteNome||'outro cliente';
      var msg='O cartucho dessa etiqueta não é deste cliente ('+nome+'). Deseja lançar mesmo assim?';
      if(typeof window.confirmSistema==='function'){
        window.confirmSistema(msg,'Etiqueta de outro cliente').then(function(ok){
          if(!ok) return;
          oldBusca.apply(window, arguments);
          tirarBotaoCadastrar();
        });
        return;
      }
    }
    var r=oldBusca.apply(this, arguments);
    tirarBotaoCadastrar();
    var btn=document.getElementById('vos-btn-cadastrar-etiqueta'); if(btn) btn.classList.add('hidden');
    return r;
  };
  window.vosBuscarEtiquetaNaVenda.__v52218=true;
}

if(typeof window.estornarNotinha==='function' && !window.estornarNotinha.__v52218etq){
  var oldEst=window.estornarNotinha;
  window.estornarNotinha=window.estornarVenda=function(id){
    var v=(db.vendas||[]).find(function(x){ return x.id===id; });
    var etiquetas=[];
    if(v) (v.itens||[]).forEach(function(it){
      if(ehRecargaTipo(it.tipo)){
        var e=normEtq(it.numCartucho||it.identificacao);
        if(e && etiquetas.indexOf(e)<0) etiquetas.push(e);
      }
    });
    var r=oldEst.apply(this, arguments);
    setTimeout(function(){
      etiquetas.forEach(function(e){
        if(etiquetaEmUso(e, id)) return;
        db.recargasEtiquetas=(db.recargasEtiquetas||[]).filter(function(x){ return normEtq(x.etiqueta)!==e; });
      });
      if(typeof saveDB==='function') saveDB();
    }, 80);
    return r;
  };
  window.estornarNotinha.__v52218etq=true;
}

if(typeof window.vosOnTipoItem==='function' && !window.vosOnTipoItem.__v52218etq){
  var oldTipo=window.vosOnTipoItem;
  window.vosOnTipoItem=function(){
    var r=oldTipo.apply(this, arguments);
    tirarBotaoCadastrar();
    return r;
  };
  window.vosOnTipoItem.__v52218etq=true;
}
setTimeout(tirarBotaoCadastrar, 800);

console.log('[DIGICOPY] v5.22.18 etiqueta recarga: cadastro no faturar, sem duplicar, some no estorno');
})();
