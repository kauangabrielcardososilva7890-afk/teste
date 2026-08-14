// PATCH busca por etiqueta — SOMENTE o número da etiqueta do cartucho
(function(){
  function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function normEtq(v){ return String(v??'').replace(/\s+/g,'').toUpperCase(); }
  function ehMesmaEtiqueta(valor, codigo){
    const a = normEtq(valor), b = normEtq(codigo);
    return !!(a && b && a === b);
  }

  // NÃO usa código da venda, SKU, nome do produto, cliente. Só o nº da etiqueta.
  function vendasComEtiqueta(codigo){
    const c = String(codigo||'').trim();
    if(!c) return [];
    return (db.vendas||[]).filter(v=>{
      if(!v.itens) return false;
      return v.itens.some(it => ehMesmaEtiqueta(it.numCartucho, c));
    });
  }

  function recargaCadastrada(codigo){
    return ((db.recargasEtiquetas)||[]).find(r => ehMesmaEtiqueta(r.etiqueta, codigo)) || null;
  }

  function clienteDaVenda(v){
    if(v.clienteId) return (db.clientes||[]).find(c=>c.id===v.clienteId) || null;
    return null;
  }

  window.buscarVendasPorEtiqueta = function(){
    const code = document.getElementById('etq-busca-input')?.value?.trim();
    if(!code){ if(typeof toast==='function') toast('Digite o código da etiqueta','error'); return; }
    const vendas = vendasComEtiqueta(code);
    const rec = recargaCadastrada(code);
    const resEl = document.getElementById('etq-busca-result');
    if(!resEl) return;
    if(!vendas.length && !rec){
      resEl.innerHTML = '<div class="text-center text-slate-500 text-[12px] py-6">Nenhuma recarga com a etiqueta <b>'+esc(code)+'</b></div>'
        + '<div class="text-center mt-3"><button onclick="novaVendaComEtiqueta(\''+esc(code)+'\')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]">+ Criar nova venda com esta etiqueta</button></div>';
      resEl.classList.remove('hidden');
      return;
    }
    const rows = vendas.slice(0,20).map(v=>{
      const cli = clienteDaVenda(v) || {};
      const it = (v.itens||[]).find(x => ehMesmaEtiqueta(x.numCartucho, code));
      return '<div class="flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 cursor-pointer" onclick="historicoVenda(\''+v.id+'\')">'
        + '<div><p class="font-bold text-[12px] text-[#0a1e8a]">Etiqueta '+esc(code)+(it&&it.descricao?(' • '+esc(it.descricao)):'')+'</p><p class="text-[11px] text-slate-500">'+esc(cli.nome||v.clienteNomeAntigo||'')+(it&&it.preco!=null?(' • R$ '+Number(it.preco).toFixed(2)):'')+'</p></div>'
        + '<button onclick="event.stopPropagation(); historicoVenda(\''+v.id+'\')" class="w-8 h-8 rounded-lg bg-white border grid place-items-center"><i class="ph ph-eye"></i></button></div>';
    }).join('');
    const ultimaVenda = vendas.length ? vendas.slice().sort((a,b)=> new Date(b.data||0)-new Date(a.data||0))[0] : null;
    const cliUlt = ultimaVenda ? clienteDaVenda(ultimaVenda) : (rec && rec.clienteId ? (db.clientes||[]).find(c=>c.id===rec.clienteId) : null);
    resEl.innerHTML = '<div class="text-[11px] font-bold text-slate-600 mb-2">Etiqueta '+esc(code)+(vendas.length?(' — '+vendas.length+' recarga(s)'):'')+'</div>'
      + (rec && rec.descricao ? '<p class="text-[12px] mb-2">Descrição cadastrada: <b>'+esc(rec.descricao)+'</b>'+(rec.valor!=null?(' • R$ '+Number(rec.valor).toFixed(2)):'')+'</p>' : '')
      + '<div class="space-y-2 max-h-[280px] overflow-auto">'+rows+'</div>'
      + '<div class="mt-3 flex gap-2"><button onclick="novaVendaComEtiqueta(\''+esc(code)+'\')" class="flex-1 h-10 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]">+ Nova venda com esta etiqueta</button>'
      + '<button onclick="document.getElementById(\'etq-busca-result\').classList.add(\'hidden\')" class="h-10 px-4 rounded-xl bg-white border font-bold text-[12px]">Fechar</button></div>'
      + (cliUlt?'<p class="text-[11px] text-slate-500 mt-2">Cliente da etiqueta: <b>'+esc(cliUlt.nome)+'</b></p>':'');
    resEl.classList.remove('hidden');
  };

  window.novaVendaComEtiqueta = function(codigo){
    const c = String(codigo||'').trim();
    const vendas = vendasComEtiqueta(c);
    const rec = recargaCadastrada(c);
    let cli = null, desc = '', valor = 0;
    if(rec){
      desc = rec.descricao || '';
      valor = rec.valor || 0;
      if(rec.clienteId) cli = (db.clientes||[]).find(x=>x.id===rec.clienteId) || null;
    }
    if(vendas.length){
      const v = vendas.slice().sort((a,b)=> new Date(b.data||0)-new Date(a.data||0))[0];
      if(!cli) cli = clienteDaVenda(v);
      const it = (v.itens||[]).find(x => ehMesmaEtiqueta(x.numCartucho, c));
      if(it){
        if(!desc) desc = it.descricao || '';
        if(!valor) valor = it.preco || 0;
      }
    }
    if(typeof novaVenda!=='function'){ if(typeof toast==='function') toast('Tela de venda não disponível','error'); return; }
    novaVenda();
    setTimeout(()=>{
      try{
        const tipo = document.getElementById('vos-item-tipo');
        if(tipo){ tipo.value = 'Recarga de toner'; if(typeof vosOnTipoItem==='function') vosOnTipoItem(); }
        if(cli && typeof vosVendaSelectCliente==='function') vosVendaSelectCliente(cli.id);
        const cartEl = document.getElementById('vos-item-cartucho');
        if(cartEl) cartEl.value = c;
        const descEl = document.getElementById('vos-prod-search');
        if(descEl) descEl.value = desc || '';
        const vu = document.getElementById('vos-item-vunit');
        if(vu && valor) vu.value = valor;
        if(typeof vosItemCalcTotal==='function') vosItemCalcTotal();
        if(typeof toast==='function') toast('Etiqueta '+c+' preenchida','success');
      }catch(e){}
    }, 400);
  };

  function injetarBuscaInicio(){
    const view = document.getElementById('view-dashboard');
    if(!view) return;
    if(document.getElementById('etq-busca-box')) return;
    const box = document.createElement('div');
    box.id='etq-busca-box';
    box.className='mt-4 rounded-[16px] bg-white border p-4 shadow-sm';
    box.innerHTML = '<div class="flex items-center gap-2 mb-2"><div class="w-8 h-8 rounded-lg bg-[#0a1e8a] text-white grid place-items-center"><i class="ph ph-barcode"></i></div><div><p class="font-bold text-[13px]">Buscar por etiqueta</p><p class="text-[11px] text-slate-500">Só o número colado no cartucho — não busca código de venda</p></div></div>'
      + '<div class="flex gap-2"><div class="flex-1 relative"><i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i><input id="etq-busca-input" onkeydown="if(event.key===\'Enter\') buscarVendasPorEtiqueta()" placeholder="Nº da etiqueta" class="w-full h-11 pl-10 pr-3 rounded-xl border bg-white text-[13px]"></div><button onclick="buscarVendasPorEtiqueta()" class="h-11 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold text-[13px]">Buscar</button></div>'
      + '<div id="etq-busca-result" class="hidden mt-3 rounded-xl border bg-slate-50 p-3"></div>';
    if(view.parentElement && !document.getElementById('etq-busca-box')){
      view.parentElement.insertBefore(box, view);
    }
  }

  function atualizarVisibilidadeEtiqueta(){
    const box=document.getElementById('etq-busca-box');
    if(!box) return;
    const dash=document.getElementById('view-dashboard');
    const visivel = dash && !dash.classList.contains('hidden');
    box.style.display = visivel ? 'block' : 'none';
  }
  const origRenderDash = window.renderDashboard;
  if(origRenderDash){
    window.renderDashboard = function(){ const r=origRenderDash.apply(this,arguments); setTimeout(()=>{ injetarBuscaInicio(); atualizarVisibilidadeEtiqueta(); }, 300); return r; };
  }
  const origNavEtq = window.navigateTo;
  if(origNavEtq && !origNavEtq.__etqPatched){
    window.navigateTo = function(...args){ const r=origNavEtq.apply(this,args); setTimeout(atualizarVisibilidadeEtiqueta, 50); return r; };
    window.navigateTo.__etqPatched=true;
  }
  setTimeout(injetarBuscaInicio, 1200);
  console.log('[DIGICOPY] etiqueta_busca_patch v5.15.1 — busca só pelo número da etiqueta');
})();
