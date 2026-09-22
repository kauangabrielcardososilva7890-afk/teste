// ═══════════════════════════════════════════════════════════════════════════
// AUTOCURA_EMPRESA_CENTRAL_NF_TELA_PATCH v6.0.2
// 1) CURA DOS "DADOS SUMIDOS" (relato real: venda/impressoras desaparecem):
//    sessão SEM empresa (o próprio diagnóstico dele mostrou "(nenhuma?!)").
//    Regra SEGURA e determinística: se o banco tem EXATAMENTE UMA empresa e a
//    sessão está sem, a sessão ganha essa empresa (sem chutar nada) e TODO
//    registro órfão (empresaId vazio) recebe o carimbo dela. Auditoria no
//    db.logs + um toast contando o que curou. Com +1 empresa, NÃO chuta:
//    orienta relogar. O diagnóstico v5227 também passa a ver órfãos (602).
// 2) POPUPS NO ESTILO DO SISTEMA (X de fechar, caixa própria — nunca os
//    prompt/confirm nativos feios do navegador):
//    window.nfxPedirTexto(titulo, aviso, {senha, minimo, mascara}) → Promise
//    window.nfxConfirmar(titulo, aviso, {botao}) → Promise<bool>
// 3) CENTRAL DE NOTA FISCAL VIRA MENU DE VERDADE (view como Painel Gerente/Bus-
//    cador Escola), nada mais de aba flutuante: abrirCentralNfe passa a abrir
//    a TELA. Placa de ambiente + troca ambiente + emissões + certificado +
//    NFC-e CSC moram nela. Modal antigo fica desligado (wrap redireciona).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6002ac) return;

/* AC602_PURE_START */
// Cura da SESSÃO (sem empresa). Só carimba com UMA empresa no banco — senão,
// não chuta (decisão do pedido: zero achismo em produção).
function acCuraSessao(sess, dbInst){
  if(!sess || !dbInst) return {mudou:false, motivo:'sem sessao ou db'};
  if(sess.empresaId) return {mudou:false, motivo:'sessao ja tinha empresa'};
  const emps=(dbInst.empresas)||[];
  if(emps.length!==1) return {mudou:false, motivo:'empresas='+emps.length+' (nao chuta)', precisaEscolher:true};
  sess.empresaId=emps[0].id;
  return {mudou:true, motivo:'empresa unica carimbada na sessao', empresaId:emps[0].id};
}
// Cura dos DADOS órfãos (empresaId vazio) — só carimba com UMA empresa no banco
const AC_ENTS=['usuarios','tecnicos','clientes','produtos','recargas','equipamentos','contratos','parque','leituras','os','vendas','orcamentos','contasReceber','contasPagar','chamados'];
function acContarOrfaos(dbInst){
  const conta={};
  let total=0;
  for(const e of AC_ENTS){
    let c=0;
    for(const x of ((dbInst&&dbInst[e])||[])){ if(x && (x.empresaId===undefined||x.empresaId===null||x.empresaId==='')) c++; }
    if(c){ conta[e]=c; total+=c; }
  }
  return {total:total, porEntidade:conta};
}
function acCarimbarOrfaos(dbInst, empresaId){
  const emps=(dbInst&&dbInst.empresas)||[];
  if(emps.length!==1) return {total:0, motivo:'nao carimba com '+emps.length+' empresas'};
  const alvo=empresaId||emps[0].id;
  let total=0;
  for(const e of AC_ENTS){
    for(const x of (dbInst[e]||[])){
      if(x && (x.empresaId===undefined||x.empresaId===null||x.empresaId==='')){ x.empresaId=alvo; total++; }
    }
  }
  return {total:total, motivo: total? 'carimbados em '+alvo : 'nada a fazer'};
}
/* AC602_PURE_END */

if(typeof module!=='undefined') module.exports={acCuraSessao:acCuraSessao, acContarOrfaos:acContarOrfaos, acCarimbarOrfaos:acCarimbarOrfaos};
if(typeof window!=='undefined'){ window.AC602_PURE={acCuraSessao:acCuraSessao, acContarOrfaos:acContarOrfaos, acCarimbarOrfaos:acCarimbarOrfaos}; }
if(typeof window==='undefined' || typeof document==='undefined') return;
window.__v6002ac=true;

