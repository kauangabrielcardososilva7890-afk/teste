const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52236_codigo_cliente_exato_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const P=ctx.window.CODIGO_CLIENTE_EXATO_PURE;
const list=[{codigo:48,nome:'A'},{codigo:480,nome:'B'},{codigo:'1048',nome:'C'},{codigo:'048',nome:'D'}];

ok('48 não pega 480 nem 1048', P.filtraCodigoExato(list,'48','codigo').map(c=>c.nome).join()==='A,D');
ok('outros campos não filtra aqui', P.filtraCodigoExato(list,'48','nome')===null);
ok('048 = 48', P.codigoIgual('048','48')===true && P.codigoIgual(480,'48')===false);
ok('patch no bundle', manifest.includes('ajustes_v52236_codigo_cliente_exato_patch.js'));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.36 passou!');
