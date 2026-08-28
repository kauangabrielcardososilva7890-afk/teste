const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52229_nfe_ie_im_cnae_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const P=ctx.window.NFE_IE_IM_CNAE_PURE;

ok('lê os 3 campos', P.lerFiscal({ie:'123',im:'456',cnae:'4744-0/01'}).cnae==='4744001' && P.lerFiscal({ie:'123',im:'456',cnae:'4744001'}).im==='456');
ok('falta IM e CNAE', P.faltaDados({ie:'001'}).join(' ').indexOf('Municipal')>=0 && P.faltaDados({ie:'001'}).join(' ').indexOf('CNAE')>=0);
ok('completo não falta', P.faltaDados({ie:'001',im:'99',cnae:'4744001'}).length===0);
ok('CNAE 7 dígitos', P.soCnae('47.44-0/01')==='4744001');
ok('não pede senha', !/senhaA1|type=\"password\"/.test(src));
ok('ainda não SEFAZ', /não emite na SEFAZ/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52229_nfe_ie_im_cnae_patch.js'));
ok('versão 5.22.29+', /^5\.22\.(29|\d{2,})$/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.29 passou!');
