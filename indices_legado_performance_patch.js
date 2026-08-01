// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.36 — Índices legados, cache rápido e menus migrados limpos
// • Usa os índices do banco antigo como mapa de campos críticos de busca/vínculo
// • Cria caches em memória para acelerar vínculos entre cliente, venda, contrato,
//   visita, contador, financeiro, produtos e serial
// • Remove os menus automáticos das tabelas migradas da navegação principal
//   e deixa tudo acessível por um único botão "Dados migrados"
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function norm(v){ return semAcento(v).toUpperCase(); }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function soDigitos(v){ return txt(v).replace(/\D/g,''); }
function idle(cb){ if(typeof requestIdleCallback==='function') return requestIdleCallback(cb,{timeout:1200}); return setTimeout(cb,30); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }

const INDICES_LEGADO_RESUMO = Object.freeze({
  totaisRecebidos: 706,
  ignoradosSistema: 'RDB$*, IBE$LOG_* e índices internos do Firebird foram ignorados para regra de negócio.',
  unicosImportantes: {
    CIDADES:['NOME_CIDADE','UF'],
    CLIENTES:['COD_CLIENTE','SUBDOMINIO'],
    PRODUTOS_VARIACAO:['PRV_IDENTIFICACAO'],
    SELECIONADOS:['COD_REFERENCIA','COD_CONTROLE'],
    RAMO:['RAM_DESCRICAO']
  },
  camposCriticos: {
    CLIENTES:['COD_CLIENTE','NOME_RAZAOSOCIAL','CPF_CNPJ','COD_CIDADE','COD_FUNCIONARIO','CLI_COD_EMPRESA','COD_RECEBIMENTO'],
    VENDAS:['COD_VENDA','COD_CLIENTE','COD_FUNCIONARIO','COD_SITUACAO','FINALIZADA','COD_EQUIPAMENTO','VEN_COD_LOCACAO','VEN_COD_ITENS_LOCACAO','VEN_COD_EMPRESA','COD_RECEBIMENTO'],
    ITENS_VENDA:['COD_ITENS_VENDA','COD_VENDA','COD_PRODUTO','COD_CARTUCHO','IV_COD_ITENS_LOCACAO','IV_COD_LOCACAO','ETIQUETA','TIPO_DESCRICAO'],
    CONTAS_RECEBER:['COD_PARCELA','COD_CLIENTE','COD_VENDA','CR_COD_LEITURA','CR_COD_LOCACAO','CR_COD_BOLETO','CR_COD_PIX','CR_COD_EMPRESA','DATA_VENCIMENTO'],
    CONTAS_PAGAR:['COD_PAGAR','COD_FORNECEDOR','COD_COMPRA','CP_COD_RETIRADA','CON_COD_EMPRESA','CP_COD_PIX','CP_COD_CONTA'],
    VISITAS:['COD_VISITA','COD_LOCACAO','VI_COD_CLIENTE','VI_COD_ITENS_LOCACAO','VI_COD_EQUIPAMENTO','VI_COD_VENDA','VI_COD_MOTIVO_DEFEITO','VI_SITUACAO'],
    CONTADOR_PAGINAS:['COD_CONTADOR','COD_ITENS_LOCACAO','CP_COD_LEITURA','CP_COD_EQUIPAMENTO'],
    CONTADORES:['CON_CODIGO','CON_SERIAL','CON_COD_ITENS_LOCACAO','CON_COD_LOCACAO','CON_DATA_CADASTRO'],
    ITENS_LOCACAO:['IT_COD_ITENS_LOCACAO','IT_COD_LOCACAO','IT_COD_EQUIPAMENTO','IT_SERIAL','IT_SITUACAO','IT_OCULTAR'],
    LOCACAO:['COD_LOCACAO','COD_CLIENTE','LOC_COD_EMPRESA','OCULTAR'],
    LEITURAS:['LE_COD_LEITURA','LE_COD_LOCACAO','LE_COD_NOTA_FISCAL','LE_COD_NFSE'],
    PRODUTOS:['COD_PRODUTO','DESCRICAO','PR_COD_EMPRESA','PR_COD_CARTUCHO','PR_COD_EQUIPAMENTO','PR_NCM','PR_COD_TRIBUTO'],
    PRODUTOS_VARIACAO:['PRV_CODIGO','PRV_COD_PRODUTO','PRV_IDENTIFICACAO','PRV_COD_EMPRESA'],
    PRODUTOS_HISTORICO:['PH_CODIGO','PH_COD_PRODUTO','PH_COD_PRODUTO_VARIACAO'],
    EQUIPAMENTOS:['COD_EQUIPAMENTO','DESCRICAO','EQ_COD_FABRICANTE','EQ_COD_CATEGORIA'],
    CARTUCHOS:['COD_CARTUCHO','COD_PRODUTO','COD_FABRICANTE','CAR_COD_EMPRESA'],
    NOTA_FISCAL:['NF_CODIGO','NF_DATA','NF_NOME_RAZAOSOCIAL','NF_COD_VENDA','NF_COD_LEITURA','NF_COD_CLIENTE','NF_COD_EMPRESA'],
    ITENS_NOTA:['IN_CODIGO','IN_COD_NOTA_FISCAL','IN_COD_PRODUTO','IN_COD_CARTUCHO','IN_COD_TRIBUTO'],
    NCM:['NC_CODIGO','NC_NCM','NC_EX','NC_TIPO'],
    PIX:['PIX_CODIGO','PIX_COD_EMPRESA','PIX_COD_VENDA','PIX_COD_CONTA','PIX_COD_CLIENTE'],
    BOLETOS:['BO_CODIGO','BO_COD_CLIENTE','BO_COD_CONTA','BOL_COD_EMPRESA'],
    CARTAO_PAGAMENTO:['CAP_CODIGO','CAP_COD_CARTAO','CAP_COD_VENDA','CAP_COD_PARCELA','CAP_COD_RECEBIMENTO'],
    DESPESAS_LOCACAO:['DP_COD_DESPESA','DP_COD_VENDA','DP_COD_ITENS_LOCACAO','DP_COD_VISITA','DP_COD_LOCACAO','DP_COD_ITENS_VENDA'],
    MOVIMENTACAO:['MOV_CODIGO','MOV_COD_CONTA','MOV_COD_CONTA_PAGAR','MOV_COD_CONTA_RECEBER','MOV_COD_COMPRA','MOV_COD_RETIRADA'],
    ORCAMENTO:['COD_ORCAMENTO','COD_CLIENTE','ORC_COD_VENDA','ORC_COD_EQUIPAMENTO','ORC_COD_EMPRESA']
  }
});

