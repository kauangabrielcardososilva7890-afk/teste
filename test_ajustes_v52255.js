const fs = require('fs');
const { ORCAMENTO_APROVACAO_V52255_PURE: P } = require('./ajustes_v52255_orcamento_aprovacao_venda_patch.js');

function ok(n, c){ if(!c){ console.error('FAIL:', n); process.exit(1); } console.log('OK:', n); }

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

ok('versão 5.22.55 base', P.VERSAO === '5.22.55' && /^5\.22\.\d+/.test(pkg.version));

// Mock do ambiente do ERP
global.db = {
  orcamentos: [
    {
      id: 'orc_teste_1',
      empresaId: 'emp_1',
      numero: '101',
      token: 'tok_abc123',
      clienteId: 'cli_1',
      clienteNome: 'Maria Silva',
      total: 350.00,
      status: 'aberto',
      itens: [
        { produtoId: 'prod_1', descricao: 'Manutenção L3150', qtd: 1, preco: 350.00, subtotal: 350.00, tipo: 'Serviço' }
      ]
    },
    {
      id: 'orc_teste_2',
      empresaId: 'emp_1',
      numero: '102',
      token: 'tok_xyz456',
      clienteId: 'cli_1',
      clienteNome: 'Maria Silva',
      total: 150.00,
      status: 'aberto',
      itens: [
        { produtoId: 'prod_2', descricao: 'Toner Preto', qtd: 1, preco: 150.00, subtotal: 150.00, tipo: 'Produto' }
      ]
    }
  ],
  vendas: [],
  produtos: [
    { id: 'prod_2', nome: 'Toner Preto', estoque: 10, preco: 150.00, categoria: 'Cartucho' }
  ],
  clientes: [
    { id: 'cli_1', nome: 'Maria Silva' }
  ],
  notificacoes: []
};

global.window = {
  db: global.db
};
global.getSession = function(){ return { usuarioId: 'usr_adm', usuarioNome: 'Denivaldo', empresaId: 'emp_1' }; };
global.saveDB = function(){};

// 1. Teste de aprovação e geração de venda salva
const vendaGerada = P.gerarVendaSalvaDeOrcamento('orc_teste_1', 'cliente');
ok('venda salva foi gerada', vendaGerada && vendaGerada.id.startsWith('vda_orc_'));
ok('venda tem status aguardar (salva)', vendaGerada && vendaGerada.status === 'aguardar');
ok('venda tem total correto', vendaGerada && vendaGerada.total === 350.00);

const orc1 = global.db.orcamentos.find(o => o.id === 'orc_teste_1');
ok('orçamento mudou status para aprovado', orc1 && orc1.status === 'aprovado');
ok('orçamento tem vendaId vinculada', orc1 && orc1.vendaId === vendaGerada.id);

// 2. Teste de recusa de orçamento
P.recusarOrcamento('orc_teste_2');
const orc2 = global.db.orcamentos.find(o => o.id === 'orc_teste_2');
ok('orçamento mudou status para recusado', orc2 && orc2.status === 'recusado');

ok('patch no manifesto do bundle', manifest.includes('ajustes_v52255_orcamento_aprovacao_venda_patch.js'));
ok('patch no files do electron-builder', pkg.build.files.indexOf('ajustes_v52255_orcamento_aprovacao_venda_patch.js') >= 0);
ok('index carrega scripts na versão 5.22', /app\.bundle\.js\?v=5\.22\.\d+/.test(html) && /ajustes_v52255_orcamento_aprovacao_venda_patch\.js\?v=5\.22\.\d+/.test(html));
ok('rodapé v5.22', /footer-version/.test(html) && /v5\.22\.\d+/.test(html));

console.log('TODOS OS TESTES DE v5.22.55 PASSARAM COM SUCESSO!');
