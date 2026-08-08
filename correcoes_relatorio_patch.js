// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.84 — Correções do relatório do usuário
// 1. Impressoras de locação NÃO aparecem no menu Produtos
// 2. Aviso ao sair de venda em andamento (salvar ou descartar)
// 3. Rodapé de impressão sem repetir dados da empresa
// 4. Chamados com faixas visuais destacadas por seção
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const VERSAO = '4.9.70';
console.log('[DIGICOPY] correcoes_relatorio_patch.js v' + VERSAO + ' carregado');

// ═══════════════════════════════════════════════════════════════════
// 1. FILTRO: impressoras de locação NÃO vão para Produtos
// ═══════════════════════════════════════════════════════════════════
function ehImpressoraLocacao(produto, dbRef) {
  if (!produto || !dbRef) return false;
  const nome = String(produto.nome || '').toLowerCase();
  const cat = String(produto.categoria || '').toLowerCase();
  const sku = String(produto.sku || '').toUpperCase();
  // Se está no parque (locado), não aparece em Produtos
  const noParque = (dbRef.parque || []).some(p =>
    p.equipamentoId === produto.id ||
    (dbRef.equipamentos || []).some(e => e.id === p.equipamentoId && (e.modelo || '').toLowerCase() === nome)
  );
  if (noParque) return true;
  // Se tem patrimônio/serial e está como locado
  if (cat.includes('impressora') && produto.status === 'locado') return true;
  if (sku.startsWith('IMP-') && (dbRef.equipamentos || []).some(e =>
    String(e.modelo || '').toLowerCase().includes(nome.substring(0, 15)))) return true;
  return false;
}

// Intercepta renderProdutos para filtrar impressoras de locação
const _origRenderProdutos = window.renderProdutos;
if (typeof _origRenderProdutos === 'function') {
  window.renderProdutos = function() {
    _origRenderProdutos.apply(this, arguments);
    // Após renderizar, esconde linhas de impressoras de locação
    const sess = typeof getSession === 'function' ? getSession() : null;
    if (!sess) return;
    const tbody = document.getElementById('tbody-produtos');
    if (!tbody) return;
    const produtosVisiveis = (db.produtos || []).filter(p =>
      p.empresaId === sess.empresaId && !ehImpressoraLocacao(p, db)
    );
    // Se o filtro removeu itens, re-renderiza com a lista filtrada
    const totalOriginal = (db.produtos || []).filter(p => p.empresaId === sess.empresaId).length;
    if (produtosVisiveis.length < totalOriginal) {
      const search = (document.getElementById('search-produtos')?.value || '').toLowerCase();
      const cat = document.getElementById('filter-prod-cat')?.value || '';
      let list = produtosVisiveis.filter(p =>
        (!search || p.nome.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)) &&
        (!cat || p.categoria === cat)
      );
      const isLow = p => p.estoque <= p.estoqueMin;
      tbody.innerHTML = list.slice(0, 300).map(p =>
        `<tr class="hover:bg-slate-50 ${isLow(p) ? 'bg-red-50/40' : ''}">
          <td class="px-5 py-3"><div><p class="font-mono text-[11px] text-slate-500">${p.sku}</p><p class="font-semibold text-[13px]">${p.nome}</p><p class="text-[11px] text-slate-500">${p.fabricante}</p></div></td>
          <td class="px-5 py-3"><span class="px-2 py-1 rounded-full bg-slate-100 text-[11px] font-semibold">${p.categoria}</span></td>
          <td class="px-5 py-3"><p class="font-bold ${isLow(p) ? 'text-red-600' : ''}">${p.estoque} un</p><p class="text-[11px] text-slate-500">mín ${p.estoqueMin}</p></td>
          <td class="px-5 py-3"><p class="text-[12px]">${typeof fmtMoney === 'function' ? fmtMoney(p.custo) : p.custo} → <b>${typeof fmtMoney === 'function' ? fmtMoney(p.preco) : p.preco}</b></p></td>
          <td class="px-5 py-3"><span class="font-mono text-[11px] px-2 py-1 rounded bg-slate-100 border">${p.local || '-'}</span></td>
          <td class="px-5 py-3"><div class="flex gap-1"><button onclick="openModal('produto','${p.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button><button onclick="deleteProduto('${p.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></div></td>
        </tr>`
      ).join('') || '<tr><td colspan="6" class="px-5 py-16 text-center text-slate-500">Nenhum produto (impressoras de locação ficam no contrato)</td></tr>';
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
// 2. AVISO AO SAIR DE VENDA EM ANDAMENTO
// ═══════════════════════════════════════════════════════════════════
let _vendaEmAndamento = false;
let _vendaDadosTemp = null;

// Marca quando uma venda está sendo editada
const _origNovaVenda = window.novaVenda;
if (typeof _origNovaVenda === 'function') {
  window.novaVenda = function() {
    _vendaEmAndamento = true;
    _vendaDadosTemp = null;
    _origNovaVenda.apply(this, arguments);
  };
}

// Intercepta closeModal para perguntar sobre venda em andamento
const _origCloseModal = window.closeModal;
window.closeModal = function(force) {
  if (force === true) {
    _vendaEmAndamento = false;
    _vendaDadosTemp = null;
    if (_origCloseModal) return _origCloseModal.apply(this, arguments);
    document.getElementById('modal-root')?.classList.add('hidden');
    return;
  }
  // Se tem venda em andamento com itens, pergunta
  if (_vendaEmAndamento && window.itensTemp && window.itensTemp.length > 0) {
    const resp = confirm('Deseja SALVAR a notinha antes de sair?\n\nOK = Salvar\nCancelar = Sair sem salvar');
    if (resp) {
      // Tenta salvar
      if (typeof window.saveVenda === 'function') {
        try { window.saveVenda(); } catch(e) { console.warn('[CORRECAO] erro ao salvar venda:', e); }
      }
    }
    _vendaEmAndamento = false;
    _vendaDadosTemp = null;
  }
  if (_origCloseModal) return _origCloseModal.apply(this, arguments);
  document.getElementById('modal-root')?.classList.add('hidden');
};

// Intercepta ESC para o mesmo aviso
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && _vendaEmAndamento && window.itensTemp && window.itensTemp.length > 0) {
    e.preventDefault();
    e.stopPropagation();
    const resp = confirm('Deseja SALVAR a notinha antes de sair?\n\nOK = Salvar\nCancelar = Sair sem salvar');
    if (resp) {
      if (typeof window.saveVenda === 'function') {
        try { window.saveVenda(); } catch(e2) { console.warn('[CORRECAO] erro ao salvar venda:', e2); }
      }
    }
    _vendaEmAndamento = false;
    _vendaDadosTemp = null;
    closeModal(true);
  }
}, true);

