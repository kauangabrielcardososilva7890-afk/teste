// ═══════════════════════════════════════════════════════════════════════════
// PERMISSOES_OVERRIDE_MENUS_FISCAIS_PATCH v6.0.9 — três ordens dele (18/09):
//  1) "Remove o permitir de FORA do editar — ele só vai funcionar dentro da
//     aba editar": a coluna "Emitir NF" que a v5.22.21 injeta NA TABELA de
//     usuários a cada render (data-nfe-col/data-nfe-cell) agora é ARRANCADA
//     sempre que aparece. Permissão só se vê e só se mexe DENTRO do editor.
//  2) "Quem não pode excluir nem estornar e tentar, aparece na tela: peça a
//     um usuário que tenha permissão pra colocar o login e a senha pra
//     realizar essa ação — e embaixo vai ter o login": nasce a AUTORIZAÇÃO
//     NA HORA (override de supervisor) nos 11 executores com gate da v6.0.5:
//     popup DO SISTEMA (mesmo padrão visual dos avisos), campos Login + Senha,
//     valida contra os usuários da empresa logada (Admin/Dono sempre valem;
//     funcionário só se a caixa dele estiver marcada), token de 3 segundos,
//     ação segue na hora e fica AUDITADO quem pediu e QUEM AUTORIZOU. Senha
//     errada / cancelar = nada acontece (e audita também).
//  3) "Os menus fiscais não foram ainda... continua tendo somente 3, só um é
//     aba específica de fiscal, e os outros vão pra configuração": agora o
//     fiscal tem MENU PRA CADA COISA, como nas fotos do sistema antigo:
//       • Nota Fiscal (Central — operação completa, v6.0.8)
//       • Histórico de Notas — a lista de notas em tela PRÓPRIA (CC-e incluso)
//       • Status & Pacote — Testar SEFAZ (107=Operação) + Pacote do mês zip
//       • Inutilizar Faixa — formulário próprio (guard de emitir NF incluso)
//       • Config. Fiscal (v6.0.8) — certificado, CSC, NCMs, texto do Simples
// Guard: __v6009pom. PURE exportado p/ testes (sem DOM).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6009pom) return;

/* POM609_PURE_START */
// Valida a AUTORIZAÇÃO NA HORA: acha usuário da empresa pelo login, confere a
// senha dele e se ele pode a ação ('apagar'|'estornar'|'emitirNfe'). Admin e
// Dono valem sempre (regra da v6.0.5). Nunca inventa permissão.
function pomValidaAutorizacao(usuarios, empresaId, login, senha, acao, podeFn){
  const lg=String(login==null?'':login).trim().toLowerCase();
  if(!lg) return {ok:false, motivo:'Informe o login de quem autoriza.'};
  if(senha==null || String(senha)==='') return {ok:false, motivo:'Informe a senha de quem autoriza.'};
  const u=(usuarios||[]).find(function(x){
    return x && String(x.login||'').trim().toLowerCase()===lg && (!empresaId || x.empresaId===empresaId);
  });
  if(!u) return {ok:false, motivo:'Login não encontrado nesta empresa.'};
  if(String(u.senha||'')!==String(senha)) return {ok:false, motivo:'Senha não confere para '+lg+'.'};
  const pode=(typeof podeFn==='function') ? podeFn : function(uu,ac){ const p=String((uu&&uu.perfil)||'').trim(); return p==='Admin'||p==='Dono'; };
  if(!pode(u, acao)) return {ok:false, motivo:(u.nome||u.login||'Esse usuário')+' também NÃO tem permissão pra isso.'};
  return {ok:true, quem:{id:u.id||'', login:u.login||lg, nome:u.nome||u.login||lg, perfil:String(u.perfil||'')}};
}
/* POM609_PURE_END */
const apiPura609={ pomValidaAutorizacao:pomValidaAutorizacao };
if(typeof module!=='undefined') module.exports=apiPura609;
if(typeof window!=='undefined'){ window.POM609_PURE=apiPura609; }

if(typeof window==='undefined' || typeof document==='undefined') return;
window.__v6009pom=true;

