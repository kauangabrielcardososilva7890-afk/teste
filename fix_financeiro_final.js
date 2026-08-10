// =============================================================================
// FIX: Financeiro - Filtros + Baixa múltipla + Origem + Duplo clique + Botão receber
// =============================================================================

// 1. FILTROS DE BUSCA
const FINANCEIRO_FILTERS = [
  { id: 'nome', label: 'Nome', placeholder: 'Pesquisar por nome do cliente' },
  { id: 'codVenda', label: 'Cód. Venda', placeholder: 'Código da venda' },
  { id: 'codCliente', label: 'Cód. Cliente', placeholder: 'Código do cliente' },
  { id: 'valor', label: 'Por Valor', placeholder: 'Valor' },
  { id: 'codLeitura', label: 'Cód. Leitura', placeholder: 'Código da leitura' }
];

// 2. ORIGENS POSSÍVEIS
const ORIGENS = {
  'venda': { label: 'Venda', icon: 'ph ph-shopping-cart-simple', route: 'vendas' },
  'chamado': { label: 'Chamado', icon: 'ph ph-wrench', route: 'chamados' },
  'leitura': { label: 'Leitura', icon: 'ph ph-speedometer', route: 'leituras' }
};

// 3. SALVAR ORIGEM NO FINANCEIRO
function setOrigemFinanceiro(item, origem, origemId) {
  if (!item) return;
  item.origem = origem;
  item.origemId = origemId;
}

// 4. IR ATÉ A ORIGEM
function goToOrigem(origem, id) {
  const route = ORIGENS[origem]?.route;
  if (route) {
    navigateTo(route);
    // Tenta abrir o item específico
    const funcName = `show${ORIGENS[origem].label}`;
    if (typeof window[funcName] === 'function') {
      const items = db[route] || [];
      const item = items.find(i => i.id === id);
      if (item) window[funcName](item);
    }
  }
}

// 5. OVERWRITE: renderFinanceiro
const oldRenderFinanceiro = window.renderFinanceiro;
window.renderFinanceiro = function() {
  if (oldRenderFinanceiro) {
    oldRenderFinanceiro.apply(this, arguments);
  }
  
  const view = document.getElementById('view-financeiro');
  if (!view) return;
  
  // Adiciona painel de filtros
  const filterPanel = document.createElement('div');
  filterPanel.className = 'neo-card mb-4';
  filterPanel.innerHTML = `
    <div class="neo-grid">
      <div class="space-y-2">
        <label class="neo-label">Filtros de busca</label>
        <div class="flex flex-wrap gap-2">
          ${FINANCEIRO_FILTERS.map(f => `
            <div class="flex-1 min-w-[180px]">
              <input id="fin-filter-${f.id}" placeholder="${f.placeholder}" 
                     class="neo-input w-full" 
                     onkeydown="if(event.key==='Enter') applyFinanceiroFilters()">
            </div>
          `).join('')}
          <button onclick="applyFinanceiroFilters()" class="neo-btn primary">
            <i class="ph ph-magnifying-glass"></i> Pesquisar
          </button>
          <button onclick="clearFinanceiroFilters()" class="neo-btn">
            <i class="ph ph-x"></i> Limpar
          </button>
        </div>
      </div>
    </div>
  `;
  
  const table = view.querySelector('.neo-table, table');
  if (table) table.before(filterPanel);
  
  // Adiciona coluna de origem
  const thead = view.querySelector('.neo-table thead, table thead');
  if (thead) {
    const headerRow = thead.querySelector('tr');
    if (headerRow) {
      const originTh = document.createElement('th');
      originTh.innerHTML = 'Origem';
      originTh.style = 'width:120px;';
      headerRow.appendChild(originTh);
    }
  }
  
  // Adiciona dados de origem nas linhas
  const tbody = view.querySelector('.neo-table tbody, table tbody');
  if (tbody) {
    tbody.querySelectorAll('tr').forEach(row => {
      const originTd = document.createElement('td');
      const itemId = row.dataset.itemId || row.id;
      const item = (db.contasReceber || []).find(c => c.id === itemId) || 
                   (db.contasPagar || []).find(c => c.id === itemId);
      
      if (item && item.origem) {
        const orig = ORIGENS[item.origem];
        if (orig) {
          originTd.innerHTML = `<span class="neo-status info" style="cursor:pointer" onclick="goToOrigem('${item.origem}', '${item.origemId}')"><i class="${orig.icon}"></i> ${orig.label}</span>`;
        } else {
          originTd.textContent = item.origem;
        }
      } else {
        originTd.textContent = '-';
      }
      originTd.style = 'width:120px;';
      row.appendChild(originTd);
    });
  }
  
  // Duplo clique para ir até a origem
  const rows = view.querySelectorAll('.neo-table tbody tr, table tbody tr');
  rows.forEach(row => {
    row.ondblclick = () => {
      const itemId = row.dataset.itemId || row.id;
      const item = (db.contasReceber || []).find(c => c.id === itemId) || 
                   (db.contasPagar || []).find(c => c.id === itemId);
      if (item && item.origem && item.origemId) {
        goToOrigem(item.origem, item.origemId);
      }
    };
  });
  
  // Adiciona botão de baixa múltipla
  const actions = view.querySelector('#financeiro-actions, .financeiro-actions');
  if (!actions) {
    const actionsDiv = document.createElement('div');
    actionsDiv.id = 'financeiro-actions';
    actionsDiv.className = 'flex gap-2 mt-4';
    actionsDiv.innerHTML = `
      <button onclick="baixaMultiplaFinanceiro()" class="neo-btn primary">
        <i class="ph ph-check-circle"></i> Baixa múltipla
      </button>
      <button onclick="toggleSelectAllFinanceiro()" class="neo-btn">
        <i class="ph ph-list-checks"></i> Selecionar todos
      </button>
    `;
    view.appendChild(actionsDiv);
  }
};

