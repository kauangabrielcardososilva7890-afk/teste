/* =====================================================================
 * SYNC_REALTIME v1.0.0 — sincronização AUTOMÁTICA e bidirecional com MESCLA
 * =====================================================================
 * Substitui a sincronização manual ("Enviar tudo" / "Carregar tudo", que
 * SUBSTITUÍA a base inteira) por uma sincronização automática que:
 *
 *   1. RODA SOZINHA — sem clicar em botão. Local muda → sobe sozinho;
 *      outro PC muda → este PC recebe sozinho (a cada ~1,5s).
 *   2. JUNTA, NÃO SUBSTITUI — se dois PCs cadastrarem registros ao mesmo
 *      tempo, os DOIS aparecem (mesclagem por id). Edição do MESMO registro
 *      ao mesmo tempo = ganha a edição mais recente (por hora do servidor).
 *   3. PROPAGA EXCLUSÃO — apagar num PC apaga nos outros (lápide/tombstone).
 *   4. TEMPO DE CONFLITO é a HORA DO GOOGLE (servidor), não a do PC —
 *      relógio de cada máquina não importa.
 *
 * Backend: Google Firestore (REST), coleção "erp_rt", 1 documento por
 * registro. Auth anônima (a mesma chave do firebase_client.js).
 * ===================================================================== */
