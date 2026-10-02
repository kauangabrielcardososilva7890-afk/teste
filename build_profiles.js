'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const PROFILES = {
  particularExe: { kind: 'exe', profile: 'particular-cloud', config: 'particular-exe.json', output: 'dist/particular-exe', label: 'Sistema principal particular — EXE' },
  particularApk: { kind: 'apk', profile: 'particular-cloud', output: 'dist/apk', apk: 'Digicopy-Particular.apk', label: 'Sistema principal particular — APK' },
  commercialExe: { kind: 'exe', profile: 'commercial-cloud', config: 'commercial-exe.json', output: 'dist/commercial-exe', label: 'Sistema comercial — EXE' },
  commercialApk: { kind: 'apk', profile: 'commercial-cloud', output: 'dist/apk', apk: 'Digicopy-Comercial.apk', label: 'Sistema comercial — APK' },
  commercialLocalExe: { kind: 'exe', profile: 'commercial-local', config: 'commercial-local-exe.json', output: 'dist/commercial-local-exe', label: 'Sistema comercial sem nuvem — EXE' },
  commercialLocalApk: { kind: 'apk', profile: 'commercial-local', output: 'dist/apk', apk: 'Digicopy-Comercial-Local.apk', label: 'Sistema comercial sem nuvem — APK' },
  managerExe: { kind: 'manager', label: 'Gerente — EXE' }
};

function run(command, args, options = {}) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const r = spawnSync(command, args, { cwd: options.cwd || ROOT, stdio: 'inherit', shell: false, env: { ...process.env, ...(options.env || {}) } });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`Comando falhou (${r.status}): ${command}`);
}
function node(script, args = [], options = {}) { run(process.execPath, [script, ...args], options); }
function npxBin() { return process.platform === 'win32' ? 'npx.cmd' : 'npx'; }
function gradleBin() { return process.platform === 'win32' ? 'gradlew.bat' : './gradlew'; }
function assertFile(file, label) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 1000) throw new Error(`${label} não foi gerado: ${file}`);
}
function cleanGeneratedReports() {
  for (const dir of ['e2e/playwright-report', 'e2e/test-results']) {
    fs.rmSync(path.join(ROOT, dir), { recursive: true, force: true });
  }
}
function buildExe(spec) {
  node('sync_build.js');
  node('build_bundle.js');
  run(npxBin(), ['electron-builder', '--win', '--x64', '--config', path.join('build', 'profiles', spec.config)], { env: { DIGICOPY_DIST: spec.output } });
  node('verify_pack.js', [], { env: { DIGICOPY_DIST: spec.output } });
  const installer = fs.readdirSync(path.join(ROOT, spec.output)).find(f => /\.exe$/i.test(f));
  assertFile(path.join(ROOT, spec.output, installer || ''), 'Instalador EXE');
  console.log(`\nPRONTO: ${spec.label}\nSaída: ${path.join(ROOT, spec.output, installer)}`);
}
function buildApk(spec) {
  node('sync-www.js', ['--profile', spec.profile], { cwd: path.join(ROOT, 'mobile') });
  run(npxBin(), ['cap', 'copy', 'android'], { cwd: path.join(ROOT, 'mobile') });
  run(gradleBin(), ['assembleRelease'], { cwd: path.join(ROOT, 'mobile', 'android') });
  const source = path.join(ROOT, 'mobile', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  assertFile(source, 'APK');
  const destDir = path.join(ROOT, spec.output);
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, spec.apk);
  fs.copyFileSync(source, dest);
  console.log(`\nPRONTO: ${spec.label}\nSaída: ${dest}`);
}
function buildManager() {
  const dir = path.join(ROOT, 'gerente-atualizacoes');
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'], { cwd: dir });
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build:win'], { cwd: dir });
  const exe = fs.readdirSync(path.join(dir, 'dist')).find(f => /\.exe$/i.test(f));
  assertFile(path.join(dir, 'dist', exe || ''), 'Gerente EXE');
  console.log(`\nPRONTO: ${PROFILES.managerExe.label}\nSaída: ${path.join(dir, 'dist', exe)}`);
}
function main() {
  const key = process.argv[2];
  if (!PROFILES[key]) {
    console.error('Uso: node build_profiles.js <particularExe|particularApk|commercialExe|commercialApk|commercialLocalExe|commercialLocalApk|managerExe>');
    process.exit(2);
  }
  cleanGeneratedReports();
  const spec = PROFILES[key];
  if (spec.kind === 'exe') buildExe(spec);
  else if (spec.kind === 'apk') buildApk(spec);
  else buildManager();
}
try { main(); } catch (e) { console.error(`\nFALHA NO EMPACOTAMENTO: ${e.message}`); process.exit(1); }
