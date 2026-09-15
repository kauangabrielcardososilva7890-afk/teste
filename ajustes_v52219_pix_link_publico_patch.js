// ═══════════════════════════════════════════════════════════════════════════
// v5.22.19 — Link do comprovante/página Pix não depende do GitHack
// O PDF usa a URL pública da nuvem. Se o repositório ficar privado, o cliente
// ainda abre a página de pagamento. No .exe a página local continua existindo.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var PIX_PUBLICO = 'https://digicopy-sync-api.kauangabrielcardososilva7890.workers.dev/pix';

function pixUrlPublico(payload){
  return PIX_PUBLICO + '?c=' + encodeURIComponent(String(payload||''));
}

window.PIX_LINK_PUBLICO_PURE = {
  PIX_PUBLICO: PIX_PUBLICO,
  pixUrlPublico: pixUrlPublico
};

if(typeof document==='undefined') return;

window.PIX_PAGAR_PUBLICO = PIX_PUBLICO;
window.pixPagamentoUrl = function(payload){
  return pixUrlPublico(payload);
};

console.log('[DIGICOPY] v5.22.19 PIX: página de pagamento na nuvem, sem GitHack');
})();
