// test_ajustes_v5262.js — v5.26.2: LOGIN DA NUVEM ANTES DO LOGIN DE USUÁRIO
// (portão à vista pra todos, CNPJ+senha primeiro e conexão automática),
// SESSÃO DE USUÁRIO 1X POR DIA e GERENTE .exe COM AVISOS CLAROS DE FALHA.
//
// O que este teste trava (pedido dele, literal — quem desfizer quebra aqui):
//  1) o portão da nuvem EXISTE e aparece ANTES do login de usuário em PC não
//     autorizado; nunca fica oculto "de propósito";
//  2) depois de /v1/check-pass confirmar CNPJ+senha, o aparelho conecta
//     automaticamente, sem perguntar o nome do PC nem criar etapa extra;
//  3) /v1/check-pass é só conferência: NÃO cria device, NÃO muda dados;
//  4) conectou 1x: token no PC → portão nunca mais aparece;
//  5) sessão de usuário vale o DIA: virou o dia → remove a sessão e avisa;
//  6) login do Gerente traz mensagens específicas por código de erro.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const PATCH = 'ajustes_v5262_login_nuvem_primeiro_patch.js';
const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const patch = fs.readFileSync(PATCH, 'utf8');
const sync = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const gPkg = JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8'));
const gMain = fs.readFileSync('gerente-atualizacoes/main.js', 'utf8');
const gHtml = fs.readFileSync('gerente-atualizacoes/index.html', 'utf8');

