const fs = require('fs');
const { ORCAMENTOS_PAGES_V52254_PURE: P } = require('./ajustes_v52254_orcamentos_pages_patch.js');

function ok(n, c){ if(!c){ console.error('FAIL:', n); process.exit(1); } console.log('OK:', n); }

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

ok('versão 5.22.54', P.VERSAO === '5.22.54' && pkg.version === '5.22.54');
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

ok('patch no manifesto do bundle', manifest.includes('ajustes_v52254_orcamentos_pages_patch.js') && manifest[manifest.length - 1] === 'ajustes_v52254_orcamentos_pages_patch.js');
ok('patch no files do electron-builder', pkg.build.files.indexOf('ajustes_v52254_orcamentos_pages_patch.js') >= 0);
ok('index carrega scripts na versão 5.22.54', /app\.bundle\.js\?v=5\.22\.54/.test(html) && /ajustes_v52254_orcamentos_pages_patch\.js\?v=5\.22\.54/.test(html));
ok('rodapé v5.22.54', /footer-version/.test(html) && /v5\.22\.54/.test(html));

console.log('TODOS OS TESTES DE v5.22.54 PASSARAM COM SUCESSO!');
