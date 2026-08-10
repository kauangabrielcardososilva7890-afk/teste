// =============================================================================
// FIX: Etiquetas - Layout 7x18 A4
// =============================================================================

// CONFIGURAÇÃO 7x18 PARA FOLHA A4 (210mm x 297mm)
const ETIQUETAS_CONFIG = {
  cols: 7,
  rows: 18,
  pageWidth: 210,    // mm A4
  pageHeight: 297,   // mm A4
  margin: 5,        // mm
  gap: 1,          // mm entre etiquetas
  labelWidth: 27,   // mm (210 / 7 - gap)
  labelHeight: 15.5 // mm (297 / 18 - gap)
};

// CALCULA QUANTIDADE QUE CABE PERFEITAMENTE
function calcEtiquetasPerPage(qtdDesejada) {
  const total = ETIQUETAS_CONFIG.cols * ETIQUETAS_CONFIG.rows;
  
  if (qtdDesejada <= total) {
    return qtdDesejada;
  }
  
  const fullRows = Math.floor(qtdDesejada / ETIQUETAS_CONFIG.cols);
  const remainder = qtdDesejada % ETIQUETAS_CONFIG.cols;
  
  return fullRows * ETIQUETAS_CONFIG.cols + (remainder > 0 ? remainder : 0);
}

// OVERWRITE: printEtiquetas
const oldPrintEtiquetas = window.printEtiquetas;
window.printEtiquetas = function(produto, quantidade, ...args) {
  const qtdReal = calcEtiquetasPerPage(quantidade);
  
  if (qtdReal === 0) {
    toast('Informe uma quantidade válida!', 'warning');
    return;
  }
  
  if (oldPrintEtiquetas) {
    return oldPrintEtiquetas.apply(this, [produto, qtdReal, ...args]);
  }
  
  const html = generateEtiquetasHTML(produto, qtdReal);
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
};

// GERAR HTML DAS ETIQUETAS 7x18
function generateEtiquetasHTML(produto, qtd) {
  const cols = ETIQUETAS_CONFIG.cols;
  const rows = Math.ceil(qtd / cols);
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Etiquetas - ${produto.descricao || produto.nome || 'Produto'}</title>
      <style>
        body { margin: 0; padding: ${ETIQUETAS_CONFIG.margin}mm; background: white; }
        .page { width: ${ETIQUETAS_CONFIG.pageWidth}mm; height: ${ETIQUETAS_CONFIG.pageHeight}mm; page-break-after: always; }
        .etiqueta { 
          width: ${ETIQUETAS_CONFIG.labelWidth}mm; 
          height: ${ETIQUETAS_CONFIG.labelHeight}mm; 
          margin: ${ETIQUETAS_CONFIG.gap/2}mm; 
          float: left; 
          border: 0.1mm solid #ccc; 
          box-sizing: border-box; 
          font-family: Arial, sans-serif; 
          font-size: 8px; 
          padding: 1mm; 
          overflow: hidden; 
          text-overflow: ellipsis;
        }
        .etiqueta-row { clear: both; }
        @media print {
          .etiqueta { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="page">
  `;
  
  for (let i = 0; i < rows; i++) {
    html += '<div class="etiqueta-row">';
    for (let j = 0; j < cols; j++) {
      const index = i * cols + j;
      if (index < qtd) {
        const desc = (produto.descricao || produto.nome || '').substring(0, 25);
        const cod = produto.sku || produto.codigo || '';
        const preco = (produto.preco || 0).toFixed(2);
        
        html += `
          <div class="etiqueta">
            <div style="font-weight: bold; font-size: 9px;">${desc}</div>
            <div style="margin-top: 1mm;">Cód: ${cod}</div>
            <div style="margin-top: 1mm;">R$ ${preco}</div>
          </div>
        `;
      }
    }
    html += '</div>';
  }
  
  html += '</div></body></html>';
  return html;
}

// OVERWRITE: cartuchosEtiquetasConfig (se existir)
const oldCartuchosEtiquetasConfig = window.cartuchosEtiquetasConfig;
window.cartuchosEtiquetasConfig = function() {
  if (oldCartuchosEtiquetasConfig) {
    const result = oldCartuchosEtiquetasConfig.apply(this, arguments);
    // Força config 7x18
    result.cols = ETIQUETAS_CONFIG.cols;
    result.rows = ETIQUETAS_CONFIG.rows;
    return result;
  }
  return ETIQUETAS_CONFIG;
};

console.log('[FIX] fix_etiquetas_final.js - Layout 7x18 A4');
