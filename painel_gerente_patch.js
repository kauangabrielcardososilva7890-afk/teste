// ═══════════════════════════════════════════════════════════════════════════
// PAINEL_GERENTE_PATCH v5.26.6 — "faz logo" (ordem dele)
// Tela única do dono: tudo o que aconteceu HOJE (e o que está pendurado)
// em TODAS as frentes — lê o banco já sincronizado pela nuvem, mesmos dados
// de qualquer computador autorizado. Não escreve nada; só lê e mostra.
// - Cards: notinhas de hoje (qtd + R$), OS em aberto, a receber no mês,
//   contas ATRASADAS (vermelho), máquinas nos clientes, contratos ativos
// - "Quem vendeu hoje" (por pessoa, do maior pro menor)
// - Alerta: OS parada há mais de 7 dias
// - Linha do tempo: últimas movimentações (venda + OS juntas)
// - Botão "↻ Atualizar" = relê o banco agora (sync acontece no ritual do app)
// Multi-empresa: mostra SÓ os dados da empresa logada (empresaId da sessão).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v5266pg) return;

/* PG_PURE_START */
// ── Helpers puros (sem DOM) — também usados pelo teste automatizado ─────────
function pgHojeStr(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function pgMesStr(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function pgDataDe(x){ const dt=new Date(x && (x.criadoEm||x.data||x.cadastroEm||x.criado||'')); return isNaN(dt.getTime())?null:dt; }
function pgFiltro(db, col, sess){
  const list=(db && db[col]) || [];
  const emp=sess && sess.empresaId;
  if(!emp) return list.slice();
  return list.filter(x=>x && x.empresaId===emp);
}
function pgValorVenda(v){ const n=Number(v && (v.total!=null?v.total:v.valor)); return isFinite(n)?n:0; }
function pgOsViva(o){ const s=String(o && o.status || ''); return s!=='concluido' && s!=='cancelado' && s!=='excluido' && s!=='estornado'; }
function pgVendaViva(v){ const s=String(v && v.status || ''); return s!=='cancelada' && s!=='excluida' && s!=='estornada'; }
function pgContaAberta(c){ return String(c && c.status || '')!=='pago'; }
function pgResumo(db, sess, agora){
  agora=agora||new Date();
  const hoje=pgHojeStr(agora), mes=pgMesStr(agora);
  const vendas=pgFiltro(db,'vendas',sess);
  const oss=pgFiltro(db,'os',sess);
  const cr=pgFiltro(db,'contasReceber',sess);
  const parque=pgFiltro(db,'parque',sess);
  const contratos=pgFiltro(db,'contratos',sess);
  const clientes=pgFiltro(db,'clientes',sess);

  const vHoje=vendas.filter(v=>{ const dt=pgDataDe(v); return dt && pgHojeStr(dt)===hoje && pgVendaViva(v); });
  const totalHoje=vHoje.reduce((s,v)=>s+pgValorVenda(v),0);
  const osHoje=oss.filter(o=>{ const dt=pgDataDe(o); return dt && pgHojeStr(dt)===hoje; });
  const osAbertas=oss.filter(pgOsViva);
  const osParadas=osAbertas.filter(o=>{ const dt=pgDataDe(o); return dt && (agora.getTime()-dt.getTime())>7*24*60*60*1000; });

  const receberMes=cr.filter(c=>pgContaAberta(c) && String(c.vencimento||'').slice(0,7)===mes)
                     .reduce((s,c)=>s+(Number(c.valor)||0),0);
  const atrasadas=cr.filter(c=>{ if(!pgContaAberta(c)) return false; const dt=new Date(c.vencimento||''); return !isNaN(dt.getTime()) && dt.getTime()<agora.getTime(); });
  const atrasadoValor=atrasadas.reduce((s,c)=>s+(Number(c.valor)||0),0);

  // Quem vendeu hoje (do maior pro menor)
  const porPessoa={};
  vHoje.forEach(v=>{ const n=String(v.criadoPorNome||v.criadoPor||'—'); if(!porPessoa[n]) porPessoa[n]={nome:n,qtd:0,total:0}; porPessoa[n].qtd++; porPessoa[n].total+=pgValorVenda(v); });
  const pessoas=Object.values(porPessoa).sort((a,b)=>b.total-a.total);

  // Linha do tempo: últimas movimentações (venda e OS juntas)
  const cliNome={}; clientes.forEach(c=>cliNome[c.id]=c.nome||c.fantasia||'—');
  const timeline=[]
    .concat(vendas.filter(pgVendaViva).map(v=>({tipo:'VENDA',numero:v.numero,quem:v.criadoPorNome||v.criadoPor,cliente:cliNome[v.clienteId]||'',valor:pgValorVenda(v),status:v.status||'',dt:pgDataDe(v)})))
    .concat(oss.map(o=>({tipo:'OS',numero:o.numero,quem:o.criadoPorNome||o.criadoPor,cliente:cliNome[o.clienteId]||'',valor:Number(o.valor)||0,status:o.status||'',dt:pgDataDe(o)})))
    .filter(x=>x.dt)
    .sort((a,b)=>b.dt.getTime()-a.dt.getTime())
    .slice(0,10);

  return {
    qtdVendasHoje:vHoje.length, totalVendasHoje:totalHoje, qtdOsHoje:osHoje.length,
    osAbertas:osAbertas.length, osParadas:osParadas.slice(0,5).map(o=>({numero:o.numero,cliente:cliNome[o.clienteId]||'',dias:Math.floor((agora.getTime()-pgDataDe(o).getTime())/86400000)})),
    receberMes:receberMes, atrasadasQtd:atrasadas.length, atrasadoValor:atrasadoValor,
    maquinas:parque.length, contratosAtivos:contratos.filter(c=>String(c.status||'ativo')!=='encerrado' && String(c.status||'ativo')!=='cancelado').length,
    pessoas:pessoas, timeline:timeline
  };
}
function pgBRL(n){ try{ return Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n||0); }catch(e){ return 'R$ '+(Number(n)||0).toFixed(2).replace('.',','); } }
/* PG_PURE_END */

if(typeof window==='undefined' || typeof document==='undefined'){ if(typeof module!=='undefined') module.exports={pgResumo:pgResumo,pgBRL:pgBRL,pgFiltro:pgFiltro,pgOsViva:pgOsViva}; return; }
window.__v5266pg=true;

function esc(s){ return typeof escapeHtml==='function'?escapeHtml(String(s==null?'':s)):String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function pgCard(titulo, valor, sub, cor){
  return '<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">'+
    '<p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">'+esc(titulo)+'</p>'+
    '<p class="text-[22px] font-extrabold '+(cor||'text-slate-800')+' mt-1">'+esc(valor)+'</p>'+
    (sub?'<p class="text-[11.5px] text-slate-500 mt-0.5">'+esc(sub)+'</p>':'')+'</div>';
}
window.renderPainelGerente=function(){
  const v=typeof ensureView==='function'?ensureView('painel-gerente'):document.getElementById('view-painel-gerente');
  if(!v) return;
  const sess=typeof getSession==='function'?getSession():null;
  if(!sess){ v.innerHTML='<div class="p-8 text-center text-slate-500 text-[13px]">Entre com login para ver o painel.</div>'; return; }
  const r=pgResumo(db, sess, new Date());
  const agora=new Date();
  const hh=String(agora.getHours()).padStart(2,'0')+':'+String(agora.getMinutes()).padStart(2,'0');

  let html='<div class="flex items-center justify-between flex-wrap gap-2">'+
    '<div><h2 class="text-[18px] font-extrabold text-slate-800">Painel do Gerente</h2>'+
    '<p class="text-[12px] text-slate-500">Dados da nuvem desta empresa — os mesmos em todos os computadores.</p></div>'+
    '<button onclick="renderPainelGerente()" class="h-9 px-4 rounded-xl bg-[#0a1e8a] text-white text-[12.5px] font-bold hover:opacity-90">↻ Atualizar</button></div>';

  html+='<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">'+
    pgCard('Notinhas hoje', r.qtdVendasHoje+' · '+pgBRL(r.totalVendasHoje), 'vendas concluídas hoje')+
    pgCard('OS hoje / abertas', r.qtdOsHoje+' / '+r.osAbertas, 'ordens de serviço')+
    pgCard('A receber no mês', pgBRL(r.receberMes), 'títulos em aberto')+
    pgCard('ATRASADAS', r.atrasadasQtd+' · '+pgBRL(r.atrasadoValor), 'passou do vencimento', r.atrasadasQtd?'text-red-600':'text-emerald-600')+
    pgCard('Máquinas clientes', String(r.maquinas), 'parque total')+
    pgCard('Contratos ativos', String(r.contratosAtivos), 'locação/outsourcing')+
  '</div>';

  html+='<div class="grid md:grid-cols-2 gap-3">';
  // Quem vendeu hoje
  html+='<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-bold uppercase tracking-wide text-slate-400 mb-2">Quem vendeu hoje</p>'+
    (r.pessoas.length?r.pessoas.map(p=>'<div class="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"><span class="text-[13px] font-semibold text-slate-700">'+esc(p.nome)+' <em class="not-italic text-[11px] text-slate-400">('+p.qtd+')</em></span><b class="text-[13px] text-slate-800">'+pgBRL(p.total)+'</b></div>').join(''):'<p class="text-[12.5px] text-slate-400 py-2">Nenhuma venda hoje ainda.</p>')+'</div>';
  // Alertas de OS parada
  html+='<div class="rounded-2xl border '+(r.osParadas.length?'border-amber-300 bg-amber-50':'border-slate-200 bg-white')+' p-4 shadow-sm"><p class="text-[12px] font-bold uppercase tracking-wide '+(r.osParadas.length?'text-amber-700':'text-slate-400')+' mb-2">OS parada há mais de 7 dias</p>'+
    (r.osParadas.length?r.osParadas.map(o=>'<div class="flex items-center justify-between py-1.5 border-b border-amber-200/60 last:border-0"><span class="text-[13px] font-semibold text-slate-700">OS '+esc(o.numero)+' <em class="not-italic text-[11px] text-slate-500">'+esc(o.cliente)+'</em></span><b class="text-[12px] text-amber-700">'+o.dias+' dias</b></div>').join(''):'<p class="text-[12.5px] text-slate-400 py-2">Nada travado. 🎉</p>')+'</div>';
  html+='</div>';

  // Linha do tempo
  html+='<div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"><p class="text-[12px] font-bold uppercase tracking-wide text-slate-400 px-4 pt-4 pb-2">Últimas movimentações (vendas + OS)</p>'+
    '<div class="divide-y divide-slate-100">'+(r.timeline.length?r.timeline.map(t=>'<div class="px-4 py-2.5 flex items-center gap-3 flex-wrap">'+
      '<span class="text-[10px] font-extrabold px-2 py-1 rounded-lg '+(t.tipo==='VENDA'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800')+'">'+t.tipo+'</span>'+
      '<b class="text-[13px] text-slate-700 font-mono">'+esc(t.numero||'—')+'</b>'+
      '<span class="text-[12.5px] text-slate-600 truncate flex-1">'+esc(t.cliente)+'</span>'+
      '<span class="text-[11.5px] text-slate-400">'+esc(t.quem||'—')+'</span>'+
      '<b class="text-[13px] text-slate-800">'+(t.valor?pgBRL(t.valor):'')+'</b>'+
      '<span class="text-[10.5px] text-slate-400">'+esc(t.dt.toLocaleDateString('pt-BR'))+'</span>'+
    '</div>').join(''):'<p class="text-[12.5px] text-slate-400 px-4 pb-4">Sem movimentações ainda.</p>')+'</div>'+
    '<p class="text-[11px] text-slate-400 px-4 py-3 border-t border-slate-100">Atualizado às '+hh+' · Empresa: '+esc(sess.empresaNome||sess.empresaId||'')+'</p></div>';

  v.innerHTML=html;
};

// ── Instalação no menu (espelho do Buscador Escola: nav-gest + topbar) ──────
function pgInstalarMenu(){
  const nav=document.getElementById('nav-gest');
  if(nav&&!nav.querySelector('[data-nav="painel-gerente"]')){
    const btn=document.createElement('button');
    if(btn.dataset) btn.dataset.nav='painel-gerente';
    else btn.setAttribute('data-nav','painel-gerente');
    btn.onclick=()=>window.navigateTo('painel-gerente');
    btn.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white';
    btn.innerHTML='<i class="ph ph-gauge text-[19px]"></i><span>Painel Gerente</span>';
    nav.insertBefore(btn, nav.firstChild);
  }
  const toolbar=document.querySelector('.classic-toolbar-scroll');
  if(toolbar&&!document.getElementById('topmod-painel-gerente')){
    const mod=document.createElement('div'); mod.className='module'; mod.id='topmod-painel-gerente';
    mod.innerHTML='<button onclick="navigateTo(\'painel-gerente\')"><i class="ph ph-gauge"></i>Painel Gerente</button>';
    const dash=[...toolbar.querySelectorAll('.module')].find(m=>/Início|Dashboard/.test(m.innerText||''));
    if(dash) toolbar.insertBefore(mod, dash.nextSibling); else toolbar.appendChild(mod);
  }
}
// navigateTo: o core não conhece a view nova — envolvo e ensino (precedente: wraps v5.26.x)
if(typeof window.navigateTo==='function'){
  const _navPG=window.navigateTo;
  window.navigateTo=function(view){
    const r=_navPG.apply(this, arguments);
    if(view==='painel-gerente'){
      try{ if(typeof setPageHeader==='function') setPageHeader('Painel do Gerente','Tudo de hoje, de todos os computadores, numa tela só'); }catch(e){}
      try{ window.renderPainelGerente(); }catch(e){}
    }
    return r;
  };
}
// Garante o botão mesmo com menu redesenhado após o login (mesmo padrão do escola)
setInterval(()=>{ if(typeof document!=='undefined'&&document.hidden) return; try{ pgInstalarMenu(); }catch(e){} },2000);
try{ pgInstalarMenu(); }catch(e){}
console.log('PAINEL_GERENTE v5.26.6 — ativo');
})();
