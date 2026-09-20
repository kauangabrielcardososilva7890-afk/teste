const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v5220_nfe_config_patch.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const preload=fs.readFileSync('preload.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.NFE_CONFIG_PURE;
console.log('== NF-E CONFIG v5.22.0 ==');
ok('exporta funções puras',!!P&&typeof P.salvarFiscal==='function');
ok('não grava senha do certificado',!/pfxPassword|senhaPfx|senhaA1|certPassword/.test(code));
ok('card fala que ainda não emite',/Ainda não emite nota/.test(code));
ok('certificado fica em userData/certs',main.includes('nfe-a1.pfx')&&main.includes('userData'));
ok('preload expõe nfeCertAPI',/nfeCertAPI/.test(preload));
ok('patch entra no bundle',manifest.includes('ajustes_v5220_nfe_config_patch.js'));
console.log('\nRESULTADO: preparação NF-e passou!');
