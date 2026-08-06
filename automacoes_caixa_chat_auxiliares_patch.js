// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.31 — Automações de caixa, chat, fornecedores e auxiliares
// • Continuação da adaptação das triggers úteis do banco anterior — Parte 11
// • Retiradas de caixa geram histórico financeiro seguro sem apagar dados em massa
// • Chat antigo vira chamado leve vinculado ao cliente/visita quando possível
// • Fornecedores, transportadores, departamentos, recibos, anexos e auxiliares ficam preservados
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function up(v){ return semAcento(v).toUpperCase(); }
function num(v, fb=0){ const out=Number(String(v ?? '').replace(',', '.')); return Number.isFinite(out)?out:fb; }
function inteiro(v, fb=0){ const out=parseInt(String(v ?? ''),10); return Number.isFinite(out)?out:fb; }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function agora(){ return new Date().toISOString(); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }
function assinaturaTabela(nomes){ return nomes.map(nome=>{ const r=rows(nome); const last=r[r.length-1]||{}; return `${nome}:${r.length}:${JSON.stringify(last).slice(0,90)}`; }).join('|'); }
function limparDescricao(v){ return up(v).replace(/["\\]/g,'').replace(/\+$/,'').replace(/\s+/g,' ').trim(); }
function title(v){ const s=txt(v); if(!s) return ''; return s.toLowerCase().replace(/\b\p{L}/gu,c=>c.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g,m=>m.toLowerCase()); }

function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId&&(cod(x.codigo)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function clientePadrao(empId){ return (db.clientes||[]).find(c=>c.empresaId===empId)||null; }
function osPorVisita(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.os||[]).find(o=>o.empresaId===empId&&(o.legadoCodigo==='VIS-'+c||cod(o.visitaCodigoAntigo)===c||cod(o.numero)===c))||null; }
function visitaRaw(codigo){ const c=cod(codigo); if(!c) return null; return rows('VISITAS').find(v=>cod(pick(v,['COD_VISITA']))===c)||null; }
function clienteDaVisita(codigo, empId){ const v=visitaRaw(codigo); return v?clientePorCodigo(pick(v,['VI_COD_CLIENTE']), empId):null; }
function dataISO(v){ if(!txt(v)) return agora(); const d=new Date(v); return Number.isNaN(d.getTime())?txt(v):d.toISOString(); }

function garantirCategoriaFechamento(empId){
  db.categoriasContasPagarMigradas=db.categoriasContasPagarMigradas||[];
  let c=db.categoriasContasPagarMigradas.find(x=>x.empresaId===empId&&up(x.descricao)==='FECHAMENTO');
  if(!c){ c={id:uidSafe('ccp'),empresaId:empId,codigoAntigo:String(db.categoriasContasPagarMigradas.length+1),descricao:'FECHAMENTO',origem:'retirada_caixa'}; db.categoriasContasPagarMigradas.push(c); }
  return c;
}
function sincronizarRetiradasCaixa(empId){
  const raw=rows('RETIRADA_CAIXA'); if(!raw.length) return 0;
  db.retiradasCaixaMigradas=db.retiradasCaixaMigradas||[];
  db.movimentacaoRetiradaCaixaMigrada=db.movimentacaoRetiradaCaixaMigrada||[];
  db.contasReceber=db.contasReceber||[];
  db.contasPagar=db.contasPagar||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['COD_RETIRADA','RC_CODIGO','CODIGO'])); if(!codigo) return;
    const tipo=up(pick(r,['TIPO','RC_TIPO']))==='S'?'S':'E';
    const cat=garantirCategoriaFechamento(empId);
    let ret=db.retiradasCaixaMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const data=pick(r,['DATA','RC_DATA'])||hoje();
    const valor=num(pick(r,['VALOR','RC_VALOR']),0);
    const desc=txt(pick(r,['DESCRICAO','RC_DESCRICAO','OBS']))||'Retirada de caixa';
    const dados={empresaId:empId,codigoAntigo:codigo,tipo,data:dataISO(data),valor,descricao:desc,codCaixa:cod(pick(r,['COD_CAIXA'])),codFuncionario:cod(pick(r,['COD_FUNCIONARIO'])),categoriaContasPagarId:cat.id,categoriaCodigoAntigo:cod(pick(r,['COD_CAT_CONTAS_PAGAR']))||cat.codigoAntigo,somenteHistorico:true};
    if(ret) Object.assign(ret,dados); else {ret={id:uidSafe('ret'),...dados}; db.retiradasCaixaMigradas.push(ret);}
    const movKey='RET-'+codigo;
    let mov=db.movimentacaoRetiradaCaixaMigrada.find(x=>x.key===movKey);
    const movDados={empresaId:empId,key:movKey,retiradaId:ret.id,retiradaCodigoAntigo:codigo,tipo,entrada:tipo==='E'?valor:0,saida:tipo==='S'?valor:0,data:dataISO(data),descricao:desc,caixaCodigoAntigo:dados.codCaixa};
    if(mov) Object.assign(mov,movDados); else db.movimentacaoRetiradaCaixaMigrada.push({id:uidSafe('mrc'),...movDados});
    if(tipo==='E'){
      const key='RET-E-'+codigo;
      let cr=db.contasReceber.find(x=>x.empresaId===empId&&x.origem==='retirada_caixa'&&x.legadoCodigo===key);
      const crDados={empresaId:empId,origem:'retirada_caixa',legadoCodigo:key,retiradaCaixaId:ret.id,retiradaCodigoAntigo:codigo,descricao:desc,valor,vencimento:dataISO(data),pagamentoData:dataISO(data),status:'pago',formaPagamento:'Dinheiro',tipo:'ENTRADA',criadoPor:'migracao',criadoPorNome:'Migração'};
      if(cr) Object.assign(cr,crDados); else db.contasReceber.push({id:uidSafe('cr'),...crDados});
    } else {
      const key='RET-S-'+codigo;
      let cp=db.contasPagar.find(x=>x.empresaId===empId&&x.origem==='retirada_caixa'&&x.legadoCodigo===key);
      const cpDados={empresaId:empId,origem:'retirada_caixa',legadoCodigo:key,retiradaCaixaId:ret.id,retiradaCodigoAntigo:codigo,fornecedor:'Fornecedor não identificado',descricao:'RETIRADA DO CAIXA - '+desc,categoria:'FECHAMENTO',valor,vencimento:dataISO(data),pagamentoData:dataISO(data),status:'pago',formaPagamento:'Dinheiro',parcela:'1/1',tipo:'V',criadoPor:'migracao',criadoPorNome:'Migração'};
      if(cp) Object.assign(cp,cpDados); else db.contasPagar.push({id:uidSafe('cp'),...cpDados});
    }
    alterou++;
  });
  return alterou;
}

