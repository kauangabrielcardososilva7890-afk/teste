const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const aviso=fs.readFileSync('ajustes_v52234_config_aviso_salvou_patch.js','utf8');
const ncm=fs.readFileSync('ajustes_v52234_ncm_produto_existente_patch.js','utf8');
const env=fs.readFileSync('envio_arquivos.html','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[ncm,aviso].join('\n'))(ctx.window,ctx.document);
const A=ctx.window.CONFIG_AVISO_SALVOU_PURE;
const N=ctx.window.NCM_PRODUTO_EXISTENTE_PURE;

ok('reconhece botão Salvar', A.ehBotaoSalvar({tagName:'BUTTON',textContent:'Salvar dados fiscais'})===true);
ok('ignora outro botão', A.ehBotaoSalvar({tagName:'BUTTON',textContent:'Atualizar'})===false);
ok('usa aviso do sistema', /lfbAlert/.test(aviso));

const ja={id:'p1',sku:'10',nome:'Chip',estoque:7,ncm:''};
const f=N.fundirNcm(ja,'85423991');
ok('grava só o NCM', f.mudou===true && f.rec.ncm==='85423991' && f.rec.estoque===7 && f.rec.nome==='Chip');
ok('igual não mexe', N.fundirNcm({ncm:'85423991'},'85423991').mudou===false);
ok('NCM curto não grava', N.fundirNcm({ncm:''},'123').mudou===false);

ok('página funde NCM', /function fundirNcm/.test(env) && /não duplica/.test(env));
ok('não regrava estoque no existente', /fundirNcm\(hit\.data/.test(env));
ok('patches no bundle', manifest.includes('ajustes_v52234_config_aviso_salvou_patch.js') && manifest.includes('ajustes_v52234_ncm_produto_existente_patch.js'));
ok('versão 5.22.34', pkg.version==='5.22.34' && html.includes('app.bundle.js?v=5.22.34'));
ok('APK quieto', !/mobile\//.test(aviso+ncm));
console.log('\nRESULTADO: v5.22.34 passou!');
