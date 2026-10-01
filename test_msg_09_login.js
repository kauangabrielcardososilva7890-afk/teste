// ═══════════════════════════════════════════════════════════════
// test_msg_09_login.js — GERADO por migrar_testes_r57.js; 9 seções (geradas + append por rodada — r69 é o login por hash e a prova de gravação honesta).
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_r69_hash_vence_texto_e_prova_honesta.js, test_login_dados_automaticos.js, test_ajustes_v52253.js, test_login_sem_backdoor.js, test_reclamacoes_do_dono.js, test_r54_senhas_dedup.js, test_r58_senhas_tela.js, test_r59_setup.js
// ═══════════════════════════════════════════════════════════════
// Runner do tema: extrai cada SEÇÃO, roda isolada em processo filho
// (comportamento idêntico ao arquivo solto) e agrega o resultado.
// Seções abaixo vão dentro de if (false){} = INERTES (só parse, nunca executa).
// Novo teste do tema: APPEND bloco no fim, copiando o formato (if + 2 marcadores).
const __fs = require('fs');
const __cp = require('child_process');
const __self = __fs.readFileSync(__filename, 'utf8');
const __partes = [];
const __re = /\/\/<<<<SECAO:([^:]+):INICIO>>>>\r?\n([\s\S]*?)\/\/<<<<SECAO:\1:FIM>>>>/g;
let __m;
while ((__m = __re.exec(__self))) __partes.push({ nome: __m[1], codigo: __m[2] });
if (!__partes.length) { console.error('Tema sem seções!'); process.exit(1); }
const __falhas = [];
__partes.forEach((__s, __i) => {
  console.log('\n── ' + __s.nome + ' ──');
  const __tmp = '.tmp_secao_' + process.pid + '_' + __i + '.js';
  try {
    __fs.writeFileSync(__tmp, __s.codigo);
    const __r = __cp.spawnSync(process.execPath, [__tmp], { stdio: 'inherit' });
    if (__r.status !== 0 || __r.error) __falhas.push(__s.nome);
  } finally { try { __fs.unlinkSync(__tmp); } catch (e) {} }
});
if (__falhas.length) { console.error('\nTEMA FALHOU (' + __falhas.length + ' seções): ' + __falhas.join(', ')); process.exit(1); }
console.log('\nTEMA OK: ' + __partes.length + ' seções.');

