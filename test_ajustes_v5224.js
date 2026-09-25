const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const escola=fs.readFileSync('buscador_escola_patch.js','utf8');
console.log('== LOGIN ESCOLA NA NUVEM ==');
ok('não tem senha no código',!/const SENHA=/.test(escola)&&!/const USUARIO=/.test(escola));
ok('grava em db.config.escolaAuth',/db\.config\.escolaAuth/.test(escola));
ok('usa saveDB para subir na nuvem',/escolaAuth[\s\S]{0,180}saveDB/.test(escola));
ok('botão fala nuvem',/Login na nuvem/.test(escola));
ok('lê primeiro da nuvem',/function loginDaNuvem/.test(escola)&&/loginDaNuvem\(\)/.test(escola));
console.log('\nRESULTADO: login do Buscador vai para a nuvem!');
