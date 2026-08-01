// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.26 — Automações de vendas, compras e cadastros auxiliares
// • Continuação da adaptação das triggers úteis do banco anterior
// • Cidades/ruas/situações são normalizadas em estruturas consultáveis
// • Compras atualizam dados auxiliares do produto sem recalcular estoque histórico em dobro
// • Itens de venda recalculam totais, custos, favoritos, insumos e despesas de locação
// • Agenda migrada vira estrutura leve e cria cliente pelo contato quando necessário
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
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
function titlePessoa(v){ const s=txt(v); if(!s) return ''; if(window.VOTM_PURE&&typeof window.VOTM_PURE.toTitleCase==='function') return window.VOTM_PURE.toTitleCase(s); return s.toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g,m=>m.toLowerCase()); }
function assinaturaTabela(nomes){ return nomes.map(nome=>{ const r=rows(nome); const last=r[r.length-1]||{}; return `${nome}:${r.length}:${JSON.stringify(last).slice(0,80)}`; }).join('|'); }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p=>p.empresaId===empId&&(cod(p.sku)===c||cod(p.codigo)===c||cod(p.codigoAntigo)===c||cod(p.idLegado)===c))||null; }
function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId&&(cod(x.codigo)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function vendaPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.vendas||[]).find(v=>v.empresaId===empId&&(cod(v.numero)===c||cod(v.codigoAntigo)===c||cod(v.idLegado)===c))||null; }
function parquePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.parque||[]).find(p=>p.empresaId===empId&&cod(p.codigoAntigo)===c)||null; }

const UF_IBGE = { RO:11, AC:12, AM:13, RR:14, PA:15, AP:16, TO:17, MA:21, PI:22, CE:23, RN:24, PB:25, PE:26, AL:27, SE:28, BA:29, MG:31, ES:32, RJ:33, SP:35, PR:41, SC:42, RS:43, MS:50, MT:51, GO:52, DF:53, EX:0 };
function ufIbge(uf){ return UF_IBGE[up(uf)] ?? null; }
function normalizarCidade(nome, uf){ return { nome: up(semAcento(nome || '')), uf: up(uf), codUfIbge: ufIbge(uf) } }

function sincronizarCadastrosAuxiliares(empId){
  let alterou=0;
  db.cidadesMigradas=db.cidadesMigradas||[];
  rows('CIDADES').forEach(r=>{
    const codigo=cod(r.COD_CIDADE); if(!codigo) return;
    let c=db.cidadesMigradas.find(x=>x.codigoAntigo===codigo);
    const nrm=normalizarCidade(r.NOME_CIDADE, r.UF);
    const dados={codigoAntigo:codigo,nome:nrm.nome,uf:nrm.uf,codMunIbge:r.COD_MUN_IBGE||null,codUfIbge:nrm.codUfIbge,ordem:inteiro(r.ORDEM,0)};
    if(c) Object.assign(c,dados); else db.cidadesMigradas.push({id:uidSafe('cid'),...dados});
    alterou++;
  });
  db.ruasMigradas=db.ruasMigradas||[];
  rows('RUAS').forEach(r=>{
    const codigo=cod(r.COD_RUA); if(!codigo) return;
    let rua=db.ruasMigradas.find(x=>x.codigoAntigo===codigo);
    const dados={codigoAntigo:codigo,descricao:up(semAcento(r.DESCRICAO||'')),referencia:txt(r.REFERENCIA),ordem:inteiro(r.ORDEM,0)};
    if(rua) Object.assign(rua,dados); else db.ruasMigradas.push({id:uidSafe('rua'),...dados});
    alterou++;
  });
  db.situacoesMigradas=db.situacoesMigradas||[];
  rows('SITUACAO').forEach(r=>{
    const codigo=cod(r.COD_SITUACAO); if(!codigo) return;
    let sit=db.situacoesMigradas.find(x=>x.codigoAntigo===codigo);
    const dados={codigoAntigo:codigo,descricao:up(r.DESCRICAO||''),cor:r.SIT_COR||''};
    if(sit) Object.assign(sit,dados); else db.situacoesMigradas.push({id:uidSafe('sit'),...dados});
    alterou++;
  });
  const cfg=rows('CONFIGURACAO')[0]||{};
  const limite=num(cfg.CLI_LIMITE_CREDITO,0);
  if(limite>0){
    (db.clientes||[]).filter(c=>c.empresaId===empId).forEach(c=>{ if(c.limiteCredito==null){ c.limiteCredito=limite; alterou++; } });
  }
  return alterou;
}

