// ═══════════════════════════════════════════════════════════════════════════
// v5.22.11 — uma logo só na impressão (notinha, leitura, chamado, relatório)
// • Tira a logo extra que ia para o topo e comia espaço
// • Se o documento já tem a logo da loja, não coloca outra
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function jaTemLogoPropria(html){
  const s=String(html||'').replace(/<img[^>]*class=["']logo-rel["'][^>]*>/gi,'');
  if(/class=["']logo["']/.test(s)) return true;
  if(/<img[^>]*(logo\.png|logo_2\.png|data:image|alt=["']logo["'])/i.test(s)) return true;
  return false;
}
function limparLogoImpressao(html){
  if(!html||typeof html!=='string') return html;
  if(/\{\\rtf/i.test(html.slice(0,50))) return html;
  const temRel=/class=["']logo-rel["']/.test(html);
  if(!temRel) return html;
  const qtdImg=(html.match(/<img\b/gi)||[]).length;
  if(jaTemLogoPropria(html)||qtdImg>1){
    return html.replace(/<img[^>]*class=["']logo-rel["'][^>]*>\s*/gi,'');
  }
  return html;
}

window.LOGO_IMPRESSAO_PURE={ jaTemLogoPropria, limparLogoImpressao };

if(typeof document==='undefined') return;

function aplicarNaJanela(w){
  if(!w||!w.document||typeof w.document.write!=='function') return;
  if(w.document.write.__v52211) return;
  const ow=w.document.write.bind(w.document);
  w.document.write=function(html){
    if(typeof html==='string') html=limparLogoImpressao(html);
    return ow(html);
  };
  w.document.write.__v52211=true;
}

const _open=window.open;
window.open=function(){
  const w=_open?_open.apply(this,arguments):null;
  try{ aplicarNaJanela(w); }catch(e){}
  return w;
};

['imprimirNotinha','imprimirLeituraContrato','imprimirRelatorioLeiturasPDF','imprimirContratoLocacaoOperacional','imprimirChamadoPDF','vosGerarHtmlNotinha'].forEach(function(nome){
  const orig=window[nome];
  if(typeof orig!=='function'||orig.__v52211) return;
  if(nome==='vosGerarHtmlNotinha'){
    window[nome]=function(){
      const html=orig.apply(this,arguments);
      return limparLogoImpressao(html);
    };
  }else{
    window[nome]=function(){
      const prev=window.open;
      window.open=function(){
        const w=prev.apply(this,arguments);
        try{ aplicarNaJanela(w); }catch(e){}
        return w;
      };
      try{ return orig.apply(this,arguments); }
      finally{ window.open=prev; }
    };
  }
  window[nome].__v52211=true;
});

console.log('[DIGICOPY] v5.22.11 logo única na impressão');
})();
