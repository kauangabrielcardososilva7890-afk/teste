// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.23 — Automações de locação, despesas e visitas
// • Continuação da adaptação das triggers úteis do banco anterior
// • Despesas de locação puxam dados de visitas e geram histórico de suprimentos
// • Itens de locação normalizam medidores independentes e status de equipamento
// • Visitas/chamados puxam cliente, equipamento, endereço, motivo, custo e venda vinculada
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function num(v, fb=0){ const n=Number(String(v ?? '').replace(',', '.')); return Number.isFinite(n)?n:fb; }
function inteiro(v, fb=0){ const n=parseInt(String(v ?? ''),10); return Number.isFinite(n)?n:fb; }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function logar(e,a,id,d){ if(typeof logAction==='function') logAction(e,a,id,d); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function rowsLike(rx){ const out=[]; Object.entries(db.modulosDinamicos||{}).forEach(([nome,m])=>{ if(rx.test(nome)) out.push(...(((m||{}).dados)||[])); }); return out; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }
function assinaturaTabela(nomes){ return nomes.map(nome=>{ const r=rows(nome); const last=r[r.length-1]||{}; return `${nome}:${r.length}:${JSON.stringify(last).slice(0,80)}`; }).join('|'); }
function assinaturaArray(nome, empId){ const a=Array.isArray(db[nome])?db[nome].filter(x=>!empId||!x.empresaId||x.empresaId===empId):[]; const last=a[a.length-1]||{}; return `${nome}:${a.length}:${JSON.stringify(last).slice(0,80)}`; }
function title(v){ const s=txt(v); if(!s) return ''; if(window.VOTM_PURE&&typeof window.VOTM_PURE.toTitleCase==='function') return window.VOTM_PURE.toTitleCase(s); return s.toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g,m=>m.toLowerCase()); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function iso(v){ if(!v) return new Date().toISOString(); const s=txt(v); if(/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s.slice(0,10)+'T12:00:00').toISOString(); const d=new Date(s); return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString(); }

function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId&&(cod(x.codigo)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function contratoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.contratos||[]).find(x=>x.empresaId===empId&&(cod(x.numero)===c||cod(x.codigoAntigo)===c||cod(x.codigo)===c||cod(x.idLegado)===c))||null; }
function equipamentoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.equipamentos||[]).find(e=>e.empresaId===empId&&(cod(e.codigoAntigo)===c||cod(e.codigo)===c||cod(e.idLegado)===c))||null; }
function equipamentoPorChave(chave, empId){ const k=up(chave); if(!k) return null; return (db.equipamentos||[]).find(e=>e.empresaId===empId&&(up(e.patrimonio)===k||up(e.serie)===k))||null; }
function parquePorItem(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.parque||[]).find(p=>p.empresaId===empId&&cod(p.codigoAntigo)===c)||null; }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p=>p.empresaId===empId&&(cod(p.sku)===c||cod(p.codigoAntigo)===c||cod(p.codigo)===c))||null; }
function vendaPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.vendas||[]).find(v=>v.empresaId===empId&&(cod(v.numero)===c||cod(v.codigoAntigo)===c))||null; }
function depNome(codDep){ const c=cod(codDep); if(!c) return ''; const r=rows('DEPARTAMENTOS').find(x=>cod(x.DEP_COD_DEPARTAMENTO)===c); return txt(r&&r.DEP_DESCRICAO); }
function motivoNome(codMotivo){ const c=cod(codMotivo); if(!c) return ''; const r=rows('MOTIVO_DEFEITO').find(x=>cod(x.COD_MOTIVO_DEFEITO)===c); return txt(r&&r.DESCRICAO); }

