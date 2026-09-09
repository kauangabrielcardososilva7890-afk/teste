// ═══════════════════════════════════════════════════════════════════════════
// ajustes_v5243_cliente_abas_patch.js — v5.24.3
//
// Item 5.2 do relatório: o cadastro do cliente ganha ABAS —
//   [Dados] (o formulário de sempre) | [Vendas] | [Financeiro] |
//   [Orçamentos] | [Chamados] | [Leituras]
// Cada aba lista TUDO que existe daquele cliente no módulo correspondente.
//
// Item 5.2.1: clicar num item da listagem abre um RESUMO rápido; nele há o
// botão-atalho "Abrir no módulo", que fecha o cadastro e cai direto no
// módulo de origem daquele dado (a venda na tela de Vendas, a conta no
// Financeiro já filtrada, o orçamento pronto na tela de Orçamentos, etc).
//
// Reforço 4.1: qualquer erro inesperado ao salvar o cliente NÃO fecha a tela
// e NÃO perde o digitado — mostra o motivo exato num aviso vermelho.
// ═══════════════════════════════════════════════════════════════════════════

// ── núcleo puro (testável no Node, sem tela) ────────────────────────────────
const CLITAB_PURE = {
  filtra: function(db, colecao, clienteId, empresaId){
    return (((db||{})[colecao])||[]).filter(function(x){
      return !!x && x.clienteId===clienteId && (!empresaId || x.empresaId===empresaId);
    });
  },
  contagens: function(db, clienteId, empresaId){
    const f=CLITAB_PURE.filtra;
    return {
      vendas:     f(db,'vendas',clienteId,empresaId).length,
      financeiro: f(db,'contasReceber',clienteId,empresaId).length,
      orcamentos: f(db,'orcamentos',clienteId,empresaId).length,
      chamados:   f(db,'os',clienteId,empresaId).length,
      leituras:   f(db,'leituras',clienteId,empresaId).length
    };
  },
  totalOrc: function(o){
    if(!o) return 0;
    if(typeof o.total==='number') return o.total;
    return ((o.itens)||[]).reduce(function(s,it){
      const sub=(it&&it.subtotal!=null)?Number(it.subtotal):(Number((it||{}).qtd)||0)*(Number((it||{}).preco)||0);
      return s+(isFinite(sub)?sub:0);
    },0);
  },
  ordenaPorDataDesc: function(lista, campoData){
    return (lista||[]).slice().sort(function(a,b){
      const da=new Date((a&&(a[campoData]||a.criadoEm||a.data))||0).getTime()||0;
      const dbb=new Date((b&&(b[campoData]||b.criadoEm||b.data))||0).getTime()||0;
      return dbb-da;
    });
  }
};
if(typeof module!=='undefined' && module.exports) module.exports = CLITAB_PURE;

