// ═══════════════════════════════════════════════════════════════════════════
// v5.22.1 — conferência NF-e (modelo 55) da venda e da leitura
// • Regime: Simples Nacional (CRT 1), não é MEI
// • Só emite o PC que tiver o A1 local. Qualquer pessoa desse PC pode conferir
// • Ainda NÃO envia para a SEFAZ. Monta o XML e mostra o que falta
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function soDigitos(v){ return String(v==null?'':v).replace(/\D/g,''); }
function escXml(v){
  return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
}
function money2(v){
  const n=Number(v);
  return (Number.isFinite(n)?n:0).toFixed(2);
}
function money4(v){
  const n=Number(v);
  return (Number.isFinite(n)?n:0).toFixed(4);
}
function pad(n,len){ return String(n==null?'':n).replace(/\D/g,'').padStart(len,'0').slice(-len); }
function onlyUpper(v){ return txt(v).toUpperCase(); }

const IBGE_MG={
  'JAIBA':'3135050','JAÍBA':'3135050',
  'JANAUBA':'3135100','JANAÚBA':'3135100',
  'MONTES CLAROS':'3143302',
  'BELO HORIZONTE':'3106200',
  'PORTEIRINHA':'3152204',
  'ESPINOSA':'3124302',
  'GAMELEIRAS':'3127339',
  'MAMONAS':'3139250',
  'MONTE AZUL':'3142908',
  'MATIAS CARDOSO':'3140852',
  'VERDELANDIA':'3171030','VERDELÂNDIA':'3171030',
  'SAO FRANCISCO':'3161106','SÃO FRANCISCO':'3161106',
  'PIRAPORA':'3151206',
  'VARZEA DA PALMA':'3170800','VÁRZEA DA PALMA':'3170800',
  'BOCAIUVA':'3107307'
};