function descricaoSuprimento(desc){ return /CARTUCHO|TONER|TONNER|REFIL|RECARGA/i.test(txt(desc)) && !/\bPO\b|\bPÓ\b/i.test(txt(desc)); }
function vidaUtilPadrao(){ const vals=rows('CARTUCHOS').map(r=>num(r.QTDE_COPIAS,0)).filter(v=>v>0); if(!vals.length) return 0; return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length); }
function vidaUtilDoItemVenda(codItemVenda, empId){
  const item=rowsLike(/^ITENS_VENDA$/i).find(r=>cod(pick(r,['COD_ITENS_VENDA']))===cod(codItemVenda));
  let vida=0;
  if(item){
    const prod=produtoPorCodigo(pick(item,['COD_PRODUTO']), empId);
    if(prod) vida=num(prod.vidaUtil||prod.VIDA_UTIL,0);
    const codCart=pick(item,['COD_CARTUCHO']);
    if(!vida && codCart){ const cart=rows('CARTUCHOS').find(r=>cod(r.COD_CARTUCHO)===cod(codCart)); vida=num(cart&&cart.QTDE_COPIAS,0); }
  }
  return vida || vidaUtilPadrao();
}

function tipoMedidorFromCodigo(tipo){
  const t=up(tipo);
  if(t==='G') return 'global';
  if(t==='C') return 'impressao';
  if(t==='M') return 'mes_fixo';
  if(t==='I') return 'inativo';
  if(t==='D') return 'individual';
  return 'global';
}
function medidor(label, tipo, paginas, valorPaginas, valorExcedente, valorFixo, contadorInicial){
  return { label, modalidade:tipoMedidorFromCodigo(tipo), contadorAnterior:num(contadorInicial,0), franquia:num(paginas,0), valor:num(valorExcedente||valorPaginas,0), valorFixo:num(valorFixo,0), ativo:tipoMedidorFromCodigo(tipo)!=='inativo' };
}
function medidoresFromItemLocacao(row){
  return {
    pretoA4: {key:'pretoA4', ...medidor('Preto A4', pick(row,['IT_TIPO','TIPO']), pick(row,['IT_PAGINAS','PAGINAS']), pick(row,['IT_VALOR_PAGINAS','VALOR_PAGINAS']), pick(row,['IT_VALOR_PAGINAS_EXCEDENTE','VALOR_PAGINAS_EXCEDENTE']), pick(row,['IT_VALOR_FIXO_PRETO_A4']), pick(row,['IT_PAGINAS_INICIO']))},
    colorA4: {key:'colorA4', ...medidor('Color A4', pick(row,['IT_TIPO_COLOR','TIPO_COLOR']), pick(row,['IT_PAGINAS_COLOR','PAGINAS_COLOR']), pick(row,['IT_VALOR_PAGINAS_COLOR']), pick(row,['IT_VALOR_PAGINAS_EXC_COLOR']), pick(row,['IT_VALOR_FIXO_COLOR_A4']), pick(row,['IT_PAGINAS_INICIO_COLOR']))},
    scanner: {key:'scanner', ...medidor('Scanner', pick(row,['IT_TIPO_SCANNER','TIPO_SCANNER']), pick(row,['IT_PAGINAS_SCANNER']), pick(row,['IT_VALOR_PAGINAS_SCANNER']), pick(row,['IT_VALOR_PAGINAS_EXC_SCANNER']), pick(row,['IT_VALOR_FIXO_SCANNER']), pick(row,['IT_PAGINAS_INICIO_SCANNER']))},
    pretoA3: {key:'pretoA3', ...medidor('Preto A3', pick(row,['IT_TIPO_PRETO_A3','TIPO_PRETO_A3']), pick(row,['IT_PAGINAS_A3']), pick(row,['IT_VALOR_PAGINAS_A3']), pick(row,['IT_VALOR_PAGINAS_EXCEDENTE_A3']), pick(row,['IT_VALOR_FIXO_PRETO_A3']), pick(row,['IT_PAGINAS_INICIO_A3']))},
    colorA3: {key:'colorA3', ...medidor('Color A3', pick(row,['IT_TIPO_COLOR_A3','TIPO_COLOR_A3']), pick(row,['IT_PAGINAS_COLOR_A3']), pick(row,['IT_VALOR_PAGINAS_COLOR_A3']), pick(row,['IT_VALOR_PAGINAS_EXC_COLOR_A3']), pick(row,['IT_VALOR_FIXO_COLOR_A3']), pick(row,['IT_PAGINAS_INICIO_COLOR_A3']))}
  };
}

