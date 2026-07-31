// Testes unitários do UI_PURE (interface_patch.js) — v4.9.0
// Uso: node test_interface.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/interface_patch.js', 'utf8');
const m = src.match(/\/\* UI_PURE_START \*\/([\s\S]*?)\/\* UI_PURE_END \*\//);
if(!m){ console.error('FALHOU: seção UI_PURE não encontrada'); process.exit(1); }
const UI_PURE = eval(m[1] + '\n; UI_PURE;');

let pass = 0, fail = 0;
function eq(nome, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok){ pass++; console.log('  ✔', nome); }
  else { fail++; console.error('  ✘', nome, '\n     obtido:', JSON.stringify(got), '\n     esperado:', JSON.stringify(want)); }
}
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

console.log('== ordenaPor — texto e número ==');
{
  const cls = [
    {codigo:20, nome:'Zuleica'}, {codigo:3, nome:'Álvaro'},
    {codigo:10, nome:'maria'}, {codigo:'', nome:'Carlos'}
  ];
  eq('por nome asc (acento/minúscula respeitados)', UI_PURE.ordenaPor(cls, c=>c.nome, 'asc').map(c=>c.nome), ['Álvaro','Carlos','maria','Zuleica']);
  eq('por nome desc', UI_PURE.ordenaPor(cls, c=>c.nome, 'desc').map(c=>c.nome), ['Zuleica','maria','Carlos','Álvaro']);
  eq('por código asc numérico (não "10 < 2")', UI_PURE.ordenaPor(cls, c=>c.codigo, 'asc').map(c=>String(c.codigo))[0], '3');
  eq('por código desc o 20 vem primeiro', UI_PURE.ordenaPor(cls, c=>c.codigo, 'desc').map(c=>String(c.codigo))[0], '20');
  eq('vazio vai pro fim no asc', UI_PURE.ordenaPor(cls, c=>c.codigo, 'asc').map(c=>String(c.codigo)).pop(), '');
  const original = cls.map(c=>c.nome).join();
  UI_PURE.ordenaPor(cls, c=>c.nome, 'desc');
  eq('não altera a lista original', cls.map(c=>c.nome).join(), original);
}

console.log('== ehAvisoDeNuvem — silenciador de avisos repetitivos ==');
{
  ok('"Dados enviados e verificados na nuvem" cala', UI_PURE.ehAvisoDeNuvem('Dados enviados e verificados na nuvem ✅'));
  ok('"Nenhum dado encontrado na nuvem" cala', UI_PURE.ehAvisoDeNuvem('Nenhum dado encontrado na nuvem'));
  ok('"Base recuperada da nuvem" cala', UI_PURE.ehAvisoDeNuvem('Base recuperada da nuvem'));
  ok('texto com "sincroniz" cala', UI_PURE.ehAvisoDeNuvem('Sincronizando com a nuvem...'));
  ok('"PUBLICADO E VERIFICADO" cala', UI_PURE.ehAvisoDeNuvem('PUBLICADO E VERIFICADO'));
  ok('aviso normal NÃO cala', !UI_PURE.ehAvisoDeNuvem('Cliente salvo'));
  ok('aviso de pix NÃO cala', !UI_PURE.ehAvisoDeNuvem('Código Pix copiado'));
  ok('vazio não cala', !UI_PURE.ehAvisoDeNuvem(''));
}

console.log('\n══════════════════════════════════');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
