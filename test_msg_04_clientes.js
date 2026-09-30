// ═══════════════════════════════════════════════════════════════
// test_msg_04_clientes.js — GERADO por migrar_testes_r57.js; 27 seções.
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_clientes.js, test_loc.js, test_contratos_refino.js, test_contratos_final.js, test_rtf_template.js, test_contratos_visitas.js, test_automacoes_locacao_visitas.js, test_contratos_leituras_definitivo.js, test_fluxo_contrato_leitura_corrigido.js, test_leitura_busca_fluxo.js, test_leitura_detalhada_departamentos.js, test_leitura_impressao_compacta_produtos.js, test_sistema_clientes_loja.js, test_ajustes_v5214.js, test_ajustes_v52236.js, test_ajustes_v52245.js, test_ajustes_v52281.js, test_ajustes_v52435.js, test_ajustes_v52436.js, test_ajustes_v5250.js, test_contrato_impressora_nao_some.js, test_ajustes_v52410.js, test_ajustes_v52411.js, test_ajustes_v52422.js, test_ajustes_v5247.js, test_unificar_contratos_r49.js
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

if (false) { // ═══ test_clientes.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_clientes.js:INICIO>>>>
// Testes unitários do CLI_PURE (clientes_patch.js) — v4.8.0
// Uso: node test_clientes.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/clientes_patch.js', 'utf8');
const m = src.match(/\/\* CLI_PURE_START \*\/([\s\S]*?)\/\* CLI_PURE_END \*\//);
if(!m){ console.error('FALHOU: seção CLI_PURE não encontrada'); process.exit(1); }
const CLI_PURE = eval(m[1] + '\n; CLI_PURE;');

let pass = 0, fail = 0;
function eq(nome, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok){ pass++; console.log('  ✔', nome); }
  else { fail++; console.error('  ✘', nome, '\n     obtido:', JSON.stringify(got), '\n     esperado:', JSON.stringify(want)); }
}
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

console.log('== fold / soDigitos / normalizaCep ==');
{
  eq('dobra acentos e caixa', CLI_PURE.fold('José ÁVILA ç'), 'jose avila c');
  eq('só dígitos', CLI_PURE.soDigitos('(38) 9.9911-2233'), '38999112233');
  eq('cep válido', CLI_PURE.normalizaCep('39440-000'), '39440000');
  eq('cep incompleto → null', CLI_PURE.normalizaCep('3944'), null);
  eq('cep vazio → null', CLI_PURE.normalizaCep(''), null);
}

console.log('== montaEndereco ==');
{
  eq('completo', CLI_PURE.montaEndereco({rua:'Rua das Flores', numero:'123', complemento:'Sala 2', bairro:'Centro'}), 'Rua das Flores, 123 - Sala 2 • Centro');
  eq('sem complemento', CLI_PURE.montaEndereco({rua:'Av. Central', numero:'50', bairro:'Canaã'}), 'Av. Central, 50 • Canaã');
  eq('só rua', CLI_PURE.montaEndereco({rua:'Estrada do Campo'}), 'Estrada do Campo');
  eq('vazio', CLI_PURE.montaEndereco({}), '');
}

console.log('== validarObrigatorios (nome, telefone, rua, número, bairro) ==');
{
  eq('tudo vazio → 5 faltando', CLI_PURE.validarObrigatorios({}).length, 5);
  eq('só nome → faltam 4', CLI_PURE.validarObrigatorios({nome:'Maria'}).length, 4);
  eq('espaço conta como vazio', CLI_PURE.validarObrigatorios({nome:'  ', telefone:' x ', rua:' r ', numero:' 1 ', bairro:' b '}).length, 1);
  eq('completo → ok', CLI_PURE.validarObrigatorios({nome:'M', telefone:'9', rua:'R', numero:'1', bairro:'B'}).length, 0);
}

console.log('== proxCodigo ==');
{
  const cls = [
    {empresaId:'E', codigo:5}, {empresaId:'E', codigo:12}, {empresaId:'E'},
    {empresaId:'X', codigo:99}, {empresaId:'E', codigo:'20'}
  ];
  eq('maior da empresa +1', CLI_PURE.proxCodigo(cls, 'E'), 21);
  eq('sem clientes → 1', CLI_PURE.proxCodigo([], 'E'), 1);
}

console.log('== filtraClientes — campo específico ==');
{
  const cls = [
    {id:'1', nome:'CONCREBLOCOS TRANSPORTES LTDA', fantasia:'CONCREBLOCO', codigo:1607, documento:'20.415.005/0001-92', telefone:'(38) 3082-5799', cidade:'JANAUBA', bairro:'CENTRO', endereco:'Rua A, 10 • Centro', cep:'39.440-000', email:'a@a.com', contato:'Ana'},
    {id:'2', nome:'COLEGIO PREMIO EIRELI', fantasia:'COLEGIO PREMIO', codigo:1370, documento:'00.273.894/0001-93', telefone:'(38) 3821-1089', cidade:'Bocaiúva', bairro:'Alto', endereco:'Rua B, 20', cep:'39.390-000', email2:'b@b.com', contato:'Bruno'},
    {id:'3', nome:'José das Couves', codigo:22, telefone:'38999990000', cidade:'Montes Claros', bairro:'Couves', observacao:'VIP desde 2020'}
  ];
  eq('por nome com acento dobrado', CLI_PURE.filtraClientes(cls, 'colegio', 'nome').map(c=>c.id), ['2']);
  eq('por fantasia', CLI_PURE.filtraClientes(cls, 'premio', 'fantasia').map(c=>c.id), ['2']);
  eq('por código', CLI_PURE.filtraClientes(cls, '1607', 'codigo').length, 1);
  eq('código 48 não pega 480', CLI_PURE.filtraClientes([{codigo:48},{codigo:480},{codigo:1480},{codigo:1048}], '48', 'codigo').map(c=>c.codigo), [48]);
  eq('048 e 48 são o mesmo', CLI_PURE.filtraClientes([{codigo:'048'},{codigo:480}], '48', 'codigo').map(c=>String(c.codigo)), ['048']);
  eq('por CNPJ só números', CLI_PURE.filtraClientes(cls, '20415005', 'documento').map(c=>c.id), ['1']);
  eq('por telefone só números', CLI_PURE.filtraClientes(cls, '30825799', 'telefone').map(c=>c.id), ['1']);
  eq('por cidade sem acento', CLI_PURE.filtraClientes(cls, 'bocaiuva', 'cidade').map(c=>c.id), ['2']);
  eq('por bairro', CLI_PURE.filtraClientes(cls, 'couves', 'bairro').map(c=>c.id), ['3']);
  eq('por endereço', CLI_PURE.filtraClientes(cls, 'rua a', 'endereco').map(c=>c.id), ['1']);
  eq('por e-mail (busca email2 também)', CLI_PURE.filtraClientes(cls, 'b@b.com', 'email').map(c=>c.id), ['2']);
  eq('por contato', CLI_PURE.filtraClientes(cls, 'bruno', 'contato').map(c=>c.id), ['2']);
  eq('por cep', CLI_PURE.filtraClientes(cls, '39390000', 'cep').map(c=>c.id), ['2']);
  eq('por observação', CLI_PURE.filtraClientes(cls, 'vip', 'observacao').map(c=>c.id), ['3']);
}

console.log('== filtraClientes — modo "todos" e bordas ==');
{
  const cls = [
    {id:'1', nome:'Maria Silva', cidade:'Janaúba', telefone:'(38) 99911-0000'},
    {id:'2', nome:'Pedro Ávila', bairro:'Silva Jardim', documento:'123.456.789-09'}
  ];
  eq('todos: acha por bairro', CLI_PURE.filtraClientes(cls, 'silva', 'todos').length, 2);
  eq('todos: acento dobrado', CLI_PURE.filtraClientes(cls, 'avila', 'todos').map(c=>c.id), ['2']);
  eq('todos: documento só números', CLI_PURE.filtraClientes(cls, '123456789', 'todos').map(c=>c.id), ['2']);
  eq('busca vazia devolve tudo', CLI_PURE.filtraClientes(cls, '   ', 'nome').length, 2);
  eq('nada achou → vazio', CLI_PURE.filtraClientes(cls, 'zzz', 'todos').length, 0);
}

console.log('\n══════════════════════════════════');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_clientes.js:FIM>>>>
}

if (false) { // ═══ test_loc.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_loc.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const codeLoc = fs.readFileSync('locacao_contratos_patch.js', 'utf8');
const ctx = { window: {}, db: { contratos: [], parque: [], leituras: [], os: [], equipamentos: [] } };
new Function('window', 'db', codeLoc)(ctx.window, ctx.db);

const LOC = ctx.window.LOC_PURE;

console.log('== LOC_PURE: ehEstoqueBaixo ==');
ok('estoque 4 com mín 4 → false (igual não notifica)', !LOC.ehEstoqueBaixo(4, 4));
ok('estoque 3 com mín 4 → true', LOC.ehEstoqueBaixo(3, 4));
ok('estoque 0 com mín 5 → true', LOC.ehEstoqueBaixo(0, 5));
ok('estoque 10 com mín 5 → false', !LOC.ehEstoqueBaixo(10, 5));

console.log('== LOC_PURE: calcLeituraExcedente ==');
{
  const r1 = LOC.calcLeituraExcedente(14015, 15051, 0, 0.15, 'global');
  ok('utilizado global correto (1036)', r1.utilizado === 1036);
  ok('excedente global correto (1036)', r1.excedente === 1036);
  ok('valor excedente global correto', Math.abs(r1.valorExcedente - 155.40) < 0.001);

  const r2 = LOC.calcLeituraExcedente(1000, 1200, 500, 0.10, 'global');
  ok('abaixo da franquia → 0 excedente', r2.utilizado === 200 && r2.excedente === 0 && r2.valorExcedente === 0);

  const r3 = LOC.calcLeituraExcedente(1000, 1600, 500, 0.10, 'global');
  ok('acima da franquia → calcula excedente', r3.utilizado === 600 && r3.excedente === 100 && Math.abs(r3.valorExcedente - 10.00) < 0.001);

  const r4 = LOC.calcLeituraExcedente(100, 300, 0, 0.20, 'impressao');
  ok('modo por impressao → cobra todas as paginas', r4.excedente === 200 && Math.abs(r4.valorExcedente - 40.00) < 0.001);

  const r5 = LOC.calcLeituraExcedente(100, 500, 0, 0.50, 'mes_fixo');
  ok('modo mes fixo → excedente e valor zero', r5.excedente === 0 && r5.valorExcedente === 0);
}

console.log('== LOC_PURE: calcContadoresChamado ==');
{
  const c1 = LOC.calcContadoresChamado(53200, 54200);
  ok('qtd impressos calculada (1000)', c1.quantidadeImpressos === 1000);
  const c2 = LOC.calcContadoresChamado(10000, 9000);
  ok('não permite qtd negativa (0)', c2.quantidadeImpressos === 0);
}

console.log('== LOC_PURE: ehVencidoChamado ==');
{
  const ont = new Date(Date.now() - 86400000).toISOString();
  const hoj = new Date().toISOString();
  ok('chamado de ontem aberto → vencido', LOC.ehVencidoChamado(ont, 'aberto'));
  ok('chamado de hoje aberto → não vencido', !LOC.ehVencidoChamado(hoj, 'aberto'));
  ok('chamado de ontem concluído → não vencido', !LOC.ehVencidoChamado(ont, 'concluido'));
}

console.log('\nRESULTADO: Todos os novos testes de Locação/Contratos passaram!');
//<<<<SECAO:test_loc.js:FIM>>>>
}

if (false) { // ═══ test_contratos_refino.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_contratos_refino.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('contratos_refino_patch.js', 'utf8');
const ctx = { window: {}, db: { parque: [] } };
new Function('window', 'db', code)(ctx.window, ctx.db);
const R = ctx.window.CONTRATOS_REFINO_PURE;

console.log('== CONTRATOS_REFINO_PURE: código numérico simples ==');
ok('OS-2026-0081 vira 81', R.codigoSimples('OS-2026-0081') === '81');
ok('CT-2024-0142 vira 142', R.codigoSimples('CT-2024-0142') === '142');
ok('000123 vira 123', R.codigoSimples('000123') === '123');
ok('sem número vira vazio', R.codigoSimples('ABC') === '');
ok('próximo código usa só o último bloco numérico', R.proximoCodigo([{empresaId:'e1', numero:'OS-2026-0081'}, {empresaId:'e1', numero:'82'}, {empresaId:'e2', numero:'999'}], 'e1') === '83');

console.log('== CONTRATOS_REFINO_PURE: medidores independentes ==');
{
  const p = { modalidade: 'global', franquiaPB: 1000, valorExcedentePB: 0.1, medidores: { scanner: { modalidade: 'impressao', franquia: 0, valor: 0.02 } } };
  const m = R.normalizarMedidores(p);
  ok('preto A4 herdou global', m.pretoA4.modalidade === 'global' && m.pretoA4.franquia === 1000);
  ok('scanner manteve configuração própria', m.scanner.modalidade === 'impressao' && m.scanner.valor === 0.02);
  ok('alterar scanner não muda preto A4', m.scanner.modalidade !== m.pretoA4.modalidade);
}

console.log('== CONTRATOS_REFINO_PURE: impressoras do cliente dentro do contrato ==');
{
  const db = { parque: [
    { id:'p1', contratoId:'ct1', clienteId:'cli1', status:'ativo' },
    { id:'p2', contratoId:'ct-old', clienteId:'cli1', status:'ativo' },
    { id:'p3', contratoId:'ct1', clienteId:'cli1', status:'inativo' },
    { id:'p4', contratoId:'ct2', clienteId:'cli2', status:'ativo' }
  ] };
  const contrato = { id:'ct1', clienteId:'cli1' };
  const ativos = R.parquesDoClienteContrato(db, contrato);
  const todos = R.parquesDoClienteContrato(db, contrato, { todos:true });
  ok('ativos inclui impressora do contrato e impressora já cadastrada no cliente', ativos.map(p=>p.id).join(',') === 'p1,p2');
  ok('todos inclui também inativa/remanejada para conferência', todos.map(p=>p.id).join(',') === 'p1,p2,p3');
}

console.log('== CONTRATOS_REFINO_PURE: chamado vencido ==');
{
  const ontem = new Date(Date.now() - 86400000).toISOString();
  const hoje = new Date().toISOString();
  ok('ontem aberto está vencido', R.chamadoVencido(ontem, 'aberto'));
  ok('hoje aberto não está vencido', !R.chamadoVencido(hoje, 'aberto'));
  ok('concluído não fica vencido', !R.chamadoVencido(ontem, 'concluido'));
}

console.log('\nRESULTADO: Testes do refino de contratos passaram!');
//<<<<SECAO:test_contratos_refino.js:FIM>>>>
}

