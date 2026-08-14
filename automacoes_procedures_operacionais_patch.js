// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.34 — Adaptação das PROCEDURES operacionais do banco antigo
// • Recria regras úteis encontradas nas procedures sem copiar rotinas pesadas
// • Locação: valor/franquias, leituras detalhadas, contadores e situação do contrato
// • Fiscal leve: perfil tributário em itens de nota e totais de nota
// • Vendas: desconto, situação, chamados por entrega, cartuchos e totais
// • Produtos/estoque: ajuste por histórico, serial/variação e custo de insumos
// • Pix/boleto/cartão: validações históricas sem baixa automática indevida
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function up(v){ return semAcento(v).toUpperCase(); }
function lower(v){ return txt(v).toLowerCase(); }
function num(v, fb=0){ const out=Number(String(v ?? '').replace(',', '.')); return Number.isFinite(out)?out:fb; }
function inteiro(v, fb=0){ const out=parseInt(String(v ?? ''),10); return Number.isFinite(out)?out:fb; }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function agora(){ return new Date().toISOString(); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }
function assinaturaTabela(nomes){ return nomes.map(nome=>{ const r=rows(nome); const last=r[r.length-1]||{}; return `${nome}:${r.length}:${JSON.stringify(last).slice(0,90)}`; }).join('|'); }
function assinaturaArray(nome, empId){ const a=Array.isArray(db[nome])?db[nome].filter(x=>!empId||!x.empresaId||x.empresaId===empId):[]; const last=a[a.length-1]||{}; return `${nome}:${a.length}:${JSON.stringify(last).slice(0,90)}`; }
function round2(v){ return Math.round((num(v,0)+Number.EPSILON)*100)/100; }
function roundABNT(v, dec=2){
  const n=num(v,0); const p=Math.pow(10,dec); const x=n*p; const floor=Math.floor(x); const frac=x-floor;
  if(Math.abs(frac-0.5)<1e-9){ return ((floor%2===0?floor:floor+1)/p); }
  return Math.round(x)/p;
}
function somenteNumeros(v){ return txt(v).replace(/\D/g,''); }
function gerarCodigoNumericoNF(atual){
  const invalidos=new Set(['00000000','11111111','22222222','33333333','44444444','55555555','66666666','77777777','88888888','99999999','12345678','23456789','34567890','45678901','56789012','67890123','78901234','89012345','90123456','01234567',String(atual||'').padStart(8,'0')]);
  for(let i=1;i<99999999;i++){ const c=String((Number(atual)||0)+i).slice(-8).padStart(8,'0'); if(!invalidos.has(c)) return Number(c); }
  return Math.floor(Math.random()*89999999)+10000000;
}
function dataISO(v){ if(!txt(v)) return hoje(); const d=new Date(v); return Number.isNaN(d.getTime())?txt(v):d.toISOString().slice(0,10); }

function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId&&(cod(x.codigo)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p=>p.empresaId===empId&&(cod(p.sku)===c||cod(p.codigo)===c||cod(p.codigoAntigo)===c||cod(p.idLegado)===c))||null; }
function contratoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.contratos||[]).find(ct=>ct.empresaId===empId&&(cod(ct.numero)===c||cod(ct.codigoAntigo)===c||cod(ct.idLegado)===c||cod(ct.codigo)===c))||null; }
function vendaPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.vendas||[]).find(v=>v.empresaId===empId&&(cod(v.numero)===c||cod(v.codigoAntigo)===c||cod(v.idLegado)===c))||null; }
function leituraPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.leituras||[]).find(l=>l.empresaId===empId&&(cod(l.codigoAntigo)===c||cod(l.numero)===c||cod(l.idLegado)===c||cod(l.id)===c))||null; }
function parquePorItem(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.parque||[]).find(p=>p.empresaId===empId&&cod(p.codigoAntigo)===c)||null; }
function cfgRow(){ return rows('CONFIGURACAO')[0]||{}; }
function cfgSim(nome){ const v=up(pick(cfgRow(),[nome])); return v==='S'||v==='1'||v==='SIM'||v==='TRUE'; }