function acToast(msg,tipo){ if(typeof toast==='function') toast(msg,tipo||'info'); }
function acAudit(acao,dados){ try{ const s=(typeof getSession==='function'?getSession():null)||{}; db.logs=db.logs||[]; db.logs.push({tipo:'autocura',acao:acao,dados:dados||{},usuarioId:s.usuarioId||null,usuarioLogin:s.login||null,at:new Date().toISOString()}); if(typeof db.save==='function') db.save(); }catch(e){} }

// ── Roda a cura (na entrada do sistema; re-tenta até o db estar na memória) ──
let acJaFez=false;
function acRodarCura(){
  if(acJaFez) return;
  if(typeof db==='undefined' || !db || typeof getSession!=='function') return;
  const sess=getSession(); if(!sess) return; // login ainda não aconteceu; sem empresa pra curar mesmo
  const cursSess=acCuraSessao(sess, db);
  if(cursSess.mudou){
    try{ setSession(sess); }catch(e){}
    acAudit('sessao-ganhou-empresa',{empresaId:cursSess.empresaId, motivo:cursSess.motivo});
    acToast('Sessão carimbada com a empresa '+(cursSess.empresaId||'')+' (estava sem — por isso dados "sumiam").','success');
  }else if(cursSess.precisaEscolher && db && db.empresas && db.empresas.length>1 && !sess.empresaId){
    acToast('Este PC está com sessão SEM empresa e o banco tem '+db.empresas.length+'. Saia e entre escolhendo a empresa certa — é por isso que dados somem aqui.','error');
  }
  const orf=acContarOrfaos(db);
  if(orf.total>0){
    const cura=acCarimbarOrfaos(db, sess && sess.empresaId);
    if(cura.total>0){
      acAudit('dados-orfaos-carimbados',{total:cura.total, porEntidade:orf.porEntidade});
      acToast('Curei '+cura.total+' registro(s) que estavam sem carimbo de empresa — agora aparecem em todos os PCs.','success');
    }
  }
  acJaFez=true;
}
// Sonda leve: roda quando o sistema estiver de pé (db carregado e sessão ativa)
(function sonda(){
  let tent=0;
  const t=setInterval(()=>{
    tent++;
    try{ acRodarCura(); }catch(e){}
    if(acJaFez || tent>30) clearInterval(t);
  },1000);
})();

