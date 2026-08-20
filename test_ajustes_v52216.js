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
ok('só Admin vê oculto', S.ehCargoAdmin('Admin','x')===true && S.ehCargoAdmin('Dono','denivaldo')===false && S.ehCargoAdmin('Funcionário','ana')===false);
ok('login kauan conta como Admin', S.ehCargoAdmin('Funcionário','kauan')===true);
ok('Sair não some', !!S.BLOQUEIO_OCULTAR.sair);

const pad=M.menusPadrao();
const salvo={
  ordem:['cadastros','inicio','atendimento','locacao','nfe','financeiro','buscador','config','backup','nuvem','sair'],
  nomes:{cadastros:'Cadastros'},
  sub:{atendimento:{'nova-venda':'Venda nova'}},
  subOrdem:{atendimento:['abrir-chamado','notinhas','nova-venda']},
  ocultos:{nfe:true},
  ocultosSub:{cadastros:{recargas:true}}
};
const layout=S.aplicarLayout(pad, salvo);
ok('cadastros no começo', layout[0].id==='cadastros');
const at=layout.find(x=>x.id==='atendimento');
ok('submenu reordenado', at.items[0].id==='abrir-chamado' && at.items[2].id==='nova-venda');
ok('nome do submenu', at.items[2].label==='Venda nova');
ok('NF-e marcada oculta', layout.find(x=>x.id==='nfe').oculto===true);
ok('recargas marcada oculta', layout.find(x=>x.id==='cadastros').items.find(i=>i.id==='recargas').oculto===true);

const func=S.menusParaUsuario(layout, false);
ok('funcionário não vê NF-e', !func.some(x=>x.id==='nfe'));
ok('funcionário não vê recargas', !func.find(x=>x.id==='cadastros').items.some(i=>i.id==='recargas'));
ok('funcionário vê Sair', func.some(x=>x.id==='sair'));
const adm=S.menusParaUsuario(layout, true);
ok('admin ainda vê NF-e', adm.some(x=>x.id==='nfe'));

const cat=S.catalogoDeSubmenus(pad);
ok('catálogo tem submenu Nova venda', cat.some(a=>a.id==='nova-venda'));
ok('catálogo tem Recargas', cat.some(a=>a.id==='recargas'));
ok('catálogo não é só o menu Atendimento', !cat.some(a=>a.id==='atendimento') && cat.some(a=>a.menuId==='atendimento'));

ok('atalho some se menu oculto', S.atalhoOcultoPara({id:'nota-fiscal',menuId:'nfe'}, salvo, false)===true);
ok('admin vê atalho oculto', S.atalhoOcultoPara({id:'nota-fiscal',menuId:'nfe'}, salvo, true)===false);

const moved=S.moverNoPai(['a','b','c'],2,0);
ok('mover submenu na lista', moved[0]==='c' && moved[1]==='a');

ok('seta de submenu no patch', /uiSubMenuMover/.test(sub));
ok('atalhos na faixa azul', /ui-atalhos-azul/.test(sub) && /ui-atalhos-inicio/.test(sub));
ok('some a faixa branca', /branco\.remove/.test(sub) || /ui-atalhos-inicio[\s\S]{0,80}remove/.test(sub));
ok('editor só Admin', /Só o Admin altera os menus/.test(sub));
ok('hooks no 5.22.13', /window\.pintarMenus/.test(men) && /window\.pintarAtalhos/.test(men));
ok('uiMenuMover usa o botão', /closest\('\[data-mid\]'\)/.test(sub));

ok('patch no bundle', manifest.includes('ajustes_v52216_menus_submenus_patch.js'));
ok('versão 5.22.x', /^5\.22\./.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile/.test(sub));

console.log('\nRESULTADO: v5.22.16 passou!');
