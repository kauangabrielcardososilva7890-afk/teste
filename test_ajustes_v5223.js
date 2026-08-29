const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
console.log('== LIMPEZA FIREBASE + LOGIN ESCOLA LOCAL ==');
ok('firebase_config.js apagado',!fs.existsSync('firebase_config.js'));
ok('firebase_client.js apagado',!fs.existsSync('firebase_client.js'));
ok('teste do Firebase apagado',!fs.existsSync('test_firebase.js'));
const pkg=fs.readFileSync('package.json','utf8');
ok('check não aponta mais Firebase',!/firebase_config\.js/.test(pkg)&&!/firebase_client\.js/.test(pkg));
const runner=fs.readFileSync('test_runner.js','utf8');
ok('suíte não roda teste Firebase',!/test_firebase\.js/.test(runner));
const escola=fs.readFileSync('buscador_escola_patch.js','utf8');
ok('Buscador não tem senha no código',!/const SENHA=/.test(escola)&&!/txPassword:SENHA/.test(escola));
ok('Buscador não tem usuário fixo no código',!/const USUARIO=/.test(escola));
ok('login fica em arquivo local ou localStorage',/escola-login\.json/.test(fs.readFileSync('main.js','utf8'))&&/ESCOLA_LOGIN_KEY/.test(escola));
ok('login não vai para saveDB/config',!/db\.config\.escolaLogin/.test(escola)&&!/escolaSenha/.test(escola));
ok('preload expõe save local',/loginSave/.test(fs.readFileSync('preload.js','utf8')));
console.log('\nRESULTADO: Firebase removido e login do Buscador ficou local!');