function addMap(map, key, val, multi=true){
  const k=txt(key); if(!k) return;
  if(multi){ const arr=map.get(k)||[]; arr.push(val); map.set(k,arr); }
  else if(!map.has(k)) map.set(k,val);
}
function mapPor(lista, extrator, multi=true){ const m=new Map(); (lista||[]).forEach(x=>addMap(m, extrator(x), x, multi)); return m; }
function mapaModulo(nome, campos, normalizador=cod){
  const out={}; const lista=rows(nome);
  (campos||[]).forEach(campo=>{ out[campo]=new Map(); });
  lista.forEach(row=>{
    (campos||[]).forEach(campo=>{ const v=normalizador(row[campo]); if(v) addMap(out[campo], v, row, true); });
  });
  return out;
}
function assinaturaBase(dbRef){
  const mods=dbRef.modulosDinamicos||{};
  const modSig=Object.keys(mods).sort().map(k=>`${k}:${(((mods[k]||{}).dados)||[]).length}`).join('|');
  const arrSig=['clientes','produtos','equipamentos','contratos','parque','leituras','os','vendas','contasReceber','contasPagar'].map(k=>`${k}:${Array.isArray(dbRef[k])?dbRef[k].length:0}`).join('|');
  return arrSig+'||'+modSig;
}
function construirIndices(dbRef){
  const idx={assinatura:assinaturaBase(dbRef),criadoEm:new Date().toISOString(),legadoResumo:INDICES_LEGADO_RESUMO};
  idx.clientes={
    porId:mapPor(dbRef.clientes,c=>c.id,false),
    porCodigo:mapPor(dbRef.clientes,c=>cod(c.codigo||c.codigoAntigo||c.idLegado),false),
    porDocumento:mapPor(dbRef.clientes,c=>soDigitos(c.documento||c.cpfCnpj||c.CPF_CNPJ),false),
    porNome:mapPor(dbRef.clientes,c=>norm(c.nome||c.fantasia),true)
  };
  idx.produtos={
    porId:mapPor(dbRef.produtos,p=>p.id,false),
    porCodigo:mapPor(dbRef.produtos,p=>cod(p.sku||p.codigo||p.codigoAntigo||p.idLegado),false),
    porNome:mapPor(dbRef.produtos,p=>norm(p.nome||p.descricao),true)
  };
  idx.equipamentos={
    porId:mapPor(dbRef.equipamentos,e=>e.id,false),
    porCodigo:mapPor(dbRef.equipamentos,e=>cod(e.codigoAntigo||e.codigo||e.idLegado),false),
    porSerial:mapPor(dbRef.equipamentos,e=>norm(e.serie||e.serial),false),
    porPatrimonio:mapPor(dbRef.equipamentos,e=>norm(e.patrimonio),false)
  };
  idx.contratos={
    porId:mapPor(dbRef.contratos,c=>c.id,false),
    porCodigo:mapPor(dbRef.contratos,c=>cod(c.numero||c.codigoAntigo||c.codigo||c.idLegado),false),
    porCliente:mapPor(dbRef.contratos,c=>c.clienteId,true)
  };
  idx.parque={
    porId:mapPor(dbRef.parque,p=>p.id,false),
    porItem:mapPor(dbRef.parque,p=>cod(p.codigoAntigo||p.idLegado),false),
    porContrato:mapPor(dbRef.parque,p=>p.contratoId,true),
    porEquipamento:mapPor(dbRef.parque,p=>p.equipamentoId,true),
    porCliente:mapPor(dbRef.parque,p=>p.clienteId,true)
  };
  idx.vendas={porId:mapPor(dbRef.vendas,v=>v.id,false),porNumero:mapPor(dbRef.vendas,v=>cod(v.numero||v.codigoAntigo||v.idLegado),false),porCliente:mapPor(dbRef.vendas,v=>v.clienteId,true)};
  idx.financeiro={crPorVenda:mapPor(dbRef.contasReceber,c=>c.vendaId,true),crPorCliente:mapPor(dbRef.contasReceber,c=>c.clienteId,true),cpPorFornecedor:mapPor(dbRef.contasPagar,c=>cod(c.fornecedorCodigoAntigo||c.codFornecedor),true)};
  idx.raw={};
  Object.entries(INDICES_LEGADO_RESUMO.camposCriticos).forEach(([tabela,campos])=>{ if(rows(tabela).length) idx.raw[tabela]=mapaModulo(tabela,campos,cod); });
  return idx;
}
let CACHE=null;
function getIndices(force=false){
  const sig=assinaturaBase(db||{});
  if(!force && CACHE && CACHE.assinatura===sig) return CACHE;
  CACHE=construirIndices(db||{});
  window.IDX_LEGADO_CACHE=CACHE;
  if(db){ db.config=db.config||{}; db.config.indicesLegadoResumo=INDICES_LEGADO_RESUMO; }
  return CACHE;
}
function buscarClienteRapido(valor){ const i=getIndices(); return i.clientes.porCodigo.get(cod(valor))||i.clientes.porDocumento.get(soDigitos(valor))||null; }
function buscarProdutoRapido(valor){ const i=getIndices(); return i.produtos.porCodigo.get(cod(valor))||null; }
function rawPor(tabela,campo,valor){ const i=getIndices(); return (((i.raw[tabela]||{})[campo]||new Map()).get(cod(valor)))||[]; }

