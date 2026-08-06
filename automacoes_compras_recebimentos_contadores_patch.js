// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.30 — Automações de vendas, compras, recebimentos, contadores e loja
// • Continuação da adaptação das triggers úteis do banco anterior — Parte 10
// • Vendas migradas recebem defaults de abertura, cliente/endereço e limpeza segura ao excluir
// • Compras recalculam rateios, custos, produtos criados pela compra e estornos históricos
// • Contador de páginas recalcula leituras e medidores do contrato/parque
// • Recebimentos são preservados com baixa histórica segura; Pix continua sem baixa automática
// • Carrinho/tokens da loja e auxiliares ficam consultáveis sem rotinas pesadas
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function num(v, fb=0){ const out=Number(String(v ?? '').replace(',', '.')); return Number.isFinite(out)?out:fb; }
function inteiro(v, fb=0){ const out=parseInt(String(v ?? ''),10); return Number.isFinite(out)?out:fb; }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function round2(v){ return Math.round(num(v,0)*100)/100; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function agora(){ return new Date().toISOString(); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }
function assinaturaTabela(nomes){ return nomes.map(nome=>{ const r=rows(nome); const last=r[r.length-1]||{}; return `${nome}:${r.length}:${JSON.stringify(last).slice(0,90)}`; }).join('|'); }
function ehSim(v){ const s=up(v); return s==='S'||s==='SIM'||s==='1'||s==='TRUE'||s==='FINALIZADA'||s==='FINALIZADO'; }
function dataISO(v){ if(!txt(v)) return ''; const d=new Date(v); return Number.isNaN(d.getTime())?txt(v):d.toISOString(); }
function addDias(data, dias){ const d=new Date(data||Date.now()); if(Number.isNaN(d.getTime())) return hoje(); d.setDate(d.getDate()+inteiro(dias,0)); return d.toISOString().slice(0,10); }
function placeholderEndereco(v){ return ['RUA','BAIRRO','CIDADE','NUMERO','NÚMERO','CEP','UF'].includes(up(v)); }
function safeSet(obj,k,v){ if(txt(v)!=='' && (!txt(obj[k]) || placeholderEndereco(obj[k]))){ obj[k]=v; return true; } return false; }
function limparMotivo(v){ return up(v).replace(/["\\]/g,'').replace(/\+$/,'').replace(/\s+/g,' ').trim(); }

function cfg(){ return rows('CONFIGURACAO')[0]||{}; }
function cfgSim(nome){ return up(pick(cfg(),[nome]))==='S'; }
function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId&&(cod(x.codigo)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p=>p.empresaId===empId&&(cod(p.sku)===c||cod(p.codigo)===c||cod(p.codigoAntigo)===c||cod(p.idLegado)===c))||null; }
function vendaPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.vendas||[]).find(v=>v.empresaId===empId&&(cod(v.numero)===c||cod(v.codigoAntigo)===c||cod(v.idLegado)===c))||null; }
function equipamentoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.equipamentos||[]).find(e=>e.empresaId===empId&&(cod(e.codigoAntigo)===c||cod(e.codigo)===c||cod(e.idLegado)===c||cod(e.id)===c))||null; }
function parquePorItem(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.parque||[]).find(p=>p.empresaId===empId&&cod(p.codigoAntigo)===c)||null; }
function leituraPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.leituras||[]).find(l=>l.empresaId===empId&&(cod(l.codigoAntigo)===c||cod(l.numero)===c||cod(l.idLegado)===c||cod(l.id)===c))||null; }
function contaReceberPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.contasReceber||[]).find(cr=>cr.empresaId===empId&&(cod(cr.legadoCodigo)===c||cod(cr.codigoAntigo)===c||cod(cr.codParcela)===c||cod(cr.COD_PARCELA)===c||cod(cr.idLegado)===c))||null; }
function contaPagarPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.contasPagar||[]).find(cp=>cp.empresaId===empId&&(cod(cp.legadoCodigo)===c||cod(cp.codigoAntigo)===c||cod(cp.codPagar)===c||cod(cp.COD_PAGAR)===c||cod(cp.idLegado)===c))||null; }
function empresaPadrao(empId){ return (db.empresas||[]).find(e=>e.id===empId)||(db.empresas||[])[0]||{}; }
function clientePadrao(empId){ return (db.clientes||[]).find(c=>c.empresaId===empId)||null; }
function formaRecebimento(c){ const x=cod(c); if(x==='1') return 'Dinheiro'; if(x==='2') return 'Cheque'; if(x==='3') return 'Cartão de crédito'; if(x==='4') return 'Cartão de débito'; if(x==='9') return 'Pix'; return x?'Recebimento '+x:''; }
function proximoCodigoProduto(empId){ const nums=(db.produtos||[]).filter(p=>p.empresaId===empId).map(p=>Number(cod(p.sku||p.codigo||p.codigoAntigo))).filter(Number.isFinite); return String((nums.length?Math.max(...nums):0)+1); }

