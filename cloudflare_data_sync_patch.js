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
// v7.0.1 (23/09/2026) — QUEIXA DO DONO: "o banco demora atualizar; o que faço
// num computador não dá pra ver no outro". Eram dois motivos somados:
//   1) o motor procurava novidade de 60 em 60 segundos;
//   2) com a janela atrás de outra (ou minimizada) ele NÃO procurava mais nada
//      — então o PC do balcão, que fica com o sistema coberto, só se atualizava
//      quando alguém clicava nele.
// Agora: 15 s com a janela à vista (quase em tempo real) e 2 min quando ela está
// escondida — o navegador estrangula temporizador de aba oculta, então pedir
// 15 s lá não adiantaria e só gastaria o que não precisa. Cada rodada continua
// sendo UMA consulta incremental por cursor (barata), não uma varredura.
// v7.0.3 (23/09/2026) — "ainda demora de chegar, dá pra deixar instantâneo?"
// SIM: com a janela à vista, o motor procura novidade a cada 3 SEGUNDOS. É
// barato de propósito: cada rodada é UMA consulta incremental por cursor (não
// baixa a base de novo), só lê (não gasta o contador de gravação do dia) e o
// plano em uso tem teto de 25 BILHÕES de leituras por mês — 3s equivale a ~20
// consultas por minuto por PC, muito abaixo de qualquer limite.
// Com a janela escondida (minimizada/atrás de outra) continua consultando, só
// que a cada 15 s: o navegador estrangula temporizador de aba oculta e não faz
// sentido brigar com ele. Ao voltar para a janela, a consulta sai na hora
// (o gatilho de foco abaixo pede na hora).
// Nada disso substitui a base inteira nem muda o caminho dos dados: continua
// local-first e incremental, como manda a regra 28 das REGRAS_PERMANENTES.
const HEARTBEAT_MS=3000;
const HEARTBEAT_OCULTO_MS=15000;

// Listas com formato especial. Todo o resto do banco entra sozinho pela
// definicoes(): antes a nuvem só levava estas 19 listas e tudo o que estava
// fora (despesas de locação, compras, cartuchos, cidades, agenda, caixa,
// e-mails, boletos, favoritos...) ficava preso no PC onde foi criado — era por
// isso que um computador tinha tudo e o outro aparecia faltando dados.
const DEFINITIONS={
  empresas:'array', usuarios:'array', clientes:'array', produtos:'array', recargas:'array',
  equipamentos:'array', contratos:'array', parque:'array', leituras:'array',
  os:'array', vendas:'array', orcamentos:'array', contasReceber:'array', contasPagar:'array',
  tecnicos:'array',
  config:'root', modulosDinamicos:'map', _seq:'contador'
};
// Coisas que NÃO viajam: controle interno do próprio arquivo local.
// Nunca viajam. `logs` e `notificacoes` são cortados em 500 por PC pelo próprio
// sistema: cada corte virava uma ordem de exclusão para o outro computador, e o
// outro reenviava os seus. Era esse vai-e-vem que fazia dado sumir e voltar, e
// era ele que inchava a contagem da nuvem.
const NAO_SINCRONIZA=new Set(['meta','__proto__','logs','notificacoes']);

// EXCLUSÃO SÓ QUANDO FOI DE PROPÓSITO (v5.22.75)
// A nuvem não adivinha mais nada. Registro que some da tela por conta própria
// — lista remontada por um módulo, base abrindo pela metade, corte automático —
// NÃO vira exclusão: o dado continua na nuvem e nos outros computadores.
// A nuvem só apaga quando o sistema avisa que a pessoa mandou apagar, e aí
// apaga 1 ou 500, sem limite e sem pergunta.
//
// O aviso vem de dois sinais, os dois deterministas:
//   1. uma função de exclusão do sistema foi chamada;
//   2. a pessoa respondeu SIM em uma confirmação (todo excluir passa por uma).
// Coisa automática nunca confirma nada, então nunca cai aqui.
const JANELA_INTENCAO=60000;
const CONFIRMA_SUMICO=3000;
let intencaoAte=0;
function marcarIntencaoDeExcluir(){ intencaoAte=Date.now()+JANELA_INTENCAO; }
function houveIntencaoDeExcluir(){ return Date.now()<intencaoAte; }
window.DIGICOPY_EXCLUSAO_INTENCIONAL=marcarIntencaoDeExcluir;

const FUNCOES_QUE_EXCLUEM=['deleteVenda','deleteCliente','deleteProduto','deleteCR',
  'deleteUsuario','deleteLeituraContrato','excluirVendaNeo','excluirVendaSelecionada',
  'excluirVendaUnificado','excluirClienteClassic','excluirClientesSelecionados',
  'excluirClientesCascata','excluirProdutoUnificado','excluirContratoUnificado',
  'excluirContratoOperacional','excluirChamadosSelecionados','excluirFinanceiroSelecionados',
  'excluirLancamentosFinanceiro','excluirLeiturasMarcadas','excluirOrcamentosMarcados',
  'excluirRecarga','excluirTecnico','excluirUsuario'];
function vigiarExclusoes(){
  if(typeof window==='undefined')return;
  FUNCOES_QUE_EXCLUEM.forEach(nome=>{
    const original=window[nome];
    if(typeof original!=='function'||original.__vigiado)return;
    const vigiada=function(){ marcarIntencaoDeExcluir(); return original.apply(this,arguments); };
    vigiada.__vigiado=true;
    window[nome]=vigiada;
  });
  ['confirmSistema','confirm','lfbConfirm'].forEach(nome=>{
    const original=window[nome];
    if(typeof original!=='function'||original.__vigiado)return;
    const vigiada=function(){
      const r=original.apply(this,arguments);
      if(r&&typeof r.then==='function'){ r.then(ok=>{ if(ok)marcarIntencaoDeExcluir(); }).catch(()=>{}); }
      else if(r) marcarIntencaoDeExcluir();
      return r;
    };
    vigiada.__vigiado=true;
    window[nome]=vigiada;
  });
}

// Listas que podem receber ordem de exclusão. As demais (as que os módulos
// remontam sozinhos) nunca apagam nada na nuvem, nem com intenção.
const PODE_EXCLUIR=new Set(['empresas','usuarios','clientes','produtos','recargas',
  'equipamentos','contratos','parque','leituras','os','vendas','orcamentos',
  'contasReceber','contasPagar','tecnicos']);

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
  s.limpar=Array.isArray(s.limpar)?s.limpar:[];
  s.reparo=s.reparo||'';
  s.devolucao=s.devolucao||'';
  s.faxina=s.faxina||'';
  s.limiteAte=Number(s.limiteAte)||0;
  s.sumindo=(s.sumindo&&typeof s.sumindo==='object')?s.sumindo:{};
  return s;
}

