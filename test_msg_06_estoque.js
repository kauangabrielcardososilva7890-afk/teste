// ═══════════════════════════════════════════════════════════════
// test_msg_06_estoque.js — GERADO por migrar_testes_r57.js; 3 seções.
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_cadastros_nomes.js, test_ajustes_v52235.js, Produtos/Recargas.
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


if (false) { // ═══ test_menu_produtos_recargas.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_menu_produtos_recargas.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const fluxosSrc = fs.readFileSync('fluxos_operacionais_patch.js', 'utf8');
const wFluxos = {};
new Function('window', 'document', fluxosSrc)(wFluxos, undefined);
const F = wFluxos.FLUXOS_PURE;
console.log('== Produtos: validação do formulário ==');
ok('valores inteiros e monetários válidos', F.validarNumerosProdutoOperacional({estoque:'8',estoqueMin:'1',estoqueIdeal:'10',custo:'3.25',preco:'7.90'}, false).ok);
ok('estoque negativo bloqueado', !F.validarNumerosProdutoOperacional({estoque:'-1',estoqueMin:'0',estoqueIdeal:'0',custo:'0',preco:'0'}, false).ok);
ok('quantidade fracionária bloqueada', !F.validarNumerosProdutoOperacional({estoque:'1.5',estoqueMin:'0',estoqueIdeal:'0',custo:'0',preco:'0'}, false).ok);
ok('mínimo negativo bloqueado', !F.validarNumerosProdutoOperacional({estoque:'1',estoqueMin:'-1',estoqueIdeal:'0',custo:'0',preco:'0'}, false).ok);
ok('custo negativo bloqueado', !F.validarNumerosProdutoOperacional({estoque:'1',estoqueMin:'0',estoqueIdeal:'0',custo:'-0.01',preco:'0'}, false).ok);
ok('preço negativo bloqueado', !F.validarNumerosProdutoOperacional({estoque:'1',estoqueMin:'0',estoqueIdeal:'0',custo:'0',preco:'-0.01'}, false).ok);
ok('estoque atual ignorado no modo infinito (é gravado como zero)', F.validarNumerosProdutoOperacional({estoque:'-50',estoqueMin:'0',estoqueIdeal:'0',custo:'0',preco:'0'}, true).ok && /estoque: estoqueInfinito \? 0/.test(fluxosSrc));
const dbControle = { produtos:[
  {id:'infinito',empresaId:'e1',categoria:'Produto',status:'ativo',estoqueInfinito:true,controleEstoque:true},
  {id:'normal',empresaId:'e1',categoria:'Produto',status:'ativo',estoqueInfinito:false,controleEstoque:false},
  {id:'outra',empresaId:'e2',categoria:'Produto',status:'ativo',estoqueInfinito:true,controleEstoque:false}
] };
const migracaoControle = F.adaptarProdutosMigrados(dbControle,'e1');
ok('migração alinha controleEstoque ao modo infinito e respeita empresa', migracaoControle === true && dbControle.produtos[0].controleEstoque === false && dbControle.produtos[1].controleEstoque === true && dbControle.produtos[2].controleEstoque === false);
ok('migração do controle de estoque é idempotente', F.adaptarProdutosMigrados(dbControle,'e1') === false);
ok('quantidade fora do inteiro seguro é rejeitada', !F.validarNumerosProdutoOperacional({estoque:'9007199254740992',estoqueMin:'0',estoqueIdeal:'0',custo:'0',preco:'0'}, false).ok);
const saveProduto = fluxosSrc.slice(fluxosSrc.indexOf('window.salvarProdutoOperacional'), fluxosSrc.indexOf('window.deleteProduto', fluxosSrc.indexOf('window.salvarProdutoOperacional')));
ok('validação ocorre antes de consumir código/gravar produto', saveProduto.indexOf('validarNumerosProdutoOperacional') >= 0 && saveProduto.indexOf('validarNumerosProdutoOperacional') < saveProduto.indexOf('consumirCodigoProduto'));
ok('inputs numéricos têm limites HTML coerentes', /id="kp-prd-est" type="number" min="0" step="1"/.test(fluxosSrc) && /id="kp-prd-preco" type="number" min="0" step="0\.01"/.test(fluxosSrc));
ok('busca de Produtos registra e restaura cursor/foco', /produtoBuscaFocoPendente/.test(fluxosSrc) && /setSelectionRange\(pos\.inicio, pos\.fim, pos\.direcao\)/.test(fluxosSrc));

console.log('\n== Produtos: exclusão restrita à empresa da sessão ==');
const deleteSrc = fs.readFileSync('ajustes_v51916_patch.js', 'utf8');
const wDelete = {};
new Function('window', 'document', deleteSrc)(wDelete, undefined);
const D = wDelete.AJUSTES_V51916_PURE;
const dbTeste = { produtos:[
  {id:'p1',empresaId:'e1',status:'ativo'},
  {id:'p2',empresaId:'e2',status:'ativo'},
  {id:'p3',empresaId:'e1',status:'excluido'}
] };
ok('seleção em lote devolve somente produtos da empresa atual', D.produtosDaEmpresa(dbTeste,['p1','p2','p3'],'e1').length === 2);
ok('busca individual não encontra ID de outra empresa', D.produtoDaEmpresa(dbTeste,'p2','e1') === null);
ok('lote usa o seletor de empresa no executor', /produtosDaEmpresa\(db, ids, s\.empresaId\)/.test(deleteSrc));
ok('exclusão individual usa o seletor de empresa no executor', /produtoDaEmpresa\(db, id, s\.empresaId\)/.test(deleteSrc));
ok('exclusões retornam Promise para o guardião local-first', (deleteSrc.match(/return Promise\.resolve\(confirmacao\)\.then/g)||[]).length >= 2);
const popupSrc = fs.readFileSync('popup_sistema_patch.js', 'utf8');
ok('executor individual de Produto declara confirmação própria', D.deleteProdutoConfirmaInternamente === true);
ok('popup evita duplicar confirmação apenas para esse executor', /if\(name==='deleteProduto' && window\.AJUSTES_V51916_PURE && window\.AJUSTES_V51916_PURE\.deleteProdutoConfirmaInternamente\) return;/.test(popupSrc));

console.log('\n== Recargas: preço, código e tenant ==');
const recargasSrc = fs.readFileSync('ajustes_v52214_recargas_patch.js', 'utf8');
const wRecargas = {};
new Function('window', 'document', recargasSrc)(wRecargas, undefined);
const R = wRecargas.RECARGAS_PURE;
const lista = [
  {id:'r1',empresaId:'e1',codigo:'1',nome:'Recarga A',preco:10,status:'ativo'},
  {id:'r2',empresaId:'e2',codigo:'1',nome:'Recarga de outra empresa',preco:20,status:'ativo'},
  {id:'r3',empresaId:'e1',codigo:'8',nome:'Recarga inativa',preco:30,status:'inativo'},
  {id:'r4',codigo:'9',nome:'Registro sem empresa',preco:40,status:'ativo'}
];
ok('busca mostra somente recargas ativas da empresa exata', R.filtrarRecargas(lista,'e1','').length === 1);
ok('busca sem empresa identificada não expõe registros', R.filtrarRecargas(lista,null,'').length === 0);
ok('edição só localiza registro da empresa atual', R.recargaDaEmpresa(lista,'r2','e1') === null && R.recargaDaEmpresa(lista,'r1','e1').id === 'r1');
ok('novo código sequencial conta apenas a empresa atual', R.proximoCodigoRecarga(lista,'e1') === '9');
ok('código repetido na mesma empresa é detectado', R.codigoRecargaDuplicado(lista,'e1','1','') === true);
ok('código de outra empresa não bloqueia', R.codigoRecargaDuplicado(lista,'e1','1','r1') === false);
ok('preço negativo rejeitado', !R.valorPrecoRecarga('-5').ok);
ok('preço inválido não finito rejeitado', !R.valorPrecoRecarga('Infinity').ok);
ok('preço vazio mantém zero válido', R.valorPrecoRecarga('').ok && R.valorPrecoRecarga('').valor === 0);
ok('preço decimal com vírgula normalizado', R.valorPrecoRecarga('12,50').valor === 12.5);
ok('executor rejeita editar registro estrangeiro', /recargaDaEmpresa\(store\(\),id,s\.empresaId\)/.test(recargasSrc));
ok('executor exige confirmação e falha fechado', /if\(typeof window\.confirmSistema!=='function'\)/.test(recargasSrc) && /A recarga foi mantida/.test(recargasSrc));
ok('busca de Recargas restaura cursor/foco', /novo\.setSelectionRange\(pos\.inicio,pos\.fim,pos\.direcao\)/.test(recargasSrc));
console.log('\nRESULTADO: regressões de Produtos/Recargas passaram!');
//<<<<SECAO:test_menu_produtos_recargas.js:FIM>>>>
}