function vendaCodigo(row){ return cod(pick(row,['COD_VENDA','CODIGO','NUMERO','ID'])); }
function enderecoCliente(cli, emp){
  return {
    rua:txt(cli&&((cli.rua)||(cli.endereco)))||txt(emp.endereco||emp.rua),
    bairro:txt(cli&&cli.bairro)||txt(emp.bairro),
    cidade:txt(cli&&cli.cidade)||txt(emp.cidade),
    cep:txt(cli&&cli.cep)||txt(emp.cep),
    uf:txt(cli&&((cli.uf)||(cli.estado)))||txt(emp.uf||emp.estado),
    complemento:txt(cli&&cli.complemento),
    numero:txt(cli&&cli.numero)||txt(emp.numero),
    longitude:txt(cli&&cli.longitude),
    latitude:txt(cli&&cli.latitude)
  };
}
function aplicarDefaultsVendaRaw(row, empId){
  const codigo=vendaCodigo(row); if(!codigo) return 0;
  db.vendas=db.vendas||[];
  let v=vendaPorCodigo(codigo, empId);
  const nova=!v;
  if(!v){ v={id:uidSafe('vda'),empresaId:empId,numero:codigo,codigoAntigo:codigo,itens:[],criadoPor:'migracao',criadoPorNome:'Migração',criadoEm:agora(),origem:'venda_migrada_parte10'}; db.vendas.push(v); }
  const antes=JSON.stringify(v);
  const codCli=cod(pick(row,['COD_CLIENTE']));
  let cli=clientePorCodigo(codCli, empId);
  if(!cli && !codCli) cli=clientePadrao(empId);
  const emp=empresaPadrao(empId);
  const end=enderecoCliente(cli, emp);
  v.empresaId=empId;
  v.numero=txt(v.numero)||codigo;
  v.codigoAntigo=txt(v.codigoAntigo)||codigo;
  v.codVendaSeq=cod(pick(row,['COD_VENDA_SEQ']))||v.codVendaSeq||codigo;
  if(cli){
    v.clienteId=cli.id;
    v.codClienteAntigo=cod(cli.codigoAntigo||cli.codigo)||codCli;
    v.clienteNomeAntigo=txt(pick(row,['NOME_CLIENTE']))||cli.nome||cli.fantasia||v.clienteNomeAntigo;
    v.telefone=txt(pick(row,['TELEFONE']))||cli.telefone||v.telefone||'';
    v.email=txt(pick(row,['EMAIL']))||cli.email||v.email||'';
  }
  const rua=txt(pick(row,['RUA']))||end.rua;
  const numero=txt(pick(row,['NUMERO']))||end.numero;
  v.rua=rua; v.endereco=rua; v.bairro=txt(pick(row,['BAIRRO']))||end.bairro; v.cidade=txt(pick(row,['CIDADE']))||end.cidade; v.cep=txt(pick(row,['CEP']))||end.cep; v.uf=txt(pick(row,['UF']))||end.uf; v.complemento=txt(pick(row,['COMPLEMENTO']))||end.complemento; v.numeroEndereco=numero; v.longitude=txt(pick(row,['LONGITUDE']))||end.longitude; v.latitude=txt(pick(row,['LATITUDE']))||end.latitude;
  if(cli){ safeSet(cli,'endereco',v.rua); safeSet(cli,'rua',v.rua); safeSet(cli,'bairro',v.bairro); safeSet(cli,'cidade',v.cidade); safeSet(cli,'cep',v.cep); safeSet(cli,'estado',v.uf); safeSet(cli,'uf',v.uf); safeSet(cli,'numero',v.numeroEndereco); safeSet(cli,'complemento',v.complemento); safeSet(cli,'longitude',v.longitude); safeSet(cli,'latitude',v.latitude); }
  const codEq=cod(pick(row,['COD_EQUIPAMENTO']));
  const eq=equipamentoPorCodigo(codEq, empId);
  if(eq){ v.equipamentoId=eq.id; v.tipo='S'; if(!txt(v.teste)) v.teste='NAO'; }
  v.codFuncionario=cod(pick(row,['COD_FUNCIONARIO']))||v.codFuncionario||'';
  if(cfgSim('VENDEDOR_CLIENTE_VENDA') && cli) v.codFuncionario=cod(cli.codFuncionario||cli.codigoFuncionario||cli.funcionarioCodigoAntigo)||v.codFuncionario;
  if(cfgSim('COM_VEND_VENDEDOR_CLIENTE') && cli) v.codFuncionarioComissao=cod(cli.codFuncionario||cli.codigoFuncionario||cli.funcionarioCodigoAntigo)||v.codFuncionario; else v.codFuncionarioComissao=v.codFuncionarioComissao||v.codFuncionario;
  v.data=dataISO(pick(row,['DATA']))||v.data||agora();
  v.hora=txt(pick(row,['HORA']))||v.hora||new Date().toTimeString().slice(0,8);
  const finalizada=ehSim(pick(row,['FINALIZADA']));
  if(!txt(v.status) || ['aberto','aberta','aguardar'].includes(txt(v.status).toLowerCase())) v.status=finalizada?'finalizada':'aberta';
  v.finalizada=finalizada;
  v.estornar=ehSim(pick(row,['ESTORNAR']));
  v.emEstoque=ehSim(pick(row,['EM_ESTOQUE']));
  v.P=txt(pick(row,['P']))||v.P||'N'; v.C=txt(pick(row,['C']))||v.C||'N'; v.T=txt(pick(row,['T']))||v.T||'N';
  v.smsProcessando='N'; v.smsConcluindo='N'; v.smsConcluido='N';
  v.tipo=txt(pick(row,['TIPO']))||v.tipo||'V';
  v.codRecebimento=cod(pick(row,['COD_RECEBIMENTO'])); if(v.codRecebimento==='0') v.codRecebimento='';
  v.valorInsumos=num(pick(row,['VALOR_INSUMOS']),num(v.valorInsumos,0));
  v.valorAcrescimo=num(pick(row,['VALOR_ACRESCIMO']),num(v.valorAcrescimo,0));
  v.valorSeguro=num(pick(row,['VALOR_SEGURO']),num(v.valorSeguro,0));
  v.desconto=num(pick(row,['VALOR_DESCONTO']),num(v.desconto,0));
  v.valorPecas=num(pick(row,['VALOR_PECAS']),num(v.valorPecas,0));
  v.valorServico=num(pick(row,['VALOR_SERVICO']),num(v.valorServico,0));
  v.valorFrete=num(pick(row,['VALOR_FRETE']),num(v.valorFrete,0));
  v.valorMaoDeObra=num(pick(row,['VALOR_MAO_DE_OBRA']),num(v.valorMaoDeObra,0));
  v.percentualDesc=num(pick(row,['PERCENTUAL_DESC']),num(v.percentualDesc,0));
  if(v.total==null || num(v.total,0)===0) v.total=num(pick(row,['VALOR_TOTAL']),0);
  if(!txt(v.formaEntrega)) v.formaEntrega=(rua && numero && !placeholderEndereco(rua) && !placeholderEndereco(numero))?'ENTREGAR':'AGUARDAR';
  if(v.codRecebimento) garantirItemRecebimentoVenda(v, empId);
  if(Number(pick(row,['DEL','VEN_DEL']))===1) limparVinculosVendaExcluida(v, empId);
  return nova || antes!==JSON.stringify(v) ? 1 : 0;
}
function garantirItemRecebimentoVenda(v, empId){
  db.itensRecebimentoMigrados=db.itensRecebimentoMigrados||[];
  const key='VENDA-'+cod(v.numero||v.codigoAntigo)+'-'+cod(v.codRecebimento);
  let it=db.itensRecebimentoMigrados.find(x=>x.key===key&&x.empresaId===empId);
  const dados={empresaId:empId,key,codigoAntigo:key,vendaId:v.id,vendaCodigoAntigo:cod(v.numero||v.codigoAntigo),codRecebimento:cod(v.codRecebimento),formaRecebimento:formaRecebimento(v.codRecebimento),valor:num(v.total,0),origem:'venda_insert',baixaAutomatica:false};
  if(it) Object.assign(it,dados); else db.itensRecebimentoMigrados.push({id:uidSafe('ire'),...dados});
}
function limparVinculosVendaExcluida(v, empId){
  const cv=cod(v.numero||v.codigoAntigo||v.idLegado); if(!cv) return 0;
  let alterou=0;
  v.status='excluida'; v.excluida=true; v.finalizada=false;
  const remanu=(v.itens||[]).filter(it=>/REMANU/i.test(up(it.tipoDescricao||it.tipo||it.situacao||it.descricao)));
  if(remanu.length){
    db.itensRemanufaturaDesvinculados=db.itensRemanufaturaDesvinculados||[];
    remanu.forEach((it,idx)=>{ const key='REM-'+cv+'-'+idx; if(!db.itensRemanufaturaDesvinculados.find(x=>x.key===key)) db.itensRemanufaturaDesvinculados.push({id:uidSafe('rem'),key,empresaId:empId,vendaCodigoAntigo:cv,item:{...it},dataDesvinculado:agora()}); });
  }
  v.itens=[];
  (db.itensRecebimentoMigrados||[]).forEach(ir=>{ if(ir.vendaId===v.id||cod(ir.vendaCodigoAntigo)===cv){ ir.vendaId=null; ir.canceladoPorVendaExcluida=true; alterou++; } });
  (db.despesasLocacao||[]).forEach(d=>{ if(d.vendaId===v.id||cod(d.vendaCodigoAntigo)===cv||cod(d.dpCodVenda)===cv){ d.vendaId=null; d.canceladaPorVendaExcluida=true; alterou++; } });
  (db.contasReceber||[]).forEach(cr=>{ if(cr.vendaId===v.id||cod(cr.codVenda||cr.COD_VENDA)===cv){ cr.status='cancelado'; cr.vendaExcluidaId=v.id; cr.vendaId=null; cr.pagamentoData=null; cr.baixaAutomatica=false; alterou++; } });
  (db.vendas||[]).forEach(o=>{ if(o.vendaGeradaId===v.id || cod(o.ORC_COD_VENDA)===cv){ o.vendaGeradaId=null; o.status='orcamento'; alterou++; } });
  (db.os||[]).forEach(o=>{ if(o.vendaId===v.id||cod(o.vendaCodigoAntigo)===cv||cod(o.viCodVenda)===cv){ o.vendaId=null; o.vendaGeradaId=null; alterou++; } });
  (db.agendaMigrada||[]).forEach(a=>{ if(a.vendaId===v.id||cod(a.codVenda)===cv||cod(a.vendaCodigoAntigo)===cv){ a.vendaId=null; a.codVenda=''; a.estornar=false; alterou++; } });
  return alterou;
}
function atualizarOrdensVenda(empId){
  const clienteQtd={}, eqQtd={}, ultimo={};
  (db.vendas||[]).filter(v=>v.empresaId===empId&&!v.excluida).forEach(v=>{
    if(v.clienteId){ clienteQtd[v.clienteId]=(clienteQtd[v.clienteId]||0)+1; if(!ultimo[v.clienteId]||new Date(v.data||0)>new Date(ultimo[v.clienteId]||0)) ultimo[v.clienteId]=v.data; }
    if(v.equipamentoId) eqQtd[v.equipamentoId]=(eqQtd[v.equipamentoId]||0)+1;
  });
  let alterou=0;
  (db.clientes||[]).forEach(c=>{ if(c.empresaId===empId&&clienteQtd[c.id]){ if(c.cliOrdem!==clienteQtd[c.id]){ c.cliOrdem=clienteQtd[c.id]; alterou++; } if(ultimo[c.id]&&c.ultimoAcesso!==ultimo[c.id]){ c.ultimoAcesso=ultimo[c.id]; alterou++; } } });
  (db.equipamentos||[]).forEach(e=>{ if(e.empresaId===empId&&eqQtd[e.id]&&e.eqOrdem!==eqQtd[e.id]){ e.eqOrdem=eqQtd[e.id]; alterou++; } });
  return alterou;
}
function sincronizarVendasParte10(empId){
  const raw=rows('VENDAS'); if(!raw.length && !(db.vendas||[]).length) return 0;
  let total=0;
  raw.forEach(r=>{ total+=aplicarDefaultsVendaRaw(r, empId); });
  (db.vendas||[]).filter(v=>v.empresaId===empId&&v.excluida).forEach(v=>{ total+=limparVinculosVendaExcluida(v, empId); });
  total+=atualizarOrdensVenda(empId);
  return total;
}