function codigoIbge(cidade,uf){
  const u=onlyUpper(uf||'MG');
  if(u!=='MG') return '';
  return IBGE_MG[onlyUpper(cidade)]||'';
}
function dvModulo11(base){
  let peso=2,soma=0;
  for(let i=base.length-1;i>=0;i--){
    soma+=Number(base[i])*peso;
    peso=peso===9?2:peso+1;
  }
  const r=soma%11;
  return (r===0||r===1)?0:11-r;
}
function proximoNumeroNfe(lista,serie){
  const s=txt(serie)||'1';
  let max=0;
  (lista||[]).forEach(x=>{
    const nfe=x&&x.nfe;
    if(!nfe) return;
    if(txt(nfe.serie||'1')!==s) return;
    const n=parseInt(soDigitos(nfe.numero),10);
    if(n>max) max=n;
  });
  return String(max+1);
}
function fiscalPadrao(f){
  const x=f||{};
  return {
    ie:txt(x.ie),
    crt:'1',
    serie:txt(x.serie)||'1',
    ambiente:txt(x.ambiente)||'2',
    uf:txt(x.uf)||'MG',
    simplesDesde:txt(x.simplesDesde)||'2007-07-01',
    simei:false,
    cfopVenda:txt(x.cfopVenda)||'5102',
    cfopLeitura:txt(x.cfopLeitura)||'5949',
    csosn:txt(x.csosn)||'102',
    ncmPadrao:soDigitos(x.ncmPadrao)
  };
}
function emitenteDe(loja,fiscal){
  const l=loja||{};
  const f=fiscalPadrao(fiscal);
  const cnpj=soDigitos(l.cnpj);
  const uf=onlyUpper(l.uf||l.estado||f.uf||'MG');
  const cidade=txt(l.cidade||l.municipio);
  return {
    cnpj,
    ie:soDigitos(f.ie||l.ie||l.inscricaoEstadual),
    xNome:txt(l.razaoSocial||l.nome),
    xFant:txt(l.fantasia||l.nome),
    xlgr:txt(l.rua||l.logradouro||''),
    nro:txt(l.numero)||'S/N',
    xbairro:txt(l.bairro),
    cMun:codigoIbge(cidade,uf),
    xMun:cidade,
    uf,
    cep:soDigitos(l.cep),
    fone:soDigitos(l.telefone||l.fone),
    crt:'1'
  };
}
function destDe(cli){
  const c=cli||{};
  const doc=soDigitos(c.documento||c.cnpj||c.cpf);
  const uf=onlyUpper(c.estado||c.uf||'');
  const cidade=txt(c.cidade||c.municipio);
  return {
    doc,
    tipo:doc.length===14?'CNPJ':(doc.length===11?'CPF':''),
    ie:soDigitos(c.rgIE||c.ie||c.inscricaoEstadual),
    xNome:txt(c.nome||c.razaoSocial),
    xlgr:txt(c.rua||c.logradouro||c.endereco),
    nro:txt(c.numero)||'S/N',
    xbairro:txt(c.bairro),
    cMun:codigoIbge(cidade,uf),
    xMun:cidade,
    uf,
    cep:soDigitos(c.cep),
    fone:soDigitos(c.telefone||c.whatsapp)
  };
}
function itemEhServico(it){
  const t=txt(it&&it.tipo);
  return /servi[cç]o|manuten|leitura|loca[cç]/i.test(t);
}
function ncmDoItem(it,prod,fiscal){
  const f=fiscalPadrao(fiscal);
  const n=soDigitos((it&&(it.ncm||it.NCM))||(prod&&(prod.ncm||prod.NCM))||f.ncmPadrao);
  return n;
}
function cfopDoItem(it,emitUf,destUf,fiscal,origem){
  const f=fiscalPadrao(fiscal);
  const intra=onlyUpper(emitUf)===onlyUpper(destUf||emitUf);
  if(origem==='leitura') return intra?(f.cfopLeitura||'5949'):'6949';
  if(itemEhServico(it)) return intra?'5933':'6933';
  const base=f.cfopVenda||'5102';
  if(intra) return base;
  return base.replace(/^5/,'6');
}
function itensDeVenda(venda,produtos,fiscal,emitUf,destUf){
  const lista=(venda&&venda.itens)||[];
  const prods=produtos||[];
  const out=[];
  lista.forEach(it=>{
    const p=it.produtoId?prods.find(x=>x.id===it.produtoId):null;
    const qtd=Number(it.qtd)||0;
    const vUn=Number(it.preco)||0;
    const vDesc=Number(it.desconto)||0;
    const vProd=Math.max(0,qtd*vUn);
    const vItem=Math.max(0,vProd-vDesc);
    out.push({
      xProd:txt(it.descricao||(p&&p.nome)||'Item'),
      ncm:ncmDoItem(it,p,fiscal),
      cfop:cfopDoItem(it,emitUf,destUf,fiscal,'venda'),
      uCom:'UN',
      qCom:qtd,
      vUnCom:vUn,
      vProd,
      vDesc,
      vItem,
      csosn:fiscalPadrao(fiscal).csosn,
      tipo:txt(it.tipo||'Produto')
    });
  });
  const os=venda&&venda.os;
  const valOS=os?Number(os.valorServico)||0:0;
  if(valOS>0){
    out.push({
      xProd:'Serviço OS '+(os.numero||''),
      ncm:ncmDoItem({ncm:(fiscal&&fiscal.ncmPadrao)},null,fiscal),
      cfop:cfopDoItem({tipo:'Serviço'},emitUf,destUf,fiscal,'venda'),
      uCom:'UN',
      qCom:1,
      vUnCom:valOS,
      vProd:valOS,
      vDesc:Number(os.desconto)||0,
      vItem:Math.max(0,valOS-(Number(os.desconto)||0)),
      csosn:fiscalPadrao(fiscal).csosn,
      tipo:'Serviço'
    });
  }
  return out;
}
function itensDeLeitura(leitura,fiscal,emitUf,destUf){
  const total=(leitura.itens||[]).reduce((s,x)=>s+(Number(x.valorTotal)||0),0)||Number(leitura.valorTotal||leitura.valorExcedente)||0;
  return [{
    xProd:'Locação / cópias — leitura '+(leitura.numero||''),
    ncm:ncmDoItem({},null,fiscal),
    cfop:cfopDoItem({tipo:'Locação'},emitUf,destUf,fiscal,'leitura'),
    uCom:'UN',
    qCom:1,
    vUnCom:total,
    vProd:total,
    vDesc:0,
    vItem:total,
    csosn:fiscalPadrao(fiscal).csosn,
    tipo:'Locação'
  }];
}
function validarEmitente(em){
  const e=[];
  if(soDigitos(em.cnpj).length!==14) e.push('CNPJ da loja');
  if(!em.ie) e.push('Inscrição Estadual da loja');
  if(!em.xNome) e.push('Razão social da loja');
  if(!em.xlgr) e.push('Rua da loja');
  if(!em.xbairro) e.push('Bairro da loja');
  if(!em.xMun) e.push('Cidade da loja');
  if(!em.uf) e.push('UF da loja');
  if(soDigitos(em.cep).length!==8) e.push('CEP da loja');
  if(!em.cMun) e.push('Código IBGE da cidade da loja (confira o nome da cidade)');
  return e;
}
function validarDest(d){
  const e=[];
  if(!d.xNome) e.push('Nome do cliente');
  if(d.tipo!=='CPF'&&d.tipo!=='CNPJ') e.push('CPF ou CNPJ do cliente');
  if(!d.xlgr) e.push('Endereço do cliente');
  if(!d.xMun) e.push('Cidade do cliente');
  if(!d.uf) e.push('UF do cliente');
  if(soDigitos(d.cep).length&&soDigitos(d.cep).length!==8) e.push('CEP do cliente');
  if(d.xMun&&d.uf&&!d.cMun) e.push('Código IBGE da cidade do cliente');
  return e;
}
function validarItens(itens){
  const e=[];
  if(!itens.length) e.push('Nenhum item para a nota');
  itens.forEach((it,i)=>{
    const n=i+1;
    if(!it.xProd) e.push('Descrição do item '+n);
    if(soDigitos(it.ncm).length!==8) e.push('NCM do item '+n+' (8 números)');
    if(!it.cfop) e.push('CFOP do item '+n);
    if(!(Number(it.qCom)>0)) e.push('Quantidade do item '+n);
    if(!(Number(it.vItem)>0)&&itens.length===1) e.push('Valor do item '+n);
  });
  const total=itens.reduce((s,x)=>s+(Number(x.vItem)||0),0);
  if(!(total>0)) e.push('Valor total da nota');
  return e;
}
function montarChave(em,ide){
  const base=pad(ide.cUF,2)+pad(ide.AAMM,4)+pad(em.cnpj,14)+pad(ide.mod,2)+pad(ide.serie,3)+pad(ide.nNF,9)+pad(ide.tpEmis,1)+pad(ide.cNF,8);
  return base+String(dvModulo11(base));
}
function montarIde(fiscal,numero,dataRef,cUF){
  const f=fiscalPadrao(fiscal);
  const d=dataRef?new Date(dataRef):new Date();
  const iso=isNaN(d.getTime())?new Date():d;
  const y=iso.getFullYear();
  const m=pad(iso.getMonth()+1,2);
  const day=pad(iso.getDate(),2);
  const hh=pad(iso.getHours(),2);
  const mm=pad(iso.getMinutes(),2);
  const ss=pad(iso.getSeconds(),2);
  const cNF=pad(Math.floor(Math.random()*99999999),8);
  return {
    cUF:cUF||'31',
    cNF,
    natOp:'VENDA',
    mod:'55',
    serie:f.serie||'1',
    nNF:String(numero||'1'),
    dhEmi:y+'-'+m+'-'+day+'T'+hh+':'+mm+':'+ss+'-03:00',
    AAMM:String(y).slice(2)+m,
    tpNF:'1',
    idDest:'1',
    cMunFG:'',
    tpImp:'1',
    tpEmis:'1',
    tpAmb:f.ambiente||'2',
    finNFe:'1',
    indFinal:'1',
    indPres:'1',
    procEmi:'0',
    verProc:'5.22.1'
  };
}
function montarDocumento(opts){
  const fiscal=fiscalPadrao(opts.fiscal);
  const loja=opts.loja||{};
  const em=emitenteDe(loja,fiscal);
  const dest=destDe(opts.cliente||{});
  const origem=opts.origem==='leitura'?'leitura':'venda';
  const itens=origem==='leitura'
    ?itensDeLeitura(opts.leitura||{},fiscal,em.uf,dest.uf)
    :itensDeVenda(opts.venda||{},opts.produtos||[],fiscal,em.uf,dest.uf);
  const erros=[].concat(validarEmitente(em),validarDest(dest),validarItens(itens));
  if(!opts.certificadoLocal) erros.unshift('Certificado A1 só neste computador. Carregue o .pfx no PC da loja.');
  const numero=opts.numero||proximoNumeroNfe(opts.existentes||[],fiscal.serie);
  const ide=montarIde(fiscal,numero,opts.data,em.uf==='MG'?'31':'31');
  ide.cMunFG=em.cMun;
  ide.idDest=onlyUpper(em.uf)===onlyUpper(dest.uf||em.uf)?'1':'2';
  ide.natOp=origem==='leitura'?'LOCACAO / COPIAS':'VENDA';
  const vNF=itens.reduce((s,x)=>s+(Number(x.vItem)||0),0);
  const vProd=itens.reduce((s,x)=>s+(Number(x.vProd)||0),0);
  const vDesc=itens.reduce((s,x)=>s+(Number(x.vDesc)||0),0);
  const chave=erros.length? '':montarChave(em,ide);
  return {
    ok:erros.length===0,
    erros,
    origem,
    crt:'1',
    ambiente:ide.tpAmb,
    serie:ide.serie,
    numero:ide.nNF,
    chave,
    emit:em,
    dest,
    itens,
    totais:{vProd,vDesc,vNF},
    ide
  };
}
function xmlInfNfe(doc){
  const em=doc.emit,d=doc.dest,ide=doc.ide;
  const destDoc=d.tipo==='CNPJ'
    ?'<CNPJ>'+d.doc+'</CNPJ>'
    :'<CPF>'+d.doc+'</CPF>';
  const destIE=d.ie?'<IE>'+d.ie+'</IE>':'<indIEDest>9</indIEDest>';
  const dets=doc.itens.map((it,i)=>{
    const nItem=i+1;
    return '<det nItem="'+nItem+'"><prod>'+
      '<cProd>'+nItem+'</cProd>'+
      '<cEAN>SEM GTIN</cEAN>'+
      '<xProd>'+escXml(it.xProd)+'</xProd>'+
      '<NCM>'+it.ncm+'</NCM>'+
      '<CFOP>'+it.cfop+'</CFOP>'+
      '<uCom>'+it.uCom+'</uCom>'+
      '<qCom>'+money4(it.qCom)+'</qCom>'+
      '<vUnCom>'+money4(it.vUnCom)+'</vUnCom>'+
      '<vProd>'+money2(it.vProd)+'</vProd>'+
      '<cEANTrib>SEM GTIN</cEANTrib>'+
      '<uTrib>'+it.uCom+'</uTrib>'+
      '<qTrib>'+money4(it.qCom)+'</qTrib>'+
      '<vUnTrib>'+money4(it.vUnCom)+'</vUnTrib>'+
      (Number(it.vDesc)>0?'<vDesc>'+money2(it.vDesc)+'</vDesc>':'')+
      '<indTot>1</indTot>'+
      '</prod><imposto><ICMS><ICMSSN102><orig>0</orig><CSOSN>'+it.csosn+'</CSOSN></ICMSSN102></ICMS>'+
      '<PIS><PISNT><CST>07</CST></PISNT></PIS>'+
      '<COFINS><COFINSNT><CST>07</CST></COFINSNT></COFINS>'+
      '</imposto></det>';
  }).join('');
  const id=doc.chave?'NFe'+doc.chave:'NFe';
  return '<infNFe versao="4.00" Id="'+id+'">'+
    '<ide>'+
    '<cUF>'+ide.cUF+'</cUF>'+
    '<cNF>'+ide.cNF+'</cNF>'+
    '<natOp>'+escXml(ide.natOp)+'</natOp>'+
    '<mod>'+ide.mod+'</mod>'+
    '<serie>'+ide.serie+'</serie>'+
    '<nNF>'+ide.nNF+'</nNF>'+
    '<dhEmi>'+ide.dhEmi+'</dhEmi>'+
    '<tpNF>'+ide.tpNF+'</tpNF>'+
    '<idDest>'+ide.idDest+'</idDest>'+
    '<cMunFG>'+(ide.cMunFG||'')+'</cMunFG>'+
    '<tpImp>'+ide.tpImp+'</tpImp>'+
    '<tpEmis>'+ide.tpEmis+'</tpEmis>'+
    '<cDV>'+(doc.chave?doc.chave.slice(-1):'0')+'</cDV>'+
    '<tpAmb>'+ide.tpAmb+'</tpAmb>'+
    '<finNFe>'+ide.finNFe+'</finNFe>'+
    '<indFinal>'+ide.indFinal+'</indFinal>'+
    '<indPres>'+ide.indPres+'</indPres>'+
    '<procEmi>'+ide.procEmi+'</procEmi>'+
    '<verProc>'+ide.verProc+'</verProc>'+
    '</ide>'+
    '<emit><CNPJ>'+em.cnpj+'</CNPJ><xNome>'+escXml(em.xNome)+'</xNome>'+
    (em.xFant?'<xFant>'+escXml(em.xFant)+'</xFant>':'')+
    '<enderEmit><xLgr>'+escXml(em.xlgr)+'</xLgr><nro>'+escXml(em.nro)+'</nro>'+
    '<xBairro>'+escXml(em.xbairro)+'</xBairro><cMun>'+em.cMun+'</cMun>'+
    '<xMun>'+escXml(em.xMun)+'</xMun><UF>'+em.uf+'</UF><CEP>'+em.cep+'</CEP>'+
    '<cPais>1058</cPais><xPais>BRASIL</xPais>'+(em.fone?'<fone>'+em.fone+'</fone>':'')+
    '</enderEmit><IE>'+em.ie+'</IE><CRT>1</CRT></emit>'+
    '<dest>'+destDoc+'<xNome>'+escXml(d.xNome)+'</xNome>'+
    '<enderDest><xLgr>'+escXml(d.xlgr)+'</xLgr><nro>'+escXml(d.nro)+'</nro>'+
    (d.xbairro?'<xBairro>'+escXml(d.xbairro)+'</xBairro>':'')+
    '<cMun>'+(d.cMun||em.cMun)+'</cMun><xMun>'+escXml(d.xMun||em.xMun)+'</xMun>'+
    '<UF>'+(d.uf||em.uf)+'</UF>'+(d.cep?'<CEP>'+d.cep+'</CEP>':'')+
    '<cPais>1058</cPais><xPais>BRASIL</xPais></enderDest>'+destIE+
    '</dest>'+dets+
    '<total><ICMSTot>'+
    '<vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson>'+
    '<vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet>'+
    '<vProd>'+money2(doc.totais.vProd)+'</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg>'+
    '<vDesc>'+money2(doc.totais.vDesc)+'</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol>'+
    '<vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>'+money2(doc.totais.vNF)+'</vNF>'+
    '</ICMSTot></total>'+
    '<transp><modFrete>9</modFrete></transp>'+
    '<pag><detPag><indPag>0</indPag><tPag>90</tPag><vPag>'+money2(doc.totais.vNF)+'</vPag></detPag></pag>'+
    '<infAdic><infCpl>Documento gerado pelo Sistema Digicopy. Ainda nao enviado a SEFAZ.</infCpl></infAdic>'+
    '</infNFe>';
}
function montarXml(doc){
  return '<?xml version="1.0" encoding="UTF-8"?>'+
    '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">'+xmlInfNfe(doc)+'</NFe>';
}

