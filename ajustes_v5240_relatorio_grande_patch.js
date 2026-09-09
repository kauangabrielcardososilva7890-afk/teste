// ═══════════════════════════════════════════════════════════════════════════
// AJUSTES v5.24.0 — RELATÓRIO GRANDE DO DONO
//
// Cobre, junto com as edições nas fontes já existentes:
//   1.2 Backup: tela sem o botão local duplicado (edição no ajustes_v52296) e
//       numeração sequencial no worker ("Backup manual 1, 2, 3...").
//   2.1 Atalho "Nova venda" removido do menu (index.html).
//   2.2 Extorno ESTE ARQUIVO: window.estornarVenda (o botão do detalhe chamava
//       uma função que não existia — botão morto) + estornarVendasSelecionadas
//       (lote, mesma caixa de seleção do Excluir) + botão "↩ Extornar" na barra.
//       Modo escolhido pelo dono: marca "Extornada" (fica no histórico), desfaz
//       o financeiro (contas a receber da venda), NÃO mexe no estoque (o
//       faturamento também não mexia — ele baixa quando a venda nasce).
//   3.x Perda de dados: varrerRessuscitadas desativado (ajustes_v52261),
//       conflito de push com 1 reenvio (cloudflare_data_sync), reconciliação
//       só com pull completo (cloudflare_data_sync), backup antes de zerar a
//       nuvem (worker).
//   4.1 "cliente não encontrado" ao salvar cliente com id velho → vira
//       cadastro novo em vez de abortar (clientes_patch).
//   4.2 Orçamento não encontrado neste PC → busca na nuvem e tenta de novo.
//   5.1 Botão "Importar clientes" e funções removidos (finalizacao_sistema).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var VERSAO = '5.24.0';

function low(v){ return String(v==null?'':v).toLowerCase(); }
function DB(){ if(typeof db!=='undefined' && db) return db; if(typeof window!=='undefined' && window.db) return window.db; return {}; }

// ── 2.2 EXTORNO ─────────────────────────────────────────────────────────────
function ehFaturada(st){
  var s = low(st);
  return s==='faturado' || s==='finalizada' || s==='concluido' || s==='pago';
}

// Espelho do faturamento (vosConcluirFaturamento): o faturar só mexia em
// status + contas a receber (parcelas ou à vista). O estorno desfaz só isso.
function estornarUmaVenda(v){
  if(!v || !ehFaturada(v.status)) return null;
  var sess = typeof getSession==='function' ? getSession() : null;
  var antes = low(v.status);
  var arr = (DB().contasReceber || []);
  var titulos = arr.filter(function(c){ return c && c.vendaId === v.id; });
  var pagos = titulos.filter(function(c){ return low(c.status)==='pago'; }).length;
  DB().contasReceber = arr.filter(function(c){ return !(c && c.vendaId === v.id); });
  v.status = 'estornada';
  v.estornoDe = antes;
  v.estornadoEm = new Date().toISOString();
  v.estornadoPor = (sess && sess.usuarioNome) || '-';
  v.parcelas = [];
  v.formaPagamento = 'Não faturado';
  if(typeof logAction==='function') logAction('venda','estornar',v.id,'Estornada venda '+v.numero+' (era '+antes+') — '+titulos.length+' título(s) desfeito(s), '+pagos+' já pago(s), por '+v.estornadoPor);
  return { titulos: titulos.length, pagos: pagos };
}

function acharVenda(id){
  var v = (DB().vendas || []).find(function(x){ return x && x.id===id; });
  if(!v && typeof vosLegadosVendas==='function'){
    try{
      var sess = typeof getSession==='function' ? getSession() : null;
      v = (vosLegadosVendas(sess) || []).find(function(x){ return x && x.id===id; });
    }catch(e){}
  }
  return v || null;
}

function renderDepois(){
  if(typeof saveDB==='function') saveDB();
  if(typeof renderVendas==='function') renderVendas();
  if(typeof renderFinanceiro==='function') renderFinanceiro();
  if(typeof renderAuditoria==='function') renderAuditoria();
}

