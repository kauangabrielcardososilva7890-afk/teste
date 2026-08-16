// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.20.23 — Excluir em lote (Clientes e Financeiro) + limpezas
// • Clientes: caixinha de seleção + botão "Excluir selecionados" — apaga DE
//   VERDADE. Cliente COM histórico pede DOIS avisos e apaga o histórico junto
//   (vendas, contratos, chamados, leituras, parque e financeiro).
// • Financeiro: caixinha de seleção + "Excluir selecionados" (apaga de verdade)
//   e removido o botão "Pagar" que ficava junto do cabeçalho/filtro da tela.
// • A exclusão propaga sozinha pros outros PCs (sync apaga por lápide quando o
//   registro some do banco local — nada extra a fazer).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

/* ---------------- LÓGICA PURA (testável em node) ---------------- */

// Todo o histórico ligado a um cliente (pelos ids encadeados).
function historicoCliente(db, cid){
  db = db || {};
  const ctr = new Set(), prk = new Set(), lei = new Set(), oss = new Set(), vda = new Set(), cr = new Set();
  (db.contratos||[]).forEach(c=>{ if(c && c.clienteId===cid) ctr.add(c.id); });
  (db.parque||[]).forEach(p=>{ if(p && (p.clienteId===cid || ctr.has(p.contratoId))) prk.add(p.id); });
  (db.leituras||[]).forEach(l=>{ if(l && (l.clienteId===cid || ctr.has(l.contratoId) || prk.has(l.parqueId))) lei.add(l.id); });
  (db.os||[]).forEach(o=>{ if(o && (o.clienteId===cid || ctr.has(o.contratoId) || prk.has(o.parqueId))) oss.add(o.id); });
  (db.vendas||[]).forEach(v=>{ if(v && v.clienteId===cid) vda.add(v.id); });
  (db.contasReceber||[]).forEach(c=>{ if(c && (c.clienteId===cid || vda.has(c.vendaId) || ctr.has(c.contratoId) || lei.has(c.leituraId))) cr.add(c.id); });
  return { contratos:ctr, parque:prk, leituras:lei, os:oss, vendas:vda, contasReceber:cr };
}

// União do histórico de VÁRIOS clientes (sem contar duas vezes o que é ligado a mais de um).
function historicoVariosClientes(db, ids){
  const acc = { contratos:new Set(), parque:new Set(), leituras:new Set(), os:new Set(), vendas:new Set(), contasReceber:new Set() };
  (ids||[]).forEach(cid=>{
    const h = historicoCliente(db, cid);
    Object.keys(acc).forEach(k=>{ h[k].forEach(id=>acc[k].add(id)); });
  });
  return acc;
}

// Resumo textual do histórico (pro 1º aviso). Ex.: "3 vendas, 1 contrato, 2 chamados".
function resumoHistorico(db, ids){
  const h = historicoVariosClientes(db, ids);
  const partes = [];
  const push = (n, sing, plur)=>{ if(n>0) partes.push(n+' '+(n===1?sing:plur)); };
  push(h.vendas.size,'venda/notinha','vendas/notinhas');
  push(h.contratos.size,'contrato','contratos');
  push(h.os.size,'chamado','chamados');
  push(h.leituras.size,'leitura','leituras');
  push(h.parque.size,'impressora de contrato','impressoras de contrato');
  push(h.contasReceber.size,'lançamento financeiro','lançamentos financeiros');
  const total = h.vendas.size+h.contratos.size+h.os.size+h.leituras.size+h.parque.size+h.contasReceber.size;
  // quantos dos clientes têm pelo menos 1 registro ligado
  let comHistorico = 0;
  (ids||[]).forEach(cid=>{
    const one = historicoCliente(db, cid);
    if(one.vendas.size+one.contratos.size+one.os.size+one.leituras.size+one.parque.size+one.contasReceber.size > 0) comHistorico++;
  });
  return { total, comHistorico, texto: partes.join(', ') };
}

