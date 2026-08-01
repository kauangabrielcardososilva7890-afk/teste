// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.32 — Automações finais de locação, histórico, custos e auxiliares
// • Última parte da adaptação das triggers úteis do banco anterior — Parte 12
// • Enquetes, cartões de cliente, filas/offline, configurações e históricos ficam preservados
// • Contas avulsas são classificadas com custo histórico, sem cobrança automática no ERP novo
// • Estoque de toner da locação calcula saldo, impressões restantes, média/dias e percentual
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
function round2(v){ return Math.round(num(v,0)*100)/100; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function agora(){ return new Date().toISOString(); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }
function assinaturaTabela(nomes){ return nomes.map(nome=>{ const r=rows(nome); const last=r[r.length-1]||{}; return `${nome}:${r.length}:${JSON.stringify(last).slice(0,90)}`; }).join('|'); }
function dataISO(v){ if(!txt(v)) return agora(); const d=new Date(v); return Number.isNaN(d.getTime())?txt(v):d.toISOString(); }

function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId&&(cod(x.codigo)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p=>p.empresaId===empId&&(cod(p.sku)===c||cod(p.codigo)===c||cod(p.codigoAntigo)===c||cod(p.idLegado)===c))||null; }
function contratoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.contratos||[]).find(ct=>ct.empresaId===empId&&(cod(ct.numero)===c||cod(ct.codigoAntigo)===c||cod(ct.idLegado)===c))||null; }
function parquePorItem(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.parque||[]).find(p=>p.empresaId===empId&&cod(p.codigoAntigo)===c)||null; }

function sincronizarEnquetesDetalhes(empId){
  let alterou=0;
  const perguntas=rows('ENQUETES_PERGUNTA');
  if(perguntas.length){
    db.enquetesPerguntasMigradas=db.enquetesPerguntasMigradas||[];
    perguntas.forEach(r=>{
      const codigo=cod(pick(r,['ENI_CODIGO','CODIGO'])); if(!codigo) return;
      let p=db.enquetesPerguntasMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,enqueteCodigoAntigo:cod(pick(r,['ENI_COD_ENQUETE','ENC_CODIGO','COD_ENQUETE'])),pergunta:txt(pick(r,['ENI_PERGUNTA','PERGUNTA','DESCRICAO'])),ordem:inteiro(pick(r,['ENI_ORDEM','ORDEM']),0),somenteHistorico:true};
      if(p) Object.assign(p,dados); else db.enquetesPerguntasMigradas.push({id:uidSafe('enp'),...dados});
      alterou++;
    });
  }
  const votos=rows('ENQUETES_VOTOS');
  if(votos.length){
    db.enquetesVotosMigrados=db.enquetesVotosMigrados||[];
    votos.forEach(r=>{
      const codigo=cod(pick(r,['ENV_CODIGO','CODIGO'])); if(!codigo) return;
      const cliente=clientePorCodigo(pick(r,['ENV_COD_CLIENTE','COD_CLIENTE']), empId);
      let v=db.enquetesVotosMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,enqueteCodigoAntigo:cod(pick(r,['ENV_COD_ENQUETE','ENC_CODIGO','COD_ENQUETE'])),perguntaCodigoAntigo:cod(pick(r,['ENV_COD_PERGUNTA','ENI_CODIGO'])),opcaoCodigoAntigo:cod(pick(r,['ENV_COD_OPCAO','ENO_CODIGO'])),clienteId:cliente?cliente.id:null,data:pick(r,['ENV_DATA','DATA'])||agora(),valor:txt(pick(r,['ENV_VALOR','VALOR','RESPOSTA'])),somenteHistorico:true};
      if(v) Object.assign(v,dados); else db.enquetesVotosMigrados.push({id:uidSafe('env'),...dados});
      alterou++;
    });
  }
  return alterou;
}