function itemCompraCodigo(row){ return cod(pick(row,['COD_ITENS_COMPRA','COD_ITEM','CODIGO','ID'])); }
function compraCodigo(row){ return cod(pick(row,['COD_COMPRA','COM_COD_COMPRA','CODIGO','ID'])); }
function calcularRateioCompra(compra, itens){
  const frete=num(pick(compra,['FRETE','VALOR_FRETE']),0), acres=num(pick(compra,['VALOR_ACRESCIMO','ACRESCIMO']),0), desc=num(pick(compra,['VALOR_DESCONTO','DESCONTO']),0);
  const soma=itens.reduce((s,i)=>s+num(pick(i,['VALOR_TOTAL','TOTAL']),0),0);
  const out={};
  itens.forEach(i=>{ const ci=itemCompraCodigo(i); const base=num(pick(i,['VALOR_TOTAL','TOTAL']),0); const perc=soma>0?base/soma:0; out[ci]={frete:round2(frete*perc), acrescimo:round2(acres*perc), desconto:round2(desc*perc)}; });
  return out;
}
function custoItemCompra(row, rateio){
  let qtde=num(pick(row,['QTDE','QTD','QUANTIDADE']),1)||1;
  let unit=num(pick(row,['VALOR_UNITARIO','PRECO','VALOR']),0);
  let und=up(pick(row,['UND_MEDIDA','UNIDADE']))||'UN';
  const desc=num(pick(row,['VALOR_DESCONTO','DESCONTO']),0)+num(rateio&&rateio.desconto,0);
  const icms=num(pick(row,['VALOR_ICMS_ST','ICMS_ST']),0);
  const ipi=num(pick(row,['VALOR_IPI','IPI']),0);
  const frete=num(pick(row,['VALOR_FRETE']),0)+num(rateio&&rateio.frete,0);
  const acres=num(pick(row,['VALOR_ACRESCIMOS','VALOR_ACRESCIMO']),0)+num(rateio&&rateio.acrescimo,0);
  let custo=qtde>0?unit-(desc/qtde)+(icms/qtde)+(ipi/qtde)+(frete/qtde)+(acres/qtde):unit;
  let convertido=false;
  if(cfgSim('CONVERTER_UND_MEDIDA_ESTOQUE') && (und==='KG'||und==='LT')){
    if(und==='KG') und='GR';
    if(und==='LT') und='ML';
    custo=custo/1000; qtde=qtde*1000; convertido=true;
  }
  return {qtde,unit,und,custoUnitario:round2(custo),frete:round2(frete),acrescimo:round2(acres),desconto:round2(desc),convertido};
}
function criarProdutoCompraSePreciso(row, compra, empId, calc){
  const codProd=cod(pick(row,['COD_PRODUTO']));
  let prod=produtoPorCodigo(codProd, empId);
  if(prod) return prod;
  const desc=txt(pick(row,['DESCRICAO','PRODUTO','NOME'])); if(!desc) return null;
  const barra=txt(pick(row,['CODIGO_BARRA','COD_BARRA','EAN']));
  prod=(db.produtos||[]).find(p=>p.empresaId===empId&&((barra&&txt(p.codigoBarra)===barra)||up(p.nome)===up(desc)));
  if(prod) return prod;
  const codigo=proximoCodigoProduto(empId);
  const lucroV=num(pick(cfg(),['LUCRO_PROD_VAREJO']),30);
  const lucroP=num(pick(cfg(),['LUCRO_PROD_PROMOCAO']),20);
  const lucroA=num(pick(cfg(),['LUCRO_PROD_ATACADO']),10);
  prod={id:uidSafe('prd'),empresaId:empId,sku:codigo,codigo:codigo,nome:desc,categoria:'Geral',codigoBarra:barra,ncm:txt(pick(row,['NCM','PR_NCM'])),unidade:calc.und,estoque:0,estoqueMin:0,custo:calc.custoUnitario,preco:round2(calc.custoUnitario+(calc.custoUnitario*lucroV/100)),precoPromocao:round2(calc.custoUnitario+(calc.custoUnitario*lucroP/100)),precoAtacado:round2(calc.custoUnitario+(calc.custoUnitario*lucroA/100)),origem:pick(row,['IC_ORIGEM','PR_ORIGEM']),criadoPor:'migracao_compra',criadoPorNome:'Migração',criadoEm:agora()};
  db.produtos.push(prod);
  return prod;
}
function sincronizarComprasParte10(empId){
  const compras=rows('COMPRA'); const itens=rows('ITENS_COMPRA'); if(!compras.length && !itens.length) return 0;
  db.comprasMigradas=db.comprasMigradas||[]; db.itensCompraMigrados=db.itensCompraMigrados||[]; db.produtos=db.produtos||[];
  let alterou=0;
  const itensPorCompra={}; itens.forEach(i=>{ const cc=cod(pick(i,['COD_COMPRA'])); if(cc) (itensPorCompra[cc]=itensPorCompra[cc]||[]).push(i); });
  compras.forEach(c=>{
    const codigo=compraCodigo(c); if(!codigo) return;
    const lista=itensPorCompra[codigo]||[];
    const rateio=calcularRateioCompra(c, lista);
    let somaItens=0, somaIpi=0, somaIcms=0;
    lista.forEach(row=>{ somaItens+=num(pick(row,['VALOR_TOTAL','TOTAL']),0); somaIpi+=num(pick(row,['VALOR_IPI','IPI']),0); somaIcms+=num(pick(row,['VALOR_ICMS_ST','ICMS_ST']),0); });
    const total=round2(somaItens+somaIpi+somaIcms+num(pick(c,['VALOR_ACRESCIMO','ACRESCIMO']),0)-num(pick(c,['VALOR_DESCONTO','DESCONTO']),0)+num(pick(c,['FRETE','VALOR_FRETE']),0));
    let compra=db.comprasMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const estornar=ehSim(pick(c,['ESTORNAR']));
    const dados={empresaId:empId,codigoAntigo:codigo,dataFornecedor:pick(c,['DATA_FORNECEDOR','DATA'])||hoje(),situacao:txt(pick(c,['SITUACAO']))||'AGUARDANDO ENTREGA',finalizada:ehSim(pick(c,['FINALIZADA'])),estornada:estornar,valorTotal:total,frete:num(pick(c,['FRETE','VALOR_FRETE']),0),valorAcrescimo:num(pick(c,['VALOR_ACRESCIMO','ACRESCIMO']),0),valorDesconto:num(pick(c,['VALOR_DESCONTO','DESCONTO']),0),somenteHistorico:true};
    if(compra) Object.assign(compra,dados); else db.comprasMigradas.push({id:uidSafe('cmp'),...dados});
    if(estornar){
      (db.contasPagar||[]).forEach(cp=>{ if(cod(cp.codCompra||cp.COD_COMPRA)===codigo){ cp.status='cancelado'; cp.pagamentoData=null; cp.estornadaPorCompra=true; } });
      (db.movimentacaoMigrada||[]).forEach(m=>{ if(cod(m.compraCodigoAntigo||m.MOV_COD_COMPRA)===codigo) m.estornadaPorCompra=true; });
    }
    lista.forEach(row=>{
      const ci=itemCompraCodigo(row); if(!ci) return;
      const calc=custoItemCompra(row, rateio[ci]);
      let prod=produtoPorCodigo(pick(row,['COD_PRODUTO']), empId);
      if(dados.finalizada && !prod) prod=criarProdutoCompraSePreciso(row,c,empId,calc);
      let item=db.itensCompraMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===ci);
      const payload={empresaId:empId,codigoAntigo:ci,compraCodigoAntigo:codigo,produtoId:prod?prod.id:null,produtoCodigoAntigo:cod(pick(row,['COD_PRODUTO']))||(prod?cod(prod.sku||prod.codigo):''),descricao:txt(pick(row,['DESCRICAO','PRODUTO']))||(prod&&prod.nome)||'Item de compra',qtde:calc.qtde,valorUnitario:num(pick(row,['VALOR_UNITARIO','PRECO','VALOR']),0),valorTotal:num(pick(row,['VALOR_TOTAL','TOTAL']),0),valorFrete:calc.frete,valorAcrescimo:calc.acrescimo,valorDesconto:calc.desconto,custoUnitario:calc.custoUnitario,unidade:calc.und,unidadeConvertida:calc.convertido,ncm:txt(pick(row,['NCM'])),codigoBarra:txt(pick(row,['CODIGO_BARRA','COD_BARRA'])),origem:pick(row,['IC_ORIGEM'])};
      if(item) Object.assign(item,payload); else db.itensCompraMigrados.push({id:uidSafe('icp'),...payload});
      if(prod){ if(payload.ncm&&!prod.ncm) prod.ncm=payload.ncm; if(payload.codigoBarra&&!prod.codigoBarra) prod.codigoBarra=payload.codigoBarra; prod.ultimoCustoCompra=calc.custoUnitario; if(!prod.custo) prod.custo=calc.custoUnitario; }
      alterou++;
    });
    alterou++;
  });
  return alterou;
}

