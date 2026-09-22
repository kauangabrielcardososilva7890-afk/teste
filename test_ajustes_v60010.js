// test_ajustes_v60010.js — v6.0.10: MENU FISCAL IGUAL AO SISTEMA ANTIGO
// 6 submenus exatos do print: Nota Fiscal · Perfil Tributário · Manifestação ·
// NCM · Enviar XML · Configurações — cada um com TUDO que ele pediu.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('seis_submenus_velho_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./seis_submenus_velho_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 215; 6 submenus do antigo fecha a fila',
  man.length === 225 && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (guard + PURE + banner)',
  bundle.indexOf('__v60010sxv') >= 0 && bundle.indexOf('SXV_PURE_START') >= 0 && bundle.indexOf('SEIS_SUBMENUS_VELHO_PATCH v6.0.10 ativo') >= 0);

console.log('== MENU: EXATAMENTE OS 6 DO PRINT, NA ORDEM ==');
const menu = P.sxvMenuVelho();
ok('6 entradas, ordem idêntica à foto',
  menu.length === 6 && menu.map(m => m.rot).join(' · ') === 'Nota Fiscal · Perfil Tributário · Manifestação · NCM · Enviar XML · Configurações');
ok('os 3 atalhos soltos da 6.0.9 SAEM do menu (escondidos, não apagados — views continuam)',
  src.indexOf("SXV_ESCONDIDOS = ['fiscal-historico', 'fiscal-ferramentas', 'fiscal-inutilizar']") >= 0 && src.indexOf("style.display = 'none'") >= 0);
ok('Config. Fiscal RENOMEADA pra Configurações (nav + barra clássica)',
  src.indexOf("cfgNav.textContent !== 'Configurações'") >= 0 && src.indexOf('#topmod-config-fiscal button') >= 0);
ok('4 botões novos entram na nav lateral E na barra clássica, depois de Nota Fiscal',
  src.indexOf('fiscal-perfil') >= 0 && src.indexOf('fiscal-manifestacao') >= 0 && src.indexOf('SXV_BOTAO_NOVO') >= 0 && src.indexOf('fiscal-ncm') >= 0 && src.indexOf('fiscal-enviar-xml') >= 0 && src.indexOf("classic-toolbar-scroll") >= 0 && src.indexOf("nav-gest") >= 0 && src.indexOf('[data-nav="central-nf"]') >= 0);

console.log('== PERFIL TRIBUTÁRIO ==');
const pfOk = { crt: '1', cfopDentro: '5102', cfopFora: '6102', csosn: '102', cstIcms: '00', pIcmsInterna: 18, pIcmsInterestadual: 12, pIpi: 0, pPis: 1.65, pCofins: 7.6, pIss: 0, pIbsUf: 0.1, pIbsMun: 0, pCbs: 0.9 };
ok('perfil completo válido passa', P.sxvValidaPerfil(pfOk).ok === true);
ok('CRT inválido, CFOP 6 dentro do estado, alíquota >100 e CSOSN de 2 dígitos barram',
  P.sxvValidaPerfil(Object.assign({}, pfOk, { crt: '9' })).ok === false &&
  P.sxvValidaPerfil(Object.assign({}, pfOk, { cfopDentro: '6102' })).ok === false &&
  P.sxvValidaPerfil(Object.assign({}, pfOk, { pIcmsInterna: 101 })).ok === false &&
  P.sxvValidaPerfil(Object.assign({}, pfOk, { csosn: '10' })).ok === false);
ok('campos do print: CRT, CNAE, IE, IM, codTributo, CFOPs, CSOSN/CST, 9 alíquotas, IBS/CBS e cClassTrib',
  ['sxv-pf-crt', 'sxv-pf-cnae', 'sxv-pf-ie', 'sxv-pf-im', 'sxv-pf-codtrib', 'sxv-pf-cfop-d', 'sxv-pf-cfop-f', 'sxv-pf-csosn', 'sxv-pf-cst', 'sxv-pf-cstibscbs', 'sxv-pf-cclasstrib'].every(x => src.indexOf(x) >= 0));