(function(){
  'use strict';
  if(typeof window==='undefined') return;

  var ARRAY_ENT = ['empresas','usuarios','clientes','produtos','equipamentos','contratos','parque','leituras','os','vendas','contasReceber','contasPagar','tecnicos','notificacoes'];
  var OBJ_ENT   = ['config','modulosDinamicos'];
  var COLL      = 'erp_rt';
  var AUTH_KEY  = 'digicopy_firebase_auth_v1';   // reaproveita o token anônimo
  var STATE_KEY = 'digicopy_rt_state_v1';
  var POLL_MS   = 1500;
  var PAGE_SIZE = 500;
  var TAM_MAX_REC = 850000; // ~850 KB por registro (limite Firestore 1 MiB)

  var cfg = window.FIREBASE_CONFIG;
  if(!cfg || !cfg.apiKey || !cfg.projectId){
    console.warn('[SYNC-RT] Firebase não configurado — sincronização automática DESLIGADA.');
    return;
  }
  var API_KEY = String(cfg.apiKey).trim();
  var PROJETO = String(cfg.projectId).trim();
  var BASE = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(PROJETO) + '/databases/(default)/documents';

  /* ---------------- util puro ---------------- */
  function hashStr(s){
    var h = 0x811c9dc5;
    for(var i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h>>>0).toString(36);
  }
  function hashRec(rec){
    var copy = rec;
    if(rec && typeof rec==='object' && '_rt' in rec){ copy = Object.assign({}, rec); delete copy._rt; }
    var s;
    try{ s = JSON.stringify(copy); }catch(e){ s = String(rec); }
    return hashStr(s);
  }
  // Normaliza um RFC3339 (UTC) p/ comparação lexicográfica CORRETA: padroniza
  // a fração de segundos em 9 dígitos (nanossegundos) — "…12.9Z" vs "…12.10Z"
  // deixam de dar errado como string pura.
  function tsKey(ts){
    if(!ts) return '';
    var s = String(ts);
    var m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/.exec(s);
    if(!m) return s;
    var frac = m[2] || '';
    while(frac.length < 9) frac += '0';
    if(frac.length > 9) frac = frac.slice(0, 9);
    return m[1] + '.' + frac + m[3];
  }
  function marcarTs(rec, ts){ if(rec && typeof rec==='object' && ts){ try{ rec._rt = ts; }catch(e){} } }

  /* ---------------- estado persistido ---------------- */
  var state = { cursor:null, snap:{} };
  function loadState(){
    try{
      var s = JSON.parse(localStorage.getItem(STATE_KEY)||'null');
      if(s && typeof s==='object'){ state.cursor = s.cursor || null; state.snap = (s.snap && typeof s.snap==='object') ? s.snap : {}; }
    }catch(e){}
  }
  function saveState(){
    try{ localStorage.setItem(STATE_KEY, JSON.stringify({ cursor:state.cursor, snap:state.snap })); }catch(e){}
  }

  /* ---------------- auth anônima (cache) ---------------- */
  var __authP = null;
  function authToken(){
    try{
      var s = null;
      try{ s = JSON.parse(localStorage.getItem(AUTH_KEY)||'null'); }catch(e){ s=null; }
      if(s && s.idToken && s.expira > Date.now()+60000) return Promise.resolve(s.idToken);
      if(__authP) return __authP;
      __authP = (async function(){
        if(s && s.refreshToken){
          try{
            var r = await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(API_KEY), {
              method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
              body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(s.refreshToken)
            });
            var j = await r.json().catch(function(){return null;});
            if(r.ok && j && j.id_token){
              var a = { idToken:j.id_token, refreshToken:j.refresh_token||s.refreshToken, expira:Date.now()+(parseInt(j.expires_in,10)||3600)*1000 };
              try{ localStorage.setItem(AUTH_KEY, JSON.stringify(a)); }catch(e){}
              return a.idToken;
            }
          }catch(e){}
        }
        var r2 = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+encodeURIComponent(API_KEY), {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ returnSecureToken:true })
        });
        var j2 = await r2.json().catch(function(){return null;});
        if(r2.ok && j2 && j2.idToken){
          var b = { idToken:j2.idToken, refreshToken:j2.refreshToken||'', expira:Date.now()+(parseInt(j2.expiresIn,10)||3600)*1000 };
          try{ localStorage.setItem(AUTH_KEY, JSON.stringify(b)); }catch(e){}
          return b.idToken;
        }
        return null;
      })();
      return __authP;
    }catch(e){ return Promise.resolve(null); }
  }

  /* ---------------- fetch com auth ---------------- */
  async function rtFetch(url, opts){
    var sep = url.indexOf('?')<0 ? '?' : '&';
    var authHeader = null;
    try{ var tk = await authToken(); if(tk) authHeader = 'Bearer '+tk; }catch(e){}
    var o = Object.assign({}, opts||{});
    if(authHeader) o.headers = Object.assign({}, o.headers||{}, { Authorization:authHeader });
    var resp = await fetch(url + sep + 'key=' + encodeURIComponent(API_KEY), o);
    var text = await resp.text();
    var data = null; try{ data = text ? JSON.parse(text) : null; }catch(e){ data = text; }
    if(!resp.ok){
      var msg = (data && data.error && data.error.message) || ('HTTP '+resp.status);
      if(resp.status===403) msg = 'Sem permissão no Firestore. Verifique as Regras (allow read, write: if request.auth != null).';
      throw { status:resp.status, message:msg };
    }
    return data;
  }

  /* ---------------- listar docs com ts > cursor ---------------- */
  async function rtListDesde(cursorTs, limit){
    var sq = {
      from:[{ collectionId: COLL }],
      orderBy:[{ field:{ fieldPath:'ts' }, direction:'ASCENDING' }],
      limit: limit || PAGE_SIZE
    };
    if(cursorTs){
      sq.where = { fieldFilter:{ field:{ fieldPath:'ts' }, op:'GREATER_THAN', value:{ timestampValue: cursorTs } } };
    }
    var resp = await rtFetch(BASE + ':runQuery', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ structuredQuery: sq }) });
    var docs = [];
    (resp||[]).forEach(function(it){ if(it && it.document) docs.push(it.document); });
    return docs;
  }

  /* ---------------- escrever 1 registro (commit + hora do servidor) ---------------- */
  async function rtWrite(docId, entidade, dados, tomb){
    var nome = BASE + '/' + COLL + '/' + encodeURIComponent(docId);
    var fields = { e:{ stringValue: entidade }, t:{ booleanValue: !!tomb } };
    if(!tomb && dados !== undefined && dados !== null){
      var json;
      try{ json = JSON.stringify(dados); }catch(e){ json = null; }
      if(json && json.length > TAM_MAX_REC) return null; // registro grande demais: pula
      fields.d = { stringValue: json || '' };
    }
    var write = {
      update: { name: nome, fields: fields },
      updateTransforms:[{ fieldPath:'ts', setToServerValue:'REQUEST_TIME' }]
    };
    var resp = await rtFetch(BASE + ':commit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ writes:[write] }) });
    var wr = (resp && resp.writeResults && resp.writeResults[0]) || {};
    var ts = wr.updateTime || null;
    // hora exata atribuída pelo servidor ao campo ts
    if(wr.transformResults && wr.transformResults[0] && wr.transformResults[0].timestampValue) ts = wr.transformResults[0].timestampValue;
    return ts;
  }

  /* ---------------- MESCLA (pura; muta db) ---------------- */
  function aplicarRemoto(ent, id, dados, tomb, ts){
    if(ARRAY_ENT.indexOf(ent) >= 0){
      var arr = db[ent];
      if(!Array.isArray(arr)) return false;
      var idx = -1;
      for(var i=0;i<arr.length;i++){ if(arr[i] && arr[i].id === id){ idx = i; break; } }
      if(tomb){
        if(idx >= 0){
          var l = arr[idx];
          if(l && l._rt && ts && tsKey(l._rt) > tsKey(ts)) return false; // editado localmente DEPOIS do apagar remoto
          arr.splice(idx,1);
          delete state.snap[ent+'|'+id];
          return true;
        }
        return false;
      }
      if(!dados) return false;
      if(idx < 0){
        marcarTs(dados, ts);
        arr.push(dados);
        state.snap[ent+'|'+id] = hashRec(dados);
        return true;
      }
      var local = arr[idx];
      if(local && local._rt && ts && tsKey(local._rt) >= tsKey(ts)){
        state.snap[ent+'|'+id] = hashRec(local); // local mais novo: mantém
        return false;
      }
      marcarTs(dados, ts || (local && local._rt));
      arr[idx] = dados;
      state.snap[ent+'|'+id] = hashRec(dados);
      return true;
    }
    // objeto: último a salvar vence (comparando a hora do servidor)
    if(tomb) return false;
    if(!dados) return false;
    var atual = db[ent];
    if(atual && atual._rt && ts && tsKey(atual._rt) >= tsKey(ts)){
      state.snap[ent+'|'+ent] = hashRec(atual);
      return false;
    }
    marcarTs(dados, ts || (atual && atual._rt));
    db[ent] = dados;
    state.snap[ent+'|'+ent] = hashRec(dados);
    return true;
  }

  /* ---------------- PUSH: sobe só o que mudou localmente ---------------- */
  async function pushMudancas(){
    if(typeof db === 'undefined') return;
    // arrays
    for(var a=0;a<ARRAY_ENT.length;a++){
      var ent = ARRAY_ENT[a];
      var arr = db[ent];
      if(!Array.isArray(arr)) continue;
      var vistos = {};
      for(var i=0;i<arr.length;i++){
        var rec = arr[i];
        if(!rec || !rec.id) continue;
        vistos[rec.id] = true;
        var key = ent+'|'+rec.id;
        var h = hashRec(rec);
        if(state.snap[key] === h) continue;
        try{
          var ts = await rtWrite(rec.id, ent, rec, false);
          if(ts){ marcarTs(rec, ts); }
          state.snap[key] = h;
        }catch(e){ /* tenta na próxima rodada */ }
      }
      // exclusões: ids no snapshot que sumiram do array
      for(var key in state.snap){
        if(state.snap[key] === '~') continue;
        var sep = key.indexOf('|');
        if(sep < 0) continue;
        var kEnt = key.slice(0, sep);
        if(kEnt !== ent) continue;
        var kId = key.slice(sep+1);
        if(vistos[kId]) continue;
        try{ await rtWrite(kId, ent, null, true); state.snap[key] = '~'; }catch(e){}
      }
    }
    // objetos
    for(var o=0;o<OBJ_ENT.length;o++){
      var oe = OBJ_ENT[o];
      var obj = db[oe];
      if(!obj || typeof obj !== 'object') continue;
      var okey = oe+'|'+oe;
      var oh = hashRec(obj);
      if(state.snap[okey] === oh) continue;
      try{
        var ots = await rtWrite(oe, oe, obj, false);
        if(ots){ marcarTs(obj, ots); }
        state.snap[okey] = oh;
      }catch(e){}
    }
  }

  /* ---------------- PULL: baixa o que mudou na nuvem e mescla ---------------- */
  async function pullMudancas(){
    if(typeof db === 'undefined') return false;
    var mudou = false;
    var cursor = state.cursor || null;
    for(var pagina=0; pagina<200; pagina++){
      var docs = await rtListDesde(cursor);
      if(!docs || !docs.length) break;
      var maxTsStr = cursor;
      var maxTsN = cursor ? tsKey(cursor) : '';
      for(var i=0;i<docs.length;i++){
        var doc = docs[i];
        var f = (doc && doc.fields) || {};
        var e = f.e && f.e.stringValue;
        var t = !!(f.t && f.t.booleanValue);
        var tsRaw = (f.ts && f.ts.timestampValue) || doc.updateTime || null;
        var id = String(doc.name||'').split('/').pop();
        var dados = null;
        if(!t && f.d && f.d.stringValue){ try{ dados = JSON.parse(f.d.stringValue); }catch(err){ dados = null; } }
        if(!e) continue;
        if(tsKey(tsRaw) > maxTsN){ maxTsN = tsKey(tsRaw); maxTsStr = tsRaw; }
        if(aplicarRemoto(e, id, dados, t, tsRaw)) mudou = true;
      }
      cursor = maxTsStr;
      if(docs.length < PAGE_SIZE) break;
    }
    if(cursor && (!state.cursor || tsKey(cursor) > tsKey(state.cursor))){ state.cursor = cursor; saveState(); }
    return mudou;
  }

  /* ---------------- bootstrap: limpa demo antes da 1ª carga ---------------- */
  function ehDemo(){
    try{
      return (db.empresas.length === 1) && db.empresas[0] &&
        (db.empresas[0].cnpjDigits === '12345678000190' || db.empresas[0].cnpj === '12.345.678/0001-90');
    }catch(e){ return false; }
  }
  function limparDemo(){
    ARRAY_ENT.forEach(function(k){ if(Array.isArray(db[k])) db[k] = []; });
    db.modulosDinamicos = {};
    db.config = { empresa:{} };
    try{ db.logs = []; }catch(e){}
    state.snap = {};
    state.cursor = null;
  }

  /* ---------------- refresh da tela ---------------- */
  var viewAtual = 'dashboard';
  function refreshUI(){
    if(typeof getSession !== 'function') return;
    if(!getSession()) return;               // sem login: não há tela pra redesenhar
    if(document.activeElement && /INPUT|TEXTAREA|SELECT/i.test(document.activeElement.tagName||'')) return; // usuário digitando
    if(typeof navigateTo === 'function'){ try{ navigateTo(viewAtual); }catch(e){} }
  }

  /* ---------------- nuvem tem dados? (checagem leve) ---------------- */
  async function nuvemTemDados(){
    try{ var docs = await rtListDesde(null, 1); return !!(docs && docs.length); }
    catch(e){ return false; }
  }

  /* ---------------- loop ---------------- */
  var ocupado = false;
  var __dirty = false;
  var __eraDemo = false;
  var __reloaded = false;
  async function tick(){
    if(ocupado) return;
    ocupado = true;
    try{
      if(ehDemo()){
        // PC novo (só tem a demo): só limpa a demo se a nuvem tiver dados reais
        if(await nuvemTemDados()){
          limparDemo(); __eraDemo = true;
          try{ saveDB(); }catch(e){}
        }
      }
      if(__dirty || !state.cursor){ await pushMudancas(); __dirty = false; }
      var m = await pullMudancas();
      if(m){ try{ saveDB(); }catch(e){} refreshUI(); }
      // veio de demo e os dados reais acabaram de chegar: recarrega 1x pra
      // a tela de login mostrar a empresa real
      if(__eraDemo && !__reloaded && db.empresas && db.empresas.length){
        if(typeof getSession === 'function' && !getSession()){
          __reloaded = true;
          setTimeout(function(){ try{ location.reload(); }catch(e){} }, 500);
        }
      }
    }catch(e){ /* rede fora etc.: tenta de novo na próxima */ }
    finally{ ocupado = false; }
  }

  /* ---------------- agenda push rápido ao salvar ---------------- */
  var __pushTimer = null;
  function agendaPush(){ __dirty = true; if(__pushTimer) return; __pushTimer = setTimeout(function(){ __pushTimer = null; tick(); }, 450); }

  function iniciar(){
    loadState();
    // desliga o auto-carregar ANTIGO (full-replace) para não conflitar
    try{ sessionStorage.setItem('digicopy_auto_load_try_v4939','1'); }catch(e){}
    // rastreia a view atual para redesenhar sem piscar
    if(typeof window.navigateTo === 'function' && !window.navigateTo.__rtTrack){
      var _nav = window.navigateTo;
      window.navigateTo = function(v){ viewAtual = v; return _nav.apply(this, arguments); };
      window.navigateTo.__rtTrack = true;
    }
    // push rápido quando o sistema salvar
    if(typeof window.saveDB === 'function' && !window.saveDB.__rtWrapped){
      var _sv = window.saveDB;
      window.saveDB = function(){ var r = _sv.apply(this, arguments); agendaPush(); return r; };
      window.saveDB.__rtWrapped = true;
    }
    setTimeout(function(){ tick(); }, 600);     // bootstrap + 1ª mescla
    setInterval(function(){ tick(); }, POLL_MS); // manutenção automática
    console.log('[SYNC-RT] sincronização automática ATIVA — mescla '+ARRAY_ENT.length+' entidades + '+OBJ_ENT.length+' objetos.');
  }

  // expõe internos (testes / diagnóstico)
  window.__syncRtInternals = {
    ARRAY_ENT:ARRAY_ENT, OBJ_ENT:OBJ_ENT, COLL:COLL, STATE_KEY:STATE_KEY,
    hashStr:hashStr, hashRec:hashRec, tsKey:tsKey, aplicarRemoto:aplicarRemoto,
    ehDemo:ehDemo, limparDemo:limparDemo, pushMudancas:pushMudancas, pullMudancas:pullMudancas
  };

  if(window.DIGI_MODO_LEVE) return;

  function boot(){ if(typeof db !== 'undefined'){ iniciar(); } else { setTimeout(boot, 300); } }
  if(typeof document === 'undefined'){ return; }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