function pomPode(u,acao){
  if(window.P605_PURE && window.P605_PURE.p605Pode) return window.P605_PURE.p605Pode(u,acao);
  return pomValidaAutorizacao([u], u&&u.empresaId, u&&u.login, u&&u.senha, acao).ok;
}
function pomLog(acao,alvo,detalhe){ try{ if(typeof logAction==='function') logAction('seguranca',acao,alvo,detalhe||''); }catch(e){} }

// ══ 1) AUTORIZAÇÃO NA HORA (override) nos executores com gate da v6.0.5 ════
window.__p609AutorizadoAte=0; // token de 3s — só vale a ação autorizada agora

function pomPopupAutorizacao(acaoPt, quemPediu, acao){
  acao=acao||'apagar';
  return new Promise(function(resolve){
    const ov=document.createElement('div');
    ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)';
    ov.innerHTML='<div style="background:#fff;border-radius:18px;padding:24px 26px;max-width:430px;width:92%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35);border:1px solid #e2e8f0">'+
      '<div style="width:52px;height:52px;border-radius:50%;background:#e0e7ff;margin:0 auto 12px;display:grid;place-items:center;font-size:26px">🔐</div>'+
      '<p style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 6px">Permissão necessária</p>'+
      '<p style="font-size:13px;color:#334155;margin:0 0 14px;line-height:1.5">Você não tem permissão para <b>'+String(acaoPt).replace(/</g,'&lt;')+'</b>.<br>Peça a um usuário que <b>tenha permissão</b> pra colocar o <b>login e a senha</b> dele aqui e realizar esta ação.</p>'+
      '<div style="text-align:left"><label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#64748b">Login de quem autoriza</label>'+
      '<input id="pom-aut-login" autocomplete="username" style="margin:3px 0 10px;width:100%;height:42px;padding:0 12px;border-radius:11px;border:1px solid #cbd5e1;font-size:13.5px" placeholder="ex.: kauan"></div>'+
      '<div style="text-align:left"><label style="font-size:11px;font-weight:800;text-transform:uppercase;color:#64748b">Senha de quem autoriza</label>'+
      '<input id="pom-aut-senha" type="password" autocomplete="current-password" style="margin:3px 0 4px;width:100%;height:42px;padding:0 12px;border-radius:11px;border:1px solid #cbd5e1;font-size:13.5px" placeholder="••••••"></div>'+
      '<p id="pom-aut-erro" style="font-size:12px;color:#b91c1c;min-height:16px;margin:4px 0 0"></p>'+
      '<div style="margin-top:14px;display:flex;gap:10px;justify-content:center">'+
      '<button id="pom-aut-cancelar" style="height:42px;padding:0 20px;border-radius:11px;background:#fff;border:1px solid #cbd5e1;color:#334155;font-size:13px;font-weight:700;cursor:pointer">Cancelar</button>'+
      '<button id="pom-aut-ok" style="height:42px;padding:0 22px;border-radius:11px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">Autorizar e executar</button></div>'+
      (quemPediu?'<p style="font-size:11px;color:#94a3b8;margin:12px 0 0">Pedido por: '+String(quemPediu).replace(/</g,'&lt;')+'</p>':'')+
      '</div>';
    document.body.appendChild(ov);
    const inpL=ov.querySelector('#pom-aut-login'), inpS=ov.querySelector('#pom-aut-senha'), erro=ov.querySelector('#pom-aut-erro');
    function fecha(v){ try{ov.remove();}catch(e){} document.removeEventListener('keydown',onKey,true); resolve(v); }
    function onKey(e){ if(e.key==='Escape') fecha(null); if(e.key==='Enter'){ e.preventDefault(); tentar(); } }
    document.addEventListener('keydown',onKey,true);
    ov.querySelector('#pom-aut-cancelar').onclick=function(){ fecha(null); };
    ov.addEventListener('click',function(e){ if(e.target===ov) fecha(null); });
    function tentar(){
      const sess=(typeof getSession==='function')?getSession():null;
      const r=pomValidaAutorizacao((typeof db!=='undefined'&&db?db.usuarios:[]), sess&&sess.empresaId, inpL.value, inpS.value, acao, pomPode);
      if(!r.ok){ erro.textContent=r.motivo; inpS.select&&inpS.select(); return; }
      fecha(r);
    }
    ov.querySelector('#pom-aut-ok').onclick=tentar;
    setTimeout(function(){ try{ inpL.focus(); }catch(e){} },30);
  });
}

