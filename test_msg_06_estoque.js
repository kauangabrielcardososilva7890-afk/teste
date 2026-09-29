// ═══════════════════════════════════════════════════════════════
// test_msg_06_estoque.js — GERADO por migrar_testes_r57.js; 2 seções.
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_cadastros_nomes.js, test_ajustes_v52235.js
// ═══════════════════════════════════════════════════════════════
// Runner do tema: extrai cada SEÇÃO, roda isolada em processo filho
// (comportamento idêntico ao arquivo solto) e agrega o resultado.
// Seções abaixo vão dentro de if (false){} = INERTES (só parse, nunca executa).
// Novo teste do tema: APPEND bloco no fim, copiando o formato (if + 2 marcadores).
const __fs = require('fs');
const __cp = require('child_process');
const __self = __fs.readFileSync(__filename, 'utf8');
const __partes = [];
const __re = /\/\/<<<<SECAO:([^:]+):INICIO>>>>\r?\n([\s\S]*?)\/\/<<<<SECAO:\1:FIM>>>>/g;
let __m;
while ((__m = __re.exec(__self))) __partes.push({ nome: __m[1], codigo: __m[2] });
if (!__partes.length) { console.error('Tema sem seções!'); process.exit(1); }
const __falhas = [];
__partes.forEach((__s, __i) => {
  console.log('\n── ' + __s.nome + ' ──');
  const __tmp = '.tmp_secao_' + process.pid + '_' + __i + '.js';
  try {
    __fs.writeFileSync(__tmp, __s.codigo);
    const __r = __cp.spawnSync(process.execPath, [__tmp], { stdio: 'inherit' });
    if (__r.status !== 0 || __r.error) __falhas.push(__s.nome);
  } finally { try { __fs.unlinkSync(__tmp); } catch (e) {} }
});
if (__falhas.length) { console.error('\nTEMA FALHOU (' + __falhas.length + ' seções): ' + __falhas.join(', ')); process.exit(1); }
console.log('\nTEMA OK: ' + __partes.length + ' seções.');

if (false) { // ═══ test_cadastros_nomes.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_cadastros_nomes.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('cadastros_nomes_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', code)(ctx.window, ctx.db);
const C = ctx.window.CADASTROS_NOMES_PURE;

console.log('== CADASTROS_NOMES_PURE: códigos e nomes conhecidos ==');
ok('código tira zeros', C.codigoCliente({ codigo: '000116' }) === '116');
ok('nome vazio inválido', !C.nomeValido(''));
ok('nome genérico inválido', !C.nomeValido('SEM NOME'));
ok('empresa preserva sigla JK', C.titleEmpresa('PAPELARIA JK') === 'Papelaria JK');

console.log('== corrigirNomesClientes ==');
{
  const db = { clientes: [
    { empresaId: 'e1', codigo: '116', nome: '' },
    { empresaId: 'e1', codigo: '166', nome: 'SEM NOME' },
    { empresaId: 'e1', codigo: '175', nome: '-' },
    { empresaId: 'e1', codigo: '200', fantasia: 'LOJA TESTE' },
    { empresaId: 'e2', codigo: '116', nome: '' }
  ], modulosDinamicos: {} };
  const count = C.corrigirNomesClientes(db, 'e1');
  ok('alterou 4 clientes da empresa', count === 4);
  ok('116 preenchido', db.clientes[0].nome === 'Fernando Seguros');
  ok('166 preenchido', db.clientes[1].nome === 'Papelaria JK');
  ok('175 preenchido', db.clientes[2].nome === 'Caixa Escolar Manoel Neto dos Santos');
  ok('fantasia aproveitada', db.clientes[3].nome === 'Loja Teste');
  ok('outra empresa não mexe', db.clientes[4].nome === '');
}

console.log('\nRESULTADO: Testes de correção de cadastros passaram!');
//<<<<SECAO:test_cadastros_nomes.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52235.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52235.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52235_codigo_sem_sku_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const P=ctx.window.CODIGO_SEM_SKU_PURE;

ok('SKU vira Código', P.textoCodigo('SKU')==='Código' && P.textoCodigo('SKU: 12')==='Código: 12');
ok('Código / SKU vira Código', P.textoCodigo('Código / SKU')==='Código');
ok('Total SKUs some', P.textoCodigo('Total SKUs')==='Total de produtos');
ok('não apaga o campo interno', /campo interno continua sku/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52235_codigo_sem_sku_patch.js'));
ok('versão 5.22.35+', /^\d+\.\d+\.\d+/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.35 passou!');
//<<<<SECAO:test_ajustes_v52235.js:FIM>>>>
}
