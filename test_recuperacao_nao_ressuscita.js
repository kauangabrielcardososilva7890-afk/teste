// test_recuperacao_nao_ressuscita.js — v7.0.9
// Trava TRÊS defeitos provados nesta rodada, todos na recuperação do que foi
// apagado (motor de verdade + nuvem de mentira em memória):
//   1) a recuperação trazia de volta o que ELE apagou de propósito (a marca
//      `excluidosDeProposito` não era consultada) — e a nuvem, não só o painel;
//      a foto local deste PC (IndexedDB) tinha o mesmo buraco;
//   2) o aviso "falta publicar o motor novo" era DESCARTADO quando não havia
//      sessão aberta (o motor roda antes do login) e a marca de "já avisei"
//      ficava gravada — o dono nunca ficava sabendo;
//   3) com mais de 40.000 excluídos, a varredura batia o teto de 40 páginas e
//      a mesma passada era dada como COMPLETA: carimbava na nuvem que a
//      recuperação estava feita e o resto nunca mais era varrido.
const fs=require('fs');
let passou=0;
function ok(nome,cond){if(!cond){console.error('  \u2718 '+nome);process.exit(1);}console.log('  \u2714 '+nome);passou++;}
const realSetTimeout=globalThis.setTimeout;
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const notif=fs.readFileSync('notificacoes_patch.js','utf8');

console.log('== RECUPERAÇÃO NÃO RESSUSCITA O QUE ELE APAGOU (v7.0.9) ==');

// ── nuvem de mentira: diário, registros, excluídos, restauração ─────────────
function nuvemDeMentira(excluidos,opcoes){
  opcoes=opcoes||{};
  const nuvem={records:{},diario:[],restaurados:[],pedidos:[],foraDoAr:false};
  (excluidos||[]).forEach(e=>{
    nuvem.records[e.entity+'|'+e.recordId]={entity:e.entity,recordId:e.recordId,data:e.data,version:e.version||3,deletedAt:e.deletedAt||1700000000000};
  });
  nuvem.api=async(p,o)=>{
    if(nuvem.foraDoAr)throw new Error('sem internet (teste)');
    if(p.indexOf('/v1/status')===0)return {ok:true,totals:{records:Object.keys(nuvem.records).length,cursor:nuvem.diario.length}};
    if(p.indexOf('/v1/deleted')===0){
      nuvem.pedidos.push(p);
      if(opcoes.paginar){return opcoes.paginar(p);}
      const list=(excluidos||[]).filter(e=>e.entity!=='x-mais').map(e=>({entity:e.entity,recordId:e.recordId,data:e.data,version:e.version||3,deletedAt:e.deletedAt||1700000000000}));
      const r={ok:true,records:list,temMais:false,proximoBefore:list.length?1700000000000:undefined};
      if(!opcoes.motorAntigo){
        r.proximoEntity=list.length?list[list.length-1].entity:undefined;
        r.proximoId=list.length?list[list.length-1].recordId:undefined;
      }
      return r;
    }
    if(p.indexOf('/v1/changes')===0&&(!o||o.method==='GET')){
      const m=/cursor=(\d+)&limit=(\d+)/.exec(p),cursor=Number(m[1]),limite=Number(m[2]);
      const fatia=nuvem.diario.filter(x=>x.seq>cursor).slice(0,limite);
      const ultimo=fatia.length?fatia[fatia.length-1].seq:cursor;
      return {ok:true,nextCursor:ultimo,hasMore:nuvem.diario.some(x=>x.seq>ultimo),changes:fatia};
    }
    if(p.indexOf('/v1/changes')===0&&o&&o.method==='POST'){
      const env=JSON.parse(o.body||'{}');
      const results=(env.mutations||[]).map((mu,i)=>{
        const k=mu.entity+'|'+mu.recordId,atual=nuvem.records[k];
        nuvem.records[k]={entity:mu.entity,recordId:mu.recordId,data:Object.assign({},mu.data),version:(atual?atual.version:0)+1};
        nuvem.diario.push({seq:nuvem.diario.length+1,entity:mu.entity,recordId:mu.recordId,operation:'upsert',data:nuvem.records[k].data,version:nuvem.records[k].version});
        return {index:i,ok:true,version:nuvem.records[k].version};
      });
      return {ok:true,results};
    }
    if(p.indexOf('/v1/restore')===0&&o&&o.method==='POST'){
      const b=JSON.parse(o.body||'{}');
      const atual=nuvem.records[b.entity+'|'+b.recordId];
      nuvem.restaurados.push(b.entity+'|'+b.recordId);
      if(atual){atual.deletedAt=null;atual.version++;}
      nuvem.diario.push({seq:nuvem.diario.length+1,entity:b.entity,recordId:b.recordId,operation:'upsert',data:atual&&atual.data,version:atual?atual.version:1});
      return {ok:true,restored:true,version:atual?atual.version:1};
    }
    throw new Error('rota não prevista no teste: '+p);
  };
  return nuvem;
}
function novoNavegador(base){
  const store=Object.assign({},base||{}),eventos={};
  const localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},
    removeItem:k=>{delete store[k];},get length(){return Object.keys(store).length;},key:i=>Object.keys(store)[i]||null};
  const janela={DIGICOPY_CLOUD:{token:()=>'tok',api:null},addEventListener:(n,fn)=>{(eventos[n]=eventos[n]||[]).push(fn);},
    removeEventListener:()=>{},logAction:()=>{},navigateTo:()=>{},saveDB:()=>true};
  const documento={hidden:false,activeElement:null,body:{},addEventListener:()=>{},removeEventListener:()=>{},
    querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null};
  return {janela,localStorage,store,documento};
}
// abre o sistema: sino de verdade (notificacoes_patch) + motor de verdade
function abrir(amb,dados,nuvem,sessao,idb){
  amb.janela.DIGICOPY_CLOUD.api=nuvem.api;
  if(idb)amb.janela.DIGICOPY_INDEXED_DB=idb;
  globalThis.setTimeout=()=>0;   // o motor não dispara relógio dentro do teste
  try{
    new Function('window','localStorage','document','db','getSession','uid',notif)
      (amb.janela,amb.localStorage,amb.documento,dados,()=>sessao,()=>'id'+Math.random());
    new Function('window','localStorage','document','db',code)(amb.janela,amb.localStorage,amb.documento,dados);
  }finally{globalThis.setTimeout=realSetTimeout;}
  return amb.janela.DIGICOPY_CLOUD_SYNC;
}
const dormir=ms=>new Promise(r=>realSetTimeout(r,ms));
const estadoDe=amb=>JSON.parse(amb.store['digicopy_cf_sync_state_v1']||'{}');

