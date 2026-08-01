// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.25 — Automações fiscais preparatórias, cartuchos e estornos
// • Continuação da adaptação das triggers úteis do banco anterior
// • NF-e/NFC-e fica preparada: defaults, cliente, totais, vínculos e observações
// • Cartuchos migrados viram estrutura consultável e produto de cartucho vazio
// • Insumos gastos de recarga/remanufatura ficam registrados para custo/histórico
// • Estornos migrados marcam vendas, leituras e títulos sem apagar histórico
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function num(v, fb=0){ const out=Number(String(v ?? '').replace(',', '.')); return Number.isFinite(out)?out:fb; }
function inteiro(v, fb=0){ const out=parseInt(String(v ?? ''),10); return Number.isFinite(out)?out:fb; }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }
function round2(v){ return Math.round(num(v,0)*100)/100; }
function hoje(){ return new Date().toISOString().slice(0,10); }
function agora(){ return new Date().toISOString(); }
function nomeEmpresa(v){ return txt(v).toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g,m=>m.toLowerCase()).replace(/\b(Jk|Me|Ltda|Eireli|Epp|Mei)\b/g,m=>m.toUpperCase()); }
function cpfCnpjTipo(doc){ return txt(doc).replace(/\D/g,'').length>11?'CNPJ':'CPF'; }
function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId&&(cod(x.codigo)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function vendaPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.vendas||[]).find(x=>x.empresaId===empId&&(cod(x.numero)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function leituraPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.leituras||[]).find(x=>x.empresaId===empId&&(cod(x.codigoAntigo)===c||cod(x.numero)===c||cod(x.idLegado)===c||cod(x.id)===c))||null; }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p=>p.empresaId===empId&&(cod(p.sku)===c||cod(p.codigo)===c||cod(p.codigoAntigo)===c||cod(p.idLegado)===c))||null; }
function categoriaUnificada(v){ if(window.FLUXOS_PURE && window.FLUXOS_PURE.categoriaUnificada) return window.FLUXOS_PURE.categoriaUnificada(v); return txt(v)||'Produto'; }

function assinaturaTabela(nomes){
  return nomes.map(nome=>{
    const r=rows(nome);
    const last=r[r.length-1]||{};
    return `${nome}:${r.length}:${JSON.stringify(last).slice(0,80)}`;
  }).join('|');
}

function defaultsNotaFiscal(raw, empId){
  const cliente = clientePorCodigo(pick(raw,['NF_COD_CLIENTE','COD_CLIENTE']), empId) || {};
  const modelo = inteiro(pick(raw,['NF_MODELO']), 55);
  const finalidade = inteiro(pick(raw,['NF_FINALIDADE']), 1) || 1;
  const situacao = txt(pick(raw,['NF_SITUACAO'])) || 'Nao Gerada';
  const doc = pick(raw,['NF_CPF_CNPJ']) || cliente.documento || '';
  const data = pick(raw,['NF_DATA','NF_DATA_GERADA']) || hoje();
  const nota = {
    empresaId: empId,
    codigoAntigo: cod(pick(raw,['NF_CODIGO'])),
    numero: txt(pick(raw,['NF_NUM_NOTA','NF_NUMERO','NF_NUM'])) || '',
    modelo,
    serie: txt(pick(raw,['NF_SERIE'])) || '1',
    tipoAmbiente: pick(raw,['NF_TIPO_AMBIENTE']) ?? 0,
    finalidade,
    natureza: txt(pick(raw,['NF_NATUREZA'])) || 'VENDA',
    pagamento: pick(raw,['NF_PAGAMENTO']) || 1,
    situacao,
    data,
    hora: pick(raw,['NF_HORA','NF_HORA_EMISSAO']) || '',
    valorTotal: num(pick(raw,['NF_VALOR_TOTAL']),0),
    valorProdutos: num(pick(raw,['NF_VALOR_PRODUTOS']),0),
    valorServico: num(pick(raw,['NF_VALOR_SERVICO']),0),
    valorFrete: num(pick(raw,['NF_VALOR_FRETE']),0),
    valorSeguro: num(pick(raw,['NF_VALOR_SEGURO']),0),
    valorDesconto: num(pick(raw,['NF_VALOR_DESCONTO']),0),
    valorAcrescimo: num(pick(raw,['NF_VALOR_ACRESCIMO']),0),
    totalImpostos: num(pick(raw,['NF_TOTAL_IMPOSTOS']),0),
    codVenda: cod(pick(raw,['NF_COD_VENDA'])),
    codLeitura: cod(pick(raw,['NF_COD_LEITURA'])),
    clienteId: cliente.id || null,
    clienteNome: txt(pick(raw,['NF_NOME_RAZAOSOCIAL'])) || cliente.nome || '',
    clienteDocumento: doc,
    clienteDocumentoTipo: cpfCnpjTipo(doc),
    clienteIe: txt(pick(raw,['NF_RG_IE'])) || cliente.ie || cliente.rg || '',
    clienteEmail: txt(pick(raw,['NF_EMAIL'])) || cliente.email || '',
    clienteEndereco: txt(pick(raw,['NF_RUA'])) || cliente.endereco || '',
    clienteNumero: txt(pick(raw,['NF_NUM'])) || cliente.numero || '',
    clienteComplemento: txt(pick(raw,['NF_COMPLEMENTO'])) || cliente.complemento || '',
    clienteBairro: txt(pick(raw,['NF_BAIRRO'])) || cliente.bairro || '',
    clienteCidade: txt(pick(raw,['NF_CIDADE'])) || cliente.cidade || '',
    clienteUf: txt(pick(raw,['NF_UF'])) || cliente.estado || cliente.uf || '',
    clienteCep: txt(pick(raw,['NF_CEP'])) || cliente.cep || '',
    clienteTelefone: txt(pick(raw,['NF_TELEFONE'])) || cliente.telefone || '',
    indFinal: inteiro(pick(raw,['NF_INDFINAL']), 1),
    indPres: inteiro(pick(raw,['NF_INDPRES']), modelo===65?1:0),
    modFrete: modelo===65 ? 9 : inteiro(pick(raw,['NF_MODFRETE']), 9),
    infoAdicionais: txt(pick(raw,['NF_INFO_ADICIONAIS','NF_OBS','NF_OBS_CONTRI'])),
    cancelada: /CANCELADA|DENEGADA|INUTILIZADA/i.test(situacao)
  };
  if(modelo===65){ nota.tpEnteGov=null; nota.tpOperGov=null; nota.pRedutor=0; }
  return nota;
}

