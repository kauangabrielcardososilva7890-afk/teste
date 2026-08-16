const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5186_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const R = ctx.window.AJUSTES_V5186_PURE;

console.log('== AJUSTES_V5186_PURE: dados da impressora (com fallback do equipamento) ==');
{
  const dbRef = {
    equipamentos: [{ id: 'e1', modelo: 'HP LaserJet', patrimonio: 'P-100', serie: 'SN-999' }],
    parque: [{ equipamentoId: 'e1', setor: 'Recepção', localInstalacao: 'Sala 3' }]
  };
  // chamado sem dados -> usa do equipamento
  const d1 = R.dadosImpressora({ equipamentoId: 'e1' }, dbRef);
  ok('modelo vem do equipamento', d1.modelo === 'HP LaserJet');
  ok('patrimônio vem do equipamento', d1.patrimonio === 'P-100');
  ok('serial vem do equipamento', d1.serie === 'SN-999');
  ok('local vem do parque', d1.local === 'Sala 3');

  // chamado com dados -> prioriza o chamado
  const d2 = R.dadosImpressora({ equipamentoId: 'e1', modelo: 'Canon', patrimonio: 'X', serie: 'Y', local: 'Andar 2' }, dbRef);
  ok('modelo do chamado tem prioridade', d2.modelo === 'Canon');
  ok('local do chamado tem prioridade', d2.local === 'Andar 2');
}

console.log('== AJUSTES_V5186_PURE: faixa ==');
ok('"Motivo / Defeito *" ganha faixa', R.deveTerFaixa('Motivo / Defeito *'));
ok('"Serviços executados" ganha faixa', R.deveTerFaixa('Serviços executados'));
ok('"Contador Preto Atual" ganha faixa', R.deveTerFaixa('Contador Preto Atual'));
ok('"Código" NÃO ganha faixa', !R.deveTerFaixa('Código'));
ok('"Cliente" NÃO ganha faixa', !R.deveTerFaixa('Cliente'));
ok('titulo remove asterisco', R.tituloFaixa('Motivo / Defeito *') === 'Motivo / Defeito');

console.log('\nRESULTADO: Testes do ajustes_v5186 passaram!');
