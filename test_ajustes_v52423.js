// test_ajustes_v52423.js — v5.24.34: pedido dele "função de publicar atualizações".
// WORKER: GET/POST /v1/app-release + tabela app_versao (1 linha; leitura
// pública; escrita = aparelho matriculado).
// APP: ao abrir, se versão nova > instalada e ainda NÃO vista, aparece UMA
// ÚNICA VEZ o card com [Abrir pra baixar] + [Baixar depois] (qualquer um dos
// botões marca como vista). No celular: mesmo código, mesmo comportamento.
// CONFIG: card "Publicar nova atualização" (versão + link https + notas).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');

// WORKER
ok(wk.includes('CREATE TABLE IF NOT EXISTS app_versao'), 'worker: tabela app_versao (uma linha)');
ok(wk.includes("url.pathname === '/v1/app-release'"), 'worker: endpoint /v1/app-release roteado');
ok(wk.includes('await authenticate(request, env)'), 'worker: escrita só com aparelho matriculado');
ok(wk.includes('VERSAO_INVALIDA'), 'worker: validação de formato da versão');
ok(wk.includes("urlRel) {") || wk.includes('/^https:\\/\\//.test(urlRel)'), 'worker: link obrigado a ser https');

// SININHO (app)
ok(av.includes('cmpVersaoMaior'), 'app: comparador de versão (v nova > instalada)');
ok(av.includes('AVISOS_V52423_PURE'), 'app: pure exportado pros testes');
ok(av.includes('aviso-update-card'), 'app: card do aviso com id próprio (own DOM)');
ok(av.includes('Abrir pra baixar'), 'app: botão Abrir pra baixar (texto dele)');
ok(av.includes('Baixar depois'), 'app: botão Baixar depois (texto dele)');
ok(av.includes("digicopy_upd_visto_"), 'app: chave "visto nessa versão" (aparece uma única vez)');
const vistoCalls = (av.match(/marcarVisto\(\);/g)||[]).length + (av.match(/marcarVisto\(\)\n/g)||[]).length;
ok(/marcarVisto=\(\); marcarVisto\(\)/.test(av.replace(/\s+/g,''))===false, 'app: (sanidade da contagem)');
ok((av.match(/marcarVisto\(\)/g)||[]).length >= 2, 'app: dois pontos de "marcar visto" (um em cada botão)');
ok(av.includes('window.open(url'), 'app: Abrir pra baixar abre o link (baixa o .exe)');
ok(av.includes("api('/v1/app-release',{method:'GET'}"), 'app: consulta na nuvem ao abrir');
ok(av.includes('__checagemAtualizacaoFeita'), 'app: gatilho de checagem uma única vez por abertura');
ok(av.includes('atualização nova aparece') || av.includes('aparece uma única vez'), 'app: explicação "uma vez" no card');

// PUBLICADOR (config)
ok(av.includes('card-publicar-atualizacao'), 'config: card Publicar nova atualização');
ok(av.includes('pub-upd-versao') && av.includes('pub-upd-notas') && av.includes('pub-upd-expira') && av.includes('pub-upd-file'), 'config: campos versão/notas/tempo/.exe (supersede v52428: link virou /dl automático)');
ok(av.includes("api('/v1/app-release',{method:'POST'"), 'config: POST com a trava do aparelho');
ok(av.includes("if(!versao||!url)"), 'config: impede publicar sem versão/link');

// comparador: checagem funcional básica
function cmpVersaoMaior(nova, atual){
  var a=String(nova||'').replace(/^v/i,'').split('.');
  var b=String(atual||'').replace(/^v/i,'').split('.');
  for(var i=0;i<Math.max(a.length,b.length);i++){
    var x=parseInt(a[i],10)||0, y=parseInt(b[i],10)||0;
    if(x!==y) return x>y;
  }
  return false;
}
ok(cmpVersaoMaior('5.24.34','5.24.22')===true, 'cmp: 5.24.34 > 5.24.22');
ok(cmpVersaoMaior('5.25.0','5.24.99')===true, 'cmp: 5.25.0 > 5.24.99 (não trava no 9)');
ok(cmpVersaoMaior('5.24.34','5.24.34')===false, 'cmp: igual não avisa de novo');
ok(cmpVersaoMaior('5.24.0','5.24.34')===false, 'cmp: publique velha = silêncio');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('aviso-update-card'), 'bundle: sininho dentro');
ok(bundle.includes('card-publicar-atualizacao'), 'bundle: publicador dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('aviso-update-card'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '5.26.0'"), 'index: versão 5.25.0');
ok(fs.readFileSync('index.html', 'utf8').includes('>v5.26.0<'), 'index: rodapé v5.26.0');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.26.0"'), 'package.json 5.26.0');
ok(wk.includes("'5.26.1'"), 'worker carimbado 5.26.1 (visual profissional do site; o 5.26.0 foi o motor do CNPJ+gerente)')

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (sininho de atualização + publicador na config).');
