// ═══════════════════════════════════════════════════════════════════════════
// PERSISTÊNCIA INDEXEDDB v2 — incremental por entidade
// Migra automaticamente o snapshot v1 e grava apenas entidades alteradas.
// O localStorage permanece como compatibilidade; IndexedDB é a cópia ampla.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
const IDB_NAME='digicopy_erp_storage_v1';
const SNAPSHOTS='snapshots';
const ENTITIES='entities';
const META='meta';
const KEY='main';
let database=null,writeTimer=null,lastSavedAt=0,lastError='',clearing=false,entityHashes={};
window.__indexedDbPersistAtivo=true;

function open(){
  if(database)return Promise.resolve(database);
  return new Promise((resolve,reject)=>{
    if(!window.indexedDB)return reject(new Error('IndexedDB não disponível'));
    const req=indexedDB.open(IDB_NAME,2);
    req.onupgradeneeded=()=>{
      const x=req.result;
      if(!x.objectStoreNames.contains(SNAPSHOTS))x.createObjectStore(SNAPSHOTS,{keyPath:'key'});
      if(!x.objectStoreNames.contains(ENTITIES))x.createObjectStore(ENTITIES,{keyPath:'key'});
      if(!x.objectStoreNames.contains(META))x.createObjectStore(META,{keyPath:'key'});
    };
    req.onsuccess=()=>{database=req.result;database.onversionchange=()=>{database.close();database=null;};resolve(database);};
    req.onerror=()=>reject(req.error||new Error('Falha abrindo IndexedDB'));
  });
}
function getSnapshot(key){return open().then(x=>new Promise((resolve,reject)=>{const r=x.transaction(SNAPSHOTS,'readonly').objectStore(SNAPSHOTS).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);}));}
function putSnapshot(snapshot){return open().then(x=>new Promise((resolve,reject)=>{const tx=x.transaction(SNAPSHOTS,'readwrite');tx.objectStore(SNAPSHOTS).put(snapshot);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Snapshot cancelado'));}));}
function getIncremental(){
  return open().then(x=>new Promise((resolve,reject)=>{
    const tx=x.transaction([META,ENTITIES],'readonly');
    const mr=tx.objectStore(META).get(KEY),er=tx.objectStore(ENTITIES).getAll();
    let meta=null,rows=[];mr.onsuccess=()=>{meta=mr.result||null;};er.onsuccess=()=>{rows=er.result||[];};
    tx.oncomplete=()=>{
      if(!meta||!Array.isArray(meta.keys))return resolve(null);
      const data={};rows.forEach(row=>{if(meta.keys.includes(row.key))data[row.key]=row.value;});
      resolve({savedAt:Number(meta.savedAt)||0,hashes:meta.hashes||{},data});
    };
    tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Leitura incremental cancelada'));
  }));
}
function localTimestamp(){try{const m=JSON.parse(localStorage.getItem('digicopy_erp_v42_demo_apresentacao_manifest')||'null');return m&&m.ts?Date.parse(m.ts)||0:0;}catch(e){return 0;}}
function localManifest(){try{const m=JSON.parse(localStorage.getItem('digicopy_erp_v42_demo_apresentacao_manifest')||'null');return m&&m.partes?m:null;}catch(e){return null;}}
function valid(value){return value&&typeof value==='object'&&Array.isArray(value.clientes)&&Array.isArray(value.produtos)&&Array.isArray(value.usuarios);}
function hashText(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(36);}
function signature(campo,value,manifest){
  const info=manifest&&manifest.partes&&manifest.partes[campo];
  if(info&&info.subs)return 'm:'+hashText(JSON.stringify(info.subs));
  try{return 'j:'+hashText(JSON.stringify(value));}catch(e){return 't:'+Date.now();}
}
async function writeNow(reason){
  if(clearing||typeof db==='undefined'||!valid(db))return false;
  try{
    const x=await open(),keys=Object.keys(db),manifest=localManifest(),hashes={},changed=[];
    keys.forEach(campo=>{const h=signature(campo,db[campo],manifest);hashes[campo]=h;if(entityHashes[campo]!==h)changed.push(campo);});
    const removed=Object.keys(entityHashes).filter(campo=>!keys.includes(campo));
    const savedAt=Date.now();
    await new Promise((resolve,reject)=>{
      const tx=x.transaction([META,ENTITIES],'readwrite'),store=tx.objectStore(ENTITIES);
      changed.forEach(campo=>store.put({key:campo,value:db[campo],hash:hashes[campo]}));
      removed.forEach(campo=>store.delete(campo));
      tx.objectStore(META).put({key:KEY,savedAt,reason:reason||'save',keys,hashes});
      tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Gravação incremental cancelada'));
    });
    entityHashes=hashes;lastSavedAt=savedAt;lastError='';window.__dbPersistidoOk=true;
    return {ok:true,changed:changed.length,removed:removed.length};
  }catch(e){lastError=e&&e.message?e.message:String(e);console.error('[DIGICOPY][IndexedDB] falha ao salvar',e);return false;}
}
function schedule(reason){if(writeTimer)clearTimeout(writeTimer);writeTimer=setTimeout(()=>{writeTimer=null;writeNow(reason);},500);}
async function boot(){
  try{
    const [incremental,legacy]=await Promise.all([getIncremental(),getSnapshot(KEY)]),localTs=localTimestamp();
    const incTs=incremental&&valid(incremental.data)?incremental.savedAt:0;
    const legacyTs=legacy&&valid(legacy.data)?Number(legacy.savedAt)||0:0;
    if(incTs>localTs&&incTs>=legacyTs){
      db=typeof structuredClone==='function'?structuredClone(incremental.data):JSON.parse(JSON.stringify(incremental.data));
      entityHashes=incremental.hashes||{};lastSavedAt=incTs;
      if(typeof normalizeDbShape==='function')db=normalizeDbShape(db);
      console.log('[DIGICOPY][IndexedDB] base incremental restaurada',new Date(lastSavedAt).toISOString());
    }else if(legacyTs>localTs){
      db=typeof structuredClone==='function'?structuredClone(legacy.data):JSON.parse(JSON.stringify(legacy.data));
      if(typeof normalizeDbShape==='function')db=normalizeDbShape(db);
      lastSavedAt=legacyTs;entityHashes={};
      await writeNow('migracao-snapshot-v1');
      console.log('[DIGICOPY][IndexedDB] snapshot v1 migrado para entidades');
    }else{
      entityHashes={};await writeNow('migracao-localStorage');
      console.log('[DIGICOPY][IndexedDB] base atual migrada com sucesso');
    }
    if(typeof seedData==='function')seedData(false);
    if(typeof getSession==='function'&&getSession()&&typeof showApp==='function')showApp();
    else if(typeof showLogin==='function')showLogin();
    return true;
  }catch(e){lastError=e&&e.message?e.message:String(e);window.__indexedDbPersistAtivo=false;console.error('[DIGICOPY][IndexedDB] indisponível',e);return false;}
}
async function writeRecoverySnapshot(name,data){
  try{
    const copy=typeof structuredClone==='function'?structuredClone(data):JSON.parse(JSON.stringify(data));
    await putSnapshot({key:'recovery_'+String(name||Date.now()),savedAt:Date.now(),reason:'recovery',data:copy});return true;
  }catch(e){lastError=e&&e.message?e.message:String(e);return false;}
}
async function clearLocalData(){
  clearing=true;if(writeTimer)clearTimeout(writeTimer);
  try{if(database){database.close();database=null;}}catch(e){}
  await new Promise((resolve,reject)=>{const req=indexedDB.deleteDatabase(IDB_NAME);req.onsuccess=()=>resolve(true);req.onerror=()=>reject(req.error||new Error('Falha ao apagar IndexedDB'));req.onblocked=()=>reject(new Error('Feche as outras abas do DIGICOPY e tente novamente.'));});
  try{Object.keys(localStorage).forEach(k=>{if(/^digicopy/i.test(k))localStorage.removeItem(k);});}catch(e){}
  try{Object.keys(sessionStorage).forEach(k=>{if(/^digicopy/i.test(k))sessionStorage.removeItem(k);});}catch(e){}
  return true;
}
window.DIGICOPY_INDEXED_DB={writeNow,writeRecoverySnapshot,clearLocalData,info:()=>({active:!!window.__indexedDbPersistAtivo,version:2,lastSavedAt,lastError,database:IDB_NAME,entityHashes:Object.keys(entityHashes).length})};
window.DIGICOPY_DB_READY=boot();
try{
  const original=window.saveDB;
  if(typeof original==='function'&&!original.__idbWrapped){window.saveDB=function(){const r=original.apply(this,arguments);schedule('saveDB');return r;};window.saveDB.__idbWrapped=true;}
  const urgent=window.saveDBAgora;
  if(typeof urgent==='function'&&!urgent.__idbWrapped){window.saveDBAgora=function(){const r=urgent.apply(this,arguments);writeNow('saveDBAgora');return r;};window.saveDBAgora.__idbWrapped=true;}
}catch(e){}
try{document.addEventListener('visibilitychange',()=>{if(document.hidden)writeNow('ocultar');});}catch(e){}
console.log('[DIGICOPY] persistência IndexedDB v2 incremental carregada');
})();
