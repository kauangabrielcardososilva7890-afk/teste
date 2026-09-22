import assert from 'node:assert/strict';
import fs from 'node:fs';

const API=process.env.API_URL||'http://127.0.0.1:8787';
const SECRET=process.env.TEST_SETUP_SECRET||'test-secret-123';
const engineCode=fs.readFileSync(new URL('../cloudflare_data_sync_patch.js',import.meta.url),'utf8');

class MemoryStorage{
  constructor(){this.map=new Map();}
  getItem(k){return this.map.has(k)?this.map.get(k):null;}
  setItem(k,v){this.map.set(k,String(v));}
  removeItem(k){this.map.delete(k);}
}
async function request(path,{token,headers={},...options}={}){
  const response=await fetch(API+path,{...options,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{}),...headers}});
  const data=await response.json();
  if(!response.ok)throw Object.assign(new Error(data.message||'HTTP '+response.status),{status:response.status,data});
  return data;
}
async function makeEngine(db,deviceToken,role,activation){
  const storage=new MemoryStorage();
  storage.setItem('device-token',deviceToken);
  const window={DIGICOPY_CLOUD:{token:()=>storage.getItem('device-token'),deviceInfo:()=>({id:'test_'+role,role,activation:activation||(role==='admin'?'initial':'invite')}),api:(path,options)=>request(path,{...(options||{}),token:storage.getItem('device-token')})}};
  let saves=0;
  const run=new Function('window','localStorage','document','db','saveDB','saveDBAgora',engineCode+'\nreturn window.DIGICOPY_CLOUD_SYNC;');
  const engine=run(window,storage,undefined,db,()=>{saves++;},()=>{saves++;});
  return {engine,storage,get saves(){return saves;}};
}

console.log('== CLIENTE LOCAL-FIRST × D1 REAL LOCAL ==');
const setup=await request('/v1/setup',{method:'POST',headers:{'x-setup-secret':SECRET},body:JSON.stringify({deviceName:'PC A'})});
const tokenA=setup.token;
const invite=await request('/v1/invites',{method:'POST',token:tokenA,body:JSON.stringify({role:'device',minutes:15})});
const enroll=await request('/v1/enroll',{method:'POST',body:JSON.stringify({deviceName:'PC B',code:invite.code})});
const tokenB=enroll.token;

const dbA={
  empresas:[],usuarios:[],clientes:[{id:'cli_1',nome:'Cliente Original',empresaId:'emp_digicopy'}],
  produtos:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],
  contasReceber:[],contasPagar:[],logs:[],tecnicos:[],notificacoes:[],config:{empresa:{nome:'DIGICOPY'}},modulosDinamicos:{}
};
const a=await makeEngine(dbA,tokenA,'admin');
assert.equal(await a.engine.tick('teste-inicial'),true);
let cloud=await request('/v1/changes?cursor=0',{token:tokenA});
assert.ok(cloud.changes.some(x=>x.entity==='clientes'&&x.data.nome==='Cliente Original'));
console.log('  ✔ PC A publicou somente registros locais versionados');

const dbB={empresas:[],usuarios:[],clientes:[{id:'stale_1',codigo:'999',nome:'Cliente antigo só do navegador'}],produtos:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[],contasPagar:[],logs:[],tecnicos:[],notificacoes:[],config:{},modulosDinamicos:{}};
const b=await makeEngine(dbB,tokenB,'device');
assert.equal(await b.engine.tick('primeira-carga'),true);
// v6.1.5 — ORDEM DO DONO (22/09/2026): "TUDO O QUE EU CRIAR VAI PRA NUVEM".
// O PC que entra agora NÃO isola mais o que já tem: ele baixa a nuvem E sobe o
// que criou aqui (por id — o que já existe é ATUALIZADO, não duplica). Antes o
// histórico local deste PC ficava só nele, e era isso que fazia "criei num PC e
// não aparece no outro".
assert.equal(dbB.clientes.length,2);
assert.equal(dbB.clientes.find(c=>c.id==='cli_1').nome,'Cliente Original');
cloud=await request('/v1/changes?cursor=0',{token:tokenA});
assert.ok(cloud.changes.some(x=>x.recordId==='stale_1'),'o que o PC B criou também sobe para a nuvem');
console.log('  ✔ PC B baixou a nuvem e publicou o que criou aqui (nada fica preso num PC só)');

