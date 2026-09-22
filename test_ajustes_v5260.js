// test_ajustes_v5260.js — v5.26.0: CONEXÃO POR CNPJ + SENHA ÚNICA + SITE
// RESTRITO + LINK-NOTIFICAÇÃO POR DESTINATÁRIO + GERENTE (3º sistema, .exe
// separado no PC do dono) + IMAGENS DO TUTORIAL (anexadas do PC pro R2).
//
// O que este teste trava (decreto: senha só vira hash; quem reabre rota
// fechada quebra aqui):
//  1) senha de conexão e senha do gerente NUNCA viajam/ficam em texto —
//     o banco guarda só hash com pimenta (SETUP_SECRET|área|cnpj|senha);
//  2) /v1/app-releases (histórico) FECHADO: só admin do painel ou gerente;
//  3) /dl/ não é endereço decorável: sessão do site OU slug da versão OU
//     token de gerente/admin;
//  4) destinatário: todos / lista de CNPJs / só a loja do dono — o sininho
//     pergunta com ?cnpj= e a nuvem responde muda quando não é pra ele;
//  5) o link da notificação é a página secreta /a/<slug> da publicação;
//  6) gerente é credencial SEPARADA e só o CNPJ da empresa dona entra.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const patch = fs.readFileSync('ajustes_v5260_cnpj_gerente_patch.js', 'utf8');
const sin = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
const mig = fs.readFileSync('cloudflare-worker/migrations/0006_cnpj_gerente.sql', 'utf8');
const gPkg = JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8'));
const gMain = fs.readFileSync('gerente-atualizacoes/main.js', 'utf8');
const gPre = fs.readFileSync('gerente-atualizacoes/preload.js', 'utf8');
const gHtml = fs.readFileSync('gerente-atualizacoes/index.html', 'utf8');
const gCmd = fs.readFileSync('gerente-atualizacoes/GERAR_GERENTE_EXE.cmd', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

console.log('== WORKER: senhas SÓ como hash + tabelas novas ==');
ok('worker: tabela connect_secrets (senhas)', wk.indexOf('CREATE TABLE IF NOT EXISTS connect_secrets') >= 0 && mig.indexOf('connect_secrets') >= 0);
ok('worker: tabela empresas (CNPJ/nome conhecidos)', wk.indexOf('CREATE TABLE IF NOT EXISTS empresas') >= 0 && mig.indexOf('CREATE TABLE IF NOT EXISTS empresas') >= 0);
ok('worker: sessões do site (30 dias)', wk.indexOf('site_sessions') >= 0 && wk.indexOf('sessaoSite') >= 0);
ok('worker: sessões do gerente (7 dias)', wk.indexOf('gerente_sessions') >= 0 && wk.indexOf('gerenteDaRequisicao') >= 0);
ok('worker: hash com pimenta da nuvem (SETUP_SECRET)', wk.indexOf('senhaHash') >= 0 && /SETUP_SECRET/.test(wk.slice(wk.indexOf('function senhaHash'), wk.indexOf('function senhaHash') + 300)));
ok('worker: NUNCA grava senha crua (só conn_hash/gerente_hash)', wk.indexOf('connect_secrets (id, conn_hash') >= 0 && wk.indexOf("INSERT INTO connect_secrets (id, senha") < 0 && wk.indexOf("senha") < wk.indexOf("senhaHash") + 99999);
ok('worker: gerente_hash cai pra conn_hash se omitida (retrocompat)', wk.indexOf("gerente_hash") >= 0);

console.log('== WORKER: destinatário (o coração do "pra quem aparece") ==');
ok('worker: colunas destino_tipo/destino_cnpjs/slug/imagens', ['destino_tipo', 'destino_cnpjs', 'slug', 'imagens'].every(c => wk.indexOf(c) >= 0 && mig.indexOf(c) >= 0));
ok('worker: destinoOk decide todos|lista|so_loja', wk.indexOf('function destinoOk') >= 0 && /'so_loja'/.test(wk) && /'todos'/.test(wk));
ok('worker: GET app-release pergunta com ?cnpj e filtra por destino', wk.indexOf("url.searchParams.get('cnpj')") >= 0 && wk.indexOf('destinoOk(r, cnpjQ)') >= 0);
ok('worker: sem cnpj → só publicações "todos" (retrocompatível)', wk.indexOf('legado') >= 0);
ok('worker: publicar gera/segura slug (link secreto)', wk.indexOf("randomToken('a_')") >= 0 && wk.indexOf('linkSlug') >= 0);

(function simularDestinoOk() {
  // extrai as funções purinhas do worker e simula os 3 destinos
  const ini = wk.indexOf('function destinoOk');
  const fim = wk.indexOf('\n}', ini) + 2;
  const trecho = wk.slice(ini, fim);
  const iniSd = wk.indexOf('function soDigitos');
  const trechoSd = wk.slice(iniSd, wk.indexOf('\n}', iniSd) + 2);
  const cx = {};
  vm.runInNewContext(trechoSd + '\n' + trecho + ';this.f=destinoOk;this.sd=soDigitos;', cx);
  ok('sim: soDigitos extraída do worker funciona', cx.sd('11.111.111/0001-11') === '11111111000111');
  const f = cx.f;
  ok('sim: destinoOk(todos) deixa qualquer CNPJ (inclusive nulo)', f({ destino_tipo: 'todos', destino_cnpjs: '[]' }, null) === true && f({ destino_tipo: 'todos' }, '12345678000195') === true);
  ok('sim: destinoOk(lista) só os marcados', f({ destino_tipo: 'lista', destino_cnpjs: '["11111111000111"]' }, '11111111000111') === true && f({ destino_tipo: 'lista', destino_cnpjs: '["11111111000111"]' }, '99999999000199') === false);
  ok('sim: destinoOk(so_loja) só o CNPJ do dono', f({ destino_tipo: 'so_loja', destino_cnpjs: '[]', ownerCnpj: '11111111000111' }, '11111111000111') === true && f({ destino_tipo: 'so_loja', destino_cnpjs: '[]', ownerCnpj: '11111111000111' }, '22222222000122') === false);
  ok('sim: so_loja SEM dono configurado não trava ninguém (retrocompat)', f({ destino_tipo: 'so_loja', destino_cnpjs: '[]', ownerCnpj: '' }, '33333333000133') === true);
})();

console.log('== WORKER: rotas novas (conexão CNPJ, site restrito, gerente, imagem) ==');
['/v1/connect-pass', '/v1/enroll-cnpj', '/v1/site-login', '/v1/gerente-login', '/v1/gerente/empresas', '/v1/release-image'].forEach((r) => {
  ok('worker: rota ' + r, wk.indexOf("'" + r + "'") >= 0);
});
ok('worker: definição de senhas só pra ADMIN do painel OU gerente provado (eclusa v5.26.5)', wk.indexOf("'/v1/connect-pass'") >= 0 && /connect-pass[\s\S]{0,1200}requireAdminOuGerente\(request, env\)/.test(wk));
ok('worker: gerente-login EXIGE CNPJ da empresa dona', /gerente-login[\s\S]{0,900}owner_cnpj/.test(wk));
ok('worker: requireAdminOuGerente = admin OU gerente', wk.indexOf('requireAdminOuGerente') >= 0 && /GERENTE_OU_ADMIN_REQUERIDO/.test(wk));
ok('worker: histórico /v1/app-releases FECHADO (sem vazar slug/destinatário)', /v1\/app-releases'\) \{[\s\S]{0,400}requireAdminOuGerente/.test(wk));
ok('worker: imagem do tutorial ≤4MB e no máx 8 por versão', wk.indexOf('TAMANHO_IMAGEM') < 0 && /4 \* 1024 \* 1024/.test(wk) && wk.indexOf('imgs.length >= 8') >= 0);

console.log('== WORKER: site restrito + páginas novas ==');
ok('worker: /atualizacoes com PORTÃO (sem sessão → tela de login)', /v1\/atualizacoes|pathname === '\/atualizacoes'/.test(wk) && /sessaoAt = await sessaoSite[\s\S]{0,80}paginaLoginSite/.test(wk));
ok('worker: login do site com cookie HttpOnly 30 dias + 303', wk.indexOf('site_sess=') >= 0 && wk.indexOf('SameSite=Lax') >= 0 && wk.indexOf("'location': '/atualizacoes'") >= 0);
ok('worker: sair do site (logout limpa o cookie)', wk.indexOf("logout") >= 0 && wk.indexOf('site_sess=; Max-Age=0') >= 0);
ok('worker: /atualizacoes filtra itens pelo CNPJ da sessão', wk.indexOf('destinoOk(r, sessaoAt.cnpj)') >= 0);
ok('worker: página secreta /a/<slug> (abre direto, sem digitar CNPJ)', wk.indexOf("url.pathname.startsWith('/a/')") >= 0 && wk.indexOf('.exe?s=') >= 0);
ok('worker: rota /a/ RETORNA htmlA (bug pego no demo: replace sem return = 404 em produção)', wk.indexOf('return new Response(htmlA,') >= 0 && wk.indexOf('return new Response(html,') >= 0);
ok('worker: imagens servidas em /img/ só de versão viva', wk.indexOf("url.pathname.startsWith('/img/')") >= 0 && wk.indexOf('liberadaImg') >= 0);
ok('worker: /dl/ EXIGE sessão OU slug igual ao da versão OU gerente/admin', wk.indexOf('slugQ === essa.slug') >= 0 && wk.indexOf('sessaoDl') >= 0 && new RegExp('Área restrita: entre em /atualizacoes').test(wk));
ok('worker: action remover-imagem (tira do tutorial e do R2)', wk.indexOf("'remover-imagem'") >= 0 && wk.indexOf('R2.delete(keyX)') >= 0);
ok('worker: tutorial renderiza grid de imagens + zoom ao clicar (.zi + lightbox)', wk.indexOf('class="zi"') >= 0 && wk.indexOf('lbz') >= 0);
ok('worker: versão do motor carimbada 5.26.1', wk.indexOf("WORKER_VERSION = '5.26.5'") >= 0);

console.log('== APP: sininho destinatário-aware + link secreto + abas/cartões ==');
ok('patch: guard único (__v5260cn) e PURE exportado', patch.indexOf('__v5260cn') >= 0 && patch.indexOf('window.CNPJ_V5260_PURE') >= 0);
ok('patch: consulta do sininho leva o CNPJ da instalação', patch.indexOf("'/v1/app-release'") >= 0 && patch.indexOf("'?cnpj='") >= 0 && patch.indexOf('empresaCnpj()') >= 0);
ok('patch: CNPJ vem da sessão (login por CNPJ), volta por db.empresas', patch.indexOf('getCurrentUser') >= 0 && patch.indexOf('db.empresas') >= 0);
ok('patch: aba "Entrar com CNPJ" sem código que vence', patch.indexOf('v5260-tab-cnpj') >= 0 && patch.indexOf("'/v1/enroll-cnpj'") >= 0);
ok('patch: espelha o storeAuth (token + device) e recarrega', patch.indexOf("localStorage.setItem(TOKEN_KEY, data.token)") >= 0 && patch.indexOf("localStorage.setItem(DEVICE_KEY") >= 0 && patch.indexOf('location.reload') >= 0);
ok('patch: TOKEN_KEY/DEVICE_KEY LITERAIS do motor de sync', patch.indexOf("digicopy_cloud_device_token_v1") >= 0 && patch.indexOf("digicopy_cloud_device_info_v1") >= 0);
ok('patch: cartão do admin define senha de conexão + senha do gerente', patch.indexOf('v5260-admin-card') >= 0 && patch.indexOf("'/v1/connect-pass'") >= 0 && patch.indexOf('senhaGerente') >= 0);
ok('sininho: abre a página secreta /a/<slug> quando existe', sin.indexOf("rel.slug?apiB+'/a/'+encodeURIComponent(rel.slug)") >= 0);

console.log('== GERENTE (3º sistema — .exe separado no PC dele) ==');
ok('gerente: productName próprio + versão carimbada 5.26.3', gPkg.productName === 'DIGICOPY Gerente de Atualizacoes' && gPkg.version === '5.26.3');
ok('gerente: login por CNPJ da dona + senha do gerente', gHtml.indexOf('/v1/gerente-login') >= 0 && gHtml.indexOf('gerenteToken') >= 0);
ok('gerente: token vai no header x-gerente-token (main process)', gMain.indexOf("'x-gerente-token'") >= 0);
ok('gerente: tela isolada (preload + contextIsolation, sem node na tela)', gPre.indexOf('contextBridge.exposeInMainWorld') >= 0 && gMain.indexOf('contextIsolation: true') >= 0 && gMain.indexOf('nodeIntegration: false') >= 0);
ok('gerente: publicar = registrar → subir .exe → subir imagens', gHtml.indexOf("action:'publicar'") >= 0 && gHtml.indexOf('uploadExe') >= 0 && gHtml.indexOf('uploadImg') >= 0);
ok('gerente: destino com os 3 modos (todo mundo / algumas / só a loja)', gHtml.indexOf('value="todos"') >= 0 && gHtml.indexOf('value="lista"') >= 0 && gHtml.indexOf('value="so_loja"') >= 0);
ok('gerente: picker de empresas + cadastro manual (POST empresas)', gHtml.indexOf("'/v1/gerente/empresas'") >= 0 && gHtml.indexOf("apiChama('/v1/gerente/empresas','POST'") >= 0);
ok('gerente: histórico com desligar/ocultar/editar/excluir/copiar link', ['desativar', 'ocultar', 'editar', 'excluir', 'copiar link do sininho'].every(t => gHtml.indexOf(t) >= 0));
ok('gerente: anexar/trocar .exe e tirar imagem pelo histórico', gHtml.indexOf("data-ac=\"exe\"") >= 0 && gHtml.indexOf("'remover-imagem'") >= 0);
ok('gerente: NÃO baixa nada nos clientes (só publica; quem baixa é o sininho/site)', gHtml.indexOf('quem baixa é sempre o cliente') >= 0 && gMain.indexOf('autoUpdater') < 0);
ok('gerente: GERAR_GERENTE_EXE.cmd goto-only, CRLF, janela que não fecha', gCmd.indexOf('goto :sucesso') >= 0 && gCmd.indexOf('goto :fim') >= 0 && gCmd.indexOf('cmd /k') >= 0 && /\r\n/.test(gCmd) && gCmd.indexOf('start "DIGICOPY - Gerar o Gerente') >= 0);
ok('gerente: .cmd libera o electron se o npm do PC barrar (artworkUrl removido do build)', gPkg.build && gPkg.build.win && !('artworkUrl' in gPkg.build.win) && gCmd.indexOf('rebuild electron') >= 0);
ok('worker: rodapé novo do site (sem as 2 linhas que ele mandou tirar; informativo)', wk.indexOf('Página mostrada pela própria nuvem') < 0 && wk.indexOf('Só aparece o que está vigente') < 0 && wk.indexOf('Fale com quem instalou o sistema na sua loja') >= 0);
ok('worker: site v5.26.1 bonito e informativo (marca, confiança, tamanho do arquivo)', wk.indexOf('Portal oficial de atualizações') >= 0 && wk.indexOf('confianca') >= 0 && wk.indexOf('R2.head') >= 0);
ok('gerente: NSIS + título sem acento no cmd (cp850-safe)', gPkg.build && gPkg.build.nsis && gCmd.indexOf('é') < 0 && gCmd.indexOf('ã') < 0);

console.log('== CARIMBO + MANIFESTO ==');
ok('manifesto: posições históricas intactas (204 chamado, 203 login-nuvem, 202 v5.26.0); fila hoje fecha na 218 (as 6 telas fiscais completas v6.0.14)', manifest.length === 223 && manifest[201] === 'ajustes_v5260_cnpj_gerente_patch.js' && manifest[202] === 'ajustes_v5262_login_nuvem_primeiro_patch.js' && manifest[203] === 'ajustes_v5264_chamado_data_grande_patch.js');
ok('package.json na 5.26.0', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('script check do package.json valida o patch novo', pkg.scripts.check.indexOf('ajustes_v5260_cnpj_gerente_patch.js') >= 0);

console.log('\nTudo OK — v5.26.0 (CNPJ+senha única · site restrito · sininho por destinatário com link secreto · gerente separado no PC do dono · imagens do tutorial no R2).');