// v6.1.5 — BUG ACHADO NO TESTE DE DOIS PCs (era o "a nuvem não sincroniza
// mais"): quando o estado era TROCADO inteiro (zerar a nuvem / não autorizar
// local), o objeto novo não trazia os campos extras (state.sumindo, state.limpar
// etc.). Aí a varredura estourava em silêncio com "Cannot read properties of
// undefined" e NADA mais subia — nem venda, nem cliente, nem contrato —, com o
// sistema parecendo conectado. Agora toda troca de estado passa por aqui.
function normalizarEstado(novo){
  state=novo||state||{};
  state.versions=state.versions||{};
  state.hashes=state.hashes||{};
  state.known=state.known||{};
  state.heldLocalOnly=Array.isArray(state.heldLocalOnly)?state.heldLocalOnly:[];
  state.limpar=Array.isArray(state.limpar)?state.limpar:[];
  state.sumindo=(state.sumindo&&typeof state.sumindo==='object')?state.sumindo:{};
  state.pauseReason=state.pauseReason||'';
  state.regras=state.regras||'';
  state.cursor=Number(state.cursor)||0;
  return state;
}
function loadOutbox(){try{const x=JSON.parse(localStorage.getItem(OUTBOX_KEY)||'[]');return Array.isArray(x)?x:[];}catch(e){return [];}}
let state=loadState(),outbox=loadOutbox();
normalizarEstado();  // v6.1.5 — nenhum campo faltando já na abertura

