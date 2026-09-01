// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.15.0 — Vendas e Notinhas (4/6/7/8 estoque de verdade + recarga)
// 1. Vendas SALVAS abrem em "Nova venda / Notinha" (venda 2.png) para continuar editando onde parou
// 2. Faturadas ficam travadas na mesma aba; estorno destrava e APAGA os títulos do financeiro
// 3. Reposição automática: ao repor estoque (0 ou insuficiente), volta na venda, adiciona e desconta
// 4. Sair sem salvar pergunta "Deseja salvar esta venda?": Não devolve estoque/descarta; Sim salva
// 5. Estoque exato em tempo real: lixeira devolve item no estoque na hora
// 6. Botão ÚNICO "Excluir" na lista que atua em seleção múltipla ou item único; proíbe faturadas
// 7. Meia folha A4 em 135mm estrita sem pular folha (IMAGEM correção 3)
// ═══════════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  function txt(v) { return String(v ?? '').trim(); }
  function low(v) { return txt(v).toLowerCase(); }
  function n(v, fb = 0) { const x = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : fb; }

  // 0) Neutraliza EXTRA_PURE.podeRefaturar para NUNCA criar o botão "Refazer faturamento" (Req 5)
  if (window.EXTRA_PURE) {
    window.EXTRA_PURE.podeRefaturar = function() { return { ok: false }; };
  }
  const timerExtra = setInterval(() => {
    if (window.EXTRA_PURE) {
      window.EXTRA_PURE.podeRefaturar = function() { return { ok: false }; };
      clearInterval(timerExtra);
    }
  }, 100);

  // A) Numeração sequencial de notinhas iniciando do 1 para novas vendas
  window.proximoNumeroVendaLimpo = function(arr, empresaId) {
    const minhas = (arr || (typeof db !== 'undefined' && db.vendas) || []).filter(v => (!empresaId || v.empresaId === empresaId) && !v.origemMigracao);
    let max = 0;
    minhas.forEach(v => {
      const num = parseInt(String(v.numero || '').replace(/\D/g, ''), 10);
      if (Number.isFinite(num) && num > max && num < 500000) max = num;
    });
    return String(max + 1);
  };

  // B) Salvar e Abrir Notinhas Salvas SEMPRE na aba normal de Nova venda / Notinha (venda 2.png) (Req 1)
  window.vosCarregarVendaNaTela = function(vendaId) {
    const v = (db.vendas || []).find(x => x.id === vendaId);
    if (!v) return;

    if (typeof window.novaVenda === 'function') {
      window.novaVenda();
    }

    const sess = typeof getSession === 'function' ? getSession() : null;
    const f = window.__vosForm;
    if (!f) return;

    f.vendaId = v.id;
    f.codigo = v.numero;
    f.data = (v.data || v.criadoEm || '').slice(0, 10);
    f.hora = (v.data || v.criadoEm || '').slice(11, 16) || '00:00';
    f.itens = (v.itens || []).map(it => ({ ...it }));

    const elCod = document.getElementById('vos-codigo');
    if (elCod) elCod.textContent = f.codigo;

    if (v.clienteId && typeof window.vosVendaSelectCliente === 'function') {
      window.vosVendaSelectCliente(v.clienteId);
    }
    window.__vosPersistida = true;
    window.__vosDirty = false;

    if (typeof window.vosRenderItens === 'function') window.vosRenderItens();
    if (typeof window.vosResumoVenda === 'function') window.vosResumoVenda();

    const st = low(v.status);
    if (['faturado', 'finalizada', 'concluido', 'pago'].includes(st)) {
      window.lockVendaFaturadaUI(v.id);
    } else if (st === 'estornada') {
      const statusEl = document.querySelector('#modal-box .neo-status, #modal-box [id*="status"]');
      if (statusEl) {
        statusEl.textContent = 'ESTORNADA';
        statusEl.className = 'neo-status wait font-bold';
      }
    }
  };

  // Intercepta duplo clique ou chamada a showVenda para vendas salvas (não faturadas e não estornadas) (Req 1)
  const _origHistVenda = window.historicoVenda;
  window.historicoVenda = window.showVenda = function(id) {
    const v = (db.vendas || []).find(x => x.id === id);
    if (v && !['faturado', 'finalizada', 'concluido', 'pago', 'estornada', 'estornado', 'cancelada', 'cancelado'].includes(low(v.status))) {
      // Venda salva / orçamento / pendente ABRE EM NOVA VENDA / NOTINHA (venda 2.png) para continuar mexendo
      window.vosCarregarVendaNaTela(id);
      return;
    }
    if (_origHistVenda) _origHistVenda.apply(this, arguments);
  };

  const _origVosSalvarVenda = window.vosSalvarVenda;
  window.vosSalvarVenda = function() {
    const v = typeof window.vosGravarVenda === 'function' ? window.vosGravarVenda(true) : null;
    if (v) {
      window.__vosPersistida = true;
      window.__vosDirty = false;
      window.__vosItensAdicionadosTemp = [];
      if (typeof toast === 'function') toast('Venda salva com sucesso! Você pode continuar editando de onde parou.', 'success');
    } else if (_origVosSalvarVenda) {
      _origVosSalvarVenda.apply(this, arguments);
    }
  };

  // C) Bloqueio / Desbloqueio da MESMA ABA após faturar com popups do sistema (Req 1)
  function avisoVendaFaturada(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    const msg = 'Esta venda está faturada. Não é possível alterar ou adicionar informações a não ser se estornar.';
    if (typeof window.lfbAlert === 'function') window.lfbAlert(msg, 'Venda Faturada');
    else if (typeof toast === 'function') toast(msg, 'error');
    else alert(msg);
  }

  window.lockVendaFaturadaUI = function(vendaId) {
    const modal = document.getElementById('modal-root');
    const box = document.getElementById('modal-box');
    if (!modal || !box || modal.classList.contains('hidden')) return;

    const statusEl = box.querySelector('.neo-status, [id*="status"]');
    if (statusEl) {
      statusEl.textContent = 'FATURADA';
      statusEl.className = 'neo-status ok font-bold';
    }

    box.querySelectorAll('input, select, textarea').forEach(el => {
      el.disabled = true;
      el.readOnly = true;
      el.classList.add('opacity-75', 'cursor-not-allowed');
      if (!el.__fatPatched) {
        el.__fatPatched = true;
        el.addEventListener('click', avisoVendaFaturada, true);
        el.addEventListener('keydown', avisoVendaFaturada, true);
      }
    });

    box.querySelectorAll('button').forEach(btn => {
      const t = (btn.textContent || '').trim().toLowerCase();
      const oc = (btn.getAttribute('onclick') || '').toLowerCase();
      const id = (btn.id || '').toLowerCase();
      if (/adicionar|item|faturar|salvar|excluir|remover|buscar/i.test(t) || /additem|salvar|faturar|delete|search/i.test(oc) || id.includes('lupa')) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        if (!btn.__fatPatched) {
          btn.__fatPatched = true;
          btn.addEventListener('click', avisoVendaFaturada, true);
        }
      }
    });

    const footer = document.getElementById('modal-footer') || box;
    if (!footer.querySelector('[data-btn-estorno]')) {
      const bEstorno = document.createElement('button');
      bEstorno.setAttribute('data-btn-estorno', '1');
      bEstorno.className = 'h-[44px] px-4 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold flex items-center gap-1.5 hover:bg-red-100 mr-auto';
      bEstorno.innerHTML = '<i class="ph ph-arrow-counter-clockwise"></i> Estornar';
      bEstorno.onclick = function(e) {
        e.preventDefault();
        window.estornarNotinha(vendaId);
      };
      footer.prepend(bEstorno);
    }
  };

  window.unlockVendaFaturadaUI = function(vendaId) {
    const modal = document.getElementById('modal-root');
    const box = document.getElementById('modal-box');
    if (!modal || !box) return;

    box.querySelectorAll('input, select, textarea, button').forEach(el => {
      el.disabled = false;
      el.readOnly = false;
      el.classList.remove('opacity-75', 'opacity-50', 'cursor-not-allowed');
      if (el.__fatPatched) {
        el.removeEventListener('click', avisoVendaFaturada, true);
        el.removeEventListener('keydown', avisoVendaFaturada, true);
        delete el.__fatPatched;
      }
    });

    const bEstorno = box.querySelector('[data-btn-estorno]');
    if (bEstorno) bEstorno.remove();
  };

  // D) Faturamento Universal na Mesma Aba + Venda Zerada (Req 1 e 6)
  function faturarVendaZeradaDireto(v) {
    const sess = typeof getSession === 'function' ? getSession() : null;
    v.status = 'faturado';
    v.situacao = 'faturado';
    v.dataFaturamento = new Date().toISOString();
    v.formaPagamento = 'Sem cobrança (R$ 0,00)';

    db.contasReceber = db.contasReceber || [];
    let cr = db.contasReceber.find(x => x.vendaId === v.id);
    if (cr) {
      cr.status = 'pago';
      cr.pagamentoData = new Date().toISOString();
      cr.valor = 0;
      cr.autoBaixa = true;
      cr.formaPagamento = 'Sem cobrança (R$ 0,00)';
    } else if (sess) {
      db.contasReceber.push({
        id: (typeof uid === 'function' ? uid('cr') : 'cr_' + Math.random().toString(36).slice(2, 9)),
        empresaId: sess.empresaId,
        origem: 'venda',
        clienteId: v.clienteId,
        descricao: `Venda ${v.numero} • zerada`,
        valor: 0,
        vencimento: new Date().toISOString(),
        pagamentoData: new Date().toISOString(),
        status: 'pago',
        autoBaixa: true,
        contratoId: null,
        leituraId: null,
        vendaId: v.id,
        criadoPor: sess.usuarioId,
        criadoPorNome: sess.usuarioNome,
        formaPagamento: 'Sem cobrança (R$ 0,00)'
      });
    }

    if (typeof logAction === 'function') {
      logAction('venda', 'faturar_zerada', v.id, `Venda ${v.numero} zerada faturada por ${sess?.usuarioNome}`);
    }
    if (typeof saveDB === 'function') saveDB();
    if (typeof renderVendas === 'function') renderVendas();
    if (typeof renderFinanceiro === 'function') renderFinanceiro();

    window.lockVendaFaturadaUI(v.id);
    if (typeof window.lfbAlert === 'function') {
      window.lfbAlert('Venda zerada faturada e baixada automaticamente como paga!', 'Venda Faturada');
    } else if (typeof toast === 'function') {
      toast('Venda zerada faturada e baixada automaticamente como paga!', 'success');
    }
  }

  const _origVosAbrirRecebimento = window.vosAbrirRecebimento;
  window.vosAbrirRecebimento = function(vendaId) {
    const v = (db.vendas || []).find(x => x.id === vendaId);
    if (!v) {
      if (_origVosAbrirRecebimento) _origVosAbrirRecebimento.apply(this, arguments);
      return;
    }

    if (['faturado', 'finalizada', 'concluido', 'pago'].includes(low(v.status))) {
      const msg = 'Esta venda já está faturada.';
      if (typeof window.lfbAlert === 'function') window.lfbAlert(msg, 'Venda Faturada');
      else if (typeof toast === 'function') toast(msg, 'info');
      return;
    }

    const ehZero = n(v.total || 0) <= 0;
    if (ehZero) {
      const msg = 'Deseja faturar esta venda zerada (R$ 0,00)?\n\nEla será faturada e baixada automaticamente como paga no Financeiro.';
      if (typeof window.confirmSistema === 'function') {
        window.confirmSistema(msg, 'Faturar Venda Zerada').then(ok => {
          if (ok) faturarVendaZeradaDireto(v);
        });
      } else if (confirm(msg)) {
        faturarVendaZeradaDireto(v);
      }
      return;
    }

    window.__vosFormHtmlSalvo = {
      title: document.getElementById('modal-title')?.innerText || '',
      body: document.getElementById('modal-body')?.innerHTML || '',
      footer: document.getElementById('modal-footer')?.innerHTML || '',
      boxClass: document.getElementById('modal-box')?.className || ''
    };

    if (_origVosAbrirRecebimento) _origVosAbrirRecebimento.apply(this, arguments);
  };

  window.faturarVenda = function(id) {
    const sess = typeof getSession === 'function' ? getSession() : null;
    const v = (db.vendas || []).find(x => x.id === id) ||
              (sess && typeof vosLegadosVendas === 'function' ? vosLegadosVendas(sess).find(x => x.id === id) : null);
    if (!v) {
      if (typeof toast === 'function') toast('Notinha não encontrada', 'error');
      return;
    }
    if (['faturado', 'finalizada', 'concluido', 'pago'].includes(low(v.status))) {
      const msg = 'Esta venda já está faturada.';
      if (typeof window.lfbAlert === 'function') window.lfbAlert(msg, 'Venda Faturada');
      else if (typeof toast === 'function') toast(msg, 'info');
      return;
    }
    if (typeof window.vosAbrirRecebimento === 'function') {
      window.vosAbrirRecebimento(v.id);
    }
  };

  const _origConcluirFat = window.vosConcluirFaturamento;
  window.vosConcluirFaturamento = function() {
    const vId = window.__vosFatVendaId || (window.__vosForm && window.__vosForm.vendaId);
    if (!vId) {
      if (_origConcluirFat) _origConcluirFat.apply(this, arguments);
      return;
    }
    if (_origConcluirFat) _origConcluirFat.apply(this, arguments);

    setTimeout(() => {
      const modal = document.getElementById('modal-root');
      const box = document.getElementById('modal-box');
      if (modal && box && window.__vosFormHtmlSalvo && window.__vosFormHtmlSalvo.body) {
        box.className = window.__vosFormHtmlSalvo.boxClass;
        document.getElementById('modal-title').innerText = window.__vosFormHtmlSalvo.title;
        document.getElementById('modal-body').innerHTML = window.__vosFormHtmlSalvo.body;
        document.getElementById('modal-footer').innerHTML = window.__vosFormHtmlSalvo.footer;
        modal.classList.remove('hidden');
      }
      window.lockVendaFaturadaUI(vId);
    }, 120);
  };

  // E) Botão ÚNICO de Excluir (seleção múltipla ou item único), proibindo faturadas (Req 2)
  window.excluirVendaUnificado = function() {
    const checks = Array.from(document.querySelectorAll('input[name="venda-check-lote"]:checked'));
    let alvos = [];
    if (checks.length) {
      alvos = checks.map(ch => (db.vendas || []).find(x => x.id === ch.value)).filter(Boolean);
    } else {
      const vId = window.neoVendaSelecionada || window.vendaSelecionadaId;
      if (vId) {
        const v = (db.vendas || []).find(x => x.id === vId);
        if (v) alvos = [v];
      }
    }

    if (!alvos.length) {
      const msg = 'Selecione uma venda na tabela ou marque as caixas de seleção para excluir.';
      if (typeof window.lfbAlert === 'function') window.lfbAlert(msg, 'Excluir Venda');
      else if (typeof toast === 'function') toast(msg, 'info');
      return;
    }

    const faturadas = alvos.filter(v => ['faturado', 'finalizada', 'concluido', 'pago'].includes(low(v.status)));
    if (faturadas.length) {
      const msg = 'Não é possível excluir vendas que já foram faturadas! Estorne a venda primeiro para poder excluí-la.';
      if (typeof window.lfbAlert === 'function') window.lfbAlert(msg, 'Excluir Vendas');
      else if (typeof toast === 'function') toast(msg, 'error');
      else alert(msg);
      return;
    }

    const msgConf = `Deseja excluir ${alvos.length} notinha(s)? O estoque será devolvido ao produto.`;
    const fExcluir = () => {
      alvos.forEach(v => {
        (v.itens || []).forEach(it => {
          if (it.produtoId && typeof db.produtos !== 'undefined') {
            const p = db.produtos.find(x => x.id === it.produtoId);
            if (p && p.categoria !== 'Serviço') p.estoque = (p.estoque || 0) + (parseFloat(it.qtd) || 1);
          }
        });
        db.vendas = (db.vendas || []).filter(x => x.id !== v.id);
        db.contasReceber = (db.contasReceber || []).filter(cr => cr.vendaId !== v.id);
      });
      if (typeof saveDB === 'function') saveDB();
      if (typeof renderVendas === 'function') renderVendas();
      if (typeof renderProdutos === 'function') renderProdutos();
      window.neoVendaSelecionada = null;
      window.vendaSelecionadaId = null;
      if (typeof toast === 'function') toast(`${alvos.length} notinha(s) excluída(s) com sucesso!`, 'success');
    };

    if (typeof window.confirmSistema === 'function') {
      window.confirmSistema(msgConf, 'Excluir Vendas').then(ok => { if (ok) fExcluir(); });
    } else if (confirm(msgConf)) {
      fExcluir();
    }
  };

  function unificarBotaoExcluirVendas() {
    const view = document.getElementById('view-vendas');
    if (!view || view.classList.contains('hidden')) return;
    const actions = view.querySelector('.neo-actions');
    if (actions) {
      actions.querySelectorAll('button').forEach(btn => {
        const t = (btn.textContent || '').trim().toLowerCase();
        if (/excluir/i.test(t)) btn.remove();
      });
      if (!actions.querySelector('#btn-excluir-venda-unificado')) {
        const btn = document.createElement('button');
        btn.id = 'btn-excluir-venda-unificado';
        btn.className = 'neo-btn danger';
        btn.innerHTML = '<i class="ph ph-trash"></i>Excluir';
        btn.onclick = window.excluirVendaUnificado;
        actions.appendChild(btn);
      }
    }

    const tabela = view.querySelector('table.neo-table');
    if (tabela) {
      const theadTr = tabela.querySelector('thead tr');
      if (theadTr && !theadTr.querySelector('.th-venda-lote')) {
        const th = document.createElement('th');
        th.className = 'th-venda-lote px-2 w-8';
        th.innerHTML = '<input type="checkbox" onclick="document.querySelectorAll(\'input[name=\\\'venda-check-lote\\\']\').forEach(c=>c.checked=this.checked)">';
        theadTr.prepend(th);
      }
      tabela.querySelectorAll('tbody tr').forEach(tr => {
        if (!tr.querySelector('.td-venda-lote')) {
          const idVal = tr.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || '';
          const td = document.createElement('td');
          td.className = 'td-venda-lote px-2 w-8';
          td.innerHTML = idVal ? `<input type="checkbox" name="venda-check-lote" value="${idVal}" onclick="event.stopPropagation()">` : '';
          tr.prepend(td);
        }
      });
    }
  }

  const _origRenderVendasLote = window.renderVendas;
  window.renderVendas = function() {
    const ret = _origRenderVendasLote ? _origRenderVendasLote.apply(this, arguments) : undefined;
    setTimeout(unificarBotaoExcluirVendas, 30);
    return ret;
  };
  setTimeout(unificarBotaoExcluirVendas, 400);

  // F) Estoque Exato + Lixeira devolvendo + Sair sem salvar com aviso "Deseja salvar essa venda?" (Req 3 e 6)
  window.__vosItensAdicionadosTemp = window.__vosItensAdicionadosTemp || [];

  const _origNovaVenda = window.novaVenda;
  window.novaVenda = function() {
    window.__vosItensAdicionadosTemp = [];
    window.__vosPersistida = false;
    window.__vosDirty = false;
    window.__vosSaindoVenda = false;
    const r = _origNovaVenda ? _origNovaVenda.apply(this, arguments) : undefined;
    return r;
  };

  function telaVendaAberta() {
    return !!(document.getElementById('vos-itens-body') || document.getElementById('vos-cli-search'));
  }

  function vendaJaExisteNoBanco() {
    const id = window.__vosForm && window.__vosForm.vendaId;
    if (!id || typeof db === 'undefined') return !!window.__vosPersistida;
    return !!(db.vendas || []).find(x => x.id === id) || !!window.__vosPersistida;
  }

  function marcarVendaSuja() {
    window.__vosDirty = true;
  }

  function devolverReservaTemporaria() {
    (window.__vosItensAdicionadosTemp || []).forEach(it => {
      const p = db.produtos && db.produtos.find(x => x.id === it.produtoId);
      if (p && p.categoria !== 'Serviço' && p.categoria !== 'Recarga') {
        p.estoque = (p.estoque || 0) + (parseFloat(it.qtd) || 1);
      }
    });
    window.__vosItensAdicionadosTemp = [];
  }

  // v5.22.68 — acabou o "Deseja salvar esta venda?". Faturar e sair não
  // perguntam mais nada: o closeModal já grava sozinho quando há cliente
  // (ajustes_v52241), então o aviso só repetia trabalho.
  function perguntarSairVenda(depoisFechar) {
    depoisFechar();
  }

  const _origCloseModalEst = window.closeModal;
  window.closeModal = function(force) {
    if (window.__vosIgnorarSair) {
      return _origCloseModalEst ? _origCloseModalEst.apply(this, arguments) : undefined;
    }
    if (window.__vosPendenteReporEstoque && !telaVendaAberta()) {
      const pend = window.__vosPendenteReporEstoque;
      window.__vosPendenteReporEstoque = null;
      const r = _origCloseModalEst ? _origCloseModalEst.apply(this, arguments) : undefined;
      if (pend && pend.snap) setTimeout(() => restaurarVendaDoSnapshot(pend.snap, null), 20);
      return r;
    }
    if (telaVendaAberta() && window.__vosForm) {
      perguntarSairVenda(() => {
        if (_origCloseModalEst) _origCloseModalEst.call(window, true);
        else {
          const modal = document.getElementById('modal-root');
          if (modal) modal.classList.add('hidden');
        }
      });
      return;
    }
    return _origCloseModalEst ? _origCloseModalEst.apply(this, arguments) : undefined;
  };

  const _origVoltarNivel = window.voltarNivelModal;
  if (typeof _origVoltarNivel === 'function') {
    window.voltarNivelModal = function(e) {
      if (window.__vosPendenteReporEstoque) return;
      if (telaVendaAberta() && window.__vosForm) {
        if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
        perguntarSairVenda(() => {
          const modal = document.getElementById('modal-root');
          if (modal) modal.classList.add('hidden');
          window.__vosForm = null;
        });
        return;
      }
      return _origVoltarNivel.apply(this, arguments);
    };
  }

  const _origVosRemoveItem = window.vosRemoveItem;
  window.vosRemoveItem = function(i) {
    const f = window.__vosForm;
    if (f && f.itens && f.itens[i]) {
      const item = f.itens[i];
      const idxTemp = (window.__vosItensAdicionadosTemp || []).findIndex(t => t.produtoId === item.produtoId);
      if (idxTemp >= 0) {
        const p = db.produtos && db.produtos.find(x => x.id === item.produtoId);
        if (p && p.categoria !== 'Serviço' && p.categoria !== 'Recarga') {
          p.estoque = (p.estoque || 0) + (parseFloat(item.qtd) || 1);
        }
        window.__vosItensAdicionadosTemp.splice(idxTemp, 1);
      }
    }
    marcarVendaSuja();
    if (_origVosRemoveItem) _origVosRemoveItem.apply(this, arguments);
  };

  // G) Aviso "Escolha o cliente primeiro" em Nova Venda
  function clienteSelecionadoNaVenda() {
    if (window.__vosForm && window.__vosForm.cliente) return true;
    if (window.__vosForm && window.__vosForm.clienteId) return true;
    if (window.neoVendaCliente) return true;
    if (window.vendaClienteSelecionado) return true;
    const cliSel = document.getElementById('vos-cli-selecionado') || document.getElementById('neo-cli-selected');
    if (cliSel && !cliSel.classList.contains('hidden') && cliSel.textContent.trim()) return true;
    return false;
  }

  function validarClienteVendaAviso() {
    if (!clienteSelecionadoNaVenda()) {
      const el1 = document.getElementById('vos-prod-results');
      const el2 = document.getElementById('neo-prod-results');
      if (el1) el1.classList.add('hidden');
      if (el2) el2.classList.add('hidden');
      const msg = 'Escolha o cliente primeiro antes de buscar ou adicionar itens na venda.';
      if (typeof window.lfbAlert === 'function') window.lfbAlert(msg, 'Cliente Não Selecionado');
      else if (typeof toast === 'function') toast(msg, 'error');
      else alert(msg);
      return false;
    }
    return true;
  }

  document.addEventListener('keydown', function(ev) {
    if (ev.key === 'Enter') {
      const active = document.activeElement;
      if (active && (active.id === 'vos-prod-search' || active.id === 'neo-prod-search' || (active.placeholder || '').toLowerCase().includes('digite para buscar'))) {
        if (!clienteSelecionadoNaVenda()) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          const msg = 'Escolha o cliente primeiro antes de buscar ou adicionar itens na venda.';
          if (typeof window.lfbAlert === 'function') window.lfbAlert(msg, 'Cliente Não Selecionado');
          else if (typeof toast === 'function') toast(msg, 'error');
          else alert(msg);
        }
      }
    }
  }, true);

  const _origVosSearchProd = window.vosVendaSearchProd;
  window.vosVendaSearchProd = function(q) {
    if (!q || !txt(q)) {
      if (_origVosSearchProd) _origVosSearchProd.apply(this, arguments);
      return;
    }
    if (!validarClienteVendaAviso()) return;
    if (_origVosSearchProd) _origVosSearchProd.apply(this, arguments);
  };

  const _origNeoSearchProd = window.neoSearchProdutoVenda;
  window.neoSearchProdutoVenda = function(q) {
    if (!q || !txt(q)) {
      if (_origNeoSearchProd) _origNeoSearchProd.apply(this, arguments);
      return;
    }
    if (!validarClienteVendaAviso()) return;
    if (_origNeoSearchProd) _origNeoSearchProd.apply(this, arguments);
  };

  // H) Reposição: salva estado da venda (NÃO o HTML) e reconstrói depois — evita travar
  function snapshotVendaAtual() {
    const f = window.__vosForm;
    if (!f) return null;
    let formCopy = null;
    try { formCopy = structuredClone(f); } catch (e) {
      formCopy = { vendaId: f.vendaId, codigo: f.codigo, data: f.data, hora: f.hora, itens: (f.itens || []).map(it => ({ ...it })), cliente: f.cliente ? { ...f.cliente } : null, produtoSel: null };
    }
    return {
      form: formCopy,
      campos: {
        destino: document.getElementById('vos-destino')?.value || '',
        dataSaida: document.getElementById('vos-data-saida')?.value || '',
        prazo: document.getElementById('vos-prazo-entrega')?.value || '',
        obs: document.getElementById('vos-obs')?.value || '',
        status: document.getElementById('vos-status')?.value || '',
        desc: document.getElementById('vos-desc-venda')?.value || '0'
      }
    };
  }

  function restaurarVendaDoSnapshot(snap, itemExtra) {
    if (!snap || typeof window.novaVenda !== 'function') return;
    window.__vosIgnorarSair = true;
    window.__vosSalvoConfirmadoTemp = true;
    window.novaVenda();
    window.__vosSalvoConfirmadoTemp = false;
    const f = window.__vosForm;
    if (f && snap.form) {
      f.vendaId = snap.form.vendaId || null;
      f.codigo = snap.form.codigo || f.codigo;
      f.data = snap.form.data || f.data;
      f.hora = snap.form.hora || f.hora;
      f.itens = (snap.form.itens || []).map(it => ({ ...it }));
      if (snap.form.cliente && snap.form.cliente.id && typeof window.vosVendaSelectCliente === 'function') {
        window.vosVendaSelectCliente(snap.form.cliente.id);
      }
    }
    const c = snap.campos || {};
    const setv = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
    setv('vos-destino', c.destino);
    setv('vos-data-saida', c.dataSaida);
    setv('vos-prazo-entrega', c.prazo);
    setv('vos-obs', c.obs);
    setv('vos-status', c.status);
    setv('vos-desc-venda', c.desc);
    const elCod = document.getElementById('vos-codigo');
    if (elCod && f && f.codigo) elCod.textContent = f.codigo;
    if (itemExtra && f) {
      f.itens.push(itemExtra);
    }
    if (typeof window.vosRenderItens === 'function') window.vosRenderItens();
    if (typeof window.vosResumoVenda === 'function') window.vosResumoVenda();
    const modal = document.getElementById('modal-root');
    if (modal) modal.classList.remove('hidden');
    setTimeout(() => { window.__vosIgnorarSair = false; }, 80);
  }

  function processarReposicaoEstoqueNaVenda() {
    const pend = window.__vosPendenteReporEstoque;
    if (!pend || !pend.snap) return;
    window.__vosPendenteReporEstoque = null;
    const prd = (db.produtos || []).find(x => x.id === pend.produtoId);
    if (!prd) {
      restaurarVendaDoSnapshot(pend.snap, null);
      return;
    }
    if ((prd.estoque || 0) < pend.qtdSolicitada) {
      restaurarVendaDoSnapshot(pend.snap, null);
      if (typeof window.lfbAlert === 'function') {
        window.lfbAlert('O estoque salvo ainda é menor que a quantidade solicitada.', 'Estoque insuficiente');
      }
      return;
    }
    prd.estoque = (prd.estoque || 0) - pend.qtdSolicitada;
    window.__vosItensAdicionadosTemp = window.__vosItensAdicionadosTemp || [];
    window.__vosItensAdicionadosTemp.push({ produtoId: prd.id, qtd: pend.qtdSolicitada });
    if (typeof saveDB === 'function') saveDB();
    const pu = prd.preco || 0;
    const item = {
      produtoId: prd.id,
      descricao: prd.nome || '',
      sku: prd.sku || '',
      tipo: prd.categoria || 'Produto',
      qtd: pend.qtdSolicitada,
      preco: pu,
      desconto: 0,
      subtotal: pend.qtdSolicitada * pu,
      situacao: 'Pendente'
    };
    restaurarVendaDoSnapshot(pend.snap, item);
    if (typeof window.lfbAlert === 'function') {
      window.lfbAlert('Estoque reposto. Item adicionado na notinha. Estoque restante: ' + prd.estoque, 'Estoque');
    }
  }

  function wrapSaveProduto(nome) {
    const orig = window[nome];
    if (typeof orig !== 'function' || orig.__vosWrap) return;
    window[nome] = function() {
      const pend = window.__vosPendenteReporEstoque;
      window.__vosIgnorarSair = true;
      const res = orig.apply(this, arguments);
      if (pend) window.__vosPendenteReporEstoque = pend;
      if (pend) {
        setTimeout(() => {
          window.__vosIgnorarSair = false;
          processarReposicaoEstoqueNaVenda();
        }, 30);
      } else {
        window.__vosIgnorarSair = false;
      }
      return res;
    };
    window[nome].__vosWrap = true;
  }
  wrapSaveProduto('saveProduto');
  wrapSaveProduto('salvarProdutoOperacional');
  wrapSaveProduto('salvarProdutoModal');

  function abrirCadastroProdutoDaVenda(p, qtdSolicitada) {
    window.__vosPendenteReporEstoque = {
      produtoId: p.id,
      qtdSolicitada: qtdSolicitada,
      snap: snapshotVendaAtual()
    };
    window.__vosIgnorarSair = true;
    if (typeof window.openModal === 'function') window.openModal('produto', p.id);
  }

  function checarEstoqueComPopup(p, qtdSolicitada, callbackOk) {
    if (!p || p.categoria === 'Serviço' || p.categoria === 'Recarga') {
      callbackOk();
      return;
    }
    const est = Number(p.estoque || 0);
    if (est <= 0 || qtdSolicitada > est) {
      const msg = est <= 0
        ? `Este produto "${p.nome}" (Cód: ${p.sku || p.codigo || '-'}) está sem estoque (atual: ${est}).\n\nDeseja abrir o cadastro para adicionar estoque agora?`
        : `Estoque insuficiente para "${p.nome}".\n\nSolicitado: ${qtdSolicitada} | Disponível: ${est}.\n\nDeseja abrir o cadastro para ajustar o estoque?`;
      const tit = est <= 0 ? 'Produto Sem Estoque' : 'Estoque Insuficiente';
      if (typeof window.confirmSistema === 'function') {
        window.confirmSistema(msg, tit).then(ok => {
          if (ok) abrirCadastroProdutoDaVenda(p, qtdSolicitada);
        });
      } else if (typeof window.lfbAlert === 'function') {
        window.lfbAlert(msg, tit);
      }
      return;
    }
    callbackOk();
  }

  // I) Estornar venda mostra status ESTORNADA, destrava campos e REMOVE título do financeiro (Req 1)
  window.estornarNotinha = window.estornarVenda = function(id) {
    const sess = typeof getSession === 'function' ? getSession() : null;
    if (!sess || typeof db === 'undefined') return;
    const v = (db.vendas || []).find(x => x.id === id) ||
              (sess && typeof vosLegadosVendas === 'function' ? vosLegadosVendas(sess).find(x => x.id === id) : null);
    if (!v) {
      if (typeof toast === 'function') toast('Notinha não encontrada', 'error');
      return;
    }
    const st = low(v.status);
    if (!['faturado', 'finalizada', 'concluido', 'pago'].includes(st)) {
      const msg = 'Só é possível estornar vendas que já foram faturadas';
      if (typeof window.lfbAlert === 'function') window.lfbAlert(msg, 'Aviso de Estorno');
      else if (typeof toast === 'function') toast(msg, 'error');
      return;
    }

    const msgConf = `Deseja ESTORNAR a notinha ${v.numero}?\n\nEla ficará com status ESTORNADA, destravará a tela e o lançamento será removido do Financeiro.`;
    const fEstornar = () => {
      let reg = db.vendas.find(x => x.id === id);
      if (!reg) {
        reg = structuredClone(v);
        reg.id = id.startsWith('legado_') ? (typeof uid === 'function' ? uid('vda') : 'vda_' + Date.now()) : id;
        reg.origemMigracao = true;
        db.vendas.push(reg);
      }

      reg.status = 'estornada';
      reg.situacao = 'estornada';
      reg.dataEstorno = new Date().toISOString();
      reg.estornadoPor = sess.usuarioNome;

      (reg.itens || []).forEach(it => {
        if (it.produtoId && typeof db.produtos !== 'undefined') {
          const prd = db.produtos.find(p => p.id === it.produtoId);
          if (prd && prd.categoria !== 'Serviço' && prd.categoria !== 'Recarga') {
            prd.estoque = (prd.estoque || 0) + (parseFloat(it.qtd) || 1);
          }
        }
      });

      // Req 1: REMOVE completamente o título do financeiro ao estornar
      db.contasReceber = (db.contasReceber || []).filter(cr => cr.vendaId !== reg.id && cr.legadoCodigo !== reg.numero);

      if (typeof logAction === 'function') {
        logAction('venda', 'estornar', reg.id, `Estornada notinha ${reg.numero} por ${sess.usuarioNome}`);
      }
      if (typeof saveDB === 'function') saveDB();
      if (typeof renderVendas === 'function') renderVendas();
      if (typeof renderFinanceiro === 'function') renderFinanceiro();
      if (typeof renderAuditoria === 'function') renderAuditoria();

      window.unlockVendaFaturadaUI(id);
      const statusEl = document.querySelector('#modal-box .neo-status, #modal-box [id*="status"]');
      if (statusEl) {
        statusEl.textContent = 'ESTORNADA';
        statusEl.className = 'neo-status wait font-bold';
      }
      if (typeof toast === 'function') toast(`Notinha ${reg.numero} estornada, destravada e título removido do financeiro!`, 'success');
    };

    if (typeof window.confirmSistema === 'function') {
      window.confirmSistema(msgConf, 'Estornar Notinha').then(ok => { if (ok) fEstornar(); });
    } else if (confirm(msgConf)) {
      fEstornar();
    }
  };

  // J) Limpeza do Histórico
  const _origHist = window.historicoVenda;
  window.historicoVenda = function(id) {
    const vPre = (typeof db !== 'undefined' && db.vendas && db.vendas.find(x => x.id === id));
    if (vPre && !['faturado', 'finalizada', 'concluido', 'pago', 'estornada', 'estornado', 'cancelada', 'cancelado'].includes(low(vPre.status))) {
      if (_origHist) return _origHist.apply(this, arguments);
      return;
    }
    if (_origHist) _origHist.apply(this, arguments);

    const footer = document.getElementById('modal-footer');
    const body = document.getElementById('modal-body');
    if (!footer) return;

    const sess = typeof getSession === 'function' ? getSession() : null;
    const v = (typeof db !== 'undefined' && db.vendas && db.vendas.find(x => x.id === id)) ||
              (sess && typeof vosLegadosVendas === 'function' ? vosLegadosVendas(sess).find(x => x.id === id) : null);
    if (!v) return;

    const st = low(v.status);
    const isFaturada = ['faturado', 'finalizada', 'concluido', 'pago'].includes(st);
    const isEstornada = ['estornada', 'estornado', 'cancelada', 'cancelado'].includes(st);

    footer.querySelectorAll('button, [data-btn-editar], [data-refaturar]').forEach(b => {
      const t = (b.textContent || '').trim().toLowerCase();
      if (/editar|refazer\s*faturamento/i.test(t) || b.getAttribute('data-btn-editar') || b.getAttribute('data-refaturar')) {
        b.remove();
      }
    });

    footer.querySelectorAll('[data-btn-estorno], button').forEach(b => {
      if (/^\s*estornar/i.test(b.textContent || '') || b.getAttribute('data-btn-estorno')) {
        b.remove();
      }
    });
    if (isFaturada && !isEstornada) {
      const bEstorno = document.createElement('button');
      bEstorno.setAttribute('data-btn-estorno', '1');
      bEstorno.className = 'h-[44px] px-4 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold flex items-center gap-1.5 hover:bg-red-100 mr-auto';
      bEstorno.innerHTML = '<i class="ph ph-arrow-counter-clockwise"></i> Estornar';
      bEstorno.onclick = function() { window.estornarNotinha(id); };
      footer.prepend(bEstorno);
    }

    if (body) {
      body.querySelectorAll('button').forEach(b => {
        if (/^\s*baixar\s*$/i.test(b.textContent || '') || (b.getAttribute('onclick') || '').includes('baixarCR')) {
          b.remove();
        }
      });
    }

    const isPix = v.formaPagamento && /pix/i.test(v.formaPagamento);
    if (!isPix && body) {
      body.querySelectorAll('.qrcode, [class*="qr"], div, p, span').forEach(el => {
        const txtEl = (el.textContent || '').toLowerCase();
        if (txtEl.includes('whatsapp qr code') || (txtEl.includes('pix') && txtEl.includes('comprovante no whatsapp'))) {
          el.remove();
        }
      });
    }
  };

  // K) Impressão A4 compactada estrita em 135mm sem pular folha (IMAGEM correção 3) (Req 4)
  const _origGerarHtml = window.vosGerarHtmlNotinha;
  if (typeof _origGerarHtml === 'function') {
    window.vosGerarHtmlNotinha = function(vendaId, opts) {
      let html = _origGerarHtml.apply(this, arguments);
      if (!html) return html;

      const sess = typeof getSession === 'function' ? getSession() : null;
      const v = (typeof db !== 'undefined' && db.vendas && db.vendas.find(x => x.id === vendaId)) ||
                (sess && typeof vosLegadosVendas === 'function' ? vosLegadosVendas(sess).find(x => x.id === vendaId) : null);
      if (!v) return html;

      const isPix = v.formaPagamento && /pix/i.test(v.formaPagamento);

      if (!isPix) {
        html = html.replace(/WhatsApp QR Code:\s*\+?[\d\s-]+/gi, '');
        html = html.replace(/<div[^>]*pix-bloco-notinha[^>]*>[\s\S]*?<\/div>/gi, '');
        html = html.replace(/<div[^>]*><b>Pix:<\/b>[\s\S]*?<\/div>/gi, '');
        html = html.replace(/<div[^>]*pix-aviso-comprovante[^>]*>[\s\S]*?<\/div>/gi, '');
      } else {
        let blocoLaranja = '';
        html = html.replace(/<div[^>]*><b>Pix:<\/b>\s*valor exato da notinha[\s\S]*?<\/div>/gi, (match) => {
          blocoLaranja = match;
          return '';
        });

        if (!blocoLaranja && !html.includes('comprovante no WhatsApp')) {
          blocoLaranja = `<div class="pix-aviso-comprovante" style="margin:1mm 0;padding:1.5mm 2.5mm;border:1px solid #f59e0b;background:#fffbeb;border-radius:4px;font-size:8.5px;color:#92400e;line-height:1.2"><b>Pix:</b> valor exato da notinha. Envie o comprovante no WhatsApp da DIGICOPY para baixa manual.</div>`;
        } else if (blocoLaranja) {
          blocoLaranja = blocoLaranja.replace(/margin:[^;]+;/gi, 'margin:1mm 0;')
                                     .replace(/padding:[^;]+;/gi, 'padding:1.5mm 2.5mm;')
                                     .replace(/font-size:[^;]+;/gi, 'font-size:8.5px;')
                                     .replace(/<div/i, '<div class="pix-aviso-comprovante"');
        }

        if (blocoLaranja) {
          if (html.includes('<p class="audit">')) {
            html = html.replace('<p class="audit">', blocoLaranja + '<p class="audit">');
          } else if (html.includes('</div>\n  <div class="corte')) {
            html = html.replace('</div>\n  <div class="corte', blocoLaranja + '</div>\n  <div class="corte');
          }
        }

        const estiloCompactoA4 = `
          <style>
            @page { size: A4 portrait; margin: 0; }
            @media print {
              .corte, .no-print { display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; }
              html, body { height: 140mm !important; max-height: 140mm !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; }
            }
            html, body { margin: 0 !important; padding: 0 !important; height: auto !important; }
            .pagina, .pagina.meia { height: 135mm !important; max-height: 135mm !important; overflow: hidden !important; page-break-after: avoid !important; page-break-inside: avoid !important; padding: 3mm 5mm !important; margin: 0 !important; }
            .cab { padding-bottom: 1.5mm !important; margin-bottom: 1.5mm !important; }
            .emp-nome { font-size: 11.5px !important; }
            .nota-n { font-size: 13.5px !important; }
            .cli-box { margin-bottom: 1.5mm !important; font-size: 9.5px !important; }
            .tb td, .tb th { padding: 0.8mm 1.2mm !important; font-size: 8.5px !important; }
            .tots { margin-top: 1mm !important; font-size: 9.5px !important; }
            .tot-grande { font-size: 11.5px !important; }
            .ass { margin-top: 3mm !important; padding-top: 1mm !important; font-size: 8px !important; }
            .audit { margin-top: 1mm !important; padding-top: 0.8mm !important; font-size: 7px !important; line-height: 1.15 !important; }
            #pix-aviso-comprovante, .pix-box-compacta { margin: 1mm 0 !important; padding: 1.2mm 2mm !important; border: 1px solid #0a1e8a !important; border-radius: 4px !important; display: flex !important; gap: 2mm !important; align-items: center !important; max-height: 20mm !important; }
            #pix-aviso-comprovante b, .pix-box-compacta b { font-size: 8px !important; }
            #pix-aviso-comprovante, .pix-box-compacta { font-size: 7.5px !important; line-height: 1.15 !important; }
            .pagina table { margin-bottom: 1mm !important; }
            .pagina p, .pagina div { line-height: 1.15 !important; }
          </style>
        `;
        html = html.replace('</head>', estiloCompactoA4 + '</head>');
      }

      return html;
    };
  }


  // L) Recarga de toner: campos (descrição, etiqueta, valor, desconto, total, técnico) + busca por etiqueta
  function ehTipoRecargaToner() {
    const t = (document.getElementById('vos-item-tipo')?.value || '');
    return /recarga/i.test(t);
  }
  function recargasStore() {
    if (typeof db === 'undefined') return [];
    db.recargasEtiquetas = db.recargasEtiquetas || [];
    return db.recargasEtiquetas;
  }
  function normEtq(v) { return txt(v).replace(/\s+/g, '').toUpperCase(); }
  function acharRecargaPorEtiqueta(codigo) {
    const k = normEtq(codigo);
    if (!k) return null;
    return recargasStore().find(r => normEtq(r.etiqueta) === k) || null;
  }
  function aplicarLayoutRecargaToner() {
    const recarga = ehTipoRecargaToner();
    const extra = document.getElementById('vos-item-extra');
    if (extra) extra.classList.toggle('hidden', !recarga && !/Toner|Manutenção|Serviço/i.test(document.getElementById('vos-item-tipo')?.value || ''));
    const qtdWrap = document.getElementById('vos-item-qtd')?.closest('label');
    if (qtdWrap) qtdWrap.classList.toggle('hidden', recarga);
    const qtdEl = document.getElementById('vos-item-qtd');
    if (recarga && qtdEl) qtdEl.value = 1;
    const cart = document.getElementById('vos-item-cartucho');
    if (cart) {
      cart.placeholder = recarga ? 'Nº da etiqueta (Enter para buscar)' : '';
      cart.setAttribute('title', recarga ? 'Digite a etiqueta e pressione Enter para buscar' : '');
    }
    const ident = document.getElementById('vos-item-ident');
    if (ident && recarga) ident.closest('label')?.classList.add('hidden');
    else if (ident) ident.closest('label')?.classList.remove('hidden');
    ['vos-item-pe', 'vos-item-ps'].forEach(id => {
      const el = document.getElementById(id);
      const lab = el && el.closest('label');
      if (lab) lab.classList.toggle('hidden', recarga);
    });
    const sit = document.getElementById('vos-item-sit');
    if (sit && recarga) sit.closest('label')?.classList.add('hidden');
    else if (sit) sit.closest('label')?.classList.remove('hidden');
    let btn = document.getElementById('vos-btn-cadastrar-etiqueta');
    if (recarga) {
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'vos-btn-cadastrar-etiqueta';
        btn.type = 'button';
        btn.className = 'hidden h-[38px] px-3 rounded-xl bg-[#0a1e8a] text-white text-[11px] font-bold';
        btn.textContent = 'Cadastrar esta etiqueta';
        btn.onclick = function(e) { e.preventDefault(); window.vosCadastrarEtiquetaRecarga(); };
        extra?.appendChild(btn);
      }
    } else if (btn) btn.classList.add('hidden');
  }
  const _origOnTipo = window.vosOnTipoItem;
  window.vosOnTipoItem = function() {
    if (_origOnTipo) _origOnTipo.apply(this, arguments);
    aplicarLayoutRecargaToner();
  };

  window.vosCadastrarEtiquetaRecarga = function() {
    if (!validarClienteVendaAviso()) return;
    const etq = txt(document.getElementById('vos-item-cartucho')?.value);
    if (!etq) {
      if (typeof window.lfbAlert === 'function') window.lfbAlert('Informe o número da etiqueta para cadastrar.', 'Etiqueta');
      return;
    }
    const existente = acharRecargaPorEtiqueta(etq);
    if (existente) {
      if (typeof window.lfbAlert === 'function') window.lfbAlert('Esta etiqueta já está cadastrada. Use Enter para buscar.', 'Etiqueta');
      return;
    }
    const desc = txt(document.getElementById('vos-prod-search')?.value) || 'Recarga de toner';
    const valor = n(document.getElementById('vos-item-vunit')?.value, 0);
    const cli = window.__vosForm && window.__vosForm.cliente;
    recargasStore().push({
      id: (typeof uid === 'function' ? uid('etq') : 'etq_' + Date.now()),
      etiqueta: etq,
      descricao: desc,
      valor,
      clienteId: cli ? cli.id : null,
      clienteNome: cli ? (cli.nome || '') : '',
      criadoEm: new Date().toISOString()
    });
    if (typeof saveDB === 'function') saveDB();
    const btn = document.getElementById('vos-btn-cadastrar-etiqueta');
    if (btn) btn.classList.add('hidden');
    if (typeof window.lfbAlert === 'function') window.lfbAlert('Etiqueta cadastrada. Ao faturar a venda ela fica salva no cliente.', 'Etiqueta cadastrada');
    else if (typeof toast === 'function') toast('Etiqueta cadastrada', 'success');
  };

  window.vosBuscarEtiquetaNaVenda = function() {
    if (!ehTipoRecargaToner()) return;
    if (!validarClienteVendaAviso()) return;
    const etq = txt(document.getElementById('vos-item-cartucho')?.value);
    if (!etq) return;
    const rec = acharRecargaPorEtiqueta(etq);
    const btn = document.getElementById('vos-btn-cadastrar-etiqueta');
    if (!rec) {
      if (btn) btn.classList.remove('hidden');
      if (typeof window.lfbAlert === 'function') {
        window.lfbAlert('Etiqueta não encontrada. Preencha descrição e valor e clique em "Cadastrar esta etiqueta".', 'Etiqueta não encontrada');
      }
      return;
    }
    if (btn) btn.classList.add('hidden');
    const cliAtual = window.__vosForm && window.__vosForm.cliente;
    const outro = rec.clienteId && cliAtual && rec.clienteId !== cliAtual.id;
    const preencher = () => {
      const descEl = document.getElementById('vos-prod-search');
      const vu = document.getElementById('vos-item-vunit');
      const cart = document.getElementById('vos-item-cartucho');
      if (descEl) descEl.value = rec.descricao || '';
      if (vu) vu.value = rec.valor || 0;
      if (cart) cart.value = rec.etiqueta || etq;
      if (typeof window.vosItemCalcTotal === 'function') window.vosItemCalcTotal();
    };
    if (outro) {
      const nomeOutro = rec.clienteNome || 'outro cliente';
      const msg = 'Essa recarga está cadastrada em outro cliente (' + nomeOutro + '). Deseja usar os dados desta etiqueta sem trocar o cliente atual?';
      if (typeof window.confirmSistema === 'function') {
        window.confirmSistema(msg, 'Etiqueta de outro cliente').then(ok => { if (ok) preencher(); });
      } else preencher();
      return;
    }
    preencher();
  };

  document.addEventListener('keydown', function(ev) {
    if (ev.key !== 'Enter') return;
    const active = document.activeElement;
    if (active && active.id === 'vos-item-cartucho' && ehTipoRecargaToner()) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      window.vosBuscarEtiquetaNaVenda();
    }
  }, true);

  function persistirRecargasAoFaturar(v) {
    if (!v || !v.clienteId) return;
    const cli = (db.clientes || []).find(c => c.id === v.clienteId);
    (v.itens || []).forEach(it => {
      if (!/recarga/i.test(it.tipo || '')) return;
      const etq = txt(it.numCartucho || it.identificacao);
      if (!etq) return;
      const lista = recargasStore();
      let rec = lista.find(r => normEtq(r.etiqueta) === normEtq(etq));
      if (!rec) {
        rec = { id: (typeof uid === 'function' ? uid('etq') : 'etq_' + Date.now()), etiqueta: etq };
        lista.push(rec);
      }
      rec.descricao = it.descricao || rec.descricao || 'Recarga de toner';
      rec.valor = n(it.preco, rec.valor || 0);
      rec.clienteId = v.clienteId;
      rec.clienteNome = cli ? cli.nome : (rec.clienteNome || '');
      rec.ultimaVendaId = v.id;
      rec.ultimaVendaNumero = v.numero;
      rec.atualizadoEm = new Date().toISOString();
    });
    if (typeof saveDB === 'function') saveDB();
  }
  const _origFatZero = faturarVendaZeradaDireto;
  faturarVendaZeradaDireto = function(v) {
    _origFatZero(v);
    persistirRecargasAoFaturar(v);
  };
  const _origConcluirFatRec = window.vosConcluirFaturamento;
  window.vosConcluirFaturamento = function() {
    const vId = window.__vosFatVendaId || (window.__vosForm && window.__vosForm.vendaId);
    if (_origConcluirFatRec) _origConcluirFatRec.apply(this, arguments);
    const v = vId && (db.vendas || []).find(x => x.id === vId);
    if (v) persistirRecargasAoFaturar(v);
  };


  // 6) Lápis ao lado da lixeira para editar o item sem cadastrar de novo
  const _origRenderItens = window.vosRenderItens;
  window.vosRenderItens = function() {
    if (_origRenderItens) _origRenderItens.apply(this, arguments);
    const body = document.getElementById('vos-itens-body');
    if (!body) return;
    body.querySelectorAll('tr').forEach((tr, i) => {
      const td = tr.querySelector('td:last-child');
      if (!td || td.querySelector('[data-vos-edit]')) return;
      if (!tr.querySelector('button')) return;
      const btn = document.createElement('button');
      btn.setAttribute('data-vos-edit', '1');
      btn.type = 'button';
      btn.className = 'w-7 h-7 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 mr-1';
      btn.title = 'Editar item';
      btn.innerHTML = '<i class="ph ph-pencil-simple"></i>';
      btn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); window.vosEditarItem(i); };
      const trash = td.querySelector('button');
      if (trash) td.insertBefore(btn, trash);
      else td.appendChild(btn);
    });
  };

  window.vosEditarItem = function(i) {
    const f = window.__vosForm;
    const it = f && f.itens && f.itens[i];
    if (!it) return;
    const tipoEl = document.getElementById('vos-item-tipo');
    if (tipoEl) {
      tipoEl.value = /recarga/i.test(it.tipo || '') ? 'Recarga de toner' : 'Produto';
      if (typeof window.vosOnTipoItem === 'function') window.vosOnTipoItem();
    }
    const setv = (id, v) => { const el = document.getElementById(id); if (el) el.value = v == null ? '' : v; };
    setv('vos-prod-search', it.descricao || '');
    setv('vos-item-qtd', it.qtd || 1);
    setv('vos-item-vunit', it.preco || 0);
    setv('vos-item-desc', it.desconto || 0);
    setv('vos-item-cartucho', it.numCartucho || '');
    setv('vos-item-ident', it.identificacao || '');
    setv('vos-item-sit', it.situacao || 'Pendente');
    setv('vos-item-tec', it.tecnico || '');
    const pe = document.getElementById('vos-item-pe'); if (pe) pe.checked = !!it.pe;
    const ps = document.getElementById('vos-item-ps'); if (ps) ps.checked = !!it.ps;
    if (it.produtoId) {
      const p = (db.produtos || []).find(x => x.id === it.produtoId);
      if (p) f.produtoSel = p;
    } else {
      f.produtoSel = null;
    }
    if (typeof window.vosItemCalcTotal === 'function') window.vosItemCalcTotal();
    f.itens.splice(i, 1);
    marcarVendaSuja();
    window.vosRenderItens();
    if (typeof window.vosResumoVenda === 'function') window.vosResumoVenda();
    document.getElementById('vos-prod-search')?.focus();
  };

  // 7) Tipo só Produto e Recarga de toner
  function aplicarTiposVenda() {
    const sel = document.getElementById('vos-item-tipo');
    if (!sel) return;
    const atual = sel.value;
    sel.innerHTML = '<option value="Produto">Produto</option><option value="Recarga de toner">Recarga de toner</option>';
    sel.value = /recarga/i.test(atual) ? 'Recarga de toner' : 'Produto';
    if (typeof window.vosOnTipoItem === 'function') window.vosOnTipoItem();
  }
  const _nvTipos = window.novaVenda;
  window.novaVenda = function() {
    const r = _nvTipos ? _nvTipos.apply(this, arguments) : undefined;
    aplicarTiposVenda();
    return r;
  };

  // 8) Vendas mais rápida: clicar na linha NÃO redesenha a tabela inteira
  function otimizarCliqueVendas() {
    const view = document.getElementById('view-vendas');
    if (!view || view.classList.contains('hidden')) return;
    const tabela = view.querySelector('table.neo-table');
    if (!tabela || tabela.__vosClickOpt) return;
    tabela.__vosClickOpt = true;
    tabela.addEventListener('click', function(e) {
      const tr = e.target.closest('tbody tr');
      if (!tr || e.target.closest('input,button,a')) return;
      const id = tr.querySelector('input[name="venda-check-lote"]')?.value
        || (tr.getAttribute('onclick') || '').match(/'([^']+)'/)?.[1];
      if (!id) return;
      e.stopPropagation();
      window.neoVendaSelecionada = id;
      tabela.querySelectorAll('tbody tr').forEach(r => r.classList.remove('neo-selected'));
      tr.classList.add('neo-selected');
    }, true);
  }
  const _rvOpt = window.renderVendas;
  window.renderVendas = function() {
    const ret = _rvOpt ? _rvOpt.apply(this, arguments) : undefined;
    setTimeout(otimizarCliqueVendas, 0);
    return ret;
  };
  setTimeout(otimizarCliqueVendas, 400);

  console.log('[DIGICOPY] vendas_notinhas_fix_patch.js v5.15.2 — cancelar não apaga venda já salva');
})();
