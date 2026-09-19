// test_ajustes_v52426.js — v5.24.34: pedido dele "faz logo" (sprint NF): a
// Central ganha HISTÓRICO permanente das notas assinadas neste PC (número,
// cliente, data, chave + copiar chave). Local de propósito: a emissão só roda
// no PC que tem o A1, então a lista mora ali mesmo, sem custar nuvem.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const cn = fs.readFileSync('ajustes_v52231_nfe_central_menu_patch.js', 'utf8');
const as = fs.readFileSync('ajustes_v5228_nfe_assinatura_patch.js', 'utf8');

// REGISTRO disparado no SUCESSO da assinatura (nunca antes, nunca no erro)
ok(as.includes("typeof window.registrarNfeEmitida==='function'"), 'assinatura: chama o registrador no sucesso');
ok(as.indexOf('registrarNfeEmitida') > as.indexOf('mostrarXmlAssinado(r.xmlAssinado'), 'assinatura: registro vem DEPOIS do XML assinado (prova de que saiu)');

// HISTÓRICO
ok(cn.includes("digicopy_nfe_historico"), 'histórico: chave local própria');
ok(cn.includes('registrarNfeEmitida=registrarNfeEmitida') && cn.includes('window.registrarNfeEmitida'), 'histórico: registrador global (o v5228 alcança)');
ok(cn.includes('lista.unshift({') && cn.includes('numero:') && cn.includes('chave:') && cn.includes('cliente:'), 'histórico: guarda número, chave e cliente');
ok(cn.includes('slice(0,200)'), 'histórico: teto de 200 (nunca vira elefante)');
ok(cn.includes('cnfe-historico'), 'central: quadro Histórico das notas assinadas');
ok(cn.includes('Nenhuma nota assinada neste PC ainda'), 'histórico: estado vazio honesto');
ok(cn.includes('copiar'  === 'copiar' && 'data-cnfecopi'), 'histórico: botão copiar chave');
ok(cn.includes('slice(0,8)'), 'histórico: mostra últimas 8 (teto de tela)');
ok(cn.includes('histórico é melhoria, nunca trava emissão'), 'histórico: falha no registro NUNCA atrapalha emitir');
ok(cn.includes('NFE_CENTRAL_V52426'), 'central: exportação pure v5.24.34');
ok(cn.includes('pintarHistoricoNfe();'), 'central: histórico pinta ao abrir');

// teste funcional do guarda/lê (sem DOM)
const sandbox = { window:{}, localStorage:{ _d:{}, getItem(k){return this._d[k]||null;}, setItem(k,v){this._d[k]=v;} }, Date, console };
sandbox.window = {};
const fn = new Function('window','localStorage','Date', cn.replace(/if\(typeof document[\s\S]*$/,'') + '\n;return window.registrarNfeEmitida;');
const registrar = fn.call(sandbox, sandbox.window, sandbox.localStorage, Date);
if (typeof registrar === 'function') {
  registrar({ chave:'1234567890' }, { numero:12, cliente:{ nome:'Loja da Paula' }, origem:'venda' });
  const grav = JSON.parse(sandbox.localStorage.getItem('digicopy_nfe_historico'));
  ok(grav && grav.length === 1 && grav[0].numero === 12 && grav[0].cliente === 'Loja da Paula' && grav[0].chave === '1234567890', 'histórico: funcional — grava e lê certinho');
} else {
  ok(false, 'histórico: registrador exportado deveria ser função');
}

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('cnfe-historico') && bundle.includes('registrarNfeEmitida'), 'bundle: histórico dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('cnfe-historico'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '6.0.12'"), 'index 6.0.9');
ok(fs.readFileSync('index.html', 'utf8').includes('>v6.0.12<'), 'rodapé v6.0.9');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "6.0.12"'), 'package.json 6.0.6');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (histórico das notas assinadas na Central NF).');
