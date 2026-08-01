// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.33 — Otimização profunda de carregamento e travamentos
// • Agenda automações pesadas em fila ociosa, uma por vez, sem bloquear a tela
// • Debounce forte dos renders principais para evitar renderizações duplicadas
// • Busca de módulos migrados deixa de filtrar a cada tecla: só Enter ou lupa
// • Helpers de assinatura para automações pularem quando nada mudou
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function now(){ return Date.now(); }
function idle(cb, timeout=900){
  if(typeof requestIdleCallback==='function') return requestIdleCallback(cb,{timeout});
  return setTimeout(()=>cb({timeRemaining:()=>0,didTimeout:true}),24);
}
function visible(viewId){
  if(!viewId || typeof document==='undefined') return true;
  const el=document.getElementById(viewId);
  if(!el) return true;
  if(el.classList && el.classList.contains('hidden')) return false;
  if(el.style && (el.style.display==='none'||el.style.visibility==='hidden')) return false;
  return true;
}
function fingerprintTables(dbRef, nomes){
  const mod=(dbRef&&dbRef.modulosDinamicos)||{};
  return (nomes||[]).map(nome=>{
    const r=(((mod[nome]||{}).dados)||[]);
    const first=r[0]||{};
    const last=r[r.length-1]||{};
    return `${nome}:${r.length}:${JSON.stringify(first).slice(0,60)}:${JSON.stringify(last).slice(0,90)}`;
  }).join('|');
}
function fingerprintArrays(dbRef, nomes, empId){
  return (nomes||[]).map(nome=>{
    const arr=Array.isArray(dbRef&&dbRef[nome])?dbRef[nome]:[];
    const filtrada=empId?arr.filter(x=>!x||!x.empresaId||x.empresaId===empId):arr;
    const last=filtrada[filtrada.length-1]||{};
    return `${nome}:${filtrada.length}:${JSON.stringify(last).slice(0,90)}`;
  }).join('|');
}
function deveRodarAssinatura(dbRef, chave, assinatura){
  if(!dbRef||!chave) return true;
  dbRef.config=dbRef.config||{};
  dbRef.config.automacoesTurbo=dbRef.config.automacoesTurbo||{};
  if(dbRef.config.automacoesTurbo[chave]===assinatura) return false;
  dbRef.config.automacoesTurbo[chave]=assinatura;
  return true;
}

const fila=[];
const porNome=new Map();
let timer=null;
let rodando=false;
let pausadoAte=now()+1200; // deixa a tela aparecer antes de começar as automações
const estat={agendadas:0, executadas:0, erros:0, ultima:''};
function agendarLoop(delay=0){
  if(timer) return;
  timer=setTimeout(processar, Math.max(0,delay));
}
function proximoPronto(){
  const t=now();
  let best=-1, bestAt=Infinity;
  for(let i=0;i<fila.length;i++){
    if(fila[i].at<=t) return i;
    if(fila[i].at<bestAt){ bestAt=fila[i].at; best=i; }
  }
  if(best>=0) agendarLoop(Math.max(16,bestAt-t));
  return -1;
}
function processar(){
  timer=null;
  if(rodando) return;
  const espera=pausadoAte-now();
  if(espera>0){ agendarLoop(espera); return; }
  const idx=proximoPronto();
  if(idx<0) return;
  const job=fila.splice(idx,1)[0];
  if(!job) return;
  porNome.delete(job.nome);
  rodando=true;
  idle(()=>{
    try{
      estat.ultima=job.nome;
      const r=job.fn&&job.fn();
      estat.executadas++;
      if(r && typeof r.then==='function') r.catch(e=>{ estat.erros++; console.error('[DIGICOPY] automação agendada falhou', job.nome, e); });
    }catch(e){
      estat.erros++;
      console.error('[DIGICOPY] automação agendada falhou', job.nome, e);
    }finally{
      rodando=false;
      if(fila.length) agendarLoop(90); // respiro entre rotinas grandes
    }
  }, job.timeout||1200);
}
function auto(nome, fn, delay=0, opts={}){
  if(typeof fn!=='function') return undefined;
  const id=txt(nome)||('job_'+Math.random().toString(36).slice(2));
  const existente=porNome.get(id);
  if(existente){
    existente.fn=fn;
    existente.at=Math.min(existente.at, now()+Math.max(0,delay));
    return undefined;
  }
  const job={nome:id,fn,at:now()+Math.max(0,delay),timeout:opts.timeout||1200};
  porNome.set(id,job);
  fila.push(job);
  estat.agendadas++;
  agendarLoop(delay);
  return undefined;
}

