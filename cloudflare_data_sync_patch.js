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
const PUSH_BATCH=10;
const HEARTBEAT_MS=60000;

// Listas com formato especial. Todo o resto do banco entra sozinho pela
// definicoes(): antes a nuvem só levava estas 19 listas e tudo o que estava
// fora (despesas de locação, compras, cartuchos, cidades, agenda, caixa,
// e-mails, boletos, favoritos...) ficava preso no PC onde foi criado — era por
// isso que um computador tinha tudo e o outro aparecia faltando dados.
const DEFINITIONS={
  empresas:'array', usuarios:'array', clientes:'array', produtos:'array', recargas:'array',
  equipamentos:'array', contratos:'array', parque:'array', leituras:'array',
  os:'array', vendas:'array', orcamentos:'array', contasReceber:'array', contasPagar:'array',
  logs:'array', tecnicos:'array', notificacoes:'array',
  config:'root', modulosDinamicos:'map', _seq:'contador'
};
// Coisas que NÃO viajam: controle interno do próprio arquivo local.
const NAO_SINCRONIZA=new Set(['meta','__proto__']);

// Lê o banco de verdade e devolve o mapa completo do que sincronizar. Lista
// nova criada por qualquer módulo entra automaticamente na próxima passada.
function definicoes(){
  const mapa=Object.assign({},DEFINITIONS);
  if(typeof db==='undefined'||!db)return mapa;
  for(const chave of Object.keys(db)){
    if(mapa[chave]||NAO_SINCRONIZA.has(chave))continue;
    const valor=db[chave];
    if(Array.isArray(valor))mapa[chave]='array';
    else if(valor&&typeof valor==='object')mapa[chave]='map';
  }
  return mapa;
}