function garantirEquipamentoFromLocacao(row, empId){
  const codEq=pick(row,['IT_COD_EQUIPAMENTO','COD_EQUIPAMENTO','VI_COD_EQUIPAMENTO']);
  const patr=txt(pick(row,['IT_PATRIMONIO','PATRIMONIO','VI_PATRIMONIO']))||txt(codEq);
  const serie=txt(pick(row,['IT_SERIAL','SERIAL','VI_SERIAL']))||patr||txt(codEq);
  let eq=equipamentoPorChave(patr||serie, empId)||equipamentoPorCodigo(codEq, empId);
  if(eq){
    if(patr&&!eq.patrimonio) eq.patrimonio=patr;
    if(serie&&!eq.serie) eq.serie=serie;
    if(codEq&&!eq.codigoAntigo) eq.codigoAntigo=cod(codEq);
    return eq;
  }
  const modelo=txt(pick(row,['MODELO','DESCRICAO','EQUIPAMENTO','IMPRESSORA']))||`Impressora ${patr||serie||codEq||''}`.trim();
  eq={id:uidSafe('eq'),empresaId:empId,codigoAntigo:cod(codEq),modelo,tipo:'Laser',serie:serie||uidSafe('serie'),patrimonio:patr||serie||uidSafe('pat'),contadorPB:num(pick(row,['IT_CONTADOR_ATUAL','VI_CONTADOR_ATUAL']),0),contadorCor:num(pick(row,['VI_CONTADOR_ATUAL_COLOR']),0),status:'locado',criadoPor:'migracao',criadoPorNome:'Migração',criadoEm:new Date().toISOString()};
  db.equipamentos.push(eq);
  return eq;
}
function statusParqueFromSituacao(sit, ocultar){
  if(txt(ocultar)==='S') return 'inativo';
  const s=up(sit);
  if(s==='D') return 'manutencao';
  if(s==='R') return 'remanejado';
  if(s==='E') return 'disponivel';
  return 'ativo';
}
function sincronizarItensLocacao(empId){
  const itens=rowsLike(/^ITENS_LOCACAO$/i);
  if(!itens.length) return 0;
  let alterou=0;
  itens.forEach(row=>{
    const codItem=cod(pick(row,['IT_COD_ITENS_LOCACAO','COD_ITENS_LOCACAO','CODIGO','ID'])); if(!codItem) return;
    const contrato=contratoPorCodigo(pick(row,['IT_COD_LOCACAO','COD_LOCACAO']), empId);
    const cli=contrato&&contrato.clienteId?(db.clientes||[]).find(c=>c.id===contrato.clienteId):clientePorCodigo(pick(row,['IT_COD_CLIENTE','COD_CLIENTE']), empId);
    const eq=garantirEquipamentoFromLocacao(row, empId);
    let p=parquePorItem(codItem, empId)||((db.parque||[]).find(x=>x.empresaId===empId&&contrato&&x.contratoId===contrato.id&&x.equipamentoId===eq.id));
    const dados={empresaId:empId,codigoAntigo:codItem,contratoId:contrato?contrato.id:null,clienteId:cli?cli.id:(contrato?contrato.clienteId:null),equipamentoId:eq.id,setor:depNome(pick(row,['IT_COD_DEPARTAMENTO']))||txt(pick(row,['IT_LOCALIZACAO','IT_DEPARTAMENTO','LOCAL','SETOR']))||'Geral',localInstalacao:txt(pick(row,['IT_LOCALIZACAO','LOCALIZACAO','LOCAL'])),patrimonio:eq.patrimonio,status:statusParqueFromSituacao(pick(row,['IT_SITUACAO','SITUACAO']), pick(row,['IT_OCULTAR','OCULTAR'])),medidores:medidoresFromItemLocacao(row),modalidade:tipoMedidorFromCodigo(pick(row,['IT_TIPO','TIPO'])),franquiaPB:num(pick(row,['IT_PAGINAS','PAGINAS']),0),valorExcedentePB:num(pick(row,['IT_VALOR_PAGINAS_EXCEDENTE','IT_VALOR_PAGINAS']),0),dataInstalacao:pick(row,['IT_DATA_INSTALACAO','DATA_INSTALACAO'])||hoje(),ultimaVisita:pick(row,['IT_ULTIMA_VISITA'])||null};
    if(p) Object.assign(p,dados); else {p={id:uidSafe('prq'),criadoPor:'migracao',criadoPorNome:'Migração',criadoEm:new Date().toISOString(),...dados}; db.parque.push(p);}
    if(contrato&&eq){ if(!Array.isArray(contrato.equipamentos)) contrato.equipamentos=[]; if(!contrato.equipamentos.includes(eq.id)) contrato.equipamentos.push(eq.id); }
    eq.status=dados.status==='ativo'?'locado':(dados.status==='manutencao'?'manutencao':'disponivel');
    alterou++;
  });
  return alterou;
}

