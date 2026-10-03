// DIGICOPY v8.0.0 — Configurações finais
// Remove cartões obsoletos, transforma Etiquetas em submenu próprio e aplica
// uma aparência escura consistente às telas novas e legadas.
(function(){
'use strict';
if(typeof document==='undefined') return;

function perfil(){ try{return String(window.DIGICOPY_BUILD_PROFILE||'particular-cloud');}catch(e){return 'particular-cloud';} }
function comercial(){ return perfil()==='commercial-cloud'; }
function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function cfg(){ try{ db.config=db.config||{}; return db.config; }catch(e){ return {}; } }
function sess(){ try{return typeof getSession==='function'?getSession():null;}catch(e){return null;} }
function modoEscuro(){
  try{
    var s=sess(), key=comercial()&&s ? 'digicopy_ui_modo_escuro_'+s.usuarioId : 'digicopy_ui_modo_escuro_dispositivo_v1';
    if(comercial() && cfg().uiTemaPorUsuario && s && cfg().uiTemaPorUsuario[s.usuarioId]) return !!cfg().uiTemaPorUsuario[s.usuarioId].escuro;
    return localStorage.getItem(key)==='1';
  }catch(e){return false;}
}
function aplicarTema(){ document.documentElement.classList.toggle('digi-escuro',modoEscuro()); document.body&&document.body.classList.toggle('digi-escuro',modoEscuro()); }
function ligarTemaPorUsuario(){
  var chk=document.getElementById('ui-escuro-chk'); if(!chk || chk.dataset.v8Bound==='1') return;
  chk.dataset.v8Bound='1'; chk.addEventListener('change',function(){
    if(!comercial()) return;
    var s=sess(); if(!s) return;
    var c=cfg(); c.uiTemaPorUsuario=c.uiTemaPorUsuario||{};
    c.uiTemaPorUsuario[s.usuarioId]={escuro:!!chk.checked,atualizadoEm:new Date().toISOString()};
    if(typeof saveDB==='function') saveDB();
  });
}
function removerObsoletos(){
  ['nfe-config-card','rtf-template-card'].forEach(id=>{var el=document.getElementById(id); if(el) el.remove();});
}
function cardTemaV8(){
  var grid=document.querySelector('#view-config .grid')||document.getElementById('view-config'); if(!grid||document.getElementById('v8-tema-card')) return;
  var card=document.createElement('div'); card.id='v8-tema-card'; card.className='v8-tema-card rounded-[18px] border p-6';
  card.innerHTML='<div class="flex items-center gap-3"><span class="v8-icon"><i class="ph ph-moon"></i></span><div><h4 class="font-bold text-[16px]">Aparência do sistema</h4><p class="text-[12px] text-slate-500 mt-1">Ative o modo escuro para usar o ERP com menos brilho. A preferência segue o usuário no Comercial.</p></div></div><label class="v8-theme-toggle mt-5"><input id="v8-escuro-chk" type="checkbox" '+(modoEscuro()?'checked':'')+'><span class="v8-switch"></span><span>Modo escuro</span></label>';
  grid.appendChild(card);
  var chk=document.getElementById('v8-escuro-chk'); if(chk) chk.addEventListener('change',function(){
    var on=!!chk.checked, s=sess();
    try{ if(comercial()&&s){var c=cfg(); c.uiTemaPorUsuario=c.uiTemaPorUsuario||{}; c.uiTemaPorUsuario[s.usuarioId]={escuro:on,atualizadoEm:new Date().toISOString()};} else localStorage.setItem('digicopy_ui_modo_escuro_dispositivo_v1',on?'1':'0'); }catch(e){}
    aplicarTema(); if(typeof saveDB==='function'&&comercial()) saveDB();
  });
}
function cardEtiquetas(){
  var card=document.getElementById('cartuchos-etiquetas-card'); if(!card) return;
  if(card.dataset.v8Rendered==='1' && card.querySelector('.v8-etq-grid')) return;
  var c=(((typeof db!=='undefined'&&db.config)||{}).cartuchosRecargas||{}).etiquetas||{};
  var col=Number(c.colunas||7), lin=Number(c.linhas||18), ini=Number(c.proximoNumero||1);
  card.className='v8-etiquetas-card rounded-[18px] border p-6 lg:col-span-3';
  card.innerHTML='<div class="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">'+
    '<div><div class="flex items-center gap-2"><span class="v8-icon"><i class="ph ph-barcode"></i></span><div><h4 class="font-bold text-[17px]">Gerar etiquetas</h4><p class="text-[12px] text-slate-500 mt-1">Configure a folha, confira a grade e imprima etiquetas numéricas para os cartuchos.</p></div></div></div>'+
    '<button type="button" class="neo-btn primary" onclick="imprimirEtiquetasCartucho()"><i class="ph ph-printer"></i> Imprimir</button></div>'+
    '<div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mt-5 items-end">'+
    '<label class="v8-field">Margem superior (mm)<input id="etq-margem-top" type="number" min="0" value="'+(c.margemSuperiorMm||5)+'"></label>'+
    '<label class="v8-field">Margem esquerda (mm)<input id="etq-margem-left" type="number" min="0" value="'+(c.margemEsquerdaMm||5)+'"></label>'+
    '<label class="v8-field">Colunas<input id="etq-colunas" type="number" min="1" max="12" value="'+col+'"></label>'+
    '<label class="v8-field">Linhas<input id="etq-linhas" type="number" min="1" max="30" value="'+lin+'"></label>'+
    '<label class="v8-field">Intervalo inicial<input id="cart-etq-inicio" type="number" min="1" value="'+ini+'"></label>'+
    '<label class="v8-field">Intervalo final<input id="cart-etq-fim" type="number" min="1" value="'+(ini+col*lin-1)+'"></label>'+
    '<label class="v8-field">Agrupar<select id="etq-agrupar"><option value="nao">Não</option><option value="sim">Sim</option></select></label>'+
    '<button type="button" class="neo-btn h-10" onclick="window.v8AtualizarEtiquetas()"><i class="ph ph-check"></i> Aplicar</button></div>'+
    '<div class="v8-etq-preview mt-5"><div class="flex items-center justify-between mb-3"><b>Prévia da folha</b><span class="text-[11px] text-slate-500">'+col+' colunas × '+lin+' linhas</span></div><div class="v8-etq-grid" style="--etq-cols:'+Math.min(col,12)+'">'+Array.from({length:Math.min(col*lin,126)},(_,i)=>'<div class="v8-etq-cell"><span class="v8-mini-bars"></span><b>'+String(ini+i)+'</b></div>').join('')+'</div></div>';
  card.dataset.v8Rendered='1';
  var fim=document.getElementById('cart-etq-fim'); if(fim) fim.oninput=function(){};
}
window.v8AtualizarEtiquetas=function(){
  if(typeof db==='undefined') return;
  db.config=db.config||{}; db.config.cartuchosRecargas=db.config.cartuchosRecargas||{}; db.config.cartuchosRecargas.etiquetas={...(db.config.cartuchosRecargas.etiquetas||{}),colunas:Math.max(1,Number(document.getElementById('etq-colunas')?.value||7)),linhas:Math.max(1,Number(document.getElementById('etq-linhas')?.value||18)),margemSuperiorMm:Number(document.getElementById('etq-margem-top')?.value||5),margemEsquerdaMm:Number(document.getElementById('etq-margem-left')?.value||5)};
  if(typeof saveDB==='function') saveDB(); if(typeof toast==='function') toast('Layout das etiquetas atualizado','success'); var card=document.getElementById('cartuchos-etiquetas-card'); if(card) delete card.dataset.v8Rendered; cardEtiquetas();
};
function garantirSubmenu(){
  var side=document.getElementById('shell-sidebar-links'); if(!side || side.querySelector('[data-v8-etiquetas]')) return;
  var groups=Array.from(side.querySelectorAll('details')); var g=groups.find(x=>/configurações/i.test(x.querySelector('summary')?.textContent||'')); if(!g) return;
  var b=document.createElement('button'); b.type='button'; b.setAttribute('data-v8-etiquetas','1'); b.className='shell-side-sub'; b.innerHTML='<i class="ph ph-barcode"></i><span>Etiquetas de cartuchos</span>'; b.onclick=function(){ if(typeof navigateTo==='function') navigateTo('config'); setTimeout(()=>document.getElementById('cartuchos-etiquetas-card')?.scrollIntoView({behavior:'smooth',block:'start'}),120); }; (g.querySelector('.shell-side-sub')?.parentElement||g).appendChild(b);
}
function limparEAplicar(){ removerObsoletos(); garantirSubmenu(); aplicarTema(); ligarTemaPorUsuario(); if(document.getElementById('view-config')) { setTimeout(cardEtiquetas,30); setTimeout(cardTemaV8,45); } }
window.renderCardEtiquetas=cardEtiquetas;
var oldRC=window.renderConfig;
if(typeof oldRC==='function'&&!oldRC.__v8000cfg){ window.renderConfig=function(){var r=oldRC.apply(this,arguments); setTimeout(limparEAplicar,20); setTimeout(limparEAplicar,250); return r;}; window.renderConfig.__v8000cfg=true; }
var css=document.createElement('style'); css.id='v8-config-css'; css.textContent='#nfe-config-card,#rtf-template-card{display:none!important}#ui-menus-dispositivo-card,#ui-escuro-dispositivo-card{display:none!important}.v8-etiquetas-card,.v8-tema-card{background:linear-gradient(145deg,#fff,#f8faff);box-shadow:0 12px 32px rgba(15,23,42,.06)}.v8-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:12px;background:#e8ecff;color:#0a1e8a;font-size:20px}.v8-field{font-size:10px;font-weight:800;text-transform:uppercase;color:#64748b}.v8-field input,.v8-field select{display:block;width:100%;height:40px;margin-top:5px;border:1px solid #dbe2f0;border-radius:10px;padding:0 10px;background:#fff;color:#172554}.v8-etq-preview{border:1px solid #dbe2f0;border-radius:14px;padding:14px;background:#f8fafc}.v8-etq-grid{display:grid;grid-template-columns:repeat(var(--etq-cols),minmax(0,1fr));gap:5px;max-height:360px;overflow:auto;padding:8px;background:#fff;border-radius:10px}.v8-etq-cell{min-height:34px;border:1px dashed #cbd5e1;border-radius:5px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;color:#334155}.v8-mini-bars{width:24px;height:8px;background:repeating-linear-gradient(90deg,#111 0 2px,transparent 2px 4px);margin-bottom:3px}.v8-theme-toggle{display:flex;align-items:center;gap:10px;width:max-content;padding:10px 14px;border:1px solid #dbe2f0;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer}.v8-theme-toggle input{position:absolute;opacity:0}.v8-switch{width:38px;height:22px;background:#cbd5e1;border-radius:999px;position:relative}.v8-switch:after{content:"";position:absolute;width:18px;height:18px;top:2px;left:2px;border-radius:50%;background:#fff;transition:.15s}.v8-theme-toggle input:checked+.v8-switch{background:#0a1e8a}.v8-theme-toggle input:checked+.v8-switch:after{left:18px}.digi-escuro .v8-etiquetas-card,.digi-escuro .v8-tema-card{background:#111827!important;border-color:#334155!important}.digi-escuro .v8-etq-preview,.digi-escuro .v8-etq-grid{background:#0f172a!important;border-color:#334155!important}.digi-escuro .v8-etq-cell{border-color:#475569;color:#e5e7eb}.digi-escuro .v8-field,.digi-escuro .v8-theme-toggle{color:#cbd5e1}.digi-escuro .v8-field input,.digi-escuro .v8-field select{background:#0f172a;color:#e5e7eb;border-color:#475569}.digi-escuro #sidebar .bg-white,.digi-escuro #sidebar .bg-white\\/60,.digi-escuro #sidebar [class*="bg-white"],.digi-escuro #sidebar [class*="bg-slate-50"]{background:#111827!important;color:#e5e7eb!important;border-color:#334155!important}.digi-escuro #sidebar .text-slate-500,.digi-escuro #sidebar .text-slate-400{color:#94a3b8!important}'; document.head.appendChild(css);
new MutationObserver(limparEAplicar).observe(document.body,{childList:true,subtree:true}); setTimeout(limparEAplicar,500); setTimeout(limparEAplicar,1600);
setInterval(limparEAplicar,700);
})();
