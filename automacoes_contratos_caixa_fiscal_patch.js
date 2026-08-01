// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.24 — Automações de contratos, caixa, fiscal leve e produtos
// • Continuação da adaptação das triggers úteis do banco anterior
// • Contrato recalcula valor mensal e status de equipamentos
// • Caixa recebe defaults e resumo sem mexer em dados originais
// • Nota fiscal marca venda/leitura/financeiro e atualiza NCM/CEST do produto
// • Equipamentos criam/atualizam produto auxiliar de equipamento sem duplicar
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function num(v, fb=0){ const out=Number(String(v ?? '').replace(',', '.')); return Number.isFinite(out)?out:fb; }
function int(v, fb=0){ const out=parseInt(String(v ?? ''),10); return Number.isFinite(out)?out:fb; }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }
function hoje(){ return new Date().toISOString().slice(0,10); }
function agora(){ return new Date().toISOString(); }
function round2(v){ return Math.round(num(v,0)*100)/100; }
function titleProduto(v){ return txt(v).toUpperCase(); }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p=>p.empresaId===empId&&(cod(p.sku)===c||cod(p.codigo)===c||cod(p.codigoAntigo)===c||cod(p.idLegado)===c))||null; }
function produtoPorEquipamento(eq){ if(!eq) return null; return (db.produtos||[]).find(p=>p.empresaId===eq.empresaId && (p.equipamentoId===eq.id || p.equipamentoOrigemId===eq.id || txt(p.sku)===`EQ-${txt(eq.patrimonio||eq.serie||eq.id)}`)); }
function vendaPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.vendas||[]).find(v=>v.empresaId===empId&&(cod(v.numero)===c||cod(v.codigoAntigo)===c||cod(v.idLegado)===c))||null; }
function leituraPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.leituras||[]).find(l=>l.empresaId===empId&&(cod(l.codigoAntigo)===c||cod(l.numero)===c||cod(l.idLegado)===c||cod(l.id)===c))||null; }
function contratoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.contratos||[]).find(ct=>ct.empresaId===empId&&(cod(ct.numero)===c||cod(ct.codigoAntigo)===c||cod(ct.codigo)===c||cod(ct.idLegado)===c))||null; }
function parqueContrato(contrato){ return (db.parque||[]).filter(p=>p.empresaId===contrato.empresaId && (p.contratoId===contrato.id || (contrato.clienteId && p.clienteId===contrato.clienteId))); }

function valorMedidor(m){
  if(!m || m.ativo===false) return 0;
  const modo = txt(m.modalidade || '').toLowerCase();
  if(modo === 'inativo') return 0;
  if(modo === 'mes_fixo') return num(m.valorFixo ?? m.valorLocacao ?? m.valor, 0);
  return num(m.valorFixo ?? m.valorLocacao, 0);
}
function calcularValorContrato(contrato, parques){
  let total = num(contrato.valorPretoGlobal ?? contrato.VALOR_PRETO_GLOBAL, 0) +
              num(contrato.valorColorGlobal ?? contrato.VALOR_COLOR_GLOBAL, 0) +
              num(contrato.valorPretoGlobalA3 ?? contrato.VALOR_PRETO_GLOBAL_A3, 0) +
              num(contrato.valorColorGlobalA3 ?? contrato.VALOR_COLOR_GLOBAL_A3, 0) +
              num(contrato.valorScannerGlobal ?? contrato.VALOR_SCANNER_GLOBAL, 0);
  (parques||[]).forEach(p=>{
    const meds = p.medidores || {};
    Object.values(meds).forEach(m=>{ total += valorMedidor(m); });
    if(!Object.keys(meds).length) total += num(p.valorLocacao || p.valorFranquia || 0, 0);
  });
  return round2(total);
}
function normalizarContrato(contrato){
  if(contrato.cobrarExcedentesDias == null) contrato.cobrarExcedentesDias = 0;
  if(contrato.qtdeVisitas == null) contrato.qtdeVisitas = 0;
  if(!contrato.situacaoVisitas) contrato.situacaoVisitas = 'C';
  if(contrato.locTipo == null) contrato.locTipo = 0;
  if(contrato.custoMedioVisitas == null) contrato.custoMedioVisitas = 0;
  return contrato;
}
function aplicarStatusContratoEquipamentos(contrato, ocultar){
  let alterou = 0;
  const inativo = ocultar === true || contrato.ocultar === 'S' || contrato.status === 'excluido' || contrato.status === 'encerrado' || contrato.status === 'inativo';
  parqueContrato(contrato).forEach(p=>{
    const eq = (db.equipamentos||[]).find(e=>e.id===p.equipamentoId);
    if(inativo){
      if(p.status !== 'inativo'){ p.status = 'inativo'; alterou++; }
      if(eq && eq.status !== 'disponivel'){ eq.status = 'disponivel'; alterou++; }
    } else if(p.status === 'inativo' && contrato.status === 'ativo'){
      p.status = 'ativo';
      if(eq) eq.status = 'locado';
      alterou++;
    }
  });
  return alterou;
}
function aplicarAutomacoesContratos(empId){
  let alterou=0;
  (db.contratos||[]).filter(c=>c.empresaId===empId).forEach(c=>{
    const antes=JSON.stringify({cobrarExcedentesDias:c.cobrarExcedentesDias,qtdeVisitas:c.qtdeVisitas,situacaoVisitas:c.situacaoVisitas,valorCalculadoMensal:c.valorCalculadoMensal,valorMensalFixo:c.valorMensalFixo});
    normalizarContrato(c);
    const valor=calcularValorContrato(c, parqueContrato(c));
    c.valorCalculadoMensal = valor;
    if((!c.valorMensalFixo || num(c.valorMensalFixo,0)===0) && valor>0) c.valorMensalFixo = valor;
    alterou += aplicarStatusContratoEquipamentos(c);
    if(antes!==JSON.stringify({cobrarExcedentesDias:c.cobrarExcedentesDias,qtdeVisitas:c.qtdeVisitas,situacaoVisitas:c.situacaoVisitas,valorCalculadoMensal:c.valorCalculadoMensal,valorMensalFixo:c.valorMensalFixo})) alterou++;
  });
  return alterou;
}

