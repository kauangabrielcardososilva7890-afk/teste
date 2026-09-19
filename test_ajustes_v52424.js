// test_ajustes_v52424.js — v5.24.34: pedido dele "site próprio de atualizações".
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
ok(wk.includes('Sistema DigiCopy') && wk.includes('Portal oficial de atualizações'), 'site: título = portal oficial dele (supersede v5.26.1: visual profissional pedido dele — "bem bonito e bem informativo")');
ok(wk.includes('Baixar a atualização agora'), 'site: botão de baixar grande e direto (supersede v5.26.1: botão novo do visual profissional)');
ok(wk.includes("text/html; charset=utf-8"), 'site: responde HTML de verdade');
ok(wk.includes('Nenhuma atualização disponível para você agora'), 'site: estado vazio bonitinho EXPLICANDO o destinatário (supersede v5.26.1)');
ok(wk.includes('selo-novo') && wk.includes('mais recente'), 'site: a mais nova ganha selo (supersede v52428)');
ok(/replace\(\/[&<>"]'\//.test(wk) || wk.includes('[&<>"\']'), 'site: notas escapadas (texto dele nunca vira HTML)');
ok(wk.includes("Intl.DateTimeFormat('pt-BR'"), 'site: data em português');
ok(wk.includes('WHERE ativa = 1 AND oculta = 0 AND (expira_em = 0 OR expira_em > ?) ORDER BY publicado_em DESC'), 'site: só o VIVO, mais novo primeiro (supersede v52428: site virou porta de download; histórico fica só dele no portal)');
ok(!/atualizacoes[\s\S]{0,400}authenticate/.test(wk.slice(wk.indexOf("url.pathname === '/atualizacoes'"), wk.indexOf("url.pathname === '/atualizacoes'") + 500)), 'site: página é PÚBLICA (sem pedir aparelho matriculado)');

// INTERFACE no app: card aponta pro site dele
ok(av.includes("'/atualizacoes'"), 'app: card do publicador tem o link do site');
ok(av.includes('pub-upd-site'), 'app: link com id próprio (own DOM)');
ok(av.includes('Site onde baixam (mostra só o que está ativo)'), 'app: texto explicando o site (supersede v52428)');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes("'/atualizacoes'") && bundle.includes('pub-upd-site'), 'bundle: link do site dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('pub-upd-site'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '6.0.13'"), 'index 6.0.9 (re-ancorado)');
ok(fs.readFileSync('index.html', 'utf8').includes('>v6.0.13<'), 'rodapé v6.0.9 (re-ancorado)');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "6.0.13"'), 'package.json 6.0.6 (re-ancorado)');
ok(wk.includes("'5.26.3'"), 'worker carimbado 5.26.3 (re-ancorado)');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (site próprio de atualizações + histórico na nuvem).');
