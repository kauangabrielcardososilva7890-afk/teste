// test_ajustes_v52427.js — v5.24.34: leva do pedido dele:
// P5 (cabeçalho 'Editar' não ordena mais), .cmd não fecha com tecla,
// excluir aparelho-lixo DE VEZ (bloqueado primeiro, nunca a si mesmo),
// MONITOR DE IMPRESSORAS fase 1 (SNMP no .exe) + HUB P8 no Parque.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const hs = fs.readFileSync('historico_sort_patch.js', 'utf8');
const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const cs = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const mj = fs.readFileSync('main.js', 'utf8');
const pl = fs.readFileSync('preload.js', 'utf8');
const mp = fs.readFileSync('ajustes_v52232_parque_monitor_hub_patch.js', 'utf8');

// P5
ok(/SKIP = \/pdf\|a\[cç\]\[aã\]o\|excluir\|editar\|sel\\b\|imprimir\|\^\$\/i/.test(hs), 'P5: cabeçalho "Editar" entra na lista de NÃO ordenar');

// .cmd: sem pause, janela aberta pro X
for (const f of ['atualizar_motor_nuvem.cmd', 'ver_gasto_nuvem.cmd']) {
  const c = fs.readFileSync(f, 'utf8');
  ok(!/[ \t]pause(\r|\n)/.test(c) && !/(\r|\n)pause(\r|\n)/.test(c), f + ': nenhum pause (tecla não fecha mais)');
  ok(c.includes('cmd /k'), f + ': fica aberta até clicar no X (copia a vontade)');
}

// Excluir aparelho DE VEZ
ok(wk.includes("url.pathname === '/v1/devices/delete-forever'"), 'worker: rota excluir-de-vez');
ok(wk.includes('CANNOT_DELETE_SELF'), 'worker: nunca apaga a si mesmo');
ok(wk.includes('CANNOT_DELETE_SELF') && !wk.includes('DEVICE_NOT_BLOCKED'), 'worker: exclui DIRETO qualquer aparelho, menos a si mesmo (supersede v52429: o freio virou 2 passos à toa a pedido dele)');
ok(cs.includes('dc-del-device') && cs.includes('Excluir de vez'), 'ui: botão Excluir de vez em QUALQUER aparelho (exceto o próprio)');
ok(cs.includes('Nenhum DADO de cliente/produto é apagado'), 'ui: confirmação explica que dados não somem');

// SNMP (pure)
const snmp = require('./snmp_printer.js');
ok(typeof snmp.montarGetV2c === 'function' && typeof snmp.lerStatusUmaVez === 'function', 'snmp: módulo exporta montagem e leitura');
const pkt = snmp.montarGetV2c('public', 7, snmp.OIDS_PADRAO);
ok(pkt[0] === 0x30 && pkt.length > 40 && pkt.length < 400, 'snmp: pacote Get válido (' + pkt.length + ' bytes)');
const errosTeste = snmp.traduzirErros(Buffer.from([0x58]));
ok(errosTeste.includes('SEM PAPEL') && errosTeste.includes('SEM TONER') && errosTeste.includes('Tampa aberta'), 'snmp: bits de erro viram bom português');
ok(!snmp.traduzirErros(Buffer.from([0])).length, 'snmp: impressora sem erro = lista vazia');

// Pontes do monitor
ok(mj.includes("ipcMain.handle('prt:snmp-status'"), 'main: IPC prt:snmp-status');
ok(mj.includes('registerPrinterMonitorIPC();'), 'main: registro do IPC de fato acontece');
ok(mj.includes('\\d{1,3}(\\.\\d{1,3}){3}'), 'main: IP validado no IPC (sem prompt injection)');
ok(pl.includes('prtAPI:') && pl.includes('prt:snmp-status'), 'preload: ponte prtAPI');

// UI Parque (monitor + hub P8)
ok(mp.includes('hub-impressora-modal'), 'hub: modal próprio (own DOM)');
ok(mp.includes('status-mon-'), 'monitor: selo de status por impressora');
ok(mp.includes('eq.ip') && mp.includes('saveDB'), 'monitor: IP perguntado 1x e gravado no cadastro (sincroniza com o registro)');
ok(mp.includes('Desligada ou IP diferente') && mp.includes('Em dia') && mp.includes('⚠'), 'monitor: estados claros (offline / em dia / alerta)');
ok(mp.includes('hub-contrato') && mp.includes('openContratoCompleto'), 'hub: botão pula pro contrato atual');
ok(mp.includes('PARQUE_MONITOR_V52427'), 'monitor/hub: exportação pure');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('hub-impressora-modal') && bundle.includes('PARQUE_MONITOR_V52427'), 'bundle: monitor+hub dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('hub-impressora-modal'), 'bundle do CELULAR igual');
ok(JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8')).includes('ajustes_v52232_parque_monitor_hub_patch.js'), 'manifest: novo patch registrado');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '6.0.11'"), 'index 6.0.9');
ok(fs.readFileSync('index.html', 'utf8').includes('>v6.0.11<'), 'rodapé v6.0.9');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (P5 + .cmd sem fechar + excluir lixo + monitor SNMP + hub P8).');
