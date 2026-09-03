// ═══════════════════════════════════════════════════════════════════════════
// v5.22.37 — Menu Orçamentos (cadastro separado do Digicopy, NÃO é o
//            Buscador Escola). Lista, novo, excluir, estornar, filtros.
//            Não gera financeiro. Itens iguais à venda. Precisa estoque
//            para lançar, mas NÃO baixa estoque.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function n(v){ var x=Number(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function store(){
  if(typeof db==='undefined') return [];
  if(!Array.isArray(db.orcamentos)) db.orcamentos=[];
  return db.orcamentos;
}
function sess(){ return typeof getSession==='function'?getSession():null; }
function uidSafe(p){ return typeof uid==='function'?uid(p):(p+'_'+Date.now().toString(36)); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(v):('R$ '+(n(v).toFixed(2))); }
function dataBR(v){ return typeof fmtDate==='function'?fmtDate(v):(v||'-'); }
function ehServico(p){ return !p || /servi[cç]o|recarga/i.test(String(p.categoria||'')+' '+String(p.tipo||'')); }
function tokenNovo(){
  var b=new Uint8Array(18);
  if(typeof crypto!=='undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
  else for(var i=0;i<18;i++) b[i]=Math.floor(Math.random()*256);
  var s=''; for(var j=0;j<b.length;j++) s+=('0'+b[j].toString(16)).slice(-2);
  return 'o'+s;
}

var FILTROS = [
  ['hoje','Hoje'],
  ['cod_orc','Cód. Orc.'],
  ['cliente','Cliente'],
  ['data','Data'],
  ['vendedor','Vendedor'],
  ['cod_cliente','Cód. Cliente'],
  ['produto','Produto'],
  ['fechados','Fechados'],
  ['nao_fechados','Não Fechados']
];

function codigoNorm(v){ var d=String(v==null?'':v).replace(/\D/g,''); if(!d) return ''; return d.replace(/^0+/,'')||'0'; }
function clienteDe(o){
  if(!o || typeof db==='undefined') return {};
  return (db.clientes||[]).find(function(c){ return c.id===o.clienteId; })||{};
}
function ehFechado(o){ return !!(o && (o.status==='aprovado' || o.vendaId)); }

function filtraOrcamentos(list, campo, q){
  var arr=list||[];
  var termo=txt(q).toLowerCase();
  var h=hoje();
  return arr.filter(function(o){
    if(!o || o.status==='excluido') return false;
    var cl=clienteDe(o);
    if(campo==='hoje') return String(o.data||o.criadoEm||'').slice(0,10)===h;
    if(campo==='fechados') return ehFechado(o);
    if(campo==='nao_fechados') return !ehFechado(o) && o.status!=='estornado';
    if(campo==='cod_orc') return !termo || codigoNorm(o.numero)===codigoNorm(q);
    if(campo==='cod_cliente') return !termo || codigoNorm(cl.codigo)===codigoNorm(q) || codigoNorm(cl.codigoAntigo)===codigoNorm(q);
    if(campo==='cliente') return !termo || String(cl.nome||'').toLowerCase().indexOf(termo)>=0 || String(cl.fantasia||'').toLowerCase().indexOf(termo)>=0;
    if(campo==='data') return !termo || String(o.data||'').slice(0,10)===termo || dataBR(o.data).indexOf(txt(q))>=0;
    if(campo==='vendedor') return !termo || String(o.criadoPorNome||o.vendedorNome||'').toLowerCase().indexOf(termo)>=0;
    if(campo==='produto') return !termo || (o.itens||[]).some(function(it){ return String(it.descricao||'').toLowerCase().indexOf(termo)>=0; });
    if(!termo) return true;
    return String(o.numero||'').toLowerCase().indexOf(termo)>=0
      || String(cl.nome||'').toLowerCase().indexOf(termo)>=0
      || String(o.criadoPorNome||'').toLowerCase().indexOf(termo)>=0;
  });
}

function proximoNumero(empId){
  var max=0;
  store().forEach(function(o){
    if(empId && o.empresaId && o.empresaId!==empId) return;
    var nro=parseInt(codigoNorm(o.numero),10)||0;
    if(nro>max) max=nro;
  });
  return String(max+1);
}

window.ORCAMENTOS_PURE = {
  FILTROS: FILTROS,
  filtraOrcamentos: filtraOrcamentos,
  ehFechado: ehFechado,
  codigoNorm: codigoNorm,
  podeEstornar: function(o, venda){
    if(!o) return {ok:false, motivo:'Orçamento não encontrado'};
    if(o.status==='excluido') return {ok:false, motivo:'Orçamento já excluído'};
    if(venda && /faturad|finaliz|pago/i.test(venda.status||'')){
      return {ok:false, motivo:'A venda gerada já foi faturada. Estorne a venda primeiro.'};
    }
    return {ok:true};
  }
};

if(typeof document==='undefined') return;

var ST = window.__ORC_ST || (window.__ORC_ST = { campo:'nao_fechados', q:'', sel:null, form:null });

function garantirNuvem(){
  try{
    if(window.DIGICOPY_CLOUD_SYNC && window.DIGICOPY_CLOUD_SYNC.definitions)
      window.DIGICOPY_CLOUD_SYNC.definitions.orcamentos='array';
  }catch(e){}
}

function injetarMenu(){
  function addItem(items){
    if(!items) return items;
    if(items.some(function(it){ return it.id==='orcamentos'; })) return items;
    var copy=items.slice();
    var i=copy.findIndex(function(it){ return it.id==='notinhas'; });
    var item={id:'orcamentos', icon:'ph-clipboard-text', label:'Orçamentos', click:"navigateTo('orcamentos')"};
    if(i>=0) copy.splice(i+1,0,item); else copy.push(item);
    return copy;
  }
  if(window.MENUS_ATALHOS_PURE && typeof window.MENUS_ATALHOS_PURE.menusPadrao==='function' && !window.MENUS_ATALHOS_PURE.menusPadrao.__v52237orc){
    var old=window.MENUS_ATALHOS_PURE.menusPadrao;
    window.MENUS_ATALHOS_PURE.menusPadrao=function(){
      var list=old.apply(this, arguments)||[];
      return list.map(function(m){
        if(m.id!=='atendimento') return m;
        var c=Object.assign({}, m);
        c.items=addItem(m.items);
        return c;
      });
    };
    window.MENUS_ATALHOS_PURE.menusPadrao.__v52237orc=true;
  }
  if(window.MENUS_ATALHOS_PURE && typeof window.MENUS_ATALHOS_PURE.catalogoAtalhos==='function' && !window.MENUS_ATALHOS_PURE.catalogoAtalhos.__v52237orc){
    var oldC=window.MENUS_ATALHOS_PURE.catalogoAtalhos;
    window.MENUS_ATALHOS_PURE.catalogoAtalhos=function(){
      var list=oldC.apply(this, arguments)||[];
      if(!list.some(function(a){ return a.id==='orcamentos'; }))
        list.splice(2,0,{id:'orcamentos', icon:'ph-clipboard-text', label:'Orçamentos', click:"navigateTo('orcamentos')"});
      return list;
    };
    window.MENUS_ATALHOS_PURE.catalogoAtalhos.__v52237orc=true;
  }
}

if(typeof window.navigateTo==='function' && !window.navigateTo.__v52237orc){
  var oldNav=window.navigateTo;
  window.navigateTo=function(view){
    if(view==='orcamentos'){
      var el=typeof ensureView==='function'?ensureView('orcamentos'):document.getElementById('view-orcamentos');
      if(!el){
        el=document.createElement('section');
        el.id='view-orcamentos';
        el.className='view hidden space-y-4';
        var wrap=document.querySelector('main .flex-1.p-4, main .flex-1');
        if(wrap) wrap.appendChild(el);
      }
    }
    var r=oldNav.apply(this, arguments);
    if(view==='orcamentos'){
      document.querySelectorAll('.view').forEach(function(v){ v.classList.add('hidden'); });
      var alvo=document.getElementById('view-orcamentos');
      if(alvo) alvo.classList.remove('hidden');
      if(typeof setPageHeader==='function') setPageHeader('Orçamentos','Propostas ao cliente — não entram no financeiro');
      window.renderOrcamentos();
    }
    return r;
  };
  window.navigateTo.__v52237orc=true;
}

window.renderOrcamentos=function(){
  var s=sess(); if(!s) return;
  garantirNuvem();
  var view=typeof ensureView==='function'?ensureView('orcamentos'):document.getElementById('view-orcamentos');
  if(!view) return;
  var campo=(document.getElementById('orc-filtro-campo')||{}).value || ST.campo || 'nao_fechados';
  var q=(document.getElementById('orc-busca')||{}).value || ST.q || '';
  ST.campo=campo; ST.q=q;
  var base=store().filter(function(o){ return o.empresaId===s.empresaId && o.status!=='excluido'; });
  var list=filtraOrcamentos(base, campo, q).sort(function(a,b){
    return (parseInt(codigoNorm(b.numero),10)||0)-(parseInt(codigoNorm(a.numero),10)||0);
  });
  view.innerHTML='<div class="neo-shell"><div class="neo-panel neo-float-in">'
    +'<div class="neo-head"><div><h3>Orçamentos</h3><p>Cadastro separado. Não gera financeiro nem baixa estoque.</p></div>'
    +'<div class="neo-actions">'
    +'<button onclick="window.novoOrcamento()" class="neo-btn primary"><i class="ph ph-plus"></i>Novo</button>'
    +'<button onclick="window.estornarOrcamentosMarcados()" class="neo-btn"><i class="ph ph-arrow-counter-clockwise"></i>Estornar</button>'
    +'<button onclick="window.excluirOrcamentosMarcados()" class="neo-btn danger"><i class="ph ph-trash"></i>Excluir</button>'
    +'</div></div>'
    +'<div class="p-4 border-b bg-white flex flex-wrap items-center gap-2">'
    +'<button type="button" onclick="window.orcMostrarTodos()" class="neo-btn '+(campo==='todos'?'primary':'')+'">Todos</button>'
    +'<select id="orc-filtro-campo" class="h-10 px-3 rounded-xl border bg-white text-[13px] min-w-[180px]">'
    +FILTROS.map(function(it){ return '<option value="'+it[0]+'"'+(campo===it[0]?' selected':'')+'>'+it[1]+'</option>'; }).join('')
    +'</select>'
    +'<input id="orc-busca" value="'+esc(q)+'" placeholder="Buscar… (Enter ou lupa)" class="neo-input flex-1 min-w-[200px]">'
    +'<button type="button" onclick="window.orcBuscar()" class="h-10 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i></button>'
    +'<span class="text-[12px] text-slate-500">'+list.length+' registro(s)</span>'
    +'</div>'
    +'<div class="overflow-auto max-h-[calc(100vh-320px)]"><table class="neo-table"><thead><tr>'
    +'<th class="w-8"><input type="checkbox" onclick="document.querySelectorAll(\'input[name=orc-check]\').forEach(function(c){c.checked=this.checked}.bind(this))"></th>'
    +'<th>Código</th><th>Data</th><th>Cliente</th><th>Valor total</th><th></th></tr></thead><tbody>'
    +(list.map(function(o){
      var cl=clienteDe(o);
      var fech=ehFechado(o);
      return '<tr onclick="window.neoOrcSel=\''+o.id+'\';window.abrirOrcamento(\''+o.id+'\')" class="cursor-pointer '+(ST.sel===o.id?'neo-selected':'')+'">'
        +'<td class="px-2"><input type="checkbox" name="orc-check" value="'+o.id+'" onclick="event.stopPropagation()"></td>'
        +'<td><b class="text-[#0a1e8a]">'+esc(o.numero||'')+'</b>'+(fech?' <span class="text-[10px] text-emerald-700 font-bold">FECHADO</span>':'')+'</td>'
        +'<td>'+dataBR(o.data)+'</td>'
        +'<td><b>'+esc(cl.nome||'(sem cliente)')+'</b></td>'
        +'<td><b>'+money(o.total)+'</b></td>'
        +'<td><button onclick="event.stopPropagation();window.abrirOrcamento(\''+o.id+'\')" class="neo-btn !px-2"><i class="ph ph-eye"></i></button></td>'
        +'</tr>';
    }).join('') || '<tr><td colspan="6" class="text-center text-slate-400 py-12">Nenhum orçamento</td></tr>')
    +'</tbody></table></div></div></div>';
  var inp=document.getElementById('orc-busca');
  if(inp) inp.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); window.orcBuscar(); } };
  var sel=document.getElementById('orc-filtro-campo');
  if(sel) sel.onchange=function(){
    ST.campo=sel.value;
    if(/fechados|hoje/.test(sel.value)){ ST.q=''; if(inp) inp.value=''; }
    window.renderOrcamentos();
  };
};

