// ═══════════════════════════════════════════════════════════════════════════
// v5.22.30 — Modo escuro só neste aparelho
// • Liga/desliga em Configurações. Não sobe na nuvem. Não muda outros PCs.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var KEY = 'digicopy_ui_modo_escuro_dispositivo_v1';

function lerEscuro(){
  try{ return localStorage.getItem(KEY) === '1'; }catch(e){ return false; }
}
function gravarEscuro(on){
  try{ localStorage.setItem(KEY, on ? '1' : '0'); return true; }
  catch(e){ return false; }
}

window.MODO_ESCURO_PURE = {
  KEY: KEY,
  lerEscuro: lerEscuro,
  gravarEscuro: gravarEscuro
};

if(typeof document === 'undefined') return;

function aplicarEscuro(on){
  var html = document.documentElement;
  var body = document.body;
  if(on){
    html.classList.add('digi-escuro');
    if(body) body.classList.add('digi-escuro');
  }else{
    html.classList.remove('digi-escuro');
    if(body) body.classList.remove('digi-escuro');
  }
  var meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', on ? '#0b1220' : '#0a1e8a');
  var chk = document.getElementById('ui-escuro-chk');
  if(chk) chk.checked = !!on;
  atualizarBotaoTopnav(on);
}

function atualizarBotaoTopnav(on){
  try{
    var icone = document.getElementById('icone-modo-escuro-top');
    if(icone){
      icone.className = on ? 'ph ph-sun text-amber-400' : 'ph ph-moon';
    }
    var label = document.getElementById('label-modo-escuro-top');
    if(label){
      label.textContent = on ? 'Claro' : 'Escuro';
    }
    var btn = document.getElementById('btn-modo-escuro-top');
    if(btn){
      btn.title = on ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro';
    }
  }catch(e){}
}

window.toggleModoEscuro = function(){
  var novo = !lerEscuro();
  gravarEscuro(novo);
  aplicarEscuro(novo);
  if(typeof toast === 'function'){
    toast(novo ? 'Modo Escuro ativado' : 'Modo Claro ativado', 'info');
  }
};

window.aplicarModoEscuro = function(on){
  gravarEscuro(!!on);
  aplicarEscuro(!!on);
};

