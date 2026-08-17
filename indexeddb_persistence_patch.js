// ═══════════════════════════════════════════════════════════════════════════
// PERSISTÊNCIA INDEXEDDB v5.20.31
// Espelho principal de alta capacidade. O localStorage antigo permanece apenas
// como compatibilidade; lotado, não impede mais que os dados sejam preservados.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
const IDB_NAME='digicopy_erp_storage_v1';
const STORE='snapshots';
const KEY='main';
let database=null,writeTimer=null,lastSavedAt=0,lastError='',clearing=false;
window.__indexedDbPersistAtivo=true;

function open(){
  if(database)return Promise.resolve(database);
  return new Promise((resolve,reject)=>{
    if(!window.indexedDB)return reject(new Error('IndexedDB não disponível'));
    const req=indexedDB.open(IDB_NAME,1);
    req.onupgradeneeded=()=>{const x=req.result;if(!x.objectStoreNames.contains(STORE))x.createObjectStore(STORE,{keyPath:'key'});};
    req.onsuccess=()=>{database=req.result;database.onversionchange=()=>database.close();resolve(database);};
    req.onerror=()=>reject(req.error||new Error('Falha abrindo IndexedDB'));
  });
}
function get(){return open().then(x=>new Promise((resolve,reject)=>{const r=x.transaction(STORE,'readonly').objectStore(STORE).get(KEY);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);}));}
function put(snapshot){return open().then(x=>new Promise((resolve,reject)=>{const tx=x.transaction(STORE,'readwrite');tx.objectStore(STORE).put(snapshot);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Gravação cancelada'));}));}
function localTimestamp(){try{const m=JSON.parse(localStorage.getItem('digicopy_erp_v42_demo_apresentacao_manifest')||'null');return m&&m.ts?Date.parse(m.ts)||0:0;}catch(e){return 0;}}
function valid(value){return value&&typeof value==='object'&&Array.isArray(value.clientes)&&Array.isArray(value.produtos)&&Array.isArray(value.usuarios);}
async function writeNow(reason){
  if(clearing||typeof db==='undefined'||!valid(db))return false;
  try{
    const data=typeof structuredClone==='function'?structuredClone(db):JSON.parse(JSON.stringify(db));
    const savedAt=Date.now();await put({key:KEY,savedAt,reason:reason||'save',data});lastSavedAt=savedAt;lastError='';window.__dbPersistidoOk=true;return true;
  }catch(e){lastError=e&&e.message?e.message:String(e);console.error('[DIGICOPY][IndexedDB] falha ao salvar',e);return false;}
}
function schedule(reason){if(writeTimer)clearTimeout(writeTimer);writeTimer=setTimeout(()=>{writeTimer=null;writeNow(reason);},500);}
async function boot(){
  try{
    const saved=await get();
    const localTs=localTimestamp();
    if(saved&&valid(saved.data)&&Number(saved.savedAt)>localTs){
      db=typeof structuredClone==='function'?structuredClone(saved.data):JSON.parse(JSON.stringify(saved.data));
      if(typeof normalizeDbShape==='function')db=normalizeDbShape(db);
      lastSavedAt=Number(saved.savedAt)||0;
      // Refaz a tela/login com a base completa antes de liberar o sync.
      if(typeof getSession==='function'&&getSession()&&typeof showApp==='function')showApp();
      else if(typeof showLogin==='function')showLogin();
      console.log('[DIGICOPY][IndexedDB] base restaurada',new Date(lastSavedAt).toISOString());
    }else{
      await writeNow('migracao-localStorage');
      console.log('[DIGICOPY][IndexedDB] base atual migrada com sucesso');
    }
    return true;
  }catch(e){
    lastError=e&&e.message?e.message:String(e);window.__indexedDbPersistAtivo=false;
    console.error('[DIGICOPY][IndexedDB] indisponível',e);return false;
  }
}
async function clearLocalData(){
  clearing=true;if(writeTimer)clearTimeout(writeTimer);
  try{if(database){database.close();database=null;}}catch(e){}
  await new Promise((resolve,reject)=>{
    const req=indexedDB.deleteDatabase(IDB_NAME);
    req.onsuccess=()=>resolve(true);req.onerror=()=>reject(req.error||new Error('Falha ao apagar IndexedDB'));
    req.onblocked=()=>reject(new Error('Feche as outras abas do DIGICOPY e tente novamente.'));
  });
  try{Object.keys(localStorage).forEach(k=>{if(/^digicopy/i.test(k))localStorage.removeItem(k);});}catch(e){}
  try{Object.keys(sessionStorage).forEach(k=>{if(/^digicopy/i.test(k))sessionStorage.removeItem(k);});}catch(e){}
  return true;
}
window.DIGICOPY_INDEXED_DB={writeNow,clearLocalData,info:()=>({active:!!window.__indexedDbPersistAtivo,lastSavedAt,lastError,database:IDB_NAME})};
window.DIGICOPY_DB_READY=boot();

// Espelha toda chamada de salvamento. Preserva os wrappers anteriores.
try{
  const original=window.saveDB;
  if(typeof original==='function'&&!original.__idbWrapped){
    window.saveDB=function(){const r=original.apply(this,arguments);schedule('saveDB');return r;};
    window.saveDB.__idbWrapped=true;
  }
  const urgent=window.saveDBAgora;
  if(typeof urgent==='function'&&!urgent.__idbWrapped){
    window.saveDBAgora=function(){const r=urgent.apply(this,arguments);writeNow('saveDBAgora');return r;};
    window.saveDBAgora.__idbWrapped=true;
  }
}catch(e){}
try{document.addEventListener('visibilitychange',()=>{if(document.hidden)writeNow('ocultar');});}catch(e){}
console.log('[DIGICOPY] persistência IndexedDB carregada');
})();
