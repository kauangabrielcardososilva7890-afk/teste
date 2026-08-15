const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5196_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.AJUSTES_V5196_PURE;

console.log('== AJUSTES_V5196_PURE: hierarquia de perfis ==');
ok('kauan => Admin', P.perfilEfetivo({ login: 'kauan', perfil: 'Qualquer' }) === 'Admin');
ok('denivaldo => Dono', P.perfilEfetivo({ login: 'denivaldo' }) === 'Dono');
ok('perfil Admin explícito => Admin', P.perfilEfetivo({ login: 'joao', perfil: 'Admin' }) === 'Admin');
ok('perfil Dono explícito => Dono', P.perfilEfetivo({ login: 'maria', perfil: 'Dono' }) === 'Dono');
ok('Comercial vira Funcionário', P.perfilEfetivo({ login: 'carlos', perfil: 'Comercial' }) === 'Funcionário');
ok('Financeiro vira Funcionário', P.perfilEfetivo({ login: 'ana', perfil: 'Financeiro' }) === 'Funcionário');
ok('Técnico vira Funcionário', P.perfilEfetivo({ login: 'pedro', perfil: 'Técnico' }) === 'Funcionário');

console.log('== AJUSTES_V5196_PURE: permissões ==');
ok('kauan tem permissão total', P.temPermissaoTotal({ login: 'kauan' }) === true);
ok('denivaldo tem permissão total', P.temPermissaoTotal({ login: 'denivaldo', perfil: 'Dono' }) === true);
ok('Admin tem permissão total', P.temPermissaoTotal({ login: 'x', perfil: 'Admin' }) === true);
ok('Funcionário NÃO tem permissão total', P.temPermissaoTotal({ login: 'x', perfil: 'Funcionário' }) === false);
ok('funcionário edita a si mesmo', P.podeEditarUsuario({ usuarioId: 'u1', perfil: 'Funcionário' }, 'u1') === true);
ok('funcionário NÃO edita outro', P.podeEditarUsuario({ usuarioId: 'u1', perfil: 'Funcionário' }, 'u2') === false);
ok('Admin edita qualquer um', P.podeEditarUsuario({ usuarioId: 'u1', perfil: 'Admin' }, 'u2') === true);

console.log('\nRESULTADO: Testes do ajustes_v5196 passaram!');
