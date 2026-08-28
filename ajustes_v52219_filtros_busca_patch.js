// ═══════════════════════════════════════════════════════════════════════════
// v5.22.19 — Filtro auxiliar ao lado da busca (cliente / produto / recarga)
// • Cliente: mesmos campos do menu Clientes, em todo lugar que escolhe cliente
// • Produto: categoria (Todas por padrão), sem Recarga
// • Recarga de toner: busca da recarga + caixa da etiqueta (se não achar, escreve e segue)
// • Busca só Enter / lupa
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var CAMPOS_CLIENTE = [
  ['todos','Pesquisar em tudo'],['nome','Nome'],['fantasia','Fantasia'],
  ['codigo','Código'],['documento','CPF/CNPJ'],['rgIE','RG/IE'],
  ['endereco','Endereço'],['telefone','Telefone'],['whatsapp','WhatsApp'],
  ['cidade','Cidade'],['bairro','Bairro'],['contato','Contato'],
  ['email','E-mail'],['observacao','Observação'],['cep','CEP'],['estado','UF']
];
var CATS_PRODUTO = [
  'Produto','Serviço','Cartucho','Cartucho Vazio','Insumo','Equipamento',
  'Impressoras','Chip','Compatível','Informática','Original','Outros'
];
var CAMPOS_RECARGA = [
  ['todos','Pesquisar recarga'],['codigo','Código'],['nome','Descrição'],['marca','Marca']
];

function fold(t){
  return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function soDigitos(t){ return String(t||'').replace(/\D/g,''); }
function ehRecargaCat(cat){ return /recarga/i.test(String(cat||'')); }
function unificaCat(cat){
  var n = fold(cat);
  if(!n) return 'Produto';
  if(n.indexOf('serv')>=0) return 'Serviço';
  if(n.indexOf('cartucho')>=0 && n.indexOf('vaz')>=0) return 'Cartucho Vazio';
  if(n.indexOf('cart')>=0) return 'Cartucho';
  if(n.indexOf('insum')>=0 || n.indexOf('peca')>=0 || n.indexOf('peça')>=0 || n.indexOf('toner')>=0) return 'Insumo';
  if(n.indexOf('equip')>=0) return 'Equipamento';
  if(n.indexOf('impress')>=0) return 'Impressoras';
  if(n.indexOf('chip')>=0) return 'Chip';
  if(n.indexOf('compat')>=0) return 'Compatível';
  if(n.indexOf('info')>=0) return 'Informática';
  if(n.indexOf('orig')>=0) return 'Original';
  if(n.indexOf('recarga')>=0) return 'Recarga';
  return String(cat||'Produto');
}
function filtraClientes(list, q, campo){
  if(typeof window!=='undefined' && window.CLI_PURE && typeof window.CLI_PURE.filtraClientes==='function'){
    return window.CLI_PURE.filtraClientes(list, q, campo||'todos');
  }
  var termo = fold(q).trim();
  if(!termo) return list||[];
  var num = soDigitos(q);
  return (list||[]).filter(function(c){
    if(!c) return false;
    var k = campo||'todos';
    function testa(v, extraNum){
      return fold(v).indexOf(termo)>=0 || (!!num && num.length>=3 && extraNum && soDigitos(v).indexOf(num)>=0);
    }
    if(k && k!=='todos'){
      if(k==='email') return testa(c.email) || testa(c.email2);
      if(k==='documento'||k==='cep'||k==='telefone'||k==='whatsapp') return testa(c[k], true);
      if(k==='codigo'){
        var alvo=(num||termo).replace(/^0+/,'')||String(num||termo);
        function normCod(v){ var d=soDigitos(v); return d?(d.replace(/^0+/,'')||'0'):''; }
        return !!(alvo && (normCod(c.codigo)===alvo || normCod(c.codigoAntigo)===alvo));
      }
      return testa(c[k]);
    }
    return testa(c.nome)||testa(c.fantasia)||testa(c.documento,true)||testa(c.telefone,true)||
      testa(c.cidade)||testa(c.bairro)||testa(c.endereco)||String(c.codigo||'').indexOf(num||termo)>=0||
      testa(c.contato)||testa(c.email)||testa(c.cep,true)||testa(c.whatsapp,true);
  });
}
function filtraProdutos(list, q, cat){
  var termo = fold(q).trim();
  var catN = String(cat||'').trim();
  return (list||[]).filter(function(p){
    if(!p || p.status==='inativo' || p.status==='excluido') return false;
    if(ehRecargaCat(p.categoria) || ehRecargaCat(p.tipo) || ehRecargaCat(p.nome)) return false;
    if(catN && unificaCat(p.categoria)!==catN && String(p.categoria||'')!==catN) return false;
    if(!termo) return true;
    return [p.nome, p.sku, p.codigo, p.fabricante, p.local, p.ncm, p.categoria]
      .some(function(x){ return fold(x).indexOf(termo)>=0; });
  });
}
function filtraRecargas(list, q, campo){
  var termo = fold(q).trim();
  var k = campo||'todos';
  return (list||[]).filter(function(r){
    if(!r || r.status==='inativo' || r.status==='excluido') return false;
    if(!termo) return true;
    if(k==='codigo') return String(r.codigo||'').toLowerCase().indexOf(termo)>=0 || soDigitos(r.codigo).indexOf(soDigitos(q))>=0;
    if(k==='nome') return fold(r.nome).indexOf(termo)>=0;
    if(k==='marca') return fold(r.marca).indexOf(termo)>=0;
    return [r.codigo, r.nome, r.marca].some(function(x){ return fold(x).indexOf(termo)>=0; });
  });
}

window.FILTROS_BUSCA_PURE = {
  CAMPOS_CLIENTE: CAMPOS_CLIENTE,
  CATS_PRODUTO: CATS_PRODUTO,
  CAMPOS_RECARGA: CAMPOS_RECARGA,
  ehRecargaCat: ehRecargaCat,
  unificaCat: unificaCat,
  filtraClientes: filtraClientes,
  filtraProdutos: filtraProdutos,
  filtraRecargas: filtraRecargas
};

if(typeof document==='undefined') return;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(v):(Number(v)||0); }

