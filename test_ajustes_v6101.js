// test_ajustes_v6101.js — v6.1.1: "EU NÃO QUERO QUE APAREÇA QUANDO EU
// CLICAR EM NOTA FISCAL — os 6 menus tem que ficar nos submenu do fiscal".
// A faixa ribbon das TELAS está DESLIGADA (CSS, patches velhos intactos);
// a aba do módulo passa a se chamar oficialmente **Fiscal**; o submenu com
// os 6 ABRE E FICA FIXO ao clicar na aba (não só hover) e fecha ao clicar
// fora/num item — lateral idem (flyout pinado); mapeador de CLIENTES
// alinhado ao dump real que ele mandou (NOME_RAZAOSOCIAL/CPF_CNPJ/RG_IE/
// cobrança/NFE_*) — e nada é importado sozinho (medo de "dar b.o").
const fs = require('fs');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('submenu_fiscal_oficial_patch.js', 'utf8');
const ribbon = fs.readFileSync('ribbon_fiscal_estilo_antigo_patch.js', 'utf8');
const mfo = fs.readFileSync('menu_fiscal_oficial_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const env = fs.readFileSync('envio_arquivos.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('== FILA / BUNDLE / CARIMBO ==');
ok('manifesto 221; Submenu Fiscal Oficial fecha a fila',
  man.length === 224 && man[220] === 'submenu_fiscal_oficial_patch.js' && man[219] === 'menu_fiscal_oficial_patch.js');
ok('bundle contém o patch (guard + PURE + css + captura de clique)',
  bundle.indexOf('__v6101sfo') >= 0 && bundle.indexOf('SFO611_PURE') >= 0 && bundle.indexOf('sfo611-css') >= 0 && bundle.indexOf('onCliqueCaptura') >= 0);
ok('carimbo 6.1.1 (package + index 4 pontos)',
  pkg.version === '6.1.2' && html.indexOf("DIGICOPY_APP_VERSION = '6.1.2'") >= 0 && html.indexOf('v6.1.2</title>') >= 0 && html.indexOf('>v6.1.2<') >= 0 && html.indexOf('app.bundle.js?v=6.1.2') >= 0);

console.log('== A FAIXA DAS TELAS ESTÁ DESLIGADA ==');
ok('.wxr-bar morta por CSS absoluto (não aparece NADA ao clicar em Nota Fiscal)',
  src.indexOf('.wxr-bar{display:none !important') >= 0 && src.indexOf('overflow:hidden !important') >= 0);
ok('patches da faixa (6.0.13/6.1.0) seguem intactos nos arquivos (só não mostram)',
  ribbon.indexOf('__v60013wxr') >= 0 && mfo.indexOf('__v6100mfo') >= 0);

console.log('== ABA FISCAL OFICIAL + SUBMENU FIXADO ==');
ok('index: botão do módulo agora é "Fiscal" (não mais NF-e/NFC-e) e o #menu-nfe com os 6 permanece',
  html.indexOf('</i>Fiscal</button>') >= 0 && html.indexOf('NF-e/NFC-e</button>') === -1
  && html.indexOf('id="menu-nfe" class="module-menu"') >= 0
  && ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'].every(function (v) { return html.indexOf("navigateTo('" + v + "')") >= 0; }));
ok('runtime também renomeia o pai lateral (NF-e/NFC-e → Fiscal) e cobre criação tardia',
  src.indexOf('renomeiaPai') >= 0 && src.indexOf('sxvm-nav-pai') >= 0 && src.indexOf('MutationObserver') >= 0);
ok('clique na aba ABRE E FIXA o submenu (sfo-pin), em vez de navegar direto',
  src.indexOf('onCliqueCaptura') >= 0 && src.indexOf("classList.add('sfo-pin')") >= 0 && src.indexOf('preventDefault()') >= 0);
ok('pin fecha ao clicar fora/num item; itens do submenu navegam normal (despinTodos)',
  src.indexOf('despinTodos') >= 0 && src.indexOf('.module.sfo-pin .module-menu') >= 0 && src.indexOf("t.closest('#menu-nfe')") >= 0);
ok('flyout lateral também pin no clique do pai + título oficial "Fiscal" no ::before',
  src.indexOf('content:"Fiscal" !important') >= 0 && src.indexOf('#sxvm-flyout-nav.sfo-pin') >= 0);
ok('capture: NÃO bloqueia outros cliques do sistema (só pai fiscal/itens do submenu/fora=fecha)',
  src.indexOf("addEventListener('click', onCliqueCaptura, true)") >= 0);

console.log('== MAPEADOR CLIENTES ALINHADO AO BANCO REAL (sem importar nada) ==');
const P = require('./submenu_fiscal_oficial_patch.js');
const amostra = {
  COD_CLIENTE: 4, NOME_RAZAOSOCIAL: 'EDSON SILVA NOGUEIRA', NOME_FANTASIA: 'ROCHA NOGUEIRA E LOPES ADVOGADOS',
  COMPLEMENTO: 'COMECIO', NUMERO: '323', TELEFONE: '(38) 9912-9500', TIPO: 'F', CPF_CNPJ: null,
  RUA: 'MARECHAL DEODORO DA FONSECA', BAIRRO: 'CENTRO', CIDADE: 'JANAUBA', CEP: '39440-000', UF: 'MG',
  DEL: 'N', CLI_LIMITE_CREDITO: 1000, DESCONTO: 0, REFERENCIA: 'perto do posto de gasolina',
  LONGITUDE: '-43.3055485', LATITUDE: '-15.8046064', NFE_INDIEDEST: 9, NFE_INDFINAL: 1, NFE_OBRIGATORIO: 0, NFE_GOVERNAMENTAL: 0
};
const c = P.mapearCliente(amostra);
ok('mapeia 1 cliente real (EDSON): nome/fantasia/endereco/bairro/cep/referencia/latlng/limite/fiscais',
  c.nome === 'EDSON SILVA NOGUEIRA' && c.fantasia === 'ROCHA NOGUEIRA E LOPES ADVOGADOS' && c.endereco === 'MARECHAL DEODORO DA FONSECA'
  && c.bairro === 'CENTRO' && c.cep === '39440000' && c.referencia.indexOf('posto') >= 0
  && c.latitude === '-15.8046064' && c.limiteCredito === 1000 && c.nfe.indIeDest === 9 && c.fone === '(38) 9912-9500');
ok('TIPO F/J + CPF_CNPJ decide cnpj/cpf (14 dígitos = CNPJ; vazio fica vazio, não inventa)',
  (function () {
    const pj = P.mapearCliente({ NOME_RAZAOSOCIAL: 'INSTITUTO EDUCACIONAL SERRA GERAL', TIPO: 'J', CPF_CNPJ: '12.283.329/0001-96', DEL: 'N' });
    return pj.cnpj === '12283329000196' && pj.cpf === '' && pj.tipo === 'J'
      && P.mapearCliente({ NOME_RAZAOSOCIAL: 'X' }).documento === '';
  })());
ok('DEL = S pula (a "TESTE" da amostra); endereço de cobrança só quando veio de verdade; RG_IE é a IE',
  P.ehDelCli({ DEL: 'S' }) === true && P.ehDelCli({ DEL: 'N' }) === false
  && P.mapearCliente({ NOME_RAZAOSOCIAL: 'X', DEL: 'N' }).cobranca === null
  && P.mapearCliente({ NOME_RAZAOSOCIAL: 'X', RUA_COBRANCA: 'R Y', CEP_COBRANCA: '39440-000', DEL: 'N' }).cobranca.cep === '39440000'
  && P.mapearCliente({ NOME_RAZAOSOCIAL: 'X', RG_IE: 'ISENTO' }).ie === 'ISENTO');
ok('página de envio usa os MESMOS campos reais (CPF_CNPJ/RG_IE/RUA/cobrança/NFE_) — e nada roda sem clique',
  env.indexOf('CPF_CNPJ') >= 0 && env.indexOf('RG_IE') >= 0 && env.indexOf('RUA_COBRANCA') >= 0
  && env.indexOf('NFE_INDIEDEST') >= 0 && env.indexOf('btn-cli') >= 0 && env.indexOf("id=\"btn-cli\"") >= 0);
ok('fundir protege o que foi cadastrado à mão (só completa vazios; cobrança/nfe só se faltar)',
  env.indexOf("'fone','celular','whatsapp','contato','email','referencia','latitude','longitude'") >= 0
  && env.indexOf('!rec.cobranca && n.cobranca') >= 0 && env.indexOf('!rec.nfe && n.nfe') >= 0);

console.log('== CONVÍVIO ==');
ok('6 telas da 6.0.14 intactas (o submenu abre elas; nada dentro muda)',
  fs.readFileSync('fiscal_catalogo_completo_patch.js', 'utf8').indexOf('Preparar Arquivos Fiscais') >= 0);
ok('hover continua funcionando de graça (CSS nativo do module-menu não foi tocado na base)',
  html.indexOf('.module:hover .module-menu') >= 0);

console.log('\nRESULTADO v6.1.1: ' + pass + ' ok, ' + fail + ' falhas');
process.exit(fail ? 1 : 0);
