const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v52025_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.AJUSTES_V52025_PURE;

console.log('== AJUSTES_V52025_PURE ==');

// traduzirErroSync: cada erro vira instrução certa
ok('permissão → regras', /REGRAS/.test(P.traduzirErroSync({ status:'PERMISSION_DENIED', message:'PERMISSION_DENIED: Missing or insufficient permissions.' })));
ok('403 → regras', /REGRAS/.test(P.traduzirErroSync({ status:403, message:'HTTP 403' })));
ok('cota 429 → cota', /COTA/.test(P.traduzirErroSync({ status:429, code:'RESOURCE_EXHAUSTED', message:'RESOURCE_EXHAUSTED: Quota exceeded.' })));
ok('quota texto → cota', /COTA/.test(P.traduzirErroSync({ message:'Quota exceeded' })));
ok('auth → login anônimo', /anônimo|Anônimo/.test(P.traduzirErroSync({ status:401, message:'UNAUTHENTICATED' })));
ok('sem rede → internet', /SEM INTERNET/i.test(P.traduzirErroSync(new TypeError('Failed to fetch'))));
ok('genérico não quebra', typeof P.traduzirErroSync(null) === 'string' && P.traduzirErroSync(null).length > 0);
ok('genérico mostra o erro', /xyz123/.test(P.traduzirErroSync({ message:'xyz123' })));

// textoRegrasFirebase: regras completas e auth obrigatório
const regras = P.textoRegrasFirebase();
ok('regras liberam tudo', /match \/\{document=\*\*\}/.test(regras));
ok('regras exigem auth', /request\.auth != null/.test(regras));

// script tag do patch + botão ☁ existem no index.html
const html = fs.readFileSync('index.html','utf8');
ok('patch carregado no index.html', /ajustes_v52025_patch\.js/.test(html));
ok('botão ☁ teste nuvem na sidebar', /btn-teste-nuvem/.test(html) && /__syncDiagnosticoAlert\(\)/.test(html));

console.log('\nRESULTADO: Testes do ajustes_v52025 passaram!');
