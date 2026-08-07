// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.71 — Limpar nuvem, remover módulos dinâmicos e restaurar botão de sincronização
// 1. Remove módulos dinâmicos (modulosDinamicos) da nuvem
// 2. Envia base limpa para a nuvem
// 3. Restaura botão "Enviar para nuvem" nas Configurações
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const VERSAO = '4.9.71';
console.log('[DIGICOPY] limpar_nuvem_patch.js v' + VERSAO + ' carregado');

// ═══════════════════════════════════════════════════════════════════
// 1. LIMPAR MÓDULOS DINÂMICOS DA BASE LOCAL
// ═══════════════════════════════════════════════════════════════════
window.limparModulosDinamicos = function() {
  if (!db) return;
  const total = Object.keys(db.modulosDinamicos || {}).length;
  if (total === 0) {
    if (typeof toast === 'function') toast('Não há módulos dinâmicos para limpar', 'info');
    return;
  }
  if (!confirm(`Remover ${total} módulos dinâmicos da base local?\n\nIsso não afeta clientes, vendas ou contratos.`)) return;
  db.modulosDinamicos = {};
  if (typeof saveDB === 'function') saveDB();
  if (typeof buildNav === 'function') buildNav();
  if (typeof toast === 'function') toast(`${total} módulos dinâmicos removidos`, 'success');
};

// ═══════════════════════════════════════════════════════════════════
// 2. ENVIAR BASE LIMPA PARA A NUVEM (sem módulos dinâmicos)
// ═══════════════════════════════════════════════════════════════════
window.enviarBaseLimpaParaNuvem = async function() {
  if (!db) return;
  const dinamicos = Object.keys(db.modulosDinamicos || {}).length;
  const msg = dinamicos > 0
    ? `Enviar base para a nuvem?\n\n⚠️ ${dinamicos} módulos dinâmicos serão REMOVIDOS antes de enviar.\n\nOs outros PCs vão receber a base limpa.`
    : 'Enviar base para a nuvem?\n\nOs outros PCs vão receber estes dados.';
  
  if (!confirm(msg)) return;
  
  // Remove módulos dinâmicos antes de enviar
  const backup = db.modulosDinamicos;
  db.modulosDinamicos = {};
  
  try {
    if (typeof window.syncEnviarParaNuvem === 'function') {
      const r = await window.syncEnviarParaNuvem({ confirmar: false, forcar: true });
      if (r && r.ok) {
        if (typeof toast === 'function') toast('✅ Base limpa enviada para a nuvem! Os outros PCs vão atualizar automaticamente.', 'success');
      } else {
        if (typeof toast === 'function') toast('❌ Falha ao enviar para a nuvem', 'error');
        db.modulosDinamicos = backup; // Restaura se falhou
      }
    } else {
      if (typeof toast === 'function') toast('Função de sincronização não disponível', 'error');
      db.modulosDinamicos = backup;
    }
  } catch(e) {
    console.error('[LIMPAR_NUVEM] erro:', e);
    if (typeof toast === 'function') toast('Erro ao enviar: ' + (e.message || e), 'error');
    db.modulosDinamicos = backup;
  }
  
  if (typeof saveDB === 'function') saveDB();
  if (typeof buildNav === 'function') buildNav();
};

// ═══════════════════════════════════════════════════════════════════
// 3. RESTAURAR BOTÃO DE SINCRONIZAÇÃO NAS CONFIGURAÇÕES
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
          <button onclick="enviarBaseLimpaParaNuvem()" class="neo-btn danger">
            <i class="ph ph-broom"></i>Limpar módulos e enviar
          </button>
        </div>
        <div class="mt-3 text-[11px] text-slate-500">
          <b>Dica:</b> Se outros PCs estão vendo dados antigos, clique em "Limpar módulos e enviar" para forçar a base limpa.
        </div>
        <div id="cloud-sync-status" class="mt-3 text-[12px]"></div>
      `;
      grid.appendChild(card);
    }, 200);
  };
}

console.log('[DIGICOPY] limpar_nuvem_patch.js v' + VERSAO + ' — botões de sincronização restaurados');
})();
