// DIGICOPY ERP — Central de notificações (sino) — v4.7.0
// Alertas automáticos (estoque no mínimo, contas vencidas/a vencer) + eventos
// (ex.: "Fulano pagou — baixa registrada"). O Pix automático vai avisar aqui também.
(function(){
'use strict';

/* NOTIF_PURE_START */
// Núcleo puro e testável: o que conta como alerta.
const NOTIF_PURE = (function(){
  // Produtos no nível crítico: em estoque menor ou igual ao mínimo (mesma regra da tela de produtos)
  function scanEstoqueBaixo(produtos, empresaId){
    return (produtos||[])
      .filter(p=>p && p.empresaId===empresaId && p.status!=='inativo' && Number(p.estoque||0) <= Number(p.estoqueMin||0))
      .map(p=>({ ref:p.id, sku:p.sku||'', nome:p.nome||'', estoque:Number(p.estoque||0), min:Number(p.estoqueMin||0) }))
      .sort((a,b)=> (a.estoque-a.min) - (b.estoque-b.min));
  }
  // Contas a receber: vencidas (vermelho) e vencendo nos próximos `diasAviso` dias (amarelo)
  function scanContasReceber(contas, empresaId, hojeISO, diasAviso){
    const aviso = Number(diasAviso)||7;
    const hoje = String(hojeISO).slice(0,10);
    const limite = new Date(hoje+'T12:00:00');
    limite.setDate(limite.getDate()+aviso);
    const limiteISO = limite.toISOString().slice(0,10);
    const vencidas = [], aVencer = [];
    (contas||[]).forEach(c=>{
      if(!c || c.empresaId!==empresaId || c.status==='pago' || c.status==='cancelado') return;
      const v = String(c.vencimento||'').slice(0,10);
      if(!v) return;
      if(v < hoje) vencidas.push(c);
      else if(v <= limiteISO) aVencer.push(c);
    });
    const porData = (a,b)=>String(a.vencimento).localeCompare(String(b.vencimento));
    vencidas.sort(porData); aVencer.sort(porData);
    return { vencidas, aVencer };
  }
  function hojeISO(d){ const x = d ? new Date(d) : new Date(); return x.toISOString().slice(0,10); }
  return { scanEstoqueBaixo, scanContasReceber, hojeISO };
})();
/* NOTIF_PURE_END */
window.NOTIF_PURE = NOTIF_PURE;

// ═══════════════════════════════════════════════════════════════════════════
// Eventos persistidos (sincronizam pela nuvem junto com o resto do banco)
// ═══════════════════════════════════════════════════════════════════════════
function ntfLista(){
  try{
    if(typeof db==='undefined' || !db) return [];
    db.notificacoes = Array.isArray(db.notificacoes) ? db.notificacoes : [];
    return db.notificacoes;
  }catch(e){ return []; }
}
// API pública: qualquer parte do sistema registra um aviso aqui.
// O Pix automático (quando conectado ao banco) vai usar exatamente esta função.
window.notificarEvento = function(tipo, texto, acao){
  const sess = (typeof getSession==='function') ? getSession() : null;
  if(!sess) return;
  const lista = ntfLista();
  lista.unshift({
    id: (typeof uid==='function' ? uid('ntf') : 'ntf_'+Date.now()),
    empresaId: sess.empresaId, tipo: tipo||'info', texto: String(texto||''),
    acao: acao||null, lida: false, criadoEm: new Date().toISOString(),
    criadoPorNome: sess.usuarioNome
  });
  if(lista.length > 200) lista.length = 200; // guarda só os 200 mais recentes
  if(typeof saveDB==='function') saveDB();
  ntfAtualizarBadge();
};

// ═══════════════════════════════════════════════════════════════════════════
// Varredura dos alertas automáticos
// ═══════════════════════════════════════════════════════════════════════════
function ntfEscanear(){
  const sess = (typeof getSession==='function') ? getSession() : null;
  if(!sess || typeof db==='undefined' || !db) return { estoque:[], vencidas:[], aVencer:[], eventos:[] };
  const hoje = NOTIF_PURE.hojeISO();
  const cr = NOTIF_PURE.scanContasReceber(db.contasReceber, sess.empresaId, hoje, 7);
  return {
    estoque: NOTIF_PURE.scanEstoqueBaixo(db.produtos, sess.empresaId),
    vencidas: cr.vencidas,
    aVencer: cr.aVencer,
    eventos: ntfLista().filter(n=>n.empresaId===sess.empresaId)
  };
}
function ntfTotalPendente(){
  const s = ntfEscanear();
  return s.estoque.length + s.vencidas.length + s.aVencer.length + s.eventos.filter(n=>!n.lida).length;
}
window.ntfAtualizarBadge = function(){
  const badge = document.getElementById('ntf-badge');
  if(!badge) return;
  let n = 0;
  try{ n = ntfTotalPendente(); }catch(e){}
  badge.textContent = n > 99 ? '99+' : String(n);
  badge.classList.toggle('hidden', n===0);
};

// ═══════════════════════════════════════════════════════════════════════════
// Painel do sino
// ═══════════════════════════════════════════════════════════════════════════
function ntfIcone(tipo){
  return { pix:'ph-qr-code text-emerald-600', dinheiro:'ph-currency-circle-dollar text-emerald-600',
    info:'ph-info text-blue-600', aviso:'ph-warning text-amber-600' }[tipo] || 'ph-bell text-slate-500';
}
window.ntfAlternarPainel = function(){
  let p = document.getElementById('ntf-painel');
  if(p){ p.remove(); return; }
  const s = ntfEscanear();
  const eventos = s.eventos.slice(0, 12);
  p = document.createElement('div');
  p.id = 'ntf-painel';
  p.className = 'fixed right-3 top-[58px] z-[70] w-[380px] max-w-[94vw] max-h-[76vh] overflow-hidden rounded-[18px] bg-white shadow-2xl border flex flex-col animate-slideIn';
  const linhaEstoque = s.estoque.slice(0,6).map(x=>`
    <button onclick="ntfFecharPainel(); navigateTo('produtos')" class="w-full text-left px-4 py-2.5 hover:bg-red-50/60 border-b flex items-start gap-2.5">
      <i class="ph ph-package text-red-500 mt-[2px]"></i>
      <span class="flex-1 text-[12.5px]"><b>${escapeHtml(x.nome)}</b><br><span class="text-slate-500 text-[11.5px]">Estoque <b class="text-red-600">${x.estoque}</b> • mínimo ${x.min}${x.sku?(' • '+escapeHtml(x.sku)):''}</span></span>
    </button>`).join('') + (s.estoque.length>6?`<button onclick="ntfFecharPainel(); navigateTo('produtos')" class="w-full text-center text-[12px] font-bold text-red-600 py-2 hover:bg-red-50">+ ${s.estoque.length-6} produtos no mínimo — ver todos</button>`:'');
  const linhaFin = (arr, cor, rotulo)=>arr.slice(0,5).map(c=>{
      const cli = (db.clientes||[]).find(z=>z.id===c.clienteId)||{};
      return `<button onclick="ntfFecharPainel(); navigateTo('financeiro')" class="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b flex items-start gap-2.5">
        <i class="ph ${cor==='red'?'ph-warning-octagon text-red-500':'ph-clock text-amber-500'} mt-[2px]"></i>
        <span class="flex-1 text-[12.5px]"><b>${fmtMoney(c.valor||0)}</b> — ${escapeHtml(cli.nome||c.clienteNomeAntigo||c.descricao||'título')}<br><span class="text-slate-500 text-[11.5px]">${rotulo} ${fmtDate(c.vencimento)}</span></span>
      </button>`;
    }).join('');
  const linhasEventos = eventos.map(n=>`
    <div class="px-4 py-2.5 border-b flex items-start gap-2.5 ${n.lida?'opacity-60':''}">
      <i class="ph ${ntfIcone(n.tipo)} mt-[2px]"></i>
      <div class="flex-1 min-w-0">
        <p class="text-[12.5px] ${n.lida?'':'font-semibold'}">${escapeHtml(n.texto)}</p>
        <p class="text-[10.5px] text-slate-400 mt-0.5">${fmtDateTime(n.criadoEm)}${n.criadoPorNome?(' • '+escapeHtml(n.criadoPorNome)):''}</p>
      </div>
      <div class="flex flex-col gap-1 shrink-0">
        ${n.lida?'':`<button onclick="ntfMarcarLida('${n.id}')" title="Marcar como lida" class="w-7 h-7 grid place-items-center rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600"><i class="ph ph-check"></i></button>`}
        <button onclick="ntfApagar('${n.id}')" title="Apagar aviso" class="w-7 h-7 grid place-items-center rounded-lg bg-slate-100 hover:bg-red-100 text-slate-500"><i class="ph ph-trash"></i></button>
      </div>
    </div>`).join('');
  p.innerHTML = `
    <div class="px-4 py-3 bg-[#060e2f] text-white flex items-center gap-2">
      <i class="ph ph-bell-ringing text-[18px]"></i>
      <p class="font-bold text-[14px] flex-1">Notificações</p>
      <button onclick="ntfMarcarTodasLidas()" class="text-[11px] font-bold bg-white/10 hover:bg-white/20 rounded-lg px-2 py-1">Ler todas</button>
      <button onclick="ntfFecharPainel()" class="w-7 h-7 grid place-items-center rounded-lg bg-white/10 hover:bg-white/20"><i class="ph ph-x"></i></button>
    </div>
    <div class="overflow-y-auto flex-1">
      ${linhasEventos ? `<p class="px-4 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Avisos</p>${linhasEventos}` : ''}
      <p class="px-4 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Estoque no mínimo (${s.estoque.length})</p>
      ${linhaEstoque || '<p class="px-4 py-2 text-[12px] text-slate-400">Nenhum produto no nível mínimo 👍</p>'}
      <p class="px-4 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Contas a receber (${s.vencidas.length} vencidas • ${s.aVencer.length} a vencer)</p>
      ${linhaFin(s.vencidas,'red','Venceu em') || ''}
      ${linhaFin(s.aVencer,'amber','Vence em') || ''}
      ${(!s.vencidas.length && !s.aVencer.length) ? '<p class="px-4 py-2 text-[12px] text-slate-400">Nada vencendo nos próximos 7 dias 👍</p>' : ''}
    </div>`;
  document.body.appendChild(p);
  setTimeout(()=>document.addEventListener('click', ntfForaDoPainel), 50);
};
function ntfForaDoPainel(ev){
  const p = document.getElementById('ntf-painel');
  const btn = document.getElementById('ntf-btn');
  if(p && !p.contains(ev.target) && !(btn && btn.contains(ev.target))) window.ntfFecharPainel();
}
window.ntfFecharPainel = function(){
  const p = document.getElementById('ntf-painel');
  if(p) p.remove();
  document.removeEventListener('click', ntfForaDoPainel);
};
window.ntfMarcarLida = function(id){
  const n = ntfLista().find(x=>x.id===id);
  if(n){ n.lida = true; saveDB(); window.ntfFecharPainel(); window.ntfAlternarPainel(); ntfAtualizarBadge(); }
};
window.ntfApagar = function(id){
  const lista = ntfLista();
  const i = lista.findIndex(x=>x.id===id);
  if(i>=0){ lista.splice(i,1); saveDB(); window.ntfFecharPainel(); window.ntfAlternarPainel(); ntfAtualizarBadge(); }
};
window.ntfMarcarTodasLidas = function(){
  ntfLista().forEach(n=>n.lida=true);
  if(typeof saveDB==='function') saveDB();
  window.ntfFecharPainel(); window.ntfAlternarPainel(); ntfAtualizarBadge();
};

// ═══════════════════════════════════════════════════════════════════════════
// Gancho: baixa manual de conta a receber vira aviso no sino
// (quando o Pix automático chegar, o banco vai gerar esse mesmo aviso sozinho)
// ═══════════════════════════════════════════════════════════════════════════
const _ntfOrigBaixarCR = window.baixarCR;
if(typeof _ntfOrigBaixarCR === 'function'){
  window.baixarCR = function(id){
    const cr = (db.contasReceber||[]).find(c=>c.id===id);
    const cli = cr ? (db.clientes||[]).find(c=>c.id===cr.clienteId) : null;
    const nome = cli ? cli.nome : (cr && (cr.clienteNomeAntigo||'Cliente')) || 'Cliente';
    const valor = cr ? cr.valor : 0;
    _ntfOrigBaixarCR(id);
    notificarEvento('dinheiro', `${nome} pagou ${fmtMoney(valor)} — baixa registrada (${(cr&&cr.descricao)||'título'})`, {tipo:'financeiro'});
  };
}

// Atualiza o contador do sino: no login, a cada 90s e ao mexer em produtos/financeiro
setInterval(function(){ try{ if(getSession && getSession()) ntfAtualizarBadge(); }catch(e){} }, 90000);
const _ntfOrigDashboard = window.renderDashboard;
window.renderDashboard = function(){
  if(_ntfOrigDashboard) _ntfOrigDashboard.apply(this, arguments);
  try{ ntfAtualizarBadge(); }catch(e){}
};
document.addEventListener('DOMContentLoaded', function(){ setTimeout(ntfAtualizarBadge, 3000); });

console.log('[DIGICOPY] Notificações v4.7.0 carregadas — sino com estoque mínimo, contas e avisos');
})();
