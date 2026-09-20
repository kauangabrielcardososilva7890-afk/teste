// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE_PATCH v4.3.0 — destrava a interface e acelera a nuvem
//
// ANTES (por que travava):
//  1. saveDB() serializava + comprimia + gravava a base INTEIRA (dezenas de MB)
//     a cada clique — congelava a tela por segundos.
//  2. Enviar para nuvem republicava TODAS as 90+ partes, uma a uma, mesmo com
//     uma única venda nova.
//  3. Carregar da nuvem puxava todas as partes num SELECT único gigante
//     (causa do "canceling statement due to statement timeout").
//
// DEPOIS (esta otimização):
//  1. saveDB() marca a alteração e grava 1x só, ~0,9s depois da última ação
//     (+ gravação garantida ao trocar de aba/fechar).
//  2. Envio incremental: cada parte é identificada por hash; só sobem as
//     partes que MUDARAM (em lotes paralelos de 6). Uma venda nova sobe em
//     segundos, não em minutos. Partes removidas são apagadas da nuvem.
//  3. Carregamento paralelo por entidade: vários SELECTs pequenos (com
//     progresso por módulo) em vez de um único gigante.
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

// ═══════════════════════════════════════════════════════════════════════════
// Cache local de hashes das partes enviadas (identifica o que mudou)
// O cache é separado POR BACKEND (supabase/firebase): trocar de nuvem força
// um primeiro envio completo na nuvem nova, sem misturar os hashes da antiga.
// ═══════════════════════════════════════════════════════════════════════════
const PARTCACHE_KEY = 'digicopy_erp_v2_partcache_v1';
function partCacheKeyAtual(){
  const I = window.__supabaseSyncInternals;
  const backend = (I && I.nome) || 'supabase';
  return PARTCACHE_KEY + '__' + backend;
}
function partCacheLer(){
  try{ return JSON.parse(localStorage.getItem(partCacheKeyAtual())||'null') || null; }catch(e){ return null; }
}
function partCacheGravar(hashes){
  try{ localStorage.setItem(partCacheKeyAtual(), JSON.stringify({ts:new Date().toISOString(), hashes})); }catch(e){}
}
function partCacheLimpar(){ try{ localStorage.removeItem(partCacheKeyAtual()); }catch(e){} }
// Se a base local veio da nuvem DEPOIS do último envio deste PC, o cache não
// corresponde mais ao estado atual → zera (o próximo envio republica tudo 1x)
(function invalidarCacheSeBaseVeioDaNuvem(){
  try{
    const c = partCacheLer(); if(!c || !c.ts) return;
    const tsCache = Date.parse(c.ts)||0;
    const sinc = Date.parse(db?.meta?.sincronizadoEm||'')||0;
    if(sinc > tsCache) partCacheLimpar();
  }catch(e){}
})();

function upStatus(html){
  try{
    const I = window.__supabaseSyncInternals;
    if(I && I.setCloudSyncStatus) I.setCloudSyncStatus(html);
  }catch(e){}
}