function htmlOpts(list, sel){
  return list.map(function(it){
    var k = Array.isArray(it)?it[0]:it;
    var r = Array.isArray(it)?it[1]:it;
    return '<option value="'+esc(k)+'"'+(String(sel||'')===String(k)?' selected':'')+'>'+esc(r)+'</option>';
  }).join('');
}
function mkSelect(id, opts, sel, cls){
  var s = document.createElement('select');
  s.id = id;
  s.className = cls || 'h-10 px-2 rounded-xl border bg-white text-[12px] min-w-[148px] shrink-0';
  s.innerHTML = htmlOpts(opts, sel);
  s.setAttribute('data-filtro-aux','1');
  return s;
}
function insertBeforeInput(input, sel){
  if(!input || !sel || document.getElementById(sel.id)) return;
  var pai = input.parentNode;
  if(!pai) return;
  if(pai.classList && !/flex/.test(pai.className||'')){
    pai.classList.add('flex','flex-wrap','items-center','gap-2');
  }
  pai.insertBefore(sel, input);
}

var CLI_INPUTS = [
  ['vos-cli-search','vos-cli-campo'],
  ['fin-cli-termo','fin-cli-campo'],
  ['ctr-cli-busca','ctr-cli-campo'],
  ['ctr-cli-busca-simples','ctr-cli-campo-simples'],
  ['ctrd-cli-busca','ctrd-cli-campo'],
  ['ca-busca-cliente','ca-cli-campo'],
  ['nv-cliente-search','nv-cli-campo'],
  ['cv-cliente-search','cv-cli-campo'],
  ['neo-cli-search','neo-cli-campo']
];

function camposClienteAtivos(){
  if(window.CLI_PURE && window.CLI_PURE.CAMPOS_BUSCA) return window.CLI_PURE.CAMPOS_BUSCA;
  return CAMPOS_CLIENTE;
}

function injetarFiltrosCliente(){
  CLI_INPUTS.forEach(function(par){
    var inp = document.getElementById(par[0]);
    if(!inp || document.getElementById(par[1])) return;
    insertBeforeInput(inp, mkSelect(par[1], camposClienteAtivos(), 'todos'));
  });
}

function tipoItemVenda(){
  return String((document.getElementById('vos-item-tipo')||{}).value||'');
}
function ehRecargaVenda(){ return /recarga/i.test(tipoItemVenda()); }

