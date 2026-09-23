// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE_PATCH v4.4.3 — destrava a interface em PC fraco
//
// O QUE ESTE ARQUIVO FAZ HOJE (e só isto):
//  1. saveDB() write-behind: marca a alteração e grava 1x só, ~0,9s depois da
//     última ação (+ gravação garantida ao trocar de aba/fechar). Antes o
//     saveDB() serializava + comprimia + gravava a base INTEIRA (dezenas de MB)
//     a cada clique e congelava a tela por segundos.
//  2. Helpers puros (perfHashStr / perfDiffPartes / perfEmLotes) exportados em
//     window.__perfPure — testados em test_perf.js.
//
// AUDITORIA 23/09/2026 — o que foi REMOVIDO daqui: o envio e o carregamento
// manuais da nuvem antiga (Supabase). Eram ~240 linhas de código morto que
// liam window.__supabaseSyncInternals — símbolo que NÃO existe em lugar nenhum
// do repositório — e que ainda embrulhavam syncEnviarParaNuvem/
// syncCarregarDaNuvem, participando do aviso falso de "enviou para a nuvem"
// com a nuvem desligada. Saíram por ordem do dono ("não quero algo manual que
// envia pra nuvem, quero automático"). A sincronização que vale é a da
// Cloudflare, automática (cloudflare_data_sync_patch.js).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

/* PERF_PURE_START */
// ── Helpers puros (testáveis com node) ──
function perfHashStr(s){
  // FNV-1a 32 bits — rápido para strings de 1,5 MB
  let h = 0x811c9dc5;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h>>>0).toString(36);
}
// Compara as partes novas com o cache de hashes do último envio
function perfDiffPartes(novas, antigaHashes){
  // novas: [{key, dataStr}] ; antigaHashes: {key: hash}
  const atual = {};
  const mudadas = [];
  const ant = antigaHashes || {};
  novas.forEach(p=>{
    const h = perfHashStr(p.dataStr);
    atual[p.key] = h;
    if(ant[p.key] !== h) mudadas.push(p.key);
  });
  const removidas = Object.keys(ant).filter(k=>!(k in atual));
  return { mudadas, removidas, atual };
}
// Executa fn em lotes paralelos de tamanho n; coleta erros sem abortar
async function perfEmLotes(lista, n, fn){
  const erros = [];
  for(let i=0;i<lista.length;i+=n){
    const rs = await Promise.allSettled(lista.slice(i,i+n).map(fn));
    rs.forEach((r,j)=>{
      if(r.status==='rejected'){
        const item = lista[i+j]||{};
        erros.push((item.key||item[0]||(i+j))+': '+((r.reason && r.reason.message)||r.reason));
      }
    });
  }
  return erros;
}
/* PERF_PURE_END */
window.__perfPure = { perfHashStr, perfDiffPartes, perfEmLotes };

// ═══════════════════════════════════════════════════════════════════════════
// 1) saveDB write-behind — a tela nunca mais congela a cada clique
// ═══════════════════════════════════════════════════════════════════════════
(function wrapSaveDB(){
  const realSave = window.saveDB;
  if(typeof realSave!=='function' || window.__saveDBSched) return;
  let pendente = false, agendado = false;
  const FLUSH_MS = 900;
  function flush(){
    agendado = false;
    if(!pendente) return;
    pendente = false;
    try{ realSave(); }catch(e){ /* mantém na fila mental: próxima ação tenta de novo */ pendente = true; }
  }
  window.saveDB = function(){
    pendente = true;
    if(agendado) return;
    agendado = true;
    setTimeout(flush, FLUSH_MS);
  };
  // Para fluxos que PRECISAM da gravação imediata (antes de reload/impressão)
  window.saveDBAgora = function(){
    pendente = true; flush();
    // v4.5.0: a persistência real é fatiada no tempo; aqui drena tudo na hora
    if(typeof window.__saveDBDrainSync==='function'){ try{ window.__saveDBDrainSync(); }catch(e){} }
  };
  const urgente = ()=>{
    if(pendente){ pendente=false; try{ realSave(); }catch(e){ pendente=true; } }
    if(typeof window.__saveDBDrainSync==='function'){ try{ window.__saveDBDrainSync(); }catch(eD){} }
  };
  if(typeof window!=='undefined' && typeof window.addEventListener==='function'){
    window.addEventListener('beforeunload', urgente);
    if(typeof document!=='undefined' && document.addEventListener){
      document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') urgente(); });
    }
    setInterval(()=>{ if(pendente && !agendado) urgente(); }, 3000);
  }
  window.__saveDBSched = true;
})();

// AUDITORIA 23/09/2026 — o envio/carregamento MANUAL (Supabase) foi removido a
// pedido do dono: 'não quero algo manual que envia pra nuvem, quero automático'.
// Este arquivo ficou só com o que é vivo e útil: os helpers puros (perfHashStr,
// perfDiffPartes, perfEmLotes) e o saveDB write-behind, que é o que destrava a
// interface em PC fraco. A sincronização de verdade é a da Cloudflare, que é
// automática (cloudflare_data_sync_patch.js).
console.log('PATCH performance v4.4.3 — saveDB write-behind + helpers puros (envio manual Supabase removido)');
})();
