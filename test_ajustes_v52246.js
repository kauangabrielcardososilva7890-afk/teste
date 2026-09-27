const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const ui=fs.readFileSync('ajustes_v52246_nuvem_nao_autorizar_patch.js','utf8');
const motor=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const P=load(ui).NUVEM_NAO_AUTORIZAR_V52246_PURE;
ok('nuvem não é apagada', P.nuvemIntocada===true);
ok('nuvem vazia recusa', P.recusaNuvemVazia(0)===true && P.recusaNuvemVazia(10)===false);
ok('só some o que a nuvem não tem', P.planNaoAutorizarLocal(['clientes|a','clientes|b','vendas|1'], {'clientes|a':true}).join(',')==='clientes|b,vendas|1');
ok('motor descarta local e puxa nuvem', /discardLocalKeepCloud/.test(motor) && /antes_nao_autorizar_local/.test(motor));
ok('sem botão, sem chamada (motor testado acima, intacto)', !/reset-cloud/.test(ui) && !/discardLocalKeepCloud/.test(ui));
ok('fila antiga não sobe', /outbox=\[\]/.test(motor) || /outbox = \[\]/.test(motor));
ok('motor despausa e sincroniza (botão saiu, motor ficou)', /paused=false/.test(motor));
ok('sem botão, sem avisos na tela', (ui.match(/confirmSistema/g)||[]).length===0);
ok('botão saiu do painel (r46)', !/dc-nao-autorizar-local/.test(ui));
ok('patch no bundle', manifest.includes('ajustes_v52246_nuvem_nao_autorizar_patch.js'));
ok('versão', /^\d+\.\d+\.\d+/.test(pkg.version) && /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && /v\d+\.\d+\.\d+/.test(html));
ok('APK quieto', !/mobile\//.test(ui));
ok('sem nome pessoal novo', !/kauan/i.test(ui.replace(/__KAUAN_REFINO_STATE__/g,'')));
console.log('\nRESULTADO: v5.22.46 passou!');