// ═══════════════════════════════════════════════════════════════════════════
// 2) ENVIO INCREMENTAL — só sobem as partes que mudaram (lotes paralelos)
// ═══════════════════════════════════════════════════════════════════════════
const __enviarOriginal = window.syncEnviarParaNuvem;
window.syncEnviarParaNuvem = async function(opts={}){
  const I = window.__supabaseSyncInternals;
  if(!I || !I.supabaseRequest) return __enviarOriginal ? __enviarOriginal(opts) : {ok:false, erros:['sync interno indisponível']};
  const confirmar = opts.confirmar !== false;
  if(confirmar && !confirm('Enviar os dados deste PC para a nuvem (versão rápida: só o que mudou)?\n\nOs outros computadores recebem em "Carregar da nuvem" ou na sincronização automática.')) return {ok:false, cancelado:true};
  try{
    // 1) Monta as partes exatamente como a versão clássica
    const partes = []; const metaEntidades = {};
    I.SYNC_ENTIDADES.forEach(ent=>{
      let itens;
      if(ent.tipo==='objeto') itens = I.objetoParaItens(db[ent.campo]||{});
      else{
        let lista = Array.isArray(db[ent.campo]) ? db[ent.campo] : [];
        if(ent.limite) lista = lista.slice(0, ent.limite);
        itens = lista;
      }
      const packs = I.empacotarPartes(itens);
      metaEntidades[ent.campo] = {tipo:ent.tipo, partes:packs.length, total:itens.length};
      packs.forEach((pack,i)=>{
        partes.push({
          key: `${I.CLOUD_PART_PREFIX}${ent.campo}__p${i}`,
          data: ent.tipo==='objeto' ? {itens: pack} : {lista: pack}
        });
      });
    });
    const totalReg = Object.values(metaEntidades).reduce((s,e)=>s+e.total,0);
    const partesStr = partes.map(p=>({ key:p.key, dataStr: I.stringifyNuvem(p.data), data:p.data }));

    // 1b) Proteção anti-demonstração (idem versão clássica)
    if(!opts.forcar){
      try{
        const metaAtualRows = await I.supabaseRequest(`app_state?select=data&key=eq.${encodeURIComponent(I.CLOUD_META_KEY)}&limit=1`, {method:'GET'});
        if(metaAtualRows && metaAtualRows.length){
          const ant = metaAtualRows[0].data||{};
          const antTotal = ant.totalRegistros||0;
          const antMod = ((ant.entidades||{}).modulosDinamicos||{}).total||0;
          const localMod = (metaEntidades.modulosDinamicos||{}).total||0;
          if(antTotal>0 && (totalReg < antTotal*0.5 || (antMod>0 && localMod===0))){
            const certeza = (opts.automatico===true) ? false : confirm('⚠️ ATENÇÃO — POSSÍVEL ENGANO!\n\nA nuvem tem publicada uma base com ' + antTotal.toLocaleString('pt-BR') + ' registros, incluindo ' + antMod + ' tabelas migradas.\n\nOs dados DESTE computador têm só ' + totalReg.toLocaleString('pt-BR') + ' registros e ' + localMod + ' tabelas migradas — parecem ser os dados de DEMONSTRAÇÃO.\n\nEnviar agora SUBSTITUI a base completa da nuvem por estes dados menores.\n\n👉 Se este NÃO é o computador onde você importou os JSONs do sistema antigo, clique em CANCELAR.\n\nEnviar mesmo assim?');
            if(!certeza){
              upStatus('<span class="text-amber-700 font-bold">Envio CANCELADO pela proteção anti-demonstração.</span>');
              if(typeof toast==='function') toast('Envio cancelado — proteção anti-demonstração','info');
              return {ok:false, cancelado:true, protecao:true};
            }
          }
        }
      }catch(eProt){ /* sem meta legível → segue */ }
    }

    // 2) Calcula o que mudou de verdade
    const cache = partCacheLer();
    const diff = perfDiffPartes(partesStr, cache ? cache.hashes : null);
    const fila = partesStr.filter(p=>diff.mudadas.includes(p.key));
    const primeiraVez = !cache;
    upStatus(`<span class="text-slate-500">${primeiraVez?`Primeiro envio completo: ${fila.length} partes...`:`Enviando apenas o que mudou: <b>${fila.length}</b> de ${partes.length} partes...`}</span>`);

    // 3) Envia as partes mudadas EM PARALELO (lotes de 6)
    let enviadas = 0; const erros = [];
    await perfEmLotes(fila, 6, async (p)=>{
      await I.supabaseRequest('app_state?on_conflict=key', {
        method:'POST',
        headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
        body: I.stringifyNuvem({key:p.key, data:p.data, updated_at:new Date().toISOString()})
      });
      enviadas++;
      if(enviadas % 6 === 0 || enviadas===fila.length) upStatus(`<span class="text-slate-500">Enviando: ${enviadas}/${fila.length} partes...</span>`);
    });

    // 4) Apaga da nuvem as partes que deixaram de existir (base encolheu)
    await perfEmLotes(diff.removidas, 6, async (key)=>{
      await I.supabaseRequest(`app_state?key=eq.${encodeURIComponent(key)}`, {method:'DELETE', headers:{Prefer:'return=minimal'}});
    });

    if(erros.length){
      upStatus(`<span class="text-red-700 font-bold">Falha em ${erros.length} de ${fila.length} partes. Nada foi publicado. Tente novamente.</span><div class="text-[11px] text-red-600 mt-1">${escapeHtml(erros[0])}</div>`);
      if(typeof toast==='function') toast('Falha ao enviar algumas partes. Tente novamente.','error');
      return {ok:false, enviadas, erros};
    }

    // 5) Meta (sinal de publicação). Se NADA mudou e a publicação já existe na
    // nuvem, não bump: evita que os outros PCs recarreguem a base à toa.
    const atualizadoEm = new Date().toISOString();
    const nadaMudou = fila.length===0 && diff.removidas.length===0;
    let metaRemotaExiste = false;
    try{
      const confere0 = await I.supabaseRequest(`app_state?select=data&key=eq.${encodeURIComponent(I.CLOUD_META_KEY)}&limit=1`, {method:'GET'});
      metaRemotaExiste = !!(confere0 && confere0.length && (confere0[0].data||{}).entidades);
    }catch(eC0){ metaRemotaExiste = false; }
    if(nadaMudou && metaRemotaExiste){
      partCacheGravar(diff.atual);
      window.__ultimaMudancaLocal = 0;
      try{ localStorage.removeItem('digicopy_erp_dirty_local'); }catch(e){}
      upStatus(`<span class="text-emerald-700 font-bold">✅ Nuvem já estava em dia — nenhuma parte mudou desde o último envio.</span>`);
      if(typeof toast==='function') toast('Nuvem já estava em dia ✅','success');
      return {ok:true, partes:partes.length, enviadas:0, semMudanca:true, totalRegistros:totalReg};
    }
    await I.supabaseRequest('app_state?on_conflict=key', {
      method:'POST',
      headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body: I.stringifyNuvem({key:I.CLOUD_META_KEY, data:{versao:2, app:'digicopy_erp', atualizadoEm, entidades:metaEntidades, totalRegistros:totalReg}, updated_at:atualizadoEm})
    });
    try{
      const confere = await I.supabaseRequest(`app_state?select=data&key=eq.${encodeURIComponent(I.CLOUD_META_KEY)}&limit=1`, {method:'GET'});
      if(!confere || !confere.length || !(confere[0].data||{}).entidades) throw new Error('a publicação não apareceu na releitura');
    }catch(errConf){
      const mc = errConf?.message||String(errConf);
      upStatus(`<span class="text-red-700 font-bold">Não consegui CONFIRMAR a publicação (${escapeHtml(mc)}). Tente novamente.</span>`);
      if(typeof toast==='function') toast('Publicação não confirmada. Tente novamente.','error');
      return {ok:false, enviadas, erros:['verificacao: '+mc]};
    }

    // 6) Sucesso: grava o novo cache de hashes + marca em dia
    partCacheGravar(diff.atual);
    window.__syncAplicando = true;
    try{ db.meta = Object.assign({}, db.meta||{}, {origemNuvemAtualizadoEm:atualizadoEm, ultimoEnvioEm:atualizadoEm}); saveDB(); }
    finally{ window.__syncAplicando = false; }
    window.__ultimaMudancaLocal = 0;
    try{ localStorage.removeItem('digicopy_erp_dirty_local'); }catch(e){}
    const msgDiff = primeiraVez ? `${partes.length} partes enviadas` : (fila.length ? `${fila.length} parte(s) alterada(s) — rápido!` : 'nada mudou desde o último envio');
    upStatus(`<span class="text-emerald-700 font-bold">✅ PUBLICADO E VERIFICADO na nuvem às ${new Date().toLocaleString('pt-BR')}!</span><div class="text-[12px] text-emerald-700 mt-1">${totalReg.toLocaleString('pt-BR')} registros • ${msgDiff}.</div>`);
    if(typeof toast==='function') toast(fila.length?`Alterações enviadas (${fila.length} parte(s)) ✅`:'Nuvem já estava em dia ✅','success');
    return {ok:true, partes:partes.length, enviadas:fila.length, removidas:diff.removidas.length, totalRegistros:totalReg, verificado:true};
  }catch(err){
    const msg = err?.message||String(err);
    upStatus(`<span class="text-red-700 font-bold">Erro ao enviar: ${escapeHtml(msg)}</span>`);
    if(typeof toast==='function') toast('Erro ao enviar para nuvem: '+msg, 'error');
    return {ok:false, erros:[msg]};
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3) CARREGAMENTO PARALELO POR ENTIDADE — adeus statement timeout
// ═══════════════════════════════════════════════════════════════════════════
const __carregarOriginal = window.syncCarregarDaNuvem;
window.syncCarregarDaNuvem = async function(opts={}){
  const I = window.__supabaseSyncInternals;
  if(!I || !I.supabaseRequest) return __carregarOriginal ? __carregarOriginal(opts) : {ok:false, erros:['sync interno indisponível']};
  const confirmar = opts.confirmar !== false;
  if(confirmar && !confirm('Carregar os dados da nuvem neste PC?\n\n⚠️ OS DADOS LOCAIS ATUAIS SERÃO SUBSTITUÍDOS pelos dados da nuvem.')) return {ok:false, cancelado:true};
  try{
    upStatus('<span class="text-slate-500">Buscando dados na nuvem (modo rápido)...</span>');
    const metaRows = await I.supabaseRequest(`app_state?select=data,updated_at&key=eq.${encodeURIComponent(I.CLOUD_META_KEY)}&limit=1`, {method:'GET'});
    // Sem meta: delega ao fluxo clássico (recuperação por partes soltas / blob legado)
    if(!metaRows || !metaRows.length) return __carregarOriginal(opts);
    const meta = metaRows[0].data||{};
    const totalPartes = Object.values(meta.entidades||{}).reduce((s,e)=>s+(e.partes||0),0);
    if(!I.protecaoCargaMenor(meta.totalRegistros||0, ((meta.entidades||{}).modulosDinamicos||{}).total||0, opts.automatico===true)){
      upStatus('<span class="text-amber-700 font-bold">Carga CANCELADA pela proteção: a nuvem parecia ter dados menores do que este PC.</span>');
      return {ok:false, cancelado:true, protecao:true};
    }
    const entradas = Object.entries(meta.entidades||{});
    const novoDb = structuredClone(defaultData);
    const faltando = [];
    let baixadas = 0;
    // Vários SELECTs pequenos (1 por entidade), 4 em paralelo, com progresso
    const errosLoad = await perfEmLotes(entradas, 4, async ([campo, info])=>{
      upStatus(`<span class="text-slate-500">☁️ Baixando <b>${escapeHtml(campo)}</b> (${baixadas}/${entradas.length} módulos, ${totalPartes} partes)...</span>`);
      const likePrefix = I.CLOUD_PART_PREFIX + campo + '__p';
      const rows = await I.supabaseRequest(`app_state?select=key,data&key=like.${encodeURIComponent(likePrefix)}*&limit=500`, {method:'GET'});
      const mapa = {};
      (rows||[]).forEach(r=>{ mapa[r.key] = r.data; });
      const itens = [];
      for(let i=0;i<(info.partes||0);i++){
        const parte = mapa[`${likePrefix}${i}`];
        if(!parte){ faltando.push(`${campo} p${i}`); continue; }
        if(info.tipo==='objeto') itens.push(...(parte.itens||[]));
        else itens.push(...(parte.lista||[]));
      }
      novoDb[campo] = info.tipo==='objeto' ? I.itensParaObjeto(itens) : itens;
      baixadas++;
    });
    // Se algum módulo falhou no download, NÃO aplica: evita base incompleta
    if(errosLoad.length){
      upStatus(`<span class="text-red-700 font-bold">Falha ao baixar ${errosLoad.length} módulo(s). Nada foi alterado neste PC. Tente novamente.</span><div class="text-[11px] text-red-600 mt-1">${escapeHtml(errosLoad[0])}</div>`);
      if(typeof toast==='function') toast('Falha no carregamento. Tente novamente.','error');
      return {ok:false, erros:errosLoad};
    }
    novoDb.meta = Object.assign({}, novoDb.meta||{}, {sincronizadoEm:new Date().toISOString(), origemNuvemAtualizadoEm:meta.atualizadoEm||metaRows[0].updated_at});
    partCacheLimpar(); // a base mudou inteira: próximo envio republica o que for preciso
    window.__syncAplicando = true;
    try{ db = novoDb; saveDB(); if(window.saveDBAgora) saveDBAgora(); }
    finally{ window.__syncAplicando = false; }
    window.__ultimaMudancaLocal = 0;
    try{ localStorage.removeItem('digicopy_erp_dirty_local'); }catch(e){}
    const avisoParcial = faltando.length
      ? `<div class="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">⚠️ Algumas partes não foram encontradas (${faltando.length}). Refaça o "Enviar para nuvem" no PC de origem.</div>`
      : '';
    upStatus(`<span class="text-emerald-700 font-bold">✅ Carregado! ${(meta.totalRegistros||0).toLocaleString('pt-BR')} registros restaurados da nuvem. Recarregando...</span>${avisoParcial}`);
    if(typeof toast==='function') toast('Dados carregados da nuvem','success');
    if(opts.automatico === true) return {ok:true, rapido:true, faltando, semReload:true};
    setTimeout(()=>location.reload(), 900);
    return {ok:true, rapido:true, faltando};
  }catch(err){
    const msg = err?.message||String(err);
    upStatus(`<span class="text-red-700 font-bold">Erro ao carregar: ${escapeHtml(msg)}</span>`);
    if(typeof toast==='function') toast('Erro ao carregar da nuvem: '+msg, 'error');
    return {ok:false, erros:[msg]};
  }
};

console.log('PATCH performance v4.4.2 — saveDB incremental (por entidade, no app.js), envio incremental e carregamento paralelo; cache de partes separado por backend');
})();
