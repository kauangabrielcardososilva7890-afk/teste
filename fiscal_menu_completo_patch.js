// ═══════════════════════════════════════════════════════════════════════════
// FISCAL_MENU_COMPLETO_PATCH v6.0.6 — "os menus fiscais ainda não foram
// implementadas... já coloca TUDO pra eu fazer a prévia" (ordem dele: sem
// prévia de meio de caminho; construir o cardápio inteiro AGORA).
// Em cima do motor 6.0.1 + Portão 6.0.0 + mapa do sistema antigo:
//  1) CARTA DE CORREÇÃO ELETRÔNICA (CC-e, evento 110110) — irmã do cancela-
//     mento: mesma assinatura/transmissão, texto mín. 15, múltiplas por nota,
//     trilha registrada. Botão "CC-e" em cada nota autorizada do histórico.
//  2) STATUS DO SERVIÇO SEFAZ (consStatServ) — o serviço estava na tabela do
//     motor desde a 6.0.1 mas nunca chamado: botão "Testar SEFAZ" na Central.
//  3) CONFIGURAÇÃO FISCAL na Central (mapa do dump): NCM padrão, NCM tinta/
//     recarga (32151100 do dump), NCM locação (37079021) + descrição da
//     locação ("CARTUCHO TONER"), e TEXTO DO SIMPLES para o infCpl das notas
//     REAIS — campo vazio por padrão (nada entra na nota sem ele preencher;
//     os valores estranhos do dump do velho NÃO entram — eram provável lixo).
//     NCM por tipo: produto.ncm (cadastro) sempre ganha; sem NCM no produto:
//     categoria Recarga → NCM tinta; item vindo de leitura/locação → NCM
//     locação; senão, NCM padrão. Prioridade conferida no código (ncmDoItem).
//  4) PACOTE DO MÊS PRO CONTADOR: baixa um .zip (gerado em JS PURO, método
//     STORE sem compactação + CRC32 próprio) com todos os XMLs do mês +
//     pasta de eventos (cancelamento/CC-e) + indice.txt. Sem biblioteca.
//  5) QR NFC-e v2: CONFERIDO — já estava no layout 2 (chave|2|tpAmb|idCSC|
//     SHA1(...) maiúsculo). A verificação aberta do mapeamento fica FECHADA,
//     com teste de vetor contra o crypto do Node.
// Tudo herda o Portão: homologação primeiro, senha só na hora, só clique,
// auditoria nfgAudit em cada operação nova.
// Guard: __v6006fmc. PURE exportado p/ testes (sem DOM).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6006fmc) return;