if (false) { // ═══ test_login_dados_automaticos.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_login_dados_automaticos.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('login_dados_automaticos_patch.js','utf8');
const db={
  empresas:[], usuarios:[{id:'demo',empresaId:'emp1',nome:'Administrador',login:'admin',senha:'admin123',perfil:'Admin',ativo:true,criadoPor:'sistema'}], logs:[], vendas:[{criadoPor:'demo'}], os:[],
  modulosDinamicos:{FUNCIONARIOS:{dados:[{COD_FUNCIONARIO:1,NOME:'KAUAN',LOGIN:'kauan',SENHA:'1234',ADMIN:'S',OCULTAR:'N'},{COD_FUNCIONARIO:2,NOME:'Atendente Um',SENHA:'abc',VENDEDOR:'S'}]}}
};
const ctx={window:{},db,localStorage:{setItem(){},getItem(){return null;}},sessionStorage:{getItem(){return null;},setItem(){}}};
new Function('window','db','localStorage','sessionStorage',code)(ctx.window,ctx.db,ctx.localStorage,ctx.sessionStorage);
const L=ctx.window.LOGIN_DIRETO_LEGADO_PURE;
console.log('== LOGIN_DIRETO_LEGADO_PURE ==');
ok('login compatível ignora capslock', L.loginCompativel({login:'kauan',nome:'Kauan'}, 'KaUaN'));
ok('login compatível por nome', L.loginCompativel({login:'kg',nome:'Kauan Gabriel'}, 'KAUAN'));
ok('senha literal confere', L.senhaCompativel({senha:'1234'}, '1234'));
const emp=L.escolherEmpresaPadrao(db);
ok('r59: sem empresa de fábrica (setup cria a real)', emp===null && db.empresas.length===0);
db.empresas.push({id:'emp1',nome:'Loja Teste'});
const emp2=L.escolherEmpresaPadrao(db);
ok('com empresa, usa a que existe', emp2 && emp2.id==='emp1');
const imp=L.importarFuncionariosLegados(db, emp2.id);
ok('importa funcionários como usuários', imp>=2 && db.usuarios.some(u=>u.login==='kauan'&&u.senha==='1234'&&u.perfil==='Admin'));
ok('perfil vendedor vira comercial', db.usuarios.some(u=>u.login==='atendente'&&u.perfil==='Comercial'));
db.usuarios.push({id:'demo2',empresaId:emp2.id,nome:'Administrador',login:'admin',senha:'admin123',perfil:'Admin',ativo:true,criadoPor:'sistema'});
const merged=L.unirAdminDemoComOriginal(db, emp2.id);
ok('une admin demo ao original migrado', merged===1 && !db.usuarios.find(u=>u.id==='demo'));
console.log('\nRESULTADO: Testes de login direto/dados automáticos passaram!');
//<<<<SECAO:test_login_dados_automaticos.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52253.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52253.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

function load(src){
  const ctx = {
    window: {
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    document: {
      getElementById: () => null,
      title: ''
    }
  };
  ctx.window.window = ctx.window;
  new Function('window', 'document', src)(ctx.window, ctx.document);
  return ctx.window;
}

const src = fs.readFileSync('ajustes_v52253_login_tela_branca_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const P = load(src).LOGIN_TELA_BRANCA_V52253_PURE;

ok('versão 5.22.53 base', P.VERSAO === '5.22.53' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('boot instantaneo ativo', P.bootInstantaneo === true);
ok('anti tela branca ativo', P.antiTelaBranca === true);

const uAdmin = P.loginFlexivel('ADMIN', 'admin', []);
ok('login ADMIN / admin funciona case-insensitive', uAdmin && uAdmin.perfil === 'Admin');

const uCustom = P.loginFlexivel('GERENTE', 'pass123', [{ id: 'usr_2', nome: 'Gerente Geral', login: 'gerente', senha: 'pass123', perfil: 'Admin', ativo: true }]);
ok('login dinâmico de usuário funciona', uCustom && uCustom.id === 'usr_2');

ok('patch no manifesto do bundle', manifest.includes('ajustes_v52253_login_tela_branca_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52253_login_tela_branca_patch.js'));
ok('index carrega os scripts na versão 5.22', /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52253_login_tela_branca_patch.js'));
ok('rodapé na versão 5.22', /footer-version/.test(html) && /v\d+\.\d+\.\d+/.test(html));
ok('sem nome pessoal novo', !/kauan/i.test(src.replace(/__KAUAN_REFINO_STATE__/g, '').replace(/kauangabrielcardososilva7890-afk/g, '')));

console.log('\nRESULTADO: v5.22.53 passou!');
//<<<<SECAO:test_ajustes_v52253.js:FIM>>>>
}

if (false) { // ═══ test_login_sem_backdoor.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_login_sem_backdoor.js:INICIO>>>>
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

// A parte mais importante: vários arquivos do bundle definem window.doLoginUser
// e quem manda é o ÚLTIMO da ordem de carga. Se um patch novo (ou uma
// reordenação do manifest) passar na frente deste, a correção deixa de valer
// EM SILÊNCIO. Esta verificação existe pra isso nunca acontecer sem avisar.
// r60 v7.3.0 — EXCEÇÃO HONESTA: o v5901 (login que se cura sozinho) é o último
// DE PROPÓSITO, mas ele NÃO decide login: só puxa da nuvem e ENTREGA tudo ao
// original (v52253). As 3 verificações abaixo travam isso: o corrigido continua
// na cadeia, o último é um dos dois, e o v5901 nunca encosta em senha.
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const entradas = Array.isArray(manifest) ? manifest : (manifest.scripts || manifest.files || []);
const arquivos = entradas.map(e => typeof e === 'string' ? e : (e.file || e.nome || e.path || ''));
const definem = arquivos.filter(f => {
  try{ return /window\.doLoginUser\s*=/.test(fs.readFileSync(f, 'utf8')); }catch(e){ return false; }
});
ok('existem vários patches definindo doLoginUser (por isso a ordem importa)', definem.length >= 1);
ok('o corrigido continua na cadeia (ajustes_v52253)', definem.indexOf('ajustes_v52253_login_tela_branca_patch.js') >= 0);
const ultimoLogin = definem[definem.length - 1];
ok('o ÚLTIMO doLoginUser é o corrigido ou o v5901 (que delega a ele)',
   ultimoLogin === 'ajustes_v52253_login_tela_branca_patch.js' ||
   ultimoLogin === 'ajustes_v5901_login_retry_nuvem_patch.js');
console.log('     (ordem encontrada: ' + definem.join(' → ') + ')');
if(definem.indexOf('ajustes_v5901_login_retry_nuvem_patch.js') >= 0){
  const src5901 = fs.readFileSync('ajustes_v5901_login_retry_nuvem_patch.js', 'utf8');
  ok('v5901 ENTREGA tudo ao login corrigido (orig.apply)', src5901.indexOf('orig.apply(this,arguments)') >= 0);
  ok('v5901 nunca encosta em senha (não decide login)', semComentarios(src5901).toLowerCase().indexOf('senha') < 0);
}

console.log('== 2) LOGIN CNPJ: não reativa usuário e não sobrescreve a senha do dono ==');

const app = fs.readFileSync('app.js', 'utf8');
const appCodigo = semComentarios(app);

const corpoCnpj = corpoDaFuncao(appCodigo, 'function doLoginCNPJ(){');
ok('achei a função doLoginCNPJ', !!corpoCnpj);
ok('login por CNPJ não reativa usuário sozinho', !/\.ativo\s*=\s*true/.test(corpoCnpj));
ok('login por CNPJ não sobrescreve a senha da empresa', !/emp\.senha\s*=[^=]/.test(corpoCnpj));
// r54 (P1, autorizado pelo dono em 28/09/2026): a mestra fixa SAIU do código
// público. No lugar dela, sem trancar ninguém: modo configuração (banco sem
// senha → cria na hora) + recuperação (esqueceu → prova o gerente na nuvem).
ok('backdoor apagado: nenhum segredo fixo no login CNPJ', !/digicopy8698/.test(corpoCnpj) && !/08385589000103/.test(corpoCnpj));
ok('modo configuração existe (banco sem senha → cria na hora)', /modoSetup/.test(corpoCnpj) && /algumaTemSenha/.test(corpoCnpj));
ok('recuperação existe (esqueci → prova gerente na nuvem)', /senhaRecuperarCNPJ/.test(appCodigo) && /company-pass-liberar/.test(appCodigo));
// Dual-write autorizado na transição: o setter oficial senhaDefinirCNPJ é o
// ÚNICO lugar do app.js que grava emp.senha (conta exata: 1 ocorrência).
ok('emp.senha só é gravado no setter oficial', (appCodigo.match(/emp\.senha\s*=[^=]/g) || []).length === 1);

console.log('== 3) Nenhuma tela mostra dado de usuário ==');

const corpoLista = corpoDaFuncao(appCodigo, 'function listUsuariosDemo(){');
ok('achei a função que listava usuários', !!corpoLista);
ok('a listagem não imprime senha', !/\.senha\b/.test(corpoLista));
ok('a listagem não mostra mais NADA de usuário (nem login, nem nome, nem perfil)',
   !/\.login\b/.test(corpoLista) && !/\.nome\b/.test(corpoLista) && !/\.perfil\b/.test(corpoLista));
ok('a listagem não toca mais no banco de usuários', !/db\.usuarios/.test(corpoLista));

console.log('\nRESULTADO: ' + passou + ' verificações — backdoor fechado e login por CNPJ sem brechas!');
//<<<<SECAO:test_login_sem_backdoor.js:FIM>>>>
}

if (false) { // ═══ test_reclamacoes_do_dono.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_reclamacoes_do_dono.js:INICIO>>>>
// ═════════════════════════════════════════════════════
// TESTE — TODA RECLAMAÇÃO DO DONO TEM UMA TRAVA (a ideia "A", rodada 25)
//
// O problema que este arquivo resolve: "voltou a dar problema" já aconteceu
// várias vezes. Cada conserto provado numa rodada ficava só na documentação —
// quem garantia que não voltava era a memória de quem escreveu.
//
// Este teste faz duas coisas:
//
//  1) COBRA A LISTA (`RECLAMACOES_E_TESTES.md`): cada reclamação dele aponta
//     para o conserto (arquivos que existem) e para o teste que trava. Se o
//     teste citado for apagado, ou existir mas sair do `test_runner.js` (teste
//     que ninguém roda não trava nada), o teste falha aqui.
//
//  2) PRENDE AS RECLAMAÇÕES QUE NÃO TINHAM TESTE PRÓPRIO (as linhas "aqui"):
//     a versão igual em todos os arquivos, a branch certa nos links, o menu
//     fiscal oficial, o modo escuro, a caixa "3 permissões" fora da tela, o
//     `erro.txt` fora do rodapé, o SÓ NUVEM, o "dado que some" e o `prompt`
//     nativo que quebra dentro do `.exe`.
//
// Ele não roda o sistema: lê os arquivos. É barato de rodar e caro de burlar —
// mexe no arquivo que trava, a suíte fica vermelha.
// ═════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');

let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  \u2718 ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}
const ler = (p) => fs.readFileSync(p, 'utf8');
const existe = (p) => { try { return fs.existsSync(p); } catch (e) { return false; } };

// tira comentários de linha e de bloco (para não confundir conversa com código).
// O "não antes de :" preserva URLs (https://…).
function tiraComentarios(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:\w])\/\/[^\n]*/g, '$1 ');
}

console.log('== TODA RECLAMAÇÃO DO DONO TEM UMA TRAVA ==');

// ─────────────────────────────────────────────────────────────
// 1) A LISTA E A REALIDADE (RECLAMACOES_E_TESTES.md)
// ─────────────────────────────────────────────────────────────
console.log('-- a lista das reclamações bate com o repositório --');
const lista = ler('RECLAMACOES_E_TESTES.md');
const registrados = (() => {
  const bloco = ler('test_runner.js');
  const dentro = bloco.slice(bloco.indexOf('const tests=['), bloco.indexOf('];', bloco.indexOf('const tests=[')));
  const set = new Set((dentro.match(/"([^"]+\.js)"/g) || []).map((x) => x.replace(/"/g, '')));
  // r57: testes moram em SEÇÕES dentro dos temas test_msg_*.js — conta também
  // (marcador montado em 2 pedaços de propósito: o texto inteiro aqui dentro
  //  confundiria o migrador que procura seções — ele aborta se vir o marcador)
  try {
    const INI = '//<<' + '<<SECAO:', FIM = ':INICIO>>>>';
    fs.readdirSync('.').filter((f) => /^test_msg_.*\.js$/.test(f)).forEach((t) => {
      const txt = ler(t);
      let pos = 0;
      for (;;) {
        const a = txt.indexOf(INI, pos);
        if (a < 0) break;
        const nl = txt.indexOf('\n', a); // fim da linha onde o INI apareceu
        const fimLinha = nl < 0 ? txt.length : nl;
        const b = txt.indexOf(FIM, a + INI.length);
        // vale SOMENTE se o FIM está na MESMA linha (linha de FIM da seção não conta)
        if (b >= 0 && b + FIM.length <= fimLinha) set.add(txt.slice(a + INI.length, b));
        pos = fimLinha + 1;
      }
    });
  } catch (e) { /* sem temas = repo antigo, só o runner vale */ }
  return set;
})();
const linhas = lista.split('\n').filter((l) => /^\| *\d+ *\|/.test(l));
ok('a lista tem as reclamações registradas (>= 18)', linhas.length >= 18, 'linhas: ' + linhas.length);

let testes = 0, fontes = 0;
const faltandoTeste = [], foraDoRunner = [], faltandoArquivo = [];
linhas.forEach((linha, i) => {
  const citados = (linha.match(/`([^`]+)`/g) || []).map((x) => x.replace(/`/g, ''));
  citados.forEach((alvo) => {
    // só nomes de arquivo (ignora trechos de código citados entre crases)
    if (!/^[\w./-]+\.(js|md|json|html)$/.test(alvo)) return;
    if (alvo.indexOf('test_') === 0 || alvo.indexOf('checar_') === 0) {
      testes++;
      // r57: teste fundido NÃO existe mais como arquivo solto — vale se for seção de tema
      if (!existe(alvo) && !registrados.has(alvo)) { faltandoArquivo.push('linha ' + (i + 1) + ': ' + alvo); return; }
      if (!registrados.has(alvo)) foraDoRunner.push('linha ' + (i + 1) + ': ' + alvo);
      return;
    }
    if (!existe(alvo)) { faltandoArquivo.push('linha ' + (i + 1) + ': ' + alvo); return; }
    if (alvo.indexOf('bench_') === 0 || alvo.indexOf('mapa_') === 0) {
      testes++;   // bancada/ferramenta: roda na mão, não entra na suíte de propósito
    } else if (/\.(js|md|json|html)$/.test(alvo)) {
      fontes++;
    }
  });
});
ok('todo arquivo citado no conserto existe', faltandoArquivo.length === 0, faltandoArquivo.join(' | '));
ok('todo teste citado existe e está registrado na suíte — runner ou seção de tema (teste que ninguém roda não trava nada)',
  foraDoRunner.length === 0, foraDoRunner.join(' | '));
ok('a lista cobre o conserto e o teste de cada reclamação (dezenas de arquivos citados)',
  testes >= 18 && fontes >= 20, 'testes: ' + testes + ' | fontes: ' + fontes);

