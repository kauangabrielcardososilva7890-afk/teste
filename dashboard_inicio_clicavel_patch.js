// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD_INICIO_CLICAVEL_PATCH v6.0.7 — foto dele (18/09): a tela Início
// mostrava "undefined" espalhado ("Silva e Freitas • undefined", "undefined •
// undefined PB", leitura com título "undefined") E o pedido na lata:
//   "essa foto é de inicio... faz essas informações ser clicadas que vai
//    mostrar a origem delas"
//  1) ANTI-UNDEFINED de verdade (causa, não maquiagem): a lista original cria
//     "${cli?.nome}" cru — quando o cliente/equipamento foi apagado ou o
//     registro veio sem vínculo, nasce "undefined" na tela. Agora cada campo
//     tem alternativa honesta: "(cliente removido)", "(equipamento removido)",
//     "consumo não informado", e o " • " só entra entre partes que existem
//     (nunca fica "por Katia • " pendurado). Descrição/tipo vazios não
//     aparecem; ausência não quebra a linha.
//  2) CADA ITEM CLICÁVEL ABRE A ORIGEM (pedido dele): chamado → vai pra
//     Manutenção e já abre a OS no modal; leitura → vai pra Leituras e abre
//     a leitura. Cursor de mão + dica no hover ("Abrir a origem").
//  3) BLINDAGEM: se qualquer parte antiga do renderDashboard explodir (log
//     sem detalhes etc.), as listas novas ainda são redesenhadas — nada de
//     painel quebrado pela metade.
// Sem timers pesados: um abraço no renderDashboard (chamado em toda navegação
// pro Início) + sonda leve só enquanto o Início estiver visível.
// Guard: __v6007dhc. PURE exportado p/ testes (sem DOM).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6007dhc) return;

