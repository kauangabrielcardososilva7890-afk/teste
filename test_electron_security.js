const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const main=fs.readFileSync('main.js','utf8');
const preload=fs.readFileSync('preload.js','utf8');
console.log('== ELECTRON SECURITY ==');
ok('nodeIntegration desligado',/nodeIntegration:\s*false/.test(main));
ok('contextIsolation ligado',/contextIsolation:\s*true/.test(main));
ok('sandbox ligado na principal e popups',(main.match(/sandbox:\s*true/g)||[]).length>=2);
ok('webSecurity ligado',(main.match(/webSecurity:\s*true/g)||[]).length>=2);
ok('conteúdo inseguro bloqueado',/allowRunningInsecureContent:\s*false/.test(main));
ok('navegação HTTP externa bloqueada',/will-navigate/.test(main)&&/startsWith\('file:\/\/'\)/.test(main));
ok('window.open externo não recebe preload',/url !== 'about:blank'/.test(main)&&/action:'deny'/.test(main));
ok('preload usa contextBridge',/contextBridge\.exposeInMainWorld/.test(preload));
console.log('\nRESULTADO: segurança Electron passou!');
