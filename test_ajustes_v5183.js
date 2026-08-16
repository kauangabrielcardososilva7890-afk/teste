const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5183_patch.js', 'utf8');

// Mock mínimo: sem document => o patch para antes do trabalho de DOM,
// mas expõe AJUSTES_V5183_PURE com a lógica pura testável.
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);

const R = ctx.window.AJUSTES_V5183_PURE;

console.log('== AJUSTES_V5183_PURE: regra de faixa azul ==');
ok('"Motivo / Defeito *" ganha faixa', R.deveTerFaixa('Motivo / Defeito *'));
ok('"Serviços executados" ganha faixa', R.deveTerFaixa('Serviços executados'));
ok('"Observação" ganha faixa', R.deveTerFaixa('Observação'));
ok('"Contador Preto Atual" ganha faixa', R.deveTerFaixa('Contador Preto Atual'));
ok('"Produtos / Peças usadas" ganha faixa', R.deveTerFaixa('Produtos / Peças usadas'));
ok('"Código" NÃO ganha faixa', !R.deveTerFaixa('Código'));
ok('"Data" NÃO ganha faixa', !R.deveTerFaixa('Data'));
ok('"Cliente" NÃO ganha faixa', !R.deveTerFaixa('Cliente'));

console.log('== AJUSTES_V5183_PURE: título da faixa ==');
ok('remove asterisco', R.tituloFaixa('Motivo / Defeito *') === 'Motivo / Defeito');
ok('mantém texto simples', R.tituloFaixa('Observação') === 'Observação');

console.log('== AJUSTES_V5183_PURE: lançamento de contador preenchido ==');
{
  const vazio = { getElementById: () => ({ value: '' }) };
  ok('vazio => não preenchido', !R.lancamentoContadorPreenchido(vazio));
  const preenchido = { getElementById: () => ({ value: '  1234  ' }) };
  ok('1234 => preenchido', R.lancamentoContadorPreenchido(preenchido));
  const semCampo = { getElementById: () => null };
  ok('sem campo => não preenchido', !R.lancamentoContadorPreenchido(semCampo));
}

console.log('\nRESULTADO: Testes do ajustes_v5183 passaram!');