function departamentoDescricao(codigo){ const c=cod(codigo); const d=rows('DEPARTAMENTOS').find(x=>cod(pick(x,['DEP_COD_DEPARTAMENTO','COD_DEPARTAMENTO','CODIGO']))===c); return d?txt(pick(d,['DEP_DESCRICAO','DESCRICAO'])):''; }
function tipoContador(row){ return up(pick(row,['CP_TIPO','TIPO']))||up(pick(row,['CP_MODALIDADE']))||'PRETO'; }
function valorAtualContador(row){ return num(pick(row,['PAGINAS_ATUAL','CP_PAGINAS','PAGINAS','CP_CONTADOR_ATUAL']), num(pick(row,['CP_CONTADOR_ANTERIOR']),0)); }
function sincronizarContadorPaginasParte10(empId){
  const raw=rows('CONTADOR_PAGINAS'); if(!raw.length) return 0;
  db.contadorPaginasMigrados=db.contadorPaginasMigrados||[];
  let alterou=0;
  const porLeitura={}, porItemTipo={};
  raw.forEach(r=>{
    const codigo=cod(pick(r,['COD_CONTADOR','CODIGO'])); if(!codigo) return;
    const itemCod=cod(pick(r,['COD_ITENS_LOCACAO'])); const leituraCod=cod(pick(r,['CP_COD_LEITURA']));
    const p=parquePorItem(itemCod, empId);
    let dep=txt(pick(r,['CP_DEPARTAMENTO'])); if(!dep && p) dep=p.departamento||p.setor||''; if(!dep) dep=departamentoDescricao(pick(r,['IT_COD_DEPARTAMENTO','CP_COD_DEPARTAMENTO']));
    const data=pick(r,['DATA_LEITURA','CP_DATA_CAPTURADO'])||agora();
    const tipo=tipoContador(r);
    const valorTotal=num(pick(r,['CP_VALOR_TOTAL']),0);
    let c=db.contadorPaginasMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,parqueId:p?p.id:null,contratoId:p?p.contratoId:null,clienteId:p?p.clienteId:null,itemLocacaoCodigoAntigo:itemCod,leituraCodigoAntigo:leituraCod,equipamentoCodigoAntigo:cod(pick(r,['CP_COD_EQUIPAMENTO'])),dataLeitura:data,tipo,finalizada:ehSim(pick(r,['CP_FINALIZADA'])),funcionarioCodigoAntigo:cod(pick(r,['CP_COD_FUNCIONARIO'])),departamento:dep,franquia:num(pick(r,['CP_FRANQUIA']),0),modalidade:txt(pick(r,['CP_MODALIDADE'])),contadorAnterior:num(pick(r,['CP_CONTADOR_ANTERIOR']),0),paginasAtual:valorAtualContador(r),paginasExcedente:num(pick(r,['PAGINAS_EXCEDENTE']),0),valorPagina:num(pick(r,['CP_VALOR_PAGINAS']),0),valorDesconto:num(pick(r,['CP_VALOR_DESCONTO']),0),valorTotal};
    if(c) Object.assign(c,dados); else db.contadorPaginasMigrados.push({id:uidSafe('cpg'),...dados});
    if(leituraCod) (porLeitura[leituraCod]=porLeitura[leituraCod]||[]).push(dados);
    if(itemCod){ const key=itemCod+'|'+tipo; const old=porItemTipo[key]; if(!old || new Date(data)>new Date(old.dataLeitura||0) || Number(codigo)>Number(old.codigoAntigo||0)) porItemTipo[key]=dados; }
    alterou++;
  });
  Object.entries(porLeitura).forEach(([codLei,lista])=>{
    const l=leituraPorCodigo(codLei, empId); if(!l) return;
    const total=round2(lista.reduce((s,x)=>s+num(x.valorTotal,0),0));
    l.valorTotal=total; l.valorExcedente=total; l.totalContadoresMigrados=lista.length; l.atualizadoPorContadorPaginas=true; alterou++;
  });
  Object.values(porItemTipo).forEach(c=>{
    const p=parquePorItem(c.itemLocacaoCodigoAntigo, empId); if(!p) return;
    p.ultimaLeitura=c.dataLeitura;
    p.medidoresInicio=p.medidoresInicio||{};
    if(/COLOR_A3/.test(c.tipo)) p.medidoresInicio.colorA3=c.paginasAtual;
    else if(/PRETO_A3|A3/.test(c.tipo)) p.medidoresInicio.pretoA3=c.paginasAtual;
    else if(/COLOR|COR/.test(c.tipo)) p.medidoresInicio.color=c.paginasAtual;
    else if(/SCANNER|SCAN/.test(c.tipo)) p.medidoresInicio.scanner=c.paginasAtual;
    else p.medidoresInicio.preto=c.paginasAtual;
    alterou++;
  });
  return alterou;
}

