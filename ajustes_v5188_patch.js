// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.18.8 (limpo) — logo PADRÃO apenas
// • O upload de "Logo da loja" foi REMOVIDO de vez (o usuário não quer
//   essa opção). Restou apenas a reaplicação da logo padrão (logo.png /
//   logo_data.js) nos chamados, leituras e notinhas.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

if(typeof window === 'undefined') return;

// Guarda a logo padrão (logo_data.js já define window.DIGICOPY_LOGO).
var _ORIGINAL_LOGO = window.DIGICOPY_LOGO;

window.digicopyLogo = function(){
  return _ORIGINAL_LOGO || './logo.png';
};

// Reaplica a logo padrão sempre (não existe mais logo customizada).
function aplicarLogoConfig(){
  if(_ORIGINAL_LOGO){ window.DIGICOPY_LOGO = _ORIGINAL_LOGO; }
}

const _showApp = window.showApp;
if(typeof _showApp === 'function'){
  window.showApp = function(){
    const r = _showApp.apply(this, arguments);
    setTimeout(aplicarLogoConfig, 200);
    return r;
  };
}

setTimeout(aplicarLogoConfig, 800);
setTimeout(aplicarLogoConfig, 2500);

console.log('[DIGICOPY] ajustes_v5188_patch.js (sem upload de logo)');
})();
