// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.27 — Automações de orçamentos, clientes e auxiliares
// • Continuação da adaptação das triggers úteis do banco anterior
// • Itens de orçamento puxam produto/cartucho, preço, tipo, desconto e total
// • Clientes recebem defaults, e-mail minúsculo e endereço auxiliar sem CAPSLOCK em nomes
// • Boletos ficam somente como legado/consulta, sem reativar boleto no faturamento
// • NFSe, portal de cliente, grades/categorias/variações viram estruturas leves futuras
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function title(v){ const s=txt(v); if(!s) return ''; if(window.VOTM_PURE&&typeof window.VOTM_PURE.toTitleCase==='function') return window.VOTM_PURE.toTitleCase(s); return s.toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g,m=>m.toLowerCase()).replace(/\b(Jk|Me|Ltda|Eireli|Epp|Mei)\b/g,m=>m.toUpperCase()); }
function num(v, fb=0){ const out=Number(String(v ?? '').replace(',', '.')); return Number.isFinite(out)?out:fb; }
function inteiro(v, fb=0){ const out=parseInt(String(v ?? ''),10); return Number.isFinite(out)?out:fb; }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }
function round2(v){ return Math.round(num(v,0)*100)/100; }
function agora(){ return new Date().toISOString(); }
function assinaturaTabela(nomes){ return nomes.map(nome=>{ const r=rows(nome); const last=r[r.length-1]||{}; return `${nome}:${r.length}:${JSON.stringify(last).slice(0,80)}`; }).join('|'); }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p=>p.empresaId===empId&&(cod(p.sku)===c||cod(p.codigo)===c||cod(p.codigoAntigo)===c||cod(p.idLegado)===c))||null; }
function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId&&(cod(x.codigo)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function vendaOrcamentoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.vendas||[]).find(v=>v.empresaId===empId&&(v.orcamentoCodigoAntigo===c||cod(v.numero)===c||cod(v.codigoAntigo)===c)&&['orcamento','aprovado'].includes(v.status)); }

