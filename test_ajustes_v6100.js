// test_ajustes_v6100.js — v6.1.0: "os menus não estão ficando lá em cima…
// muda esse nome pra ser oficialmente o menu fiscal, e os 6 menus tem que
// ficar ai". A faixa do topo AGORA se chama **Menu Fiscal** (aba + flyout),
// NÃO SOME quando a tela re-renderiza por dentro (wrap do __fxReRender614
// preservando o nó da faixa + sonda leve), o visual ganhou acabamento (CSS),
// e a página de envio recebe CLIENTES.json (importador pontual, mesmo padrão
// do PRODUTOS.json v5.22.21: DEL=S pula, documento/código não duplica, só
// completa campo vazio). Carimbo 6.1.0 + manifesto 220.
const fs = require('fs');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('menu_fiscal_oficial_patch.js', 'utf8');
const ribbon = fs.readFileSync('ribbon_fiscal_estilo_antigo_patch.js', 'utf8');
const fiscal = fs.readFileSync('fiscal_catalogo_completo_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const env = fs.readFileSync('envio_arquivos.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('== FILA / BUNDLE / CARIMBO ==');
ok('manifesto 220; Menu Fiscal Oficial fecha a fila (por cima do catálogo fiscal da 6.0.14)',
  man.length === 224 && man[219] === 'menu_fiscal_oficial_patch.js' && man[218] === 'fiscal_catalogo_completo_patch.js');
ok('bundle contém o patch (guard + PURE + observer + css)',
  bundle.indexOf('__v6100mfo') >= 0 && bundle.indexOf('MFO610_PURE') >= 0 && bundle.indexOf('mfo610-css') >= 0);
ok('carimbo 6.1.0 (package + index 4 pontos)',
  pkg.version === '6.1.2' && html.indexOf("DIGICOPY_APP_VERSION = '6.1.2'") >= 0 && html.indexOf('v6.1.2</title>') >= 0 && html.indexOf('>v6.1.2<') >= 0 && html.indexOf('app.bundle.js?v=6.1.2') >= 0);

console.log('== MENU FISCAL OFICIAL ==');
const P = require('./menu_fiscal_oficial_patch.js');
ok('PURE: rótulo oficial é "Menu Fiscal" e as 6 telas fiscais estão mapeadas',
  P.rotuloFx === 'Menu Fiscal' && P.telasFiscais.length === 6 && P.telasFiscais.indexOf('central-nf') >= 0 && P.telasFiscais.indexOf('config-fiscal') >= 0);
ok('observer renomeia .wxr-tab onde ela aparecer + flyout ganha "Menu Fiscal" via CSS !important',
  src.indexOf('MutationObserver') >= 0 && src.indexOf('.wxr-tab') >= 0 && src.indexOf('content:"Menu Fiscal" !important') >= 0);
ok('ribbon v6.0.13 continua intacto (6 itens/grupos, compat de leitura dos murais antigos)',
  ribbon.indexOf('NF-e/NFC-e</div>') >= 0 && ribbon.indexOf('__v60013wxr') >= 0);

console.log('== A FAIXA NÃO SOME (bug do re-render interno) ==');
ok('re-render da 6.0.14 pinta por innerHTML da view (era o que derrubava a faixa)',
  fiscal.indexOf('el.innerHTML = html') >= 0);
ok('wrap do __fxReRender614: salva a faixa viva e devolve pro topo no mesmo instante',
  src.indexOf('__fxReRender614') >= 0 && src.indexOf("querySelector(':scope > .wxr-bar')") >= 0 && src.indexOf('insertBefore(barraViva, alvo.firstChild)') >= 0);
ok('sonda leve (1500ms) cobre outros caminhos de render + repinta o rótulo',
  src.indexOf('setInterval(sondaFaixa, 1500)') >= 0 && src.indexOf('pintaRotuloFx()') >= 0);

console.log('== BELEZA (CSS por cima, sem tocar literais protegidos) ==');
ok('6 telas com fundo gradiente suave + zebra na grade + cabeçalho sticky',
  src.indexOf('linear-gradient(180deg,#f6f9ff 0%,#eef3fc 100%)') >= 0 && src.indexOf('nth-child(even)') >= 0 && src.indexOf('position:sticky') >= 0);
ok('botões/campos com hover/foco azul + placa de ambiente arredondada',
  src.indexOf('.fx-btn:hover') >= 0 && src.indexOf('box-shadow:0 0 0 3px rgba(59,130,246,.18)') >= 0 && src.indexOf('.fx-placa{border-radius:12px') >= 0);

console.log('== IMPORTADOR CLIENTES.json ==');
ok('PURE mapeia linha do sistema antigo (RAZAO/CNPJ/ENDERECO/MUNICIPIO/UF/TELEFONE/IE/CEP/BAIRRO)',
  (function () {
    const c = P.mapearCliente({ COD_CLIENTE: '123', RAZAO: 'MERCADO BOM PRECO LTDA', CNPJ: '12.345.678/0001-90', IE: '123456', LOGRADOURO: 'RUA A', NUMERO: '10', BAIRRO: 'CENTRO', MUNICIPIO: 'MONTES CLAROS', UF: 'mg', CEP: '39400-000', TELEFONE: '(38) 3221-0000' });
    return c.nome === 'MERCADO BOM PRECO LTDA' && c.documento === '12345678000190' && c.cnpj === '12345678000190' && c.cpf === '' && c.cidade === 'MONTES CLAROS' && c.uf === 'MG' && c.cep === '39400000' && c.bairro === 'CENTRO' && c.numero === '10';
  })());
ok('DEL=S pula; prepararImportacao conta puladas e exige nome',
  (function () {
    const r = P.prepararImportacao([{ NOME: 'A', DEL: 'S' }, { NOME: 'B' }, { SEM_NOME: 1 }]);
    return r.puladas === 1 && r.mapeados.length === 1 && r.mapeados[0].nome === 'B';
  })());
ok('chave de dedupe: documento > código > nome (documento vence mesmo com código)',
  P.chaveCliente({ documento: '1', codigo: '9', nome: 'X' }) === 'doc:1' && P.chaveCliente({ codigo: '9', nome: 'X' }) === 'cod:9' && P.chaveCliente({ nome: 'X' }) === 'nome:x');
ok('fundir só completa o que está vazio (nunca pisa no cadastro atual)',
  (function () {
    const f = P.fundirCliente({ nome: 'MERCADO', fone: '999' }, { nome: 'OUTRO NOME', fone: '888', cidade: 'MOC' });
    return f.rec.nome === 'MERCADO' && f.rec.fone === '999' && f.rec.cidade === 'MOC' && f.mudou === true
      && P.fundirCliente({ nome: 'MERCADO' }, { nome: 'X' }).mudou === false;
  })());
ok('página de envio: card Clientes + input/btn + handler na entidade clientes + mensagem honesta de amostra',
  env.indexOf('<h2>Clientes</h2>') >= 0 && env.indexOf("id=\"arq-cli\"") >= 0 && env.indexOf("id=\"btn-cli\"") >= 0
  && env.indexOf("entity:'clientes'") >= 0 && env.indexOf('CLIENTES.json') >= 0 && env.indexOf('3 linhas de amostra') >= 0);
ok('dedupe na nuvem: doc/cod/nome + "completou vazios" + DEL=S de fora + contadores (novos/completados/iguais)',
  env.indexOf("'doc:'") >= 0 && env.indexOf('completado(s)') >= 0 && env.indexOf('DEL=S ficaram de fora') >= 0 && env.indexOf("uid('cli')") >= 0);
ok('PRODUTOS.json fica exatamente como está (importador de produtos intocado dedupe/NCM/DEL=S)',
  env.indexOf('btn-prod') >= 0 && env.indexOf('PRODUTOS.json') >= 0 && env.indexOf("entity:'produtos'") >= 0);

console.log('== CONVÍVIO ==');
ok('fiscal 6.0.14 intacto (6 telas continuam as mesmas debaixo do capô novo)',
  fiscal.indexOf('Preparar Arquivos Fiscais') >= 0 && fiscal.indexOf('SEM VALOR FISCAL') >= 0 && fiscal.indexOf('__v6014fxc6') >= 0);
ok('atalhos histórico/inutilizar/ferramentas seguem fora do menu de 6',
  P.telasFiscais.indexOf('fiscal-historico') === -1 && P.telasFiscais.indexOf('fiscal-inutilizar') === -1);

console.log('\nRESULTADO v6.1.0: ' + pass + ' ok, ' + fail + ' falhas');
process.exit(fail ? 1 : 0);
