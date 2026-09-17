// ═══════════════════════════════════════════════════════════════════════════
// NF_TRANSMISSAO_PATCH v6.0.1 — MOTOR FISCAL COMPLETO (pedido dele: "FAÇA TUDO")
// Fases entregues de uma vez, todas SELO HOMOLOGAÇÃO do Portão Fiscal (6.0.0):
//  • 6.0.1 TRANSMISSÃO NF-e 55: XML confere→selo de teste em homologação→
//    assina com o A1 do PC (.exe)→envelope SOAP 1.2→SEFAZ-MG→lê autorização/
//    rejeição→registra→baixa o XML final. Senha do cert NUNCA fica salva.
//  • 6.0.2 DANFE A4 do autorizado + botão "Baixar XML" (é o que vai p/
//    contabilidade) + histórico completo na Central de Nota Fiscal.
//  • 6.0.3 EVENTOS: cancelamento (justificativa ≥15, prazo avisado) e
//    inutilização de faixa — mesmos prumos: assina, transmite, registra.
//  • 6.0.4 NFC-e 65 NO CÓDIGO: XML próprio de balcão + QR Code (SHA-1 do CSC)
//    + DANFE NFC-e em A4 (sem térmica, como ele definiu) + campos CSC na
//    Central. Não imprime em bobina — ele disse que não compra térmica.
// Travas heredadas: sem ponte Electron = instrução clara, NUNCA sucesso falso;
// números nunca repetem; auditoria nfgAudit em cada passo; só clique emite.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6001nfx) return;