/* FMC606_PURE_START */
// ── Carta de Correção (evento 110110, layout 1.00) ─────────────────────────
const FMC_XCONDUSO_CCE='A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.';
function fmcEventoCCe(o){
  return '<envEvento versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">'+
    '<idLote>1</idLote><evento versao="1.00"><infEvento Id="ID110110'+o.chave+String(o.seq||1).padStart(2,'0')+'">'+
    '<cOrgao>'+o.cOrgao+'</cOrgao><tpAmb>'+o.tpAmb+'</tpAmb><CNPJ>'+o.cnpj+'</CNPJ>'+
    '<chNFe>'+o.chave+'</chNFe><dhEvento>'+o.dhEvento+'</dhEvento>'+
    '<tpEvento>110110</tpEvento><nSeqEvento>'+(o.seq||1)+'</nSeqEvento><verEvento>1.00</verEvento>'+
    '<detEvento versao="1.00"><descEvento>Carta de Correcao</descEvento>'+
    '<xCorrecao>'+String(o.correcao||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</xCorrecao>'+
    '<xCondUso>'+FMC_XCONDUSO_CCE+'</xCondUso>'+
    '</detEvento></infEvento></evento></envEvento>';
}
// ── Status do serviço (consStatServ NF 4.00) ────────────────────────────────
function fmcConsStatServ(o){
  return '<consStatServ versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">'+
    '<tpAmb>'+o.tpAmb+'</tpAmb><cUF>'+(o.cUF||'31')+'</cUF><xServ>STATUS</xServ></consStatServ>';
}
// ── CRC32 + ZIP STORE (sem biblioteca; arquivos sem compressão — zip válido) ─
const FMC_CRCTAB=(function(){
  const t=new Uint32Array(256);
  for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); t[n]=c>>>0; }
  return t;
})();
function fmcCrc32(bytes){
  let c=0xFFFFFFFF;
  for(let i=0;i<bytes.length;i++) c=FMC_CRCTAB[(c^bytes[i])&0xFF]^(c>>>8);
  return (c^0xFFFFFFFF)>>>0;
}
function fmcU8(str){ return unescape(encodeURIComponent(String(str))).split('').map(ch=>ch.charCodeAt(0)); }
function fmcDosDate(ms){
  const d=new Date(ms||Date.now());
  const dosTime=((d.getHours()<<11)&0xFFFF)|((d.getMinutes()<<5)&0xFFFF)|((d.getSeconds()/2)|0);
  const dosDate=(((d.getFullYear()-1980)<<9)&0xFFFF)|(((d.getMonth()+1)<<5)&0xFFFF)|(d.getDate()&0xFFFF);
  return { dosTime:dosTime, dosDate:dosDate };
}
// files: [{nome, conteudo}] → Uint8Array do .zip (método 0 = STORE)
function fmcZipStore(files){
  const partes=[]; const central=[]; let offset=0;
  const push=function(u8){ partes.push(u8); offset+=u8.length; };
  function u16(v){ return new Uint8Array([v&255,(v>>>8)&255]); }
  function u32(v){ return new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]); }
  files.forEach(function(f){
    const nome=fmcU8(f.nome);
    const dados=(f.conteudo instanceof Uint8Array)?f.conteudo:new Uint8Array(fmcU8(f.conteudo));
    const crc=fmcCrc32(dados);
    const dd=fmcDosDate(f.mtime);
    const header=[].concat(
      Array.from(u32(0x04034b50)), Array.from(u16(20)), Array.from(u16(0x0800)),
      Array.from(u16(0)), Array.from(u16(dd.dosTime)), Array.from(u16(dd.dosDate)),
      Array.from(u32(crc)), Array.from(u32(dados.length)), Array.from(u32(dados.length)),
      Array.from(u16(nome.length)), Array.from(u16(0))
    );
    const localOffset=offset;
    push(new Uint8Array(header)); push(nome); push(dados);
    const cent=[].concat(
      Array.from(u32(0x02014b50)), Array.from(u16(20)), Array.from(u16(20)),
      Array.from(u16(0x0800)), Array.from(u16(0)),
      Array.from(u16(dd.dosTime)), Array.from(u16(dd.dosDate)),
      Array.from(u32(crc)), Array.from(u32(dados.length)), Array.from(u32(dados.length)),
      Array.from(u16(nome.length)), Array.from(u16(0)), Array.from(u16(0)),
      Array.from(u16(0)), Array.from(u16(0)), Array.from(u32(0)), Array.from(u32(localOffset))
    );
    central.push({head:new Uint8Array(cent), nome:nome});
  });
  const centralInicio=offset;
  let centralTam=0;
  central.forEach(function(c){ partes.push(c.head); centralTam+=c.head.length; partes.push(c.nome); centralTam+=c.nome.length; });
  const eocd=[].concat(
    Array.from(u32(0x06054b50)), Array.from(u16(0)), Array.from(u16(0)),
    Array.from(u16(files.length)), Array.from(u16(files.length)),
    Array.from(u32(centralTam)), Array.from(u32(centralInicio)), Array.from(u16(0))
  );
  partes.push(new Uint8Array(eocd));
  let total=0; partes.forEach(p=>{ total+=p.length; });
  const out=new Uint8Array(total); let pos=0;
  partes.forEach(p=>{ out.set(p,pos); pos+=p.length; });
  return out;
}
// injeta texto no infCpl (cria infAdic se não houver) — mesma técnica do selo
function fmcAplicarTextoInfCpl(xml, texto){
  const t=String(texto||'').trim();
  if(!t) return xml;
  const esc=t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+' ';
  const s=String(xml||'');
  if(s.indexOf('<infCpl>')>=0) return s.replace('<infCpl>','<infCpl>'+esc);
  if(s.indexOf('</infNFe>')>=0) return s.replace('</infNFe>','<infAdic><infCpl>'+esc.slice(0,-1)+'</infCpl></infAdic></infNFe>');
  return s;
}
// NCM por tipo (mapa do dump): produto.ncm ganha; Recarga sem NCM → tinta;
// itens de leitura/locação → NCM locação; resto → NCM padrão.
function fmcNcmPorTipo(itens, produtos, cfg, ehLeitura){
  cfg=cfg||{};
  const padrao=(cfg.nfNcmPadrao||'').trim();
  return (itens||[]).map(function(it){
    const prod=(produtos||[]).find(function(p){ return p && (p.id===it.produtoId || (it.produtoId==null && p.nome===(it.nome||it.descricao))); });
    let ncm=(prod && String(prod.ncm||'').replace(/\D/g,'')) || '';
    if(!ncm && prod && String(prod.categoria||'')==='Recarga' && cfg.nfNcmTinta) ncm=String(cfg.nfNcmTinta).replace(/\D/g,'');
    if(!ncm && ehLeitura && cfg.nfNcmLocacao) ncm=String(cfg.nfNcmLocacao).replace(/\D/g,'');
    if(!ncm) ncm=(padrao||'').replace(/\D/g,'');
    const nome=((!it.nome && !it.descricao) && ehLeitura && cfg.nfDescLocacao) ? cfg.nfDescLocacao : (it.nome||it.descricao||'');
    return Object.assign({}, it, { ncm: ncm, nome: nome, descricao: it.descricao!=null?it.descricao:nome });
  });
}
/* FMC606_PURE_END */