// ══ POPUPS NO ESTILO DO SISTEMA (X de fechar; Promise) ══════════════════════
function nfxBaseModal(titulo){
  const antigo=document.getElementById('nfx-modal');
  if(antigo) antigo.remove();
  const root=document.createElement('div');
  root.id='nfx-modal';
  root.style.cssText='position:fixed;inset:0;z-index:100090;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;padding:18px';
  root.innerHTML='<div style="width:min(460px,96vw);background:white;border-radius:16px;box-shadow:0 25px 80px rgba(0,0,0,.35);padding:18px">'+
    '<div style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:15px">'+String(titulo||'')+'</b>'+
    '<button id="nfx-x" style="font-size:22px;line-height:1;padding:2px 9px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer" title="Fechar">×</button></div>'+
    '<div id="nfx-corpo" style="margin-top:10px"></div></div>';
  document.body.appendChild(root);
  return root;
}
// Pede um texto (senha/justificativa etc). Promise resolve(string) ou null.
window.nfxPedirTexto=function(titulo, aviso, op){
  op=op||{};
  return new Promise(function(resolve){
    const root=nfxBaseModal(titulo);
    const corpo=root.querySelector('#nfx-corpo');
    corpo.innerHTML=
      (aviso?'<p style="font-size:12px;color:#64748b;margin:0 0 10px;white-space:pre-line">'+String(aviso)+'</p>':'')+
      '<input id="nfx-tx" '+(op.mascara?'type="password" ':'type="text" ')+'style="width:100%;height:42px;border:1px solid #cbd5e1;border-radius:10px;padding:0 12px;font-size:14px">'+
      (op.minimo?'<p id="nfx-aviso-min" style="font-size:11px;color:#b91c1c;display:none;margin:6px 0 0">Mínimo de '+op.minimo+' caracteres.</p>':'')+
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">'+
      '<button id="nfx-cancel" style="height:38px;padding:0 14px;border-radius:10px;border:1px solid #cbd5e1;background:white;font-weight:800;cursor:pointer">Cancelar</button>'+
      '<button id="nfx-ok" style="height:38px;padding:0 16px;border-radius:10px;border:0;background:#0a1e8a;color:white;font-weight:800;cursor:pointer">Confirmar</button></div>';
    const fechar=(v)=>{ root.remove(); resolve(v); };
    root.querySelector('#nfx-x').onclick=()=>fechar(null);
    root.querySelector('#nfx-cancel').onclick=()=>fechar(null);
    root.querySelector('#nfx-ok').onclick=()=>{
      const v=root.querySelector('#nfx-tx').value;
      if(op.minimo && String(v||'').trim().length<op.minimo){ root.querySelector('#nfx-aviso-min').style.display='block'; return; }
      fechar(String(v||'').trim());
    };
    root.addEventListener('keydown',(ev)=>{ if(ev.key==='Enter') root.querySelector('#nfx-ok').click(); if(ev.key==='Escape') fechar(null); });
    setTimeout(()=>{ try{ root.querySelector('#nfx-tx').focus(); }catch(e){} },60);
  });
};
// Confirmação própria. Promise resolve(true/false).
window.nfxConfirmar=function(titulo, aviso, op){
  op=op||{};
  return new Promise(function(resolve){
    const root=nfxBaseModal(titulo);
    const corpo=root.querySelector('#nfx-corpo');
    corpo.innerHTML=
      '<p style="font-size:13px;color:#334155;margin:0;white-space:pre-line">'+String(aviso||'')+'</p>'+
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">'+
      '<button id="nfx-cancel" style="height:38px;padding:0 14px;border-radius:10px;border:1px solid #cbd5e1;background:white;font-weight:800;cursor:pointer">'+(op.botaoCancelar||'Voltar')+'</button>'+
      '<button id="nfx-ok" style="height:38px;padding:0 16px;border-radius:10px;border:0;background:'+(op.cor||'#0a1e8a')+';color:white;font-weight:800;cursor:pointer">'+(op.botao||'Confirmar')+'</button></div>';
    const fechar=(v)=>{ root.remove(); resolve(v); };
    root.querySelector('#nfx-x').onclick=()=>fechar(false);
    root.querySelector('#nfx-cancel').onclick=()=>fechar(false);
    root.querySelector('#nfx-ok').onclick=()=>fechar(true);
    root.addEventListener('keydown',(ev)=>{ if(ev.key==='Escape') fechar(false); });
  });
};

