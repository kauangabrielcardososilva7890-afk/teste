const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

// banco de mentira com listas que ANTES não sincronizavam
const db={
  clientes:[{id:'c1',nome:'Fulano'}],
  despesasLocacao:[{id:'d1',valor:10}],
  cartuchosMigrados:[{id:'ct1'}],
  semId:[{nome:'linha sem id'}],
  _seq:{venda:41,os:7},
  meta:{appVersion:'x'},
  modulosDinamicos:{a:1}
};
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,db);
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.69 ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));

const mapa=S.definicoes();
ok('lista nova entra sozinha na sincronização',mapa.despesasLocacao==='array'&&mapa.cartuchosMigrados==='array');
ok('lista antiga continua igual',mapa.clientes==='array'&&mapa.config==='root'&&mapa.modulosDinamicos==='map');
ok('controle interno do arquivo não viaja',mapa.meta===undefined);
ok('contador de numeração tem tratamento próprio',mapa._seq==='contador');
ok('numeração fica com o maior número dos dois PCs',/const nuvem=Number\(change\.data\[nome\]\)\|\|0,aqui=Number\(alvo\[nome\]\)\|\|0;/.test(code)&&/if\(nuvem>aqui\)/.test(code));
ok('item sem id ganha id fixo pelo conteúdo (não duplica)',/id:x\.id\?String\(x\.id\):\('h_'\+hash\(clean\(x\)\)\)/.test(code));
ok('mesmo item sem id dá sempre o mesmo id',S.hash(S.clean({nome:'linha sem id'}))===S.hash(S.clean({nome:'linha sem id'})));
ok('PC convidado não apaga mais os dados dele',/activation==='invite'&&extraCount===0/.test(code));
ok('regra nova pergunta uma vez só',/const REGRAS='v5\.22\.69-tudo'/.test(code)&&/state\.regras!==REGRAS/.test(code));
ok('escolha se apresenta sozinha, não fica escondida',/function cobrarEscolha/.test(painel)&&/escolha-inicial/.test(painel));
ok('escolha não abre por cima de outra janela da nuvem',/digicopy-cloud-modal/.test(painel));
console.log('\nRESULTADO: ajustes v5.22.69 passaram!');
