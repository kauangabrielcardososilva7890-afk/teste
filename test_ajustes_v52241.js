const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52241_venda_salvar_fechar_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const gitignore=fs.readFileSync('.gitignore','utf8');

function load(s){
  const ctx={window:{},document:undefined};
  new Function('window','document',s)(ctx.window,ctx.document);
  return ctx.window;
}
const P=load(src).V52241_VENDA_SALVAR_PURE;
ok('sem cliente não grava', P.precisaCliente({})===false);
ok('com cliente grava', P.precisaCliente({cliente:{id:'1'}})===true);
ok('salvar fecha', /gravarEFechar/.test(src) && /closeModal\(true\)/.test(src));
ok('fechar salva sem pergunta', /telaVenda/.test(src) && !/Deseja salvar esta venda/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52241_venda_salvar_fechar_patch.js'));
ok('versão no patch', /v5.22.41/.test(src) && /^5\.22\.\d+/.test(pkg.version));
ok('zip ignorado', /\*\.zip/.test(gitignore));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.41 passou!');
