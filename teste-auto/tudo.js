#!/usr/bin/env node
// teste-auto/tudo.js — TUDO JUNTO NO RELATÓRIO (r62). Roda com: npm run teste-tudo
// Executa separado (suíte não espera navegador), junta no veredito:
//   1) npm test (lê ✅/❌ por tema)  2) auditoria.js  3) navegador.js (se houver)
// Escreve teste-auto/VEREDITO.md e sai 1 se algo falhou.
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const RAIZ = path.join(__dirname, '..');
const ESTADO = path.join(__dirname, '.estado');

console.log('══ 1/3 suíte (código) ══');
const suite = cp.spawnSync(process.execPath, ['test_runner.js'], { cwd: RAIZ, encoding: 'utf8' });
const outSuite = (suite.stdout || '') + (suite.stderr || '');
const temasOk = (outSuite.match(/✅ test_msg_/g) || []).length;
const temasFalha = (outSuite.match(/❌ test_msg_/g) || []).length;
console.log('suíte: ' + temasOk + ' ok, ' + temasFalha + ' falha');

console.log('══ 2/3 auditoria (repo + ar) ══');
const aud = cp.spawnSync(process.execPath, [path.join(__dirname, 'auditoria.js')], { cwd: RAIZ, encoding: 'utf8' });
process.stdout.write(aud.stdout || '');
let autoChecks = [];
try { autoChecks = (JSON.parse(fs.readFileSync(path.join(ESTADO, 'ultimo.json'), 'utf8')).checks) || []; }
catch (e) { autoChecks = []; }
const autoFalha = autoChecks.filter(c => c.status === 'FALHOU').length;

console.log('══ 3/3 navegador (visual) ══');
const nav = cp.spawnSync(process.execPath, [path.join(__dirname, 'navegador.js')], { cwd: RAIZ, encoding: 'utf8' });
let navRes = { disponivel: false };
try { navRes = JSON.parse((nav.stdout || '').trim().split('\n').pop()); } catch (e) {}
let navDet = null;
try { navDet = JSON.parse(fs.readFileSync(path.join(ESTADO, 'navegador.json'), 'utf8')); } catch (e) {}
const navFalha = navRes.disponivel && navDet
  ? (navDet.p0modal ? 1 : 0) + navDet.telas.filter(t => !t.ok && !t.pulado).length : 0;

const L = [];
L.push('# VEREDITO — suíte + auditoria + visual');
L.push('');
L.push('Quando: ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC · alvo: ' + (process.env.ALVO_URL || 'site publicado'));
L.push('');
L.push('| frente | resultado | detalhe |');
L.push('|---|---|---|');
L.push('| suíte (código) | ' + (temasFalha ? '❌ FALHOU' : '✅ OK') + ' | ' + temasOk + ' temas ok, ' + temasFalha + ' com falha |');
L.push('| auditoria (repo+ar) | ' + (autoFalha ? '❌ FALHOU' : '✅ OK') + ' | ' + autoChecks.filter(c => c.status === 'OK').length + ' ok, ' + autoFalha + ' falha, ' + autoChecks.filter(c => c.status === 'SEM REDE').length + ' sem rede |');
L.push('| navegador (visual) | ' + (!navRes.disponivel ? '⏭️ PULADO' : (navFalha ? '❌ FALHOU' : '✅ OK')) + ' | ' +
  (!navRes.disponivel ? (navRes.motivo || 'sem playwright') : (navDet.telas.length + ' telas, P0-modal:' + (navDet.p0modal === null ? 'n/t' : (navDet.p0modal ? 'SIM' : 'não')) + ', erros console:' + navDet.errosConsole.length + ', rodapé:' + (navDet.versaoRodape || 'n/l'))) + ' |');
L.push('');
const falhou = (temasFalha + autoFalha + navFalha) > 0;
L.push('**Veredito: ' + (falhou ? '❌ FALHOU — ver detalhe acima' : '✅ TUDO CERTO') + '**');
L.push('');
fs.writeFileSync(path.join(__dirname, 'VEREDITO.md'), L.join('\n'));
console.log('');
console.log(L[L.length - 2]);
process.exit(falhou ? 1 : 0);
