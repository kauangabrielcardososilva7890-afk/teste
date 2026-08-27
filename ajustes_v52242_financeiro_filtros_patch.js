// ═══════════════════════════════════════════════════════════════════════════
// v5.22.42 — Financeiro: some saldos; filtros da lista; lupa/Enter;
//            padrão Hoje; Abertos / Todos; De/Até (não vale em Hoje/Todos).
//            Código = busca exata. Por valor = valor igual.
//            Cód. Caixa = código do lançamento financeiro.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var CAMPOS = [
  ['nome','Nome'],
  ['cod_venda','Cód. Venda'],
  ['cod_parcela','Cód. Parcela'],
  ['cod_cliente','Cód. Cliente'],
  ['por_valor','Por Valor'],
  ['cod_caixa','Cód. Caixa'],
  ['cod_pix','Cód. Pix'],
  ['cod_leitura','Cód. Leitura']
];

function txt(v){ return String(v==null?'':v).trim(); }
function codigoNorm(v){
  var d=String(v==null?'':v).replace(/\D/g,'');
  if(!d) return '';
  return d.replace(/^0+/,'')||'0';
}
function n(v){ var x=Number(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:0; }
function valorIgual(a,b){ return Math.abs(n(a)-n(b))<0.005; }
function diaDe(v){ return String(v||'').slice(0,10); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function datasDoLanc(c){
  return [c.criadoEm, c.data, c.vencimento, c.pagamentoData, c.baixaEm].map(diaDe).filter(Boolean);
}
function bateHoje(c, h){ return datasDoLanc(c).indexOf(h)>=0; }
function noIntervalo(c, de, ate){
  if(!de && !ate) return true;
  var ds = datasDoLanc(c);
  if(!ds.length) return false;
  return ds.some(function(d){
    if(de && d<de) return false;
    if(ate && d>ate) return false;
    return true;
  });
}

function filtraLancamentos(list, opts){
  opts = opts||{};
  var campo = opts.campo||'nome';
  var q = txt(opts.q);
  var modo = opts.modo||'hoje';
  var de = txt(opts.de);
  var ate = txt(opts.ate);
  var h = opts.hoje||hoje();
  var cliDe = opts.clienteDe||function(){ return {}; };
  return (list||[]).filter(function(item){
    var c = item.ref||item;
    if(!c) return false;
    if(modo==='hoje' && !bateHoje(c,h)) return false;
    if(modo==='abertos' && /pago|baixad|quitad/i.test(c.status||'')) return false;
    if(modo==='abertos' && (de||ate) && !noIntervalo(c,de,ate)) return false;
    if(modo!=='hoje' && modo!=='todos' && modo!=='abertos' && (de||ate) && !noIntervalo(c,de,ate)) return false;
    if(!q) return true;
    var cli = cliDe(c)||{};
    if(campo==='nome'){
      var nome = String(cli.nome||c.clienteNomeAntigo||c.fornecedor||'').toLowerCase();
      return nome.indexOf(q.toLowerCase())>=0;
    }
    if(campo==='cod_venda') return codigoNorm(c.vendaNumero||c.numeroVenda||'')===codigoNorm(q) || codigoNorm(c.vendaId||'')===codigoNorm(q);
    if(campo==='cod_parcela') return codigoNorm(c.numeroParcela||c.parcela||c.nroParcela||'')===codigoNorm(q);
    if(campo==='cod_cliente') return codigoNorm(cli.codigo||cli.codigoAntigo||c.codClienteAntigo||'')===codigoNorm(q);
    if(campo==='por_valor') return valorIgual(c.valor, q);
    if(campo==='cod_caixa') return codigoNorm(c.codigo||c.legadoCodigo||c.id||'')===codigoNorm(q);
    if(campo==='cod_pix') return codigoNorm(c.pixId||c.txid||c.codigoPix||'')===codigoNorm(q) || String(c.pixId||c.txid||c.codigoPix||'').toLowerCase()===q.toLowerCase();
    if(campo==='cod_leitura') return codigoNorm(c.leituraNumero||c.leituraId||c.codLeitura||'')===codigoNorm(q);
    return true;
  });
}

window.FINANCEIRO_V52242_PURE = {
  CAMPOS: CAMPOS,
  codigoNorm: codigoNorm,
  valorIgual: valorIgual,
  filtraLancamentos: filtraLancamentos,
  bateHoje: bateHoje,
  noIntervalo: noIntervalo
};

if(typeof document==='undefined') return;

function esc(s){ return typeof escapeHtml==='function'?escapeHtml(s):String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(v):('R$ '+n(v).toFixed(2)); }
function dataBR(v){ return typeof fmtDate==='function'?fmtDate(v):(v||'-'); }

var ST = window.__FIN_ST || (window.__FIN_ST = { campo:'nome', q:'', modo:'hoje', de:'', ate:'', tipo:'todos', ordem:'venc-asc' });

function lerCampos(){
  ST.campo = (document.getElementById('neo-fin-campo')||{}).value || ST.campo || 'nome';
  ST.q = (document.getElementById('neo-search-fin')||{}).value || ST.q || '';
  ST.de = (document.getElementById('neo-fin-de')||{}).value || ST.de || '';
  ST.ate = (document.getElementById('neo-fin-ate')||{}).value || ST.ate || '';
  ST.tipo = (document.getElementById('neo-fin-tipo')||{}).value || ST.tipo || 'todos';
  ST.ordem = (document.getElementById('neo-fin-ordem')||{}).value || ST.ordem || 'venc-asc';
}

window.finBuscarV52242 = function(){
  lerCampos();
  window.renderFinanceiro();
};
window.finModoV52242 = function(modo){
  ST.modo = modo||'hoje';
  if(modo==='hoje' || modo==='todos'){ ST.de=''; ST.ate=''; }
  window.renderFinanceiro();
};

if(typeof window.renderFinanceiro==='function' && !window.renderFinanceiro.__v52242fin){
  var oldF = window.renderFinanceiro;
  window.renderFinanceiro = function(){
    var sess = typeof getSession==='function'?getSession():null;
    if(!sess || typeof db==='undefined') return oldF.apply(this, arguments);
    var view = document.getElementById('view-financeiro') || (typeof ensureView==='function'?ensureView('financeiro'):null);
    if(!view) return oldF.apply(this, arguments);
    lerCampos();
    var nomeCli = function(c){
      var cli = (db.clientes||[]).find(function(x){ return x.id===c.clienteId; });
      return cli?cli.nome:(c.clienteNomeAntigo||c.fornecedor||'');
    };
    var receber = (db.contasReceber||[]).filter(function(c){ return c && (!c.empresaId||c.empresaId===sess.empresaId); });
    var pagar = (db.contasPagar||[]).filter(function(c){ return c && (!c.empresaId||c.empresaId===sess.empresaId); });
    var all = receber.map(function(c){ return {ref:c,_tipo:'Receber'}; }).concat(pagar.map(function(c){ return {ref:c,_tipo:'Pagar'}; }));
    if(ST.tipo==='Receber') all=all.filter(function(x){ return x._tipo==='Receber'; });
    if(ST.tipo==='Pagar') all=all.filter(function(x){ return x._tipo==='Pagar'; });
    all = filtraLancamentos(all, {
      campo:ST.campo, q:ST.q, modo:ST.modo, de:ST.de, ate:ST.ate, hoje:hoje(),
      clienteDe:function(c){ return (db.clientes||[]).find(function(x){ return x.id===c.clienteId; })||{}; }
    });
    var ordFns = {
      'venc-asc':function(a,b){ return String(a.ref.vencimento||'').localeCompare(String(b.ref.vencimento||'')); },
      'venc-desc':function(a,b){ return String(b.ref.vencimento||'').localeCompare(String(a.ref.vencimento||'')); },
      'valor-desc':function(a,b){ return n(b.ref.valor)-n(a.ref.valor); },
      'valor-asc':function(a,b){ return n(a.ref.valor)-n(b.ref.valor); },
      'desc':function(a,b){ return String(a.ref.descricao||'').localeCompare(String(b.ref.descricao||''),'pt-BR',{sensitivity:'base'}); }
    };
    all.sort(ordFns[ST.ordem]||ordFns['venc-asc']);
    var lim = window.__finLim||400;
    var mostrar = all.slice(0,lim);
    var btnModo = function(id,label){
      return '<button type="button" onclick="window.finModoV52242(\''+id+'\')" class="neo-tab '+(ST.modo===id?'active':'')+'">'+label+'</button>';
    };
    var statusPill = window.statusPillFin || function(st){ return '<span class="neo-status '+(st==='pago'?'ok':'wait')+'">'+esc(st||'aberto')+'</span>'; };
    view.innerHTML = '<div class="neo-shell"><div class="neo-panel neo-float-in">'
      +'<div class="neo-head"><div><h3>Financeiro</h3><p>Contas a receber e a pagar — duplo clique abre o histórico</p></div>'
      +'<div class="neo-actions">'
      +'<button onclick="window.finAcaoReceber&&window.finAcaoReceber()" class="neo-btn primary" data-fin-receber="1"><i class="ph ph-arrow-circle-down"></i>Receber</button>'
      +(typeof window.finImprimirRecibo==='function'?'<button onclick="window.finImprimirRecibo()" class="neo-btn"><i class="ph ph-printer"></i>Imprimir</button>':'')
      +'<button onclick="window.excluirFinanceiroSelecionados&&window.excluirFinanceiroSelecionados()" class="neo-btn danger btn-del-lote"><i class="ph ph-trash"></i>Excluir</button>'
      +'</div></div>'
      +'<div class="p-4 border-b bg-white space-y-3">'
      +'<div class="flex flex-wrap items-center justify-center gap-2">'
      +btnModo('hoje','Hoje')+btnModo('abertos','Abertos')+btnModo('todos','Todos')
      +'</div>'
      +'<div class="flex flex-wrap items-center justify-center gap-2">'
      +'<select id="neo-fin-campo" class="neo-select !h-10 min-w-[160px]">'
      +CAMPOS.map(function(it){ return '<option value="'+it[0]+'"'+(ST.campo===it[0]?' selected':'')+'>'+it[1]+'</option>'; }).join('')
      +'</select>'
      +'<input id="neo-search-fin" value="'+esc(ST.q)+'" class="neo-input min-w-[240px] flex-1 max-w-[420px]" placeholder="Buscar… (Enter ou lupa)">'
      +'<button type="button" onclick="window.finBuscarV52242()" class="h-10 w-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center" title="Pesquisar"><i class="ph ph-magnifying-glass"></i></button>'
      +'</div>'
      +'<div class="flex flex-wrap items-center justify-center gap-2">'
      +'<label class="text-[11px] font-bold text-slate-500 uppercase">De</label><input id="neo-fin-de" type="date" value="'+esc(ST.de)+'" class="neo-input !w-[150px] !h-9">'
      +'<label class="text-[11px] font-bold text-slate-500 uppercase">Até</label><input id="neo-fin-ate" type="date" value="'+esc(ST.ate)+'" class="neo-input !w-[150px] !h-9">'
      +'<select id="neo-fin-tipo" class="neo-select !h-9"><option value="todos"'+(ST.tipo==='todos'?' selected':'')+'>Receber + Pagar</option><option value="Receber"'+(ST.tipo==='Receber'?' selected':'')+'>Só a receber</option><option value="Pagar"'+(ST.tipo==='Pagar'?' selected':'')+'>Só a pagar</option></select>'
      +'<select id="neo-fin-ordem" class="neo-select !h-9 font-bold text-[#0a1e8a]"><option value="venc-asc"'+(ST.ordem==='venc-asc'?' selected':'')+'>⇧ Vencimento</option><option value="venc-desc"'+(ST.ordem==='venc-desc'?' selected':'')+'>⇩ Vencimento</option><option value="valor-desc"'+(ST.ordem==='valor-desc'?' selected':'')+'>⇩ Valor</option><option value="valor-asc"'+(ST.ordem==='valor-asc'?' selected':'')+'>⇧ Valor</option></select>'
      +'<span class="text-[12px] text-slate-500"><b class="text-[#0a1e8a]">'+all.length+'</b> lançamentos</span>'
      +'</div></div>'
      +'<div class="overflow-auto max-h-[calc(100vh-360px)]"><table class="neo-table"><thead><tr><th class="w-8"><input type="checkbox" id="fin-check-all" title="Marcar todos" onchange="window.v52023MarcarTodos&&v52023MarcarTodos(\'fin\',this.checked)"></th><th>Tipo</th><th>Descrição</th><th>Cliente/Fornecedor</th><th>Valor</th><th>Vencimento</th><th>Status</th><th></th></tr></thead><tbody>'
      +(mostrar.map(function(x){
        var c=x.ref; var nome=nomeCli(c); var tipo=x._tipo==='Receber'?'cr':'cp';
        return '<tr class="cursor-pointer" ondblclick="historicoLancamento(\''+tipo+'\',\''+c.id+'\')"><td><input type="checkbox" class="fin-del-check" data-tipo="'+tipo+'" value="'+c.id+'" onclick="event.stopPropagation()" onchange="window.v52023AtualizarBotaoExcluir&&v52023AtualizarBotaoExcluir()"></td><td>'+x._tipo+'</td><td>'+esc(c.descricao||'')+(c.legadoCodigo?' <span class="text-[10px] text-slate-400">#'+esc(c.legadoCodigo)+'</span>':'')+'</td><td>'+esc(nome)+'</td><td><b class="'+(x._tipo==='Pagar'?'text-red-600':'')+'">'+money(c.valor||0)+'</b></td><td>'+dataBR(c.vencimento)+'</td><td>'+statusPill(c.status)+'</td><td><button onclick="historicoLancamento(\''+tipo+'\',\''+c.id+'\')" class="neo-btn !px-2"><i class="ph ph-eye"></i></button></td></tr>';
      }).join('') || '<tr><td colspan="8" class="text-center text-slate-500 py-12">Nenhum lançamento encontrado</td></tr>')
      +'</tbody></table></div>'
      +(all.length>mostrar.length?'<div class="p-3 border-t text-center"><button onclick="window.__finLim='+(lim+300)+'; renderFinanceiro()" class="neo-btn">Mostrar mais</button></div>':'')
      +'</div></div>';
    var inp = document.getElementById('neo-search-fin');
    if(inp){
      inp.oninput = null;
      inp.removeAttribute('oninput');
      inp.onkeydown = function(e){ if(e.key==='Enter'){ e.preventDefault(); window.finBuscarV52242(); } };
    }
    ['neo-fin-campo','neo-fin-tipo','neo-fin-ordem'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.onchange=function(){ window.finBuscarV52242(); };
    });
    try{
      if(typeof oldF.__v52213==='undefined'){ /* noop */ }
    }catch(e){}
  };
  window.renderFinanceiro.__v52242fin = true;
  window.renderFinanceiro.__v52213 = true;
}

console.log('[DIGICOPY] v5.22.42 financeiro: filtros, lupa, hoje');
})();