function calcularItemCompra(row){
  const qtde=num(row.QTDE,0);
  const unit=num(row.VALOR_UNITARIO,0);
  const desconto=num(row.VALOR_DESCONTO,0);
  const icmsSt=num(row.VALOR_ICMS_ST,0);
  const ipi=num(row.VALOR_IPI,0);
  const frete=num(row.VALOR_FRETE,0);
  const acres=num(row.VALOR_ACRESCIMOS,0);
  const total=round2(unit*qtde);
  const custoUnit=qtde>0?round2(unit-(desconto/qtde)+(icmsSt/qtde)+(ipi/qtde)+(frete/qtde)+(acres/qtde)):unit;
  return {qtde,unit,total,custoUnit};
}
function sincronizarItensCompra(empId){
  const itens=rows('ITENS_COMPRA'); if(!itens.length) return 0;
  db.itensCompraMigrados=db.itensCompraMigrados||[];
  db.produtosHistoricoCompra=db.produtosHistoricoCompra||[];
  let alterou=0;
  itens.forEach(r=>{
    const codigo=cod(r.COD_ITENS_COMPRA); if(!codigo) return;
    const calc=calcularItemCompra(r);
    const prod=produtoPorCodigo(r.COD_PRODUTO, empId);
    let item=db.itensCompraMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,compraCodigoAntigo:cod(r.COD_COMPRA),produtoId:prod?prod.id:null,produtoCodigoAntigo:cod(r.COD_PRODUTO),descricao:up(r.DESCRICAO||''),qtde:calc.qtde,valorUnitario:calc.unit,valorTotal:calc.total,custoUnitario:calc.custoUnit,ncm:txt(r.NCM),codigoBarra:txt(r.CODIGO_BARRA),unidade:txt(r.UND_MEDIDA)||'UN'};
    if(item) Object.assign(item,dados); else db.itensCompraMigrados.push({id:uidSafe('icp'),...dados});
    if(prod){
      if(dados.ncm && !prod.ncm) prod.ncm=dados.ncm;
      if(dados.codigoBarra && dados.codigoBarra!=='SEM GTIN' && !prod.codigoBarra) prod.codigoBarra=dados.codigoBarra;
      prod.ultimoCustoCompra=calc.custoUnit;
      prod.dataUltCompra=hoje();
      if(prod.custo==null || prod.custo===0) prod.custo=calc.custoUnit;
    }
    const histKey='COMPRA-'+codigo;
    if(prod && !db.produtosHistoricoCompra.find(h=>h.key===histKey)) db.produtosHistoricoCompra.push({id:uidSafe('phc'),key:histKey,produtoId:prod.id,tipo:'E',qtde:calc.qtde,descricao:'INSERIDO NA COMPRA: '+cod(r.COD_COMPRA),valorCusto:calc.custoUnit,valorVenda:prod.preco||0,itemCompraCodigoAntigo:codigo});
    alterou++;
  });
  db.comprasMigradas=db.comprasMigradas||[];
  rows('COMPRA').forEach(c=>{
    const codigo=cod(c.COD_COMPRA); if(!codigo) return;
    const total=db.itensCompraMigrados.filter(i=>i.empresaId===empId&&i.compraCodigoAntigo===codigo).reduce((s,i)=>s+num(i.valorTotal,0),0);
    let compra=db.comprasMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,data:c.DATA||'',fornecedorCodigoAntigo:cod(c.COD_FORNECEDOR),valorTotal:round2(total||num(c.VALOR_TOTAL,0))};
    if(compra) Object.assign(compra,dados); else db.comprasMigradas.push({id:uidSafe('cmp'),...dados});
  });
  return alterou;
}