function injetarFiltrosItem(){
  var prod = document.getElementById('vos-prod-search');
  if(!prod) return;
  var rec = ehRecargaVenda();
  var cat = document.getElementById('vos-prod-cat');
  var recCampo = document.getElementById('vos-rec-campo');
  if(!cat){
    cat = mkSelect('vos-prod-cat', [['','Todas categorias']].concat(CATS_PRODUTO.map(function(c){return [c,c];})), '');
    insertBeforeInput(prod, cat);
  }
  if(!recCampo){
    recCampo = mkSelect('vos-rec-campo', CAMPOS_RECARGA, 'todos');
    insertBeforeInput(prod, recCampo);
  }
  cat.style.display = rec ? 'none' : '';
  recCampo.style.display = rec ? '' : 'none';
  prod.placeholder = rec ? 'Busque a recarga (Enter ou lupa)...' : 'Digite para buscar ou escreva a descrição...';

  var cart = document.getElementById('vos-item-cartucho');
  if(cart){
    var wrap = cart.closest('label') || cart.parentNode;
    if(wrap) wrap.classList.toggle('hidden', !rec && !/Toner/i.test(tipoItemVenda()));
    if(rec && !document.getElementById('vos-etq-lupa')){
      cart.insertAdjacentHTML('afterend',
        '<button id="vos-etq-lupa" type="button" onclick="window.buscarEtiquetaFiltroVenda()" class="mt-1 h-[38px] px-3 rounded-xl bg-[#0a1e8a] text-white" title="Buscar etiqueta"><i class="ph ph-magnifying-glass"></i></button>');
      cart.onkeydown = function(e){
        if(e.key==='Enter'){ e.preventDefault(); window.buscarEtiquetaFiltroVenda(); }
      };
      cart.placeholder = 'Nº da etiqueta — se não achar, escreve e segue';
    }
  }
}

window.buscarEtiquetaFiltroVenda = function(){
  if(typeof window.vosBuscarEtiquetaNaVenda==='function'){
    window.vosBuscarEtiquetaNaVenda();
    return;
  }
  var etq = String((document.getElementById('vos-item-cartucho')||{}).value||'').trim();
  if(!etq) return;
  var rec = ((typeof db!=='undefined' && db.recargasEtiquetas)||[]).find(function(r){
    return String(r.etiqueta||'').replace(/\s+/g,'').toUpperCase()===etq.replace(/\s+/g,'').toUpperCase();
  });
  if(!rec && typeof toast==='function') toast('Etiqueta nova: escreva e adicione o item. Cadastra ao faturar.','info');
};

function clientesEmpresa(){
  var s = sess();
  return ((typeof db!=='undefined' && db.clientes)||[]).filter(function(c){
    if(!c || c.status==='inativo') return false;
    if(s && s.empresaId && c.empresaId && c.empresaId!==s.empresaId) return false;
    return true;
  });
}
function campoDeInput(inputId){
  var par = CLI_INPUTS.find(function(p){ return p[0]===inputId; });
  return par ? (document.getElementById(par[1])||{}).value || 'todos' : 'todos';
}

function pintarListaCliente(el, list, onclickNome){
  if(!el) return;
  el.classList.remove('hidden');
  el.innerHTML = list.map(function(c){
    return '<button type="button" onclick="'+onclickNome+'(\''+esc(c.id)+'\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0">'+
      '<b class="text-[#0a1e8a]">#'+esc(c.codigo||'-')+'</b> <b>'+esc(c.nome||'')+'</b><br>'+
      '<span class="text-slate-500 text-[11px]">'+esc(c.documento||'')+' • '+esc(c.telefone||'')+'</span></button>';
  }).join('') || '<p class="px-3 py-3 text-slate-400">Nenhum cliente com esse filtro.</p>';
}

if(typeof window.vosVendaSearchCliente==='function' && !window.vosVendaSearchCliente.__v52219){
  window.vosVendaSearchCliente = function(q){
    var el = document.getElementById('vos-cli-results'); if(!el) return;
    if(!String(q||'').trim()){ el.classList.add('hidden'); el.innerHTML=''; return; }
    var list = filtraClientes(clientesEmpresa(), q, campoDeInput('vos-cli-search')).slice(0,15);
    pintarListaCliente(el, list, 'vosVendaSelectCliente');
  };
  window.vosVendaSearchCliente.__v52219 = true;
}

