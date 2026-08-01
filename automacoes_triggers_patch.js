// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.21 — Automações úteis extraídas das triggers
// • Orçamento recalcula total pelos itens e pode virar venda sem duplicar
// • Cliente avulso do orçamento é cadastrado automaticamente quando necessário
// • Parque recebe última visita técnica automaticamente
// • Saldos de contas são recalculados a partir de movimentações quando existirem
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function n(v, fb=0){ const out = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(out) ? out : fb; }
function i(v, fb=0){ const out = parseInt(String(v ?? ''), 10); return Number.isFinite(out) ? out : fb; }
function cod(v){ const g = txt(v).match(/\d+/g); if(!g || !g.length) return ''; const x = g[g.length-1].replace(/^0+/, ''); return x || '0'; }
function uidSafe(p){ return typeof uid === 'function' ? uid(p) : `${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function salvar(){ if(typeof saveDB === 'function') saveDB(); }
function toastMsg(m,t){ if(typeof toast === 'function') toast(m,t||'info'); }
function logar(e,a,id,d){ if(typeof logAction === 'function') logAction(e,a,id,d); }
function title(v){
  const s = txt(v); if(!s) return '';
  if(window.VOTM_PURE && typeof window.VOTM_PURE.toTitleCase === 'function') return window.VOTM_PURE.toTitleCase(s);
  return s.toLowerCase().replace(/\b\p{L}/gu, c => c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, x => x.toLowerCase());
}
function rows(nome){ return (((db.modulosDinamicos || {})[nome] || {}).dados) || []; }
function pick(r, campos){ for(const c of campos){ if(r && r[c] !== undefined && r[c] !== null && txt(r[c]) !== '') return r[c]; } return ''; }
function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x => x.empresaId===empId && (cod(x.codigo)===c || cod(x.codigoAntigo)===c)); }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p => p.empresaId===empId && (cod(p.sku)===c || cod(p.codigo)===c || cod(p.codigoAntigo)===c)); }
function vendaPorNumero(numero, empId){ const c=cod(numero); if(!c) return null; return (db.vendas||[]).find(v => v.empresaId===empId && (cod(v.numero)===c || cod(v.codigoAntigo)===c) && v.origem !== 'orcamento_migrado_convertido'); }
function proximoNumero(lista, empId){ const nums=(lista||[]).filter(x => !empId || x.empresaId===empId).map(x => Number(cod(x.numero || x.codigoAntigo))).filter(Number.isFinite); return String((nums.length ? Math.max(...nums) : 0)+1); }

function calcularTotalOrcamento(orc, itens){
  const soma = (itens||[]).reduce((s,it) => s + n(pick(it,['VALOR_TOTAL','VALOR','PRECO']), 0), 0);
  const desc = n(pick(orc,['VALOR_DESCONTO','DESCONTO']), 0);
  const acres = n(pick(orc,['VALOR_ACRESCIMO','ACRESCIMO']), 0);
  const frete = n(pick(orc,['VALOR_FRETE','FRETE']), 0);
  const perc = n(pick(orc,['PERCENTUAL_DESC']), 0);
  let total = soma - desc + acres + frete;
  if(perc) total = total - (total * perc / 100);
  return Math.max(0, Math.round(total * 100) / 100);
}
function garantirClienteOrcamento(orc, empId){
  const codCli = pick(orc, ['COD_CLIENTE','ORC_COD_CLIENTE','CLIENTE']);
  let cli = clientePorCodigo(codCli, empId);
  if(cli) return cli;
  const nome = title(pick(orc, ['NOME_CLIENTE','CLIENTE_CAD','CLIENTE','NOME']) || (codCli ? `Cliente ${codCli}` : 'Cliente de orçamento'));
  const novo = { id:uidSafe('cli'), empresaId:empId, codigo:cod(codCli) || proximoNumero(db.clientes||[], empId), codigoAntigo:cod(codCli), nome, fantasia:nome, telefone:pick(orc,['TELEFONE','FONE']), email:pick(orc,['EMAIL']), documento:pick(orc,['ORC_CPF_CNPJ','CPF_CNPJ','DOCUMENTO']), tipo:'PJ', status:'ativo', criadoPor:'migracao', criadoPorNome:'Migração', criadoEm:new Date().toISOString() };
  db.clientes.push(novo);
  return novo;
}
function itensDoOrcamento(codOrc){ return rows('ITENS_ORCAMENTO').filter(it => cod(pick(it,['COD_ORCAMENTO'])) === cod(codOrc)); }
function mapearItemOrcamento(it, empId){
  const prod = produtoPorCodigo(pick(it,['COD_PRODUTO']), empId);
  const qtd = n(pick(it,['QTDE','QTD']), 1) || 1;
  const preco = n(pick(it,['VALOR_UNITARIO','PRECO','VALOR']), 0);
  const subtotal = n(pick(it,['VALOR_TOTAL']), qtd * preco);
  return { produtoId: prod ? prod.id : null, descricao: pick(it,['DESCRICAO','PRODUTO']) || (prod && prod.nome) || 'Item do orçamento', qtd, preco, subtotal, tipo: pick(it,['TIPO','TIPO_DESCRICAO']) || '' };
}
function sincronizarOrcamentos(empId){
  const orcs = rows('ORCAMENTO');
  if(!orcs.length) return 0;
  let alterou = 0;
  orcs.forEach(orc => {
    const codigo = cod(pick(orc,['COD_ORCAMENTO','CODIGO','ID']));
    if(!codigo) return;
    const itensRaw = itensDoOrcamento(codigo);
    const total = calcularTotalOrcamento(orc, itensRaw);
    const cli = garantirClienteOrcamento(orc, empId);
    const itens = itensRaw.map(it => mapearItemOrcamento(it, empId));
    let v = (db.vendas||[]).find(x => x.empresaId===empId && x.orcamentoCodigoAntigo===codigo);
    const payload = { empresaId:empId, numero:codigo, codigoAntigo:codigo, orcamentoCodigoAntigo:codigo, clienteId:cli.id, data: pick(orc,['DATA_EMISSAO','DATA']) || new Date().toISOString(), itens, desconto:n(pick(orc,['VALOR_DESCONTO']),0), total, formaPagamento:'Prazo', status: pick(orc,['ORC_GEROU_VENDA']) === 'S' ? 'aprovado' : 'orcamento', origem:'orcamento_migrado', criadoPor:'migracao', criadoPorNome:'Migração' };
    if(v){
      const old = JSON.stringify({total:v.total,status:v.status,itens:v.itens,clienteId:v.clienteId});
      Object.assign(v, payload);
      if(old !== JSON.stringify({total:v.total,status:v.status,itens:v.itens,clienteId:v.clienteId})) alterou++;
    } else {
      db.vendas.push({ id:uidSafe('vda'), criadoEm:new Date().toISOString(), ...payload });
      alterou++;
    }
  });
  return alterou;
}
function converterOrcamentoEmVenda(orcamentoCodigo, empId){
  const codigo = cod(orcamentoCodigo);
  const orcVenda = (db.vendas||[]).find(v => v.empresaId===empId && v.orcamentoCodigoAntigo===codigo);
  if(!orcVenda) return null;
  if(orcVenda.vendaGeradaId) return (db.vendas||[]).find(v => v.id === orcVenda.vendaGeradaId) || null;
  const venda = { ...orcVenda, id:uidSafe('vda'), numero:proximoNumero(db.vendas||[], empId), codigoAntigo:'', origem:'orcamento_migrado_convertido', origemOrcamentoId:orcVenda.id, status:'aguardar', criadoEm:new Date().toISOString(), criadoPor:orcVenda.criadoPor, criadoPorNome:orcVenda.criadoPorNome };
  db.vendas.push(venda);
  orcVenda.status = 'aprovado';
  orcVenda.vendaGeradaId = venda.id;
  return venda;
}
function atualizarUltimaVisitaParque(empId){
  let alterou = 0;
  const visitas = rows('VISITAS');
  visitas.forEach(v => {
    const item = cod(pick(v,['VI_COD_ITENS_LOCACAO']));
    if(!item) return;
    const data = pick(v,['DATA_FINALIZADO','VI_DATA_ATENDIMENTO','DATA','VI_DATA_CADASTRO']);
    if(!data) return;
    const p = (db.parque||[]).find(x => x.empresaId===empId && cod(x.codigoAntigo)===item);
    if(!p) return;
    if(!p.ultimaVisita || new Date(data) > new Date(p.ultimaVisita)){
      p.ultimaVisita = data;
      alterou++;
    }
  });
  return alterou;
}
function recalcularSaldosMovimentacao(){
  const movs = rows('MOVIMENTACAO');
  if(!movs.length) return {};
  const saldos = {};
  movs.forEach(m => {
    const conta = cod(pick(m,['MOV_COD_CONTA','COD_CONTA']));
    if(!conta) return;
    saldos[conta] = (saldos[conta] || 0) + n(pick(m,['MOV_ENTRADA']),0) - n(pick(m,['MOV_SAIDA']),0);
  });
  return saldos;
}
function aplicarAutomacoesTriggers(empId){
  if(!db || !empId) return 0;
  let total = 0;
  total += sincronizarOrcamentos(empId);
  total += atualizarUltimaVisitaParque(empId);
  const saldos = recalcularSaldosMovimentacao();
  if(Object.keys(saldos).length){ db.saldosMovimentacao = saldos; }
  if(total) salvar();
  return total;
}

window.AUTOMACOES_TRIGGERS_PURE = { calcularTotalOrcamento, sincronizarOrcamentos, converterOrcamentoEmVenda, atualizarUltimaVisitaParque, recalcularSaldosMovimentacao, aplicarAutomacoesTriggers };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

function run(){ const s=sess(); if(s) aplicarAutomacoesTriggers(s.empresaId); }
const oldShowApp = window.showApp;
window.showApp = function(){ const ret = oldShowApp ? oldShowApp.apply(this, arguments) : undefined; setTimeout(run, 200); return ret; };
const oldRenderVendas = window.renderVendas;
window.renderVendas = function(){ run(); return oldRenderVendas ? oldRenderVendas.apply(this, arguments) : undefined; };
window.converterOrcamentoMigradoEmVenda = function(codigo){
  const s=sess(); if(!s) return;
  const venda = converterOrcamentoEmVenda(codigo, s.empresaId);
  if(venda){ salvar(); logar('venda','converter_orcamento',venda.id,`Orçamento ${codigo} convertido em venda ${venda.numero}`); if(typeof renderVendas==='function') renderVendas(); toastMsg('Orçamento convertido em venda', 'success'); }
};
setTimeout(run, 600);
console.log('[DIGICOPY] automacoes_triggers_patch.js v4.9.21 carregado');
})();