function cartuchoInfo(codCart){ const c=cod(codCart); if(!c) return null; const mig=(db.cartuchosMigrados||[]).find(x=>cod(x.codigoAntigo)===c); if(mig) return mig; const raw=rows('CARTUCHOS').find(x=>cod(x.COD_CARTUCHO)===c); if(!raw) return null; return {codigoAntigo:c,tipo:raw.TIPO||'',fabricante:'',numero:raw.NUMERO||'',cor:raw.COR||'',valorRecarga:raw.VALOR_RECARGA||0}; }
function produtoCartuchoVazio(codCart, empId){ const c=cod(codCart); return (db.produtos||[]).find(p=>p.empresaId===empId&&cod(p.cartuchoCodigoAntigo)===c&&/VAZIO/i.test(p.categoria||p.nome||''))||null; }
function calcularItemVenda(row, empId){
  const qtde=num(row.QTDE,1)||1;
  const desconto=num(row.VALOR_DESCONTO,0);
  let unit=num(row.VALOR_UNITARIO, NaN);
  const prod=produtoPorCodigo(row.COD_PRODUTO, empId);
  const cart=cartuchoInfo(row.COD_CARTUCHO);
  if(!Number.isFinite(unit)) unit=prod?num(prod.preco,0):0;
  let descricao=txt(row.DESCRICAO);
  let tipo=txt(row.TIPO_DESCRICAO);
  let situacao=txt(row.SITUACAO)||'PRODUTO';
  if(cart){
    descricao=descricao||['Recarga de',cart.tipo,cart.fabricante,cart.numero,cart.cor].filter(Boolean).join(' ');
    tipo='SERVICO';
    if(!unit) unit=num(cart.valorRecarga,0);
    situacao=situacao==='PRODUTO'?'RECICLANDO':situacao;
  }else if(prod){
    descricao=descricao||prod.nome;
    tipo=/SERV/i.test(prod.categoria||prod.tipo||'')?'SERVICO':'PRODUTO';
    situacao=tipo==='SERVICO'?'SERVICO':'PRODUTO';
  }
  const subtotal=round2((unit*qtde)-desconto);
  const percDesconto=unit>0&&qtde>0?round2(desconto*100/(unit*qtde)):0;
  const custo=prod?round2(num(prod.custo,0)*qtde):num(row.VALOR_CUSTO,0);
  return { produto:prod, cartucho:cart, qtd:qtde, preco:unit, desconto, subtotal, percDesconto, descricao:descricao||'Item', tipo, situacao, custo };
}
function sincronizarItensVenda(empId){
  const itens=rows('ITENS_VENDA'); if(!itens.length) return 0;
  db.produtosFavoritos=db.produtosFavoritos||[];
  db.produtosHistoricoVenda=db.produtosHistoricoVenda||[];
  let alterou=0;
  itens.forEach(r=>{
    const codigo=cod(r.COD_ITENS_VENDA); if(!codigo) return;
    const venda=vendaPorCodigo(r.COD_VENDA, empId);
    const calc=calcularItemVenda(r, empId);
    if(venda){
      if(!Array.isArray(venda.itens)) venda.itens=[];
      let it=venda.itens.find(x=>cod(x.codigoAntigo)===codigo);
      const payload={codigoAntigo:codigo,produtoId:calc.produto?calc.produto.id:null,descricao:calc.descricao,qtd:calc.qtd,preco:calc.preco,desconto:calc.desconto,subtotal:calc.subtotal,percDesconto:calc.percDesconto,tipo:calc.tipo,situacao:calc.situacao,valorCusto:calc.custo,cartuchoCodigoAntigo:cod(r.COD_CARTUCHO),etiqueta:txt(r.ETIQUETA),valorInsumos:num(r.VALOR_INSUMOS,0),parqueCodigoAntigo:cod(r.IV_COD_ITENS_LOCACAO),contratoCodigoAntigo:cod(r.IV_COD_LOCACAO)};
      if(it) Object.assign(it,payload); else venda.itens.push(payload);
      const totalItens=venda.itens.reduce((s,x)=>s+num(x.subtotal,0),0);
      venda.totalItensCalculado=round2(totalItens);
      if(!venda.total || num(venda.total,0)===0) venda.total=round2(totalItens);
      if(calc.cartucho) venda.tipo='R';
      if(calc.produto && venda.clienteId){
        const key=calc.produto.id+'-'+venda.clienteId;
        if(!db.produtosFavoritos.find(f=>f.key===key)) db.produtosFavoritos.push({id:uidSafe('fav'),key,produtoId:calc.produto.id,clienteId:venda.clienteId,criadoEm:agora()});
      }
    }
    if(calc.produto && calc.tipo!=='SERVICO'){
      const histKey='VENDA-'+codigo;
      if(!db.produtosHistoricoVenda.find(h=>h.key===histKey)) db.produtosHistoricoVenda.push({id:uidSafe('phv'),key:histKey,produtoId:calc.produto.id,tipo:'S',qtde:calc.qtd,descricao:'INSERIDO NA VENDA: '+cod(r.COD_VENDA),valorVenda:calc.preco,itemVendaCodigoAntigo:codigo});
      calc.produto.dataUltVenda=hoje();
    }
    if(cod(r.IV_COD_ITENS_LOCACAO)||cod(r.IV_COD_LOCACAO)){
      db.despesasLocacao=db.despesasLocacao||[];
      let d=db.despesasLocacao.find(x=>x.itemVendaCodigoAntigo===codigo&&x.empresaId===empId);
      const parque=parquePorCodigo(r.IV_COD_ITENS_LOCACAO, empId);
      const dados={empresaId:empId,itemVendaCodigoAntigo:codigo,parqueId:parque?parque.id:null,contratoId:parque?parque.contratoId:null,descricao:calc.descricao+' - '+txt(r.ETIQUETA),qtde:calc.qtd,valorTotalCusto:calc.custo,data:hoje(),situacao:'Despesa lançada com sucesso'};
      if(d) Object.assign(d,dados); else db.despesasLocacao.push({id:uidSafe('dpl'),criadoEm:agora(),...dados});
    }
    if(calc.cartucho){
      const insumos=rows('ITENS_INSUMOS').filter(x=>cod(x.COD_CARTUCHO)===cod(r.COD_CARTUCHO)&&txt(x.CONTROLE_ESTOQUE)==='S');
      db.insumosGastosMigrados=db.insumosGastosMigrados||[];
      insumos.forEach(ins=>{
        const key='AUTO-'+codigo+'-'+cod(ins.COD_ITENS_INSUMOS);
        if(db.insumosGastosMigrados.find(x=>x.key===key)) return;
        const prod=produtoPorCodigo(ins.COD_PRODUTO, empId);
        const qtde=num(ins.QTDE,0)*calc.qtd;
        const unit=prod?num(prod.preco,0):num(ins.VALOR_UNITARIO,0);
        db.insumosGastosMigrados.push({id:uidSafe('ig'),key,empresaId:empId,itemRecargaCodigoAntigo:codigo,produtoId:prod?prod.id:null,produtoCodigoAntigo:cod(ins.COD_PRODUTO),qtde,valorUnitario:unit,valorTotal:round2(qtde*unit),somarInsumo:ins.SOMAR_INSUMO||'S',mostrarInsumo:'N',origem:'auto_cartucho'});
      });
      const vazio=produtoCartuchoVazio(r.COD_CARTUCHO, empId);
      if(vazio && txt(r.DEBITAR_VAZIO)==='S'){
        const key='VAZIO-'+codigo;
        if(!db.produtosHistoricoVenda.find(h=>h.key===key)) db.produtosHistoricoVenda.push({id:uidSafe('phv'),key,produtoId:vazio.id,tipo:'S',qtde:calc.qtd,descricao:'SAIDA DE VAZIO NO ESTOQUE',valorVenda:calc.preco,itemVendaCodigoAntigo:codigo});
      }
    }
    alterou++;
  });
  return alterou;
}

