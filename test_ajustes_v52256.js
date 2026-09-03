const fs = require('fs');
const { ORCAMENTO_APROVACAO_V52256_PURE: P } = require('./ajustes_v52256_orcamento_venda_limpa_patch.js');

function ok(n, c){ if(!c){ console.error('FAIL:', n); process.exit(1); } console.log('OK:', n); }

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

ok('versão 5.22.56 base', P.VERSAO === '5.22.56' && /^5\.22\.\d+/.test(pkg.version));

// Mock do ambiente do ERP
global.db = {
  orcamentos: [
    {
      id: 'orc_teste_56_1',
      empresaId: 'emp_1',
      numero: '201',
      clienteId: 'cli_1',
      clienteNome: 'João Souza',
      total: 500.00,
      status: 'aberto',
      itens: [
        { produtoId: 'prod_1', descricao: 'Manutenção EPSON L4160', qtd: 1, preco: 500.00, subtotal: 500.00, tipo: 'Serviço' }
      ]
    },
    {
      id: 'orc_teste_56_2',
      empresaId: 'emp_1',
      numero: '202',
      token: 'tok_56_xyz',
      clienteId: 'cli_1',
      clienteNome: 'João Souza',
      total: 100.00,
      status: 'aberto',
      itens: [
        { produtoId: 'prod_2', descricao: 'Tinta Preta', qtd: 2, preco: 50.00, subtotal: 100.00, tipo: 'Produto' }
      ]
    }
  ],
  vendas: [],
  produtos: [
    { id: 'prod_2', nome: 'Tinta Preta', estoque: 15, preco: 50.00, categoria: 'Insumo' }
  ],
  clientes: [
    { id: 'cli_1', nome: 'João Souza' }
  ],
  notificacoes: []
};

global.window = {
  db: global.db
};
global.getSession = function(){ return { usuarioId: 'usr_adm', usuarioNome: 'Denivaldo', empresaId: 'emp_1' }; };
global.saveDB = function(){};

// 1. Garante tokens em orçamentos sem token
P.garantirTokensOrcamentos();
const orcSemToken = global.db.orcamentos.find(o => o.id === 'orc_teste_56_1');
ok('orçamento ganhou token gerado automaticamente', orcSemToken && orcSemToken.token && orcSemToken.token.startsWith('orc_tok_'));

// 2. Teste de aprovação e geração de venda salva
const vendaGerada = P.gerarVendaSalvaDeOrcamento('orc_teste_56_1', 'cliente_web');
ok('venda salva foi gerada com sucesso', vendaGerada && vendaGerada.id.startsWith('vda_orc_'));
ok('venda gerada tem status aguardar', vendaGerada && vendaGerada.status === 'aguardar');
ok('venda gerada tem total 500.00', vendaGerada && vendaGerada.total === 500.00);

const orc1 = global.db.orcamentos.find(o => o.id === 'orc_teste_56_1');
ok('orçamento mudou status para aprovado', orc1 && orc1.status === 'aprovado');
ok('orçamento tem vendaId vinculada', orc1 && orc1.vendaId === vendaGerada.id);

// 3. Teste de recusa de orçamento
P.recusarOrcamento('orc_teste_56_2');
const orc2 = global.db.orcamentos.find(o => o.id === 'orc_teste_56_2');
ok('orçamento mudou status para recusado', orc2 && orc2.status === 'recusado');

// 4. Validações de integridade estrutural
ok('patch no manifesto do bundle', manifest.includes('ajustes_v52256_orcamento_venda_limpa_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52256_orcamento_venda_limpa_patch.js'));
ok('index carrega scripts na versão 5.22', /app\.bundle\.js\?v=5\.22\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52256_orcamento_venda_limpa_patch.js'));
ok('rodapé v5.22', /footer-version/.test(html) && /v5\.22\.\d+/.test(html));
ok('título v5.22', /Sistema Digicopy v5\.22\.\d+/.test(html));

console.log('TODOS OS TESTES DE v5.22.56 PASSARAM COM SUCESSO!');
