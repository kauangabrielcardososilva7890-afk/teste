// ════════════════════════════════════════════════════════
// MAPA_CAMADAS — quem define o quê, na ordem em que carrega (e quem GANHA).
//
// Por que existe: o sistema é feito de camadas. O mesmo nome global
// (`navigateTo`, `renderVendas`, `saveDB`…) é escrito por vários arquivos e,
// como todos rodam na ordem do bundle, QUEM GANHA É O ÚLTIMO QUE CARREGA.
// Sem mapa, responder "onde está o navigateTo de verdade" exige ler 33 arquivos.
//
// O que conta como "escrita de global" (é o que este mapa mede):
//   1. `window.X = ...` (função, alias ou valor) — sempre sobrepõe;
//   2. `globalThis.X = ...` / `raiz.X = ...` — mesma coisa por outro nome;
//   3. `function X(){}` no NÍVEL DE CIMA do arquivo (vira global);
//   4. `var X = ...` no nível de cima **só quando o arquivo não é isolado**.
// O que NÃO conta: função com o mesmo nome declarada DENTRO de uma IIFE
// (é local — aparece em 82 arquivos como `txt`, mas não sobrepõe nada).
//
// Este script NÃO altera nada: lê o `bundle-manifest.json` (a ordem real de
// carga) e os arquivos, e escreve `MAPA_CAMADAS.md`.
//
// Uso:  node mapa_camadas.js        (ou: npm run mapa)
// Uso no teste:  require('./mapa_camadas.js').escreverGlobais()
// ════════════════════════════════════════════════════════
const fs = require('fs');

let acorn = null;
try { acorn = require('acorn'); } catch (e) { acorn = null; }
if (!acorn) { try { acorn = require('./vendor/acorn'); } catch (e) { acorn = null; } }

// Lê o manifesto e devolve, para cada nome global, TODAS as escritas na ordem de carga.
// Devolve: { nomes: Map(nome → [{arquivo, pos, linha, forma}]), ordem: [arquivos], semParser: bool }
function escreverGlobais() {
  const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
  const vivos = manifest.filter((f) => f.endsWith('.js'));
  const nomes = new Map();
  let semParser = !acorn;

  function anotar(nome, arquivo, pos, linha, forma, tempo) {
    if (!nome) return;
    if (!nomes.has(nome)) nomes.set(nome, []);
    nomes.get(nome).push({ arquivo: arquivo, pos: pos, linha: linha, forma: forma, tempo: tempo });
  }

  // Uma escrita é "no carregamento" quando acontece enquanto o arquivo carrega (fora de
  // qualquer função) ou dentro de uma IIFE (função que roda na hora). Escrita dentro de
  // outra função só acontece quando aquela função for chamada — por isso é marcada
  // "em uso": ela pode trocar a função depois, em tempo de execução, e isso também
  // engana quem procura "quem ganha".
  function ehImediata(no) {
    const p = no.__pai;
    if (!p) return false;
    if (p.type === 'CallExpression' && p.callee === no) return true;            // (function(){})()
    if (p.type === 'UnaryExpression' && p.__pai && p.__pai.type === 'CallExpression' && p.__pai.callee === p) return true; // !function(){}()
    if (p.type === 'AssignmentExpression' && p.__pai && p.__pai.type === 'CallExpression' && p.__pai.callee === p.__pai) return true;
    return false;
  }

  // nome de um "member": window.navigateTo / globalThis.x / raiz.y
  function nomeDoMembro(no) {
    if (!no || no.type !== 'MemberExpression' || no.computed) return null;
    const obj = no.object;
    const dono = (obj.type === 'Identifier' && /^(window|globalThis|raiz|self)$/.test(obj.name)) ||
      (obj.type === 'ThisExpression' && false);
    if (!dono) return null;
    if (no.property.type !== 'Identifier') return null;
    return no.property.name;
  }

  vivos.forEach((arquivo, pos) => {
    let src = '';
    try { src = fs.readFileSync(arquivo, 'utf8'); } catch (e) { return; }

    // o arquivo é isolado (enrolado) no bundle quando NÃO declara nada no nível de cima
    let ast = null;
    try { ast = acorn ? acorn.parse(src, { ecmaVersion: 2022 }) : null; } catch (e) { ast = null; }
    if (!ast) { semParser = true; return; }

    const topo = ast.body;
    const nivelDeCima = (no) => topo.indexOf(no) >= 0;

    // 1/2) atribuições a window.X (em qualquer profundidade — `window.X = ...` dentro de
    //     uma IIFE continua escrevendo no global de verdade)
    (function varre(no, dentroDeFuncao) {
      if (!no || typeof no !== 'object') return;
      if (no.type === 'AssignmentExpression' && no.operator === '=') {
        const alvo = nomeDoMembro(no.left);
        if (alvo) {
          const forma = no.right.type === 'FunctionExpression' || no.right.type === 'ArrowFunctionExpression'
            ? 'função' : (no.right.type === 'Identifier' || no.right.type === 'MemberExpression' ? 'alias' : 'valor');
          anotar(alvo, arquivo, pos, src.slice(0, no.start).split('\n').length, forma,
            dentroDeFuncao ? 'em uso' : 'no carregamento');
        }
      }
      const ehFuncao = no.type === 'FunctionExpression' || no.type === 'ArrowFunctionExpression' || no.type === 'FunctionDeclaration';
      const proximo = ehFuncao ? (dentroDeFuncao || !ehImediata(no)) : dentroDeFuncao;
      for (const k in no) {
        if (k === 'start' || k === 'end' || k === 'type' || k === '__pai') continue;
        const v = no[k];
        if (v && typeof v === 'object') {
          if (Array.isArray(v)) {
            v.forEach((f) => { if (f && typeof f === 'object' && !f.__pai) f.__pai = no; varre(f, proximo); });
          } else {
            if (!v.__pai) v.__pai = no;
            varre(v, proximo);
          }
        }
      }
    })(ast, false);

    // 3) function X(){} no nível de cima → vira global (o bundle não isola quem declara no topo)
    topo.forEach((no) => {
      if (no.type === 'FunctionDeclaration' && no.id) {
        anotar(no.id.name, arquivo, pos, src.slice(0, no.start).split('\n').length, 'função de topo', 'no carregamento');
      }
      if (no.type === 'VariableDeclaration') {
        no.declarations.forEach((d) => {
          if (d.id && d.id.type === 'Identifier') {
            anotar(d.id.name, arquivo, pos, src.slice(0, d.start).split('\n').length, 'var de topo', 'no carregamento');
          }
        });
      }
    });
  });

  return { nomes: nomes, ordem: vivos, semParser: semParser };
}

