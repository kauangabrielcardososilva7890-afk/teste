// Teste da persistência local incremental do app.js (v4.4.0)
// Simula window/localStorage e extrai o trecho de persistência do app.js.
// Uso: node test_persist.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/app.js', 'utf8');
const ini = src.indexOf("const APP_VERSION=");
const fim = src.indexOf("let db=loadDB();");
if(ini<0 || fim<0){ console.error('FALHOU: trecho de persistência não encontrado no app.js'); process.exit(1); }
const trecho = src.slice(ini, fim) + "let db=loadDB();";

// ── Ambiente simulado ──
function novoLocalStorage(){
  const map = new Map();
  return {
    _map: map,
    gravacoes: [],
    getItem(k){ return map.has(k) ? map.get(k) : null; },
    setItem(k,v){ this.gravacoes.push(String(k)); map.set(String(k), String(v)); },
    removeItem(k){ map.delete(String(k)); },
  };
}
let pass = 0, fail = 0;
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

function novaInstancia(){
  const ls = novoLocalStorage();
  const window = { __dbPersistidoOk:false };
  const toast = ()=>{};
  const document = { addEventListener(){}, visibilityState:'visible' };
  const fn = new Function('localStorage','window','toast','document',
    trecho + '\nreturn {db, saveDB:()=>{saveDB(); __saveDBDrainSync();}, loadDB, gravarSnapshotLegado, DB_KEY, DB_MANIFEST_KEY, DB_PART_PREFIX, storageEncode};');
  return Object.assign(fn(ls, window, toast, document), {ls, window});
}

console.log('== 1ª gravação: cria manifesto e partes ==');
{
  const A = novaInstancia();
  A.db.clientes.push({id:'c1', nome:'Padaria Central'});
  A.saveDB();
  ok('manifesto criado', !!A.ls.getItem(A.DB_MANIFEST_KEY));
  ok('parte de clientes criada', !!A.ls.getItem(A.DB_PART_PREFIX+'clientes__'+encodeURIComponent('#0')));
  const rec = A.loadDB();
  ok('relê o cliente gravado', rec.clientes.length===1 && rec.clientes[0].nome==='Padaria Central');
}

console.log('== Incremental: sem mudança não regrava partes ==');
{
  const A = novaInstancia();
  A.db.vendas.push({id:'v1', total:10});
  A.saveDB();
  A.ls.gravacoes.length = 0;
  A.saveDB(); // nenhuma mudança
  const partesRegravadas = A.ls.gravacoes.filter(k=>k.startsWith(A.DB_PART_PREFIX));
  ok('nenhuma parte regravada', partesRegravadas.length===0);
  ok('manifesto atualizado só', A.ls.gravacoes.includes(A.DB_MANIFEST_KEY));
}

console.log('== Incremental: mudança em 1 entidade só regrava ela ==');
{
  const A = novaInstancia();
  for(let i=0;i<1500;i++) A.db.leituras.push({id:'l'+i, valor:i});
  A.db.clientes.push({id:'c1'});
  A.saveDB();
  const partesLeiturasAnt = A.ls.gravacoes.filter(k=>k.includes('leituras'));
  ok('lista grande virou 3 pedaços (1500/600)', partesLeiturasAnt.length===3);
  A.ls.gravacoes.length = 0;
  A.db.clientes.push({id:'c2'});           // só clientes mudou
  A.saveDB();
  const partes = A.ls.gravacoes.filter(k=>k.startsWith(A.DB_PART_PREFIX));
  ok('só pedaço de clientes regravado', partes.length===1 && partes[0].includes('clientes'));
  ok('nada de leituras regravado', !partes.some(k=>k.includes('leituras')));
}

console.log('== Pedaço interno: editar 1 item só regrava 1 pedaço da lista ==');
{
  const A = novaInstancia();
  for(let i=0;i<1500;i++) A.db.leituras.push({id:'l'+i, valor:i});
  A.saveDB();
  A.ls.gravacoes.length = 0;
  A.db.leituras[1200].valor = 99999;        // item no pedaço #2
  A.saveDB();
  const partes = A.ls.gravacoes.filter(k=>k.startsWith(A.DB_PART_PREFIX));
  ok('apenas o pedaço #2 regravado', partes.length===1 && partes[0].includes('leituras__'+encodeURIComponent('#2')));
  const rec = A.loadDB();
  ok('relê todas as 1500 leituras montadas dos pedaços', rec.leituras.length===1500 && rec.leituras[1200].valor===99999);
}

console.log('== Lista encolhendo: pedaços órfãos são apagados ==');
{
  const A = novaInstancia();
  for(let i=0;i<1500;i++) A.db.leituras.push({id:'l'+i});
  A.saveDB();
  A.db.leituras = A.db.leituras.slice(0, 500);
  A.saveDB();
  const rec = A.loadDB();
  ok('relê somente 500', rec.leituras.length===500);
  const chaves = [...A.ls._map.keys()].filter(k=>k.includes('leituras'));
  ok('ficou apenas o pedaço #0', chaves.length===1 && chaves[0].includes(encodeURIComponent('#0')));
}

console.log('== Objetos grandes (modulosDinamicos): 1 pedaço por chave ==');
{
  const A = novaInstancia();
  for(let i=0;i<10;i++) A.db.modulosDinamicos['tabela_'+i] = {dados:[{a:i}]};
  A.saveDB();
  A.ls.gravacoes.length = 0;
  A.db.modulosDinamicos['tabela_5'] = {dados:[{a:'ALTERADO'}]};
  A.saveDB();
  const partes = A.ls.gravacoes.filter(k=>k.startsWith(A.DB_PART_PREFIX));
  ok('só a chave alterada regravada', partes.length===1 && partes[0].includes('tabela_5'));
  const rec = A.loadDB();
  ok('objeto remontado com as 10 tabelas', Object.keys(rec.modulosDinamicos).length===10 && rec.modulosDinamicos['tabela_5'].dados[0].a==='ALTERADO');
}

console.log('== Ciclo completo: simular reload (nova instância no MESMO storage) ==');
{
  const A = novaInstancia();
  A.db.vendas.push({id:'v99', total:321});
  A.saveDB();
  // nova instância compartilhando o mesmo Map = reabrir o programa
  const B = (function(ls){
    const window = { __dbPersistidoOk:false };
    const fn = new Function('localStorage','window','toast','document',
      trecho + '\nreturn {db, loadDB, DB_KEY, DB_MANIFEST_KEY, DB_PART_PREFIX};');
    return fn(ls, window, ()=>{}, {addEventListener(){}, visibilityState:'visible'});
  })(A.ls);
  ok('db carregado das partes ao reabrir', B.db.vendas.length===1 && B.db.vendas[0].id==='v99');
}

console.log('== Fallback: base antiga de chave única (pré v4.4.0) continua lendo ==');
{
  const A = novaInstancia();
  const antigo = Object.assign({}, A.db, {clientes:[{id:'cx', nome:'Legado'}]});
  A.ls.setItem(A.DB_KEY, JSON.stringify(antigo));     // só a chave única antiga, sem manifesto
  A.ls.removeItem(A.DB_MANIFEST_KEY);
  const rec = A.loadDB();
  ok('lê a chave antiga', rec.clientes.length===1 && rec.clientes[0].nome==='Legado');
}

console.log(`\nRESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