// ═══════════════════════════════════════════════════════════════════════════
// v6.1.5 — "SÓ NUVEM" (ordem do dono, 22/09/2026, em maiúsculas):
//   "EU N QUERO DADOS SALVOS NO MEU PC N, EU QUERO É SOMENTE OS DADOS DA NUVEM,
//    TUDO O QUE EU CRIAR VAI PRA NUVEM, QUERO QUE NADA FIQUE SALVO NO PC OU NO
//    NAVEGADOR N, É DIFICIL ISSO?"
// Como funciona: o sistema PARA de gravar a base neste computador. O que ele
// cria sobe para a nuvem na hora e a tela continua funcionando com os dados na
// memória do programa; ao abrir o sistema, a base é remontada LENDO O DIÁRIO DA
// NUVEM desde o começo. No PC fica guardado só o necessário para não pedir a
// senha de novo e para não perder nada que ainda não subiu (token + fila de
// envio). Quem quiser abrir sem internet desliga isto no painel da Nuvem.
// ═══════════════════════════════════════════════════════════════════════════
const SO_NUVEM_KEY='digicopy_cf_so_nuvem_v1';
const BASE_CHAVES=['digicopy_erp_v42_demo_apresentacao','digicopy_erp_backup_pre_sync','digicopy_erp_v20','digicopy_erp_v10'];
const BASE_IDB='digicopy_erp_storage_v1';
function modoSoNuvem(){ try{ const v=localStorage.getItem(SO_NUVEM_KEY); return v===null?true:v==='1'; }catch(e){ return true; } }
function aplicarSoNuvem(){
  const ligado=modoSoNuvem();
  try{ window.DIGICOPY_SO_NUVEM=ligado; }catch(e){}
  if(ligado){
    // Sem base guardada aqui: o diário da nuvem é lido inteiro na abertura.
    // (Só o que TRAZ dados da nuvem é mexido; nada local é enviado nem apagado.)
    state.cursor=0; state.versions={}; state.initialPull=true;
  }
  return ligado;
}
function definirSoNuvem(ligado){
  try{ localStorage.setItem(SO_NUVEM_KEY, ligado?'1':'0'); }catch(e){}
  aplicarSoNuvem();
  if(ligado){ try{ soltarCopiaLocal(); }catch(e){} }
  else persist();
  return modoSoNuvem();
}
// Apaga o que ESTE computador guardou da base (navegador). Não toca no token da
// nuvem, nem na fila de envio, nem em nada da nuvem.
function soltarCopiaLocal(){
  let apagadas=0;
  try{
    const alvos=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(!k)continue;
      if(BASE_CHAVES.some(pref=>k.indexOf(pref)===0)||k.indexOf('digicopy_erp_v42_demo_apresentacao_part__')===0)alvos.push(k);
    }
    alvos.forEach(k=>{ try{ localStorage.removeItem(k); apagadas++; }catch(e){} });
  }catch(e){}
  try{
    if(typeof indexedDB!=='undefined'){
      const req=indexedDB.deleteDatabase(BASE_IDB);
      req.onblocked=function(){};
    }
  }catch(e){}
  return apagadas;
}
// Antes de soltar a cópia deste PC, confere na nuvem se ela tem TUDO o que
// este PC tem. Sem resposta (internet caída) ou com a nuvem menor → NÃO solta
// nada (melhor guardar demais do que perder algo que ainda não subiu).
async function nuvemTemTudo(){
  try{
    const call=api(); if(!call)return false;
    const st=await call('/v1/status?fresh=1',{method:'GET'});
    const naNuvem=Number(st&&st.totals&&st.totals.records)||0;
    return naNuvem>=localBusinessCount();
  }catch(e){ return false; }
}
function infoSoNuvem(){
  let kb=0;
  try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||''; if(BASE_CHAVES.some(pref=>k.indexOf(pref)===0))kb++; } }catch(e){}
  return {ligado:modoSoNuvem(),chavesDaBaseNoNavegador:kb};
}
// v6.1.5 — CARIMBO DE GERAÇÃO (bug do teste de dois PCs): se o estado inteiro é
// trocado no meio de uma sincronização (zerar a nuvem / decidir não enviar /
// check-up), a rodada que já estava em andamento precisa PARAR na hora. Sem
// isto, a rodada antiga terminava depois e desfazia a decisão nova — era uma
// forma de "sincronizei e parece que nada subiu / voltou atrás".
let estadoGeracao=0;
function trocarEstado(novo){state=novo;estadoGeracao++;return state;}
// v5.22.69 — a nuvem passou a levar TODAS as listas do sistema. Quem já estava
// conectado tem dados antigos que nunca subiram, então o sistema pergunta uma
// única vez o que fazer com eles antes de voltar a sincronizar.
const REGRAS='v6.1.7-conectou-sincroniza';
// v6.1.4 — ORDEM DO DONO (22/09/2026): "retire essa trava de preferir enviar ou
// não, já envia logo; colocou o login e qualquer das duas senhas? conecta e
// sincroniza na hora, sem apertar botão". Então a PAUSA de escolha acabou:
// quem conecta passa a sincronizar sozinho. A proteção de dado continua sendo a
// de sempre (nada é apagado; envio é por id, então não duplica), e o botão
// manual "Não enviar os dados atuais" continua existindo para quem quiser.
state.paused=false;
state.pauseReason='';
if(state.regras!==REGRAS){
  state.regras=REGRAS;
  try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(e){}
}
// Auditoria e avisos já subiram nas versões anteriores e agora não viajam mais.
// Ficariam ocupando lugar na nuvem e inflando a contagem, então saem de lá uma
// vez só, no ritmo normal da fila.
(function marcarLimpeza(){
  const alvo=[];
  for(const k of Object.keys(state.known||{})){
    const nome=k.slice(0,k.indexOf('|'));
    if(NAO_SINCRONIZA.has(nome))alvo.push(k);
  }
  if(alvo.length){
    const ja=new Set(state.limpar||[]);
    alvo.forEach(k=>ja.add(k));
    state.limpar=[...ja];
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(e){}
  }
})();
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
    // v5.22.92 — ORÇAMENTO NUNCA SOME POR MANDADO DA NUVEM.
    // Orçamento sumindo foi o bug de "cliquei e não achei". Mesmo que outro
    // aparelho mande apagar, aqui o orçamento fica marcado como excluído
    // (sai das listas de trabalho, mas segue no banco e volta em Estornar)
    // em vez de desaparecer de verdade.
    if(change.operation==='delete'&&change.entity==='orcamentos'){
      if(idx>=0){ arr[idx].status='excluido'; arr[idx].excluidoEm=arr[idx].excluidoEm||new Date().toISOString(); changed=true; }
      state.versions[k]=Number(change.version);state.known[k]=true;state.hashes[k]=hash(arr[idx]);
      return changed;
    }
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
  // v6.1.4 — ORDEM DO DONO (22/09/2026): sem trava de escolha. Conectou
  // (qualquer uma das duas senhas), sincroniza na hora, nos dois sentidos.
  // Nada é apagado e nada é isolado automaticamente: o envio é por id (atualiza
  // o que já existe em vez de criar cópia) e a LEITURA da nuvem nunca apaga
  // dado local — quem manda apagar é o dono, pela tela.
  // A função continua existindo (e respondendo) porque o painel, o check-up e
  // os testes usam o formato; agora ela sempre devolve "pode sincronizar".
  return {pause:false,isolate:false,hold:false,reason:'sincroniza-direto'};
}
async function reconcileFirstAuthorizedDevice(beforeKeys){
  if(!beforeKeys||typeof db==='undefined'||!db)return 0;
  // v5.24.0 — só remove "sobras locais" quando o puxamento da nuvem terminou
  // DE VERDADE. Se a internet caiu no meio, state.known fica incompleto e a
  // reconciliação APAGARIA dados legítimos deste computador (e a remoção
  // local vira delete na fila de envio → apagaria na nuvem também).
  if(!state.initialPull)return 0;
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

// v7.0.2 — "pedido de carga completa": quem quer a carga inteira à vista avisa
// aqui antes de chamar o pullAll (mantém a chamada `await pullAll()` como sempre
// foi — é o que o teste do motor confere).
let cargaPedida=false;
function pedirCarga(v){cargaPedida=!!v;}
async function pullAll(opcoes){
  const silencioso=!!(opcoes&&opcoes.silencioso);
  const cargaCompleta=silencioso?false:cargaPedida;cargaPedida=false;
  const call=api();if(!call)throw new Error('API Cloudflare não carregada.');
  let changed=false,pages=0;
  // v7.0.2 — página maior: menos idas e voltas para trazer a base inteira.
  // (O Worker limita; se ele ainda estiver com o teto antigo, vem 500 e nada quebra.)
  const POR_PAGINA=1000;
  // v7.0.3 — ORDEM DO DONO: "de mostrar dados quero NADA que envolva eu fazer
  // alguma coisa, só quero que mostre normal". O aviso de carga passa a aparecer
  // SÓ quando este PC não tem base nenhuma (primeira vez/PC novo) — aí não há o
  // que mostrar de qualquer forma. Com base já aqui, a leitura corre em silêncio
  // e a tela se atualiza no fim, sem tela azul nenhuma.
  const baseVazia=(typeof db==='undefined'||!db)?true:(localBusinessCount()===0);
  const comAviso=cargaCompleta&&baseVazia;
  if(comAviso)mostrarCargaNuvem(true,'conectando…');
  try{
  do{
    const data=await comPaciencia(()=>call('/v1/changes?cursor='+encodeURIComponent(Number(state.cursor)||0)+'&limit='+POR_PAGINA,{method:'GET'}));
    for(const item of (data.changes||[])){if(applyRemote(item))changed=true;}
    state.cursor=Number(data.nextCursor)||Number(state.cursor)||0;
    pages++;
    if(comAviso){cargaItens+=(data.changes||[]).length;mostrarCargaNuvem(true,cargaItens.toLocaleString('pt-BR')+' registros trazidos…');}
    if(!data.hasMore)break;
  }while(pages<100);
  }finally{ if(comAviso)mostrarCargaNuvem(false); }
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
  // Fila de limpeza: some da nuvem o que não viaja mais, aos poucos.
  if((state.limpar||[]).length){
    const fatia=state.limpar.slice(0,40);
    for(const k of fatia){
      if(outbox.length>=MAX_OUTBOX)break;
      if(pending.has(k))continue;
      const corte=k.indexOf('|');
      outbox.push({key:k,hash:null,mutation:{mutationId:mutationId(),entity:k.slice(0,corte),recordId:k.slice(corte+1),operation:'delete',baseVersion:Number(state.versions[k]||0)}});
      pending.add(k);added++;
    }
    state.limpar=state.limpar.filter(k=>!pending.has(k));
  }
  const MAPA=definicoes();
  for(const entity of Object.keys(MAPA)){
    if(outbox.length>=MAX_OUTBOX)break;
    const mode=MAPA[entity],entries=entriesFor(entity,mode),present=new Set(entries.map(x=>key(entity,x.id)));
    for(const entry of entries){
      if(outbox.length>=MAX_OUTBOX)break;
      const k=key(entity,entry.id),h=hash(entry.data);
      if(!state.sumindo||typeof state.sumindo!=='object')state.sumindo={};
      if(state.sumindo[k])delete state.sumindo[k];
      if(held.has(k)||state.hashes[k]===h||pending.has(k))continue;
      outbox.push({key:k,hash:h,mutation:{mutationId:mutationId(),entity,recordId:entry.id,operation:'upsert',baseVersion:Number(state.versions[k]||0),data:entry.data}});
      pending.add(k);added++;
    }
    if(!PODE_EXCLUIR.has(entity)||entity==='orcamentos')continue; // v5.22.92 — este PC nunca manda apagar orçamento
    const missing=Object.keys(state.known).filter(k=>k.startsWith(entity+'|')&&!present.has(k)&&!pending.has(k));
    if(!missing.length)continue;
    if(!houveIntencaoDeExcluir()){
      // Ninguém mandou apagar. Este PC apenas deixa de acompanhar o registro:
      // ele segue inteiro na nuvem e nos outros computadores. Sem apagão.
      missing.forEach(k=>{ delete state.known[k]; delete state.hashes[k]; delete state.sumindo[k]; });
      continue;
    }
    // Confere duas vezes antes de apagar. Não é limite de quantidade: pode ser
    // 1 ou 5.000. É só um respiro de 3 segundos para o caso da base estar
    // abrindo e a lista ainda estar pela metade — aí o registro reaparece e a
    // exclusão é cancelada sozinha.
    const agora=Date.now();
    for(const k of missing){
      if(outbox.length>=MAX_OUTBOX)break;
      if(!state.sumindo[k]){ state.sumindo[k]=agora; continue; }
      if(agora-Number(state.sumindo[k])<CONFIRMA_SUMICO) continue;
      const id=k.slice(entity.length+1);
      outbox.push({key:k,hash:null,mutation:{mutationId:mutationId(),entity,recordId:id,operation:'delete',baseVersion:Number(state.versions[k]||0)}});
      pending.add(k);delete state.sumindo[k];added++;
    }
    if(missing.length)schedule(CONFIRMA_SUMICO+500);
  }
  persist();return added;
}

// NENHUM COMPUTADOR APAGA DADO SOZINHO (v5.22.76)
// O espelho da v5.22.72 fazia o contrário: o que existia no PC e não existia na
// nuvem ele apagava do PC. Foi ele que sumiu com usuário de login, produto de
// recarga e impressora dentro de contrato. Espelho REMOVIDO. Agora o caminho é
// o oposto: o que existe no PC e não está na nuvem SOBE para a nuvem.
//
// DEVOLVER O QUE O ESPELHO LEVOU
// Antes de limpar, o espelho gravava uma cópia de recuperação no PC. Uma única
// vez, este conserto lê essa cópia e devolve para a base tudo o que ela tinha e
// hoje não existe mais. Não devolve nada que a pessoa apagou de propósito
// depois, porque só devolve o que sumiu ANTES da cópia, e nunca devolve os
// nomes de demonstração.
const DEVOLUCAO='v5.22.76-desfaz-espelho';

function ehLixoDeDemonstracao(entity,item){
  if(!item)return false;
  if(entity==='tecnicos'&&typeof window.ehTecnicoDemo==='function')return window.ehTecnicoDemo(item);
  return false;
}

async function devolverSumidos(){
  if(state.devolucao===DEVOLUCAO)return 0;
  if(typeof db==='undefined'||!db){return 0;}
  const idb=window.DIGICOPY_INDEXED_DB;
  if(!idb||typeof idb.readRecoverySnapshot!=='function'){state.devolucao=DEVOLUCAO;persist();return 0;}
  let copia=null;
  try{copia=await idb.readRecoverySnapshot('antes_espelhar_nuvem');}catch(e){copia=null;}
  if(!copia||typeof copia!=='object'){state.devolucao=DEVOLUCAO;persist();return 0;}
  let voltaram=0;
  for(const entity of Object.keys(copia)){
    if(NAO_SINCRONIZA.has(entity))continue;
    const antiga=copia[entity];
    if(!Array.isArray(antiga)||!Array.isArray(db[entity]))continue;
    const tem=new Set(db[entity].map(x=>x&&x.id!=null?String(x.id):'').filter(Boolean));
    antiga.forEach(item=>{
      if(!item||item.id==null)return;
      if(tem.has(String(item.id)))return;
      if(ehLixoDeDemonstracao(entity,item))return;
      db[entity].push(item);voltaram++;
    });
  }
  state.devolucao=DEVOLUCAO;
  if(voltaram){
    applying=true;
    try{if(typeof saveDBAgora==='function')saveDBAgora();else if(typeof saveDB==='function')saveDB();}
    finally{applying=false;}
    indicator(false,'Devolvendo '+voltaram+' registros que tinham sumido do PC');
  }
  persist();
  return voltaram;
}

// FAXINA DOS NOMES DE DEMONSTRAÇÃO — UMA VEZ SÓ (v5.22.77)
// Carlos Mendes, Ana Souza e Rafael Lima foram apagados do PC e da nuvem uma
// única vez, porque a nuvem antiga tinha guardado eles. NÃO é regra: depois
// dessa limpeza o sistema nunca mais olha para nome nenhum. Se um dia existir
// um técnico de verdade com esse nome, ele funciona igual a qualquer outro.
const FAXINA='v5.22.77-limpeza-unica';
function varrerDemonstracao(){
  if(state.faxina===FAXINA)return 0;
  if(typeof db==='undefined'||!db||!Array.isArray(db.tecnicos)){return 0;}
  state.faxina=FAXINA;
  const lixo=db.tecnicos.filter(t=>ehLixoDeDemonstracao('tecnicos',t));
  if(!lixo.length){persist();return 0;}
  db.tecnicos=db.tecnicos.filter(t=>!ehLixoDeDemonstracao('tecnicos',t));
  const naFila=pendingKeys();
  lixo.forEach(t=>{
    const k=key('tecnicos',t.id);
    if(!naFila.has(k)){
      outbox.push({key:k,hash:null,mutation:{mutationId:mutationId(),entity:'tecnicos',recordId:String(t.id),operation:'delete',baseVersion:Number(state.versions[k]||0)}});
      naFila.add(k);
    }
    delete state.known[k];delete state.hashes[k];delete state.sumindo[k];
  });
  applying=true;
  try{if(typeof saveDBAgora==='function')saveDBAgora();else if(typeof saveDB==='function')saveDB();}
  finally{applying=false;}
  persist();
  return lixo.length;
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
        // v5.24.0 — conflito NÃO descarta mais a edição local de cara. Antes:
        // aceitava o estado da nuvem e jogava a mutação fora em silêncio —
        // era um caminho de "salvei e sumiu" quando dois PCs mexiam juntos.
        // Agora: aplica o estado atual da nuvem e REENVIA a mesma intenção
        // uma vez, com baseVersion atualizada. Só cede se mudarem de novo
        // (concorrência real — última escrita vence), e avisa no sino.
        if(result.current)applyRemote({entity:result.current.entity,recordId:result.current.recordId,data:result.current.data,version:result.current.version,operation:result.current.deletedAt?'delete':'upsert'});
        if(!item.retryV5240){
          item.retryV5240=true;
          if(result.current){item.mutation=Object.assign({},item.mutation,{baseVersion:Number(result.current.version)||0});}
          continue; // não entra no "remove": fica na outbox e reenvia no próximo lote
        }
        rememberConflict(item,result);
        try{ if(typeof window!=='undefined'&&typeof window.notificarEvento==='function')window.notificarEvento('info','Havia uma alteração mais nova na nuvem ('+(item.mutation&&item.mutation.entity)+'). Se faltar algo, refaça a última edição.',{tipo:'sync'}); }catch(e){}
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
// v7.0.3 — LEITURA EM QUALQUER ABA VISÍVEL.
// O motor só deixava a "aba líder" (uma aba por navegador) puxar novidades — e
// isso evita trabalho dobrado. O problema: se quem segurava a liderança era uma
// aba esquecida em segundo plano, ela continuava líder para sempre e a aba que
// a pessoa estava OLHANDO não puxava nada. Resultado: tela velha, sem erro, sem
// aviso — e é uma das explicações do "demora de chegar".
// Agora: aba escondida e não-líder não faz nada; aba VISÍVEL puxa (só leitura).
// Quem ENVIA continua sendo só a líder (uma remessa por navegador, como antes).
async function tickSohLeitura(reason){
  if(typeof document==='undefined'||document.hidden)return false;
  busy=true;lastTick=Date.now();
  const geracao=estadoGeracao;
  try{
    if(window.DIGICOPY_DB_READY)await window.DIGICOPY_DB_READY;
    const mudou=await pullAll({silencioso:true});
    if(geracao!==estadoGeracao)return false;
    if(mudou)redesenharTelaAtual();
    indicator(true,'Nuvem sincronizada • '+new Date().toLocaleTimeString('pt-BR'));
    return true;
  }catch(e){
    lastError=e&&e.message?e.message:String(e);
    return false;
  }finally{busy=false;scheduleHeartbeat();}
}
async function tick(reason){
  if(state.paused||busy||!authorized())return false;
  if(!leader()){
    // não é a líder: se a janela está à vista, puxa; se está escondida, espera
    if(typeof document!=='undefined'&&document.hidden)return false;
    return await tickSohLeitura(reason);
  }
  busy=true;lastTick=Date.now();
  const geracao=estadoGeracao;
  const trocou=()=>geracao!==estadoGeracao;   // a decisão mudou no meio? então para
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
    // v7.0.2 — é a PRIMEIRA carga (ou um "baixar tudo"): mostra o aviso de
    // carga e segura a tela até chegar tudo, em vez de ir mostrando pedaços.
    pedirCarga(!state.initialPull||reason==='baixar-tudo-da-nuvem');
    const mudouNaTela=await pullAll();
    if(!state.recuperacaoV1)setTimeout(()=>{try{recuperarAutomatico();}catch(e){}},1200);
    if(trocou())return false;   // zerou a nuvem / mudou a decisão durante a leitura
    if(firstAuthorizedPull){
      const extras=listLocalOnlyKeys(localBefore);
      const decision=decideReinstallGuard({
        activation,
        cloudHasData:Object.keys(state.known).length>0,
        localCount:localBusinessCount(),
        extraCount:extras.length
      });
      // v6.1.4 — sem pausa: sobras locais sobem por id (atualiza, não duplica);
      // o que existe igual dos dois lados não é reenviado (a comparação de hash
      // feita depois da leitura cuida disso).
      state.heldLocalOnly=[];
      state.pauseReason='';
      state.paused=false;
    }
    let totalSent=0;
    for(let round=0;round<50;round++){
      if(trocou())return false;
      scanLocal();
      if(!outbox.length)break;
      const sent=await pushOutbox();totalSent+=sent;if(!sent&&outbox.length)break;
    }
    // Só consulta novamente quando este PC realmente enviou algo. Em repouso,
    // cada ciclo custa uma única consulta incremental, não duas.
    if(totalSent>0)await pullAll();
    if(trocou())return false;
    failures=0;lastError='';state.lastOk=Date.now();persist();
    // SÓ NUVEM: sincronizou tudo (nada pendente) → o que este PC guardou da base
    // vai embora. A tela continua com os dados na memória; a nuvem é a fonte.
    if(modoSoNuvem()&&!outbox.length&&await nuvemTemTudo()){
      const soltas=soltarCopiaLocal();
      if(soltas)indicator(true,'Dados só na nuvem • cópia local liberada');
    }
    if(outbox.length){
      // Remessa grande: mostra o quanto falta e volta logo para continuar, em vez
      // de esperar o próximo ciclo normal de vários minutos.
      indicator(true,'Enviando para a nuvem • faltam '+outbox.length+' registros');
      busy=false;schedule(3000);return true;
    }
    const devolvidos=await devolverSumidos();
    if(devolvidos){lastError='';schedule(1200);}
    if(varrerDemonstracao())schedule(1200);
    // v7.0.1 — a novidade já está no banco; a TELA da frente se redesenha para
    // a pessoa ver na hora (era a queixa "faço num PC e não aparece no outro").
    // Quem decide se pode é podeRedesenharSync — e as travas existem para não
    // atrapalhar quem está digitando.
    if(mudouNaTela)redesenharTelaAtual();
    indicator(true,'Nuvem sincronizada • '+new Date().toLocaleTimeString('pt-BR'));
    return true;
  }catch(e){
    mostrarCargaNuvem(false);   // nunca deixar o dono preso no aviso de carga
    failures++;lastError=e&&e.message?e.message:String(e);
    // v6.1.11 — AUDITORIA: o freio preventivo de cota (Worker v5.24.5) responde
    // 429 com `quota:true`, mas o recado vem no campo `error` — e o motor lê o
    // texto só de `message`/`aviso`. Resultado: chegava como "Erro HTTP 429" e
    // o ehLimiteDiario não reconhecia, então em vez de dormir até a virada o app
    // ficava batendo na porta (4 tentativas por rodada, ~21s) e AINDA inflava o
    // contador de escrita da nuvem — o que fazia o freio disparar cada vez mais
    // cedo. Agora a marca `quota` vale como limite diário, igual ao erro cru do
    // D1 que já funcionava.
    if(ehLimiteDiario(lastError)||!!(e&&e.quota)){
      lastError=recadoDoLimite();
      state.limiteAte=viradaDoLimite();persist();
      indicator(false,lastError);
      busy=false;
      if(timer)clearTimeout(timer);
      timer=setTimeout(()=>tick('limite-virou'),Math.min(3600000,Math.max(60000,state.limiteAte-Date.now())));
      return false;
    }
    indicator(false,'Nuvem pendente: '+lastError);
    if(e&&e.status===401){
      try{if(window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.forgetAuth)window.DIGICOPY_CLOUD.forgetAuth();}catch(_e){}
    }
    return false;
  }finally{if(cargaAberta)mostrarCargaNuvem(false);if(busy){busy=false;scheduleHeartbeat();}}
}
// LIMITE DIÁRIO DO BANCO GRÁTIS (v5.22.80)
// O plano grátis da Cloudflare tem um teto de gravações por dia. Quando ele
// estoura, TODA consulta volta com erro em inglês e parece que o sistema
// quebrou. Não quebrou: nada se perdeu, o envio só fica esperando o teto virar,
// o que acontece à meia-noite no horário de Londres (21h no horário de
// Brasília). Aqui o sistema reconhece isso, avisa em português e para de bater
// na porta à toa — cada tentativa inútil consome mais do limite de amanhã.
function ehLimiteDiario(msg){
  return /free tier daily|daily row (write|read) limit|exceeded .*limit/i.test(String(msg||''));
}
function viradaDoLimite(){
  const agora=new Date();
  const virada=Date.UTC(agora.getUTCFullYear(),agora.getUTCMonth(),agora.getUTCDate()+1,0,2,0);
  return virada;
}
function recadoDoLimite(){
  const falta=Math.max(0,viradaDoLimite()-Date.now());
  const horas=Math.floor(falta/3600000),minutos=Math.round((falta%3600000)/60000);
  // v5.24.34 — plano PAGO ativo: a ficha "grátis/diária" mudou pro teto mental
  // do plano ($5 fixos, teto mensal gigantesco — praticamente inalcançável).
  return 'A nuvem atingiu o limite de gravação do período (raro no plano pago). Nada foi perdido: o envio recomeça sozinho quando o limite virar, em '
    +(horas?horas+'h ':'')+minutos+'min (por volta das 21h, horário de Brasília).';
}
function schedule(delay){if(timer)clearTimeout(timer);timer=setTimeout(()=>tick('agendado'),Math.max(250,delay||800));}
function scheduleHeartbeat(){
  if(typeof document==='undefined')return;
  if(timer)clearTimeout(timer);
  // v7.0.1 — antes, com a janela escondida isto apenas reagendava sem consultar
  // (o PC ficava parado no tempo). Agora consulta também, só que mais devagar.
  const base=document.hidden?HEARTBEAT_OCULTO_MS:HEARTBEAT_MS;
  const wait=failures?Math.min(300000,5000*Math.pow(2,Math.min(failures,6))):base;
  timer=setTimeout(()=>tick('heartbeat'),wait);
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
  trocarEstado(normalizarEstado(Object.assign(loadState(),{cursor:0,versions:{},hashes:{},known:{},initialPull:true,lastOk:0,paused:true,heldLocalOnly:[],pauseReason:'escolha-inicial',cloudGeneration:result.generation})));
  outbox=[];failures=0;lastError='';
  try{localStorage.removeItem(CONFLICT_KEY);}catch(e){}
  persist();indicator(false,'Escolha o que fazer com os dados deste PC');
  return {result,paused:true};
}
// Opção 1 da escolha: enviar os dados atuais deste PC para a nuvem.
// Cada registro sobe pelo próprio id, então reenviar o mesmo dado atualiza em
// vez de criar cópia.
// ══ v6.1.4 — "MEUS DADOS NÃO APARECEM NO OUTRO PC": baixar tudo de novo ═════
// O que este PC recebe da nuvem é um DIÁRIO (cada mudança tem um número, e o PC
// guarda até onde leu = cursor). Se por qualquer motivo ele ficou com o cursor
// adiantado (nuvem zerada, recuperação, remontagem de base), o que foi criado no
// outro PC fica invisível AQUI PARA SEMPRE — é o "sempre volta esse problema".
// Aqui o cursor volta ao COMEÇO do diário e tudo é reaplicado. O que protege
// dado local é o mesmo de sempre: cada mudança só entra se for uma versão MAIS
// NOVA do que a que este PC já conhece; nada é enviado nem apagado por causa
// disto, e a nuvem não é tocada.
async function baixarTudoDaNuvem(){
  if(typeof document!=='undefined'&&busy)throw new Error('Aguarde a sincronização atual terminar.');
  if(!authorized())throw new Error('Este computador não está conectado à nuvem.');
  const pausadoAntes=!!state.paused,motivo=String(state.pauseReason||'');
  const antes=Number(state.cursor)||0;
  state.cursor=0;state.initialPull=true;
  persist();
  if(pausadoAntes)return {pausado:true,motivo,pausadoAntes:true,antes,durante:Number(state.cursor)||0};
  await tick('baixar-tudo-da-nuvem');
  return {pausado:false,antes,durante:Number(state.cursor)||0,conflitos:(state.conflicts||0)};
}

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
// Continua disponível como OPÇÃO manual (a pedido, na tela da Nuvem) — o
// caminho normal agora é sincronizar sozinho, sem perguntar nada.
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
      trocarEstado(normalizarEstado(Object.assign(loadState(),savedState)));
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
    if(!PODE_EXCLUIR.has(entity))continue;
    for(const k of Object.keys(state.known)){if(k.startsWith(entity+'|')&&!present.has(k)&&!pending.has(k))total++;}
  }
  return total;
}
function info(){return {authorized:authorized(),busy,paused:!!state.paused,pauseReason:state.pauseReason||'',heldLocalOnly:Array.isArray(state.heldLocalOnly)?state.heldLocalOnly.length:0,cursor:Number(state.cursor)||0,outbox:outbox.length,pending:pendingEstimate(),lastOk:state.lastOk||0,lastError,conflicts:(()=>{try{return JSON.parse(localStorage.getItem(CONFLICT_KEY)||'[]');}catch(e){return [];}})()};}

