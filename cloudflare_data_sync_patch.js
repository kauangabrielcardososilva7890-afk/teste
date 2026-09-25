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
// v7.0.12 — A FILA GUARDA MAIS: com 100, um trabalho fora da internet enchia a fila
// e o que ele gravasse depois só entrava conforme a fila escoava (ficava na tela). 400
// mudanças cabem folgado no navegador (~400 KB) e continuam escoando de 10 em 10.
const MAX_OUTBOX=400;
const PUSH_BATCH=10;
// v7.0.6 — PÁGINA DO DIÁRIO: 1.000 mudanças por consulta (o teto do motor da
// nuvem). Fica aqui em cima porque agora serve a DOIS caminhos: a leitura
// completa do diário e o passe rápido da abertura (ver passeRapidoInicial).
const POR_PAGINA=1000;
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
// Quanto tempo a marca "isto foi apagado por ele" continua valendo. Um dia é
// suficiente para cobrir "apagou de manhã, ficou sem internet, só voltou à noite".
// v7.0.9 — UMA SEMANA (era 1 dia) e a poda só acontece com o PC EM DIA (nada
// pendente e sem erro de nuvem). Assim, uma exclusão feita antes de um fim de
// semana sem internet não é esquecida — que era o risco de a marca expirar antes
// de a ordem de apagar chegar na nuvem.
const MARCA_EXCLUSAO_VALE=7*24*60*60*1000;
const CONFIRMA_SUMICO=3000;
let intencaoAte=0;
// ══ v7.0.7 — O QUE ELE APAGOU NÃO PODE VOLTAR (defeito provado) ══════════════
// Prova em `_tmp_prova_exclusao.js` com o motor de verdade e uma nuvem de
// mentira: apagar um contrato e fechar o programa antes de a exclusão subir
// fazia o contrato VOLTAR na próxima abertura, e a exclusão era perdida de vez
// (a nuvem continuava com ele). Mesmo efeito sem internet: o motor só varria o
// que mudou DEPOIS de conseguir falar com a nuvem, e a janela de intenção
// (60 s, só na memória) já tinha vencido quando a internet voltava.
// Conserto em duas partes:
//   1) ao clicar em apagar, o motor guarda QUAIS registros saíram (comparando a
//      lista antes e depois da função de exclusão) — não é adivinhação: o que
//      sumiu da lista naquele instante foi apagado por ele. Fica gravado no
//      estado (sobrevive a fechar o programa) com a versão que a nuvem tinha.
//   2) na varredura, um registro marcado é tratado como apagado DE PROPÓSITO: se
//      estiver faltando, a ordem de apagar vai para a fila (mesmo depois dos
//      60 s); se tiver VOLTADO da nuvem, ele sai da lista de novo e a ordem vai
//      junto. Se a nuvem recusar a exclusão, a marca sai e o motor para de
//      insistir (nada de laço batendo na porta).
// v7.0.8 — O CUSTO DO CLIQUE (defeito da minha própria v7.0.7, medido)
// O retrato que eu tirava a cada clique montava um conjunto com TODA a base
// (junção "entidade|id" de 76 mil registros): 250 ms de tela parada por clique de
// apagar. Agora o retrato é só NÚMEROS (quantos registros e uma soma dos ids) —
// custa alguns milissegundos. Quando o clique termina, o motor descobre QUAIS
// listas mudaram por esse resumo e só então olha os registros conhecidos daquela
// lista (que é o conjunto que importa: só o que existe na nuvem pode voltar).
let intencaoAntes=null;
function resumoDaBase(){
  const out=Object.create(null);
  if(typeof db==='undefined'||!db)return out;
  const M=definicoes();
  for(const e of Object.keys(M)){
    const v=db[e];
    if(Array.isArray(v)){
      let n=0,soma=0;
      for(let i=0;i<v.length;i++){
        const it=v[i];if(!it||it.id==null)continue;
        n++;const t=String(it.id);let h=0;
        for(let j=0;j<t.length;j++)h=(h*31+t.charCodeAt(j))|0;
        soma=(soma+h)|0;
      }
      out[e]={n:n,soma:soma};
    }else if(v&&typeof v==='object'&&M[e]==='map'){
      const chaves=Object.keys(v);let soma=0;
      for(const c of chaves){let h=0;for(let j=0;j<c.length;j++)h=(h*31+c.charCodeAt(j))|0;soma=(soma+h)|0;}
      out[e]={n:chaves.length,soma:soma};
    }
  }
  return out;
}
function marcarIntencaoDeExcluir(){
  intencaoAte=Date.now()+JANELA_INTENCAO; sujo=true;
  if(!intencaoAntes){try{intencaoAntes=resumoDaBase();}catch(e){intencaoAntes=null;}}
  state.intencaoExclusaoEm=Date.now();marcarEstado();persist();
}
function podeMarcarExclusao(k){
  const corte=k.indexOf('|');if(corte<=0)return false;
  const ent=k.slice(0,corte);
  return PODE_EXCLUIR.has(ent);   // v7.0.9 — inclusive orçamento, quando foi ELE quem apagou
}
function fecharIntencaoDeExclusao(){
  try{
    const antes=intencaoAntes;intencaoAntes=null;
    if(!antes)return 0;
    // 1) quais LISTAS mudaram durante o clique? (comparação de números, barata)
    const depois=resumoDaBase();
    const mudaram=[];
    for(const e of Object.keys(antes)){
      const a=antes[e],b=depois[e];
      if(!b||b.n!==a.n||b.soma!==a.soma)mudaram.push(e);
    }
    if(!mudaram.length)return 0;
    // 2) ids que existem nestas listas AGORA (só destas listas)
    const presentes=Object.create(null);
    mudaram.forEach(e=>{
      const set=new Set(),v=db[e];
      if(Array.isArray(v)){
        for(let i=0;i<v.length;i++){const it=v[i];if(it&&it.id!=null)set.add(String(it.id));}
      }else if(v&&typeof v==='object'){
        // v7.0.9 — LISTA DE MAPA TAMBÉM (defeito meu, achado pelo teste do módulo):
        // a versão numérica do retrato montava este conjunto só para array; para
        // mapa (ex.: modulosDinamicos) ele ficava VAZIO e TODO registro daquele mapa
        // era dado como "sumiu" — marcando como apagado o que ele NÃO apagou.
        // Passou despercebido enquanto mapa não podia mandar exclusão; apareceu no
        // instante em que "Excluir módulo" passou a valer.
        for(const chave of Object.keys(v))set.add(String(chave));
      }
      presentes[e]=set;
    });
    // 3) dos registros que ESTE PC conhece (os que existem na nuvem e podem
    //    voltar), marca os que saíram destas listas
    const alvo=state.excluidosDeProposito=(state.excluidosDeProposito&&typeof state.excluidosDeProposito==='object')?state.excluidosDeProposito:{};
    let marcados=0;
    for(const k in state.known){
      const corte=k.indexOf('|');if(corte<=0)continue;
      const ent=k.slice(0,corte);
      if(mudaram.indexOf(ent)<0||!podeMarcarExclusao(k))continue;
      const set=presentes[ent];
      if(set&&set.has(k.slice(corte+1)))continue;
      if(!alvo[k])marcados++;
      alvo[k]={em:Date.now(),v:Number(state.versions[k]||0)};
    }
    // só poda com o PC EM DIA: pendência na fila ou erro de nuvem significa que a
    // ordem de apagar ainda não chegou — jogar a marca fora é perder a exclusão
    const agora=Date.now(),emDia=!outbox.length&&!lastError;
    if(emDia){
      Object.keys(alvo).forEach(k=>{ if(agora-Number((alvo[k]&&alvo[k].em)||0)>MARCA_EXCLUSAO_VALE)delete alvo[k]; });
      const chaves=Object.keys(alvo);
      if(chaves.length>5000)chaves.slice(0,chaves.length-5000).forEach(k=>delete alvo[k]);
    }
    if(marcados)marcarEstado();
  }catch(e){}
  return 0;
}
function temMarcaDeExclusao(k){const a=state.excluidosDeProposito;return !!(a&&a[k]);}
// v7.0.9 — "ELE APAGOU DE PROPÓSITO": a marca acima existe justamente para o
// registro não voltar. A RECUPERAÇÃO não estava olhando esta marca (defeito
// provado: o contrato apagado de propósito voltava pela recuperação automática).
// Regra igual à do "voltou da nuvem": se a versão que veio da nuvem for MAIS NOVA
// que a da marca, alguém mexeu depois — a edição vale mais e a recuperação pode
// trazer (nada de perder edição de outro computador).
function ehExclusaoDele(k,versaoNaNuvem){
  const a=state.excluidosDeProposito;
  if(!a||!a[k])return false;
  if(versaoNaNuvem!=null&&Number(versaoNaNuvem)>Number((a[k]&&a[k].v)||0))return false;
  return true;
}
// v7.0.7 — para as funções de apagar que o vigia NÃO alcança por nome (são
// internas do módulo): o próprio módulo embrulha a função com esta ferramenta.
// Foi assim que "Excluir" (histórico de leituras, patch v52210) ficou sem avisar
// a nuvem: o botão chama a função direto, e ela não existe em window.
// Para o módulo que apaga dentro de um laço (sem função própria para embrulhar):
// ele avisa registro por registro, logo antes de tirar da lista.
function registrarExclusaoDeProposito(entity,id){
  try{
    const k=key(entity,id);
    if(!podeMarcarExclusao(k))return false;
    const alvo=state.excluidosDeProposito=(state.excluidosDeProposito&&typeof state.excluidosDeProposito==='object')?state.excluidosDeProposito:{};
    alvo[k]={em:Date.now(),v:Number(state.versions[k]||0)};
    marcarEstado();persist();sujo=true;
    return true;
  }catch(e){return false;}
}
function exclusaoVigiada(fn){
  if(typeof fn!=='function')return fn;
  if(fn.__vigiadaExclusao)return fn;
  const vigiada=function(){
    marcarIntencaoDeExcluir();
    const r=fn.apply(this,arguments);
    try{
      if(r&&typeof r.then==='function'){r.then(()=>fecharIntencaoDeExclusao()).catch(()=>fecharIntencaoDeExclusao());}
      else fecharIntencaoDeExclusao();
    }catch(e){}
    return r;
  };
  vigiada.__vigiadaExclusao=true;
  return vigiada;
}
function limparMarcaDeExclusao(k){
  const a=state.excluidosDeProposito;
  if(a&&a[k]){delete a[k];marcarEstado();}
}
function houveIntencaoDeExcluir(){ return Date.now()<intencaoAte; }
window.DIGICOPY_EXCLUSAO_INTENCIONAL=marcarIntencaoDeExcluir;

