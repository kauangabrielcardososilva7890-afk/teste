// ═════════════════════════════════════════════════════
// TESTE — SEM SOBRESCRITA SILENCIOSA (v7.0.20, rodada 33, ideia D)
//
// O DEFEITO MAIS CARO: um patch novo redefine uma função antiga e ESQUECE de
// levar junto o que ela fazia (o embrulho do popup, a permissão, a baixa de
// estoque). O defeito aparece depois, longe de onde foi causado — e ninguém
// consegue dizer "foi esta linha".
//
// A TRAVA: lê o MAPA DAS CAMADAS e compara com a FOTO das redefinições que já
// existiam (`camadas_baseline.json` — código velho, perdoado). Toda redefinição
// NOVA (em arquivo novo ou em arquivo velho) só passa se, perto da definição
// (±40 linhas), houver:
//   (a) marcador explícito citando o nome:
//       // SUBSTITUICAO DE PROPOSITO: renderVendas — refaz a lista porque...
//   (b) encadeamento da anterior (old/anterior/prev/orig/_open + .apply/.call).
//
// Se este teste reprovar um patch novo, NÃO apague o teste: escreva o marcador
// (uma linha dizendo o que foi preservado) ou encadeie a função antiga.
// ═════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  ✘ ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  ✔ ' + nome); passou++;
}
console.log('== SEM SOBRESCRITA SILENCIOSA (só confere, nada muda) ==');

const M = require('./mapa_camadas.js');
const r = M.escreverGlobais();
ok('o mapa foi lido com o parser (acorn), sem chute por texto', r.semParser === false);
ok('o baseline existe', fs.existsSync('camadas_baseline.json'));
const base = JSON.parse(fs.readFileSync('camadas_baseline.json', 'utf8'));
const perdoado = new Set();
Object.keys(base.redefinicoes || {}).forEach((f) => {
  (base.redefinicoes[f] || []).forEach((n) => perdoado.add(f + '|' + n));
});
ok('o baseline tem as redefinições velhas perdoadas (' + perdoado.size + ')', perdoado.size > 500);

const RE_MARCADOR = /SUBSTITUIC[ÃA]O DE PROPOSITO/;
const RE_ENCADEIA = /(old\w*|anterior|_prev|prev\w*|orig\w*|_open\w*|captur\w*)\s*\.\s*(apply|call)\s*\(/;
const novasSemProtecao = [];
let novasComProtecao = 0;
const fontes = {};
for (const [nome, esc] of r.nomes) {
  const load = esc.filter((x) => x.tempo === 'no carregamento').sort((a, b) => a.pos - b.pos);
  for (let i = 1; i < load.length; i++) {
    const w = load[i];
    if (perdoado.has(w.arquivo + '|' + nome)) continue;
    if (!fontes[w.arquivo]) {
      try { fontes[w.arquivo] = fs.readFileSync(w.arquivo, 'utf8').split('\n'); }
      catch (e) { fontes[w.arquivo] = []; }
    }
    const linhas = fontes[w.arquivo];
    const ini = Math.max(0, (w.linha || 1) - 41), fim = Math.min(linhas.length, (w.linha || 1) + 40);
    const janela = linhas.slice(ini, fim).join('\n');
    const temMarcador = RE_MARCADOR.test(janela) && janela.split('\n').some((l) => RE_MARCADOR.test(l) && l.indexOf(nome) >= 0);
    if (temMarcador || RE_ENCADEIA.test(janela)) { novasComProtecao++; continue; }
    novasSemProtecao.push(w.arquivo + ':' + (w.linha || '?') + ' redefine `' + nome + '` em silêncio');
  }
}
ok('nenhuma redefinição NOVA sem marcador e sem encadear (' + novasComProtecao + ' novas protegidas)',
  novasSemProtecao.length === 0, novasSemProtecao.slice(0, 5).join(' | '));

console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