function garantirCidadeMigrada(nome, uf){
  const n=up(nome); const u=up(uf); if(!n) return null;
  db.cidadesMigradas=db.cidadesMigradas||[];
  let c=db.cidadesMigradas.find(x=>up(x.nome||x.NOME_CIDADE)===n&&up(x.uf||x.UF)===u);
  if(!c){ c={id:uidSafe('cid'),codigoAntigo:String(db.cidadesMigradas.length+1),nome:n,uf:u,codUfIbge:null,origem:'auxiliar_parte11'}; db.cidadesMigradas.push(c); }
  return c;
}
function sincronizarFornecedoresTransportadores(empId){
  let alterou=0;
  const fornecedores=rows('FORNECEDORES');
  if(fornecedores.length){
    db.fornecedoresMigrados=db.fornecedoresMigrados||[];
    fornecedores.forEach(r=>{
      const codigo=cod(pick(r,['COD_FORNECEDOR','FOR_CODIGO','CODIGO'])); if(!codigo) return;
      const cidade=up(pick(r,['CIDADE','FOR_CIDADE']))||'CIDADE';
      const uf=up(pick(r,['UF','FOR_UF']))||'UF';
      const cid=!['CIDADE','UF'].includes(cidade)?garantirCidadeMigrada(cidade,uf):null;
      let f=db.fornecedoresMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,nome:txt(pick(r,['NOME_RAZAOSOCIAL','RAZAO_SOCIAL','NOME']))||txt(pick(r,['NOME_FANTASIA']))||'Fornecedor '+codigo,fantasia:txt(pick(r,['NOME_FANTASIA','FANTASIA']))||'NOME FANTASIA',documento:txt(pick(r,['CPF_CNPJ','CNPJ','DOCUMENTO'])),endereco:txt(pick(r,['ENDERECO','RUA']))||'ENDERECO',bairro:txt(pick(r,['BAIRRO']))||'BAIRRO',cidade,uf,numero:txt(pick(r,['NUMERO']))||'NUMERO',telefone:txt(pick(r,['TELEFONE','FONE'])),email:txt(pick(r,['EMAIL'])).toLowerCase(),codCidade:cid?cid.codigoAntigo:cod(pick(r,['COD_CIDADE'])),somenteHistorico:true};
      if(f) Object.assign(f,dados); else db.fornecedoresMigrados.push({id:uidSafe('for'),...dados});
      alterou++;
    });
  }
  const transportadores=rows('TRANSPORTADORES');
  if(transportadores.length){
    db.transportadoresMigrados=db.transportadoresMigrados||[];
    transportadores.forEach(r=>{
      const codigo=cod(pick(r,['COD_TRANSPORTADOR','TRANS_CODIGO','CODIGO'])); if(!codigo) return;
      const cidade=up(pick(r,['TRANS_CIDADE','CIDADE'])); const uf=up(pick(r,['TRANS_UF','UF']));
      const cid=!cod(pick(r,['COD_CIDADE']))&&cidade&&uf?garantirCidadeMigrada(cidade,uf):null;
      let t=db.transportadoresMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,nome:txt(pick(r,['TRANS_NOME','NOME','NOME_RAZAOSOCIAL'])),cidade,uf,codCidade:cod(pick(r,['COD_CIDADE']))||(cid?cid.codigoAntigo:''),documento:txt(pick(r,['TRANS_CNPJ','CNPJ','CPF_CNPJ'])),somenteHistorico:true};
      if(t) Object.assign(t,dados); else db.transportadoresMigrados.push({id:uidSafe('tra'),...dados});
      alterou++;
    });
  }
  return alterou;
}

