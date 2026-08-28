// ═══════════════════════════════════════════════════════════════════════════
// v5.22.35 — Na tela aparece Código, não SKU
// • Só o texto. O campo interno continua sku.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function textoCodigo(v){
  return String(v==null?'':v)
    .replace(/Código\s*\/\s*SKU/gi,'Código')
    .replace(/Total SKUs/gi,'Total de produtos')
    .replace(/SKU:/g,'Código:')
    .replace(/\bSKU\b/g,'Código')
    .replace(/\bsku\b/g,'código');
}

window.CODIGO_SEM_SKU_PURE = { textoCodigo: textoCodigo };

if(typeof document==='undefined') return;

function trocarNo(el){
  if(!el) return;
  if(el.nodeType===3){
    if(el.nodeValue && /SKU|sku/.test(el.nodeValue)) el.nodeValue=textoCodigo(el.nodeValue);
    return;
  }
  if(el.getAttribute && el.getAttribute('placeholder') && /SKU|sku/.test(el.getAttribute('placeholder'))){
    el.setAttribute('placeholder', textoCodigo(el.getAttribute('placeholder')));
  }
  if(el.title && /SKU|sku/.test(el.title)) el.title=textoCodigo(el.title);
  var kids=el.childNodes;
  for(var i=0;i<kids.length;i++) trocarNo(kids[i]);
}

function aplicar(){
  ['view-produtos','view-vendas','view-config','modal-box','modal-body','modal-title'].forEach(function(id){
    trocarNo(document.getElementById(id));
  });
}

function wrap(nome){
  var fn=window[nome];
  if(typeof fn!=='function' || fn.__v52235sku) return;
  var old=fn;
  window[nome]=function(){
    var r=old.apply(this, arguments);
    setTimeout(aplicar, 40);
    setTimeout(aplicar, 220);
    return r;
  };
  window[nome].__v52235sku=true;
}

['renderProdutos','renderVendas','renderConfig','openModal'].forEach(wrap);

if(typeof window.vosGerarHtmlNotinha==='function' && !window.vosGerarHtmlNotinha.__v52235sku){
  var oldN=window.vosGerarHtmlNotinha;
  window.vosGerarHtmlNotinha=function(){
    var html=oldN.apply(this, arguments);
    return typeof html==='string' ? textoCodigo(html) : html;
  };
  window.vosGerarHtmlNotinha.__v52235sku=true;
}

setTimeout(aplicar, 600);
console.log('[DIGICOPY] v5.22.35 código no lugar de SKU');
})();
