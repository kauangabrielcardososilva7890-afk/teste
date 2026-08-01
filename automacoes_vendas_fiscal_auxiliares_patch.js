// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.29 — Automações de vendas, cartões, encomendas, fiscal e auxiliares
// • Continuação da adaptação das triggers úteis do banco anterior — Parte 9
// • Preserva cupons usados, encomendas, campanhas de e-mail, tags/valores/dimensões de produtos
// • Cartões ficam somente como histórico seguro, com número mascarado e sem baixa/cobrança automática
// • Vendas migradas recebem totalização, finalização, garantia, situação e vínculos limpos quando excluídas
// • NCM, bancos, tributos IBS/CBS e auxiliares fiscais são normalizados sem ativar rotinas pesadas
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
function isoData(v){ if(!txt(v)) return ''; const d=new Date(v); return Number.isNaN(d.getTime())?txt(v):d.toISOString(); }
function dataMaisDias(data, dias){ const d=new Date(data||Date.now()); if(Number.isNaN(d.getTime())) return ''; d.setDate(d.getDate()+inteiro(dias,0)); return d.toISOString().slice(0,10); }
function normalizarNcm(v){ return txt(v).replace(/\D/g,''); }
function limparCep(v){ const s=txt(v); return s?s:null; }
function mascararNumeroCartao(v){ const dig=txt(v).replace(/\D/g,''); if(!dig) return ''; if(dig.length<=4) return '*'.repeat(Math.max(0,dig.length-2))+dig.slice(-2); return '**** **** **** '+dig.slice(-4); }
function somenteDocumento(v){ return txt(v).replace(/\D/g,''); }
function configRow(){ return rows('CONFIGURACAO')[0]||{}; }

function clientePorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.clientes||[]).find(x=>x.empresaId===empId&&(cod(x.codigo)===c||cod(x.codigoAntigo)===c||cod(x.idLegado)===c))||null; }
function clientePorDocumento(doc, empId){ const d=somenteDocumento(doc); if(!d) return null; return (db.clientes||[]).find(c=>c.empresaId===empId&&[c.documento,c.cpfCnpj,c.cpf_cnpj,c.CPF_CNPJ,c.CPF_CNPJ_EX,c.cpf].some(x=>somenteDocumento(x)===d))||null; }
function produtoPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.produtos||[]).find(p=>p.empresaId===empId&&(cod(p.sku)===c||cod(p.codigo)===c||cod(p.codigoAntigo)===c||cod(p.idLegado)===c))||null; }
function vendaPorCodigo(codigo, empId){ const c=cod(codigo); if(!c) return null; return (db.vendas||[]).find(v=>v.empresaId===empId&&(cod(v.numero)===c||cod(v.codigoAntigo)===c||cod(v.idLegado)===c))||null; }
function funcionarioComissaoCliente(cliente){ return cod(cliente && (cliente.codFuncionario||cliente.codigoFuncionario||cliente.funcionarioCodigoAntigo||cliente.COD_FUNCIONARIO)); }

function cupomPorCodigo(codigo){ const c=cod(codigo); if(!c) return null; return rows('CUPONS').find(x=>cod(pick(x,['CUP_CODIGO','COD_CUPOM','CODIGO']))===c)||null; }
function sincronizarCuponsItens(empId){
  const raw=rows('CUPONS_ITENS'); if(!raw.length) return 0;
  db.cuponsItensMigrados=db.cuponsItensMigrados||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['CUI_CODIGO','COD_CUPONS_ITENS','CODIGO'])); if(!codigo) return;
    const cupom=cupomPorCodigo(pick(r,['CUI_COD_CUPOM','COD_CUPOM']));
    const venda=vendaPorCodigo(pick(r,['CUI_COD_VENDA','COD_VENDA']), empId);
    const cliente=clientePorCodigo(pick(r,['CUI_COD_CLIENTE','COD_CLIENTE']), empId) || (venda&&venda.clienteId?(db.clientes||[]).find(c=>c.id===venda.clienteId):null);
    let item=db.cuponsItensMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const valorRaw=pick(r,['CUI_VALOR','VALOR']);
    const valorCupom=cupom&&pick(cupom,['CUP_VALOR','VALOR']);
    const tipoRaw=pick(r,['CUI_TIPO','TIPO']);
    const tipoCupom=cupom&&pick(cupom,['CUP_TIPO','TIPO']);
    const dados={empresaId:empId,codigoAntigo:codigo,cupomCodigoAntigo:cod(pick(r,['CUI_COD_CUPOM','COD_CUPOM'])),vendaId:venda?venda.id:null,clienteId:cliente?cliente.id:null,dataUtilizado:pick(r,['CUI_DATA_UTILIZADO','DATA_UTILIZADO','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['CUI_COD_FUNCIONARIO','COD_FUNCIONARIO'])),valor:num(txt(valorRaw)===''?valorCupom:valorRaw,0),tipo:txt(txt(tipoRaw)===''?tipoCupom:tipoRaw),qtde:num(pick(r,['CUI_QTDE','QTDE','QTD']),1)||1,somenteHistorico:true};
    if(item) Object.assign(item,dados); else db.cuponsItensMigrados.push({id:uidSafe('cui'),...dados});
    alterou++;
  });
  return alterou;
}

