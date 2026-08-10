// PATCH busca por etiqueta na Início + nova venda pré-preenchida
(function(){
  function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function sess(){ return typeof getSession==='function'?getSession():null; }

  function vendasComEtiqueta(codigo){
    const c = String(codigo||'').trim();
    if(!c) return [];
    const low = c.toLowerCase();
    return (db.vendas||[]).filter(v=>{
      if(!v.itens) return false;
      return v.itens.some(it=>{
        const p = it.produtoId ? (db.produtos||[]).find(pr=>pr.id===it.produtoId) : null;
        const sku = (p&&p.sku||'').toLowerCase();
        const nome = (p&&p.nome||it.descricao||'').toLowerCase();
        const numCart = String(it.numCartucho||'').toLowerCase();
        const ident = String(it.identificacao||'').toLowerCase();
        return sku===low || numCart===low || ident===low || sku.includes(low) || numCart.includes(low);
      });
    });
  }

  function clienteDaVenda(v){
    if(v.clienteId) return (db.clientes||[]).find(c=>c.id===v.clienteId) || null;
    return null;
  }

  window.buscarVendasPorEtiqueta = function(){
    const code = document.getElementById('etq-busca-input')?.value?.trim();
    if(!code){ if(typeof toast==='function') toast('Digite o código da etiqueta','error'); return; }
    const vendas = vendasComEtiqueta(code);
    const resEl = document.getElementById('etq-busca-result');
    if(!resEl) return;
    if(!vendas.length){
      resEl.innerHTML = '<div class="text-center text-slate-500 text-[12px] py-6">Nenhuma venda encontrada para etiqueta <b>'+esc(code)+'</b></div>'
        + '<div class="text-center mt-3"><button onclick="novaVendaComEtiqueta(\''+esc(code)+'\')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]">+ Criar nova venda com esta etiqueta</button></div>';
      resEl.classList.remove('hidden');
      return;
    }
    // mostra vendas
    const rows = vendas.slice(0,20).map(v=>{
      const cli = clienteDaVenda(v) || {};
      return '<div class="flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 cursor-pointer" onclick="historicoVenda(\''+v.id+'\')">'
        + '<div><p class="font-bold text-[12px] text-[#0a1e8a]">'+esc(v.numero||'')+' • '+esc(cli.nome||v.clienteNomeAntigo||'')+'</p><p class="text-[11px] text-slate-500">'+(v.data?new Date(v.data).toLocaleDateString('pt-BR'):'')+' • '+esc(v.status||'')+' • '+esc((v.itens||[]).length+' itens')+' • '+esc(v.total?('R$ '+Number(v.total).toFixed(2)):'')+'</p></div>'
        + '<button onclick="event.stopPropagation(); historicoVenda(\''+v.id+'\')" class="w-8 h-8 rounded-lg bg-white border grid place-items-center"><i class="ph ph-eye"></i></button></div>';
    }).join('');
    const ultimaVenda = vendas.sort((a,b)=> new Date(b.data||0)-new Date(a.data||0))[0];
    const cliUlt = clienteDaVenda(ultimaVenda);
    resEl.innerHTML = '<div class="text-[11px] font-bold text-slate-600 mb-2">'+vendas.length+' venda(s) com etiqueta '+esc(code)+'</div>'
      + '<div class="space-y-2 max-h-[280px] overflow-auto">'+rows+'</div>'
      + '<div class="mt-3 flex gap-2"><button onclick="novaVendaComEtiqueta(\''+esc(code)+'\')" class="flex-1 h-10 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]">+ Nova venda com esta etiqueta/cliente</button>'
      + '<button onclick="document.getElementById(\'etq-busca-result\').classList.add(\'hidden\')" class="h-10 px-4 rounded-xl bg-white border font-bold text-[12px]">Fechar</button></div>'
      + (cliUlt?'<p class="text-[11px] text-slate-500 mt-2">Cliente sugerido: <b>'+esc(cliUlt.nome)+'</b> (#'+esc(cliUlt.codigo||'')+')</p>':'');
    resEl.classList.remove('hidden');
  };

  window.novaVendaComEtiqueta = function(codigo){
    const c = String(codigo||'').trim();
    // tenta achar última venda com essa etiqueta para pegar cliente e produto
    const vendas = vendasComEtiqueta(c);
    let cli = null, prod = null, numCart = c;
    if(vendas.length){
      const v = vendas.sort((a,b)=> new Date(b.data||0)-new Date(a.data||0))[0];
      cli = clienteDaVenda(v);
      // pega primeiro item que bate com etiqueta
      const it = (v.itens||[]).find(it=>{
        const p = it.produtoId ? (db.produtos||[]).find(pr=>pr.id===it.produtoId) : null;
        return String(it.numCartucho||'').toLowerCase()===c.toLowerCase() || String(p&&p.sku||'').toLowerCase()===c.toLowerCase();
      }) || v.itens[0];
      if(it && it.produtoId) prod = (db.produtos||[]).find(pr=>pr.id===it.produtoId) || null;
      if(it) numCart = it.numCartucho || c;
    } else {
      // sem venda anterior, tenta achar produto direto por sku
      prod = (db.produtos||[]).find(p=> String(p.sku||'').toLowerCase()===c.toLowerCase()) || null;
    }
    if(typeof novaVenda!=='function'){ if(typeof toast==='function') toast('Tela de venda não disponível','error'); return; }
    novaVenda();
    setTimeout(()=>{
      try{
        // seleciona cliente
        if(cli && typeof vosVendaSelectCliente==='function') vosVendaSelectCliente(cli.id);
        else if(cli && window.selectClienteVenda) window.selectClienteVenda(cli.id);
        // seleciona produto
        if(prod){
          if(typeof vosVendaSelectProd==='function') vosVendaSelectProd(prod.id);
          else if(window.selectProdutoVenda) window.selectProdutoVenda(prod.id);
          // preenche num cartucho se for recarga
          setTimeout(()=>{
            const cartEl = document.getElementById('vos-item-cartucho') || document.getElementById('vos-item-ident');
            if(cartEl) cartEl.value = numCart;
            // força qtd 1
            const qtdEl = document.getElementById('vos-item-qtd');
            if(qtdEl) qtdEl.value = 1;
            if(typeof vosAddItem==='function'){
              // adiciona automaticamente
              vosAddItem();
            }
          }, 250);
        } else {
          const searchEl = document.getElementById('vos-prod-search') || document.getElementById('nv-prod-search') || document.getElementById('vos-prod-search');
          if(searchEl) searchEl.value = c;
        }
        if(typeof toast==='function') toast('Venda pré-preenchida com etiqueta '+c,'success');
      }catch(e){}
    }, 400);
  };

  // injeta campo na Início (ações rápidas)
  function injetarBuscaInicio(){
    const view = document.getElementById('view-dashboard');
    if(!view) return;
    if(document.getElementById('etq-busca-box')) return;
    // procura área de ações rápidas (botões Nova venda etc)
    const actions = view.querySelector('.grid');
    // fallback: insere no topo
    const box = document.createElement('div');
    box.id='etq-busca-box';
    box.className='mt-4 rounded-[16px] bg-white border p-4 shadow-sm';
    box.innerHTML = '<div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-[#0a1e8a] text-white grid place-items-center"><i class="ph ph-barcode"></i></div><div><p class="font-bold text-[13px]">Buscar por etiqueta</p><p class="text-[11px] text-slate-500">Digite o código colado no cartucho para ver vendas e criar nova venda já preenchida</p></div></div>'
      + '<div class="flex gap-2"><div class="flex-1 relative"><i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i><input id="etq-busca-input" onkeydown="if(event.key===\'Enter\') buscarVendasPorEtiqueta()" placeholder="Ex: 000123, CART-001..." class="w-full h-11 pl-10 pr-3 rounded-xl border bg-white text-[13px]"></div><button onclick="buscarVendasPorEtiqueta()" class="h-11 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold text-[13px]">Buscar</button></div>'
      + '<div id="etq-busca-result" class="hidden mt-3 rounded-xl border bg-slate-50 p-3"></div>';
    // insere após o primeiro grid de KPIs ou no topo
    // injeta como irmão de view-dashboard para não ser apagado no re-render
    const main = document.querySelector('#app-shell main .flex-1') || view.parentElement;
    if(main && !document.getElementById('etq-busca-box')){
      view.parentElement.insertBefore(box, view);
    }
  }

  // mostra só no Início (dashboard), esconde em outros menus
  function atualizarVisibilidadeEtiqueta(){
    const box=document.getElementById('etq-busca-box');
    if(!box) return;
    const dash=document.getElementById('view-dashboard');
    const visivel = dash && !dash.classList.contains('hidden');
    box.style.display = visivel ? 'block' : 'none';
  }
  // tenta injetar quando dashboard renderiza
  const origRenderDash = window.renderDashboard;
  if(origRenderDash){
    window.renderDashboard = function(){ const r=origRenderDash.apply(this,arguments); setTimeout(()=>{ injetarBuscaInicio(); atualizarVisibilidadeEtiqueta(); }, 300); return r; };
  }
  // também observa navegação para esconder/mostrar
  const origNavEtq = window.navigateTo;
  if(origNavEtq && !origNavEtq.__etqPatched){
    window.navigateTo = function(...args){ const r=origNavEtq.apply(this,args); setTimeout(atualizarVisibilidadeEtiqueta, 50); return r; };
    window.navigateTo.__etqPatched=true;
  }
  // também observa view-dashboard
  try{
    const obs=new MutationObserver(()=>{ const v=document.getElementById('view-dashboard'); if(v && !v.classList.contains('hidden')) injetarBuscaInicio(); });
    obs.observe(document.body,{childList:true, subtree:true});
  }catch(e){}
  setTimeout(injetarBuscaInicio, 1200);
  console.log('[DIGICOPY] etiqueta_busca_patch carregado');
})();
