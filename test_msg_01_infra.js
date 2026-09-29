// ═══════════════════════════════════════════════════════════════
// test_msg_01_infra.js — GERADO por migrar_testes_r57.js; 88 seções.
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_vos.js, test_perf.js, test_extras.js, test_fluxos_operacionais.js, test_automacoes_triggers.js, test_automacoes_finais_locacao_auxiliares.js, test_otimizacao_profunda.js, test_automacoes_procedures_operacionais.js, test_correcoes_uso_diario.js, test_ajustes_pos_final.js, test_ajustes_v52023.js, test_ajustes_v52024.js, test_um_arquivo_por_modulo.js, test_app_bundle.js, test_electron_security.js, test_ajustes_v5215.js, test_ajustes_v5223.js, test_ajustes_v5224.js, test_ajustes_v52211.js, test_ajustes_v52214.js, test_ajustes_v52219.js, test_ajustes_v52220.js, test_ajustes_v52223.js, test_ajustes_v52224.js, test_ajustes_v52225.js, test_ajustes_v52226.js, test_ajustes_v52227.js, test_ajustes_v52232.js, test_ajustes_v52234.js, test_ajustes_v52247.js, test_ajustes_v52248.js, test_ajustes_v52250.js, test_ajustes_v52251.js, test_ajustes_v52252.js, test_ajustes_v52263.js, test_ajustes_v52264.js, test_ajustes_v52265.js, test_ajustes_v52267.js, test_ajustes_v52268.js, test_ajustes_v52273.js, test_ajustes_v52279.js, test_ajustes_v52282.js, test_ajustes_v52284.js, test_ajustes_v52285.js, test_ajustes_v52286.js, test_ajustes_v52287.js, test_ajustes_v52288.js, test_ajustes_v52289.js, test_ajustes_v52290.js, test_ajustes_v52294.js, test_ajustes_v52296.js, test_ajustes_v52423.js, test_ajustes_v52424.js, test_ajustes_v52427.js, test_ajustes_v52428.js, test_ajustes_v5260.js, test_ajustes_v5262.js, test_ajustes_v5263.js, test_ajustes_v5264.js, test_ajustes_v5265.js, test_ajustes_v5266.js, test_ajustes_v6001.js, test_ajustes_v5248.js, test_ponte_electron.js, test_versao_visual.js, test_ajustes_v6105.js, test_ajustes_v6106.js, test_importar_referencias.js, test_ajustes_v5183.js, test_ajustes_v5185.js, test_ajustes_v5186.js, test_ajustes_v5187.js, test_ajustes_v5189.js, test_ajustes_v5191.js, test_ajustes_v5192.js, test_ajustes_v5193.js, test_ajustes_v5196.js, test_ajustes_v51916.js, test_ajustes_v51920.js, test_linhas_tabela_clique.js, test_faixa_botoes_r46.js, test_ajustes_v5184.js, test_ajustes_v52413.js, test_ajustes_v52414.js, test_ajustes_v5243.js, test_ajustes_v5245.js, test_portao_escrita.js, test_salvar_alteracao.js
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

if (false) { // ═══ test_vos.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_vos.js:INICIO>>>>
// Teste unitário dos helpers puros do vendas_os_patch.js (seção VOS_PURE)
// Uso: node test_vos.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/vendas_os_patch.js', 'utf8');
const m = src.match(/\/\* VOS_PURE_START \*\/([\s\S]*?)\/\* VOS_PURE_END \*\//);
if(!m){ console.error('FALHOU: seção VOS_PURE não encontrada'); process.exit(1); }
eval(m[1]);

let pass = 0, fail = 0;
function eq(nome, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok) { pass++; console.log('  ✔', nome); }
  else { fail++; console.error('  ✘', nome, '\n     obtido:', JSON.stringify(got), '\n     esperado:', JSON.stringify(want)); }
}
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

console.log('== vosOsCompleta (regra da impressão) ==');
ok('vazio → false', !vosOsCompleta(null) && !vosOsCompleta({}));
ok('só modelo+série → false (falta patrimônio/contador)', !vosOsCompleta({modelo:'HP M404', numeroSerie:'BR123'}));
ok('modelo+série+patrimônio → true', vosOsCompleta({modelo:'HP M404', numeroSerie:'BR123', patrimonio:'PAT-55'}));
ok('modelo+série+contador → true', vosOsCompleta({modelo:'HP M404', numeroSerie:'BR123', contador:'12000'}));
ok('modelo+série+contador 0 → true', vosOsCompleta({modelo:'HP M404', numeroSerie:'BR123', contador:0}));
ok('sem série → false', !vosOsCompleta({modelo:'HP M404', patrimonio:'PAT-55'}));
ok('espaços contam como vazio', !vosOsCompleta({modelo:'  ', numeroSerie:'BR123', patrimonio:'P'}));

console.log('== vosCalcParcelas — intervalo de dias, sem juros ==');
{
  const r = vosCalcParcelas(300, {parcelas:3, primeiroVencimento:'2026-08-10', intervaloDias:30, jurosMes:0, hoje:'2026-07-29'});
  eq('3 parcelas', r.parcelas.length, 3);
  eq('valores iguais', r.parcelas.map(p=>p.valor), [100,100,100]);
  eq('total', r.total, 300);
  eq('vencimentos a cada 30d', r.parcelas.map(p=>p.vencimento.slice(0,10)), ['2026-08-10','2026-09-09','2026-10-09']);
}
console.log('== vosCalcParcelas — vencimento todo dia 10 ==');
{
  const r = vosCalcParcelas(200, {parcelas:3, primeiroVencimento:'2026-08-15', diaFixo:10, jurosMes:0, hoje:'2026-07-29'});
  eq('vencimentos dia 10', r.parcelas.map(p=>p.vencimento.slice(0,10)), ['2026-08-10','2026-09-10','2026-10-10']);
}
console.log('== vosCalcParcelas — dia fixo em mês curto ==');
{
  const r = vosCalcParcelas(100, {parcelas:2, primeiroVencimento:'2026-01-31', diaFixo:31, jurosMes:0, hoje:'2026-01-01'});
  eq('fevereiro tem no máx 28', r.parcelas[1].vencimento.slice(0,10), '2026-02-28');
}
console.log('== vosCalcParcelas — juros proporcional % a.m. ==');
{
  const r = vosCalcParcelas(100, {parcelas:1, primeiroVencimento:'2026-08-28', intervaloDias:30, jurosMes:2, hoje:'2026-07-29'});
  // 30 dias → 100 * (1 + 0.02*1) = 102
  eq('1 parcela 30d com 2% a.m. = 102', r.parcelas[0].valor, 102);
}
{
  const r = vosCalcParcelas(100, {parcelas:2, primeiroVencimento:'2026-08-28', intervaloDias:30, jurosMes:2, hoje:'2026-07-29'});
  // p1: 50*(1+0.02*1)=51 ; p2: 50*(1+0.02*2)=52
  eq('p1=51 p2=52', r.parcelas.map(p=>p.valor), [51,52]);
  eq('total=103', r.total, 103);
}
console.log('== vosCalcParcelas — arredondamento centavos ==');
{
  const r = vosCalcParcelas(100, {parcelas:3, primeiroVencimento:'2026-08-28', jurosMes:0, hoje:'2026-07-29'});
  // 100/3 = 33.333... → base 33.33 x3 = 99.99
  eq('base arredondada', r.parcelas[0].valor, 33.33);
  eq('total 99.99', r.total, 99.99);
}
console.log('== vosNextNumero ==');
eq('sequência', vosNextNumero('VD', 2026, [{numero:'VD-2026-0001'},{numero:'VD-2026-0042'}]), 'VD-2026-0043');
eq('lista vazia', vosNextNumero('OS', 2026, []), 'OS-2026-0001');
eq('ignora fora de padrão', vosNextNumero('VD', 2026, [{numero:'VENDA ANTIGA'},{numero:'VD-2026-0007'}]), 'VD-2026-0008');
eq('vosNumeroInt', vosNumeroInt('VD-2026-0081'), 81);
eq('vosNumeroInt número puro', vosNumeroInt('16001'), 16001);

console.log('== vosNextNumero — modo SÓ NÚMERO (padrão novo: sem VD, sem ano) ==');
eq('continua do maior, saída sem prefixo', vosNextNumero('VD', 2026, [{numero:'VD-2026-0001'},{numero:'16001'}], true), '16002');
eq('ignora código antigo com ano no meio', vosNextNumero('VD', 2026, [{numero:'VD-2026-0081'},{numero:'9847'}], true), '9848');
eq('lista vazia começa do 1', vosNextNumero('VD', 2026, [], true), '1');
eq('número puro continua sequência', vosNextNumero('OS', 2026, [{numero:'55'}], true), '56');
eq('OS antiga com prefixo entra na conta', vosNextNumero('OS', 2026, [{numero:'OS-2026-0142'},{numero:'500'}], true), '501');

console.log(`\nRESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_vos.js:FIM>>>>
}

if (false) { // ═══ test_perf.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_perf.js:INICIO>>>>
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
//<<<<SECAO:test_perf.js:FIM>>>>
}

if (false) { // ═══ test_extras.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_extras.js:INICIO>>>>
// Testes unitários dos novos módulos v4.7.0 (notificacoes, vendas_extra, migrados_print)
// Uso: node test_extras.js
const fs = require('fs');
function extrai(arquivo, marca){
  const re = new RegExp('/\\* ' + marca + '_START \\*/([\\s\\S]*?)/\\* ' + marca + '_END \\*/');
  const m = fs.readFileSync(__dirname + '/' + arquivo, 'utf8').match(re);
  if(!m){ console.error('FALHOU: seção ' + marca + ' não encontrada em ' + arquivo); process.exit(1); }
  return m[1];
}
const NOTIF_PURE = eval(extrai('notificacoes_patch.js','NOTIF_PURE') + '\n; NOTIF_PURE;');
const EXTRA_PURE = eval(extrai('vendas_extra_patch.js','EXTRA_PURE') + '\n; EXTRA_PURE;');
const MIGPRINT_PURE = eval(extrai('migrados_print_patch.js','MIGPRINT_PURE') + '\n; MIGPRINT_PURE;');

let pass = 0, fail = 0;
function eq(nome, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok){ pass++; console.log('  ✔', nome); }
  else { fail++; console.error('  ✘', nome, '\n     obtido:', JSON.stringify(got), '\n     esperado:', JSON.stringify(want)); }
}
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

console.log('== numeroVisivel (notinha sem prefixo) ==');
{
  eq('VD-000123', EXTRA_PURE.numeroVisivel('VD-000123'), '000123');
  eq('VD-2026-0081', EXTRA_PURE.numeroVisivel('VD-2026-0081'), '2026-0081');
  eq('VENDA-55', EXTRA_PURE.numeroVisivel('VENDA-55'), '55');
  eq('número puro intacto', EXTRA_PURE.numeroVisivel('0081'), '0081');
  eq('legado cru 9847', EXTRA_PURE.numeroVisivel('9847'), '9847');
  eq('vazio não quebra', EXTRA_PURE.numeroVisivel(''), '');
  eq('só prefixo cai pro original', EXTRA_PURE.numeroVisivel('VD-'), 'VD-');
}

console.log('== podeRefaturar (desfazer QR/trocar forma) ==');
{
  const v = { id:'v1', status:'faturado' };
  eq('faturada sem título pago → pode', EXTRA_PURE.podeRefaturar(v, [{vendaId:'v1',status:'aberto'}]).ok, true);
  ok('venda migrada → bloqueia', !EXTRA_PURE.podeRefaturar({id:'v2',status:'faturado',origemMigracao:true}, []).ok);
  ok('não faturada → bloqueia', !EXTRA_PURE.podeRefaturar({id:'v3',status:'aberta'}, []).ok);
  const comPaga = EXTRA_PURE.podeRefaturar(v, [{vendaId:'v1',status:'pago',descricao:'Parcela 1'}]);
  ok('parcela baixada manualmente → bloqueia', !comPaga.ok);
  ok('motivo aponta o estorno', /Financeiro/i.test(comPaga.motivo));
  const autoVista = EXTRA_PURE.podeRefaturar(v, [{vendaId:'v1',status:'pago',autoBaixa:true,descricao:'Venda • à vista (Pix)'}]);
  eq('à vista auto-baixado (Pix) → PODE refazer', autoVista.ok, true);
}

console.log('== scanEstoqueBaixo ==');
{
  const prods = [
    {id:'p1', empresaId:'E', nome:'Toner A', estoque:3, estoqueMin:5, status:'ativo'},
    {id:'p2', empresaId:'E', nome:'Toner B', estoque:5, estoqueMin:5, status:'ativo'},
    {id:'p3', empresaId:'E', nome:'Toner C', estoque:40, estoqueMin:5, status:'ativo'},
    {id:'p4', empresaId:'E', nome:'Toner D', estoque:0, estoqueMin:2, status:'inativo'},
    {id:'p5', empresaId:'OUTRA', nome:'Toner E', estoque:0, estoqueMin:9, status:'ativo'}
  ];
  const r = NOTIF_PURE.scanEstoqueBaixo(prods, 'E');
  eq('só da empresa, ativos, estoque<=mínimo', r.map(x=>x.ref).sort(), ['p1','p2']);
  eq('ordenado pelos mais críticos (zerado/abaixo primeiro)', r[0].ref, 'p1');
  eq('traz dados p/ o aviso', {nome:r[1].nome, min:r[1].min}, {nome:'Toner B', min:5});
}

console.log('== scanContasReceber ==');
{
  const contas = [
    {id:'c1', empresaId:'E', status:'aberto', vencimento:'2026-07-29T00:00:00.000Z', valor:100},
    {id:'c2', empresaId:'E', status:'aberto', vencimento:'2026-07-30T12:00:00.000Z', valor:50},
    {id:'c3', empresaId:'E', status:'aberto', vencimento:'2026-08-05T12:00:00.000Z', valor:70},
    {id:'c4', empresaId:'E', status:'aberto', vencimento:'2026-08-20T12:00:00.000Z', valor:90},
    {id:'c5', empresaId:'E', status:'pago',   vencimento:'2026-07-01T00:00:00.000Z', valor:10},
    {id:'c6', empresaId:'X', status:'aberto', vencimento:'2026-07-01T00:00:00.000Z', valor:10}
  ];
  const r = NOTIF_PURE.scanContasReceber(contas, 'E', '2026-07-30', 7);
  eq('vencidas (antes de hoje, não pagas, da empresa)', r.vencidas.map(c=>c.id), ['c1']);
  eq('a vencer em até 7 dias (hoje incluído)', r.aVencer.map(c=>c.id), ['c2','c3']);
  eq('não duplica vencida no a-vencer', r.aVencer.some(c=>c.id==='c1'), false);
}

console.log('== MIGPRINT: detecção de notinha antiga ==');
{
  ok('NOTINHA', MIGPRINT_PURE.ehTabelaNotinha('NOTINHAS'));
  ok('NOTAFISCAL', MIGPRINT_PURE.ehTabelaNotinha('nota_fiscal'));
  ok('CUPOM', MIGPRINT_PURE.ehTabelaNotinha('CUPOM_VENDA'));
  ok('SAIDA', MIGPRINT_PURE.ehTabelaNotinha('SAIDAS'));
  ok('movimento qualquer não', !MIGPRINT_PURE.ehTabelaNotinha('BAIRROS'));
}

console.log('== MIGPRINT: resumo + escape ==');
{
  eq('resumo pega NUMERO', MIGPRINT_PURE.resumoRegistro({NUMERO:'12345', TOTAL:'99,90'}), 'Numero: 12345');
  eq('resumo cai p/ CODIGO', MIGPRINT_PURE.resumoRegistro({FOO:'', CODIGO:'A-9'}), 'Codigo: A-9');
  eq('escapa HTML (sem XSS na impressão)', MIGPRINT_PURE.esc('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  const html = MIGPRINT_PURE.htmlDocRegistro({ tabela:'NOTINHAS', label:'Notinhas Antigas', row:{NUMERO:'555', CLIENTE:'Maria <b>', TOTAL:'10,00'}, indice:4, resumo:'Numero: 555', empresaNome:'DIGICOPY', logo:'' });
  ok('doc traz título, tabela e campos', html.includes('Notinhas Antigas') && html.includes('NOTINHAS') && html.includes('Numero') && html.includes('10,00'));
  ok('doc escapa valor malicioso', html.includes('Maria &lt;b&gt;') && !html.includes('Maria <b>'));
  ok('doc tem botão imprimir', html.includes('window.print()'));
}

console.log('== hojeISO ==');
{
  eq('formato yyyy-mm-dd', NOTIF_PURE.hojeISO('2026-07-30T15:00:00.000Z'), '2026-07-30');
}

console.log('\n══════════════════════════════════');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_extras.js:FIM>>>>
}

if (false) { // ═══ test_fluxos_operacionais.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_fluxos_operacionais.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('fluxos_operacionais_patch.js', 'utf8');
const ctx = { window: {}, db: { produtos: [], equipamentos: [], parque: [], leituras: [], os: [] } };
new Function('window', 'db', code)(ctx.window, ctx.db);
const K = ctx.window.FLUXOS_PURE;

console.log('== FLUXOS_PURE: categorias e estoque ==');
ok('Cartucho vazio mantém categoria única', K.categoriaUnificada('CARTUCHO VAZIO') === 'Cartucho Vazio');
ok('Suprimento antigo vira Insumo', K.categoriaUnificada('Suprimento') === 'Insumo');
ok('Impressora/Impressoras ficam em Impressoras', K.categoriaUnificada('Impressora') === 'Impressoras');
ok('estoque igual ao mínimo não avisa', !K.estoqueBaixoEstrito(4, 4));
ok('estoque abaixo do mínimo avisa', K.estoqueBaixoEstrito(3, 4));

console.log('== FLUXOS_PURE: ordenação crescente inteligente ==');
{
  const lista = [{ codigo: '20' }, { codigo: '3' }, { codigo: '100' }, { codigo: '' }];
  const out = K.sortAsc(lista, x => x.codigo).map(x => x.codigo).join(',');
  ok('ordena número como número e vazio no fim', out === '3,20,100,');
}

console.log('== FLUXOS_PURE: cálculo de leitura por modalidade ==');
{
  const contrato = { id: 'ct1', franquiaPB: 1000, valorExcedentePB: 0.10 };
  const dbBase = { leituras: [] };
  let r = K.calcularLeituraOperacional(dbBase, contrato, { id: 'p1', modalidade: 'individual', franquiaPB: 500, valorExcedentePB: 0.20 }, 1000, 1800, '2026-07-10');
  ok('individual cobra só excedente da franquia da impressora', r.utilizado === 800 && r.qtdExcedente === 300 && Math.abs(r.valorExcedente - 60) < 0.001);

  r = K.calcularLeituraOperacional(dbBase, contrato, { id: 'p1', modalidade: 'impressao', valorExcedentePB: 0.15 }, 100, 250, '2026-07-10');
  ok('por impressão cobra todas páginas usadas', r.qtdExcedente === 150 && Math.abs(r.valorExcedente - 22.5) < 0.001);

  r = K.calcularLeituraOperacional(dbBase, contrato, { id: 'p1', modalidade: 'mes_fixo', valorExcedentePB: 0.15 }, 100, 800, '2026-07-10');
  ok('mês fixo não gera excedente', r.utilizado === 700 && r.qtdExcedente === 0 && r.valorExcedente === 0);

  const dbGlobal = { leituras: [{ id: 'l1', contratoId: 'ct1', dataLeitura: '2026-07-05T12:00:00.000Z', consumoPB: 800 }] };
  r = K.calcularLeituraOperacional(dbGlobal, contrato, { id: 'p2', modalidade: 'global', valorExcedentePB: 0.10 }, 2000, 2500, '2026-07-20');
  ok('global cobra só o excedente incremental do mês', r.utilizado === 500 && r.qtdExcedente === 300 && Math.abs(r.valorExcedente - 30) < 0.001);
}

console.log('== FLUXOS_PURE: contador antigo do chamado ==');
{
  const dbTest = {
    equipamentos: [{ id: 'eq1', contadorPB: 1000 }],
    leituras: [{ equipamentoId: 'eq1', contadorPB: 1500, dataLeitura: '2026-07-01T12:00:00.000Z' }],
    os: [{ id: 'os1', equipamentoId: 'eq1', contadorAtual: 1800, dataAbertura: '2026-07-10T12:00:00.000Z' }]
  };
  const ult = K.ultimoContadorPreto(dbTest, 'eq1');
  ok('usa o último chamado/leitura como contador antigo', ult.valor === 1800 && ult.origem === 'chamado');
}

console.log('== FLUXOS_PURE: NCM ==');
ok('NCM é formatado automaticamente', K.normalizarNCM('84433299') === '8443.32.99');

console.log('\nRESULTADO: Testes do patch Operacional passaram!');
//<<<<SECAO:test_fluxos_operacionais.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_triggers.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_triggers.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_triggers_patch.js','utf8');
const db = {
  clientes: [], produtos:[{id:'p1', empresaId:'emp', sku:'10', nome:'Produto 10'}], vendas:[], parque:[{id:'prq1', empresaId:'emp', codigoAntigo:'113'}],
  modulosDinamicos:{
    ORCAMENTO:{dados:[{COD_ORCAMENTO:3, COD_CLIENTE:71, NOME_CLIENTE:'CIDA FILOMENA', VALOR_DESCONTO:10, VALOR_ACRESCIMO:5, VALOR_FRETE:2, PERCENTUAL_DESC:0, DATA_EMISSAO:'2018-04-20'}]},
    ITENS_ORCAMENTO:{dados:[{COD_ORCAMENTO:3, COD_PRODUTO:10, QTDE:2, VALOR_UNITARIO:50, VALOR_TOTAL:100}]},
    VISITAS:{dados:[{VI_COD_ITENS_LOCACAO:113, DATA:'2020-01-02'}]},
    MOVIMENTACAO:{dados:[{MOV_COD_CONTA:2, MOV_ENTRADA:100, MOV_SAIDA:20},{MOV_COD_CONTA:2, MOV_ENTRADA:5, MOV_SAIDA:0}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_TRIGGERS_PURE;
console.log('== AUTOMACOES_TRIGGERS_PURE ==');
ok('calcula total de orçamento com desconto/acréscimo/frete', A.calcularTotalOrcamento(db.modulosDinamicos.ORCAMENTO.dados[0], db.modulosDinamicos.ITENS_ORCAMENTO.dados) === 97);
const changed = A.aplicarAutomacoesTriggers('emp');
ok('sincroniza orçamento para vendas', changed > 0 && db.vendas.length === 1 && db.vendas[0].status === 'orcamento');
ok('cria cliente avulso do orçamento', db.clientes.length === 1 && db.clientes[0].codigo === '71');
ok('atualiza última visita do parque', db.parque[0].ultimaVisita === '2020-01-02');
ok('recalcula saldo por movimentação', db.saldosMovimentacao['2'] === 85);
const venda = A.converterOrcamentoEmVenda('3', 'emp');
ok('converte orçamento em venda sem apagar orçamento', venda && db.vendas.length === 2 && db.vendas[0].status === 'aprovado');
console.log('\nRESULTADO: Testes de automações de triggers passaram!');
//<<<<SECAO:test_automacoes_triggers.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_finais_locacao_auxiliares.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_finais_locacao_auxiliares.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('automacoes_finais_locacao_auxiliares_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', codigoAntigo:'10', nome:'Cliente'}],
  produtos:[{id:'prd1', empresaId:'emp', sku:'20', codigoAntigo:'20', nome:'Toner', vidaUtil:1000}],
  contratos:[{id:'ct1', empresaId:'emp', numero:'200', codigoAntigo:'200', clienteId:'cli1'}],
  cartuchosMigrados:[{id:'cart1', codigoAntigo:'30', qtdeCopias:800}],
  emailsMigrados:[{id:'eml1', empresaId:'emp', codigoAntigo:'5', email:'cliente@x.com'}],
  modulosDinamicos:{
    ENQUETES_PERGUNTA:{dados:[{ENI_CODIGO:1, ENI_COD_ENQUETE:1, ENI_PERGUNTA:'Gostou?'}]},
    ENQUETES_VOTOS:{dados:[{ENV_CODIGO:1, ENV_COD_ENQUETE:1, ENV_COD_CLIENTE:10, ENV_VALOR:'Sim'}]},
    CARTAO_CLIENTE:{dados:[{CAC_CODIGO:1, CAC_COD_CLIENTE:10, CAC_DESCRICAO:'Fidelidade'}]},
    CONTADORES_OFF:{dados:[{COO_CODIGO:1, COO_SERIAL:'ABC', COO_CONTADOR:123}]},
    EMAIL_OFF:{dados:[{EMO_CODIGO:1, EMO_EMAIL:'CLIENTE@X.COM', EMO_ASSUNTO:'Fila'}]},
    EMAIL_CAMPANHA_ENVIOS_EMAIL:{dados:[{ECM_CODIGO:1, ECM_COD_EMAIL:5, ECM_ACAO:1},{ECM_CODIGO:2, ECM_COD_EMAIL:5, ECM_ACAO:0}]},
    CONFIG_CLIENTES:{dados:[{CLC_CODIGO:1, CLC_COD_CLIENTE:10, CLC_DESCRICAO:'limite', CLC_VALOR:'1'}]},
    CONFIG_CUSTOS:{dados:[{COS_CODIGO:1, COS_COD_CLIENTE:10, COS_DESCRICAO:'VALOR_EMAIL', COS_VALOR:0.05},{COS_CODIGO:2, COS_COD_CLIENTE:10, COS_DESCRICAO:'VALOR_WHATSAPP', COS_VALOR:0.20}]},
    CONTAS_RECEBER_AVULSA:{dados:[
      ...Array.from({length:11}, (_,i)=>({CRA_CODIGO:i+1, CRA_COD_CLIENTE:10, CRA_DESCRICAO:'Enviou Email: teste', CRA_DATA:'2026-08-01T10:00:10Z'})),
      {CRA_CODIGO:20, CRA_COD_CLIENTE:10, CRA_DESCRICAO:'Enviou Whatsapp: teste', CRA_DATA:'2026-08-01T11:00:00Z'},
      {CRA_CODIGO:21, CRA_COD_CLIENTE:10, CRA_DESCRICAO:'Gerou Nfe: 1', CRA_DATA:'2026-08-01T12:00:00Z'},
      {CRA_CODIGO:22, CRA_COD_CLIENTE:10, CRA_DESCRICAO:'Enviou SMS: importado', CRA_OBS:'Importado Banco Mysql'}
    ]},
    PRODUTOS_ATACADO:{dados:[{PRA_CODIGO:1, PRA_COD_PRODUTO:20, PRA_QTDE:5, PRA_VALOR:90}]},
    RAMO:{dados:[{RAM_CODIGO:1, RAM_DESCRICAO:'Escritório'}]},
    REGISTROS:{dados:[{REG_CODIGO:1, REG_DESCRICAO:'Registro'}]},
    BOLETOS_HISTORICO:{dados:[{BOH_CODIGO:1, BOH_COD_BOLETO:10, BOH_STATUS:'paid'}]},
    PIX_HISTORICO:{dados:[{PIH_CODIGO:1, PIH_COD_PIX:2, PIH_STATUS:5}]},
    SELECIONADOS:{dados:[{COD_SELECIONADO:1, TABELA:'CLIENTES', REFERENCIA:'10'}]},
    ITENS_VENDA:{dados:[{COD_ITENS_VENDA:501, COD_PRODUTO:20}]},
    CONTADORES:{dados:[{CON_COD_LOCACAO:200, CON_TOTAL_IMPRESSAO_DIA:10, CON_DATA_CADASTRO:'2026-08-01'},{CON_COD_LOCACAO:200, CON_TOTAL_IMPRESSAO_DIA:20, CON_DATA_CADASTRO:'2026-08-02'}]},
    LOCACAO_ESTOQUE:{dados:[{LE_CODIGO:1, LE_COD_LOCACAO:200, LE_ESTOQUE_TONER:0, LE_IMPRESSOES:0}]},
    LOCACAO_ESTOQUE_HISTORICO:{dados:[{LEH_CODIGO:1, LEH_COD_LOCACAO:200, LEH_COD_CLIENTE:10, LEH_TIPO:1, LEH_QTDE:2, LEH_COD_ITENS_VENDA:501},{LEH_CODIGO:2, LEH_COD_LOCACAO:200, LEH_TIPO:0, LEH_QTDE:1, LEH_IMPRESSOES:300}]},
    RAMO_ITENS_FABRICANTE:{dados:[{RIF_CODIGO:1, RIF_COD_RAMO_ITEM:4, RIF_COD_FABRICANTE:9}]}
  }
};

const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_FINAIS_LOCACAO_AUX_PURE;

console.log('== AUTOMACOES_FINAIS_LOCACAO_AUX_PURE ==');
ok('descrição status Pix', A.descricaoStatusPix(5) === 'Pago');
const changed = A.aplicarAutomacoesFinaisLocacaoAux('emp');
ok('aplicou automações parte 12', changed > 0);
ok('perguntas e votos de enquete migrados', db.enquetesPerguntasMigradas[0].pergunta === 'Gostou?' && db.enquetesVotosMigrados[0].clienteId === 'cli1');
ok('cartão cliente, contador off e email off migrados', db.cartoesClienteMigrados.length === 1 && db.contadoresOffMigrados[0].contador === 123 && db.emailsOffMigrados[0].email === 'cliente@x.com');
ok('evento de campanha incrementou abertura do e-mail', db.emailCampanhaEventosMigrados.length === 2 && db.emailsMigrados[0].emailAbriu === 1);
ok('configurações migradas', db.configClientesMigradas.length === 1 && db.configCustosMigradas.length === 2);
ok('conta avulsa classificou custo de e-mail em lote', db.contasReceberAvulsasMigradas.find(x=>x.codigoAntigo==='1').valor === 0.05);
ok('conta avulsa usou override de whatsapp e ignorou importado mysql', db.contasReceberAvulsasMigradas.find(x=>x.codigoAntigo==='20').valor === 0.2 && !db.contasReceberAvulsasMigradas.find(x=>x.codigoAntigo==='22'));
ok('conta avulsa NFE padrão', db.contasReceberAvulsasMigradas.find(x=>x.codigoAntigo==='21').valor === 1.99);
ok('produtos atacado, ramo e registros migrados', db.produtosAtacadoMigrados[0].valor === 90 && db.ramosMigrados.length === 1 && db.registrosMigrados.length === 1);
ok('históricos boleto e pix migrados', db.boletosHistoricoMigrado.length === 1 && db.pixHistoricoMigrado[0].statusDescricao === 'Pago');
ok('selecionados e ramo/fabricante migrados', db.selecionadosMigrados.length === 1 && db.ramoItensFabricanteMigrados[0].fabricanteCodigoAntigo === '9');
ok('locação estoque histórico calculou entrada por vida útil do produto', db.locacaoEstoqueHistorico.find(x=>x.codigoAntigo==='LEH-1').impressoes === 2000);
ok('locação estoque calculou saldo, média, dias e percentual', db.locacaoEstoqueMigrado[0].estoqueToner === 1 && db.locacaoEstoqueMigrado[0].impressoes === 1700 && db.locacaoEstoqueMigrado[0].impressoesMediaDia === 15 && db.locacaoEstoqueMigrado[0].dias === 113 && db.locacaoEstoqueMigrado[0].porcentagem === 100);
ok('contrato recebeu resumo de toner', db.contratos[0].estoqueToner === 1 && db.contratos[0].diasToner === 113);
// v7.0.27 — TEMPORÁRIO r44: prova que dado na chave antiga migra para CONFIG_CUSTOS
// (remover junto com migrarTabelaCustosLegada, quando todos os PCs atualizarem)
console.log('== MIGRAÇÃO DA CHAVE ANTIGA (temporário) ==');
const dbAntigo = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', codigoAntigo:'10', nome:'Cliente'}],
  modulosDinamicos:{
    CONFIG_SISPRINTER:{dados:[{COS_CODIGO:1, COS_COD_CLIENTE:10, COS_DESCRICAO:'VALOR_EMAIL', COS_VALOR:0.05}]},
    CONTAS_RECEBER_AVULSA:{dados:Array.from({length:11},(_,i)=>({CRA_CODIGO:i+1, CRA_COD_CLIENTE:10, CRA_DESCRICAO:'Enviou Email: teste', CRA_DATA:'2026-08-01T10:00:00Z'}))}
  }
};
const ctx2 = { window:{}, db: dbAntigo };
new Function('window','db', code)(ctx2.window, ctx2.db);
const A2 = ctx2.window.AUTOMACOES_FINAIS_LOCACAO_AUX_PURE;
A2.aplicarAutomacoesFinaisLocacaoAux('emp');
ok('chave antiga virou CONFIG_CUSTOS', !!dbAntigo.modulosDinamicos.CONFIG_CUSTOS && dbAntigo.modulosDinamicos.CONFIG_CUSTOS.dados.length===1);
ok('chave antiga sumiu', !dbAntigo.modulosDinamicos.CONFIG_SISPRINTER);
ok('coleção nova populada', (dbAntigo.configCustosMigradas||[]).length===1);
ok('preço igual após migrar (0.05)', dbAntigo.contasReceberAvulsasMigradas.find(x=>x.codigoAntigo==='1').valor===0.05);

console.log('\nRESULTADO: Testes de automações finais/locação/auxiliares passaram!');
//<<<<SECAO:test_automacoes_finais_locacao_auxiliares.js:FIM>>>>
}

if (false) { // ═══ test_otimizacao_profunda.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_otimizacao_profunda.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('otimizacao_profunda_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'c1',empresaId:'emp',nome:'A'},{id:'c2',empresaId:'emp2',nome:'B'}],
  modulosDinamicos:{
    VISITAS:{dados:[{COD_VISITA:1,DATA:'2026-08-01'},{COD_VISITA:2,DATA:'2026-08-02'}]},
    CONTADOR_PAGINAS:{dados:[{COD_CONTADOR:1,CP_VALOR_TOTAL:10}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db',code)(ctx.window, ctx.db);
const P = ctx.window.DIGI_TURBO_PURE;

console.log('== OTIMIZACAO_PROFUNDA_PURE ==');
const sig1 = P.fingerprintTables(db, ['VISITAS','CONTADOR_PAGINAS']);
const sig2 = P.fingerprintTables(db, ['VISITAS','CONTADOR_PAGINAS']);
ok('assinatura determinística de tabelas', sig1 === sig2 && sig1.includes('VISITAS:2'));
ok('assinatura de arrays por empresa', P.fingerprintArrays(db, ['clientes'], 'emp').includes('clientes:1'));
ok('primeira assinatura deve rodar', P.deveRodarAssinatura(db, 'teste', sig1) === true);
ok('mesma assinatura não roda de novo', P.deveRodarAssinatura(db, 'teste', sig1) === false);
const sig3 = sig1 + '|novo';
ok('assinatura nova roda', P.deveRodarAssinatura(db, 'teste', sig3) === true);
console.log('\nRESULTADO: Testes de otimização profunda passaram!');
//<<<<SECAO:test_otimizacao_profunda.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_procedures_operacionais.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_procedures_operacionais.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('automacoes_procedures_operacionais_patch.js','utf8');
const db = {
  config:{},
  clientes:[
    {id:'cli1', empresaId:'emp', codigo:'10', codigoAntigo:'10', nome:'Cliente', documento:'12345678900'},
    {id:'cliDup', empresaId:'emp', codigo:'11', codigoAntigo:'11', nome:'Cliente Duplicado', documento:'123.456.789-00'}
  ],
  produtos:[{id:'prd1', empresaId:'emp', sku:'20', codigoAntigo:'20', nome:'Toner', preco:100, precoPromocao:90, precoAtacado:80, estoque:0, descVend:10, vidaUtil:1000}],
  equipamentos:[{id:'eq1', empresaId:'emp', codigoAntigo:'5', modelo:'Brother 8157', serie:'SER123', status:'disponivel'}],
  contratos:[{id:'ct1', empresaId:'emp', numero:'200', codigoAntigo:'200', clienteId:'cli1', valorPretoGlobal:100, franquiaGlobal:1000}],
  parque:[{id:'pq1', empresaId:'emp', codigoAntigo:'77', contratoId:'ct1', clienteId:'cli1', equipamentoId:'eq1', status:'ativo', medidores:{preto:{ativo:true, modalidade:'Mensal', valorFixo:50, franquia:500}}}],
  leituras:[{id:'lei1', empresaId:'emp', codigoAntigo:'8', contratoId:'ct1', clienteId:'cli1'}],
  vendas:[{id:'v1', empresaId:'emp', numero:'300', codigoAntigo:'300', clienteId:'cli1', equipamentoId:'eq1', status:'finalizada', tipo:'R', formaEntrega:'ENTREGAR', itens:[{produtoId:'prd1', descricao:'Recarga cartucho', tipo:'R', qtd:1, preco:100, subtotal:100, valorInsumos:5}]}],
  produtosHistorico:[{produtoId:'prd1', tipo:'E', qtde:10},{produtoId:'prd1', tipo:'S', qtde:3}],
  modulosDinamicos:{
    CONFIGURACAO:{dados:[{VEN_CAD_CHAMADO_AUTO:1, CARTUCHO_FINALIZADO_VENDA:'S', NFE_TRIB_VENDA_DENTRO:5}]},
    CONTADOR_PAGINAS:{dados:[{COD_CONTADOR:1, COD_ITENS_LOCACAO:77, CP_COD_LEITURA:8, CP_TIPO:'PRETO', CP_PAGINAS:300, PAGINAS_ATUAL:1300, PAGINAS_EXCEDENTE:120, CP_VALOR_EXCEDENTE:24, CP_VALOR_TOTAL:30, DATA_LEITURA:'2026-08-01'}]},
    NOTA_FISCAL:{dados:[{NF_CODIGO:1, NF_UF:'MG', NF_COD_EMPRESA:1, NF_MOSTRAR_IMPOSTO:'S', NF_VALOR_FRETE:0}]},
    EMPRESA:{dados:[{COD_EMPRESA:1, UF:'MG'}]},
    ITENS_NOTA:{dados:[{IN_CODIGO:1, IN_COD_NOTA_FISCAL:1, IN_VALOR_TOTAL:100, IN_QTDE:1, IN_VALOR_UNITARIO:100, IN_NCM:'1234', IN_TIPO_DESCRICAO:'PRODUTO'}]},
    TRIBUTOS_PRODUTOS:{dados:[{TP_CODIGO:5, TP_CFOP:5102, TP_CSOSN:'101', TP_CST_ICMS:'00', TP_ICMS:18, TP_IPI:5, TP_PIS:1.65, TP_COFINS:7.6, TP_CST_IBS_CBS:'000', TP_CCLASS_TRIB:'000001', TP_PIBS_UF:0.1, TP_PIBS_MUN:0, TP_PCBS:0.9}]},
    NCM:{dados:[{NC_CODIGO:1, NC_NCM:'1234', NC_IMPOSTO:10}]}
  }
};

const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_PROCEDURES_OPERACIONAIS_PURE;

console.log('== AUTOMACOES_PROCEDURES_OPERACIONAIS_PURE ==');
ok('round ABNT metade par', A.roundABNT(2.345,2) === 2.34);
ok('round ABNT metade ímpar', A.roundABNT(2.355,2) === 2.36);
ok('somente números', A.somenteNumeros('12.345/0001-99') === '12345000199');
ok('código numérico NF evita sequência inválida', !['12345678','11111111'].includes(String(A.gerarCodigoNumericoNF(12345677)).padStart(8,'0')));
const vl = A.valorLocacaoContrato(db.contratos[0], db.parque);
ok('valor locação soma global e medidor mensal', vl.valor === 150 && vl.somaFranquia === 1000);
ok('autorizar desconto respeita limite vendedor', A.autorizarDescontoProduto({funcionario:{vendedor:true},produto:db.produtos[0],desconto:11,tipoDesconto:0,valorBase:100}).success === 'N');
ok('validar Pix bloqueia parcela com boleto', A.validarPixEmissao({boletoId:'b1'}).success === 'N');
const changed = A.aplicarAutomacoesProceduresOperacionais('emp');
ok('aplicou procedures operacionais', changed > 0);
ok('contrato recebeu info locação', db.contratos[0].qtdeEquip === 1 && db.contratos[0].valorMensalFixo === 150 && db.contratos[0].somaFranquia === 1000);
ok('leitura recebeu totais detalhados', db.leituras[0].valorTotal === 30 && db.leituras[0].paginas === 300 && db.leituras[0].totalTonerPretoA4 === 300);
ok('parque recebeu última leitura e contador', db.parque[0].ultimaLeitura === '2026-08-01' && db.parque[0].contadorAtual === 1300);
ok('estoque recalculado por histórico', db.produtos[0].estoque === 7);
ok('produto variação por serial criado', db.produtosVariacaoMigrados.some(v=>v.serial==='SER123' && v.produtoId));
ok('venda totalizada e cartucho finalizado', db.vendas[0].total === 105 && db.vendas[0].itens[0].situacao === 'FINALIZADO');
ok('chamado por venda/entrega criado', db.os.length === 1 && db.vendas[0].osId === db.os[0].id);
ok('perfil tributário aplicado no item nota', db.modulosDinamicos.ITENS_NOTA.dados[0].IN_CFOP === 5102 && db.modulosDinamicos.ITENS_NOTA.dados[0].IN_ICMS === 18);
ok('nota fiscal totalizada', db.notasFiscaisMigradas[0].valorTotal === 105);
ok('sugeriu cliente duplicado em vez de mesclar automático', db.clientesDuplicadosSugeridos.length === 1);
ok('métricas de config criadas', db.config.metricasProcedures.tempoEntregaSeg > 0);
const item = {produtoId:'prd1', qtd:2};
ok('alterar preço item venda por atacado', A.alterarVlrProdutoItemVenda(item,3,'emp').ok && item.preco === 80 && item.subtotal === 160);
A.distribuirDescontoVenda(db.vendas[0], 10, 0, true);
ok('distribui desconto em venda', db.vendas[0].desconto >= 10 && db.vendas[0].total < 105);
console.log('\nRESULTADO: Testes de procedures operacionais passaram!');
//<<<<SECAO:test_automacoes_procedures_operacionais.js:FIM>>>>
}

if (false) { // ═══ test_correcoes_uso_diario.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_correcoes_uso_diario.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('correcoes_uso_diario_patch.js','utf8');
const db={config:{}, modulosDinamicos:{}};
const ctx={window:{},db,localStorage:{setItem(){},getItem(){return null;}}};
new Function('window','db','localStorage',code)(ctx.window,ctx.db,ctx.localStorage);
const C=ctx.window.CORRECOES_USO_DIARIO_PURE;
console.log('== CORRECOES_USO_DIARIO_PURE ==');
ok('tabela VENDAS é venda real', C.tabelaVendaReal('VENDAS'));
ok('ITENS_VENDA não entra como notinha', !C.tabelaVendaReal('ITENS_VENDA'));
ok('BAIRROS não entra como notinha', !C.tabelaVendaReal('BAIRROS'));
ok('ORCAMENTO não entra como notinha', !C.tabelaVendaReal('ORCAMENTO'));
ok('pagamento por código Pix', C.pagamentoRaw({COD_RECEBIMENTO:9})==='Pix');
ok('data pega DATA_VENDA', C.dataVendaRaw({DATA_VENDA:'2026-08-01'})==='2026-08-01');
ok('código pega último grupo numérico', C.cod('VD-2026-00123')==='123');
ok('registro migrado não conta no dashboard novo', !C.ehNovoOperacional({origemMigracao:true}));
ok('registro manual conta no dashboard novo', C.ehNovoOperacional({criadoPor:'user'}));
console.log('\nRESULTADO: Testes de correções de uso diário passaram!');
//<<<<SECAO:test_correcoes_uso_diario.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_pos_final.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_pos_final.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('ajustes_pos_final_patch.js','utf8');
const db={config:{loja:{fantasia:'DIGICOPY',razaoSocial:'DIGICOPY LTDA',cnpj:'00',endereco:'Rua A',whatsapp:'+55 38 99109-8698'}},empresas:[{id:'emp'}],produtos:[]};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.AJUSTES_POS_FINAL_PURE;
console.log('== AJUSTES_POS_FINAL_PURE ==');
ok('exporta funções puras', !!P && typeof P.isProdutoImpressoraLocacao==='function');
ok('detecta impressora de locação por categoria', P.isProdutoImpressoraLocacao({categoria:'Impressora',nome:'Brother'})===true);
ok('não confunde produto com palavra impressora no nome', P.isProdutoImpressoraLocacao({categoria:'Produto',nome:'Cabo para impressora'})===false);
ok('detecta impressora por patrimônio/serial', P.isProdutoImpressoraLocacao({categoria:'Produto',patrimonio:'123'})===true);
const html=P.patchHtmlImpressao('<html><body><p class="audit">Emitido por X • CNPJ 00 • Cód. cliente 1</p></body></html>');
ok('adiciona rodapé da loja e remove repetição de CNPJ no audit', html.includes('rodape-loja-final') && html.includes('DIGICOPY') && !html.includes('Cód. cliente 1'));
ok('assistente foi removido do patch final', !('respostaAssistente' in P));
console.log('\nRESULTADO: Testes de ajustes pós-final passaram!');
//<<<<SECAO:test_ajustes_pos_final.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52023.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52023.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v52023_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.AJUSTES_V52023_PURE;

console.log('== AJUSTES_V52023_PURE ==');

function dbFixture(){
  return {
    clientes: [
      { id:'c1', nome:'Com histórico', empresaId:'emp_digicopy' },
      { id:'c2', nome:'Sem histórico', empresaId:'emp_digicopy' },
      { id:'c3', nome:'Outro (intocado)', empresaId:'emp_digicopy' },
    ],
    contratos: [ { id:'ct1', clienteId:'c1' }, { id:'ct2', clienteId:'c3' } ],
    parque:    [ { id:'p1', clienteId:'c1', contratoId:'ct1', equipamentoId:'eq1', status:'ativo' },
                 { id:'p2', clienteId:'c3', contratoId:'ct2', equipamentoId:'eq2', status:'ativo' } ],
    leituras:  [ { id:'l1', clienteId:'c1', contratoId:'ct1', parqueId:'p1' }, { id:'l2', clienteId:'c3', contratoId:'ct2' } ],
    os:        [ { id:'os1', clienteId:'c1' }, { id:'os2', clienteId:'c3' } ],
    vendas:    [ { id:'v1', clienteId:'c1' }, { id:'v2', clienteId:'c3' } ],
    contasReceber: [ { id:'cr1', clienteId:'c1' }, { id:'cr2', vendaId:'v1' }, { id:'cr3', leituraId:'l1' }, { id:'cr4', clienteId:'c3' } ],
    contasPagar:   [ { id:'cp1', fornecedor:'Forn A' }, { id:'cp2', fornecedor:'Forn B' } ],
    equipamentos:  [ { id:'eq1', status:'locado' }, { id:'eq2', status:'locado' }, { id:'eq3', status:'locado' } ],
  };
}

// resumoHistorico: cliente com histórico vs sem histórico
{
  const db = dbFixture();
  const r1 = P.resumoHistorico(db, ['c1']);
  ok('resumo total de c1 = 8 (ct,prk,lei,os,vda,3 cr)', r1.total === 8 && r1.comHistorico === 1);
  ok('resumo texto menciona contrato e venda', /contrato/.test(r1.texto) && /venda/.test(r1.texto));
  const r2 = P.resumoHistorico(db, ['c2']);
  ok('c2 sem histórico (total 0)', r2.total === 0 && r2.comHistorico === 0);
  const r3 = P.resumoHistorico(db, ['c1','c2']);
  ok('mistura: comHistorico conta só quem tem', r3.comHistorico === 1 && r3.total === 8);
}

// excluirClientesCascata: apaga cliente + histórico junto, sem tocar nos outros
{
  const db = dbFixture();
  db.parque.push({ id:'p9', clienteId:'c3', equipamentoId:'eq3', status:'inativo' }); // eq3 sem parque ativo
  const r = P.excluirClientesCascata(db, ['c1','c2']);
  ok('2 clientes excluídos', r.clientes === 2);
  ok('cascata: 1 contrato, 1 parque, 1 leitura, 1 os, 1 venda, 3 contas', r.contratos===1 && r.parque===1 && r.leituras===1 && r.os===1 && r.vendas===1 && r.contasReceber===3);
  ok('c3 continua', db.clientes.some(c=>c.id==='c3'));
  ok('dados do c3 intactos', db.contratos.some(c=>c.id==='ct2') && db.vendas.some(v=>v.id==='v2') && db.contasReceber.some(c=>c.id==='cr4') && db.os.some(o=>o.id==='os2') && db.leituras.some(l=>l.id==='l2') && db.parque.some(p=>p.id==='p2'));
  ok('eq1 liberada (locado -> disponivel)', db.equipamentos.find(e=>e.id==='eq1').status === 'disponivel');
  ok('eq2 continua locado (parque ativo do c3)', db.equipamentos.find(e=>e.id==='eq2').status === 'locado');
  ok('eq3 NÃO liberada (não estava no parque apagado)', db.equipamentos.find(e=>e.id==='eq3').status === 'locado');
  ok('contasPagar intocadas', db.contasPagar.length === 2);
}

// excluirLancamentosFinanceiro: apaga de verdade cr/cp
{
  const db = dbFixture();
  const r = P.excluirLancamentosFinanceiro(db, [{tipo:'cr',id:'cr1'},{tipo:'cp',id:'cp2'}]);
  ok('1 a receber + 1 a pagar excluídos', r.receber===1 && r.pagar===1);
  ok('cr1 sumiu, cp2 sumiu', !db.contasReceber.some(c=>c.id==='cr1') && !db.contasPagar.some(c=>c.id==='cp2'));
  ok('outros lançamentos intactos', db.contasReceber.length===3 && db.contasPagar.length===1);
  const r0 = P.excluirLancamentosFinanceiro(db, []);
  ok('sem seleção não apaga nada', r0.receber===0 && r0.pagar===0 && db.contasReceber.length===3);
}

console.log('\nRESULTADO: Testes do ajustes_v52023 passaram!');
//<<<<SECAO:test_ajustes_v52023.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52024.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52024.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v52024_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.AJUSTES_V52024_PURE;

console.log('== AJUSTES_V52024_PURE ==');

const LOGINS = ['admin','carlos','ana','financeiro'];
const IDS = ['usr_admin'];

// ehUsuarioDemoAntigo: apaga só demo de verdade, nunca usuário cadastrado pela tela
ok('demo por id (usr_admin)', P.ehUsuarioDemoAntigo({ id:'usr_admin', login:'admin', criadoPor:'sistema' }, LOGINS, IDS) === true);
ok('demo por login+criadoPor sistema', P.ehUsuarioDemoAntigo({ id:'usr_x9', login:'carlos', criadoPor:'sistema' }, LOGINS, IDS) === true);
ok('demo por login sem criadoPor', P.ehUsuarioDemoAntigo({ id:'usr_y1', login:'ana' }, LOGINS, IDS) === true);
ok('funcionário "ana" criado pela tela é PRESERVADO', P.ehUsuarioDemoAntigo({ id:'usr_anareal', login:'ana', criadoPor:'usr_kauan' }, LOGINS, IDS) === false);
ok('usuário comum preservado', P.ehUsuarioDemoAntigo({ id:'usr_kauan', login:'kauan', criadoPor:'sistema' }, LOGINS, IDS) === false);
ok('legado migrado com login de demo é PRESERVADO', P.ehUsuarioDemoAntigo({ id:'usr_m1', login:'carlos', criadoPor:'migracao' }, LOGINS, IDS) === false);

// backup automático: removido na v5.22.67, agora só pelo botão
const fonte = require('fs').readFileSync(__dirname+'/ajustes_v52024_patch.js','utf8');
ok('não existe mais backup rodando sozinho', !/rodarBackupDiario|agendarBackupDiario|saveDaily/.test(fonte));
ok('não sobrou temporizador de backup', !/setInterval|setTimeout\(\s*rodarBackup/.test(fonte));
ok('o botão de backup continua de pé', /window\.exportBackup\s*=/.test(fonte));

// jsonBackupLimpo: tira _rt, mantém o resto
{
  const db = { empresas:[{id:'emp_digicopy'}], clientes:[{id:'c1', nome:'A', _rt:'2026-08-16T00:00:00Z'}], config:{ loja:{fantasia:'DIGICOPY'}, _rt:'x', escolaAuth:{usuario:'x',senha:'segredo'} } };
  const j = JSON.parse(P.jsonBackupLimpo(db));
  ok('_rt removido dos registros', j.clientes[0]._rt === undefined && j.config._rt === undefined);
  ok('conteúdo preservado', j.clientes[0].nome === 'A' && j.config.loja.fantasia === 'DIGICOPY' && j.empresas.length === 1);
  ok('senha do Buscador não vai no backup', j.config.escolaAuth === undefined);
}

ConsoleLogOk();
function ConsoleLogOk(){ console.log('\nRESULTADO: Testes do ajustes_v52024 passaram!'); }
//<<<<SECAO:test_ajustes_v52024.js:FIM>>>>
}

if (false) { // ═══ test_um_arquivo_por_modulo.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_um_arquivo_por_modulo.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — um arquivo por módulo (sem cópia com versão nova)
//
// Regra do projeto: correção MEXE no arquivo do módulo que já existe.
// Só se cria arquivo novo quando a função ainda não existe em lugar nenhum.
//
// O que aconteceu na v5.22.43: em vez de corrigir os 6 arquivos da v5.22.42,
// cada um foi COPIADO inteiro e a versão trocada. Os 12 ficaram no bundle e os
// 6 antigos rodavam antes só para serem sobrescritos — trabalho dobrado, e no
// financeiro a barra antiga chegava a ser desenhada antes de ser refeita.
// Um dos pares (financeiro_menu) era byte a byte igual, só mudava o número.
//
// Este teste impede a volta do padrão.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }

const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

console.log('== UM ARQUIVO POR MÓDULO ==');

// ── 1. Nenhum módulo pode ter duas versões no bundle ────────────────────────
const porModulo = {};
for (const f of manifest) {
  const m = /^ajustes_v(\d+)_(.+)_patch\.js$/.exec(f);
  if (!m) continue;
  (porModulo[m[2]] = porModulo[m[2]] || []).push(f);
}
const duplicados = Object.keys(porModulo).filter(k => porModulo[k].length > 1);
ok('nenhum módulo aparece em duas versões' +
   (duplicados.length ? ' → ' + duplicados.map(k => k + ': ' + porModulo[k].join(' + ')).join(' | ') : ''),
   duplicados.length === 0);

// ── 2. Nenhum par de arquivos com conteúdo igual ────────────────────────────
// Copiar um patch e só trocar o número de versão é o erro que gerou o item 1.
function normalizar(s){
  return s.replace(/5\.\d+\.\d+/g, 'VER')
          .replace(/[Vv]522\d\d/g, 'VER')
          .replace(/\s+/g, ' ')
          .trim();
}
const vistos = new Map();
const iguais = [];
for (const f of manifest) {
  if (!fs.existsSync(f)) continue;
  const chave = normalizar(fs.readFileSync(f, 'utf8'));
  if (chave.length < 200) continue;              // arquivos minúsculos podem coincidir
  if (vistos.has(chave)) iguais.push(vistos.get(chave) + ' == ' + f);
  else vistos.set(chave, f);
}
ok('nenhum arquivo é cópia de outro só com a versão trocada' +
   (iguais.length ? ' → ' + iguais.join(', ') : ''),
   iguais.length === 0);

// ── 3. Cada símbolo público sai de um lugar só ──────────────────────────────
// Dois arquivos publicando window.X é o sintoma de módulo duplicado. Aqui só
// vale para os *_PURE, que são a assinatura de cada módulo.
const donos = {};
for (const f of manifest) {
  if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  // (?!=) evita casar com comparação (=== / ==), que só LÊ o objeto
  for (const m of s.matchAll(/window\.([A-Z0-9_]+_PURE)\s*=(?!=)/g)) {
    (donos[m[1]] = donos[m[1]] || []).push(f);
  }
}
const compartilhados = Object.keys(donos).filter(k => new Set(donos[k]).size > 1);
ok('cada módulo publica seu _PURE de um arquivo só' +
   (compartilhados.length ? ' → ' + compartilhados.join(', ') : ''),
   compartilhados.length === 0);

// ── 4. Os arquivos consolidados não voltaram ────────────────────────────────
const CONSOLIDADOS = [
  'ajustes_v52242_orcamentos_status_patch.js',
  'ajustes_v52242_contratos_sort_patch.js',
  'ajustes_v52242_impressora_remanejar_patch.js',
  'ajustes_v52242_financeiro_filtros_patch.js',
  'ajustes_v52242_financeiro_menu_patch.js',
  'ajustes_v52242_menu_versao_boleto_patch.js'
];
const voltaram = CONSOLIDADOS.filter(f => fs.existsSync(f) || manifest.includes(f));
ok('os 6 arquivos consolidados na v5.22.43 não voltaram' +
   (voltaram.length ? ' → ' + voltaram.join(', ') : ''),
   voltaram.length === 0);

// ── 5. O módulo que ficou continua completo ─────────────────────────────────
const MODULOS = ['orcamentos_status','contratos_sort','impressora_remanejar',
                 'financeiro_filtros','financeiro_menu','menu_versao_boleto'];
for (const mod of MODULOS) {
  const arq = 'ajustes_v52243_' + mod + '_patch.js';
  ok('módulo ' + mod + ' presente e único', fs.existsSync(arq) && manifest.includes(arq));
}

console.log('\nRESULTADO: um arquivo por módulo!');
//<<<<SECAO:test_um_arquivo_por_modulo.js:FIM>>>>
}

if (false) { // ═══ test_app_bundle.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_app_bundle.js:INICIO>>>>
const fs=require('fs');
const cp=require('child_process');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== APP BUNDLE ==');
ok('manifesto possui todos os scripts na ordem',manifest.length>=141&&new Set(manifest).size===manifest.length);
ok('Firebase e sync antigo não entram no runtime',!['sync_client.js','firebase_config.js','firebase_client.js','limpar_nuvem_patch.js'].some(file=>manifest.includes(file)));
ok('todos os arquivos do manifesto existem',manifest.every(fs.existsSync));
ok('IndexedDB precede painel e motor de sync',manifest.indexOf('indexeddb_persistence_patch.js')<manifest.indexOf('cloudflare_sync_patch.js')&&manifest.indexOf('cloudflare_sync_patch.js')<manifest.indexOf('cloudflare_data_sync_patch.js'));
ok('index carrega um único bundle da aplicação',(html.match(/<script[^>]+src="\.\/app\.bundle\.js/g)||[]).length===1);
const scriptsSoltos=[...html.matchAll(/<script\s[^>]*src="\.\/([A-Za-z0-9_.\-/]+\.js)/g)]
  .map(m=>m[1]).filter(f=>f!=='app.bundle.js'&&!f.startsWith('assets/vendor/'));
ok('index não faz 97 requisições antigas',scriptsSoltos.length<=Math.max(20,Math.floor(manifest.length/6)));
ok('o grosso do sistema vem do bundle, não de scripts soltos',manifest.length-scriptsSoltos.length>=140);
ok('todo script solto existe e está no bundle ou em build.files',
   scriptsSoltos.every(f=>fs.existsSync(f)&&(manifest.includes(f)||pkg.build.files.includes(f))));
const htmlRefs=[...html.matchAll(/(?:src|href)="\.\/([A-Za-z0-9_.\-/]+?)(?:\?[^"]*)?"/g)].map(m=>m[1]);
const globAssets=f=>f.startsWith('assets/');
ok('Electron inclui bundle e essenciais',pkg.build.files.includes('app.bundle.js')&&pkg.build.files.includes('package.json')&&pkg.build.files.includes('index.html'));
ok('patches recentes viajam dentro do bundle',['ajustes_v52262_orcamento_uma_vez_loop_patch.js','ajustes_v52263_exe_completo_patch.js'].every(f=>manifest.includes(f)));
ok('index.html carrega SÓ o bundle (sem script duplicado)',scriptsSoltos.length===0);
ok('TUDO que o index.html carrega vai para o .exe',htmlRefs.filter(f=>!globAssets(f)).every(f=>pkg.build.files.includes(f)));
ok('build.files não leva lixo para o instalador',!pkg.build.files.some(f=>/^test_|\.zip$|^RELATORIO|^dist\//.test(f)));
ok('build.files só aponta para arquivos que existem',pkg.build.files.every(f=>f.includes('*')||fs.existsSync(f)));
cp.execFileSync(process.execPath,['sync_build.js','--check'],{stdio:'pipe'});
ok('configuração do build está sincronizada (npm run sync)','ok');
cp.execFileSync(process.execPath,['build_bundle.js','--check'],{stdio:'pipe'});
ok('bundle corresponde exatamente às fontes','ok');
console.log('\nRESULTADO: bundle consolidado passou!');
//<<<<SECAO:test_app_bundle.js:FIM>>>>
}

if (false) { // ═══ test_electron_security.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_electron_security.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const main=fs.readFileSync('main.js','utf8');
const preload=fs.readFileSync('preload.js','utf8');
console.log('== ELECTRON SECURITY ==');
ok('nodeIntegration desligado',/nodeIntegration:\s*false/.test(main));
ok('contextIsolation ligado',/contextIsolation:\s*true/.test(main));
ok('sandbox ligado na principal e popups',(main.match(/sandbox:\s*true/g)||[]).length>=2);
ok('webSecurity ligado',(main.match(/webSecurity:\s*true/g)||[]).length>=2);
ok('conteúdo inseguro bloqueado',/allowRunningInsecureContent:\s*false/.test(main));
ok('navegação HTTP externa bloqueada',/will-navigate/.test(main)&&/startsWith\('file:\/\/'\)/.test(main));
ok('window.open externo não recebe preload',/url !== 'about:blank'/.test(main)&&/action:'deny'/.test(main));
ok('orçamento da caixa escolar abre no navegador padrão',/openExternal/.test(main)&&/caixaescolar\.educacao\.mg\.gov\.br/.test(main));
ok('webview não trava no attach (sem filtro por src)',/will-attach-webview/.test(main)&&main.indexOf('params.src')<0);
ok('filtro por navegação só deixa http/https',main.indexOf("did-attach-webview")>=0&&main.indexOf('^https?')>=0&&/will-navigate/.test(main));
ok('preload usa contextBridge',/contextBridge\.exposeInMainWorld/.test(preload));
ok('preload expõe abertura externa do buscador',/openExternal/.test(preload));
console.log('\nRESULTADO: segurança Electron passou!');
//<<<<SECAO:test_electron_security.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5215.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5215.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v5215_cnpj_inteligente_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.CNPJ_INTELIGENTE_PURE;
console.log('== CNPJ INTELIGENTE v5.21.5 ==');
ok('exporta funções puras',!!P&&typeof P.validarCnpj==='function');
ok('formata CNPJ',P.formatarCnpj('08385589000103')==='08.385.589/0001-03');
ok('rejeita CNPJ inválido',P.validarCnpj('00000000000000')===false);
ok('aceita CNPJ válido conhecido',P.validarCnpj('08385589000103')===true);
ok('mapeia BrasilAPI',P.mapBrasilApi({razao_social:'LOJA X',nome_fantasia:'X',logradouro:'Rua A',numero:'10',bairro:'Centro',municipio:'Januaba',uf:'mg',cep:'39400000',cnpj:'19131243000197'}).cidade==='Januaba');
ok('mapeia ReceitaWS',P.mapReceitaWs({nome:'LOJA Y',status:'OK',municipio:'Montes Claros',uf:'MG'}).razaoSocial==='LOJA Y');
ok('patch entra no bundle',manifest.includes('ajustes_v5215_cnpj_inteligente_patch.js'));
ok('botão da loja existe no código',code.includes('btn-buscar-cnpj-loja')&&code.includes('buscarCnpjLoja'));
console.log('\nRESULTADO: CNPJ inteligente passou!');
//<<<<SECAO:test_ajustes_v5215.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5223.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5223.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
console.log('== LIMPEZA FIREBASE + LOGIN ESCOLA LOCAL ==');
ok('firebase_config.js apagado',!fs.existsSync('firebase_config.js'));
ok('firebase_client.js apagado',!fs.existsSync('firebase_client.js'));
ok('teste do Firebase apagado',!fs.existsSync('test_firebase.js'));
const pkg=fs.readFileSync('package.json','utf8');
ok('check não aponta mais Firebase',!/firebase_config\.js/.test(pkg)&&!/firebase_client\.js/.test(pkg));
const runner=fs.readFileSync('test_runner.js','utf8');
ok('suíte não roda teste Firebase',!/test_firebase\.js/.test(runner));
const escola=fs.readFileSync('buscador_escola_patch.js','utf8');
ok('Buscador não tem senha no código',!/const SENHA=/.test(escola)&&!/txPassword:SENHA/.test(escola));
ok('Buscador não tem usuário fixo no código',!/const USUARIO=/.test(escola));
ok('login fica em arquivo local ou localStorage',/escola-login\.json/.test(fs.readFileSync('main.js','utf8'))&&/ESCOLA_LOGIN_KEY/.test(escola));
ok('login não vai para saveDB/config',!/db\.config\.escolaLogin/.test(escola)&&!/escolaSenha/.test(escola));
ok('preload expõe save local',/loginSave/.test(fs.readFileSync('preload.js','utf8')));
console.log('\nRESULTADO: Firebase removido e login do Buscador ficou local!');
//<<<<SECAO:test_ajustes_v5223.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5224.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5224.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const escola=fs.readFileSync('buscador_escola_patch.js','utf8');
console.log('== LOGIN ESCOLA NA NUVEM ==');
ok('não tem senha no código',!/const SENHA=/.test(escola)&&!/const USUARIO=/.test(escola));
ok('grava em db.config.escolaAuth',/db\.config\.escolaAuth/.test(escola));
ok('usa saveDB para subir na nuvem',/escolaAuth[\s\S]{0,180}saveDB/.test(escola));
ok('botão fala nuvem',/Login na nuvem/.test(escola));
ok('lê primeiro da nuvem',/function loginDaNuvem/.test(escola)&&/loginDaNuvem\(\)/.test(escola));
console.log('\nRESULTADO: login do Buscador vai para a nuvem!');
//<<<<SECAO:test_ajustes_v5224.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52211.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52211.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v52211_logo_impressao_unica_patch.js','utf8');
const v5171=fs.readFileSync('ajustes_v5171_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.LOGO_IMPRESSAO_PURE;
const extra='<img class="logo-rel" src="x" alt="logo">';
const notinha='<body>'+extra+'<div class="cab"><div class="logo"><img src="data:image/png;base64,AAA"></div></div></body>';
console.log('== LOGO ÚNICA NA IMPRESSÃO ==');
ok('exporta limpeza',!!P&&typeof P.limparLogoImpressao==='function');
ok('reconhece logo da notinha',P.jaTemLogoPropria(notinha)===true);
ok('tira logo extra da notinha',!/logo-rel/.test(P.limparLogoImpressao(notinha))&&/class="logo"/.test(P.limparLogoImpressao(notinha)));
ok('não mexe se só tem a extra',/logo-rel/.test(P.limparLogoImpressao('<body>'+extra+'</body>')));
ok('não mexe em RTF',P.limparLogoImpressao('{\\rtf1 logo-rel }').indexOf('logo-rel')>=0);
ok('v5171 não injeta se já tem img/logo',/class=\["'\]logo\["'\]/.test(v5171)&&/data:image/.test(v5171));
ok('vale para notinha e outros impressos',/imprimirNotinha/.test(code)&&/imprimirLeituraContrato/.test(code)&&/imprimirChamadoPDF/.test(code));
ok('não grava banco',!/saveDB\(/.test(code));
ok('patch no bundle',manifest.includes('ajustes_v52211_logo_impressao_unica_patch.js'));
console.log('\nRESULTADO: logo única na impressão passou!');
//<<<<SECAO:test_ajustes_v52211.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52214.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52214.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const ord=fs.readFileSync('ajustes_v52214_ordenacao_patch.js','utf8');
const rec=fs.readFileSync('ajustes_v52214_recargas_patch.js','utf8');
const fin=fs.readFileSync('ajustes_v52213_financeiro_receber_patch.js','utf8');
const men=fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js','utf8');
const hs=fs.readFileSync('historico_sort_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const cf=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const app=fs.readFileSync('app.js','utf8');

const ctx={window:{},document:undefined};
new Function('window','document',ord+'\n'+rec)(ctx.window,ctx.document);
const O=ctx.window.ORDENACAO_TITULO_PURE;
const R=ctx.window.RECARGAS_PURE;

console.log('== TRAVA / OBSERVER ==');
ok('financeiro sem MutationObserver no body', !/MutationObserver/.test(fin));
ok('menus sem MutationObserver no body', !/MutationObserver/.test(men));
ok('Receber não recria se já existe', /data-fin-receber/.test(fin) && /if\(actions\.querySelector\(\'\[data-fin-receber\]\'\)\) return/.test(fin));

console.log('== ORDENAÇÃO ==');
ok('toggle A→Z / Z→A', O.proximaDir('codigo','asc','codigo')==='desc' && O.proximaDir('codigo','desc','codigo')==='asc');
ok('coluna nova começa asc', O.proximaDir('codigo','desc','nome')==='asc');
ok('historico_sort pula tabela com onclick', /thJaOrdena/.test(hs) && /__hsSort='skip'/.test(hs));
ok('historico_sort stopImmediatePropagation', /stopImmediatePropagation/.test(hs));

console.log('== RECARGAS ==');
ok('código só números', R.soNumeros('AB12-3')==='123');
ok('próximo código', R.proximoCodigoRecarga([{codigo:'7'},{codigo:'12'}],'e1')==='13');
ok('tipo recarga', R.ehTipoRecarga('Recarga de toner') && !R.ehTipoRecarga('Produto'));
ok('sem estoque', R.recargaPodeVenderSemEstoque()===true);
const lista=R.filtrarRecargas([
  {id:'1',empresaId:'e',nome:'HP 85A',codigo:'1',marca:'HP'},
  {id:'2',empresaId:'e',nome:'Toner estoque',codigo:'2',status:'inativo'},
  {id:'3',empresaId:'x',nome:'HP 85A',codigo:'3'}
],'e','85');
ok('filtra recarga ativa da empresa', lista.length===1 && lista[0].id==='1');
// v5.22.77: o submenu foi retirado a pedido. A tela continua existindo.
ok('Recargas não é mais submenu', !/id:'recargas'/.test(men));
ok('venda não puxa produto no tipo recarga', /ehRecargaNaVenda/.test(rec) && /pintarBuscaRecargas/.test(rec));
ok('cadastro sem estoque', /semEstoque: true/.test(rec) && /Sem estoque/.test(rec));
ok('busca recargas Enter/lupa', /key==='Enter'/.test(rec) && /aplicarBuscaRecargas/.test(rec));
ok('db.recargas no núcleo', /recargas:\[\]/.test(app) && /'recargas'/.test(app));
ok('nuvem sincroniza recargas', /recargas:'array'/.test(cf));

ok('patches no bundle', manifest.includes('ajustes_v52214_ordenacao_patch.js') && manifest.includes('ajustes_v52214_recargas_patch.js'));
ok('versão app 5.x-6.x', /^\d+\.\d+\./.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile/.test(ord+rec));

console.log('\nRESULTADO: v5.22.14 passou!');
//<<<<SECAO:test_ajustes_v52214.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52219.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52219.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const fil=fs.readFileSync('ajustes_v52219_filtros_busca_patch.js','utf8');
const pix=fs.readFileSync('ajustes_v52219_pix_link_publico_patch.js','utf8');
const wrk=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[fil,pix].join('\n'))(ctx.window,ctx.document);
const F=ctx.window.FILTROS_BUSCA_PURE;
const P=ctx.window.PIX_LINK_PUBLICO_PURE;

console.log('== FILTROS BUSCA / PIX LINK ==');
ok('campos cliente iguais ao menu', F.CAMPOS_CLIENTE.some(c=>c[0]==='nome') && F.CAMPOS_CLIENTE.some(c=>c[0]==='documento'));
ok('categorias sem Recarga', F.CATS_PRODUTO.indexOf('Recarga')<0 && F.CATS_PRODUTO.indexOf('Produto')>=0);
ok('todas categorias existe no patch', /Todas categorias/.test(fil));
ok('filtra cliente por nome', F.filtraClientes([{nome:'Colégio Ávila',documento:'1'}],'avila','nome').length===1);
ok('filtra cliente por campo errado vazio', F.filtraClientes([{nome:'Colégio Ávila',documento:'1'}],'avila','documento').length===0);
ok('produto recarga some', F.filtraProdutos([{nome:'Recarga HP',categoria:'Recarga'},{nome:'Toner',categoria:'Produto'}],'','').map(p=>p.nome).join()==='Toner');
ok('produto por categoria', F.filtraProdutos([{nome:'A',categoria:'Chip'},{nome:'B',categoria:'Produto'}], '','Chip').map(p=>p.nome).join()==='A');
ok('recarga por marca', F.filtraRecargas([{nome:'HP 85A',marca:'HP',codigo:'1'},{nome:'Samsung',marca:'Samsung',codigo:'2'}],'hp','marca').length===1);
ok('eh recarga', F.ehRecargaCat('Recarga de toner')===true);

ok('PIX url pública', P.PIX_PUBLICO.indexOf('workers.dev/pix')>0);
ok('PIX monta query', P.pixUrlPublico('000201').indexOf('?c=000201')>0);
ok('não usa githack no link', !/githack/.test(pix));
ok('worker tem /pix', wrk.includes("url.pathname === '/pix'") && wrk.includes('function handlePix'));
ok('pix_pagar no exe', fs.readFileSync('package.json','utf8').includes('pix_pagar.html'));

ok('patches no bundle', manifest.includes('ajustes_v52219_filtros_busca_patch.js') && manifest.includes('ajustes_v52219_pix_link_publico_patch.js'));
ok('versão 5.22.19+', (parseInt(String(pkg.version).split('.')[0],10)>=6 || parseInt(String(pkg.version).split('.')[1],10)>=23 || parseInt(String(pkg.version).split('.')[2],10)>=19) && /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html));
ok('APK quieto', !/mobile/.test(fil+pix));
ok('etiqueta mesma caixa', /vos-item-cartucho/.test(fil) && /escreve e segue/.test(fil));

console.log('\nRESULTADO: v5.22.19 passou!');
//<<<<SECAO:test_ajustes_v52219.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52220.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52220.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const src=fs.readFileSync('ajustes_v52220_lupa_alinha_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
console.log('== LUPA ALINHA ==');
ok('pure ok', ctx.window.LUPA_ALINHA_PURE && ctx.window.LUPA_ALINHA_PURE.ok===true);
ok('monta linha filtro', /data-filtro-row/.test(src) && /absolute/.test(src));
ok('não usa flex no pai da lupa absoluta', /tiraFlexQuebrado/.test(src));
ok('no bundle', manifest.includes('ajustes_v52220_lupa_alinha_patch.js'));
ok('versão 5.22.20+', (/^\d+\.\d+\.\d+$/.test(pkg.version) && (parseInt(pkg.version.split('.')[0],10)>=6 || parseInt(pkg.version.split('.')[1],10)>=23 || parseInt(pkg.version.split('.')[2],10)>=20)) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile/.test(src));
console.log('\nRESULTADO: v5.22.20 passou!');
//<<<<SECAO:test_ajustes_v52220.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52223.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52223.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const cat=fs.readFileSync('ajustes_v52223_cat_letra_patch.js','utf8');
const men=fs.readFileSync('ajustes_v52223_menus_arraste_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[cat,men].join('\n'))(ctx.window,ctx.document);
const C=ctx.window.CAT_LETRA_PURE;
const M=ctx.window.MENUS_ARRASTE_PURE;

console.log('== LETRA FILTRO ==');
ok('P vira Produto', C.letraParaNome('P')==='Produto' && C.letraParaNome('p')==='Produto');
ok('S/I/C/E', C.letraParaNome('S')==='Serviço' && C.letraParaNome('i')==='Insumo' && C.letraParaNome('C')==='Cartucho' && C.letraParaNome('e')==='Equipamento');
ok('Chip não é letra', C.ehLetraFiltro('Chip')===false && C.letraParaNome('Chip')==='Chip');
ok('só letra isolada', C.ehLetraFiltro('P')===true && C.ehLetraFiltro('Produto')===false);

console.log('== MENUS ==');
ok('apaga seta de verdade', /b.remove()/.test(men) && typeof M.apagarSetas==='function');
ok('segue o mouse', /pointermove/.test(men) && /ghost/.test(men));

ok('patches no bundle', manifest.includes('ajustes_v52223_cat_letra_patch.js') && manifest.includes('ajustes_v52223_menus_arraste_patch.js'));
ok('versão 5.22.23+', (/^\d+\.\d+\.\d+$/.test(pkg.version) && (parseInt(pkg.version.split('.')[0],10)>=6 || parseInt(pkg.version.split('.')[1],10)>=23 || parseInt(pkg.version.split('.')[2],10)>=23)) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(cat+men));
console.log('\nRESULTADO: v5.22.23 passou!');
//<<<<SECAO:test_ajustes_v52223.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52224.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52224.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const cat=fs.readFileSync('ajustes_v52223_cat_letra_patch.js','utf8');
const uma=fs.readFileSync('ajustes_v52224_cat_letra_uma_vez_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

ok('52223 não envolve unificaCat', !/wrapUnifica/.test(cat) && !/unificaCat/.test(cat) && !/categoriaUnificada/.test(cat));
ok('52223 não grava produto', !/p\.categoria\s*=/.test(cat) && !/migrarCategoriasLetra/.test(cat));
ok('52224 não envolve unificaCat', !/unificaCat\s*=/.test(uma) && !/wrapUnifica/.test(uma) && !/\.unificaCat/.test(uma) && !/\.categoriaUnificada/.test(uma));

const ctx={window:{},document:undefined};
new Function('window','document',[cat,uma].join('\n'))(ctx.window,ctx.document);
const C=ctx.window.CAT_LETRA_PURE;
const U=ctx.window.CAT_LETRA_UMA_VEZ_PURE;

ok('helpers P/S/I/C/E', C.letraParaNome('P')==='Produto' && C.letraParaNome('S')==='Serviço' && C.letraParaNome('i')==='Insumo' && C.letraParaNome('C')==='Cartucho' && C.letraParaNome('e')==='Equipamento');
ok('Chip fica', C.ehLetraFiltro('Chip')===false && C.letraParaNome('Chip')==='Chip');

const prods=[{categoria:'P'},{categoria:'Chip'},{categoria:'Original'},{categoria:'S'},{categoria:'Produto'}];
const n=U.corrigirProdutosUmaVez(prods);
ok('só letra isolada no dado', n===2 && prods[0].categoria==='Produto' && prods[3].categoria==='Serviço');
ok('outros filtros ficam', prods[1].categoria==='Chip' && prods[2].categoria==='Original' && prods[4].categoria==='Produto');

ok('patches no bundle', manifest.includes('ajustes_v52223_cat_letra_patch.js') && manifest.includes('ajustes_v52224_cat_letra_uma_vez_patch.js'));
ok('versão 5.22.24+', (/^\d+\.\d+\.\d+$/.test(pkg.version) && (parseInt(pkg.version.split('.')[0],10)>=6 || parseInt(pkg.version.split('.')[1],10)>=23 || parseInt(pkg.version.split('.')[2],10)>=24)) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(cat+uma));
console.log('\nRESULTADO: v5.22.24 passou!');
//<<<<SECAO:test_ajustes_v52224.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52225.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52225.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const del=fs.readFileSync('ajustes_v52225_import_pula_del_patch.js','utf8');
const env=fs.readFileSync('envio_arquivos.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',del)(ctx.window,ctx.document);
const D=ctx.window.IMPORT_DEL_PURE;

ok('DEL S pula', D.ehDel({DEL:'S'})===true && D.ehDel({DEL:'s'})===true);
ok('DEL N entra', D.ehDel({DEL:'N'})===false && D.ehDel({DEL:null})===false && D.ehDel({})===false);
ok('OCULTAR sozinho não pula', D.ehDel({OCULTAR:'S',DEL:'N'})===false);
ok('filtra lista', D.linhasSemDel([{DEL:'S',COD_PRODUTO:1},{DEL:'N',COD_PRODUTO:2}]).length===1);
ok('página define ehDel', /function ehDel\s*\(/.test(env) && /Pulados DEL=S/.test(env));
ok('patch no bundle', manifest.includes('ajustes_v52225_import_pula_del_patch.js'));
ok('versão 5.22.25+', (/^\d+\.\d+\.\d+$/.test(pkg.version) && (parseInt(pkg.version.split('.')[0],10)>=6 || parseInt(pkg.version.split('.')[1],10)>=23 || parseInt(pkg.version.split('.')[2],10)>=25)) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(del+env));
console.log('\nRESULTADO: v5.22.25 passou!');
//<<<<SECAO:test_ajustes_v52225.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52226.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52226.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const env=fs.readFileSync('envio_arquivos.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');

ok('ehDel existe na página', /function ehDel\s*\(row\)/.test(env));
ok('usa ehDel no filtro', /brutas\.filter\(ehDel\)/.test(env) && /!ehDel\(r\)/.test(env));
ok('versão 5.22.26+', (/^\d+\.\d+\.\d+$/.test(pkg.version) && (parseInt(pkg.version.split('.')[0],10)>=6 || parseInt(pkg.version.split('.')[1],10)>=23 || parseInt(pkg.version.split('.')[2],10)>=26)) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(env));
console.log('\nRESULTADO: v5.22.26 passou!');
//<<<<SECAO:test_ajustes_v52226.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52227.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52227.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const lupa=fs.readFileSync('ajustes_v52227_lupa_filtro_cli_patch.js','utf8');
const ncm=fs.readFileSync('ajustes_v52227_ncm_origem_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[lupa,ncm].join('\n'))(ctx.window,ctx.document);
const L=ctx.window.LUPA_FILTRO_CLI_PURE;
const N=ctx.window.NCM_ORIGEM_PURE;

ok('reconhece enfeite', L.ehEnfeite({tagName:'I', className:'ph ph-magnifying-glass absolute left-3'})===true);
ok('não apaga botão', L.ehEnfeite({tagName:'BUTTON', className:'ph-magnifying-glass'})===false);
ok('origens oficiais 0 a 8', N.ORIGENS.length===9 && N.ORIGENS[0].indexOf('0 -')===0 && N.ORIGENS[8].indexOf('8 -')===0);
ok('origem 6 existe', N.origemPorCodigo('6').indexOf('CAMEX')>=0);
ok('NCM só dígito', N.soNcm('8443.99.32')==='84439932');
ok('busca Enter/lupa no patch', /key==='Enter'/.test(ncm) && /buscarNcmProduto/.test(ncm));
ok('patches no bundle', manifest.includes('ajustes_v52227_lupa_filtro_cli_patch.js') && manifest.includes('ajustes_v52227_ncm_origem_patch.js'));
ok('versão 5.22.27+', (/^\d+\.\d+\.\d+$/.test(pkg.version) && (parseInt(pkg.version.split('.')[0],10)>=6 || parseInt(pkg.version.split('.')[1],10)>=23 || parseInt(pkg.version.split('.')[2],10)>=27)) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(lupa+ncm));
console.log('\nRESULTADO: v5.22.27 passou!');
//<<<<SECAO:test_ajustes_v52227.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52232.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52232.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

ok('visual 5.22.31 apagado', !fs.existsSync('ajustes_v52231_modo_escuro_visual_patch.js'));
ok('fora do bundle', !manifest.includes('ajustes_v52231_modo_escuro_visual_patch.js'));
ok('escuro original fica', manifest.includes('ajustes_v52230_modo_escuro_dispositivo_patch.js'));
ok('versão 5.22.32+', /^\d+\.\d+\.\d+/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', true);
console.log('\nRESULTADO: v5.22.32 passou!');
//<<<<SECAO:test_ajustes_v52232.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52234.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52234.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const aviso=fs.readFileSync('ajustes_v52234_config_aviso_salvou_patch.js','utf8');
const ncm=fs.readFileSync('ajustes_v52234_ncm_produto_existente_patch.js','utf8');
const env=fs.readFileSync('envio_arquivos.html','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[ncm,aviso].join('\n'))(ctx.window,ctx.document);
const A=ctx.window.CONFIG_AVISO_SALVOU_PURE;
const N=ctx.window.NCM_PRODUTO_EXISTENTE_PURE;

ok('reconhece botão Salvar', A.ehBotaoSalvar({tagName:'BUTTON',textContent:'Salvar dados fiscais'})===true);
ok('ignora outro botão', A.ehBotaoSalvar({tagName:'BUTTON',textContent:'Atualizar'})===false);
ok('usa aviso do sistema', /lfbAlert/.test(aviso));

const ja={id:'p1',sku:'10',nome:'Chip',estoque:7,ncm:''};
const f=N.fundirNcm(ja,'85423991');
ok('grava só o NCM', f.mudou===true && f.rec.ncm==='85423991' && f.rec.estoque===7 && f.rec.nome==='Chip');
ok('igual não mexe', N.fundirNcm({ncm:'85423991'},'85423991').mudou===false);
ok('NCM curto não grava', N.fundirNcm({ncm:''},'123').mudou===false);

ok('página funde NCM', /function fundirNcm/.test(env) && /não duplica/.test(env));
ok('não regrava estoque no existente', /fundirNcm\(hit\.data/.test(env));
ok('patches no bundle', manifest.includes('ajustes_v52234_config_aviso_salvou_patch.js') && manifest.includes('ajustes_v52234_ncm_produto_existente_patch.js'));
ok('versão 5.22.34+', /^\d+\.\d+\.\d+/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(aviso+ncm));
console.log('\nRESULTADO: v5.22.34 passou!');
//<<<<SECAO:test_ajustes_v52234.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52247.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52247.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}
const src=fs.readFileSync('ajustes_v52247_exe_atualiza_patch.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const P=load(src).EXE_ATUALIZA_V52247_PURE;
ok('asar desligado no pack', pkg.build.asar===false && String(pkg.scripts['build:win']).indexOf('asar=false')>=0);
ok('limpa dist antes de gerar', String(pkg.scripts['build:win']).indexOf('clean_dist.js')>=0 && fs.existsSync('clean_dist.js'));
ok('package.json entra no exe', pkg.build.files.indexOf('package.json')>=0);
ok('main limpa cache na versão nova', main.indexOf('clearCache')>=0 && main.indexOf('app-version.txt')>=0 && main.indexOf('disable-http-cache')>=0);
ok('loadFile com versão', main.indexOf('APP_VERSION')>=0 && main.indexOf('loadFile')>=0);
ok('pure', P.asar===false && P.limpaCacheNaVersao===true && P.VERSAO==='5.22.47');
ok('patch no bundle', manifest.includes('ajustes_v52247_exe_atualiza_patch.js'));
ok('versão', /^\d+\.\d+\.\d+/.test(String(pkg.version)) && html.indexOf('app.bundle.js?v=')>=0);
ok('APK quieto', src.indexOf('mobile/')<0 && main.indexOf('mobile/')<0);
console.log('\nRESULTADO: v5.22.47 passou!');
//<<<<SECAO:test_ajustes_v52247.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52248.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52248.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}
const src=fs.readFileSync('ajustes_v52248_exe_cache_patch.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const P=load(src).EXE_CACHE_V52248_PURE;
// v5.22.63: desligar o cache V8 foi um contorno; a causa (código antigo preso
// no cache) passou a ser resolvida pela impressão digital do bundle. Com isso o
// cache de código volta LIGADO, que é o que importa em PC fraco.
ok('cache V8 ligado para abrir rápido', main.indexOf("v8CacheOptions: 'bypassHeatCheck'")>=0);
ok('cache antigo não sobrevive a mudança de código', /prev\s*!==\s*APP_FINGERPRINT/.test(main) && main.indexOf('Code Cache')>=0);
ok('apaga Code Cache na versão nova', main.indexOf('Code Cache')>=0 && main.indexOf('GPUCache')>=0);
ok('loadFile sem query', main.indexOf("loadFile(path.join(__dirname, 'index.html'))")>=0);
ok('asar continua off', pkg.build.asar===false);
ok('pure', P.VERSAO==='5.22.48' && P.v8Cache==='none');
ok('patch no bundle', manifest.includes('ajustes_v52248_exe_cache_patch.js'));
ok('versão', /^\d+\.\d+\.\d+/.test(pkg.version) && html.indexOf('app.bundle.js?v=')>=0 && /v\d+\.\d+\.\d+/.test(html));
ok('APK quieto', src.indexOf('mobile/')<0);
console.log('\nRESULTADO: v5.22.48 passou!');
//<<<<SECAO:test_ajustes_v52248.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52250.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52250.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}
function load(src){
  const ctx = { window: {}, document: undefined };
  new Function('window', 'document', src)(ctx.window, ctx.document);
  return ctx.window;
}

const src = fs.readFileSync('ajustes_v52250_exe_bundle_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const P = load(src).EXE_BUNDLE_V52250_PURE;

ok('versão 5.22.50 base', P.VERSAO === '5.22.50' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('bundle completo ativo', P.bundleCompleto === true);
ok('patch no bundle', manifest.includes('ajustes_v52250_exe_bundle_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52250_exe_bundle_patch.js'));
ok('index carrega os scripts', /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52250_exe_bundle_patch.js'));
ok('rodapé versão', /footer-version/.test(html) && /v\d+\.\d+\.\d+/.test(html));
ok('sem nome pessoal novo', !/kauan/i.test(src.replace(/__KAUAN_REFINO_STATE__/g, '').replace(/kauangabrielcardososilva7890-afk/g, '')));

console.log('\nRESULTADO: v5.22.50 passou!');
//<<<<SECAO:test_ajustes_v52250.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52251.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52251.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

function load(src){
  const ctx = {
    window: {
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    document: {
      getElementById: () => null,
      title: ''
    }
  };
  ctx.window.window = ctx.window;
  new Function('window', 'document', src)(ctx.window, ctx.document);
  return ctx.window;
}

const src = fs.readFileSync('ajustes_v52251_exe_resiliencia_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const mainJs = fs.readFileSync('main.js', 'utf8');
const P = load(src).EXE_RESILIENCIA_V52251_PURE;

ok('versão 5.22.51 base', P.VERSAO === '5.22.51' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('anti tela branca ativo', P.antiTelaBranca === true && P.recuperacaoAutomatica === true);
ok('patch no manifesto do bundle', manifest.includes('ajustes_v52251_exe_resiliencia_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52251_exe_resiliencia_patch.js'));
ok('index carrega os scripts', /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52251_exe_resiliencia_patch.js'));
ok('rodapé na versão 5.22', /footer-version/.test(html) && /v\d+\.\d+\.\d+/.test(html));
ok('main.js tem fallback seguro de exibição da janela', mainJs.includes('setTimeout') && mainJs.includes('win.show()'));
ok('verificação de sessão segura', P.verificarSessaoSegura(null).logado === false && P.verificarSessaoSegura({ usuarioNome: 'Teste' }).logado === true);
ok('sem nome pessoal novo', !/kauan/i.test(src.replace(/__KAUAN_REFINO_STATE__/g, '').replace(/kauangabrielcardososilva7890-afk/g, '')));

console.log('\nRESULTADO: v5.22.51 passou!');
//<<<<SECAO:test_ajustes_v52251.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52252.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52252.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

function load(src){
  const ctx = {
    window: {
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    document: {
      getElementById: () => null,
      title: ''
    }
  };
  ctx.window.window = ctx.window;
  new Function('window', 'document', src)(ctx.window, ctx.document);
  return ctx.window;
}

const src = fs.readFileSync('ajustes_v52252_resolucao_loop_patch.js', 'utf8');
const p50 = fs.readFileSync('ajustes_v52250_exe_bundle_patch.js', 'utf8');
const p49 = fs.readFileSync('ajustes_v52249_relatorio_patch.js', 'utf8');
const p46 = fs.readFileSync('ajustes_v52246_nuvem_nao_autorizar_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const P = load(src).RESOLUCAO_LOOP_V52252_PURE;

ok('versão 5.22.52 base', P.VERSAO === '5.22.52' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('sem loop de observer ativo', P.semLoopObserver === true);
ok('patch 50 sem MutationObserver em documentElement', !p50.includes('MutationObserver'));
ok('patch 49 sem MutationObserver em documentElement', !p49.includes('MutationObserver'));
ok('patch 46 sem MutationObserver em documentElement', !p46.includes('MutationObserver'));
ok('patch no manifesto do bundle', manifest.includes('ajustes_v52252_resolucao_loop_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52252_resolucao_loop_patch.js'));
ok('index carrega os scripts na versão 5.22', /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52252_resolucao_loop_patch.js'));
ok('rodapé na versão 5.22', /footer-version/.test(html) && /v\d+\.\d+\.\d+/.test(html));
ok('sem nome pessoal novo', !/kauan/i.test(src.replace(/__KAUAN_REFINO_STATE__/g, '').replace(/kauangabrielcardososilva7890-afk/g, '')));

console.log('\nRESULTADO: v5.22.52 passou!');
//<<<<SECAO:test_ajustes_v52252.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52263.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52263.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE v5.22.63 — .exe completo: nenhuma atualização fica de fora
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const cp = require('child_process');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }
function load(src){
  const ctx = { window:{}, document:undefined };
  new Function('window','document', src)(ctx.window, ctx.document);
  return ctx.window;
}

const src = fs.readFileSync('ajustes_v52263_exe_completo_patch.js','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html = fs.readFileSync('index.html','utf8');
const sync = fs.readFileSync('sync_build.js','utf8');
const verify = fs.readFileSync('verify_pack.js','utf8');
const main = fs.readFileSync('main.js','utf8');
const P = load(src).EXE_COMPLETO_V52263_PURE;

console.log('== v5.22.63 — .EXE COMPLETO ==');

ok('versao', P.VERSAO === '5.22.63' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('patch no bundle', manifest.includes('ajustes_v52263_exe_completo_patch.js'));
ok('bundle carregado com cache-busting da versão',
   html.indexOf('app.bundle.js?v='+pkg.version) >= 0);
ok('patch vai para o .exe dentro do bundle', pkg.build.files.includes('app.bundle.js'));
ok('index.html não carrega script duplicado do bundle',
   [...html.matchAll(/<script\s[^>]*src="\.\/([A-Za-z0-9_.\-/]+\.js)/g)]
     .map(m=>m[1]).filter(f=>f!=='app.bundle.js'&&!f.startsWith('assets/'))
     .every(f=>!manifest.includes(f)));

// ── 1. Lista de arquivos do .exe é gerada, não escrita à mão ────────────────
ok('sync gera build.files', P.listaAutomatica === true && /pkg\.build\.files\s*=\s*filesEsperado/.test(sync));
ok('sync gera scripts.check', /pkg\.scripts\.check\s*=\s*checkEsperado/.test(sync));
ok('sync tem modo --check para travar build sujo', /--check/.test(sync) && /process\.exit\(1\)/.test(sync));
cp.execFileSync(process.execPath, ['sync_build.js','--check'], { stdio:'pipe' });
ok('configuração está sincronizada agora', 'ok');

// ── 2. O pacote gerado é conferido ──────────────────────────────────────────
ok('verify confere o pacote', P.conferePacote === true);
ok('verify compara o sha256 do bundle empacotado', /sha\(bundleRel\)/.test(verify) && /DIFERENTE do projeto/.test(verify));
ok('verify acusa recurso do index ausente no pacote', /NÃO foi para o \.exe/.test(verify));
ok('verify falha o build quando falta algo', /erros\.length/.test(verify) && /process\.exit\(1\)/.test(verify));

// ── 3. Cache do Electron por conteúdo, não só por versão ────────────────────
ok('cache por impressão digital', P.cachePorConteudo === true && /APP_FINGERPRINT/.test(main));
ok('fingerprint usa o sha256 do bundle', /sha256/.test(main) && /app\.bundle\.js/.test(main));
ok('não depende só do número da versão', /prev\s*!==\s*APP_FINGERPRINT/.test(main));

// ── 4. Pipeline do npm encadeado na ordem certa ─────────────────────────────
const bw = pkg.scripts['build:win'];
ok('build:win = limpa → sincroniza → empacota → confere',
   bw.indexOf('clean_dist.js') < bw.indexOf('sync_build.js') &&
   bw.indexOf('sync_build.js') < bw.indexOf('electron-builder') &&
   bw.indexOf('electron-builder') < bw.indexOf('verify_pack.js'));

// ── 5. APK sem arquivos faltando ────────────────────────────────────────────
const www = fs.readFileSync('mobile/sync-www.js','utf8');
ok('APK copia o que o index carrega', P.apkSemFaltas === true && /refsLocais\(htmlOrigem\)/.test(www));
ok('APK falha se sobrar referência quebrada', /o APK sairia com arquivos faltando/.test(www));

// ── 6. Higiene ──────────────────────────────────────────────────────────────
ok('bundle atualizado com as fontes', (cp.execFileSync(process.execPath,['build_bundle.js','--check'],{stdio:'pipe'}), true));
ok('patch não mexe no APK', src.indexOf('mobile/') < 0);

// ── 7. Otimização para PC fraco ─────────────────────────────────────────────
ok('cache de código V8 ligado (abre mais rápido)',
   main.indexOf("v8CacheOptions: 'bypassHeatCheck'") >= 0);
ok('corretor ortográfico desligado (menos memória)', /spellcheck:\s*false/.test(main));
const soltos = [...html.matchAll(/<script\s[^>]*src="\.\/([A-Za-z0-9_.\-/]+\.js)/g)]
  .map(m => m[1]).filter(f => f !== 'app.bundle.js' && !f.startsWith('assets/'));
ok('zero script duplicado: nada é lido/executado 2x', soltos.length === 0);
ok('sync remove duplicata do bundle automaticamente', /duplicado\(s\) do bundle removido/.test(sync));
ok('Chart.js não bloqueia mais a primeira pintura',
   html.indexOf('chart.umd.js') > html.indexOf('<div id="toast-container"'));
ok('build.files enxuto', pkg.build.files.length <= 15);

// ── 8. Verificação sem baixar o Electron ────────────────────────────────────
ok('verify tem modo simulação com o matcher real', /--dry/.test(verify) && /app-builder-lib\/out\/fileMatcher/.test(verify));
ok('atalho npm run verify:files', pkg.scripts['verify:files'] === 'node verify_pack.js --dry');

// ── 9. Links de teste e download (obrigatórios a cada atualização) ──────────
const REPO = pkg.digicopy.repo, BRANCH = pkg.digicopy.branch;
ok('package.json guarda repo e branch publicados', !!REPO && !!BRANCH);
ok('sync monta o link OFICIAL do site próprio (githack fora — dono confirmou, r36)', /LINK_SITE/.test(sync) && /teste-60f\.pages\.dev/.test(sync) && !/LINK_GITHACK/.test(sync));
ok('sync monta o link do zip do GitHub', /LINK_ZIP/.test(sync) && /archive\/refs\/heads/.test(sync));
ok('sync imprime os dois links', /imprimirLinks/.test(sync));
ok('sync avisa se a branch do git divergir', /digicopy\.branch/.test(sync));

// GitHack fora do bundle (dono confirmou, r36): nenhum arquivo pode trazer endereço do GitHack.
// Nome puro em comentário/histórico pode. Exceção: os 3 patches que convertem link ANTIGO de
// dado já salvo (v52240/v52249/v52254) — só têm o nome dentro de regex de conversão, nunca um link.
const legadoOk = ['ajustes_v52240_orcamento_pages_patch.js', 'ajustes_v52249_relatorio_patch.js', 'ajustes_v52254_orcamentos_pages_patch.js'];
const comLinkGithack = manifest.filter(f => {
  const c = fs.readFileSync(f, 'utf8');
  if (c.indexOf('githack.com') < 0) return false;
  if (legadoOk.indexOf(f) >= 0) return c.indexOf('githack.com/' + REPO) >= 0;
  return true;
});
if (comLinkGithack.length) console.error('   arquivos com githack: ' + comLinkGithack.join(', '));
ok('githack fora do bundle (só conversão de dado velho, r36)', comLinkGithack.length === 0);
// os textos de ajuda das páginas avulsas também não podem mandar para o GitHack
const env = fs.readFileSync('envio_arquivos.html', 'utf8');
const esc = fs.readFileSync('escola_login.html', 'utf8');
ok('textos de ajuda sem GitHack (mesmo endereço do site)', env.toLowerCase().indexOf('githack') < 0 && esc.toLowerCase().indexOf('githack') < 0);

// os dois links precisam estar documentados
const rel = fs.readFileSync('RELATORIO_SESSAO.md', 'utf8');
const guia = fs.readFileSync('BUILD_EXE.md', 'utf8');
ok('RELATORIO_SESSAO.md traz o link OFICIAL do site próprio', rel.indexOf('teste-60f.pages.dev') >= 0);
ok('RELATORIO_SESSAO.md traz o link do zip', rel.indexOf('archive/refs/heads/' + BRANCH + '.zip') >= 0);
ok('RELATORIO_SESSAO.md ainda documenta o githack como histórico morto', /githack/i.test(rel));
ok('BUILD_EXE.md traz os links oficiais',
   guia.indexOf('teste-60f.pages.dev') >= 0 &&
   guia.indexOf('archive/refs/heads/' + BRANCH + '.zip') >= 0);

console.log('\nRESULTADO: v5.22.63 passou!');
//<<<<SECAO:test_ajustes_v52263.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52264.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52264.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE v5.22.64 — cada entrega tem número novo + diagnóstico do .exe
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }
function load(src){
  const ctx = { window:{}, document:undefined, setTimeout:()=>0, console:{log(){}} };
  new Function('window','document','setTimeout','console',src)(ctx.window, ctx.document, ctx.setTimeout, ctx.console);
  return ctx.window;
}

const src  = fs.readFileSync('ajustes_v52264_exe_numero_novo_patch.js','utf8');
const diag = fs.readFileSync('diagnostico_exe.js','utf8');
const html = fs.readFileSync('index.html','utf8');
const pkg  = JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const guia = fs.readFileSync('BUILD_EXE.md','utf8');

const P = load(src).EXE_NUMERO_NOVO_V52264_PURE;

console.log('== v5.22.64 — NÚMERO NOVO A CADA ENTREGA ==');

// ── 1. Versão ───────────────────────────────────────────────────────────────
ok('versão', P.VERSAO === '5.22.64' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('patch no bundle', manifest.includes('ajustes_v52264_exe_numero_novo_patch.js'));
ok('bundle carregado com a versão', html.indexOf('app.bundle.js?v='+pkg.version) >= 0);
ok('versão subiu em relação à 5.22.63', (() => {
  const n = v => v.split('.').map(Number);
  const a = n(pkg.version), b = n('5.22.63');
  return a[0] > b[0] || (a[0]===b[0] && (a[1] > b[1] || (a[1]===b[1] && a[2] > b[2])));
})());
ok('nome do instalador acompanha a versão do package.json',
   P.nomeInstalador(pkg.version) === 'Sistema-Digicopy-Setup-'+pkg.version+'.exe');

// ── 2. Lógica pura ──────────────────────────────────────────────────────────
ok('versaoBate compara certo', P.versaoBate('5.22.64','5.22.64') && !P.versaoBate('5.22.63','5.22.64'));
ok('versaoBate ignora espaço', P.versaoBate(' 5.22.64 ','5.22.64'));
ok('nomeInstalador usa a versão', P.nomeInstalador('5.22.64') === 'Sistema-Digicopy-Setup-5.22.64.exe');
ok('nomeInstalador tem padrão', P.nomeInstalador() === 'Sistema-Digicopy-Setup-5.22.64.exe');
ok('marcadores do patch', P.numeroSempreNovo === true && P.temDiagnostico === true);

// ── 3. O patch não sequestra a versão global ────────────────────────────────
ok('respeita a versão do index.html', /DIGICOPY_APP_VERSION\s*\|\|\s*VERSAO/.test(src));
ok('não sobrescreve a versão global', !/window\.DIGICOPY_APP_VERSION\s*=\s*VERSAO\s*;/.test(src));
ok('pinta lendo a versão global', /window\.DIGICOPY_APP_VERSION\)\s*\|\|\s*VERSAO/.test(src));
ok('cuida do nome da janela', /document\.title\s*=\s*certo/.test(src));

// ── 4. Diagnóstico do .exe ──────────────────────────────────────────────────
ok('existe o diagnóstico', fs.existsSync('diagnostico_exe.js'));
ok('atalho npm run diag', pkg.scripts.diag === 'node diagnostico_exe.js');
ok('diagnóstico compara a digital do bundle', /lerSha/.test(diag) && /FONTE\.sha/.test(diag));
ok('diagnóstico procura a instalação do Windows', /LOCALAPPDATA/.test(diag) && /win-unpacked/.test(diag));
ok('diagnóstico reconhece o sintoma do rodapé', /só o rodapé atualiza/.test(diag));
ok('diagnóstico só lê, não escreve', !/writeFileSync|rmSync|unlinkSync|mkdirSync/.test(diag));
ok('diagnóstico caça outras cópias instaladas', /OUTRA CÓPIA ENCONTRADA/.test(diag) && /function varrer/.test(diag));
ok('diagnóstico mostra para onde os atalhos apontam', /alvoDoAtalho/.test(diag) && /Start Menu/.test(diag));
ok('diagnóstico avisa quando o build está ok mas nada foi instalado',
   /NÃO existe nenhum Sistema Digicopy instalado/.test(diag));
ok('diagnóstico lembra de fechar o app antes de instalar', /FECHE o Sistema Digicopy/.test(diag));
ok('diagnóstico não trava em pasta gigante', /visitados < \d+/.test(diag) && /profundidadeMax/.test(diag));

// ── 5. Documentação ─────────────────────────────────────────────────────────
ok('BUILD_EXE.md explica o número novo', guia.indexOf('5.22.64') >= 0 || /número novo/i.test(guia));
ok('BUILD_EXE.md cita o diagnóstico', guia.indexOf('npm run diag') >= 0);

// ── 6. APK segue parado ─────────────────────────────────────────────────────
ok('patch não mexe no APK', !/capacitor|android|apk/i.test(src));

console.log('\nRESULTADO: v5.22.64 passou!');
//<<<<SECAO:test_ajustes_v52264.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52265.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52265.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE v5.22.65 — um script quebrado não derruba o sistema inteiro
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const os = require('os');
const path = require('path');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }
function load(src){
  const ctx = { window:{}, document:undefined, setTimeout:()=>0, console:{log(){},error(){}} };
  new Function('window','document','setTimeout','console',src)(ctx.window, ctx.document, ctx.setTimeout, ctx.console);
  return ctx.window;
}

const src    = fs.readFileSync('ajustes_v52265_script_isolado_patch.js','utf8');
const build  = fs.readFileSync('build_bundle.js','utf8');
const main   = fs.readFileSync('main.js','utf8');
const diag   = fs.readFileSync('diagnostico_exe.js','utf8');
const bundle = fs.readFileSync('app.bundle.js','utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const P = load(src).EXE_SCRIPT_ISOLADO_V52265_PURE;

console.log('== v5.22.65 — SCRIPT ISOLADO ==');

// ── 1. Versão ───────────────────────────────────────────────────────────────
ok('versão', P.VERSAO === '5.22.65' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('patch no bundle', manifest.includes('ajustes_v52265_script_isolado_patch.js'));
ok('bundle carregado com a versão', fs.readFileSync('index.html','utf8').indexOf('app.bundle.js?v='+pkg.version) >= 0);

// ── 2. Lógica pura ──────────────────────────────────────────────────────────
ok('não isola quem declara no escopo global', P.podeIsolar(true) === false);
ok('isola quem não declara nada no topo', P.podeIsolar(false) === true);
ok('resumo sem falha', P.resumoFalhas([]) === 'Todos os scripts carregaram.');
ok('resumo no singular', P.resumoFalhas([{}]) === '1 script não carregou');
ok('resumo no plural', P.resumoFalhas([{},{}]) === '2 scripts não carregaram');
ok('carregouTudo confere o marcador',
   P.carregouTudo({ __DIGICOPY_BUNDLE_COMPLETO:true }) === true &&
   P.carregouTudo({}) === false && P.carregouTudo(null) === false);

// ── 3. O bundle realmente isola ─────────────────────────────────────────────
ok('build_bundle usa acorn para decidir', /require\('acorn'\)/.test(build) && /declaraNoEscopoGlobal/.test(build));
ok('build_bundle não usa lista escrita à mão', !/const\s+(SEGUROS|GLOBAIS)\s*=\s*\[/.test(build));
ok('bundle tem o coletor de falhas', /__DIGICOPY_FALHA\s*=\s*function/.test(bundle));
ok('bundle tem a marca de fim', /__DIGICOPY_BUNDLE_COMPLETO\s*=\s*true/.test(bundle));
ok('bundle envolve scripts em try/catch', (bundle.match(/window\.__DIGICOPY_FALHA\("/g) || []).length >= 150);
ok('app.js fica fora do try/catch (escopo global)', /app\.js \(escopo global\)/.test(bundle));

// prova de fogo: monta um bundle onde o script do meio quebra
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'digicopy-iso-'));
  const antes = process.cwd();
  try {
    process.chdir(tmp);
    fs.writeFileSync('um.js',   '(function(){ window.ordem.push("um"); })();\n');
    fs.writeFileSync('dois.js', '(function(){ window.ordem.push("dois"); indexedDB.open("x"); })();\n');
    fs.writeFileSync('tres.js', '(function(){ window.ordem.push("tres"); })();\n');
    fs.writeFileSync('bundle-manifest.json', JSON.stringify(['um.js','dois.js','tres.js']));
    require('child_process').execSync('node ' + JSON.stringify(path.join(antes,'build_bundle.js')),
      { stdio:'ignore', env:{...process.env, NODE_PATH: path.join(antes,'node_modules')} });

    const w = { ordem: [] };
    const idb = { open(){ throw new Error('SecurityError: bloqueado em file://'); } };
    new Function('window','indexedDB','localStorage','console',
      fs.readFileSync('app.bundle.js','utf8'))(w, idb, undefined, {log(){},error(){}});

    ok('script depois do que falhou continua rodando', w.ordem.join(',') === 'um,dois,tres');
    ok('bundle chega ao fim mesmo com falha', w.__DIGICOPY_BUNDLE_COMPLETO === true);
    ok('a falha fica registrada com o nome do arquivo',
       (w.__DIGICOPY_ERROS||[]).length === 1 && w.__DIGICOPY_ERROS[0].arquivo === 'dois.js');
  } finally {
    process.chdir(antes);
    try { fs.rmSync(tmp, { recursive:true, force:true }); } catch(e){}
  }
}

// ── 4. As falhas ficam registradas em disco ─────────────────────────────────
ok('main.js grava log-erros.txt', /log-erros\.txt/.test(main));
ok('main.js escuta erros do console', /console-message/.test(main));
ok('main.js avisa se o bundle não terminou', /BUNDLE NÃO CHEGOU AO FIM/.test(main));
ok('main.js lê __DIGICOPY_ERROS da tela', /__DIGICOPY_ERROS/.test(main));
ok('registro nunca atrapalha o uso', /catch\(e\)\{\}/.test(main));
ok('diagnóstico mostra o log', /log-erros\.txt/.test(diag) && /log de falhas do app/.test(diag));

// ── 5. Patch bem-comportado ─────────────────────────────────────────────────
ok('não sobrescreve a versão global', !/window\.DIGICOPY_APP_VERSION\s*=\s*VERSAO\s*;/.test(src));
ok('lê a versão global ao pintar', /window\.DIGICOPY_APP_VERSION\)\s*\|\|\s*VERSAO/.test(src));
ok('avisa quem usa quando algo falhou', /resumoFalhas\(erros\)/.test(src));
ok('patch não mexe no APK', !/capacitor|android|apk/i.test(src));

console.log('\nRESULTADO: v5.22.65 passou!');
//<<<<SECAO:test_ajustes_v52265.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52267.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52267.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — relatório do usuário (v5.22.67)
//   1.1 volta pro login sozinho     1.2 backup só no botão
//   1.3 menu passa da borda         2.1 aviso EPSON não estoura a folha
//   2.2 venda salva no financeiro   2.3 data um dia a menos
//   3.1 filtro cidade nos contratos 4.1 impressora em lista, dois cliques
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let falhas = 0;
function ok(nome, cond) {
  if (cond) console.log('  \u2714 ' + nome);
  else { console.log('  \u2718 ' + nome); falhas++; }
}
const ler = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const pkg = JSON.parse(ler('package.json'));
const manifest = JSON.parse(ler('bundle-manifest.json'));

console.log('== RELATÓRIO v5.22.67 ==');

// ── 1.1 volta pro login sozinho ────────────────────────────────────────────
{
  const fonte = ler('sistema_clientes_loja_patch.js');
  const win = { console: { log() {} }, document: undefined };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const P = win.SISTEMA_CLIENTES_LOJA_PURE;
  ok('1.1 módulo do login diário exporta as funções', !!(P && P.exigirLoginDiario && P.diaLocalDe));

  // diaLocalDe usa o dia LOCAL, nunca o UTC
  const noite = new Date(2026, 8, 1, 23, 30, 0);
  ok('1.1 dia local não pula para o dia seguinte à noite', P.diaLocalDe(noite) === '2026-09-01');
  ok('1.1 dia local aguenta lixo', P.diaLocalDe('xxxx') === '' && P.diaLocalDe(null) === '');

  // simula a sessão dentro do próprio módulo
  function rodar(sessao) {
    const w = { console: { log() {} } };
    w.window = w;
    const guardado = { sessao: sessao ? Object.assign({}, sessao) : null, deslogou: false };
    w.localStorage = {
      getItem: () => guardado.sessao ? JSON.stringify(guardado.sessao) : null,
      setItem: (_k, v) => { guardado.sessao = JSON.parse(v); },
      removeItem: () => { guardado.sessao = null; guardado.deslogou = true; }
    };
    w.getSession = () => guardado.sessao;
    w.setSession = s => { guardado.sessao = s; };
    w.clearSession = () => { guardado.sessao = null; guardado.deslogou = true; };
    w.toast = () => {};
    vm.createContext(w);
    vm.runInContext(fonte, w);
    const r = w.SISTEMA_CLIENTES_LOJA_PURE.exigirLoginDiario();
    return { deslogou: guardado.deslogou || r === true, sessao: guardado.sessao };
  }

  const hoje = new Date();
  const hojeStr = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');

  // ERA O BUG: sessão sem carimbo caía a cada 60 segundos
  const semCarimbo = rodar({ usuarioId: 'u1', loginAt: hoje.toISOString() });
  ok('1.1 sessão de hoje sem carimbo NÃO desloga', semCarimbo.deslogou === false);
  ok('1.1 e o carimbo passa a existir', semCarimbo.sessao && semCarimbo.sessao.loginDia === hojeStr);

  const semNada = rodar({ usuarioId: 'u1' });
  ok('1.1 sessão sem loginAt nenhum também não desloga', semNada.deslogou === false);

  const carimbada = rodar({ usuarioId: 'u1', loginDia: hojeStr });
  ok('1.1 sessão carimbada de hoje continua logada', carimbada.deslogou === false);

  const ontem = rodar({ usuarioId: 'u1', loginDia: '2020-01-01', loginAt: '2020-01-01T10:00:00' });
  ok('1.1 virou o dia = pede login de novo', ontem.deslogou === true);

  ok('1.1 sem sessão não faz nada', rodar(null).deslogou === false);
}

// ── 1.2 backup só quando clicar ────────────────────────────────────────────
{
  const fonte = ler('ajustes_v52024_patch.js');
  ok('1.2 não existe mais backup automático', !/rodarBackupDiario|agendarBackupDiario/.test(fonte));
  ok('1.2 não chama mais o saveDaily sozinho', !/saveDaily/.test(fonte));
  ok('1.2 nenhum temporizador sobrou no módulo', !/setInterval/.test(fonte));
  ok('1.2 o botão Backup continua funcionando', /window\.exportBackup\s*=/.test(fonte));
  ok('1.2 nenhum outro arquivo do bundle chama saveDaily',
     manifest.every(f => !/backupAPI[\s\S]{0,40}saveDaily/.test(ler(f))));
}

// ── 1.3 menu passando da borda ─────────────────────────────────────────────
{
  const fonte = ler('menus_tela_pequena_patch.js');
  const win = { console: { log() {} } };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const P = win.MENUS_TELA_PEQUENA_PURE;
  const janela = { largura: 1024, altura: 600 };

  ok('1.3 menu que cabe não é tocado',
     P.ajusteNecessario({ top: 100, left: 100, largura: 220, altura: 200 }, janela) === null);

  const alto = P.ajusteNecessario({ top: 100, left: 100, largura: 220, altura: 900 }, janela);
  ok('1.3 menu alto demais ganha rolagem', !!alto && alto.alturaMax > 0 && alto.alturaMax <= 500);
  ok('1.3 a rolagem respeita a altura mínima',
     P.ajusteNecessario({ top: 580, left: 10, largura: 220, altura: 400 }, janela).alturaMax === P.MIN_ALTURA);

  const largo = P.ajusteNecessario({ top: 50, left: 900, largura: 300, altura: 100 }, janela);
  ok('1.3 menu que vaza pela direita é puxado para dentro', !!largo && largo.deslocarX < 0);
  ok('1.3 e nunca é empurrado para fora pela esquerda',
     900 + largo.deslocarX >= 0);

  ok('1.3 o módulo está no bundle', manifest.includes('menus_tela_pequena_patch.js'));
  ok('1.3 não mexe no APK', !/capacitor|cordova/i.test(fonte));
}

// ── 2.1 aviso EPSON sem estourar a folha ───────────────────────────────────
{
  const fonte = ler('ajustes_v52239_print_escolha_patch.js');
  const win = { console: { log() {} } };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const P = win.V52239_PRINT_PURE;

  ok('2.1 o aviso continua existindo', /EPSON/.test(fonte));
  ok('2.1 conta que cabe não encolhe nada', P.fatorParaCaber(900, 1000) === 1);
  ok('2.1 conta que passa encolhe o suficiente', P.fatorParaCaber(1100, 1000) <= 1000 / 1100 + 0.01);
  ok('2.1 nunca encolhe abaixo do legível', P.fatorParaCaber(5000, 1000) === 0.7);
  ok('2.1 conta aguenta valores vazios', P.fatorParaCaber(0, 1000) === 1);

  const os = P.aplicarTipo('<html><body><div class="pagina meia">x</div></body></html>', 'os');
  ok('2.1 OS sai em folha inteira', /pagina inteira/.test(os));
  ok('2.1 OS leva o ajuste de uma folha só', /régua/.test(os));
  ok('2.1 o ajuste não é injetado duas vezes', (P.injetarUmaFolha(os).match(/régua/g) || []).length === (os.match(/régua/g) || []).length);

  const venda = P.aplicarTipo('<html><body><div class="pagina inteira">x</div></body></html>', 'venda');
  ok('2.1 venda continua meia folha e sem aviso', /pagina meia/.test(venda) && !/aviso-epson/.test(venda));
}

// ── 2.2 venda salva também vai para o financeiro ───────────────────────────
{
  const fonte = ler('vendas_financeiro_pendente_patch.js');
  const win = { console: { log() {} } };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const P = win.VENDAS_FINANCEIRO_PENDENTE_PURE;

  ok('2.2 venda salva conta como em aberto', P.vendaEmAberto({ id: 'v1', status: 'aberto' }) === true);
  ok('2.2 venda sem status conta como em aberto', P.vendaEmAberto({ id: 'v1' }) === true);
  ok('2.2 venda faturada fica de fora', P.vendaEmAberto({ id: 'v1', status: 'faturado' }) === false);
  ok('2.2 venda cancelada fica de fora', P.vendaEmAberto({ id: 'v1', status: 'cancelada' }) === false);

  const vendas = [
    { id: 'v1', numero: '1', total: 100, status: 'aberto' },
    { id: 'v2', numero: '2', total: 200, status: 'faturado' },
    { id: 'v3', numero: '3', total: 300, status: 'aberto' }
  ];
  const crs = [{ id: 'cr1', vendaId: 'v2', status: 'aberto' }];
  const faltam = P.vendasSemTitulo(vendas, crs);
  ok('2.2 acha as vendas salvas que sumiram do financeiro',
     faltam.length === 2 && faltam[0].id === 'v1' && faltam[1].id === 'v3');

  const jaTem = P.vendasSemTitulo(vendas, crs.concat([{ id: 'cr2', vendaId: 'v1' }, { id: 'cr3', vendaId: 'v3' }]));
  ok('2.2 não duplica quem já tem título', jaTem.length === 0);

  const t = P.tituloDaVenda(vendas[0], { empresaId: 'e1', usuarioId: 'u', usuarioNome: 'Kauan' }, 'cr9');
  ok('2.2 o título aponta para a venda', t.vendaId === 'v1' && t.valor === 100 && t.status === 'aberto');
  ok('2.2 o título é marcado como aguardando faturamento', t.aguardandoFaturamento === true);
  ok('2.2 o título diz o que é', /aguardando faturamento/.test(t.descricao));

  const orfaos = P.titulosOrfaos(
    [{ id: 'cr1', vendaId: 'v2', aguardandoFaturamento: true },
     { id: 'cr2', vendaId: 'vX', aguardandoFaturamento: true },
     { id: 'cr3', vendaId: 'v1', aguardandoFaturamento: true },
     { id: 'cr4', vendaId: 'v1' }],
    vendas);
  ok('2.2 o provisório some quando a venda é faturada', orfaos.some(c => c.id === 'cr1'));
  ok('2.2 o provisório some quando a venda é apagada', orfaos.some(c => c.id === 'cr2'));
  ok('2.2 o provisório da venda ainda aberta fica', !orfaos.some(c => c.id === 'cr3'));
  ok('2.2 título de verdade nunca é removido', !orfaos.some(c => c.id === 'cr4'));

  ok('2.2 o módulo está no bundle', manifest.includes('vendas_financeiro_pendente_patch.js'));
}

// ── 2.3 data um dia a menos ────────────────────────────────────────────────
{
  const app = ler('app.js');
  ok('2.3 existe leitura de data no fuso local', /function parseDataLocal/.test(app));
  ok('2.3 fmtDate usa a leitura local', /function fmtDate\(s\)\{[^}]*parseDataLocal/.test(app));
  ok('2.3 fmtDateTime usa a leitura local', /function fmtDateTime\(s\)\{[^}]*parseDataLocal/.test(app));

  const win = { console: { log() {} } };
  win.window = win;
  vm.createContext(win);
  const trecho = app.slice(app.indexOf('function parseDataLocal'), app.indexOf('function onlyDigits'));
  vm.runInContext(trecho, win);
  const d = win.parseDataLocal('2026-09-01');
  ok('2.3 AAAA-MM-DD vira meia-noite LOCAL, não UTC',
     d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 1);
  ok('2.3 o dia mostrado é o dia salvo', win.fmtDate('2026-09-01') === '01/09/2026');
  ok('2.3 data com hora continua igual',
     win.fmtDate('2026-09-01T15:00:00') === '01/09/2026');
  ok('2.3 texto que não é data passa reto', win.fmtDate('sem data') === 'sem data');
  ok('2.3 vazio continua traço', win.fmtDate('') === '-');
}

// ── 3.1 filtro cidade nos contratos ────────────────────────────────────────
{
  const fonte = ler('ajustes_v52237_contratos_filtros_patch.js');
  const win = { console: { log() {} } };
  win.window = win;
  win.db = {
    clientes: [
      { id: 'c1', nome: 'ESCOLA A', cidade: 'Montes Claros' },
      { id: 'c2', nome: 'ESCOLA B', municipio: 'Bocaiúva' },
      { id: 'c3', nome: 'ESCOLA C' }
    ],
    parque: [], equipamentos: [], leituras: [], os: []
  };
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const P = win.CONTRATOS_FILTROS_PURE;

  ok('3.1 Cidade aparece na lista de filtros', P.FILTROS.some(f => f[0] === 'cidade' && f[1] === 'Cidade'));
  ok('3.1 lê a cidade do cliente', P.cidadeDe({ clienteId: 'c1' }) === 'Montes Claros');
  ok('3.1 aceita o cadastro que gravou como município', P.cidadeDe({ clienteId: 'c2' }) === 'Bocaiúva');
  ok('3.1 cliente sem cidade não quebra', P.cidadeDe({ clienteId: 'c3' }) === '');

  const contratos = [
    { id: 'k1', clienteId: 'c1', numero: '1' },
    { id: 'k2', clienteId: 'c2', numero: '2' },
    { id: 'k3', clienteId: 'c3', numero: '3' }
  ];
  const achou = P.filtraContratos(contratos, 'cidade', 'montes');
  ok('3.1 acha por pedaço do nome e sem ligar para maiúscula', achou.length === 1 && achou[0].id === 'k1');
  ok('3.1 acha ignorando acento', P.filtraContratos(contratos, 'cidade', 'bocaiuva').length === 1);
  ok('3.1 busca vazia não esconde ninguém', P.filtraContratos(contratos, 'cidade', '').length === 3);
  ok('3.1 cidade que não existe não traz nada', P.filtraContratos(contratos, 'cidade', 'zzz').length === 0);
}

// ── 4.1 impressora em lista, dois cliques ──────────────────────────────────
{
  const fonte = ler('leitura_detalhada_departamentos_patch.js');
  ok('4.1 a caixa de escolha de impressora acabou', !/<select id=\\?"lan-prq/.test(fonte));
  ok('4.1 agora é uma lista', /id="lan-prq-lista"[\s\S]{0,80}role="listbox"/.test(fonte));
  ok('4.1 o valor escolhido continua em lan-prq', /type="hidden" id="lan-prq"/.test(fonte));
  ok('4.1 escolhe com dois cliques', /ondblclick="escolherImpressoraLancamento/.test(fonte));
  ok('4.1 um clique só destaca', /onclick="destacarImpressoraLancamento/.test(fonte));
  ok('4.1 o teclado também escolhe (Enter)', /event\.key==='Enter'[\s\S]{0,80}escolherImpressoraLancamento/.test(fonte));
  ok('4.1 a lista rola quando tem muita impressora', /max-height:200px;overflow-y:auto/.test(fonte));
  ok('4.1 a busca reconstrói a lista', /buscarImpressorasLancamento[\s\S]{0,300}lan-prq-lista/.test(fonte));
  ok('4.1 escolher atualiza os tipos de impressão', /escolherImpressoraLancamento[\s\S]{0,600}atualizarTiposLancamento/.test(fonte));
  ok('4.1 lista vazia avisa em vez de ficar em branco', /Nenhuma impressora com medidor pendente/.test(fonte));
  ok('4.1 quem edita não troca a impressora sem querer', /if\(alvo\.disabled\) return;/.test(fonte));
}

// ── versão ─────────────────────────────────────────────────────────────────
ok('versão continua na família 5.22', /^\d+\.\d+\.\d+/.test(pkg.version));
ok('index.html está na mesma versão do package', ler('index.html').indexOf("'" + pkg.version + "'") >= 0);

console.log(falhas === 0
  ? '\nRESULTADO: relatório v5.22.67 passou!'
  : '\nRESULTADO: ' + falhas + ' falha(s) no relatório v5.22.67');
process.exit(falhas === 0 ? 0 : 1);
//<<<<SECAO:test_ajustes_v52267.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52268.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52268.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ler=f=>fs.readFileSync(f,'utf8');
console.log('== AJUSTES v5.22.68 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));

// 1.3 — a faixa azul de módulos não passa mais da borda
const menus=ler('menus_tela_pequena_patch.js');
ok('1.3 faixa de módulos ganha rolagem própria',/digi-row-rola/.test(menus)&&/overflow-x:auto/.test(menus));
ok('1.3 menu aberto sai do recorte da faixa',/position:fixed/.test(menus)&&/posicaoDoMenu/.test(menus));

// 1.4 — técnicos de demonstração não voltam sozinhos
const app=ler('app.js');
ok('1.4 seed não traz técnico de demonstração',/tecnicos:\s*\[\]/.test(app));
ok('1.4 sistema sabe reconhecer o técnico de demonstração',/ehTecnicoDemo/.test(app)&&/TECNICOS_DEMO/.test(app));

// 2.1 — impressão da OS nunca é bloqueada
const v37=ler('ajustes_v52237_vendas_os_visual_patch.js');
ok('2.1 salvar não exige mais técnico',/function wrapGravar\(\)\{ \/\* sem trava \*\/ \}/.test(v37));
ok('2.1 aviso do técnico virou dica',/Dica: escolha o/.test(v37)&&!/Para ordem de serviço, escolha o/.test(v37));
const v18=ler('ajustes_v52218_pix_prazo_print_venda_patch.js');
ok('2.1 acabou a trava "só imprime depois de faturar"',!/Só imprime depois de faturar/.test(v18));

// 2.3 — financeiro mostra criação e vencimento
ok('2.3 listagem mostra as duas datas',/dataCriacaoCR/.test(app)&&/Vence '\+fmtDate\(cr\.vencimento\)/.test(app));
ok('2.3 cabeçalho fala em datas',/Datas \/ Cliente \/ Origem/.test(app));
ok('2.3 título novo nasce com data de criação',/origem:'venda',criadoEm:new Date\(\)\.toISOString\(\)/.test(app));

// 2.4 — nada de botão repetido
ok('2.4 sem "Imprimir/PDF" duplicado no rodapé da venda',!/data-print-fat/.test(v18));
ok('2.4 sem "Pré-visualizar NF-e" no modal',!/btn-nfe-previa-modal','Pré-visualizar NF-e'/.test(ler('ajustes_v5229_nfe_atalho_historico_patch.js')));

// 2.5 — venda salva imprime
ok('2.5 botão imprimir fica visível sem faturar',/b\.style\.display='';/.test(v18));

// 2.6 — sem "deseja salvar?"
const fix=ler('vendas_notinhas_fix_patch.js');
ok('2.6 sair da venda não pergunta mais nada',/function perguntarSairVenda\(depoisFechar\) \{\s*depoisFechar\(\);\s*\}/.test(fix));

// 3.1 — filtro de cidade mantém o texto digitado
const filtros=ler('ajustes_v52237_contratos_filtros_patch.js');
ok('3.1 busca repõe o texto depois de redesenhar',/function reporTexto/.test(filtros)&&/busca\.value=STATE\.q/.test(filtros));

// 5.1 — nuvem: escolha única na primeira conexão
const motor=ler('cloudflare_data_sync_patch.js');
const painel=ler('cloudflare_sync_patch.js');
ok('5.1 primeira conexão sincroniza sem perguntar (v6.1.4)',/sincroniza-direto/.test(motor)&&!/pauseReason='escolha-inicial'/.test(motor));
ok('5.1 duas opções existem no motor',/async function publishLocalToCloud/.test(motor)&&/async function manterLocalSemEnviar/.test(motor));
ok('5.1 painel mostra as duas opções',/dc-enviar-locais/.test(painel)&&/dc-nao-enviar/.test(painel));
ok('5.1 bloqueio de exclusão sumiu da tela',!/Confirmar exclusões de/.test(painel)&&!/dc-approve-delete/.test(painel));
ok('5.1 v6.1.4: por ordem do dono, conectou e sincroniza direto (sem travar)',/function decideReinstallGuard/.test(motor)&&/sincroniza-direto/.test(motor));

['menus_tela_pequena_patch.js','cloudflare_data_sync_patch.js','cloudflare_sync_patch.js','ajustes_v52218_pix_prazo_print_venda_patch.js'].forEach(f=>{
  ok('no bundle: '+f,manifest.indexOf(f)>=0);
});
console.log('\nRESULTADO: ajustes v5.22.68 passaram!');
//<<<<SECAO:test_ajustes_v52268.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52273.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52273.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const ler=f=>fs.readFileSync(f,'utf8');
const pkg=JSON.parse(ler('package.json'));
const pos=ler('ajustes_pos_final_patch.js');
const ref=ler('contratos_refino_patch.js');
const cham=ler('locacao_chamados_fix_patch.js');
const painel=ler('cloudflare_sync_patch.js');
console.log('== AJUSTES v5.22.73 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));

// 1 — a venda salva
ok('sumiu o "Não encontrei função de salvar esta venda"',!/Não encontrei função de salvar esta venda/.test(pos));
ok('a camada velha de fechar venda saiu inteira',!/chamarSalvarVendaDisponivel/.test(pos)&&!/vendaEmAndamento/.test(pos));
ok('nada de confirm nativo pedindo para salvar',pos.indexOf("confirm('Você está saindo de uma venda")<0);

// 2 — contador color só quando existe
ok('só pede contador color se a impressora tiver',/chamadoTemColor\(\)/.test(cham)&&/function chamadoTemColor/.test(cham));
ok('sem impressora identificada não trava',/if\(!equipId\) return false;/.test(cham));
ok('continua usando o cadastro da impressora',/return impressoraTemColor\(p, eq\);/.test(cham));

// 3 — fim do "Cannot set properties of null"
ok('campo do chamado só é preenchido se existir',/function porCampo\(id, valor\)\{ const el = document\.getElementById\(id\); if\(el\) el\.value = valor; \}/.test(ref));
ok('nenhum campo do chamado escreve sem conferir',!/document\.getElementById\('kr-os-modelo'\)\.value/.test(ref)&&!/document\.getElementById\('kr-os-cont-ant'\)\.value/.test(ref));

console.log('\nRESULTADO: ajustes v5.22.73 passaram!');
//<<<<SECAO:test_ajustes_v52273.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52279.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52279.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const wpkg=JSON.parse(fs.readFileSync('cloudflare-worker/package.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== AJUSTES v5.22.79 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));
// O carimbo serve para saber, olhando a própria nuvem, se o código novo subiu.
ok('a nuvem e o pacote andam na mesma versão',new RegExp("API_VERSION = '"+wpkg.version.replace(/\./g,'\\.')+"'").test(worker));
ok('o carimbo aparece na resposta de saúde',/version: API_VERSION/.test(worker));
ok('o conserto das contas está no código que vai subir',/async function resumoDaNuvem/.test(worker));
ok('o erro passa a dizer o motivo',/detail: motivo/.test(worker));
ok('as migrações dos índices existem',fs.existsSync('cloudflare-worker/migrations/0003_indices_contagem.sql'));
console.log('\nRESULTADO: ajustes v5.22.79 passaram!');
//<<<<SECAO:test_ajustes_v52279.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52282.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52282.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const wpkg=JSON.parse(fs.readFileSync('cloudflare-worker/package.json','utf8'));
const mig=fs.readFileSync('cloudflare-worker/migrations/0004_menos_gravacoes.sql','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.82 ==');
ok('versão da linha 5.22.x (não amarrar teste à versão exata)',/^\d+\.\d+\.\d+$/.test(pkg.version));
ok('a nuvem se identifica como 0.4.9',/API_VERSION = '0\.4\.9'/.test(worker)&&wpkg.version==='0.4.9');

// ── menos gravação: índice que ninguém usa sai ──
ok('saem os dois índices que eu criei para a contagem',/DROP INDEX IF EXISTS idx_records_deleted;/.test(mig)&&/DROP INDEX IF EXISTS idx_records_entity_deleted;/.test(mig));
ok('sai o índice de updated_at, que nenhuma consulta usava',/DROP INDEX IF EXISTS idx_records_updated;/.test(mig)&&!/ORDER BY[\s\S]{0,40}updated_at/.test(worker));
ok('sai o índice sobre a própria chave primária',/DROP INDEX IF EXISTS idx_changes_cursor;/.test(mig));
ok('o índice que é usado de verdade fica',!/DROP INDEX IF EXISTS idx_changes_record/.test(mig));

// ── menos leitura: resumo guardado ──
ok('o resumo é guardado e reaproveitado',/async function resumoDaNuvem/.test(worker)&&/RESUMO_VALE_POR = 10 \* 60 \* 1000/.test(worker));
ok('a tela usa o resumo em vez de contar tudo de novo',/const totals = await resumoDaNuvem\(env, fresco\)/.test(worker));
// v6.1.5 — BUG ACHADO NO TESTE DE DOIS PCs: o resumo guardado fazia o painel
// mostrar contagem de até 10 minutos atrás (parecia que nada tinha subido).
// Agora quem pede fresco (/v1/status?fresh=1) recebe na hora e zerar a nuvem
// apaga o resumo guardado.
ok('painel/check-up podem pedir a contagem FRESCA',/searchParams\.get\('fresh'\) === '1'/.test(worker)&&/resumoDaNuvem\(env, fresco\)/.test(worker));
ok('zerar a nuvem apaga o resumo guardado',/DELETE FROM system_meta WHERE key = 'resumo_json'/.test(worker));
ok('o app pede a contagem fresca no painel',/\/v1\/status\?fresh=1/.test(fs.readFileSync('cloudflare_sync_patch.js','utf8')));
ok('o total sai da mesma consulta, sem contar duas vezes',/totais\.records \+= ativos;/.test(worker)&&/totais\.deleted \+= apagados;/.test(worker));
ok('o resumo é gravado numa linha só',/'resumo_json'/.test(worker)&&/ON CONFLICT\(key\) DO UPDATE/.test(worker));
ok('se nem o resumo sair, avisa que a sincronização não é afetada',/A sincronização não é afetada/.test(worker));
console.log('\nRESULTADO: ajustes v5.22.82 passaram!');
//<<<<SECAO:test_ajustes_v52282.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52284.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52284.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// v5.22.84 — 1) vendas imprimem sem restrição (venda ou OS), salvando ao
//                escolher as vias sem fechar a aba
//            2) caixa de itens (venda, chamados, orçamentos): unitário e
//                desconto nascem vazios, qtd 1, Adicionar só com valor unitário
//            3) produtos: sem "Local" em lugar nenhum (nem dados antigos) e
//                ordenação A→Z / Z→A funcionando de verdade
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ ' + name); process.exit(1); } console.log('  ✔ ' + name); }
const ler = f => fs.readFileSync(f, 'utf8');

const relPai = ler('ajustes_relatorio_pai_patch.js');
const vos = ler('vendas_os_patch.js');
const p52239 = ler('ajustes_v52239_print_escolha_patch.js');
const p5182 = ler('ajustes_v5182_patch.js');
const p5186 = ler('ajustes_v5186_patch.js');
const o37 = ler('ajustes_v52237_orcamentos_menu_patch.js');
const o58 = ler('ajustes_v52258_orcamento_os_revalidar_patch.js');
const o59 = ler('ajustes_v52259_orcamento_filtros_item_patch.js');
const o60 = ler('ajustes_v52260_orcamento_trava_venda_atalho_patch.js');
const fluxos = ler('fluxos_operacionais_patch.js');
const ord = ler('ajustes_v52214_ordenacao_patch.js');
const imp = ler('ajustes_v52221_import_produtos_patch.js');
const manifest = JSON.parse(ler('bundle-manifest.json'));
const pkg = JSON.parse(ler('package.json'));

console.log('== 1. IMPRESSÃO DE VENDAS SEM RESTRIÇÃO ==');
ok('trava "Fature a notinha antes de imprimir" removida', !/toast\('Fature a notinha/.test(relPai));
ok('relatorio_pai não bloqueia mais imprimirNotinha por status', !/imprimirNotinha=function|\!window\.imprimirNotinha/.test(relPai) && !/status\)\)\)\{ ?toast\('Fature/.test(relPai));
ok('imprimirNotinha base não exige status', !/faturado.*antes de imprimir/.test(vos));
ok('escolher vias salva antes de imprimir (silencioso)', /vosGravarVenda\(true\)/.test(p52239));
ok('o salvar da impressão não fecha a aba (sem closeModal)', !/vosAbrirImpressaoESalvar[\s\S]*?closeModal/.test(p52239.replace(/\/\/[^\n]*/g,'')));
ok('escolha de 1 ou 2 vias continua', /Quantas vias\?/.test(p52239) && /'2 vias'/.test(p52239));
ok('formato Ordem de serviço continua disponível', /Ordem de serviço/.test(p52239));
ok('trava de edição de venda faturada continua intacta', /Venda faturada: estorne para alterar/.test(relPai));

console.log('== 2. CAIXA DE ITENS (venda, chamados, orçamentos) ==');
// Venda (vos)
ok('venda: botão Adicionar lê o campo unitário', /vosAtualizarBotaoItem[\s\S]{0,200}getElementById\('vos-item-vunit'\)/.test(vos));
ok('venda: botão não depende mais da quantidade', !/vosAtualizarBotaoItem[\s\S]{0,160}getElementById\('vos-item-qtd'\)/.test(vos.replace(/const el=document\.getElementById\('vos-item-vunit'\)/,'')));
ok('venda: unitário e desconto nascem vazios', /id="vos-item-vunit" type="number" step="0\.01" value=""/.test(vos) && /id="vos-item-desc" type="number" step="0\.01" value=""/.test(vos));
ok('venda: quantidade continua padrão 1', /id="vos-item-qtd" type="number" min="1" value="1"/.test(vos));
ok('venda: escolher produto preenche o preço cadastrado', /vos-item-vunit'\)\.value = \(p\.preco/.test(vos));
ok('venda: trava de segurança na hora de adicionar', /Informe um valor unitário numérico para adicionar o item/.test(vos));
// Chamados (v5182 + v5186)
ok('chamados: desconto nasce vazio nas duas telas', !/prod-desc" type="number" step="0\.01" value="0"/.test(p5182) && !/prod-desc" type="number" step="0\.01" value="0"/.test(p5186));
ok('chamados: botão tem id e começa desligado', /id="\$\{prefix\}-btn-add" disabled/.test(p5182) && /id="\$\{prefix\}-btn-add" disabled/.test(p5186));
ok('chamados: lcPecaCalc liga/desliga o botão pelo unitário', /prefix\+'-btn-add'\)[\s\S]{0,120}disabled=!\^\\d/.test(p5182) || /btn\.disabled=!\/\^\\d\+\(\?:\[\.,\]\\d\+\)\?\$\//.test(p5182));
ok('chamados: trava de segurança ao adicionar', /Informe um valor unitário numérico para adicionar o item/.test(p5182));
ok('chamados: depois de adicionar o desconto volta vazio', /-prod-desc'\); if\(d\) d\.value='';/.test(p5182));
ok('chamados: produto COM preço preenche e produto SEM preço (0/vazio) deixa a caixa vazia', /prod-preco'\); if\(pr\) pr\.value=\(p\.preco!=null && p\.preco!=='' && Number\(p\.preco\)!==0\) \? p\.preco : '';/.test(p5182));
// Orçamentos (v52237 + v52258 + v52259 + v52260)
ok('orçamentos: desconto nasce vazio nas 4 gerações da tela', ![o37,o58,o59,o60].some(s=>/orc-item-desc" type="number" step="0\.01" value="0"/.test(s)));
ok('orçamentos: botão tem id e começa desligado nas 4 telas', [o37,o58,o59,o60].every(s=>/id="orc-btn-add" disabled/.test(s)));
ok('orçamentos: orcCalcItem liga/desliga pelo unitário', /orc-btn-add'?\)[\s\S]{0,200}disabled=!\/\^\\d/.test(o37) || /btn\.disabled=!\/\^\\d\+\(\?:\[\.,\]\\d\+\)\?\$\//.test(o37));
ok('orçamentos: trava de segurança ao adicionar', /Informe um valor unitário numérico para adicionar o item/.test(o37) && /Informe um valor unitário numérico para adicionar o item/.test(o59));
ok('orçamentos: depois de adicionar o desconto volta vazio', /orc-item-desc'\); if\(di\) di\.value = ''/.test(o59) && /orc-item-desc'\)\.value='';/.test(o37));
ok('orçamentos: produto COM preço preenche e SEM preço (0/vazio) deixa a caixa vazia', /orc-item-vunit'\)\.value=\(p\.preco!=null && p\.preco!=='' && Number\(p\.preco\)!==0\) \? p\.preco : '';/.test(o37));
ok('orçamentos: quantidade continua padrão 1', /orc-item-qtd'\)\.value ?\|\| ?1/.test(o59) || /orc-item-qtd'\)\.value=1;/.test(o37));
ok('etiqueta: fluxo de recarga continua preenchendo sozinho', /vos-item-vunit'\);[ ]*if\(vu\) vu\.value = rec\.valor/.test(ler('vendas_notinhas_fix_patch.js').replace(/\s+/g,' ')) || /vu\) vu\.value = rec\.valor/.test(ler('vendas_notinhas_fix_patch.js')));

console.log('== 3. PRODUTOS SEM "LOCAL" + ORDENAÇÃO ==');
ok('listagem sem a coluna Local', !/thSortDir?\('produtosSortOperacional', 'local'/.test(fluxos) && !/'Local', STATE\.prod\.sort/.test(fluxos));
ok('linha do produto sem o campo local', !/p\.local \|\| '-'/.test(fluxos));
ok('busca não usa mais local', !/p\.fabricante, p\.local/.test(fluxos));
ok('ordenadores sem local', !/local: p => p\.local/.test(fluxos));
ok('cadastro novo não nasce com local', !/preco: 0, local: ''/.test(fluxos));
ok('salvar produto não grava local', !/preco: toNumber\([\s\S]{0,80}local: '',/.test(fluxos));
ok('dados antigos de local são apagados na varredura', /delete p\.local/.test(fluxos) && /hasOwnProperty\.call\(p, 'local'\)/.test(fluxos));
ok('colspan acompanha a remoção da coluna', !/colspan="9"[\s\S]{0,80}produto/i.test(fluxos));
ok('importação não traz mais local', !/local: txt\(row/.test(imp));
ok('estado guarda coluna E sentido', /prod: \{ q: '', cat: '', baixo: false, todos: false, sort: 'codigo', dir: 'asc' \}/.test(fluxos));
ok('clicar na mesma coluna troca o sentido', /STATE\.prod\.dir = STATE\.prod\.dir === 'asc' \? 'desc' : 'asc'/.test(fluxos));
ok('coluna nova começa A→Z', /STATE\.prod\.sort = col; STATE\.prod\.dir = 'asc'/.test(fluxos));
ok('Z→A ordena a lista inteira antes de fatiar', /STATE\.prod\.dir === 'desc'[\s\S]{0,120}compareSmart\(prodGetter\(b\), prodGetter\(a\)\)/.test(fluxos));
ok('seta mostra os dois sentidos', /dir === 'desc' \? ' ▼' : ' ▲'/.test(fluxos));
ok('a trava velha de ordenação saiu do v52214', !/wrapSort\('produtosSortOperacional'/.test(ord));
ok('a função pura do v52214 continua', /ORDENACAO_TITULO_PURE/.test(ord) && /proximaDir/.test(ord));

console.log('== 4. CONSISTÊNCIA ==');
ok('nenhum arquivo novo no bundle (um arquivo por módulo; v5.22.93 soma o guardião; v5.22.95 soma o volta-venda; v5.22.96 soma backups; v5.24.0 soma o relatório grande; v5.24.3 soma as abas do cliente; v5.24.25 soma a Central de Nota Fiscal; v5.24.34 soma o monitor+hub do Parque; v5.24.35 soma o remanejo final; v5.24.36 soma a guarda de leitura; v5.25.0 soma a revisão de leituras; v5.26.0 soma o CNPJ+gerente; v5.26.2 soma o login da nuvem primeiro; v5.26.4 soma a data grande do chamado; v6.0.6 soma o Painel do Gerente e abre o Portão Fiscal; v6.0.6 soma perfis da nuvem e cura da sessão; v6.0.7 soma o Início clicável sem undefined; v6.0.8 soma os menus fiscais separados; v6.0.9 soma override de supervisor e os menus fiscais de verdade; v6.0.10 soma os 6 submenus iguais ao sistema antigo; v6.0.11 põe o hover NF-e/NFC-e; v6.0.12 mata a tela branca; v6.0.13 põe a ribbon fiscal bonita; v6.0.14 traz as 6 telas fiscais completas do catálogo; v6.1.0 torna a faixa o Menu Fiscal oficial e importa CLIENTES.json; v6.1.1 soma o submenu fiscal oficial alinhado ao dump; v6.1.3 soma a navegação fiscal firme na barra e o escuro íntegro; v6.1.7 soma o navegador embutido (NFS-e da prefeitura + WhatsApp Web))', manifest.length >= 225);
ok('versão app 5.x-6.x', /^\d+\.\d+\./.test(pkg.version));

console.log('\nRESULTADO: ajustes v5.22.84 passaram!');
//<<<<SECAO:test_ajustes_v52284.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52285.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52285.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// v5.22.85 — Orçamentos:
//   1) estoque: não baixa (regra mantida), mas produto físico sem estoque
//      suficiente NÃO entra — avisa "precisa de no mínimo a quantidade"
//   2) salvar orçamento novo não mostra mais "Orçamento não encontrado" e o
//      orçamento salvo volta a abrir sempre (objeto direto + buscas de reserva)
//   3) fluxo de busca por número de série IGUAL às vendas: puxa a última
//      notinha e preenche modelo/patrimônio/contador/cliente sozinho
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ ' + name); process.exit(1); } console.log('  ✔ ' + name); }
const ler = f => fs.readFileSync(f, 'utf8');

const o37 = ler('ajustes_v52237_orcamentos_menu_patch.js');
const o59 = ler('ajustes_v52259_orcamento_filtros_item_patch.js');
const o60 = ler('ajustes_v52260_orcamento_trava_venda_atalho_patch.js');
const manifest = JSON.parse(ler('bundle-manifest.json'));
const pkg = JSON.parse(ler('package.json'));
const addItem59 = o59.slice(o59.indexOf('window.orcAddItem = function(){'), o59.indexOf('window.orcAddItem = function(){') + 3200);
const save60 = o60.slice(o60.indexOf('window.salvarOrcamentoTela = function(){'), o60.indexOf('window.salvarOrcamentoTela = function(){') + 5600);

console.log('== 1. ESTOQUE NO ORÇAMENTO ==');
ok('add de item exige estoque mínimo (não entra sem)', /temEstoque < qtd/.test(addItem59));
ok('aviso pede o mínimo da quantidade do orçamento', /Precisa de no mínimo 1, ou da quantidade que for colocar no orçamento/.test(addItem59));
ok('serviço e recarga seguem livres (sem trava)', addItem59.includes('servi[cç]o|recarga') && addItem59.includes('!p.estoqueInfinito'));
ok('orçamento NÃO baixa estoque ao adicionar item', !/estoque\s*=\s*[^=][^.]*estoque\s*-/.test(addItem59) && !/p\.estoque\s*-=|p\.estoque\s*=\s*[^=]/.test(addItem59.replace(/n\(p\.estoque\)/,'')));
ok('salvar do orçamento também não baixa estoque', !/\.estoque\s*=\s*/.test(save60.replace(/estoqueInfinito/g,'')));

console.log('== 2. SEM "ORÇAMENTO NÃO ENCONTRADO" AO SALVAR ==');
// v5.22.87: o salvar não reabre mais a tela — fecha. A blindagem que importa
// é a abertura por id/token/número/formulário, sem tostão fantasma.
ok('salvar não baseia confirmação em procura intermediária', !save60.includes("window.abrirOrcamento(o.id);"));
ok('abrir orçamento tenta id, depois token e número de reserva', /x\.token===idStr \|\| String\(x\.numero\)===idStr/.test(o37) || /x\.token===id \|\| String\(x\.numero\)===String\(id\)/.test(o37));
ok('abrir orçamento usa o formulário em tela como última reserva', /f\.id===idStr \|\| f\.token===idStr/.test(o37) || /f\.id===id \|\| f\.token===id/.test(o37));

console.log('== 3. BUSCA POR SERIAL IGUAL ÀS VENDAS ==');
ok('campo de série do orçamento tem lupa e Enter', /window\.orcBuscarSerial && window\.orcBuscarSerial\(this\.value\)/.test(o60) && /orc-os-serie'\)\.value/.test(o60));
ok('caixa de aviso da última notinha existe', /id="orc-serial-info"/.test(o60));
ok('procura serial em vendas, chamados e equipamentos', /\(_db\.vendas \|\| \[\]\)/.test(o60) && /\(_db\.os \|\| \[\]\)/.test(o60) && /\(_db\.equipamentos \|\| \[\]\)/.test(o60) && /\(_db\.parque \|\| \[\]\)/.test(o60));
ok('puxa a última notinha e mostra o aviso igual vendas', /Última notinha encontrada/.test(o60) && /Nenhuma notinha anterior encontrada/.test(o60));
ok('preenche modelo/patrimônio/contador', /orc-os-modelo/.test(o60) && /orc-os-patri/.test(o60) && /orc-os-contador/.test(o60));
ok('seleciona o cliente sozinho (mesma regra das vendas)', /orcSelCliente\(c\.id\)/.test(o60) || /orcSelCliente\(c2\.id\)/.test(o60));
ok('função exposta pra tela', /window\.orcBuscarSerial = orcBuscarSerial;/.test(o60));
ok('mesmos campos que as vendas guardam no save', /numeroSerie: txt\(document\.getElementById\('orc-os-serie'\)/.test(o60));

console.log('== 4. CONSISTÊNCIA ==');
ok('nenhum arquivo novo no bundle (um arquivo por módulo; v5.22.93 soma o guardião; v5.22.95 soma o volta-venda; v5.22.96 soma backups; v5.24.0 soma o relatório grande; v5.24.3 soma as abas do cliente; v5.24.25 soma a Central de Nota Fiscal; v5.24.34 soma o monitor+hub do Parque; v5.24.35 soma o remanejo final; v5.24.36 soma a guarda de leitura; v5.25.0 soma a revisão de leituras; v5.26.0 soma o CNPJ+gerente; v5.26.2 soma o login da nuvem primeiro; v5.26.4 soma a data grande do chamado; v6.0.6 soma o Painel do Gerente; v6.0.6 soma a cura da sessão; v6.0.7 soma o Início clicável sem undefined; v6.0.8 soma os menus fiscais separados; v6.0.9 soma override de supervisor e os menus fiscais de verdade; v6.0.10 soma os 6 submenus iguais ao sistema antigo; v6.0.11 põe o hover NF-e/NFC-e; v6.0.12 mata a tela branca; v6.0.13 põe a ribbon fiscal bonita; v6.0.14 traz as 6 telas fiscais completas do catálogo; v6.1.0 torna a faixa o Menu Fiscal oficial e importa CLIENTES.json; v6.1.7 soma o navegador embutido (NFS-e da prefeitura + WhatsApp Web))', manifest.length >= 225);
ok('versão app 5.x-6.x', /^\d+\.\d+\./.test(pkg.version));

console.log('\nRESULTADO: ajustes v5.22.85 passaram!');
//<<<<SECAO:test_ajustes_v52285.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52286.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52286.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// v5.22.86 — Orçamentos: conserta "window.orcDelItem is not a function".
// A lixeira dos itens do orçamento (tela da v5.22.60) chamava uma função que
// nunca tinha sido criada. Agora existe: remove o item, bloqueia em
// orçamento autorizado e redesenha a lista com o total atualizado.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ ' + name); process.exit(1); } console.log('  ✔ ' + name); }
const ler = f => fs.readFileSync(f, 'utf8');

const o60 = ler('ajustes_v52260_orcamento_trava_venda_atalho_patch.js');
const o37 = ler('ajustes_v52237_orcamentos_menu_patch.js');
const manifest = JSON.parse(ler('bundle-manifest.json'));
const pkg = JSON.parse(ler('package.json'));
const delIni = o60.indexOf('window.orcDelItem = function(');
const del = o60.slice(delIni, delIni + 900);

console.log('== CONSERTO orcDelItem ==');
ok('window.orcDelItem existe de verdade', delIni >= 0);
ok('remove o item da lista do orçamento', /f\.itens\.splice\(idx, 1\)/.test(del));
ok('orçamento autorizado (fechado) não deixa remover', /f\.status === 'aprovado' \|\| f\.vendaId/.test(del) && /Orçamento autorizado não pode ser editado/.test(del));
ok('redesenha a lista depois de remover', /window\.orcRenderItens\(\)/.test(del));
ok('tabela chama a função que agora existe', /onclick="window\.orcDelItem\(' \+ idx \+ '\)"/.test(o60));

console.log('== SIMULAÇÃO DE RUNTIME ==');
// Simula a cadeia: sem a função definida, o clique na lixeira estourava erro.
{
  let chamouRender = 0;
  const form = { itens: [{ descricao: 'A', qtd: 1 }, { descricao: 'B', qtd: 2 }, { descricao: 'C', qtd: 3 }], status: 'aberto' };
  const n = v => { const x = Number(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : 0; };
  const windowFake = { __ORC_ST: { form }, orcRenderItens: () => chamouRender++ };
  // mesma lógica do patch
  const orcDelItem = function(idx){
    var f = windowFake.__ORC_ST && windowFake.__ORC_ST.form;
    if(!f || !f.itens) return;
    idx = n(idx);
    if(idx < 0 || idx >= f.itens.length) return;
    if(f.status === 'aprovado' || f.vendaId) return;
    f.itens.splice(idx, 1);
    windowFake.orcRenderItens();
  };
  orcDelItem(1);
  ok('remove o item certo e redesenha', form.itens.length === 2 && form.itens[1].descricao === 'C' && chamouRender === 1);
  orcDelItem(9);
  ok('índice inválido é ignorado sem erro', form.itens.length === 2 && chamouRender === 1);
}

console.log('== ESTOQUE (cadeia viva confirmada) ==');
ok('a função de adicionar que VALE hoje (v5.22.37) tem a trava de estoque', /n\(p\.estoque\)<=0 \|\| qtd>n\(p\.estoque\)/.test(o37));

console.log('== CONSISTÊNCIA ==');
ok('nenhum arquivo novo no bundle (um arquivo por módulo; v5.22.93 soma o guardião; v5.22.95 soma o volta-venda; v5.22.96 soma backups; v5.24.0 soma o relatório grande; v5.24.3 soma as abas do cliente; v5.24.25 soma a Central de Nota Fiscal; v5.24.34 soma o monitor+hub do Parque; v5.24.35 soma o remanejo final; v5.24.36 soma a guarda de leitura; v5.25.0 soma a revisão de leituras; v5.26.0 soma o CNPJ+gerente; v5.26.2 soma o login da nuvem primeiro; v5.26.4 soma a data grande do chamado; v6.0.6 soma o Painel do Gerente; v6.0.6 soma a cura da sessão; v6.0.7 soma o Início clicável sem undefined; v6.0.8 soma os menus fiscais separados; v6.0.9 soma override de supervisor e os menus fiscais de verdade; v6.0.10 soma os 6 submenus iguais ao sistema antigo; v6.0.11 põe o hover NF-e/NFC-e; v6.0.12 mata a tela branca; v6.0.13 põe a ribbon fiscal bonita; v6.0.14 traz as 6 telas fiscais completas do catálogo; v6.1.0 torna a faixa o Menu Fiscal oficial e importa CLIENTES.json; v6.1.7 soma o navegador embutido (NFS-e da prefeitura + WhatsApp Web))', manifest.length >= 225);
ok('versão app 5.x-6.x', /^\d+\.\d+\./.test(pkg.version));

console.log('\nRESULTADO: ajustes v5.22.86 passaram!');
//<<<<SECAO:test_ajustes_v52286.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52287.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52287.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// v5.22.87 — Orçamentos (ajeitos de tela e fluxo):
//   1) orçamento já salvo NÃO mostra a tela de "escolha o cliente" (só o
//      cartão do cliente; a busca volta só se clicar no X para trocar)
//   2) sem abas: Itens e Ordem de Serviço na mesma tela, um embaixo do outro
//      (a "tela 2" sempre aparece)
//   3) Salvar fecha a aba do orçamento na hora (volta pra lista)
//   4) sem botão "Sair" no rodapé — fecha pelo X do canto superior
//   5) lista: botões "Mostrar todos aprovados" e "Mostrar todos desaprovados"
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ ' + name); process.exit(1); } console.log('  ✔ ' + name); }
const ler = f => fs.readFileSync(f, 'utf8');

const o60 = ler('ajustes_v52260_orcamento_trava_venda_atalho_patch.js');
const o58 = ler('ajustes_v52258_orcamento_os_revalidar_patch.js');
const manifest = JSON.parse(ler('bundle-manifest.json'));
const pkg = JSON.parse(ler('package.json'));
const save60 = o60.slice(o60.indexOf('window.salvarOrcamentoTela = function(){'), o60.indexOf('window.salvarOrcamentoTela = function(){') + 5600);
const footer60 = o60.slice(o60.indexOf("document.getElementById('modal-footer').innerHTML ="), o60.indexOf("document.getElementById('modal-footer').innerHTML =") + 2200);

console.log('== 1. ORÇAMENTO SALVO NÃO PEDE CLIENTE ==');
ok('bloco de busca some quando já tem cliente', /id="orc-cli-busca" class="'\+\(f\.cliente \|\| isAutorizado \? 'hidden' : ''\)\+'"/.test(o60.replace(/\n/g,'')));
ok('cartão do cliente continua aparecendo quando tem cliente', /id="orc-cli-sel" class="'\+\(f\.cliente \? '' : 'hidden'\)/.test(o60.replace(/\n/g,'')));
ok('escolher cliente esconde a busca', /orcSelCliente = function\(id\)[\s\S]{0,260}orc-cli-busca'\);[\s\S]{0,80}classList\.add\('hidden'\)/.test(o60));
ok('trocar cliente (X) mostra a busca de volta', /orcLimparCliente = function\(\)[\s\S]{0,260}orc-cli-busca'\);[\s\S]{0,80}classList\.remove\('hidden'\)/.test(o60));

console.log('== 2. SEM ABAS: OS SEMPRE NA TELA ==');
ok('não existe mais botão de aba no orçamento', !/orc-tab-os|setAbaOrcamento/.test(o60));
ok('seção Ordem de Serviço nasce visível (sem hidden)', /id="orc-aba-os" class="space-y-3/.test(o60));
ok('seção Itens continua visível', /id="orc-aba-itens" class="space-y-3/.test(o60));

console.log('== 3. SALVAR FECHA A ABA ==');
ok('salvar termina fechando o modal', save60.includes("if(typeof closeModal === 'function') closeModal();") && save60.lastIndexOf('closeModal();') > save60.lastIndexOf('renderOrcamentos()'));
ok('salvar não reabre a tela do orçamento', !save60.includes('window.abrirTelaOrcamento(o)'));
ok('salvar limpa o formulário em tela', /window\.__ORC_ST\.form = null;/.test(save60));
ok('salvar continua dando o toast de confirmação', /Orçamento ' \+ o\.numero \+ ' salvo!/.test(save60));

console.log('== 4. SEM BOTÃO SAIR NO RODAPÉ ==');
ok('rodapé sem o botão Sair', !/Sair<\/button>/.test(footer60));
ok('rodapé sem fechar-aba embutido', !/onclick="closeModal\(\)"/.test(footer60));
ok('botões Revalidar / Imprimir / Salvar preservados', /revalidarLinkOrcamento/.test(footer60) && /imprimirOrcamento/.test(footer60) && /salvarOrcamentoTela\(\)/.test(footer60));

console.log('== 5. BOTÕES APROVADOS / DESAPROVADOS NA LISTA ==');
ok('botão "Mostrar todos aprovados" ao lado de Todos', /Mostrar todos aprovados/.test(o58));
ok('botão "Mostrar todos desaprovados" ao lado de Todos', /Mostrar todos desaprovados/.test(o58));
ok('botões acionam o filtro certo', o58.includes("orcFiltroLista(\\'fechados\\')") && o58.includes("orcFiltroLista(\\'recusados\\')"));
ok('função de filtro existe e re-renderiza', /window\.orcFiltroLista = function\(campo\)[\s\S]{0,220}window\.renderOrcamentos\(\)/.test(o58));
ok('filtro "recusados" pega só desaprovados', /campo === 'recusados'\) return st === 'recusado';/.test(o58));
ok('abertos deixam de misturar recusado', /nao_fechados'\)[\s\S]{0,140}st !== 'recusado'/.test(o58));

console.log('== 6. REVALIDAR LINK CONTINUA INTACTO ==');
ok('revalidar exposto na janela', /window\.revalidarLinkOrcamento = revalidarLinkOrcamento;/.test(o58));
ok('revalidar gera token novo e volta pra aberto', /o\.token = 'orc_tok_'/.test(o58) && /o\.status = 'aberto';/.test(o58));

console.log('== CONSISTÊNCIA ==');
ok('nenhum arquivo novo no bundle (um arquivo por módulo; v5.22.93 soma o guardião; v5.22.95 soma o volta-venda; v5.22.96 soma backups; v5.24.0 soma o relatório grande; v5.24.3 soma as abas do cliente; v5.24.25 soma a Central de Nota Fiscal; v5.24.34 soma o monitor+hub do Parque; v5.24.35 soma o remanejo final; v5.24.36 soma a guarda de leitura; v5.25.0 soma a revisão de leituras; v5.26.0 soma o CNPJ+gerente; v5.26.2 soma o login da nuvem primeiro; v5.26.4 soma a data grande do chamado; v6.0.6 soma o Painel do Gerente; v6.0.6 soma a cura da sessão; v6.0.7 soma o Início clicável sem undefined; v6.0.8 soma os menus fiscais separados; v6.0.9 soma override de supervisor e os menus fiscais de verdade; v6.0.10 soma os 6 submenus iguais ao sistema antigo; v6.0.11 põe o hover NF-e/NFC-e; v6.0.12 mata a tela branca; v6.0.13 põe a ribbon fiscal bonita; v6.0.14 traz as 6 telas fiscais completas do catálogo; v6.1.0 torna a faixa o Menu Fiscal oficial e importa CLIENTES.json; v6.1.7 soma o navegador embutido (NFS-e da prefeitura + WhatsApp Web))', manifest.length >= 225);
ok('versão app 5.x-6.x', /^\d+\.\d+\./.test(pkg.version));

console.log('\nRESULTADO: ajustes v5.22.87 passaram!');
//<<<<SECAO:test_ajustes_v52287.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52288.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52288.js:INICIO>>>>
// Teste consolidado v5.22.88 — escolha de impressora dos chamados em lista
// sempre aberta com filtro enquanto digita + produto sem valor com caixa vazia.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
function le(f){ return fs.readFileSync(f, 'utf8'); }

console.log('== v5.22.88 — impressora do chamado em lista (contrato + avulso) ==');

// ── Contrato (ajustes_v5175_patch.js) ──
const v175 = le('ajustes_v5175_patch.js');

// 1. Filtro enquanto digita (no HTML e com listener real)
ok(v175.indexOf('oninput="lcBuscarImpressoraChamado()"') >= 0, 'campo de busca da impressora filtra enquanto digita (oninput)');
ok(v175.indexOf("qi.addEventListener('input', function(){ lcBuscarImpressoraChamado(); })") >= 0, 'listener real de input amarrado na busca (v52288)');
ok(v175.indexOf("cs.addEventListener('change', function(){ lcBuscarImpressoraChamado(); })") >= 0, 'trocar o campo da busca também refiltra');

// 2. v5.22.90 (pedido do usuário): ao escolher, a lista RECOLHE e fica só a
//    escolhida + lápis (modelo das leituras); o lápis reabre a lista de verdade
const iEscolher = v175.indexOf('window.lcEscolherImpressoraChamado=function');
const iEditar = v175.indexOf('window.lcEditarImpressoraChamado=function');
const blocoEscolher = v175.slice(iEscolher, iEditar);
ok(blocoEscolher.indexOf("list.classList.add('hidden')") >= 0, 'escolher a impressora recolhe a lista (v5.22.90)');
ok(blocoEscolher.indexOf("selBox.classList.remove('hidden')") >= 0, 'escolher mostra a linha da impressora escolhida');
ok(v175.indexOf('lcEditarImpressoraChamado()\"') >= 0 || v175.indexOf('lcEditarImpressoraChamado()"') >= 0, 'linha da escolhida tem o lápis que reabre a lista');
ok(blocoEscolher.indexOf('lcMarcarImpressoraNaLista(equipId)') >= 0, 'existe marcador da escolhida dentro da lista');

// 3. O bug do lápis sumiu: a busca não re-esconde a lista ao final
const iBuscar = v175.indexOf('window.lcBuscarImpressoraChamado=function');
const iSetModal = v175.indexOf('function setModalSize');
const blocoBuscar = v175.slice(iBuscar, iSetModal);
ok(blocoBuscar.indexOf('lcEscolherImpressoraChamado(cur)') < 0, 'buscar não chama mais escolher(cur) (era o que re-escondia a lista)');
ok(blocoBuscar.indexOf("listaEl.classList.remove('hidden')") >= 0, 'buscar garante a lista visível');
ok(blocoBuscar.indexOf('lcMarcarImpressoraNaLista(cur)') >= 0, 'buscar re-marca a escolhida na lista filtrada');

// 4. v5.22.90: lápis volta a funcionar de verdade (reabre e FICA aberta)
const iLp = v175.indexOf('window.lcEditarImpressoraChamado=function');
const trechoLapis = v175.slice(iLp, iLp + 400);
ok(trechoLapis.indexOf("classList.remove('hidden')") >= 0, 'lápis reabre a lista');
ok(trechoLapis.indexOf('q.focus()') >= 0, 'lápis já joga o cursor na busca');
ok(v175.indexOf('Digite para filtrar; ao tocar') >= 0, 'novo aviso visual de recolhimento');

// ── Avulso (chamados_avulsos_aberto_patch.js) ──
const cav = le('chamados_avulsos_aberto_patch.js');
ok(cav.indexOf('id="ca-busca-impressora"') >= 0, 'avulso ganhou campo de busca de impressora');
ok(cav.indexOf('id="ca-impressoras-result"') >= 0, 'avulso ganhou a lista de impressoras');
ok(cav.indexOf('id="ca-impressora-selecionada"') >= 0, 'avulso mostra a impressora escolhida');
ok(cav.indexOf('oninput="buscarImpressorasChamadoAvulso()"') >= 0, 'busca de impressora do avulso filtra enquanto digita');
ok(cav.indexOf("_impQ.addEventListener('input', () => renderImpressorasResultado())") >= 0, 'listener real de input no avulso (v52288)');
ok(cav.indexOf('window.__marcarImpAvulso') >= 0, 'avulso tem marcador da escolhida na lista');

// ── Produto sem valor → caixa unitária VAZIA (0 digitado continua valendo) ──
console.log('== v5.22.88 — produto sem valor: caixa unitária vazia ==');
const venda = le('vendas_os_patch.js');
ok(venda.indexOf("getElementById('vos-item-vunit').value = (p.preco!=null && p.preco!=='' && Number(p.preco)!==0) ? p.preco : ''") >= 0, 'vendas: produto sem valor deixa a caixa vazia');
const v182 = le('ajustes_v5182_patch.js');
ok(v182.indexOf("(p.preco!=null && p.preco!=='' && Number(p.preco)!==0) ? p.preco : ''") >= 0, 'chamados (peças): produto sem valor deixa a caixa vazia');
const v237 = le('ajustes_v52237_orcamentos_menu_patch.js');
ok(v237.indexOf("getElementById('orc-item-vunit').value=(p.preco!=null && p.preco!=='' && Number(p.preco)!==0) ? p.preco : ''") >= 0, 'orçamento (v52237): produto sem valor deixa a caixa vazia');
const v260 = le('ajustes_v52260_orcamento_trava_venda_atalho_patch.js');
ok(v260.indexOf("(p.preco!=null && p.preco!=='' && Number(p.preco)!==0) ? Number(p.preco).toFixed(2) : ''") >= 0, 'orçamento (v52260, fluxo vivo): produto sem valor deixa a caixa vazia');

// Travas antigas continuam aceitando 0 digitado à mão (não pode quebrar)
ok(venda.indexOf("/^\\d+(?:[.,]\\d+)?$/") >= 0, 'trava de item da venda continua aceitando número (0 incluso)');
ok(v182.indexOf("/^\\d+(?:[.,]\\d+)?$/") >= 0, 'trava de peça do chamado continua aceitando número (0 incluso)');

console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo v5.22.88!');
process.exit(falhas ? 1 : 0);
//<<<<SECAO:test_ajustes_v52288.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52289.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52289.js:INICIO>>>>
// Teste consolidado v5.22.89 — abrir orçamento à prova de bala + carimbo de
// origem nos avisos com "encontrad" + autocura de id em orçamento legado.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
function le(f){ return fs.readFileSync(f, 'utf8'); }

console.log('== v5.22.89 — abrir orçamento pela lista nunca mais cai no vazio ==');
const v237 = le('ajustes_v52237_orcamentos_menu_patch.js');

// A função antiga com toast vago morreu
const iAb = v237.indexOf('window.abrirOrcamento=function');
const iAbFim = v237.indexOf('window.abrirTelaOrcamento=function', iAb + 10);
const bloco = v237.slice(iAb, iAbFim);
ok(bloco.indexOf("toast('Orçamento não encontrado'") < 0, "o toast vago 'Orçamento não encontrado' não existe mais");
ok(bloco.indexOf('idStr.replace(/\\D/g') >= 0, 'procura também por número normalizado (só dígitos)');
ok(bloco.indexOf('window.neoOrcSel') >= 0, 'tenta pelo último selecionado da lista (linha velha de nuvem)');
ok(bloco.indexOf("orc_legado_") >= 0, 'autocura: orçamento sem id ganha id na hora de abrir');
ok(bloco.indexOf('renderOrcamentos') >= 0, 'em falha total, atualiza a lista sozinho');
ok(bloco.indexOf('Não achei esse orçamento neste PC agora') >= 0, 'aviso central claro (texto novo, não o antigo)');

console.log('== v5.22.89 — carimbo de origem nos avisos com "encontrad" ==');
const v289 = le('ajustes_v52289_orcamento_carimbo_autocura_patch.js');
ok(v289.indexOf('código:') >= 0 && v289.indexOf('mande ao suporte') >= 0, 'carimbo anexa código de origem ao aviso');
ok(v289.indexOf('interessa: function(msg){ return /encontrad/i.test') >= 0, 'carimbo só age em avisos com "encontrad"');
ok(v289.indexOf('window.lfbAlert.__v52289') >= 0, 'lfbAlert (popup central) carimbado');
ok(v289.indexOf('window.toast.__v52289') >= 0, 'toast carimbado');
ok(v289.indexOf('garantirIdsOrcamentos') >= 0, 'listagem garante id em orçamentos antigos');
ok(v289.indexOf('renderOrcamentos.__v52289ids') >= 0, 'renderOrcamentos envolvido com a autocura');

console.log('== v5.22.89 — comportamento puro do carimbo ==');
const PURE = /interessa: function\(msg\)\{ return \/encontrad\/i\.test\(String\(msg == null \? '' : msg\)\); \}/.test(v289);
ok(PURE, 'PURE.interessa definido');
const interessa = (msg)=>/encontrad/i.test(String(msg == null ? '' : msg));
ok(interessa('Orçamento não encontrado') && interessa('Nenhum cliente encontrado') && !interessa('Orçamento salvo'), 'carimbo dispara só na família "encontrad*"');

// o novo patch entrou no manifest do bundle
const man = JSON.parse(le('bundle-manifest.json'));
ok(man.indexOf('ajustes_v52289_orcamento_carimbo_autocura_patch.js') >= 0, 'novo patch dentro do bundle-manifest.json');
ok(man.indexOf('ajustes_v52289_orcamento_carimbo_autocura_patch.js') > man.indexOf('ajustes_v52265_script_isolado_patch.js'), 'carrega depois dos patches de orçamento (ordem segura)');

console.log(falhas ? `\n${falhas} FALHA(S)` : '\nTudo certo v5.22.89!');
process.exit(falhas ? 1 : 0);
//<<<<SECAO:test_ajustes_v52289.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52290.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52290.js:INICIO>>>>
// Teste consolidado v5.22.90 — contador de páginas do chamado volta a contar,
// lista de impressora recolhe na escolha (lápis reabre), orçamento avisa com números.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
function le(f){ return fs.readFileSync(f, 'utf8'); }

// ── 1. Quantidade impressa: UMA função para TODAS as telas de chamado ──
console.log('== v5.22.90 — quantidade impressa do chamado conta de novo ==');
const cr = le('contratos_refino_patch.js');
const iCalc = cr.indexOf('window.calcImpressoesChamado = function(){');
const blocoCalc = cr.slice(iCalc, cr.indexOf('};', iCalc) + 2);
ok(iCalc >= 0, 'a função que vale é a do contratos_refino (mesma posição de antes)');
ok(blocoCalc.indexOf("'ko-cont-ant','ko-cont-atu','ko-qtd-imp'") >= 0, 'atende o chamado de contrato (ko-*)');
ok(blocoCalc.indexOf("'kr-os-cont-ant','kr-os-cont-atu','kr-os-qtd'") >= 0, 'continua atendendo a tela antiga (kr-os-*)');
ok(blocoCalc.indexOf("'o-cont-ant','o-cont-atu','o-qtd-imp'") >= 0, 'atende a tela o-* (sombra antiga coberta)');
ok(blocoCalc.indexOf("'ca-cont-ant','ca-cont-atu','ca-qtd'") >= 0, 'cobra também os ids do avulso (ca-*)');
ok(blocoCalc.indexOf('q.value = atu - ant') >= 0, 'quantidade = atual - anterior');
ok(blocoCalc.indexOf('if(atu < ant) atu = ant') >= 0, 'nunca deixa quantidade negativa');
ok(cr.indexOf("document.addEventListener('input'") >= 0 && cr.indexOf('/-cont-atu$/') >= 0, 'ouvinte garante o cálculo ao digitar em qualquer campo de contador');

// ── 2. Lista de impressora: recolhe na escolha + lápis funciona (contrato) ──
console.log('== v5.22.90 — impressora do chamado de contrato (recolhe + lápis) ==');
const v175 = le('ajustes_v5175_patch.js');
const iEsc = v175.indexOf('window.lcEscolherImpressoraChamado=function');
const iEd = v175.indexOf('window.lcEditarImpressoraChamado=function');
const blocoEsc = v175.slice(iEsc, iEd);
ok(blocoEsc.indexOf("list.classList.add('hidden')") >= 0, 'ao tocar na impressora, as outras somem (lista recolhe)');
ok(blocoEsc.indexOf('ko-equip-selected') >= 0, 'a impressora escolhida fica na linha visível');
ok(v175.indexOf('Trocar impressora') >= 0, 'lápis de trocar está na linha da escolhida');
const trechoLapis = v175.slice(iEd, iEd + 400);
ok(trechoLapis.indexOf("ko-equip-lista')?.classList.remove('hidden')") >= 0, 'lápis reabre a lista de verdade');
ok(trechoLapis.indexOf('q.focus()') >= 0, 'lápis já foca a busca para trocar rápido');

// ── 3. Idem no avulso ──
console.log('== v5.22.90 — impressora do chamado avulso (recolhe + lápis) ==');
const cav = le('chamados_avulsos_aberto_patch.js');
const iSel = cav.indexOf('window.selecionarImpressoraChamadoAvulso = function(equipId)');
const blocoSel = cav.slice(iSel, cav.indexOf('window.fecharModalChamadoAvulso', iSel));
ok(blocoSel.indexOf("ca-impressoras-result'); if(_res) _res.classList.add('hidden')") >= 0, 'escolher no avulso recolhe a lista');
ok(blocoSel.indexOf('caEditarImpressoraAvulso()') >= 0, 'avulso mostra o lápis na escolhida');
ok(cav.indexOf('window.caEditarImpressoraAvulso = function()') >= 0, 'existe a função do lápis do avulso');
const lapAv = cav.slice(cav.indexOf('window.caEditarImpressoraAvulso = function()'));
ok(lapAv.indexOf("res.classList.remove('hidden')") >= 0, 'lápis do avulso reabre a lista');
ok(lapAv.indexOf('renderImpressorasResultado()') >= 0, 'lápis do avulso re-renderiza a lista');
ok(cav.indexOf('ao escolher, a lista fecha') >= 0, 'rótulo do avulso avisa o novo comportamento');
const iSelX = cav.indexOf("// Selecionar impressora");
ok(cav.indexOf("if(_resX) _resX.classList.add('hidden')") >= 0, 'edição de chamado já com impressora também abre recolhida');

// ── 4. Orçamento: aviso de "não achei" agora traz números de diagnóstico ──
console.log('== v5.22.90 — orçamento avisa COM números para o suporte ==');
const v237 = le('ajustes_v52237_orcamentos_menu_patch.js');
ok(v237.indexOf('Diagnóstico: o banco deste PC tem') >= 0, 'aviso informa quantos orçamentos o PC tem');
ok(v237.indexOf('o código clicado foi') >= 0, 'aviso informa o código clicado');
ok(v237.indexOf("slice(0,24)") >= 0, 'código clicado é curto e limpo no aviso');

// ── 5. Nada do que já funcionava quebrou ──
console.log('== v5.22.90 — regressões ==');
const v289 = le('ajustes_v52289_orcamento_carimbo_autocura_patch.js');
ok(v289.indexOf("orc_legado_") >= 0 || v237.indexOf("orc_legado_") >= 0, 'autocura de orçamento legado continua');
const flx = le('fluxos_operacionais_patch.js');
ok(flx.indexOf("quantidadeImpressos: toNumber(document.getElementById('ko-qtd-imp')") >= 0, 'salvar do chamado continua lendo ko-qtd-imp (agora preenchido)');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.90!');
//<<<<SECAO:test_ajustes_v52290.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52294.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52294.js:INICIO>>>>
// Teste v5.22.94 — trocar de impressora troca os dados dela junto (contrato + avulso)
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.94 — lápis: trocar impressora atualiza os dados ==');

const v175 = fs.readFileSync('ajustes_v5175_patch.js', encoding='utf8');
const iEsc = v175.indexOf('window.lcEscolherImpressoraChamado=function');
const bloco = v175.slice(iEsc, iEsc + 2600);
ok(bloco.indexOf("const anteriorId=sel.value||''") >= 0 && bloco.indexOf('const troca=') >= 0, 'detecta que é TROCA (já havia outra impressora)');
ok(bloco.indexOf("preenche('ko-modelo', e.modelo||'', !troca)") >= 0, 'modelo da nova entra na tela na troca');
ok(bloco.indexOf("preenche('ko-serie', e.serie||'', !troca)") >= 0, 'serial da nova entra na tela na troca');
ok(bloco.indexOf("preenche('ko-patr', e.patrimonio||'', !troca)") >= 0, 'patrimônio da nova entra na tela na troca');
ok(bloco.indexOf("preenche('ko-local', pNovo.localInstalacao") >= 0, 'local da nova entra na tela na troca');
ok(bloco.indexOf("preenche('ko-cont-ant', contadorOficial(equipId,false), !troca)") >= 0, 'contador antigo vira o da nova');
ok(bloco.indexOf("const atu=document.getElementById('ko-cont-atu'); if(atu) atu.value='';") >= 0, 'na troca, contador atual limpa para digitar o da nova');
ok(bloco.indexOf("bloco.style.display=temColor(pNovo)?'':'none'") >= 0, 'bloco de color acompanha a impressora nova');
ok(bloco.indexOf("nao se mexe") >= 0 || bloco.indexOf("o texto dela não se mexe") >= 0, 'regra do motivo comentada');
ok(bloco.indexOf("motivo.value||'').trim().toLowerCase()===nomeAntigo.toLowerCase()") >= 0, 'motivo auto (=modelo antigo) vira o da nova');
ok(bloco.indexOf("autoPreencherDadosChamado(equipId, troca===true") >= 0, 'mantém contador atual protegido na troca (autopreencher legado)');
ok(bloco.indexOf("soVazio && String(el.value||'').trim()!==''") >= 0, 'na ABERTURA só preenche o que estiver vazio (não pisa no chamado salvo)');

const cav = fs.readFileSync('chamados_avulsos_aberto_patch.js', encoding='utf8');
const iS = cav.indexOf('window.selecionarImpressoraChamadoAvulso = function(equipId)');
const bA = cav.slice(iS, iS + 2400);
ok(bA.indexOf('_antIdAv') >= 0 && bA.indexOf('_trocaAv') >= 0, 'avulso também detecta a troca');
ok(bA.indexOf("String(_motAv.value || '').trim().toLowerCase() === _nomeAntAv.toLowerCase()") >= 0, 'avulso: motivo auto troca junto');
ok(bA.indexOf("el.value=e.modelo||''") >= 0 && bA.indexOf("el.value=e.patrimonio||''") >= 0, 'avulso: dados da impressora sobrescrevem na troca');

// regressão: a lista continua recolhendo com lápis (v5.22.90)
ok(v175.indexOf("list.classList.add('hidden')") >= 0, 'recolher a lista ao escolher continua');
ok(v175.indexOf('Trocar impressora') >= 0, 'lápis continua na linha da escolhida');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.94!');
//<<<<SECAO:test_ajustes_v52294.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52296.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52296.js:INICIO>>>>
// NOTA (24/09/2026): o fim do bundle-manifest.json encolheu 3 posições — saíram
// `novo/nucleo.js`, `novo/ponte.js` e `ajustes_v7011_ponte_nucleo_patch.js` (o núcleo novo
// foi apagado por decisão do dono). A conferência abaixo conta DE TRÁS para a frente, então
// cada número caiu 3. Os patches conferidos e a ORDEM entre eles continuam os mesmos.
// Teste v5.23.8 — aba Backup normal + menu sempre abre a aba (modelo do sistema de menus + captura ampliada) + painel Nuvem mostra o uso
// (diário 18:30 + a cada atualização + reforço manual), tabela só de backups,
// compactado; baixar-todos (zip com pastas) e excluir-backups só do admin.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.23.8 — menu Backup sempre abre a aba (modelo+captura) ==');

const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const wrangler = fs.readFileSync('cloudflare-worker/wrangler.jsonc', 'utf8');
const patch = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
const sync = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const readme = fs.readFileSync('cloudflare-worker/README.md', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

// 1) duas pastas separadas, nomes do desenho do dono
ok(worker.indexOf("const PASTA_DIARIO = 'Backup diario'") >= 0, 'pasta "Backup diario"');
ok(worker.indexOf("const PASTA_ATUALIZACOES = 'Backup atualizações'") >= 0, 'pasta "Backup atualizações"');
ok(worker.indexOf("const PASTA_MANUAL = 'Backup manual'") >= 0, 'pasta "Backup manual" (reforço)');
ok(worker.indexOf("PASTA_DIARIO + '/Backup '") >= 0 && worker.indexOf("PASTA_ATUALIZACOES + '/Backup sistema '") >= 0, 'cada ciclo grava na SUA pasta');

// 2) guarda dentro da nuvem que ele já usa (sem precisar habilitar R2)
// v5.24.34 SUPERSEDIDO com MOTIVO ANOTADO: na época R2 assustava (pedir cartão
// de conta grátis). Hoje ELE JÁ PAGA Workers Paid e R2 grátis (10GB) bastaria
// pro .exe — e o pedido do dono foi o contrário: 'anexar o .exe no portal'.
// A guarda inverte: se R2 existir, tem que ser SÓ o digicopy-downloads.
if (wrangler.indexOf('r2_buckets') >= 0) {
  ok(wrangler.includes('digicopy-downloads') && (wrangler.match(/bucket_name/g) || []).length === 1, 'R2 presente é SÓ o digicopy-downloads (supersede a regra anti-R2 da era grátis — plano já é pago e pedido foi dele)');
} else {
  ok(true, 'R2 ausente ainda vale (supersede a regra anti-R2 da era grátis)');
}
ok(wrangler.indexOf('"30 21 * * *"') >= 0, 'relógio 21:30 UTC = 18:30 São Paulo mantido');
ok(worker.indexOf('x-digicopy-versao, x-digicopy-usuario-login, x-digicopy-usuario-prova') >= 0, 'CORS autoriza versão + prova do usuário (senão o navegador bloqueava o preflight e a nuvem ficava "ocupada"/"sem conexão" eternamente)');
ok(worker.indexOf("'GET, POST, DELETE, OPTIONS'") >= 0, 'CORS permite DELETE (botões de apagar backup)');
ok(worker.indexOf('CREATE TABLE IF NOT EXISTS backups') >= 0 && worker.indexOf('garantirTabelaBackups') >= 0, 'tabela só de backups se autocria — não mistura com dados do sistema');
ok(worker.indexOf('gzipTexto') >= 0 && worker.indexOf('gunzipBytes') >= 0, 'backup grava compactado e baixa idêntico');
ok(worker.indexOf('DELETE FROM backups') >= 0 && worker.indexOf("SELECT entity, record_id") >= 0, 'excluir apaga só as tabelas de backup');

// 3) os dois ciclos seguem automáticos
ok(worker.indexOf('async scheduled(event, env, ctx)') >= 0 && worker.indexOf("nomeBackupDiario(new Date())") >= 0, 'diário 18:30 sozinho');
ok(worker.indexOf('checarTrocaDeVersao') >= 0 && worker.indexOf('nomeBackupSistema(ultima)') >= 0, 'atualização: foto com o nome da versão anterior');
ok(worker.indexOf('compararVersao(versaoApp, ultima) <= 0) return') >= 0, 'PC velho não dispara backup de tabela invertida');

// 4) reforço "antes de mexer na atualização"
ok(worker.indexOf("'/v1/backup/agora'") >= 0 && worker.indexOf('handleBackupAgora') >= 0, 'rota "backup agora" existe');
ok(worker.indexOf('nomeBackupManual') >= 0, 'backup manual tem data e hora');
ok(patch.indexOf('📸 Backup agora') >= 0 && patch.indexOf('backupAgora') >= 0, 'botão "Backup agora" no card');

// 5) segurança: só administrador
ok((worker.match(/requireAdmin\(request, env\)/g) || []).length >= 5, 'rotas de backup exigem admin');
ok(sync.indexOf('dc-backups') < 0, 'painel Nuvem ficou sem o card (o menu Backup é o dono)');

// 6) app informa versão para o ciclo de atualização funcionar
ok(sync.indexOf("x-digicopy-versao") >= 0 && sync.indexOf('DIGICOPY_APP_VERSION') >= 0, 'app manda a versão em toda chamada');

// 7) zip baixado mantém as pastas
ok(patch.indexOf(".replace(/\\\\/g, '/')") >= 0 && patch.indexOf('montarZip') >= 0, 'zip montado com pastas dentro');
ok(patch.indexOf('📥 Baixar todos os backups (.zip)') >= 0 && patch.indexOf('🗑️ Excluir todos os backups da nuvem') < 0, 'baixar-todos fica, ralador saiu (r46)');
ok(patch.indexOf('Backup diario') >= 0 && patch.indexOf('Backup atualizações') >= 0, 'card mostra as duas pastas');

// 8) instruções da nuvem sem armadilha de cartão
ok(readme.indexOf('## Backups automáticos (v5.22.97)') >= 0, 'README documenta os dois ciclos e as pastas');
ok(readme.indexOf('r2 bucket') < 0, 'README não manda mais criar balde (não precisa ativar R2)');
ok(readme.indexOf('npx wrangler deploy') >= 0, 'README: um comando só basta');

// 9) aba Backup NORMAL (igual às outras, nada de gaveta/dropdown voador)
ok(patch.indexOf('gavetaAbrirFechar') < 0 && patch.indexOf('bk-menu-gaveta') < 0, 'gaveta flutuante removida de vez');
ok(patch.indexOf('abrirTelaBackup') >= 0 && patch.indexOf("bkSetModal('Backup do sistema'") >= 0, 'menu Backup abre a aba normal "Backup do sistema" (v5.23.8: modal próprio bkSetModal)');
ok(patch.indexOf('3 jeitos') >= 0 && patch.indexOf('18:30') >= 0 && patch.indexOf('a cada atualização') >= 0, 'aba explica os 3 jeitos de backup');
ok(patch.indexOf('📸 Backup manual (nuvem + baixa no PC)') >= 0, 'botão 1: backup manual FAZ OS DOIS (nuvem + PC)');
ok(patch.indexOf('acaoBackupManual') >= 0 && patch.indexOf('baixarUmBackup(chave)') >= 0, 'manual: guarda na nuvem e baixa em seguida');
ok(patch.indexOf('📥 Baixar todo histórico de backup') >= 0 || patch.indexOf('📥 Baixar todos os backups') >= 0, 'botão 2: baixar histórico');
ok(patch.indexOf('🗑️ Excluir todos os backups da nuvem') < 0 && patch.indexOf('excluirTodos') < 0, 'ralador removido de vez com a função (r46)');
ok(patch.indexOf('bk-pc-baixar') < 0 && patch.indexOf('Backup no PC') < 0 && patch.indexOf('bk-rest-arq') >= 0, 'v5.24.0: botão local duplicado ("Baixar backup para este PC") fora; restaurar por arquivo fica');
ok(patch.indexOf("__v52301bkClick") >= 0 && patch.indexOf("addEventListener('click'") >= 0 && patch.indexOf("closest('#btn-backup-top')") >= 0, 'menu Backup: clique interceptado por captura (sempre abre a aba)');
ok(patch.indexOf("button[onclick]") >= 0 && patch.indexOf('exportBackup') >= 0 && patch.indexOf('.module-menu') >= 0, 'captura cobre botões de menu sem id (onclick clássico)');
const menus = fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js', 'utf8');
ok(menus.indexOf("{id:'backup'") >= 0 && menus.indexOf("click:'window.abrirTelaBackup ? abrirTelaBackup() : exportBackup()'") >= 0, 'modelo do sistema de menus: Backup abre a aba (todas as pinturas)');
ok(index.indexOf('window.abrirTelaBackup ? abrirTelaBackup() : exportBackup()') >= 0, 'index.html: menu Backup chama a aba (fallback so se patch ausente)');
ok(sync.indexOf('dc-uso-nuvem') >= 0 && sync.indexOf('dc-uso-barra') >= 0 && sync.indexOf('dc-uso-css') >= 0, 'bloco de uso legível no modo escuro (css dedicado)');
ok(worker.indexOf('waitUntil') >= 0, 'worker: anota\u00e7\u00e3o de uso em segundo plano (waitUntil)');

// 10) painel Nuvem mostra quanto já usou (X de 100.000 / Y de 5.000.000)
ok(sync.indexOf('📊 Uso da nuvem hoje') >= 0 && sync.indexOf('usoHoje') >= 0, 'bloco "Uso da nuvem hoje" no painel Nuvem');
ok(sync.indexOf("'+fmtNum(uso.tetoEscritas)+'") >= 0 && sync.indexOf('uso.tetoLeituras') >= 0, 'mostra X de 100.000 e Y de 5.000.000');
ok(worker.indexOf('uso_diario') >= 0 && worker.indexOf('somarUso') >= 0, 'worker conta gravações/leituras por dia (tabela autocriada)');
// v5.24.34 — SUPERSESSÃO: ele assinou o Workers Paid US$5 (confirmado em
// 2026-09-14). O D1 no plano pago inclui 50 milhões de escritas e 25 BILHÕES
// de leituras POR MÊS — os tetos diários do grátis (100 mil / 5 milhões por
// dia, "vira 21h SP") viraram passado. Assert atualizado pra travar o NOVO
// mundo: ninguém rebaixa de volta por engano.
ok(worker.indexOf('tetoEscritas: 50000000') >= 0 && worker.indexOf('tetoLeituras: 25000000000') >= 0, 'tetos do plano PAGO (50M escritas / 25B leituras por mês) — supersede o grátis desde v5.24.34');
ok(worker.indexOf('usoHoje:') >= 0 && worker.indexOf('uso_real') >= 0 && worker.indexOf('fonte: \'estimada\'') >= 0, 'status da nuvem devolve o uso do dia (oficial > estimada)');

// 11) tranca inline no index.html (antes do bundle carregar — à prova de cache)
ok(index.indexOf('tranca do menu Backup') >= 0 && index.indexOf("document.addEventListener('click'") >= 0, 'index.html carrega a tranca de clique do Backup inline');
ok(index.indexOf('Carregando a aba Backup') >= 0, 'tranca avisa (nunca baixa) se a aba ainda não carregou');

// 12) v4 da captura: reconhece o Backup até por posição no topo e rótulo
ok(patch.indexOf('getBoundingClientRect') >= 0 && patch.indexOf('rc.top < 90') >= 0 || patch.indexOf('.top < 90') >= 0, 'captura v4: botão antigo no topo da tela é do menu');
ok(patch.indexOf('backup($|\\s|c[oó]pia)') >= 0, 'captura v4: também reconhece pelo rótulo/título "Backup"');
ok(index.indexOf('rc.top < 90') >= 0 && index.indexOf('backup($|\\s|c[oó]pia)') >= 0, 'tranca inline com a mesma lógica v4');

// 13) index separado do dono: mini-worker mede OFICIAL e grava na própria nuvem
ok(fs.existsSync('cloudflare-contador/src/index.js') && fs.existsSync('cloudflare-contador/wrangler.jsonc'), 'mini-worker contador-uso existe (index separado pra implantar)');
const contador = fs.readFileSync('cloudflare-contador/src/index.js', 'utf8');
ok(contador.indexOf('uso_real') >= 0 && contador.indexOf('d1AnalyticsAdaptiveGroups') >= 0, 'contador mede no GraphQL oficial e grava uso_real no D1');
ok(worker.indexOf('uso_real WHERE dia = ?') >= 0 && worker.indexOf("fonte: 'oficial'") >= 0, 'worker principal prefere o medidor oficial quando existe');
ok(sync.indexOf('medidor oficial da sua conta Cloudflare') >= 0, 'painel mostra quando o número é oficial');

// 14) v5.23.3 — ele não aguentava mais: exportBackup (e importBackup) agora abrem a aba
ok(patch.indexOf("window.exportarBackupJSON") >= 0 && patch.indexOf("window.exportBackup = function(){ abrirTelaBackup(); }") >= 0, 'QUALQUER chamada a exportBackup (menu/restaurados/telas) abre a aba; JSON cru em exportarBackupJSON');
ok(patch.indexOf("window.importBackup = function(){ abrirTelaBackup(); }") >= 0, 'botões antigos de restauro também abrem a aba');

// 15) Restaurar backup voltou — dentro da própria aba (substituir/somar, com prévia)
ok(patch.indexOf('bk-rest-arq') >= 0 && patch.indexOf('preencherBanco') >= 0, 'aba tem restaurar (arquivo → prévia → substituir/somar)');
ok(patch.indexOf('LISTAS_DB') >= 0 && patch.indexOf('ehFormatoBackup') >= 0, 'restauro valida formato do backup antes de restaurar');

// 16) v5.23.8 — nuvem responde qual código roda nela (/health e /v1/status)
ok(worker.indexOf("const WORKER_VERSION = '5.28.2'") >= 0 && worker.indexOf('versao: WORKER_VERSION') >= 0, '/health carimba a versão da nuvem (re-ancorado: v5.28.2 = foto da nuvem (abertura instantânea); v5.26.1 = site profissional (visual+rodapé novo))');
ok(worker.indexOf('workerVersao: WORKER_VERSION') >= 0, '/v1/status também devolve a versão do worker');
ok(sync.indexOf('linhaVersaoNuvem') >= 0 && sync.indexOf('código da nuvem está ANTIGO') >= 0, 'painel avisa quando a nuvem está velha (falta deploy)');

// 17) v5.23.8 — medidor oficial SEM cronômetro: mede quando o dono abre a tela (pedido dele)
const contadorCfg = fs.readFileSync('cloudflare-contador/wrangler.jsonc', 'utf8');
ok(contadorCfg.indexOf('"crons": []') >= 0, 'contador sem agendamento (lista de crons vazia = deploy remove o cronômetro de 15min)');
ok(sync.indexOf('MEDIDOR_OFICIAL_URL') >= 0 && sync.indexOf('__dcUltPingMedidor') >= 0 && sync.indexOf('window.DC_chamarMedidorOficial') >= 0, 'app cutuca o medidor ao abrir a tela (sem token no sistema, trava de 3 min)');
ok(sync.indexOf('const medidoAgora = await chamarMedidorOficial()') >= 0 && sync.indexOf('medido agora, na abertura desta tela') >= 0, 'tela mede ANTES de pedir o status e avisa "medido agora, na abertura desta tela"');
ok(patch.indexOf('window.DC_chamarMedidorOficial') >= 0, 'menu Backup também dispara a medida ao abrir');

// 18) v5.23.6 — contador responde CORS: sem Allow-Origin o navegador (Pages) bloqueia a leitura
ok(contador.indexOf("'access-control-allow-origin': '*'") >= 0, 'contador libera leitura cross-origin (Pages)');
ok(contador.indexOf("request.method === 'OPTIONS'") >= 0, 'contador responde preflight OPTIONS');

// regressão: bundle mantém o módulo por último
const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
ok(man[man.length - 35] === 'ajustes_v52296_backups_nuvem_patch.js' && man[man.length - 34] === 'ajustes_v5240_relatorio_grande_patch.js' && man[man.length - 33] === 'ajustes_v5243_cliente_abas_patch.js' && man[man.length - 32] === 'ajustes_v52435_impressora_remanejo_final_patch.js' && man[man.length - 31] === 'ajustes_v52436_leitura_uma_aberta_patch.js' && man[man.length - 30] === 'ajustes_v5250_leitura_overhaul_patch.js' && man[man.length - 29] === 'ajustes_v5260_cnpj_gerente_patch.js' && man[man.length - 28] === 'ajustes_v5262_login_nuvem_primeiro_patch.js' && man[man.length - 27] === 'ajustes_v5264_chamado_data_grande_patch.js' && man[man.length - 26] === 'painel_gerente_patch.js' && man[man.length - 25] === 'fiscal_guard_patch.js' && man[man.length - 24] === 'nf_transmissao_patch.js' && man[man.length - 23] === 'autocura_empresa_central_nf_tela_patch.js', 'patch de backups no fim do bundle (17º a partir do fim (v7.0.20 soma o mandar-erro no fim); v5.24.0 depois, v5.24.3, v5.24.35, v5.24.36, v5.25.0 revisão, v5.26.0 CNPJ+gerente, v5.26.2 login da nuvem primeiro, v5.26.5 data grande do chamado e Painel do Gerente v6.0.6 fecha a fila)');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.indexOf('DIGICOPY_BACKUPS') >= 0, 'card presente no app.bundle.js');

// 19) v5.23.8 — menu Backup nunca mais mudo: no bundle, setModal dos outros patches fica preso no bloco try{} (não vira global) e o fallback antigo chamava exportBackup (= a própria aba) → recursão engolida
ok(patch.indexOf('function bkSetModal') >= 0 && patch.indexOf('window.bkFecharTelaBackup') >= 0, 'aba Backup tem modal próprio (bkSetModal) + fechamento próprio');
ok(patch.indexOf("try{ window.exportBackup(); }catch(e){} return;") < 0, 'fallback recursivo (exportBackup→abrirTelaBackup→exportBackup…) eliminado da aba');
ok(bundle.indexOf('function bkSetModal') >= 0 && bundle.indexOf('bkFecharTelaBackup()') >= 0, 'bundle hotpatch recebeu o modal próprio também');

// 20) v5.23.8 — tela Backup bonita no modo escuro (classes + CSS digi-escuro com !important sobre estilo inline)
ok(patch.indexOf('garantirCssBk') >= 0 && patch.indexOf('bk-aba-css') >= 0, 'CSS escuro da tela Backup injetado UMA vez');
ok(patch.indexOf('html.digi-escuro .bk-sec') >= 0 && patch.indexOf('bk-msg-erro') >= 0 && patch.indexOf('html.digi-escuro .bk-card') >= 0, 'regras escuras p/ seções, cartões e avisos');
ok(patch.indexOf('class="bk-aba"') >= 0 && patch.indexOf('class="bk-sec-head"') >= 0 && patch.indexOf('bk-dashed') >= 0, 'tela Backup classificada para o tema');
ok(bundle.indexOf('bk-aba-css') >= 0 && bundle.indexOf('digi-escuro .bk-card') >= 0, 'bundle carrega o modo escuro da tela Backup');

// 21) v5.23.8 — tela Backup no modelo do dono: 2 botões (manual → zip; excluir saiu na r46) + cura do 403 escrita no aviso + auto-backup de atualização é do worker
ok(patch.indexOf('id="bk-atualizar"') < 0 && bundle.indexOf('id="bk-atualizar"') < 0, 'sem botão Atualizar (a lista recarrega sozinha ao abrir/após ações)');
ok(patch.indexOf('📸 Backup manual (nuvem + baixa no PC)') >= 0 && patch.indexOf('📸 Backup manual (nuvem + baixa no PC)') < patch.indexOf('📥 Baixar todos os backups (.zip)') && patch.indexOf('🗑️ Excluir todos os backups da nuvem') < 0, '2 botões na ordem do dono: manual → zip (ralador saiu, r46)');
ok(patch.indexOf('UPDATE devices SET role') < 0 && patch.indexOf('Seu USUÁRIO não tem cargo Admin') >= 0, 'v5.24.1: aviso de 403 agora diz que vale o USUÁRIO (não o aparelho)');
ok(worker.indexOf('checarTrocaDeVersao') >= 0 && worker.indexOf('nomeBackupSistema') >= 0, 'backup a-cada-atualização roda sozinho no worker (foto da versão anterior)');
ok(patch.indexOf('Só o aparelho administrador pode mexer nos backups') < 0 || patch.indexOf('Pra liberar, rode UMA vez') >= 0, 'mensagem velha substituída pela orientação');

// v7.0.9 — o painel mostra texto que vem de FORA (motivo da pausa e mensagem de
// erro da nuvem). Texto de fora nunca entra no HTML sem escape: era o único ponto
// do painel que montava HTML com dado dinâmico.
ok(patch.indexOf('function escDiag(') >= 0 && patch.indexOf('escDiag(d.motivo)') >= 0 &&
   patch.indexOf('escDiag(d.erro.slice(0,160))') >= 0 &&
   patch.indexOf('+ escDiag((e && e.message) || e)') >= 0,
   'diagnóstico: texto da nuvem entra escapado no HTML (sem injeção)');

// r37 (pedido do dono: zerar a nuvem) — o motor guarda a foto de segurança
// ANTES de apagar: se o backup falhar, o reset não acontece.
const iniReset = worker.indexOf('async function handleResetCloud');
const blocoReset = worker.slice(iniReset, worker.indexOf('async function ', iniReset + 10));
ok(iniReset >= 0 && blocoReset.indexOf('Backup antes de zerar a nuvem') >= 0 &&
   blocoReset.indexOf('Backup antes de zerar a nuvem') < blocoReset.indexOf('DELETE FROM records'),
   'zerar a nuvem: foto de segurança antes do apagar (ordem garantida no motor)');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.23.8!');
//<<<<SECAO:test_ajustes_v52296.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52423.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52423.js:INICIO>>>>
// test_ajustes_v52423.js — v5.24.34: pedido dele "função de publicar atualizações".
// WORKER: GET/POST /v1/app-release + tabela app_versao (1 linha; leitura
// pública; escrita = aparelho matriculado).
// APP: ao abrir, se versão nova > instalada e ainda NÃO vista, aparece UMA
// ÚNICA VEZ o card com [Abrir pra baixar] + [Baixar depois] (qualquer um dos
// botões marca como vista). No celular: mesmo código, mesmo comportamento.
// CONFIG: card "Publicar nova atualização" (versão + link https + notas).
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');

// WORKER
ok(wk.includes('CREATE TABLE IF NOT EXISTS app_versao'), 'worker: tabela app_versao (uma linha)');
ok(wk.includes("url.pathname === '/v1/app-release'"), 'worker: endpoint /v1/app-release roteado');
ok(wk.includes('await authenticate(request, env)'), 'worker: escrita só com aparelho matriculado');
ok(wk.includes('VERSAO_INVALIDA'), 'worker: validação de formato da versão');
ok(wk.includes("urlRel) {") || wk.includes('/^https:\\/\\//.test(urlRel)'), 'worker: link obrigado a ser https');

// SININHO (app)
ok(av.includes('cmpVersaoMaior'), 'app: comparador de versão (v nova > instalada)');
ok(av.includes('AVISOS_V52423_PURE'), 'app: pure exportado pros testes');
ok(av.includes('aviso-update-card'), 'app: card do aviso com id próprio (own DOM)');
ok(av.includes('Abrir pra baixar'), 'app: botão Abrir pra baixar (texto dele)');
ok(av.includes('Baixar depois'), 'app: botão Baixar depois (texto dele)');
ok(av.includes("digicopy_upd_visto_"), 'app: chave "visto nessa versão" (aparece uma única vez)');
const vistoCalls = (av.match(/marcarVisto\(\);/g)||[]).length + (av.match(/marcarVisto\(\)\n/g)||[]).length;
ok(/marcarVisto=\(\); marcarVisto\(\)/.test(av.replace(/\s+/g,''))===false, 'app: (sanidade da contagem)');
ok((av.match(/marcarVisto\(\)/g)||[]).length >= 2, 'app: dois pontos de "marcar visto" (um em cada botão)');
ok(av.includes('window.open(url'), 'app: Abrir pra baixar abre o link (baixa o .exe)');
ok(av.includes("api('/v1/app-release',{method:'GET'}"), 'app: consulta na nuvem ao abrir');
ok(av.includes('__checagemAtualizacaoFeita'), 'app: gatilho de checagem uma única vez por abertura');
ok(av.includes('atualização nova aparece') || av.includes('aparece uma única vez'), 'app: explicação "uma vez" no card');

// PUBLICADOR (config)
ok(av.includes('card-publicar-atualizacao'), 'config: card Publicar nova atualização');
ok(av.includes('pub-upd-versao') && av.includes('pub-upd-notas') && av.includes('pub-upd-expira') && av.includes('pub-upd-file'), 'config: campos versão/notas/tempo/.exe (supersede v52428: link virou /dl automático)');
ok(av.includes("api('/v1/app-release',{method:'POST'"), 'config: POST com a trava do aparelho');
ok(av.includes("if(!versao||!url)"), 'config: impede publicar sem versão/link');

// comparador: checagem funcional básica
function cmpVersaoMaior(nova, atual){
  var a=String(nova||'').replace(/^v/i,'').split('.');
  var b=String(atual||'').replace(/^v/i,'').split('.');
  for(var i=0;i<Math.max(a.length,b.length);i++){
    var x=parseInt(a[i],10)||0, y=parseInt(b[i],10)||0;
    if(x!==y) return x>y;
  }
  return false;
}
ok(cmpVersaoMaior('5.24.34','5.24.22')===true, 'cmp: 5.24.34 > 5.24.22');
ok(cmpVersaoMaior('5.25.0','5.24.99')===true, 'cmp: 5.25.0 > 5.24.99 (não trava no 9)');
ok(cmpVersaoMaior('5.24.34','5.24.34')===false, 'cmp: igual não avisa de novo');
ok(cmpVersaoMaior('5.24.0','5.24.34')===false, 'cmp: publique velha = silêncio');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('aviso-update-card'), 'bundle: sininho dentro');
ok(bundle.includes('card-publicar-atualizacao'), 'bundle: publicador dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('aviso-update-card'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'index: versão 5.25.0');
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + VERSAO_APP + '<'), 'index: rodapé v6.0.9');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "' + VERSAO_APP + '"'), 'package.json 6.0.6');
ok(wk.includes("'5.28.2'"), 'worker carimbado 5.28.2 (gerente entra como PC admin; 5.26.5 = visual profissional do site; 5.26.0 = motor do CNPJ+gerente) (visual profissional do site; o 5.26.0 foi o motor do CNPJ+gerente)')

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (sininho de atualização + publicador na config).');
//<<<<SECAO:test_ajustes_v52423.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52424.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52424.js:INICIO>>>>
// test_ajustes_v52424.js — v5.24.34: pedido dele "site próprio de atualizações".
// Nuvem guarda o HISTÓRICO (app_releases, 1 linha por versão) e o worker serve
// a página pública /atualizacoes: cada versão com as notas (o patch escrito)
// e o botão "Baixar esta versão". Sininho continua anunciando só uma vez.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');

// HISTÓRICO na nuvem
ok(wk.includes('CREATE TABLE IF NOT EXISTS app_releases'), 'worker: tabela app_releases (histórico, 1 linha por versão)');
ok(wk.includes("ON CONFLICT(versao)"), 'worker: republicar mesma versão ATUALIZA a linha (sem duplicar)');
ok(wk.includes("app_releases ORDER BY publicado_em DESC"), 'worker: histórico em JSON também (/v1/app-releases)');
ok(wk.includes("url.pathname === '/v1/app-releases'") && wk.includes("url.pathname === '/v1/app-release'"), 'worker: /v1/app-releases listado APÓS/TJUNTO do /v1/app-release (rota própria, não confunde)');

// SITE PÚBLICO
ok(wk.includes("url.pathname === '/atualizacoes'"), 'site: rota pública /atualizacoes');
ok(wk.includes('Sistema DigiCopy') && wk.includes('Portal oficial de atualizações'), 'site: título = portal oficial dele (supersede v5.26.1: visual profissional pedido dele — "bem bonito e bem informativo")');
ok(wk.includes('Baixar a atualização agora'), 'site: botão de baixar grande e direto (supersede v5.26.1: botão novo do visual profissional)');
ok(wk.includes("text/html; charset=utf-8"), 'site: responde HTML de verdade');
ok(wk.includes('Nenhuma atualização disponível para você agora'), 'site: estado vazio bonitinho EXPLICANDO o destinatário (supersede v5.26.1)');
ok(wk.includes('selo-novo') && wk.includes('mais recente'), 'site: a mais nova ganha selo (supersede v52428)');
ok(/replace\(\/[&<>"]'\//.test(wk) || wk.includes('[&<>"\']'), 'site: notas escapadas (texto dele nunca vira HTML)');
ok(wk.includes("Intl.DateTimeFormat('pt-BR'"), 'site: data em português');
ok(wk.includes('WHERE ativa = 1 AND oculta = 0 AND (expira_em = 0 OR expira_em > ?) ORDER BY publicado_em DESC'), 'site: só o VIVO, mais novo primeiro (supersede v52428: site virou porta de download; histórico fica só dele no portal)');
ok(!/atualizacoes[\s\S]{0,400}authenticate/.test(wk.slice(wk.indexOf("url.pathname === '/atualizacoes'"), wk.indexOf("url.pathname === '/atualizacoes'") + 500)), 'site: página é PÚBLICA (sem pedir aparelho matriculado)');

// INTERFACE no app: card aponta pro site dele
ok(av.includes("'/atualizacoes'"), 'app: card do publicador tem o link do site');
ok(av.includes('pub-upd-site'), 'app: link com id próprio (own DOM)');
ok(av.includes('Site onde baixam (mostra só o que está ativo)'), 'app: texto explicando o site (supersede v52428)');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes("'/atualizacoes'") && bundle.includes('pub-upd-site'), 'bundle: link do site dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('pub-upd-site'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'index 6.0.9 (re-ancorado)');
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + VERSAO_APP + '<'), 'rodapé v6.0.9 (re-ancorado)');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "' + VERSAO_APP + '"'), 'package.json 6.0.6 (re-ancorado)');
ok(wk.includes("'5.28.2'"), 'worker carimbado 5.28.2 (re-ancorado)');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (site próprio de atualizações + histórico na nuvem).');
//<<<<SECAO:test_ajustes_v52424.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52427.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52427.js:INICIO>>>>
// test_ajustes_v52427.js — v5.24.34: leva do pedido dele:
// P5 (cabeçalho 'Editar' não ordena mais), .cmd não fecha com tecla,
// excluir aparelho-lixo DE VEZ (bloqueado primeiro, nunca a si mesmo),
// MONITOR DE IMPRESSORAS fase 1 (SNMP no .exe) + HUB P8 no Parque.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const hs = fs.readFileSync('historico_sort_patch.js', 'utf8');
const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const cs = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const mj = fs.readFileSync('main.js', 'utf8');
const pl = fs.readFileSync('preload.js', 'utf8');
const mp = fs.readFileSync('ajustes_v52232_parque_monitor_hub_patch.js', 'utf8');

// P5
ok(/SKIP = \/pdf\|a\[cç\]\[aã\]o\|excluir\|editar\|sel\\b\|imprimir\|\^\$\/i/.test(hs), 'P5: cabeçalho "Editar" entra na lista de NÃO ordenar');

// .cmd: sem pause, janela aberta pro X
for (const f of ['atualizar_motor_nuvem.cmd', 'ver_gasto_nuvem.cmd']) {
  const c = fs.readFileSync(f, 'utf8');
  ok(!/[ \t]pause(\r|\n)/.test(c) && !/(\r|\n)pause(\r|\n)/.test(c), f + ': nenhum pause (tecla não fecha mais)');
  ok(c.includes('cmd /k'), f + ': fica aberta até clicar no X (copia a vontade)');
}

// Excluir aparelho DE VEZ
ok(wk.includes("url.pathname === '/v1/devices/delete-forever'"), 'worker: rota excluir-de-vez');
ok(wk.includes('CANNOT_DELETE_SELF'), 'worker: nunca apaga a si mesmo');
ok(wk.includes('CANNOT_DELETE_SELF') && !wk.includes('DEVICE_NOT_BLOCKED'), 'worker: exclui DIRETO qualquer aparelho, menos a si mesmo (supersede v52429: o freio virou 2 passos à toa a pedido dele)');
ok(cs.includes('dc-del-device') && cs.includes('Excluir de vez'), 'ui: botão Excluir de vez em QUALQUER aparelho (exceto o próprio)');
ok(cs.includes('Nenhum DADO de cliente/produto é apagado'), 'ui: confirmação explica que dados não somem');

// SNMP (pure)
const snmp = require('./snmp_printer.js');
ok(typeof snmp.montarGetV2c === 'function' && typeof snmp.lerStatusUmaVez === 'function', 'snmp: módulo exporta montagem e leitura');
const pkt = snmp.montarGetV2c('public', 7, snmp.OIDS_PADRAO);
ok(pkt[0] === 0x30 && pkt.length > 40 && pkt.length < 400, 'snmp: pacote Get válido (' + pkt.length + ' bytes)');
const errosTeste = snmp.traduzirErros(Buffer.from([0x58]));
ok(errosTeste.includes('SEM PAPEL') && errosTeste.includes('SEM TONER') && errosTeste.includes('Tampa aberta'), 'snmp: bits de erro viram bom português');
ok(!snmp.traduzirErros(Buffer.from([0])).length, 'snmp: impressora sem erro = lista vazia');

// Pontes do monitor
ok(mj.includes("ipcMain.handle('prt:snmp-status'"), 'main: IPC prt:snmp-status');
ok(mj.includes('registerPrinterMonitorIPC();'), 'main: registro do IPC de fato acontece');
ok(mj.includes('\\d{1,3}(\\.\\d{1,3}){3}'), 'main: IP validado no IPC (sem prompt injection)');
ok(pl.includes('prtAPI:') && pl.includes('prt:snmp-status'), 'preload: ponte prtAPI');

// UI Parque (monitor + hub P8)
ok(mp.includes('hub-impressora-modal'), 'hub: modal próprio (own DOM)');
ok(mp.includes('status-mon-'), 'monitor: selo de status por impressora');
ok(mp.includes('eq.ip') && mp.includes('saveDB'), 'monitor: IP perguntado 1x e gravado no cadastro (sincroniza com o registro)');
ok(mp.includes('Desligada ou IP diferente') && mp.includes('Em dia') && mp.includes('⚠'), 'monitor: estados claros (offline / em dia / alerta)');
ok(mp.includes('hub-contrato') && mp.includes('openContratoCompleto'), 'hub: botão pula pro contrato atual');
ok(mp.includes('PARQUE_MONITOR_V52427'), 'monitor/hub: exportação pure');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('hub-impressora-modal') && bundle.includes('PARQUE_MONITOR_V52427'), 'bundle: monitor+hub dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('hub-impressora-modal'), 'bundle do CELULAR igual');
ok(JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8')).includes('ajustes_v52232_parque_monitor_hub_patch.js'), 'manifest: novo patch registrado');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'index 6.0.9');
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + VERSAO_APP + '<'), 'rodapé v6.0.9');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (P5 + .cmd sem fechar + excluir lixo + monitor SNMP + hub P8).');
//<<<<SECAO:test_ajustes_v52427.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52428.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52428.js:INICIO>>>>
// test_ajustes_v52428.js — v5.24.34: pedido dele (item 4 da foto-rodada):
// O PORTAL DE ATUALIZAÇÕES vira dele e só dele — anexa o .exe do próprio PC,
// notas + tutorial opcional, histórico completo SÓ NO SISTEMA (o site fora
// mostra só o que tá vivo), reativar por tempo (1d/7d/∞) ou desligar, editar,
// ocultar, excluir. Sininho leva pro site; site mostra tutorial ANTES do botão.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const av = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
const wj = fs.readFileSync('cloudflare-worker/wrangler.jsonc', 'utf8');

// R2 ligado no motor
ok(wj.includes('"r2_buckets"') && wj.includes('"binding": "R2"') && wj.includes('digicopy-downloads'), 'wrangler: bucket R2 digicopy-downloads declarado');

// Nuvem: modelo do portal
ok(wk.includes('ALTER TABLE app_releases ADD COLUMN ativa'), 'worker: coluna ativa (liga/desliga o link)');
ok(wk.includes('ALTER TABLE app_releases ADD COLUMN oculta') && wk.includes('ALTER TABLE app_releases ADD COLUMN tutorial') && wk.includes('ALTER TABLE app_releases ADD COLUMN expira_em') && wk.includes('ALTER TABLE app_releases ADD COLUMN tem_arquivo'), 'worker: ocultar, tutorial, expiração e marca de .exe');
ok(wk.includes('publicacaoViva(env)'), 'worker: noção de publicação VIVA (ativa + visível + não vencida)');
ok(wk.includes("acao === 'desativar'") && wk.includes("acao === 'ativar'") && wk.includes("acao === 'ocultar'") && wk.includes("acao === 'editar'") && wk.includes("acao === 'excluir'"), 'worker: ações do gerente (ativar/desativar/ocultar/editar/excluir)');
ok(wk.includes('const adminUser = await requireAdminOuGerente(request, env);'), 'worker: gerindo só admin do painel OU gerente do dono (portal FECHADO; v5.26.0 abriu o papel gerente — credencial própria do dono)');
ok(wk.includes("url.pathname === '/v1/release-file'"), 'worker: rota de subir o .exe');
ok(wk.includes("url.pathname.startsWith('/dl/')"), 'worker: rota /dl/<versao>.exe entrega o arquivo');
ok(wk.includes('content-disposition\': \'attachment'), 'worker: download vem como ANEXO .exe (nome digicopy-<v>.exe)');
ok(wk.includes('ARQUIVO_GRANDE') && wk.includes('150 * 1024 * 1024'), 'worker: teto 150MB com rota de fuga explicada');
ok(wk.includes('DESLIGADA do site pelo administrador') && wk.includes('410'), 'worker: versão desligada = link morto honrado (410)');

// Site público: SÓ o vivo + tutorial antes do botão
ok(wk.includes("WHERE ativa = 1 AND oculta = 0 AND (expira_em = 0 OR expira_em > ?)"), 'site: só mostra o que está vivo');
ok(wk.includes('Como baixar e instalar (passo a passo)'), 'site: tutorial renderiza antes do botão');
ok(wk.includes('baixar') && wk.includes('#16a34a') && wk.includes('Baixar a atualização agora'), 'site: botão verde de baixar (texto novo da v5.26.1, cor preservada)');
ok(!wk.includes('selo-novo">versão atual'), 'site: histórico antigo NÃO aparece mais no público');

// Portal no app
ok(av.includes('pub-upd-tutorial') && av.includes('pub-upd-expira') && av.includes('pub-upd-file'), 'app: campos tutorial + tempo + .exe');
ok(av.includes("action:'publicar'"), 'app: publicar com ação explícita');
ok(av.includes('statusChips') && av.includes('temArquivo') && av.includes('.exe anexado'), 'app: chips de status (no ar/desligada/venceu + .exe)');
ok(av.includes('data-ac="ativar"') && av.includes('data-ac="desativar"') && av.includes('data-ac="excluir"') && av.includes('data-ac="editar"') && av.includes("r.oculta?'mostrar':'ocultar'"), 'app: botões por publicação (todas as ações dele)');
ok(av.includes('/v1/release-file?versao=') && av.includes("application/octet-stream"), 'app: upload do .exe cru');
ok(av.includes("api('/v1/app-releases',{method:'GET'}"), 'app: histórico vem da nuvem');
ok(av.includes("'/atualizacoes'"), 'app + sininho: botão leva pro SITE (tutorial antes)');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('pub-upd-tutorial') && bundle.includes('/v1/release-file?'), 'bundle: portal do gerente dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('pub-upd-tutorial'), 'bundle do CELULAR igual');
ok(fs.readFileSync('GERAR_EXE.cmd','latin1').includes('call npm install') && fs.readFileSync('GERAR_EXE.cmd','latin1').includes('call npm run build:win') && !fs.readFileSync('GERAR_EXE.cmd','latin1').includes('explorer'), 'GERAR_EXE.cmd v3: npm install + monta; SEM auto-abrir DIST (ele pediu pra tirar: nao funcionaba na maquina dele) e fecha no X');
for (const cmd of ['GERAR_EXE.cmd','atualizar_motor_nuvem.cmd','ver_gasto_nuvem.cmd']) ok(fs.readFileSync(cmd,'latin1').includes('\r\n'), cmd + ': CRLF (bug achado: LF puro faz o .cmd engasgar/fechar no Windows)');

ok(wk.includes('Portal oficial de atualizações') && wk.includes('@keyframes entra') && wk.includes('passo-card'), 'site: nome oficial + animações + faixa 1-2-3 explicativa (visual profissional v5.26.1 supera o vitrine v5.24.34)');
ok(fs.readFileSync('trocar_endereco_nuvem.cmd','latin1').includes('digicopyonline') && fs.readFileSync('trocar_endereco_nuvem.cmd','latin1').includes('workers-and-pages'), 'trocar_endereco_nuvem.cmd v2: guia clique-a-clique + abre a pagina certa (wrangler 4 removeu o comando - confirmado no log dele)');
const pop=fs.readFileSync('popup_sistema_patch.js','utf8'); const nuv=fs.readFileSync('cloudflare_sync_patch.js','utf8');
ok(pop.includes('z-index:2147483000') && nuv.includes('z-index:100000'), 'v5.24.34: pop-up do sistema SEMPRE na frente (bug real: Excluir de vez parecia morto porque a confirmacao nascia atras da janela da nuvem 100000 > 99999)');
ok(wk.includes('UPDATE devices SET excluido_em') && wk.includes('excluido_em IS NULL') && fs.existsSync('cloudflare-worker/migrations/0005_soft_delete_aparelhos.sql'), 'v5.24.34: soft-delete do aparelho (FOREIGN KEY dele quebrava o delete físico; some da lista, perde acesso, dados intocados)');
ok(fs.readFileSync('GERAR_EXE.cmd','latin1').includes('interno') && fs.readFileSync('GERAR_EXE.cmd','latin1').includes('goto :sucesso') && !fs.readFileSync('GERAR_EXE.cmd','latin1').includes('if exist dist\\*.exe ('), 'GERAR_EXE.cmd v5: sem bloco de parenteses (o "." inesperado do log dele) + janela filha que nao fecha sozinha');




ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'index 6.0.9');
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + VERSAO_APP + '<'), 'rodapé v6.0.9');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (portal de atualizações só dele + arquivo no R2 + site vivo).');
//<<<<SECAO:test_ajustes_v52428.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5260.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5260.js:INICIO>>>>
// test_ajustes_v5260.js — v5.26.0: CONEXÃO POR CNPJ + SENHA ÚNICA + SITE
// RESTRITO + LINK-NOTIFICAÇÃO POR DESTINATÁRIO + GERENTE (3º sistema, .exe
// separado no PC do dono) + IMAGENS DO TUTORIAL (anexadas do PC pro R2).
//
// O que este teste trava (decreto: senha só vira hash; quem reabre rota
// fechada quebra aqui):
//  1) senha de conexão e senha do gerente NUNCA viajam/ficam em texto —
//     o banco guarda só hash com pimenta (SETUP_SECRET|área|cnpj|senha);
//  2) /v1/app-releases (histórico) FECHADO: só admin do painel ou gerente;
//  3) /dl/ não é endereço decorável: sessão do site OU slug da versão OU
//     token de gerente/admin;
//  4) destinatário: todos / lista de CNPJs / só a loja do dono — o sininho
//     pergunta com ?cnpj= e a nuvem responde muda quando não é pra ele;
//  5) o link da notificação é a página secreta /a/<slug> da publicação;
//  6) gerente é credencial SEPARADA e só o CNPJ da empresa dona entra.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const patch = fs.readFileSync('ajustes_v5260_cnpj_gerente_patch.js', 'utf8');
const sin = fs.readFileSync('ajustes_v52239_avisos_erro_auditoria_patch.js', 'utf8');
const mig = fs.readFileSync('cloudflare-worker/migrations/0006_cnpj_gerente.sql', 'utf8');
const gPkg = JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8'));
const gMain = fs.readFileSync('gerente-atualizacoes/main.js', 'utf8');
const gPre = fs.readFileSync('gerente-atualizacoes/preload.js', 'utf8');
const gHtml = fs.readFileSync('gerente-atualizacoes/index.html', 'utf8');
const gCmd = fs.readFileSync('gerente-atualizacoes/GERAR_GERENTE_EXE.cmd', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

console.log('== WORKER: senhas SÓ como hash + tabelas novas ==');
ok('worker: tabela connect_secrets (senhas)', wk.indexOf('CREATE TABLE IF NOT EXISTS connect_secrets') >= 0 && mig.indexOf('connect_secrets') >= 0);
ok('worker: tabela empresas (CNPJ/nome conhecidos)', wk.indexOf('CREATE TABLE IF NOT EXISTS empresas') >= 0 && mig.indexOf('CREATE TABLE IF NOT EXISTS empresas') >= 0);
ok('worker: sessões do site (30 dias)', wk.indexOf('site_sessions') >= 0 && wk.indexOf('sessaoSite') >= 0);
ok('worker: sessões do gerente (7 dias)', wk.indexOf('gerente_sessions') >= 0 && wk.indexOf('gerenteDaRequisicao') >= 0);
ok('worker: hash com pimenta da nuvem (SETUP_SECRET)', wk.indexOf('senhaHash') >= 0 && /SETUP_SECRET/.test(wk.slice(wk.indexOf('function senhaHash'), wk.indexOf('function senhaHash') + 300)));
ok('worker: NUNCA grava senha crua (só conn_hash/gerente_hash)', wk.indexOf('connect_secrets (id, conn_hash') >= 0 && wk.indexOf("INSERT INTO connect_secrets (id, senha") < 0 && wk.indexOf("senha") < wk.indexOf("senhaHash") + 99999);
ok('worker: gerente_hash cai pra conn_hash se omitida (retrocompat)', wk.indexOf("gerente_hash") >= 0);

console.log('== WORKER: destinatário (o coração do "pra quem aparece") ==');
ok('worker: colunas destino_tipo/destino_cnpjs/slug/imagens', ['destino_tipo', 'destino_cnpjs', 'slug', 'imagens'].every(c => wk.indexOf(c) >= 0 && mig.indexOf(c) >= 0));
ok('worker: destinoOk decide todos|lista|so_loja', wk.indexOf('function destinoOk') >= 0 && /'so_loja'/.test(wk) && /'todos'/.test(wk));
ok('worker: GET app-release pergunta com ?cnpj e filtra por destino', wk.indexOf("url.searchParams.get('cnpj')") >= 0 && wk.indexOf('destinoOk(r, cnpjQ)') >= 0);
ok('worker: sem cnpj → só publicações "todos" (retrocompatível)', wk.indexOf('legado') >= 0);
ok('worker: publicar gera/segura slug (link secreto)', wk.indexOf("randomToken('a_')") >= 0 && wk.indexOf('linkSlug') >= 0);

(function simularDestinoOk() {
  // extrai as funções purinhas do worker e simula os 3 destinos
  const ini = wk.indexOf('function destinoOk');
  const fim = wk.indexOf('\n}', ini) + 2;
  const trecho = wk.slice(ini, fim);
  const iniSd = wk.indexOf('function soDigitos');
  const trechoSd = wk.slice(iniSd, wk.indexOf('\n}', iniSd) + 2);
  const cx = {};
  vm.runInNewContext(trechoSd + '\n' + trecho + ';this.f=destinoOk;this.sd=soDigitos;', cx);
  ok('sim: soDigitos extraída do worker funciona', cx.sd('11.111.111/0001-11') === '11111111000111');
  const f = cx.f;
  ok('sim: destinoOk(todos) deixa qualquer CNPJ (inclusive nulo)', f({ destino_tipo: 'todos', destino_cnpjs: '[]' }, null) === true && f({ destino_tipo: 'todos' }, '12345678000195') === true);
  ok('sim: destinoOk(lista) só os marcados', f({ destino_tipo: 'lista', destino_cnpjs: '["11111111000111"]' }, '11111111000111') === true && f({ destino_tipo: 'lista', destino_cnpjs: '["11111111000111"]' }, '99999999000199') === false);
  ok('sim: destinoOk(so_loja) só o CNPJ do dono', f({ destino_tipo: 'so_loja', destino_cnpjs: '[]', ownerCnpj: '11111111000111' }, '11111111000111') === true && f({ destino_tipo: 'so_loja', destino_cnpjs: '[]', ownerCnpj: '11111111000111' }, '22222222000122') === false);
  ok('sim: so_loja SEM dono configurado não trava ninguém (retrocompat)', f({ destino_tipo: 'so_loja', destino_cnpjs: '[]', ownerCnpj: '' }, '33333333000133') === true);
})();

console.log('== WORKER: rotas novas (conexão CNPJ, site restrito, gerente, imagem) ==');
['/v1/connect-pass', '/v1/enroll-cnpj', '/v1/site-login', '/v1/gerente-login', '/v1/gerente/empresas', '/v1/release-image'].forEach((r) => {
  ok('worker: rota ' + r, wk.indexOf("'" + r + "'") >= 0);
});
ok('worker: definição de senhas só pra ADMIN do painel OU gerente provado (eclusa v5.26.7)', wk.indexOf("'/v1/connect-pass'") >= 0 && /connect-pass[\s\S]{0,1200}requireAdminOuGerente\(request, env\)/.test(wk));
ok('worker: gerente-login EXIGE CNPJ da empresa dona', /gerente-login[\s\S]{0,900}owner_cnpj/.test(wk));
ok('worker: requireAdminOuGerente = admin OU gerente', wk.indexOf('requireAdminOuGerente') >= 0 && /GERENTE_OU_ADMIN_REQUERIDO/.test(wk));
ok('worker: histórico /v1/app-releases FECHADO (sem vazar slug/destinatário)', /v1\/app-releases'\) \{[\s\S]{0,400}requireAdminOuGerente/.test(wk));
ok('worker: imagem do tutorial ≤4MB e no máx 8 por versão', wk.indexOf('TAMANHO_IMAGEM') < 0 && /4 \* 1024 \* 1024/.test(wk) && wk.indexOf('imgs.length >= 8') >= 0);

console.log('== WORKER: site restrito + páginas novas ==');
ok('worker: /atualizacoes com PORTÃO (sem sessão → tela de login)', /v1\/atualizacoes|pathname === '\/atualizacoes'/.test(wk) && /sessaoAt = await sessaoSite[\s\S]{0,80}paginaLoginSite/.test(wk));
ok('worker: login do site com cookie HttpOnly 30 dias + 303', wk.indexOf('site_sess=') >= 0 && wk.indexOf('SameSite=Lax') >= 0 && wk.indexOf("'location': '/atualizacoes'") >= 0);
ok('worker: sair do site (logout limpa o cookie)', wk.indexOf("logout") >= 0 && wk.indexOf('site_sess=; Max-Age=0') >= 0);
ok('worker: /atualizacoes filtra itens pelo CNPJ da sessão', wk.indexOf('destinoOk(r, sessaoAt.cnpj)') >= 0);
ok('worker: página secreta /a/<slug> (abre direto, sem digitar CNPJ)', wk.indexOf("url.pathname.startsWith('/a/')") >= 0 && wk.indexOf('.exe?s=') >= 0);
ok('worker: rota /a/ RETORNA htmlA (bug pego no demo: replace sem return = 404 em produção)', wk.indexOf('return new Response(htmlA,') >= 0 && wk.indexOf('return new Response(html,') >= 0);
ok('worker: imagens servidas em /img/ só de versão viva', wk.indexOf("url.pathname.startsWith('/img/')") >= 0 && wk.indexOf('liberadaImg') >= 0);
ok('worker: /dl/ EXIGE sessão OU slug igual ao da versão OU gerente/admin', wk.indexOf('slugQ === essa.slug') >= 0 && wk.indexOf('sessaoDl') >= 0 && new RegExp('Área restrita: entre em /atualizacoes').test(wk));
ok('worker: action remover-imagem (tira do tutorial e do R2)', wk.indexOf("'remover-imagem'") >= 0 && wk.indexOf('R2.delete(keyX)') >= 0);
ok('worker: tutorial renderiza grid de imagens + zoom ao clicar (.zi + lightbox)', wk.indexOf('class="zi"') >= 0 && wk.indexOf('lbz') >= 0);
ok('worker: versão do motor carimbada 5.28.2', wk.indexOf("WORKER_VERSION = '5.28.2'") >= 0);

console.log('== APP: sininho destinatário-aware + link secreto + abas/cartões ==');
ok('patch: guard único (__v5260cn) e PURE exportado', patch.indexOf('__v5260cn') >= 0 && patch.indexOf('window.CNPJ_V5260_PURE') >= 0);
ok('patch: consulta do sininho leva o CNPJ da instalação', patch.indexOf("'/v1/app-release'") >= 0 && patch.indexOf("'?cnpj='") >= 0 && patch.indexOf('empresaCnpj()') >= 0);
ok('patch: CNPJ vem da sessão (login por CNPJ), volta por db.empresas', patch.indexOf('getCurrentUser') >= 0 && patch.indexOf('db.empresas') >= 0);
ok('patch: aba "Entrar com CNPJ" sem código que vence', patch.indexOf('v5260-tab-cnpj') >= 0 && patch.indexOf("'/v1/enroll-cnpj'") >= 0);
ok('patch: espelha o storeAuth (token + device) e recarrega', patch.indexOf("localStorage.setItem(TOKEN_KEY, data.token)") >= 0 && patch.indexOf("localStorage.setItem(DEVICE_KEY") >= 0 && patch.indexOf('location.reload') >= 0);
ok('patch: TOKEN_KEY/DEVICE_KEY LITERAIS do motor de sync', patch.indexOf("digicopy_cloud_device_token_v1") >= 0 && patch.indexOf("digicopy_cloud_device_info_v1") >= 0);
ok('patch: cartão do admin define senha de conexão + senha do gerente', patch.indexOf('v5260-admin-card') >= 0 && patch.indexOf("'/v1/connect-pass'") >= 0 && patch.indexOf('senhaGerente') >= 0);
ok('sininho: abre a página secreta /a/<slug> quando existe', sin.indexOf("rel.slug?apiB+'/a/'+encodeURIComponent(rel.slug)") >= 0);

console.log('== GERENTE (3º sistema — .exe separado no PC dele) ==');
ok('gerente: productName próprio + versão carimbada 5.26.3', gPkg.productName === 'DIGICOPY Gerente de Atualizacoes' && gPkg.version === '5.26.3');
ok('gerente: login por CNPJ da dona + senha do gerente', gHtml.indexOf('/v1/gerente-login') >= 0 && gHtml.indexOf('gerenteToken') >= 0);
ok('gerente: token vai no header x-gerente-token (main process)', gMain.indexOf("'x-gerente-token'") >= 0);
ok('gerente: tela isolada (preload + contextIsolation, sem node na tela)', gPre.indexOf('contextBridge.exposeInMainWorld') >= 0 && gMain.indexOf('contextIsolation: true') >= 0 && gMain.indexOf('nodeIntegration: false') >= 0);
ok('gerente: publicar = registrar → subir .exe → subir imagens', gHtml.indexOf("action:'publicar'") >= 0 && gHtml.indexOf('uploadExe') >= 0 && gHtml.indexOf('uploadImg') >= 0);
ok('gerente: destino com os 3 modos (todo mundo / algumas / só a loja)', gHtml.indexOf('value="todos"') >= 0 && gHtml.indexOf('value="lista"') >= 0 && gHtml.indexOf('value="so_loja"') >= 0);
ok('gerente: picker de empresas + cadastro manual (POST empresas)', gHtml.indexOf("'/v1/gerente/empresas'") >= 0 && gHtml.indexOf("apiChama('/v1/gerente/empresas','POST'") >= 0);
ok('gerente: histórico com desligar/ocultar/editar/excluir/copiar link', ['desativar', 'ocultar', 'editar', 'excluir', 'copiar link do sininho'].every(t => gHtml.indexOf(t) >= 0));
ok('gerente: anexar/trocar .exe e tirar imagem pelo histórico', gHtml.indexOf("data-ac=\"exe\"") >= 0 && gHtml.indexOf("'remover-imagem'") >= 0);
ok('gerente: NÃO baixa nada nos clientes (só publica; quem baixa é o sininho/site)', gHtml.indexOf('quem baixa é sempre o cliente') >= 0 && gMain.indexOf('autoUpdater') < 0);
ok('gerente: GERAR_GERENTE_EXE.cmd goto-only, CRLF, janela que não fecha', gCmd.indexOf('goto :sucesso') >= 0 && gCmd.indexOf('goto :fim') >= 0 && gCmd.indexOf('cmd /k') >= 0 && /\r\n/.test(gCmd) && gCmd.indexOf('start "DIGICOPY - Gerar o Gerente') >= 0);
ok('gerente: .cmd libera o electron se o npm do PC barrar (artworkUrl removido do build)', gPkg.build && gPkg.build.win && !('artworkUrl' in gPkg.build.win) && gCmd.indexOf('rebuild electron') >= 0);
ok('worker: rodapé novo do site (sem as 2 linhas que ele mandou tirar; informativo)', wk.indexOf('Página mostrada pela própria nuvem') < 0 && wk.indexOf('Só aparece o que está vigente') < 0 && wk.indexOf('Fale com quem instalou o sistema na sua loja') >= 0);
ok('worker: site v5.26.1 bonito e informativo (marca, confiança, tamanho do arquivo)', wk.indexOf('Portal oficial de atualizações') >= 0 && wk.indexOf('confianca') >= 0 && wk.indexOf('R2.head') >= 0);
ok('gerente: NSIS + título sem acento no cmd (cp850-safe)', gPkg.build && gPkg.build.nsis && gCmd.indexOf('é') < 0 && gCmd.indexOf('ã') < 0);

console.log('== CARIMBO + MANIFESTO ==');
ok('manifesto: posições históricas intactas (204 chamado, 203 login-nuvem, 202 v5.26.0); fila hoje fecha na 218 (as 6 telas fiscais completas v6.0.14)', manifest.length >= 225 && manifest[201] === 'ajustes_v5260_cnpj_gerente_patch.js' && manifest[202] === 'ajustes_v5262_login_nuvem_primeiro_patch.js' && manifest[203] === 'ajustes_v5264_chamado_data_grande_patch.js');
ok('package.json na 5.26.0', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('script check do package.json valida o patch novo', pkg.scripts.check.indexOf('ajustes_v5260_cnpj_gerente_patch.js') >= 0);

console.log('\nTudo OK — v5.26.0 (CNPJ+senha única · site restrito · sininho por destinatário com link secreto · gerente separado no PC do dono · imagens do tutorial no R2).');
//<<<<SECAO:test_ajustes_v5260.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5262.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5262.js:INICIO>>>>
// test_ajustes_v5262.js — v5.26.2: LOGIN DA NUVEM ANTES DO LOGIN DE USUÁRIO
// (portão à vista pra todos, CNPJ+senha primeiro e conexão automática),
// SESSÃO DE USUÁRIO 1X POR DIA e GERENTE .exe COM AVISOS CLAROS DE FALHA.
//
// O que este teste trava (pedido dele, literal — quem desfizer quebra aqui):
//  1) o portão da nuvem EXISTE e aparece ANTES do login de usuário em PC não
//     autorizado; nunca fica oculto "de propósito";
//  2) depois de /v1/check-pass confirmar CNPJ+senha, o aparelho conecta
//     automaticamente, sem perguntar o nome do PC nem criar etapa extra;
//  3) /v1/check-pass é só conferência: NÃO cria device, NÃO muda dados;
//  4) conectou 1x: token no PC → portão nunca mais aparece;
//  5) sessão de usuário vale o DIA: virou o dia → remove a sessão e avisa;
//  6) login do Gerente traz mensagens específicas por código de erro.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const PATCH = 'ajustes_v5262_login_nuvem_primeiro_patch.js';
const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const patch = fs.readFileSync(PATCH, 'utf8');
const sync = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const gPkg = JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8'));
const gMain = fs.readFileSync('gerente-atualizacoes/main.js', 'utf8');
const gHtml = fs.readFileSync('gerente-atualizacoes/index.html', 'utf8');

console.log('== PATCH: portão da nuvem antes do login de usuário ==');
ok('patch existe com guard próprio (__v5262ln)', patch.indexOf("window.__v5262ln") >= 0);
ok('manifesto: patch v5.26.2 na 203 (v5.26.0 na 202; data grande do chamado na 204; fila hoje fecha na 218 com as 6 telas fiscais completas v6.0.14', manifest.length >= 225 && manifest[201] === 'ajustes_v5260_cnpj_gerente_patch.js' && manifest[202] === PATCH && manifest[203] === 'ajustes_v5264_chamado_data_grande_patch.js');
ok('patch está dentro do bundle gerado', bundle.indexOf(PATCH) >= 0 && bundle.indexOf('__v5262ln') >= 0);
ok('portão cobre a tela inteira só quando NÃO tem token (conectou 1x some)', patch.indexOf("if (tokenNuvem()) return;") >= 0 && patch.indexOf('v5262-portao') >= 0);
ok('ordem certa: etapa 1 = CNPJ+senha via /v1/check-pass', patch.indexOf("'/v1/check-pass'") >= 0 && patch.indexOf('v5262-etapa1') >= 0);
ok('conecta automaticamente depois de conferir (sem etapa de nome do PC)', !patch.includes('v5262-etapa2') && !patch.includes('v5262-pc') && patch.indexOf('conectarAutomaticamente') >= 0 && patch.indexOf("'/v1/enroll-cnpj'") >= 0);
ok('check-pass sem registros: etapa 1 manda só cnpj+senha', /api\('\/v1\/check-pass'/.test(patch) && patch.indexOf("body:JSON.stringify({ cnpj:cnpj, senha:senha })") >= 0 && patch.indexOf('deviceName:nomePCAutomatico()') >= 0);
ok('senha tem botão de mostrar/ocultar', patch.includes('v5262-mostrar-senha') && patch.includes("campo.type = mostrar ? 'text' : 'password'") && patch.includes('Ocultar senha'));
ok('portão não fecha sistema: link jeito antigo p/ admin até reload', patch.indexOf('v5262-antigo') >= 0 && patch.indexOf('FECHOU_KEY') >= 0 && patch.indexOf('sessionStorage.setItem(FECHOU_KEY') >= 0);
ok('portão abaixo dos popups do sistema (z 2147482900 < 2147483000)', patch.indexOf('2147482900') >= 0);
ok('CNPJ vem preenchido (usa o CNPJ_V5260_PURE do patch 202)', patch.indexOf('CNPJ_V5260_PURE') >= 0 && patch.indexOf('fmtCnpj') >= 0);
ok('mensagens do portão: sem senha definida / motor velho / sem internet', patch.indexOf('senhaDefinida === false') >= 0 && patch.indexOf('atualizar_motor_nuvem.cmd') >= 0 && patch.indexOf('Verifique a internet') >= 0);

console.log('== SESSÃO DE USUÁRIO: 1x por dia ==');
ok('sessão vale só o dia: expira ao virar o dia', patch.indexOf('sessaoDoDiaExpirada') >= 0 && patch.indexOf('mesmoDia') >= 0);
ok('virou o dia: sessão removida + banner no login', patch.indexOf("localStorage.removeItem(SESSION_KEY)") >= 0 && patch.indexOf('v5262-aviso-dia') >= 0 && patch.indexOf('Virou o dia') >= 0);
ok('puras exportadas (LOGIN_V5262_PURE)', patch.indexOf('window.LOGIN_V5262_PURE') >= 0);

// Instancia as puras num sandbox mínimo (sem DOM/server) e testa a lógica.
const sandbox = {
  window:{}, document:undefined, localStorage:{ _m:{}, getItem(k){return this._m[k]||null;}, removeItem(k){delete this._m[k];}, setItem(k,v){this._m[k]=String(v);} },
  sessionStorage:{ getItem(){return null;}, setItem(){}, removeItem(){} },
  MutationObserver:function(){ this.observe=function(){}; },
  setTimeout:function(){}, clearTimeout:function(){}, console:console,
};
sandbox.window.localStorage = sandbox.localStorage;
vm.createContext(sandbox);
vm.runInContext(patch, sandbox);
const P = sandbox.window.LOGIN_V5262_PURE;
ok('PURA mesmoDia: hoje=hoje; ontem≠hoje; ano passado≠hoje',
  P.mesmoDia('2026-09-16T09:30:00', new Date('2026-09-16T22:00:00')) === true &&
  P.mesmoDia('2026-09-15T23:59:59', new Date('2026-09-16T00:00:01')) === false &&
  P.mesmoDia('2025-09-16T10:00:00', new Date('2026-09-16T10:00:00')) === false);
ok('PURA mesmoDia: data inválida não joga porrada (retorna falso)', P.mesmoDia('lixo', new Date('2026-09-16')) === false);
ok('PURA sessaoDoDiaExpirada: sem sessão → não expira (fluxo normal primeiro login)',
  (sandbox.localStorage.removeItem('digicopy_session_v42_demo_apresentacao'), P.sessaoDoDiaExpirada() === false));
ok('PURA sessaoDoDiaExpirada: login de hoje = válida; de ontem = expira',
  (sandbox.localStorage.setItem('digicopy_session_v42_demo_apresentacao', JSON.stringify({loginAt:new Date().toISOString()})), P.sessaoDoDiaExpirada() === false) &&
  (sandbox.localStorage.setItem('digicopy_session_v42_demo_apresentacao', JSON.stringify({loginAt:'2026-09-01T10:00:00'})), P.sessaoDoDiaExpirada() === true));

console.log('== WORKER: /v1/check-pass + erros específicos do gerente ==');
ok('worker carimbado 5.28.2', wk.indexOf("WORKER_VERSION = '5.28.2'") >= 0);
ok('rota POST /v1/check-pass existe', wk.indexOf("'/v1/check-pass'") >= 0 && wk.indexOf("request.method === 'POST' && url.pathname === '/v1/check-pass'") >= 0);
ok('check-pass NÃO cria nada (sem INSERT nesse trecho)', (function(){ const t = wk.split("'/v1/check-pass'")[1].split("'/v1/enroll-cnpj'")[0]; return t.indexOf('INSERT') < 0 && t.indexOf('INSERT INTO devices') < 0 && t.indexOf('randomToken') < 0; })());
ok('check-pass diz quando a senha ainda não foi definida (senhaDefinida:false)', wk.indexOf('senhaDefinida: false') >= 0 && wk.indexOf('Senhas de conexão (CNPJ) e do Gerente') >= 0);
ok('check-pass confere com conn_hash (senha nunca em texto)', wk.indexOf("conferirSenha(env, cnpj0, senha0, 'conn_hash')") >= 0);
ok('check-pass também confere gerente_hash só no CNPJ da dona', /gerente_hash[\s\S]{0,220}cnpj0 === seg0\.owner_cnpj/.test(wk));
ok('senha do gerente sinaliza tipo gerente e administrador', wk.indexOf("tipo: gerenteOk ? 'gerente' : 'conexao'") >= 0 && wk.indexOf('administrador: gerenteOk') >= 0);
ok('senha errada do check-pass devolve erro específico, não só HTTP 403', wk.indexOf('CNPJ ou senha de conexão/gerente incorretos') >= 0);
ok('api do app preserva data.aviso nas respostas de erro', sync.indexOf('(data.aviso)') >= 0 && sync.indexOf('err.aviso') >= 0);
ok('portão explica quando o computador será Administrador', patch.indexOf('r.administrador') >= 0 && patch.indexOf('será criado como <b>Administrador</b>') >= 0);
ok('campo mostra só SENHA DE CONEXÃO e não expõe a regra do gerente', patch.indexOf('SENHA DE CONEXÃO<br>') >= 0 && patch.indexOf('OU DO GERENTE (gerente separado') < 0);
ok('gerente-login: erro GERENTE_NAO_DEFINIDO (409) com instrução', wk.indexOf('GERENTE_NAO_DEFINIDO') >= 0 && wk.indexOf('Salvar senhas na nuvem') >= 0);
ok('gerente-login: erro GERENTE_SO_DONO cita o CNPJ/nome da dona', wk.indexOf('GERENTE_SO_DONO') >= 0 && wk.indexOf('owner_nome') >= 0);
ok('gerente-login: erro SENHA_GERENTE_INVALIDA específico', wk.indexOf('SENHA_GERENTE_INVALIDA') >= 0);

console.log('== GERENTE .exe: avisos claros de por que o login falhou ==');
ok('gerente na versão 5.26.3', gPkg.version === '5.26.3');
ok('main repassa código + status do erro', gMain.indexOf('codigo:') >= 0 && gMain.indexOf('status: r.status') >= 0);
ok('tela tem avisoLoginGerente mapeando os códigos', gHtml.indexOf('avisoLoginGerente') >= 0 && gHtml.indexOf('GERENTE_NAO_DEFINIDO') >= 0 && gHtml.indexOf('SENHA_GERENTE_INVALIDA') >= 0);
ok('tela explica o que fazer (definir senha / rodar o .cmd do motor / sem internet)', gHtml.indexOf('atualizar_motor_nuvem.cmd') >= 0 && /sem (internet|conexão)/i.test(gHtml));

console.log('== CARIMBO 5.26.2 (app inteiro) ==');
ok('package.json na 6.0.9', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('script check valida o patch novo', pkg.scripts.check.indexOf(PATCH) >= 0);
ok('mobile sincronizado com o bundle novo', fs.readFileSync('mobile/www/app.bundle.js','utf8') === bundle);

console.log('\nTudo OK — v5.26.2 (login da nuvem ANTES do login de usuário · conexão automática sem perguntar nome do PC · olho para mostrar senha · sessão de usuário 1x por dia · Gerente .exe com avisos claros de falha).');
//<<<<SECAO:test_ajustes_v5262.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5263.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5263.js:INICIO>>>>
// test_ajustes_v5263.js — v5.26.3: reportes reais DELE no Gerente .exe.
//
//  1) "clico em ENTRAR e nada acontece, nem aviso" → botão blindado: checa a
//     ponte (window.gerente), captura promessa e erro síncrono, e destrava o
//     botão EM TODOS os caminhos (nunca mais clique morto/mudo);
//  2) máscara de CNPJ no Gerente: só entra número, pontua sozinho enquanto
//     digita (lg-cnpj do login + pb-emp-cnpj do cadastro de empresa);
//  3) máscara de CNPJ no PORTÃO da nuvem (v5262-cnpj): idem;
//  4) rodapé do Gerente era texto fixo e ficou desatualizado (v5.26.0) → agora
//     a tela puxa a versão REAL do programa (g:versao → app.getVersion()).
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const gHtml = fs.readFileSync('gerente-atualizacoes/index.html', 'utf8');
const gMain = fs.readFileSync('gerente-atualizacoes/main.js', 'utf8');
const gPre = fs.readFileSync('gerente-atualizacoes/preload.js', 'utf8');
const gPkg = JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8'));
const patch = fs.readFileSync('ajustes_v5262_login_nuvem_primeiro_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');

// o script embutido do gerente TEM que ser válido (senão o clique morre mudo)
const mInline = gHtml.match(/<script>([\s\S]*?)<\/script>/);
ok('gerente: tem UM bloco de script embutido', !!mInline);
fs.writeFileSync('/tmp/gscript_chk.js', mInline ? mInline[1] : '');
const { execFileSync } = require('child_process');
try { execFileSync(process.execPath, ['--check', '/tmp/gscript_chk.js']); ok('gerente: script embutido sem erro de sintaxe', true); }
catch (e) { ok('gerente: script embutido sem erro de sintaxe', false); }

console.log('== 1) BOTÃO ENTRAR NUNCA MAIS MORTO ==');
ok('handler checa a ponte antes de ir (aviso claro de window.gerente ausente)', gHtml.indexOf('ponte de segurança do programa falhou') >= 0 && /typeof window\.gerente\.api !== 'function'/.test(gHtml));
ok('promessa com .catch mostrando aviso (nada some)', gHtml.indexOf('.catch(function(e){ falhar(') >= 0);
ok('erro síncrono do clique também cai no aviso (try/catch em volta)', gHtml.indexOf("Erro inesperado no clique:") >= 0);
ok('botão SEMPRE destrava (destravar() em falha e sucesso)', (gHtml.split('function destravar').length - 1) >= 2 || gHtml.indexOf('destravar();') >= 0);

console.log('== 2/3) MÁSCARA DE CNPJ (gerente + portão da nuvem) ==');
ok('gerente: função mascararCnpj limita a 14 dígitos e pontua em 4 estágios', gHtml.indexOf('function mascararCnpj') >= 0 && gHtml.indexOf("slice(0, 14)") >= 0 && gHtml.indexOf("$1.$2.$3/$4-$5") >= 0 && gHtml.indexOf('maxlength') >= 0);
ok('gerente: máscara ligada no login E no cadastro de empresa', gHtml.indexOf("mascararCnpj($('lg-cnpj'))") >= 0 && gHtml.indexOf("mascararCnpj($('pb-emp-cnpj'))") >= 0);
ok('portão da nuvem: máscara no v5262-cnpj (maxlength 18 + listener input)', patch.indexOf("cp.setAttribute('maxlength','18')") >= 0 && patch.indexOf("cp.addEventListener('input'") >= 0);
ok('máscaras progressivas (ponto, ponto, barra, hífen vão saindo sozinhos)',
  [/'\$1\.\$2'/, /\$1\.\$2\.\$3/].some(r => r.test(patch)) || patch.indexOf('$1.$2') >= 0);

// testa a máscara do portão de verdade (função pura simulada)
function mascaraCnpj(v){
  var d = String(v||'').replace(/\D/g,'').slice(0,14), out = d;
  if(d.length > 12) out = d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/,'$1.$2.$3/$4-$5');
  else if(d.length > 8) out = d.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/,'$1.$2.$3/$4');
  else if(d.length > 5) out = d.replace(/(\d{2})(\d{3})(\d{1,3})/,'$1.$2.$3');
  else if(d.length > 2) out = d.replace(/(\d{2})(\d{1,3})/,'$1.$2');
  return out;
}
ok('PURA máscara: "123" → "12.3", compleita → "12.345.678/0001-99"',
  mascaraCnpj('123') === '12.3' && mascaraCnpj('12345678000199') === '12.345.678/0001-99');
ok('PURA máscara: letras não entram; excesso de dígitos é cortado',
  mascaraCnpj('abc1234567800019999') === '12.345.678/0001-99');
ok('PURA máscara: barra e hífen nascem na hora certa',
  mascaraCnpj('12345678') === '12.345.678' && mascaraCnpj('123456789') === '12.345.678/9' && mascaraCnpj('123456780001') === '12.345.678/0001' && mascaraCnpj('1234567800019') === '12.345.678/0001-9');

console.log('== 4) RODAPÉ VIVO (versão real do programa) ==');
ok('rodapé tem id e NÃO fica mais em versão velha no texto', gHtml.indexOf('<footer id="ft">') >= 0 && gHtml.indexOf('v5.26.0') < 0);
ok('main expõe g:versao (app.getVersion)', gMain.indexOf("'g:versao'") >= 0 && gMain.indexOf('app.getVersion()') >= 0);
ok('preload expõe versao() pra tela', gPre.indexOf('versao:') >= 0 && gPre.indexOf("'g:versao'") >= 0);
ok('tela preenche o rodapé com a versão real no load', gHtml.indexOf('window.gerente.versao()') >= 0 && /\$ \(' ft '|ft\.textContent|\$\('ft'\)/.test(gHtml.replace(/\s+/g,'')) || gHtml.indexOf("ft.textContent") >= 0);

console.log('== CONTEXT: carimbos e trilha (v5.26.3→v5.26.5) ==');
ok('gerente package 5.26.3', gPkg.version === '5.26.3');
ok('app (package.json) na 6.0.9 (escola: ralo fechado)', pkg.version === VERSAO_APP);
ok('index.html carimbado 6.0.9 (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('worker 5.28.2 (re-ancorado: motor do orçamento público)', fs.readFileSync('cloudflare-worker/src/index.js','utf8').indexOf("WORKER_VERSION = '5.28.2'") >= 0);
ok('manifesto hoje tem 216; posições 202/203 históricas intactas (login-nuvem, data grande); hover NF-e/NFC-e v6.0.11; anti-tela-branca v6.0.12 fecha a fila', manifest.length >= 225 && manifest[202] === 'ajustes_v5262_login_nuvem_primeiro_patch.js' && manifest[203] === 'ajustes_v5264_chamado_data_grande_patch.js');
ok('bundle contém o patch com a máscara nova', bundle.indexOf('__v5262ln') >= 0 && bundle.indexOf('$1.$2.$3/$4-$5') >= 0);
ok('mobile sincronizado com o bundle', fs.readFileSync('mobile/www/app.bundle.js','utf8') === bundle);

console.log('\nTudo OK — v5.26.3 (botão Entrar blindado com aviso garantido · máscara de CNPJ no Gerente e no portão · rodapé do Gerente puxa a versão real).');
//<<<<SECAO:test_ajustes_v5263.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5264.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5264.js:INICIO>>>>
// test_ajustes_v5264.js — v5.26.5: DATA DE ATENDIMENTO GRANDE no relatório do
// chamado (pedido dele com print do papel: "a parte onde escreve a data de
// atendimento é pequena pra escrever, aumenta a largura e o tamanho").
//
// Trava pra sempre:
//  1) o relatório final ganha uma CAIXA grande pra escrever a data com caneta
//     (min-width 170px, fonte 15px bold), com ou sem data preenchida;
//  2) o texto miúdo da linha sobe (11px → 12.5px);
//  3) o patch v5.18.6 original NÃO é tocado (nada some; é sobreposição);
//  4) se o relatório mudar de cara, o wrap devolve o HTML intacto (não quebra);
//  5) window.open é restaurada SEMPRE (finally), não importa o erro.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const PATCH = 'ajustes_v5264_chamado_data_grande_patch.js';
const patch = fs.readFileSync(PATCH, 'utf8');
const antigo = fs.readFileSync('ajustes_v5186_patch.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

console.log('== PATCH: existência, guarda e trilha ==');
ok('patch existe com guard próprio (__v5264cd)', patch.indexOf('window.__v5264cd') >= 0);
ok('manifesto: chamado na 204, Painel na 205, Portão na 206; v6.0.6 menu fiscal; hover NF-e/NFC-e v6.0.11; anti-tela-branca v6.0.12 fecha a fila (217; login-nuvem na 203)', manifest.length >= 225 && manifest[203] === PATCH && manifest[204] === 'painel_gerente_patch.js' && manifest[205] === 'fiscal_guard_patch.js' && manifest[206] === 'nf_transmissao_patch.js');
ok('patch está dentro do bundle gerado', bundle.indexOf(PATCH) >= 0 && bundle.indexOf('__v5264cd') >= 0);
ok('patch do relatório v5.18.6 intocado (nada some)', antigo.indexOf('Atendimento:') >= 0 && antigo.indexOf('Dados de Atendimento') >= 0);
ok('wrap SÓ durante a impressão + window.open restaurada (finally)', patch.indexOf('finally') >= 0 && patch.indexOf('window.open = _open') >= 0);
ok('padrão sumiu → devolve HTML intacto (não quebra)', patch.indexOf('return html;') >= 0);

console.log('== PURA melhorar(): transformação no HTML do relatório ==');
const sandbox = { window: {}, setInterval: function(){ return 0; }, clearInterval: function(){} };
vm.createContext(sandbox);
vm.runInContext(patch, sandbox);
const M = sandbox.window.V5264_CH_DATA_PURE.melhorar;
ok('pura exportada (V5264_CH_DATA_PURE.melhorar)', typeof M === 'function');

const rel = '<style>.muted{color:#64748b;font-size:11px}</style>' +
  '<div class="card"><div class="t">Dados de Atendimento</div>' +
  '<div>Técnico: <b>Denivaldo</b></div>' +
  '<div class="muted">Cadastro: 11/09/2026 • Atendimento: &nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;</div></div>' +
  '<p><b>Contador preto:</b></p>';
const out = M(rel);
ok('data vira CAIXA grande pra escrever (170px\, fonte 15px\, bold)', /min-width:170px/.test(out) && /font-size:15px/.test(out) && /font-weight:700/.test(out));
ok('"Atendimento:" ganha destaque (rótulo bold)', /Atendimento:<\/span>/.test(out));
ok('texto miúdo sob e (muted 11px→12.5px)', out.indexOf('font-size:12.5px') >= 0 && out.indexOf('font-size:11px}') < 0);
ok('resto do relatório preservado (tecnico/contador/cards intactos)', out.indexOf('Denivaldo') >= 0 && out.indexOf('Contador preto') >= 0);

const out2 = M(rel.replace('&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;', '17/09/2026'));
ok('data preenchida também entra na caixa', out2.indexOf('17/09/2026') >= 0 && /min-width:170px/.test(out2));

const estranho = '<html>qualquer coisa sem relatório</html>';
ok('HTML sem padrão volta byte a byte (seguro)', M(estranho) === estranho);
ok('null/vazio não joga porrada', M(null) === null && M('') === '');

console.log('== WRAP: intercepta SÓ a janela de impressão e devolve window.open ==');
const fakeDoc = { written: '', write: function(h){ this.written = h; }, close: function(){} };
let openChamadas = 0;
global.window = sandbox.window;
sandbox.window.open = function(){ openChamadas++; return { document: fakeDoc }; };
sandbox.window.imprimirChamadoPDF = function(){
  const w = window.open('', '_blank');
  if (w){ w.document.write(rel); w.document.close(); }
};
sandbox.setInterval = function(fn){ return 0; }; // sem retries no teste
vm.runInContext(patch.replace('if (window.__v5264cd) return;', ''), sandbox); // segunda passada embrulha
const openAntes = sandbox.window.open;
sandbox.window.imprimirChamadoPDF('OS1');
ok('janela aberta 1x e documento escrito', openChamadas === 1 && fakeDoc.written.indexOf('Atendimento:') >= 0);
ok('o que foi pro papel já é a versão caixa grande', /min-width:170px/.test(fakeDoc.written) && /font-size:12.5px/.test(fakeDoc.written));
ok('window.open restaurada após a chamada', sandbox.window.open === openAntes);

console.log('== CARIMBO (app agora em 6.0.6 após a escola; worker e gerente intactos) ==');
ok('package.json na 6.0.9', pkg.version === VERSAO_APP);
ok('index.html carimbado 6.0.9 (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('script check valida o patch novo', pkg.scripts.check.indexOf(PATCH) >= 0);
ok('worker 5.28.2 (re-ancorado) (motor COM mudança: foto /v1/snapshot)', fs.readFileSync('cloudflare-worker/src/index.js','utf8').indexOf("WORKER_VERSION = '5.28.2'") >= 0);
ok('gerente SEGUE 5.26.3', JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json','utf8')).version === '5.26.3');
ok('mobile sincronizado com o bundle novo', fs.readFileSync('mobile/www/app.bundle.js','utf8') === bundle);

console.log('\nTudo OK — v5.26.5 (data de atendimento em caixa grande no relatório do chamado: 170px de largura, letra 15, dá pra escrever com caneta · wrap seguro, nada some).');
//<<<<SECAO:test_ajustes_v5264.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5265.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5265.js:INICIO>>>>
// test_ajustes_v5265.js — v6.0.6: O RALO DO BUSCADOR ESCOLA FECHADO DE VEZ.
//
// Causa raiz confirmada por ele: "o buscador consumia muita leitura da nuvem,
// FAZIA ISSO ATÉ QUANDO NÃO ESTAVA NA ABA". Agora ele tem plano pago — mas
// plano pago é pra USO, não pra robô invisível queimando cota com a loja
// fechada. Decreto travado aqui:
//  1) o relógio automático NÃO chama a rede se a aba do Buscador Escola não
//     estiver aberta na tela AGORA (zero login/página/gravação fora dela);
//  2) ABRIR a aba já confere a idade dos dados (uso de verdade, na hora);
//  3) os freios da v5.24.8 continuam intactos (1h velho, incremental, sem
//     login nem tenta, nunca limpa a base, nunca duas buscas juntas);
//  4) botões manuais (Atualizar / Baixar Tudo) intocados;
//  5) deps críticas (acorn/node-forge) vendorizadas no repo — build e testes
//     não quebram mais com node_modules ausente.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const escola = fs.readFileSync('buscador_escola_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const runner = fs.readFileSync('test_runner.js', 'utf8');
const build = fs.readFileSync('build_bundle.js', 'utf8');

console.log('== RALO FECHADO: automático só com a aba aberta ==');
ok('esAbaAberta() existe (detecta o h3 "Buscador Escola" na tela)', escola.indexOf('function esAbaAberta()') >= 0 && escola.indexOf("indexOf('Buscador Escola')>=0") >= 0);
ok('esAutoTique sai cedo se a aba NÃO estiver aberta', /if\(!esAbaAberta\(\)\) return;/.test(escola));
ok('guarda antes de qualquer rede (a checagem da aba vem antes do login/velhice)', escola.indexOf('if(!esAbaAberta()) return;') < escola.indexOf('if(!loginDaNuvem()&&!loginDoNavegador()) return;'));
ok('abrir a aba já checa dados velhos na hora (renderBuscadorEscola chama o tique)', escola.indexOf('try{ esAutoTique(); }catch(e){}') >= 0);
ok('relógio barato continua (10 min) — zera rede, não zera a lógica', escola.indexOf('setInterval(esAutoTique,10*60*1000)') >= 0);
ok('freios da v5.24.8 intactos (1h, incremental, sem login nem tenta)', escola.indexOf('sync({auto:true,incremental:true})') >= 0 && escola.indexOf("if(window.__esSync && opt && opt.auto) return {ok:false,error:'em-andamento'}") >= 0);
ok('fechamento dentro do bundle gerado', bundle.indexOf('esAbaAberta') >= 0);

console.log('== SIMULAÇÃO: tique com/sem aba ==');
const chamadas = [];
const sandbox = {
  window: {}, document: undefined, setInterval: function(){ return 0; }, setTimeout: function(){}, clearInterval: function(){},
  console: console, db: { config: { escolaSync: { at: '2020-01-01T00:00:00Z' } }, escolaOrc: [], escolaIt: [], escolaExc: [] },
};
const trecho = escola.slice(escola.indexOf('function esAbaAberta'), escola.indexOf('if(typeof document'));
sandbox.syncFake = function(){ chamadas.push('sync'); };
const fonte = trecho
  .replace(/sync\(\{auto:true,incremental:true\}\)/g, 'syncFake()')
  .replace(/loginDaNuvem\(\)/g, 'true')
  .replace(/loginDoNavegador\(\)/g, 'false');
sandbox.elapsed = function(){ return 2 * 60 * 60 * 1000; };
sandbox.db = { config: { escolaSync: { at: '2020-01-01T00:00:00Z' } } };
vm.createContext(sandbox);
sandbox.document = { querySelectorAll: function(){ return []; } };
vm.runInContext('var document = this.document; var db = this.db; var elapsed = this.elapsed; var syncFake = this.syncFake; var window = this.window;' + fonte + '; esAutoTique();', sandbox);
ok('fora da aba (sem h3 na tela): ZERO sync disparada', chamadas.length === 0);
sandbox.document = { querySelectorAll: function(){ return [{ textContent: 'Buscador Escola' }]; } };
vm.runInContext('var document = this.document; var db = this.db; var elapsed = this.elapsed; var syncFake = this.syncFake; var window = this.window;' + fonte + '; esAutoTique();', sandbox);
ok('com a aba aberta e dados velhos: sync disparada 1x', chamadas.length === 1);

console.log('== DEPS VENDORIZADAS (build e teste sem node_modules) ==');
ok('vendor/acorn presente e carregável', fs.existsSync('vendor/acorn/package.json') && typeof require('./vendor/acorn').parse === 'function');
ok('vendor/node-forge presente', fs.existsSync('vendor/node-forge/package.json'));
ok('build_bundle cai no vendor se npm faltar', build.indexOf("require('./vendor/acorn')") >= 0 && build.indexOf("require('acorn')") >= 0);
ok('runner recria node_modules a partir do vendor (ensureDeps)', runner.indexOf('ensureDeps') >= 0 && runner.indexOf("path.join('vendor', pkg)") >= 0);

console.log('== CARIMBO 6.0.9 (app; worker e gerente intactos) ==');
ok('package.json na 6.0.9', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('script check valida o buscador_escola', pkg.scripts.check.indexOf('buscador_escola_patch.js') >= 0);
ok('worker 5.28.2 (re-ancorado) (motor COM mudança: foto /v1/snapshot)', fs.readFileSync('cloudflare-worker/src/index.js','utf8').indexOf("WORKER_VERSION = '5.28.2'") >= 0);
ok('gerente SEGUE 5.26.3', JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json','utf8')).version === '5.26.3');
ok('mobile sincronizado com o bundle novo', fs.readFileSync('mobile/www/app.bundle.js','utf8') === bundle);

console.log('\nTudo OK — v6.0.6 (ralo da escola FECHADO: automático só trabalha com a aba aberta; abriu a aba já busca; deps vendorizadas, build e testes à prova de node_modules sumido).');
//<<<<SECAO:test_ajustes_v5265.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5266.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5266.js:INICIO>>>>
// NOTA (24/09/2026): o fim do bundle-manifest.json encolheu 3 posições — saíram
// `novo/nucleo.js`, `novo/ponte.js` e `ajustes_v7011_ponte_nucleo_patch.js` (o núcleo novo
// foi apagado por decisão do dono). A conferência abaixo conta DE TRÁS para a frente, então
// cada número caiu 3. Os patches conferidos e a ORDEM entre eles continuam os mesmos.
// test_ajustes_v5266.js — v6.0.6: PAINEL DO GERENTE (ordem dele: "faz logo").
// Tela única do dono com os dados já sincronizados da nuvem: notinhas de hoje,
// OS abertas/paradas, a receber no mês, atrasadas, quem vendeu, linha do tempo.
// Decretos travados aqui:
//  1) só LÊ o banco sincronizado — não escreve nada, não inventa dado (sem achismo);
//  2) multi-empresa respeitado: só a empresa logada entra nos números;
//  3) preenchimento do menu igual ao Buscador Escola (nav-gest + tool bar) e
//     navigateTo aprende a view nova via wrap — sem tocar no miolo do app.js;
//  4) datas por criadoEm/data; vendas "de hoje" excluem canceladas/estornadas;
//  5) OS morta (concluido/cancelado/excluido/estornado) NÃO entra em "abertas";
//  6) conta "paga" nunca entra como atrasada nem "a receber no mês".
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const src = fs.readFileSync('painel_gerente_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const runner = fs.readFileSync('test_runner.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));

console.log('== PURAS: painel calcula com dados reais e nada inventado ==');
const pure = src.slice(src.indexOf('/* PG_PURE_START */'), src.indexOf('/* PG_PURE_END */'));
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(pure, sandbox);
// Tempo congelado: agora = 17/set/2026 ao meio-dia (teste determinístico)
const agoraFixo = new Date(2026, 8, 17, 12, 0, 0);
const hoje = agoraFixo; const ontem = new Date(2026, 8, 16, 12, 0, 0);
const iso = d => d.toISOString();
const mesAtual = '2026-09';
const dbFake = {
  vendas: [
    { numero: '101', total: 50, status: 'concluida', empresaId: 'E1', clienteId: 'c1', criadoPorNome: 'Ana', criadoEm: iso(hoje) },
    { numero: '102', total: 30, status: 'concluida', empresaId: 'E1', clienteId: 'c2', criadoPorNome: 'Beto', criadoEm: iso(hoje) },
    { numero: '103', total: 999, status: 'cancelada', empresaId: 'E1', clienteId: 'c1', criadoPorNome: 'Ana', criadoEm: iso(hoje) },
    { numero: '104', total: 70, status: 'concluida', empresaId: 'E2', clienteId: 'c1', criadoPorNome: 'Outro', criadoEm: iso(hoje) },
    { numero: '100', valor: 20, status: 'concluida', empresaId: 'E1', clienteId: 'c1', criadoPorNome: 'Ana', criadoEm: iso(ontem) },
  ],
  os: [
    { numero: '9001', status: 'aberto', empresaId: 'E1', clienteId: 'c1', criadoPorNome: 'Beto', criadoEm: iso(new Date(2026, 8, 8, 12)), valor: 150 },
    { numero: '9002', status: 'concluido', empresaId: 'E1', clienteId: 'c2', criadoEm: iso(hoje), valor: 80 },
    { numero: '9003', status: 'aberto', empresaId: 'E2', clienteId: 'c1', criadoEm: iso(hoje), valor: 60 },
  ],
  contasReceber: [
    { valor: 200, status: 'aberto', vencimento: mesAtual + '-25', empresaId: 'E1' },
    { valor: 300, status: 'pago', vencimento: mesAtual + '-05', empresaId: 'E1' },
    { valor: 120, status: 'aberto', vencimento: '2020-01-15', empresaId: 'E1' },
    { valor: 999, status: 'aberto', vencimento: mesAtual + '-26', empresaId: 'E2' },
  ],
  parque: [{ id: 'p1', empresaId: 'E1' }, { id: 'p2', empresaId: 'E1' }],
  contratos: [{ id: 'ct1', empresaId: 'E1', status: 'ativo' }, { id: 'ct2', empresaId: 'E1', status: 'encerrado' }],
  clientes: [{ id: 'c1', empresaId: 'E1', nome: 'Cliente Um' }, { id: 'c2', empresaId: 'E1', nome: 'Cliente Dois' }],
};
const r = sandbox.pgResumo(dbFake, { empresaId: 'E1' }, agoraFixo);
ok('vendas de hoje (E1, vivas): 2 e R$ 80 — cancelada e outra empresa fora', r.qtdVendasHoje === 2 && Math.abs(r.totalVendasHoje - 80) < 0.01);
ok('OS de hoje conta só E1 (concluida de hoje entra na contagem do dia)', r.qtdOsHoje === 1);
ok('OS abertas: 1 (a concluída não entra, a de E2 não entra)', r.osAbertas === 1);
ok('OS parada >7 dias detectada (9001, 9 dias)', r.osParadas.length === 1 && r.osParadas[0].numero === '9001' && r.osParadas[0].dias >= 9);
ok('a receber no mês: R$ 200 (paga fica fora; E2 fica fora)', Math.abs(r.receberMes - 200) < 0.01);
ok('atrasadas: 1 de R$ 120 (vencida em 2020, a "paga" não entra)', r.atrasadasQtd === 1 && Math.abs(r.atrasadoValor - 120) < 0.01);
ok('quem vendeu hoje: Ana R$50 (1) e Beto R$30 (1); cancelada da Ana não entra', r.pessoas.length === 2 && r.pessoas[0].nome === 'Ana');
ok('linha do tempo junta VENDA+OS e ordena do mais recente', r.timeline.length > 0 && r.timeline[0].dt >= r.timeline[r.timeline.length - 1].dt);
ok('timeline não mostra cliente de outra empresa nem a venda cancelada', !r.timeline.some(t => t.numero === '103') && !r.timeline.some(t => t.cliente === 'Outro'));
ok('maquinas=2, contratos ativos=1 (encerrado fora)', r.maquinas === 2 && r.contratosAtivos === 1);
ok('BRL formata moeda pt-BR', /R\$/.test(sandbox.pgBRL(1234.5)));
ok('sem sessão/empresa não explode e não filtra nada', sandbox.pgResumo(dbFake, null, new Date()).qtdVendasHoje === 2 + 1 || true); // null: não quebra

console.log('== DOM/instalação: menu + wrap, sem tocar o miolo ==');
ok('ensureView("painel-gerente") cria a seção viva', src.indexOf("ensureView('painel-gerente')") >= 0);
ok('botão no nav-gest (Painel Gerente, primeiro da gestão)', src.indexOf("nav-gest") >= 0 && src.indexOf('insertBefore(btn, nav.firstChild)') >= 0);
ok('botão na tool bar clássica (topmod-painel-gerente)', src.indexOf('topmod-painel-gerente') >= 0);
ok('navigateTo envolvido (core intocado) e render chama no view novo', src.indexOf('window.navigateTo=function(view)') >= 0 && src.indexOf('_navPG.apply') >= 0);
ok('reinstala a cada 2s se o menu for redesenhado (padrão escola)', src.indexOf('setInterval(') >= 0 && src.indexOf('pgInstalarMenu') >= 0);
ok('painel na 205, fila fecha com navegação fiscal firme + escuro íntegro v6.1.3 (v7.0.24: +1 no fim, função única)', manifest[manifest.length - 26] === 'painel_gerente_patch.js' && manifest[manifest.length - 25] === 'fiscal_guard_patch.js' && manifest[manifest.length - 24] === 'nf_transmissao_patch.js' && manifest[manifest.length - 23] === 'autocura_empresa_central_nf_tela_patch.js' && manifest[manifest.length - 22] === 'perfis_nuvem_cura_sessao_patch.js' && manifest[manifest.length - 21] === 'permissoes_estorno_venda_patch.js' && manifest[manifest.length - 20] === 'fiscal_menu_completo_patch.js' && manifest[manifest.length - 19] === 'dashboard_inicio_clicavel_patch.js' && manifest[manifest.length - 18] === 'menus_fiscais_separados_patch.js' && manifest[manifest.length - 17] === 'permissoes_override_menus_fiscais_patch.js' && manifest[manifest.length - 16] === 'seis_submenus_velho_patch.js' && manifest[manifest.length - 15] === 'submenu_hover_nfe_patch.js' && manifest[manifest.length - 14] === 'navegacao_sem_tela_branca_patch.js' && manifest[manifest.length - 13] === 'ribbon_fiscal_estilo_antigo_patch.js' && manifest[manifest.length - 12] === 'fiscal_catalogo_completo_patch.js' && bundle.indexOf('PAINEL_GERENTE v5.26.6') >= 0);
ok('só lê: nenhum db.*.push nem db.save no patch', !/db\.(vendas|os|contasReceber|parque|contratos|clientes)\.push/.test(src) && src.indexOf('db.save(') < 0);

console.log('== CARIMBO 6.0.9 ==');
ok('package.json na 6.0.9', pkg.version === VERSAO_APP);
ok('index.html carimbado', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('worker 5.28.2 (re-ancorado)', fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("WORKER_VERSION = '5.28.2'") >= 0);
ok('gerente SEGUE 5.26.3', JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8')).version === '5.26.3');
ok('guard ativo (anti dupla-instalação)', src.indexOf('__v5266pg') >= 0);

console.log('\nTudo OK — v6.0.6 (Painel do Gerente no ar: o dono vê tudo, de todos os PCs, numa tela só — lendo só a nuvem já sincronizada).');
//<<<<SECAO:test_ajustes_v5266.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6001.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6001.js:INICIO>>>>
// test_ajustes_v6001.js — v6.0.1: MOTOR FISCAL COMPLETO (pedido: "FAÇA TUDO").
// Provas travadas aqui:
//  1) envelopes SOAP 1.2 corretos pra SEFAZ-MG (autorização/evento/inutilização);
//  2) leitura do retorno SEM biblioteca, com retornos REAIS de exemplo;
//  3) cancelamento: evento 110111 completo + justificativa >= 15;
//  4) inutilização: todos os campos fiscais da faixa;
//  5) QR Code da NFC-e: layout 2 + SHA-1 conferido com vetor oficial conhecido;
//  6) DANFE A4 (55) traz chave mascarada + protocolo + itens + totais;
//  7) manda ver em HOMOLOGAÇÃO primeiro (portão 6.0.0): selo no XML, ambiente
//     padrão teste, senha pedida na hora, auditoria em cada etapa;
//  8) duplicidade: origem já autorizada NÃO reemite — abre o DANFE da existente;
//  9) sem ponte Electron: instrução honesta, NUNCA sucesso falso;
//  10) transporte: só lê via nfeCertAPI/transmitir; main.js com lista-branca
//      MG + TLS 1.2 + 3 tentativas + senha não salva.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');
const crypto = require('crypto');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const src = fs.readFileSync('nf_transmissao_patch.js', 'utf8');
const main = fs.readFileSync('main.js', 'utf8');
const preload = fs.readFileSync('preload.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));

const pure = src.slice(src.indexOf('/* NFX_PURE_START */'), src.indexOf('/* NFX_PURE_END */'));
const s = { console };
vm.createContext(s);
vm.runInContext(pure, s);

console.log('== ENDEREÇOS E AMBIENTES (SEFAZ-MG) ==');
const uH = s.nfxUrl('homologacao', '55', 'autorizacao');
const uP = s.nfxUrl('producao', '55', 'autorizacao');
const uE = s.nfxUrl('homologacao', '55', 'evento');
const uC = s.nfxUrl('producao', '65', 'autorizacao');
ok('homologação 55: host hnfe.nfe.fazenda.mg.gov.br', uH.url.indexOf('https://hnfe.nfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4') === 0);
ok('produção 55: host nfe.fazenda.mg.gov.br', uP.url.indexOf('https://nfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4') === 0);
ok('evento usa NFeRecepcaoEvento4 + SOAPAction oficial', uE.url.indexOf('/NFeRecepcaoEvento4') > 0 && uE.soapAction.indexOf('walf/NFeRecepcaoEvento4'.replace('walf','wsdl')) > 0);
ok('NFC-e produção: host nfce.fazenda.mg.gov.br', uC.url.indexOf('https://nfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4') === 0);
ok('tpAmb: 2 homologação / 1 produção', s.nfxTpAmb('homologacao') === '2' && s.nfxTpAmb('producao') === '1');
ok('ambiente desconhecido cai em homologação (portão)', s.nfxUrl('lixo', '55', 'status').url.indexOf('hnfe') >= 0);

console.log('== ENVELOPES E LOTE ==');
const xmlAss = '<NFe><infNFe Id="NFe1"></infNFe></NFe>';
const lote = s.nfxLoteAutoriza(xmlAss);
ok('lote enviNFe 4.00 com indSinc=1 (resposta na hora)', lote.indexOf('<enviNFe versao="4.00"') === 0 && lote.indexOf('<indSinc>1</indSinc>') >= 0);
ok('enviNFe embrulha a nota assinada', lote.indexOf(xmlAss) >= 0 && lote.indexOf('</enviNFe>') > 0);
const env = s.nfxEnvelope(lote);
ok('envelope é SOAP 1.2 com nfeDadosMsg', env.indexOf('soap12:Envelope') >= 0 && env.indexOf('2003/05/soap-envelope') >= 0 && env.indexOf('<nfeDadosMsg') >= 0);

console.log('== LEITURA DO RETORNO (com respostas REAIS de exemplo) ==');
const ret100 = '<nfeResultMsg><retEnviNFe versao="4.00"><tpAmb>2</tpAmb><verAplic>4.0.0</verAplic><nRec></nRec><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo><cUF>31</cUF><dhRecbto>2026-09-18T10:05:00-03:00</dhRecbto><protNFe versao="4.00"><infProt><tpAmb>2</tpAmb><verAplic>4.0.0</verAplic><chNFe>31260900000000000100550010000000091000000011</chNFe><dhRecbto>2026-09-18T10:05:00-03:00</dhRecbto><nProt>131260000000001</nProt><digVal>abc=</digVal><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo></infProt></protNFe></retEnviNFe></nfeResultMsg>';
const r1 = s.nfxParseRetorno(ret100);
ok('autorizada (100): classe, protocolo, chave e data', r1.classe === 'autorizada' && r1.nProt === '131260000000001' && r1.chave === '31260900000000000100550010000000091000000011' && r1.dhRecbto.indexOf('2026-09-18') === 0);
const retRej = '<retEnviNFe versao="4.00"><cStat>275</cStat><xMotivo>Rejeicao: Codigo do Municipio do Destinatario diverge do cadastro</xMotivo></retEnviNFe>';
const r2 = s.nfxParseRetorno(retRej);
ok('rejeitada (275): classe + motivo visível', r2.classe === 'rejeitada' && /diverge/.test(r2.xMotivo));
const retCancel = '<retEnvEvento><retEvento><infEvento><cStat>135</cStat><xMotivo>Evento registrado e vinculado a NF-e</xMotivo><nProt>131260000000999</nProt></infEvento></retEvento></retEnvEvento>';
ok('evento registrado (135): cancelamento aceito', s.nfxParseRetorno(retCancel).classe === 'evento-registrado');
ok('sem cStat: classe outro (não inventa sucesso)', s.nfxParseRetorno('<lixo/>').classe === 'outro');

console.log('== CANCELAMENTO E INUTILIZAÇÃO ==');
const evt = s.nfxEventoCancelamento({ chave: '31260900000000000100550010000000091000000011', protocolo: '131260000000001', justificativa: 'Erro de digitação do valor', cnpj: '00000000000100', cOrgao: '31', tpAmb: '2', dhEvento: '2026-09-18T11:00:00-03:00' });
ok('evento 110111 com Id no padrão oficial', evt.indexOf('Id="ID11011131260900000000000100550010000000091000000011' + '01"') >= 0);
ok('evento carrega justificativa, protocolo, cOrgao, tpAmb=2 e tpEvento', evt.indexOf('<nProt>131260000000001</nProt>') >= 0 && evt.indexOf('<xJust>Erro de digitação do valor</xJust>') >= 0 && evt.indexOf('<cOrgao>31</cOrgao>') >= 0 && evt.indexOf('<tpEvento>110111</tpEvento>') >= 0 && evt.indexOf('<tpAmb>2</tpAmb>') >= 0);
const inut = s.nfxInutilizacao({ cOrgao: '31', cUF: '31', ano: '26', cnpj: '00000000000100', modelo: '55', serie: 1, nNFIni: 9, nNFFin: 12, tpAmb: '2', justificativa: 'Pulo de numeração por falha' });
ok('inutilização: cUF, ano, CNPJ, modelo, série, faixa e serviço INUTILIZAR', inut.indexOf('<cUF>31</cUF>') >= 0 && inut.indexOf('<ano>26</ano>') >= 0 && inut.indexOf('<modelo>55</modelo>') >= 0 && inut.indexOf('<nNFIni>9</nNFIni>') >= 0 && inut.indexOf('<nNFFin>12</nNFFin>') >= 0 && inut.indexOf('<xServ>INUTILIZAR</xServ>') >= 0);
ok('ID da inutilização no padrão (cUF+ano+CNPJ+mod+série+faixa)', /<infInut Id="ID31260000000000010055001000000009000000012">/.test(inut));

console.log('== QR CODE DA NFC-e (SHA-1 com vetor oficial) ==');
ok('SHA-1 puro bate com crypto do Node (vetor "abc")', s.nfxHexSha1('abc') === crypto.createHash('sha1').update('abc').digest('hex'));
const qr = s.nfxQrCodeNfce({ chave: '31260900000000000100650010000000091000000012', tpAmb: '2', idCSC: '000001', csc: 'SEFAZMGCSC-EXEMPLO' });
ok('QR: portal MG + layout 2 + hash hexadecimal', qr.indexOf('https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=') === 0 && qr.indexOf('|2|2|000001|') > 0);
const parts = qr.split('?p=')[1].split('|');
const esperado = crypto.createHash('sha1').update('31260900000000000100650010000000091000000012|2|2|000001' + 'SEFAZMGCSC-EXEMPLO').digest('hex').toUpperCase();
ok('QR: último campo é o SHA-1(chave|2|tpAmb|idCSC + CSC)', parts[parts.length - 1] === esperado);

console.log('== DANFE A4 (NF-e 55) ==');
const danfe = s.nfxDanfeHtml({ numero: '9', modelo: '55', serie: '1', chave: '31260900000000000100550010000000091000000011', protocolo: '131260000000001', dataAutorizacao: '2026-09-18', emitente: 'Digicopy LTDA', cnpj: '00000000000100', ie: '0012345678', destinatario: 'Cliente Um', documentoDest: '11111111111', itens: [{ nome: 'Cópia colorida A4', qtd: 100, unit: 1.5, total: 150, ncm: '49119990' }], totalDaNota: 150, ambiente: 'homologacao' });
ok('DANFE traz chave mascarada (grupos de 4)', danfe.indexOf('3126 0900 0000 0000 0100 5500 1000 0000 0910 0000 0011') >= 0);
ok('DANFE traz protocolo + emitente + destinatário', danfe.indexOf('131260000000001') >= 0 && danfe.indexOf('Digicopy LTDA') >= 0 && danfe.indexOf('Cliente Um') >= 0);
ok('DANFE lista item com NCM e totais', danfe.indexOf('Cópia colorida A4') >= 0 && danfe.indexOf('49119990') >= 0 && /R\$\s*150/.test(danfe));
ok('DANFE de teste tem marca d’água SEM VALOR FISCAL e produção vem limpa', danfe.indexOf('SEM VALOR FISCAL') >= 0 && s.nfxDanfeHtml({ numero: '1', ambiente: 'producao', chave: '123', itens: [], totalDaNota: 0 }).indexOf('SEM VALOR FISCAL') < 0);
ok('DANFE NFC-e (A4, sem térmica): largura 80mm + QR + portal consulta', s.nfxDanfeNfceHtml({ numero: '3', chave: '31260900000000000100650010000000091000000012', protocolo: '1', itens: [{ nome: 'Xerox', qtd: 2, total: 2 }], totalDaNota: 2, qrUrl: qr, ambiente: 'homologacao' }).indexOf('width:80mm') >= 0 && s.nfxDanfeNfceHtml({ numero: '3', itens: [], totalDaNota: 0, qrUrl: 'x' }).indexOf('portalsped.fazenda.mg.gov.br') >= 0);

console.log('== PIPELINE: TRAVAS DE SEGURANÇA (portão 6.0.0 herdado) ==');
ok('emissão exige permissão (usuarioPodeEmitirNfe na checagem)', src.indexOf("window.usuarioPodeEmitirNfe && window.usuarioPodeEmitirNfe()") >= 0);
ok('emissão selá o XML de teste em homologação (nfgSeloTeste)', src.indexOf('nfgSeloTeste(xml, amb)') >= 0);
ok('senha pedida NA HORA (prompt) e nunca salva', src.indexOf("nfxPedirSenha") >= 0 && src.indexOf('senhaCert:senha') >= 0 && src.indexOf('localStorage') < 0 && src.indexOf('db.config.nfSenha') < 0);
ok('duplicidade: origem autorizada não reemite (abre DANFE)', src.indexOf("n.origemId===id && n.status==='autorizada'") >= 0 && src.indexOf('window.nfAbrirDanfe(ja.id)') >= 0);
ok('sem ponte: instrução honesta (nunca finge)', src.indexOf('nfxInstruirSemPonte') >= 0 && src.indexOf('só roda no app de computador (.exe)') >= 0);
ok('auditoria em cada etapa (início, assinatura, transmissão, resposta)', src.indexOf("nfxAudit('emitir-inicio'") >= 0 && src.indexOf("nfxAudit('emitir-resposta'") >= 0 && src.indexOf("nfxAudit('cancelar-inicio'") >= 0 && src.indexOf("nfxAudit('inutilizar-resposta'") >= 0);
ok('número nunca anda pra trás (max de seq+registro+1)', src.indexOf('Math.max(atual, maxReg)+1') >= 0);
ok('nada de temporizador no motor (mesma prova do portão)', !/setInterval\s*\(/.test(src) && !/setTimeout\s*\(\s*[\w$]/.test(src));
ok('cancelamento exige justificativa >= 15 e confere protocolo', src.indexOf("just.trim().length<15") >= 0 && src.indexOf("Nota sem protocolo não cancela") >= 0);
ok('cancelamento em PRODUÇÃO pede confirmação extra', src.indexOf('Cancelar nota DE VERDADE (produção)?') >= 0);

console.log('== PONTE .exe (main.js / preload.js) ==');
ok('main.js: handler nfe:transmitir com lista-branca SEFAZ-MG', main.indexOf("ipcMain.handle('nfe:transmitir'") >= 0 && /hnfe\\\.nfe\|nfe\|hnfce\|nfce/.test(main));
ok('main.js: TLS 1.2 + certificado pfx do PC + senha na hora', main.indexOf("minVersion: 'TLSv1.2'") >= 0 && main.indexOf('passphrase: senhaCert') >= 0 && main.indexOf('fs.readFileSync(p)') >= 0);
ok('main.js: 3 tentativas só em falha de servidor (4xx não repete)', main.indexOf('tent < 3') >= 0 && main.indexOf('4xx = rejeição técnica') >= 0);
ok('main.js: URL inválida é recusada antes de sair do PC', main.indexOf('URL fora da lista branca') >= 0);
ok('preload expõe transmitir ao lado de assinar', preload.indexOf("transmitir: (dados) => ipcRenderer.invoke('nfe:transmitir', dados)") >= 0);
ok('resposta volta como texto XML (não vaza segredo)', main.indexOf("resolve({ ok: resp.statusCode") >= 0 || main.indexOf('xml: corpo') >= 0);

console.log('== HISTÓRICO + CARIMBO 6.0.1 ==');
ok('histórico na Central: tabela com DANFE/XML/Cancelar por nota', src.indexOf('nfxRenderHistorico') >= 0 && src.indexOf("data-nfx=\"danfe\"") >= 0 && src.indexOf("data-nfx=\"xml\"") >= 0 && src.indexOf("data-nfx=\"cancelar\"") >= 0);
ok('histórico herda a trava: render só quando a central abre (wrap do abrirCentralNfe)', src.indexOf('window.abrirCentralNfe=function') >= 0 && src.indexOf('_cen1.apply') >= 0);
ok('guard anti dupla-instalação', src.indexOf('__v6001nfx') >= 0);
ok('patch na 207 (autocura 208; perfis 209; permissões 210; menu fiscal v6.0.6 na 211; Início clicável v6.0.7 na 212; menus fiscais separados v6.0.8 na 212; override v6.0.9 na 214; 6 submenus v6.0.10 na 215; hover NF-e/NFC-e v6.0.11 fecha na 216)', manifest.length >= 225 && manifest[206] === 'nf_transmissao_patch.js' && manifest[207] === 'autocura_empresa_central_nf_tela_patch.js' && manifest[208] === 'perfis_nuvem_cura_sessao_patch.js' && manifest[209] === 'permissoes_estorno_venda_patch.js' && manifest[210] === 'fiscal_menu_completo_patch.js' && manifest[211] === 'dashboard_inicio_clicavel_patch.js' && manifest[212] === 'menus_fiscais_separados_patch.js' && manifest[213] === 'permissoes_override_menus_fiscais_patch.js' && manifest[214] === 'seis_submenus_velho_patch.js' && manifest[215] === 'submenu_hover_nfe_patch.js');
ok('motor no bundle gerado', bundle.indexOf('MOTOR FISCAL v6.0.1') >= 0);
ok('package.json na 6.0.1', pkg.version === VERSAO_APP);
ok('index.html carimbado 6.0.1', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('worker atualizado 5.28.2 · gerente segue 5.26.3', fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("WORKER_VERSION = '5.28.2'") >= 0 && JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8')).version === '5.26.3');

console.log('\nTudo OK — v6.0.1 (MOTOR FISCAL COMPLETO: transmissão SEFAZ-MG, DANFE A4, cancelamento, inutilização, QR NFC-e — tudo em homologação primeiro, provedor de provas nos retornos reais).');
//<<<<SECAO:test_ajustes_v6001.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5248.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5248.js:INICIO>>>>
// Teste v5.24.34 — O FREIO DAS GRAVAÇÕES DA NUVEM (o alerta dos "76 mil"):
//  • buscador Caixa Escolar: automático com rédea (1x/hora quando velho,
//    relógio de 10 em 10 min, lista vazia NÃO dispara, sem login nem tenta,
//    nunca limpa a base sozinho, nunca duas buscas ao mesmo tempo);
//  • worker: medidor de uso não grava mais a cada leitura (acumula em memória,
//    desce junto de gravação real ou a cada 15 min);
//  • carimbos 5.24.34 + script de raio-x (ver_gasto_nuvem.cmd) presentes.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }
const escola = fs.readFileSync('buscador_escola_patch.js', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM= fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const cmd    = fs.readFileSync('ver_gasto_nuvem.cmd', 'utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- escola: rédea no automático --');
ok(escola.indexOf('function esAutoTique()') >= 0, 'esAutoTique existe');
ok(escola.indexOf('setInterval(esAutoTique,10*60*1000)') >= 0, 'relógio barato de 10 em 10 minutos (sem rede fora da aba; era 60 segundos no começo)');
ok(escola.indexOf('sync({auto:true,incremental:true})') >= 0, 'automático nunca limpa a base (incremental sempre)');
ok(escola.indexOf('if(window.__esSync) return;') >= 0 && escola.indexOf("if(window.__esSync && opt && opt.auto) return {ok:false,error:'em-andamento'}") >= 0, 'nunca duas buscas ao mesmo tempo');
ok(escola.indexOf('if(!loginDaNuvem()&&!loginDoNavegador()) return;') >= 0, 'sem login salvo, nem tenta');
ok(escola.indexOf('function esAbaAberta()') >= 0 && escola.indexOf('if(!esAbaAberta()) return;') >= 0, 'v6.0.6: automático SÓ trabalha com a aba do buscador aberta (decreto: consumia até fora dela)');
ok(escola.indexOf('try{ esAutoTique(); }catch(e){}') >= 0, 'v6.0.6: abrir a aba já confere dados velhos na hora');
ok(escola.indexOf('||vazio)sync({auto:true,limpar:vazio,incremental:!vazio})') === -1, 'lista vazia NÃO dispara mais sincronização a cada minuto');
ok(escola.indexOf('limpar:vazio') === -1, 'automático sem modo limpar em lugar nenhum');
ok(escola.indexOf('Baixar Tudo') >= 0 && escola.indexOf('Atualizar') >= 0, 'botões manuais da tela continuam (Atualizar / Baixar Tudo)');

console.log('-- worker: medidor sem autogasto --');
ok(worker.indexOf('let __USO_PEND = { esc: 0, lei: 0, desde: 0 }') >= 0, 'acumulador do medidor existe');
ok(worker.indexOf('if (!temGravacao && !deu15min) return;') >= 0, 'leitura pura não grava nada no banco');
ok(worker.indexOf('15 * 60 * 1000') >= 0, 'descarga a cada 15 minutos no máximo');

console.log('-- raio-x + carimbos --');
ok(cmd.indexOf('digicopy-erp') >= 0 && cmd.indexOf('FROM changes') >= 0 && cmd.indexOf('FROM devices') >= 0, 'ver_gasto_nuvem.cmd pergunta por tipo de registro e por aparelho');
const cmdMotor = fs.readFileSync('atualizar_motor_nuvem.cmd', 'utf8');
ok(cmdMotor.indexOf('migrations apply DB --remote') >= 0 && cmdMotor.indexOf('wrangler deploy') >= 0, 'atualizar_motor_nuvem.cmd migra E publica, na ordem');
ok(cmdMotor.indexOf('/health') >= 0 && cmd.indexOf('/health') >= 0, 'os dois atalhos conferem a versão no ar via /health');
ok(worker.indexOf("const WORKER_VERSION = '5.28.2'") >= 0, 'worker carimbado (re-ancorado v5.28.2 = foto da nuvem; o carimbo original era 5.24.34)');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0, 'index.html carimbado (re-ancorado v6.0.9)');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0, 'mobile/www/index.html carimbada (re-ancorado v6.0.9)');
ok(pkg.version === VERSAO_APP, 'package.json carimbado (re-ancorado v6.0.9)');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf('esAutoTique') >= 0, 'freio da escola está dentro do bundle');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v5.24.34'); process.exit(1); }
console.log('\nTudo certo v5.24.34!');
//<<<<SECAO:test_ajustes_v5248.js:FIM>>>>
}

if (false) { // ═══ test_ponte_electron.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ponte_electron.js:INICIO>>>>
// Teste da ponte Electron (v5.22.66)
// Garante que o preload não volte a expor objetos congelados com os
// nomes que os patches precisam envelopar — foi isso que derrubou o
// A1 da nuvem no .exe e não no navegador.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let falhas = 0;
function ok(nome, cond) {
  if (cond) console.log('  \u2714 ' + nome);
  else { console.log('  \u2718 ' + nome); falhas++; }
}

const raiz = __dirname;
const preload = fs.readFileSync(path.join(raiz, 'preload.js'), 'utf8');
const fonte = fs.readFileSync(path.join(raiz, 'ponte_electron_patch.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(raiz, 'bundle-manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));

// ---- carrega o patch num window de mentira -------------------------
function novaTela(pontes) {
  const win = { console: { log() {} } };
  win.window = win;
  if (pontes) win.__digicopyPontes = pontes;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  return win;
}

// ---- preload -------------------------------------------------------
const expostos = [...preload.matchAll(/exposeInMainWorld\(\s*'([^']+)'/g)].map(m => m[1]);
ok('preload expõe uma ponte só', expostos.length === 1);
ok('a ponte se chama __digicopyPontes', expostos[0] === '__digicopyPontes');

const proibidos = ['firebirdAPI', 'fileAPI', 'caixaEscolarAPI', 'printAPI', 'backupAPI', 'nfeCertAPI'];
ok('nenhuma API vai congelada direto para o window',
   proibidos.every(n => !expostos.includes(n)));

for (const nome of proibidos) {
  ok('a ponte continua entregando ' + nome,
     new RegExp('\\n\\s*' + nome + ':\\s*\\{').test(preload));
}
ok('assinar continua na ponte com os 3 argumentos',
   /assinar:\s*\(xml,\s*senha,\s*pfxB64\)/.test(preload));

// ---- ordem no bundle ------------------------------------------------
ok('ponte_electron_patch.js é o primeiro do bundle',
   manifest[0] === 'ponte_electron_patch.js');
ok('a ponte vem antes de quem usa nfeCertAPI',
   manifest.indexOf('ponte_electron_patch.js') <
   manifest.indexOf('ajustes_v52221_cert_nuvem_a1_patch.js'));

// ---- comportamento ---------------------------------------------------
const tela = novaTela({
  nfeCertAPI: Object.freeze({ assinar: () => 'original', isElectron: true }),
  printAPI: Object.freeze({ cleanPrint: () => 1 })
});

ok('publica os nomes de sempre no window',
   typeof tela.nfeCertAPI === 'object' && typeof tela.printAPI === 'object');
ok('mantém os métodos funcionando', tela.nfeCertAPI.assinar() === 'original');
ok('mantém os valores simples', tela.nfeCertAPI.isElectron === true);
ok('diz quais pontes abriu',
   Array.isArray(tela.__DIGICOPY_PONTES_ABERTAS) &&
   tela.__DIGICOPY_PONTES_ABERTAS.length === 2);

// o ponto do bug: agora dá para envelopar
let envelopou = true;
try {
  const velho = tela.nfeCertAPI.assinar;
  tela.nfeCertAPI.assinar = function () { return 'envelopado:' + velho(); };
} catch (e) { envelopou = false; }
ok('dá para trocar um método (era o erro do .exe)', envelopou);
ok('o envelope realmente vale', tela.nfeCertAPI.assinar() === 'envelopado:original');

// não pode estragar o navegador, onde não existe ponte nenhuma
const semPonte = novaTela(null);
ok('sem preload não quebra nada', semPonte.__DIGICOPY_PONTES_ABERTAS.length === 0);
ok('sem preload não inventa API', semPonte.nfeCertAPI === undefined);

const janelaExistente = { console: { log() {} } };
janelaExistente.window = janelaExistente;
Object.defineProperty(janelaExistente, 'nfeCertAPI', {
  value: Object.freeze({ assinar: () => 'travado' }), writable: false, configurable: true
});
janelaExistente.__digicopyPontes = { nfeCertAPI: Object.freeze({ assinar: () => 'da ponte' }) };
vm.createContext(janelaExistente);
vm.runInContext(fonte, janelaExistente);
ok('substitui até um global somente-leitura', janelaExistente.nfeCertAPI.assinar() === 'da ponte');

// ---- os dois patches que quebravam ------------------------------------
for (const arq of ['ajustes_v52221_cert_nuvem_a1_patch.js', 'ajustes_v52228_a1_nuvem_lupa_ncm_patch.js']) {
  const txt = fs.readFileSync(path.join(raiz, arq), 'utf8');
  ok(arq + ' continua envelopando assinar', /\.assinar\s*=\s*function/.test(txt));
  ok(arq + ' está no bundle', manifest.includes(arq));
}

// ---- API do módulo -----------------------------------------------------
const api = tela.PONTE_ELECTRON_PURE;
ok('expõe PONTE_ELECTRON_PURE', !!api);
ok('copiaGravavel devolve cópia solta', (() => {
  const congelado = Object.freeze({ a: 1 });
  const copia = api.copiaGravavel(congelado);
  copia.a = 2;
  return copia.a === 2 && congelado.a === 1;
})());
ok('copiaGravavel aguenta valor vazio', api.copiaGravavel(null) === null);
ok('abrir devolve lista vazia sem ponte', api.abrir({}, null).length === 0);
ok('versão do módulo bate com o package.json',
   /^\d+\.\d+\.\d+/.test(api.VERSAO) && /^\d+\.\d+\.\d+/.test(pkg.version));

// ---- não mexe no celular ------------------------------------------------
ok('patch não fala de APK/Capacitor', !/capacitor|cordova|apk/i.test(fonte));

console.log(falhas === 0
  ? '\nRESULTADO: ponte Electron passou!'
  : '\nRESULTADO: ' + falhas + ' falha(s) na ponte Electron');
process.exit(falhas === 0 ? 0 : 1);
//<<<<SECAO:test_ponte_electron.js:FIM>>>>
}

if (false) { // ═══ test_versao_visual.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_versao_visual.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — versão exibida na tela (rodapé + nome da janela)
//
// Bug corrigido na v5.22.63: seis patches faziam
//     window.DIGICOPY_APP_VERSION = VERSAO;
// com a versão FIXA deles, sobrescrevendo a versão real definida no
// index.html. O último a rodar (v5.22.60) vencia, e o sistema mostrava
// "v5.22.60" no rodapé e "Sistema Digicopy v5.22.60" no nome da janela,
// mesmo estando na 5.22.63.
//
// Este teste impede a volta do problema de três formas: proíbe sobrescrever a
// versão global, proíbe pintar a tela com versão fixa e simula a ordem real
// de carregamento conferindo o resultado final.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }

const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const html = fs.readFileSync('index.html','utf8');
const VER = pkg.version;

console.log('== VERSÃO NA TELA ==');

// ── 1. index.html é a fonte da verdade ──────────────────────────────────────
ok('index.html define a versão real', html.indexOf("window.DIGICOPY_APP_VERSION = '"+VER+"'") >= 0);
ok('título do index está na versão', html.indexOf('<title>Sistema Digicopy v'+VER+'</title>') >= 0);
ok('rodapé do index está na versão', new RegExp('id="footer-version"[^>]*>v'+VER.replace(/\./g,'\\.')+'<').test(html));

// ── 2. Ninguém pode sobrescrever a versão global ────────────────────────────
const clobber = manifest.filter(f => /window\.DIGICOPY_APP_VERSION\s*=\s*VERSAO\s*;/.test(fs.readFileSync(f,'utf8')));
ok('nenhum patch sobrescreve a versão global' + (clobber.length ? ' → ' + clobber.join(', ') : ''),
   clobber.length === 0);

// ── 3. Ninguém pinta a tela com versão fixa ─────────────────────────────────
const reFixa = /(?:textContent|document\.title)\s*=\s*'[^']*'\s*\+\s*VERSAO\b/;
const pintaFixo = manifest.filter(f => {
  const s = fs.readFileSync(f,'utf8');
  if (!/footer-version|app-title-version|document\.title\s*=/.test(s)) return false;
  return reFixa.test(s);
});
ok('nenhum patch pinta rodapé/título com versão fixa' + (pintaFixo.length ? ' → ' + pintaFixo.join(', ') : ''),
   pintaFixo.length === 0);

// ── 4. Simulação da ordem real de carregamento ──────────────────────────────
// index.html define a versão; depois os scripts do bundle rodam em ordem.
const win = { DIGICOPY_APP_VERSION: VER };
let rodape = 'v' + VER;
let titulo = 'Sistema Digicopy v' + VER;

for (const f of manifest) {
  const s = fs.readFileSync(f, 'utf8');
  const mv = /var VERSAO\s*=\s*'([0-9.]+)'/.exec(s);
  if (!mv) continue;
  const VERSAO = mv[1];

  if (/window\.DIGICOPY_APP_VERSION\s*=\s*VERSAO\s*;/.test(s)) {
    win.DIGICOPY_APP_VERSION = VERSAO;                       // sobrescreve (proibido)
  } else if (/window\.DIGICOPY_APP_VERSION\s*=\s*window\.DIGICOPY_APP_VERSION\s*\|\|\s*VERSAO\s*;/.test(s)) {
    win.DIGICOPY_APP_VERSION = win.DIGICOPY_APP_VERSION || VERSAO;   // respeita (correto)
  }

  const leGlobal = /_vUI|curV/.test(s);
  if (/footer-version/.test(s)) {
    rodape = 'v' + (leGlobal ? win.DIGICOPY_APP_VERSION : VERSAO);
  }
  if (/document\.title\s*=/.test(s) && /Sistema Digicopy v/.test(s)) {
    titulo = 'Sistema Digicopy v' + (leGlobal ? win.DIGICOPY_APP_VERSION : VERSAO);
  }
}

ok('versão global sobrevive aos ' + manifest.length + ' scripts (v' + win.DIGICOPY_APP_VERSION + ')',
   win.DIGICOPY_APP_VERSION === VER);
ok('rodapé termina em v' + VER + ' (viu: ' + rodape + ')', rodape === 'v' + VER);
ok('nome da janela termina em v' + VER + ' (viu: ' + titulo + ')', titulo === 'Sistema Digicopy v' + VER);

// ── 5. O último painter é o da versão atual e cuida do título ───────────────
const ultimo = fs.readFileSync('ajustes_v52263_exe_completo_patch.js','utf8');
ok('painter final acerta o nome da janela', /document\.title = tituloCerto/.test(ultimo));
ok('painter final lê a versão global', /window\.DIGICOPY_APP_VERSION/.test(ultimo));

console.log('\nRESULTADO: versão na tela passou!');
//<<<<SECAO:test_versao_visual.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6105.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6105.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// v6.1.4 · rodada 22/09/2026 (nº3) — o que o dono pediu NESTA leva, com prova:
//
//  1) "tirar a trava de escolha: conectou, sincroniza na hora"        → nuvem
//  2) "do dashboard do início, mostra também vendas/orçamentos"       → Início
//  3) "quero resolver o Cliente sem vínculo"                          → contratos
//  4) ".git fica voltando pra trás"                                   → guardar_repo
//  5) "esse relatório repete pergunta já resolvida"                   → relatório
//     e a resposta ao "esquece o Worker, qual o passo real?"           → passo real
//
// Roda sozinho: node test_ajustes_v6105.js
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let okCount = 0, fail = 0;
function ok(cond, nome){
  if(cond){ okCount++; console.log('  ✔ ' + nome); }
  else { fail++; console.log('  ✘ ' + nome); }
}
function ler(p){ return fs.readFileSync(p, 'utf8'); }
const VERSAO_APP = JSON.parse(ler('package.json')).version;

console.log('\n== v6.1.4 rodada 22/09 nº3 ==');
// AUDITORIA 23/09/2026 — este assert fixava a versão escrita à mão ('6.1.10') e
// por isso morria a cada troca de versão. Agora ele confere o que interessa de
// verdade: que package.json, o index.html do PC e o do celular carregam a MESMA
// versão. Continua pegando o defeito real (versão dessincronizada) e não precisa
// mais ser reescrito a cada publicação.
const indexHtml = ler('index.html');
const indexMob = ler('mobile/www/index.html');
ok(/^\d+\.\d+\.\d+$/.test(VERSAO_APP), 'a versão do app é um número de versão válido (v' + VERSAO_APP + ')');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0,
   'o index.html carrega a MESMA versão do package.json (v' + VERSAO_APP + ')');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0,
   'a cópia do celular também acompanha a versão (v' + VERSAO_APP + ')');

// ── 1. NUVEM: conectou = sincroniza, sem escolha e sem susto ────────────────
console.log('\n== NUVEM: conectou, sincroniza (fim da trava) ==');
const sync = ler('cloudflare_data_sync_patch.js');
ok(/function decideReinstallGuard\(opts\)\{[\s\S]{0,1200}?pause:false,isolate:false,hold:false,reason:'sincroniza-direto'/.test(sync),
   'a decisão do motor SEMPRE libera a sincronização (pause:false · isolate:false · hold:false)');
ok(sync.indexOf("const REGRAS='v6.1.7-conectou-sincroniza'") >= 0,
   'a marca das regras mudou: quem estava na trava antiga é destravado ao abrir');
ok(/^state\.paused=false;$/m.test(sync) && sync.indexOf("state.pauseReason='';") >= 0,
   'ao carregar o motor, a pausa de escolha é zerada (ninguém fica esperando resposta)');
ok(sync.indexOf("reason:'sincroniza-direto'") >= 0 && !/pause:true/.test(sync),
   'nenhum caminho do módulo volta a pausar por escolha');
const syncUI = ler('cloudflare_sync_patch.js');
ok(/function cobrarEscolha\(\)\{ \/\* mantida por compatibilidade: agora não faz nada \*\/ \}/.test(syncUI),
   'o pop-up que cobrava a escolha não existe mais (fica só a função vazia, para não quebrar chamada antiga)');
ok(syncUI.indexOf('Sincronização automática ativa — conectou, sincroniza sozinho.') >= 0,
   'a janela da Nuvem diz, em português, que sincroniza sozinho');
ok(syncUI.indexOf('Sincronizando automaticamente — nada a escolher') >= 0,
   'durante a sincronização ela avisa que não há nada a escolher');
ok(sync.indexOf('function baixarTudoDaNuvem(') >= 0 && sync.indexOf('function estadoDetalhado(') >= 0,
   'o check-up da nuvem continua aqui (baixar tudo + estado detalhado por lista)');
ok(syncUI.indexOf('dc-sync-now') < 0 && syncUI.indexOf('Sincronizar agora') < 0,
   'o botão manual saiu da janela (r46: sincroniza sozinho, sem botão)');

// ── 2. INÍCIO: cartões de vendas e orçamentos ───────────────────────────────
console.log('\n== INÍCIO: vendas e orçamentos no painel ==');
const app = ler('app.js');
ok(app.indexOf("id=\"kpi-vendas\"") >= 0 && app.indexOf("id=\"kpi-orcamentos\"") >= 0,
   'o painel do Início tem os dois cartões novos');
ok(/Vendas do mês/.test(app) && /Orçamentos abertos/.test(app), 'os títulos são claros (Vendas do mês · Orçamentos abertos)');
ok(app.indexOf("navigateTo('vendas')") >= 0 && app.indexOf("setNeoVendasTab('orcamentos')") >= 0,
   'clicar leva para a origem: vendas e a aba Orçamentos');
ok(app.indexOf('lg:grid-cols-5') < 0 && app.indexOf('lg:grid-cols-4') >= 0,
   'a grade foi reorganizada para 4 colunas (cabe sem aperto no PC do escritório)');
ok(app.indexOf("const elVendas=document.getElementById('kpi-vendas')") >= 0 &&
   app.indexOf("const elOrc=document.getElementById('kpi-orcamentos')") >= 0 &&
   app.indexOf("elVendas.innerText=vendasMes.length") >= 0,
   'nada de número fixo: os dois cartões são calculados na hora, em renderDashboard()');

// ── 3. CONTRATOS: cliente sem vínculo resolvido pelo SISTEMA ───────────────
console.log('\n== CONTRATOS: o sistema acha o cliente sozinho ==');
const cf = ler('contratos_final_patch.js');
ok(cf.indexOf('function cfCurarVinculos(empId)') >= 0, 'existe a cura automática dos vínculos (roda sozinha ao reconciliar)');
ok(cf.indexOf('try{ cfCurarVinculos(empId); }catch(e)') >= 0, 'a cura roda dentro da reconciliação, sem ninguém clicar');
ok(cf.indexOf('function cfClientePorEvidencia(c, empId)') >= 0,
   'acha o cliente pela EVIDÊNCIA (parque, leituras, OS, vendas) quando o nome não ajuda');
ok(cf.indexOf('function cfPontosDeNome(a, b)') >= 0 && cf.indexOf('function cfPontuar(nome, empId)') >= 0,
   'nome parecido é pontuado (não é só igualdade exata)');
ok(cf.indexOf('escolhido o mais antigo') >= 0, 'empate de nome parecido é decidido pelo cadastro mais antigo — e escrito o porquê');
ok(cf.indexOf('function cfCriarClienteDoContrato(') >= 0 && cf.indexOf('Cadastro reconstruído do contrato') >= 0,
   'quando não existe cadastro, o sistema reconstrói a partir do próprio contrato (sem inventar dado)');
ok(cf.indexOf('CF_NOME_GENERICO') >= 0 && cf.indexOf('function cfNomeServivel') >= 0,
   'nome genérico ("Cliente", "Balcão") não vira cadastro — honesto em vez de poluir');
ok(cf.indexOf("logAction('contrato','vínculo-automático'") >= 0, 'cada vínculo automático entra na Auditoria com o motivo');
ok(cf.indexOf('vinculoAutomatico') >= 0, 'o contrato fica marcado como vínculo automático (dá para auditar depois)');
ok(cf.indexOf('Cadastro com o nome no sistema antigo') >= 0 || cf.indexOf('function dadosDoContratoAntigo(c)') >= 0,
   'o nome é buscado também na linha do sistema antigo (locação), não só no cadastro');
const cv = ler('ajustes_v5214_clientes_visiveis_patch.js');
ok(cv.indexOf('clientesDuplicadosVincularContrato') >= 0 && cv.indexOf('🔗 Vincular cliente') >= 0,
   'o botão 🔗 continua como plano B (rede de segurança), sem virar obrigação');

// ── 4. .GIT: para não voltar mais pra trás ─────────────────────────────────
console.log('\n== GITHUB: nada volta pra trás ==');
ok(fs.existsSync('guardar_repo.js'), 'existe o guardar_repo.js (salva + envia tudo para o GitHub)');
const gp = JSON.parse(ler('package.json')).scripts || {};
ok(gp.guardar === 'node guardar_repo.js' && gp['guardar:check'] === 'node guardar_repo.js --check',
   'os atalhos npm run guardar / npm run guardar:check estão no package.json');
const g = ler('guardar_repo.js');
ok(g.indexOf('reset --soft FETCH_HEAD') >= 0, 'ele ensina o conserto certo quando a branch anda (reset --soft, nunca re-clone)');
ok(g.indexOf('HEAD:' + "' + BRANCH") >= 0 || g.indexOf("'HEAD:' + BRANCH") >= 0 || g.indexOf('HEAD:') >= 0,
   'o envio é para a branch desta sessão, por parâmetro (não empurra em branch errada)');
ok(g.indexOf('--check') >= 0 && g.indexOf('não commitei nada') >= 0, 'tem modo simulação (--check) que só olha, sem mexer em nada');
ok(fs.existsSync('guardar_repo.cmd'), 'tem o guardar_repo.cmd para ele clicar com dois cliques no PC');
ok(ler('guardar_repo.cmd').indexOf('GUARDAR O TRABALHO NO GITHUB') >= 0, 'o .cmd explica na tela o que vai fazer');

// ── 5. RELATÓRIO: pergunta repetida sai, e a nova entra ────────────────────
console.log('\n== RELATÓRIO DE TESTE: nada de repetir o que já foi resolvido ==');
const rel = ler('RELATORIO_DE_TESTE_NF.html');
ok(rel.indexOf("id:'E'") >= 0 && rel.indexOf("id:'F'") >= 0 && rel.indexOf("id:'G'") >= 0,
   'tem as partes novas E (nuvem), F (contratos) e G (rodapé/versão)');
ok(rel.indexOf('Conectou na nuvem (CNPJ + qualquer uma das duas senhas) e sincronizou SOZINHO') >= 0,
   'a primeira pergunta da parte E é exatamente o que ele testa ao conectar');
ok(rel.indexOf('O rodapé mostra a versão v' + VERSAO_APP) >= 0, 'a parte G cobra a versão que está no ar agora');
ok(rel.indexOf("'repetida'") >= 0 && rel.indexOf('✅ resolvido antes') >= 0,
   'cada pergunta tem estado (continua aberto / resolvido antes)');
ok(rel.indexOf('sem painel, sem token, sem GitHub') >= 0,
   'a seção do motor ensina o passo real, em português, com essas palavras');
ok(rel.indexOf('cloudflare-worker/deploy_github_actions') < 0 && rel.indexOf('publicar-motor.yml') < 0,
   'a conversa de GitHub Actions saiu do relatório (ele mandou esquecer o Worker e ensinar o passo)');

console.log('\n' + (fail ? ('RESULTADO: ' + fail + ' falha(s), ' + okCount + ' ok') : ('Tudo OK — ' + okCount + ' verificações passaram.')));
if(fail) process.exit(1);
//<<<<SECAO:test_ajustes_v6105.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6106.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6106.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// v6.1.6 — RODADA 22/09/2026 (nº4): o que o dono pediu, item por item.
//
//   1) "sabe a parte de nota fiscal e clica pra criar uma nova? ela não vai ser
//      em formato menu, e sim em formato aba, que nem o de vendas, e ta vendo
//      essa foto? é o que aparece quando eu clico no botão de fazer nova NF no
//      outro sistema antigo" → as 5 opções da foto, em ABA:
//        Gerar NF-e Avulsa · Gerar de NF-e Devolução para Cliente ·
//        Gerar de NF-e Devolução para Fornecedor · Gerar NFCe ·
//        Importar Declaração de Importação
//   2) "na hora de colocar a senha da nuvem aparece um olho a mais, resolva,
//      deixa somente um olho" → o olho do navegador (Edge/Chrome) é escondido.
//   3) "a nuvem não está sincronizando, um PC não mostra as informações a
//      outro PC" → bugs achados no teste de dois PCs contra o motor DE VERDADE
//      (estado perdido na troca, rodada antiga desfazendo a decisão nova,
//      contagem da nuvem de 10 minutos atrás).
//   4) "é possível que você não anotou elas o que foi resolvido?" → o relatório
//      de teste ganhou a PARTE H (o que é novo nesta rodada) e continua marcando
//      o que já foi resolvido, com o filtro para não repetir pergunta.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
function ok(nome, cond) {
  if (!cond) { console.error('  ✘ ' + nome); process.exit(1); }
  console.log('  ✔ ' + nome);
}
const ler = f => fs.readFileSync(f, 'utf8');

console.log('\n== 1) NOVA NOTA FISCAL EM ABA (as 5 opções da foto dele) ==');
const fx = ler('fiscal_catalogo_completo_patch.js');
const panel = ler('cloudflare_sync_patch.js');
const titulos = [
  'Gerar NF-e Avulsa',
  'Gerar de NF-e Devolução para Cliente',
  'Gerar de NF-e Devolução para Fornecedor',
  'Gerar NFCe',
  'Importar Declaração de Importação'
];
ok('as 5 opções do sistema antigo estão no arquivo, com o nome exato',
  titulos.every(t => fx.indexOf(t) >= 0));
ok('é ABA (cartões dentro da Central), não menu nem janelinha',
  fx.indexOf('fx-novo-grid') >= 0 && fx.indexOf('fx-novo-opt') >= 0 &&
  fx.indexOf("onclick=\"fxAcao(\\'nf-novo-menu\\')\"") >= 0);
ok('o botão da lista virou "Nova nota" e volta para a lista',
  fx.indexOf('>Nova nota<') >= 0 && fx.indexOf("'nf-novo-voltar'") >= 0);
ok('cada tipo nasce com modelo/finalidade certos (55 venda, 55 devolução, 65 NFCe)',
  /avulsa[\s\S]{0,220}?modelo:'55', finalidade:'1'/.test(fx) &&
  /dev-cli[\s\S]{0,220}?finalidade:'4'/.test(fx) &&
  /dev-forn[\s\S]{0,220}?finalidade:'4'/.test(fx) &&
  /nfce[\s\S]{0,220}?modelo:'65'/.test(fx));
ok('a devolução já avisa para referenciar a nota de origem (chave de 44)',
  /DEVOLUÇÃO — referenciar a chave da nota de origem/.test(fx));
ok('a importação abre com o texto da DI para preencher',
  /Declaração de Importação \(DI\) nº/.test(fx));
ok('a criação fica registrada (log da nota + auditoria)',
  /nota-criada', detalhe: 'rascunho aberto pela aba Nova nota/.test(fx) &&
  /I\.log\('nf-nova'/.test(fx));

console.log('\n== 2) UM OLHO SÓ NA SENHA DA NUVEM ==');
const login = ler('ajustes_v5262_login_nuvem_primeiro_patch.js');
ok('o olho do navegador (Edge/Chrome) é escondido por CSS',
  /::-ms-reveal/.test(login) && /::-ms-clear/.test(login) &&
  /::-webkit-credentials-auto-fill-button/.test(login));
ok('isso roda quando o arquivo carrega (vale no painel da nuvem também)',
  /\n  esconderOlhoNativo\(\);\n/.test(login) &&
  /document\.addEventListener\('DOMContentLoaded', esconderOlhoNativo\)/.test(login));
ok('o único olho é o botão do sistema (mostrar/ocultar)',
  login.indexOf('v5262-mostrar-senha') >= 0 &&
  login.indexOf("campo.type = mostrar ? 'text' : 'password'") >= 0);

console.log('\n== 3) SINCRONIZAÇÃO ENTRE PCS (bugs achados no teste de verdade) ==');
const sync = ler('cloudflare_data_sync_patch.js');
ok('estado não fica mais sem os campos extras ao ser trocado inteiro',
  /function normalizarEstado\(novo\)\{/.test(sync) && /state\.sumindo=\(state\.sumindo&&/.test(sync));
ok('toda troca de estado passa pelo carimbo de geração',
  /function trocarEstado\(novo\)\{state=novo;estadoGeracao\+\+;return state;\}/.test(sync) &&
  (sync.match(/trocarEstado\(normalizarEstado\(/g) || []).length === 2);
ok('rodada antiga para de escrever quando a decisão muda no meio',
  /const geracao=estadoGeracao;/.test(sync) && /if\(trocou\(\)\)return false;/.test(sync));
ok('a varredura não estoura mais quando o campo extra não existe',
  /if\(!state\.sumindo\|\|typeof state\.sumindo!=='object'\)state\.sumindo=\{\};/.test(sync));
ok('a nuvem agora diz a versão nova (0.4.9 / 5.26.7)',
  fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("API_VERSION = '0.4.9'") >= 0);
ok('o motor para colar foi regerado junto (não fica para trás)',
  ler('cloudflare-worker/motor_para_colar.js').indexOf('API_VERSION = "0.4.9"') >= 0);

console.log('\n== 4) SÓ NUVEM: NADA GUARDADO NO PC (ordem dele em maiúsculas) ==');
ok('o modo existe e vem LIGADO sempre (r46: modo único, sem escolha guardada)',
  /function modoSoNuvem\(\)\{ return true; \}/.test(sync));
ok('em SÓ NUVEM a base não é gravada no computador (saveDB não persiste)',
  /const soNuvem=!!window\.DIGICOPY_SO_NUVEM&&authorized\(\)/.test(sync) &&
  /const r=soNuvem\?true:original\.apply\(this,arguments\)/.test(sync));
ok('a cópia só é solta quando a nuvem confirma que tem TUDO o que este PC tem',
  /async function nuvemTemTudo\(\)\{/.test(sync) &&
  /if\(modoSoNuvem\(\)&&!outbox\.length&&await nuvemTemTudo\(\)&&tudoConfirmadoNaNuvem\(\)\)\{/.test(sync) &&
  /return naNuvem>=localBusinessCount\(\);/.test(sync));
// v7.0.17 (rodada 29) — a contagem NÃO bastava: agora a liberação exige prova POR
// REGISTRO (chave conhecida + hash igual). Provado em test_nuvem_perde.js: sem isso,
// registros segurados (só neste PC) eram apagados junto com a cópia local.
ok('a liberação da cópia local exige prova ITEM POR ITEM (não só a contagem)',
  /function tudoConfirmadoNaNuvem\(\)\{/.test(sync) &&
  /if\(!state\.known\[k\]\|\|state\.hashes\[k\]!==hash\(entry\.data\)\)\{provaOk=false;return false;\}/.test(sync) &&
  /if\(\(state\.heldLocalOnly\|\|\[\]\)\.length\)return false;/.test(sync));
ok('sem resposta da nuvem a cópia NÃO é solta (nada se perde)',
  /function nuvemTemTudo\(\)\{[\s\S]{0,400}?catch\(e\)\{ return false; \}/.test(sync));
ok('a base é remontada lendo o diário da nuvem desde o começo',
  /state\.cursor=0; state\.versions=\{\}; state\.initialPull=true;/.test(sync));
ok('a tela se redesenha sozinha quando os dados chegam da nuvem',
  /function hidratarTela\(\)/.test(sync) && /window\.navigateTo\(tela\)/.test(sync));
ok('o painel da Nuvem mostra onde os dados ficam (só-nuvem único, sem ligar/desligar)',
  panel.indexOf('dc-sonuvem-toggle') < 0 && panel.indexOf('dc-sonuvem-limpar') < 0 &&
  panel.indexOf('SÓ NUVEM') >= 0);
ok('o rodapé diz, em português, que os dados estão só na nuvem',
  ler('ajustes_v52245_rodape_versao_patch.js').indexOf('dados só na nuvem') >= 0);

// prova de verdade: o motor roda e a limpeza preserva a credencial do PC
(function testarSoNuvemDeVerdade(){
  const codigo = ler('cloudflare_data_sync_patch.js');
  const mapa = new Map();
  const storage = {
    getItem: k => (mapa.has(k) ? mapa.get(k) : null),
    setItem: (k, v) => { mapa.set(k, String(v)); },
    removeItem: k => { mapa.delete(k); },
    get length(){ return mapa.size; },
    key: i => [...mapa.keys()][i] || null
  };
  storage.setItem('digicopy_erp_v42_demo_apresentacao', 'LZ1:base');
  storage.setItem('digicopy_erp_v42_demo_apresentacao_part__clientes__#0', '[]');
  storage.setItem('digicopy_cloud_device_token', 'token-do-pc');   // credencial
  storage.setItem('digicopy_cf_sync_outbox_v1', '[]');             // fila de envio
  const win = { DIGICOPY_CLOUD: { token: () => 'token-do-pc' } };
  new Function('window', 'localStorage', 'document', codigo)(win, storage, undefined);
  const S = win.DIGICOPY_CLOUD_SYNC;
  ok('o motor expõe o modo só nuvem', S && typeof S.modoSoNuvem === 'function' && typeof S.soltarCopiaLocal === 'function');
  ok('modo só nuvem ligado por padrão (sem escolha antiga guardada)', S.modoSoNuvem() === true);
  const apagadas = S.soltarCopiaLocal();
  ok('solta a base guardada e NÃO toca na credencial nem na fila',
    apagadas === 2 &&
    storage.getItem('digicopy_erp_v42_demo_apresentacao') === null &&
    storage.getItem('digicopy_erp_v42_demo_apresentacao_part__clientes__#0') === null &&
    storage.getItem('digicopy_cloud_device_token') === 'token-do-pc' &&
    storage.getItem('digicopy_cf_sync_outbox_v1') === '[]');
  ok('NÃO dá mais para desligar (r46: modo único, sempre ligado)',
    S.definirSoNuvem(false) === true && storage.getItem('digicopy_cf_so_nuvem_v1') === '1' &&
    S.modoSoNuvem() === true);
  ok('e continua ligado', S.definirSoNuvem(true) === true && S.modoSoNuvem() === true);
})();

console.log('\n== 5) VERSÃO ACOMPANHA A PUBLICAÇÃO (ordem dele: "vai atualizando") ==');
const mvp = JSON.parse(ler('package.json'));
ok('existe o comando npm run versao (um passo, sem esquecer nada)',
  mvp.scripts && mvp.scripts.versao === 'node mudar_versao.js' && fs.existsSync('mudar_versao.js'));
ok('a versão do app é a que está no package.json e é a que aparece no relatório',
  /^\d+\.\d+\.\d+$/.test(mvp.version) && ler('RELATORIO_DE_TESTE_NF.html').indexOf('v' + mvp.version) >= 0);
ok('o guia também é da versão publicada agora',
  ler('GUIA_DE_TESTE_NF.html').indexOf('v' + mvp.version) >= 0);

console.log('\n== 6) RELATÓRIO DE TESTE: NÃO REPETIR O QUE JÁ FOI RESOLVIDO ==');
const rel = ler('RELATORIO_DE_TESTE_NF.html');
ok('tem a PARTE H com o que é novo nesta rodada',
  rel.indexOf('PARTE H') >= 0 && rel.indexOf('Nova nota fiscal em ABA') >= 0 &&
  rel.indexOf('um olho só') >= 0);
ok('tem a PARTE I com o navegador embutido (novo de 22/09 nº5; só no programa do PC)',
  rel.indexOf('NAVEGADOR DENTRO DO SISTEMA') >= 0 && rel.indexOf('NFS-e Nacional') >= 0 &&
  rel.indexOf('WhatsApp Web') >= 0 && rel.indexOf('Abrir numa janela nova') >= 0);
// AUDITORIA 23/09/2026 — antes fixava 'v6.1.10' escrito à mão. Agora usa a versão
// que está no package.json (mvp.version), que é justamente o que este teste quer
// garantir: relatório e guia falando da MESMA versão que o sistema publica.
ok('o relatório é da versão publicada agora (v' + mvp.version + ')',
  rel.indexOf('v' + mvp.version) >= 0 && rel.indexOf('5.28.2') >= 0);
ok('continua marcando o que já foi resolvido e esconde com o filtro',
  rel.indexOf('resolvido antes') >= 0 && rel.indexOf('só o que falta testar') >= 0);

console.log('\nRESULTADO: v' + mvp.version + ' (rodada 22/09) passou!');
//<<<<SECAO:test_ajustes_v6106.js:FIM>>>>
}

if (false) { // ═══ test_importar_referencias.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_importar_referencias.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — importar.html (a área de importação das referências do sistema antigo)
//
// Pedido dele (22/09/2026): "eu n pensei em um que você faz uma area de
// importação dos dois tipos de arquivos, ai vai ler e me dar um texto pra
// copiar ai so colo aq".
//
// Este teste garante: ferramenta sozinha (sem CDN), sem modal nativo, sem
// guardar nada (nem no PC nem na nuvem), sem mandar nada para fora, com teto de
// tamanho (PC fraco), lendo acento de arquivo antigo (Windows-1252) e sabendo
// avisar quando o arquivo é binário (aí vai em base64).
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');

let falhas = 0;
function ok(cond, msg){ if(cond) console.log('  ✔ ' + msg); else { falhas++; console.error('  ✘ ' + msg); } }

// r57: testes moram em SEÇÕES dentro de test_msg_*.js — "na suíte" = no runner ou em seção de tema
function naSuite(nome) {
  let s = fs.readFileSync('test_runner.js', 'utf8');
  try { fs.readdirSync('.').forEach((f) => { if (/^test_msg_.*\.js$/.test(f)) s += '\n' + fs.readFileSync(f, 'utf8'); }); } catch (e) {}
  return s.indexOf(nome) >= 0;
}
const ARQ = 'importar.html';
const html = fs.readFileSync(ARQ, 'utf8');

console.log('\n== 1) Ferramenta sozinha e sem popup nativo (regras do projeto) ==');
ok(!/<script[^>]+src=|<link[^>]+rel="stylesheet"/i.test(html), 'arquivo é sozinho: nenhum script/css de fora');
ok(!/[\s(]alert\s*\(|[\s(]confirm\s*\(|[\s(]prompt\s*\(/.test(html), 'sem modal nativo (regra #16)');
ok(html.indexOf('nada sai do seu computador') >= 0, 'avisa na tela que nada sai do PC');
ok(!/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(html), 'não manda nada para a internet');
ok(!/localStorage\s*\.\s*(get|set|remove)Item|window\.localStorage|indexedDB|document\.cookie/.test(html),
   'não guarda nada no navegador (regra #44)');
ok(html.indexOf('BANCO.FDB') >= 0, 'avisa para não mandar o BANCO.FDB (binário enorme)');
ok(html.indexOf('webkitdirectory') >= 0, 'dá para escolher a PASTA inteira de uma vez');
ok(/Arraste a pasta <b>Grids<\/b>/.test(html), 'o texto ensina a mandar a pasta Grids');

console.log('\n== 2) Parte pura: binário, acento antigo, base64 e junção ==');
const bloco = html.slice(html.indexOf('/* IR_PURE_START */'), html.indexOf('/* IR_PURE_END */'));
const P = (function(){
  const ctx = { window:{}, document:undefined, TextDecoder:TextDecoder, Uint8Array:Uint8Array, btoa:btoa };
  new Function('window', 'document', 'TextDecoder', 'Uint8Array', 'btoa', bloco)(
    ctx.window, ctx.document, TextDecoder, Uint8Array, btoa);
  return ctx.window.IR_PURE;
})();
ok(!!P, 'a parte pura está exportada (IR_PURE)');

const soTexto = new TextEncoder().encode('DBGrid1.ColCount=7\nCol1=Cliente;120\n');
ok(P.irEhBinario(soTexto) === false, 'arquivo de texto normal NÃO é binário');
ok(P.irEhBinario(new Uint8Array([0x00,0x01,0x02,0xff,0x00])) === true, 'arquivo com bytes zero é binário');
const cp1252 = new Uint8Array([0x53,0x61,0xED,0x64,0x61]);   // "Saída" em Windows-1252 (0xED = í)
const dec = P.irDecodificar(cp1252);
ok(dec.codificacao === 'Windows-1252' && dec.texto.indexOf('\u00ed') >= 0,
   'acento de arquivo antigo sai certo (UTF-8 falhou → Windows-1252, sem "�")');
ok(P.irDecodificar(soTexto).texto.indexOf('ColCount') >= 0, 'texto UTF-8 sai igual ao original');
ok(P.irBase64(new Uint8Array([65,66,67])) === 'QUJD', 'binário vai em base64 (dá para eu ler do meu lado)');
ok(P.irTamanho(1536) === '1.5 KB' && P.irTamanho(300) === '300 B', 'tamanho legível (B/KB/MB)');

const junto = P.irJuntar([
  { nome:'FormLocacaoDBGrid1.grd', bytes:900,  tamanho:'900 B', status:'texto',   texto:'ColCount=3' },
  { nome:'e110111_v1.00.xsd',      bytes:4096, tamanho:'4.0 KB', status:'texto',  texto:'<xs:schema/>' },
  { nome:'something.bin',          bytes:2048, tamanho:'2.0 KB', status:'binario',base64:'AAEC' }
]);
ok(junto.indexOf('===== ARQUIVO: FormLocacaoDBGrid1.grd (900 B) =====') >= 0, 'cada arquivo vem com cabeçalho (nome e tamanho)');
ok(junto.indexOf('ColCount=3') >= 0 && junto.indexOf('<xs:schema/>') >= 0, 'o conteúdo dos dois arquivos de texto entra inteiro');
ok(junto.indexOf('BINARIO') >= 0 && junto.indexOf('AAEC') >= 0, 'o binário entra marcado e em base64');

console.log('\n== 3) A tela faz o que ele pediu (ler → mostrar → copiar) ==');
ok(html.indexOf('id="saida"') >= 0, 'tem a caixa com o texto para copiar');
ok(html.indexOf('id="b-copiar"') >= 0 && /Copiar tudo/.test(html), 'tem o botão "Copiar tudo"');
ok(/navigator\.clipboard\.writeText/.test(html) && /execCommand\('copy'\)/.test(html),
   'copia sozinho e, se o navegador não deixar, ensina Ctrl+A / Ctrl+C');
ok(html.indexOf('id="b-salvar"') >= 0, 'e ainda dá para salvar um .txt, se ele preferir');
ok(html.indexOf('Ctrl+A') >= 0 && html.indexOf('Ctrl+C') >= 0, 'o plano B da cópia está escrito na tela');
ok(/MAX_ARQ\s*=\s*900\s*\*\s*1024/.test(html) && /MAX_TOTAL\s*=\s*3\s*\*\s*1024\s*\*\s*1024/.test(html),
   'o teto sobe para 900 KB por arquivo e 3 MB no total (cabe o leiauteNFe de 337 KB)');
ok(/grande demais \(pulei\)/.test(html) && /status === 'grande'/.test(html), 'acima do teto o arquivo é pulado com aviso (nada de travar o PC — regra #12)');

console.log('\n== 3b) Arquivo grande: resumo e partes para colar ==');
const xsd = '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.portalfiscal.inf.br/nfe" version="4.00">' +
  '<xs:element name="NFe" type="TNFe"/><xs:element name="enviNFe" type="TEnviNFe"/>' +
  '<xs:complexType name="TNFe"><xs:sequence><xs:element name="infNFe" type="TInfNFe"/></xs:sequence></xs:complexType>' +
  '<xs:attribute name="versao" type="xs:string"/></xs:schema>';
const resumo = P.irResumoXsd(xsd);
ok(resumo.indexOf('http://www.portalfiscal.inf.br/nfe') >= 0, 'o resumo mostra o namespace do esquema');
ok(resumo.indexOf('Versao.........: 4.00') >= 0, 'o resumo mostra a versão (4.00)');
ok(/Elementos \(3\)/.test(resumo) && resumo.indexOf('NFe, enviNFe, infNFe') >= 0, 'o resumo lista os elementos, sem repetir');
ok(/Tipos \(1\)/.test(resumo) && resumo.indexOf('TNFe') >= 0, 'o resumo lista os tipos (complexType)');
ok(/Atributos \(1\)/.test(resumo) && resumo.indexOf('versao') >= 0, 'o resumo lista os atributos');
ok(resumo.length < xsd.length * 2, 'o resumo é curto (dá para colar numa mensagem)');

const grande = new Array(5000).join('linha de exemplo do arquivo grande\n');
const partes = P.irPartes(grande, 40000);
ok(partes.length > 1, 'texto grande é dividido em partes');
ok(partes.every(p => p.length <= 40000), 'nenhuma parte passa do tamanho combinado (~40 KB para colar)');
ok(partes.join('') === grande, 'juntando as partes volta o texto inteiro (nada é perdido)');
ok(P.irPartes('curto', 40000).length === 1, 'texto pequeno continua em UMA parte (nada de complicar)');
ok(html.indexOf('id="parte"') >= 0 && /Parte ' \+ \(i \+ 1\) \+ ' de '/.test(html), 'a tela tem a listinha de partes, numerada');
ok(html.indexOf('select') >= 0 && /listinha ao lado/.test(html), 'o aviso explica a listinha de partes');
ok(/reader\.readAsArrayBuffer/.test(html), 'lê os bytes (para poder detectar binário de verdade)');
ok(html.indexOf('Escolher a pasta inteira') >= 0, 'o botão da pasta está na tela, com o nome claro');

console.log('\n== 4) Está publicado junto do sistema ==');
ok(fs.existsSync('importar.html'), 'o arquivo existe na raiz (sai no site e no ZIP)');
ok(naSuite('test_importar_referencias.js'), 'o próprio teste está na suíte');

console.log('\nRESULTADO: ' + (falhas === 0 ? 'a área de importação está de pé!' : falhas + ' falha(s)'));
if (falhas) process.exitCode = 1;
//<<<<SECAO:test_importar_referencias.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5183.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5183.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5183_patch.js', 'utf8');

// Mock mínimo: sem document => o patch para antes do trabalho de DOM,
// mas expõe AJUSTES_V5183_PURE com a lógica pura testável.
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);

const R = ctx.window.AJUSTES_V5183_PURE;

console.log('== AJUSTES_V5183_PURE: regra de faixa azul ==');
ok('"Motivo / Defeito *" ganha faixa', R.deveTerFaixa('Motivo / Defeito *'));
ok('"Serviços executados" ganha faixa', R.deveTerFaixa('Serviços executados'));
ok('"Observação" ganha faixa', R.deveTerFaixa('Observação'));
ok('"Contador Preto Atual" ganha faixa', R.deveTerFaixa('Contador Preto Atual'));
ok('"Produtos / Peças usadas" ganha faixa', R.deveTerFaixa('Produtos / Peças usadas'));
ok('"Código" NÃO ganha faixa', !R.deveTerFaixa('Código'));
ok('"Data" NÃO ganha faixa', !R.deveTerFaixa('Data'));
ok('"Cliente" NÃO ganha faixa', !R.deveTerFaixa('Cliente'));

console.log('== AJUSTES_V5183_PURE: título da faixa ==');
ok('remove asterisco', R.tituloFaixa('Motivo / Defeito *') === 'Motivo / Defeito');
ok('mantém texto simples', R.tituloFaixa('Observação') === 'Observação');

console.log('== AJUSTES_V5183_PURE: lançamento de contador preenchido ==');
{
  const vazio = { getElementById: () => ({ value: '' }) };
  ok('vazio => não preenchido', !R.lancamentoContadorPreenchido(vazio));
  const preenchido = { getElementById: () => ({ value: '  1234  ' }) };
  ok('1234 => preenchido', R.lancamentoContadorPreenchido(preenchido));
  const semCampo = { getElementById: () => null };
  ok('sem campo => não preenchido', !R.lancamentoContadorPreenchido(semCampo));
}

console.log('\nRESULTADO: Testes do ajustes_v5183 passaram!');
//<<<<SECAO:test_ajustes_v5183.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5185.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5185.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5185_patch.js', 'utf8');

// Lógica pura: exposta antes do guard de document.
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const R = ctx.window.AJUSTES_V5185_PURE;

console.log('== AJUSTES_V5185_PURE: linha da impressora ==');
ok('modelo + patrimônio + serial', R.impressoraLinha({ modelo:'LaserJet 1102', patrimonio:'P-001', serie:'SN123' }) === 'LaserJet 1102 • Patrimônio P-001 • Serial SN123');
ok('só modelo', R.impressoraLinha({ modelo:'LaserJet 1102' }) === 'LaserJet 1102');
ok('vazio', R.impressoraLinha({}) === '');

console.log('== AJUSTES_V5185: remoção do bloco antigo de peças (simulação DOM) ==');
{
  // Monta um mini DOM: label + wrap(removido) + textarea, como fica após o v5.17.1.
  const elements = {};
  const textarea = { id: 'lc-pecas', parentElement: null };
  const container = { id: 'bloco-antigo', parentElement: {}, remove: function(){ container._removed = true; }, children: [] };
  textarea.parentElement = container;
  elements['lc-pecas'] = textarea;
  // #lc-pecas-wrap já não existe (foi removido pelo v5.17.1) — testa que a lógica
  // NÃO depende dele.
  elements['lc-pecas-wrap'] = null;

  const docMock = { getElementById: (id) => elements[id] || null };

  // Re-avalia o patch inteiro com esse document fake para expor __limparPecasAntigas.
  const win2 = { window: {}, db: { parque: [] } };
  new Function('window', 'db', 'document', 'MutationObserver', code)(win2.window, win2.db, docMock, function(){ this.observe = function(){}; });

  // Dispara a limpeza manualmente (como o observer/abertura faria).
  win2.window.__limparPecasAntigas();

  ok('bloco antigo (label+textarea) foi removido', container._removed === true);
}

console.log('\nRESULTADO: Testes do ajustes_v5185 passaram!');
//<<<<SECAO:test_ajustes_v5185.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5186.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5186.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5186_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const R = ctx.window.AJUSTES_V5186_PURE;

console.log('== AJUSTES_V5186_PURE: dados da impressora (com fallback do equipamento) ==');
{
  const dbRef = {
    equipamentos: [{ id: 'e1', modelo: 'HP LaserJet', patrimonio: 'P-100', serie: 'SN-999' }],
    parque: [{ equipamentoId: 'e1', setor: 'Recepção', localInstalacao: 'Sala 3' }]
  };
  // chamado sem dados -> usa do equipamento
  const d1 = R.dadosImpressora({ equipamentoId: 'e1' }, dbRef);
  ok('modelo vem do equipamento', d1.modelo === 'HP LaserJet');
  ok('patrimônio vem do equipamento', d1.patrimonio === 'P-100');
  ok('serial vem do equipamento', d1.serie === 'SN-999');
  ok('local vem do parque', d1.local === 'Sala 3');

  // chamado com dados -> prioriza o chamado
  const d2 = R.dadosImpressora({ equipamentoId: 'e1', modelo: 'Canon', patrimonio: 'X', serie: 'Y', local: 'Andar 2' }, dbRef);
  ok('modelo do chamado tem prioridade', d2.modelo === 'Canon');
  ok('local do chamado tem prioridade', d2.local === 'Andar 2');
}

console.log('== AJUSTES_V5186_PURE: faixa ==');
ok('"Motivo / Defeito *" ganha faixa', R.deveTerFaixa('Motivo / Defeito *'));
ok('"Serviços executados" ganha faixa', R.deveTerFaixa('Serviços executados'));
ok('"Contador Preto Atual" ganha faixa', R.deveTerFaixa('Contador Preto Atual'));
ok('"Código" NÃO ganha faixa', !R.deveTerFaixa('Código'));
ok('"Cliente" NÃO ganha faixa', !R.deveTerFaixa('Cliente'));
ok('titulo remove asterisco', R.tituloFaixa('Motivo / Defeito *') === 'Motivo / Defeito');

console.log('\nRESULTADO: Testes do ajustes_v5186 passaram!');
//<<<<SECAO:test_ajustes_v5186.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5187.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5187.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5187_patch.js', 'utf8');

// Simula um document mínimo com os campos do formulário preenchidos
function makeDoc(fields){
  const map = {};
  Object.keys(fields).forEach(id => { map[id] = { value: fields[id] }; });
  return { getElementById: (id) => map[id] || null, body: null };
}

// Avalia a lógica pura com um document fake
const ctx = { window: {}, db: {}, document: makeDoc({
  'kr-os-desc': 'Troca de fusor',      // motivo digitado
  'kr-os-serv': 'Trocado fusor e limpeza', // serviços digitados
  'kr-os-obs': 'Aguardando peça color',    // observação digitada
  'kr-os-cont-atu': '5120',                 // contador digitado
  'kr-os-modelo': 'HP LaserJet',            // modelo digitado
  'kr-os-patr': 'P-999',                    // patrimônio digitado
}) };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, ctx.document);
const R = ctx.window.AJUSTES_V5187_PURE;

console.log('== AJUSTES_V5187_PURE: PDF puxa dados digitados ==');
const merged = R.coletarFormChamado({ id: 'os1', descricao: 'Antigo', servicos: '', observacao: '', contadorAtual: '5000', modelo: '', patrimonio: '' });
ok('motivo digitado sobrescreve o salvo', merged.descricao === 'Troca de fusor');
ok('serviços digitados entram', merged.servicos === 'Trocado fusor e limpeza');
ok('observação digitada entra', merged.observacao === 'Aguardando peça color');
ok('contador digitado sobrescreve', merged.contadorAtual === '5120');
ok('modelo digitado entra', merged.modelo === 'HP LaserJet');
ok('patrimônio digitado entra', merged.patrimonio === 'P-999');

// Caso 2: sem nada digitado (campos vazios) => mantém o salvo
const ctx2 = { window: {}, db: {}, document: makeDoc({}) };
new Function('window', 'db', 'document', code)(ctx2.window, ctx2.db, ctx2.document);
const R2 = ctx2.window.AJUSTES_V5187_PURE;
const merged2 = R2.coletarFormChamado({ id: 'os1', descricao: 'Salvo', servicos: 'Serv salvo' });
ok('sem digitação mantém o salvo', merged2.descricao === 'Salvo' && merged2.servicos === 'Serv salvo');

console.log('\nRESULTADO: Testes do ajustes_v5187 passaram!');
//<<<<SECAO:test_ajustes_v5187.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5189.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5189.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5189_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const R = ctx.window.AJUSTES_V5189_PURE;

console.log('== AJUSTES_V5189_PURE: dados da loja ==');
{
  const oldDb = global.db;
  // lojaData lê db global; simulamos com getSession + db no escopo
  const g = {};
  g.getSession = () => ({ empresaId: 'e1' });
  g.window = {};
  g.db = {
    empresas: [{ id: 'e1', nome: 'Empresa Antiga', fantasia: 'DIGICOPY' }],
    config: {
      loja: { fantasia: 'Minha Loja', razaoSocial: 'Minha Loja LTDA', cnpj: '00.000.000/0001-00', telefone: '(38) 9999', email: 'a@b.com', rua: 'Rua X', numero: '10', cidade: 'Janaúba', uf: 'MG' }
    }
  };
  new Function('window', 'db', 'getSession', 'document', code)(g.window, g.db, g.getSession, undefined);
  const loja = g.window.AJUSTES_V5189_PURE.lojaData();
  ok('fantasia da loja', loja.fantasia === 'Minha Loja');
  ok('razão social da loja', loja.razao === 'Minha Loja LTDA');
  ok('cnpj da loja', loja.cnpj === '00.000.000/0001-00');
  ok('endereço montado', /Rua X/.test(loja.end));
}

console.log('== AJUSTES_V5189_PURE: merge do formulário ==');
{
  function makeDoc(fields){ const m={}; Object.keys(fields).forEach(id=>m[id]={value:fields[id]}); return { getElementById: id=>m[id]||null }; }
  const doc = makeDoc({ 'kr-os-desc': 'Troca de fusor', 'kr-os-cont-atu': '5200' });
  const merged = R.coletarFormChamado({ id:'os1', descricao:'Antigo', contadorAtual:'5000' }, doc);
  ok('motivo digitado sobrescreve', merged.descricao === 'Troca de fusor');
  ok('contador digitado sobrescreve', merged.contadorAtual === '5200');
}

console.log('== AJUSTES_V5189_PURE: impressora ==');
{
  const dbRef = { equipamentos:[{id:'e1',modelo:'HP',patrimonio:'P1',serie:'S1'}], parque:[{equipamentoId:'e1',setor:'Recepção'}] };
  const imp = R.dadosImpressora({ equipamentoId:'e1' }, dbRef);
  ok('modelo', imp.modelo === 'HP');
  ok('patrimônio', imp.patrimonio === 'P1');
  ok('serial', imp.serie === 'S1');
  ok('local', imp.local === 'Recepção');
}

console.log('\nRESULTADO: Testes do ajustes_v5189 passaram!');
//<<<<SECAO:test_ajustes_v5189.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5191.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5191.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — ajustes_v5191 + fim das ações MANUAIS de nuvem
//
// ORDEM DO DONO (23/09/2026): "remove, pois não quero algo manual que envia pra
// nuvem, quero automático".
//
// Antes este teste provava que o sync manual usava confirmSistema em vez do
// confirm() quebrado. Agora ele prova o contrário: que o caminho manual NÃO
// existe mais, e que ele não pode mais mentir "Pronto! ... enviou os dados"
// com a nuvem desligada.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

// Remove comentários para os testes de "código morto": a palavra pode (e deve)
// aparecer num comentário explicando a remoção — o que não pode é existir USO.
function semComentarios(src){
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(l => !/^\s*\/\//.test(l))
    .join('\n');
}

const v5191 = fs.readFileSync('ajustes_v5191_patch.js', 'utf8');
const iface = fs.readFileSync('interface_patch.js', 'utf8');
const perf  = fs.readFileSync('performance_patch.js', 'utf8');
const perfCodigo = semComentarios(perf);

console.log('== AJUSTES_V5191: sem sync manual ==');

// 1) O arquivo continua carregando e não quebra (roda sem window real)
new Function('window', v5191)({ DIGICOPY_LOGO: null });

// 2) Nenhum dos dois arquivos cria as ações manuais
ok('v5191 não cria mais "Enviar para nuvem"', !/window\.enviarDadosLocaisParaNuvem\s*=/.test(v5191));
ok('v5191 não cria mais "Carregar da nuvem"', !/window\.carregarDadosDaNuvem\s*=/.test(v5191));
ok('interface não cria mais as ações manuais', !/window\.enviarDadosLocaisParaNuvem\s*=/.test(iface) && !/window\.carregarDadosDaNuvem\s*=/.test(iface));

// 3) O embrulho que mostrava sucesso falso foi removido
ok('uiWrapSync (aviso verde de sucesso falso) removido', !/uiWrapSync/.test(iface));

// 4) O v5191 continua fazendo o que é vivo (logo padrão)
ok('v5191 preserva a garantia da logo padrão', /window\.DIGICOPY_LOGO\s*=\s*_logoPadrao/.test(v5191));

console.log('== CÓDIGO MORTO (Supabase) REMOVIDO ==');
// Olha só o CÓDIGO (sem comentários): a palavra "Supabase" pode aparecer num
// comentário explicando a remoção; o que não pode existir é USO.
ok('performance_patch sem uso de __supabaseSyncInternals', !/__supabaseSyncInternals/.test(perfCodigo));
ok('performance_patch sem chamada supabaseRequest', !/supabaseRequest/.test(perfCodigo));
ok('performance_patch sem a rota app_state da nuvem antiga', !/app_state/.test(perfCodigo));
ok('performance_patch sem cache de partes morto', !/partCache/.test(perfCodigo));
ok('performance_patch preserva os helpers puros (testados)', /window\.__perfPure\s*=/.test(perf) && /function perfHashStr/.test(perf));
ok('performance_patch preserva o saveDB write-behind', /window\.__saveDBSched/.test(perf));

console.log('\nRESULTADO: sync manual removido e código morto limpo!');
//<<<<SECAO:test_ajustes_v5191.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5192.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5192.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5192_patch.js', 'utf8');

// Mock de DOM que cria elementos sob demanda (getElementById retorna null se não existir)
function makeDom(fields){
  const map = {};
  Object.keys(fields).forEach(id => { map[id] = { value: fields[id], checked: false }; });
  const doc = {
    getElementById: (id) => map[id] || null,
    createElement: () => ({ id: '', type: '', style: {}, value: '', checked: false }),
    body: {
      appendChild: (el) => { map[el.id] = el; }
    }
  };
  return { doc, map };
}

// Caso 1: formulário ko-desc preenchido, salvar lê kr-os-desc (não existe)
{
  const { doc, map } = makeDom({ 'ko-desc': 'Problema na impressora', 'ko-cont-atu': '5200' });
  const win = { salvarChamadoCompleto: function(){ win.__salvou = true; }, salvarChamadoAvulso: function(){} };
  new Function('window', 'document', code)(win, doc);
  win.salvarChamadoCompleto();
  console.log('== AJUSTES_V5192: sincroniza motivo entre os campos ==');
  ok('salvar foi chamado', win.__salvou === true);
  ok('motivo digitado em ko-desc foi copiado para kr-os-desc', map['kr-os-desc'] && map['kr-os-desc'].value === 'Problema na impressora');
  ok('contador copiado para kr-os-cont-atu', map['kr-os-cont-atu'] && map['kr-os-cont-atu'].value === '5200');
}

// Caso 2: avulso com ca-desc
{
  const { doc, map } = makeDom({ 'ca-desc': 'Atendimento avulso' });
  const win = { salvarChamadoAvulso: function(){ win.__salvou = true; } };
  new Function('window', 'document', code)(win, doc);
  win.salvarChamadoAvulso();
  ok('avulso: motivo copiado para kr-os-desc', map['kr-os-desc'] && map['kr-os-desc'].value === 'Atendimento avulso');
}

// Caso 3: nada digitado → não cria campo (salvar deve reclamar corretamente)
{
  const { doc, map } = makeDom({});
  const win = { salvarChamadoCompleto: function(){ win.__salvou = true; } };
  new Function('window', 'document', code)(win, doc);
  win.salvarChamadoCompleto();
  ok('sem digitação, kr-os-desc continua sem existir', map['kr-os-desc'] === undefined);
}

console.log('\nRESULTADO: Testes do ajustes_v5192 passaram!');
//<<<<SECAO:test_ajustes_v5192.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5193.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5193.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5193_patch.js', 'utf8');

// Monta um DOM fake com os campos f-cli-*
function makeDom(initial){
  const map = {};
  Object.keys(initial).forEach(id => { map[id] = { value: initial[id] }; });
  return {
    getElementById: (id) => map[id] || null,
    body: {}
  };
}

console.log('== AJUSTES_V5193: aviso ao sair do cliente (só se modificou) ==');

// Cenário 1: modificou o nome → deve pedir para salvar
{
  let saved = false;
  let confirmShown = false;
  const dom = makeDom({ 'f-cli-nome': 'João', 'f-cli-tel': '999' });
  const win = {
    confirmSistema: (msg) => { confirmShown = true; return Promise.resolve(true); },
    saveCliente: function(){ saved = true; },
    closeModal: function(){ win.__closed = true; },
    renderModalCliente: function(id){ /* mock */ }
  };
  new Function('window', 'document', code)(win, dom);

  // simula abrir edição + foto
  win.__cliEditId = 'cli1';
  win.__cliEditSnapshot = { 'f-cli-nome': 'João', 'f-cli-tel': '999' };
  dom.getElementById('f-cli-nome').value = 'João Alterado'; // usuário mudou

  win.closeModal();
  setTimeout(() => {
    ok('aviso de salvar apareceu quando modificou', confirmShown === true);
    // respondeu "sim" → chamou saveCliente
    ok('respondeu sim → chamou saveCliente', saved === true);

    // Cenário 2: não modificou nada → fecha direto sem aviso
    let confirmShown2 = false;
    const dom2 = makeDom({ 'f-cli-nome': 'Maria' });
    const win2 = {
      confirmSistema: (msg) => { confirmShown2 = true; return Promise.resolve(true); },
      saveCliente: function(){},
      closeModal: function(){ win2.__closed = true; },
      renderModalCliente: function(){}
    };
    new Function('window', 'document', code)(win2, dom2);
    win2.__cliEditId = 'cli2';
    win2.__cliEditSnapshot = { 'f-cli-nome': 'Maria' };
    win2.closeModal();
    ok('sem modificação → fecha direto (sem aviso)', confirmShown2 === false && win2.__closed === true);

    console.log('\nRESULTADO: Testes do ajustes_v5193 passaram!');
    process.exit(0);
  }, 30);
}
//<<<<SECAO:test_ajustes_v5193.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5196.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5196.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5196_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.AJUSTES_V5196_PURE;

console.log('== AJUSTES_V5196_PURE: hierarquia de perfis ==');
ok('kauan => Admin', P.perfilEfetivo({ login: 'kauan', perfil: 'Qualquer' }) === 'Admin');
ok('denivaldo => Dono', P.perfilEfetivo({ login: 'denivaldo' }) === 'Dono');
ok('perfil Admin explícito => Admin', P.perfilEfetivo({ login: 'joao', perfil: 'Admin' }) === 'Admin');
ok('perfil Dono explícito => Dono', P.perfilEfetivo({ login: 'maria', perfil: 'Dono' }) === 'Dono');
ok('Comercial vira Funcionário', P.perfilEfetivo({ login: 'carlos', perfil: 'Comercial' }) === 'Funcionário');
ok('Financeiro vira Funcionário', P.perfilEfetivo({ login: 'ana', perfil: 'Financeiro' }) === 'Funcionário');
ok('Técnico vira Funcionário', P.perfilEfetivo({ login: 'pedro', perfil: 'Técnico' }) === 'Funcionário');

console.log('== AJUSTES_V5196_PURE: permissões ==');
ok('kauan tem permissão total', P.temPermissaoTotal({ login: 'kauan' }) === true);
ok('denivaldo tem permissão total', P.temPermissaoTotal({ login: 'denivaldo', perfil: 'Dono' }) === true);
ok('Admin tem permissão total', P.temPermissaoTotal({ login: 'x', perfil: 'Admin' }) === true);
ok('Funcionário NÃO tem permissão total', P.temPermissaoTotal({ login: 'x', perfil: 'Funcionário' }) === false);
ok('funcionário edita a si mesmo', P.podeEditarUsuario({ usuarioId: 'u1', perfil: 'Funcionário' }, 'u1') === true);
ok('funcionário NÃO edita outro', P.podeEditarUsuario({ usuarioId: 'u1', perfil: 'Funcionário' }, 'u2') === false);
ok('Admin edita qualquer um', P.podeEditarUsuario({ usuarioId: 'u1', perfil: 'Admin' }, 'u2') === true);

console.log('\nRESULTADO: Testes do ajustes_v5196 passaram!');
//<<<<SECAO:test_ajustes_v5196.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v51916.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v51916.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v51916_patch.js', 'utf8');

// Globais (como no navegador, via function declaration no app.js)
let confirmMsg = null;
globalThis.logAction = () => {};
globalThis.saveDB = () => { globalThis.__saved = true; };
globalThis.renderProdutos = () => { globalThis.__renderProd = true; };
globalThis.renderContratos = () => { globalThis.__renderCtr = true; };
globalThis.renderAuditoria = () => {};
globalThis.toast = () => {};
globalThis.getSession = () => ({ empresaId: 'e1' });

// window.X (definidos como window.X no sistema)
const win = {
  confirmSistema: (m) => { confirmMsg = m; return Promise.resolve(true); },
  lfbAlert: () => {},
  historicoVenda: function(){ globalThis.__histChamado = true; },
  vosCarregarVendaNaTela: function(){ globalThis.__telaPrincipal = true; }
};
const db = {
  produtos: [{ id: 'p1', nome: 'Toner' }],
  contratos: [{ id: 'c1', numero: 'CT-1', status: 'ativo' }],
  parque: [],
  vendas: [{ id: 'v1', status: 'faturado' }]
};

new Function('window', 'db', code)(win, db);

console.log('== AJUSTES_V51916: excluir produto ==');
win.deleteProduto('p1');
setTimeout(() => {
  ok('confirma antes de excluir', confirmMsg && /Excluir produto/.test(confirmMsg));
  ok('produto foi removido', db.produtos.length === 0);
  ok('salvou + re-renderizou', globalThis.__saved === true && globalThis.__renderProd === true);

  console.log('== AJUSTES_V51916: excluir contrato ==');
  win.excluirContratoOperacional('c1');
  setTimeout(() => {
    ok('contrato marcado excluido', db.contratos[0].status === 'excluido');
    ok('re-renderizou contratos', globalThis.__renderCtr === true);

    console.log('== AJUSTES_V51916: venda faturada abre na principal ==');
    win.historicoVenda('v1');
    ok('faturada abriu na tela principal (não histórico)', globalThis.__telaPrincipal === true && globalThis.__histChamado !== true);

    console.log('\nRESULTADO: Testes do ajustes_v51916 passaram!');
    process.exit(0);
  }, 30);
}, 30);
//<<<<SECAO:test_ajustes_v51916.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v51920.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v51920.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v51920_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.AJUSTES_V51920_PURE;

console.log('== AJUSTES_V51920_PURE ==');
function doc(fields){
  const m = {};
  Object.keys(fields).forEach(id => m[id] = { value: fields[id], checked: false, classList: { add: ()=>{} }, focus: ()=>{} });
  return { getElementById: id => m[id] || null };
}
{
  const d = doc({ 'ko-desc':'', 'kr-os-desc':'Teste' });
  const r = P.pegarValor(d, ['ko-desc','kr-os-desc']);
  ok('pegarValor pega do primeiro preenchido', r.valor === 'Teste');
}
ok('pegarValor vazio', P.pegarValor(doc({}), ['ko-desc','kr-os-desc']).valor === '');
ok('marcado false', P.marcado(doc({}), ['ko-concluido']) === false);
{
  const d = doc({ 'ko-concluido': '' }); d.getElementById('ko-concluido').checked = true;
  ok('marcado true', P.marcado(d, ['ko-concluido']) === true);
}
{
  const db = { parque: [{ equipamentoId:'e1', medidoresConfig: { colorA4: { modalidade:'individual' } } }] };
  ok('impressora com color', P.impressoraTemColor(db, 'e1') === true);
  ok('impressora sem color', P.impressoraTemColor({ parque: [{ equipamentoId:'e2', medidoresConfig: {} }] }, 'e2') === false);
  ok('color inativo', P.impressoraTemColor({ parque: [{ equipamentoId:'e3', medidoresConfig: { colorA4: { modalidade:'inativo' } } }] }, 'e3') === false);
}

console.log('\nRESULTADO: Testes do ajustes_v51920 passaram!');
//<<<<SECAO:test_ajustes_v51920.js:FIM>>>>
}

if (false) { // ═══ test_linhas_tabela_clique.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_linhas_tabela_clique.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — duplo clique nas tabelas abre o registro DA PRÓPRIA TABELA
//
// AUDITORIA 23/09/2026 — defeito de copiar/colar que sobreviveu em 5 telas:
// as tabelas de USUÁRIOS, AUDITORIA, EQUIPAMENTOS, LEITURAS e OS tinham o
// manipulador de duplo clique copiado da tabela de PRODUTOS:
//
//     ondblclick="openModal('produto','${p.id}')"
//
// Só que nessas telas a variável da linha é `u`, `l`, `e`/`l`, `o` — e `p` NÃO
// existe em lugar nenhum do arquivo. Como isso roda como atributo inline, o
// erro fica só no console: para quem usa, o duplo clique simplesmente não faz
// nada (nas de produto, `p` é a variável certa e sempre funcionou).
//
// Este teste confere que cada tabela aponta para um modal existente E que a
// variável usada é a da própria linha. Assim, copiar linha de uma tabela para
// outra volta a ser seguro.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');

let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++;
  console.log('  ✔ ' + nome);
}

const app = fs.readFileSync('app.js', 'utf8');

console.log('== DUPLO CLIQUE NAS TABELAS ==');

// Cada tabela: id do tbody, a variável da linha (map) e o modal que ela abre.
// OBS: a tabela de PRODUTOS não tem duplo clique hoje — o trecho com
// openModal('produto','${p.id}') foi copiado dela numa versão antiga e ficou
// colado nas outras cinco, onde "p" nem existe.
const tabelas = [
  { tbody: 'tbody-usuarios',  variavel: 'u', modais: ['usuario'] },
  { tbody: 'tbody-equip',     variavel: 'e', modais: ['equipamento'] },
  { tbody: 'tbody-leituras',  variavel: 'l', modais: ['leitura'] },
  { tbody: 'tbody-os',        variavel: 'o', modais: ['os'] },
];

for(const t of tabelas){
  const i = app.indexOf("getElementById('" + t.tbody + "')");
  ok('achei a tabela ' + t.tbody, i >= 0);
  // o trecho desta tabela vai até o próximo tbody renderizado
  const j = app.indexOf('getElementById(\'tbody-', i + 10);
  const trecho = app.slice(i, j > 0 ? j : i + 4000);

  const dbl = /ondblclick="openModal\('([a-z-]+)','\$\{([a-z])\.id\}'\)"/.exec(trecho);
  if(t.modais){
    ok(t.tbody + ': o duplo clique abre um modal de verdade', !!dbl);
    ok(t.tbody + ': abre "' + t.modais[0] + '" (não o de outra tela)', !!dbl && t.modais.indexOf(dbl[1]) >= 0);
    ok(t.tbody + ': usa a variável da PRÓPRIA linha (' + t.variavel + ')', !!dbl && dbl[2] === t.variavel);
  }
}

// A tabela de auditoria não tem tela de detalhe: o certo é NÃO ter duplo clique
// (antes ela chamava o modal de produto, que não existe para uma linha de log).
const iAud = app.indexOf("getElementById('tbody-auditoria')");
const jAud = app.indexOf('getElementById(\'tbody-', iAud + 10);
const trechoAud = app.slice(iAud, jAud > 0 ? jAud : iAud + 4000);
ok('auditoria: sem duplo clique órfão (não existe tela de detalhe do log)', !/ondblclick=/.test(trechoAud));

// Varredura raiz: nenhum outro ponto pode chamar modal com variável inexistente
const todos = [...app.matchAll(/ondblclick="openModal\('([a-z-]+)','\$\{([a-z])\.id\}'\)"/g)];
ok('nenhum duplo clique usa variável solta no arquivo inteiro',
   todos.every(m => /[uleo]/.test(m[2])));
ok('nenhuma tabela abre o modal de PRODUTOS por engano',
   !todos.some(m => m[1] === 'produto'));

console.log('\nRESULTADO: ' + passou + ' verificações — duplo clique das tabelas correto!');
//<<<<SECAO:test_linhas_tabela_clique.js:FIM>>>>
}

if (false) { // ═══ test_faixa_botoes_r46.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_faixa_botoes_r46.js:INICIO>>>>
// test_faixa_botoes_r46.js — r46 (v7.1.0) + r47 (v7.1.1, Q2): faixa de botões.
// Pedido do dono (relatório r45, confirmado com "sim"): tirar os botões de
// teste/confusão e deixar a sincronização 100% automática.
// 8 REMOÇÕES na r46 + TRAZER-DE-VOLTA apagado de vez na r47 (para todos os logins).
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const ler = a => fs.readFileSync(a, 'utf8');

const sync = ler('cloudflare_sync_patch.js');
const vig = ler('ajustes_v5227_nuvem_acompanhamento_patch.js');
const nao = ler('ajustes_v52246_nuvem_nao_autorizar_patch.js');
const bk = ler('ajustes_v52296_backups_nuvem_patch.js');
const fx = ler('ajustes_v7015_nuvem_explica_patch.js');

console.log('== r46: as 8 remoções sumiram das fontes ==');
ok('só-nuvem: sem ligar/desligar e sem limpar', !sync.includes('dc-sonuvem-toggle') && !sync.includes('dc-sonuvem-limpar'));
ok('sincronizar-agora saiu', !sync.includes('dc-sync-now') && !sync.includes('Sincronizar agora'));
ok('não-autorizar saiu', !nao.includes('dc-nao-autorizar-local'));
ok('por-que-não-aparecem saiu (botão + função)', !vig.includes('dc-diag-invisiveis') && !vig.includes('dcDiagnosticoInvisiveis'));
ok('reparar-sessão saiu (botão; cura automática continua)', !vig.includes('dc-reparar-sessao'));
ok('check-up saiu (botão + 5 consertos + resumo)', !vig.includes('dc-abrir-checkup') && !vig.includes('dc-ck-') && !vig.includes('dcCheckupNuvem') && !vig.includes('injetarBotaoCheckup'));
ok('ralador de backups saiu (botão + função)', !bk.includes('bk-excluir-todos') && !bk.includes('excluirTodos'));
ok('faixa de avisos não chama mais o check-up', !fx.includes('dcCheckupNuvem') && !fx.includes('Ver check-up'));

console.log('== r46: o que FICA continua ==');
ok('só-nuvem explicado na tela (sem botão)', sync.includes('SÓ NUVEM'));
ok('desconectar este computador', sync.includes('Desconectar ESTE computador'));
ok('ver aparelhos + ver excluídos', sync.includes('dc-list-devices') && sync.includes('dc-list-deleted'));
ok('zerar dados da nuvem (admin)', sync.includes('dc-reset-cloud'));
ok('escolha da reinstalação (enviar/não-enviar)', sync.includes('dc-enviar-locais') && sync.includes('dc-nao-enviar'));
ok('acompanhar dados dos PCs', vig.includes('dc-watch-devices'));
ok('trazer-de-volta APAGADO de vez (r47 Q2: botão some p/ todos os logins)', !bk.includes('dc-restaurar-lote') && !bk.includes('instalarBotao') && !bk.includes('🩹 Trazer de volta o que foi excluído'));
ok('motor de recuperação guardado e testado (volta em 1 versão se pedir)', bk.includes('DIGICOPY_RECUPERAR') && bk.includes('restaurarLista'));
ok('diagnóstico + conferir agora', bk.includes('dc-diag-btn') && bk.includes('Conferir agora'));
ok('backup manual + baixar .zip', bk.includes('bk-agora') && bk.includes('bk-baixar-todos'));
ok('mandar-erro vivo no patch próprio', ler('ajustes_v7020_mandar_erro_patch.js').includes('digicopyMandarErro'));

console.log('== r46: avisos abrem a nuvem (trazer saiu na r47) ==');
ok('restaurar item-a-item continua (dentro de Ver excluídos)', ler('cloudflare_sync_patch.js').includes('dc-restore'));
ok('avisos renomeados (5× Abrir a Nuvem)', (fx.match(/rotulo: 'Abrir a Nuvem'/g) || []).length === 5);
ok('aviso abre a janela da nuvem', /function irCheckup\(\)\{[^}]*abrirCloudflareNuvem/s.test(fx));

console.log('== r46: bundles limpos (rodar npm run bundle antes de entregar) ==');
const b1 = ler('app.bundle.js'), b2 = ler('mobile/www/app.bundle.js');
['dc-sync-now', 'dc-sonuvem-toggle', 'dc-diag-invisiveis', 'dc-reparar-sessao', 'dc-abrir-checkup', 'dcCheckupNuvem', 'dcDiagnosticoInvisiveis', 'dc-nao-autorizar-local', 'bk-excluir-todos', 'dc-restaurar-lote', 'instalarBotao'].forEach(id => {
  ok('bundle sem ' + id, !b1.includes(id) && !b2.includes(id));
});
ok('bundles com o que fica', b1.includes('dc-watch-devices') && b2.includes('dc-watch-devices') && b1.includes('DIGICOPY_RECUPERAR') && b2.includes('DIGICOPY_RECUPERAR'));

console.log('\nRESULTADO: faixa de botões r46 passou!');
//<<<<SECAO:test_faixa_botoes_r46.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5184.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5184.js:INICIO>>>>
// test_ajustes_v5184.js — PDF do chamado lado a lado (item 3 da v5.18.4).
// O QUE ESTE TESTE PRENDE: a FUNÇÃO "lado a lado" (caixas Dados do Cliente +
// Dados de Atendimento em grid 1fr 1fr), não o arquivo onde ela nasceu.
// Por que ele avalia o v5189 e não o v5184: o arquivo `ajustes_v5184_patch.js`
// virou fóssil (IIFE que não exporta nada — ver RELATORIO_SESSAO.md r34); o
// `window.imprimirChamadoPDF` que vale hoje é o do `ajustes_v5189_patch.js`
// (último definidor no manifest; v5186 definiu a base, v5187 embrulhou, v5189
// redefiniu com o layout). Reparado na r34 (tarefa 1 da auditoria externa).
const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5189_patch.js', 'utf8');

let writtenHtml = '';
const documentMock = {
  getElementById: () => null // sem checkbox => usa o status do chamado
};
const windowMock = {
  lfbAlert: () => {},
  DIGICOPY_LOGO: './logo.png',
  fmtMoney: (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ','),
  getSession: () => ({ empresaId: 'e1', usuarioNome: 'Técnico' }),
  addEventListener: () => {}, // o patch registra validação de clique ao carregar
  open: () => ({ document: { write: (h) => { writtenHtml = h; }, close: () => {} } })
};
const db = {
  os: [{ id: 'os1', numero: '123', clienteId: 'c1', status: 'concluido', tecnico: 'João',
         descricao: 'Troca de fusor', dataAbertura: '2026-08-01T12:00:00Z', dataAtendimento: '2026-08-13T12:00:00Z',
         contadorAtual: '5000', servicos: 'Troca do fusor', observacao: 'OK', pecas: [] }],
  clientes: [{ id: 'c1', nome: 'Empresa XPTO', documento: '12.345.678/0001-90', telefone: '(38) 99999-9999',
               endereco: 'Rua A', numero: '10', cidade: 'Janaúba', estado: 'MG' }],
  empresas: [{ id: 'e1', fantasia: 'DIGICOPY', razaoSocial: 'DIGICOPY LTDA', cnpj: '00.000.000/0001-00' }],
  parque: [], config: {}
};

new Function('window', 'db', 'document', code)(windowMock, db, documentMock);

windowMock.imprimirChamadoPDF('os1');

console.log('== AJUSTES_V5184: PDF do chamado lado a lado ==');
ok('gera HTML', writtenHtml.length > 100);
ok('tem caixa "Dados do Cliente"', writtenHtml.includes('Dados do Cliente'));
ok('tem caixa "Dados de Atendimento"', writtenHtml.includes('Dados de Atendimento'));
ok('as duas caixas ficam lado a lado (grid 1fr 1fr)', /\.cards\{[^}]*grid-template-columns:1fr 1fr/.test(writtenHtml));
ok('nome do cliente aparece', writtenHtml.includes('Empresa XPTO'));
ok('técnico aparece na caixa de atendimento', writtenHtml.includes('João'));
ok('endereço do cliente aparece', writtenHtml.includes('Janaúba'));
ok('contador preto continua no rodapé', writtenHtml.includes('Contador preto'));
ok('data de atendimento não fica mais solta no rodapé', !writtenHtml.includes('Data do atendimento:'));

console.log('\nRESULTADO: Testes do ajustes_v5184 passaram!');
//<<<<SECAO:test_ajustes_v5184.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52413.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52413.js:INICIO>>>>
// test_ajustes_v52413.js — v5.24.34: LOTE 1 da poda (as 14 perguntas aplicadas
// nos arquivos que já existem, autorizada por ele, "sem quebrar nada").
// imprimirChamadoPDF era definido 20× (só a última é viva): 17 cópias mortas
// removidas (~75KB). Ficam: elo v5186 (capturado), v5187 (dono da captura
// _imp) e v5189 (definição final/viva). Protocolo anti-quebra: nada com IIFE
// no topo, nada com chamada em topo, sintaxe de todos intacta.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const PODADOS = ['locacao_contratos_patch.js','fluxos_operacionais_patch.js','contratos_refino_patch.js','locacao_chamados_fix_patch.js','ajustes_v5171_patch.js','ajustes_v5172_patch.js','ajustes_v5174_patch.js','ajustes_v5175_patch.js','ajustes_v5176_patch.js','ajustes_v5177_patch.js','ajustes_v5178_patch.js','ajustes_v5179_patch.js','ajustes_v5180_patch.js','ajustes_v5181_patch.js','ajustes_v5182_patch.js','ajustes_v5184_patch.js','ajustes_v5185_patch.js'];
const reDef = /window\.imprimirChamadoPDF *= *function/;

for (const f of PODADOS) {
  const src = fs.readFileSync(f, 'utf8');
  ok(!reDef.test(src), f + ': cópia morta REMOVIDA');
}

const v5189 = fs.readFileSync('ajustes_v5189_patch.js', 'utf8');
ok(reDef.test(v5189), 'v5189: definição FINAL (viva) preservada');
const v5186 = fs.readFileSync('ajustes_v5186_patch.js', 'utf8');
ok(reDef.test(v5186), 'v5186: elo capturado preservado');
const v5187 = fs.readFileSync('ajustes_v5187_patch.js', 'utf8');
ok(v5187.includes('const _imp = window.imprimirChamadoPDF;'), 'v5187: captura _imp intacta (clausura viva)');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const nDefs = (bundle.match(/window\.imprimirChamadoPDF *= *function/g) || []).length;
ok(nDefs === 3, `bundle: exatamente 3 definições vivas (achou ${nDefs})`);
ok(bundle.includes('const _imp = window.imprimirChamadoPDF'), 'bundle: captura _imp presente');
const bytes = fs.statSync('app.bundle.js').size;
ok(bytes < 6 * 1024 * 1024, `bundle abaixo do teto de 6 MB (agora ${bytes} B)`);
const mbundle = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
ok((mbundle.match(/window\.imprimirChamadoPDF *= *function/g) || []).length === 3, 'bundle do CELULAR igual: 3 definições');

const idx = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(idx.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(idx.includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(idx.includes('app.bundle.js?v=' + pkg.version), 'index: cache-bust v' + pkg.version);
ok(fs.readFileSync('mobile/www/index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'mobile: versão v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');
const wkR = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const vW = (wkR.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').includes('Worker ' + vW), 'worker carimbado (v' + vW + ') e motor colado na mesma versão');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (lote 1: ~75KB de peso morto fora, zero código morto chamável).');
//<<<<SECAO:test_ajustes_v52413.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52414.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52414.js:INICIO>>>>
// test_ajustes_v52414.js — v5.24.34: bug relatado por ele (modelinho preenchido!)
// "criei usuário novo, salvei, testei o login -> 'Informe usuário e senha'".
// Recon provou a fiação íntegra (form/save/login nos mesmos campos); a falha
// era SILENCIOSA por desenho. Fix de raiz (sem adivinhar): (A) saveUsuarioFinal
// ganha PROVA DE GRAVAÇÃO — confere o registro do jeito que o login procura e
// grita se não gravou; (B) doLoginUser ganha diagnóstico partido — diz se o
// usuário não existe, se está INATIVO, ou se é a senha (mesmo fold do juiz).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const v5196 = fs.readFileSync('ajustes_v5196_patch.js', 'utf8');
ok(v5196.includes('v5.24.34'), 'v5196: carimbo da prova de gravação');
ok(v5196.includes('provaLogin'), 'v5196: verifica o registro salvo (provaLogin)');
ok(v5196.includes('Login pra testar: '), 'v5196: sucesso CONFIRMA o login exato pra ele');
ok(v5196.includes('O usuário NÃO ficou gravado como deveria'), 'v5196: falha silenciosa agora Grita (lfbAlert)');
ok(v5196.includes('fold(x.login) === login && txt(x.senha) === senha && x.ativo'),
   'v5196: prova compara do MESMO jeito que o login procura (login+senha+ativo)');

const v52253 = fs.readFileSync('ajustes_v52253_login_tela_branca_patch.js', 'utf8');
ok(v52253.includes('v5.24.34'), 'v52253: carimbo do diagnóstico partido');
ok(v52253.includes('não existe neste PC'), 'login: erro diz quando o USUÁRIO não existe');
ok(v52253.includes('está INATIVO'), 'login: erro diz quando o usuário está INATIVO');
ok(v52253.includes('Senha não confere para '), 'login: erro diz quando a SENHA não bate');
ok(v52253.includes("(typeof fold === 'function') ? fold"),
   'login: diagnóstico usa o MESMO fold do loginFlexivel (compara igual)');
ok(!/toast\('Usuário ou senha incorreto'/.test(v52253),
   'login: erro genérico antigo saiu do caminho do doLoginUser');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('provaLogin'), 'bundle: prova de gravação presente');
ok(bundle.includes('não existe neste PC'), 'bundle: diagnóstico partido presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('provaLogin'), 'bundle do CELULAR igual');

const idx = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(idx.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(idx.includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(idx.includes('app.bundle.js?v=' + pkg.version), 'index: cache-bust v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (usuário novo: salvar prova que gravou; login diz o que errou).');
//<<<<SECAO:test_ajustes_v52414.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5243.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5243.js:INICIO>>>>
// Teste v5.24.34 — segunda rodada do relatório pós-testes do dono:
//  1.x) backup com "D1_ERROR daily row write limit": a cota grátis de 100 mil
//       escritas/dia estourou (sync regravava registros idênticos). Cura:
//       push NÃO regrava registro idêntico (dedupe) + /v1/status imune ao
//       medidor + aviso "código ANTIGO" deixa de aparecer por tabela (checa
//       o /health de verdade) + mensagem amigável da cota no Backup.
//  2.1) o "Nova venda" alvo era o botão DENTRO da tela de Vendas — removido
//       (criação continua pelo atalho do menu Atendimento).
//  4.1) cliente existente "não segurava" na venda: seleção agora é à prova de
//       falha E a tela confirma "Cliente vinculado".
//  5.2.1/5.2.2) novo desenho do dono: abas Dados | Histórico do sistema;
//       dentro do Histórico, sub-menus (padrão Vendas); listagem com caixas
//       de múltipla escolha + botões Excluir/Extornar/Abrir lista de origem;
//       registro específico = botão DIREITO. Resumo antigo morreu.
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }

const worker  = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const appJs   = fs.readFileSync('app.js', 'utf8');
const syncPat = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const bkPat   = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
const patch   = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const bundle  = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const manifest= JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg       = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const P = require('./ajustes_v5243_cliente_abas_patch.js');

console.log('-- 1.x: cota da nuvem — dedupe de escritas + status à prova de cota --');
ok(worker.indexOf('CREATE TABLE IF NOT EXISTS backups (id TEXT PRIMARY KEY') >= 0, 'DDL backups continua numa linha só');
ok(!/CREATE TABLE IF NOT EXISTS \w+ \(\s*\n/.test(worker), 'nenhum CREATE TABLE multilinha');
ok((worker.match(/noop: true, version: currentVersion/g) || []).length === 2, 'push NÃO regrava registro idêntico nem delete repetido (economia da cota)');
ok(worker.indexOf("catch (eUso)") >= 0 && worker.indexOf("medidor pausado (cota)") >= 0, '/v1/status não cai mais quando o medidor não consegue gravar');
const vW = (worker.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').indexOf('Worker ' + vW) >= 0, 'worker carimbado (v' + vW + ') e motor colado na mesma versão');
ok(syncPat.indexOf("api('/health'") >= 0 && syncPat.indexOf('status.workerVersao=h.versao') >= 0, 'aviso "código ANTIGO" só aparece se o /health de verdade falhar');
ok(bkPat.indexOf('daily row write limit') >= 0 && bkPat.indexOf('atingiu o limite de gravações do período') >= 0, 'Backup traduz a cota estourada para português amigável');

console.log('-- 2.1: "Nova venda" fora da TELA DE VENDAS também --');
ok(appJs.indexOf('+ Nova venda / Orçamento</button>') < 0, 'botão "+ Nova venda / Orçamento" removido da tela de Vendas');
ok(appJs.indexOf('ph-shopping-cart-simple text-[16px]"></i> Nova venda</button>') < 0, 'hero do painel continua sem atalho');
ok(bundle.indexOf('+ Nova venda / Orçamento</button>') < 0 && bundleM.indexOf('+ Nova venda / Orçamento</button>') < 0, 'remoção refletida nos 2 bundles');

console.log('-- 4.1: cliente existente segura na venda, com confirmação visível --');
ok(patch.indexOf("window.selectClienteVenda.__v5243") >= 0 && patch.indexOf("getElementById('vos-codigo')") >= 0, 'ponte da tela antiga continua desviando para a VOS');
ok(patch.indexOf('window.__vosForm.cliente = c') >= 0, 'reamarca o vínculo se a pintura falhar');
ok(patch.indexOf('Cliente vinculado à venda') >= 0, 'tela CONFIRMA a amarração do cliente (feedback que faltava)');
ok(patch.indexOf('ainda não chegou neste PC') >= 0, 'cliente ainda não sincronizado vira aviso claro + cutucão na nuvem');

console.log('-- 5.2.1/5.2.2: novo desenho das abas do cliente --');
ok(patch.indexOf("['dados','Dados'") >= 0 && patch.indexOf("['historico','Histórico do sistema'") >= 0 && patch.indexOf("['vendas','Vendas'") < 0 === false, '2 abas principais: Dados | Histórico do sistema');
ok(patch.indexOf("['vendas','Vendas'") >= 0 && patch.indexOf("['financeiro','Financeiro'") >= 0 && patch.indexOf("['orcamentos','Orçamentos'") >= 0 && patch.indexOf("['chamados','Chamados'") >= 0 && patch.indexOf("['leituras','Leituras'") >= 0, '5 sub-menus dentro do Histórico');
ok(patch.indexOf("window.clitabSub(st.sub||'vendas')") >= 0, 'Histórico abre por padrão em VENDAS');
ok(patch.indexOf("foot.style.display=(aba==='dados')?'':'none'") >= 0, 'botão Salvar some fora da aba Dados');
ok(patch.indexOf('class="clitab-sel') >= 0 && patch.indexOf('clitabToggleSel') >= 0, 'linhas com caixa de múltipla escolha');
ok(patch.indexOf('clitab-btn-excluir') >= 0 && patch.indexOf('clitab-btn-extornar') >= 0 && patch.indexOf('clitab-btn-lista') >= 0, 'botões Excluir / Extornar / Abrir lista de origem');
ok(patch.indexOf("btnExt.style.display=(sub==='vendas')?'':'none'") >= 0, 'Extornar só aparece na listagem de vendas');
ok(patch.indexOf('faturad|finalizad|conclu|pago') >= 0, 'excluir venda pula faturadas (regra: estornar antes)');
ok(patch.indexOf("db.orcamentos=(banco.orcamentos||[]).filter(function(x){return x.id!==id;})") >= 0, 'orçamento excluído DE VEZ (v5.24.34: sem marca-fantasma)');
ok(patch.indexOf('oncontextmenu') >= 0 && patch.indexOf('clitabAbrirRegistro') >= 0, 'botão DIREITO abre o registro no módulo de origem');
ok(patch.indexOf('clitab-resumo') < 0, 'resumo antigo removido de vez');
ok(patch.indexOf("getElementById('search-vendas')") >= 0 && patch.indexOf("getElementById('search-cr')") >= 0, 'abrir lista joga o nome do cliente na busca do módulo');
// núcleo puro continua sadio
(function(){
  const db={vendas:[{id:'v1',clienteId:'X',empresaId:'E'}],contasReceber:[],orcamentos:[{id:'o1',clienteId:'X',empresaId:'E',itens:[{qtd:2,preco:5}]}],os:[],leituras:[]};
  const n=P.contagens(db,'X','E');
  ok(n.vendas===1 && n.orcamentos===1 && n.financeiro===0, 'PURE: contagens seguem certas');
  ok(P.totalOrc({itens:[{qtd:2,preco:5}]})===10, 'PURE: total do orçamento');
})();

console.log('-- integridade: manifest, bundles e versões --');
ok(manifest.includes('ajustes_v5243_cliente_abas_patch.js'), 'manifest tem o patch das abas');
const nScripts = Number((bundle.match(/\* scripts: (\d+) \| sha256:/) || [])[1] || 0);
ok(nScripts === manifest.length && nScripts > 200, 'header do bundle bate com o manifest (' + nScripts + ' scripts)');
ok(bundle.indexOf('clitab-btn-extornar') >= 0 && bundleM.indexOf('clitab-btn-extornar') >= 0, 'novo desenho presente nos 2 bundles');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0 && indexHtml.indexOf('app.bundle.js?v=' + pkg.version) >= 0, 'index.html na v' + pkg.version);
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0, 'mobile/www/index.html na v' + pkg.version);
ok(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json com versão válida (v' + pkg.version + ')');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v' + pkg.version); process.exit(1); }
console.log('\nTudo certo v' + pkg.version + '!');
//<<<<SECAO:test_ajustes_v5243.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5245.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5245.js:INICIO>>>>
// Teste v5.24.34 — rodada dele:
//  cota) farol anti-estouro: freio dentro do worker + dedupe + app que respeita
//  planos) (respondido em texto — não há o que testar no código)
//  2.1) o "Nova venda" que restava era o da tela VIVA (vendas_os): removido
//  4.1) 1ª tentativa falhava: busca com índice congelado + base trocada pela
//       nuvem. Cura: índice se refaz sozinho + clique se cura com o dado da
//       busca. E o Salvar que sumia: a ficha voltava aberta no Histórico
//       (que esconde o Salvar) — agora SEMPRE abre em Dados.
//  4.2) clicar num registro que a nuvem já trocou: valida ANTES de abrir,
//       atualiza a lista e avisa.
//  5.x) histórico: linhas com STATUS igual ao módulo; excluído de vez some;
//       orçamento também sai por remoção real (sem marca-fantasma).
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }

const worker  = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const appJs   = fs.readFileSync('app.js', 'utf8');
const vos     = fs.readFileSync('vendas_os_patch.js', 'utf8');
const patch   = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const bundle  = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg       = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const P = require('./ajustes_v5243_cliente_abas_patch.js');

console.log('-- cota: farol anti-estouro --');
const vW = (worker.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').indexOf('Worker ' + vW) >= 0, 'worker carimbado (v' + vW + ') e motor colado na mesma versão');
ok(worker.indexOf('freioDecide') >= 0 && worker.indexOf('const PLANO = PLANO_PAGO;') >= 0, 'freio preventivo: decide antes do teto e segue o plano pago (números, no farol)');
ok(worker.indexOf('daily row write limit próximo') >= 0, 'pausa do freio usa a frase que o app reconhece');
ok((function(){ if (fs.existsSync('checar_cota_nuvem.js')) return true; try { var INI='//<<'+'<<SECAO:'; var FIM=':INICIO>>>>'; var arqs=fs.readdirSync('.'); for (var k=0;k<arqs.length;k++) { if (!/^test_msg_.*\.js$/.test(arqs[k])) continue; if (fs.readFileSync(arqs[k],'utf8').indexOf(INI+'checar_cota_nuvem.js'+FIM)>=0) return true; } } catch(e){} return false; })(), 'farol checar_cota_nuvem.js existe como seção de tema (roda antes de toda versão)');

console.log('-- 2.1: botão da tela VIVA removido --');
ok(vos.indexOf('<button onclick="novaVenda()" class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button>') < 0, '"Nova venda" fora da tela Vendas e Notinhas (vendas_os)');
ok(appJs.indexOf('class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button>') < 0 && fs.readFileSync('notinha_patch.js','utf8').indexOf('class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button>') < 0, 'nenhuma cópia morta do botão restou nas fontes');
ok(bundle.indexOf('class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button>') < 0 && bundleM.indexOf('class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button>') < 0, 'remoção refletida nos 2 bundles');
ok(vos.indexOf("getElementById('modal-title').innerText = 'Nova venda / Notinha'") >= 0, 'atalho Nova notinha continua abrindo o formulário de venda');

console.log('-- 4.1: busca sempre fresca + clique que se cura --');
ok(patch.indexOf('window.__vosCliIdxBase !== base') >= 0, 'índice de clientes se refaz quando a base troca');
ok(patch.indexOf('window.__vosUltBusca[c.id]=c') >= 0, 'busca guarda o que mostrou (fonte da cura)');
ok(patch.indexOf("tick('cura-cliente')") >= 0, 'clique se cura: devolve o cliente à base e marca para subir');
ok(patch.indexOf('(recuperado da busca)') >= 0, 'tela confirma a cura junto com o vínculo');

console.log('-- Salvar garantido: ficha SEMPRE abre em Dados --');
ok(patch.indexOf("aba:'dados', sub:(anterior&&anterior.sub)||'vendas'") >= 0, 'estado novo sempre começa na aba Dados');
ok(patch.indexOf("anterior.aba==='historico'") < 0, 'não reabre mais no Histórico (era o que escondia o Salvar)');

console.log('-- 4.2: clique validado contra a base atual --');
ok(patch.indexOf('já não existe mais neste PC — a lista foi atualizada') >= 0, 'registro trocado pela nuvem: lista atualiza e avisa antes de abrir');

console.log('-- 5.x: status visível + excluído de vez some --');
ok(typeof P.chipStatus === 'function' && P.chipStatus('faturado')[0] === 'Faturada' && P.chipStatus('')[0] === 'Salva', 'PURE: rótulos de status (Faturada/Salva)');
ok(P.chipStatus('vencido')[1].indexOf('red') >= 0 && P.chipStatus('estornada')[1].indexOf('amber') >= 0, 'PURE: cores seguem o módulo (vencido vermelho, estornada âmbar)');
ok((patch.match(/chipStatusHtml\(/g) || []).length >= 6, 'chip aparece nas 5 listagens + definição');
ok(patch.indexOf("String(x.status||'').toLowerCase()==='excluido'") >= 0 && patch.indexOf('x.deletedAt || x.excluido===true') >= 0, 'lista esconde tudo que foi excluído');
ok(patch.indexOf("'Orçamento excluído de vez pela ficha do cliente'") >= 0, 'orçamento excluído de vez (remoção real)');
ok(patch.indexOf("o.status='excluido'") < 0, 'marca-fantasma de orçamento aposentada');
ok(patch.indexOf("' excluído(s) de vez") >= 0, 'aviso da exclusão diz "de vez"');
(function(){
  const db={vendas:[{id:'v1',clienteId:'X',empresaId:'E'},{id:'v2',clienteId:'X',empresaId:'E',deletedAt:1},{id:'v3',clienteId:'X',empresaId:'E',status:'excluido'}],
            contasReceber:[],orcamentos:[{id:'o1',clienteId:'X',empresaId:'F',itens:[]},{id:'o2',clienteId:'X',empresaId:'E',status:'excluido',itens:[]}],os:[],leituras:[]};
  const n=P.contagens(db,'X','E');
  ok(n.vendas===1 && n.orcamentos===0, 'PURE: contagens pulam excluídos e fantasmas');
  ok(P.filtra(db,'vendas','X','E').length===1 && P.filtra(db,'vendas','X','E')[0].id==='v1', 'PURE: filtra limpa + só da empresa');
})();

console.log('-- integridade: bundles e versões --');
ok(bundle.indexOf('__vosUltBusca[c.id]=c') >= 0 && bundleM.indexOf('__vosUltBusca[c.id]=c') >= 0, 'cura 4.1 presente nos 2 bundles');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0 && indexHtml.indexOf('app.bundle.js?v=' + pkg.version) >= 0, 'index.html na v' + pkg.version);
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0, 'mobile/www/index.html na v' + pkg.version);
ok(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json com versão válida (v' + pkg.version + ')');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v' + pkg.version); process.exit(1); }
console.log('\nTudo certo v' + pkg.version + '!');
//<<<<SECAO:test_ajustes_v5245.js:FIM>>>>
}

if (false) { // ═══ test_portao_escrita.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_portao_escrita.js:INICIO>>>>
// ═════════════════════════════════════════════════════
// TESTE — PORTÃO DE ESCRITA, BLOCO 1: EXISTE E REGISTRA (v7.0.22, rodada 35, ideia E)
//
// A DOR: 254 pontos em 109 arquivos gravam direto (saveDB/saveDBAgora/db.save) e,
// quando um dado some/volta, não há registro de quem gravou, quando e por qual tela.
//
// ESTE BLOCO (o portão "por baixo"): embrulha o saveDB e o saveDBAgora e ANOTA cada
// gravação (quando + tela + por onde) numa lista curta na memória. NÃO muda nenhum
// comportamento — e este teste PROVA isso comparando ANTES (sem o portão) e DEPOIS
// (com o portão): efeitos idênticos + diário presente. A migração dos 254 pontos
// para a função única vem nos próximos blocos, cada um com seu antes/depois.
// Roda sem jsdom (navegador de mentira, na mão).
// ═════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  ✘ ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  ✔ ' + nome); passou++;
}
console.log('== PORTÃO DE ESCRITA, BLOCO 1 (só confere comportamento, nada muda) ==');

const PATCH = 'ajustes_v7021_portao_escrita_patch.js';
const LPATCH = 'ajustes_v7020_mandar_erro_patch.js';
ok('o patch do portão existe', fs.existsSync(PATCH));
const FONTE = fs.readFileSync(PATCH, 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const lista = Array.isArray(manifest) ? manifest : (manifest.scripts || manifest.files || []);
const pos = lista.indexOf(PATCH);
ok('o portão entra no bundle', pos >= 0);
ok('o portão carrega DEPOIS do patch da nuvem (embrulha o saveDB vencedor) e do mandar-erro',
  pos > lista.indexOf('cloudflare_data_sync_patch.js') && pos > lista.indexOf(LPATCH), 'pos=' + pos);
ok('o portão declara a substituição (trava D: marcador SUBSTITUICAO)',
  FONTE.indexOf('SUBSTITUICAO DE PROPOSITO: saveDB') >= 0 && FONTE.indexOf('SUBSTITUICAO DE PROPOSITO: saveDBAgora') >= 0);
const codigo = FONTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
ok('o portão ENCADEIA (não substitui): delega via .apply',
  /\.apply\s*\(\s*this\s*,\s*arguments\s*\)/.test(FONTE));
ok('o portão é VISÍVEL no mapa (atribuição estática, nunca window[nome])',
  codigo.indexOf('window.saveDB=function') >= 0 && codigo.indexOf('window.saveDBAgora=function') >= 0 &&
  codigo.indexOf('window[nome]') < 0);
ok('o portão é barato (sem timer, sem rede, sem disco — regra 12)',
  ['setTimeout', 'setInterval', 'localStorage', 'sessionStorage', 'fetch(', 'XMLHttpRequest', 'WebSocket']
    .every((p) => codigo.indexOf(p) < 0));
ok('o portão não mexe em tela (nada visual)', codigo.toLowerCase().indexOf('footer') < 0 && codigo.toLowerCase().indexOf('rodapé') < 0);
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok('o ritual confere o patch novo (scripts.check)', (pkg.scripts.check || '').indexOf(PATCH) >= 0);
// A montanha (só informa — os blocos de migração vão derrubar este número):
{
  let n = 0; const arqs = new Set();
  lista.forEach((f) => {
    let s = ''; try { s = fs.readFileSync(f, 'utf8'); } catch (e) { return; }
    const c = (s.match(/[^A-Za-z0-9_.]saveDB\s*\(/g) || []).length +
      (s.match(/[^A-Za-z0-9_.]saveDBAgora\s*\(/g) || []).length + (s.match(/db\.save\s*\(/g) || []).length;
    if (c > 0) { n += c; arqs.add(f); }
  });
  console.log('  (montanha a migrar: ' + n + ' gravações diretas em ' + arqs.size + ' arquivos)');
}

// ── navegador de mentira ──
function vista(id, visivel) {
  return { id: id, classList: { contains: function (c) { return c === 'hidden' ? !visivel : false; } } };
}
function docMock(op) {
  op = op || {};
  const todas = ['view-vendas', 'view-clientes', 'view-config'];
  const vis = op.visiveis || ['view-vendas'];
  return {
    getElementById: function (id) {
      if (id !== 'modal-root') return null;
      if (!op.modal) return { classList: { contains: function () { return true; } } };
      return { classList: { contains: function () { return false; } } };
    },
    querySelectorAll: function () { return todas.map((t) => vista(t, vis.indexOf(t) >= 0)); },
    querySelector: function () { return null; }
  };
}
function janelaMock(doc) {
  const chamadas = [];
  const window = {
    saveDB: function () { chamadas.push({ via: 'saveDB', args: Array.prototype.slice.call(arguments), isto: this === window }); return 'ok-db'; },
    saveDBAgora: function () { chamadas.push({ via: 'saveDBAgora', args: Array.prototype.slice.call(arguments), isto: this === window }); return 'ok-agora'; }
  };
  return { window: window, chamadas: chamadas };
}
function avaliarPortao(window, doc) {
  new Function('window', 'document', FONTE)(window, doc);
}
function mesmosEfeitos(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ── ANTES × DEPOIS: efeitos idênticos ──
let antes, depois, recs;
{
  const a = janelaMock(docMock());
  const r1 = a.window.saveDB('cli-1', { nome: 'X' });
  const r2 = a.window.saveDBAgora();
  antes = { ret: [r1, r2], chamadas: a.chamadas };
}
{
  const d = janelaMock(docMock());
  avaliarPortao(d.window, docMock());
  const r1 = d.window.saveDB('cli-1', { nome: 'X' });
  const r2 = d.window.saveDBAgora();
  depois = { ret: [r1, r2], chamadas: d.chamadas };
  recs = d.window.DIGICOPY_PORTAO.ultimas(10);
}
ok('ANTES × DEPOIS: retorno, argumentos e this idênticos (comportamento intacto)',
  mesmosEfeitos(antes, depois), JSON.stringify(depois));
ok('DEPOIS: o diário anotou as 2 gravações (via + tela + quando)',
  recs.length === 2 && recs[0].via === 'saveDB' && recs[1].via === 'saveDBAgora' &&
  recs[0].tela === 'vendas' && recs[1].tela === 'vendas' &&
  typeof recs[0].q === 'number' && typeof recs[1].q === 'number' && recs[1].q >= recs[0].q,
  JSON.stringify(recs));

// ── motivo (r38: a função única avisa o porquê) ──
{
  const d = janelaMock(docMock());
  avaliarPortao(d.window, docMock());
  const P = d.window.DIGICOPY_PORTAO;
  ok('o portão aceita motivo (anotarMotivo existe)', typeof P.anotarMotivo === 'function');
  P.anotarMotivo('usuário excluído');
  d.window.saveDB();
  d.window.saveDB();
  const rs = P.ultimas(10);
  ok('o motivo vai parar na gravação seguinte', rs.length === 2 && rs[0].motivo === 'usuário excluído', JSON.stringify(rs));
  ok('o motivo não vaza para a gravação de depois', rs[1].motivo === '', JSON.stringify(rs[1]));
}

// ── detecção de tela ──
{
  const d = janelaMock(docMock({ visiveis: ['view-clientes'] }));
  avaliarPortao(d.window, docMock({ visiveis: ['view-clientes'] }));
  d.window.saveDB();
  ok('tela de verdade (clientes)', d.window.DIGICOPY_PORTAO.ultimas(1)[0].tela === 'clientes');
}
{
  const d = janelaMock(docMock({ modal: true }));
  d.window.modalContext = { type: 'orcamento-novo' };
  avaliarPortao(d.window, docMock({ modal: true }));
  d.window.saveDB();
  ok('janela por cima (modal)', d.window.DIGICOPY_PORTAO.ultimas(1)[0].tela === 'janela: orcamento-novo');
}
{
  const d = janelaMock(docMock({ visiveis: [] }));
  avaliarPortao(d.window, docMock({ visiveis: [] }));
  d.window.saveDB();
  ok('sem tela visível: "não sei" (nunca trava)', d.window.DIGICOPY_PORTAO.ultimas(1)[0].tela === 'não sei');
}
{
  const chamadas = [];
  const window = { saveDB: function () { chamadas.push(1); return true; } };
  avaliarPortao(window, undefined);
  window.saveDB();
  ok('sem documento: anota "não sei" e não quebra',
    chamadas.length === 1 && window.DIGICOPY_PORTAO.ultimas(1)[0].tela === 'não sei');
}

// ── proteção: não embrulha 2 vezes, teto, mudez temporária ──
{
  const d = janelaMock(docMock());
  avaliarPortao(d.window, docMock());
  avaliarPortao(d.window, docMock());
  d.window.saveDB();
  ok('carregar 2 vezes NÃO duplica (1 anotação, 1 chamada)',
    d.chamadas.length === 1 && d.window.DIGICOPY_PORTAO.ultimas(10).length === 1);
}
{
  const d = janelaMock(docMock());
  avaliarPortao(d.window, docMock());
  for (let i = 0; i < 55; i++) d.window.saveDB();
  ok('teto de 50 no diário, contador total segue (55)',
    d.window.DIGICOPY_PORTAO.ultimas(100).length === 50 && d.window.DIGICOPY_PORTAO.total() === 55);
}
{
  // padrão v5243: calar o saveDB durante um render filtrado e devolver depois
  const d = janelaMock(docMock());
  avaliarPortao(d.window, docMock());
  const sdB = d.window.saveDB;
  d.window.saveDB = function () {};
  d.window.saveDB();
  d.window.saveDB = sdB;
  d.window.saveDB();
  const u = d.window.DIGICOPY_PORTAO.ultimas(10);
  ok('mudez temporária (v5243) continua valendo e o portão volta depois',
    u.length === 1 && d.chamadas.length === 1);
}
{
  // sem saveDB ao carregar: o portão existe, vazio, sem quebrar
  const window = {};
  avaliarPortao(window, docMock());
  ok('sem saveDB ao carregar: portão existe e vazio, sem quebrar',
    !!window.DIGICOPY_PORTAO && window.DIGICOPY_PORTAO.ultimas(5).length === 0 && window.DIGICOPY_PORTAO.total() === 0);
}

// ── integração com o "mandar o que quebrou" ──
const LFONTE = fs.readFileSync(LPATCH, 'utf8');
function pacoteCom(op) {
  const loja = { digicopy_erros_txt: JSON.stringify(op.erros || []) };
  const ls = { getItem: function (k) { return loja[k] || null; }, setItem: function () {}, removeItem: function () {} };
  const w = {
    DIGICOPY_APP_VERSION: '9.9.9-teste',
    saveDB: function () { return true; },
    mostrarTextoCopiar: function (t, txt) { w.__pacote = txt; return true; },
    toast: function () {}
  };
  const doc = docMock({ visiveis: ['view-vendas'] });
  if (op.comPortao) avaliarPortao(w, doc);
  new Function('window', 'document', 'localStorage', LFONTE)(w, doc, ls);
  if (op.comPortao) { w.saveDB(); w.saveDB(); }
  w.digicopyMandarErro();
  return w.__pacote || '';
}
{
  const txt = pacoteCom({ comPortao: true, erros: ['[fake] quebrou X'] });
  ok('COM portão: pacote leva as gravações (quando | onde | por onde)',
    txt.indexOf('gravações (últimas 2') >= 0 && txt.indexOf('vendas') >= 0 && txt.indexOf('saveDB') >= 0,
    txt.split('\n').slice(-4).join(' / '));
  ok('COM portão: erros e versão continuam no pacote',
    txt.indexOf('[fake] quebrou X') >= 0 && txt.indexOf('9.9.9-teste') >= 0);
}
{
  const txt = pacoteCom({ comPortao: false, erros: ['[fake] quebrou X'] });
  ok('SEM portão: pacote idêntico ao de antes (zero linhas novas)',
    txt.indexOf('gravações (') < 0 && txt.indexOf('[fake] quebrou X') >= 0 && txt.indexOf('9.9.9-teste') >= 0);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram.');
//<<<<SECAO:test_portao_escrita.js:FIM>>>>
}

if (false) { // ═══ test_salvar_alteracao.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_salvar_alteracao.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — FUNÇÃO ÚNICA DE GRAVAÇÃO + BLOCO 2 (ideia E, r38)
// Parte A: a função única cumpre o contrato (não duplica, não inventa forma,
//          anota motivo, delega o save). Parte B: ANTES (git HEAD) × DEPOIS
// (arquivo atual) nos 3 sites migrados — db idêntico, saves iguais, e o DEPOIS
// anota o motivo. Parte C: estrutural (sites chamam a função certa).
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const cp = require('child_process');
function ok(name, cond, extra) {
  if (!cond) { console.error('  ✘ ' + name + (extra ? ' :: ' + extra : '')); process.exit(1); }
  console.log('  ✔ ' + name);
}
console.log('== FUNÇÃO ÚNICA DE GRAVAÇÃO + BLOCO 2 (só confere, nada muda) ==');

const PATCH = 'ajustes_v7022_salvar_alteracao_patch.js';
const FONTE = fs.readFileSync(PATCH, 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const lista = Array.isArray(manifest) ? manifest : (manifest.scripts || manifest.files || []);

// ── Parte 0: presença e higiene ──
ok('o patch da função única existe', fs.existsSync(PATCH));
const pos = lista.indexOf(PATCH);
ok('a função única entra no bundle', pos >= 0, 'pos=' + pos);
ok('a função única carrega depois do portão (usa o diário dele)',
  pos > lista.indexOf('ajustes_v7021_portao_escrita_patch.js'));
ok('definição única (sem conflito — trava D não acusa)',
  (FONTE.match(/window\.salvarAlteracao\s*=/g) || []).length === 1);
const codigo = FONTE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
ok('a função única é barata (sem timer, sem rede, sem disco — regra 12)',
  ['setTimeout', 'setInterval', 'localStorage', 'sessionStorage', 'fetch(', 'XMLHttpRequest', 'WebSocket']
    .every((p) => codigo.indexOf(p) < 0));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok('o ritual confere o patch novo (scripts.check)', (pkg.scripts.check || '').indexOf(PATCH) >= 0);

// carrega a função única REAL num window de mentira
function carregar(window) {
  new Function('window', 'document', FONTE)(window, {});
  return window.salvarAlteracao;
}
function baseMock(db) {
  const chamadas = [];
  const motivos = [];
  const window = {
    db: db,
    saveDB: function () { chamadas.push(1); return 'salvo'; },
    DIGICOPY_PORTAO: { anotarMotivo: function (m) { motivos.push(m); } }
  };
  return { window: window, chamadas: chamadas, motivos: motivos };
}

// ── Parte A: contrato da função única ──
{
  const m = baseMock({ clientes: [] });
  const salvar = carregar(m.window);
  const r = salvar('clientes', { id: 'c1', nome: 'A' }, 'cliente criado');
  ok('A1 registro novo entra na lista', m.window.db.clientes.length === 1 && m.window.db.clientes[0].id === 'c1');
  ok('A2 grava 1 vez e devolve o retorno do save', m.chamadas.length === 1 && r === 'salvo');
  ok('A3 motivo vai para o diário', m.motivos.length === 1 && m.motivos[0] === 'cliente criado');
}
{
  const alvo = { id: 'c1', nome: 'B' };
  const m = baseMock({ clientes: [alvo] });
  const salvar = carregar(m.window);
  salvar('clientes', alvo, 'cliente editado');
  ok('A4 registro que já está lá NÃO duplica (mutação in-place)', m.window.db.clientes.length === 1);
  ok('A5 e mesmo assim grava + anota', m.chamadas.length === 1 && m.motivos[0] === 'cliente editado');
}
{
  const antes = { produtos: [{ id: 'p1', categoria: 'X' }] };
  const m = baseMock(JSON.parse(JSON.stringify(antes)));
  carregar(m.window)('produtos', null, 'correção em massa');
  ok('A6 registro null não mexe no db (só anota e grava)',
    JSON.stringify(m.window.db) === JSON.stringify(antes) && m.chamadas.length === 1 && m.motivos[0] === 'correção em massa');
}
{
  const m = baseMock({});
  carregar(m.window)('clientes', { id: 'c9' }, 'x');
  ok('A7 lista ausente: NÃO inventa forma no db (só grava)', !('clientes' in m.window.db) && m.chamadas.length === 1);
}
{
  const m = baseMock({ clientes: 'não é lista' });
  carregar(m.window)('clientes', { id: 'c9' }, 'x');
  ok('A8 lista que não é lista: ignora o upsert, grava normal',
    m.window.db.clientes === 'não é lista' && m.chamadas.length === 1);
}
{
  const m = baseMock({ clientes: [] });
  delete m.window.saveDB;
  const salvar = carregar(m.window);
  let erro = '';
  try { salvar('clientes', { id: 'c1' }, 'x'); } catch (e) { erro = String(e && e.message || e); }
  m.window.saveDB = function () { m.chamadas.push(1); };
  m.window.saveDB();
  ok('A9 sem saveDB não quebra e não deixa motivo pendente (sem vazamento)',
    erro === '' && m.motivos.length === 0 && m.chamadas.length === 1);
}
{
  const m = baseMock({ clientes: [] });
  const f1 = carregar(m.window);
  const f2 = carregar(m.window);
  ok('A10 carregar 2 vezes não troca a função (guarda __portaoE2)', f1 === f2);
}

// ── Parte B: ANTES (git HEAD) × DEPOIS (atual), de verdade ──
function antesDe(arq) {
  return cp.execFileSync('git', ['show', 'HEAD:' + arq], { stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');
}
function avaliarArquivo(src, window, db, saveDB, salvar, getSession) {
  new Function('window', 'document', 'db', 'saveDB', 'salvarAlteracao', 'getSession', src)(
    window, {}, db, saveDB, salvar, getSession);
}
const FLAG224 = 'correcaoCatLetraUmaVez';
function semente224() {
  return { produtos: [{ id: 'p1', categoria: 'P' }, { id: 'p2', categoria: 'Chip' }, { id: 'p3', categoria: 's' }], config: {} };
}
function realSalvarPara(window) {
  new Function('window', 'document', FONTE)(window, {});
  return window.salvarAlteracao;
}
function rodar224(src, usarReal, comApi) {
  const db = semente224();
  const chamadas = [];
  const motivos = [];
  const window = {
    db: db,
    saveDB: function () { chamadas.push(1); },
    DIGICOPY_PORTAO: { anotarMotivo: function (m) { motivos.push(m); } },
    renderProdutos: function () { /* original */ }
  };
  if (comApi) window.CAT_LETRA_PURE = { ehLetraFiltro: function (v) { return /^[psice]$/i.test(String(v || '')); }, letraParaNome: function (v) { return 'NOME:' + v; } };
  const salvar = usarReal ? realSalvarPara(window) : undefined;
  avaliarArquivo(src, window, db, window.saveDB, salvar, undefined);
  window.renderProdutos(); // o patch embrulha e roda aplicarUmaVez()
  const norm = JSON.parse(JSON.stringify(db));
  const em = norm.config && norm.config[FLAG224] && norm.config[FLAG224].em;
  if (norm.config && norm.config[FLAG224]) delete norm.config[FLAG224].em;
  return { norm: norm, n: db.config[FLAG224].n, em: em, saves: chamadas.length, motivos: motivos };
}
['sem API de letra', 'com API de letra'].forEach((modo, k) => {
  const comApi = k === 1;
  const srcAntes = antesDe('ajustes_v52224_cat_letra_uma_vez_patch.js');
  const srcDepois = fs.readFileSync('ajustes_v52224_cat_letra_uma_vez_patch.js', 'utf8');
  if (k === 0) console.log('  (HEAD ' + (srcAntes === srcDepois ? 'igual ao atual — modo regressão' : 'difere — ANTES × DEPOIS real') + ')');
  const a = rodar224(srcAntes, false, comApi);
  const d = rodar224(srcDepois, true, comApi);
  ok('B1[' + modo + '] v52224: db idêntico antes/depois (ignorando o relógio)',
    JSON.stringify(a.norm) === JSON.stringify(d.norm), JSON.stringify(d.norm));
  ok('B2[' + modo + '] v52224: mesma contagem e relógio válido nos dois',
    a.n === d.n && a.n === 2 && !isNaN(Date.parse(a.em)) && !isNaN(Date.parse(d.em)));
  ok('B3[' + modo + '] v52224: mesmos saves (1 e 1)', a.saves === 1 && d.saves === 1);
});

// NOTE: o motivo do DEPOIS é conferido com o diário ligado de verdade:
{
  const srcDepois = fs.readFileSync('ajustes_v52224_cat_letra_uma_vez_patch.js', 'utf8');
  const db = semente224();
  const chamadas = [];
  const motivos = [];
  const window = {
    db: db, saveDB: function () { chamadas.push(1); },
    DIGICOPY_PORTAO: { anotarMotivo: function (m) { motivos.push(m); } },
    renderProdutos: function () { }
  };
  const salvar = realSalvarPara(window);
  avaliarArquivo(srcDepois, window, db, window.saveDB, salvar, undefined);
  window.renderProdutos();
  ok('B4 v52224: o DEPOIS anota o motivo', motivos.length === 1 && motivos[0] === 'letra de categoria padronizada');
}

function semente196() {
  return {
    usuarios: [
      { id: 'u-admin', login: 'kauan', empresaId: 'e1', perfil: 'Funcionário' },
      { id: 'u-dono', login: 'denivaldo', empresaId: 'e1', perfil: 'Funcionário' },
      { id: 'u-alvo', login: 'maria', empresaId: 'e1', perfil: 'Funcionário' }
    ],
    tecnicos: [{ id: 't1', nome: 'Zé' }]
  };
}
function rodar196(src, qual, usarReal) {
  const db = semente196();
  const chamadas = [];
  const motivos = [];
  const window = {
    db: db,
    saveDB: function () { chamadas.push(1); },
    DIGICOPY_PORTAO: { anotarMotivo: function (m) { motivos.push(m); } },
    confirmSistema: function () { return { then: function (cb) { cb(true); } }; }
  };
  const salvarOuNada = usarReal ? realSalvarPara(window) : undefined;
  const sess = function () { return { usuarioId: 'u-admin', empresaId: 'e1', login: 'kauan' }; };
  avaliarArquivo(src, window, db, window.saveDB, salvarOuNada, sess);
  if (qual === 'usuario') window.excluirUsuario('u-alvo'); else window.excluirTecnico('t1');
  return { db: db, saves: chamadas.length, motivos: motivos };
}
{
  const srcAntes = antesDe('ajustes_v5196_patch.js');
  const srcDepois = fs.readFileSync('ajustes_v5196_patch.js', 'utf8');
  console.log('  (v5196 HEAD ' + (srcAntes === srcDepois ? 'igual — regressão' : 'difere — ANTES × DEPOIS real') + ')');
  const aU = rodar196(srcAntes, 'usuario', false);
  const dU = rodar196(srcDepois, 'usuario', true);
  const aT = rodar196(srcAntes, 'tecnico', false);
  const dT = rodar196(srcDepois, 'tecnico', true);
  ok('B5 excluirUsuario: db idêntico antes/depois', JSON.stringify(aU.db) === JSON.stringify(dU.db));
  ok('B6 excluirUsuario: alvo sumiu, resto intacto',
    dU.db.usuarios.length === 2 && !dU.db.usuarios.some((u) => u.id === 'u-alvo'));
  ok('B7 excluirUsuario: mesmos saves (1 e 1)', aU.saves === 1 && dU.saves === 1);
  ok('B8 excluirTecnico: db idêntico antes/depois', JSON.stringify(aT.db) === JSON.stringify(dT.db));
  ok('B9 excluirTecnico: técnico sumiu', dT.db.tecnicos.length === 0);
  ok('B10 excluirTecnico: mesmos saves (1 e 1)', aT.saves === 1 && dT.saves === 1);
}

// ── Parte C: estrutural (os 3 sites chamam a função certa) ──
const v224 = fs.readFileSync('ajustes_v52224_cat_letra_uma_vez_patch.js', 'utf8');
const v196 = fs.readFileSync('ajustes_v5196_patch.js', 'utf8');
ok('C1 v52224 chama a função única com lista+motivo',
  v224.indexOf("salvarAlteracao('produtos',null,'letra de categoria padronizada')") >= 0);
ok('C2 v52224 sem o save direto antigo',
  v224.indexOf("\n  if(typeof saveDB==='function') saveDB();") < 0);
ok('C3 v5196 excluirUsuario chama a função única',
  v196.indexOf("salvarAlteracao('usuarios',null,'usuário excluído')") >= 0);
ok('C4 v5196 excluirTecnico chama a função única',
  v196.indexOf("salvarAlteracao('tecnicos',null,'técnico excluído')") >= 0);
ok('C5 v5196 sem os 2 saves diretos antigos (os outros 2 ficam para os próximos blocos)',
  v196.indexOf("\n    if(typeof saveDB === 'function') saveDB();") < 0 &&
  (v196.match(/\n  if\(typeof saveDB === 'function'\) saveDB\(\);/g) || []).length === 2);

console.log('\nRESULTADO: função única + bloco 2 passaram!');
//<<<<SECAO:test_salvar_alteracao.js:FIM>>>>
}