window.orcBuscar=function(){
  ST.q=document.getElementById('orc-busca')&&document.getElementById('orc-busca').value||'';
  ST.campo=document.getElementById('orc-filtro-campo')&&document.getElementById('orc-filtro-campo').value||'todos';
  window.renderOrcamentos();
};
window.orcMostrarTodos=function(){ ST.campo='todos'; ST.q=''; window.renderOrcamentos(); };

function idsMarcados(){
  return Array.from(document.querySelectorAll('input[name="orc-check"]:checked')).map(function(c){ return c.value; });
}

window.excluirOrcamentosMarcados=function(){
  var ids=idsMarcados();
  if(!ids.length && window.neoOrcSel) ids=[window.neoOrcSel];
  if(!ids.length){ if(window.lfbAlert) window.lfbAlert('Marque um orçamento para excluir.','Excluir'); return; }
  var msg='Deseja excluir '+ids.length+' orçamento(s)?';
  var run=function(){
    ids.forEach(function(id){
      var o=store().find(function(x){ return x.id===id; });
      if(o) o.status='excluido';
    });
    if(typeof saveDB==='function') saveDB();
    window.renderOrcamentos();
    if(typeof toast==='function') toast('Orçamento(s) excluído(s)','success');
  };
  if(typeof window.confirmSistema==='function') window.confirmSistema(msg,'Excluir').then(function(ok){ if(ok) run(); });
};

