const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52231_modo_escuro_visual_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const P=ctx.window.MODO_ESCURO_VISUAL_PURE;
const css=P.cssEscuro();

ok('exporta CSS', typeof P.cssEscuro==='function' && css.length>400);
ok('não pinta impressão', /@media print/.test(css) && /@media screen/.test(css));
ok('contraste do azul', /#5b8cff|#2563eb|#93c5fd/.test(css));
ok('não muda a chave do aparelho', !/localStorage\.setItem/.test(src));
ok('substitui o CSS existente', /digi-escuro-css/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52231_modo_escuro_visual_patch.js'));
ok('versão 5.22.31', pkg.version==='5.22.31' && html.includes('app.bundle.js?v=5.22.31'));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.31 passou!');
