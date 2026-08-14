// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE_CLIENT v4.4.0 — nuvem pelo Google Firebase (Firestore)
//
// Como funciona sem mudar o resto do sistema:
//  • Todo o envio/carregamento da nuvem passa por uma função interna chamada
//    "supabaseRequest" (estilo PostgREST: 'app_state?key=eq.XXX', 'like.PFX*'…).
//  • Este arquivo substitui APENAS esse transporte por chamadas à REST API do
//    Firestore (Google). O restante (envio incremental, proteções, telas) nem
//    percebe a troca.
//  • A mesma coleção "app_state" (documentos {key, data}) é mantida, então o
//    formato dos dados na nuvem é idêntico — dá até para alternar entre
//    Supabase e Firebase republicando tudo.
//  • Diferença importante: o Firestore limita cada documento a 1 MiB e as
//    partes do sistema chegam a ~1,5 MB. Documentos grandes são divididos
//    automaticamente em pedaços ("chunks") de até ~600 mil caracteres e
//    remontados na leitura — tudo transparente.
//  • Se window.FIREBASE_CONFIG não estiver preenchida, nada muda: a nuvem
//    continua sendo o Supabase.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

/* FIRE_PURE_START */
const FIRE_CHUNK_TAM = 600000; // caracteres por pedaço (limite Firestore: 1 MiB/doc)

function fireChunkKey(key, i){ return key + '__c' + String(i).padStart(4,'0'); }
function fireEhChunkNome(nome){ return /__c\d{4}$/.test(String(nome||'').split('/').pop()||''); }
function fireChunkString(str, tam){
  tam = tam || FIRE_CHUNK_TAM;
  str = String(str==null?'':str);
  if(str.length <= tam) return [str];
  const out=[];
  for(let i=0;i<str.length;i+=tam) out.push(str.slice(i,i+tam));
  return out;
}
// Interpreta os caminhos estilo PostgREST que o sistema usa
// Ex.: app_state?select=key,data&key=eq.abc&limit=1  |  key=like.prefixo*  |  key=in.(a,b)
function fireParseQuery(path){
  const s = String(path||'').replace(/^\/+/, '');
  const qm = s.indexOf('?');
  const table = qm<0 ? s : s.slice(0,qm);
  const params = new URLSearchParams(qm<0 ? '' : s.slice(qm+1));
  const out = { table, select:null, limit:null, onConflict:null, filtros:[] };
  const sel = params.get('select'); if(sel) out.select = sel.split(',');
  const lim = params.get('limit'); if(lim) out.limit = parseInt(lim,10)||null;
  const onc = params.get('on_conflict'); if(onc) out.onConflict = onc;
  const keyF = params.get('key');
  if(keyF){
    if(keyF.indexOf('eq.')===0) out.filtros.push({op:'eq', value:keyF.slice(3)});
    else if(keyF.indexOf('like.')===0){
      const v = keyF.slice(5).replace(/\*+$/,''); // curinga do PostgREST
      out.filtros.push({op:'prefixo', value:v});
    }
    else if(keyF.indexOf('in.(')===0 && keyF.slice(-1)===')'){
      const lista = keyF.slice(4,-1).split(',').map(x=>x.replace(/^"|"$/g,'')).filter(Boolean);
      out.filtros.push({op:'in', value:lista});
    }
  }
  return out;
}
// Extrai os campos de um documento Firestore em formato simples
function fireDocCampos(doc){
  const f = (doc && doc.fields) || {};
  const sv = n => (f[n]!=null && f[n].stringValue!=null) ? f[n].stringValue : '';
  const iv = n => (f[n]!=null && f[n].integerValue!=null) ? (parseInt(f[n].integerValue,10)||0) : 0;
  return {
    nome: (doc && doc.name) || '',
    key: sv('key'),
    dataStr: sv('data'),
    updated_at: sv('updated_at'),
    nChunks: iv('n'),
    chunked: sv('chunked') === '1'
  };
}
// Monta os writes (upsert) de um commit para as linhas lógicas {key, data, updated_at},
// dividindo documentos grandes em pedaços. O documento-base SEMPRE existe: é ele
// que marca a existência lógica da chave (pedaços órfãos são ignorados na leitura).
function fireMontarWrites(baseUrl, rows){
  const writes=[];
  (rows||[]).forEach(r=>{
    if(!r || !r.key) return;
    const dataStr = typeof r.data === 'string' ? r.data : JSON.stringify(r.data==null?null:r.data);
    const upd = r.updated_at || new Date().toISOString();
    const chunks = fireChunkString(dataStr);
    const baseNome = baseUrl + '/app_state/' + encodeURIComponent(r.key);
    if(chunks.length===1){
      writes.push({update:{name:baseNome, fields:{
        key:{stringValue:r.key}, data:{stringValue:dataStr},
        chunked:{stringValue:'0'}, n:{integerValue:'0'}, updated_at:{stringValue:upd}
      }}});
    }else{
      writes.push({update:{name:baseNome, fields:{
        key:{stringValue:r.key}, data:{stringValue:''},
        chunked:{stringValue:'1'}, n:{integerValue:String(chunks.length)}, updated_at:{stringValue:upd}
      }}});
      chunks.forEach((c,i)=>{
        writes.push({update:{name: baseUrl + '/app_state/' + encodeURIComponent(fireChunkKey(r.key,i)), fields:{
          key:{stringValue:r.key}, data:{stringValue:c},
          chunked:{stringValue:'0'}, n:{integerValue:String(i)}, updated_at:{stringValue:upd}
        }}});
      });
    }
  });
  return writes;
}
// Remonta linhas lógicas {key, data, updated_at} a partir de documentos crus
// (base + pedaços). Pedaços órfãos (sem documento-base) são ignorados.
function fireAgruparDocs(docs){
  const grupos = {};
  (docs||[]).forEach(d=>{
    const c = fireDocCampos(d);
    if(!c.key) return;
    if(!grupos[c.key]) grupos[c.key] = {base:null, chunks:[]};
    if(fireEhChunkNome(c.nome)) grupos[c.key].chunks.push(c);
    else grupos[c.key].base = c;
  });
  const linhas=[];
  Object.keys(grupos).forEach(k=>{
    const g = grupos[k];
    if(!g.base) return; // sem documento-base: a chave não existe logicamente
    let dataStr = g.base.dataStr;
    if(g.base.chunked && g.base.nChunks>0){
      const ord = g.chunks.slice().sort((a,b)=>a.nChunks-b.nChunks);
      if(ord.length >= g.base.nChunks) dataStr = ord.slice(0,g.base.nChunks).map(c=>c.dataStr).join('');
    }
    let data=null; try{ data = JSON.parse(dataStr); }catch(eJ){ data=null; }
    linhas.push({key:k, data, updated_at:g.base.updated_at});
  });
  return linhas;
}
function fireChunkCommits(writes, maxPorCommit){
  maxPorCommit = maxPorCommit || 250;
  const out=[];
  for(let i=0;i<writes.length;i+=maxPorCommit) out.push(writes.slice(i,i+maxPorCommit));
  return out;
}
/* FIRE_PURE_END */
window.__firePure = { FIRE_CHUNK_TAM, fireChunkKey, fireEhChunkNome, fireChunkString, fireParseQuery, fireDocCampos, fireMontarWrites, fireAgruparDocs, fireChunkCommits };