// Exclui os clientes E o histórico junto (de verdade). Devolve as contagens.
// Impressoras que estavam "locado" só por contratos apagados voltam p/ "disponivel".
function excluirClientesCascata(db, ids){
  db = db || {};
  const sel = new Set(ids||[]);
  const h = historicoVariosClientes(db, ids);
  // equipamentos candidatos a liberar (estavam no parque que vai ser apagado)
  const eqCandidatos = new Set();
  (db.parque||[]).forEach(p=>{ if(p && h.parque.has(p.id) && p.equipamentoId) eqCandidatos.add(p.equipamentoId); });
  const clientesAntes = (db.clientes||[]).filter(c=>c && sel.has(c.id)).length;
  db.contratos      = (db.contratos||[]).filter(c=>!(c && h.contratos.has(c.id)));
  db.parque         = (db.parque||[]).filter(p=>!(p && h.parque.has(p.id)));
  db.leituras       = (db.leituras||[]).filter(l=>!(l && h.leituras.has(l.id)));
  db.os             = (db.os||[]).filter(o=>!(o && h.os.has(o.id)));
  db.vendas         = (db.vendas||[]).filter(v=>!(v && h.vendas.has(v.id)));
  db.contasReceber  = (db.contasReceber||[]).filter(c=>!(c && h.contasReceber.has(c.id)));
  db.clientes       = (db.clientes||[]).filter(c=>!(c && sel.has(c.id)));
  // libera impressora que ficou sem contrato/parque ativo
  eqCandidatos.forEach(eqId=>{
    const aindaUsado = (db.parque||[]).some(p=>p && p.equipamentoId===eqId && p.status!=='inativo');
    if(!aindaUsado){
      const eq = (db.equipamentos||[]).find(e=>e && e.id===eqId);
      if(eq && eq.status==='locado') eq.status = 'disponivel';
    }
  });
  return {
    clientes: clientesAntes,
    contratos: h.contratos.size, parque: h.parque.size, leituras: h.leituras.size,
    os: h.os.size, vendas: h.vendas.size, contasReceber: h.contasReceber.size
  };
}

// Exclui lançamentos do financeiro (a receber 'cr' / a pagar 'cp'). De verdade.
function excluirLancamentosFinanceiro(db, alvos){
  db = db || {};
  const cr = new Set(), cp = new Set();
  (alvos||[]).forEach(a=>{ if(!a) return; if(a.tipo==='cp') cp.add(a.id); else cr.add(a.id); });
  const antes = { receber:0, pagar:0 };
  antes.receber = (db.contasReceber||[]).filter(c=>c && cr.has(c.id)).length;
  antes.pagar   = (db.contasPagar||[]).filter(c=>c && cp.has(c.id)).length;
  db.contasReceber = (db.contasReceber||[]).filter(c=>!(c && cr.has(c.id)));
  db.contasPagar   = (db.contasPagar||[]).filter(c=>!(c && cp.has(c.id)));
  return antes;
}

window.AJUSTES_V52023_PURE = { historicoCliente, historicoVariosClientes, resumoHistorico, excluirClientesCascata, excluirLancamentosFinanceiro };

if(typeof document === 'undefined') return; // modo teste (node)

/* ---------------- UI: caixinhas + botões de excluir ---------------- */

function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t); if(typeof toast==='function') toast(m,'info'); return Promise.resolve(undefined); }
function confirma(m,t){ return (typeof window.confirmSistema==='function') ? window.confirmSistema(m,t) : Promise.resolve(false); }

// Lê "cliente','cli_123'" do ondblclick da linha e devolve o id (2º grupo).
function extrairId(tr, prefixo){
  const od = tr.getAttribute('ondblclick')||'';
  const m = od.match(new RegExp(prefixo + "\\('[^']*','([^']+)'\\)"));
  return m ? m[1] : null;
}

function marcarTodos(qual, on){
  const cls = qual==='fin' ? '.fin-del-check' : '.cli-del-check';
  document.querySelectorAll(cls).forEach(c=>{ c.checked = !!on; });
  atualizarBotaoExcluir();
}
function atualizarBotaoExcluir(){
  const nCli = document.querySelectorAll('.cli-del-check:checked').length;
  const bCli = document.getElementById('btn-excluir-clientes');
  if(bCli){ bCli.style.display = nCli? '':'none'; bCli.innerHTML = '<i class="ph ph-trash"></i>Excluir selecionados ('+nCli+')'; }
  const nFin = document.querySelectorAll('.fin-del-check:checked').length;
  const bFin = document.getElementById('btn-excluir-fin');
  if(bFin){ bFin.style.display = nFin? '':'none'; bFin.innerHTML = '<i class="ph ph-trash"></i>Excluir selecionados ('+nFin+')'; }
  const all = document.getElementById('cli-check-all');
  if(all){ const total = document.querySelectorAll('.cli-del-check').length; all.checked = (total>0 && nCli===total); }
  const allF = document.getElementById('fin-check-all');
  if(allF){ const totalF = document.querySelectorAll('.fin-del-check').length; allF.checked = (totalF>0 && nFin===totalF); }
}
window.v52023MarcarTodos = marcarTodos;
window.v52023AtualizarBotaoExcluir = atualizarBotaoExcluir;
// clique na caixinha não pode disparar o duplo clique/abrir nada da linha
document.addEventListener('click', e=>{ if(e.target && (e.target.classList?.contains('cli-del-check') || e.target.classList?.contains('fin-del-check'))) e.stopPropagation(); }, true);

