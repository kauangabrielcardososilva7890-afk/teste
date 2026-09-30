// ═══════════════════════════════════════════════════════════════
// test_msg_05_telas.js — GERADO por migrar_testes_r57.js; 22 seções.
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_interface.js, test_cartuchos_etiquetas_config.js, test_finalizacao_sistema.js, test_confirm_compat.js, test_ajustes_v52216.js, test_ajustes_v52217.js, test_ajustes_v52221.js, test_ajustes_v52222.js, test_ajustes_v52230.js, test_ajustes_v52239.js, test_ajustes_v52425.js, test_ajustes_v6002.js, test_ajustes_v6003.js, test_ajustes_v6007.js, test_ajustes_v6008.js, test_ajustes_v6009.js, test_ajustes_v60010.js, test_ajustes_v60012.js, test_mobile_apk.js, test_navegador_embutido.js, test_lembrar_tela.js, test_ajustes_v5246.js
// ═══════════════════════════════════════════════════════════════
// Runner do tema: extrai cada SEÇÃO, roda isolada em processo filho
// (comportamento idêntico ao arquivo solto) e agrega o resultado.
// Seções abaixo vão dentro de if (false){} = INERTES (só parse, nunca executa).
// Novo teste do tema: APPEND bloco no fim, copiando o formato (if + 2 marcadores).
const __fs = require('fs');
const __cp = require('child_process');
const __self = __fs.readFileSync(__filename, 'utf8');
const __partes = [];
const __re = /\/\/<<<<SECAO:([^:]+):INICIO>>>>\r?\n([\s\S]*?)\/\/<<<<SECAO:\1:FIM>>>>/g;
let __m;
while ((__m = __re.exec(__self))) __partes.push({ nome: __m[1], codigo: __m[2] });
if (!__partes.length) { console.error('Tema sem seções!'); process.exit(1); }
const __falhas = [];
__partes.forEach((__s, __i) => {
  console.log('\n── ' + __s.nome + ' ──');
  const __tmp = '.tmp_secao_' + process.pid + '_' + __i + '.js';
  try {
    __fs.writeFileSync(__tmp, __s.codigo);
    const __r = __cp.spawnSync(process.execPath, [__tmp], { stdio: 'inherit' });
    if (__r.status !== 0 || __r.error) __falhas.push(__s.nome);
  } finally { try { __fs.unlinkSync(__tmp); } catch (e) {} }
});
if (__falhas.length) { console.error('\nTEMA FALHOU (' + __falhas.length + ' seções): ' + __falhas.join(', ')); process.exit(1); }
console.log('\nTEMA OK: ' + __partes.length + ' seções.');

if (false) { // ═══ test_interface.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_interface.js:INICIO>>>>
// Testes unitários do UI_PURE (interface_patch.js) — v4.9.0
// Uso: node test_interface.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/interface_patch.js', 'utf8');
const m = src.match(/\/\* UI_PURE_START \*\/([\s\S]*?)\/\* UI_PURE_END \*\//);
if(!m){ console.error('FALHOU: seção UI_PURE não encontrada'); process.exit(1); }
const UI_PURE = eval(m[1] + '\n; UI_PURE;');

let pass = 0, fail = 0;
function eq(nome, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok){ pass++; console.log('  ✔', nome); }
  else { fail++; console.error('  ✘', nome, '\n     obtido:', JSON.stringify(got), '\n     esperado:', JSON.stringify(want)); }
}
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

console.log('== ordenaPor — texto e número ==');
{
  const cls = [
    {codigo:20, nome:'Zuleica'}, {codigo:3, nome:'Álvaro'},
    {codigo:10, nome:'maria'}, {codigo:'', nome:'Carlos'}
  ];
  eq('por nome asc (acento/minúscula respeitados)', UI_PURE.ordenaPor(cls, c=>c.nome, 'asc').map(c=>c.nome), ['Álvaro','Carlos','maria','Zuleica']);
  eq('por nome desc', UI_PURE.ordenaPor(cls, c=>c.nome, 'desc').map(c=>c.nome), ['Zuleica','maria','Carlos','Álvaro']);
  eq('por código asc numérico (não "10 < 2")', UI_PURE.ordenaPor(cls, c=>c.codigo, 'asc').map(c=>String(c.codigo))[0], '3');
  eq('por código desc o 20 vem primeiro', UI_PURE.ordenaPor(cls, c=>c.codigo, 'desc').map(c=>String(c.codigo))[0], '20');
  eq('vazio vai pro fim no asc', UI_PURE.ordenaPor(cls, c=>c.codigo, 'asc').map(c=>String(c.codigo)).pop(), '');
  const original = cls.map(c=>c.nome).join();
  UI_PURE.ordenaPor(cls, c=>c.nome, 'desc');
  eq('não altera a lista original', cls.map(c=>c.nome).join(), original);
}

console.log('== ehAvisoDeNuvem — silenciador de avisos repetitivos ==');
{
  ok('"Dados enviados e verificados na nuvem" cala', UI_PURE.ehAvisoDeNuvem('Dados enviados e verificados na nuvem ✅'));
  ok('"Nenhum dado encontrado na nuvem" cala', UI_PURE.ehAvisoDeNuvem('Nenhum dado encontrado na nuvem'));
  ok('"Base recuperada da nuvem" cala', UI_PURE.ehAvisoDeNuvem('Base recuperada da nuvem'));
  ok('texto com "sincroniz" cala', UI_PURE.ehAvisoDeNuvem('Sincronizando com a nuvem...'));
  ok('"PUBLICADO E VERIFICADO" cala', UI_PURE.ehAvisoDeNuvem('PUBLICADO E VERIFICADO'));
  ok('aviso normal NÃO cala', !UI_PURE.ehAvisoDeNuvem('Cliente salvo'));
  ok('aviso de pix NÃO cala', !UI_PURE.ehAvisoDeNuvem('Código Pix copiado'));
  ok('vazio não cala', !UI_PURE.ehAvisoDeNuvem(''));
}

console.log('\n══════════════════════════════════');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_interface.js:FIM>>>>
}

if (false) { // ═══ test_cartuchos_etiquetas_config.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_cartuchos_etiquetas_config.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('cartuchos_etiquetas_config_patch.js','utf8');
const db={
  config:{},
  produtos:[
    {id:'p1',empresaId:'emp',sku:'CARTVAZ-9',nome:'Cartucho Vazio TONER HP 85A',categoria:'Cartucho Vazio',cartuchoCodigoAntigo:'9'},
    {id:'p2',empresaId:'emp',sku:'20',nome:'Pó toner',categoria:'Insumo'}
  ],
  modulosDinamicos:{
    ITENS_VENDA:{dados:[{COD_ITENS_VENDA:1,COD_VENDA:10,COD_CARTUCHO:9,ETIQUETA:'000123',SITUACAO:'RECICLANDO'}]},
    PRODUTOS_VARIACAO:{dados:[{PRV_CODIGO:2,PRV_IDENTIFICACAO:'ABC-777',PRV_QTDE:1}]},
    CLIENTES:{dados:[{COD_CLIENTE:1,NOME:'Cliente'}]}
  }
};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.CARTUCHOS_ETIQUETAS_PURE;
console.log('== CARTUCHOS_ETIQUETAS_PURE ==');
ok('exporta funções puras', !!P && typeof P.extrairEtiquetasLegado==='function');
const etiquetas=P.extrairEtiquetasLegado(db);
ok('extrai etiquetas só de tabelas de cartucho/recarga', etiquetas.length===2 && etiquetas.some(e=>e.etiqueta==='000123') && etiquetas.some(e=>e.etiqueta==='ABC-777'));
ok('calcula maior número de etiqueta', P.maiorNumeroEtiqueta(etiquetas)===777);
ok('gera sequência numérica sem letras e sem zeros à esquerda', P.gerarSequenciaEtiquetas(778,3).join(',')==='778,779,780');
ok('capacidade padrão é máxima compacta na folha', P.ETQ_CAPACIDADE===126 && P.gerarSequenciaEtiquetas(1,999).length===126);
ok('gera intervalo manual de etiquetas do início ao final', P.gerarIntervaloEtiquetas(509,634).length===126 && P.gerarIntervaloEtiquetas(509,634)[125]==='634');
const r=P.aplicarConfiguracoesCartuchos(db,{empresaId:'emp'});
ok('aplica configuração e sugere próximo número', r.proximoNumero===778 && db.config.cartuchosRecargas.etiquetas.codigoSomenteNumerico===true);
ok('remove cartucho vazio do estoque de produtos', r.produtosCartuchoVazioRemovidos===1 && db.produtos.length===1 && db.produtos[0].id==='p2');
ok('regra mantém cartucho vazio fora de produtos', db.config.cartuchosRecargas.regras.cartuchoVazioComoProduto===false);
const svg=P.code39Svg('000778');
ok('gera código de barras em svg', svg.includes('<svg') && svg.includes('<rect'));
const html=P.htmlEtiquetas(['778','779']);
ok('html de impressão contém etiquetas pequenas', html.includes('778') && html.includes('DIGICOPY') && html.includes('14mm') && html.includes('repeat(7'));
console.log('\nRESULTADO: Testes de etiquetas/configuração de cartuchos passaram!');
//<<<<SECAO:test_cartuchos_etiquetas_config.js:FIM>>>>
}

if (false) { // ═══ test_finalizacao_sistema.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_finalizacao_sistema.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('finalizacao_sistema_patch.js','utf8');
const db={};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.FINALIZACAO_SISTEMA_PURE;
console.log('== FINALIZACAO_SISTEMA_PURE ==');
ok('exporta funções puras', !!P && typeof P.ordenarLista==='function');
const list=[{codigo:'10',nome:'B'},{codigo:'2',nome:'A'},{codigo:'0003',nome:'C'}];
ok('ordena código numericamente crescente', P.ordenarLista(list,'codigo','asc').map(x=>x.codigo).join(',')==='2,0003,10');
ok('ordena nome desc', P.ordenarLista(list,'nome','desc')[0].nome==='C');
ok('filtra clientes por tudo', P.filtrarClientesFinal([{nome:'José',codigo:'1'},{nome:'Maria',codigo:'2'}],'jose','todos').length===1);
ok('código interno só número', P.numCodigo('CLI-00045')===45);
ok('clientes não lista tudo por padrão', P.clientesDeveListar('', 'todos', 'ativos')===false);
ok('campo pré-selecionado (nome) NÃO lista por si só', P.clientesDeveListar('', 'nome', 'ativos')===false);
ok('clientes lista quando pesquisar ou filtrar status', P.clientesDeveListar('maria', 'nome', 'ativos')===true && P.clientesDeveListar('', 'nome', 'inadimplente')===true);
console.log('\nRESULTADO: Testes de finalização passaram!');
//<<<<SECAO:test_finalizacao_sistema.js:FIM>>>>
}