// v7.0.7 — LISTA COMPLETA (levantamento no repositório, função por função).
// Estavam FALTANDO quatro caminhos que apagam registro de verdade no sistema de
// hoje; por eles, a exclusão nunca era enviada e o registro voltava:
//   · removerRegistro           (ficha do cliente: venda, conta a receber, chamado, leitura)
//   · excluirChamadoV52422      ("Apaga SEM volta — nem aqui nem em nenhuma outra lista")
//   · estornarVenda             (tira a conta a receber da venda estornada)
//   · estornarOrcamentosMarcados(exclui a venda gerada pelo orçamento estornado)
// Ficaram de fora, de propósito, as limpezas automáticas do próprio sistema
// (seedData, limpeza de demonstração, revalidação de orçamento, normalização do
// admin): essas NUNCA mandam apagar na nuvem — é a regra "nenhum computador
// apaga dado sozinho". O teste `test_exclusao_nao_volta.js` confere, a cada
// rodada, que nenhum caminho novo de exclusão ficou fora desta lista.
const FUNCOES_QUE_EXCLUEM=['deleteVenda','deleteCliente','deleteProduto','deleteCR',
  'deleteUsuario','deleteLeituraContrato','excluirVendaNeo','excluirVendaSelecionada',
  'excluirVendaUnificado','excluirClienteClassic','excluirClientesSelecionados',
  'excluirClientesCascata','excluirProdutoUnificado','excluirContratoUnificado',
  'excluirContratoOperacional','excluirChamadosSelecionados','excluirFinanceiroSelecionados',
  'excluirLancamentosFinanceiro','excluirLeiturasMarcadas','excluirOrcamentosMarcados',
  'excluirRecarga','excluirTecnico','excluirUsuario','removerRegistro',
  'excluirChamadoV52422','estornarVenda','estornarOrcamentosMarcados',
  // removeTecnico (app.js) hoje não tem chamador — é código morto. Fica vigiado
  // mesmo assim: se alguém ligar de novo na tela, já nasce coberto.
  'removeTecnico',
  // v7.0.9 — "Excluir módulo" (tabela dinâmica). Ficou de fora e o módulo voltava
  // inteiro, com os registros dele, na próxima abertura (defeito provado).
  'confirmarExcluirModulo'];
function vigiarExclusoes(){
  if(typeof window==='undefined')return;
  let faltando=0;
  FUNCOES_QUE_EXCLUEM.forEach(nome=>{
    const original=window[nome];
    if(typeof original!=='function'||original.__vigiado){if(typeof original!=='function')faltando++;return;}
    const vigiada=function(){
      marcarIntencaoDeExcluir();
      const r=original.apply(this,arguments);
      // a exclusão pode terminar depois (confirmação/promessa): a conta do que
      // saiu da lista é fechada quando ela realmente termina
      try{
        if(r&&typeof r.then==='function'){r.then(()=>fecharIntencaoDeExclusao()).catch(()=>fecharIntencaoDeExclusao());}
        else fecharIntencaoDeExclusao();
      }catch(e){}
      return r;
    };
    vigiada.__vigiado=true;
    window[nome]=vigiada;
  });
  // v7.0.7 — se algum caminho de exclusão não pôde ser vigiado, isso é registrado
  // (o painel de diagnóstico mostra) em vez de passar em silêncio: era assim que
  // uma exclusão ficava sem subir para a nuvem e o registro voltava.
  try{ window.DIGICOPY_EXCLUSOES_SEM_VIGIA=faltando; }catch(e){}
  ['confirmSistema','confirm','lfbConfirm'].forEach(nome=>{
    const original=window[nome];
    if(typeof original!=='function'||original.__vigiado)return;
    const vigiada=function(){
      const r=original.apply(this,arguments);
      // o sistema usa o mesmo confirm para apagar e para outras coisas: depois
      // que a pessoa confirma, fecha a conta do que saiu (com um respiro para o
      // próprio callback do sistema rodar primeiro).
      const fechar=()=>{try{setTimeout(()=>{try{fecharIntencaoDeExclusao();}catch(e){}},300);}catch(e){}};
      if(r&&typeof r.then==='function'){ r.then(ok=>{ if(ok){marcarIntencaoDeExcluir();fechar();} }).catch(()=>{}); }
      else if(r){ marcarIntencaoDeExcluir();fechar(); }
      return r;
    };
    vigiada.__vigiado=true;
    window[nome]=vigiada;
  });
}