function garantirMotivoChat(empId){
  db.motivosDefeitoMigrados=db.motivosDefeitoMigrados||[];
  let m=db.motivosDefeitoMigrados.find(x=>x.empresaId===empId&&up(x.descricao)==='CHAT');
  if(!m){ m={id:uidSafe('mdf'),empresaId:empId,codigoAntigo:String(db.motivosDefeitoMigrados.length+1),descricao:'CHAT',tipo:1,del:0,origem:'chat'}; db.motivosDefeitoMigrados.push(m); }
  return m;
}
function chamadoChatAberto(clienteId, empId){ return (db.os||[]).find(o=>o.empresaId===empId&&o.clienteId===clienteId&&o.origem==='chat_migrado'&&o.status!=='concluido'); }
function garantirChamadoChat(row, empId, cliente){
  db.os=db.os||[];
  const codVis=cod(pick(row,['CH_COD_VISITA','COD_VISITA']));
  if(codVis){
    const os=osPorVisita(codVis,empId); if(os) return os;
  }
  const motivo=garantirMotivoChat(empId);
  let os=cliente?chamadoChatAberto(cliente.id,empId):null;
  if(!os){
    const numero=codVis||String((db.os||[]).filter(o=>o.empresaId===empId).length+1);
    os={id:uidSafe('os'),empresaId:empId,legadoCodigo:codVis?'VIS-'+codVis:'CHAT-'+(cliente?cod(cliente.codigoAntigo||cliente.codigo):numero),numero,clienteId:cliente?cliente.id:null,status:'aberto',problema:'CHAT',descricao:txt(pick(row,['CH_MENSAGEM','MENSAGEM']))||'Atendimento via chat',prioridade:'normal',origem:'chat_migrado',motivoDefeitoCodigoAntigo:motivo.codigoAntigo,dataAbertura:dataISO(pick(row,['CH_DATA_ENVIO','DATA_ENVIO','DATA'])),criadoPor:'migracao',criadoPorNome:'Migração',criadoEm:agora()};
    db.os.push(os);
  }
  return os;
}
function sincronizarChat(empId){
  const raw=rows('CHAT'); if(!raw.length) return 0;
  db.chatsMigrados=db.chatsMigrados||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['CH_CODIGO','CODIGO'])); if(!codigo) return;
    let cliente=clientePorCodigo(pick(r,['CH_COD_CLIENTE','COD_CLIENTE']), empId);
    const codVis=cod(pick(r,['CH_COD_VISITA','COD_VISITA']));
    if(!cliente && codVis) cliente=clienteDaVisita(codVis, empId);
    if(!cliente) cliente=clientePadrao(empId);
    const os=garantirChamadoChat(r, empId, cliente);
    let chat=db.chatsMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const origem=cod(pick(r,['CH_COD_FUNCIONARIO','COD_FUNCIONARIO']))?'funcionario':'cliente';
    const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,visitaCodigoAntigo:codVis||cod((os&&os.legadoCodigo)||''),osId:os?os.id:null,mensagem:txt(pick(r,['CH_MENSAGEM','MENSAGEM','TEXTO'])),dataEnvio:dataISO(pick(r,['CH_DATA_ENVIO','DATA_ENVIO','DATA'])),funcionarioCodigoAntigo:cod(pick(r,['CH_COD_FUNCIONARIO','COD_FUNCIONARIO'])),origem,codEmpresa:cod(pick(r,['CH_COD_EMPRESA','COD_EMPRESA'])),somenteHistorico:true};
    if(chat) Object.assign(chat,dados); else db.chatsMigrados.push({id:uidSafe('cha'),...dados});
    if(os){ os.chatMensagens=os.chatMensagens||[]; if(!os.chatMensagens.find(m=>m.codigoAntigo===codigo)) os.chatMensagens.push({codigoAntigo:codigo,mensagem:dados.mensagem,data:dados.dataEnvio,origem}); }
    alterou++;
  });
  return alterou;
}