function sincronizarCartoesOffEmails(empId){
  let alterou=0;
  const cartoes=rows('CARTAO_CLIENTE');
  if(cartoes.length){
    db.cartoesClienteMigrados=db.cartoesClienteMigrados||[];
    cartoes.forEach(r=>{
      const codigo=cod(pick(r,['CAC_CODIGO','CODIGO'])); if(!codigo) return;
      const cliente=clientePorCodigo(pick(r,['CAC_COD_CLIENTE','COD_CLIENTE']), empId);
      let c=db.cartoesClienteMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,data:pick(r,['CAC_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['CAC_COD_FUNCIONARIO','COD_FUNCIONARIO'])),descricao:txt(pick(r,['CAC_DESCRICAO','DESCRICAO','OBS'])),somenteHistorico:true};
      if(c) Object.assign(c,dados); else db.cartoesClienteMigrados.push({id:uidSafe('cac'),...dados});
      alterou++;
    });
  }
  const contOff=rows('CONTADORES_OFF');
  if(contOff.length){
    db.contadoresOffMigrados=db.contadoresOffMigrados||[];
    contOff.forEach(r=>{
      const codigo=cod(pick(r,['COO_CODIGO','CODIGO'])); if(!codigo) return;
      let c=db.contadoresOffMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,data:pick(r,['COO_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['COO_COD_FUNCIONARIO','COD_FUNCIONARIO'])),serial:txt(pick(r,['COO_SERIAL','SERIAL'])),contador:num(pick(r,['COO_CONTADOR','CONTADOR','VALOR']),0),motivo:txt(pick(r,['COO_MOTIVO','MOTIVO','OBS'])),somenteHistorico:true};
      if(c) Object.assign(c,dados); else db.contadoresOffMigrados.push({id:uidSafe('coo'),...dados});
      alterou++;
    });
  }
  const emailOff=rows('EMAIL_OFF');
  if(emailOff.length){
    db.emailsOffMigrados=db.emailsOffMigrados||[];
    emailOff.forEach(r=>{
      const codigo=cod(pick(r,['EMO_CODIGO','CODIGO'])); if(!codigo) return;
      let e=db.emailsOffMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,data:pick(r,['EMO_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['EMO_COD_FUNCIONARIO','COD_FUNCIONARIO'])),email:lower(pick(r,['EMO_EMAIL','EMAIL'])),assunto:txt(pick(r,['EMO_ASSUNTO','ASSUNTO'])),status:txt(pick(r,['EMO_STATUS','STATUS']))||'historico_offline',somenteHistorico:true,envioAutomatico:false};
      if(e) Object.assign(e,dados); else db.emailsOffMigrados.push({id:uidSafe('emo'),...dados});
      alterou++;
    });
  }
  return alterou;
}

function sincronizarEmailCampanhaEventos(empId){
  const raw=rows('EMAIL_CAMPANHA_ENVIOS_EMAIL'); if(!raw.length) return 0;
  db.emailCampanhaEventosMigrados=db.emailCampanhaEventosMigrados||[];
  db.emailsMigrados=db.emailsMigrados||[];
  const aberturas={};
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['ECM_CODIGO','CODIGO'])); if(!codigo) return;
    const acao=inteiro(pick(r,['ECM_ACAO','ACAO']),0);
    const codEmail=cod(pick(r,['ECM_COD_EMAIL','COD_EMAIL','EMAIL_CODIGO']));
    const ocorrencia=acao===0?1:Math.max(1, inteiro(pick(r,['ECM_OCORRENCIA','OCORRENCIA']), acao));
    let ev=db.emailCampanhaEventosMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,campanhaEnvioCodigoAntigo:cod(pick(r,['ECM_COD_ENVIO','ECE_CODIGO','COD_ENVIO'])),emailCodigoAntigo:codEmail,acao,ocorrencia,data:pick(r,['ECM_DATA','DATA'])||agora(),somenteHistorico:true};
    if(ev) Object.assign(ev,dados); else db.emailCampanhaEventosMigrados.push({id:uidSafe('ecm'),...dados});
    if(acao>0&&codEmail) aberturas[codEmail]=(aberturas[codEmail]||0)+1;
    alterou++;
  });
  Object.entries(aberturas).forEach(([codEmail,total])=>{
    let email=db.emailsMigrados.find(e=>e.empresaId===empId&&e.codigoAntigo===codEmail);
    if(!email){ email={id:uidSafe('eml'),empresaId:empId,codigoAntigo:codEmail,email:'',somenteHistorico:true}; db.emailsMigrados.push(email); }
    email.emailAbriuMigrado=total;
    email.emailAbriu=total;
    alterou++;
  });
  return alterou;
}

function sincronizarConfigsAvulsas(empId){
  let alterou=0;
  const cfgClientes=rows('CONFIG_CLIENTES');
  if(cfgClientes.length){
    db.configClientesMigradas=db.configClientesMigradas||[];
    cfgClientes.forEach(r=>{
      const codigo=cod(pick(r,['CLC_CODIGO','CODIGO'])); if(!codigo) return;
      const cliente=clientePorCodigo(pick(r,['CLC_COD_CLIENTE','COD_CLIENTE']), empId);
      let c=db.configClientesMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,chave:txt(pick(r,['CLC_DESCRICAO','DESCRICAO','CHAVE'])),valor:pick(r,['CLC_VALOR','VALOR']),somenteHistorico:true};
      if(c) Object.assign(c,dados); else db.configClientesMigradas.push({id:uidSafe('clc'),...dados});
      alterou++;
    });
  }
  const cfgSis=rows('CONFIG_SISPRINTER');
  if(cfgSis.length){
    db.configSisprinterMigradas=db.configSisprinterMigradas||[];
    cfgSis.forEach(r=>{
      const codigo=cod(pick(r,['COS_CODIGO','CODIGO'])); if(!codigo) return;
      const cliente=clientePorCodigo(pick(r,['COS_COD_CLIENTE','COD_CLIENTE']), empId);
      let c=db.configSisprinterMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,clienteCodigoAntigo:cod(pick(r,['COS_COD_CLIENTE','COD_CLIENTE'])),descricao:up(pick(r,['COS_DESCRICAO','DESCRICAO'])),valor:num(pick(r,['COS_VALOR','VALOR']),0),somenteHistorico:true};
      if(c) Object.assign(c,dados); else db.configSisprinterMigradas.push({id:uidSafe('cos'),...dados});
      alterou++;
    });
  }
  return alterou;
}
function configSisValor(codCliente, descricao){
  const cc=cod(codCliente); const d=up(descricao);
  const all=[...(db.configSisprinterMigradas||[]), ...rows('CONFIG_SISPRINTER').map(r=>({clienteCodigoAntigo:cod(pick(r,['COS_COD_CLIENTE','COD_CLIENTE'])),descricao:up(pick(r,['COS_DESCRICAO','DESCRICAO'])),valor:num(pick(r,['COS_VALOR','VALOR']),NaN)}))];
  const vals=all.filter(x=>(!cc||cod(x.clienteCodigoAntigo)===cc)&&up(x.descricao)===d).map(x=>num(x.valor,NaN)).filter(Number.isFinite);
  return vals.length?Math.max(...vals):null;
}
function minutoChave(data){ const d=new Date(data||Date.now()); if(Number.isNaN(d.getTime())) return txt(data).slice(0,16); return d.toISOString().slice(0,16); }
function classificarContaAvulsa(row, contagemEmail){
  const desc=txt(pick(row,['CRA_DESCRICAO','DESCRICAO']));
  const low=desc.toLowerCase();
  const cli=cod(pick(row,['CRA_COD_CLIENTE','COD_CLIENTE']));
  const data=pick(row,['CRA_DATA','DATA'])||agora();
  let tipo='OUTROS', cos='', valor=num(pick(row,['CRA_VALOR','VALOR']),0);
  if(low.includes('enviou email:')||low.includes('enviou emails:')){
    tipo='EMAIL'; cos='EMVIAR_EMAIL'; valor=0;
    const chave=cli+'|'+minutoChave(data);
    if((contagemEmail[chave]||0)>10){ const cfg=configSisValor(cli,'VALOR_EMAIL'); valor=cfg!=null?cfg:0.01; }
  } else if(low.includes('enviou sms:')){ tipo='SMS'; cos='VALOR_SMS'; valor=0.10; }
  else if(low.includes('enviou whatsapp:')){ tipo='WHATSAPP'; cos='VALOR_WHATSAPP'; valor=0.15; }
  else if(low.includes('gerou boleto:')){ tipo='BOLETO'; cos='VALOR_BOLETOS'; valor=1.00; }
  else if(low.includes('transacao gerencianet:')){ tipo='GERENCIANET'; cos='VALOR_BOLETOS_GERENCIANET'; valor=1.00; }
  else if(low.includes('gerou nfce:')){ tipo='NFCE'; cos='VALOR_NFCE'; valor=1.99; }
  else if(low.includes('gerou nfe:')){ tipo='NFE'; cos='VALOR_NFE'; valor=1.99; }
  else if(low.includes('backup realizado nas nuvens')){ tipo='BACKUP'; cos='VALOR_BACKUP'; valor=1.00; }
  else if(low.includes('geolocalizacao google')){ tipo='GEOLOCALIZACAO'; cos='VALOR_GEOLOCALIZACAO'; valor=0.01; }
  const override=configSisValor(cli,cos);
  if(override!=null) valor=override;
  return {tipo,cosDescricao:cos,valor:round2(valor)};
}
function sincronizarContasReceberAvulsas(empId){
  const raw=rows('CONTAS_RECEBER_AVULSA'); if(!raw.length) return 0;
  db.contasReceberAvulsasMigradas=db.contasReceberAvulsasMigradas||[];
  const contagemEmail={};
  raw.forEach(r=>{
    const obs=txt(pick(r,['CRA_OBS','OBS'])); if(/Importado Banco Mysql/i.test(obs)) return;
    const desc=lower(pick(r,['CRA_DESCRICAO','DESCRICAO']));
    if(desc.includes('enviou email:')||desc.includes('enviou emails:')){ const chave=cod(pick(r,['CRA_COD_CLIENTE','COD_CLIENTE']))+'|'+minutoChave(pick(r,['CRA_DATA','DATA'])||agora()); contagemEmail[chave]=(contagemEmail[chave]||0)+1; }
  });
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['CRA_CODIGO','CODIGO'])); if(!codigo) return;
    const obs=txt(pick(r,['CRA_OBS','OBS'])); if(/Importado Banco Mysql/i.test(obs)) return;
    const cliente=clientePorCodigo(pick(r,['CRA_COD_CLIENTE','COD_CLIENTE']), empId);
    const cls=classificarContaAvulsa(r,contagemEmail);
    let c=db.contasReceberAvulsasMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,clienteCodigoAntigo:cod(pick(r,['CRA_COD_CLIENTE','COD_CLIENTE'])),data:pick(r,['CRA_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['CRA_COD_FUNCIONARIO','COD_FUNCIONARIO'])),descricao:txt(pick(r,['CRA_DESCRICAO','DESCRICAO'])),obs,tipoCobranca:cls.tipo,cosDescricao:cls.cosDescricao,valor:cls.valor,somenteHistorico:true,naoGerarCobrancaAutomatica:true};
    if(c) Object.assign(c,dados); else db.contasReceberAvulsasMigradas.push({id:uidSafe('cra'),...dados});
    alterou++;
  });
  return alterou;
}

