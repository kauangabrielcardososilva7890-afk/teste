const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const menus=fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js','utf8');
const rec=fs.readFileSync('ajustes_v52214_recargas_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.77 ==');
ok('versão subiu para 5.22.77',pkg.version==='5.22.77');

// ── 1. nome de demonstração: limpeza de uma vez, NÃO regra ──
ok('a nuvem não recusa mais nome nenhum',!/ehLixoDeDemonstracao\(change\.entity/.test(code));
ok('a faxina roda uma vez só e nunca mais',/if\(state\.faxina===FAXINA\)return 0;/.test(code)&&/state\.faxina=FAXINA;/.test(code));
const sujo={tecnicos:[{id:'t3',nome:'Rafael Lima'},{id:'x9',nome:'Técnico de verdade'}]};
const w={DIGICOPY_CLOUD:{token:()=>''},ehTecnicoDemo:t=>['t1','t2','t3'].indexOf(t&&t.id)>=0,saveDB:()=>{}};
new Function('window','localStorage','document','db',code)(w,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,sujo);
const S=w.DIGICOPY_CLOUD_SYNC;
ok('a limpeza tira os nomes velhos',S.varrerDemonstracao()===1&&sujo.tecnicos.length===1);
sujo.tecnicos.push({id:'t3',nome:'Rafael Lima'});
ok('depois de limpa, ninguém mais é barrado',S.varrerDemonstracao()===0&&sujo.tecnicos.length===2);

// ── 2. submenu Chamados dentro de Contratos: não existe ──
ok('Chamados saiu do menu de contratos',!/label:'Contratos de locação'\}[\s\S]{0,300}label:'Chamados'/.test(app));
ok('o resto do menu de contratos continua',/label:'Contratos de locação'/.test(app)&&/label:'Máquinas nos clientes'/.test(app)&&/label:'Leituras'/.test(app));
ok('a tela de chamados continua existindo',/function openQuickOS/.test(app));

// ── 3. submenu Recargas dentro de Cadastros: não existe ──
const cad=menus.slice(menus.indexOf("id:'cadastros'"),menus.indexOf("id:'financeiro'"));
ok('Recargas saiu de Cadastros',!/id:'recargas'/.test(cad));
ok('Cadastros continua com Clientes e Novo cliente',/label:'Clientes'/.test(cad)&&/label:'Novo cliente'/.test(cad));
ok('ninguém injeta mais o atalho de recargas',!/id:'recargas'/.test(rec));
ok('a tela de recargas continua existindo',/abrirAbaRecargas/.test(rec));
console.log('\nRESULTADO: ajustes v5.22.77 passaram!');
