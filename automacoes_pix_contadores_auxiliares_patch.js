// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.28 — Automações de Pix, contadores, contas e auxiliares
// • Continuação da adaptação das triggers úteis do banco anterior
// • Pix antigo vira histórico consultável, sem baixa automática
// • Contadores capturados viram histórico, atualizam contador da impressora e geram alertas
// • Contas/bancos, e-mails, gastos de produto, créditos, cupons e auxiliares ficam preservados
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
function rowsAny(nomes){ for(const n of nomes){ const r=rows(n); if(r.length) return r; } return []; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }
function agora(){ return new Date().toISOString(); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function assinaturaTabela(nomes){ return nomes.map(nome=>{ const r=rows(nome); const last=r[r.length-1]||{}; return `${nome}:${r.length}:${JSON.stringify(last).slice(0,80)}`; }).join('|'); }
function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId&&(cod(x.codigo)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function clientePorEmail(email, empId){ const e=txt(email).toLowerCase(); if(!e) return null; return (db.clientes||[]).find(c=>c.empresaId===empId&&(txt(c.email).toLowerCase()===e||txt(c.email2).toLowerCase()===e))||null; }
function vendaPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.vendas||[]).find(v=>v.empresaId===empId&&(cod(v.numero)===c||cod(v.codigoAntigo)===c||cod(v.idLegado)===c))||null; }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p=>p.empresaId===empId&&(cod(p.sku)===c||cod(p.codigo)===c||cod(p.codigoAntigo)===c||cod(p.idLegado)===c))||null; }
function equipamentoPorSerial(serial, empId){ const s=up(serial); if(!s) return null; return (db.equipamentos||[]).find(e=>e.empresaId===empId&&(up(e.serie)===s||up(e.patrimonio)===s)); }
function parquePorItem(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.parque||[]).find(p=>p.empresaId===empId&&cod(p.codigoAntigo)===c)||null; }
function lower(v){ return txt(v).toLowerCase(); }

function pixStatus(row){
  if(pick(row,['PIX_DATA_CANCELADO'])) return {codigo:4, situacao:'Cancelado', cancelado:true};
  if(pick(row,['PIX_DATA_ESTORNADO'])) return {codigo:7, situacao:'Estornado', estornado:true};
  if(pick(row,['PIX_DATA_PAGAMENTO'])) return {codigo:5, situacao:'Pago', pago:true};
  return {codigo:1, situacao:'Aguardando', aberto:true};
}
function sincronizarPixMigrado(empId){
  const pixRows=rows('PIX');
  if(!pixRows.length) return 0;
  db.pixMigrados=db.pixMigrados||[];
  db.pixHistoricoMigrado=db.pixHistoricoMigrado||[];
  let alterou=0;
  pixRows.forEach(r=>{
    const codigo=cod(pick(r,['PIX_CODIGO'])); if(!codigo) return;
    const st=pixStatus(r);
    const venda=vendaPorCodigo(pick(r,['PIX_COD_VENDA']), empId);
    const cliente=clientePorCodigo(pick(r,['PIX_COD_CLIENTE']), empId) || (venda&&venda.clienteId?(db.clientes||[]).find(c=>c.id===venda.clienteId):null);
    let p=db.pixMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,vendaId:venda?venda.id:null,clienteId:cliente?cliente.id:null,valor:num(pick(r,['PIX_VALOR','VALOR','PIX_VALOR_TOTAL']),0),status:st.situacao,statusCodigo:st.codigo,dataCadastro:pick(r,['PIX_DATA_CADASTRO'])||agora(),dataAtualizacao:pick(r,['PIX_DATA_ATUALIZACAO'])||agora(),dataVencimento:pick(r,['PIX_DATA_VENCIMENTO'])||'',dataPagamento:pick(r,['PIX_DATA_PAGAMENTO'])||null,dataCancelado:pick(r,['PIX_DATA_CANCELADO'])||null,dataEstornado:pick(r,['PIX_DATA_ESTORNADO'])||null,contaCodigoAntigo:cod(pick(r,['PIX_COD_CONTA'])),somenteHistorico:true,baixaAutomatica:false};
    if(p) Object.assign(p,dados); else db.pixMigrados.push({id:uidSafe('pix'),...dados});
    const hkey=codigo+'-'+st.codigo;
    if(!db.pixHistoricoMigrado.find(h=>h.key===hkey)) db.pixHistoricoMigrado.push({id:uidSafe('pih'),key:hkey,pixCodigoAntigo:codigo,statusCodigo:st.codigo,status:st.situacao,data:agora()});
    // Regra atual do ERP: pagamento Pix NÃO baixa automaticamente. Cancelado/estornado apenas marca o financeiro se já estiver vinculado.
    if(st.cancelado||st.estornado){
      (db.contasReceber||[]).forEach(cr=>{
        if(cod(cr.pixCodigoAntigo)===codigo || (cr.pixId && p && cr.pixId===p.id)){
          cr.status=st.estornado?'estornado':'cancelado';
          cr.pagamentoData=null;
          cr.autoBaixa=false;
          alterou++;
        }
      });
      if(venda){ venda.pagamentoStatus=st.situacao.toLowerCase(); alterou++; }
    }
    alterou++;
  });
  return alterou;
}