const recovered=await request('/v1/recover',{method:'POST',headers:{'x-setup-secret':SECRET},body:JSON.stringify({deviceName:'PC Admin Recuperado'})});
const dbC={empresas:[],usuarios:[],clientes:[{id:'stale_admin',codigo:'998',nome:'Histórico velho no admin recuperado'}],produtos:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[],contasPagar:[],logs:[],tecnicos:[],notificacoes:[],config:{},modulosDinamicos:{}};
const c=await makeEngine(dbC,recovered.token,'admin','recovery');
assert.equal(await c.engine.tick('admin-recuperado'),true);
assert.equal(dbC.clientes.length,3); // cli_1 + stale_1 (do PC B) + stale_admin (deste PC)
assert.ok(dbC.clientes.some(x=>x.id==='cli_1'),'o PC recuperado recebeu a base da nuvem');
cloud=await request('/v1/changes?cursor=0',{token:tokenA});
assert.ok(cloud.changes.some(x=>x.recordId==='stale_admin'),'e também subiu o que tinha neste PC');
console.log('  ✔ administrador recuperado baixa a nuvem e sobe o que tinha (nada fica só num PC)');

const cliB=dbB.clientes.find(c=>c.id==='cli_1');
cliB.nome='Cliente Editado no B';
assert.equal(await b.engine.tick('edicao-b'),true);
assert.equal(await a.engine.tick('recebe-edicao'),true);
assert.equal(dbA.clientes.find(c=>c.id==='cli_1').nome,'Cliente Editado no B');
console.log('  ✔ edição do PC B chegou ao PC A');

// Exclusão de propósito (é assim que o sistema marca: quem apaga pela tela
// avisa antes; nada é apagado sozinho no outro PC nem na nuvem).
globalThis.DIGICOPY_EXCLUSAO_INTENCIONAL && globalThis.DIGICOPY_EXCLUSAO_INTENCIONAL();
a.engine.marcarIntencaoDeExcluir && a.engine.marcarIntencaoDeExcluir();
dbA.clientes=dbA.clientes.filter(c=>c.id!=='cli_1');
assert.equal(await a.engine.tick('exclusao-a'),true);
// O sistema confere duas vezes antes de mandar apagar (respiro de 3s): é assim
// que um apagão por base abrindo pela metade nunca vira exclusão na nuvem.
await new Promise(r=>setTimeout(r,3600));
assert.equal(await a.engine.tick('exclusao-a-confirma'),true,'a exclusão só sai depois da confirmação');
assert.equal(await b.engine.tick('recebe-exclusao'),true);
assert.ok(!dbB.clientes.some(c=>c.id==='cli_1'),'a exclusão chegou ao PC B');
const deleted=await request('/v1/deleted',{token:tokenA});
assert.ok(deleted.records.some(r=>r.recordId==='cli_1'&&r.data.nome==='Cliente Editado no B'));
console.log('  ✔ exclusão propagou e preservou o conteúdo no D1');

await request('/v1/restore',{method:'POST',token:tokenA,body:JSON.stringify({entity:'clientes',recordId:'cli_1',mutationId:'restore_client_test'})});
assert.equal(await b.engine.tick('recebe-restauracao'),true);
assert.equal(dbB.clientes.find(c=>c.id==='cli_1').nome,'Cliente Editado no B');
assert.equal(await a.engine.tick('recebe-restauracao-a'),true);
assert.equal(dbA.clientes.find(c=>c.id==='cli_1').nome,'Cliente Editado no B');
console.log('  ✔ restauração administrativa devolveu o cliente');

await request('/v1/devices/revoke',{method:'POST',token:tokenA,body:JSON.stringify({deviceId:enroll.device.id})});
await request('/v1/devices/revoke',{method:'POST',token:tokenA,body:JSON.stringify({deviceId:recovered.device.id})});
const reset=await a.engine.resetCloudOnly();
console.log('  · info depois do reset:',JSON.stringify({paused:a.engine.info().paused,motivo:a.engine.info().pauseReason,reset:reset.paused}));
assert.equal(reset.paused,true);
let emptyStatus=await request('/v1/status',{token:tokenA});
assert.equal(emptyStatus.totals.records,0);
assert.equal(await a.engine.tick('nao-pode-auto-publicar'),false);
emptyStatus=await request('/v1/status',{token:tokenA});
assert.equal(emptyStatus.totals.records,0);
assert.equal(await a.engine.publishLocalToCloud(),true);
const infA=a.engine.info();
console.log('  · estado depois de publicar:',JSON.stringify({paused:infA.paused,outbox:infA.outbox,pending:infA.pending,lastError:infA.lastError,clientesNestePC:dbA.clientes.length}));
const republished=await request('/v1/status',{token:tokenA});
console.log('  · status cru:',JSON.stringify(republished.totals));
assert.ok(republished.totals.records>=1,'a base deste PC voltou para a nuvem');
console.log('  ✔ reset deixa nuvem vazia/pausada e só republica após ação explícita');

console.log('\nRESULTADO: sincronização real entre dois PCs simulados passou!');
