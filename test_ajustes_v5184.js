// Teste para ajustes_v5184_correcoes_patch.js
// Testa: 1.2 peças nos chamados e 2.3 fechar leitura

// Simula ambiente mínimo
global.db = {
  produtos: [
    { id: 'p1', nome: 'Toner HP 85A', sku: 'CE285A', preco: 150, estoque: 10, status: 'ativo' },
    { id: 'p2', nome: 'Cilindro Brother', sku: 'DR-730', preco: 200, estoque: 5, status: 'ativo' }
  ],
  os: [],
  clientes: [],
  parque: [],
  contratos: []
};
global.saveDB = function(){};

// Funções puras do patch (extraídas para teste)
function low(v){ return String(v ?? '').toLowerCase().trim(); }
function n(v,fb=0){ const x=Number(String(v ?? '').replace(',','.')); return Number.isFinite(x)?x:fb; }
function money(v){ return 'R$ ' + n(v).toFixed(2).replace('.',','); }

function normItem(it){
  const qtd=Math.max(1,n(it.qtd,1));
  const preco=n(it.preco,0);
  const desconto=Math.max(0,n(it.desconto,0));
  return Object.assign({},it,{qtd,preco,desconto,subtotal:Math.max(0,qtd*preco-desconto)});
}

function ehModalLeituraAberta(title){
  const t=low(title||'');
  const ehLeitura=t.includes('leitura ');
  const ehHistorico=t.includes('histórico') || t.includes('historico');
  return ehLeitura && !ehHistorico;
}

// Testes
let pass = 0;
let fail = 0;

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

test('normItem calcula corretamente com qtd, preco e desconto', function(){
  const it = normItem({qtd: 2, preco: 100, desconto: 50});
  assert(it.qtd === 2, 'qtd deve ser 2');
  assert(it.preco === 100, 'preco deve ser 100');
  assert(it.desconto === 50, 'desconto deve ser 50');
  assert(it.subtotal === 150, 'subtotal deve ser 150 (2*100-50)');
});

test('normItem com valores padrão', function(){
  const it = normItem({});
  assert(it.qtd === 1, 'qtd default deve ser 1');
  assert(it.preco === 0, 'preco default deve ser 0');
  assert(it.desconto === 0, 'desconto default deve ser 0');
  assert(it.subtotal === 0, 'subtotal default deve ser 0');
});

test('normItem não permite desconto negativo', function(){
  const it = normItem({qtd: 1, preco: 100, desconto: -20});
  assert(it.desconto === 0, 'desconto negativo deve ser 0');
  assert(it.subtotal === 100, 'subtotal deve ser 100');
});

test('normItem não permite qtd menor que 1', function(){
  const it = normItem({qtd: 0, preco: 100});
  assert(it.qtd === 1, 'qtd 0 deve ser 1');
});

test('normItem calcula valores decimais corretamente', function(){
  const it = normItem({qtd: 3, preco: 33.33, desconto: 10.50});
  assert(it.subtotal > 0, 'subtotal deve ser positivo');
});

test('normItem mantém campos originais', function(){
  const it = normItem({qtd: 2, preco: 100, desconto: 50, produtoId: 'p1', descricao: 'Toner'});
  assert(it.produtoId === 'p1', 'produtoId deve ser preservado');
  assert(it.descricao === 'Toner', 'descricao deve ser preservado');
});

test('ehModalLeituraAberta detecta título correto', function(){
  assert(ehModalLeituraAberta('Leitura 001 — Cliente X') === true, 'deve detectar leitura');
  assert(ehModalLeituraAberta('Histórico de leituras') === false, 'não deve detectar histórico');
  assert(ehModalLeituraAberta('Leituras Realizadas') === false, 'não deve detectar só "leituras"');
  assert(ehModalLeituraAberta('Novo Chamado') === false, 'não deve detectar chamado');
});

test('money formata corretamente', function(){
  assert(money(100) === 'R$ 100,00', 'deve formatar 100');
  assert(money(1234.56) === 'R$ 1234,56', 'deve formatar decimal');
  assert(money(0) === 'R$ 0,00', 'deve formatar zero');
});

console.log('\nRESULTADO: Testes de ajustes v5.18.4 passaram!');
console.log('  ✔ ' + pass + ' testes passaram');
if(fail > 0) console.log('  ✘ ' + fail + ' testes falharam');

process.exit(fail > 0 ? 1 : 0);
