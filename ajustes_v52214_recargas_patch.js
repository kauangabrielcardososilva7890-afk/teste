// ═══════════════════════════════════════════════════════════════════════════
// v5.22.14 — Recargas fora de produtos: aba, submenu, venda puxa daqui, sem estoque
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function soNumeros(v){ return String(v==null?'':v).replace(/\D/g,''); }
function proximoCodigoRecarga(lista, empresaId){
  var max=0;
  (lista||[]).forEach(function(r){
    if(!r) return;
    if(empresaId && r.empresaId && r.empresaId!==empresaId) return;
    var n=parseInt(soNumeros(r.codigo),10)||0;
    if(n>max) max=n;
  });
  return String(max+1);
}
function ehTipoRecarga(tipo){ return /recarga/i.test(String(tipo||'')); }
function recargaPodeVenderSemEstoque(){ return true; }
function filtrarRecargas(lista, empresaId, q){
  var low=String(q||'').toLowerCase().trim();
  return (lista||[]).filter(function(r){
    if(!r || r.status==='inativo' || r.status==='excluido') return false;
    if(empresaId && r.empresaId && r.empresaId!==empresaId) return false;
    if(!low) return true;
    return [r.codigo, r.nome, r.marca].some(function(x){ return String(x||'').toLowerCase().includes(low); });
  });
}

window.RECARGAS_PURE = {
  soNumeros: soNumeros,
  proximoCodigoRecarga: proximoCodigoRecarga,
  ehTipoRecarga: ehTipoRecarga,
  recargaPodeVenderSemEstoque: recargaPodeVenderSemEstoque,
  filtrarRecargas: filtrarRecargas
};

if(typeof document==='undefined') return;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Aviso'); if(typeof toast==='function') toast(m,'info'); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function store(){ if(typeof db==='undefined') return []; db.recargas = db.recargas||[]; return db.recargas; }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(v):(Number(v)||0); }

window.__estoqueAba = window.__estoqueAba || 'produtos';
window.__recargasSort = window.__recargasSort || { col:'codigo', dir:'asc' };
window.__recargasBusca = window.__recargasBusca || '';

function htmlAbas(){
  var rec = window.__estoqueAba==='recargas';
  return '<div id="estoque-abas-v52214" class="flex border-b gap-4 mb-1 font-bold text-[13.5px] text-slate-500">'+
    '<button type="button" onclick="window.abrirAbaProdutos()" class="pb-2 border-b-2 '+(rec?'border-transparent hover:text-slate-800':'border-[#0a1e8a] text-[#0a1e8a]')+'">Produtos</button>'+
    '<button type="button" onclick="window.abrirAbaRecargas()" class="pb-2 border-b-2 '+(rec?'border-[#0a1e8a] text-[#0a1e8a]':'border-transparent hover:text-slate-800')+'">Recargas</button>'+
    '</div>';
}

window.abrirAbaProdutos = function(){
  window.__estoqueAba = 'produtos';
  if(typeof navigateTo==='function') navigateTo('produtos');
  else if(typeof renderProdutos==='function') renderProdutos();
};
window.abrirAbaRecargas = function(){
  window.__estoqueAba = 'recargas';
  if(typeof navigateTo==='function') navigateTo('produtos');
  else window.renderRecargas();
};

window.aplicarBuscaRecargas = function(){
  var el = document.getElementById('search-recargas');
  window.__recargasBusca = el ? el.value : '';
  window.renderRecargas();
};
window.recargasSort = function(col){
  var st = window.__recargasSort;
  if(st.col===col) st.dir = st.dir==='asc'?'desc':'asc';
  else { st.col=col; st.dir='asc'; }
  window.renderRecargas();
};

