const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v52024_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.AJUSTES_V52024_PURE;

console.log('== AJUSTES_V52024_PURE ==');

const LOGINS = ['admin','carlos','ana','financeiro'];
const IDS = ['usr_admin'];

// ehUsuarioDemoAntigo: apaga só demo de verdade, nunca usuário cadastrado pela tela
ok('demo por id (usr_admin)', P.ehUsuarioDemoAntigo({ id:'usr_admin', login:'admin', criadoPor:'sistema' }, LOGINS, IDS) === true);
ok('demo por login+criadoPor sistema', P.ehUsuarioDemoAntigo({ id:'usr_x9', login:'carlos', criadoPor:'sistema' }, LOGINS, IDS) === true);
ok('demo por login sem criadoPor', P.ehUsuarioDemoAntigo({ id:'usr_y1', login:'ana' }, LOGINS, IDS) === true);
ok('funcionário "ana" criado pela tela é PRESERVADO', P.ehUsuarioDemoAntigo({ id:'usr_anareal', login:'ana', criadoPor:'usr_kauan' }, LOGINS, IDS) === false);
ok('usuário comum preservado', P.ehUsuarioDemoAntigo({ id:'usr_kauan', login:'kauan', criadoPor:'sistema' }, LOGINS, IDS) === false);
ok('legado migrado com login de demo é PRESERVADO', P.ehUsuarioDemoAntigo({ id:'usr_m1', login:'carlos', criadoPor:'migracao' }, LOGINS, IDS) === false);

// jaRodouHoje
const hoje = new Date('2026-08-16T10:00:00');
ok('mesmo dia = já rodou', P.jaRodouHoje('2026-08-16T03:00:00', hoje) === true);
ok('ontem = não rodou', P.jaRodouHoje('2026-08-15T23:59:00', hoje) === false);
ok('nunca rodou (null)', P.jaRodouHoje(null, hoje) === false);
ok('data inválida = não rodou', P.jaRodouHoje('xxxx', hoje) === false);

// nomeBackupDiario
ok('nome do arquivo do backup', P.nomeBackupDiario(hoje) === 'digicopy-backup-2026-08-16.json');

// jsonBackupLimpo: tira _rt, mantém o resto
{
  const db = { empresas:[{id:'emp_digicopy'}], clientes:[{id:'c1', nome:'A', _rt:'2026-08-16T00:00:00Z'}], config:{ loja:{fantasia:'DIGICOPY'}, _rt:'x', escolaAuth:{usuario:'x',senha:'segredo'} } };
  const j = JSON.parse(P.jsonBackupLimpo(db));
  ok('_rt removido dos registros', j.clientes[0]._rt === undefined && j.config._rt === undefined);
  ok('conteúdo preservado', j.clientes[0].nome === 'A' && j.config.loja.fantasia === 'DIGICOPY' && j.empresas.length === 1);
  ok('senha do Buscador não vai no backup', j.config.escolaAuth === undefined);
}

ConsoleLogOk();
function ConsoleLogOk(){ console.log('\nRESULTADO: Testes do ajustes_v52024 passaram!'); }