function bancoCodigo(boletoBanco){
  const map={cobGerenciaNet:'000',cobAcqio:'002',cobCora:'403',cobBancoDoBrasil:'001',cobBancoDoNordeste:'004',cobBanestes:'021',cobSantander:'033',cobBanrisul:'041',cobBRB:'070',cobBancoInter:'077',cobBancoCECRED:'085',cobUniprime:'099',cobCaixaEconomica:'104',cobUnicredSC:'136',cobBradesco:'237',cobBicBanco:'320',cobItau:'341',cobBancoMercantil:'389',cobHSBC:'399',cobBancoSafra:'422',cobSicred:'748',cobBancoob:'756',cobUniprimeNortePR:'099',cobBancoC6:'336'};
  return map[txt(boletoBanco)] || '';
}
function sincronizarContasBancarias(empId){
  const raw=rows('CONTAS'); if(!raw.length) return 0;
  db.contasBancariasMigradas=db.contasBancariasMigradas||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['CON_COD_CONTA'])); if(!codigo) return;
    let c=db.contasBancariasMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const banco=pick(r,['BOLETO_BANCO']);
    const dados={empresaId:empId,codigoAntigo:codigo,descricao:pick(r,['CON_DESCRICAO_CONTA'])||banco||'Conta',saldo:num(pick(r,['CON_SALDO']),0),agencia:txt(pick(r,['CON_AGENCIA']))||'0',numero:txt(pick(r,['CON_NUMERO']))||'0',digitoAgencia:txt(pick(r,['CON_DIGITO_AGENCIA']))||'0',digitoConta:txt(pick(r,['CON_DIGITO_CONTA']))||'0',ocultar:pick(r,['CON_OCULTAR'])||'N',contaBancaria:pick(r,['CON_CONTA_BANCARIA'])||'N',recPix:Number(pick(r,['CON_REC_PIX']))===1,recCartao:pick(r,['CON_REC_CARTAO'])==='S',recBoleto:pick(r,['CON_REC_BOLETO'])==='S',banco,bancoCodigo:bancoCodigo(banco),pixChave:pick(r,['PIX_CHAVE']),pixCusto:num(pick(r,['PIX_CUSTO']),0),boletoCusto:num(pick(r,['BOLETO_CUSTO']),0),somenteHistorico:true};
    if(c) Object.assign(c,dados); else db.contasBancariasMigradas.push({id:uidSafe('conta'),...dados});
    alterou++;
  });
  return alterou;
}