// Quando venda é salva/faturada, limpa flag
const _origSaveVenda = window.saveVenda;
if (typeof _origSaveVenda === 'function') {
  const _saveVendaWrapped = function() {
    _vendaEmAndamento = false;
    _vendaDadosTemp = null;
    return _origSaveVenda.apply(this, arguments);
  };
  window.saveVenda = _saveVendaWrapped;
}

// ═══════════════════════════════════════════════════════════════════
// 3. RODAPÉ DE IMPRESSÃO SEM REPETIR DADOS DA EMPRESA
// ═══════════════════════════════════════════════════════════════════
// Intercepta janelas de impressão para limpar rodapé duplicado
window.corrigirRodapeImpressao = function(win) {
  if (!win || !win.document) return;
  try {
    const doc = win.document;
    // Procura rodapés repetidos
    const rodapes = doc.querySelectorAll('.rodape-loja, .footer-loja, #rodape-empresa, .audit-rodape');
    const vistos = new Set();
    rodapes.forEach(el => {
      const texto = (el.textContent || '').trim().substring(0, 80);
      if (vistos.has(texto)) {
        el.remove(); // Remove duplicata
      } else {
        vistos.add(texto);
      }
    });
    // Remove CNPJ duplicado no rodapé
    const todosElementos = doc.querySelectorAll('*');
    const cnpjVistos = new Set();
    todosElementos.forEach(el => {
      if (el.children.length === 0) { // folha
        const txt = (el.textContent || '').trim();
        if (/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(txt) && txt.length < 60) {
          if (cnpjVistos.has(txt)) {
            el.parentElement?.remove();
          } else {
            cnpjVistos.add(txt);
          }
        }
      }
    });
  } catch(e) { /* silencioso */ }
};

// Intercepta window.open para corrigir rodapé em janelas de impressão
const _origWindowOpen = window.open;
window.open = function(url, name, features) {
  const win = _origWindowOpen.apply(this, arguments);
  if (win && features && features.includes('print')) {
    setTimeout(() => window.corrigirRodapeImpressao(win), 500);
  }
  return win;
};

// ═══════════════════════════════════════════════════════════════════
// 4. CHAMADOS COM FAIXAS VISUAIS DESTACADAS POR SEÇÃO
// ═══════════════════════════════════════════════════════════════════
window.estilizarSecoesChamado = function(container) {
  if (!container) return;
  // Procura labels/títulos de seção do chamado
  const secoes = [
    { texto: /motivo|defeito/i, cor: '#fef3c7', borda: '#f59e0b', icone: 'ph-warning-circle' },
    { texto: /serviço|executado/i, cor: '#dbeafe', borda: '#3b82f6', icone: 'ph-wrench' },
    { texto: /observa/i, cor: '#f3e8ff', borda: '#a855f7', icone: 'ph-chat-text' },
    { texto: /contador/i, cor: '#ecfdf5', borda: '#10b981', icone: 'ph-speedometer' },
    { texto: /item|peça/i, cor: '#fce7f3', borda: '#ec4899', icone: 'ph-package' }
  ];
  const labels = container.querySelectorAll('label, h4, h5, .neo-label, legend, .text-slate-500');
  labels.forEach(label => {
    const txt = (label.textContent || '').trim();
    for (const secao of secoes) {
      if (secao.texto.test(txt)) {
        // Encontra o container pai mais próximo
        let parent = label.closest('.space-y-4, .space-y-3, .rounded-xl, .neo-card, fieldset, .grid');
        if (!parent) parent = label.parentElement;
        if (parent && !parent.dataset.secaoEstilizada) {
          parent.dataset.secaoEstilizada = '1';
          parent.style.borderLeft = `4px solid ${secao.borda}`;
          parent.style.background = secao.cor;
          parent.style.borderRadius = '8px';
          parent.style.padding = '12px';
          parent.style.marginBottom = '8px';
        }
        break;
      }
    }
  });
};

// Intercepta renderOS para aplicar faixas
const _origRenderModalOS = window.renderModalOS;
if (typeof _origRenderModalOS === 'function') {
  window.renderModalOS = function() {
    _origRenderModalOS.apply(this, arguments);
    setTimeout(() => {
      const body = document.getElementById('modal-body');
      if (body) window.estilizarSecoesChamado(body);
    }, 100);
  };
}

console.log('[DIGICOPY] correcoes_relatorio_patch.js v4.9.84 — correções aplicadas');
})();
