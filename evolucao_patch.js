// EVOLUÇÃO PATCH v3.2 - Implementa itens acumulados TODO
// 1. CNPJ busca automática cliente
// 2. Empresas para PDF notinha (cadastro separado)
// 3. Chamados branco/verde + filtros avançados
// 4. Vendas lista detalhada + Orçamentos PDF
// 5. Contratos franquia exemplo 3000 copias R$120

// Helper CNPJ busca
async function buscarCNPJAutomatico(cnpjRaw){
  const cnpj = onlyDigits(cnpjRaw);
  if(cnpj.length!==14){ toast('CNPJ deve ter 14 dígitos','error'); return; }
  const btn = document.getElementById('btn-buscar-cnpj');
  if(btn){ btn.innerHTML='<i class="ph ph-spinner animate-spin"></i> Buscando...'; btn.disabled=true; }
  try{
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if(!resp.ok) throw new Error('CNPJ não encontrado na BrasilAPI');
    const data = await resp.json();
    // Preenche campos do modal cliente
    const setVal = (id,val)=>{ const el=document.getElementById(id); if(el) el.value=val||''; };
    setVal('f-cli-nome', data.razao_social || data.nome_fantasia || '');
    setVal('f-cli-end', (data.logradouro||'') + (data.numero?' , '+data.numero:'') + (data.complemento?' - '+data.complemento:''));
    // tentar separar cidade, estado, cep, bairro
    document.getElementById('f-cli-cidade').value = data.municipio || '';
    document.getElementById('f-cli-estado').value = data.uf || '';
    document.getElementById('f-cli-cep').value = data.cep || '';
    // telefone
    if(data.ddd_telefone_1) setVal('f-cli-tel', `(${data.ddd_telefone_1.slice(0,2)}) ${data.ddd_telefone_1.slice(2)}`);
    if(data.email) setVal('f-cli-email', data.email);
    // Salva dados extras em campos ocultos ou no próprio objeto
    window._ultimoCNPJData = data;
    toast(`CNPJ encontrado: ${data.razao_social} - ${data.municipio}/${data.uf}`,'success');
    logAction('cliente','buscar_cnpj',cnpj,`Busca CNPJ ${cnpj} retornou ${data.razao_social}`);
  }catch(e){
    console.error(e);
    toast('Erro ao buscar CNPJ: '+e.message+'. Preencha manual.','error');
  }finally{
    if(btn){ btn.innerHTML='<i class="ph ph-magnifying-glass"></i> Buscar CNPJ'; btn.disabled=false; }
  }
}