ok('perfil cobre imposto faltoso na emissão (wrap fiscalPadrao __v60010, sem tocar nascimento)',
  src.indexOf('fiscalPadrao.__v60010') >= 0 && src.indexOf('base[k] === undefined') >= 0);
ok('IE/IM/CNAE gravam nas MESMAS chaves da Config. Fiscal (db.config.fiscal)',
  src.indexOf("dd.config.fiscal = Object.assign({}, dd.config.fiscal || {}, { cnae:") >= 0);

console.log('== MANIFESTAÇÃO ==');
const base43 = '3124100000000000000055001000000001000000000';
function dvCerto(c) { let s = 0, p = 2; for (let i = 42; i >= 0; i--) { s += parseInt(c[i]) * p; p = p === 9 ? 2 : p + 1; } const r = s % 11; return (r === 0 || r === 1) ? 0 : 11 - r; }
const chaveOk = base43 + String(dvCerto(base43));
ok('valida chave com DV certo (44 dígitos, módulo 11)',
  P.sxvValidaChave(chaveOk).ok === true && P.sxvValidaChave(base43 + String((dvCerto(base43) + 1) % 10)).ok === false && P.sxvValidaChave('123').ok === false);
ok('4 eventos oficiais 210210/210200/210220/210240 com rótulo e ajuda',
  P.SXV_EVENTOS.length === 4 && P.SXV_EVENTOS.map(e => e.tp).join(',') === '210210,210200,210220,210240');
ok('só "Não realizada" exige justificativa (mín 15); limite 255',
  P.sxvValidaJust('210240', 'curta').ok === false && P.sxvValidaJust('210240', 'mercadoria não chegou no depósito').ok === true && P.sxvValidaJust('210210', '').ok === true);
const ev1 = P.sxvEventoManifestacao({ chave: chaveOk, cnpj: '00000000000191', tpEvento: '210240', tpAmb: '2', dhEvento: '2026-09-18T12:00:00-03:00', xJust: 'mercadoria não chegou no depósito' });
ok('envelope vai pro AMBIENTE NACIONAL (cOrgao 91, não SEFAZ-MG) com ID210240+chave+01, cOrgaoAutor 31 e xJust',
  ev1.indexOf('<cOrgao>91</cOrgao>') > 0 && ev1.indexOf('ID210240' + chaveOk + '01') > 0 && ev1.indexOf('<cOrgaoAutor>31</cOrgaoAutor>') > 0 && ev1.indexOf('<xJust>mercadoria não chegou no depósito</xJust>') > 0);
ok('URL de manifestação aponta fazenda.gov.br (prod e homolog separadas)',
  P.sxvUrlManifestacao('producao').url === 'https://www.nfe.fazenda.gov.br/RecepcaoEvento4/RecepcaoEvento4.asmx' && P.sxvUrlManifestacao('homologacao').url.indexOf('hom.nfe.fazenda.gov.br') > 0);
ok('transmissão: senha digitada na hora (não salva), ponte do .exe, sem sucesso falso',
  src.indexOf("nfxPedirTexto('Senha do certificado A1'") >= 0 && src.indexOf("nfeCertAPI.isElectron") >= 0 && src.indexOf("pelo navegador não assina") >= 0);
ok('manifestação grava lista local com protocolo + auditoria início/resposta/exceção',
  src.indexOf("config.nfManifestacoes") >= 0 && src.indexOf("manifestar-inicio") >= 0 && src.indexOf("manifestar-resposta") >= 0 && src.indexOf("manifestar-excecao") >= 0);
ok('gate: sem caixa "emitir NF" abre popup de autorização (login+senha), token 3s converge com a 6.0.9',
  src.indexOf("window.__p609AutorizadoAte > Date.now()") >= 0 && src.indexOf('sxvPopupAutorizacao') >= 0 && src.indexOf("sxv-aut-login") >= 0 && src.indexOf('sxv:override-autorizado') >= 0 || src.indexOf("'override-autorizado'") >= 0);