function tokenCliente(token){ const t=txt(token); if(!t) return ''; const row=rows('SHOP_TOKEN').filter(x=>txt(pick(x,['SHT_TOKEN','TOKEN']))===t&&cod(pick(x,['SHT_COD_CLIENTE','COD_CLIENTE']))).sort((a,b)=>String(pick(b,['SHT_DATA','DATA'])).localeCompare(String(pick(a,['SHT_DATA','DATA']))))[0]; return row?cod(pick(row,['SHT_COD_CLIENTE','COD_CLIENTE'])):''; }
function sincronizarCarrinhoLoja(empId){
  const raw=rows('PRODUTOS_CARRINHO'); const tokens=rows('SHOP_TOKEN'); const acessos=rows('SHOP_ACESSOS'); if(!raw.length&&!tokens.length&&!acessos.length) return 0;
  db.produtosCarrinhoMigrados=db.produtosCarrinhoMigrados||[]; db.shopTokensMigrados=db.shopTokensMigrados||[]; db.shopAcessosMigrados=db.shopAcessosMigrados||[];
  let alterou=0;
  tokens.forEach(r=>{ const token=txt(pick(r,['SHT_TOKEN','TOKEN'])); if(!token) return; const cli=clientePorCodigo(pick(r,['SHT_COD_CLIENTE','COD_CLIENTE']),empId); let st=db.shopTokensMigrados.find(x=>x.token===token); const dados={empresaId:empId,token,clienteId:cli?cli.id:null,clienteCodigoAntigo:cod(pick(r,['SHT_COD_CLIENTE','COD_CLIENTE'])),data:pick(r,['SHT_DATA','DATA'])||agora(),somenteHistorico:true}; if(st) Object.assign(st,dados); else db.shopTokensMigrados.push({id:uidSafe('sht'),...dados}); alterou++; });
  acessos.forEach(r=>{ const codigo=cod(pick(r,['SHA_CODIGO','CODIGO'])); const token=txt(pick(r,['SHA_TOKEN','TOKEN'])); if(!codigo&&!token) return; const cli=clientePorCodigo(pick(r,['SHA_COD_CLIENTE','COD_CLIENTE'])||tokenCliente(token),empId); let a=db.shopAcessosMigrados.find(x=>x.empresaId===empId&&((codigo&&x.codigoAntigo===codigo)||(!codigo&&x.token===token))); const dados={empresaId:empId,codigoAntigo:codigo,token,clienteId:cli?cli.id:null,data:pick(r,['SHA_DATA','DATA'])||agora(),somenteHistorico:true}; if(a) Object.assign(a,dados); else db.shopAcessosMigrados.push({id:uidSafe('sha'),...dados}); alterou++; });
  raw.forEach(r=>{
    const codigo=cod(pick(r,['PRC_CODIGO','CODIGO'])); if(!codigo) return;
    const token=txt(pick(r,['PRC_TOKEN','TOKEN']));
    const cli=clientePorCodigo(pick(r,['PRC_COD_CLIENTE','COD_CLIENTE'])||tokenCliente(token), empId) || clientePadrao(empId);
    const prod=produtoPorCodigo(pick(r,['PRC_COD_PRODUTO','COD_PRODUTO']), empId);
    let item=db.produtosCarrinhoMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dup=cli&&prod&&db.produtosCarrinhoMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo!==codigo&&x.clienteId===cli.id&&x.produtoId===prod.id&&!x.removidoPorDuplicidade);
    const dados={empresaId:empId,codigoAntigo:codigo,token,clienteId:cli?cli.id:null,clienteCodigoAntigo:cli?cod(cli.codigoAntigo||cli.codigo):'',produtoId:prod?prod.id:null,produtoCodigoAntigo:cod(pick(r,['PRC_COD_PRODUTO','COD_PRODUTO'])),qtde:num(pick(r,['PRC_QTDE','QTDE']),1)||1,data:pick(r,['PRC_DATA','DATA'])||agora(),removidoPorDuplicidade:!!dup,somenteHistorico:true};
    if(item) Object.assign(item,dados); else db.produtosCarrinhoMigrados.push({id:uidSafe('prc'),...dados});
    alterou++;
  });
  return alterou;
}

