// PATCH v5.17.6 — antigo do último chamado; Alterar Cont. grava; peças lupa; PDF
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function txt(v){ return String(v??'').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb===undefined?0:fb); }
function dia(v){ return String(v||'').slice(0,10); }
function dataBR(v){ const s=dia(v); if(!s) return ''; const p=s.split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,'Aviso'); }
function logoSrc(){ return window.DIGICOPY_LOGO||'./logo.png'; }
function temColor(p){
  const m=(p&&(p.medidoresConfig||p.medidores))||{};
  return !!(m.colorA4&&m.colorA4.modalidade&&m.colorA4.modalidade!=='inativo')
      || !!(m.colorA3&&m.colorA3.modalidade&&m.colorA3.modalidade!=='inativo');
}
function eq(id){ return (db.equipamentos||[]).find(e=>e.id===id)||null; }

function contadorDaLeitura(equipId, cor){
  const e=eq(equipId)||{};
  let best={d:'',pb:e.contadorPB,cor:e.contadorCor};
  const p=(db.parque||[]).find(x=>x.equipamentoId===equipId);
  if(p&&p.medidoresConfig){
    if(p.medidoresConfig.pretoA4&&p.medidoresConfig.pretoA4.contadorInicial!=null) best.pb=p.medidoresConfig.pretoA4.contadorInicial;
    if(p.medidoresConfig.colorA4&&p.medidoresConfig.colorA4.contadorInicial!=null) best.cor=p.medidoresConfig.colorA4.contadorInicial;
  }
  if(p&&p.contadores){
    if(p.contadores.pretoA4!=null) best.pb=p.contadores.pretoA4;
    if(p.contadores.colorA4!=null) best.cor=p.contadores.colorA4;
  }
  (db.leituras||[]).forEach(l=>{
    const d=l.dataLeitura||l.criadoEm||'';
    (l.itens||[]).forEach(it=>{
      const pr=it.parqueId&&(db.parque||[]).find(x=>x.id===it.parqueId);
      if(it.equipamentoId!==equipId && !(pr&&pr.equipamentoId===equipId)) return;
      if(!best.d||new Date(d)>=new Date(best.d||0)){
        if(/color/i.test(it.medidor||it.medidorLabel||'')) best={d,pb:best.pb,cor:it.atual};
        else best={d,pb:it.atual,cor:best.cor};
      }
    });
    if(l.equipamentoId===equipId){
      if(!best.d||new Date(d)>=new Date(best.d||0))
        best={d,pb:l.contadorPB!=null?l.contadorPB:best.pb,cor:l.contadorCor!=null?l.contadorCor:best.cor};
    }
  });
  return cor?n(best.cor,0):n(best.pb,0);
}

// Antigo = último chamado (contador atual). Sem chamado = leitura.
window.lcContadorAntigoChamado=function(equipId, cor, ignoreOsId){
  let best=null;
  (db.os||[]).forEach(o=>{
    if(ignoreOsId&&o.id===ignoreOsId) return;
    if(o.equipamentoId!==equipId) return;
    const v=cor?o.contadorColor:o.contadorAtual;
    if(v===null||v===undefined||v==='') return;
    const d=o.dataAbertura||o.criadoEm||'';
    if(!best||new Date(d)>=new Date(best.d||0)) best={d,v};
  });
  if(best) return n(best.v,0);
  return contadorDaLeitura(equipId, cor);
};

