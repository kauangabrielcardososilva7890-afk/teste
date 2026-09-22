// test_ajustes_v6008.js — v6.0.8: MENUS FISCAIS SEPARADOS
// Pedido dele: "separe os menus como nas fotos... o que tiver em configuração
// tira de lá e coloca no seu devido menu". Central = só operação; Config.
// Fiscal = menu próprio (certificado, CSC, NCMs, texto — mesmas chaves).
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('menus_fiscais_separados_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./menus_fiscais_separados_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 213; menus separados fecha a fila',
  man.length === 222 && man[212] === 'menus_fiscais_separados_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[211] === 'dashboard_inicio_clicavel_patch.js' && man[210] === 'fiscal_menu_completo_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (PURE + banner)',
  bundle.indexOf('MFS608_PURE_START') >= 0 && bundle.indexOf('v6.0.8 — MENUS FISCAIS SEPARADOS') >= 0);

console.log('== SEPARAÇÃO: config SAI da Central ==');
ok('esconde o card do CSC antigo (#cnf-cscid) e o card "Certificado A1" da Central',
  src.indexOf("querySelector('#cnf-cscid')") >= 0 && src.indexOf("indexOf('Certificado A1')") >= 0);
ok('esconde o card de config das notas da 6.0.6 (#fmc-config) da Central',
  src.indexOf("querySelector('#fmc-config')") >= 0);
ok('grade vazia some junta (não fica buraco na tela)',
  src.indexOf("if(!vis) grade.style.display='none'") >= 0);
ok('botão "Dados fiscais" da Central vira PONTE pro menu novo',
  src.indexOf("querySelector('#cnf-config')") >= 0 && src.indexOf("navigateTo('config-fiscal')") >= 0 && src.indexOf('⚙️ Configurações fiscais') >= 0);
ok('pós-limpeza roda DEPOIS da instalação da 6.0.6 (110ms > 60ms)',
  src.indexOf('setTimeout(mfsLimparCentral,110)') >= 0);
ok('OPERAÇÃO fica na Central: ambiente (Portão), Testar SEFAZ e pacote NÃO são escondidos',
  src.indexOf("cnf-amb") < 0 && src.indexOf("style.display='none'") >= 0 && src.indexOf('fmc-status') < 0 && src.indexOf('fmc-pacote') < 0);

console.log('== MENU PRÓPRIO: Config. Fiscal ==');
ok('view própria via ensureView + navigateTo embrulhado',
  src.indexOf("ensureView('config-fiscal')") >= 0 && src.indexOf("view==='config-fiscal'") >= 0);
ok('botão na nav lateral (data-nav) espelhando o Nota Fiscal',
  src.indexOf('[data-nav="config-fiscal"]') >= 0 && src.indexOf("getElementById('nav-gest')") >= 0 && src.indexOf("querySelector('[data-nav=\"central-nf\"]')") >= 0);
ok('módulo na barra clássica ao lado do Nota Fiscal',
  src.indexOf("getElementById('topmod-config-fiscal')") < 0 === false && src.indexOf("classic-toolbar-scroll") >= 0 && src.indexOf("getElementById('topmod-central-nf')") >= 0);
ok('tela mostra placa do ambiente (olhar) e manda trocar na Central protegida',
  src.indexOf('a troca é feita na Central NF (pede digitar PRODUCAO)') >= 0);
ok('dados fiscais: botão pro perfil tributário (CNPJ/IE/NCM + A1)',
  src.indexOf("onclick=function(){ try{ if(typeof abrirPerfilTributario==='function')") >= 0);
ok('certificado A1: status ao vivo + importar SÓ no .exe (ponte nfeCertAPI)',
  src.indexOf('__digicopyPontes.nfeCertAPI.status()') >= 0 && src.indexOf('nfeCertAPI.importar') >= 0 && src.indexOf('noExe') >= 0);

console.log('== UMA VERDADE SÓ nas chaves ==');
const d = P.mfsCfgLer({});
ok('defaults da 6.0.6 idênticos (tinta 32151100 · locação 37079021 · CARTUCHO TONER · Simples vazio)',
  d.nfNcmTinta === '32151100' && d.nfNcmLocacao === '37079021' && d.nfDescLocacao === 'CARTUCHO TONER' && d.nfTextoSimples === '' && d.nfAmbiente === 'homologacao');
const grav = P.mfsCfgNotas({}, { nfNcmPadrao: ' 84439923 ', nfNcmTinta: '32151100', nfNcmLocacao: '37079021', nfDescLocacao: 'CARTUCHO TONER', nfTextoSimples: 'texto' });
ok('salvar Notas grava as MESMAS chaves que a Central antiga gravava',
  grav.nfNcmPadrao === '84439923' && grav.nfNcmTinta === '32151100' && grav.nfTextoSimples === 'texto');
const csc = P.mfsCfgCsc({}, { nfCscId: ' 2 ', nfCsc: 'SEGREDO' });
ok('salvar CSC grava as MESMAS chaves (nfCscId/nfCsc) com trim no ID',
  csc.nfCscId === '2' && csc.nfCsc === 'SEGREDO');
ok('campos da tela usam as chaves compartilhadas (cfgf-cscid/cfgf-ncm-*)',
  src.indexOf('id="cfgf-cscid"') >= 0 && src.indexOf('id="cfgf-ncm-tinta"') >= 0 && src.indexOf('id="cfgf-txo-simples"') >= 0);
ok('salva refaz db.config via PURE + db.save + auditoria logAction',
  src.indexOf('mfsCfgCsc(db.config||{}') >= 0 && src.indexOf('mfsCfgNotas(db.config||{}') >= 0 && src.indexOf("db.save()") >= 0 && src.indexOf("logAction('fiscal'") >= 0);

console.log('== CARIMBO 6.0.9 ==');
ok('package.json na 6.0.9', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé + query)',
  html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0);
ok('celular carimbado 6.0.9', mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0);

console.log('');
console.log(pass + ' passaram, ' + fail + ' falharam');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.8: fiscal separado em DOIS menus (Central NF = operação; Config. Fiscal = certificado, CSC, NCMs e texto) como nas fotos do sistema antigo.');
