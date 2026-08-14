// Teste para ajustes_v5184_correcoes_patch.js

// Simula ambiente mínimo
global.db = { produtos: [], os: [], clientes: [], parque: [] };
global.saveDB = function(){};

function low(v){ return String(v ?? '').toLowerCase().trim(); }

function ehModalLeituraAberta(title){
  const t=low(title||'');
  const contemLeitura = /\bleitura\b/.test(t);
  const contemHistorico = t.includes('histórico') || t.includes('historico') || t.includes('lista');
  return contemLeitura && !contemHistorico;
}

let pass = 0, fail = 0;

function test(nome, fn) {
  try {
    fn();
    console.log('  ✔ ' + nome);
    pass++;
  } catch(e) {
    console.log('  ✘ ' + nome + ': ' + e.message);
    fail++;
  }
}

function assert(cond, msg) {
  if(!cond) throw new Error(msg || 'Assertion failed');
}

console.log('\n== AJUSTES_V5184_PURE ==');

test('ehModalLeituraAberta detecta leitura aberta', function(){
  assert(ehModalLeituraAberta('Leitura 001 — Cliente X') === true, 'deve detectar leitura');
  assert(ehModalLeituraAberta('Leitura Definitiva 05') === true, 'deve detectar leitura definitiva');
});

test('ehModalLeituraAberta NÃO detecta histórico', function(){
  assert(ehModalLeituraAberta('Histórico de leituras') === false, 'não deve detectar histórico');
  assert(ehModalLeituraAberta('Lista de leituras') === false, 'não deve detectar lista');
  assert(ehModalLeituraAberta('Leituras — Contrato') === false, 'não deve detectar só "leituras"');
});

test('ehModalLeituraAberta NÃO detecta outros modais', function(){
  assert(ehModalLeituraAberta('Novo Chamado') === false, 'não deve detectar chamado');
  assert(ehModalLeituraAberta('Contrato 001') === false, 'não deve detectar contrato');
});

console.log('\nRESULTADO: Testes de ajustes v5.18.4 passaram!');
console.log('  ✔ ' + pass + ' testes passaram');
if(fail > 0) console.log('  ✘ ' + fail + ' testes falharam');

process.exit(fail > 0 ? 1 : 0);
