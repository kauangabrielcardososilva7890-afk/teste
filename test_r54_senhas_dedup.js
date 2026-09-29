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
ok('seeds marcadas como senha padrão (troca forçada)', app.indexOf("login:'kauan'") >= 0 && (app.match(/senhaPadrao:true/g) || []).length >= 2);
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

// ── P5 + worker 5.28.1 + motor ──────────────────────────────────────────────
console.log('== r54/P5: backups + worker 5.28.1 + motor regenerado ==');
ok('lista de backups aguenta data vazia/inválida', worker.indexOf('x.gerado_em == null || isNaN(Number(x.gerado_em))') >= 0);
ok('login vazio na prova vira 403, não 500 (S7)', worker.indexOf("String(cleanText(request.headers.get('x-digicopy-usuario-login')") >= 0);
ok('worker carimbado 5.28.1', worker.indexOf("const WORKER_VERSION = '5.28.1'") >= 0);
const motor = fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8');
ok('motor regenerado com a 5.28.1', motor.indexOf('5.28.1') >= 0 && motor.indexOf('company-pass-liberar') >= 0 && motor.indexOf('prova2') >= 0);

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

(async () => {
  try{
    await parteCripto();
    parteDedup();
  }catch(e){ console.error('  ✘ ERRO: ' + (e && e.message)); process.exit(1); }
  console.log('\nRESULTADO: ' + passou + ' verificações r54 — hash, corte, prova, dedup e backups!');
})();