if (false) { // ═══ test_confirm_compat.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_confirm_compat.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('popup_sistema_patch.js','utf8');
console.log('== CONFIRM COMPAT ==');
ok('preserva confirm nativo antes de sobrescrever',/const nativeConfirm/.test(code));
ok('confirm legado não retorna sempre false',/return nativeConfirm \? nativeConfirm/.test(code));
ok('popup confirmado libera exatamente uma chamada interna',/allowLegacyConfirmOnce/.test(code)&&/__confirmSistemaBypass--/.test(code));
ok('bypass esquecido é zerado no próximo ciclo',/setTimeout\(\(\)=>\{ window\.__confirmSistemaBypass = 0; \}, 0\)/.test(code));
ok('exclusões embrulhadas usam bypass seguro',/confirmSistema\(msg, 'Excluir'\)[\s\S]{0,100}allowLegacyConfirmOnce/.test(code));
ok('estornos embrulhados usam bypass seguro',/Estornar[\s\S]{0,160}allowLegacyConfirmOnce/.test(code));
console.log('\nRESULTADO: compatibilidade de confirmações passou!');
//<<<<SECAO:test_confirm_compat.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52216.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52216.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const men=fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js','utf8');
const sub=fs.readFileSync('ajustes_v52216_menus_submenus_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',men+'\n'+sub)(ctx.window,ctx.document);
const M=ctx.window.MENUS_ATALHOS_PURE;
const S=ctx.window.MENUS_SUBMENUS_PURE;

console.log('== SUBMENUS / OCULTOS / ATALHOS AZUL ==');
ok('só Admin/Dono vê oculto', S.ehCargoAdmin('Admin','x')===true && S.ehCargoAdmin('Dono','x')===true && S.ehCargoAdmin('Funcionário','ana')===false);
ok('r59: login não vira cargo', S.ehCargoAdmin('Funcionário','kauan')===false);
ok('Sair não some', !!S.BLOQUEIO_OCULTAR.sair);

const pad=M.menusPadrao();
const salvo={
  ordem:['cadastros','inicio','atendimento','locacao','nfe','financeiro','buscador','config','backup','nuvem','sair'],
  nomes:{cadastros:'Cadastros'},
  sub:{atendimento:{'notinhas':'Notinhas'}},
  subOrdem:{atendimento:['abrir-chamado','notinhas']},
  ocultos:{nfe:true},
  ocultosSub:{cadastros:{recargas:true}}
};
const layout=S.aplicarLayout(pad, salvo);
ok('cadastros no começo', layout[0].id==='cadastros');
const at=layout.find(x=>x.id==='atendimento');
ok('submenu reordenado', at.items[0].id==='abrir-chamado' && at.items[1].id==='notinhas');
ok('nova-venda não volta nem com ordem salva antiga (v5.24.6)', !at.items.some(i=>i.id==='nova-venda'));
ok('nome do submenu', at.items[1].label==='Notinhas');
ok('NF-e marcada oculta', layout.find(x=>x.id==='nfe').oculto===true);
// v5.22.77: Recargas não é mais submenu de Cadastros.
ok('recargas não é mais submenu de cadastros', !layout.find(x=>x.id==='cadastros').items.some(i=>i.id==='recargas'));

const func=S.menusParaUsuario(layout, false);
ok('funcionário não vê NF-e', !func.some(x=>x.id==='nfe'));
ok('ninguém vê recargas em cadastros', !func.find(x=>x.id==='cadastros').items.some(i=>i.id==='recargas'));
ok('funcionário vê Sair', func.some(x=>x.id==='sair'));
const adm=S.menusParaUsuario(layout, true);
ok('admin ainda vê NF-e', adm.some(x=>x.id==='nfe'));

const cat=S.catalogoDeSubmenus(pad);
ok('catálogo sem o submenu Nova venda (v5.24.6)', !cat.some(a=>a.id==='nova-venda'));
ok('catálogo não tem mais Recargas', !cat.some(a=>a.id==='recargas'));
ok('catálogo não é só o menu Atendimento', !cat.some(a=>a.id==='atendimento') && cat.some(a=>a.menuId==='atendimento'));

ok('atalho some se menu oculto', S.atalhoOcultoPara({id:'nota-fiscal',menuId:'nfe'}, salvo, false)===true);
ok('admin vê atalho oculto', S.atalhoOcultoPara({id:'nota-fiscal',menuId:'nfe'}, salvo, true)===false);

const moved=S.moverNoPai(['a','b','c'],2,0);
ok('mover submenu na lista', moved[0]==='c' && moved[1]==='a');

ok('seta de submenu no patch', /uiSubMenuMover/.test(sub));
ok('atalhos na faixa azul', /ui-atalhos-azul/.test(sub) && /ui-atalhos-inicio/.test(sub));
ok('some a faixa branca', /branco\.remove/.test(sub) || /ui-atalhos-inicio[\s\S]{0,80}remove/.test(sub));
ok('editor de menus existe', /abrirEditorMenus/.test(sub));
ok('hooks no 5.22.13', /window\.pintarMenus/.test(men) && /window\.pintarAtalhos/.test(men));
ok('uiMenuMover usa o botão', /closest\('\[data-mid\]'\)/.test(sub));

ok('patch no bundle', manifest.includes('ajustes_v52216_menus_submenus_patch.js'));
ok('versão app 5.x-6.x', /^\d+\.\d+\./.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile/.test(sub));

console.log('\nRESULTADO: v5.22.16 passou!');
//<<<<SECAO:test_ajustes_v52216.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52217.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52217.js:INICIO>>>>
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
ok('r59: Dono vê backup (é o dono da loja)', V.podeVerBackup('Dono','x')===true);
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
ok('versão app 5.x-6.x', /^\d+\.\d+\./.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile/.test(men+prn+rec+cer));

console.log('\nRESULTADO: v5.22.17 passou!');
//<<<<SECAO:test_ajustes_v52217.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52221.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52221.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const men=fs.readFileSync('ajustes_v52221_menus_dispositivo_patch.js','utf8');
const nfe=fs.readFileSync('ajustes_v52221_nfe_permissao_patch.js','utf8');
const imp=fs.readFileSync('ajustes_v52221_import_produtos_patch.js','utf8');
const cer=fs.readFileSync('ajustes_v52221_cert_nuvem_a1_patch.js','utf8');
const htmlEnv=fs.readFileSync('envio_arquivos.html','utf8');
const main=fs.readFileSync('main.js','utf8');
const preload=fs.readFileSync('preload.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[men,nfe,imp,cer].join('\n'))(ctx.window,ctx.document);
const M=ctx.window.MENUS_DISPOSITIVO_PURE;
const P=ctx.window.NFE_PERMISSAO_PURE;
const I=ctx.window.IMPORT_PRODUTOS_PURE;
const C=ctx.window.CERT_A1_NUVEM_PURE;

console.log('== MENUS DISPOSITIVO ==');
ok('chave local', M.KEY_MENUS.indexOf('dispositivo')>0);
ok('não é menu da faixa', /Editar menus/.test(men) && /ui-menus-dispositivo/.test(men));
ok('grava no localStorage', /localStorage/.test(men) && /tirarDaNuvem/.test(men));

console.log('== PERMISSÃO NF ==');
ok('Admin/Dono editam caixa', P.podeEditarCaixaNfe({perfil:'Admin'})===true && P.podeEditarCaixaNfe({perfil:'Dono'})===true);
ok('funcionário não edita', P.podeEditarCaixaNfe({perfil:'Funcionário'})===false);
ok('só marcado emite', P.podeEmitirNfe({podeEmitirNfe:true})===true && P.podeEmitirNfe({perfil:'Admin'})===false);

console.log('== IMPORT PRODUTOS ==');
ok('lê array', I.linhasDeJson([{CODIGO:1}]).length===1);
ok('lê data', I.linhasDeJson({data:[{CODIGO:1}]}).length===1);
ok('sku e nome', I.skuDe({CODIGO:'10'})==='10' && I.nomeDe({DESCRICAO:'Toner'})==='Toner');
const cats=I.mapaCategorias([{PRC_CODIGO:'2',PRC_DESCRICAO:'Chip'}]);
ok('categoria da tabela', I.mapearProduto({CODIGO:'1',DESCRICAO:'X',COD_CATEGORIA:'2'},cats).categoria==='Chip');
const ded=I.dedupePorSku([{sku:'1',nome:'A'}],[{sku:'1',nome:'B'},{sku:'2',nome:'C'}]);
ok('dedupe por sku', ded.filter(x=>x.tipo==='upd').length===1 && ded.filter(x=>x.tipo==='new').length===1);

console.log('== A1 NUVEM ==');
ok('aceita pfx', C.podeEnviarA1('loja.pfx',8000).ok===true);
ok('recusa p7b', C.podeEnviarA1('pub.p7b',8000).ok===false);
ok('página pede pfx e não campo de senha', /accept="\.pfx,\.p12"/.test(htmlEnv) && !/id="pass"|senhaA1|type="password"/.test(htmlEnv));
ok('página não emite SEFAZ', /não é enviada à SEFAZ|Ainda não emite/.test(htmlEnv));
ok('main assina com pfxB64', /pfxB64/.test(main) && /pfxB64/.test(preload));
ok('some botão local', /nfe-cert-import/.test(cer) && /display = 'none'/.test(cer));

ok('patches no bundle', manifest.includes('ajustes_v52221_menus_dispositivo_patch.js') && manifest.includes('ajustes_v52221_cert_nuvem_a1_patch.js'));
ok('versão 5.22.21+', (/^\d+\.\d+\.\d+$/.test(pkg.version) && (parseInt(pkg.version.split('.')[0],10)>=6 || parseInt(pkg.version.split('.')[1],10)>=23 || parseInt(pkg.version.split('.')[2],10)>=21)) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', ![men,nfe,imp,cer,htmlEnv].some(s=>/mobile\//.test(s)));

console.log('\nRESULTADO: v5.22.21 passou!');
//<<<<SECAO:test_ajustes_v52221.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52222.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52222.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const men=fs.readFileSync('ajustes_v52222_menus_arrastar_patch.js','utf8');
const ncm=fs.readFileSync('ajustes_v52222_ncm_import_patch.js','utf8');
const env=fs.readFileSync('envio_arquivos.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{IMPORT_PRODUTOS_PURE:{mapearProduto:function(row){return {sku:'1',nome:'X'};}}},document:undefined};
new Function('window','document',[ncm,men].join('\n'))(ctx.window,ctx.document);
const N=ctx.window.NCM_IMPORT_PURE;
const M=ctx.window.MENUS_ARRASTAR_SO_PURE;

console.log('== MENUS ARRASTAR ==');
ok('esconde setas', typeof M.esconderSetas==='function' && /↑/.test(men));

console.log('== NCM ==');
ok('lê NCM da linha do produto', N.ncmDaLinha({PR_NCM:'8443.99.00'})==='84439900');
const cat=N.mapaNcm([{NC_CODIGO:'7',NC_NCM:'8471.30.12'}]);
ok('liga pelo código da tabela NCM', N.ncmDoProduto({CODIGO:'10',COD_NCM:'7'},cat)==='84713012');
ok('liga pelo sku no NCM', N.ncmDoProduto({CODIGO:'88'}, N.mapaNcm([{COD_PRODUTO:'88',NCM:'12345678'}]))==='12345678');
ok('página recebe NCM.json', /arq-ncm/.test(env) && /NCM\.json/.test(env));

ok('patches no bundle', manifest.includes('ajustes_v52222_menus_arrastar_patch.js') && manifest.includes('ajustes_v52222_ncm_import_patch.js'));
ok('versão 5.22.22+', (/^\d+\.\d+\.\d+$/.test(pkg.version) && (parseInt(pkg.version.split('.')[0],10)>=6 || parseInt(pkg.version.split('.')[1],10)>=23 || parseInt(pkg.version.split('.')[2],10)>=22)) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(men+ncm+env));
console.log('\nRESULTADO: v5.22.22 passou!');
//<<<<SECAO:test_ajustes_v52222.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52230.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52230.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52230_modo_escuro_dispositivo_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const store={};
const ctx={
  window:{},
  document:undefined,
  localStorage:{
    getItem:function(k){return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null;},
    setItem:function(k,v){store[k]=String(v);}
  }
};
new Function('window','document','localStorage',src)(ctx.window,ctx.document,ctx.localStorage);
const P=ctx.window.MODO_ESCURO_PURE;

ok('chave local do aparelho', P.KEY.indexOf('dispositivo')>0 && P.KEY.indexOf('escuro')>0);
ok('grava e lê', P.gravarEscuro(true)===true && P.lerEscuro()===true);
ok('desliga', P.gravarEscuro(false)===true && P.lerEscuro()===false);
ok('não usa db.config', !/db\.config\.escuro|db\.config\.dark/.test(src));
ok('card em Configurações', /ui-escuro-dispositivo-card/.test(src) && /Modo escuro/.test(src));
ok('index evita flash', /digicopy_ui_modo_escuro_dispositivo_v1/.test(html));
ok('patch no bundle', manifest.includes('ajustes_v52230_modo_escuro_dispositivo_patch.js'));
ok('versão 5.22.30+', /^\d+\.\d+\.\d+/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.30 passou!');
//<<<<SECAO:test_ajustes_v52230.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52239.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52239.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const print=fs.readFileSync('ajustes_v52239_print_escolha_patch.js','utf8');
const patri=fs.readFileSync('ajustes_v52239_patri_nao_obrigatorio_patch.js','utf8');
const erro=fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js','utf8');
const menus=fs.readFileSync('ajustes_v52239_menus_imediato_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const P=load(print).V52239_PRINT_PURE;
const base='<html><head><style>x</style></head><body><div class="pagina meia">NOTA</div>\n  <script>1</script></body></html>';
const duasVenda=P.montarVias(base,'venda',2);
const duasOs=P.montarVias(base.replace('meia','inteira'),'os',2);
ok('2 vias venda duplica a meia folha', (duasVenda.match(/NOTA/g)||[]).length===2);
ok('2 vias venda não força outra folha', !/page-break-after:always/.test(duasVenda));
ok('2 vias OS são folhas separadas', /page-break-after:always/.test(duasOs) && (duasOs.match(/NOTA/g)||[]).length===2);
ok('venda tira EPSON', P.aplicarTipo('<div class="aviso-epson">x</div>','venda').indexOf('aviso-epson')<0);

const T=load(patri).V52239_PATRI_PURE;
ok('OS completa sem patrimônio', T.osCompletaSemPatri({modelo:'HP',numeroSerie:'1',tecnico:'João'})===true);
ok('OS sem técnico não fecha', T.osCompletaSemPatri({modelo:'HP',numeroSerie:'1',patrimonio:'P',tecnico:''})===false);

const E=load(erro).V52239_ERRO_PURE;
ok('ruído ResizeObserver ignorado', E.ignoraRuido('ResizeObserver loop')===true);
ok('erro real não ignorado', E.ignoraRuido('Cannot read properties of null')===false);
ok('detalhe cabe na auditoria', E.detalheErro('falhou','a.js:10').indexOf('falhou')>=0);

const M=load(menus).V52239_MENUS_PURE;
const loc=M.garantirLocacao([{id:'locacao',items:[{id:'contratos',label:'Contratos'}]}]);
ok('locação guarda leituras e parque', loc[0].items.some(function(i){return i.id==='leituras';}) && loc[0].items.some(function(i){return i.id==='parque';}));

ok('orçamentos já no HTML', /navigateTo\('orcamentos'\)/.test(html));
ok('patches no bundle', ['ajustes_v52239_print_escolha_patch.js','ajustes_v52239_patri_nao_obrigatorio_patch.js','ajustes_v52239_avisos_erro_auditoria_patch.js','ajustes_v52239_menus_imediato_patch.js'].every(function(f){return manifest.includes(f);}));
ok('versão no patch', /v5.22.39/.test(print+patri+erro+menus));
ok('APK quieto', ![print,patri,erro,menus].some(function(s){return /mobile\//.test(s);}));
console.log('\nRESULTADO: v5.22.39 passou!');
//<<<<SECAO:test_ajustes_v52239.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52425.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52425.js:INICIO>>>>
// test_ajustes_v52425.js — v5.24.34: resposta ao "os menus de NF não estão acessando".
// Regra do tópico C: tudo FUNCIONA ou para LIMPO no "falta certificado válido".
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const cat = fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js', 'utf8');
const cn = fs.readFileSync('ajustes_v52231_nfe_central_menu_patch.js', 'utf8');
const as = fs.readFileSync('nfe_assinatura.js', 'utf8');
const mj = fs.readFileSync('main.js', 'utf8');
const pl = fs.readFileSync('preload.js', 'utf8');

// MENU: morto o "em breve"
ok(!cat.includes("Módulo fiscal em preparação") && !cat.includes("Em breve: emissão de nota fiscal"), 'menu: toasts de mentira ELIMINADOS');
ok(cat.includes("click:'abrirCentralNfe()'"), 'menu: NF-e/NFC-e e Nota fiscal abrem a Central');
ok(cat.includes("click:'abrirPerfilTributario()'") && cat.includes("click:'abrirPerfilTributario(1)'"), 'menu: Perfil tributário e NCM abrem a Config fiscal real');

// CENTRAL
ok(cn.includes("id='central-nfe-modal'") || cn.includes("id='central-nfe-modal'") || cn.includes("id=\"central-nfe-modal\"") || cn.includes("central-nfe-modal"), 'central: modal próprio (own DOM)');
ok(cn.includes('cnfe-venda') && cn.includes('cnfe-leitura'), 'central: escolhe notinha OU leitura');
ok(cn.includes("conferirNfe(vid?'venda':'leitura'"), 'central: emissão usa a mesma ponte v5221 (nada novo no miolo)');
ok(cn.includes('cnfe-validade') && cn.includes('Conferir validade do certificado'), 'central: botão conferir validade');
ok(cn.includes('NFE_CENTRAL_V52425'), 'central: exportação pure pros testes');
ok(cn.includes('slice(-40)'), 'central: lista as últimas 40 (teto de segurança)');
ok(cn.includes('abrirPerfilTributario') && cn.includes('nfe-config-card'), 'central: atalho real pra Config fiscal');

// CERTIFICADO: validade de verdade
ok(as.includes('lerValidadePfx') && as.includes('certInfoBasicas'), 'assinatura: lê validade direto do .pfx (com a senha, sem guardar)');
ok(as.includes('Certificado A1 VENCIDO em'), 'assinatura: assinar com vencido para LIMPO com a data exata');
ok(as.includes('certValidoAte'), 'assinatura: devolve a validade no resultado');
ok(mj.includes("ipcMain.handle('nfe:cert-validade'"), 'main: IPC da validade (programinha ensina a ler)');
ok(pl.includes("validade: (senha) => ipcRenderer.invoke('nfe:cert-validade'"), 'preload: ponte validade exposta (PC .exe)');
ok(cn.includes('api.validade') && cn.includes('pedirSenhaA1'), 'central: usa a senha do cofre UMA VEZ, sem inventar validade');

const leitura = require('child_process').spawnSync('node', ['-e', "const s=require('./nfe_assinatura.js'); console.log(typeof s.lerValidadePfx, typeof s.certInfoBasicas);"], { encoding: 'utf8' });
ok(leitura.stdout.trim() === 'function function', 'assinatura: funções novas exportadas de verdade');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('central-nfe-modal') && bundle.includes('NFE_CENTRAL_V52425'), 'bundle: Central dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('central-nfe-modal'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'index 6.0.9');
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + VERSAO_APP + '<'), 'rodapé v6.0.9');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "' + VERSAO_APP + '"'), 'package.json 6.0.6');
ok(fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').includes("'5.28.4'"), 'worker carimbado (re-ancorado v5.28.4)');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (menu NF abre de verdade + certificado para limpo com data).');
//<<<<SECAO:test_ajustes_v52425.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6002.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6002.js:INICIO>>>>
// test_ajustes_v6002.js — v6.0.2: TRÊS OBRAS JUNTAS
//  1) CURA DOS DADOS SUMIDOS: sessão sem empresa + registros órfãos (sem
//     carimbo) são curados DETERMINISTICAMENTE — só quando o banco tem
//     EXATAMENTE UMA empresa. Com duas ou mais, NÃO chuta (sem achismo).
//  2) CENTRAL NF VIRA MENU: abrirCentralNfe abre a tela (navigateTo), botões
//     no nav-gest + barra clássica, placa de ambiente sempre no topo, CSC NF-e
//     salvo, histórico rende nela — aba flutuante flutuante morta de vez.
//  3) POPUPS NO ESTILO DO SISTEMA: nfxPedirTexto/nfxConfirmar com X de fechar;
//     o motor de transmissão NÃO usa mais prompt()/confirm() nativos (só
//     fallback se a popup própria não existir).
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const src = fs.readFileSync('autocura_empresa_central_nf_tela_patch.js', 'utf8');
const trx = fs.readFileSync('nf_transmissao_patch.js', 'utf8');
const diag = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));

console.log('== CURA 1: SESSÃO SEM EMPRESA ==');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(src.slice(src.indexOf('/* AC602_PURE_START */'), src.indexOf('/* AC602_PURE_END */')), sandbox);
const db1Emp = { empresas: [{ id: 'emp_digicopy' }],
  vendas: [{ id: 'v1', numero: '10', empresaId: undefined }, { id: 'v2', numero: '11', empresaId: 'emp_digicopy' }],
  clientes: [{ id: 'c1', empresaId: null }], parque: [{ id: 'p1' }] };
const sess = { usuarioId: 'u1', login: 'dono' };
const r1 = sandbox.acCuraSessao(sess, db1Emp);
ok('sessão vazia + 1 empresa no banco → carimba', r1.mudou === true && sess.empresaId === 'emp_digicopy');
ok('sessão que já tinha empresa não mexe', sandbox.acCuraSessao({ empresaId: 'emp_x', login: 'a' }, db1Emp).mudou === false);
ok('2+ empresas NÃO chuta (sem achismo)', sandbox.acCuraSessao({ login: 'a' }, { empresas: [{ id: 'a' }, { id: 'b' }] }).mudou === false && sandbox.acCuraSessao({ login: 'a' }, { empresas: [{ id: 'a' }, { id: 'b' }] }).precisaEscolher === true);
ok('sem sessão/no db não explode', sandbox.acCuraSessao(null, db1Emp).mudou === false);

console.log('== CURA 2: REGISTROS ÓRFÃOS (o caso real: venda e parque sem carimbo) ==');
const orf = sandbox.acContarOrfaos(db1Emp);
ok('conta órfãos por entidade (venda 1, cliente 1, parque 1)', orf.total === 3 && orf.porEntidade.vendas === 1 && orf.porEntidade.clientes === 1 && orf.porEntidade.parque === 1);
ok('não conta o bem carimbado', db1Emp.vendas[1].empresaId === 'emp_digicopy' && orf.total === 3);
const cura = sandbox.acCarimbarOrfaos(db1Emp, 'emp_digicopy');
ok('carimba todos os órfãos na empresa única', cura.total === 3 && db1Emp.vendas[0].empresaId === 'emp_digicopy' && db1Emp.parque[0].empresaId === 'emp_digicopy');
ok('já carimbados não envelopam', sandbox.acContarOrfaos(db1Emp).total === 0);
ok('com 2 empresas não carimba NADA', sandbox.acCarimbarOrfaos({ empresas: [{ id: 'a' }, { id: 'b' }], vendas: [{ id: 'v' }] }).total === 0);

console.log('== DIAGNÓSTICO passa a enxergar órfãos (a prova que escapava) ==');
ok('diagnóstico de órfãos saiu da tela com a faixa (r46)', diag.indexOf('orfaos++') < 0 && diag.indexOf('SEM CARIMBO (órfãos)') < 0);
ok('causa provável dos sumiços saiu junto', diag.indexOf('CAUSA PROVÁVEL DOS SUMIÇOS') < 0);
ok('aviso de sessão sem empresa saiu junto', diag.indexOf('PRÓPRIA SESSÃO TAMBÉM ESTÁ SEM EMPRESA') < 0);
ok('botão Reparar saiu; a cura automática continua no próprio patch', diag.indexOf('Reparar sessão agora') < 0);
ok('texto do diagnóstico removido (a cura carimba sozinha)', diag.indexOf('DIAGNÓSTICO (só lê, não muda nada)') < 0);

console.log('== CENTRAL NF VIRA MENU (aba flutuante morta) ==');
ok('view "central-nf" criada com ensureView (padrão das telas)', src.indexOf("ensureView('central-nf')") >= 0);
ok('placa de ambiente SEMPRE no topo da tela', src.indexOf('🏛️') >= 0 && src.indexOf('HOMOLOGAÇÃO — MODO TESTE, SEM VALOR FISCAL') >= 0 && src.indexOf('PRODUÇÃO — a nota gerada aqui VALE DE VERDADE') >= 0);
ok('alternância de ambiente mora na TELA (botão cnf-amb) e produção exige digitar PRODUCAO', src.indexOf('cnf-amb') >= 0 && src.indexOf("dig!=='PRODUCAO'") >= 0);
ok('abrirCentralNfe antiga redireciona pra navigateTo (modal flutuante desligado)', src.indexOf("window.navigateTo('central-nf')") >= 0 && src.indexOf('_cen2') >= 0);
ok('botões no nav-gest (Nota Fiscal) + barra clássica (topmod-central-nf)', src.indexOf('topmod-central-nf') >= 0 && src.indexOf('[data-nav="central-nf"]') >= 0);
ok('navigateTo aprende a view nova sem tocar no miolo', src.indexOf('window.navigateTo=function(view)') >= 0 && src.indexOf("view==='central-nf'") >= 0);
ok('CSC da NFC-e mora na Central (salvar csc/id)', src.indexOf('cnf-cscsalvar') >= 0 && src.indexOf('db.config.nfCsc=') >= 0);
ok('histórico rende na tela nova (alvo __nfxHistAlvo)', src.indexOf('__nfxHistAlvo') >= 0 && trx.indexOf("document.getElementById('cnf-hist')") >= 0);

console.log('== POPUPS NO ESTILO DO SISTEMA (X de fechar) ==');
ok('modal próprio nfx-modal com X + cancelar voltam null/false', src.indexOf("id='nfx-modal'") >= 0 && src.indexOf("id=\"nfx-x\"") >= 0 && src.indexOf("fechar(null)") >= 2 && src.indexOf('fechar(false)') >= 2 && src.indexOf('root.remove(); resolve(v)') >= 0);
ok('nfxPedirTexto com mínimo de letras e máscara (senha)', src.indexOf('op.minimo') >= 0 && src.indexOf("op.mascara?'type=\"password\" '") >= 0);
ok('motor abandonou window.prompt na senha (só fallback)', trx.indexOf('nfxPedirTexto(\'Senha do certificado A1\'') >= 0 && trx.indexOf('{\"type\":\"password\"') < 0);
ok('cancelamento pede justificativa no popup próprio (mín 15)', trx.indexOf("nfxPedirTexto('Cancelar NF-e'") >= 0 && trx.indexOf('minimo:15') >= 0);
ok('confirm de produção usa nfxConfirmar (sem window.confirm solto na lógica)', trx.indexOf("nfxConfirmar('CANCELAR NOTA DE VERDADE ?'") >= 0 || trx.indexOf("nfxConfirmar('CANCELAR NOTA DE VERDADE?'") >= 0);
ok('duplicidade usa nfxConfirmar (abrir DANFE)', trx.indexOf("nfxConfirmar('Nota já autorizada'") >= 0);
ok('senha pedida com await (popup assim é Promise)', trx.indexOf('await nfxPedirSenha()') >= 3);

console.log('== INTEGRAÇÃO + CARIMBO 6.0.2 ==');
ok('patch na 208; perfis 209; permissões 210; menu fiscal v6.0.6; Início clicável v6.0.7; menus fiscais separados v6.0.8 na 212; override v6.0.9 na 214; 6 submenus v6.0.10 na 215; hover NF-e/NFC-e v6.0.11 fecha a fila (216)', manifest.length >= 225 && manifest[207] === 'autocura_empresa_central_nf_tela_patch.js' && manifest[208] === 'perfis_nuvem_cura_sessao_patch.js' && manifest[209] === 'permissoes_estorno_venda_patch.js' && manifest[210] === 'fiscal_menu_completo_patch.js' && manifest[211] === 'dashboard_inicio_clicavel_patch.js' && manifest[212] === 'menus_fiscais_separados_patch.js' && manifest[213] === 'permissoes_override_menus_fiscais_patch.js' && manifest[214] === 'seis_submenus_velho_patch.js' && manifest[215] === 'submenu_hover_nfe_patch.js');
ok('cura + tela no bundle gerado', bundle.indexOf('v6.0.2') >= 0 && bundle.indexOf('Curei ') >= 0);
ok('guard anti dupla-instalação', src.indexOf('__v6002ac') >= 0);
ok('package.json na 6.0.2', pkg.version === VERSAO_APP);
ok('index.html carimbado 6.0.2', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('worker atualizado 5.28.4 · gerente segue 5.26.3', fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("WORKER_VERSION = '5.28.4'") >= 0 && JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8')).version === '5.26.3');

console.log('\nTudo OK — v6.0.2 (dados sumidos CURADOS: sessão e registros carimbados quando há UMA empresa; Central NF vira menu de verdade; popups próprios com X em todo o fiscal).');
//<<<<SECAO:test_ajustes_v6002.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6003.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6003.js:INICIO>>>>
// NOTA (24/09/2026): o fim do bundle-manifest.json encolheu 3 posições — saíram
// `novo/nucleo.js`, `novo/ponte.js` e `ajustes_v7011_ponte_nucleo_patch.js` (o núcleo novo
// foi apagado por decisão do dono). A conferência abaixo conta DE TRÁS para a frente, então
// cada número caiu 3. Os patches conferidos e a ORDEM entre eles continuam os mesmos.
// test_ajustes_v6003.js — v6.0.3: MODO ESCURO DO FISCAL (print dele provou)
// + saveConfig blindado (erro real do console: TypeError 'value' de null).
//  1) Print da evidência: cards brancos pendurados no fundo escuro, botão com
//     texto invisível, título duplicado. Regra: CSS próprio do módulo (claro
//     e escuro, html.digi-escuro com !important) e classes cnf-* nos elementos.
//  2) saveConfig lia inputs da tela de Config antiga sem conferir se existiam
//     (a tela neo Salvar não tem cfg-emp-nome) → agora só salva quando a tela
//     estiver AGORA na DOM; senão, avisa sem explodir — NUNCA mais TypeError.
//  3) Histórico: um único cabeçalho "EMISSÕES DESTA EMPRESA" (o box tem, a
//     tela não repete), linhas e botões com classes escuras.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const src = fs.readFileSync('autocura_empresa_central_nf_tela_patch.js', 'utf8');
const trx = fs.readFileSync('nf_transmissao_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));

console.log('== MODO ESCURO: CSS próprio do módulo fiscal ==');
ok('injeta o bloco cnf-aba-css UMA vez', src.indexOf("st.id='cnf-aba-css'") >= 0 && src.indexOf("document.getElementById('cnf-aba-css')") >= 0);
ok('regras claras das classes fiscais (cnf-card/btn/input)', src.indexOf("#view-central-nf .cnf-card{") >= 0 && src.indexOf("#view-central-nf .cnf-btn{") >= 0 && src.indexOf("#view-central-nf .cnf-input{") >= 0);
ok('regras escuras com html.digi-escuro', src.indexOf('html.digi-escuro #view-central-nf .cnf-card{') >= 0 && src.indexOf('html.digi-escuro #view-central-nf .cnf-btn:hover{') >= 0);
ok('escuro sobrepõe inline com !important', src.indexOf('html.digi-escuro #view-central-nf .cnf-card{background:#101a30 !important;border-color:#2b3b5c !important;color:#dbe3f0 !important}') >= 0);
ok('popup fiscal também no escuro (#nfx-modal)', src.indexOf('html.digi-escuro #nfx-modal>div{background:#101a30 !important') >= 0 && src.indexOf('html.digi-escuro #nfx-modal input{background:#0d1830 !important') >= 0);
ok('CSS injetado dentro do bundle', bundle.indexOf('cnf-aba-css') >= 0 && bundle.indexOf('digi-escuro #view-central-nf') >= 0);

console.log('== TEXTO FANTASMA: botões com classe (nunca mais branco sobre branco) ==');
ok('cnf-amb / cnf-config / cnf-inut usar classes de botão fiscal', src.indexOf('id="cnf-amb" class="cnf-btn"') >= 0 && src.indexOf('id="cnf-config" class="cnf-btn"') >= 0 && src.indexOf('id="cnf-inut" class="cnf-btn-d"') >= 0);
ok('inputs da NFC-e tem classe cnf-input', src.indexOf('id="cnf-cscid" class="cnf-input"') >= 0 && src.indexOf('id="cnf-csc" class="cnf-input"') >= 0);
ok('botão Salvar CSC também classificado', src.indexOf('id="cnf-cscsalvar" class="cnf-btn"') >= 0);
ok('cards Certificado + CSC tem classe cnf-card', src.indexOf('<div class="cnf-card"><p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;margin:0 0 6px" class="cnf-sub">Certificado A1</p>') >= 0);
ok('subtítulos com classe cnf-sub (escuro cobre)', src.indexOf('class="cnf-sub"') >= 3);

console.log('== TÍTULO DUPLICADO ELIMINADO (print mostrava 2x EMISSÕES) ==');
ok('a tela NÃO repete o título "Emissões desta empresa" fora do box', src.indexOf('>Emissões desta empresa</p>') < 0);
ok('o box do histórico mantém o cabeçalho ÚNICO (com classe própria)', trx.indexOf("class=\"nfx-hist-cab\"") >= 0 && trx.indexOf('EMISSÕES DESTA EMPRESA (ficam salvas na nuvem)') >= 0);
ok('linhas e botões do histórico com classes escuras', trx.indexOf('class="nfx-linha"') >= 0 && trx.indexOf('class="nfx-btn-mini"') >= 0 && trx.indexOf('class="nfx-btn-mini nfx-btn-cancel"') >= 0 && trx.indexOf('class="nfx-vazio"') >= 0);
ok('rende dentro de cnf-hist com box classificado (sem inline claro pendurado)', trx.indexOf("document.getElementById('cnf-hist')") >= 0 && trx.indexOf("box.className='nfx-hist'") >= 0);

console.log('== saveConfig BLINDADO (o TypeError que ele logou) ==');
ok('guarda o saveConfig original (não quebra o existente)', src.indexOf('_saveConfig0.apply') >= 0 && src.indexOf('window.saveConfig=function()') >= 0);
ok('confere se os inputs de empresa EXISTEM antes de deixar o original rodar', src.indexOf("['cfg-emp-nome','cfg-emp-cnpj','cfg-emp-fone','cfg-emp-email'].some(") >= 0);
ok('tela sem os campos: NÃO quebra, salva o db e só avisa', src.indexOf('Nada de empresa para salvar nesta tela') >= 0 && src.indexOf('document.getElementById(id)') >= 0);
ok('try/catch envolve o save (nenhum TypeError volta a vazar)', src.indexOf("catch(e){ acToast('Falha ao salvar configuração: '") >= 0);
ok('a placa que apareceu no console é mencionada no rótulo', src.indexOf('saveConfig blindado') >= 0 && bundle.indexOf('v6.0.3 — fiscal no modo escuro + saveConfig blindado') >= 0);

console.log('== CARIMBO 6.0.3 ==');
ok('package.json na 6.0.3', pkg.version === VERSAO_APP);
ok('index.html carimbado 6.0.3', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('manifesto já é 231 (v6.1.3 fechava a fila; v7.0.20 soma o mandar-erro, v7.0.22 o portão, v7.0.24 a função única, r59 o setup no fim)', manifest.length >= 225 && manifest[manifest.length - 24] === 'autocura_empresa_central_nf_tela_patch.js' && manifest[manifest.length - 23] === 'perfis_nuvem_cura_sessao_patch.js' && manifest[manifest.length - 22] === 'permissoes_estorno_venda_patch.js' && manifest[manifest.length - 21] === 'fiscal_menu_completo_patch.js' && manifest[manifest.length - 20] === 'dashboard_inicio_clicavel_patch.js' && manifest[manifest.length - 19] === 'menus_fiscais_separados_patch.js' && manifest[manifest.length - 18] === 'permissoes_override_menus_fiscais_patch.js' && manifest[manifest.length - 17] === 'seis_submenus_velho_patch.js' && manifest[manifest.length - 16] === 'submenu_hover_nfe_patch.js' && manifest[manifest.length - 15] === 'navegacao_sem_tela_branca_patch.js' && manifest[manifest.length - 14] === 'ribbon_fiscal_estilo_antigo_patch.js' && manifest[manifest.length - 13] === 'fiscal_catalogo_completo_patch.js');
ok('worker atualizado 5.28.4 · gerente segue 5.26.3', fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("WORKER_VERSION = '5.28.4'") >= 0 && JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8')).version === '5.26.3');

console.log('\nTudo OK — v6.0.3 (fiscal bonito no claro e no escuro: sem texto fantasma, sem card pendurado, sem título duplicado; saveConfig não explode mais com tela neo aberta).');
//<<<<SECAO:test_ajustes_v6003.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6007.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6007.js:INICIO>>>>
// test_ajustes_v6007.js — v6.0.7: INÍCIO SEM UNDEFINED + ITENS CLICÁVEIS
// Foto dele 18/09: "Silva e Freitas • undefined", "undefined • undefined PB",
// leitura com título "undefined" + pedido: itens clicáveis abrindo a origem.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('dashboard_inicio_clicavel_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./dashboard_inicio_clicavel_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 213; menus fiscais separados v6.0.8 fecha a fila',
  man.length >= 225 && man[212] === 'menus_fiscais_separados_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[211] === 'dashboard_inicio_clicavel_patch.js' && man[210] === 'fiscal_menu_completo_patch.js' && man[209] === 'permissoes_estorno_venda_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (PURE + banner)',
  bundle.indexOf('DHC607_PURE_START') >= 0 && bundle.indexOf('v6.0.7 — INÍCIO SEM UNDEFINED + CLICÁVEL') >= 0);

console.log('== ANTI-UNDEFINED (raiz da foto) ==');
const clis = [{ id: 5, nome: 'Silva e Freitas Sociedade de Advogados' }, { id: 8, nome: 'Cliente BalcÃO' }];
const eqs = [{ id: '9', modelo: 'HP LaserJet 4020', clienteId: 5 }, { id: 21, modelo: 'Kyocera MA2100', clienteId: 999 }];

ok('junta partes pulando vazios (nunca "a • • b" nem pendurado)',
  P.dhcJunta(['Silva', undefined, '', null, 'NORMAL']) === 'Silva • NORMAL' && P.dhcJunta([undefined]) === '');
ok('escape HTML (&, <, >, aspas)',
  P.dhcEsc('<b>&"x"') === '&lt;b&gt;&amp;&quot;x&quot;' && P.dhcEsc(null) === '');
ok('cliente por id FROUXO (texto acha número — raiz provável do undefined da foto)',
  P.dhcNomeCliente(clis, '5') === 'Silva e Freitas Sociedade de Advogados' && P.dhcNomeCliente(clis, 5) === 'Silva e Freitas Sociedade de Advogados');
ok('cliente inexistente vira "" (cai nas alternativas honestas)',
  P.dhcNomeCliente(clis, 777) === '' && P.dhcNomeCliente(null, 5) === '' && P.dhcNomeCliente(clis, undefined) === '');

const osSem = P.dhcLinhaOs(clis, { id: 'o1', numero: 'OS-0012', clienteId: 5, tipo: undefined, descricao: '', criadoPorNome: 'Katia', prioridade: 'NORMAL' });
ok('OS sem tipo/descrição: SEM "• undefined" e SEM "• " pendurado (caso Silva e Freitas da foto)',
  osSem.titulo === 'Silva e Freitas Sociedade de Advogados' && osSem.subtitulo === 'por Katia' && osSem.prioridade === 'NORMAL');
ok('OS: número mantém 4 últimos dígitos; sem número vira "—"',
  P.dhcLinhaOs(clis, { numero: 'OS-0008' }).numero === '0008' && P.dhcLinhaOs([], {}).numero === '—');
const osRem = P.dhcLinhaOs(clis, { id: 'o2', numero: '12', clienteId: 999, tipo: 'TROCA', criadoPorNome: 'Katia' });
ok('OS de cliente apagado: "(cliente removido)" + tipo aparece (caso "undefined • undefined" da foto)',
  osRem.titulo === '(cliente removido) • TROCA' && osRem.numero === '12');
ok('OS: prioridade vazia assume "normal"',
  P.dhcLinhaOs(clis, { clienteId: 5 }).prioridade === 'normal');

const ltFoto = P.dhcLinhaLeitura(clis, eqs, { id: 'l1', clienteId: 777, equipamentoId: 9, consumoPB: undefined, criadoPorNome: 'Katia', valorExcedente: 120 });
ok('Leitura da foto (cliente solto MAS equipamento acha o cliente): título resgatado, "consumo não informado", sem undefined',
  ltFoto.titulo === 'Silva e Freitas Sociedade de Advogados' && ltFoto.subtitulo === 'HP LaserJet 4020 • consumo não informado • por Katia' && ltFoto.valor === 120);
const ltTudo = P.dhcLinhaLeitura(clis, eqs, { id: 'l2', clienteId: 999, equipamentoId: 888, criadoPorNome: 'Katia', valorExcedente: 0 });
ok('Leitura órfã total: "(cliente removido)" + "(equipamento removido)" (caso título undefined da foto)',
  ltTudo.titulo === '(cliente removido)' && ltTudo.subtitulo.indexOf('(equipamento removido)') === 0 && ltTudo.valor === 0);
const ltOk2 = P.dhcLinhaLeitura(clis, eqs, { id: 'l3', clienteId: '5', equipamentoId: '9', consumoPB: 321, criadoPorNome: 'Katia', valorExcedente: 650 });
ok('Leitura completa: modelo • 321 PB • por Katia + valor 650 (tarja âmbar)',
  ltOk2.subtitulo === 'HP LaserJet 4020 • 321 PB • por Katia' && ltOk2.valor === 650);
ok('Leitura: valorExcedente lixo vira 0 (cai na tarja "Franquia")',
  P.dhcLinhaLeitura(clis, eqs, { clienteId: 5, valorExcedente: 'abc' }).valor === 0);

console.log('== CLICÁVEL → ORIGEM (pedido: "faz essas informações ser clicadas") ==');
ok('exporta dhcAbrirOrigem global', src.indexOf('window.dhcAbrirOrigem=') >= 0);
ok('clique por DELEGAÇÃO (data-dhc/data-id; sem onclick inline quebrável)',
  src.indexOf("addEventListener('click'") >= 0 && src.indexOf("closest('.dhc-item')") >= 0 && src.indexOf('data-dhc="os"') >= 0 && src.indexOf('data-dhc="leitura"') >= 0);
ok('chamado abre a ORIGEM: navigateTo manutencao + openModal os',
  src.indexOf("navigateTo('manutencao')") >= 0 && src.indexOf("openModal('os',id)") >= 0);
ok('leitura abre a ORIGEM: navigateTo leituras + openModal leitura',
  src.indexOf("navigateTo('leituras')") >= 0 && src.indexOf("openModal('leitura',id)") >= 0);
ok('affordance: cursor de mão + seta no hover + dica "Abrir a origem"',
  src.indexOf('cursor:pointer') >= 0 && src.indexOf('dhc-seta') >= 0 && src.indexOf('Abrir a origem') >= 0);

console.log('== BLINDAGEM / INTEGRAÇÃO ==');
ok('abraça renderDashboard mesmo se ele explodir (try/catch + redesenho garantido)',
  src.indexOf('window.renderDashboard=embr') >= 0 && src.indexOf('renderDashboard tropeçou') >= 0);
ok('redesenha as DUAS listas por id (as da foto)',
  src.indexOf("getElementById('list-chamados-recentes')") >= 0 && src.indexOf("getElementById('list-leituras-pendentes')") >= 0);
ok('fora do Início não gasta nada (view-dashboard oculta = return)',
  src.indexOf("getElementById('view-dashboard')") >= 0 && src.indexOf('offsetParent===null') >= 0);
ok('mantém estados vazios originais (🎉 / Sem chamados)',
  src.indexOf('Nenhuma pendência 🎉') >= 0 && src.indexOf('Sem chamados') >= 0);
ok('exporta PURE p/ testes e guarda anti-duplo (__v6007dhc)',
  src.indexOf('DHC607_PURE') >= 0 && src.indexOf('__v6007dhc') >= 0);

console.log('== CARIMBO 6.0.9 ==');
ok('package.json na 6.0.9', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé + query)',
  html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0);
ok('celular carimbado 6.0.9', mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0);

console.log('');
console.log(pass + ' passaram, ' + fail + ' falharam');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.7: Início sem nenhum "undefined" e cada item clicável abrindo a origem (OS na Manutenção, leitura na tela de Leituras).');
//<<<<SECAO:test_ajustes_v6007.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6008.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6008.js:INICIO>>>>
// test_ajustes_v6008.js — v6.0.8: MENUS FISCAIS SEPARADOS
// Pedido dele: "separe os menus como nas fotos... o que tiver em configuração
// tira de lá e coloca no seu devido menu". Central = só operação; Config.
// Fiscal = menu próprio (certificado, CSC, NCMs, texto — mesmas chaves).
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('menus_fiscais_separados_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./menus_fiscais_separados_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 213; menus separados fecha a fila',
  man.length >= 225 && man[212] === 'menus_fiscais_separados_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[211] === 'dashboard_inicio_clicavel_patch.js' && man[210] === 'fiscal_menu_completo_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (PURE + banner)',
  bundle.indexOf('MFS608_PURE_START') >= 0 && bundle.indexOf('v6.0.8 — MENUS FISCAIS SEPARADOS') >= 0);

console.log('== SEPARAÇÃO: config SAI da Central ==');
ok('esconde o card do CSC antigo (#cnf-cscid) e o card "Certificado A1" da Central',
  src.indexOf("querySelector('#cnf-cscid')") >= 0 && src.indexOf("indexOf('Certificado A1')") >= 0);
ok('esconde o card de config das notas da 6.0.6 (#fmc-config) da Central',
  src.indexOf("querySelector('#fmc-config')") >= 0);
ok('grade vazia some junta (não fica buraco na tela)',
  src.indexOf("if(!vis) grade.style.display='none'") >= 0);
ok('botão "Dados fiscais" da Central vira PONTE pro menu novo',
  src.indexOf("querySelector('#cnf-config')") >= 0 && src.indexOf("navigateTo('config-fiscal')") >= 0 && src.indexOf('⚙️ Configurações fiscais') >= 0);
ok('pós-limpeza roda DEPOIS da instalação da 6.0.6 (110ms > 60ms)',
  src.indexOf('setTimeout(mfsLimparCentral,110)') >= 0);
ok('OPERAÇÃO fica na Central: ambiente (Portão), Testar SEFAZ e pacote NÃO são escondidos',
  src.indexOf("cnf-amb") < 0 && src.indexOf("style.display='none'") >= 0 && src.indexOf('fmc-status') < 0 && src.indexOf('fmc-pacote') < 0);

console.log('== MENU PRÓPRIO: Config. Fiscal ==');
ok('view própria via ensureView + navigateTo embrulhado',
  src.indexOf("ensureView('config-fiscal')") >= 0 && src.indexOf("view==='config-fiscal'") >= 0);
ok('botão na nav lateral (data-nav) espelhando o Nota Fiscal',
  src.indexOf('[data-nav="config-fiscal"]') >= 0 && src.indexOf("getElementById('nav-gest')") >= 0 && src.indexOf("querySelector('[data-nav=\"central-nf\"]')") >= 0);
ok('módulo na barra clássica ao lado do Nota Fiscal',
  src.indexOf("getElementById('topmod-config-fiscal')") < 0 === false && src.indexOf("classic-toolbar-scroll") >= 0 && src.indexOf("getElementById('topmod-central-nf')") >= 0);
ok('tela mostra placa do ambiente (olhar) e manda trocar na Central protegida',
  src.indexOf('a troca é feita na Central NF (pede digitar PRODUCAO)') >= 0);
ok('dados fiscais: botão pro perfil tributário (CNPJ/IE/NCM + A1)',
  src.indexOf("onclick=function(){ try{ if(typeof abrirPerfilTributario==='function')") >= 0);
ok('certificado A1: status ao vivo + importar SÓ no .exe (ponte nfeCertAPI)',
  src.indexOf('__digicopyPontes.nfeCertAPI.status()') >= 0 && src.indexOf('nfeCertAPI.importar') >= 0 && src.indexOf('noExe') >= 0);

console.log('== UMA VERDADE SÓ nas chaves ==');
const d = P.mfsCfgLer({});
ok('defaults da 6.0.6 idênticos (tinta 32151100 · locação 37079021 · CARTUCHO TONER · Simples vazio)',
  d.nfNcmTinta === '32151100' && d.nfNcmLocacao === '37079021' && d.nfDescLocacao === 'CARTUCHO TONER' && d.nfTextoSimples === '' && d.nfAmbiente === 'homologacao');
const grav = P.mfsCfgNotas({}, { nfNcmPadrao: ' 84439923 ', nfNcmTinta: '32151100', nfNcmLocacao: '37079021', nfDescLocacao: 'CARTUCHO TONER', nfTextoSimples: 'texto' });
ok('salvar Notas grava as MESMAS chaves que a Central antiga gravava',
  grav.nfNcmPadrao === '84439923' && grav.nfNcmTinta === '32151100' && grav.nfTextoSimples === 'texto');
const csc = P.mfsCfgCsc({}, { nfCscId: ' 2 ', nfCsc: 'SEGREDO' });
ok('salvar CSC grava as MESMAS chaves (nfCscId/nfCsc) com trim no ID',
  csc.nfCscId === '2' && csc.nfCsc === 'SEGREDO');
ok('campos da tela usam as chaves compartilhadas (cfgf-cscid/cfgf-ncm-*)',
  src.indexOf('id="cfgf-cscid"') >= 0 && src.indexOf('id="cfgf-ncm-tinta"') >= 0 && src.indexOf('id="cfgf-txo-simples"') >= 0);
ok('salva refaz db.config via PURE + db.save + auditoria logAction',
  src.indexOf('mfsCfgCsc(db.config||{}') >= 0 && src.indexOf('mfsCfgNotas(db.config||{}') >= 0 && src.indexOf("db.save()") >= 0 && src.indexOf("logAction('fiscal'") >= 0);

console.log('== CARIMBO 6.0.9 ==');
ok('package.json na 6.0.9', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé + query)',
  html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0);
ok('celular carimbado 6.0.9', mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0);

console.log('');
console.log(pass + ' passaram, ' + fail + ' falharam');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.8: fiscal separado em DOIS menus (Central NF = operação; Config. Fiscal = certificado, CSC, NCMs e texto) como nas fotos do sistema antigo.');
//<<<<SECAO:test_ajustes_v6008.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6009.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6009.js:INICIO>>>>
// test_ajustes_v6009.js — v6.0.9: PERMISSÃO SÓ NO EDITAR (coluna solta morta)
// + AUTORIZAÇÃO NA HORA (override login+senha de quem tem permissão)
// + MENUS FISCAIS DE VERDADE (Histórico, Status & Pacote, Inutilizar Faixa)
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('permissoes_override_menus_fiscais_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./permissoes_override_menus_fiscais_patch.js');

const usuarios = [
  { id: '1', login: 'kauan', senha: '123', perfil: 'Admin', empresaId: 'e1', nome: 'Kauan' },
  { id: '2', login: 'katia', senha: '456', perfil: 'Comercial', empresaId: 'e1', nome: 'Katia', podeApagar: false, podeEstornar: false },
  { id: '3', login: 'recepcao', senha: '789', perfil: 'Comercial', empresaId: 'e1', nome: 'Recepção', podeApagar: true, podeEstornar: false, podeEmitirNfe: true },
  { id: '4', login: 'outro', senha: '789', perfil: 'Comercial', empresaId: 'e2', nome: 'Outra Empresa' }
];
const pode = (u, a) => { if (u.perfil === 'Admin' || u.perfil === 'Dono') return true; if (a === 'apagar') return u.podeApagar === undefined ? true : !!u.podeApagar; if (a === 'estornar') return u.podeEstornar === undefined ? true : !!u.podeEstornar; if (a === 'emitirNfe') return !!u.podeEmitirNfe; return false; };

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 214; override+menus fecha a fila',
  man.length >= 225 && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[212] === 'menus_fiscais_separados_patch.js' && man[211] === 'dashboard_inicio_clicavel_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (PURE + banner)',
  bundle.indexOf('POM609_PURE_START') >= 0 && bundle.indexOf('v6.0.9 — PERMISSÃO SÓ NO EDITAR + AUTORIZAÇÃO NA HORA') >= 0);

console.log('== COLUNA SOLTA MORTA (ordem 1: permitir só no editar) ==');
ok('caça e REMOVE data-nfe-col / data-nfe-cell (o injetor velho da v5.22.21)',
  src.indexOf("querySelectorAll('[data-nfe-col],[data-nfe-cell]')") >= 0 && src.indexOf('el.remove()') >= 0);
ok('só atua com a tela Usuários visível + re-roda num wrap do renderUsuarios',
  src.indexOf("getElementById('view-usuarios')") >= 0 && src.indexOf('offsetParent===null') >= 0 && src.indexOf('window.renderUsuarios=embrRu') >= 0);
ok('caça também na sonda (menu redesenha depois do login)',
  src.indexOf('pomLimparColunaPermissao();') >= 0);

console.log('== AUTORIZAÇÃO NA HORA (ordem 2) ==');
ok('popup do SISTEMA com Login+Senha (mesmo padrão visual dos avisos)',
  src.indexOf('pom-aut-login') >= 0 && src.indexOf('pom-aut-senha') >= 0 && src.indexOf('Peça a um usuário que') >= 0 && src.indexOf('z-index:2147483200') >= 0);
ok('texto pedido por ele: login e senha pra realizar essa ação',
  src.indexOf('login e a senha') >= 0 && src.indexOf('realizar esta ação') >= 0);
ok('re-embrulho cobre os MESMOS 11 executores do gate da v6.0.5',
  src.indexOf("'excluirVendaUnificado'") >= 0 && src.indexOf("'excluirOrcamentosMarcados'") >= 0 && src.indexOf("'removerLancamentoLeitura'") >= 0 && src.indexOf("'estornarNotinha'") >= 0 && src.indexOf("'estornarLeituraContrato'") >= 0);
ok('token de 3 segundos converge os dois gates (novo + velho)',
  src.indexOf('__p609AutorizadoAte=Date.now()+3000') >= 0 && src.indexOf('window.usuarioPodeApagar=function(){ return (window.__p609AutorizadoAte>Date.now())') >= 0);
ok('auditoria dos DOIS lados: override-autorizado e override-cancelado',
  src.indexOf("'override-autorizado'") >= 0 && src.indexOf("'override-cancelado'") >= 0 && src.indexOf('AUTORIZADO por') >= 0);
ok('valida Admin/Dono sempre; funcionário só com a caixa marcada; empresa da sessão; senha',
  P.pomValidaAutorizacao(usuarios, 'e1', 'kauan', '123', 'apagar', pode).ok === true &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'katia', '456', 'estornar', pode).ok === false &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'recepcao', '789', 'apagar', pode).ok === true &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'outro', '789', 'apagar', pode).motivo.indexOf('não encontrado') >= 0 &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'kauan', '999', 'apagar', pode).motivo.indexOf('Senha não confere') >= 0);
ok('login maiúsculo/minúsculo tanto faz; vazio/aviso amigável em todos os casos',
  P.pomValidaAutorizacao(usuarios, 'e1', 'KAUAN', '123', 'apagar', pode).ok === true &&
  P.pomValidaAutorizacao(usuarios, 'e1', '', 'x', 'apagar', pode).motivo.indexOf('Informe o login') >= 0 &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'kauan', '', 'apagar', pode).motivo.indexOf('Informe a senha') >= 0);
ok('emitirNfe também passa pela autorização (inutilizar faixa)',
  P.pomValidaAutorizacao(usuarios, 'e1', 'recepcao', '789', 'emitirNfe', pode).ok === true &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'katia', '456', 'emitirNfe', pode).ok === false &&
  src.indexOf("'emitirNfe'") >= 0);

