// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.35 — Sequências legadas do banco antigo
// • Preserva os últimos valores dos generators/seqs do banco anterior
// • Usa esses valores como piso para códigos novos, evitando reaproveitar código antigo
// • Não muda a regra atual: códigos novos continuam somente números, sem prefixo e sem ano
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const SEQUENCIAS_LEGADO = Object.freeze({
  GEN_CLIENTES_ID:2593,
  GEN_PRODUTOS_ID:1298,
  GEN_VENDAS_ID:16932,
  GEN_ATUALIZADOR:0,
  GEN_ENCOMENDA_ID:0,
  GEN_FUNCIONARIOS_ID:31,
  GEN_COMPRA_ID:13,
  GEN_ITENS_LOCACAO_ID:1882,
  GEN_LOCACAO_ID:480,
  GEN_TRANSPORTADORES_ID:3,
  GEN_CARTUCHOS_ID:413,
  GEN_CATEGORIA_CONTAS_PAGAR_ID:12,
  GEN_FORNECEDORES_ID:18,
  GEN_INSUMOS_ID:0,
  GEN_CONTAS_RECEBER_ID:18201,
  GEN_ORCAMENTO_ID:259,
  GEN_CONTAS_ID:7,
  GEN_ESTOQUE_CARTUCHO_ID:0,
  GEN_PUBLICIDADE_ID:17,
  GEN_TELEMARKETING_ID:0,
  GEN_CONTADOR_PAGINAS_ID:0,
  GEN_VISITAS_ID:6304,
  GEN_LEITURAS_ID:2604,
  GEN_NUM_RECIBO:2434,
  GEN_NOTA_FISCAL_ID:442,
  GEN_ROTEIROS_ID:0,
  GEN_NOTA_NUM_SERVICO:0,
  GEN_CONTAS_PAGAR_ID:257,
  GEN_MANIFESTACAO_ID:0,
  GEN_CARTAO_ID:0,
  GEN_ITENS_NOTA_ID:1406,
  GEN_CONTADOR:0,
  GEN_CONTADORES:0,
  GEN_PIX_HISTORICO_ID:0,
  GEN_PIX_ID:0,
  GEN_CONTAS_RECEBER_AVULSA_ID:0,
  GEN_SEL_CONTROLE_ID:537,
  GEN_SELECIONADOS_ID:539,
  GEN_SHOP_ACESSOS_ID:0
});

const TIPO_POR_GENERATOR = Object.freeze({
  GEN_CLIENTES_ID:'cliente',
  GEN_PRODUTOS_ID:'produto',
  GEN_VENDAS_ID:'venda',
  GEN_VISITAS_ID:'os',
  GEN_LOCACAO_ID:'contrato',
  GEN_LEITURAS_ID:'leitura',
  GEN_COMPRA_ID:'compra',
  GEN_CONTAS_RECEBER_ID:'contasReceber',
  GEN_CONTAS_PAGAR_ID:'contasPagar',
  GEN_ORCAMENTO_ID:'orcamento',
  GEN_NOTA_FISCAL_ID:'notaFiscal',
  GEN_ITENS_LOCACAO_ID:'parque',
  GEN_CARTUCHOS_ID:'cartucho',
  GEN_FORNECEDORES_ID:'fornecedor',
  GEN_TRANSPORTADORES_ID:'transportador',
  GEN_NUM_RECIBO:'recibo',
  GEN_ITENS_NOTA_ID:'itemNota',
  GEN_SELECIONADOS_ID:'selecionado',
  GEN_SEL_CONTROLE_ID:'controleSelecionado'
});

function txt(v){ return String(v ?? '').trim(); }
function num(v){ const n=Number(v); return Number.isFinite(n)?n:0; }
function codigo(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return 0; return Number(g[g.length-1].replace(/^0+/, '') || '0') || 0; }
function maxLista(lista, extrator){ let m=0; (lista||[]).forEach(it=>{ const n=codigo(extrator?extrator(it):it); if(n>m) m=n; }); return m; }
function seqKey(tipo, empId){ return tipo + '_' + empId; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }

function aplicarSequenciasLegado(dbRef, empId){
  if(!dbRef||!empId) return 0;
  dbRef.config=dbRef.config||{};
  dbRef.config.seq=dbRef.config.seq||{};
  dbRef.config.sequenciasLegado={...SEQUENCIAS_LEGADO};
  dbRef.config.sequenciasLegadoMapeadas={...TIPO_POR_GENERATOR};
  let alterou=0;
  Object.entries(TIPO_POR_GENERATOR).forEach(([gen,tipo])=>{
    const valor=num(SEQUENCIAS_LEGADO[gen]);
    if(valor<=0) return;
    const key=seqKey(tipo, empId);
    const atual=num(dbRef.config.seq[key]);
    if(atual<valor){ dbRef.config.seq[key]=valor; alterou++; }
  });
  return alterou;
}
function baselineTipo(tipo){
  let out=0;
  Object.entries(TIPO_POR_GENERATOR).forEach(([gen,t])=>{ if(t===tipo) out=Math.max(out,num(SEQUENCIAS_LEGADO[gen])); });
  return out;
}
function proximoComBaseline(tipo, lista, empId, extrator){
  const base=Math.max(baselineTipo(tipo), maxLista(lista, extrator));
  return base+1;
}

window.SEQUENCIAS_LEGADO_PURE={ SEQUENCIAS_LEGADO, TIPO_POR_GENERATOR, codigo, maxLista, baselineTipo, proximoComBaseline, aplicarSequenciasLegado };

if(typeof window==='undefined'||typeof document==='undefined') return;

const oldSeq=window.seqObter;
if(typeof oldSeq==='function' && !oldSeq.__sequenciasLegado){
  window.seqObter=function(tipo, itens, empresaId, extrator){
    if(db&&empresaId) aplicarSequenciasLegado(db, empresaId);
    return oldSeq.call(this, tipo, itens, empresaId, extrator);
  };
  window.seqObter.__sequenciasLegado=true;
}

function run(){
  const s=typeof getSession==='function'?getSession():null;
  if(!s) return;
  const mudou=aplicarSequenciasLegado(db, s.empresaId);
  if(mudou) salvar();
}
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; setTimeout(run,300); return ret; };
setTimeout(run,1200);
console.log('[DIGICOPY] sequencias_legado_patch.js v4.9.35 carregado');
})();
