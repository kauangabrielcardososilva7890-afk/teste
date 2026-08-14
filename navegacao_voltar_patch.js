// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.3.9 — Navegação hierárquica completa (4 -> 3 -> 2 -> 1 e sub-menus x.1, x.2)
// • Deleta/neutraliza qualquer duplicação de página ou pilha interna com innerHTML
// • Respeita a cadeia hierárquica: de sub-telas (nível 4 e 3) para o pai, até a lista principal (nível 1)
// • Tecla ESC e botão X do modal executam o retorno hierárquico sem trocar de abas em formulários
// • Quando uma venda/notinha é aberta pelo Financeiro (nível 3.1), fechar/ESC volta para o Financeiro (2.1)
// • Neutraliza redirecionamentos automáticos para "Início" ao fechar modais
// ═══════════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  // 1) Neutraliza redirecionamento automático para "Início" do finalizacao_sistema_patch.js
  window.voltarAbaAnteriorFinal = function() {};
  window.__abaHistFinal = [];

  // 2) Retorno hierárquico limpo (sem duplicação de DOM e sem re-injeção de innerHTML)
  function voltarNivelModal(e) {
    if (window.__lastVoltarTs && (Date.now() - window.__lastVoltarTs < 150)) return;
    window.__lastVoltarTs = Date.now();

    const modal = document.getElementById('modal-root');
    if (!modal || modal.classList.contains('hidden')) return;

    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    // A) Caso especial: Venda de origem (financeiro 3.1) aberta a partir do histórico financeiro (financeiro 2.1)
    if (window.__origemFinanceiroVoltar) {
      const orig = window.__origemFinanceiroVoltar;
      window.__origemFinanceiroVoltar = null;
      if (typeof window.historicoLancamento === 'function') {
        window.historicoLancamento(orig.tipo, orig.id);
        return;
      }
    }

    // B) Procura botões visíveis no footer do modal (ou no topo/corpo se footer estiver vazio)
    const container = document.getElementById('modal-footer') || modal;
    const botoes = Array.from(container.querySelectorAll('button')).filter(b => b.offsetParent !== null);

    // Prioridade 1: Botão Voltar (ex: "← Voltar", "Voltar ao contrato", "Voltar", "Voltar ao histórico") -> Nível 3 para 2
    const btnVoltar = botoes.find(b => /^\s*(←\s*)?voltar/i.test(b.textContent || ''));
    if (btnVoltar) {
      btnVoltar.click();
      return;
    }

    // Prioridade 2: Botão Cancelar (ex: "Cancelar") -> Nível 4 para 3 (ex: Novo chamado no contrato) ou fecha modal 2
    const btnCancelar = botoes.find(b => /^\s*cancelar\s*$/i.test(b.textContent || ''));
    if (btnCancelar) {
      btnCancelar.click();
      return;
    }

    // Prioridade 3: Botão Fechar/Sair (ex: "Fechar", "Sair", "×", "x") -> Nível 2 para 1
    const btnFechar = botoes.find(b => /^\s*(fechar|sair|×|x)\s*$/i.test(b.textContent || ''));
    if (btnFechar && btnFechar !== e?.currentTarget) {
      btnFechar.click();
      return;
    }

    // C) Fallback limpo: fecha o modal de volta à tela inicial do contexto (Nível 1)
    if (typeof window.closeModal === 'function') {
      window.closeModal(true);
    } else {
      modal.classList.add('hidden');
    }
  }

  window.voltarNivelModal = voltarNivelModal;

  // 3) Captura ESC no teclado em WINDOW na fase de captura (capture: true) para executar ANTES de document e patches antigos
  window.addEventListener('keydown', function(ev) {
    if (ev.key === 'Escape' || ev.keyCode === 27) {
      const modal = document.getElementById('modal-root');
      if (modal && !modal.classList.contains('hidden')) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        ev.stopPropagation();
        voltarNivelModal(ev);
      }
    }
  }, true);

  // 4) Associa o X superior do modal (#modal-box > header .ph-x) ao retorno hierárquico
  function patchBotaoXModal() {
    const modal = document.getElementById('modal-root');
    if (!modal) return;
    const btnX = modal.querySelector('#modal-box button i.ph-x')?.closest('button');
    if (btnX && !btnX.__hierPatched) {
      btnX.__hierPatched = true;
      btnX.onclick = function(e) {
        (window.voltarNivelModal || voltarNivelModal)(e);
      };
    }
  }

  try {
    const obs = new MutationObserver(() => patchBotaoXModal());
    obs.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}
  setTimeout(patchBotaoXModal, 300);

  console.log('[DIGICOPY] navegacao_voltar_patch.js v5.3.9 — Hierarquia 4->3->2->1 ativa, sem duplicação');
})();