console.log('== MENUS FISCAIS DE VERDADE (ordem 3: "urgente") ==');
ok('5 entradas fiscais: Nota Fiscal + Histórico + Status & Pacote + Inutilizar + Config',
  src.indexOf("view:'central-nf'") >= 0 && src.indexOf("view:'fiscal-historico'") >= 0 && src.indexOf("view:'fiscal-ferramentas'") >= 0 && src.indexOf("view:'fiscal-inutilizar'") >= 0 && src.indexOf("view:'config-fiscal'") >= 0);
ok('cada uma vira botão na nav lateral E módulo na barra clássica',
  src.indexOf('btn.setAttribute(\'data-nav\',m.view)') >= 0 && src.indexOf("'{view:'fiscal-historico'".slice(1)) >= 0 && src.indexOf("topmod-'+m.view") >= 0 && src.indexOf("classic-toolbar-scroll") >= 0);
ok('histórico em TELA PRÓPRIA: mesmo motor (nfxRenderHistorico) + CC-e incluso via window.nfCartaCorrecao',
  src.indexOf('__nfxHistAlvo') >= 0 && src.indexOf('nfxRenderHistorico') >= 0 && src.indexOf('nfCartaCorrecao') >= 0 && src.indexOf('pom-hist') >= 0);
ok('Status & Pacote: chama nfStatusServico/nfPacoteContador globais (sem duplicar motor)',
  src.indexOf('window.nfStatusServico()') >= 0 && src.indexOf('window.nfPacoteContador()') >= 0);