function defaultsCaixa(caixa){
  const c=Object.assign({}, caixa||{});
  if(!c.data) c.data=hoje();
  if(!c.horaAbertura) c.horaAbertura=new Date().toTimeString().slice(0,8);
  if(!c.situacao) c.situacao='A';
  ['valorInicial','valorFinal','saldoLiquido','saldoTotal','valorCheque','valorCartaoDebito','valorCartaoDebitoSaida','valorCartaoCredito','valorDinheiro','valorBoleto','valorPrazo','valorConta','valorContaSaida','valorChequeSaida','valorCartaoCreditoSaida','valorPrazoSaida','valorBoletoSaida','totalSaida','valorPagamento','valorRetirada','valorEntrada','valorOutros','sugestaoProxCaixa'].forEach(k=>{ if(c[k]==null) c[k]=0; });
  return c;
}
function sincronizarCaixaMigrado(empId){
  const raw=rows('CAIXA');
  if(!raw.length) return 0;
  db.caixasMigrados=db.caixasMigrados||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['COD_CAIXA'])); if(!codigo) return;
    let c=db.caixasMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados=defaultsCaixa({empresaId:empId,codigoAntigo:codigo,data:pick(r,['DATA']),horaAbertura:pick(r,['HORA_ABERTURA']),situacao:pick(r,['SITUACAO'])||'A',valorInicial:num(r.VALOR_INICIAL,0),valorFinal:num(r.VALOR_FINAL,0),saldoLiquido:num(r.SALDO_LIQUIDO,0),saldoTotal:num(r.SALDO_TOTAL,0),valorDinheiro:num(r.VALOR_DINHEIRO,0),valorCheque:num(r.VALOR_CHEQUE,0),valorCartaoCredito:num(r.VALOR_CARTAO_CREDITO,0),valorCartaoDebito:num(r.VALOR_CARTAO_DEBITO,0),valorBoleto:num(r.VALOR_BOLETO,0),valorPrazo:num(r.VALOR_PRAZO,0),valorConta:num(r.VALOR_CONTA,0),totalSaida:num(r.TOTAL_SAIDA,0)});
    if(c) Object.assign(c,dados); else db.caixasMigrados.push({id:uidSafe('cx'),...dados});
    alterou++;
  });
  return alterou;
}

