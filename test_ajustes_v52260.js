const assert = require('assert');
const fs = require('fs');
const { PURE_V52260 } = require('./ajustes_v52260_orcamento_trava_venda_atalho_patch.js');

console.log('Testando Ajustes v5.22.60 (Trava de Orçamentos Autorizados, Atalho Venda e Exclusão)...');

// 1. Versão
assert.strictEqual(PURE_V52260.VERSAO, '5.22.60', 'Versão deve ser 5.22.60');

// 2. Patch deve conter a trava para orçamentos autorizados
const patchSrc = fs.readFileSync('ajustes_v52260_orcamento_trava_venda_atalho_patch.js', 'utf8');

assert.ok(patchSrc.includes('isAutorizado'), 'Patch deve conter lógica de verificação isAutorizado');
assert.ok(patchSrc.includes('Orçamento AUTORIZADO — Edição bloqueada'), 'Patch deve exibir aviso de bloqueio em orçamento autorizado');
assert.ok(patchSrc.includes('abrirVendaDeOrcamento'), 'Patch deve conter função de atalho para abrir venda salva gerada');
assert.ok(patchSrc.includes('excluirOrcamentosMarcados'), 'Patch deve conter função funcional de exclusão');
assert.ok(patchSrc.includes('orcSelCliente'), 'Patch deve definir window.orcSelCliente');
assert.ok(patchSrc.includes('orcLimparCliente'), 'Patch deve definir window.orcLimparCliente');

// 3. Validação de que o botão 'Copiar link' NÃO está presente
assert.ok(!patchSrc.includes('Copiar link'), 'Patch não deve conter botão Copiar link');

console.log('✅ Testes de Ajustes v5.22.60 concluídos com sucesso!');