function gerar() {
  const r = escreverGlobais();
  const nomes = r.nomes;
  const vivos = r.ordem;
  const repetidos = [...nomes.entries()].filter(([, d]) => d.length > 1)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const total = [...nomes.values()].reduce((s, d) => s + d.length, 0);

  let md = '';
  md += '# MAPA DAS CAMADAS — quem define o quê e quem ganha\n\n';
  md += '> Gerado por `node mapa_camadas.js` (`npm run mapa`). **Nada é alterado: é só leitura.**\n';
  md += '> A **ordem** é a do `bundle-manifest.json` — é a ordem em que o sistema carrega de verdade.\n';
  md += '> **Quem ganha é sempre o último que carrega.** O arquivo que ficou por baixo continua no\n';
  md += '> repositório, mas o que vale em execução é o de baixo — é aí que nasce o defeito difícil.\n';
  md += '> Escrita **no carregamento** acontece quando o arquivo carrega; escrita **em uso** está\n';
  md += '> dentro de uma função e só troca a global quando aquela função for chamada.\n\n';
  md += `- Arquivos no bundle: **${vivos.length}**\n`;
  md += `- Nomes globais escritos: **${nomes.size}**\n`;
  md += `- Escritas totais (contando as repetições): **${total}**\n`;
  md += `- Nomes escritos em **2 ou mais** arquivos: **${repetidos.length}**\n`;
  md += `- Análise sem parser (acorn)? **${r.semParser ? 'SIM — os números estão incompletos' : 'não'}**\n\n`;

  md += '## Os nomes mais disputados (quem ganha está na última linha)\n\n';
  md += '| Nome | Vezes | Ganha (último a carregar) |\n|---|---|---|\n';
  repetidos.slice(0, 60).forEach(([nome, d]) => {
    const g = d[d.length - 1];
    const carga = d.filter((x) => x.tempo === 'no carregamento');
    const quemGanha = carga.length ? carga[carga.length - 1] : null;
    md += `| \`${nome}\` | ${d.length} | ${quemGanha ? quemGanha.arquivo + ':' + quemGanha.linha + ' (' + quemGanha.forma + ', no carregamento)' : '(só troca em uso)'} |\n`;
  });

  md += '\n## A lista completa dos repetidos\n\n';
  repetidos.forEach(([nome, d]) => {
    md += `### \`${nome}\` — ${d.length} escritas\n\n`;
    const ultimaCarga = (() => { const c = d.filter((x) => x.tempo === 'no carregamento'); return c.length ? c[c.length - 1] : null; })();
    d.forEach((x) => {
      md += `- ${x === ultimaCarga ? '**GANHA →** ' : 'sobrepõe: '}${x.arquivo}:${x.linha} — ${x.forma}, ${x.tempo}\n`;
    });
    md += '\n';
  });

  md += '## Nomes escritos em um lugar só\n\n';
  const unicos = [...nomes.entries()].filter(([, d]) => d.length === 1).map(([n]) => n).sort();
  md += unicos.length + ' nomes: ' + unicos.map((n) => '`' + n + '`').join(', ');
  md += '\n\n---\n\n_Este arquivo é gerado: não edite à mão. Rode `npm run mapa` para atualizar._\n';

  fs.writeFileSync('MAPA_CAMADAS.md', md);

  console.log('MAPA_CAMADAS.md gerado:');
  console.log('  arquivos no bundle ....... ' + vivos.length);
  console.log('  nomes globais escritos ... ' + nomes.size);
  console.log('  escritas totais .......... ' + total);
  console.log('  nomes repetidos (2+) ..... ' + repetidos.length);
  console.log('  os 8 mais disputados ..... ' + repetidos.slice(0, 8).map(([n, d]) => n + '(' + d.length + ')').join(', '));
  return r;
}

module.exports = { escreverGlobais: escreverGlobais, gerar: gerar };

if (require.main === module) gerar();