// Re-embrulho por cima do gate da v6.0.5: sem permissão → override; com
// autorização válida → token 3s deixa o gate antigo passar e a ação segue.
function pomWrapOverride(nome, acaoPt){
  if(typeof window[nome]!=='function'){ setTimeout(function(){ pomWrapOverride(nome,acaoPt); },1200); return; }
  if(window[nome].__p609gate) return;
  const _f=window[nome];
  const embr=function(){
    const checa=acaoPt.indexOf('estornar')===0 ? window.usuarioPodeEstornar : window.usuarioPodeApagar;
    let pode=false; try{ pode=(window.__p609AutorizadoAte>Date.now()) || (typeof checa==='function' && checa()); }catch(e){}
    if(pode) return _f.apply(this,arguments);
    const sess=(typeof getSession==='function')?getSession():null;
    const pedinte=(sess&&(sess.usuarioNome||sess.login))||'?';
    const args=arguments, self=this;
    return pomPopupAutorizacao(acaoPt, pedinte, acaoPt.indexOf('estornar')===0?'estornar':'apagar').then(function(r){
      if(!r || !r.ok){ pomLog('override-cancelado', nome, quemTxt()); return; }
      window.__p609AutorizadoAte=Date.now()+3000;
      pomLog('override-autorizado', nome, quemTxt(r.quem));
      return _f.apply(self,args);
    });
    function quemTxt(q){
      return 'Ação: '+acaoPt+' · pedido por '+pedinte+(q?(' · AUTORIZADO por '+q.nome+' ('+q.login+', '+q.perfil+')'):' · sem autorização (fechou/errou)');
    }
  };
  embr.__p609gate=true;
  if(embr.__p605gate) embr.__p605gate=true;
  for(const k in _f){ if(k!=='__p605gate') embr[k]=_f[k]; }
  embr.__p605gate=_f.__p605gate;
  window[nome]=embr;
}
['excluirVendaUnificado','deleteVenda','excluirChamadosSelecionados','excluirChamadoV52422','excluirOrcamento','excluirOrcamentosMarcados','removerLancamentoLeitura']
  .forEach(function(n){ pomWrapOverride(n,'apagar registros'); });
['estornarVenda','estornarVendasSelecionadas','estornarLeituraContrato','estornarNotinha']
  .forEach(function(n){ pomWrapOverride(n,'estornar registros'); });
// Mesmo token vale pro negado() antigo: se o gate velho conferir de novo nos
// 3s, passa. (Os dois caminhos — wrap novo e wrap velho — convergem.)
const _uPA=window.usuarioPodeApagar, _uPE=window.usuarioPodeEstornar;
if(typeof _uPA==='function') window.usuarioPodeApagar=function(){ return (window.__p609AutorizadoAte>Date.now()) ? true : _uPA.apply(this,arguments); };
if(typeof _uPE==='function') window.usuarioPodeEstornar=function(){ return (window.__p609AutorizadoAte>Date.now()) ? true : _uPE.apply(this,arguments); };

// ══ 2) "Permitir" FORA DO EDITAR MORRE DE VEZ (caça à coluna da v5.22.21) ══
function pomLimparColunaPermissao(){
  const view=document.getElementById('view-usuarios');
  if(!view || view.offsetParent===null) return;
  let tirou=0;
  view.querySelectorAll('[data-nfe-col],[data-nfe-cell]').forEach(function(el){ el.remove(); tirou++; });
  if(tirou) window.__p609ColunaMorta=(window.__p609ColunaMorta||0)+tirou;
}
if(typeof window.renderUsuarios==='function' && !window.renderUsuarios.__p609){
  const _ru=window.renderUsuarios;
  const embrRu=function(){ const r=_ru.apply(this,arguments); setTimeout(pomLimparColunaPermissao,70); return r; };
  embrRu.__p609=true;
  window.renderUsuarios=embrRu;
}

