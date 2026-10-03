// ═══════════════════════════════════════════════════════════════════════════
// v5.22.19 — Link do comprovante/página Pix não depende do GitHack
// O PDF usa a URL pública da nuvem. Se o repositório ficar privado, o cliente
// ainda abre a página de pagamento. No .exe a página local continua existindo.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var PIX_PUBLICO_OFICIAL = 'https://digicopy-sync-api.digicopyonline.workers.dev/pix';

// r59: o link do pix segue a NUVEM CONFIGURADA (cada cliente tem a sua).
function pixBase(){
  try{
    if(typeof window!=='undefined'&&typeof window.DIGICOPY_API_URL==='function')
      return String(window.DIGICOPY_API_URL()).replace(/\/+$/,'')+'/pix';
  }catch(e){}
  return PIX_PUBLICO_OFICIAL;
}

function pixUrlPublico(payload){
  return pixBase() + '?c=' + encodeURIComponent(String(payload||''));
}

window.PIX_LINK_PUBLICO_PURE = {
  PIX_PUBLICO: PIX_PUBLICO_OFICIAL,
  pixUrlPublico: pixUrlPublico
};

if(typeof document==='undefined') return;

window.PIX_PAGAR_PUBLICO = PIX_PUBLICO_OFICIAL; // retrato da oficial; o fresco sai de pixPagamentoUrl()
window.pixPagamentoUrl = function(payload){
  return pixUrlPublico(payload);
};

console.log('[DIGICOPY] v5.22.19 PIX: página de pagamento na nuvem, sem GitHack');
})();
