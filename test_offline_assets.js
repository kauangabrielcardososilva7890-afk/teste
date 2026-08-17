const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const html=fs.readFileSync('index.html','utf8');
const note=fs.readFileSync('notinha_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== ASSETS OFFLINE ==');
ok('Tailwind é local',/assets\/vendor\/tailwind\.min\.css/.test(html)&&!/cdn\.tailwindcss\.com/.test(html));
ok('ícones Phosphor são locais',/assets\/vendor\/phosphor\/style\.css/.test(html)&&!/unpkg\.com\/@phosphor/.test(html));
ok('Chart.js é local',/assets\/vendor\/chart\.umd\.js/.test(html)&&!/cdn\.jsdelivr\.net\/npm\/chart/.test(html));
ok('fontes Google não bloqueiam abertura',!/fonts\.googleapis\.com/.test(html)&&!/fonts\.googleapis\.com/.test(note));
ok('CSS Tailwind compilado existe',fs.statSync('assets/vendor/tailwind.min.css').size>30000);
ok('fonte de ícones existe',fs.statSync('assets/vendor/phosphor/Phosphor.woff2').size>100000);
ok('Chart global existe no pacote local',/globalThis|window/.test(fs.readFileSync('assets/vendor/chart.umd.js','utf8')));
ok('assets entram no build Electron',pkg.build.files.includes('assets/vendor/**/*'));
console.log('\nRESULTADO: dependências visuais offline passaram!');