window.estornarOrcamentosMarcados=function(){
  var s=sess(); if(!s) return;
  var ids=idsMarcados();
  if(!ids.length && window.neoOrcSel) ids=[window.neoOrcSel];
  if(!ids.length){ if(window.lfbAlert) window.lfbAlert('Marque um orçamento para estornar.','Estornar'); return; }
  var bloqueados=[];
  ids.forEach(function(id){
    var o=store().find(function(x){ return x.id===id; });
    var v=o && o.vendaId && (db.vendas||[]).find(function(x){ return x.id===o.vendaId; });
    var r=window.ORCAMENTOS_PURE.podeEstornar(o, v);
    if(!r.ok) bloqueados.push(r.motivo);
  });
  if(bloqueados.length){
    if(window.lfbAlert) window.lfbAlert(bloqueados[0],'Estornar');
    return;
  }
  var msg='Estornar '+ids.length+' orçamento(s)? Se já tiver gerado venda salva (não faturada), essa venda será excluída.';
  var run=function(){
    ids.forEach(function(id){
      var o=store().find(function(x){ return x.id===id; });
      if(!o) return;
      if(o.vendaId){
        db.vendas=(db.vendas||[]).filter(function(v){ return v.id!==o.vendaId; });
        o.vendaId=null; o.vendaNumero=null;
      }
      o.status='estornado';
      o.aprovadoEm=null;
    });
    if(typeof saveDB==='function') saveDB();
    window.renderOrcamentos();
    if(typeof toast==='function') toast('Orçamento estornado','success');
  };
  if(typeof window.confirmSistema==='function') window.confirmSistema(msg,'Estornar').then(function(ok){ if(ok) run(); });
};