// Estado completo para o check-up (nada é inventado: o que não se sabe vem null)
function estadoDetalhado(){
  const s=info();
  s.totalLocal=(()=>{let t=0;const M=definicoes();for(const e of Object.keys(M))for(const _ of entriesFor(e,M[e]))t++;return t;})();
  s.porListaLocal=(()=>{const out={};const M=definicoes();for(const e of Object.keys(M)){let n=0;for(const _ of entriesFor(e,M[e]))n++;if(n)out[e]=n;}return out;})();
  s.bruto=typeof db!=='undefined'&&db?db:null;
  return s;
}
// v6.1.4 — PCs que já estavam parados na escolha (versão antiga) voltam a
// sincronizar sozinhos na primeira abertura, sem ninguém clicar em nada.
(function destravarPausaIngreme(){
  try{
    if(state.paused&&(state.pauseReason==='escolha-inicial'||!state.pauseReason)){
      state.paused=false;state.pauseReason='';state.regras=REGRAS;persist();
    }
  }catch(e){}
})();

// ═══════════════════════════════════════════════════════════════════════════
// v7.0.1 (23/09/2026) — A TELA AO VIVO
// Queixa do dono: "o banco demora atualizar; o que faço em um computador não dá
// pra ver no outro". Além da espera (o motor procurava de 60 em 60 segundos e
// parava com a janela escondida — corrigido acima), havia isto: a novidade
// descia e ficava no banco, mas a LISTA NA TELA continuava mostrando o retrato
// antigo até a pessoa trocar de tela e voltar. Agora a tela da frente se
// redesenha sozinha quando a leitura trouxe mudança.
//
// As travas (para não atrapalhar ninguém no meio do trabalho):
//   • janela escondida (minimizada/atrás): não há tela para atualizar;
//   • modal aberto: a pessoa pode estar no meio de um cadastro;
//   • cursor dentro de campo/botão: pode estar digitando;
//   • telas de documento (vender, ler contador, configurar, importar): ficam de
//     fora, porque nelas o redesenho apagaria o que está sendo preenchido;
//   • e nunca em rajada: no máximo um redesenho a cada 4 segundos.
// O redesenho chama direto o render da tela (NÃO o navigateTo, que rola a
// página para o topo e mexe na barra lateral — isso sim incomodaria).
// v7.0.2 — AVISO DE CARGA COMPLETA ("queria que aparecesse tudo de uma vez")
// Enquanto a leitura da nuvem está em curso, este aviso cobre a tela e mostra a
// contagem; a lista do sistema só aparece quando TUDO chegou. Some sozinho no
// fim (ou se der erro) — nunca prende ninguém.
let cargaAberta=false, cargaItens=0;
function mostrarCargaNuvem(mostrar,texto){
  if(typeof document==='undefined'||!document.body)return;
  const atual=document.getElementById('digicopy-carga-nuvem');
  if(!mostrar){ if(atual)atual.remove(); cargaAberta=false; return; }
  cargaAberta=true;
  let el=atual;
  if(!el){
    el=document.createElement('div');
    el.id='digicopy-carga-nuvem';
    el.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(10,30,138,.97);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:24px';
    el.innerHTML='<div style="font-size:16px;font-weight:800">Baixando os dados da nuvem…</div>'
      +'<div id="digicopy-carga-conta" style="font-size:13.5px;opacity:.92"></div>'
      +'<div style="font-size:12px;opacity:.72;max-width:430px;line-height:1.55">Trazendo tudo de uma vez: a tela abre já com os dados completos. Não feche o sistema agora.</div>';
    document.body.appendChild(el);
  }
  const conta=document.getElementById('digicopy-carga-conta');
  if(conta)conta.textContent=texto||'';
}
// ═══════════════════════════════════════════════════════════════════════════
// v7.0.4 (23/09/2026) — AVISO INSTANTÂNEO DA NUVEM + RECUPERAÇÃO AUTOMÁTICA
//
// PEDIDO DO DONO: "não sabe o que é instantâneo já aparecer os dados?".
// Como fica: além do ritmo de 3 s, o PC deixa UM canal aberto com a nuvem
// (/v1/changes/watch). Quando alguém grava em qualquer PC, a nuvem responde
// NAQUELE INSTANTE e este PC puxa e redesenha a tela — sem clique, sem tela na
// frente, sem espera. Se o motor da nuvem ainda não tiver esse canal (Worker
// antigo), o PC recebe 404 uma vez e segue no ritmo de 3 s, como antes: nada
// quebra, nada aparece na tela.
let canalInstantaneoParado=false, canalAberto=false;
async function canalInstantaneo(){
  if(canalInstantaneoParado||canalAberto)return;
  if(typeof document!=='undefined'&&document.hidden)return;
  if(state.paused||!authorized())return;
  const call=api(); if(!call)return;
  canalAberto=true;
  try{
    const r=await call('/v1/changes/watch?cursor='+encodeURIComponent(Number(state.cursor)||0)+'&timeout=20',{method:'GET'});
    if(r&&r.novidade&&!busy)await tick('aviso-da-nuvem');
  }catch(e){
    const st=Number(e&&e.status)||0;
    if(st===404||st===400){ canalInstantaneoParado=true; }   // motor antigo: só o ritmo normal
    else await dormir(5000);
  }finally{ canalAberto=false; }
  if(!canalInstantaneoParado)setTimeout(()=>{canalInstantaneo();},300);
}
try{document.addEventListener('visibilitychange',()=>{if(!document.hidden)canalInstantaneo();});}catch(e){}

