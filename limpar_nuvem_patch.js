// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.74 — Forçar sincronização ativa
// • NUNCA desliga a sincronização automática
// • Remove bloqueios de modo leve/apresentação
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

console.log('[DIGICOPY] garante_sync_patch.js v4.9.74 carregado');

// FORÇA SINCRONIZAÇÃO AUTOMÁTICA LIGADA
try {
  localStorage.removeItem('digicopy_erp_autosync');
  localStorage.setItem('digicopy_erp_autosync', '1');
  localStorage.removeItem('digicopy_modo_leve');
  localStorage.removeItem('digicopy_modo_apresentacao');
} catch(e) {}

// Sobrescreve syncAutoLigado para SEMPRE retornar true
const _origSyncAutoLigado = window.syncAutoLigado;
if (typeof _origSyncAutoLigado === 'function') {
  window.syncAutoLigado = function() {
    try { localStorage.setItem('digicopy_erp_autosync', '1'); } catch(e) {}
    return true;
  };
}

// Sobrescreve syncAutoChecar para garantir que sync funciona
if (typeof window.syncAutoChecar === 'function') {
  const _origSyncAutoChecar = window.syncAutoChecar;
  window.syncAutoChecar = async function(motivo) {
    try { localStorage.setItem('digicopy_erp_autosync', '1'); } catch(e) {}
    return _origSyncAutoChecar.apply(this, arguments);
  };
}

console.log('[DIGICOPY] garante_sync_patch.js v4.9.74 — sincronização SEMPRE ativa');
})();