// ── Ativação: só troca a nuvem se a configuração estiver preenchida ──
function fireConfigValida(cfg){
  if(!cfg) return false;
  const invalido = v => !v || /COLE_AQUI/i.test(String(v));
  return !invalido(cfg.apiKey) && !invalido(cfg.projectId);
}
if(typeof window==='undefined') return; // fora do navegador: só os helpers puros
if(!fireConfigValida(window.FIREBASE_CONFIG)){
  console.warn('Firebase não configurado — a nuvem está DESATIVADA neste PC (a nuvem antiga foi removida na v4.4.2). Preencha firebase_config.js com os dados do seu projeto Firebase.');
  return;
}
const API_KEY = String(window.FIREBASE_CONFIG.apiKey).trim();
const PROJETO = String(window.FIREBASE_CONFIG.projectId).trim();
const RES_BASE = 'projects/' + encodeURIComponent(PROJETO) + '/databases/(default)/documents';
const BASE = 'https://firestore.googleapis.com/v1/' + RES_BASE;
const COLL = 'app_state';

// ── Autenticação anônima automática (segurança definitiva) ──
// Se o provedor "Anônimo" estiver ativo no console (Authentication → Método
// de login), todas as chamadas levam um token de usuário — isso permite usar
// a regra definitiva "allow read, write: if request.auth != null" que NÃO
// expira (diferente do modo de teste, que expira em 30 dias). Se o provedor
// estiver desativado, segue sem token (funciona enquanto o modo teste valer).
const AUTH_CACHE_KEY = 'digicopy_firebase_auth_v1';
let __authEmAndamento = null;
async function lerJsonSeguro(r){
  try{ return await r.json(); }catch(e){ try{ const t=await r.text(); return t?JSON.parse(t):null; }catch(e2){ return null; } }
}
async function authGarantirToken(){
  try{
    // 1) token em cache ainda válido?
    let salvo=null;
    try{ salvo=JSON.parse(localStorage.getItem(AUTH_CACHE_KEY)||'null'); }catch(eL){ salvo=null; }
    if(salvo && salvo.idToken && salvo.expira > Date.now()+60000) return salvo.idToken;
    if(__authEmAndamento) return __authEmAndamento;
    __authEmAndamento = (async()=>{
      // 2) renova com o refresh_token, se houver
      if(salvo && salvo.refreshToken){
        try{
          const r = await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(API_KEY), {
            method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
            body:'grant_type=refresh_token&refresh_token='+encodeURIComponent(salvo.refreshToken) });
          const j = await lerJsonSeguro(r);
          if(r.ok && j && j.id_token){
            const a={idToken:j.id_token, refreshToken:j.refresh_token||salvo.refreshToken, expira:Date.now()+(parseInt(j.expires_in,10)||3600)*1000};
            try{ localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(a)); }catch(eS){}
            return a.idToken;
          }
        }catch(eR){}
      }
      // 3) cria uma sessão anônima nova
      try{
        const r2 = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+encodeURIComponent(API_KEY), {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({returnSecureToken:true}) });
        const j2 = await lerJsonSeguro(r2);
        if(r2.ok && j2 && j2.idToken){
          const a={idToken:j2.idToken, refreshToken:j2.refreshToken||'', expira:Date.now()+(parseInt(j2.expiresIn,10)||3600)*1000};
          try{ localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(a)); }catch(eS2){}
          return a.idToken;
        }
      }catch(eA){}
      return null; // provedor anônimo desligado: segue sem token (modo de teste)
    })();
    try{ return await __authEmAndamento; } finally{ __authEmAndamento=null; }
  }catch(eG){ return null; }
}