// ── RECUPERAÇÃO AUTOMÁTICA (uma vez por PC, sem clicar em nada) ────────────
// O que faz: procura na nuvem TUDO que foi excluído e traz de volta o que foi
// criado por gente de verdade (tem criadoPor de usuário). O dado de exemplo do
// sistema não tem dono — esse fica onde está. Nunca traz duas vezes o mesmo
// registro (guarda a lista do que já trouxe), então se o dono apagar alguma
// coisa de propósito ela NÃO volta sozinha de novo.
const RECUP_LEDGER='digicopy_cf_recuperados_v1';
function lerRecuperados(){try{return JSON.parse(localStorage.getItem(RECUP_LEDGER)||'{}')||{};}catch(e){return {};}}
function marcarRecuperado(id){try{const m=lerRecuperados();m[String(id)]=Date.now();localStorage.setItem(RECUP_LEDGER,JSON.stringify(m));}catch(e){}}
function temDonoHumano(reg){
  // Quem NÃO tem dono: o dado de exemplo do sistema (sem autor, ou 'sistema').
  // Quem TEM dono: usuário de tela (usr_...) e também 'migracao' — este último é
  // o dado REAL que veio do sistema antigo pela importação (as telas de contrato
  // e de visita gravam assim). Ficou de fora por engano na primeira versão desta
  // regra e isso deixaria impressoras legítimas sem recuperação.
  const d=reg&&reg.data||{};const dono=String(d.criadoPor||'');
  return !!dono&&dono!=='sistema'&&dono!=='demo';
}
let varreduraCompleta=false;   // o motor da nuvem sabe paginar a lista de excluídos?
async function listarExcluidosDaNuvem(call,limiteTotal){
  const todos=[];let before=0;varreduraCompleta=false;
  for(let volta=0;volta<20;volta++){
    const url='/v1/deleted?limit=1000'+(before?('&before='+before):'');
    let r;try{r=await call(url,{method:'GET'});}catch(e){ if(volta===0)throw e; break; }
    if(r&&typeof r.temMais!=='undefined')varreduraCompleta=true;   // motor novo
    const lote=(r&&r.records)||[];
    todos.push(...lote);
    if(!lote.length||!r.temMais||!r.proximoBefore)break;
    before=Number(r.proximoBefore)||0;
    if(!before)break;
    if(limiteTotal&&todos.length>=limiteTotal)break;
  }
  return todos;
}
let recuperandoAgora=false;
async function recuperarAutomatico(){
  if(state.recuperacaoV1||recuperandoAgora)return;
  if(!authorized()||state.paused)return;
  // se falhou por rede, espera 60 s antes de tentar de novo (não fica batendo)
  if(state.recuperacaoTentativa&&(Date.now()-Number(state.recuperacaoTentativa))<60000)return;
  const call=api(); if(!call)return;
  recuperandoAgora=true;
  state.recuperacaoTentativa=Date.now();persist();
  try{
    const excluidos=await listarExcluidosDaNuvem(call);
    const jaVieram=lerRecuperados();
    const alvos=excluidos.filter(r=>r&&r.entity&&r.recordId&&!jaVieram[String(r.recordId)]&&temDonoHumano(r)
      && ['contratos','parque','leituras','os','contasReceber','vendas','clientes','produtos','equipamentos'].indexOf(r.entity)>=0
      && r.data&&typeof r.data==='object'&&Object.keys(r.data).length>0);
    let ok=0,falhas=0,primeiroErro='';
    for(const reg of alvos){
      try{
        const r=await call('/v1/restore',{method:'POST',body:JSON.stringify({entity:reg.entity,recordId:reg.recordId})});
        if(r&&r.ok!==false){ok++;marcarRecuperado(reg.recordId);}
        else{falhas++;primeiroErro=primeiroErro||((r&&r.message)||'');}
      }catch(e){falhas++;primeiroErro=primeiroErro||((e&&e.message)||String(e));}
    }
    // 2ª fonte: as fotos internas deste PC (caso o dado nunca tenha subido)
    let dasFotos=0;
    try{dasFotos=await recuperarDasFotosLocais();}catch(e){}
    if(dasFotos){try{await pushOutbox();await pullAll({silencioso:true});redesenharTelaAtual();}catch(e){}}
    // v7.0.4 — se o motor da nuvem ainda for o antigo, a lista de excluídos vem
    // limitada e a passada NÃO pode valer para sempre: fica marcada como pendente
    // e tenta de novo (de 60 em 60 s) até o motor novo ser publicado. Avisa uma
    // única vez no sino, sem travar nada.
    if(!varreduraCompleta){
      if(!state.avisoMotorAntigo){
        state.avisoMotorAntigo=true;persist();
        try{ if(typeof window.notificarEvento==='function')window.notificarEvento('aviso',
          'Para trazer de volta TUDO que foi apagado, falta publicar o motor novo da nuvem (rodar o atualizar_motor_nuvem.cmd). Depois disso a recuperação termina sozinha.',{tipo:'sync'}); }catch(e){}
      }
    }else{
      state.recuperacaoV1=true;
    }
    state.recuperacaoEm=Date.now();state.recuperacaoTotal=ok+dasFotos;persist();
    if(ok){
      const porEntidade={};alvos.forEach(r=>{porEntidade[r.entity]=(porEntidade[r.entity]||0)+1;});
      try{
        if(typeof logAction==='function')logAction('recuperacao','automatica','-',
          'Recuperação automática trouxe de volta '+ok+' registro(s): '+JSON.stringify(porEntidade));
        if(typeof window.notificarEvento==='function')window.notificarEvento('info',
          'Recuperação automática: '+ok+' registro(s) que tinham sido apagados por engano voltaram (contratos, impressoras, leituras). Confira as telas.',{tipo:'sync'});
      }catch(e){}
      await pullAll({silencioso:true});
      redesenharTelaAtual();
    }else if(falhas&&/admin/i.test(primeiroErro||'')){
      try{ if(typeof window.notificarEvento==='function')window.notificarEvento('aviso',
        'A recuperação do que foi apagado precisa ser feita no computador ADMINISTRADOR da nuvem.',{tipo:'sync'}); }catch(e){}
      state.recuperacaoV1=true;persist();   // não fica tentando a cada ciclo
    }
  }catch(e){/* tenta de novo no próximo ciclo; nada aparece na tela */}
  finally{recuperandoAgora=false;}
}