// Listas que podem receber ordem de exclusão. As demais (as que os módulos
// remontam sozinhos) nunca apagam nada na nuvem, nem com intenção.
// v7.0.9 — `modulosDinamicos` entrou na lista: são as TABELAS criadas por ele,
// que viajam como mapa e agora têm "Excluir módulo" na tela. Sem isto, a exclusão
// não chegava na nuvem e o módulo voltava. (A varredura de registro sumido já
// funcionava para mapa; o que faltava era a permissão.)
const PODE_EXCLUIR=new Set(['empresas','usuarios','clientes','produtos','recargas',
  'equipamentos','contratos','parque','leituras','os','vendas','orcamentos',
  'contasReceber','contasPagar','tecnicos','modulosDinamicos']);

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
  s.excluidosDeProposito=(s.excluidosDeProposito&&typeof s.excluidosDeProposito==='object')?s.excluidosDeProposito:{};
  s.intencaoExclusaoEm=Number(s.intencaoExclusaoEm)||0;
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
  state.excluidosDeProposito=(state.excluidosDeProposito&&typeof state.excluidosDeProposito==='object')?state.excluidosDeProposito:{};
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
  else persistAgora();
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
// v7.0.6 — de 3 em 3 segundos o PC pedia essa contagem FRESCA (o motor da nuvem
// refaz a soma de todos os registros e mudanças para responder). Com base grande
// isso pesa na nuvem e deixa as OUTRAS consultas (as que mostram os dados)
// esperando. A conferência que decide soltar a cópia não precisa ser a cada 3 s:
// agora é no máximo uma vez por minuto — e quando não confere, o único efeito é
// o PC continuar guardando a cópia, que é o lado seguro.
let ultimaConferenciaNuvem=0;
// v7.0.17 — LIBERAR A CÓPIA LOCAL EXIGE PROVA ITEM POR ITEM (rodada 29)
// ACHADO: a liberação da cópia local (SÓ NUVEM) se apoiava em `nuvemTemTudo()`,
// que compara só a CONTAGEM (registros na nuvem >= registros daqui). Contagem não
// prova nada: 3 registros digitados aqui e ainda não subidos somem no meio de
// 80.000 que já estão lá — a conta fecha e a cópia local é apagada. Aqui a prova
// passa a ser por REGISTRO, usando o livro-caixa que o motor já mantém:
//   `state.known[k]` (a nuvem já confirmou esta chave) +
//   `state.hashes[k]` (e o conteúdo é EXATAMENTE o daqui).
// Qualquer registro sem essa prova BLOQUEIA a liberação (nada é apagado), e o
// próximo ciclo varre e envia o que faltava. Só pode negar; nunca apaga a mais.
let ultimaProva=0, provaOk=false, provaGeracao=-1, provaVarredura=-1;
function tudoConfirmadoNaNuvem(){
  if(outbox.length)return false;
  if((state.heldLocalOnly||[]).length)return false;   // tem coisa segurada de propósito: não libera
  const agora=Date.now();
  // A prova é cara (percorre a base): vale por 1 minuto — mas só enquanto NADA mudou.
  // Qualquer alteração no motor (nova gravação, envio, troca de estado) remarca o
  // estado e a prova é refeita na hora: cache velho nunca decide apagar dado.
  if(agora-ultimaProva<60000&&provaGeracao===estadoGeracao&&provaVarredura===varreduraFeita)return provaOk;
  provaGeracao=estadoGeracao;provaVarredura=varreduraFeita;
  ultimaProva=agora;
  try{
    const MAPA=definicoes();
    for(const entity of Object.keys(MAPA)){
      for(const entry of entriesFor(entity,MAPA[entity])){
        const k=key(entity,entry.id);
        if(!state.known[k]||state.hashes[k]!==hash(entry.data)){provaOk=false;return false;}
      }
    }
    provaOk=true;return true;
  }catch(e){provaOk=false;return false;}
}
async function nuvemTemTudo(){
  try{
    const agora=Date.now();
    if(agora-ultimaConferenciaNuvem<60000)return false;
    ultimaConferenciaNuvem=agora;
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
// v7.0.6 — VARREDURA SÓ QUANDO PRECISA (a tela parava a cada 3 segundos)
// A varredura confere, registro por registro, se algo mudou aqui para subir.
// Numa base grande é ela que bloqueia a tela (centenas de ms, a cada rodada,
// mesmo sem NADA ter mudado). Agora ela só repete por três motivos: o sistema
// gravou algo (saveDB/saveDBAgora — 221 pontos do programa usam isso), alguém
// apagou algo (o vigia marca) ou, de qualquer forma, a cada 10 segundos — assim
// nada pode ficar para trás, nem por um caminho que não avisou.
// A fila de envio cheia (filaCheia) mantém a varredura correndo até o fim da
// remessa: sem isso, uma remessa grande pararia em 100 registros por rodada.
let sujo=false,varreduraFeita=0,filaCheia=false;
// v7.0.12 — A MUDANÇA NÃO PODE FICAR SÓ NA MEMÓRIA (a dor do dono: "dado que some").
// O que este bloco guarda:
//   durVarredura ........ quanto tempo a última varredura levou (decide se dá para
//                         rodar a varredura NO MESMO INSTANTE da gravação);
//   dentroDaVarredura ... trava de reentrância (a varredura chama saveDB em um caso);
//   filaGravada ......... a fila coube no navegador? (se não, o dono PRECISA saber);
//   avisoFilaCheiaEm .... quando foi avisado que a fila encheu (avisa de novo a cada 5 min).
let durVarredura=null,dentroDaVarredura=false,filaGravada=true,avisoFilaCheiaEm=null,varreduraRapidaAgendada=null;
let varreduraTrabalhou=false;   // a última varredura chegou a percorrer a base (ou caiu fora de cara)
const VARREDURA_NA_MAO_MS=25;   // até isso, a varredura roda na hora (base leve)
const TETO_FECHANDO=2000;       // ao fechar, aceita bem mais que a fila normal (400): é a última chance

// v7.0.6 — GRAVAR SEM TRAVAR A REMESSA (a queixa "vai subindo aos poucos")
// O ESTADO guarda versões + conhecidos + hashes de TODOS os registros: numa base
// de 76 mil registros isso passa de 6 MB. O motor gravava esse bloco inteiro a
// CADA lote de 10 registros enviados — ou seja, o PC gastava mais tempo
// reescrevendo o estado do que conversando com a nuvem, e cada lote demorava
// mais conforme a base cresce. Agora:
//   • a FILA (pequena) vai para o disco na hora, SEMPRE — é ela que não pode
//     se perder se a luz cair (dado que ainda não subiu);
//   • o bloco grande (estado) é gravado logo em seguida, agrupado numa única
//     gravação (300 ms) — nada é perdido de verdade: o que não foi gravado é
//     reaplicado na próxima leitura, porque cada mudança só entra se for mais
//     nova do que a versão que este PC conhece.
// persistAgora() continua existindo para os momentos em que a gravação do estado
// precisa ser imediata (zerar a nuvem, escolher publicar/não publicar, fechar).
// E, para não reescrever 6 MB a cada 3 s sem nada ter mudado: o bloco grande só
// é gravado quando algo dele mudou de verdade (marcarEstado nos lugares que
// mudam) — com uma rede de segurança de 30 s, para nenhum caminho esquecido
// ficar sem gravar. Perder essa gravação por alguns segundos não estraga nada:
// cada mudança só entra se for mais nova do que a versão conhecida, e o motor da
// nuvem não regrava registro idêntico (responde "já está igual").
let gravacaoAgendada=null,estadoMudou=true,estadoGravadoEm=0;
function marcarEstado(){estadoMudou=true;}
function gravarFila(){
  try{localStorage.setItem(OUTBOX_KEY,JSON.stringify(outbox));filaGravada=true;return true;}
  catch(e){
    // A FILA NÃO COUBE: isto é risco de perda de verdade (é a fila que guarda o que ele
    // gravou). Antes ficava só no `lastError`; agora também aparece na tela, uma vez por minuto.
    lastError='Sem espaço para a fila de sincronização.';
    filaGravada=false;
    try{avisarFilaNaoGravada();}catch(e2){}
    return false;
  }
}
let avisoFilaSemEspacoEm=null;   // null = ainda não avisei (0 não serve: confunde com relógio pequeno)
function avisarFilaNaoGravada(){
  if(avisoFilaSemEspacoEm&&Date.now()-avisoFilaSemEspacoEm<60000)return;
  avisoFilaSemEspacoEm=Date.now();
  try{indicator(false,'SEM ESPAÇO para guardar a fila da nuvem ('+outbox.length+' pendente(s)) — fale com o técnico');}catch(e){}
  try{
    if(typeof window.toast==='function')window.toast('⚠️ Sem espaço no navegador: '+outbox.length+' mudança(s) pendente(s) não puderam ser guardadas. Fale com o técnico.','error');
  }catch(e){}
}
// ═══════════════════════════════════════════════════════════════════════════
// v7.0.9 — RECADO QUE NÃO PODE SE PERDER (defeito provado)
// O sino (window.notificarEvento) só registra quando há SESSÃO aberta — e o motor
// da nuvem começa a rodar no instante em que a tela abre, antes de qualquer login
// (basta o aparelho estar autorizado). O aviso era descartado em silêncio e a
// marca de "já avisei" ficava gravada do mesmo jeito: o dono NUNCA ficava sabendo.
// Agora o recado fica guardado aqui e é entregue assim que houver sessão.
// ───────────────────────────────────────────────────────────────────────────
function entregarRecados(){
  try{
    const pend=state.recadosPendentes;
    if(!pend)return 0;
    const chaves=Object.keys(pend);
    if(!chaves.length)return 0;
    let n=0;
    for(const k of chaves){
      const item=pend[k]||{};
      let guardado;
      const sino=(typeof window!=='undefined')?window.notificarEvento:null;
      if(typeof sino!=='function')guardado=true;   // sem sino: nada a fazer, não fica tentando
      else{ try{ guardado=sino(item.tipo||'aviso',String(item.texto||''),{tipo:'sync'})!==false; }catch(e){ guardado=false; } }
      if(guardado){
        const entregues=state.recadosEntregues=(state.recadosEntregues&&typeof state.recadosEntregues==='object')?state.recadosEntregues:{};
        entregues[k]=Date.now();delete pend[k];n++;
      }
    }
    // v7.0.9 — gravado o "já entreguei" na hora agendada: sem isto o aviso
    // repetiria a cada abertura do programa (o recado já saiu, mas o estado não)
    if(n){marcarEstado();persist();}
    return n;
  }catch(e){return 0;}
}
function enfileirarRecado(chave,texto,tipo){
  try{
    const entregues=state.recadosEntregues;
    if(entregues&&entregues[chave])return false;   // já avisei: não repete
    const pend=state.recadosPendentes=(state.recadosPendentes&&typeof state.recadosPendentes==='object')?state.recadosPendentes:{};
    pend[chave]={texto:String(texto||''),tipo:tipo||'aviso'};
    marcarEstado();
    entregarRecados();                            // entrega na hora se já houver sessão
    persist();
    return true;
  }catch(e){return false;}
}
let espacoAvisado=false;
function avisarEspaco(){
  if(espacoAvisado)return;
  espacoAvisado=true;   // avisa uma vez por sessão (o recado fica guardado até ser lido)
  lastError='Sem espaço no navegador para o controle da nuvem.';
  enfileirarRecado('sem-espaco',
    'O navegador ficou SEM ESPAÇO para guardar o controle da nuvem (a lista de versões e a fila). O sistema continua funcionando, mas se você fechar agora pode perder o envio do que acabou de fazer. Feche abas/limpe o histórico ou avise o suporte.');
}
function gravarEstado(){
  try{localStorage.setItem(STATE_KEY,JSON.stringify(state));estadoMudou=false;estadoGravadoEm=Date.now();return true;}
  catch(e){
    // v7.0.9 — SEM ESPAÇO: o que é DERIVADO sai primeiro
    // `versions` é remontado na próxima leitura completa (e, no modo SÓ NUVEM, é
    // zerado a cada abertura de qualquer forma). Jogar fora é seguro: o pior caso é
    // reaplicar/reconferir o que já está igual — e a nuvem responde "já está igual"
    // sem regravar nada. O que NÃO pode sair é a fila e a marca do que ele apagou.
    try{
      if(state.versions&&Object.keys(state.versions).length){
        state.versions={};
        localStorage.setItem(STATE_KEY,JSON.stringify(state));
        estadoMudou=false;estadoGravadoEm=Date.now();
        avisarEspaco();
        return true;
      }
    }catch(e2){}
    avisarEspaco();
    return false;
  }
}
function persist(){
  const okFila=gravarFila();
  if(gravacaoAgendada)return okFila;
  if(!estadoMudou&&(Date.now()-estadoGravadoEm)<30000)return okFila;
  try{ gravacaoAgendada=setTimeout(function(){gravacaoAgendada=null;gravarEstado();},300); }
  catch(e){ return gravarEstado()&&okFila; }
  return okFila;
}
function persistAgora(){
  if(gravacaoAgendada){try{clearTimeout(gravacaoAgendada);}catch(e){}gravacaoAgendada=null;}
  const okEstado=gravarEstado();
  return gravarFila()&&okEstado;
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

// v7.0.6 — A CÓPIA QUE SOBRAVA: até aqui esta função copiava (clean) o registro
// inteiro de TODA a base em cada varredura, e o hash copiava de novo. Numa base
// de 76 mil registros isso é o que travava a tela por centenas de ms a cada
// rodada. Agora entrega o registro como ele está: o hash já aplica a limpeza
// dentro dele (mesmo resultado de antes, porque limpar duas vezes é igual a
// limpar uma) e a limpeza passou a ser feita no único lugar em que ela importa —
// na hora de MONTAR o que vai para a nuvem.
function entriesFor(entity,mode){
  if(typeof db==='undefined'||!db)return [];
  const value=db[entity];
  if(mode==='array')return (Array.isArray(value)?value:[]).filter(x=>x&&x.id).map(x=>({id:String(x.id),data:x}));
  if(mode==='root')return value&&typeof value==='object'?[{id:'__root__',data:value}]:[];
  if(mode==='contador')return value&&typeof value==='object'?[{id:'__root__',data:value}]:[];
  if(mode==='map')return value&&typeof value==='object'?Object.keys(value).map(id=>({id:String(id),data:{value:value[id]}})):[];
  return [];
}
function findLocal(entity,mode,id){
  if(typeof db==='undefined'||!db)return null;
  if(mode==='array'){const arr=Array.isArray(db[entity])?db[entity]:[];return arr.find(x=>x&&String(x.id)===String(id))||null;}
  if(mode==='root')return db[entity]||null;
  if(mode==='map')return db[entity]&&Object.prototype.hasOwnProperty.call(db[entity],id)?{value:db[entity][id]}:null;
  return null;
}
// v7.0.6 — A CONTA QUE FALTAVA (por que a base "vai subindo aos poucos")
// Medido no banco de prova (`_tmp_bench.js`, fora do programa): com 76 mil
// registros e 91 mil mudanças no diário, remontar a base levava 17 SEGUNDOS só
// de trabalho do PC — e o custo crescia a cada mudança. O motivo: para CADA
// mudança o motor varria a lista inteira procurando o registro (findIndex). Isso
// é conta quadrática (90 mil × lista de dezenas de milhares = bilhões de
// comparações). Como o diário é lido em ORDEM (do antigo para o novo), o começo
// voava — listas pequenas — e o FIM, que é justamente o que ele acabou de fazer,
// arrastava: era o "tudo até tal dia sobe rapidinho e o que foi feito depois
// demora e vai subindo aos poucos".
// Aqui entra um índice id → posição, que é conferido antes de ser usado: se
// alguém mexeu na lista por fora (ordenou, trocou de lugar), a conferência
// falha e o índice é refeito na hora. Nada de confiar em índice velho.
const INDICE_LISTA={};
function montarIndice(c,arr){
  const m=new Map();
  for(let j=0;j<arr.length;j++){const it=arr[j];if(it&&it.id!=null)m.set(String(it.id),j);}
  c.mapa=m;c.len=arr.length;c.arr=arr;
}
function posicaoNaLista(entity,id){
  if(typeof db==='undefined'||!db)return -1;
  const arr=db[entity];
  if(!Array.isArray(arr))return -1;
  const alvo=String(id);
  let c=INDICE_LISTA[entity];
  if(!c||c.arr!==arr){ c={arr:arr,len:0,mapa:new Map()};INDICE_LISTA[entity]=c; }
  if(c.len>arr.length){
    montarIndice(c,arr);              // encurtou (exclusão): as posições mudaram
  }else if(c.len<arr.length){
    // Cresceu. Antes de aceitar como "acrescentou no fim" (que é o caso da
    // remontagem inteira da base: só push), confere se o último registro
    // conhecido continua no mesmo lugar. Se saiu do lugar, foi unshift/ordenação
    // e o índice tem de ser refeito — nada de posição torta.
    const ultimo=c.len-1;
    const mesmoLugar=ultimo<0||(arr[ultimo]&&c.mapa.get(String(arr[ultimo].id))===ultimo);
    if(mesmoLugar){
      for(let j=c.len;j<arr.length;j++){const it=arr[j];if(it&&it.id!=null)c.mapa.set(String(it.id),j);}
    }else montarIndice(c,arr);
  }
  c.len=arr.length;
  const i=c.mapa.get(alvo);
  if(i!==undefined&&arr[i]&&String(arr[i].id)===alvo)return i;
  if(i!==undefined){ montarIndice(c,arr); const j=c.mapa.get(alvo); return (j!==undefined&&arr[j]&&String(arr[j].id)===alvo)?j:-1; }
  // Não está no índice. Aqui vale a conferência feita acima (mesmo objeto de
  // lista, tamanho compatível e último registro no lugar): o registro não existe
  // nesta lista AINDA — é o caso normal da remontagem, o registro está chegando
  // agora. Procurar na lista inteira aqui seria voltar à conta quadrática.
  return -1;
}
function applyRemote(change,mapaDado){
  const mode=(mapaDado||definicoes())[change.entity]||(change.entity&&!NAO_SINCRONIZA.has(change.entity)?'array':null);if(!mode)return false;
  const k=key(change.entity,change.recordId),knownVersion=Number(state.versions[k]||0);
  if(Number(change.version)<=knownVersion)return false;
  let changed=false;
  if(mode==='array'){
    if(!Array.isArray(db[change.entity]))db[change.entity]=[];
    const arr=db[change.entity],idx=posicaoNaLista(change.entity,change.recordId);
    // v5.22.92 — ORÇAMENTO NUNCA SOME POR MANDADO DA NUVEM.
    // Orçamento sumindo foi o bug de "cliquei e não achei". Mesmo que outro
    // aparelho mande apagar, aqui o orçamento fica marcado como excluído
    // (sai das listas de trabalho, mas segue no banco e volta em Estornar)
    // em vez de desaparecer de verdade.
    if(change.operation==='delete'&&change.entity==='orcamentos'){
      if(idx>=0){ arr[idx].status='excluido'; arr[idx].excluidoEm=arr[idx].excluidoEm||new Date().toISOString(); changed=true; }
      marcarEstado();
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
  marcarEstado();
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
// v7.0.13 — "NÃO ESTÁ APARECENDO NENHUM DADO, É NORMAL?"
// Pergunta do dono (24/09). Num endereço novo a resposta é sim (portão da nuvem + a
// regra de não guardar nada no PC). Mas a MESMA tela vazia também é o que ele vê se a
// conexão daquele computador estiver apontando para outra loja (CNPJ errado) — e aí ele
// fica no escuro, achando que perdeu tudo. Este aviso acaba com o silêncio: quando a
// nuvem RESPONDE e mesmo assim a base está vazia, aparece na tela — uma vez por
// abertura — dizendo com qual empresa a conexão está falando.
let avisouBaseVazia=false;
function empresaDaConexao(){
  try{
    const c=window.DIGICOPY_CLOUD;
    const d=c&&typeof c.deviceInfo==='function'?c.deviceInfo():null;
    if(!d)return '';
    return String(d.cnpj||d.empresaNome||d.deviceName||'');
  }catch(e){return '';}
}
function avisarSeBaseVazia(){
  // v7.0.17 — a base vazia com a nuvem respondendo também entra no relato: é o
  // caso em que ele olha a tela e não vê nada (loja nova ou conexão de outra loja).
  if(avisouBaseVazia)return;
  try{
    if(!authorized()||!state.lastOk)return;      // só depois de a nuvem responder
    if(!state.initialPull)return;                 // e só com a base inteira já trazida (senão era alarme falso)
    if(localBusinessCount()>0)return;            // tem dado na tela: nada a avisar
    avisouBaseVazia=true;
    const empresa=empresaDaConexao();
    relatarSaude('base_vazia','conexao='+(empresa||'sem empresa identificada'));   // v7.0.17
    if(typeof window.toast==='function'){
      window.toast('Nuvem conectada'+(empresa?' ('+empresa+')':'')+
        ': nenhum registro nesta empresa. Se você esperava ver seus dados, esta conexão pode ser de outra loja — confira em Nuvem → Conexões.', 'info');
    }
  }catch(e){}
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
// ══ v7.0.6 — PASSE RÁPIDO: o estado de AGORA antes de recontar a história ═══
// O diário da nuvem é lido em ordem (do antigo para o novo). Numa base grande,
// isso significa que o que ele ACABOU de fazer é a ÚLTIMA coisa a aparecer — e
// é exatamente a queixa: "tudo cadastrado até tal dia sobe rapidinho e o que foi
// feito depois demora e vai subindo aos poucos".
// Aqui o motor dá um pulo no FIM do diário e aplica as últimas mudanças
// primeiro, para a tela ficar com o estado de AGORA em segundos; a leitura
// completa continua logo depois e recompõe o resto.
// Por que isso não pode "voltar versão": cada mudança só entra se for mais NOVA
// do que a versão que este PC já conhece (a mesma trava de sempre). Aplicar a
// mais nova primeiro só faz as antigas serem descartadas depois.
// Só roda quando este PC vai remontar a base do zero (cursor 0 — é o caso do
// modo SÓ NUVEM, em toda abertura) e só UMA vez por sessão.
const PASSE_RAPIDO=3000;      // últimas 3 mil mudanças (3 páginas)
let passeRapidoFeito=false;
async function passeRapidoInicial(call){
  if(passeRapidoFeito)return false;
  passeRapidoFeito=true;
  if(Number(state.cursor)>0)return false;              // já está em dia: não precisa
  let maxSeq=0;
  try{
    const st=await comPaciencia(()=>call('/v1/status',{method:'GET'}));
    maxSeq=Number(st&&st.totals&&st.totals.cursor)||0;
  }catch(e){return false;}
  if(!(maxSeq>PASSE_RAPIDO))return false;              // diário pequeno: a leitura já é rápida
  const mapa=definicoes();
  let cursor=Math.max(0,maxSeq-PASSE_RAPIDO),paginas=0,changed=false;
  try{
    do{
      const data=await comPaciencia(()=>call('/v1/changes?cursor='+encodeURIComponent(cursor)+'&limit='+POR_PAGINA,{method:'GET'}));
      for(const item of (data.changes||[])){if(applyRemote(item,mapa))changed=true;}
      cursor=Number(data.nextCursor)||cursor;
      paginas++;
      if(!data.hasMore)break;
    }while(paginas<5);
  }catch(e){ return changed; }
  if(changed){
    applying=true;
    try{if(typeof saveDBAgora==='function')saveDBAgora();else if(typeof saveDB==='function')saveDB();}
    finally{applying=false;}
    // a tela da frente já pode mostrar o estado de agora (mesma trava de sempre:
    // se estiver digitando, o redesenho fica pendente e entra na primeira brecha)
    try{redesenhoPendente=true;tentarRedesenhoPendente();}catch(e){}
  }
  return changed;
}
async function pullAll(opcoes){
  const silencioso=!!(opcoes&&opcoes.silencioso);
  const cargaCompleta=silencioso?false:cargaPedida;cargaPedida=false;
  const call=api();if(!call)throw new Error('API Cloudflare não carregada.');
  let changed=false,pages=0;
  // v7.0.2 — página maior: menos idas e voltas para trazer a base inteira.
  // (O Worker limita; se ele ainda estiver com o teto antigo, vem 500 e nada quebra.)
  // (v7.0.6: a constante subiu para o topo do arquivo, porque o passe rápido usa a mesma.)
  // v7.0.3 — ORDEM DO DONO: "de mostrar dados quero NADA que envolva eu fazer
  // alguma coisa, só quero que mostre normal". O aviso de carga passa a aparecer
  // SÓ quando este PC não tem base nenhuma (primeira vez/PC novo) — aí não há o
  // que mostrar de qualquer forma. Com base já aqui, a leitura corre em silêncio
  // e a tela se atualiza no fim, sem tela azul nenhuma.
  const baseVazia=(typeof db==='undefined'||!db)?true:(localBusinessCount()===0);
  const comAviso=cargaCompleta&&baseVazia;
  if(comAviso)mostrarCargaNuvem(true,'conectando…');
  try{
  // v7.0.6 — antes de recontar a história inteira, mostra o estado de agora
  const mapa=definicoes();
  if(await passeRapidoInicial(call))changed=true;
  do{
    const data=await comPaciencia(()=>call('/v1/changes?cursor='+encodeURIComponent(Number(state.cursor)||0)+'&limit='+POR_PAGINA,{method:'GET'}));
    for(const item of (data.changes||[])){if(applyRemote(item,mapa))changed=true;}
    const cursorAntes=Number(state.cursor)||0;
    state.cursor=Number(data.nextCursor)||cursorAntes;
    if(Number(state.cursor)!==cursorAntes)marcarEstado();
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
  // v7.0.17 — ACHADO DA RODADA 29: o 429 do FREIO DE COTA estava entrando aqui como
  // se fosse "nuvem ocupada". Resultado: em vez de dormir até a virada (caminho do
  // limite), o app insistia com paciência e ainda gastava tentativa e cota — o
  // mesmo defeito que a auditoria da v6.1.11 corrigiu na porta da frente, reaberto
  // por esta. Agora a marca de cota (ou o recado de limite) manda para o caminho do
  // limite na hora; sobrecarga de verdade (429/5xx sem a marca) segue com paciência.
  if(erro&&erro.quota)return false;
  if(ehLimiteDiario(erro&&(erro.message||erro.error)))return false;
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
let forcarVarredura=false;   // true quando alguém pediu na mão (check-up, publicar…)
// v7.0.12 — `opcoes.teto`: quantas mudanças esta varredura aceita enfileirar.
// O teto normal é 100 (MAX_OUTBOX). Ao FECHAR a janela o teto sobe para 500: é a
// última chance de guardar o que ele gravou — e guardar demais é bem melhor do que
// perder (a fila escoa de 10 em 10 quando a nuvem responde).
function scanLocal(opcoes){
  const teto=Math.max(1,Number(opcoes&&opcoes.teto)||MAX_OUTBOX);
  return comCronometro(function(){
  varreduraTrabalhou=false;   // a marca é POR CHAMADA: a de batida (que cai fora de cara) não apaga a medida da de verdade
  if(!state.initialPull||typeof db==='undefined'||!db)return 0;
  if(!forcarVarredura&&!sujo&&!outbox.length&&!filaCheia&&Date.now()-varreduraFeita<10000)return 0;
  varreduraTrabalhou=true;   // daqui para baixo ela percorre a base: é ESTE o custo medido
  varreduraFeita=Date.now();sujo=false;marcarEstado();
  const pending=pendingKeys();let added=0;
  const held=new Set(state.heldLocalOnly||[]);
  // Fila de limpeza: some da nuvem o que não viaja mais, aos poucos.
  if((state.limpar||[]).length){
    const fatia=state.limpar.slice(0,40);
    for(const k of fatia){
      if(outbox.length>=teto)break;
      if(pending.has(k))continue;
      const corte=k.indexOf('|');
      outbox.push({key:k,hash:null,mutation:{mutationId:mutationId(),entity:k.slice(0,corte),recordId:k.slice(corte+1),operation:'delete',baseVersion:Number(state.versions[k]||0)}});
      pending.add(k);added++;
    }
    state.limpar=state.limpar.filter(k=>!pending.has(k));
  }
  const MAPA=definicoes();
  for(const entity of Object.keys(MAPA)){
    if(outbox.length>=teto)break;
    const mode=MAPA[entity],entries=entriesFor(entity,mode),present=new Set(entries.map(x=>key(entity,x.id)));
    for(const entry of entries){
      if(outbox.length>=teto)break;
      const k=key(entity,entry.id),h=hash(entry.data);
      if(!state.sumindo||typeof state.sumindo!=='object')state.sumindo={};
      if(state.sumindo[k])delete state.sumindo[k];
      if(held.has(k)||state.hashes[k]===h||pending.has(k))continue;
      outbox.push({key:k,hash:h,mutation:{mutationId:mutationId(),entity,recordId:entry.id,operation:'upsert',baseVersion:Number(state.versions[k]||0),data:clean(entry.data)}});
      pending.add(k);added++;
    }
    // v7.0.9 — ORÇAMENTO APAGADO POR ELE SAI MESMO (defeito provado)
    // Aqui havia `||entity==='orcamentos'`: este PC NUNCA mandava apagar orçamento.
    // Era uma trava da v5.22.92 (impedir que um orçamento sumisse por ordem da
    // nuvem). Só que a ordem MAIS NOVA dele é a v5.24.5, escrita no próprio módulo
    // da ficha do cliente: "deletar é DE VEZ. Sai daqui, a nuvem recebe o comando
    // de apagar e os outros PCs apagam também (sem marca-fantasma)". Com a trava,
    // apagar um orçamento pela ficha não chegava na nuvem e — como o modo SÓ NUVEM
    // remonta a base do diário — ele VOLTAVA na próxima abertura (provado:
    // `test_exclusao_nao_volta.js`, caso do orçamento).
    // A PARTE PROTETORA DA v5.22.92 CONTINUA: delete vindo DA NUVEM não remove o
    // orçamento daqui — ele fica marcado como `excluido` (sai das listas de
    // trabalho e volta em Estornar), que é o comportamento que ele pediu na época.
    if(!PODE_EXCLUIR.has(entity))continue;
    const missing=Object.keys(state.known).filter(k=>k.startsWith(entity+'|')&&!present.has(k)&&!pending.has(k));
    if(!missing.length)continue;
    // v7.0.7 — vale como "ele mandou apagar": a intenção viva (clique agora) OU
    // a marca gravada do que saiu da lista quando ele clicou (sobrevive a fechar
    // o programa e a ficar sem internet — é o conserto do "apaguei e voltou").
    const mandadoApagar=k=>houveIntencaoDeExcluir()||temMarcaDeExclusao(k);
    if(!missing.some(mandadoApagar)){
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
      if(outbox.length>=teto)break;
      if(!mandadoApagar(k))continue;   // este não foi ele quem apagou: fica como está
      if(!state.sumindo[k]){ state.sumindo[k]=agora; continue; }
      if(agora-Number(state.sumindo[k])<CONFIRMA_SUMICO) continue;
      const id=k.slice(entity.length+1);
      outbox.push({key:k,hash:null,mutation:{mutationId:mutationId(),entity,recordId:id,operation:'delete',baseVersion:Number(state.versions[k]||0)}});
      pending.add(k);delete state.sumindo[k];added++;
    }
    if(missing.length)schedule(CONFIRMA_SUMICO+500);
  }
  // ══ v7.0.7 — ELE APAGOU E O REGISTRO VOLTOU (veio da nuvem) ═══════════════
  // É o caso da prova: o programa foi fechado antes de a exclusão subir; na
  // próxima abertura o diário da nuvem devolve o registro, que reaparece na
  // lista. Aqui ele sai de novo e a ordem de apagar entra na fila.
  // Cuidado para não brigar com outro computador: se a versão que veio é MAIS
  // NOVA do que a que existia quando ele apagou, alguém editou depois — a
  // edição vale mais e a marca é descartada (nada de apagar por cima de gente).
  const alvo=state.excluidosDeProposito;
  if(alvo&&typeof alvo==='object'){
    let tirou=0;
    for(const k of Object.keys(alvo)){
      if(outbox.length>=teto){filaCheia=outbox.length>=MAX_OUTBOX;break;}
      if(!podeMarcarExclusao(k)){delete alvo[k];continue;}
      if(pending.has(k))continue;
      const corte=k.indexOf('|'),ent=k.slice(0,corte),id=k.slice(corte+1);
      const arr=db[ent];
      if(!arr||typeof arr!=='object')continue;
      // v7.0.9 — MAPA (ex.: módulo dinâmico) tem o mesmo tratamento da lista:
      // se o que ele apagou voltou da nuvem, sai de novo e a ordem vai junto.
      if(!Array.isArray(arr)){
        if(!Object.prototype.hasOwnProperty.call(arr,id))continue;   // não voltou
        const vA=Number(state.versions[k]||0),vM=Number((alvo[k]&&alvo[k].v)||0);
        if(vA>vM){ delete alvo[k]; continue; }
        delete arr[id];
        outbox.push({key:k,hash:null,mutation:{mutationId:mutationId(),entity:ent,recordId:id,operation:'delete',baseVersion:vA}});
        pending.add(k);added++;tirou++;
        continue;
      }
      const pos=posicaoNaLista(ent,id);
      if(pos<0)continue;                                    // não voltou: o caminho normal resolve
      const vAtual=Number(state.versions[k]||0),vMarcada=Number((alvo[k]&&alvo[k].v)||0);
      if(vAtual>vMarcada){ delete alvo[k]; continue; }       // editaram depois do apagamento
      arr.splice(pos,1);
      outbox.push({key:k,hash:null,mutation:{mutationId:mutationId(),entity:ent,recordId:id,operation:'delete',baseVersion:vAtual}});
      pending.add(k);added++;tirou++;
    }
    if(tirou){
      marcarEstado();
      try{if(typeof saveDB==='function')saveDB();}catch(e){}
      try{redesenhoPendente=true;tentarRedesenhoPendente();}catch(e){}
    }
  }
  filaCheia=outbox.length>=MAX_OUTBOX;
  // A FILA CHEIA PRECISA APARECER (nada foi perdido: o que não coube fica na tela e
  // entra na fila conforme ela escoa — mas o dono tem de saber que a subida está lenta).
  if(filaCheia&&(!avisoFilaCheiaEm||Date.now()-avisoFilaCheiaEm>300000)){
    avisoFilaCheiaEm=Date.now();
    try{
      if(typeof window.toast==='function')window.toast('A nuvem está com a fila cheia ('+outbox.length+'). Nada foi perdido: as mudanças ficam guardadas e sobem aos poucos.','info');
    }catch(e){}
  }
  if(!filaCheia)avisoFilaCheiaEm=null;
  persist();return added;
  });
}
// ── v7.0.12 — ENFILEIRAR NA HORA (o conserto do "dado que some") ─────────────
// Antes: gravar marcava `sujo` e a varredura só rodava 900 ms depois — quem fechasse
// a janela nesse intervalo perdia a mudança (ela vivia só na memória, e o SÓ NUVEM
// remonta a base pela nuvem). Agora a varredura roda NO MESMO INSTANTE da gravação.
// Numa base grande (a varredura passa de 60 ms), rodar isso no meio do clique travaria
// a tela: nesse caso ela vai para o fim do clique (0 ms) e o fechamento da janela
// força a varredura de qualquer jeito (é síncrono, dentro do `pagehide`).
function comCronometro(fn){
  if(dentroDaVarredura)return fn();     // já estamos varrendo: não entra de novo
  const t0=Date.now();
  dentroDaVarredura=true;
  try{return fn();}
  finally{
    dentroDaVarredura=false;
    // Bancada (base de 40 mil registros): a varredura de verdade leva ~265 ms; as
    // varreduras de batida (heartbeat) caem fora logo no começo e levam ~0 ms. Só a
    // medida das varreduras que TRABALHARAM vale — senão a próxima gravação ia achar
    // que a base é leve e travaria o clique por um quarto de segundo.
    if(varreduraTrabalhou){
      const levou=Date.now()-t0;
      if(durVarredura===null||levou>durVarredura)durVarredura=levou;
    }
  }
}
function enfileirarNaHora(){
  if(dentroDaVarredura)return;                        // a varredura em curso pega a mudança
  // "nunca medido" conta como BASE GRANDE: o primeiro clique não paga o preço da medição
  if(durVarredura!==null&&durVarredura<=VARREDURA_NA_MAO_MS){   // base leve CONHECIDA: agora
    try{scanLocal();}catch(e){}
    return;
  }
  if(varreduraRapidaAgendada)return;                  // base grande: fim do clique, uma vez só
  try{
    varreduraRapidaAgendada=setTimeout(function(){varreduraRapidaAgendada=null;try{scanLocal();}catch(e){}},0);
  }catch(e){ varreduraRapidaAgendada=null; try{scanLocal();}catch(e2){} }
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
// v7.0.18 — O QUE A NUVEM CONFIRMOU TEM DE ESTAR NA BASE (defeito provado)
// O caso: ele gravou e o programa fechou antes de subir (faltou luz, travou,
// fechou sem internet, ou a fila estava grande e a gravação não coube no envio
// de despedida). Ao reabrir no modo SÓ NUVEM a base começa vazia, a fila pendente
// SOBE e a nuvem confirma — mas a confirmação só atualizava o livro-caixa e
// consumia a fila, sem colocar o registro na base. O eco da nuvem é pulado pelo
// guarda de versão ("já conheço esta versão") e o registro ficava na nuvem, mas
// INVISÍVEL neste PC até a próxima reabertura: o "sumiu ao fechar e abrir".
// O conserto: ao confirmar um upsert, se o registro NÃO está na base, ele entra
// com os dados que acabaram de subir. NUNCA sobrescreve o que está na tela: uma
// edição mais nova pode estar esperando a vez — ela sobe no próximo ciclo.
function materializarConfirmado(item){
  try{
    const mut=item&&item.mutation;
    if(!mut||mut.operation!=='upsert'||!mut.data||typeof db==='undefined'||!db)return;
    const mode=(definicoes()[mut.entity])||(mut.entity&&!NAO_SINCRONIZA.has(mut.entity)?'array':null);
    if(!mode)return;
    let mudou=false;
    if(mode==='array'){
      if(!Array.isArray(db[mut.entity]))db[mut.entity]=[];
      if(posicaoNaLista(mut.entity,mut.recordId)<0){db[mut.entity].push(mut.data);mudou=true;}
    }else if(mode==='map'){
      if(!db[mut.entity]||typeof db[mut.entity]!=='object')db[mut.entity]={};
      if(!Object.prototype.hasOwnProperty.call(db[mut.entity],mut.recordId)&&mut.data&&Object.prototype.hasOwnProperty.call(mut.data,'value')){db[mut.entity][mut.recordId]=mut.data.value;mudou=true;}
    }else if(mode==='root'){
      if(typeof db[mut.entity]==='undefined'){db[mut.entity]=mut.data;mudou=true;}
    }else if(mode==='contador'){
      if(mut.data&&typeof mut.data==='object'){
        if(!db[mut.entity]||typeof db[mut.entity]!=='object')db[mut.entity]={};
        const alvo=db[mut.entity];
        for(const nome of Object.keys(mut.data)){const nv=Number(mut.data[nome])||0,aq=Number(alvo[nome])||0;if(nv>aq){alvo[nome]=nv;mudou=true;}}
      }
    }
    if(mudou)marcarEstado();
  }catch(e){/* materializar nunca pode atrapalhar a fila */ }
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
        if(item.mutation&&item.mutation.operation!=='delete')materializarConfirmado(item);   // v7.0.18: confirmado tem de aparecer
        state.versions[item.key]=Number(result.version)||state.versions[item.key]||0;
        if(item.mutation.operation==='delete'){delete state.known[item.key];delete state.hashes[item.key];limparMarcaDeExclusao(item.key);}
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
        limparMarcaDeExclusao(item.key);   // a nuvem não aceitou: não fica insistindo
        try{ if(typeof window!=='undefined'&&typeof window.notificarEvento==='function')window.notificarEvento('info','Havia uma alteração mais nova na nuvem ('+(item.mutation&&item.mutation.entity)+'). Se faltar algo, refaça a última edição.',{tipo:'sync'}); }catch(e){}
        remove.add(item.mutation.mutationId);
      }else if(result.error){
        rememberConflict(item,result);limparMarcaDeExclusao(item.key);remove.add(item.mutation.mutationId);
        // v7.0.18 — RECUSA DA NUVEM NUNCA MAIS EM SILÊNCIO (defeito provado: o item
        // era descartado sem nenhum aviso e, no SÓ NUVEM, sumia ao fechar e reabrir).
        // O registro continua na tela (está na base local); ele precisa saber que NÃO subiu.
        try{
          const codigoErro=(result.error&&(result.error.codigo||result.error.code))||'recusado';
          const onde=(item.mutation&&item.mutation.entity)||'?';
          relatarSaude('recusado',onde+' '+codigoErro);
          if(typeof window!=='undefined'){
            if(typeof window.toast==='function')window.toast('A nuvem recusou uma gravação ('+onde+': '+codigoErro+'). Ela continua na tela — confira e salve de novo.','error');
            if(typeof window.notificarEvento==='function')window.notificarEvento('info','A nuvem recusou uma gravação ('+onde+': '+codigoErro+'). Ela continua na tela — confira e salve de novo.',{tipo:'sync'});
          }
        }catch(e){}
      }
    }
    outbox=outbox.filter(x=>!remove.has(x.mutation.mutationId));persist();
    if(!remove.size)break;
    if(outbox.length)await dormir(180);
  }
  return sent;
}

// v7.0.7 — A "LIDERANÇA" NÃO PODE SEGURAR O ENVIO DEPOIS DE REABRIR
// O motor deixa UMA aba por navegador enviar (evita trabalho dobrado) usando um
// bilhete guardado no navegador que vale 90 s e é renovado a cada rodada. Só que
// o bilhete sobrevive ao fechar/reabrir: depois de um F5 (ou de abrir de novo),
// o navegador ficava até 90 SEGUNDOS só lendo e sem enviar nada — tempo em que
// uma exclusão recém-feita ficava esperando. Agora o bilhete vale 30 s e é
// devolvido ao fechar a janela, então a janela nova manda na hora.
const LEASE_MS=30000;
function leader(){
  const now=Date.now();let value=null;
  try{value=parse(localStorage.getItem(LEADER_KEY),null);}catch(e){}
  if(!value||value.id===TAB_ID||Number(value.until)<now){
    try{localStorage.setItem(LEADER_KEY,JSON.stringify({id:TAB_ID,until:now+LEASE_MS}));}catch(e){}
    return true;
  }
  return false;
}
function devolverLideranca(){
  try{const v=parse(localStorage.getItem(LEADER_KEY),null);if(v&&v.id===TAB_ID)localStorage.removeItem(LEADER_KEY);}catch(e){}
}
function indicator(ok,text){
  if(typeof document==='undefined')return;
  const btn=document.getElementById('btn-nuvem');if(!btn)return;
  // v7.0.12 — A FILA NA CARA: o título do botão passa a dizer quantas mudanças estão
  // por subir, se a fila encheu (nada foi perdido: sobe aos poucos) e até quando a
  // nuvem está em dia. Era o pedido do dono: "nada de fila invisível".
  try{
    const extra=' • fila: '+outbox.length+(filaCheia?' (cheia — sobe aos poucos)':'')+
      (state.lastOk?' • em dia até '+new Date(state.lastOk).toLocaleTimeString('pt-BR'):'');
    btn.title=(text||'Nuvem DIGICOPY')+extra;
    btn.dataset.fila=String(outbox.length);
    btn.dataset.filaCheia=filaCheia?'1':'0';
  }catch(e){ btn.title=text||'Nuvem DIGICOPY'; }
  btn.dataset.cloud=ok?'ok':'error';
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
    if(mudou){redesenhoPendente=true;tentarRedesenhoPendente();}
    failures=0;lastError='';state.lastOk=Date.now();   // v7.0.5 — leitura boa zera o recuo
    indicator(true,'Nuvem sincronizada • '+new Date().toLocaleTimeString('pt-BR'));
    avisarSeBaseVazia();   // v7.0.13 — base vazia com a nuvem respondendo NUNCA fica em silêncio
    return true;
  }catch(e){
    lastError=e&&e.message?e.message:String(e);
    return false;
  }finally{busy=false;scheduleHeartbeat();}
}
async function tick(reason){
  // v7.0.5 — antes de qualquer decisão, aproveita a brecha para aplicar um
  // redesenho que ficou pendente (roda a cada 3 s).
  try{tentarRedesenhoPendente();}catch(e){}
  try{entregarRecados();}catch(e){}   // v7.0.9 — recado guardado esperando sessão
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
    forcarVarredura=!(reason==='agendado'||reason==='heartbeat'||reason==='limite-conferido');
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
    if(modoSoNuvem()&&!outbox.length&&await nuvemTemTudo()&&tudoConfirmadoNaNuvem()){
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
    if(mudouNaTela){redesenhoPendente=true;tentarRedesenhoPendente();}
    indicator(true,'Nuvem sincronizada • '+new Date().toLocaleTimeString('pt-BR'));
    avisarSeBaseVazia();   // v7.0.13 — base vazia com a nuvem respondendo NUNCA fica em silêncio
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
      relatarSaude('freio',state.pauseReason||lastError);   // v7.0.17 — a nuvem recusou gravação
      state.limiteAte=viradaDoLimite();persist();
      indicator(false,lastError);
      busy=false;
      if(timer)clearTimeout(timer);
      // v7.0.5 — SONDA DE 60 EM 60 s em vez de dormir horas. Se a marca de limite
      // ficou no aparelho por engano (aconteceu em versões antigas), o PC voltava a
      // sincronizar só depois das 21h — e parecia "devagar" o dia inteiro. A sonda
      // custa uma consulta por minuto e não gasta gravação: assim que a nuvem
      // responder bem, a marca é limpa pelo caminho normal de sucesso.
      timer=setTimeout(()=>tick('limite-conferido'),Math.min(60000,Math.max(30000,state.limiteAte-Date.now())));
      return false;
    }
    indicator(false,'Nuvem pendente: '+lastError);
    // v7.0.17 — RELATO DE SAÚDE nos casos que antes ficavam só na tela dele:
    // credencial recusada, leitura falhando e fila presa (digitou e não sobe).
    if(/401|403|token|autoriz|revog|senha de conex/i.test(lastError))relatarSaude('credencial',lastError);
    else relatarSaude('falha',lastError);
    if(outbox.length&&cargaAberta===false&&Date.now()-(state.lastOk||0)>10*60*1000){
      relatarSaude('fila_presa','fila '+outbox.length+' desde '+(state.lastOk?new Date(state.lastOk).toLocaleTimeString('pt-BR'):'nunca'));
    }
    if(e&&e.status===401){
      try{if(window.DIGICOPY_CLOUD&&window.DIGICOPY_CLOUD.forgetAuth)window.DIGICOPY_CLOUD.forgetAuth();}catch(_e){}
    }
    return false;
  }finally{if(cargaAberta)mostrarCargaNuvem(false);if(busy){busy=false;scheduleHeartbeat();}}
}
// LIMITE DE GRAVAÇÃO DA NUVEM (v5.22.80; ajustado na v7.0.15, rodada 28)
// A Cloudflare tem teto de gravações: no plano grátis é por dia; no PAGO (que é
// o do dono) é por mês — e quem segura antes de estourar é o FREIO PREVENTIVO do
// motor da nuvem, que devolve "daily row write limit" (dia) ou "monthly row write
// limit" (mês). Quando isso aparece, TODA gravação volta com erro em inglês e
// parece que o sistema quebrou. Não quebrou: nada se perdeu, o envio só fica
// esperando o teto virar (meia-noite de Londres = 21h em Brasília). Aqui o
// sistema reconhece, avisa em português e para de bater na porta à toa — cada
// tentativa inútil consome limite à toa.
// ACHADO DA RODADA 28: o freio do motor usava o número do plano GRÁTIS mesmo
// numa conta PAGA; o app dormia até as 21h por causa de um teto que não era dele.
// RELATO DE SAÚDE (v7.0.17) — O QUE FALTAVA PARA A MANUTENÇÃO ACHAR O PROBLEMA
// SEM DEPENDER DO DONO. Quando algo dá errado (freio da nuvem, leitura falhando,
// credencial recusada, base vazia, fila presa), o app manda um recado CURTO e
// TÉCNICO para o motor da nuvem: tipo, mensagem, versão do app e a hora. NENHUM
// dado de negócio vai junto (nem cliente, nem valor, nem nome). O motor guarda os
// últimos relatos e os publica no /health (conferência de fora, sem token).
// Custo: no máximo 1 relato do mesmo tipo a cada 10 minutos — e nada em dia bom.
function relatarSaude(tipo,codigo){
  try{
    if(!authorized())return;
    const t=String(tipo||'').slice(0,40);if(!t)return;
    const chave='digicopy_saude_'+t, agora=Date.now();
    let antes=0;try{antes=Number(localStorage.getItem(chave)||0)||0;}catch(e){}
    if(agora-antes<10*60*1000)return;                 // já contei isso faz pouco
    try{localStorage.setItem(chave,String(agora));}catch(e){}
    const call=api();if(!call)return;
    const corpo={tipo:t,codigo:String(codigo||'').slice(0,140),
      versao:String((typeof window!=='undefined'&&window.DIGICOPY_APP_VERSION)||'')};
    const p=call('/v1/relato',{method:'POST',body:JSON.stringify(corpo)});
    if(p&&typeof p.catch==='function')p.catch(function(){});
  }catch(e){/* relato NUNCA pode atrapalhar a sincronização */}
}
function ehLimiteDiario(msg){
  return /free tier daily|daily row (write|read) limit|monthly row write limit|exceeded .*limit/i.test(String(msg||''));
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
  // v7.0.15 — o recado diz DE ONDE vem a parada (freio preventivo do motor, não o
  // teto do plano): foi essa confusão que fez parecer que ele estava no grátis.
  return 'A nuvem aplicou o freio preventivo de gravações (para não estourar o limite do plano — raro no plano pago). Nada foi perdido: o envio recomeça sozinho quando o limite virar, em '
    +(horas?horas+'h ':'')+minutos+'min (por volta das 21h, horário de Brasília).';
}
function schedule(delay){if(timer)clearTimeout(timer);timer=setTimeout(()=>tick('agendado'),Math.max(250,delay||800));}
function scheduleHeartbeat(){
  if(typeof document==='undefined')return;
  if(timer)clearTimeout(timer);
  // v7.0.1 — antes, com a janela escondida isto apenas reagendava sem consultar
  // (o PC ficava parado no tempo). Agora consulta também, só que mais devagar.
  const base=document.hidden?HEARTBEAT_OCULTO_MS:HEARTBEAT_MS;
  // v7.0.5 — RECUO CURTO. Antes, cada falha dobrava a espera até 5 MINUTOS: um
  // tropeço na internet deixava o PC quase parado e a sensação era "continua
  // devagar". Com a janela à vista o recuo agora para em 30 s; escondida,
  // continua o recuo longo (economia de bateria/rede).
  const wait=failures?(document.hidden?Math.min(300000,5000*Math.pow(2,Math.min(failures,6))):Math.min(30000,5000*Math.pow(2,Math.min(failures,3)))):base;
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
  // v7.0.7 — A UNIÃO PRECISA VALER NA NUVEM. Os duplicados saíam só daqui: a
  // nuvem continuava com eles e, na abertura seguinte, o diário devolvia os
  // repetidos (a união parecia não ter funcionado). Agora cada duplicado unido
  // fica marcado como apagado DE PROPÓSITO — a varredura manda a exclusão e o
  // caso cobre a hipótese de a janela fechar antes do envio.
  try{
    const alvo=state.excluidosDeProposito=(state.excluidosDeProposito&&typeof state.excluidosDeProposito==='object')?state.excluidosDeProposito:{};
    removeIds.forEach(id=>{const k=key('clientes',id);alvo[k]={em:Date.now(),v:Number(state.versions[k]||0)};});
    marcarIntencaoDeExcluir();marcarEstado();persist();
  }catch(e){}
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
  persistAgora();indicator(false,'Escolha o que fazer com os dados deste PC');
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
  persistAgora();
  if(pausadoAntes)return {pausado:true,motivo,pausadoAntes:true,antes,durante:Number(state.cursor)||0};
  await tick('baixar-tudo-da-nuvem');
  return {pausado:false,antes,durante:Number(state.cursor)||0,conflitos:(state.conflicts||0)};
}

async function publishLocalToCloud(){
  const antes={held:(state.heldLocalOnly||[]).slice(),reason:state.pauseReason||''};
  state.heldLocalOnly=[];state.pauseReason='';state.paused=false;state.initialPull=true;state.regras=REGRAS;persistAgora();
  const synced=await tick('publicacao-manual-completa');
  // Remessa grande não cabe numa tacada só, e a nuvem pode pedir calma no meio.
  // A escolha já foi feita: a sincronização FICA LIGADA e o resto sobe sozinho
  // em segundo plano. Voltar a pausar aqui era o que fazia tudo parar num 503.
  if(!synced){
    if(!authorized()){state.paused=true;state.heldLocalOnly=antes.held;state.pauseReason=antes.reason||'escolha-inicial';persistAgora();throw new Error('Este computador perdeu a autorização da nuvem.');}
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
  state.paused=false;state.pauseReason='';state.initialPull=true;state.regras=REGRAS;persistAgora();
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
function info(){
  const base={authorized:authorized(),busy,paused:!!state.paused,
  // v7.0.12 — os campos novos são o que faltava para a fila deixar de ser invisível:
  // quantos estão por subir (outbox, de sempre), se a fila encheu, se ela coube no
  // navegador e até quando a nuvem está em dia.
  filaCheia, filaGravada, emDiaAte:Number(state.lastOk)||0, varreduraMs:durVarredura,
  // os limites, para ninguém precisar de "número mágico" na tela nem nos testes
  tetoFila:MAX_OUTBOX, tetoAoFechar:TETO_FECHANDO,
  // v7.0.15 — o teto do dia (quando a nuvem está no limite) também aparece: é o que
  // permite a faixa dizer "a nuvem está no limite de hoje, volta às HH:MM" em vez de
  // deixar a tela vazia sem explicação.
  limiteAte:Number(state.limiteAte)||0,
  recuperando:!!state.recuperacaoCursor,pauseReason:state.pauseReason||'',heldLocalOnly:Array.isArray(state.heldLocalOnly)?state.heldLocalOnly.length:0,cursor:Number(state.cursor)||0,outbox:outbox.length,lastOk:state.lastOk||0,lastError,conflicts:(()=>{try{return JSON.parse(localStorage.getItem(CONFLICT_KEY)||'[]');}catch(e){return [];}})()};
  // v7.0.15 — O `pending` VIROU SOB DEMANDA (ganho de desempenho medido):
  // ele é o ÚNICO campo que percorre a base inteira e calcula o hash de cada registro.
  // Numa base de 76 mil registros isso custa ~223 ms (medido na bancada) por chamada —
  // e o `info()` passou a ser chamado também pela faixa da nuvem, de 15 em 15 segundos.
  // Como getter, quem lê `.pending` continua recebendo o número certo (check-up, Backup
  // e testes), e quem não lê não paga nada. Nada muda de valor; só o momento da conta.
  Object.defineProperty(base,'pending',{enumerable:true,get:pendingEstimate});
  return base;
}

// Estado completo para o check-up (nada é inventado: o que não se sabe vem null)
// v7.0.15 — CONTAR O QUE A NUVEM TEM (por lista). É a peça que faltava para o sistema
// poder dizer, sozinho, "a nuvem tem mais registros do que este computador" — a pista
// exata do "não está aparecendo nenhum dado". O check-up (ajustes_v5227) já chamava
// `S.apiStatus()` e, como a função não existia, caía no caminho alternativo.
async function apiStatus(){
  const call=api();if(!call)throw new Error('API Cloudflare não carregada.');
  const resposta=await call('/v1/status',{method:'GET'});
  const totais=(resposta&&resposta.totals)?resposta.totals:resposta;
  // v7.0.16 — O FREIO PREVENTIVO VEM JUNTO (achado da rodada 28). O /health do
  // motor da nuvem responde se o freio disparou hoje, o plano e o teto aplicado —
  // leitura pública de 1 linha, sem token e sem volume de dados. É assim que o
  // check-up consegue dizer "a nuvem está recusando gravação agora" em vez de o
  // dono ver "os dados não aparecem" sem explicação.
  if(totais&&typeof totais==='object'){
    try{
      const saida=await call('/health',{method:'GET'});
      if(saida&&saida.freio)totais.freio=saida.freio;
      // v7.0.17 — e o que os PCs contaram para a nuvem (relatos de saúde)
      if(saida&&saida.saude)totais.saude=saida.saude;
    }catch(e){/* sem o /health, o resto da contagem continua valendo */}
  }
  return totais||{};
}
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
      state.paused=false;state.pauseReason='';state.regras=REGRAS;persistAgora();
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
  // v7.0.5 — saída antecipada REAGENDA (antes o canal podia morrer de vez se
  // abrisse num momento em que a nuvem ainda não estava autorizada).
  if(typeof document!=='undefined'&&document.hidden)return;
  if(state.paused||!authorized()){setTimeout(()=>{try{canalInstantaneo();}catch(e){}},5000);return;}
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
// v7.0.8 — A CHAVE PRECISA DIZER DE QUEM É. A memória "já recuperei" era só pelo
// id do registro; como cada lista tem a sua numeração, um contrato de id 7 e uma
// impressora de parque de id 7 se confundiam: o segundo era dado como "já
// recuperado" e nunca mais voltava. Prova em test_recuperacao_completa.js.
// A leitura aceita as duas formas (as chaves antigas continuam valendo), então
// nada do que já foi recuperado volta a ser recuperado.
function jaRecuperado(memoria,entity,recordId){
  const m=memoria||{};
  return !!(m[String(entity)+'|'+String(recordId)]||m[String(recordId)]);
}
function marcarRecuperado(entity,recordId){
  try{const m=lerRecuperados();m[String(entity)+'|'+String(recordId)]=Date.now();localStorage.setItem(RECUP_LEDGER,JSON.stringify(m));}catch(e){}
}
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
// v7.0.9 — "SERÁ QUE TERMINOU?" é diferente de "SABE PAGINAR?"
// A varredura tem teto de 40 páginas por ciclo (40.000 excluídos). Se a lista for
// maior, o laço acaba pelo teto — e antes isso era tratado como "varri tudo":
// carimbava na nuvem que a recuperação estava feita e o resto NUNCA mais era
// varrido (defeito provado). Agora o cursor fica guardado e o próximo ciclo
// continua exatamente de onde parou.
let varreduraTerminou=false;
// Versão mínima do motor da nuvem que faz a varredura COMPLETA (cursor composto).
// Serve para o aviso ao dono reaparecer quando a exigência muda — e não ficar mudo
// só porque ele já tinha visto o aviso de uma exigência antiga.
const MOTOR_MINIMO='5.26.7';
async function listarExcluidosDaNuvem(call,limiteTotal,continuar){
  const todos=[];let before=0,beforeEnt='',beforeId='';varreduraCompleta=false;varreduraTerminou=false;
  // continua de onde parou (só a recuperação automática usa isto: o painel da
  // Nuvem e os testes pedem a lista do começo, como sempre pediram)
  if(continuar){
    const antigo=state.recuperacaoCursor;
    if(antigo&&Number(antigo.before)>0){before=Number(antigo.before)||0;beforeEnt=String(antigo.entity||'');beforeId=String(antigo.id||'');}
  }
  const vistos=new Set();          // v7.0.8 — nada é pedido duas vezes
  for(let volta=0;volta<40;volta++){
    // v7.0.8 — cursor COMPOSTO: quando o motor da nuvem devolve o par
    // (entidade, id) do último registro da página, o PC pede a próxima a partir
    // dele. Sem isso, os registros excluídos NO MESMO milissegundo que caíam no
    // fim de uma página nunca eram alcançados (defeito provado: 56 de 3.000 numa
    // página de 1000). Com motor antigo, o pedido sai como sempre saiu.
    let url='/v1/deleted?limit=1000';
    if(before)url+='&before='+before;
    if(before&&beforeEnt&&beforeId)url+='&beforeEntity='+encodeURIComponent(beforeEnt)+'&beforeId='+encodeURIComponent(beforeId);
    let r;try{r=await call(url,{method:'GET'});}catch(e){ if(volta===0)throw e; break; }
    const lote=(r&&r.records)||[];
    // v7.0.8 — MOTOR QUE PULA NÃO PODE SER CHAMADO DE COMPLETO
    // O motor 5.26.6 já tinha `temMais`, mas a paginação dele PULAVA registros
    // (defeito provado). Se o PC olhasse só `temMais`, diria "varri tudo" e
    // carimbaria na nuvem que a recuperação já foi feita — e o motor novo, quando
    // publicado, nunca mais varreria. A prova de varredura COMPLETA agora é o par
    // (entidade, id) do cursor composto, que só o motor 5.26.7 devolve.
    if(r&&r.proximoEntity&&r.proximoId)varreduraCompleta=true;
    if(volta===0&&!lote.length){varreduraCompleta=true;varreduraTerminou=true;}   // não há nada a recuperar
    for(const reg of lote){
      if(!reg||reg.entity==null||reg.recordId==null)continue;
      const chave=String(reg.entity)+'|'+String(reg.recordId);
      if(vistos.has(chave))continue;
      vistos.add(chave);todos.push(reg);
    }
    if(!lote.length||!r.temMais||!r.proximoBefore){varreduraTerminou=true;break;}   // chegou ao fim da lista
    before=Number(r.proximoBefore)||0;
    beforeEnt=String(r.proximoEntity||'');beforeId=String(r.proximoId||'');
    if(!before){varreduraTerminou=true;break;}   // motor sem cursor: não há como continuar
    if(limiteTotal&&todos.length>=limiteTotal)break;   // teto pedido por quem chamou
  }
  if(continuar){
    if(varreduraTerminou){delete state.recuperacaoCursor;}
    else if(before){state.recuperacaoCursor={before:before,entity:beforeEnt,id:beforeId};}
    marcarEstado();
  }
  return todos;
}
let recuperandoAgora=false;
async function recuperarAutomatico(){
  if(state.recuperacaoV1||recuperandoAgora)return;
  if(!authorized()||state.paused)return;
  // v7.0.7 — UMA VEZ PARA TODOS OS PCs, NÃO UMA VEZ POR PC
  // A marca de "já recuperei" morava só neste computador: um PC novo (ou um que
  // teve o navegador limpo) refazia a recuperação inteira e trazia de volta
  // TUDO o que já tinha sido apagado um dia — inclusive o que foi apagado de
  // propósito depois. Agora, terminada a recuperação num PC, fica um carimbo na
  // configuração da NUVEM e os outros não repetem. O botão manual do painel da
  // Nuvem continua disponível para qualquer necessidade futura.
  try{
    if(typeof db!=='undefined'&&db&&db.config&&Number(db.config.recuperacaoExcluidosEm)>0){
      // v7.0.9 — outro computador já terminou: não deixa cursor pendurado (senão
      // o painel diria "varrendo a nuvem agora" para sempre)
      delete state.recuperacaoCursor;
      state.recuperacaoV1=true;persistAgora();return;
    }
  }catch(e){}
  // se falhou por rede, espera 60 s antes de tentar de novo (não fica batendo)
  if(state.recuperacaoTentativa&&(Date.now()-Number(state.recuperacaoTentativa))<60000)return;
  const call=api(); if(!call)return;
  recuperandoAgora=true;
  state.recuperacaoTentativa=Date.now();persist();
  try{
    const excluidos=await listarExcluidosDaNuvem(call,0,true);   // continua de onde parou
    const jaVieram=lerRecuperados();
    const alvos=excluidos.filter(r=>r&&r.entity&&r.recordId&&!jaRecuperado(jaVieram,r.entity,r.recordId)&&temDonoHumano(r)
      // v7.0.9 — o que ESTE computador apagou de propósito não volta (defeito provado)
      && !ehExclusaoDele(key(r.entity,r.recordId),r.version)
      && ['contratos','parque','leituras','os','contasReceber','vendas','clientes','produtos','equipamentos'].indexOf(r.entity)>=0
      && r.data&&typeof r.data==='object'&&Object.keys(r.data).length>0);
    let ok=0,falhas=0,primeiroErro='';
    for(const reg of alvos){
      try{
        const r=await call('/v1/restore',{method:'POST',body:JSON.stringify({entity:reg.entity,recordId:reg.recordId})});
        if(r&&r.ok!==false){ok++;marcarRecuperado(reg.entity,reg.recordId);}
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
      // v7.0.9 — o aviso vai pelo caminho do recado: se ainda não houver sessão
      // aberta ele NÃO se perde (antes era descartado e a marca ficava gravada).
      enfileirarRecado('motor-antigo:'+MOTOR_MINIMO,
        'Para trazer de volta TUDO que foi apagado, falta publicar o motor novo da nuvem (rodar o atualizar_motor_nuvem.cmd). Depois disso a recuperação termina sozinha.');
    }else if(!varreduraTerminou){
      // v7.0.9 — VARREDURA GRANDE, CONTINUA DE ONDE PAROU
      // Bateu o teto de páginas por ciclo (40.000 excluídos). NÃO pode carimbar
      // "já recuperei" (era o defeito: carimbava e o resto nunca mais era varrido)
      // nem avisar "falta publicar o motor" (o motor está certo, faltou terminar).
      // O cursor guardado faz o próximo ciclo continuar exatamente daqui — e é
      // ele que o painel mostra como "varrendo a nuvem agora".
      persist();
    }else{
      state.recuperacaoV1=true;
      // carimba na nuvem (só quando não houve falha) para os outros PCs não
      // repetirem a recuperação e não ressuscitarem o que foi apagado de propósito
      try{
        if(!falhas&&typeof db!=='undefined'&&db&&db.config&&!Number(db.config.recuperacaoExcluidosEm)){
          db.config.recuperacaoExcluidosEm=Date.now();
          marcarEstado();sujo=true;
          if(typeof saveDB==='function')saveDB();
          persistAgora();
        }
      }catch(e){}
    }
    state.recuperacaoEm=Date.now();state.recuperacaoTotal=ok+dasFotos;persist();
    if(ok){
      const porEntidade={};alvos.forEach(r=>{porEntidade[r.entity]=(porEntidade[r.entity]||0)+1;});
      try{
        if(typeof logAction==='function')logAction('recuperacao','automatica','-',
          'Recuperação automática trouxe de volta '+ok+' registro(s): '+JSON.stringify(porEntidade));
        enfileirarRecado('recuperacao',
          'Recuperação automática: '+ok+' registro(s) que tinham sido apagados por engano voltaram (contratos, impressoras, leituras). Confira as telas.','info');
      }catch(e){}
      await pullAll({silencioso:true});
      redesenharTelaAtual();
    }else if(falhas&&/admin/i.test(primeiroErro||'')){
      enfileirarRecado('precisa-admin',
        'A recuperação do que foi apagado precisa ser feita no computador ADMINISTRADOR da nuvem.');
      state.recuperacaoV1=true;persistAgora();   // não fica tentando a cada ciclo
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
        if(ids.has(k)||jaRecuperado(ja,entidade,k))return;
        // v7.0.9 — o que ESTE PC apagou de propósito não volta nem pela foto
        if(ehExclusaoDele(key(entidade,k),null))return;
        if(!temDonoHumano({data:item}))return;
        const copia=Object.assign({},item,{recuperadoDe:'foto-local',recuperadoEm:new Date().toISOString()});
        atual.push(copia);ids.add(k);voltaram++;
        porEntidade[entidade]=(porEntidade[entidade]||0)+1;
        marcarRecuperado(entidade,k);
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
// v7.0.5 — REDESENHO PENDENTE: se a tela não pôde ser atualizada na hora (pessoa
// digitando, modal aberto), a mudança NÃO se perde: fica marcada como pendente e
// é aplicada na primeira brecha (a cada batimento, ao clicar/sair de um campo, ao
// voltar para a janela). Antes, o redesenho recusado era simplesmente perdido —
// porque o dado já fica marcado como recebido, e a próxima leitura não o
// considera novidade de novo. Era isso que deixava a tela velha "de vez".
let redesenhoPendente=false;
function temRedesenhoPendente(){return redesenhoPendente;}
function tentarRedesenhoPendente(){
  if(!redesenhoPendente)return false;
  if(!redesenharTelaAtual())return false;
  redesenhoPendente=false;
  return true;
}
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
    // v7.0.5 — ARMADILHA QUE TRAVAVA A TELA: o teste incluía BUTTON. Depois de
    // clicar em qualquer menu, o foco fica NO BOTÃO — e a partir daí o redesenho
    // automático era recusado para sempre. Como a mudança já fica marcada como
    // recebida, ela nunca mais era considerada "novidade": a lista ficava velha
    // de vez. Agora só campo de digitação (input/textarea/select) e área
    // editável seguram o redesenho — botão não.
    focoEmCampo:!!(a&&a!==document.body&&(/INPUT|TEXTAREA|SELECT/.test(a.tagName||'')||a.isContentEditable)),
    podeRenderizar:!!(render&&typeof window[render]==='function'),
    ultimo:ultimoRedesenho, agora:Date.now()
  });
  if(!decisao)return false;
  ultimoRedesenho=Date.now();
  try{ window[render](); }catch(e){}
  // v7.0.5 — o painel do contrato (onde ficam as impressoras daquele contrato) é
  // separado da lista: se estiver aberto, ele também se atualiza.
  try{
    const box=document.getElementById('contrato-detail');
    if(box&&!box.classList.contains('hidden')&&typeof window.openContratoDetail==='function'){
      const m=/openModal\('contrato','([^']+)'\)/.exec(box.innerHTML||'');
      if(m&&m[1])window.openContratoDetail(m[1]);
    }
  }catch(e){}
  return true;
}
window.DIGICOPY_CLOUD_SYNC={tick,info,apiStatus,tudoConfirmadoNaNuvem,relatarSaude,estadoDetalhado,modoSoNuvem,definirSoNuvem,soltarCopiaLocal,infoSoNuvem,nuvemTemTudo,baixarTudoDaNuvem,ehLimiteDiario,recadoDoLimite,viradaDoLimite,resetCloudOnly,publishLocalToCloud,manterLocalSemEnviar,analyzeDuplicateClients,mergeDuplicateClients,duplicateClientGroups,decideReinstallGuard,localBusinessCount,listLocalOnlyKeys,hash,clean,definitions:DEFINITIONS,definicoes,podeExcluir:e=>PODE_EXCLUIR.has(e),devolverSumidos,varrerDemonstracao,ehLixoDeDemonstracao,marcarIntencaoDeExcluir,houveIntencaoDeExcluir,fecharIntencaoDeExclusao,temMarcaDeExclusao,limparMarcaDeExclusao,podeMarcarExclusao,vigiarExclusoes,exclusaoVigiada,registrarExclusaoDeProposito,devolverLideranca,podeRedesenharSync,redesenharTelaAtual,telasAoVivo:TELAS_AO_VIVO,cargaNuvemLigada:()=>cargaAberta,mostrarCargaNuvem,temDonoHumano,ehExclusaoDele,entregarRecados,recuperarAutomatico,recuperarDasFotosLocais,listarExcluidosDaNuvem,canalInstantaneo:()=>canalInstantaneoParado,temRedesenhoPendente};

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
      // v7.0.12 — ENFILEIRAR NA HORA: a mudança entra na fila (e a fila é gravada no
      // navegador) no MESMO INSTANTE da gravação. Antes só ficava `sujo` e esperava a
      // varredura de 900 ms — e fechar a janela nesse intervalo perdia a mudança.
      if(!applying&&authorized()){sujo=true;enfileirarNaHora();schedule(900);}
      return r;
    };
    window.saveDB.__cfWrapped=true;
  }
  const urgente=window.saveDBAgora;
  if(typeof urgente==='function'&&!urgente.__cfSujo){
    window.saveDBAgora=function(){
      // v7.0.12 — mesma regra do saveDB: vale para a gravação urgente também
      if(!applying&&authorized()){sujo=true;enfileirarNaHora();}
      return urgente.apply(this,arguments);
    };
    window.saveDBAgora.__cfSujo=true;
  }
}catch(e){}
// v7.0.3 — ao clicar de volta na janela (ou trazê-la para a frente), procura
// novidade NA HORA: antes esperava 10 s e, com o ritmo antigo, a pessoa podia
// ficar olhando uma tela velha. Agora o intervalo de tolerância é curto (1 s).
try{window.addEventListener('focus',()=>{if(Date.now()-lastTick>1000)schedule(200);});}catch(e){}
// v7.0.5 — brechas do dia a dia para aplicar o redesenho pendente
try{document.addEventListener('click',()=>{setTimeout(()=>{try{tentarRedesenhoPendente();}catch(e){}},400);},true);}catch(e){}
try{document.addEventListener('focusout',()=>{setTimeout(()=>{try{tentarRedesenhoPendente();}catch(e){}},250);},true);}catch(e){}
try{document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastTick>1000)schedule(200);});}catch(e){}
try{window.addEventListener('online',()=>schedule(250));}catch(e){}
// v7.0.6 — fechar/recarregar a janela grava o estado grande na hora (o resto do
// tempo ele é gravado agrupado; aqui não pode ficar nada pendente).
// v7.0.12 — FECHAR NÃO PERDE (3 passos, nesta ordem):
//   1. varredura AGORA, com teto de 500: o que ele gravou entra na fila mesmo se a
//      fila normal (100) estiver cheia — é a última chance;
//   2. persistAgora: estado + fila vão para o navegador na hora;
//   3. entrega com keepalive: manda o que couber ANTES de a janela morrer (a promessa
//      sobrevive ao fechamento). Se não chegar, a fila persistida garante a próxima
//      abertura — nada depende desta tentativa.
function prepararParaFechar(){
  try{
    if(!authorized())return;
    if(sujo||filaCheia||outbox.length)scanLocal({teto:TETO_FECHANDO});
    // Encheu até o teto do fechamento: o que sobrou fica só na tela e o dono tem de
    // saber AGORA (é a última chance — depois daqui a janela fecha).
    if(outbox.length>=TETO_FECHANDO){
      try{indicator(false,'Fila da nuvem cheia ('+outbox.length+' pendente(s))');}catch(e){}
      try{
        if(typeof window.toast==='function')window.toast('A fila da nuvem está cheia ('+outbox.length+' mudanças pendentes). Deixe a internet ligada um pouco para subir; não feche sem isso.','error');
      }catch(e){}
    }
  }catch(e){}
}
function entregarAoSair(){
  const call=api();if(!call||!outbox.length)return;
  // o keepalive do navegador tem teto de 64 KB: manda só o que couber com folga
  const lote=[];let bytes=0;
  for(const item of outbox){
    const size=stable(item.mutation).length;
    if(size>55000)break;
    if(lote.length&&bytes+size>55000)break;
    lote.push(item);bytes+=size;
  }
  if(!lote.length)return;
  try{
    const promessa=call('/v1/changes',{method:'POST',body:JSON.stringify({mutations:lote.map(x=>x.mutation)}),keepalive:true});
    if(promessa&&typeof promessa.catch==='function')promessa.catch(()=>{});
  }catch(e){}
}
try{
  const fechar=()=>{
    try{prepararParaFechar();}catch(e){}
    try{persistAgora();}catch(e){}
    try{entregarAoSair();}catch(e){}
    try{devolverLideranca();}catch(e){}
  };
  window.addEventListener('pagehide',fechar);
  window.addEventListener('beforeunload',fechar);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)fechar();});
}catch(e){}
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
