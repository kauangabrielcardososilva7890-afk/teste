const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const men=fs.readFileSync('ajustes_v52217_menus_arrastar_visibilidade_patch.js','utf8');
const prn=fs.readFileSync('ajustes_v52217_print_sem_rodape_patch.js','utf8');
const rec=fs.readFileSync('ajustes_v52217_financeiro_recibo_patch.js','utf8');
const cer=fs.readFileSync('ajustes_v52217_cert_nuvem_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[men,prn,rec,cer].join('\n'))(ctx.window,ctx.document);
const V=ctx.window.MENUS_ARRASTAR_PURE;
const P=ctx.window.PRINT_SEM_RODAPE_PURE;
const R=ctx.window.FINANCEIRO_RECIBO_PURE;
const C=ctx.window.CERT_NUVEM_PURE;

console.log('== MENUS / VISIBILIDADE ==');
ok('Admin vê backup', V.podeVerBackup('Admin','x')===true);
ok('Dono não vê backup', V.podeVerBackup('Dono','denivaldo')===false);
ok('funcionário sem token vê Nuvem', V.podeVerNuvem('Funcionário','ana',false)===true);
ok('funcionário com token não vê Nuvem', V.podeVerNuvem('Funcionário','ana',true)===false);
ok('Admin com token vê Nuvem', V.podeVerNuvem('Admin','kauan',true)===true);
ok('arrastar no editor', /draggable/.test(men) && /ligarArraste/.test(men));

console.log('== RODAPÉ IMPRESSÃO ==');
ok('remove rodapé da loja', P.tirarRodapeLoja('<body><div class="rodape-loja-final">DIGICOPY • DENIVALDO</div></body>')==='<body></body>');
ok('não mexe em html sem rodapé', P.tirarRodapeLoja('<p>ok</p>')==='<p>ok</p>');

console.log('== RECIBO FINANCEIRO ==');
const t=[
  {id:'1',clienteId:'c1',legadoCodigo:'17483',valor:120,vendaId:null},
  {id:'2',clienteId:'c1',legadoCodigo:'18140',valor:200,vendaId:'v1'}
];
ok('mesmo cliente ok', R.podeImprimirMesmoCliente(t).ok===true);
ok('clientes diferentes bloqueia', R.podeImprimirMesmoCliente([{clienteId:'a'},{clienteId:'b'}]).ok===false);
ok('vazio bloqueia', R.podeImprimirMesmoCliente([]).ok===false);
const txt=R.textoCorrespondente(t,'',[{id:'v1',numero:'17085'}]);
ok('lista parcelas e venda', /PARCELAS: 17483,18140/.test(txt) && /VENDAS 17085/.test(txt));
const txt2=R.textoCorrespondente(t,'teste de descrição',[{id:'v1',numero:'17085'}]);
ok('descrição não apaga selecionados', /PARCELAS:/.test(txt2) && /teste de descrição/.test(txt2));
ok('botão imprimir no financeiro', /data-fin-imprimir/.test(rec) && /finAcaoImprimir/.test(rec));

console.log('== CERT NUVEM ==');
ok('aceita p7b', C.podeEnviarCert('DENIVALDO CERTIFICADO DIGITAL (1).p7b',9000).ok===true);
ok('aceita cer', C.podeEnviarCert('cert.cer',9000).ok===true);
ok('bloqueia pfx', C.podeEnviarCert('a1.pfx',9000).ok===false && C.podeEnviarCert('a1.pfx',9000).motivo==='pfx');
ok('não pede senha', !/senha/i.test(cer) || /NÃO pede senha|não pede senha/.test(cer));
ok('não sobe pfx', /Não envie o A1/.test(cer));

ok('patches no bundle', manifest.includes('ajustes_v52217_menus_arrastar_visibilidade_patch.js') && manifest.includes('ajustes_v52217_print_sem_rodape_patch.js') && manifest.includes('ajustes_v52217_financeiro_recibo_patch.js') && manifest.includes('ajustes_v52217_cert_nuvem_patch.js'));
ok('versão 5.22.x', /^5\.22\./.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile/.test(men+prn+rec+cer));

console.log('\nRESULTADO: v5.22.17 passou!');
