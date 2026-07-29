// NOTINHA PATCH v4.1 - Layout de impressão e navegação de vendas
(function(){
window.imprimirNotinha = function(vendaId){
  const sess=getSession(); const v=db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId); if(!v) return; const cli=db.clientes.find(c=>c.id===v.clienteId); const empRaw=localStorage.getItem('digicopy_empresa_notinha'); let empSel=null; try{empSel=JSON.parse(empRaw);}catch{} const empresa=empSel||db.empresas.find(e=>e.id===sess.empresaId)||{nome:'DIGICOPY'}; const win=window.open('','_blank');
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Notinha ${v.numero}</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'); body{font-family:'Inter',Arial,sans-serif; font-size:12px; color:#1a1a1a; margin:0; padding:0; background:#f5f5f7;} .page{max-width:800px; margin:20px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);} .top-bar{height:6px; background:#0a1e8a;} .header{padding:22px 28px; display:flex; justify-content:space-between; gap:20px; border-bottom:1px solid #eef0f5;} .brand{display:flex; gap:14px; align-items:center;} .brand-logo{width:54px; height:54px; background:#0a1e8a; border-radius:12px; display:grid; place-items:center; color:white; font-weight:800; font-size:20px;} .brand-text h1{margin:0; font-size:18px; font-weight:800;} .brand-text p{margin:2px 0 0; font-size:11px; color:#64748b;} .meta{text-align:right; font-size:11px; color:#475569;} .client-section{padding:18px 28px; background:#f8f9ff; border-bottom:1px solid #eef0f5; display:grid; grid-template-columns:1fr 1fr; gap:16px;} .client-card{background:white; border:1px solid #e2e8f0; border-radius:12px; padding:14px;} .client-card h4{margin:0 0 8px; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8;} .sale-bar{margin:20px 28px 0; background:#0a1e8a; color:white; border-radius:12px; padding:12px 18px; display:flex; justify-content:space-between; align-items:center;} .items{padding:0 28px; margin-top:16px;} table{width:100%; border-collapse:separate; border-spacing:0; font-size:12px;} th{text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; color:#64748b; padding:10px 8px; border-bottom:2px solid #e2e8f0;} td{padding:10px 8px; border-bottom:1px solid #f1f5f9;} .totals{display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; padding:20px 28px; background:#f8f9ff; border-top:1px solid #eef0f5; border-bottom:1px solid #eef0f5; margin-top:16px;} .tot-box{background:white; border:1px solid #e2e8f0; border-radius:12px; padding:14px; text-align:center;} .tot-box b{font-size:20px; display:block; margin-top:4px; color:#0a1e8a;} .tot-box.highlight{background:#0a1e8a; color:white;} .tot-box.highlight b{color:white} .footer{padding:20px 28px; display:flex; justify-content:space-between; gap:20px; font-size:11px; color:#64748b;} .sig{border-top:1px solid #1a1a1a; width:220px; text-align:center; padding-top:6px; margin-top:40px;} .audit{margin:0 28px 20px; padding:12px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; font-size:11px; color:#92400e;} @media print{body{background:white} .page{box-shadow:none; margin:0} button{display:none}}</style></head><body><div class="page"><div class="top-bar"></div><div class="header"><div class="brand"><div class="brand-logo"><img src="./logo.png" style="width:36px; height:36px; object-fit:contain"></div><div class="brand-text"><h1>${empresa.fantasia||empresa.nome||'DIGICOPY'}</h1><p>${empresa.nome||''}<br>${empresa.cnpj||sess.cnpj} • ${empresa.telefone||''}<br>${empresa.logradouro||''} ${empresa.numero||''} - ${empresa.bairro||''} - ${empresa.municipio||''}/${empresa.uf||''}</p></div></div><div class="meta"><p><b>NOTINHA</b><br>${v.numero}<br>${fmtDate(v.data)} ${new Date(v.data).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p><p style="margin-top:8px;">Atendente: <b>${v.criadoPorNome||sess.usuarioNome}</b><br>Forma: <b>${v.formaPagamento||''}</b>${v.vencimento?`<br>Venc: ${fmtDate(v.vencimento)}`:''}</p></div></div><div class="client-section"><div class="client-card"><h4>Cliente</h4><span style="font-family:monospace; font-size:11px; background:#0a1e8a; color:white; padding:2px 6px; border-radius:6px; display:inline-block; margin-bottom:6px;">#${cli?.codigo||'---'}</span><p><b>${cli?.nome||''}</b>${cli?.fantasia?` • ${cli.fantasia}`:''}</p><p>${cli?.documento||''} • ${cli?.telefone||''}</p><p style="font-size:11px; color:#64748b; margin-top:4px;">${cli?.endereco||''} • ${cli?.cidade||''}/${cli?.estado||''} • ${cli?.cep||''}</p></div><div class="client-card"><h4>Entrega / Observações</h4><p>Entregar até: ___/___/___</p><p style="margin-top:6px; color:#64748b;">Contato: ${cli?.contato||cli?.nome||''} • ${cli?.telefone||''}</p><p style="margin-top:8px;"><span style="background:#0a1e8a; color:white; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">CÓD CLIENTE: ${cli?.codigo||'-'}</span></p></div></div><div class="sale-bar"><h2>${v.status==='orcamento'?'ORÇAMENTO':'VENDA'} ${v.numero.replace('VD-','')}</h2><span>${v.status.toUpperCase()} • ${v.itens.length} ITENS</span></div><div class="items"><table><tr><th>#</th><th>Descrição</th><th>SKU</th><th>Qtd</th><th>Unit</th><th>Total</th></tr>${v.itens.map((it,idx)=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return `<tr><td>${idx+1}</td><td><b>${p?.nome||it.descricao||'Produto'}</b><br><span style="font-size:10px; color:#64748b;">${p?.sku||''} • ${p?.categoria||''}</span></td><td style="font-family:monospace; font-size:11px;">${p?.sku||''}</td><td>${it.qtd}</td><td>${fmtMoney(it.preco)}</td><td><b>${fmtMoney(it.subtotal)}</b></td></tr>`;}).join('')}</table></div><div class="totals"><div class="tot-box"><small>Código Venda</small><b>${v.numero.replace('VD-','')}</b><span style="font-size:10px; color:#64748b;">${v.status}</span></div><div class="tot-box"><small>Desconto / Atendente</small><b style="font-size:14px;">Desc: ${fmtMoney(v.desconto||0)}<br></b><span style="font-size:10px; color:#64748b;">Atendente: ${v.criadoPorNome}</span></div><div class="tot-box highlight"><small>Total</small><b>${fmtMoney(v.total)}</b><span style="font-size:11px;">${v.formaPagamento||''}</span></div></div><div class="footer"><div><div class="sig">Assinatura Cliente<br><span style="font-size:10px; color:#94a3b8;">Recebi em ___/___/____ às ___:___</span></div></div><div style="text-align:right;"><p><b>Auditoria:</b> Criado por ${v.criadoPorNome||sess.usuarioNome}<br>CNPJ: ${sess.cnpj} • Código cliente: ${cli?.codigo||'-'}</p></div></div><div class="audit"><b>Documento de venda:</b> Impressão padronizada com identificação da empresa, cliente, itens, totais e assinatura.</div></div><div style="text-align:center; margin:20px;"><button onclick="window.print()" style="padding:12px 24px; background:#0a1e8a; color:white; border:0; border-radius:12px; font-weight:700;">Imprimir Notinha</button> <button onclick="window.close()" style="padding:12px 24px; background:white; border:1px solid #cbd5e1; border-radius:12px;">Fechar</button></div></body></html>`;
  win.document.write(html); win.document.close();
  logAction('venda','imprimir_notinha_v4',vendaId,`Impressão notinha redesenhada ${v.numero} por ${sess.usuarioNome}`);
  saveDB();
};
window.gerarOrcamentoPDF = function(vendaId){
  const sess=getSession(); const v=db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId); if(!v) return; const cli=db.clientes.find(c=>c.id===v.clienteId); const empRaw=localStorage.getItem('digicopy_empresa_notinha'); let empSel=null; try{empSel=JSON.parse(empRaw);}catch{} const empresa=empSel||db.empresas.find(e=>e.id===sess.empresaId)||{nome:'DIGICOPY'}; const win=window.open('','_blank');
  const html=`<html><head><meta charset="UTF-8"><title>Orçamento ${v.numero}</title><style>body{font-family:Inter,Arial; margin:0; padding:0; background:#f6f7fb;} .page{max-width:800px; margin:20px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);} .header{background:#0a1e8a; color:white; padding:24px 28px; display:flex; justify-content:space-between;} .content{padding:24px 28px;} table{width:100%; border-collapse:collapse; font-size:12px;} th{background:#f1f5f9; text-align:left; padding:10px; font-size:10px; text-transform:uppercase; color:#64748b;} td{padding:10px; border-bottom:1px solid #f1f5f9;} .total{text-align:right; font-size:20px; font-weight:800; color:#0a1e8a; margin-top:20px;}</style></head><body><div class="page"><div class="header"><div><h1>ORÇAMENTO ${v.numero}</h1><p>${empresa.fantasia||empresa.nome} • ${empresa.cnpj||sess.cnpj}</p><p>Cliente: ${cli?.nome} • Cód: ${cli?.codigo}</p></div><div style="text-align:right;"><p style="background:rgba(255,255,255,0.15); padding:6px 12px; border-radius:20px; font-weight:700;">${v.status.toUpperCase()}</p></div></div><div class="content"><table><tr><th>#</th><th>Descrição</th><th>Qtd</th><th>Unit</th><th>Total</th></tr>${v.itens.map((it,idx)=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return `<tr><td>${idx+1}</td><td>${p?.nome||it.descricao||'Produto'}</td><td>${it.qtd}</td><td>${fmtMoney(it.preco)}</td><td><b>${fmtMoney(it.subtotal)}</b></td></tr>`}).join('')}</table><div class="total">Total: ${fmtMoney(v.total)}</div></div></div><div style="text-align:center; margin:20px;"><button onclick="window.print()" style="padding:12px 24px; background:#0a1e8a; color:white; border:0; border-radius:12px; font-weight:700;">Imprimir PDF Orçamento</button></div></body></html>`;
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
  const orcs=db.vendas.filter(v=>v.empresaId===sess.empresaId && (v.status==='orcamento' || v.status==='aprovado' || v.status==='aguardar')).sort((a,b)=>(new Date(b.data)-new Date(a.data))||((parseInt(a.numero)||0)-(parseInt(b.numero)||0)));
  // Se view-orcamentos não existe no hub antigo, não faz nada, pois orcamentos já está em vendas
  if(view){
    view.innerHTML=`<div class="flex flex-wrap justify-between gap-3"><div><h3 class="font-bold text-[16px]">Orçamentos</h3><p class="text-[13px] text-slate-500 mt-1">Separado de Vendas conforme pedido.</p></div><button onclick="novaVenda(); setTimeout(()=>{document.getElementById('nv-status').value='orcamento'; onStatusVendaChange();},300)" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13px] shadow">+ Novo orçamento</button></div>
    <div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Orçamento / Cliente</th><th class="px-5 py-3">Total</th><th class="px-5 py-3">Situação</th><th class="px-5 py-3">Ações</th></tr></thead><tbody class="divide-y">${orcs.map(v=>{const cli=db.clientes.find(c=>c.id===v.clienteId); return `<tr class="hover:bg-slate-50"><td class="px-5 py-3"><p class="font-mono text-[11px] font-bold text-[#0a1e8a]">${v.numero}</p><p class="font-semibold text-[13px]">${cli?.nome||''}</p></td><td class="px-5 py-3"><p class="font-bold">${fmtMoney(v.total)}</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border">${v.status}</span></td><td class="px-5 py-3"><div class="flex gap-1"><button onclick="gerarOrcamentoPDF('${v.id}')" class="h-8 px-3 rounded-xl bg-[#0a1e8a] text-white text-[11px] font-bold">PDF</button></div></td></tr>`}).join('')||'<tr><td colspan="4" class="p-12 text-center text-slate-500">Nenhum orçamento</td></tr>'}</tbody></table></div>`;
  }
};
console.log('PATCH notinha v4.1 - impressão de vendas e orçamentos');
})();

// PATCH v3.6 - Vendas estilo desktop minimalista
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
    list=list.sort((a,b)=>(new Date(b.data)-new Date(a.data))||((parseInt(a.numero)||0)-(parseInt(b.numero)||0)));
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