// Sobrescreve renderModalCliente para incluir busca CNPJ e código
(function(){
  const origRenderModalCliente = window.renderModalCliente;
  window.renderModalCliente = function(id){
    const sess=getSession(); const isEdit=!!id;
    const c=isEdit?db.clientes.find(x=>x.id===id && x.empresaId===sess.empresaId):{nome:'',documento:'',tipo:'PJ',email:'',telefone:'',endereco:'',cidade:'',estado:'SP',cep:'',status:'ativo',codigo:''};
    const nextCodigo = Math.max(0,...db.clientes.filter(x=>x.empresaId===sess.empresaId).map(x=>x.codigo||0))+1;
    document.getElementById('modal-title').innerText=isEdit?`Editar cliente #${c.codigo||''}`:`Novo cliente #${nextCodigo}`;
    document.getElementById('modal-body').innerHTML=`
      <div class="space-y-4">
        <div class="rounded-xl bg-[#e8eaf8] border border-[#c9ceef] p-3 flex gap-3">
          <div class="flex-1">
            <label class="text-[11px] font-bold uppercase text-[#0a1e8a]">CNPJ para busca automática *</label>
            <div class="mt-1 flex gap-2">
              <input id="f-cli-doc" value="${c.documento||''}" placeholder="00.000.000/0000-00" class="flex-1 h-11 px-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white font-mono text-[13px]">
              <button id="btn-buscar-cnpj" onclick="buscarCNPJAutomatico(document.getElementById('f-cli-doc').value)" class="h-11 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px] flex items-center gap-1.5"><i class="ph ph-magnifying-glass"></i> Buscar CNPJ</button>
            </div>
            <p class="text-[11px] text-[#0a1e8a]/70 mt-1">Digite CNPJ e clique em Buscar CNPJ para preencher automaticamente razão social, endereço, cidade, UF, CEP, telefone e email via BrasilAPI.</p>
          </div>
          <div class="w-[90px] shrink-0">
            <label class="text-[11px] font-bold uppercase text-slate-500">Código</label>
            <input value="${c.codigo||nextCodigo}" disabled class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-100 font-mono font-bold text-[14px] text-center">
            <p class="text-[10px] text-slate-400 mt-1 text-center">Sequencial</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Razão social / Nome *</label><input id="f-cli-nome" value="${c.nome||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Tipo</label><select id="f-cli-tipo" class="mt-1 w-full h-11 px-3 rounded-xl border"><option ${c.tipo==='PJ'?'selected':''}>PJ</option><option ${c.tipo==='PF'?'selected':''}>PF</option></select></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Nome Fantasia</label><input id="f-cli-fantasia" value="${c.fantasia||''}" placeholder="Fantasia" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">E-mail</label><input id="f-cli-email" value="${c.email||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Telefone / Celular</label><input id="f-cli-tel" value="${c.telefone||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div class="md:col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Endereço completo</label><input id="f-cli-end" value="${c.endereco||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Cidade</label><input id="f-cli-cidade" value="${c.cidade||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div class="grid grid-cols-3 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Estado</label><input id="f-cli-estado" value="${c.estado||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">CEP</label><input id="f-cli-cep" value="${c.cep||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="f-cli-status" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="ativo" ${c.status==='ativo'?'selected':''}>Ativo</option><option value="inativo" ${c.status==='inativo'?'selected':''}>Inativo</option><option value="inadimplente" ${c.status==='inadimplente'?'selected':''}>Inadimplente</option></select></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Contato</label><input id="f-cli-contato" value="${c.contato||''}" placeholder="Pessoa contato" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
        </div>
        <div class="rounded-xl bg-[#e8eaf8] border border-[#c9ceef] p-3 text-[11px] text-[#0a1e8a]"><i class="ph ph-info"></i> Código sequencial será <b>#${c.codigo||nextCodigo}</b>. Criado por <b>${sess.usuarioNome}</b> será auditado. Busca CNPJ usa BrasilAPI.</div>
      </div>`;
    document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveCliente()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">${isEdit?'Salvar':'Criar cliente'}</button>`;
  };
})();


// Patch para impressão notinha usar empresa selecionada da tela Empresas
(function(){
  const origImprimir = window.imprimirNotinha;
  window.imprimirNotinha = function(vendaId){
    // se tem empresa notinha selecionada, usa ela no cabeçalho
    const empNotinhaRaw = localStorage.getItem('digicopy_empresa_notinha');
    if(empNotinhaRaw){
      try{
        const empSel = JSON.parse(empNotinhaRaw);
        // injeta temporariamente no db.config para PDF usar?
        const prevConfig = JSON.parse(JSON.stringify(db.config.empresa));
        // sobrescreve temporariamente
        db.config.empresa.nome = empSel.nome;
        db.config.empresa.cnpj = empSel.cnpj;
        db.config.empresa.fone = empSel.telefone||prevConfig.fone;
        // guarda prev para restaurar depois
        window._prevConfigEmpresa = prevConfig;
      }catch{}
    }
    if(origImprimir) origImprimir(vendaId);
    // restaura após 2s
    setTimeout(()=>{
      if(window._prevConfigEmpresa){
        db.config.empresa = window._prevConfigEmpresa;
        window._prevConfigEmpresa=null;
      }
    },2000);
  };
})();

