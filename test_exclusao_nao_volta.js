// test_exclusao_nao_volta.js — v7.0.7
// Trava o defeito PROVADO: "apaguei e o registro voltou".
// O motor de verdade é carregado com uma nuvem de mentira em memória e o mesmo
// caminho do sistema é usado (a função de apagar que o vigia embrulha).
// Três situações do dia a dia, e em todas o registro apagado tem de FICAR apagado
// e a exclusão tem de CHEGAR na nuvem:
//   A) apagar e fechar o programa antes de a exclusão subir;
//   B) a internet cair logo depois de apagar e o programa ser fechado;
//   C) apagar com o motor funcionando (caminho normal — não pode regredir).
const fs=require('fs'),path=require('path');
let passou=0;
function ok(nome,cond){if(!cond){console.error('  \u2718 '+nome);process.exit(1);}console.log('  \u2714 '+nome);passou++;}
const realSetTimeout=globalThis.setTimeout;
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');

console.log('== EXCLUSÃO NÃO VOLTA (v7.0.7) ==');

// ── a nuvem de mentira (diário + registros, igual ao motor espera) ──────────
function nuvemDeMentira(){
  const nuvem={records:{},diario:[],postados:[],foraDoAr:false};
  for(const [id,numero] of [['C1','CT-1'],['C2','CT-2'],['C3','CT-3']]){
    nuvem.records['contratos|'+id]={entity:'contratos',recordId:id,data:{id,numero},version:1};
    nuvem.diario.push({seq:nuvem.diario.length+1,entity:'contratos',recordId:id,operation:'upsert',data:{id,numero},version:1});
  }
  nuvem.api=async(p,o)=>{
    if(nuvem.foraDoAr)throw new Error('sem internet (teste)');
    if(p.indexOf('/v1/status')===0)return {ok:true,totals:{records:Object.keys(nuvem.records).length,cursor:nuvem.diario.length}};
    if(p.indexOf('/v1/changes')===0&&(!o||o.method==='GET')){
      const m=/cursor=(\d+)&limit=(\d+)/.exec(p),cursor=Number(m[1]),limite=Number(m[2]);
      const fatia=nuvem.diario.filter(x=>x.seq>cursor).slice(0,limite);
      const ultimo=fatia.length?fatia[fatia.length-1].seq:cursor;
      return {ok:true,nextCursor:ultimo,hasMore:nuvem.diario.some(x=>x.seq>ultimo),changes:fatia};
    }
    if(p.indexOf('/v1/changes')===0&&o&&o.method==='POST'){
      const env=JSON.parse(o.body||'{}');nuvem.postados=nuvem.postados.concat(env.mutations||[]);
      const results=(env.mutations||[]).map((mu,i)=>{
        const k=mu.entity+'|'+mu.recordId,atual=nuvem.records[k];
        if(mu.operation==='delete'){
          if(!atual)return {index:i,ok:false,error:'nao existe'};
          atual.deleted=true;atual.version++;
          nuvem.diario.push({seq:nuvem.diario.length+1,entity:mu.entity,recordId:mu.recordId,operation:'delete',data:null,version:atual.version});
          return {index:i,ok:true,version:atual.version};
        }
        nuvem.records[k]={entity:mu.entity,recordId:mu.recordId,data:Object.assign({},mu.data),version:(atual?atual.version:0)+1};
        nuvem.diario.push({seq:nuvem.diario.length+1,entity:mu.entity,recordId:mu.recordId,operation:'upsert',data:nuvem.records[k].data,version:nuvem.records[k].version});
        return {index:i,ok:true,version:nuvem.records[k].version};
      });
      return {ok:results.every(r=>r.ok),results};
    }
    throw new Error('rota não prevista no teste: '+p);
  };
  return nuvem;
}
function novoNavegador(){
  const store={},eventos={};
  const localStorage={getItem:k=>(k in store?store[k]:null),
    setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];},
    get length(){return Object.keys(store).length;},key:i=>Object.keys(store)[i]||null};
  const janela={
    DIGICOPY_CLOUD:{token:()=>'tok',api:null},
    addEventListener:(n,fn)=>{(eventos[n]=eventos[n]||[]).push(fn);},
    removeEventListener:()=>{},disparar:n=>{(eventos[n]||[]).forEach(fn=>{try{fn();}catch(e){}});},
    notificarEvento:()=>{},logAction:()=>{},navigateTo:()=>{},saveDB:()=>true
  };
  const documento={hidden:false,activeElement:null,body:{},addEventListener:()=>{},
    removeEventListener:()=>{},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null};
  return {janela,localStorage,store,documento};
}
function abrirSessao(amb,dados,api){
  amb.janela.DIGICOPY_CLOUD.api=api;
  globalThis.setTimeout=()=>0;   // o motor não dispara relógio dentro do teste
  try{new Function('window','localStorage','document','db',code)(amb.janela,amb.localStorage,amb.documento,dados);}
  finally{globalThis.setTimeout=realSetTimeout;}
  return amb.janela.DIGICOPY_CLOUD_SYNC;
}
const dormir=ms=>new Promise(r=>realSetTimeout(r,ms));