function cartuchoRaw(codCart){ const c=cod(codCart); if(!c) return null; return rows('CARTUCHOS').find(x=>cod(x.COD_CARTUCHO)===c)||null; }
function cartuchoInfo(codCart){
  const c=cod(codCart); if(!c) return null;
  const mig=(db.cartuchosMigrados||[]).find(x=>cod(x.codigoAntigo)===c);
  if(mig) return mig;
  const raw=cartuchoRaw(c); if(!raw) return null;
  const fab=rows('FABRICANTE').find(f=>cod(f.COD_FABRICANTE)===cod(raw.COD_FABRICANTE));
  return { codigoAntigo:c, tipo:raw.TIPO||'', numero:raw.NUMERO||'', cor:raw.COR||'', fabricante:fab?fab.NOME:'', valorRecarga:num(raw.VALOR_RECARGA,0), valorTrocar:num(raw.VALOR_TROCAR,0), valorRemanufaturado:num(raw.VALOR_REMANUFATURADO,0), valorCompativel:num(raw.VALOR_COMPATIVEL,0), valorOriginal:num(raw.VALOR_ORIGINAL,0) };
}
function tipoDescricaoProduto(prod){
  const tipo=up(prod && (prod.tipoOriginal||prod.tipo||prod.TIPO));
  if(tipo==='S' || /SERV/i.test(prod && prod.categoria)) return 'SERVICO';
  if(tipo==='C') return 'CARTUCHO';
  if(tipo==='V') return 'CARTUCHO VAZIO';
  if(tipo==='I') return 'INSUMO';
  return 'PRODUTO';
}
function precoProduto(prod, precoTipo){
  const p=inteiro(precoTipo,1);
  if(p===2) return num(prod.valorTotal2 ?? prod.precoPromocao ?? prod.preco,0);
  if(p===3) return num(prod.valorTotal3 ?? prod.precoAtacado ?? prod.preco,0);
  return num(prod.preco ?? prod.valorTotal ?? prod.VALOR_TOTAL,0);
}
function precoCartucho(cart, precoTipo){
  const p=inteiro(precoTipo,1);
  if(p===2) return num(cart.valorTrocar,0);
  if(p===3) return num(cart.valorRemanufaturado,0);
  if(p===4) return num(cart.valorCompativel,0);
  if(p===5) return num(cart.valorOriginal,0);
  return num(cart.valorRecarga,0);
}
function calcularItemOrcamento(row, empId){
  const qtd=num(row.QTDE,1)||1;
  const precoTipo=inteiro(row.PRECO,1)||1;
  let unit=num(row.VALOR_UNITARIO, NaN);
  let descricao=txt(row.DESCRICAO);
  let tipo=txt(row.TIPO);
  let tipoDescricao=txt(row.TIPO_DESCRICAO);
  const prod=produtoPorCodigo(row.COD_PRODUTO, empId);
  const cart=cartuchoInfo(row.IO_COD_CARTUCHO || row.COD_CARTUCHO);
  if(prod){
    tipo=prod.tipoOriginal||prod.tipo||tipo||'P';
    tipoDescricao=tipoDescricao||tipoDescricaoProduto(prod);
    if(!Number.isFinite(unit) || unit===0) unit=precoProduto(prod, precoTipo);
    descricao=descricao||prod.nome||prod.descricao;
  }
  if(cart){
    tipo='R';
    tipoDescricao=tipoDescricao||'RECARGA';
    if(!Number.isFinite(unit) || unit===0) unit=precoCartucho(cart, precoTipo);
    const ini=tipoDescricao==='REMANU.'?'REMANUFATURA DE':'RECARGA DE';
    descricao=descricao||[ini, cart.tipo, cart.fabricante, cart.numero, cart.cor].filter(Boolean).join(' ');
  }
  if(!Number.isFinite(unit)) unit=0;
  let bruto=round2(unit*qtd);
  let desconto=num(row.DESCONTO ?? row.VALOR_DESCONTO,0);
  const tipoDesconto=inteiro(row.TIPO_DESCONTO, row.VALOR_DESCONTO>0?1:0);
  if(tipoDesconto===0){
    if(desconto<0) desconto=0;
    if(desconto>100) desconto=100;
    desconto=round2(bruto*desconto/100);
  } else {
    if(desconto<0) desconto=0;
    if(desconto>bruto) desconto=bruto;
  }
  return { produtoId:prod?prod.id:null, cartuchoCodigoAntigo:cart?cart.codigoAntigo:'', descricao:descricao||'Item do orçamento', qtd, preco:unit, desconto, subtotal:round2(bruto-desconto), tipo, tipoDescricao:tipoDescricao||'PRODUTO', precoTipo };
}
function sincronizarItensOrcamentoDetalhes(empId){
  const itens=rows('ITENS_ORCAMENTO'); if(!itens.length) return 0;
  let alterou=0;
  const porOrc={};
  itens.forEach(row=>{
    const codOrc=cod(row.COD_ORCAMENTO); if(!codOrc) return;
    const item=calcularItemOrcamento(row, empId);
    const codItem=cod(row.COD_ITENS_ORCAMENTO)||uidSafe('io');
    item.codigoAntigo=codItem;
    (porOrc[codOrc]=porOrc[codOrc]||[]).push(item);
  });
  Object.entries(porOrc).forEach(([codOrc, lista])=>{
    const venda=vendaOrcamentoPorCodigo(codOrc, empId);
    if(!venda) return;
    const old=JSON.stringify({itens:venda.itens,total:venda.total});
    venda.itens=lista;
    venda.total=round2(lista.reduce((s,i)=>s+num(i.subtotal,0),0));
    venda.totalItensCalculado=venda.total;
    if(old!==JSON.stringify({itens:venda.itens,total:venda.total})) alterou++;
  });
  return alterou;
}

