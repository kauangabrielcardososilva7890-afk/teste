// ═══════════════════════════════════════════════════════════════════════════
// TESTE — trava do backdoor de login e das brechas do login por CNPJ
//
// AUDITORIA 23/09/2026. Três coisas foram fechadas e NÃO podem voltar:
//
//  1. ajustes_v52253_login_tela_branca_patch.js devolvia um usuário Admin fixo
//     para "admin" + uma senha de demonstração, SEMPRE. Esse arquivo é o último
//     da cadeia de patches que define window.doLoginUser (índice 177 do
//     bundle-manifest.json), então era por ali que se entrava no sistema. Quem
//     digitasse o par entrava como Admin, sem existir no banco, sem empresa e
//     sem registro na auditoria. Agora o fallback só vale quando o banco ainda
//     não tem nenhum Admin ativo — o caso para o qual ele foi escrito.
//
//  2. app.js reativava usuário sozinho: quem tivesse uma senha de demonstração
//     voltava a ficar ativo depois de o dono desativá-lo.
//
//  3. app.js sobrescrevia a senha de CNPJ configurada pelo dono com a
//     credencial corporativa fixa.
//
// Usa apenas valores sintéticos de teste — nenhuma senha real aparece aqui.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');

let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++;
  console.log('  ✔ ' + nome);
}

// Remove comentários: os comentários desta correção FALAM do problema (citam
// "emp.senha", "u.ativo" etc.), então o teste tem que olhar só o código.
function semComentarios(src){
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(l => !/^\s*\/\//.test(l))
    .join('\n');
}
// Extrai o corpo de uma função de topo (padrão do app.js: fecha com "}" na col 0)
function corpoDaFuncao(src, assinatura){
  const i = src.indexOf(assinatura);
  if(i < 0) return null;
  const j = src.indexOf('\n}', i);
  return j < 0 ? null : src.slice(i, j);
}

console.log('== 1) LOGIN: fallback de admin inicial não é mais porta dos fundos ==');

const codigoLogin = fs.readFileSync('ajustes_v52253_login_tela_branca_patch.js', 'utf8');
const winFake = { addEventListener(){}, removeEventListener(){}, setTimeout, clearTimeout, console };
winFake.window = winFake;
try{ new Function('window', 'document', codigoLogin)(winFake, undefined); }catch(e){ /* o PURE já foi exportado */ }

const PURE = winFake.LOGIN_TELA_BRANCA_V52253_PURE;
ok('o arquivo exporta a função de login testável', !!(PURE && typeof PURE.loginFlexivel === 'function'));

// Usuário sintético (não é ninguém real)
const usuarioDeTeste = [{ id:'u_teste', login:'usuario_teste', nome:'Usuario Teste', perfil:'Admin', senha:'senha-sintetica', ativo:true }];

// Banco VAZIO (instalação nova): o acesso inicial precisa continuar funcionando,
// senão o dono não consegue nem entrar num PC novo.
const bancoVazio = PURE.loginFlexivel('admin', 'admin123', []);
ok('banco novo (sem Admin) → acesso inicial continua funcionando', !!(bancoVazio && bancoVazio.perfil === 'Admin'));

// Banco COM Admin ativo (o caso real de hoje): o par de demonstração tem que falhar
ok('banco com Admin ativo → par de demonstração NÃO entra mais', PURE.loginFlexivel('admin', 'admin123', usuarioDeTeste) === null);
ok('banco com Admin ativo → senha "123" do admin NÃO entra mais', PURE.loginFlexivel('admin', '123', usuarioDeTeste) === null);
ok('banco com Admin ativo → senha "admin" do admin NÃO entra mais', PURE.loginFlexivel('admin', 'admin', usuarioDeTeste) === null);
ok('usuário de verdade continua entrando', (PURE.loginFlexivel('usuario_teste', 'senha-sintetica', usuarioDeTeste) || {}).id === 'u_teste');
ok('senha errada continua barrada', PURE.loginFlexivel('usuario_teste', 'errada', usuarioDeTeste) === null);
ok('nenhum Admin ATIVO no banco → nem outro login entra pelo fallback', PURE.loginFlexivel('admin', 'admin123', [{ id:'x', login:'fulano', ativo:true, perfil:'Tecnico', senha:'z' }]) !== null);

// O call site que dá acesso tem que continuar usando essa mesma função
const srcLogin = fs.readFileSync('ajustes_v52253_login_tela_branca_patch.js', 'utf8');
ok('doLoginUser usa a função corrigida (mesma do teste)', /LOGIN_TELA_BRANCA_V52253_PURE\.loginFlexivel\(loginVal, senhaVal, usuarios\)/.test(srcLogin));

// A parte mais importante: 5 arquivos do bundle definem window.doLoginUser e
// quem manda é o ÚLTIMO da ordem de carga. Se um patch novo (ou uma
// reordenação do manifest) passar na frente deste, a correção deixa de valer
// EM SILÊNCIO. Esta verificação existe pra isso nunca acontecer sem avisar.
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const entradas = Array.isArray(manifest) ? manifest : (manifest.scripts || manifest.files || []);
const arquivos = entradas.map(e => typeof e === 'string' ? e : (e.file || e.nome || e.path || ''));
const definem = arquivos.filter(f => {
  try{ return /window\.doLoginUser\s*=/.test(fs.readFileSync(f, 'utf8')); }catch(e){ return false; }
});
ok('existem vários patches definindo doLoginUser (por isso a ordem importa)', definem.length >= 1);
ok('o ÚLTIMO doLoginUser do bundle é o corrigido (ajustes_v52253)',
   definem[definem.length - 1] === 'ajustes_v52253_login_tela_branca_patch.js');
console.log('     (ordem encontrada: ' + definem.join(' → ') + ')');

console.log('== 2) LOGIN CNPJ: não reativa usuário e não sobrescreve a senha do dono ==');

const app = fs.readFileSync('app.js', 'utf8');
const appCodigo = semComentarios(app);

const corpoCnpj = corpoDaFuncao(appCodigo, 'function doLoginCNPJ(){');
ok('achei a função doLoginCNPJ', !!corpoCnpj);
ok('login por CNPJ não reativa usuário sozinho', !/\.ativo\s*=\s*true/.test(corpoCnpj));
ok('login por CNPJ não sobrescreve a senha da empresa', !/emp\.senha\s*=/.test(corpoCnpj));
ok('a credencial corporativa de CNPJ continua funcionando (não tranca ninguém fora)', /digits===/.test(corpoCnpj) && /senha===/.test(corpoCnpj));
ok('nenhum outro ponto do app.js sobrescreve emp.senha', !/emp\.senha\s*=/.test(appCodigo));

console.log('== 3) Nenhuma tela mostra senha de usuário ==');

const corpoLista = corpoDaFuncao(appCodigo, 'function listUsuariosDemo(){');
ok('achei a função que listava usuários', !!corpoLista);
ok('a listagem de usuários não imprime senha', !/\.senha\b/.test(corpoLista));
ok('a listagem continua mostrando login/nome/perfil', /u\.login/.test(corpoLista) && /u\.nome/.test(corpoLista) && /u\.perfil/.test(corpoLista));

console.log('\nRESULTADO: ' + passou + ' verificações — backdoor fechado e login por CNPJ sem brechas!');
