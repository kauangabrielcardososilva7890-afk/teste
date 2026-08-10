// =============================================================================
// FIX: Produtos - Código automático sequencial + Estoque + Bloqueio de venda
// =============================================================================

// 1. GERADOR DE CÓDIGO AUTOMÁTICO - NÃO REUTILIZA CÓDIGOS EXCLUÍDOS
function getNextProdutoCode() {
  const produtos = db.produtos || [];
  
  // Pega todos os códigos existentes (só números)
  const codes = produtos
    .map(p => {
      const code = p.sku || p.codigo || '';
      const num = parseInt(code.replace(/\D/g, ''), 10);
      return isNaN(num) ? 0 : num;
    })
    .filter(c => c > 0);
  
  if (codes.length === 0) return '1';
  
  // Acha o maior código
  const maxCode = Math.max(...codes);
  return String(maxCode + 1);
}

// 2. BLOQUEIO DE VENDA COM PRODUTO SEM ESTOQUE
function checkProdutoEstoque(produto, quantidade) {
  if (!produto) return true;
  
  const estoque = parseFloat(produto.estoque || 0);
  const qtd = parseInt(quantidade || 1);
  
  if (estoque <= 0) {
    showModalAviso('Produto sem estoque');
    return false;
  }
  
  if (qtd > estoque) {
    showModalAviso(`Estoque insuficiente. Disponível: ${estoque}`);
    return false;
  }
  
  return true;
}

// 3. MODAL DE AVISO (igual ao do login)
function showModalAviso(msg) {
  const existing = document.getElementById('modal-aviso-global');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'modal-aviso-global';
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)';
  div.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px 32px;max-width:360px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
      <div style="width:48px;height:48px;border-radius:50%;background:#fee2e2;margin:0 auto 12px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:24px">⚠️</span>
      </div>
      <p style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 8px">${msg}</p>
      <button onclick="document.getElementById('modal-aviso-global').remove()" 
              style="margin-top:12px;height:40px;padding:0 24px;border-radius:10px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">
        OK
      </button>
    </div>
  `;
  document.body.appendChild(div);
}

// 4. OVERWRITE: renderModalProduto - Código readonly
const oldRenderModalProduto = window.renderModalProduto;
window.renderModalProduto = function(row, isEdit) {
  if (oldRenderModalProduto) {
    const html = oldRenderModalProduto.apply(this, arguments);
    
    // Deixa SKU readonly para novo produto
    const skuInputs = [
      document.getElementById('f-prd-sku'),
      document.getElementById('kp-prd-sku'),
      document.querySelector('input[name="sku"], input[id*="sku"]')
    ].filter(Boolean);
    
    skuInputs.forEach(input => {
      if (!isEdit) {
        input.readOnly = true;
        input.style.backgroundColor = '#f8fafc';
        input.style.cursor = 'not-allowed';
      }
    });
    
    return html;
  }
  
  // Se não tiver função original, não faz nada
};

// 5. OVERWRITE: saveProduto - Código automático + Estoque nunca negativo
const oldSaveProduto = window.saveProduto;
window.saveProduto = function(row, isEdit) {
  if (!isEdit && row) {
    // Código automático para novo produto
    row.sku = getNextProdutoCode();
    row.codigo = row.sku;
    
    // Estoque nunca negativo
    if (row.estoque !== undefined) {
      row.estoque = Math.max(0, parseFloat(row.estoque) || 0);
    }
  }
  
  if (oldSaveProduto) {
    return oldSaveProduto.apply(this, arguments);
  }
};

// 6. INTERCEPTA: cvAddItem (notinha_patch)
const oldCvAddItem = window.cvAddItem;
window.cvAddItem = function(produto, qtd, ...args) {
  if (!checkProdutoEstoque(produto, qtd)) {
    return;
  }
  
  if (oldCvAddItem) {
    return oldCvAddItem.apply(this, [produto, qtd, ...args]);
  }
};

// 7. INTERCEPTA: neoAddItemVenda (notinha_patch)
const oldNeoAddItemVenda = window.neoAddItemVenda;
window.neoAddItemVenda = function(produto, qtd, ...args) {
  if (!checkProdutoEstoque(produto, qtd)) {
    return;
  }
  
  if (oldNeoAddItemVenda) {
    return oldNeoAddItemVenda.apply(this, [produto, qtd, ...args]);
  }
};

// 8. INTERCEPTA: addItem (vendas_os_patch)
const oldAddItem = window.addItem;
window.addItem = function(produto, qtd, ...args) {
  if (!checkProdutoEstoque(produto, qtd)) {
    return;
  }
  
  if (oldAddItem) {
    return oldAddItem.apply(this, [produto, qtd, ...args]);
  }
};

// 9. INICIALIZA
console.log('[FIX] fix_produtos_final.js - Código automático + Estoque bloqueado + SKU readonly');
