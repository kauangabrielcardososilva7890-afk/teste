// ═══════════════════════════════════════════════════════════════════════════
// TESTE — RELATORIO_DE_PROBLEMAS.html
//
// Pedido dele (21/09/2026): "igual do relatório de teste, mas de problemas que
// tem, onde a pessoa preenche falando os caminhos e o problema; o de caminhos
// você coloca uma caixa por caixa e, se for adicionar mais, um botão + abaixo
// que cria mais caixas infinitamente; e um + separado pra criar outro relatório
// (uma cópia abaixo) — esse é de relatórios de outras coisas".
//
// Aqui o teste abre o arquivo de verdade (jsdom), clica nos botões como o dono
// clicaria e confere o texto final que vira o .txt.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');

let falhas = 0;
function ok(nome, cond){ if (cond) console.log('  ✔ ' + nome); else { falhas++; console.error('  ✘ ' + nome); } }

const ARQ = 'RELATORIO_DE_PROBLEMAS.html';
const html = fs.readFileSync(ARQ, 'utf8');

console.log('== RELATÓRIO DE PROBLEMAS (HTML) ==');

// ── 1. Regras da casa ───────────────────────────────────────────────────────
ok('sem alert/confirm/prompt nativos (regra do projeto)',
   !/[\s(]alert\s*\(|[\s(]confirm\s*\(|[\s(]prompt\s*\(/.test(html));
ok('arquivo sozinho: nenhum script/css de fora',
   !/<script[^>]+src=|<link[^>]+rel="stylesheet"/i.test(html));
ok('aviso de segredo impresso na tela',
   /Nunca escreva senha, token, certificado, CSC/.test(html));

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://teste-60f.pages.dev/' + ARQ });
const w = dom.window, d = w.document;
const clica = el => { el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const blocos = () => [...d.querySelectorAll('#problemas [data-problema]')];
const passosDo = b => [...b.querySelectorAll('[data-passos] .passo')];
const caixaDe = p => p.querySelector('[data-passo]');
const botaoPasso = b => b.querySelector('[data-add-passo]');

// ── 2. Começa com UM problema e UM passo ────────────────────────────────────
ok('abre com 1 bloco de problema', blocos().length === 1);
ok('o bloco começa com 1 caixa de passo (caminho)', passosDo(blocos()[0]).length === 1);
ok('tem o botão "+ Adicionar passo (caminho)"',
   /Adicionar passo \(caminho\)/.test(botaoPasso(blocos()[0]).textContent));
ok('tem a caixa de texto do problema ("O que aconteceu")', !!blocos()[0].querySelector('[data-campo="aconteceu"]'));
ok('tem o que esperava + frequência + gravidade + print',
   !!blocos()[0].querySelector('[data-campo="esperado"]') &&
   !!blocos()[0].querySelector('[data-campo="print"]') &&
   blocos()[0].querySelectorAll('input[name^="r_FREQ"]').length === 3 &&
   blocos()[0].querySelectorAll('input[name^="r_GRAV"]').length === 3);

// ── 3. O "+" dos passos cria caixas sem limite ─────────────────────────────
for (let i = 0; i < 6; i++) clica(botaoPasso(blocos()[0]));
ok('6 cliques no "+" criam 7 caixas de passo (infinito, não tem teto)',
   passosDo(blocos()[0]).length === 7);
const nums = passosDo(blocos()[0]).map(p => p.querySelector('.n').textContent.trim());
ok('os passos ficam numerados na ordem (1. a 7.)',
   nums.join(' ') === '1. 2. 3. 4. 5. 6. 7.');
clica(passosDo(blocos()[0])[2].querySelector('[data-del-passo]'));
ok('o ✕ apaga só aquele passo', passosDo(blocos()[0]).length === 6);
ok('a numeração se ajeita sozinha depois de apagar',
   passosDo(blocos()[0]).map(p => p.querySelector('.n').textContent.trim()).join(' ') === '1. 2. 3. 4. 5. 6.');

// ── 4. O "+" separado cria OUTRO problema (bloco novo, não passo) ──────────
const addProblema = d.querySelector('[data-add-problema]');
ok('o botão de outro problema é separado e diz que é outro problema',
   /Adicionar outro problema/.test(addProblema.textContent));
clica(addProblema);
clica(addProblema);
ok('2 cliques criam 3 blocos de problema', blocos().length === 3);
ok('os blocos são numerados (Problema 1, 2 e 3)',
   blocos().map(b => b.querySelector('.cab b').textContent).join(' | ') === 'Problema 1 | Problema 2 | Problema 3');
clica(botaoPasso(blocos()[1]));
ok('passo adicionado no Problema 2 não mexe no Problema 1',
   passosDo(blocos()[1]).length === 2 && passosDo(blocos()[0]).length === 6);
ok('cada bloco tem caixas próprias de frequência/gravidade (sem misturar)',
   blocos()[0].querySelectorAll('input[name="r_FREQ1"]').length === 3 &&
   blocos()[1].querySelectorAll('input[name="r_FREQ2"]').length === 3);
clica(blocos()[2].querySelector('[data-del-problema]'));
ok('o ✕ remove o bloco inteiro', blocos().length === 2);
ok('nunca fica sem bloco (remove o último e nasce um novo)',
   (clica(blocos()[1].querySelector('[data-del-problema]')), clica(blocos()[0].querySelector('[data-del-problema]')), blocos().length === 1));

// ── 5. Preenche como o dono faria e confere o .txt ─────────────────────────
const b1 = blocos()[0];
while (passosDo(b1).length < 3) clica(botaoPasso(b1)); // a tela ficou com 1 passo depois das remoções de cima
const escreve = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
d.getElementById('d_nome').value = 'Kauan';
d.getElementById('d_rodape').value = 'v6.1.3';
d.getElementById('d_nuvem').value = '5.26.4';
const rOnde = d.querySelector('input[name="r_ONDE"][value="exe"]');
rOnde.checked = true; rOnde.dispatchEvent(new w.Event('change', { bubbles: true }));
escreve(b1.querySelector('[data-campo="titulo"]'), 'Contrato mostra Cliente sem vínculo');
escreve(b1.querySelector('[data-campo="aconteceu"]'), 'Na lista de contratos o cliente aparece como "Cliente sem vínculo".');
escreve(b1.querySelector('[data-campo="esperado"]'), 'Deveria mostrar o nome do cliente do contrato.');
escreve(b1.querySelector('[data-campo="print"]'), 'Captura 2026-09-21 170117.png');
escreve(b1.querySelector('[data-campo="obs"]'), 'Acontece em mais de um computador.');
const n1 = b1.getAttribute('data-problema'); // o bloco pode ter renascido com outro número
const rF = b1.querySelector('input[name="r_FREQ' + n1 + '"][value="sempre"]'); rF.checked = true; rF.dispatchEvent(new w.Event('change', { bubbles: true }));
const rG = b1.querySelector('input[name="r_GRAV' + n1 + '"][value="atrapalha"]'); rG.checked = true; rG.dispatchEvent(new w.Event('change', { bubbles: true }));
const passos1 = passosDo(b1);
escreve(caixaDe(passos1[0]), 'menu Locação');
escreve(caixaDe(passos1[1]), 'aba Contratos');
escreve(caixaDe(passos1[2]), 'olhar a coluna Cliente');
clica(addProblema);
const b2 = blocos()[1];
escreve(b2.querySelector('[data-campo="titulo"]'), 'Cliente Balcão duplicado');
escreve(b2.querySelector('[data-campo="aconteceu"]'), 'Aparecem dois cadastros com o mesmo nome.');
escreve(caixaDe(passosDo(b2)[0]), 'menu Cadastros → Clientes');
escreve(d.getElementById('geral'), 'Testei no exe do escritório.');

ok('contador mostra os problemas e quantos têm título+descrição',
   /2 problema\(s\)/.test(d.getElementById('contador').innerHTML) && /2<\/b> com título e descrição/.test(d.getElementById('contador').innerHTML));

const txt = w.montarTexto();
ok('cabeçalho com data/hora', /RELATÓRIO DE PROBLEMAS — SISTEMA DIGICOPY/.test(txt) && /Gerado em \d\d\/\d\d\/\d\d\d\d às \d\dh\d\d/.test(txt));
ok('identificação sai escrita', /Nome\.+: Kauan/.test(txt) && /Programa \.exe/.test(txt));
ok('os DOIS problemas saem no texto', /PROBLEMA 1: Contrato mostra Cliente sem vínculo/.test(txt) && /PROBLEMA 2: Cliente Balcão duplicado/.test(txt));
ok('os CAMINHOS saem numerados, um por linha',
   /1\) menu Locação\s*\n\s*2\) aba Contratos\s*\n\s*3\) olhar a coluna Cliente/.test(txt));
ok('o problema 2 tem o caminho dele (não misturou com o 1)',
   /PROBLEMA 2[\s\S]*1\) menu Cadastros → Clientes/.test(txt));
ok('o que aconteceu e o que esperava saem escritos',
   /O QUE ACONTECEU\.\.: Na lista de contratos/.test(txt) && /O QUE ESPERAVA\.\.\.: Deveria mostrar o nome do cliente/.test(txt));
ok('frequência e gravidade saem escritas', /FREQUÊNCIA\.+: Sempre acontece/.test(txt) && /QUANTO ATRAPALHA\.: Atrapalha, mas dá pra continuar/.test(txt));
ok('o nome do print sai citado', /PRINT \(arquivo\)\.\.: Captura 2026-09-21 170117\.png/.test(txt));
ok('observações do problema e gerais saem', /OBSERVAÇÕES\.\.\.\.\.\.: Acontece em mais de um computador\./.test(txt) && /Testei no exe do escritório\./.test(txt));
ok('rodapé lembra que print vai pelo chat e que não tem segredo',
   /prints são enviados/.test(txt) && /Nenhuma senha, token, certificado ou CSC/.test(txt));
ok('nome do arquivo com data e hora', /^relatorio-problemas-digicopy-\d{4}-\d\d-\d\d-\d{4}\.txt$/.test(w.nomeArquivo()));
ok('rascunho guardado no navegador', /localStorage\.setItem\(CHAVE/.test(html) && /digicopy_relatorio_problemas_v1/.test(html));

// ── 6. O rascunho volta igual (fechou e abriu de novo) ─────────────────────
const dom2 = new JSDOM(html, { runScripts: 'dangerously', url: 'https://teste-60f.pages.dev/' + ARQ,
  beforeParse(janela){ janela.localStorage.setItem('digicopy_relatorio_problemas_v1', JSON.stringify({
    nome:'Kauan', data:'21/09/2026', onde:'exe', rodape:'v6.1.3', nuvem:'5.26.4', geral:'',
    problemas:[{ titulo:'Voltou do rascunho', aconteceu:'x', esperado:'', freq:'sempre', grav:'visual', print:'', obs:'', passos:['passo A','passo B','passo C'] }]
  })); } });
const d2 = dom2.window.document;
ok('rascunho restaura o problema e os passos escritos',
   d2.querySelectorAll('#problemas [data-problema]').length === 1 &&
   d2.querySelector('[data-campo="titulo"]').value === 'Voltou do rascunho' &&
   [...d2.querySelectorAll('[data-passo]')].map(t => t.value).join('|') === 'passo A|passo B|passo C');
ok('rascunho restaura a caixa de frequência marcada',
   d2.querySelector('input[name="r_FREQ1"][value="sempre"]').checked === true);

// ── 7. Não pesa no sistema (nem no .exe) ──────────────────────────────────
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok('relatório fora do bundle (não pesa na abertura do sistema)', !manifest.includes(ARQ));
ok('relatório fora do build.files (.exe não leva arquivo de ferramenta)', !pkg.build.files.includes(ARQ));

if (falhas > 0){ console.error('\n' + falhas + ' assert(s) FALHARAM'); process.exit(1); }
console.log('\nRESULTADO: relatório de problemas (HTML) passou!');
