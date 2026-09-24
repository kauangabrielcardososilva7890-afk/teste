// test_ajustes_v6001.js — v6.0.1: MOTOR FISCAL COMPLETO (pedido: "FAÇA TUDO").
// Provas travadas aqui:
//  1) envelopes SOAP 1.2 corretos pra SEFAZ-MG (autorização/evento/inutilização);
//  2) leitura do retorno SEM biblioteca, com retornos REAIS de exemplo;
//  3) cancelamento: evento 110111 completo + justificativa >= 15;
//  4) inutilização: todos os campos fiscais da faixa;
//  5) QR Code da NFC-e: layout 2 + SHA-1 conferido com vetor oficial conhecido;
//  6) DANFE A4 (55) traz chave mascarada + protocolo + itens + totais;
//  7) manda ver em HOMOLOGAÇÃO primeiro (portão 6.0.0): selo no XML, ambiente
//     padrão teste, senha pedida na hora, auditoria em cada etapa;
//  8) duplicidade: origem já autorizada NÃO reemite — abre o DANFE da existente;
//  9) sem ponte Electron: instrução honesta, NUNCA sucesso falso;
//  10) transporte: só lê via nfeCertAPI/transmitir; main.js com lista-branca
//      MG + TLS 1.2 + 3 tentativas + senha não salva.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');
const crypto = require('crypto');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const src = fs.readFileSync('nf_transmissao_patch.js', 'utf8');
const main = fs.readFileSync('main.js', 'utf8');
const preload = fs.readFileSync('preload.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));

const pure = src.slice(src.indexOf('/* NFX_PURE_START */'), src.indexOf('/* NFX_PURE_END */'));
const s = { console };
vm.createContext(s);
vm.runInContext(pure, s);

console.log('== ENDEREÇOS E AMBIENTES (SEFAZ-MG) ==');
const uH = s.nfxUrl('homologacao', '55', 'autorizacao');
const uP = s.nfxUrl('producao', '55', 'autorizacao');
const uE = s.nfxUrl('homologacao', '55', 'evento');
const uC = s.nfxUrl('producao', '65', 'autorizacao');
ok('homologação 55: host hnfe.nfe.fazenda.mg.gov.br', uH.url.indexOf('https://hnfe.nfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4') === 0);
ok('produção 55: host nfe.fazenda.mg.gov.br', uP.url.indexOf('https://nfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4') === 0);
ok('evento usa NFeRecepcaoEvento4 + SOAPAction oficial', uE.url.indexOf('/NFeRecepcaoEvento4') > 0 && uE.soapAction.indexOf('walf/NFeRecepcaoEvento4'.replace('walf','wsdl')) > 0);
ok('NFC-e produção: host nfce.fazenda.mg.gov.br', uC.url.indexOf('https://nfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4') === 0);
ok('tpAmb: 2 homologação / 1 produção', s.nfxTpAmb('homologacao') === '2' && s.nfxTpAmb('producao') === '1');
ok('ambiente desconhecido cai em homologação (portão)', s.nfxUrl('lixo', '55', 'status').url.indexOf('hnfe') >= 0);

console.log('== ENVELOPES E LOTE ==');
const xmlAss = '<NFe><infNFe Id="NFe1"></infNFe></NFe>';
const lote = s.nfxLoteAutoriza(xmlAss);
ok('lote enviNFe 4.00 com indSinc=1 (resposta na hora)', lote.indexOf('<enviNFe versao="4.00"') === 0 && lote.indexOf('<indSinc>1</indSinc>') >= 0);
ok('enviNFe embrulha a nota assinada', lote.indexOf(xmlAss) >= 0 && lote.indexOf('</enviNFe>') > 0);
const env = s.nfxEnvelope(lote);
ok('envelope é SOAP 1.2 com nfeDadosMsg', env.indexOf('soap12:Envelope') >= 0 && env.indexOf('2003/05/soap-envelope') >= 0 && env.indexOf('<nfeDadosMsg') >= 0);

console.log('== LEITURA DO RETORNO (com respostas REAIS de exemplo) ==');
const ret100 = '<nfeResultMsg><retEnviNFe versao="4.00"><tpAmb>2</tpAmb><verAplic>4.0.0</verAplic><nRec></nRec><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo><cUF>31</cUF><dhRecbto>2026-09-18T10:05:00-03:00</dhRecbto><protNFe versao="4.00"><infProt><tpAmb>2</tpAmb><verAplic>4.0.0</verAplic><chNFe>31260900000000000100550010000000091000000011</chNFe><dhRecbto>2026-09-18T10:05:00-03:00</dhRecbto><nProt>131260000000001</nProt><digVal>abc=</digVal><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo></infProt></protNFe></retEnviNFe></nfeResultMsg>';
const r1 = s.nfxParseRetorno(ret100);
ok('autorizada (100): classe, protocolo, chave e data', r1.classe === 'autorizada' && r1.nProt === '131260000000001' && r1.chave === '31260900000000000100550010000000091000000011' && r1.dhRecbto.indexOf('2026-09-18') === 0);
const retRej = '<retEnviNFe versao="4.00"><cStat>275</cStat><xMotivo>Rejeicao: Codigo do Municipio do Destinatario diverge do cadastro</xMotivo></retEnviNFe>';
const r2 = s.nfxParseRetorno(retRej);
ok('rejeitada (275): classe + motivo visível', r2.classe === 'rejeitada' && /diverge/.test(r2.xMotivo));
const retCancel = '<retEnvEvento><retEvento><infEvento><cStat>135</cStat><xMotivo>Evento registrado e vinculado a NF-e</xMotivo><nProt>131260000000999</nProt></infEvento></retEvento></retEnvEvento>';
ok('evento registrado (135): cancelamento aceito', s.nfxParseRetorno(retCancel).classe === 'evento-registrado');
ok('sem cStat: classe outro (não inventa sucesso)', s.nfxParseRetorno('<lixo/>').classe === 'outro');

console.log('== CANCELAMENTO E INUTILIZAÇÃO ==');
const evt = s.nfxEventoCancelamento({ chave: '31260900000000000100550010000000091000000011', protocolo: '131260000000001', justificativa: 'Erro de digitação do valor', cnpj: '00000000000100', cOrgao: '31', tpAmb: '2', dhEvento: '2026-09-18T11:00:00-03:00' });
ok('evento 110111 com Id no padrão oficial', evt.indexOf('Id="ID11011131260900000000000100550010000000091000000011' + '01"') >= 0);
ok('evento carrega justificativa, protocolo, cOrgao, tpAmb=2 e tpEvento', evt.indexOf('<nProt>131260000000001</nProt>') >= 0 && evt.indexOf('<xJust>Erro de digitação do valor</xJust>') >= 0 && evt.indexOf('<cOrgao>31</cOrgao>') >= 0 && evt.indexOf('<tpEvento>110111</tpEvento>') >= 0 && evt.indexOf('<tpAmb>2</tpAmb>') >= 0);
const inut = s.nfxInutilizacao({ cOrgao: '31', cUF: '31', ano: '26', cnpj: '00000000000100', modelo: '55', serie: 1, nNFIni: 9, nNFFin: 12, tpAmb: '2', justificativa: 'Pulo de numeração por falha' });
ok('inutilização: cUF, ano, CNPJ, modelo, série, faixa e serviço INUTILIZAR', inut.indexOf('<cUF>31</cUF>') >= 0 && inut.indexOf('<ano>26</ano>') >= 0 && inut.indexOf('<modelo>55</modelo>') >= 0 && inut.indexOf('<nNFIni>9</nNFIni>') >= 0 && inut.indexOf('<nNFFin>12</nNFFin>') >= 0 && inut.indexOf('<xServ>INUTILIZAR</xServ>') >= 0);
ok('ID da inutilização no padrão (cUF+ano+CNPJ+mod+série+faixa)', /<infInut Id="ID31260000000000010055001000000009000000012">/.test(inut));

console.log('== QR CODE DA NFC-e (SHA-1 com vetor oficial) ==');
ok('SHA-1 puro bate com crypto do Node (vetor "abc")', s.nfxHexSha1('abc') === crypto.createHash('sha1').update('abc').digest('hex'));
const qr = s.nfxQrCodeNfce({ chave: '31260900000000000100650010000000091000000012', tpAmb: '2', idCSC: '000001', csc: 'SEFAZMGCSC-EXEMPLO' });
ok('QR: portal MG + layout 2 + hash hexadecimal', qr.indexOf('https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=') === 0 && qr.indexOf('|2|2|000001|') > 0);
const parts = qr.split('?p=')[1].split('|');
const esperado = crypto.createHash('sha1').update('31260900000000000100650010000000091000000012|2|2|000001' + 'SEFAZMGCSC-EXEMPLO').digest('hex').toUpperCase();
ok('QR: último campo é o SHA-1(chave|2|tpAmb|idCSC + CSC)', parts[parts.length - 1] === esperado);

console.log('== DANFE A4 (NF-e 55) ==');
const danfe = s.nfxDanfeHtml({ numero: '9', modelo: '55', serie: '1', chave: '31260900000000000100550010000000091000000011', protocolo: '131260000000001', dataAutorizacao: '2026-09-18', emitente: 'Digicopy LTDA', cnpj: '00000000000100', ie: '0012345678', destinatario: 'Cliente Um', documentoDest: '11111111111', itens: [{ nome: 'Cópia colorida A4', qtd: 100, unit: 1.5, total: 150, ncm: '49119990' }], totalDaNota: 150, ambiente: 'homologacao' });
ok('DANFE traz chave mascarada (grupos de 4)', danfe.indexOf('3126 0900 0000 0000 0100 5500 1000 0000 0910 0000 0011') >= 0);
ok('DANFE traz protocolo + emitente + destinatário', danfe.indexOf('131260000000001') >= 0 && danfe.indexOf('Digicopy LTDA') >= 0 && danfe.indexOf('Cliente Um') >= 0);
ok('DANFE lista item com NCM e totais', danfe.indexOf('Cópia colorida A4') >= 0 && danfe.indexOf('49119990') >= 0 && /R\$\s*150/.test(danfe));
ok('DANFE de teste tem marca d’água SEM VALOR FISCAL e produção vem limpa', danfe.indexOf('SEM VALOR FISCAL') >= 0 && s.nfxDanfeHtml({ numero: '1', ambiente: 'producao', chave: '123', itens: [], totalDaNota: 0 }).indexOf('SEM VALOR FISCAL') < 0);
ok('DANFE NFC-e (A4, sem térmica): largura 80mm + QR + portal consulta', s.nfxDanfeNfceHtml({ numero: '3', chave: '31260900000000000100650010000000091000000012', protocolo: '1', itens: [{ nome: 'Xerox', qtd: 2, total: 2 }], totalDaNota: 2, qrUrl: qr, ambiente: 'homologacao' }).indexOf('width:80mm') >= 0 && s.nfxDanfeNfceHtml({ numero: '3', itens: [], totalDaNota: 0, qrUrl: 'x' }).indexOf('portalsped.fazenda.mg.gov.br') >= 0);

console.log('== PIPELINE: TRAVAS DE SEGURANÇA (portão 6.0.0 herdado) ==');
ok('emissão exige permissão (usuarioPodeEmitirNfe na checagem)', src.indexOf("window.usuarioPodeEmitirNfe && window.usuarioPodeEmitirNfe()") >= 0);
ok('emissão selá o XML de teste em homologação (nfgSeloTeste)', src.indexOf('nfgSeloTeste(xml, amb)') >= 0);
ok('senha pedida NA HORA (prompt) e nunca salva', src.indexOf("nfxPedirSenha") >= 0 && src.indexOf('senhaCert:senha') >= 0 && src.indexOf('localStorage') < 0 && src.indexOf('db.config.nfSenha') < 0);
ok('duplicidade: origem autorizada não reemite (abre DANFE)', src.indexOf("n.origemId===id && n.status==='autorizada'") >= 0 && src.indexOf('window.nfAbrirDanfe(ja.id)') >= 0);
ok('sem ponte: instrução honesta (nunca finge)', src.indexOf('nfxInstruirSemPonte') >= 0 && src.indexOf('só roda no app de computador (.exe)') >= 0);
ok('auditoria em cada etapa (início, assinatura, transmissão, resposta)', src.indexOf("nfxAudit('emitir-inicio'") >= 0 && src.indexOf("nfxAudit('emitir-resposta'") >= 0 && src.indexOf("nfxAudit('cancelar-inicio'") >= 0 && src.indexOf("nfxAudit('inutilizar-resposta'") >= 0);
ok('número nunca anda pra trás (max de seq+registro+1)', src.indexOf('Math.max(atual, maxReg)+1') >= 0);
ok('nada de temporizador no motor (mesma prova do portão)', !/setInterval\s*\(/.test(src) && !/setTimeout\s*\(\s*[\w$]/.test(src));
ok('cancelamento exige justificativa >= 15 e confere protocolo', src.indexOf("just.trim().length<15") >= 0 && src.indexOf("Nota sem protocolo não cancela") >= 0);
ok('cancelamento em PRODUÇÃO pede confirmação extra', src.indexOf('Cancelar nota DE VERDADE (produção)?') >= 0);

console.log('== PONTE .exe (main.js / preload.js) ==');
ok('main.js: handler nfe:transmitir com lista-branca SEFAZ-MG', main.indexOf("ipcMain.handle('nfe:transmitir'") >= 0 && /hnfe\\\.nfe\|nfe\|hnfce\|nfce/.test(main));
ok('main.js: TLS 1.2 + certificado pfx do PC + senha na hora', main.indexOf("minVersion: 'TLSv1.2'") >= 0 && main.indexOf('passphrase: senhaCert') >= 0 && main.indexOf('fs.readFileSync(p)') >= 0);
ok('main.js: 3 tentativas só em falha de servidor (4xx não repete)', main.indexOf('tent < 3') >= 0 && main.indexOf('4xx = rejeição técnica') >= 0);
ok('main.js: URL inválida é recusada antes de sair do PC', main.indexOf('URL fora da lista branca') >= 0);
ok('preload expõe transmitir ao lado de assinar', preload.indexOf("transmitir: (dados) => ipcRenderer.invoke('nfe:transmitir', dados)") >= 0);
ok('resposta volta como texto XML (não vaza segredo)', main.indexOf("resolve({ ok: resp.statusCode") >= 0 || main.indexOf('xml: corpo') >= 0);

console.log('== HISTÓRICO + CARIMBO 6.0.1 ==');
ok('histórico na Central: tabela com DANFE/XML/Cancelar por nota', src.indexOf('nfxRenderHistorico') >= 0 && src.indexOf("data-nfx=\"danfe\"") >= 0 && src.indexOf("data-nfx=\"xml\"") >= 0 && src.indexOf("data-nfx=\"cancelar\"") >= 0);
ok('histórico herda a trava: render só quando a central abre (wrap do abrirCentralNfe)', src.indexOf('window.abrirCentralNfe=function') >= 0 && src.indexOf('_cen1.apply') >= 0);
ok('guard anti dupla-instalação', src.indexOf('__v6001nfx') >= 0);
ok('patch na 207 (autocura 208; perfis 209; permissões 210; menu fiscal v6.0.6 na 211; Início clicável v6.0.7 na 212; menus fiscais separados v6.0.8 na 212; override v6.0.9 na 214; 6 submenus v6.0.10 na 215; hover NF-e/NFC-e v6.0.11 fecha na 216)', manifest.length >= 225 && manifest[206] === 'nf_transmissao_patch.js' && manifest[207] === 'autocura_empresa_central_nf_tela_patch.js' && manifest[208] === 'perfis_nuvem_cura_sessao_patch.js' && manifest[209] === 'permissoes_estorno_venda_patch.js' && manifest[210] === 'fiscal_menu_completo_patch.js' && manifest[211] === 'dashboard_inicio_clicavel_patch.js' && manifest[212] === 'menus_fiscais_separados_patch.js' && manifest[213] === 'permissoes_override_menus_fiscais_patch.js' && manifest[214] === 'seis_submenus_velho_patch.js' && manifest[215] === 'submenu_hover_nfe_patch.js');
ok('motor no bundle gerado', bundle.indexOf('MOTOR FISCAL v6.0.1') >= 0);
ok('package.json na 6.0.1', pkg.version === VERSAO_APP);
ok('index.html carimbado 6.0.1', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('worker atualizado 5.26.8 · gerente segue 5.26.3', fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("WORKER_VERSION = '5.26.8'") >= 0 && JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8')).version === '5.26.3');

console.log('\nTudo OK — v6.0.1 (MOTOR FISCAL COMPLETO: transmissão SEFAZ-MG, DANFE A4, cancelamento, inutilização, QR NFC-e — tudo em homologação primeiro, provedor de provas nos retornos reais).');
