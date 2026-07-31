// Teste do firebase_client.js — helpers puros (FIRE_PURE) + integração
// completa contra um "Firestore" simulado em memória (sem rede).
// Uso: node test_firebase.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/firebase_client.js', 'utf8');

let pass = 0, fail = 0;
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

// ══ Parte 1: helpers puros ══
const m = src.match(/\/\* FIRE_PURE_START \*\/([\s\S]*?)\/\* FIRE_PURE_END \*\//);
if(!m){ console.error('FALHOU: seção FIRE_PURE não encontrada'); process.exit(1); }
eval(m[1]);

console.log('== fireParseQuery ==');
{
  const q1 = fireParseQuery('app_state?select=data&key=eq.digicopy_erp_v2_meta&limit=1');
  ok('eq + limit', q1.table==='app_state' && q1.limit===1 && q1.filtros[0].op==='eq' && q1.filtros[0].value==='digicopy_erp_v2_meta');
  const q2 = fireParseQuery('app_state?select=key,data&key=like.' + encodeURIComponent('digicopy_erp_v2__vendas__p') + '*&limit=500');
  ok('like → prefixo', q2.filtros[0].op==='prefixo' && q2.filtros[0].value==='digicopy_erp_v2__vendas__p');
  const q3 = fireParseQuery('app_state?key=in.(a,b,c)');
  ok('in → lista', q3.filtros[0].op==='in' && q3.filtros[0].value.length===3);
  const q4 = fireParseQuery('app_state?on_conflict=key');
  ok('on_conflict (upsert)', q4.onConflict==='key');
}

console.log('== fireChunkString ==');
{
  ok('string pequena = 1 pedaço', fireChunkString('abc', 10).length===1);
  const partes = fireChunkString('x'.repeat(25), 10);
  ok('25 chars em 10 → 3 pedaços', partes.length===3 && partes.join('').length===25 && partes[2].length===5);
  ok('remontagem idêntica', partes.join('')==='x'.repeat(25));
}

console.log('== fireMontarWrites + fireAgruparDocs (documentos grandes) ==');
{
  const BASE='https://x/documents';
  const grande = JSON.stringify({lista:['y'.repeat(1300000)]}); // > 1 MiB: Firestore recusaria sem chunking
  const writes = fireMontarWrites(BASE, [
    {key:'digicopy_erp_v2__vendas__p0', data:{lista:[1,2,3]}, updated_at:'2026-07-30T00:00:00Z'},
    {key:'digicopy_erp_v2__leituras__p0', data:JSON.parse(grande), updated_at:'2026-07-30T00:00:00Z'}
  ]);
  const baseDocs = writes.filter(w=>!fireEhChunkNome(w.update.name));
  const chunks   = writes.filter(w=> fireEhChunkNome(w.update.name));
  ok('doc pequeno vira 1 write sem pedaços', writes.length>=2 && baseDocs.length===2);
  ok('doc grande dividido (base + 3 pedaços)', chunks.length===3 && chunks.every(c=>c.update.fields.key.stringValue==='digicopy_erp_v2__leituras__p0'));
  ok('nenhum pedaço passa de 600 mil caracteres', chunks.every(c=>c.update.fields.data.stringValue.length<=600000));
  // simula o armazenamento e a releitura
  const docsArm = writes.map(w=>w.update);
  const linhas = fireAgruparDocs(docsArm);
  const lv = linhas.find(l=>l.key==='digicopy_erp_v2__leituras__p0');
  const pv = linhas.find(l=>l.key==='digicopy_erp_v2__vendas__p0');
  ok('doc pequeno relido', pv && pv.data.lista.length===3);
  ok('doc grande remontado íntegro', lv && JSON.stringify(lv.data)===grande);
}

console.log('== fireAgruparDocs: pedaços órfãos (rastro de delete) são ignorados ==');
{
  const orfaos = fireAgruparDocs([
    {name:'b/app_state/digit__c0000', fields:{key:{stringValue:'digit'}, data:{stringValue:'"x"'}}},
    {name:'b/app_state/digit__c0001', fields:{key:{stringValue:'digit'}, data:{stringValue:'"y"'}}}
  ]);
  ok('sem documento-base → chave não existe', orfaos.length===0);
}

console.log('== fireChunkCommits ==');
{
  const lotes = fireChunkCommits(new Array(620).fill({update:{}}), 250);
  ok('620 writes → 3 lotes', lotes.length===3 && lotes[2].length===120);
}

// ══ Parte 2: integração ponta-a-ponta com Firestore simulado ══
function firestoreSimulado(){
  const docs = new Map();
  async function fetchMock(url, opts){
    opts = opts || {};
    const u = String(url).split('?')[0];
    if(u.endsWith(':runQuery')){
      const body = JSON.parse(opts.body);
      const fs_ = body.structuredQuery.where.compositeFilter.filters;
      const lo = fs_[0].fieldFilter.value.stringValue, hi = fs_[1].fieldFilter.value.stringValue;
      const arr = [];
      for(const d of docs.values()){
        const k = d.fields.key.stringValue;
        if(k>=lo && k<hi) arr.push({document: JSON.parse(JSON.stringify(d))});
      }
      arr.sort((a,b)=>a.document.fields.key.stringValue<b.document.fields.key.stringValue?-1:1);
      return {ok:true, status:200, text:async()=>JSON.stringify(arr)};
    }
    if(u.endsWith(':commit')){
      const body = JSON.parse(opts.body);
      (body.writes||[]).forEach(w=>{
        if(w.update) docs.set(w.update.name, JSON.parse(JSON.stringify(w.update)));
        if(w.delete) docs.delete(w.delete);
      });
      return {ok:true, status:200, text:async()=>'{}'};
    }
    if((opts.method||'GET')==='GET'){
      if(docs.has(u)) return {ok:true, status:200, text:async()=>JSON.stringify(docs.get(u))};
      return {ok:false, status:404, text:async()=>JSON.stringify({error:{code:404, message:'not found'}})};
    }
    return {ok:false, status:400, text:async()=>JSON.stringify({error:{message:'mock não suporta'}})};
  }
  return {fetchMock, docs};
}

(async function main(){
  console.log('== Integração: publicar → ler → apagar (Firestore simulado) ==');
  const {fetchMock, docs} = firestoreSimulado();
  const internals = { supabaseRequest: null };
  const windowMock = {
    FIREBASE_CONFIG: { apiKey:'AIzaTESTE_INTEGRACAO', projectId:'projeto-teste' },
    __supabaseSyncInternals: internals
  };
  new Function('window','document','fetch','toast','escapeHtml', src)(
    windowMock, undefined, fetchMock, undefined, undefined);
  const req = windowMock.supabaseRequest;
  ok('shim instalado no lugar do transporte', typeof req==='function');
  ok('backend marcado como firebase', internals.nome==='firebase');

  // 1) nuvem vazia: meta não existe
  const vazio = await req('app_state?select=data&key=eq.digicopy_erp_v2_meta&limit=1', {method:'GET'});
  ok('meta inexistente → lista vazia (igual PostgREST)', Array.isArray(vazio) && vazio.length===0);

  // 2) publica meta + 2 partes (1 delas gigante)
  const gigante = {lista:[{texto:'z'.repeat(1300000)}]};
  await req('app_state?on_conflict=key', {method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
    body: JSON.stringify({key:'digicopy_erp_v2_meta', data:{versao:2, totalRegistros:5}, updated_at:'2026-07-30T10:00:00Z'})});
  await req('app_state?on_conflict=key', {method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
    body: JSON.stringify([{key:'digicopy_erp_v2__clientes__p0', data:{lista:[{id:'c1'}]}, updated_at:'2026-07-30T10:00:00Z'},
                          {key:'digicopy_erp_v2__leituras__p0', data:gigante, updated_at:'2026-07-30T10:00:00Z'}])});
  const metaLida = await req('app_state?select=data&key=eq.digicopy_erp_v2_meta&limit=1', {method:'GET'});
  ok('meta publicada e relida', metaLida.length===1 && metaLida[0].data.totalRegistros===5);
  ok('parte gigante foi fatiada no servidor simulado', [...docs.keys()].some(n=>n.includes('__c0000')));

  // 3) leitura por prefixo (como o carregamento paralelo faz)
  const clientes = await req('app_state?select=key,data&key=like.' + encodeURIComponent('digicopy_erp_v2__clientes__p') + '*&limit=500', {method:'GET'});
  ok('prefixo clientes → 1 parte lógica', clientes.length===1 && clientes[0].data.lista[0].id==='c1');
  const leituras = await req('app_state?select=key,data&key=like.' + encodeURIComponent('digicopy_erp_v2__leituras__p') + '*&limit=500', {method:'GET'});
  ok('prefixo leituras → gigante remontada', leituras.length===1 && leituras[0].data.lista[0].texto.length===1300000);

  // 4) re-publica a parte gigante agora PEQUENA (chunks antigos não podem vazar)
  await req('app_state?on_conflict=key', {method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
    body: JSON.stringify({key:'digicopy_erp_v2__leituras__p0', data:{lista:[{id:'pequena'}]}, updated_at:'2026-07-30T11:00:00Z'})});
  const leit2 = await req('app_state?select=key,data&key=like.' + encodeURIComponent('digicopy_erp_v2__leituras__p') + '*&limit=500', {method:'GET'});
  ok('versão pequena prevalece (chunks antigos ignorados)', leit2.length===1 && leit2[0].data.lista[0].id==='pequena');

  // 5) remoção de parte órfã
  await req('app_state?key=eq.' + encodeURIComponent('digicopy_erp_v2__clientes__p0'), {method:'DELETE', headers:{Prefer:'return=minimal'}});
  const depois = await req('app_state?select=key,data&key=like.' + encodeURIComponent('digicopy_erp_v2__clientes__p') + '*&limit=500', {method:'GET'});
  ok('parte apagada some da listagem', depois.length===0);

  // 6) filtro in.(...)
  const em = await req('app_state?key=in.(digicopy_erp_v2_meta,inexistente)', {method:'GET'});
  ok('in.(...) retorna só o que existe', em.length===1 && em[0].key==='digicopy_erp_v2_meta');

  console.log(`\nRESULTADO: ${pass} passaram, ${fail} falharam`);
  process.exit(fail ? 1 : 0);
})().catch(e=>{ console.error('ERRO NO TESTE:', e); process.exit(1); });
