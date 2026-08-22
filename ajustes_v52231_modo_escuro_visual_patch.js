// ═══════════════════════════════════════════════════════════════════════════
// v5.22.31 — Modo escuro com contraste certo
// • Troca o CSS feio da 5.22.30. Mesma chave, só neste aparelho.
// • Não sobe na nuvem. Impressão continua clara.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function cssEscuro(){
  return [
    '@media screen{',
    'html.digi-escuro{color-scheme:dark;--digi:#5b8cff;--digi-dark:#3b6ef5;--digi-light:#1a2744}',
    'html.digi-escuro,html.digi-escuro body{background:#0c111b!important;color:#e8eef7!important}',
    'html.digi-escuro ::-webkit-scrollbar{width:8px;height:8px}',
    'html.digi-escuro ::-webkit-scrollbar-track{background:#0c111b}',
    'html.digi-escuro ::-webkit-scrollbar-thumb{background:#334155;border-radius:999px}',
    'html.digi-escuro ::selection{background:#2563eb55;color:#fff}',

    'html.digi-escuro header,html.digi-escuro header.app-titlebar{background:#0c111b!important}',
    'html.digi-escuro header.app-titlebar .h-\\[26px\\],html.digi-escuro .app-titlebar>div:first-child{background:#0b4f8a!important;color:#fff!important}',

    'html.digi-escuro .modern-topnav{background:#141b27!important;border-bottom:1px solid #243044!important;box-shadow:none!important}',
    'html.digi-escuro .module-row{background:#141b27!important}',
    'html.digi-escuro .module>button{color:#d7e0ee!important}',
    'html.digi-escuro .module>button i,html.digi-escuro .module-menu i{color:#8bb4ff!important}',
    'html.digi-escuro .module>button:hover{background:#1e2a3d!important;color:#fff!important}',
    'html.digi-escuro .module-menu{background:#171e2b!important;border-color:#2c3648!important;box-shadow:0 18px 40px rgba(0,0,0,.45)!important}',
    'html.digi-escuro .module-menu button{color:#d7e0ee!important}',
    'html.digi-escuro .module-menu button:hover{background:#243044!important;color:#fff!important}',
    'html.digi-escuro .command-row{background:#141b27!important;border-color:#243044!important}',
    'html.digi-escuro .command-row .quick{background:#1c2536!important;border-color:#334155!important;color:#d7e0ee!important}',
    'html.digi-escuro .command-row .quick:hover{border-color:#5b8cff!important;color:#fff!important;box-shadow:none!important}',
    'html.digi-escuro .command-row .quick.primary{background:#2563eb!important;border-color:#2563eb!important;color:#fff!important}',
    'html.digi-escuro .command-search{background:#0f1623!important;border-color:#334155!important;color:#e8eef7!important}',

    'html.digi-escuro footer,html.digi-escuro .statusbar{background:#101826!important;border-color:#243044!important;color:#94a3b8!important}',
    'html.digi-escuro .statusbar span{border-color:#243044!important;color:#94a3b8!important}',

    'html.digi-escuro .neo-shell,html.digi-escuro .workspace-pad,html.digi-escuro .desktop-home,html.digi-escuro .clean-home{background:#0c111b!important}',
    'html.digi-escuro .desktop-logo,html.digi-escuro .clean-logo{color:#e8eef7!important}',
    'html.digi-escuro .clean-home:before,html.digi-escuro .clean-home:after{border-color:rgba(91,140,255,.18)!important}',
    'html.digi-escuro .clean-shortcuts button{background:#1c2536!important;border-color:#334155!important;color:#d7e0ee!important}',
    'html.digi-escuro .clean-shortcuts button:hover{background:#2563eb!important;color:#fff!important}',

    'html.digi-escuro .neo-panel,html.digi-escuro .neo-card{background:#171e2b!important;border-color:#2c3648!important;color:#e8eef7!important;box-shadow:0 8px 24px rgba(0,0,0,.28)!important}',
    'html.digi-escuro .neo-head{background:linear-gradient(135deg,#123a86,#1d5bb8)!important;color:#fff!important}',
    'html.digi-escuro .neo-btn{background:#1c2536!important;border-color:#3a465c!important;color:#e8eef7!important}',
    'html.digi-escuro .neo-btn:hover{border-color:#5b8cff!important;color:#fff!important;box-shadow:none!important}',
    'html.digi-escuro .neo-btn.primary{background:#2563eb!important;border-color:#2563eb!important;color:#fff!important}',
    'html.digi-escuro .neo-btn.danger:hover{border-color:#f87171!important;color:#fca5a5!important}',
    'html.digi-escuro .neo-input,html.digi-escuro .neo-select,html.digi-escuro .classic-input,html.digi-escuro .classic-select{background:#0f1623!important;border-color:#334155!important;color:#e8eef7!important}',
    'html.digi-escuro .neo-input:focus,html.digi-escuro .neo-select:focus{border-color:#5b8cff!important;box-shadow:0 0 0 3px rgba(91,140,255,.22)!important}',
    'html.digi-escuro .neo-label{color:#9aa8bd!important}',
    'html.digi-escuro .neo-table th{background:#121a28!important;color:#9aa8bd!important;border-color:#2c3648!important}',
    'html.digi-escuro .neo-table td,html.digi-escuro table td,html.digi-escuro table th{border-color:#243044!important;color:#e8eef7!important}',
    'html.digi-escuro thead,html.digi-escuro thead th{background:#121a28!important;color:#9aa8bd!important}',
    'html.digi-escuro .neo-table tbody tr:hover,html.digi-escuro table tbody tr:hover{background:#1e2a3d!important}',
    'html.digi-escuro .neo-selected,html.digi-escuro tr.neo-selected,html.digi-escuro .classic-row-selected{background:#1a3a5c!important}',
    'html.digi-escuro .neo-total,html.digi-escuro .classic-total{color:#93c5fd!important}',
    'html.digi-escuro .neo-suggest{background:#171e2b!important;border-color:#2c3648!important}',
    'html.digi-escuro .neo-suggest button{color:#e8eef7!important;border-color:#243044!important}',
    'html.digi-escuro .neo-suggest button:hover{background:#243044!important;color:#fff!important}',
    'html.digi-escuro .neo-tab{background:#1c2536!important;border-color:#334155!important;color:#cbd5e1!important}',
    'html.digi-escuro .neo-tab.active,html.digi-escuro .neo-tab:hover{background:#2563eb!important;border-color:#2563eb!important;color:#fff!important}',
    'html.digi-escuro .neo-status.ok{background:#14532d!important;color:#86efac!important}',
    'html.digi-escuro .neo-status.wait{background:#713f12!important;color:#fde68a!important}',
    'html.digi-escuro .neo-status.info{background:#1e3a5f!important;color:#93c5fd!important}',
    'html.digi-escuro .simple-pill{background:#1a2744!important;border-color:#334155!important;color:#93c5fd!important}',

    'html.digi-escuro input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]):not([type=hidden]),html.digi-escuro select,html.digi-escuro textarea{background:#0f1623!important;border-color:#334155!important;color:#e8eef7!important}',
    'html.digi-escuro input::placeholder,html.digi-escuro textarea::placeholder{color:#64748b!important}',
    'html.digi-escuro option,html.digi-escuro optgroup{background:#171e2b;color:#e8eef7}',

    'html.digi-escuro .bg-white:not([class*="text-[#0a1e8a]"]):not(.text-white){background-color:#171e2b!important;border-color:#2c3648!important;color:#e8eef7}',
    'html.digi-escuro .bg-white\\/60,html.digi-escuro .bg-white\\/94,html.digi-escuro .bg-white\\/80,html.digi-escuro .bg-white\\/85{background-color:#171e2b!important}',
    'html.digi-escuro button.bg-white[class*="text-[#0a1e8a]"],html.digi-escuro a.bg-white[class*="text-[#0a1e8a]"]{background:#fff!important;color:#0a1e8a!important}',

    'html.digi-escuro [class*="bg-[#0a1e8a]"]:not(.app-titlebar):not(header){background-color:#2563eb!important}',
    'html.digi-escuro [class*="bg-[#08176e]"]{background-color:#1d4ed8!important}',
    'html.digi-escuro [class*="text-[#0a1e8a]"],html.digi-escuro .text-indigo-600,html.digi-escuro .text-indigo-700{color:#93c5fd!important}',
    'html.digi-escuro [class*="bg-[#e8eaf8]"],html.digi-escuro [class*="bg-[#eef2ff]"],html.digi-escuro [class*="bg-[#f8f9ff]"],html.digi-escuro [class*="bg-[#f8fbff]"],html.digi-escuro [class*="bg-[#f4f5f9]"],html.digi-escuro [class*="bg-[#f7f7f7]"],html.digi-escuro .bg-indigo-50{background-color:#1a2744!important;color:#d7e0ee!important}',
    'html.digi-escuro [class*="border-[#c9ceef]"],html.digi-escuro .border-indigo-100{border-color:#334155!important}',

    'html.digi-escuro .bg-slate-50,html.digi-escuro .bg-slate-50\\/70,html.digi-escuro .bg-slate-50\\/80,html.digi-escuro .bg-slate-50\\/50,html.digi-escuro .bg-slate-100,html.digi-escuro .bg-gray-50,html.digi-escuro .bg-zinc-50{background-color:#121a28!important}',
    'html.digi-escuro .hover\\:bg-slate-50:hover,html.digi-escuro .hover\\:bg-slate-50\\/70:hover,html.digi-escuro .hover\\:bg-slate-100:hover,html.digi-escuro .hover\\:bg-white:hover{background-color:#1e2a3d!important}',
    'html.digi-escuro .text-slate-900,html.digi-escuro .text-slate-800,html.digi-escuro .text-slate-700,html.digi-escuro .text-gray-900,html.digi-escuro .text-gray-800{color:#e8eef7!important}',
    'html.digi-escuro .text-slate-600,html.digi-escuro .text-slate-500,html.digi-escuro .text-slate-400{color:#9aa8bd!important}',
    'html.digi-escuro .border,html.digi-escuro .border-slate-100,html.digi-escuro .border-slate-200,html.digi-escuro .border-slate-300,html.digi-escuro .border-b,html.digi-escuro .border-t,html.digi-escuro .divide-y > :not([hidden]) ~ :not([hidden]){border-color:#2c3648!important}',

    'html.digi-escuro .bg-emerald-50,html.digi-escuro .bg-emerald-50\\/50{background:#14532d!important;color:#bbf7d0!important}',
    'html.digi-escuro .text-emerald-700,html.digi-escuro .text-emerald-800,html.digi-escuro .text-emerald-600{color:#86efac!important}',
    'html.digi-escuro .bg-amber-50,html.digi-escuro .bg-amber-50\\/50{background:#713f12!important;color:#fde68a!important}',
    'html.digi-escuro .text-amber-700,html.digi-escuro .text-amber-800,html.digi-escuro .text-amber-900{color:#fcd34d!important}',
    'html.digi-escuro .bg-red-50,html.digi-escuro .bg-red-50\\/40,html.digi-escuro .bg-red-50\\/50{background:#7f1d1d!important;color:#fecaca!important}',
    'html.digi-escuro .text-red-600,html.digi-escuro .text-red-700{color:#fca5a5!important}',
    'html.digi-escuro .bg-blue-50,html.digi-escuro .bg-blue-50\\/50{background:#1e3a5f!important;color:#bfdbfe!important}',
    'html.digi-escuro .text-blue-600,html.digi-escuro .text-blue-700{color:#93c5fd!important}',
    'html.digi-escuro .bg-purple-50,html.digi-escuro .bg-violet-50{background:#3b0764!important;color:#e9d5ff!important}',
    'html.digi-escuro .text-purple-600,html.digi-escuro .text-purple-700,html.digi-escuro .text-violet-600{color:#d8b4fe!important}',

    'html.digi-escuro #modal-box,html.digi-escuro #modal-body{background:#171e2b!important;color:#e8eef7!important}',
    'html.digi-escuro #modal-footer{background:#121a28!important;border-color:#2c3648!important}',
    'html.digi-escuro #modal-box .border-b,html.digi-escuro #modal-box .border-t{border-color:#2c3648!important}',
    'html.digi-escuro #modal-title,html.digi-escuro #modal-box h3{color:#f1f5f9!important}',
    'html.digi-escuro #nfe-conf-modal>div,html.digi-escuro #nfe-senha-modal>div,html.digi-escuro #nfe-xml-modal>div{background:#171e2b!important;color:#e8eef7!important}',

    'html.digi-escuro #login-screen .bg-white,html.digi-escuro #login-step-user{background:#141b27!important;color:#e8eef7!important}',
    'html.digi-escuro #login-screen h2,html.digi-escuro #login-screen label,html.digi-escuro #login-screen p{color:#e8eef7}',
    'html.digi-escuro #toast-container .bg-white{background:#171e2b!important;color:#e8eef7!important;border-color:#334155!important}',

    'html.digi-escuro [id^="aviso-system-modal-"]>div{background:#171e2b!important;border-color:#334155!important;color:#e8eef7!important}',
    'html.digi-escuro [id^="aviso-system-modal-"] p{color:#e8eef7!important}',
    'html.digi-escuro [id^="aviso-system-modal-"] p+p{color:#cbd5e1!important}',

    'html.digi-escuro .classic-toolbar,html.digi-escuro .ribbon-actions,html.digi-escuro .classic-window,html.digi-escuro .classic-fieldset,html.digi-escuro .classic-grid-table{background:#171e2b!important;border-color:#2c3648!important;color:#e8eef7!important}',
    'html.digi-escuro .classic-menu-btn,html.digi-escuro .ribbon-actions button,html.digi-escuro .classic-toolbar-btn,html.digi-escuro .classic-icon-btn,html.digi-escuro .classic-bottom-btn{background:#171e2b!important;color:#d7e0ee!important;border-color:#2c3648!important}',
    'html.digi-escuro .classic-menu-btn i,html.digi-escuro .ribbon-actions i,html.digi-escuro .classic-toolbar-btn i,html.digi-escuro .classic-icon-btn i{color:#8bb4ff!important}',
    'html.digi-escuro .classic-grid-table th{background:#121a28!important}',

    'html.digi-escuro .shadow-xl,html.digi-escuro .shadow-lg,html.digi-escuro .shadow-md,html.digi-escuro .shadow-sm{box-shadow:0 8px 24px rgba(0,0,0,.35)!important}',
    '}',
    '@media print{html.digi-escuro,html.digi-escuro body{background:#fff!important;color:#111!important;color-scheme:light}}'
  ].join('\n');
}

window.MODO_ESCURO_VISUAL_PURE = {
  cssEscuro: cssEscuro
};

if(typeof document === 'undefined') return;

function aplicarCss(){
  var s = document.getElementById('digi-escuro-css');
  if(!s){
    s = document.createElement('style');
    s.id = 'digi-escuro-css';
    document.head.appendChild(s);
  }
  s.textContent = cssEscuro();
}

aplicarCss();
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', aplicarCss);
}
setTimeout(aplicarCss, 80);

console.log('[DIGICOPY] v5.22.31 modo escuro com contraste');
})();
