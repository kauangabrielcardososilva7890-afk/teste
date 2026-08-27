// ═══════════════════════════════════════════════════════════════════════════
// v5.22.42 — Menu da faixa aberta em azul; versão no rodapé; forma Boleto.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var VERSAO = '5.22.42';

function viewsDoModulo(onclickHtml){
  var s = String(onclickHtml||'');
  var out = [];
  var re = /navigateTo\('([^']+)'\)/g;
  var m;
  while((m=re.exec(s))) out.push(m[1]);
  if(/novaVenda|openQuickOS|orcamentos/.test(s)) out.push('vendas','orcamentos','manutencao');
  if(/contratos|parque|leituras|impressoras/.test(s)) out.push('contratos','parque','leituras','impressoras');
  if(/clientes/.test(s)) out.push('clientes');
  if(/financeiro/.test(s)) out.push('financeiro');
  if(/config|usuarios|auditoria/.test(s)) out.push('config','usuarios','auditoria');
  if(/buscador-escola/.test(s)) out.push('buscador-escola');
  if(/dashboard/.test(s)) out.push('dashboard');
  return out;
}
function moduloAberto(view, onclickHtml){
  return viewsDoModulo(onclickHtml).indexOf(view)>=0;
}

window.MENU_VERSAO_BOLETO_V52242_PURE = {
  VERSAO: VERSAO,
  viewsDoModulo: viewsDoModulo,
  moduloAberto: moduloAberto
};

if(typeof document==='undefined') return;

function garantirCss(){
  if(document.getElementById('v52242-menu-css')) return;
  var st = document.createElement('style');
  st.id = 'v52242-menu-css';
  st.textContent = '.module.mod-sel>button{background:#0a1e8a!important;color:#fff!important}.module.mod-sel>button i{color:#fff!important}';
  document.head.appendChild(st);
}

function pintarMenuAberto(view){
  garantirCss();
  var row = document.querySelector('.module-row');
  if(!row) return;
  row.querySelectorAll('.module').forEach(function(mod){
    var html = mod.innerHTML||'';
    var on = moduloAberto(view, html);
    if(on) mod.classList.add('mod-sel');
    else mod.classList.remove('mod-sel');
  });
}

function pintarRodape(){
  var foot = document.querySelector('footer span:not(#footer-session)');
  if(foot && !/v5\.22\./.test(foot.textContent||'')){
    foot.textContent = 'Sistema Digicopy • Banco na Nuvem • v'+VERSAO;
  }
}

if(typeof window.navigateTo==='function' && !window.navigateTo.__v52242menu){
  var oldN = window.navigateTo;
  window.navigateTo = function(view){
    var r = oldN.apply(this, arguments);
    try{ pintarMenuAberto(view); pintarRodape(); }catch(e){}
    return r;
  };
  window.navigateTo.__v52242menu = true;
}

if(typeof window.pintarMenus==='function' && !window.pintarMenus.__v52242sel){
  var oldP = window.pintarMenus;
  window.pintarMenus = function(){
    var r = oldP.apply(this, arguments);
    try{
      var vis = document.querySelector('.view:not(.hidden)');
      var id = vis && vis.id && vis.id.replace(/^view-/,'');
      if(id) pintarMenuAberto(id);
      pintarRodape();
    }catch(e){}
    return r;
  };
  window.pintarMenus.__v52242sel = true;
}

setTimeout(pintarRodape, 200);

function garantirBoleto(arr){
  if(!arr || typeof arr.indexOf!=='function') return arr;
  if(arr.indexOf('Boleto')<0) arr.push('Boleto');
  return arr;
}

if(typeof window.FINANCEIRO_RECEBER_PURE==='object' && window.FINANCEIRO_RECEBER_PURE.FORMAS_BAIXA){
  garantirBoleto(window.FINANCEIRO_RECEBER_PURE.FORMAS_BAIXA);
}

function injetarBotaoBoleto(hostId, cls, escolher){
  var box = document.getElementById(hostId);
  if(!box) return;
  if(/Boleto/.test(box.textContent||'')) return;
  var b = document.createElement('button');
  b.type='button';
  b.setAttribute('data-forma','Boleto');
  b.className=cls;
  b.textContent='Boleto';
  b.onclick=function(){ if(typeof window[escolher]==='function') window[escolher]('Boleto'); };
  box.appendChild(b);
}

if(typeof window.finAcaoReceber==='function' && !window.finAcaoReceber.__v52242bol){
  var oldRec = window.finAcaoReceber;
  window.finAcaoReceber = function(){
    var r = oldRec.apply(this, arguments);
    setTimeout(function(){ injetarBotaoBoleto('fin-formas','fin-forma h-[44px] rounded-xl border-2 text-[12.5px] font-bold border-slate-200 bg-white','finEscolherFormaBaixa'); }, 30);
    return r;
  };
  window.finAcaoReceber.__v52242bol = true;
}

if(typeof window.finConfirmarBaixa==='function' && !window.finConfirmarBaixa.__v52242bol){
  var oldBaixa = window.finConfirmarBaixa;
  window.finConfirmarBaixa = function(){
    var el = document.getElementById('fin-forma-baixa');
    if(el && el.value==='Boleto'){
      var s = typeof getSession==='function'?getSession():null;
      var ids = window.__finBaixaIds||[];
      var agora = new Date().toISOString();
      var n=0;
      ids.forEach(function(id){
        var cr = (typeof db!=='undefined' && (db.contasReceber||[])).find(function(x){ return x && x.id===id; });
        if(!cr || cr.status==='pago') return;
        if(window.FINANCEIRO_RECEBER_PURE && window.FINANCEIRO_RECEBER_PURE.aplicarBaixaTitulo)
          window.FINANCEIRO_RECEBER_PURE.aplicarBaixaTitulo(cr, 'Boleto', agora);
        else { cr.status='pago'; cr.formaPagamento='Boleto'; cr.pagamentoData=agora; cr.baixaForma='Boleto'; }
        n++;
      });
      if(typeof saveDB==='function') saveDB();
      if(typeof closeModal==='function') closeModal();
      if(typeof renderFinanceiro==='function') renderFinanceiro();
      if(typeof toast==='function') toast(n+' título(s) baixado(s) em Boleto','success');
      return;
    }
    return oldBaixa.apply(this, arguments);
  };
  window.finConfirmarBaixa.__v52242bol = true;
}

if(typeof window.vosAbrirRecebimento==='function' && !window.vosAbrirRecebimento.__v52242bol){
  var oldFat = window.vosAbrirRecebimento;
  window.vosAbrirRecebimento = function(){
    var r = oldFat.apply(this, arguments);
    setTimeout(function(){ injetarBotaoBoleto('vos-formas','vos-forma h-[44px] rounded-xl border-2 text-[12.5px] font-bold border-slate-200 bg-white','vosEscolherForma'); }, 30);
    return r;
  };
  window.vosAbrirRecebimento.__v52242bol = true;
}

console.log('[DIGICOPY] v5.22.42 menu azul, versão rodapé, Boleto');
})();