function sincronizarItensRecebimento(empId){
  const raw=rows('ITENS_RECEBIMENTO'); if(!raw.length) return 0;
  db.itensRecebimentoMigrados=db.itensRecebimentoMigrados||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['COD_ITENS_RECEBIMENTO','CODIGO'])); if(!codigo) return;
    const venda=vendaPorCodigo(pick(r,['COD_VENDA']),empId);
    const valorRaw=pick(r,['VALOR']);
    let it=db.itensRecebimentoMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,vendaId:venda?venda.id:null,vendaCodigoAntigo:cod(pick(r,['COD_VENDA'])),codRecebimento:cod(pick(r,['COD_RECEBIMENTO'])),formaRecebimento:formaRecebimento(pick(r,['COD_RECEBIMENTO'])),valor:txt(valorRaw)===''?(venda?num(venda.total,0):0):num(valorRaw,0),baixaAutomatica:false,somenteHistorico:true};
    if(it) Object.assign(it,dados); else db.itensRecebimentoMigrados.push({id:uidSafe('ire'),...dados});
    if(cfgSim('CLI_ALTERAR_COD_RECEBIMENTO')&&venda&&venda.clienteId){ const cli=(db.clientes||[]).find(c=>c.id===venda.clienteId); if(cli) cli.codRecebimentoPadrao=dados.codRecebimento; }
    alterou++;
  });
  return alterou;
}
function dataRecebimento(row, cr, cp){
  const d=pick(row,['DATA']); if(d) return dataISO(d);
  const rec=cod(pick(row,['COD_RECEBIMENTO']) || (cr&&cr.codRecebimento));
  if(rec==='3') return addDias(hoje(), cod(cr&&cr.codRecebimento)==='3'?0:num(pick(cfg(),['CARTAO_DIAS_COMPENSAR_CREDITO']),0));
  if(rec==='4') return addDias(hoje(), cod(cr&&cr.codRecebimento)==='4'?0:num(pick(cfg(),['CARTAO_DIAS_COMPENSAR_DEBITO']),0));
  return hoje();
}
function addMovimentoRecebimento(key,dados){ db.movimentacaoRecebimentosMigrada=db.movimentacaoRecebimentosMigrada||[]; let m=db.movimentacaoRecebimentosMigrada.find(x=>x.key===key); if(m) Object.assign(m,dados); else db.movimentacaoRecebimentosMigrada.push({id:uidSafe('mvr'),key,...dados}); }
function sincronizarRecebimentosContas(empId){
  const raw=rows('RECEBIMENTO_CONTAS_RECEBER'); if(!raw.length) return 0;
  db.recebimentosContasMigrados=db.recebimentosContasMigrados||[]; db.contasPagarParciaisMigradas=db.contasPagarParciaisMigradas||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['COD_ITENS_RECEBIMENTO','CODIGO'])); if(!codigo) return;
    const cr=contaReceberPorCodigo(pick(r,['COD_PARCELA']), empId);
    const cp=contaPagarPorCodigo(pick(r,['COD_CONTAS_PAGAR','COD_PAGAR']), empId);
    const tipo=up(pick(r,['TIPO']))||'T';
    const rec=cod(pick(r,['COD_RECEBIMENTO']) || (cr&&cr.codRecebimento) || (cp&&cp.codRecebimento));
    const valor=num(pick(r,['VALOR']), cr?num(cr.valorParcela||cr.valor,0):cp?num(cp.valorParcela||cp.valor,0):0);
    const data=dataRecebimento(r,cr,cp);
    const pix=rec==='9';
    let obj=db.recebimentosContasMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,contaReceberId:cr?cr.id:null,contaPagarId:cp?cp.id:null,codParcela:cod(pick(r,['COD_PARCELA'])),codContasPagar:cod(pick(r,['COD_CONTAS_PAGAR','COD_PAGAR'])),tipo,codRecebimento:rec,formaRecebimento:formaRecebimento(rec),valor,data,cadastro:pick(r,['DATA_CADASTRO'])||hoje(),hora:pick(r,['HORA'])||new Date().toTimeString().slice(0,8),funcionarioCodigoAntigo:cod(pick(r,['REC_COD_FUNCIONARIO','COD_FUNCIONARIO'])),contaCodigoAntigo:cod(pick(r,['REC_COD_CONTA','COD_CONTA'])),caixaCodigoAntigo:cod(pick(r,['COD_CAIXA'])),baixaAutomatica:!pix,somenteHistorico:true};
    if(obj) Object.assign(obj,dados); else db.recebimentosContasMigrados.push({id:uidSafe('rcr'),...dados});
    if(cr){
      cr.codRecebimento=rec; cr.formaPagamento=formaRecebimento(rec)||cr.formaPagamento; cr.codCaixa=dados.caixaCodigoAntigo||cr.codCaixa; cr.contaCodigoAntigo=dados.contaCodigoAntigo||cr.contaCodigoAntigo; cr.estornar=false;
      const canceladaPorVenda=cr.status==='cancelado' && cr.vendaExcluidaId;
      if(canceladaPorVenda){
        cr.baixaAutomatica=false;
        cr.recebimentoIgnoradoPorVendaExcluida=true;
      } else {
        const cli=cr.clienteId&&(db.clientes||[]).find(c=>c.id===cr.clienteId); if(cli) cli.bloqueado=false;
        if(pix){ cr.pixComprovanteObrigatorio=true; cr.baixaAutomatica=false; }
        else if(tipo==='T'){ cr.status='pago'; cr.pagamentoData=data; cr.valorPago=valor; }
        else if(tipo==='P'){ cr.valorPago=round2(num(cr.valorPago,0)+valor); cr.valorSaldo=round2(Math.max(0,num(cr.valorParcela||cr.valor,0)-cr.valorPago)); cr.status=cr.valorSaldo<=0?'pago':'parcial'; if(cr.status==='pago') cr.pagamentoData=data; }
        if(!pix && dados.contaCodigoAntigo) addMovimentoRecebimento('CR-'+codigo,{empresaId:empId,tipo:'E',contaReceberId:cr.id,recebimentoId:obj&&obj.id,contaCodigoAntigo:dados.contaCodigoAntigo,caixaCodigoAntigo:dados.caixaCodigoAntigo,data,entrada:valor,saida:0,descricao:cr.clienteNomeAntigo||cr.descricao||'Recebimento'});
      }
    }
    if(cp){
      cp.codRecebimento=rec; cp.codCaixa=dados.caixaCodigoAntigo||cp.codCaixa; cp.estornar=false;
      if(tipo==='T'){ cp.status='pago'; cp.pagamentoData=data; cp.valorPago=valor; }
      else if(tipo==='P'){
        const key='CPP-'+codigo; if(!db.contasPagarParciaisMigradas.find(x=>x.key===key)) db.contasPagarParciaisMigradas.push({id:uidSafe('cpp'),key,empresaId:empId,contaPagarId:cp.id,valor,data});
        cp.valorPago=round2(num(cp.valorPago,0)+valor); cp.valorSaldo=round2(Math.max(0,num(cp.valorParcela||cp.valor,0)-cp.valorPago)); cp.status=cp.valorSaldo<=0?'pago':'parcial';
      }
      if(dados.contaCodigoAntigo) addMovimentoRecebimento('CP-'+codigo,{empresaId:empId,tipo:'S',contaPagarId:cp.id,contaCodigoAntigo:dados.contaCodigoAntigo,caixaCodigoAntigo:dados.caixaCodigoAntigo,data,entrada:0,saida:valor,descricao:cp.descricao||'Pagamento'});
    }
    alterou++;
  });
  return alterou;
}

