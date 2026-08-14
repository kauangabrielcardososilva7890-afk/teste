// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.15 — Pix com comprovante manual
// • Mantém QR Pix com valor exato da notinha
// • Remove baixa automática do Pix
// • Mostra aviso para enviar comprovante no WhatsApp da loja
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function aviso(msg, type){ if(typeof toast === 'function') toast(msg, type || 'info'); }
function salvar(){ if(typeof saveDB === 'function') saveDB(); }
function vendaPorId(id){ return (db.vendas || []).find(v => v.id === id) || null; }
function ehPix(v){ return String((v && v.formaPagamento) || '').toLowerCase() === 'pix'; }
function textoAviso(){ return 'Pix gerado com valor exato. Peça para o cliente mandar o comprovante no WhatsApp da DIGICOPY antes de dar baixa.'; }
function reabrirTituloPix(vendaId){
  const v = vendaPorId(vendaId);
  if(!v || !ehPix(v)) return 0;
  let alterados = 0;
  (db.contasReceber || []).forEach(cr => {
    if(cr.vendaId !== vendaId) return;
    if(cr.autoBaixa || cr.status === 'pago'){
      cr.status = 'aberto';
      cr.pagamentoData = null;
      cr.autoBaixa = false;
      cr.observacao = textoAviso();
      alterados++;
    }
  });
  if(alterados){
    salvar();
    if(typeof renderFinanceiro === 'function') renderFinanceiro();
    if(typeof renderAuditoria === 'function') renderAuditoria();
  }
  return alterados;
}

window.PIX_MANUAL_PURE = { textoAviso, reabrirTituloPix };

if(typeof window === 'undefined') return;

const oldConcluir = window.vosConcluirFaturamento;
window.vosConcluirFaturamento = function(vendaId){
  const forma = document.getElementById('vos-forma')?.value || '';
  const ret = oldConcluir ? oldConcluir.apply(this, arguments) : undefined;
  if(forma === 'Pix'){
    setTimeout(() => {
      reabrirTituloPix(vendaId);
      aviso(textoAviso(), 'info');
    }, 60);
  }
  return ret;
};

const oldPixPainel = window.pixRenderPainelFaturamento;
window.pixRenderPainelFaturamento = function(){
  const ret = oldPixPainel ? oldPixPainel.apply(this, arguments) : undefined;
  setTimeout(() => {
    const host = document.getElementById('vos-pix-panel');
    if(host && !document.getElementById('pix-aviso-comprovante')){
      host.insertAdjacentHTML('beforeend', `<div id="pix-aviso-comprovante" class="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[12px] text-amber-900"><b>Atenção:</b> ${textoAviso()}</div>`);
    }
  }, 30);
  return ret;
};

const oldHtmlNotinha = window.vosGerarHtmlNotinha;
window.vosGerarHtmlNotinha = function(vendaId, opts){
  let html = oldHtmlNotinha ? oldHtmlNotinha.apply(this, arguments) : null;
  const v = vendaPorId(vendaId);
  if(html && ehPix(v) && !html.includes('comprovante no WhatsApp')){
    const bloco = `<div style="margin:8px 0;padding:8px;border:1px solid #f59e0b;background:#fffbeb;border-radius:8px;font-size:11px;color:#92400e"><b>Pix:</b> valor exato da notinha. Envie o comprovante no WhatsApp da DIGICOPY para baixa manual.</div>`;
    html = html.replace('</body>', bloco + '</body>');
  }
  return html;
};

console.log('[DIGICOPY] pix_comprovante_manual_patch.js v4.9.15 carregado');
})();