function garantirCss(){
  if(document.getElementById('digi-escuro-css')) return;
  var s = document.createElement('style');
  s.id = 'digi-escuro-css';
  s.textContent = [
    'html.digi-escuro,html.digi-escuro body{background:#0b1220!important;color:#e5e7eb!important}',
    'html.digi-escuro ::-webkit-scrollbar-thumb{background:#334155}',
    'html.digi-escuro header.app-titlebar .h-\\[26px\\],html.digi-escuro .app-titlebar>div:first-child{background:#0a1e8a!important}',
    'html.digi-escuro .modern-topnav,html.digi-escuro .module-row,html.digi-escuro .command-row{background:#111827!important;border-color:#1f2937!important;box-shadow:none!important}',
    'html.digi-escuro .module-row{background:linear-gradient(180deg,#111827,#0f172a)!important}',
    'html.digi-escuro .module>button,html.digi-escuro .module-menu button,html.digi-escuro .command-row .quick{color:#e5e7eb!important}',
    'html.digi-escuro .module>button:hover,html.digi-escuro .module-menu button:hover{background:#1e293b!important;color:#fff!important}',
    'html.digi-escuro .module-menu,html.digi-escuro .neo-suggest{background:#111827!important;border-color:#334155!important}',
    'html.digi-escuro .command-row .quick{background:#1e293b!important;border-color:#334155!important}',
    'html.digi-escuro .ml-auto.text-slate-500,html.digi-escuro .text-slate-500,html.digi-escuro .text-slate-400,html.digi-escuro .text-slate-600{color:#94a3b8!important}',
    'html.digi-escuro footer,html.digi-escuro .statusbar{background:#0f172a!important;border-color:#1f2937!important;color:#94a3b8!important}',
    'html.digi-escuro .neo-shell,html.digi-escuro .workspace-pad,html.digi-escuro .clean-home,html.digi-escuro .desktop-home{background:#0b1220!important}',
    'html.digi-escuro .neo-panel,html.digi-escuro .neo-card,html.digi-escuro .rounded-\\[16px\\].bg-white,html.digi-escuro .rounded-\\[14px\\].bg-white,html.digi-escuro .bg-white,html.digi-escuro .bg-white\\/60,html.digi-escuro .bg-white\\/94{background:#111827!important;border-color:#334155!important;color:#e5e7eb!important}',
    'html.digi-escuro .neo-table th{background:#0f172a!important;color:#94a3b8!important;border-color:#334155!important}',
    'html.digi-escuro .neo-table td,html.digi-escuro table td,html.digi-escuro table th{border-color:#1f2937!important;color:#e5e7eb!important}',
    'html.digi-escuro .neo-table tbody tr:hover,html.digi-escuro table tbody tr:hover{background:#1e293b!important}',
    'html.digi-escuro .neo-selected,html.digi-escuro tr.neo-selected{background:#1e3a5f!important}',
    'html.digi-escuro .neo-input,html.digi-escuro .neo-select,html.digi-escuro input,html.digi-escuro select,html.digi-escuro textarea{background:#0f172a!important;border-color:#334155!important;color:#e5e7eb!important}',
    'html.digi-escuro input::placeholder,html.digi-escuro textarea::placeholder{color:#64748b!important}',
    'html.digi-escuro .neo-btn{background:#1e293b!important;border-color:#334155!important;color:#e5e7eb!important}',
    'html.digi-escuro .neo-btn.primary,html.digi-escuro .neo-tab.active,html.digi-escuro button.bg-\\[\\#0a1e8a\\]{background:#0a1e8a!important;border-color:#1d4ed8!important;color:#fff!important}',
    'html.digi-escuro .neo-tab{background:#1e293b!important;border-color:#334155!important;color:#cbd5e1!important}',
    'html.digi-escuro #modal-box,html.digi-escuro #modal-body,html.digi-escuro #modal-footer{background:#111827!important;color:#e5e7eb!important;border-color:#334155!important}',
    'html.digi-escuro #modal-box .border-b,html.digi-escuro #modal-box .border-t{border-color:#334155!important}',
    'html.digi-escuro #modal-box h3,html.digi-escuro #modal-title{color:#f1f5f9!important}',
    'html.digi-escuro .bg-slate-50,html.digi-escuro .bg-slate-50\\/80,html.digi-escuro .bg-slate-100,html.digi-escuro .bg-\\[\\#f8f9ff\\],html.digi-escuro .bg-\\[\\#f8fbff\\],html.digi-escuro .bg-\\[\\#f4f5f9\\],html.digi-escuro .bg-\\[\\#f7f7f7\\]{background:#0f172a!important}',
    'html.digi-escuro .border,html.digi-escuro .border-slate-100,html.digi-escuro .border-slate-200,html.digi-escuro .border-b,html.digi-escuro .border-t{border-color:#334155!important}',
    'html.digi-escuro .text-slate-800,html.digi-escuro .text-slate-700,html.digi-escuro .text-slate-900,html.digi-escuro b{color:#e5e7eb}',
    'html.digi-escuro .login-bg{background:radial-gradient(1200px 600px at 20% 10%,#1e3a8a 0%,#0a1e8a 35%,#020617 100%)}',
    'html.digi-escuro #login-screen .bg-white,html.digi-escuro #login-step-user{background:#111827!important;color:#e5e7eb!important}',
    'html.digi-escuro #login-screen h2,html.digi-escuro #login-screen label{color:#e5e7eb!important}',
    'html.digi-escuro .bg-emerald-50,html.digi-escuro .bg-amber-50,html.digi-escuro .bg-blue-50,html.digi-escuro .bg-red-50{background:#1e293b!important}',
    'html.digi-escuro .neo-head{background:linear-gradient(135deg,#0a1e8a,#1e3a8a)!important}',
    'html.digi-escuro #nfe-conf-modal>div,html.digi-escuro #nfe-senha-modal>div,html.digi-escuro #nfe-xml-modal>div{background:#111827!important;color:#e5e7eb!important}'
  ].join('\n');
  document.head.appendChild(s);
}

function cardEscuro(){
  var grid = document.querySelector('#view-config .grid') || document.getElementById('view-config');
  if(!grid || document.getElementById('ui-escuro-dispositivo-card')) return;
  var card = document.createElement('div');
  card.id = 'ui-escuro-dispositivo-card';
  card.className = 'rounded-[16px] bg-white border p-6';
  var on = lerEscuro();
  card.innerHTML = '<h4 class="font-bold text-[14px]"><i class="ph ph-moon"></i> Aparência deste computador</h4>'+
    '<p class="text-[12px] text-slate-500 mt-1">Modo escuro vale só neste aparelho. Não muda os outros PCs e não sobe na nuvem.</p>'+
    '<label class="mt-4 h-10 px-3 rounded-xl border bg-white flex items-center gap-2 font-semibold text-[13px] w-fit cursor-pointer">'+
    '<input id="ui-escuro-chk" type="checkbox"'+(on?' checked':'')+'> Modo escuro</label>';
  grid.appendChild(card);
  var chk = document.getElementById('ui-escuro-chk');
  if(chk){
    chk.onchange = function(){
      var liga = !!chk.checked;
      gravarEscuro(liga);
      aplicarEscuro(liga);
    };
  }
}

garantirCss();
aplicarEscuro(lerEscuro());

if(typeof window.renderConfig === 'function' && !window.renderConfig.__v52230escuro){
  var old = window.renderConfig;
  window.renderConfig = function(){
    var r = old.apply(this, arguments);
    setTimeout(cardEscuro, 220);
    setTimeout(cardEscuro, 600);
    return r;
  };
  window.renderConfig.__v52230escuro = true;
}

setTimeout(cardEscuro, 800);
console.log('[DIGICOPY] v5.22.30 modo escuro só neste aparelho');
})();