function formNovo(existente){
  var s=sess();
  var agora=new Date();
  return {
    id: existente?existente.id:null,
    codigo: existente?existente.numero:proximoNumero(s&&s.empresaId),
    data: existente?(existente.data||'').slice(0,10):agora.toISOString().slice(0,10),
    hora: agora.toTimeString().slice(0,5),
    cliente: existente && existente.clienteId ? (db.clientes||[]).find(function(c){ return c.id===existente.clienteId; }) : null,
    itens: existente ? (existente.itens||[]).map(function(it){ return Object.assign({},it); }) : [],
    produtoSel: null,
    token: existente && existente.token ? existente.token : tokenNovo(),
    obs: existente? (existente.observacao||'') : ''
  };
}

window.novoOrcamento=function(){ window.abrirTelaOrcamento(null); };
window.abrirOrcamento=function(id){
  // v5.22.85 — procura de todos os jeitos antes de desistir: id, token,
  // número e, por último, o orçamento que já está na tela. Assim nunca cai
  // no "Orçamento não encontrado" por uma linha de timing da base.
  var o=store().find(function(x){ return x && x.id===id; });
  if(!o) o=store().find(function(x){ return x && (x.token===id || String(x.numero)===String(id)); });
  if(!o && window.__ORC_ST && window.__ORC_ST.form){
    var f=window.__ORC_ST.form;
    if(f.id===id || f.token===id){
      o={ id:f.id, numero:f.codigo||'-', empresaId:(sess()||{}).empresaId, data:f.data||hoje(), itens:(f.itens||[]).map(function(it){ return Object.assign({}, it); }), clienteId:f.cliente&&f.cliente.id, observacao:f.obs||'', os:f.os||{}, status:f.status||'aberto', vendaId:f.vendaId||'', vendaNumero:f.vendaNumero||'', token:f.token };
    }
  }
  if(!o){ if(typeof toast==='function') toast('Orçamento não encontrado','error'); return; }
  window.abrirTelaOrcamento(o);
};