function parse(raw,fallback){try{const x=JSON.parse(raw);return x&&typeof x==='object'?x:fallback;}catch(e){return fallback;}}
function loadState(){
  let s={cursor:0,versions:{},hashes:{},known:{},initialPull:false,lastOk:0,paused:false,heldLocalOnly:[],pauseReason:''};
  try{s=Object.assign(s,parse(localStorage.getItem(STATE_KEY),{}));}catch(e){}
  s.versions=s.versions||{};s.hashes=s.hashes||{};s.known=s.known||{};
  s.heldLocalOnly=Array.isArray(s.heldLocalOnly)?s.heldLocalOnly:[];
  s.pauseReason=s.pauseReason||'';
  s.regras=s.regras||'';
  return s;
}
function loadOutbox(){try{const x=JSON.parse(localStorage.getItem(OUTBOX_KEY)||'[]');return Array.isArray(x)?x:[];}catch(e){return [];}}
let state=loadState(),outbox=loadOutbox();
// v5.22.69 — a nuvem passou a levar TODAS as listas do sistema. Quem já estava
// conectado tem dados antigos que nunca subiram, então o sistema pergunta uma
// única vez o que fazer com eles antes de voltar a sincronizar.
const REGRAS='v5.22.69-tudo';
if(state.initialPull&&state.regras!==REGRAS){
  state.regras=REGRAS;
  state.paused=true;
  state.pauseReason='escolha-inicial';
  try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(e){}
}else if(!state.regras){state.regras=REGRAS;}
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
  if(mode==='array')return (Array.isArray(value)?value:[]).filter(x=>x&&typeof x==='object').map(x=>({id:x.id?String(x.id):('h_'+hash(clean(x))),data:clean(x)}));
  if(mode==='root')return value&&typeof value==='object'?[{id:'__root__',data:clean(value)}]:[];
  if(mode==='contador')return value&&typeof value==='object'?[{id:'__root__',data:clean(value)}]:[];
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
  const mode=definicoes()[change.entity]||(change.entity&&!NAO_SINCRONIZA.has(change.entity)?'array':null);if(!mode)return false;
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
  }else if(mode==='contador'){
    // Numeração de venda/OS/orçamento: nunca volta atrás. Cada contador fica
    // com o MAIOR número entre este PC e a nuvem, para dois computadores não
    // emitirem documentos com o mesmo número.
    if(change.data&&typeof change.data==='object'){
      if(!db[change.entity]||typeof db[change.entity]!=='object')db[change.entity]={};
      const alvo=db[change.entity];
      for(const nome of Object.keys(change.data)){
        const nuvem=Number(change.data[nome])||0,aqui=Number(alvo[nome])||0;
        if(nuvem>aqui){alvo[nome]=nuvem;changed=true;}
      }
    }
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

function localKeysSnapshot(){
  const set=new Set();
  const MAPA=definicoes();
  for(const entity of Object.keys(MAPA))for(const entry of entriesFor(entity,MAPA[entity]))set.add(key(entity,entry.id));
  return set;
}
function localBusinessCount(){
  if(typeof db==='undefined'||!db)return 0;
  let n=0;
  ['clientes','produtos','vendas','contratos','leituras','os','equipamentos','parque'].forEach(k=>{
    if(Array.isArray(db[k]))n+=db[k].length;
  });
  return n;
}
function listLocalOnlyKeys(beforeKeys){
  const extras=[];
  if(!beforeKeys)return extras;
  beforeKeys.forEach(k=>{if(!state.known[k])extras.push(k);});
  return extras;
}
// v5.22.68 — na PRIMEIRA vez que este PC entra na nuvem, nada sobe sozinho.
// Se há dados aqui que a nuvem não tem, a sincronização espera uma escolha de
// duas opções: enviar os dados atuais deste PC, ou não enviar. Qualquer uma
// das duas destrava a sincronização daí em diante.
function decideReinstallGuard(opts){
  const activation=opts&&opts.activation;
  const cloudHasData=!!(opts&&opts.cloudHasData);
  const localCount=Number(opts&&opts.localCount)||0;
  const extraCount=Number(opts&&opts.extraCount)||0;
  // v5.22.69 — o PC autorizado por convite APAGAVA daqui tudo o que a nuvem não
  // tinha. Era isso que deixava o segundo computador faltando dados. Agora ele
  // recebe a mesma escolha dos outros: nada é apagado sem a pessoa mandar.
  if(activation==='invite'&&extraCount===0){
    return {pause:false,isolate:false,hold:false,reason:'convidado-ok'};
  }
  if((!cloudHasData&&localCount>0)||(cloudHasData&&extraCount>0)){
    return {pause:true,isolate:false,hold:true,reason:'escolha-inicial'};
  }
  return {pause:false,isolate:false,hold:false,reason:'ok'};
}
async function reconcileFirstAuthorizedDevice(beforeKeys){
  if(!beforeKeys||typeof db==='undefined'||!db)return 0;
  let removed=0;
  const MAPA=definicoes();
  for(const entity of Object.keys(MAPA)){
    const mode=MAPA[entity];
    if(mode==='array'&&Array.isArray(db[entity])){
      db[entity]=db[entity].filter(item=>{
        if(!item||!item.id)return true;
        const k=key(entity,String(item.id));
        if(beforeKeys.has(k)&&!state.known[k]){removed++;return false;}
        return true;
      });
    }else if(mode==='map'&&db[entity]&&typeof db[entity]==='object'){
      for(const id of Object.keys(db[entity])){const k=key(entity,id);if(beforeKeys.has(k)&&!state.known[k]){delete db[entity][id];removed++;}}
    }else if(mode==='root'){
      const k=key(entity,'__root__');
      if(beforeKeys.has(k)&&!state.known[k])state.hashes[k]=hash(db[entity]);
    }
  }
  if(removed){applying=true;try{if(typeof saveDBAgora==='function')saveDBAgora();else if(typeof saveDB==='function')saveDB();}finally{applying=false;}}
  return removed;
}

async function pullAll(){
  const call=api();if(!call)throw new Error('API Cloudflare não carregada.');
  let changed=false,pages=0;
  do{
    const data=await comPaciencia(()=>call('/v1/changes?cursor='+encodeURIComponent(Number(state.cursor)||0)+'&limit=500',{method:'GET'}));
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

// A nuvem (Cloudflare/D1) responde 503, 502 ou 429 quando está sobrecarregada
// ou quando recebe muita escrita de uma vez — típico da primeira remessa grande.
// Não é erro de dados: é "espere um pouco e mande de novo". Antes qualquer 503
// abortava o envio inteiro e aparecia "Envio pendente" na cara da pessoa.
const ESPERAS=[900,2500,6000,12000];
function ehSobrecarga(erro){
  const st=Number(erro&&erro.status)||0;
  if(st===429||st===500||st===502||st===503||st===504)return true;
  const txt=(erro&&erro.message||'').toLowerCase();
  return txt.indexOf('sem conexão')>=0||txt.indexOf('network')>=0||txt.indexOf('failed to fetch')>=0;
}
function dormir(ms){return new Promise(r=>setTimeout(r,ms));}
async function comPaciencia(fn){
  let ultimo=null;
  for(let tentativa=0;tentativa<=ESPERAS.length;tentativa++){
    try{return await fn();}
    catch(e){
      ultimo=e;
      if(!ehSobrecarga(e)||tentativa===ESPERAS.length)throw e;
      lastError='A nuvem está ocupada. Tentando de novo em '+Math.round(ESPERAS[tentativa]/1000)+'s...';
      indicator(false,lastError);
      await dormir(ESPERAS[tentativa]);
    }
  }
  throw ultimo;
}

function pendingKeys(){const s=new Set();outbox.forEach(x=>s.add(x.key));return s;}
function scanLocal(){
  if(!state.initialPull||typeof db==='undefined'||!db)return 0;
  const pending=pendingKeys();let added=0;
  const held=new Set(state.heldLocalOnly||[]);
  const MAPA=definicoes();
  for(const entity of Object.keys(MAPA)){
    if(outbox.length>=MAX_OUTBOX)break;
    const mode=MAPA[entity],entries=entriesFor(entity,mode),present=new Set(entries.map(x=>key(entity,x.id)));
    for(const entry of entries){
      if(outbox.length>=MAX_OUTBOX)break;
      const k=key(entity,entry.id),h=hash(entry.data);
      if(held.has(k)||state.hashes[k]===h||pending.has(k))continue;
      outbox.push({key:k,hash:h,mutation:{mutationId:mutationId(),entity,recordId:entry.id,operation:'upsert',baseVersion:Number(state.versions[k]||0),data:entry.data}});
      pending.add(k);added++;
    }
    const missing=Object.keys(state.known).filter(k=>k.startsWith(entity+'|')&&!present.has(k)&&!pending.has(k));
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
// Tamanho do lote em uso. Cai pela metade quando a nuvem reclama e volta a
// crescer sozinho quando ela aceita — o PC nunca fica travado nem afoga o D1.
let lote=PUSH_BATCH;
async function pushOutbox(){
  const call=api();if(!call||!outbox.length)return 0;
  let sent=0;
  while(outbox.length){
    const batch=[];let bytes=0;
    for(const item of outbox.slice(0,Math.max(1,lote))){
      const size=stable(item.mutation).length;
      if(batch.length&&bytes+size>550000)break;
      batch.push(item);bytes+=size;
    }
    if(!batch.length)break;
    let response;
    try{
      response=await comPaciencia(()=>call('/v1/changes',{method:'POST',body:JSON.stringify({mutations:batch.map(x=>x.mutation)})}));
    }catch(e){
      if(ehSobrecarga(e)&&lote>1){
        // Ainda ocupada: manda menos por vez na próxima rodada em vez de desistir.
        lote=Math.max(1,Math.floor(lote/2));
        persist();
        return sent;
      }
      throw e;
    }
    if(lote<PUSH_BATCH)lote=Math.min(PUSH_BATCH,lote+1);
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
    if(outbox.length)await dormir(180);
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
  if(state.paused||busy||!authorized()||!leader())return false;
  busy=true;lastTick=Date.now();
  try{
    if(window.DIGICOPY_DB_READY)await window.DIGICOPY_DB_READY;
    const info=window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.deviceInfo?window.DIGICOPY_CLOUD.deviceInfo():null;
    const firstAuthorizedPull=!state.initialPull;
    const activation=info&&info.activation;
    // Reinstalação / recuperação: não envia sobra local sozinho (duplicaria).
    // Só o PC convidado isola histórico velho. Nuvem vazia + dados neste PC
    // fica pausada até clicar em Publicar este PC.
    const localBefore=firstAuthorizedPull?localKeysSnapshot():null;
    if(firstAuthorizedPull&&localBusinessCount()>0&&window.DIGICOPY_INDEXED_DB)await window.DIGICOPY_INDEXED_DB.writeRecoverySnapshot('antes_primeira_nuvem',db);
    await pullAll();
    if(firstAuthorizedPull){
      const extras=listLocalOnlyKeys(localBefore);
      const decision=decideReinstallGuard({
        activation,
        cloudHasData:Object.keys(state.known).length>0,
        localCount:localBusinessCount(),
        extraCount:extras.length
      });
      if(decision.isolate)await reconcileFirstAuthorizedDevice(localBefore);
      state.heldLocalOnly=decision.hold?extras:[];
      state.pauseReason=decision.pause?decision.reason:'';
      if(decision.pause){
        state.paused=true;state.initialPull=true;persist();
        indicator(false,'Escolha o que fazer com os dados deste PC');
        return true;
      }
    }
    let totalSent=0;
    for(let round=0;round<50;round++){
      scanLocal();
      if(!outbox.length)break;
      const sent=await pushOutbox();totalSent+=sent;if(!sent&&outbox.length)break;
    }
    // Só consulta novamente quando este PC realmente enviou algo. Em repouso,
    // cada ciclo custa uma única consulta incremental, não duas.
    if(totalSent>0)await pullAll();
    failures=0;lastError='';state.lastOk=Date.now();persist();
    if(outbox.length){
      // Remessa grande: mostra o quanto falta e volta logo para continuar, em vez
      // de esperar o próximo ciclo normal de vários minutos.
      indicator(true,'Enviando para a nuvem • faltam '+outbox.length+' registros');
      busy=false;schedule(3000);return true;
    }
    indicator(true,'Nuvem sincronizada • '+new Date().toLocaleTimeString('pt-BR'));
    return true;
  }catch(e){
    failures++;lastError=e&&e.message?e.message:String(e);indicator(false,'Nuvem pendente: '+lastError);
    if(e&&e.status===401){
      try{if(window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.forgetAuth)window.DIGICOPY_CLOUD.forgetAuth();}catch(_e){}
    }
    return false;
  }finally{if(busy){busy=false;scheduleHeartbeat();}}
}
function schedule(delay){if(timer)clearTimeout(timer);timer=setTimeout(()=>tick('agendado'),Math.max(250,delay||800));}
function scheduleHeartbeat(){
  if(typeof document==='undefined')return;
  if(timer)clearTimeout(timer);
  const wait=failures?Math.min(300000,5000*Math.pow(2,Math.min(failures,6))):HEARTBEAT_MS;
  timer=setTimeout(()=>{if(!document.hidden)tick('heartbeat');else scheduleHeartbeat();},wait);
}
function duplicateClientGroups(clients){
  const list=Array.isArray(clients)?clients:[],parent=list.map((_,i)=>i),seen=new Map();
  const root=i=>parent[i]===i?i:(parent[i]=root(parent[i]));
  const join=(a,b)=>{a=root(a);b=root(b);if(a!==b)parent[b]=a;};
  list.forEach((c,i)=>{
    const ids=[];
    const code=String(c&&c.codigo!=null?c.codigo:'').replace(/\D/g,'').replace(/^0+/,'');
    const doc=String(c&&c.documento!=null?c.documento:'').replace(/\D/g,'');
    if(code&&code!=='0')ids.push('codigo:'+code);
    if(doc.length>=8)ids.push('documento:'+doc);
    ids.forEach(id=>{if(seen.has(id))join(i,seen.get(id));else seen.set(id,i);});
  });
  const groups=new Map();list.forEach((c,i)=>{const r=root(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(c);});
  return [...groups.values()].filter(g=>g.length>1);
}
function countClientRefs(clientId){
  let count=0,visited=new Set();
  function walk(value,depth){
    if(!value||typeof value!=='object'||depth>7||visited.has(value))return;visited.add(value);
    if(Array.isArray(value)){value.forEach(x=>walk(x,depth+1));return;}
    for(const k of Object.keys(value)){
      if(/^(cliente_?id|id_?cliente)$/i.test(k)&&String(value[k])===String(clientId))count++;
      else walk(value[k],depth+1);
    }
  }
  if(typeof db!=='undefined')for(const k of Object.keys(db)){if(k!=='clientes')walk(db[k],0);}
  return count;
}
function replaceClientRefs(fromId,toId){
  let changed=0,visited=new Set();
  function walk(value,depth){
    if(!value||typeof value!=='object'||depth>7||visited.has(value))return;visited.add(value);
    if(Array.isArray(value)){value.forEach(x=>walk(x,depth+1));return;}
    for(const k of Object.keys(value)){
      if(/^(cliente_?id|id_?cliente)$/i.test(k)&&String(value[k])===String(fromId)){value[k]=toId;changed++;}
      else walk(value[k],depth+1);
    }
  }
  for(const k of Object.keys(db)){if(k!=='clientes')walk(db[k],0);}
  return changed;
}
function analyzeDuplicateClients(){
  const groups=duplicateClientGroups(typeof db!=='undefined'?db.clientes:[]);
  return {groups,groupsCount:groups.length,extraCount:groups.reduce((n,g)=>n+g.length-1,0)};
}
async function mergeDuplicateClients(){
  const analysis=analyzeDuplicateClients();if(!analysis.extraCount)return {removed:0,groups:0,references:0};
  if(window.DIGICOPY_INDEXED_DB)await window.DIGICOPY_INDEXED_DB.writeRecoverySnapshot('antes_unir_clientes',db);
  const removeIds=new Set();let references=0;
  for(const group of analysis.groups){
    const ranked=group.map((c,index)=>({c,index,refs:countClientRefs(c.id),filled:Object.values(c||{}).filter(v=>v!==null&&v!==undefined&&v!=='').length})).sort((a,b)=>b.refs-a.refs||b.filled-a.filled||a.index-b.index);
    const canonical=ranked[0].c;
    for(const item of ranked.slice(1)){
      const duplicate=item.c;
      for(const k of Object.keys(duplicate||{}))if((canonical[k]===null||canonical[k]===undefined||canonical[k]==='')&&duplicate[k]!==undefined)canonical[k]=duplicate[k];
      references+=replaceClientRefs(duplicate.id,canonical.id);removeIds.add(String(duplicate.id));
    }
  }
  db.clientes=db.clientes.filter(c=>!removeIds.has(String(c.id)));
  applying=true;try{if(typeof saveDBAgora==='function')saveDBAgora();else if(typeof saveDB==='function')saveDB();}finally{applying=false;}
  schedule(200);
  return {removed:removeIds.size,groups:analysis.groupsCount,references};
}

async function resetCloudOnly(){
  if(busy)throw new Error('Aguarde a sincronização atual terminar.');
  const call=api();if(!call)throw new Error('API Cloudflare não carregada.');
  if(window.DIGICOPY_INDEXED_DB)await window.DIGICOPY_INDEXED_DB.writeRecoverySnapshot('antes_zerar_nuvem',db);
  const result=await call('/v1/admin/reset-cloud',{method:'POST',body:JSON.stringify({confirmation:'APAGAR NUVEM'})});
  state={cursor:0,versions:{},hashes:{},known:{},initialPull:true,lastOk:0,paused:true,heldLocalOnly:[],pauseReason:'escolha-inicial',cloudGeneration:result.generation};
  outbox=[];failures=0;lastError='';
  try{localStorage.removeItem(CONFLICT_KEY);}catch(e){}
  persist();indicator(false,'Escolha o que fazer com os dados deste PC');
  return {result,paused:true};
}
// Opção 1 da escolha: enviar os dados atuais deste PC para a nuvem.
// Cada registro sobe pelo próprio id, então reenviar o mesmo dado atualiza em
// vez de criar cópia.
async function publishLocalToCloud(){
  const antes={held:(state.heldLocalOnly||[]).slice(),reason:state.pauseReason||''};
  state.heldLocalOnly=[];state.pauseReason='';state.paused=false;state.initialPull=true;state.regras=REGRAS;persist();
  const synced=await tick('publicacao-manual-completa');
  // Remessa grande não cabe numa tacada só, e a nuvem pode pedir calma no meio.
  // A escolha já foi feita: a sincronização FICA LIGADA e o resto sobe sozinho
  // em segundo plano. Voltar a pausar aqui era o que fazia tudo parar num 503.
  if(!synced){
    if(!authorized()){state.paused=true;state.heldLocalOnly=antes.held;state.pauseReason=antes.reason||'escolha-inicial';persist();throw new Error('Este computador perdeu a autorização da nuvem.');}
    schedule(4000);
  }
  return true;
}
// Opção 2 da escolha: não enviar o que já existe aqui. Os registros atuais
// ficam só neste PC e a nuvem passa a sincronizar normalmente daí em diante.
async function manterLocalSemEnviar(){
  const snap=localKeysSnapshot();
  const extras=planNaoAutorizarLocal([...snap], state.known);
  state.heldLocalOnly=extras;
  state.paused=false;state.pauseReason='';state.initialPull=true;state.regras=REGRAS;persist();
  await tick('escolha-nao-enviar');
  return extras.length;
}
function planNaoAutorizarLocal(localKeys, known){
  const extras=[];
  (localKeys||[]).forEach(k=>{ if(k && !(known&&known[k])) extras.push(k); });
  return extras;
}
async function discardLocalKeepCloud(){
  if(busy)throw new Error('Aguarde a sincronização atual terminar.');
  if(!authorized())throw new Error('Este computador não está autorizado na nuvem.');
  const call=api();if(!call)throw new Error('API Cloudflare não carregada.');
  busy=true;
  try{
    if(window.DIGICOPY_DB_READY)await window.DIGICOPY_DB_READY;
    if(window.DIGICOPY_INDEXED_DB)await window.DIGICOPY_INDEXED_DB.writeRecoverySnapshot('antes_nao_autorizar_local',db);
    const savedOutbox=outbox.slice();
    const savedState=JSON.parse(JSON.stringify(state));
    outbox=[];
    state.heldLocalOnly=[];
    state.cursor=0;
    state.versions={};
    state.hashes={};
    state.known={};
    persist();
    await pullAll();
    if(!Object.keys(state.known).length){
      outbox=savedOutbox;
      state=Object.assign(loadState(),savedState);
      persist();
      throw new Error('A nuvem está vazia. Nada foi apagado neste PC nem na nuvem.');
    }
    const snap=localKeysSnapshot();
    const extras=planNaoAutorizarLocal([...snap], state.known);
    const removed=await reconcileFirstAuthorizedDevice(snap);
    outbox=outbox.filter(x=>x&&x.key&&state.known[x.key]);
    state.heldLocalOnly=[];
    state.paused=false;
    state.pauseReason='';
    persist();
    return {removed:Number(removed)||extras.length, extras:extras.length, cloudUntouched:true};
  }finally{busy=false;}
}
function pendingEstimate(){
  const pending=pendingKeys();let total=pending.size;
  const MAPA=definicoes();
  for(const entity of Object.keys(MAPA)){
    const entries=entriesFor(entity,MAPA[entity]),present=new Set();
    for(const entry of entries){const k=key(entity,entry.id);present.add(k);if(!pending.has(k)&&state.hashes[k]!==hash(entry.data))total++;}
    for(const k of Object.keys(state.known)){if(k.startsWith(entity+'|')&&!present.has(k)&&!pending.has(k))total++;}
  }
  return total;
}
function info(){return {authorized:authorized(),busy,paused:!!state.paused,pauseReason:state.pauseReason||'',heldLocalOnly:Array.isArray(state.heldLocalOnly)?state.heldLocalOnly.length:0,cursor:Number(state.cursor)||0,outbox:outbox.length,pending:pendingEstimate(),lastOk:state.lastOk||0,lastError,conflicts:(()=>{try{return JSON.parse(localStorage.getItem(CONFLICT_KEY)||'[]');}catch(e){return [];}})()};}

window.DIGICOPY_CLOUD_SYNC={tick,info,resetCloudOnly,publishLocalToCloud,manterLocalSemEnviar,analyzeDuplicateClients,mergeDuplicateClients,duplicateClientGroups,decideReinstallGuard,localBusinessCount,listLocalOnlyKeys,hash,clean,definitions:DEFINITIONS,definicoes};

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