function medidorValor(m){ return m&&m.ativo!==false?num(m.valor||m.valorExcedente||m.valorPagina,0):0; }
function medidorFranquia(m){ return m&&m.ativo!==false?num(m.franquia,0):0; }
function valorLocacaoContrato(contrato, parqueLista){
  const globais=num(contrato.valorPretoGlobal,0)+num(contrato.valorColorGlobal,0)+num(contrato.valorPretoGlobalA3,0)+num(contrato.valorColorGlobalA3,0)+num(contrato.valorScannerGlobal,0);
  let mensal=0, franquiaIndividual=0;
  (parqueLista||[]).filter(p=>p.status!=='inativo'&&p.status!=='oculto').forEach(p=>{
    const meds=p.medidores||{};
    Object.values(meds).forEach(m=>{
      const modalidade=lower(m&&m.modalidade);
      const fixo=num(m&&m.valorFixo,0)+num(m&&m.valorLocacao,0);
      if(modalidade==='mensal'||modalidade==='mes fixo'||modalidade==='mês fixo') mensal+=fixo||medidorValor(m);
      else if(modalidade==='individual'||modalidade==='d') franquiaIndividual+=medidorFranquia(m);
      else if(!modalidade && fixo) mensal+=fixo;
    });
    mensal+=num(p.valorMensal,0)||num(p.valorLocacao,0)||0;
  });
  const franquiaGlobal=num(contrato.franquiaGlobal,0)+num(contrato.franquiaGlobalColor,0)+num(contrato.franquiaGlobalA3,0)+num(contrato.franquiaGlobalColorA3,0)+num(contrato.franquiaGlobalScanner,0);
  return {valor:round2(mensal+globais), valorTotalContrato:round2(mensal+globais), somaFranquiaGlobal:franquiaGlobal, somaFranquia:franquiaGlobal+franquiaIndividual, franquiaIndividual};
}
function atualizarInfoLocacao(empId){
  let alterou=0;
  (db.contratos||[]).filter(c=>c.empresaId===empId).forEach(c=>{
    const parque=(db.parque||[]).filter(p=>p.empresaId===empId&&p.contratoId===c.id&&p.status!=='inativo'&&p.status!=='oculto');
    const chamados=(db.os||[]).filter(o=>o.empresaId===empId&&o.contratoId===c.id&&!['concluido','cancelado','fechado'].includes(lower(o.status)));
    const calc=valorLocacaoContrato(c,parque);
    const antes=JSON.stringify({qv:c.qtdeVisitas,qe:c.qtdeEquip,valor:c.valorMensalFixo,sit:c.situacaoChamados,fr:c.franquiaIndividual});
    c.qtdeVisitas=chamados.length;
    c.qtdeEquip=parque.length;
    if(calc.valor>0) c.valorMensalFixo=calc.valor;
    c.valorTotalContrato=calc.valorTotalContrato;
    c.somaFranquiaGlobal=calc.somaFranquiaGlobal;
    c.somaFranquia=calc.somaFranquia;
    c.franquiaIndividual=calc.franquiaIndividual;
    c.situacaoChamados=chamados.length?'A':'C';
    if(antes!==JSON.stringify({qv:c.qtdeVisitas,qe:c.qtdeEquip,valor:c.valorMensalFixo,sit:c.situacaoChamados,fr:c.franquiaIndividual})) alterou++;
  });
  return alterou;
}