(async()=>{
  const cenarios={A:'apagar e fechar na hora',B:'internet cai depois de apagar',C:'apagar com o motor funcionando'};
  for(const cenario of Object.keys(cenarios)){
    const nuvem=nuvemDeMentira();

    // ── sessão 1: abre, carrega, e ele apaga o contrato C1 ──
    const amb1=novoNavegador();
    const db1={contratos:[],config:{},_seq:{}};
    amb1.janela.excluirContratoUnificado=function(id){
      const i=db1.contratos.findIndex(c=>c.id===id);if(i>=0)db1.contratos.splice(i,1);amb1.janela.saveDB();
    };
    const S1=abrirSessao(amb1,db1,nuvem.api);
    await S1.tick('abertura').catch(()=>{});
    ok(cenario+': a base abriu com os 3 contratos',db1.contratos.length===3);
    if(cenario==='B')nuvem.foraDoAr=true;
    amb1.janela.excluirContratoUnificado('C1');
    ok(cenario+': o motor registrou o que ele apagou',S1.temMarcaDeExclusao('contratos|C1')===true);
    if(cenario==='C'){await S1.tick('heartbeat').catch(()=>{});await dormir(30);await S1.tick('heartbeat').catch(()=>{});}
    amb1.janela.disparar('pagehide');

    // ── sessão 2: abre de novo (é o F5/abrir o programa no dia seguinte) ──
    nuvem.foraDoAr=false;
    const amb2=novoNavegador();
    Object.assign(amb2.store,amb1.store);
    const db2={contratos:[],config:{},_seq:{}};
    amb2.janela.excluirContratoUnificado=function(){};
    const S2=abrirSessao(amb2,db2,nuvem.api);
    await S2.tick('abertura').catch(()=>{});
    await dormir(30);
    await S2.tick('heartbeat').catch(()=>{});
    ok(cenario+': o contrato apagado NÃO volta',db2.contratos.some(c=>c.id==='C1')===false);
    ok(cenario+': a nuvem recebeu a exclusão',!!(nuvem.records['contratos|C1']&&nuvem.records['contratos|C1'].deleted));
    ok(cenario+': a marca é limpa depois de confirmada',S2.temMarcaDeExclusao('contratos|C1')===false);
  }

  console.log('-- o que sustenta o conserto --');
  ok('a marca fica gravada no estado (sobrevive a fechar o programa)',
    /excluidosDeProposito/.test(code)&&/MARCA_EXCLUSAO_VALE/.test(code));
  ok('a marca é gravada na hora do clique, comparando antes/depois da função',
    /let intencaoAntes=null;/.test(code)&&/intencaoAntes=localKeysSnapshot\(\)/.test(code)&&/function fecharIntencaoDeExclusao\(\)/.test(code));
  ok('registro que VOLTOU da nuvem sai de novo e a ordem vai junto',
    /if\(pos<0\)continue;[\s\S]{0,600}?arr\.splice\(pos,1\)/.test(code));
  ok('se outro PC editou depois, a edição vale (não apaga por cima)',
    /if\(vAtual>vMarcada\)\{ delete alvo\[k\]; continue; \}/.test(code));
  ok('a nuvem recusando a exclusão, o motor para de insistir (sem laço)',
    /limparMarcaDeExclusao\(item\.key\)/.test(code)&&(code.match(/limparMarcaDeExclusao\(item\.key\)/g)||[]).length>=3);

  console.log('-- os caminhos que apagavam sem avisar a nuvem --');
  const lista=(/const FUNCOES_QUE_EXCLUEM=\[([\s\S]*?)\];/.exec(code)||[])[1]||'';
  ['removerRegistro','excluirChamadoV52422','estornarVenda','estornarOrcamentosMarcados'].forEach(n=>{
    ok('vigia alcança '+n,new RegExp("'"+n+"'").test(lista));
  });
  ok('ferramenta para o módulo embrulhar exclusão interna (fora do window)',
    /function exclusaoVigiada\(fn\)/.test(code)&&/exclusaoVigiada,registrarExclusaoDeProposito,devolverLideranca/.test(code));
  ok('ferramenta para o módulo avisar apagamento feito dentro de laço',
    /function registrarExclusaoDeProposito\(entity,id\)/.test(code));
  ok('a recuperação do que foi apagado acontece UMA VEZ para todos os PCs',
    /recuperacaoExcluidosEm/.test(code)&&/UMA VEZ PARA TODOS OS PCs/.test(code));
  ok('o botão Excluir do histórico de leituras usa a ferramenta',
    /exclusaoVigiada\(excluirLeiturasMarcadas\)/.test(fs.readFileSync('ajustes_v52210_historico_checkbox_nfe_patch.js','utf8')));
  ok('unir clientes repetidos avisa a nuvem dos duplicados',
    /A UNIÃO PRECISA VALER NA NUVEM/.test(code)&&/removeIds\.forEach\(id=>\{const k=key\('clientes',id\)/.test(code));
  ok('a liderança não segura o envio depois de reabrir',
    /const LEASE_MS=30000;/.test(code)&&/function devolverLideranca\(\)/.test(code)&&/devolverLideranca\(\);/.test(code));

  console.log('-- a lista de exclusões não pode voltar a ter buraco --');
  // Levanta TODO ponto do sistema que tira registro de lista sincronizada e
  // exige: ou está na lista do vigia, ou está na lista do que é automático
  // (e por isso NUNCA manda apagar na nuvem), ou foi embrulhado com exclusaoVigiada.
  const AUTOMATICAS=['seedData','varrerDemonstracao','parquePorItemLocacao','normalizarAdminPrincipal',
    'aplicarAutomacoesLeituras','sincronizar','vosConcluirFaturamento','vosRefaturar','executarRevalidacao',
    'checarEstoqueComPopup','salvarImpressoraContrato','mergeDuplicateClients','(sem nome)','alvos','venda',
    'destacarChamadoModal','renderContratos','oldSal','existing'];
  const LISTAS=['clientes','produtos','vendas','contratos','parque','leituras','os','orcamentos',
    'contasReceber','contasPagar','equipamentos','tecnicos','recargas','usuarios','empresas'];
  const re=new RegExp('(?:db|_db|banco)\\.('+LISTAS.join('|')+')\\s*=\\s*[^;]{0,90}?\\.filter\\(|(?:db|_db|banco)\\.('+LISTAS.join('|')+')\\.splice\\(');
  const arquivos=[];
  (function anda(dir){
    for(const nome of fs.readdirSync(dir)){
      if(/^(node_modules|\.git|vendor|mobile|dist|build|e2e|\.arena)$/.test(nome))continue;
      const p=path.join(dir,nome);
      if(fs.statSync(p).isDirectory()){anda(p);continue;}
      if(/\.js$/.test(nome)&&nome.indexOf('app.bundle')<0&&nome.indexOf('test_')!==0&&nome.indexOf('banco_de_prova')<0)arquivos.push(p);
    }
  })('.');
  const vigiadas=(lista.match(/'([A-Za-z0-9_]+)'/g)||[]).map(x=>x.replace(/'/g,''));
  const problemas=[];
  for(const f of arquivos){
    const linhas=fs.readFileSync(f,'utf8').split('\n');
    linhas.forEach((linha,i)=>{
      if(!re.test(linha))return;
      let nome='';
      for(let j=i;j>=0&&j>i-400;j--){
        const l=linhas[j].trim();
        const d=/^(?:async\s+)?function\s+([A-Za-z0-9_]+)/.exec(l)||
                /^(?:window\.)?([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?function/.exec(l)||
                /^(?:window\.)?([A-Za-z0-9_]+)\s*=\s*\(?[^)]*\)?\s*=>/.exec(l);
        if(d&&!/^(if|for|while|switch|return)$/.test(d[1])){nome=d[1];break;}
      }
      if(!nome)return;
      if(vigiadas.indexOf(nome)>=0||AUTOMATICAS.indexOf(nome)>=0)return;
      // embrulhada na mão pelo próprio módulo?
      const contexto=linhas.slice(Math.max(0,i-60),i).join('\n');
      if(new RegExp('exclusaoVigiada\\(\\s*'+nome+'\\s*\\)').test(contexto))return;
      problemas.push(nome+' ('+f+':'+(i+1)+')');
    });
  }
  ok('nenhum caminho de exclusão fora do vigia e fora do automático'+(problemas.length?': '+problemas.slice(0,4).join(', '):''),
    problemas.length===0);

  console.log('\nRESULTADO: '+passou+' verificações passaram — apagar não volta mais!');
  process.exit(0);
})().catch(e=>{console.error('  \u2718 erro no teste: '+(e&&e.stack||e));process.exit(1);});