window.renderRecargas = function(){
  var s = sess(); if(!s) return;
  var view = document.getElementById('view-produtos'); if(!view) return;
  var q = window.__recargasBusca||'';
  var st = window.__recargasSort;
  var list = filtrarRecargas(store(), s.empresaId, q);
  list = list.slice().sort(function(a,b){
    var A = a[st.col]==null?'':a[st.col];
    var B = b[st.col]==null?'':b[st.col];
    if(st.col==='preco' || st.col==='codigo'){
      var an=Number(soNumeros(A))||Number(A)||0;
      var bn=Number(soNumeros(B))||Number(B)||0;
      if(st.col==='preco'){ an=Number(A)||0; bn=Number(B)||0; }
      return st.dir==='asc'?an-bn:bn-an;
    }
    var c=String(A).localeCompare(String(B),'pt-BR',{numeric:true,sensitivity:'base'});
    return st.dir==='asc'?c:-c;
  });
  var seta = function(col){ return st.col===col ? (st.dir==='asc'?' ▲':' ▼') : ''; };
  var th = function(col,label){ return '<th onclick="recargasSort(\''+col+'\')" class="px-4 py-2.5 cursor-pointer select-none hover:text-[#0a1e8a]">'+label+seta(col)+'</th>'; };
  view.innerHTML = htmlAbas()+
    '<div class="space-y-4">'+
    '<div class="flex flex-wrap gap-3 justify-between items-center">'+
    '<div class="flex gap-2"><button onclick="window.abrirModalRecarga()" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13.5px] font-semibold shadow"><i class="ph ph-plus mr-1"></i>Nova recarga</button></div>'+
    '<div class="flex gap-2 items-center"><input id="search-recargas" value="'+esc(q)+'" placeholder="Código ou descrição..." class="h-10 px-4 rounded-xl bg-white border text-[13.5px] w-[270px]">'+
    '<button type="button" onclick="window.aplicarBuscaRecargas()" class="h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold" title="Pesquisar"><i class="ph ph-magnifying-glass"></i></button></div></div>'+
    '<div class="rounded-[14px] bg-blue-50 border border-blue-200 p-3 text-[12.5px] text-blue-900">Recarga não controla estoque — quantidade infinita. A venda Recarga de toner puxa só desta lista.</div>'+
    '<div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><div class="overflow-auto max-h-[680px]">'+
    '<table class="w-full text-left text-[13px]"><thead class="sticky top-0 bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr>'+
    th('codigo','Código')+th('nome','Descrição')+th('marca','Marca')+th('preco','Valor venda')+'<th class="px-4 py-2.5 text-right">Ações</th></tr></thead><tbody class="divide-y">'+
    (list.map(function(r){
      return '<tr ondblclick="window.abrirModalRecarga(\''+esc(r.id)+'\')" class="hover:bg-slate-50 cursor-pointer">'+
        '<td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">'+esc(r.codigo||'')+'</td>'+
        '<td class="px-4 py-2.5 font-semibold">'+esc(r.nome||'')+'</td>'+
        '<td class="px-4 py-2.5">'+esc(r.marca||'-')+'</td>'+
        '<td class="px-4 py-2.5 font-bold text-emerald-700">'+money(r.preco||0)+'</td>'+
        '<td class="px-4 py-2.5 text-right"><div class="flex justify-end gap-1">'+
        '<button onclick="event.stopPropagation();window.abrirModalRecarga(\''+esc(r.id)+'\')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button>'+
        '<button onclick="event.stopPropagation();window.excluirRecarga(\''+esc(r.id)+'\')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button>'+
        '</div></td></tr>';
    }).join('') || '<tr><td colspan="5" class="px-5 py-14 text-center text-slate-500">Nenhuma recarga. Cadastre para puxar na venda.</td></tr>')+
    '</tbody></table></div></div></div>';
  var inp = document.getElementById('search-recargas');
  if(inp){
    inp.onkeydown = function(e){ if(e.key==='Enter'){ e.preventDefault(); window.aplicarBuscaRecargas(); } };
  }
};

