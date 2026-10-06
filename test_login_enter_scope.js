'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('app.js', 'utf8');
const marker = '// Enter só envia o formulário do usuário';
const start = source.indexOf(marker);
const listenerStart = source.indexOf("document.addEventListener('keydown',e=>{", start);
const listenerEnd = source.indexOf('\n  });', listenerStart) + '\n  });'.length;
assert(start >= 0 && listenerStart > start && listenerEnd > listenerStart, 'listener de Enter deve estar presente');

let handler;
let calls = 0;
const classes = { login: new Set(), step: new Set() };
const document = {
  addEventListener(type, fn) { if (type === 'keydown') handler = fn; },
  getElementById(id) {
    const key = id === 'login-screen' ? 'login' : id === 'login-step-user' ? 'step' : null;
    return key ? { classList: { contains(name) { return classes[key].has(name); } } } : null;
  }
};
vm.runInNewContext(source.slice(listenerStart, listenerEnd), {
  document,
  doLoginUser() { calls++; }
});
assert.equal(typeof handler, 'function', 'listener captura Enter');

let prevented = false;
handler({ key: 'Enter', target: { id: 'v5260-senha' }, preventDefault() { prevented = true; } });
assert.equal(calls, 0, 'Enter no campo da conexão da nuvem não dispara o login do usuário');
assert.equal(prevented, false, 'Enter no painel da nuvem continua disponível para o formulário');

handler({ key: 'Enter', target: { id: 'login-user' }, preventDefault() { prevented = true; } });
assert.equal(calls, 1, 'Enter no campo de usuário envia o login');
assert.equal(prevented, true, 'Enter no login evita submissão duplicada');

classes.step.add('hidden');
handler({ key: 'Enter', target: { id: 'login-senha-user' }, preventDefault() {} });
assert.equal(calls, 1, 'Enter não autentica enquanto a etapa de usuário está oculta');

console.log('login_enter_scope: OK');
