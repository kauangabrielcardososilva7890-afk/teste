const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}
const code = fs.readFileSync('modulos_neo_visual_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.MODULOS_NEO_PURE;
console.log('== MODULOS_NEO_PURE ==');
ok('exporta funções puras', !!P && typeof P.filtrar === 'function' && typeof P.ordenar === 'function');
const dados = [
  { COD: '10', NOME: 'Zebra', VALOR: '100,50' },
  { COD: '2', NOME: 'abacaxi', VALOR: '20' },
  { COD: '', NOME: 'Sem codigo', VALOR: '' }
];
ok('sem busca devolve tudo', P.filtrar(dados, ['COD', 'NOME'], '', '').length === 3);
ok('busca ignora maiúscula', P.filtrar(dados, ['COD', 'NOME'], 'ZEBRA', '').length === 1);
ok('busca numa coluna só', P.filtrar(dados, ['COD', 'NOME'], '2', 'COD').length === 1);
ok('busca em todas as colunas', P.filtrar(dados, ['COD', 'NOME'], 'abac', '').length === 1);
ok('ordenar número como número (2 antes de 10)', P.ordenar(dados, 'COD', 'asc').map(r => r.COD).join(',') === ',2,10');
ok('ordenar desc inverte', P.ordenar(dados, 'COD', 'desc')[0].COD === '10');
ok('ordenar texto ignora maiúscula', P.ordenar(dados, 'NOME', 'asc')[0].NOME === 'abacaxi');
ok('fatiar limita a página', P.fatiar([1, 2, 3], 2).visiveis.length === 2 && P.fatiar([1, 2, 3], 2).total === 3);
ok('cmpValor número com vírgula', P.cmpValor('100,50', '20') > 0);
ok('não filtra enquanto digita (sem oninput)', !/oninput/.test(code));
ok('busca no Enter', /Enter/.test(code) && /keydown/.test(code));
ok('usa padrão neo igual aos outros menus', /neo-shell/.test(code) && /neo-panel/.test(code) && /neo-table/.test(code) && /neo-btn/.test(code));
ok('duplo clique abre detalhe', /ondblclick="visualizarRegistroDinamico/.test(code));
ok('mantém exportar e excluir módulo', /exportarModuloDinamico/.test(code) && /confirmarExcluirModulo/.test(code));
console.log('\nRESULTADO: Testes do visual neo dos módulos passaram!');
