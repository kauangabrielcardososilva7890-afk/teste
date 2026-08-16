// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.0 — dica de impressão no navegador (Ctrl+P) + reforço no Electron
// • No programa (.exe/Electron): o Ctrl+P já é interceptado no main.js e imprime
//   LIMPO (sem URL nem contador de páginas).
// • No navegador (GitHack): o Ctrl+P abre a janela de impressão do navegador,
//   que é controlada pelo navegador (o link e o "Página X de Y" só saem
//   desmarcando "Cabeçalhos e rodapés"). Aqui mostramos um aviso lembrando isso.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

if(typeof window === 'undefined' || typeof document === 'undefined') return;

let __dicaMostrada = false;

function dicaImpressao(msg){
  try{
    if(typeof window.lfbCornerToast === 'function'){ window.lfbCornerToast(msg); return; }
    if(typeof toast === 'function'){ toast(msg, 'info'); return; }
  }catch(e){}
}

document.addEventListener('keydown', function(e){
  const k = String(e.key || '').toLowerCase();
  if(!((e.ctrlKey || e.metaKey) && k === 'p')) return;

  // No Electron, o main.js já intercepta e imprime limpo. Reforço via preload.
  if(window.printAPI && window.printAPI.isElectron){
    e.preventDefault();
    try{ window.printAPI.cleanPrint(); }catch(err){}
    return;
  }

  // No navegador: deixa abrir a janela, mas avisa como tirar link + contador.
  if(!__dicaMostrada){
    __dicaMostrada = true;
    setTimeout(function(){
      dicaImpressao('No navegador, desmarque "Cabeçalhos e rodapés" na janela de impressão para tirar o link e o número de páginas.');
    }, 300);
  }
}, true);

console.log('[DIGICOPY] ajustes_v5190_patch.js');
})();