function visitaMotivo(row){ return txt(pick(row,['VI_MOTIVO','MOTIVO'])) || motivoNome(pick(row,['VI_COD_MOTIVO_DEFEITO'])) || 'Outros'; }
function visitaStatus(row){ const s=up(pick(row,['VI_SITUACAO','SITUACAO'])); if(s==='F'||s==='FINALIZADA'||s==='FINALIZADO') return 'concluido'; if(s==='A'||!s) return 'aberto'; return s.toLowerCase(); }
function garantirDespesaVisita(row, empId){
  db.despesasLocacao=db.despesasLocacao||[];
  const codVis=cod(pick(row,['COD_VISITA'])); if(!codVis) return null;
  const codDesp='VIS-'+codVis;
  let d=db.despesasLocacao.find(x=>x.empresaId===empId&&x.codigoAntigo===codDesp);
  const p=parquePorItem(pick(row,['VI_COD_ITENS_LOCACAO']), empId);
  const dados={empresaId:empId,codigoAntigo:codDesp,visitaCodigoAntigo:codVis,parqueId:p?p.id:null,contratoId:p?p.contratoId:null,clienteId:p?p.clienteId:null,data:pick(row,['DATA','VI_DATA_CADASTRO'])||hoje(),descricao:visitaMotivo(row),valorTotalCusto:num(pick(row,['VI_VALOR_CUSTO']),0),situacao:'Despesa lançada com sucesso'};
  if(d) Object.assign(d,dados); else {d={id:uidSafe('dpl'),criadoEm:new Date().toISOString(),...dados}; db.despesasLocacao.push(d);}
  return d;
}
function sincronizarDespesasLocacao(empId){
  db.despesasLocacao=db.despesasLocacao||[];
  db.locacaoEstoqueHistorico=db.locacaoEstoqueHistorico||[];
  let alterou=0;
  rowsLike(/^DESPESAS_LOCACAO$/i).forEach(row=>{
    const codDesp=cod(pick(row,['DP_COD_DESPESA','COD_DESPESA','CODIGO'])); if(!codDesp) return;
    let d=db.despesasLocacao.find(x=>x.empresaId===empId&&cod(x.codigoAntigo)===codDesp);
    let visita=rows('VISITAS').find(v=>cod(v.COD_VISITA)===cod(pick(row,['DP_COD_VISITA'])));
    const p=parquePorItem(pick(row,['DP_COD_ITENS_LOCACAO'])||pick(visita||{},['VI_COD_ITENS_LOCACAO']), empId);
    const desc=txt(pick(row,['DP_DESCRICAO']))||visitaMotivo(visita||{});
    const dados={empresaId:empId,codigoAntigo:codDesp,visitaCodigoAntigo:cod(pick(row,['DP_COD_VISITA'])),parqueId:p?p.id:null,contratoId:p?p.contratoId:null,clienteId:p?p.clienteId:null,data:pick(row,['DP_DATA'])||pick(visita||{},['DATA'])||hoje(),descricao:desc,valorTotalCusto:num(pick(row,['DP_VALOR_TOTAL_CUSTO'])||pick(visita||{},['VI_VALOR_CUSTO']),0),situacao:txt(pick(row,['DP_SITUACAO']))||'Despesa lançada com sucesso'};
    if(d) Object.assign(d,dados); else {d={id:uidSafe('dpl'),criadoEm:new Date().toISOString(),...dados}; db.despesasLocacao.push(d);}
    if(descricaoSuprimento(desc)){
      const codItemVenda=pick(row,['DP_COD_ITENS_VENDA']);
      const histId='DPL-'+codDesp;
      let h=db.locacaoEstoqueHistorico.find(x=>x.codigoAntigo===histId);
      const hd={codigoAntigo:histId,despesaId:d.id,contratoId:d.contratoId,parqueId:d.parqueId,itemVendaCodigoAntigo:cod(codItemVenda),qtde:num(pick(row,['DP_QTDE']),1)||1,tipo:1,impressoes:vidaUtilDoItemVenda(codItemVenda,empId)};
      if(h) Object.assign(h,hd); else db.locacaoEstoqueHistorico.push({id:uidSafe('leh'),...hd});
    }
    alterou++;
  });
  return alterou;
}
function sincronizarVisitasAvancado(empId){
  const visitas=rows('VISITAS'); if(!visitas.length) return 0;
  let alterou=0;
  visitas.forEach(row=>{
    const codVis=cod(pick(row,['COD_VISITA'])); if(!codVis) return;
    const p=parquePorItem(pick(row,['VI_COD_ITENS_LOCACAO']), empId);
    const contrato=contratoPorCodigo(pick(row,['COD_LOCACAO']), empId)||(p&&((db.contratos||[]).find(c=>c.id===p.contratoId)));
    const cli=clientePorCodigo(pick(row,['VI_COD_CLIENTE']), empId)||(p&&((db.clientes||[]).find(c=>c.id===p.clienteId)));
    const eq=garantirEquipamentoFromLocacao(row, empId);
    if(p){ p.ultimaVisita=pick(row,['DATA_FINALIZADO','VI_DATA_ATENDIMENTO','DATA'])||p.ultimaVisita; if(!p.equipamentoId&&eq) p.equipamentoId=eq.id; if(!p.clienteId&&cli) p.clienteId=cli.id; }
    garantirDespesaVisita(row, empId);
    let os=(db.os||[]).find(o=>o.empresaId===empId&&o.legadoCodigo==='VIS-'+codVis);
    const motivo=visitaMotivo(row);
    const status=visitaStatus(row);
    const dados={empresaId:empId,legadoCodigo:'VIS-'+codVis,numero:cod(pick(row,['VI_NUMERO']))||codVis,clienteId:cli?cli.id:null,contratoId:contrato?contrato.id:null,parqueId:p?p.id:null,equipamentoId:eq?eq.id:null,modelo:eq?eq.modelo:'',patrimonio:txt(pick(row,['VI_PATRIMONIO']))||(eq&&eq.patrimonio)||'',serie:txt(pick(row,['VI_SERIAL']))||(eq&&eq.serie)||'',local:p?(p.localInstalacao||p.setor):txt(pick(row,['VI_LOCALIZACAO'])),descricao:motivo+(txt(pick(row,['VI_DETALHES_MOTIVO']))?' - '+txt(pick(row,['VI_DETALHES_MOTIVO'])):''),servicos:txt(pick(row,['VI_SERVICOS_EXECUTADOS'])),observacao:txt(pick(row,['VI_OBS'])),prioridade:inteiro(pick(row,['PRIORIDADE']),0)>=3?'alta':'normal',status,dataAbertura:iso(pick(row,['DATA','VI_DATA_CADASTRO'])),dataFechamento:status==='concluido'?iso(pick(row,['DATA_FINALIZADO','VI_DATA_ATENDIMENTO'])||new Date()):null,contadorAtual:num(pick(row,['VI_CONTADOR_ATUAL']),0),contadorCorAtual:num(pick(row,['VI_CONTADOR_ATUAL_COLOR']),0),custoPecas:num(pick(row,['VI_VALOR_CUSTO']),0),valorExtra:num(pick(row,['VI_VALOR_EXTRA']),0),criadoPor:'migracao',criadoPorNome:'Migração'};
    if(os) Object.assign(os,dados); else {os={id:uidSafe('os'),criadoEm:new Date().toISOString(),...dados}; db.os.push(os);}
    if(contrato) contrato.situacaoChamados=(dados.servicos||status==='concluido')?'C':'A';
    if(Number(pick(row,['VI_GERAR_VENDA']))===1 && !vendaPorCodigo(pick(row,['VI_COD_VENDA']),empId)){
      const venda={id:uidSafe('vda'),empresaId:empId,numero:cod(pick(row,['VI_COD_VENDA']))||String((db.vendas||[]).length+1),clienteId:cli?cli.id:null,data:iso(pick(row,['DATA'])),itens:[{descricao:motivo,qtd:1,preco:num(pick(row,['VI_VALOR_CUSTO']),0)+num(pick(row,['VI_VALOR_EXTRA']),0),subtotal:num(pick(row,['VI_VALOR_CUSTO']),0)+num(pick(row,['VI_VALOR_EXTRA']),0)}],total:num(pick(row,['VI_VALOR_CUSTO']),0)+num(pick(row,['VI_VALOR_EXTRA']),0),status:'aguardar',origem:'visita_gerou_venda',osId:os.id,criadoPor:'migracao',criadoPorNome:'Migração',criadoEm:new Date().toISOString()};
      db.vendas.push(venda); os.vendaGeradaId=venda.id;
    }
    alterou++;
  });
  return alterou;
}
function aplicarAutomacoesLocacaoVisitas(empId){
  if(!db||!empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=[assinaturaTabela(['ITENS_LOCACAO','DESPESAS_LOCACAO','VISITAS','CARTUCHOS','ITENS_VENDA']), assinaturaArray('contratos',empId), assinaturaArray('parque',empId), assinaturaArray('equipamentos',empId)].join('|');
  if(db.config.automacoes.locacaoVisitasGeralAssinatura===sig) return 0;
  let total=0;
  total+=sincronizarItensLocacao(empId);
  total+=sincronizarDespesasLocacao(empId);
  total+=sincronizarVisitasAvancado(empId);
  db.config.automacoes.locacaoVisitasGeralAssinatura=sig;
  if(total || sig) salvar();
  return total;
}

window.AUTOMACOES_LOC_VISITAS_PURE={ descricaoSuprimento, tipoMedidorFromCodigo, medidoresFromItemLocacao, sincronizarItensLocacao, sincronizarDespesasLocacao, sincronizarVisitasAvancado, aplicarAutomacoesLocacaoVisitas };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s= sess(); if(s) aplicarAutomacoesLocacaoVisitas(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_locacao_visitas', run, 350); else setTimeout(run, 350); return ret; };
const oldRenderContratos=window.renderContratos;
window.renderContratos=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_locacao_visitas', run, 0); else run(); return oldRenderContratos?oldRenderContratos.apply(this,arguments):undefined; };
const oldRenderOs=window.renderOs;
window.renderOs=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_locacao_visitas', run, 0); else run(); return oldRenderOs?oldRenderOs.apply(this,arguments):undefined; };
if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_locacao_visitas', run, 1000); else setTimeout(run, 1000);
console.log('[DIGICOPY] automacoes_locacao_visitas_patch.js v4.9.23 carregado');
})();
