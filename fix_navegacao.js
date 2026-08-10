// =============================================================================
// FIX: Navegação - ESC e botões voltam aba anterior em TODAS as situações
// Fluxo: 4 (Chamado novo) → 3 (Chamados) → 2 (Contrato) → 1 (Lista de Contratos)
// =============================================================================

// Pilha de navegação global
const _navStack = [];

// Salva o estado atual antes de navegar
function pushNavState(viewId, tabId) {
  _navStack.push({ view: viewId, tab: tabId, timestamp: Date.now() });
  console.log('[NAV] Push:', viewId, tabId, _navStack.length);
}

// Volta uma aba/etapa
function voltarUmaAba() {
  if (_navStack.length === 0) {
    console.log('[NAV] Pilha vazia, nada para voltar');
    return false;
  }
  
  const current = _navStack[_navStack.length - 1];
  _navStack.pop();
  
  const previous = _navStack[_navStack.length - 1];
  if (previous) {
    console.log('[NAV] Voltando para:', previous.view, previous.tab);
    
    // Tenta clicar na aba anterior
    if (previous.tab) {
      const tabBtn = document.getElementById(previous.tab) ||
                     document.querySelector(`[id*="tab-"][data-tab="${previous.tab}"], button[data-tab="${previous.tab}"]`);
      if (tabBtn) {
        tabBtn.click();
        return true;
      }
    }
    
    // Se não achar a aba, volta para a view anterior
    if (previous.view) {
      const view = document.getElementById(previous.view);
      if (view) {
        navigateTo(previous.view.replace('view-', ''));
        return true;
      }
    }
  }
  
  // Se não tiver mais nada na pilha, fecha o modal
  const modal = document.getElementById('modal-root');
  if (modal && !modal.classList.contains('hidden')) {
    closeModal();
    return true;
  }
  
  return false;
}

// ESC global
function handleGlobalESC(e) {
  if (e.key !== 'Escape') return;
  
  e.preventDefault();
  e.stopImmediatePropagation();
  
  const modal = document.getElementById('modal-root');
  if (modal && !modal.classList.contains('hidden')) {
    const voltou = voltarUmaAba();
    if (!voltou) {
      closeModal();
    }
  }
}

// Overwrite de funções que abrem modais para salvar estado
const oldOpenModal = window.openModal;
window.openModal = function(name, data, options) {
  // Salva o estado atual antes de abrir modal
  const currentView = document.querySelector('.view:not(.hidden)')?.id || '';
  const currentTab = document.querySelector('.neo-tab.active, [id*="tab-"].active, button.active')?.id || '';
  pushNavState(currentView, currentTab);
  
  if (oldOpenModal) {
    return oldOpenModal.apply(this, arguments);
  }
  
  // Implementação padrão
  const modal = document.getElementById('modal-root');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('modal-title').textContent = name || 'Modal';
    document.getElementById('modal-body').innerHTML = '';
    if (typeof window[`renderModal${name}`] === 'function') {
      window[`renderModal${name}`](data);
    }
  }
};

// Overwrite de navigateTo para salvar estado
const oldNavigateTo = window.navigateTo;
window.navigateTo = function(viewName, ...args) {
  const currentView = document.querySelector('.view:not(.hidden)')?.id || '';
  pushNavState(currentView, '');
  
  if (oldNavigateTo) {
    return oldNavigateTo.apply(this, arguments);
  }
  
  // Implementação padrão
  const views = document.querySelectorAll('.view');
  views.forEach(v => v.classList.add('hidden'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');
};

// Overwrite de closeModal para limpar pilha quando fechar completamente
const oldCloseModal = window.closeModal;
window.closeModal = function() {
  // Quando fecha o modal, limpa a pilha
  _navStack.length = 0;
  
  if (oldCloseModal) {
    oldCloseModal.apply(this, arguments);
  } else {
    const modal = document.getElementById('modal-root');
    if (modal) modal.classList.add('hidden');
  }
};

// Overwrite de funções específicas para salvar estado
['mudarAbaProduto', 'mudarAbaContrato', 'mudarAbaChamado', 'vosSetAba']
  .forEach(funcName => {
    const oldFunc = window[funcName];
    window[funcName] = function(abaName, ...args) {
      const currentView = document.querySelector('.view:not(.hidden)')?.id || '';
      pushNavState(currentView, `tab-${abaName}`);
      
      if (oldFunc) {
        return oldFunc.apply(this, arguments);
      }
    };
  });

// Overwrite de botões de fechar para usar a pilha
function setupCloseButtons() {
  const closeButtons = document.querySelectorAll(
    'button[onclick*="closeModal"], button[onclick*="fechar"], button[onclick*="sair"], button[onclick*="voltar"], button[onclick*="cancelar"]'
  );
  
  closeButtons.forEach(btn => {
    const originalOnClick = btn.onclick;
    btn.onclick = function(e) {
      const voltou = voltarUmaAba();
      if (!voltou && originalOnClick) {
        originalOnClick.apply(this, arguments);
      }
    };
  });
}

// Inicializa
document.addEventListener('keydown', handleGlobalESC);
if (document.readyState !== 'loading') {
  setupCloseButtons();
} else {
  document.addEventListener('DOMContentLoaded', setupCloseButtons);
}

// Adiciona observer para detectar novos botões
const observer = new MutationObserver((mutations) => {
  setupCloseButtons();
});
observer.observe(document.body, { childList: true, subtree: true });

console.log('[FIX] fix_navegacao.js - ESC e botões voltam aba anterior em TODAS as situações');
