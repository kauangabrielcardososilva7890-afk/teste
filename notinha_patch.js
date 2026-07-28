// NOTINHA PATCH v4.1 - Layout redesenhado inspirado mas não cópia, mantendo hub antigo (sidebar)
(function(){
window.imprimirNotinha = function(vendaId){
  const sess=getSession(); const v=db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId); if(!v) return; const cli=db.clientes.find(c=>c.id===v.clienteId); const empRaw=localStorage.getItem('digicopy_empresa_notinha'); let empSel=null; try{empSel=JSON.parse(empRaw);}catch{} const empresa=empSel||db.empresas.find(e=>e.id===sess.empresaId)||{nome:'DIGICOPY'}; const win=window.open('','_blank');
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Notinha ${v.numero}</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'); body{font-family:'Inter',Arial,sans-serif; font-size:12px; color:#1a1a1a; margin:0; padding:0; background:#f5f5f7;} .page{max-width:800px; margin:20px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);} .top-bar{height:6px; background:#0a1e8a;} .header{padding:22px 28px; display:flex; justify-content:space-between; gap:20px; border-bottom:1px solid #eef0f5;} .brand{display:flex; gap:14px; align-items:center;} .brand-logo{width:54px; height:54px; background:#0a1e8a; border-radius:12px; display:grid; place-items:center; color:white; font-weight:800; font-size:20px;} .brand-text h1{margin:0; font-size:18px; font-weight:800;} .brand-text p{margin:2px 0 0; font-size:11px; color:#64748b;} .meta{text-align:right; font-size:11px; color:#475569;} .client-section{padding:18px 28px; background:#f8f9ff; border-bottom:1px solid #eef0f5; display:grid; grid-template-columns:1fr 1fr; gap:16px;} .client-card{background:white; border:1px solid #e2e8f0; border-radius:12px; padding:14px;} .client-card h4{margin:0 0 8px; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8;} .sale-bar{margin:20px 28px 0; background:#0a1e8a; color:white; border-radius:12px; padding:12px 18px; display:flex; justify-content:space-between; align-items:center;} .items{padding:0 28px; margin-top:16px;} table{width:100%; border-collapse:separate; border-spacing:0; font-size:12px;} th{text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; color:#64748b; padding:10px 8px; border-bottom:2px solid #e2e8f0;} td{padding:10px 8px; border-bottom:1px solid #f1f5f9;} .totals{display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; padding:20px 28px; background:#f8f9ff; border-top:1px solid #eef0f5; border-bottom:1px solid #eef0f5; margin-top:16px;} .tot-box{background:white; border:1px solid #e2e8f0; border-radius:12px; padding:14px; text-align:center;} .tot-box b{font-size:20px; display:block; margin-top:4px; color:#0a1e8a;} .tot-box.highlight{background:#0a1e8a; color:white;} .tot-box.highlight b{color:white} .footer{padding:20px 28px; display:flex; justify-content:space-between; gap:20px; font-size:11px; color:#64748b;} .sig{border-top:1px solid #1a1a1a; width:220px; text-align:center; padding-top:6px; margin-top:40px;} .audit{margin:0 28px 20px; padding:12px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; font-size:11px; color:#92400e;} @media print{body{background:white} .page{box-shadow:none; margin:0} button{display:none}}</style></head><body><div class="page"><div class="top-bar"></div><div class="header"><div class="brand"><div class="brand-logo"><img src="./logo.png" style="width:36px; height:36px; object-fit:contain"></div><div class="brand-text"><h1>${empresa.fantasia||empresa.nome||'DIGICOPY'}</h1><p>${empresa.nome||''}<br>${empresa.cnpj||sess.cnpj} • ${empresa.telefone||''}<br>${empresa.logradouro||''} ${empresa.numero||''} - ${empresa.bairro||''} - ${empresa.municipio||''}/${empresa.uf||''}</p></div></div><div class="meta"><p><b>NOTINHA</b><br>${v.numero}<br>${fmtDate(v.data)} ${new Date(v.data).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p><p style="margin-top:8px;">Atendente: <b>${v.criadoPorNome||sess.usuarioNome}</b><br>Forma: <b>${v.formaPagamento||''}</b>${v.vencimento?`<br>Venc: ${fmtDate(v.vencimento)}`:''}</p></div></div><div class="client-section"><div class="client-card"><h4>Cliente</h4><span style="font-family:monospace; font-size:11px; background:#0a1e8a; color:white; padding:2px 6px; border-radius:6px; display:inline-block; margin-bottom:6px;">#${cli?.codigo||'---'}</span><p><b>${cli?.nome||''}</b>${cli?.fantasia?` • ${cli.fantasia}`:''}</p><p>${cli?.documento||''} • ${cli?.telefone||''}</p><p style="font-size:11px; color:#64748b; margin-top:4px;">${cli?.endereco||''} • ${cli?.cidade||''}/${cli?.estado||''} • ${cli?.cep||''}</p></div><div class="client-card"><h4>Entrega / Observações</h4><p>Entregar até: ___/___/___</p><p style="margin-top:6px; color:#64748b;">Contato: ${cli?.contato||cli?.nome||''} • ${cli?.telefone||''}</p><p style="margin-top:8px;"><span style="background:#0a1e8a; color:white; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">CÓD CLIENTE: ${cli?.codigo||'-'}</span></p></div></div><div class="sale-bar"><h2>${v.status==='orcamento'?'ORÇAMENTO':'VENDA'} ${v.numero.replace('VD-','')}</h2><span>${v.status.toUpperCase()} • ${v.itens.length} ITENS</span></div><div class="items"><table><tr><th>#</th><th>Descrição</th><th>SKU</th><th>Qtd</th><th>Unit</th><th>Total</th></tr>${v.itens.map((it,idx)=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return `<tr><td>${idx+1}</td><td><b>${p?.nome||'Produto'}</b><br><span style="font-size:10px; color:#64748b;">${p?.sku||''} • ${p?.categoria||''}</span></td><td style="font-family:monospace; font-size:11px;">${p?.sku||''}</td><td>${it.qtd}</td><td>${fmtMoney(it.preco)}</td><td><b>${fmtMoney(it.subtotal)}</b></td></tr>`;}).join('')}</table></div><div class="totals"><div class="tot-box"><small>Código Venda</small><b>${v.numero.replace('VD-','')}</b><span style="font-size:10px; color:#64748b;">${v.status}</span></div><div class="tot-box"><small>Desconto / Atendente</small><b style="font-size:14px;">Desc: ${fmtMoney(v.desconto||0)}<br></b><span style="font-size:10px; color:#64748b;">Atendente: ${v.criadoPorNome}</span></div><div class="tot-box highlight"><small>Total</small><b>${fmtMoney(v.total)}</b><span style="font-size:11px;">${v.formaPagamento||''}</span></div></div><div class="footer"><div><div class="sig">Assinatura Cliente<br><span style="font-size:10px; color:#94a3b8;">Recebi em ___/___/____ às ___:___</span></div></div><div style="text-align:right;"><p><b>Auditoria:</b> Criado por ${v.criadoPorNome||sess.usuarioNome}<br>CNPJ: ${sess.cnpj} • Código cliente: ${cli?.codigo||'-'}</p></div></div><div class="audit"><b>Layout novo:</b> Notinha redesenhada com header em cards, barra azul escura arredondada, totais em 3 boxes. Inspirada mas não cópia da Venda 15625 original.</div></div><div style="text-align:center; margin:20px;"><button onclick="window.print()" style="padding:12px 24px; background:#0a1e8a; color:white; border:0; border-radius:12px; font-weight:700;">Imprimir Notinha</button> <button onclick="window.close()" style="padding:12px 24px; background:white; border:1px solid #cbd5e1; border-radius:12px;">Fechar</button></div></body></html>`;
  win.document.write(html); win.document.close();
  logAction('venda','imprimir_notinha_v4',vendaId,`Impressão notinha redesenhada ${v.numero} por ${sess.usuarioNome}`);
  saveDB();
};
window.gerarOrcamentoPDF = function(vendaId){
  const sess=getSession(); const v=db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId); if(!v) return; const cli=db.clientes.find(c=>c.id===v.clienteId); const empRaw=localStorage.getItem('digicopy_empresa_notinha'); let empSel=null; try{empSel=JSON.parse(empRaw);}catch{} const empresa=empSel||db.empresas.find(e=>e.id===sess.empresaId)||{nome:'DIGICOPY'}; const win=window.open('','_blank');
  const html=`<html><head><meta charset="UTF-8"><title>Orçamento ${v.numero}</title><style>body{font-family:Inter,Arial; margin:0; padding:0; background:#f6f7fb;} .page{max-width:800px; margin:20px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);} .header{background:#0a1e8a; color:white; padding:24px 28px; display:flex; justify-content:space-between;} .content{padding:24px 28px;} table{width:100%; border-collapse:collapse; font-size:12px;} th{background:#f1f5f9; text-align:left; padding:10px; font-size:10px; text-transform:uppercase; color:#64748b;} td{padding:10px; border-bottom:1px solid #f1f5f9;} .total{text-align:right; font-size:20px; font-weight:800; color:#0a1e8a; margin-top:20px;}</style></head><body><div class="page"><div class="header"><div><h1>ORÇAMENTO ${v.numero}</h1><p>${empresa.fantasia||empresa.nome} • ${empresa.cnpj||sess.cnpj}</p><p>Cliente: ${cli?.nome} • Cód: ${cli?.codigo}</p></div><div style="text-align:right;"><p style="background:rgba(255,255,255,0.15); padding:6px 12px; border-radius:20px; font-weight:700;">${v.status.toUpperCase()}</p></div></div><div class="content"><table><tr><th>#</th><th>Descrição</th><th>Qtd</th><th>Unit</th><th>Total</th></tr>${v.itens.map((it,idx)=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return `<tr><td>${idx+1}</td><td>${p?.nome||'Produto'}</td><td>${it.qtd}</td><td>${fmtMoney(it.preco)}</td><td><b>${fmtMoney(it.subtotal)}</b></td></tr>`}).join('')}</table><div class="total">Total: ${fmtMoney(v.total)}</div></div></div><div style="text-align:center; margin:20px;"><button onclick="window.print()" style="padding:12px 24px; background:#0a1e8a; color:white; border:0; border-radius:12px; font-weight:700;">Imprimir PDF Orçamento</button></div></body></html>`;
  win.document.write(html); win.document.close();
  logAction('venda','gerar_pdf_orcamento_v4',vendaId,`PDF orçamento ${v.numero}`);
  saveDB();
};
// Orçamentos view separada já existe no app.js? Vamos garantir renderOrcamentosView
window.renderOrcamentosView = window.renderOrcamentosView || function(){
  const sess=getSession(); if(!sess) return; const view=document.getElementById('view-orcamentos'); if(!view){ // se não existe view-orcamentos (no hub antigo), usa view-vendas filtrada
    // fallback: navega para vendas e filtra
    return;
  }
  const orcs=db.vendas.filter(v=>v.empresaId===sess.empresaId && (v.status==='orcamento' || v.status==='aprovado' || v.status==='aguardar')).sort((a,b)=>new Date(b.data)-new Date(a.data));
  // Se view-orcamentos não existe no hub antigo, não faz nada, pois orcamentos já está em vendas
  if(view){
    view.innerHTML=`<div class="flex flex-wrap justify-between gap-3"><div><h3 class="font-bold text-[16px]">Orçamentos</h3><p class="text-[13px] text-slate-500 mt-1">Separado de Vendas conforme pedido.</p></div><button onclick="novaVenda(); setTimeout(()=>{document.getElementById('nv-status').value='orcamento'; onStatusVendaChange();},300)" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13px] shadow">+ Novo orçamento</button></div>
    <div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Orçamento / Cliente</th><th class="px-5 py-3">Total</th><th class="px-5 py-3">Situação</th><th class="px-5 py-3">Ações</th></tr></thead><tbody class="divide-y">${orcs.map(v=>{const cli=db.clientes.find(c=>c.id===v.clienteId); return `<tr class="hover:bg-slate-50"><td class="px-5 py-3"><p class="font-mono text-[11px] font-bold text-[#0a1e8a]">${v.numero}</p><p class="font-semibold text-[13px]">${cli?.nome||''}</p></td><td class="px-5 py-3"><p class="font-bold">${fmtMoney(v.total)}</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border">${v.status}</span></td><td class="px-5 py-3"><div class="flex gap-1"><button onclick="gerarOrcamentoPDF('${v.id}')" class="h-8 px-3 rounded-xl bg-[#0a1e8a] text-white text-[11px] font-bold">PDF</button></div></td></tr>`}).join('')||'<tr><td colspan="4" class="p-12 text-center text-slate-500">Nenhum orçamento</td></tr>'}</tbody></table></div>`;
  }
};
console.log('PATCH notinha v4.1 - layout novo inspirado não copia + orcamentos separado, mantendo hub antigo sidebar');
})();