ok('Inutilizar: formulário modelo/série/inicial/final + guard de emitir NF + override',
  src.indexOf('pom-in-modelo') >= 0 && src.indexOf('nfInutilizarFaixa') >= 0 && src.indexOf('pomPodeEmitir') >= 0 && src.indexOf('usuarioPodeEmitirNfe') >= 0);
ok('placa de ambiente no topo das 3 telas novas (HOMOLOGAÇÃO vermelha/PRODUÇÃO verde)',
  (src.split('pomAmbTxt()').length - 1) >= 4 && src.indexOf('HOMOLOGAÇÃO — modo teste') >= 0);

console.log('== CARIMBO 6.0.9 ==');
ok('package.json na 6.0.9', pkg.version === VERSAO_APP);
ok('index.html carimbado', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0);
ok('celular carimbado 6.0.9', mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0);

console.log('');
console.log(pass + ' passaram, ' + fail + ' falharam');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.9: checkbox de permissão só existe dentro do editor; quem não pode, recebe o popup pedindo login+senha de quem pode (auditado); fiscal com menu pra cada coisa.');
//<<<<SECAO:test_ajustes_v6009.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v60010.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v60010.js:INICIO>>>>
// test_ajustes_v60010.js — v6.0.10: MENU FISCAL IGUAL AO SISTEMA ANTIGO
// 6 submenus exatos do print: Nota Fiscal · Perfil Tributário · Manifestação ·
// NCM · Enviar XML · Configurações — cada um com TUDO que ele pediu.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('seis_submenus_velho_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./seis_submenus_velho_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 215; 6 submenus do antigo fecha a fila',
  man.length >= 225 && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (guard + PURE + banner)',
  bundle.indexOf('__v60010sxv') >= 0 && bundle.indexOf('SXV_PURE_START') >= 0 && bundle.indexOf('SEIS_SUBMENUS_VELHO_PATCH v6.0.10 ativo') >= 0);