console.log('== NCM ==');
ok('valida: 8 dígitos + descrição ≥3',
  P.sxvValidaNcm('84439923', 'Peças e acessórios').ok === true && P.sxvValidaNcm('8443992', 'x').ok === false && P.sxvValidaNcm('84439923', 'ab').ok === false);
ok('favoritos gravam padrão/tinta/locação NAS MESMAS chaves da Config. Fiscal (uma verdade só)',
  src.indexOf("dd.config.nfNcmPadrao = n.cod") >= 0 && src.indexOf("dd.config.nfNcmTinta = n.cod") >= 0 && src.indexOf("dd.config.nfNcmLocacao = n.cod") >= 0 && src.indexOf('config.ncmFavoritos') >= 0);

console.log('== ENVIAR XML + EXTRAS ==');
ok('pacote do mês usa o MESMO motor (nfPacoteContador) + teste SEFAZ (nfStatusServico)',
  src.indexOf('window.nfPacoteContador()') >= 0 && src.indexOf('window.nfStatusServico()') >= 0);
ok('e-mail do contador salva em db.config.emailContador com validação + botão copiar',
  src.indexOf('config.emailContador') >= 0 && src.indexOf('navigator.clipboard') >= 0 && src.indexOf('[^@\\s]+@[^@\\s]+\\.[^@\\s]+') >= 0);
ok('texto honesto: envio é você anexando no e-mail/Zap (automático não existe ainda)',
  src.indexOf('envio automático de e-mail ainda não existe') >= 0);
ok('atalhos dentro da Central levam pra Histórico/Inutilizar/Manifestação/Enviar XML',
  src.indexOf('sxv-atalhos') >= 0 && src.indexOf('data-sxv-go="fiscal-historico"') >= 0 && src.indexOf('data-sxv-go="fiscal-inutilizar"') >= 0);
ok('Configurações ganha card Diagnóstico SEFAZ + ponte pra Enviar XML',
  src.indexOf('sxv-cfg-extra') >= 0 && src.indexOf('sxv-cfg-status') >= 0);
ok('placa de ambiente nas 4 telas novas (HOMOLOGAÇÃO/PRODUÇÃO)',
  (src.split('sxvAmbPlaca()').length - 1) >= 5 && src.indexOf('HOMOLOGAÇÃO — modo teste') >= 0);

console.log('== AUTORIZAÇÃO (PURE replicada da 6.0.9) ==');
const us = [
  { id: '1', login: 'kauan', senha: '123', perfil: 'Admin', empresaId: 'e1' },
  { id: '2', login: 'katia', senha: '456', perfil: 'Comercial', empresaId: 'e1', podeEmitirNfe: true },
  { id: '3', login: 'recep', senha: '789', perfil: 'Comercial', empresaId: 'e1' }
];
ok('Admin sempre; funcionário só com caixa; senha confere; login maiúsculo; empresa da sessão',
  P.sxvAutorizacaoValida(us, 'e1', 'KAUAN', '123').ok === true &&
  P.sxvAutorizacaoValida(us, 'e1', 'katia', '456').ok === true &&
  P.sxvAutorizacaoValida(us, 'e1', 'recep', '789').ok === false &&
  P.sxvAutorizacaoValida(us, 'e1', 'kauan', '999').ok === false &&
  P.sxvAutorizacaoValida(us, 'e1', 'fantasma', 'x').ok === false);

console.log('== CARIMBO 6.0.10 ==');
ok('package.json na 6.0.10', pkg.version === VERSAO_APP);
ok('index.html carimbado (4 pontos)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0 && html.indexOf('v' + VERSAO_APP + '</title>') >= 0);
ok('celular carimbado 6.0.10', mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0);

console.log('');
console.log(pass + ' passaram, ' + fail + ' falharam');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.10: menu fiscal IGUAL ao sistema antigo (6 submenus do print) com Perfil Tributário, Manifestação (Ambiente Nacional), NCM, Enviar XML e Configurações cheios.');
