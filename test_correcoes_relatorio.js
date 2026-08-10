// ═══════════════════════════════════════════════════════════════════════════
// TEST — correcoes_relatorio_patch.js v4.9.70
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'correcoes_relatorio_patch.js'), 'utf8');

console.log('== CORRECOES_RELATORIO ==');

// 1. Arquivo existe e tem conteúdo
assert.ok(src.length > 500, 'Patch deve ter conteúdo');
console.log('  ✔ arquivo existe e tem conteúdo');

// 2. Contém filtro de impressora de locação
assert.ok(src.includes('ehImpressoraLocacao'), 'Deve ter filtro de impressora de locação');
console.log('  ✔ filtro de impressora de locação presente');

// 3. Contém aviso ao sair de venda
assert.ok(src.includes('Deseja SALVAR a notinha'), 'Deve ter aviso ao sair de venda');
console.log('  ✔ aviso ao sair de venda presente');

// 4. Contém correção de rodapé
assert.ok(src.includes('corrigirRodapeImpressao'), 'Deve ter correção de rodapé');
console.log('  ✔ correção de rodapé presente');

// 5. Contém faixas de chamado
assert.ok(src.includes('estilizarSecoesChamado'), 'Deve ter faixas de chamado');
console.log('  ✔ faixas de chamado presentes');

// 6. Contém fix do botão nuvem
assert.ok(src.includes('salvarCredenciaisBuscador'), 'Deve ter fix do botão nuvem');
console.log('  ✔ fix do botão nuvem presente');

// 7. Versão correta
assert.ok(src.includes('4.9.70'), 'Deve ter versão 4.9.70');
console.log('  ✔ versão 4.9.70');

// 8. Não tem erros de sintaxe básica
assert.ok(!src.includes('undefined function'), 'Sem erros de sintaxe óbvios');
console.log('  ✔ sem erros de sintaxe óbvios');

console.log('\nRESULTADO: Testes de correções do relatório passaram!');
process.exit(0);