function tipoContador(row){ return up(pick(row,['CP_TIPO','TIPO']))||'PRETO'; }
function paginasRow(row){ return num(pick(row,['CP_PAGINAS','PAGINAS','PAGINAS_ATUAL']),0); }
function atualizarLeiturasProcedures(empId){
  const cps=rows('CONTADOR_PAGINAS'); if(!cps.length) return 0;
  let alterou=0;
  const porLeitura={};
  cps.forEach(r=>{ const lc=cod(pick(r,['CP_COD_LEITURA'])); if(lc) (porLeitura[lc]=porLeitura[lc]||[]).push(r); });
  Object.entries(porLeitura).forEach(([codLei,lista])=>{
    const l=leituraPorCodigo(codLei,empId); if(!l) return;
    const total=round2(lista.reduce((s,r)=>s+num(pick(r,['CP_VALOR_TOTAL']),0),0));
    const paginas=lista.reduce((s,r)=>s+paginasRow(r),0);
    const exced=lista.reduce((s,r)=>s+num(pick(r,['PAGINAS_EXCEDENTE']),0),0);
    const valorExc=round2(lista.reduce((s,r)=>s+num(pick(r,['CP_VALOR_EXCEDENTE']),0),0));
    const totais={tonerPretoA4:0,tonerPretoA3:0,tonerColorA4:0,tonerColorA3:0,tintaA4:0,tintaA3:0,scanner:0};
    lista.forEach(r=>{
      const t=tipoContador(r); const p=paginasRow(r); const eqTipo=up(pick(r,['EQ_TIPO','EQUIPAMENTO_TIPO']));
      if(t==='SCANNER') totais.scanner+=p;
      else if(/A3/.test(t) && /COLOR|COR/.test(t)){ if(eqTipo==='TINTA') totais.tintaA3+=p; else totais.tonerColorA3+=p; }
      else if(/A3/.test(t)){ if(eqTipo==='TINTA') totais.tintaA3+=p; else totais.tonerPretoA3+=p; }
      else if(/COLOR|COR/.test(t)){ if(eqTipo==='TINTA') totais.tintaA4+=p; else totais.tonerColorA4+=p; }
      else { if(eqTipo==='TINTA') totais.tintaA4+=p; else totais.tonerPretoA4+=p; }
    });
    Object.assign(l,{paginasExcedentes:exced,valorExcedentes:valorExc,paginas,valorTotal:total,valorExcedente:total,totalTonerPretoA4:totais.tonerPretoA4,totalTonerPretoA3:totais.tonerPretoA3,totalTonerColorA4:totais.tonerColorA4,totalTonerColorA3:totais.tonerColorA3,totalTintaA4:totais.tintaA4,totalTintaA3:totais.tintaA3,totalScanner:totais.scanner});
    alterou++;
  });
  const porItem={};
  cps.forEach(r=>{ const item=cod(pick(r,['COD_ITENS_LOCACAO'])); if(!item) return; const data=pick(r,['DATA_LEITURA']); const old=porItem[item]; if(!old||new Date(data)>new Date(pick(old,['DATA_LEITURA']))) porItem[item]=r; });
  Object.entries(porItem).forEach(([item,row])=>{ const p=parquePorItem(item,empId); if(p){ p.ultimaLeitura=pick(row,['DATA_LEITURA'])||p.ultimaLeitura; p.contadorAtual=num(pick(row,['PAGINAS_ATUAL','CP_PAGINAS']),p.contadorAtual||0); alterou++; } });
  return alterou;
}

