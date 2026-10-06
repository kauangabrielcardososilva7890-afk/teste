#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// MUDAR A VERSÃO DO SISTEMA — um comando, sem esquecer nada.
//
// Ordem do dono (22/09/2026): "eu quero que você vai atualizando conforme as
// atualizações vai jogando". Ou seja: cada publicação precisa ter versão nova
// no rodapé e no carimbo do arquivo. Antes isso era feito à mão (package.json,
// índice, builds) e dava para esquecer — este script faz o serviço completo.
//
//   npm run versao            → sobe um número (6.1.5 → 6.1.6) e sincroniza
//   npm run versao -- 6.2.0   → fixa a versão que você quiser
//   npm run versao -- --check → só mostra a versão de agora, sem mexer
//
// O que ele faz, nesta ordem:
//   1) grava a versão no package.json (é de lá que o app lê a versão do rodapé)
//   2) roda o sync_build (carimba o index.html das 3 cópias)
//   3) lembra o que falta rodar (build do bundle e testes) — sem fazer sozinho
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = __dirname;
const PKG = path.join(RAIZ, 'package.json');
const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
const atual = String(pkg.version || '0.0.0');
const arg = String(process.argv[2] || '').trim();

function novaVersaoDe(v) {
  const partes = v.split('.').map(n => parseInt(n, 10) || 0);
  while (partes.length < 3) partes.push(0);
  partes[2] += 1;
  return partes.join('.');
}

if (arg === '--check' || arg === '-c') {
  console.log('Versão de agora: v' + atual);
  process.exit(0);
}

const nova = /^\d+\.\d+\.\d+$/.test(arg) ? arg : novaVersaoDe(atual);
if (nova === atual) {
  console.log('A versão já é v' + atual + '. Nada a fazer.');
  process.exit(0);
}

pkg.version = nova;
fs.writeFileSync(PKG, JSON.stringify(pkg, null, 2) + '\n');
console.log('▶ Versão: v' + atual + ' → v' + nova + '  (package.json)');

try {
  execFileSync(process.execPath, [path.join(RAIZ, 'sync_build.js')], { cwd: RAIZ, stdio: 'inherit' });
} catch (e) {
  console.error('⚠ O sync_build falhou. Rode "npm run sync" e depois "npm run bundle".');
  process.exit(1);
}

console.log('\nPronto. Agora, para publicar com o rodapé e o carimbo certos:');
console.log('   npm run bundle       (gera o app.bundle.js com o código novo)');
console.log('   npm run sync         (carimba de novo, já com o bundle novo)');
console.log('   npm test             (a suíte inteira)');
console.log('   npm run guardar      (salva e envia para o GitHub)');
console.log('\nO rodapé mostra v' + nova + ' + o carimbo curto do app.bundle.js — os dois batem com o que foi publicado.');
