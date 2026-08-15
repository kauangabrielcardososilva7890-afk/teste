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
// Item 4 — botão de deletar nos chamados fora de contrato (lista de chamados)
// ═════════════════════════════════════════════════════════════════════════
function extrairIdDe(onclick){
  const m = String(onclick || '').match(/'([^']+)'/);
  return m ? m[1] : '';
}

window.excluirChamadosSelecionados = function(){
  const checks = Array.from(document.querySelectorAll('input[name="chamado-check-lote"]:checked'));
  let ids = checks.map(ch => ch.value).filter(Boolean);
  if(!ids.length){ avisar('Marque os chamados na tabela para excluir.'); return; }
  confirmar('Deseja excluir ' + ids.length + ' chamado(s)?', 'Excluir Chamados').then(function(ok){
    if(!ok) return;
    db.os = (db.os || []).filter(function(o){ return ids.indexOf(o.id) === -1; });
    if(typeof saveDB === 'function') saveDB();
    if(typeof toast === 'function') toast(ids.length + ' chamado(s) excluído(s)', 'success');
    // reabre a lista de chamados
    if(typeof abrirHistoricoChamadosGeral === 'function') abrirHistoricoChamadosGeral();
  });
};

function injetarExcluirChamados(){
  const body = document.getElementById('modal-body');
  if(!body) return;
  const table = body.querySelector('table');
  if(!table) return;
  // Só age na lista de chamados (tem coluna "Motivo" e "Equipamento")
  const ths = Array.from(table.querySelectorAll('thead th')).map(th => (th.textContent||'').trim());
  if(!(ths.indexOf('Motivo') !== -1 && ths.indexOf('Equipamento') !== -1)) return;

  // checkbox no thead
  const theadTr = table.querySelector('thead tr');
  if(theadTr && !theadTr.querySelector('.th-chamado-lote')){
    const th = document.createElement('th');
    th.className = 'th-chamado-lote px-2 py-2 w-8';
    th.innerHTML = '<input type="checkbox" onclick="document.querySelectorAll(\'input[name=\\\'chamado-check-lote\\\']\').forEach(c=>c.checked=this.checked)">';
    theadTr.prepend(th);
  }
  // checkbox em cada linha
  table.querySelectorAll('tbody tr').forEach(function(tr){
    if(tr.querySelector('.td-chamado-lote')) return;
    const oc = tr.getAttribute('onclick') || '';
    const id = extrairIdDe(oc);
    const td = document.createElement('td');
    td.className = 'td-chamado-lote px-2 py-2 w-8';
    td.innerHTML = id ? '<input type="checkbox" name="chamado-check-lote" value="' + id + '" onclick="event.stopPropagation()">' : '';
    tr.prepend(td);
  });
  // botão Excluir no rodapé
  const footer = document.getElementById('modal-footer');
  if(footer && !footer.querySelector('#btn-excluir-chamados')){
    const btn = document.createElement('button');
    btn.id = 'btn-excluir-chamados';
    btn.className = 'h-10 px-5 rounded-xl bg-red-600 text-white font-bold';
    btn.innerHTML = '<i class="ph ph-trash mr-1"></i>Excluir';
    btn.onclick = window.excluirChamadosSelecionados;
    footer.appendChild(btn);
  }
}

var _injTimer = null;
function agendarInjecao(){
  if(_injTimer) return;
  _injTimer = setTimeout(function(){ _injTimer = null; injetarExcluirChamados(); }, 60);
}
try{
  new MutationObserver(function(){ agendarInjecao(); }).observe(document.body, { childList: true, subtree: true });
}catch(e){}

console.log('[DIGICOPY] ajustes_v51916_patch.js');
})();
