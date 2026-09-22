const assert = require('assert');
const { PURE_V52258 } = require('./ajustes_v52258_orcamento_os_revalidar_patch.js');

console.log('Testando Ajustes v5.22.58 (Orçamentos com OS, Revalidação de Link e Venda Salva)...');

// 1. Versão
assert.strictEqual(PURE_V52258.VERSAO, '5.22.58', 'Versão deve ser 5.22.58');

// 2. Payload Link com e sem OS
const orcSemOS = {
  id: 'orc_1',
  token: 'tok_abc',
  numero: '101',
  clienteNome: 'João Silva',
  data: '2026-08-29',
  total: 250,
  itens: [{ descricao: 'Toner Preto', qtd: 2, preco: 100, subtotal: 200 }]
};

const payload1 = PURE_V52258.payloadLink(orcSemOS, { nome: 'João Silva' }, { whatsapp: '3899999999' });
assert.strictEqual(payload1.t, 'tok_abc');
assert.strictEqual(payload1.n, '101');
assert.strictEqual(payload1.c, 'João Silva');
assert.strictEqual(payload1.tot, 250);
assert.strictEqual(payload1.os, undefined, 'Orçamento sem OS não deve ter objeto os');

const orcComOS = {
  id: 'orc_2',
  token: 'tok_xyz',
  numero: '102',
  clienteNome: 'Empresa ABC',
  data: '2026-08-29',
  total: 450,
  itens: [{ descricao: 'Troca de Fusor', qtd: 1, preco: 450, subtotal: 450 }],
  os: {
    modelo: 'HP LaserJet M404',
    numeroSerie: 'BR123456',
    defeito: 'Papel atolando',
    servicos: 'Troca do rolo de tração e fusor',
    tecnico: 'Carlos'
  }
};

const payload2 = PURE_V52258.payloadLink(orcComOS, { nome: 'Empresa ABC' }, { whatsapp: '3899999999' });
assert.strictEqual(payload2.os.m, 'HP LaserJet M404');
assert.strictEqual(payload2.os.s, 'BR123456');
assert.strictEqual(payload2.os.def, 'Papel atolando');
assert.strictEqual(payload2.os.srv, 'Troca do rolo de tração e fusor');
assert.strictEqual(payload2.os.tec, 'Carlos');

// 3. Link gerado
const link = PURE_V52258.linkPublicoOrcamento(orcComOS, { nome: 'Empresa ABC' }, { whatsapp: '3899999999' });
assert.ok(link.startsWith('https://digicopy-orcamentos.pages.dev/'), 'Link deve apontar para Cloudflare Pages');
assert.ok(link.includes('c=tok_xyz'), 'Link deve conter o token c=');
assert.ok(link.includes('d='), 'Link deve conter payload d=');
assert.ok(link.includes('v=5.22.58'), 'Link deve conter v=5.22.58');

// 4. Teste de aprovação gerando venda salva com cópia da OS
global.window = global;
global.db = {
  orcamentos: [Object.assign({}, orcComOS, { status: 'aberto' })],
  vendas: [],
  notificacoes: [],
  clientes: [{ id: 'cli_1', nome: 'Empresa ABC' }],
  os: []
};
global.getSession = () => ({ usuarioId: 'usr_1', usuarioNome: 'Denivaldo', empresaId: 'emp_1' });
global.saveDB = () => {};

const vendaGerada = PURE_V52258.gerarVendaSalvaDeOrcamento('orc_2', 'cliente_web');
assert.ok(vendaGerada, 'Deve gerar venda salva');
assert.strictEqual(vendaGerada.status, 'aguardar', 'Venda salva deve ter status aguardar');
assert.strictEqual(vendaGerada.origemOrcamentoId, 'orc_2');
assert.ok(vendaGerada.os, 'Venda gerada deve herdar objeto de OS do orçamento');
assert.strictEqual(vendaGerada.os.modelo, 'HP LaserJet M404');
assert.strictEqual(global.db.orcamentos[0].status, 'aprovado', 'Orçamento deve transicionar para status aprovado');
assert.strictEqual(global.db.orcamentos[0].vendaId, vendaGerada.id);

// 5. Teste de Revalidação do Link
let alertMsg = null;
global.window.confirmSistema = (msg) => { alertMsg = msg; return Promise.resolve(true); };
global.window.lfbAlert = (msg) => { alertMsg = msg; };

PURE_V52258.revalidarLinkOrcamento('orc_2', true);
assert.strictEqual(global.db.orcamentos[0].status, 'aberto', 'Orçamento deve voltar para o status aberto');
assert.strictEqual(global.db.orcamentos[0].vendaId, null, 'Venda vinculada deve ser desvinculada');
assert.strictEqual(global.db.vendas.length, 0, 'Venda salva anterior deve ser excluída e revogada');
assert.notStrictEqual(global.db.orcamentos[0].token, 'tok_xyz', 'Deve gerar um novo token limpo');

console.log('✅ Testes de Ajustes v5.22.58 concluídos com sucesso!');
