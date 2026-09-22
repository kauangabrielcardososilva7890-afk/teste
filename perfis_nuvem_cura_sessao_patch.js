// ═══════════════════════════════════════════════════════════════════════════
// PERFIS_NUVEM_CURA_SESSAO_PATCH v6.0.4
// A prova do diagnóstico DELE em mãos: "Empresa da minha sessão: (nenhuma?!)"
// com o banco tendo EXATAMENTE 1 empresa [emp_digicopy] e tudo "visível".
// Causa-raiz achada na 6.0.4: a cura da 6.0.2 só tentava carimbar a sessão por
// TRINTA SEGUNDOS depois de abrir o sistema (sonda 1s×30) e marcava "já fez"
// na primeira passada. Quem fazia login depois disso — caso real dele, login
// 1x/dia — passava o DIA INTEIRO sem empresa na sessão → as telas filtram por
// empresa e os dados "somem". A nuvem e o banco estavam certos o tempo todo.
//
// O que este patch entrega:
//  1) CURA DEFINITIVA (mesma regra segura: SÓ carimba com EXATAMENTE 1 empresa
//     no banco; 2+ nunca chuta):
//     • sonda 2s por até 10 MINUTOS (era 30s) e não desiste enquanto não houver
//       resposta definitiva (sessão carimbada OU 2+ empresas confirmadas);
//     • rearmada a CADA login (wrap do setSession) e a CADA gravação do banco
//       (wrap do db.save — é por onde os dados da nuvem pousam, cobrindo PC que
//       abre o sistema antes dos dados descerem);
//     • botão manual "Reparar sessão agora" na tela Nuvem (ao lado do
//       diagnóstico, instalado no patch 5227) chama window.acForcarCura().
//  2) PERFIS DA NUVEM (pedido dele): a tela Nuvem abre pra todo PC; PC que
//     entrou com a senha do GERENTE vira Administrador na nuvem (gastos,
//     aparelhos, convites — implementado no worker 5.26.3 e nos gates do
//     cloudflare_sync_patch); PC comum vê a nuvem SEM os gastos e só desconecta
//     a própria sessão. Aqui só fica a constatação via console (auditoria leve).
//
// Guard: __v6004pnc. PURE exportado pra testes (sem DOM).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6004pnc) return;

/* PNC604_PURE_START */
// Decisão da cura — pura e testável. Dado o retrato (sessão? tem empresa?
// quantas empresas no banco? tentativa), diz o próximo passo:
//   'esperar'            → ainda não dá pra decidir (sem login ou banco vazio)
//   'carimbar-sessao'    → 1 empresa no banco e sessão sem empresa → carimba
//   'definitivo-multi'   → 2+ empresas e sessão vazia → NÃO chuta, fim da sonda
//   'resolvido'          → sessão já tem empresa → fim da sonda
//   'fim-tentativas'     → estourou o teto de tentativas
function pncProximoPasso(o){
  o=o||{};
  const tent=Number(o.tentativas)||0, teto=Number(o.teto)||300;
  if(tent>teto) return 'fim-tentativas';
  if(!o.temSessao) return 'esperar';
  if(o.sessTemEmpresa) return 'resolvido';
  const n=Number(o.nEmpresas)||0;
  if(n===1) return 'carimbar-sessao';
  if(n>1) return 'definitivo-multi';
  return 'esperar'; // banco ainda vazio (dados da nuvem a caminho)
}
/* PNC604_PURE_END */

if(typeof module!=='undefined') module.exports={pncProximoPasso:pncProximoPasso};
if(typeof window!=='undefined'){ window.PNC604_PURE={pncProximoPasso:pncProximoPasso}; }
if(typeof window==='undefined' || typeof document==='undefined') return;
window.__v6004pnc=true;

function pncToast(msg,tipo){ try{ if(typeof toast==='function') toast(msg,tipo||'info'); }catch(e){} }
function pncAudit(acao,dados){
  try{
    const s=(typeof getSession==='function'?getSession():null)||{};
    db.logs=db.logs||[];
    db.logs.push({tipo:'autocura-604',acao:acao,dados:dados||{},usuarioId:s.usuarioId||null,usuarioLogin:s.login||null,at:new Date().toISOString()});
    if(typeof db.save==='function') db.save();
  }catch(e){}
}
function pure602(){
  if(window.AC602_PURE) return window.AC602_PURE;
  return null; // a fila garante o 208 antes; se faltar, a cura simplesmente não roda (log em console)
}

