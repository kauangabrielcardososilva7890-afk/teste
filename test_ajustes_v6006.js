// test_ajustes_v6006.js — v6.0.6: MENU FISCAL COMPLETO
// CC-e 110110 · Testar SEFAZ (status serviço) · Pacote do mês (zip STORE puro)
// · NCM por tipo (mapa do dump) · texto do Simples (vazio por padrão)
const fs = require('fs');
const crypto = require('crypto');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const fmc = fs.readFileSync('fiscal_menu_completo_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./fiscal_menu_completo_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 216; Início clicável 212, separados 213, override 214, 6 submenus 215, hover NF-e/NFC-e v6.0.11 fecha a fila', man.length === 218 && man[210] === 'fiscal_menu_completo_patch.js' && man[211] === 'dashboard_inicio_clicavel_patch.js' && man[212] === 'menus_fiscais_separados_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[209] === 'permissoes_estorno_venda_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (PURE + banner)', bundle.indexOf('FMC606_PURE_START') >= 0 && bundle.indexOf('v6.0.6 — MENU FISCAL COMPLETO') >= 0);

console.log('== CC-e (110110) ==');
const evt = P.fmcEventoCCe({ chave: '12345678901234567890123456789012345678901234', seq: 2, correcao: 'Texto da correção com acentoé & <x>', cnpj: '14605475000100', cOrgao: '31', tpAmb: '2', dhEvento: '2026-09-18T10:00:00-03:00' });
ok('envelope é evento 110110 com Id correto (ID110110+chave+seq02)', evt.indexOf('ID11011012345678901234567890123456789012345678901234"') < 0 && evt.indexOf('ID1101101234567890123456789012345678901234567890123402') >= 0 && evt.indexOf('<tpEvento>110110</tpEvento>') >= 0);
ok('detEvento tem descEvento Carta de Correcao + xCorrecao escapada + xCondUso legal', evt.indexOf('<descEvento>Carta de Correcao</descEvento>') >= 0 && evt.indexOf('acentoé &amp; &lt;x&gt;') >= 0 && evt.indexOf('<xCondUso>') >= 0 && evt.indexOf('Convenio S/N') >= 0);
ok('número da CC-e vai em nSeqEvento (múltiplas por nota)', evt.indexOf('<nSeqEvento>2</nSeqEvento>') >= 0);
ok('CC-e exportada nas ações + exige nota autorizada e texto 15+', fmc.indexOf('window.nfCartaCorrecao=') >= 0 && fmc.indexOf("nota.status!=='autorizada'") >= 0 && fmc.indexOf('minimo:15') >= 0);
ok('botão CC-e entra no histórico só em AUTORIZADA (com contador)', fmc.indexOf('data-nfx="cce"') >= 0 && fmc.indexOf("nota.status!=='autorizada'") >= 0);

console.log('== STATUS DO SERVIÇO (dormia na tabela desde a 6.0.1) ==');
const stat = P.fmcConsStatServ({ tpAmb: '2', cUF: '31' });
ok('consStatServ 4.00 com tpAmb/cUF/xServ STATUS', stat.indexOf('versao="4.00"') >= 0 && stat.indexOf('<cUF>31</cUF>') >= 0 && stat.indexOf('<xServ>STATUS</xServ>') >= 0);
ok('exportada nfStatusServico: usa serviço "status" e trata 107 operando', fmc.indexOf('window.nfStatusServico=') >= 0 && fmc.indexOf("nfxUrl(amb,'55','status')") >= 0 && fmc.indexOf("ret.cStat==='107'") >= 0);
ok('sem ponte = instrução do .exe, nunca sucesso falso', fmc.indexOf('fmcSemPonte') >= 0 && fmc.indexOf('só roda no app de computador (.exe)') >= 0);

console.log('== PACOTE DO MÊS (zip STORE puro, sem biblioteca) ==');
const crc = P.fmcCrc32(new Uint8Array('123456789'.split('').map(c => c.charCodeAt(0))));
ok('CRC32 bate o vetor clássico (123456789 → 0xCBF43926)', crc === 0xCBF43926);
const zip = P.fmcZipStore([{ nome: 'NFe_teste.xml', conteudo: '<xml>ok</xml>' }, { nome: 'indice.txt', conteudo: 'linha\r\n' }]);
function achaSig(u8, sig) { for (let i = 0; i < u8.length - 3; i++) { if (u8[i] === sig[0] && u8[i+1] === sig[1] && u8[i+2] === sig[2] && u8[i+3] === sig[3]) return i; } return -1; }
ok('zip tem header local (04034b50), central (02014b50) e EOCD (06054b50)', achaSig(zip, [0x50,0x4b,0x03,0x04]) === 0 && achaSig(zip, [0x50,0x4b,0x01,0x02]) > 0 && achaSig(zip, [0x50,0x4b,0x05,0x06]) === zip.length - 22);
ok('zip método STORE (0) + flag UTF-8 de nomes (0x0800)', zip[8] === 0 && zip[9] === 0 && (zip[6] | (zip[7] << 8)) === 0x0800);
ok('EOCD declara 2 arquivos', zip[zip.length - 22 + 10] === 2 && zip[zip.length - 22 + 11] === 0);
ok('pacote exportado: filtra mês, nunca inventa XML (vazio = aviso), inclui indice.txt + eventos/', fmc.indexOf('window.nfPacoteContador=') >= 0 && fmc.indexOf('Nenhuma nota com XML em ') >= 0 && fmc.indexOf("nome:'indice.txt'") >= 0 && fmc.indexOf("'eventos/CANCELAMENTO_'") >= 0);

console.log('== NCM POR TIPO (mapa do dump) ==');
const itens = P.fmcNcmPorTipo(
  [{ produtoId: 'p1', nome: 'Toner' }, { produtoId: 'p2', nome: 'Refil' }, { produtoId: 'p3', nome: 'Mensalidade' }],
  [{ id: 'p1', nome: 'Toner', ncm: '84439923' }, { id: 'p2', nome: 'Refil', categoria: 'Recarga' }, { id: 'p3', nome: 'Mensalidade', categoria: 'Serviço' }],
  { nfNcmPadrao: '00000000', nfNcmTinta: '32151100', nfNcmLocacao: '37079021', nfDescLocacao: 'CARTUCHO TONER' }, true);
ok('produto.ncm do cadastro SEMPRE ganha', itens[0].ncm === '84439923');
ok('Recarga sem NCM → NCM tinta do dump (32151100)', itens[1].ncm === '32151100');
ok('item de leitura/locação sem NCM → NCM locação (37079021)', itens[2].ncm === '37079021');
ok('wrap do montarDocumento aplica a regra no docConferido', fmc.indexOf("window.NFE_EMISSAO_PURE.montarDocumento=embrMd") >= 0 && fmc.indexOf('fmcNcmPorTipo(doc.itens') >= 0);

console.log('== TEXTO DO SIMPLES (vazio por padrão; só produção; nunca do dump cego) ==');
ok('injeta no infCpl existente', P.fmcAplicarTextoInfCpl('<NFe><infCpl>base</infCpl></NFe>', 'TEXTO X') === '<NFe><infCpl>TEXTO X base</infCpl></NFe>');
ok('cria infAdic quando não existe', P.fmcAplicarTextoInfCpl('<NFe><a/></infNFe-tail>'.replace('-tail',''), 'Y').indexOf('<infAdic><infCpl>Y</infCpl></infAdic></infNFe>') >= 0);
ok('texto vazio NÃO toca o XML (nada entra sozinho)', P.fmcAplicarTextoInfCpl('<NFe><infCpl>z</infCpl></NFe>', '  ') === '<NFe><infCpl>z</infCpl></NFe>');
ok('escapa < & do texto (não quebra o XML)', P.fmcAplicarTextoInfCpl('<NFe><infCpl>z</infCpl></NFe>', 'a<b&c').indexOf('a&lt;b&amp;c') >= 0);
ok('só injeta em PRODUÇÃO (homologação já tem o selo NOTA DE TESTE)', fmc.indexOf("if(fmcAmb()==='producao')") >= 0 && fmc.indexOf("cfg.nfTextoSimples.trim()) xml=fmcAplicarTextoInfCpl") >= 0);
ok('campo nasce vazio na Central + aviso dos “valores prontos” do dump', fmc.indexOf("nfTextoSimples:String(c.nfTextoSimples||'')") >= 0 && fmc.indexOf('texto do sistema antigo trazia valores prontos') >= 0);

console.log('== CENTRAL: OPERAÇÕES + CONFIGURAÇÃO ==');
ok('linha de operações (Testar SEFAZ + Pacote) na Central', fmc.indexOf("ops.id='fmc-ops'") >= 0 && fmc.indexOf('Testar SEFAZ agora') >= 0 && fmc.indexOf('Pacote do mês p/ contador (zip)') >= 0);
ok('card configuração fiscal com 4 NCMs/descrição + textarea + salvar na nuvem', fmc.indexOf("card.id='fmc-config'") >= 0 && fmc.indexOf('#fmc-cfg-salvar') >= 0 && fmc.indexOf("db.config.nfTextoSimples=") >= 0);
ok('classes fiscais reaproveitadas (claro/escuro da 6.0.3)', fmc.indexOf('cnf-card') >= 0 && fmc.indexOf('cnf-input') >= 0 && fmc.indexOf('cnf-btn') >= 0);

console.log('== CARIMBO 6.0.9 ==');
ok('package.json na 6.0.9', pkg.version === '6.0.13');
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '6.0.13'") >= 0 && html.indexOf('>v6.0.13<') >= 0 && html.indexOf('app.bundle.js?v=6.0.13') >= 0);
ok('celular carimbado 6.0.9', mob.indexOf("DIGICOPY_APP_VERSION = '6.0.13'") >= 0 && mob.indexOf('>v6.0.13<') >= 0);

console.log('\n' + pass + ' passaram, ' + fail + ' falharam.');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.6: menu fiscal completo pra prévia dele (CC-e, Testar SEFAZ, pacote do mês pro contador em zip puro, NCM por tipo, texto do Simples vazio por padrão).');
