const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const orc=fs.readFileSync('ajustes_v52244_orcamentos_autorizar_patch.js','utf8');
const fin=fs.readFileSync('ajustes_v52244_financeiro_datas_patch.js','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const wpkg=JSON.parse(fs.readFileSync('cloudflare-worker/package.json','utf8'));

const O=load(orc).ORCAMENTOS_AUTORIZAR_V52244_PURE;
ok('autorizar vira aprovado com venda', O.aplicarDecisao({id:'o1',status:'aberto'},{status:'aprovado'}).status==='aprovado' && O.aplicarDecisao({id:'o1'},{status:'aprovado'}).vendaId==='vda_orc_o1');
ok('recusar exclui o orçamento', O.aplicarDecisao({id:'o1',status:'aberto'},{status:'recusado'}).status==='excluido');
ok('id da venda é estável', O.vendaIdDe({id:'abc'})==='vda_orc_abc');

const F=load(fin).FINANCEIRO_DATAS_V52244_PURE;
ok('datas visíveis', F.datasVisiveis===true);
ok('hoje não aplica De/Até', F.aplicaDatas('hoje')===false && F.aplicaDatas('abertos')===true && F.aplicaDatas('todos')===true);

ok('worker 0.4.5', /API_VERSION = '0.4.5'/.test(worker) && wpkg.version==='0.4.5');
ok('worker recusar exclui', /orc_del_/.test(worker) && /excluido: true/.test(worker));
ok('worker GET USED traz venda', /vendaNumero: found.data.vendaNumero/.test(worker));
ok('venda id estável no worker', /vda_orc_/.test(worker));
ok('consulta USED no app', /error==='USED'/.test(orc) && /puxarAprovacoes/.test(orc));
ok('De/Até deixam de ser hidden', /type='date'/.test(fin) && /neo-fin-de-lab/.test(fin));
ok('patches no bundle', manifest.includes('ajustes_v52244_orcamentos_autorizar_patch.js') && manifest.includes('ajustes_v52244_financeiro_datas_patch.js'));
ok('versão', /^5\.22\.\d+/.test(pkg.version) && /app\.bundle\.js\?v=5\.22\.\d+/.test(html) && /v5\.22\.\d+/.test(html));
ok('APK quieto', !/mobile\//.test(orc+fin));
console.log('\nRESULTADO: v5.22.44 passou!');