window.NFE_EMISSAO_PURE={
  fiscalPadrao,emitenteDe,destDe,itensDeVenda,itensDeLeitura,
  validarEmitente,validarDest,validarItens,proximoNumeroNfe,
  montarDocumento,montarXml,montarChave,codigoIbge,dvModulo11
};

if(typeof document==='undefined') return;

function lojaAtual(){
  const cfg=(typeof db!=='undefined' && db.config)||{};
  return Object.assign({}, (typeof db!=='undefined' && (db.empresas||[])[0])||{}, cfg.loja||{});
}
function fiscalAtual(){
  const f=(typeof db!=='undefined' && db.config && db.config.fiscal)||{};
  return fiscalPadrao(f);
}
function garantirFiscalSimples(){
  if(typeof db==='undefined') return;
  db.config=db.config||{};
  const atual=db.config.fiscal||{};
  db.config.fiscal=Object.assign({},atual,fiscalPadrao(atual),{
    crt:'1',
    simei:false,
    simplesDesde:atual.simplesDesde||'2007-07-01'
  });
}
async function temA1NestePc(){
  const api=window.nfeCertAPI;
  if(!api||typeof api.status!=='function') return false;
  try{
    const st=await api.status();
    return !!(st&&st.installed);
  }catch(e){ return false; }
}
function clienteDe(id){
  return ((typeof db!=='undefined' && db.clientes)||[]).find(c=>c.id===id)||null;
}
function mostrarConferencia(doc,origemLabel){
  let root=document.getElementById('nfe-conf-modal');
  if(root) root.remove();
  root=document.createElement('div');
  root.id='nfe-conf-modal';
  root.style.cssText='position:fixed;inset:0;z-index:100050;background:rgba(15,23,42,.62);display:flex;align-items:center;justify-content:center;padding:18px';
  const ok=doc.ok;
  const erros=(doc.erros||[]).map(x=>'<li>'+x.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</li>').join('');
  const itens=(doc.itens||[]).map(it=>'<tr><td>'+escXml(it.xProd)+'</td><td>'+(it.ncm||'-')+'</td><td>'+it.cfop+'</td><td>'+money2(it.vItem)+'</td></tr>').join('');
  root.innerHTML='<div style="width:min(720px,96vw);max-height:92vh;overflow:auto;background:white;border-radius:18px;box-shadow:0 25px 80px rgba(0,0,0,.35)">'+
    '<div style="padding:16px 20px;background:linear-gradient(135deg,#0a1e8a,#0876c9);color:white;display:flex;justify-content:space-between;align-items:center">'+
    '<div><b>NF-e — conferência</b><div style="font-size:11px;opacity:.8;margin-top:3px">'+origemLabel+' • Simples Nacional • ainda não envia à SEFAZ</div></div>'+
    '<button id="nfe-conf-x" style="font-size:24px;line-height:1;padding:4px 10px">×</button></div>'+
    '<div style="padding:18px;font-size:13px;color:#334155">'+
    '<p style="padding:10px 12px;border-radius:10px;background:'+(ok?'#f0fdf4':'#fef2f2')+';color:'+(ok?'#166534':'#991b1b')+'">'+(ok?'Dados suficientes para montar o XML. O envio à SEFAZ ainda não está ligado.':'Falta preencher: ')+'</p>'+
    (ok?'':'<ul style="margin:10px 0 14px 18px">'+erros+'</ul>')+
    '<p><b>Série</b> '+doc.serie+' • <b>Número previsto</b> '+doc.numero+(doc.chave?' • <b>Chave</b> '+doc.chave:'')+'</p>'+
    '<p><b>Emitente</b> '+(doc.emit.xNome||'-')+' • '+(doc.emit.cnpj||'-')+'</p>'+
    '<p><b>Cliente</b> '+(doc.dest.xNome||'-')+' • '+(doc.dest.doc||'-')+'</p>'+
    '<table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:12px"><thead><tr style="text-align:left;background:#f8fafc"><th style="padding:6px;border-bottom:1px solid #e2e8f0">Item</th><th>NCM</th><th>CFOP</th><th>Valor</th></tr></thead><tbody>'+itens+'</tbody></table>'+
    '<p style="margin-top:12px;font-weight:800">Total: R$ '+money2(doc.totais.vNF)+'</p>'+
    (ok?'<p style="margin-top:10px;font-size:12px;color:#64748b">Rascunho salvo nesta venda/leitura. Próximo passo: assinar com o A1 e mandar para homologação.</p>':'')+
    '</div></div>';
  document.body.appendChild(root);
  root.querySelector('#nfe-conf-x').onclick=function(){ root.remove(); };
  root.addEventListener('click',function(ev){ if(ev.target===root) root.remove(); });
}
function gravarRascunho(alvo,doc){
  if(!alvo) return;
  alvo.nfe={
    status:doc.ok?'rascunho':'incompleta',
    ambiente:doc.ambiente,
    serie:doc.serie,
    numero:doc.numero,
    chave:doc.chave||'',
    total:doc.totais.vNF,
    erros:doc.erros.slice(),
    xml:doc.ok?montarXml(doc):'',
    atualizadoEm:new Date().toISOString()
  };
  if(typeof saveDB==='function') saveDB();
}
window.conferirNfe=async function(tipo,id){
  garantirFiscalSimples();
  const cert=await temA1NestePc();
  const fiscal=fiscalAtual();
  const loja=lojaAtual();
  let origem='venda', alvo=null, cliente=null, label='Venda';
  if(tipo==='leitura'){
    origem='leitura';
    alvo=((db.leituras||[]).find(x=>x.id===id))||null;
    if(!alvo){ if(typeof toast==='function') toast('Leitura não encontrada','error'); return; }
    const contrato=(db.contratos||[]).find(c=>c.id===alvo.contratoId);
    cliente=clienteDe(alvo.clienteId||(contrato&&contrato.clienteId));
    label='Leitura '+(alvo.numero||'');
  }else{
    alvo=((db.vendas||[]).find(x=>x.id===id))||null;
    if(!alvo){ if(typeof toast==='function') toast('Venda não encontrada','error'); return; }
    cliente=clienteDe(alvo.clienteId);
    label='Venda '+(alvo.numero||'');
  }
  const existentes=[].concat(db.vendas||[],db.leituras||[]);
  const doc=montarDocumento({
    origem,
    venda:origem==='venda'?alvo:null,
    leitura:origem==='leitura'?alvo:null,
    cliente,
    loja,
    fiscal,
    produtos:db.produtos||[],
    existentes,
    certificadoLocal:cert,
    data:alvo.data||alvo.dataLeitura||alvo.criadoEm,
    numero:(alvo.nfe&&alvo.nfe.numero)||proximoNumeroNfe(existentes,fiscal.serie)
  });
  gravarRascunho(alvo,doc);
  mostrarConferencia(doc,label);
};
function injetarBotao(footer,tipo,id){
  if(!footer||!id||footer.querySelector('[data-nfe-emit]')) return;
  const b=document.createElement('button');
  b.setAttribute('data-nfe-emit','1');
  b.type='button';
  b.className='h-[44px] px-5 rounded-xl bg-[#0a1e8a] text-white font-bold flex items-center gap-2';
  b.innerHTML='<i class="ph ph-file-text"></i> Conferir NF-e';
  b.onclick=function(ev){
    if(ev){ ev.preventDefault(); ev.stopPropagation(); }
    window.conferirNfe(tipo,id);
  };
  footer.appendChild(b);
}
function wrap(nome,tipo,pegarId){
  const orig=window[nome];
  if(typeof orig!=='function'||orig.__v5221) return;
  window[nome]=function(){
    const id=pegarId?pegarId.apply(null,arguments):arguments[0];
    const r=orig.apply(this,arguments);
    setTimeout(function(){ injetarBotao(document.getElementById('modal-footer'),tipo,id); },80);
    setTimeout(function(){ injetarBotao(document.getElementById('modal-footer'),tipo,id); },240);
    return r;
  };
  window[nome].__v5221=true;
}
wrap('historicoVenda','venda');
wrap('showVenda','venda');
wrap('abrirLeituraDefinitiva','leitura');
wrap('abrirLeituraContratoDetalhe','leitura');
wrap('vosCarregarVendaNaTela','venda');

const oldLock=window.lockVendaFaturadaUI;
if(typeof oldLock==='function'&&!oldLock.__v5221){
  window.lockVendaFaturadaUI=function(vendaId){
    const r=oldLock.apply(this,arguments);
    setTimeout(function(){ injetarBotao(document.getElementById('modal-footer'),'venda',vendaId); },80);
    return r;
  };
  window.lockVendaFaturadaUI.__v5221=true;
}

function atualizarCardNfe(){
  const p=document.querySelector('#nfe-config-card p');
  if(!p||p.dataset.v5221) return;
  p.dataset.v5221='1';
  p.textContent='Digicopy é Simples Nacional (não é MEI). Só o computador com o A1 emite. Qualquer pessoa desse PC pode conferir. Ainda não envia para a SEFAZ.';
  const sel=document.getElementById('nfe-crt');
  if(sel){ sel.value='1'; sel.disabled=true; }
}
const oldRenderConfig=window.renderConfig;
if(typeof oldRenderConfig==='function'&&!oldRenderConfig.__v5221){
  window.renderConfig=function(){
    const r=oldRenderConfig.apply(this,arguments);
    setTimeout(atualizarCardNfe,260);
    setTimeout(atualizarCardNfe,560);
    return r;
  };
  window.renderConfig.__v5221=true;
}
setTimeout(function(){ garantirFiscalSimples(); atualizarCardNfe(); },900);
console.log('[DIGICOPY] v5.22.1 conferência NF-e venda/leitura');
})();
