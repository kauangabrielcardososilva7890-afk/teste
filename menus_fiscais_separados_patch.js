// ═══════════════════════════════════════════════════════════════════════════
// MENUS_FISCAIS_SEPARADOS_PATCH v6.0.8 — pedido dele (18/09):
//   "das NF separe os menus como nas fotos que eu mandei, assim tudo em uma
//    tela ta muito estranho, e o que tiver em configuração tira de lá e coloca
//    no seu devido menu"
//  1) Central NF fica SÓ COM OPERAÇÃO: placa de ambiente, troca de ambiente
//     (protegida por digitar PRODUCAO — Portão v6.0.0 intocado), emissão,
//     histórico, CC-e, Testar SEFAZ, Pacote do mês, Inutilizar faixa.
//  2) CONFIGURAÇÃO SAI DA CENTRAL e ganha MENU PRÓPRIO: "Config. Fiscal"
//     (nav lateral + barra clássica, mesma linguagem do botão Nota Fiscal):
//       • Ambiente atual (olhar) + atalho pra trocar na Central (protegido)
//       • Dados fiscais da empresa (botão p/ o perfil tributário: CNPJ/IE/NCM
//         e importação do certificado A1 — telas que já existem)
//       • Certificado A1: STATUS ao vivo via ponte do .exe (sem salvar senha)
//       • NFC-e CSC (ID + código) — mesmas chaves de antes (nfCscId/nfCsc)
//       • Notas: NCM padrão/tinta/locação + descrição locação + texto do
//         Simples — MESMAS chaves que a 6.0.6 já gravava (nfNcmPadrao etc.):
//         uma verdade só no db.config, telas diferentes escrevendo no mesmo
//         lugar.
//  3) Na Central os cards de configuração ESCONDEM (não se apaga: os patches
//     antigos recriam a tela a cada render; esconder é a convivência pacífica)
//     e o botão "Dados fiscais" vira ponte: "⚙️ Configurações fiscais →".
// Guard: __v6008mfs. PURE exportado p/ testes (sem DOM).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6008mfs) return;