async function fireFetch(url, opts){
  const sep = url.indexOf('?')<0 ? '?' : '&';
  let authHeader = null;
  try{ const tk = await authGarantirToken(); if(tk) authHeader = 'Bearer ' + tk; }catch(eT){}
  const finalOpts = Object.assign({}, opts || {});
  if(authHeader) finalOpts.headers = Object.assign({}, finalOpts.headers || {}, {Authorization: authHeader});
  const resp = await fetch(url + sep + 'key=' + encodeURIComponent(API_KEY), finalOpts);
  const text = await resp.text();
  let data=null; try{ data = text ? JSON.parse(text) : null; }catch(eP){ data=text; }
  if(!resp.ok){
    let msg = (data && data.error && data.error.message) || ('HTTP ' + resp.status);
    if(resp.status===403) msg = 'Permissão negada pelo Firebase. Ative o Firestore em "modo de teste" ou ative o acesso Anônimo (Authentication) com as regras definitivas.';
    throw {status:resp.status, data, message:msg};
  }
  return data;
}
async function fireGetDoc(key){
  try{
    return await fireFetch(BASE + '/' + COLL + '/' + encodeURIComponent(key), {method:'GET'});
  }catch(e){ if(e && e.status===404) return null; throw e; }
}
// Listagem por intervalo no campo "key": >= pfx E < pfx + '\uF8FF' (curinga de prefixo)
async function fireListarPrefixo(pfx){
  const body = { structuredQuery: {
    from: [{collectionId: COLL}],
    where: {compositeFilter: {op: 'AND', filters: [
      {fieldFilter: {field: {fieldPath: 'key'}, op: 'GREATER_THAN_OR_EQUAL', value: {stringValue: pfx}}},
      {fieldFilter: {field: {fieldPath: 'key'}, op: 'LESS_THAN',             value: {stringValue: pfx + '\uF8FF'}}}
    ]}},
    orderBy: [{field: {fieldPath: 'key'}, direction: 'ASCENDING'}],
    limit: 3000
  }};
  const resp = await fireFetch(BASE + ':runQuery', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
  const docs=[];
  (resp||[]).forEach(it=>{ if(it && it.document) docs.push(it.document); });
  return docs;
}
async function fireCommit(writes){
  const lotes = fireChunkCommits(writes, 250);
  for(const lote of lotes){
    await fireFetch(BASE + ':commit', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({writes: lote})});
  }
}

