// Teste unitário dos helpers puros do performance_patch.js (seção PERF_PURE)
// Uso: node test_perf.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/performance_patch.js', 'utf8');
const m = src.match(/\/\* PERF_PURE_START \*\/([\s\S]*?)\/\* PERF_PURE_END \*\//);
if(!m){ console.error('FALHOU: seção PERF_PURE não encontrada'); process.exit(1); }
eval(m[1]);

let pass = 0, fail = 0;
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

(async function main(){
  console.log('== perfHashStr ==');
  ok('determinístico', perfHashStr('abc') === perfHashStr('abc'));
  ok('diferente para conteúdo diferente', perfHashStr('abc') !== perfHashStr('abd'));
  ok('string grande (1,5MB) rápida e estável', (()=>{ const s='x'.repeat(1500000); return perfHashStr(s)===perfHashStr(s); })());

  console.log('== perfDiffPartes — só envia o que mudou ==');
  {
    const novas = [
      {key:'pfx__vendas__p0', dataStr:'{"lista":[1]}'},
      {key:'pfx__vendas__p1', dataStr:'{"lista":[2]}'},
      {key:'pfx__clientes__p0', dataStr:'{"lista":[3]}'}
    ];
    // primeiro envio (sem cache): tudo sobe
    const d1 = perfDiffPartes(novas, null);
    ok('primeiro envio sobe tudo', d1.mudadas.length===3 && d1.removidas.length===0);
    // sem mudança: nada sobe
    const d2 = perfDiffPartes(novas, d1.atual);
    ok('sem mudança → nada sobe', d2.mudadas.length===0 && d2.removidas.length===0);
    // mudou 1 parte: só ela sobe
    const novas2 = [
      {key:'pfx__vendas__p0', dataStr:'{"lista":[1,"NOVA VENDA"]}'},
      {key:'pfx__vendas__p1', dataStr:'{"lista":[2]}'},
      {key:'pfx__clientes__p0', dataStr:'{"lista":[3]}'}
    ];
    const d3 = perfDiffPartes(novas2, d2.atual);
    ok('só a parte alterada sobe', d3.mudadas.length===1 && d3.mudadas[0]==='pfx__vendas__p0');
    // diminuiu partes: órfãs vão para remoção
    const d4 = perfDiffPartes([novas2[0], novas2[2]], d3.atual);
    ok('parte removida detectada', d4.removidas.length===1 && d4.removidas[0]==='pfx__vendas__p1');
  }

  console.log('== perfEmLotes ==');
  {
    const vistos = [];
    const erros = await perfEmLotes([1,2,3,4,5], 2, async x=>{ vistos.push(x); if(x===4) throw new Error('falhou4'); });
    ok('processou todos', vistos.length===5);
    ok('coletou o erro sem abortar', erros.length===1 && String(erros[0]).includes('falhou4'));
    const erros2 = await perfEmLotes([], 3, async()=>{});
    ok('lista vazia → sem erros', erros2.length===0);
  }

  console.log(`\nRESULTADO: ${pass} passaram, ${fail} falharam`);
  process.exit(fail ? 1 : 0);
})();