window.abrirTelaOrcamento=function(existente){
  var s=sess(); if(!s) return;
  ST.form=formNovo(existente);
  var f=ST.form;
  var box=document.getElementById('modal-box');
  if(box) box.className='w-full max-w-[1180px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText=existente?'Orçamento '+f.codigo:'Novo orçamento';
  document.getElementById('modal-body').innerHTML=
    '<div class="space-y-3">'
    +'<div class="grid grid-cols-2 md:grid-cols-4 gap-2">'
    +'<div class="rounded-xl bg-[#0a1e8a] text-white p-3"><p class="text-[10px] uppercase font-bold text-white/70">Código</p><p class="font-bold text-[15px]" id="orc-codigo">'+esc(f.codigo)+'</p></div>'
    +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Data</p><p class="font-bold">'+esc(f.data.split('-').reverse().join('/'))+'</p></div>'
    +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Hora</p><p class="font-bold">'+esc(f.hora)+'</p></div>'
    +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Vendedor</p><p class="font-bold">'+esc(s.usuarioNome)+'</p></div>'
    +'</div>'
    +'<div class="rounded-[14px] border-2 border-[#0a1e8a]/20 bg-[#f8f9ff] p-3">'
    +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Cliente *</label>'
    +'<div class="flex gap-2 mt-1 items-center">'
    +'<input id="orc-cli-search" placeholder="Busque o cliente (Enter ou lupa)" class="flex-1 h-[44px] px-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white text-[13px]">'
    +'<button type="button" onclick="window.orcBuscarCliente()" class="h-[44px] px-4 rounded-xl bg-[#0a1e8a] text-white"><i class="ph ph-magnifying-glass"></i></button>'
    +'</div>'
    +'<div id="orc-cli-results" class="hidden mt-1 max-h-[220px] overflow-auto rounded-xl border bg-white shadow-xl text-[12.5px]"></div>'
    +'<div id="orc-cli-sel" class="'+(f.cliente?'':'hidden')+' mt-2 rounded-xl bg-white border p-3 flex justify-between">'
    +'<div><p class="font-bold" id="orc-cli-nome">'+(f.cliente?esc((f.cliente.codigo?'#'+f.cliente.codigo+' — ':'')+(f.cliente.nome||'')):'')+'</p></div>'
    +'<button type="button" onclick="window.orcLimparCliente()" class="w-8 h-8 rounded-lg bg-red-50 text-red-600"><i class="ph ph-x"></i></button></div>'
    +'</div>'
    +'<div class="rounded-[14px] border bg-[#f8f9ff] p-3 space-y-2">'
    +'<div class="grid grid-cols-12 gap-2 items-end">'
    +'<label class="col-span-12 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">Tipo<select id="orc-item-tipo" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12px]"><option>Produto</option><option>Recarga de toner</option></select></label>'
    +'<label class="col-span-10 md:col-span-5 text-[11px] font-bold uppercase text-[#0a1e8a] relative">Descrição ou código do produto/serviço'
    +'<input id="orc-prod-search" placeholder="Digite e Enter / lupa" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]">'
    +'<div id="orc-prod-results" class="hidden absolute z-30 left-0 right-0 top-full mt-1 max-h-[200px] overflow-auto rounded-xl border bg-white shadow-xl text-[12px]"></div></label>'
    +'<label class="col-span-3 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">QTD<input id="orc-item-qtd" type="number" min="1" value="1" class="mt-1 w-full h-[40px] px-2 rounded-xl border"></label>'
    +'<label class="col-span-4 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">V. UNIT<input id="orc-item-vunit" type="number" step="0.01" class="mt-1 w-full h-[40px] px-2 rounded-xl border"></label>'
    +'<label class="col-span-5 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">DESC R$<input id="orc-item-desc" type="number" step="0.01" value="" class="mt-1 w-full h-[40px] px-2 rounded-xl border"></label>'
    +'<label class="col-span-12 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">TOTAL<input id="orc-item-total" readonly class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-slate-100 font-bold"></label>'
    +'</div>'
    +'<div class="flex justify-end"><button type="button" id="orc-btn-add" disabled onclick="window.orcAddItem()" class="h-[40px] px-5 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"><i class="ph ph-plus-circle"></i> Adicionar item</button></div>'
    +'</div>'
    +'<div class="rounded-[14px] border overflow-hidden bg-white"><table class="w-full text-left text-[12px]">'
    +'<thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-[#0a1e8a]"><tr><th class="px-3 py-2">Tipo</th><th class="px-3 py-2">Descrição</th><th class="px-3 py-2">Qtd</th><th class="px-3 py-2">V.Unit</th><th class="px-3 py-2">Desc</th><th class="px-3 py-2">Total</th><th></th></tr></thead>'
    +'<tbody id="orc-itens-body" class="divide-y"></tbody></table></div>'
    +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Observações<textarea id="orc-obs" class="mt-1 w-full h-[52px] p-2 rounded-xl border">'+esc(f.obs)+'</textarea></label>'
    +'<div class="rounded-[14px] bg-[#0a1e8a] text-white p-3 flex justify-between"><span>TOTAL</span><b id="orc-total">R$ 0,00</b></div>'
    +'</div>';
  document.getElementById('modal-footer').innerHTML=
    '<button onclick="closeModal()" class="h-[46px] px-5 rounded-xl bg-white border text-red-600 font-bold">Sair</button>'
    +(existente?'<button onclick="window.imprimirOrcamento(\''+existente.id+'\')" class="h-[46px] px-5 rounded-xl bg-white border font-bold"><i class="ph ph-printer"></i> Imprimir</button>':'')
    +'<button onclick="window.salvarOrcamentoTela()" class="h-[46px] px-6 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-floppy-disk"></i> Salvar</button>';
  document.getElementById('modal-root').classList.remove('hidden');
  window.modalContext={type:'orcamento'};
  window.orcRenderItens();
  var cli=document.getElementById('orc-cli-search');
  if(cli) cli.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); window.orcBuscarCliente(); } };
  var pr=document.getElementById('orc-prod-search');
  if(pr) pr.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); window.orcBuscarProd(); } };
  ['orc-item-qtd','orc-item-vunit','orc-item-desc'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.oninput=window.orcCalcItem;
  });
  setTimeout(function(){
    if(window.FILTROS_BUSCA_PURE && typeof document!=='undefined'){
      var inp=document.getElementById('orc-cli-search');
      if(inp && !document.getElementById('orc-cli-campo')){
        var sel=document.createElement('select');
        sel.id='orc-cli-campo';
        sel.className='h-10 px-2 rounded-xl border bg-white text-[12px] min-w-[148px]';
        var campos=(window.CLI_PURE&&window.CLI_PURE.CAMPOS_BUSCA)||window.FILTROS_BUSCA_PURE.CAMPOS_CLIENTE||[['todos','Tudo']];
        sel.innerHTML=campos.map(function(it){ var k=Array.isArray(it)?it[0]:it; var r=Array.isArray(it)?it[1]:it; return '<option value="'+esc(k)+'">'+esc(r)+'</option>'; }).join('');
        inp.parentNode.insertBefore(sel, inp);
      }
    }
  }, 30);
};

