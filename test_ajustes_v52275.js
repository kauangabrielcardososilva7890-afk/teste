const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const chamadas=[];
const window={DIGICOPY_CLOUD:{token:()=>''},
  deleteVenda:function(id){chamadas.push('deleteVenda:'+id);return 'feito';},
  confirmSistema:function(){return Promise.resolve(true);},
  confirm:function(){return false;}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.75 ==');
ok('versão continua na família 5.22',/^5\.22\.\d+/.test(pkg.version));

// ── nada de adivinhação ──
ok('acabou o teto de exclusões',!/MAX_EXCLUSOES/.test(code));
ok('acabou a regra dos 30%',!/missing\.length\/conhecidos>0\.30/.test(code));
ok('sumiço sem ordem não apaga nada na nuvem',/if\(!houveIntencaoDeExcluir\(\)\)\{[\s\S]{0,400}delete state\.known\[k\]/.test(code));
ok('exclusão de propósito não tem limite de quantidade',!/missing\.length>/.test(code));

// ── o sinal de intenção ──
ok('parte fria: ninguém mandou apagar',S.houveIntencaoDeExcluir()===false);
window.deleteVenda('v1');
ok('função de excluir do sistema abre a janela',S.houveIntencaoDeExcluir()===true&&chamadas[0]==='deleteVenda:v1');

const codigo2=code;
const w2={DIGICOPY_CLOUD:{token:()=>''},confirmSistema:function(){return Promise.resolve(true);}};
new Function('window','localStorage','document','db',codigo2)(w2,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
const S2=w2.DIGICOPY_CLOUD_SYNC;
ok('sem confirmar, continua frio',S2.houveIntencaoDeExcluir()===false);
return_test();
function return_test(){
  w2.confirmSistema('apagar?').then(()=>{
    ok('confirmar SIM abre a janela',S2.houveIntencaoDeExcluir()===true);
    const w3={DIGICOPY_CLOUD:{token:()=>''},confirmSistema:function(){return Promise.resolve(false);}};
    new Function('window','localStorage','document','db',code)(w3,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
    w3.confirmSistema('apagar?').then(()=>{
      ok('confirmar NÃO mantém tudo travado',w3.DIGICOPY_CLOUD_SYNC.houveIntencaoDeExcluir()===false);
      // v5.22.76: o conserto que devolvia dado da nuvem saiu (trazia nome de
      // demonstração de volta). Fica só a devolução da cópia local, uma vez só.
      ok('a devolução do que sumiu roda uma vez e nunca mais',/if\(state\.devolucao===DEVOLUCAO\)return 0;/.test(code));
      ok('o vigia é religado depois que os módulos carregam',/setTimeout\(vigiarExclusoes,4000\)/.test(code)&&/setTimeout\(vigiarExclusoes,15000\)/.test(code));
      ok('confere duas vezes antes de apagar (base abrindo)',/const CONFIRMA_SUMICO=3000/.test(code)&&/if\(!state\.sumindo\[k\]\)\{ state\.sumindo\[k\]=agora; continue; \}/.test(code));
      ok('registro que reaparece cancela a exclusão',/if\(state\.sumindo\[k\]\)delete state\.sumindo\[k\];/.test(code));
      ok('a conferência não é limite de quantidade',/pode ser\n    \/\/ 1 ou 5\.000/.test(code));
      console.log('\nRESULTADO: ajustes v5.22.75 passaram!');
    });
  });
}
