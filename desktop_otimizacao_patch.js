// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.15 — Otimização para uso diário e futuro .exe
// • Debounce leve em renders pesados para evitar travar máquinas fracas
// • Mantém render imediato em modais e ações críticas
// • Reduz repetições de render quando várias partes salvam ao mesmo tempo
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function telaVisivel(fnName){
  const map = {
    renderClientes: 'view-clientes', renderProdutos: 'view-produtos', renderEquipamentos: 'view-impressoras',
    renderContratos: 'view-contratos', renderParque: 'view-parque', renderLeituras: 'view-leituras',
    renderOs: 'view-manutencao', renderVendas: 'view-vendas', renderFinanceiro: 'view-financeiro',
    renderAuditoria: 'view-auditoria', renderUsuarios: 'view-usuarios'
  };
  const id = map[fnName];
  if(!id) return true;
  const el = document.getElementById(id);
  return !el || !el.classList.contains('hidden');
}
function agendar(cb){
  if(typeof requestIdleCallback === 'function') return requestIdleCallback(cb, { timeout: 120 });
  return setTimeout(cb, 16);
}
function otimizarRender(nome){
  const original = window[nome];
  if(typeof original !== 'function' || original.__desktopOtimizado) return;
  let pendente = false;
  let ultArgs = null;
  const wrapped = function(){
    ultArgs = arguments;
    if(!telaVisivel(nome)) return undefined;
    if(pendente) return undefined;
    pendente = true;
    agendar(() => {
      pendente = false;
      if(!telaVisivel(nome)) return;
      try{ original.apply(this, ultArgs); }
      catch(err){ console.error('[DIGICOPY] erro em render otimizado', nome, err); }
    });
    return undefined;
  };
  wrapped.__desktopOtimizado = true;
  wrapped.__original = original;
  window[nome] = wrapped;
}

if(typeof window === 'undefined' || typeof document === 'undefined') return;

window.DESKTOP_OTIMIZACAO_PURE = { telaVisivel };

setTimeout(() => {
  ['renderClientes','renderProdutos','renderEquipamentos','renderContratos','renderParque','renderLeituras','renderOs','renderVendas','renderFinanceiro','renderAuditoria','renderUsuarios'].forEach(otimizarRender);
}, 500);

console.log('[DIGICOPY] desktop_otimizacao_patch.js v4.9.15 carregado');
})();
