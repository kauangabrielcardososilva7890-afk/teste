const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const fin=fs.readFileSync('ajustes_v52213_financeiro_receber_patch.js','utf8');
const men=fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',fin+'\n'+men)(ctx.window,ctx.document);
const F=ctx.window.FINANCEIRO_RECEBER_PURE;
const M=ctx.window.MENUS_ATALHOS_PURE;

console.log('== FINANCEIRO RECEBER ==');
ok('formas sem A prazo', F.FORMAS_BAIXA.indexOf('Prazo')<0 && F.FORMAS_BAIXA.indexOf('Pix')>=0);
ok('Pix na baixa', F.FORMAS_BAIXA.includes('Pix'));
ok('addMeses jan->fev', F.addMeses('2026-01-31',1)==='2026-02-28' || F.addMeses('2026-01-31',1)==='2026-02-29');
ok('addMeses 10/01 -> 10/02', F.addMeses('2026-01-10',1)==='2026-02-10');
const reps=F.montarRepeticoes({descricao:'Aluguel',valor:100,clienteId:'c1',vencimento:'2026-03-10'},3);
ok('repetir 3', reps.length===3 && reps[0].descricao==='Aluguel' && reps[2].vencimento==='2026-05-10');
const cr={status:'aberto'};
F.aplicarBaixaTitulo(cr,'Pix','2026-08-19T12:00:00.000Z');
ok('Pix baixa de verdade', cr.status==='pago' && cr.formaPagamento==='Pix' && cr.pagamentoData);

ok('some Novo recebimento do menu HTML', !/Novo recebimento/i.test(html));
ok('Contas e caixas no HTML', /Contas e caixa/i.test(html));
ok('Receber junto da lixeira', /finAcaoReceber/.test(fin) && /btn-del-lote/.test(fin));
ok('sem status no novo lançamento', !/f-cr-status/.test(fin) && /fin-novo-desc/.test(fin));
ok('cliente lupa/Enter', /finBuscarCliente/.test(fin) && /Enter/.test(fin));
ok('não filtra ao digitar no cliente', !/oninput=\"window.finBuscarCliente/.test(fin));

console.log('== MENUS E ATALHOS ==');
ok('limite de nome', M.limitarNome('Configurações do sistema inteiro',18).length<=18);
const pad=M.menusPadrao();
const loc=pad.find(x=>x.id==='locacao');
ok('locação sem Chamados', loc && loc.items.every(it=>!/chamado/i.test(it.label)));
const at=pad.find(x=>x.id==='atendimento');
ok('atendimento tem chamado', at && at.items.some(it=>/chamado/i.test(it.label)));
const finMenu=pad.find(x=>x.id==='financeiro');
ok('financeiro só contas e caixas', finMenu && finMenu.items.length===1 && /contas e caixas/i.test(finMenu.items[0].label));
const moved=M.moverItem(['a','b','c'],2,0);
ok('mover ordem', moved[0]==='c' && moved[1]==='a');
const aplicado=M.aplicarNomesSalvos(pad,{ordem:['config','inicio'],nomes:{config:'Ajustes'}});
ok('config pode ir para o começo', aplicado[0].id==='config' && aplicado[0].label==='Ajustes');
ok('atalhos padrão', M.atalhosPadrao().length>=3);

ok('patch financeiro no bundle', manifest.includes('ajustes_v52213_financeiro_receber_patch.js'));
ok('patch menus no bundle', manifest.includes('ajustes_v52213_menus_atalhos_patch.js'));
ok('patches 5.22.13 no bundle', manifest.includes('ajustes_v52213_financeiro_receber_patch.js') && manifest.includes('ajustes_v52213_menus_atalhos_patch.js'));
ok('APK quieto', !/mobile/.test(fin+men));

console.log('\nRESULTADO: v5.22.13 passou!');