function totaisNotaPorItens(codNota, empId){
  const itens = rows('ITENS_NOTA').filter(it=>cod(it.IN_COD_NOTA_FISCAL)===cod(codNota));
  let produtos = 0, servicos = 0;
  itens.forEach(it=>{
    const total = round2(num(it.IN_VALOR_UNITARIO,0)*num(it.IN_QTDE,0));
    if(Math.abs(num(it.IN_VALOR_TOTAL,0)-total)>0.009) it.IN_VALOR_TOTAL = total;
    if(up(it.IN_TIPO_DESCRICAO)==='PRODUTO') produtos += total; else servicos += total;
    if(empId){
      const prod = produtoPorCodigo(it.IN_COD_PRODUTO, empId);
      if(prod){
        if(it.IN_NCM && !prod.ncm) prod.ncm = txt(it.IN_NCM);
        if(it.IN_CEST && !prod.cest) prod.cest = txt(it.IN_CEST);
        if(it.IN_ENQ_IPI && !prod.enqIpi) prod.enqIpi = txt(it.IN_ENQ_IPI);
      }
    }
  });
  return { produtos:round2(produtos), servicos:round2(servicos), itens };
}

function observacaoNota(nota, venda, leitura){
  let obs = txt(nota.infoAdicionais);
  if(venda){
    obs = txt((venda.observacao||'') + ' - Venda: ' + (venda.numero||nota.codVenda));
    const parcelas = (db.contasReceber||[]).filter(cr=>cr.vendaId===venda.id && cr.status!=='pago');
    if(parcelas.length){
      obs += '\n' + parcelas.map((cr,idx)=>`Parc. ${idx+1}, Venc. ${cr.vencimento||''}, Valor ${num(cr.valor,0).toFixed(2).replace('.',',')}`).join(' -> ');
    }
  }
  if(leitura) obs = txt(obs + ' - Leitura: ' + (leitura.codigoAntigo||nota.codLeitura||leitura.id));
  if(nota.indFinal===1 && nota.totalImpostos>0){
    obs += '\nValor aproximado total dos tributos: R$ ' + nota.totalImpostos.toFixed(2).replace('.', ',') + ' Fonte: IBPT';
  }
  return obs;
}