function clientePorContatoAgenda(row, empId){
  const codCli=cod(row.AGE_COD_CLIENTE); if(codCli){ const c=clientePorCodigo(codCli, empId); if(c) return c; }
  const contato=titlePessoa(row.AGE_CONTATO||'');
  if(!contato) return null;
  let c=(db.clientes||[]).find(cli=>cli.empresaId===empId&&up(cli.nome)===up(contato));
  if(c) return c;
  c={id:uidSafe('cli'),empresaId:empId,codigo:String((db.clientes||[]).filter(x=>x.empresaId===empId).length+1),nome:contato,fantasia:contato,telefone:row.AGE_TELEFONE||'',email:row.AGE_EMAIL||'',tipo:'PJ',status:'ativo',criadoPor:'agenda',criadoPorNome:'Agenda',criadoEm:agora()};
  db.clientes.push(c);
  return c;
}
function sincronizarAgenda(empId){
  const rowsAgenda=rows('AGENDA_PERSONALIZADA'); if(!rowsAgenda.length) return 0;
  db.agendaMigrada=db.agendaMigrada||[];
  let alterou=0;
  rowsAgenda.forEach(r=>{
    const codigo=cod(r.AGE_CODIGO); if(!codigo) return;
    const cli=clientePorContatoAgenda(r, empId);
    let a=db.agendaMigrada.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const start=r.AGE_START||r.AGE_DATA||agora();
    const finish=r.AGE_FINISH||'';
    const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cli?cli.id:null,contato:r.AGE_CONTATO||'',telefone:r.AGE_TELEFONE||'',email:r.AGE_EMAIL||'',status:r.AGE_STATUS||0,eventType:r.AGE_EVENTTYPE||0,reagendado:r.AGE_REAGENDADO||0,inicio:start,fim:finish||start,concluida:Number(r.AGE_TASKCOMPLETEFIELD)===1,estornar:Number(r.AGE_ESTORNAR)===1,codVenda:cod(r.AGE_COD_VENDA),deveGerarVenda:Number(r.AGE_TASKCOMPLETEFIELD)===1&&!r.AGE_COD_VENDA};
    if(a) Object.assign(a,dados); else db.agendaMigrada.push({id:uidSafe('age'),...dados});
    const venda=vendaPorCodigo(r.AGE_COD_VENDA, empId);
    if(dados.estornar&&venda){ venda.status='estornada'; venda.estornada=true; }
    alterou++;
  });
  return alterou;
}