// PATCH v3.9 - Interface minimalista e animada para vendas
(function(){
  function statusVendaClass(v){const st=(v.status||'').toLowerCase(); if(st==='faturado'||st==='finalizada') return 'ok'; if(st==='orcamento'||st==='aprovado') return 'info'; return 'wait';}
  function statusVendaLabel(v){const st=(v.status||'aguardar').toLowerCase(); if(st==='faturado') return 'Finalizada'; if(st==='orcamento') return 'Orçamento'; if(st==='aprovado') return 'Aprovada'; if(st==='aguardar') return 'Aguardando'; return st;}
  function vendaTipoNeo(v){return (v.itens||[]).some(it=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return p&&p.categoria==='Serviço';})?'Serviço':'Venda';}

  window.renderVendas = function(){
    const sess=getSession(); if(!sess) return;
    const view=document.getElementById('view-vendas')||ensureView('vendas');
    const qRaw=document.getElementById('neo-search-vendas')?.value||'';
    const tab=document.getElementById('neo-tab-vendas')?.value||'todas';
    const low=qRaw.toLowerCase(); const hoje=new Date().toISOString().slice(0,10);
    let list=db.vendas.filter(v=>v.empresaId===sess.empresaId);
    if(tab==='hoje') list=list.filter(v=>(v.data||'').slice(0,10)===hoje);
    if(tab==='abertas') list=list.filter(v=>!['faturado','finalizada'].includes((v.status||'').toLowerCase()));
    if(tab==='orcamentos') list=list.filter(v=>(v.status||'').toLowerCase()==='orcamento');
    if(low){ list=list.filter(v=>{const c=db.clientes.find(x=>x.id===v.clienteId)||{}; return (v.numero||'').toLowerCase().includes(low)||(c.nome||'').toLowerCase().includes(low)||String(c.codigo||'').includes(low)||(v.criadoPorNome||'').toLowerCase().includes(low);}); }
    list=list.sort((a,b)=>(new Date(b.data)-new Date(a.data))||((parseInt(a.numero)||0)-(parseInt(b.numero)||0)));
    const total=list.reduce((s,v)=>s+(v.total||0),0);
    view.innerHTML=`<div class="neo-shell">
      <div class="neo-panel neo-float-in">
        <div class="neo-head"><div><h3>Vendas e Notinhas</h3><p>Consulta rápida, orçamento, ordem de serviço e faturamento</p></div><div class="neo-actions"><button onclick="novaVenda()" class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button><button onclick="if(window.neoVendaSelecionada) imprimirNotinha(window.neoVendaSelecionada)" class="neo-btn"><i class="ph ph-printer"></i>Imprimir</button><button onclick="excluirVendaNeo()" class="neo-btn danger"><i class="ph ph-trash"></i>Excluir</button></div></div>
        <div class="p-4 border-b bg-white flex flex-wrap items-center gap-3"><input type="hidden" id="neo-tab-vendas" value="${tab}"><div class="neo-tabs"><button onclick="setNeoVendasTab('todas')" class="neo-tab ${tab==='todas'?'active':''}">Todas</button><button onclick="setNeoVendasTab('hoje')" class="neo-tab ${tab==='hoje'?'active':''}">Hoje</button><button onclick="setNeoVendasTab('abertas')" class="neo-tab ${tab==='abertas'?'active':''}">Abertas</button><button onclick="setNeoVendasTab('orcamentos')" class="neo-tab ${tab==='orcamentos'?'active':''}">Orçamentos</button></div><input id="neo-search-vendas" value="${escapeHtml(qRaw)}" oninput="renderVendas()" class="neo-input ml-auto min-w-[280px]" placeholder="Pesquisar por código, cliente, usuário..."><div class="text-right text-[12px] text-slate-500 min-w-[130px]"><b class="text-[#0a1e8a]">${list.length}</b> registros<br>${fmtMoney(total)}</div></div>
        <div class="overflow-auto max-h-[calc(100vh-290px)]"><table class="neo-table"><thead><tr><th>Código</th><th>Data</th><th>Cliente</th><th>Valor</th><th>Situação</th><th>Tipo</th><th>Usuário</th><th>Recebimento</th></tr></thead><tbody>${list.map(v=>{const c=db.clientes.find(x=>x.id===v.clienteId)||{}; return `<tr onclick="window.neoVendaSelecionada='${v.id}'; renderVendas()" ondblclick="showVenda('${v.id}')" class="cursor-pointer ${window.neoVendaSelecionada===v.id?'neo-selected':''}"><td><b class="text-[#0a1e8a]">${escapeHtml((v.numero||'').replace('VD-',''))}</b></td><td>${fmtDate(v.data)}</td><td><b>${escapeHtml(c.nome||'')}</b><br><span class="text-[11px] text-slate-500">Cód. ${c.codigo||'-'} • ${escapeHtml(c.documento||'')}</span></td><td><b>${fmtMoney(v.total||0)}</b></td><td><span class="neo-status ${statusVendaClass(v)}">${statusVendaLabel(v)}</span></td><td>${vendaTipoNeo(v)}</td><td>${escapeHtml((v.criadoPorNome||'-').split(' ')[0])}</td><td>${escapeHtml(v.formaPagamento||'Prazo')}</td></tr>`}).join('')||'<tr><td colspan="8" class="text-center text-slate-500 py-12">Nenhuma notinha encontrada</td></tr>'}</tbody></table></div>
      </div>
    </div>`;
    const input=document.getElementById('neo-search-vendas'); if(input && document.activeElement?.id==='neo-search-vendas') input.focus();
  };
  window.setNeoVendasTab=function(tab){const el=document.getElementById('neo-tab-vendas'); if(el) el.value=tab; renderVendas();};
  window.excluirVendaNeo=function(){ if(!window.neoVendaSelecionada) return toast('Selecione uma notinha','info'); deleteVenda(window.neoVendaSelecionada); window.neoVendaSelecionada=null; };

  window.novaVenda=function(){
    const sess=getSession(); if(!sess) return;
    window.neoVendaItens=[]; window.neoVendaCliente=null; window.neoVendaProduto=null;
    const box=document.getElementById('modal-box'); if(box) box.className='w-full max-w-[1100px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
    document.getElementById('modal-title').innerText='Nova venda';
    document.getElementById('modal-body').innerHTML=`<div class="neo-panel border-0 shadow-none">
      <div class="neo-head"><div><h3>Nova venda / orçamento</h3><p>Fluxo simplificado: cliente, itens, condição e finalizar</p></div><div class="text-right"><p class="text-white/70 text-[11px] uppercase">Atendente</p><b>${escapeHtml(sess.usuarioNome)}</b></div></div>
      <div class="neo-grid">
        <div class="space-y-3">
          <div class="neo-card"><label class="neo-label">Cliente</label><div class="flex gap-2"><input id="neo-cli-search" oninput="neoSearchClienteVenda(this.value)" class="neo-input flex-1" placeholder="Digite nome, código, CNPJ ou telefone"><button onclick="openModal('cliente')" class="neo-btn"><i class="ph ph-user-plus"></i>Novo</button></div><div id="neo-cli-results" class="neo-suggest hidden"></div><div id="neo-cli-selected" class="mt-3 hidden rounded-xl bg-[#f1f6ff] border border-[#dbeafe] p-3 text-[13px]"></div></div>
          <div class="neo-card"><label class="neo-label">Produto / Serviço</label><div class="grid grid-cols-12 gap-2"><select id="neo-item-tipo" class="neo-select col-span-3"><option>Produto</option><option>Serviço</option><option>Recarga</option></select><input id="neo-prod-search" oninput="neoSearchProdutoVenda(this.value)" class="neo-input col-span-6" placeholder="Buscar produto, toner, serviço..."><input id="neo-prod-qtd" type="number" value="1" min="1" class="neo-input col-span-1"><input id="neo-prod-valor" type="number" step="0.01" class="neo-input col-span-2" placeholder="Valor"></div><div id="neo-prod-results" class="neo-suggest hidden"></div><div class="mt-3 flex justify-end"><button onclick="neoAddItemVenda()" class="neo-btn primary"><i class="ph ph-plus-circle"></i>Adicionar item</button></div></div>
          <div class="neo-card p-0 overflow-hidden"><table class="neo-table"><thead><tr><th>Item</th><th>Qtd</th><th>Unitário</th><th>Total</th><th></th></tr></thead><tbody id="neo-venda-itens"><tr><td colspan="5" class="text-center text-slate-400 py-8">Nenhum item adicionado</td></tr></tbody></table></div>
        </div>
        <div class="space-y-3">
          <div class="neo-card"><label class="neo-label">Resumo</label><div class="flex justify-between text-[13px]"><span>Subtotal</span><b id="neo-venda-subtotal">R$ 0,00</b></div><div class="mt-3"><label class="neo-label">Desconto R$</label><input id="neo-venda-desc" type="number" step="0.01" value="0" oninput="neoUpdateVendaTotal()" class="neo-input w-full"></div><div class="mt-4 border-t pt-3"><p class="text-[11px] uppercase font-bold text-slate-500">Total</p><div id="neo-venda-total" class="neo-total">R$ 0,00</div></div></div>
          <div class="neo-card"><label class="neo-label">Situação</label><select id="neo-venda-status" onchange="neoTogglePagamento()" class="neo-select w-full"><option value="aguardar">Aguardar</option><option value="orcamento">Orçamento</option><option value="faturado">Faturar agora</option></select><div id="neo-pagamento-box" class="hidden mt-3"><label class="neo-label">Forma de pagamento</label><select id="neo-venda-pag" class="neo-select w-full"><option>Prazo</option><option>Dinheiro</option><option>PIX</option><option>Cartão de débito</option><option>Cartão de crédito</option><option>Boleto</option></select></div></div>
          <div class="neo-card"><button onclick="neoSalvarVenda()" class="neo-btn primary w-full justify-center !h-11"><i class="ph ph-check-circle"></i>Salvar e imprimir</button><button onclick="closeModal()" class="neo-btn w-full justify-center mt-2 !h-10"><i class="ph ph-x"></i>Cancelar</button></div>
        </div>
      </div>
    </div>`;
    document.getElementById('modal-footer').innerHTML=''; document.getElementById('modal-root').classList.remove('hidden'); setTimeout(()=>document.getElementById('neo-cli-search')?.focus(),80);
  };
  window.neoSearchClienteVenda=function(q){const sess=getSession(); const el=document.getElementById('neo-cli-results'); if(!el) return; const low=(q||'').toLowerCase(); if(!low){el.classList.add('hidden'); return;} const list=db.clientes.filter(c=>c.empresaId===sess.empresaId&&((c.nome||'').toLowerCase().includes(low)||(c.documento||'').toLowerCase().includes(low)||(c.telefone||'').toLowerCase().includes(low)||String(c.codigo||'').includes(low))).slice(0,10); el.classList.remove('hidden'); el.innerHTML=list.map(c=>`<button onclick="neoSelectClienteVenda('${c.id}')"><b>#${c.codigo||'-'}</b> ${escapeHtml(c.nome)}<br><span class="text-slate-500 text-[11px]">${escapeHtml(c.documento||'')} • ${escapeHtml(c.telefone||'')}</span></button>`).join('')||'<div class="p-3 text-slate-500 text-[12px]">Nenhum cliente</div>';};
  window.neoSelectClienteVenda=function(id){const c=db.clientes.find(x=>x.id===id); window.neoVendaCliente=c; document.getElementById('neo-cli-search').value=c?.nome||''; document.getElementById('neo-cli-results').classList.add('hidden'); const box=document.getElementById('neo-cli-selected'); box.classList.remove('hidden'); box.innerHTML=`<b>${escapeHtml(c?.nome||'')}</b><br><span class="text-slate-500">Cód. ${c?.codigo||'-'} • ${escapeHtml(c?.documento||'')}</span>`;};
  window.neoSearchProdutoVenda=function(q){const sess=getSession(); const el=document.getElementById('neo-prod-results'); if(!el) return; const low=(q||'').toLowerCase(); if(!low){el.classList.add('hidden'); return;} const list=db.produtos.filter(p=>p.empresaId===sess.empresaId&&((p.nome||'').toLowerCase().includes(low)||(p.sku||'').toLowerCase().includes(low))).slice(0,10); el.classList.remove('hidden'); el.innerHTML=list.map(p=>`<button onclick="neoSelectProdutoVenda('${p.id}')"><b>${escapeHtml(p.sku||'')}</b> ${escapeHtml(p.nome)} <span class="float-right">${fmtMoney(p.preco||0)}</span></button>`).join('')||'<div class="p-3 text-slate-500 text-[12px]">Nenhum produto</div>';};
  window.neoSelectProdutoVenda=function(id){const p=db.produtos.find(x=>x.id===id); window.neoVendaProduto=p; document.getElementById('neo-prod-search').value=p?.nome||''; document.getElementById('neo-prod-valor').value=p?.preco||0; document.getElementById('neo-prod-results').classList.add('hidden');};
  window.neoAddItemVenda=function(){if(!window.neoVendaProduto) return toast('Selecione um produto','error'); const qtd=parseFloat(document.getElementById('neo-prod-qtd').value)||1; const preco=parseFloat(document.getElementById('neo-prod-valor').value)||window.neoVendaProduto.preco||0; window.neoVendaItens.push({produtoId:window.neoVendaProduto.id,qtd,preco,subtotal:qtd*preco}); window.neoVendaProduto=null; document.getElementById('neo-prod-search').value=''; document.getElementById('neo-prod-valor').value=''; neoRenderItensVenda(); neoUpdateVendaTotal();};
  window.neoRenderItensVenda=function(){const body=document.getElementById('neo-venda-itens'); body.innerHTML=(window.neoVendaItens||[]).map((it,idx)=>{const p=db.produtos.find(x=>x.id===it.produtoId)||{}; return `<tr><td><b>${escapeHtml(p.nome||'Produto')}</b><br><span class="text-[11px] text-slate-500">${escapeHtml(p.sku||'')}</span></td><td>${it.qtd}</td><td>${fmtMoney(it.preco)}</td><td><b>${fmtMoney(it.subtotal)}</b></td><td><button onclick="neoRemoveItemVenda(${idx})" class="text-red-600"><i class="ph ph-trash"></i></button></td></tr>`}).join('')||'<tr><td colspan="5" class="text-center text-slate-400 py-8">Nenhum item adicionado</td></tr>';};
  window.neoRemoveItemVenda=function(idx){window.neoVendaItens.splice(idx,1); neoRenderItensVenda(); neoUpdateVendaTotal();};
  window.neoUpdateVendaTotal=function(){const sub=(window.neoVendaItens||[]).reduce((s,i)=>s+i.subtotal,0); const desc=parseFloat(document.getElementById('neo-venda-desc')?.value)||0; document.getElementById('neo-venda-subtotal').innerText=fmtMoney(sub); document.getElementById('neo-venda-total').innerText=fmtMoney(Math.max(0,sub-desc));};
  window.neoTogglePagamento=function(){document.getElementById('neo-pagamento-box')?.classList.toggle('hidden',document.getElementById('neo-venda-status').value!=='faturado');};
  window.neoSalvarVenda=function(){const sess=getSession(); if(!window.neoVendaCliente) return toast('Selecione o cliente','error'); if(!window.neoVendaItens?.length) return toast('Adicione ao menos um item','error'); const desc=parseFloat(document.getElementById('neo-venda-desc').value)||0; const total=Math.max(0,window.neoVendaItens.reduce((s,i)=>s+i.subtotal,0)-desc); const status=document.getElementById('neo-venda-status').value; const pag=status==='faturado'?(document.getElementById('neo-venda-pag').value||'Prazo'):'Não faturado'; const venda={id:uid('vda'),empresaId:sess.empresaId,numero:'VD-'+new Date().getFullYear()+'-'+String(db.vendas.filter(v=>v.empresaId===sess.empresaId).length+1).padStart(4,'0'),clienteId:window.neoVendaCliente.id,data:new Date().toISOString(),itens:[...window.neoVendaItens],desconto:desc,total,formaPagamento:pag,status,criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome,criadoEm:new Date().toISOString()}; venda.itens.forEach(it=>{const p=db.produtos.find(x=>x.id===it.produtoId&&x.empresaId===sess.empresaId); if(p&&p.categoria!=='Serviço'&&p.categoria!=='Recarga') p.estoque-=it.qtd;}); db.vendas.push(venda); logAction('venda','criar',venda.id,`Venda ${venda.numero} total ${fmtMoney(venda.total)}`); if(status==='faturado') db.contasReceber.push({id:uid('cr'),empresaId:sess.empresaId,origem:'venda',clienteId:venda.clienteId,descricao:`Venda ${venda.numero}`,valor:total,vencimento:new Date(Date.now()+1000*60*60*24*14).toISOString(),pagamentoData:null,status:'aberto',contratoId:null,leituraId:null,vendaId:venda.id,criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome,formaPagamento:pag}); saveDB(); renderVendas(); renderProdutos(); renderFinanceiro(); renderAuditoria(); closeModal(); toast('Venda salva','success'); setTimeout(()=>imprimirNotinha(venda.id),250);};

  window.renderClientes=function(){const sess=getSession(); if(!sess) return; const view=document.getElementById('view-clientes')||ensureView('clientes'); const q=document.getElementById('neo-search-clientes')?.value||''; const low=q.toLowerCase(); let list=db.clientes.filter(c=>c.empresaId===sess.empresaId&&c.status!=='inativo'); if(low) list=list.filter(c=>(c.nome||'').toLowerCase().includes(low)||(c.documento||'').toLowerCase().includes(low)||(c.telefone||'').toLowerCase().includes(low)||String(c.codigo||'').includes(low)); list=list.sort((a,b)=>(a.nome||'').localeCompare(b.nome||'')); view.innerHTML=`<div class="neo-shell"><div class="neo-panel neo-float-in"><div class="neo-head"><div><h3>Clientes</h3><p>Cadastro e consulta com busca rápida</p></div><div class="neo-actions"><button onclick="openModal('cliente')" class="neo-btn primary"><i class="ph ph-user-plus"></i>Novo</button><button onclick="if(window.neoClienteSelecionado) openModal('cliente',window.neoClienteSelecionado)" class="neo-btn"><i class="ph ph-pencil"></i>Alterar</button><button onclick="if(window.neoClienteSelecionado) deleteCliente(window.neoClienteSelecionado)" class="neo-btn danger"><i class="ph ph-trash"></i>Excluir</button></div></div><div class="p-4 border-b flex gap-3"><input id="neo-search-clientes" value="${escapeHtml(q)}" oninput="renderClientes()" class="neo-input flex-1" placeholder="Pesquisar nome, CNPJ, telefone ou código"><span class="text-[12px] text-slate-500 self-center"><b class="text-[#0a1e8a]">${list.length}</b> clientes</span></div><div class="overflow-auto max-h-[calc(100vh-290px)]"><table class="neo-table"><thead><tr><th>Código</th><th>Cliente</th><th>Telefone</th><th>CPF/CNPJ</th><th>Cidade</th><th>Status</th></tr></thead><tbody>${list.map(c=>`<tr onclick="window.neoClienteSelecionado='${c.id}'; renderClientes()" ondblclick="openModal('cliente','${c.id}')" class="cursor-pointer ${window.neoClienteSelecionado===c.id?'neo-selected':''}"><td><b class="text-[#0a1e8a]">${c.codigo||'-'}</b></td><td><b>${escapeHtml(c.nome||'')}</b><br><span class="text-[11px] text-slate-500">${escapeHtml(c.email||'')}</span></td><td>${escapeHtml(c.telefone||'')}</td><td>${escapeHtml(c.documento||'')}</td><td>${escapeHtml(c.cidade||'')} / ${escapeHtml(c.estado||'')}</td><td><span class="neo-status ${c.status==='ativo'?'ok':'wait'}">${escapeHtml(c.status||'ativo')}</span></td></tr>`).join('')||'<tr><td colspan="6" class="text-center text-slate-500 py-12">Nenhum cliente encontrado</td></tr>'}</tbody></table></div></div></div>`; const input=document.getElementById('neo-search-clientes'); if(input&&document.activeElement?.id==='neo-search-clientes') input.focus();};
})();

