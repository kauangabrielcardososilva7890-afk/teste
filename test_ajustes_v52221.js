const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const men=fs.readFileSync('ajustes_v52221_menus_dispositivo_patch.js','utf8');
const nfe=fs.readFileSync('ajustes_v52221_nfe_permissao_patch.js','utf8');
const imp=fs.readFileSync('ajustes_v52221_import_produtos_patch.js','utf8');
const cer=fs.readFileSync('ajustes_v52221_cert_nuvem_a1_patch.js','utf8');
const htmlEnv=fs.readFileSync('envio_arquivos.html','utf8');
const main=fs.readFileSync('main.js','utf8');
const preload=fs.readFileSync('preload.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[men,nfe,imp,cer].join('\n'))(ctx.window,ctx.document);
const M=ctx.window.MENUS_DISPOSITIVO_PURE;
const P=ctx.window.NFE_PERMISSAO_PURE;
const I=ctx.window.IMPORT_PRODUTOS_PURE;
const C=ctx.window.CERT_A1_NUVEM_PURE;

console.log('== MENUS DISPOSITIVO ==');
ok('chave local', M.KEY_MENUS.indexOf('dispositivo')>0);
ok('não é menu da faixa', /Editar menus/.test(men) && /ui-menus-dispositivo/.test(men));
ok('grava no localStorage', /localStorage/.test(men) && /tirarDaNuvem/.test(men));

console.log('== PERMISSÃO NF ==');
ok('Admin/Dono editam caixa', P.podeEditarCaixaNfe({perfil:'Admin'})===true && P.podeEditarCaixaNfe({perfil:'Dono'})===true);
ok('funcionário não edita', P.podeEditarCaixaNfe({perfil:'Funcionário'})===false);
ok('só marcado emite', P.podeEmitirNfe({podeEmitirNfe:true})===true && P.podeEmitirNfe({perfil:'Admin'})===false);

console.log('== IMPORT PRODUTOS ==');
ok('lê array', I.linhasDeJson([{CODIGO:1}]).length===1);
ok('lê data', I.linhasDeJson({data:[{CODIGO:1}]}).length===1);
ok('sku e nome', I.skuDe({CODIGO:'10'})==='10' && I.nomeDe({DESCRICAO:'Toner'})==='Toner');
const cats=I.mapaCategorias([{PRC_CODIGO:'2',PRC_DESCRICAO:'Chip'}]);
ok('categoria da tabela', I.mapearProduto({CODIGO:'1',DESCRICAO:'X',COD_CATEGORIA:'2'},cats).categoria==='Chip');
const ded=I.dedupePorSku([{sku:'1',nome:'A'}],[{sku:'1',nome:'B'},{sku:'2',nome:'C'}]);
ok('dedupe por sku', ded.filter(x=>x.tipo==='upd').length===1 && ded.filter(x=>x.tipo==='new').length===1);

console.log('== A1 NUVEM ==');
ok('aceita pfx', C.podeEnviarA1('loja.pfx',8000).ok===true);
ok('recusa p7b', C.podeEnviarA1('pub.p7b',8000).ok===false);
ok('página pede pfx e não campo de senha', /accept="\.pfx,\.p12"/.test(htmlEnv) && !/id="pass"|senhaA1|type="password"/.test(htmlEnv));
ok('página não emite SEFAZ', /não é enviada à SEFAZ|Ainda não emite/.test(htmlEnv));
ok('main assina com pfxB64', /pfxB64/.test(main) && /pfxB64/.test(preload));
ok('some botão local', /nfe-cert-import/.test(cer) && /display = 'none'/.test(cer));

ok('patches no bundle', manifest.includes('ajustes_v52221_menus_dispositivo_patch.js') && manifest.includes('ajustes_v52221_cert_nuvem_a1_patch.js'));
ok('versão 5.22.21+', /^5\.22\.(2[1-9]|\d{2,})$/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', ![men,nfe,imp,cer,htmlEnv].some(s=>/mobile\//.test(s)));

console.log('\nRESULTADO: v5.22.21 passou!');
