// ═══════════════════════════════════════════════════════════════════════════
// v5.22.49 — Relatório (1.2–1.4, 2.2, 2.3, 3.4, 3.6, 5.1–5.3) de verdade
//            no .exe e no link do cliente.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var VERSAO = '5.22.49';
var PAGINA = 'https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a04e20-teste/orcamento_pagar.html';

function txt(v){ return String(v==null?'':v).trim(); }
function n(v){ var x=Number(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

function payloadDe(o, cli, emp){
  var P = window.ORCAMENTOS_V52238_PURE;
  if(P && typeof P.payloadLink==='function') return P.payloadLink(o, cli, emp);
  return {
    t: o && o.token || '',
    n: o && o.numero || '',
    c: (cli && (cli.nome||cli.fantasia)) || (o && o.clienteNome) || '',
    dt: String(o && (o.data||o.criadoEm) || '').slice(0,10),
    tot: n(o && o.total),
    w: (emp && (emp.whatsapp||emp.telefone)) || (o && o.lojaWhatsapp) || '',
    it: ((o && o.itens) || []).map(function(it){
      return { d: it.descricao||'', q: it.qtd, p: it.preco, s: it.subtotal };
    })
  };
}
function b64url(obj){
  var P = window.ORCAMENTOS_V52238_PURE;
  if(P && typeof P.b64url==='function') return P.b64url(obj);
  var j=JSON.stringify(obj||{});
  var b=btoa(unescape(encodeURIComponent(j)));
  return b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function linkOrcamento(o, cli, emp){
  var token = txt(o && o.token);
  var d = b64url(payloadDe(o, cli||{}, emp||{}));
  var qs = ['v='+encodeURIComponent(VERSAO)];
  if(token) qs.push('c='+encodeURIComponent(token));
  if(d) qs.push('d='+encodeURIComponent(d));
  return PAGINA+'?'+qs.join('&');
}

window.RELATORIO_V52249_PURE = {
  VERSAO: VERSAO,
  PAGINA: PAGINA,
  linkOrcamento: linkOrcamento,
  temCerteza: true,
  linkNaoValeDepois: true,
  autorizarGeraVenda: true
};

if(typeof document==='undefined') return;
if(window.__v52249_relatorio_loaded) return;
window.__v52249_relatorio_loaded = true;

function aplicarLinkOrcamento(){
  if(window.ORCAMENTOS_V52238_PURE){
    window.ORCAMENTOS_V52238_PURE.PAGINA = PAGINA;
    window.ORCAMENTOS_V52238_PURE.linkOrcamento = linkOrcamento;
  }
  if(window.ORCAMENTOS_V52240_PURE){
    window.ORCAMENTOS_V52240_PURE.PAGINA = PAGINA;
    window.ORCAMENTOS_V52240_PURE.linkDe = linkOrcamento;
  }
  if(window.ORCAMENTOS_APROVACAO_PURE){
    window.ORCAMENTOS_APROVACAO_PURE.PAGES = PAGINA;
    window.ORCAMENTOS_APROVACAO_PURE.linkPublico = function(tokenOuO, cli){
      if(tokenOuO && typeof tokenOuO==='object') return linkOrcamento(tokenOuO, cli||{}, {});
      var qs = ['v='+encodeURIComponent(VERSAO)];
      if(tokenOuO) qs.push('c='+encodeURIComponent(tokenOuO));
      return PAGINA+'?'+qs.join('&');
    };
  }
  if(typeof window.gerarHtmlOrcamento==='function' && !window.gerarHtmlOrcamento.__v52249rel){
    var oldHtml = window.gerarHtmlOrcamento;
    window.gerarHtmlOrcamento = function(id){
      var html = oldHtml.apply(this, arguments);
      if(!html) return html;
      var o = (typeof db!=='undefined' && db.orcamentos||[]).find(function(x){ return x && x.id===id; });
      if(!o) return html;
      var cli = (db.clientes||[]).find(function(c){ return c.id===o.clienteId; })||{};
      var emp = (db.config && db.config.empresa) || {};
      var s = typeof getSession==='function' ? getSession() : null;
      var e = s && (db.empresas||[]).find(function(x){ return x.id===s.empresaId; });
      if(e) emp = Object.assign({}, emp, e);
      var link = linkOrcamento(o, cli, emp);
      html = html.replace(/https:\/\/digicopy-orcament\.pages\.dev\/[^"'<\s]*/g, link);
      html = html.replace(/https:\/\/digicopy-pix\.pages\.dev\/orcamento\.html[^"'<\s]*/g, link);
      html = html.replace(/https:\/\/raw\.githack\.com\/[^"'<\s]*orcamento_pagar\.html[^"'<\s]*/g, link);
      html = html.replace(/href="[^"]*orcamento_pagar\.html[^"]*"/g, 'href="'+link.replace(/"/g,'&quot;')+'"');
      return html;
    };
    window.gerarHtmlOrcamento.__v52249rel = true;
  }
}

function telaVenda(){
  return !!(document.getElementById('vos-itens-body') || document.getElementById('vos-cli-search'));
}
function tirarBotaoSair(){
  var foot = document.getElementById('modal-footer');
  if(!foot || !telaVenda()) return;
  foot.querySelectorAll('button').forEach(function(b){
    var t = String(b.textContent||'').replace(/\s+/g,' ').trim();
    if(/^sair$/i.test(t)) b.remove();
  });
}
function gravarVendaEFechar(){
  var f = window.__vosForm;
  if(!f) return false;
  if(!f.cliente){
    if(typeof window.lfbAlert==='function') window.lfbAlert('Escolha o cliente.','Venda');
    else if(typeof toast==='function') toast('Selecione o cliente','error');
    return false;
  }
  var gravar = window.vosGravarVenda;
  if(typeof gravar!=='function'){
    if(typeof window.lfbAlert==='function') window.lfbAlert('Não foi possível gravar a venda.','Venda');
    return false;
  }
  window.__vosIgnorarSair = true;
  var v = gravar(true);
  if(!v){
    window.__vosIgnorarSair = false;
    return false;
  }
  window.__vosPersistida = true;
  window.__vosDirty = false;
  if(typeof toast==='function') toast('Venda '+v.numero+' salva','success');
  if(typeof closeModal==='function') closeModal(true);
  window.__vosIgnorarSair = false;
  if(typeof renderVendas==='function') renderVendas();
  return true;
}
function aplicarVenda(){
  window.vosSalvarVenda = function(){ gravarVendaEFechar(); };
  if(typeof window.imprimirNotinha==='function' && !window.imprimirNotinha.__v52249noprint){
    var oldImp = window.imprimirNotinha;
    window.imprimirNotinha = function(){
      if(window.__vosFatSemPrint) return;
      return oldImp.apply(this, arguments);
    };
    window.imprimirNotinha.__v52249noprint = true;
  }
  if(typeof window.vosConcluirFaturamento==='function' && !window.vosConcluirFaturamento.__v52249noprint){
    var oldFat = window.vosConcluirFaturamento;
    window.vosConcluirFaturamento = function(){
      window.__vosFatSemPrint = true;
      try{ return oldFat.apply(this, arguments); }
      finally{ setTimeout(function(){ window.__vosFatSemPrint = false; }, 800); }
    };
    window.vosConcluirFaturamento.__v52249noprint = true;
  }
  ['novaVenda','vosCarregarVendaNaTela'].forEach(function(nome){
    if(typeof window[nome]!=='function' || window[nome].__v52249sair) return;
    var old = window[nome];
    window[nome] = function(){
      var r = old.apply(this, arguments);
      setTimeout(tirarBotaoSair, 0);
      setTimeout(tirarBotaoSair, 80);
      return r;
    };
    window[nome].__v52249sair = true;
  });
}

function aplicarLeitura(){
  var L = window.LEITURA_APAGAR_V52245_PURE;
  window.deleteLeituraContrato = function(leiId, contratoId){
    var msg = (L && L.mensagem) || 'Deseja apagar essa leitura? Ela fará os contadores voltar ao que estava antes de lançar.';
    var run = function(){
      if(typeof db==='undefined') return;
      var l = (db.leituras||[]).find(function(x){ return x && x.id===leiId; });
      if(l && l.equipamentoId){
        var eq = (db.equipamentos||[]).find(function(e){ return e && e.id===l.equipamentoId; });
        if(eq){
          var next = L && typeof L.contadorDepoisDeApagar==='function' ? L.contadorDepoisDeApagar(eq, l) : eq;
          if(l.contadorPBAnterior!=null && l.contadorPBAnterior!=='') eq.contadorPB = n(l.contadorPBAnterior);
          if(l.contadorCorAnterior!=null && l.contadorCorAnterior!=='') eq.contadorCor = n(l.contadorCorAnterior);
          if(next && next!==eq){
            if(next.contadorPB!=null) eq.contadorPB = next.contadorPB;
            if(next.contadorCor!=null) eq.contadorCor = next.contadorCor;
          }
        }
      }
      db.contasReceber = (db.contasReceber||[]).filter(function(cr){ return !cr || cr.leituraId!==leiId; });
      db.leituras = (db.leituras||[]).filter(function(x){ return x && x.id!==leiId; });
      if(typeof saveDB==='function') saveDB();
      if(typeof abrirLeiturasContrato==='function') abrirLeiturasContrato(contratoId);
      if(typeof renderFinanceiro==='function') renderFinanceiro();
      if(typeof toast==='function') toast('Leitura apagada. Contadores voltaram.','success');
    };
    if(typeof window.confirmSistema==='function'){
      window.confirmSistema(msg,'Apagar leitura').then(function(ok){ if(ok) run(); });
      return;
    }
    run();
  };
}

function refsDoLancamento(c, dbRef){
  var F = window.FINANCEIRO_HIST_DATAS_V52245_PURE;
  if(F && typeof F.refsDoLancamento==='function') return F.refsDoLancamento(c, dbRef);
  return [];
}
function htmlRefs(refs){
  if(!refs || !refs.length) return '';
  var mapa = {venda:'Venda', leitura:'Leitura', chamado:'Chamado'};
  return '<p class="text-[12px] text-slate-600 mt-2">'+refs.map(function(r){
    return (mapa[r.tipo]||r.tipo)+': <b class="text-[#0a1e8a]">'+esc(r.codigo)+'</b>';
  }).join(' • ')+'</p>';
}


function garantirDatas(){
  var view = document.getElementById('view-financeiro');
  if(!view) return;
  var ST = window.__FIN_ST || (window.__FIN_ST = { campo:'nome', q:'', modo:'hoje', de:'', ate:'', tipo:'todos', ordem:'venc-asc' });
  var de = document.getElementById('neo-fin-de');
  var ate = document.getElementById('neo-fin-ate');
  if(!de || !ate){
    var host = view.querySelector('.p-4.border-b') || view;
    var wrap = document.getElementById('v52249-fin-datas');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'v52249-fin-datas';
      wrap.className = 'flex flex-wrap items-center justify-center gap-2';
      wrap.innerHTML = '<label class="text-[11px] font-bold text-slate-500 uppercase">De</label>'
        +'<input id="neo-fin-de" type="date" class="neo-input !w-[150px] !h-9" value="'+esc(ST.de||'')+'">'
        +'<label class="text-[11px] font-bold text-slate-500 uppercase">Até</label>'
        +'<input id="neo-fin-ate" type="date" class="neo-input !w-[150px] !h-9" value="'+esc(ST.ate||'')+'">';
      host.appendChild(wrap);
    }
    de = document.getElementById('neo-fin-de');
    ate = document.getElementById('neo-fin-ate');
  }
  function ligar(el, qual){
    if(!el) return;
    if(el.type==='hidden'){
      el.type = 'date';
      el.className = 'neo-input !w-[150px] !h-9';
    }
    el.disabled = false;
    el.style.display = '';
    el.removeAttribute('hidden');
    if(qual==='de') el.value = ST.de||el.value||'';
    if(qual==='ate') el.value = ST.ate||el.value||'';
    el.onchange = function(){
      if(qual==='de') ST.de = el.value||'';
      else ST.ate = el.value||'';
      if(typeof window.finBuscarV52243==='function') window.finBuscarV52243();
      else if(typeof window.renderFinanceiro==='function') window.renderFinanceiro();
    };
  }
  ligar(de,'de');
  ligar(ate,'ate');
}

function aplicarFinanceiro(){

  if(typeof window.renderFinanceiro==='function' && !window.renderFinanceiro.__v52249datas){
    var oldR = window.renderFinanceiro;
    window.renderFinanceiro = function(){
      var r = oldR.apply(this, arguments);
      try{ garantirDatas(); }catch(e){}
      return r;
    };
    window.renderFinanceiro.__v52249datas = true;
  }
  if(typeof window.historicoLancamento==='function' && !window.historicoLancamento.__v52249hist){
    var oldH = window.historicoLancamento;
    window.historicoLancamento = function(tipo,id){
      var r = oldH.apply(this, arguments);
      try{
        if(typeof db==='undefined') return r;
        var arr = tipo==='cp'?db.contasPagar:db.contasReceber;
        var c = (arr||[]).find(function(x){ return x && x.id===id; });
        var refs = refsDoLancamento(c, db);
        var body = document.getElementById('modal-body');
        if(body && refs.length && !document.getElementById('v52249-fin-refs') && !document.getElementById('v52245-fin-refs')){
          var card = body.querySelector('.neo-card');
          var box = document.createElement('div');
          box.id = 'v52249-fin-refs';
          box.innerHTML = htmlRefs(refs);
          if(card) card.appendChild(box);
          else body.insertBefore(box, body.firstChild);
        }
      }catch(e){}
      return r;
    };
    window.historicoLancamento.__v52249hist = true;
  }
}

function aplicarTudo(){
  aplicarLinkOrcamento();
  aplicarVenda();
  aplicarLeitura();
  aplicarFinanceiro();
}

aplicarTudo();
setTimeout(aplicarTudo, 0);
setTimeout(aplicarTudo, 400);
if(typeof window.navigateTo==='function' && !window.navigateTo.__v52249ver){
  var oldN = window.navigateTo;
  window.navigateTo = function(){
    var r = oldN.apply(this, arguments);
    try{ aplicarTudo(); }catch(e){}
    return r;
  };
  window.navigateTo.__v52249ver = true;
}

console.log('[DIGICOPY] v5.22.49 relatório: orçamento no GitHack + punch list no exe');
})();