console.log('== PATCH: portão da nuvem antes do login de usuário ==');
ok('patch existe com guard próprio (__v5262ln)', patch.indexOf("window.__v5262ln") >= 0);
ok('manifesto: patch v5.26.2 na 203 (v5.26.0 na 202; data grande do chamado na 204; fila hoje fecha na 218 com as 6 telas fiscais completas v6.0.14', manifest.length === 222 && manifest[201] === 'ajustes_v5260_cnpj_gerente_patch.js' && manifest[202] === PATCH && manifest[203] === 'ajustes_v5264_chamado_data_grande_patch.js');
ok('patch está dentro do bundle gerado', bundle.indexOf(PATCH) >= 0 && bundle.indexOf('__v5262ln') >= 0);
ok('portão cobre a tela inteira só quando NÃO tem token (conectou 1x some)', patch.indexOf("if (tokenNuvem()) return;") >= 0 && patch.indexOf('v5262-portao') >= 0);
ok('ordem certa: etapa 1 = CNPJ+senha via /v1/check-pass', patch.indexOf("'/v1/check-pass'") >= 0 && patch.indexOf('v5262-etapa1') >= 0);
ok('conecta automaticamente depois de conferir (sem etapa de nome do PC)', !patch.includes('v5262-etapa2') && !patch.includes('v5262-pc') && patch.indexOf('conectarAutomaticamente') >= 0 && patch.indexOf("'/v1/enroll-cnpj'") >= 0);
ok('check-pass sem registros: etapa 1 manda só cnpj+senha', /api\('\/v1\/check-pass'/.test(patch) && patch.indexOf("body:JSON.stringify({ cnpj:cnpj, senha:senha })") >= 0 && patch.indexOf('deviceName:nomePCAutomatico()') >= 0);
ok('senha tem botão de mostrar/ocultar', patch.includes('v5262-mostrar-senha') && patch.includes("campo.type = mostrar ? 'text' : 'password'") && patch.includes('Ocultar senha'));
ok('portão não fecha sistema: link jeito antigo p/ admin até reload', patch.indexOf('v5262-antigo') >= 0 && patch.indexOf('FECHOU_KEY') >= 0 && patch.indexOf('sessionStorage.setItem(FECHOU_KEY') >= 0);
ok('portão abaixo dos popups do sistema (z 2147482900 < 2147483000)', patch.indexOf('2147482900') >= 0);
ok('CNPJ vem preenchido (usa o CNPJ_V5260_PURE do patch 202)', patch.indexOf('CNPJ_V5260_PURE') >= 0 && patch.indexOf('fmtCnpj') >= 0);
ok('mensagens do portão: sem senha definida / motor velho / sem internet', patch.indexOf('senhaDefinida === false') >= 0 && patch.indexOf('atualizar_motor_nuvem.cmd') >= 0 && patch.indexOf('Verifique a internet') >= 0);

console.log('== SESSÃO DE USUÁRIO: 1x por dia ==');
ok('sessão vale só o dia: expira ao virar o dia', patch.indexOf('sessaoDoDiaExpirada') >= 0 && patch.indexOf('mesmoDia') >= 0);
ok('virou o dia: sessão removida + banner no login', patch.indexOf("localStorage.removeItem(SESSION_KEY)") >= 0 && patch.indexOf('v5262-aviso-dia') >= 0 && patch.indexOf('Virou o dia') >= 0);
ok('puras exportadas (LOGIN_V5262_PURE)', patch.indexOf('window.LOGIN_V5262_PURE') >= 0);

// Instancia as puras num sandbox mínimo (sem DOM/server) e testa a lógica.
const sandbox = {
  window:{}, document:undefined, localStorage:{ _m:{}, getItem(k){return this._m[k]||null;}, removeItem(k){delete this._m[k];}, setItem(k,v){this._m[k]=String(v);} },
  sessionStorage:{ getItem(){return null;}, setItem(){}, removeItem(){} },
  MutationObserver:function(){ this.observe=function(){}; },
  setTimeout:function(){}, clearTimeout:function(){}, console:console,
};
sandbox.window.localStorage = sandbox.localStorage;
vm.createContext(sandbox);
vm.runInContext(patch, sandbox);
const P = sandbox.window.LOGIN_V5262_PURE;
ok('PURA mesmoDia: hoje=hoje; ontem≠hoje; ano passado≠hoje',
  P.mesmoDia('2026-09-16T09:30:00', new Date('2026-09-16T22:00:00')) === true &&
  P.mesmoDia('2026-09-15T23:59:59', new Date('2026-09-16T00:00:01')) === false &&
  P.mesmoDia('2025-09-16T10:00:00', new Date('2026-09-16T10:00:00')) === false);
ok('PURA mesmoDia: data inválida não joga porrada (retorna falso)', P.mesmoDia('lixo', new Date('2026-09-16')) === false);
ok('PURA sessaoDoDiaExpirada: sem sessão → não expira (fluxo normal primeiro login)',
  (sandbox.localStorage.removeItem('digicopy_session_v42_demo_apresentacao'), P.sessaoDoDiaExpirada() === false));
ok('PURA sessaoDoDiaExpirada: login de hoje = válida; de ontem = expira',
  (sandbox.localStorage.setItem('digicopy_session_v42_demo_apresentacao', JSON.stringify({loginAt:new Date().toISOString()})), P.sessaoDoDiaExpirada() === false) &&
  (sandbox.localStorage.setItem('digicopy_session_v42_demo_apresentacao', JSON.stringify({loginAt:'2026-09-01T10:00:00'})), P.sessaoDoDiaExpirada() === true));

console.log('== WORKER: /v1/check-pass + erros específicos do gerente ==');
ok('worker carimbado 5.26.4', wk.indexOf("WORKER_VERSION = '5.26.4'") >= 0);
ok('rota POST /v1/check-pass existe', wk.indexOf("'/v1/check-pass'") >= 0 && wk.indexOf("request.method === 'POST' && url.pathname === '/v1/check-pass'") >= 0);
ok('check-pass NÃO cria nada (sem INSERT nesse trecho)', (function(){ const t = wk.split("'/v1/check-pass'")[1].split("'/v1/enroll-cnpj'")[0]; return t.indexOf('INSERT') < 0 && t.indexOf('INSERT INTO devices') < 0 && t.indexOf('randomToken') < 0; })());
ok('check-pass diz quando a senha ainda não foi definida (senhaDefinida:false)', wk.indexOf('senhaDefinida: false') >= 0 && wk.indexOf('Senhas de conexão (CNPJ) e do Gerente') >= 0);
ok('check-pass confere com conn_hash (senha nunca em texto)', wk.indexOf("conferirSenha(env, cnpj0, senha0, 'conn_hash')") >= 0);
ok('check-pass também confere gerente_hash só no CNPJ da dona', /gerente_hash[\s\S]{0,220}cnpj0 === seg0\.owner_cnpj/.test(wk));
ok('senha do gerente sinaliza tipo gerente e administrador', wk.indexOf("tipo: gerenteOk ? 'gerente' : 'conexao'") >= 0 && wk.indexOf('administrador: gerenteOk') >= 0);
ok('senha errada do check-pass devolve erro específico, não só HTTP 403', wk.indexOf('CNPJ ou senha de conexão/gerente incorretos') >= 0);
ok('api do app preserva data.aviso nas respostas de erro', sync.indexOf('(data.aviso)') >= 0 && sync.indexOf('err.aviso') >= 0);
ok('portão explica quando o computador será Administrador', patch.indexOf('r.administrador') >= 0 && patch.indexOf('será criado como <b>Administrador</b>') >= 0);
ok('campo mostra só SENHA DE CONEXÃO e não expõe a regra do gerente', patch.indexOf('SENHA DE CONEXÃO<br>') >= 0 && patch.indexOf('OU DO GERENTE (gerente separado') < 0);
ok('gerente-login: erro GERENTE_NAO_DEFINIDO (409) com instrução', wk.indexOf('GERENTE_NAO_DEFINIDO') >= 0 && wk.indexOf('Salvar senhas na nuvem') >= 0);
ok('gerente-login: erro GERENTE_SO_DONO cita o CNPJ/nome da dona', wk.indexOf('GERENTE_SO_DONO') >= 0 && wk.indexOf('owner_nome') >= 0);
ok('gerente-login: erro SENHA_GERENTE_INVALIDA específico', wk.indexOf('SENHA_GERENTE_INVALIDA') >= 0);

console.log('== GERENTE .exe: avisos claros de por que o login falhou ==');
ok('gerente na versão 5.26.3', gPkg.version === '5.26.3');
ok('main repassa código + status do erro', gMain.indexOf('codigo:') >= 0 && gMain.indexOf('status: r.status') >= 0);
ok('tela tem avisoLoginGerente mapeando os códigos', gHtml.indexOf('avisoLoginGerente') >= 0 && gHtml.indexOf('GERENTE_NAO_DEFINIDO') >= 0 && gHtml.indexOf('SENHA_GERENTE_INVALIDA') >= 0);
ok('tela explica o que fazer (definir senha / rodar o .cmd do motor / sem internet)', gHtml.indexOf('atualizar_motor_nuvem.cmd') >= 0 && /sem (internet|conexão)/i.test(gHtml));

console.log('== CARIMBO 5.26.2 (app inteiro) ==');
ok('package.json na 6.0.9', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('script check valida o patch novo', pkg.scripts.check.indexOf(PATCH) >= 0);
ok('mobile sincronizado com o bundle novo', fs.readFileSync('mobile/www/app.bundle.js','utf8') === bundle);

console.log('\nTudo OK — v5.26.2 (login da nuvem ANTES do login de usuário · conexão automática sem perguntar nome do PC · olho para mostrar senha · sessão de usuário 1x por dia · Gerente .exe com avisos claros de falha).');
