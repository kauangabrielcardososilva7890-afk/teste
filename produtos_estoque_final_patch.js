// Ajustes finais de Produtos e Estoque — carregado por último para não ser sobrescrito.
(function () {
  'use strict';

  const numberOf = value => {
    const match = String(value ?? '').match(/\d+/g);
    return match ? Number(match[match.length - 1]) || 0 : 0;
  };
  const save = () => { try { if (typeof saveDB === 'function') saveDB(); else if (typeof saveSafe === 'function') saveSafe(); } catch (_) {} };
  const alertSystem = (message, title) => {
    if (typeof window.lfbAlert === 'function') return window.lfbAlert(message, title);
    alert(message);
  };
  const session = () => typeof getSession === 'function' ? getSession() : null;
  const stockControlled = product => !/servi[cç]o|recarga/i.test(String(product?.categoria || product?.tipo || ''));

  // Uma única migração: enumera os produtos atuais de 1 em diante e grava o próximo
  // número em separado. Assim, apagar um produto nunca reutiliza o seu código.
  function normalizeProductCodes(companyId) {
    if (!companyId || !window.db) return;
    db._productCodeMigration = db._productCodeMigration || {};
    db._seq = db._seq || {};
    db._seq.produto = db._seq.produto || {};
    const key = companyId;
    const products = (db.produtos || []).filter(p => p.empresaId === companyId && p.status !== 'excluido');

    if (!db._productCodeMigration[key]) {
      products.sort((a, b) => {
        const byDate = new Date(a.criadoEm || 0) - new Date(b.criadoEm || 0);
        return byDate || String(a.id || '').localeCompare(String(b.id || ''));
      }).forEach((p, index) => {
        const code = String(index + 1);
        p.sku = code;
        p.codigo = code;
      });
      db._productCodeMigration[key] = true;
      db._seq.produto[key] = products.length + 1;
      save();
      return;
    }

    const max = products.reduce((highest, p) => Math.max(highest, numberOf(p.sku || p.codigo)), 0);
    const next = Number(db._seq.produto[key]) || 0;
    // Never lower a valid sequence: this is what prevents reuse after deletion.
    if (next <= max) {
      db._seq.produto[key] = max + 1;
      save();
    }
  }

  function validateProduct(product, quantity) {
    if (!product || !stockControlled(product)) return true;
    const available = Math.max(0, Number(product.estoque) || 0);
    if (available <= 0) {
      alertSystem('Este produto está sem estoque.', 'Produto sem estoque');
      return false;
    }
    if ((Number(quantity) || 1) > available) {
      alertSystem(`Estoque insuficiente. Disponível: ${available}`, 'Estoque insuficiente');
      return false;
    }
    return true;
  }

  function validateItems(items) {
    const quantities = {};
    (items || []).forEach(item => quantities[item.produtoId] = (quantities[item.produtoId] || 0) + (Number(item.qtd) || 0));
    for (const id of Object.keys(quantities)) {
      const product = (db.produtos || []).find(p => p.id === id);
      if (!validateProduct(product, quantities[id])) return false;
    }
    return true;
  }

  function wrap(name, productGetter, quantityGetter) {
    const original = window[name];
    if (typeof original !== 'function' || original.__stockGuard) return;
    const guarded = function () {
      if (!validateProduct(productGetter(), quantityGetter())) return;
      return original.apply(this, arguments);
    };
    guarded.__stockGuard = true;
    window[name] = guarded;
  }
  function wrapSave(name, itemsGetter) {
    const original = window[name];
    if (typeof original !== 'function' || original.__stockSaveGuard) return;
    const guarded = function () {
      if (!validateItems(itemsGetter())) return;
      return original.apply(this, arguments);
    };
    guarded.__stockSaveGuard = true;
    window[name] = guarded;
  }

  function applyGuards() {
    wrap('neoAddItemVenda', () => window.neoVendaProduto, () => document.getElementById('neo-prod-qtd')?.value);
    wrap('cvAddItem', () => window.cvProduto, () => document.getElementById('cv-qtd')?.value);
    wrap('addItemVendaTemp', () => window.produtoSelecionadoVenda, () => document.getElementById('v-qtd')?.value);
    wrapSave('neoSalvarVenda', () => window.neoVendaItens);
    wrapSave('cvSaveVenda', () => window.cvItens);
    wrapSave('saveVendaNova', () => window.itensTemp);
  }

  // Adds a reliable double-click route even if a legacy product renderer is used.
  document.addEventListener('dblclick', event => {
    const row = event.target.closest('#view-produtos tbody tr[data-produto-id]');
    if (!row) return;
    const id = row.dataset.produtoId;
    if (id && typeof openModal === 'function') openModal('produto', id);
  });

  const originalRender = window.renderProdutos;
  if (typeof originalRender === 'function' && !originalRender.__productSequenceGuard) {
    const guardedRender = function () {
      const s = session();
      if (s) normalizeProductCodes(s.empresaId);
      return originalRender.apply(this, arguments);
    };
    guardedRender.__productSequenceGuard = true;
    window.renderProdutos = guardedRender;
  }
  const originalProductModal = window.renderModalProduto;
  if (typeof originalProductModal === 'function' && !originalProductModal.__productSequenceGuard) {
    const guardedProductModal = function () {
      const s = session();
      if (s) normalizeProductCodes(s.empresaId);
      return originalProductModal.apply(this, arguments);
    };
    guardedProductModal.__productSequenceGuard = true;
    window.renderModalProduto = guardedProductModal;
  }

  // The sale implementations are created by earlier patches; wait one tick then wrap them.
  setTimeout(() => {
    const s = session();
    if (s) normalizeProductCodes(s.empresaId);
    applyGuards();
  }, 0);
  document.addEventListener('click', () => applyGuards(), true);
})();
