const assert = require('assert');
const fs = require('fs');
const { PURE_V52260 } = require('./ajustes_v52260_orcamento_trava_venda_atalho_patch.js');

console.log('Testando Ajustes v5.22.60 (Trava de Orçamentos Autorizados, Criação Única de Venda, Impressão com OS e Cliente)...');

// 1. Versão
assert.strictEqual(PURE_V52260.VERSAO, '5.22.60', 'Versão deve ser 5.22.60');

// 2. Patch deve conter a trava para orçamentos autorizados e atalhos
const patchSrc = fs.readFileSync('ajustes_v52260_orcamento_trava_venda_atalho_patch.js', 'utf8');

assert.ok(patchSrc.includes('isAutorizado'), 'Patch deve conter lógica de verificação isAutorizado');
assert.ok(patchSrc.includes('Orçamento AUTORIZADO — Edição bloqueada'), 'Patch deve exibir aviso de bloqueio em orçamento autorizado');
assert.ok(patchSrc.includes('abrirVendaDeOrcamento'), 'Patch deve conter função de atalho para abrir venda salva gerada');
assert.ok(patchSrc.includes('excluirOrcamentosMarcados'), 'Patch deve conter função funcional de exclusão');
assert.ok(patchSrc.includes('orcSelCliente'), 'Patch deve definir window.orcSelCliente');
assert.ok(patchSrc.includes('orcLimparCliente'), 'Patch deve definir window.orcLimparCliente');
assert.ok(patchSrc.includes('registrarExclusaoVendaOrcamento'), 'Patch deve conter rastreamento de exclusão de vendas');
assert.ok(patchSrc.includes('sanitizarOrcamentosVendasExcluidas'), 'Patch deve conter saneamento automático de orçamentos e vendas');

// 3. Teste funcional de Criação ÚNICA de Venda
global.db = {
  orcamentos: [
    {
      id: 'orc_t1',
      token: 'tok_t1',
      numero: '101',
      total: 150,
      itens: [{ descricao: 'Toner Preto', qtd: 1, preco: 150, subtotal: 150 }],
      os: {
        modelo: 'Epson L3250',
        numeroSerie: 'X123456',
        defeito: 'Não puxa papel',
        servicos: 'Troca do tracionador',
        tecnico: 'Carlos'
      },
      status: 'aberto'
    }
  ],
  vendas: [],
  clientes: [{ id: 'cli_1', nome: 'Cliente Teste' }]
};

const v1 = PURE_V52260.gerarVendaSalvaDeOrcamentoSafe('orc_t1', 'cliente_web');
assert.ok(v1, 'Deve gerar venda na primeira autorização');
assert.strictEqual(global.db.vendas.length, 1, 'Deve existir 1 venda gerada');

// Segunda chamada: NÃO deve duplicar nem criar venda nova
const v2 = PURE_V52260.gerarVendaSalvaDeOrcamentoSafe('orc_t1', 'cliente_web');
assert.strictEqual(global.db.vendas.length, 1, 'Não deve duplicar a venda');

// Deletar a venda: simula usuário excluindo a venda
PURE_V52260.registrarExclusaoVendaOrcamento(v1.id, v1);
global.db.vendas = []; // venda foi removida do banco

// Terceira chamada após exclusão da venda: NUNCA deve recriar a venda
const v3 = PURE_V52260.gerarVendaSalvaDeOrcamentoSafe('orc_t1', 'cliente_web');
assert.strictEqual(v3, null, 'Não deve recriar venda após o usuário ter excluído');
assert.strictEqual(global.db.vendas.length, 0, 'Banco de vendas deve permanecer vazio');

// 4. Teste de Impressão Completa com Ordem de Serviço
const htmlPrint = PURE_V52260.gerarHtmlOrcamentoCompleto('orc_t1');
assert.ok(htmlPrint.includes('ORDEM DE SERVIÇO'), 'HTML de impressão deve conter seção de Ordem de Serviço');
assert.ok(htmlPrint.includes('Epson L3250'), 'HTML de impressão deve exibir o modelo do equipamento');
assert.ok(htmlPrint.includes('X123456'), 'HTML de impressão deve exibir o número de série');
assert.ok(htmlPrint.includes('Não puxa papel'), 'HTML de impressão deve exibir o defeito relatado');

// 5. Teste de Link Público contendo dados de OS
const linkPub = PURE_V52260.linkPublicoOrcamento(global.db.orcamentos[0], global.db.clientes[0], {});
assert.ok(linkPub.includes('digicopy-orcamentos.pages.dev'), 'Link deve apontar para o Cloudflare Pages');
assert.ok(linkPub.includes('&d='), 'Link deve conter o payload de dados codificado');

console.log('✅ Testes de Ajustes v5.22.60 concluídos com sucesso!');