// Segunda fonte: as FOTOS internas deste PC (IndexedDB). Serve para o caso em
// que a impressora nunca chegou a subir para a nuvem (aí não existe excluído
// para restaurar). Só entram registros de contrato/parque/leitura/chamado com
// criador de gente; cada um fica marcado e entra na lista do "já recuperado",
// então apagar de propósito depois NÃO faz voltar de novo.
async function recuperarDasFotosLocais(){
  const idb=window.DIGICOPY_INDEXED_DB;
  if(!idb||typeof idb.listSnapshots!=='function'||typeof db==='undefined'||!db)return 0;
  let snaps=[];try{snaps=await idb.listSnapshots();}catch(e){return 0;}
  const ja=lerRecuperados();const entidades=['contratos','parque','leituras','os'];
  let voltaram=0;const porEntidade={};
  for(const snap of snaps){
    const dados=snap&&snap.data;if(!dados||typeof dados!=='object')continue;
    for(const entidade of entidades){
      const atual=Array.isArray(db[entidade])?db[entidade]:null;
      const antigo=dados[entidade];
      if(!atual||!Array.isArray(antigo))continue;
      const ids=new Set(atual.map(x=>x&&x.id!=null?String(x.id):''));
      antigo.forEach(item=>{
        if(!item||item.id==null)return;
        const k=String(item.id);
        if(ids.has(k)||ja[k])return;
        if(!temDonoHumano({data:item}))return;
        const copia=Object.assign({},item,{recuperadoDe:'foto-local',recuperadoEm:new Date().toISOString()});
        atual.push(copia);ids.add(k);voltaram++;
        porEntidade[entidade]=(porEntidade[entidade]||0)+1;
        marcarRecuperado(k);
      });
    }
  }
  if(voltaram){
    try{if(typeof saveDBAgora==='function')saveDBAgora();else if(typeof saveDB==='function')saveDB();}catch(e){}
    try{
      if(typeof logAction==='function')logAction('recuperacao','foto-local','-',
        'Recuperação das fotos deste PC: '+voltaram+' registro(s) '+JSON.stringify(porEntidade));
      if(typeof window.notificarEvento==='function')window.notificarEvento('info',
        'Fotos deste PC: '+voltaram+' registro(s) que estavam faltando voltaram (contratos/impressoras/leituras).',{tipo:'sync'});
    }catch(e){}
  }
  return voltaram;
}

