// ═══════════════════════════════════════════════════════════════════════════
// v5.22.33 — Modo escuro no login e no painel Nuvem
// • Só essas duas telas. Não mexe no resto do visual da 5.22.30.
// • Continua só neste aparelho.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function cssLoginNuvem(){
  return [
    'html.digi-escuro #login-screen{background:#0b1220!important}',
    'html.digi-escuro #login-screen .flex-1.bg-white,html.digi-escuro #login-screen>.flex-1{background:#111827!important;color:#e5e7eb!important}',
    'html.digi-escuro #login-screen h2,html.digi-escuro #login-screen label,html.digi-escuro #login-screen p,html.digi-escuro #login-screen .font-bold{color:#e5e7eb!important}',
    'html.digi-escuro #login-screen .text-slate-500,html.digi-escuro #login-screen .text-slate-400{color:#94a3b8!important}',
    'html.digi-escuro #login-screen [class*="bg-[#eef2ff]"],html.digi-escuro #login-screen [class*="bg-[#e8eaf8]"]{background:#1e293b!important;border-color:#334155!important}',
    'html.digi-escuro #login-screen input{background:#0f172a!important;border-color:#334155!important;color:#e5e7eb!important}',
    'html.digi-escuro #login-screen input:focus{background:#0f172a!important}',
    'html.digi-escuro #login-screen button.hover\\:bg-slate-100:hover{background:#1e293b!important}',

    'html.digi-escuro #digicopy-cloud-modal>div{background:#111827!important;color:#e5e7eb!important}',
    'html.digi-escuro #digicopy-cloud-modal #dc-body{background:#111827!important;color:#e5e7eb!important}',
    'html.digi-escuro #digicopy-cloud-modal h3,html.digi-escuro #digicopy-cloud-modal h4,html.digi-escuro #digicopy-cloud-modal b{color:#e5e7eb!important}',
    'html.digi-escuro #digicopy-cloud-modal p,html.digi-escuro #digicopy-cloud-modal small,html.digi-escuro #digicopy-cloud-modal label{color:#94a3b8!important}',
    'html.digi-escuro #digicopy-cloud-modal input,html.digi-escuro #digicopy-cloud-modal select,html.digi-escuro #digicopy-cloud-modal textarea{background:#0f172a!important;border-color:#334155!important;color:#e5e7eb!important}',
    'html.digi-escuro #digicopy-cloud-modal [style*="background:white"],html.digi-escuro #digicopy-cloud-modal [style*="background:#fff"],html.digi-escuro #digicopy-cloud-modal [style*="background:#f8fafc"],html.digi-escuro #digicopy-cloud-modal [style*="background:#f1f5f9"],html.digi-escuro #digicopy-cloud-modal [style*="background:#e8eaf8"],html.digi-escuro #digicopy-cloud-modal [style*="background:#fffafa"]{background:#1e293b!important;color:#e5e7eb!important;border-color:#334155!important}',
    'html.digi-escuro #digicopy-cloud-modal [style*="color:#475569"],html.digi-escuro #digicopy-cloud-modal [style*="color:#64748b"],html.digi-escuro #digicopy-cloud-modal [style*="color:#334155"]{color:#94a3b8!important}',
    'html.digi-escuro #digicopy-cloud-modal button[style*="background:white"],html.digi-escuro #digicopy-cloud-modal button[style*="background:#f8fafc"],html.digi-escuro #digicopy-cloud-modal button[style*="background:#f1f5f9"]{background:#1e293b!important;color:#e5e7eb!important;border-color:#334155!important}',
    'html.digi-escuro #digicopy-cloud-modal button[style*="background:#0a1e8a"]{background:#0a1e8a!important;color:#fff!important}'
  ].join('\n');
}

window.ESCURO_LOGIN_NUVEM_PURE = { cssLoginNuvem: cssLoginNuvem };

if(typeof document === 'undefined') return;

function aplicar(){
  var s = document.getElementById('digi-escuro-login-nuvem-css');
  if(!s){
    s = document.createElement('style');
    s.id = 'digi-escuro-login-nuvem-css';
    document.head.appendChild(s);
  }
  s.textContent = cssLoginNuvem();
}

aplicar();
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar);
setTimeout(aplicar, 80);
console.log('[DIGICOPY] v5.22.33 escuro no login e na Nuvem');
})();