function sincronizarProdutosAtacadoRamoRegistros(empId){
  let alterou=0;
  const defs=[
    {tabela:'PRODUTOS_ATACADO',prop:'produtosAtacadoMigrados',cod:['PRA_CODIGO','CODIGO'],data:['PRA_DATA','DATA'],extra:r=>({produtoCodigoAntigo:cod(pick(r,['PRA_COD_PRODUTO','COD_PRODUTO'])),qtdeMinima:num(pick(r,['PRA_QTDE','QTDE','QTD']),0),valor:num(pick(r,['PRA_VALOR','VALOR','PRECO']),0),funcionarioCodigoAntigo:cod(pick(r,['PRA_COD_FUNCIONARIO','COD_FUNCIONARIO']))})},
    {tabela:'RAMO',prop:'ramosMigrados',cod:['RAM_CODIGO','CODIGO'],extra:r=>({descricao:txt(pick(r,['RAM_DESCRICAO','DESCRICAO','NOME']))})},
    {tabela:'REGISTROS',prop:'registrosMigrados',cod:['REG_CODIGO','CODIGO'],data:['REG_DATA_CADASTRO','DATA_CADASTRO','DATA'],extra:r=>({descricao:txt(pick(r,['REG_DESCRICAO','DESCRICAO','NOME'])),valor:txt(pick(r,['REG_VALOR','VALOR']))})},
    {tabela:'SELECIONADOS',prop:'selecionadosMigrados',cod:['COD_SELECIONADO','CODIGO'],extra:r=>({tabela:txt(pick(r,['TABELA','SEL_TABELA'])),referencia:txt(pick(r,['REFERENCIA','SEL_REFERENCIA','COD_REFERENCIA']))})},
    {tabela:'RAMO_ITENS_FABRICANTE',prop:'ramoItensFabricanteMigrados',cod:['RIF_CODIGO','CODIGO'],data:['RIF_DATA','DATA'],extra:r=>({ramoItemCodigoAntigo:cod(pick(r,['RIF_COD_RAMO_ITEM','RAI_CODIGO'])),fabricanteCodigoAntigo:cod(pick(r,['RIF_COD_FABRICANTE','COD_FABRICANTE']))})}
  ];
  defs.forEach(def=>{
    const raw=rows(def.tabela); if(!raw.length) return;
    db[def.prop]=db[def.prop]||[];
    raw.forEach(r=>{
      const codigo=cod(pick(r,def.cod)); if(!codigo) return;
      let obj=db[def.prop].find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,data:pick(r,def.data||['DATA'])||agora(),somenteHistorico:true,...(def.extra?def.extra(r):{})};
      if(obj) Object.assign(obj,dados); else db[def.prop].push({id:uidSafe('aux'),...dados});
      alterou++;
    });
  });
  return alterou;
}