function normalizeCliente(c, empId){
  let changed=false;
  function set(k,v){ if(c[k]!==v){ c[k]=v; changed=true; } }
  if(!c.empresaId) set('empresaId', empId);
  if(c.email) set('email', txt(c.email).toLowerCase());
  if(c.email2) set('email2', txt(c.email2).toLowerCase());
  if(!txt(c.numero)) set('numero','Número');
  if(!txt(c.bairro)) set('bairro','Bairro');
  if(!txt(c.endereco)) set('endereco','Rua');
  if(!txt(c.cidade)) set('cidade','Cidade');
  if(!txt(c.estado)) set('estado','MG');
  if(!txt(c.nome)) set('nome','Cliente sem nome');
  set('nome', title(c.nome));
  if(c.fantasia) set('fantasia', title(c.fantasia));
  if(c.status==null) set('status','ativo');
  if(c.bloqueado==null) set('bloqueado',false);
  if(c.desconto==null) set('desconto',0);
  if(c.limiteCredito==null) set('limiteCredito',1000);
  c.cidadeSemAcento=up(semAcento(c.cidade));
  return changed;
}
function sincronizarClientesDetalhes(empId){
  let alterou=0;
  (db.clientes||[]).filter(c=>c.empresaId===empId).forEach(c=>{ if(normalizeCliente(c,empId)) alterou++; });
  db.enderecosMigrados=db.enderecosMigrados||[];
  (db.clientes||[]).filter(c=>c.empresaId===empId).forEach(c=>{
    if(c.cep&&c.endereco&&c.bairro&&c.cidade&&c.numero){
      const key=[c.id,c.cep,c.endereco,c.bairro,c.cidade,c.numero].join('|');
      if(!db.enderecosMigrados.find(e=>e.key===key)) db.enderecosMigrados.push({id:uidSafe('end'),key,clienteId:c.id,cep:c.cep,endereco:c.endereco,bairro:c.bairro,cidade:c.cidade,estado:c.estado,numero:c.numero,origem:'cliente'});
    }
  });
  return alterou;
}

function statusBoleto(s){
  const x=txt(s).toLowerCase();
  if(!x||x==='nao gerado'||x==='não gerado') return 'NAO GERADO';
  if(x==='new') return 'GERADO INCOMPLETO';
  if(['waiting','open','late'].includes(x)) return 'GERADO';
  if(x==='paid') return 'PAGO';
  if(x==='identified') return 'IDENTIFICADO';
  if(x==='unpaid') return 'NAO PAGO';
  if(x==='refunded') return 'DEVOLVIDO';
  if(x==='contested') return 'CONTESTADO';
  if(['canceled','cancelled'].includes(x)) return 'CANCELADO';
  if(x==='settled') return 'Quitado Manualmente';
  if(x==='link') return 'LINK';
  if(x==='expired') return 'EXPIRADO';
  return txt(s).toUpperCase();
}
function sincronizarBoletosLegado(empId){
  const raw=rows('BOLETOS'); if(!raw.length) return 0;
  db.boletosLegado=db.boletosLegado||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(r.BO_CODIGO); if(!codigo) return;
    const cliente=clientePorCodigo(r.BO_COD_CLIENTE, empId);
    let b=db.boletosLegado.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const st=statusBoleto(r.BO_SITUACAO);
    const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,clienteNome:r.BO_NOME_RAZAOSOCIAL||'',valor:num(r.BO_VALOR_TOTAL,0),vencimento:r.BO_DATA_VENCIMENTO||'',pagamentoData:r.BO_DATA_PAGAMENTO||null,status:st,juros:num(r.BO_VALOR_JUROS,0),desconto:num(r.BO_VALOR_DESCONTO,0),somenteLegado:true};
    if(b) Object.assign(b,dados); else db.boletosLegado.push({id:uidSafe('bol'),...dados});
    // Mantém boleto como histórico, mas não bloqueia cliente nem reativa faturamento por boleto.
    alterou++;
  });
  return alterou;
}

function sincronizarNfse(empId){
  const raw=rows('NFSE'); if(!raw.length) return 0;
  db.nfseMigradas=db.nfseMigradas||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(r.NFS_CODIGO||r.nfs_codigo); if(!codigo) return;
    let nfs=db.nfseMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const status=inteiro(r.NFS_STATUS??r.nfs_status,0);
    const dados={empresaId:empId,codigoAntigo:codigo,dataEmissao:r.NFS_DATA_EMISSAO||r.nfs_data_emissao||new Date().toISOString(),status,cancelada:status===2,dataCancelamento:(status===2?(r.NFS_DATA_CANCELAMENTO||r.nfs_data_cancelamento||new Date().toISOString()):null)};
    if(nfs) Object.assign(nfs,dados); else db.nfseMigradas.push({id:uidSafe('nfs'),...dados});
    alterou++;
  });
  return alterou;
}