window.orcBuscarCliente=function(){
  var q=txt(document.getElementById('orc-cli-search')&&document.getElementById('orc-cli-search').value);
  var el=document.getElementById('orc-cli-results'); if(!el) return;
  if(!q){ el.classList.add('hidden'); return; }
  var s=sess();
  var list=(db.clientes||[]).filter(function(c){ return !s||!c.empresaId||c.empresaId===s.empresaId; });
  var campo=(document.getElementById('orc-cli-campo')||{}).value||'todos';
  if(window.FILTROS_BUSCA_PURE) list=window.FILTROS_BUSCA_PURE.filtraClientes(list,q,campo);
  list=list.slice(0,15);
  el.classList.remove('hidden');
  el.innerHTML=list.map(function(c){
    return '<button type="button" onclick="window.orcSelCliente(\''+c.id+'\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b"><b class="text-[#0a1e8a]">#'+esc(c.codigo||'-')+'</b> <b>'+esc(c.nome||'')+'</b></button>';
  }).join('')||'<p class="px-3 py-3 text-slate-400">Nenhum cliente</p>';
};
window.orcSelCliente=function(id){
  var c=(db.clientes||[]).find(function(x){ return x.id===id; }); if(!c||!ST.form) return;
  ST.form.cliente=c;
  document.getElementById('orc-cli-results').classList.add('hidden');
  document.getElementById('orc-cli-search').value='';
  document.getElementById('orc-cli-sel').classList.remove('hidden');
  document.getElementById('orc-cli-nome').textContent=(c.codigo?'#'+c.codigo+' — ':'')+(c.nome||'');
};
window.orcLimparCliente=function(){ if(ST.form) ST.form.cliente=null; document.getElementById('orc-cli-sel').classList.add('hidden'); };

