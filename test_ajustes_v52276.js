const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const idb=fs.readFileSync('indexeddb_persistence_patch.js','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.76 ==');
ok('versão subiu para 5.22.76',pkg.version==='5.22.76');

// ── 1. nenhum PC apaga dado sozinho ──
ok('o espelho que apagava dado do PC foi removido',!/espelharNuvem|planejarEspelho/.test(code));
ok('o conserto que ressuscitava dado foi removido',!/repararApagao|agruparApagao/.test(code));

// ── 2. devolver o que o espelho levou ──
const cópia={usuarios:[{id:'u1',nome:'Kauan'},{id:'u2',nome:'Maria'}],
             recargas:[{id:'r1',nome:'Toner 105A'}],
             tecnicos:[{id:'t3',nome:'Rafael Lima',especialidade:'Grande formato'}],
             logs:[{id:'l1'}]};
const db={usuarios:[{id:'u1',nome:'Kauan'}],recargas:[],tecnicos:[],logs:[]};
const window={DIGICOPY_CLOUD:{token:()=>''},
  ehTecnicoDemo:t=>['t1','t2','t3'].indexOf(t&&t.id)>=0,
  DIGICOPY_INDEXED_DB:{readRecoverySnapshot:async n=>n==='antes_espelhar_nuvem'?cópia:null},
  saveDB:()=>{}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,db);
const S=window.DIGICOPY_CLOUD_SYNC;

S.devolverSumidos().then(n=>{
  ok('devolve o usuário de login que sumiu',db.usuarios.length===2&&db.usuarios.some(u=>u.id==='u2'));
  ok('devolve o produto de recarga que sumiu',db.recargas.length===1&&db.recargas[0].id==='r1');
  ok('NÃO devolve nome de demonstração',db.tecnicos.length===0);
  ok('NÃO devolve auditoria',db.logs.length===0);
  ok('conta certo quantos voltaram',n===2);
  return S.devolverSumidos();
}).then(n2=>{
  ok('roda uma vez só por computador',n2===0&&db.usuarios.length===2);

  // ── 3. nomes de teste nunca mais ──
  ok('o sistema sabe quem é nome de demonstração',/ehTecnicoDemo/.test(app)&&/Rafael Lima/.test(app)&&/TECNICOS_DEMO/.test(app));
  ok('nome de demonstração é varrido do PC e da nuvem',/function varrerDemonstracao/.test(code)&&/naFila\.add\(k\);/.test(code));
  ok('se a nuvem mandar de volta, o PC recusa',/if\(change\.operation!=='delete'&&ehLixoDeDemonstracao\(change\.entity,change\.data\)\)/.test(code));
  const sujo={tecnicos:[{id:'t3',nome:'Rafael Lima'},{id:'x9',nome:'Técnico de verdade'}]};
  const w2={DIGICOPY_CLOUD:{token:()=>''},ehTecnicoDemo:t=>['t1','t2','t3'].indexOf(t&&t.id)>=0,saveDB:()=>{}};
  new Function('window','localStorage','document','db',code)(w2,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,sujo);
  const varridos=w2.DIGICOPY_CLOUD_SYNC.varrerDemonstracao();
  ok('Rafael Lima sai da lista',varridos===1&&sujo.tecnicos.length===1&&sujo.tecnicos[0].id==='x9');
  ok('técnico de verdade fica',sujo.tecnicos[0].nome==='Técnico de verdade');

  // ── 4. a tela da nuvem não quebra mais ──
  ok('a cópia de recuperação pode ser lida de volta',/readRecoverySnapshot/.test(idb)&&/DIGICOPY_INDEXED_DB=\{writeNow,writeRecoverySnapshot,readRecoverySnapshot/.test(idb));
  ok('cada conta da tela da nuvem vai sozinha',/async function conta\(sql\)/.test(worker)&&/DIGICOPY_STATUS_PARCIAL/.test(worker));
  ok('conta que falha vem zerada em vez de derrubar a tela',/return 0;\n    \}\n  \}/.test(worker));
  ok('o erro da API agora diz o motivo',/detail: motivo/.test(worker)&&/' Motivo: ' \+ motivo/.test(worker));
  ok('banco ganhou índice para contar rápido',fs.existsSync('cloudflare-worker/migrations/0003_indices_contagem.sql'));

  console.log('\nRESULTADO: ajustes v5.22.76 passaram!');
}).catch(e=>{console.error(e);process.exit(1);});