if(typeof window.finBuscarCliente==='function' && !window.finBuscarCliente.__v52219){
  var oldFin = window.finBuscarCliente;
  window.finBuscarCliente = function(){
    var q = String((document.getElementById('fin-cli-termo')||{}).value||'');
    var el = document.getElementById('fin-cli-lista'); if(!el) return oldFin.apply(this, arguments);
    if(!q.trim()){ el.classList.add('hidden'); el.innerHTML=''; return; }
    var list = filtraClientes(clientesEmpresa(), q, campoDeInput('fin-cli-termo')).slice(0,15);
    el.classList.remove('hidden');
    el.innerHTML = list.map(function(c){
      return '<button type="button" onclick="window.finEscolherCliente(\''+esc(c.id)+'\')"><b>#'+esc(c.codigo||'-')+'</b> '+esc(c.nome||'')+'<br><span class="text-slate-500 text-[11px]">'+esc(c.documento||'')+'</span></button>';
    }).join('') || '<div class="p-3 text-slate-500 text-[12px]">Nenhum cliente. Ajuste o filtro e clique na lupa.</div>';
  };
  window.finBuscarCliente.__v52219 = true;
}

function wrapBuscaContrato(fnName, inputId, boxId, selFn){
  if(typeof window[fnName]!=='function' || window[fnName].__v52219) return;
  window[fnName] = function(){
    var q = String((document.getElementById(inputId)||{}).value||'');
    var box = document.getElementById(boxId); if(!box) return;
    var list = filtraClientes(clientesEmpresa(), q, campoDeInput(inputId)).slice(0,20);
    box.classList.remove('hidden');
    box.innerHTML = list.map(function(c){
      return '<button class="w-full text-left px-3 py-2 border-b hover:bg-blue-50" onclick="'+selFn+'(\''+esc(c.id)+'\')"><b>#'+esc(c.codigo||'')+' — '+esc(c.nome||'')+'</b><br><span class="text-[11px] text-slate-500">'+esc(c.documento||'')+' • '+esc(c.telefone||'')+'</span></button>';
    }).join('') || '<p class="p-3 text-slate-400">Nenhum cliente encontrado.</p>';
  };
  window[fnName].__v52219 = true;
}
wrapBuscaContrato('buscarClienteContratoModal','ctr-cli-busca','ctr-cli-result','selecionarClienteContrato');
wrapBuscaContrato('buscarClienteContratoDefinitivo','ctr-cli-busca-simples','ctr-cli-result-simples','selecionarClienteContratoDefinitivo');
wrapBuscaContrato('buscarClienteContratoLeitura','ctrd-cli-busca','ctrd-cli-result','selecionarClienteContratoLeitura');

function wrapBuscaLivre(fnName, inputId, resultsId, selFn){
  if(typeof window[fnName]!=='function' || window[fnName].__v52219) return;
  var old = window[fnName];
  window[fnName] = function(q){
    var termo = q==null ? String((document.getElementById(inputId)||{}).value||'') : q;
    var el = document.getElementById(resultsId);
    if(!el) return old.apply(this, arguments);
    if(!String(termo||'').trim()){ el.classList.add('hidden'); el.innerHTML=''; return; }
    var list = filtraClientes(clientesEmpresa(), termo, campoDeInput(inputId)).slice(0,15);
    pintarListaCliente(el, list, selFn);
  };
  window[fnName].__v52219 = true;
}
wrapBuscaLivre('searchClientesVenda','nv-cliente-search','nv-cli-results','selectClienteVenda');
wrapBuscaLivre('neoSearchClienteVenda','neo-cli-search','neo-cli-results','neoSelectClienteVenda');
wrapBuscaLivre('cvSearchCliente','cv-cliente-search','cv-cliente-results','cvSelectCliente');

if(typeof window.buscarClientesChamadoAvulso==='function' && !window.buscarClientesChamadoAvulso.__v52219){
  window.buscarClientesChamadoAvulso = function(){
    var q = String((document.getElementById('ca-busca-cliente')||{}).value||'');
    var out = document.getElementById('ca-clientes-result'); if(!out) return;
    var list = filtraClientes(clientesEmpresa(), q, campoDeInput('ca-busca-cliente')).slice(0,30);
    out.innerHTML = list.map(function(c){
      return '<button type="button" onclick="selecionarClienteChamadoAvulso(\''+esc(c.id)+'\')" class="w-full text-left p-2 hover:bg-blue-50 border-b last:border-0"><b>'+esc(c.codigo||'')+'</b> '+esc(c.nome||'')+'<br><span class="text-[11px] text-slate-500">'+esc(c.documento||'')+' • '+esc(c.telefone||'')+'</span></button>';
    }).join('') || '<p class="p-3 text-center text-slate-400">Nenhum cliente encontrado</p>';
  };
  window.buscarClientesChamadoAvulso.__v52219 = true;
}