const VIEW_MAP={
  renderDashboard:'view-dashboard', renderClientes:'view-clientes', renderProdutos:'view-produtos', renderEquipamentos:'view-impressoras',
  renderContratos:'view-contratos', renderParque:'view-parque', renderLeituras:'view-leituras', renderOs:'view-manutencao',
  renderVendas:'view-vendas', renderFinanceiro:'view-financeiro', renderRelatorios:'view-relatorios', renderConfig:'view-config',
  renderUsuarios:'view-usuarios', renderAuditoria:'view-auditoria'
};
function wrapRender(nome){
  const original=window[nome];
  if(typeof original!=='function' || original.__turboRender) return false;
  let pendente=false, args=null, ctx=null;
  const wrapped=function(){
    args=arguments; ctx=this;
    if(!visible(VIEW_MAP[nome])) return undefined;
    if(pendente) return undefined;
    pendente=true;
    idle(()=>{
      pendente=false;
      if(!visible(VIEW_MAP[nome])) return;
      try{ original.apply(ctx,args); }
      catch(e){ console.error('[DIGICOPY] erro no render otimizado', nome, e); }
    },400);
    return undefined;
  };
  wrapped.__turboRender=true;
  wrapped.__original=original;
  window[nome]=wrapped;
  return true;
}
function instalarRenderTurbo(){
  Object.keys(VIEW_MAP).forEach(wrapRender);
}

function ajustarBuscaModulo(nomeTabela){
  if(typeof document==='undefined' || !nomeTabela) return;
  const input=document.getElementById('search-mod-'+nomeTabela);
  if(input && !input.__turboBuscaModulo){
    input.removeAttribute('oninput');
    input.oninput=null;
    input.onkeydown=function(e){
      if(e.key==='Enter'){
        e.preventDefault();
        if(typeof window.filtrarModuloDinamico==='function') window.filtrarModuloDinamico(nomeTabela);
      }
    };
    input.__turboBuscaModulo=true;
  }
}
function wrapModuloDinamico(){
  const original=window.renderModuloDinamico;
  if(typeof original!=='function' || original.__turboModulo) return;
  window.renderModuloDinamico=function(nomeTabela){
    const ret=original.apply(this,arguments);
    setTimeout(()=>ajustarBuscaModulo(nomeTabela),0);
    return ret;
  };
  window.renderModuloDinamico.__turboModulo=true;
  const oldFiltrar=window.filtrarModuloDinamico;
  if(typeof oldFiltrar==='function' && !oldFiltrar.__turboDebounce){
    let t=null, lastArgs=null, lastCtx=null;
    window.filtrarModuloDinamico=function(){
      lastArgs=arguments; lastCtx=this;
      clearTimeout(t);
      t=setTimeout(()=>oldFiltrar.apply(lastCtx,lastArgs),40);
    };
    window.filtrarModuloDinamico.__turboDebounce=true;
  }
}

window.DIGI_TURBO={ auto, visible, wrapRender, instalarRenderTurbo, wrapModuloDinamico, fingerprintTables:(nomes)=>fingerprintTables(window.db||db,nomes), fingerprintArrays:(nomes,empId)=>fingerprintArrays(window.db||db,nomes,empId), deveRodarAssinatura:(chave,sig)=>deveRodarAssinatura(window.db||db,chave,sig), estat };
window.DIGI_TURBO_PURE={ fingerprintTables, fingerprintArrays, deveRodarAssinatura, visible };

if(typeof window==='undefined'||typeof document==='undefined') return;
// Espera todos os patches antigos embrulharem os renders; depois embrulha o resultado final.
setTimeout(()=>{ try{ instalarRenderTurbo(); wrapModuloDinamico(); }catch(e){ console.error('[DIGICOPY] falha ao instalar turbo', e); } }, 4800);
console.log('[DIGICOPY] otimizacao_profunda_patch.js v4.9.33 carregado');
})();