function sincronizarEnderecosLegado(empId){
  const raw=rows('ENDERECOS'); if(!raw.length) return 0;
  db.enderecosMigrados=db.enderecosMigrados||[];
  let alterou=0;
  raw.forEach(r=>{
    const codigo=cod(pick(r,['END_CODIGO','COD_ENDERECO','CODIGO'])); if(!codigo) return;
    const cli=clientePorCodigo(pick(r,['END_COD_CLIENTE','COD_CLIENTE','CODIGO_CLIENTE']), empId);
    const cep=limparCep(pick(r,['END_CEP','CEP']));
    const key='LEGADO-ENDERECOS-'+codigo;
    let end=db.enderecosMigrados.find(e=>e.key===key || (e.empresaId===empId&&e.codigoAntigo===codigo&&e.origem==='enderecos_legado'));
    const dados={empresaId:empId,key,codigoAntigo:codigo,clienteId:cli?cli.id:null,cep,endereco:txt(pick(r,['END_ENDERECO','END_RUA','RUA','LOGRADOURO','END_LOGRADOURO'])),numero:txt(pick(r,['END_NUMERO','NUMERO'])),bairro:txt(pick(r,['END_BAIRRO','BAIRRO'])),cidade:txt(pick(r,['END_CIDADE','CIDADE'])),estado:txt(pick(r,['END_UF','UF','ESTADO'])),complemento:txt(pick(r,['END_COMPLEMENTO','COMPLEMENTO'])),data:pick(r,['END_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['END_COD_FUNCIONARIO','COD_FUNCIONARIO'])),origem:'enderecos_legado'};
    if(end) Object.assign(end,dados); else db.enderecosMigrados.push({id:uidSafe('end'),...dados});
    if(cli){
      if(cep && !txt(cli.cep)) cli.cep=cep;
      if(dados.endereco && !txt(cli.endereco)) cli.endereco=dados.endereco;
      if(dados.bairro && !txt(cli.bairro)) cli.bairro=dados.bairro;
      if(dados.cidade && !txt(cli.cidade)) cli.cidade=dados.cidade;
      if(dados.estado && !txt(cli.estado)) cli.estado=dados.estado;
      if(dados.numero && !txt(cli.numero)) cli.numero=dados.numero;
    }
    alterou++;
  });
  return alterou;
}

function sincronizarEncomendas(empId){
  const encomendas=rows('ENCOMENDAS');
  const itens=rows('ENCOMENDAS_ITENS');
  if(!encomendas.length && !itens.length) return 0;
  db.encomendasMigradas=db.encomendasMigradas||[];
  db.encomendasItensMigrados=db.encomendasItensMigrados||[];
  let alterou=0;
  encomendas.forEach(r=>{
    const codigo=cod(pick(r,['ENC_CODIGO','COD_ENCOMENDA','CODIGO'])); if(!codigo) return;
    const cliente=clientePorCodigo(pick(r,['ENC_COD_CLIENTE','COD_CLIENTE']), empId);
    let enc=db.encomendasMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,data:pick(r,['ENC_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['ENC_COD_FUNCIONARIO','COD_FUNCIONARIO'])),descricao:txt(pick(r,['ENC_DESCRICAO','DESCRICAO','OBS','OBSERVACAO'])),status:txt(pick(r,['ENC_STATUS','STATUS','SITUACAO']))||'aberta',valorTotal:num(pick(r,['ENC_VALOR_TOTAL','VALOR_TOTAL','TOTAL']),0),somenteHistorico:true};
    if(enc) Object.assign(enc,dados); else db.encomendasMigradas.push({id:uidSafe('enc'),...dados});
    alterou++;
  });
  itens.forEach(r=>{
    const codigo=cod(pick(r,['ENI_CODIGO','COD_ENCOMENDA_ITEM','CODIGO'])); if(!codigo) return;
    const prod=produtoPorCodigo(pick(r,['ENI_COD_PRODUTO','COD_PRODUTO']), empId);
    let item=db.encomendasItensMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const qtd=num(pick(r,['ENI_QTDE','QTDE','QTD']),1)||1;
    const valor=num(pick(r,['ENI_VALOR','VALOR','VALOR_UNITARIO']),0);
    const valorTotalRaw=pick(r,['ENI_VALOR_TOTAL','VALOR_TOTAL']);
    const dados={empresaId:empId,codigoAntigo:codigo,encomendaCodigoAntigo:cod(pick(r,['ENI_COD_ENCOMENDA','ENC_CODIGO','COD_ENCOMENDA'])),produtoId:prod?prod.id:null,produtoCodigoAntigo:cod(pick(r,['ENI_COD_PRODUTO','COD_PRODUTO'])),descricao:txt(pick(r,['ENI_DESCRICAO','DESCRICAO']))||(prod&&prod.nome)||'Item de encomenda',qtde:qtd,valorUnitario:valor,valorTotal:round2(txt(valorTotalRaw)===''?qtd*valor:num(valorTotalRaw,0)),data:pick(r,['ENI_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['ENI_COD_FUNCIONARIO','COD_FUNCIONARIO'])),somenteHistorico:true};
    if(item) Object.assign(item,dados); else db.encomendasItensMigrados.push({id:uidSafe('eni'),...dados});
    alterou++;
  });
  return alterou;
}

function sincronizarProdutosAuxiliaresParte9(empId){
  let alterou=0;
  const defs=[
    {tabela:'PRODUTOS_FAVORITOS', prop:'produtosFavoritosMigrados', cod:['PRF_CODIGO','CODIGO'], data:['PRF_DATA','DATA'], prod:['PRF_COD_PRODUTO','COD_PRODUTO'], cli:['PRF_COD_CLIENTE','COD_CLIENTE'], extra:r=>({qtde:num(pick(r,['PRF_QTDE','QTDE']),0)})},
    {tabela:'PRODUTOS_PROMOCAO', prop:'produtosPromocoesHistorico', cod:['PRP_CODIGO','CODIGO'], data:['PRP_DATA','DATA'], prod:['PRP_COD_PRODUTO','COD_PRODUTO'], extra:r=>({valor:num(pick(r,['PRP_VALOR','VALOR','PRECO']),0),desconto:num(pick(r,['PRP_DESCONTO','DESCONTO']),0),inicio:pick(r,['PRP_DATA_INICIO','DATA_INICIO']),fim:pick(r,['PRP_DATA_FINAL','DATA_FINAL']),somenteHistorico:true,naoAtivarPromocao:true})},
    {tabela:'PRODUTOS_TAGS', prop:'produtosTagsMigradas', cod:['PRT_CODIGO','CODIGO'], data:['PRT_DATA','DATA'], prod:['PRT_COD_PRODUTO','COD_PRODUTO'], extra:r=>({tag:txt(pick(r,['PRT_TAG','TAG','DESCRICAO','PRT_DESCRICAO']))})},
    {tabela:'PRODUTOS_DIMENSAO', prop:'produtosDimensoesMigradas', cod:['DIM_CODIGO','CODIGO'], data:['DIM_DATA','DATA'], prod:['DIM_COD_PRODUTO','COD_PRODUTO'], extra:r=>({altura:num(pick(r,['DIM_ALTURA','ALTURA']),0),largura:num(pick(r,['DIM_LARGURA','LARGURA']),0),comprimento:num(pick(r,['DIM_COMPRIMENTO','COMPRIMENTO']),0),peso:num(pick(r,['DIM_PESO','PESO']),0)})},
    {tabela:'PRODUTOS_MOTIVO_PERGUNTA', prop:'produtosMotivosPerguntaMigrados', cod:['PMP_CODIGO','CODIGO'], data:['PMP_DATA','DATA'], prod:['PMP_COD_PRODUTO','COD_PRODUTO'], extra:r=>({pergunta:txt(pick(r,['PMP_PERGUNTA','PERGUNTA','DESCRICAO'])),resposta:txt(pick(r,['PMP_RESPOSTA','RESPOSTA','OBS']))})},
    {tabela:'PRODUTOS_VALORES', prop:'produtosValoresMigrados', cod:['PV_CODIGO','CODIGO'], data:['PV_DATA','DATA'], prod:['PV_COD_PRODUTO','COD_PRODUTO'], extra:r=>({valor:num(pick(r,['PV_VALOR','VALOR','PRECO']),0),tipo:txt(pick(r,['PV_TIPO','TIPO','DESCRICAO'])),tabelaPrecoCodigoAntigo:cod(pick(r,['PV_COD_TABELA','COD_TABELA']))})}
  ];
  defs.forEach(def=>{
    const raw=rows(def.tabela); if(!raw.length) return;
    db[def.prop]=db[def.prop]||[];
    raw.forEach(r=>{
      const codigo=cod(pick(r,def.cod)); if(!codigo) return;
      const prod=produtoPorCodigo(pick(r,def.prod||[]), empId);
      const cli=clientePorCodigo(pick(r,def.cli||[]), empId);
      let obj=db[def.prop].find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,produtoId:prod?prod.id:null,produtoCodigoAntigo:cod(pick(r,def.prod||[])),clienteId:cli?cli.id:null,clienteCodigoAntigo:cod(pick(r,def.cli||[])),data:pick(r,def.data)||agora(),funcionarioCodigoAntigo:cod(pick(r,['PRP_COD_FUNCIONARIO','PRT_COD_FUNCIONARIO','DIM_COD_FUNCIONARIO','PMP_COD_FUNCIONARIO','PV_COD_FUNCIONARIO','COD_FUNCIONARIO'])),...(def.extra?def.extra(r):{})};
      if(obj) Object.assign(obj,dados); else db[def.prop].push({id:uidSafe('paux'),...dados});
      if(def.tabela==='PRODUTOS_FAVORITOS' && prod && cli){
        db.produtosFavoritos=db.produtosFavoritos||[];
        const key=prod.id+'-'+cli.id;
        if(!db.produtosFavoritos.find(f=>f.key===key)) db.produtosFavoritos.push({id:uidSafe('fav'),key,produtoId:prod.id,clienteId:cli.id,criadoEm:dados.data,origem:'migracao'});
      }
      alterou++;
    });
  });
  return alterou;
}

function campanhaPorDescricao(desc, empId){ const d=up(desc); if(!d) return null; return (db.emailCampanhasMigradas||[]).find(c=>c.empresaId===empId&&up(c.descricao)===d)||null; }
function sincronizarEmailCampanhas(empId){
  const camps=rows('EMAIL_CAMPANHA');
  const envios=rows('EMAIL_CAMPANHA_ENVIOS');
  if(!camps.length && !envios.length) return 0;
  db.emailCampanhasMigradas=db.emailCampanhasMigradas||[];
  db.emailCampanhaEnviosMigrados=db.emailCampanhaEnviosMigrados||[];
  let alterou=0;
  camps.forEach(r=>{
    const codigo=cod(pick(r,['EMC_CODIGO','CODIGO'])); if(!codigo) return;
    let c=db.emailCampanhasMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,descricao:txt(pick(r,['EMC_DESCRICAO','DESCRICAO','ASSUNTO']))||('Campanha '+codigo),data:pick(r,['EMC_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['EMC_COD_FUNCIONARIO','COD_FUNCIONARIO'])),somenteHistorico:true,envioAutomatico:false};
    if(c) Object.assign(c,dados); else db.emailCampanhasMigradas.push({id:uidSafe('emc'),...dados});
    alterou++;
  });
  envios.forEach(r=>{
    const codigo=cod(pick(r,['ECE_CODIGO','CODIGO'])); if(!codigo) return;
    let campCodigo=cod(pick(r,['ECE_COD_CAMPANHA','COD_CAMPANHA']));
    let camp=campCodigo?db.emailCampanhasMigradas.find(c=>c.empresaId===empId&&c.codigoAntigo===campCodigo):null;
    if(!camp){
      camp=campanhaPorDescricao(pick(r,['ECE_DESCRICAO','DESCRICAO','ASSUNTO']), empId);
      if(!camp){
        const novoCodigo=String((db.emailCampanhasMigradas||[]).filter(c=>c.empresaId===empId).length+1);
        camp={id:uidSafe('emc'),empresaId:empId,codigoAntigo:novoCodigo,descricao:txt(pick(r,['ECE_DESCRICAO','DESCRICAO','ASSUNTO']))||('Campanha '+novoCodigo),data:agora(),somenteHistorico:true,envioAutomatico:false,criadaPeloEnvio:true};
        db.emailCampanhasMigradas.push(camp);
      }
      campCodigo=camp.codigoAntigo;
    }
    const cliente=clientePorCodigo(pick(r,['ECE_COD_CLIENTE','COD_CLIENTE']), empId);
    let e=db.emailCampanhaEnviosMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
    const dados={empresaId:empId,codigoAntigo:codigo,campanhaId:camp?camp.id:null,campanhaCodigoAntigo:campCodigo,clienteId:cliente?cliente.id:null,email:txt(pick(r,['ECE_EMAIL','EMAIL'])).toLowerCase(),descricao:txt(pick(r,['ECE_DESCRICAO','DESCRICAO'])),data:pick(r,['ECE_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['ECE_COD_FUNCIONARIO','COD_FUNCIONARIO'])),status:txt(pick(r,['ECE_STATUS','STATUS','SITUACAO']))||'historico',somenteHistorico:true,envioAutomatico:false};
    if(e) Object.assign(e,dados); else db.emailCampanhaEnviosMigrados.push({id:uidSafe('ece'),...dados});
    alterou++;
  });
  return alterou;
}

function sincronizarCartoesEComandas(empId){
  let alterou=0;
  const bandeiras=rows('CARTAO_BANDEIRA');
  if(bandeiras.length){
    db.cartaoBandeirasMigradas=db.cartaoBandeirasMigradas||[];
    bandeiras.forEach(r=>{
      const codigo=cod(pick(r,['CAB_CODIGO','CODIGO'])); if(!codigo) return;
      let b=db.cartaoBandeirasMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,descricao:txt(pick(r,['CAB_DESCRICAO','DESCRICAO','NOME'])),data:pick(r,['CAB_DATA','DATA'])||agora(),somenteHistorico:true};
      if(b) Object.assign(b,dados); else db.cartaoBandeirasMigradas.push({id:uidSafe('cab'),...dados});
      alterou++;
    });
  }
  const cartoes=rows('CARTAO');
  if(cartoes.length){
    db.cartoesMigrados=db.cartoesMigrados||[];
    cartoes.forEach(r=>{
      const codigo=cod(pick(r,['CAR_CODIGO','CODIGO'])); if(!codigo) return;
      const cpf=pick(r,['CAR_CPF','CPF','DOCUMENTO']);
      const cliente=clientePorDocumento(cpf, empId) || clientePorCodigo(pick(r,['CAR_COD_CLIENTE','COD_CLIENTE']), empId);
      const nascimento=pick(r,['CAR_DATA_NASCIMENTO','DATA_NASCIMENTO','DT_NASCIMENTO']);
      if(cliente && nascimento && !txt(cliente.dataNascimento) && !txt(cliente.dtNascimento) && !txt(cliente.DT_NASCIMENTO)) cliente.dataNascimento=isoData(nascimento).slice(0,10)||txt(nascimento);
      let c=db.cartoesMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,titular:up(pick(r,['CAR_TITULAR','TITULAR','NOME'])),cpf:somenteDocumento(cpf),dataNascimento:nascimento?isoData(nascimento).slice(0,10):'',numeroMascarado:mascararNumeroCartao(pick(r,['CAR_NUMERO','NUMERO','CARTAO','CAR_CARTAO'])),bandeiraCodigoAntigo:cod(pick(r,['CAR_COD_BANDEIRA','COD_BANDEIRA'])),data:pick(r,['CAR_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['CAR_COD_FUNCIONARIO','COD_FUNCIONARIO'])),somenteHistorico:true,dadosSensiveisOcultos:true,baixaAutomatica:false};
      if(c) Object.assign(c,dados); else db.cartoesMigrados.push({id:uidSafe('car'),...dados});
      alterou++;
    });
  }
  const hist=rows('CARTAO_HISTORICO');
  if(hist.length){
    db.cartaoHistoricoMigrado=db.cartaoHistoricoMigrado||[];
    hist.forEach(r=>{
      const codigo=cod(pick(r,['CAH_CODIGO','CODIGO'])); if(!codigo) return;
      let h=db.cartaoHistoricoMigrado.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,cartaoCodigoAntigo:cod(pick(r,['CAH_COD_CARTAO','COD_CARTAO'])),data:pick(r,['CAH_DATA','DATA'])||agora(),descricao:txt(pick(r,['CAH_DESCRICAO','DESCRICAO','OBS'])),valor:num(pick(r,['CAH_VALOR','VALOR']),0),somenteHistorico:true};
      if(h) Object.assign(h,dados); else db.cartaoHistoricoMigrado.push({id:uidSafe('cah'),...dados});
      alterou++;
    });
  }
  const pagamentos=rows('CARTAO_PAGAMENTO');
  if(pagamentos.length){
    db.cartaoPagamentosMigrados=db.cartaoPagamentosMigrados||[];
    pagamentos.forEach(r=>{
      const codigo=cod(pick(r,['CAP_CODIGO','CODIGO'])); if(!codigo) return;
      const venda=vendaPorCodigo(pick(r,['CAP_COD_VENDA','COD_VENDA']), empId);
      let p=db.cartaoPagamentosMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,cartaoCodigoAntigo:cod(pick(r,['CAP_COD_CARTAO','COD_CARTAO'])),vendaId:venda?venda.id:null,vendaCodigoAntigo:cod(pick(r,['CAP_COD_VENDA','COD_VENDA'])),valor:num(pick(r,['CAP_VALOR','VALOR']),0),parcelas:inteiro(pick(r,['CAP_PARCELAS','PARCELAS']),1)||1,data:pick(r,['CAP_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['CAP_COD_FUNCIONARIO','COD_FUNCIONARIO'])),somenteHistorico:true,baixaAutomatica:false};
      if(p) Object.assign(p,dados); else db.cartaoPagamentosMigrados.push({id:uidSafe('cap'),...dados});
      alterou++;
    });
  }
  const comandas=rows('COMANDAS');
  if(comandas.length){
    db.comandasMigradas=db.comandasMigradas||[];
    comandas.forEach(r=>{
      const codigo=cod(pick(r,['COM_CODIGO','CODIGO'])); if(!codigo) return;
      const cliente=clientePorCodigo(pick(r,['COM_COD_CLIENTE','COD_CLIENTE']), empId);
      let c=db.comandasMigradas.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,clienteId:cliente?cliente.id:null,data:pick(r,['COM_DATA','DATA'])||agora(),funcionarioCodigoAntigo:cod(pick(r,['COM_COD_FUNCIONARIO','COD_FUNCIONARIO'])),descricao:txt(pick(r,['COM_DESCRICAO','DESCRICAO','OBS'])),status:txt(pick(r,['COM_STATUS','STATUS','SITUACAO']))||'historico',valorTotal:num(pick(r,['COM_VALOR_TOTAL','VALOR_TOTAL','TOTAL']),0),somenteHistorico:true};
      if(c) Object.assign(c,dados); else db.comandasMigradas.push({id:uidSafe('com'),...dados});
      alterou++;
    });
  }
  return alterou;
}

function numDefault(v, fb){ return txt(v)==='' ? fb : num(v, fb); }
function tributoDefaults(row){
  return {
    cstIbsCbs: txt(pick(row,['TP_CST_IBS_CBS']))||'000',
    cclassTrib: txt(pick(row,['TP_CCLASS_TRIB']))||'000001',
    pIbsUf: numDefault(pick(row,['TP_PIBS_UF']),0.1),
    pIbsMun: numDefault(pick(row,['TP_PIBS_MUN']),0),
    pCbs: numDefault(pick(row,['TP_PCBS']),0.9)
  };
}
function sincronizarFiscalAuxParte9(empId){
  let alterou=0;
  const simples=[
    {tabela:'BANCOS',prop:'bancosMigrados',cod:['COD_BANCO'],data:['DATA'],extra:r=>({nome:txt(pick(r,['BAN_NOME','NOME','DESCRICAO','BANCO'])),codigoBanco:txt(pick(r,['BAN_CODIGO','CODIGO_BANCO','NUMERO_BANCO']))})},
    {tabela:'TIPO_FINALIZACAO',prop:'tiposFinalizacaoMigrados',cod:['TF_CODIGO','CODIGO'],data:['TF_DATA','DATA'],extra:r=>({descricao:txt(pick(r,['TF_DESCRICAO','DESCRICAO','NOME']))})},
    {tabela:'CARTUCHO_DEFEITO',prop:'cartuchosDefeitosMigrados',cod:['COD_CARTUCHO_DEFEITO','CODIGO'],data:['DATA'],extra:r=>({descricao:txt(pick(r,['DESCRICAO','NOME','DEFEITO']))})}
  ];
  simples.forEach(def=>{
    const raw=rows(def.tabela); if(!raw.length) return;
    db[def.prop]=db[def.prop]||[];
    raw.forEach(r=>{
      const codigo=cod(pick(r,def.cod)); if(!codigo) return;
      let obj=db[def.prop].find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,data:pick(r,def.data)||agora(),...(def.extra?def.extra(r):{})};
      if(obj) Object.assign(obj,dados); else db[def.prop].push({id:uidSafe('faux'),...dados});
      alterou++;
    });
  });
  const ncms=rows('NCM');
  if(ncms.length){
    db.ncmMigrados=db.ncmMigrados||[];
    ncms.forEach(r=>{
      const codigo=cod(pick(r,['NC_CODIGO','CODIGO'])); if(!codigo) return;
      let n=db.ncmMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,ncm:normalizarNcm(pick(r,['NC_NCM','NCM','COD_NCM'])),descricao:txt(pick(r,['NC_DESCRICAO','DESCRICAO'])),ordem:inteiro(pick(r,['NC_ORDEM','ORDEM']),0),impostoImportacao:num(pick(r,['NC_IMPOSTO_IMPORTACAO','IMPOSTO_IMPORTACAO']),0)};
      if(n) Object.assign(n,dados); else db.ncmMigrados.push({id:uidSafe('ncm'),...dados});
      alterou++;
    });
  }
  const trib=rows('TRIBUTOS_PRODUTOS');
  if(trib.length){
    db.tributosProdutosMigrados=db.tributosProdutosMigrados||[];
    trib.forEach(r=>{
      const codigo=cod(pick(r,['TP_CODIGO','CODIGO'])); if(!codigo) return;
      const prod=produtoPorCodigo(pick(r,['TP_COD_PRODUTO','COD_PRODUTO']), empId);
      let t=db.tributosProdutosMigrados.find(x=>x.empresaId===empId&&x.codigoAntigo===codigo);
      const dados={empresaId:empId,codigoAntigo:codigo,produtoId:prod?prod.id:null,produtoCodigoAntigo:cod(pick(r,['TP_COD_PRODUTO','COD_PRODUTO'])),descricao:txt(pick(r,['TP_DESCRICAO','DESCRICAO'])),cst:txt(pick(r,['TP_CST','CST'])),cfop:txt(pick(r,['TP_CFOP','CFOP'])),ncm:normalizarNcm(pick(r,['TP_NCM','NCM'])),...tributoDefaults(r),somenteHistorico:true};
      if(t) Object.assign(t,dados); else db.tributosProdutosMigrados.push({id:uidSafe('trp'),...dados});
      alterou++;
    });
  }
  return alterou;
}

function situacaoFinalizada(empId){
  db.situacoesMigradas=db.situacoesMigradas||[];
  let sit=db.situacoesMigradas.find(s=>up(s.descricao)==='FINALIZADA');
  if(!sit){ sit={id:uidSafe('sit'),codigoAntigo:String((db.situacoesMigradas||[]).length+1),empresaId:empId,descricao:'FINALIZADA',origem:'vendas_parte9'}; db.situacoesMigradas.push(sit); }
  return sit;
}
function rawVendaPorCodigo(codigo){ const c=cod(codigo); if(!c) return null; return rows('VENDAS').find(r=>cod(pick(r,['COD_VENDA','CODIGO','NUMERO','ID']))===c)||null; }
function rawItensVenda(codigo){ const c=cod(codigo); if(!c) return []; return rows('ITENS_VENDA').filter(r=>cod(pick(r,['COD_VENDA','IV_COD_VENDA','VEN_CODIGO']))===c); }
function itemVendaTipoProduto(row, item, empId){
  const tipo=up(pick(row||{},['TIPO_DESCRICAO','TIPO','SITUACAO']) || (item&&item.tipo) || (item&&item.categoria));
  if(tipo==='PRODUTO'||tipo==='P') return true;
  if(/SERV|RECARG|MAO|MÃO/.test(tipo)) return false;
  const prod=produtoPorCodigo(pick(row||{},['COD_PRODUTO']) || (item&&item.produtoCodigoAntigo), empId) || ((item&&item.produtoId)?(db.produtos||[]).find(p=>p.id===item.produtoId):null);
  if(prod) return !/SERV|RECARG/.test(up(prod.categoria||prod.tipo));
  return true;
}
function calcularTotaisVenda(venda, raw, empId){
  const codigo=cod((raw&&pick(raw,['COD_VENDA','CODIGO','NUMERO','ID']))||venda.numero||venda.codigoAntigo);
  const itensRaw=rawItensVenda(codigo);
  let valorServ=0, valorProd=0, totalInsumos=0;
  if(itensRaw.length){
    itensRaw.forEach(r=>{
      const qtd=num(pick(r,['QTDE','QTD','QUANTIDADE']),1)||1;
      const unit=num(pick(r,['VALOR_UNITARIO','PRECO','VALOR']),0);
      const desc=num(pick(r,['VALOR_DESCONTO','DESCONTO']),0);
      const totalRaw=pick(r,['VALOR_TOTAL','TOTAL','SUBTOTAL']);
      const totalBase=txt(totalRaw)===''?(qtd*unit-desc):num(totalRaw,0);
      const bruto=round2(totalBase+desc);
      if(itemVendaTipoProduto(r,null,empId)) valorProd+=bruto; else valorServ+=bruto;
      totalInsumos+=num(pick(r,['VALOR_INSUMOS']),0);
    });
  } else {
    (venda.itens||[]).forEach(item=>{
      const bruto=round2(num(item.subtotal,0)+num(item.desconto,0));
      if(itemVendaTipoProduto(null,item,empId)) valorProd+=bruto; else valorServ+=bruto;
      totalInsumos+=num(item.valorInsumos,0);
    });
  }
  const maoObra=raw?num(pick(raw,['VALOR_MAO_DE_OBRA']),0):num(venda.valorMaoObra,0);
  const frete=raw?num(pick(raw,['VALOR_FRETE']),0):num(venda.valorFrete,0);
  const seguro=raw?num(pick(raw,['VALOR_SEGURO']),0):num(venda.valorSeguro,0);
  const acresc=raw?num(pick(raw,['VALOR_ACRESCIMO','ACRESCIMO']),0):num(venda.valorAcrescimo,0);
  const descontoRaw=raw?pick(raw,['VALOR_DESCONTO','DESCONTO']):'';
  const desconto=raw?(txt(descontoRaw)===''?num(venda.desconto,0):num(descontoRaw,0)):num(venda.desconto,0);
  const servico=round2(maoObra+valorServ);
  const total=round2(totalInsumos+valorProd+servico+frete+seguro+acresc-desconto);
  return {valorServico:servico,valorPecas:round2(valorProd),valorInsumos:round2(totalInsumos),valorFrete:frete,valorSeguro:seguro,valorAcrescimo:acresc,desconto,total:Math.max(0,total),itensRaw:itensRaw.length};
}
function aplicarRegraVendaFinalizada(v, raw, empId){
  const cfg=configRow();
  const cliente=(v.clienteId&&(db.clientes||[]).find(c=>c.id===v.clienteId)) || clientePorCodigo(raw&&pick(raw,['COD_CLIENTE']), empId);
  if(cliente){
    if(!v.clienteId) v.clienteId=cliente.id;
    if(!txt(v.clienteNomeAntigo) || (raw&&cod(pick(raw,['COD_CLIENTE']))&&cod(v.codClienteAntigo)!==cod(pick(raw,['COD_CLIENTE'])))) v.clienteNomeAntigo=cliente.nome||cliente.fantasia||v.clienteNomeAntigo;
    v.codClienteAntigo=v.codClienteAntigo||cod(cliente.codigoAntigo||cliente.codigo);
  }
  const temEquip=raw&&txt(pick(raw,['COD_EQUIPAMENTO','VEN_COD_EQUIPAMENTO']));
  if(temEquip){ v.tipo='S'; if(!txt(v.teste)) v.teste='NAO'; }
  const finalizada=raw?ehSim(pick(raw,['FINALIZADA','VEN_FINALIZADA'])):['faturado','finalizada'].includes(txt(v.status).toLowerCase());
  if(finalizada){
    v.status='finalizada';
    const sit=situacaoFinalizada(empId);
    v.situacaoCodigoAntigo=sit.codigoAntigo;
    v.dataSaida=v.dataSaida||pick(raw||{},['DATA_SAIDA'])||hoje();
    v.horaSaida=v.horaSaida||pick(raw||{},['HORA_SAIDA'])||new Date().toTimeString().slice(0,8);
    v.dataCancelado=null;
    if(v.tipo==='S' && !v.dataGarantia){
      const dias=inteiro(pick(cfg,['DIAS_GARANTIA_SERVICO']),0);
      if(dias>0) v.dataGarantia=dataMaisDias(v.data||pick(raw||{},['DATA'])||hoje(), dias);
    }
    if(up(pick(cfg,['MUDAR_FORMA_ENTREGA_AUTO']))==='S' && up(v.formaEntrega||pick(raw||{},['FORMA_ENTREGA']))==='BUSCAR') v.formaEntrega='ENTREGAR';
  } else if(raw && up(pick(raw,['FINALIZADA']))==='N'){
    v.status=v.status==='finalizada'?'aguardar':(v.status||'aguardar');
    v.P='N'; v.C='N'; v.T='N';
    db.itensRecebimentoMigrados=(db.itensRecebimentoMigrados||[]).filter(ir=>ir.vendaId!==v.id && cod(ir.vendaCodigoAntigo)!==cod(v.numero));
  }
  if(up(pick(cfg,['COM_VEND_VENDEDOR_CLIENTE']))==='S' && cliente){
    v.codFuncionarioComissao=funcionarioComissaoCliente(cliente)||cod(pick(raw||{},['COD_FUNCIONARIO']));
  } else if(raw){
    v.codFuncionarioComissao=cod(pick(raw,['COD_FUNCIONARIO']));
  }
  const calc=calcularTotaisVenda(v, raw, empId);
  v.valorServico=calc.valorServico;
  v.valorPecas=calc.valorPecas;
  v.valorInsumos=calc.valorInsumos;
  v.valorFrete=calc.valorFrete;
  v.valorSeguro=calc.valorSeguro;
  v.valorAcrescimo=calc.valorAcrescimo;
  if(calc.desconto || raw) v.desconto=calc.desconto;
  if(raw && (calc.itensRaw || calc.total>0)) v.total=calc.total;
  v.dataAlteracao=agora();
  return 1;
}
function limparVinculosVendaExcluida(v){
  v.status='excluida';
  v.excluida=true;
  const codVenda=cod(v.numero||v.codigoAntigo);
  (db.agendaMigrada||[]).forEach(a=>{ if(a.vendaId===v.id || cod(a.codVenda)===codVenda || cod(a.vendaCodigoAntigo)===codVenda){ a.vendaId=null; a.codVenda=''; a.estornar=false; } });
  (db.vendas||[]).forEach(o=>{ if(o.orcamentoCodigoAntigo && o.vendaGeradaId===v.id){ o.vendaGeradaId=null; o.status='orcamento'; } });
  (db.os||[]).forEach(o=>{ if(o.vendaId===v.id || cod(o.vendaCodigoAntigo)===codVenda){ o.vendaId=null; o.vendaGeradaId=null; } });
  (db.despesasLocacao||[]).forEach(d=>{ if(d.vendaId===v.id || cod(d.vendaCodigoAntigo)===codVenda || cod(d.dpCodVenda)===codVenda){ d.removidaPorVendaExcluida=true; d.vendaId=null; } });
}
function aplicarRegrasVendasParte9(empId){
  const vendas=(db.vendas||[]).filter(v=>v.empresaId===empId);
  const rawRows=rows('VENDAS');
  if(!vendas.length && !rawRows.length) return 0;
  let alterou=0;
  vendas.forEach(v=>{
    const raw=rawVendaPorCodigo(v.numero||v.codigoAntigo||v.idLegado);
    if(!raw) return;
    if(Number(pick(raw,['DEL','VEN_DEL']))===1){ limparVinculosVendaExcluida(v); alterou++; return; }
    alterou+=aplicarRegraVendaFinalizada(v, raw, empId);
    if(v.empresaId){ (db.contasReceber||[]).forEach(cr=>{ if(cr.vendaId===v.id && cr.empresaId!==v.empresaId){ cr.empresaId=v.empresaId; alterou++; } }); }
    if(v.tipo==='S' && !v.osId && (v.os||txt(pick(raw,['COD_EQUIPAMENTO','DEFEITO','PROBLEMA'])))){
      db.os=db.os||[];
      let os=db.os.find(o=>o.empresaId===empId&&o.vendaId===v.id);
      if(!os){ os={id:uidSafe('os'),empresaId:empId,vendaId:v.id,numero:v.numero,clienteId:v.clienteId,status:v.status==='finalizada'?'concluido':'aberto',problema:txt(pick(raw,['DEFEITO','PROBLEMA']))||'Chamado gerado pela venda migrada',descricao:txt(pick(raw,['SERVICOS','SOLUCAO','OBS'])),criadoPor:'migracao',criadoPorNome:'Migração',criadoEm:agora()}; db.os.push(os); v.osId=os.id; alterou++; }
    }
  });
  return alterou;
}

function aplicarAutomacoesVendasFiscalAuxiliares(empId){
  if(!db||!empId) return 0;
  db.config=db.config||{}; db.config.automacoes=db.config.automacoes||{};
  const sig=assinaturaTabela(['CUPONS_ITENS','CUPONS','ENDERECOS','ENCOMENDAS','ENCOMENDAS_ITENS','PRODUTOS_FAVORITOS','PRODUTOS_PROMOCAO','PRODUTOS_TAGS','EMAIL_CAMPANHA','EMAIL_CAMPANHA_ENVIOS','PRODUTOS_DIMENSAO','PRODUTOS_MOTIVO_PERGUNTA','CARTAO_BANDEIRA','CARTAO','CARTAO_HISTORICO','COMANDAS','PRODUTOS_VALORES','CARTAO_PAGAMENTO','BANCOS','NCM','TIPO_FINALIZACAO','CARTUCHO_DEFEITO','TRIBUTOS_PRODUTOS','VENDAS','ITENS_VENDA','CONFIGURACAO']);
  if(db.config.automacoes.vendasFiscalAuxParte9Assinatura===sig) return 0;
  let total=0;
  total+=sincronizarCuponsItens(empId);
  total+=sincronizarEnderecosLegado(empId);
  total+=sincronizarEncomendas(empId);
  total+=sincronizarProdutosAuxiliaresParte9(empId);
  total+=sincronizarEmailCampanhas(empId);
  total+=sincronizarCartoesEComandas(empId);
  total+=sincronizarFiscalAuxParte9(empId);
  total+=aplicarRegrasVendasParte9(empId);
  db.config.automacoes.vendasFiscalAuxParte9Assinatura=sig;
  if(total) salvar();
  return total;
}

window.AUTOMACOES_VENDAS_FISCAL_AUX_PURE={ normalizarNcm, mascararNumeroCartao, tributoDefaults, calcularTotaisVenda, sincronizarCuponsItens, sincronizarEnderecosLegado, sincronizarEncomendas, sincronizarProdutosAuxiliaresParte9, sincronizarEmailCampanhas, sincronizarCartoesEComandas, sincronizarFiscalAuxParte9, aplicarRegrasVendasParte9, aplicarAutomacoesVendasFiscalAuxiliares };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const s=sess(); if(s) aplicarAutomacoesVendasFiscalAuxiliares(s.empresaId); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_vendas_fiscal_auxiliares', run, 1000); else setTimeout(run, 1000); return ret; };
const oldRenderVendas=window.renderVendas;
window.renderVendas=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_vendas_fiscal_auxiliares', run, 0); else run(); return oldRenderVendas?oldRenderVendas.apply(this,arguments):undefined; };
const oldRenderProdutos=window.renderProdutos;
window.renderProdutos=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_vendas_fiscal_auxiliares', run, 0); else run(); return oldRenderProdutos?oldRenderProdutos.apply(this,arguments):undefined; };
const oldRenderFinanceiro=window.renderFinanceiro;
window.renderFinanceiro=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_vendas_fiscal_auxiliares', run, 0); else run(); return oldRenderFinanceiro?oldRenderFinanceiro.apply(this,arguments):undefined; };
const oldRenderClientes=window.renderClientes;
window.renderClientes=function(){ if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_vendas_fiscal_auxiliares', run, 0); else run(); return oldRenderClientes?oldRenderClientes.apply(this,arguments):undefined; };
if(window.DIGI_TURBO&&window.DIGI_TURBO.auto) window.DIGI_TURBO.auto('automacoes_vendas_fiscal_auxiliares', run, 2200); else setTimeout(run, 2200);
console.log('[DIGICOPY] automacoes_vendas_fiscal_auxiliares_patch.js v4.9.29 carregado');
})();