function injetarExclusaoClientes(){
  const view = document.getElementById('view-clientes'); if(!view) return;
  const headTr = view.querySelector('thead tr'); if(!headTr) return;
  if(!headTr.querySelector('#cli-check-all')){
    const th = document.createElement('th');
    th.className = 'w-8';
    th.innerHTML = '<input type="checkbox" id="cli-check-all" title="Marcar todos" onchange="v52023MarcarTodos(\'cli\',this.checked)">';
    headTr.prepend(th);
  }
  view.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.querySelector('.cli-del-check')) return;
    const id = extrairId(tr, 'openModal'); if(!id) return;
    const td = document.createElement('td');
    td.innerHTML = '<input type="checkbox" class="cli-del-check" value="'+id+'" onchange="v52023AtualizarBotaoExcluir()">';
    tr.prepend(td);
  });
  const barra = view.querySelector('.p-4.border-b');
  if(barra && !document.getElementById('btn-excluir-clientes')){
    const btn = document.createElement('button');
    btn.id = 'btn-excluir-clientes';
    btn.className = 'neo-btn danger';
    btn.style.display = 'none';
    btn.onclick = ()=>window.excluirClientesSelecionados();
    const contador = barra.querySelector('.ml-auto');
    barra.insertBefore(btn, contador||null);
  }
}

function injetarExclusaoFinanceiro(){
  const view = document.getElementById('view-financeiro'); if(!view) return;
  // Item 2: tirar o "Pagar" que ficava junto do cabeçalho/filtro da tela.
  view.querySelectorAll('button').forEach(b=>{ if(/contaPagar/.test(b.getAttribute('onclick')||'')) b.remove(); });
  const headTr = view.querySelector('thead tr'); if(!headTr) return;
  if(!headTr.querySelector('#fin-check-all')){
    const th = document.createElement('th');
    th.className = 'w-8';
    th.innerHTML = '<input type="checkbox" id="fin-check-all" title="Marcar todos" onchange="v52023MarcarTodos(\'fin\',this.checked)">';
    headTr.prepend(th);
  }
  view.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.querySelector('.fin-del-check')) return;
    const od = tr.getAttribute('ondblclick')||'';
    const m = od.match(/historicoLancamento\('(cr|cp)','([^']+)'\)/);
    if(!m) return;
    const td = document.createElement('td');
    td.innerHTML = '<input type="checkbox" class="fin-del-check" data-tipo="'+m[1]+'" value="'+m[2]+'" onchange="v52023AtualizarBotaoExcluir()">';
    tr.prepend(td);
  });
  const barra = view.querySelector('.px-4.pb-3.border-b') || view.querySelector('.px-4.pb-3');
  if(barra && !document.getElementById('btn-excluir-fin')){
    const btn = document.createElement('button');
    btn.id = 'btn-excluir-fin';
    btn.className = 'neo-btn danger';
    btn.style.display = 'none';
    btn.onclick = ()=>window.excluirFinanceiroSelecionados();
    barra.appendChild(btn);
  }
}

// Envolve as telas (idempotente): depois do render original, injeta a exclusão.
if(typeof window.renderClientes === 'function' && !window.renderClientes.__v52023){
  const oldC = window.renderClientes;
  const wrapC = function(){ const r = oldC.apply(this, arguments); try{ injetarExclusaoClientes(); atualizarBotaoExcluir(); }catch(e){} return r; };
  wrapC.__v52023 = true; window.renderClientes = wrapC;
}
if(typeof window.renderFinanceiro === 'function' && !window.renderFinanceiro.__v52023){
  const oldF = window.renderFinanceiro;
  const wrapF = function(){ const r = oldF.apply(this, arguments); try{ injetarExclusaoFinanceiro(); atualizarBotaoExcluir(); }catch(e){} return r; };
  wrapF.__v52023 = true; window.renderFinanceiro = wrapF;
}