// Shim com a MESMA assinatura e formato de resposta do supabaseRequest — o
// restante do sistema não percebe a troca de nuvem.
async function fireRequest(path, options){
  options = options || {};
  const method = String(options.method || 'GET').toUpperCase();
  const q = fireParseQuery(path);
  if(q.table && q.table !== COLL){
    // Só existe a coleção app_state no Firebase: outras "tabelas" respondem vazio
    if(method==='GET') return [];
    return null;
  }
  if(method==='GET'){
    const eq = q.filtros.find(f=>f.op==='eq');
    if(eq){
      const base = await fireGetDoc(eq.value);
      let docs = base ? [base] : [];
      const c = base ? fireDocCampos(base) : null;
      if(c && c.chunked) docs = docs.concat(await fireListarPrefixo(eq.value + '__c'));
      let linhas = fireAgruparDocs(docs);
      if(q.limit) linhas = linhas.slice(0, q.limit);
      return linhas;
    }
    const pf = q.filtros.find(f=>f.op==='prefixo');
    if(pf){
      let linhas = fireAgruparDocs(await fireListarPrefixo(pf.value));
      if(q.limit) linhas = linhas.slice(0, q.limit);
      return linhas;
    }
    const em = q.filtros.find(f=>f.op==='in');
    if(em){
      const docs=[];
      for(const k of em.value){ const d = await fireGetDoc(k); if(d) docs.push(d); }
      return fireAgruparDocs(docs);
    }
    return fireAgruparDocs(await fireListarPrefixo(''));
  }
  if(method==='POST'){
    let rows=[];
    try{ const b = JSON.parse(options.body || 'null'); rows = Array.isArray(b) ? b : (b ? [b] : []); }catch(ePB){ rows=[]; }
    rows = rows.filter(r=>r && r.key);
    await fireCommit(fireMontarWrites(RES_BASE, rows));
    const prefer = (options.headers && options.headers.Prefer) || '';
    return /return=representation/.test(prefer) ? rows : null;
  }
  if(method==='DELETE'){
    const keys=[];
    q.filtros.forEach(f=>{ if(f.op==='eq') keys.push(f.value); if(f.op==='in') keys.push.apply(keys, f.value); });
    if(keys.length) await fireCommit(keys.map(k=>({delete: RES_BASE + '/' + COLL + '/' + encodeURIComponent(k)})));
    return null;
  }
  return null;
}

// ── Instala o transporte Firebase no lugar do Supabase ──
try{
  const I = window.__supabaseSyncInternals;
  if(I){
    I.supabaseRequestSupabase = I.supabaseRequest; // backup, por garantia
    I.supabaseRequest = fireRequest;               // a partir daqui tudo vai p/ o Google
    I.nome = 'firebase';                           // separa o cache incremental por backend
  }
  window.supabaseRequest = fireRequest;
  window.__nuvemBackend = 'firebase';
}catch(eInst){ console.warn('Firebase: não consegui instalar o transporte', eInst); }

window.testarFirebase = async function(showToast){
  if(showToast===undefined) showToast=true;
  const alvo = typeof document!=='undefined' ? document.getElementById('cloud-connection-status') : null;
  if(alvo) alvo.innerHTML = '<span class="text-slate-500">Testando conexão com o Google Firebase...</span>';
  try{
    const linhas = await fireRequest('app_state?select=key&limit=3000', {method:'GET'});
    const n = (linhas||[]).length;
    let authOk = false;
    try{ authOk = !!(await authGarantirToken()); }catch(eA){}
    const msg = 'Conectado ao Google Firebase ✔ (' + n.toLocaleString('pt-BR') + ' documento(s) na nuvem' + (authOk ? ' • acesso anônimo ativo 🔒' : ' • modo de teste (sem login)') + ')';
    if(alvo) alvo.innerHTML = '<span class="text-emerald-700 font-bold">' + msg + '</span>';
    if(showToast && typeof toast==='function') toast(msg, 'success');
    return {ok:true, documentos:n, autenticado:authOk};
  }catch(err){
    const msg = (err && err.message) || String(err);
    if(alvo) alvo.innerHTML = '<span class="text-red-700 font-bold">Falha na conexão: ' + (typeof escapeHtml==='function'?escapeHtml(msg):msg) + '</span>';
    if(showToast && typeof toast==='function') toast('Erro ao conectar no Firebase: ' + msg, 'error');
    return {ok:false, erro:msg};
  }
};
// O botão "Testar conexão" das Configurações passa a testar a nuvem ATIVA
window.testarNuvem = function(showToast){ return window.testarFirebase(showToast); };

console.log('☁️ Nuvem ativa: Google Firebase (Firestore) v4.4.1 — projeto "' + PROJETO + '"');
})();