function descricaoStatusPix(status){
  const s=txt(status);
  const m={1:'Aguardando',2:'Processando',3:'Ativo',4:'Cancelado',5:'Pago',6:'Erro',7:'Estornado'};
  return m[cod(s)]||({NEW:'Gerado',WAITING:'Aguardando',PAID:'Pago',CANCELED:'Cancelado',CANCELLED:'Cancelado',REFUNDED:'Estornado'}[up(s)]||s||'Aguardando');
}
function sincronizarHistoricosBoletoPix(empId){
  let alterou=0;
  const boletos=rows('BOLETOS_HISTORICO');
  if(boletos.length){
    db.boletosHistoricoMigrado=db.boletosHistoricoMigrado||[];
    boletos.forEach(r=>{
      const codigo=cod(pick(r,['BOH_CODIGO','CODIGO'])); if(!codigo) return;
      let b=db.boletosHistoricoMigrado.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,boletoCodigoAntigo:cod(pick(r,['BOH_COD_BOLETO','COD_BOLETO'])),data:pick(r,['BOH_DATA','DATA'])||agora(),descricao:txt(pick(r,['BOH_DESCRICAO','DESCRICAO','OBS'])),status:txt(pick(r,['BOH_STATUS','STATUS'])),somenteHistorico:true};
      if(b) Object.assign(b,dados); else db.boletosHistoricoMigrado.push({id:uidSafe('boh'),...dados});
      alterou++;
    });
  }
  const pix=rows('PIX_HISTORICO');
  if(pix.length){
    db.pixHistoricoMigrado=db.pixHistoricoMigrado||[];
    pix.forEach(r=>{
      const codigo=cod(pick(r,['PIH_CODIGO','CODIGO'])); if(!codigo) return;
      const st=pick(r,['PIH_STATUS','STATUS']);
      const key='PIH-'+codigo;
      let p=db.pixHistoricoMigrado.find(x=>x.key===key||x.codigoAntigo===codigo);
      const dados={empresaId:empId,key,codigoAntigo:codigo,pixCodigoAntigo:cod(pick(r,['PIH_COD_PIX','PIX_CODIGO','COD_PIX'])),statusCodigo:cod(st),status:descricaoStatusPix(st),statusDescricao:descricaoStatusPix(st),data:pick(r,['PIH_DATA','DATA'])||agora(),somenteHistorico:true,baixaAutomatica:false};
      if(p) Object.assign(p,dados); else db.pixHistoricoMigrado.push({id:uidSafe('pih'),...dados});
      alterou++;
    });
  }
  return alterou;
}