// ─────────────────────────────────────────────────────────────
// 2) AS TRAVAS QUE MORAM AQUI (as linhas "aqui" da lista)
// ─────────────────────────────────────────────────────────────
const manifest = JSON.parse(ler('bundle-manifest.json'));
const manifestLista = Array.isArray(manifest) ? manifest : (manifest.scripts || manifest.files || []);
const posNoManifesto = (nome) => manifestLista.indexOf(nome);

console.log('-- reclamação 2: a versão e a branch em TODOS os arquivos --');
{
  const pkg = JSON.parse(ler('package.json'));
  const versao = String(pkg.version || '');
  ok('package.json tem versão de verdade (x.y.z)', /^\d+\.\d+\.\d+$/.test(versao), versao);
  ok('a branch do package.json é a da sessão (o ZIP e os links apontam para o código certo)',
    pkg.digicopy && pkg.digicopy.branch === 'arena/01a0d9c3-teste', String(pkg.digicopy && pkg.digicopy.branch));
  const reVersao = new RegExp("DIGICOPY_APP_VERSION = '" + versao.replace(/\./g, '\\.') + "'");
  const outrasVersoes7 = (s) => (s.match(/\bv?7\.[0-9]+\.[0-9]+\b/g) || [])
    .map((v) => v.replace(/^v/, '')).filter((v) => v !== versao);
  ['index.html', 'mobile/www/index.html'].forEach((f) => {
    const s = ler(f);
    ok('a página ' + f + ' está na versão exata do package.json', reVersao.test(s), versao);
    ok('a página ' + f + ' não ficou com outra versão 7.x.y em lugar nenhum', outrasVersoes7(s).length === 0, outrasVersoes7(s).join(', '));
    ok('a página ' + f + ' mostra a versão no título do sistema', s.indexOf('Sistema Digicopy v' + versao) >= 0);
  });
  ['importar.html', 'GUIA_DE_TESTE_NF.html', 'PASSO_A_PASSO_NUVEM_E_SITE.html', 'RELATORIO_DE_TESTE_NF.html'].forEach((f) => {
    const s = ler(f);
    ok('o guia ' + f + ' cita a versão atual', s.indexOf('v' + versao) >= 0 || s.indexOf(versao) >= 0);
    ok('o guia ' + f + ' não ensina a conferir uma versão velha', outrasVersoes7(s).length === 0, outrasVersoes7(s).join(', '));
  });
  ok('index.html carrega o bundle com o carimbo da versão (?v=…)',
    new RegExp('app\\.bundle\\.js\\?v=' + versao.replace(/\./g, '\\.')).test(ler('index.html')));
  const vivos = ['package.json', 'sync_build.js', 'build_bundle.js', 'BUILD_EXE.md', 'index.html'];
  const velhos = vivos.filter((f) => existe(f) && ler(f).indexOf('arena/01a0c087-teste') >= 0);
  ok('nenhum arquivo vivo manda para a branch antiga da sessão anterior', velhos.length === 0, velhos.join(' '));
}