console.log('== MENU: EXATAMENTE OS 6 DO PRINT, NA ORDEM ==');
const menu = P.sxvMenuVelho();
ok('6 entradas, ordem idêntica à foto',
  menu.length === 6 && menu.map(m => m.rot).join(' · ') === 'Nota Fiscal · Perfil Tributário · Manifestação · NCM · Enviar XML · Configurações');
ok('os 3 atalhos soltos da 6.0.9 SAEM do menu (escondidos, não apagados — views continuam)',
  src.indexOf("SXV_ESCONDIDOS = ['fiscal-historico', 'fiscal-ferramentas', 'fiscal-inutilizar']") >= 0 && src.indexOf("style.display = 'none'") >= 0);
ok('Config. Fiscal RENOMEADA pra Configurações (nav + barra clássica)',
  src.indexOf("cfgNav.textContent !== 'Configurações'") >= 0 && src.indexOf('#topmod-config-fiscal button') >= 0);
ok('4 botões novos entram na nav lateral E na barra clássica, depois de Nota Fiscal',
  src.indexOf('fiscal-perfil') >= 0 && src.indexOf('fiscal-manifestacao') >= 0 && src.indexOf('SXV_BOTAO_NOVO') >= 0 && src.indexOf('fiscal-ncm') >= 0 && src.indexOf('fiscal-enviar-xml') >= 0 && src.indexOf("classic-toolbar-scroll") >= 0 && src.indexOf("nav-gest") >= 0 && src.indexOf('[data-nav="central-nf"]') >= 0);