function sincronizarRecibosAnexosCentro(empId){
  let alterou=0;
  const recibos=rows('RECIBOS_EMITIDOS');
  if(recibos.length){
    db.recibosEmitidosMigrados=db.recibosEmitidosMigrados||[];
    recibos.forEach(r=>{
      const codigo=cod(pick(r,['COD_RECIBO','RC_CODIGO','CODIGO'])); if(!codigo) return;
      const parcela=cod(pick(r,['RC_COD_PARCELA','COD_PARCELA']));
      let itemRec=cod(pick(r,['COD_ITENS_RECEBIMENTO']));
      if(!itemRec&&parcela){
        const rs=rows('RECEBIMENTO_CONTAS_RECEBER').filter(x=>cod(pick(x,['COD_PARCELA']))===parcela).map(x=>Number(cod(pick(x,['COD_ITENS_RECEBIMENTO','CODIGO'])))).filter(Number.isFinite);
        if(rs.length) itemRec=String(Math.max(...rs));
      }
      let rec=db.recibosEmitidosMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,codParcela:parcela,codItensRecebimento:itemRec,data:pick(r,['DATA','RC_DATA'])||agora(),valor:num(pick(r,['VALOR','RC_VALOR']),0),descricao:txt(pick(r,['DESCRICAO','OBS'])),somenteHistorico:true};
      if(rec) Object.assign(rec,dados); else db.recibosEmitidosMigrados.push({id:uidSafe('rec'),...dados});
      alterou++;
    });
  }
  const anexos=rows('ANEXOS');
  if(anexos.length){
    db.anexosMigrados=db.anexosMigrados||[];
    anexos.forEach(r=>{ const codigo=cod(pick(r,['AN_CODIGO','CODIGO'])); if(!codigo) return; let a=db.anexosMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo); const dados={empresaId:empId,codigoAntigo:codigo,nome:txt(pick(r,['AN_NOME','NOME','ARQUIVO'])),tipo:txt(pick(r,['AN_TIPO','TIPO'])),referencia:txt(pick(r,['AN_REFERENCIA','REFERENCIA'])),data:pick(r,['AN_DATA','DATA'])||agora(),somenteHistorico:true}; if(a) Object.assign(a,dados); else db.anexosMigrados.push({id:uidSafe('ane'),...dados}); alterou++; });
  }
  const centros=rows('CENTRO_CUSTO');
  if(centros.length){
    db.centrosCustoMigrados=db.centrosCustoMigrados||[];
    centros.forEach(r=>{ const codigo=cod(pick(r,['CC_CODIGO','CODIGO'])); if(!codigo) return; let c=db.centrosCustoMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo); const dados={empresaId:empId,codigoAntigo:codigo,descricao:txt(pick(r,['CC_DESCRICAO','DESCRICAO','NOME'])),dataCadastro:pick(r,['CC_DATA_CADASTRO','DATA_CADASTRO','DATA'])||agora(),del:inteiro(pick(r,['CC_DEL','DEL']),0),ordem:inteiro(pick(r,['CC_ORDEM','ORDEM']),0),funcionarioCodigoAntigo:cod(pick(r,['CC_COD_FUNCIONARIO','COD_FUNCIONARIO'])),somenteHistorico:true}; if(c) Object.assign(c,dados); else db.centrosCustoMigrados.push({id:uidSafe('ccu'),...dados}); alterou++; });
  }
  return alterou;
}