function contadorRows(){ return rowsAny(['CONTADOR','CONTADORES']); }
function serialRow(r){ return pick(r,['CON_SERIAL','CON_SERIE','SERIAL']); }
function geralRow(r){ return num(pick(r,['CON_GERAL','CON_CONTADOR_GERAL','CON_CONTADORPRETOA4','CON_MONO_GERAL']),0); }
function dataRow(r){ return pick(r,['CON_DATA_CADASTRO','CON_DATA','DATA'])||hoje(); }
function compararAlerta(valor, condicao, gatilho){
  const v=num(valor,0); const g=num(gatilho,0);
  if(!v && v!==0) return false;
  if(condicao===0) return v>g;
  if(condicao===1) return v===g;
  if(condicao===2) return v<g;
  if(condicao===4) return v!==g;
  return String(valor).toLowerCase().includes(String(gatilho).toLowerCase());
}
function gerarAlertasContador(row, hist){
  const alerts=[];
  const status=lower(pick(row,['CON_STATUS']));
  const configs=rows('CONTADOR_ALERTAS_CONFIG');
  if(configs.length){
    configs.forEach(c=>{
      const tipo=inteiro(c.CAC_TIPO_ALERTA,0);
      const cond=inteiro(c.CAC_CONDICAO,1);
      const gat=c.CAC_GATILHO;
      let campo=null, nome='';
      if(tipo===0){ campo=status; nome='status'; }
      if(tipo===1){ campo=pick(row,['CON_NIVEL_MONO']); nome='nível toner'; }
      if(tipo===2){ campo=pick(row,['CON_NIVEL_DRUM']); nome='nível drum'; }
      if(tipo===3){ campo=pick(row,['CON_NIVEL_FUSOR']); nome='nível fusor'; }
      if(tipo===4){ campo=pick(row,['CON_NIVEL_ROLO']); nome='nível rolo'; }
      if(tipo===5){ campo=pick(row,['CON_NIVEL_WASTE']); nome='nível waste'; }
      if(campo!=null && compararAlerta(campo, cond, gat)) alerts.push({configCodigoAntigo:cod(c.CAC_CODIGO),tipo:nome,status:`${nome} ${campo}`.trim(),detalhes:status});
    });
  } else {
    [['CON_NIVEL_MONO','toner'],['CON_NIVEL_DRUM','drum'],['CON_NIVEL_FUSOR','fusor'],['CON_NIVEL_ROLO','rolo'],['CON_NIVEL_WASTE','waste']].forEach(([campo,nome])=>{
      const v=num(pick(row,[campo]),0);
      if(v>0 && v<=15) alerts.push({tipo:nome,status:`nível ${nome} ${v}%`,detalhes:status});
    });
    if(status && /(erro|error|atol|paper|jam|toner|offline|porta|door|sem papel)/i.test(status)) alerts.push({tipo:'status',status,detalhes:status});
  }
  return alerts.map(a=>Object.assign(a,{contadorId:hist.id,serial:hist.serial,clienteId:hist.clienteId,modelo:hist.modelo,data:hist.data}));
}
function sincronizarContadores(empId){
  const raw=contadorRows(); if(!raw.length) return 0;
  db.contadoresMigrados=db.contadoresMigrados||[];
  db.contadorAlertasMigrados=db.contadorAlertasMigrados||[];
  let alterou=0;
  raw.sort((a,b)=>new Date(dataRow(a))-new Date(dataRow(b))).forEach(r=>{
    const codigo=cod(pick(r,['CON_CODIGO']));
    const serial=serialRow(r); if(!serial) return;
    const eq=(db.equipamentos||[]).find(e=>e.empresaId===empId&&(up(e.serie)===up(serial)||up(e.patrimonio)===up(serial)));
    const parque=eq?(db.parque||[]).find(p=>p.empresaId===empId&&p.equipamentoId===eq.id):null;
    const anteriores=db.contadoresMigrados.filter(c=>c.serial===serial).sort((a,b)=>new Date(b.data)-new Date(a.data));
    const ant=anteriores[0]?num(anteriores[0].contadorGeral,0):0;
    const atual=geralRow(r);
    const totalDia=atual>=ant?atual-ant:0;
    let h=db.contadoresMigrados.find(x=>x.codigoAntigo===codigo&&x.serial===serial);
    const dados={empresaId:empId,codigoAntigo:codigo,serial,modelo:pick(r,['CON_MODELO','CON_MODELO_IMPRESSORA'])||(eq&&eq.modelo)||'',equipamentoId:eq?eq.id:null,parqueId:parque?parque.id:null,clienteId:(parque&&parque.clienteId)||null,contratoId:(parque&&parque.contratoId)||null,data:dataRow(r),contadorGeral:atual,totalImpressaoDia:totalDia,mono:num(pick(r,['CON_MONO_GERAL','CON_CONTADORPRETOA4']),atual),nivelMono:num(pick(r,['CON_NIVEL_MONO']),0),nivelYellow:num(pick(r,['CON_NIVEL_YELLOW']),0),nivelCiano:num(pick(r,['CON_NIVEL_CIANO']),0),nivelMagenta:num(pick(r,['CON_NIVEL_MAGENTA']),0),nivelDrum:num(pick(r,['CON_NIVEL_DRUM']),0),nivelFusor:num(pick(r,['CON_NIVEL_FUSOR']),0),nivelRolo:num(pick(r,['CON_NIVEL_ROLO']),0),nivelWaste:num(pick(r,['CON_NIVEL_WASTE']),0),status:lower(pick(r,['CON_STATUS'])),nomeEmpresa:pick(r,['CON_NOME_EMPRESA'])};
    if(h) Object.assign(h,dados); else {h={id:uidSafe('cnt'),...dados}; db.contadoresMigrados.push(h);}
    if(eq && atual>num(eq.contadorPB,0)) eq.contadorPB=atual;
    gerarAlertasContador(r,h).forEach(a=>{
      const key=[a.serial,a.tipo,a.status].join('|');
      if(!db.contadorAlertasMigrados.find(x=>x.key===key)) db.contadorAlertasMigrados.push({id:uidSafe('coa'),key,...a});
    });
    alterou++;
  });
  return alterou;
}

