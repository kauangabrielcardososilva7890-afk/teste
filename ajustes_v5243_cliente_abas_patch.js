// ═══════════════════════════════════════════════════════════════════════════
// ajustes_v5243_cliente_abas_patch.js — v5.24.3
//
// Item 5.2 do relatório: o cadastro do cliente ganha ABAS —
//   [Dados] (o formulário de sempre) | [Vendas] | [Financeiro] |
//   [Orçamentos] | [Chamados] | [Leituras]
// Cada aba lista TUDO que existe daquele cliente no módulo correspondente.
//
// v5.24.4 (redesenho dele): abas = [Dados] e [Histórico do sistema]; dentro
// do Histórico há sub-menus (Vendas por padrão, Financeiro, Orçamentos,
// Chamados, Leituras). A listagem tem caixas de múltipla escolha com botões
// Excluir / Extornar / Abrir lista de origem; o registro específico abre com
// o BOTÃO DIREITO do mouse direto no módulo de origem. (O resumo intermediário
// da v5.24.3 foi aposentado a pedido dele.)
//
// Reforço 4.1: qualquer erro inesperado ao salvar o cliente NÃO fecha a tela
// e NÃO perde o digitado — mostra o motivo exato num aviso vermelho.
//
// v5.24.5 (nova rodada dele):
//  • Excluir é DE VEZ (some da tela, do PC e da nuvem — orçamento inclusive,
//    sem marca-fantasma); o que estava excluído NUNCA mais aparece na lista;
//  • cada linha mostra o STATUS igual ao módulo de origem (Salva, Faturada,
//    Estornada, Em aberto...);
//  • a ficha sempre abre em Dados — o botão Salvar nunca mais some;
//  • clicar num registro que já não existe atualiza a lista e avisa, em vez
//    de abrir o módulo às cegas;
//  • 4.1 curado de vez: a busca de cliente da venda refaz o índice sozinha
//    quando a base troca por baixo, e o clique se CURA com o dado da própria
//    busca (1ª tentativa não falha mais).
// ═══════════════════════════════════════════════════════════════════════════

