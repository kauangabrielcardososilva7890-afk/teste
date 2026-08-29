// PATCH v5.22.54 — Integração oficial da página de orçamento no Cloudflare Pages: https://digicopy-orcamentos.pages.dev/
(function(){
  'use strict';

  var VERSAO = '5.22.54';
  if(typeof window !== 'undefined'){
    window.DIGICOPY_APP_VERSION = window.DIGICOPY_APP_VERSION || VERSAO;
  }

  var PAGINA_PAGES = 'https://digicopy-orcamentos.pages.dev/';
  var PAGINA_FALLBACK = 'https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/orcamento_pagar.html';

  function txt(v){ return String(v == null ? '' : v).trim(); }
  function n(v){ var x = Number(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : 0; }

  function payloadDe(o, cli, emp){
    return {
      t: o && o.token || '',
      n: o && o.numero || '',
      c: (cli && (cli.nome || cli.fantasia)) || (o && o.clienteNome) || '',
      dt: String(o && (o.data || o.criadoEm) || '').slice(0, 10),
      tot: n(o && o.total),
      w: (emp && (emp.whatsapp || emp.telefone)) || (o && o.lojaWhatsapp) || '',
      it: ((o && o.itens) || []).map(function(it){
        return { d: it.descricao || '', q: it.qtd, p: it.preco, s: it.subtotal };
      })
    };
  }

  function b64url(obj){
    var j = JSON.stringify(obj || {});
    var b = btoa(unescape(encodeURIComponent(j)));
    return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function linkOrcamento(o, cli, emp){
    var token = txt(o && o.token);
    var d = b64url(payloadDe(o, cli || {}, emp || {}));
    var qs = ['v=' + encodeURIComponent(VERSAO)];
    if(token) qs.push('c=' + encodeURIComponent(token));
    if(d) qs.push('d=' + encodeURIComponent(d));
    return PAGINA_PAGES + '?' + qs.join('&');
  }

  var ORCAMENTOS_PAGES_V52254_PURE = {
    VERSAO: VERSAO,
    PAGINA_PAGES: PAGINA_PAGES,
    PAGINA_FALLBACK: PAGINA_FALLBACK,
    linkOrcamento: linkOrcamento
  };

  if(typeof window !== 'undefined'){
    window.ORCAMENTOS_PAGES_V52254_PURE = ORCAMENTOS_PAGES_V52254_PURE;

    if(window.__v52254_pages_loaded) return;
    window.__v52254_pages_loaded = true;

    // Atualiza instâncias anteriores de gerador de link
    if(window.ORCAMENTOS_V52238_PURE){
      window.ORCAMENTOS_V52238_PURE.PAGINA = PAGINA_PAGES;
      window.ORCAMENTOS_V52238_PURE.linkOrcamento = linkOrcamento;
    }
    if(window.ORCAMENTOS_V52240_PURE){
      window.ORCAMENTOS_V52240_PURE.PAGINA = PAGINA_PAGES;
      window.ORCAMENTOS_V52240_PURE.linkDe = linkOrcamento;
    }
    if(window.RELATORIO_V52249_PURE){
      window.RELATORIO_V52249_PURE.PAGINA = PAGINA_PAGES;
      window.RELATORIO_V52249_PURE.linkOrcamento = linkOrcamento;
    }
    if(window.ORCAMENTOS_APROVACAO_PURE){
      window.ORCAMENTOS_APROVACAO_PURE.PAGES = PAGINA_PAGES;
      window.ORCAMENTOS_APROVACAO_PURE.linkPublico = function(tokenOuO, cli){
        if(tokenOuO && typeof tokenOuO === 'object') return linkOrcamento(tokenOuO, cli || {}, {});
        var qs = ['v=' + encodeURIComponent(VERSAO)];
        if(tokenOuO) qs.push('c=' + encodeURIComponent(tokenOuO));
        return PAGINA_PAGES + '?' + qs.join('&');
      };
    }

    // Intercepta geração do HTML da notinha/impressão do orçamento
    if(typeof window.gerarHtmlOrcamento === 'function' && !window.gerarHtmlOrcamento.__v52254pages){
      var oldHtml = window.gerarHtmlOrcamento;
      window.gerarHtmlOrcamento = function(id){
        var html = oldHtml.apply(this, arguments);
        if(!html) return html;
        var _db = window.db || (typeof db !== 'undefined' ? db : null) || {};
        var o = (_db.orcamentos || []).find(function(x){ return x && x.id === id; });
        if(!o) return html;
        var cli = (_db.clientes || []).find(function(c){ return c.id === o.clienteId; }) || {};
        var emp = (_db.config && _db.config.empresa) || {};
        var s = typeof getSession === 'function' ? getSession() : null;
        var e = s && (_db.empresas || []).find(function(x){ return x.id === s.empresaId; });
        if(e) emp = Object.assign({}, emp, e);
        var link = linkOrcamento(o, cli, emp);
        html = html.replace(/https:\/\/digicopy-orcament\.pages\.dev\/[^"'<\s]*/g, link);
        html = html.replace(/https:\/\/digicopy-pix\.pages\.dev\/orcamento\.html[^"'<\s]*/g, link);
        html = html.replace(/https:\/\/raw\.githack\.com\/[^"'<\s]*orcamento_pagar\.html[^"'<\s]*/g, link);
        return html;
      };
      window.gerarHtmlOrcamento.__v52254pages = true;
    }

    // Sincroniza rodapé e cabeçalho com a versão garantida
    function sincronizarRodape(){
      try{
        if(typeof document === 'undefined') return;
        var curV = (typeof window !== 'undefined' && window.DIGICOPY_APP_VERSION) || VERSAO;
        var fv = document.getElementById('footer-version');
        if(fv && fv.textContent !== 'v' + curV) fv.textContent = 'v' + curV;
        var tv = document.getElementById('app-title-version');
        if(tv && tv.textContent !== 'Sistema Digicopy v' + curV) tv.textContent = 'Sistema Digicopy v' + curV;
        if(document.title && !document.title.includes(curV)){
          document.title = 'Sistema Digicopy v' + curV;
        }
      }catch(e){}
    }

    window.__digicopySincronizarVersao = sincronizarRodape;

    // Hook no navigateTo para manter a versão 5.22.54 em qualquer troca de tela / menu
    if(typeof window.navigateTo === 'function' && !window.navigateTo.__v52254nav){
      var oldNav = window.navigateTo;
      window.navigateTo = function(view){
        var r = oldNav.apply(this, arguments);
        try{ sincronizarRodape(); }catch(e){}
        return r;
      };
      window.navigateTo.__v52254nav = true;
    }

    sincronizarRodape();
    setTimeout(sincronizarRodape, 100);
    setTimeout(sincronizarRodape, 500);
    setTimeout(sincronizarRodape, 1500);

    console.log('[DIGICOPY] v' + VERSAO + ': Orçamento integrado no Cloudflare Pages (https://digicopy-orcamentos.pages.dev/)');
  }

  if(typeof module !== 'undefined' && module.exports){
    module.exports = { ORCAMENTOS_PAGES_V52254_PURE: ORCAMENTOS_PAGES_V52254_PURE };
  }
})();
