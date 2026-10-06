'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('app.js', 'utf8');
const start = source.indexOf('function renderDashboard(){');
const marker = source.indexOf('USUARIOS RENDER', start);
const end = source.lastIndexOf('\n}', marker);
assert(start >= 0 && end > start, 'renderDashboard deve continuar extraível para validação isolada');

const db = {
  clientes: [], produtos: [], contratos: [], parque: [], os: [], equipamentos: [],
  contasReceber: [], vendas: [], orcamentos: [], leituras: [], logs: []
};
const context = {
  db,
  getSession: () => ({ empresaId: 'empresa-teste', usuarioNome: 'Teste', login: 'teste' }),
  document: { getElementById: () => null },
  window: {},
  fmtMoney: value => `R$ ${Number(value || 0).toFixed(2)}`,
  fmtDateTime: () => '',
  initials: () => 'T',
  Date,
  Number,
  String,
  Array,
  Math,
  console
};

vm.runInNewContext(source.slice(start, end + 2), context, { filename: 'app.js' });
assert.doesNotThrow(() => context.renderDashboard(), 'o dashboard não deve falhar quando algum componente opcional estiver ausente');

const written = new Map();
context.document.getElementById = id => ({
  set textContent(value) { written.set(id, String(value)); },
  set innerHTML(value) { written.set(id, String(value)); },
  get offsetParent() { return null; }
});
assert.doesNotThrow(() => context.renderDashboard(), 'o dashboard deve funcionar com uma página que tenha só parte dos componentes');
assert.equal(written.get('kpi-contratos'), '0');
console.log('OK — renderDashboard tolera componentes opcionais ausentes sem interromper a navegação.');