// CHAMADOS - branco não resolvido verde resolvido + filtros avançados
(function(){
  const origRenderOs = window.renderOs;
  window.renderOs = function(){
    // chama original que já faz kanban, mas vamos sobrescrever lista para branco/verde
    if(origRenderOs) origRenderOs();
    // após original, pinta linhas conforme status
    const sess=getSession(); if(!sess) return;
    const tbody=document.getElementById('tbody-os');
    if(!tbody) return;
    const rows=tbody.querySelectorAll('tr');
    rows.forEach(row=>{
      const statusCell=row.querySelector('td:nth-child(5) span');
      if(!statusCell) return;
      const txt=statusCell.textContent.toLowerCase();
      if(txt.includes('aberto')||txt.includes('em atendimento')||txt.includes('aguardando')){
        row.classList.add('bg-white');
        row.classList.remove('bg-emerald-50');
      }else if(txt.includes('concluido')){
        row.classList.add('bg-emerald-50');
        row.classList.add('border-l-4');
        row.classList.add('border-l-emerald-500');
      }
    });
  };
  // Busca avançada chamados: nome fantasia, celular, cidade, endereço, código cliente
  const origHandleSearch = window.handleGlobalSearch;
  // vamos sobrescrever renderOs para filtrar mais campos
  const origRenderOs2 = window.renderOs;
  // Já temos renderOs acima, mas vamos adicionar filtro extra na busca
  window.searchChamadosAvancada = function(q){
    const sess=getSession(); if(!sess) return;
    const low=q.toLowerCase();
    return db.os.filter(o=>{
      if(o.empresaId!==sess.empresaId) return false;
      const cli=db.clientes.find(c=>c.id===o.clienteId);
      if(!cli) return false;
      return (
        (cli.nome&&cli.nome.toLowerCase().includes(low)) ||
        (cli.fantasia&&cli.fantasia.toLowerCase().includes(low)) ||
        (cli.telefone&&cli.telefone.toLowerCase().includes(low)) ||
        (cli.cidade&&cli.cidade.toLowerCase().includes(low)) ||
        (cli.endereco&&cli.endereco.toLowerCase().includes(low)) ||
        (cli.codigo&&String(cli.codigo).includes(low)) ||
        (cli.documento&&cli.documento.toLowerCase().includes(low)) ||
        (o.numero&&o.numero.toLowerCase().includes(low)) ||
        (o.descricao&&o.descricao.toLowerCase().includes(low))
      );
    });
  };
  // Override renderOs to use busca avançada quando digitado em search-os
  window.renderOs = function(){
    const sess=getSession(); if(!sess) return;
    const searchInput=document.getElementById('search-os');
    const search=searchInput?searchInput.value.toLowerCase():'';
    const status=document.getElementById('filter-os-status')?.value||'';
    let list;
    if(search && search.length>=2){
      list=window.searchChamadosAvancada(search);
    }else{
      list=db.os.filter(o=>o.empresaId===sess.empresaId);
    }
    list=list.filter(o=>!status||o.status===status).sort((a,b)=>new Date(b.dataAbertura)-new Date(a.dataAbertura));
    // renderiza igual original mas com cores
    const osKanbanEl=document.getElementById('os-kanban');
    const osListEl=document.getElementById('os-list');
    const btn=document.getElementById('btn-os-kanban');
    if(osKanbanEl) osKanbanEl.classList.toggle('hidden', window.osViewMode!=='kanban');
    if(osListEl) osListEl.classList.toggle('hidden', window.osViewMode!=='list');
    if(btn) btn.innerText=window.osViewMode==='kanban'?'Lista':'Kanban';

    if(window.osViewMode==='kanban'){
      const cols=[{id:'aberto',label:'Aberto (Branco)',color:'border-slate-200 bg-white'},{id:'em_atendimento',label:'Em atendimento (Branco)',color:'border-blue-200 bg-white'},{id:'aguardando_peca',label:'Aguardando peça (Branco)',color:'border-amber-200 bg-white'},{id:'concluido',label:'Concluído (Verde)',color:'border-emerald-300 bg-emerald-50'}];
      document.getElementById('os-kanban').innerHTML=cols.map(col=>{const items=list.filter(o=>o.status===col.id); return `<div class="rounded-[16px] border ${col.color} p-3 flex flex-col"><div class="flex items-center justify-between mb-3"><h4 class="font-bold text-[12px] uppercase">${col.label}</h4><span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border">${items.length}</span></div><div class="space-y-3 flex-1 overflow-auto" style="min-height:400px">${items.map(o=>{const cli=db.clientes.find(c=>c.id===o.clienteId); const eq=db.equipamentos.find(e=>e.id===o.equipamentoId); return `<div class="rounded-xl ${col.id==='concluido'?'bg-emerald-100 border-emerald-300':'bg-white border-slate-200'} border p-3 shadow-sm hover:shadow-md cursor-pointer" onclick="openModal('os','${o.id}')"><div class="flex justify-between"><span class="font-mono text-[11px] font-bold text-slate-500">${o.numero}</span><span class="text-[10px] px-2 py-0.5 rounded-full bg-[#e8eaf8] text-[#0a1e8a] font-bold uppercase">${o.prioridade}</span></div><p class="font-semibold text-[13px] mt-2">${cli?.nome||''} ${cli?.fantasia?`(${cli.fantasia})`:''}</p><p class="text-[11px] text-slate-600">Cód: ${cli?.codigo||'-'} • ${cli?.telefone||''} • ${cli?.cidade||''}</p><p class="text-[11px] text-slate-600 mt-1">${eq?.modelo||'Sem equipamento'} • ${o.descricao.slice(0,60)}</p><p class="text-[11px] text-slate-400 mt-2">por ${o.criadoPorNome||'-'} • ${fmtDate(o.dataAbertura)}</p></div>`;}).join('')||'<p class="text-[12px] text-slate-400 p-4 text-center">Vazio</p>'}</div></div>`;}).join('');
    }else{
      document.getElementById('tbody-os').innerHTML=list.map(o=>{const cli=db.clientes.find(c=>c.id===o.clienteId); const isConcluido=o.status==='concluido'; return `<tr class="${isConcluido?'bg-emerald-50/70 border-l-4 border-l-emerald-500':'bg-white'} hover:bg-slate-50"><td class="px-5 py-3"><p class="font-mono text-[11px] font-bold">${o.numero}</p><p class="font-semibold text-[12.5px]">${cli?.nome||''}</p><p class="text-[11px] text-slate-500">Fantasia: ${cli?.fantasia||'-'} • Cód: ${cli?.codigo||'-'} • por ${o.criadoPorNome||'-'}</p><p class="text-[11px] text-slate-500">${cli?.telefone||''} • ${cli?.cidade||''} • ${cli?.endereco||''}</p></td><td class="px-5 py-3"><p class="text-[12px] capitalize">${o.tipo}</p><span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border font-bold uppercase">${o.prioridade}</span></td><td class="px-5 py-3"><p class="text-[12px]">${db.tecnicos.find(t=>t.id===o.tecnico)?.nome||'—'}</p></td><td class="px-5 py-3"><p class="text-[12px] font-mono">${Math.floor((Date.now()-new Date(o.dataAbertura))/(1000*60*60))}h</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${isConcluido?'bg-emerald-600 text-white':'bg-slate-900 text-white'}">${o.status.replace('_',' ')}</span></td><td class="px-5 py-3"><button onclick="openModal('os','${o.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></td></tr>`;}).join('');
    }
  };
})();