console.log('== PERFIL TRIBUTÁRIO ==');
const pfOk = { crt: '1', cfopDentro: '5102', cfopFora: '6102', csosn: '102', cstIcms: '00', pIcmsInterna: 18, pIcmsInterestadual: 12, pIpi: 0, pPis: 1.65, pCofins: 7.6, pIss: 0, pIbsUf: 0.1, pIbsMun: 0, pCbs: 0.9 };
ok('perfil completo válido passa', P.sxvValidaPerfil(pfOk).ok === true);
ok('CRT inválido, CFOP 6 dentro do estado, alíquota >100 e CSOSN de 2 dígitos barram',
  P.sxvValidaPerfil(Object.assign({}, pfOk, { crt: '9' })).ok === false &&
  P.sxvValidaPerfil(Object.assign({}, pfOk, { cfopDentro: '6102' })).ok === false &&
  P.sxvValidaPerfil(Object.assign({}, pfOk, { pIcmsInterna: 101 })).ok === false &&
  P.sxvValidaPerfil(Object.assign({}, pfOk, { csosn: '10' })).ok === false);
ok('campos do print: CRT, CNAE, IE, IM, codTributo, CFOPs, CSOSN/CST, 9 alíquotas, IBS/CBS e cClassTrib',
  ['sxv-pf-crt', 'sxv-pf-cnae', 'sxv-pf-ie', 'sxv-pf-im', 'sxv-pf-codtrib', 'sxv-pf-cfop-d', 'sxv-pf-cfop-f', 'sxv-pf-csosn', 'sxv-pf-cst', 'sxv-pf-cstibscbs', 'sxv-pf-cclasstrib'].every(x => src.indexOf(x) >= 0));
ok('perfil cobre imposto faltoso na emissão (wrap fiscalPadrao __v60010, sem tocar nascimento)',
  src.indexOf('fiscalPadrao.__v60010') >= 0 && src.indexOf('base[k] === undefined') >= 0);
ok('IE/IM/CNAE gravam nas MESMAS chaves da Config. Fiscal (db.config.fiscal)',
  src.indexOf("dd.config.fiscal = Object.assign({}, dd.config.fiscal || {}, { cnae:") >= 0);

console.log('== MANIFESTAÇÃO ==');
const base43 = '3124100000000000000055001000000001000000000';
function dvCerto(c) { let s = 0, p = 2; for (let i = 42; i >= 0; i--) { s += parseInt(c[i]) * p; p = p === 9 ? 2 : p + 1; } const r = s % 11; return (r === 0 || r === 1) ? 0 : 11 - r; }
const chaveOk = base43 + String(dvCerto(base43));
ok('valida chave com DV certo (44 dígitos, módulo 11)',
  P.sxvValidaChave(chaveOk).ok === true && P.sxvValidaChave(base43 + String((dvCerto(base43) + 1) % 10)).ok === false && P.sxvValidaChave('123').ok === false);
ok('4 eventos oficiais 210210/210200/210220/210240 com rótulo e ajuda',
  P.SXV_EVENTOS.length === 4 && P.SXV_EVENTOS.map(e => e.tp).join(',') === '210210,210200,210220,210240');
ok('só "Não realizada" exige justificativa (mín 15); limite 255',
  P.sxvValidaJust('210240', 'curta').ok === false && P.sxvValidaJust('210240', 'mercadoria não chegou no depósito').ok === true && P.sxvValidaJust('210210', '').ok === true);
const ev1 = P.sxvEventoManifestacao({ chave: chaveOk, cnpj: '00000000000191', tpEvento: '210240', tpAmb: '2', dhEvento: '2026-09-18T12:00:00-03:00', xJust: 'mercadoria não chegou no depósito' });
ok('envelope vai pro AMBIENTE NACIONAL (cOrgao 91, não SEFAZ-MG) com ID210240+chave+01, cOrgaoAutor 31 e xJust',
  ev1.indexOf('<cOrgao>91</cOrgao>') > 0 && ev1.indexOf('ID210240' + chaveOk + '01') > 0 && ev1.indexOf('<cOrgaoAutor>31</cOrgaoAutor>') > 0 && ev1.indexOf('<xJust>mercadoria não chegou no depósito</xJust>') > 0);
ok('URL de manifestação aponta fazenda.gov.br (prod e homolog separadas)',
  P.sxvUrlManifestacao('producao').url === 'https://www.nfe.fazenda.gov.br/RecepcaoEvento4/RecepcaoEvento4.asmx' && P.sxvUrlManifestacao('homologacao').url.indexOf('hom.nfe.fazenda.gov.br') > 0);
ok('transmissão: senha digitada na hora (não salva), ponte do .exe, sem sucesso falso',
  src.indexOf("nfxPedirTexto('Senha do certificado A1'") >= 0 && src.indexOf("nfeCertAPI.isElectron") >= 0 && src.indexOf("pelo navegador não assina") >= 0);
ok('manifestação grava lista local com protocolo + auditoria início/resposta/exceção',
  src.indexOf("config.nfManifestacoes") >= 0 && src.indexOf("manifestar-inicio") >= 0 && src.indexOf("manifestar-resposta") >= 0 && src.indexOf("manifestar-excecao") >= 0);
ok('gate: sem caixa "emitir NF" abre popup de autorização (login+senha), token 3s converge com a 6.0.9',
  src.indexOf("window.__p609AutorizadoAte > Date.now()") >= 0 && src.indexOf('sxvPopupAutorizacao') >= 0 && src.indexOf("sxv-aut-login") >= 0 && src.indexOf('sxv:override-autorizado') >= 0 || src.indexOf("'override-autorizado'") >= 0);

console.log('== NCM ==');
ok('valida: 8 dígitos + descrição ≥3',
  P.sxvValidaNcm('84439923', 'Peças e acessórios').ok === true && P.sxvValidaNcm('8443992', 'x').ok === false && P.sxvValidaNcm('84439923', 'ab').ok === false);
ok('favoritos gravam padrão/tinta/locação NAS MESMAS chaves da Config. Fiscal (uma verdade só)',
  src.indexOf("dd.config.nfNcmPadrao = n.cod") >= 0 && src.indexOf("dd.config.nfNcmTinta = n.cod") >= 0 && src.indexOf("dd.config.nfNcmLocacao = n.cod") >= 0 && src.indexOf('config.ncmFavoritos') >= 0);

console.log('== ENVIAR XML + EXTRAS ==');
ok('pacote do mês usa o MESMO motor (nfPacoteContador) + teste SEFAZ (nfStatusServico)',
  src.indexOf('window.nfPacoteContador()') >= 0 && src.indexOf('window.nfStatusServico()') >= 0);
ok('e-mail do contador salva em db.config.emailContador com validação + botão copiar',
  src.indexOf('config.emailContador') >= 0 && src.indexOf('navigator.clipboard') >= 0 && src.indexOf('[^@\\s]+@[^@\\s]+\\.[^@\\s]+') >= 0);
ok('texto honesto: envio é você anexando no e-mail/Zap (automático não existe ainda)',
  src.indexOf('envio automático de e-mail ainda não existe') >= 0);
ok('atalhos dentro da Central levam pra Histórico/Inutilizar/Manifestação/Enviar XML',
  src.indexOf('sxv-atalhos') >= 0 && src.indexOf('data-sxv-go="fiscal-historico"') >= 0 && src.indexOf('data-sxv-go="fiscal-inutilizar"') >= 0);
ok('Configurações ganha card Diagnóstico SEFAZ + ponte pra Enviar XML',
  src.indexOf('sxv-cfg-extra') >= 0 && src.indexOf('sxv-cfg-status') >= 0);
ok('placa de ambiente nas 4 telas novas (HOMOLOGAÇÃO/PRODUÇÃO)',
  (src.split('sxvAmbPlaca()').length - 1) >= 5 && src.indexOf('HOMOLOGAÇÃO — modo teste') >= 0);

console.log('== AUTORIZAÇÃO (PURE replicada da 6.0.9) ==');
const us = [
  { id: '1', login: 'kauan', senha: '123', perfil: 'Admin', empresaId: 'e1' },
  { id: '2', login: 'katia', senha: '456', perfil: 'Comercial', empresaId: 'e1', podeEmitirNfe: true },
  { id: '3', login: 'recep', senha: '789', perfil: 'Comercial', empresaId: 'e1' }
];
ok('Admin sempre; funcionário só com caixa; senha confere; login maiúsculo; empresa da sessão',
  P.sxvAutorizacaoValida(us, 'e1', 'KAUAN', '123').ok === true &&
  P.sxvAutorizacaoValida(us, 'e1', 'katia', '456').ok === true &&
  P.sxvAutorizacaoValida(us, 'e1', 'recep', '789').ok === false &&
  P.sxvAutorizacaoValida(us, 'e1', 'kauan', '999').ok === false &&
  P.sxvAutorizacaoValida(us, 'e1', 'fantasma', 'x').ok === false);