function marcaNfeEmFinanceiro(venda, leitura, nota, situacao){
  let alterou=0;
  (db.contasReceber||[]).forEach(cr=>{
    const matchVenda = venda && cr.vendaId===venda.id;
    const matchLeitura = leitura && cr.leituraId===leitura.id;
    if(!matchVenda && !matchLeitura) return;
    if(/CANCELADA|DENEGADA/i.test(situacao||'')){
      if(cr.nfe){ cr.nfe=null; alterou++; }
      if(cr.notaFiscalId){ cr.notaFiscalId=null; alterou++; }
      cr.observacao = (cr.observacao||'') + ` NF-e cancelada: ${nota.numero||nota.codigoAntigo||''}`;
    } else {
      if(cr.nfe!=='S'){ cr.nfe='S'; alterou++; }
      if(!cr.notaFiscalId){ cr.notaFiscalId=nota.id||nota.codigoAntigo; alterou++; }
    }
  });
  if(venda){
    if(/CANCELADA|DENEGADA/i.test(situacao||'')){ venda.nfe=null; }
    else venda.nfe='S';
    if(nota.numero) venda.notaFiscalNumero=nota.numero;
    alterou++;
  }
  if(leitura){
    if(/CANCELADA|DENEGADA/i.test(situacao||'')){ leitura.notaFiscalId=null; }
    else leitura.notaFiscalId=nota.id||nota.codigoAntigo;
    alterou++;
  }
  return alterou;
}
function sincronizarNotasFiscais(empId){
  const notas=rows('NOTA_FISCAL');
  const itens=rows('ITENS_NOTA');
  if(!notas.length && !itens.length) return 0;
  db.notasFiscaisMigradas=db.notasFiscaisMigradas||[];
  db.faturasNfe=db.faturasNfe||[];
  let alterou=0;
  notas.forEach(r=>{
    const codigo=cod(pick(r,['NF_CODIGO'])); if(!codigo) return;
    let nota=db.notasFiscaisMigradas.find(nf=>nf.empresaId===empId&&nf.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,numero:pick(r,['NF_NUM_NOTA','NF_NUMERO','NF_NUM']),situacao:pick(r,['NF_SITUACAO']),valorTotal:num(pick(r,['NF_VALOR_TOTAL']),0),data:pick(r,['NF_DATA','NF_DATA_GERADA']),codVenda:cod(pick(r,['NF_COD_VENDA'])),codLeitura:cod(pick(r,['NF_COD_LEITURA'])),modelo:int(pick(r,['NF_MODELO']),55)};
    if(nota) Object.assign(nota,dados); else {nota={id:uidSafe('nf'),...dados}; db.notasFiscaisMigradas.push(nota);}
    const venda=vendaPorCodigo(dados.codVenda, empId);
    const leitura=leituraPorCodigo(dados.codLeitura, empId);
    alterou += marcaNfeEmFinanceiro(venda, leitura, nota, dados.situacao);
    if(dados.modelo===55){
      const titulos=(db.contasReceber||[]).filter(cr=>(venda&&cr.vendaId===venda.id||leitura&&cr.leituraId===leitura.id)&&cr.status!=='pago');
      titulos.forEach((cr,idx)=>{
        const key=(nota.id||nota.codigoAntigo)+'-'+cr.id;
        if(!db.faturasNfe.find(f=>f.key===key)) db.faturasNfe.push({id:uidSafe('fn'),key,notaFiscalId:nota.id,contaReceberId:cr.id,nDup:String(idx+1).padStart(3,'0'),valor:cr.valor||0,vencimento:cr.vencimento});
      });
    }
  });
  itens.forEach(it=>{
    const total=round2(num(it.IN_VALOR_UNITARIO,0)*num(it.IN_QTDE,0));
    if(Math.abs(num(it.IN_VALOR_TOTAL,0)-total)>0.009){ it.IN_VALOR_TOTAL=total; alterou++; }
    const prod=produtoPorCodigo(it.IN_COD_PRODUTO, empId);
    if(prod){
      if(it.IN_NCM && !prod.ncm){ prod.ncm=txt(it.IN_NCM); alterou++; }
      if(it.IN_CEST && !prod.cest){ prod.cest=txt(it.IN_CEST); alterou++; }
      if(it.IN_ENQ_IPI && !prod.enqIpi){ prod.enqIpi=txt(it.IN_ENQ_IPI); alterou++; }
    }
  });
  return alterou;
}

