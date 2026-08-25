// ═══════════════════════════════════════════════════════════════════════════
// v5.22.38 — Orçamentos: filtro de produto/recarga, avisos, sair pergunta,
//            link SEPARADO do Pix, autorizar/recusar, WhatsApp nos dois
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var PAGINA = 'https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/01a010fa-teste/orcamento_pagar.html';

function txt(v){ return String(v==null?'':v).trim(); }
function n(v){ var x=Number(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(v):('R$ '+(n(v).toFixed(2))); }

function b64url(obj){
  var j=JSON.stringify(obj);
  var b=btoa(unescape(encodeURIComponent(j)));
  return b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function payloadLink(o, cli, emp){
  return {
    t: o && o.token || '',
    n: o && o.numero || '',
    c: (cli && (cli.nome||cli.fantasia)) || o && o.clienteNome || '',
    dt: String(o && (o.data||o.criadoEm) || '').slice(0,10),
    tot: n(o && o.total),
    w: (emp && (emp.whatsapp||emp.telefone)) || o && o.lojaWhatsapp || '',
    it: ((o && o.itens) || []).map(function(it){
      return { d: it.descricao||'', q: it.qtd, p: it.preco, s: it.subtotal };
    })
  };
}

function linkOrcamento(o, cli, emp){
  return PAGINA+'?d='+encodeURIComponent(b64url(payloadLink(o, cli, emp)));
}

function msgRecusa(o, cli){
  return 'Olá, sou '+(txt(cli&&cli.nome)||'cliente')+'. O orçamento do COD '+(txt(o&&o.numero)||'—')+' NÃO foi autorizado. Por favor, entre em contato para alinharmos as opções.';
}

window.ORCAMENTOS_V52238_PURE = {
  PAGINA: PAGINA,
  linkOrcamento: linkOrcamento,
  payloadLink: payloadLink,
  msgRecusa: msgRecusa,
  b64url: b64url
};

if(typeof document==='undefined') return;

function cats(){
  var P=window.FILTROS_BUSCA_PURE;
  return (P && P.CATS_PRODUTO) || ['Produto','Serviço','Cartucho','Insumo','Equipamento'];
}
function camposRec(){
  var P=window.FILTROS_BUSCA_PURE;
  return (P && P.CAMPOS_RECARGA) || [['todos','Pesquisar recarga'],['codigo','Código'],['nome','Descrição']];
}

function ehRecargaOrc(){
  return /recarga/i.test(String((document.getElementById('orc-item-tipo')||{}).value||''));
}

function injetarFiltrosOrc(){
  var prod=document.getElementById('orc-prod-search');
  if(!prod) return;
  var rec=ehRecargaOrc();
  if(!document.getElementById('orc-prod-cat')){
    var cat=document.createElement('select');
    cat.id='orc-prod-cat';
    cat.className='h-[40px] px-2 rounded-xl border bg-white text-[12px] min-w-[148px]';
    cat.innerHTML='<option value="">Todas categorias</option>'+cats().map(function(c){ return '<option value="'+esc(c)+'">'+esc(c)+'</option>'; }).join('');
    prod.parentNode.insertBefore(cat, prod);
  }
  if(!document.getElementById('orc-rec-campo')){
    var rc=document.createElement('select');
    rc.id='orc-rec-campo';
    rc.className='h-[40px] px-2 rounded-xl border bg-white text-[12px] min-w-[148px]';
    rc.innerHTML=camposRec().map(function(it){ return '<option value="'+esc(it[0])+'">'+esc(it[1])+'</option>'; }).join('');
    prod.parentNode.insertBefore(rc, prod);
  }
  var catEl=document.getElementById('orc-prod-cat');
  var recEl=document.getElementById('orc-rec-campo');
  if(catEl) catEl.style.display=rec?'none':'';
  if(recEl) recEl.style.display=rec?'':'none';
  prod.placeholder=rec?'Busque a recarga (Enter ou lupa)…':'Digite e Enter / lupa';

  var extra=document.getElementById('orc-item-extra');
  if(!extra){
    extra=document.createElement('div');
    extra.id='orc-item-extra';
    extra.className='hidden grid grid-cols-12 gap-2 items-end';
    extra.innerHTML='<label class="col-span-12 md:col-span-4 text-[11px] font-bold uppercase text-[#0a1e8a]">Etiqueta'
      +'<input id="orc-item-cartucho" placeholder="Nº da etiqueta — se não achar, escreve e segue" class="mt-1 w-full h-[38px] px-2 rounded-xl border"></label>';
    var bloco=prod.closest('.rounded-\\[14px\\]') || prod.parentNode.parentNode;
    if(bloco) bloco.appendChild(extra);
  }
  extra.classList.toggle('hidden', !rec);
  if(!document.getElementById('orc-prod-lupa')){
    var lupa=document.createElement('button');
    lupa.id='orc-prod-lupa';
    lupa.type='button';
    lupa.className='h-[40px] px-3 rounded-xl bg-[#0a1e8a] text-white';
    lupa.innerHTML='<i class="ph ph-magnifying-glass"></i>';
    lupa.onclick=function(e){ e.preventDefault(); window.orcBuscarProd(); };
    prod.parentNode.insertBefore(lupa, prod.nextSibling);
  }
}

if(typeof window.abrirTelaOrcamento==='function' && !window.abrirTelaOrcamento.__v52238){
  var oldAbrir=window.abrirTelaOrcamento;
  window.abrirTelaOrcamento=function(){
    var r=oldAbrir.apply(this, arguments);
    window.__orcDirty=false;
    setTimeout(function(){
      injetarFiltrosOrc();
      var tipo=document.getElementById('orc-item-tipo');
      if(tipo && !tipo.__v52238){
        tipo.__v52238=true;
        tipo.addEventListener('change', function(){ injetarFiltrosOrc(); });
      }
    }, 40);
    return r;
  };
  window.abrirTelaOrcamento.__v52238=true;
}

if(typeof window.orcBuscarProd==='function' && !window.orcBuscarProd.__v52238){
  window.orcBuscarProd=function(){
    var q=txt(document.getElementById('orc-prod-search')&&document.getElementById('orc-prod-search').value);
    var el=document.getElementById('orc-prod-results'); if(!el) return;
    if(!q){ el.classList.add('hidden'); return; }
    var s=typeof getSession==='function'?getSession():null;
    var P=window.FILTROS_BUSCA_PURE;
    if(ehRecargaOrc()){
      var campo=(document.getElementById('orc-rec-campo')||{}).value||'todos';
      var recs=((typeof db!=='undefined'&&db.recargas)||[]).filter(function(r){
        return !s||!r.empresaId||r.empresaId===s.empresaId;
      });
      var list=P?P.filtraRecargas(recs,q,campo):recs;
      list=list.slice(0,10);
      el.classList.remove('hidden');
      el.innerHTML=list.map(function(r){
        return '<button type="button" onclick="window.orcSelRecarga(\''+esc(r.id)+'\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b"><b>'+esc(r.nome||'')+'</b><br><span class="text-slate-500 text-[11px]">cód. '+esc(r.codigo||'')+' • <b>'+money(r.preco||0)+'</b></span></button>';
      }).join('')||'<p class="px-3 py-2 text-slate-400">Nenhuma recarga. Escreva a descrição e a etiqueta.</p>';
      return;
    }
    var cat=(document.getElementById('orc-prod-cat')||{}).value||'';
    var prods=((typeof db!=='undefined'&&db.produtos)||[]).filter(function(p){
      return !s||!p.empresaId||p.empresaId===s.empresaId;
    });
    var listP=P?P.filtraProdutos(prods,q,cat):prods.filter(function(p){ return String(p.nome||'').toLowerCase().indexOf(q.toLowerCase())>=0; });
    listP=listP.slice(0,10);
    el.classList.remove('hidden');
    el.innerHTML=listP.map(function(p){
      return '<button type="button" onclick="window.orcSelProd(\''+p.id+'\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b"><b>'+esc(p.nome||'')+'</b><br><span class="text-slate-500 text-[11px]">'+esc(p.sku||'')+' • estoque '+(p.estoque||0)+' • <b>'+money(p.preco)+'</b></span></button>';
    }).join('')||'<p class="px-3 py-2 text-slate-400">Sem produto — a descrição digitada será usada</p>';
  };
  window.orcBuscarProd.__v52238=true;
}

window.orcSelRecarga=function(id){
  var r=((typeof db!=='undefined'&&db.recargas)||[]).find(function(x){ return x.id===id; });
  var f=window.__ORC_ST && window.__ORC_ST.form;
  if(!r||!f) return;
  f.produtoSel=null;
  document.getElementById('orc-prod-search').value=r.nome||'';
  document.getElementById('orc-item-vunit').value=r.preco||0;
  document.getElementById('orc-prod-results').classList.add('hidden');
  if(typeof window.orcCalcItem==='function') window.orcCalcItem();
  window.__orcDirty=true;
};

if(typeof window.orcAddItem==='function' && !window.orcAddItem.__v52238dirty){
  var oldAdd=window.orcAddItem;
  window.orcAddItem=function(){
    var r=oldAdd.apply(this, arguments);
    window.__orcDirty=true;
    return r;
  };
  window.orcAddItem.__v52238dirty=true;
}

if(typeof window.salvarOrcamentoTela==='function' && !window.salvarOrcamentoTela.__v52238aviso){
  var oldSal=window.salvarOrcamentoTela;
  window.salvarOrcamentoTela=function(){
    var antes=window.__ORC_ST && window.__ORC_ST.form && window.__ORC_ST.form.id;
    var r=oldSal.apply(this, arguments);
    var f=window.__ORC_ST && window.__ORC_ST.form;
    if(f && f.id){
      window.__orcDirty=false;
      var o=(typeof db!=='undefined'&&db.orcamentos||[]).find(function(x){ return x.id===f.id; });
      if(o && typeof window.lfbAlert==='function') window.lfbAlert('Salvo.','Salvo');
      var foot=document.getElementById('modal-footer');
      if(foot && o && foot.innerHTML.indexOf('imprimirOrcamento')<0){
        foot.insertAdjacentHTML('afterbegin',
          '<button onclick="window.imprimirOrcamento(\''+o.id+'\')" class="h-[46px] px-5 rounded-xl bg-white border font-bold"><i class="ph ph-printer"></i> Imprimir</button>');
      }
    }
    return r;
  };
  window.salvarOrcamentoTela.__v52238aviso=true;
}

if(typeof window.closeModal==='function' && !window.closeModal.__v52238orc){
  var oldClose=window.closeModal;
  window.closeModal=function(){
    if(window.__vosIgnorarSair) return oldClose.apply(this, arguments);
    if(document.getElementById('orc-itens-body') && window.__ORC_ST && window.__ORC_ST.form && window.__orcDirty!==false){
      var f=window.__ORC_ST.form;
      var tem=!!(f.cliente || (f.itens&&f.itens.length));
      if(tem && typeof window.confirmSistema==='function'){
        window.confirmSistema('Deseja salvar este orçamento?','Sair do orçamento').then(function(ok){
          if(ok && typeof window.salvarOrcamentoTela==='function') window.salvarOrcamentoTela();
          window.__orcDirty=false;
          oldClose.call(window, true);
        });
        return;
      }
    }
    return oldClose.apply(this, arguments);
  };
  window.closeModal.__v52238orc=true;
}

if(typeof window.gerarHtmlOrcamento==='function' && !window.gerarHtmlOrcamento.__v52238link){
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
    var link=linkOrcamento(o, cli, emp);
    html=html.replace(/https:\/\/digicopy-pix\.pages\.dev\/orcamento\.html[^"'<\s]*/g, link);
    html=html.replace(/href="[^"]*orcamento\.html[^"]*"/g, 'href="'+link.replace(/"/g,'&quot;')+'"');
    return html;
  };
  window.gerarHtmlOrcamento.__v52238link=true;
}

if(window.ORCAMENTOS_APROVACAO_PURE){
  window.ORCAMENTOS_APROVACAO_PURE.linkPublico=function(tokenOuO, cli){
    if(tokenOuO && typeof tokenOuO==='object') return linkOrcamento(tokenOuO, cli||{}, {});
    return PAGINA+'?d=';
  };
  window.ORCAMENTOS_APROVACAO_PURE.PAGES=PAGINA;
}

console.log('[DIGICOPY] v5.22.38 orçamentos: filtros, avisos, link separado do Pix');
})();
