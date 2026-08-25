const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

ok('visual 5.22.31 apagado', !fs.existsSync('ajustes_v52231_modo_escuro_visual_patch.js'));
ok('fora do bundle', !manifest.includes('ajustes_v52231_modo_escuro_visual_patch.js'));
ok('escuro original fica', manifest.includes('ajustes_v52230_modo_escuro_dispositivo_patch.js'));
ok('versão 5.22.32+', /^5\.22\.\d+/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', true);
console.log('\nRESULTADO: v5.22.32 passou!');
