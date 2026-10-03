const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('ajustes_v52436_leitura_uma_aberta_patch.js', 'utf8');
let db = { leituras: [] };
let selecionado = 'ctr-1';
let criadas = 0;
let leiturasAbertas = 0;
const window = {
  idContratoSelecionadoParaNovaLeitura: () => selecionado,
  criarLeituraDefinitiva() {
    criadas++;
    db.leituras.push({ id: `lei-${criadas}`, contratoId: selecionado, status: 'aberta', itens: [] });
  },
  novaLeituraContrato(contratoId) {
    criadas++;
    db.leituras.push({ id: `lei-${criadas}`, contratoId, status: 'aberta', itens: [] });
  },
  abrirLeituraDefinitiva() { leiturasAbertas++; },
  abrirLeituraContratoDetalhe() { leiturasAbertas++; }
};
new Function('window', 'document', 'db', 'toast', source)(window, {}, db, () => {});

const regra = window.LEITURA_UMA_ABERTA_V52436_PURE.leituraAbertaDoContrato;
assert.equal(typeof regra, 'function');

// Primeira leitura pelo menu geral: o contrato selecionado chega à mesma guarda.
window.criarLeituraDefinitiva();
assert.equal(criadas, 1, 'primeira leitura geral é permitida');

// Segunda leitura pelo menu geral: deve bloquear e abrir a existente.
window.criarLeituraDefinitiva();
assert.equal(criadas, 1, 'segunda leitura aberta pelo menu geral é bloqueada');
assert.equal(leiturasAbertas, 1);

// Uma leitura faturada é encerrada e não impede a próxima.
db.leituras[0].status = 'faturado';
assert.equal(regra(db, 'ctr-1'), null);
window.criarLeituraDefinitiva();
assert.equal(criadas, 2, 'criação depois de fechar a anterior é permitida');

// Estorno mantém a leitura aberta e bloqueia outra criação.
db.leituras[1].status = 'estornada';
assert.equal(regra(db, 'ctr-1').id, 'lei-2');
window.criarLeituraDefinitiva();
assert.equal(criadas, 2, 'leitura estornada continua contando como aberta');

// A criação dentro do contrato usa o argumento explícito e a mesma proteção.
window.novaLeituraContrato('ctr-1');
assert.equal(criadas, 2, 'criação pelo contrato também bloqueia a duplicata');
window.novaLeituraContrato('ctr-2');
assert.equal(criadas, 3, 'outro contrato continua podendo criar leitura');

console.log('PASS: uma leitura aberta por contrato nos caminhos geral e de contrato');
