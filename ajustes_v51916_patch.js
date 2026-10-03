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
function produtoDaEmpresa(dbRef,id,empresaId){
  if(!id||!empresaId) return null;
  return (dbRef&&dbRef.produtos||[]).find(function(p){ return p&&String(p.id)===String(id)&&p.empresaId===empresaId; })||null;
}
function produtosDaEmpresa(dbRef,ids,empresaId){
  if(!empresaId) return [];
  var wanted=new Set((ids||[]).map(String));
  return (dbRef&&dbRef.produtos||[]).filter(function(p){ return p&&p.empresaId===empresaId&&wanted.has(String(p.id)); });
}
window.AJUSTES_V51916_PURE = { produtoDaEmpresa:produtoDaEmpresa, produtosDaEmpresa:produtosDaEmpresa, deleteProdutoConfirmaInternamente:true };

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
  const s = sess();
  if(!s||!s.empresaId){ avisar('Não foi possível identificar a empresa da sessão. Nenhum produto foi excluído.'); return Promise.resolve(false); }
  const checks = Array.from(document.querySelectorAll('input[name="produto-check-lote"]:checked'));
  const ids = Array.from(new Set(checks.map(ch => String(ch.value || '')).filter(Boolean)));
  const alvos = produtosDaEmpresa(db, ids, s.empresaId);
  if(!alvos.length){ avisar('Marque os produtos desta empresa para excluir.'); return Promise.resolve(false); }
  if(typeof window.confirmSistema !== 'function'){
    avisar('A confirmação do sistema não está disponível. Os produtos foram mantidos.');
    return Promise.resolve(false);
  }
  const idsAlvo = alvos.map(p => String(p.id));
  let confirmacao;
  try{ confirmacao = confirmar('Deseja excluir ' + alvos.length + ' produto(s)?', 'Excluir Produtos'); }
  catch(e){ avisar('Não foi possível confirmar a exclusão. Os produtos foram mantidos.'); return Promise.resolve(false); }
  return Promise.resolve(confirmacao).then(function(ok){
    if(ok !== true){ if(ok !== false) avisar('Não foi possível confirmar a exclusão. Os produtos foram mantidos.'); return false; }
    const sessaoAtual = sess();
    if(!sessaoAtual || sessaoAtual.empresaId !== s.empresaId){ avisar('A empresa da sessão mudou. Nenhum produto foi excluído.'); return false; }
    const atuais = produtosDaEmpresa(db, idsAlvo, s.empresaId);
    if(!atuais.length){ avisar('Os produtos selecionados não estão mais disponíveis nesta empresa.'); return false; }
    const idsAtuais = new Set(atuais.map(p => String(p.id)));
    db.produtos = (db.produtos || []).filter(x => !(x && x.empresaId === s.empresaId && idsAtuais.has(String(x.id))));
    atuais.forEach(function(p){
      if(typeof logAction === 'function') logAction('produto', 'excluir', p.id, 'Excluído produto ' + (p.nome || ''));
    });
    if(typeof saveDB === 'function') saveDB();
    if(typeof renderProdutos === 'function') renderProdutos();
    if(typeof renderAuditoria === 'function') renderAuditoria();
    if(typeof toast === 'function') toast(atuais.length + ' produto(s) excluído(s)', 'success');
    return true;
  },function(){
    avisar('Não foi possível confirmar a exclusão. Os produtos foram mantidos.');
    return false;
  });
};

// Corrige a função original (sem confirm() quebrado)
window.deleteProduto = function(id){
  const s = sess();
  if(!s||!s.empresaId){ avisar('Não foi possível identificar a empresa da sessão. Nenhum produto foi excluído.'); return Promise.resolve(false); }
  const p = produtoDaEmpresa(db, id, s.empresaId);
  if(!p){ avisar('Produto não encontrado nesta empresa.'); return Promise.resolve(false); }
  if(typeof window.confirmSistema !== 'function'){
    avisar('A confirmação do sistema não está disponível. O produto foi mantido.');
    return Promise.resolve(false);
  }
  let confirmacao;
  try{ confirmacao = confirmar('Excluir produto "' + (p.nome || '') + '"?', 'Excluir Produto'); }
  catch(e){ avisar('Não foi possível confirmar a exclusão. O produto foi mantido.'); return Promise.resolve(false); }
  return Promise.resolve(confirmacao).then(function(ok){
    if(ok !== true){ if(ok !== false) avisar('Não foi possível confirmar a exclusão. O produto foi mantido.'); return false; }
    const sessaoAtual = sess();
    if(!sessaoAtual || sessaoAtual.empresaId !== s.empresaId){ avisar('A empresa da sessão mudou. Nenhum produto foi excluído.'); return false; }
    const atual = produtoDaEmpresa(db, id, s.empresaId);
    if(!atual){ avisar('Produto não encontrado nesta empresa.'); return false; }
    db.produtos = (db.produtos || []).filter(x => !(x && String(x.id) === String(id) && x.empresaId === s.empresaId));
    if(typeof logAction === 'function') logAction('produto', 'excluir', id, 'Excluído produto ' + (atual.nome || ''));
    if(typeof saveDB === 'function') saveDB();
    if(typeof renderProdutos === 'function') renderProdutos();
    if(typeof renderAuditoria === 'function') renderAuditoria();
    if(typeof toast === 'function') toast('Produto excluído', 'success');
    return true;
  },function(){
    avisar('Não foi possível confirmar a exclusão. O produto foi mantido.');
    return false;
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
  // Reusa os checkboxes já existentes (lc-chk-os, do "finalizar selecionados")
  const checks = Array.from(document.querySelectorAll('.lc-chk-os:checked'));
  let ids = checks.map(ch => ch.value).filter(Boolean);
  if(!ids.length){ avisar('Marque os chamados na tabela para excluir.'); return; }
  confirmar('Deseja excluir ' + ids.length + ' chamado(s)?', 'Excluir Chamados').then(function(ok){
    if(!ok) return;
    db.os = (db.os || []).filter(function(o){ return ids.indexOf(o.id) === -1; });
    if(typeof saveDB === 'function') saveDB();
    if(typeof toast === 'function') toast(ids.length + ' chamado(s) excluído(s)', 'success');
    if(typeof abrirHistoricoChamadosGeral === 'function') abrirHistoricoChamadosGeral();
  });
};

// Adiciona APENAS o botão "Excluir" no rodapé da lista de chamados
// (a caixa de seleção já existe — não duplicamos)
function injetarExcluirChamados(){
  const body = document.getElementById('modal-body');
  if(!body) return;
  const table = body.querySelector('table');
  if(!table) return;
  const ths = Array.from(table.querySelectorAll('thead th')).map(th => (th.textContent||'').trim());
  if(!(ths.indexOf('Motivo') !== -1 && ths.indexOf('Equipamento') !== -1)) return;
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
