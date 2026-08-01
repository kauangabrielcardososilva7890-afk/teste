// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.22 — Automações financeiras, leituras, fiscal leve e estoque
// • Continuação da adaptação de triggers úteis do banco anterior
// • Leituras: estorno limpa financeiro vinculado e recalcula totais por contadores
// • Contas a pagar/receber: defaults, status, vínculos com venda/leitura e totais
// • Produtos: histórico de estoque recalcula saldo quando houver tabela migrada
// • Fiscal leve: item de nota calcula total, sugere NCM/CEST e marca venda com NFE
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function num(v, fb = 0){ const n = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : fb; }
function int(v, fb = 0){ const n = parseInt(String(v ?? ''), 10); return Number.isFinite(n) ? n : fb; }
function cod(v){ const g = txt(v).match(/\d+/g); if(!g || !g.length) return ''; const c = g[g.length - 1].replace(/^0+/, ''); return c || '0'; }
function hojeISO(){ return new Date().toISOString().slice(0,10); }
function agoraISO(){ return new Date().toISOString(); }
function uidSafe(p){ return typeof uid === 'function' ? uid(p) : `${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function salvar(){ if(typeof saveDB === 'function') saveDB(); }
function toastMsg(m,t){ if(typeof toast === 'function') toast(m,t||'info'); }
function logar(e,a,id,d){ if(typeof logAction === 'function') logAction(e,a,id,d); }
function rows(nome){ return (((db.modulosDinamicos || {})[nome] || {}).dados) || []; }
function rowsLike(rx){ const out=[]; Object.entries(db.modulosDinamicos||{}).forEach(([nome,m])=>{ if(rx.test(nome)) out.push(...(((m||{}).dados)||[])); }); return out; }
function pick(r, campos){ for(const c of campos){ if(r && r[c] !== undefined && r[c] !== null && txt(r[c]) !== '') return r[c]; } return ''; }
function assinaturaTabela(nomes){ return nomes.map(nome=>{ const r=rows(nome); const last=r[r.length-1]||{}; return `${nome}:${r.length}:${JSON.stringify(last).slice(0,80)}`; }).join('|'); }
function assinaturaArray(nome, empId){ const a=Array.isArray(db[nome])?db[nome].filter(x=>!empId||!x.empresaId||x.empresaId===empId):[]; const last=a[a.length-1]||{}; return `${nome}:${a.length}:${JSON.stringify(last).slice(0,80)}`; }
function round2(v){ return Math.round(num(v,0) * 100) / 100; }
function normalizeLocalizacaoDescricao(v){ return txt(v).replace(/\\/g, '/').trim(); }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p => p.empresaId===empId && (cod(p.sku)===c || cod(p.codigo)===c || cod(p.codigoAntigo)===c || cod(p.idLegado)===c)) || null; }
function vendaPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.vendas||[]).find(v => v.empresaId===empId && (cod(v.numero)===c || cod(v.codigoAntigo)===c || cod(v.idLegado)===c)) || null; }
function leituraPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.leituras||[]).find(l => l.empresaId===empId && (cod(l.codigoAntigo)===c || cod(l.numero)===c || cod(l.idLegado)===c || cod(l.id)===c)) || null; }
function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x => x.empresaId===empId && (cod(x.codigo)===c || cod(x.codigoAntigo)===c || cod(x.idLegado)===c)) || null; }
function formaPagamentoPorCodigo(codigo){
  const c = cod(codigo);
  if(c === '1') return 'Dinheiro';
  if(c === '2') return 'Cheque';
  if(c === '3') return 'Cartão de crédito';
  if(c === '4') return 'Cartão de débito';
  if(c === '5') return 'Conta';
  if(c === '6') return 'Prazo';
  if(c === '9') return 'Pix';
  return '';
}

function calcularLeituraPorContadores(contadores, desconto, acrescimo){
  let total = (contadores || []).reduce((s, r) => s + num(r.CP_VALOR_TOTAL ?? r.valorTotal ?? r.valorExcedente, 0), 0);
  if(total > 0) total = total - num(desconto,0) + num(acrescimo,0);
  else { desconto = 0; acrescimo = 0; }
  return { valorTotal: round2(Math.max(0,total)), desconto:num(desconto,0), acrescimo:num(acrescimo,0) };
}

function aplicarDefaultsContaPagar(cp){
  const out = Object.assign({}, cp || {});
  if(!txt(out.descricao || out.DESCRICAO)) out.descricao = 'Descrição não informada';
  if(!txt(out.fornecedor || out.nome_credor || out.NOME_CREDOR)) out.fornecedor = 'Fornecedor não identificado';
  if(!txt(out.tipo || out.TIPO)) out.tipo = out.codCompra || out.COD_COMPRA ? 'V' : 'F';
  if(out.estornar == null) out.estornar = 'N';
  if(out.juros == null) out.juros = 0;
  if(out.valorParcela == null) out.valorParcela = out.valor || out.VALOR_PARCELA || 0;
  if(out.valor == null) out.valor = num(out.valorParcela,0) + num(out.juros,0);
  out.valorTotal = num(out.valorParcela, out.valor) + num(out.juros,0);
  if(!out.parcela) out.parcela = '1/1';
  if(!out.status) out.status = out.pagamentoData || out.DATA_PAGAMENTO ? 'pago' : 'aberto';
  if(!out.criadoEm) out.criadoEm = agoraISO();
  return out;
}

function aplicarDefaultsContaReceber(cr, venda, cliente){
  const out = Object.assign({}, cr || {});
  if(!out.clienteId && venda) out.clienteId = venda.clienteId;
  if(!out.clienteId && cliente) out.clienteId = cliente.id;
  if(!out.valor && venda) out.valor = venda.total || 0;
  if(!out.vencimento) out.vencimento = hojeISO();
  if(!out.status) out.status = out.pagamentoData || out.DATA_PAGAMENTO ? 'pago' : 'aberto';
  if(!out.formaPagamento && out.codRecebimento) out.formaPagamento = formaPagamentoPorCodigo(out.codRecebimento);
  if(!out.tipo){
    if(out.leituraId || out.contratoId) out.tipo = 'LOCACAO';
    else if(venda && (venda.itens||[]).some(it => /RECARGA|CARTUCHO/i.test(it.descricao||it.tipo||''))) out.tipo = 'RECARGA';
    else out.tipo = 'VENDA';
  }
  if(out.pixId || out.CR_COD_PIX){ out.formaPagamento = 'Pix'; if(out.status !== 'pago') out.status = 'aberto'; }
  if(out.boletoId || out.CR_COD_BOLETO){ out.formaPagamento = 'Prazo'; }
  if(!out.criadoEm) out.criadoEm = agoraISO();
  return out;
}

function atualizarVendaPorContaReceber(cr){
  if(!cr || !cr.vendaId) return false;
  const v = (db.vendas||[]).find(x => x.id === cr.vendaId);
  if(!v) return false;
  if(cr.status === 'pago' || cr.pagamentoData){
    v.status = 'faturado';
    v.pagamentoStatus = 'pago';
    v.formaPagamento = cr.formaPagamento || v.formaPagamento;
    return true;
  }
  if(v.pagamentoStatus === 'pago' && cr.status !== 'pago'){
    v.pagamentoStatus = 'aberto';
    return true;
  }
  return false;
}

function atualizarLeituraPorContaReceber(cr){
  if(!cr || !cr.leituraId) return false;
  const l = (db.leituras||[]).find(x => x.id === cr.leituraId);
  if(!l) return false;
  if(cr.status === 'pago' || cr.pagamentoData){
    l.status = 'faturado';
    l.finalizada = true;
  } else if(l.status === 'faturado'){
    l.status = 'pendente';
    l.finalizada = false;
  }
  return true;
}

function aplicarAutomacoesLeituras(empId){
  let alterou = 0;
  const contadores = rows('CONTADOR_PAGINAS');
  (db.leituras||[]).filter(l => l.empresaId === empId).forEach(l => {
    const codigo = cod(l.codigoAntigo || l.idLegado || l.numero || l.id);
    const relacionados = codigo ? contadores.filter(r => cod(r.CP_COD_LEITURA) === codigo) : [];
    if(relacionados.length){
      const calc = calcularLeituraPorContadores(relacionados, l.valorDesconto || l.LE_VALOR_DESCONTO, l.valorAcrescimo || l.LE_VALOR_ACRESCIMO);
      if(Math.abs(num(l.valorExcedente,0) - calc.valorTotal) > 0.009){ l.valorExcedente = calc.valorTotal; alterou++; }
      l.valorTotal = calc.valorTotal;
      l.valorDesconto = calc.desconto;
      l.valorAcrescimo = calc.acrescimo;
    }
    if(l.estornar === 'S' || l.estornar === true){
      db.contasReceber = (db.contasReceber||[]).filter(cr => cr.leituraId !== l.id);
      l.estornar = false;
      l.finalizada = false;
      l.status = 'pendente';
      alterou++;
    }
    if(l.nfseId || l.nfeId || l.notaFiscalId){
      (db.contasReceber||[]).forEach(cr => {
        if(cr.leituraId === l.id){
          if(l.nfseId && !cr.nfseId){ cr.nfseId = l.nfseId; alterou++; }
          if((l.nfeId || l.notaFiscalId) && !cr.notaFiscalId){ cr.notaFiscalId = l.nfeId || l.notaFiscalId; alterou++; }
        }
      });
    }
  });
  return alterou;
}

function aplicarAutomacoesContas(empId){
  let alterou = 0;
  (db.contasPagar||[]).filter(cp => cp.empresaId === empId).forEach(cp => {
    const novo = aplicarDefaultsContaPagar(cp);
    const antes = JSON.stringify(cp);
    Object.assign(cp, novo);
    if(antes !== JSON.stringify(cp)) alterou++;
    if(cp.estornar === 'S' || cp.estornar === true){
      cp.status = 'aberto'; cp.pagamentoData = null; cp.estornar = false; alterou++;
    }
  });
  (db.contasReceber||[]).filter(cr => cr.empresaId === empId).forEach(cr => {
    const venda = cr.vendaId ? (db.vendas||[]).find(v => v.id === cr.vendaId) : null;
    const cliente = cr.clienteId ? (db.clientes||[]).find(c => c.id === cr.clienteId) : null;
    const novo = aplicarDefaultsContaReceber(cr, venda, cliente);
    const antes = JSON.stringify(cr);
    Object.assign(cr, novo);
    if(antes !== JSON.stringify(cr)) alterou++;
    if(cr.estornar === 'S' || cr.estornar === true){
      cr.status = 'aberto'; cr.pagamentoData = null; cr.recibo = false; cr.estornar = false; alterou++;
    }
    if(atualizarVendaPorContaReceber(cr)) alterou++;
    if(atualizarLeituraPorContaReceber(cr)) alterou++;
  });
  return alterou;
}

function aplicarAutomacoesProdutosHistorico(empId){
  const hist = rows('PRODUTOS_HISTORICO');
  if(!hist.length) return 0;
  const assinatura = hist.length + ':' + (hist[hist.length-1] && (hist[hist.length-1].PH_CODIGO || hist[hist.length-1].ph_codigo || ''));
  db.config = db.config || {};
  db.config.automacoes = db.config.automacoes || {};
  if(db.config.automacoes.produtosHistoricoAssinatura === assinatura) return 0;
  const saldo = {};
  hist.forEach(h => {
    const c = cod(pick(h,['PH_COD_PRODUTO','COD_PRODUTO','ph_cod_produto']));
    if(!c) return;
    const tipo = txt(pick(h,['PH_TIPO','TIPO','ph_tipo'])).toUpperCase();
    const qtd = num(pick(h,['PH_QTDE','QTDE','QTD','ph_qtde']),0);
    if(!saldo[c]) saldo[c] = 0;
    if(tipo === 'E') saldo[c] += qtd;
    if(tipo === 'S') saldo[c] -= qtd;
  });
  let alterou = 0;
  Object.entries(saldo).forEach(([c, qtde]) => {
    const p = produtoPorCodigo(c, empId);
    if(!p) return;
    if(/SERV/i.test(p.categoria || p.tipo || '')) return;
    if(Math.abs(num(p.estoque,0) - qtde) > 0.0001){ p.estoque = qtde; alterou++; }
  });
  db.config.automacoes.produtosHistoricoAssinatura = assinatura;
  return alterou;
}

function cestaPorNcm(ncm){
  const clean = txt(ncm).replace(/\D/g,'');
  if(!clean) return '';
  const row = rows('TAB_CEST').find(r => txt(r.NCM).replace(/\D/g,'') === clean);
  return row ? txt(row.CEST) : '';
}
function aplicarAutomacoesItensNota(empId){
  const itens = rows('ITENS_NOTA');
  if(!itens.length) return 0;
  let alterou = 0;
  itens.forEach(it => {
    const codProd = pick(it,['IN_COD_PRODUTO']);
    const prod = produtoPorCodigo(codProd, empId);
    const total = round2(num(it.IN_VALOR_UNITARIO,0) * num(it.IN_QTDE,0));
    if(it.IN_VALOR_TOTAL == null || Math.abs(num(it.IN_VALOR_TOTAL,0) - total) > 0.009){ it.IN_VALOR_TOTAL = total; alterou++; }
    if(it.IN_NCM && !it.IN_CEST){ const cest = cestaPorNcm(it.IN_NCM); if(cest){ it.IN_CEST = cest; alterou++; } }
    if(prod){
      if(it.IN_NCM && !prod.ncm){ prod.ncm = txt(it.IN_NCM); alterou++; }
      if(it.IN_CEST && !prod.cest){ prod.cest = txt(it.IN_CEST); alterou++; }
    }
    const venda = vendaPorCodigo(it.IN_COD_VENDA, empId);
    if(venda && !venda.nfe){ venda.nfe = 'S'; alterou++; }
  });
  return alterou;
}

function aplicarAutomacoesFinanceiroEstoque(empId){
  if(!db || !empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=[assinaturaTabela(['CONTADOR_PAGINAS','PRODUTOS_HISTORICO','ITENS_NOTA','NOTA_FISCAL']), assinaturaArray('leituras',empId), assinaturaArray('contasReceber',empId), assinaturaArray('contasPagar',empId), assinaturaArray('vendas',empId)].join('|');
  if(db.config.automacoes.financeiroEstoqueGeralAssinatura===sig) return 0;
  let total = 0;
  total += aplicarAutomacoesLeituras(empId);
  total += aplicarAutomacoesContas(empId);
  total += aplicarAutomacoesProdutosHistorico(empId);
  total += aplicarAutomacoesItensNota(empId);
  db.config.automacoes.financeiroEstoqueGeralAssinatura=sig;
  if(total || sig) salvar();
  return total;
}

window.AUTOMACOES_FIN_ESTOQUE_PURE = {
  normalizeLocalizacaoDescricao,
  calcularLeituraPorContadores,
  aplicarDefaultsContaPagar,
  aplicarDefaultsContaReceber,
  aplicarAutomacoesLeituras,
  aplicarAutomacoesContas,
  aplicarAutomacoesProdutosHistorico,
  aplicarAutomacoesItensNota,
  aplicarAutomacoesFinanceiroEstoque
};

if(typeof window === 'undefined' || typeof document === 'undefined') return;

function run(){ const s = sess(); if(s) aplicarAutomacoesFinanceiroEstoque(s.empresaId); }
const oldShowApp = window.showApp;
window.showApp = function(){ const ret = oldShowApp ? oldShowApp.apply(this, arguments) : undefined; if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_financeiro_estoque', run, 250); else setTimeout(run, 250); return ret; };
const oldRenderFinanceiro = window.renderFinanceiro;
window.renderFinanceiro = function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_financeiro_estoque', run, 0); else run(); return oldRenderFinanceiro ? oldRenderFinanceiro.apply(this, arguments) : undefined; };
const oldRenderLeituras = window.renderLeituras;
window.renderLeituras = function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_financeiro_estoque', run, 0); else run(); return oldRenderLeituras ? oldRenderLeituras.apply(this, arguments) : undefined; };
const oldDeleteLeitura = window.deleteLeituraContrato;
window.deleteLeituraContrato = function(leiId, contratoId){
  if(!confirm('Excluir esta leitura? O financeiro vinculado também será removido.')) return;
  db.contasReceber = (db.contasReceber||[]).filter(cr => cr.leituraId !== leiId);
  db.leituras = (db.leituras||[]).filter(l => l.id !== leiId);
  salvar();
  if(typeof abrirLeiturasContrato === 'function') abrirLeiturasContrato(contratoId);
  if(typeof renderFinanceiro === 'function') renderFinanceiro();
  toastMsg('Leitura e financeiro vinculado excluídos', 'success');
};
if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_financeiro_estoque', run, 900); else setTimeout(run, 900);
console.log('[DIGICOPY] automacoes_financeiro_estoque_patch.js v4.9.22 carregado');
})();