const apiPura606={ fmcEventoCCe:fmcEventoCCe, fmcConsStatServ:fmcConsStatServ, fmcCrc32:fmcCrc32,
  fmcZipStore:fmcZipStore, fmcAplicarTextoInfCpl:fmcAplicarTextoInfCpl, fmcNcmPorTipo:fmcNcmPorTipo,
  FMC_XCONDUSO_CCE:FMC_XCONDUSO_CCE };
if(typeof module!=='undefined') module.exports=apiPura606;
if(typeof window!=='undefined'){ window.FMC606_PURE=apiPura606; }

// Config fiscal (campos do mapa do dump) — lê escreve db.config
function fmcCfgLer(){
  const c=(typeof db!=='undefined' && db && db.config) || {};
  return {
    nfNcmPadrao:String(c.nfNcmPadrao||''), nfNcmTinta:String(c.nfNcmTinta||'32151100'),
    nfNcmLocacao:String(c.nfNcmLocacao||'37079021'), nfDescLocacao:String(c.nfDescLocacao||'CARTUCHO TONER'),
    nfTextoSimples:String(c.nfTextoSimples||'')
  };
}
if(typeof module!=='undefined' && module.exports){ module.exports.apiPura606=apiPura606; module.exports.FMC606_PURE=apiPura606; }

if(typeof window==='undefined' || typeof document==='undefined') return;
window.__v6006fmc=true;

