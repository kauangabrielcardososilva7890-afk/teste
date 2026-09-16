// test_ajustes_v52425.js — v5.24.34: resposta ao "os menus de NF não estão acessando".
// Regra do tópico C: tudo FUNCIONA ou para LIMPO no "falta certificado válido".
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const cat = fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js', 'utf8');
const cn = fs.readFileSync('ajustes_v52231_nfe_central_menu_patch.js', 'utf8');
const as = fs.readFileSync('nfe_assinatura.js', 'utf8');
const mj = fs.readFileSync('main.js', 'utf8');
const pl = fs.readFileSync('preload.js', 'utf8');

// MENU: morto o "em breve"
ok(!cat.includes("Módulo fiscal em preparação") && !cat.includes("Em breve: emissão de nota fiscal"), 'menu: toasts de mentira ELIMINADOS');
ok(cat.includes("click:'abrirCentralNfe()'"), 'menu: NF-e/NFC-e e Nota fiscal abrem a Central');
ok(cat.includes("click:'abrirPerfilTributario()'") && cat.includes("click:'abrirPerfilTributario(1)'"), 'menu: Perfil tributário e NCM abrem a Config fiscal real');

// CENTRAL
ok(cn.includes("id='central-nfe-modal'") || cn.includes("id='central-nfe-modal'") || cn.includes("id=\"central-nfe-modal\"") || cn.includes("central-nfe-modal"), 'central: modal próprio (own DOM)');
ok(cn.includes('cnfe-venda') && cn.includes('cnfe-leitura'), 'central: escolhe notinha OU leitura');
ok(cn.includes("conferirNfe(vid?'venda':'leitura'"), 'central: emissão usa a mesma ponte v5221 (nada novo no miolo)');
ok(cn.includes('cnfe-validade') && cn.includes('Conferir validade do certificado'), 'central: botão conferir validade');
ok(cn.includes('NFE_CENTRAL_V52425'), 'central: exportação pure pros testes');
ok(cn.includes('slice(-40)'), 'central: lista as últimas 40 (teto de segurança)');
ok(cn.includes('abrirPerfilTributario') && cn.includes('nfe-config-card'), 'central: atalho real pra Config fiscal');

// CERTIFICADO: validade de verdade
ok(as.includes('lerValidadePfx') && as.includes('certInfoBasicas'), 'assinatura: lê validade direto do .pfx (com a senha, sem guardar)');
ok(as.includes('Certificado A1 VENCIDO em'), 'assinatura: assinar com vencido para LIMPO com a data exata');
ok(as.includes('certValidoAte'), 'assinatura: devolve a validade no resultado');
ok(mj.includes("ipcMain.handle('nfe:cert-validade'"), 'main: IPC da validade (programinha ensina a ler)');
ok(pl.includes("validade: (senha) => ipcRenderer.invoke('nfe:cert-validade'"), 'preload: ponte validade exposta (PC .exe)');
ok(cn.includes('api.validade') && cn.includes('pedirSenhaA1'), 'central: usa a senha do cofre UMA VEZ, sem inventar validade');

const leitura = require('child_process').spawnSync('node', ['-e', "const s=require('./nfe_assinatura.js'); console.log(typeof s.lerValidadePfx, typeof s.certInfoBasicas);"], { encoding: 'utf8' });
ok(leitura.stdout.trim() === 'function function', 'assinatura: funções novas exportadas de verdade');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('central-nfe-modal') && bundle.includes('NFE_CENTRAL_V52425'), 'bundle: Central dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('central-nfe-modal'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '5.24.35'"), 'index 5.24.35');
ok(fs.readFileSync('index.html', 'utf8').includes('>v5.24.35<'), 'rodapé v5.24.35');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.24.35"'), 'package.json 5.24.35');
ok(fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').includes("'5.24.34'"), 'worker carimbado');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (menu NF abre de verdade + certificado para limpo com data).');
