const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52233_escuro_login_nuvem_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const P=ctx.window.ESCURO_LOGIN_NUVEM_PURE;
const css=P.cssLoginNuvem();

ok('CSS do login', /#login-screen/.test(css));
ok('CSS da Nuvem', /#digicopy-cloud-modal/.test(css));
ok('não refaz o tema inteiro', !/\.neo-shell/.test(css) && !/\.module-row/.test(css));
ok('não muda a chave', !/localStorage\.setItem/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52233_escuro_login_nuvem_patch.js'));
ok('versão 5.22.33', pkg.version==='5.22.33' && html.includes('app.bundle.js?v=5.22.33'));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.33 passou!');
