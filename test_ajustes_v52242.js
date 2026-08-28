const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

function load(src, extra){
  const ctx={window:Object.assign({}, extra||{}),document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const orc=fs.readFileSync('ajustes_v52242_orcamentos_status_patch.js','utf8');
const sort=fs.readFileSync('ajustes_v52242_contratos_sort_patch.js','utf8');
const rem=fs.readFileSync('ajustes_v52242_impressora_remanejar_patch.js','utf8');
const fin=fs.readFileSync('ajustes_v52242_financeiro_filtros_patch.js','utf8');
const menu=fs.readFileSync('ajustes_v52242_financeiro_menu_patch.js','utf8');
const geral=fs.readFileSync('ajustes_v52242_menu_versao_boleto_patch.js','utf8');
const pag=fs.readFileSync('public-orcamento/index.html','utf8');
const pag2=fs.readFileSync('orcamento_pagar.html','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const S=load(orc).ORCAMENTOS_STATUS_V52242_PURE;
ok('aberto não é autorizado', S.rotuloStatus({status:'aberto'})==='Aberto');
ok('aprovado é Autorizado', S.rotuloStatus({status:'aprovado'})==='Autorizado');
ok('recusado é Não autorizado', S.rotuloStatus({status:'recusado'})==='Não autorizado');

const C=load(sort).CONTRATOS_SORT_V52242_PURE;
ok('1º clique A→Z', C.proximaDir('codigo','asc','cliente')==='asc');
ok('2º clique Z→A', C.proximaDir('cliente','asc','cliente')==='desc');
ok('3º volta A→Z', C.proximaDir('cliente','desc','cliente')==='asc');
ok('ordena desc no dado', C.ordenarLista([{n:1},{n:3},{n:2}], function(x){return x.n;}, 'desc').map(function(x){return x.n;}).join(',')==='3,2,1');

const R=load(rem).IMPRESSORA_REMANEJAR_V52242_PURE;
const db={
  equipamentos:[{id:'e1',serie:'ABC123',contadorPB:900,empresaId:'emp'}],
  parque:[{id:'p1',equipamentoId:'e1',clienteId:'cliA',status:'ativo'}]
};
ok('serial acha equipamento', !!R.acharEquipPorSerial(db,'abc123','emp'));
ok('outro cliente ativo', !!R.parqueAtivoOutroCliente(db, db.equipamentos[0], 'cliB'));
ok('mesmo cliente não pede remanejo', !R.parqueAtivoOutroCliente(db, db.equipamentos[0], 'cliA'));
ok('texto do aviso', /impressora cadastrada em Escola X com o contador 900/.test(R.msgRemanejar('Escola X',900)));
ok('snapshot congelado', R.snapshotFrozen(db.equipamentos[0], db.parque[0]).contadorPB===900);

const F=load(fin).FINANCEIRO_V52242_PURE;
ok('filtros sem boleto/obs', F.CAMPOS.every(function(it){ return !/boleto|documento|observa/i.test(it[1]); }) && F.CAMPOS.some(function(it){ return it[0]==='cod_caixa'; }));
ok('código exato 48≠480', F.codigoNorm('048')==='48' && F.codigoNorm('48')!==F.codigoNorm('480'));
ok('por valor igual', F.valorIgual(10,'10,00') && !F.valorIgual(10,10.5));
const lanc=[{ref:{status:'aberto',criadoEm:'2026-08-27T10:00:00Z',valor:50,codigo:'77',clienteId:'c1'}}];
ok('hoje pega criadoEm', F.filtraLancamentos(lanc,{modo:'hoje',hoje:'2026-08-27'}).length===1);
ok('hoje de outro dia some', F.filtraLancamentos(lanc,{modo:'hoje',hoje:'2026-08-26'}).length===0);
ok('cod caixa exato', F.filtraLancamentos(lanc,{modo:'todos',campo:'cod_caixa',q:'77'}).length===1);
ok('cod caixa 7 não pega 77', F.filtraLancamentos(lanc,{modo:'todos',campo:'cod_caixa',q:'7'}).length===0);

const M=load(menu).FINANCEIRO_MENU_V52242_PURE;
ok('some submenu financeiro', (M.semSubmenuFinanceiro([{id:'financeiro',items:[{id:'x'}]}])[0].items||[]).length===0);

const G=load(geral).MENU_VERSAO_BOLETO_V52242_PURE;
ok('versão 5.22.42', G.VERSAO==='5.22.42');
ok('módulo financeiro marca a tela', G.moduloAberto('financeiro',"navigateTo('financeiro')")===true);
ok('página pede tem certeza', /Tem certeza\?/.test(pag) && /Tem certeza\?/.test(pag2));
ok('página trata link usado', /não vale mais/.test(pag));
ok('worker GET recusa já decidido', /error: 'USED'/.test(worker) && /ALREADY_DECIDED/.test(worker));
ok('worker não reabre venda no POST', !/if \(data\.status === 'aprovado' && data\.vendaNumero\)/.test(worker));
ok('sem submenu Contas e caixas no HTML', !/Contas e caixas/.test(html));
ok('versão no rodapé', /v5\.22\.\d+/.test(html));
ok('patches no bundle', ['ajustes_v52242_orcamentos_status_patch.js','ajustes_v52242_contratos_sort_patch.js','ajustes_v52242_impressora_remanejar_patch.js','ajustes_v52242_financeiro_filtros_patch.js','ajustes_v52242_financeiro_menu_patch.js','ajustes_v52242_menu_versao_boleto_patch.js'].every(function(f){ return manifest.includes(f); }));
ok('versão no patch', /v5.22.42/.test(orc) && /v5.22.42/.test(fin) && /^5\.22\.\d+/.test(pkg.version) && /app\.bundle\.js\?v=5\.22\.\d+/.test(html));
ok('APK quieto', !/mobile\//.test(orc+sort+rem+fin+menu+geral));
ok('sem nome pessoal novo', !/kauan/i.test((orc+rem+fin+menu+geral).replace(/__KAUAN_REFINO_STATE__/g,'')));
console.log('\nRESULTADO: v5.22.42 passou!');
