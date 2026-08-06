// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.19 — Vínculo por VISITAS/CONTADOR_PAGINAS
// • Usa VISITAS para ligar contrato sem cliente ao cliente correto
// • Usa VISITAS para criar/vincular impressoras quando ITENS_LOCACAO não veio
// • Remove duplicidade visual de listas de impressoras no contrato
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function t(v){ return String(v ?? '').trim(); }
function norm(v){ return t(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function n(v, fb=0){ const out=Number(String(v ?? '').replace(',','.')); return Number.isFinite(out)?out:fb; }
function i(v, fb=0){ const out=parseInt(String(v ?? '').replace(',','.'),10); return Number.isFinite(out)?out:fb; }
function cod(v){ const g=t(v).match(/\d+/g); if(!g||!g.length) return ''; const x=g[g.length-1].replace(/^0+/,''); return x||'0'; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function moduloRows(rx){ const out=[]; Object.entries((db&&db.modulosDinamicos)||{}).forEach(([nome,m])=>{ if(rx.test(nome)) out.push(...(((m||{}).dados)||[])); }); return out; }
function pick(row, arr){ for(const k of arr){ if(row && row[k]!==undefined && row[k]!==null && t(row[k])!=='') return row[k]; } return ''; }
function assinaturaLinhas(rx){ const r=moduloRows(rx); const last=r[r.length-1]||{}; return `${r.length}:${JSON.stringify(last).slice(0,80)}`; }
function assinaturaArray(nome, empId){ const a=Array.isArray(db[nome])?db[nome].filter(x=>!empId||!x.empresaId||x.empresaId===empId):[]; const last=a[a.length-1]||{}; return `${nome}:${a.length}:${JSON.stringify(last).slice(0,80)}`; }
function title(nome){ const s=t(nome); if(!s) return ''; return s.toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g,m=>m.toLowerCase()).replace(/\b(Jk|Me|Ltda|Eireli|Epp|Mei)\b/g,m=>m.toUpperCase()); }
function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId && (cod(x.codigo)===c || cod(x.codigoAntigo)===c || cod(x.idLegado)===c)) || null; }
function contratoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.contratos||[]).find(x=>x.empresaId===empId && (cod(x.codigoAntigo)===c || cod(x.numero)===c || cod(x.codigo)===c || cod(x.idLegado)===c)) || null; }
function equipamentoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.equipamentos||[]).find(e=>e.empresaId===empId && (cod(e.codigoAntigo)===c || cod(e.codigo)===c || cod(e.idLegado)===c)) || null; }
function equipamentoPorChave(chave, empId){ const k=norm(chave); if(!k) return null; return (db.equipamentos||[]).find(e=>e.empresaId===empId && (norm(e.patrimonio)===k || norm(e.serie)===k)) || null; }
function depNome(codDep){ const c=cod(codDep); if(!c) return ''; const row=moduloRows(/^DEPARTAMENTOS$/i).find(r=>cod(r.DEP_COD_DEPARTAMENTO)===c); return t(row&&row.DEP_DESCRICAO); }
function clienteNomeRaw(codigo){ const c=cod(codigo); if(!c) return ''; const row=moduloRows(/CLIENT|PESSOA|CADASTRO/i).find(r=>cod(pick(r,['COD_CLIENTE','CODIGO_CLIENTE','CODIGO','ID','CLIENTE_ID']))===c); return title(pick(row||{}, ['NOME','RAZAO_SOCIAL','RAZAOSOCIAL','NOME_FANTASIA','FANTASIA','CLIENTE','NOME_CLIENTE','DESCRICAO'])); }
function garantirCliente(codigo, empId, fallbackNome){
  const c=cod(codigo); if(!c) return null;
  let cli=clientePorCodigo(c, empId);
  if(cli) return cli;
  const nome=title(fallbackNome || clienteNomeRaw(c) || `Cliente ${c}`);
  cli={ id:uidSafe('cli'), empresaId:empId, codigo:c, codigoAntigo:c, nome, fantasia:nome, tipo:'PJ', status:'ativo', criadoPor:'migracao', criadoPorNome:'Migração', criadoEm:new Date().toISOString() };
  db.clientes.push(cli);
  return cli;
}
function garantirEquipamento(row, empId){
  const codEq=cod(pick(row,['VI_COD_EQUIPAMENTO','CP_COD_EQUIPAMENTO','COD_EQUIPAMENTO','EQUIPAMENTO']));
  const patrimonio=t(pick(row,['VI_PATRIMONIO','PATRIMONIO','PATR','TOMBAMENTO']));
  const serie=t(pick(row,['VI_SERIAL','SERIAL','SERIE','NUMERO_SERIE']));
  let e = equipamentoPorChave(patrimonio||serie, empId) || equipamentoPorCodigo(codEq, empId);
  if(e){
    if(codEq && !e.codigoAntigo) e.codigoAntigo=codEq;
    if(patrimonio && (!e.patrimonio || e.patrimonio===codEq)) e.patrimonio=patrimonio;
    if(serie && (!e.serie || e.serie===codEq)) e.serie=serie;
    return e;
  }
  const modelo=t(pick(row,['MODELO','DESCRICAO','EQUIPAMENTO','IMPRESSORA'])) || `Impressora ${patrimonio || serie || codEq || ''}`.trim();
  e={ id:uidSafe('eq'), empresaId:empId, codigoAntigo:codEq, modelo, tipo:'Laser', serie:serie||patrimonio||codEq||uidSafe('serie'), patrimonio:patrimonio||serie||codEq||uidSafe('pat'), contadorPB:i(pick(row,['VI_CONTADOR_ATUAL','CP_CONTADOR_ANTERIOR','CONTADOR','CONTADOR_PB']),0), contadorCor:i(pick(row,['VI_CONTADOR_ATUAL_COLOR','CONTADOR_COR']),0), status:'locado', criadoPor:'migracao', criadoPorNome:'Migração', criadoEm:new Date().toISOString() };
  db.equipamentos.push(e);
  return e;
}
function garantirParque(c, cli, eq, row, empId){
  if(!c || !cli || !eq) return null;
  const codItem=cod(pick(row,['VI_COD_ITENS_LOCACAO','COD_ITENS_LOCACAO','COD_CONTADOR']));
  let p=null;
  if(codItem) p=(db.parque||[]).find(x=>x.empresaId===empId && cod(x.codigoAntigo)===codItem);
  if(!p) p=(db.parque||[]).find(x=>x.empresaId===empId && x.contratoId===c.id && x.equipamentoId===eq.id);
  const setor=depNome(pick(row,['VI_COD_DEPARTAMENTO'])) || t(pick(row,['VI_LOCALIZACAO','VI_DEPARTAMENTO','CP_DEPARTAMENTO','DEPARTAMENTO','SETOR'])) || 'Geral';
  const dados={ empresaId:empId, codigoAntigo:codItem||undefined, contratoId:c.id, clienteId:cli.id, equipamentoId:eq.id, setor, localInstalacao:t(pick(row,['VI_LOCALIZACAO','LOCAL','LOCALIZACAO'])), patrimonio:eq.patrimonio, status:'ativo', modalidade:/IMPRESS/i.test(t(pick(row,['CP_MODALIDADE'])))?'impressao':'global', franquiaPB:i(pick(row,['CP_FRANQUIA','FRANQUIA']), n(c.franquiaPB,0)), valorExcedentePB:n(pick(row,['CP_VALOR_PAGINAS_EXCEDENTE','CP_VALOR_PAGINAS','VALOR_PAGINA']), n(c.valorExcedentePB,0)), atualizadoEm:new Date().toISOString() };
  dados.medidores={ pretoA4:{key:'pretoA4',label:'Preto A4',modalidade:dados.modalidade,contadorAnterior:i(pick(row,['CP_CONTADOR_ANTERIOR','VI_CONTADOR_ATUAL']),0),franquia:dados.franquiaPB,valor:dados.valorExcedentePB,ativo:true} };
  if(p) Object.assign(p,dados);
  else { p={ id:uidSafe('prq'), criadoPor:'migracao', criadoPorNome:'Migração', criadoEm:new Date().toISOString(), dataInstalacao:new Date().toISOString(), ...dados }; db.parque.push(p); }
  if(!Array.isArray(c.equipamentos)) c.equipamentos=[];
  if(!c.equipamentos.includes(eq.id)) c.equipamentos.push(eq.id);
  return p;
}
function vincularPorVisitas(empId){
  if(window.DIGI_MODO_LEVE) return 0;
  if(!db || !empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=[assinaturaLinhas(/^VISITAS$/i), assinaturaLinhas(/^CONTADOR_PAGINAS$/i), assinaturaArray('contratos',empId), assinaturaArray('parque',empId), assinaturaArray('equipamentos',empId)].join('|');
  if(db.config.automacoes.contratosVisitasVinculoAssinatura===sig) return 0;
  let mudou=0;
  const visitas=moduloRows(/^VISITAS$/i);
  visitas.forEach(row=>{
    const c=contratoPorCodigo(pick(row,['COD_LOCACAO']), empId);
    if(!c) return;
    const codCli=pick(row,['VI_COD_CLIENTE','COD_CLIENTE']);
    const cli=garantirCliente(codCli || c.codClienteAntigo, empId, '');
    if(cli && c.clienteId!==cli.id){ c.clienteId=cli.id; c.codClienteAntigo=cod(codCli||c.codClienteAntigo); mudou++; }
    const hasEq=pick(row,['VI_COD_EQUIPAMENTO','VI_PATRIMONIO','VI_SERIAL']);
    if(hasEq){ const e=garantirEquipamento(row, empId); if(garantirParque(c, cli, e, row, empId)) mudou++; }
  });
  // Contadores podem ter equipamentos que nunca tiveram visita detalhada; usa parque existente pelo item.
  const contadores=moduloRows(/^CONTADOR_PAGINAS$/i);
  contadores.forEach(row=>{
    const codItem=cod(pick(row,['COD_ITENS_LOCACAO'])); if(!codItem) return;
    let p=(db.parque||[]).find(x=>x.empresaId===empId && cod(x.codigoAntigo)===codItem);
    if(!p) return;
    const c=(db.contratos||[]).find(x=>x.id===p.contratoId); if(!c) return;
    const cli=(db.clientes||[]).find(x=>x.id===p.clienteId) || (c.clienteId && (db.clientes||[]).find(x=>x.id===c.clienteId));
    const e=garantirEquipamento(row, empId);
    if(e && !p.equipamentoId){ p.equipamentoId=e.id; mudou++; }
    p.franquiaPB=i(pick(row,['CP_FRANQUIA']), p.franquiaPB||0);
    p.valorExcedentePB=n(pick(row,['CP_VALOR_PAGINAS_EXCEDENTE','CP_VALOR_PAGINAS']), p.valorExcedentePB||0);
    p.setor=t(p.CP_DEPARTAMENTO||p.setor||pick(row,['CP_DEPARTAMENTO'])) || p.setor || 'Geral';
    if(cli && !p.clienteId) p.clienteId=cli.id;
  });
  db.config.automacoes.contratosVisitasVinculoAssinatura=sig;
  if(mudou || sig) salvar();
  return mudou;
}

window.CONTRATOS_VISITAS_PURE={ cod, vincularPorVisitas };

if(typeof window==='undefined' || typeof document==='undefined') return;
function run(){ const s=sess(); if(s) vincularPorVisitas(s.empresaId); }
const oldRender=window.renderContratos;
window.renderContratos=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('contratos_visitas_vinculo', run, 0); else run(); return oldRender?oldRender.apply(this,arguments):undefined; };
const oldOpen=window.openContratoCompleto;
window.openContratoCompleto=function(id){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('contratos_visitas_vinculo', run, 0); else run(); return oldOpen?oldOpen.apply(this,arguments):undefined; };
if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('contratos_visitas_vinculo', run, 600); else setTimeout(run, 600);
console.log('[DIGICOPY] contratos_visitas_vinculo_patch.js v4.9.19 carregado');
})();
