// test_ajustes_v5264.js — v5.26.4: DATA DE ATENDIMENTO GRANDE no relatório do
// chamado (pedido dele com print do papel: "a parte onde escreve a data de
// atendimento é pequena pra escrever, aumenta a largura e o tamanho").
//
// Trava pra sempre:
//  1) o relatório final ganha uma CAIXA grande pra escrever a data com caneta
//     (min-width 170px, fonte 15px bold), com ou sem data preenchida;
//  2) o texto miúdo da linha sobe (11px → 12.5px);
//  3) o patch v5.18.6 original NÃO é tocado (nada some; é sobreposição);
//  4) se o relatório mudar de cara, o wrap devolve o HTML intacto (não quebra);
//  5) window.open é restaurada SEMPRE (finally), não importa o erro.
const fs = require('fs');
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const PATCH = 'ajustes_v5264_chamado_data_grande_patch.js';
const patch = fs.readFileSync(PATCH, 'utf8');
const antigo = fs.readFileSync('ajustes_v5186_patch.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

console.log('== PATCH: existência, guarda e trilha ==');
ok('patch existe com guard próprio (__v5264cd)', patch.indexOf('window.__v5264cd') >= 0);
ok('manifesto fecha com o patch v5.26.4 (posição 204; login-nuvem na 203)', manifest.length === 204 && manifest[203] === PATCH);
ok('patch está dentro do bundle gerado', bundle.indexOf(PATCH) >= 0 && bundle.indexOf('__v5264cd') >= 0);
ok('patch do relatório v5.18.6 intocado (nada some)', antigo.indexOf('Atendimento:') >= 0 && antigo.indexOf('Dados de Atendimento') >= 0);
ok('wrap SÓ durante a impressão + window.open restaurada (finally)', patch.indexOf('finally') >= 0 && patch.indexOf('window.open = _open') >= 0);
ok('padrão sumiu → devolve HTML intacto (não quebra)', patch.indexOf('return html;') >= 0);

console.log('== PURA melhorar(): transformação no HTML do relatório ==');
const sandbox = { window: {}, setInterval: function(){ return 0; }, clearInterval: function(){} };
vm.createContext(sandbox);
vm.runInContext(patch, sandbox);
const M = sandbox.window.V5264_CH_DATA_PURE.melhorar;
ok('pura exportada (V5264_CH_DATA_PURE.melhorar)', typeof M === 'function');

const rel = '<style>.muted{color:#64748b;font-size:11px}</style>' +
  '<div class="card"><div class="t">Dados de Atendimento</div>' +
  '<div>Técnico: <b>Denivaldo</b></div>' +
  '<div class="muted">Cadastro: 11/09/2026 • Atendimento: &nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;</div></div>' +
  '<p><b>Contador preto:</b></p>';
const out = M(rel);
ok('data vira CAIXA grande pra escrever (170px\, fonte 15px\, bold)', /min-width:170px/.test(out) && /font-size:15px/.test(out) && /font-weight:700/.test(out));
ok('"Atendimento:" ganha destaque (rótulo bold)', /Atendimento:<\/span>/.test(out));
ok('texto miúdo sob e (muted 11px→12.5px)', out.indexOf('font-size:12.5px') >= 0 && out.indexOf('font-size:11px}') < 0);
ok('resto do relatório preservado (tecnico/contador/cards intactos)', out.indexOf('Denivaldo') >= 0 && out.indexOf('Contador preto') >= 0);

const out2 = M(rel.replace('&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;', '17/09/2026'));
ok('data preenchida também entra na caixa', out2.indexOf('17/09/2026') >= 0 && /min-width:170px/.test(out2));

const estranho = '<html>qualquer coisa sem relatório</html>';
ok('HTML sem padrão volta byte a byte (seguro)', M(estranho) === estranho);
ok('null/vazio não joga porrada', M(null) === null && M('') === '');

console.log('== WRAP: intercepta SÓ a janela de impressão e devolve window.open ==');
const fakeDoc = { written: '', write: function(h){ this.written = h; }, close: function(){} };
let openChamadas = 0;
global.window = sandbox.window;
sandbox.window.open = function(){ openChamadas++; return { document: fakeDoc }; };
sandbox.window.imprimirChamadoPDF = function(){
  const w = window.open('', '_blank');
  if (w){ w.document.write(rel); w.document.close(); }
};
sandbox.setInterval = function(fn){ return 0; }; // sem retries no teste
vm.runInContext(patch.replace('if (window.__v5264cd) return;', ''), sandbox); // segunda passada embrulha
const openAntes = sandbox.window.open;
sandbox.window.imprimirChamadoPDF('OS1');
ok('janela aberta 1x e documento escrito', openChamadas === 1 && fakeDoc.written.indexOf('Atendimento:') >= 0);
ok('o que foi pro papel já é a versão caixa grande', /min-width:170px/.test(fakeDoc.written) && /font-size:12.5px/.test(fakeDoc.written));
ok('window.open restaurada após a chamada', sandbox.window.open === openAntes);

console.log('== CARIMBO (app agora em 5.26.5 após a escola; worker e gerente intactos) ==');
ok('package.json na 5.26.5', pkg.version === '5.26.5');
ok('index.html carimbado 5.26.5 (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '5.26.5'") >= 0 && html.indexOf('>v5.26.5<') >= 0);
ok('script check valida o patch novo', pkg.scripts.check.indexOf(PATCH) >= 0);
ok('worker SEGUE 5.26.2 (motor sem mudança)', fs.readFileSync('cloudflare-worker/src/index.js','utf8').indexOf("WORKER_VERSION = '5.26.2'") >= 0);
ok('gerente SEGUE 5.26.3', JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json','utf8')).version === '5.26.3');
ok('mobile sincronizado com o bundle novo', fs.readFileSync('mobile/www/app.bundle.js','utf8') === bundle);

console.log('\nTudo OK — v5.26.4 (data de atendimento em caixa grande no relatório do chamado: 170px de largura, letra 15, dá pra escrever com caneta · wrap seguro, nada some).');
