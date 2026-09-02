const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,
  {clientes:[],logs:[{id:'l1'}],notificacoes:[{id:'n1'}],despesasLocacao:[{id:'d1'}]});
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.71 ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));
const mapa=S.definicoes();
ok('auditoria não viaja mais',mapa.logs===undefined);
ok('avisos não viajam mais',mapa.notificacoes===undefined);
ok('as listas de trabalho continuam viajando',mapa.clientes==='array'&&mapa.despesasLocacao==='array');
ok('só lista com botão de excluir manda exclusão',S.podeExcluir('clientes')===true&&S.podeExcluir('vendas')===true);
ok('lista que o módulo remonta nunca manda exclusão',S.podeExcluir('despesasLocacao')===false&&S.podeExcluir('escolaOrc')===false);
ok('trava contra apagão em massa',/const MAX_EXCLUSOES=20/.test(code)&&/missing\.length\/conhecidos>0\.30/.test(code));
ok('sumiço em massa avisa em vez de apagar',/Por segurança a nuvem não apagou nada/.test(code));
ok('item sem id não sobe (era cache, virava lixo)',/\.filter\(x=>x&&x\.id\)\.map\(x=>\(\{id:String\(x\.id\)/.test(code)&&!/h_'\+hash\(clean\(x\)\)/.test(code));
ok('limpa da nuvem o que não viaja mais',/function marcarLimpeza/.test(code)&&/state\.limpar/.test(code));
ok('limpeza vai aos poucos, sem rajada',/state\.limpar\.slice\(0,40\)/.test(code));
ok('painel mostra de onde vem cada número',/ver lista por lista/.test(painel)&&/porLista/.test(painel));
console.log('\nRESULTADO: ajustes v5.22.71 passaram!');
