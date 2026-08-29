// ═══════════════════════════════════════════════════════════════════════════
// v5.22.13 — Financeiro: só Contas e caixas; Receber junto da lixeira
// • Some o submenu Novo recebimento
// • Receber ao lado do Excluir (caixinha)
// • Com título marcado: baixa com as formas da venda, SEM A prazo
// • Pix no financeiro dá baixa de verdade (pago)
// • Sem marca: novo lançamento (cliente com lupa/Enter, sem status,
//   descrição, repetir mês a mês)
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var FORMAS_BAIXA = ['Dinheiro','Pix','Cartão de crédito','Cartão de débito','Cheque','Conta','Grátis'];

function addMeses(iso, n){
  var s = String(iso||'').slice(0,10);
  var p = s.split('-').map(Number);
  var y = p[0]||new Date().getFullYear();
  var m = p[1]||(new Date().getMonth()+1);
  var d = p[2]||new Date().getDate();
  var dt = new Date(y, (m-1)+n, 1);
  var last = new Date(dt.getFullYear(), dt.getMonth()+1, 0).getDate();
  dt.setDate(Math.min(d, last));
  var mm = String(dt.getMonth()+1).padStart(2,'0');
  var dd = String(dt.getDate()).padStart(2,'0');
  return dt.getFullYear()+'-'+mm+'-'+dd;
}

function montarRepeticoes(base, qtd){
  var n = Math.max(1, parseInt(qtd,10)||1);
  if(n>60) n=60;
  var out=[];
  for(var i=0;i<n;i++){
    out.push({
      descricao: base.descricao,
      valor: base.valor,
      clienteId: base.clienteId,
      vencimento: addMeses(base.vencimento, i)
    });
  }
  return out;
}

function aplicarBaixaTitulo(cr, forma, agora){
  if(!cr) return cr;
  cr.formaPagamento = forma;
  cr.pagamentoData = agora;
  cr.status = 'pago';
  cr.baixaForma = forma;
  return cr;
}

window.FINANCEIRO_RECEBER_PURE = {
  FORMAS_BAIXA: FORMAS_BAIXA.slice(),
  addMeses: addMeses,
  montarRepeticoes: montarRepeticoes,
  aplicarBaixaTitulo: aplicarBaixaTitulo
};

if(typeof document==='undefined') return;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Aviso'); if(typeof toast==='function') toast(m,'info'); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function hoje(){ return new Date().toISOString().slice(0,10); }

function tirarSubmenuRecebimento(){
  var menu = document.getElementById('menu-financeiro');
  if(!menu) return;
  menu.querySelectorAll('button').forEach(function(b){
    var oc = b.getAttribute('onclick')||'';
    var tx = (b.textContent||'');
    if(/contaReceber/.test(oc) || /novo recebimento/i.test(tx)) b.remove();
  });
  var soContas = menu.querySelector('button');
  if(soContas && /contas/i.test(soContas.textContent||'')){
    var want = '<i class="ph ph-bank"></i>Contas e caixas';
    if(soContas.innerHTML !== want) soContas.innerHTML = want;
  }
}

function marcadosFinanceiro(){
  return Array.from(document.querySelectorAll('.fin-del-check:checked')).map(function(c){
    return { tipo: c.dataset.tipo||'cr', id: c.value };
  }).filter(function(a){ return a.id; });
}

function ajustarBotaoReceber(){
  var view = document.getElementById('view-financeiro'); if(!view) return;
  var actions = view.querySelector('.neo-head .neo-actions'); if(!actions) return;
  if(actions.querySelector('[data-fin-receber]')) return;
  actions.querySelectorAll('button').forEach(function(b){
    var oc = b.getAttribute('onclick')||'';
    if(/contaReceber/.test(oc)) b.remove();
  });
  var rec = document.createElement('button');
  rec.className = 'neo-btn primary';
  rec.dataset.finReceber = '1';
  rec.innerHTML = '<i class="ph ph-arrow-circle-down"></i>Receber';
  rec.onclick = function(){ window.finAcaoReceber(); };
  var excluir = actions.querySelector('.btn-del-lote');
  if(excluir) actions.insertBefore(rec, excluir);
  else actions.appendChild(rec);
}

