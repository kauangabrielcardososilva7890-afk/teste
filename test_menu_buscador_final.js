const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
console.log('== MENU_BUSCADOR_FINAL ==');
ok('app.js tem Buscador Escola no menu lateral administrativo', app.includes("id:'buscador-escola'") && app.includes("label:'Buscador Escola'"));
ok('navigateTo cria/renderiza tela do Buscador Escola', app.includes("view==='buscador-escola'") && app.includes('renderBuscadorEscola'));
ok('index tem Buscador Escola fixo no menu superior', html.includes('topmod-buscador-escola-fixo') && html.includes("navigateTo('buscador-escola')"));
console.log('\nRESULTADO: Testes de menu Buscador Escola passaram!');