// ══ 3) MENUS FISCAIS DE VERDADE (um menu pra cada coisa) ═══════════════════
function pomAmbTxt(){
  const amb=(typeof db!=='undefined'&&db&&db.config&&db.config.nfAmbiente)||'homologacao';
  return amb==='producao'
    ? '<div style="padding:9px 13px;border-radius:12px;font-weight:800;font-size:12.5px;color:#fff;background:#14532d">🏛️ PRODUÇÃO — vale de verdade</div>'
    : '<div style="padding:9px 13px;border-radius:12px;font-weight:800;font-size:12.5px;color:#fff;background:#7f1d1d">🏛️ HOMOLOGAÇÃO — modo teste, sem valor fiscal</div>';
}
function pomPodeEmitir(){ try{ return !!(window.usuarioPodeEmitirNfe && window.usuarioPodeEmitirNfe()); }catch(e){ return false; } }
const pomCard='rounded-[16px] bg-white border shadow-sm p-5';
const pomBtn='h-10 px-4 rounded-xl bg-[#0a1e8a] text-white text-[12.5px] font-semibold';

// — 3.1 Histórico de Notas (tela própria; CC-e junto) —
function pomRenderHistorico(){
  const v=typeof ensureView==='function'?ensureView('fiscal-historico'):null; if(!v) return;
  v.innerHTML=pomAmbTxt()+'<div class="'+pomCard+'"><h3 class="font-bold text-[15px]">🧾 Histórico de Notas</h3>'+
    '<p class="text-[12px] text-slate-500 mt-1">Todas as notas desta empresa. Nota autorizada tem botão <b>CC-e</b> (Carta de Correção) e cancelamento na própria linha.</p>'+
    '<div id="pom-hist" class="mt-3"></div></div>';
  try{
    window.__nfxHistAlvo=v.querySelector('#pom-hist');
    if(typeof window.nfxRenderHistorico==='function') window.nfxRenderHistorico();
  }catch(e){}
  setTimeout(pomInjetarCCeHistorico,120);
}
// A 6.0.6 instala o botão CC-e só dentro da Central; aqui a gente repete o
// gesto na tela própria usando a MESMA função global window.nfCartaCorrecao.
function pomInjetarCCeHistorico(){
  const v=document.getElementById('view-fiscal-historico'); if(!v||v.offsetParent===null) return;
  try{
    const reg=(typeof db!=='undefined'&&db&&db.config&&db.config.nfRegistro)||[];
    v.querySelectorAll('.nfx-linha [data-id]').forEach(function(span){
      if(span.querySelector('[data-pom="cce"]')) return;
      const nota=reg.find(function(n){ return n && n.id===span.getAttribute('data-id'); });
      if(!nota || nota.status!=='autorizada') return;
      const bt=document.createElement('button');
      bt.setAttribute('data-pom','cce'); bt.className='nfx-btn-mini';
      bt.style.cssText='font-size:11px;padding:3px 8px;border-radius:6px';
      bt.textContent='CC-e'+((nota.cce&&nota.cce.length)?' ('+nota.cce.length+')':'');
      span.appendChild(bt);
      bt.onclick=function(){ window.nfCartaCorrecao(nota.id); };
    });
  }catch(e){}
}