// ── núcleo puro (testável no Node, sem tela) ────────────────────────────────
const CLITAB_PURE = {
  filtra: function(db, colecao, clienteId, empresaId){
    return (((db||{})[colecao])||[]).filter(function(x){
      if(!x || x.clienteId!==clienteId || (empresaId && x.empresaId!==empresaId)) return false;
      if(x.deletedAt || x.excluido===true) return false;                 // v5.24.5: apagado de vez não aparece
      if(String(x.status||'').toLowerCase()==='excluido') return false;  // idem marcações antigas
      return true;
    });
  },
  // rótulo + cor do status IGUAIS ao módulo de origem (v5.24.5)
  chipStatus: function(status){
    const s=String(status==null||status===''?'salvo':status).toLowerCase();
    const map={faturado:['Faturada','bg-green-100 text-green-700'],faturada:['Faturada','bg-green-100 text-green-700'],pago:['Pago','bg-green-100 text-green-700'],quitado:['Pago','bg-green-100 text-green-700'],finalizado:['Finalizado','bg-green-100 text-green-700'],aprovado:['Aprovado','bg-green-100 text-green-700'],estornada:['Estornada','bg-amber-100 text-amber-700'],estornado:['Estornado','bg-amber-100 text-amber-700'],aguardando:['Aguardando','bg-amber-100 text-amber-700'],andamento:['Em andamento','bg-amber-100 text-amber-700'],analise:['Em análise','bg-amber-100 text-amber-700'],vencido:['Vencido','bg-red-100 text-red-700'],cancelado:['Cancelado','bg-red-100 text-red-700'],orcamento:['Orçamento','bg-sky-100 text-sky-700'],aberto:['Em aberto','bg-blue-100 text-blue-700'],aberta:['Aberta','bg-blue-100 text-blue-700'],salvo:['Salva','bg-blue-100 text-blue-700'],rascunho:['Salva','bg-blue-100 text-blue-700'],pendente:['Pendente','bg-blue-100 text-blue-700']};
    return map[s]||[String(status),'bg-slate-100 text-slate-600'];
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
function chipStatusHtml(status){ const m=CLITAB_PURE.chipStatus(status); return '<span class="px-1.5 py-0.5 rounded '+m[1]+' font-bold text-[10px] uppercase tracking-wide shrink-0">'+_esc(m[0])+'</span>'; }
function _dbx(){ return (typeof db!=='undefined'&&db)||{}; }

const ABAS = [
  ['dados','Dados','ph-identification-card'],
  ['historico','Histórico do sistema','ph-clock-counter-clockwise']
];
// 5.2.2 — dentro do Histórico, os sub-menus; por padrão abre em VENDAS.
const SUBABAS = [
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
  const anterior=(window.__clitab && window.__clitab.id===id) ? window.__clitab : null;
  // v5.24.5: a ficha SEMPRE abre em Dados (o botão Salvar nunca some de novo);
  // só o sub-menu do Histórico lembra a última escolha — isso não esconde botão.
  window.__clitab={ id:id, empresaId:_sess().empresaId||'', aba:'dados', sub:(anterior&&anterior.sub)||'vendas', sel:{}, feitas:{} };

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

  const paneHist=document.createElement('div');
  paneHist.id='clitab-pane-historico';
  paneHist.className='hidden';
  paneHist.innerHTML=
    '<div id="clitab-subbar" class="flex flex-wrap gap-1.5 mb-3"></div>'+
    '<div id="clitab-sub-holder"></div>'+
    '<div id="clitab-acoes" class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">'+
      '<button type="button" id="clitab-btn-excluir" onclick="clitabExcluir()" class="h-9 px-4 rounded-xl bg-white border border-red-200 text-red-600 font-bold text-[12px] disabled:opacity-40" disabled><i class="ph ph-trash"></i> Excluir selecionados</button>'+
      '<button type="button" id="clitab-btn-extornar" onclick="clitabExtornar()" class="h-9 px-4 rounded-xl bg-amber-500 text-white font-bold text-[12px] disabled:opacity-40" disabled><i class="ph ph-arrow-u-up-left"></i> Extornar selecionados</button>'+
      '<button type="button" id="clitab-btn-lista" onclick="clitabAbrirLista()" class="h-9 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]"><i class="ph ph-arrow-square-out"></i> Abrir lista de origem</button>'+
      '<button type="button" onclick="clitabAbrirClienteNaLista()" class="h-9 px-4 rounded-xl bg-white border border-[#0a1e8a] text-[#0a1e8a] font-bold text-[12px]"><i class="ph ph-users"></i> Este cliente na lista</button>'+
      '<span class="text-[11px] text-slate-400 ml-auto">Marque as caixas para agir em lote • botão direito do mouse abre o registro no módulo</span>'+
    '</div>';
  holder.appendChild(paneHist);

  body.appendChild(bar);
  body.appendChild(holder);

  window.clitabAbrir('dados');
}


function pintarBarra(){
  const st=window.__clitab; if(!st) return;
  const bar=document.getElementById('clitab-bar'); if(!bar) return;
  bar.innerHTML=ABAS.map(function(a){
    const ativo=st.aba===a[0];
    return '<button type="button" onclick="clitabAbrir(\''+a[0]+'\')" class="h-9 px-4 rounded-xl text-[12px] font-bold flex items-center gap-1.5 '+(ativo?'bg-[#0a1e8a] text-white shadow':'bg-white border text-slate-600 hover:bg-slate-50')+'"><i class="ph '+a[2]+'"></i>'+a[1]+'</button>';
  }).join('');
}

function pintarSubBarra(){
  const st=window.__clitab; if(!st) return;
  const bar=document.getElementById('clitab-subbar'); if(!bar) return;
  const n=CLITAB_PURE.contagens(_dbx(), st.id, st.empresaId);
  bar.innerHTML=SUBABAS.map(function(a){
    const ativo=st.sub===a[0];
    return '<button type="button" onclick="clitabSub(\''+a[0]+'\')" class="h-8 px-3 rounded-xl text-[11.5px] font-bold flex items-center gap-1.5 '+(ativo?'bg-[#0a1e8a] text-white shadow':'bg-white border text-slate-600 hover:bg-slate-50')+'"><i class="ph '+a[2]+'"></i>'+a[1]+' <b>'+(n[a[0]]||0)+'</b></button>';
  }).join('');
}

window.clitabAbrir=function(aba){
  const st=window.__clitab; if(!st) return;
  st.aba=aba;
  const pd=document.getElementById('clitab-pane-dados');
  const ph=document.getElementById('clitab-pane-historico');
  if(pd) pd.classList.toggle('hidden', aba!=='dados');
  if(ph) ph.classList.toggle('hidden', aba!=='historico');
  // o botão Salvar só faz sentido na aba Dados
  const foot=document.getElementById('modal-footer');
  if(foot) foot.style.display=(aba==='dados')?'':'none';
  if(aba==='historico'){ window.clitabSub(st.sub||'vendas'); } // 5.2.2: padrão = vendas
  pintarBarra();
};

window.clitabSub=function(sub){
  const st=window.__clitab; if(!st) return;
  st.sub=sub;
  st.sel[sub]=st.sel[sub]||{};
  renderSub(sub);            // v5.24.4: sempre fresco (exclusões/estornos)
  pintarSubBarra();
  const btnExt=document.getElementById('clitab-btn-extornar');
  if(btnExt) btnExt.style.display=(sub==='vendas')?'':'none';
  atualizarBotoes();
};

// ── listagem com caixas de múltipla escolha (5.2.1 novo modelo) ────────────
function linha(tipo, id, colEsq, colDir, detalhe){
  return '<div class="clitab-row flex items-center gap-2 px-2 py-2 rounded-xl border bg-white hover:bg-[#f4f6ff] transition cursor-pointer" '
    +'data-tipo="'+tipo+'" data-id="'+id+'" onclick="clitabToggleSel(this)" '
    +'oncontextmenu="event.preventDefault(); clitabAbrirRegistro(\''+tipo+'\',\''+id+'\')" '
    +'title="Botão direito do mouse: abrir este registro no módulo de origem">'
    +'<input type="checkbox" class="clitab-sel w-4 h-4 shrink-0 cursor-pointer" onclick="event.stopPropagation(); clitabToggleSel(this.parentNode, true)">'
    +'<div class="min-w-0 flex-1"><p class="font-semibold text-[12.5px] truncate">'+colEsq+'</p><p class="text-[11px] text-slate-500 truncate">'+detalhe+'</p></div>'
    +'<div class="text-right shrink-0"><b class="text-[12.5px]">'+colDir+'</b></div></div>';
}
function vazioAba(rotulo){
  return '<div class="p-10 text-center text-slate-400 text-[12.5px]"><i class="ph ph-tray text-[26px] block mb-2 opacity-40"></i>Nenhum(a) '+rotulo+' para este cliente ainda.</div>';
}
function renderSub(sub){
  const st=window.__clitab; const pane=document.getElementById('clitab-sub-holder');
  if(!st||!pane) return;
  const banco=_dbx();
  const f=function(col){ return CLITAB_PURE.filtra(banco,col,st.id,st.empresaId); };
  let html='';
  if(sub==='vendas'){
    const list=CLITAB_PURE.ordenaPorDataDesc(f('vendas'),'data');
    html=list.map(function(v){
      return linha('venda',v.id, 'Nº '+_esc(v.numero||'-')+' — '+_data(v.data), _money(v.total), chipStatusHtml(v.status)+' '+_esc(v.formaPagamento||'')+' • por '+_esc(v.criadoPorNome||'-'));
    }).join('')||vazioAba('venda');
  }else if(sub==='financeiro'){
    const list=CLITAB_PURE.ordenaPorDataDesc(f('contasReceber'),'vencimento');
    html=list.map(function(c){
      return linha('financeiro',c.id, _esc(c.descricao||'-'), _money(c.valor), chipStatusHtml(c.status)+' vence '+_data(c.vencimento)+' • '+_esc(c.origem||''));
    }).join('')||vazioAba('conta a receber');
  }else if(sub==='orcamentos'){
    const list=CLITAB_PURE.ordenaPorDataDesc(f('orcamentos'),'data');
    html=list.map(function(o){
      return linha('orcamento',o.id, 'Nº '+_esc(o.numero||o.codigo||'-')+' — '+_data(o.data), _money(CLITAB_PURE.totalOrc(o)), chipStatusHtml(o.status)+((o.observacao||o.obs)?' • '+_esc(String(o.observacao||o.obs).slice(0,50)):''));
    }).join('')||vazioAba('orçamento');
  }else if(sub==='chamados'){
    const list=CLITAB_PURE.ordenaPorDataDesc(f('os'),'dataAbertura');
    html=list.map(function(o){
      return linha('chamado',o.id, 'OS '+_esc(o.numero||'-')+' — '+_esc(o.tipo||''), _esc(o.prioridade||''), chipStatusHtml(o.status)+' '+_esc(String(o.descricao||'').slice(0,60)));
    }).join('')||vazioAba('chamado');
  }else if(sub==='leituras'){
    const list=CLITAB_PURE.ordenaPorDataDesc(f('leituras'),'dataLeitura');
    html=list.map(function(l){
      const eq=((banco.equipamentos)||[]).find(function(e){ return e.id===l.equipamentoId; })||{};
      return linha('leitura',l.id, _data(l.dataLeitura)+' — '+_esc(eq.modelo||'equipamento'), _money(l.valorExcedente), chipStatusHtml(l.status)+' PB '+_esc(l.consumoPB!=null?l.consumoPB:'-')+' • COR '+_esc(l.consumoCor!=null?l.consumoCor:'-'));
    }).join('')||vazioAba('leitura');
  }
  pane.innerHTML='<div class="space-y-2 max-h-[52vh] overflow-auto pr-1">'+html+'</div>';
}

// ── seleção múltipla + botões de lote ───────────────────────────────────────
window.clitabToggleSel=function(row, doCheckbox){
  try{
    const st=window.__clitab; if(!st||!row) return;
    const cb=row.querySelector('.clitab-sel'); if(!cb) return;
    const marcado = doCheckbox ? cb.checked : !cb.checked;
    cb.checked = marcado;
    row.classList.toggle('border-[#0a1e8a]', marcado);
    row.classList.toggle('bg-[#eef2ff]', marcado);
    const sub=st.sub; st.sel[sub]=st.sel[sub]||{};
    if(marcado) st.sel[sub][row.dataset.id]=true; else delete st.sel[sub][row.dataset.id];
    atualizarBotoes();
  }catch(e){}
};
function atualizarBotoes(){
  const st=window.__clitab; if(!st) return;
  const n=Object.keys(st.sel[st.sub]||{}).length;
  const be=document.getElementById('clitab-btn-excluir');
  const bx=document.getElementById('clitab-btn-extornar');
  if(be){ be.disabled=!n; be.innerHTML='<i class="ph ph-trash"></i> Excluir'+(n?' ('+n+')':' selecionados'); }
  if(bx){ bx.disabled=!n; bx.innerHTML='<i class="ph ph-arrow-u-up-left"></i> Extornar'+(n?' ('+n+')':' selecionados'); }
  const bl=document.getElementById('clitab-btn-lista');
  if(bl){ bl.innerHTML='<i class="ph ph-arrow-square-out"></i> '+(n?('Abrir selecionado(s) ('+n+')'):'Abrir lista de origem'); }
}
function logCli(acao,id,det){ try{ if(typeof logAction==='function') logAction('cliente-hist',acao,id,det); }catch(e){} }
function removerRegistro(sub, id){
  const banco=_dbx();
  if(sub==='venda'){
    const v=((banco.vendas)||[]).find(function(x){return String(x.id)===String(id);}); if(!v) return false;
    const stt=String(v.status||'').toLowerCase();
    if(/faturad|finalizad|conclu|pago/.test(stt)) return 'pula'; // faturada: só sai estornando antes (regra do sistema)
    try{ (v.itens||[]).forEach(function(it){ const p=((banco.produtos)||[]).find(function(x){return x.id===it.produtoId;}); if(p&&p.categoria!=='Serviço'&&p.categoria!=='Recarga') p.estoque=(p.estoque||0)+(Number(it.qtd)||0); }); }catch(e){}
    db.vendas=(banco.vendas||[]).filter(function(x){return x.id!==id;});
    logCli('excluir_venda',id,'Venda '+_esc(v.numero||'')+' excluída pela ficha do cliente');
    return true;
  }
  if(sub==='financeiro'){
    db.contasReceber=((banco.contasReceber)||[]).filter(function(x){return x.id!==id;});
    logCli('excluir_conta',id,'Conta a receber excluída pela ficha do cliente');
    return true;
  }
  if(sub==='orcamento'){
    const o=((banco.orcamentos)||[]).find(function(x){return String(x.id)===String(id);}); if(!o) return false;
    // v5.24.5 — ordem dele: deletar é DE VEZ. Sai daqui, a nuvem recebe o
    // comando de apagar e os outros PCs apagam também (sem marca-fantasma).
    db.orcamentos=(banco.orcamentos||[]).filter(function(x){return x.id!==id;});
    logCli('excluir_orcamento',id,'Orçamento excluído de vez pela ficha do cliente');
    return true;
  }
  if(sub==='chamado'){
    const o=((banco.os)||[]).find(function(x){return String(x.id)===String(id);}); if(!o) return false;
    db.os=(banco.os||[]).filter(function(x){return x.id!==id;});
    logCli('excluir_chamado',id,'Chamado excluído pela ficha do cliente');
    return true;
  }
  if(sub==='leitura'){
    const l=((banco.leituras)||[]).find(function(x){return String(x.id)===String(id);}); if(!l) return false;
    db.leituras=(banco.leituras||[]).filter(function(x){return x.id!==id;});
    logCli('excluir_leitura',id,'Leitura excluída pela ficha do cliente');
    return true;
  }
  return false;
}
window.clitabExcluir=function(){
  const st=window.__clitab; if(!st) return;
  const sub=st.sub;
  const ids=Object.keys(st.sel[sub]||{}); if(!ids.length) return;
  const pergunta='Excluir '+ids.length+' registro(s) marcado(s) de '+sub+'? É DE VEZ: some da tela, deste PC e dos outros PCs pela nuvem.';
  function executar(){
    // v5.24.6 — avisa o motor da nuvem que a exclusão é INTENCIONAL: se um
    // puxão trouxer o registro de volta nos próximos 60s, ele é apagado de
    // novo automaticamente (era o "não exclui" da foto 3).
    try{ if(window.DIGICOPY_EXCLUSAO_INTENCIONAL) window.DIGICOPY_EXCLUSAO_INTENCIONAL(); }catch(_){}
    let feitos=0, pulados=0;
    ids.forEach(function(id){
      try{ const r=removerRegistro(sub==='vendas'?'venda':sub==='financeiro'?'financeiro':sub==='orcamentos'?'orcamento':sub==='chamados'?'chamado':'leitura', id); if(r===true)feitos++; else pulados++; }
      catch(e){ pulados++; }
    });
    st.sel[sub]={};
    try{ if(typeof saveDB==='function') saveDB(); }catch(e){}
    try{ if(window.DIGICOPY_CLOUD_SYNC&&window.DIGICOPY_CLOUD_SYNC.tick) window.DIGICOPY_CLOUD_SYNC.tick('ficha-exclui'); }catch(_){}
    try{ if(sub==='vendas'&&typeof renderVendas==='function') renderVendas(); }catch(e){}
    try{ if(sub==='financeiro'&&typeof renderFinanceiro==='function') renderFinanceiro(); }catch(e){}
    // v5.24.11 — varre os fantasmas das telas dos módulos: sem isso, a tela de
    // Orçamentos/Chamados/Leituras ficava mostrando linha já apagada, e o
    // clique nela caía no aviso "não achei" (o 4.2 da foto).
    try{ if(sub==='orcamentos'&&typeof window.renderOrcamentos==='function') window.renderOrcamentos(); }catch(e){}
    try{ if(sub==='chamados'&&typeof renderOs==='function') renderOs(); }catch(e){}
    try{ if(sub==='leituras'&&typeof renderLeituras==='function') renderLeituras(); }catch(e){}
    window.clitabSub(sub);
    if(typeof toast==='function') toast(feitos+' excluído(s) de vez'+(pulados?(' • '+pulados+' pulado(s)'+(sub==='vendas'?' — faturada só sai estornando antes':' — já não estava neste PC (lista atualizada)')) : ''), feitos?'success':'info');
  }
  // popup do PRÓPRIO sistema (pedido dele — nunca o cinza do navegador)
  if(typeof window.confirmSistema==='function'){ window.confirmSistema(pergunta,'Excluir de vez').then(function(ok){ if(ok) executar(); }); return; }
  if(typeof confirm==='function' && confirm(pergunta)) executar();
};
window.clitabExtornar=function(){
  const st=window.__clitab; if(!st||st.sub!=='vendas') return;
  const ids=Object.keys(st.sel.vendas||{}); if(!ids.length) return;
  if(typeof window.confirmSistema==='function'){ window.confirmSistema('Estornar '+ids.length+' venda(s) faturada(s)? O financeiro ligado a elas é marcado como estornado.','Estornar').then(function(ok){ if(ok) window.__clitabExtornarAgora(ids); }); return; }
  window.__clitabExtornarAgora(ids);
};
window.__clitabExtornarAgora=function(ids){
  const st=window.__clitab; if(!st) return;
  let feitas=0, puladas=0;
  ids.forEach(function(id){
    const v=((_dbx().vendas)||[]).find(function(x){return String(x.id)===String(id);});
    const stt=String((v&&v.status)||'').toLowerCase();
    if(stt!=='faturado' || typeof window.estornarVenda!=='function'){ puladas++; return; }
    try{ window.estornarVenda(id); feitas++; }catch(e){ puladas++; }
  });
  st.sel.vendas={};
  try{ if(typeof renderVendas==='function') renderVendas(); }catch(e){}
  window.clitabSub('vendas');
  if(typeof toast==='function') toast(feitas+' venda(s) estornada(s)'+(puladas?' • '+puladas+' pulada(s) (só faturadas estornam)':''), feitas?'success':'info');
};

// ── atalhos para o módulo de origem ─────────────────────────────────────────
window.clitabAbrirLista=function(){
  const st=window.__clitab; if(!st) return;
  const cli=((_dbx().clientes)||[]).find(function(x){return x.id===st.id;})||{};
  const sub=st.sub;
  const ids=Object.keys(st.sel[sub]||{});
  try{ if(typeof closeModal==='function') closeModal(); }catch(e){}
  // v5.24.11 — TRAVA DE SEGURANÇA: antes, qualquer sub desconhecido caía no
  // 'senão' e o botão abria LEITURAS sem avisar (a "lista errada"). Agora só
  // navega com sub conhecido; fora disso, explica e fica quieto.
  if(sub!=='vendas'&&sub!=='financeiro'&&sub!=='orcamentos'&&sub!=='chamados'&&sub!=='leituras'){
    if(typeof toast==='function') toast('Essa parte não tem lista de origem — use uma das abas do Histórico.', 'info');
    return;
  }
  if(typeof navigateTo==='function') navigateTo(sub==='vendas'?'vendas':sub==='financeiro'?'financeiro':sub==='orcamentos'?'orcamentos':sub==='chamados'?'manutencao':'leituras');
  setTimeout(function(){
    try{
      // o módulo abre já filtrado pelo cliente: a lista mostra o grupo escolhido
      if(sub==='vendas'){ const b=document.getElementById('search-vendas'); if(b&&cli.nome){ b.value=cli.nome; if(typeof renderVendas==='function') renderVendas(); } }
      else if(sub==='financeiro'){ if(typeof setFinTab==='function') setFinTab('receber'); const b=document.getElementById('search-cr'); if(b&&cli.nome){ b.value=cli.nome; if(typeof renderFinanceiro==='function') renderFinanceiro(); } }
      else if(sub==='chamados'){ const b=document.getElementById('search-os'); if(b&&cli.nome){ b.value=cli.nome; if(typeof renderOs==='function') renderOs(); } }
    }catch(e){}
    // v5.24.11 — pedido dele: "abrir já mostrando aquilo que eu escolhi".
    // 1 marcado: abre o registro. Vários: módulo filtrado + o 1º abre na hora.
    // v5.24.11 — correção dele: NÃO abrir nenhum registro por cima da lista.
    // Quem mostra o escolhido é A PRÓPRIA LISTA DO MÓDULO, só com as linhas
    // marcadas (1, vários ou todos). A notinha/o orçamento abrem só se ELE
    // clicar neles ali na lista.
    if(ids.length){ setTimeout(function(){ try{ window.clitabRenderSoSelecionados(sub, ids); }catch(e){} }, 320); }
  },250);
};

// v5.24.11 — pedido dele: "o clientes não abre a lista que mostra os que eu
// quero". Espelho do Abrir lista de origem: sai da ficha direto para o módulo
// CLIENTES, já filtrado por este cadastro — a lista mostra ele (e quem tiver
// nome parecido, um grupinho só, para achar "os que eu quero" de uma vez).
window.clitabAbrirClienteNaLista=function(){
  const st=window.__clitab; if(!st) return;
  const cli=((_dbx().clientes)||[]).find(function(x){return x.id===st.id;})||{};
  try{ if(typeof closeModal==='function') closeModal(); }catch(e){}
  if(typeof navigateTo==='function') navigateTo('clientes');
  setTimeout(function(){
    try{
      const b=document.getElementById('search-clientes');
      const q=String((cli&&(cli.nome||cli.razao||cli.fantasia||cli.codigo))||'').trim();
      if(b&&q){ b.value=q; if(typeof renderClientes==='function') renderClientes(); }
    }catch(e){}
  },250);
};

// v5.24.11 — A LISTA SÓ COM O QUE ELE MARCOU (pedido dele, literal: "quero
// que abra onde é a lista que mostra todos, mas só mostrando os selecionados
// que eu pedi"). O truque: o tanque do módulo é trocado por uma versão só com
// os selecionados, a lista é desenhada, e o tanque volta inteiro. Os registros
// são os MESMOS objetos (nada se perde), e durante a troca a gravação
// automática fica de molho — o banco nunca é salvo pela metade. Depois, no
// próximo desenho natural da lista (digitou na busca, navegou), ela volta a
// mostrar o grupo do cliente, como sempre.
window.clitabRenderSoSelecionados=function(sub, ids){
  const MAP={
    vendas:{arr:'vendas', render:function(){ if(typeof renderVendas==='function') renderVendas(); }},
    financeiro:{arr:'contasReceber', render:function(){ if(typeof renderFinanceiro==='function') renderFinanceiro(); }},
    orcamentos:{arr:'orcamentos', render:function(){ if(typeof window.renderOrcamentos==='function') window.renderOrcamentos(); }},
    chamados:{arr:'os', render:function(){ if(typeof renderOs==='function') renderOs(); }},
    leituras:{arr:'leituras', render:function(){ if(typeof renderLeituras==='function') renderLeituras(); }}
  };
  const def=MAP[sub]; if(!def) return;
  const want={}; (ids||[]).forEach(function(i){ want[String(i)]=true; });
  const _db=_dbx(); if(!_db||!Array.isArray(_db[def.arr])) return;
  const orig=_db[def.arr];
  const sdB=window.saveDB, sdA=window.saveDBAgora;
  try{ window.saveDB=function(){}; window.saveDBAgora=function(){}; }catch(e){}
  _db[def.arr]=orig.filter(function(x){ return x && want[String(x.id)]; });
  try{ def.render(); }
  finally{
    _db[def.arr]=orig;
    if(typeof sdB==='function') window.saveDB=sdB;
    if(typeof sdA==='function') window.saveDBAgora=sdA;
  }
};

// botão direito na linha: abre o REGISTRO ESPECÍFICO no módulo de origem
window.clitabAbrirRegistro=function(tipo, id){
  // v5.24.6/7 — valida na hora do clique: se a nuvem trocou a base depois da
  // lista aparecer, atualiza e avisa em vez de abrir o módulo às cegas.
  try{
    const col=(tipo==='venda')?'vendas':(tipo==='financeiro')?'contasReceber':(tipo==='orcamento')?'orcamentos':(tipo==='chamado')?'os':'leituras';
    const existe=(((_dbx())[col])||[]).find(function(x){ return x && String(x.id)===String(id); });
    if(!existe){
      try{ const st=window.__clitab; if(st) window.clitabSub(st.sub||'vendas'); }catch(e){}
      if(typeof toast==='function') toast('Esse registro já não existe mais neste PC — a lista foi atualizada.','info');
      return;
    }
  }catch(e){}
  try{ if(typeof closeModal==='function') closeModal(); }catch(e){}
  window.clitabAbrirDireto(tipo, id, false);
};

// v5.24.11 — O ABRIDOR DIRETO: abre o REGISTRO ESPECÍFICO no módulo de origem,
// sempre pelo OBJETO (nunca re-caça por id na tela — adeus, fantasma 4.2).
// silencioso=true: veio do "Abrir selecionados" (o módulo já foi aberto e filtrado).
window.clitabAbrirDireto=function(tipo, id, silencioso){
  const Dx=_dbx();
  function acha(col){ return ((Dx[col])||[]).find(function(x){ return x && String(x.id)===String(id); }); }
  function depois(ms,fn){ setTimeout(function(){ try{ fn(); }catch(e){} },ms); }
  function fantasma(){
    try{ const st=window.__clitab; if(st) window.clitabSub(st.sub||'vendas'); }catch(e){}
    if(typeof toast==='function') toast('Esse registro já não existe mais neste PC — a lista foi atualizada.','info');
    return false;
  }
  if(tipo==='venda'||tipo==='vendas'){
    const v=acha('vendas'); if(!v) return fantasma();
    if(!silencioso && typeof navigateTo==='function') navigateTo('vendas');
    depois(silencioso?10:200,function(){ if(typeof window.showVenda==='function') window.showVenda(v.id); });
    return true;
  }
  if(tipo==='financeiro'){
    const c=acha('contasReceber'); if(!c) return fantasma();
    if(!silencioso && typeof navigateTo==='function') navigateTo('financeiro');
    depois(silencioso?10:250,function(){
      if(typeof setFinTab==='function') setFinTab('receber');
      // abre a conta de verdade (pedido dele: não só o menu)
      if(typeof openModal==='function') openModal('contaReceber', c.id);
    });
    return true;
  }
  if(tipo==='orcamento'||tipo==='orcamentos'){
    const o=acha('orcamentos'); if(!o) return fantasma();
    // direto pelo objeto — não passa pelo caçador por id (o popup do 4.2)
    if(typeof window.abrirTelaOrcamento==='function') window.abrirTelaOrcamento(o);
    else if(typeof navigateTo==='function') navigateTo('orcamentos');
    return true;
  }
  if(tipo==='chamado'||tipo==='chamados'){
    const o=acha('os'); if(!o) return fantasma();
    if(!silencioso && typeof navigateTo==='function') navigateTo('manutencao');
    depois(silencioso?10:200,function(){ if(typeof openModal==='function') openModal('os', o.id); });
    return true;
  }
  const l=acha('leituras'); if(!l) return fantasma();
  if(!silencioso && typeof navigateTo==='function') navigateTo('leituras');
  depois(silencioso?10:200,function(){
    if(typeof window.abrirLeituraDetalhada==='function') window.abrirLeituraDetalhada(l.id);
    else if(typeof openModal==='function') openModal('leitura', l.id);
  });
  return true;
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
// Ponte 2 + cura 4.1 (v5.24.5) — POR QUE a 1ª tentativa falhava e a 2ª ia:
// a busca usava um índice feito uma vez só e a nuvem trocava a base por baixo
// dele; a linha aparecia na tela, mas o clique não achava o cliente na base
// nova. Agora: (a) a busca refaz o índice sozinha sempre que a base troca e
// guarda o que mostrou em __vosUltBusca; (b) o clique procura na base atual e,
// se não achar, SE CURA com o dado da própria busca — devolve o cliente à
// base, marca para subir e amarra na hora.
window.__vosUltBusca = window.__vosUltBusca || {};
if(typeof window.vosVendaSearchCliente==='function' && !window.vosVendaSearchCliente.__v5245){
  window.__vosCliIdxBase = null; window.__vosCliIdxFresco = null;
  window.vosVendaSearchCliente = function(q){
    const sessf=(typeof getSession==='function'?getSession():null)||{};
    const el = document.getElementById('vos-cli-results'); if(!el) return;
    const low = (q||'').toLowerCase().trim();
    if(!low){ el.classList.add('hidden'); el.innerHTML=''; return; }
    const base = (typeof db!=='undefined' && db.clientes)||[];
    if(window.__vosCliIdxBase !== base){
      window.__vosCliIdxBase = base;
      window.__vosCliIdxFresco = base.map(function(c){
        const doc=String(c.documento||'');
        return { c:c, hay:[c.codigo,c.nome,c.fantasia,c.documento,(typeof onlyDigits==='function'?onlyDigits(c.documento):doc.replace(/\D/g,'')),c.endereco,c.telefone,c.cidade,c.estado].filter(function(x){return x!=null&&x!=='';}).join(' ').toLowerCase() };
      });
    }
    const list = window.__vosCliIdxFresco
      .filter(function(x){ return x.c.empresaId===sessf.empresaId && x.hay.indexOf(low)>=0; })
      .map(function(x){ return x.c; }).slice(0,15);
    window.__vosUltBusca = {};
    el.innerHTML = list.map(function(c){
      window.__vosUltBusca[c.id]=c;
      return '<button type="button" onclick="vosVendaSelectCliente(\''+String(c.id).replace(/'/g,'')+'\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0 flex justify-between gap-2">'
        +'<span><b class="text-[#0a1e8a]">#'+_esc(c.codigo||'-')+'</b> <b>'+_esc(c.nome||'')+'</b><br><span class="text-slate-500 text-[11px]">'+_esc(c.documento||'')+' • '+_esc(c.telefone||'')+' • '+_esc(c.endereco||'')+'</span></span>'
        +'<span class="text-[10px] text-slate-400 shrink-0">'+_esc(c.cidade||'')+'/'+_esc(c.estado||'')+'</span></button>';
    }).join('') || '<p class="px-3 py-3 text-slate-400">Nenhum cliente encontrado — cadastre em "+ Novo cliente"</p>';
    el.classList.remove('hidden');
  };
  window.vosVendaSearchCliente.__v5245 = true;
}
if(typeof window.vosVendaSelectCliente==='function' && !window.vosVendaSelectCliente.__v5245){
  const _selClienteVos5245 = window.vosVendaSelectCliente;
  window.vosVendaSelectCliente = function(id){
    let cura=false;
    try{
      let c = ((typeof db!=='undefined' && db.clientes)||[]).find(function(x){ return x && x.id===id; });
      if(!c && window.__vosUltBusca && window.__vosUltBusca[id]){
        try{ db.clientes=(db.clientes||[]).concat([window.__vosUltBusca[id]]); if(typeof saveDB==='function') saveDB(); }catch(_e){}
        c = ((db.clientes)||[]).find(function(x){ return x && x.id===id; });
        cura = !!c;
        try{ if(window.DIGICOPY_CLOUD_SYNC&&window.DIGICOPY_CLOUD_SYNC.tick) window.DIGICOPY_CLOUD_SYNC.tick('cura-cliente'); }catch(_){}
      }
      if(!c){
        try{ if(typeof toast==='function') toast('Este cliente ainda não chegou neste PC — aguarde a nuvem e escolha de novo.', 'error'); }catch(_){}
        try{ if(window.DIGICOPY_CLOUD_SYNC&&window.DIGICOPY_CLOUD_SYNC.tick) window.DIGICOPY_CLOUD_SYNC.tick('busca-cliente'); }catch(_2){}
        return;
      }
    }catch(e){}
    try{ _selClienteVos5245.apply(this, arguments); }catch(e){}
    try{
      const c = ((typeof db!=='undefined' && db.clientes)||[]).find(function(x){ return x && x.id===id; });
      if(c && window.__vosForm && !window.__vosForm.cliente){ window.__vosForm.cliente = c; }
      if(c && typeof toast==='function') toast('Cliente vinculado à venda: '+(c.nome||'')+(cura?' (recuperado da busca)':''), 'success');
    }catch(e){}
  };
  window.vosVendaSelectCliente.__v5245 = true;
}

try{ console.log('[DIGICOPY] v5.24.5 — ficha sempre abre em Dados (Salvar garantido) + histórico com status, exclusão de vez e listas à prova de nuvem + 4.1 curado (clique se cura com o dado da busca)'); }catch(e){}
})();