function aviso(txt, titulo){
  if(typeof window!=='undefined' && typeof window.lfbAlert==='function'){ window.lfbAlert(txt, titulo || 'Extornar'); return; }
  if(typeof toast==='function'){ toast(txt, 'info'); return; }
  if(typeof alert==='function') alert(txt);
}
function confirma(txt, titulo, cb){
  if(typeof window!=='undefined' && typeof window.confirmSistema==='function'){ window.confirmSistema(txt, titulo || 'Extornar venda').then(cb); return; }
  cb(typeof confirm==='function' ? confirm(txt) : true);
}

// Individual — o botão "Estornar" do detalhe da venda já CHAMAVA
// estornarVenda(...), mas a função não existia em lugar nenhum: botão morto.
window.estornarVenda = function(id){
  var v = acharVenda(id);
  if(!v){ aviso('Venda não encontrada.', 'Extornar'); return; }
  if(!ehFaturada(v.status)){
    aviso(low(v.status)==='estornada' ? 'Esta venda já está extornada.' : 'Só dá para extornar venda FATURADA (esta ainda está como "'+(v.status||'orçamento')+'").', 'Extornar');
    return;
  }
  var titulos = (DB().contasReceber || []).filter(function(c){ return c && c.vendaId===v.id; });
  var pagos = titulos.filter(function(c){ return low(c.status)==='pago'; }).length;
  confirma('Extornar a venda ' + (v.numero||'') + '?\n\n• As contas a receber dela serão desfeitas (' + titulos.length + ' título(s)' + (pagos ? ', sendo ' + pagos + ' já pago(s) — confira o caixa' : '') + ').\n• Ela fica marcada como "Extornada" no histórico.\n• Depois disso, o botão Excluir passa a permitir apagar, se você quiser.', 'Extornar venda', function(ok){
    if(!ok) return;
    estornarUmaVenda(v);
    renderDepois();
    if(typeof showVenda==='function') showVenda(v.id);
    if(typeof toast==='function') toast('Venda extornada', 'success');
  });
};

// Em lote — a mesma caixa de seleção do Excluir (checkboxes venda-check-lote
// ou a linha selecionada). Só vendas FATURADAS entram; o resto é avisado.
window.estornarVendasSelecionadas = function(){
  var checks = Array.prototype.slice.call(document.querySelectorAll('input[name="venda-check-lote"]:checked'));
  var alvos = [];
  if(checks.length){
    alvos = checks.map(function(ch){ return acharVenda(ch.value); }).filter(Boolean);
  }else{
    var selId = window.neoVendaSelecionada || window.vendaSelecionadaId;
    if(selId){ var unica = acharVenda(selId); if(unica) alvos = [unica]; }
  }
  if(!alvos.length){ aviso('Selecione uma venda na tabela ou marque as caixas de seleção para extornar.', 'Extornar vendas'); return; }
  var faturadas = alvos.filter(function(x){ return ehFaturada(x.status); });
  if(!faturadas.length){ aviso('Só vendas FATURADAS podem ser extornadas. Você selecionou ' + alvos.length + ' venda(s), nenhuma faturada.', 'Extornar vendas'); return; }
  var puladas = alvos.length - faturadas.length;
  confirma('Extornar ' + faturadas.length + ' venda(s) faturada(s)?\n\n• As contas a receber delas serão desfeitas (as já pagas/à vista também — confira o caixa depois).\n• Ficam marcadas como "Extornada" no histórico.\n• Depois disso, o Excluir passa a permitir apagar, se você quiser.' + (puladas ? '\n\n(' + puladas + ' selecionada(s) não faturada(s) serão ignoradas.)' : ''), 'Extornar vendas', function(ok){
    if(!ok) return;
    var n = 0, tit = 0, pagos = 0;
    faturadas.forEach(function(v){
      var r = estornarUmaVenda(v);
      if(r){ n++; tit += r.titulos; pagos += r.pagos; }
    });
    renderDepois();
    window.neoVendaSelecionada = null; window.vendaSelecionadaId = null;
    if(typeof toast==='function') toast(n + ' venda(s) extornada(s) • ' + tit + ' título(s) desfeito(s)' + (pagos ? ' (' + pagos + ' à vista — confira o caixa)' : ''), 'success');
  });
};

