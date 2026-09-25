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
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));

const mapa=S.definicoes();
ok('lista nova entra sozinha na sincronização',mapa.despesasLocacao==='array'&&mapa.cartuchosMigrados==='array');
ok('lista antiga continua igual',mapa.clientes==='array'&&mapa.config==='root'&&mapa.modulosDinamicos==='map');
ok('controle interno do arquivo não viaja',mapa.meta===undefined);
ok('contador de numeração tem tratamento próprio',mapa._seq==='contador');
ok('numeração fica com o maior número dos dois PCs',/const nuvem=Number\(change\.data\[nome\]\)\|\|0,aqui=Number\(alvo\[nome\]\)\|\|0;/.test(code)&&/if\(nuvem>aqui\)/.test(code));
ok('só sobe registro com id de verdade (v5.22.71)',/\.filter\(x=>x&&x\.id\)/.test(code));
ok('a marca do registro é sempre a mesma',S.hash(S.clean({nome:'x'}))===S.hash(S.clean({nome:'x'})));
ok('PC convidado nunca perde dado (v6.1.4: nada é isolado, tudo sincroniza)',/isolate:false/.test(code)&&!/isolate:true/.test(code));
// v6.1.4 (22/09/2026): a pergunta única acabou por ordem do dono — quem conecta
// já sincroniza. A marca de regras continua existindo para carimbar a versão.
ok('regra nova não pergunta mais nada (v6.1.7 conectou = sincroniza)',/const REGRAS='v6\.1\.7-conectou-sincroniza'/.test(code)&&/state\.regras/.test(code)&&/reason:'sincroniza-direto'/.test(code)&&!/pause:true/.test(code));
ok('nada abre sozinho cobrando escolha (v6.1.4: sincroniza direto)',/function cobrarEscolha/.test(painel)&&/não faz nada/.test(painel));
ok('escolha não abre por cima de outra janela da nuvem',/digicopy-cloud-modal/.test(painel));
console.log('\nRESULTADO: ajustes v5.22.69 passaram!');
