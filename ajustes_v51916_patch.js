// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.16 — vendas faturadas, excluir produto e contrato
// • 1  — Venda faturada abre na tela PRINCIPAL (cadastro), travada, em vez da
//        tela de histórico.
// • 2  — Excluir produto agora funciona (o confirm() nativo estava quebrado) e
//        ganha seleção múltipla + botão único de excluir (igual vendas).
// • 3  — Excluir contrato agora funciona e ganha seleção múltipla (igual vendas).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function low(v){ return String(v == null ? '' : v).toLowerCase().trim(); }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function avisar(m){ if(typeof window.lfbAlert === 'function') return window.lfbAlert(m, 'Aviso'); else if(typeof toast === 'function') return toast(m, 'info'); }
function confirmar(m, t){ return typeof window.confirmSistema === 'function' ? window.confirmSistema(m, t || 'Confirmar') : Promise.resolve(false); }

// ═════════════════════════════════════════════════════════════════════════
// Item 1 — venda faturada abre na tela principal (cadastro), travada
// ═════════════════════════════════════════════════════════════════════════
const _hist51916 = window.historicoVenda;
if(typeof _hist51916 === 'function'){
  window.historicoVenda = window.showVenda = function(id){
    const v = (typeof db !== 'undefined' && db.vendas || []).find(x => x.id === id);
    if(v && ['faturado','finalizada','concluido','pago'].indexOf(low(v.status)) !== -1){
      if(typeof window.vosCarregarVendaNaTela === 'function'){ window.vosCarregarVendaNaTela(id); return; }
    }
    return _hist51916.apply(this, arguments);
  };
}

// ═════════════════════════════════════════════════════════════════════════
// Item 2 — excluir produto (corrige confirm quebrado + seleção múltipla)
// ═════════════════════════════════════════════════════════════════════════
window.excluirProdutoUnificado = function(){
  const checks = Array.from(document.querySelectorAll('input[name="produto-check-lote"]:checked'));
  let alvos = [];
  if(checks.length){
    alvos = checks.map(ch => (db.produtos || []).find(x => x.id === ch.value)).filter(Boolean);
  }
  if(!alvos.length){ avisar('Marque os produtos na tabela para excluir.'); return; }
  confirmar('Deseja excluir ' + alvos.length + ' produto(s)?', 'Excluir Produtos').then(function(ok){
    if(!ok) return;
    alvos.forEach(function(p){
      db.produtos = (db.produtos || []).filter(x => x.id !== p.id);
      if(typeof logAction === 'function') logAction('produto', 'excluir', p.id, 'Excluído produto ' + (p.nome || ''));
    });
    if(typeof saveDB === 'function') saveDB();
    if(typeof renderProdutos === 'function') renderProdutos();
    if(typeof renderAuditoria === 'function') renderAuditoria();
    if(typeof toast === 'function') toast(alvos.length + ' produto(s) excluído(s)', 'success');
  });
};

// Corrige a função original (sem confirm() quebrado)
window.deleteProduto = function(id){
  const p = (db.produtos || []).find(x => x.id === id);
  if(!p) return;
  confirmar('Excluir produto "' + (p.nome || '') + '"?', 'Excluir Produto').then(function(ok){
    if(!ok) return;
    db.produtos = (db.produtos || []).filter(x => x.id !== id);
    if(typeof logAction === 'function') logAction('produto', 'excluir', id, 'Excluído produto ' + (p.nome || ''));
    if(typeof saveDB === 'function') saveDB();
    if(typeof renderProdutos === 'function') renderProdutos();
    if(typeof renderAuditoria === 'function') renderAuditoria();
    if(typeof toast === 'function') toast('Produto excluído', 'success');
  });
};

// ═════════════════════════════════════════════════════════════════════════
// Item 3 — excluir contrato (corrige confirm quebrado + seleção múltipla)
// ═════════════════════════════════════════════════════════════════════════
window.excluirContratoUnificado = function(){
  const checks = Array.from(document.querySelectorAll('input[name="contrato-check-lote"]:checked'));
  let alvos = [];
  if(checks.length){
    alvos = checks.map(ch => (db.contratos || []).find(x => x.id === ch.value)).filter(Boolean);
  }
  if(!alvos.length){ avisar('Marque os contratos na tabela para excluir.'); return; }
  confirmar('Deseja excluir ' + alvos.length + ' contrato(s)?', 'Excluir Contratos').then(function(ok){
    if(!ok) return;
    alvos.forEach(function(c){
      c.status = 'excluido';
      (db.parque || []).forEach(function(p){ if(p.contratoId === c.id) p.status = 'inativo'; });
      if(typeof logAction === 'function') logAction('contrato', 'excluir', c.id, 'Contrato ' + (c.numero || '') + ' excluído');
    });
    if(typeof saveDB === 'function') saveDB();
    if(typeof renderContratos === 'function') renderContratos();
    if(typeof toast === 'function') toast(alvos.length + ' contrato(s) excluído(s)', 'success');
  });
};

window.excluirContratoOperacional = function(id){
  const c = (db.contratos || []).find(x => x.id === id);
  if(!c) return;
  confirmar('Excluir o contrato ' + (c.numero || '') + '?', 'Excluir Contrato').then(function(ok){
    if(!ok) return;
    c.status = 'excluido';
    (db.parque || []).forEach(function(p){ if(p.contratoId === id) p.status = 'inativo'; });
    if(typeof logAction === 'function') logAction('contrato', 'excluir', id, 'Contrato ' + (c.numero || '') + ' excluído');
    if(typeof saveDB === 'function') saveDB();
    if(typeof renderContratos === 'function') renderContratos();
    if(typeof toast === 'function') toast('Contrato excluído', 'success');
  });
};