// Botão "Extornar" na MESMA barra de ações das notinhas (ao lado do Excluir,
// que é injetado como #btn-excluir-venda-unificado na .neo-actions).
function garantirBotaoExtornar(){
  try{
    if(typeof document==='undefined') return;
    var view = document.getElementById('view-vendas');
    if(!view) return;
    var actions = view.querySelector('.neo-actions');
    if(!actions) return;
    if(actions.querySelector('#btn-estornar-venda')) return;
    var btn = document.createElement('button');
    btn.id = 'btn-estornar-venda';
    btn.className = 'neo-btn';
    btn.innerHTML = '<i class="ph ph-arrow-u-up-left"></i>Extornar';
    btn.onclick = window.estornarVendasSelecionadas;
    var exc = actions.querySelector('#btn-excluir-venda-unificado');
    if(exc) actions.insertBefore(btn, exc); else actions.appendChild(btn);
  }catch(e){}
}
if(typeof window!=='undefined' && typeof window.renderVendas==='function' && !window.renderVendas.__v5240ext){
  var _renderVendasAntes = window.renderVendas;
  window.renderVendas = function(){
    var r = _renderVendasAntes.apply(this, arguments);
    try{ setTimeout(garantirBotaoExtornar, 60); }catch(e){}
    return r;
  };
  window.renderVendas.__v5240ext = true;
}
if(typeof document!=='undefined'){
  setTimeout(garantirBotaoExtornar, 1600);
  setInterval(garantirBotaoExtornar, 3000);
}

// ── 4.2 ORÇAMENTO NÃO ENCONTRADO NESTE PC ───────────────────────────────────
// Antes de declarar que não achou, puxa a nuvem (tick da sincronização) e
// tenta de novo até 2 vezes. Resolve o "existe no outro PC, aqui não abre".
if(typeof window!=='undefined' && typeof window.abrirTelaOrcamento==='function' && !window.abrirTelaOrcamento.__v5240){
  var _abrirOrcAntes = window.abrirTelaOrcamento;
  window.abrirTelaOrcamento = function(){
    var arg = arguments[0] || {};
    var id = arg && arg.id;
    if(!id) return _abrirOrcAntes.apply(this, arguments);
    var existe = (DB().orcamentos || []).some(function(x){ return x && x.id===id; });
    if(existe) return _abrirOrcAntes.apply(this, arguments);
    var self = this, args = arguments, tent = 0;
    if(typeof toast==='function') toast('Buscando o orçamento na nuvem…', 'info');
    (function tente(){
      var chegou = (DB().orcamentos || []).some(function(x){ return x && x.id===id; });
      if(chegou){ _abrirOrcAntes.apply(self, args); return; }
      if(tent >= 2){
        if(typeof window.lfbAlert==='function') window.lfbAlert('Orçamento não encontrado neste computador — nem depois de buscar na nuvem. Confira a internet e tente de novo em alguns segundos; se ele foi EXCLUÍDO em outro aparelho, ele não volta.', 'Orçamento');
        return;
      }
      tent++;
      var p = null;
      try{ if(window.DIGICOPY_CLOUD_SYNC && window.DIGICOPY_CLOUD_SYNC.tick) p = window.DIGICOPY_CLOUD_SYNC.tick('orc-nao-achado'); }catch(e){}
      Promise.resolve(p).catch(function(){}).then(function(){ setTimeout(tente, 900); });
    })();
    return undefined;
  };
  window.abrirTelaOrcamento.__v5240 = true;
}

window.V5240_RELATORIO_PURE = { VERSAO: VERSAO, ehFaturada: ehFaturada, estornarUmaVenda: estornarUmaVenda };
if(typeof module!=='undefined' && module.exports){ module.exports = window.V5240_RELATORIO_PURE; }

if(typeof document!=='undefined' && typeof console!=='undefined' && console.log){
  console.log('[DIGICOPY] v' + VERSAO + ': extorno individual + em lote (botão nas notinhas), orçamento com retry de nuvem');
}
})();
