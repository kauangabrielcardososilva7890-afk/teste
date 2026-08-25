// ═══════════════════════════════════════════════════════════════════════════
// v5.22.40 — Link público do orçamento no Pages separado do Pix
//            https://digicopy-orcament.pages.dev/
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var PAGINA = 'https://digicopy-orcament.pages.dev/';

function linkDe(o, cli, emp){
  var P = window.ORCAMENTOS_V52238_PURE;
  if(!P || typeof P.payloadLink!=='function' || typeof P.b64url!=='function'){
    return PAGINA;
  }
  return PAGINA+'?d='+encodeURIComponent(P.b64url(P.payloadLink(o, cli, emp)));
}

window.ORCAMENTOS_V52240_PURE = {
  PAGINA: PAGINA,
  linkDe: linkDe
};

if(typeof document==='undefined') return;

if(window.ORCAMENTOS_V52238_PURE){
  window.ORCAMENTOS_V52238_PURE.PAGINA = PAGINA;
  window.ORCAMENTOS_V52238_PURE.linkOrcamento = linkDe;
}
if(window.ORCAMENTOS_APROVACAO_PURE){
  window.ORCAMENTOS_APROVACAO_PURE.PAGES = PAGINA;
  window.ORCAMENTOS_APROVACAO_PURE.linkPublico = function(tokenOuO, cli){
    if(tokenOuO && typeof tokenOuO==='object') return linkDe(tokenOuO, cli||{}, {});
    return PAGINA+'?d=';
  };
}

if(typeof window.gerarHtmlOrcamento==='function' && !window.gerarHtmlOrcamento.__v52240pages){
  var oldHtml=window.gerarHtmlOrcamento;
  window.gerarHtmlOrcamento=function(id){
    var html=oldHtml.apply(this, arguments);
    if(!html) return html;
    var o=(typeof db!=='undefined'&&db.orcamentos||[]).find(function(x){ return x.id===id; });
    if(!o) return html;
    var cli=(db.clientes||[]).find(function(c){ return c.id===o.clienteId; })||{};
    var emp=(db.config&&db.config.empresa)||{};
    var s=typeof getSession==='function'?getSession():null;
    var e=s && (db.empresas||[]).find(function(x){ return x.id===s.empresaId; });
    if(e) emp=Object.assign({}, emp, e);
    var link=linkDe(o, cli, emp);
    html=html.replace(/https:\/\/raw\.githack\.com\/[^"'<\s]*orcamento_pagar\.html[^"'<\s]*/g, link);
    html=html.replace(/https:\/\/digicopy-pix\.pages\.dev\/orcamento\.html[^"'<\s]*/g, link);
    html=html.replace(/href="[^"]*orcamento_pagar\.html[^"]*"/g, 'href="'+link.replace(/"/g,'&quot;')+'"');
    return html;
  };
  window.gerarHtmlOrcamento.__v52240pages=true;
}

console.log('[DIGICOPY] v5.22.40 orçamento no Pages digicopy-orcament.pages.dev');
})();
