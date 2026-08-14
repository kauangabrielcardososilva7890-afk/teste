const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('fluxos_operacionais_patch.js', 'utf8');
const ctx = { window: {}, db: { produtos: [], equipamentos: [], parque: [], leituras: [], os: [] } };
new Function('window', 'db', code)(ctx.window, ctx.db);
const K = ctx.window.FLUXOS_PURE;

console.log('== FLUXOS_PURE: categorias e estoque ==');
ok('Cartucho vazio mantém categoria única', K.categoriaUnificada('CARTUCHO VAZIO') === 'Cartucho Vazio');
ok('Suprimento antigo vira Insumo', K.categoriaUnificada('Suprimento') === 'Insumo');
ok('Impressora/Impressoras ficam em Impressoras', K.categoriaUnificada('Impressora') === 'Impressoras');
ok('estoque igual ao mínimo não avisa', !K.estoqueBaixoEstrito(4, 4));
ok('estoque abaixo do mínimo avisa', K.estoqueBaixoEstrito(3, 4));

console.log('== FLUXOS_PURE: ordenação crescente inteligente ==');
{
  const lista = [{ codigo: '20' }, { codigo: '3' }, { codigo: '100' }, { codigo: '' }];
  const out = K.sortAsc(lista, x => x.codigo).map(x => x.codigo).join(',');
  ok('ordena número como número e vazio no fim', out === '3,20,100,');
}

console.log('== FLUXOS_PURE: cálculo de leitura por modalidade ==');
{
  const contrato = { id: 'ct1', franquiaPB: 1000, valorExcedentePB: 0.10 };
  const dbBase = { leituras: [] };
  let r = K.calcularLeituraOperacional(dbBase, contrato, { id: 'p1', modalidade: 'individual', franquiaPB: 500, valorExcedentePB: 0.20 }, 1000, 1800, '2026-07-10');
  ok('individual cobra só excedente da franquia da impressora', r.utilizado === 800 && r.qtdExcedente === 300 && Math.abs(r.valorExcedente - 60) < 0.001);

  r = K.calcularLeituraOperacional(dbBase, contrato, { id: 'p1', modalidade: 'impressao', valorExcedentePB: 0.15 }, 100, 250, '2026-07-10');
  ok('por impressão cobra todas páginas usadas', r.qtdExcedente === 150 && Math.abs(r.valorExcedente - 22.5) < 0.001);

  r = K.calcularLeituraOperacional(dbBase, contrato, { id: 'p1', modalidade: 'mes_fixo', valorExcedentePB: 0.15 }, 100, 800, '2026-07-10');
  ok('mês fixo não gera excedente', r.utilizado === 700 && r.qtdExcedente === 0 && r.valorExcedente === 0);

  const dbGlobal = { leituras: [{ id: 'l1', contratoId: 'ct1', dataLeitura: '2026-07-05T12:00:00.000Z', consumoPB: 800 }] };
  r = K.calcularLeituraOperacional(dbGlobal, contrato, { id: 'p2', modalidade: 'global', valorExcedentePB: 0.10 }, 2000, 2500, '2026-07-20');
  ok('global cobra só o excedente incremental do mês', r.utilizado === 500 && r.qtdExcedente === 300 && Math.abs(r.valorExcedente - 30) < 0.001);
}

console.log('== FLUXOS_PURE: contador antigo do chamado ==');
{
  const dbTest = {
    equipamentos: [{ id: 'eq1', contadorPB: 1000 }],
    leituras: [{ equipamentoId: 'eq1', contadorPB: 1500, dataLeitura: '2026-07-01T12:00:00.000Z' }],
    os: [{ id: 'os1', equipamentoId: 'eq1', contadorAtual: 1800, dataAbertura: '2026-07-10T12:00:00.000Z' }]
  };
  const ult = K.ultimoContadorPreto(dbTest, 'eq1');
  ok('usa o último chamado/leitura como contador antigo', ult.valor === 1800 && ult.origem === 'chamado');
}

console.log('== FLUXOS_PURE: NCM ==');
ok('NCM é formatado automaticamente', K.normalizarNCM('84433299') === '8443.32.99');

console.log('\nRESULTADO: Testes do patch Operacional passaram!');