function atualizarEstoquePorHistorico(empId){
  const hist=[...(db.produtosHistoricoCompra||[]),...(db.produtosHistoricoVenda||[]),...(db.produtosHistorico||[])];
  if(!hist.length) return 0;
  let alterou=0;
  const saldo={};
  hist.forEach(h=>{
    const pid=h.produtoId; if(!pid) return;
    const tipo=up(h.tipo||h.PH_TIPO); const qtd=num(h.qtde||h.PH_QTDE,0);
    saldo[pid]=(saldo[pid]||0)+(tipo==='S'?-qtd:qtd);
  });
  (db.produtos||[]).filter(p=>p.empresaId===empId).forEach(p=>{ if(saldo[p.id]!=null && Math.abs(num(p.estoque,0)-saldo[p.id])>0.0001){ p.estoque=round2(saldo[p.id]); alterou++; } });
  return alterou;
}
function sincronizarSerialEquipamentoProduto(empId){
  db.produtosVariacaoMigrados=db.produtosVariacaoMigrados||[];
  let alterou=0;
  (db.equipamentos||[]).filter(e=>e.empresaId===empId&&(e.serie||e.patrimonio)).forEach(e=>{
    let prod=(db.produtos||[]).find(p=>p.empresaId===empId&&(p.equipamentoId===e.id||p.equipamentoOrigemId===e.id));
    if(!prod){
      const sku='EQ-'+cod(e.codigoAntigo||e.codigo||e.id)||('EQ-'+txt(e.patrimonio||e.serie));
      prod={id:uidSafe('prd'),empresaId:empId,sku,nome:('IMPRESSORA '+txt(e.modelo||e.descricao||'')).trim(),categoria:'Impressoras',equipamentoId:e.id,preco:0,custo:num(e.custo||e.valorCusto,0),estoque:0,criadoPor:'procedure_serial',criadoPorNome:'Procedure',criadoEm:agora()};
      db.produtos.push(prod); alterou++;
    }
    const serial=txt(e.serie||e.patrimonio); if(!serial) return;
    let v=db.produtosVariacaoMigrados.find(x=>x.empresaId===empId&&up(x.identificacao||x.serial)===up(serial));
    const dados={empresaId:empId,codigoAntigo:'EQ-'+cod(e.codigoAntigo||e.id),produtoId:prod.id,equipamentoId:e.id,identificacao:serial,serial,qtde:e.status==='locado'?0:1,del:e.status==='locado'?1:0,origem:'ATUALIZA_ESTOQUE_PRODUTO_SERIAL'};
    if(v) Object.assign(v,dados); else db.produtosVariacaoMigrados.push({id:uidSafe('prv'),...dados});
  });
  return alterou;
}

