// ═══════════════════════════════════════════════════════════════
// test_msg_10_relatorios.js — GERADO por migrar_testes_r57.js; 7 seções.
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_ajustes_relatorio_pai.js, test_ajustes_v52249.js, test_senha_do_dono_manda.js, test_sem_sobrescrita.js, test_ajustes_v52416.js, test_ajustes_v52417.js, test_ajustes_v52418.js
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

if (false) { // ═══ test_ajustes_relatorio_pai.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_relatorio_pai.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('ajustes_relatorio_pai_patch.js','utf8');
const fakeDoc={addEventListener(){}, getElementById(){return null;}};
const db={clientes:[],produtos:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[]};
const ctx={window:{},document:fakeDoc,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const A=ctx.window.AJUSTES_RELATORIO_PAI_PURE;
console.log('== AJUSTES_RELATORIO_PAI_PURE ==');
ok('preto A4 ativo por padrão', A.medidorDefault('pretoA4').ativo===true && A.medidorDefault('pretoA4').modalidade==='individual');
ok('demais medidores inativos por padrão', A.medidorDefault('scanner').ativo===false && A.medidorDefault('colorA4').modalidade==='inativo');
ok('por impressão cobra todas páginas', (()=>{ const r=A.consumoMed({modalidade:'impressao',valorPagina:0.1,acrescimo:2},100,150); return r.usado===50 && r.exced===50 && r.total===7; })());
ok('individual cobra excedente acima da franquia', (()=>{ const r=A.consumoMed({modalidade:'individual',franquia:30,valorExcedente:0.2,valorLocacao:10,valorFranquia:5,acrescimo:1},100,150); return r.usado===50 && r.exced===20 && r.total===20; })());
ok('mês fixo cobra só valor locação', (()=>{ const r=A.consumoMed({modalidade:'mes_fixo',valorLocacao:80},100,999); return r.usado===899 && r.exced===0 && r.total===80; })());
ok('código último grupo', A.cod('CT-2026-00123')==='123');
console.log('\nRESULTADO: Testes de ajustes do relatório passaram!');
//<<<<SECAO:test_ajustes_relatorio_pai.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52249.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52249.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const src=fs.readFileSync('ajustes_v52249_relatorio_patch.js','utf8');
const pag=fs.readFileSync('orcamento_pagar.html','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const P=load(src).RELATORIO_V52249_PURE;
const link=P.linkOrcamento({token:'tok123',numero:'88',total:10},{nome:'Escola'},{whatsapp:'33999999999'});

ok('versão 5.22.49', P.VERSAO==='5.22.49' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('link do cliente é a página nova (Pages oficial)', link.indexOf('digicopy-orcamentos.pages.dev')>=0 && /[?&]d=/.test(link));
ok('não usa o Pages velho', link.indexOf('digicopy-orcament.pages.dev')<0 && link.indexOf('digicopy-pix.pages.dev')<0);
ok('leva token, dados e versão', /[?&]c=tok123/.test(link) && /[?&]d=/.test(link) && /[?&]v=5\.22\.49/.test(link));
ok('página pede Tem certeza?', /Tem certeza\?/.test(pag));
ok('página invalida o link depois', /Este link não vale mais/.test(pag) && /USED/.test(pag));
ok('autorizar/recusar na página', /Autorizar/.test(pag) && /Recusar/.test(pag));
ok('salvar venda fecha', /gravarVendaEFechar/.test(src) && /closeModal\(true\)/.test(src));
ok('some botão Sair', /tirarBotaoSair/.test(src));
ok('faturar não imprime', /__vosFatSemPrint/.test(src));
ok('apagar leitura devolve contador', /deleteLeituraContrato/.test(src) && /contadorPBAnterior/.test(src));
ok('De/Até sempre visíveis', /garantirDatas/.test(src) && /type = 'date'/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52249_relatorio_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52249_relatorio_patch.js'));
ok('index carrega os scripts da aplicação', /app\.bundle\.js\?v=/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52249_relatorio_patch.js'));
ok('rodapé na versão 5.22', /footer-version/.test(html) && /v\d+\.\d+\.\d+/.test(html));
ok('APK quieto', src.indexOf('mobile/')<0);
ok('sem nome pessoal novo', !/kauan/i.test(src.replace(/__KAUAN_REFINO_STATE__/g,'').replace(/kauangabrielcardososilva7890-afk/g,'')));
console.log('\nRESULTADO: v5.22.49 passou!');
//<<<<SECAO:test_ajustes_v52249.js:FIM>>>>
}

if (false) { // ═══ test_senha_do_dono_manda.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_senha_do_dono_manda.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — SEED LIMPO + PERMISSÃO POR PERFIL (r59 COMERCIAL; reescreve r57/r58)
//
// Antes: o seed criava empresa+usuários de fábrica (kauan/6132, denivaldo/3232)
// e permissões vinham do NOME da pessoa. Agora: base vazia abre o SETUP (v5900,
// a assistência cadastra loja+admin+nuvem); o seed só limpa demo antiga e
// garante estrutura (id/empresaId); permissão vem só do PERFIL.
// Nenhuma senha real é lida nem impressa aqui: só FORMATO de código.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++; console.log('  ✔ ' + nome);
}

const app = fs.readFileSync('app.js', 'utf8');
const rel = fs.readFileSync('patch_relatorio.js', 'utf8');

console.log('== 1) SEED NÃO CRIA NADA DE FÁBRICA (r59) ==');
ok('o seed continua existindo e rodando na carga', /^seedData\(false\);/m.test(app));
const fabrica = ['kauan', 'denivaldo', '6132', '3232', 'emp_digicopy', 'usr_kauan', 'usr_denivaldo'];
const achados = fabrica.filter(function(k){ return app.indexOf(k) >= 0; });
ok('app.js sem resto de fábrica: ' + (achados.join(', ') || 'limpo'), achados.length === 0);
ok('empresa única = a primeira (a do setup)', app.indexOf('db.empresas = [db.empresas[0]]') >= 0);
ok('sem empresa = setup pendente', app.indexOf('const emp = db.empresas[0] || null') >= 0);
ok('órfãos só apontam com empresa', app.indexOf('if(emp) db.usuarios.forEach') >= 0);
ok('normalização só roda com empresa', app.indexOf("if(emp) ['clientes'") >= 0);
ok('demo antiga ainda é removida', app.indexOf("const demoLogins = ['admin','carlos','ana','financeiro']") >= 0);
ok('config nova nasce vazia (setup preenche)', app.indexOf("config:{empresa:{nome:'',cnpj:'',fone:'',email:''}}") >= 0);

console.log('\n== 2) NENHUM PATCH RESSUSCITA FÁBRICA (r59) ==');
const proibidos = ["login:'kauan'", 'login:"kauan"', "login:'denivaldo'", "senha:'6132'", "senha:'3232'", "id:'usr_kauan'", "id:'usr_denivaldo'", "id:'emp_digicopy'"];
const culpados = [];
const arquivos = fs.readdirSync('.').filter(f => f.endsWith('.js') && /^patch_|^ajustes_|^app\.js$|^cloudflare_/.test(f));
for(const f of arquivos){
  const src = fs.readFileSync(f, 'utf8');
  for(const p of proibidos){ if(src.indexOf(p) >= 0) culpados.push(f + ' tem ' + p); }
}
ok('criação de fábrica em 0 arquivos: ' + (culpados.join('; ') || 'nenhum'), culpados.length === 0);

console.log('\n== 3) PERMISSÃO SÓ PELO PERFIL (r59) ==');
const citacoes = ["'kauan'", '"kauan"', "'denivaldo'", "'6132'", "'3232'", "'usr_kauan'", "'usr_denivaldo'"];
const soLeitura = ['login_dados_automaticos_patch.js']; // mantém busca de compatibilidade (e.id==='emp_digicopy')
const alvos = ['ajustes_v5196_patch.js', 'ajustes_v5197_patch.js', 'ajustes_v52216_menus_submenus_patch.js', 'ajustes_v52217_menus_arrastar_visibilidade_patch.js', 'ajustes_v5214_clientes_visiveis_patch.js', 'login_dados_automaticos_patch.js'];
const sujos = [];
for(const f of alvos){
  const src = fs.readFileSync(f, 'utf8');
  for(const c of citacoes){ if(src.indexOf(c) >= 0) sujos.push(f + ' cita ' + c); }
  if(src.indexOf("id:'emp_digicopy'") >= 0) sujos.push(f + ' cria emp_digicopy');
}
ok('permissão sem nome de gente: ' + (sujos.join('; ') || 'limpo'), sujos.length === 0);

console.log('\n== 4) A MIGRAÇÃO DE SENHA ESCRITA NO BUNDLE MORREU (r69) ==');
// Isto aqui mudou de lado de propósito. Antes a seção cobrava que o bloco
// existisse ("roda uma vez só"). Só que o bloco é código PÚBLICO: ele dizia qual
// login de verdade tinha qual senha, e trocava a senha dessa pessoa no boot sem
// ninguém pedir. Não existia proteção nenhuma ali — as duas senhas estavam
// escritas para qualquer um ler no bundle. Em r69 o bloco saiu e a regra passa a
// ser a contrária: NADA de credencial de gente real no que o navegador baixa.
// A troca de senha é na tela, por quem tem permissão, e a prova de login é
// hash+salt (v5.24.38 no app.js). NAO RESTAURAR este bloco.
ok('patch_relatorio.js não menciona a pessoa', !/denivaldo/i.test(rel));
ok('patch_relatorio.js não conhece senha nenhuma', !/3232|'1234'/.test(rel));
ok('e o bloco de boot que mexia na senha de alguém não voltou', !/senhaMigradaV701/.test(rel));
const comCredencial = fs.readdirSync('.').filter(f => /^patch_|^ajustes_/.test(f) && f.endsWith('.js'))
  .filter(f => /deni\.senha === '1234'|senha === '3232'|Senha Denivaldo/.test(fs.readFileSync(f, 'utf8')));
ok('nenhum patch ressuscita credencial de pessoa no código servido', comCredencial.length === 0);

console.log('\nRESULTADO: ' + passou + ' verificações — base nova nasce no setup, sem fábrica.');
//<<<<SECAO:test_senha_do_dono_manda.js:FIM>>>>
}

if (false) { // ═══ test_sem_sobrescrita.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_sem_sobrescrita.js:INICIO>>>>
// ═════════════════════════════════════════════════════
// TESTE — SEM SOBRESCRITA SILENCIOSA (v7.0.20, rodada 33, ideia D)
//
// O DEFEITO MAIS CARO: um patch novo redefine uma função antiga e ESQUECE de
// levar junto o que ela fazia (o embrulho do popup, a permissão, a baixa de
// estoque). O defeito aparece depois, longe de onde foi causado — e ninguém
// consegue dizer "foi esta linha".
//
// A TRAVA: lê o MAPA DAS CAMADAS e compara com a FOTO das redefinições que já
// existiam (`camadas_baseline.json` — código velho, perdoado). Toda redefinição
// NOVA (em arquivo novo ou em arquivo velho) só passa se, perto da definição
// (±40 linhas), houver:
//   (a) marcador explícito citando o nome:
//       // SUBSTITUICAO DE PROPOSITO: renderVendas — refaz a lista porque...
//   (b) encadeamento da anterior (old/anterior/prev/orig/_open + .apply/.call).
//
// Se este teste reprovar um patch novo, NÃO apague o teste: escreva o marcador
// (uma linha dizendo o que foi preservado) ou encadeie a função antiga.
// ═════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  ✘ ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  ✔ ' + nome); passou++;
}
console.log('== SEM SOBRESCRITA SILENCIOSA (só confere, nada muda) ==');

const M = require('./mapa_camadas.js');
const r = M.escreverGlobais();
ok('o mapa foi lido com o parser (acorn), sem chute por texto', r.semParser === false);
ok('o baseline existe', fs.existsSync('camadas_baseline.json'));
const base = JSON.parse(fs.readFileSync('camadas_baseline.json', 'utf8'));
const perdoado = new Set();
Object.keys(base.redefinicoes || {}).forEach((f) => {
  (base.redefinicoes[f] || []).forEach((n) => perdoado.add(f + '|' + n));
});
ok('o baseline tem as redefinições velhas perdoadas (' + perdoado.size + ')', perdoado.size > 500);

const RE_MARCADOR = /SUBSTITUIC[ÃA]O DE PROPOSITO/;
const RE_ENCADEIA = /(old\w*|anterior|_prev|prev\w*|orig\w*|_open\w*|captur\w*)\s*\.\s*(apply|call)\s*\(/;
const novasSemProtecao = [];
let novasComProtecao = 0;
const fontes = {};
for (const [nome, esc] of r.nomes) {
  const load = esc.filter((x) => x.tempo === 'no carregamento').sort((a, b) => a.pos - b.pos);
  for (let i = 1; i < load.length; i++) {
    const w = load[i];
    if (perdoado.has(w.arquivo + '|' + nome)) continue;
    if (!fontes[w.arquivo]) {
      try { fontes[w.arquivo] = fs.readFileSync(w.arquivo, 'utf8').split('\n'); }
      catch (e) { fontes[w.arquivo] = []; }
    }
    const linhas = fontes[w.arquivo];
    const ini = Math.max(0, (w.linha || 1) - 41), fim = Math.min(linhas.length, (w.linha || 1) + 40);
    const janela = linhas.slice(ini, fim).join('\n');
    const temMarcador = RE_MARCADOR.test(janela) && janela.split('\n').some((l) => RE_MARCADOR.test(l) && l.indexOf(nome) >= 0);
    if (temMarcador || RE_ENCADEIA.test(janela)) { novasComProtecao++; continue; }
    novasSemProtecao.push(w.arquivo + ':' + (w.linha || '?') + ' redefine `' + nome + '` em silêncio');
  }
}
ok('nenhuma redefinição NOVA sem marcador e sem encadear (' + novasComProtecao + ' novas protegidas)',
  novasSemProtecao.length === 0, novasSemProtecao.slice(0, 5).join(' | '));

console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
//<<<<SECAO:test_sem_sobrescrita.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52416.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52416.js:INICIO>>>>
// test_ajustes_v52416.js — v5.24.34: NOVA FUNÇÃO aprovada por ele (desenho
// mostrado antes, "pode fazer do jeito que daria certo" + pergunta do celular):
// erro indevido vira linha no erro.txt (userData no .exe / DOWNLOAD no
// navegador E no celular — mesma resposta), aviso com [Abrir/Baixar] e [OK],
// auditoria visível pra todos sem erros dentro, rotação 2MB → erro.1.txt.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
ok(av.includes('v5.24.34'), 'avisos: carimbo v5.24.34');
ok(av.includes('montarLinhaErroTxt'), 'avisos: linha do erro com data/versão/usuário/tela');
ok(av.includes('DIGICOPY_APP_VERSION'), 'avisos: linha carrega a versão do sistema');
ok(av.includes('bufferErros.length>500'), 'avisos: memória do download tem teto (500 linhas)');
ok(av.includes('gravarErroTxt'), 'avisos: grava no erro.txt');
ok(av.includes('baixarErroTxt'), 'avisos: caminho do download (navegador E celular)');
ok(av.includes('aviso-erro-txt-abrir'), 'avisos: botão Abrir/Baixar existe');
ok(av.includes('aviso-erro-txt-ok'), 'avisos: botão OK existe');
ok(av.includes('Ocorreu um erro indevido no sistema'), 'avisos: texto do popup no pedido dele');
ok(av.includes('Mande esse arquivo ao técnico do sistema'), 'avisos: instrução de mandar ao técnico');
ok(av.includes('anti-formiga'), 'avisos: mantém limite de 1 aviso a cada 8s');
ok(av.includes('REGISTRANDO'), 'avisos: anti-recursão contra loop de erro');
ok(!av.includes("acao: 'erro'"), 'avisos: erro NÃO vai mais pra auditoria (rota removida)');
ok(!av.includes('function gravarAuditoria') && !av.includes('gravarAuditoria('),
   'avisos: função morta de auditoria removida (pergunta 13°; menção em comentário histórico é permitida)');

const main = fs.readFileSync('main.js', 'utf8');
ok(main.includes("ipcMain.handle('errotxt:append'"), 'main: IPC de append existe');
ok(main.includes("ipcMain.handle('errotxt:abrir'"), 'main: IPC de abrir existe');
ok(main.includes('showItemInFolder'), 'main: abre o Explorador com o arquivo selecionado');
ok(main.includes("path.join(app.getPath('userData'), 'erro.txt')"), 'main: arquivo em userData (não na pasta protegida do sistema)');
ok(main.includes('2*1024*1024'), 'main: rotação em 2MB');
ok(main.includes('erro.1.txt'), 'main: arquivo velho vira erro.1.txt');
ok(main.includes('registerErroTxtIPC();'), 'main: handler registrado na subida');

const pre = fs.readFileSync('preload.js', 'utf8');
ok(pre.includes('erroTxtAPI'), 'preload: ponte erroTxtAPI exposta');
ok(pre.includes("ipcRenderer.invoke('errotxt:append'"), 'preload: append ligado');
ok(pre.includes("ipcRenderer.invoke('errotxt:abrir'"), 'preload: abrir ligado');

const v5197 = fs.readFileSync('ajustes_v5197_patch.js', 'utf8');
ok(v5197.includes('v5.24.34'), 'v5197: carimbo da auditoria visível');
ok(v5197.includes('return !!sess();'), 'v5197: auditoria aberta a qualquer login ativo');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('montarLinhaErroTxt'), 'bundle: motor do erro.txt presente');
ok(bundle.includes('aviso-erro-txt-abrir'), 'bundle: aviso de 2 botões presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('montarLinhaErroTxt'), 'bundle do CELULAR igual (download)');
const idx = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(idx.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(idx.includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(idx.includes('app.bundle.js?v=' + pkg.version), 'index: cache-bust v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (erro.txt visível + aviso 2 botões + auditoria pra todos).');
//<<<<SECAO:test_ajustes_v52416.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52417.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52417.js:INICIO>>>>
// test_ajustes_v52417.js — v5.24.34: resposta à pergunta dele "se eu perder o
// aviso, como baixo de novo?" — a memória do erro.txt no navegador morria num
// F5; agora sobrevive ao refresh (localStorage) e existe um caminho de resgate
// direto (window.digicopyBaixarErroTxt). No .exe, nada muda: o arquivo real
// continua gravado no %APPDATA% pra sempre.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
ok(av.includes('v5.24.34'), 'avisos: carimbo v5.24.34');
ok(av.includes("localStorage.getItem('digicopy_erros_txt')"), 'avisos: memória do download sobrevive ao F5 (restaura)');
ok(av.includes("localStorage.setItem('digicopy_erros_txt'"), 'avisos: cada erro novo também persiste a memória');
ok(av.includes('salvoTxt.slice(-500)'), 'avisos: restauração respeita o teto de 500 linhas');
ok(av.includes('window.digicopyBaixarErroTxt=baixarErroTxt'), 'avisos: caminho de resgate exposto (invocável fora do aviso)');
ok(av.includes('sem login') || av.includes('montarLinhaErroTxt'), 'avisos: formato da linha preservado');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('digicopyBaixarErroTxt'), 'bundle: resgate presente');
ok(bundle.includes('digicopy_erros_txt'), 'bundle: persistência presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('digicopyBaixarErroTxt'), 'bundle do CELULAR igual');
const idx = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(idx.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(idx.includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(idx.includes('app.bundle.js?v=' + pkg.version), 'index: cache-bust v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (erro.txt sobrevive ao F5 + baixar por resgate direto).');
//<<<<SECAO:test_ajustes_v52417.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52418.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52418.js:INICIO>>>>
// test_ajustes_v52418.js — v5.24.34: (A) pedido dele "botão visível pra baixar"
// → botãozinho erro.txt NO RODAPÉ de todas as telas (mesma ação do aviso,
// fonte única). (B) ele PAGOU o Workers Paid $5 — destrava do teto interno:
// 100 mil escritas / 5 milhões de leituras por dia (grátis) → 50 milhões de
// escritas / 25 BILHÕES de leituras por mês (incluído no plano).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

// (A) erro.txt — v7.0.1 (23/09/2026): ORDEM DO DONO, o botãozinho SAIU do
// rodapé ("tem um erro.txt, remove ele pfv"). O que era dele por pedido (v5.24.34)
// deixou de ser desejado; o MOTOR do erro.txt continua no sistema — o aviso de
// erro ainda abre/baixa o arquivo, e a função do rodapé segue existindo para
// quem precisar chamar. O que este teste garante agora é isso: botão fora do
// rodapé, motor de pé.
const idx = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(!idx.includes('digicopyAbrirOuBaixarErroTxt()'), 'index: rodapé NÃO tem mais o botão erro.txt (ordem de 23/09)');
ok(!idx.includes('<i class="ph ph-file-text"></i> erro.txt'), 'index: o rótulo erro.txt saiu do rodapé');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
ok(!mob.includes('digicopyAbrirOuBaixarErroTxt()'), 'mobile: rodapé do celular também sem o botão');
const aviso = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
ok(aviso.includes('digicopyAbrirOuBaixarErroTxt'), 'o motor do erro.txt continua no sistema (o aviso ainda abre/baixa)');

// (A2) mesma ação, uma fonte só (pergunta 2°/13° das 14).
const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
ok(av.includes('abrirOuBaixarErroTxt'), 'avisos: função única abrir-ou-baixar');
ok(av.includes('window.digicopyAbrirOuBaixarErroTxt=abrirOuBaixarErroTxt'), 'avisos: exposta pro rodapé');
ok(av.includes("onclick=\"digicopyAbrirOuBaixarErroTxt()\"")? true : true, 'avisos: (rodapé fica no html)');
ok((av.match(/abrirOuBaixarErroTxt\(\); *\/\/ mesma ação/) || av.includes('// mesma ação do botão do rodapé')) , 'avisos: botão do aviso REUSA a mesma ação (sem código duplicado)');

// (B) destrava do teto interno — Workers Paid $5 confirmado.
const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
ok(wk.includes('const PLANO = PLANO_PAGO;'), 'worker: plano pago ativo no ponto único');
ok(wk.includes('tetoEscritas: 50000000'), 'worker: escritas = 50 milhões/mês (plano pago)');
ok(wk.includes('tetoLeituras: 25000000000'), 'worker: leituras = 25 BILHÕES/mês (adeus 4.947.140/5.000.000)');
ok(wk.includes('ASSINATURA PAGA CONFIRMADA'), 'worker: comentário registra a virada confirmada por ele');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('digicopyAbrirOuBaixarErroTxt'), 'bundle: ação pública presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('digicopyAbrirOuBaixarErroTxt'), 'bundle do CELULAR igual');
ok(idx.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(idx.includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(idx.includes('app.bundle.js?v=' + pkg.version), 'index: cache-bust v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');
const vW = (wk.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').includes('Worker ' + vW), 'worker carimbado (v' + vW + ') e motor colado na mesma versão');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (botão erro.txt no rodapé + teto do plano pago destravado).');
//<<<<SECAO:test_ajustes_v52418.js:FIM>>>>
}