function vidaUtilProduto(prod){ return num(prod&&(prod.vidaUtil||prod.VIDA_UTIL||prod.rendimento||prod.qtdeCopias),0); }
function vidaUtilCartucho(codigo){
  const c=cod(codigo); if(!c) return 0;
  const mig=(db.cartuchosMigrados||[]).find(x=>cod(x.codigoAntigo)===c);
  if(mig) return num(mig.qtdeCopias||mig.QTDE_COPIAS||mig.vidaUtil,0);
  const raw=rows('CARTUCHOS').find(x=>cod(pick(x,['COD_CARTUCHO','CODIGO']))===c);
  return raw?num(pick(raw,['QTDE_COPIAS','VIDA_UTIL']),0):0;
}
function mediaCartuchos(){
  const vals=[...(db.cartuchosMigrados||[]).map(c=>num(c.qtdeCopias||c.QTDE_COPIAS||c.vidaUtil,0)), ...rows('CARTUCHOS').map(c=>num(pick(c,['QTDE_COPIAS','VIDA_UTIL']),0))].filter(v=>v>0);
  return vals.length?round2(vals.reduce((s,v)=>s+v,0)/vals.length):0;
}
function itemVendaRaw(codigo){ const c=cod(codigo); if(!c) return null; return rows('ITENS_VENDA').find(i=>cod(pick(i,['COD_ITENS_VENDA','CODIGO']))===c)||null; }
function estimarImpressoesHistorico(row, empId){
  const rawImp=num(pick(row,['LEH_IMPRESSOES','IMPRESSOES']),0);
  if(rawImp>0) return rawImp;
  const item=itemVendaRaw(pick(row,['LEH_COD_ITENS_VENDA','COD_ITENS_VENDA']));
  let unit=0;
  if(item){
    const prod=produtoPorCodigo(pick(item,['COD_PRODUTO']),empId); if(prod) unit=vidaUtilProduto(prod);
    if(!unit) unit=vidaUtilCartucho(pick(item,['COD_CARTUCHO']));
  }
  if(!unit) unit=mediaCartuchos();
  const qtde=num(pick(row,['LEH_QTDE','QTDE']),1)||1;
  return round2(unit*qtde);
}
function contadoresLocacao(codLoc){
  const c=cod(codLoc); if(!c) return [];
  const raws=[...rows('CONTADORES'), ...rows('CONTADOR')].filter(r=>cod(pick(r,['CON_COD_LOCACAO','COD_LOCACAO']))===c).map(r=>num(pick(r,['CON_TOTAL_IMPRESSAO_DIA','TOTAL_IMPRESSAO_DIA']),0)).filter(v=>v>0);
  const mig=(db.contadoresMigrados||[]).filter(r=>cod(r.locacaoCodigoAntigo||r.codLocacao||r.conCodLocacao)===c).map(r=>num(r.totalImpressaoDia,0)).filter(v=>v>0);
  return [...raws,...mig];
}
function calcularResumoLocacaoEstoque(codLoc, base, historicos){
  let entrada=0, saida=0, impEntrada=0, impSaida=0;
  historicos.forEach(h=>{
    const tipo=inteiro(h.tipo ?? h.LEH_TIPO,1);
    const qtde=num(h.qtde ?? h.LEH_QTDE,0);
    const imp=num(h.impressoes ?? h.LEH_IMPRESSOES,0);
    if(tipo===0){ saida+=qtde; impSaida+=imp; } else { entrada+=qtde; impEntrada+=imp; }
  });
  const estoque=Math.max(0, round2(entrada-saida));
  const impressoes=Math.max(0, round2(impEntrada-impSaida));
  const diasBase=inteiro(base&&base.dias,0);
  const cont=contadoresLocacao(codLoc);
  const media=cont.length?round2(cont.reduce((s,v)=>s+v,0)/cont.length):num(base&&base.impressoesMediaDia,0);
  const max=cont.length?Math.max(...cont):num(base&&base.maximoImpressaoDia,0);
  const dias=media>0?Math.floor(impressoes/media):diasBase;
  let pct=max>0?Math.floor((impressoes*100)/(30*max)):num(base&&base.porcentagem,0);
  if(pct>100) pct=100;
  if(pct<0||estoque===0) pct=0;
  return {estoqueToner:estoque,impressoes,impressoesMediaDia:media,maximoImpressaoDia:max,dias,porcentagem:pct};
}
function sincronizarLocacaoEstoqueFinal(empId){
  const estoqueRows=rows('LOCACAO_ESTOQUE');
  const histRows=rows('LOCACAO_ESTOQUE_HISTORICO');
  if(!estoqueRows.length&&!histRows.length) return 0;
  db.locacaoEstoqueMigrado=db.locacaoEstoqueMigrado||[];
  db.locacaoEstoqueHistorico=db.locacaoEstoqueHistorico||[];
  let alterou=0;
  const porLoc={};
  histRows.forEach(r=>{
    const codigo=cod(pick(r,['LEH_CODIGO','CODIGO'])); if(!codigo) return;
    const codLoc=cod(pick(r,['LEH_COD_LOCACAO','COD_LOCACAO'])); if(!codLoc) return;
    const contrato=contratoPorCodigo(codLoc, empId);
    const cliente=clientePorCodigo(pick(r,['LEH_COD_CLIENTE','COD_CLIENTE']),empId)||(contrato&&contrato.clienteId?(db.clientes||[]).find(c=>c.id===contrato.clienteId):null);
    const tipoRaw=inteiro(pick(r,['LEH_TIPO','TIPO']),1);
    const tipo=tipoRaw===0?0:1;
    const qtde=Math.max(0,num(pick(r,['LEH_QTDE','QTDE']),0));
    const impressoes=estimarImpressoesHistorico(r, empId);
    let h=db.locacaoEstoqueHistorico.find(x=>x.empresaId===empId&&x.codigoAntigo==='LEH-'+codigo);
    const dados={empresaId:empId,codigoAntigo:'LEH-'+codigo,locacaoCodigoAntigo:codLoc,contratoId:contrato?contrato.id:null,clienteId:cliente?cliente.id:null,data:pick(r,['LEH_DATA','DATA'])||agora(),tipo,qtde,impressoes,itemVendaCodigoAntigo:cod(pick(r,['LEH_COD_ITENS_VENDA','COD_ITENS_VENDA'])),somenteHistorico:true};
    if(h) Object.assign(h,dados); else db.locacaoEstoqueHistorico.push({id:uidSafe('leh'),...dados});
    (porLoc[codLoc]=porLoc[codLoc]||[]).push(dados);
    alterou++;
  });
  estoqueRows.forEach(r=>{
    const codLoc=cod(pick(r,['LE_COD_LOCACAO','COD_LOCACAO'])); if(!codLoc) return;
    const codigo=cod(pick(r,['LE_CODIGO','CODIGO']))||codLoc;
    const contrato=contratoPorCodigo(codLoc,empId);
    let e=db.locacaoEstoqueMigrado.find(x=>x.empresaId===empId&&x.locacaoCodigoAntigo===codLoc);
    const base={dias:Math.max(0,inteiro(pick(r,['LE_DIAS','DIAS']),0)),estoqueToner:Math.max(0,num(pick(r,['LE_ESTOQUE_TONER','ESTOQUE_TONER']),0)),impressaoToner:Math.max(0,num(pick(r,['LE_IMPRESSAO_TONER','IMPRESSAO_TONER']),0)),impressoes:Math.max(0,num(pick(r,['LE_IMPRESSOES','IMPRESSOES']),0)),impressoesMediaDia:Math.max(0,num(pick(r,['LE_IMPRESSOES_MEDIA_DIA']),0)),maximoImpressaoDia:Math.max(0,num(pick(r,['LE_MAXIMO_IMPRESSAO_DIA']),0)),porcentagem:Math.max(0,num(pick(r,['LE_PORCENTAGEM','PORCENTAGEM']),0))};
    const hist=porLoc[codLoc]||[];
    const resumo=hist.length?calcularResumoLocacaoEstoque(codLoc,base,hist):calcularResumoLocacaoEstoque(codLoc,base,[{tipo:1,qtde:base.estoqueToner,impressoes:base.impressoes}]);
    const dados={empresaId:empId,codigoAntigo:codigo,locacaoCodigoAntigo:codLoc,contratoId:contrato?contrato.id:null,impressaoToner:base.impressaoToner,...resumo,somenteHistorico:false};
    if(e) Object.assign(e,dados); else db.locacaoEstoqueMigrado.push({id:uidSafe('lee'),...dados});
    if(contrato){ contrato.estoqueToner=resumo.estoqueToner; contrato.impressoesTonerRestantes=resumo.impressoes; contrato.diasToner=resumo.dias; contrato.percentualToner=resumo.porcentagem; }
    alterou++;
  });
  Object.entries(porLoc).forEach(([codLoc,hist])=>{
    if(db.locacaoEstoqueMigrado.find(x=>x.empresaId===empId&&x.locacaoCodigoAntigo===codLoc)) return;
    const contrato=contratoPorCodigo(codLoc,empId);
    const resumo=calcularResumoLocacaoEstoque(codLoc,{},hist);
    db.locacaoEstoqueMigrado.push({id:uidSafe('lee'),empresaId:empId,codigoAntigo:codLoc,locacaoCodigoAntigo:codLoc,contratoId:contrato?contrato.id:null,impressaoToner:0,...resumo,somenteHistorico:false});
    if(contrato){ contrato.estoqueToner=resumo.estoqueToner; contrato.impressoesTonerRestantes=resumo.impressoes; contrato.diasToner=resumo.dias; contrato.percentualToner=resumo.porcentagem; }
    alterou++;
  });
  return alterou;
}