function fmcToast(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function fmcAudit(acao,dados){ try{ const s=(typeof getSession==='function'?getSession():null)||{};
  // v6.1.4 — auditoria de verdade (relatório dele, C5): a linha do log técnico
  // continua aqui embaixo, mas a ação TAMBÉM entra na tela Auditoria.
  if(typeof window.nfAuditarFiscal==='function'){ try{ window.nfAuditarFiscal(acao,dados,''); }catch(e){} }
  db.logs=db.logs||[]; db.logs.push({tipo:'nf-menu606',acao:acao,dados:dados||{},empresaId:s.empresaId||null,dataHora:new Date().toISOString(),usuarioId:s.usuarioId||null,usuarioNome:s.usuarioNome||s.login||null,usuarioLogin:s.login||null,at:new Date().toISOString()}); if(typeof db.save==='function') db.save(); }catch(e){} }
function fmcAmb(){ return (window.NFG_PURE&&window.NFG_PURE.nfgAmbiente(db))||'homologacao'; }
function fmcPonte(){ return (window.nfeCertAPI && window.nfeCertAPI.isElectron) ? window.nfeCertAPI : null; }
function fmcSemPonte(){ if(typeof window.lfbAlert==='function') window.lfbAlert('Essa operação fiscal só roda no app de computador (.exe) — a SEFAZ exige o certificado A1 no PC emissor. Abra pelo atalho do computador e volte aqui.','Fiscal'); }
function fmcNota(id){ return ((db.config&&db.config.nfRegistro)||[]).find(n=>n.id===id)||null; }

// ══ 1) CARTA DE CORREÇÃO (CC-e 110110) ═════════════════════════════════════
window.nfCartaCorrecao=async function(notaId){
  try{
    if(!(window.usuarioPodeEmitirNfe&&window.usuarioPodeEmitirNfe())){ fmcToast('Sem permissão de emitir NF — CC-e também exige.','error'); return {ok:false}; }
    const nota=fmcNota(notaId); if(!nota){ fmcToast('Nota não encontrada.','error'); return {ok:false}; }
    if(nota.status!=='autorizada'){ fmcToast('CC-e só em nota AUTORIZADA. Essa está: '+nota.status,'error'); return {ok:false}; }
    const ponte=fmcPonte(); if(!ponte){ fmcSemPonte(); return {ok:false}; }
    const nit=await window.nfxPedirTexto('Carta de Correção (CC-e)',
      'Escreva a correção (mínimo 15 letras). NÃO pode mudar: valores/impostos, dados de quem emite/recebe, nem data de emissão/saída.\n'+
      ((nota.cce&&nota.cce.length)?('\nJá existem '+nota.cce.length+' carta(s) nesta nota.'):''), {minimo:15});
    if(!nit || nit.trim().length<15){ if(nit!==null) fmcToast('Texto muito curto — CC-e não enviada.','error'); return {ok:false, error:'texto-curto'}; }
    const okProd=(nota.ambiente==='producao')
      ? await window.nfxConfirmar('REGISTRAR CC-e DE VERDADE?','Em produção a carta fica registrada na SEFAZ para sempre, junto com a nota.', {botao:'Registrar CC-e', cor:'#b45309'})
      : true;
    if(!okProd) return {ok:false, error:'desistiu'};
    const senha=await window.nfxPedirTexto('Senha do certificado A1','Usada AGORA pra assinar/transmitir e NÃO fica salva.', {mascara:true});
    if(!senha) return {ok:false, error:'sem-senha'};
    const seq=((nota.cce&&nota.cce.length)||0)+1;
    const evt=fmcEventoCCe({ chave:nota.chave, seq:seq, correcao:nit.trim(), cnpj:String(nota.cnpj||'').replace(/\D/g,''), cOrgao:'31', tpAmb:(nota.ambiente==='producao'?'1':'2'), dhEvento:new Date().toISOString() });
    fmcAudit('cce-inicio',{numero:nota.numero, chave:nota.chave, seq:seq});
    const ass=await ponte.assinar(evt, senha, null);
    if(!ass || !ass.ok){ fmcToast('Falha ao assinar a CC-e: '+((ass&&ass.error)||'?'),'error'); return {ok:false}; }
    const ws=window.NFX_PURE.nfxUrl(nota.ambiente||fmcAmb(), nota.modelo, 'evento');
    const envelope=window.NFX_PURE.nfxEnvelope(ass.xmlAssinado).replace('PLACEHOLDER','NFeRecepcaoEvento4');
    const trx=await ponte.transmitir({url:ws.url, envelope:envelope, soapAction:ws.soapAction, senhaCert:senha});
    if(!trx || !trx.ok){ fmcToast('Transmissão da CC-e falhou: '+((trx&&trx.error)||'?'),'error'); return {ok:false}; }
    const ret=window.NFX_PURE.nfxParseRetorno(trx.xml);
    fmcAudit('cce-resposta',{numero:nota.numero, seq:seq, cStat:ret.cStat, motivo:ret.xMotivo});
    if(ret.classe==='evento-registrado'){
      nota.cce=nota.cce||[];
      nota.cce.push({seq:seq, texto:nit.trim(), em:new Date().toISOString(), protocolo:ret.nProt||'', xMotivo:ret.xMotivo, xmlEvento:trx.xml||''});
      nota.atualizadoEm=new Date().toISOString();
      try{ if(typeof db.save==='function') db.save(); }catch(e){}
      fmcToast('✅ Carta de correção registrada ('+seq+'ª): '+ret.xMotivo,'success');
    }else{
      fmcToast('SEFAZ respondeu à CC-e: '+ret.cStat+' — '+ret.xMotivo,'error');
    }
    try{ if(typeof window.nfxRenderHistorico==='function') window.nfxRenderHistorico(); }catch(e){}
    return {ok:ret.classe==='evento-registrado', retorno:ret};
  }catch(e){ fmcAudit('cce-excecao',{erro:e.message||String(e)}); fmcToast('Erro: '+(e.message||e),'error'); return {ok:false}; }
};

// ══ 2) STATUS DO SERVIÇO SEFAZ ═════════════════════════════════════════════
window.nfStatusServico=async function(){
  try{
    if(!(window.usuarioPodeEmitirNfe&&window.usuarioPodeEmitirNfe())){ fmcToast('Sem permissão de emitir NF.','error'); return {ok:false}; }
    const ponte=fmcPonte(); if(!ponte){ fmcSemPonte(); return {ok:false}; }
    // v6.1.4 — RELATÓRIO DELE (21/09/2026, C3/C4/C7): ele clicou em "Testar
    // SEFAZ agora" sem ter enviado o A1 e levou o aviso cru "Falha ao assinar:
    // Envie o certificado A1...". Agora o sistema CONFERE ANTES, avisa em
    // popup do sistema com o passo a passo e ainda registra na Auditoria —
    // nada de erro cinza que parece defeito. O teste SEFAZ não é defeito
    // quando falta o certificado: é um passo que ainda não foi feito.
    try{
      const st=(typeof ponte.status==='function')?await ponte.status():null;
      if(st && st.ok && !st.installed){
        fmcAudit('sem-certificado',{ambiente:fmcAmb()});
        if(typeof window.lfbAlert==='function') window.lfbAlert(
          'Este teste precisa do CERTIFICADO A1 instalado neste computador.\n\n'+
          'O sistema já está pronto — falta só o arquivo do certificado:\n'+
          '1) Abra a página de arquivos (menu Enviar Arquivos / envio_arquivos.html).\n'+
          '2) Envie o arquivo do certificado A1 (.pfx).\n'+
          '3) Volte aqui e clique em "Testar SEFAZ agora" de novo — a senha do '+
          'certificado é pedida na hora e NÃO fica salva.\n\n'+
          'Nada foi enviado à SEFAZ agora e nenhuma nota saiu por causa disto.',
          'Falta o certificado A1');
        else fmcToast('Falta instalar o certificado A1 neste PC (página de arquivos). Nada foi enviado à SEFAZ.','error');
        return {ok:false, error:'sem-certificado'};
      }
    }catch(e){}
    const senha=await window.nfxPedirTexto('Senha do certificado A1','Pra chamar a SEFAZ é preciso assinar com o A1 (a senha NÃO fica salva).', {mascara:true});
    if(!senha) return {ok:false, error:'sem-senha'};
    const amb=fmcAmb();
    const xml=fmcConsStatServ({tpAmb:(amb==='producao'?'1':'2'), cUF:'31'});
    fmcAudit('status-inicio',{ambiente:amb});
    const ass=await ponte.assinar(xml, senha, null);
    if(!ass || !ass.ok){ fmcToast('Falha ao assinar: '+((ass&&ass.error)||'?'),'error'); return {ok:false}; }
    const ws=window.NFX_PURE.nfxUrl(amb,'55','status');
    const envelope=window.NFX_PURE.nfxEnvelope(ass.xmlAssinado).replace('PLACEHOLDER','NFeStatusServico4');
    const trx=await ponte.transmitir({url:ws.url, envelope:envelope, soapAction:ws.soapAction, senhaCert:senha});
    if(!trx || !trx.ok){ fmcToast('Sem resposta da SEFAZ: '+((trx&&trx.error)||('HTTP '+((trx&&trx.status)||'?'))),'error'); fmcAudit('status-falha',{erro:trx&&(trx.error||trx.status)}); return {ok:false}; }
    const ret=window.NFX_PURE.nfxParseRetorno(trx.xml);
    const operando=ret.cStat==='107';
    fmcAudit('status-resposta',{ambiente:amb, cStat:ret.cStat, motivo:ret.xMotivo});
    if(operando) fmcToast('✅ SEFAZ-MG '+(amb==='producao'?'(PRODUÇÃO)':'(homologação)')+' EM OPERAÇÃO — '+ret.xMotivo+' (cStat 107). Certificado e conexão OK — pode emitir.','success');
    else fmcToast('SEFAZ respondeu cStat '+ret.cStat+' — '+ret.xMotivo+(ret.cStat==='108'?'\n(108 = serviço paralisado momentaneamente; tente mais tarde)':''),'error');
    return {ok:operando, retorno:ret};
  }catch(e){ fmcAudit('status-excecao',{erro:e.message||String(e)}); fmcToast('Erro: '+(e.message||e),'error'); return {ok:false}; }
};

// ══ 4) PACOTE DO MÊS PRO CONTADOR (zip STORE puro) ═════════════════════════
// v6.1.4 — RELATÓRIO DELE (21/09/2026, C6): na tela "Enviar XML" ele já escolhe
// o MÊS na matriz do topo e o sistema perguntava a data OUTRA VEZ. Agora quem
// chama pode passar o mês já escolhido (formato AAAA-MM) — a função usa direto,
// sem perguntar nada. Sem argumento (botão da Central), continua perguntando.
window.nfPacoteContador=async function(mesJaEscolhido, opcoes){
  try{
    const o=opcoes||{};
    const hoje=new Date();
    const padrao=String(hoje.getMonth()+1).padStart(2,'0')+'/'+hoje.getFullYear();
    let alvo='';
    const jaVem=String(mesJaEscolhido||'').trim();
    if(/^\d{4}-\d{2}$/.test(jaVem)){ alvo=jaVem; }
    else if(/^\d{1,2}\/\d{4}$/.test(jaVem)){ const q=jaVem.match(/^(\d{1,2})\/(\d{4})$/); alvo=q[2]+'-'+q[1].padStart(2,'0'); }
    if(!alvo){
      const ini=await window.nfxPedirTexto('Pacote para a contabilidade','Mês das notas (MM/AAAA) — exemplo: '+padrao);
      if(ini===null) return {ok:false, error:'desistiu'};
      const mm=String(ini||'').trim()||padrao;
      const m=mm.match(/^(\d{1,2})\/(\d{4})$/);
      if(!m){ fmcToast('Formato inválido — use MM/AAAA (ex.: '+padrao+').','error'); return {ok:false}; }
      alvo=m[2]+'-'+m[1].padStart(2,'0');
      opcoes=o;
    }
    const m=[alvo.slice(5,7),alvo.slice(0,4)];
    const reg=((db.config&&db.config.nfRegistro)||[]);
    const doMes=reg.filter(function(n){
      const dia=String(n.dataAutorizacao||n.atualizadoEm||n.criadoEm||'');
      return dia.slice(0,7)===alvo && (n.xmlAutorizado || n.xmlEnviado || n.xmlCancelamento);
    });
    if(!doMes.length){ fmcToast('Nenhuma nota com XML em '+m[1].padStart(2,'0')+'/'+m[2]+'. (O pacote usa o mês da autorização.)','error'); return {ok:false}; }
    const arquivos=[];
    let linhas='PACOTE XML '+m[1].padStart(2,'0')+'/'+m[2]+' — Sistema Digicopy — gerado em '+new Date().toLocaleString('pt-BR')+'\r\n\r\n';
    doMes.forEach(function(n){
      const base=(n.chave?('NFe_'+n.chave):('NFe_n'+n.numero+'_'+(n.id||'')));
      const statusPt = n.status==='cancelada' ? 'CANCELADA' : n.status;
      if(n.xmlAutorizado || n.xmlEnviado){
        arquivos.push({nome:base+'.xml', conteudo:(n.xmlAutorizado||n.xmlEnviado)});
      }
      if(n.xmlCancelamento) arquivos.push({nome:'eventos/CANCELAMENTO_'+base+'.xml', conteudo:n.xmlCancelamento});
      (n.cce||[]).forEach(function(c){ if(c.xmlEvento) arquivos.push({nome:'eventos/CCE_'+String(c.seq||1).padStart(2,'0')+'_'+base+'.xml', conteudo:c.xmlEvento}); });
      linhas+=(n.modelo==='65'?'NFC-e':'NF-e')+' nº '+(n.numero||'')+' série '+(n.serie||'1')+' · '+String(statusPt)+' · chave '+(n.chave||'-')+' · protocolo '+(n.protocolo||'-')+' · total '+String(n.totalDaNota||0)+'\r\n';
    });
    arquivos.push({nome:'indice.txt', conteudo:linhas});
    fmcAudit('pacote-contador',{mes:alvo, notas:doMes.length, arquivos:arquivos.length});
    const zip=fmcZipStore(arquivos);
    const nome='pacote_xml_'+alvo+'.zip';
    const blob=new Blob([zip],{type:'application/zip'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=nome; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
    // v6.1.4 — resposta honesta (relatório dele, C6): o sistema BAIXA o zip no
    // computador e NÃO envia e-mail nenhum (não usa o Gmail dele nem o de
    // ninguém). Quando o silencioso é falso, ele fica sem saber se foi enviado.
    const sufixoEnvio = o.semAviso ? '' : ' — é só mandar pra contabilidade.';
    fmcToast('✅ '+nome+' baixado: '+doMes.length+' nota(s), '+arquivos.length+' arquivo(s)'+sufixoEnvio,'success');
    return {ok:true, arquivos:arquivos.length, notas:doMes.length, nome:nome, mes:alvo};
  }catch(e){ fmcAudit('pacote-excecao',{erro:e.message||String(e)}); fmcToast('Erro: '+(e.message||e),'error'); return {ok:false}; }
};

// ══ 3) NCM POR TIPO + TEXTO DO SIMPLES no XML nascente ═════════════════════
// Wrap do montarDocumento (docConferido): remata NCM por tipo ANTES do fallback
if(window.NFE_EMISSAO_PURE && typeof window.NFE_EMISSAO_PURE.montarDocumento==='function' && !window.NFE_EMISSAO_PURE.montarDocumento.__fmc){
  const _md=window.NFE_EMISSAO_PURE.montarDocumento;
  const embrMd=function(){
    const doc=_md.apply(this,arguments);
    try{
      const cfg=fmcCfgLer();
      const ehLeitura = /leitura|loca/i.test(String((arguments&&arguments.length&&arguments[1]&&arguments[1].origem)||(doc&&doc.origem)||''));
      if(doc && Array.isArray(doc.itens)){
        const tratados=fmcNcmPorTipo(doc.itens,(typeof db!=='undefined'?db.produtos:[])||[],cfg,ehLeitura);
        // só troca quando a regra de tipo trouxe NCM diferente do já preenchido-padrão vazio
        doc.itens=doc.itens.map(function(it,i){
          const t=tratados[i]||it;
          const novo={};
          if(t.ncm && (!it.ncm || String(it.ncm).replace(/\D/g,'')===String((cfg.nfNcmPadrao||'').replace(/\D/g,'')) )) novo.ncm=t.ncm;
          if(t.nome && t.nome!==(it.nome||it.descricao) && (!it.nome || !String(it.nome).trim())) novo.nome=t.nome, novo.descricao=t.nome;
          return Object.keys(novo).length?Object.assign({},it,novo):it;
        });
      }
    }catch(e){}
    return doc;
  };
  embrMd.__fmc=true;
  window.NFE_EMISSAO_PURE.montarDocumento=embrMd;
}
// Wrap do montarXml: texto do Simples entra no infCpl QUANDO houver config
// e o ambiente for PRODUÇÃO (em homologação o selo NOTA DE TESTE já cobre).
if(window.NFE_EMISSAO_PURE && typeof window.NFE_EMISSAO_PURE.montarXml==='function' && !window.NFE_EMISSAO_PURE.montarXml.__fmc){
  const _mx=window.NFE_EMISSAO_PURE.montarXml;
  const embrMx=function(doc){
    let xml=_mx.apply(this,arguments);
    try{
      if(fmcAmb()==='producao'){
        const cfg=fmcCfgLer();
        if(cfg.nfTextoSimples.trim()) xml=fmcAplicarTextoInfCpl(xml, cfg.nfTextoSimples);
      }
    }catch(e){}
    return xml;
  };
  embrMx.__fmc=true;
  window.NFE_EMISSAO_PURE.montarXml=embrMx;
}

// ══ 5) CENTRAL: seção OPERAÇÕES + card CONFIGURAÇÃO FISCAL ═════════════════
function fmcInstalarExtra(){
  const view=document.getElementById('view-central-nf');
  if(!view || view.querySelector('#fmc-ops')) return;
  // linha de operações (entra logo após a linha dos 3 botões base)
  const baseBtn=view.querySelector('#cnf-inut');
  const ops=document.createElement('div');
  ops.id='fmc-ops';
  ops.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:8px';
  ops.innerHTML=
    '<button id="fmc-status" class="cnf-btn" style="height:38px;padding:0 14px;border-radius:10px;font-size:12.5px">📡 Testar SEFAZ agora</button>'+
    '<button id="fmc-pacote" class="cnf-btn" style="height:38px;padding:0 14px;border-radius:10px;font-size:12.5px">🗂 Pacote do mês p/ contador (zip)</button>';
  if(baseBtn && baseBtn.parentElement) baseBtn.parentElement.insertAdjacentElement('afterend',ops);
  // card configuração fiscal (mapa do dump)
  const cards=view.querySelectorAll('.cnf-card');
  if(cards.length && !view.querySelector('#fmc-config')){
    const cfg=fmcCfgLer();
    const card=document.createElement('div');
    card.id='fmc-config';
    card.className='cnf-card';
    card.style.cssText='margin-top:10px';
    card.innerHTML=
      '<p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;margin:0 0 8px" class="cnf-sub">Configuração fiscal (mapa do sistema antigo)</p>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">'+
      '<label style="font-size:11px;font-weight:800">NCM padrão<input id="fmc-ncm-padrao" class="cnf-input" value="'+cfg.nfNcmPadrao.replace(/"/g,'&quot;')+'" style="width:100%;height:32px;border-radius:8px;padding:0 8px;margin-top:3px;font-size:12.5px"></label>'+
      '<label style="font-size:11px;font-weight:800">NCM recarga/tinta<input id="fmc-ncm-tinta" class="cnf-input" value="'+cfg.nfNcmTinta.replace(/"/g,'&quot;')+'" style="width:100%;height:32px;border-radius:8px;padding:0 8px;margin-top:3px;font-size:12.5px"></label>'+
      '<label style="font-size:11px;font-weight:800">NCM locação<input id="fmc-ncm-loc" class="cnf-input" value="'+cfg.nfNcmLocacao.replace(/"/g,'&quot;')+'" style="width:100%;height:32px;border-radius:8px;padding:0 8px;margin-top:3px;font-size:12.5px"></label>'+
      '<label style="font-size:11px;font-weight:800">Descrição locação<input id="fmc-desc-loc" class="cnf-input" value="'+cfg.nfDescLocacao.replace(/"/g,'&quot;')+'" style="width:100%;height:32px;border-radius:8px;padding:0 8px;margin-top:3px;font-size:12.5px"></label></div>'+
      '<label style="font-size:11px;font-weight:800;display:block;margin-top:10px">Texto do Simples Nacional (entra nos "dados adicionais" das notas REAIS — homologação já carrega o selo de teste)'+
      '<textarea id="fmc-txo-simples" class="cnf-input" rows="3" placeholder="Vazio = nada entra sozinho. Modelos comuns:&#10;• DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL NÃO GERA DIREITO A CRÉDITO FISCAL DE IPI.&#10;• PERMITE O APROVEITAMENTO DO CRÉDITO DE ICMS NO VALOR DE R$ ..., NOS TERMOS DO ART. 23 DA LC Nº 123/2006." style="width:100%;border-radius:8px;padding:8px;margin-top:3px;font-size:12px;font-family:inherit">'+cfg.nfTextoSimples.replace(/</g,'&lt;')+'</textarea></label>'+
      '<p style="font-size:11px;margin:6px 0 0" class="cnf-sub">O texto do sistema antigo trazia valores prontos (R$ e %) que mudam por nota — por isso aqui o campo nasce VAZIO: você decide o texto certo na prévia.</p>'+
      '<div style="margin-top:10px"><button id="fmc-cfg-salvar" class="cnf-btn" style="height:34px;padding:0 14px;border-radius:9px;font-size:12.5px">Salvar configuração fiscal</button></div>';
    cards[cards.length-1].parentElement.appendChild(card);
    card.querySelector('#fmc-cfg-salvar').onclick=function(){
      db.config=db.config||{};
      db.config.nfNcmPadrao=card.querySelector('#fmc-ncm-padrao').value.trim();
      db.config.nfNcmTinta=card.querySelector('#fmc-ncm-tinta').value.trim();
      db.config.nfNcmLocacao=card.querySelector('#fmc-ncm-loc').value.trim();
      db.config.nfDescLocacao=card.querySelector('#fmc-desc-loc').value.trim();
      db.config.nfTextoSimples=card.querySelector('#fmc-txo-simples').value;
      try{ if(typeof db.save==='function') db.save(); }catch(e){}
      fmcAudit('config-fiscal-salva',{ncmPadrao:db.config.nfNcmPadrao, temTexto:!!db.config.nfTextoSimples.trim()});
      fmcToast('✅ Configuração fiscal salva (serve no cadastro de novos produtos e nas próximas notas).','success');
    };
  }
  const st=document.getElementById('fmc-status'); if(st && !st.__fmc){ st.__fmc=true; st.onclick=function(){ window.nfStatusServico(); }; }
  const pk=document.getElementById('fmc-pacote'); if(pk && !pk.__fmc){ pk.__fmc=true; pk.onclick=function(){ window.nfPacoteContador(); }; }
  // CC-e por nota autorizada (entra na linha da ação, antes do Cancelar)
  const linhas=view.querySelectorAll('.nfx-linha [data-id]');
  linhas.forEach(function(span){
    if(span.querySelector('[data-nfx="cce"]')) return;
    const nota=fmcNota(span.getAttribute('data-id'));
    if(!nota || nota.status!=='autorizada') return;
    const bt=document.createElement('button');
    bt.setAttribute('data-nfx','cce');
    bt.className='nfx-btn-mini';
    bt.style.cssText='font-size:11px;padding:3px 8px;border-radius:6px';
    bt.textContent='CC-e'+((nota.cce&&nota.cce.length)?' ('+nota.cce.length+')':'');
    const cancelBtn=span.querySelector('[data-nfx="cancelar"]');
    if(cancelBtn) span.insertBefore(bt,cancelBtn); else span.appendChild(bt);
    bt.onclick=function(){ window.nfCartaCorrecao(nota.id); };
  });
}
if(typeof window.renderCentralNf==='function' && !window.renderCentralNf.__fmc){
  const _rc=window.renderCentralNf;
  const embrRc=function(){
    const r=_rc.apply(this,arguments);
    setTimeout(fmcInstalarExtra,60);
    return r;
  };
  embrRc.__fmc=true;
  window.renderCentralNf=embrRc;
}
// Sonda de preenchimento (render do histórico acontece fora da render da
// central, ex.: após cancelamento) — barata, para quando a view some da tela.
(function fmcSonda(){
  let tent=0;
  const t=setInterval(function(){
    tent++;
    try{ if(!document.hidden){ const v=document.getElementById('view-central-nf'); if(v && v.offsetParent!==null) fmcInstalarExtra(); } }catch(e){}
    if(tent>150) clearInterval(t); // ~5 minutos cobrindo navegação lenta
  },2000);
})();
console.log('v6.0.6 — MENU FISCAL COMPLETO: CC-e (110110) + Testar SEFAZ (status serviço) + Pacote do mês p/ contador (zip puro) + NCM por tipo + texto do Simples (vazio por padrão) na Central');
})();