function precoProdutoPorTipo(prod, tipo){ const p=inteiro(tipo,1); if(p===2) return num(prod.precoPromocao ?? prod.valorTotal2 ?? prod.preco,0); if(p===3) return num(prod.precoAtacado ?? prod.valorTotal3 ?? prod.preco,0); return num(prod.preco ?? prod.valorTotal ?? prod.valorTotal1,0); }
function alterarVlrProdutoItemVenda(item, tipoPreco, empId){
  const prod=item&&((item.produtoId&&(db.produtos||[]).find(p=>p.id===item.produtoId))||produtoPorCodigo(item.produtoCodigoAntigo||item.codProduto,empId));
  const valor=prod?precoProdutoPorTipo(prod,tipoPreco):0;
  if(valor<=0) return {ok:false,message:'Erro: Valor precisa ser maior que zero!'};
  item.preco=valor; item.valorUnitario=valor; item.subtotal=round2(num(item.qtd||item.qtde,1)*valor); item.precoTipo=inteiro(tipoPreco,1); item.percDesconto=0; item.desconto=0;
  return {ok:true,message:'Preço alterado',valor};
}
function totalizarVenda(venda){
  let serv=0, prod=0, ins=0, desc=0;
  (venda.itens||[]).forEach(it=>{ const bruto=num(it.subtotal,0)+num(it.desconto,0); if(/SERV|RECARG|REMANU/i.test(it.tipo||it.tipoDescricao||it.descricao)) serv+=bruto; else prod+=bruto; ins+=num(it.valorInsumos,0); desc+=num(it.desconto,0); });
  venda.valorServico=round2(serv+num(venda.valorMaoDeObra,0)+num(venda.valorDescMaoDeObra,0));
  venda.valorPecas=round2(prod);
  venda.valorInsumos=round2(ins);
  venda.desconto=round2(desc+num(venda.valorDescMaoDeObra,0));
  venda.tipo=(venda.itens||[]).some(it=>/CARTUCHO|RECARG|REMANU|\bR\b/i.test([it.tipo,it.tipoDescricao,it.descricao].filter(Boolean).join(' ')))?'R':(venda.equipamentoId?'S':(venda.tipo||'V'));
  venda.total=round2(venda.valorInsumos+venda.valorServico+venda.valorPecas+num(venda.valorFrete,0)+num(venda.valorSeguro,0)+num(venda.valorAcrescimo,0)-num(venda.desconto,0));
  return venda;
}
function autorizarDescontoProduto({funcionario={}, produto={}, desconto=0, tipoDesconto=0, alterarDesconto=0, valorBase=0}){
  let desc=num(String(desconto).replace(',','.'),0);
  const base=num(valorBase||produto.preco||produto.valorTotal||0,0);
  if(desc<0) return {success:'N',message:'A porcentagem de desconto precisa ser maior que 0!'};
  if(tipoDesconto===1 && base>0) desc=(desc*100)/base;
  if(desc>100) return {success:'N',message:'A porcentagem de desconto precisa ser até 100%'};
  const limite=funcionario.admin?num(produto.descAdmin,100):funcionario.gerente?num(produto.descGere,100):funcionario.vendedor?num(produto.descVend,100):100;
  if(!alterarDesconto && desc>limite && base>0) return {success:'N',message:`Você excedeu o limite de desconto (${limite}%)`};
  return {success:'S',message:'Desconto autorizado com sucesso!',percentual:round2(desc)};
}
function distribuirDescontoVenda(venda, valorDesconto=0, percDesconto=0, forcar=true){
  if(!venda) return {ok:false,message:'Venda não encontrada'};
  const itens=venda.itens||[]; const base=itens.reduce((s,it)=>s+num(it.subtotal,0)+num(it.desconto,0),0)+num(venda.valorMaoDeObra,0);
  let perc=num(percDesconto,0); let vl=num(valorDesconto,0);
  if(vl>0 && base>0) perc=vl*100/base; else if(perc>0) vl=roundABNT(base*perc/100,2);
  let aplicado=0;
  itens.forEach((it,idx)=>{ const bruto=num(it.subtotal,0)+num(it.desconto,0); let d=roundABNT(bruto*perc/100,2); if(idx===itens.length-1) d=round2(vl-aplicado); it.desconto=Math.max(0,d); it.subtotal=round2(Math.max(0,bruto-it.desconto)); aplicado+=it.desconto; });
  venda.valorDescMaoDeObra=round2(Math.max(0,vl-aplicado));
  totalizarVenda(venda);
  return {ok:true,valor:round2(vl),percentual:round2(perc)};
}
function aplicarRegrasVendasProcedures(empId){
  let alterou=0;
  (db.vendas||[]).filter(v=>v.empresaId===empId).forEach(v=>{
    const antes=JSON.stringify({total:v.total,tipo:v.tipo,status:v.status,os:v.osId});
    totalizarVenda(v);
    if(['finalizada','faturado'].includes(lower(v.status)) && v.tipo==='R'){
      (v.itens||[]).forEach(it=>{ if(/CARTUCHO|RECARG|REMANU|\bR\b/i.test([it.tipo,it.tipoDescricao,it.descricao].filter(Boolean).join(' '))){ it.situacao=cfgSim('CARTUCHO_FINALIZADO_VENDA')?'FINALIZADO':(cfgSim('AUTO_SIT_CART_RECICLADO')?'RECICLADO':it.situacao); if(!it.motivoDefeito&&it.situacao==='RECICLADO') it.motivoDefeito='Cartucho Ok'; } });
    }
    if(cfgSim('VEN_CAD_CHAMADO_AUTO') && txt(v.formaEntrega)&&up(v.formaEntrega)!=='AGUARDAR' && !v.osId){
      db.os=db.os||[];
      const status=up(v.formaEntrega)==='ENTREGUE'?'concluido':'aberto';
      const os={id:uidSafe('os'),empresaId:empId,vendaId:v.id,numero:v.numero,clienteId:v.clienteId,equipamentoId:v.equipamentoId||null,status,problema:v.formaEntrega,descricao:[v.defeito,v.observacao].filter(Boolean).join(', ')||('Vinculado à venda '+v.numero),serie:v.numeroSerie||v.serie||'',patrimonio:v.patrimonio||'',origem:'CADASTRAR_CHAMADO',criadoPor:'procedure',criadoPorNome:'Procedure',criadoEm:agora(),dataAbertura:agora()};
      db.os.push(os); v.osId=os.id;
    }
    if(antes!==JSON.stringify({total:v.total,tipo:v.tipo,status:v.status,os:v.osId})) alterou++;
  });
  return alterou;
}