function removerMenusMigrados(){
  if(typeof document==='undefined') return 0;
  let n=0;
  document.querySelectorAll('[data-dynamic-category]').forEach(el=>{ el.remove(); n++; });
  ['nav-dinamico','nav-dinamico-label','topmod-migrados'].forEach(id=>{ const el=document.getElementById(id); if(el){ el.remove(); n++; } });
  return n;
}
function garantirBotaoMigrados(){
  if(typeof document==='undefined') return;
  const destino=document.getElementById('nav-gest') || document.querySelector('nav');
  if(!destino || destino.querySelector('[data-nav="migrados"]')) return;
  const total=Object.values(db.modulosDinamicos||{}).reduce((s,m)=>s+((((m||{}).dados)||[]).length?1:0),0);
  if(!total) return;
  const btn=document.createElement('button');
  btn.dataset.nav='migrados';
  btn.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white';
  btn.innerHTML='<i class="ph ph-database text-[19px]"></i><span>Dados migrados</span><span class="ml-auto text-[11px] bg-purple-400 text-purple-950 font-bold px-2 py-0.5 rounded-full">'+total+'</span>';
  btn.onclick=function(){ if(typeof navigateTo==='function') navigateTo('migrados'); };
  destino.appendChild(btn);
}
function limparNavegacaoMigrada(){
  if(!db) return;
  db.config=db.config||{};
  if(db.config.mostrarMenusMigradosNaLateral===true) return;
  removerMenusMigrados();
  garantirBotaoMigrados();
}
function instalarNavLimpo(){
  const old=window.buildNav;
  if(typeof old==='function' && !old.__indicesLegadoLimpo){
    window.buildNav=function(){ const ret=old.apply(this,arguments); setTimeout(limparNavegacaoMigrada,0); return ret; };
    window.buildNav.__indicesLegadoLimpo=true;
  }
  setTimeout(limparNavegacaoMigrada,250);
  setTimeout(limparNavegacaoMigrada,1500);
}

window.INDICES_LEGADO_PURE={ INDICES_LEGADO_RESUMO, addMap, mapPor, construirIndices, assinaturaBase };
window.IDX_LEGADO={ get:getIndices, rebuild:()=>getIndices(true), cliente:buscarClienteRapido, produto:buscarProdutoRapido, raw:rawPor, limparMenus:limparNavegacaoMigrada };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ idle(()=>{ getIndices(true); limparNavegacaoMigrada(); if(typeof salvar==='function'&&db&&db.config&&db.config.indicesLegadoResumo) salvar(); }); }
instalarNavLimpo();
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; setTimeout(run,900); return ret; };
setTimeout(run,2200);
console.log('[DIGICOPY] indices_legado_performance_patch.js v4.9.36 carregado');
})();