if(typeof window.vosVendaSearchProd==='function' && !window.vosVendaSearchProd.__v52219){
  var oldSearch = window.vosVendaSearchProd;
  window.vosVendaSearchProd = function(q){
    var el = document.getElementById('vos-prod-results'); if(!el) return oldSearch.apply(this, arguments);
    var s = sess();
    if(ehRecargaVenda()){
      var campo = (document.getElementById('vos-rec-campo')||{}).value || 'todos';
      var recs = (typeof db!=='undefined' && db.recargas)||[];
      if(s && s.empresaId) recs = recs.filter(function(r){ return !r.empresaId || r.empresaId===s.empresaId; });
      if(!String(q||'').trim()){ el.classList.add('hidden'); el.innerHTML=''; return; }
      var list = filtraRecargas(recs, q, campo).slice(0,10);
      el.innerHTML = list.map(function(r){
        return '<button type="button" onclick="window.vosVendaSelectRecarga(\''+esc(r.id)+'\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0">'+
          '<b>'+esc(r.nome||'')+'</b> <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100">Recarga</span><br>'+
          '<span class="text-slate-500 text-[11px]">cód. '+esc(r.codigo||'')+' • sem estoque • <b class="text-[#0a1e8a]">'+money(r.preco||0)+'</b></span></button>';
      }).join('') || '<p class="px-3 py-2 text-slate-400">Nenhuma recarga. Cadastre em Estoque → Recargas. Se for etiqueta nova, escreva na caixa da etiqueta.</p>';
      el.classList.remove('hidden');
      return;
    }
    if(!String(q||'').trim()){ el.classList.add('hidden'); return; }
    var cat = (document.getElementById('vos-prod-cat')||{}).value || '';
    var prods = ((typeof db!=='undefined' && db.produtos)||[]).filter(function(p){
      return !s || !s.empresaId || !p.empresaId || p.empresaId===s.empresaId;
    });
    var listP = filtraProdutos(prods, q, cat).slice(0,10);
    el.innerHTML = listP.map(function(p){
      return '<button onclick="vosVendaSelectProd(\''+esc(p.id)+'\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0">'+
        '<b>'+esc(p.nome||'')+'</b> <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100">'+esc(p.categoria||'')+'</span><br>'+
        '<span class="text-slate-500 text-[11px]">'+esc(p.sku||'')+' • estoque '+(p.estoque||0)+' • <b class="text-[#0a1e8a]">'+money(p.preco||0)+'</b></span></button>';
    }).join('') || '<p class="px-3 py-2 text-slate-400">Sem produto — a descrição digitada será usada</p>';
    el.classList.remove('hidden');
  };
  window.vosVendaSearchProd.__v52219 = true;
}

if(typeof window.vosOnTipoItem==='function' && !window.vosOnTipoItem.__v52219){
  var oldTipo = window.vosOnTipoItem;
  window.vosOnTipoItem = function(){
    var r = oldTipo.apply(this, arguments);
    injetarFiltrosItem();
    var res = document.getElementById('vos-prod-results');
    if(res){ res.classList.add('hidden'); res.innerHTML=''; }
    return r;
  };
  window.vosOnTipoItem.__v52219 = true;
}

function tirarRecargaDoFiltroEstoque(){
  var sel = document.getElementById('filter-prod-cat');
  if(!sel) return;
  Array.from(sel.options).forEach(function(o){
    if(ehRecargaCat(o.value) || ehRecargaCat(o.textContent)) o.remove();
  });
}

function aplicarTudo(){
  try{
    injetarFiltrosCliente();
    injetarFiltrosItem();
    tirarRecargaDoFiltroEstoque();
  }catch(e){}
}

['novaVenda','renderModalContrato','openModal','renderFinanceiro','renderProdutos'].forEach(function(nome){
  if(typeof window[nome]!=='function' || window[nome].__v52219inj) return;
  var old = window[nome];
  var wrap = function(){
    var r = old.apply(this, arguments);
    setTimeout(aplicarTudo, 60);
    return r;
  };
  wrap.__v52219inj = true;
  window[nome] = wrap;
});

setTimeout(aplicarTudo, 400);
setTimeout(aplicarTudo, 1400);

console.log('[DIGICOPY] v5.22.19 filtros auxiliares: cliente, produto (sem recarga) e recarga+etiqueta');
})();