// PATCH v4.0 - Aplica visual neo/animado nos módulos principais e reduz caixas fechadas
(function(){
  function neoPage(title, subtitle, actionsHtml, toolsHtml, tableHtml){
    return `<div class="neo-shell"><div class="neo-panel neo-float-in"><div class="neo-head"><div><h3>${title}</h3><p>${subtitle||''}</p></div><div class="neo-actions">${actionsHtml||''}</div></div>${toolsHtml?`<div class="p-4 border-b bg-white flex flex-wrap items-center gap-3">${toolsHtml}</div>`:''}<div class="overflow-auto max-h-[calc(100vh-290px)]">${tableHtml}</div></div></div>`;
  }
  function emptyRow(cols,msg){return `<tr><td colspan="${cols}" class="text-center text-slate-500 py-12">${msg}</td></tr>`;}
  function inputSearch(id, value, fn, placeholder){return `<input id="${id}" value="${escapeHtml(value||'')}" oninput="${fn}()" class="neo-input flex-1 min-w-[260px]" placeholder="${placeholder}">`;}
  function statusPill(text,type='info'){return `<span class="neo-status ${type}">${escapeHtml(text||'-')}</span>`;}
  window.neoSetFilter=function(key,val,renderName){window[key]=val; if(typeof window[renderName]==='function') window[renderName]();};

  window.renderProdutos=function(){
    const sess=getSession(); if(!sess) return; const q=document.getElementById('neo-search-produtos')?.value||''; const low=q.toLowerCase();
    let list=db.produtos.filter(p=>p.empresaId===sess.empresaId && (!low||(p.nome||'').toLowerCase().includes(low)||(p.sku||'').toLowerCase().includes(low)||(p.categoria||'').toLowerCase().includes(low)));
    list=list.sort((a,b)=>(a.nome||'').localeCompare(b.nome||'')); const baixo=list.filter(p=>(p.estoque||0)<=(p.estoqueMin||0)).length;
    document.getElementById('view-produtos').innerHTML=neoPage('Estoque', 'Produtos, suprimentos, peças, serviços e recargas', `<button onclick="openModal('produto')" class="neo-btn primary"><i class="ph ph-plus"></i>Novo produto</button><button onclick="openModal('entradaEstoque')" class="neo-btn"><i class="ph ph-arrow-fat-line-up"></i>Entrada</button>`, `${inputSearch('neo-search-produtos',q,'renderProdutos','Pesquisar produto, SKU, categoria...')}<button onclick="neoSetFilter('neoProdutosBaixo',!window.neoProdutosBaixo,'renderProdutos')" class="neo-btn ${window.neoProdutosBaixo?'primary':''}"><i class="ph ph-warning"></i>Estoque baixo ${baixo}</button><button onclick="openModal('produto')" class="neo-btn"><i class="ph ph-plus-circle"></i>Cadastrar opção</button>`, `<table class="neo-table"><thead><tr><th>SKU</th><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Custo</th><th>Venda</th><th>Ações</th></tr></thead><tbody>${list.filter(p=>!window.neoProdutosBaixo || (p.estoque||0)<=(p.estoqueMin||0)).map(p=>`<tr><td><b class="text-[#0a1e8a]">${escapeHtml(p.sku||'')}</b></td><td><b>${escapeHtml(p.nome||'')}</b><br><span class="text-[11px] text-slate-500">${escapeHtml(p.fabricante||'')} • ${escapeHtml(p.local||'')}</span></td><td>${statusPill(p.categoria,'info')}</td><td><b class="${(p.estoque||0)<=(p.estoqueMin||0)?'text-red-600':''}">${p.estoque||0}</b><br><span class="text-[11px] text-slate-500">mín. ${p.estoqueMin||0}</span></td><td>${fmtMoney(p.custo||0)}</td><td><b>${fmtMoney(p.preco||0)}</b></td><td><button onclick="openModal('produto','${p.id}')" class="neo-btn"><i class="ph ph-pencil"></i></button></td></tr>`).join('')||emptyRow(7,'Nenhum produto encontrado')}</tbody></table>`);
  };

  window.renderEquipamentos=function(){
    const sess=getSession(); if(!sess) return; const q=document.getElementById('neo-search-equip')?.value||''; const low=q.toLowerCase();
    let list=db.equipamentos.filter(e=>e.empresaId===sess.empresaId && (!low||(e.modelo||'').toLowerCase().includes(low)||(e.serie||'').toLowerCase().includes(low)||(e.patrimonio||'').toLowerCase().includes(low)||(e.fabricante||'').toLowerCase().includes(low)));
    (document.getElementById('view-impressoras')||ensureView('impressoras')).innerHTML=neoPage('Impressoras', 'Cadastro do patrimônio e máquinas disponíveis para locação', `<button onclick="openModal('equipamento')" class="neo-btn primary"><i class="ph ph-plus"></i>Nova impressora</button>`, `${inputSearch('neo-search-equip',q,'renderEquipamentos','Pesquisar modelo, série, patrimônio...')}<button onclick="openModal('equipamento')" class="neo-btn"><i class="ph ph-plus-circle"></i>Cadastrar para escolher</button>`, `<table class="neo-table"><thead><tr><th>Patrimônio</th><th>Modelo</th><th>Fabricante</th><th>Série</th><th>Contadores</th><th>Status</th><th>Ações</th></tr></thead><tbody>${list.map(e=>`<tr><td><b class="text-[#0a1e8a]">${escapeHtml(e.patrimonio||'')}</b></td><td><b>${escapeHtml(e.modelo||'')}</b><br><span class="text-[11px] text-slate-500">${escapeHtml(e.tipo||'')}</span></td><td>${escapeHtml(e.fabricante||'')}</td><td>${escapeHtml(e.serie||'')}</td><td>PB ${Number(e.contadorPB||0).toLocaleString('pt-BR')}<br>COR ${Number(e.contadorCor||0).toLocaleString('pt-BR')}</td><td>${statusPill(e.status,e.status==='disponivel'?'ok':'info')}</td><td><button onclick="openModal('equipamento','${e.id}')" class="neo-btn"><i class="ph ph-pencil"></i></button></td></tr>`).join('')||emptyRow(7,'Nenhuma impressora cadastrada')}</tbody></table>`);
  };

  window.renderContratos=function(){
    const sess=getSession(); if(!sess) return; const q=document.getElementById('neo-search-contratos')?.value||''; const low=q.toLowerCase();
    let list=db.contratos.filter(c=>c.empresaId===sess.empresaId && (!low||(c.numero||'').toLowerCase().includes(low)||(db.clientes.find(x=>x.id===c.clienteId)?.nome||'').toLowerCase().includes(low)));
    (document.getElementById('view-contratos')||ensureView('contratos')).innerHTML=neoPage('Locação', 'Contratos, franquias e máquinas locadas', `<button onclick="openModal('contrato')" class="neo-btn primary"><i class="ph ph-plus"></i>Novo contrato</button><button onclick="navigateTo('parque')" class="neo-btn"><i class="ph ph-map-pin"></i>Máquinas nos clientes</button>`, `${inputSearch('neo-search-contratos',q,'renderContratos','Pesquisar contrato ou cliente...')}<button onclick="openModal('cliente')" class="neo-btn"><i class="ph ph-user-plus"></i>Cadastrar cliente</button><button onclick="openModal('equipamento')" class="neo-btn"><i class="ph ph-printer"></i>Cadastrar impressora</button>`, `<table class="neo-table"><thead><tr><th>Contrato</th><th>Cliente</th><th>Vigência</th><th>Franquia</th><th>Mensal</th><th>Status</th><th>Ações</th></tr></thead><tbody>${list.map(c=>{const cli=db.clientes.find(x=>x.id===c.clienteId)||{}; return `<tr><td><b class="text-[#0a1e8a]">${escapeHtml(c.numero||'')}</b></td><td><b>${escapeHtml(cli.nome||'')}</b><br><span class="text-[11px] text-slate-500">${escapeHtml(cli.documento||'')}</span></td><td>${fmtDate(c.dataInicio)} até ${fmtDate(c.dataFim)}</td><td>PB ${Number(c.franquiaPB||0).toLocaleString('pt-BR')}<br>COR ${Number(c.franquiaCor||0).toLocaleString('pt-BR')}</td><td><b>${fmtMoney(c.valorMensalFixo||0)}</b></td><td>${statusPill(c.status,c.status==='ativo'?'ok':'wait')}</td><td><button onclick="openModal('contrato','${c.id}')" class="neo-btn"><i class="ph ph-pencil"></i></button></td></tr>`}).join('')||emptyRow(7,'Nenhum contrato cadastrado')}</tbody></table>`);
  };

  window.renderParque=function(){
    const sess=getSession(); if(!sess) return; const q=document.getElementById('neo-search-parque')?.value||''; const low=q.toLowerCase();
    let list=db.parque.filter(p=>p.empresaId===sess.empresaId).filter(p=>{const cli=db.clientes.find(c=>c.id===p.clienteId)||{}; const eq=db.equipamentos.find(e=>e.id===p.equipamentoId)||{}; return !low||(cli.nome||'').toLowerCase().includes(low)||(eq.modelo||'').toLowerCase().includes(low)||(eq.serie||'').toLowerCase().includes(low);});
    (document.getElementById('view-parque')||ensureView('parque')).innerHTML=neoPage('Máquinas nos clientes', 'Parque instalado e alocação de impressoras', `<button onclick="openModal('contrato')" class="neo-btn primary"><i class="ph ph-plus"></i>Nova locação</button>`, `${inputSearch('neo-search-parque',q,'renderParque','Pesquisar cliente, máquina ou série...')}<button onclick="openModal('cliente')" class="neo-btn"><i class="ph ph-user-plus"></i>Cadastrar cliente</button><button onclick="openModal('equipamento')" class="neo-btn"><i class="ph ph-printer"></i>Cadastrar impressora</button>`, `<table class="neo-table"><thead><tr><th>Cliente</th><th>Impressora</th><th>Setor</th><th>Instalação</th><th>Status</th><th>Contrato</th></tr></thead><tbody>${list.map(p=>{const cli=db.clientes.find(c=>c.id===p.clienteId)||{}; const eq=db.equipamentos.find(e=>e.id===p.equipamentoId)||{}; const ct=db.contratos.find(c=>c.id===p.contratoId)||{}; return `<tr><td><b>${escapeHtml(cli.nome||'')}</b></td><td><b class="text-[#0a1e8a]">${escapeHtml(eq.modelo||'')}</b><br><span class="text-[11px] text-slate-500">${escapeHtml(eq.serie||'')}</span></td><td>${escapeHtml(p.setor||'')}</td><td>${fmtDate(p.dataInstalacao)}</td><td>${statusPill(p.status,p.status==='ativo'?'ok':'wait')}</td><td>${escapeHtml(ct.numero||'')}</td></tr>`}).join('')||emptyRow(6,'Nenhuma máquina instalada')}</tbody></table>`);
  };

  window.renderLeituras=function(){
    const sess=getSession(); if(!sess) return; const q=document.getElementById('neo-search-leituras')?.value||''; const low=q.toLowerCase();
    let list=db.leituras.filter(l=>l.empresaId===sess.empresaId).filter(l=>{const cli=db.clientes.find(c=>c.id===l.clienteId)||{}; return !low||(cli.nome||'').toLowerCase().includes(low);}).sort((a,b)=>new Date(b.dataLeitura)-new Date(a.dataLeitura));
    (document.getElementById('view-leituras')||ensureView('leituras')).innerHTML=neoPage('Leituras', 'Contadores, excedentes e faturamento de locação', `<button onclick="openModal('leitura')" class="neo-btn primary"><i class="ph ph-plus"></i>Nova leitura</button><button onclick="gerarFaturasPendentes()" class="neo-btn"><i class="ph ph-receipt"></i>Gerar faturas</button>`, `${inputSearch('neo-search-leituras',q,'renderLeituras','Pesquisar cliente...')}<button onclick="openModal('contrato')" class="neo-btn"><i class="ph ph-file-plus"></i>Cadastrar contrato</button>`, `<table class="neo-table"><thead><tr><th>Data</th><th>Cliente</th><th>PB</th><th>Cor</th><th>Consumo</th><th>Excedente</th><th>Status</th></tr></thead><tbody>${list.map(l=>{const cli=db.clientes.find(c=>c.id===l.clienteId)||{}; return `<tr><td>${fmtDate(l.dataLeitura)}</td><td><b>${escapeHtml(cli.nome||'')}</b></td><td>${Number(l.contadorPB||0).toLocaleString('pt-BR')}</td><td>${Number(l.contadorCor||0).toLocaleString('pt-BR')}</td><td>PB ${l.consumoPB||0}<br>COR ${l.consumoCor||0}</td><td><b>${fmtMoney(l.valorExcedente||0)}</b></td><td>${statusPill(l.status,l.status==='faturado'?'ok':'wait')}</td></tr>`}).join('')||emptyRow(7,'Nenhuma leitura lançada')}</tbody></table>`);
  };

  window.renderOs=function(){
    const sess=getSession(); if(!sess) return; const q=document.getElementById('neo-search-os')?.value||''; const low=q.toLowerCase();
    let list=db.os.filter(o=>o.empresaId===sess.empresaId).filter(o=>{const cli=db.clientes.find(c=>c.id===o.clienteId)||{}; return !low||(cli.nome||'').toLowerCase().includes(low)||(o.numero||'').toLowerCase().includes(low)||(o.problema||'').toLowerCase().includes(low);}).sort((a,b)=>new Date(b.abertura)-new Date(a.abertura));
    (document.getElementById('view-manutencao')||ensureView('manutencao')).innerHTML=neoPage('Chamados', 'Atendimento técnico, manutenção e ordens de serviço', `<button onclick="openModal('os')" class="neo-btn primary"><i class="ph ph-plus"></i>Novo chamado</button>`, `${inputSearch('neo-search-os',q,'renderOs','Pesquisar cliente, OS ou problema...')}<button onclick="openModal('cliente')" class="neo-btn"><i class="ph ph-user-plus"></i>Cadastrar cliente</button><button onclick="addTecnico && navigateTo('config')" class="neo-btn"><i class="ph ph-user-gear"></i>Cadastrar técnico</button>`, `<table class="neo-table"><thead><tr><th>OS</th><th>Cliente</th><th>Problema</th><th>Técnico</th><th>Abertura</th><th>Prioridade</th><th>Status</th></tr></thead><tbody>${list.map(o=>{const cli=db.clientes.find(c=>c.id===o.clienteId)||{}; return `<tr><td><b class="text-[#0a1e8a]">${escapeHtml(o.numero||'')}</b></td><td><b>${escapeHtml(cli.nome||'')}</b></td><td>${escapeHtml(o.problema||o.descricao||'')}</td><td>${escapeHtml(o.tecnicoNome||o.tecnico||'-')}</td><td>${fmtDate(o.abertura||o.criadoEm)}</td><td>${escapeHtml(o.prioridade||'Normal')}</td><td>${statusPill(o.status,o.status==='concluido'?'ok':'wait')}</td></tr>`}).join('')||emptyRow(7,'Nenhum chamado aberto')}</tbody></table>`);
  };

  window.renderFinanceiro=function(){
    const sess=getSession(); if(!sess) return; const receber=db.contasReceber.filter(c=>c.empresaId===sess.empresaId); const pagar=db.contasPagar.filter(c=>c.empresaId===sess.empresaId); const totalRec=receber.reduce((s,c)=>s+(c.valor||0),0); const totalPag=pagar.reduce((s,c)=>s+(c.valor||0),0);
    document.getElementById('view-financeiro').innerHTML=neoPage('Financeiro', 'Contas a receber, pagar e fluxo simples', `<button onclick="openModal('contaReceber')" class="neo-btn primary"><i class="ph ph-arrow-circle-down"></i>Receber</button><button onclick="openModal('contaPagar')" class="neo-btn"><i class="ph ph-arrow-circle-up"></i>Pagar</button>`, `<div class="grid grid-cols-1 md:grid-cols-3 gap-3 w-full"><div class="neo-card"><p class="neo-label">A receber</p><div class="neo-total !text-[24px]">${fmtMoney(totalRec)}</div></div><div class="neo-card"><p class="neo-label">A pagar</p><div class="neo-total !text-[24px] !text-red-600">${fmtMoney(totalPag)}</div></div><div class="neo-card"><p class="neo-label">Saldo previsto</p><div class="neo-total !text-[24px]">${fmtMoney(totalRec-totalPag)}</div></div></div>`, `<table class="neo-table"><thead><tr><th>Tipo</th><th>Descrição</th><th>Cliente/Fornecedor</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>${receber.map(c=>{const cli=db.clientes.find(x=>x.id===c.clienteId)||{}; return `<tr><td>Receber</td><td>${escapeHtml(c.descricao||'')}</td><td>${escapeHtml(cli.nome||'')}</td><td><b>${fmtMoney(c.valor||0)}</b></td><td>${fmtDate(c.vencimento)}</td><td>${statusPill(c.status,c.status==='pago'?'ok':'wait')}</td></tr>`}).concat(pagar.map(c=>`<tr><td>Pagar</td><td>${escapeHtml(c.descricao||'')}</td><td>${escapeHtml(c.fornecedor||'')}</td><td><b class="text-red-600">${fmtMoney(c.valor||0)}</b></td><td>${fmtDate(c.vencimento)}</td><td>${statusPill(c.status,c.status==='pago'?'ok':'wait')}</td></tr>`)).join('')||emptyRow(6,'Nenhum lançamento financeiro')}</tbody></table>`);
  };

  window.renderRelatorios=function(){
    const sess=getSession(); if(!sess) return; const cards=[['Clientes',db.clientes.filter(c=>c.empresaId===sess.empresaId).length],['Vendas',db.vendas.filter(v=>v.empresaId===sess.empresaId).length],['Contratos',db.contratos.filter(c=>c.empresaId===sess.empresaId).length],['Chamados',db.os.filter(o=>o.empresaId===sess.empresaId && o.status!=='concluido').length]];
    document.getElementById('view-relatorios').innerHTML=neoPage('Relatórios', 'Resumo visual da operação', `<button onclick="exportBackup()" class="neo-btn primary"><i class="ph ph-download"></i>Exportar</button>`, `<div class="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">${cards.map(c=>`<div class="neo-card"><p class="neo-label">${c[0]}</p><div class="neo-total !text-[28px]">${c[1]}</div></div>`).join('')}</div>`, `<div class="p-8 text-center text-slate-500">Relatórios detalhados serão conectados ao banco em nuvem na próxima etapa.</div>`);
  };

  window.renderAuditoria=function(){
    const sess=getSession(); if(!sess) return; const q=document.getElementById('neo-search-audit')?.value||''; const low=q.toLowerCase(); let list=db.logs.filter(l=>l.empresaId===sess.empresaId && (!low||(l.usuarioNome||'').toLowerCase().includes(low)||(l.entidade||'').toLowerCase().includes(low)||(l.acao||'').toLowerCase().includes(low))).slice(0,300);
    document.getElementById('view-auditoria').innerHTML=neoPage('Auditoria', 'Registro automático de ações por usuário', '', `${inputSearch('neo-search-audit',q,'renderAuditoria','Pesquisar usuário, módulo ou ação...')}`, `<table class="neo-table"><thead><tr><th>Data</th><th>Usuário</th><th>Módulo</th><th>Ação</th><th>Detalhes</th></tr></thead><tbody>${list.map(l=>`<tr><td>${fmtDateTime(l.dataHora)}</td><td><b>${escapeHtml(l.usuarioNome||'')}</b><br><span class="text-[11px] text-slate-500">${escapeHtml(l.usuarioLogin||'')}</span></td><td>${escapeHtml(l.entidade||'')}</td><td>${statusPill(l.acao,'info')}</td><td>${escapeHtml(l.detalhes||'')}</td></tr>`).join('')||emptyRow(5,'Nenhuma ação registrada')}</tbody></table>`);
  };

  window.renderUsuarios=function(){
    const sess=getSession(); if(!sess) return; const list=db.usuarios.filter(u=>u.empresaId===sess.empresaId);
    document.getElementById('view-usuarios').innerHTML=neoPage('Usuários', 'Acessos, perfis e autorização por CNPJ', `<button onclick="openModalCriarUsuario()" class="neo-btn primary"><i class="ph ph-user-plus"></i>Novo usuário</button>`, `<button onclick="openModalCriarUsuario()" class="neo-btn"><i class="ph ph-plus-circle"></i>Cadastrar para escolher em vendas/chamados</button>`, `<table class="neo-table"><thead><tr><th>Nome</th><th>Login</th><th>Perfil</th><th>Status</th><th>Criado em</th></tr></thead><tbody>${list.map(u=>`<tr><td><b>${escapeHtml(u.nome||'')}</b></td><td>${escapeHtml(u.login||'')}</td><td>${statusPill(u.perfil,'info')}</td><td>${statusPill(u.ativo?'Ativo':'Inativo',u.ativo?'ok':'wait')}</td><td>${fmtDate(u.criadoEm)}</td></tr>`).join('')||emptyRow(5,'Nenhum usuário')}</tbody></table>`);
  };

  window.renderConfig=function(){
    document.getElementById('view-config').innerHTML=neoPage('Configurações', 'Empresa, técnicos e preferências do sistema', `<button onclick="saveConfig()" class="neo-btn primary"><i class="ph ph-floppy-disk"></i>Salvar</button>`, `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full"><div class="neo-card"><label class="neo-label">Técnico</label><div class="flex gap-2"><input id="new-tecnico-nome" class="neo-input flex-1" placeholder="Nome do técnico"><button onclick="addTecnico()" class="neo-btn primary"><i class="ph ph-plus"></i>Cadastrar</button></div></div><div class="neo-card"><p class="neo-label">Ações</p><button onclick="exportBackup()" class="neo-btn"><i class="ph ph-download"></i>Exportar backup local</button></div></div>`, `<div id="list-tecnicos" class="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">${(db.tecnicos||[]).map(t=>`<div class="neo-card"><b>${escapeHtml(t.nome)}</b><p class="text-[12px] text-slate-500">${escapeHtml(t.especialidade||'Geral')}</p></div>`).join('')}</div>`);
  };

  // IMPORTANTE: renderBanco NÃO é sobrescrito aqui.
  // A tela completa de migração (Firebird + upload JSON + Supabase) está no app.js.
})();