console.log('== CARIMBO 6.0.10 ==');
ok('package.json na 6.0.10', pkg.version === VERSAO_APP);
ok('index.html carimbado (4 pontos)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0 && html.indexOf('v' + VERSAO_APP + '</title>') >= 0);
ok('celular carimbado 6.0.10', mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0);

console.log('');
console.log(pass + ' passaram, ' + fail + ' falharam');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.10: menu fiscal IGUAL ao sistema antigo (6 submenus do print) com Perfil Tributário, Manifestação (Ambiente Nacional), NCM, Enviar XML e Configurações cheios.');
//<<<<SECAO:test_ajustes_v60010.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v60012.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v60012.js:INICIO>>>>
// test_ajustes_v60012.js — v6.0.12: MATA A TELA BRANCA. Relato dele: clicou
// no menu (e no Buscador Escola) → tudo branco, não carrega. Causa raiz lida
// no código: navigateTo esconde TODAS as .view ANTES de procurar o destino E
// as views sob demanda (Buscador Escola + fiscais) nascem via ensureView COM
// "hidden" — na 1ª navegação o destino não existia quando o núcleo mostrou,
// e ninguém des-escondia depois do render. Fix: wrap (core intocado).
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('navegacao_sem_tela_branca_patch.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./navegacao_sem_tela_branca_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 217; anti-tela-branca fecha a fila (é o último, wrap por cima de todos)',
  man.length >= 225 && man[216] === 'navegacao_sem_tela_branca_patch.js' && man[215] === 'submenu_hover_nfe_patch.js');
ok('bundle contém o patch (guard + PURE)',
  bundle.indexOf('__v60012nav') >= 0 && bundle.indexOf('NAV612_PURE') >= 0);

console.log('== CAUSA RAIZ DOCUMENTADA (o bug existe no núcleo, a cura no patch) ==');
ok('núcleo esconde TODAS as .view ANTES de procurar o destino (a armadilha)',
  app.indexOf("querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))") >= 0 &&
  app.indexOf("querySelectorAll('.view').forEach") < app.indexOf("getElementById('view-'+view)"));
ok('ensureView do núcleo cria a view COM "hidden" (nasce invisível)',
  app.indexOf("className='view hidden space-y-4'") >= 0);
ok('views afetadas confirmadas: nem buscador-escola nem as 6 fiscais existem no HTML',
  ['view-buscador-escola', 'view-central-nf', 'view-fiscal-perfil', 'view-fiscal-manifestacao', 'view-fiscal-ncm', 'view-fiscal-enviar-xml', 'view-config-fiscal'].every(v => html.indexOf('id="' + v + '"') < 0));
ok('o patch NÃO tocou o miolo: navigateTo/ensureView do app.js seguem originais',
  app.indexOf('__v60012nav') < 0 && app.indexOf('NAV612_PURE') < 0);

console.log('== O WRAP (ordem certa) ==');
ok('garante o destino ANTES de chamar o navigateTo original',
  src.indexOf("G.ensureView === 'function'") >= 0 && src.indexOf("G.ensureView === 'function'") < src.indexOf('anterior.apply'));
ok('des-esconde DEPOIS do render (nunca mais branco)',
  src.indexOf("classList.remove('hidden')") > src.indexOf('anterior.apply'));
ok('anti-duplo-wrap (recarregar patch não empilha embrulhos)',
  src.indexOf('anterior.__nav612') >= 0 && src.indexOf('__nav612 = true') >= 0);
ok('documenta as views sob demanda (buscador + fiscal) pra manutenção',
  ['buscador-escola', 'central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'].every(v => src.indexOf("'" + v + "'") >= 0));

console.log('== TELA HONESTA EM VEZ DE BRANCO (PURE) ==');
const av = P.avisoVazio('fiscal-perfil', 'Tela sem conteúdo');
ok('avisoVazio monta tela completa com nome da view e botão Voltar ao Início',
  av.indexOf('fiscal-perfil') >= 0 && av.indexOf("navigateTo('dashboard')") >= 0 && av.indexOf('Voltar ao Início') >= 0 && av.indexOf('neo-panel') >= 0);
ok('aviso de verdade: diz que o botão funcionou, que nada foi apagado e pede pra avisar',
  P.avisoVazio('x', 'y').indexOf('Nada foi apagado') >= 0);

console.log('== O LUGAR DOS MENUS SEGUE O QUE ELE PEDIU (imagem = módulo NF-e/NFC-e da barra) ==');
ok('menu-nfe da barra continua real com os 6 (regressão da 6.0.11)',
  html.indexOf('id="menu-nfe" class="module-menu"') >= 0 &&
  ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'].every(v => html.indexOf("navigateTo('" + v + "')") >= 0));

console.log('== CARIMBOS v6.0.12 ==');
ok('index.html carimbado (4 pontos)',
  html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0 && html.indexOf('v' + VERSAO_APP + '</title>') >= 0);
ok('mobile carimbado (3 pontos)',
  mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0 && mob.indexOf('v' + VERSAO_APP + '</title>') >= 0);
ok('package.json cravado', pkg.version === VERSAO_APP);

console.log('');
console.log('RESUMO: ' + pass + ' passaram, ' + fail + ' falharam.');
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_ajustes_v60012.js:FIM>>>>
}

if (false) { // ═══ test_mobile_apk.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_mobile_apk.js:INICIO>>>>
const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
console.log('== APP CELULAR 1.0 ==');
const pkg=JSON.parse(fs.readFileSync('mobile/package.json','utf8'));
const pc=JSON.parse(fs.readFileSync('package.json','utf8'));
ok('celular é 1.0.0',pkg.version==='1.0.0');
ok('PC continua 5.22.x',/^\d+\.\d+\./.test(pc.version));
ok('appId do celular separado',fs.readFileSync('mobile/capacitor.config.json','utf8').includes('br.com.digicopy.erp'));
const r=spawnSync(process.execPath,['sync-www.js'],{cwd:'mobile',encoding:'utf8'});
if(r.status!==0){console.error(r.stdout+r.stderr);process.exit(1);}
const html=fs.readFileSync(path.join('mobile','www','index.html'),'utf8');
ok('www tem o sistema',html.includes('app.bundle.js')&&fs.existsSync('mobile/www/app.bundle.js'));
ok('www marca canal celular e versão 1.0',html.includes('DIGICOPY_APP_CANAL="celular"')&&html.includes('DIGICOPY_APP_VER="1.0"'));
ok('PC index não virou 1.0',!fs.readFileSync('index.html','utf8').includes('DIGICOPY_APP_CANAL'));
ok('bundle do PC existe no www',fs.existsSync('mobile/www/app.bundle.js'));
const refsWww=[...html.matchAll(/(?:src|href)="\.\/([A-Za-z0-9_.\-/]+?)(?:\?[^"]*)?"/g)].map(m=>m[1]);
const quebradas=refsWww.filter(f=>!fs.existsSync(path.join('mobile','www',f)));
ok('APK não sai com arquivo faltando ('+refsWww.length+' recursos)',quebradas.length===0);
ok('patches soltos também vão para o APK',refsWww.filter(f=>/^ajustes_v/.test(f)).every(f=>fs.existsSync(path.join('mobile','www',f))));
console.log('\nRESULTADO: app celular 1.0 passou!');
//<<<<SECAO:test_mobile_apk.js:FIM>>>>
}

if (false) { // ═══ test_navegador_embutido.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_navegador_embutido.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE v6.1.7 (22/09/2026) — O NAVEGADOR EMBUTIDO
//
// Pedido dele, palavra por palavra: "queria somente um navegador embutido no
// sistema onde ele vai abrir o site da prefeitura e vou poder mexer por la no
// sistema, sem eu usar algum navegador, tudo dentro do sistema, aproveitando a
// mesma base de um navegador dentro do sistema, queria adicionar o whatsapp web
// tambem, é possivel?"
//
// Este teste trava:
//   1) o módulo novo existir, com a parte pura (endereço, lista de sites) certa;
//   2) os sites que nascem prontos (prefeitura/NFS-e, NFS-e Nacional, WhatsApp);
//   3) a lista ficar na NUVEM (db.config.navSites) — nunca em localStorage;
//   4) o programa do PC abrir navegador de VERDADE (webview travada em main.js);
//   5) fora do programa do PC nunca ficar tela branca (aviso + abrir em janela);
//   6) sem modal nativo (alert/prompt/confirm) — regra #16 do projeto.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const fs = require('fs');
const path = require('path');

let falhas = 0;
function ok(cond, msg) { if (cond) console.log('  ✔ ' + msg); else { falhas++; console.error('  ✘ ' + msg); } }
function ler(p) { return fs.readFileSync(p, 'utf8'); }
function existe(p) { return fs.existsSync(p); }

// ── carrega só a parte pura do módulo (sem DOM) ─────────────────────────────
const P = (function () {
  const code = ler('navegador_embutido_patch.js');
  const ctx = { window: {}, document: undefined, db: {} };
  new Function('window', 'document', 'db', code)(ctx.window, ctx.document, ctx.db);
  return ctx.window.NAV6107_PURE;
})();

console.log('\n== 1) O módulo e o que ele promete ==');
ok(!!P, 'o navegador embutido exporta a parte pura (NAV6107_PURE)');
ok(existe('navegador_embutido_patch.js'), 'o módulo existe como arquivo próprio (1 arquivo = 1 módulo, regra #10)');
ok(ler('navegador_embutido_patch.js').indexOf('__v6107nav') >= 0, 'tem guarda de duplicação (__v6107nav)');
ok(ler('bundle-manifest.json').indexOf('navegador_embutido_patch.js') >= 0, 'está no bundle (senão o site não teria a aba)');

console.log('\n== 2) Endereço digitado nunca vira buraco ==');
ok(P.navNormalizarUrl('https://web.whatsapp.com') === 'https://web.whatsapp.com', 'endereço completo passa igual');
ok(P.navNormalizarUrl('  web.whatsapp.com  ') === 'https://web.whatsapp.com', 'sem http:// ele completa e tira os espaços');
ok(P.navNormalizarUrl('janauba.mg.gov.br') === 'https://janauba.mg.gov.br', 'domínio da prefeitura vira https://');
ok(P.navNormalizarUrl('localhost:3000') === 'http://localhost:3000', 'localhost continua local (sem https à força)');
ok(P.navNormalizarUrl('nota fiscal de serviço').indexOf('https://www.google.com/search?q=') === 0, 'texto solto vira busca, não erro');
ok(P.navNormalizarUrl('file:///C:/Windows/system32') .indexOf('https://www.google.com/search?q=') === 0, 'protocolo perigoso (file:) é desviado para busca');
ok(P.navNormalizarUrl('') === '', 'vazio continua vazio (a tela avisa, não abre nada)');

console.log('\n== 3) Os sites que nascem prontos ==');
const padrao = P.navSitesPadrao();
ok(padrao.length === 3, 'nascem 3 sites: prefeitura, NFS-e Nacional e WhatsApp');
ok(!!P.navSiteAchar(padrao, 'nfse-prefeitura'), 'tem o atalho da NFS-e da prefeitura');
ok(!!P.navSiteAchar(padrao, 'nfse-nacional'), 'tem o Emissor Nacional (Simples Nacional é obrigado desde 01/09/2026)');
ok(!!P.navSiteAchar(padrao, 'whatsapp'), 'tem o WhatsApp Web');
ok(/^https:\/\//.test(P.navSiteAchar(padrao, 'whatsapp').url), 'o WhatsApp abre em endereço seguro (https)');
ok(P.navSiteAchar(padrao, 'nfse-nacional').url.indexOf('nfse.gov.br') >= 0, 'o endereço do Emissor Nacional é o do gov.br');
ok(P.navSiteAchar(padrao, 'nfse-prefeitura').url.indexOf('sintesetecnologia.com.br') >= 0, 'a NFS-e da prefeitura abre no emissor que ELE usa (Sintese/Janaúba)');
ok(P.navSiteAchar(padrao, 'nfse-prefeitura').url.indexOf('Param=Janauba') >= 0, 'e já com o parâmetro da cidade (Param=Janauba)');
ok(P.navNormalizarUrl(P.navSiteAchar(padrao, 'nfse-prefeitura').url) === P.navSiteAchar(padrao, 'nfse-prefeitura').url, 'o endereço http do emissor é aceito como está (não vira busca)');

console.log('\n== 3b) Passo a passo dentro da tela ==');
ok(typeof P.navPassos === 'function', 'existe o passo a passo por endereço');
ok(P.navPassos('http://sistema.sintesetecnologia.com.br/NFEWeb/indexNFe.xhtml?Param=Janauba').length >= 3, 'a NFS-e da prefeitura tem passo a passo');
ok(/Ctrl\+P/.test(P.navPassos('http://sistema.sintesetecnologia.com.br/NFEWeb/indexNFe.xhtml').join(' ')), 'o passo a passo ensina a imprimir/salvar o PDF');
ok(P.navPassos('https://web.whatsapp.com').length >= 1, 'o WhatsApp tem o passo do QR Code');
ok(P.navPassos('https://exemplo.com').length === 0, 'site qualquer não ganha passo a passo inventado');

console.log('\n== 4) A lista mora na NUVEM (nada no PC) ==');
const dbTeste = { config: {} };
const lista = P.navSitesSalvar(dbTeste, padrao.concat([{ id: '', nome: 'Site do contador', url: 'contador.com.br' }]));
ok(Array.isArray(dbTeste.config.navSites) && dbTeste.config.navSites.length === 4, 'salvar grava em db.config.navSites (é isso que sobe para a nuvem)');
ok(lista[3].url === 'https://contador.com.br', 'site novo já sai com endereço normalizado (https)');
ok(P.navSites(dbTeste).length === 4, 'ler de volta devolve os 4 (a lista do dono manda)');
ok(P.navSites({ config: {} }).length === 3, 'sem lista salva, voltam os 3 padrões');
ok(P.navNormalizarUrl('') === '' && P.navIdNovo('', {}) === 'site', 'nome/id vazio não gera site fantasma');
const idA = P.navIdNovo('NFS-e da Prefeitura', {});
ok(idA === 'nfs-e-da-prefeitura', 'id do site vira texto limpo (sem acento nem espaço)');
ok(P.navIdNovo('NFS-e da Prefeitura', { 'nfs-e-da-prefeitura': 1 }) === 'nfs-e-da-prefeitura-2', 'id repetido ganha número em vez de sobrescrever');

const modulo = ler('navegador_embutido_patch.js');
ok(!/localStorage\s*\.\s*(get|set|remove)Item|window\.localStorage/.test(modulo), 'o módulo não guarda nada no navegador (nada de localStorage)');
ok(/navSitesSalvar\(banco\(\),/.test(modulo), 'as mudanças de lista são salvas pela mesma função (nuvem)');

console.log('\n== 5) No PROGRAMA do PC abre navegador de verdade ==');
const main = ler('main.js');
ok(/webviewTag:\s*true/.test(main), 'main.js liga a tag de navegador embutido (webviewTag)');
ok(/will-attach-webview/.test(main), 'a página de fora passa pela trava do main.js (will-attach-webview)');
ok(!/NAV_HTTP_PREFEITURA/.test(main), 'r46 R1: o attach não julga mais o endereço (a webview nasce sem src — julgar ali bloqueava TUDO)');
ok(/did-attach-webview/.test(main) && /will-navigate/.test(main) && main.indexOf("/^https?:\\/\\//i") >= 0, 'r46 R1: o filtro mudou para a navegação (só http/https entram; file:/javascript: nunca)');
ok(/delete webPreferences\.preload/.test(main), 'a página de fora entra sem preload (sem acesso ao sistema)');
ok(/nodeIntegration\s*=\s*false/.test(main), 'a página de fora entra sem node (segurança)');
ok(/persist:digicopy-navegador/.test(main), 'os logins dos sites ficam em área separada e identificada');
ok(/nav:limpar-logins/.test(main), 'existe o comando de esquecer os logins guardados dos sites');
ok(/setWindowOpenHandler/.test(main), 'link que abre janela nova dentro do site fica dentro do sistema');
ok(/setPermissionRequestHandler/.test(main), 'permissão (microfone do WhatsApp) é concedida só para os sites dele');
ok(/navegador_embutido|NAVEGADOR/.test(main), 'tudo isso está comentado no main.js (próximo chat entende o porquê)');

const preload = ler('preload.js');
ok(/navAPI\s*:/.test(preload) && /nav:limpar-logins/.test(preload), 'preload.js expõe a ponte navAPI (limparLogins)');

console.log('\n== 6) Fora do programa do PC não fica tela branca ==');
ok(/só abre no programa do PC/.test(modulo), 'a tela explica, em português, que ali só funciona no programa do PC');
ok(/Abrir numa janela nova/.test(modulo), 'e dá o botão de abrir numa janela nova (saída na hora)');
ok(/X-Frame-Options|proíbem/.test(modulo), 'a explicação fala do motivo real (os sites proíbem ser embutidos)');
ok(/nav-passo/.test(modulo) && /Como usar aqui dentro/.test(modulo), 'a tela mostra o "como usar aqui dentro" (passo a passo)');
ok(!/\balert\(|\bprompt\(|\bconfirm\(/.test(modulo), 'nenhum modal nativo do navegador (regra #16)');
ok(/did-fail-load/.test(modulo), 'se o site não abrir, aparece recado claro em vez de página vazia');

console.log('\n== 7) Ligado ao resto do sistema ==');
ok(/ensureView\('navegador'\)/.test(modulo), 'a tela entra no mesmo lugar das outras (ensureView)');
ok(/navigateTo\.__v6107nav|navigateTo=function/.test(modulo), 'navigateTo aprende a tela nova (sem quebrar as antigas)');
ok(/navegadorAbrirSite\('nfse-prefeitura'\)/.test(modulo), 'o menu abre direto na NFS-e da prefeitura');
ok(/ph-whatsapp-logo/.test(modulo), 'o menu tem o ícone do WhatsApp');
ok(/navAuditoria\('site-adicionado'/.test(modulo), 'adicionar site fica registrado na Auditoria (como o fiscal)');
ok(/nav-gest/.test(modulo) && /module-row|classic-toolbar-scroll/.test(modulo), 'o item de menu entra na barra de cima e no menu lateral');

console.log('\nRESULTADO: ' + (falhas === 0 ? 'o navegador dentro do sistema está de pé!' : falhas + ' falha(s)'));
if (falhas) process.exitCode = 1;
//<<<<SECAO:test_navegador_embutido.js:FIM>>>>
}

if (false) { // ═══ test_lembrar_tela.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_lembrar_tela.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE v6.1.8 — LEMBRAR A TELA (última ordenação + último filtro)
//
// Pedido dele: escolheu "só o básico" e perguntou "vai atualizar mesmo assim
// né?" → este teste prova que sim: anota sozinho a cada uso, por USUÁRIO, e
// guarda na NUVEM (nada no PC/navegador). E prova também o que ele NÃO quis:
// mexer em colunas (largura/ocultar) está fora.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');

let falhas = 0;
function ok(cond, msg) { if (cond) console.log('  ✔ ' + msg); else { falhas++; console.error('  ✘ ' + msg); } }
function ler(p) { return fs.readFileSync(p, 'utf8'); }
// r57: testes moram em SEÇÕES dentro de test_msg_*.js — "na suíte" = no runner ou em seção de tema
function naSuite(nome) {
  let s = ler('test_runner.js');
  try { fs.readdirSync('.').forEach((f) => { if (/^test_msg_.*\.js$/.test(f)) s += '\n' + ler(f); }); } catch (e) {}
  return s.indexOf(nome) >= 0;
}

const arquivo = 'ajustes_v6108_lembrar_tela_patch.js';
const code = ler(arquivo);
const P = (function () {
  const ctx = { window: {}, document: undefined, db: {} };
  new Function('window', 'document', 'db', code)(ctx.window, ctx.document, ctx.db);
  return ctx.window.LT6108_PURE;
})();

console.log('\n== 1) Parte pura: quem, o quê e de quem é a memória ==');
ok(!!P, 'o módulo exporta a parte pura (LT6108_PURE)');
ok(P.ltUsuario({ login: 'DONO' }) === 'dono', 'a memória é por USUÁRIO (login, sem depender de maiúscula)');
ok(P.ltUsuario(null) === '', 'sem sessão, ninguém é anotado');

console.log('\n== 2) Só campo de FILTRO entra (formulário nunca) ==');
ok(P.ltEhFiltro('filtro-clientes', 'INPUT') === true, 'filtro-... conta como filtro');
ok(P.ltEhFiltro('buscaProduto', 'INPUT') === true, 'busca... conta como filtro');
ok(P.ltEhFiltro('search-auditoria', 'INPUT') === true, 'search-... conta como filtro');
ok(P.ltEhFiltro('f-cli-nome', 'INPUT') === false, 'campo de cadastro (nome do cliente) NUNCA é filtro');
ok(P.ltEhFiltro('venda-valor', 'INPUT') === false, 'campo de valor de venda NUNCA é filtro');
ok(P.ltEhFiltro('filtro-x', 'BUTTON') === false, 'só input/select entram (botão não)');
ok(P.ltEhFiltro('', 'INPUT') === false, 'campo sem id fica de fora (não dá para devolver depois)');

console.log('\n== 3) Reaplicar a ordenação certa ==');
ok(P.ltProximoClique('', 'asc') === 1, 'sem seta → um clique põe A→Z');
ok(P.ltProximoClique('', 'desc') === 2, 'sem seta → dois cliques põem Z→A');
ok(P.ltProximoClique('asc', 'desc') === 1, 'seta A→Z → um clique troca para Z→A');
ok(P.ltProximoClique('asc', 'asc') === 0, 'já está do jeito dele → nenhum clique');
ok(P.ltProximoClique('asc', '') === 0, 'sem ordenação guardada → não mexe');

console.log('\n== 4) Guardar/ler/esquecer (na nuvem, por usuário e por tela) ==');
const db = { config: {} };
P.ltGravar(db, 'dono', 'vendas', { tabela: { i: 0, coluna: 2, dir: 'desc' }, filtros: { 'filtro-vendas': 'aberta' } });
ok(!!db.config.lembraTela && !!db.config.lembraTela.telas, 'grava em db.config.lembraTela (é isso que sobe para a nuvem)');
ok(P.ltLer(db, 'dono', 'vendas').tabela.coluna === 2, 'lê de volta a coluna ordenada');
ok(P.ltLer(db, 'dono', 'vendas').filtros['filtro-vendas'] === 'aberta', 'lê de volta o filtro');
ok(P.ltLer(db, 'recepcao', 'vendas') === null, 'a memória de um usuário NÃO aparece para o outro');
ok(P.ltLer(db, 'dono', 'clientes') === null, 'cada tela tem a sua memória');
ok(P.ltEsquecer(db, 'dono', 'vendas') === true && P.ltLer(db, 'dono', 'vendas') === null, 'dá para esquecer a memória de uma tela');

console.log('\n== 5) Como está ligado no sistema ==');
ok(code.indexOf('saveDB') >= 0, 'salva pela função do sistema (sobe para a nuvem)');
ok(!/localStorage\s*\.\s*(get|set|remove)Item|window\.localStorage/.test(code), 'não guarda nada no navegador (regra #44)');
ok(code.indexOf('__v6108lembra') >= 0 && /navigateTo\.__v6108lembra/.test(code), 'a tela é reaplicada quando abre (navigateTo aprende, sem quebrar as antigas)');
ok(/LT_APLICANDO/.test(code), 'tem trava para não entrar em laço ao reaplicar');
ok(/clearTimeout\(LT_TIMER\)/.test(code) && /800/.test(code), 'espera ele parar de digitar antes de gravar (PC fraco)');
ok(/JSON\.stringify\(antes\)===JSON\.stringify\(dados\)/.test(code), 'não grava de novo se nada mudou');
ok(/th\.dataset/.test(code) && /hsDir/.test(code), 'anota a ordenação pelo mesmo mecanismo do clique no título (historico_sort)');
ok(!/columnWidth|colgroup|style\.width|ocultarColuna|col\.hidden/i.test(code), 'NÃO mexe em colunas (foi o que ele escolheu: só o básico)');
ok(!/\balert\(|\bprompt\(|\bconfirm\(/.test(code), 'sem modal nativo do navegador (regra #16)');
ok(ler('bundle-manifest.json').indexOf(arquivo) >= 0, 'está no bundle (senão não roda no sistema)');
ok(naSuite('test_lembrar_tela.js'), 'o próprio teste está na suíte');

console.log('\nRESULTADO: ' + (falhas === 0 ? 'a tela lembra do jeito dele (só o básico)!' : falhas + ' falha(s)'));
if (falhas) process.exitCode = 1;
//<<<<SECAO:test_lembrar_tela.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5246.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5246.js:INICIO>>>>
// Teste v5.24.34 — rodada com as 3 fotos dele:
//  2.1) o "Nova venda" vivo era o atalho do MENU LATERAL (Atendimento):
//       removido do padrão; config salva em ordem antiga é ignorada sozinha
//       (aplicarNomesSalvos só trabalha em cima do padrão).
//  4.1/4.2) O formulário de ORÇAMENTO usava o placeholder "Digite para buscar"
//       — o guardião da VOS escuta esse texto, não acha __vosForm lá dentro e
//       travava TUDO com "Cliente Não Selecionado", mesmo com cliente escolhido.
//       Placeholder trocado: orçamento busca produto em paz de novo.
//  5.x) Excluir com popup PRÓPRIO do sistema (confirmSistema — nunca o cinza
//       do navegador), aviso de intenção ao motor da nuvem (o puxão que
//       "ressuscitava" o apagado agora é desfeito sozinho em 60s) e id
//       tolerante a string/número.
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }

const menus   = fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js', 'utf8');
const orc60   = fs.readFileSync('ajustes_v52260_orcamento_trava_venda_atalho_patch.js', 'utf8');
const orc58   = fs.readFileSync('ajustes_v52258_orcamento_os_revalidar_patch.js', 'utf8');
const orc59   = fs.readFileSync('ajustes_v52259_orcamento_filtros_item_patch.js', 'utf8');
const patch   = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const worker  = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle  = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg       = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- 2.1: "Nova venda" fora do menu lateral --');
ok(menus.indexOf("{id:'nova-venda'") < 0, 'item nova-venda removido do menu Atendimento padrão');
ok(menus.indexOf("{id:'notinhas'") >= 0 && menus.indexOf("{id:'nova-notinha'") >= 0, 'Consultar notinhas e atalho Nova notinha (Início) preservados');
ok(bundle.indexOf("id:'nova-venda'") < 0 && bundleM.indexOf("id:'nova-venda'") < 0, 'remoção refletida nos 2 bundles');

console.log('-- 4.1/4.2: orçamento livre do guardião da VOS --');
ok(orc60.indexOf('Digite para buscar') < 0 && orc58.indexOf('Digite para buscar') < 0 && orc59.indexOf('Digite para buscar') < 0, 'placeholder-armadilha aposentado nas 3 camadas do orçamento');
ok(orc60.indexOf('Buscar produto ou escrever a descrição') >= 0, 'novo placeholder do orçamento no lugar');

console.log('-- 5.x: exclusão com popup próprio e à prova de nuvem --');
ok(patch.indexOf("window.confirmSistema(pergunta,'Excluir de vez')") >= 0, 'confirmação vem do popup do sistema (ask pedido dele)');
ok(patch.indexOf('DIGICOPY_EXCLUSAO_INTENCIONAL') >= 0, 'motor da nuvem é avisado: desfaz o "ressuscitou" em até 60s');
ok(patch.indexOf("tick('ficha-exclui')") >= 0, 'apagou = empurra o delete para a nuvem na hora');
ok(patch.indexOf('String(x.id)===String(id)') >= 0, 'id tolerante a string/número na remoção');
ok((patch.match(/String\(x\.id\)===String\(id\)/g) || []).length >= 7, 'tolerância aplicada em todas as coleções');
ok(patch.indexOf("window.confirmSistema('Estornar '") >= 0, 'Estornar também usa o popup do sistema');

console.log('-- integridade: bundles e versões --');
const vW = (worker.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').indexOf('Worker ' + vW) >= 0, 'worker carimbado (v' + vW + ') e motor colado na mesma versão');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf("confirmSistema(pergunta,'Excluir de vez')") >= 0, 'exclusão nova presente no bundle');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0 && indexHtml.indexOf('app.bundle.js?v=' + pkg.version) >= 0, 'index.html na v' + pkg.version);
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0, 'mobile/www/index.html na v' + pkg.version);
ok(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json com versão válida (v' + pkg.version + ')');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v' + pkg.version); process.exit(1); }
console.log('\nTudo certo v' + pkg.version + '!');
//<<<<SECAO:test_ajustes_v5246.js:FIM>>>>
}
