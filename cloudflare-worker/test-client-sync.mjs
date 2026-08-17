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
async function makeEngine(db,deviceToken,role){
  const storage=new MemoryStorage();
  storage.setItem('device-token',deviceToken);
  const window={DIGICOPY_CLOUD:{token:()=>storage.getItem('device-token'),deviceInfo:()=>({id:'test_'+role,role}),api:(path,options)=>request(path,{...(options||{}),token:storage.getItem('device-token')})}};
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
assert.equal(dbB.clientes.length,1);
assert.equal(dbB.clientes[0].nome,'Cliente Original');
cloud=await request('/v1/changes?cursor=0',{token:tokenA});
assert.ok(!cloud.changes.some(x=>x.recordId==='stale_1'));
console.log('  ✔ PC B baixou primeiro e não publicou seu histórico local antigo');

dbB.clientes[0].nome='Cliente Editado no B';
assert.equal(await b.engine.tick('edicao-b'),true);
assert.equal(await a.engine.tick('recebe-edicao'),true);
assert.equal(dbA.clientes[0].nome,'Cliente Editado no B');
console.log('  ✔ edição do PC B chegou ao PC A');

dbA.clientes.splice(0,1);
assert.equal(await a.engine.tick('exclusao-a'),true);
assert.equal(await b.engine.tick('recebe-exclusao'),true);
assert.equal(dbB.clientes.length,0);
const deleted=await request('/v1/deleted',{token:tokenA});
assert.equal(deleted.records[0].data.nome,'Cliente Editado no B');
console.log('  ✔ exclusão propagou e preservou o conteúdo no D1');

await request('/v1/restore',{method:'POST',token:tokenA,body:JSON.stringify({entity:'clientes',recordId:'cli_1',mutationId:'restore_client_test'})});
assert.equal(await b.engine.tick('recebe-restauracao'),true);
assert.equal(dbB.clientes[0].nome,'Cliente Editado no B');
console.log('  ✔ restauração administrativa devolveu o cliente');

console.log('\nRESULTADO: sincronização real entre dois PCs simulados passou!');
