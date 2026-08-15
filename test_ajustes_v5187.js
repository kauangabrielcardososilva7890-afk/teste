const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5187_patch.js', 'utf8');

// Simula um document mínimo com os campos do formulário preenchidos
function makeDoc(fields){
  const map = {};
  Object.keys(fields).forEach(id => { map[id] = { value: fields[id] }; });
  return { getElementById: (id) => map[id] || null, body: null };
}

// Avalia a lógica pura com um document fake
const ctx = { window: {}, db: {}, document: makeDoc({
  'kr-os-desc': 'Troca de fusor',      // motivo digitado
  'kr-os-serv': 'Trocado fusor e limpeza', // serviços digitados
  'kr-os-obs': 'Aguardando peça color',    // observação digitada
  'kr-os-cont-atu': '5120',                 // contador digitado
  'kr-os-modelo': 'HP LaserJet',            // modelo digitado
  'kr-os-patr': 'P-999',                    // patrimônio digitado
}) };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, ctx.document);
const R = ctx.window.AJUSTES_V5187_PURE;

console.log('== AJUSTES_V5187_PURE: PDF puxa dados digitados ==');
const merged = R.coletarFormChamado({ id: 'os1', descricao: 'Antigo', servicos: '', observacao: '', contadorAtual: '5000', modelo: '', patrimonio: '' });
ok('motivo digitado sobrescreve o salvo', merged.descricao === 'Troca de fusor');
ok('serviços digitados entram', merged.servicos === 'Trocado fusor e limpeza');
ok('observação digitada entra', merged.observacao === 'Aguardando peça color');
ok('contador digitado sobrescreve', merged.contadorAtual === '5120');
ok('modelo digitado entra', merged.modelo === 'HP LaserJet');
ok('patrimônio digitado entra', merged.patrimonio === 'P-999');

// Caso 2: sem nada digitado (campos vazios) => mantém o salvo
const ctx2 = { window: {}, db: {}, document: makeDoc({}) };
new Function('window', 'db', 'document', code)(ctx2.window, ctx2.db, ctx2.document);
const R2 = ctx2.window.AJUSTES_V5187_PURE;
const merged2 = R2.coletarFormChamado({ id: 'os1', descricao: 'Salvo', servicos: 'Serv salvo' });
ok('sem digitação mantém o salvo', merged2.descricao === 'Salvo' && merged2.servicos === 'Serv salvo');

console.log('\nRESULTADO: Testes do ajustes_v5187 passaram!');