// ── Impressora: Alterar Cont. NÃO some (mostra o salvo, inclusive 0) ──
function patchHtmlMedidor(){
  const orig=window.impfTrocarMedidor;
  // regrava valor visível nos inputs após abrir
  const _abrir=window.abrirModalEquipamentoContrato;
  if(typeof _abrir==='function' && !_abrir.__v5176){
    window.abrirModalEquipamentoContrato=function(contratoId, parqueId){
      const r=_abrir.apply(this,arguments);
      setTimeout(()=>{
        const p=parqueId&&(db.parque||[]).find(x=>x.id===parqueId);
        if(!p) return;
        const meds=p.medidoresConfig||p.medidores||{};
        ['pretoA4','pretoA3','colorA4','colorA3','scanner'].forEach(k=>{
          const el=document.getElementById('impf-'+k+'-contadorInicial');
          if(!el) return;
          const m=meds[k];
          if(m && m.contadorInicial!=null && m.contadorInicial!=='') el.value=m.contadorInicial;
        });
      },40);
      return r;
    };
    window.abrirModalEquipamentoContrato.__v5176=true;
  }
  const _sv=window.salvarImpressoraContrato;
  if(typeof _sv==='function' && !_sv.__v5176cont){
    window.salvarImpressoraContrato=function(contratoId, parqueId){
      const snaps={};
      ['pretoA4','pretoA3','colorA4','colorA3','scanner'].forEach(k=>{
        const el=document.getElementById('impf-'+k+'-contadorInicial');
        if(el && String(el.value).trim()!=='') snaps[k]=Number(String(el.value).replace(',','.'));
      });
      const r=_sv.apply(this,arguments);
      const p=parqueId&&(db.parque||[]).find(x=>x.id===parqueId)
        || (db.parque||[]).slice().reverse().find(x=>x.contratoId===contratoId);
      if(p){
        p.medidoresConfig=p.medidoresConfig||p.medidores||{};
        p.contadores=p.contadores||{};
        Object.keys(snaps).forEach(k=>{
          p.medidoresConfig[k]=p.medidoresConfig[k]||{};
          p.medidoresConfig[k].contadorInicial=snaps[k];
          p.contadores[k]=snaps[k];
        });
        p.medidores=p.medidoresConfig;
        if(typeof saveDB==='function') saveDB();
      }
      return r;
    };
    window.salvarImpressoraContrato.__v5176cont=true;
  }
}
patchHtmlMedidor();

// Chamado NUNCA altera contador da impressora
function naoMexerContadorImpressora(fn){
  return function(){
    const snaps=(db.equipamentos||[]).map(e=>({id:e.id,pb:e.contadorPB,cor:e.contadorCor}));
    const prq=(db.parque||[]).map(p=>({id:p.id,c:JSON.stringify(p.contadores||{}),m:JSON.stringify(p.medidoresConfig||{})}));
    const r=fn.apply(this,arguments);
    snaps.forEach(s=>{ const e=eq(s.id); if(e){ e.contadorPB=s.pb; e.contadorCor=s.cor; } });
    prq.forEach(s=>{
      const p=(db.parque||[]).find(x=>x.id===s.id);
      if(!p) return;
      try{ p.contadores=JSON.parse(s.c); p.medidoresConfig=JSON.parse(s.m); p.medidores=p.medidoresConfig; }catch(_){}
    });
    if(typeof saveDB==='function') saveDB();
    return r;
  };
}
if(window.salvarChamadoCompleto && !window.salvarChamadoCompleto.__noCnt){
  window.salvarChamadoCompleto=naoMexerContadorImpressora(window.salvarChamadoCompleto);
  window.salvarChamadoCompleto.__noCnt=true;
}
if(window.salvarChamadoAvulso && !window.salvarChamadoAvulso.__noCnt){
  window.salvarChamadoAvulso=naoMexerContadorImpressora(window.salvarChamadoAvulso);
  window.salvarChamadoAvulso.__noCnt=true;
}

// Preenche antigo do chamado
const _auto=window.autoPreencherDadosChamado;
if(typeof _auto==='function'){
  window.autoPreencherDadosChamado=function(equipId, manter, ignoreOsId){
    const r=_auto.apply(this,arguments);
    const id=ignoreOsId|| (window.modalContext&&window.modalContext.id)||null;
    const ant=document.getElementById('ko-cont-ant')||document.getElementById('ca-cont-ant');
    if(ant&&equipId) ant.value=window.lcContadorAntigoChamado(equipId,false,id);
    const ca=document.getElementById('lc-cont-color-ant')||document.getElementById('ca-cont-color-ant');
    if(ca&&equipId) ca.value=window.lcContadorAntigoChamado(equipId,true,id);
    const atu=document.getElementById('ko-cont-atu')||document.getElementById('ca-cont-atu');
    if(atu && !manter) atu.value='';
    if(typeof calcImpressoesChamado==='function') calcImpressoesChamado();
    if(typeof calcChamadoAvulso==='function') calcChamadoAvulso();
    return r;
  };
}

