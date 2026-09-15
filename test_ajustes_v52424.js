// test_ajustes_v52424.js — v5.24.24: pedido dele "site próprio de atualizações".
// Nuvem guarda o HISTÓRICO (app_releases, 1 linha por versão) e o worker serve
// a página pública /atualizacoes: cada versão com as notas (o patch escrito)
// e o botão "Baixar esta versão". Sininho continua anunciando só uma vez.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');

// HISTÓRICO na nuvem
ok(wk.includes('CREATE TABLE IF NOT EXISTS app_releases'), 'worker: tabela app_releases (histórico, 1 linha por versão)');
ok(wk.includes("ON CONFLICT(versao)"), 'worker: republicar mesma versão ATUALIZA a linha (sem duplicar)');
ok(wk.includes("app_releases ORDER BY publicado_em DESC"), 'worker: histórico em JSON também (/v1/app-releases)');
ok(wk.includes("url.pathname === '/v1/app-releases'") && wk.includes("url.pathname === '/v1/app-release'"), 'worker: /v1/app-releases listado APÓS/TJUNTO do /v1/app-release (rota própria, não confunde)');

// SITE PÚBLICO
ok(wk.includes("url.pathname === '/atualizacoes'"), 'site: rota pública /atualizacoes');
ok(wk.includes('DigiCopy — Atualizações'), 'site: título em letra de gente');
ok(wk.includes('Baixar esta versão'), 'site: cada versão tem botão de baixar');
ok(wk.includes("text/html; charset=utf-8"), 'site: responde HTML de verdade');
ok(wk.includes('Nenhuma atualização publicada ainda'), 'site: estado vazio bonitinho (antes da 1ª publicação)');
ok(wk.includes('versão atual') && wk.includes('selo-novo'), 'site: a mais nova ganha selo "versão atual"');
ok(/replace\(\/[&<>"]'\//.test(wk) || wk.includes('[&<>"\']'), 'site: notas escapadas (texto dele nunca vira HTML)');
ok(wk.includes("Intl.DateTimeFormat('pt-BR'"), 'site: data em português');
ok(wk.includes('.sort((x, y) => {') && wk.includes("(pb[i] || 0) - (pa[i] || 0)"), 'site: ordenação MAIS NOVA primeiro por número (5.25.0 > 5.24.99)');
ok(!/atualizacoes[\s\S]{0,400}authenticate/.test(wk.slice(wk.indexOf("url.pathname === '/atualizacoes'"), wk.indexOf("url.pathname === '/atualizacoes'") + 500)), 'site: página é PÚBLICA (sem pedir aparelho matriculado)');

// INTERFACE no app: card aponta pro site dele
ok(av.includes("'/atualizacoes'"), 'app: card do publicador tem o link do site');
ok(av.includes('pub-upd-site'), 'app: link com id próprio (own DOM)');
ok(av.includes('Seu site próprio de atualizações'), 'app: texto explicando que é o site dele');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes("'/atualizacoes'") && bundle.includes('pub-upd-site'), 'bundle: link do site dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('pub-upd-site'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '5.24.24'"), 'index 5.24.24');
ok(fs.readFileSync('index.html', 'utf8').includes('>v5.24.24<'), 'rodapé v5.24.24');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.24.24"'), 'package.json 5.24.24');
ok(wk.includes("'5.24.24'"), 'worker carimbado 5.24.24');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.24 (site próprio de atualizações + histórico na nuvem).');
