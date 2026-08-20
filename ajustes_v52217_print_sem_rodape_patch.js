// ═══════════════════════════════════════════════════════════════════════════
// v5.22.17 — Tira o rodapé da loja em toda impressão/PDF
// (o bloco cinza com razão, CNPJ e endereço que caía na outra metade da folha)
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function tirarRodapeLoja(html){
  if(!html || typeof html!=='string') return html;
  return html.replace(/<div[^>]*rodape-loja-final[^>]*>[\s\S]*?<\/div>/gi,'');
}

window.PRINT_SEM_RODAPE_PURE = { tirarRodapeLoja: tirarRodapeLoja };

if(typeof document==='undefined') return;

if(window.AJUSTES_POS_FINAL_PURE && typeof window.AJUSTES_POS_FINAL_PURE.patchHtmlImpressao==='function' && !window.AJUSTES_POS_FINAL_PURE.patchHtmlImpressao.__v52217){
  var oldPatch=window.AJUSTES_POS_FINAL_PURE.patchHtmlImpressao;
  window.AJUSTES_POS_FINAL_PURE.patchHtmlImpressao=function(html){
    return tirarRodapeLoja(oldPatch.apply(this, arguments));
  };
  window.AJUSTES_POS_FINAL_PURE.patchHtmlImpressao.__v52217=true;
}

var oldOpen=window.open;
if(typeof oldOpen==='function' && !oldOpen.__v52217rodape){
  window.open=function(){
    var w=oldOpen.apply(window, arguments);
    try{
      if(w && w.document && w.document.write){
        var ow=w.document.write.bind(w.document);
        w.document.write=function(html){
          if(typeof html==='string') html=tirarRodapeLoja(html);
          return ow(html);
        };
      }
    }catch(e){}
    return w;
  };
  window.open.__v52217rodape=true;
}

if(typeof window.vosGerarHtmlNotinha==='function' && !window.vosGerarHtmlNotinha.__v52217rodape){
  var oldVos=window.vosGerarHtmlNotinha;
  window.vosGerarHtmlNotinha=function(){
    return tirarRodapeLoja(oldVos.apply(this, arguments));
  };
  window.vosGerarHtmlNotinha.__v52217rodape=true;
}

console.log('[DIGICOPY] v5.22.17 impressão sem rodapé da loja na outra metade');
})();