function aplicarAutomacoesFinaisLocacaoAux(empId){
  if(!db||!empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=assinaturaTabela(['ENQUETES_PERGUNTA','ENQUETES_VOTOS','CARTAO_CLIENTE','CONTADORES_OFF','EMAIL_OFF','EMAIL_CAMPANHA_ENVIOS_EMAIL','CONFIG_CLIENTES','CONFIG_SISPRINTER','CONTAS_RECEBER_AVULSA','PRODUTOS_ATACADO','RAMO','REGISTROS','BOLETOS_HISTORICO','PIX_HISTORICO','SELECIONADOS','LOCACAO_ESTOQUE','LOCACAO_ESTOQUE_HISTORICO','CONTADORES','CONTADOR','ITENS_VENDA','CARTUCHOS','RAMO_ITENS_FABRICANTE']);
  if(db.config.automacoes.finaisLocacaoAuxAssinatura===sig) return 0;
  let total=0;
  total+=sincronizarEnquetesDetalhes(empId);
  total+=sincronizarCartoesOffEmails(empId);
  total+=sincronizarEmailCampanhaEventos(empId);
  total+=sincronizarConfigsAvulsas(empId);
  total+=sincronizarContasReceberAvulsas(empId);
  total+=sincronizarProdutosAtacadoRamoRegistros(empId);
  total+=sincronizarHistoricosBoletoPix(empId);
  total+=sincronizarLocacaoEstoqueFinal(empId);
  db.config.automacoes.finaisLocacaoAuxAssinatura=sig;
  if(total) salvar();
  return total;
}

window.AUTOMACOES_FINAIS_LOCACAO_AUX_PURE={ descricaoStatusPix, classificarContaAvulsa, calcularResumoLocacaoEstoque, estimarImpressoesHistorico, sincronizarEnquetesDetalhes, sincronizarCartoesOffEmails, sincronizarEmailCampanhaEventos, sincronizarConfigsAvulsas, sincronizarContasReceberAvulsas, sincronizarProdutosAtacadoRamoRegistros, sincronizarHistoricosBoletoPix, sincronizarLocacaoEstoqueFinal, aplicarAutomacoesFinaisLocacaoAux };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s=sess(); if(s) aplicarAutomacoesFinaisLocacaoAux(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; setTimeout(run,1600); return ret; };
const oldRenderContratos=window.renderContratos;
window.renderContratos=function(){ run(); return oldRenderContratos?oldRenderContratos.apply(this,arguments):undefined; };
const oldRenderFinanceiro=window.renderFinanceiro;
window.renderFinanceiro=function(){ run(); return oldRenderFinanceiro?oldRenderFinanceiro.apply(this,arguments):undefined; };
const oldRenderConfig=window.renderConfig;
window.renderConfig=function(){ run(); return oldRenderConfig?oldRenderConfig.apply(this,arguments):undefined; };
setTimeout(run,3200);
console.log('[DIGICOPY] automacoes_finais_locacao_auxiliares_patch.js v4.9.32 carregado');
})();