function fabricantePeloModelo(modelo){
  const m=up(modelo);
  const marcas=['HP','LEXMARK','CANON','SAMSUNG','EPSON','XEROX','POSITIVO','AGFA','APC','BROTHER','ITAUTEC','KODAK','KYOCERA','ECOSYS','TASKALFA','LG','MICROSOFT','OKI','OKIDATA','OLIVETTI','RICOH','SHARP','SONY','ZEBRA'];
  const found=marcas.find(x=>m.includes(x));
  if(found==='ECOSYS'||found==='TASKALFA') return 'KYOCERA';
  return found||'OUTROS';
}
function defaultsProduto(p){
  if(!p.nome && p.descricao) p.nome=p.descricao;
  if(!p.descricao && p.nome) p.descricao=p.nome;
  if(!p.nome) p.nome='SEM DESCRICAO';
  if(!p.categoria) p.categoria = p.tipo==='E'?'Impressoras':'Produto';
  if(p.estoque==null) p.estoque=0;
  if(p.estoqueMin==null) p.estoqueMin=0;
  if(p.estoqueIdeal==null) p.estoqueIdeal=0;
  if(!p.unidade) p.unidade='UN';
  p.unidade=txt(p.unidade).slice(0,2)||'UN';
  if(p.custo==null) p.custo=0;
  if(p.preco==null) p.preco=0;
  if(p.controleEstoque==null) p.controleEstoque=true;
  if(p.status==null) p.status='ativo';
  if(p.promocao==null) p.promocao='N';
  if(p.origem==null) p.origem=0;
  if(p.vidaUtil==null) p.vidaUtil=0;
  return p;
}
function produtoDoEquipamento(eq){
  let p=produtoPorEquipamento(eq);
  const sku=`EQ-${txt(eq.patrimonio||eq.serie||eq.id)}`;
  const dados={empresaId:eq.empresaId,equipamentoId:eq.id,equipamentoOrigemId:eq.id,sku,nome:titleProduto(eq.modelo||eq.descricao||'IMPRESSORA'),descricao:titleProduto(eq.modelo||eq.descricao||'IMPRESSORA'),categoria:'Impressoras',fabricante:fabricantePeloModelo(eq.modelo||eq.descricao),tipo:'Equipamento',estoque:eq.status==='disponivel'?1:0,estoqueMin:0,custo:num(eq.custo||eq.valorCusto||eq.EQ_VALOR_CUSTO,0),preco:num(eq.preco||eq.valorVenda||0,0),status:'ativo',controleEstoque:true};
  if(p) Object.assign(p, Object.assign({}, dados, {id:p.id, criadoEm:p.criadoEm, criadoPor:p.criadoPor, criadoPorNome:p.criadoPorNome}));
  else {p={id:uidSafe('prd'),criadoEm:agora(),criadoPor:'sistema',criadoPorNome:'Sistema',...dados}; db.produtos.push(p);}
  return p;
}
function aplicarAutomacoesProdutosEquipamentos(empId){
  let alterou=0;
  (db.produtos||[]).filter(p=>p.empresaId===empId).forEach(p=>{ const before=JSON.stringify(p); defaultsProduto(p); if(before!==JSON.stringify(p)) alterou++; });
  (db.equipamentos||[]).filter(e=>e.empresaId===empId).forEach(e=>{ produtoDoEquipamento(e); alterou++; });
  return alterou;
}

function aplicarDefaultsEmpresa(empId){
  db.config=db.config||{};
  db.config.defaultsOperacionais=db.config.defaultsOperacionais||{};
  const d=db.config.defaultsOperacionais;
  if(d.caixaAtualizarPainelSeg == null) d.caixaAtualizarPainelSeg = 600;
  if(d.agendaLembreteSeg == null) d.agendaLembreteSeg = 1800;
  if(d.shopValorMinVenda == null) d.shopValorMinVenda = 10;
  if(d.emailInfoCaixa == null){ const emp=(db.empresas||[]).find(e=>e.id===empId)||{}; d.emailInfoCaixa=emp.email||''; }
  return 1;
}
function aplicarAutomacoesContratosCaixaFiscal(empId){
  if(!db||!empId) return 0;
  let total=0;
  total += aplicarAutomacoesContratos(empId);
  total += sincronizarCaixaMigrado(empId);
  total += sincronizarNotasFiscais(empId);
  total += aplicarAutomacoesProdutosEquipamentos(empId);
  total += aplicarDefaultsEmpresa(empId);
  if(total) salvar();
  return total;
}

window.AUTOMACOES_CONTR_CAIXA_FISCAL_PURE={
  valorMedidor,
  calcularValorContrato,
  normalizarContrato,
  defaultsCaixa,
  marcaNfeEmFinanceiro,
  fabricantePeloModelo,
  defaultsProduto,
  aplicarAutomacoesContratos,
  sincronizarCaixaMigrado,
  sincronizarNotasFiscais,
  aplicarAutomacoesProdutosEquipamentos,
  aplicarAutomacoesContratosCaixaFiscal
};

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s=sess(); if(s) aplicarAutomacoesContratosCaixaFiscal(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; setTimeout(run,450); return ret; };
const oldRenderContratos=window.renderContratos;
window.renderContratos=function(){ run(); return oldRenderContratos?oldRenderContratos.apply(this,arguments):undefined; };
const oldRenderProdutos=window.renderProdutos;
window.renderProdutos=function(){ run(); return oldRenderProdutos?oldRenderProdutos.apply(this,arguments):undefined; };
const oldRenderFinanceiro=window.renderFinanceiro;
window.renderFinanceiro=function(){ run(); return oldRenderFinanceiro?oldRenderFinanceiro.apply(this,arguments):undefined; };
setTimeout(run,1200);
console.log('[DIGICOPY] automacoes_contratos_caixa_fiscal_patch.js v4.9.24 carregado');
})();
