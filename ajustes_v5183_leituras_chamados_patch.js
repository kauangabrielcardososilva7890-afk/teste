// PATCH v5.18.3 — alertas visuais de leitura, validação de contador e dados da impressora no chamado
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function n(v,fb=0){ const x=Number(String(v ?? '').replace(',','.')); return Number.isFinite(x)?x:fb; }
function esc(v){ return String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
function money(v){ return typeof fmtMoney==='function' ? fmtMoney(n(v)) : ('R$ '+n(v).toFixed(2).replace('.',',')); }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function confirmar(msg,titulo){
  if(typeof confirmSistema==='function') return confirmSistema(msg,titulo||'Confirmar');
  if(typeof window.lfbAlert==='function') return window.lfbAlert(msg,titulo||'Confirmar');
  return Promise.resolve(window.confirm(msg));
}
function eq(id){ return (db.equipamentos||[]).find(e=>e.id===id)||{}; }
function parque(id){ return (db.parque||[]).find(p=>p.id===id)||{}; }
function leitura(id){ return (db.leituras||[]).find(l=>l.id===id)||null; }
function leituraTotal(l){ return (l&&l.itens||[]).reduce((s,it)=>s+n(it.valorTotal),0); }

// ── 2: aviso visual somente dentro da leitura aberta ──
function alertaItem(it){
  if(n(it&&it.valorTotal)>3000) return 'caro';
  if(String((it && it.atual) ?? '').trim()!=='' && n(it.atual)===0) return 'zerada';
  return 'normal';
}
function pintarItensDaLeitura(l){
  const body=document.getElementById('modal-body');
  const rows=[...(body?.querySelectorAll('table tbody tr')||[])].filter(r=>!r.textContent.includes('Nenhuma impressora'));
  (l?.itens||[]).forEach((it,idx)=>{
    const row=rows[idx]; if(!row) return;
    const tipo=alertaItem(it);
    row.classList.remove('bg-orange-100','bg-yellow-100');
    row.style.backgroundColor=''; row.removeAttribute('title');
    if(tipo==='caro'){ row.classList.add('bg-orange-100'); row.style.backgroundColor='#ffedd5'; row.title='Aviso: esta impressora ultrapassou R$ 3.000,00 nesta leitura'; }
    if(tipo==='zerada'){ row.classList.add('bg-yellow-100'); row.style.backgroundColor='#fef9c3'; row.title='Aviso: esta impressora ficou zerada'; }
  });
  if(rows.length && !body.querySelector('[data-alerta-leitura-legenda]')){
    const legend=document.createElement('p'); legend.dataset.alertaLeituraLegenda='1'; legend.className='text-[11px] text-slate-500 mt-2';
    legend.innerHTML='<span style="background:#ffedd5;padding:2px 6px;border-radius:5px">Laranja: acima de R$ 3.000,00</span> <span style="background:#fef9c3;padding:2px 6px;border-radius:5px;margin-left:5px">Amarelo: zerada</span>';
    body.querySelector('table')?.parentElement?.after(legend);
  }
}
function envolverDetalhe(nome){
  const antigo=window[nome];
  if(typeof antigo!=='function' || antigo.__v5183detalhe) return;
  const novo=function(id){ const r=antigo.apply(this,arguments); setTimeout(()=>pintarItensDaLeitura(leitura(id)),30); return r; };
  novo.__v5183detalhe=true; window[nome]=novo;
}
envolverDetalhe('abrirLeituraContratoDetalhe');
envolverDetalhe('abrirLeituraDefinitiva');

// ── 2.1: contador nunca pode voltar para trás ──
function validaContador(leituraId, pId, medId, inputId){
  const l=leitura(leituraId), p=parque(pId); if(!l||!p) return true;
  const med=(p.medidoresConfig||p.medidores||{})[medId]||{};
  const antigo=n((p.contadores||{})[medId] ?? med.contadorInicial);
  const atual=n(document.getElementById(inputId)?.value,NaN);
  if(!Number.isFinite(atual)) return true;
  if(atual<antigo){ toastMsg(`Contador inválido. O atual não pode ser menor que ${antigo}.`,'error'); return false; }
  return true;
}
function envolverLancamento(nome, inputId){
  const antigo=window[nome];
  if(typeof antigo!=='function' || antigo.__v5183) return;
  const novo=function(leituraId){
    const pId=document.getElementById('lan-prq')?.value || document.getElementById('lei-prq-def')?.value;
    const medId=document.getElementById('lan-med')?.value || document.getElementById('lei-med-def')?.value;
    if(!validaContador(leituraId,pId,medId,inputId)) return;
    return antigo.apply(this,arguments);
  };
  novo.__v5183=true; window[nome]=novo;
}
envolverLancamento('salvarLancamentoContador','lan-cont');
envolverLancamento('salvarItemLeituraDefinitiva','lei-cont-def');

// ── 2.2: remover lançamento restaura o contador anterior ──
const removerAntigo=window.removerLancamentoLeitura;
if(typeof removerAntigo==='function' && !removerAntigo.__v5183){
  const novoRemover=function(leituraId,idx){
    const l=leitura(leituraId), item=l&&l.itens&&l.itens[idx];
    if(!l||!item) return removerAntigo.apply(this,arguments);
    const p=parque(item.parqueId);
    const r=confirmar('Deseja remover este lançamento? O contador voltará ao valor anterior e a impressora ficará disponível para lançar novamente.','Remover lançamento');
    return Promise.resolve(r).then(ok=>{
      if(!ok) return;
      if(p){ p.contadores=p.contadores||{}; p.contadores[item.medidor]=n(item.anterior); }
      // Reproduz a remoção sem o confirm nativo da rotina antiga.
      l.itens.splice(idx,1); l.valorTotal=l.itens.reduce((s,x)=>s+n(x.valorTotal),0); l.valorExcedente=l.valorTotal;
      salvar();
      if(typeof abrirLeituraContratoDetalhe==='function') abrirLeituraContratoDetalhe(leituraId);
      else if(typeof abrirLeituraDefinitiva==='function') abrirLeituraDefinitiva(leituraId);
    });
  };
  novoRemover.__v5183=true; window.removerLancamentoLeitura=novoRemover;
}

// ── 2.3: fechar a leitura pede confirmação ──
let bypassClose=false;
function ehModalLeitura(){
  const t=low(document.getElementById('modal-title')?.textContent);
  return t.includes('leitura') || t.includes('lançamento de contador');
}
const closeAntigo=window.closeModal;
if(typeof closeAntigo==='function' && !closeAntigo.__v5183){
  const novoClose=function(){
    if(bypassClose || !ehModalLeitura()) return closeAntigo.apply(this,arguments);
    const root=document.getElementById('modal-root');
    if(root?.dataset.v5183Confirmando==='1') return;
    root.dataset.v5183Confirmando='1';
    return confirmar('Deseja salvar a leitura antes de fechar?','Fechar leitura').then(ok=>{
      if(ok) salvar();
      root.dataset.v5183Confirmando='0';
      bypassClose=true;
      try{ return closeAntigo.apply(this,arguments); } finally { bypassClose=false; }
    });
  };
  novoClose.__v5183=true; window.closeModal=novoClose;
}
const voltarAntigo=window.fecharOuVoltar;
if(typeof voltarAntigo==='function' && !voltarAntigo.__v5183){
  const novoVoltar=function(){
    if(bypassClose || !ehModalLeitura()) return voltarAntigo.apply(this,arguments);
    const root=document.getElementById('modal-root');
    if(root?.dataset.v5183Confirmando==='1') return;
    root.dataset.v5183Confirmando='1';
    return confirmar('Deseja salvar a leitura antes de fechar?','Fechar leitura').then(ok=>{
      if(ok) salvar();
      root.dataset.v5183Confirmando='0'; bypassClose=true;
      try{ return voltarAntigo.apply(this,arguments); } finally { bypassClose=false; }
    });
  };
  novoVoltar.__v5183=true; window.fecharOuVoltar=novoVoltar;
}

// ── 1.2: peças do chamado com o mesmo cálculo da venda ──
// O editor já usa qtd, valor unitário, desconto em R$ e valor final (subtotal).
// Esta garantia mantém os campos disponíveis nos dois formulários: contrato e avulso.
function garantirCamposPecas(){
  ['ko','ca'].forEach(prefix=>{
    const box=document.getElementById(prefix+'-pecas-box');
    if(!box) return;
    const texto=low(box.textContent);
    if(!texto.includes('valor final') || !texto.includes('desc.')) return;
    box.dataset.v5183Pecas='1';
  });
}

// ── 4/4.1: Enter salva lançamento e contador oficial fica somente informativo ──
function contadorOficial(p,key){
  const med=((p&&p.medidoresConfig)||p&&p.medidores||{})[key]||{};
  return n((p&&p.contadores||{})[key] ?? med.contadorInicial);
}
function atualizarUltimoContador(){
  const p=parque(document.getElementById('lan-prq')?.value);
  const key=document.getElementById('lan-med')?.value;
  const info=document.getElementById('lan-ultimo-contador');
  if(!info) return;
  if(!p.id||!key){ info.textContent='Selecione a impressora e o tipo ativo para ver o último contador salvo.'; return; }
  info.textContent=`Último contador salvo: ${contadorOficial(p,key)}`;
}
const tiposAntigo=window.atualizarTiposLancamento;
if(typeof tiposAntigo==='function' && !tiposAntigo.__v5183){
  const novoTipos=function(){ const r=tiposAntigo.apply(this,arguments); setTimeout(atualizarUltimoContador,0); return r; };
  novoTipos.__v5183=true; window.atualizarTiposLancamento=novoTipos;
}
const abrirLancAntigo=window.abrirLancamentoContador;
if(typeof abrirLancAntigo==='function' && !abrirLancAntigo.__v5183){
  const novoAbrir=function(){
    const r=abrirLancAntigo.apply(this,arguments);
    setTimeout(()=>{
      const input=document.getElementById('lan-cont');
      if(input && !document.getElementById('lan-ultimo-contador')){
        const info=document.createElement('p'); info.id='lan-ultimo-contador'; info.className='text-[11px] text-slate-500 mt-1';
        info.textContent='Selecione a impressora e o tipo ativo para ver o último contador salvo.';
        input.parentElement?.appendChild(info);
      }
      const med=document.getElementById('lan-med'); if(med) med.onchange=atualizarUltimoContador;
      atualizarUltimoContador();
    },20);
    return r;
  };
  novoAbrir.__v5183=true; window.abrirLancamentoContador=novoAbrir;
}
// Enter salva quando não estiver no campo da busca de impressora.
if(!window.__v5183EnterLancamento){
  window.__v5183EnterLancamento=true;
  document.addEventListener('keydown',function(ev){
    if(ev.key!=='Enter' || !ehModalLeitura()) return;
    const alvo=ev.target;
    if(alvo && (alvo.id==='lan-filtro-texto' || alvo.id==='lan-busca-impressora' || alvo.tagName==='TEXTAREA')) return;
    const btn=document.querySelector('button[onclick*="salvarLancamentoContador"]');
    if(!btn) return;
    ev.preventDefault(); ev.stopPropagation(); btn.click();
  },true);
}
// O lançamento é um rascunho: não altera o contador oficial. O faturamento altera.
const salvarLancAntigo=window.salvarLancamentoContador;
if(typeof salvarLancAntigo==='function' && !salvarLancAntigo.__v5183Official){
  const novoSalvar=function(id){
    const l=leitura(id), p=parque(document.getElementById('lan-prq')?.value), key=document.getElementById('lan-med')?.value;
    const antes=p&&p.contadores ? p.contadores[key] : undefined;
    const r=salvarLancAntigo.apply(this,arguments);
    if(p&&key){ p.contadores=p.contadores||{}; if(antes===undefined) delete p.contadores[key]; else p.contadores[key]=antes; salvar(); }
    return r;
  };
  novoSalvar.__v5183Official=true; window.salvarLancamentoContador=novoSalvar;
}
function atualizarContadoresFaturados(l){
  (l&&l.itens||[]).forEach(it=>{ const p=parque(it.parqueId); if(!p.id) return; p.contadores=p.contadores||{}; p.contadores[it.medidor]=n(it.atual); });
}
const fatAntigo=window.faturarLeituraContrato;
if(typeof fatAntigo==='function' && !fatAntigo.__v5183Official){
  const novoFat=function(id){ const r=fatAntigo.apply(this,arguments); atualizarContadoresFaturados(leitura(id)); salvar(); return r; };
  novoFat.__v5183Official=true; window.faturarLeituraContrato=novoFat;
}
const fatDefAntigo=window.faturarLeituraDefinitiva;
if(typeof fatDefAntigo==='function' && !fatDefAntigo.__v5183Official){
  const novoFatDef=function(id){ const r=fatDefAntigo.apply(this,arguments); atualizarContadoresFaturados(leitura(id)); salvar(); return r; };
  novoFatDef.__v5183Official=true; window.faturarLeituraDefinitiva=novoFatDef;
}

// O PDF original permanece intact; o complemento de impressora é aplicado em ajustes_v5182_patch.js.

console.log('[DIGICOPY] ajustes_v5183_leituras_chamados_patch.js carregado');
})();
