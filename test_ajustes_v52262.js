const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}
const src=fs.readFileSync('ajustes_v52262_orcamento_uma_vez_loop_patch.js','utf8');
const a57=fs.readFileSync('ajustes_v52257_orcamento_sync_total_patch.js','utf8');
const a58=fs.readFileSync('ajustes_v52258_orcamento_os_revalidar_patch.js','utf8');
const a55=fs.readFileSync('ajustes_v52255_orcamento_aprovacao_venda_patch.js','utf8');
const a61=fs.readFileSync('ajustes_v52261_orcamento_nao_volta_patch.js','utf8');
const a44=fs.readFileSync('ajustes_v52244_orcamentos_autorizar_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const P=load(src).ORCAMENTO_UMA_VEZ_V52262_PURE;
ok('versao', P.VERSAO==='5.22.62' && /^5\.22\.\d+/.test(pkg.version));
ok('gera uma vez', P.geraUmaVez===true && /vendaGeradaUmaVez/.test(a58+a57+a55));
ok('apagou venda nao recria', /vendaExcluidaPeloUsuario = true;\n      return null/.test(a58) || /vendaExcluidaPeloUsuario = true/.test(a58));
ok('sem poll 3s', !/setInterval\(verificarAprovacoesNuvem, 3000\)/.test(a57+a58));
ok('sem poll 4s', !/setInterval\(verificarAprovacoesNuvem, 4000\)/.test(a55));
ok('sem varrer 2.5s', !/setInterval\(varrerRessuscitadas/.test(a61));
ok('sem poll 20s', !/setInterval\(puxarAprovacoes, 20000\)/.test(a44));
ok('nao redesenha tela', !/abrirTelaOrcamento/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52262_orcamento_uma_vez_loop_patch.js'));
ok('index', new RegExp('ajustes_v52262_orcamento_uma_vez_loop_patch\\.js\\?v='+pkg.version.replace(/\./g,'\\.')).test(html));
ok('APK quieto', src.indexOf('mobile/')<0);
console.log('\nRESULTADO: v5.22.62 passou!');