// ═════════════════════════════════════════════════════════════════════════
// Seleção múltipla: injeta checkboxes + botão "Excluir" (igual vendas)
// ═════════════════════════════════════════════════════════════════════════
function extrairIdDe(onclick){
  const m = String(onclick || '').match(/'([^']+)'/);
  return m ? m[1] : '';
}

// Adiciona o botão "Excluir" no topo (ao lado de "Novo produto"/"Novo contrato")
function adicionarBotaoExcluirTopo(view, alvoOnclick, idBtn, fn){
  if(!view || view.querySelector('#' + idBtn)) return;
  const botaoNovo = Array.from(view.querySelectorAll('button')).find(function(b){
    return (b.getAttribute('onclick') || '').indexOf(alvoOnclick) !== -1;
  });
  if(!botaoNovo) return;
  const btn = document.createElement('button');
  btn.id = idBtn;
  btn.className = 'h-10 px-4 rounded-xl bg-red-600 text-white font-bold text-[13px]';
  btn.innerHTML = '<i class="ph ph-trash mr-1"></i>Excluir';
  btn.onclick = fn;
  botaoNovo.parentNode.insertBefore(btn, botaoNovo.nextSibling);
}

// Remove os botões de lixeira INDIVIDUAIS (deixando só o do topo)
function removerLixeirasIndividuais(view, alvoOnclick){
  view.querySelectorAll('button').forEach(function(b){
    const oc = b.getAttribute('onclick') || '';
    if(oc.indexOf(alvoOnclick) !== -1) b.remove();
  });
}

function injetarSelecaoMultipla(){
  // PRODUTOS
  var vp = document.getElementById('view-produtos');
  if(vp){
    var tbp = vp.querySelector('table');
    if(tbp){
      var theadp = tbp.querySelector('thead tr');
      if(theadp && !theadp.querySelector('.th-prod-lote')){
        var thp = document.createElement('th');
        thp.className = 'th-prod-lote px-2 w-8';
        thp.innerHTML = '<input type="checkbox" onclick="document.querySelectorAll(\'input[name=\\\'produto-check-lote\\\']\').forEach(c=>c.checked=this.checked)">';
        theadp.prepend(thp);
      }
      tbp.querySelectorAll('tbody tr').forEach(function(tr){
        if(tr.querySelector('.td-prod-lote')) return;
        var btn = tr.querySelector('button[onclick*="deleteProduto"]');
        var id = btn ? extrairIdDe(btn.getAttribute('onclick')) : '';
        if(!id){
          var odc = tr.getAttribute('ondblclick') || '';
          id = extrairIdDe(odc);
        }
        var td = document.createElement('td');
        td.className = 'td-prod-lote px-2 w-8';
        td.innerHTML = id ? '<input type="checkbox" name="produto-check-lote" value="' + id + '" onclick="event.stopPropagation()">' : '';
        tr.prepend(td);
      });
    }
    // remove lixeiras individuais + adiciona botão Excluir no topo
    removerLixeirasIndividuais(vp, 'deleteProduto');
    adicionarBotaoExcluirTopo(vp, "openModal('produto')", 'btn-excluir-produto-lote', window.excluirProdutoUnificado);
  }

  // CONTRATOS
  var vc = document.getElementById('view-contratos');
  if(vc){
    var tbc = vc.querySelector('table');
    if(tbc){
      var theadc = tbc.querySelector('thead tr');
      if(theadc && !theadc.querySelector('.th-contrato-lote')){
        var thc = document.createElement('th');
        thc.className = 'th-contrato-lote px-2 w-8';
        thc.innerHTML = '<input type="checkbox" onclick="document.querySelectorAll(\'input[name=\\\'contrato-check-lote\\\']\').forEach(c=>c.checked=this.checked)">';
        theadc.prepend(thc);
      }
      tbc.querySelectorAll('tbody tr').forEach(function(tr){
        if(tr.querySelector('.td-contrato-lote')) return;
        var btn = tr.querySelector('button[onclick*="excluirContratoOperacional"]');
        var id = btn ? extrairIdDe(btn.getAttribute('onclick')) : '';
        if(!id){
          var odc = tr.getAttribute('ondblclick') || '';
          id = extrairIdDe(odc);
        }
        var td = document.createElement('td');
        td.className = 'td-contrato-lote px-2 w-8';
        td.innerHTML = id ? '<input type="checkbox" name="contrato-check-lote" value="' + id + '" onclick="event.stopPropagation()">' : '';
        tr.prepend(td);
      });
    }
    // remove lixeiras individuais (mantendo editar)
    removerLixeirasIndividuais(vc, 'excluirContratoOperacional');
    // adiciona botão Excluir no topo (não há botão "Novo contrato" no fluxos? usa openModal('contrato'))
    adicionarBotaoExcluirTopo(vc, "openModal('contrato')", 'btn-excluir-contrato-lote', window.excluirContratoUnificado);
  }
}

// Roda após qualquer render (observer)
var _injTimer = null;
function agendarInjecao(){
  if(_injTimer) return;
  _injTimer = setTimeout(function(){ _injTimer = null; injetarSelecaoMultipla(); }, 60);
}
try{
  new MutationObserver(function(){ agendarInjecao(); }).observe(document.body, { childList: true, subtree: true });
}catch(e){}

// Também reaplica ao trocar de tela (navigateTo)
const _nav51916 = window.navigateTo;
if(typeof _nav51916 === 'function'){
  window.navigateTo = function(){
    const r = _nav51916.apply(this, arguments);
    setTimeout(injetarSelecaoMultipla, 0);
    setTimeout(injetarSelecaoMultipla, 120);
    return r;
  };
}

console.log('[DIGICOPY] ajustes_v51916_patch.js');
})();