function sincronizarNotasFiscaisPreparadas(empId){
  const rawNotas=rows('NOTA_FISCAL');
  if(!rawNotas.length) return 0;
  db.notasFiscaisMigradas=db.notasFiscaisMigradas||[];
  db.faturasNfe=db.faturasNfe||[];
  let alterou=0;
  rawNotas.forEach(raw=>{
    const codigo=cod(pick(raw,['NF_CODIGO'])); if(!codigo) return;
    const base=defaultsNotaFiscal(raw, empId);
    const venda=vendaPorCodigo(base.codVenda, empId);
    const leitura=leituraPorCodigo(base.codLeitura, empId);
    const totals=totaisNotaPorItens(codigo, empId);
    base.valorProdutos = totals.produtos || base.valorProdutos;
    base.valorServico = totals.servicos || base.valorServico;
    base.valorTotal = round2(base.valorProdutos + base.valorServico + base.valorFrete + base.valorSeguro + base.valorAcrescimo - base.valorDesconto);
    base.infoAdicionais = observacaoNota(base, venda, leitura);
    let nota=db.notasFiscaisMigradas.find(n=>n.empresaId===empId&&n.codigoAntigo===codigo);
    if(nota) Object.assign(nota, base); else {nota={id:uidSafe('nf'),...base}; db.notasFiscaisMigradas.push(nota);}
    if(venda){
      venda.nfe = base.cancelada ? null : 'S';
      venda.notaFiscalNumero = base.cancelada ? null : base.numero;
      alterou++;
    }
    if(leitura){
      leitura.notaFiscalId = base.cancelada ? null : nota.id;
      alterou++;
    }
    (db.contasReceber||[]).forEach(cr=>{
      if((venda&&cr.vendaId===venda.id)||(leitura&&cr.leituraId===leitura.id)){
        if(base.cancelada){ cr.nfe=null; cr.notaFiscalId=null; cr.observacao=(cr.observacao||'')+' NF-e cancelada: '+base.numero; }
        else { cr.nfe='S'; cr.notaFiscalId=nota.id; }
        alterou++;
      }
    });
    if(base.modelo===55){
      const titulos=(db.contasReceber||[]).filter(cr=>((venda&&cr.vendaId===venda.id)||(leitura&&cr.leituraId===leitura.id))&&cr.status!=='pago');
      titulos.forEach((cr,idx)=>{
        const key=nota.id+'-'+cr.id;
        if(!db.faturasNfe.find(f=>f.key===key)) db.faturasNfe.push({id:uidSafe('fn'),key,notaFiscalId:nota.id,contaReceberId:cr.id,nDup:String(idx+1).padStart(3,'0'),valor:cr.valor||0,vencimento:cr.vencimento});
      });
    }
  });
  return alterou;
}

function somarInsumosCartucho(codCartucho){
  return rows('ITENS_INSUMOS').filter(i=>cod(i.COD_CARTUCHO)===cod(codCartucho)).reduce((s,it)=>s+num(it.VALOR_TOTAL, num(it.QTDE,0)*num(it.VALOR_UNITARIO,0)),0);
}
function fabricanteNome(codFab){ const r=rows('FABRICANTE').find(f=>cod(f.COD_FABRICANTE)===cod(codFab)); return txt(r&&r.NOME) || ''; }
function sincronizarCartuchos(empId){
  const raw=rows('CARTUCHOS');
  if(!raw.length) return 0;
  db.cartuchosMigrados=db.cartuchosMigrados||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['COD_CARTUCHO'])); if(!codigo) return;
    const tipo=txt(pick(r,['TIPO']));
    const fab=fabricanteNome(pick(r,['COD_FABRICANTE']));
    const numero=txt(pick(r,['NUMERO']));
    const cor=txt(pick(r,['COR']));
    const nome=txt(pick(r,['DESCRICAO'])) || ['Cartucho', tipo, fab, numero, cor].filter(Boolean).join(' ');
    const valorInsumos=somarInsumosCartucho(codigo)+num(pick(r,['VALOR_OUTROS_CUSTOS']),0);
    let c=db.cartuchosMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,nome,categoria:'Cartucho',tipo,fabricante:fab,numero,cor,qtdeCopias:num(pick(r,['QTDE_COPIAS']),0),valorInsumos,ocultar:pick(r,['OCULTAR'])||'N',resetarImpressora:pick(r,['RESETAR_IMPRESSORA_CARTUCHO'])||'N'};
    if(c) Object.assign(c,dados); else {c={id:uidSafe('cart'),...dados}; db.cartuchosMigrados.push(c);}
    const prodNome='Cartucho Vazio '+[tipo,fab,numero,cor].filter(Boolean).join(' ');
    if(prodNome.trim()!=='Cartucho Vazio'){
      let p=(db.produtos||[]).find(p=>p.empresaId===empId && (p.cartuchoCodigoAntigo===codigo || up(p.nome)===up(prodNome)));
      const payload={empresaId:empId,cartuchoCodigoAntigo:codigo,sku:'CARTVAZ-'+codigo,nome:prodNome,categoria:'Cartucho Vazio',fabricante:fab,estoque:0,estoqueMin:0,custo:0,preco:0,status:'ativo',controleEstoque:true};
      if(p) Object.assign(p,payload); else db.produtos.push({id:uidSafe('prd'),criadoEm:agora(),criadoPor:'migracao',criadoPorNome:'Migração',...payload});
    }
    alterou++;
  });
  return alterou;
}