function sincronizarDepartamentosEAux(empId){
  let alterou=0;
  const defs=[
    {tabela:'DEPARTAMENTOS',prop:'departamentosMigrados',cod:['DEP_COD_DEPARTAMENTO','COD_DEPARTAMENTO','CODIGO'],extra:r=>({descricao:up(pick(r,['DEP_DESCRICAO','DESCRICAO','NOME']))})},
    {tabela:'SOLUCAO_DEFEITO',prop:'solucoesDefeitoMigradas',cod:['COD_SOLUCAO_DEFEITO','SD_CODIGO','CODIGO'],extra:r=>({descricao:limparDescricao(pick(r,['DESCRICAO','SD_DESCRICAO','NOME']))})},
    {tabela:'SOMA_ITENS_INSUMOS_GASTOS',prop:'somaItensInsumosGastosMigrados',cod:['COD_SOMA_ITENS_INSUMOS_GASTOS','CODIGO'],extra:r=>({codRecarga:cod(pick(r,['COD_RECARGA'])),valor:num(pick(r,['VALOR','VALOR_TOTAL']),0),descricao:txt(pick(r,['DESCRICAO']))})},
    {tabela:'LOCALIZACAO',prop:'localizacoesMigradas',cod:['LO_CODIGO','CODIGO'],extra:r=>({descricao:txt(pick(r,['LO_DESCRICAO','DESCRICAO','NOME'])),data:pick(r,['LO_DATA','DATA'])||agora()})},
    {tabela:'ASSUNTOS',prop:'assuntosMigrados',cod:['ASS_CODIGO','CODIGO'],extra:r=>({descricao:txt(pick(r,['ASS_DESCRICAO','DESCRICAO','NOME'])),ordem:inteiro(pick(r,['ASS_ORDEM','ORDEM']),0),del:txt(pick(r,['ASS_DEL','DEL']))||'N',valor:num(pick(r,['ASS_VALOR','VALOR']),0)})},
    {tabela:'MOTIVO_SITUACAO',prop:'motivosSituacaoMigrados',cod:['MOT_CODIGO','CODIGO'],extra:r=>({descricao:txt(pick(r,['MOT_DESCRICAO','DESCRICAO','NOME'])),ordem:inteiro(pick(r,['MOT_ORDEM','ORDEM']),0)+1,del:txt(pick(r,['MOT_DEL','DEL']))||'N',codAssunto:cod(pick(r,['MOT_COD_ASSUNTO']))||'1',codStatus:cod(pick(r,['MOT_COD_STATUS']))||'2'})},
    {tabela:'ITENS_CAIXA',prop:'itensCaixaMigrados',cod:['COD_ITENS_CAIXA','CODIGO'],extra:r=>({descricao:txt(pick(r,['DESCRICAO','OBS'])),valor:num(pick(r,['VALOR']),0),data:pick(r,['DATA'])||agora()})},
    {tabela:'PUBLICIDADE',prop:'publicidadesMigradas',cod:['PUB_CODIGO','CODIGO'],extra:r=>({descricao:txt(pick(r,['PUB_DESCRICAO','DESCRICAO','TITULO'])),data:pick(r,['PUB_DATA','DATA'])||agora(),ativo:txt(pick(r,['PUB_ATIVO','ATIVO']))})},
    {tabela:'MOTIVO_PERGUNTA_TAGS',prop:'motivoPerguntaTagsMigradas',cod:['MPT_CODIGO','CODIGO'],extra:r=>({tag:txt(pick(r,['MPT_TAG','TAG','DESCRICAO'])),motivoPerguntaCodigoAntigo:cod(pick(r,['MPT_COD_MOTIVO_PERGUNTA']))})},
    {tabela:'MOTIVO_RESPOSTA',prop:'motivoRespostasMigradas',cod:['MR_CODIGO','CODIGO'],extra:r=>({resposta:txt(pick(r,['MR_RESPOSTA','RESPOSTA','DESCRICAO'])),motivoCodigoAntigo:cod(pick(r,['MR_COD_MOTIVO','COD_MOTIVO']))})},
    {tabela:'MOTIVOS',prop:'motivosMigrados',cod:['MO_CODIGO','CODIGO'],extra:r=>({descricao:up(pick(r,['MO_DESCRICAO','DESCRICAO','NOME']))})},
    {tabela:'VISITAS_HISTORICO',prop:'visitasHistoricoMigrado',cod:['VH_CODIGO','CODIGO'],extra:r=>({visitaCodigoAntigo:cod(pick(r,['VH_COD_VISITA','COD_VISITA'])),data:pick(r,['VH_DATA','DATA'])||agora(),descricao:txt(pick(r,['VH_DESCRICAO','DESCRICAO','OBS']))})},
    {tabela:'ENQUETES',prop:'enquetesMigradas',cod:['ENC_CODIGO','CODIGO'],extra:r=>({descricao:txt(pick(r,['ENC_DESCRICAO','DESCRICAO','PERGUNTA'])),data:pick(r,['ENC_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['ENC_COD_FUNCIONARIO','COD_FUNCIONARIO']))})},
    {tabela:'ENQUETES_OPCOES',prop:'enquetesOpcoesMigradas',cod:['ENO_CODIGO','CODIGO'],extra:r=>({enqueteCodigoAntigo:cod(pick(r,['ENO_COD_ENQUETE','ENC_CODIGO'])),descricao:txt(pick(r,['ENO_DESCRICAO','DESCRICAO','OPCAO'])),data:pick(r,['ENO_DATA','DATA'])||agora()})}
  ];
  defs.forEach(def=>{
    const raw=rows(def.tabela); if(!raw.length) return;
    db[def.prop]=db[def.prop]||[];
    raw.forEach(r=>{ const codigo=cod(pick(r,def.cod)); if(!codigo) return; let obj=db[def.prop].find(x=>x.empresaId===empId&&x.codigoAntigo===codigo); const dados={empresaId:empId,codigoAntigo:codigo,somenteHistorico:true,...(def.extra?def.extra(r):{})}; if(obj) Object.assign(obj,dados); else db[def.prop].push({id:uidSafe('aux'),...dados}); alterou++; });
  });
  return alterou;
}

function sincronizarAvaliacoes(empId){
  const raw=rows('AVALIACAO'); if(!raw.length) return 0;
  db.avaliacoesMigradas=db.avaliacoesMigradas||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['AV_CODIGO','CODIGO'])); if(!codigo) return;
    const codVis=cod(pick(r,['AV_COD_VISITA','COD_VISITA']));
    const os=osPorVisita(codVis,empId);
    const cliente=clientePorCodigo(pick(r,['AV_COD_CLIENTE','COD_CLIENTE']),empId)||clienteDaVisita(codVis,empId)||(os&&os.clienteId?(db.clientes||[]).find(c=>c.id===os.clienteId):null);
    let av=db.avaliacoesMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,visitaCodigoAntigo:codVis,osId:os?os.id:null,nota:num(pick(r,['AV_NOTA','NOTA','VALOR']),0),comentario:txt(pick(r,['AV_COMENTARIO','COMENTARIO','OBS'])),data:pick(r,['AV_DATA','DATA'])||agora(),somenteHistorico:true};
    if(av) Object.assign(av,dados); else db.avaliacoesMigradas.push({id:uidSafe('ava'),...dados});
    alterou++;
  });
  return alterou;
}