function sincronizarPortalEAuxiliares(empId){
  let alterou=0;
  db.clientesUsuariosMigrados=db.clientesUsuariosMigrados||[];
  rows('CLIENTES_USUARIOS').forEach(r=>{
    const codigo=cod(r.CLU_CODIGO||r.clu_codigo); if(!codigo) return;
    let u=db.clientesUsuariosMigrados.find(x=>x.codigoAntigo===codigo&&x.empresaId===empId);
    const cliente=clientePorCodigo(r.CLU_COD_CLIENTE||r.clu_cod_cliente, empId);
    const permissoes=['FAQ','SHOP','PEDIDOS','FATURAS','IMPRESSORAS','CHAMADOS'];
    const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,data:r.CLU_DATA||r.clu_data||new Date().toISOString(),permissoes:Object.fromEntries(permissoes.map(p=>[p,{vis:true,alt:true,del:true,cad:true,rel:true}]))};
    if(u) Object.assign(u,dados); else db.clientesUsuariosMigrados.push({id:uidSafe('clu'),...dados});
    alterou++;
  });
  db.gradesMigradas=db.gradesMigradas||[];
  rows('GRADES').forEach(r=>{ const c=cod(r.GRA_CODIGO); if(!c) return; let g=db.gradesMigradas.find(x=>x.codigoAntigo===c); const d={codigoAntigo:c,descricao:txt(r.GRA_DESCRICAO),data:r.GRA_DATA||new Date().toISOString()}; if(g) Object.assign(g,d); else db.gradesMigradas.push({id:uidSafe('gra'),...d}); alterou++; });
  db.produtosCategoriaMigradas=db.produtosCategoriaMigradas||[];
  rows('PRODUTOS_CATEGORIA').forEach(r=>{ const c=cod(r.PRC_CODIGO); if(!c) return; let g=db.produtosCategoriaMigradas.find(x=>x.codigoAntigo===c); const d={codigoAntigo:c,data:r.PRC_DATA||r.PRC_data||new Date().toISOString(),descricao:txt(r.PRC_DESCRICAO||r.DESCRICAO)}; if(g) Object.assign(g,d); else db.produtosCategoriaMigradas.push({id:uidSafe('prc'),...d}); alterou++; });
  db.variacaoTiposMigrados=db.variacaoTiposMigrados||[];
  rows('VARIACAO').forEach(r=>{ const c=cod(r.VAR_CODIGO||r.var_codigo); if(!c) return; let g=db.variacaoTiposMigrados.find(x=>x.codigoAntigo===c); const d={codigoAntigo:c,data:r.VAR_DATA||r.var_data||new Date().toISOString(),descricao:txt(r.VAR_DESCRICAO||r.DESCRICAO)}; if(g) Object.assign(g,d); else db.variacaoTiposMigrados.push({id:uidSafe('var'),...d}); alterou++; });
  return alterou;
}

function aplicarAutomacoesOrcClientesAux(empId){
  if(!db||!empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=assinaturaTabela(['ITENS_ORCAMENTO','CLIENTES','BOLETOS','NFSE','CLIENTES_USUARIOS','GRADES','PRODUTOS_CATEGORIA','VARIACAO']);
  if(db.config.automacoes.orcClientesAuxAssinatura===sig) return 0;
  let total=0;
  total+=sincronizarItensOrcamentoDetalhes(empId);
  total+=sincronizarClientesDetalhes(empId);
  total+=sincronizarBoletosLegado(empId);
  total+=sincronizarNfse(empId);
  total+=sincronizarPortalEAuxiliares(empId);
  db.config.automacoes.orcClientesAuxAssinatura=sig;
  if(total) salvar();
  return total;
}

window.AUTOMACOES_ORC_CLIENTES_AUX_PURE={ calcularItemOrcamento, normalizeCliente, statusBoleto, sincronizarItensOrcamentoDetalhes, sincronizarClientesDetalhes, sincronizarBoletosLegado, sincronizarNfse, sincronizarPortalEAuxiliares, aplicarAutomacoesOrcClientesAux };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s=sess(); if(s) aplicarAutomacoesOrcClientesAux(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; setTimeout(run,800); return ret; };
const oldRenderClientes=window.renderClientes;
window.renderClientes=function(){ run(); return oldRenderClientes?oldRenderClientes.apply(this,arguments):undefined; };
const oldRenderVendas=window.renderVendas;
window.renderVendas=function(){ run(); return oldRenderVendas?oldRenderVendas.apply(this,arguments):undefined; };
const oldRenderFinanceiro=window.renderFinanceiro;
window.renderFinanceiro=function(){ run(); return oldRenderFinanceiro?oldRenderFinanceiro.apply(this,arguments):undefined; };
setTimeout(run,1800);
console.log('[DIGICOPY] automacoes_orcamentos_clientes_auxiliares_patch.js v4.9.27 carregado');
})();