// ── 4.1 busca SÓ lupa/Enter + lançar de verdade ──
window.lcBuscarPeca=function(prefix){
  const inp=document.getElementById(prefix+'-prod-search');
  const res=document.getElementById(prefix+'-prod-results');
  if(!res) return;
  const q=low(inp&&inp.value);
  if(!q){ res.classList.add('hidden'); res.innerHTML=''; return; }
  const s=sess();
  let lista=(db.produtos||[]).filter(p=>(!s||p.empresaId===s.empresaId)&&p.status!=='inativo'&&p.status!=='excluido');
  lista=lista.filter(p=>[p.nome,p.sku,p.codigo,p.categoria,p.fabricante].some(v=>low(v).includes(q))).slice(0,20);
  if(!lista.length){ res.innerHTML='<p class="p-3 text-[12px] text-slate-400">Nenhum item</p>'; res.classList.remove('hidden'); return; }
  res.innerHTML=lista.map(p=>`<div class="px-3 py-2 border-b hover:bg-blue-50 cursor-pointer" onmousedown="event.preventDefault();lcAddPeca('${prefix}','${p.id}')"><b>${esc(p.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(p.sku||p.codigo||'')} • ${typeof fmtMoney==='function'?fmtMoney(p.preco||0):p.preco}</span></div>`).join('');
  res.classList.remove('hidden');
};

window.lcAddPeca=function(prefix,prodId){
  const p=(db.produtos||[]).find(x=>x.id===prodId);
  if(!p){ aviso('Produto não encontrado'); return; }
  const qtd=Math.max(1,n(document.getElementById(prefix+'-prod-qtd')?.value,1));
  window.__chamadoPecasTemp=window.__chamadoPecasTemp||[];
  const ex=window.__chamadoPecasTemp.find(i=>i.produtoId===prodId);
  if(ex){ ex.qtd+=qtd; ex.subtotal=ex.qtd*n(ex.preco); }
  else window.__chamadoPecasTemp.push({produtoId:prodId,descricao:p.nome,qtd,preco:n(p.preco),subtotal:qtd*n(p.preco)});
  if(typeof window.lcRenderPecas==='function') window.lcRenderPecas(prefix);
  const res=document.getElementById(prefix+'-prod-results'); if(res){ res.classList.add('hidden'); res.innerHTML=''; }
  const inp=document.getElementById(prefix+'-prod-search'); if(inp) inp.value='';
};

function bindPecaLupa(prefix){
  const inp=document.getElementById(prefix+'-prod-search');
  if(!inp||inp.dataset.lupa) return;
  inp.dataset.lupa='1';
  inp.removeAttribute('oninput');
  inp.oninput=null;
  inp.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); lcBuscarPeca(prefix); } };
  if(!document.getElementById(prefix+'-prod-lupa')){
    const btn=document.createElement('button');
    btn.type='button';
    btn.id=prefix+'-prod-lupa';
    btn.className='h-11 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold';
    btn.innerHTML='<i class="ph ph-magnifying-glass"></i>';
    btn.onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); lcBuscarPeca(prefix); };
    const wrap=document.createElement('div');
    wrap.className='flex gap-2 mb-2';
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);
    wrap.appendChild(btn);
    inp.className='flex-1 h-11 px-3 rounded-xl border bg-white';
  }
}

const _open=window.openModalChamadoCompleto;
if(typeof _open==='function'){
  window.openModalChamadoCompleto=function(osId,contratoId){
    const r=_open.apply(this,arguments);
    setTimeout(()=>{
      bindPecaLupa('ko');
      const equip=document.getElementById('ko-equip')?.value;
      if(equip){
        const ant=document.getElementById('ko-cont-ant');
        if(ant) ant.value=window.lcContadorAntigoChamado(equip,false,osId);
        const ca=document.getElementById('lc-cont-color-ant');
        if(ca) ca.value=window.lcContadorAntigoChamado(equip,true,osId);
      }
    },50);
    return r;
  };
}
const _av=window.abrirChamadoAvulsoForm;
if(typeof _av==='function'){
  window.abrirChamadoAvulsoForm=function(id){
    const r=_av.apply(this,arguments);
    setTimeout(()=>{
      bindPecaLupa('ca');
      const eqId=window.__CHAMADO_AVULSO&&window.__CHAMADO_AVULSO.equipamentoId;
      if(eqId){
        const ant=document.getElementById('ca-cont-ant');
        if(ant) ant.value=window.lcContadorAntigoChamado(eqId,false,id);
      }
    },120);
    return r;
  };
}

// ── 4.2 PDF: contadores ao lado da data + assinaturas ──

console.log('[DIGICOPY] ajustes_v5176_patch.js');
})();
