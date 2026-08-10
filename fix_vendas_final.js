// =============================================================================
// FIX: Vendas - Estornar só após faturar + PIX QR só no PIX + Valor 0 auto-baixa + Código sequencial
// =============================================================================

// 1. ESTORNAR SÓ DEPOIS DE FATURAR
function podeEstornar(venda) {
  if (!venda) return false;
  return (venda.faturado === true || venda.status === 'faturado');
}

// 2. WHATSAPP QR SÓ QUANDO PAGAMENTO É PIX
function mostrarWhatsAppQR(venda) {
  if (!venda) return false;
  return (venda.formaPagamento || '').toUpperCase().includes('PIX');
}

// 3. VALOR 0 BAIXA AUTOMATICAMENTE
function verificarValorZero(venda) {
  if (!venda) return;
  const valor = parseFloat(venda.valorTotal || venda.valor || 0);
  if (valor === 0) {
    venda.pago = true;
    venda.statusPagamento = 'Pago';
    venda.dataPagamento = new Date().toISOString();
    if (typeof saveDB === 'function') saveDB();
  }
}

// 4. GERADOR DE CÓDIGO DE VENDA (reinicia do 1)
function getNextVendaCode() {
  const vendas = db.vendas || [];
  const codes = vendas
    .map(v => {
      const code = v.codigo || v.numero || v.id || '';
      const num = parseInt(code.replace(/\D/g, ''), 10);
      return isNaN(num) ? 0 : num;
    })
    .filter(c => c > 0);
  
  if (codes.length === 0) return '1';
  const maxCode = Math.max(...codes);
  return String(maxCode + 1);
}

// 5. OVERWRITE: showVenda
const oldShowVenda = window.showVenda;
window.showVenda = function(venda, ...args) {
  if (oldShowVenda) {
    oldShowVenda.apply(this, arguments);
  }
  
  // Esconde botão estornar se não puder estornar
  const btnEstornar = document.getElementById('btn-estornar-venda') ||
                     document.querySelector('button[onclick*="estornarVenda"]');
  if (btnEstornar) {
    btnEstornar.style.display = podeEstornar(venda) ? '' : 'none';
  }
  
  // Esconde botão baixar se faturado
  const btnBaixar = document.querySelector('button[onclick*="baixarVenda"]');
  if (btnBaixar && podeEstornar(venda)) {
    btnBaixar.remove();
  }
  
  // Esconde botão editar se extornada
  if (venda.status === 'extornada' || venda.extornada === true) {
    const btnEditar = document.querySelector('button[onclick*="editarVenda"]');
    if (btnEditar) btnEditar.remove();
  }
  
  // WhatsApp QR só para PIX
  const qrSection = document.querySelector('#pix-qr-code, .whatsapp-qr-section');
  if (qrSection) {
    qrSection.style.display = mostrarWhatsAppQR(venda) ? '' : 'none';
  }
  
  // Verifica valor 0
  verificarValorZero(venda);
};

// 6. OVERWRITE: faturarVenda
const oldFaturarVenda = window.faturarVenda;
window.faturarVenda = function(vendaId, ...args) {
  const venda = db.vendas.find(v => v.id === vendaId);
  if (venda) {
    venda.faturado = true;
    venda.status = 'faturado';
    verificarValorZero(venda);
    if (typeof saveDB === 'function') saveDB();
    if (typeof renderVendas === 'function') renderVendas();
    if (typeof showVenda === 'function') showVenda(venda);
  }
  
  if (oldFaturarVenda) {
    oldFaturarVenda.apply(this, arguments);
  }
};

// 7. OVERWRITE: estornarVenda
const oldEstornarVenda = window.estornarVenda;
window.estornarVenda = function(vendaId, ...args) {
  const venda = db.vendas.find(v => v.id === vendaId);
  if (venda) {
    venda.status = 'extornada';
    venda.extornada = true;
    venda.dataExtorno = new Date().toISOString();
    if (typeof saveDB === 'function') saveDB();
    if (typeof renderVendas === 'function') renderVendas();
    toast('Venda extornada com sucesso!', 'info');
    closeModal();
    navigateTo('vendas');
  }
  
  if (oldEstornarVenda) {
    oldEstornarVenda.apply(this, arguments);
  }
};

// 8. OVERWRITE: novaVenda - Código automático
const oldNovaVenda = window.novaVenda;
window.novaVenda = function(...args) {
  const newVenda = { 
    id: `venda_${Date.now()}`, 
    codigo: getNextVendaCode(), 
    data: new Date().toISOString(),
    ...args[0] 
  };
  
  if (oldNovaVenda) {
    if (oldNovaVenda.length > 0) {
      oldNovaVenda.apply(this, [newVenda]);
    } else {
      oldNovaVenda.apply(this, arguments);
    }
  } else {
    db.vendas = db.vendas || [];
    db.vendas.unshift(newVenda);
    if (typeof saveDB === 'function') saveDB();
    if (typeof showVenda === 'function') showVenda(newVenda);
  }
};

// 9. INICIALIZA
console.log('[FIX] fix_vendas_final.js - Estornar, PIX QR, Valor 0, Código sequencial');