function sincronizarAuxiliaresParte10(empId){
  let alterou=0;
  const simples=[
    {tabela:'RAMO_ITENS',prop:'ramoItensMigrados',cod:['RAI_CODIGO','CODIGO'],data:['RAI_DATA','DATA'],extra:r=>({descricao:txt(pick(r,['RAI_DESCRICAO','DESCRICAO','NOME'])),ramoCodigoAntigo:cod(pick(r,['RAI_COD_RAMO','COD_RAMO']))})},
    {tabela:'FABRICANTE',prop:'fabricantesMigrados',cod:['COD_FABRICANTE','FAB_CODIGO','CODIGO'],data:['DATA'],extra:r=>({nome:txt(pick(r,['DESCRICAO','NOME','FAB_DESCRICAO','FABRICANTE']))})},
    {tabela:'VALOR_CLIENTE',prop:'valoresClienteMigrados',cod:['COD_VALOR_CLIENTE','CODIGO'],data:['DATA'],extra:r=>({clienteCodigoAntigo:cod(pick(r,['COD_CLIENTE','VC_COD_CLIENTE'])),produtoCodigoAntigo:cod(pick(r,['COD_PRODUTO','VC_COD_PRODUTO'])),valor:num(pick(r,['VALOR','VC_VALOR']),0)})}
  ];
  simples.forEach(def=>{ const raw=rows(def.tabela); if(!raw.length) return; db[def.prop]=db[def.prop]||[]; raw.forEach(r=>{ const codigo=cod(pick(r,def.cod)); if(!codigo) return; let obj=db[def.prop].find(x=>x.empresaId===empId&&x.codigoAntigo===codigo); const dados={empresaId:empId,codigoAntigo:codigo,data:pick(r,def.data)||agora(),...(def.extra?def.extra(r):{})}; if(obj) Object.assign(obj,dados); else db[def.prop].push({id:uidSafe('aux'),...dados}); alterou++; }); });
  const motivos=rows('MOTIVO_DEFEITO');
  if(motivos.length){
    db.motivosDefeitoMigrados=db.motivosDefeitoMigrados||[];
    motivos.forEach(r=>{ const codigo=cod(pick(r,['COD_MOTIVO_DEFEITO','CODIGO'])); if(!codigo) return; let m=db.motivosDefeitoMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo); const dados={empresaId:empId,codigoAntigo:codigo,descricao:limparMotivo(pick(r,['DESCRICAO','MD_DESCRICAO'])),tipo:inteiro(pick(r,['MD_TIPO']),0),del:inteiro(pick(r,['MD_DEL']),0)}; if(m) Object.assign(m,dados); else db.motivosDefeitoMigrados.push({id:uidSafe('mdf'),...dados}); alterou++; });
  }
  return alterou;
}

