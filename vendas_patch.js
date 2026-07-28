// DIGICOPY ERP v3.1 - PATCH vendas aprimoradas + cliente codigo + login primeira vez + logo original handling
(function(){
  // Garantir codigos de clientes existentes
  function ensureClienteCodigos(){
    const sess = typeof getSession==='function' ? getSession() : null;
    if(!sess) return;
    let maxCode = 0;
    db.clientes.forEach(c=>{ if(c.empresaId===sess.empresaId && c.codigo && c.codigo>maxCode) maxCode=c.codigo; });
    db.clientes.forEach(c=>{
      if(c.empresaId===sess.empresaId && !c.codigo){
        maxCode++;
        c.codigo = maxCode;
      }
    });
    saveDB();
  }

  // Sobrescrever seedData para incluir codigo se precisar
  const originalSeed = window.seedData;
  window.seedData = function(force=false){
    if(originalSeed) originalSeed(force);
    // adicionar codigos
    const sess = getSession();
    if(sess){
      let code=1;
      db.clientes.filter(c=>c.empresaId===sess.empresaId).forEach(c=>{ if(!c.codigo) c.codigo=code++; });
      // garantir produtos tem categoria Recarga
      if(!db.produtos.find(p=>p.categoria==='Recarga')){
        db.produtos.push({id:uid('prd'),empresaId:sess.empresaId,sku:'REC-TONER',nome:'Recarga de Toner HP 12A',categoria:'Recarga',fabricante:'DIGICOPY',estoque:999,estoqueMin:0,custo:25,preco:60,local:'-',status:'ativo',criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome,criadoEm:new Date().toISOString()});
      }
      saveDB();
    }
  };

  // LOGIN - primeira vez só CNPJ
  // Modifica showLogin para tentar auto-preencher CNPJ se já existe empresa padrão
  const originalShowLogin = window.showLogin;
  window.showLogin = function(){
    const lastCnpj = localStorage.getItem('digicopy_last_cnpj');
    if(lastCnpj){
      // tenta setar pending como última empresa conhecida
      const emp = db.empresas.find(e=>onlyDigits(e.cnpj)===onlyDigits(lastCnpj));
      if(emp){
        setPendingEmpresa(emp);
      }
    }
    if(originalShowLogin) originalShowLogin();
    // se tem pending, já mostra step usuario (CNPJ só primeira vez implicitamente lembrado)
    const pending = getPendingEmpresa();
    if(pending){
      // se usuário já tem sessão? não, mas se tem pending e tem lastCnpj, mostra dica que CNPJ lembrado
      const dica = document.getElementById('login-step-user');
      if(dica){
        // adiciona badge "CNPJ lembrado"
      }
    }
  };
  const originalDoLoginCNPJ = window.doLoginCNPJ;
  window.doLoginCNPJ = function(){
    const cnpjInput = document.getElementById('login-cnpj').value.trim();
    if(cnpjInput){
      localStorage.setItem('digicopy_last_cnpj', cnpjInput);
    }
    if(originalDoLoginCNPJ) originalDoLoginCNPJ();
  };

  // NOVA VENDA - redesign completo
  window.novaVenda = function(){
    const sess = getSession(); if(!sess) return;
    ensureClienteCodigos();
    // garante codigo
    let maxCode=0;
    db.clientes.filter(c=>c.empresaId===sess.empresaId).forEach(c=>{ if(c.codigo>maxCode) maxCode=c.codigo; });
    // se algum sem codigo, atribui
    db.clientes.filter(c=>c.empresaId===sess.empresaId && !c.codigo).forEach(c=>{ maxCode++; c.codigo=maxCode; });
    saveDB();

    document.getElementById('modal-title').innerText='Nova venda / Notinha - Busca aberta';
    const modalBody = `
    <div class="space-y-5">
      <!-- CLIENTE - CAIXA ABERTA -->
      <div class="rounded-[14px] border-2 border-[#0a1e8a]/20 bg-[#f8f9ff] p-4">
        <label class="text-[11px] font-bold tracking-wide uppercase text-[#0a1e8a]">Cliente - Caixa aberta para pesquisar (código, nome, CPF/CNPJ, endereço, telefone)</label>
        <div class="mt-2 relative">
          <div class="relative">
            <i class="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0a1e8a] text-[18px]"></i>
            <input id="nv-cliente-search" oninput="searchClientesVenda(this.value)" placeholder="Digite código, nome, CPF/CNPJ, endereço, telefone... Ex: 1844, JOAO LUCAS, 45.123.678/0001-12, Rua Albino..." class="w-full h-[48px] pl-11 pr-4 rounded-xl border-2 border-[#0a1e8a]/20 bg-white focus:bg-white focus:border-[#0a1e8a] focus:ring-4 focus:ring-[#0a1e8a]/10 outline-none text-[13.5px] font-medium">
            <button onclick="openModalClienteFromVenda()" class="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold flex items-center gap-1"><i class="ph ph-plus"></i> Novo cliente</button>
          </div>
          <div id="nv-cliente-results" class="mt-2 max-h-[260px] overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg hidden"></div>
          <div id="nv-cliente-selecionado" class="mt-3 hidden rounded-xl bg-white border border-[#0a1e8a]/20 p-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-bold text-[12px]" id="nv-cli-avatar">JL</div>
              <div>
                <p class="font-bold text-[13px]" id="nv-cli-nome">Cliente</p>
                <p class="text-[11px] text-slate-500" id="nv-cli-detalhes">Código • CPF • Endereço</p>
              </div>
            </div>
            <button onclick="clearClienteVenda()" class="w-8 h-8 grid place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><i class="ph ph-x"></i></button>
          </div>
        </div>
      </div>

      <!-- PRODUTO - CAIXA FECHADA AUXILIAR + CAIXA ABERTA -->
      <div class="rounded-[14px] border border-slate-200 p-4 bg-white">
        <div class="flex items-center justify-between mb-3">
          <label class="text-[11px] font-bold tracking-wide uppercase text-slate-500">Adicionar produto - Selecione tipo (caixa fechada) + busque (caixa aberta)</label>
          <span class="text-[10px] px-2 py-1 rounded-full bg-[#e8eaf8] text-[#0a1e8a] font-bold">2 caixas: fechada aux + aberta busca</span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-1">
            <label class="text-[11px] font-bold uppercase text-slate-500">Tipo (caixa fechada)</label>
            <select id="nv-tipo-item" onchange="onTipoItemChange()" class="mt-1 w-full h-[44px] px-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-[13px] font-semibold">
              <option value="produtos">Produtos / Itens</option>
              <option value="recarga">Recarga</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="text-[11px] font-bold uppercase text-slate-500">Buscar produto (caixa aberta)</label>
            <div class="relative mt-1">
              <i class="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input id="nv-prod-search" oninput="searchProdutosVenda(this.value)" placeholder="Digite nome, código, ref... ex: TONER, CARTUCHO, RESET..." class="w-full h-[44px] pl-11 pr-[90px] rounded-xl border border-slate-200 bg-white focus:border-[#0a1e8a] focus:ring-4 focus:ring-[#0a1e8a]/10 outline-none text-[13px]">
              <button onclick="openModalProdutoFromVenda()" class="absolute right-1 top-1/2 -translate-y-1/2 h-[36px] px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">+ Novo</button>
            </div>
          </div>
        </div>
        <div id="nv-prod-results" class="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm max-h-[280px] overflow-auto hidden"></div>
        <div id="nv-itens" class="mt-4 space-y-2 max-h-[220px] overflow-auto border-t border-slate-100 pt-3"></div>
        <div class="mt-3 flex justify-between items-center">
          <span class="text-[12px] text-slate-500">Itens: <b id="nv-itens-count">0</b></span>
          <div class="text-right"><p class="text-[11px] uppercase font-bold text-slate-500">Total notinha</p><b id="nv-total" class="text-[20px] text-[#0a1e8a]">R$ 0,00</b></div>
        </div>
      </div>

      <!-- PAGAMENTO - só aparece quando for faturar -->
      <div id="nv-pagamento-section" class="rounded-[14px] border-2 border-[#0a1e8a]/20 bg-[#f8f9ff] p-4 hidden">
        <div class="flex items-center justify-between">
          <label class="text-[11px] font-bold tracking-wide uppercase text-[#0a1e8a]">Formas de pagamento (só aparece ao faturar)</label>
          <span class="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">Aparece só ao faturar</span>
        </div>
        <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="text-[11px] font-bold uppercase text-slate-500">Forma de pagamento *</label>
            <select id="nv-pag" onchange="onPagamentoChange()" class="mt-1 w-full h-[44px] px-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white text-[13px] font-medium">
              <option value="">Selecione...</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="PIX">PIX à vista</option>
              <option value="Cartão de crédito">Cartão de crédito</option>
              <option value="Cartão de débito">Cartão de débito</option>
              <option value="Boleto">Boleto</option>
              <option value="A prazo">A prazo</option>
              <option value="Conta">Conta (Transferência por conta)</option>
            </select>
          </div>
          <div id="nv-vencimento-wrapper" class="hidden">
            <label class="text-[11px] font-bold uppercase text-slate-500">Vencimento (A prazo) - escolha data</label>
            <input id="nv-vencimento" type="date" class="mt-1 w-full h-[44px] px-3 rounded-xl border-2 border-amber-300 bg-amber-50 text-[13px]">
            <p class="text-[11px] text-amber-700 mt-1">Ao selecionar "A prazo", escolha a data de vencimento aqui.</p>
          </div>
        </div>
        <div id="nv-pag-detalhes" class="mt-3 text-[12px] text-slate-600"></div>
      </div>

      <!-- STATUS E DESCONTO -->
      <div class="grid grid-cols-3 gap-3">
        <div><label class="text-[11px] font-bold uppercase text-slate-500">Desconto R$</label><input id="nv-desc" type="number" step="0.01" value="0" oninput="updateVendaTotal()" class="mt-1 w-full h-[44px] px-3 rounded-xl border text-[13px]"></div>
        <div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="nv-status" onchange="onStatusVendaChange()" class="mt-1 w-full h-[44px] px-3 rounded-xl border text-[13px] font-medium"><option value="orcamento">Orçamento</option><option value="aprovado">Aprovado</option><option value="faturado">Faturado</option><option value="aguardar">Aguardar</option></select></div>
        <div class="flex items-end"><div class="w-full rounded-xl bg-[#0a1e8a] text-white p-3 text-center"><p class="text-[10px] uppercase font-bold tracking-wide opacity-70">Atendente</p><p class="font-bold text-[13px] mt-1" id="nv-atendente">KAUAN</p><p class="text-[10px] opacity-60 mt-1" id="nv-hora">00:00:00</p></div></div>
      </div>

      <div class="rounded-xl bg-[#e8eaf8] border border-[#c9ceef] p-3 text-[11px] text-[#0a1e8a] flex gap-2"><i class="ph ph-info text-[16px] mt-0.5"></i><div><b>Auditoria:</b> Venda será registrada como criada por <b id="nv-audit-user">-</b> com CNPJ <span id="nv-audit-cnpj">-</span>. Caixa aberta cliente busca por código, nome, CPF/CNPJ, endereço, telefone.</div></div>
    </div>
    `;
    document.getElementById('modal-body').innerHTML = modalBody;
    document.getElementById('modal-footer').innerHTML = `<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveVendaNova()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar notinha</button>`;

    // sess already declared - reuse
    document.getElementById('nv-atendente').innerText = (sess.usuarioNome||'').split(' ')[0].toUpperCase() || 'KAUAN';
    document.getElementById('nv-hora').innerText = new Date().toLocaleTimeString('pt-BR');
    document.getElementById('nv-audit-user').innerText = sess.usuarioNome;
    document.getElementById('nv-audit-cnpj').innerText = sess.cnpj;
    window.itensTemp = [];
    window.clienteSelecionadoVenda = null;
    window.searchClientesVenda = function(q){
      const sess = getSession(); const resultsEl = document.getElementById('nv-cliente-results');
      if(!q || q.length<1){ resultsEl.classList.add('hidden'); resultsEl.innerHTML=''; return; }
      const low = q.toLowerCase();
      const filtrados = db.clientes.filter(c=>c.empresaId===sess.empresaId && (
        (c.codigo && String(c.codigo).includes(low)) ||
        (c.nome && c.nome.toLowerCase().includes(low)) ||
        (c.documento && c.documento.toLowerCase().includes(low)) ||
        (c.endereco && c.endereco.toLowerCase().includes(low)) ||
        (c.cidade && c.cidade.toLowerCase().includes(low)) ||
        (c.telefone && c.telefone.toLowerCase().includes(low)) ||
        (c.email && c.email.toLowerCase().includes(low))
      )).slice(0,12);
      if(!filtrados.length){ resultsEl.innerHTML = `<div class="p-4 text-center text-[12px] text-slate-500">Nenhum cliente encontrado para "${q}" <br><button onclick="openModalClienteFromVenda()" class="mt-2 h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">+ Novo cliente</button></div>`; resultsEl.classList.remove('hidden'); return; }
      resultsEl.innerHTML = filtrados.map(c=>`
        <div onclick="selectClienteVenda('${c.id}')" class="p-3 hover:bg-[#f8f9ff] cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between group">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-bold text-[11px]">${c.codigo||'--'}</div>
            <div>
              <p class="font-bold text-[13px] leading-tight group-hover:text-[#0a1e8a]">${c.nome}</p>
              <p class="text-[11px] text-slate-500">${c.codigo ? 'Cód: '+c.codigo+' • ':''}${c.documento||''} • ${c.endereco||''} • ${c.telefone||''} • ${c.cidade||''}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-[11px] font-mono text-slate-400">${c.codigo||''}</p>
            <i class="ph ph-arrow-right text-slate-300 group-hover:text-[#0a1e8a]"></i>
          </div>
        </div>
      `).join('');
      resultsEl.classList.remove('hidden');
    };
    window.selectClienteVenda = function(id){
      const c = db.clientes.find(x=>x.id===id);
      if(!c) return;
      window.clienteSelecionadoVenda = c;
      document.getElementById('nv-cliente-search').value = `${c.codigo||''} - ${c.nome}`;
      document.getElementById('nv-cliente-results').classList.add('hidden');
      document.getElementById('nv-cliente-selecionado').classList.remove('hidden');
      document.getElementById('nv-cli-avatar').innerText = initials(c.nome);
      document.getElementById('nv-cli-nome').innerText = c.nome;
      document.getElementById('nv-cli-detalhes').innerText = `Cód: ${c.codigo||'-'} • ${c.documento||''} • ${c.endereco||''} • ${c.telefone||''} • ${c.cidade||''}/${c.estado||''}`;
    };
    window.clearClienteVenda = function(){
      window.clienteSelecionadoVenda = null;
      document.getElementById('nv-cliente-search').value='';
      document.getElementById('nv-cliente-selecionado').classList.add('hidden');
      document.getElementById('nv-cliente-results').classList.add('hidden');
    };
    window.openModalClienteFromVenda = function(){
      // abre modal cliente mas mantém referência para voltar
      const nomeDigitado = document.getElementById('nv-cliente-search').value;
      openModal('cliente');
      setTimeout(()=>{
        const el = document.getElementById('f-cli-nome');
        if(el && nomeDigitado) el.value = nomeDigitado;
      },200);
    };
    window.onTipoItemChange = function(){
      const tipo = document.getElementById('nv-tipo-item').value;
      const searchEl = document.getElementById('nv-prod-search');
      if(tipo==='recarga'){ searchEl.placeholder='Buscar recarga... ex: RECARGA HP, RECARGA 12A...'; }
      else{ searchEl.placeholder='Buscar produto/itens... ex: TONER, CARTUCHO, RESET...'; }
      // re-filtra
      searchProdutosVenda(searchEl.value);
    };
    window.searchProdutosVenda = function(q){
      const sess=getSession(); const tipo=document.getElementById('nv-tipo-item').value; const resultsEl=document.getElementById('nv-prod-results');
      const low=(q||'').toLowerCase();
      let lista = db.produtos.filter(p=>p.empresaId===sess.empresaId && p.status==='ativo');
      if(tipo==='recarga'){
        lista = lista.filter(p=>p.categoria==='Recarga' || p.nome.toLowerCase().includes('recarga'));
      }else{
        // produtos/itens = tudo exceto recarga? ou todos? Vamos incluir todos exceto recarga para diferenciar, mas se busca contém recarga ainda mostra?
        lista = lista.filter(p=>p.categoria!=='Recarga');
      }
      if(low){
        lista = lista.filter(p=> 
          (p.nome && p.nome.toLowerCase().includes(low)) ||
          (p.sku && p.sku.toLowerCase().includes(low)) ||
          (p.categoria && p.categoria.toLowerCase().includes(low)) ||
          (p.fabricante && p.fabricante.toLowerCase().includes(low))
        );
      }
      lista = lista.slice(0,15);
      if(!lista.length){
        resultsEl.innerHTML = `<div class="p-3 text-center text-[12px] text-slate-500">Nenhum produto em <b>${tipo}</b> para "${q||''}"<br><button onclick="openModalProdutoFromVenda()" class="mt-2 h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">+ Criar novo produto</button></div>`;
        resultsEl.classList.remove('hidden');
        return;
      }
      resultsEl.innerHTML = `
        <div class="p-2 border-b bg-slate-50 flex items-center justify-between text-[11px] font-bold uppercase text-slate-500"><span>Pesquisar produto / serviço</span><span>${lista.length} resultados</span></div>
        ${lista.map(p=>`
          <div class="p-3 hover:bg-[#f8f9ff] cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between group" onclick="selectProdutoVenda('${p.id}')">
            <div class="flex-1">
              <p class="font-bold text-[13px] leading-tight group-hover:text-[#0a1e8a]">${p.nome}</p>
              <p class="text-[11px] text-slate-500">SKU: ${p.sku} • ${p.categoria} • ${p.fabricante} • Est: ${p.estoque}</p>
              <p class="text-[11px] font-bold text-[#0a1e8a]">R$ ${p.preco.toFixed(2).replace('.',',')} • Criado por ${p.criadoPorNome||'-'}</p>
            </div>
            <div class="text-right ml-3">
              <p class="text-[12px] font-bold">${fmtMoney(p.preco)}</p>
              <p class="text-[11px] text-slate-400 font-mono">${p.estoque} un</p>
              <button class="mt-1 w-7 h-7 grid place-items-center rounded-lg bg-[#0a1e8a] text-white"><i class="ph ph-plus"></i></button>
            </div>
          </div>
        `).join('')}
        <div class="p-2 flex gap-2"><button onclick="openModalProdutoFromVenda()" class="flex-1 h-9 rounded-xl bg-white border border-[#0a1e8a]/20 text-[#0a1e8a] text-[11px] font-bold">+ Novo produto (foco notinha)</button><button onclick="document.getElementById('nv-prod-results').classList.add('hidden')" class="h-9 px-4 rounded-xl bg-slate-900 text-white text-[11px] font-bold">Ok</button></div>
      `;
      resultsEl.classList.remove('hidden');
    };
    window.openModalProdutoFromVenda = function(){
      const termo = document.getElementById('nv-prod-search').value;
      const tipo = document.getElementById('nv-tipo-item').value;
      // abre modal produto com foco em adicionar na notinha
      openModal('produto');
      setTimeout(()=>{
        const nomeEl = document.getElementById('f-prd-nome');
        const catEl = document.getElementById('f-prd-cat');
        if(nomeEl && termo) nomeEl.value = termo.toUpperCase();
        if(catEl){
          if(tipo==='recarga') catEl.value='Recarga';
          else catEl.value='Suprimento';
        }
      },200);
    };
    window.selectProdutoVenda = function(id){
      const p = db.produtos.find(x=>x.id===id); if(!p) return;
      // verificar se já existe nos itensTemp
      let existing = window.itensTemp.find(i=>i.produtoId===id);
      if(existing){ existing.qtd++; existing.subtotal = existing.qtd*existing.preco; }
      else{ window.itensTemp.push({produtoId:id, qtd:1, preco:p.preco, subtotal:p.preco}); }
      renderItensVenda();
      updateVendaTotal();
      // não esconde resultados para continuar adicionando
    };
    window.renderItensVenda = function(){
      const container = document.getElementById('nv-itens');
      if(!window.itensTemp.length){ container.innerHTML = '<p class="text-[12px] text-slate-400 text-center py-4">Nenhum item adicionado. Use a caixa aberta acima para buscar.</p>'; document.getElementById('nv-itens-count').innerText='0'; return; }
      container.innerHTML = window.itensTemp.map((it,idx)=>{
        const p=db.produtos.find(x=>x.id===it.produtoId);
        return `<div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#0a1e8a]/30 transition">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-[#0a1e8a] text-white grid place-items-center font-bold text-[10px]">${it.qtd}</div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-[12.5px] truncate">${p?.nome||'Produto'}</p>
              <p class="text-[11px] text-slate-500">${p?.sku||''} • ${fmtMoney(it.preco)} un • Criado por ${p?.criadoPorNome||'-'}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <button onclick="alterarQtdItem(${idx},-1)" class="w-7 h-7 grid place-items-center rounded-lg bg-slate-100 hover:bg-slate-200"><i class="ph ph-minus"></i></button>
              <span class="w-8 text-center font-bold text-[12px]">${it.qtd}</span>
              <button onclick="alterarQtdItem(${idx},1)" class="w-7 h-7 grid place-items-center rounded-lg bg-slate-100 hover:bg-slate-200"><i class="ph ph-plus"></i></button>
            </div>
            <b class="text-[12px] min-w-[70px] text-right">${fmtMoney(it.subtotal)}</b>
            <button onclick="removerItemVenda(${idx})" class="w-7 h-7 grid place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><i class="ph ph-trash"></i></button>
          </div>
        </div>`;
      }).join('');
      document.getElementById('nv-itens-count').innerText = window.itensTemp.length;
    };
    window.alterarQtdItem = function(idx,delta){
      const it = window.itensTemp[idx]; if(!it) return;
      it.qtd += delta;
      if(it.qtd<=0){ window.itensTemp.splice(idx,1); }
      else{ it.subtotal = it.qtd*it.preco; }
      renderItensVenda(); updateVendaTotal();
    };
    window.removerItemVenda = function(idx){ window.itensTemp.splice(idx,1); renderItensVenda(); updateVendaTotal(); };
    window.updateVendaTotal = function(){
      const sub = window.itensTemp.reduce((s,i)=>s+i.subtotal,0);
      const desc = parseFloat(document.getElementById('nv-desc').value)||0;
      const total = sub - desc;
      document.getElementById('nv-total').innerText = fmtMoney(total);
    };
    window.onStatusVendaChange = function(){
      const status = document.getElementById('nv-status').value;
      const pagSection = document.getElementById('nv-pagamento-section');
      if(status==='faturado'){
        pagSection.classList.remove('hidden');
      }else{
        pagSection.classList.add('hidden');
      }
    };
    window.onPagamentoChange = function(){
      const pag = document.getElementById('nv-pag').value;
      const vencWrapper = document.getElementById('nv-vencimento-wrapper');
      const detalhes = document.getElementById('nv-pag-detalhes');
      if(pag==='A prazo'){
        vencWrapper.classList.remove('hidden');
        detalhes.innerHTML = '<p>Selecione a data de vencimento para pagamento a prazo.</p>';
      }else{
        vencWrapper.classList.add('hidden');
        if(pag==='Conta (Transferência por conta)'){
          detalhes.innerHTML = '<p>Transferência bancária - informe conta na descrição da venda se necessário.</p>';
        }else if(pag){
          detalhes.innerHTML = `<p>Forma selecionada: <b>${pag}</b></p>`;
        }else{
          detalhes.innerHTML = '';
        }
      }
    };
    window.saveVendaNova = function(){
      const sess=getSession();
      if(!window.clienteSelecionadoVenda) return toast('Selecione o cliente pela caixa aberta','error');
      if(!window.itensTemp.length) return toast('Adicione pelo menos um produto pela caixa aberta','error');
      const status = document.getElementById('nv-status').value;
      let pagamento = document.getElementById('nv-pag').value;
      let vencimento = null;
      if(status==='faturado'){
        if(!pagamento) return toast('Selecione forma de pagamento (aparece ao faturar)','error');
        if(pagamento==='A prazo'){
          vencimento = document.getElementById('nv-vencimento').value;
          if(!vencimento) return toast('Selecione a data de vencimento para A prazo','error');
        }
      }
      const desc = parseFloat(document.getElementById('nv-desc').value)||0;
      const total = window.itensTemp.reduce((s,i)=>s+i.subtotal,0) - desc;
      const venda = {
        id:uid('vda'), empresaId:sess.empresaId,
        numero:'VD-'+new Date().getFullYear()+'-'+String(db.vendas.filter(v=>v.empresaId===sess.empresaId).length+1).padStart(4,'0'),
        clienteId: window.clienteSelecionadoVenda.id,
        data:new Date().toISOString(),
        itens:[...window.itensTemp],
        desconto:desc,
        total,
        formaPagamento: pagamento || 'Não faturado',
        vencimento: vencimento || null,
        status,
        criadoPor:sess.usuarioId,
        criadoPorNome:sess.usuarioNome,
        criadoEm:new Date().toISOString()
      };
      // baixa estoque
      venda.itens.forEach(it=>{
        const p=db.produtos.find(x=>x.id===it.produtoId && x.empresaId===sess.empresaId);
        if(p && p.categoria!=='Serviço' && p.categoria!=='Recarga') p.estoque -= it.qtd;
      });
      db.vendas.push(venda);
      logAction('venda','criar',venda.id,`Venda ${venda.numero} cliente ${window.clienteSelecionadoVenda.nome} total ${fmtMoney(total)} por ${sess.usuarioNome} - Código cliente ${window.clienteSelecionadoVenda.codigo} - Pagamento ${pagamento||'N/A'}`);
      if(status==='faturado'){
        db.contasReceber.push({
          id:uid('cr'), empresaId:sess.empresaId, origem:'venda', clienteId:venda.clienteId,
          descricao:`Venda ${venda.numero} - ${window.clienteSelecionadoVenda.nome} - ${pagamento}${vencimento?' - Venc '+fmtDate(vencimento):''}`,
          valor:total, vencimento: vencimento ? new Date(vencimento).toISOString() : new Date(Date.now()+1000*60*60*24*14).toISOString(),
          pagamentoData:null, status:'aberto', contratoId:null, leituraId:null, vendaId:venda.id,
          criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome, formaPagamento:pagamento
        });
      }
      saveDB(); renderVendas(); renderProdutos(); renderFinanceiro(); renderAuditoria(); closeModal(); toast(`Notinha ${venda.numero} salva por ${sess.usuarioNome} - Cliente ${window.clienteSelecionadoVenda.codigo}`,'success');
      // abrir impressão notinha no formato da imagem anexada
      setTimeout(()=>{imprimirNotinha(venda.id);},500);
    };
    // inicia com clientes e produtos vazios mas com focus
    setTimeout(()=>{const el=document.getElementById('nv-cliente-search'); if(el) el.focus();},200);
    document.getElementById('modal-root').classList.remove('hidden');
    window.modalContext={type:'venda'};
  };

  // Sobrescrever showVenda e imprimir para formato notinha da imagem
  const originalShowVenda = window.showVenda;
  window.showVenda = function(id){
    if(originalShowVenda) originalShowVenda(id);
    // adiciona botão imprimir notinha no detalhe
    setTimeout(()=>{
      const detail = document.getElementById('venda-detail');
      if(detail && !detail.innerHTML.includes('Imprimir notinha')){
        const btn = document.createElement('button');
        btn.className='mt-3 w-full h-11 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13px]';
        btn.innerHTML='<i class="ph ph-printer mr-1"></i> Imprimir notinha (formato imagem anexada)';
        btn.onclick=()=>imprimirNotinha(id);
        detail.appendChild(btn);
      }
    },300);
  };

  window.imprimirNotinha = function(vendaId){
    const sess=getSession(); const v=db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId); if(!v) return;
    const cli=db.clientes.find(c=>c.id===v.clienteId);
    const empresa=db.empresas.find(e=>e.id===sess.empresaId);
    const config=db.config.empresa;
    const win = window.open('', '_blank');
    const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Notinha Venda ${v.numero}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#222; margin:0; padding:20px;}
  .header{display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #222; padding-bottom:10px;}
  .logo{width:80px; height:80px; background:#eee; display:grid; place-items:center; font-weight:bold; border:1px solid #ccc;}
  .center{text-align:center; flex:1;}
  .center h1{margin:0; font-size:20px;}
  .center h2{margin:2px 0; font-size:12px; font-weight:normal;}
  .right{text-align:right; font-size:11px; line-height:1.3;}
  table{width:100%; border-collapse:collapse; margin-top:8px; font-size:11px;}
  th{background:#c0c0c0; text-align:left; padding:4px; font-size:11px;}
  td{padding:4px; border-bottom:1px solid #ddd;}
  .green-bar{background:#2e8b57; color:white; text-align:center; padding:8px; font-size:18px; font-weight:bold; margin-top:12px;}
  .totais{display:flex; gap:10px; margin-top:10px;}
  .box{border:1px solid #aaa; padding:8px; flex:1; text-align:center;}
  .box b{font-size:16px; display:block;}
  .footer{margin-top:60px; display:flex; justify-content:space-between; font-size:11px;}
  .footer .line{border-top:1px solid #222; width:300px; text-align:center; padding-top:4px;}
  .small{font-size:10px; color:#555;}
  @media print{body{padding:0} button{display:none}}
</style></head><body>
<div class="header">
  <div class="logo"><img src="./logo.png" style="max-width:70px; max-height:70px; object-fit:contain"><br>Logo</div>
  <div class="center">
    <h1>DIGICOPY</h1>
    <h2>${empresa?.nome||config.nome||'DENIVALDO COM. DE ELET. LOCACOES E MANU LTDA'}</h2>
    <div class="small">${empresa?.cnpj||sess.cnpj} - ${sess.empresaNome}</div>
    <div class="small">Atendente: ${v.criadoPorNome||sess.usuarioNome} - ${fmtDateTime(v.data)}</div>
  </div>
  <div class="right">
    ${empresa?.cnpj||sess.cnpj}<br>
    ${config.fone||''}<br>
    Avenida Pedro Alves da Silva 97<br>
    Padre Eustáquio<br>
    JANAUBA - MG
  </div>
</div>

<table>
  <tr><th>Codigo</th><th>Nome</th><th>Nome Fantasia</th><th>Fone</th><th>Fone 2</th></tr>
  <tr><td>${cli?.codigo||''}</td><td>${cli?.nome||''}</td><td>${cli?.nome||''}</td><td>${cli?.telefone||''}</td><td></td></tr>
</table>
<table>
  <tr><th>Endereço</th><th>Nº</th><th>Complemento</th><th>Bairro</th><th>CPF/CNPJ</th><th>RG/Inc. Est</th></tr>
  <tr><td>${cli?.endereco||''}</td><td>NUMERO</td><td></td><td>${cli?.cidade||''} - Veredas</td><td>${cli?.documento||''}</td><td></td></tr>
</table>
<table>
  <tr><th>Contato</th><th>Cidade</th><th>UF</th><th>CEP</th><th>Email</th></tr>
  <tr><td>${cli?.nome||''}</td><td>${cli?.cidade||'JANAUBA'}</td><td>${cli?.estado||'MG'}</td><td>${cli?.cep||'39440-001'}</td><td>${cli?.email||''}</td></tr>
</table>

<div class="green-bar">Venda ${v.numero.replace('VD-','')}</div>

<table>
  <tr><th>PARCELA</th><th>CÓD.</th><th>VALOR</th><th>VENCIMENTO</th><th>PAGAMENTO</th><th>DESCRIÇÃO</th><th>DOCUMENTO</th></tr>
  <tr><td>1/1</td><td>${v.id.slice(-5)}</td><td>${fmtMoney(v.total)}</td><td>${v.vencimento?fmtDate(v.vencimento):fmtDate(new Date(Date.now()+1000*60*60*24*14))}</td><td>${v.formaPagamento||''}</td><td>${v.formaPagamento||''}</td><td></td></tr>
</table>

<table>
  <tr><th>CÓD.</th><th>DESCRIÇÃO</th><th>UNITÁRIO</th><th>QTD.</th><th>TOTAL</th><th>SITUAÇÃO</th><th>OBS.</th></tr>
  ${v.itens.map(it=>{
    const p=db.produtos.find(pr=>pr.id===it.produtoId);
    return `<tr><td>${p?.codigo||p?.sku||it.produtoId.slice(-4)}</td><td>${p?.nome||'Produto'} - criado por ${p?.criadoPorNome||'-'}</td><td>${fmtMoney(it.preco)}</td><td>${it.qtd}</td><td>${fmtMoney(it.subtotal)}</td><td>PRODUTO</td><td>NENHUMA</td></tr>`;
  }).join('')}
</table>

<div class="totais">
  <div class="box"><b>${v.numero.replace('VD-','')}</b><br><span class="small">AGUARDAR</span></div>
  <div class="box"><b>${fmtDate(v.data)}</b><br><span class="small">${new Date(v.data).toLocaleTimeString('pt-BR')}</span></div>
  <div class="box" style="text-align:left; font-size:11px;">Acré. R$ 0,00 Frete R$ 0,00<br>Desc. R$ ${v.desconto||0} Atendente ${v.criadoPorNome||sess.usuarioNome}<br>Desc. 0% Entregar até</div>
  <div class="box"><b>${fmtMoney(v.total)}</b><br><span class="small">${v.formaPagamento||''}</span></div>
</div>

<div class="footer">
  <div>Recebi: ___/___/______ às ___:___ <br><br><div class="line">NOME POR EXTENSO</div></div>
  <div style="text-align:center;"><br><br><div class="small">Criado por ${v.criadoPorNome||sess.usuarioNome} • CNPJ ${sess.cnpj} • Código cliente ${cli?.codigo||''}</div></div>
</div>

<div class="small" style="margin-top:20px; border-top:1px dashed #aaa; padding-top:8px;">
  <b>Auditoria:</b> Venda criada por ${v.criadoPorNome} (${v.criadoPor}) em ${fmtDateTime(v.criadoEm||v.data)} - Empresa ${sess.empresaNome} CNPJ ${sess.cnpj} - Atendente ${v.criadoPorNome} - Forma pagamento ${v.formaPagamento} - Cliente código ${cli?.codigo}
</div>

<button onclick="window.print()" style="margin-top:20px; padding:10px 20px; background:#0a1e8a; color:white; border:0; border-radius:8px; cursor:pointer;">Imprimir</button>
<button onclick="window.close()" style="margin-top:20px; margin-left:10px; padding:10px 20px; background:white; border:1px solid #ccc; border-radius:8px; cursor:pointer;">Fechar</button>
</body></html>
    `;
    win.document.write(html);
    win.document.close();
    logAction('venda','imprimir_notinha',vendaId,`Impressão notinha ${v.numero} por ${sess.usuarioNome}`);
    saveDB();
  };

  // Garantir que ao criar cliente, gera codigo sequencial
  const originalSaveCliente = window.saveCliente;
  window.saveCliente = function(){
    const sess=getSession();
    const isNew = !window.modalContext?.id;
    if(isNew){
      const maxCode = Math.max(0, ...db.clientes.filter(c=>c.empresaId===sess.empresaId).map(c=>c.codigo||0));
      // temporariamente armazena para uso no payload
      window._nextCodigoCliente = maxCode+1;
    }
    // Chama original
    if(originalSaveCliente) {
      // interceptar dentro da original: vamos fazer override completo aqui para garantir codigo
      const id=window.modalContext?.id;
      const payload={
        empresaId:sess.empresaId,
        codigo: isNew ? window._nextCodigoCliente : undefined,
        nome:document.getElementById('f-cli-nome').value.trim(),
        documento:document.getElementById('f-cli-doc').value.trim(),
        tipo:document.getElementById('f-cli-tipo').value,
        email:document.getElementById('f-cli-email').value.trim(),
        telefone:document.getElementById('f-cli-tel').value.trim(),
        endereco:document.getElementById('f-cli-end').value.trim(),
        cidade:document.getElementById('f-cli-cidade').value.trim(),
        estado:document.getElementById('f-cli-estado').value.trim(),
        cep:document.getElementById('f-cli-cep').value.trim(),
        status:document.getElementById('f-cli-status').value
      };
      if(!payload.nome) return toast('Informe nome','error');
      if(id){
        const existing=db.clientes.find(c=>c.id===id && c.empresaId===sess.empresaId);
        // manter codigo existente
        payload.codigo = existing.codigo;
        Object.assign(existing,payload,{atualizadoPor:sess.usuarioId, atualizadoPorNome:sess.usuarioNome, atualizadoEm:new Date().toISOString()});
        logAction('cliente','editar',id,`Editado cliente ${payload.nome} código ${payload.codigo}`);
      }else{
        const novo={id:uid('cli'),...payload,mensalidade:0,criadoEm:new Date().toISOString(),criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome};
        db.clientes.push(novo);
        logAction('cliente','criar',novo.id,`Criado cliente ${novo.nome} código ${novo.codigo} por ${sess.usuarioNome}`);
      }
      saveDB(); renderClientes(); closeModal(); toast(`Cliente salvo código ${payload.codigo||''} por ${sess.usuarioNome}`,'success'); buildNav(); renderDashboard(); renderAuditoria();
      // Se foi chamado de venda, selecionar automaticamente
      if(window.clienteSelecionadoVenda===null || window.novaVenda){
        // se modal cliente foi aberto a partir da venda, tenta auto selecionar
        const novoOuEdit = db.clientes.find(c=>c.empresaId===sess.empresaId && c.nome===payload.nome);
        if(novoOuEdit && window.selectClienteVenda){
          setTimeout(()=>selectClienteVenda(novoOuEdit.id),300);
        }
      }
      return;
    }
  };

  // Patch para remover area "remover.png" - se for alguma div com texto remover, esconde
  // O usuário disse "isso da imagem anexada escrita remover pode remover essa area"
  // Vamos ocultar qualquer elemento com texto "RECURSOS" ou "FAQ, Suporte, Email Marketing, Mapa, Agenda" que são do sistema antigo que não queremos
  // Nosso sistema já não tem essas áreas, mas garantimos que view-config não mostra nada com "remover"
  // Se houver elemento com id "remover", esconder
  setTimeout(()=>{
    document.querySelectorAll('*').forEach(el=>{
      if(el.textContent && el.textContent.trim().toLowerCase()==='remover'){
        const parent = el.closest('div');
        if(parent) parent.style.display='none';
      }
    });
  },1000);

  console.log('PATCH vendas v3.1 carregado - cliente codigo, busca aberta, pagamento só ao faturar, tipo produto/recarga');
})();