window.orcBuscarProd=function(){
  var q=txt(document.getElementById('orc-prod-search')&&document.getElementById('orc-prod-search').value);
  var el=document.getElementById('orc-prod-results'); if(!el) return;
  if(!q){ el.classList.add('hidden'); return; }
  var s=sess();
  var list=(db.produtos||[]).filter(function(p){ return !s||!p.empresaId||p.empresaId===s.empresaId; });
  if(window.FILTROS_BUSCA_PURE) list=window.FILTROS_BUSCA_PURE.filtraProdutos(list,q,'');
  else list=list.filter(function(p){ return String(p.nome||'').toLowerCase().indexOf(q.toLowerCase())>=0; });
  list=list.slice(0,10);
  el.classList.remove('hidden');
  el.innerHTML=list.map(function(p){
    return '<button type="button" onclick="window.orcSelProd(\''+p.id+'\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b"><b>'+esc(p.nome||'')+'</b><br><span class="text-slate-500 text-[11px]">'+esc(p.sku||'')+' • estoque '+(p.estoque||0)+' • <b>'+money(p.preco)+'</b></span></button>';
  }).join('')||'<p class="px-3 py-2 text-slate-400">Sem produto — a descrição digitada será usada</p>';
};
window.orcSelProd=function(id){
  var p=(db.produtos||[]).find(function(x){ return x.id===id; }); if(!p||!ST.form) return;
  ST.form.produtoSel=p;
  document.getElementById('orc-prod-search').value=p.nome||'';
  document.getElementById('orc-item-vunit').value=p.preco||0;
  document.getElementById('orc-prod-results').classList.add('hidden');
  window.orcCalcItem();
  if(!ehServico(p) && n(p.estoque)<=0){
    if(typeof window.confirmSistema==='function'){
      window.confirmSistema('O produto "'+(p.nome||'')+'" está com estoque zerado. Deseja modificar o estoque?','Estoque zerado').then(function(ok){
        if(!ok) return;
        window.__orcPendenteVolta=ST.form;
        window.__vosIgnorarSair=true;
        if(typeof window.openModal==='function') window.openModal('produto', p.id);
        setTimeout(function(){ if(typeof window.mudarAbaProdutoOperacional==='function') window.mudarAbaProdutoOperacional('estoque'); window.__vosIgnorarSair=false; }, 80);
      });
    }
  }
};
window.orcCalcItem=function(){
  var qtd=n(document.getElementById('orc-item-qtd')&&document.getElementById('orc-item-qtd').value);
  var vu=n(document.getElementById('orc-item-vunit')&&document.getElementById('orc-item-vunit').value);
  var de=n(document.getElementById('orc-item-desc')&&document.getElementById('orc-item-desc').value);
  var el=document.getElementById('orc-item-total');
  if(el) el.value=money(Math.max(0,qtd*vu-de));
  // v5.22.84 — Adicionar só liga com valor unitário preenchido (qtd fica 1,
  // desconto nasce vazio e não participa da liberação)
  var btn=document.getElementById('orc-btn-add');
  if(btn) btn.disabled=!/^\d+(?:[.,]\d+)?$/.test(String((document.getElementById('orc-item-vunit')||{}).value||'').trim());
};
window.orcAddItem=function(){
  var f=ST.form; if(!f) return;
  var desc=txt(document.getElementById('orc-prod-search')&&document.getElementById('orc-prod-search').value);
  var p=f.produtoSel;
  if(!p && !desc){ if(typeof toast==='function') toast('Selecione um produto ou escreva a descrição','error'); return; }
  var qtd=n(document.getElementById('orc-item-qtd')&&document.getElementById('orc-item-qtd').value)||1;
  if(p && !ehServico(p)){
    if(n(p.estoque)<=0 || qtd>n(p.estoque)){
      if(typeof window.confirmSistema==='function'){
        window.confirmSistema('O produto "'+(p.nome||'')+'" está sem estoque suficiente. Deseja modificar o estoque?','Estoque').then(function(ok){
          if(!ok) return;
          window.__orcPendenteVolta=f;
          window.__vosIgnorarSair=true;
          if(typeof window.openModal==='function') window.openModal('produto', p.id);
          setTimeout(function(){ if(typeof window.mudarAbaProdutoOperacional==='function') window.mudarAbaProdutoOperacional('estoque'); window.__vosIgnorarSair=false; }, 80);
        });
      }
      return;
    }
  }
  var preco=n(document.getElementById('orc-item-vunit')&&document.getElementById('orc-item-vunit').value);
  var descV=n(document.getElementById('orc-item-desc')&&document.getElementById('orc-item-desc').value);
  // v5.22.84 — sem valor unitário numérico, não adiciona
  if(!/^\d+(?:[.,]\d+)?$/.test(String((document.getElementById('orc-item-vunit')||{}).value||'').trim())){ if(typeof toast==='function') toast('Informe um valor unitário numérico para adicionar o item','error'); return; }
  f.itens.push({
    produtoId:p?p.id:null, descricao:p?(p.nome||''):desc, sku:p?(p.sku||''):'',
    tipo:(document.getElementById('orc-item-tipo')||{}).value||'Produto',
    qtd:qtd, preco:preco, desconto:descV, subtotal:Math.max(0,qtd*preco-descV)
  });
  f.produtoSel=null;
  document.getElementById('orc-prod-search').value='';
  document.getElementById('orc-item-qtd').value=1;
  document.getElementById('orc-item-vunit').value='';
  document.getElementById('orc-item-desc').value='';
  window.orcRenderItens();
};
window.orcRenderItens=function(){
  var f=ST.form; var body=document.getElementById('orc-itens-body'); if(!body||!f) return;
  body.innerHTML=f.itens.map(function(it,i){
    return '<tr><td class="px-3 py-2">'+esc(it.tipo||'')+'</td><td class="px-3 py-2"><b>'+esc(it.descricao)+'</b></td><td class="px-3 py-2">'+it.qtd+'</td><td class="px-3 py-2">'+money(it.preco)+'</td><td class="px-3 py-2">'+money(it.desconto)+'</td><td class="px-3 py-2"><b>'+money(it.subtotal)+'</b></td><td class="px-2"><button onclick="window.orcRemoveItem('+i+')" class="w-7 h-7 rounded-lg bg-red-50 text-red-600"><i class="ph ph-trash"></i></button></td></tr>';
  }).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-8">Nenhum item lançado</td></tr>';
  var tot=f.itens.reduce(function(s,i){ return s+(i.subtotal||0); },0);
  var t=document.getElementById('orc-total'); if(t) t.textContent=money(tot);
};
window.orcRemoveItem=function(i){ if(ST.form) ST.form.itens.splice(i,1); window.orcRenderItens(); };