function perfilTributarioPorCodigo(codigo){ const c=cod(codigo); if(!c) return null; return rows('TRIBUTOS_PRODUTOS').find(t=>cod(pick(t,['TP_CODIGO','CODIGO']))===c)||null; }
function ncmPorCodigo(ncm){ const c=somenteNumeros(ncm); return rows('NCM').find(n=>somenteNumeros(pick(n,['NC_NCM','NCM']))===c)||null; }
function aplicarPerfilTributarioItem(item, perfil, nota, empresa){
  if(!item||!perfil) return null;
  const total=num(item.IN_VALOR_TOTAL ?? item.valorTotal ?? item.total, num(item.IN_VALOR_UNITARIO ?? item.valorUnitario,0)*num(item.IN_QTDE ?? item.qtde,1));
  const icmsPerc=num(pick(perfil,['TP_ICMS']),0), ipiPerc=num(pick(perfil,['TP_IPI']),0), pisPerc=num(pick(perfil,['TP_PIS']),0), cofPerc=num(pick(perfil,['TP_COFINS']),0), issPerc=num(pick(perfil,['TP_ISSQN']),0);
  const bcIcms=icmsPerc>0?total:0;
  const out={codTributo:cod(pick(perfil,['TP_CODIGO','CODIGO'])),cfop:pick(perfil,['TP_CFOP']),csosn:pick(perfil,['TP_CSOSN']),cstIcms:pick(perfil,['TP_CST_ICMS']),origem:item.IN_ORIGEM||item.origem||0,cstPis:pick(perfil,['TP_CST_PIS']),cstCofins:pick(perfil,['TP_CST_COFINS']),cstIpi:pick(perfil,['TP_CST_IPI']),bcIcms:round2(bcIcms),valorIcms:round2(bcIcms*icmsPerc/100),valorIpi:round2(total*ipiPerc/100),valorPis:round2(total*pisPerc/100),valorCofins:round2(total*cofPerc/100),valorIssqn:round2(total*issPerc/100),cstIbsCbs:pick(perfil,['TP_CST_IBS_CBS'])||'000',cclassTrib:pick(perfil,['TP_CCLASS_TRIB'])||'000001',pIbsUf:num(pick(perfil,['TP_PIBS_UF']),0.1),pIbsMun:num(pick(perfil,['TP_PIBS_MUN']),0),pCbs:num(pick(perfil,['TP_PCBS']),0.9)};
  const ncm=ncmPorCodigo(item.IN_NCM||item.ncm);
  const mostrar=pick(nota||{},['NF_MOSTRAR_IMPOSTO'])!=='N';
  if(mostrar&&ncm){ const perc=num(pick(ncm,['NC_IMPOSTO','NC_IMPOSTO_IMPORTACAO']),0); out.valorImpostos=roundABNT(total*perc/100,2); }
  Object.assign(item,{IN_COD_TRIBUTO:out.codTributo,IN_CFOP:out.cfop,IN_CSOSN:out.csosn,IN_CST_ICMS:out.cstIcms,IN_BC:out.bcIcms,IN_ICMS:out.valorIcms,IN_VIPI:out.valorIpi,IN_VPIS:out.valorPis,IN_VCOFINS:out.valorCofins,IN_VISSQN:out.valorIssqn,IN_CST_IBS_CBS:out.cstIbsCbs,IN_CCLASS_TRIB:out.cclassTrib,IN_PIBS_UF:out.pIbsUf,IN_PIBS_MUN:out.pIbsMun,IN_PCBS:out.pCbs,IN_IMPOSTOS:out.valorImpostos||0,tributacaoCalculada:out});
  return out;
}
function aplicarFiscalProcedures(empId){
  const itens=rows('ITENS_NOTA'); if(!itens.length) return 0;
  let alterou=0;
  itens.forEach(item=>{
    const nota=rows('NOTA_FISCAL').find(n=>cod(pick(n,['NF_CODIGO','CODIGO']))===cod(pick(item,['IN_COD_NOTA_FISCAL'])) )||{};
    let perfil=perfilTributarioPorCodigo(pick(item,['IN_COD_TRIBUTO','COD_TRIBUTO']));
    if(!perfil){
      const ufDest=pick(nota,['NF_UF']); const emp=rows('EMPRESA').find(e=>cod(pick(e,['COD_EMPRESA']))===cod(pick(nota,['NF_COD_EMPRESA'])) )||{};
      const cfg=cfgRow();
      perfil=perfilTributarioPorCodigo(ufDest&&ufDest===pick(emp,['UF'])?pick(cfg,['NFE_TRIB_VENDA_DENTRO']):pick(cfg,['NFE_TRIB_VENDA_FORA']));
    }
    if(perfil){ aplicarPerfilTributarioItem(item,perfil,nota,{}); alterou++; }
  });
  return alterou;
}
function totalizarNotasFiscaisProcedures(empId){
  const notas=rows('NOTA_FISCAL'); const itens=rows('ITENS_NOTA'); if(!notas.length||!itens.length) return 0;
  db.notasFiscaisMigradas=db.notasFiscaisMigradas||[];
  let alterou=0;
  notas.forEach(n=>{
    const codNota=cod(pick(n,['NF_CODIGO','CODIGO'])); if(!codNota) return;
    const rel=itens.filter(i=>cod(pick(i,['IN_COD_NOTA_FISCAL']))===codNota);
    const totals={produtos:0,servicos:0,desconto:0,icms:0,ipi:0,pis:0,cofins:0,issqn:0,impostos:0};
    rel.forEach(i=>{ const total=num(i.IN_VALOR_TOTAL,0); if(up(i.IN_TIPO_DESCRICAO)==='SERVICO') totals.servicos+=total; else totals.produtos+=total; totals.desconto+=num(i.IN_VALOR_DESCONTO,0); totals.icms+=num(i.IN_ICMS,0); totals.ipi+=num(i.IN_VIPI,0); totals.pis+=num(i.IN_VPIS,0); totals.cofins+=num(i.IN_VCOFINS,0); totals.issqn+=num(i.IN_VISSQN,0); totals.impostos+=num(i.IN_IMPOSTOS,0); });
    totals.total=round2(totals.produtos+totals.servicos+num(pick(n,['NF_VALOR_FRETE']),0)+num(pick(n,['NF_VALOR_SEGURO']),0)+num(pick(n,['NF_VALOR_ACRESCIMO']),0)+totals.ipi-totals.desconto);
    let nf=db.notasFiscaisMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codNota);
    const dados={empresaId:empId,codigoAntigo:codNota,totaisProcedures:Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,round2(v)])),valorTotal:round2(totals.total)};
    if(nf) Object.assign(nf,dados); else db.notasFiscaisMigradas.push({id:uidSafe('nf'),...dados});
    alterou++;
  });
  return alterou;
}

