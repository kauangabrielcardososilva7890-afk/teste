// ═══════════════════════════════════════════════════════════════════════════
// mesclar_ajustes.js — r55-prep: junta os 139 ajustes_v*.js em UM arquivo.
//
// Pedido do dono (28/09/2026): arquivos demais dificultam achar o problema;
// mesclar em um. Este script GERA o consolidado; a TROCA (manifest + 168
// testes + apagar os 139) é a tarefa r55, com a suíte provando tudo.
//
// Garantias do formato (idêntico ao build_bundle.js, seção por seção):
//  1) mesma ORDEM do manifest; bytes de cada arquivo preservados VERBATIM;
//  2) isolamento de erro replicado: arquivo sem declaração global vai dentro
//     do seu try/catch com a MESMA atribuição (__DIGICOPY_FALHA('arquivo',e));
//  3) banners exatos do bundle + índice JSON (início/fim em bytes) para os
//     testes extraírem a seção de cada arquivo (a maioria executa o código).
//
// Uso:
//   node mesclar_ajustes.js --dry-run   → PROVA: cada seção gerada existe
//                                          byte-a-byte no app.bundle.js atual
//   node mesclar_ajustes.js --apply      → ESCREVE ajustes_consolidados.js
//                                          + ajustes_consolidados.index.json
//                                          (NÃO mexe no manifest nem apaga
//                                          nada — isso é a tarefa r55)
//
// NOTA DE ORDEM (r55): os ajustes estão em 4 blocos no manifest, com 24
// arquivos não-ajustes no meio. Um arquivo só ocupa UMA posição — algum
// bloco muda de lugar relativo a esses 24. A suíte (243) é o juiz; cadeias
// "último que define vence" (ex.: doLoginUser, travada por teste) decidem
// a posição final do consolidado.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const MANIFEST = 'bundle-manifest.json';
const SAIDA = 'ajustes_consolidados.js';
const INDICE = 'ajustes_consolidados.index.json';
const RE_AJUSTE = /^ajustes_v.*\.js$/;

let acorn = null;
try { acorn = require('acorn'); } catch (e) { acorn = null; }
if (!acorn) { try { acorn = require('./vendor/acorn'); } catch (e) { acorn = null; } }

function declaraNoEscopoGlobal(src, arquivo) {
  if (!acorn) return true;
  try {
    const ast = acorn.parse(src, { ecmaVersion: 2022 });
    return ast.body.some(n =>
      n.type === 'VariableDeclaration' ||
      n.type === 'FunctionDeclaration' ||
      n.type === 'ClassDeclaration');
  } catch (e) {
    console.error('  ! não consegui analisar ' + arquivo + ': ' + e.message);
    return true;
  }
}

function secaoPara(file, src) {
  if (declaraNoEscopoGlobal(src, file)) {
    return { global: true, texto: `\n/* ===== ${file} (escopo global) ===== */\n${src}\n;\n` };
  }
  return { global: false, texto: `\n/* ===== ${file} ===== */\ntry{\n${src}\n}catch(e){ if(typeof window!=='undefined'&&window.__DIGICOPY_FALHA) window.__DIGICOPY_FALHA(${JSON.stringify(file)}, e); }\n;\n` };
}

function main() {
  const modo = process.argv.includes('--apply') ? 'apply' : 'dry-run';
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const arquivos = manifest.filter(f => RE_AJUSTE.test(f));
  const faltando = arquivos.filter(f => !fs.existsSync(f));
  if (faltando.length) { console.error('Faltando: ' + faltando.join(', ')); process.exit(1); }

  const cabecalho = `// ═══════════════════════════════════════════════════════════════\n// ajustes_consolidados.js — GERADO por mesclar_ajustes.js; não editar.\n// ${arquivos.length} arquivos, mesma ordem do manifest, bytes preservados.\n// Edite o arquivo original e rode de novo (até a tarefa r55 apagar os 139).\n// ═══════════════════════════════════════════════════════════════\n`;
  let corpo = cabecalho;
  const indice = {};
  let globais = 0, isolados = 0;
  arquivos.forEach(f => {
    const src = fs.readFileSync(f, 'utf8');
    const s = secaoPara(f, src);
    if (s.global) globais++; else isolados++;
    const ini = Buffer.byteLength(corpo, 'utf8');
    corpo += s.texto;
    indice[f] = { ini, fim: Buffer.byteLength(corpo, 'utf8'), global: s.global };
  });

  console.log(`Arquivos: ${arquivos.length} (globais: ${globais}, isolados: ${isolados})`);
  console.log(`Tamanho do consolidado: ${(Buffer.byteLength(corpo, 'utf8') / 1024).toFixed(1)} KB`);

  // PROVA (dry-run): cada seção existe byte-a-byte no bundle atual.
  const bundle = fs.readFileSync('app.bundle.js', 'utf8');
  let ok = 0, falha = [];
  arquivos.forEach(f => {
    const src = fs.readFileSync(f, 'utf8');
    const s = secaoPara(f, src);
    if (bundle.indexOf(s.texto) >= 0) ok++;
    else falha.push(f);
  });
  console.log(`Seções idênticas ao bundle atual: ${ok}/${arquivos.length}`);
  if (falha.length) {
    console.error('DIVERGENTES (' + falha.length + '): ' + falha.slice(0, 10).join(', '));
    process.exit(1);
  }
  console.log('PROVA OK: o consolidado reproduz o bundle seção por seção.');

  if (modo === 'apply') {
    fs.writeFileSync(SAIDA, corpo);
    fs.writeFileSync(INDICE, JSON.stringify({ geradoEm: new Date().toISOString(), arquivos: indice }, null, 1));
    console.log('Escritos: ' + SAIDA + ' + ' + INDICE + ' (manifest intacto — r55 faz a troca)');
  } else {
    console.log('Dry-run: nada escrito. Use --apply para gerar os arquivos.');
  }
}

main();