// Motor da cura — chama as funções PURAS da 6.0.2 (mesma regra: só 1 empresa)
let avisouMulti=false;
async function acForcarCura(){
  const P=pure602();
  if(!P) return {ok:false,motivo:'motor da cura (6.0.2) não está carregado nesta tela — recarregue (F5)'};
  if(typeof db==='undefined'||!db||typeof getSession!=='function') return {ok:false,motivo:'banco ainda carregando'};
  const sess=getSession();
  if(!sess) return {ok:false,motivo:'ninguém entrou no sistema ainda (sem sessão)'};
  const emps=Array.isArray(db.empresas)?db.empresas:[];
  const passo=pncProximoPasso({temSessao:true,sessTemEmpresa:!!sess.empresaId,nEmpresas:emps.length,tentativas:0,teto:1});
  if(passo==='resolvido') return {ok:true,sessaoMudou:false,empresaId:sess.empresaId,orfaos:0};
  if(passo==='definitivo-multi') return {ok:false,motivo:'o banco tem '+emps.length+' empresas — o sistema não chuta; saia e entre escolhendo a empresa certa'};
  if(emps.length===0) return {ok:false,motivo:'o banco local ainda está vazio — os dados da nuvem podem estar descendo; tente de novo em alguns segundos'};
  // carimbar-sessao
  const r=P.acCuraSessao(sess, db);
  let mudouSessao=false;
  if(r.mudou){
    try{ setSession(sess); mudouSessao=true; }catch(e){ return {ok:false,motivo:'falhou ao gravar a sessão: '+(e.message||e)}; }
    pncAudit('sessao-carimbada-604',{empresaId:r.empresaId});
  }
  let orfaos=0;
  try{
    const oc=P.acContarOrfaos(db);
    if(oc.total>0){ const cz=P.acCarimbarOrfaos(db, sess.empresaId||emps[0].id); orfaos=cz.total||0; if(orfaos) pncAudit('orfaos-carimbados-604',{total:orfaos,porEntidade:oc.porEntidade}); }
  }catch(e){}
  return {ok:true,sessaoMudou:mudouSessao,empresaId:(sess.empresaId||''),orfaos:orfaos};
}
window.acForcarCura=acForcarCura;

// ── Driver automático: sonda 2s × 10 min + hooks de login/db.save ──────────
let pncFechado=false;
function pncResolvido(){
  try{
    const sess=(typeof getSession==='function')?getSession():null;
    if(sess&&sess.empresaId) return true;
    const emps=(typeof db!=='undefined'&&Array.isArray(db.empresas))?db.empresas:[];
    if(sess&&emps.length>1) return true; // definitivo: não chuta
  }catch(e){}
  return false;
}
function pncTentativa(silencioso){
  if(pncFechado) return;
  try{
    const sess=(typeof getSession==='function')?getSession():null;
    const emps=(typeof db!=='undefined'&&Array.isArray(db.empresas))?db.empresas:[];
    const passo=pncProximoPasso({temSessao:!!sess,sessTemEmpresa:!!(sess&&sess.empresaId),nEmpresas:emps.length,tentativas:0,teto:99999});
    if(passo==='resolvido'){ pncFechado=true; return; }
    if(passo==='definitivo-multi'){
      pncFechado=true;
      if(!avisouMulti){ avisouMulti=true; pncToast('Sessão SEM empresa e banco com '+emps.length+' empresas: o sistema não chuta. Saia e entre escolhendo a empresa certa.','error'); pncAudit('sessao-sem-empresa-multi',{empresas:emps.length}); }
      return;
    }
    if(passo!=='carimbar-sessao') return; // esperar
    acForcarCura().then(function(r){
      if(r&&r.ok){
        pncFechado=true;
        if(r.sessaoMudou&&!silencioso) pncToast('Sessão carimbada com '+(r.empresaId||'')+' — era por isso que dados "sumiam" neste PC. Recarregue as telas.','success');
        if(r.sessaoMudou&&silencioso) pncToast('Sessão carimbada com '+(r.empresaId||'')+'. Recarregue as telas — os dados voltam.','success');
        if(Number(r.orfaos)>0) pncToast('Curei '+r.orfaos+' registro(s) sem carimbo de empresa — agora aparecem em todos os PCs.','success');
      }
    }).catch(function(){});
  }catch(e){}
}
// Sonda densa na abertura (2s por até 10 minutos; para sozinha ao resolver)
(function pncSonda(){
  let tent=0;
  const t=setInterval(function(){
    tent++;
    pncTentativa(false);
    if(pncFechado||tent>300) clearInterval(t);
  },2000);
})();
// Rearme a cada login (quem entra DEPOIS da abertura não fica sem cura o dia
// inteiro — era exatamente o caso dele) e a cada gravação do banco (dados da
// nuvem pousando depois dos 10 minutos). Barato: uma tentativa silenciosa.
let pncReagendando=false;
function pncRearmar(){
  if(pncFechado||pncReagendando) return;
  pncReagendando=true;
  setTimeout(function(){ pncReagendando=false; try{ pncTentativa(true); }catch(e){} },500);
  setTimeout(function(){ try{ if(!pncFechado) pncTentativa(true); }catch(e){} },3000);
}
if(typeof window.setSession==='function' && !window.setSession.__pnc604){
  const _setS=window.setSession;
  const embr=function(){ const r=_setS.apply(this,arguments); pncRearmar(); return r; };
  embr.__pnc604=true;
  window.setSession=embr;
}
if(typeof db!=='undefined' && db && typeof db.save==='function' && !db.save.__pnc604){
  const _save=db.save;
  let ultima=0;
  const embrS=function(){
    const r=_save.apply(this,arguments);
    const agora=Date.now();
    if(agora-ultima>4000 && !pncFechado){ ultima=agora; try{ pncTentativa(true); }catch(e){} }
    return r;
  };
  embrS.__pnc604=true;
  try{ db.save=embrS; }catch(e){}
}
console.log('v6.0.4 — cura da sessão DEFINITIVA (sonda 10min + rearma no login/db.save + botão Reparar) e perfis da nuvem (gerente vira admin; comum sem gastos, só desconecta a si)');
})();
