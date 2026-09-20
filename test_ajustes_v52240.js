const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52240_orcamento_pages_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

function load(srcTxt){
  const ctx={window:{ORCAMENTOS_V52238_PURE:{
    payloadLink:function(o){return {n:o.numero};},
    b64url:function(){return 'abc';}
  }},document:undefined};
  new Function('window','document',srcTxt)(ctx.window,ctx.document);
  return ctx.window;
}

const P=load(src).ORCAMENTOS_V52240_PURE;
const link=P.linkDe({numero:'12'},{nome:'Maria'},{});
ok('usa o Pages do orçamento', link.indexOf('https://digicopy-orcament.pages.dev/')===0);
ok('leva os dados na URL', /\?d=/.test(link));
ok('não é o Pix', link.indexOf('digicopy-pix.pages.dev')<0);
ok('não é GitHack', link.indexOf('githack')<0);
ok('patch no bundle', manifest.includes('ajustes_v52240_orcamento_pages_patch.js'));
ok('versão no patch', /v5.22.40/.test(src));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.40 passou!');
