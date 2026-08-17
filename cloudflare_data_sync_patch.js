// ═══════════════════════════════════════════════════════════════════════════
// DIGICOPY CLOUD DATA v5.20.30 — sincronização incremental local-first
// • Nuvem ausente/vazia NUNCA apaga o PC.
// • Primeiro baixa novidades; depois envia somente registros alterados.
// • Fila local durável, idempotência, versão por registro e backoff.
// • Exclusões em massa inesperadas são bloqueadas para aprovação manual.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const STATE_KEY='digicopy_cf_sync_state_v1';
const OUTBOX_KEY='digicopy_cf_sync_outbox_v1';
const CONFLICT_KEY='digicopy_cf_sync_conflicts_v1';
const LEADER_KEY='digicopy_cf_sync_leader_v1';
const TAB_ID='tab_'+Math.random().toString(36).slice(2)+'_'+Date.now().toString(36);
const MAX_OUTBOX=100;
const PUSH_BATCH=25;
const HEARTBEAT_MS=60000;

const DEFINITIONS={
  empresas:'array', usuarios:'array', clientes:'array', produtos:'array',
  equipamentos:'array', contratos:'array', parque:'array', leituras:'array',
  os:'array', vendas:'array', contasReceber:'array', contasPagar:'array',
  logs:'array', tecnicos:'array', notificacoes:'array',
  config:'root', modulosDinamicos:'map'
};

function parse(raw,fallback){try{const x=JSON.parse(raw);return x&&typeof x==='object'?x:fallback;}catch(e){return fallback;}}
function loadState(){
  let s={cursor:0,versions:{},hashes:{},known:{},blockedDeletes:{},initialPull:false,lastOk:0};
  try{s=Object.assign(s,parse(localStorage.getItem(STATE_KEY),{}));}catch(e){}
  s.versions=s.versions||{};s.hashes=s.hashes||{};s.known=s.known||{};s.blockedDeletes=s.blockedDeletes||{};
  return s;
}
function loadOutbox(){try{const x=JSON.parse(localStorage.getItem(OUTBOX_KEY)||'[]');return Array.isArray(x)?x:[];}catch(e){return [];}}
let state=loadState(),outbox=loadOutbox();
let busy=false,applying=false,timer=null,failures=0,lastError='',lastTick=0;

