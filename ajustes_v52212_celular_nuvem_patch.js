// ═══════════════════════════════════════════════════════════════════════════
// v5.22.12 — celular autoriza com código e puxa a nuvem
// • NF-e continua só no PC da loja (A1 local)
// • No celular: Nuvem abre em "Tenho um código", nome padrão Celular
// • Menu por toque. Sem emitir nota neste aparelho
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function ua(){ try{ return String(navigator.userAgent||''); }catch(e){ return ''; } }
function ehCelular(opt){
  const o=opt||{};
  if(o.capacitor===true || (typeof window!=='undefined' && window.Capacitor)) return true;
  const s=String(o.ua!=null?o.ua:ua());
  if(/Android|iPhone|iPad|iPod|Mobile/i.test(s)) return true;
  try{
    if(typeof window!=='undefined' && window.matchMedia && window.matchMedia('(pointer:coarse)').matches && (o.width||window.innerWidth)<900) return true;
  }catch(e){}
  return false;
}
function alerta(msg,tit){
  if(typeof window.lfbAlert==='function') window.lfbAlert(msg,tit||'Aviso');
  else if(typeof toast==='function') toast(msg,'info');
}

window.CELULAR_NUVEM_PURE={ ehCelular };

if(typeof document==='undefined') return;

window.DIGICOPY_EH_CELULAR=ehCelular;

function cssCelular(){
  if(document.getElementById('v52212-cel-css')) return;
  const s=document.createElement('style');
  s.id='v52212-cel-css';
  s.textContent='@media (max-width:900px){'+
    '.module-row{overflow-x:auto;overflow-y:hidden;flex-wrap:nowrap;-webkit-overflow-scrolling:touch}'+
    '.module-menu.v52212-open{opacity:1!important;visibility:visible!important;transform:none!important}'+
    '.neo-head{flex-direction:column;align-items:flex-start}'+
    '#modal-box{max-width:100%!important;border-radius:14px}'+
    '}'+
    'html.v52212-cel .module-row{height:auto;min-height:48px}';
  document.head.appendChild(s);
}

function menusToque(){
  document.querySelectorAll('.module').forEach(function(mod){
    const btn=mod.querySelector(':scope > button');
    const menu=mod.querySelector('.module-menu');
    if(!btn||!menu||btn.__v52212) return;
    btn.__v52212=true;
    btn.addEventListener('click',function(ev){
      if(!ehCelular()) return;
      if(!menu.querySelector('button')) return;
      ev.preventDefault();
      ev.stopPropagation();
      const aberto=menu.classList.contains('v52212-open');
      document.querySelectorAll('.module-menu.v52212-open').forEach(function(m){ m.classList.remove('v52212-open'); });
      if(!aberto) menu.classList.add('v52212-open');
    },true);
  });
  if(!document.__v52212fecha){
    document.__v52212fecha=true;
    document.addEventListener('click',function(){
      document.querySelectorAll('.module-menu.v52212-open').forEach(function(m){ m.classList.remove('v52212-open'); });
    });
  }
}

function esconderNfeCelular(){
  if(!ehCelular()) return;
  document.querySelectorAll('#btn-nfe-venda-lista,#btn-nfe-leitura-hist,#btn-nfe-previa-modal,[data-nfe-emit]').forEach(function(b){
    b.style.display='none';
  });
}

function bloquearNfe(){
  if(!ehCelular()) return;
  const orig=window.conferirNfe;
  if(typeof orig==='function' && !orig.__v52212cel){
    window.conferirNfe=async function(){
      alerta('NF-e só no computador da loja, o que tem o certificado A1. Neste celular não emite.','NF-e');
    };
    window.conferirNfe.__v52212cel=true;
  }
}

function prepararNuvemCelular(){
  if(!ehCelular()) return;
  const tab=document.getElementById('dc-tab-code');
  if(tab) tab.click();
  const name=document.getElementById('dc-name');
  if(name && !String(name.value||'').trim()) name.value='Celular';
  const h=document.querySelector('#dc-form h3');
  if(h) h.textContent='Autorizar este celular';
  const p=document.querySelector('#dc-form p');
  if(p) p.textContent='Cole o código gerado no computador administrador. Os dados da nuvem descem para cá. Nada sobe sozinho.';
}

const _abrir=window.abrirCloudflareNuvem;
if(typeof _abrir==='function' && !_abrir.__v52212){
  window.abrirCloudflareNuvem=async function(){
    const r=await _abrir.apply(this,arguments);
    setTimeout(function(){ try{ prepararNuvemCelular(); }catch(e){} },60);
    setTimeout(function(){ try{ prepararNuvemCelular(); }catch(e){} },220);
    return r;
  };
  window.abrirCloudflareNuvem.__v52212=true;
}

function ligar(){
  if(ehCelular()) document.documentElement.classList.add('v52212-cel');
  cssCelular();
  menusToque();
  bloquearNfe();
  esconderNfeCelular();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ligar);
else ligar();
setTimeout(ligar,600);

console.log('[DIGICOPY] v5.22.12 celular autoriza e puxa a nuvem');
})();
