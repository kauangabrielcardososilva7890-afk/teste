// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.72 — Garantir sincronização ativa e botão Enviar para nuvem
// • NUNCA desliga a sincronização automática
// • Garante que o botão "Enviar para nuvem" aparece nas Configurações
// • Dados do .exe vão para a nuvem automaticamente
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const VERSAO = '4.9.72';
console.log('[DIGICOPY] garante_sync_patch.js v' + VERSAO + ' carregado');

// ═══════════════════════════════════════════════════════════════════
// 1. FORÇA SINCRONIZAÇÃO AUTOMÁTICA LIGADA
// ═══════════════════════════════════════════════════════════════════
// Remove qualquer bloqueio de sincronização que patches anteriores possam ter colocado
try {
  localStorage.removeItem('digicopy_erp_autosync'); // Remove o '0' que desligava
  localStorage.setItem('digicopy_erp_autosync', '1'); // Força LIGADO
  localStorage.removeItem('digicopy_modo_leve'); // Remove modo leve
  localStorage.removeItem('digicopy_modo_apresentacao'); // Remove modo apresentação
} catch(e) {}

// Garante que syncAutoLigado retorna true
const _origSyncAutoLigado = window.syncAutoLigado;
if (typeof _origSyncAutoLigado === 'function') {
  window.syncAutoLigado = function() {
    try { localStorage.setItem('digicopy_erp_autosync', '1'); } catch(e) {}
    return true; // SEMPRE ligado
  };
}

// ═══════════════════════════════════════════════════════════════════
// 2. ADICIONA BOTÃO "ENVIAR PARA NUVEM" NAS CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════════
const _origRenderConfig = window.renderConfig;
if (typeof _origRenderConfig === 'function') {
  window.renderConfig = function() {
    _origRenderConfig.apply(this, arguments);
    setTimeout(() => {
      const grid = document.querySelector('#view-config .grid') || document.getElementById('view-config');
      if (!grid || document.getElementById('nuvem-sync-card')) return;
      
      const card = document.createElement('div');
      card.id = 'nuvem-sync-card';
      card.className = 'rounded-[16px] bg-white border p-6 lg:col-span-3';
      card.innerHTML = `
        <h4 class="font-bold text-[15px]"><i class="ph ph-cloud text-[#0a1e8a]"></i> Sincronização com a Nuvem</h4>
        <p class="text-[12px] text-slate-500 mt-1">Envie os dados deste PC para a nuvem (Google Firebase). Os outros PCs recebem automaticamente.</p>
        <div class="flex flex-wrap gap-2 mt-4">
          <button onclick="enviarDadosLocaisParaNuvem()" class="neo-btn primary">
            <i class="ph ph-cloud-arrow-up"></i>Enviar para nuvem
          </button>
          <button onclick="carregarDadosDaNuvem()" class="neo-btn">
            <i class="ph ph-cloud-arrow-down"></i>Carregar da nuvem
          </button>
        </div>
        <div class="mt-3 text-[11px] text-slate-500">
          <b>Como funciona:</b> Clique em "Enviar para nuvem" neste PC. Nos outros PCs, os dados aparecem automaticamente após alguns segundos.
        </div>
        <div id="cloud-sync-status" class="mt-3 text-[12px]"></div>
      `;
      grid.appendChild(card);
    }, 200);
  };
}

// ═══════════════════════════════════════════════════════════════════
// 3. AUTO-SYNC MAIS RÁPIDO (a cada 30 segundos em vez de 75)
// ═══════════════════════════════════════════════════════════════════
// Sobrescreve o intervalo do auto-sync para ser mais rápido
if (typeof window.syncAutoChecar === 'function') {
  // Limpa intervalos antigos e cria um novo mais rápido
  const _origSyncAutoChecar = window.syncAutoChecar;
  window.syncAutoChecar = async function(motivo) {
    try { localStorage.setItem('digicopy_erp_autosync', '1'); } catch(e) {}
    return _origSyncAutoChecar.apply(this, arguments);
  };
  
  // Cria novo intervalo de 30 segundos
  setInterval(() => {
    try {
      localStorage.setItem('digicopy_erp_autosync', '1');
      window.syncAutoChecar('timer_rapido');
    } catch(e) {}
  }, 30000);
}

console.log('[DIGICOPY] garante_sync_patch.js v' + VERSAO + ' — sincronização SEMPRE ativa, botão Enviar para nuvem adicionado');
})();
