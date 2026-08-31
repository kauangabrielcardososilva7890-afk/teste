const fs = require('fs');
const { ORCAMENTOS_PAGES_V52254_PURE: P } = require('./ajustes_v52254_orcamentos_pages_patch.js');

function ok(n, c){ if(!c){ console.error('FAIL:', n); process.exit(1); } console.log('OK:', n); }

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

ok('versão 5.22.54 base', P.VERSAO === '5.22.54' && /^5\.22\.\d+/.test(pkg.version));
ok('url Cloudflare Pages oficial', P.PAGINA_PAGES === 'https://digicopy-orcamentos.pages.dev/');

const orcMock = {
  id: 'orc_123',
  numero: 'ORC-2026-001',
  token: 'tok_abc123',
  data: '2026-08-29T12:00:00Z',
  total: 250.50,
  itens: [{ descricao: 'Manutenção Epson L3150', qtd: 1, preco: 250.50, subtotal: 250.50 }]
};
const cliMock = { nome: 'João da Silva' };
const empMock = { whatsapp: '38999998888' };

const link = P.linkOrcamento(orcMock, cliMock, empMock);
ok('link aponta para digicopy-orcamentos.pages.dev', link.startsWith('https://digicopy-orcamentos.pages.dev/?'));
ok('link contém token c=', link.includes('c=tok_abc123'));
ok('link contém payload d=', link.includes('d='));
ok('link contém versão v=5.22.54', link.includes('v=5.22.54'));

ok('patch no manifesto do bundle', manifest.includes('ajustes_v52254_orcamentos_pages_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52254_orcamentos_pages_patch.js'));
ok('index carrega scripts na versão 5.22', /app\.bundle\.js\?v=5\.22\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52254_orcamentos_pages_patch.js'));
ok('rodapé v5.22', /footer-version/.test(html) && /v5\.22\.\d+/.test(html));

// Teste de imunidade contra regressão de versão no DOM em tempo de execução
global.window = {
  DIGICOPY_APP_VERSION: '5.22.54',
  navigateTo: function(){ return true; },
  addEventListener: function(){},
  removeEventListener: function(){}
};
global.document = {
  getElementById: function(id){
    if(!this._els) this._els = {};
    if(!this._els[id]) this._els[id] = { id: id, textContent: '', style: {}, classList: { add: function(){}, remove: function(){} } };
    return this._els[id];
  },
  querySelector: function(){ return null; },
  querySelectorAll: function(){ return []; },
  title: 'Sistema Digicopy'
};

// Carrega os patches anteriores simulando o runtime
require('./ajustes_v52252_resolucao_loop_patch.js');
require('./ajustes_v52253_login_tela_branca_patch.js');
require('./ajustes_v52254_orcamentos_pages_patch.js');

// Simula navegação de menus (navigateTo)
global.window.navigateTo('financeiro');
ok('versão no rodapé após navegar para financeiro continua v5.22.54', global.document.getElementById('footer-version').textContent === 'v5.22.54');

global.window.navigateTo('dashboard');
ok('versão no rodapé após navegar para dashboard continua v5.22.54', global.document.getElementById('footer-version').textContent === 'v5.22.54');

global.window.navigateTo('clientes');
ok('versão no rodapé após navegar para clientes continua v5.22.54', global.document.getElementById('footer-version').textContent === 'v5.22.54');

console.log('TODOS OS TESTES DE v5.22.54 PASSARAM COM SUCESSO!');
