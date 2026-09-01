const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ler=f=>fs.readFileSync(f,'utf8');
console.log('== AJUSTES v5.22.68 ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));

// 1.3 — a faixa azul de módulos não passa mais da borda
const menus=ler('menus_tela_pequena_patch.js');
ok('1.3 faixa de módulos ganha rolagem própria',/digi-row-rola/.test(menus)&&/overflow-x:auto/.test(menus));
ok('1.3 menu aberto sai do recorte da faixa',/position:fixed/.test(menus)&&/posicaoDoMenu/.test(menus));

// 1.4 — técnicos de demonstração não voltam sozinhos
const app=ler('app.js');
ok('1.4 seed não traz técnico de demonstração',/tecnicos:\s*\[\]/.test(app));
ok('1.4 sistema sabe reconhecer o técnico de demonstração',/ehTecnicoDemo/.test(app)&&/TECNICOS_DEMO/.test(app));

// 2.1 — impressão da OS nunca é bloqueada
const v37=ler('ajustes_v52237_vendas_os_visual_patch.js');
ok('2.1 salvar não exige mais técnico',/function wrapGravar\(\)\{ \/\* sem trava \*\/ \}/.test(v37));
ok('2.1 aviso do técnico virou dica',/Dica: escolha o/.test(v37)&&!/Para ordem de serviço, escolha o/.test(v37));
const v18=ler('ajustes_v52218_pix_prazo_print_venda_patch.js');
ok('2.1 acabou a trava "só imprime depois de faturar"',!/Só imprime depois de faturar/.test(v18));

// 2.3 — financeiro mostra criação e vencimento
ok('2.3 listagem mostra as duas datas',/dataCriacaoCR/.test(app)&&/Vence '\+fmtDate\(cr\.vencimento\)/.test(app));
ok('2.3 cabeçalho fala em datas',/Datas \/ Cliente \/ Origem/.test(app));
ok('2.3 título novo nasce com data de criação',/origem:'venda',criadoEm:new Date\(\)\.toISOString\(\)/.test(app));

// 2.4 — nada de botão repetido
ok('2.4 sem "Imprimir/PDF" duplicado no rodapé da venda',!/data-print-fat/.test(v18));
ok('2.4 sem "Pré-visualizar NF-e" no modal',!/btn-nfe-previa-modal','Pré-visualizar NF-e'/.test(ler('ajustes_v5229_nfe_atalho_historico_patch.js')));

// 2.5 — venda salva imprime
ok('2.5 botão imprimir fica visível sem faturar',/b\.style\.display='';/.test(v18));

// 2.6 — sem "deseja salvar?"
const fix=ler('vendas_notinhas_fix_patch.js');
ok('2.6 sair da venda não pergunta mais nada',/function perguntarSairVenda\(depoisFechar\) \{\s*depoisFechar\(\);\s*\}/.test(fix));

// 3.1 — filtro de cidade mantém o texto digitado
const filtros=ler('ajustes_v52237_contratos_filtros_patch.js');
ok('3.1 busca repõe o texto depois de redesenhar',/function reporTexto/.test(filtros)&&/busca\.value=STATE\.q/.test(filtros));

// 5.1 — nuvem: escolha única na primeira conexão
const motor=ler('cloudflare_data_sync_patch.js');
const painel=ler('cloudflare_sync_patch.js');
ok('5.1 primeira conexão pede escolha',/escolha-inicial/.test(motor));
ok('5.1 duas opções existem no motor',/async function publishLocalToCloud/.test(motor)&&/async function manterLocalSemEnviar/.test(motor));
ok('5.1 painel mostra as duas opções',/dc-enviar-locais/.test(painel)&&/dc-nao-enviar/.test(painel));
ok('5.1 bloqueio de exclusão sumiu da tela',!/Confirmar exclusões de/.test(painel)&&!/dc-approve-delete/.test(painel));
ok('5.1 por padrão nada sobe sozinho',/pause:true,isolate:false,hold:true/.test(motor));

['menus_tela_pequena_patch.js','cloudflare_data_sync_patch.js','cloudflare_sync_patch.js','ajustes_v52218_pix_prazo_print_venda_patch.js'].forEach(f=>{
  ok('no bundle: '+f,manifest.indexOf(f)>=0);
});
console.log('\nRESULTADO: ajustes v5.22.68 passaram!');