function sincronizarVariacoes(empId){
  const vars=rows('PRODUTOS_VARIACAO');
  const itens=rows('PRODUTOS_VARIACAO_ITENS');
  if(!vars.length&&!itens.length) return 0;
  db.produtosVariacaoMigrados=db.produtosVariacaoMigrados||[];
  db.produtosVariacaoItensMigrados=db.produtosVariacaoItensMigrados||[];
  vars.forEach(v=>{
    const codigo=cod(v.PRV_CODIGO); if(!codigo) return;
    const prod=produtoPorCodigo(v.PRV_COD_PRODUTO, empId);
    let row=db.produtosVariacaoMigrados.find(x=>x.codigoAntigo===codigo&&x.empresaId===empId);
    const dados={empresaId:empId,codigoAntigo:codigo,produtoId:prod?prod.id:null,produtoCodigoAntigo:cod(v.PRV_COD_PRODUTO),identificacao:txt(v.PRV_IDENTIFICACAO),qtde:Math.max(0,num(v.PRV_QTDE,1)),valorTotal:num(v.PRV_VALOR_TOTAL, prod?prod.preco:0),valorCusto:num(v.PRV_VALOR_CUSTO, prod?prod.custo:0),data:v.PRV_DATA||agora()};
    if(row) Object.assign(row,dados); else db.produtosVariacaoMigrados.push({id:uidSafe('prv'),...dados});
  });
  itens.forEach(v=>{
    const codigo=cod(v.PVI_CODIGO); if(!codigo) return;
    let row=db.produtosVariacaoItensMigrados.find(x=>x.codigoAntigo===codigo&&x.empresaId===empId);
    const dados={empresaId:empId,codigoAntigo:codigo,variacaoCodigoAntigo:cod(v.PVI_COD_VARIACAO||v.PVI_COD_PRODUTO_VARIACAO),data:v.PVI_DATA||agora(),funcionarioCodigoAntigo:cod(v.PVI_COD_FUNCIONARIO)};
    if(row) Object.assign(row,dados); else db.produtosVariacaoItensMigrados.push({id:uidSafe('pvi'),...dados});
  });
  return vars.length+itens.length;
}

function sincronizarInsumosGastos(empId){
  const raw=rows('ITENS_INSUMOS_GASTOS');
  if(!raw.length) return 0;
  db.insumosGastosMigrados=db.insumosGastosMigrados||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(r.COD_ITENS_INSUMOS_GASTOS); if(!codigo) return;
    const prod=produtoPorCodigo(r.COD_PRODUTO, empId);
    const qtde=num(r.QTDE,0);
    const valorUnit=num(r.VALOR_UNITARIO,0);
    const valorTotal=round2(qtde*valorUnit);
    const valorUnitCusto=num(r.VALOR_UNIT_CUSTO, prod?prod.custo:0);
    const valorTotalCusto=round2(qtde*valorUnitCusto);
    let row=db.insumosGastosMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,itemRecargaCodigoAntigo:cod(r.COD_ITENS_RECARGA),produtoId:prod?prod.id:null,produtoCodigoAntigo:cod(r.COD_PRODUTO),qtde,valorUnitario:valorUnit,valorTotal,valorUnitCusto,valorTotalCusto,somarInsumo:r.SOMAR_INSUMO||'S',mostrarInsumo:r.MOSTRAR_INSUMO||'S'};
    if(row) Object.assign(row,dados); else db.insumosGastosMigrados.push({id:uidSafe('ig'),...dados});
    alterou++;
  });
  const porRecarga={};
  db.insumosGastosMigrados.forEach(x=>{ if(x.empresaId===empId && x.somarInsumo!=='N'){ const k=x.itemRecargaCodigoAntigo; if(k) porRecarga[k]=(porRecarga[k]||0)+num(x.valorTotal,0); } });
  (db.vendas||[]).filter(v=>v.empresaId===empId).forEach(v=>{
    (v.itens||[]).forEach(it=>{
      const k=cod(it.codigoAntigo||it.itemCodigoAntigo||it.codItensVenda);
      if(k && porRecarga[k]!=null){ it.valorInsumos=round2(porRecarga[k]); }
    });
  });
  return alterou;
}

