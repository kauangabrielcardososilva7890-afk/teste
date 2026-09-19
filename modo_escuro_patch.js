// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.21.3 — Modo escuro (claro/escuro com um clique)
// v5.21.4 — botão perigo (Excluir módulo) e bordas do detalhe no escuro.
// • Botão lua/sol na barra azul do topo (ao lado do sino). Vale para o
//   sistema inteiro, incluindo as abas do Fiscal e os outros menus.
// • A escolha fica salva neste navegador/PC (claro é o padrão).
// • Na impressão, o sistema volta sozinho para o claro (não gasta tinta).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

/* ---------------- LÓGICA PURA (testável em node) ---------------- */

const TEMA_KEY = 'digicopy_theme_v1';
function resolve(valorSalvo){
  return String(valorSalvo || '').toLowerCase() === 'dark' ? 'dark' : 'light';
}
function next(tema){
  return resolve(tema) === 'dark' ? 'light' : 'dark';
}
function isDark(tema){ return resolve(tema) === 'dark'; }

window.MODO_ESCURO_PURE = { KEY: TEMA_KEY, resolve, next, isDark };

if(typeof document === 'undefined') return; // modo teste (node)

/* ---------------- Tema (navegador) ---------------- */

function ler(){
  try{ return resolve(localStorage.getItem(TEMA_KEY)); }catch(e){ return 'light'; }
}
function aplicar(tema){
  const t = resolve(tema);
  try{ document.documentElement.dataset.theme = t; }catch(e){}
  try{ document.documentElement.style.colorScheme = t; }catch(e){}
  const btn = document.getElementById('tema-btn-icone');
  if(btn) btn.className = t === 'dark' ? 'ph ph-sun text-[15px]' : 'ph ph-moon text-[15px]';
  const wrap = document.getElementById('tema-btn');
  if(wrap) wrap.title = t === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro';
  return t;
}
window.temaAtual = function(){ return ler(); };
window.alternarTema = function(){
  const t = next(ler());
  try{ localStorage.setItem(TEMA_KEY, t); }catch(e){}
  aplicar(t);
  return t;
};

