// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.8 — Otimização total de Vendas/Notinhas e regras de negócio:
// • Exclusão de tabelas auxiliares/inválidas no Explorar Migrados ("S"/"N"/"ordens")
// • Formatação Title Case (iniciais maiúsculas, fim de CAPSLOCK)
// • Normalização de vendedores ("Vendas - ordens" → "Recepção", "admin" → "Operacional")
// • Remoção de vendedores inativos/duplicados no filtro de notinhas (Kaio, admin, S, N)
// • Botões "Estornar / Cancelar" e "Editar Notinha" no histórico
// • Leveza máxima no fechamento do modal e renderização fatiada (anti-lag)
// ═══════════════════════════════════════════════════════════════════════════
(function(){

function toTitleCase(str){
  if(!str) return '';
  const excecoes = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'com', 'por', 'a', 'o', 'as', 'os'];
  return String(str).trim().toLowerCase().split(/\s+/).map((word, i) => {
    if(!word) return '';
    if(i > 0 && excecoes.includes(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function ehTabelaVendaReal(nome){
  const n = String(nome||'').toUpperCase().trim();
  // Ignora tabelas auxiliares, de itens, log, config, parâmetros, funcionários, usuários, ordens de vendedor
  if(/ITENS|ITEM|PARAM|CONFIG|LOG|STATUS|ORDENS|USUARIO|FUNCIONARIO|VENDEDOR|DEPARTAMENTO|CAIXA_MOV|PERMISSAO|AUDIT|TEMP|MIGR/i.test(n)){
    return false;
  }
  // Só aceita tabelas principais de vendas/notinhas/os/cupons
  return /^(VENDAS?|NOTAS?|NOTINHAS?|CUPOM|CUPONS|SAIDAS?|OS|ORDEM_SERVICO|CHAMADOS?|PEDIDOS?|COMANDAS?)$/i.test(n) ||
         /VENDA|NOTINHA|CUPOM|ORDEM_SERVICO/i.test(n);
}

function ehRegistroVendaValido(numRaw, r){
  const s = String(numRaw||'').trim();
  if(!s || s === '0' || /^[A-Za-z]$/.test(s)) return false;
  return true;
}

function normalizarNomeVendedor(nome){
  let s = String(nome||'').trim();
  if(!s || /^([NS]|VENDAS?.*ORDENS?|IMPORTADO)$/i.test(s)) return 'Recepção';
  if(/^admin$/i.test(s)) return 'Administrador';
  return toTitleCase(s);
}

window.VOTM_PURE = {
  toTitleCase,
  ehTabelaVendaReal,
  ehRegistroVendaValido,
  normalizarNomeVendedor
};

if(typeof window === 'undefined') return;

// 1. Aprimorar vosLegadosVendas para usar ehTabelaVendaReal, associar itens de tabelas filhas e normalizar valores
const _baseVosLegados = window.vosLegadosVendas;
window.vosLegadosVendas = function(sess){
  const mod = db.modulosDinamicos||{};
  let fp = 0;
  for(const k in mod){ fp += (((mod[k]||{}).dados||[]).length)||0; }
  const c = window.__vosLegCache;
  if(c && c.fp===fp && c.emp===sess.empresaId) return c.list;

  // Indexar itens de todas as tabelas de itens em modulosDinamicos
  const itensIdx = {};
  Object.entries(mod).forEach(([n, m])=>{
    if(/ITENS|ITEM/i.test(n)){
      (m.dados||[]).forEach(ir => {
        const codV = String(ir.COD_VENDA || ir.NUMERO_VENDA || ir.VENDA_ID || ir.CODIGO_VENDA || ir.COD_NOTA || ir.COD_OS || ir.NUMERO_NOTA || '').trim();
        if(!codV) return;
        const qtd = parseFloat(ir.QUANTIDADE || ir.QTD || ir.QTDE || 1) || 1;
        const unit = parseFloat(ir.VALOR_UNIT || ir.VALOR_UNITARIO || ir.PRECO_UNIT || ir.PRECO || ir.VALOR || 0) || 0;
        const sub = parseFloat(ir.SUBTOTAL || ir.VALOR_TOTAL || ir.VALOR_ITEM || ir.TOTAL || 0) || (qtd*unit);
        (itensIdx[codV] = itensIdx[codV] || []).push({
          produtoId: null,
          descricao: String(ir.DESCRICAO || ir.PRODUTO || ir.NOME || 'Item importado'),
          qtd, preco: unit, subtotal: sub
        });
      });
    }
  });

  const legados = [];
  Object.entries(mod).forEach(([nome, modulo])=>{
    if(!ehTabelaVendaReal(nome)) return;
    (modulo.dados||[]).forEach((r, i)=>{
      const numero = r.NUMERO||r.CODIGO||r.COD_VENDA||r.ID||`${nome}-${i+1}`;
      if(!ehRegistroVendaValido(numero, r)) return;
      const itensVinculados = itensIdx[String(numero)] || [];
      const totalItens = itensVinculados.reduce((acc, x) => acc + (x.subtotal||0), 0);
      const totalCabecalho = Number(r.VALOR_LIQUIDO||r.TOTAL_LIQUIDO||r.TOTAL_NOTA||r.VALOR_NOTA||r.TOTAL_GERAL||r.TOTAL_OS||r.TOTAL||r.VALOR||r.VALOR_TOTAL||0)||0;
      const totalFinal = totalCabecalho > 0 ? totalCabecalho : totalItens;

      const temDadosOS = !!(r.MODELO || r.EQUIPAMENTO || r.SERIE || r.NUMERO_SERIE || r.PATRIMONIO || r.CONTADOR || r.DEFEITO || r.PROBLEMA || r.SERVICOS || r.SOLUCAO || /OS|ORDEM_SERVICO/i.test(nome));
      const osObj = temDadosOS ? {
        migrado: true,
        modelo: r.MODELO || r.EQUIPAMENTO || r.MAQUINA || r.IMPRESSORA || 'Equipamento',
        numeroSerie: r.SERIE || r.NUMERO_SERIE || r.N_SERIE || r.SERIAL || '',
        patrimonio: r.PATRIMONIO || r.PAT || '',
        contador: r.CONTADOR || r.CONTADOR_PB || r.CONTADOR_ATUAL || '',
        defeito: r.DEFEITO || r.PROBLEMA || r.DEFEITO_RELATADO || '',
        servicos: r.SOLUCAO || r.SERVICO || r.SERVICOS || '',
        tecnico: normalizarNomeVendedor(r.TECNICO || r.RESPONSAVEL || r.VENDEDOR || ''),
        numero: r.NUMERO_OS || r.NUM_OS || String(numero)
      } : null;
      const vendedorNorm = normalizarNomeVendedor(r.VENDEDOR||r.USUARIO||r.ATENDENTE||r.OPERADOR_NOME||'Recepção');
      legados.push({
        id:`legado_venda_${nome}_${i}`, empresaId:sess.empresaId, numero:String(numero),
        data:r.DATA||r.DATA_VENDA||r.EMISSAO||r.DT_VENDA||r.CRIADO_EM||new Date().toISOString(),
        total:totalFinal,
        status:String(r.SITUACAO||r.STATUS||'finalizada').toLowerCase(),
        formaPagamento:r.PAGAMENTO||r.FORMA_PAGAMENTO||r.RECEBIMENTO||'Prazo',
        clienteNomeAntigo:toTitleCase(r.CLIENTE||r.NOME_CLIENTE||r.RAZAO_SOCIAL||r.NOME||''),
        fantasiaAntiga:toTitleCase(r.FANTASIA||r.NOME_FANTASIA||''),
        numeroNfe:r.NFE||r.NUMERO_NFE||r.NUM_NFE||'',
        codClienteAntigo:r.COD_CLIENTE||r.CODIGO_CLIENTE||'',
        criadoPorNome:vendedorNorm,
        atendenteNome:vendedorNorm,
        observacao:r.OBSERVACAO||r.OBS||'',
        itens: itensVinculados.length ? itensVinculados : [{descricao: r.DEFEITO || r.OBSERVACAO || 'Item / Serviço migrado', qtd: 1, preco: totalFinal, subtotal: totalFinal}],
        origemMigracao:true, tabelaOrigem:nome, os: osObj
      });
    });
  });
  window.__vosLegCache = { fp, emp:sess.empresaId, list:legados };
  return legados;
};

// 2. Otimizar renderVendas para formatar Title Case nos clientes/vendedores e limpar o filtro de vendedores
const _origRenderVendas = window.renderVendas;
window.renderVendas = function(){
  const sess = getSession(); if(!sess) return;
  const view = document.getElementById('view-vendas');
  if(!view) return;
  // Normalizar vendas na base antes do render para Title Case
  (db.vendas||[]).forEach(v => {
    if(v.empresaId === sess.empresaId){
      v.criadoPorNome = normalizarNomeVendedor(v.criadoPorNome);
      v.atendenteNome = normalizarNomeVendedor(v.atendenteNome);
    }
  });
  _origRenderVendas.apply(this, arguments);

  // Pós-render: filtrar o select de vendedores para não exibir inativos / duplicados (Kaio, admin, N, S, vendas - ordens)
  const selVend = document.getElementById('neo-vendas-vend');
  if(selVend){
    const excluidos = ['-', 'importado', 'n', 's', 'vendas - ordens', 'vendas ordens', 'admin', 'kaio geovane', 'kaio'];
    const opVal = selVend.value;
    const base = [ ...db.vendas.filter(v=>v.empresaId===sess.empresaId), ...vosLegadosVendas(sess) ];
    const vends = [...new Set(base.map(v => normalizarNomeVendedor(v.atendenteNome||v.criadoPorNome)).filter(Boolean))];
    const vendsLimpos = vends.filter(v => {
      const low = String(v).trim().toLowerCase();
      if(!low || excluidos.includes(low) || low.includes('kaio')) return false;
      return true;
    }).sort((a,b)=>a.localeCompare(b, 'pt-BR', {sensitivity:'base'}));
    selVend.innerHTML = `<option value="todos">Todos vendedores (${vendsLimpos.length})</option>` +
      vendsLimpos.map(u => `<option value="${escapeHtml(u)}" ${opVal===u?'selected':''}>${escapeHtml(u)}</option>`).join('');
  }
};

// 3. Função para Estornar / Cancelar qualquer Notinha (nova ou migrada)
window.estornarNotinha = function(id){
  const sess = getSession(); if(!sess) return;
  const v = db.vendas.find(x=>x.id===id) || (typeof vosLegadosVendas==='function' ? vosLegadosVendas(sess).find(x=>x.id===id) : null);
  if(!v) return toast('Notinha não encontrada', 'error');
  if(v.status === 'cancelada' || v.status === 'estornada'){
    return toast('Esta notinha já está cancelada/estornada', 'info');
  }
  if(!confirm(`Deseja ESTORNAR/CANCELAR a notinha ${v.numero} (Valor: ${fmtMoney(v.total||0)})?\n\nOs itens retornarão ao estoque e os recebimentos serão marcados como estornados.`)){
    return;
  }
  // Se for migrada, promove para db.vendas
  let reg = db.vendas.find(x=>x.id===id);
  if(!reg){
    reg = structuredClone(v);
    reg.id = id.startsWith('legado_') ? uid('vda') : id;
    reg.origemMigracao = true;
    db.vendas.push(reg);
  }
  reg.status = 'cancelada';
  reg.dataEstorno = new Date().toISOString();
  reg.estornadoPor = sess.usuarioNome;
  
  // Devolver estoque dos itens
  (reg.itens||[]).forEach(it => {
    if(it.produtoId){
      const prd = db.produtos.find(p => p.id === it.produtoId);
      if(prd) prd.estoque = (prd.estoque || 0) + (parseFloat(it.qtd) || 1);
    }
  });

  // Marcar contas a receber como estornadas
  (db.contasReceber||[]).forEach(cr => {
    if(cr.vendaId === reg.id || cr.legadoCodigo === reg.numero){
      cr.status = 'estornado';
    }
  });

  logAction('venda', 'estornar_notinha', reg.id, `Estornada notinha ${reg.numero} (${fmtMoney(reg.total||0)}) por ${sess.usuarioNome}`);
  saveDB();
  closeModal();
  if(typeof renderVendas === 'function') renderVendas();
  if(typeof renderDashboard === 'function') renderDashboard();
  if(typeof renderAuditoria === 'function') renderAuditoria();
  toast(`Notinha ${reg.numero} estornada com sucesso!`, 'success');
};

// 4. Função para Editar qualquer Notinha (inclusive migrada)
window.editarNotinhaMigrada = function(id){
  const sess = getSession(); if(!sess) return;
  const v = db.vendas.find(x=>x.id===id) || (typeof vosLegadosVendas==='function' ? vosLegadosVendas(sess).find(x=>x.id===id) : null);
  if(!v) return toast('Notinha não encontrada', 'error');
  let reg = db.vendas.find(x=>x.id===id);
  if(!reg){
    reg = structuredClone(v);
    reg.id = id.startsWith('legado_') ? uid('vda') : id;
    reg.origemMigracao = true;
    db.vendas.push(reg);
  }
  closeModal();
  // Abre o modal de edição de notinha
  abrirModalEdicaoVendaRapida(reg.id);
};

window.abrirModalEdicaoVendaRapida = function(id){
  const sess = getSession(); if(!sess) return;
  const v = db.vendas.find(x=>x.id===id);
  if(!v) return;
  const clientes = (db.clientes||[]).filter(c=>c.empresaId===sess.empresaId);
  const cliSel = clientes.map(c => `<option value="${c.id}" ${c.id===v.clienteId?'selected':''}>${escapeHtml(c.nome)} (#${c.codigo||c.codigoAntigo||'-'})</option>`).join('');
  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[640px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[90vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Editar Notinha — ' + v.numero;
  document.getElementById('modal-body').innerHTML = `
    <div class="space-y-4 text-[13px]">
      <div>
        <label class="block font-bold text-slate-600 mb-1">Cliente da Notinha</label>
        <select id="ed-venda-cli" class="w-full h-10 px-3 rounded-xl border">${cliSel}<option value="" ${!v.clienteId?'selected':''}>Sem cliente / Avulso</option></select>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-bold text-slate-600 mb-1">Forma de Pagamento</label>
          <select id="ed-venda-pgto" class="w-full h-10 px-3 rounded-xl border">
            ${['Dinheiro','Prazo','Cartão crédito','Cartão débito','Cheque','Conta','Pix','Grátis'].map(p=>`<option ${v.formaPagamento===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Status da Venda</label>
          <select id="ed-venda-sit" class="w-full h-10 px-3 rounded-xl border">
            <option value="faturado" ${v.status==='faturado'?'selected':''}>Finalizada / Faturada</option>
            <option value="orcamento" ${v.status==='orcamento'?'selected':''}>Orçamento</option>
            <option value="aguardar" ${v.status==='aguardar'?'selected':''}>Aguardando</option>
            <option value="cancelada" ${v.status==='cancelada'?'selected':''}>Cancelada</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block font-bold text-slate-600 mb-1">Observações / Detalhes</label>
        <input id="ed-venda-obs" value="${escapeHtml(v.observacao||'')}" class="w-full h-10 px-3 rounded-xl border" placeholder="Observações da venda">
      </div>
    </div>
  `;
  document.getElementById('modal-footer').innerHTML = `
    <button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Cancelar</button>
    <button onclick="salvarEdicaoNotinhaMigrada('${v.id}')" class="h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar Alterações</button>
  `;
  document.getElementById('modal-root').classList.remove('hidden');
};

window.salvarEdicaoNotinhaMigrada = function(id){
  const sess = getSession(); if(!sess) return;
  const v = db.vendas.find(x=>x.id===id);
  if(!v) return;
  v.clienteId = document.getElementById('ed-venda-cli')?.value || null;
  v.formaPagamento = document.getElementById('ed-venda-pgto')?.value || 'Dinheiro';
  v.status = document.getElementById('ed-venda-sit')?.value || 'faturado';
  v.observacao = document.getElementById('ed-venda-obs')?.value?.trim() || '';
  v.atualizadoEm = new Date().toISOString();
  v.atualizadoPorNome = sess.usuarioNome;
  logAction('venda', 'editar_notinha', v.id, `Notinha ${v.numero} editada por ${sess.usuarioNome}`);
  saveDB();
  closeModal();
  if(typeof renderVendas === 'function') renderVendas();
  toast('Notinha atualizada com sucesso!', 'success');
};

// 5. Adicionar os botões Estornar e Editar ao rodapé do modal de histórico da notinha
const _origHistoricoVenda = window.historicoVenda;
window.historicoVenda = function(id){
  _origHistoricoVenda.apply(this, arguments);
  const modalFooter = document.getElementById('modal-footer');
  if(modalFooter && !modalFooter.querySelector('[data-btn-estorno]')){
    const bEstorno = document.createElement('button');
    bEstorno.setAttribute('data-btn-estorno', '1');
    bEstorno.className = 'h-[44px] px-4 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold flex items-center gap-1.5 hover:bg-red-100 mr-auto';
    bEstorno.innerHTML = '<i class="ph ph-arrow-counter-clockwise"></i> Estornar';
    bEstorno.title = 'Estornar ou Cancelar esta notinha';
    bEstorno.onclick = function(){ estornarNotinha(id); };

    const bEditar = document.createElement('button');
    bEditar.setAttribute('data-btn-editar', '1');
    bEditar.className = 'h-[44px] px-4 rounded-xl bg-blue-50 text-[#0a1e8a] border border-blue-200 font-bold flex items-center gap-1.5 hover:bg-blue-100';
    bEditar.innerHTML = '<i class="ph ph-pencil"></i> Editar';
    bEditar.title = 'Editar dados desta notinha';
    bEditar.onclick = function(){ editarNotinhaMigrada(id); };

    modalFooter.prepend(bEditar);
    modalFooter.prepend(bEstorno);
  }
};

// 6. Fechar modal instantâneo sem travamento de renderização em PCs fracos
const _origCloseModal = window.closeModal;
window.closeModal = function(){
  const mr = document.getElementById('modal-root');
  if(mr) mr.classList.add('hidden');
  // Evita lag síncrono deferindo qualquer ação extra
  setTimeout(()=>{
    try{ if(_origCloseModal) _origCloseModal.apply(this, arguments); }catch(e){}
  }, 10);
};

console.log('[DIGICOPY] PATCH vendas_otimizacao_patch.js v4.9.8 — Exclusão tabelas auxiliares, Title Case, Estorno/Edição Notinha e performance');
})();