function aplicarAutomacoesVendasComprasCadastros(empId){
  if(!db||!empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=assinaturaTabela(['CIDADES','RUAS','SITUACAO','ITENS_COMPRA','COMPRA','ITENS_VENDA','AGENDA_PERSONALIZADA','CONFIGURACAO','ITENS_INSUMOS']);
  if(db.config.automacoes.vendasComprasCadastrosAssinatura===sig) return 0;
  let total=0;
  total+=sincronizarCadastrosAuxiliares(empId);
  total+=sincronizarItensCompra(empId);
  total+=sincronizarItensVenda(empId);
  total+=sincronizarAgenda(empId);
  db.config.automacoes.vendasComprasCadastrosAssinatura=sig;
  if(total) salvar();
  return total;
}

window.AUTOMACOES_VENDAS_COMPRAS_CADASTROS_PURE={ ufIbge, normalizarCidade, calcularItemCompra, calcularItemVenda, sincronizarCadastrosAuxiliares, sincronizarItensCompra, sincronizarItensVenda, sincronizarAgenda, aplicarAutomacoesVendasComprasCadastros };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s=sess(); if(s) aplicarAutomacoesVendasComprasCadastros(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_vendas_compras_cadastros', run, 700); else setTimeout(run, 700); return ret; };
const oldRenderVendas=window.renderVendas;
window.renderVendas=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_vendas_compras_cadastros', run, 0); else run(); return oldRenderVendas?oldRenderVendas.apply(this,arguments):undefined; };
const oldRenderProdutos=window.renderProdutos;
window.renderProdutos=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_vendas_compras_cadastros', run, 0); else run(); return oldRenderProdutos?oldRenderProdutos.apply(this,arguments):undefined; };
if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_vendas_compras_cadastros', run, 1500); else setTimeout(run, 1500);
console.log('[DIGICOPY] automacoes_vendas_compras_cadastros_patch.js v4.9.26 carregado');
})();