function validarPixEmissao(contaReceber){
  if(!contaReceber) return {success:'N',mensagem:'Parcela inválida'};
  if(contaReceber.boletoId||contaReceber.CR_COD_BOLETO||contaReceber.codBoleto) return {success:'N',mensagem:'Existe boleto gerado para esta parcela. Exclua/cancele o boleto antes de gerar Pix.'};
  return {success:'S',mensagem:'Pix validado com sucesso',baixaAutomatica:false,comprovanteObrigatorio:true};
}
function sugerirDuplicadosClientes(empId){
  const mapa={};
  (db.clientes||[]).filter(c=>c.empresaId===empId).forEach(c=>{
    const keys=[somenteNumeros(c.documento||c.cpfCnpj),lower(c.email),somenteNumeros(c.telefone||c.celular)].filter(k=>k&&k.length>=6);
    keys.forEach(k=>{ (mapa[k]=mapa[k]||[]).push(c.id); });
  });
  db.clientesDuplicadosSugeridos=Object.entries(mapa).filter(([,ids])=>new Set(ids).size>1).map(([chave,ids])=>({chave,ids:[...new Set(ids)],origem:'CLIENTE_UNIFICAR_CADASTRO'}));
  return db.clientesDuplicadosSugeridos.length;
}
function atualizarConfigMetricas(empId){
  const vendas=(db.vendas||[]).filter(v=>v.empresaId===empId);
  if(!vendas.length) return 0;
  const difsA=[], difsE=[];
  vendas.forEach(v=>{ const d=Date.parse(v.data||v.criadoEm||''); const ap=Date.parse(v.dataAprovacao||v.dataPgAprovado||''); const en=Date.parse(v.dataEntregue||''); if(d&&ap&&ap>d) difsA.push((ap-d)/60000); if(ap&&en&&en>ap) difsE.push((en-ap)/60000); });
  db.config=db.config||{}; db.config.metricasProcedures=db.config.metricasProcedures||{};
  const avg=a=>a.length?Math.round(a.reduce((s,v)=>s+v,0)/a.length):0;
  db.config.metricasProcedures.mediaTempoAprovacaoVenda=avg(difsA)||5;
  db.config.metricasProcedures.mediaTempoEntregaVenda=avg(difsE)||40;
  db.config.metricasProcedures.tempoEntregaSeg=(db.config.metricasProcedures.mediaTempoAprovacaoVenda+db.config.metricasProcedures.mediaTempoEntregaVenda)*60;
  return 1;
}