const TELAS_AO_VIVO={
  dashboard:'renderDashboard', clientes:'renderClientes', produtos:'renderProdutos',
  impressoras:'renderEquipamentos', contratos:'renderContratos', parque:'renderParque',
  manutencao:'renderOs', financeiro:'renderFinanceiro', relatorios:'renderRelatorios',
  usuarios:'renderUsuarios', auditoria:'renderAuditoria'
};
const INTERVALO_REDESENHO=4000;
let ultimoRedesenho=0;
// Regra pura (testável): recebe o retrato da tela e devolve sim/não.
function podeRedesenharSync(d){
  d=d||{};
  if(d.hidden)return false;
  if(d.cargaAberta)return false;   // v7.0.2 — durante a carga, nada de pedaços na tela
  if(d.modalAberto)return false;
  if(d.focoEmCampo)return false;
  if(!d.podeRenderizar)return false;
  if(Number(d.agora)-Number(d.ultimo||0)<INTERVALO_REDESENHO)return false;
  return true;
}
function telaDaFrente(){
  try{
    const v=document.querySelector('.view:not(.hidden)');
    if(v&&v.id&&v.id.indexOf('view-')===0)return v.id.slice(5);
  }catch(e){}
  return '';
}
function redesenharTelaAtual(){
  if(typeof document==='undefined')return false;
  const tela=telaDaFrente();
  const render=TELAS_AO_VIVO[tela];
  const mr=document.getElementById('modal-root');
  const a=document.activeElement;
  const decisao=podeRedesenharSync({
    hidden:!!document.hidden,
    cargaAberta:cargaAberta,
    modalAberto:!!(mr&&!mr.classList.contains('hidden')),
    focoEmCampo:!!(a&&a!==document.body&&/INPUT|TEXTAREA|SELECT|BUTTON/.test(a.tagName||'')),
    podeRenderizar:!!(render&&typeof window[render]==='function'),
    ultimo:ultimoRedesenho, agora:Date.now()
  });
  if(!decisao)return false;
  ultimoRedesenho=Date.now();
  try{ window[render](); }catch(e){}
  return true;
}
window.DIGICOPY_CLOUD_SYNC={tick,info,estadoDetalhado,modoSoNuvem,definirSoNuvem,soltarCopiaLocal,infoSoNuvem,nuvemTemTudo,baixarTudoDaNuvem,ehLimiteDiario,recadoDoLimite,viradaDoLimite,resetCloudOnly,publishLocalToCloud,manterLocalSemEnviar,analyzeDuplicateClients,mergeDuplicateClients,duplicateClientGroups,decideReinstallGuard,localBusinessCount,listLocalOnlyKeys,hash,clean,definitions:DEFINITIONS,definicoes,podeExcluir:e=>PODE_EXCLUIR.has(e),devolverSumidos,varrerDemonstracao,ehLixoDeDemonstracao,marcarIntencaoDeExcluir,houveIntencaoDeExcluir,vigiarExclusoes,podeRedesenharSync,redesenharTelaAtual,telasAoVivo:TELAS_AO_VIVO,cargaNuvemLigada:()=>cargaAberta,mostrarCargaNuvem,temDonoHumano,recuperarAutomatico,recuperarDasFotosLocais,listarExcluidosDaNuvem,canalInstantaneo:()=>canalInstantaneoParado};