(async()=>{
  // ═══ 1) o que ele apagou de propósito não volta ═══════════════════════════
  console.log('-- 1) apagado DE PROPÓSITO por este PC --');
  const apagadoDeProposito={entity:'contratos',recordId:'C1',data:{id:'C1',numero:'CT-1',criadoPor:'usr_1'}};
  const perdidoPeloBug={entity:'parque',recordId:'P9',data:{id:'P9',modelo:'HP',criadoPor:'usr_1'}};
  {
    const nuvem=nuvemDeMentira([apagadoDeProposito,perdidoPeloBug]);
    const dados={contratos:[],parque:[],config:{},_seq:{}};
    const primeiro=novoNavegador();
    abrir(primeiro,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    // este PC registrou que apagou o C1 de propósito (marca que já era usada no "voltou")
    const st=estadoDe(primeiro);st.excluidosDeProposito={'contratos|C1':{em:Date.now(),v:3}};
    primeiro.store['digicopy_cf_sync_state_v1']=JSON.stringify(st);
    const amb=novoNavegador(primeiro.store);       // reabre o programa com a marca gravada
    const S=abrir(amb,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    await S.recuperarAutomatico();
    ok('o que ele apagou de propósito NÃO voltou ('+JSON.stringify(nuvem.restaurados)+')',
      nuvem.restaurados.indexOf('contratos|C1')<0);
    ok('o que foi perdido pelo defeito antigo VOLTOU (parque|P9) — a recuperação continua funcionando',
      nuvem.restaurados.indexOf('parque|P9')>=0);
    ok('a marca continua guardada (nada de perder o que ele apagou de propósito)',
      !!estadoDe(amb).excluidosDeProposito['contratos|C1']);
  }
  {
    // mesmo buraco na FOTO deste PC (IndexedDB): registro apagado de propósito
    const nuvem=nuvemDeMentira([]);
    const dados={contratos:[],parque:[],config:{},_seq:{}};
    const primeiro=novoNavegador();
    abrir(primeiro,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    const st=estadoDe(primeiro);st.excluidosDeProposito={'contratos|C1':{em:Date.now(),v:3}};
    primeiro.store['digicopy_cf_sync_state_v1']=JSON.stringify(st);
    const idb={listSnapshots:async()=>[{nome:'foto',data:{contratos:[
      {id:'C1',numero:'CT-1',criadoPor:'usr_1'},          // este ele apagou de propósito
      {id:'C2',numero:'CT-2',criadoPor:'usr_1'}           // este foi perdido de verdade
    ]}}]};
    const amb=novoNavegador(primeiro.store);
    const S=abrir(amb,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'},idb);
    const voltaram=await S.recuperarDasFotosLocais();
    const ids=(dados.contratos||[]).map(c=>c.id).sort();
    ok('foto deste PC: o apagado de propósito NÃO voltou',ids.indexOf('C1')<0);
    ok('foto deste PC: o perdido de verdade voltou ('+ids.join(',')+')',ids.indexOf('C2')>=0&&voltaram===1);
  }

  // ═══ 2) o aviso não se perde quando não há sessão ═════════════════════════
  console.log('-- 2) aviso do motor antigo SEM sessão aberta --');
  {
    const nuvem=nuvemDeMentira([perdidoPeloBug],{motorAntigo:true});
    const dados={contratos:[],parque:[],config:{},_seq:{}};
    const semSessao=novoNavegador();
    const S=abrir(semSessao,dados,nuvem,null);      // ninguém logado (tela de login)
    await S.recuperarAutomatico();
    await dormir(400);
    const st=estadoDe(semSessao);
    ok('sem sessão nada aparece no sino (o sino é por empresa)',(dados.notificacoes||[]).length===0);
    ok('mas o recado fica GUARDADO para depois',!!(st.recadosPendentes&&st.recadosPendentes['motor-antigo:5.26.7']));
    ok('e NÃO fica marcado como "já avisei"',!st.recadosEntregues);
    // agora ele entra no sistema: a próxima chance entrega o recado
    const amb=novoNavegador(semSessao.store);
    const S2=abrir(amb,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    const entregues=S2.entregarRecados();
    const lista=dados.notificacoes||[];
    const textos=lista.map(n=>String(n.texto)).join(' | ');
    ok('depois do login o aviso aparece no sino ('+entregues+' recado(s), '+lista.length+' no sino)',
      entregues>=1&&textos.indexOf('motor novo da nuvem')>=0);
    await dormir(400);   // a gravação do estado é agrupada (300 ms)
    const st2=estadoDe(amb);
    ok('agora sim fica marcado como avisado (não repete)',
      !!(st2.recadosEntregues&&st2.recadosEntregues['motor-antigo:5.26.7']));
    ok('e o recado sai da fila',!st2.recadosPendentes||!st2.recadosPendentes['motor-antigo:5.26.7']);
    const quantoAntes=(dados.notificacoes||[]).length;
    ok('a entrega é única (segunda chamada não duplica)',S2.entregarRecados()===0&&(dados.notificacoes||[]).length===quantoAntes);
  }

  // ═══ 3) lista maior que o teto: continua de onde parou ════════════════════
  console.log('-- 3) mais de 40.000 excluídos: não pode dizer "acabei" --');
  {
    let pagina=0;const paginasVistas=[];
    const TETO=40;                                  // igual ao motor
    const nuvem=nuvemDeMentira([],{paginar:(url)=>{
      const m=/before=(\d+)/.exec(url);
      const antes=m?Number(m[1]):0;
      paginasVistas.push(antes);
      pagina++;
      const base=antes?antes-1:1700000000000;                     // sempre "mais antigo"
      if(pagina>45)return {ok:true,records:[],temMais:false};     // a lista acabou na 45ª página
      const list=[];for(let i=0;i<1000;i++)list.push({entity:'leituras',recordId:'L'+pagina+'_'+i,data:{id:'x',criadoPor:'sistema'},version:3,deletedAt:base});
      return {ok:true,records:list,temMais:true,proximoBefore:base,proximoEntity:'leituras',proximoId:'L'+pagina+'_999'};
    }});
    const dados={leituras:[],config:{},_seq:{}};
    const amb=novoNavegador();
    const S=abrir(amb,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    await S.recuperarAutomatico();
    await dormir(400);
    const st=estadoDe(amb);
    ok('o 1º ciclo para no teto de '+TETO+' páginas ('+pagina+')',pagina===TETO);
    ok('NÃO carimba "recuperação feita" na nuvem',!dados.config.recuperacaoExcluidosEm);
    ok('NÃO avisa "motor antigo" (o motor está certo, faltou terminar)',
      !(st.recadosPendentes&&st.recadosPendentes['motor-antigo:5.26.7']));
    ok('guarda o cursor de continuação',!!(st.recuperacaoCursor&&st.recuperacaoCursor.before>0));
    // 2º ciclo — em outra abertura do programa (o cursor tem de sobreviver).
    // A recuperação automática espera 60 s entre tentativas; aqui eu simplesmente
    // adianto esse relógio (é o que o tempo faria no computador dele).
    const guardado=JSON.parse(amb.store['digicopy_cf_sync_state_v1']);
    guardado.recuperacaoTentativa=Date.now()-61000;
    amb.store['digicopy_cf_sync_state_v1']=JSON.stringify(guardado);
    const amb2=novoNavegador(amb.store);
    const S2=abrir(amb2,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    await S2.recuperarAutomatico();
    await dormir(400);
    const st2=estadoDe(amb2);
    ok('o 2º ciclo continua de onde parou (páginas '+pagina+', sem repetir a 1ª)',
      paginasVistas.length===pagina&&paginasVistas[0]<1700000000000);
    ok('e aí sim termina e carimba "recuperação feita" ('+pagina+' páginas)',
      !!dados.config.recuperacaoExcluidosEm);
    ok('o cursor é limpo quando termina',!st2.recuperacaoCursor);
    ok('nenhuma página foi pedida duas vezes com o mesmo cursor',
      new Set(paginasVistas).size===paginasVistas.length);
  }

  console.log('\nRESULTADO: '+passou+' verificações passaram — a recuperação não ressuscita o que ele apagou, o aviso não se perde e a varredura grande termina.');
  process.exit(0);
})().catch(e=>{console.error('erro no teste:',e&&e.stack||e);process.exit(1);});