function aplicarAutomacoesComprasRecebimentosContadores(empId){
  if(!db||!empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=assinaturaTabela(['VENDAS','ITENS_VENDA','COMPRA','ITENS_COMPRA','CONTADOR_PAGINAS','DEPARTAMENTOS','PRODUTOS_CARRINHO','SHOP_TOKEN','SHOP_ACESSOS','ITENS_RECEBIMENTO','RECEBIMENTO_CONTAS_RECEBER','RAMO_ITENS','FABRICANTE','MOTIVO_DEFEITO','VALOR_CLIENTE','CONFIGURACAO']);
  if(db.config.automacoes.comprasRecebimentosContadoresAssinatura===sig) return 0;
  let total=0;
  total+=sincronizarVendasParte10(empId);
  total+=sincronizarComprasParte10(empId);
  total+=sincronizarContadorPaginasParte10(empId);
  total+=sincronizarCarrinhoLoja(empId);
  total+=sincronizarItensRecebimento(empId);
  total+=sincronizarRecebimentosContas(empId);
  total+=sincronizarAuxiliaresParte10(empId);
  db.config.automacoes.comprasRecebimentosContadoresAssinatura=sig;
  if(total) salvar();
  return total;
}

window.AUTOMACOES_COMPRAS_RECEBIMENTOS_CONTADORES_PURE={ limparMotivo, calcularRateioCompra, custoItemCompra, aplicarDefaultsVendaRaw, limparVinculosVendaExcluida, sincronizarVendasParte10, sincronizarComprasParte10, sincronizarContadorPaginasParte10, sincronizarCarrinhoLoja, sincronizarItensRecebimento, sincronizarRecebimentosContas, sincronizarAuxiliaresParte10, aplicarAutomacoesComprasRecebimentosContadores };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s=sess(); if(s) aplicarAutomacoesComprasRecebimentosContadores(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_compras_recebimentos_contadores', run, 1200); else setTimeout(run, 1200); return ret; };
const oldRenderVendas=window.renderVendas;
window.renderVendas=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_compras_recebimentos_contadores', run, 0); else run(); return oldRenderVendas?oldRenderVendas.apply(this,arguments):undefined; };
const oldRenderCompras=window.renderCompras;
window.renderCompras=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_compras_recebimentos_contadores', run, 0); else run(); return oldRenderCompras?oldRenderCompras.apply(this,arguments):undefined; };
const oldRenderFinanceiro=window.renderFinanceiro;
window.renderFinanceiro=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_compras_recebimentos_contadores', run, 0); else run(); return oldRenderFinanceiro?oldRenderFinanceiro.apply(this,arguments):undefined; };
const oldRenderContratos=window.renderContratos;
window.renderContratos=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_compras_recebimentos_contadores', run, 0); else run(); return oldRenderContratos?oldRenderContratos.apply(this,arguments):undefined; };
if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_compras_recebimentos_contadores', run, 2500); else setTimeout(run, 2500);
console.log('[DIGICOPY] automacoes_compras_recebimentos_contadores_patch.js v4.9.30 carregado');
})();