// VENDAS LISTA DETALHADA - código venda, data, cliente, valor, tipo pagamento, serviço ou venda, usuário, situação
(function(){
  const origRenderVendas = window.renderVendas;
  window.renderVendas = function(){
    const sess=getSession(); if(!sess) return;
    const search=(document.getElementById('search-vendas')?.value||'').toLowerCase();
    let list=db.vendas.filter(v=>v.empresaId===sess.empresaId && (!search||v.numero.toLowerCase().includes(search)||(db.clientes.find(c=>c.id===v.clienteId)?.nome||'').toLowerCase().includes(search)||(db.clientes.find(c=>c.id===v.clienteId)?.codigo&&String(db.clientes.find(c=>c.id===v.clienteId).codigo).includes(search)))).sort((a,b)=>new Date(b.data)-new Date(a.data));
    document.getElementById('tbody-vendas').innerHTML=list.map(v=>{
      const cli=db.clientes.find(c=>c.id===v.clienteId);
      const isServico = v.itens.some(it=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return p&&p.categoria==='Serviço';});
      const tipo = isServico ? 'Serviço' : 'Venda';
      return `<tr class="hover:bg-slate-50 cursor-pointer ${v.status==='estornada'?'bg-red-50':''}" onclick="showVenda('${v.id}')">
        <td class="px-5 py-3">
          <p class="font-mono text-[11px] font-bold text-[#0a1e8a]">${v.numero} • Cód: ${cli?.codigo||'-'}</p>
          <p class="font-semibold text-[12.5px]">${cli?.nome||''} ${cli?.fantasia?`(${cli.fantasia})`:''}</p>
          <p class="text-[11px] text-slate-500">${fmtDate(v.data)} • ${fmtDateTime(v.data).split(',')[1]||''} • por <b>${v.criadoPorNome||'-'}</b></p>
        </td>
        <td class="px-5 py-3">
          <p class="text-[12px]">${v.itens.length} itens • ${tipo}</p>
          <p class="font-bold text-[13px]">${fmtMoney(v.total)}</p>
          <p class="text-[11px] text-slate-500">${v.formaPagamento||'Não faturado'}</p>
        </td>
        <td class="px-5 py-3">
          <p class="text-[11px] px-2 py-1 rounded-full bg-[#e8eaf8] text-[#0a1e8a] font-bold inline-block">${tipo}</p>
          <p class="text-[11px] mt-1">${v.formaPagamento||'-'}</p>
        </td>
        <td class="px-5 py-3">
          <span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${v.status==='faturado'?'bg-emerald-50 text-emerald-700 border':v.status==='aberta'?'bg-blue-50 text-blue-700 border':v.status==='estornada'?'bg-red-50 text-red-700 border':v.status==='aprovado'?'bg-violet-50 text-violet-700 border':'bg-amber-50 text-amber-700 border'}">${v.status||'aberta'}</span>
          <p class="text-[11px] text-slate-500 mt-1">por ${v.criadoPorNome||'-'}</p>
        </td>
        <td class="px-5 py-3"><button onclick="event.stopPropagation(); deleteVenda('${v.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></td>
      </tr>`;
    }).join('');
  };
})();

