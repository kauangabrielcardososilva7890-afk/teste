const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}
const src=fs.readFileSync('ajustes_v52261_orcamento_nao_volta_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const P=load(src).ORCAMENTO_NAO_VOLTA_V52261_PURE;
const db={
  orcamentos:[{id:'o1',token:'tok1',status:'aprovado',vendaId:'v1'}],
  vendas:[{id:'v1',origemOrcamentoId:'o1',numero:'10'}],
  __orcBloqueio:{orcIds:[],tokens:[],vendaIds:[],orcSemRecriarVenda:[]}
};
ok('versao', P.VERSAO==='5.22.61' && pkg.version==='5.22.61');
ok('orcamento aberto nao bloqueia', P.orcamentoBloqueado({id:'o2',status:'aberto'}, db)===false);
P.marcarOrcamentoExcluido(db.orcamentos[0], db);
ok('orcamento excluido nao volta', P.orcamentoBloqueado(db.orcamentos[0], db)===true);
ok('venda do orcamento excluido some', P.vendaPodeFicar(db.vendas[0], db)===false);
ok('nao recria venda', P.naoRecriarVenda(db.orcamentos[0], db)===true);

const db2={
  orcamentos:[{id:'o9',token:'tok9',status:'aprovado',vendaId:'v9'}],
  vendas:[{id:'v9',origemOrcamentoId:'o9',numero:'11'}],
  __orcBloqueio:{orcIds:[],tokens:[],vendaIds:[],orcSemRecriarVenda:[]}
};
P.marcarVendaExcluida(db2.vendas[0], db2);
ok('apagou venda nao recria', P.naoRecriarVenda(db2.orcamentos[0], db2)===true);
ok('orcamento autorizado continua na lista', P.orcamentoPodeFicar(db2.orcamentos[0], db2)===true);
ok('venda apagada nao volta', P.vendaPodeFicar(db2.vendas[0], db2)===false);
ok('aviso no sino sem popup', P.avisoNoSino===true && P.semPopup===true && /notificarEvento/.test(src) && /lfbAlert/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52261_orcamento_nao_volta_patch.js') && manifest[manifest.length-1]==='ajustes_v52261_orcamento_nao_volta_patch.js');
ok('index carrega o patch', /ajustes_v52261_orcamento_nao_volta_patch\.js\?v=5\.22\.61/.test(html));
ok('rodape 5.22.61', /v5\.22\.61/.test(html));
ok('APK quieto', src.indexOf('mobile/')<0);
console.log('\nRESULTADO: v5.22.61 passou!');