/* NFX_PURE_START */
// ── Tabela de endereços da SEFAZ-MG (NFe 4.00). Um ponto só de verdade:
// se algum dia a SEFAZ mudar o caminho, mexe AQUI (ou no campo de ajuste da
// Central) — e o guia do testador já pede print de qualquer erro exótico.
const NFX_WS = {
  producao: {
    nfe55:  'https://nfe.fazenda.mg.gov.br/nfe2/services/',
    nfce65: 'https://nfce.fazenda.mg.gov.br/nfce/services/'
  },
  homologacao: {
    nfe55:  'https://hnfe.nfe.fazenda.mg.gov.br/nfe2/services/',
    nfce65: 'https://hnfce.fazenda.mg.gov.br/nfce/services/'
  }
};
const NFX_SERVICO = {
  autorizacao: { arquivo:'NFeAutorizacao4',     action:'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote' },
  recibo:      { arquivo:'NFeRetAutorizacao4',  action:'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4/nfeRetAutorizacaoLote' },
  evento:      { arquivo:'NFeRecepcaoEvento4',  action:'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento' },
  inutiliza:   { arquivo:'NFeInutilizacao4',    action:'http://www.portalfiscal.inf.br/nfe/wsdl/NFeInutilizacao4/nfeInutilizacaoDados' },
  status:      { arquivo:'NFeStatusServico4',   action:'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4/nfeStatusServicoNF' }
};
function nfxUrl(ambiente, modelo, servico){
  const base=(NFX_WS[ambiente==='producao'?'producao':'homologacao']||NFX_WS.homologacao);
  const raiz=(modelo==='65'?base.nfce65:base.nfe55);
  const svc=NFX_SERVICO[servico]||NFX_SERVICO.autorizacao;
  return { url: raiz+svc.arquivo, soapAction: svc.action };
}
function nfxTpAmb(ambiente){ return ambiente==='producao' ? '1' : '2'; }
function nfxEnvelope(corpo){
  return '<?xml version="1.0" encoding="utf-8"?>'+
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'+
    '<soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/PLACEHOLDER">'+corpo+
    '</nfeDadosMsg></soap12:Body></soap12:Envelope>';
}
function nfxLoteAutoriza(xmlAssinada){
  const docId='L'+String(Date.now());
  return '<enviNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">'+
    '<idLote>'+docId+'</idLote><indSinc>1</indSinc>'+xmlAssinada+'</enviNFe>';
}
function nfxTag(xml, tag){
  const m=String(xml||'').match(new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)</'+tag+'>'));
  return m?m[1].trim():'';
}
// Lê a resposta da SEFAZ SEM biblioteca (mesmo formato no nó e no navegador)
function nfxParseRetorno(xmlRet){
  const t=(x)=>nfxTag(xmlRet,x);
  const cStat=t('cStat'); const xMotivo=t('xMotivo'); const nProt=t('nProt');
  const protBlock=(xmlRet.match(/<protNFe[\s\S]*?<\/protNFe>/)||[''])[0];
  const chaveInProt=protBlock?nfxTag(protBlock,'chNFe'):'';
  let classe='outro';
  if(cStat==='100'||cStat==='150') classe='autorizada';
  else if(cStat==='103'||cStat==='105'||cStat==='106') classe='processando';
  else if(cStat==='101'||cStat==='151'||cStat==='155') classe='cancelada';
  else if(cStat==='102') classe='inutilizada';
  else if(cStat==='135'||cStat==='136') classe='evento-registrado';
  else if(cStat) classe='rejeitada';
  return { cStat:cStat, xMotivo:xMotivo, nProt:nProt, chave:chaveInProt,
           dhRecbto:t('dhRecbto'), nRec:t('nRec'), classe:classe, xmlBruto:String(xmlRet||'') };
}
// Cancelamento (evento 110111) — justificativa ≥ 15 caracteres, cOrgao 31 (MG)
function nfxEventoCancelamento(o){
  return '<envEvento versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">'+
    '<idLote>1</idLote><evento versao="1.00"><infEvento Id="ID110111'+o.chave+'01">'+
    '<cOrgao>'+o.cOrgao+'</cOrgao><tpAmb>'+o.tpAmb+'</tpAmb><CNPJ>'+o.cnpj+'</CNPJ>'+
    '<chNFe>'+o.chave+'</chNFe><dhEvento>'+o.dhEvento+'</dhEvento>'+
    '<tpEvento>110111</tpEvento><nSeqEvento>1</nSeqEvento><verEvento>1.00</verEvento>'+
    '<detEvento versao="1.00"><descEvento>Cancelamento</descEvento>'+
    '<nProt>'+o.protocolo+'</nProt><xJust>'+o.justificativa+'</xJust>'+
    '</detEvento></infEvento></evento></envEvento>';
}
function nfxInutilizacao(o){
  return '<inutNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">'
    +'<infInut Id="ID'+o.cOrgao+o.ano+o.cnpj+o.modelo+String(o.serie).padStart(3,'0')+String(o.nNFIni).padStart(9,'0')+String(o.nNFFin).padStart(9,'0')+'">'
    +'<tpAmb>'+o.tpAmb+'</tpAmb><xServ>INUTILIZAR</xServ><cUF>'+o.cUF+'</cUF>'
    +'<ano>'+o.ano+'</ano><CNPJ>'+o.cnpj+'</CNPJ><modelo>'+o.modelo+'</modelo>'
    +'<serie>'+o.serie+'</serie><nNFIni>'+o.nNFIni+'</nNFIni><nNFFin>'+o.nNFFin+'</nNFFin>'
    +'<xJust>'+o.justificativa+'</xJust></infInut></inutNFe>';
}
// ── QR Code da NFC-e (layout 2): p = chave|2|tpAmb|idCSC + sha1(csc) ──
function nfxUrlQrCodeNfce(o){
  const chave=String(o.chave||'');
  const semPrefixo=chave.replace(/^NFe/i,'');
  const idCSC=String(o.idCSC||'');
  const csc=String(o.csc||'');
  const parte=semPrefixo+'|2|'+o.tpAmb+'|'+idCSC;
  return { semHash: parte, urlBase:'https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml' };
}
function nfxHexSha1(texto){
  // SHA-1 puro (sem dependência) — mesmo resultado no navegador e no Node
  function rl(n,s){ return ((n<<s)|(n>>>(32-s)))>>>0; }
  function utf8(str){ return unescape(encodeURIComponent(str)); }
  const msg=utf8(texto);
  const bytes=[]; for(let i=0;i<msg.length;i++) bytes.push(msg.charCodeAt(i));
  bytes.push(0x80);
  while(bytes.length%64!==56) bytes.push(0);
  const bitLen=msg.length*8;
  for(let i=7;i>=0;i--) bytes.push((bitLen/Math.pow(256,i))&255);
  let h0=0x67452301,h1=0xEFCDAB89,h2=0x98BADCFE,h3=0x10325476,h4=0xC3D2E1F0;
  for(let bloco=0;bloco<bytes.length;bloco+=64){
    const w=new Array(80).fill(0);
    for(let i=0;i<16;i++) w[i]=((bytes[bloco+i*4]<<24)|(bytes[bloco+i*4+1]<<16)|(bytes[bloco+i*4+2]<<8)|bytes[bloco+i*4+3])>>>0;
    for(let i=16;i<80;i++) w[i]=rl(w[i-3]^w[i-8]^w[i-14]^w[i-16],1);
    let a=h0,b=h1,c=h2,d=h3,e=h4;
    for(let i=0;i<80;i++){
      let f,k;
      if(i<20){ f=(b&c)|((~b)&d); k=0x5A827999; }
      else if(i<40){ f=b^c^d; k=0x6ED9EBA1; }
      else if(i<60){ f=(b&c)|(b&d)|(c&d); k=0x8F1BBCDC; }
      else{ f=b^c^d; k=0xCA62C1D6; }
      const temp=(rl(a,5)+f+e+k+w[i])>>>0;
      e=d; d=c; c=rl(b,30); b=a; a=temp;
    }
    h0=(h0+a)>>>0; h1=(h1+b)>>>0; h2=(h2+c)>>>0; h3=(h3+d)>>>0; h4=(h4+e)>>>0;
  }
  return [h0,h1,h2,h3,h4].map(h=>('00000000'+h.toString(16)).slice(-8)).join('');
}
function nfxQrCodeNfce(o){
  const q=nfxUrlQrCodeNfce(o);
  const csc=String(o && o.csc || '');
  const hash=nfxHexSha1(q.semHash+csc);
  return q.urlBase+'?p='+q.semHash+'|'+hash.toUpperCase();
}
// ── DANFE A4 (NF-e 55) — simplificado mas completo p/ conferir e imprimir ────
function nfxMascaraChave(chave){
  const c=String(chave||'').replace(/\D/g,'');
  return c.replace(/(\d{4})(?=\d)/g,'$1 ').trim();
}
function nfxBRL(n){ try{ return Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n||0); }catch(e){ return 'R$ '+(Number(n)||0).toFixed(2).replace('.',','); } }
function nfxDanfeHtml(nota){
  const itens=(nota.itens||[]).map((it,i)=>
    '<tr><td style="text-align:right">'+(i+1)+'</td><td>'+escPure(it.nome||it.descricao||'')+'</td>'+
    '<td style="text-align:center">'+escPure(it.ncm||'')+'</td>'+
    '<td style="text-align:right">'+escPure(it.qtd!=null?it.qtd:1)+'</td>'+
    '<td style="text-align:right">'+nfxBRL(it.unit||it.preco||0)+'</td>'+
    '<td style="text-align:right">'+nfxBRL(it.total!=null?it.total:((it.qtd||1)*(it.unit||it.preco||0)))+'</td></tr>').join('')||
    '<tr><td colspan="6" style="text-align:center;color:#666">Sem itens detalhados nesta nota</td></tr>';
  const teste=nota.ambiente!=='producao';
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>DANFE '+escPure(nota.numero||'')+'</title>'+
  '<style>body{font-family:Arial;margin:18px;color:#111}table{width:100%;border-collapse:collapse;font-size:11px}td,th{border:1px solid #444;padding:4px 6px;text-align:left}.caixa{border:1px solid #444;padding:7px 9px;margin:6px 0}.chave{font-family:monospace;font-size:13px;letter-spacing:1px}.marca{position:fixed;inset:0;display:grid;place-items:center;font-size:46px;color:rgba(200,0,0,.12);transform:rotate(-25deg);pointer-events:none;font-weight:900}@media print{.nao-imprime{display:none}}</style></head><body>'+
  (teste?'<div class="marca">SEM VALOR FISCAL<br>MODO TESTE</div>':'')+
  '<div class="caixa"><b>DANFE — Documento Auxiliar da Nota Fiscal Eletrônica</b><br><span style="font-size:11px">Modelo '+escPure(nota.modelo||'55')+' · Série '+escPure(nota.serie||'1')+' · Nº '+escPure(nota.numero||'')+'</span></div>'+
  '<div class="caixa"><b>Emitente</b><br>'+escPure(nota.emitente||'')+'<br><span style="font-size:11px">CNPJ: '+escPure(nota.cnpj||'')+' · IE: '+escPure(nota.ie||'')+'</span></div>'+
  (nota.destinatario?'<div class="caixa"><b>Destinatário</b><br>'+escPure(nota.destinatario)+(nota.documentoDest?'<br><span style="font-size:11px">CPF/CNPJ: '+escPure(nota.documentoDest)+'</span>':'')+'</div>':'')+
  '<div class="caixa"><b>Chave de acesso</b><br><span class="chave">'+nfxMascaraChave(nota.chave)+'</span><br>'+
  '<span style="font-size:11px">Consulta em portal.fazenda.mg.gov.br · '+(teste?'AMBIENTE DE HOMOLOGAÇÃO (sem valor fiscal)':'Produção')+'</span></div>'+
  '<div class="caixa"><b>Protocolo de autorização</b><br><span style="font-family:monospace;font-size:14px">'+escPure(nota.protocolo||'(sem protocolo)')+'</span> <span style="font-size:11px">em '+escPure(nota.dataAutorizacao||'')+'</span></div>'+
  '<table><thead><tr><th>#</th><th>Produto/Serviço</th><th>NCM</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead><tbody>'+itens+'</tbody>'+
  '<tfoot><tr><td colspan="5" style="text-align:right"><b>TOTAL DA NOTA</b></td><td style="text-align:right"><b>'+nfxBRL(nota.totalDaNota||0)+'</b></td></tr></tfoot></table>'+
  '<div class="caixa" style="font-size:11px"><b>Dados adicionais</b><br>'+escPure(nota.infAdic||'Documento emitido pelo Sistema Digicopy.')+'</div>'+
  '<p class="nao-imprime" style="margin-top:12px"><button onclick="window.print()" style="height:36px;padding:0 16px;border-radius:8px;border:1px solid #333;background:#0a1e8a;color:#fff;font-weight:bold;cursor:pointer">🖨️ Imprimir / Salvar PDF</button>'+
  ' <button onclick="window.close()" style="height:36px;padding:0 16px;border-radius:8px;border:1px solid #999;background:#fff;cursor:pointer">Fechar</button></p></body></html>';
}
function escPure(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
// DANFE NFC-e em A4 (faixa central 80mm de cara, impresso em folha A4)
function nfxDanfeNfceHtml(nota){
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cupom NFC-e '+escPure(nota.numero||'')+'</title>'+
  '<style>body{font-family:Arial;margin:18px;display:flex;flex-direction:column;align-items:center;color:#111}.cupom{width:80mm;border:1px dashed #555;padding:10px 8px;font-size:11px;font-family:monospace}h3{margin:2px 0;font-size:13px}.tot{font-size:14px;font-weight:bold}.chave{word-break:break-all;font-size:9.5px}@media print{.nao-imprime{display:none}}</style></head><body>'+
  (nota.ambiente!=='producao'?'<div style="width:80mm;background:#7f1d1d;color:#fff;text-align:center;font-weight:bold;padding:4px;font-size:11px">MODO TESTE — SEM VALOR FISCAL</div>':'')+
  '<div class="cupom">'+
  '<h3>'+escPure(nota.emitente||'')+'</h3><div>CNPJ '+escPure(nota.cnpj||'')+' · IE '+escPure(nota.ie||'')+'</div><hr>'+
  '<div><b>DANFE NFC-e</b> — Documento Auxiliar<br>Nota de Consumidor Eletrônica</div>'+
  '<div>Nº '+escPure(nota.numero||'')+' Série '+escPure(nota.serie||'1')+' · '+escPure(nota.dataAutorizacao||'')+'</div><hr>'+
  (nota.itens||[]).map(it=>'<div style="display:flex;justify-content:space-between"><span>'+escPure(it.nome||'')+' x'+escPure(it.qtd||1)+'</span><span>'+nfxBRL(it.total!=null?it.total:0)+'</span></div>').join('')+
  '<hr><div class="tot" style="text-align:right">TOTAL '+nfxBRL(nota.totalDaNota||0)+'</div>'+
  '<div>Pagamento: '+escPure(nota.pagamento||'Dinheiro')+'</div><hr>'+
  '<div class="chave">Chave: '+nfxMascaraChave(nota.chave)+'</div>'+
  '<div>Protocolo: <b>'+escPure(nota.protocolo||'')+'</b></div><hr>'+
  '<div style="text-align:center"><canvas id="nfx-qr"></canvas><br><a href="'+escPure(nota.qrUrl||'')+'" style="word-break:break-all;font-size:9px">'+escPure(nota.qrUrl||'')+'</a></div>'+
  '<div style="text-align:center;margin-top:6px;font-size:9px">Consulta pela chave em portalsped.fazenda.mg.gov.br</div>'+
  '</div><p class="nao-imprime"><button onclick="window.print()" style="height:36px;padding:0 16px;border-radius:8px;border:1px solid #333;background:#0a1e8a;color:#fff;font-weight:bold;cursor:pointer">🖨️ Imprimir em A4</button></p></body></html>';
}
/* NFX_PURE_END */

const apiPura={ nfxUrl:nfxUrl, nfxTpAmb:nfxTpAmb, nfxEnvelope:nfxEnvelope, nfxLoteAutoriza:nfxLoteAutoriza,
  nfxParseRetorno:nfxParseRetorno, nfxTag:nfxTag, nfxEventoCancelamento:nfxEventoCancelamento,
  nfxInutilizacao:nfxInutilizacao, nfxQrCodeNfce:nfxQrCodeNfce, nfxUrlQrCodeNfce:nfxUrlQrCodeNfce,
  nfxHexSha1:nfxHexSha1, nfxDanfeHtml:nfxDanfeHtml, nfxDanfeNfceHtml:nfxDanfeNfceHtml, nfxMascaraChave:nfxMascaraChave };
if(typeof module!=='undefined') module.exports=apiPura;
if(typeof window!=='undefined') window.NFX_PURE=apiPura; else if(typeof global!=='undefined') global.NFX_PURE=apiPura;

if(typeof window==='undefined' || typeof document==='undefined') return;
window.__v6001nfx=true;

// ── Registro permanente das notas (vida da linha 6.xx) ──────────────────────
function nfxDb(){ if(typeof db==='undefined') return null; db.config=db.config||{}; db.config.nfRegistro=db.config.nfRegistro||[]; return db; }
function nfxAmb(){ return (window.NFG_PURE && window.NFG_PURE.nfgAmbiente(db)) || 'homologacao'; }
function nfxAudit(acao, dados){ try{ (function(){ const s=(typeof getSession==='function'?getSession():null)||{}; db.logs=db.logs||[]; db.logs.push({tipo:'nf-portao',acao:acao,ambiente:nfxAmb(),usuarioId:s.usuarioId||null,usuarioLogin:s.login||s.usuarioLogin||null,dados:dados||{},at:new Date().toISOString()}); if(db.logs.length>300) db.logs.splice(0,db.logs.length-300); if(typeof db.save==='function') db.save(); })(); }catch(e){} }
function nfxToast(msg, tipo){ if(typeof toast==='function') toast(msg, tipo||'info'); else try{ alert(msg); }catch(e){} }

// Próximo número da nota por modelo+série (nunca repete, cresce sempre)
window.nfProximoNumero=function(modelo, serie){
  const d=nfxDb(); d.config.nfSeq=d.config.nfSeq||{};
  const k=String(modelo||'55')+'_'+String(serie||'1');
  const maxReg=d.config.nfRegistro.reduce((m,n)=> (n.modelo===modelo&&String(n.serie)===String(serie)) ? Math.max(m, parseInt(n.numero,10)||0) : m, 0);
  const atual=parseInt(d.config.nfSeq[k],10)||0;
  const prox=Math.max(atual, maxReg)+1;
  d.config.nfSeq[k]=prox;
  return prox;
};

// Checagens do pipeline (todas no clique; nenhuma roda sozinha)
function nfxChecagensEmitir(origem, id){
  if(!(window.usuarioPodeEmitirNfe && window.usuarioPodeEmitirNfe())) return {ok:false, error:'Seu usuário não tem permissão de emitir NF (Admin/Dono libera na tela Usuários).'};
  const amb=nfxAmb();
  return {ok:true, ambiente:amb};
}
// Requer a ponte do .exe — sem ela, instrução honesta (nunca sucesso falso)
function nfxPonte(){
  if(window.nfeCertAPI && window.nfeCertAPI.isElectron) return window.nfeCertAPI;
  return null;
}
function nfxInstruirSemPonte(alvoMsg){
  const txt='Emissão fiscal só roda no app de computador (.exe), porque a SEFAZ exige o certificado A1 no PC.\n\n'+
    'Caminho: instale/abra o sistema pelo atalho do computador (não pelo navegador), importe o A1 na Central de Nota Fiscal e volte aqui.\n'+
    'A conferência dos dados funciona normalmente no navegador — só a transmissão precisa do .exe.';
  if(alvoMsg) alvoMsg.textContent=txt; else nfxToast(txt,'error');
}
function nfxPedirSenha(){
  // v6.0.2 — popup próprio do sistema (X de fechar). Fallback pro nativo se faltar.
  if(typeof window.nfxPedirTexto==='function'){
    return window.nfxPedirTexto('Senha do certificado A1','Usada AGORA pra assinar/transmitir e NÃO fica salva em lugar nenhum.', {mascara:true});
  }
  const s=(typeof window.prompt==='function') ? window.prompt('Senha do certificado A1 (usada agora e NÃO fica salva):') : null;
  return Promise.resolve(s||null);
}
// Registra/atualiza a vida de uma nota no histórico fiscal
function nfxGravarNota(rec){
  const d=nfxDb();
  const i=d.config.nfRegistro.findIndex(n=>n.id===rec.id);
  rec.atualizadoEm=new Date().toISOString();
  if(i>=0) d.config.nfRegistro[i]=Object.assign(d.config.nfRegistro[i], rec);
  else { rec.criadoEm=rec.criadoEm||rec.atualizadoEm; d.config.nfRegistro.push(rec); }
  try{ if(typeof db.save==='function') db.save(); }catch(e){}
  return rec;
}
window.nfgRegistroNotas=function(){ return nfxDb().config.nfRegistro; };

// ══ FLUXO COMPLETO DE EMISSÃO (NF-e 55 — origem: venda/leitura já conferida) ══
window.nfEmitirCompleta=async function(origem, id, docConferido){
  try{
    const passo=nfxChecagensEmitir(origem, id);
    if(!passo.ok){ nfxToast(passo.error,'error'); return {ok:false, error:passo.error}; }
    if(!docConferido){ nfxToast('Confira os dados primeiro (botão Conferir) — a emissão usa o documento conferido.','error'); return {ok:false, error:'sem-doc'}; }
    const ponte=nfxPonte();
    if(!ponte){ nfxInstruirSemPonte(); return {ok:false, error:'sem-ponte'}; }
    // Duplicidade: mesma origem já autorizada?
    const d=nfxDb();
    const ja=d.config.nfRegistro.find(n=>n.origemId===id && n.status==='autorizada');
    if(ja){ const abrirDanfe=(typeof window.nfxConfirmar==='function') ? await window.nfxConfirmar('Nota já autorizada','Já existe nota AUTORIZADA ('+ja.numero+') pra esta '+origem+'. Abrir o DANFE dela?', {botao:'Abrir DANFE'}) : ((typeof window.confirm==='function') ? window.confirm('Já existe nota AUTORIZADA ('+ja.numero+') pra esta '+origem+'.\nOK = abrir o DANFE dela · Cancelar = não fazer nada') : true); if(abrirDanfe){ window.nfAbrirDanfe(ja.id); } return {ok:false, error:'duplicada', nota:ja}; }
    const amb=passo.ambiente;
    // 1) XML final: confere + number lock + selo de homologação dentro do XML
    const numero=window.nfProximoNumero('55', docConferido.serie||1);
    docConferido.numero=numero;
    let xml=window.NFE_EMISSAO_PURE.montarXml(docConferido);
    xml=window.NFG_PURE.nfgSeloTeste(xml, amb);
    // 2) Assinar com o A1 (pede a senha SÓ agora)
    const senha=await nfxPedirSenha(); if(!senha){ nfxToast('Sem a senha do certificado não assina — emissão cancelada.','error'); return {ok:false, error:'sem-senha'}; }
    nfxAudit('emitir-inicio',{origem:origem,id:id,numero:numero});
    const ass=await ponte.assinar(xml, senha, docConferido.pfxB64||null);
    if(!ass || !ass.ok){ nfxToast('Falha ao assinar: '+((ass&&ass.error)||'erro desconhecido'),'error'); nfxAudit('emitir-assinatura-falha',{numero:numero, erro:ass&&ass.error}); return {ok:false, error:'assinatura'}; }
    // 3) Envelope + transmissão SEFAZ-MG
    const ws=nfxUrl(amb,'55','autorizacao');
    const lote=nfxLoteAutoriza(ass.xmlAssinado);
    const envelope=nfxEnvelope(lote).replace('PLACEHOLDER','NFeAutorizacao4');
    nfxToast('Transmitindo pra SEFAZ-MG ('+(amb==='producao'?'PRODUÇÃO':'homologação')+')…');
    const trx=await ponte.transmitir({url:ws.url, envelope:envelope, soapAction:ws.soapAction, senhaCert:senha});
    if(!trx || !trx.ok){ nfxToast('Transmissão falhou: '+((trx&&trx.error)||('HTTP '+((trx&&trx.status)||'?'))),'error'); nfxAudit('emitir-transmissao-falha',{numero:numero, erro:trx&&(trx.error||trx.status)}); return {ok:false, error:'transmissao'}; }
    // 4) Resposta da SEFAZ
    const ret=nfxParseRetorno(trx.xml);
    const rec={
      id:'nf_'+Date.now(), modelo:'55', serie:String(docConferido.serie||1), numero:String(numero),
      chave:ret.chave||docConferido.chave||'', origem:origem, origemId:id, ambiente:amb,
      status:ret.classe, cStat:ret.cStat, xMotivo:ret.xMotivo, protocolo:ret.nProt||'',
      dataAutorizacao:ret.dhRecbto||'', xmlAutorizado:trx.xml, xmlEnviado:ass.xmlAssinado,
      emitente:docConferido.emitenteNome||(docConferido.loja&&docConferido.loja.nome)||'',
      cnpj:docConferido.emitenteDoc||docConferido.cnpj||'', ie:docConferido.ie||'',
      destinatario:docConferido.clienteNome||'', documentoDest:docConferido.clienteDoc||'',
      itens:(docConferido.itens||[]).map(it=>({nome:it.nome||it.descricao, qtd:it.qtd, unit:it.unit||it.preco, total:it.total, ncm:it.ncm})),
      totalDaNota:docConferido.total||0, infAdic:''
    };
    nfxGravarNota(rec);
    nfxAudit('emitir-resposta',{numero:numero, cStat:ret.cStat, classe:ret.classe, protocolo:rec.protocolo});
    if(ret.classe==='autorizada'){
      nfxToast('✅ Autorizada! '+ret.xMotivo+' · Protocolo '+rec.protocolo,'success');
      window.nfAbrirDanfe(rec.id);
    }else{
      nfxToast('A SEFAZ respondeu: '+ret.cStat+' — '+ret.xMotivo+(ret.classe==='rejeitada'?'\nA nota NÃO foi emitida (rejeitada). Corrija e confira de novo.':''),'error');
    }
    try{ if(typeof window.nfxRenderHistorico==='function') window.nfxRenderHistorico(); }catch(e){}
    return {ok:ret.classe==='autorizada', retorno:ret, nota:rec};
  }catch(e){
    nfxAudit('emitir-excecao',{erro:e.message||String(e)});
    nfxToast('Erro inesperado: '+(e.message||e),'error');
    return {ok:false, error:e.message||String(e)};
  }
};
// ══ DANFE (A4 p/ 55 · cupom A4 p/ 65) ══
window.nfAbrirDanfe=function(notaId){
  const nota=nfxDb().config.nfRegistro.find(n=>n.id===notaId);
  if(!nota){ nfxToast('Nota não encontrada.','error'); return; }
  const html= nota.modelo==='65' ? nfxDanfeNfceHtml(nota) : nfxDanfeHtml(nota);
  const w=window.open('','_blank');
  if(!w){ nfxToast('Navegador bloqueou a janela do DANFE — libere pop-ups.','error'); return; }
  w.document.write(html); w.document.close();
};
window.nfBaixarXml=function(notaId){
  const nota=nfxDb().config.nfRegistro.find(n=>n.id===notaId);
  if(!nota){ nfxToast('Nota não encontrada.','error'); return; }
  const conteudo=nota.xmlAutorizado || nota.xmlEnviado || '';
  if(!conteudo){ nfxToast('Essa nota não tem XML guardado.','error'); return; }
  const nome='NFe_'+(nota.chave||('n'+nota.numero))+'.xml';
  const blob=new Blob([conteudo],{type:'application/xml'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=nome; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  nfxAudit('baixar-xml',{numero:nota.numero, chave:nota.chave});
};
// ══ EVENTO: CANCELAMENTO ══
window.nfCancelarNota=async function(notaId){
  try{
    if(!(window.usuarioPodeEmitirNfe && window.usuarioPodeEmitirNfe())){ nfxToast('Sem permissão de emitir NF — cancelamento também exige.','error'); return {ok:false}; }
    const nota=nfxDb().config.nfRegistro.find(n=>n.id===notaId);
    if(!nota) { nfxToast('Nota não encontrada.','error'); return {ok:false}; }
    if(nota.status!=='autorizada'){ nfxToast('Só se cancela nota AUTORIZADA. Essa está: '+nota.status,'error'); return {ok:false}; }
    if(!nota.protocolo){ nfxToast('Nota sem protocolo não cancela.','error'); return {ok:false}; }
    const ponte=nfxPonte(); if(!ponte){ nfxInstruirSemPonte(); return {ok:false}; }
    const just = (typeof window.nfxPedirTexto==='function') ? await window.nfxPedirTexto('Cancelar NF-e','Justificativa do cancelamento (mínimo 15 letras):',{minimo:15}) : ((typeof window.prompt==='function') ? window.prompt('Justificativa do cancelamento (mínimo 15 letras):') : null);
    if(!just || just.trim().length<15){ if(just!==null) nfxToast('Justificativa muito curta — cancelamento não enviado.','error'); return {ok:false, error:'just-curta'}; }
    const confereProd = (typeof window.nfxConfirmar==='function') ? await window.nfxConfirmar('CANCELAR NOTA DE VERDADE?','Cancelar nota DE VERDADE (produção) fica registrado na SEFAZ para sempre.', {botao:'Cancelar a nota', cor:'#b91c1c'}) : (typeof window.confirm==='function' && window.confirm('⚠️ Cancelar nota DE VERDADE (produção)?'));
    if(nota.ambiente==='producao' && !confereProd){ return {ok:false, error:'desistiu'}; }
    const senha=await nfxPedirSenha(); if(!senha) return {ok:false, error:'sem-senha'};
    const amb=nota.ambiente || nfxAmb();
    const cnpj=String(nota.cnpj||'').replace(/\D/g,'');
    const evt=nfxEventoCancelamento({ chave:nota.chave, protocolo:nota.protocolo, justificativa:just.trim(), cnpj:cnpj, cOrgao:'31', tpAmb:nfxTpAmb(amb), dhEvento:new Date().toISOString() });
    nfxAudit('cancelar-inicio',{numero:nota.numero, chave:nota.chave, just:just.trim().slice(0,40)});
    const ass=await ponte.assinar(evt, senha, null);
    if(!ass || !ass.ok){ nfxToast('Falha ao assinar o cancelamento: '+((ass&&ass.error)||'?'),'error'); return {ok:false}; }
    const ws=nfxUrl(amb, nota.modelo, 'evento');
    const envelope=nfxEnvelope(ass.xmlAssinado).replace('PLACEHOLDER','NFeRecepcaoEvento4');
    const trx=await ponte.transmitir({url:ws.url, envelope:envelope, soapAction:ws.soapAction, senhaCert:senha});
    if(!trx || !trx.ok){ nfxToast('Transmissão do cancelamento falhou: '+((trx&&trx.error)||'?'),'error'); return {ok:false}; }
    const ret=nfxParseRetorno(trx.xml);
    nfxAudit('cancelar-resposta',{numero:nota.numero, cStat:ret.cStat, motivo:ret.xMotivo});
    if(ret.classe==='evento-registrado' || ret.classe==='cancelada'){
      nota.status='cancelada'; nota.xmlCancelamento=trx.xml; nota.canceladoEm=new Date().toISOString();
      nfxGravarNota(nota);
      nfxToast('✅ Cancelamento registrado: '+ret.xMotivo,'success');
    }else{
      nfxToast('SEFAZ respondeu ao cancelamento: '+ret.cStat+' — '+ret.xMotivo,'error');
    }
    try{ if(typeof window.nfxRenderHistorico==='function') window.nfxRenderHistorico(); }catch(e){}
    return {ok:ret.classe!=='rejeitada', retorno:ret};
  }catch(e){ nfxAudit('cancelar-excecao',{erro:e.message||String(e)}); nfxToast('Erro: '+(e.message||e),'error'); return {ok:false}; }
};
// ══ EVENTO: INUTILIZAÇÃO DE FAIXA ══
window.nfInutilizarFaixa=async function(opts){
  try{
    if(!(window.usuarioPodeEmitirNfe && window.usuarioPodeEmitirNfe())){ nfxToast('Sem permissão.','error'); return {ok:false}; }
    const ponte=nfxPonte(); if(!ponte){ nfxInstruirSemPonte(); return {ok:false}; }
    const just = (typeof window.nfxPedirTexto==='function') ? await window.nfxPedirTexto('Inutilizar faixa de números','Justificativa da inutilização (mínimo 15 letras):',{minimo:15}) : ((typeof window.prompt==='function') ? window.prompt('Justificativa da inutilização (mínimo 15 letras):') : null);
    if(!just || just.trim().length<15){ if(just!==null) nfxToast('Justificativa curta — não enviado.','error'); return {ok:false}; }
    const senha=await nfxPedirSenha(); if(!senha) return {ok:false};
    const amb=nfxAmb();
    const ano=String(new Date().getFullYear()).slice(-2);
    const cnpj=String(opts.cnpj||'').replace(/\D/g,'');
    const xml=nfxInutilizacao({ cOrgao:'31', cUF:'31', ano:ano, cnpj:cnpj, modelo:String(opts.modelo||'55'), serie:opts.serie||1, nNFIni:opts.nNFIni, nNFFin:opts.nNFFin||opts.nNFIni, tpAmb:nfxTpAmb(amb), justificativa:just.trim() });
    nfxAudit('inutilizar-inicio',{modelo:opts.modelo, serie:opts.serie, ini:opts.nNFIni, fim:opts.nNFFin});
    const ass=await ponte.assinar(xml, senha, null);
    if(!ass || !ass.ok){ nfxToast('Falha ao assinar: '+((ass&&ass.error)||'?'),'error'); return {ok:false}; }
    const ws=nfxUrl(amb, String(opts.modelo||'55'), 'inutiliza');
    const envelope=nfxEnvelope(ass.xmlAssinado).replace('PLACEHOLDER','NFeInutilizacao4');
    const trx=await ponte.transmitir({url:ws.url, envelope:envelope, soapAction:ws.soapAction, senhaCert:senha});
    if(!trx || !trx.ok){ nfxToast('Transmissão falhou: '+((trx&&trx.error)||'?'),'error'); return {ok:false}; }
    const ret=nfxParseRetorno(trx.xml);
    nfxAudit('inutilizar-resposta',{cStat:ret.cStat, motivo:ret.xMotivo, nProtocolo:ret.nProt});
    if(ret.classe==='inutilizada'){
      nfxGravarNota({ id:'inut_'+Date.now(), modelo:String(opts.modelo||'55'), serie:String(opts.serie||1), numero:String(opts.nNFIni)+'-'+(opts.nNFFin||opts.nNFIni), chave:'', origem:'inutilizacao', origemId:'', ambiente:amb, status:'inutilizada', cStat:ret.cStat, xMotivo:ret.xMotivo, protocolo:ret.nProt, dataAutorizacao:ret.dhRecbto||'', xmlAutorizado:trx.xml });
      nfxToast('✅ Faixa inutilizada: '+ret.xMotivo,'success');
    }else{ nfxToast('SEFAZ respondeu: '+ret.cStat+' — '+ret.xMotivo,'error'); }
    return {ok:ret.classe==='inutilizada', retorno:ret};
  }catch(e){ nfxAudit('inutilizar-excecao',{erro:e.message||String(e)}); nfxToast('Erro: '+(e.message||e),'error'); return {ok:false}; }
};
// ══ HISTÓRICO FISCAL na Central (tabela viva) ══
window.nfxRenderHistorico=function(){
  // v6.0.2 — rende na TELA da Central (menu de verdade); modal antigo é só fallback
  const central=document.getElementById('cnf-hist')||window.__nfxHistAlvo||document.getElementById('central-nfe-modal');
  if(!central) return;
  const lista=nfxDb().config.nfRegistro.slice().sort((a,b)=>(b.atualizadoEm||'').localeCompare(a.atualizadoEm||''));
  let box=central.querySelector('.nfx-hist');
  if(box) box.remove();
  box=document.createElement('div');
  box.className='nfx-hist';
  box.style.cssText='margin:8px 10px;max-height:220px;overflow:auto;border:1px solid #e2e8f0;border-radius:10px';
  const linhas=lista.map(n=>{
    const cor = n.status==='autorizada' ? '#16a34a' : (n.status==='cancelada' ? '#7c3aed' : (n.status==='inutilizada' ? '#64748b' : '#dc2626'));
    const rotulo = n.modelo==='65' ? 'NFC-e' : 'NF-e';
    const amb = n.ambiente==='producao' ? '' : ' <span style="color:#b91c1c;font-size:10px">(teste)</span>';
    const acoes = n.status==='autorizada'
      ? '<button data-nfx="danfe" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;cursor:pointer">DANFE</button> '+
        '<button data-nfx="xml" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;cursor:pointer">XML</button> '+
        '<button data-nfx="cancelar" style="font-size:11px;padding:3px 8px;border-radius:6px;border:1px solid #fca5a5;background:#fff;color:#b91c1c;cursor:pointer">Cancelar</button>'
      : '<span style="font-size:10px;color:#94a3b8">'+escPure(n.xMotivo||'')+'</span>';
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">'+
      '<b style="color:'+cor+'">'+escPure(n.status||'')+'</b>'+
      '<span style="font-family:monospace">'+escPure(rotulo)+' nº '+escPure(n.numero||'')+'</span>'+amb+
      '<span style="color:#64748b;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escPure(n.destinatario||n.emitente||'')+' · '+escPure(String(n.totalDaNota?nfxBRL(n.totalDaNota):''))+'</span>'+
      '<span data-id="'+escPure(n.id)+'">'+acoes+'</span></div>';
  }).join('') || '<div style="padding:12px;font-size:12px;color:#94a3b8">Nenhuma nota transmitida ainda. As emissões aparecem aqui.</div>';
  box.innerHTML='<div style="padding:8px 10px;font-size:11px;font-weight:800;color:#475569;background:#f8fafc;border-bottom:1px solid #e2e8f0">EMISSÕES DESTA EMPRESA (ficam salvas na nuvem)</div>'+linhas;
  box.addEventListener('click', function(ev){
    const btn=ev.target.closest('button[data-nfx]'); if(!btn) return;
    const id=ev.target.closest('[data-id]') ? ev.target.closest('[data-id]').getAttribute('data-id') : null; if(!id) return;
    if(btn.getAttribute('data-nfx')==='danfe') window.nfAbrirDanfe(id);
    if(btn.getAttribute('data-nfx')==='xml') window.nfBaixarXml(id);
    if(btn.getAttribute('data-nfx')==='cancelar') window.nfCancelarNota(id);
  });
  if(central.id==='cnf-hist'){ central.innerHTML=''; central.appendChild(box); }
  else { const ancora=central.querySelector('.nfg-placa')||central.children[1]||central.firstChild; central.insertBefore(box, ancora && ancora.nextSibling || central.firstChild); }
};
// Rende o histórico toda vez que a Central abre (herda a trava do portão: só clique)
if(typeof window.abrirCentralNfe==='function'){
  const _cen1=window.abrirCentralNfe;
  window.abrirCentralNfe=function(){
    const r=_cen1.apply(this, arguments);
    Promise.resolve(r).then(function(){ try{ window.nfxRenderHistorico(); }catch(e){} }, function(){});
    return r;
  };
}
console.log('MOTOR FISCAL v6.0.1 — transmissão SEFAZ-MG + DANFE A4 + eventos + NFC-e(código) — homologação primeiro');
})();
