const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const start = source.indexOf('function tirarSegredosDoEnvio(entity,value){');
const end = source.indexOf('\nfunction applyRemote(change,mapaDado){', start);
assert.ok(start >= 0 && end > start, 'helpers de sanitização do cliente devem existir');
const helpers = new Function('clean', 'db', `${source.slice(start, end)}; return {tirarSegredosDoEnvio,mutacaoSeguraParaEnvio,configRemotoComSegredosLocais};`)(
  value => value == null ? value : JSON.parse(JSON.stringify(value)),
  { config: { escolaAuth: { usuario: 'local-user', senha: 'local-placeholder' }, fiscal: { a1Nuvem: { data: 'LOCAL-PFX-PLACEHOLDER', nome: 'certificado.pfx' } } } }
);

const config = { tema: 'claro', escolaAuth: { usuario: 'secret-user', senha: 'secret-placeholder' }, fiscal: { serie: 4, a1Nuvem: { data: 'PFX-PLACEHOLDER', nome: 'certificado.pfx' } } };
const outbound = helpers.tirarSegredosDoEnvio('config', config);
assert.equal(outbound.tema, 'claro');
assert.equal('escolaAuth' in outbound, false);
assert.deepEqual(outbound.fiscal, { serie: 4, a1Nuvem: { nome: 'certificado.pfx' } });
assert.equal(config.escolaAuth.senha, 'secret-placeholder', 'sanitização não altera o banco local');
assert.equal(helpers.tirarSegredosDoEnvio('clientes', config), config, 'outras entidades não são alteradas');
const queued = helpers.mutacaoSeguraParaEnvio({ entity: 'config', data: config, mutationId: 'test' });
assert.equal('escolaAuth' in queued.data, false, 'outbox legado também remove credenciais');
assert.equal('escolaAuth' in config, true, 'sanitização de outbox mantém a config local intacta');
const applied = helpers.configRemotoComSegredosLocais({ tema: 'escuro', fiscal: { serie: 5 } });
assert.deepEqual(applied.escolaAuth, { usuario: 'local-user', senha: 'local-placeholder' });
assert.equal(applied.fiscal.a1Nuvem.data, 'LOCAL-PFX-PLACEHOLDER', 'resposta remota preserva PFX local');
assert.equal(applied.fiscal.serie, 5, 'configuração remota não secreta é aplicada');

console.log('PASS: segredo da escola e PFX não entram no sync; cópias locais e demais config são preservadas');