window.abrirModalRecarga = function(id){
  var s = sess(); if(!s) return;
  var isEdit = !!id;
  var r = isEdit ? store().find(function(x){ return x.id===id && (!x.empresaId || x.empresaId===s.empresaId); }) : {
    codigo: proximoCodigoRecarga(store(), s.empresaId), nome:'', marca:'', preco:0
  };
  if(!r){ aviso('Recarga não encontrada','Recargas'); return; }
  var box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[640px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  document.getElementById('modal-title').innerText = isEdit ? 'Alterar recarga — '+r.codigo : 'Nova recarga';
  document.getElementById('modal-body').innerHTML =
    '<div class="space-y-3 text-[13px]">'+
    '<div class="grid grid-cols-1 md:grid-cols-3 gap-3">'+
    '<div><label class="block font-bold text-slate-600 mb-1">Código (só número)</label><input id="rc-cod" value="'+esc(r.codigo||'')+'" inputmode="numeric" class="w-full h-10 px-3 rounded-xl border font-mono"></div>'+
    '<div class="md:col-span-2"><label class="block font-bold text-slate-600 mb-1">Descrição *</label><input id="rc-nome" value="'+esc(r.nome||'')+'" class="w-full h-10 px-3 rounded-xl border font-semibold" placeholder="Ex.: Recarga HP 85A"></div></div>'+
    '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">'+
    '<div><label class="block font-bold text-slate-600 mb-1">Marca</label><input id="rc-marca" value="'+esc(r.marca||'')+'" class="w-full h-10 px-3 rounded-xl border"></div>'+
    '<div><label class="block font-bold text-slate-600 mb-1">Valor venda R$</label><input id="rc-preco" type="number" step="0.01" value="'+(r.preco||0)+'" class="w-full h-10 px-3 rounded-xl border font-bold text-[#0a1e8a]"></div></div>'+
    '<p class="text-[12px] text-slate-500">Sem estoque. Sempre disponível na venda Recarga de toner.</p></div>';
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button>'+
    '<button onclick="window.salvarRecarga(\''+(isEdit?esc(r.id):'')+'\')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>';
  document.getElementById('modal-root').classList.remove('hidden');
  var cod = document.getElementById('rc-cod');
  if(cod){
    cod.addEventListener('input', function(){ this.value = soNumeros(this.value); });
  }
};

window.salvarRecarga = function(id){
  var s = sess(); if(!s) return;
  var nome = String((document.getElementById('rc-nome')||{}).value||'').trim();
  if(!nome){ aviso('Informe a descrição da recarga.','Recargas'); return; }
  var codigo = soNumeros((document.getElementById('rc-cod')||{}).value) || proximoCodigoRecarga(store(), s.empresaId);
  var payload = {
    empresaId: s.empresaId,
    codigo: codigo,
    nome: nome,
    marca: String((document.getElementById('rc-marca')||{}).value||'').trim(),
    preco: parseFloat((document.getElementById('rc-preco')||{}).value)||0,
    status: 'ativo',
    semEstoque: true
  };
  if(id){
    var ex = store().find(function(x){ return x.id===id; });
    if(!ex){ aviso('Recarga não encontrada','Recargas'); return; }
    Object.assign(ex, payload, { atualizadoEm: new Date().toISOString(), atualizadoPorNome: s.usuarioNome });
    if(typeof logAction==='function') logAction('recarga','editar',id,'Recarga '+payload.nome+' alterada por '+s.usuarioNome);
  } else {
    var novo = Object.assign({
      id: (typeof uid==='function'?uid('rcg'):('rcg_'+Date.now())),
      criadoEm: new Date().toISOString(),
      criadoPor: s.usuarioId,
      criadoPorNome: s.usuarioNome
    }, payload);
    store().push(novo);
    if(typeof logAction==='function') logAction('recarga','criar',novo.id,'Recarga '+payload.nome+' cadastrada por '+s.usuarioNome);
  }
  if(typeof saveDB==='function') saveDB();
  if(typeof closeModal==='function') closeModal();
  window.renderRecargas();
  if(typeof toast==='function') toast('Recarga salva','success');
};

window.excluirRecarga = function(id){
  var s = sess(); if(!s) return;
  var r = store().find(function(x){ return x.id===id; });
  if(!r) return;
  var msg = 'Excluir a recarga '+ (r.codigo||'') +' — '+(r.nome||'')+'?';
  var okFn = function(){
    db.recargas = store().filter(function(x){ return x.id!==id; });
    if(typeof logAction==='function') logAction('recarga','excluir',id,'Recarga excluída por '+s.usuarioNome);
    if(typeof saveDB==='function') saveDB();
    window.renderRecargas();
    if(typeof toast==='function') toast('Recarga excluída','success');
  };
  if(typeof window.confirmSistema==='function') window.confirmSistema(msg,'Excluir recarga').then(function(ok){ if(ok) okFn(); });
  else okFn();
};

if(typeof window.renderProdutos==='function' && !window.renderProdutos.__v52214rec){
  var oldRP = window.renderProdutos;
  window.renderProdutos = function(){
    if(window.__estoqueAba==='recargas'){
      window.renderRecargas();
      return;
    }
    var r = oldRP.apply(this, arguments);
    try{
      var view = document.getElementById('view-produtos');
      if(view && !view.querySelector('#estoque-abas-v52214')){
        var wrap = document.createElement('div');
        wrap.innerHTML = htmlAbas();
        view.insertBefore(wrap.firstChild, view.firstChild);
      }
    }catch(e){}
    return r;
  };
  window.renderProdutos.__v52214rec = true;
}

function ehRecargaNaVenda(){
  return ehTipoRecarga((document.getElementById('vos-item-tipo')||{}).value);
}

function pintarBuscaRecargas(q){
  var s = sess(); var el = document.getElementById('vos-prod-results'); if(!el) return;
  var low = String(q||'').toLowerCase().trim();
  if(!low){ el.classList.add('hidden'); el.innerHTML=''; return; }
  var list = filtrarRecargas(store(), s&&s.empresaId, low).slice(0,10);
  el.innerHTML = list.map(function(r){
    return '<button type="button" onclick="window.vosVendaSelectRecarga(\''+esc(r.id)+'\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0">'+
      '<b>'+esc(r.nome||'')+'</b> <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100">Recarga</span><br>'+
      '<span class="text-slate-500 text-[11px]">cód. '+esc(r.codigo||'')+' • sem estoque • <b class="text-[#0a1e8a]">'+money(r.preco||0)+'</b></span></button>';
  }).join('') || '<p class="px-3 py-2 text-slate-400">Nenhuma recarga. Cadastre em Cadastros → Recargas.</p>';
  el.classList.remove('hidden');
}

window.vosVendaSelectRecarga = function(id){
  var r = store().find(function(x){ return x.id===id; }); if(!r) return;
  var f = window.__vosForm; if(f){ f.recargaSel = r; f.produtoSel = null; }
  var busca = document.getElementById('vos-prod-search'); if(busca) busca.value = r.nome||'';
  var vu = document.getElementById('vos-item-vunit'); if(vu) vu.value = r.preco||0;
  var res = document.getElementById('vos-prod-results'); if(res) res.classList.add('hidden');
  if(typeof window.vosItemCalcTotal==='function') window.vosItemCalcTotal();
};

if(typeof window.vosVendaSearchProd==='function' && !window.vosVendaSearchProd.__v52214rec){
  var oldSearch = window.vosVendaSearchProd;
  window.vosVendaSearchProd = function(q){
    if(ehRecargaNaVenda()){ pintarBuscaRecargas(q); return; }
    return oldSearch.apply(this, arguments);
  };
  window.vosVendaSearchProd.__v52214rec = true;
}

if(typeof window.vosOnTipoItem==='function' && !window.vosOnTipoItem.__v52214rec){
  var oldTipo = window.vosOnTipoItem;
  window.vosOnTipoItem = function(){
    var r = oldTipo.apply(this, arguments);
    var busca = document.getElementById('vos-prod-search');
    var f = window.__vosForm;
    if(ehRecargaNaVenda()){
      if(f){ f.produtoSel = null; }
      if(busca) busca.placeholder = 'Busque a recarga cadastrada (não puxa produto)...';
      var res = document.getElementById('vos-prod-results'); if(res){ res.classList.add('hidden'); res.innerHTML=''; }
    } else if(busca){
      if(f) f.recargaSel = null;
      busca.placeholder = 'Digite para buscar ou escreva a descrição manual...';
    }
    return r;
  };
  window.vosOnTipoItem.__v52214rec = true;
}

if(typeof window.vosAddItem==='function' && !window.vosAddItem.__v52214rec){
  var oldAdd = window.vosAddItem;
  window.vosAddItem = function(){
    var f = window.__vosForm;
    if(ehRecargaNaVenda() && f && f.recargaSel){
      f.produtoSel = {
        id: f.recargaSel.id,
        nome: f.recargaSel.nome,
        sku: f.recargaSel.codigo,
        preco: f.recargaSel.preco,
        categoria: 'Recarga',
        estoque: 999999
      };
    }
    var r = oldAdd.apply(this, arguments);
    if(f) f.recargaSel = null;
    return r;
  };
  window.vosAddItem.__v52214rec = true;
}

// v5.22.77: Recargas NÃO é submenu de Cadastros. A tela continua existindo
// pela função window.abrirAbaRecargas, mas o atalho não é mais injetado.

console.log('[DIGICOPY] v5.22.14 recargas: aba + venda sem estoque');
})();