// — 3.2 Status & Pacote (ferramentas do contador/monitoramento) —
function pomRenderFerramentas(){
  const v=typeof ensureView==='function'?ensureView('fiscal-ferramentas'):null; if(!v) return;
  v.innerHTML=pomAmbTxt()+'<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">'+
    '<div class="'+pomCard+'"><h4 class="font-bold text-[14px]">📡 Status do serviço SEFAZ</h4>'+
    '<p class="text-[12px] text-slate-500 mt-1">Pergunta AGORA pra SEFAZ-MG se a autorização de notas está no ar. Resposta <b>107 = Serviço em Operação</b> (perfeito). Prova o certificado + internet antes de emitir.</p>'+
    '<div class="mt-3"><button id="pom-ft-status" class="'+pomBtn+'">Testar SEFAZ agora</button></div></div>'+
    '<div class="'+pomCard+'"><h4 class="font-bold text-[14px]">🗂 Pacote do mês p/ contador</h4>'+
    '<p class="text-[12px] text-slate-500 mt-1">Baixa um <b>.zip</b> com todos os XMLs das notas do mês escolhido + eventos (cancelamento/CC-e) + índice. É o arquivo que a contabilidade pede todo mês. O mês é perguntado na hora (MM/AAAA).</p>'+
    '<div class="mt-3"><button id="pom-ft-pacote" class="'+pomBtn+'">Baixar pacote (zip)</button></div></div></div>';
  v.querySelector('#pom-ft-status').onclick=function(){ try{ window.nfStatusServico(); }catch(e){} };
  v.querySelector('#pom-ft-pacote').onclick=function(){ try{ window.nfPacoteContador(); }catch(e){} };
}

// — 3.3 Inutilizar Faixa (formulário próprio, guard de emitir NF) —
function pomRenderInutilizar(){
  const v=typeof ensureView==='function'?ensureView('fiscal-inutilizar'):null; if(!v) return;
  const pode=pomPodeEmitir();
  v.innerHTML=pomAmbTxt()+'<div class="'+pomCard+' max-w-[560px] mt-3"><h3 class="font-bold text-[15px]">🧹 Inutilizar faixa de numeração</h3>'+
    '<p class="text-[12px] text-slate-500 mt-1">Quando um número de nota <b>pula</b> (erro, cancelamento fora do prazo), a SEFAZ exige <b>inutilizar</b> aquele número — fica registrado que ele não existirá.</p>'+
    (pode?'':'<p class="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2">Sem permissão de emitir NF: você pode olhar, mas só quem tem a caixa marcada inutiliza (ou autoriza na hora com login+senha).</p>')+
    '<div class="grid grid-cols-2 gap-3 mt-3">'+
    '<div><label class="text-[11px] uppercase font-bold text-slate-500">Modelo</label><select id="pom-in-modelo" class="mt-1 w-full h-10 px-3 rounded-xl border text-[13px]"><option value="55">55 — NF-e (A4)</option><option value="65">65 — NFC-e (cupom)</option></select></div>'+
    '<div><label class="text-[11px] uppercase font-bold text-slate-500">Série</label><input id="pom-in-serie" value="1" class="mt-1 w-full h-10 px-3 rounded-xl border text-[13px]"></div>'+
    '<div><label class="text-[11px] uppercase font-bold text-slate-500">Número inicial</label><input id="pom-in-ini" type="number" min="1" class="mt-1 w-full h-10 px-3 rounded-xl border text-[13px]"></div>'+
    '<div><label class="text-[11px] uppercase font-bold text-slate-500">Número final</label><input id="pom-in-fim" type="number" min="1" class="mt-1 w-full h-10 px-3 rounded-xl border text-[13px]"></div></div>'+
    '<div class="mt-4"><button id="pom-in-enviar" class="'+pomBtn+'">Inutilizar na SEFAZ</button></div></div>';
  v.querySelector('#pom-in-enviar').onclick=async function(){
    if(!pomPodeEmitir()){
      const sess=(typeof getSession==='function')?getSession():null;
      const r=await pomPopupAutorizacao('emitir NF (inutilizar faixa)', (sess&&(sess.usuarioNome||sess.login))||'?', 'emitirNfe');
      if(!r||!r.ok){ pomLog('override-cancelado','fiscal-inutilizar','Inutilizar sem autorização'); return; }
      window.__p609AutorizadoAte=Date.now()+3000;
      pomLog('override-autorizado','fiscal-inutilizar','Inutilizar autorizada por '+r.quem.nome+' ('+r.quem.login+')');
      try{ if(typeof toast==='function') toast('Autorizado por '+r.quem.nome+' — enviando…','success'); }catch(e){}
    }
    const ini=parseInt(v.querySelector('#pom-in-ini').value,10)||0;
    const fim=parseInt(v.querySelector('#pom-in-fim').value,10)||ini;
    if(!ini){ try{ if(typeof toast==='function') toast('Informe o número inicial.','error'); }catch(e){} return; }
    try{ window.nfInutilizarFaixa({ modelo:v.querySelector('#pom-in-modelo').value, serie:parseInt(v.querySelector('#pom-in-serie').value,10)||1, nNFIni:ini, nNFFin:Math.max(ini,fim), cnpj:'' }); }catch(e){}
  };
}