function sincronizarEmailsLinksCreditos(empId){
  let alterou=0;
  db.emailsMigrados=db.emailsMigrados||[];
  rows('EMAIL').forEach(r=>{
    const codigo=cod(r.EMAIL_CODIGO); if(!codigo) return;
    const email=lower(r.EMAIL_DESCRICAO||'');
    const cli=clientePorCodigo(r.EMAIL_COD_CLIENTE,empId)||clientePorEmail(email,empId);
    let e=db.emailsMigrados.find(x=>x.codigoAntigo===codigo&&x.empresaId===empId);
    const dados={empresaId:empId,codigoAntigo:codigo,email,clienteId:cli?cli.id:null,contato:txt(r.EMAIL_CONTATO)||'CONTATO',telefone:txt(r.EMAIL_TELEFONE),origem:txt(r.EMAIL_ORIGEM)||'Importado',data:r.EMAIL_DATA||agora()};
    if(e) Object.assign(e,dados); else db.emailsMigrados.push({id:uidSafe('eml'),...dados}); alterou++;
  });
  const simples=[['LINKS','linksMigrados','LIN_CODIGO'],['CREDITOS','creditosMigrados','CRE_CODIGO'],['CREDITOS_TRANSFERENCIA','creditosTransferenciaMigrados','CRT_CODIGO'],['CUPONS','cuponsMigrados','CUP_CODIGO'],['HORARIO_ATENDIMENTO','horarioAtendimentoMigrado','HA_CODIGO'],['CATEGORIA_SUB','categoriaSubMigrada','CAS_CODIGO'],['PRODUTOS_PESQUISAS_ERRO','produtosPesquisasErroMigradas','PRP_CODIGO'],['MANIFESTACAO_DFE','manifestacaoDfeMigrada','COD_MANIFESTACAO']];
  simples.forEach(([tabela,prop,campo])=>{
    const rws=rows(tabela); if(!rws.length) return;
    db[prop]=db[prop]||[];
    rws.forEach(r=>{ const codigo=cod(r[campo]); if(!codigo) return; let x=db[prop].find(y=>y.codigoAntigo===codigo&&(!y.empresaId||y.empresaId===empId)); const dados={empresaId:empId,codigoAntigo:codigo,data:pick(r,[campo.replace('CODIGO','DATA'),campo.replace('COD_','DATA_'),'DATA'])||agora(),descricao:pick(r,['DESCRICAO','NOME','OBS','LIN_DESCRICAO','CUP_DESCRICAO'])}; if(x) Object.assign(x,dados); else db[prop].push({id:uidSafe('aux'),...dados}); alterou++; });
  });
  return alterou;
}

function aplicarAutomacoesPixContadoresAux(empId){
  if(!db||!empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=assinaturaTabela(['PIX','CONTADOR','CONTADORES','CONTADOR_ALERTAS_CONFIG','CONTAS','EMAIL','LINKS','CREDITOS','CREDITOS_TRANSFERENCIA','CUPONS','SHOP_ACESSOS','SHOP_TOKEN','NFSE','HORARIO_ATENDIMENTO','CATEGORIA_SUB','PRODUTOS_PESQUISAS_ERRO','MANIFESTACAO_DFE']);
  if(db.config.automacoes.pixContadoresAuxAssinatura===sig) return 0;
  let total=0;
  total+=sincronizarPixMigrado(empId);
  total+=sincronizarContasBancarias(empId);
  total+=sincronizarContadores(empId);
  total+=sincronizarEmailsLinksCreditos(empId);
  db.config.automacoes.pixContadoresAuxAssinatura=sig;
  if(total) salvar();
  return total;
}

window.AUTOMACOES_PIX_CONTADORES_AUX_PURE={ pixStatus, bancoCodigo, compararAlerta, gerarAlertasContador, sincronizarPixMigrado, sincronizarContasBancarias, sincronizarContadores, sincronizarEmailsLinksCreditos, aplicarAutomacoesPixContadoresAux };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s=sess(); if(s) aplicarAutomacoesPixContadoresAux(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; setTimeout(run,900); return ret; };
const oldRenderConfig=window.renderConfig;
window.renderConfig=function(){ run(); return oldRenderConfig?oldRenderConfig.apply(this,arguments):undefined; };
const oldRenderFinanceiro=window.renderFinanceiro;
window.renderFinanceiro=function(){ run(); return oldRenderFinanceiro?oldRenderFinanceiro.apply(this,arguments):undefined; };
const oldRenderEquip=window.renderEquipamentos;
window.renderEquipamentos=function(){ run(); return oldRenderEquip?oldRenderEquip.apply(this,arguments):undefined; };
setTimeout(run,1800);
console.log('[DIGICOPY] automacoes_pix_contadores_auxiliares_patch.js v4.9.28 carregado');
})();