// CONTRATOS - franquia exemplo 3000 copias R$120 + excedente
// Adiciona helper visual no modal contrato
(function(){
  const origRenderModalContrato = window.renderModalContrato;
  window.renderModalContrato = function(id){
    if(origRenderModalContrato) origRenderModalContrato(id);
    // adiciona exemplo após render
    setTimeout(()=>{
      const body=document.getElementById('modal-body');
      if(!body) return;
      if(!document.getElementById('exemplo-franquia')){
        const exemplo=document.createElement('div');
        exemplo.id='exemplo-franquia';
        exemplo.className='mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900';
        exemplo.innerHTML='<b>Exemplo citado no Loom:</b> Franquia 3.000 cópias a R$120,00 e valor adicional R$0,04 por cópia excedente. Ou mensal por quantidade (sem franquia). Configure abaixo franquia PB e valor mensal fixo.';
        body.appendChild(exemplo);
      }
    },100);
  };
})();

// ORÇAMENTOS - PDF fluxo semelhante vendas
function renderOrcamentos(){
  const sess=getSession(); if(!sess) return;
  const orcamentos=db.vendas.filter(v=>v.empresaId===sess.empresaId && (v.status==='orcamento' || v.status==='aprovado'));
  // se não existe view-orcamentos, cria dinamicamente?
  const view=document.getElementById('view-vendas');
  // adiciona aba orçamentos dentro de vendas
  if(!document.getElementById('aba-orcamentos')){
    const header=view.querySelector('.flex.gap-2');
    if(header){
      const btn=document.createElement('button');
      btn.id='aba-orcamentos';
      btn.className='h-11 px-4 rounded-xl bg-white border text-[13px] font-medium';
      btn.innerText='Orçamentos PDF';
      btn.onclick=()=>{navigateTo('vendas'); setTimeout(()=>{const tb=document.getElementById('tbody-vendas'); if(tb){ tb.innerHTML=db.vendas.filter(v=>v.empresaId===sess.empresaId && v.status==='orcamento').map(v=>{const cli=db.clientes.find(c=>c.id===v.clienteId); return `<tr><td class="px-5 py-3"><p class="font-mono text-[11px] font-bold">${v.numero}</p><p class="font-semibold text-[12px]">${cli?.nome}</p><p class="text-[11px]">por ${v.criadoPorNome}</p></td><td class="px-5 py-3">${fmtMoney(v.total)}</td><td class="px-5 py-3">${v.status}</td><td class="px-5 py-3"><button onclick="gerarOrcamentoPDF('${v.id}')" class="h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">Gerar PDF</button></td></tr>`}).join('');}},100);};
      header.appendChild(btn);
    }
  }
}
function gerarOrcamentoPDF(vendaId){
  const sess=getSession(); const v=db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId); if(!v) return;
  const cli=db.clientes.find(c=>c.id===v.clienteId);
  const empRaw=localStorage.getItem('digicopy_empresa_notinha'); let emp=null; try{emp=JSON.parse(empRaw);}catch{}
  const empresa=emp||db.empresas.find(e=>e.id===sess.empresaId)||db.config.empresa;
  const win=window.open('','_blank');
  const html=`
  <html><head><meta charset="UTF-8"><title>Orçamento ${v.numero}</title><style>body{font-family:Arial; font-size:12px; margin:20px;} .header{display:flex; justify-content:space-between; border-bottom:2px solid #0a1e8a; padding-bottom:10px;} .logo{width:80px; height:80px; background:#0a1e8a; color:white; display:grid; place-items:center; font-weight:bold;} table{width:100%; border-collapse:collapse; margin-top:10px;} th{background:#0a1e8a; color:white; padding:6px; text-align:left;} td{padding:6px; border-bottom:1px solid #ddd;} .total{text-align:right; font-size:18px; font-weight:bold; margin-top:20px;} .footer{margin-top:40px; font-size:11px; color:#555; border-top:1px dashed #aaa; padding-top:10px;}</style></head><body>
  <div class="header"><div class="logo">DIGICOPY</div><div><h2>ORÇAMENTO ${v.numero}</h2><p>Empresa: ${empresa.fantasia||empresa.nome} - ${empresa.cnpj||sess.cnpj}</p><p>Cliente: ${cli?.nome} - Cód: ${cli?.codigo} - ${cli?.documento}</p><p>Data: ${fmtDateTime(v.data)} - Por: ${v.criadoPorNome}</p></div><div style="text-align:right;"><p>Status: ${v.status.toUpperCase()}</p><p>Validade: 7 dias</p></div></div>
  <table><tr><th>Item</th><th>Descrição</th><th>Qtd</th><th>Unit</th><th>Total</th></tr>${v.itens.map((it,idx)=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return `<tr><td>${idx+1}</td><td>${p?.nome||'Produto'}</td><td>${it.qtd}</td><td>${fmtMoney(it.preco)}</td><td>${fmtMoney(it.subtotal)}</td></tr>`}).join('')}</table>
  <div class="total">Total: ${fmtMoney(v.total)} ${v.desconto?`(Desc: ${fmtMoney(v.desconto)})`:''}</div>
  <div class="footer"><p>Orçamento gerado por ${v.criadoPorNome} em ${fmtDateTime(v.criadoEm||v.data)} - Empresa ${sess.empresaNome} CNPJ ${sess.cnpj}</p><p>Este orçamento é válido para aprovação pelo cliente. Ao aprovar, vira venda automaticamente.</p><p><button onclick="window.print()" style="padding:10px 20px; background:#0a1e8a; color:white; border:0; border-radius:8px;">Imprimir PDF</button> <button onclick="if(confirm('Aprovar orçamento e transformar em venda?')){window.opener.postMessage({type:'aprovarOrcamento',id:'${v.id}'},'*'); window.close();}" style="padding:10px 20px; background:green; color:white; border:0; border-radius:8px;">Aprovar Orçamento</button></p></div>
  </body></html>`;
  win.document.write(html); win.document.close();
  logAction('venda','gerar_pdf_orcamento',vendaId,`Gerado PDF orçamento ${v.numero} por ${sess.usuarioNome}`);
  saveDB();
}
window.addEventListener('message',e=>{
  if(e.data&&e.data.type==='aprovarOrcamento'){
    const sess=getSession(); const v=db.vendas.find(x=>x.id===e.data.id && x.empresaId===sess.empresaId);
    if(v){ v.status='aprovado'; logAction('venda','aprovar_orcamento',v.id,`Orçamento ${v.numero} aprovado por ${sess.usuarioNome}`); saveDB(); renderVendas(); toast(`Orçamento ${v.numero} aprovado!`,'success'); }
  }
});


console.log('PATCH evolucao v3.2 - empresas PDF, CNPJ busca, chamados branco/verde filtros avançados, vendas detalhada, orçamentos PDF');