window.finAcaoReceber = function(){
  var s = sess(); if(!s) return;
  var alvos = marcadosFinanceiro().filter(function(a){ return a.tipo==='cr'; });
  if(!alvos.length){ abrirNovoLancamento(); return; }
  var abertos = [];
  alvos.forEach(function(a){
    var cr = (db.contasReceber||[]).find(function(x){ return x && x.id===a.id; });
    if(cr && cr.status!=='pago') abertos.push(cr);
  });
  if(!abertos.length){
    aviso('Marque pelo menos um título a receber em aberto. Títulos já pagos não entram na baixa.','Receber');
    return;
  }
  abrirBaixaFormas(abertos);
};

function abrirBaixaFormas(titulos){
  var box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[720px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  var total = titulos.reduce(function(s,c){ return s+(Number(c.valor)||0); },0);
  document.getElementById('modal-title').innerText = 'Baixa — '+titulos.length+' título(s)';
  document.getElementById('modal-body').innerHTML =
    '<div class="space-y-3 text-[13px]">'+
    '<p class="text-slate-600">Total a baixar: <b class="text-[#0a1e8a]">'+(typeof fmtMoney==='function'?fmtMoney(total):total)+'</b></p>'+
    '<p class="text-[12px] text-slate-500">Mesmas formas da venda, <b>sem A prazo</b>. Pix aqui dá baixa de verdade.</p>'+
    '<div class="grid grid-cols-2 md:grid-cols-4 gap-2" id="fin-formas">'+
    FORMAS_BAIXA.map(function(fx,i){
      return '<button type="button" data-forma="'+esc(fx)+'" onclick="window.finEscolherFormaBaixa(\''+esc(fx)+'\')" class="fin-forma h-[44px] rounded-xl border-2 text-[12.5px] font-bold '+(i===0?'border-[#0a1e8a] bg-[#0a1e8a]/5 text-[#0a1e8a]':'border-slate-200 bg-white')+'">'+esc(fx)+'</button>';
    }).join('')+
    '</div><input type="hidden" id="fin-forma-baixa" value="'+esc(FORMAS_BAIXA[0])+'">'+
    '<div id="fin-forma-msg" class="rounded-xl border p-3 bg-emerald-50/60 border-emerald-200 text-[12.5px] text-emerald-900">Baixa em <b>Dinheiro</b>: o título fica pago.</div>'+
    '</div>';
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border font-bold">Cancelar</button>'+
    '<button onclick="window.finConfirmarBaixa()" class="h-11 px-6 rounded-xl bg-emerald-600 text-white font-bold">Confirmar baixa</button>';
  document.getElementById('modal-root').classList.remove('hidden');
  window.__finBaixaIds = titulos.map(function(t){ return t.id; });
};

window.finEscolherFormaBaixa = function(fx){
  var el = document.getElementById('fin-forma-baixa'); if(el) el.value = fx;
  document.querySelectorAll('.fin-forma').forEach(function(b){
    var on = b.dataset.forma===fx;
    b.className = 'fin-forma h-[44px] rounded-xl border-2 text-[12.5px] font-bold '+(on?'border-[#0a1e8a] bg-[#0a1e8a]/5 text-[#0a1e8a]':'border-slate-200 bg-white');
  });
  var msg = document.getElementById('fin-forma-msg');
  if(msg){
    if(fx==='Pix') msg.innerHTML = 'Baixa em <b>Pix</b>: o título fica <b>pago de verdade</b> (diferente da venda, que deixa o Pix em aberto).';
    else if(fx==='Grátis') msg.innerHTML = 'Baixa <b>Grátis</b>: o título é quitado sem cobrança.';
    else msg.innerHTML = 'Baixa em <b>'+esc(fx)+'</b>: o título fica pago.';
  }
};

window.finConfirmarBaixa = function(){
  var s = sess(); if(!s) return;
  var forma = (document.getElementById('fin-forma-baixa')||{}).value || 'Dinheiro';
  if(FORMAS_BAIXA.indexOf(forma)<0){ aviso('Escolha uma forma de baixa.','Receber'); return; }
  var ids = window.__finBaixaIds||[];
  var agora = new Date().toISOString();
  var n=0;
  ids.forEach(function(id){
    var cr = (db.contasReceber||[]).find(function(x){ return x && x.id===id; });
    if(!cr || cr.status==='pago') return;
    aplicarBaixaTitulo(cr, forma, agora);
    n++;
  });
  if(typeof logAction==='function') logAction('financeiro','baixar_receber',ids.join(','), n+' título(s) baixado(s) em '+forma+' por '+s.usuarioNome);
  if(typeof saveDB==='function') saveDB();
  if(typeof closeModal==='function') closeModal();
  if(typeof renderFinanceiro==='function') renderFinanceiro();
  if(typeof renderAuditoria==='function') renderAuditoria();
  if(typeof toast==='function') toast(n+' título(s) baixado(s) em '+forma,'success');
};

function abrirNovoLancamento(){
  var s = sess(); if(!s) return;
  window.__finNovoCli = null;
  var box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[720px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Novo lançamento a receber';
  document.getElementById('modal-body').innerHTML =
    '<div class="space-y-3 text-[13px]">'+
    '<div><label class="neo-label">Cliente</label>'+
    '<div class="flex gap-2"><input id="fin-cli-termo" class="neo-input flex-1" placeholder="Nome, código ou documento — Enter ou lupa" onkeydown="if(event.key===\'Enter\'){event.preventDefault();window.finBuscarCliente();}">'+
    '<button type="button" onclick="window.finBuscarCliente()" class="neo-btn primary" title="Pesquisar"><i class="ph ph-magnifying-glass"></i></button></div>'+
    '<div id="fin-cli-lista" class="neo-suggest hidden"></div>'+
    '<div id="fin-cli-sel" class="hidden mt-2 rounded-xl bg-[#f1f6ff] border border-[#dbeafe] p-3 text-[13px]"></div></div>'+
    '<div><label class="neo-label">Descrição</label><input id="fin-novo-desc" class="neo-input w-full" placeholder="Ex.: aluguel, mensalidade..."></div>'+
    '<div class="grid grid-cols-2 gap-3">'+
    '<div><label class="neo-label">Valor R$</label><input id="fin-novo-valor" type="number" step="0.01" min="0" class="neo-input w-full"></div>'+
    '<div><label class="neo-label">1º vencimento</label><input id="fin-novo-venc" type="date" value="'+hoje()+'" class="neo-input w-full"></div>'+
    '</div>'+
    '<div><label class="neo-label">Repetir</label>'+
    '<div class="flex items-center gap-2"><input id="fin-novo-rep" type="number" min="1" max="60" value="1" class="neo-input !w-[90px]" onchange="window.finPreviewRepetir()">'+
    '<span class="text-[12px] text-slate-500">vezes, vencimento pulando 1 mês. Dá para editar a data depois.</span></div>'+
    '<div id="fin-rep-prev" class="mt-2 text-[12px] text-slate-600"></div></div>'+
    '</div>';
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border font-bold">Cancelar</button>'+
    '<button onclick="window.finSalvarNovoLancamento()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>';
  document.getElementById('modal-root').classList.remove('hidden');
  window.finPreviewRepetir();
}

window.finBuscarCliente = function(){
  var s = sess(); if(!s) return;
  var q = String(document.getElementById('fin-cli-termo')&&document.getElementById('fin-cli-termo').value||'').toLowerCase().trim();
  var el = document.getElementById('fin-cli-lista'); if(!el) return;
  var list = (db.clientes||[]).filter(function(c){
    if(!c || c.status==='inativo') return false;
    if(c.empresaId && s.empresaId && c.empresaId!==s.empresaId) return false;
    if(!q) return false;
    return [c.nome,c.fantasia,c.documento,c.codigo,c.telefone].some(function(x){ return String(x||'').toLowerCase().includes(q); });
  }).slice(0,15);
  if(!q){ el.classList.add('hidden'); el.innerHTML=''; return; }
  el.classList.remove('hidden');
  el.innerHTML = list.map(function(c){
    return '<button type="button" onclick="window.finEscolherCliente(\''+esc(c.id)+'\')"><b>#'+esc(c.codigo||'-')+'</b> '+esc(c.nome||'')+'<br><span class="text-slate-500 text-[11px]">'+esc(c.documento||'')+'</span></button>';
  }).join('') || '<div class="p-3 text-slate-500 text-[12px]">Nenhum cliente. Ajuste a pesquisa e clique na lupa.</div>';
};

window.finEscolherCliente = function(id){
  var c = (db.clientes||[]).find(function(x){ return x.id===id; });
  if(!c) return;
  window.__finNovoCli = c;
  var lista = document.getElementById('fin-cli-lista'); if(lista) lista.classList.add('hidden');
  var termo = document.getElementById('fin-cli-termo'); if(termo) termo.value = c.nome||'';
  var box = document.getElementById('fin-cli-sel');
  if(box){ box.classList.remove('hidden'); box.innerHTML = '<b>'+esc(c.nome||'')+'</b><br><span class="text-slate-500">Cód. '+esc(c.codigo||'-')+' • '+esc(c.documento||'')+'</span>'; }
};

window.finPreviewRepetir = function(){
  var n = Math.max(1, parseInt((document.getElementById('fin-novo-rep')||{}).value,10)||1);
  var venc = (document.getElementById('fin-novo-venc')||{}).value || hoje();
  var el = document.getElementById('fin-rep-prev'); if(!el) return;
  if(n<=1){ el.textContent = 'Um lançamento no vencimento informado.'; return; }
  var datas=[];
  for(var i=0;i<Math.min(n,6);i++) datas.push(addMeses(venc,i).split('-').reverse().join('/'));
  el.textContent = n+' lançamentos: '+datas.join(', ')+(n>6?'…':'');
};

window.finSalvarNovoLancamento = function(){
  var s = sess(); if(!s) return;
  var cli = window.__finNovoCli;
  if(!cli){ aviso('Escolha o cliente (lupa ou Enter).','Novo lançamento'); return; }
  var desc = String((document.getElementById('fin-novo-desc')||{}).value||'').trim();
  var valor = parseFloat((document.getElementById('fin-novo-valor')||{}).value);
  var venc = (document.getElementById('fin-novo-venc')||{}).value || hoje();
  var qtd = (document.getElementById('fin-novo-rep')||{}).value;
  if(!desc){ aviso('Informe a descrição.','Novo lançamento'); return; }
  if(!valor || valor<=0){ aviso('Informe o valor.','Novo lançamento'); return; }
  var itens = montarRepeticoes({ descricao:desc, valor:valor, clienteId:cli.id, vencimento:venc }, qtd);
  itens.forEach(function(it){
    var novo = {
      id: (typeof uid==='function'?uid('cr'):('cr_'+Date.now()+Math.random().toString(36).slice(2,7))),
      empresaId: s.empresaId,
      origem: 'avulso',
      clienteId: it.clienteId,
      descricao: it.descricao,
      valor: it.valor,
      vencimento: it.vencimento,
      pagamentoData: null,
      status: 'aberto',
      contratoId: null,
      leituraId: null,
      vendaId: null,
      criadoPor: s.usuarioId,
      criadoPorNome: s.usuarioNome,
      criadoEm: new Date().toISOString()
    };
    db.contasReceber = db.contasReceber||[];
    db.contasReceber.push(novo);
  });
  if(typeof logAction==='function') logAction('financeiro','criar_receber','', itens.length+' lançamento(s) "'+desc+'" por '+s.usuarioNome);
  if(typeof saveDB==='function') saveDB();
  if(typeof closeModal==='function') closeModal();
  if(typeof renderFinanceiro==='function') renderFinanceiro();
  if(typeof renderAuditoria==='function') renderAuditoria();
  if(typeof toast==='function') toast(itens.length+' lançamento(s) criado(s)','success');
};

if(typeof window.renderFinanceiro==='function' && !window.renderFinanceiro.__v52213){
  var oldF = window.renderFinanceiro;
  var wrapF = function(){
    var r = oldF.apply(this, arguments);
    try{ tirarSubmenuRecebimento(); ajustarBotaoReceber(); }catch(e){}
    return r;
  };
  wrapF.__v52213 = true;
  window.renderFinanceiro = wrapF;
}

setTimeout(tirarSubmenuRecebimento, 200);
setTimeout(tirarSubmenuRecebimento, 1200);

console.log('[DIGICOPY] v5.22.13 financeiro: Contas e caixas + Receber/baixa');
})();