console.log('-- reclamação 7 e 8: o menu fiscal oficial, sempre em cima e no escuro --');
{
  ['menu_fiscal_oficial_patch.js', 'submenu_fiscal_oficial_patch.js', 'navegacao_fiscal_barra_escuro_patch.js']
    .forEach((f) => ok('o patch fiscal ' + f + ' está no bundle', posNoManifesto(f) >= 0));
  const oficial = ler('menu_fiscal_oficial_patch.js');
  ok('o nome oficial é "Menu Fiscal"', oficial.indexOf('Menu Fiscal') >= 0);
  ok('a faixa é re-injetada quando a tela se redesenha (não some mais)',
    /showApp|insertBefore|MutationObserver/.test(oficial));
  const barra = ler('navegacao_fiscal_barra_escuro_patch.js');
  ok('acha o módulo fiscal pelo clique (sobrevive a repintura) e recria #menu-nfe',
    barra.indexOf('abrirCentralNfe') >= 0 && barra.indexOf('#menu-nfe') >= 0);
  const seis = ['Nota Fiscal', 'Perfil Tributário', 'Manifestação', 'NCM', 'Enviar XML', 'Configurações'];
  const faltam = seis.filter((t) => barra.indexOf(t) < 0);
  ok('os 6 itens oficiais estão lá', faltam.length === 0, faltam.join(', '));
  ok('o modo escuro tem regra própria para a barra e para o menu fiscal',
    /digi-escuro/.test(barra) && /digi-escuro #menu-nfe/.test(barra));
}

console.log('-- reclamação 9: a caixa "o que são as 3 permissões?" não volta --');
{
  const src = ler('permissoes_estorno_venda_patch.js');
  const fn = (src.match(/function p605BotaoAjuda\(\)\{[\s\S]*?\n\}/) || [''])[0];
  ok('a função do botão existe (a explicação continua pronta no sistema)', fn.length > 0);
  ok('ela NÃO injeta mais nada na tela de Usuários', fn.length > 0 && /return;/.test(fn) && !/insertAdjacentHTML|innerHTML|appendChild/.test(fn));
  ok('a explicação (window.permissoesAjuda) continua disponível se ele quiser depois',
    /window\.permissoesAjuda\s*=/.test(src));
}

console.log('-- reclamação 10: o erro.txt do rodapé não volta --');
{
  ['index.html', 'mobile/www/index.html'].forEach((f) => {
    ok('a página ' + f + ' não tem botão de erro.txt no rodapé', ler(f).indexOf('erro.txt') < 0);
  });
}

console.log('-- reclamação 12: SÓ NUVEM (nada salvo no PC) --');
{
  const sync = ler('cloudflare_data_sync_patch.js');
  ok('o saveDB em SÓ NUVEM não grava a base no PC', /soNuvem\?true:original\.apply/.test(sync));
  ok('a cópia local só é solta quando a nuvem confirma que tem tudo',
    /modoSoNuvem\(\)&&!outbox\.length&&await nuvemTemTudo\(\)/.test(sync) && /async function nuvemTemTudo\(\)/.test(sync));
}

console.log('-- reclamação 13: o "dado que some" (rodada 24) --');
{
  const sync = ler('cloudflare_data_sync_patch.js');
  ok('a gravação enfileira na hora (não espera os 900 ms)', /sujo=true;enfileirarNaHora\(\);schedule\(900\);/.test(sync));
  ok('fechar a janela força a varredura com teto maior', /scanLocal\(\{teto:TETO_FECHANDO\}\)/.test(sync));
  ok('a entrega ao fechar usa keepalive (chega antes da janela morrer)', /keepalive:true/.test(sync));
  const tetoFila = Number((sync.match(/const MAX_OUTBOX=(\d+);/) || [])[1]);
  const tetoFechar = Number((sync.match(/const TETO_FECHANDO=(\d+);/) || [])[1]);
  ok('a fila não encolheu de volta (400 no dia a dia, 2.000 ao fechar)',
    tetoFila >= 400 && tetoFechar > tetoFila, 'fila: ' + tetoFila + ' | ao fechar: ' + tetoFechar);
  ok('o motor conta na tela o que está por subir e até quando está em dia',
    /filaCheia, filaGravada, emDiaAte:/.test(sync) && /btn\.title=\(text\|\|'Nuvem DIGICOPY'\)\+extra/.test(sync));
}

console.log('-- reclamação 15: nada de prompt/confirm nativo no caminho crítico (regra 16) --');
{
  const criticos = ['nf_transmissao_patch.js', 'popup_sistema_patch.js', 'cloudflare_data_sync_patch.js'];
  criticos.forEach((f) => {
    const codigo = tiraComentarios(ler(f));
    ok('o arquivo ' + f + ' não usa prompt() nativo (no .exe ele lança erro)', !/\bprompt\s*\(/.test(codigo));
    ok('o arquivo ' + f + ' não usa confirm() nativo (a janela é a do sistema)', !/\bconfirm\s*\(/.test(codigo));
    const linhasComAlert = codigo.split('\n').filter((l) => /\balert\s*\(/.test(l));
    const alertSemRede = linhasComAlert.filter((l) => l.indexOf('toast') < 0);
    ok('o arquivo ' + f + ' só usa alert como rede de segurança quando não existe toast do sistema',
      alertSemRede.length === 0, alertSemRede.slice(0, 2).join(' | ').slice(0, 120));
  });
}

console.log('-- reclamação 16: a venda/notinha usa o sistema vivo, não o arquivo antigo --');
{
  const antigo = posNoManifesto('notinha_patch.js'), vivo = posNoManifesto('vendas_os_patch.js');
  ok('o arquivo antigo e o vivo estão os dois no bundle', antigo >= 0 && vivo >= 0, antigo + ' / ' + vivo);
  ok('o sistema vivo é carregado DEPOIS (é ele que manda no faturamento)', vivo > antigo);
  ok('quem fatura é o vendas_os_patch (vosConcluirFaturamento)', ler('vendas_os_patch.js').indexOf('vosConcluirFaturamento') >= 0);
}

console.log('-- reclamação 19: "não está aparecendo nenhum dado, é normal?" --');
{
  // A resposta é: num ENDEREÇO NOVO (outro navegador, aba anônima, ou o preview de
  // teste) o sistema abre no PORTÃO da nuvem — e isso é de propósito (regra 44: nada
  // salvo no PC; a base vem da nuvem). Estas travas garantem que:
  //   (a) o portão continua existindo e cobrindo a tela quando não há conexão;
  //   (b) ele NÃO aparece quando o computador já está conectado;
  //   (c) antes das listas, aparece a tela "Baixando os dados da nuvem…";
  //   (d) a tela de carga NUNCA fica presa (tem saída garantida).
  const portao = ler('ajustes_v5262_login_nuvem_primeiro_patch.js');
  ok('o portão da nuvem está no bundle (endereço novo = conectar uma vez)',
    posNoManifesto('ajustes_v5262_login_nuvem_primeiro_patch.js') >= 0);
  ok('sem conexão, o portão cobre a tela inteira (o sistema não abre vazio por baixo)',
    /box\.id = 'v5262-portao'/.test(portao) && /position:fixed;inset:0;z-index:2147482900/.test(portao));
  ok('quem já conectou NÃO vê o portão de novo (a conexão fica guardada neste navegador)',
    /if \(tokenNuvem\(\)\) return;\s*\/\/ conectou uma vez/.test(portao));
  ok('o aviso é claro: "Este computador ainda não está conectado"',
    portao.indexOf('Este computador ainda não está conectado') >= 0);

  const sync = ler('cloudflare_data_sync_patch.js');
  ok('a tela "Baixando os dados da nuvem…" existe e mostra a contagem que já chegou',
    /function mostrarCargaNuvem\(/.test(sync) && /Baixando os dados da nuvem/.test(sync) && /registros trazidos/.test(sync));
  ok('ela abre na primeira carga e no "baixar tudo"', /pedirCarga\(!state\.initialPull\|\|reason==='baixar-tudo-da-nuvem'\)/.test(sync));
  ok('ela NUNCA fica presa na tela (tem saída garantida)',
    /nunca deixar o dono preso no aviso de carga/.test(sync));
  ok('o motor diz na tela quantos estão por subir e até quando está em dia (o "sumiço" deixa de ser mistério)',
    /filaCheia, filaGravada, emDiaAte:/.test(sync));

  // v7.0.14 — o degrau novo: base vazia com a nuvem RESPONDENDO avisa na tela, com o
  // nome/CNPJ da conexão. Era o único caso em que "não apareceu nada" ainda ficava mudo.
  ok('existe o aviso de base vazia (nuvem conectada e nenhum registro)',
    /function avisarSeBaseVazia\(/.test(sync) && /nenhum registro nesta empresa/.test(sync));
  ok('o aviso só sai depois de a nuvem responder e com a base inteira trazida (sem alarme falso)',
    /!authorized\(\)\|\|!state\.lastOk\)return/.test(sync) && /!state\.initialPull\)return/.test(sync) && /localBusinessCount\(\)>0\)return/.test(sync));
  ok('o aviso é chamado no caminho de sincronização bem-sucedida', /indicator\(true,'Nuvem sincronizada/.test(sync) && (sync.match(/avisarSeBaseVazia\(\);/g) || []).length >= 2);
  ok('o aviso diz COM QUAL empresa a conexão está falando (CNPJ errado é a causa mais comum)',
    /function empresaDaConexao\(/.test(sync) && /d\.cnpj\|\|d\.empresaNome/.test(sync));

  // v7.0.15 — A FAIXA QUE EXPLICA E CONSERTA (o pedido: "focar na parte dos dados que
  // não demonstram"). Ela cobre os casos em que a tela fica vazia sem explicação.
  const faixaArq = 'ajustes_v7015_nuvem_explica_patch.js';
  const motorNuvem = ler('cloudflare-worker/src/index.js').replace(/\s+/g, ' ');
  const motorTeste = ler('cloudflare-worker/test-pure.mjs');
  ok('a faixa da nuvem está no bundle (roda junto com o sistema)', posNoManifesto(faixaArq) >= 0);
  if (posNoManifesto(faixaArq) >= 0) {
    const faixa = ler(faixaArq);
    ok('a faixa avisa quando o computador não está conectado e o botão REABRE o portão',
      /não está conectado à nuvem/.test(faixa) && /v5262AbrirPortao/.test(faixa));
    ok('o portão da conexão pode ser reaberto por fora (era o caso do "jeito antigo", que deixava a sessão vazia e muda)',
      /window\.v5262AbrirPortao\s*=/.test(ler('ajustes_v5262_login_nuvem_primeiro_patch.js')));
    ok('a faixa avisa quando a sincronização está pausada', /pausada/.test(faixa) && /pauseReason/.test(faixa));
    ok('a faixa avisa quando a nuvem está no limite do dia (e a que hora volta)',
      /freio preventivo de gravações/.test(faixa) && /limiteAte/.test(faixa) && /volta sozinho por volta das/.test(faixa));
    ok('a faixa mostra a conta quando a nuvem tem mais registros do que aqui e conserta em 1 clique',
      /nuvem tem mais registros/.test(faixa) && /aqui × /.test(faixa) && /baixarTudoDaNuvem/.test(faixa) && /Baixar tudo de novo/.test(faixa));
    ok('a faixa não usa diálogo nativo (regra 16: confirmação pela janela do sistema)',
      /confirmSistema/.test(faixa) && !/\bconfirm\s*\(/.test(tiraComentarios(faixa)) && !/\bprompt\s*\(/.test(tiraComentarios(faixa)) && !/\balert\s*\(/.test(tiraComentarios(faixa)));
    ok('a faixa só aparece com o app aberto e nunca por cima do portão ou da tela de carga',
      /function appAberto\(/.test(faixa) && /function ocupado\(/.test(faixa) && /v5262-portao/.test(faixa) && /digicopy-carga-nuvem/.test(faixa));
    ok('a conferência de 15 em 15 segundos é LEVE (usa info(), que agora não conta a base)',
      /function info\(\)\{[\s\S]{0,200}?s\.info\(\)/.test(faixa) && /ESPERA_MS = 15000/.test(faixa));
    ok('o check-up do dono passou a ter a função de contagem da nuvem que ele já procurava (apiStatus)',
      /async function apiStatus\(/.test(sync) && /window\.DIGICOPY_CLOUD_SYNC=\{tick,info,apiStatus,/.test(sync));
    ok('a faixa diz o que o freio é (preventivo) e NÃO chama de "limite do grátis" (ele é plano pago)',
      /freio preventivo de gravações/.test(faixa) && /nada foi perdido/.test(faixa) && !/teto grátis/i.test(faixa) && !/plano grátis/i.test(faixa));
    ok('o motor do app reconhece o freio do MÊS também (plano pago tem teto mensal, não diário)',
      /monthly row write limit/.test(sync) && /freio preventivo de gravações/.test(sync));
    ok('CONTRA-PROVA no motor da nuvem: o freio do dia usa o número do PLANO PAGO, e o grátis só existe como recuo',
      /freioDia: 1000000/.test(motorNuvem) && /freioDia: 95000/.test(motorNuvem) && /const PLANO = PLANO_PAGO/.test(motorNuvem) && /freioMes: 45000000/.test(motorNuvem));
    ok('e o freio decidiu certo nas duas contas (prova viva, não só o texto)',
      /freioDecide\(99000, 0, 2000, __test\.PLANO_PAGO\)/.test(motorTeste) || /freioDecide\(99000, 0, 2000, PLANO_PAGO\)/.test(motorTeste));
    ok('o freio preventivo usa o PLANO PAGO (1 milhão/dia) e o grátis ficou só como recuo de uma linha',
      /const PLANO = PLANO_PAGO;/.test(motorNuvem) && /freioDia: 1000000/.test(motorNuvem) && /freioMes: 45000000/.test(motorNuvem));
    ok('o /health (público) publica o freio e os relatos de saúde para a manutenção conferir de fora — sem dado de negócio',
      /key = 'freio_ultimo'/.test(motorNuvem) && /key = 'saude_relatos'/.test(motorNuvem) &&
      /const RELATOS_MAX = 12;/.test(motorNuvem) && /\bfreio,/.test(motorNuvem) && /\bsaude,/.test(motorNuvem) &&
      /url\.pathname === '\/v1\/relato'/.test(motorNuvem));
    ok('o check-up saiu com a faixa (r46: sem texto de freio na tela antiga)',
      !/Freio preventivo da nuvem/.test(ler('ajustes_v5227_nuvem_acompanhamento_patch.js')) && !/nuvem\.freio\.disparouHoje/.test(ler('ajustes_v5227_nuvem_acompanhamento_patch.js')));
    ok('a contagem da nuvem no app traz o freio junto (apiStatus lê o /health)',
      /saida&&saida\.freio/.test(sync) && /totais\.freio=saida\.freio/.test(sync));
    ok('e traz também os relatos de saúde (motor; o check-up saiu na r46)',
      /saida&&saida\.saude/.test(sync) && /totais\.saude=saida\.saude/.test(sync) &&
      !/Relatos de saúde/.test(ler('ajustes_v5227_nuvem_acompanhamento_patch.js')));
    ok('o app relata sozinho: freio, credencial, falha, base vazia e fila presa',
      /function relatarSaude\(tipo,codigo\)/.test(sync) && /relatarSaude\('freio'/.test(sync) &&
      /relatarSaude\('credencial'/.test(sync) && /relatarSaude\('falha'/.test(sync) &&
      /relatarSaude\('base_vazia'/.test(sync) && /relatarSaude\('fila_presa'/.test(sync));
    ok('e o relato é limitado (1 por tipo a cada 10 min) e nunca atrapalha a sincronização',
      /agora-antes<10\*60\*1000/.test(sync) && /relato NUNCA pode atrapalhar a sincronização/.test(sync));
    ok('a contagem que percorre a base virou sob demanda (223 ms -> 0,05 ms numa base de 76 mil)',
      /Object\.defineProperty\(base,'pending'/.test(sync) && /function info\(\)\{\s*const base=/.test(sync));
  }
}

console.log('-- a própria lista continua viva (linhas marcadas "aqui") --');
{
  const marcadas = linhas.filter((l) => l.indexOf('**aqui**') >= 0).length;
  ok('as reclamações sem teste próprio estão marcadas e presas neste arquivo', marcadas >= 8, 'marcadas: ' + marcadas);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — cada reclamação dele tem uma trava viva.');
//<<<<SECAO:test_reclamacoes_do_dono.js:FIM>>>>
}

if (false) { // ═══ test_r54_senhas_dedup.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_r54_senhas_dedup.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE r54 — senhas com hash (P1/P2/P3) + dedup (P4) + backups (P5)
//
// Rodada autorizada pelo dono em 28/09/2026 ("ok, faça as outras alterações").
// Cobre, sem nenhum arquivo novo de correção (tudo entrou nos arquivos que já
// existiam): hash PBKDF2+salt, fim da senha-mestra fixa, modo configuração,
// recuperação via gerente, corte do texto puro, prova com salt, desfazer união,
// usuários repetidos, órfãos e o guarda da lista de backups.
//
// Usa apenas valores sintéticos — nenhuma senha real aparece aqui.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');

let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++;
  console.log('  ✔ ' + nome);
}

const app = fs.readFileSync('app.js', 'utf8');
const v52253 = fs.readFileSync('ajustes_v52253_login_tela_branca_patch.js', 'utf8');
const syncPatch = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const dataSync = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const v5214src = fs.readFileSync('ajustes_v5214_clientes_visiveis_patch.js', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');

// ── P1: login com hash, sem mestra ──────────────────────────────────────────
console.log('== r54/P1: hash no login, mestra apagada, configuração, recuperação ==');
ok('mestra fixa sumiu do app.js', app.indexOf('digicopy8698') < 0);
ok('doLoginCNPJ é async e tem modo configuração', app.indexOf('async function doLoginCNPJ') >= 0 && app.indexOf('algumaTemSenha') >= 0 && app.indexOf('modoSetup') >= 0);
ok('doLoginUser confere hash (com upgrade na transição)', app.indexOf('async function doLoginUser') >= 0 && app.indexOf('await confereSenha(senha,user)') >= 0);
ok('saveUsuario grava hash junto', app.indexOf('async function saveUsuario') >= 0 && app.indexOf('await atualizarHashRegistro(payload,payload.senha)') >= 0);
ok('r59: sem seeds de fábrica no app.js', app.indexOf("login:'kauan'") < 0 && app.indexOf("senha:'6132'") < 0 && app.indexOf('emp_digicopy') < 0);
ok('login que vale (v52253) é async e tenta o hash', v52253.indexOf('window.doLoginUser = async function') >= 0 && v52253.indexOf('await confereSenha(senhaVal, hu)') >= 0);
ok('login que vale faz upgrade do texto puro', v52253.indexOf('await atualizarHashRegistro(user, senhaVal)') >= 0);
ok('recuperação no app chama a rota da nuvem', app.indexOf('senhaRecuperarCNPJ') >= 0 && app.indexOf('/v1/company-pass-liberar') >= 0);
ok('nuvem: rota de recuperação prova o gerente', worker.indexOf('/v1/company-pass-liberar') >= 0 && worker.indexOf("conferirSenha(env, cnpj, senhaGerente, 'gerente_hash')") >= 0);
ok('nuvem: recuperação só para o CNPJ dono', worker.indexOf('cnpj === seg.owner_cnpj') >= 0);

// ── P2: corte do texto puro no envio ────────────────────────────────────────
console.log('== r54/P2: corte do texto puro (mecanismo pronto, padrão desligado) ==');
ok('envio passa pelo tira-segredos (mesmo dado no hash e no envio)', dataSync.indexOf('tirarSegredosDoEnvio(entity,entry.data)') >= 0 && dataSync.indexOf('const h=hash(dadoEnvio)') >= 0 && dataSync.indexOf('data:clean(dadoEnvio)') >= 0);
ok('corte é chave de config que viaja na nuvem', app.indexOf('db.config.seguranca.corteTextoPuro') >= 0);
ok('botão do corte existe (só Admin/Dono)', app.indexOf('btn-senha-corte') >= 0 && app.indexOf('senhaCorteAlternar') >= 0);

// ── P3: prova com salt, uma por fase ────────────────────────────────────────
console.log('== r54/P3: prova antiga na transição, nova com salt pós-Corte ==');
ok('app manda prova2 SÓ quando não há texto puro', syncPatch.indexOf('x-digicopy-usuario-prova2') >= 0 && syncPatch.indexOf('else if(u.senhaHash') >= 0);
ok('nuvem aceita a prova nova (login|salt|hash)', worker.indexOf('x-digicopy-usuario-prova2') >= 0 && worker.indexOf("sha256(login + '|' + String(data.senhaSalt)") >= 0);
ok('nuvem: prova antiga exige senha em texto (trava pós-Corte)', worker.indexOf('if (prova && data.senha)') >= 0);
ok('CORS libera o cabeçalho da prova nova', worker.indexOf('x-digicopy-usuario-prova, x-digicopy-usuario-prova2') >= 0);

// ── P4: desfazer, usuários repetidos, órfãos ────────────────────────────────
console.log('== r54/P4: desfazer união + logins repetidos + órfãos ==');
ok('união reversível guarda os valores anteriores', v5214src.indexOf('cliUnirReversivel') >= 0 && v5214src.indexOf('cliDesfazerUniao') >= 0);
ok('união da tela usa a reversível e guarda o bilhete', v5214src.indexOf('cliUnirReversivel(db,') >= 0 && v5214src.indexOf('digicopy_ultima_uniao') >= 0);
ok('botão Desfazer existe na janela', v5214src.indexOf('clientesDuplicadosDesfazer') >= 0);
ok('usuários repetidos: detector + tela + botão', v5214src.indexOf('usuGruposDuplicados') >= 0 && v5214src.indexOf('usuariosDuplicadosAbrir') >= 0 && v5214src.indexOf('btn-usuarios-duplicados') >= 0);
ok('órfãos: lista + desvincular na janela', v5214src.indexOf('orfaosListar(db)') >= 0 && v5214src.indexOf('clientesOrfaoDesvincular') >= 0);

// ── P5 + worker 5.28.4 + motor ──────────────────────────────────────────────
console.log('== r54/P5: backups + worker 5.28.4 + motor regenerado ==');
ok('lista de backups aguenta data vazia/inválida', worker.indexOf('x.gerado_em == null || isNaN(Number(x.gerado_em))') >= 0);
ok('login vazio na prova vira 403, não 500 (S7)', worker.indexOf("String(cleanText(request.headers.get('x-digicopy-usuario-login')") >= 0);
ok('worker carimbado 5.28.4', worker.indexOf("const WORKER_VERSION = '5.28.4'") >= 0);
const motor = fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8');
ok('motor regenerado com a 5.28.4', motor.indexOf('5.28.4') >= 0 && motor.indexOf('company-pass-liberar') >= 0 && motor.indexOf('prova2') >= 0);

// ── RUNTIME: cripto pura (PBKDF2 de verdade, com o subtle do node) ──────────
console.log('== r54/runtime: PBKDF2, prova com salt e tira-segredos de verdade ==');
async function parteCripto(){
  const ini = app.indexOf('// v5.24.38');
  if(ini < 0) throw new Error('seção v5.24.38 não achada no app.js');
  const secao = app.slice(ini);
  const fakeWin = {};
  new Function('window', 'module', 'exports', secao)(fakeWin, undefined, undefined);
  const P = fakeWin.SENHA_HASH_PURE;
  ok('PURE de senhas carrega isolada', !!(P && typeof P.confereSenha === 'function'));
  ok('100 mil voltas de PBKDF2', P.ITERACOES === 100000);
  const s1 = P.senhaNovaSalt(), s2 = P.senhaNovaSalt();
  ok('salt aleatório por registro', typeof s1 === 'string' && s1.length >= 16 && s1 !== s2);
  const h1 = await P.senhaHash('senha-sintetica-1', s1);
  const h1b = await P.senhaHash('senha-sintetica-1', s1);
  const h2 = await P.senhaHash('senha-sintetica-1', s2);
  ok('hash determinístico e dependente do salt', h1 && h1 === h1b && h1 !== h2 && h1.length === 64);
  const reg = { senha: 'senha-sintetica-1' };
  ok('confere texto puro na transição', (await P.confereSenha('senha-sintetica-1', reg)) === 'texto');
  ok('upgrade grava salt+hash', (await P.atualizarHashRegistro(reg, 'senha-sintetica-1')) === true && !!reg.senhaHash && !!reg.senhaSalt);
  ok('com hash, só o hash vale', (await P.confereSenha('senha-sintetica-1', reg)) === 'hash' && (await P.confereSenha('errada', reg)) === false);
  const p1 = await P.provaSal('usuario.teste', reg.senhaSalt, reg.senhaHash);
  ok('prova com salt determinística', p1 && p1 === (await P.provaSal('usuario.teste', reg.senhaSalt, reg.senhaHash)) && p1.length === 64);
  const comSenha = { id: 'u1', login: 'a', senha: 'x', senhaHash: 'h' };
  ok('corte desligado: envio intacto', P.tirarSegredosDoEnvioPuro('usuarios', comSenha, false) === comSenha);
  const cortado = P.tirarSegredosDoEnvioPuro('usuarios', comSenha, true);
  ok('corte ligado: senha sai, hash fica', cortado && !('senha' in cortado) && cortado.senhaHash === 'h' && comSenha.senha === 'x');
  ok('corte só mexe em usuarios/empresas', P.tirarSegredosDoEnvioPuro('vendas', { senha: 'x' }, true).senha === 'x');
}

// ── RUNTIME: dedup pura ─────────────────────────────────────────────────────
function parteDedup(){
  const fakeWin = {};
  new Function('window', 'document', v5214src)(fakeWin, undefined);
  const P = fakeWin.CLIENTES_VISIVEIS_PURE;
  ok('PURE de clientes carrega isolada', !!(P && typeof P.cliUnirReversivel === 'function'));
  // União reversível: move e guarda; desfazer devolve tudo.
  const base = {
    clientes: [
      { id: 'c1', nome: 'Padaria Pão Quente', codigo: '10' },
      { id: 'c2', nome: 'padaria pao quente LTDA', codigo: '20' }
    ],
    vendas: [{ id: 'v1', clienteId: 'c2', clienteNome: 'padaria pao quente LTDA' }],
    os: [{ id: 'o1', clienteId: 'c2' }]
  };
  const r = P.cliUnirReversivel(base, ['c2'], 'c1', 'Padaria Pão Quente');
  ok('união move tudo e marca o repetido', base.vendas[0].clienteId === 'c1' && base.os[0].clienteId === 'c1' && base.clientes[1].status === 'unificado');
  ok('união guarda o antes de cada toque', r.itens.length === 3 && r.itens.every(t => t.ent && t.id && 'antes' in t));
  const n = P.cliDesfazerUniao(base, r.itens);
  ok('desfazer devolve cada um ao lugar', n === 3 && base.vendas[0].clienteId === 'c2' && base.vendas[0].clienteNome === 'padaria pao quente LTDA' && !('status' in base.clientes[1]));
  // Usuários repetidos (o caso katia×2, com nomes sintéticos).
  const baseU = { usuarios: [
    { id: 'u1', login: 'operador.caixa', nome: 'Operador Um', perfil: 'Tecnico', ativo: true, criadoEm: '2024-01-01' },
    { id: 'u2', login: 'Operador.Caixa', nome: 'Operador Dois', perfil: 'Tecnico', ativo: true, criadoEm: '2025-06-01' },
    { id: 'u3', login: 'gerente', nome: 'Gerente', perfil: 'Admin', ativo: true }
  ]};
  const g = P.usuGruposDuplicados(baseU.usuarios, null);
  ok('acha o login repetido (ignora maiúscula)', g.length === 1 && g[0].itens.length === 2 && g[0].itens[0].id === 'u1');
  ok('resolve desativando o repetido, sem apagar', P.usuDesativarRepetidos(baseU, ['u2'], 'u1') === 1 && baseU.usuarios[1].ativo === false && baseU.usuarios[0].ativo === true);
  // Órfãos.
  const baseO = { clientes: [{ id: 'c1' }], contratos: [{ id: 'k1', numero: '7', clienteId: 'fantasma' }], vendas: [{ id: 'v9', clienteId: 'c1' }] };
  const orf = P.orfaosListar(baseO);
  ok('acha o órfão e ignora o certo', orf.length === 1 && orf[0].ent === 'contratos' && orf[0].id === 'k1');
  ok('desvincular solta o fantasma e mantém o registro', P.orfaoDesvincular(baseO, 'contratos', 'k1') === true && baseO.contratos[0].clienteId === null);
}

// ── RUNTIME: autocura r54b (pedido dele: resolver sozinho, sem botão) ───────
function parteAutocura(){
  const fakeWin = {};
  new Function('window', 'document', v5214src)(fakeWin, undefined);
  const P = fakeWin.CLIENTES_VISIVEIS_PURE;
  const baseO = { clientes: [{ id: 'c1' }],
    contratos: [{ id: 'k1', clienteId: 'fantasma' }],
    vendas: [{ id: 'v1', clienteId: 'fantasma' }],
    os: [{ id: 'o1', clienteId: 'c1' }] };
  const solv = P.orfaosAutoSoltaveis(baseO);
  ok('autocura solta órfão de venda/OS, nunca de contrato', solv.length === 1 && solv[0].ent === 'vendas');
  ok('autocura desativa repetido exato e mantém o mais antigo', (function(){
    const b = { usuarios: [
      { id: 'u1', login: 'caixa', nome: 'A', ativo: true, criadoEm: '2024-01-01' },
      { id: 'u2', login: 'CAIXA', nome: 'B', ativo: true, criadoEm: '2025-01-01' }
    ]};
    const g = P.usuGruposDuplicados(b.usuarios, null);
    if(g.length !== 1) return false;
    return P.usuDesativarRepetidos(b, ['u2'], 'u1') === 1 && b.usuarios[0].ativo === true && b.usuarios[1].ativo === false;
  })());
  ok('autocura roda sozinha ao abrir o banco (1 vez)', v5214src.indexOf('function autoCuraDuplicadosOrfaos(){') >= 0 && v5214src.indexOf('autoCuraDuplicadosOrfaos();') >= 0 && v5214src.indexOf('__v5214_autocura_vez') >= 0);
  ok('login ignora inativo (desativar nunca trava ninguém)', /if\(!u \|\| !u\.ativo\) return false;/.test(v52253));
}

(async () => {
  try{
    await parteCripto();
    parteDedup();
    parteAutocura();
  }catch(e){ console.error('  ✘ ERRO: ' + (e && e.message)); process.exit(1); }
  console.log('\nRESULTADO: ' + passou + ' verificações r54 — hash, corte, prova, dedup e backups!');
})();
//<<<<SECAO:test_r54_senhas_dedup.js:FIM>>>>
}

if (false) { // ═══ test_r58_senhas_tela.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_r58_senhas_tela.js:INICIO>>>>
// TESTE r58 (auditoria, bug #0 + achado 9) — salvar pela tela re-hash + 1 tela/1 função.
// Antes: a tela usava saveUsuarioFinal sem re-hash (senha velha voltava com o Corte) e havia 3 definições.
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }
const v5196 = fs.readFileSync('ajustes_v5196_patch.js', 'utf8');
console.log('== SENHA DA TELA COM HASH (r58) ==');
ok('saveUsuarioFinal é async (espera o hash antes de gravar)', v5196.indexOf('window.saveUsuarioFinal = async function(id)') >= 0);
const ini = v5196.indexOf('window.saveUsuarioFinal = async function(id)');
const fim = v5196.indexOf('// Sobrescreve o saveUsuario antigo', ini);
const h = (ini >= 0 && fim > ini) ? v5196.slice(ini, fim) : '';
ok('trecho isolado', h.length > 500);
ok('re-hash quando a senha muda', h.indexOf('await atualizarHashRegistro(u, senha)') >= 0);
ok('criação marca senhaPadrao (o dono troca no 1º login)', h.indexOf('if(eraNovo) u.senhaPadrao = true;') >= 0);
ok('troca por outra pessoa marca senhaPadrao', h.indexOf('u.senhaPadrao = (u.id === s.usuarioId) ? false : true;') >= 0);
const posf = fs.readFileSync('ajustes_pos_final_patch.js', 'utf8');
ok('pos_final sem modal morto', posf.indexOf('window.renderModalUsuario') < 0);
ok('pos_final sem saveUsuarioFinal morto', posf.indexOf('window.saveUsuarioFinal') < 0);
const app = fs.readFileSync('app.js', 'utf8');
ok('referência r54 intacta no app.js', app.indexOf('async function saveUsuario') >= 0 && app.indexOf('await atualizarHashRegistro(payload,payload.senha)') >= 0);
console.log('\nRESULTADO: senha da tela com hash provada!');
//<<<<SECAO:test_r58_senhas_tela.js:FIM>>>>
}

if (false) { // ═══ test_r59_setup.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_r59_setup.js:INICIO>>>>
// TESTE r59 COMERCIAL — setup assistido: base vazia abre o setup (não o login);
// valida, cria loja + Dono com hash e grava a nuvem. Sem fábrica.
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }
const code5900 = fs.readFileSync('ajustes_v5900_setup_comercial_patch.js', 'utf8');
const ctx = { window: {} };
new Function('window', code5900)(ctx.window);
const S = ctx.window.SETUP_COMERCIAL_PURE;
console.log('== SETUP ASSISTIDO (r59) ==');
ok('precisaSetup: vazia = sim', S.precisaSetup({empresas:[],usuarios:[]}) === true);
ok('precisaSetup: sem empresa = sim', S.precisaSetup({empresas:[],usuarios:[{id:'u'}]}) === true);
ok('precisaSetup: sem usuário = sim', S.precisaSetup({empresas:[{id:'e'}],usuarios:[]}) === true);
ok('precisaSetup: cheia = não', S.precisaSetup({empresas:[{id:'e'}],usuarios:[{id:'u'}]}) === false);
ok('validação pega tudo que falta', S.validarSetup({}).length === 3);
ok('validação aprova o certo', S.validarSetup({nome:'Loja X',login:'maria',senha:'1234',apiUrl:''}).length === 0);
ok('validação barra nuvem inválida', S.validarSetup({nome:'Loja X',login:'maria',senha:'1234',apiUrl:'banana'}).length === 1);
ok('login interceptado (base vazia abre setup)', code5900.indexOf('window.showLogin = function(){') >= 0 && code5900.indexOf('ehSetupPendente') >= 0);
ok('setup cria Dono (não admin de fábrica)', code5900.indexOf("perfil: 'Dono'") >= 0);
ok('setup gera hash do admin', code5900.indexOf('await atualizarHashRegistro(u, dados.senha)') >= 0);
ok('setup não marca senha padrão', code5900.indexOf('senhaPadrao: false') >= 0);
ok('setup grava a nuvem', code5900.indexOf('db.config.nuvem = { apiUrl:') >= 0);
console.log('== SETUP COM TOKEN (r59b) ==');
ok('precisaSetup aceita token', S.precisaSetup.length >= 2);
ok('precisaSetup: vazia COM token = não (SÓ NUVEM recarregado vai ao login)', S.precisaSetup({empresas:[],usuarios:[]}, true) === false);
ok('precisaSetup: vazia SEM token = sim', S.precisaSetup({empresas:[],usuarios:[]}, false) === true);
ok('precisaSetup: sem args = sim (fail-safe)', S.precisaSetup(null) === true);
ok('gate lê o token do aparelho', code5900.indexOf('DIGICOPY_CLOUD') >= 0 && code5900.indexOf('digicopy_cloud_device_token_v1') >= 0);
console.log('\nRESULTADO: setup com token provado!');
console.log('\nRESULTADO: setup assistido provado!');
//<<<<SECAO:test_r59_setup.js:FIM>>>>
}

if (false) { // ═══ test_r60_login_retry.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_r60_login_retry.js:INICIO>>>>
// TESTE r60 v7.3.0 — O LOGIN QUE SE CURA SOZINHO (print 30/09: 'kauan não existe
// neste PC' depois de limpar o navegador). Prova: decisão pura certa, embrulho
// instalado no doLoginUser, puxada com limite (nunca trava o login), no bundle.
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }
const code = fs.readFileSync('ajustes_v5901_login_retry_nuvem_patch.js', 'utf8');
console.log('== LOGIN QUE SE CURA SOZINHO (r60) ==');
// decisão pura: só puxa quando (não achou) E (tem token) E (não está puxando)
const ctx = { window: {} };
ctx.window.doLoginUser = function(){}; // espião: instalar() embrulha na hora (sem timer)
new Function('window', code)(ctx.window);
const P = ctx.window.LOGIN_RETRY_NUVEM_PURE;
ok('PURE exportada', !!P && typeof P.precisaPuxar === 'function');
ok('não achou + token + livre = PUXA', P.precisaPuxar({achou:false,token:true,tentando:false}) === true);
ok('achou = não puxa', P.precisaPuxar({achou:true,token:true,tentando:false}) === false);
ok('sem token = não puxa (aviso original)', P.precisaPuxar({achou:false,token:false,tentando:false}) === false);
ok('já puxando = não puxa de novo', P.precisaPuxar({achou:false,token:true,tentando:true}) === false);
ok('sem args = não puxa (fail-safe)', P.precisaPuxar(null) === false);
ok('embrulha o doLoginUser', ctx.window.doLoginUser.__v5901 === true);
ok('avisa que está buscando na nuvem', code.indexOf('buscando na nuvem') >= 0);
ok('puxa com ciclo do sync', code.indexOf("tick('login-retry')") >= 0);
ok('puxada tem limite de 15 s (nunca trava o login)', code.indexOf('15000') >= 0);
ok('compara igual ao v52253 (login/nome/1º nome)', code.indexOf('cN.split') >= 0);
ok('está no bundle', fs.readFileSync('bundle-manifest.json','utf8').indexOf('ajustes_v5901_login_retry_nuvem_patch.js') >= 0);
console.log('\nRESULTADO: login que se cura provado!');
//<<<<SECAO:test_r60_login_retry.js:FIM>>>>
}


if (false) { // ═══ test_r69_hash_vence_texto_e_prova_honesta.js (bloco extraído e rodado pelo runner do tema)
//<<<<SECAO:test_r69_hash_vence_texto_e_prova_honesta.js:INICIO>>>>
// test_r69_hash_vence_texto_e_prova_honesta.js — duas coisas que o relatório do
// QA externo (r67 dele) tocou de leve e que aqui viram conserto + trava:
//   A) LOGIN: o campo legado `senha` era comparado ANTES do hash. Cadastro com
//      hash+salt deixava uma senha antiga (ou vazia) autenticar, contra o que o
//      bloco de senhas do app.js promete ("confere hash primeiro, texto puro só
//      na transição"). Agora: tem hash+salt → prova o hash; não tem → texto, e o
//      próprio login grava o hash em seguida.
//   B) USUÁRIOS: a "prova de gravação" depois de salvar exigia `x.ativo`, então
//      gravar alguém como INATIVO gritava "O usuário NÃO ficou gravado" com o
//      registro salvo certinho. Alarme falso é pior que silêncio: ensina a pessoa
//      a desconfiar de gravação boa. Agora a prova compara o status ESCOLHIDO.
//   C) PRIVACIDADE no bundle público: a tela de Usuários dizia "Admin (Kauan) e
//      Dono (Denivaldo)", o cadeado do Backup citava o nome de um funcionário, e
//      `patch_relatorio.js` trazia a senha de uma pessoa escrita em comentário e
//      um bloco que reescrevia a senha dela no boot. Nada disso devia ser público.
const fs = require('fs');
const vm = require('vm');
let falhas = 0;
const ok = (nome, cond) => { if (cond) console.log('  ok - ' + nome); else { console.error('  FALHA - ' + nome); falhas++; } };
const ler = (a) => fs.readFileSync(a, 'utf8');

// ── A) o validador puro, pela exportação do próprio patch ──────────────────
const SRC_LOGIN = ler('ajustes_v52253_login_tela_branca_patch.js');
const winFake = { addEventListener() { }, removeEventListener() { }, setTimeout, clearTimeout, console };
winFake.window = winFake;
try { new Function('window', 'document', SRC_LOGIN)(winFake, undefined); } catch (e) { /* o PURE já foi exportado */ }
const PURE = winFake.LOGIN_TELA_BRANCA_V52253_PURE;
ok('o patch exporta o validador e os dois critérios novos', !!(PURE && typeof PURE.loginFlexivel === 'function' && typeof PURE.mesmoUsuario === 'function' && typeof PURE.temHash === 'function'));

const comHash = { id: 'u1', login: 'qa.financeiro', nome: 'QA Financeiro', perfil: 'Funcionário', ativo: true, senha: 'SENHA-ANTIGA-VAZANDO', senhaHash: 'abc123', senhaSalt: 'salt1' };
const semHash = { id: 'u2', login: 'qa.novato', nome: 'QA Novato', perfil: 'Funcionário', ativo: true, senha: 'senha-nova-1' };

ok('cadastro com hash+salt: a senha em texto NÃO autentica mais', PURE.loginFlexivel('qa.financeiro', 'SENHA-ANTIGA-VAZANDO', [comHash]) === null);
ok('registro sem hash continua entrando (a transição não quebra)', (PURE.loginFlexivel('qa.novato', 'senha-nova-1', [semHash]) || {}).id === 'u2');
ok('temHash só é true com hash E salt', PURE.temHash(comHash) === true && PURE.temHash(semHash) === false && PURE.temHash({ senhaHash: 'x' }) === false);
ok('mesmoUsuario vale por login, nome completo ou primeiro nome',
  PURE.mesmoUsuario('qa.financeiro', comHash) && PURE.mesmoUsuario('QA Financeiro', comHash) && PURE.mesmoUsuario('qa', comHash) && !PURE.mesmoUsuario('outra pessoa', comHash));
ok('o laço do hash usa essa mesma regra (login pelo nome não fica de fora)',
  SRC_LOGIN.includes('LOGIN_TELA_BRANCA_V52253_PURE.mesmoUsuario(loginVal, hu)') && !SRC_LOGIN.includes('ffH(hu.login) !== fLH'));
ok('e continua atualizando o hash de quem entrou pelo texto (auto-cura)',
  /if\(user && !user\.senhaHash && typeof atualizarHashRegistro === 'function'\)/.test(SRC_LOGIN));

// ── B) a prova de gravação, dirigida de verdade no patch de Usuários ───────
function arena(opts) {
  opts = opts || {};
  const porId = new Map();
  const avisos = [];
  function El(id, v) {
    const e = { id: id || '', value: v == null ? '' : v, innerHTML: '', innerText: '', textContent: '', classList: { contains: () => false, add() { }, remove() { } }, appendChild() { }, querySelector: () => null, querySelectorAll: () => [] };
    if (id) porId.set(id, e);
    return e;
  }
  const document = { createElement: () => El('', ''), getElementById: (id) => porId.get(id) || null, querySelectorAll: () => [], addEventListener() { }, body: El('body') };
  const db = { usuarios: [], tecnicos: [], auditoria: [] };
  const win = {};
  const ctx = {
    window: win, document, db,
    sess: () => ({ usuarioId: 'usr_dono', perfil: 'Admin', empresaId: 'E1' }),
    getSession: () => ({ usuarioId: 'usr_dono', perfil: 'Admin', empresaId: 'E1' }),
    temPermissaoTotal: () => true, podeEditarUsuario: () => true,
    perfilEfetivo: (u) => (u && u.perfil) || 'Funcionário',
    toast: (m) => { avisos.push(String(m)); }, toastMsg: (m) => { avisos.push(String(m)); },
    saveDB: () => { if (opts.perderGravacao) db.usuarios.length = 0; },
    renderUsuarios: () => { }, closeModal: () => { }, logAction: () => { },
    uidSafe: (p) => p + '_' + (db.usuarios.length + 1),
    atualizarHashRegistro: async (reg, senha) => { reg.senhaSalt = 'salt-fake'; reg.senhaHash = 'hash-de-' + senha; if (opts.hashLimpaTexto) reg.senha = ''; return true; },
    fold: (v) => String(v == null ? '' : v).toLowerCase().trim(),
    txt: (v) => String(v == null ? '' : v).trim(),
    console: { log() { }, warn() { }, error() { } },
    setTimeout: (fn) => { try { if (typeof fn === 'function') fn(); } catch (e) { } return 0; },
    setInterval: () => 0, clearTimeout: () => { },
    localStorage: { getItem: () => null, setItem: () => { } },
  };
  for (const k of ['esc', 'aviso', 'confirmSistema', 'openModal', 'showModal', 'uid']) if (!(k in ctx)) ctx[k] = () => '';
  const cx = vm.createContext(ctx);
  let erroCarga = null;
  try { vm.runInContext(ler('ajustes_v5196_patch.js'), cx, { filename: 'v5196.js' }); } catch (e) { erroCarga = e.message; }
  return {
    win, db, avisos, erroCarga,
    formulario: (c) => {
      porId.set('u-nome', El('u-nome', c.nome)); porId.set('u-login', El('u-login', c.login));
      porId.set('u-senha', El('u-senha', c.senha)); porId.set('u-ativo', El('u-ativo', c.ativo ? 'true' : 'false'));
      porId.set('u-perfil', El('u-perfil', c.perfil || 'Funcionário'));
    },
  };
}

(async () => {
  let a = arena();
  ok('o patch de Usuários carrega no harness sem erro', a.erroCarga === null);
  a.formulario({ nome: 'QA Financeiro', login: 'qa.financeiro', senha: 'senha-forte-1', ativo: true });
  await a.win.saveUsuarioFinal();
  ok('salvar ATIVO anuncia o login pra testar', /Login pra testar: qa\.financeiro/.test(a.avisos[a.avisos.length - 1] || ''));

  a = arena();
  a.formulario({ nome: 'QA Inativo', login: 'qa.inativo', senha: 'senha-forte-2', ativo: false });
  await a.win.saveUsuarioFinal();
  const msgInativo = a.avisos[a.avisos.length - 1] || '';
  ok('salvar INATIVO não grita mais "não ficou gravado"', !/NÃO ficou gravado/i.test(msgInativo));
  ok('e explica que o login ficou desativado', /salvo como INATIVO/.test(msgInativo) && /não consegue entrar/.test(msgInativo));
  ok('o registro está lá, inativo, com hash gravado', a.db.usuarios.length === 1 && a.db.usuarios[0].ativo === false && !!a.db.usuarios[0].senhaHash);

  a = arena({ perderGravacao: true });
  a.formulario({ nome: 'QA Perdido', login: 'qa.perdido', senha: 'senha-forte-3', ativo: true });
  await a.win.saveUsuarioFinal();
  ok('gravação perdida CONTINUA gritando (a prova não foi castrada)', /NÃO ficou gravado/.test(a.avisos[a.avisos.length - 1] || ''));

  a = arena({ hashLimpaTexto: true });
  a.db.usuarios.push({ id: 'usr_velho', empresaId: 'E1', login: 'qa.hash', nome: 'QA Hash', senha: '1234', ativo: true, perfil: 'Funcionário' });
  a.formulario({ nome: 'QA Hash', login: 'qa.hash', senha: 'senha-forte-4', ativo: true });
  await a.win.saveUsuarioFinal('usr_velho');
  ok('registro que fica só com hash não vira alarme falso', !/NÃO ficou gravado/.test(a.avisos[a.avisos.length - 1] || ''));

  // ── C) privacidade: o bundle é público ──────────────────────────────────
  const SRC_SYNC = ler('cloudflare_data_sync_patch.js');
  const guard = SRC_SYNC.slice(SRC_SYNC.indexOf('async function tickSohLeitura'), SRC_SYNC.indexOf('async function puxarAoAbrirTela'));
  ok('leitura ao abrir tela não finge tentativa sem token', /if\(!authorized\(\)\)return false;/.test(guard));
  ok('e continua deixando o tick() decidir o resto', /if\(state\.paused\|\|busy\|\|!authorized\(\)\)return false;/.test(SRC_SYNC));

  const SRC_REL = ler('patch_relatorio.js');
  const SRC_BK = ler('ajustes_v52296_backups_nuvem_patch.js');
  const SRC_V5196 = ler('ajustes_v5196_patch.js');
  const SRC_APP = ler('app.js');
  const semNome = (src) => !/Kauan|Denivaldo/.test(src);
  ok('a tela de Usuários não cita nome de pessoa (nem em comentário servido)',
    semNome(SRC_V5196) && semNome(SRC_APP) && semNome(ler('ajustes_pos_final_patch.js')));
  ok('o subtítulo neutro entrou nas duas telas', /Admin e Dono têm permissão total; os demais entram como Funcionários\./.test(SRC_V5196) && /Admin e Dono têm permissão total; os demais entram como Funcionários\./.test(SRC_APP));
  ok('o cadeado do Backup não cita funcionário por nome', !/Kauan|Denivaldo/.test(SRC_BK));
  ok('patch_relatorio não publica senha de ninguém', !/3232/.test(SRC_REL) && !/'1234'/.test(SRC_REL));
  ok('e o bloco que reescrevia a senha no boot saiu', !/deni\.senha = '3232'/.test(SRC_REL) && /NAO RESTAURAR/.test(SRC_REL));

  for (const b of ['app.bundle.js', 'mobile/www/app.bundle.js']) {
    const src = ler(b);
    ok('bundle com o hash valendo mais que o texto legado: ' + b, /if\(temHash\(u\)\) return false;/.test(src));
    ok('bundle com a prova de gravação honesta: ' + b, /!!x\.ativo === ativo/.test(src));
    ok('bundle sem senha e sem nome de pessoa publicada: ' + b, !/3232/.test(src) && !/Kauan/.test(src) && !/Denivaldo/.test(src));
  }

  console.log('\nRESULTADO: ' + (falhas ? falhas + ' FALHA(S)' : 'ok — hash manda no login, a prova de gravação diz a verdade e o bundle não expõe mais as pessoas'));
  process.exit(falhas ? 1 : 0);
})();
//<<<<SECAO:test_r69_hash_vence_texto_e_prova_honesta.js:FIM>>>>
}