/* ---------------- FLUXO 1: excluir clientes (com 2 avisos p/ histórico) ---------------- */
window.excluirClientesSelecionados = function(){
  const sess = (typeof getSession==='function') ? getSession() : null; if(!sess) return;
  const ids = Array.from(document.querySelectorAll('.cli-del-check:checked')).map(c=>c.value).filter(Boolean);
  if(!ids.length){ aviso('Marque pelo menos um cliente na caixinha da esquerda.','Excluir clientes'); return; }
  const nomes = ids.map(id=>{ const c=(db.clientes||[]).find(x=>x.id===id); return c ? (c.nome||id) : id; });
  const listaNomes = nomes.slice(0,5).join(', ') + (nomes.length>5 ? ' e mais '+(nomes.length-5) : '');
  const resumo = resumoHistorico(db, ids);

  const executar = ()=>{
    const r = excluirClientesCascata(db, ids);
    ids.forEach((id,i)=>{ if(typeof logAction==='function') logAction('cliente','excluir',id,'Excluído cliente '+(nomes[i]||id)+' (histórico apagado junto) por '+sess.usuarioNome); });
    if(typeof saveDB==='function') saveDB();
    if(typeof renderClientes==='function') renderClientes();
    if(typeof renderAuditoria==='function') renderAuditoria();
    aviso(
      r.clientes+' cliente(s) excluído(s) de verdade.\n\nApagados junto: '+r.vendas+' venda(s), '+r.contratos+' contrato(s), '+r.os+' chamado(s), '+r.leituras+' leitura(s), '+r.parque+' impressora(s) de contrato e '+r.contasReceber+' lançamento(s) financeiro(s).',
      'Exclusão concluída'
    );
  };

  if(resumo.total === 0){
    // Sem histórico: um aviso só.
    confirma('Excluir '+ids.length+' cliente(s)?\n\n'+listaNomes+'\n\nIsso apaga de verdade e não tem volta.','Excluir clientes')
      .then(ok=>{ if(ok) executar(); });
  } else {
    // COM histórico: DOIS avisos, e apaga o histórico junto.
    confirma(
      'ATENÇÃO: '+resumo.comHistorico+' de '+ids.length+' cliente(s) têm HISTÓRICO no sistema:\n\n'+resumo.texto+'\n\n(' + listaNomes + ')\n\nAo continuar, o cliente E TODO O HISTÓRICO dele serão apagados juntos (vendas, contratos, chamados, leituras e financeiro).',
      'Excluir cliente com histórico (aviso 1 de 2)'
    ).then(ok1=>{
      if(!ok1) return;
      confirma(
        'ÚLTIMO AVISO: apagar '+ids.length+' cliente(s) e TODO o histórico ligado a eles?\n\nEssa ação NÃO pode ser desfeita.',
        'Excluir cliente com histórico (aviso 2 de 2)'
      ).then(ok2=>{ if(ok2) executar(); });
    });
  }
};

/* ---------------- FLUXO 2: excluir lançamentos do financeiro ---------------- */
window.excluirFinanceiroSelecionados = function(){
  const sess = (typeof getSession==='function') ? getSession() : null; if(!sess) return;
  const alvos = Array.from(document.querySelectorAll('.fin-del-check:checked')).map(c=>({ tipo:c.dataset.tipo||'cr', id:c.value })).filter(a=>a.id);
  if(!alvos.length){ aviso('Marque pelo menos um lançamento na caixinha da esquerda.','Excluir lançamentos'); return; }
  confirma('Excluir '+alvos.length+' lançamento(s) do Financeiro?\n\nIsso apaga de verdade e não tem volta.','Excluir lançamentos')
    .then(ok=>{
      if(!ok) return;
      const r = excluirLancamentosFinanceiro(db, alvos);
      if(typeof logAction==='function') logAction('financeiro','excluir_lote',alvos.map(a=>a.id).join(','),'Excluídos '+r.receber+' a receber e '+r.pagar+' a pagar por '+sess.usuarioNome);
      if(typeof saveDB==='function') saveDB();
      if(typeof renderFinanceiro==='function') renderFinanceiro();
      if(typeof renderAuditoria==='function') renderAuditoria();
      if(typeof toast==='function') toast(alvos.length+' lançamento(s) excluído(s)','success');
    });
};

console.log('[DIGICOPY] ajustes_v52023_patch.js carregado — excluir em lote (clientes/financeiro) + sem botão Pagar no financeiro');
})();