// PATCH v3.6 - Vendas estilo desktop minimalista (inspirado, não cópia)
(function(){
  function vendaTipo(v){
    return (v.itens||[]).some(it=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return p && p.categoria==='Serviço';}) ? 'S' : 'V';
  }
  function vendaSituacao(v){
    const st=(v.status||'aberta').toLowerCase();
    if(st==='faturado' || st==='finalizada') return 'FINALIZADA';
    if(st==='orcamento') return 'ORÇAMENTO';
    if(st==='aprovado') return 'APROVADA';
    if(st==='aguardar') return 'ABERTA';
    return st.toUpperCase();
  }
  function ensureVendaView(){
    let view=document.getElementById('view-vendas');
    if(!view) view=ensureView('vendas');
    return view;
  }
  window.renderVendas = function(){
    const sess=getSession(); if(!sess) return;
    const view=ensureVendaView();
    const search=escapeHtml(document.getElementById('classic-search-vendas')?.value||'');
    const rawSearch=(document.getElementById('classic-search-vendas')?.value||'').toLowerCase();
    const filtro=document.getElementById('classic-filter-vendas')?.value||'hoje';
    const shouldRefocusVendaSearch=document.activeElement?.id==='classic-search-vendas';
    const vendaSearchCaret=document.getElementById('classic-search-vendas')?.selectionStart||0;
    const hoje=new Date().toISOString().slice(0,10);
    let list=db.vendas.filter(v=>v.empresaId===sess.empresaId);
    if(filtro==='hoje') list=list.filter(v=>(v.data||'').slice(0,10)===hoje);
    if(filtro==='abertas') list=list.filter(v=>!['faturado','finalizada'].includes((v.status||'').toLowerCase()));
    if(rawSearch){
      list=list.filter(v=>{
        const cli=db.clientes.find(c=>c.id===v.clienteId)||{};
        return (v.numero||'').toLowerCase().includes(rawSearch) || (cli.nome||'').toLowerCase().includes(rawSearch) || String(cli.codigo||'').includes(rawSearch) || (v.criadoPorNome||'').toLowerCase().includes(rawSearch);
      });
    }
    list=list.sort((a,b)=>new Date(b.data)-new Date(a.data));
    if(!window.vendaSelecionadaId && list[0]) window.vendaSelecionadaId=list[0].id;
    view.innerHTML=`
      <div class="classic-window overflow-hidden">
        <div class="classic-title">Vendas / Ordem de Serviços</div>
        <div class="bg-white border-b border-slate-300 flex items-center flex-wrap">
          <button onclick="novaVenda()" class="classic-toolbar-btn"><i class="ph ph-file-plus"></i>Novo</button>
          <button onclick="alterarVendaSelecionada()" class="classic-toolbar-btn"><i class="ph ph-pencil-simple"></i>Alterar</button>
          <button onclick="excluirVendaSelecionada()" class="classic-toolbar-btn"><i class="ph ph-x-circle text-red-600"></i>Excluir</button>
          <button onclick="if(window.vendaSelecionadaId) imprimirNotinha(window.vendaSelecionadaId)" class="classic-toolbar-btn"><i class="ph ph-printer"></i>Imprimir</button>
          <button onclick="renderVendas()" class="classic-toolbar-btn"><i class="ph ph-arrows-clockwise"></i>Atualizar</button>
          <div class="ml-2 flex items-center gap-2 py-2">
            <select id="classic-filter-vendas" onchange="renderVendas()" class="classic-select w-[210px]"><option value="hoje" ${filtro==='hoje'?'selected':''}>Hoje</option><option value="todas" ${filtro==='todas'?'selected':''}>Todas</option><option value="abertas" ${filtro==='abertas'?'selected':''}>Abertas</option></select>
            <input id="classic-search-vendas" value="${search}" oninput="renderVendas()" placeholder="Pesquisar código, cliente, usuário..." class="classic-input h-[28px] w-[260px]">
            <i class="ph ph-magnifying-glass text-[#0a1e8a]"></i>
            <label class="text-[11px] flex items-center gap-1"><input type="checkbox"> Buscar/Entregar</label>
          </div>
        </div>
        <div class="overflow-auto min-h-[360px] bg-white">
          <table class="classic-grid-table">
            <thead><tr><th>Código</th><th>Data</th><th>Cliente</th><th>Valor</th><th>Situação</th><th>Tipo</th><th>Usuário</th><th>Nfe</th><th>NFS</th><th>Imp</th><th>Dt. Entrega/Retirar</th><th>Destino</th><th>Recebimento</th></tr></thead>
            <tbody>
              ${list.map(v=>{const cli=db.clientes.find(c=>c.id===v.clienteId)||{}; const selected=window.vendaSelecionadaId===v.id; return `<tr onclick="selecionarVendaClassic('${v.id}')" ondblclick="if(typeof showVenda==='function') showVenda('${v.id}')" class="cursor-pointer ${selected?'classic-row-selected':''}"><td>${escapeHtml((v.numero||'').replace('VD-',''))}</td><td>${fmtDate(v.data)}</td><td>${escapeHtml(cli.nome||'')}</td><td class="text-right">${fmtMoney(v.total||0)}</td><td>${vendaSituacao(v)}</td><td>${vendaTipo(v)}</td><td>${escapeHtml((v.criadoPorNome||'').split(' ')[0]||'-')}</td><td></td><td></td><td><span class="inline-block w-3 h-3 rounded-full ${v.status==='faturado'?'bg-emerald-500':'bg-red-500'}"></span></td><td>${v.vencimento?fmtDate(v.vencimento):''}</td><td>AGUARDAR</td><td>${v.formaPagamento&&v.formaPagamento!=='Não faturado'?escapeHtml(v.formaPagamento):'Prazo'}</td></tr>`}).join('') || '<tr><td colspan="13" class="text-center text-slate-500 py-10">Nenhuma venda encontrada</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="h-7 bg-slate-100 border-t flex items-center px-2 text-[11px] text-slate-600">ESC - Fechar &nbsp; | &nbsp; Registros: ${list.length}</div>
      </div>`;
    if(shouldRefocusVendaSearch){ const input=document.getElementById('classic-search-vendas'); if(input){ input.focus(); input.setSelectionRange(vendaSearchCaret,vendaSearchCaret); } }
  };
  window.selecionarVendaClassic=function(id){window.vendaSelecionadaId=id; renderVendas();};
  window.alterarVendaSelecionada=function(){ if(!window.vendaSelecionadaId) return toast('Selecione uma venda','info'); if(typeof showVenda==='function'){ navigateTo('vendas'); setTimeout(()=>showVenda(window.vendaSelecionadaId),80); } };
  window.excluirVendaSelecionada=function(){ if(!window.vendaSelecionadaId) return toast('Selecione uma venda','info'); deleteVenda(window.vendaSelecionadaId); window.vendaSelecionadaId=null; };

  window.novaVenda = function(){
    const sess=getSession(); if(!sess) return;
    const modalBox=document.getElementById('modal-box');
    if(modalBox){modalBox.className='w-full max-w-[1180px] rounded-[4px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';}
    document.getElementById('modal-title').innerText='Cadastrar Vendas';
    const seq=String(db.vendas.filter(v=>v.empresaId===sess.empresaId).length+1).padStart(6,'0');
    window.cvItens=[]; window.cvCliente=null; window.cvProduto=null;
    document.getElementById('modal-body').innerHTML=`
      <div class="classic-window">
        <div class="classic-title">Vendas</div>
        <div class="border-b border-slate-300 bg-[#f7f7f7] p-2 grid grid-cols-12 gap-2 items-center text-[11px]">
          <label class="col-span-1">Código:<input id="cv-codigo" value="${seq}" class="classic-input w-full mt-1" readonly></label>
          <label class="col-span-2">Data:<input value="${new Date().toLocaleDateString('pt-BR')}" class="classic-input w-full mt-1" readonly></label>
          <label class="col-span-1"><span class="block opacity-0">hora</span><input value="${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}" class="classic-input w-full mt-1" readonly></label>
          <label class="col-span-2">Data Saída:<input id="cv-data-saida" class="classic-input w-full mt-1"></label>
          <label class="col-span-3 col-start-10">Usuário:<input value="${escapeHtml(sess.usuarioNome)}" class="classic-input w-full mt-1" readonly></label>
        </div>
        <div class="p-2 grid grid-cols-12 gap-2">
          <fieldset class="classic-fieldset col-span-2"><legend>Destino</legend><label class="classic-label">Selecione:</label><select id="cv-destino" class="classic-select w-full"><option>AGUARDAR</option><option>ENTREGAR</option><option>RETIRAR</option></select></fieldset>
          <fieldset class="classic-fieldset col-span-2"><legend>Entregar Até</legend><button type="button" onclick="document.getElementById('cv-data-saida').focus()" class="text-blue-700 underline text-[11px] mt-6">Informar Prazo</button></fieldset>
          <fieldset class="classic-fieldset col-span-5"><legend>Dados do Cliente</legend><div class="grid grid-cols-12 gap-2 items-end"><label class="col-span-2 classic-label">Código:<input id="cv-cli-codigo" class="classic-input w-full" readonly></label><label class="col-span-10 classic-label">Nome do Cliente:<div class="flex gap-1"><input id="cv-cliente-search" oninput="cvSearchCliente(this.value)" class="classic-input flex-1" autocomplete="off"><button type="button" onclick="cvSearchCliente(document.getElementById('cv-cliente-search').value||'a')" class="classic-icon-btn !w-7 !h-6"><i class="ph ph-magnifying-glass !text-[16px]"></i></button></div></label></div><div id="cv-cliente-results" class="hidden mt-1 max-h-28 overflow-auto border bg-white"></div></fieldset>
          <fieldset class="classic-fieldset col-span-3"><legend>Totais</legend><div class="grid grid-cols-2 text-[11px]"><span>Prod/Serv:</span><span class="text-right" id="cv-subtotal">R$ 0,00</span><span>Acrés/Frete/Seg:</span><span class="text-right">R$ 0,00</span><span>Descontos:</span><span class="text-right" id="cv-desconto-label">R$ 0,00</span></div><div id="cv-total" class="classic-total">R$ 0,00</div></fieldset>
        </div>
        <div class="px-2"><div class="border border-slate-300 bg-[#f7f7f7]"><div class="flex text-[11px] border-b bg-white"><button class="px-3 py-1 border-r bg-[#f7f7f7]">Itens</button><button class="px-3 py-1 border-r">Ordem de Serviço</button><button class="px-3 py-1">Outros</button></div><div class="p-2 grid grid-cols-12 gap-2 items-end"><label class="col-span-2 classic-label">Tipo:<select id="cv-tipo" class="classic-select w-full"><option>Produto/Serviço</option><option>Recarga</option></select></label><label class="col-span-5 classic-label">Digite a Descrição ou Código de Barras do Produto:<div class="flex gap-1"><input id="cv-prod-search" oninput="cvSearchProduto(this.value)" class="classic-input flex-1"><button type="button" onclick="cvSearchProduto(document.getElementById('cv-prod-search').value||'a')" class="classic-icon-btn !w-7 !h-6"><i class="ph ph-magnifying-glass !text-[16px]"></i></button></div></label><label class="col-span-1 classic-label">Quat:<input id="cv-qtd" type="number" value="1" class="classic-input w-full"></label><label class="col-span-1 classic-label">Valor Unitário:<input id="cv-vunit" type="number" step="0.01" class="classic-input w-full"></label><label class="col-span-1 classic-label">Desconto R$:<input id="cv-desc" type="number" step="0.01" value="0" oninput="cvUpdateTotal()" class="classic-input w-full"></label><label class="col-span-1 classic-label">Valor Total:<input id="cv-item-total" class="classic-input w-full" readonly></label><button type="button" onclick="cvAddItem()" class="classic-icon-btn !h-7"><i class="ph ph-plus-circle text-emerald-600"></i></button></div><div id="cv-prod-results" class="hidden mx-2 mb-2 max-h-28 overflow-auto border bg-white text-[11px]"></div><div class="h-[190px] overflow-auto bg-white"><table class="classic-grid-table"><thead><tr><th>Descrição</th><th>Identificação</th><th>Qtd.</th><th>Valor Unit.</th><th>Desconto</th><th>Valor Total</th><th>Situação</th><th>PE</th><th>PS</th><th>Técnico/Resp.</th><th>Obs</th></tr></thead><tbody id="cv-itens-body"><tr><td colspan="11" class="text-slate-400">Nenhum item lançado</td></tr></tbody></table></div></div></div>
        <div class="p-2 flex items-center gap-2 bg-[#f7f7f7] border-t mt-2"><button class="classic-bottom-btn" onclick="if(window.cvVendaSalva) imprimirNotinha(window.cvVendaSalva)"><i class="ph ph-printer"></i></button><button class="classic-bottom-btn"><i class="ph ph-briefcase"></i></button><button class="classic-bottom-btn"><i class="ph ph-chat-circle"></i></button><button class="classic-bottom-btn"><i class="ph ph-table"></i></button><textarea class="flex-1 h-[54px] border border-slate-300"></textarea><fieldset class="classic-fieldset w-[220px]"><legend>Situação da Venda/Serviço</legend><select id="cv-status" class="classic-select w-full"><option value="aguardar">AGUARDAR</option><option value="faturado">FINALIZADA</option><option value="orcamento">ORÇAMENTO</option></select></fieldset><button onclick="cvSaveVenda('faturado')" class="h-[54px] px-6 rounded bg-emerald-600 text-white font-bold flex items-center gap-2"><i class="ph ph-check"></i>Faturar</button><button onclick="closeModal()" class="h-[54px] px-5 rounded bg-white border text-red-600 font-bold flex items-center gap-2"><i class="ph ph-x-circle"></i>Sair</button></div>
      </div>`;
    document.getElementById('modal-footer').innerHTML='';
    document.getElementById('modal-root').classList.remove('hidden');
    setTimeout(()=>document.getElementById('cv-cliente-search')?.focus(),100);
  };
  window.cvSearchCliente=function(q){
    const sess=getSession(); const el=document.getElementById('cv-cliente-results'); if(!el) return;
    const low=(q||'').toLowerCase();
    const list=db.clientes.filter(c=>c.empresaId===sess.empresaId && (!low || (c.nome||'').toLowerCase().includes(low) || (c.documento||'').toLowerCase().includes(low) || String(c.codigo||'').includes(low))).slice(0,12);
    el.classList.remove('hidden'); el.innerHTML=list.map(c=>`<button type="button" onclick="cvSelectCliente('${c.id}')" class="w-full text-left px-2 py-1 hover:bg-blue-50"><b>#${c.codigo||'-'}</b> ${escapeHtml(c.nome)} <span class="text-slate-500">${escapeHtml(c.documento||'')}</span></button>`).join('')||'<div class="p-2 text-slate-500">Nenhum cliente</div>';
  };
  window.cvSelectCliente=function(id){const c=db.clientes.find(x=>x.id===id); window.cvCliente=c; document.getElementById('cv-cli-codigo').value=c?.codigo||''; document.getElementById('cv-cliente-search').value=c?.nome||''; document.getElementById('cv-cliente-results').classList.add('hidden');};
  window.cvSearchProduto=function(q){
    const sess=getSession(); const el=document.getElementById('cv-prod-results'); if(!el) return;
    const low=(q||'').toLowerCase();
    const list=db.produtos.filter(p=>p.empresaId===sess.empresaId && (!low || (p.nome||'').toLowerCase().includes(low) || (p.sku||'').toLowerCase().includes(low))).slice(0,14);
    el.classList.remove('hidden'); el.innerHTML=list.map(p=>`<button type="button" onclick="cvSelectProduto('${p.id}')" class="w-full text-left px-2 py-1 hover:bg-blue-50"><b>${escapeHtml(p.sku||'')}</b> ${escapeHtml(p.nome)} <span class="float-right">${fmtMoney(p.preco||0)}</span></button>`).join('')||'<div class="p-2 text-slate-500">Nenhum produto</div>';
  };
  window.cvSelectProduto=function(id){const p=db.produtos.find(x=>x.id===id); window.cvProduto=p; document.getElementById('cv-prod-search').value=p?.nome||''; document.getElementById('cv-vunit').value=p?.preco||0; document.getElementById('cv-prod-results').classList.add('hidden'); cvUpdateItemTotal();};
  window.cvUpdateItemTotal=function(){const qtd=parseFloat(document.getElementById('cv-qtd')?.value)||0; const val=parseFloat(document.getElementById('cv-vunit')?.value)||0; const el=document.getElementById('cv-item-total'); if(el) el.value=(qtd*val).toFixed(2);};
  window.cvAddItem=function(){if(!window.cvProduto) return toast('Selecione um produto','error'); const qtd=parseFloat(document.getElementById('cv-qtd').value)||1; const preco=parseFloat(document.getElementById('cv-vunit').value)||window.cvProduto.preco||0; window.cvItens.push({produtoId:window.cvProduto.id,qtd,preco,subtotal:qtd*preco}); window.cvProduto=null; document.getElementById('cv-prod-search').value=''; document.getElementById('cv-vunit').value=''; cvRenderItens(); cvUpdateTotal();};
  window.cvRenderItens=function(){const body=document.getElementById('cv-itens-body'); if(!body) return; body.innerHTML=window.cvItens.map((it,idx)=>{const p=db.produtos.find(x=>x.id===it.produtoId)||{}; return `<tr><td>${escapeHtml(p.nome||'Produto')}</td><td>${escapeHtml(p.sku||'')}</td><td>${it.qtd}</td><td>${fmtMoney(it.preco)}</td><td>R$ 0,00</td><td>${fmtMoney(it.subtotal)}</td><td>OK</td><td></td><td></td><td></td><td><button onclick="cvRemoveItem(${idx})" class="text-red-600">remover</button></td></tr>`}).join('')||'<tr><td colspan="11" class="text-slate-400">Nenhum item lançado</td></tr>';};
  window.cvRemoveItem=function(idx){window.cvItens.splice(idx,1); cvRenderItens(); cvUpdateTotal();};
  window.cvUpdateTotal=function(){const sub=(window.cvItens||[]).reduce((s,i)=>s+i.subtotal,0); const desc=parseFloat(document.getElementById('cv-desc')?.value)||0; const total=Math.max(0,sub-desc); const a=document.getElementById('cv-subtotal'); const b=document.getElementById('cv-desconto-label'); const c=document.getElementById('cv-total'); if(a)a.innerText=fmtMoney(sub); if(b)b.innerText=fmtMoney(desc); if(c)c.innerText=fmtMoney(total);};
  window.cvSaveVenda=function(forceStatus){
    const sess=getSession(); if(!window.cvCliente) return toast('Selecione o cliente','error'); if(!window.cvItens?.length) return toast('Adicione ao menos um item','error');
    const desc=parseFloat(document.getElementById('cv-desc')?.value)||0; const total=Math.max(0,window.cvItens.reduce((s,i)=>s+i.subtotal,0)-desc); const status=forceStatus||document.getElementById('cv-status')?.value||'aguardar';
    const venda={id:uid('vda'),empresaId:sess.empresaId,numero:'VD-'+new Date().getFullYear()+'-'+String(db.vendas.filter(v=>v.empresaId===sess.empresaId).length+1).padStart(4,'0'),clienteId:window.cvCliente.id,data:new Date().toISOString(),itens:[...window.cvItens],desconto:desc,total,formaPagamento:status==='faturado'?'Prazo':'Não faturado',status,criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome,criadoEm:new Date().toISOString()};
    venda.itens.forEach(it=>{const p=db.produtos.find(x=>x.id===it.produtoId && x.empresaId===sess.empresaId); if(p && p.categoria!=='Serviço' && p.categoria!=='Recarga') p.estoque-=it.qtd;});
    db.vendas.push(venda); window.cvVendaSalva=venda.id; logAction('venda','criar',venda.id,`Venda ${venda.numero} total ${fmtMoney(venda.total)} por ${sess.usuarioNome}`);
    if(status==='faturado') db.contasReceber.push({id:uid('cr'),empresaId:sess.empresaId,origem:'venda',clienteId:venda.clienteId,descricao:`Venda ${venda.numero}`,valor:total,vencimento:new Date(Date.now()+1000*60*60*24*14).toISOString(),pagamentoData:null,status:'aberto',contratoId:null,leituraId:null,vendaId:venda.id,criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome,formaPagamento:'Prazo'});
    saveDB(); renderVendas(); renderProdutos(); renderFinanceiro(); renderAuditoria(); toast(`Venda ${venda.numero} salva`,'success'); closeModal(); setTimeout(()=>imprimirNotinha(venda.id),300);
  };
})();