// 6. APLICAR FILTROS
function applyFinanceiroFilters() {
  const filters = {};
  FINANCEIRO_FILTERS.forEach(f => {
    const value = document.getElementById(`fin-filter-${f.id}`)?.value || '';
    if (value.trim()) filters[f.id] = value.trim();
  });
  renderFinanceiroFiltered(filters);
}

// 7. RENDERIZAR FINANCEIRO FILTRADO
function renderFinanceiroFiltered(filters) {
  let items = [...(db.contasReceber || []), ...(db.contasPagar || [])];
  
  if (filters.nome) {
    const nome = filters.nome.toLowerCase();
    items = items.filter(item => 
      (item.clienteNome || '').toLowerCase().includes(nome)
    );
  }
  
  if (filters.codVenda) {
    const cod = filters.codVenda;
    items = items.filter(item => 
      (item.vendaId || item.codVenda || '').toString().includes(cod)
    );
  }
  
  if (filters.codCliente) {
    const cod = filters.codCliente;
    items = items.filter(item => 
      (item.clienteId || item.codCliente || '').toString().includes(cod)
    );
  }
  
  if (filters.valor) {
    const valor = parseFloat(filters.valor);
    items = items.filter(item => 
      Math.abs(parseFloat(item.valor || 0) - valor) < 0.01
    );
  }
  
  if (filters.codLeitura) {
    const cod = filters.codLeitura;
    items = items.filter(item => 
      (item.leituraId || item.codLeitura || '').toString().includes(cod)
    );
  }
  
  renderFinanceiroItems(items);
}

// 8. LIMPAR FILTROS
function clearFinanceiroFilters() {
  FINANCEIRO_FILTERS.forEach(f => {
    const input = document.getElementById(`fin-filter-${f.id}`);
    if (input) input.value = '';
  });
  applyFinanceiroFilters();
}

// 9. BAIXA MÚLTIPLA
let selectedFinanceiroItems = [];

function toggleSelectFinanceiro(itemId, event) {
  if (event) event.stopPropagation();
  const idx = selectedFinanceiroItems.indexOf(itemId);
  if (idx >= 0) {
    selectedFinanceiroItems = selectedFinanceiroItems.filter(id => id !== itemId);
  } else {
    selectedFinanceiroItems.push(itemId);
  }
  updateFinanceiroSelection();
}

function toggleSelectAllFinanceiro() {
  const rows = document.querySelectorAll('#view-financeiro .neo-table tbody tr');
  if (selectedFinanceiroItems.length === rows.length) {
    selectedFinanceiroItems = [];
  } else {
    selectedFinanceiroItems = [];
    rows.forEach(row => {
      const itemId = row.dataset.itemId || row.id;
      if (itemId) selectedFinanceiroItems.push(itemId);
    });
  }
  updateFinanceiroSelection();
}

function updateFinanceiroSelection() {
  const rows = document.querySelectorAll('#view-financeiro .neo-table tbody tr');
  rows.forEach(row => {
    const itemId = row.dataset.itemId || row.id;
    if (selectedFinanceiroItems.includes(itemId)) {
      row.classList.add('neo-selected');
    } else {
      row.classList.remove('neo-selected');
    }
  });
}

function baixaMultiplaFinanceiro() {
  if (selectedFinanceiroItems.length === 0) {
    toast('Selecione pelo menos um item!', 'warning');
    return;
  }
  
  showConfirmModal(
    `Deseja dar baixa em ${selectedFinanceiroItems.length} item(ns)?`,
    () => {
      selectedFinanceiroItems.forEach(itemId => {
        const item = (db.contasReceber || []).find(c => c.id === itemId);
        if (item && !item.pago) {
          item.pago = true;
          item.status = 'Pago';
          item.dataPagamento = new Date().toISOString();
        }
      });
      if (typeof saveDB === 'function') saveDB();
      selectedFinanceiroItems = [];
      renderFinanceiro();
      toast(`${selectedFinanceiroItems.length} itens baixados!`, 'success');
    }
  );
}