(function(){
'use strict';
if(typeof window==='undefined') return;
window.CLITAB_PURE = CLITAB_PURE;

// ── formatadores com fallback (os oficiais moram no app.js) ────────────────
function _money(v){ try{ if(typeof fmtMoney==='function') return fmtMoney(v); }catch(e){} const n=Number(v||0); return 'R$ '+(isFinite(n)?n.toFixed(2).replace('.',','):String(v)); }
function _data(d){ try{ if(typeof fmtDate==='function') return fmtDate(d); }catch(e){} return String(d||'').slice(0,10); }
function _dataHora(d){ try{ if(typeof fmtDateTime==='function') return fmtDateTime(d); }catch(e){} return _data(d); }
function _esc(s){ try{ if(typeof escapeHtml==='function') return escapeHtml(String(s==null?'':s)); }catch(e){} return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function _sess(){ try{ return (typeof getSession==='function'?getSession():null)||{}; }catch(e){ return {}; } }
function _dbx(){ return (typeof db!=='undefined'&&db)||{}; }

const ABAS = [
  ['dados','Dados','ph-identification-card'],
  ['vendas','Vendas','ph-shopping-cart'],
  ['financeiro','Financeiro','ph-money'],
  ['orcamentos','Orçamentos','ph-file-text'],
  ['chamados','Chamados','ph-wrench'],
  ['leituras','Leituras','ph-gauge']
];

// ── barra de abas dentro do cadastro do cliente ─────────────────────────────
function montarAbasCliente(id){
  if(!id) return; // cadastro NOVO: ainda não existe histórico para listar
  if(typeof document==='undefined') return;
  const body=document.getElementById('modal-body'); if(!body) return;
  const anterior=(window.__clitab && window.__clitab.id===id) ? window.__clitab.aba : 'dados';
  window.__clitab={ id:id, empresaId:_sess().empresaId||'', aba:anterior||'dados', feitas:{} };

  // embrulha o formulário que a tela já montou como a aba "Dados"
  const paneDados=document.createElement('div');
  paneDados.id='clitab-pane-dados';
  while(body.firstChild) paneDados.appendChild(body.firstChild);

  const bar=document.createElement('div');
  bar.id='clitab-bar';
  bar.className='flex flex-wrap gap-1.5 mb-4 border-b pb-3';
  const holder=document.createElement('div');
  holder.id='clitab-holder';
  holder.appendChild(paneDados);
  ABAS.slice(1).forEach(function(a){
    const p=document.createElement('div');
    p.id='clitab-pane-'+a[0]; p.className='hidden';
    holder.appendChild(p);
  });
  body.appendChild(bar);
  body.appendChild(holder);

  window.clitabAbrir(window.__clitab.aba==='dados'?'dados':'dados');
  if(anterior && anterior!=='dados'){ try{ window.clitabAbrir(anterior); }catch(e){} }
}

function pintarBarra(){
  const st=window.__clitab; if(!st) return;
  const bar=document.getElementById('clitab-bar'); if(!bar) return;
  const n=CLITAB_PURE.contagens(_dbx(), st.id, st.empresaId);
  bar.innerHTML=ABAS.map(function(a){
    const ativo=st.aba===a[0];
    const rot=a[1]+(a[0]==='dados'?'':' <b>'+(n[a[0]]||0)+'</b>');
    return '<button type="button" onclick="clitabAbrir(\''+a[0]+'\')" class="h-9 px-4 rounded-xl text-[12px] font-bold flex items-center gap-1.5 '+(ativo?'bg-[#0a1e8a] text-white shadow':'bg-white border text-slate-600 hover:bg-slate-50')+'"><i class="ph '+a[2]+'"></i>'+rot+'</button>';
  }).join('');
}

window.clitabAbrir=function(aba){
  const st=window.__clitab; if(!st) return;
  st.aba=aba;
  ABAS.forEach(function(a){
    const p=document.getElementById('clitab-pane-'+a[0]);
    if(p) p.classList.toggle('hidden', a[0]!==aba);
  });
  // o botão Salvar só faz sentido na aba Dados
  const foot=document.getElementById('modal-footer');
  if(foot) foot.style.display=(aba==='dados')?'':'none';
  if(aba!=='dados' && !st.feitas[aba]){ renderAba(aba); st.feitas[aba]=true; }
  pintarBarra();
};

// ── listagens por aba ───────────────────────────────────────────────────────
function linha(tipo, id, colEsq, colDir, detalhe){
  return '<div onclick="clitabResumo(\''+tipo+'\',\''+id+'\')" class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border bg-white hover:bg-[#f4f6ff] hover:border-[#0a1e8a]/40 cursor-pointer transition">'
    +'<div class="min-w-0"><p class="font-semibold text-[12.5px] truncate">'+colEsq+'</p><p class="text-[11px] text-slate-500 truncate">'+detalhe+'</p></div>'
    +'<div class="text-right shrink-0"><b class="text-[12.5px]">'+colDir+'</b><p class="text-[10px] text-[#0a1e8a] font-bold">ver resumo ›</p></div></div>';
}
function vazioAba(rotulo){
  return '<div class="p-10 text-center text-slate-400 text-[12.5px]"><i class="ph ph-tray text-[26px] block mb-2 opacity-40"></i>Nenhum(a) '+rotulo+' para este cliente ainda.</div>';
}
function renderAba(aba){
  const st=window.__clitab; const pane=document.getElementById('clitab-pane-'+aba);
  if(!st||!pane) return;
  const banco=_dbx();
  const f=function(col){ return CLITAB_PURE.filtra(banco,col,st.id,st.empresaId); };
  let html='';
  if(aba==='vendas'){
    const list=CLITAB_PURE.ordenaPorDataDesc(f('vendas'),'data');
    html=list.map(function(v){
      return linha('venda',v.id, 'Nº '+_esc(v.numero||'-')+' — '+_data(v.data), _money(v.total), _esc(v.formaPagamento||'')+' • '+_esc(v.status||'')+' • por '+_esc(v.criadoPorNome||'-'));
    }).join('')||vazioAba('venda');
  }else if(aba==='financeiro'){
    const list=CLITAB_PURE.ordenaPorDataDesc(f('contasReceber'),'vencimento');
    html=list.map(function(c){
      return linha('financeiro',c.id, _esc(c.descricao||'-'), _money(c.valor), 'vence '+_data(c.vencimento)+' • '+_esc(c.status||'')+' • '+_esc(c.origem||''));
    }).join('')||vazioAba('conta a receber');
  }else if(aba==='orcamentos'){
    const list=CLITAB_PURE.ordenaPorDataDesc(f('orcamentos'),'data');
    html=list.map(function(o){
      return linha('orcamento',o.id, 'Nº '+_esc(o.numero||o.codigo||'-')+' — '+_data(o.data), _money(CLITAB_PURE.totalOrc(o)), _esc(o.status||'')+((o.observacao||o.obs)?' • '+_esc(String(o.observacao||o.obs).slice(0,50)):''));
    }).join('')||vazioAba('orçamento');
  }else if(aba==='chamados'){
    const list=CLITAB_PURE.ordenaPorDataDesc(f('os'),'dataAbertura');
    html=list.map(function(o){
      return linha('chamado',o.id, 'OS '+_esc(o.numero||'-')+' — '+_esc(o.tipo||''), _esc(o.prioridade||''), _esc(o.status||'')+' • '+_esc(String(o.descricao||'').slice(0,60)));
    }).join('')||vazioAba('chamado');
  }else if(aba==='leituras'){
    const list=CLITAB_PURE.ordenaPorDataDesc(f('leituras'),'dataLeitura');
    html=list.map(function(l){
      const eq=((banco.equipamentos)||[]).find(function(e){ return e.id===l.equipamentoId; })||{};
      return linha('leitura',l.id, _data(l.dataLeitura)+' — '+_esc(eq.modelo||'equipamento'), _money(l.valorExcedente), 'PB '+_esc(l.consumoPB!=null?l.consumoPB:'-')+' • COR '+_esc(l.consumoCor!=null?l.consumoCor:'-')+' • '+_esc(l.status||''));
    }).join('')||vazioAba('leitura');
  }
  pane.innerHTML='<div class="space-y-2 max-h-[60vh] overflow-auto pr-1">'+html+'</div>';
}

// ── 5.2.1 resumo rápido + botão-atalho para o módulo de origem ─────────────
function campo(rotulo, valor){
  return '<div class="flex justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0 text-[12.5px]"><span class="text-slate-500">'+rotulo+'</span><b class="text-right text-slate-800">'+_esc((valor==null||valor==='')?'—':valor)+'</b></div>';
}
window.clitabResumo=function(tipo, id){
  const banco=_dbx();
  let titulo='', camposHtml='';
  if(tipo==='venda'){
    const v=((banco.vendas)||[]).find(function(x){return x.id===id;}); if(!v) return;
    titulo='🧾 Venda '+_esc(v.numero||'');
    camposHtml=campo('Data',_dataHora(v.data))+campo('Total',_money(v.total))+campo('Pagamento',v.formaPagamento)+campo('Status',v.status)+campo('Itens',(v.itens||[]).length)+campo('Criada por',v.criadoPorNome);
  }else if(tipo==='financeiro'){
    const c=((banco.contasReceber)||[]).find(function(x){return x.id===id;}); if(!c) return;
    titulo='💰 '+_esc(c.descricao||'Conta a receber');
    window.__clitabBuscaFin=c.descricao||'';
    camposHtml=campo('Valor',_money(c.valor))+campo('Vencimento',_data(c.vencimento))+campo('Status',c.status)+campo('Origem',c.origem)+campo('Pago em',c.pagamentoData?_data(c.pagamentoData):'—');
  }else if(tipo==='orcamento'){
    const o=((banco.orcamentos)||[]).find(function(x){return x.id===id;}); if(!o) return;
    titulo='📄 Orçamento '+_esc(o.numero||o.codigo||'');
    camposHtml=campo('Data',_data(o.data))+campo('Total',_money(CLITAB_PURE.totalOrc(o)))+campo('Status',o.status)+campo('Observação',String(o.observacao||o.obs||'').slice(0,80));
  }else if(tipo==='chamado'){
    const o=((banco.os)||[]).find(function(x){return x.id===id;}); if(!o) return;
    titulo='🔧 Chamado '+_esc(o.numero||'');
    camposHtml=campo('Tipo',o.tipo)+campo('Prioridade',o.prioridade)+campo('Status',o.status)+campo('Abertura',_data(o.dataAbertura||o.criadoEm||o.data))+campo('Descrição',String(o.descricao||'').slice(0,90));
  }else if(tipo==='leitura'){
    const l=((banco.leituras)||[]).find(function(x){return x.id===id;}); if(!l) return;
    const eq=((banco.equipamentos)||[]).find(function(e){return e.id===l.equipamentoId;})||{};
    titulo='🖨️ Leitura '+_data(l.dataLeitura);
    camposHtml=campo('Equipamento',eq.modelo||'—')+campo('PB',_esc(l.contadorPBAnterior)+' → '+_esc(l.contadorPB))+campo('COR',_esc(l.contadorCorAnterior)+' → '+_esc(l.contadorCor))+campo('Consumo',_esc(l.consumoPB!=null?l.consumoPB:'-')+' PB • '+_esc(l.consumoCor!=null?l.consumoCor:'-')+' COR')+campo('Excedente',_money(l.valorExcedente))+campo('Status',l.status);
  }else return;

  window.clitabFecharResumo();
  const ov=document.createElement('div');
  ov.id='clitab-resumo';
  ov.className='fixed inset-0 z-[90] bg-slate-900/50 flex items-center justify-center p-4';
  ov.innerHTML='<div class="w-full max-w-[430px] rounded-2xl bg-white shadow-2xl p-5 animate-slideIn">'
    +'<div class="flex items-start justify-between gap-3 mb-3"><h3 class="font-bold text-[15px] text-[#0a1e8a]">'+titulo+'</h3>'
    +'<button type="button" onclick="clitabFecharResumo()" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-400"><i class="ph ph-x"></i></button></div>'
    +'<div class="rounded-xl border bg-[#f8f9ff] px-3 py-1">'+camposHtml+'</div>'
    +'<div class="mt-4 grid grid-cols-2 gap-2">'
    +'<button type="button" onclick="clitabFecharResumo()" class="h-11 rounded-xl bg-white border font-semibold text-[13px]">Fechar</button>'
    +'<button type="button" onclick="clitabIrModulo(\''+tipo+'\',\''+id+'\')" class="h-11 rounded-xl bg-[#0a1e8a] text-white font-bold text-[13px]"><i class="ph ph-arrow-square-out"></i> Abrir no módulo</button>'
    +'</div></div>';
  ov.addEventListener('click',function(ev){ if(ev.target===ov) window.clitabFecharResumo(); });
  document.body.appendChild(ov);
};
window.clitabFecharResumo=function(){
  const ov=document.getElementById('clitab-resumo'); if(ov) ov.remove();
};
window.clitabIrModulo=function(tipo, id){
  window.clitabFecharResumo();
  try{ if(typeof closeModal==='function') closeModal(); }catch(e){}
  function depois(ms,fn){ setTimeout(function(){ try{ fn(); }catch(e){} },ms); }
  if(tipo==='venda'){
    if(typeof navigateTo==='function') navigateTo('vendas');
    depois(200,function(){ if(typeof window.showVenda==='function') window.showVenda(id); });
  }else if(tipo==='financeiro'){
    if(typeof navigateTo==='function') navigateTo('financeiro');
    depois(250,function(){
      if(typeof setFinTab==='function') setFinTab('receber');
      const b=document.getElementById('search-cr');
      if(b && window.__clitabBuscaFin!=null){ b.value=window.__clitabBuscaFin; if(typeof renderFinanceiro==='function') renderFinanceiro(); }
    });
  }else if(tipo==='orcamento'){
    const o=((_dbx().orcamentos)||[]).find(function(x){return x.id===id;});
    if(o && typeof window.abrirTelaOrcamento==='function') window.abrirTelaOrcamento(o);
    else if(typeof navigateTo==='function') navigateTo('orcamentos');
  }else if(tipo==='chamado'){
    if(typeof navigateTo==='function') navigateTo('manutencao');
    depois(200,function(){ if(typeof openModal==='function') openModal('os',id); });
  }else if(tipo==='leitura'){
    if(typeof navigateTo==='function') navigateTo('leituras');
    depois(200,function(){ if(typeof openModal==='function') openModal('leitura',id); });
  }
};

// ── conexão com o cadastro (embrulha a montagem do modal do cliente) ───────
if(typeof window.renderModalCliente==='function' && !window.renderModalCliente.__v5243){
  const _renderCli=window.renderModalCliente;
  window.renderModalCliente=function(id){
    const r=_renderCli.apply(this,arguments);
    try{ montarAbasCliente(id); }catch(e){}
    return r;
  };
  window.renderModalCliente.__v5243=true;
}

// ── reforço 4.1: salvar NUNCA fecha a tela nem perde o digitado por erro ───
if(typeof window.saveCliente==='function' && !window.saveCliente.__v5243){
  const _saveCli=window.saveCliente;
  window.saveCliente=function(){
    try{ return _saveCli.apply(this,arguments); }
    catch(e){
      try{ if(typeof toast==='function') toast('Não consegui salvar: '+((e&&e.message)||e)+' — os dados continuam na tela. Me avise essa mensagem!', 'error'); }catch(_){}
      try{ if(window.console&&console.error) console.error('[DIGICOPY][saveCliente]',e); }catch(_){}
    }
  };
  window.saveCliente.__v5243=true;
}

// ── 4.1 RAIZ (cenário exato do dono): "escolho o cliente, vou adicionar um
// item e pede pra escolher o cliente; dá cliente não encontrado" ────────────
// A ponte automática pós-cadastro chamava a função da tela ANTIGA de venda
// (selectClienteVenda, ids nv-*), que NÃO existe mais: ela estourava na
// primeira linha de tela e o cliente recém-escolhido/cadastrado NUNCA era
// amarrado na venda VOS (a tela atual, ids vos-*). Resultado: na hora de
// lançar item ou salvar, a venda achava que não tinha cliente.
// Ponte 1: qualquer chamada à seleção antiga é desviada para a tela VOS.
if(typeof window.selectClienteVenda==='function' && !window.selectClienteVenda.__v5243){
  const _selClienteLegado = window.selectClienteVenda;
  window.selectClienteVenda = function(id){
    try{
      const telaVosAberta = (typeof document!=='undefined') && document.getElementById('vos-codigo');
      if(telaVosAberta && typeof window.vosVendaSelectCliente==='function'){
        window.vosVendaSelectCliente(id);
        return;
      }
    }catch(e){}
    try{ return _selClienteLegado.apply(this, arguments); }catch(e){}
  };
  window.selectClienteVenda.__v5243 = true;
}
// Ponte 2: a seleção da VOS nunca pode sair sem amarrar o cliente — se a
// parte visual falhar (qualquer erro bobo), o vínculo é refeito por segurança.
if(typeof window.vosVendaSelectCliente==='function' && !window.vosVendaSelectCliente.__v5243){
  const _selClienteVos = window.vosVendaSelectCliente;
  window.vosVendaSelectCliente = function(id){
    try{ _selClienteVos.apply(this, arguments); }catch(e){}
    try{
      const c = ((typeof db!=='undefined' && db.clientes)||[]).find(function(x){ return x && x.id===id; });
      if(c && window.__vosForm && !window.__vosForm.cliente){ window.__vosForm.cliente = c; }
    }catch(e){}
  };
  window.vosVendaSelectCliente.__v5243 = true;
}

try{ console.log('[DIGICOPY] v5.24.3 — cadastro do cliente com abas (Vendas/Financeiro/Orçamentos/Chamados/Leituras) + resumo com atalho + ponte cliente↔venda (4.1)'); }catch(e){}
})();