/* MFS608_PURE_START */
// Lê a config fiscal com os MESMOS defaults da 6.0.6 (uma verdade só).
function mfsCfgLer(cfg){
  const c=cfg||{};
  return {
    nfAmbiente:String(c.nfAmbiente||'homologacao'),
    nfCscId:String(c.nfCscId||''), nfCsc:String(c.nfCsc||''),
    nfNcmPadrao:String(c.nfNcmPadrao||''), nfNcmTinta:String(c.nfNcmTinta||'32151100'),
    nfNcmLocacao:String(c.nfNcmLocacao||'37079021'), nfDescLocacao:String(c.nfDescLocacao||'CARTUCHO TONER'),
    nfTextoSimples:String(c.nfTextoSimples||'')
  };
}
// O que volta pro db.config quando salva a aba "Notas" (NCM + texto Simples).
function mfsCfgNotas(cfg,v){
  const out=cfg||{};
  out.nfNcmPadrao=String(v.nfNcmPadrao||'').trim();
  out.nfNcmTinta=String(v.nfNcmTinta||'').trim();
  out.nfNcmLocacao=String(v.nfNcmLocacao||'').trim();
  out.nfDescLocacao=String(v.nfDescLocacao||'').trim();
  out.nfTextoSimples=String(v.nfTextoSimples||'');
  return out;
}
// O que volta pro db.config quando salva o CSC (mesmas chaves da Central antiga).
function mfsCfgCsc(cfg,v){
  const out=cfg||{};
  out.nfCscId=String(v.nfCscId||'').trim();
  out.nfCsc=String(v.nfCsc||'');
  return out;
}
function mfsEsc(s){
  return String(s===undefined||s===null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
/* MFS608_PURE_END */
const apiPura608={ mfsCfgLer:mfsCfgLer, mfsCfgNotas:mfsCfgNotas, mfsCfgCsc:mfsCfgCsc, mfsEsc:mfsEsc };
if(typeof module!=='undefined') module.exports=apiPura608;
if(typeof window!=='undefined'){ window.MFS608_PURE=apiPura608; }

if(typeof window==='undefined' || typeof document==='undefined') return;
window.__v6008mfs=true;

function mfsToast(m,t){ try{ if(typeof toast==='function') toast(m,t||'success'); }catch(e){} }
function mfsAud(acao,detalhe){ try{ if(typeof logAction==='function') logAction('fiscal',acao,'config-fiscal',detalhe||''); }catch(e){} }

// ── TELA: CONFIGURAÇÕES FISCAIS (menu próprio) ─────────────────────────────
function mfsRender(){
  const v=typeof ensureView==='function'?ensureView('config-fiscal'):null;
  if(!v) return;
  let sess=null; try{ sess=typeof getSession==='function'?getSession():null; }catch(e){}
  if(!sess){ v.innerHTML='<div class="p-8 text-center text-slate-500 text-[13px]">Entre com login para configurar o fiscal.</div>'; return; }
  const cfg=mfsCfgLer(typeof db!=='undefined'&&db?db.config:{});
  const prod=cfg.nfAmbiente==='producao';
  const noExe=!(window.__digicopyPontes&&window.__digicopyPontes.nfeCertAPI);
  const card='rounded-[16px] bg-white border shadow-sm p-5';
  const lab='text-[11px] uppercase font-bold text-slate-500';
  const inp='mt-1 w-full h-10 px-3 rounded-xl border text-[13px]';
  const btn='h-10 px-4 rounded-xl bg-[#0a1e8a] text-white text-[12.5px] font-semibold';
  let h='';
  // 1) Ambiente — olhar aqui, trocar na Central (lá mora a proteção PRODUCAO)
  h+='<div style="padding:10px 14px;border-radius:14px;font-weight:800;font-size:13px;color:#fff;background:'+(prod?'#14532d':'#7f1d1d')+'">'+
     '🏛️ Ambiente: '+(prod?'PRODUÇÃO — nota vale de verdade':'HOMOLOGAÇÃO — modo teste')+
     ' <span style="font-weight:500;opacity:.9">· a troca é feita na Central NF (pede digitar PRODUCAO)</span></div>';
  h+='<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">';
  // 2) Dados fiscais da empresa
  h+='<div class="'+card+'"><h4 class="font-bold text-[14px]">🏢 Dados fiscais da empresa</h4>'+
     '<p class="text-[12px] text-slate-500 mt-1">CNPJ, IE, regime, endereço e o NCM padrão — é daqui que a nota nasce.</p>'+
     '<div class="mt-3 flex flex-wrap gap-2">'+
     '<button id="cfgf-perfil" class="'+btn+'">Abrir dados fiscais (CNPJ/IE/NCM…)</button>'+
     '<button id="cfgf-ir-central" class="h-10 px-4 rounded-xl bg-white border text-[12.5px] font-semibold">Ir p/ Central NF (emitir)</button></div></div>';
  // 3) Certificado A1 — status ao vivo quando .exe
  h+='<div class="'+card+'"><h4 class="font-bold text-[14px]">🔐 Certificado A1</h4>'+
     '<p class="text-[12px] text-slate-500 mt-1">A senha é pedida <b>na hora</b> de cada emissão e <b>não fica salva</b>. O certificado vive na pasta do sistema deste PC.</p>'+
     '<div id="cfgf-cert-status" class="mt-3 text-[12.5px] text-slate-500">'+(noExe?'Abra pelo <b>.exe do computador</b> pra importar e ver o status (navegador não fala com certificado).':'Consultando o certificado deste PC…')+'</div>'+
     (noExe?'':'<div class="mt-3 flex flex-wrap gap-2"><button id="cfgf-cert-import" class="'+btn+'">Importar certificado (.pfx)</button></div>')+'</div>';
  // 4) NFC-e CSC
  h+='<div class="'+card+'"><h4 class="font-bold text-[14px]">🧾 NFC-e — código CSC (SEFAZ-MG)</h4>'+
     '<div class="grid grid-cols-3 gap-3 mt-3"><div><label class="'+lab+'">ID do CSC</label><input id="cfgf-cscid" class="'+inp+'" value="'+mfsEsc(cfg.nfCscId)+'"></div>'+
     '<div class="col-span-2"><label class="'+lab+'">CSC</label><input id="cfgf-csc" type="password" class="'+inp+'" value="'+mfsEsc(cfg.nfCsc)+'"></div></div>'+
     '<div class="mt-3"><button id="cfgf-csc-salvar" class="'+btn+'">Salvar CSC</button></div>'+
     '<p class="text-[11px] text-slate-400 mt-2">Gera no portal da SEFAZ-MG quando for emitir cupom de verdade. Fica salvo na nuvem, só nos PCs autorizados.</p></div>';
  // 5) Notas — NCMs + texto do Simples (mesmas chaves da 6.0.6)
  h+='<div class="'+card+' lg:col-span-2"><h4 class="font-bold text-[14px]">📦 Notas — NCM por tipo e texto do Simples</h4>'+
     '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">'+
     '<div><label class="'+lab+'">NCM padrão</label><input id="cfgf-ncm-padrao" class="'+inp+'" value="'+mfsEsc(cfg.nfNcmPadrao)+'" placeholder="ex.: 84439923"></div>'+
     '<div><label class="'+lab+'">NCM recarga/tinta</label><input id="cfgf-ncm-tinta" class="'+inp+'" value="'+mfsEsc(cfg.nfNcmTinta)+'"></div>'+
     '<div><label class="'+lab+'">NCM locação</label><input id="cfgf-ncm-loc" class="'+inp+'" value="'+mfsEsc(cfg.nfNcmLocacao)+'"></div>'+
     '<div><label class="'+lab+'">Descrição locação</label><input id="cfgf-desc-loc" class="'+inp+'" value="'+mfsEsc(cfg.nfDescLocacao)+'"></div></div>'+
     '<div class="mt-3"><label class="'+lab+'">Texto do Simples Nacional (só entra nas notas REAIS; vazio = nada entra sozinho)</label>'+
     '<textarea id="cfgf-txo-simples" rows="2" class="mt-1 w-full px-3 py-2 rounded-xl border text-[12.5px]">'+mfsEsc(cfg.nfTextoSimples)+'</textarea></div>'+
     '<div class="mt-3"><button id="cfgf-notas-salvar" class="'+btn+'">Salvar configuração das notas</button></div>'+
     '<p class="text-[11px] text-slate-400 mt-2">Prioridade do NCM da nota: produto cadastrado &gt; tinta (recarga) &gt; locação (leitura) &gt; padrão. Homologação já carrega o selo de teste — o texto do Simples só entra em PRODUÇÃO.</p></div>';
  h+='</div>';
  v.innerHTML=h;

  v.querySelector('#cfgf-perfil').onclick=function(){ try{ if(typeof abrirPerfilTributario==='function') abrirPerfilTributario(); else mfsToast('Perfil tributário não disponível aqui.','error'); }catch(e){} };
  v.querySelector('#cfgf-ir-central').onclick=function(){ try{ window.navigateTo('central-nf'); }catch(e){} };
  v.querySelector('#cfgf-csc-salvar').onclick=function(){
    if(typeof db==='undefined'||!db) return;
    db.config=mfsCfgCsc(db.config||{},{ nfCscId:v.querySelector('#cfgf-cscid').value, nfCsc:v.querySelector('#cfgf-csc').value });
    try{ if(typeof db.save==='function') db.save(); }catch(e){}
    mfsAud('csc-salvo','ID do CSC '+db.config.nfCscId+' salvo na tela Config. Fiscal');
    mfsToast('CSC salvo na nuvem (fica só nos PCs autorizados).');
  };
  v.querySelector('#cfgf-notas-salvar').onclick=function(){
    if(typeof db==='undefined'||!db) return;
    db.config=mfsCfgNotas(db.config||{},{ nfNcmPadrao:v.querySelector('#cfgf-ncm-padrao').value, nfNcmTinta:v.querySelector('#cfgf-ncm-tinta').value,
      nfNcmLocacao:v.querySelector('#cfgf-ncm-loc').value, nfDescLocacao:v.querySelector('#cfgf-desc-loc').value, nfTextoSimples:v.querySelector('#cfgf-txo-simples').value });
    try{ if(typeof db.save==='function') db.save(); }catch(e){}
    mfsAud('config-notas-salva','NCMs e texto do Simples salvos na tela Config. Fiscal');
    mfsToast('✅ Configuração das notas salva (vale nas próximas emissões).');
  };
  // Status do certificado ao vivo (só no .exe)
  if(!noExe){
    const st=v.querySelector('#cfgf-cert-status');
    try{
      window.__digicopyPontes.nfeCertAPI.status().then(function(r){
        if(!st) return;
        if(r&&r.ok){ st.innerHTML='✅ Certificado <b>instalado</b> neste PC'+(r.arquivo?(' · <span class="text-slate-400">'+mfsEsc(r.arquivo)+'</span>'):'')+(r.validade?(' · válido até <b>'+mfsEsc(String(r.validade).slice(0,10))+'</b>'):''); st.className='mt-3 text-[12.5px] text-emerald-700'; }
        else { st.innerHTML='⚠️ Nenhum certificado A1 neste PC ainda — importe o arquivo .pfx aqui embaixo.'; st.className='mt-3 text-[12.5px] text-amber-700'; }
      }).catch(function(){ if(st) st.textContent='Não consegui consultar o certificado (ponte ocupada).'; });
    }catch(e){}
    const imp=v.querySelector('#cfgf-cert-import');
    if(imp) imp.onclick=async function(){
      try{
        const r=await window.__digicopyPontes.nfeCertAPI.importar();
        if(r&&r.ok){ mfsToast('Certificado importado neste PC.'); mfsAud('cert-importado','A1 importado pela tela Config. Fiscal'); mfsRender(); }
        else mfsToast((r&&r.error)||'Importação cancelada.','error');
      }catch(e){ mfsToast('Falha ao importar o certificado.','error'); }
    };
  }
}

// ── CENTRAL fica só com OPERAÇÃO: esconde config (convivência pacífica) ────
function mfsLimparCentral(){
  const view=document.getElementById('view-central-nf');
  if(!view || view.offsetParent===null) return;
  try{
    // card do CSC (tem #cnf-cscid dentro) — esconde
    const csc=view.querySelector('#cnf-cscid');
    const cardCsc=csc&&csc.closest?csc.closest('.cnf-card'):null;
    if(cardCsc) cardCsc.style.display='none';
    // card do certificado (pela cara, texto "Certificado A1") — esconde
    const cards=view.querySelectorAll('.cnf-card');
    cards.forEach(function(c){ if((c.textContent||'').indexOf('Certificado A1')>=0) c.style.display='none'; });
    // card de configuração das notas da 6.0.6 (#fmc-config) — esconde (vive agora na Config. Fiscal)
    const fcfg=view.querySelector('#fmc-config'); if(fcfg) fcfg.style.display='none';
    // se a grade de cards ficou toda escondida, some com ela
    const grade=cards.length?cards[0].parentElement:null;
    if(grade){ let vis=0; grade.querySelectorAll('.cnf-card').forEach(function(c){ if(c.style.display!=='none') vis++; }); if(!vis) grade.style.display='none'; }
    // botão "Dados fiscais" vira ponte pro menu certo
    const bc=view.querySelector('#cnf-config');
    if(bc && !bc.__mfs){ bc.__mfs=true; bc.innerHTML='⚙️ Configurações fiscais (certificado, CSC, NCM) →'; bc.title='Certificado, CSC, NCMs e texto do Simples mudaram pra tela própria: menu Config. Fiscal'; bc.onclick=function(){ window.navigateTo('config-fiscal'); }; }
  }catch(e){}
}
if(typeof window.renderCentralNf==='function' && !window.renderCentralNf.__mfs){
  const _rc=window.renderCentralNf;
  const embr=function(){
    const r=_rc.apply(this,arguments);
    setTimeout(mfsLimparCentral,110); // depois da instalação da 6.0.6 (60ms)
    return r;
  };
  embr.__mfs=true;
  window.renderCentralNf=embr;
}

// ── Entrada da tela (mesma receita da Central) ─────────────────────────────
if(typeof window.navigateTo==='function' && !window.navigateTo.__mfs){
  const _nav=window.navigateTo;
  const embrNav=function(view){
    const r=_nav.apply(this,arguments);
    if(view==='config-fiscal'){
      try{ if(typeof setPageHeader==='function') setPageHeader('Configurações Fiscais','Certificado, CSC, NCMs e texto das notas — separado da operação'); }catch(e){}
      try{ mfsRender(); }catch(e){}
    }
    return r;
  };
  embrNav.__mfs=true;
  window.navigateTo=embrNav;
}

// ── Botões de menu (nav lateral + barra clássica) — espelho do Nota Fiscal ─
function mfsInstalarMenu(){
  const nav=document.getElementById('nav-gest');
  if(nav&&!nav.querySelector('[data-nav="config-fiscal"]')){
    const btn=document.createElement('button');
    btn.setAttribute('data-nav','config-fiscal'); if(btn.dataset) btn.dataset.nav='config-fiscal';
    btn.onclick=function(){ window.navigateTo('config-fiscal'); };
    btn.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white';
    btn.innerHTML='<i class="ph ph-gear text-[19px]"></i><span>Config. Fiscal</span>';
    const nf=nav.querySelector('[data-nav="central-nf"]');
    if(nf&&nf.nextSibling) nav.insertBefore(btn,nf.nextSibling); else nav.appendChild(btn);
  }
  const toolbar=document.querySelector('.classic-toolbar-scroll');
  if(toolbar&&!document.getElementById('topmod-config-fiscal')){
    const mod=document.createElement('div'); mod.className='module'; mod.id='topmod-config-fiscal';
    mod.innerHTML='<button onclick="navigateTo(\'config-fiscal\')"><i class="ph ph-gear"></i>Config. Fiscal</button>';
    const tnf=document.getElementById('topmod-central-nf');
    if(tnf&&tnf.nextSibling) toolbar.insertBefore(mod,tnf.nextSibling); else toolbar.appendChild(mod);
  }
}
// Sonda leve: menu redesenha após login; limpeza da Central re-runs entre renders
(function mfsSonda(){
  let tent=0;
  const t=setInterval(function(){
    tent++;
    if(!document.hidden){ try{ mfsInstalarMenu(); mfsLimparCentral(); }catch(e){} }
    if(tent>300) clearInterval(t); // ~10 min de cobertura p/ navegação lenta
  },2000);
})();
console.log('v6.0.8 — MENUS FISCAIS SEPARADOS: Central fica só com operação (emitir, histórico, CC-e, Testar SEFAZ, pacote, inutilizar); Configurações Fiscais ganha menu próprio (ambiente olhar, dados fiscais, certificado A1 ao vivo no .exe, CSC, NCMs e texto do Simples — mesmas chaves).');
})();