function persist(){
  try{localStorage.setItem(STATE_KEY,JSON.stringify(state));localStorage.setItem(OUTBOX_KEY,JSON.stringify(outbox));return true;}
  catch(e){lastError='Sem espaço para a fila de sincronização.';return false;}
}
function key(entity,id){return entity+'|'+id;}
function clean(value){
  if(value==null||typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(clean);
  const out={};Object.keys(value).sort().forEach(k=>{if(k!=='_rt'&&k!=='_cf'&&value[k]!==undefined)out[k]=clean(value[k]);});return out;
}
function stable(value){try{return JSON.stringify(clean(value));}catch(e){return String(value);}}
function hash(value){
  const text=stable(value);let h=0x811c9dc5;
  for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}
  return (h>>>0).toString(36);
}
function mutationId(){
  try{return 'mut_'+crypto.randomUUID();}catch(e){return 'mut_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);}
}
function api(){return window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.api;}
function authorized(){return !!(window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.token());}

function entriesFor(entity,mode){
  if(typeof db==='undefined'||!db)return [];
  const value=db[entity];
  if(mode==='array')return (Array.isArray(value)?value:[]).filter(x=>x&&x.id).map(x=>({id:String(x.id),data:clean(x)}));
  if(mode==='root')return value&&typeof value==='object'?[{id:'__root__',data:clean(value)}]:[];
  if(mode==='map')return value&&typeof value==='object'?Object.keys(value).map(id=>({id:String(id),data:{value:clean(value[id])}})):[];
  return [];
}
function findLocal(entity,mode,id){
  if(typeof db==='undefined'||!db)return null;
  if(mode==='array'){const arr=Array.isArray(db[entity])?db[entity]:[];return arr.find(x=>x&&String(x.id)===String(id))||null;}
  if(mode==='root')return db[entity]||null;
  if(mode==='map')return db[entity]&&Object.prototype.hasOwnProperty.call(db[entity],id)?{value:db[entity][id]}:null;
  return null;
}
function applyRemote(change){
  const mode=DEFINITIONS[change.entity];if(!mode)return false;
  const k=key(change.entity,change.recordId),knownVersion=Number(state.versions[k]||0);
  if(Number(change.version)<=knownVersion)return false;
  let changed=false;
  if(mode==='array'){
    if(!Array.isArray(db[change.entity]))db[change.entity]=[];
    const arr=db[change.entity],idx=arr.findIndex(x=>x&&String(x.id)===String(change.recordId));
    if(change.operation==='delete'){if(idx>=0){arr.splice(idx,1);changed=true;}}
    else if(change.data){if(idx>=0)arr[idx]=change.data;else arr.push(change.data);changed=true;}
  }else if(mode==='root'){
    if(change.operation==='delete'){/* objetos essenciais nunca são apagados por ausência */}
    else if(change.data){db[change.entity]=change.data;changed=true;}
  }else if(mode==='map'){
    if(!db[change.entity]||typeof db[change.entity]!=='object')db[change.entity]={};
    if(change.operation==='delete'){if(Object.prototype.hasOwnProperty.call(db[change.entity],change.recordId)){delete db[change.entity][change.recordId];changed=true;}}
    else if(change.data&&Object.prototype.hasOwnProperty.call(change.data,'value')){db[change.entity][change.recordId]=change.data.value;changed=true;}
  }
  state.versions[k]=Number(change.version);
  if(change.operation==='delete'){delete state.known[k];delete state.hashes[k];}
  else{state.known[k]=true;state.hashes[k]=hash(change.data);}
  return changed;
}

async function pullAll(){
  const call=api();if(!call)throw new Error('API Cloudflare não carregada.');
  let changed=false,pages=0;
  do{
    const data=await call('/v1/changes?cursor='+encodeURIComponent(Number(state.cursor)||0)+'&limit=500',{method:'GET'});
    for(const item of (data.changes||[])){if(applyRemote(item))changed=true;}
    state.cursor=Number(data.nextCursor)||Number(state.cursor)||0;
    pages++;
    if(!data.hasMore)break;
  }while(pages<100);
  state.initialPull=true;
  if(changed){
    applying=true;
    try{if(typeof saveDBAgora==='function')saveDBAgora();else if(typeof saveDB==='function')saveDB();}
    finally{applying=false;}
  }
  persist();
  return changed;
}

function pendingKeys(){const s=new Set();outbox.forEach(x=>s.add(x.key));return s;}
function scanLocal(approvedEntity){
  if(!state.initialPull||typeof db==='undefined'||!db)return 0;
  const pending=pendingKeys();let added=0;
  for(const entity of Object.keys(DEFINITIONS)){
    if(outbox.length>=MAX_OUTBOX)break;
    const mode=DEFINITIONS[entity],entries=entriesFor(entity,mode),present=new Set(entries.map(x=>key(entity,x.id)));
    for(const entry of entries){
      if(outbox.length>=MAX_OUTBOX)break;
      const k=key(entity,entry.id),h=hash(entry.data);
      if(state.hashes[k]===h||pending.has(k))continue;
      outbox.push({key:k,hash:h,mutation:{mutationId:mutationId(),entity,recordId:entry.id,operation:'upsert',baseVersion:Number(state.versions[k]||0),data:entry.data}});
      pending.add(k);added++;
    }
    const missing=Object.keys(state.known).filter(k=>k.startsWith(entity+'|')&&!present.has(k)&&!pending.has(k));
    const knownCount=Object.keys(state.known).filter(k=>k.startsWith(entity+'|')).length;
    const mass=missing.length>=10&&knownCount>0&&missing.length/knownCount>.30;
    if(mass&&approvedEntity!==entity){state.blockedDeletes[entity]=missing.map(k=>k.slice(entity.length+1));continue;}
    delete state.blockedDeletes[entity];
    for(const k of missing){
      if(outbox.length>=MAX_OUTBOX)break;
      const id=k.slice(entity.length+1);
      outbox.push({key:k,hash:null,mutation:{mutationId:mutationId(),entity,recordId:id,operation:'delete',baseVersion:Number(state.versions[k]||0)}});
      pending.add(k);added++;
    }
  }
  persist();return added;
}

function rememberConflict(item,result){
  try{
    let list=JSON.parse(localStorage.getItem(CONFLICT_KEY)||'[]');if(!Array.isArray(list))list=[];
    list.unshift({at:new Date().toISOString(),local:item.mutation,current:result.current||null});
    localStorage.setItem(CONFLICT_KEY,JSON.stringify(list.slice(0,20)));
  }catch(e){}
}
async function pushOutbox(){
  const call=api();if(!call||!outbox.length)return 0;
  let sent=0;
  while(outbox.length){
    const batch=[];let bytes=0;
    for(const item of outbox.slice(0,PUSH_BATCH)){
      const size=stable(item.mutation).length;
      if(batch.length&&bytes+size>550000)break;
      batch.push(item);bytes+=size;
    }
    if(!batch.length)break;
    const response=await call('/v1/changes',{method:'POST',body:JSON.stringify({mutations:batch.map(x=>x.mutation)})});
    const remove=new Set();
    for(const result of (response.results||[])){
      const item=batch[result.index];if(!item)continue;
      if(result.ok){
        state.versions[item.key]=Number(result.version)||state.versions[item.key]||0;
        if(item.mutation.operation==='delete'){delete state.known[item.key];delete state.hashes[item.key];}
        else{state.known[item.key]=true;state.hashes[item.key]=item.hash;}
        remove.add(item.mutation.mutationId);sent++;
      }else if(result.conflict){
        rememberConflict(item,result);
        if(result.current)applyRemote({entity:result.current.entity,recordId:result.current.recordId,data:result.current.data,version:result.current.version,operation:result.current.deletedAt?'delete':'upsert'});
        remove.add(item.mutation.mutationId);
      }else if(result.error){
        rememberConflict(item,result);remove.add(item.mutation.mutationId);
      }
    }
    outbox=outbox.filter(x=>!remove.has(x.mutation.mutationId));persist();
    if(!remove.size)break;
  }
  return sent;
}

function leader(){
  const now=Date.now();let value=null;
  try{value=parse(localStorage.getItem(LEADER_KEY),null);}catch(e){}
  if(!value||value.id===TAB_ID||Number(value.until)<now){
    try{localStorage.setItem(LEADER_KEY,JSON.stringify({id:TAB_ID,until:now+90000}));}catch(e){}
    return true;
  }
  return false;
}
function indicator(ok,text){
  if(typeof document==='undefined')return;
  const btn=document.getElementById('btn-nuvem');if(!btn)return;
  btn.title=text||'Nuvem DIGICOPY';btn.dataset.cloud=ok?'ok':'error';
  const icon=btn.querySelector('i');if(icon)icon.style.color=ok?'#16a34a':'#dc2626';
}
async function tick(reason){
  if(busy||!authorized()||!leader())return false;
  busy=true;lastTick=Date.now();
  try{
    if(window.DIGICOPY_DB_READY)await window.DIGICOPY_DB_READY;
    await pullAll();
    let totalSent=0;
    for(let round=0;round<50;round++){
      scanLocal();
      if(!outbox.length)break;
      const sent=await pushOutbox();totalSent+=sent;if(!sent&&outbox.length)break;
    }
    // Só consulta novamente quando este PC realmente enviou algo. Em repouso,
    // cada ciclo custa uma única consulta incremental, não duas.
    if(totalSent>0)await pullAll();
    failures=0;lastError='';state.lastOk=Date.now();persist();indicator(true,'Nuvem sincronizada • '+new Date().toLocaleTimeString('pt-BR'));
    return true;
  }catch(e){
    failures++;lastError=e&&e.message?e.message:String(e);indicator(false,'Nuvem pendente: '+lastError);
    if(e&&e.status===401){/* painel solicitará nova autorização */}
    return false;
  }finally{busy=false;scheduleHeartbeat();}
}
function schedule(delay){if(timer)clearTimeout(timer);timer=setTimeout(()=>tick('agendado'),Math.max(250,delay||800));}
function scheduleHeartbeat(){
  if(typeof document==='undefined')return;
  if(timer)clearTimeout(timer);
  const wait=failures?Math.min(300000,5000*Math.pow(2,Math.min(failures,6))):HEARTBEAT_MS;
  timer=setTimeout(()=>{if(!document.hidden)tick('heartbeat');else scheduleHeartbeat();},wait);
}
function approveMassDelete(entity){
  if(!state.blockedDeletes[entity])return false;
  scanLocal(entity);schedule(100);return true;
}
function info(){return {authorized:authorized(),busy,cursor:Number(state.cursor)||0,outbox:outbox.length,lastOk:state.lastOk||0,lastError,blockedDeletes:state.blockedDeletes,conflicts:(()=>{try{return JSON.parse(localStorage.getItem(CONFLICT_KEY)||'[]');}catch(e){return [];}})()};}

window.DIGICOPY_CLOUD_SYNC={tick,info,approveMassDelete,hash,clean,definitions:DEFINITIONS};

if(typeof document==='undefined')return;
try{
  const original=window.saveDB;
  if(typeof original==='function'&&!original.__cfWrapped){
    window.saveDB=function(){const r=original.apply(this,arguments);if(!applying&&authorized())schedule(900);return r;};
    window.saveDB.__cfWrapped=true;
  }
}catch(e){}
try{window.addEventListener('focus',()=>{if(Date.now()-lastTick>10000)schedule(250);});}catch(e){}
try{document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastTick>10000)schedule(250);});}catch(e){}
try{window.addEventListener('online',()=>schedule(250));}catch(e){}
if(authorized())schedule(1200);else scheduleHeartbeat();
console.log('[DIGICOPY] sincronização Cloudflare incremental carregada');
})();
