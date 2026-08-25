const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const vis=fs.readFileSync('ajustes_v52237_vendas_os_visual_patch.js','utf8');
const est=fs.readFileSync('ajustes_v52237_estoque_zero_volta_patch.js','utf8');
const ctr=fs.readFileSync('ajustes_v52237_contratos_filtros_patch.js','utf8');
const orc=fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js','utf8');
const apr=fs.readFileSync('ajustes_v52237_orcamentos_aprovacao_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pag=fs.readFileSync('public-pix/orcamento.html','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const V=load(vis).V52237_VENDAS_OS_PURE;
ok('OS completa exige técnico', V.osCompleta({modelo:'HP',numeroSerie:'1',patrimonio:'P',tecnico:''})===false);
ok('OS completa com técnico', V.osCompleta({modelo:'HP',numeroSerie:'1',patrimonio:'P',tecnico:'João'})===true);
ok('garantia escrita', V.garantiaValor('__escrever__','15')==='15 dias');
ok('aviso EPSON 15 dias úteis', /15 dias úteis/.test(V.AVISO_EPSON) && /EPSON/.test(V.AVISO_EPSON));
ok('aviso sem cobrir oferta', !/cobrimos qualquer oferta/i.test(V.AVISO_EPSON));

const E=load(est).V52237_ESTOQUE_ZERO_PURE;
ok('serviço não avisa estoque', E.precisaAviso({categoria:'Serviço',estoque:0},1)===false);
ok('produto zerado avisa', E.precisaAviso({categoria:'Produto',estoque:0},1)===true);

const C=load(ctr).CONTRATOS_FILTROS_PURE;
ok('sem cód controle no filtro', !C.FILTROS.some(function(f){return /controle|global|cartucho|proposta|pasta|fecha/i.test(f[0]+f[1]);}));
ok('tem chamados abertos e não faturados', C.FILTROS.some(function(f){return f[0]==='chamados_abertos';}) && C.FILTROS.some(function(f){return f[0]==='nao_faturados_mes';}));

const O=load(orc).ORCAMENTOS_PURE;
const lista=[
  {numero:'10',status:'aberto',clienteId:'c1',itens:[{descricao:'Toner'}],criadoPorNome:'Ana',data:'2026-08-24'},
  {numero:'11',status:'aprovado',vendaId:'v1',clienteId:'c1',itens:[],criadoPorNome:'Ana',data:'2026-08-23'}
];
ok('fechado = aprovado', O.ehFechado(lista[1])===true && O.ehFechado(lista[0])===false);
ok('filtro fechados', O.filtraOrcamentos(lista,'fechados','').length===1);
ok('estornar bloqueia venda faturada', O.podeEstornar(lista[1],{status:'faturado'}).ok===false);
ok('estornar libera venda salva', O.podeEstornar(lista[1],{status:'aguardar'}).ok===true);
ok('cadastro separado do ERP', /Cadastro separado/.test(orc) && /db.orcamentos/.test(orc));

const A=load(apr).ORCAMENTOS_APROVACAO_PURE;
ok('link no Pages', /^https:\/\/digicopy-pix\.pages\.dev\/orcamento\.html\?c=/.test(A.linkPublico('abc')));
ok('mensagem whats tem cliente e códigos', /Maria/.test(A.mensagemWhats({numero:'7'},{numero:'88'},{nome:'Maria'})) && /COD 7/.test(A.mensagemWhats({numero:'7'},{numero:'88'},{nome:'Maria'})));
ok('impressão sem validade 60 e sem cobrir oferta', !/validade de 60/i.test(apr) && !/cobrimos qualquer oferta/i.test(apr));

ok('página pública aprovar/recusar', /Autorizar orçamento/.test(pag) && /Recusar/.test(pag));
ok('worker GET/POST /orcamento', /pathname === '\/orcamento'/.test(worker) && /handleOrcamentoPost/.test(worker));
ok('nuvem tem orcamentos', /orcamentos:'array'/.test(fs.readFileSync('cloudflare_data_sync_patch.js','utf8')));
ok('patches no bundle', ['ajustes_v52237_vendas_os_visual_patch.js','ajustes_v52237_estoque_zero_volta_patch.js','ajustes_v52237_contratos_filtros_patch.js','ajustes_v52237_orcamentos_menu_patch.js','ajustes_v52237_orcamentos_aprovacao_patch.js'].every(function(f){return manifest.includes(f);}));
ok('versão 5.22.37 no patch', /v5.22.37/.test(vis));
ok('APK quieto', ![vis,est,ctr,orc,apr].some(function(s){return /mobile\//.test(s);}));
console.log('\nRESULTADO: v5.22.37 passou!');
