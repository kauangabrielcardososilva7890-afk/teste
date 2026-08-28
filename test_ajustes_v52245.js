const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const imp=fs.readFileSync('ajustes_v52245_impressora_serial_ocultar_patch.js','utf8');
const lei=fs.readFileSync('ajustes_v52245_leitura_apagar_patch.js','utf8');
const fin=fs.readFileSync('ajustes_v52245_financeiro_hist_datas_patch.js','utf8');
const rod=fs.readFileSync('ajustes_v52245_rodape_versao_patch.js','utf8');
const vda=fs.readFileSync('ajustes_v52245_venda_salvar_print_patch.js','utf8');
const vos=fs.readFileSync('vendas_os_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const I=load(imp).IMPRESSORA_SERIAL_OCULTAR_V52245_PURE;
const db={
  equipamentos:[{id:'e1',serie:'ABC123',contadorPB:900,empresaId:'emp'}],
  parque:[{id:'p1',equipamentoId:'e1',clienteId:'cliA',status:'ativo'}]
};
ok('serial acha equipamento', !!I.acharEquipPorSerial(db,'abc123','emp'));
ok('outro cliente ativo pede remanejo', !!I.parqueOutroCliente(db, db.equipamentos[0], 'cliB'));
ok('oculta em outro cliente também pede remanejo', !!I.parqueOutroCliente({
  equipamentos:db.equipamentos,
  parque:[{id:'p1',equipamentoId:'e1',clienteId:'cliA',status:'oculta'}]
}, db.equipamentos[0], 'cliB'));
ok('mesmo cliente não pede remanejo', !I.parqueOutroCliente(db, db.equipamentos[0], 'cliA'));
ok('aviso remanejo no texto', /impressora cadastrada em Escola X com o contador 900/.test(I.msgRemanejar('Escola X',900)));
ok('caixa ocultar no patch', /kr-imp-ocultar/.test(imp) && /status = 'oculta'/.test(imp));
ok('desocultar volta ativo', /kr-imp-desocultar/.test(imp) && /status = 'ativo'/.test(imp));
ok('aviso só no salvar', /confirmSistema/.test(imp) && /salvarImpressoraContrato/.test(imp));

const L=load(lei).LEITURA_APAGAR_V52245_PURE;
ok('apagar devolve contador anterior', L.contadorDepoisDeApagar({contadorPB:500,contadorCor:20},{contadorPBAnterior:200,contadorCorAnterior:10}).contadorPB===200);
ok('mensagem de apagar leitura', /Deseja apagar essa leitura/.test(L.mensagem) && /contadores voltar/.test(L.mensagem));
ok('deleteLeitura usa confirmSistema', /confirmSistema/.test(lei) && /deleteLeituraContrato/.test(lei));

const F=load(fin).FINANCEIRO_HIST_DATAS_V52245_PURE;
const refs=F.refsDoLancamento({vendaId:'v1',leituraId:'l1'},{
  vendas:[{id:'v1',numero:'88',osId:'os1'}],
  leituras:[{id:'l1',numero:'12'}],
  os:[{id:'os1',numero:'45',vendaId:'v1'}]
});
ok('histórico tem venda', refs.some(function(r){ return r.tipo==='venda' && r.codigo==='88'; }));
ok('histórico tem leitura', refs.some(function(r){ return r.tipo==='leitura' && r.codigo==='12'; }));
ok('histórico tem chamado da venda', refs.some(function(r){ return r.tipo==='chamado' && r.codigo==='45'; }));
ok('hoje não aplica De/Até', F.aplicaDatas('hoje')===false && F.aplicaDatas('abertos')===true);
ok('De/Até sempre visíveis', F.datasSempreVisiveis===true && /type='date'/.test(fin));

const R=load(rod).RODAPE_VERSAO_V52245_PURE;
ok('versão 5.22.45 no rodapé', R.VERSAO==='5.22.45' && /footer-version/.test(rod));

ok('vosGravarVenda no window', /window\.vosGravarVenda = vosGravarVenda/.test(vos));
ok('salvar fecha sem lfbAlert no mesmo modal', /gravarEFechar/.test(vda) && /closeModal\(true\)/.test(vda) && !/lfbAlert\('Salvo/.test(vda));
ok('some botão Sair', /tirarBotaoSair/.test(vda));
ok('faturar não imprime', /__vosFatSemPrint/.test(vda) && /vosConcluirFaturamento/.test(vda));

const patches=['ajustes_v52245_impressora_serial_ocultar_patch.js','ajustes_v52245_leitura_apagar_patch.js','ajustes_v52245_financeiro_hist_datas_patch.js','ajustes_v52245_rodape_versao_patch.js','ajustes_v52245_venda_salvar_print_patch.js'];
ok('patches no bundle', patches.every(function(f){ return manifest.includes(f); }));
ok('versão', /^5\.22\.\d+/.test(pkg.version) && /app\.bundle\.js\?v=5\.22\.\d+/.test(html) && /v5\.22\.\d+/.test(html) && /footer-version/.test(html));
ok('APK quieto', !/mobile\//.test(imp+lei+fin+rod+vda));
ok('sem nome pessoal novo', !/kauan/i.test((imp+lei+fin+rod+vda).replace(/__KAUAN_REFINO_STATE__/g,'')));
console.log('\nRESULTADO: v5.22.45 passou!');