window.salvarOrcamentoTela=function(){
  var s=sess(); var f=ST.form; if(!s||!f) return;
  if(!f.cliente){ if(window.lfbAlert) window.lfbAlert('Escolha o cliente.','Orçamento'); return; }
  if(!f.itens.length){ if(window.lfbAlert) window.lfbAlert('Lance ao menos um item.','Orçamento'); return; }
  var tot=f.itens.reduce(function(sum,it){ return sum+(it.subtotal||0); },0);
  var o=f.id ? store().find(function(x){ return x.id===f.id; }) : null;
  if(!o){
    o={ id:uidSafe('orc'), empresaId:s.empresaId, numero:f.codigo, token:f.token, criadoEm:new Date().toISOString(), criadoPor:s.usuarioId, criadoPorNome:s.usuarioNome, status:'aberto' };
    store().push(o);
    f.id=o.id;
  }
  if(ehFechado(o) && o.status==='aprovado'){
    if(window.lfbAlert) window.lfbAlert('Orçamento já aprovado. Estorne para alterar.','Orçamento');
    return;
  }
  Object.assign(o,{
    clienteId:f.cliente.id, data:f.data, itens:f.itens.map(function(it){ return Object.assign({},it); }),
    total:tot, observacao:txt(document.getElementById('orc-obs')&&document.getElementById('orc-obs').value),
    token:o.token||f.token, status:o.status==='estornado'?'aberto':(o.status||'aberto'),
    atualizadoEm:new Date().toISOString()
  });
  if(typeof saveDB==='function') saveDB();
  if(typeof toast==='function') toast('Orçamento '+o.numero+' salvo','success');
  ST.form.id=o.id;
};

['salvarProdutoOperacional','saveProduto'].forEach(function(nome){
  if(typeof window[nome]!=='function' || window[nome].__v52237orc) return;
  var old=window[nome];
  window[nome]=function(){
    var pend=window.__orcPendenteVolta;
    var r=old.apply(this, arguments);
    if(pend){
      setTimeout(function(){
        window.__orcPendenteVolta=null;
        ST.form=pend;
        window.abrirTelaOrcamento({
          id:pend.id, numero:pend.codigo, data:pend.data, clienteId:pend.cliente&&pend.cliente.id,
          itens:pend.itens, token:pend.token, observacao:pend.obs
        });
      }, 40);
    }
    return r;
  };
  window[nome].__v52237orc=true;
});

injetarMenu();
setTimeout(function(){ injetarMenu(); if(typeof window.pintarMenus==='function') window.pintarMenus(); }, 600);
garantirNuvem();

console.log('[DIGICOPY] v5.22.37 menu orçamentos (ERP, não buscador)');
})();
