// ═══════════════════════════════════════════════════════════════════════════
// SYNC_CLIENT v4.4.2 — motor de sincronização em nuvem (montagem de partes,
// proteções, sincronização automática).
// O TRANSPORTE da nuvem agora é o GOOGLE FIREBASE (firebase_config.js +
// firebase_client.js). O backend antigo (Supabase) foi REMOVIDO na v4.4.2:
// não existem mais URL, chave ou SQL do Supabase neste sistema.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  // Transporte antigo REMOVIDO. Todas as chamadas à nuvem são feitas pelo
  // firebase_client.js, que substitui esta função no carregamento da página.
  // Esta função DELEGA para o transporte ativo (window.supabaseRequest):
  // com o Firebase configurado, tudo — inclusive os fluxos clássicos abaixo —
  // passa pelo Google. Sem configuração, o erro explica o que fazer.
  async function supabaseRequest(path, options){
    const ativo = window.supabaseRequest;
    if(typeof ativo==='function' && ativo!==supabaseRequest) return ativo(path, options);
    throw { status:0, data:null, message:'A nuvem antiga foi desativada — o sistema agora usa o Google Firebase. Recarregue a página; se o erro continuar, confira o firebase_config.js (guia no GUIA_FIREBASE.md).' };
  }
  window.supabaseRequest = supabaseRequest;

  window.testarNuvem = async function(showToast=true){
    // A nuvem agora é o Google Firebase: delega para o teste dele.
    if(typeof window.testarFirebase==='function') return window.testarFirebase(showToast);
    const msg='Nuvem Google (Firebase) não carregada. Recarregue a página; persistindo, confira o firebase_config.js.';
    const target = typeof document!=='undefined' ? document.getElementById('cloud-connection-status') : null;
    if(target) target.innerHTML = '<span class="text-amber-700 font-bold">'+msg+'</span>';
    if(showToast && typeof toast==='function') toast(msg,'info');
    return {ok:false, firebaseAusente:true};
  };

  window.nuvemInfo = function(){
    const cfg = window.FIREBASE_CONFIG || {};
    alert('Nuvem do sistema: GOOGLE FIREBASE (Firestore)\n\nProjeto: ' + (cfg.projectId || 'não configurado') + '\nBanco: São Paulo (southamerica-east1)\n\nO envio é automático e incremental — use "Enviar para nuvem" e "Carregar da nuvem" nos menus. Guia completo: GUIA_FIREBASE.md');
  };

  // Copia as REGRAS DEFINITIVAS do Firestore (etapa de segurança do guia).
  window.copiarRegrasFirebase = async function(){
    const regras = "rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /app_state/{doc} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}";
    try{
      await navigator.clipboard.writeText(regras);
      if(typeof toast==='function') toast('Regras do Firebase copiadas! Cole em Firestore Database → Regras e clique em Publicar.', 'success');
    }catch{
      const box=document.getElementById('supabase-schema-sql-box');
      if(box){ box.classList.remove('hidden'); box.value=regras; box.select(); }
      if(typeof toast==='function') toast('As regras apareceram na caixa para copiar manualmente.', 'info');
    }
  };


  const CLOUD_STATE_KEY = 'digicopy_erp_state_v1'; // legado (blob único) — só leitura de compatibilidade
  const CLOUD_META_KEY = 'digicopy_erp_v2_meta';
  const CLOUD_PART_PREFIX = 'digicopy_erp_v2__';
  const SYNC_MAX_ITENS_PARTE = 400;      // máx. registros por parte
  const SYNC_MAX_BYTES_PARTE = 1500000;  // máx. ~1,5 MB por parte (evita statement timeout)
  const SYNC_MAX_BYTES_ITEM  = 1200000;  // item único maior que isso é fatiado

  // Entidades sincronizadas entre PCs
  const SYNC_ENTIDADES = [
    {campo:'empresas', tipo:'array'},
    {campo:'usuarios', tipo:'array'},
    {campo:'clientes', tipo:'array'},
    {campo:'produtos', tipo:'array'},
    {campo:'equipamentos', tipo:'array'},
    {campo:'contratos', tipo:'array'},
    {campo:'parque', tipo:'array'},
    {campo:'leituras', tipo:'array'},
    {campo:'os', tipo:'array'},
    {campo:'vendas', tipo:'array'},
    {campo:'contasReceber', tipo:'array'},
    {campo:'contasPagar', tipo:'array'},
    {campo:'logs', tipo:'array', limite:1500},
    {campo:'modulosDinamicos', tipo:'objeto'},
    {campo:'tecnicos', tipo:'array'},
    {campo:'config', tipo:'objeto'},
  ];

  function setCloudSyncStatus(html){
    const el=document.getElementById('cloud-sync-status');
    if(el) el.innerHTML = html;
  }

  // O Postgres/jsonb REJEITA textos com escapes Unicode inválidos (surrogados soltos
  // U+D800–U+DFFF, byte nulo \u0000 e controles exóticos) — comum em dados legados do
  // Firebird exportados pelo DBeaver (ex.: "C:\UTIL", acentos corrompidos latin1).
  // Limpamos APENAS a cópia que vai para a nuvem (dados locais ficam intactos).
  function sanitizeTextoNuvem(str){
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code >= 0xD800 && code <= 0xDBFF){
        const next = (i + 1 < str.length) ? str.charCodeAt(i + 1) : 0;
        if (next >= 0xDC00 && next <= 0xDFFF){ out += str[i] + str[i + 1]; i++; } // par válido (emoji) — mantém
        else { out += '\uFFFD'; } // surrogado solto → �
      } else if (code >= 0xDC00 && code <= 0xDFFF){
        out += '\uFFFD';
      } else if (code === 0){
        out += ' '; // jsonb não aceita \u0000 em text
      } else if (code < 0x20 && code !== 9 && code !== 10 && code !== 13){
        out += ' '; // outros controles problemáticos
      } else {
        out += str[i];
      }
    }
    return out;
  }
  // Sanitiza o TEXTO JSON final — cobre valores E nomes de chaves
  // (JSON.stringify não deixa o replacer alterar nomes de chaves, então
  //  limpamos o texto pronto: surrogados soltos → U+FFFD e literal   → espaço).
  function sanitizeJsonTexto(txt){
    txt = txt.split(String.fromCharCode(92,117,48,48,48,48)).join(' '); // remove o escape literal do nulo (jsonb rejeita)
    // pares de surrogados ESCAPADOS validos (\uD83D\uDE42) viram caracteres reais (emoji)
    txt = txt.replace(/\\u([dD][89aAbB][0-9a-fA-F]{2})\\u([dD][cCdDeEfF][0-9a-fA-F]{2})/g, function(_m,a,b){ return String.fromCharCode(parseInt(a,16))+String.fromCharCode(parseInt(b,16)); });
    // qualquer escape de surrogado que SOBROU eh solto (\ud800 sozinho) -> U+FFFD
    txt = txt.replace(/\\u[dD][89a-fA-F][0-9a-fA-F]{2}/gi, '\uFFFD');
    let out='';
    for(let i=0;i<txt.length;i++){
      const code=txt.charCodeAt(i);
      if(code>=0xD800 && code<=0xDBFF){
        const next=(i+1<txt.length)?txt.charCodeAt(i+1):0;
        if(next>=0xDC00 && next<=0xDFFF){ out+=txt[i]+txt[i+1]; i++; } // par válido (emoji) — mantém
        else out+='\uFFFD';
      } else if(code>=0xDC00 && code<=0xDFFF){ out+='\uFFFD'; }
      else if(code===0){ out+=' '; } // NUL cru (paranoia)
      else out+=txt[i];
    }
    return out;
  }
  // JSON.stringify já higienizado para o Postgres (valores E chaves)
  function stringifyNuvem(valor){
    return sanitizeJsonTexto(JSON.stringify(valor, function(_k, v){ return typeof v === 'string' ? sanitizeTextoNuvem(v) : v; }));
  }

  // Objeto (modulosDinamicos/config) → lista de [chave,valor]; módulos gigantes são fatiados
  function objetoParaItens(obj){
    const itens=[];
    Object.entries(obj||{}).forEach(([k,v])=>{
      if(JSON.stringify([k,v]).length <= SYNC_MAX_BYTES_ITEM){ itens.push([k,v]); return; }
      if(v && Array.isArray(v.dados)){
        const fatias=[]; let cur=[]; let bytes=50;
        v.dados.forEach(r=>{
          const rb=JSON.stringify(r).length+1;
          if(bytes+rb > SYNC_MAX_BYTES_ITEM && cur.length){ fatias.push(cur); cur=[]; bytes=50; }
          cur.push(r); bytes+=rb;
        });
        fatias.push(cur);
        const total=fatias.length;
        fatias.forEach((f,i)=>itens.push([k, Object.assign({}, v, {dados:f, __parte:i, __partes:total})]));
      } else {
        itens.push([k,v]);
      }
    });
    return itens;
  }

  // Remonta o objeto a partir dos itens (agrupa fatias __parte/__partes)
  function itensParaObjeto(itens){
    const grupos={};
    itens.forEach(([k,v])=>{
      if(v && typeof v==='object' && v.__partes){
        if(!grupos[k]) grupos[k]={base:Object.assign({}, v, {dados:[]}), fatias:[]};
        grupos[k].fatias[v.__parte]=v.dados||[];
      } else {
        grupos[k]={simples:true, valor:v};
      }
    });
    const out={};
    Object.entries(grupos).forEach(([k,g])=>{
      if(g.simples){ out[k]=g.valor; return; }
      const dados=[];
      for(let i=0;i<(g.base.__partes||0);i++) dados.push(...(g.fatias[i]||[]));
      const rest=Object.assign({}, g.base); delete rest.__parte; delete rest.__partes;
      out[k]=Object.assign({}, rest, {dados});
    });
    return out;
  }

  // Empacota itens em partes (por quantidade E por tamanho)
  function empacotarPartes(itens){
    const partes=[]; let atual=[]; let bytes=2;
    itens.forEach(item=>{
      const b=JSON.stringify(item).length+1;
      if((atual.length >= SYNC_MAX_ITENS_PARTE || bytes+b > SYNC_MAX_BYTES_PARTE) && atual.length){ partes.push(atual); atual=[]; bytes=2; }
      atual.push(item); bytes+=b;
    });
    partes.push(atual);
    return partes;
  }

  // Envia TODOS os dados locais para a nuvem EM PARTES (evita statement timeout)
  window.syncEnviarParaNuvem = async function(opts={}){
    const confirmar = opts.confirmar !== false;
    if(confirmar && !confirm('Enviar TODOS os dados deste PC para a nuvem (Google Firebase)?\n\nOs outros computadores poderão carregar estes dados em "Carregar da nuvem".')) return {ok:false, cancelado:true};
    try{
      // 1) Monta as partes
      const partes=[]; const metaEntidades={};
      SYNC_ENTIDADES.forEach(ent=>{
        let itens;
        if(ent.tipo==='objeto'){
          itens = objetoParaItens(db[ent.campo]||{});
        } else {
          let lista = Array.isArray(db[ent.campo]) ? db[ent.campo] : [];
          if(ent.limite) lista = lista.slice(0, ent.limite);
          itens = lista;
        }
        const packs = empacotarPartes(itens);
        metaEntidades[ent.campo]={tipo:ent.tipo, partes:packs.length, total:itens.length};
        packs.forEach((pack,i)=>{
          partes.push({
            key:`${CLOUD_PART_PREFIX}${ent.campo}__p${i}`,
            data: ent.tipo==='objeto' ? {itens: pack} : {lista: pack}
          });
        });
      });
      const totalReg = Object.values(metaEntidades).reduce((s,e)=>s+e.total,0);

      // 1b) PROTEÇÃO anti-acidente: base pequena/demonstração NÃO sobrescreve uma base maior
      if(!opts.forcar){
        try{
          const metaAtualRows = await supabaseRequest(`app_state?select=data&key=eq.${encodeURIComponent(CLOUD_META_KEY)}&limit=1`, {method:'GET'});
          if(metaAtualRows && metaAtualRows.length){
            const ant = metaAtualRows[0].data||{};
            const antTotal = ant.totalRegistros||0;
            const antMod = ((ant.entidades||{}).modulosDinamicos||{}).total||0;
            const localMod = (metaEntidades.modulosDinamicos||{}).total||0;
            if(antTotal>0 && (totalReg < antTotal*0.5 || (antMod>0 && localMod===0))){
              const certeza = (opts.automatico===true) ? false : confirm('⚠️ ATENÇÃO — POSSÍVEL ENGANO!\n\nA nuvem tem publicada uma base com ' + antTotal.toLocaleString('pt-BR') + ' registros, incluindo ' + antMod + ' tabelas migradas (menu Migrados).\n\nOs dados DESTE computador têm só ' + totalReg.toLocaleString('pt-BR') + ' registros e ' + localMod + ' tabelas migradas — parecem ser os dados de DEMONSTRAÇÃO (ex.: 6 clientes de mentira).\n\nEnviar agora SUBSTITUI a base completa da nuvem por estes dados menores.\n\n👉 Se este NÃO é o computador onde você importou os JSONs do sistema antigo, clique em CANCELAR.\n\nEnviar mesmo assim?');
              if(!certeza){
                setCloudSyncStatus('<span class="text-amber-700 font-bold">Envio CANCELADO pela proteção: os dados deste PC pareciam ser de demonstração e iam substituir uma base maior da nuvem.</span>');
                if(typeof toast==='function') toast('Envio cancelado — proteção anti-demonstração','info');
                return {ok:false, cancelado:true, protecao:true};
              }
            }
          }
        }catch(eProt){ /* sem meta antiga legível → segue o envio normal */ }
      }

      // 2) Envia parte por parte (cada POST é pequeno → sem timeout)
      let enviadas=0; const erros=[];
      for(const p of partes){
        setCloudSyncStatus(`<span class="text-slate-500">Enviando parte ${enviadas+1} de ${partes.length}... <b>${escapeHtml(p.key.replace(CLOUD_PART_PREFIX,''))}</b></span>`);
        try{
          await supabaseRequest('app_state?on_conflict=key', {
            method:'POST',
            headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
            body:stringifyNuvem({key:p.key, data:p.data, updated_at:new Date().toISOString()})
          });
          enviadas++;
        }catch(err){
          erros.push(p.key+': '+(err?.message||err));
        }
      }

      // 3) Meta SÓ vai se tudo subiu (outros PCs nunca leem estado parcial)
      if(erros.length){
        setCloudSyncStatus(`<span class="text-red-700 font-bold">Falha em ${erros.length} de ${partes.length} partes. Nada foi publicado. Tente novamente.</span><div class="text-[11px] text-red-600 mt-1">${escapeHtml(erros[0])}</div>`);
        if(typeof toast==='function') toast('Falha ao enviar algumas partes. Tente novamente.','error');
        return {ok:false, enviadas, erros};
      }
      const atualizadoEm = new Date().toISOString();
      try{
        await supabaseRequest('app_state?on_conflict=key', {
          method:'POST',
          headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
          body:stringifyNuvem({key:CLOUD_META_KEY, data:{versao:2, app:'digicopy_erp', atualizadoEm, entidades:metaEntidades, totalRegistros:totalReg}, updated_at:atualizadoEm})
        });
      }catch(errMeta){
        const mm=errMeta?.message||String(errMeta);
        setCloudSyncStatus(`<span class="text-red-700 font-bold">As partes subiram, mas a confirmação (meta) falhou: ${escapeHtml(mm)}</span><div class="text-[12px] text-red-600 mt-1">Nada foi publicado ainda — clique em "Enviar para nuvem" novamente.</div>`);
        if(typeof toast==='function') toast('Falha ao confirmar publicação. Tente novamente.','error');
        return {ok:false, enviadas, erros:['meta: '+mm]};
      }
      // Prova real: relê a publicação da nuvem antes de comemorar
      try{
        const confere = await supabaseRequest(`app_state?select=data&key=eq.${encodeURIComponent(CLOUD_META_KEY)}&limit=1`, {method:'GET'});
        if(!confere || !confere.length || !(confere[0].data||{}).entidades) throw new Error('a publicação não apareceu na releitura');
      }catch(errConf){
        const mc=errConf?.message||String(errConf);
        setCloudSyncStatus(`<span class="text-red-700 font-bold">Não consegui CONFIRMAR a publicação na nuvem (${escapeHtml(mc)}). Clique em "Enviar para nuvem" novamente.</span>`);
        if(typeof toast==='function') toast('Publicação não confirmada. Tente novamente.','error');
        return {ok:false, enviadas, erros:['verificacao: '+mc]};
      }
      // Marca local: este PC está em dia com a nuvem (sem contar como "alteração suja")
      window.__syncAplicando=true; try{ db.meta=Object.assign({}, db.meta||{}, {origemNuvemAtualizadoEm:atualizadoEm, ultimoEnvioEm:atualizadoEm}); saveDB(); } finally{ window.__syncAplicando=false; }
      window.__ultimaMudancaLocal=0; try{ localStorage.removeItem('digicopy_erp_dirty_local'); }catch(eRM2){}
      setCloudSyncStatus(`<span class="text-emerald-700 font-bold">✅ PUBLICADO E VERIFICADO na nuvem! ${totalReg.toLocaleString('pt-BR')} registros em ${partes.length} partes, às ${new Date().toLocaleString('pt-BR')}.</span><div class="text-[12px] text-emerald-700 mt-1">Os outros PCs com sincronização automática recebem sozinhos em até ~1 minuto (ou clique neles em "Carregar da nuvem").</div>`);
      if(typeof toast==='function') toast('Dados enviados e verificados na nuvem ✅','success');
      return {ok:true, partes:partes.length, totalRegistros:totalReg, verificado:true};
    }catch(err){
      const msg=err?.message||String(err);
      setCloudSyncStatus(`<span class="text-red-700 font-bold">Erro ao enviar: ${escapeHtml(msg)}</span>`);
      if(typeof toast==='function') toast('Erro ao enviar para nuvem: '+msg, 'error');
      return {ok:false, erros:[msg]};
    }
  };

  // Conta registros aproximados de um estado (para as proteções)
  function contarTotalDb(d){
    let t=0;
    SYNC_ENTIDADES.forEach(e=>{
      const v=(d||{})[e.campo];
      if(Array.isArray(v)) t+=v.length;
      else if(v && typeof v==='object') t+=Object.keys(v).length;
    });
    return t;
  }
  // PROTEÇÃO: carregar da nuvem NÃO pode substituir uma base local maior por uma menor
  function protecaoCargaMenor(incTotal, incMod, automatico){
    const locTotal=contarTotalDb(db);
    const locMod=Object.keys((db||{}).modulosDinamicos||{}).length;
    if((incMod===0 && locMod>0) || (locTotal>50 && incTotal < locTotal*0.5)){
      if(automatico){ setCloudSyncStatus('<span class="text-amber-700 font-bold">☁️ Auto-sync pausada por segurança: a nuvem parecia ter dados menores que este PC.</span>'); return false; }
      return confirm('⚠️ ATENÇÃO — A NUVEM PARECE TER DADOS MENORES!\n\nA nuvem tem ~' + (incTotal||0).toLocaleString('pt-BR') + ' registros e ' + (incMod||0) + ' tabelas migradas.\nESTE computador tem ~' + locTotal.toLocaleString('pt-BR') + ' registros e ' + locMod + ' tabelas migradas.\n\nCarregar agora SUBSTITUI os dados deste PC por uma base menor (possivelmente de demonstração).\n\n👉 Se ESTE é o computador que tem seus dados completos, clique em CANCELAR.\n\nCarregar mesmo assim?');
    }
    return true;
  }

  // Expõe funções internas para o performance_patch (envio incremental/carregamento paralelo)
  window.__supabaseSyncInternals = {
    CLOUD_META_KEY, CLOUD_PART_PREFIX, CLOUD_STATE_KEY, SYNC_ENTIDADES,
    supabaseRequest, stringifyNuvem, objetoParaItens, empacotarPartes, itensParaObjeto,
    setCloudSyncStatus, protecaoCargaMenor, contarTotalDb
  };

  // Carrega o estado publicado (v2 em partes, com fallback para blob legado v1)
  window.syncCarregarDaNuvem = async function(opts={}){
    const confirmar = opts.confirmar !== false;
    if(confirmar && !confirm('Carregar os dados da nuvem neste PC?\n\n⚠️ OS DADOS LOCAIS ATUAIS SERÃO SUBSTITUÍDOS pelos dados da nuvem.')) return {ok:false, cancelado:true};
    try{
      setCloudSyncStatus('<span class="text-slate-500">Buscando dados na nuvem...</span>');
      const metaRows = await supabaseRequest(`app_state?select=data,updated_at&key=eq.${encodeURIComponent(CLOUD_META_KEY)}&limit=1`, {method:'GET'});

      if(!metaRows || !metaRows.length){
        // Sem a "etiqueta" de publicação (meta): tenta RECUPERAR pelas partes soltas
        // (cobre o caso de um envio antigo que falhou no meio — melhor 95% dos dados do que nada)
        setCloudSyncStatus('<span class="text-slate-500">Publicação não confirmada na nuvem — tentando recuperar pelas partes...</span>');
        const partRows = await supabaseRequest(`app_state?select=key,data&key=like.${encodeURIComponent(CLOUD_PART_PREFIX)}*&limit=1000`, {method:'GET'});
        if(partRows && partRows.length){
          const entidades={}; const mapaRec={};
          partRows.forEach(r=>{
            mapaRec[r.key]=r.data;
            const mm=r.key.slice(CLOUD_PART_PREFIX.length).match(/^(.*)__p(\d+)$/);
            if(!mm) return;
            const campo=mm[1]; const idx=+mm[2];
            if(!entidades[campo]) entidades[campo]={max:-1, presente:{}};
            entidades[campo].max=Math.max(entidades[campo].max, idx);
            entidades[campo].presente[idx]=true;
          });
          const tipoDe=campo=>{ const e=SYNC_ENTIDADES.find(x=>x.campo===campo); return e?e.tipo:'array'; };
          const novoDbRec = structuredClone(defaultData);
          const faltandoRec=[];
          Object.entries(entidades).forEach(([campo,info])=>{
            const itens=[]; let faltou=false;
            for(let i=0;i<=info.max;i++){
              const parte=mapaRec[`${CLOUD_PART_PREFIX}${campo}__p${i}`];
              if(!parte){ faltou=true; continue; }
              if(tipoDe(campo)==='objeto') itens.push(...(parte.itens||[])); else itens.push(...(parte.lista||[]));
            }
            if(faltou) faltandoRec.push(campo);
            novoDbRec[campo] = tipoDe(campo)==='objeto' ? itensParaObjeto(itens) : itens;
          });
          novoDbRec.meta = Object.assign({}, novoDbRec.meta||{}, {sincronizadoEm:new Date().toISOString(), recuperadoSemMeta:true});
          if(!protecaoCargaMenor(contarTotalDb(novoDbRec), Object.keys(novoDbRec.modulosDinamicos||{}).length, opts.automatico===true)){
            setCloudSyncStatus('<span class="text-amber-700 font-bold">Carga CANCELADA pela proteção: a nuvem parecia ter dados menores do que este PC.</span>');
            return {ok:false, cancelado:true, protecao:true};
          }
          window.__syncAplicando=true; try{ db = novoDbRec; saveDB(); } finally{ window.__syncAplicando=false; }
          window.__ultimaMudancaLocal=0; try{ localStorage.removeItem('digicopy_erp_dirty_local'); }catch(eRM){}
          const avisoFalta = faltandoRec.length
            ? `<div class="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">⚠️ O último envio ficou incompleto: faltaram pedaços em <b>${faltandoRec.map(escapeHtml).join(', ')}</b>.<br>Carreguei tudo o que existia. Para completar 100%: no computador onde a importação foi feita, clique em <b>Enviar para nuvem</b> novamente.</div>`
            : '';
          setCloudSyncStatus(`<span class="text-emerald-700 font-bold">✅ Base recuperada da nuvem (modo recuperação). Recarregando...</span>${avisoFalta}`);
          if(typeof toast==='function') toast('Base recuperada da nuvem','success');
          setTimeout(()=>{
            if(faltandoRec.length){ try{ alert('Base recuperada!\n\nATENÇÃO: o último envio ficou incompleto — faltaram pedaços de: '+faltandoRec.join(', ')+'.\n\nPara completar 100%: abra o ERP no computador onde a importação foi feita e clique em "Enviar para nuvem" novamente.'); }catch(e){} }
            location.reload();
          }, faltandoRec.length ? 2600 : 1200);
          return {ok:true, recuperacao:true, faltando:faltandoRec};
        }
        // Fallback final: blob único legado
        const rows = await supabaseRequest(`app_state?select=data,updated_at&key=eq.${encodeURIComponent(CLOUD_STATE_KEY)}&limit=1`, {method:'GET'});
        if(!rows || !rows.length){
          setCloudSyncStatus('<span class="text-amber-700 font-bold">Ainda não há dados na nuvem. Em outro PC, use "Enviar para nuvem" primeiro.</span>');
          if(typeof toast==='function') toast('Nenhum dado encontrado na nuvem','info');
          return {ok:false, vazio:true};
        }
        if(!protecaoCargaMenor(contarTotalDb(rows[0].data), Object.keys((rows[0].data||{}).modulosDinamicos||{}).length, opts.automatico===true)){
          setCloudSyncStatus('<span class="text-amber-700 font-bold">Carga CANCELADA pela proteção: o backup antigo parecia menor do que os dados deste PC.</span>');
          return {ok:false, cancelado:true, protecao:true};
        }
        window.__syncAplicando=true; try{ db = rows[0].data; saveDB(); } finally{ window.__syncAplicando=false; }
        window.__ultimaMudancaLocal=0; try{ localStorage.removeItem('digicopy_erp_dirty_local'); }catch(eRM){}
        setCloudSyncStatus(`<span class="text-emerald-700 font-bold">Base carregada da nuvem (formato antigo). Atualizada em ${new Date(rows[0].updated_at).toLocaleString('pt-BR')}.</span><div class="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">⚠️ Este é um backup ANTIGO e pode estar incompleto. No computador onde a importação foi feita, clique em <b>Enviar para nuvem</b> para publicar a base completa.</div>`);
        if(typeof toast==='function') toast('Dados carregados da nuvem (formato antigo)','success');
        setTimeout(()=>location.reload(),900);
        return {ok:true, legado:true};
      }

      const meta = metaRows[0].data;
      const totalPartes = Object.values(meta.entidades||{}).reduce((s,e)=>s+(e.partes||0),0);
      if(!protecaoCargaMenor(meta.totalRegistros||0, ((meta.entidades||{}).modulosDinamicos||{}).total||0, opts.automatico===true)){
        setCloudSyncStatus('<span class="text-amber-700 font-bold">Carga CANCELADA pela proteção: a nuvem parecia ter dados menores do que este PC.</span>');
        return {ok:false, cancelado:true, protecao:true};
      }
      setCloudSyncStatus(`<span class="text-slate-500">Baixando ${totalPartes} partes (${(meta.totalRegistros||0).toLocaleString('pt-BR')} registros)...</span>`);
      const rows = await supabaseRequest(`app_state?select=key,data&key=like.${encodeURIComponent(CLOUD_PART_PREFIX)}*&limit=1000`, {method:'GET'});
      const mapa={};
      (rows||[]).forEach(r=>{ mapa[r.key]=r.data; });

      const novoDb = structuredClone(defaultData);
      const faltando=[];
      Object.entries(meta.entidades||{}).forEach(([campo,info])=>{
        const itens=[];
        for(let i=0;i<(info.partes||0);i++){
          const parte = mapa[`${CLOUD_PART_PREFIX}${campo}__p${i}`];
          if(!parte){ faltando.push(`${campo} p${i}`); continue; } // tolerante: carrega o que existe
          if(info.tipo==='objeto') itens.push(...(parte.itens||[]));
          else itens.push(...(parte.lista||[]));
        }
        novoDb[campo] = info.tipo==='objeto' ? itensParaObjeto(itens) : itens;
      });
      novoDb.meta = Object.assign({}, novoDb.meta||{}, {sincronizadoEm:new Date().toISOString(), origemNuvemAtualizadoEm:meta.atualizadoEm||metaRows[0].updated_at});
      window.__syncAplicando=true; try{ db = novoDb; saveDB(); } finally{ window.__syncAplicando=false; }
      window.__ultimaMudancaLocal=0; try{ localStorage.removeItem('digicopy_erp_dirty_local'); }catch(eRM){}
      const avisoParcial = faltando.length
        ? `<div class="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">⚠️ Algumas partes não foram encontradas (${faltando.length} — ex.: ${faltando.slice(0,4).map(escapeHtml).join(', ')}). Os dados afetados podem vir incompletos. Refaça o "Enviar para nuvem" no PC de origem.</div>`
        : '';
      setCloudSyncStatus(`<span class="text-emerald-700 font-bold">✅ Carregado! ${(meta.totalRegistros||0).toLocaleString('pt-BR')} registros restaurados da nuvem (enviados em ${new Date(meta.atualizadoEm||metaRows[0].updated_at).toLocaleString('pt-BR')}). Recarregando...</span>${avisoParcial}`);
      if(typeof toast==='function') toast('Dados carregados da nuvem','success');
      setTimeout(()=>location.reload(),900);
      return {ok:true};
    }catch(err){
      const msg=err?.message||String(err);
      setCloudSyncStatus(`<span class="text-red-700 font-bold">Erro ao carregar: ${escapeHtml(msg)}</span>`);
      if(typeof toast==='function') toast('Erro ao carregar da nuvem: '+msg, 'error');
      return {ok:false, erros:[msg]};
    }
  };

  window.enviarDadosLocaisParaNuvem = function(){ return window.syncEnviarParaNuvem({confirmar:true}); };
  window.carregarDadosDaNuvem = function(){ return window.syncCarregarDaNuvem({confirmar:true}); };

  window.verificarBaseNaNuvem = async function(){
    setCloudSyncStatus('<span class="text-slate-500">Verificando dados compartilhados na nuvem...</span>');
    try{
      const metaRows = await supabaseRequest(`app_state?select=data,updated_at&key=eq.${encodeURIComponent(CLOUD_META_KEY)}&limit=1`, {method:'GET'});
      if(metaRows && metaRows.length){
        const meta=metaRows[0].data;
        setCloudSyncStatus(`<span class="text-emerald-700 font-bold">✅ Nuvem PUBLICADA: ${(meta.totalRegistros||0).toLocaleString('pt-BR')} registros. Última atualização: ${new Date(meta.atualizadoEm||metaRows[0].updated_at).toLocaleString('pt-BR')}.</span><div class="text-[12px] text-emerald-700 mt-1">Tudo certo — outros PCs podem clicar em "Carregar da nuvem".</div>`);
        return;
      }
      // Sem meta: mostra o retrato completo (partes soltas? blob antigo?)
      const partes = await supabaseRequest(`app_state?select=key&key=like.${encodeURIComponent(CLOUD_PART_PREFIX)}*&limit=1000`, {method:'GET'});
      const rows = await supabaseRequest(`app_state?select=updated_at&key=eq.${encodeURIComponent(CLOUD_STATE_KEY)}&limit=1`, {method:'GET'});
      const nPartes=(partes||[]).length;
      const temBlob=!!(rows && rows.length);
      if(nPartes){
        setCloudSyncStatus(`<span class="text-amber-700 font-bold">⚠️ Nuvem com envio INCOMPLETO: ${nPartes} partes soltas, sem a confirmação de publicação. Base antiga (backup): ${temBlob?'existe de '+new Date(rows[0].updated_at).toLocaleString('pt-BR'):'não existe'}.</span><div class="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1">Nenhum PC novo consegue carregar 100% ainda. <b>Solução:</b> no computador onde a importação foi feita, clique em <b>Enviar para nuvem</b> e aguarde a mensagem "PUBLICADO E VERIFICADO".</div>`);
      }else if(temBlob){
        setCloudSyncStatus(`<span class="text-amber-700 font-bold">⚠️ Existe apenas um backup ANTIGO na nuvem (de ${new Date(rows[0].updated_at).toLocaleString('pt-BR')}) — ele NÃO tem a base completa.</span><div class="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1">Para publicar a base completa: no computador onde a importação foi feita, clique em <b>Enviar para nuvem</b>.</div>`);
      }else{
        setCloudSyncStatus('<span class="text-amber-700 font-bold">Conectado, mas ainda não há dados enviados para a nuvem.</span>');
      }
    }catch(err){
      const msg=err?.message||String(err);
      setCloudSyncStatus(`<span class="text-red-700 font-bold">Erro ao verificar: ${escapeHtml(msg)}</span>`);
    }
  };

  function cloudMigrationHtml(){
    const projId = (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.projectId) || 'Google Firebase';
    return `
      <div class="neo-shell">
        <div class="neo-panel neo-float-in">
          <div class="neo-head">
            <div>
              <h3>Migração e nuvem</h3>
              <p>Google Firebase (Firestore) configurado para guardar os dados e sincronizar os computadores</p>
            </div>
            <div class="neo-actions">
              <button onclick="testarNuvem()" class="neo-btn primary"><i class="ph ph-plugs-connected"></i>Testar conexão</button>
              <button onclick="copiarRegrasFirebase()" class="neo-btn"><i class="ph ph-copy"></i>Copiar regras Firebase</button>
              <button onclick="nuvemInfo()" class="neo-btn"><i class="ph ph-info"></i>Dados</button>
              <button onclick="verificarBaseNaNuvem()" class="neo-btn"><i class="ph ph-database"></i>Ver base teste</button>
            </div>
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="neo-card"><p class="neo-label">Projeto (Google Firebase)</p><b class="text-[#0a1e8a] break-all">${projId}</b></div>
            <div class="neo-card"><p class="neo-label">Status</p><div id="cloud-connection-status" class="text-[13px] text-slate-600">Clique em testar conexão.</div></div>
            <div class="neo-card"><p class="neo-label">Banco</p><p class="text-[13px] text-slate-600">Firestore (Google) em São Paulo. Guia completo: <b>GUIA_FIREBASE.md</b>.</p></div>
          </div>
          <div class="px-4 pb-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div class="neo-card lg:col-span-2"><p class="neo-label">Sincronização de teste</p><div id="cloud-sync-status" class="text-[13px] text-slate-600">Área temporária para testar sincronização.</div></div>
            <div class="neo-card flex flex-col gap-2"><button onclick="enviarDadosLocaisParaNuvem()" class="neo-btn primary justify-center"><i class="ph ph-cloud-arrow-up"></i>Enviar base de teste</button><button onclick="carregarDadosDaNuvem()" class="neo-btn justify-center"><i class="ph ph-cloud-arrow-down"></i>Carregar base teste</button></div>
          </div>
          <div class="p-4 pt-0 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="neo-card"><b>1. Regras</b><p class="text-[12px] text-slate-500 mt-1">Clique em Copiar regras Firebase e cole em Firestore Database → Regras → Publicar.</p></div>
            <div class="neo-card"><b>2. Importação</b><p class="text-[12px] text-slate-500 mt-1">Tabelas detectadas: CLIENTES, PRODUTOS, VENDAS, ITENS_VENDA, LOCACAO, LEITURAS, EQUIPAMENTOS e financeiro.</p></div>
            <div class="neo-card"><b>3. Sistema online</b><p class="text-[12px] text-slate-500 mt-1">Dados sincronizados pela nuvem Google.</p></div>
            <div class="neo-card"><b>4. Tempo real</b><p class="text-[12px] text-slate-500 mt-1">Atualizar telas entre computadores.</p></div>
          </div>
          <div class="p-4 pt-0"><textarea id="supabase-schema-sql-box" class="neo-input hidden w-full !h-[180px] font-mono text-[11px] py-2"></textarea></div>
        </div>
      </div>`;
  }

  // renderBanco agora está no app.js com integração Firebird + Supabase
  // Mantendo apenas openCloudMigration para compatibilidade
  window.openCloudMigration = function(){
    if(typeof navigateTo === 'function') navigateTo('banco');
  };

  // ═══════════════════════════════════════════════════════════════════
  // SINCRONIZAÇÃO AUTOMÁTICA (build 3.10) — busca e envia sem apertar botão
  // ═══════════════════════════════════════════════════════════════════
  const SYNC_AUTO_LS='digicopy_erp_autosync';
  window.__syncAplicando = false;
  window.__ultimaMudancaLocal = 0;
  window.syncAutoLigado = function(){ try{ return localStorage.getItem(SYNC_AUTO_LS)!=='0'; }catch(e){ return true; } };
  window.syncAutoDefinir = function(on){
    try{ localStorage.setItem(SYNC_AUTO_LS, on?'1':'0'); }catch(e){}
    if(typeof toast==='function') toast(on?'☁️ Sincronização automática LIGADA neste PC':'Sincronização automática desligada neste PC','info');
    if(on) setTimeout(()=>{ try{ window.syncAutoChecar('ligar'); }catch(e){} }, 1500);
  };
  // Rastreia alterações locais embrulhando o saveDB global (as operações de sync
  // usam a trava __syncAplicando para não se marcarem como "alteração do usuário")
  try{
    const _saveSemRastreio = window.saveDB;
    if(typeof _saveSemRastreio==='function' && !window.__saveDBRastreado){
      window.saveDB = function(){
        _saveSemRastreio.apply(this, arguments);
        if(!window.__syncAplicando){
          window.__ultimaMudancaLocal = Date.now();
          try{ localStorage.setItem('digicopy_erp_dirty_local', new Date().toISOString()); }catch(e){}
        }
      };
      window.__saveDBRastreado = true;
    }
  }catch(eWrap){}

  let __autoBusy=false, __autoAvisos=0;
  window.syncAutoChecar = async function(motivo){
    if(!window.syncAutoLigado()) return {ok:false, desligado:true};
    if(__autoBusy) return {ok:false, ocupado:true};
    if(typeof db==='undefined' || !db) return {ok:false};
    // Nunca atrapalha quem está usando: nem com janela aberta nem logo após uma ação
    const mr=document.getElementById('modal-root');
    if(mr && !mr.classList.contains('hidden')) return {ok:false, modalAberto:true};
    const agora=Date.now();
    if(window.__ultimaMudancaLocal && (agora-window.__ultimaMudancaLocal)<45000) return {ok:false, emUso:true};
    __autoBusy=true;
    try{
      const metaRows=await supabaseRequest(`app_state?select=data,updated_at&key=eq.${encodeURIComponent(CLOUD_META_KEY)}&limit=1`, {method:'GET'});
      if(!metaRows || !metaRows.length) return {ok:false, vazio:true};
      const meta=metaRows[0].data||{};
      const cloudMs=Date.parse(meta.atualizadoEm || metaRows[0].updated_at || 0) || 0;
      if(!cloudMs) return {ok:false};
      const haveMs=Date.parse((db.meta && db.meta.origemNuvemAtualizadoEm) || 0) || 0;
      const envioMs=Date.parse((db.meta && db.meta.ultimoEnvioEm) || 0) || 0;
      const sujo=window.__ultimaMudancaLocal>0;
      if(cloudMs > haveMs+1000){
        // Nuvem mais nova. PC que NUNCA sincronizou: traz direto (com backup local).
        // PC já sincronizado com alterações locais pendentes: não sobrescreve — avisa.
        const nuncaSincronizei = (haveMs===0 && envioMs===0);
        if(sujo && !nuncaSincronizei){
          if(__autoAvisos<2){
            __autoAvisos++;
            setCloudSyncStatus('<span class="text-amber-700 font-bold">☁️ A nuvem tem uma versão mais nova, mas ESTE PC tem alterações que ainda não foram enviadas. Resolva aqui em Configurações → Sincronização (Enviar ou Carregar).</span>');
          }
          return {ok:false, conflito:true};
        }
        if(nuncaSincronizei){ try{ const bk={quando:new Date().toISOString(), vendas:(db.vendas||[]).filter(v=>v.criadoPor!=='migracao').slice(-300), logs:(db.logs||[]).slice(0,200)}; const t=JSON.stringify(bk); localStorage.setItem('digicopy_erp_backup_pre_sync', (window.LZUTF16?('LZ1:'+window.LZUTF16.compress(t)):t)); }catch(eB){} }
        setCloudSyncStatus('<span class="text-slate-500">☁️ Sincronização automática: chegaram dados novos da nuvem, atualizando este PC...</span>');
        if(typeof toast==='function') toast('☁️ Chegaram dados novos da nuvem — atualizando este PC','info');
        return await window.syncCarregarDaNuvem({confirmar:false, automatico:true});
      }
      // Nuvem em dia: se mexi aqui depois do último envio e estou parado há 60s, envia sozinho
      if(sujo && window.__ultimaMudancaLocal > envioMs+2000 && (agora-window.__ultimaMudancaLocal)>60000){
        setCloudSyncStatus('<span class="text-slate-500">☁️ Sincronização automática: enviando suas alterações para a nuvem...</span>');
        const r=await window.syncEnviarParaNuvem({confirmar:false, automatico:true});
        if(r && r.ok && typeof toast==='function') toast('☁️ Alterações enviadas automaticamente','success');
        return r;
      }
      return {ok:true, semMudanca:true, motivo};
    }catch(err){
      return {ok:false, erros:[(err&&err.message)||String(err)]};
    }finally{
      __autoBusy=false;
    }
  };

  // Carrega a base corporativa antes do primeiro acesso quando este PC ainda não tem a base completa.
  function __carregarBaseInicial(){
    setTimeout(async()=>{
      try{
        const vazio=!db || !Array.isArray(db.empresas) || db.empresas.length<=1;
        const semModulos=!db || !db.modulosDinamicos || Object.keys(db.modulosDinamicos).length===0;
        if(vazio || semModulos) await window.syncCarregarDaNuvem({confirmar:false, automatico:true});
      }catch(e){}
    },1800);
  }
  // Disparadores: 6s após abrir, a cada 75s, e quando a internet volta
  function __agendarAutoSync(){ __carregarBaseInicial(); setTimeout(()=>{ try{ window.syncAutoChecar('abertura'); }catch(e){} }, 6000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', __agendarAutoSync);
  else __agendarAutoSync();
  setInterval(()=>{ try{ window.syncAutoChecar('timer'); }catch(e){} }, 75000);
  if(typeof window.addEventListener==='function') window.addEventListener('online', ()=>{ try{ window.syncAutoChecar('online'); }catch(e){} });
})();
