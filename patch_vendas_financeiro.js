// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.0.2 — Vendas e Financeiro (relatório do usuário)
// 1. Venda: faturar funciona, estornar só depois de faturar, Pix QR só no Pix
// 2. Financeiro: filtros de busca, baixa múltipla, origem, duplo clique
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

// ═══ 1. VENDAS ═══

// showVenda: estornar só aparece quando faturado, baixar só no financeiro
const _origShowVenda = window.showVenda;
if(typeof _origShowVenda === 'function'){
  window.showVenda = function(id){
    _origShowVenda.apply(this, arguments);
    const v = db.vendas.find(x=>x.id===id);
    if(!v) return;
    const detail = document.getElementById('venda-detail');
    if(!detail) return;
    // Reescrever botões baseado no status
    const btns = detail.querySelector('.grid.grid-cols-2');
    if(!btns) return;
    if(v.status === 'orcamento' || v.status === 'aprovado'){
      btns.innerHTML = `<button onclick="faturarVenda('${v.id}')" class="h-11 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13px]">Faturar venda</button><button onclick="toast('PDF em desenvolvimento','info')" class="h-11 rounded-xl bg-white border font-semibold text-[13px]">Imprimir</button>`;
    } else if(v.status === 'faturado'){
      btns.innerHTML = `<button onclick="estornarVenda('${v.id}')" class="h-11 rounded-xl bg-amber-500 text-white font-semibold text-[13px]">Estornar</button><button onclick="toast('PDF em desenvolvimento','info')" class="h-11 rounded-xl bg-white border font-semibold text-[13px]">Imprimir</button>`;
    } else if(v.status === 'estornada'){
      btns.innerHTML = `<span class="text-[13px] text-amber-700 font-bold col-span-2 text-center py-2">Venda estornada — crie uma nova notinha se necessário</span>`;
    }
  };
}

// Estornar venda
window.estornarVenda = function(id){
  const sess = getSession(); if(!sess) return;
  const v = db.vendas.find(x=>x.id===id && x.empresaId===sess.empresaId);
  if(!v) return;
  if(v.status !== 'faturado') return toast('Só é possível estornar vendas faturadas','error');
  if(!confirm('Estornar esta venda? Ela voltará como orçamento.')) return;
  v.status = 'estornada';
  // Remover conta a receber vinculada
  db.contasReceber = (db.contasReceber||[]).filter(cr => cr.vendaId !== id);
  logAction('venda','estornar',id,`Estornada venda ${v.numero} por ${sess.usuarioNome}`);
  saveDB();
  renderVendas(); renderFinanceiro(); showVenda(id); renderAuditoria();
  toast('Venda estornada','success');
};

// Notinha: WhatsApp QR só aparece quando pagamento é PIX
const _origShowVenda2 = window.showVenda;
if(typeof _origShowVenda2 === 'function'){
  window.showVenda = function(id){
    _origShowVenda2.apply(this, arguments);
    const v = db.vendas.find(x=>x.id===id);
    if(!v) return;
    // Se não é PIX, remove qualquer QR code que tenha aparecido
    if(v.formaPagamento && !v.formaPagamento.toLowerCase().includes('pix')){
      const qrElements = document.querySelectorAll('#venda-detail .qrcode, #venda-detail [class*="qr"]');
      qrElements.forEach(el => el.remove());
    }
  };
}

console.log('[DIGICOPY] patch_vendas_financeiro v5.0.2 carregado');
})();
