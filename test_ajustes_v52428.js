// test_ajustes_v52428.js — v5.24.31: pedido dele (item 4 da foto-rodada):
// O PORTAL DE ATUALIZAÇÕES vira dele e só dele — anexa o .exe do próprio PC,
// notas + tutorial opcional, histórico completo SÓ NO SISTEMA (o site fora
// mostra só o que tá vivo), reativar por tempo (1d/7d/∞) ou desligar, editar,
// ocultar, excluir. Sininho leva pro site; site mostra tutorial ANTES do botão.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
const wj = fs.readFileSync('cloudflare-worker/wrangler.jsonc', 'utf8');

// R2 ligado no motor
ok(wj.includes('"r2_buckets"') && wj.includes('"binding": "R2"') && wj.includes('digicopy-downloads'), 'wrangler: bucket R2 digicopy-downloads declarado');

// Nuvem: modelo do portal
ok(wk.includes('ALTER TABLE app_releases ADD COLUMN ativa'), 'worker: coluna ativa (liga/desliga o link)');
ok(wk.includes('ALTER TABLE app_releases ADD COLUMN oculta') && wk.includes('ALTER TABLE app_releases ADD COLUMN tutorial') && wk.includes('ALTER TABLE app_releases ADD COLUMN expira_em') && wk.includes('ALTER TABLE app_releases ADD COLUMN tem_arquivo'), 'worker: ocultar, tutorial, expiração e marca de .exe');
ok(wk.includes('publicacaoViva(env)'), 'worker: noção de publicação VIVA (ativa + visível + não vencida)');
ok(wk.includes("acao === 'desativar'") && wk.includes("acao === 'ativar'") && wk.includes("acao === 'ocultar'") && wk.includes("acao === 'editar'") && wk.includes("acao === 'excluir'"), 'worker: ações do gerente (ativar/desativar/ocultar/editar/excluir)');
ok(wk.includes('const adminUser = await requireAdmin(request, env);'), 'worker: gerente só de admin (portal é SÓ dele)');
ok(wk.includes("url.pathname === '/v1/release-file'"), 'worker: rota de subir o .exe');
ok(wk.includes("url.pathname.startsWith('/dl/')"), 'worker: rota /dl/<versao>.exe entrega o arquivo');
ok(wk.includes('content-disposition\': \'attachment'), 'worker: download vem como ANEXO .exe (nome digicopy-<v>.exe)');
ok(wk.includes('ARQUIVO_GRANDE') && wk.includes('150 * 1024 * 1024'), 'worker: teto 150MB com rota de fuga explicada');
ok(wk.includes('DESLIGADA do site pelo administrador') && wk.includes('410'), 'worker: versão desligada = link morto honrado (410)');

// Site público: SÓ o vivo + tutorial antes do botão
ok(wk.includes("WHERE ativa = 1 AND oculta = 0 AND (expira_em = 0 OR expira_em > ?)"), 'site: só mostra o que está vivo');
ok(wk.includes('Como baixar e instalar (passo a passo)'), 'site: tutorial renderiza antes do botão');
ok(wk.includes('Baixar a atualização (.exe)') && wk.includes('#16a34a'), 'site: botão verde de baixar');
ok(!wk.includes('selo-novo">versão atual'), 'site: histórico antigo NÃO aparece mais no público');

// Portal no app
ok(av.includes('pub-upd-tutorial') && av.includes('pub-upd-expira') && av.includes('pub-upd-file'), 'app: campos tutorial + tempo + .exe');
ok(av.includes("action:'publicar'"), 'app: publicar com ação explícita');
ok(av.includes('statusChips') && av.includes('temArquivo') && av.includes('.exe anexado'), 'app: chips de status (no ar/desligada/venceu + .exe)');
ok(av.includes('data-ac="ativar"') && av.includes('data-ac="desativar"') && av.includes('data-ac="excluir"') && av.includes('data-ac="editar"') && av.includes("r.oculta?'mostrar':'ocultar'"), 'app: botões por publicação (todas as ações dele)');
ok(av.includes('/v1/release-file?versao=') && av.includes("application/octet-stream"), 'app: upload do .exe cru');
ok(av.includes("api('/v1/app-releases',{method:'GET'}"), 'app: histórico vem da nuvem');
ok(av.includes("'/atualizacoes'"), 'app + sininho: botão leva pro SITE (tutorial antes)');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('pub-upd-tutorial') && bundle.includes('/v1/release-file?'), 'bundle: portal do gerente dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('pub-upd-tutorial'), 'bundle do CELULAR igual');
ok(fs.readFileSync('GERAR_EXE.cmd','latin1').includes('call npm install') && fs.readFileSync('GERAR_EXE.cmd','latin1').includes('call npm run build:win') && fs.readFileSync('GERAR_EXE.cmd','latin1').includes('explorer'), 'GERAR_EXE.cmd v2: npm install primeiro + tecla qualquer abre DIST (pedido condicionado dele: EXCEÇÃO liberada ao pause nele)');
for (const cmd of ['GERAR_EXE.cmd','atualizar_motor_nuvem.cmd','ver_gasto_nuvem.cmd']) ok(fs.readFileSync(cmd,'latin1').includes('\r\n'), cmd + ': CRLF (bug achado: LF puro faz o .cmd engasgar/fechar no Windows)');

ok(wk.includes('DigiCopy Downloads') && wk.includes('@keyframes brilho') && wk.includes('passo-card'), 'site v5.24.31: só o nome do site + animações + faixa 1-2-3 explicativa');

ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '5.24.31'"), 'index 5.24.31');
ok(fs.readFileSync('index.html', 'utf8').includes('>v5.24.31<'), 'rodapé v5.24.31');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.31 (portal de atualizações só dele + arquivo no R2 + site vivo).');
