// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.18.7 — aviso de canto (boas-vindas) + PDF puxa dados digitados
// • 5.1 — Aviso "Bem-vindo, Fulano!" no CANTO da tela (não é popup), some
//         sozinho depois de alguns segundos.
// • 3   — Ao imprimir o PDF do chamado, se houver dados digitados nas caixas
//         (motivo, serviços, observação, contador, modelo/patrimônio/serial/
//         local), eles são puxados automaticamente para o relatório — mesmo
//         que ainda não tenham sido salvos.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

// ─────────────────────────────────────────────────────────────────────────
// Aviso no canto (não-popup, não bloqueante)
// ─────────────────────────────────────────────────────────────────────────
window.lfbCornerToast = function(msg){
  try{
    if(typeof document === 'undefined' || !document.body) return;
    let box = document.getElementById('corner-toast-box');
    if(!box){
      box = document.createElement('div');
      box.id = 'corner-toast-box';
      box.style.cssText = 'position:fixed;top:16px;right:16px;z-index:999999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none;';
      document.body.appendChild(box);
    }
    const t = document.createElement('div');
    t.style.cssText = 'background:#0a1e8a;color:#fff;padding:12px 18px;border-radius:12px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.28);max-width:360px;line-height:1.4;opacity:0;transform:translateY(-10px);transition:opacity .25s ease,transform .25s ease;';
    t.textContent = msg;
    box.appendChild(t);
    requestAnimationFrame(function(){ t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(function(){
      t.style.opacity = '0';
      t.style.transform = 'translateY(-10px)';
      setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, 4000);
  }catch(e){}
};

// ─────────────────────────────────────────────────────────────────────────
// Lógica pura (testável)
// ─────────────────────────────────────────────────────────────────────────
function coletarFormChamado(o){
  const copy = Object.assign({}, o || {});
  function val(ids){
    for(let i = 0; i < ids.length; i++){
      const el = document.getElementById(ids[i]);
      if(el && el.value != null && String(el.value).trim() !== '') return String(el.value).trim();
    }
    return null;
  }
  const motivo = val(['kr-os-desc','ko-desc','ca-desc']);
  if(motivo != null) copy.descricao = motivo;
  const serv = val(['kr-os-serv','ko-serv','ca-serv']);
  if(serv != null) copy.servicos = serv;
  const obs = val(['kr-os-obs','ko-obs','ca-obs']);
  if(obs != null) copy.observacao = obs;
  const contAtu = val(['kr-os-cont-atu','ko-cont-atu','ca-cont-atu']);
  if(contAtu != null) copy.contadorAtual = contAtu;
  const modelo = val(['kr-os-modelo','ko-modelo','ca-modelo']);
  if(modelo != null) copy.modelo = modelo;
  const patr = val(['kr-os-patr','ko-patr','ca-patr']);
  if(patr != null) copy.patrimonio = patr;
  const serie = val(['kr-os-serie','ko-serie','ca-serie']);
  if(serie != null) copy.serie = serie;
  const local = val(['kr-os-local','ko-local','ca-local']);
  if(local != null) copy.local = local;
  return copy;
}

window.AJUSTES_V5187_PURE = { coletarFormChamado: coletarFormChamado };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

// ─────────────────────────────────────────────────────────────────────────
// Item 3 — PDF do chamado usa os dados digitados nas caixas (sem salvar)
// ─────────────────────────────────────────────────────────────────────────
const _imp = window.imprimirChamadoPDF;
if(typeof _imp === 'function'){
  window.imprimirChamadoPDF = function(osId){
    const arr = db.os || [];
    const idx = arr.findIndex(function(x){ return x.id === osId; });
    if(idx < 0) return _imp.apply(this, arguments);
    const original = arr[idx];
    // Troca temporariamente pelo objeto mesclado com o que está digitado no
    // formulário; restaura logo após (não altera o que está salvo).
    arr[idx] = coletarFormChamado(original);
    try{ return _imp.apply(this, arguments); }
    finally{ arr[idx] = original; }
  };
}

console.log('[DIGICOPY] ajustes_v5187_patch.js');
})();
