// test_ajustes_v52416.js — v5.24.27: NOVA FUNÇÃO aprovada por ele (desenho
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
ok(av.includes('v5.24.27'), 'avisos: carimbo v5.24.27');
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
ok(v5197.includes('v5.24.27'), 'v5197: carimbo da auditoria visível');
ok(v5197.includes('return !!sess();'), 'v5197: auditoria aberta a qualquer login ativo');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('montarLinhaErroTxt'), 'bundle: motor do erro.txt presente');
ok(bundle.includes('aviso-erro-txt-abrir'), 'bundle: aviso de 2 botões presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('montarLinhaErroTxt'), 'bundle do CELULAR igual (download)');
const idx = fs.readFileSync('index.html', 'utf8');
ok(idx.includes("DIGICOPY_APP_VERSION = '5.24.27'"), 'index: versão 5.24.27');
ok(idx.includes('>v5.24.27<'), 'index: rodapé 5.24.27');
ok(idx.includes('app.bundle.js?v=5.24.27'), 'index: cache-bust 5.24.27');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.24.27"'), 'package.json 5.24.27');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.27 (erro.txt visível + aviso 2 botões + auditoria pra todos).');