/* DHC607_PURE_START */
// Junta partes com " • " pulando vazios — fim dos "undefined • undefined PB".
function dhcJunta(partes){
  return (partes||[]).filter(function(p){ return p!==undefined && p!==null && String(p).trim()!==''; }).map(function(p){return String(p);}).join(' • ');
}
function dhcEsc(s){
  return String(s===undefined||s===null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function dhcNomeCliente(clientes,id){
  if(id===undefined||id===null||id==='') return '';
  // Comparação FROUXA de propósito: registros antigos/sincronizados misturam
  // id número com id texto ('5' !== 5) — era a raiz do "undefined" da foto.
  const sid=String(id);
  const c=(clientes||[]).find(function(x){ return x && String(x.id)===sid; });
  return (c && c.nome) ? String(c.nome) : '';
}
// Linha de CHAMADO/OS: número (4 últimos), "Cliente • tipo", "por quem • descrição".
function dhcLinhaOs(clientes,o){
  o=o||{};
  const numero=(o.numero!==undefined && o.numero!==null && String(o.numero).trim()!=='') ? String(o.numero).slice(-4) : '—';
  const cliNome=dhcNomeCliente(clientes,o.clienteId) || (o.clienteNome?String(o.clienteNome):'') || '(cliente removido)';
  const titulo=dhcJunta([cliNome, o.tipo]);
  const desc=(o.descricao!==undefined && o.descricao!==null) ? String(o.descricao).trim().slice(0,40) : '';
  const subtitulo=dhcJunta(['por '+((o.criadoPorNome&&String(o.criadoPorNome).trim())||'-'), desc]);
  return { id:o.id||'', numero:numero, titulo:titulo, subtitulo:subtitulo, prioridade:(o.prioridade&&String(o.prioridade).trim())||'normal' };
}
// Linha de LEITURA: cliente (cai pro cliente do equipamento, depois pro nome
// guardado), equipamento, consumo, quem lançou; valor do excedente p/ tarja.
function dhcLinhaLeitura(clientes,equipamentos,l){
  l=l||{};
  const seq=(l.equipamentoId!==undefined && l.equipamentoId!==null) ? String(l.equipamentoId) : '';
  const eq=seq ? (equipamentos||[]).find(function(e){ return e && String(e.id)===seq; }) : null;
  let cliNome=dhcNomeCliente(clientes,l.clienteId);
  if(!cliNome && eq) cliNome=dhcNomeCliente(clientes,eq.clienteId);
  if(!cliNome && l.clienteNome) cliNome=String(l.clienteNome);
  const titulo=cliNome || '(cliente removido)';
  const eqNome=(eq && eq.modelo) ? String(eq.modelo) : '(equipamento removido)';
  const consumo=(l.consumoPB!==undefined && l.consumoPB!==null && String(l.consumoPB).trim()!=='') ? (String(l.consumoPB)+' PB') : 'consumo não informado';
  const subtitulo=dhcJunta([eqNome, consumo, 'por '+((l.criadoPorNome&&String(l.criadoPorNome).trim())||'-')]);
  const valor=Number(l.valorExcedente)||0;
  return { id:l.id||'', titulo:titulo, subtitulo:subtitulo, valor:valor };
}
/* DHC607_PURE_END */
const apiPura607={ dhcJunta:dhcJunta, dhcEsc:dhcEsc, dhcNomeCliente:dhcNomeCliente, dhcLinhaOs:dhcLinhaOs, dhcLinhaLeitura:dhcLinhaLeitura };
if(typeof module!=='undefined') module.exports=apiPura607;
if(typeof window!=='undefined'){ window.DHC607_PURE=apiPura607; }

if(typeof window==='undefined' || typeof document==='undefined') return;
window.__v6007dhc=true;

// Clique por delegação (UM ouvinte no documento; sem onclick inline → id com
// caractere esquisito nunca quebra o HTML).
document.addEventListener('click',function(ev){
  const alvo=ev.target && ev.target.closest ? ev.target.closest('.dhc-item') : null;
  if(!alvo) return;
  window.dhcAbrirOrigem(alvo.getAttribute('data-dhc'), alvo.getAttribute('data-id'));
});

// ── Abrir a origem (pedido dele: clicar mostra de onde veio) ───────────────
window.dhcAbrirOrigem=function(tipo,id){
  if(!id) return;
  try{
    if(tipo==='os'){
      if(typeof navigateTo==='function') navigateTo('manutencao');
      setTimeout(function(){ try{ if(typeof openModal==='function') openModal('os',id); }catch(e){} },60);
    }else if(tipo==='leitura'){
      if(typeof navigateTo==='function') navigateTo('leituras');
      setTimeout(function(){ try{ if(typeof openModal==='function') openModal('leitura',id); }catch(e){} },60);
    }
  }catch(e){}
};

// ── Redesenho das duas listas do Início (anti-undefined + clicáveis) ───────
function dhcEstilos(){
  if(document.getElementById('dhc-css')) return;
  const st=document.createElement('style'); st.id='dhc-css';
  st.textContent='.dhc-item{cursor:pointer;transition:background .12s}.dhc-item:hover{background:#f1f5f9}.dhc-seta{opacity:0;transition:opacity .12s;color:#0a1e8a;font-size:15px}.dhc-item:hover .dhc-seta{opacity:1}';
  document.head.appendChild(st);
}
function dhcFixListas(){
  const inicio=document.getElementById('view-dashboard');
  if(inicio && inicio.offsetParent===null) return; // fora do Início não gasta nada
  if(typeof db==='undefined' || !db) return;
  const sess=(typeof getSession==='function') ? getSession() : null;
  if(!sess || !sess.empresaId) return;
  dhcEstilos();
  const lc=document.getElementById('list-chamados-recentes');
  if(lc){
    const recOs=(db.os||[]).filter(function(o){ return o.empresaId===sess.empresaId && o.status!=='concluido'; }).slice(0,4);
    lc.innerHTML=recOs.map(function(o){
      const r=dhcLinhaOs(db.clientes,o);
      return '<div class="dhc-item p-4 flex items-center gap-3" title="Abrir a origem (Manutenção)" data-dhc="os" data-id="'+dhcEsc(r.id)+'">'+
        '<div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-mono text-[10px] font-bold">'+dhcEsc(r.numero)+'</div>'+
        '<div class="flex-1 min-w-0"><p class="font-semibold text-[13px] truncate">'+dhcEsc(r.titulo)+'</p>'+
        '<p class="text-[11.5px] text-slate-500 truncate">'+dhcEsc(r.subtitulo)+'</p></div>'+
        '<span class="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800 uppercase">'+dhcEsc(r.prioridade)+'</span>'+
        '<i class="ph ph-arrow-right dhc-seta"></i></div>';
    }).join('') || '<div class="p-8 text-center text-[12px] text-slate-500">Sem chamados</div>';
  }
  const ll=document.getElementById('list-leituras-pendentes');
  if(ll){
    const pendLeit=(db.leituras||[]).filter(function(l){ return l.empresaId===sess.empresaId && l.status==='pendente'; }).slice(0,4);
    ll.innerHTML=pendLeit.map(function(l){
      const r=dhcLinhaLeitura(db.clientes,db.equipamentos,l);
      return '<div class="dhc-item p-4 flex items-center gap-3" title="Abrir a origem (Leituras)" data-dhc="leitura" data-id="'+dhcEsc(r.id)+'">'+
        '<div class="w-10 h-10 rounded-xl bg-[#e8eaf8] text-[#0a1e8a] grid place-items-center"><i class="ph ph-printer"></i></div>'+
        '<div class="flex-1 min-w-0"><p class="font-semibold text-[13px] truncate">'+dhcEsc(r.titulo)+'</p>'+
        '<p class="text-[11.5px] text-slate-500 truncate">'+dhcEsc(r.subtitulo)+'</p></div>'+
        '<span class="text-[11px] font-bold px-2.5 py-1 rounded-full '+(r.valor>0?'bg-amber-50 text-amber-700 border border-amber-200':'bg-slate-100 text-slate-600')+'">'+(r.valor>0?(typeof fmtMoney==='function'?fmtMoney(r.valor):('R$ '+r.valor)):'Franquia')+'</span>'+
        '<i class="ph ph-arrow-right dhc-seta"></i></div>';
    }).join('') || '<div class="p-8 text-center text-[12px] text-slate-500">Nenhuma pendência 🎉</div>';
  }
}

// Abraço no renderDashboard: render original (mesmo se explodir) + correção.
function dhcWrapDashboard(){
  if(typeof window.renderDashboard==='function' && !window.renderDashboard.__dhc){
    const _rd=window.renderDashboard;
    const embr=function(){
      let r;
      try{ r=_rd.apply(this,arguments); }catch(e){ try{ console.warn('[v6.0.7] renderDashboard tropeçou, listas corrigidas mesmo assim:',e); }catch(_){}} 
      setTimeout(dhcFixListas,30);
      return r;
    };
    embr.__dhc=true;
    window.renderDashboard=embr;
    return true;
  }
  return typeof window.renderDashboard==='function';
}
// Sonda leve: garante o abraço (caso o render seja definido depois) e cobre
// navegação pro Início sem depender de quem chamou (barata: 2s, para quando o
// Início some da tela por 20 checagens seguidas).
(function dhcSonda(){
  let fora=0, tent=0;
  const t=setInterval(function(){
    tent++;
    try{
      dhcWrapDashboard();
      const alvo=document.getElementById('list-chamados-recentes');
      const visivel=alvo && alvo.offsetParent!==null;
      if(visivel){ fora=0; dhcFixListas(); } else { fora++; }
    }catch(e){}
    if((fora>20 && tent>10) || tent>150) clearInterval(t); // ~5 min de teto
  },2000);
})();
console.log('v6.0.7 — INÍCIO SEM UNDEFINED + CLICÁVEL: chamados abrem a OS na Manutenção, leituras abrem na tela de Leituras; campos sem dado mostram alternativa honesta, nunca "undefined".');
})();
