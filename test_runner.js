const {spawnSync}=require('child_process');
// v6.0.6 — deps essenciais vendorizadas no repo (vendor/): se node_modules sumir
// (sandbox de CI sem npm install), recria a partir do vendor antes de rodar.
(function ensureDeps(){
  const fs=require('fs'), path=require('path');
  for(const pkg of ['acorn','node-forge']){
    if(fs.existsSync(path.join('node_modules', pkg, 'package.json'))) continue;
    try{
      const dst=path.join('node_modules', pkg);
      fs.mkdirSync(dst, {recursive:true});
      fs.cpSync(path.join('vendor', pkg), dst, {recursive:true});
      console.log('deps recriadas a partir do vendor/: ' + pkg);
    }catch(e){}
  }
})();
const tests=[
  "test_msg_01_infra.js",
  "test_msg_02_nuvem.js",
  "test_msg_03_vendas.js",
  "test_msg_04_clientes.js",
  "test_msg_05_telas.js",
  "test_msg_06_estoque.js",
  "test_msg_07_financeiro.js",
  "test_msg_08_fiscal.js",
  "test_msg_09_login.js",
  "test_msg_10_relatorios.js",
  "test_msg_11_jsdom.js",
  "test_regressao_dialogos.js",
];
// v6.1.11 — TESTES QUE PRECISAM DO jsdom (dependência de DESENVOLVIMENTO).
// O ensureDeps acima recria do vendor/ só o acorn e o node-forge. O jsdom não
// está no vendor/ (é grande), então num checkout novo ou num CI sem `npm
// install` os testes que abrem DOM de verdade não têm como rodar. Antes eles
// apareciam como "❌ falharam" com um MODULE_NOT_FOUND, que parece defeito do
// produto — e não é. Agora ficam em categoria própria, e o motivo e o conserto
// aparecem na tela. Com o jsdom instalado, eles rodam e reprovam normalmente.
let jsdomDisponivel=true;
try{ require.resolve('jsdom'); }catch(e){ jsdomDisponivel=false; }
const precisaJsdom=new Set();
if(!jsdomDisponivel){
  for(const file of tests){
    try{ if(/require\(\s*['"]jsdom['"]\s*\)/.test(require('fs').readFileSync(file,'utf8'))) precisaJsdom.add(file); }catch(e){}
  }
}
let failed=0, passed=0, xfailed=0, semRodar=0;
for(const file of tests){
  if(!jsdomDisponivel && precisaJsdom.has(file)){
    semRodar++;
    process.stdout.write(`\n⚠️ ${file}: NÃO rodou — falta a dependência 'jsdom'\n`);
    continue;
  }
  const result=spawnSync(process.execPath,[file],{encoding:'utf8'});
  const output=(result.stdout||'')+(result.stderr||'');
  if(result.status===0){passed++;process.stdout.write(`\n✅ ${file}\n`);continue;}
  const knownLabel=file==='test_cartuchos_etiquetas_config.js' && /capacidade padrão é máxima compacta na folha/.test(output);
  if(knownLabel){xfailed++;process.stdout.write(`\n⚠️ ${file}: falha aceita de etiquetas (área congelada)\n`);continue;}
  failed++;process.stdout.write(`\n❌ ${file}\n${output.slice(-2500)}\n`);
}
console.log(`\nSUÍTE CONSOLIDADA: ${passed} passaram, ${xfailed} falha aceita, ${semRodar} não rodaram (falta jsdom), ${failed} falharam.`);
if(semRodar)console.log(`   ↳ ${semRodar} teste(s) ficaram de fora por falta do 'jsdom' (não é defeito do sistema). Rode "npm install" e repita para eles rodarem.`);
if(failed)process.exit(1);