function aplicarAutomacoesCaixaChatAuxiliares(empId){
  if(!db||!empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=assinaturaTabela(['RETIRADA_CAIXA','FORNECEDORES','TRANSPORTADORES','CHAT','VISITAS','RECIBOS_EMITIDOS','RECEBIMENTO_CONTAS_RECEBER','ANEXOS','CENTRO_CUSTO','DEPARTAMENTOS','SOLUCAO_DEFEITO','SOMA_ITENS_INSUMOS_GASTOS','LOCALIZACAO','ASSUNTOS','MOTIVO_SITUACAO','ITENS_CAIXA','PUBLICIDADE','MOTIVO_PERGUNTA_TAGS','MOTIVO_RESPOSTA','MOTIVOS','AVALIACAO','VISITAS_HISTORICO','ENQUETES','ENQUETES_OPCOES']);
  if(db.config.automacoes.caixaChatAuxiliaresAssinatura===sig) return 0;
  let total=0;
  total+=sincronizarRetiradasCaixa(empId);
  total+=sincronizarFornecedoresTransportadores(empId);
  total+=sincronizarChat(empId);
  total+=sincronizarRecibosAnexosCentro(empId);
  total+=sincronizarDepartamentosEAux(empId);
  total+=sincronizarAvaliacoes(empId);
  db.config.automacoes.caixaChatAuxiliaresAssinatura=sig;
  if(total) salvar();
  return total;
}

window.AUTOMACOES_CAIXA_CHAT_AUXILIARES_PURE={ limparDescricao, garantirCategoriaFechamento, garantirCidadeMigrada, sincronizarRetiradasCaixa, sincronizarFornecedoresTransportadores, sincronizarChat, sincronizarRecibosAnexosCentro, sincronizarDepartamentosEAux, sincronizarAvaliacoes, aplicarAutomacoesCaixaChatAuxiliares };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s=sess(); if(s) aplicarAutomacoesCaixaChatAuxiliares(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_caixa_chat_auxiliares', run, 1400); else setTimeout(run, 1400); return ret; };
const oldRenderFinanceiro=window.renderFinanceiro;
window.renderFinanceiro=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_caixa_chat_auxiliares', run, 0); else run(); return oldRenderFinanceiro?oldRenderFinanceiro.apply(this,arguments):undefined; };
const oldRenderOs=window.renderOs;
window.renderOs=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_caixa_chat_auxiliares', run, 0); else run(); return oldRenderOs?oldRenderOs.apply(this,arguments):undefined; };
const oldRenderClientes=window.renderClientes;
window.renderClientes=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_caixa_chat_auxiliares', run, 0); else run(); return oldRenderClientes?oldRenderClientes.apply(this,arguments):undefined; };
const oldRenderConfig=window.renderConfig;
window.renderConfig=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_caixa_chat_auxiliares', run, 0); else run(); return oldRenderConfig?oldRenderConfig.apply(this,arguments):undefined; };
if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_caixa_chat_auxiliares', run, 2800); else setTimeout(run, 2800);
console.log('[DIGICOPY] automacoes_caixa_chat_auxiliares_patch.js v4.9.31 carregado');
})();