function aplicarAutomacoesProceduresOperacionais(empId){
  if(!db||!empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=[assinaturaTabela(['ITENS_NOTA','NOTA_FISCAL','TRIBUTOS_PRODUTOS','NCM','CONTADOR_PAGINAS','ITENS_LOCACAO','CONFIGURACAO','PRODUTOS_HISTORICO']),assinaturaArray('contratos',empId),assinaturaArray('parque',empId),assinaturaArray('vendas',empId),assinaturaArray('produtos',empId),assinaturaArray('clientes',empId),assinaturaArray('equipamentos',empId),assinaturaArray('leituras',empId)].join('|');
  if(db.config.automacoes.proceduresOperacionaisAssinatura===sig) return 0;
  let total=0;
  total+=atualizarInfoLocacao(empId);
  total+=atualizarLeiturasProcedures(empId);
  total+=atualizarEstoquePorHistorico(empId);
  total+=sincronizarSerialEquipamentoProduto(empId);
  total+=aplicarRegrasVendasProcedures(empId);
  total+=aplicarFiscalProcedures(empId);
  total+=totalizarNotasFiscaisProcedures(empId);
  total+=sugerirDuplicadosClientes(empId);
  total+=atualizarConfigMetricas(empId);
  db.config.automacoes.proceduresOperacionaisAssinatura=sig;
  if(total || sig) salvar();
  return total;
}

window.AUTOMACOES_PROCEDURES_OPERACIONAIS_PURE={ roundABNT, somenteNumeros, semAcento, gerarCodigoNumericoNF, valorLocacaoContrato, atualizarInfoLocacao, atualizarLeiturasProcedures, atualizarEstoquePorHistorico, sincronizarSerialEquipamentoProduto, alterarVlrProdutoItemVenda, autorizarDescontoProduto, distribuirDescontoVenda, totalizarVenda, aplicarPerfilTributarioItem, validarPixEmissao, sugerirDuplicadosClientes, aplicarAutomacoesProceduresOperacionais };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s=sess(); if(s) aplicarAutomacoesProceduresOperacionais(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_procedures_operacionais', run, 1800); else setTimeout(run,1800); return ret; };
['renderContratos','renderLeituras','renderVendas','renderFinanceiro','renderProdutos'].forEach(nome=>{
  const old=window[nome];
  if(typeof old==='function') window[nome]=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_procedures_operacionais', run, 0); else run(); return old.apply(this,arguments); };
});
if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_procedures_operacionais', run, 3600); else setTimeout(run,3600);
console.log('[DIGICOPY] automacoes_procedures_operacionais_patch.js v4.9.34 carregado');
})();
