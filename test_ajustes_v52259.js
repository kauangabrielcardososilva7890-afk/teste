const assert = require('assert');
const fs = require('fs');
const { PURE_V52259 } = require('./ajustes_v52259_orcamento_filtros_item_patch.js');

console.log('Testando Ajustes v5.22.59 (Filtros de Orçamentos e Tipos de Item)...');

// 1. Versão
assert.strictEqual(PURE_V52259.VERSAO, '5.22.59', 'Versão deve ser 5.22.59');

// 2. Não deve existir tipo 'Serviço' no select de tipo de item do modal de orçamento
const patchSrc = fs.readFileSync('ajustes_v52259_orcamento_filtros_item_patch.js', 'utf8');
const patch58Src = fs.readFileSync('ajustes_v52258_orcamento_os_revalidar_patch.js', 'utf8');

assert.ok(!patchSrc.includes('<option>Serviço</option>'), 'Patch 59 não deve conter option Serviço no select de tipo de item');
assert.ok(!patchSrc.includes('<option value="Serviço">Serviço</option>'), 'Patch 59 não deve conter option value Serviço no select de tipo de item');
assert.ok(!patch58Src.includes('<option>Serviço</option>'), 'Patch 58 não deve conter option Serviço no select de tipo de item');

// 3. Tipos válidos são apenas Produto e Recarga de toner
assert.strictEqual(PURE_V52259.ehRecargaTipo('Recarga de toner'), true);
assert.strictEqual(PURE_V52259.ehRecargaTipo('Produto'), false);

// 4. Filtros de Cliente e Categorias de Produto disponíveis
assert.ok(Array.isArray(PURE_V52259.CAMPOS_CLIENTE), 'Campos de cliente devem estar definidos');
assert.ok(PURE_V52259.CAMPOS_CLIENTE.some(c => c[0] === 'todos' && c[1] === 'Pesquisar em tudo'));
assert.ok(PURE_V52259.CAMPOS_CLIENTE.some(c => c[0] === 'codigo' && c[1] === 'Código'));
assert.ok(PURE_V52259.CAMPOS_CLIENTE.some(c => c[0] === 'documento' && c[1] === 'CPF/CNPJ'));

assert.ok(Array.isArray(PURE_V52259.CATS_PRODUTO), 'Categorias de produto devem estar definidas');
assert.ok(PURE_V52259.CATS_PRODUTO.includes('Cartucho'));
assert.ok(PURE_V52259.CATS_PRODUTO.includes('Insumo'));
assert.ok(PURE_V52259.CATS_PRODUTO.includes('Equipamento'));

assert.ok(Array.isArray(PURE_V52259.CAMPOS_RECARGA), 'Campos de recarga devem estar definidos');
assert.ok(PURE_V52259.CAMPOS_RECARGA.some(r => r[0] === 'codigo' && r[1] === 'Código'));
assert.ok(PURE_V52259.CAMPOS_RECARGA.some(r => r[0] === 'nome' && r[1] === 'Descrição'));

// 5. Presença dos selects de filtro no HTML gerado pelo modal
assert.ok(patchSrc.includes('id="orc-cli-campo"'), 'Deve conter o select de filtro de campos do cliente');
assert.ok(patchSrc.includes('id="orc-prod-cat"'), 'Deve conter o select de categorias de produtos');
assert.ok(patchSrc.includes('id="orc-rec-campo"'), 'Deve conter o select de campos de recargas');
assert.ok(patchSrc.includes('id="orc-item-cartucho"'), 'Deve conter o campo de etiqueta de recarga');
assert.ok(patchSrc.includes('id="orc-etq-lupa"'), 'Deve conter o botão de lupa de etiqueta');

// 6. Não deve existir o botão "Copiar link" no rodapé do modal de orçamento
assert.ok(!patchSrc.includes('Copiar link'), 'Modal de orçamento não deve conter botão Copiar link');
assert.ok(!patch58Src.includes('Copiar link'), 'Patch 58 não deve conter botão Copiar link');

// 7. Validação da página pública do cliente (public-orcamento/index.html e orcamento_pagar.html)
const publicHtml = fs.readFileSync('public-orcamento/index.html', 'utf8');
const pagarHtml = fs.readFileSync('orcamento_pagar.html', 'utf8');

assert.ok(publicHtml.includes('tela(d)'), 'Página pública deve renderizar instantaneamente com dados do payload d');
assert.ok(publicHtml.includes('AbortController'), 'Página pública deve ter timeout com AbortController para nunca travar');
assert.ok(pagarHtml.includes('tela(d)'), 'Página fallback deve renderizar instantaneamente com dados do payload d');

console.log('✅ Testes de Ajustes v5.22.59 concluídos com sucesso!');