// O vigia das exclusões entra antes de tudo: ele não depende de tela.
vigiarExclusoes();
if(typeof document==='undefined')return;
setTimeout(vigiarExclusoes,4000);
setTimeout(vigiarExclusoes,15000);
// Tira os nomes de demonstração da tela assim que a base termina de abrir,
// mesmo antes de falar com a nuvem.
setTimeout(()=>{try{varrerDemonstracao();}catch(e){}},6000);
try{
  const original=window.saveDB;
  if(typeof original==='function'&&!original.__cfWrapped){
    window.saveDB=function(){
      // SÓ NUVEM: a base NÃO é gravada neste computador (segue na memória e
      // sobe para a nuvem). Fora do modo, grava como sempre gravou.
      const soNuvem=!!window.DIGICOPY_SO_NUVEM&&authorized();
      const r=soNuvem?true:original.apply(this,arguments);
      if(!applying&&authorized())schedule(900);
      return r;
    };
    window.saveDB.__cfWrapped=true;
  }
}catch(e){}
// v7.0.3 — ao clicar de volta na janela (ou trazê-la para a frente), procura
// novidade NA HORA: antes esperava 10 s e, com o ritmo antigo, a pessoa podia
// ficar olhando uma tela velha. Agora o intervalo de tolerância é curto (1 s).
try{window.addEventListener('focus',()=>{if(Date.now()-lastTick>1000)schedule(200);});}catch(e){}
try{document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastTick>1000)schedule(200);});}catch(e){}
try{window.addEventListener('online',()=>schedule(250));}catch(e){}
aplicarSoNuvem();
// A tela abre antes de a nuvem responder. Quando a base chega (e a tela estava
// vazia), redesenha a tela atual para o dono ver os dados sem apertar nada.
async function hidratarTela(){
  if(!modoSoNuvem())return;
  const vazio=(typeof db!=='undefined'&&db)?localBusinessCount()===0:false;
  if(!vazio)return;
  try{
    if(window.DIGICOPY_DB_READY)await window.DIGICOPY_DB_READY;
    if(localBusinessCount()>0&&typeof window.navigateTo==='function'){
      const tela=(function(){ try{ const v=document.querySelector('.view:not(.hidden)'); if(v&&v.id&&v.id.indexOf('view-')===0)return v.id.slice(5); }catch(e){} return 'dashboard'; })();
      window.navigateTo(tela);
      indicator(false,'Dados da nuvem carregados');
    }
  }catch(e){}
}
if(authorized()){
  schedule(1200);
  setTimeout(()=>{ try{hidratarTela();}catch(e){} },2600);
  // v7.0.4 — canal do aviso instantâneo + a recuperação do que foi apagado
  setTimeout(()=>{ try{canalInstantaneo();}catch(e){} },1500);
  setTimeout(()=>{ try{recuperarAutomatico();}catch(e){} },4000);
} else scheduleHeartbeat();
console.log('[DIGICOPY] sincronização Cloudflare incremental carregada');
})();