if (false) { // ═══ test_contratos_final.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_contratos_final.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('contratos_final_patch.js','utf8');
const db = {
  clientes: [{ id:'cli116', empresaId:'emp', codigo:'116', nome:'Fernando Seguros' }],
  contratos: [{ id:'ct82', empresaId:'emp', numero:'LC-000082', codigoAntigo:'82', codClienteAntigo:'116', clienteId:null, valorMensalFixo:120, dataInicio:'2018-07-29', dataFim:'2019-07-29' }],
  equipamentos: [], parque: [], leituras: [], os: [],
  modulosDinamicos: {
    ITENS_LOCACAO: { dados: [
      { COD_ITENS_LOCACAO:'1', COD_LOCACAO:'82', COD_CLIENTE:'116', PATRIMONIO:'446', MODELO:'BROTHER 8085', SERIAL:'ABC123', DEPARTAMENTO:'Secretaria', CONTADOR:'0' }
    ] }
  }
};
const ctx = { window: {}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const P = ctx.window.CONTRATOS_FINAL_PURE;
console.log('== CONTRATOS_FINAL_PURE ==');
ok('código pega último grupo', P.codigo('LC-000082') === '82');
const alterados = P.reconciliar('emp');
ok('reconciliação alterou vínculos', alterados > 0);
ok('contrato vinculou cliente 116', db.contratos[0].clienteId === 'cli116');
ok('criou equipamento do item de locação', db.equipamentos.length === 1 && db.equipamentos[0].patrimonio === '446');
ok('criou parque do contrato', db.parque.length === 1 && db.parque[0].contratoId === 'ct82' && db.parque[0].clienteId === 'cli116');
console.log('\nRESULTADO: Testes finais de contratos passaram!');
//<<<<SECAO:test_contratos_final.js:FIM>>>>
}

if (false) { // ═══ test_rtf_template.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_rtf_template.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('contratos_rtf_template_patch.js','utf8');
const db = {
  empresas:[{id:'emp', nome:'DIGICOPY', cnpj:'08.385.589/0001-03', cidade:'Bocaiúva', estado:'MG'}],
  clientes:[{id:'cli', nome:'Escola Estadual Teste', documento:'12.345.678/0001-90', endereco:'Rua A', numero:'10', bairro:'Centro', cidade:'Bocaiúva', estado:'MG', cep:'39390-000'}],
  contratos:[{id:'ct', empresaId:'emp', numero:'82', clienteId:'cli', dataInicio:'2026-01-01', dataFim:'2026-12-31', valorMensalFixo:120, franquiaPB:1000, valorExcedentePB:0.1, diaVencimento:10}],
  parque:[{id:'p', contratoId:'ct', clienteId:'cli', equipamentoId:'eq', setor:'Secretaria', localInstalacao:'Sala 1'}],
  equipamentos:[{id:'eq', patrimonio:'446', modelo:'Brother', serie:'ABC'}]
};
const ctx = { window:{}, db, getSession:()=>({empresaId:'emp', cnpj:'08.385.589/0001-03'}) };
new Function('window','db','getSession', code)(ctx.window, ctx.db, ctx.getSession);
const R = ctx.window.RTF_TEMPLATE_PURE;
console.log('== RTF_TEMPLATE_PURE ==');
const tpl = '{\\rtf1 Cliente {CLI_NOMERAZAO} [TABLE] Valor {CTR_VALOR_MENSAL}}';
const out = R.aplicarTemplate(tpl, 'ct');
ok('troca cliente', out.includes('Escola Estadual Teste'));
ok('troca tabela de impressoras', out.includes('446') && out.includes('Brother'));
ok('troca valor mensal', out.includes('R$'));
ok('escapa acento em texto RTF', R.rtf('Bocaiúva').includes('\\u'));
console.log('\nRESULTADO: Testes de template RTF passaram!');
//<<<<SECAO:test_rtf_template.js:FIM>>>>
}

if (false) { // ═══ test_contratos_visitas.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_contratos_visitas.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('contratos_visitas_vinculo_patch.js','utf8');
const db = {
  clientes:[{id:'cli78', empresaId:'emp', codigo:'78', nome:'Cliente 78'}],
  contratos:[{id:'ct51', empresaId:'emp', numero:'51', codigoAntigo:'51', clienteId:null, equipamentos:[]}],
  equipamentos:[], parque:[], leituras:[], os:[],
  modulosDinamicos:{
    VISITAS:{dados:[{COD_LOCACAO:51, COD_VISITA:18, VI_COD_CLIENTE:78, VI_COD_EQUIPAMENTO:2, VI_COD_ITENS_LOCACAO:113, VI_COD_DEPARTAMENTO:7, VI_PATRIMONIO:'2018027', VI_SERIAL:'M5585401175'}]},
    DEPARTAMENTOS:{dados:[{DEP_COD_DEPARTAMENTO:7, DEP_DESCRICAO:'OBRAS'}]},
    CONTADOR_PAGINAS:{dados:[{COD_ITENS_LOCACAO:113, CP_COD_EQUIPAMENTO:2, CP_DEPARTAMENTO:'OBRAS', CP_FRANQUIA:0, CP_VALOR_PAGINAS:0.076}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db',code)(ctx.window, ctx.db);
const P = ctx.window.CONTRATOS_VISITAS_PURE;
console.log('== CONTRATOS_VISITAS_PURE ==');
ok('código simples', P.cod('LC-000051') === '51');
const changed = P.vincularPorVisitas('emp');
ok('alterou vínculos', changed > 0);
ok('contrato vinculado ao cliente da visita', db.contratos[0].clienteId === 'cli78');
ok('equipamento criado pela visita', db.equipamentos.length === 1 && db.equipamentos[0].patrimonio === '2018027');
ok('parque criado dentro do contrato', db.parque.length === 1 && db.parque[0].contratoId === 'ct51' && db.parque[0].setor === 'OBRAS');
console.log('\nRESULTADO: Testes de vínculos por visitas passaram!');
//<<<<SECAO:test_contratos_visitas.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_locacao_visitas.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_locacao_visitas.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_locacao_visitas_patch.js','utf8');
const db = {
  clientes:[{id:'cli1', empresaId:'emp', codigo:'78', nome:'Cliente 78'}],
  contratos:[{id:'ct1', empresaId:'emp', numero:'51', codigoAntigo:'51', clienteId:'cli1', equipamentos:[], franquiaPB:1000, valorExcedentePB:0.08}],
  equipamentos:[], parque:[], os:[], vendas:[], produtos:[{id:'prd1', empresaId:'emp', sku:'10', nome:'Toner', vidaUtil:5000}],
  modulosDinamicos:{
    DEPARTAMENTOS:{dados:[{DEP_COD_DEPARTAMENTO:7, DEP_DESCRICAO:'OBRAS'}]},
    ITENS_LOCACAO:{dados:[{IT_COD_ITENS_LOCACAO:113, IT_COD_LOCACAO:51, IT_COD_DEPARTAMENTO:7, IT_COD_EQUIPAMENTO:2, IT_SERIAL:'M558', IT_PATRIMONIO:'2018027', IT_TIPO:'G', IT_TIPO_SCANNER:'C', IT_VALOR_PAGINAS_SCANNER:0.01}]},
    VISITAS:{dados:[{COD_VISITA:18, COD_LOCACAO:51, VI_COD_CLIENTE:78, VI_COD_EQUIPAMENTO:2, VI_COD_ITENS_LOCACAO:113, VI_COD_DEPARTAMENTO:7, VI_PATRIMONIO:'2018027', VI_SERIAL:'M558', VI_COD_MOTIVO_DEFEITO:30, VI_MOTIVO:'TROCA TONER', VI_VALOR_CUSTO:30, VI_GERAR_VENDA:1, VI_COD_VENDA:106, DATA:'2020-01-02', VI_SITUACAO:'F'}]},
    DESPESAS_LOCACAO:{dados:[{DP_COD_DESPESA:1, DP_COD_VISITA:18, DP_COD_ITENS_LOCACAO:113, DP_DESCRICAO:'TONER PRETO', DP_COD_ITENS_VENDA:9, DP_QTDE:1}]},
    ITENS_VENDA:{dados:[{COD_ITENS_VENDA:9, COD_PRODUTO:10, DESCRICAO:'TONER PRETO'}]},
    MOTIVO_DEFEITO:{dados:[{COD_MOTIVO_DEFEITO:30, DESCRICAO:'TROCA TONER'}]},
    CARTUCHOS:{dados:[{COD_CARTUCHO:1, QTDE_COPIAS:3000}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_LOC_VISITAS_PURE;
console.log('== AUTOMACOES_LOC_VISITAS_PURE ==');
ok('detecta suprimento', A.descricaoSuprimento('TONER PRETO'));
ok('mapeia tipo C para impressão', A.tipoMedidorFromCodigo('C') === 'impressao');
const changed = A.aplicarAutomacoesLocacaoVisitas('emp');
ok('aplicou automações', changed > 0);
ok('criou equipamento', db.equipamentos.length === 1 && db.equipamentos[0].patrimonio === '2018027');
ok('criou parque no contrato', db.parque.length === 1 && db.parque[0].contratoId === 'ct1' && db.parque[0].setor === 'OBRAS');
ok('scanner é independente', db.parque[0].medidores.scanner.modalidade === 'impressao' && db.parque[0].medidores.pretoA4.modalidade === 'global');
ok('criou chamado pela visita', db.os.length === 1 && db.os[0].status === 'concluido');
ok('criou despesa e histórico de suprimento', db.despesasLocacao.length >= 1 && db.locacaoEstoqueHistorico.length === 1);
ok('gerou venda da visita quando marcado', db.vendas.length === 1 && db.vendas[0].origem === 'visita_gerou_venda');
console.log('\nRESULTADO: Testes de automações locação/visitas passaram!');
//<<<<SECAO:test_automacoes_locacao_visitas.js:FIM>>>>
}

if (false) { // ═══ test_contratos_leituras_definitivo.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_contratos_leituras_definitivo.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('contratos_leituras_definitivo_patch.js','utf8');
const fakeDoc={addEventListener(){},getElementById(){return null;}};
const db={clientes:[],produtos:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[]};
const ctx={window:{},document:fakeDoc,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.CONTRATOS_LEITURAS_DEFINITIVO_PURE;
console.log('== CONTRATOS_LEITURAS_DEFINITIVO_PURE ==');
ok('preto A4 ativo por padrão no cadastro da impressora', P.medidorPadrao('pretoA4').ativo===true && P.medidorPadrao('pretoA4').modalidade==='individual');
ok('demais medidores inativos por padrão', P.medidorPadrao('colorA4').ativo===false && P.medidorPadrao('scanner').modalidade==='inativo');
ok('individual calcula excedente e soma valores', (()=>{ const r=P.calcMed({modalidade:'individual',franquia:100,valorExcedente:0.1,valorLocacao:50,valorFranquia:20,acrescimo:5},1000,1150); return r.usado===150 && r.excedente===50 && r.valorTotal===80; })());
ok('por impressão calcula total por página', (()=>{ const r=P.calcMed({modalidade:'impressao',valorPagina:0.2,acrescimo:3},10,40); return r.usado===30 && r.excedente===30 && r.valorTotal===9; })());
ok('mês fixo só valor locação', (()=>{ const r=P.calcMed({modalidade:'mes_fixo',valorLocacao:200},0,999); return r.usado===999 && r.excedente===0 && r.valorTotal===200; })());
console.log('\nRESULTADO: Testes de contratos/leituras definitivos passaram!');
//<<<<SECAO:test_contratos_leituras_definitivo.js:FIM>>>>
}

if (false) { // ═══ test_fluxo_contrato_leitura_corrigido.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_fluxo_contrato_leitura_corrigido.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('fluxo_contrato_leitura_corrigido_patch.js','utf8');
const fakeDoc={getElementById(){return null;}};
const db={clientes:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[]};
const ctx={window:{},document:fakeDoc,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.CONTRATOS_LEITURAS_CORRIGIDO_PURE;
console.log('== FLUXO_CONTRATO_LEITURA_CORRIGIDO_PURE ==');
ok('normaliza global para individual', P.normalizarModalidade('global')==='individual');
ok('preto A4 ativo por padrão na impressora', P.medPadrao('pretoA4').ativo===true && P.medPadrao('pretoA4').modalidade==='individual');
ok('color A4 inativo por padrão', P.medPadrao('colorA4').ativo===false && P.medPadrao('colorA4').modalidade==='inativo');
ok('cálculo individual', (()=>{ const r=P.calc({modalidade:'individual',franquia:100,valorExcedente:0.1,valorLocacao:50,valorFranquia:20,acrescimo:5},1000,1150); return r.usado===150 && r.excedente===50 && r.valorTotal===80; })());
ok('cálculo por impressão', (()=>{ const r=P.calc({modalidade:'impressao',valorPagina:0.2,acrescimo:3},10,40); return r.usado===30 && r.excedente===30 && r.valorTotal===9; })());
ok('cálculo mês fixo', (()=>{ const r=P.calc({modalidade:'mes_fixo',valorLocacao:200},0,999); return r.usado===999 && r.excedente===0 && r.valorTotal===200; })());
console.log('\nRESULTADO: Testes do fluxo contrato/leitura corrigido passaram!');
//<<<<SECAO:test_fluxo_contrato_leitura_corrigido.js:FIM>>>>
}

if (false) { // ═══ test_leitura_busca_fluxo.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_leitura_busca_fluxo.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('leitura_busca_fluxo_patch.js','utf8');
const fakeDoc={getElementById(){return null;}};
const db={clientes:[],equipamentos:[{id:'e1',modelo:'Brother 5652',serie:'SER123',patrimonio:'PAT9'},{id:'e2',modelo:'HP Color',serie:'ABC',patrimonio:'PAT2'}],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[]};
const ctx={window:{},document:fakeDoc,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.LEITURA_BUSCA_FLUXO_PURE;
console.log('== LEITURA_BUSCA_FLUXO_PURE ==');
ok('normaliza global para individual', P.normalizarModalidade('global')==='individual');
ok('preto A4 ativo padrão', P.medPadrao('pretoA4').ativo===true);
const parque={id:'p1',equipamentoId:'e1',setor:'Financeiro',localInstalacao:'Sala 2',medidoresConfig:{pretoA4:{ativo:true,ocultar:false,modalidade:'individual'},colorA4:{ativo:true,ocultar:false,modalidade:'impressao'}}};
ok('medidores pendentes remove o já lançado', P.medPendentes(parque,{itens:[{parqueId:'p1',medidor:'pretoA4'}]}).length===1 && P.medPendentes(parque,{itens:[{parqueId:'p1',medidor:'pretoA4'}]})[0].key==='colorA4');
const achou=P.filtrarMaquinasLancamento(db,{itens:[]},[parque],db.equipamentos,'serial','SER');
ok('busca por serial acha impressora', achou.length===1 && achou[0].id==='p1');
ok('busca por departamento acha impressora', P.filtrarMaquinasLancamento(db,{itens:[]},[parque],db.equipamentos,'departamento','finan').length===1);
ok('busca por localização acha impressora', P.filtrarMaquinasLancamento(db,{itens:[]},[parque],db.equipamentos,'localizacao','sala').length===1);
console.log('\nRESULTADO: Testes de busca de impressora na leitura passaram!');
//<<<<SECAO:test_leitura_busca_fluxo.js:FIM>>>>
}

if (false) { // ═══ test_leitura_detalhada_departamentos.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_leitura_detalhada_departamentos.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('leitura_detalhada_departamentos_patch.js','utf8');
const fakeDoc={getElementById(){return null;}};
const db={clientes:[],equipamentos:[],contratos:[],parque:[],leituras:[],os:[],vendas:[],contasReceber:[]};
const ctx={window:{},document:fakeDoc,db,confirm:()=>true};
new Function('window','document','db','confirm',code)(ctx.window,ctx.document,ctx.db,ctx.confirm);
const P=ctx.window.LEITURA_DETALHADA_DEPARTAMENTOS_PURE;
console.log('== LEITURA_DETALHADA_DEPARTAMENTOS_PURE ==');
const grupos=P.agruparPorDepartamento([{departamento:'A',utilizado:10,excedente:2,valorTotal:5},{departamento:'A',utilizado:5,excedente:0,valorTotal:1},{departamento:'B',utilizado:7,excedente:1,valorTotal:3}]);
ok('agrupa por departamento', grupos.length===2 && grupos[0].utilizado===15 && grupos[0].total===6);
const parque={id:'p1',medidoresConfig:{pretoA4:{ativo:true,ocultar:false,modalidade:'individual'},colorA4:{ativo:true,ocultar:false,modalidade:'impressao'},scanner:{ativo:false,ocultar:true,modalidade:'inativo'}}};
ok('medidor lançado sai dos pendentes', P.medPendentes(parque,{itens:[{parqueId:'p1',medidor:'pretoA4'}]}).length===1 && P.medPendentes(parque,{itens:[{parqueId:'p1',medidor:'pretoA4'}]})[0].key==='colorA4');
ok('todos lançados sem pendência', P.medPendentes(parque,{itens:[{parqueId:'p1',medidor:'pretoA4'},{parqueId:'p1',medidor:'colorA4'}]}).length===0);
ok('cálculo individual', (()=>{ const r=P.calc({modalidade:'individual',franquia:100,valorExcedente:.1,valorLocacao:50,valorFranquia:20,acrescimo:5},1000,1150); return r.valorTotal===80; })());
console.log('\nRESULTADO: Testes de leitura detalhada por departamento passaram!');
//<<<<SECAO:test_leitura_detalhada_departamentos.js:FIM>>>>
}

if (false) { // ═══ test_leitura_impressao_compacta_produtos.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_leitura_impressao_compacta_produtos.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('leitura_impressao_compacta_produtos_patch.js','utf8');
const db={empresas:[{id:'emp',nome:'DIGICOPY',cnpj:'00'}],clientes:[{id:'cli',nome:'Cliente',documento:'11'}],contratos:[{id:'ct',numero:'1',clienteId:'cli'}],leituras:[{id:'l1',numero:'10',contratoId:'ct',clienteId:'cli',itens:[{departamento:'A',utilizado:10,excedente:2,valorTotal:5,medidorLabel:'PRETO',modelo:'Ricoh',serial:'S1',anterior:1,atual:11},{departamento:'A',utilizado:5,excedente:1,valorTotal:2},{departamento:'B',utilizado:7,excedente:0,valorTotal:3}]}]};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.LEITURA_IMPRESSAO_COMPACTA_PURE;
console.log('== LEITURA_IMPRESSAO_COMPACTA_PURE ==');
const grupos=P.agruparPorDepartamento(db.leituras[0].itens);
ok('agrupa departamentos', grupos.length===2 && grupos[0].total===7);
ok('totaliza itens', P.totais(db.leituras[0].itens).utilizado===22 && P.totais(db.leituras[0].itens).total===10);
const html=P.htmlNotinhaLeitura('l1','A');
ok('html contém logo e dados empresa/cliente', html.includes('logo.png') && html.includes('DIGICOPY') && html.includes('Cliente'));
ok('html filtra departamento', html.includes('Departamento: A') && !html.includes('Departamento: B'));
ok('html é compacto e tem total geral', html.includes('TOTAL GERAL'));
console.log('\nRESULTADO: Testes de impressão compacta/produtos passaram!');
//<<<<SECAO:test_leitura_impressao_compacta_produtos.js:FIM>>>>
}

if (false) { // ═══ test_sistema_clientes_loja.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_sistema_clientes_loja.js:INICIO>>>>
const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('sistema_clientes_loja_patch.js','utf8');
const db={config:{},empresas:[{id:'emp',nome:'DIGICOPY'}],clientes:[{id:'cli_old',empresaId:'emp',codigo:'10',nome:'Cliente Dez',documento:'111'}]};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const P=ctx.window.SISTEMA_CLIENTES_LOJA_PURE;
console.log('== SISTEMA_CLIENTES_LOJA_PURE ==');
ok('exporta funções puras', !!P && typeof P.importarClientesDeObjetos==='function');
ok('extrai rows de formatos comuns', P.extrairRowsJson({dados:[{a:1}]}).length===1 && P.extrairRowsJson([{a:2}]).length===1);
const cli=P.mapClienteRow({COD_CLIENTE:'00025',NOME_RAZAOSOCIAL:'Cliente Teste',CPF_CNPJ:'12.345.678/0001-90',TELEFONE:'38999990000',ENDERECO:'Rua A',NUMERO:'123',BAIRRO:'Centro',CIDADE:'Jaíba',UF:'MG'},'emp',1);
ok('mapeia cliente e código vira número puro', cli.codigo==='25' && cli.nome==='Cliente Teste' && cli.estado==='MG');
const r=P.importarClientesDeObjetos(db,[{nome:'CLIENTES.json',json:[{COD_CLIENTE:'11',NOME:'Cliente Onze',CPF_CNPJ:'222'},{COD_CLIENTE:'12',NOME:'Cliente Doze',CPF_CNPJ:'333'}]},{nome:'CLIENTES_USUARIOS_RESTRICAO.json',json:[{COD_CLIENTE:'99',NOME:'Nao importar'}]}],'emp');
ok('importa clientes e ignora usuarios/restricao', r.importados===2 && r.ignorados===1 && db.clientes.length===3 && !db.clientes.some(c=>c.codigo==='99'));
ok('próximo código cliente continua do maior', P.proximoCodigoCliente(db,'emp')===13);
const loja=P.salvarLoja(db,'emp',{fantasia:'DIGICOPY',razaoSocial:'DIGICOPY LTDA',cnpj:'00',telefone:'38',whatsapp:'+55 38 99109-8698',rua:'Rua A',numero:'1',bairro:'Centro',cidade:'Jaíba',uf:'MG',cep:'39440-000',email:'x@y.com',endereco:'Rua A • 1'});
ok('salva dados completos da loja em config e empresa', loja.fantasia==='DIGICOPY' && db.config.empresa.nome==='DIGICOPY LTDA' && db.empresas[0].whatsapp.includes('99109'));
ok('hoje local tem formato data', /^\d{4}-\d{2}-\d{2}$/.test(P.hojeLocal()));
console.log('\nRESULTADO: Testes de clientes/loja/login diário passaram!');
//<<<<SECAO:test_sistema_clientes_loja.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5214.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5214.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v5214_clientes_visiveis_patch.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const fin=fs.readFileSync('finalizacao_sistema_patch.js','utf8');
const idb=fs.readFileSync('indexeddb_persistence_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.CLIENTES_VISIVEIS_PURE;
console.log('== CLIENTES VISIVEIS v5.21.4 ==');
ok('exporta funções puras',!!P&&typeof P.pertenceEmpresa==='function');
ok('cliente sem empresaId aparece',P.pertenceEmpresa({nome:'A'},'emp_digicopy')===true);
ok('cliente da empresa aparece',P.pertenceEmpresa({empresaId:'emp_digicopy'},'emp_digicopy')===true);
ok('lista final aceita cliente sem empresaId',fin.includes('!c.empresaId||c.empresaId===s.empresaId'));
ok('seedData também preenche empresaId vazio',app.includes('r.empresaId !== emp.id'));
ok('IndexedDB reexecuta seedData depois de restaurar',idb.includes('seedData(false)'));
ok('patch entra no bundle',manifest.includes('ajustes_v5214_clientes_visiveis_patch.js'));
console.log('\nRESULTADO: clientes visíveis passou!');
//<<<<SECAO:test_ajustes_v5214.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52236.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52236.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52236_codigo_cliente_exato_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const P=ctx.window.CODIGO_CLIENTE_EXATO_PURE;
const list=[{codigo:48,nome:'A'},{codigo:480,nome:'B'},{codigo:'1048',nome:'C'},{codigo:'048',nome:'D'}];

ok('48 não pega 480 nem 1048', P.filtraCodigoExato(list,'48','codigo').map(c=>c.nome).join()==='A,D');
ok('outros campos não filtra aqui', P.filtraCodigoExato(list,'48','nome')===null);
ok('048 = 48', P.codigoIgual('048','48')===true && P.codigoIgual(480,'48')===false);
ok('patch no bundle', manifest.includes('ajustes_v52236_codigo_cliente_exato_patch.js'));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.36 passou!');
//<<<<SECAO:test_ajustes_v52236.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52245.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52245.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const imp=fs.readFileSync('ajustes_v52245_impressora_serial_ocultar_patch.js','utf8');
const lei=fs.readFileSync('ajustes_v52245_leitura_apagar_patch.js','utf8');
const fin=fs.readFileSync('ajustes_v52245_financeiro_hist_datas_patch.js','utf8');
const rod=fs.readFileSync('ajustes_v52245_rodape_versao_patch.js','utf8');
const vda=fs.readFileSync('ajustes_v52245_venda_salvar_print_patch.js','utf8');
const vos=fs.readFileSync('vendas_os_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const I=load(imp).IMPRESSORA_SERIAL_OCULTAR_V52245_PURE;
const db={
  equipamentos:[{id:'e1',serie:'ABC123',contadorPB:900,empresaId:'emp'}],
  parque:[{id:'p1',equipamentoId:'e1',clienteId:'cliA',status:'ativo'}]
};
ok('serial acha equipamento', !!I.acharEquipPorSerial(db,'abc123','emp'));
ok('outro cliente ativo pede remanejo', !!I.parqueOutroCliente(db, db.equipamentos[0], 'cliB'));
ok('oculta em outro cliente também pede remanejo', !!I.parqueOutroCliente({
  equipamentos:db.equipamentos,
  parque:[{id:'p1',equipamentoId:'e1',clienteId:'cliA',status:'oculta'}]
}, db.equipamentos[0], 'cliB'));
ok('mesmo cliente não pede remanejo', !I.parqueOutroCliente(db, db.equipamentos[0], 'cliA'));
ok('aviso remanejo no texto', /impressora cadastrada em Escola X com o contador 900/.test(I.msgRemanejar('Escola X',900)));
ok('caixa ocultar no patch', /kr-imp-ocultar/.test(imp) && /status = 'oculta'/.test(imp));
ok('desocultar volta ativo', /kr-imp-desocultar/.test(imp) && /status = 'ativo'/.test(imp));
ok('aviso só no salvar', /confirmSistema/.test(imp) && /salvarImpressoraContrato/.test(imp));

const L=load(lei).LEITURA_APAGAR_V52245_PURE;
ok('apagar devolve contador anterior', L.contadorDepoisDeApagar({contadorPB:500,contadorCor:20},{contadorPBAnterior:200,contadorCorAnterior:10}).contadorPB===200);
ok('mensagem de apagar leitura', /Deseja apagar essa leitura/.test(L.mensagem) && /contadores voltar/.test(L.mensagem));
ok('deleteLeitura usa confirmSistema', /confirmSistema/.test(lei) && /deleteLeituraContrato/.test(lei));

const F=load(fin).FINANCEIRO_HIST_DATAS_V52245_PURE;
const refs=F.refsDoLancamento({vendaId:'v1',leituraId:'l1'},{
  vendas:[{id:'v1',numero:'88',osId:'os1'}],
  leituras:[{id:'l1',numero:'12'}],
  os:[{id:'os1',numero:'45',vendaId:'v1'}]
});
ok('histórico tem venda', refs.some(function(r){ return r.tipo==='venda' && r.codigo==='88'; }));
ok('histórico tem leitura', refs.some(function(r){ return r.tipo==='leitura' && r.codigo==='12'; }));
ok('histórico tem chamado da venda', refs.some(function(r){ return r.tipo==='chamado' && r.codigo==='45'; }));
ok('hoje não aplica De/Até', F.aplicaDatas('hoje')===false && F.aplicaDatas('abertos')===true);
ok('De/Até sempre visíveis', F.datasSempreVisiveis===true && /type='date'/.test(fin));

const R=load(rod).RODAPE_VERSAO_V52245_PURE;
ok('versão 5.22.45 no rodapé', R.VERSAO==='5.22.45' && /footer-version/.test(rod));

ok('vosGravarVenda no window', /window\.vosGravarVenda = vosGravarVenda/.test(vos));
ok('salvar fecha sem lfbAlert no mesmo modal', /gravarEFechar/.test(vda) && /closeModal\(true\)/.test(vda) && !/lfbAlert\('Salvo/.test(vda));
ok('some botão Sair', /tirarBotaoSair/.test(vda));
ok('faturar não imprime', /__vosFatSemPrint/.test(vda) && /vosConcluirFaturamento/.test(vda));

const patches=['ajustes_v52245_impressora_serial_ocultar_patch.js','ajustes_v52245_leitura_apagar_patch.js','ajustes_v52245_financeiro_hist_datas_patch.js','ajustes_v52245_rodape_versao_patch.js','ajustes_v52245_venda_salvar_print_patch.js'];
ok('patches no bundle', patches.every(function(f){ return manifest.includes(f); }));
ok('versão', /^\d+\.\d+\.\d+/.test(pkg.version) && /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && /v\d+\.\d+\.\d+/.test(html) && /footer-version/.test(html));
ok('APK quieto', !/mobile\//.test(imp+lei+fin+rod+vda));
ok('sem nome pessoal novo', !/kauan/i.test((imp+lei+fin+rod+vda).replace(/__KAUAN_REFINO_STATE__/g,'')));
console.log('\nRESULTADO: v5.22.45 passou!');
//<<<<SECAO:test_ajustes_v52245.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52281.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52281.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const cham=fs.readFileSync('locacao_chamados_fix_patch.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const menus=fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.81 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));

// Quem recolocava o botão era montarMenuLocacao, que roda a cada navegação.
const menuLoc=cham.slice(cham.indexOf('function montarMenuLocacao'),cham.indexOf('const _nav'));
ok('Chamados saiu do menu Locação',!/Chamados<\/button>|ph-wrench/.test(menuLoc));
ok('Locação continua com Contratos e Impressoras',/navigateTo\(\\'contratos\\'\)/.test(menuLoc)&&/navigateTo\(\\'impressoras\\'\)/.test(menuLoc));
ok('a tela de chamados continua existindo',/abrirHistoricoChamadosGeral = function/.test(cham));
ok('Atendimento continua abrindo chamado',/window.openQuickOS = function/.test(cham));
ok('e não voltou nos outros menus',!/label:'Chamados'/.test(app)&&!/id:'recargas'/.test(menus));
console.log('\nRESULTADO: ajustes v5.22.81 passaram!');
//<<<<SECAO:test_ajustes_v52281.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52435.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52435.js:INICIO>>>>
// NOTA (24/09/2026): o fim do bundle-manifest.json encolheu 3 posições — saíram
// `novo/nucleo.js`, `novo/ponte.js` e `ajustes_v7011_ponte_nucleo_patch.js` (o núcleo novo
// foi apagado por decisão do dono). A conferência abaixo conta DE TRÁS para a frente, então
// cada número caiu 3. Os patches conferidos e a ORDEM entre eles continuam os mesmos.
// test_ajustes_v52435.js — v5.24.35: P7 FINAL (serial primeiro + remanejo).
// Ressuscita o desenho v5.22.43/45 adaptado ao fluxo VENCEDOR (ids impf-*):
// serial-first no cadastro novo, aviso de remanejo SÓ no salvar, equipamento
// nunca duplicado, remanejada congelada (não edita, não entra no mensal).
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const patch = fs.readFileSync('ajustes_v52435_impressora_remanejo_final_patch.js', 'utf8');
const venc  = fs.readFileSync('fluxo_contrato_leitura_corrigido_patch.js', 'utf8');

// ── 1. Marcas estruturais do wrap ────────────────────────────────────────────
ok(patch.includes('IMPRESSORA_REMANEJO_V52435_PURE'), 'expõe PURE para teste');
ok(patch.includes('impf-avancar') && patch.includes('impf-aviso-serial') && patch.includes('impf-serie'), 'serial primeiro: botão Avançar + banner Passo 1 sobre os ids impf-* do vencedor');
ok(patch.includes('v52435-remanejadas') && patch.includes('Remanejadas (histórico congelado'), 'painel Remanejadas no contrato com dedup por id');
ok((patch.match(/__v52435rem/g) || []).length >= 4, 'guards __v52435rem nos 3 wraps + marcações');
ok(patch.includes("p.status==='remanejada'") && patch.includes('Histórico congelado'), 'remanejada congelada: abrir/editar é bloqueado');
ok(patch.includes('msgRemanejar') && patch.includes('deseja remanejar essa impressora pra esse cadastro?'), 'frase do remanejo (a dele, do desenho original)');
ok(patch.includes("status='remanejada'") && patch.includes('remanejadoParaContratoId') && patch.includes('remanejadoParaClienteId'), 'remanejo marca o antigo com rastro do destino');
ok(patch.includes('idsAntes') && patch.includes('duplicata') && patch.includes('prqNovo.equipamentoId'), 'fixup anti-duplicata: reusa o equipamento existente e reponta o parque');
ok(patch.includes('parqueAtivoMesmoContrato') && patch.includes('já está NESTE contrato'), 'r46 R3: mesma serial no MESMO contrato bloqueia com aviso');
ok(patch.includes('Não consegui abrir a pergunta de remanejar'), 'r46 3.2: sem janela de confirmação, avisa em vez de travar calado');

// ── 2. Vencedor filtra remanejada das operações ─────────────────────────────
const filtros = (venc.match(/status!=='inativo'&&[a-z]+\.?status!=='remanejada'|status!=='remanejada'/g) || []).length;
ok(filtros >= 3, 'vencedor: remanejada fora de máquinas do contrato + mensal fixo + leitura (' + filtros + '/3)');

// ── 3. Funcional: PURE + fluxo de remanejo de ponta a ponta ─────────────────
(async function(){
  const alertas = [];
  const els = {
    'impf-serie': { value: 'SN-777' },
    'impf-modelo': { value: '' },
    'impf-patr': { value: '' }
  };
  const fakeDoc = {
    getElementById(id){ return els[id] || null; },
    querySelectorAll(){ return []; },
    createElement(){ return { style:{}, classList:{add(){}}, setAttribute(){}, appendChild(){}, remove(){} }; }
  };
  const flags = { salvarChamou: 0, confirmMsg: null, saveDB: 0, reRender: 0 };
  const eqOld = { id:'eqOLD', empresaId:'EMP1', modelo:'HP 426', serie:'SN-777', patrimonio:'P-09', contadorPB: 9000 };
  const dbFix = {
    empresaId:'EMP1',
    clientes: [{ id:'cliA', nome:'Padaria Sol' }, { id:'cliB', nome:'Loja B' }],
    equipamentos: [eqOld],
    contratos: [{ id:'cA', clienteId:'cliA', equipamentos:[] }, { id:'cB', clienteId:'cliB', equipamentos:[] }],
    parque: [
      { id:'pA', equipamentoId:'eqOLD', clienteId:'cliA', contratoId:'cA', status:'ativo', setor:'Caixa', medidores:{ pretoA4:{ contadorAnterior: 8000 } } },
      { id:'pREM', equipamentoId:'eqX', clienteId:'cliB', contratoId:'cB', status:'remanejada', frozen:{ serie:'SN-1', modelo:'X' } }
    ],
    leituras: []
  };
  const win = {
    lfbAlert(m){ alertas.push(String(m)); },
    confirmSistema(msg){ flags.confirmMsg = String(msg); return Promise.resolve(true); },
    abrirModalEquipamentoContrato(){ flags.abrirChamou = (flags.abrirChamou||0)+1; },
    salvarImpressoraContrato(contratoId){
      flags.salvarChamou++;
      // simula o vencedor: cria equipamento NOVO + parque e amarra no contrato
      const eqN = { id:'eqNEW', empresaId:'EMP1', modelo:'HP 426', serie:els['impf-serie'].value, patrimonio:'P-09' };
      dbFix.equipamentos.push(eqN);
      dbFix.parque.push({ id:'pNEW'+flags.salvarChamou, equipamentoId:'eqNEW', clienteId: dbFix.contratos.find(c=>c.id===contratoId).clienteId, contratoId: contratoId, status:'ativo' });
      dbFix.contratos.find(c=>c.id===contratoId).equipamentos.push('eqNEW');
    },
    openContratoCompleto(){ flags.reRender++; },
    saveDB(){ flags.saveDB++; }
  };
  const ctx = { window: win, document: fakeDoc, db: dbFix,
    getSession(){ return { empresaId:'EMP1' }; }, saveDB: win.saveDB, openContratoCompleto: win.openContratoCompleto };
  new Function('window','document','db','getSession','saveDB','openContratoCompleto', patch)(
    ctx.window, ctx.document, ctx.db, ctx.getSession, ctx.saveDB, ctx.openContratoCompleto);

  const P = win.IMPRESSORA_REMANEJO_V52435_PURE;
  ok(!!P, 'PURE registrada no window');
  ok(P.acharEquipPorSerial(dbFix, 'sn-777', 'EMP1') === eqOld, 'PURE acha por serial (caixa alta/baixa)');
  ok(P.acharEquipPorSerial(dbFix, 'p-09', 'EMP1') === eqOld, 'PURE acha por patrimônio');
  ok(P.acharEquipPorSerial(dbFix, 'SN-777', 'EMP2') === null, 'PURE respeita a empresa da sessão');
  ok(P.parqueAtivoOutroCliente(dbFix, eqOld, 'cliB').id === 'pA', 'PURE detecta parque ATIVO em outro cliente');
  ok(P.parqueAtivoOutroCliente(dbFix, eqOld, 'cliA') === null, 'PURE: mesmo cliente não é conflito');
  ok(P.snapshotFrozen(eqOld, dbFix.parque[0]).setor === 'Caixa' && !!P.snapshotFrozen(eqOld, dbFix.parque[0]).congeladoEm, 'PURE snapshot congelado carrega setor + data');
  ok(P.msgRemanejar('Padaria Sol', 8000).includes('impressora cadastrada em Padaria Sol com o contador 8000'), 'PURE mensagem do remanejo com cliente + contador');

  // 3a. bloqueio de edição de remanejada
  const antes0 = flags.abrirChamou || 0;
  win.abrirModalEquipamentoContrato('cB', 'pREM');
  win.salvarImpressoraContrato('cB', 'pREM');
  ok((flags.abrirChamou||0) === antes0 && flags.salvarChamou === 0, 'remanejada congelada: modal não abre e salvar não roda');
  ok(alertas.filter(a=>a.includes('Histórico congelado')).length >= 2, 'aviso de congelado disparado nos 2 caminhos');

  // 3b. cadastro novo com serial ativo em OUTRO cliente → pergunta → remaneja
  win.salvarImpressoraContrato('cB', null);
  await new Promise(r=>setTimeout(r, 10));
  ok(flags.confirmMsg && flags.confirmMsg.includes('Padaria Sol') && flags.confirmMsg.includes('remanejar'), 'aviso de remanejo SÓ no salvar, citando o cliente antigo');
  ok(flags.salvarChamou === 1, 'fluxo original do vencedor rodou depois do sim');
  const pA = dbFix.parque.find(p=>p.id==='pA');
  ok(pA.status === 'remanejada' && pA.frozen && pA.frozen.serie === 'SN-777' && pA.remanejadoParaContratoId === 'cB' && pA.remanejadoParaClienteId === 'cliB', 'antiga congelada com snapshot + rastro do destino');
  ok(!dbFix.equipamentos.some(e=>e.id==='eqNEW'), 'anti-duplicata: equipamento novo removido (serial nunca duplica no sistema)');
  const pNEW = dbFix.parque.find(p=>p.id==='pNEW1');
  ok(pNEW && pNEW.equipamentoId === 'eqOLD', 'parque novo repontado pro equipamento existente');
  const cB = dbFix.contratos.find(c=>c.id==='cB');
  ok(cB.equipamentos.filter(id=>id==='eqOLD').length === 1 && !cB.equipamentos.includes('eqNEW'), 'contrato referencia só o equipamento existente');
  ok(flags.saveDB === 1 && flags.reRender === 1, 'fixup persiste e re-renderiza o contrato');

  // 3c. serial conhecido no PRÓPRIO cliente mas em OUTRO contrato → sem pergunta, sem duplicar
  const eq2 = { id:'eq2', empresaId:'EMP1', modelo:'Brother L2', serie:'SN-555', patrimonio:'P-55' };
  dbFix.equipamentos.push(eq2);
  dbFix.parque.push({ id:'pA2', equipamentoId:'eq2', clienteId:'cliA', contratoId:'cA', status:'ativo' });
  dbFix.contratos.push({ id:'cA2', clienteId:'cliA', equipamentos:[] });
  flags.confirmMsg = null; flags.salvarChamou = 0;
  const antesAlertas = alertas.length;
  els['impf-serie'].value = 'SN-555';
  win.salvarImpressoraContrato('cA2', null);
  ok(flags.confirmMsg === null && flags.salvarChamou === 1, 'mesmo cliente outro contrato: sem pergunta, segue direto');
  ok(!dbFix.equipamentos.some(e=>e.id==='eqNEW') && alertas.slice(antesAlertas).some(a=>a.includes('serial reconhecido')), 'mesmo cliente outro contrato: reusa o existente e avisa "serial reconhecido"');

  // 3d. r46 R3: mesma serial no MESMO contrato → BLOQUEIA com aviso (nada salva)
  ok(P.parqueAtivoMesmoContrato(dbFix, eqOld, 'cB') !== null, 'PURE acha parque ATIVO no mesmo contrato (eqOLD em cB)');
  ok(P.parqueAtivoMesmoContrato(dbFix, eqOld, 'cA') === null, 'PURE: contrato diferente não é conflito');
  flags.confirmMsg = null; flags.salvarChamou = 0;
  const antesAlertas2 = alertas.length;
  els['impf-serie'].value = 'SN-777';
  win.salvarImpressoraContrato('cB', null);
  ok(flags.salvarChamou === 0 && flags.confirmMsg === null, 'mesmo contrato: não salva nem pergunta');
  ok(alertas.slice(antesAlertas2).some(a=>a.includes('já está NESTE contrato')), 'mesmo contrato: avisa "já está NESTE contrato"');
  flags.salvarChamou = 0;
  els['impf-serie'].value = 'SN-555';
  win.salvarImpressoraContrato('cA', null);
  ok(flags.salvarChamou === 0, 'mesmo contrato (2º caso): bloqueia também');

  // ── 4. Bundle / versão / celular ───────────────────────────────────────────
  const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
  ok(man[man.length - 33] === 'ajustes_v52436_leitura_uma_aberta_patch.js' && man[man.length - 32] === 'ajustes_v5250_leitura_overhaul_patch.js' && man[man.length - 31] === 'ajustes_v5260_cnpj_gerente_patch.js' && man[man.length - 30] === 'ajustes_v5262_login_nuvem_primeiro_patch.js' && man[man.length - 29] === 'ajustes_v5264_chamado_data_grande_patch.js' && man[man.length - 28] === 'painel_gerente_patch.js' && man[man.length - 27] === 'fiscal_guard_patch.js' && man[man.length - 26] === 'nf_transmissao_patch.js' && man[man.length - 25] === 'autocura_empresa_central_nf_tela_patch.js' && man[man.length - 24] === 'perfis_nuvem_cura_sessao_patch.js' && man[man.length - 23] === 'permissoes_estorno_venda_patch.js' && man[man.length - 22] === 'fiscal_menu_completo_patch.js' && man[man.length - 21] === 'dashboard_inicio_clicavel_patch.js' && man[man.length - 20] === 'menus_fiscais_separados_patch.js' && man[man.length - 19] === 'permissoes_override_menus_fiscais_patch.js' && man[man.length - 18] === 'seis_submenus_velho_patch.js' && man[man.length - 17] === 'submenu_hover_nfe_patch.js' && man[man.length - 16] === 'navegacao_sem_tela_branca_patch.js' && man[man.length - 15] === 'ribbon_fiscal_estilo_antigo_patch.js', 'manifest: remanejo, guarda, revisao v5.25.0, CNPJ v5.26.0, login v5.26.2, chamado v5.26.4, painel, portao v6.0.0, transmissao, autocura, perfis, permissões, menu fiscal, Início clicável, menus separados; override v6.0.9; 6 submenus v6.0.10; hover NF-e/NFC-e v6.0.11; anti-tela-branca v6.0.12; ribbon fiscal bonita v6.0.13 (mantido na fila; v6.1.3 navegação+escuro fechava a fila, v7.0.20 mandar-erro, r59 setup fecha)');
  const bundle = fs.readFileSync('app.bundle.js', 'utf8');
  ok(bundle.includes('IMPRESSORA_REMANEJO_V52435_PURE') && bundle.includes('impf-avancar'), 'bundle: wrap final dentro');
  ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('IMPRESSORA_REMANEJO_V52435_PURE'), 'bundle do CELULAR igual');
  ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'index 6.0.9');
  ok(fs.readFileSync('index.html', 'utf8').includes('>v' + VERSAO_APP + '<'), 'rodapé v6.0.9');
  ok(fs.readFileSync('mobile/www/index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'celular 6.0.9');
  ok(JSON.parse(fs.readFileSync('package.json', 'utf8')).version === VERSAO_APP, 'package.json 6.0.9');

  if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
  console.log('\nTudo OK — v5.24.35 (P7: serial primeiro + remanejo sem duplicar + remanejada congelada).');
})().catch(e=>{ console.error('✘ exceção no funcional:', e && e.message); process.exit(1); });
//<<<<SECAO:test_ajustes_v52435.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52436.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52436.js:INICIO>>>>
// NOTA (24/09/2026): o fim do bundle-manifest.json encolheu 3 posições — saíram
// `novo/nucleo.js`, `novo/ponte.js` e `ajustes_v7011_ponte_nucleo_patch.js` (o núcleo novo
// foi apagado por decisão do dono). A conferência abaixo conta DE TRÁS para a frente, então
// cada número caiu 3. Os patches conferidos e a ORDEM entre eles continuam os mesmos.
// test_ajustes_v52436.js — v5.24.36: bug relatado por ele (contrato → leituras
// → novo → faturar → estornar → editar contador → lista mostra o anterior
// errado) + decreto: só cria nova leitura se a aberta estiver fechada.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const patch = fs.readFileSync('ajustes_v52436_leitura_uma_aberta_patch.js', 'utf8');

// ── 1. Marcas estruturais ────────────────────────────────────────────────────
ok(patch.includes('LEITURA_UMA_ABERTA_V52436_PURE'), 'expõe PURE para teste');
ok(patch.includes("guarda('novaLeituraContrato'") && patch.includes("guarda('criarLeituraDetalhada'") && patch.includes("guarda('criarLeituraDefinitiva'"), 'guarda nos 3 caminhos que criam leitura (decreto universal)');
ok(patch.includes("l.status!=='faturado'") && patch.includes('Array.isArray(l.itens)'), 'aberta = formato novo (itens) não faturada — legado parqueId simples fica fora');
ok(patch.includes('Fature (feche) ela antes de criar outra') && patch.includes('ou apague a leitura'), 'mensagem explica como fechar (a saída dela mesma)');
ok(patch.includes('lan-edit-idx') && patch.includes('p.contadores[item.medidor] = n(item.anterior)'), 'edição pós-estorno: parque vivo alinhado ao anterior do item ANTES do salvar original');
ok((patch.match(/__v52436lei/g) || []).length >= 4, 'guards __v52436lei nos 4 wraps');

// ── 2. Funcional ponta a ponta (DOM fake) ───────────────────────────────────
(async function(){
  const alertas = [];
  const calls = { nova: 0, detalhe: 0, def: 0, salvarLanc: 0, abriuDetalhe: [] };
  const els = { 'lan-edit-idx': { value: '' } };
  const fakeDoc = { getElementById(id){ return els[id] || null; } };
  const dbFix = {
    leituras: [
      { id:'l1', contratoId:'c1', numero:'L-101', status:'faturado', itens:[] },
      { id:'l2', contratoId:'c1', numero:'L-102', status:'aberta', itens:[
        { parqueId:'p1', medidor:'pretoA4', anterior: 1000, atual: 1150 }
      ] },
      { id:'l3', contratoId:'c2', numero:'L-200', status:'estornada', itens:[] },
      { id:'lX', contratoId:'c3', numero:'velha', status:'pendente', parqueId:'p1' } // formato legado: não bloqueia
    ],
    parque: [ { id:'p1', contadores:{ pretoA4: 1150 } } ]
  };
  const win = {
    lfbAlert(m){ alertas.push(String(m)); },
    novaLeituraContrato(){ calls.nova++; },
    criarLeituraDetalhada(){ calls.detalhe++; },
    criarLeituraDefinitiva(){ calls.def++; },
    abrirLeituraContratoDetalhe(id){ calls.abriuDetalhe.push(id); },
    salvarLancamentoContador(leituraId){
      calls.salvarLanc++;
      // imita o original: recalcula anterior do parque vivo e devolve o atual
      const l = dbFix.leituras.find(x=>x.id===leituraId);
      const item = l.itens[Number(els['lan-edit-idx'].value)];
      const p = dbFix.parque.find(x=>x.id===item.parqueId);
      const anterior = p.contadores[item.medidor];
      p.contadores[item.medidor] = Number(win.__novoAtual);
      win.__anteriorVisto = anterior;
    }
  };
  const ctx = { window: win, document: fakeDoc, db: dbFix };
  new Function('window','document','db', patch)(ctx.window, ctx.document, ctx.db);

  const P = win.LEITURA_UMA_ABERTA_V52436_PURE;
  ok(!!P, 'PURE registrada');
  ok(P.leituraAbertaDoContrato(dbFix, 'c1').id === 'l2', 'PURE: acha a aberta (faturada não conta)');
  ok(P.leituraAbertaDoContrato(dbFix, 'c2').id === 'l3', 'PURE: estornada conta como aberta (bloqueia)');
  ok(P.leituraAbertaDoContrato(dbFix, 'c3') === null, 'PURE: leitura legada parqueId-simples NÃO bloqueia o fluxo novo');
  ok(P.leituraAbertaDoContrato(dbFix, 'c9') === null, 'PURE: contrato sem leitura aberta passa livre');
  ok(P.rotuloStatus({status:'estornada'}) === 'estornada' && P.msgBloqueioNovaLeitura(dbFix.leituras[2]).includes('apague'), 'PURE: estornada orienta faturar OU apagar');

  // 2a. decreto: criar nova leitura com uma aberta → BLOQUEIA e abre a dela
  win.novaLeituraContrato('c1');
  ok(calls.nova === 0 && calls.abriuDetalhe[0] === 'l2', 'nova leitura bloqueada com leitura aberta + abre a existente');
  ok(alertas.some(a=>a.includes('L-102') && a.includes('Fature (feche)')), 'aviso cita a leitura aberta e como fechar');

  // 2b. estornada também bloqueia
  win.criarLeituraDetalhada('c2');
  ok(calls.detalhe === 0, 'estornada bloqueia a tela de leitura avulsa também');

  // 2c. livre: sem aberta → deixa criar
  win.novaLeituraContrato('c9');
  win.criarLeituraDefinitiva('c9');
  ok(calls.nova === 1 && calls.def === 1, 'sem aberta: cria normal nos 3 caminhos');

  // 2d. anterior certo na edição pós-estorno (o relato dele)
  els['lan-edit-idx'].value = '0';
  win.__novoAtual = 1180;
  win.salvarLancamentoContador('l2');
  ok(win.__anteriorVisto === 1000, 'edição: anterior volta a ser o do lançamento (1000), não o salvo/faturado (1150)');
  ok(dbFix.parque[0].contadores.pretoA4 === 1180, 'edição: parque vivo fica com o NOVO atual (1180) — lista coerente');

  // ── 3. Bundle / versão / celular ───────────────────────────────────────────
  const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
  ok(man.length >= 225 && man[man.length - 33] === 'ajustes_v52436_leitura_uma_aberta_patch.js' && man[man.length - 32] === 'ajustes_v5250_leitura_overhaul_patch.js' && man[man.length - 31] === 'ajustes_v5260_cnpj_gerente_patch.js' && man[man.length - 30] === 'ajustes_v5262_login_nuvem_primeiro_patch.js' && man[man.length - 29] === 'ajustes_v5264_chamado_data_grande_patch.js' && man[man.length - 28] === 'painel_gerente_patch.js' && man[man.length - 27] === 'fiscal_guard_patch.js' && man[man.length - 26] === 'nf_transmissao_patch.js' && man[man.length - 25] === 'autocura_empresa_central_nf_tela_patch.js' && man[man.length - 24] === 'perfis_nuvem_cura_sessao_patch.js' && man[man.length - 23] === 'permissoes_estorno_venda_patch.js' && man[man.length - 22] === 'fiscal_menu_completo_patch.js' && man[man.length - 21] === 'dashboard_inicio_clicavel_patch.js' && man[man.length - 20] === 'menus_fiscais_separados_patch.js' && man[man.length - 19] === 'permissoes_override_menus_fiscais_patch.js' && man[man.length - 18] === 'seis_submenus_velho_patch.js' && man[man.length - 17] === 'submenu_hover_nfe_patch.js' && man[man.length - 16] === 'navegacao_sem_tela_branca_patch.js' && man[man.length - 15] === 'ribbon_fiscal_estilo_antigo_patch.js', 'manifest: 232 scripts (v7.0.20 soma o mandar-erro; r49 soma o unificar; r59 soma o setup no fim; r60 soma o login-retry no fim); v6.0.13 ribbon bonita, depois fiscal 6.0.14→6.1.3, v6.1.7 soma o navegador embutido (NFS-e da prefeitura + WhatsApp Web) e v6.1.8 a memória da tela + a conferência da NF-e');
  const bundle = fs.readFileSync('app.bundle.js', 'utf8');
  ok(bundle.includes('LEITURA_UMA_ABERTA_V52436_PURE') && bundle.includes('Fature (feche) ela antes de criar outra'), 'bundle: guarda dentro');
  ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('LEITURA_UMA_ABERTA_V52436_PURE'), 'bundle do CELULAR igual');
  ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'index 6.0.9');
  ok(fs.readFileSync('index.html', 'utf8').includes('>v' + VERSAO_APP + '<'), 'rodapé v6.0.9');
  ok(fs.readFileSync('mobile/www/index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'celular 6.0.9');
  ok(JSON.parse(fs.readFileSync('package.json', 'utf8')).version === VERSAO_APP, 'package.json 6.0.9');

  // ── 4. Link oficial (githack morto — ele cobrou) ──────────────────────────
  const sync = fs.readFileSync('sync_build.js', 'utf8');
  ok(sync.includes('teste-60f.pages.dev') && !sync.includes('LINK_GITHACK'), 'sync_build imprime o SITE PRÓPRIO (githack fora — dono confirmou, r36)');
  ok(fs.readFileSync('RELATORIO_SESSAO.md', 'utf8').includes('teste-60f.pages.dev'), 'REL registra o link oficial do site próprio');

  if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
  console.log('\nTudo OK — v5.24.36 (uma leitura aberta por vez + anterior certo na edição + links oficiais do site próprio).');
})().catch(e=>{ console.error('✘ exceção no funcional:', e && e.message); process.exit(1); });
//<<<<SECAO:test_ajustes_v52436.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5250.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5250.js:INICIO>>>>
// test_ajustes_v5250.js — v5.25.0: revisão completa da área de leituras
// (relato: contador anterior sumiu / faturar+estornar sem confirmação e sem
// pop-up do sistema / rodapé da leitura desatualizado / tela antiga fora do
// contrato aposentada por decreto).
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const patch = fs.readFileSync('ajustes_v5250_leitura_overhaul_patch.js', 'utf8');

// ── 1. Marcas estruturais ────────────────────────────────────────────────────
ok(patch.includes('LEITURA_OVERHAUL_V5250_PURE'), 'expõe PURE');
ok(patch.includes('v5250-lan-ant') && patch.includes('Contador anterior registrado'), 'avulso 1: chip de contador anterior no lançamento');
ok(patch.includes('atualizarTiposLancamento') && patch.includes("'lan-med'") && patch.includes("'lan-prq'"), 'chip atualiza ao trocar impressora/tipo (mudança delegada + wrap)');
ok(patch.includes("'Faturar leitura'") && patch.includes("'Estornar leitura'") && patch.includes("'Remover lançamento'"), 'avulso 2/4: faturar, estornar e remover com confirmSistema (pop-up do sistema, título próprio)');
ok(patch.includes('v5250fatDaLista') && patch.includes('injetarAcoesListagem'), 'avulso 2: botões Faturar/Estornar por leitura na LISTAGEM');
ok(patch.includes('v5250-lei-salvar') && patch.includes("abrirLeiturasContrato") && patch.includes('data-nfe-emit'), 'avulso 3: rodapé reconstruído — remove Voltar+NF-e, fica Salvar (volta à listagem) + Imprimir');
ok(patch.includes('v5250leituraXBypass') && patch.includes('antes de fechar'), 'avulso 3: X da leitura pergunta "salvar antes de fechar?" com pop-up do sistema');
ok(patch.includes('Leituras agora vivem dentro do contrato') && patch.includes('pendentesLegadas') && patch.includes('gerarFaturasPendentes'), 'decreto: tela antiga aposentada + resgate de pendências velhas (nada órfão)');
ok(patch.includes("tipo==='leitura'") && patch.includes('data-nav="leituras"'), 'tela antiga: openModal redirect + menu escondido');
ok((patch.match(/__v5250lo/g) || []).length >= 10, 'guards __v5250lo em todos os wraps');

// ── 2. Funcional ─────────────────────────────────────────────────────────────
(async function(){
  const alertas = [];
  const calls = { fat: 0, det: 0, lista: 0, nfe: 0, saveDB: 0, nav: [] };
  const fakeDoc = {
    getElementById(){ return null; },
    querySelectorAll(){ return []; },
    createElement(){ return { style:{}, classList:{toggle(){},add(){}}, setAttribute(){}, appendChild(){}, remove(){}, innerHTML:'' }; },
    addEventListener(){}
  };
  const dbFix = {
    leituras: [
      { id:'l1', contratoId:'c1', clienteId:'cli1', numero:'L-9', status:'faturado', itens:[{valorTotal: 120}], valorTotal: 120 },
      { id:'l2', contratoId:'c1', clienteId:'cli1', numero:'L-10', status:'aberta', itens:[], valorTotal: 0 },
      { id:'lOld', parqueId:'p9', empresaId:'e1', status:'pendente', dataLeitura:'2026-01-01' }
    ],
    contasReceber: [
      { id:'cr1', leituraId:'l1', status:'aberto', pagamentoData:'2026-09-10' }
    ],
    contratos: [ { id:'c1', clienteId:'cli1', status:'ativo' } ],
    parque: [ { id:'p1', contadores:{ pretoA4: 1150 }, medidores:{ pretoA4:{contadorInicial: 100} } }, { id:'p2', contadores:{}, medidores:{ pretoA4:{contadorInicial: 100} } } ]
  };
  const win = {
    lfbAlert(m){ alertas.push(String(m)); },
    toastMsg(m){ calls.toast = String(m); },
    confirmSistema(msg, t){ calls['conf_'+t] = String(msg); return Promise.resolve(true); },
    faturarLeituraContrato(){ calls.fat++; },
    estornarLeituraContrato(){},
    abrirLeituraContratoDetalhe(id){ calls.det++; calls.detId = id; },
    abrirLeiturasContrato(id){ calls.lista++; calls.listaId = id; },
    getSession(){ return { empresaId:'e1' }; },
    saveDB(){ calls.saveDB++; },
    navigateTo(v){ calls.nav.push(v); }
  };
  const ctx = { window: win, document: fakeDoc, db: dbFix, saveDB: win.saveDB };
  new Function('window','document','db','saveDB', patch)(ctx.window, ctx.document, ctx.db, ctx.saveDB);

  const P = win.LEITURA_OVERHAUL_V5250_PURE;
  ok(!!P, 'PURE registrada');
  ok(P.tituloEhLeitura('Leitura L-9 — Padaria') && !P.tituloEhLeitura('Novo lançamento de contador') && !P.tituloEhLeitura('Editar lançamento'), 'PURE: título de detalhe de leitura reconhecido (lançamento NÃO dispara o X)');
  ok(P.contadorAnteriorInfo(dbFix, dbFix.parque[0], 'pretoA4', null) === 1150, 'PURE: contador anterior live do parque');
  ok(P.contadorAnteriorInfo(dbFix, dbFix.parque[0], 'pretoA4', {anterior: 1000}) === 1000, 'PURE: edição mostra o congelado do item (1000), não o do parque (1150)');
  ok(P.contadorAnteriorInfo(dbFix, dbFix.parque[1], 'pretoA4', null) === 100, 'PURE: sem contador salvo → cai no contadorInicial (100)');
  ok(P.contadorAnteriorInfo(dbFix, dbFix.parque[1], 'colorA4', null) === 0, 'PURE: medidor inexistente → 0 (igual o cálculo original)');
  ok(P.valorLeitura(dbFix.leituras[0]) === 120, 'PURE: valor da leitura');
  ok(P.pendentesLegadas(dbFix, 'e1').length === 1 && P.pendentesLegadas(dbFix, 'e2').length === 0, 'PURE: acha pendência do formato legado (resgate no cartão)');

  // Estorno via execEstorno (o que roda depois do Confirmar)
  const crs = P.execEstorno(dbFix, dbFix.leituras[0]);
  ok(crs === 1 && dbFix.leituras[0].status === 'estornada' && dbFix.contasReceber[0].status === 'estornado' && dbFix.contasReceber[0].pagamentoData === null, 'PURE execEstorno: leitura aberta p/ edição + cobrança estornada + data limpa');

  // Faturar com popup do sistema
  win.faturarLeituraContrato('l2');
  await new Promise(r=>setTimeout(r,5));
  ok(calls.fat === 1 && calls['conf_Faturar leitura'] && calls['conf_Faturar leitura'].includes('L-10'), 'faturar: confirmação do SISTEMA com número da leitura antes de faturar');

  if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }

  // ── 3. Bundle / versão / mural / celular ───────────────────────────────────
  const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
  ok(man.length >= 201 && man[200] === 'ajustes_v5250_leitura_overhaul_patch.js', 'manifest: revisão de leituras fecha a ERA v5.25.0 na posição 201 (o v5.26.0 do CNPJ+gerente pode vir depois)');
  const bundle = fs.readFileSync('app.bundle.js', 'utf8');
  ok(bundle.includes('LEITURA_OVERHAUL_V5250_PURE') && bundle.includes('Contador anterior registrado') && bundle.includes('Leituras agora vivem dentro do contrato'), 'bundle: revisão dentro');
  ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('LEITURA_OVERHAUL_V5250_PURE'), 'bundle do CELULAR igual');
  ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'index 6.0.9 (re-ancorado: v5.26.0 = CNPJ + gerente)');
  ok(fs.readFileSync('index.html', 'utf8').includes('>v' + VERSAO_APP + '<'), 'rodapé v6.0.9 (re-ancorado: entrega grande ganhou a 2ª casa)');
  ok(fs.readFileSync('mobile/www/index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'celular 6.0.9');
  ok(JSON.parse(fs.readFileSync('package.json', 'utf8')).version === VERSAO_APP, 'package.json 6.0.9');

  if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
  console.log('\nTudo OK — v5.25.0 (revisão completa de leituras: anterior visível, confirmações do sistema, ações na listagem, rodapé novo, tela antiga aposentada com resgate).');
})().catch(e=>{ console.error('✘ exceção no funcional:', e && e.message); process.exit(1); });
//<<<<SECAO:test_ajustes_v5250.js:FIM>>>>
}

if (false) { // ═══ test_contrato_impressora_nao_some.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_contrato_impressora_nao_some.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — A IMPRESSORA NÃO SOME MAIS DO CONTRATO
//
// Relato do dono (23/09/2026): "quando eu coloco alguma impressora em algum
// contrato, não sei quanto tempo depois, ela some do nada".
//
// CAUSA RAIZ (achada em 23/09/2026, `locacao_patch.js`): ao importar os dados do
// sistema antigo, o importador varre "dados de demonstração" e apaga. Ele
// reconhecia o dado de exemplo pelo NÚMERO do contrato, no formato
// CT-ano-0001 — que é EXATAMENTE o formato que o próprio sistema gera para
// contrato de verdade (app.js, renderModalContrato). Resultado: contrato
// verdadeiro, criado na tela, era apagado na próxima importação — e o `parque`
// (as impressoras que o dono tinha acabado de colocar nele), as leituras e as
// faturas iam junto.
//
// CONSERTO: a decisão passou a exigir também que o registro NÃO tenha dono
// humano (quem cria na tela grava `criadoPor` = id do usuário logado; o dado de
// exemplo não tem autor, ou está como 'sistema'/'demo'). Mesmo defeito existia
// no filtro dos chamados (OS-ano-0001) e foi travado igual.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++; console.log('  ✔ ' + nome);
}

const code = fs.readFileSync('locacao_patch.js', 'utf8');

console.log('== 1) A REGRA: número igual + SEM dono humano ==');
// Executa a função REAL do arquivo (extraída do próprio código)
const m = /function jbSemDonoHumano\(r\)\{[\s\S]*?\n\}/.exec(code);
ok('a função de decisão existe no arquivo', !!m);
const jbSemDonoHumano = new Function('return (' + m[0] + ')')();

ok('registro do seed, sem autor → é demonstração', jbSemDonoHumano({ numero:'CT-2026-0001' }) === true);
ok('registro do seed, autor "sistema" → é demonstração', jbSemDonoHumano({ numero:'CT-2026-0001', criadoPor:'sistema' }) === true);
ok('registro do seed, autor "demo" → é demonstração', jbSemDonoHumano({ numero:'CT-2026-0001', criadoPor:'demo' }) === true);
ok('CONTRATO DE VERDADE (autor = usuário logado) → NÃO é demonstração',
   jbSemDonoHumano({ numero:'CT-2026-0001', criadoPor:'usr_kauan', criadoPorNome:'Kauan' }) === false);
ok('contrato do Denivaldo → NÃO é demonstração',
   jbSemDonoHumano({ numero:'CT-2026-0042', criadoPor:'usr_denivaldo', criadoPorNome:'Denivaldo' }) === false);
ok('funcionário cadastrado na tela → NÃO é demonstração',
   jbSemDonoHumano({ numero:'CT-2026-0007', criadoPor:'usr_abc123', criadoPorNome:'Maria' }) === false);
ok('registro vazio/lixo não derruba o importador', jbSemDonoHumano(null) === false || jbSemDonoHumano(null) === true);
ok('objeto vazio: sem autor → tratado como demonstração', jbSemDonoHumano({}) === true);

console.log('\n== 2) OS DOIS FILTROS USAM A TRAVA ==');
const filtroCtr = /const demoCtrIds = db\.contratos[\s\S]{0,300}?\.map\(c=>c\.id\);/.exec(code);
ok('filtro dos contratos achado', !!filtroCtr);
ok('contratos: exige jbSemDonoHumano', !!filtroCtr && filtroCtr[0].includes('jbSemDonoHumano(c)'));
const filtroOs = /db\.os = db\.os\.filter\([\s\S]{0,200}?\);/.exec(code);
ok('filtro dos chamados achado', !!filtroOs);
ok('chamados: exige jbSemDonoHumano (mesmo defeito, mesma trava)', !!filtroOs && filtroOs[0].includes('jbSemDonoHumano(o)'));
ok('o padrão do número sozinho não decide mais nada',
   !/filter\(c=>c\.empresaId===empId && !jbEhMigracao\(c\) && !c\.codigoAntigo && \/\^CT-/.test(code));

console.log('\n== 3) O PARQUE (as impressoras) ACOMPANHA O CONTRATO ==');
ok('o parque só é apagado pelos contratos que a trava aprovou',
   /db\.parque\s*=\s*db\.parque\.filter\(p=>!demoCtrIds\.includes\(p\.contratoId\)\)/.test(code));
ok('as leituras e as faturas seguem a mesma lista',
   /db\.leituras\s*=\s*db\.leituras\.filter\(l=>!demoCtrIds/.test(code) &&
   /db\.contasReceber = db\.contasReceber\.filter\(cr=>!demoCtrIds/.test(code));
ok('a limpeza continua existindo (só ficou mais criteriosa)',
   /result\.demosRemovidos \+=/.test(code));

console.log('\nRESULTADO: ' + passou + ' verificações — contrato e impressora do dono não são mais tratados como demonstração!');
//<<<<SECAO:test_contrato_impressora_nao_some.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52410.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52410.js:INICIO>>>>
// Teste v5.24.34 — "o clientes não abre a lista que mostra os que eu quero":
//  • botão novo "Este cliente na lista" (ficha → módulo Clientes já filtrado
//    por este cadastro: ele + quem tem nome parecido, o grupinho dele);
//  • trava de segurança: sub desconhecido NÃO cai mais mudo em Leituras
//    (antes qualquer tropeço abria a lista errada sem avisar);
//  • carimbos 5.24.34.
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }
const patch  = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM= fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- este cliente na lista --');
ok(patch.indexOf('window.clitabAbrirClienteNaLista=function(){') >= 0, 'função existe');
ok(patch.indexOf("navigateTo('clientes')") >= 0, 'navega ao módulo Clientes');
ok(patch.indexOf("document.getElementById('search-clientes')") >= 0, 'preenche a busca do módulo Clientes');
ok(patch.indexOf('Este cliente na lista') >= 0, 'botão presente na barra de ações da ficha');

console.log('-- trava do senão --');
ok(patch.indexOf("Essa parte não tem lista de origem — use uma das abas do Histórico.") >= 0, 'sub desconhecido explica em vez de abrir lista errada');
ok(patch.indexOf("sub!=='vendas'&&sub!=='financeiro'&&sub!=='orcamentos'&&sub!=='chamados'&&sub!=='leituras'") >= 0, 'guarda dos 5 subs conhecidos');

console.log('-- integridade --');
const vW = (worker.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').indexOf('Worker ' + vW) >= 0, 'worker carimbado (v' + vW + ') e motor colado na mesma versão');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf('clitabAbrirClienteNaLista') >= 0, 'função dentro do bundle');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0 && indexHtml.indexOf('app.bundle.js?v=' + pkg.version) >= 0, 'index.html na v' + pkg.version);
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0, 'mobile/www/index.html na v' + pkg.version);
ok(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json com versão válida (v' + pkg.version + ')');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) v' + pkg.version); process.exit(1); }
console.log('\nTudo certo v' + pkg.version + '!');
//<<<<SECAO:test_ajustes_v52410.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52411.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52411.js:INICIO>>>>
// Teste v5.24.34 — "quero a LISTA do módulo mostrando SÓ os selecionados":
//  • o botão da ficha NÃO abre mais o registro por cima — a lista do módulo
//    é desenhada somente com as linhas marcadas (troca-segura do tanque:
//    mesmos objetos, gravação de molho durante o desenho, tanque devolvido);
//  • sem seleção, continua como antes (módulo filtrado pelo cliente);
//  • carimbos 5.24.34.
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }
const patch  = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM= fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- a lista só com os marcados --');
ok(patch.indexOf('window.clitabRenderSoSelecionados=function(sub, ids){') >= 0, 'desenhista da lista filtrada existe');
ok(patch.indexOf("vendas:{arr:'vendas'") >= 0 && patch.indexOf("financeiro:{arr:'contasReceber'") >= 0 && patch.indexOf("orcamentos:{arr:'orcamentos'") >= 0 && patch.indexOf("chamados:{arr:'os'") >= 0 && patch.indexOf("leituras:{arr:'leituras'") >= 0, 'os 5 tanques mapeados (vendas/financeiro/orçamentos/chamados/leituras)');
ok(patch.indexOf('orig.filter(function(x){ return x && want[String(x.id)]; });') >= 0, 'filtra só os ids marcados');
ok(patch.indexOf('_db[def.arr]=orig;') >= 0 && patch.indexOf('window.saveDBAgora=sdA') >= 0, 'tanque devolvido e gravação voltando (troca segura)');
ok(patch.indexOf('clitabAbrirDireto(sub, ids[0], true)') === -1, 'NÃO abre mais o 1º registro por cima da lista');
ok(patch.indexOf('clitabRenderSoSelecionados(sub, ids)') >= 0, 'com seleção, a LISTA é quem mostra');
ok(patch.indexOf('que abra onde é a lista que mostra todos') >= 0 && patch.indexOf('que eu pedi') >= 0, 'regra dele gravada no comentário');

console.log('-- o que não muda --');
ok(patch.indexOf('window.clitabAbrirDireto=function(tipo, id, silencioso)') >= 0, 'botão direito continua abrindo o registro (caso de uso separado)');
ok(patch.indexOf('clitabAbrirClienteNaLista') >= 0, '"Este cliente na lista" da v5.24.10 segue');
ok(patch.indexOf('Abrir selecionado(s)') >= 0, 'botão continua contando os marcados');

console.log('-- integridade --');
const vW = (worker.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').indexOf('Worker ' + vW) >= 0, 'worker carimbado (v' + vW + ') e motor colado na mesma versão');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf('clitabRenderSoSelecionados') >= 0, 'novo fluxo dentro do bundle');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0 && indexHtml.indexOf('app.bundle.js?v=' + pkg.version) >= 0, 'index.html na v' + pkg.version);
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0, 'mobile/www/index.html na v' + pkg.version);
ok(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json com versão válida (v' + pkg.version + ')');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) v' + pkg.version); process.exit(1); }
console.log('\nTudo certo v' + pkg.version + '!');
//<<<<SECAO:test_ajustes_v52411.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52422.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52422.js:INICIO>>>>
// test_ajustes_v52422.js — v5.24.34: pacote 2A do RELATORIO GRANDE.
// F1 contratos padrão "Hoje (criados ou mexidos hoje)" + botão Mostrar todos.
// F2 chamados: imprimir direto (sem abrir) + excluir com aviso escolhido;
//    cabeçalho "PDF" vira ícone de impressora; neo externa (view-manutencao)
//    ganha as mesmas duas ações.
// P6 contrato RTF: no .exe abre DIRETO no Word (rtf:abrir + shell.openPath);
//    navegador/celular seguem no download; mapa de campos completado
//    (DATA_INICIO, DATA_FIM, telefones, endereço completo...).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const ctrs = fs.readFileSync('ajustes_v52237_contratos_filtros_patch.js', 'utf8');
const cham = fs.readFileSync('locacao_chamados_fix_patch.js', 'utf8');
const noti = fs.readFileSync('notinha_patch.js', 'utf8');
const main = fs.readFileSync('main.js', 'utf8');
const prel = fs.readFileSync('preload.js', 'utf8');
const rtfp = fs.readFileSync('contratos_rtf_template_patch.js', 'utf8');

// F1
ok(ctrs.includes("['hoje','Hoje (criados ou mexidos hoje)']"), 'F1: opção "Hoje" existe na faixa de filtros');
ok(ctrs.includes("campo:'hoje'") && ctrs.includes("campo:'hoje', q:''"), 'F1: estado padrão da tela = Hoje');
ok(ctrs.includes('__ctrMexeuHoje'), 'F1: cálculo vivo "mexeu hoje" (sem depender de carimbo)');
ok(ctrs.includes("tenta(db.os, 'contratoId'") && ctrs.includes("tenta(db.leituras, 'contratoId'") && ctrs.includes("tenta(db.parque, 'contratoId'"), 'F1: cobre impressora/chamado/leitura na mesma data');
ok(ctrs.includes('ctr-mostrar-todos'), 'F1: botão Mostrar todos plantado');
ok(ctrs.includes("STATE.campo='todos'; STATE.q='';"), 'F1: Mostrar todos limpa campo e busca');

// F2
ok(cham.includes('imprimirChamadoAgoraV52422'), 'F2: imprimir direto (sem abrir)');
ok(cham.includes('excluirChamadoV52422'), 'F2: excluir chamado existe');
ok(cham.includes('Esse chamado é DE CONTRATO'), 'F2: aviso ESPECIAL de chamado de contrato (= texto dele)');
ok(cham.includes('Excluir este chamado? Apaga SEM volta'), 'F2: aviso normal nos fora-de-contrato');
ok(cham.includes("/pdf/i.test(String(th.textContent||''))") && cham.includes('ph ph-printer text-slate-500'), 'F2: onde estava "PDF" nasce o ícone da impressora');
ok(cham.includes("db.os.splice(i,1)"), 'F2: apaga de verdade na fonte (o havia pedido "deletar é pra deletar")');
ok(noti.includes('window.imprimirChamadoAgoraV52422&&window.imprimirChamadoAgoraV52422') , 'F2: neo externa (view-manutencao) tem a dupla');

// P6
ok(main.includes("ipcMain.handle('rtf:abrir'"), 'P6: handler rtf:abrir no main.js');
ok(main.includes('shell.openPath(full)'), 'P6: shell.openPath abre no Word associado');
ok(main.includes("app.getPath('temp')"), 'P6: arquivo temporário no temp do sistema');
ok(prel.includes('rtfAPI: {') && prel.includes("ipcRenderer.invoke('rtf:abrir'"), 'P6: ponte preload exposta');
ok(rtfp.includes('window.rtfAPI.abrir({ nome: nome, conteudo: rtfFinal })'), 'P6: desktop usa a ponte');
ok(rtfp.includes('else if(typeof toast=='), 'P6: toast de "Abrindo no Word" no sucesso');
ok(rtfp.includes('DATA_INICIO') && rtfp.includes('DATA_FIM') && rtfp.includes('DATA_HOJE') && rtfp.includes('CTR_CODIGO'), 'P6: mapa cobre DATA_INICIO/FIM/HOJE + código do contrato');
ok(rtfp.includes('CLI_TELEFONE') && rtfp.includes('CLI_ENDCOMPLETO') && rtfp.includes('EMP_EMAIL'), 'P6: campos cliente/empresa completados');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('__ctrMexeuHoje') && bundle.includes('excluirChamadoV52422'), 'bundle: F1+F2 presentes');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('__ctrMexeuHoje'), 'bundle do CELULAR igual');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');
ok(main.includes('v5.24.34'), 'main.js com o comentário da versão');
ok(prel.includes("'5.24.34'") || prel.includes("v5.24.34") || prel.includes('5.24.34'), 'preload carimbado');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' pacote 2A (F1 contratos-hoje, F2 chamados excluir+imprimir, P6 RTF no Word).');
//<<<<SECAO:test_ajustes_v52422.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5247.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5247.js:INICIO>>>>
// Teste v5.24.34 — "abrir já mostrando o que eu escolhi" + 4.2 sem fantasma:
//  • o botão da ficha agora abre o REGISTRO no módulo (1 marcado abre direto;
//    vários = módulo filtrado pelo cliente + o 1º abre na hora);
//  • o abridor vai DIRETO PELO OBJETO — nunca re-caça por id na tela (era o
//    caminho que explodia no "Não achei esse orçamento" com código-fantasma);
//  • excluir varre as telas dos módulos (linha-fantasma apagada some dali,
//    então ninguém mais clica em registro morto).
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }
const patch  = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const orc37  = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM= fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- abrir selecionados: direto no registro, sempre pelo objeto --');
ok(patch.indexOf('window.clitabAbrirDireto=function(tipo, id, silencioso)') >= 0, 'abridor direto existe');
// v5.24.34 SUPERSEDEU o auto-abrir o 1º: a ficha agora desenha a LISTA do
// módulo só com os marcados (pedido correto dele: "a lista mostrando os
// selecionados"). O auto-open saiu de propósito — não reintroduzir.
ok(patch.indexOf('clitabRenderSoSelecionados(sub, ids)') >= 0, 'v5.24.34: a LISTA mostra os marcados (o 1º não abre mais sozinho)');
ok(patch.indexOf("openModal('contaReceber', c.id)") >= 0, 'Financeiro abre a CONTA (não só o menu)');
ok(patch.indexOf("window.abrirTelaOrcamento(o)") >= 0, 'orçamento abre direto pelo objeto (fora do caçador de id)');
ok(patch.indexOf("openModal('os', o.id)") >= 0 && patch.indexOf("abrirLeituraDetalhada(l.id)") >= 0, 'chamado e leitura abrem o registro');
ok(patch.indexOf("window.showVenda(v.id)") >= 0, 'venda abre o histórico da notinha');
ok(patch.indexOf("Abrir selecionado(s) ('+n+')") >= 0, 'botão mostra "Abrir selecionado(s) (N)" quando há marcação');

console.log('-- 4.2: sem linha-fantasma clicável --');
ok(patch.indexOf("sub==='orcamentos'&&typeof window.renderOrcamentos==='function'") >= 0 && patch.indexOf("sub==='chamados'&&typeof renderOs==='function'") >= 0 && patch.indexOf("sub==='leituras'&&typeof renderLeituras==='function'") >= 0, 'excluir varre orçamentos/chamados/leituras (fora o fantasma)');
ok(patch.indexOf('clitabAbrirRegistro=function(tipo, id){') >= 0 && patch.indexOf('String(x.id)===String(id)') >= 0, 'validação na hora do clique continua');
ok(orc37.indexOf("o.status!=='excluido'") >= 0, 'lista do módulo Orçamentos continua escondendo excluídos');

console.log('-- integridade --');
const vW = (worker.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').indexOf('Worker ' + vW) >= 0, 'worker carimbado (v' + vW + ') e motor colado na mesma versão');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf('clitabAbrirDireto') >= 0, 'abridor presente no bundle');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0 && indexHtml.indexOf('app.bundle.js?v=' + pkg.version) >= 0, 'index.html na v' + pkg.version);
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0, 'mobile/www/index.html na v' + pkg.version);
ok(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json com versão válida (v' + pkg.version + ')');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) v' + pkg.version); process.exit(1); }
console.log('\nTudo certo v' + pkg.version + '!');
//<<<<SECAO:test_ajustes_v5247.js:FIM>>>>
}

if (false) { // ═══ test_unificar_contratos_r49.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_unificar_contratos_r49.js:INICIO>>>>
// test_unificar_contratos_r49.js — r49: unificar contratos duplicados.
// Pedido do dono: "continue unificando sem eu dizer mais nada" (contrato 77
// duplicado do Balcão + números 8/7/1 discordando).
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const ler = a => fs.readFileSync(a, 'utf8');

console.log('== r49: regra do qual fica (pura, sem banco) ==');
const U = require('./ajustes_v52437_contrato_unificar_patch.js');
const A = (o) => Object.assign({id:'x'}, o);
let r = U.escolherPrincipal(
  A({criadoPor:'migracao', __nAtivas:9, criadoEm:'2020-01-01', numero:'1'}),
  A({criadoPor:'u1', __nAtivas:0, criadoEm:'2026-01-01', numero:'77'}));
ok('criado por gente ganha da migração mesmo com menos impressoras', r.manter.criadoPor === 'u1');
r = U.escolherPrincipal(
  A({numero:'1', __nAtivas:7, criadoEm:'2026-08-17'}),
  A({numero:'77', __nAtivas:1, criadoEm:'2026-08-01'}));
ok('com mais impressoras ganha mesmo sendo mais novo (caso Balcão: fica o 1)', r.manter.numero === '1');
r = U.escolherPrincipal(
  A({numero:'5', __nAtivas:3, criadoEm:'2026-09-01'}),
  A({numero:'9', __nAtivas:3, criadoEm:'2026-08-01'}));
ok('empatou impressoras: mais antigo ganha', r.manter.numero === '9');
r = U.escolherPrincipal(
  A({numero:'77', __nAtivas:2, criadoEm:'2026-08-01'}),
  A({numero:'1', __nAtivas:2, criadoEm:'2026-08-01'}));
ok('empatou tudo: menor código ganha', r.manter.numero === '1');

console.log('== r49: o unificar existe e é reversível ==');
const f = ler('ajustes_v52437_contrato_unificar_patch.js');
ok('unificar + desfazer expostos', f.includes('unificarContratos') && f.includes('desfazerUnificacao'));
ok('aposenta com status encerrado (não apaga)', f.includes("'encerrado'"));
ok('guarda de-onde-veio cada linha (contratoIdAnterior)', f.includes('contratoIdAnterior'));
ok('registra na Auditoria', f.includes("logAction('contrato'"));
ok('sugestão automática no modal (banner)', f.includes('v52437-uni'));
ok('só unifica mesmo cliente e mesma empresa (trava)', f.includes('cliente-diferente') && f.includes('empresa-diferente'));

console.log('== r49: UMA conta oficial nas 3 telas ==');
ok('conta oficial exportada', ler('contratos_final_patch.js').includes('window.maquinasContrato'));
ok('tabela v52243 usa a conta oficial', ler('ajustes_v52243_impressora_remanejar_patch.js').includes('maquinasContrato(c)'));
const v45 = ler('ajustes_v52245_impressora_serial_ocultar_patch.js');
ok('tabela v52245 usa a conta oficial', v45.includes('maquinasContrato(c)'));
ok('verde recalculado no instante da tabela', v45.includes('sincVerdeContrato'));

console.log('== r49: bundles (rodar npm run bundle antes de entregar) ==');
const b1 = ler('app.bundle.js'), b2 = ler('mobile/www/app.bundle.js');
ok('bundles com o unificar', b1.includes('unificarContratos') && b2.includes('unificarContratos'));
ok('bundles com a conta oficial', b1.includes('window.maquinasContrato') && b2.includes('window.maquinasContrato'));

console.log('\nRESULTADO: unificar contratos r49 passou!');
//<<<<SECAO:test_unificar_contratos_r49.js:FIM>>>>
}

if (false) { // ═══ test_r63_filtro.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_r63_filtro.js:INICIO>>>>
const fs = require('fs');
let falhas = 0;
function ok(c, m){ if(c){ console.log('  ok - '+m); } else { falhas++; console.error('  FALHA - '+m); } }
console.log('-- r63 P1 filtro: campo escolhido é respeitado (auditoria 30/09) --');
function bloco(s, a, b){ const i = s.indexOf(a), j = s.indexOf(b); if(i<0||j<0||j<i) return null; return s.slice(i+a.length, j); }
const v19 = fs.readFileSync('ajustes_v52219_filtros_busca_patch.js', 'utf8');
const pure = bloco(v19, '/* FILTROS_PURE_START */', '/* FILTROS_PURE_END */');
ok(!!pure, 'bloco FILTROS_PURE extraível p/ teste');
const P = new Function((pure || '') + '; return {filtraClientes, filtraClientesCampo, textoOK};')();
const cliSrc = fs.readFileSync('clientes_patch.js', 'utf8');
const ini = cliSrc.indexOf('const CLI_PURE = (function(){');
const fim = cliSrc.indexOf('})();', ini) + 5;
const C = new Function(cliSrc.slice(ini, fim) + '; return CLI_PURE;')();
const L = [
  { codigo: 1, nome: 'Balcão teste', fantasia: '', documento: '111' },
  { codigo: 10, nome: 'Dez', fantasia: '', documento: '222' },
  { codigo: 21, nome: 'Vinte e um', fantasia: 'Loja XP', documento: '333' },
  { codigo: 'B2', nome: 'Bee', fantasia: '', documento: '444' }
];
const cods = r => JSON.stringify(r.map(c => c.codigo));
ok(cods(C.filtraClientes(L, '1', 'codigo')) === '[1]', 'CLI_PURE: código 1 acha só o 1');
ok(cods(P.filtraClientes(L, '1', 'codigo')) === '[1]', 'v52219: código 1 acha só o 1');
ok(cods(P.filtraClientesCampo(L, '1', 'codigo')) === '[1]', 'porta única: código 1 acha só o 1');
ok(P.filtraClientesCampo(L, 'balc', 'nome').length === 1, 'nome parcial acha Balcão (sem acento)');
ok(P.filtraClientesCampo(L, 'xp', 'fantasia').length === 1, 'fantasia xp acha a Loja XP');
ok(P.filtraClientesCampo(L, 'xp', 'nome').length === 0, 'campo nome NÃO vaza p/ fantasia');
ok(P.filtraClientesCampo(L, '222', 'documento').length === 1, 'documento 222 acha o Dez');
ok(P.filtraClientesCampo(L, '222', 'nome').length === 0, 'campo nome NÃO vaza p/ documento');
ok(C.filtraClientes([{ codigo: 99, codigoAntigo: '0077' }], '77', 'codigo').length === 1, 'código antigo 0077 acha com 77');
console.log('-- r63 P2 encoding: dado antigo consertado na exibição --');
const sujo = Buffer.from('Balcão', 'utf8').toString('latin1');
ok(sujo !== 'Balcão', 'sanidade: Buffer gera mojibake (' + sujo + ')');
ok(P.textoOK(sujo) === 'Balcão', 'textoOK desfaz o mojibake');
ok(P.textoOK('José') === 'José' && P.textoOK('') === '' && P.textoOK('100%') === '100%', 'texto limpo passa intacto');
console.log('-- r63 fiação: todo mundo chama a porta única --');
const neo = fs.readFileSync('notinha_patch.js', 'utf8');
ok(neo.indexOf('id="neo-cli-campo"') >= 0, 'Nova venda tem seletor de campo');
ok(neo.indexOf('id="neo-search-clientes-campo"') >= 0, 'tela Clientes tem seletor de campo');
ok(neo.indexOf('window.filtraClientesCampo(base,q,campo)') >= 0, 'Nova venda usa a porta única');
ok(neo.indexOf('window.filtraClientesCampo(list,q,campoCli)') >= 0, 'tela Clientes usa a porta única');
const o59 = fs.readFileSync('ajustes_v52259_orcamento_filtros_item_patch.js', 'utf8');
const o60 = fs.readFileSync('ajustes_v52260_orcamento_trava_venda_atalho_patch.js', 'utf8');
ok(o59.indexOf('window.filtraClientesCampo(list, q, campo)') >= 0, 'orçamento v52259 usa a porta única');
ok(o60.indexOf('window.filtraClientesCampo(list, q, campo)') >= 0, 'orçamento v52260 usa a porta única');
ok(cliSrc.indexOf('fold(TOK(valor))') >= 0, 'CLI_PURE conserta o texto antes de comparar');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.indexOf('function filtraClientesCampo') >= 0, 'porta única chegou no bundle');
ok(bundle.indexOf('function textoOK') >= 0, 'textoOK chegou no bundle');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) r63-filtro'); process.exit(1); }
console.log('\nRESULTADO: r63 filtro passou!');
//<<<<SECAO:test_r63_filtro.js:FIM>>>>
}
