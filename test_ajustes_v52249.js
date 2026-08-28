const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const src=fs.readFileSync('ajustes_v52249_relatorio_patch.js','utf8');
const pag=fs.readFileSync('orcamento_pagar.html','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const P=load(src).RELATORIO_V52249_PURE;
const link=P.linkOrcamento({token:'tok123',numero:'88',total:10},{nome:'Escola'},{whatsapp:'33999999999'});

ok('versão 5.22.49', P.VERSAO==='5.22.49' && pkg.version==='5.22.49');
ok('link do cliente é a página nova (GitHack)', link.indexOf('raw.githack.com')>=0 && link.indexOf('orcamento_pagar.html')>=0);
ok('não usa o Pages velho', link.indexOf('digicopy-orcament.pages.dev')<0 && link.indexOf('digicopy-pix.pages.dev')<0);
ok('leva token, dados e versão', /[?&]c=tok123/.test(link) && /[?&]d=/.test(link) && /[?&]v=5\.22\.49/.test(link));
ok('página pede Tem certeza?', /Tem certeza\?/.test(pag));
ok('página invalida o link depois', /Este link não vale mais/.test(pag) && /USED/.test(pag));
ok('autorizar/recusar na página', /Autorizar/.test(pag) && /Recusar/.test(pag));
ok('salvar venda fecha', /gravarVendaEFechar/.test(src) && /closeModal\(true\)/.test(src));
ok('some botão Sair', /tirarBotaoSair/.test(src));
ok('faturar não imprime', /__vosFatSemPrint/.test(src));
ok('apagar leitura devolve contador', /deleteLeituraContrato/.test(src) && /contadorPBAnterior/.test(src));
ok('De/Até sempre visíveis', /garantirDatas/.test(src) && /type = 'date'/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52249_relatorio_patch.js') && manifest[manifest.length-1]==='ajustes_v52249_relatorio_patch.js');
ok('patch também entra sozinho no exe', pkg.build.files.indexOf('ajustes_v52249_relatorio_patch.js')>=0);
ok('index carrega o patch depois do bundle', /app\.bundle\.js\?v=5\.22\.49/.test(html) && /ajustes_v52249_relatorio_patch\.js\?v=5\.22\.49/.test(html));
ok('rodapé 5.22.49', /footer-version/.test(html) && /v5\.22\.49/.test(html));
ok('APK quieto', src.indexOf('mobile/')<0);
ok('sem nome pessoal novo', !/kauan/i.test(src.replace(/__KAUAN_REFINO_STATE__/g,'').replace(/kauangabrielcardososilva7890-afk/g,'')));
console.log('\nRESULTADO: v5.22.49 passou!');
