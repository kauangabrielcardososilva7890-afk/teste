// DIGICOPY ERP — Extras de vendas — v4.7.0
// 1) Número da notinha sem prefixo ("VD-2026-0081" vira "2026-0081") nas telas
// 2) "Refazer faturamento": cliente disse que ia pagar no Pix mas mudou a forma?
//    Reabre a venda e o faturamento pode ser refeito com outra forma de pagamento
//    (o QR antigo simplesmente deixa de valer — ele é gerado na hora, nada fica gravado)
(function(){
'use strict';

/* EXTRA_PURE_START */
const EXTRA_PURE = (function(){
  // Tira o prefixo de letras do número para exibição: "VD-000123"→"000123", "VENDA-55"→"55"
  function numeroVisivel(n){
    const original = String(n==null?'':n).trim();
    const limpo = original.replace(/^[A-Za-zÀ-ÿ]+[-_./\s]*/, '');
    return limpo || original;
  }
  // Regra do "refazer faturamento": só venda faturada deste ERP e sem título já PAGO.
  // Exceção: o título do faturamento À VISTA nasce baixado automaticamente (autoBaixa)
  // — esse pode ser desfeito junto, pois é o próprio registro do recebimento.
  function podeRefaturar(v, contas){
    if(!v) return { ok:false, motivo:'Venda não encontrada' };
    if(v.origemMigracao) return { ok:false, motivo:'Notinha veio do sistema antigo — não pode ser refaturada aqui' };
    if(v.status!=='faturado') return { ok:false, motivo:'Esta venda ainda não foi faturada' };
    const paga = (contas||[]).find(c=>c.vendaId===v.id && c.status==='pago' && !c.autoBaixa);
    if(paga) return { ok:false, motivo:'Há parcela já baixada como paga ('+(paga.descricao||'sem descrição')+'). Estorne a baixa no Financeiro primeiro.' };
    return { ok:true, motivo:'' };
  }
  return { numeroVisivel, podeRefaturar };
})();
/* EXTRA_PURE_END */
window.EXTRA_PURE = EXTRA_PURE;
window.vosNumeroVisivel = EXTRA_PURE.numeroVisivel;

// ═══════════════════════════════════════════════════════════════════════════
// Refazer faturamento (= "deletar o QR" quando o cliente muda a forma de pagamento)
// ═══════════════════════════════════════════════════════════════════════════
window.vosRefaturar = function(vendaId){
  const sess = getSession(); if(!sess) return;
  const v = db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId);
  const r = EXTRA_PURE.podeRefaturar(v, db.contasReceber);
  if(!r.ok){ toast(r.motivo, 'error'); return; }
  const formaAntiga = v.formaPagamento||'—';
  if(!confirm(`Refazer o faturamento da venda ${EXTRA_PURE.numeroVisivel(v.numero)}?\n\nEla foi faturada como "${formaAntiga}".\nOs títulos em aberto ligados a ela serão removidos e você poderá faturar de novo com outra forma de pagamento.`)) return;
  // remove títulos em aberto e também o registro auto-baixado do à vista
  db.contasReceber = (db.contasReceber||[]).filter(c=>!(c.vendaId===v.id && (c.status!=='pago' || c.autoBaixa)));
  v.status = 'aberta';
  v.formaPagamento = null;
  v.parcelas = [];
  delete v.faturadoEm; delete v.faturadoPor;
  logAction('venda','refaturar',v.id,`Venda ${v.numero} teve faturamento desfeito (era ${formaAntiga}) por ${sess.usuarioNome} — cliente mudou a forma de pagamento`);
  saveDB();
  toast('Faturamento desfeito. Escolha a nova forma de recebimento.','success');
  renderVendas(); if(typeof renderFinanceiro==='function') renderFinanceiro();
  vosAbrirRecebimento(v.id); // já abre a tela para faturar de novo
};

// ═══════════════════════════════════════════════════════════════════════════
// Histórico da venda: número curto + aviso de sistema antigo + botão "Refazer"
// ═══════════════════════════════════════════════════════════════════════════
const _xOrigHistorico = window.historicoVenda;
window.historicoVenda = function(id){
  if(_xOrigHistorico) _xOrigHistorico(id);
  const v = db.vendas.find(x=>x.id===id);
  if(!v) return;
  // título e cabeçalho com o número sem prefixo
  const titulo = document.getElementById('modal-title');
  if(titulo) titulo.innerText = 'Histórico — Notinha ' + EXTRA_PURE.numeroVisivel(v.numero);
  const body = document.getElementById('modal-body');
  if(body && v.origemMigracao){
    body.insertAdjacentHTML('afterbegin',
      `<div class="rounded-[12px] border border-purple-200 bg-purple-50 px-3 py-2 text-[12px] text-purple-900 flex items-center gap-2">
        <i class="ph ph-archive text-[15px]"></i> Esta notinha veio do <b>sistema antigo</b> — os dados são resumidos. Dá para imprimir normalmente.
      </div>`);
  }
  // botão "Refazer faturamento" no rodapé (só quando faz sentido)
  const footer = document.getElementById('modal-footer');
  if(footer && !footer.querySelector('[data-refaturar]')){
    const r = EXTRA_PURE.podeRefaturar(v, db.contasReceber);
    if(r.ok){
      const b = document.createElement('button');
      b.setAttribute('data-refaturar','1');
      b.className = 'h-[42px] px-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-bold text-[12.5px] flex items-center gap-2 mr-auto';
      b.innerHTML = '<i class="ph ph-arrow-counter-clockwise"></i> Refazer faturamento';
      b.title = 'Cliente mudou a forma de pagamento? Desfaz o faturamento (e o QR) para faturar de novo';
      b.onclick = function(){ closeModal(); vosRefaturar(v.id); };
      footer.prepend(b);
    }
  }
};

console.log('[DIGICOPY] Extras de vendas v4.7.0 — número curto + refazer faturamento');
})();