// PATCH v4.1 - OS junto com notinha sem obrigar caixa fechada
(function(){
  const baseNovaVendaNeo = window.novaVenda;
  window.novaVenda = function(){
    if(typeof baseNovaVendaNeo === 'function') baseNovaVendaNeo();
    setTimeout(()=>{
      const actionCard = document.querySelector('#modal-body .neo-grid > div:last-child .neo-card:last-child');
      if(!actionCard || document.getElementById('neo-os-venda-card')) return;
      const osCard = document.createElement('div');
      osCard.id = 'neo-os-venda-card';
      osCard.className = 'neo-card neo-float-in';
      osCard.innerHTML = `
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="neo-label mb-1">Ordem de serviço</p>
            <p class="text-[12px] text-slate-500">Opcional: gerar OS junto com esta notinha</p>
          </div>
          <button type="button" id="neo-os-toggle-btn" onclick="neoToggleOSVenda()" class="neo-btn"><i class="ph ph-wrench"></i>Adicionar OS</button>
        </div>
        <div id="neo-os-fields" class="hidden mt-3 space-y-2">
          <input id="neo-os-problema" class="neo-input w-full" placeholder="Problema/serviço solicitado. Ex: manutenção, instalação, retirada...">
          <textarea id="neo-os-desc" class="neo-input w-full !h-[76px] py-2" placeholder="Observações para o técnico"></textarea>
          <div class="grid grid-cols-2 gap-2">
            <input id="neo-os-tecnico" class="neo-input" placeholder="Técnico/responsável">
            <button type="button" onclick="navigateTo('config'); closeModal();" class="neo-btn justify-center"><i class="ph ph-user-plus"></i>Cadastrar técnico</button>
          </div>
        </div>`;
      actionCard.parentNode.insertBefore(osCard, actionCard);
    }, 80);
  };
  window.neoToggleOSVenda = function(){
    window.neoGerarOSVenda = !window.neoGerarOSVenda;
    const fields = document.getElementById('neo-os-fields');
    const btn = document.getElementById('neo-os-toggle-btn');
    if(fields) fields.classList.toggle('hidden', !window.neoGerarOSVenda);
    if(btn){
      btn.classList.toggle('primary', !!window.neoGerarOSVenda);
      btn.innerHTML = window.neoGerarOSVenda ? '<i class="ph ph-check-circle"></i>OS será gerada' : '<i class="ph ph-wrench"></i>Adicionar OS';
    }
  };
  const baseSalvarVendaNeo = window.neoSalvarVenda;
  window.neoSalvarVenda = function(){
    const beforeIds = new Set((db.vendas||[]).map(v=>v.id));
    const gerarOS = !!window.neoGerarOSVenda;
    const problema = (document.getElementById('neo-os-problema')?.value || '').trim();
    const descricao = (document.getElementById('neo-os-desc')?.value || '').trim();
    const tecnico = (document.getElementById('neo-os-tecnico')?.value || '').trim();
    if(gerarOS && !problema) return toast('Informe o problema/serviço da OS', 'error');
    if(typeof baseSalvarVendaNeo === 'function') baseSalvarVendaNeo();
    const sess = getSession();
    const venda = (db.vendas||[]).find(v=>!beforeIds.has(v.id) && v.empresaId===sess?.empresaId);
    if(gerarOS && venda){
      const numero = 'OS-' + new Date().getFullYear() + '-' + String((db.os||[]).filter(o=>o.empresaId===sess.empresaId).length+1).padStart(4,'0');
      db.os.push({
        id: uid('os'), empresaId: sess.empresaId, numero,
        clienteId: venda.clienteId, equipamentoId: null, contratoId: null,
        vendaId: venda.id, problema, descricao,
        prioridade: 'normal', tecnicoNome: tecnico, tecnico,
        status: 'aberto', abertura: new Date().toISOString(), criadoEm: new Date().toISOString(),
        criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome
      });
      logAction('os','criar_via_venda',venda.id,`OS ${numero} criada junto com ${venda.numero}`);
      saveDB();
      toast(`OS ${numero} criada junto com a notinha`, 'success');
    }
    window.neoGerarOSVenda = false;
  };
})();

// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.2 — Filtros, ordenação e HISTÓRICO nas vendas e em TUDO que veio
// do sistema antigo + nomes de cliente/usuário mesmo sem vínculo de cadastro
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  // Helpers de status/tipo (repetidos aqui porque os originais vivem em outro escopo)
  function statusVendaClass(v){const st=(v.status||'').toLowerCase(); if(st==='faturado'||st==='finalizada') return 'ok'; if(st==='orcamento'||st==='aprovado') return 'info'; return 'wait';}
  function statusVendaLabel(v){const st=(v.status||'aguardar').toLowerCase(); if(st==='faturado') return 'Finalizada'; if(st==='orcamento') return 'Orçamento'; if(st==='aprovado') return 'Aprovada'; if(st==='aguardar') return 'Aguardando'; return st;}
  function vendaTipoNeo(v){return (v.itens||[]).some(it=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return p&&p.categoria==='Serviço';})?'Serviço':'Venda';}
  // Cliente da venda mesmo quando o cadastro não existe mais (dado do sistema antigo)
  window.clienteDaVenda = function(v){
    const c = db.clientes.find(x=>x.id===v.clienteId);
    if(c) return c;
    if(v && v.clienteNomeAntigo) return {nome:v.clienteNomeAntigo, codigo:v.codClienteAntigo||'-', documento:'(cadastro do sistema antigo)', endereco:'', cidade:'', estado:'', telefone:'', semVinculo:true};
    return null;
  };
  // Usuário exibido = quem ATENDEU/ENTREGOU (migrado), não quem abriu a tela
  window.usuarioDaVenda = function(v){ return (v && (v.atendenteNome || v.criadoPorNome)) || '-'; };
  // Número da notinha como inteiro (pega o ÚLTIMO bloco de dígitos: "VD-2026-0081" → 81, "349" → 349)
  window.numeroVendaInt = function(num){ const m=String(num||'').match(/(\d+)(?!.*\d)/); return m?parseInt(m[1],10):0; };

  // ── VENDAS / NOTINHAS com filtros, ordenação e histórico ──
  window.renderVendas = function(){
    const sess=getSession(); if(!sess) return;
    const view=document.getElementById('view-vendas')||ensureView('vendas');
    const qRaw=document.getElementById('neo-search-vendas')?.value||'';
    const tab=document.getElementById('neo-tab-vendas')?.value||'todas';
    const fDe=document.getElementById('neo-vendas-de')?.value||'';
    const fAte=document.getElementById('neo-vendas-ate')?.value||'';
    const fSit=document.getElementById('neo-vendas-sit')?.value||'todas';
    const fVend=document.getElementById('neo-vendas-vend')?.value||'todos';
    const ordem=document.getElementById('neo-vendas-ordem')?.value||localStorage.getItem('digicopy_ordem_vendas')||'data-desc';
    const low=qRaw.toLowerCase(); const hoje=new Date().toISOString().slice(0,10);
    const nativos=db.vendas.filter(v=>v.empresaId===sess.empresaId);
    const legados=[];
    Object.entries(db.modulosDinamicos||{}).forEach(([nome,mod])=>{
      if(!/VENDA|ORCAMENT|PEDIDO|NOTINHA|CUPOM|COMANDA/i.test(nome)) return;
      (mod.dados||[]).forEach((r,i)=>{
        const numero=r.NUMERO||r.CODIGO||r.COD_VENDA||r.ID||`${nome}-${i+1}`;
        legados.push({id:`legado_venda_${nome}_${i}`,empresaId:sess.empresaId,numero:String(numero),data:r.DATA||r.DATA_VENDA||r.EMISSAO||r.DT_VENDA||r.CRIADO_EM,total:Number(r.TOTAL||r.VALOR||r.VALOR_TOTAL||0)||0,status:String(r.SITUACAO||r.STATUS||'finalizada').toLowerCase(),formaPagamento:r.PAGAMENTO||r.FORMA_PAGAMENTO||r.RECEBIMENTO||'Prazo',clienteNomeAntigo:r.CLIENTE||r.NOME_CLIENTE||r.RAZAO_SOCIAL||r.NOME||'',codClienteAntigo:r.COD_CLIENTE||r.CODIGO_CLIENTE||'',criadoPorNome:r.VENDEDOR||r.USUARIO||r.ATENDENTE||'Importado',itens:[],origemMigracao:true,tabelaOrigem:nome});
      });
    });
    const base=[...nativos,...legados];
    let list=base;
    if(tab==='hoje') list=list.filter(v=>(v.data||'').slice(0,10)===hoje);
    if(tab==='abertas') list=list.filter(v=>!['faturado','finalizada'].includes((v.status||'').toLowerCase()));
    if(tab==='orcamentos') list=list.filter(v=>(v.status||'').toLowerCase()==='orcamento');
    if(fDe) list=list.filter(v=>(v.data||'').slice(0,10)>=fDe);
    if(fAte) list=list.filter(v=>(v.data||'').slice(0,10)<=fAte);
    if(fSit!=='todas') list=list.filter(v=>(v.status||'aguardar')===fSit);
    if(fVend!=='todos') list=list.filter(v=>usuarioDaVenda(v)===fVend);
    if(low){ list=list.filter(v=>{ const c=clienteDaVenda(v)||{};
      return (v.numero||'').toLowerCase().includes(low)
        ||(c.nome||'').toLowerCase().includes(low)
        ||String(c.codigo||'').includes(low)
        ||String(v.codClienteAntigo||'').includes(low)
        ||(v.clienteNomeAntigo||'').toLowerCase().includes(low)
        ||usuarioDaVenda(v).toLowerCase().includes(low)
        ||(v.formaPagamento||'').toLowerCase().includes(low); }); }
    const cmpData=(a,b)=>new Date(a.data||0)-new Date(b.data||0);
    const cmpCod=(a,b)=>numeroVendaInt(a.numero)-numeroVendaInt(b.numero);
    const cmpCli=(a,b)=>(((clienteDaVenda(a)||{}).nome)||'').localeCompare(((clienteDaVenda(b)||{}).nome)||'','pt-BR',{sensitivity:'base'});
    const cmpVal=(a,b)=>(a.total||0)-(b.total||0);
    const ordFns={'data-desc':(a,b)=>cmpData(b,a)||cmpCod(b,a),'data-asc':(a,b)=>cmpData(a,b)||cmpCod(a,b),'cod-desc':(a,b)=>cmpCod(b,a)||cmpData(b,a),'cod-asc':(a,b)=>cmpCod(a,b)||cmpData(a,b),'cliente':(a,b)=>cmpCli(a,b)||cmpData(b,a),'valor-desc':(a,b)=>cmpVal(b,a),'valor-asc':(a,b)=>cmpVal(a,b)};
    list=list.sort(ordFns[ordem]||ordFns['data-desc']);
    const total=list.reduce((s,v)=>s+(v.total||0),0);
    const vendedores=[...new Set(base.map(usuarioDaVenda).filter(x=>x&&x!=='-'))].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));
    const situacoes=[...new Set(base.map(v=>v.status||'aguardar'))].sort();
    view.innerHTML=`<div class="neo-shell">
      <div class="neo-panel neo-float-in">
        <div class="neo-head"><div><h3>Vendas e Notinhas</h3><p>Consulta rápida, orçamento, ordem de serviço e faturamento — <b>duplo clique</b> (ou o olho 👁) abre o histórico completo</p></div><div class="neo-actions"><button onclick="novaVenda()" class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button><button onclick="if(window.neoVendaSelecionada) historicoVenda(window.neoVendaSelecionada); else toast('Selecione uma notinha','info')" class="neo-btn"><i class="ph ph-clock-counter-clockwise"></i>Histórico</button><button onclick="if(window.neoVendaSelecionada) imprimirNotinha(window.neoVendaSelecionada)" class="neo-btn"><i class="ph ph-printer"></i>Imprimir</button><button onclick="excluirVendaNeo()" class="neo-btn danger"><i class="ph ph-trash"></i>Excluir</button></div></div>
        <div class="p-4 border-b bg-white space-y-2">
          <input type="hidden" id="neo-tab-vendas" value="${tab}">
          <div class="flex flex-wrap items-center gap-3">
            <div class="neo-tabs"><button onclick="setNeoVendasTab('todas')" class="neo-tab ${tab==='todas'?'active':''}">Todas</button><button onclick="setNeoVendasTab('hoje')" class="neo-tab ${tab==='hoje'?'active':''}">Hoje</button><button onclick="setNeoVendasTab('abertas')" class="neo-tab ${tab==='abertas'?'active':''}">Abertas</button><button onclick="setNeoVendasTab('orcamentos')" class="neo-tab ${tab==='orcamentos'?'active':''}">Orçamentos</button></div>
            <input id="neo-search-vendas" value="${escapeHtml(qRaw)}" oninput="renderVendas()" class="neo-input ml-auto min-w-[260px] flex-1" placeholder="Pesquisar por código, cliente, usuário, pagamento...">
            <div class="text-right text-[12px] text-slate-500 min-w-[130px]"><b class="text-[#0a1e8a]">${list.length}</b> registros<br>${fmtMoney(total)}</div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="text-[11px] font-bold text-slate-500 uppercase">De</label><input id="neo-vendas-de" type="date" value="${fDe}" onchange="renderVendas()" class="neo-input !w-[150px] !h-9">
            <label class="text-[11px] font-bold text-slate-500 uppercase">Até</label><input id="neo-vendas-ate" type="date" value="${fAte}" onchange="renderVendas()" class="neo-input !w-[150px] !h-9">
            <select id="neo-vendas-sit" onchange="renderVendas()" class="neo-select !h-9"><option value="todas">Situação: todas</option>${situacoes.map(s=>`<option value="${s}" ${fSit===s?'selected':''}>${s}</option>`).join('')}</select>
            <select id="neo-vendas-vend" onchange="renderVendas()" class="neo-select !h-9"><option value="todos">Usuário: todos</option>${vendedores.map(n=>`<option ${fVend===n?'selected':''}>${escapeHtml(n)}</option>`).join('')}</select>
            <select id="neo-vendas-ordem" onchange="localStorage.setItem('digicopy_ordem_vendas',this.value); renderVendas()" class="neo-select !h-9 font-bold text-[#0a1e8a]">
              <option value="data-desc" ${ordem==='data-desc'?'selected':''}>⇩ Data (recentes 1º)</option>
              <option value="data-asc" ${ordem==='data-asc'?'selected':''}>⇧ Data (antigas 1º)</option>
              <option value="cod-desc" ${ordem==='cod-desc'?'selected':''}>⇩ Código (maior 1º)</option>
              <option value="cod-asc" ${ordem==='cod-asc'?'selected':''}>⇧ Código (menor 1º)</option>
              <option value="cliente" ${ordem==='cliente'?'selected':''}>Cliente A → Z</option>
              <option value="valor-desc" ${ordem==='valor-desc'?'selected':''}>⇩ Valor (maior 1º)</option>
              <option value="valor-asc" ${ordem==='valor-asc'?'selected':''}>⇧ Valor (menor 1º)</option>
            </select>
            <button onclick="document.getElementById('neo-vendas-de').value='';document.getElementById('neo-vendas-ate').value='';document.getElementById('neo-vendas-sit').value='todas';document.getElementById('neo-vendas-vend').value='todos';document.getElementById('neo-search-vendas').value='';renderVendas()" class="neo-btn !h-9"><i class="ph ph-funnel-x"></i>Limpar filtros</button>
          </div>
        </div>
        <div class="overflow-auto max-h-[calc(100vh-330px)]"><table class="neo-table"><thead><tr><th>Código</th><th>Data</th><th>Cliente</th><th>Valor</th><th>Situação</th><th>Tipo</th><th>Usuário</th><th>Recebimento</th><th></th></tr></thead><tbody>${list.map(v=>{const c=clienteDaVenda(v); return `<tr onclick="window.neoVendaSelecionada='${v.id}'; renderVendas()" ondblclick="historicoVenda('${v.id}')" class="cursor-pointer ${window.neoVendaSelecionada===v.id?'neo-selected':''}"><td><b class="text-[#0a1e8a]">${escapeHtml((v.numero||'').replace('VD-',''))}</b></td><td>${fmtDate(v.data)}</td><td><b>${escapeHtml(c?c.nome:'(sem cliente)')}</b><br><span class="text-[11px] text-slate-500">Cód. ${c?(c.codigo||'-'):'-'}${c&&c.semVinculo?' • sistema antigo':''}${c&&c.documento?' • '+escapeHtml(c.documento):''}</span></td><td><b>${fmtMoney(v.total||0)}</b></td><td><span class="neo-status ${statusVendaClass(v)}">${statusVendaLabel(v)}</span></td><td>${vendaTipoNeo(v)}</td><td>${escapeHtml(usuarioDaVenda(v).split(' ')[0])}</td><td>${escapeHtml(v.formaPagamento||'Prazo')}</td><td><button onclick="event.stopPropagation(); historicoVenda('${v.id}')" class="neo-btn !px-2" title="Abrir histórico"><i class="ph ph-eye"></i></button></td></tr>`}).join('')||'<tr><td colspan="9" class="text-center text-slate-500 py-12">Nenhuma notinha encontrada</td></tr>'}</tbody></table></div>
      </div>
    </div>`;
    const input=document.getElementById('neo-search-vendas'); if(input && document.activeElement?.id==='neo-search-vendas'){ input.focus(); input.setSelectionRange(input.value.length,input.value.length); }
  };

  // ── HISTÓRICO COMPLETO DA NOTINHA (modal) ──
  window.historicoVenda = function(id){
    const v=db.vendas.find(x=>x.id===id); if(!v){ if(typeof toast==='function') toast('Notinha não encontrada','error'); return; }
    const cli=clienteDaVenda(v);
    const logs=(db.logs||[]).filter(l=>l.entidadeId===v.id || (l.entidade==='venda'&&(l.entidadeId===v.id)) || ((l.detalhes||'').includes(v.numero) && (l.detalhes||'').length<200)).slice(0,30);
    const fins=(db.contasReceber||[]).filter(c=>c.vendaId===v.id || ((c.descricao||'').includes(v.numero)));
    const box=document.getElementById('modal-box'); if(box) box.className='w-full max-w-[880px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
    document.getElementById('modal-title').innerText='Histórico da notinha '+(v.numero||'');
    document.getElementById('modal-body').innerHTML=`<div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="neo-card"><p class="neo-label">Cliente</p><b class="text-[15px]">${escapeHtml(cli?cli.nome:'(sem cliente)')}</b><p class="text-[12px] text-slate-500 mt-1">Cód. ${cli?(cli.codigo||'-'):'-'}${cli&&cli.semVinculo?' • vínculo do sistema antigo':''}</p><p class="text-[12px] text-slate-500">${escapeHtml(cli?(cli.documento||''):'')}</p></div>
        <div class="neo-card"><p class="neo-label">Notinha</p><div class="flex flex-wrap gap-x-4 gap-y-1 text-[13px]"><span>Nº <b class="text-[#0a1e8a]">${escapeHtml(v.numero||'')}</b></span><span>Data: <b>${fmtDate(v.data)}</b></span><span>Situação: <b>${statusVendaLabel(v)}</b></span><span>Tipo: <b>${vendaTipoNeo(v)}</b></span></div><p class="text-[12px] text-slate-500 mt-2">Recebimento: <b>${escapeHtml(v.formaPagamento||'Prazo')}</b>${v.vencimento?' • Vencimento: <b>'+fmtDate(v.vencimento)+'</b>':''}</p></div>
      </div>
      <div class="neo-card"><p class="neo-label">Pessoas</p><div class="flex flex-wrap gap-x-6 gap-y-1 text-[13px]"><span>Atendeu / entregou: <b>${escapeHtml(v.atendenteNome||v.criadoPorNome||'-')}</b>${v.codVendedorAntigo?' <span class="text-slate-400">(cód. antigo '+escapeHtml(v.codVendedorAntigo)+')</span>':''}</span><span>Abriu a notinha: <b>${escapeHtml(v.abertoPorNome||v.atendenteNome||v.criadoPorNome||'-')}</b></span>${v.numero?'<span class="text-slate-400 text-[12px]">Origem: '+(v.criadoPor==='migracao'?'sistema antigo':'ERP novo')+'</span>':''}</div></div>
      <div class="neo-card p-0 overflow-hidden"><div class="px-4 pt-3 pb-2 flex items-center justify-between"><p class="neo-label !mb-0">Itens (${(v.itens||[]).length})</p><b class="text-[#0a1e8a]">${fmtMoney(v.total||0)}</b></div><table class="neo-table"><thead><tr><th>#</th><th>Descrição</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead><tbody>${(v.itens||[]).map((it,idx)=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return `<tr><td>${idx+1}</td><td><b>${escapeHtml(p?.nome||it.descricao||'Item')}</b>${p?.sku?'<br><span class="text-[11px] text-slate-500">'+escapeHtml(p.sku)+'</span>':''}</td><td>${it.qtd}</td><td>${fmtMoney(it.preco||0)}</td><td><b>${fmtMoney(it.subtotal||0)}</b></td></tr>`;}).join('')||'<tr><td colspan="5" class="text-center text-slate-400 py-6">Sem itens registrados (veio assim do sistema antigo)</td></tr>'}</tbody></table>
      <div class="px-4 py-3 border-t text-[13px] flex justify-between"><span>Desconto: ${fmtMoney(v.desconto||0)}</span><b>Total: ${fmtMoney(v.total||0)}</b></div></div>
      ${fins.length?`<div class="neo-card p-0 overflow-hidden"><div class="px-4 pt-3 pb-2"><p class="neo-label !mb-0">Financeiro vinculado (${fins.length})</p></div><table class="neo-table"><thead><tr><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>${fins.slice(0,10).map(c=>`<tr class="cursor-pointer hover:bg-slate-50" ondblclick="historicoLancamento('cr','${c.id}')"><td>${escapeHtml(c.descricao||'')}</td><td><b>${fmtMoney(c.valor||0)}</b></td><td>${fmtDate(c.vencimento)}</td><td>${c.status||'aberto'}</td></tr>`).join('')}</tbody></table></div>`:''}
      <div class="neo-card"><p class="neo-label">Histórico de movimentações (${logs.length})</p>${logs.length?`<div class="space-y-1.5 max-h-[200px] overflow-auto">${logs.map(l=>`<div class="text-[12px] border-l-2 border-[#0a1e8a]/30 pl-2"><b>${escapeHtml(l.acao||'')}</b> — ${escapeHtml(l.detalhes||'')}<br><span class="text-slate-400">${fmtDateTime(l.dataHora||l.criadoEm)} • ${escapeHtml(l.usuarioNome||'-')}</span></div>`).join('')}</div>`:'<p class="text-[12px] text-slate-400">Nenhuma movimentação registrada nesta notinha no ERP novo (ela veio pronta do sistema antigo).</p>'}</div>
      <div class="flex flex-wrap gap-2 justify-end">
        ${(v.status||'')!=='faturado'?`<button onclick="closeModal(); faturarVenda('${v.id}')" class="neo-btn primary"><i class="ph ph-check-circle"></i>Faturar</button>`:''}
        <button onclick="imprimirNotinha('${v.id}')" class="neo-btn"><i class="ph ph-printer"></i>Imprimir notinha</button>
        <button onclick="closeModal()" class="neo-btn"><i class="ph ph-x"></i>Fechar</button>
      </div>
    </div>`;
    document.getElementById('modal-footer').innerHTML='';
    document.getElementById('modal-root').classList.remove('hidden');
  };
  // showVenda antigo (telas clássicas) agora abre o histórico em janela
  window.showVenda = function(id){ window.historicoVenda(id); };

  // ── FINANCEIRO com pesquisa, ordenação, filtro e histórico ──
  window.renderFinanceiro = function(){
    const sess=getSession(); if(!sess) return;
    const view=document.getElementById('view-financeiro')||ensureView('financeiro');
    const q=(document.getElementById('neo-search-fin')?.value||'').toLowerCase();
    const fStatus=document.getElementById('neo-fin-status')?.value||'todos';
    const fTipo=document.getElementById('neo-fin-tipo')?.value||'todos';
    const ordem=document.getElementById('neo-fin-ordem')?.value||'venc-asc';
    const lim=window.__finLim||150;
    const nomeCli=c=>{ const cli=db.clientes.find(x=>x.id===c.clienteId); return cli?cli.nome:(c.clienteNomeAntigo||(c.fornecedor||'')); };
    const receber=db.contasReceber.filter(c=>c.empresaId===sess.empresaId);
    const pagar=db.contasPagar.filter(c=>c.empresaId===sess.empresaId);
    const totalRec=receber.reduce((s,c)=>s+(c.valor||0),0), totalPag=pagar.reduce((s,c)=>s+(c.valor||0),0);
    let all=receber.map(c=>({ref:c,_tipo:'Receber'})).concat(pagar.map(c=>({ref:c,_tipo:'Pagar'})));
    if(fTipo!=='todos') all=all.filter(x=>x._tipo===fTipo);
    if(fStatus!=='todos') all=all.filter(x=>(x.ref.status||'aberto')===fStatus);
    if(q) all=all.filter(x=>{ const c=x.ref; return (c.descricao||'').toLowerCase().includes(q)||nomeCli(c).toLowerCase().includes(q)||String(c.legadoCodigo||'').toLowerCase().includes(q)||String(c.valor||'').includes(q); });
    const ordFns={'venc-asc':(a,b)=>String(a.ref.vencimento||'').localeCompare(String(b.ref.vencimento||'')),'venc-desc':(a,b)=>String(b.ref.vencimento||'').localeCompare(String(a.ref.vencimento||'')),'valor-desc':(a,b)=>(b.ref.valor||0)-(a.ref.valor||0),'valor-asc':(a,b)=>(a.ref.valor||0)-(b.ref.valor||0),'desc':(a,b)=>(a.ref.descricao||'').localeCompare(b.ref.descricao||'','pt-BR',{sensitivity:'base'})};
    all.sort(ordFns[ordem]||ordFns['venc-asc']);
    const mostrar=all.slice(0,lim);
    view.innerHTML=`<div class="neo-shell"><div class="neo-panel neo-float-in">
      <div class="neo-head"><div><h3>Financeiro</h3><p>Contas a receber, pagar e fluxo simples — <b>duplo clique</b> (ou o olho 👁) abre o histórico do lançamento</p></div><div class="neo-actions"><button onclick="openModal('contaReceber')" class="neo-btn primary"><i class="ph ph-arrow-circle-down"></i>Receber</button><button onclick="openModal('contaPagar')" class="neo-btn"><i class="ph ph-arrow-circle-up"></i>Pagar</button></div></div>
      <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-3"><div class="neo-card"><p class="neo-label">A receber</p><div class="neo-total !text-[24px]">${fmtMoney(totalRec)}</div></div><div class="neo-card"><p class="neo-label">A pagar</p><div class="neo-total !text-[24px] !text-red-600">${fmtMoney(totalPag)}</div></div><div class="neo-card"><p class="neo-label">Saldo previsto</p><div class="neo-total !text-[24px]">${fmtMoney(totalRec-totalPag)}</div></div></div>
      <div class="px-4 pb-3 flex flex-wrap items-center gap-2 border-b">
        <input id="neo-search-fin" value="${escapeHtml(document.getElementById('neo-search-fin')?.value||'')}" oninput="window.__finLim=150; renderFinanceiro()" class="neo-input flex-1 min-w-[220px]" placeholder="Pesquisar descrição, cliente, fornecedor, código...">
        <select id="neo-fin-tipo" onchange="window.__finLim=150; renderFinanceiro()" class="neo-select !h-9"><option value="todos" ${fTipo==='todos'?'selected':''}>Receber + Pagar</option><option value="Receber" ${fTipo==='Receber'?'selected':''}>Só a receber</option><option value="Pagar" ${fTipo==='Pagar'?'selected':''}>Só a pagar</option></select>
        <select id="neo-fin-status" onchange="window.__finLim=150; renderFinanceiro()" class="neo-select !h-9"><option value="todos" ${fStatus==='todos'?'selected':''}>Status: todos</option><option value="aberto" ${fStatus==='aberto'?'selected':''}>Em aberto</option><option value="pago" ${fStatus==='pago'?'selected':''}>Pagos</option></select>
        <select id="neo-fin-ordem" onchange="renderFinanceiro()" class="neo-select !h-9 font-bold text-[#0a1e8a]"><option value="venc-asc" ${ordem==='venc-asc'?'selected':''}>⇧ Vencimento (perto 1º)</option><option value="venc-desc" ${ordem==='venc-desc'?'selected':''}>⇩ Vencimento (longe 1º)</option><option value="valor-desc" ${ordem==='valor-desc'?'selected':''}>⇩ Valor (maior 1º)</option><option value="valor-asc" ${ordem==='valor-asc'?'selected':''}>⇧ Valor (menor 1º)</option><option value="desc" ${ordem==='desc'?'selected':''}>Descrição A → Z</option></select>
        <span class="text-[12px] text-slate-500"><b class="text-[#0a1e8a]">${all.length}</b> lançamentos</span>
      </div>
      <div class="overflow-auto max-h-[calc(100vh-380px)]"><table class="neo-table"><thead><tr><th>Tipo</th><th>Descrição</th><th>Cliente/Fornecedor</th><th>Valor</th><th>Vencimento</th><th>Status</th><th></th></tr></thead><tbody>${mostrar.map(x=>{const c=x.ref; const cli=db.clientes.find(z=>z.id===c.clienteId); const nome=cli?cli.nome:(c.clienteNomeAntigo||c.fornecedor||''); return `<tr class="cursor-pointer" ondblclick="historicoLancamento('${x._tipo==='Receber'?'cr':'cp'}','${c.id}')"><td>${x._tipo}</td><td>${escapeHtml(c.descricao||'')} ${c.legadoCodigo?'<span class="text-[10px] text-slate-400">#'+escapeHtml(c.legadoCodigo)+'</span>':''}</td><td>${escapeHtml(nome)}${!cli&&c.clienteNomeAntigo?' <span class="text-[10px] text-slate-400">(sist. antigo)</span>':''}</td><td><b class="${x._tipo==='Pagar'?'text-red-600':''}">${fmtMoney(c.valor||0)}</b></td><td>${fmtDate(c.vencimento)}</td><td>${statusPillFin(c.status)}</td><td><button onclick="historicoLancamento('${x._tipo==='Receber'?'cr':'cp'}','${c.id}')" class="neo-btn !px-2" title="Abrir histórico"><i class="ph ph-eye"></i></button></td></tr>`;}).join('')||'<tr><td colspan="7" class="text-center text-slate-500 py-12">Nenhum lançamento encontrado</td></tr>'}</tbody></table></div>
      ${all.length>mostrar.length?`<div class="p-3 border-t text-center"><button onclick="window.__finLim=${lim+300}; renderFinanceiro()" class="neo-btn"><i class="ph ph-plus"></i>Mostrar mais ${Math.min(300,all.length-mostrar.length)} de ${all.length-mostrar.length} restantes</button></div>`:''}
    </div></div>`;
    const inp=document.getElementById('neo-search-fin'); if(inp && document.activeElement?.id==='neo-search-fin'){ inp.focus(); inp.setSelectionRange(inp.value.length,inp.value.length); }
  };
  window.statusPillFin = function(st){ const t=(st||'aberto'); return `<span class="neo-status ${t==='pago'?'ok':'wait'}">${escapeHtml(t)}</span>`; };

  // Histórico de um lançamento financeiro (conta a receber/pagar)
  window.historicoLancamento = function(tipo,id){
    const arr=tipo==='cp'?db.contasPagar:db.contasReceber;
    const c=arr.find(x=>x.id===id); if(!c){ toast('Lançamento não encontrado','error'); return; }
    const cli=db.clientes.find(x=>x.id===c.clienteId);
    const nome=cli?cli.nome:(c.clienteNomeAntigo||c.fornecedor||'-');
    const logsL=(db.logs||[]).filter(l=>l.entidadeId===c.id).slice(0,30);
    const box=document.getElementById('modal-box'); if(box) box.className='w-full max-w-[640px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
    document.getElementById('modal-title').innerText='Histórico do lançamento';
    document.getElementById('modal-body').innerHTML=`<div class="space-y-3">
      <div class="neo-card"><p class="neo-label">${tipo==='cp'?'Conta a pagar':'Conta a receber'}</p><b class="text-[15px]">${escapeHtml(c.descricao||'')}</b><div class="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[13px]"><span>Valor: <b>${fmtMoney(c.valor||0)}</b></span><span>Vencimento: <b>${fmtDate(c.vencimento)}</b></span><span>Status: <b>${c.status||'aberto'}</b></span>${c.pagamentoData?'<span>Pago em: <b>'+fmtDate(c.pagamentoData)+'</b></span>':''}</div><p class="text-[12px] text-slate-500 mt-2">${tipo==='cp'?'Fornecedor':'Cliente'}: <b>${escapeHtml(nome)}</b>${!cli&&c.clienteNomeAntigo?' (cadastro do sistema antigo)':''}${c.legadoCodigo?' • cód. antigo '+escapeHtml(c.legadoCodigo):''}</p></div>
      ${c.vendaId?`<button onclick="historicoVenda('${c.vendaId}')" class="neo-btn"><i class="ph ph-shopping-cart"></i>Abrir a venda de origem</button>`:''}
      <div class="neo-card"><p class="neo-label">Histórico de movimentações (${logsL.length})</p>${logsL.length?`<div class="space-y-1.5 max-h-[220px] overflow-auto">${logsL.map(l=>`<div class="text-[12px] border-l-2 border-[#0a1e8a]/30 pl-2"><b>${escapeHtml(l.acao||'')}</b> — ${escapeHtml(l.detalhes||'')}<br><span class="text-slate-400">${fmtDateTime(l.dataHora||l.criadoEm)} • ${escapeHtml(l.usuarioNome||'-')}</span></div>`).join('')}</div>`:'<p class="text-[12px] text-slate-400">Nenhuma movimentação registrada (veio pronto do sistema antigo).</p>'}</div>
      <div class="flex justify-end"><button onclick="closeModal()" class="neo-btn"><i class="ph ph-x"></i>Fechar</button></div>
    </div>`;
    document.getElementById('modal-footer').innerHTML='';
    document.getElementById('modal-root').classList.remove('hidden');
  };

  // ── MÓDULOS MIGRADOS (menu "Migrados"): ordenar clicando na coluna + histórico no duplo clique ──
  window.__modUi = window.__modUi || {};
  window.__modOrdem = window.__modOrdem || {};
  function cmpValMod(a,b){
    const sa=String(a==null?'':a).trim(), sb=String(b==null?'':b).trim();
    const na=parseFloat(sa.replace(',','.')), nb=parseFloat(sb.replace(',','.'));
    const aNum=sa!==''&&!isNaN(na)&&/^-?[\d.,]+$/.test(sa), bNum=sb!==''&&!isNaN(nb)&&/^-?[\d.,]+$/.test(sb);
    if(aNum&&bNum) return na-nb;
    if(/\d{4}-\d{2}-\d{2}/.test(sa)&&/\d{4}-\d{2}-\d{2}/.test(sb)){ const da=Date.parse(sa),dbb=Date.parse(sb); if(!isNaN(da)&&!isNaN(dbb)) return da-dbb; }
    return sa.localeCompare(sb,'pt-BR',{sensitivity:'base'});
  }
  window.ordenarModuloDinamico = function(nomeTabela,col){
    const s=window.__modOrdem[nomeTabela]||{};
    if(s.col===col) s.dir=(s.dir==='asc'?'desc':'asc'); else { s.col=col; s.dir='asc'; }
    window.__modOrdem[nomeTabela]=s;
    renderModuloDinamico(nomeTabela);
  };
  window.renderModuloDinamico = function(nomeTabela){
    const modulo = db.modulosDinamicos[nomeTabela];
    if(!modulo){ toast('Módulo não encontrado','error'); return; }
    const ui=window.__modUi[nomeTabela]||(window.__modUi[nomeTabela]={busca:'',coluna:''});
    const el = ensureView('mod_'+nomeTabela.toLowerCase().replace(/[^a-z0-9]/g,'_'));
    const dados = modulo.dados || [];
    const colunas = modulo.colunas || (dados.length > 0 ? Object.keys(dados[0]) : []);
    const label = modulo.label || formatarNomeTabela(nomeTabela);
    const maxColunas = Math.min(colunas.length, 8);
    const colunasVisiveis = colunas.slice(0, maxColunas);
    const ord=window.__modOrdem[nomeTabela]||{};
    const busca=(ui.busca||'').toLowerCase();
    let filtrados=dados.filter(row=>{
      if(!busca) return true;
      if(ui.coluna) return String(row[ui.coluna]||'').toLowerCase().includes(busca);
      return colunas.some(c=>String(row[c]||'').toLowerCase().includes(busca));
    });
    if(ord.col) filtrados=filtrados.slice().sort((a,b)=>(ord.dir==='desc'?-1:1)*cmpValMod(a[ord.col],b[ord.col]));
    const seta=c=>ord.col===c?(ord.dir==='asc'?' ▲':' ▼'):'';
    el.innerHTML = `
      <div class="space-y-4">
        <div class="rounded-[22px] bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 shadow-xl overflow-hidden relative">
          <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-3xl"></div>
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p class="text-[11px] font-bold tracking-[0.18em] uppercase text-white/60">Módulo migrado</p>
              <h2 class="text-[24px] font-extrabold tracking-tight mt-2">${escapeHtml(label)}</h2>
              <p class="text-white/80 text-[13.5px] mt-2">Dados da tabela <code class="bg-white/20 px-2 py-0.5 rounded">${escapeHtml(nomeTabela)}</code> do sistema antigo. <b>Clique no título da coluna para ordenar</b> • <b>duplo clique</b> (ou o olho) abre todos os campos.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button onclick="exportarModuloDinamico('${nomeTabela}')" class="h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-[12.5px] flex items-center gap-2"><i class="ph ph-export"></i> Exportar</button>
              <button onclick="confirmarExcluirModulo('${nomeTabela}')" class="h-10 px-4 rounded-xl bg-red-500/20 border border-red-400/30 text-white font-semibold text-[12.5px] flex items-center gap-2"><i class="ph ph-trash"></i> Excluir módulo</button>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="rounded-xl bg-white border shadow-sm p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Total de registros</p><p class="text-[24px] font-extrabold text-purple-600 mt-1">${dados.length}</p></div>
          <div class="rounded-xl bg-white border shadow-sm p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Campos</p><p class="text-[24px] font-extrabold text-blue-600 mt-1">${colunas.length}</p></div>
          <div class="rounded-xl bg-white border shadow-sm p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Origem</p><p class="text-[14px] font-bold text-slate-700 mt-2">${escapeHtml(modulo.origem || 'Firebird')}</p></div>
          <div class="rounded-xl bg-white border shadow-sm p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Importado em</p><p class="text-[14px] font-bold text-slate-700 mt-2">${modulo.importadoEm ? fmtDateTime(modulo.importadoEm) : '-'}</p></div>
        </div>
        <div class="rounded-[18px] bg-white border shadow-sm p-4">
          <div class="flex flex-wrap gap-3 items-center">
            <div class="flex-1 min-w-[250px]"><input id="search-mod-${nomeTabela}" type="text" value="${escapeHtml(ui.busca||'')}" placeholder="Buscar em todos os campos..." class="w-full h-10 px-4 rounded-xl border border-slate-300 text-[13px]" oninput="window.__modUi['${nomeTabela}'].busca=this.value; filtrarModuloDinamico('${nomeTabela}')"></div>
            <select id="coluna-mod-${nomeTabela}" class="h-10 px-3 rounded-xl border border-slate-300 text-[13px]" onchange="window.__modUi['${nomeTabela}'].coluna=this.value; filtrarModuloDinamico('${nomeTabela}')"><option value="">Todas as colunas</option>${colunas.map(c=>`<option value="${escapeHtml(c)}" ${ui.coluna===c?'selected':''}>${escapeHtml(c)}</option>`).join('')}</select>
            <span class="text-[12px] text-slate-500" id="mod-count-${nomeTabela}">${filtrados.length} de ${dados.length} registros</span>
          </div>
        </div>
        <div class="rounded-[18px] bg-white border shadow-sm overflow-hidden">
          <div class="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
            <table class="w-full text-[12px]">
              <thead class="bg-slate-100 border-b sticky top-0"><tr><th class="px-4 py-3 text-left font-bold text-slate-700">#</th>${colunasVisiveis.map(c=>`<th onclick="ordenarModuloDinamico('${nomeTabela}','${c.replace(/'/g,"\\'")}')" class="px-4 py-3 text-left font-bold text-slate-700 cursor-pointer select-none hover:text-purple-700" title="Clique para ordenar">${escapeHtml(c)}${seta(c)}</th>`).join('')}${colunas.length > maxColunas ? `<th class="px-4 py-3 text-left font-bold text-slate-400">+${colunas.length-maxColunas}</th>` : ''}<th class="px-4 py-3 text-center font-bold text-slate-700">Ações</th></tr></thead>
              <tbody id="mod-tbody-${nomeTabela}" class="divide-y divide-slate-100">
                ${filtrados.slice(0,120).map((row,idx)=>`<tr class="hover:bg-slate-50 transition cursor-pointer" ondblclick="visualizarRegistroDinamico('${nomeTabela}',${dados.indexOf(row)})"><td class="px-4 py-3 text-slate-500">${idx+1}</td>${colunasVisiveis.map(c=>`<td class="px-4 py-3 text-slate-700">${escapeHtml(String(row[c]==null?'':row[c]).substring(0,60))}</td>`).join('')}${colunas.length > maxColunas ? '<td class="px-4 py-3 text-slate-400">...</td>' : ''}<td class="px-4 py-3 text-center"><button onclick="visualizarRegistroDinamico('${nomeTabela}',${dados.indexOf(row)})" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Ver todos os campos"><i class="ph ph-eye"></i></button></td></tr>`).join('')||'<tr><td colspan="20" class="text-center text-slate-400 py-10">Nada encontrado com este filtro</td></tr>'}
              </tbody>
            </table>
          </div>
          ${filtrados.length > 120 ? `<div class="p-4 border-t bg-slate-50 text-center text-[12px] text-slate-500">Mostrando 120 de ${filtrados.length} registros — use a busca para achar o que precisa.</div>` : ''}
        </div>
      </div>`;
  };
  window.filtrarModuloDinamico = function(nomeTabela){
    const tinhaFoco = document.activeElement && document.activeElement.id==='search-mod-'+nomeTabela;
    const pos = tinhaFoco ? document.activeElement.selectionStart : 0;
    renderModuloDinamico(nomeTabela);
    if(tinhaFoco){ const inp=document.getElementById('search-mod-'+nomeTabela); if(inp){ inp.focus(); try{ inp.setSelectionRange(pos,pos); }catch(e){} } }
  };

  // Se alguma tela falhar ao abrir, mostra o motivo na tela (em vez de "clicar e nada acontecer")
  const navAnterior42 = window.navigateTo;
  if(navAnterior42 && !window.__navComErroVisivel){
    window.__navComErroVisivel = true;
    window.navigateTo = function(view){
      try{ return navAnterior42(view); }
      catch(e){
        try{ console.error('navigateTo', view, e); }catch(_c){}
        if(typeof toast==='function') toast('Erro ao abrir "'+view+'": '+((e&&e.message)||e),'error');
      }
    };
  }
})();

// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.3 — "Explorar Migrados": as 81 tabelas do sistema antigo organizadas
// por categoria de negócio, com busca. Remove a sensação de "tabela solta".
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  function migradosPorCategoria(){
    const grupos={};
    Object.entries(db.modulosDinamicos||{}).forEach(([nome,m])=>{
      if(!m || !Array.isArray(m.dados) || !m.dados.length) return;
      const cat=categoriaModulo(nome);
      (grupos[cat.id]=grupos[cat.id]||{cat, itens:[], registros:0});
      const g=grupos[cat.id];
      g.itens.push({nome, label:m.label||formatarNomeTabela(nome), count:m.dados.length, modulo:m, cat});
      g.registros+=m.dados.length;
    });
    const ord=Object.values(grupos).sort((a,b)=>a.cat.ordem-b.cat.ordem);
    ord.forEach(g=>g.itens.sort((a,b)=>a.label.localeCompare(b.label,'pt-BR',{sensitivity:'base'})));
    return ord;
  }
  function viewMigrados(){ const v=document.getElementById('view-migrados')||ensureView('migrados');
    if(v){ v.classList.remove('hidden'); v.style.display='block'; v.style.visibility='visible'; } return v; }

  window.renderMigrados = function(){
    const sess=getSession(); if(!sess) return;
    const v=viewMigrados();
    const ord=migradosPorCategoria();
    const totalTabelas=ord.reduce((s,g)=>s+g.itens.length,0);
    const totalRegistros=ord.reduce((s,g)=>s+g.registros,0);
    const busca=(document.getElementById('mig-busca')?.value||'').toLowerCase();
    const catSel=window.__migCat||null;

    // Lista de módulos (categoria escolhida ou resultado da busca geral)
    function linhaModulo(it){
      return `<button onclick="navigateTo('mod_${it.nome.toLowerCase().replace(/[^a-z0-9]/g,'_')}')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b text-left transition"><i class="ph ${it.modulo.icone||'ph-table'} text-[18px] text-purple-600"></i><span class="flex-1"><b class="text-[13px]">${escapeHtml(it.label)}</b><br><span class="text-[11px] text-slate-400">${escapeHtml(it.nome)} • ${(it.modulo.colunas||[]).length} campos • ${it.cat.rotulo}</span></span><span class="text-[11px] bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-full">${it.count.toLocaleString('pt-BR')}</span></button>`;
    }

    let corpoLista='';
    if(busca){
      const achados=[];
      ord.forEach(g=>g.itens.forEach(it=>{
        const cols=(it.modulo.colunas||[]).join(' ').toLowerCase();
        if(it.nome.toLowerCase().includes(busca)||it.label.toLowerCase().includes(busca)||cols.includes(busca)) achados.push(it);
      }));
      corpoLista=`<div class="rounded-[18px] bg-white border shadow-sm overflow-hidden"><div class="p-4 border-b bg-slate-50 flex items-center justify-between"><h3 class="font-bold text-[14px]">Resultados para "${escapeHtml(busca)}"</h3><p class="text-[12px] text-slate-500">${achados.length} tabelas</p></div>${achados.map(linhaModulo).join('')||'<p class="text-center text-slate-400 py-10 text-[13px]">Nenhuma tabela com esse nome ou campo.<br>Tente outra palavra (ex.: visita, ncm, bairro, cheque...)</p>'}</div>`;
    } else if(catSel){
      const g=ord.find(x=>x.cat.id===catSel);
      corpoLista=g?`<div class="rounded-[18px] bg-white border shadow-sm overflow-hidden"><div class="p-4 border-b bg-slate-50 flex items-center gap-3"><button onclick="window.__migCat=null; document.getElementById('mig-busca').value=''; renderMigrados()" class="neo-btn !h-9"><i class="ph ph-arrow-left"></i>Todas as categorias</button><h3 class="font-bold text-[15px] flex items-center gap-2"><i class="ph ${g.cat.icone} text-purple-600"></i>${g.cat.rotulo}</h3><p class="text-[12px] text-slate-500 ml-auto">${g.itens.length} tabelas • ${g.registros.toLocaleString('pt-BR')} registros</p></div>${g.itens.map(linhaModulo).join('')}</div>`:'';
    } else {
      corpoLista=`<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${ord.map(g=>`
        <button onclick="window.__migCat='${g.cat.id}'; renderMigrados()" class="rounded-[20px] bg-white border shadow-sm p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition group">
          <div class="w-11 h-11 rounded-2xl bg-purple-600/10 text-purple-700 grid place-items-center text-[22px]"><i class="ph ${g.cat.icone}"></i></div>
          <h3 class="font-extrabold text-[15px] mt-3">${g.cat.rotulo}</h3>
          <p class="text-[12px] text-slate-500 mt-1">${g.itens.length} tabela${g.itens.length>1?'s':''} • ${g.registros.toLocaleString('pt-BR')} registros</p>
          <p class="text-[11px] text-slate-400 mt-2 leading-snug">${g.itens.slice(0,4).map(i=>i.label).join(', ')}${g.itens.length>4?'…':''}</p>
          <span class="inline-flex items-center gap-1 text-[12px] font-bold text-purple-700 mt-3 group-hover:gap-2 transition-all">Explorar <i class="ph ph-arrow-right"></i></span>
        </button>`).join('')}</div>`;
    }

    v.innerHTML=`<div class="space-y-4">
      <div class="rounded-[22px] bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 shadow-xl overflow-hidden relative">
        <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-3xl"></div>
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p class="text-[11px] font-bold tracking-[0.18em] uppercase text-white/60">Sistema antigo (SisPrinter)</p>
            <h2 class="text-[24px] font-extrabold tracking-tight mt-2">Explorar Migrados</h2>
            <p class="text-white/80 text-[13.5px] mt-2">${totalTabelas} tabelas com ${totalRegistros.toLocaleString('pt-BR')} registros trazidos do sistema antigo, organizadas por assunto.</p>
          </div>
          <div class="relative min-w-[280px]"><i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/70"></i><input id="mig-busca" value="${escapeHtml(document.getElementById('mig-busca')?.value||'')}" oninput="window.__migCat=null; renderMigrados()" placeholder="Procurar tabela ou campo... (ex.: visita, ncm, bairro)" class="w-full h-11 pl-9 pr-3 rounded-xl bg-white/15 border border-white/25 text-white placeholder-white/60 text-[13px] outline-none focus:bg-white/25"></div>
        </div>
      </div>
      ${corpoLista}
      <p class="text-[11px] text-slate-400 text-center">Dentro de cada tabela: busca em todos os campos, ordenação clicando no título da coluna e histórico completo no duplo clique.</p>
    </div>`;
    const inp=document.getElementById('mig-busca');
    if(inp && document.activeElement===inp){ inp.focus(); try{ inp.setSelectionRange(inp.value.length,inp.value.length); }catch(e){} }
  };

  // Rota "migrados" no navegador principal
  const navAnterior43 = window.navigateTo;
  if(navAnterior43 && !window.__navComMigrados){
    window.__navComMigrados = true;
    window.navigateTo = function(view){
      if(view==='migrados'){
        try{
          document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden'));
          document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.remove('bg-white/[0.12]','text-white','border','border-white/10'); b.classList.add('text-white/60')});
          window.__migCat=null;
          viewMigrados();
          if(typeof setPageHeader==='function') setPageHeader('Explorar Migrados','Tabelas do sistema antigo organizadas por assunto');
          renderMigrados();
          window.scrollTo({top:0,behavior:'smooth'});
        }catch(e){ if(typeof toast==='function') toast('Erro ao abrir Migrados: '+((e&&e.message)||e),'error'); }
        return;
      }
      return navAnterior43(view);
    };
  }

  // Chip de categoria dentro da tela de cada módulo migrado
  const renderModAnterior = window.renderModuloDinamico;
  window.renderModuloDinamico = function(nomeTabela){
    renderModAnterior(nomeTabela);
    try{
      const cat=categoriaModulo(nomeTabela);
      const el=document.getElementById('view-mod_'+nomeTabela.toLowerCase().replace(/[^a-z0-9]/g,'_'));
      const alvo=el && el.querySelector('.text-white\\/80');
      if(alvo && !el.querySelector('.mig-chip-cat')){
        alvo.insertAdjacentHTML('beforeend', ` <button class="mig-chip-cat" onclick="window.__migCat='${cat.id}'; navigateTo('migrados'); window.__migCat='${cat.id}'; renderMigrados()" style="background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:2px 10px;font-size:11px;font-weight:700;margin-left:6px"><i class="ph ${cat.icone}"></i> ${cat.rotulo} • ver categoria</button>`);
      }
    }catch(e){}
  };
})();
