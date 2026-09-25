// test_ajustes_v5184.js — PDF do chamado lado a lado (item 3 da v5.18.4).
// O QUE ESTE TESTE PRENDE: a FUNÇÃO "lado a lado" (caixas Dados do Cliente +
// Dados de Atendimento em grid 1fr 1fr), não o arquivo onde ela nasceu.
// Por que ele avalia o v5189 e não o v5184: o arquivo `ajustes_v5184_patch.js`
// virou fóssil (IIFE que não exporta nada — ver RELATORIO_SESSAO.md r34); o
// `window.imprimirChamadoPDF` que vale hoje é o do `ajustes_v5189_patch.js`
// (último definidor no manifest; v5186 definiu a base, v5187 embrulhou, v5189
// redefiniu com o layout). Reparado na r34 (tarefa 1 da auditoria externa).
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5189_patch.js', 'utf8');

let writtenHtml = '';
const documentMock = {
  getElementById: () => null // sem checkbox => usa o status do chamado
};
const windowMock = {
  lfbAlert: () => {},
  DIGICOPY_LOGO: './logo.png',
  fmtMoney: (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ','),
  getSession: () => ({ empresaId: 'e1', usuarioNome: 'Técnico' }),
  addEventListener: () => {}, // o patch registra validação de clique ao carregar
  open: () => ({ document: { write: (h) => { writtenHtml = h; }, close: () => {} } })
};
const db = {
  os: [{ id: 'os1', numero: '123', clienteId: 'c1', status: 'concluido', tecnico: 'João',
         descricao: 'Troca de fusor', dataAbertura: '2026-08-01T12:00:00Z', dataAtendimento: '2026-08-13T12:00:00Z',
         contadorAtual: '5000', servicos: 'Troca do fusor', observacao: 'OK', pecas: [] }],
  clientes: [{ id: 'c1', nome: 'Empresa XPTO', documento: '12.345.678/0001-90', telefone: '(38) 99999-9999',
               endereco: 'Rua A', numero: '10', cidade: 'Janaúba', estado: 'MG' }],
  empresas: [{ id: 'e1', fantasia: 'DIGICOPY', razaoSocial: 'DIGICOPY LTDA', cnpj: '00.000.000/0001-00' }],
  parque: [], config: {}
};

new Function('window', 'db', 'document', code)(windowMock, db, documentMock);

windowMock.imprimirChamadoPDF('os1');

console.log('== AJUSTES_V5184: PDF do chamado lado a lado ==');
ok('gera HTML', writtenHtml.length > 100);
ok('tem caixa "Dados do Cliente"', writtenHtml.includes('Dados do Cliente'));
ok('tem caixa "Dados de Atendimento"', writtenHtml.includes('Dados de Atendimento'));
ok('as duas caixas ficam lado a lado (grid 1fr 1fr)', /\.cards\{[^}]*grid-template-columns:1fr 1fr/.test(writtenHtml));
ok('nome do cliente aparece', writtenHtml.includes('Empresa XPTO'));
ok('técnico aparece na caixa de atendimento', writtenHtml.includes('João'));
ok('endereço do cliente aparece', writtenHtml.includes('Janaúba'));
ok('contador preto continua no rodapé', writtenHtml.includes('Contador preto'));
ok('data de atendimento não fica mais solta no rodapé', !writtenHtml.includes('Data do atendimento:'));

console.log('\nRESULTADO: Testes do ajustes_v5184 passaram!');