// ══ CENTRAL DE NOTA FISCAL — TELA DE VERDADE (menu), não aba flutuante ══════
function centralRender(){
  const v=typeof ensureView==='function'?ensureView('central-nf'):null;
  if(!v) return;
  cnfGarantirCss(); // v6.0.3 — aplica as regras claro/escuro do módulo antes de pintar
  const sess=typeof getSession==='function'?getSession():null;
  if(!sess){ v.innerHTML='<div class="p-8 text-center text-slate-500 text-[13px]">Entre com login para usar o fiscal.</div>'; return; }
  const amb=(window.NFG_PURE&&window.NFG_PURE.nfgAmbiente(db))||'homologacao';
  const prod=amb==='producao';
  const reg=((db.config&&db.config.nfRegistro)||[]);
  const autorizadas=reg.filter(n=>n.status==='autorizada').length;
  const teste=reg.filter(n=>n.ambiente!=='producao').length;
  const cscID=(db.config&&db.config.nfCscId)||'';
  const csc=(db.config&&db.config.nfCsc)||'';
  const pode=(window.usuarioPodeEmitirNfe&&window.usuarioPodeEmitirNfe());

  let html='';
  // Placa de ambiente — SEMPRE no topo da tela
  html+='<div style="padding:10px 14px;border-radius:14px;font-weight:800;font-size:13px;color:#fff;background:'+(prod?'#14532d':'#7f1d1d')+'">'+
      '🏛️ '+(prod?'PRODUÇÃO — a nota gerada aqui VALE DE VERDADE':'HOMOLOGAÇÃO — MODO TESTE, SEM VALOR FISCAL')+
      ' <span style="font-weight:500;opacity:.9">· '+autorizadas+' autorizadas</span></div>';
  // Linha de ações — classes fiscais (claro/escuro). v6.0.3: nada de inline claro fantasma
  html+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">'+
    '<button id="cnf-amb" class="cnf-btn" style="height:38px;padding:0 14px;border-radius:10px;font-size:12.5px">'+(prod?'⬇ Voltar p/ HOMOLOGAÇÃO (teste)':'⬆ Habilitar PRODUÇÃO (vale de verdade)')+'</button>'+
    '<button id="cnf-config" class="cnf-btn" style="height:38px;padding:0 14px;border-radius:10px;font-size:12.5px">⚙️ Dados fiscais (CNPJ/IE/NCM)</button>'+
    '<button id="cnf-inut" class="cnf-btn-d" style="height:38px;padding:0 14px;border-radius:10px;font-size:12.5px">🧹 Inutilizar faixa</button></div>';
  if(!pode){
    html+='<p style="margin-top:10px;font-size:12px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;padding:8px 12px;border-radius:10px">Seu usuário pode OLHAR tudo aqui, mas só quem tem <b>permissão de emitir NF</b> transmite/inutiliza/cancela (Admin/Dono libera na tela Usuários).</p>';
  }
  // Certificado + CSC — cards com classe fiscal (o escuro cobre via cnf-aba-css)
  html+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-top:10px">'+
    '<div class="cnf-card"><p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;margin:0 0 6px" class="cnf-sub">Certificado A1</p>'+
    '<p style="font-size:13px;margin:0" class="cnf-txt">Importe pelo computador (.exe) — a SEFAZ só aceita certificado no PC emissor.</p>'+
    '<p style="font-size:12px;margin:6px 0 0" class="cnf-sub">A senha é pedida na hora de cada transmissão e <b>não fica salva</b>.</p></div>'+
    '<div class="cnf-card"><p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;margin:0 0 6px" class="cnf-sub">NFC-e — código CSC (SEFAZ-MG)</p>'+
    '<label style="font-size:11px;font-weight:800">ID do CSC</label><input id="cnf-cscid" class="cnf-input" value="'+String(cscID).replace(/"/g,'&quot;')+'" style="width:100%;height:34px;border-radius:8px;padding:0 10px;margin:3px 0 8px;font-size:12.5px">'+
    '<label style="font-size:11px;font-weight:800">CSC</label><input id="cnf-csc" class="cnf-input" type="password" value="'+String(csc).replace(/"/g,'&quot;')+'" style="width:100%;height:34px;border-radius:8px;padding:0 10px;margin:3px 0 8px;font-size:12.5px">'+
    '<button id="cnf-cscsalvar" class="cnf-btn" style="height:32px;padding:0 12px;border-radius:8px;font-size:12px">Salvar CSC</button>'+
    '<p style="font-size:11.5px;margin:8px 0 0" class="cnf-sub">'+(teste?teste+' em modo teste — treine à vontade.':'NFC-e pronto no código; gera o CSC no portal da SEFAZ-MG quando for usar de verdade.')+'</p></div></div>';
  // Emissões (render vivo) — NOME ÚNICO (o histórico já tem cabeçalho próprio: adeus título duplicado)
  html+='<div style="margin-top:12px"><div id="cnf-hist"></div></div>';
  v.innerHTML=html;

  v.querySelector('#cnf-amb').onclick=async function(){
    if(!pode){ acToast('Sem permissão para mudar ambiente.','error'); return; }
    if(!prod){
      const dig=await window.nfxPedirTexto('Habilitar PRODUÇÃO','⚠️ Produção faz nota VALER DE VERDADE na SEFAZ.\nPara habilitar, escreva exatamente: PRODUCAO');
      if(dig!=='PRODUCAO'){ if(dig!==null) acToast('Não habilitado — texto não confere.','error'); return; }
      db.config=db.config||{}; db.config.nfAmbiente='producao';
      window.NFG_PURE&&true; try{ if(typeof db.save==='function') db.save(); }catch(e){}
    }else{
      const ok=await window.nfxConfirmar('Voltar pra homologação?','Tudo volta a ser TESTE (sem valor fiscal). Nada do que já foi feito é apagado.');
      if(!ok) return;
      db.config=db.config||{}; db.config.nfAmbiente='homologacao';
      try{ if(typeof db.save==='function') db.save(); }catch(e){}
    }
    acAudit('ambiente-troca',{para:prod?'homologacao':'producao'});
    centralRender();
  };
  v.querySelector('#cnf-config').onclick=function(){ try{ if(typeof abrirPerfilTributario==='function') abrirPerfilTributario(); else acToast('Abra em Configurações → Fiscal.','info'); }catch(e){} };
  v.querySelector('#cnf-inut').onclick=async function(){
    if(!pode){ acToast('Sem permissão.','error'); return; }
    const modelo=await window.nfxPedirTexto('Inutilizar faixa','Modelo da nota (55 = NF-e A4 · 65 = NFC-e cupom):');
    if(modelo===null||!modelo) return;
    const serie=await window.nfxPedirTexto('Inutilizar faixa','Série (normalmente 1):'); if(serie===null) return;
    const numero=await window.nfxPedirTexto('Inutilizar faixa','Número a inutilizar (o que pulou, ex.: 9):'); if(numero===null) return;
    window.nfInutilizarFaixa({modelo:modelo||'55', serie:parseInt(serie,10)||1, nNFIni:parseInt(numero,10)||0, nNFFin:parseInt(numero,10)||0, cnpj:''});
  };
  v.querySelector('#cnf-cscsalvar').onclick=function(){
    db.config=db.config||{};
    db.config.nfCscId=v.querySelector('#cnf-cscid').value.trim();
    db.config.nfCsc=v.querySelector('#cnf-csc').value;
    try{ if(typeof db.save==='function') db.save(); }catch(e){}
    acToast('CSC salvo na nuvem (fica só nos PCs autorizados).','success');
    acAudit('csc-salvo',{idCsc:db.config.nfCscId});
  };
  // Histórico na tela (a função já existe: agora rende AQUI, não no modal)
  window.__nfxHistAlvo=v.querySelector('#cnf-hist');
  try{ if(typeof window.nfxRenderHistorico==='function') window.nfxRenderHistorico(); }catch(e){}
}
window.renderCentralNf=centralRender;

// Entrada da tela: mesma regra das outras telas (navigateTo aprende a view via wrap)
if(typeof window.navigateTo==='function'){
  const _nav=window.navigateTo;
  window.navigateTo=function(view){
    const r=_nav.apply(this,arguments);
    if(view==='central-nf'){
      try{ if(typeof setPageHeader==='function') setPageHeader('Central de Nota Fiscal','Emissão, histórico e configuração fiscal — modo teste primeiro'); }catch(e){}
      try{ centralRender(); }catch(e){}
    }
    return r;
  };
}
// Botões no menu (nav-gest + barra clássica) — espelho Painel Gerente/Buscador
function cnfInstalarMenu(){
  const nav=document.getElementById('nav-gest');
  if(nav&&!nav.querySelector('[data-nav="central-nf"]')){
    const btn=document.createElement('button');
    if(btn.dataset) btn.dataset.nav='central-nf'; else btn.setAttribute('data-nav','central-nf');
    btn.onclick=()=>window.navigateTo('central-nf');
    btn.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white';
    btn.innerHTML='<i class="ph ph-receipt text-[19px]"></i><span>Nota Fiscal</span>';
    const painel=nav.querySelector('[data-nav="painel-gerente"]');
    if(painel&&painel.nextSibling) nav.insertBefore(btn,painel.nextSibling); else nav.insertBefore(btn, nav.firstChild);
  }
  const toolbar=document.querySelector('.classic-toolbar-scroll');
  if(toolbar&&!document.getElementById('topmod-central-nf')){
    const mod=document.createElement('div'); mod.className='module'; mod.id='topmod-central-nf';
    mod.innerHTML='<button onclick="navigateTo(\'central-nf\')"><i class="ph ph-receipt"></i>Nota Fiscal</button>';
    const fin=[...toolbar.querySelectorAll('.module')].find(m=>/Financeiro/i.test(m.innerText||''));
    if(fin) toolbar.insertBefore(mod, fin.nextSibling); else toolbar.appendChild(mod);
  }
}
// SEGUE INSTALANDO (menu redesenha após login) — isso NÃO emite nota; só pinta botão
setInterval(()=>{ if(typeof document!=='undefined'&&document.hidden) return; try{ cnfInstalarMenu(); }catch(e){} },2000);
// A chamada antiga abrirCentralNfe abre a TELA agora (modal flutuante morto)
if(typeof window.abrirCentralNfe==='function'){
  const _cen2=window.abrirCentralNfe;
  window.abrirCentralNfe=function(){
    try{ window.navigateTo('central-nf'); }catch(e){ if(_cen2) _cen2.apply(this,arguments); }
  };
}
try{ cnfInstalarMenu(); }catch(e){}

// ══ v6.0.3a — GUARDA do saveConfig (erro real do console: saveConfig lia
// cfg-emp-nome mesmo quando a tela de Configuração antiga não está na DOM —
// a tela "neo" tem botão Salvar SEM esses campos → TypeError 'value' de null).
// Regra: lê só o que EXISTE; se nada existe aqui, não quebra e avisa. ═══════
if(typeof window.saveConfig==='function'){
  const _saveConfig0=window.saveConfig;
  window.saveConfig=function(){
    try{
      const algum=['cfg-emp-nome','cfg-emp-cnpj','cfg-emp-fone','cfg-emp-email'].some(id=>document.getElementById(id));
      if(!algum){
        try{ if(typeof db!=='undefined'&&typeof db.save==='function') db.save(); }catch(e){}
        acToast('Nada de empresa para salvar nesta tela — dados já estão salvos automático.','info');
        return;
      }
      return _saveConfig0.apply(this,arguments);
    }catch(e){ acToast('Falha ao salvar configuração: '+(e.message||e),'error'); }
  };
}

// ══ v6.0.3b — CSS PRÓPRIO do módulo fiscal (claro E escuro). O print dele
// mostrou: card branco pendurado no fundo escuro + texto fantasma. Regra: │
// todo elemento fiscal ganha classe cnf-*, e no modo escuro (html.digi-escuro)
// as cores vêm por CSS com !important (sobrepõe o inline claro). ══════════
function cnfGarantirCss(){
  if(document.getElementById('cnf-aba-css')) return;
  const st=document.createElement('style');
  st.id='cnf-aba-css';
  st.textContent=[
    '#view-central-nf .cnf-card{border:1px solid #e2e8f0;border-radius:14px;padding:12px;background:#fff;color:#1f2937}',
    '#view-central-nf label{color:#475569}',
    '#view-central-nf .cnf-txt{color:#334155}',
    '#view-central-nf .cnf-sub{color:#64748b}',
    '#view-central-nf .cnf-input{border:1px solid #cbd5e1;background:#fff;color:#0f172a}',
    '#view-central-nf .cnf-btn{border:1px solid #cbd5e1;background:#fff;color:#1e293b;font-weight:800;cursor:pointer}',
    '#view-central-nf .cnf-btn:hover{background:#f1f5f9}',
    '#view-central-nf .cnf-btn-d{border:1px solid #fca5a5;background:#fff;color:#b91c1c;font-weight:800;cursor:pointer}',
    '#view-central-nf .nfx-hist{border:1px solid #e2e8f0;background:#fff;color:#1f2937}',
    '#view-central-nf .nfx-hist .nfx-hist-cab{background:#f8fafc;color:#475569;border-bottom:1px solid #e2e8f0}',
    '#view-central-nf .nfx-hist .nfx-linha{border-bottom:1px solid #f1f5f9}',
    '#view-central-nf .nfx-hist .nfx-vazio{color:#94a3b8}',
    '#view-central-nf .nfx-hist .nfx-quem{color:#64748b}',
    '#view-central-nf .nfx-hist .nfx-btn-mini{border:1px solid #cbd5e1;background:#fff;color:#1e293b;cursor:pointer}',
    // O popup nfx-modal nasce com inline claro — o escuro sobrepõe por important
    'html.digi-escuro #nfx-modal>div{background:#101a30 !important;color:#dbe3f0 !important;border:1px solid #2b3b5c !important}',
    'html.digi-escuro #nfx-modal #nfx-corpo,html.digi-escuro #nfx-modal p,html.digi-escuro #nfx-modal label{color:#c9d6ef !important}',
    'html.digi-escuro #nfx-modal input{background:#0d1830 !important;color:#e5ecfa !important;border-color:#2b3b5c !important}',
    'html.digi-escuro #nfx-modal button#nfx-cancel,html.digi-escuro #nfx-modal button#nfx-x{background:#16233f !important;color:#dbe3f0 !important;border-color:#2b3b5c !important}',
    // MODO ESCURO do menu fiscal propriamente dito
    'html.digi-escuro #view-central-nf .cnf-card{background:#101a30 !important;border-color:#2b3b5c !important;color:#dbe3f0 !important}',
    'html.digi-escuro #view-central-nf label{color:#94a7cf !important}',
    'html.digi-escuro #view-central-nf .cnf-txt{color:#c9d6ef !important}',
    'html.digi-escuro #view-central-nf .cnf-sub{color:#8fa2c8 !important}',
    'html.digi-escuro #view-central-nf .cnf-input{background:#0d1830 !important;color:#e5ecfa !important;border-color:#2b3b5c !important}',
    'html.digi-escuro #view-central-nf .cnf-btn{background:#16233f !important;color:#dbe3f0 !important;border-color:#2b3b5c !important}',
    'html.digi-escuro #view-central-nf .cnf-btn:hover{background:#1d2d50 !important}',
    'html.digi-escuro #view-central-nf .cnf-btn-d{background:#3f1620 !important;color:#f0a8a8 !important;border-color:#6b2b2b !important}',
    'html.digi-escuro #view-central-nf .nfx-hist{background:#101a30 !important;border-color:#2b3b5c !important;color:#dbe3f0 !important}',
    'html.digi-escuro #view-central-nf .nfx-hist .nfx-hist-cab{background:#0d1830 !important;color:#94a7cf !important;border-bottom-color:#2b3b5c !important}',
    'html.digi-escuro #view-central-nf .nfx-hist .nfx-linha{border-bottom-color:#1e2c4a !important}',
    'html.digi-escuro #view-central-nf .nfx-hist .nfx-vazio{color:#8fa2c8 !important}',
    'html.digi-escuro #view-central-nf .nfx-hist .nfx-quem{color:#8fa2c8 !important}',
    'html.digi-escuro #view-central-nf .nfx-hist .nfx-btn-mini{background:#16233f !important;color:#dbe3f0 !important;border-color:#2b3b5c !important}',
    'html.digi-escuro #view-central-nf .nfx-hist .nfx-btn-cancel{background:#3f1620 !important;color:#f0a8a8 !important;border-color:#6b2b2b !important}'
  ].join('\n');
  document.head.appendChild(st);
}
console.log('v6.0.3 — fiscal no modo escuro + saveConfig blindado');
console.log('v6.0.2 — cura dados sumidos + Central NF virou MENU + popups próprios com X');
})();