// Reset tamanho padrão dos modais que não são a janela clássica de venda
(function(){
  const originalCloseModalClassic = window.closeModal;
  window.closeModal = function(){
    if(originalCloseModalClassic) originalCloseModalClassic();
    const box=document.getElementById('modal-box');
    if(box) box.className='w-full max-w-[720px] rounded-[22px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[90vh] flex flex-col';
  };
})();

// PATCH v3.7 - Clientes em janela clássica com pesquisa por letras
(function(){
  window.renderClientes = function(){
    const sess=getSession(); if(!sess) return;
    const view=document.getElementById('view-clientes')||ensureView('clientes');
    const searchRaw=document.getElementById('classic-search-clientes')?.value||'';
    const letter=document.getElementById('classic-letter-clientes')?.value||'';
    const low=searchRaw.toLowerCase();
    let list=db.clientes.filter(c=>c.empresaId===sess.empresaId && c.status!=='inativo');
    if(letter) list=list.filter(c=>(c.nome||'').toUpperCase().startsWith(letter));
    if(low) list=list.filter(c=>(c.nome||'').toLowerCase().includes(low)||(c.documento||'').toLowerCase().includes(low)||(c.telefone||'').toLowerCase().includes(low)||String(c.codigo||'').includes(low));
    list=list.sort((a,b)=>(a.nome||'').localeCompare(b.nome||''));
    view.innerHTML=`
      <div class="classic-window overflow-hidden max-w-[900px] mx-auto mt-2">
        <div class="h-6 bg-slate-100 border-b flex items-center justify-between px-2 text-[12px]"><span>Clientes Cadastrados</span><button onclick="navigateTo('dashboard')" class="text-slate-600">×</button></div>
        <div class="classic-title">Clientes</div>
        <div class="bg-white border-b border-slate-300 flex items-center flex-wrap">
          <button onclick="openModal('cliente')" class="classic-toolbar-btn"><i class="ph ph-file-plus"></i>Novo</button>
          <button onclick="alterarClienteClassic()" class="classic-toolbar-btn"><i class="ph ph-pencil-simple"></i>Alterar</button>
          <button onclick="excluirClienteClassic()" class="classic-toolbar-btn"><i class="ph ph-x-circle text-red-600"></i>Excluir</button>
          <select class="classic-select ml-2 w-[150px]"><option>Pesquisar</option><option>Nome</option><option>Código</option><option>CPF/CNPJ</option></select>
          <input id="classic-search-clientes" value="${escapeHtml(searchRaw)}" oninput="renderClientes()" class="classic-input h-[28px] w-[330px] ml-2">
          <button class="classic-toolbar-btn !border-r-0" onclick="renderClientes()"><i class="ph ph-magnifying-glass"></i></button>
        </div>
        <div class="bg-[#f7f7f7] border-b px-2 py-1 text-[11px]"><button class="px-2 py-1 bg-white border">Consultas</button><button class="px-2 py-1 border">Gráficos</button></div>
        <div class="flex items-center gap-3 px-2 py-1 bg-white border-b text-[12px]">
          ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l=>`<button onclick="document.getElementById('classic-letter-clientes').value='${l}'; renderClientes()" class="hover:text-[#0a1e8a] ${letter===l?'font-bold text-[#0a1e8a]':''}">${l}</button>`).join('')}
          <input id="classic-letter-clientes" type="hidden" value="${letter}"><button onclick="document.getElementById('classic-letter-clientes').value=''; renderClientes()" class="ml-2 text-red-600">●</button><button class="ml-auto"><i class="ph ph-funnel"></i></button>
        </div>
        <div class="h-[310px] overflow-auto bg-white">
          <table class="classic-grid-table"><thead><tr><th>Sel</th><th>Código</th><th>Nome do Cliente</th><th>Telefone</th><th>CPF/CNPJ</th><th>Nome Fantasia</th></tr></thead><tbody>${list.map(c=>`<tr onclick="window.clienteSelecionadoClassic='${c.id}'; renderClientes()" ondblclick="openModal('cliente','${c.id}')" class="cursor-pointer ${window.clienteSelecionadoClassic===c.id?'classic-row-selected':''}"><td></td><td>${c.codigo||''}</td><td>${escapeHtml(c.nome||'')}</td><td>${escapeHtml(c.telefone||'')}</td><td>${escapeHtml(c.documento||'')}</td><td>${escapeHtml(c.fantasia||'')}</td></tr>`).join('')||'<tr><td colspan="6" class="text-center text-slate-500 py-8">Nenhum cliente</td></tr>'}</tbody></table>
        </div>
        <div class="h-[64px] bg-[#f7f7f7] border-t flex items-center justify-center gap-4"><button class="classic-icon-btn !w-12 !h-12"><i class="ph ph-globe"></i></button><button class="classic-icon-btn !w-12 !h-12"><i class="ph ph-gear"></i></button><button class="classic-icon-btn !w-12 !h-12"><i class="ph ph-printer"></i></button><button class="classic-icon-btn !w-12 !h-12"><i class="ph ph-envelope"></i></button><button class="classic-icon-btn !w-12 !h-12"><i class="ph ph-floppy-disk"></i></button><button onclick="navigateTo('dashboard')" class="ml-auto mr-4 h-10 px-5 bg-white border text-red-600"><i class="ph ph-x-circle"></i> Sair</button></div>
      </div>`;
    const input=document.getElementById('classic-search-clientes'); if(input && document.activeElement?.id==='classic-search-clientes') input.focus();
  };
  window.alterarClienteClassic=function(){ if(!window.clienteSelecionadoClassic) return toast('Selecione um cliente','info'); openModal('cliente',window.clienteSelecionadoClassic); };
  window.excluirClienteClassic=function(){ if(!window.clienteSelecionadoClassic) return toast('Selecione um cliente','info'); deleteCliente(window.clienteSelecionadoClassic); window.clienteSelecionadoClassic=null; };
})();