// — 3.4 Entradas de menu (nav lateral + barra clássica) —
const POM_MENUS=[
  {view:'central-nf',       icon:'ph-receipt',        rot:'Nota Fiscal'},
  {view:'fiscal-historico', icon:'ph-archive',        rot:'Histórico de Notas', header:['Histórico de Notas','CC-e e cancelamento por linha · todas as notas'], render:pomRenderHistorico},
  {view:'fiscal-ferramentas',icon:'ph-wrench',        rot:'Status & Pacote', header:['Fiscal — Status & Pacote','Testar a SEFAZ e baixar o pacote do mês p/ contador'], render:pomRenderFerramentas},
  {view:'fiscal-inutilizar', icon:'ph-broom',         rot:'Inutilizar Faixa', header:['Inutilizar Faixa de Numeração','Registro formal de números pulados na SEFAZ'], render:pomRenderInutilizar},
  {view:'config-fiscal',    icon:'ph-gear',           rot:'Config. Fiscal'}
];
function pomInstalarMenus(){
  const nav=document.getElementById('nav-gest');
  if(nav){
    let ref=nav.querySelector('[data-nav="central-nf"]');
    POM_MENUS.slice(1).forEach(function(m){
      if(nav.querySelector('[data-nav="'+m.view+'"]')) return;
      const btn=document.createElement('button');
      btn.setAttribute('data-nav',m.view); if(btn.dataset) btn.dataset.nav=m.view;
      btn.onclick=function(){ window.navigateTo(m.view); };
      btn.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white';
      btn.innerHTML='<i class="ph '+m.icon+' text-[19px]"></i><span>'+m.rot+'</span>';
      if(ref&&ref.nextSibling) nav.insertBefore(btn,ref.nextSibling); else nav.appendChild(btn);
      ref=btn;
    });
  }
  const toolbar=document.querySelector('.classic-toolbar-scroll');
  if(toolbar){
    let refTb=document.getElementById('topmod-central-nf');
    POM_MENUS.slice(1).forEach(function(m){
      if(document.getElementById('topmod-'+m.view)) return;
      const mod=document.createElement('div'); mod.className='module'; mod.id='topmod-'+m.view;
      mod.innerHTML='<button onclick="navigateTo(\''+m.view+'\')"><i class="ph '+m.icon+'"></i>'+m.rot+'</button>';
      if(refTb&&refTb.nextSibling) toolbar.insertBefore(mod,refTb.nextSibling); else toolbar.appendChild(mod);
      refTb=mod;
    });
  }
}
if(typeof window.navigateTo==='function' && !window.navigateTo.__p609){
  const _nav=window.navigateTo;
  const embrNav=function(view){
    const r=_nav.apply(this,arguments);
    const m=POM_MENUS.find(function(x){ return x.view===view && x.render; });
    if(m){
      try{ if(typeof setPageHeader==='function') setPageHeader(m.header[0],m.header[1]); }catch(e){}
      try{ m.render(); }catch(e){}
    }
    return r;
  };
  embrNav.__p609=true;
  window.navigateTo=embrNav;
}

// Sonda: menus redesenham após login; caça à coluna solta e CC-e do histórico
(function pomSonda(){
  let tent=0;
  const t=setInterval(function(){
    tent++;
    if(!document.hidden){
      try{ pomInstalarMenus(); pomLimparColunaPermissao(); pomInjetarCCeHistorico(); }catch(e){}
    }
    if(tent>300) clearInterval(t);
  },2000);
})();
console.log('v6.0.9 — PERMISSÃO SÓ NO EDITAR + AUTORIZAÇÃO NA HORA (override login+senha auditado nos 11 executores) + MENUS FISCAIS DE VERDADE (Histórico, Status & Pacote, Inutilizar Faixa — um menu pra cada coisa, como nas fotos).');
})();