// 10. MODAL DE CONFIRMAÇÃO
function showConfirmModal(msg, onConfirm) {
  const existing = document.getElementById('modal-confirm-global');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'modal-confirm-global';
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)';
  div.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px 32px;max-width:400px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
      <div style="width:48px;height:48px;border-radius:50%;background:#fef3c7;margin:0 auto 12px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:24px">❓</span>
      </div>
      <p style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 8px">${msg}</p>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
        <button onclick="document.getElementById('modal-confirm-global').remove()" 
                style="height:40px;padding:0 24px;border-radius:10px;background:#e5e7eb;color:#374151;border:none;font-size:13px;font-weight:700;cursor:pointer">
          Cancelar
        </button>
        <button onclick="document.getElementById('modal-confirm-global').remove(); onConfirm && onConfirm()" 
                style="height:40px;padding:0 24px;border-radius:10px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">
          Confirmar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

// 11. VALOR 0 AUTO-BAIXA
function checkValorZeroAutoBaixa() {
  (db.contasReceber || []).forEach(item => {
    const valor = parseFloat(item.valor || 0);
    if (valor === 0 && !item.pago) {
      item.pago = true;
      item.status = 'Pago';
      item.dataPagamento = new Date().toISOString();
    }
  });
  (db.contasPagar || []).forEach(item => {
    const valor = parseFloat(item.valor || 0);
    if (valor === 0 && !item.pago) {
      item.pago = true;
      item.status = 'Pago';
      item.dataPagamento = new Date().toISOString();
    }
  });
}

// 12. REMOVER BOTÃO PAGAR
function removeBotaoPagar() {
  const btnPagar = document.querySelector('#financeiro-actions button[onclick*="pagar"], button:contains("Pagar")');
  if (btnPagar) btnPagar.remove();
}

// 13. BOTÃO RECEBER SÓ QUANDO VISUALIZAR NOTINHA
const oldShowContaReceber = window.showContaReceber;
window.showContaReceber = function(item) {
  if (oldShowContaReceber) {
    oldShowContaReceber.apply(this, arguments);
  }
  
  // Adiciona botão receber
  const modalFooter = document.getElementById('modal-footer');
  if (modalFooter) {
    const btnReceber = document.createElement('button');
    btnReceber.className = 'neo-btn primary';
    btnReceber.innerHTML = '<i class="ph ph-check-circle"></i> Receber';
    btnReceber.onclick = () => {
      darBaixaContaReceber(item);
    };
    modalFooter.appendChild(btnReceber);
  }
};

function darBaixaContaReceber(item) {
  if (!item) return;
  
  // Abre modal com formas de pagamento
  showBaixaModal(item);
}

function showBaixaModal(item) {
  const modalBody = document.getElementById('modal-body');
  if (!modalBody) return;
  
  modalBody.innerHTML = `
    <div class="neo-card">
      <h3 class="neo-head" style="margin-bottom: 16px;">Dar baixa no recebimento</h3>
      <div class="space-y-4">
        <div>
          <label class="neo-label">Cliente: ${item.clienteNome || '-'}</label>
          <p class="text-[14px] font-semibold">R$ ${(item.valor || 0).toFixed(2)}</p>
        </div>
        <div>
          <label class="neo-label">Data do pagamento</label>
          <input type="date" id="baixa-data" class="neo-input" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div>
          <label class="neo-label">Forma de pagamento</label>
          <select id="baixa-forma-pagamento" class="neo-select">
            <option value="PIX">PIX</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão">Cartão</option>
            <option value="Boleto">Boleto</option>
            <option value="Transferência">Transferência</option>
          </select>
        </div>
        <button onclick="confirmarBaixa(${JSON.stringify(item.id)})" class="neo-btn primary w-full">
          <i class="ph ph-check"></i> Confirmar baixa
        </button>
      </div>
    </div>
  `;
}

function confirmarBaixa(itemId) {
  const data = document.getElementById('baixa-data')?.value;
  const forma = document.getElementById('baixa-forma-pagamento')?.value;
  
  const item = (db.contasReceber || []).find(c => c.id === itemId);
  if (item) {
    item.pago = true;
    item.status = 'Pago';
    item.dataPagamento = data ? new Date(data).toISOString() : new Date().toISOString();
    item.formaPagamento = forma;
    if (typeof saveDB === 'function') saveDB();
    closeModal();
    renderFinanceiro();
    toast('Baixa realizada com sucesso!', 'success');
  }
}

// 14. INICIALIZA
console.log('[FIX] fix_financeiro_final.js - Filtros, Baixa múltipla, Origem, Duplo clique, Botão receber');
