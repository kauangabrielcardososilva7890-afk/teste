// Testes do patch v5.20.23 — excluir multi-seleção (clientes + financeiro)
// e remoção definitiva de "contas a pagar".
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const PURO = require('./ajustes_v52023_patch.js');

// ═══════════════════════════════════════════════════════════════════════════
console.log('== V5.20.23: regra de vínculo do cliente ==');

function baseDb(){
  return {
    clientes: [
      { id: 'c1', nome: 'Cliente Livre' },
      { id: 'c2', nome: 'Cliente Com Contrato' },
      { id: 'c3', nome: 'Cliente Com Notinha' },
      { id: 'c4', nome: 'Outro Livre' }
    ],
    contratos: [{ id: 'ct1', clienteId: 'c2', status: 'ativo' }],
    vendas:    [{ id: 'v1',  clienteId: 'c3' }],
    os: [], leituras: [], parque: [],
    contasReceber: [
      { id: 'cr1', clienteId: 'c3', descricao: 'Venda 1', valor: 100 },
      { id: 'cr2', clienteId: null, descricao: 'Avulso',  valor: 50 }
    ]
  };
}

let db = baseDb();
ok('cliente sem movimentação não tem vínculo', PURO.vinculosDoCliente(db, 'c1').length === 0);
ok('cliente com contrato acusa vínculo', /contrato/.test(PURO.vinculosDoCliente(db, 'c2').join(',')));
ok('cliente com notinha acusa notinha E título', PURO.vinculosDoCliente(db, 'c3').length === 2);

// contrato já excluído não deve travar
db.contratos[0].status = 'excluido';
ok('contrato excluído não trava mais o cliente', PURO.vinculosDoCliente(db, 'c2').length === 0);

// ═══════════════════════════════════════════════════════════════════════════
console.log('== V5.20.23: plano de exclusão (libera x bloqueia) ==');
db = baseDb();
const plano = PURO.planejarExclusaoClientes(db, ['c1', 'c2', 'c3', 'c4']);
ok('libera os 2 clientes sem movimentação', plano.libera.length === 2);
ok('bloqueia os 2 com movimentação', plano.bloqueia.length === 2);
ok('o aviso de bloqueio explica o motivo', /contrato|notinha/.test(PURO.textoBloqueio(plano.bloqueia)));

// ═══════════════════════════════════════════════════════════════════════════
console.log('== V5.20.23: exclusão DELETA (não inativa) ==');
db = baseDb();
const removidos = PURO.removerClientes(db, ['c1', 'c4']);
ok('removeu 2 clientes', removidos === 2);
ok('sumiram do array de verdade', db.clientes.length === 2 && !db.clientes.find(c => c.id === 'c1'));
ok('não sobrou ninguém marcado como inativo', !db.clientes.some(c => c.status === 'inativo'));
ok('quem tinha vínculo continua na base', !!db.clientes.find(c => c.id === 'c2'));

// ═══════════════════════════════════════════════════════════════════════════
console.log('== V5.20.23: exclusão de títulos do financeiro ==');
db = baseDb();
const n = PURO.removerTitulos(db, ['cr1']);
ok('removeu 1 título', n === 1);
ok('título sumiu do contasReceber', db.contasReceber.length === 1 && db.contasReceber[0].id === 'cr2');

// ═══════════════════════════════════════════════════════════════════════════
console.log('== V5.20.23: contas a PAGAR deletado do código ==');
const app = fs.readFileSync('app.js', 'utf8');
ok('app.js sem renderModalContaPagar', !/function renderModalContaPagar/.test(app));
ok('app.js sem saveCP', !/function saveCP\(/.test(app));
ok('app.js sem baixarCP', !/function baixarCP\(/.test(app));
ok('app.js sem rota contaPagar no openModal', !/type==='contaPagar'/.test(app));

const notinha = fs.readFileSync('notinha_patch.js', 'utf8');
ok('financeiro sem botão Pagar', !/openModal\('contaPagar'\)/.test(notinha));
ok('financeiro sem o filtro de tipo Receber+Pagar', !/neo-fin-tipo/.test(notinha));
ok('financeiro não lê mais db.contasPagar', !/contasPagar/.test(notinha));

// ═══════════════════════════════════════════════════════════════════════════
console.log('== V5.20.23: caixas de seleção nas duas telas ==');
const fin = fs.readFileSync('finalizacao_sistema_patch.js', 'utf8');
ok('clientes tem checkbox por linha', /name="cliente-check-lote"/.test(fin));
ok('clientes tem botão excluir', /excluirClientesUnificado\(\)/.test(fin));
ok('clientes manteve o importar', /importarClientesJsonFinal\(\)/.test(fin));
ok('clientes manteve o botão Todos', /clientesMostrarTodos\(\)/.test(fin));
ok('clientes manteve a ordenação por coluna', /ordenarClientesFinal\(/.test(fin));

ok('financeiro tem checkbox por linha', /name="fin-check-lote"/.test(notinha));
ok('financeiro tem botão excluir', /excluirTitulosUnificado\(\)/.test(notinha));
ok('financeiro manteve busca, status e ordenação',
   /neo-search-fin/.test(notinha) && /neo-fin-status/.test(notinha) && /neo-fin-ordem/.test(notinha));

console.log('\nRESULTADO: Testes do v5.20.23 passaram!');