function aplicarEstornosMigrados(empId){
  const raw=rows('ESTORNOS');
  if(!raw.length) return 0;
  db.estornosMigrados=db.estornosMigrados||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(r.ES_COD_ESTORNO); if(!codigo) return;
    let e=db.estornosMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const tabela=up(r.ES_TABELA);
    const alvo=cod(r.ES_CODIGO);
    const dados={empresaId:empId,codigoAntigo:codigo,tabela,alvoCodigoAntigo:alvo,dataHora:r.ES_DATA_HORA||agora(),motivo:txt(r.ES_MOTIVO),dados:txt(r.ES_DADOS)};
    if(e) Object.assign(e,dados); else db.estornosMigrados.push({id:uidSafe('est'),...dados});
    if(tabela==='VENDAS'){
      const v=vendaPorCodigo(alvo, empId);
      if(v && v.status!=='estornada'){ v.status='estornada'; v.estornada=true; alterou++; }
      db.contasReceber=(db.contasReceber||[]).map(cr=>cr.vendaId===(v&&v.id)?Object.assign(cr,{status:'estornado',estornado:true}):cr);
    }
    if(tabela==='LEITURAS'){
      const l=(db.leituras||[]).find(x=>x.empresaId===empId&&(cod(x.codigoAntigo)===alvo||cod(x.idLegado)===alvo));
      if(l){ l.status='estornada'; l.estornada=true; alterou++; }
    }
    if(tabela==='CONTAS_RECEBER'){
      const cr=(db.contasReceber||[]).find(x=>x.empresaId===empId&&(cod(x.codigoAntigo)===alvo||cod(x.idLegado)===alvo||cod(x.id)===alvo));
      if(cr){ cr.status='estornado'; cr.estornado=true; alterou++; }
    }
  });
  return alterou;
}

function aplicarAutomacoesFiscalCartuchos(empId){
  if(!db||!empId) return 0;
  db.config=db.config||{};
  db.config.automacoes=db.config.automacoes||{};
  const sig=assinaturaTabela(['NOTA_FISCAL','ITENS_NOTA','CARTUCHOS','ITENS_INSUMOS','PRODUTOS_VARIACAO','PRODUTOS_VARIACAO_ITENS','ITENS_INSUMOS_GASTOS','ESTORNOS']);
  if(db.config.automacoes.fiscalCartuchosAssinatura===sig) return 0;
  let total=0;
  total+=sincronizarNotasFiscaisPreparadas(empId);
  total+=sincronizarCartuchos(empId);
  total+=sincronizarVariacoes(empId);
  total+=sincronizarInsumosGastos(empId);
  total+=aplicarEstornosMigrados(empId);
  db.config.automacoes.fiscalCartuchosAssinatura=sig;
  if(total) salvar();
  return total;
}

window.AUTOMACOES_FISCAL_CARTUCHOS_PURE={ defaultsNotaFiscal, totaisNotaPorItens, observacaoNota, sincronizarNotasFiscaisPreparadas, somarInsumosCartucho, sincronizarCartuchos, sincronizarVariacoes, sincronizarInsumosGastos, aplicarEstornosMigrados, aplicarAutomacoesFiscalCartuchos };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s=sess(); if(s) aplicarAutomacoesFiscalCartuchos(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; setTimeout(run,600); return ret; };
const oldRenderProdutos=window.renderProdutos;
window.renderProdutos=function(){ run(); return oldRenderProdutos?oldRenderProdutos.apply(this,arguments):undefined; };
const oldRenderVendas=window.renderVendas;
window.renderVendas=function(){ run(); return oldRenderVendas?oldRenderVendas.apply(this,arguments):undefined; };
const oldRenderFinanceiro=window.renderFinanceiro;
window.renderFinanceiro=function(){ run(); return oldRenderFinanceiro?oldRenderFinanceiro.apply(this,arguments):undefined; };
setTimeout(run,1400);
console.log('[DIGICOPY] automacoes_fiscal_cartuchos_patch.js v4.9.25 carregado');
})();