const CSS =
':root{--dc-bg:#f1f5f9;--dc-panel:#ffffff;--dc-panel2:#f8fafc;--dc-text:#0f172a;--dc-muted:#64748b;--dc-border:#e2e8f0;--dc-input:#ffffff;--dc-hover:#f5f9ff;--dc-menu:#ffffff;--dc-shadow:rgba(15,23,42,.07);}\n' +
'html[data-theme="dark"]{--dc-bg:#0b1220;--dc-panel:#111c33;--dc-panel2:#0e1730;--dc-text:#e6edf7;--dc-muted:#93a3bd;--dc-border:#233252;--dc-input:#0e1730;--dc-hover:#1a2a4a;--dc-menu:#101b34;--dc-shadow:rgba(0,0,0,.45);}\n' +
'html[data-theme="dark"] body{background:var(--dc-bg)!important;color:var(--dc-text);}\n' +
'html[data-theme="dark"] #app-shell{background:var(--dc-bg);color:var(--dc-text);}\n' +
'html[data-theme="dark"] .modern-topnav{background:var(--dc-menu);border-bottom-color:var(--dc-border);box-shadow:0 1px 8px var(--dc-shadow);}\n' +
'html[data-theme="dark"] .module-row{background:linear-gradient(180deg,#131f3a,#0e1730);}\n' +
'html[data-theme="dark"] .module>button{color:var(--dc-text);}\n' +
'html[data-theme="dark"] .module>button i{color:#8fb4ff;}\n' +
'html[data-theme="dark"] .module>button:hover{background:#1a2a4a;color:#fff;}\n' +
'html[data-theme="dark"] .module-menu{background:var(--dc-menu);border-color:var(--dc-border);box-shadow:0 18px 45px var(--dc-shadow);}\n' +
'html[data-theme="dark"] .module-menu button{color:var(--dc-text);}\n' +
'html[data-theme="dark"] .module-menu button:hover{background:var(--dc-hover);color:#fff;}\n' +
'html[data-theme="dark"] .module-menu i{color:#8fb4ff;}\n' +
'html[data-theme="dark"] .module-menu small{color:var(--dc-muted);}\n' +
'html[data-theme="dark"] .dynamic-menu-heading{color:var(--dc-muted)!important;}\n' +
'html[data-theme="dark"] .command-row{background:var(--dc-menu);border-top-color:var(--dc-border);}\n' +
'html[data-theme="dark"] .command-row .quick{background:var(--dc-panel);border-color:var(--dc-border);color:var(--dc-text);}\n' +
'html[data-theme="dark"] .command-search{background:var(--dc-input);border-color:var(--dc-border);color:var(--dc-text);}\n' +
'html[data-theme="dark"] .statusbar{background:#0e1730;border-top-color:var(--dc-border);color:var(--dc-muted);}\n' +
'html[data-theme="dark"] .statusbar span{border-right-color:var(--dc-border);}\n' +
'html[data-theme="dark"] .neo-shell{background:linear-gradient(180deg,#0b1220 0,#0b1220 72%);}\n' +
'html[data-theme="dark"] .neo-panel{background:var(--dc-panel);border-color:var(--dc-border);box-shadow:0 12px 35px var(--dc-shadow);}\n' +
'html[data-theme="dark"] .neo-card{background:var(--dc-panel2);border-color:var(--dc-border);color:var(--dc-text);}\n' +
'html[data-theme="dark"] .neo-label{color:var(--dc-muted);}\n' +
'html[data-theme="dark"] .neo-total{color:#9dbcff;}\n' +
'html[data-theme="dark"] .neo-btn{background:var(--dc-panel2);border-color:var(--dc-border);color:var(--dc-text);}\n' +
'html[data-theme="dark"] .neo-btn:hover{border-color:#8fb4ff;color:#fff;box-shadow:0 8px 18px rgba(0,0,0,.35);}\n' +
'html[data-theme="dark"] .neo-btn.primary{background:#2b4acb;border-color:#2b4acb;color:#fff;}\n' +
'html[data-theme="dark"] .neo-btn.danger:hover{border-color:#f87171;color:#f87171;box-shadow:0 8px 18px rgba(0,0,0,.35);}\n' +
'html[data-theme="dark"] #modal-root .border-t,html[data-theme="dark"] #modal-root .border-b{border-color:var(--dc-border)!important;}\n' +
'html[data-theme="dark"] .neo-input,html[data-theme="dark"] .neo-select{background:var(--dc-input);border-color:var(--dc-border);color:var(--dc-text);}\n' +
'html[data-theme="dark"] .neo-input::placeholder{color:var(--dc-muted);}\n' +
'html[data-theme="dark"] .neo-table th{background:#0e1730;color:var(--dc-muted);border-bottom-color:var(--dc-border);}\n' +
'html[data-theme="dark"] .neo-table td{border-bottom-color:var(--dc-border);color:var(--dc-text);}\n' +
'html[data-theme="dark"] .neo-table tbody tr:hover{background:var(--dc-hover);}\n' +
'html[data-theme="dark"] .neo-selected{background:#1e3a8a!important;}\n' +
'html[data-theme="dark"] .neo-suggest{background:var(--dc-menu);border-color:var(--dc-border);}\n' +
'html[data-theme="dark"] .neo-suggest button{border-bottom-color:var(--dc-border);color:var(--dc-text);}\n' +
'html[data-theme="dark"] .neo-suggest button:hover{background:var(--dc-hover);color:#fff;}\n' +
'html[data-theme="dark"] .neo-tab{background:var(--dc-panel2);border-color:var(--dc-border);color:var(--dc-text);}\n' +
'html[data-theme="dark"] .neo-tab.active,html[data-theme="dark"] .neo-tab:hover{background:#2b4acb;border-color:#2b4acb;color:#fff;}\n' +
'html[data-theme="dark"] .neo-status.ok{background:#14532d;color:#bbf7d0;}\n' +
'html[data-theme="dark"] .neo-status.wait{background:#713f12;color:#fde68a;}\n' +
'html[data-theme="dark"] .neo-status.info{background:#1e3a8a;color:#bfdbfe;}\n' +
'html[data-theme="dark"] #app-shell .bg-white{background-color:var(--dc-panel)!important;}\n' +
'html[data-theme="dark"] #app-shell .bg-slate-50,html[data-theme="dark"] #app-shell .bg-slate-100{background-color:var(--dc-panel2)!important;}\n' +
'html[data-theme="dark"] #app-shell .text-slate-500,html[data-theme="dark"] #app-shell .text-slate-400{color:var(--dc-muted)!important;}\n' +
'html[data-theme="dark"] #app-shell .text-slate-600,html[data-theme="dark"] #app-shell .text-slate-700,html[data-theme="dark"] #app-shell .text-slate-800{color:var(--dc-text)!important;}\n' +
'html[data-theme="dark"] #app-shell .text-\\[\\#0a1e8a\\]{color:#9dbcff!important;}\n' +
'html[data-theme="dark"] #app-shell .border,html[data-theme="dark"] #app-shell .border-b,html[data-theme="dark"] #app-shell .border-t{border-color:var(--dc-border)!important;}\n' +
'html[data-theme="dark"] #app-shell input,html[data-theme="dark"] #app-shell select,html[data-theme="dark"] #app-shell textarea{background:var(--dc-input);border-color:var(--dc-border);color:var(--dc-text);}\n' +
'html[data-theme="dark"] #app-shell input::placeholder,html[data-theme="dark"] #app-shell textarea::placeholder{color:var(--dc-muted);}\n' +
'html[data-theme="dark"] #app-shell table thead{background:var(--dc-panel2);}\n' +
'html[data-theme="dark"] #modal-root .bg-white{background-color:var(--dc-panel)!important;}\n' +
'html[data-theme="dark"] #modal-box{background:var(--dc-panel)!important;color:var(--dc-text);}\n' +
'html[data-theme="dark"] .clean-home{background:radial-gradient(circle at 52% 48%,#16213d 0,#0b1220 45%,#0b1220 100%);}\n' +
'html[data-theme="dark"] .clean-logo{color:var(--dc-text);}\n' +
'html[data-theme="dark"] .clean-logo p{color:var(--dc-muted);}\n' +
'html[data-theme="dark"] .clean-shortcuts button{background:rgba(17,28,51,.9);border-color:var(--dc-border);color:var(--dc-text);}\n' +
'html[data-theme="dark"] .desktop-home{background:var(--dc-bg);}\n' +
'html[data-theme="dark"] .desktop-logo{color:var(--dc-text);}\n' +
'html[data-theme="dark"] #login-screen{background:var(--dc-bg)!important;}\n' +
'html[data-theme="dark"] #digicopy-cloud-modal>div{background:var(--dc-panel)!important;color:var(--dc-text);}\n' +
'html[data-theme="dark"] #digicopy-cloud-modal input,html[data-theme="dark"] #digicopy-cloud-modal select{background:var(--dc-input)!important;color:var(--dc-text)!important;border-color:var(--dc-border)!important;}\n' +
'@media print{html[data-theme="dark"] body,html[data-theme="dark"] #app-shell{background:#fff!important;color:#000;}}\n';

function instalarCss(){
  if(document.getElementById('modo-escuro-css')) return;
  const st = document.createElement('style');
  st.id = 'modo-escuro-css';
  st.textContent = CSS;
  document.head.appendChild(st);
}
function instalarBotao(){
  if(document.getElementById('tema-btn')) return true;
  const sino = document.getElementById('ntf-btn');
  if(!sino || !sino.parentNode) return false;
  const btn = document.createElement('button');
  btn.id = 'tema-btn';
  btn.type = 'button';
  btn.onclick = function(){ window.alternarTema(); };
  btn.className = 'w-7 h-7 grid place-items-center rounded-lg bg-white/15 hover:bg-white/25 transition';
  btn.innerHTML = '<i id="tema-btn-icone" class="ph ph-moon text-[15px]"></i>';
  sino.parentNode.insertBefore(btn, sino.nextSibling);
  return true;
}

try{
  instalarCss();
  aplicar(ler());
  if(!instalarBotao()){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ instalarBotao(); aplicar(ler()); });
    else setTimeout(function(){ instalarBotao(); aplicar(ler()); }, 300);
  }
}catch(e){}

console.log('[DIGICOPY] modo_escuro_patch.js v5.21.3 carregado — tema: ' + ler());
})();
