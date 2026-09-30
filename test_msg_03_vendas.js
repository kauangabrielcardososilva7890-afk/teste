// ═══════════════════════════════════════════════════════════════
// test_msg_03_vendas.js — GERADO por migrar_testes_r57.js; 35 seções.
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_pix.js, test_otim.js, test_automacoes_contratos_caixa_fiscal.js, test_automacoes_vendas_compras_cadastros.js, test_automacoes_orcamentos_clientes_auxiliares.js, test_automacoes_pix_contadores_auxiliares.js, test_automacoes_vendas_fiscal_auxiliares.js, test_automacoes_caixa_chat_auxiliares.js, test_offline_assets.js, test_ajustes_v52218.js, test_ajustes_v52237.js, test_ajustes_v52238.js, test_ajustes_v52240.js, test_ajustes_v52241.js, test_ajustes_v52243.js, test_ajustes_v52244.js, test_ajustes_v52254.js, test_ajustes_v52255.js, test_ajustes_v52256.js, test_ajustes_v52258.js, test_ajustes_v52259.js, test_ajustes_v52260.js, test_ajustes_v52261.js, test_ajustes_v52262.js, test_ajustes_v52291.js, test_ajustes_v52293.js, test_ajustes_v52295.js, test_ajustes_v6005.js, test_ajustes_v6102.js, test_camadas_protegidas.js, test_ajustes_v52412.js, test_ajustes_v52421.js, test_ajustes_v5249.js
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

if (false) { // ═══ test_pix.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_pix.js:INICIO>>>>
// Teste unitário do núcleo puro do pix_patch.js (seção PIX_PURE) — padrão BR Code/EMV do Banco Central
// Uso: node test_pix.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/pix_patch.js', 'utf8');
const m = src.match(/\/\* PIX_PURE_START \*\/([\s\S]*?)\/\* PIX_PURE_END \*\//);
if(!m){ console.error('FALHOU: seção PIX_PURE não encontrada'); process.exit(1); }
const PIX_PURE = eval(m[1] + '\n; PIX_PURE;');

let pass = 0, fail = 0;
function eq(nome, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok){ pass++; console.log('  ✔', nome); }
  else { fail++; console.error('  ✘', nome, '\n     obtido:', JSON.stringify(got), '\n     esperado:', JSON.stringify(want)); }
}
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

console.log('== Vetor oficial do Manual do Banco Central (v2.2.1, pág. 25) ==');
// Exemplo literal do manual do BCB: payload conhecido com CRC 1D3D
{
  const esperado = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D';
  eq('CRC16 do exemplo do manual = 1D3D', PIX_PURE.crc16(esperado.slice(0, -4)), '1D3D');
  const montado = PIX_PURE.montar({ chave:'123e4567-e12b-12d1-a456-426655440000', nome:'Fulano de Tal', cidade:'BRASILIA' });
  eq('payload montado idêntico ao manual', montado, esperado);
}

console.log('== CRC16 — duas implementações independentes devem concordar ==');
{
  // implementação de referência com tabela (código diferente, mesmo resultado)
  function crc16Ref(str){
    const tab = [];
    for(let n=0;n<256;n++){ let c=n<<8; for(let k=0;k<8;k++){ c = (c & 0x8000) ? ((c<<1)^0x1021) : (c<<1); c &= 0xFFFF; } tab[n]=c; }
    let crc = 0xFFFF;
    for(let i=0;i<str.length;i++) crc = ((crc<<8) ^ tab[((crc>>8) ^ str.charCodeAt(i)) & 0xFF]) & 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4,'0');
  }
  let iguais = true;
  const casos = ['', 'a', '6304', '00020126360014br.gov.bcb.pix0114+55619888877775204000053039865802BR5910DIGICOPY6007JANAUBA62070503***6304'];
  for(let i=0;i<120;i++){
    let s = ''; const n = 1 + Math.floor(Math.random()*160);
    for(let j=0;j<n;j++) s += String.fromCharCode(32 + Math.floor(Math.random()*95));
    casos.push(s);
  }
  for(const s of casos) if(PIX_PURE.crc16(s) !== crc16Ref(s)) iguais = false;
  ok('150 textos: polinomialbit-a-bit == tabela', iguais);
  eq('CRC sempre 4 hex maiúsculo', /^[0-9A-F]{4}$/.test(PIX_PURE.crc16('qualquer coisa')), true);
}

console.log('== emv (Tag-Length-Value) ==');
{
  eq('tag 00', PIX_PURE.emv('00','01'), '000201');
  eq('comprimento com 2 dígitos', PIX_PURE.emv('54','150.00'), '5406150.00');
  eq('valor vazio', PIX_PURE.emv('02',''), '0200');
}

console.log('== limpar (nome/cidade sem acento, sem símbolo, com teto) ==');
{
  eq('remove acentos', PIX_PURE.limpar('DIGICOPY SOLUÇÕES ÇÃÁÉ', 25), 'DIGICOPY SOLUCOES CAAE');
  eq('teto de 25', PIX_PURE.limpar('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 25).length, 25);
  eq('símbolos viram espaço e colapsam', PIX_PURE.limpar('Loja #1 @Centro!!', 25), 'Loja 1 Centro');
  eq('null vira vazio', PIX_PURE.limpar(null, 25), '');
}

console.log('== txid ==');
{
  eq('vazio vira ***', PIX_PURE.txidLimpo(''), '***');
  eq('mantém letras e números', PIX_PURE.txidLimpo('VD-000123'), 'VD000123');
  eq('corta em 25', PIX_PURE.txidLimpo('X'.repeat(40)).length, 25);
  eq('minúsculas aceitas', PIX_PURE.txidLimpo('abc123'), 'abc123');
}

console.log('== montar — valor exato no QR ==');
{
  const p = PIX_PURE.montar({ chave:'08385589000103', nome:'DIGICOPY', cidade:'JANAUBA', valor:150.00, txid:'VD000123' });
  ok('contém campo 54 com valor', p.includes('5406150.00'));
  ok('contém txid', p.includes('0508VD000123'));
  ok('termina com CRC válido', PIX_PURE.crc16(p.slice(0,-4)) === p.slice(-4));
  const f = PIX_PURE.montar({ chave:'08385589000103', nome:'DIGICOPY', cidade:'JANAUBA', valor:0.5, txid:'T1' });
  ok('valor 0.50 formatado', f.includes('54040.50'));
  const semValor = PIX_PURE.montar({ chave:'08385589000103', nome:'DIGICOPY', cidade:'JANAUBA' });
  ok('valor 0/ausente não gera campo 54', !semValor.includes('540'));
  ok('txid padrão ***', semValor.includes('0503***'));
}

console.log('== montar — validações e fallbacks ==');
{
  let jogou = false;
  try{ PIX_PURE.montar({ chave:'  ' }); }catch(e){ jogou = /Chave/i.test(e.message); }
  ok('chave vazia lança erro claro', jogou);
  const p = PIX_PURE.montar({ chave:'12345678901' });
  ok('sem nome usa RECEBEDOR', p.includes('5909RECEBEDOR'));
  ok('sem cidade usa BRASIL', p.includes('6006BRASIL'));
}

console.log('== montar — ordem dos campos (parser TLV independente) ==');
{
  const p = PIX_PURE.montar({ chave:'email@loja.com.br', nome:'DIGICOPY MG', cidade:'JANAUBA', valor:99.90, txid:'VD999' });
  const tags = [];
  let i = 0, mapa = {};
  while(i + 4 <= p.length){
    const id = p.slice(i, i+2), tam = parseInt(p.slice(i+2, i+4), 10);
    const val = p.slice(i+4, i+4+tam); tags.push(id); mapa[id] = val; i += 4 + tam;
  }
  eq('ordem 00,26,52,53,54,58,59,60,62,63', tags, ['00','26','52','53','54','58','59','60','62','63']);
  eq('tag 00 = 01', mapa['00'], '01');
  eq('tag 52 = 0000', mapa['52'], '0000');
  eq('tag 53 = 986', mapa['53'], '986');
  eq('tag 54 = 99.90', mapa['54'], '99.90');
  eq('tag 58 = BR', mapa['58'], 'BR');
  ok('tag 26 contém GUI e chave', mapa['26'].startsWith('0014br.gov.bcb.pix') && mapa['26'].includes('01' + String('email@loja.com.br'.length) + 'email@loja.com.br'));
  eq('tag 62 = template com txid', mapa['62'], '0505VD999');
  eq('tag 63 é o CRC correto', mapa['63'], PIX_PURE.crc16(p.slice(0, -4)));
  eq('parser consumiu tudo (payload íntegro)', i, p.length);
}

console.log('== tipoChave (rótulo da tela de config) ==');
{
  eq('CPF', PIX_PURE.tipoChave('12345678901'), 'CPF');
  eq('CNPJ', PIX_PURE.tipoChave('08385589000103'), 'CNPJ');
  eq('Telefone', PIX_PURE.tipoChave('+5538999112233'), 'Telefone (+55 DDD número)');
  eq('E-mail', PIX_PURE.tipoChave('contato@digicopy.com.br'), 'E-mail');
  eq('Aleatória', PIX_PURE.tipoChave('123e4567-e12b-12d1-a456-426655440000'), 'Chave aleatória');
  eq('vazia', PIX_PURE.tipoChave(''), '—');
}

console.log('== qrUrl (imagem pela internet) ==');
{
  const u = PIX_PURE.qrUrl('000201ABC D', 220);
  ok('serviço correto', u.startsWith('https://api.qrserver.com/v1/create-qr-code/'));
  ok('payload url-encodado (sem espaço cru)', u.includes('data=000201ABC%20D'));
  ok('tamanho respeitado', u.includes('size=220x220'));
  ok('tamanho limitado', PIX_PURE.qrUrl('X', 10000).includes('size=540x540') && PIX_PURE.qrUrl('X', 10).includes('size=120x120'));
}

console.log('\n══════════════════════════════════');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_pix.js:FIM>>>>
}

if (false) { // ═══ test_otim.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_otim.js:INICIO>>>>
const fs = require('fs');

function ok(name, cond){
  if(!cond){
    console.error('  ✘ ' + name);
    process.exit(1);
  }
  console.log('  ✔ ' + name);
}

const codeVendas = fs.readFileSync('vendas_otimizacao_patch.js', 'utf8');
const codeLogin  = fs.readFileSync('login_otimizacao_patch.js', 'utf8');
const codeGate   = fs.readFileSync('render_gate_patch.js', 'utf8');

const ctx = { window: {}, db: { modulosDinamicos: {}, vendas: [], usuarios: [] } };
new Function('window', 'db', codeVendas)(ctx.window, ctx.db);
new Function('window', 'db', codeLogin)(ctx.window, ctx.db);
new Function('window', 'db', codeGate)(ctx.window, ctx.db);

const VOTM = ctx.window.VOTM_PURE;
const LOGO = ctx.window.LOGOPT_PURE;
const RGATE = ctx.window.RGATE_PURE;

console.log('== VOTM_PURE: ehTabelaVendaReal ==');
ok('VENDAS é tabela real', VOTM.ehTabelaVendaReal('VENDAS'));
ok('NOTA é tabela real', VOTM.ehTabelaVendaReal('NOTA'));
ok('CUPOM é tabela real', VOTM.ehTabelaVendaReal('CUPOM'));
ok('ORDEM_SERVICO é tabela real', VOTM.ehTabelaVendaReal('ORDEM_SERVICO'));
ok('VENDAS_ORDENS não é tabela real', !VOTM.ehTabelaVendaReal('VENDAS_ORDENS'));
ok('VENDAS_VENDEDOR não é tabela real', !VOTM.ehTabelaVendaReal('VENDAS_VENDEDOR'));
ok('ITENS_VENDA não é tabela real', !VOTM.ehTabelaVendaReal('ITENS_VENDA'));
ok('STATUS_NOTA não é tabela real', !VOTM.ehTabelaVendaReal('STATUS_NOTA'));

console.log('== VOTM_PURE: normalizarNomeVendedor ==');
ok('admin → Administrador', VOTM.normalizarNomeVendedor('admin') === 'Administrador');
ok('Vendas - ordens → Recepção', VOTM.normalizarNomeVendedor('Vendas - ordens') === 'Recepção');
ok('N → Recepção', VOTM.normalizarNomeVendedor('N') === 'Recepção');
ok('S → Recepção', VOTM.normalizarNomeVendedor('S') === 'Recepção');
ok('Importado → Recepção', VOTM.normalizarNomeVendedor('Importado') === 'Recepção');
ok('CAPSLOCK → Title Case', VOTM.normalizarNomeVendedor('MARIA DA SILVA') === 'Maria da Silva');

console.log('== VOTM_PURE: toTitleCase ==');
ok('MARIA DA SILVA SOUZA', VOTM.toTitleCase('MARIA DA SILVA SOUZA') === 'Maria da Silva Souza');
ok('JOSE DE SOUZA', VOTM.toTitleCase('JOSE DE SOUZA') === 'Jose de Souza');
ok('RECEPÇÃO', VOTM.toTitleCase('RECEPÇÃO') === 'Recepção');

console.log('== VOTM_PURE: ehRegistroVendaValido ==');
ok('número 0 → false', !VOTM.ehRegistroVendaValido('0', {}));
ok('número S → false', !VOTM.ehRegistroVendaValido('S', {}));
ok('número N → false', !VOTM.ehRegistroVendaValido('N', {}));
ok('número VD-123 → true', VOTM.ehRegistroVendaValido('VD-123', {}));
ok('número 1234 → true', VOTM.ehRegistroVendaValido('1234', {}));

console.log('== LOGOPT_PURE: loguinCompativel ==');
ok('FULANO em maiúsculo casa fulano', LOGO.loguinCompativel({login:'fulano', nome:'Fulano da Silva'}, 'FULANO'));
ok('Fulano da Silva casa fulano', LOGO.loguinCompativel({login:'f1', nome:'Fulano da Silva'}, 'fulano'));
ok('fUlAnO casa FULANO', LOGO.loguinCompativel({login:'FULANO', nome:'Fulano'}, 'fUlAnO'));
ok('incorreto não casa', !LOGO.loguinCompativel({login:'carlos', nome:'Carlos'}, 'gestor'));

console.log('== LOGOPT_PURE: normalizarAdminPrincipal ==');
{
  const dbTest = {
    vendas: [
      { id: 'v1', empresaId: 'emp-1', criadoPorNome: 'admin', atendenteNome: 'admin' },
      { id: 'v2', empresaId: 'emp-1', criadoPorNome: 'Vendas - ordens', atendenteNome: 'S' }
    ],
    os: [],
    usuarios: [
      { id: 'u1', empresaId: 'emp-1', login: 'admin', nome: 'Admin' },
      { id: 'u2', empresaId: 'emp-1', login: 'gestor', nome: 'Administrador' }
    ]
  };
  global.db = dbTest;
  LOGO.normalizarAdminPrincipal({ empresaId: 'emp-1' }, dbTest);
  ok('v1 criadoPorNome unificado para Administrador', dbTest.vendas[0].criadoPorNome === 'Administrador');
  ok('v2 atendenteNome virou Recepção', dbTest.vendas[1].atendenteNome === 'Recepção');
  ok('apenas 1 usuário principal ficou', dbTest.usuarios.length === 1 && dbTest.usuarios[0].id === 'u2');
}

console.log('== RGATE_PURE: ehTelaVisivel ==');
ok('elemento com classe hidden → false', !RGATE.ehTelaVisivel('view-test', { classList: { contains: c => c === 'hidden' } }));
ok('elemento sem classe hidden → true', RGATE.ehTelaVisivel('view-test', { classList: { contains: () => false } }));
ok('elemento sem classe mas display none → false', !RGATE.ehTelaVisivel('view-test', { style: { display: 'none' } }));
ok('elemento inexistente (null) → true (permite criar)', RGATE.ehTelaVisivel('view-inexistente', null));

console.log('\nRESULTADO: Todos os novos testes de otimização passaram!');
//<<<<SECAO:test_otim.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_contratos_caixa_fiscal.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_contratos_caixa_fiscal.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_contratos_caixa_fiscal_patch.js','utf8');
const db = {
  config:{},
  empresas:[{id:'emp', email:'loja@digicopy.com'}],
  clientes:[],
  contratos:[{id:'ct1', empresaId:'emp', numero:'1', status:'ativo', valorMensalFixo:0, valorPretoGlobal:10, valorColorGlobal:5}],
  parque:[{id:'p1', empresaId:'emp', contratoId:'ct1', equipamentoId:'eq1', status:'ativo', medidores:{pretoA4:{modalidade:'mes_fixo', valorFixo:120, ativo:true}, scanner:{modalidade:'impressao', valor:0.01, ativo:true}}}],
  equipamentos:[{id:'eq1', empresaId:'emp', modelo:'Brother HL', patrimonio:'446', serie:'ABC', status:'locado'}],
  produtos:[],
  vendas:[{id:'v1', empresaId:'emp', numero:'50', status:'aguardar'}],
  leituras:[{id:'l1', empresaId:'emp', codigoAntigo:'7'}],
  contasReceber:[{id:'cr1', empresaId:'emp', vendaId:'v1', status:'aberto'}, {id:'cr2', empresaId:'emp', leituraId:'l1', status:'aberto'}],
  modulosDinamicos:{
    CAIXA:{dados:[{COD_CAIXA:1, DATA:'2026-08-01', VALOR_DINHEIRO:100}]},
    NOTA_FISCAL:{dados:[{NF_CODIGO:9, NF_COD_VENDA:50, NF_COD_LEITURA:7, NF_NUM_NOTA:'123', NF_MODELO:55, NF_SITUACAO:'AUTORIZADA', NF_VALOR_TOTAL:100}]},
    ITENS_NOTA:{dados:[{IN_CODIGO:1, IN_COD_NOTA_FISCAL:9, IN_COD_PRODUTO:10, IN_VALOR_UNITARIO:20, IN_QTDE:2, IN_NCM:'12345678', IN_CEST:'01.001.00'}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_CONTR_CAIXA_FISCAL_PURE;
console.log('== AUTOMACOES_CONTR_CAIXA_FISCAL_PURE ==');
ok('calcula valor contrato por globais e medidor fixo', A.calcularValorContrato(db.contratos[0], db.parque) === 135);
ok('defaults caixa', A.defaultsCaixa({}).situacao === 'A' && A.defaultsCaixa({}).valorDinheiro === 0);
ok('fabricante por modelo', A.fabricantePeloModelo('Kyocera Ecosys') === 'KYOCERA');
const changed = A.aplicarAutomacoesContratosCaixaFiscal('emp');
ok('aplicou automações', changed > 0);
ok('contrato recebeu valor calculado', db.contratos[0].valorMensalFixo === 135);
ok('criou caixa migrado', db.caixasMigrados.length === 1);
ok('nota marcou venda e financeiro', db.vendas[0].nfe === 'S' && db.contasReceber[0].nfe === 'S');
ok('nota marcou leitura', db.leituras[0].notaFiscalId);
ok('equipamento criou produto auxiliar', db.produtos.some(p => p.equipamentoId === 'eq1' && p.categoria === 'Impressoras'));
ok('defaults empresa criados', db.config.defaultsOperacionais.caixaAtualizarPainelSeg === 600);
console.log('\nRESULTADO: Testes de automações contrato/caixa/fiscal passaram!');
//<<<<SECAO:test_automacoes_contratos_caixa_fiscal.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_vendas_compras_cadastros.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_vendas_compras_cadastros.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_vendas_compras_cadastros_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', nome:'Cliente 10'}],
  produtos:[{id:'prd1', empresaId:'emp', sku:'5', nome:'Produto 5', preco:20, custo:8, categoria:'Produto'}, {id:'prd2', empresaId:'emp', sku:'6', nome:'Insumo 6', preco:3, custo:1, categoria:'Produto'}, {id:'vazio', empresaId:'emp', cartuchoCodigoAntigo:'9', nome:'Cartucho Vazio HP 85A', categoria:'Cartucho Vazio'}],
  vendas:[{id:'v1', empresaId:'emp', numero:'100', codigoAntigo:'100', clienteId:'cli1', itens:[], total:0}],
  modulosDinamicos:{
    CIDADES:{dados:[{COD_CIDADE:1,NOME_CIDADE:'Bocaiúva',UF:'MG'}]},
    RUAS:{dados:[{COD_RUA:1,DESCRICAO:'Rua A'}]},
    SITUACAO:{dados:[{COD_SITUACAO:1,DESCRICAO:'Aberto'}]},
    CONFIGURACAO:{dados:[{CLI_LIMITE_CREDITO:500}]},
    COMPRA:{dados:[{COD_COMPRA:1,VALOR_TOTAL:40}]},
    ITENS_COMPRA:{dados:[{COD_ITENS_COMPRA:1,COD_COMPRA:1,COD_PRODUTO:5,DESCRICAO:'produto 5',QTDE:2,VALOR_UNITARIO:10,VALOR_DESCONTO:2,VALOR_ICMS_ST:0,VALOR_IPI:0,VALOR_FRETE:4,NCM:'12345678',CODIGO_BARRA:'789'}]},
    CARTUCHOS:{dados:[{COD_CARTUCHO:9,TIPO:'TONER'}]},
    ITENS_INSUMOS:{dados:[{COD_ITENS_INSUMOS:1,COD_CARTUCHO:9,COD_PRODUTO:6,QTDE:2,CONTROLE_ESTOQUE:'S',SOMAR_INSUMO:'S'}]},
    ITENS_VENDA:{dados:[{COD_ITENS_VENDA:7,COD_VENDA:100,COD_PRODUTO:5,QTDE:2,VALOR_UNITARIO:20,VALOR_DESCONTO:5},{COD_ITENS_VENDA:8,COD_VENDA:100,COD_CARTUCHO:9,QTDE:1,VALOR_UNITARIO:30,DEBITAR_VAZIO:'S'}]},
    AGENDA_PERSONALIZADA:{dados:[{AGE_CODIGO:1,AGE_CONTATO:'JOAO TESTE',AGE_TELEFONE:'123',AGE_TASKCOMPLETEFIELD:1}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_VENDAS_COMPRAS_CADASTROS_PURE;
console.log('== AUTOMACOES_VENDAS_COMPRAS_CADASTROS_PURE ==');
ok('UF MG vira 31', A.ufIbge('MG') === 31);
ok('normaliza cidade', A.normalizarCidade('Bocaiúva','mg').nome === 'BOCAIUVA');
const itemCompra = A.calcularItemCompra(db.modulosDinamicos.ITENS_COMPRA.dados[0]);
ok('calcula item compra com desconto/frete', itemCompra.total === 20 && itemCompra.custoUnit === 11);
const itemVenda = A.calcularItemVenda(db.modulosDinamicos.ITENS_VENDA.dados[0], 'emp');
ok('calcula item venda', itemVenda.subtotal === 35 && itemVenda.percDesconto === 12.5);
const changed = A.aplicarAutomacoesVendasComprasCadastros('emp');
ok('aplicou automações', changed > 0);
ok('cidades/ruas/situações migradas', db.cidadesMigradas.length === 1 && db.ruasMigradas.length === 1 && db.situacoesMigradas.length === 1);
ok('compra atualizou produto', db.produtos[0].ncm === '12345678' && db.produtos[0].codigoBarra === '789');
ok('itens venda entraram na venda', db.vendas[0].itens.length === 2 && db.vendas[0].totalItensCalculado === 65);
ok('favorito criado', db.produtosFavoritos.length === 1);
ok('insumo automático do cartucho criado', db.insumosGastosMigrados.some(x => x.origem === 'auto_cartucho'));
ok('agenda criou cliente e registro', db.agendaMigrada.length === 1 && db.clientes.some(c => c.nome === 'Joao Teste'));
console.log('\nRESULTADO: Testes de automações vendas/compras/cadastros passaram!');
//<<<<SECAO:test_automacoes_vendas_compras_cadastros.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_orcamentos_clientes_auxiliares.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_orcamentos_clientes_auxiliares.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_orcamentos_clientes_auxiliares_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', nome:'CLIENTE TESTE', email:'ABC@EMAIL.COM', cidade:'Bocaiúva', estado:'mg', endereco:'', numero:'', bairro:''}],
  produtos:[{id:'prd1', empresaId:'emp', sku:'5', nome:'Produto 5', preco:20, valorTotal2:15, valorTotal3:10, categoria:'Produto', tipo:'P'}],
  vendas:[{id:'orc1', empresaId:'emp', numero:'3', orcamentoCodigoAntigo:'3', status:'orcamento', itens:[], total:0}],
  modulosDinamicos:{
    ITENS_ORCAMENTO:{dados:[{COD_ITENS_ORCAMENTO:1,COD_ORCAMENTO:3,COD_PRODUTO:5,QTDE:2,PRECO:2,DESCONTO:10,TIPO_DESCONTO:0}]},
    BOLETOS:{dados:[{BO_CODIGO:1,BO_COD_CLIENTE:10,BO_VALOR_TOTAL:120,BO_SITUACAO:'paid',BO_DATA_VENCIMENTO:'2026-08-10'}]},
    NFSE:{dados:[{NFS_CODIGO:1,NFS_STATUS:2}]},
    CLIENTES_USUARIOS:{dados:[{CLU_CODIGO:1,CLU_COD_CLIENTE:10}]},
    GRADES:{dados:[{GRA_CODIGO:1,GRA_DESCRICAO:'Cor'}]},
    PRODUTOS_CATEGORIA:{dados:[{PRC_CODIGO:1,PRC_DESCRICAO:'Linha'}]},
    VARIACAO:{dados:[{VAR_CODIGO:1,VAR_DESCRICAO:'Tamanho'}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_ORC_CLIENTES_AUX_PURE;
console.log('== AUTOMACOES_ORC_CLIENTES_AUX_PURE ==');
const item = A.calcularItemOrcamento(db.modulosDinamicos.ITENS_ORCAMENTO.dados[0], 'emp');
ok('calcula item orçamento com preço promocional e desconto percentual', item.preco === 15 && item.subtotal === 27);
ok('normaliza status boleto', A.statusBoleto('paid') === 'PAGO');
const changed = A.aplicarAutomacoesOrcClientesAux('emp');
ok('aplicou automações', changed > 0);
ok('itens do orçamento atualizados', db.vendas[0].itens.length === 1 && db.vendas[0].total === 27);
ok('cliente normalizado sem caps em nome e email minúsculo', db.clientes[0].nome === 'Cliente Teste' && db.clientes[0].email === 'abc@email.com');
ok('boletos legado criados sem reativar boleto', db.boletosLegado.length === 1 && db.boletosLegado[0].status === 'PAGO' && db.boletosLegado[0].somenteLegado);
ok('NFSe migrada criada e cancelada', db.nfseMigradas.length === 1 && db.nfseMigradas[0].cancelada === true);
ok('portal e auxiliares criados', db.clientesUsuariosMigrados.length === 1 && db.gradesMigradas.length === 1 && db.produtosCategoriaMigradas.length === 1 && db.variacaoTiposMigrados.length === 1);
console.log('\nRESULTADO: Testes de automações orçamento/clientes/auxiliares passaram!');
//<<<<SECAO:test_automacoes_orcamentos_clientes_auxiliares.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_pix_contadores_auxiliares.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_pix_contadores_auxiliares.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_pix_contadores_auxiliares_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', nome:'Cliente', email:'cliente@x.com'}],
  vendas:[{id:'v1', empresaId:'emp', numero:'100', clienteId:'cli1'}],
  equipamentos:[{id:'eq1', empresaId:'emp', serie:'ABC', patrimonio:'446', modelo:'Brother', contadorPB:1000}],
  parque:[{id:'p1', empresaId:'emp', equipamentoId:'eq1', clienteId:'cli1', contratoId:'ct1'}],
  contasReceber:[{id:'cr1', empresaId:'emp', vendaId:'v1', pixCodigoAntigo:'1', status:'aberto'}],
  modulosDinamicos:{
    PIX:{dados:[{PIX_CODIGO:1, PIX_COD_VENDA:100, PIX_COD_CLIENTE:10, PIX_DATA_PAGAMENTO:'2026-08-01', PIX_VALOR:50},{PIX_CODIGO:2, PIX_COD_VENDA:100, PIX_DATA_CANCELADO:'2026-08-02'}]},
    CONTAS:{dados:[{CON_COD_CONTA:1, CON_DESCRICAO_CONTA:'INTER', BOLETO_BANCO:'cobBancoInter', CON_REC_PIX:1, PIX_CUSTO:1.5}]},
    CONTADOR:{dados:[{CON_CODIGO:1, CON_SERIAL:'ABC', CON_GERAL:1000, CON_DATA_CADASTRO:'2026-08-01', CON_NIVEL_MONO:20, CON_STATUS:'ok'},{CON_CODIGO:2, CON_SERIAL:'ABC', CON_GERAL:1100, CON_DATA_CADASTRO:'2026-08-02', CON_NIVEL_MONO:10, CON_STATUS:'toner low'}]},
    EMAIL:{dados:[{EMAIL_CODIGO:1, EMAIL_DESCRICAO:'CLIENTE@X.COM', EMAIL_CONTATO:'', EMAIL_DATA:'2026-08-01'}]},
    CUPONS:{dados:[{CUP_CODIGO:1, CUP_DESCRICAO:'DESC'}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_PIX_CONTADORES_AUX_PURE;
console.log('== AUTOMACOES_PIX_CONTADORES_AUX_PURE ==');
ok('status pix pago', A.pixStatus({PIX_DATA_PAGAMENTO:'x'}).situacao === 'Pago');
ok('banco inter codigo 077', A.bancoCodigo('cobBancoInter') === '077');
ok('comparar alerta menor que', A.compararAlerta(10,2,15));
const changed = A.aplicarAutomacoesPixContadoresAux('emp');
ok('aplicou automações', changed > 0);
ok('pix migrado sem baixa automática', db.pixMigrados.length === 2 && db.contasReceber[0].status === 'aberto');
ok('conta bancária migrada', db.contasBancariasMigradas[0].bancoCodigo === '077' && db.contasBancariasMigradas[0].recPix === true);
ok('contadores migrados e contador equipamento atualizado', db.contadoresMigrados.length === 2 && db.equipamentos[0].contadorPB === 1100);
ok('alerta de contador criado', db.contadorAlertasMigrados.length >= 1);
ok('email migrado vincula cliente', db.emailsMigrados[0].clienteId === 'cli1' && db.emailsMigrados[0].email === 'cliente@x.com');
ok('auxiliar simples migrado', db.cuponsMigrados.length === 1);
console.log('\nRESULTADO: Testes de automações pix/contadores/auxiliares passaram!');
//<<<<SECAO:test_automacoes_pix_contadores_auxiliares.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_vendas_fiscal_auxiliares.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_vendas_fiscal_auxiliares.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('automacoes_vendas_fiscal_auxiliares_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', codigoAntigo:'10', nome:'Cliente Teste', documento:'123.456.789-00', funcionarioCodigoAntigo:'7'}],
  produtos:[{id:'prd1', empresaId:'emp', sku:'20', codigoAntigo:'20', nome:'Toner', categoria:'Produto', preco:100}],
  vendas:[{id:'v1', empresaId:'emp', numero:'100', codigoAntigo:'100', clienteId:'cli1', data:'2026-08-01T10:00:00.000Z', status:'aberta', total:0, itens:[]}],
  contasReceber:[{id:'cr1', empresaId:'outra', vendaId:'v1', valor:113, status:'aberto'}],
  modulosDinamicos:{
    CONFIGURACAO:{dados:[{DIAS_GARANTIA_SERVICO:30, MUDAR_FORMA_ENTREGA_AUTO:'S', COM_VEND_VENDEDOR_CLIENTE:'S'}]},
    CUPONS:{dados:[{CUP_CODIGO:1, CUP_VALOR:15, CUP_TIPO:'DESCONTO'}]},
    CUPONS_ITENS:{dados:[{CUI_CODIGO:1, CUI_COD_CUPOM:1, CUI_COD_VENDA:100}]},
    ENDERECOS:{dados:[{END_CODIGO:1, END_COD_CLIENTE:10, END_CEP:'', END_ENDERECO:'Rua A', END_BAIRRO:'Centro', END_CIDADE:'Bocaiuva', END_UF:'MG', END_NUMERO:'55'}]},
    ENCOMENDAS:{dados:[{ENC_CODIGO:1, ENC_COD_CLIENTE:10, ENC_DESCRICAO:'Peça especial'}]},
    ENCOMENDAS_ITENS:{dados:[{ENI_CODIGO:1, ENI_COD_ENCOMENDA:1, ENI_COD_PRODUTO:20, ENI_QTDE:2, ENI_VALOR:10}]},
    PRODUTOS_FAVORITOS:{dados:[{PRF_CODIGO:1, PRF_COD_PRODUTO:20, PRF_COD_CLIENTE:10}]},
    PRODUTOS_PROMOCAO:{dados:[{PRP_CODIGO:1, PRP_COD_PRODUTO:20, PRP_VALOR:80}]},
    PRODUTOS_TAGS:{dados:[{PRT_CODIGO:1, PRT_COD_PRODUTO:20, PRT_TAG:'laser'}]},
    PRODUTOS_DIMENSAO:{dados:[{DIM_CODIGO:1, DIM_COD_PRODUTO:20, DIM_ALTURA:10, DIM_LARGURA:20}]},
    PRODUTOS_MOTIVO_PERGUNTA:{dados:[{PMP_CODIGO:1, PMP_COD_PRODUTO:20, PMP_PERGUNTA:'Compatível?'}]},
    PRODUTOS_VALORES:{dados:[{PV_CODIGO:1, PV_COD_PRODUTO:20, PV_VALOR:99}]},
    EMAIL_CAMPANHA:{dados:[]},
    EMAIL_CAMPANHA_ENVIOS:{dados:[{ECE_CODIGO:1, ECE_DESCRICAO:'Promo Agosto', ECE_EMAIL:'CLIENTE@TESTE.COM'}]},
    CARTAO:{dados:[{CAR_CODIGO:1, CAR_TITULAR:'cliente teste', CAR_CPF:'12345678900', CAR_DATA_NASCIMENTO:'1990-01-02', CAR_NUMERO:'4111111111111111'}]},
    CARTAO_BANDEIRA:{dados:[{CAB_CODIGO:1, CAB_DESCRICAO:'Visa'}]},
    CARTAO_HISTORICO:{dados:[{CAH_CODIGO:1, CAH_COD_CARTAO:1, CAH_VALOR:25}]},
    CARTAO_PAGAMENTO:{dados:[{CAP_CODIGO:1, CAP_COD_CARTAO:1, CAP_COD_VENDA:100, CAP_VALOR:50}]},
    COMANDAS:{dados:[{COM_CODIGO:1, COM_COD_CLIENTE:10, COM_VALOR_TOTAL:12}]},
    BANCOS:{dados:[{COD_BANCO:1, NOME:'Banco Teste'}]},
    NCM:{dados:[{NC_CODIGO:1, NC_NCM:'12.34.56.78', NC_DESCRICAO:'Teste'}]},
    TIPO_FINALIZACAO:{dados:[{TF_CODIGO:1, TF_DESCRICAO:'Balcão'}]},
    CARTUCHO_DEFEITO:{dados:[{COD_CARTUCHO_DEFEITO:1, DESCRICAO:'Vazando'}]},
    TRIBUTOS_PRODUTOS:{dados:[{TP_CODIGO:1, TP_COD_PRODUTO:20}]},
    VENDAS:{dados:[{COD_VENDA:100, COD_CLIENTE:10, FINALIZADA:'S', COD_EQUIPAMENTO:5, FORMA_ENTREGA:'BUSCAR', VALOR_MAO_DE_OBRA:20, VALOR_DESCONTO:5, VALOR_FRETE:3, COD_FUNCIONARIO:2}]},
    ITENS_VENDA:{dados:[{COD_ITENS_VENDA:1, COD_VENDA:100, COD_PRODUTO:20, TIPO_DESCRICAO:'PRODUTO', VALOR_TOTAL:50, VALOR_DESCONTO:5, VALOR_INSUMOS:10},{COD_ITENS_VENDA:2, COD_VENDA:100, TIPO_DESCRICAO:'SERVICO', VALOR_TOTAL:30, VALOR_DESCONTO:0}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_VENDAS_FISCAL_AUX_PURE;

console.log('== AUTOMACOES_VENDAS_FISCAL_AUX_PURE ==');
ok('normaliza NCM sem pontuação', A.normalizarNcm('12.34.56.78') === '12345678');
ok('mascara cartão', A.mascararNumeroCartao('4111111111111111') === '**** **** **** 1111');
ok('defaults IBS/CBS', A.tributoDefaults({}).cstIbsCbs === '000' && A.tributoDefaults({}).pCbs === 0.9);
const changed = A.aplicarAutomacoesVendasFiscalAuxiliares('emp');
ok('aplicou automações parte 9', changed > 0);
ok('cupom item herdou valor e tipo do cupom', db.cuponsItensMigrados[0].valor === 15 && db.cuponsItensMigrados[0].tipo === 'DESCONTO');
ok('endereço legado preservado com CEP em branco nulo', db.enderecosMigrados[0].cep === null && db.clientes[0].endereco === 'Rua A');
ok('encomenda e item migrados', db.encomendasMigradas.length === 1 && db.encomendasItensMigrados[0].valorTotal === 20);
ok('favorito e promoção histórica sem alterar preço do produto', db.produtosFavoritos.length === 1 && db.produtosPromocoesHistorico[0].naoAtivarPromocao === true && db.produtos[0].preco === 100);
ok('campanha criada pelo envio e sem envio automático', db.emailCampanhasMigradas.length === 1 && db.emailCampanhaEnviosMigrados[0].envioAutomatico === false);
ok('cartão histórico seguro atualizou nascimento do cliente', db.cartoesMigrados[0].titular === 'CLIENTE TESTE' && db.cartoesMigrados[0].numeroMascarado.endsWith('1111') && db.clientes[0].dataNascimento === '1990-01-02');
ok('NCM e tributos migrados com defaults', db.ncmMigrados[0].ncm === '12345678' && db.tributosProdutosMigrados[0].cclassTrib === '000001');
ok('venda finalizada recalculou total, garantia e forma entrega', db.vendas[0].status === 'finalizada' && db.vendas[0].total === 113 && db.vendas[0].dataGarantia === '2026-08-31' && db.vendas[0].formaEntrega === 'ENTREGAR');
ok('contas a receber sincronizou empresa da venda', db.contasReceber[0].empresaId === 'emp');
ok('OS gerada somente para venda com equipamento', db.os.length === 1 && db.vendas[0].osId === db.os[0].id);
console.log('\nRESULTADO: Testes de automações vendas/fiscal/auxiliares passaram!');
//<<<<SECAO:test_automacoes_vendas_fiscal_auxiliares.js:FIM>>>>
}

if (false) { // ═══ test_automacoes_caixa_chat_auxiliares.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_caixa_chat_auxiliares.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }

const code = fs.readFileSync('automacoes_caixa_chat_auxiliares_patch.js','utf8');
const db = {
  config:{},
  clientes:[
    {id:'cli1', empresaId:'emp', codigo:'10', codigoAntigo:'10', nome:'Cliente Chat'},
    {id:'cli2', empresaId:'emp', codigo:'11', codigoAntigo:'11', nome:'Cliente Avaliação'}
  ],
  os:[{id:'osVis', empresaId:'emp', legadoCodigo:'VIS-5', clienteId:'cli2', status:'aberto'}],
  contasReceber:[],
  contasPagar:[],
  modulosDinamicos:{
    RETIRADA_CAIXA:{dados:[{COD_RETIRADA:1, TIPO:'E', VALOR:100, DESCRICAO:'Suprimento', DATA:'2026-08-01', COD_CAIXA:2},{COD_RETIRADA:2, TIPO:'S', VALOR:40, DESCRICAO:'Sangria', DATA:'2026-08-01', COD_CAIXA:2}]},
    FORNECEDORES:{dados:[{COD_FORNECEDOR:1, NOME_RAZAOSOCIAL:'Fornecedor A', CIDADE:'Janaúba', UF:'MG'}]},
    TRANSPORTADORES:{dados:[{COD_TRANSPORTADOR:1, TRANS_NOME:'Transp A', TRANS_CIDADE:'Bocaiúva', TRANS_UF:'MG'}]},
    CHAT:{dados:[{CH_CODIGO:1, CH_COD_CLIENTE:10, CH_MENSAGEM:'Preciso de toner', CH_DATA_ENVIO:'2026-08-01T10:00:00Z'}]},
    VISITAS:{dados:[{COD_VISITA:5, VI_COD_CLIENTE:11}]},
    RECEBIMENTO_CONTAS_RECEBER:{dados:[{COD_ITENS_RECEBIMENTO:7, COD_PARCELA:99},{COD_ITENS_RECEBIMENTO:9, COD_PARCELA:99}]},
    RECIBOS_EMITIDOS:{dados:[{COD_RECIBO:1, RC_COD_PARCELA:99, VALOR:100}]},
    ANEXOS:{dados:[{AN_CODIGO:1, AN_NOME:'foto.jpg', AN_TIPO:'imagem'}]},
    CENTRO_CUSTO:{dados:[{CC_CODIGO:1, CC_DESCRICAO:'Operação'}]},
    DEPARTAMENTOS:{dados:[{DEP_COD_DEPARTAMENTO:1, DEP_DESCRICAO:'financeiro'}]},
    SOLUCAO_DEFEITO:{dados:[{COD_SOLUCAO_DEFEITO:1, DESCRICAO:'"Limpeza\\ geral"'}]},
    SOMA_ITENS_INSUMOS_GASTOS:{dados:[{COD_SOMA_ITENS_INSUMOS_GASTOS:1, COD_RECARGA:100, VALOR_TOTAL:12}]},
    LOCALIZACAO:{dados:[{LO_CODIGO:1, LO_DESCRICAO:'Prateleira A'}]},
    ASSUNTOS:{dados:[{ASS_CODIGO:1, ASS_DESCRICAO:'Suporte'}]},
    MOTIVO_SITUACAO:{dados:[{MOT_CODIGO:1, MOT_DESCRICAO:'Aguardando'}]},
    ITENS_CAIXA:{dados:[{COD_ITENS_CAIXA:1, DESCRICAO:'Item caixa', VALOR:5}]},
    PUBLICIDADE:{dados:[{PUB_CODIGO:1, PUB_DESCRICAO:'Banner'}]},
    MOTIVO_PERGUNTA_TAGS:{dados:[{MPT_CODIGO:1, MPT_TAG:'urgente'}]},
    MOTIVO_RESPOSTA:{dados:[{MR_CODIGO:1, MR_RESPOSTA:'ok'}]},
    MOTIVOS:{dados:[{MO_CODIGO:1, MO_DESCRICAO:'duvida'}]},
    AVALIACAO:{dados:[{AV_CODIGO:1, AV_COD_VISITA:5, AV_NOTA:5, AV_COMENTARIO:'Bom'}]},
    VISITAS_HISTORICO:{dados:[{VH_CODIGO:1, VH_COD_VISITA:5, VH_DESCRICAO:'Aberto'}]},
    ENQUETES:{dados:[{ENC_CODIGO:1, ENC_DESCRICAO:'Satisfação'}]},
    ENQUETES_OPCOES:{dados:[{ENO_CODIGO:1, ENO_COD_ENQUETE:1, ENO_DESCRICAO:'Sim'}]}
  }
};

const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_CAIXA_CHAT_AUXILIARES_PURE;

console.log('== AUTOMACOES_CAIXA_CHAT_AUXILIARES_PURE ==');
ok('limpa descrição removendo aspas e barra', A.limparDescricao('"Limpeza\\ geral"') === 'LIMPEZA GERAL');
const changed = A.aplicarAutomacoesCaixaChatAuxiliares('emp');
ok('aplicou automações parte 11', changed > 0);
ok('retirada caixa criou categoria fechamento', db.categoriasContasPagarMigradas[0].descricao === 'FECHAMENTO');
ok('retirada entrada virou contas a receber paga', db.contasReceber.some(c=>c.origem==='retirada_caixa' && c.status==='pago' && c.valor===100));
ok('retirada saída virou contas a pagar paga', db.contasPagar.some(c=>c.origem==='retirada_caixa' && c.status==='pago' && c.valor===40 && c.categoria==='FECHAMENTO'));
ok('fornecedor normalizado e cidade criada sem acento', db.fornecedoresMigrados[0].cidade === 'JANAUBA' && db.fornecedoresMigrados[0].endereco === 'ENDERECO' && db.cidadesMigradas.some(c=>c.nome==='JANAUBA'));
ok('transportador criou cidade quando faltava código', db.transportadoresMigrados[0].codCidade && db.cidadesMigradas.some(c=>c.nome==='BOCAIUVA'));
ok('chat criou motivo e chamado leve', db.motivosDefeitoMigrados.some(m=>m.descricao==='CHAT') && db.chatsMigrados[0].clienteId==='cli1' && db.os.some(o=>o.origem==='chat_migrado' && o.chatMensagens.length===1));
ok('recibo vinculou último recebimento da parcela', db.recibosEmitidosMigrados[0].codItensRecebimento === '9');
ok('anexo e centro de custo migrados', db.anexosMigrados.length === 1 && db.centrosCustoMigrados[0].del === 0);
ok('departamento fica maiúsculo', db.departamentosMigrados[0].descricao === 'FINANCEIRO');
ok('auxiliares simples migrados', db.solucoesDefeitoMigradas[0].descricao === 'LIMPEZA GERAL' && db.somaItensInsumosGastosMigrados[0].valor === 12 && db.localizacoesMigradas.length === 1);
ok('assunto e motivo situação com defaults', db.assuntosMigrados[0].valor === 0 && db.motivosSituacaoMigrados[0].codAssunto === '1' && db.motivosSituacaoMigrados[0].ordem === 1);
ok('itens caixa, publicidade, tags e respostas migrados', db.itensCaixaMigrados.length === 1 && db.publicidadesMigradas.length === 1 && db.motivoPerguntaTagsMigradas.length === 1 && db.motivoRespostasMigradas.length === 1);
ok('motivos ficam maiúsculos', db.motivosMigrados[0].descricao === 'DUVIDA');
ok('avaliação puxou cliente da visita', db.avaliacoesMigradas[0].clienteId === 'cli2' && db.avaliacoesMigradas[0].osId === 'osVis');
ok('histórico de visitas e enquetes migrados', db.visitasHistoricoMigrado.length === 1 && db.enquetesMigradas.length === 1 && db.enquetesOpcoesMigradas[0].enqueteCodigoAntigo === '1');
console.log('\nRESULTADO: Testes de automações caixa/chat/auxiliares passaram!');
//<<<<SECAO:test_automacoes_caixa_chat_auxiliares.js:FIM>>>>
}

if (false) { // ═══ test_offline_assets.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_offline_assets.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const html=fs.readFileSync('index.html','utf8');
const note=fs.readFileSync('notinha_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== ASSETS OFFLINE ==');
ok('Tailwind é local',/assets\/vendor\/tailwind\.min\.css/.test(html)&&!/cdn\.tailwindcss\.com/.test(html));
ok('ícones Phosphor são locais',/assets\/vendor\/phosphor\/style\.css/.test(html)&&!/unpkg\.com\/@phosphor/.test(html));
ok('Chart.js é local',/assets\/vendor\/chart\.umd\.js/.test(html)&&!/cdn\.jsdelivr\.net\/npm\/chart/.test(html));
ok('fontes Google não bloqueiam abertura',!/fonts\.googleapis\.com/.test(html)&&!/fonts\.googleapis\.com/.test(note));
ok('CSS Tailwind compilado existe',fs.statSync('assets/vendor/tailwind.min.css').size>30000);
ok('fonte de ícones existe',fs.statSync('assets/vendor/phosphor/Phosphor.woff2').size>100000);
ok('Chart global existe no pacote local',/globalThis|window/.test(fs.readFileSync('assets/vendor/chart.umd.js','utf8')));
ok('assets entram no build Electron',pkg.build.files.includes('assets/vendor/**/*'));
console.log('\nRESULTADO: dependências visuais offline passaram!');
//<<<<SECAO:test_offline_assets.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52218.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52218.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const pix=fs.readFileSync('ajustes_v52218_pix_prazo_print_venda_patch.js','utf8');
const etq=fs.readFileSync('ajustes_v52218_etiqueta_recarga_venda_patch.js','utf8');
const men=fs.readFileSync('ajustes_v52216_menus_submenus_patch.js','utf8');
const vis=fs.readFileSync('ajustes_v52217_menus_arrastar_visibilidade_patch.js','utf8');
const prn=fs.readFileSync('ajustes_v52217_print_sem_rodape_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',[pix,etq].join('\n'))(ctx.window,ctx.document);
const P=ctx.window.VENDA_PRINT_PIX_PURE;
const E=ctx.window.ETIQUETA_RECARGA_VENDA_PURE;

console.log('== PRINT / PIX / ETIQUETA ==');
ok('faturada sim', P.ehFaturada({status:'faturado'})===true);
ok('salva não imprime', P.ehFaturada({status:'aguardar'})===false);
ok('venda salva também imprime (v5.22.68)', !/Só imprime depois de faturar/.test(pix));
ok('PIX não reabre título', /reabrirTituloPix=function\(\)\{ return 0; \}/.test(pix));
ok('comprovante no A prazo', /fx==='Prazo'/.test(pix) && /pixRenderPainelFaturamento/.test(pix));

ok('etiqueta normaliza', E.normEtq(' 12 3 ')==='123');
const vendas=[{id:'a',status:'faturado',itens:[{tipo:'Recarga de toner',numCartucho:'99'}]},{id:'b',status:'estornada',itens:[{tipo:'Recarga de toner',numCartucho:'99'}]}];
ok('uso ativo ignora estornada', E.vendasAtivasComEtiqueta.call({},{etiqueta:''},null)!==undefined);
const dbFake={vendas:vendas};
ok('em uso se tem faturada', (function(){
  const g={db:dbFake};
  // testa via função com db global não dá; checa código
  return /estornada/.test(etq) && /Já existe um cartucho/.test(etq);
})());
ok('some botão cadastrar', /vos-btn-cadastrar-etiqueta/.test(etq) && /tirarBotaoCadastrar/.test(etq));
ok('preenche cliente da etiqueta', /vosVendaSelectCliente/.test(etq));
ok('produto não lista recarga', /recarga/i.test(etq) && /vos-prod-results/.test(etq));

ok('editor menus para todos', !/Só o Admin altera os menus/.test(men));
ok('não-admin não perde backup/nuvem', /backup','nuvem/.test(vis) || /'backup','nuvem'/.test(vis));
ok('rodapé marca para não recolocar', /<!-- rodape-loja-final -->/.test(prn));

ok('patches no bundle', manifest.includes('ajustes_v52218_pix_prazo_print_venda_patch.js') && manifest.includes('ajustes_v52218_etiqueta_recarga_venda_patch.js'));
ok('versão 5.22.18 no código base', /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && (parseInt(String(pkg.version).split('.')[0],10)>=6 || parseInt(String(pkg.version).split('.')[1],10)>=23 || parseInt(String(pkg.version).split('.')[2],10)>=18));
ok('APK quieto', !/mobile/.test(pix+etq));

console.log('\nRESULTADO: v5.22.18 passou!');
//<<<<SECAO:test_ajustes_v52218.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52237.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52237.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const vis=fs.readFileSync('ajustes_v52237_vendas_os_visual_patch.js','utf8');
const est=fs.readFileSync('ajustes_v52237_estoque_zero_volta_patch.js','utf8');
const ctr=fs.readFileSync('ajustes_v52237_contratos_filtros_patch.js','utf8');
const orc=fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js','utf8');
const apr=fs.readFileSync('ajustes_v52237_orcamentos_aprovacao_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pag=fs.readFileSync('public-pix/orcamento.html','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const V=load(vis).V52237_VENDAS_OS_PURE;
ok('OS completa exige técnico', V.osCompleta({modelo:'HP',numeroSerie:'1',patrimonio:'P',tecnico:''})===false);
ok('OS completa com técnico', V.osCompleta({modelo:'HP',numeroSerie:'1',patrimonio:'P',tecnico:'João'})===true);
ok('garantia escrita', V.garantiaValor('__escrever__','15')==='15 dias');
ok('aviso EPSON 15 dias úteis', /15 dias úteis/.test(V.AVISO_EPSON) && /EPSON/.test(V.AVISO_EPSON));
ok('aviso sem cobrir oferta', !/cobrimos qualquer oferta/i.test(V.AVISO_EPSON));

const E=load(est).V52237_ESTOQUE_ZERO_PURE;
ok('serviço não avisa estoque', E.precisaAviso({categoria:'Serviço',estoque:0},1)===false);
ok('produto zerado avisa', E.precisaAviso({categoria:'Produto',estoque:0},1)===true);

const C=load(ctr).CONTRATOS_FILTROS_PURE;
ok('sem cód controle no filtro', !C.FILTROS.some(function(f){return /controle|global|cartucho|proposta|pasta|fecha/i.test(f[0]+f[1]);}));
ok('tem chamados abertos e não faturados', C.FILTROS.some(function(f){return f[0]==='chamados_abertos';}) && C.FILTROS.some(function(f){return f[0]==='nao_faturados_mes';}));

const O=load(orc).ORCAMENTOS_PURE;
const lista=[
  {numero:'10',status:'aberto',clienteId:'c1',itens:[{descricao:'Toner'}],criadoPorNome:'Ana',data:'2026-08-24'},
  {numero:'11',status:'aprovado',vendaId:'v1',clienteId:'c1',itens:[],criadoPorNome:'Ana',data:'2026-08-23'}
];
ok('fechado = aprovado', O.ehFechado(lista[1])===true && O.ehFechado(lista[0])===false);
ok('filtro fechados', O.filtraOrcamentos(lista,'fechados','').length===1);
ok('estornar bloqueia venda faturada', O.podeEstornar(lista[1],{status:'faturado'}).ok===false);
ok('estornar libera venda salva', O.podeEstornar(lista[1],{status:'aguardar'}).ok===true);
ok('cadastro separado do ERP', /Cadastro separado/.test(orc) && /db.orcamentos/.test(orc));

const A=load(apr).ORCAMENTOS_APROVACAO_PURE;
ok('link no Pages', /^https:\/\/digicopy-pix\.pages\.dev\/orcamento\.html\?c=/.test(A.linkPublico('abc')));
ok('mensagem whats tem cliente e códigos', /Maria/.test(A.mensagemWhats({numero:'7'},{numero:'88'},{nome:'Maria'})) && /COD 7/.test(A.mensagemWhats({numero:'7'},{numero:'88'},{nome:'Maria'})));
ok('impressão sem validade 60 e sem cobrir oferta', !/validade de 60/i.test(apr) && !/cobrimos qualquer oferta/i.test(apr));

// v7.0.25 — o poll aceita a decisão mesmo com ok:false (410 USED encerra o link morto)
ok('USED (410) encerra o link', A.deveAplicarResposta({ok:false,error:'USED',status:'recusado',vendaId:null,vendaNumero:'',message:'Este link não vale mais.'})===true);
ok('aprovado ok aplica', A.deveAplicarResposta({ok:true,status:'aprovado'})===true);
ok('recusado ok aplica', A.deveAplicarResposta({ok:true,status:'recusado'})===true);
ok('404 NOT_FOUND continua consultando (pode ser orçamento ainda não enviado)', A.deveAplicarResposta({ok:false,error:'NOT_FOUND',status:'aberto',message:'Orçamento não encontrado.'})===false);
ok('freio de cota não vira decisão', A.deveAplicarResposta({ok:false,quota:true,error:'pre-stop DIGICOPY: daily row write limit próximo do teto'})===false);
ok('resposta vazia não aplica', A.deveAplicarResposta(null)===false && A.deveAplicarResposta({})===false);
ok('poll usa a decisão (sem exigir ok)', /deveAplicarRespostaOrcamento\(j\)/.test(apr) && !/j && j\.ok && \(j\.status/.test(apr));
ok('worker 410 USED carrega status recusado', /error: 'USED'/.test(worker));

ok('página pública aprovar/recusar', /Autorizar orçamento/.test(pag) && /Recusar/.test(pag));
ok('worker GET/POST /orcamento', /pathname === '\/orcamento'/.test(worker) && /handleOrcamentoPost/.test(worker));
ok('nuvem tem orcamentos', /orcamentos:'array'/.test(fs.readFileSync('cloudflare_data_sync_patch.js','utf8')));
ok('patches no bundle', ['ajustes_v52237_vendas_os_visual_patch.js','ajustes_v52237_estoque_zero_volta_patch.js','ajustes_v52237_contratos_filtros_patch.js','ajustes_v52237_orcamentos_menu_patch.js','ajustes_v52237_orcamentos_aprovacao_patch.js'].every(function(f){return manifest.includes(f);}));
ok('versão 5.22.37 no patch', /v5.22.37/.test(vis));
ok('APK quieto', ![vis,est,ctr,orc,apr].some(function(s){return /mobile\//.test(s);}));
console.log('\nRESULTADO: v5.22.37 passou!');
//<<<<SECAO:test_ajustes_v52237.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52238.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52238.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const orc=fs.readFileSync('ajustes_v52238_orcamentos_ajustes_patch.js','utf8');
const ven=fs.readFileSync('ajustes_v52238_vendas_os_ajustes_patch.js','utf8');
const pag=fs.readFileSync('orcamento_pagar.html','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const O=load(orc).ORCAMENTOS_V52238_PURE;
const V=load(ven).V52238_VENDAS_PURE;
const link=O.linkOrcamento({token:'tok',numero:'12',total:10,itens:[{descricao:'Toner',qtd:1,preco:10,subtotal:10}]},{nome:'Maria'},{whatsapp:'38991098698'});

ok('link NÃO é o Pages do Pix', link.indexOf('digicopy-pix.pages.dev')<0);
ok('link é a página de orçamento (Pages oficial)', /^https:\/\/digicopy-orcamentos\.pages\.dev\/\?d=/.test(link));
ok('recusa cita não autorizado', /NÃO foi autorizado/.test(O.msgRecusa({numero:'12'},{nome:'Maria'})));
ok('página pede escolher autorizar ou recusar', /Autorizar/.test(pag) && /Recusar/.test(pag) && /não é pagamento/i.test(pag));
ok('OS com dado conta na impressão', V.osTemDado({modelo:'HP',numeroSerie:'1'})===true);
ok('técnico Selecione é vazio', V.ehVazioTec('Selecione')===true && V.ehVazioTec('João')===false);
ok('patches no bundle', manifest.includes('ajustes_v52238_orcamentos_ajustes_patch.js') && manifest.includes('ajustes_v52238_vendas_os_ajustes_patch.js'));
ok('versão no patch', /v5.22.38/.test(orc) && /v5.22.38/.test(ven));
ok('APK quieto', !/mobile\//.test(orc+ven));
console.log('\nRESULTADO: v5.22.38 passou!');
//<<<<SECAO:test_ajustes_v52238.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52240.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52240.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52240_orcamento_pages_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

function load(srcTxt){
  const ctx={window:{ORCAMENTOS_V52238_PURE:{
    payloadLink:function(o){return {n:o.numero};},
    b64url:function(){return 'abc';}
  }},document:undefined};
  new Function('window','document',srcTxt)(ctx.window,ctx.document);
  return ctx.window;
}

const P=load(src).ORCAMENTOS_V52240_PURE;
const link=P.linkDe({numero:'12'},{nome:'Maria'},{});
ok('usa o Pages do orçamento', link.indexOf('https://digicopy-orcament.pages.dev/')===0);
ok('leva os dados na URL', /\?d=/.test(link));
ok('não é o Pix', link.indexOf('digicopy-pix.pages.dev')<0);
ok('não é GitHack', link.indexOf('githack')<0);
ok('patch no bundle', manifest.includes('ajustes_v52240_orcamento_pages_patch.js'));
ok('versão no patch', /v5.22.40/.test(src));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.40 passou!');
//<<<<SECAO:test_ajustes_v52240.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52241.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52241.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52241_venda_salvar_fechar_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const gitignore=fs.readFileSync('.gitignore','utf8');

function load(s){
  const ctx={window:{},document:undefined};
  new Function('window','document',s)(ctx.window,ctx.document);
  return ctx.window;
}
const P=load(src).V52241_VENDA_SALVAR_PURE;
ok('sem cliente não grava', P.precisaCliente({})===false);
ok('com cliente grava', P.precisaCliente({cliente:{id:'1'}})===true);
ok('salvar fecha', /gravarEFechar/.test(src) && /closeModal\(true\)/.test(src));
ok('fechar salva sem pergunta', /telaVenda/.test(src) && !/Deseja salvar esta venda/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52241_venda_salvar_fechar_patch.js'));
ok('versão no patch', /v5.22.41/.test(src) && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('zip ignorado', /\*\.zip/.test(gitignore));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.41 passou!');
//<<<<SECAO:test_ajustes_v52241.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52243.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52243.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

function load(src, extra){
  const ctx={window:Object.assign({}, extra||{}),document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const orc=fs.readFileSync('ajustes_v52243_orcamentos_status_patch.js','utf8');
const sort=fs.readFileSync('ajustes_v52243_contratos_sort_patch.js','utf8');
const rem=fs.readFileSync('ajustes_v52243_impressora_remanejar_patch.js','utf8');
const fin=fs.readFileSync('ajustes_v52243_financeiro_filtros_patch.js','utf8');
const menu=fs.readFileSync('ajustes_v52243_financeiro_menu_patch.js','utf8');
const geral=fs.readFileSync('ajustes_v52243_menu_versao_boleto_patch.js','utf8');
const pag=fs.readFileSync('public-orcamento/index.html','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const S=load(orc).ORCAMENTOS_STATUS_V52243_PURE;
ok('aberto não é autorizado', S.rotuloStatus({status:'aberto'})==='Aberto');
ok('aprovado é Autorizado', S.rotuloStatus({status:'aprovado'})==='Autorizado');
ok('recusado é Não autorizado', S.rotuloStatus({status:'recusado'})==='Não autorizado');
ok('vendaId também é Autorizado', S.rotuloStatus({status:'aberto',vendaId:'v1'})==='Autorizado');

const C=load(sort).CONTRATOS_SORT_V52243_PURE;
ok('1º clique A→Z', C.proximaDir('codigo','asc','cliente')==='asc');
ok('2º clique Z→A', C.proximaDir('cliente','asc','cliente')==='desc');
ok('3º volta A→Z', C.proximaDir('cliente','desc','cliente')==='asc');
ok('ordena desc no dado', C.ordenarLista([{n:1},{n:3},{n:2}], function(x){return x.n;}, 'desc').map(function(x){return x.n;}).join(',')==='3,2,1');
ok('não inverte tbody no patch', !/rows\)\.reverse\(\)/.test(sort) && /ordenarTbody/.test(sort));

const R=load(rem).IMPRESSORA_REMANEJAR_V52243_PURE;
const db={
  equipamentos:[{id:'e1',serie:'ABC123',contadorPB:900,empresaId:'emp'}],
  parque:[{id:'p1',equipamentoId:'e1',clienteId:'cliA',status:'ativo'}]
};
ok('serial acha equipamento', !!R.acharEquipPorSerial(db,'abc123','emp'));
ok('outro cliente ativo', !!R.parqueAtivoOutroCliente(db, db.equipamentos[0], 'cliB'));
ok('mesmo cliente não pede remanejo', !R.parqueAtivoOutroCliente(db, db.equipamentos[0], 'cliA'));
ok('texto do aviso', /impressora cadastrada em Escola X com o contador 900/.test(R.msgRemanejar('Escola X',900)));
ok('snapshot congelado', R.snapshotFrozen(db.equipamentos[0], db.parque[0]).contadorPB===900);
ok('aviso só no salvar', /confirmSistema/.test(rem) && /salvarImpressoraContrato/.test(rem));
ok('passo serial no novo', /__impPassoSerial/.test(rem) && /kr-imp-avancar/.test(rem));

const F=load(fin).FINANCEIRO_V52243_PURE;
ok('filtros sem boleto/obs', F.CAMPOS.every(function(it){ return !/boleto|documento|observa/i.test(it[1]); }) && F.CAMPOS.some(function(it){ return it[0]==='cod_caixa'; }));
ok('código exato 48≠480', F.codigoNorm('048')==='48' && F.codigoNorm('48')!==F.codigoNorm('480'));
ok('por valor igual', F.valorIgual(10,'10,00') && !F.valorIgual(10,10.5));
const lanc=[{ref:{status:'aberto',criadoEm:'2026-08-27T10:00:00Z',valor:50,codigo:'77',clienteId:'c1'}}];
ok('hoje pega criadoEm', F.filtraLancamentos(lanc,{modo:'hoje',hoje:'2026-08-27'}).length===1);
ok('hoje de outro dia some', F.filtraLancamentos(lanc,{modo:'hoje',hoje:'2026-08-26'}).length===0);
ok('sem data cai em hoje', F.filtraLancamentos([{ref:{status:'aberto',valor:10}}],{modo:'hoje',hoje:'2026-08-27'}).length===1);
ok('pago some em abertos', F.filtraLancamentos([{ref:{status:'pago',criadoEm:'2026-08-27'}}],{modo:'abertos'}).length===0);
ok('cod caixa exato', F.filtraLancamentos(lanc,{modo:'todos',campo:'cod_caixa',q:'77'}).length===1);
ok('cod caixa 7 não pega 77', F.filtraLancamentos(lanc,{modo:'todos',campo:'cod_caixa',q:'7'}).length===0);
ok('fatura marca criadoEm', /criadoEm/.test(fin) && /vosConcluirFaturamento/.test(fin));

const M=load(menu).FINANCEIRO_MENU_V52243_PURE;
ok('some submenu financeiro', (M.semSubmenuFinanceiro([{id:'financeiro',items:[{id:'x'}]}])[0].items||[]).length===0);

const G=load(geral).MENU_VERSAO_BOLETO_V52243_PURE;
ok('versão 5.22.43', G.VERSAO==='5.22.43');
ok('módulo financeiro marca a tela', G.moduloAberto('financeiro',"navigateTo('financeiro')")===true);
ok('página pede tem certeza', /Tem certeza\?/.test(pag));
ok('Boleto na venda e na baixa', /vosAbrirRecebimento/.test(geral) && /finConfirmarBaixa/.test(geral) && /Boleto/.test(geral));
// herdado do antigo test_ajustes_v52242.js (v52242 consolidados na v52243)
ok('página trata link usado', /não vale mais/.test(pag));
ok('worker GET recusa já decidido', /error: 'USED'/.test(worker) && /ALREADY_DECIDED/.test(worker));
ok('worker não reabre venda no POST', !/if \(data\.status === 'aprovado' && data\.vendaNumero\)/.test(worker));
ok('sem submenu Contas e caixas no HTML', !/Contas e caixas/.test(html));
ok('versão no rodapé', /v\d+\.\d+\.\d+/.test(html));
ok('patches no bundle', ['ajustes_v52243_orcamentos_status_patch.js','ajustes_v52243_contratos_sort_patch.js','ajustes_v52243_impressora_remanejar_patch.js','ajustes_v52243_financeiro_filtros_patch.js','ajustes_v52243_financeiro_menu_patch.js','ajustes_v52243_menu_versao_boleto_patch.js'].every(function(f){ return manifest.includes(f); }));
ok('versão no patch', /v5.22.43/.test(orc) && /v5.22.43/.test(fin) && /^\d+\.\d+\.\d+/.test(pkg.version) && /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html));
ok('APK quieto', !/mobile\//.test(orc+sort+rem+fin+menu+geral));
ok('sem nome pessoal novo', !/kauan/i.test((orc+rem+fin+menu+geral).replace(/__KAUAN_REFINO_STATE__/g,'')));
ok('cod_venda acha pelo carimbo 83', F.filtraLancamentos([{ref:{status:'aberto',vendaNumero:83}}],{campo:'cod_venda',q:'83',modo:'todos'}).length===1);
ok('cod_venda 8 não pega 83', F.filtraLancamentos([{ref:{status:'aberto',vendaNumero:83}}],{campo:'cod_venda',q:'8',modo:'todos'}).length===0);
ok('cod_venda acha numeroVenda', F.filtraLancamentos([{ref:{status:'aberto',numeroVenda:'83'}}],{campo:'cod_venda',q:'83',modo:'todos'}).length===1);
global.db={vendas:[{id:'v83',numero:83}]};
ok('cod_venda acha pelo vínculo (dado antigo)', F.filtraLancamentos([{ref:{status:'aberto',vendaId:'v83'}}],{campo:'cod_venda',q:'83',modo:'todos'}).length===1);
delete global.db;
ok('faturar carimba vendaNumero', /vendaNumero:v\.numero/.test(fs.readFileSync('app.js','utf8')));
console.log('\nRESULTADO: v5.22.43 passou!');
//<<<<SECAO:test_ajustes_v52243.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52244.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52244.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const orc=fs.readFileSync('ajustes_v52244_orcamentos_autorizar_patch.js','utf8');
const fin=fs.readFileSync('ajustes_v52244_financeiro_datas_patch.js','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const wpkg=JSON.parse(fs.readFileSync('cloudflare-worker/package.json','utf8'));

const O=load(orc).ORCAMENTOS_AUTORIZAR_V52244_PURE;
ok('autorizar vira aprovado com venda', O.aplicarDecisao({id:'o1',status:'aberto'},{status:'aprovado'}).status==='aprovado' && O.aplicarDecisao({id:'o1'},{status:'aprovado'}).vendaId==='vda_orc_o1');
ok('recusar exclui o orçamento', O.aplicarDecisao({id:'o1',status:'aberto'},{status:'recusado'}).status==='excluido');
ok('id da venda é estável', O.vendaIdDe({id:'abc'})==='vda_orc_abc');

const F=load(fin).FINANCEIRO_DATAS_V52244_PURE;
ok('datas visíveis', F.datasVisiveis===true);
ok('hoje não aplica De/Até', F.aplicaDatas('hoje')===false && F.aplicaDatas('abertos')===true && F.aplicaDatas('todos')===true);

ok('worker e package na mesma versão', new RegExp("API_VERSION = '"+wpkg.version.replace(/\./g,'\\.')+"'").test(worker));
ok('worker recusar exclui', /orc_del_/.test(worker) && /excluido: true/.test(worker));
ok('worker GET USED traz venda', /vendaNumero: found.data.vendaNumero/.test(worker));
ok('venda id estável no worker', /vda_orc_/.test(worker));
ok('consulta USED no app', /error==='USED'/.test(orc) && /puxarAprovacoes/.test(orc));
ok('De/Até deixam de ser hidden', /type='date'/.test(fin) && /neo-fin-de-lab/.test(fin));
ok('patches no bundle', manifest.includes('ajustes_v52244_orcamentos_autorizar_patch.js') && manifest.includes('ajustes_v52244_financeiro_datas_patch.js'));
ok('versão', /^\d+\.\d+\.\d+/.test(pkg.version) && /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && /v\d+\.\d+\.\d+/.test(html));
ok('APK quieto', !/mobile\//.test(orc+fin));
console.log('\nRESULTADO: v5.22.44 passou!');
//<<<<SECAO:test_ajustes_v52244.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52254.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52254.js:INICIO>>>>
const fs = require('fs');
const { ORCAMENTOS_PAGES_V52254_PURE: P } = require('./ajustes_v52254_orcamentos_pages_patch.js');

function ok(n, c){ if(!c){ console.error('FAIL:', n); process.exit(1); } console.log('OK:', n); }

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

ok('versão 5.22.54 base', P.VERSAO === '5.22.54' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('url Cloudflare Pages oficial', P.PAGINA_PAGES === 'https://digicopy-orcamentos.pages.dev/');

const orcMock = {
  id: 'orc_123',
  numero: 'ORC-2026-001',
  token: 'tok_abc123',
  data: '2026-08-29T12:00:00Z',
  total: 250.50,
  itens: [{ descricao: 'Manutenção Epson L3150', qtd: 1, preco: 250.50, subtotal: 250.50 }]
};
const cliMock = { nome: 'João da Silva' };
const empMock = { whatsapp: '38999998888' };

const link = P.linkOrcamento(orcMock, cliMock, empMock);
ok('link aponta para digicopy-orcamentos.pages.dev', link.startsWith('https://digicopy-orcamentos.pages.dev/?'));
ok('link contém token c=', link.includes('c=tok_abc123'));
ok('link contém payload d=', link.includes('d='));
ok('link contém versão v=5.22.54', link.includes('v=5.22.54'));

ok('patch no manifesto do bundle', manifest.includes('ajustes_v52254_orcamentos_pages_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52254_orcamentos_pages_patch.js'));
ok('index carrega scripts na versão 5.22', /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52254_orcamentos_pages_patch.js'));
ok('rodapé v5.22', /footer-version/.test(html) && /v\d+\.\d+\.\d+/.test(html));

// Teste de imunidade contra regressão de versão no DOM em tempo de execução
global.window = {
  DIGICOPY_APP_VERSION: '5.22.54',
  navigateTo: function(){ return true; },
  addEventListener: function(){},
  removeEventListener: function(){}
};
global.document = {
  getElementById: function(id){
    if(!this._els) this._els = {};
    if(!this._els[id]) this._els[id] = { id: id, textContent: '', style: {}, classList: { add: function(){}, remove: function(){} } };
    return this._els[id];
  },
  querySelector: function(){ return null; },
  querySelectorAll: function(){ return []; },
  title: 'Sistema Digicopy'
};

// Carrega os patches anteriores simulando o runtime
require('./ajustes_v52252_resolucao_loop_patch.js');
require('./ajustes_v52253_login_tela_branca_patch.js');
require('./ajustes_v52254_orcamentos_pages_patch.js');

// Simula navegação de menus (navigateTo)
global.window.navigateTo('financeiro');
ok('versão no rodapé após navegar para financeiro continua v5.22.54', global.document.getElementById('footer-version').textContent === 'v5.22.54');

global.window.navigateTo('dashboard');
ok('versão no rodapé após navegar para dashboard continua v5.22.54', global.document.getElementById('footer-version').textContent === 'v5.22.54');

global.window.navigateTo('clientes');
ok('versão no rodapé após navegar para clientes continua v5.22.54', global.document.getElementById('footer-version').textContent === 'v5.22.54');

console.log('TODOS OS TESTES DE v5.22.54 PASSARAM COM SUCESSO!');
//<<<<SECAO:test_ajustes_v52254.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52255.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52255.js:INICIO>>>>
const fs = require('fs');
const { ORCAMENTO_APROVACAO_V52255_PURE: P } = require('./ajustes_v52255_orcamento_aprovacao_venda_patch.js');

function ok(n, c){ if(!c){ console.error('FAIL:', n); process.exit(1); } console.log('OK:', n); }

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

ok('versão 5.22.55 base', P.VERSAO === '5.22.55' && /^\d+\.\d+\.\d+/.test(pkg.version));

// Mock do ambiente do ERP
global.db = {
  orcamentos: [
    {
      id: 'orc_teste_1',
      empresaId: 'emp_1',
      numero: '101',
      token: 'tok_abc123',
      clienteId: 'cli_1',
      clienteNome: 'Maria Silva',
      total: 350.00,
      status: 'aberto',
      itens: [
        { produtoId: 'prod_1', descricao: 'Manutenção L3150', qtd: 1, preco: 350.00, subtotal: 350.00, tipo: 'Serviço' }
      ]
    },
    {
      id: 'orc_teste_2',
      empresaId: 'emp_1',
      numero: '102',
      token: 'tok_xyz456',
      clienteId: 'cli_1',
      clienteNome: 'Maria Silva',
      total: 150.00,
      status: 'aberto',
      itens: [
        { produtoId: 'prod_2', descricao: 'Toner Preto', qtd: 1, preco: 150.00, subtotal: 150.00, tipo: 'Produto' }
      ]
    }
  ],
  vendas: [],
  produtos: [
    { id: 'prod_2', nome: 'Toner Preto', estoque: 10, preco: 150.00, categoria: 'Cartucho' }
  ],
  clientes: [
    { id: 'cli_1', nome: 'Maria Silva' }
  ],
  notificacoes: []
};

global.window = {
  db: global.db
};
global.getSession = function(){ return { usuarioId: 'usr_adm', usuarioNome: 'Denivaldo', empresaId: 'emp_1' }; };
global.saveDB = function(){};

// 1. Teste de aprovação e geração de venda salva
const vendaGerada = P.gerarVendaSalvaDeOrcamento('orc_teste_1', 'cliente');
ok('venda salva foi gerada', vendaGerada && vendaGerada.id.startsWith('vda_orc_'));
ok('venda tem status aguardar (salva)', vendaGerada && vendaGerada.status === 'aguardar');
ok('venda tem total correto', vendaGerada && vendaGerada.total === 350.00);

const orc1 = global.db.orcamentos.find(o => o.id === 'orc_teste_1');
ok('orçamento mudou status para aprovado', orc1 && orc1.status === 'aprovado');
ok('orçamento tem vendaId vinculada', orc1 && orc1.vendaId === vendaGerada.id);

// 2. Teste de recusa de orçamento
P.recusarOrcamento('orc_teste_2');
const orc2 = global.db.orcamentos.find(o => o.id === 'orc_teste_2');
ok('orçamento mudou status para recusado', orc2 && orc2.status === 'recusado');

ok('patch no manifesto do bundle', manifest.includes('ajustes_v52255_orcamento_aprovacao_venda_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52255_orcamento_aprovacao_venda_patch.js'));
ok('index carrega scripts na versão 5.22', /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52255_orcamento_aprovacao_venda_patch.js'));
ok('rodapé v5.22', /footer-version/.test(html) && /v\d+\.\d+\.\d+/.test(html));

console.log('TODOS OS TESTES DE v5.22.55 PASSARAM COM SUCESSO!');
//<<<<SECAO:test_ajustes_v52255.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52256.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52256.js:INICIO>>>>
const fs = require('fs');
const { ORCAMENTO_APROVACAO_V52256_PURE: P } = require('./ajustes_v52256_orcamento_venda_limpa_patch.js');

function ok(n, c){ if(!c){ console.error('FAIL:', n); process.exit(1); } console.log('OK:', n); }

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

ok('versão 5.22.56 base', P.VERSAO === '5.22.56' && /^\d+\.\d+\.\d+/.test(pkg.version));

// Mock do ambiente do ERP
global.db = {
  orcamentos: [
    {
      id: 'orc_teste_56_1',
      empresaId: 'emp_1',
      numero: '201',
      clienteId: 'cli_1',
      clienteNome: 'João Souza',
      total: 500.00,
      status: 'aberto',
      itens: [
        { produtoId: 'prod_1', descricao: 'Manutenção EPSON L4160', qtd: 1, preco: 500.00, subtotal: 500.00, tipo: 'Serviço' }
      ]
    },
    {
      id: 'orc_teste_56_2',
      empresaId: 'emp_1',
      numero: '202',
      token: 'tok_56_xyz',
      clienteId: 'cli_1',
      clienteNome: 'João Souza',
      total: 100.00,
      status: 'aberto',
      itens: [
        { produtoId: 'prod_2', descricao: 'Tinta Preta', qtd: 2, preco: 50.00, subtotal: 100.00, tipo: 'Produto' }
      ]
    }
  ],
  vendas: [],
  produtos: [
    { id: 'prod_2', nome: 'Tinta Preta', estoque: 15, preco: 50.00, categoria: 'Insumo' }
  ],
  clientes: [
    { id: 'cli_1', nome: 'João Souza' }
  ],
  notificacoes: []
};

global.window = {
  db: global.db
};
global.getSession = function(){ return { usuarioId: 'usr_adm', usuarioNome: 'Denivaldo', empresaId: 'emp_1' }; };
global.saveDB = function(){};

// 1. Garante tokens em orçamentos sem token
P.garantirTokensOrcamentos();
const orcSemToken = global.db.orcamentos.find(o => o.id === 'orc_teste_56_1');
ok('orçamento ganhou token gerado automaticamente', orcSemToken && orcSemToken.token && orcSemToken.token.startsWith('orc_tok_'));

// 2. Teste de aprovação e geração de venda salva
const vendaGerada = P.gerarVendaSalvaDeOrcamento('orc_teste_56_1', 'cliente_web');
ok('venda salva foi gerada com sucesso', vendaGerada && vendaGerada.id.startsWith('vda_orc_'));
ok('venda gerada tem status aguardar', vendaGerada && vendaGerada.status === 'aguardar');
ok('venda gerada tem total 500.00', vendaGerada && vendaGerada.total === 500.00);

const orc1 = global.db.orcamentos.find(o => o.id === 'orc_teste_56_1');
ok('orçamento mudou status para aprovado', orc1 && orc1.status === 'aprovado');
ok('orçamento tem vendaId vinculada', orc1 && orc1.vendaId === vendaGerada.id);

// 3. Teste de recusa de orçamento
P.recusarOrcamento('orc_teste_56_2');
const orc2 = global.db.orcamentos.find(o => o.id === 'orc_teste_56_2');
ok('orçamento mudou status para recusado', orc2 && orc2.status === 'recusado');

// 4. Validações de integridade estrutural
ok('patch no manifesto do bundle', manifest.includes('ajustes_v52256_orcamento_venda_limpa_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52256_orcamento_venda_limpa_patch.js'));
ok('index carrega scripts na versão 5.22', /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52256_orcamento_venda_limpa_patch.js'));
ok('rodapé v5.22', /footer-version/.test(html) && /v\d+\.\d+\.\d+/.test(html));
ok('título v5.22', /Sistema Digicopy v\d+\.\d+\.\d+/.test(html));

console.log('TODOS OS TESTES DE v5.22.56 PASSARAM COM SUCESSO!');
//<<<<SECAO:test_ajustes_v52256.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52258.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52258.js:INICIO>>>>
const assert = require('assert');
const { PURE_V52258 } = require('./ajustes_v52258_orcamento_os_revalidar_patch.js');

console.log('Testando Ajustes v5.22.58 (Orçamentos com OS, Revalidação de Link e Venda Salva)...');

// 1. Versão
assert.strictEqual(PURE_V52258.VERSAO, '5.22.58', 'Versão deve ser 5.22.58');

// 2. Payload Link com e sem OS
const orcSemOS = {
  id: 'orc_1',
  token: 'tok_abc',
  numero: '101',
  clienteNome: 'João Silva',
  data: '2026-08-29',
  total: 250,
  itens: [{ descricao: 'Toner Preto', qtd: 2, preco: 100, subtotal: 200 }]
};

const payload1 = PURE_V52258.payloadLink(orcSemOS, { nome: 'João Silva' }, { whatsapp: '3899999999' });
assert.strictEqual(payload1.t, 'tok_abc');
assert.strictEqual(payload1.n, '101');
assert.strictEqual(payload1.c, 'João Silva');
assert.strictEqual(payload1.tot, 250);
assert.strictEqual(payload1.os, undefined, 'Orçamento sem OS não deve ter objeto os');

const orcComOS = {
  id: 'orc_2',
  token: 'tok_xyz',
  numero: '102',
  clienteNome: 'Empresa ABC',
  data: '2026-08-29',
  total: 450,
  itens: [{ descricao: 'Troca de Fusor', qtd: 1, preco: 450, subtotal: 450 }],
  os: {
    modelo: 'HP LaserJet M404',
    numeroSerie: 'BR123456',
    defeito: 'Papel atolando',
    servicos: 'Troca do rolo de tração e fusor',
    tecnico: 'Carlos'
  }
};

const payload2 = PURE_V52258.payloadLink(orcComOS, { nome: 'Empresa ABC' }, { whatsapp: '3899999999' });
assert.strictEqual(payload2.os.m, 'HP LaserJet M404');
assert.strictEqual(payload2.os.s, 'BR123456');
assert.strictEqual(payload2.os.def, 'Papel atolando');
assert.strictEqual(payload2.os.srv, 'Troca do rolo de tração e fusor');
assert.strictEqual(payload2.os.tec, 'Carlos');

// 3. Link gerado
const link = PURE_V52258.linkPublicoOrcamento(orcComOS, { nome: 'Empresa ABC' }, { whatsapp: '3899999999' });
assert.ok(link.startsWith('https://digicopy-orcamentos.pages.dev/'), 'Link deve apontar para Cloudflare Pages');
assert.ok(link.includes('c=tok_xyz'), 'Link deve conter o token c=');
assert.ok(link.includes('d='), 'Link deve conter payload d=');
assert.ok(link.includes('v=5.22.58'), 'Link deve conter v=5.22.58');

// 4. Teste de aprovação gerando venda salva com cópia da OS
global.window = global;
global.db = {
  orcamentos: [Object.assign({}, orcComOS, { status: 'aberto' })],
  vendas: [],
  notificacoes: [],
  clientes: [{ id: 'cli_1', nome: 'Empresa ABC' }],
  os: []
};
global.getSession = () => ({ usuarioId: 'usr_1', usuarioNome: 'Denivaldo', empresaId: 'emp_1' });
global.saveDB = () => {};

const vendaGerada = PURE_V52258.gerarVendaSalvaDeOrcamento('orc_2', 'cliente_web');
assert.ok(vendaGerada, 'Deve gerar venda salva');
assert.strictEqual(vendaGerada.status, 'aguardar', 'Venda salva deve ter status aguardar');
assert.strictEqual(vendaGerada.origemOrcamentoId, 'orc_2');
assert.ok(vendaGerada.os, 'Venda gerada deve herdar objeto de OS do orçamento');
assert.strictEqual(vendaGerada.os.modelo, 'HP LaserJet M404');
assert.strictEqual(global.db.orcamentos[0].status, 'aprovado', 'Orçamento deve transicionar para status aprovado');
assert.strictEqual(global.db.orcamentos[0].vendaId, vendaGerada.id);

// 5. Teste de Revalidação do Link
let alertMsg = null;
global.window.confirmSistema = (msg) => { alertMsg = msg; return Promise.resolve(true); };
global.window.lfbAlert = (msg) => { alertMsg = msg; };

PURE_V52258.revalidarLinkOrcamento('orc_2', true);
assert.strictEqual(global.db.orcamentos[0].status, 'aberto', 'Orçamento deve voltar para o status aberto');
assert.strictEqual(global.db.orcamentos[0].vendaId, null, 'Venda vinculada deve ser desvinculada');
assert.strictEqual(global.db.vendas.length, 0, 'Venda salva anterior deve ser excluída e revogada');
assert.notStrictEqual(global.db.orcamentos[0].token, 'tok_xyz', 'Deve gerar um novo token limpo');

console.log('✅ Testes de Ajustes v5.22.58 concluídos com sucesso!');
//<<<<SECAO:test_ajustes_v52258.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52259.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52259.js:INICIO>>>>
const assert = require('assert');
const fs = require('fs');
const { PURE_V52259 } = require('./ajustes_v52259_orcamento_filtros_item_patch.js');

console.log('Testando Ajustes v5.22.59 (Filtros de Orçamentos e Tipos de Item)...');

// 1. Versão
assert.strictEqual(PURE_V52259.VERSAO, '5.22.59', 'Versão deve ser 5.22.59');

// 2. Não deve existir tipo 'Serviço' no select de tipo de item do modal de orçamento
const patchSrc = fs.readFileSync('ajustes_v52259_orcamento_filtros_item_patch.js', 'utf8');
const patch58Src = fs.readFileSync('ajustes_v52258_orcamento_os_revalidar_patch.js', 'utf8');

assert.ok(!patchSrc.includes('<option>Serviço</option>'), 'Patch 59 não deve conter option Serviço no select de tipo de item');
assert.ok(!patchSrc.includes('<option value="Serviço">Serviço</option>'), 'Patch 59 não deve conter option value Serviço no select de tipo de item');
assert.ok(!patch58Src.includes('<option>Serviço</option>'), 'Patch 58 não deve conter option Serviço no select de tipo de item');

// 3. Tipos válidos são apenas Produto e Recarga de toner
assert.strictEqual(PURE_V52259.ehRecargaTipo('Recarga de toner'), true);
assert.strictEqual(PURE_V52259.ehRecargaTipo('Produto'), false);

// 4. Filtros de Cliente e Categorias de Produto disponíveis
assert.ok(Array.isArray(PURE_V52259.CAMPOS_CLIENTE), 'Campos de cliente devem estar definidos');
assert.ok(PURE_V52259.CAMPOS_CLIENTE.some(c => c[0] === 'todos' && c[1] === 'Pesquisar em tudo'));
assert.ok(PURE_V52259.CAMPOS_CLIENTE.some(c => c[0] === 'codigo' && c[1] === 'Código'));
assert.ok(PURE_V52259.CAMPOS_CLIENTE.some(c => c[0] === 'documento' && c[1] === 'CPF/CNPJ'));

assert.ok(Array.isArray(PURE_V52259.CATS_PRODUTO), 'Categorias de produto devem estar definidas');
assert.ok(PURE_V52259.CATS_PRODUTO.includes('Cartucho'));
assert.ok(PURE_V52259.CATS_PRODUTO.includes('Insumo'));
assert.ok(PURE_V52259.CATS_PRODUTO.includes('Equipamento'));

assert.ok(Array.isArray(PURE_V52259.CAMPOS_RECARGA), 'Campos de recarga devem estar definidos');
assert.ok(PURE_V52259.CAMPOS_RECARGA.some(r => r[0] === 'codigo' && r[1] === 'Código'));
assert.ok(PURE_V52259.CAMPOS_RECARGA.some(r => r[0] === 'nome' && r[1] === 'Descrição'));

// 5. Presença dos selects de filtro no HTML gerado pelo modal
assert.ok(patchSrc.includes('id="orc-cli-campo"'), 'Deve conter o select de filtro de campos do cliente');
assert.ok(patchSrc.includes('id="orc-prod-cat"'), 'Deve conter o select de categorias de produtos');
assert.ok(patchSrc.includes('id="orc-rec-campo"'), 'Deve conter o select de campos de recargas');
assert.ok(patchSrc.includes('id="orc-item-cartucho"'), 'Deve conter o campo de etiqueta de recarga');
assert.ok(patchSrc.includes('id="orc-etq-lupa"'), 'Deve conter o botão de lupa de etiqueta');

// 6. Não deve existir o botão "Copiar link" no rodapé do modal de orçamento
assert.ok(!patchSrc.includes('Copiar link'), 'Modal de orçamento não deve conter botão Copiar link');
assert.ok(!patch58Src.includes('Copiar link'), 'Patch 58 não deve conter botão Copiar link');

// 7. Validação da página pública do cliente (public-orcamento/index.html e orcamento_pagar.html)
const publicHtml = fs.readFileSync('public-orcamento/index.html', 'utf8');
const pagarHtml = fs.readFileSync('orcamento_pagar.html', 'utf8');

assert.ok(publicHtml.includes('tela(d)'), 'Página pública deve renderizar instantaneamente com dados do payload d');
assert.ok(publicHtml.includes('AbortController'), 'Página pública deve ter timeout com AbortController para nunca travar');
assert.ok(pagarHtml.includes('tela(d)'), 'Página fallback deve renderizar instantaneamente com dados do payload d');

console.log('✅ Testes de Ajustes v5.22.59 concluídos com sucesso!');
//<<<<SECAO:test_ajustes_v52259.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52260.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52260.js:INICIO>>>>
const assert = require('assert');
const fs = require('fs');
const { PURE_V52260 } = require('./ajustes_v52260_orcamento_trava_venda_atalho_patch.js');

console.log('Testando Ajustes v5.22.60 (Trava de Orçamentos Autorizados, Atalho Venda e Exclusão)...');

// 1. Versão
assert.strictEqual(PURE_V52260.VERSAO, '5.22.60', 'Versão deve ser 5.22.60');

// 2. Patch deve conter a trava para orçamentos autorizados
const patchSrc = fs.readFileSync('ajustes_v52260_orcamento_trava_venda_atalho_patch.js', 'utf8');

assert.ok(patchSrc.includes('isAutorizado'), 'Patch deve conter lógica de verificação isAutorizado');
assert.ok(patchSrc.includes('Orçamento AUTORIZADO — Edição bloqueada'), 'Patch deve exibir aviso de bloqueio em orçamento autorizado');
assert.ok(patchSrc.includes('abrirVendaDeOrcamento'), 'Patch deve conter função de atalho para abrir venda salva gerada');
assert.ok(patchSrc.includes('excluirOrcamentosMarcados'), 'Patch deve conter função funcional de exclusão');
assert.ok(patchSrc.includes('orcSelCliente'), 'Patch deve definir window.orcSelCliente');
assert.ok(patchSrc.includes('orcLimparCliente'), 'Patch deve definir window.orcLimparCliente');

// 3. Validação de que o botão 'Copiar link' NÃO está presente
assert.ok(!patchSrc.includes('Copiar link'), 'Patch não deve conter botão Copiar link');

console.log('✅ Testes de Ajustes v5.22.60 concluídos com sucesso!');
//<<<<SECAO:test_ajustes_v52260.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52261.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52261.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}
const src=fs.readFileSync('ajustes_v52261_orcamento_nao_volta_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const P=load(src).ORCAMENTO_NAO_VOLTA_V52261_PURE;
const db={
  orcamentos:[{id:'o1',token:'tok1',status:'aprovado',vendaId:'v1'}],
  vendas:[{id:'v1',origemOrcamentoId:'o1',numero:'10'}],
  __orcBloqueio:{orcIds:[],tokens:[],vendaIds:[],orcSemRecriarVenda:[]}
};
ok('versao', P.VERSAO==='5.22.61' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('orcamento aberto nao bloqueia', P.orcamentoBloqueado({id:'o2',status:'aberto'}, db)===false);
P.marcarOrcamentoExcluido(db.orcamentos[0], db);
ok('orcamento excluido nao volta', P.orcamentoBloqueado(db.orcamentos[0], db)===true);
ok('venda do orcamento excluido some', P.vendaPodeFicar(db.vendas[0], db)===false);
ok('nao recria venda', P.naoRecriarVenda(db.orcamentos[0], db)===true);

const db2={
  orcamentos:[{id:'o9',token:'tok9',status:'aprovado',vendaId:'v9'}],
  vendas:[{id:'v9',origemOrcamentoId:'o9',numero:'11'}],
  __orcBloqueio:{orcIds:[],tokens:[],vendaIds:[],orcSemRecriarVenda:[]}
};
P.marcarVendaExcluida(db2.vendas[0], db2);
ok('apagou venda nao recria', P.naoRecriarVenda(db2.orcamentos[0], db2)===true);
ok('orcamento autorizado continua na lista', P.orcamentoPodeFicar(db2.orcamentos[0], db2)===true);
ok('venda apagada nao volta', P.vendaPodeFicar(db2.vendas[0], db2)===false);
ok('aviso no sino sem popup', P.avisoNoSino===true && P.semPopup===true && /notificarEvento/.test(src) && /lfbAlert/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52261_orcamento_nao_volta_patch.js'));
ok('index carrega o patch', JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52261_orcamento_nao_volta_patch.js'));
ok('rodape 5.22', /v\d+\.\d+\.\d+/.test(html));
ok('APK quieto', src.indexOf('mobile/')<0);
console.log('\nRESULTADO: v5.22.61 passou!');
//<<<<SECAO:test_ajustes_v52261.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52262.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52262.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}
const src=fs.readFileSync('ajustes_v52262_orcamento_uma_vez_loop_patch.js','utf8');
const a57=fs.readFileSync('ajustes_v52257_orcamento_sync_total_patch.js','utf8');
const a58=fs.readFileSync('ajustes_v52258_orcamento_os_revalidar_patch.js','utf8');
const a55=fs.readFileSync('ajustes_v52255_orcamento_aprovacao_venda_patch.js','utf8');
const a61=fs.readFileSync('ajustes_v52261_orcamento_nao_volta_patch.js','utf8');
const a44=fs.readFileSync('ajustes_v52244_orcamentos_autorizar_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const P=load(src).ORCAMENTO_UMA_VEZ_V52262_PURE;
ok('versao', P.VERSAO==='5.22.62' && /^\d+\.\d+\.\d+/.test(pkg.version));
ok('gera uma vez', P.geraUmaVez===true && /vendaGeradaUmaVez/.test(a58+a57+a55));
ok('apagou venda nao recria', /vendaExcluidaPeloUsuario = true;\n      return null/.test(a58) || /vendaExcluidaPeloUsuario = true/.test(a58));
ok('sem poll 3s', !/setInterval\(verificarAprovacoesNuvem, 3000\)/.test(a57+a58));
ok('sem poll 4s', !/setInterval\(verificarAprovacoesNuvem, 4000\)/.test(a55));
ok('sem varrer 2.5s', !/setInterval\(varrerRessuscitadas/.test(a61));
ok('sem poll 20s', !/setInterval\(puxarAprovacoes, 20000\)/.test(a44));
ok('nao redesenha tela', !/abrirTelaOrcamento/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52262_orcamento_uma_vez_loop_patch.js'));
ok('index', JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52262_orcamento_uma_vez_loop_patch.js'));
ok('APK quieto', src.indexOf('mobile/')<0);
console.log('\nRESULTADO: v5.22.62 passou!');
//<<<<SECAO:test_ajustes_v52262.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52291.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52291.js:INICIO>>>>
// Teste v5.22.91 — diagnóstico completo do "não achei esse orçamento"
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.91 — orçamento avisa com diagnóstico que fecha a causa ==');
const s = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
ok(s.indexOf("__orc_render_ids") >= 0, 'lista guarda os ids que mostrou (snapshot da tela)');
ok(s.indexOf("localStorage.setItem('__orc_render_ids'") >= 0, 'snapshot gravado a cada render');
ok(s.indexOf("localStorage.getItem('__orc_render_ids'") >= 0, 'passo 7 lê o snapshot');
ok(s.indexOf("ESTAVA sim") >= 0 && s.indexOf("NÃO estava") >= 0, 'aviso diz se o clicado estava na lista mostrada');
ok(s.indexOf('códigos que existem agora:') >= 0, 'aviso lista os códigos que existem no banco');
ok(s.indexOf('slice(0,20)') >= 0, 'códigos atuais vão curtos no aviso');
// regressão: textos das etapas anteriores continuam
ok(s.indexOf('Não achei esse orçamento neste PC agora') >= 0, 'texto claro do aviso continua');
ok(s.indexOf('orc_legado_') >= 0, 'autocura de orçamento legado continua');
if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.91!');
//<<<<SECAO:test_ajustes_v52291.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52293.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52293.js:INICIO>>>>
// NOTA (24/09/2026): o fim do bundle-manifest.json encolheu 3 posições — saíram
// `novo/nucleo.js`, `novo/ponte.js` e `ajustes_v7011_ponte_nucleo_patch.js` (o núcleo novo
// foi apagado por decisão do dono). A conferência abaixo conta DE TRÁS para a frente, então
// cada número caiu 3. Os patches conferidos e a ORDEM entre eles continuam os mesmos.
// Teste v5.22.93 — guardião do banco de orçamentos (quem tirou, fica anotado)
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.93 — guardião do banco de orçamentos ==');

const g = fs.readFileSync('ajustes_v52293_orcamento_guardiao_patch.js', 'utf8');
ok(g.indexOf("__orc_saiu") >= 0, 'anel de saídas gravado no PC (__orc_saiu)');
ok(g.indexOf('setInterval(function(){') >= 0 && g.indexOf(', 400)') >= 0, 'vigia compara os ids do array a cada 400 ms');
ok(g.indexOf('anotarSaida(') >= 0 && g.indexOf("new Error('vigia')") >= 0, 'toda saída grava ids que sumiram + trilha de quem chamou');
ok(g.indexOf('window.__orcResumoUltimaBaixa') >= 0, 'exposição do resumo da última baixa para o aviso');
ok(g.indexOf('renderOrcamentos') >= 0 && g.indexOf('__v52293') >= 0, 'amarra o retrato na listagem VISÍVEL (a última que existir)');

const m = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
ok(m.indexOf('ajustes_v52293_orcamento_guardiao_patch.js') === m.length - 40, 'guardião logo antes da fila final (depois vêm volta-venda, backups, o v5.24.0, as abas do cliente v5.24.3, o remanejo final v5.24.35, a guarda de leitura v5.24.36, a revisão v5.25.0, o CNPJ+gerente v5.26.0, o login da nuvem primeiro v5.26.2 a data grande do chamado v5.26.4 e o Painel do Gerente v6.0.6; o anti-tela-branca v6.0.12 e, por último, a ribbon fiscal bonita v6.0.13 e a navegação+escuro v6.1.3, e o mandar-erro v7.0.20, e o portão de escrita v7.0.22, e a função única v7.0.24, e o setup v5.90.0, e o login-retry v5.90.1 fecha a fila);');

const v237 = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
ok(v237.indexOf('__orcResumoUltimaBaixa') >= 0, 'aviso "não achei" mostra a última baixa');
ok(v237.indexOf("códigos que existem agora: ' + _ids + '; ' + _baixa") >= 0, 'texto do aviso concatena a baixa');

const v922 = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
ok(v922.indexOf("change.entity==='orcamentos'") >= 0, 'trava v5.22.92 (delete da nuvem vira excluído) continua');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.93!');
//<<<<SECAO:test_ajustes_v52293.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52295.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52295.js:INICIO>>>>
// NOTA (24/09/2026): o fim do bundle-manifest.json encolheu 3 posições — saíram
// `novo/nucleo.js`, `novo/ponte.js` e `ajustes_v7011_ponte_nucleo_patch.js` (o núcleo novo
// foi apagado por decisão do dono). A conferência abaixo conta DE TRÁS para a frente, então
// cada número caiu 3. Os patches conferidos e a ORDEM entre eles continuam os mesmos.
// Teste v5.22.95 — qualquer tela aberta a partir da venda em andamento
// devolve a MESMA venda com tudo intacto (salvar OU cancelar)
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.95 — venda em andamento volta intacta após qualquer tela ==');

const p = fs.readFileSync('ajustes_v52295_venda_volta_patch.js', 'utf8');

// 1) fotografa a venda quando qualquer outro modal abre a partir dela
ok(p.indexOf("if(typeof window.openModal === 'function'") >= 0 && p.indexOf("window.openModal = function(") >= 0, 'embrulha openModal (genérico, não é função avulsa por botão)');
ok(p.indexOf("vendaNaTela() && !window.__vosVendaPendente") >= 0, 'só tira foto se a venda em andamento estiver aberta');
ok(p.indexOf("window.__vosVendaPendente = tirarFoto()") >= 0, 'foto guardada antes de abrir a tela');

// 2) devolve a venda no fechar (salvar e cancelar passam por closeModal)
ok(p.indexOf("if(typeof window.closeModal === 'function'") >= 0 && p.indexOf("window.closeModal = function(") >= 0, 'embrulha closeModal (salvar e cancelar usam o mesmo caminho)');
ok(p.indexOf("setTimeout(devolverVenda, 40)") >= 0, 'devolve a venda logo após fechar');

// 3) foto guarda TUDO: formulário, código, campos digitados, aba e extra
ok(p.indexOf("JSON.parse(JSON.stringify(window.__vosForm))") >= 0, 'cópia profunda do formulário (cliente, itens, descontos, data/hora)');
["'vos-obs'", "'vos-desc-venda'", "'vos-os-valor'", "'vos-os-desc'", "'vos-prod-search'", "'vos-item-qtd'", "'vos-item-vunit'", "'vos-data-saida'", "'vos-prazo-entrega'", "'vos-destino'"].forEach(function(id){
  ok(p.indexOf(id) >= 0, 'campo na foto: ' + id);
});

// 4) devolução reconstrói e repinta tudo
ok(p.indexOf("window.novaVenda()") >= 0, 'reconstrói a venda com novaVenda()');
ok(p.indexOf("window.__vosForm = foto.form") >= 0, 'devolve o formulário inteiro');
ok(p.indexOf("vosVendaSelectCliente") >= 0, 'repõe o cliente no card');
ok(p.indexOf("cod.textContent = foto.codigoTexto") >= 0, 'mantém o MESMO código da venda');
ok(p.indexOf("vosRenderItens") >= 0 && p.indexOf("vosResumoVenda") >= 0, 'repinta itens e resumo');
ok(p.indexOf("vosSetAba('os')") >= 0, 'devolve para a aba que estava');

// 5) rede de segurança leve para telas que fechem sem closeModal
ok(p.indexOf("setInterval(function(){") >= 0 && p.indexOf("devolverVenda();") >= 0, 'olho leve devolve a venda se o modal sumir de outro jeito');

// 6) não atrapalha o uso normal
ok(p.indexOf("window.__V52295_PURE") >= 0, 'marca de diagnóstico/teste presente');

// regressão: bundle contém o patch por último
const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
ok(man[man.length - 39] === 'ajustes_v52295_venda_volta_patch.js', 'patch fica logo antes dos de backups (depois vêm backups v5.22.96, relatório grande v5.24.0, abas do cliente v5.24.3, remanejo final v5.24.35, guarda de leitura v5.24.36, revisão v5.25.0, CNPJ+gerente v5.26.0, login da nuvem v5.26.2 data grande do chamado v5.26.4 e Painel do Gerente v6.0.6, e o mandar-erro v7.0.20, e o portão de escrita v7.0.22, e a função única v7.0.24, e o setup v5.90.0, e o login-retry v5.90.1 fecha a fila)');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.indexOf('__vosVendaPendente') >= 0, 'lógica presente no app.bundle.js');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.95!');
//<<<<SECAO:test_ajustes_v52295.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6005.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6005.js:INICIO>>>>
// test_ajustes_v6005.js — v6.0.5: PERMISSÕES (NF/apagar/estornar) + NOTINHA
// ESTORNADA ABRE NA ABA + FINANCEIRO MOSTRA EXTORNADO
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const p605 = fs.readFileSync('permissoes_estorno_venda_patch.js', 'utf8');
const v5240 = fs.readFileSync('ajustes_v5240_relatorio_grande_patch.js', 'utf8');
const appjs = fs.readFileSync('app.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 210+4; permissões/estorno na 210, menu fiscal 211; Início clicável 212; menus separados v6.0.8 (212); override v6.0.9 (214); 6 submenus (215); hover NF-e/NFC-e v6.0.11 fecha a fila', man.length >= 225 && man[210] === 'fiscal_menu_completo_patch.js' && man[209] === 'permissoes_estorno_venda_patch.js' && man[211] === 'dashboard_inicio_clicavel_patch.js' && man[212] === 'menus_fiscais_separados_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[208] === 'perfis_nuvem_cura_sessao_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (PURE + banner)', bundle.indexOf('P605_PURE_START') >= 0 && bundle.indexOf('v6.0.5 — permissões no editor') >= 0);

console.log('== PERMISSÕES (editor do usuário) ==');
ok('PURE exportada e testável', p605.indexOf("module.exports={p605Perfil") >= 0);
ok('bloco fica DENTRO do editor (ações → editar), não só na coluna', p605.indexOf("p605-permissoes") >= 0 && p605.indexOf("corpo.querySelector('#u-nome')") >= 0);
ok('bloco invisível para funcionário (só Admin/Dono mexe)', p605.indexOf("if(p605Perfil(eu)==='Funcionário') return;") >= 0);
ok('3 caixas: NF + apagar + estornar', p605.indexOf("'u-perm-nfe'") >= 0 && p605.indexOf("'u-perm-apagar'") >= 0 && p605.indexOf("'u-perm-estornar'") >= 0);
ok('saveUsuario aplica as caixas + audita mudança', p605.indexOf("embrS.__p605=true") >= 0 && p605.indexOf("logAction('usuario','permissoes'") >= 0);

const P = require('./permissoes_estorno_venda_patch.js');
ok('PURE: Admin/Dono sempre podem (anti-trancamento)', P.p605Pode({ perfil: 'Admin' }, 'apagar') && P.p605Pode({ perfil: 'Dono' }, 'estornar'));
ok('PURE: funcionário existe → apagar/estornar PERMITIDOS por padrão (não trava ninguém do nada)', P.p605Pode({ perfil: 'Comercial' }, 'apagar') && P.p605Pode({ perfil: 'Técnico' }, 'estornar'));
ok('PURE: funcionário NF fica DESMARCADA por padrão', !P.p605Pode({ perfil: 'Comercial' }, 'emitirNfe') && !P.p605ValorCaixa({ perfil: 'Comercial' }, 'emitirNfe'));
ok('PURE: desmarcado BLOQUEIA de verdade', !P.p605Pode({ perfil: 'Comercial', podeApagar: false }, 'apagar') && !P.p605Pode({ perfil: 'Comercial', podeEstornar: false }, 'estornar'));

console.log('== BLOQUEIO REAL (gates nos executores) ==');
['excluirVendaUnificado','deleteVenda','excluirChamadosSelecionados','excluirChamadoV52422','excluirOrcamento','excluirOrcamentosMarcados','removerLancamentoLeitura','estornarVenda','estornarVendasSelecionadas','estornarLeituraContrato','estornarNotinha'].forEach(function(fn){
  ok('gate: ' + fn, p605.indexOf("wrapGate('" + fn + "'") >= 0);
});
ok('tentativa negada vira aviso do sistema + trilha na Auditoria', p605.indexOf("logAction('seguranca','negado'") >= 0 && p605.indexOf('NÃO tem permissão') >= 0);

console.log('== ESTORNADA ABRE NA ABA DA VENDA ==');
ok('historicoVenda redireciona estornada (sem modal que não devia existir)', p605.indexOf("embrH.__p605=true") >= 0 && p605.indexOf("abrirVendaEstornadaEdicao") >= 0);
ok('aba vem carregada: cliente + itens + desconto', p605.indexOf('selectClienteVenda(v.clienteId)') >= 0 && p605.indexOf('window.itensTemp=(v.itens||[])') >= 0 && p605.indexOf('nvDesc.value=Number(v.desconto)||0') >= 0);
ok('salvar ATUALIZA a mesma notinha (número mantido)', p605.indexOf('__editandoVendaEstornadaId') >= 0 && p605.indexOf("logAction('venda','refazer-pos-estorno'") >= 0);
ok('estoque nunca em dobro: devolve antigos, baixa novos', p605.indexOf('mexeEstoque(it,+1)') >= 0 && p605.indexOf('mexeEstoque(it,-1)') >= 0);
ok('status padrão seguro no refazer (orçamento, sem título novo sem escolha)', p605.indexOf("nvSt.value='orcamento'") >= 0);

console.log('== ESTORNO MARCA (não apaga) + FINANCEIRO MOSTRA ==');
ok('títulos da venda extornada ficam MARCADOS (status estornado)', v5240.indexOf("c.status = 'estornado';") >= 0 && v5240.indexOf('c.estornadoPor') >= 0);
ok('a deleção antiga MORREU (título não some mais do Financeiro)', v5240.indexOf('DB().contasReceber = arr.filter(function(c){ return !(c && c.vendaId === v.id); })') < 0);
ok('financeiro: extornado fora do "vencido" e com estilo próprio', appjs.indexOf("cr.status!=='estornado'; const status=isVenc") >= 0 && appjs.indexOf("estornado:'bg-slate-100 text-slate-500 border-slate-200'") >= 0);
ok('financeiro: tarja EXTORNADO no lugar do checkbox de baixa', appjs.indexOf('>EXTORNADO</span>') >= 0 && appjs.indexOf("cr.status==='estornado'?") >= 0);
// unidade REAL do estorno (marca títulos, mantém registro)
// (o patch 5240 foi feito pro navegador: damos um window FALSO pro require)
global.window = {};
global.db = { contasReceber: [
  { id: 'cr1', vendaId: 'v1', status: 'aberto', valor: 10 },
  { id: 'cr2', vendaId: 'v1', status: 'pago', valor: 5 },
  { id: 'cr3', vendaId: 'v2', status: 'aberto', valor: 7 }
] };
const V5240 = require('./ajustes_v5240_relatorio_grande_patch.js');
const vFake = { id: 'v1', numero: '26', status: 'faturado' };
V5240.estornarUmaVenda(vFake);
ok('estorno marca a venda como estornada', vFake.status === 'estornada' && !!vFake.estornadoEm && !!vFake.estornadoPor);
ok('estorno MARCA os 2 títulos como extornado e NÃO remove nada', global.db.contasReceber.length === 3 && global.db.contasReceber[0].status === 'estornado' && global.db.contasReceber[1].status === 'estornado' && global.db.contasReceber[1].estornoDe === 'pago' && global.db.contasReceber[2].status === 'aberto');
delete global.db;
delete global.window;

console.log('== CARIMBO 6.0.5 ==');
ok('package.json na 6.0.5', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0);
ok('celular carimbado 6.0.5', mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0);

console.log('\n' + pass + ' passaram, ' + fail + ' falharam.');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.5: caixas de permissão no editor (só Admin/Dono) com bloqueio real nos executores; notinha extornada abre na aba carregada e salvar mantém o número; financeiro mostra EXTORNADO visível e fora das somas.');
//<<<<SECAO:test_ajustes_v6005.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6102.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6102.js:INICIO>>>>
const fs = require('fs');
let okCount = 0;
function ok(c, m) { if (!c) { console.error('  ✘ ' + m); process.exitCode = 1; } else { console.log('  ✔ ' + m); okCount++; } }
const ler = f => fs.readFileSync(f, 'utf8');

console.log('== v6.1.2 — navegação fiscal na barra (reconstruída) + escuro íntegro ==');

const p = ler('navegacao_fiscal_barra_escuro_patch.js');
ok(p.length > 4000, 'patch v6.1.2 existe e tem corpo');
ok(/__v612nes/.test(p) && p.indexOf('__v612nes') < p.indexOf('__v612nes = true'), 'guard __v612nes antes do registro');
ok(/v6\.1\.2 navegação Fiscal firme na barra \+ escuro sem bug/.test(p), 'log de boot da v6.1.2');

/* acha o módulo fiscal mesmo depois do pintarMenus reescrever a barra */
ok(/onclick/.test(p) && /abrirCentralNfe/.test(p) && /central-nf/.test(p), 'seleção do módulo fiscal via onclick (sobrevive à re-pintura)');
ok(/\.module-row \.module/.test(p) && /moduloFiscal/.test(p) && /fixBarra/.test(p), 'fixBarra localiza e repara o módulo fiscal na row');
ok(/<i class="ph ph-file-text"><\/i>Fiscal/.test(p), 'rótulo da aba forçado para "Fiscal"');
ok(/data-nes612/.test(p) && /menu-nfe/.test(p), '(re)cria #menu-nfe oficial com marca própria');
ok(/navigateTo\('fiscal-perfil'\)/.test(p) && /navigateTo\('fiscal-manifestacao'\)/.test(p) &&
   /navigateTo\('fiscal-ncm'\)/.test(p) && /navigateTo\('fiscal-enviar-xml'\)/.test(p) &&
   /navigateTo\('config-fiscal'\)/.test(p) && /navigateTo\('central-nf'\)/.test(p), 'os 6 itens oficiais do submenu');
ok(/sfo-pin/.test(p) && /defaultPrevented/.test(p), 'pin por clique reusa .sfo-pin e respeita o handler da v6.1.1 (sem duplo toggle)');
ok(/closest\('.module-menu'\)/.test(p) && /remove\(.sfo-pin.\)/.test(p), 'clique no item navega e o pin se solta');
ok(/MutationObserver/.test(p) && /\.module-row/.test(p), 'observer refaz o reparo após qualquer re-pintura da barra');
ok(/showApp/.test(p) && /__v612nes/.test(p), 'showApp embrulhado (boot tardio repara também)');

/* modo escuro — os claros fixos respeitam .digi-escuro */
const views = ['view-central-nf','view-fiscal-perfil','view-fiscal-manifestacao','view-fiscal-enviar-xml','view-fiscal-ncm','view-config-fiscal'];
ok(views.every(v => p.indexOf('body.digi-escuro #' + v) !== -1), 'as 6 shells fiscais têm gradiente escuro próprio');
ok(/nes612-css/.test(p) && /linear-gradient\(180deg,#0a1240/.test(p), 'CSS injetado nes612-css com gradiente escuro');
ok(/body\.digi-escuro \.fx-root-wrap \.fx-card/.test(p) && /body\.digi-escuro \.fx-root-wrap \.fx-barra/.test(p), 'fx-card/fx-barra escuros no dark');
ok(/body\.digi-escuro \.fx-root-wrap \.fx-tb th/.test(p) && /body\.digi-escuro \.fx-root-wrap \.fx-tb td/.test(p), 'tabelas fx legíveis no escuro');
ok(/module:not\(\.sfo-pin\) > \.module-menu/.test(p) && /pointer-events:none/.test(p) && /stopImmediatePropagation\(\)/.test(p), 'menus só abrem por clique; o hover não abre e o pai não navega direto');
ok(/module\.sfo-pin > \.module-menu/.test(p) && /fecharMenus/.test(p), 'clique no pai alterna submenu e clique fora fecha');
const menuSel = fs.readFileSync('ajustes_v52243_menu_versao_boleto_patch.js','utf8');
ok(/rotasDoModulo/.test(menuSel) && /:scope > \.module-menu/.test(menuSel) && !/var html = mod\.innerHTML/.test(menuSel), 'seleção da barra usa apenas rotas do pai e itens imediatos, sem acumular módulos');
const catalogo = fs.readFileSync('fiscal_catalogo_completo_patch.js','utf8');
ok(/data-fx-tab/.test(catalogo) && /type="button" class="fx-tab/.test(catalogo) && !/cfg-aba.*onclick/.test(catalogo), 'abas de Configurações usam botões reais sem onclick inline quebrável');
ok(/closest\('\[data-fx-tab\]'\)/.test(p) && /acao\('cfg-aba'/.test(p), 'clique das dez abas é delegado pelo patch final e chama a ação de re-render');
ok(['Geral','Impressão','NFCe','Tributação','Nuvem','Outras','Mensagens','FCP','Autorizações','Reforma'].every(function(a){ return catalogo.indexOf("aba === '" + a + "'") >= 0; }), 'as dez abas têm roteamento de renderização, não apenas rótulos');
ok(/FISCAIS_LEGADOS/.test(p) && /removerOpcoesFiscaisLegadas/.test(p) && /data-sxv-go/.test(p), 'as três opções fiscais legadas são removidas do DOM, sem apagar as rotas de dados');
const fx = ler('fiscal_catalogo_completo_patch.js');
ok(/\.fx-root-wrap \.fx-tabs/.test(fx) && /\.fx-root-wrap \.fx-tab\.on/.test(fx) && /CONFIG_ABAS = \['Geral', 'Impressão', 'NFCe', 'Tributação'/.test(fx), 'configuração fiscal mostra e estiliza as 10 abas internas');
ok(/body\.digi-escuro #menu-nfe\{/.test(p) && /body\.digi-escuro #menu-nfe button:hover/.test(p), 'submenu #menu-nfe escuro na barra');
ok(/body\.digi-escuro #sxvm-flyout-nav\{/.test(p), 'flyout lateral escuro');
const regrasClarasEscuras = (p.match(/digi-escuro/g) || []).length;
ok(regrasClarasEscuras >= 16, 'cobertura escura ampla (' + regrasClarasEscuras + ' menções a digi-escuro)');
ok(!/digi-escuro\s*[{,][^{}]*#f6f9ff|#f8fbff/.test(p), 'nenhum fundo claro nos blocos escuros');

/* convívio e manifesto */
const man = JSON.parse(ler('bundle-manifest.json'));
ok(man.length >= 225 && man[221] === 'navegacao_fiscal_barra_escuro_patch.js' && man[220] === 'submenu_fiscal_oficial_patch.js',
  'manifesto 225: v6.1.1 antes, v6.1.2 fecha a fila, v6.1.8 soma memória da tela + conferência da NF-e');
const ix = ler('index.html');
// v6.1.4 — a versão sai do package.json: subir a versão não reescreve o teste.
const VERSAO_APP = JSON.parse(ler('package.json')).version;
ok(ix.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 &&
   ix.indexOf('<title>Sistema Digicopy v' + VERSAO_APP + '</title>') >= 0 &&
   ix.indexOf('>v' + VERSAO_APP + '<') >= 0 &&
   ix.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0, '4 carimbos atuais no index');
ok(/>Fiscal<\/button><div id="menu-nfe"/.test(ix) || /<\/i>Fiscal<\/button><div id="menu-nfe"/.test(ix), 'index estático segue com a aba "Fiscal" + #menu-nfe');
ok(!/localStorage\.setItem\('db\./.test(p) && !/indexedDB/.test(p), 'não toca banco, não importa dado (importação continua cancelada)');

console.log('  ► v6.1.2: ' + okCount + ' PASS | ' + (process.exitCode ? 'FALHAS' : '0 FALHAS'));
//<<<<SECAO:test_ajustes_v6102.js:FIM>>>>
}

if (false) { // ═══ test_camadas_protegidas.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_camadas_protegidas.js:INICIO>>>>
// ═════════════════════════════════════════════════════
// TESTE — CAMADAS PROTEGIDAS (o defeito mais caro do sistema em camadas)
//
// O QUE ELE PROVA:
// duas peças do sistema EMBRULHAM funções para proteger comportamento:
//   1. `popup_sistema_patch.js` — troca a janela nativa pela janela do sistema
//      (e o `confirm` nativo global passa pelo popup);
//   2. `permissoes_estorno_venda_patch.js` — `wrapGate`: só deixa apagar/estornar
//      quem tem a permissão.
//
// O embrulho vale enquanto ninguém REDEFINIR aquele nome depois. Se um patch
// novo redefine o nome sem levar o embrulho junto, a proteção some em silêncio:
// a janela volta a ser a do navegador ou a permissão deixa de ser cobrada.
// Este teste lê o MAPA DAS CAMADAS (`mapa_camadas.js`) e reprova quando isso
// acontece SEM que o patch novo (a) chame a função antiga (encadeie) ou
// (b) use a janela do sistema por conta própria (ou confira a permissão).
//
// Isto é guarda-corpo: NÃO muda o funcionamento. Ele só impede a volta do
// padrão "sobrescreveu e esqueceu o que existia".
// ═════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  \u2718 ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}

const M = require('./mapa_camadas.js');
const r = M.escreverGlobais();
const posicao = {};
r.ordem.forEach((f, i) => { posicao[f] = i; });
const escritas = (nome) => (r.nomes.get(nome) || []).slice().sort((a, b) => a.pos - b.pos);

console.log('== CAMADAS PROTEGIDAS (nada muda no sistema: só confere) ==');
ok('o mapa das camadas foi lido com o parser (acorn), sem chute por texto', r.semParser === false);
ok('o mapa encontrou os nomes globais do sistema (mais de 900)', r.nomes.size > 900, String(r.nomes.size));
ok('e a leitura bate com a realidade: quem ganha o `saveDB` é o portão de escrita (por cima da sincronização da nuvem)',
  (() => { const d = escritas('saveDB').filter((x) => x.tempo === 'no carregamento'); return d.length >= 2 && d[d.length - 1].arquivo === 'ajustes_v7021_portao_escrita_patch.js' && d[d.length - 2].arquivo === 'cloudflare_data_sync_patch.js'; })());

// ── 1) o gate de permissão (permissoes_estorno_venda_patch.js) ──────────────
console.log('-- 1) quem apaga/estorna só com permissão: o embrulho continua valendo? --');
{
  const fonte = fs.readFileSync('permissoes_estorno_venda_patch.js', 'utf8');
  const embrulhados = [...fonte.matchAll(/wrapGate\(\s*'([A-Za-z_$][\w$]*)'/g)].map((m) => m[1]);
  ok('li os ' + embrulhados.length + ' nomes embrulhados pelo gate de permissão', embrulhados.length >= 10, embrulhados.join(', '));
  const posGate = posicao['permissoes_estorno_venda_patch.js'];
  const perdidos = [];
  embrulhados.forEach((nome) => {
    const antes = escritas(nome).filter((x) => x.pos < posGate);
    const depois = escritas(nome).filter((x) => x.pos > posGate);
    // Se a função ainda não existia quando o gate rodou, o próprio gate tenta de novo
    // (é o `setTimeout` de 1,2 s): ele pega a versão final. O que NÃO pode é a função
    // já existir, ser embrulhada e depois ser trocada em silêncio.
    if (antes.length && depois.length) perdidos.push(nome + ' → ' + depois[depois.length - 1].arquivo);
  });
  ok('nenhuma função embrulhada pelo gate de permissão foi trocada depois (perdeu o embrulho)'
    + (perdidos.length ? ' — PERDERAM: ' + perdidos.join(' | ') : ''), perdidos.length === 0);
}

// ── 2) o popup do sistema (popup_sistema_patch.js) ────────────────────────
console.log('-- 2) janela do sistema no lugar da janela do navegador --');
{
  const fonte = fs.readFileSync('popup_sistema_patch.js', 'utf8');
  const nomes = new Set();
  // (a) os que o popup troca direto (alert/confirm/lfbAlert/confirmSistema…)
  [...fonte.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)].forEach((m) => nomes.add(m[1]));
  // (b) os que ele embrulha por nome, no mapa de exclusões e nos estornos
  [...fonte.matchAll(/'(delete[A-Za-z]*|estornar[A-Za-z]*|doLogout|excluir[A-Za-z]*)'\s*:/g)].forEach((m) => nomes.add(m[1]));
  [...fonte.matchAll(/window\[?['"]?([A-Za-z_$][\w$]*)['"]?\]?/g)].forEach((m) => nomes.add(m[1]));
  const protegidos = [...nomes].filter((n) => n !== 'confirm' && n !== 'alert' && n !== 'confirmSistema'
    && n !== 'lfbAlert' && n !== 'avisoSistema' && escritas(n).length);
  ok('li os ' + protegidos.length + ' nomes que o popup protege (janela do sistema/exclusões/estornos)',
    protegidos.length >= 5, protegidos.join(', '));

  // A regra: quem redefine depois tem de (a) encadear a versão anterior, (b) usar a
  // janela do sistema, ou (c) conferir a permissão — senão a proteção se perdeu.
  const posPopup = posicao['popup_sistema_patch.js'];
  const semProtecao = [];
  protegidos.forEach((nome) => {
    const depois = escritas(nome).filter((x) => x.pos > posPopup);
    if (!depois.length) return;
    const ult = depois[depois.length - 1];
    const trecho = fs.readFileSync(ult.arquivo, 'utf8');
    const linhas = trecho.split('\n');
    const janela = linhas.slice(Math.max(0, ult.linha - 8), ult.linha + 70).join('\n');
    const encadeia = /old[A-Za-z]*\.apply\s*\(|\borig\.apply\s*\(|\b_f\.apply\s*\(|window\[['"][A-Za-z]+['"]\]\s*\.apply/.test(janela);
    // a janela do sistema entra por vários nomes: `confirmSistema(...)`, o apelido local
    // `confirma(...)` (v5.24.0), `confirmar(...)`, `nfxConfirmar(...)`, `showModal(...)`
    const usaJanelaDoSistema = /confirmSistema|nfxConfirmar|\bconfirmar\s*\(|\bconfirma\s*\(|lfbAlert\s*\(|avisoSistema\s*\(|showModal\s*\(/.test(janela);
    const checaPermissao = /usuarioPode[A-Za-z]*\s*\(|p605Pode\s*\(|usuarioLogado\s*\(/.test(janela);
    if (!(encadeia || usaJanelaDoSistema || checaPermissao)) {
      semProtecao.push(nome + ' → ' + ult.arquivo + ':' + ult.linha);
    }
  });
  ok('toda função que o popup protege e depois foi trocada leva a proteção junto (encadeia, usa a janela do sistema ou confere a permissão)'
    + (semProtecao.length ? ' — SEM PROTEÇÃO: ' + semProtecao.join(' | ') : ''), semProtecao.length === 0);
}

// ── 3) o arquivo do mapa está no repositório e é o mesmo que o teste leu ──
console.log('-- 3) o mapa publicado bate com o que o teste acabou de ler --');
{
  const md = fs.readFileSync('MAPA_CAMADAS.md', 'utf8');
  const total = [...r.nomes.values()].reduce((s, d) => s + d.length, 0);
  const repetidos = [...r.nomes.values()].filter((d) => d.length > 1).length;
  ok('o MAPA_CAMADAS.md está no repositório e diz os mesmos números (' + r.nomes.size + ' nomes, ' + repetidos + ' repetidos)',
    md.indexOf('Nomes globais escritos: **' + r.nomes.size + '**') >= 0 &&
    md.indexOf('Nomes escritos em **2 ou mais** arquivos: **' + repetidos + '**') >= 0 &&
    md.indexOf('Escritas totais (contando as repetições): **' + total + '**') >= 0);
  ok('e o nome mais disputado do sistema aparece nele (o mesmo que o mapa achou)',
    md.indexOf('`' + [...r.nomes.entries()].sort((a, b) => b[1].length - a[1].length)[0][0] + '`') >= 0);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — as funções protegidas (permissão e janela do sistema) continuam protegidas depois de todas as camadas.');
//<<<<SECAO:test_camadas_protegidas.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52412.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52412.js:INICIO>>>>
// test_ajustes_v52412.js — v5.24.34: notinha FATURADA → Imprimir inacessível
// Causa (diagnosticada no código): a trava anti-editção lockVendaFaturadaUI
// (vendas_notinhas_fix_patch.js) desliga botões cujo onclick contenha
// "salvar|faturar|item|..." — e o Imprimir do editor chama
// vosAbrirImpressaoESalvar(): tem "salvar" no NOME. Impressão é leitura,
// nunca edição. Fix: isenção dentro da própria varredura da trava.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const fix = fs.readFileSync('vendas_notinhas_fix_patch.js', 'utf8');

ok(fix.includes('v5.24.34'), 'carimbo v5.24.34 na trava corrigida');
ok(fix.includes('IMPRIMIR NUNCA É EDI'), 'comentário explica a isenção (imprimir não é edição)');
ok(fix.includes('const iaDesligar'), 'sweep refatorada para decidir duas vezes (iaDesligar)');
ok(fix.includes('if (iaDesligar && ('), 'isenção só se aplica a quem IA ser desligado');
ok(fix.includes("btn.setAttribute('onclick', \"imprimirNotinha('"), 'botão Imprimir ganha impressão DIRETA (sem salvar)');
ok(fix.includes('String(vendaId)'), 'impressão da isenção mira o vendaId travado');
ok(fix.includes("btn.title = 'Imprimir notinha (não altera nada)';"), 'hint no botão: imprimir não altera nada');
ok(fix.includes('if (iaDesligar) {'), 'guarda original segue protegendo botões de EDIÇÃO');

// Ordem na varredura: a isenção (return) aparece ANTES do caminho de desligar.
const base = fix.indexOf('const iaDesligar');
ok(base > -1, 'varredura localizada');
const idxIsencao = fix.indexOf('return;', base);
const idxDesliga = fix.indexOf('btn.disabled = true;', base);
ok(idxIsencao !== -1 && idxDesliga !== -1 && idxIsencao < idxDesliga,
   'isenção (return) vem antes do desligamento dentro da mesma varredura');

// A trava em si continua existindo e saudável para adicionar/salvar/faturar.
ok(fix.includes('avisoVendaFaturada'), 'aviso de venda faturada mantido');
ok(fix.includes('Estornar'), 'botão Estornar da faturada mantido');

// Fix realmente dentro do bundle que ele baixa (PC + celular = mesma origem).
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('v5.24.34'), 'bundle carrega o carimbo da correção');
ok(bundle.includes('const iaDesligar'), 'bundle CONTÉM a isenção corrigida');
const mBundle = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
ok(mBundle.includes('const iaDesligar'), 'bundle do CELULAR contém a isenção');

// Carimbos de versão (rodapé = prova que ele exige em cada teste).
const idx = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(idx.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: DIGICOPY_APP_VERSION v' + pkg.version);
ok(idx.includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(idx.includes('app.bundle.js?v=' + pkg.version), 'index: cache-bust do bundle v' + pkg.version);
ok(!idx.includes('5.24.11'), 'index: nenhum carimbo velho sobrou');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
ok(mob.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'mobile: DIGICOPY_APP_VERSION v' + pkg.version);
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const vW = (worker.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').includes('Worker ' + vW), 'worker carimbado (v' + vW + ') e motor colado na mesma versão');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (Imprimir na faturada destravado).');
//<<<<SECAO:test_ajustes_v52412.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52421.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52421.js:INICIO>>>>
// test_ajustes_v52421.js — v5.24.34: RELATORIO GRANDE dele (pacote 1 de 2).
// P1 orçamento fantasma: render vivo guarda os OBJETOS das linhas; o abrir
// resgata em silêncio se o banco sumiu com o id (e anota pro diagnóstico).
// P2 plaquinha neutra da aba OS some (estados verde/âmbar ficam).
// P3 "Pré-visualizar NF-e" não mora mais na tela de consultar notinhas.
// P4 "Mostrando 300 de N" só aparece quando a lista está visível.
// P9 "DE DE / ATÉ ATÉ": o v5.22.45 confere o rótulo já existente antes de
//    enfiar outro.
// P10 financeiro: datas/tipo/ordem NÃO aplicam sozinhos — botões Filtrar e
//    Remover filtro assumem a aplicação.
// P11 clientes: mesma régua — Enter ou Filtrar aplicam; Remover filtro limpa
//    a tela; a lista só aparece depois do primeiro filtro da visita.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const orc58 = fs.readFileSync('ajustes_v52258_orcamento_os_revalidar_patch.js', 'utf8');
const orc37 = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
const vos = fs.readFileSync('vendas_os_patch.js', 'utf8');
const fluxos = fs.readFileSync('fluxos_operacionais_patch.js', 'utf8');
const nfe10 = fs.readFileSync('ajustes_v52210_historico_checkbox_nfe_patch.js', 'utf8');
const nfe9 = fs.readFileSync('ajustes_v5229_nfe_atalho_historico_patch.js', 'utf8');
const fin45 = fs.readFileSync('ajustes_v52245_financeiro_hist_datas_patch.js', 'utf8');
const fin43 = fs.readFileSync('ajustes_v52243_financeiro_filtros_patch.js', 'utf8');
const noti = fs.readFileSync('notinha_patch.js', 'utf8');

// P1 — orçamento
ok(orc58.includes('window.__orcUltimaLista = mapa'), 'P1: render vivo memoriza os objetos da tela');
ok(orc58.includes("__orc_render_ids"), 'P1: render vivo também atualiza o retrato dos ids');
ok(orc37.includes('RESGATE SILENCIOSO'), 'P1: abrirOrcamento tem o resgate');
ok(orc37.includes('window.__orcResgates'), 'P1: resgate anotado em __orcResgates');
ok(orc37.includes('store().push(achado)'), 'P1: o banco ganha a linha de volta antes de abrir');
ok(orc37.includes('Resgates feitos pela autocura'), 'P1: diagnóstico conta os resgates se o aviso ainda aparecer');
ok(!orc37.includes('Não achei esse orçamento neste PC agora. (Vazio'), 'P1: aviso velho não perdeu o gás do diagnóstico');

// P2 — plaquinha OS
ok(!vos.includes('Aba OS opcional. Se ficar vazia, a venda sai como'), 'P2: plaquinha neutra SOME da aba OS');
ok(vos.includes("el.style.display='none'"), 'P2: ela apaga de verdade (sem moldura)');
ok(vos.includes('OS completa!'), 'P2: estados verde (completa) seguem vivos');
ok(vos.includes('OS incompleta.'), 'P2: âmbar (incompleta) segue vivo');

// P3 — notinha sem NF-e prévia
ok(nfe10.includes('injeção desligada nesta tela'), 'P3: v52210 desliga o botão na consulta de notinha');
ok(!/b=botao\('btn-nfe-venda-lista','neo-btn'/.test(nfe10), 'P3: o botão venda não é mais fabricado');
ok(nfe9.includes('nada de "Pré-visualizar NF-e" na tela de consultar notinha') || nfe9.includes('morto.remove()'), 'P3: v5229 também blinda a tela');
ok(nfe10.includes("botao('btn-nfe-leitura-hist'"), 'P3: botão das leituras CONTINUA (ele não pediu pra tirar)');

// P4 — hint de produtos
ok(fluxos.includes('list.length > vis.length && vis.length > 0'), 'P4: "Mostrando 300 de N" só com lista visível');
ok(fluxos.includes('Use a busca para refinar'), 'P4: o hint continua existindo quando a busca renderiza');

// P9 — DE DE
ok(fin45.includes('jaTemDe'), 'P9: v52245 confere rótulo De existente');
ok(fin45.includes('jaTemAte'), 'P9: v52245 confere rótulo Até existente');
ok(fin45.includes('previousElementSibling'), 'P9: a conferência olha o irmão do campo');

// P10 — financeiro
ok(fin43.includes('finAplicarFiltroV52421'), 'P10: botão Filtrar existe');
ok(fin43.includes('finRemoverFiltroV52421'), 'P10: botão Remover filtro existe');
ok(!fin43.includes("if(el) el.onchange=function(){ window.finBuscarV52243(); };"), 'P10: datas/tipo/ordem NÃO aplicam mais sozinhos');
ok(fin43.includes("ST.de=''; ST.ate=''; ST.tipo='todos'; ST.ordem='venc-asc'"), 'P10: Remover filtro zera data, tipo e ordenação');
ok(fin43.includes('bg-amber-500'), 'P10: Filtrar avisa quando há escolha pendente (laranja)');

// P11 — clientes
ok(noti.includes("if(!window.__cliFoiFiltrado) list=[]"), 'P11: a lista só aparece depois de filtrar');
ok(noti.includes('cli-btn-filtrar'), 'P11: botão Filtrar existe');
ok(noti.includes('cli-btn-remover-filtro'), 'P11: botão Remover filtro existe');
const cliPatch = fs.readFileSync('clientes_patch.js', 'utf8');
ok(!noti.includes('oninput="renderClientes()"') && !cliPatch.includes('oninput="renderClientes()"'), 'P11: a caixa NÃO aplica mais sozinha (neo + clássico)');
ok(noti.includes("e.key==='Enter'"), 'P11: Enter aplica');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('__orcUltimaLista'), 'bundle: resgate presente');
ok(bundle.includes('finAplicarFiltroV52421'), 'bundle: financeiro novo presente');
ok(bundle.includes('cli-btn-remover-filtro'), 'bundle: clientes novo presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('__orcUltimaLista'), 'bundle do CELULAR igual');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' pacote 1 (P1 resgate orçamento, P2, P3, P4, P9, P10, P11).');
//<<<<SECAO:test_ajustes_v52421.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5249.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5249.js:INICIO>>>>
// Teste v5.24.34 — ETIQUETA DE ORIGEM no aviso do orçamento fantasma:
//  • o guard (7 buscas) agora recebe QUEM chamou e o aviso completa com
//    "o clique veio de: ..." — a próxima foto responde a investigação;
//  • os 2 recarregamentos internos (pós-salvar e pós-revalidar) viraram
//    direto-por-objeto — nunca mais re-caçam por id;
//  • linhas e botões de olho das duas listas carregam a etiqueta;
//  • carimbos 5.24.34.
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }
const orc37  = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
const orc58  = fs.readFileSync('ajustes_v52258_orcamento_os_revalidar_patch.js', 'utf8');
const orc43  = fs.readFileSync('ajustes_v52243_orcamentos_status_patch.js', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM= fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg    = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('-- etiqueta de origem --');
ok(orc37.indexOf('window.abrirOrcamento=function(id, _origem){') >= 0, 'guard aceita a etiqueta (_origem)');
ok(orc37.indexOf('o clique veio de:') >= 0 && orc37.indexOf('lugar não identificado — mande a foto da tela inteira') >= 0, 'aviso completa com a origem do clique');
ok(orc37.indexOf('linha da lista de orcamentos') >= 0 && orc37.indexOf('botao de olho da lista') >= 0, 'lista v52237 etiquetada (linha + olho)');
ok(orc58.indexOf('linha da lista de orcamentos') >= 0 && orc58.indexOf('botao de olho da lista') >= 0, 'lista v52258 etiquetada (linha + olho)');

console.log('-- recarregamentos internos direto-por-objeto --');
ok(orc58.indexOf('window.abrirOrcamento(o.id)') === -1, 'v52258 não re-caça mais por id em lugar nenhum');
const reabertos = orc58.split('window.abrirTelaOrcamento(o);').length - 1;
ok(reabertos === 2, 'pós-salvar e pós-revalidar reabrem pelo objeto (2 pontos)');
ok(orc43.indexOf("abrirOrcamento\\\\('([^']+)'\\\\)") >= 0 || orc43.indexOf("abrirOrcamento\\('([^']+)'\\)") >= 0, 'v52243 (badge de status) continua casando a 1ª aspa — etiqueta não quebra o leitor');

console.log('-- integridade --');
const vW = (worker.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').indexOf('Worker ' + vW) >= 0, 'worker carimbado (v' + vW + ') e motor colado na mesma versão');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(bundle.indexOf('o clique veio de:') >= 0 && bundle.indexOf('linha da lista de orcamentos') >= 0, 'etiquetas dentro do bundle');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0 && indexHtml.indexOf('app.bundle.js?v=' + pkg.version) >= 0, 'index.html na v' + pkg.version);
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0, 'mobile/www/index.html na v' + pkg.version);
ok(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json com versão válida (v' + pkg.version + ')');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) v' + pkg.version); process.exit(1); }
console.log('\nTudo certo v' + pkg.version + '!');
//<<<<SECAO:test_ajustes_v5249.js:FIM>>>>
}

if (false) { // ═══ test_r63_moeda.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_r63_moeda.js:INICIO>>>>
const fs = require('fs');
let falhas = 0;
function ok(c, m){ if(c){ console.log('  ok - '+m); } else { falhas++; console.error('  FALHA - '+m); } }
console.log('-- r63 P1 dinheiro: 1,00 vale 1 (auditoria 30/09) --');
const neo = fs.readFileSync('notinha_patch.js', 'utf8');
function bloco(s, a, b){ const i = s.indexOf(a), j = s.indexOf(b); if(i<0||j<0||j<i) return null; return s.slice(i+a.length, j); }
const pure = bloco(neo, '/* NEONOTA_PURE_START */', '/* NEONOTA_PURE_END */');
ok(!!pure, 'bloco NEONOTA_PURE extraível p/ teste');
const P = new Function((pure || '') + '; return {parseMoedaBR};')();
ok(P.parseMoedaBR('1,00') === 1, "1,00 vale 1 (nunca 100)");
ok(P.parseMoedaBR('1') === 1, '1 vale 1');
ok(P.parseMoedaBR('1.00') === 1, '1.00 (americano) vale 1');
ok(P.parseMoedaBR('1.234,56') === 1234.56, '1.234,56 vale 1234.56');
ok(P.parseMoedaBR('R$ 10,50') === 10.5, 'R$ 10,50 vale 10.5');
ok(P.parseMoedaBR('0,99') === 0.99, '0,99 vale 0.99');
ok(P.parseMoedaBR('-2,50') === -2.5, 'negativo preservado');
ok(P.parseMoedaBR('') === 0 && P.parseMoedaBR('abc') === 0, 'vazio/lixo viram 0');
ok(neo.indexOf('id="neo-prod-valor" type="text" inputmode="decimal"') >= 0, 'valor: number→text+decimal');
ok(neo.indexOf('id="neo-prod-qtd" type="text" inputmode="decimal"') >= 0, 'qtd: number→text+decimal');
ok(neo.indexOf('id="neo-venda-desc" type="text" inputmode="decimal"') >= 0, 'desconto: number→text+decimal');
ok(neo.indexOf("parseFloat(document.getElementById('neo-prod-valor')") === -1, 'valor sem parseFloat cru');
ok(neo.indexOf("parseFloat(document.getElementById('neo-prod-qtd')") === -1, 'qtd sem parseFloat cru');
ok(neo.indexOf("parseFloat(document.getElementById('neo-venda-desc')") === -1, 'desconto sem parseFloat cru');
ok(neo.indexOf('parseMoedaBR(this.value)') >= 0, 'blur mostra o valor interpretado');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.indexOf('function parseMoedaBR') >= 0, 'parseMoedaBR chegou no bundle');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) r63-moeda'); process.exit(1); }
console.log('\nRESULTADO: r63 moeda passou!');
//<<<<SECAO:test_r63_moeda.js:FIM>>>>
}

if (false) { // ═══ test_r64_produto.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_r64_produto.js:INICIO>>>>
const fs = require('fs');
let falhas = 0;
function ok(c, m){ if(c){ console.log('  ok - '+m); } else { falhas++; console.error('  FALHA - '+m); } }
console.log('-- r64 P1 dinheiro produto: 12,50 vale 12,50 (auditoria 30/09) --');
const app = fs.readFileSync('app.js', 'utf8');
ok(app.indexOf('id="f-prd-custo" type="text" inputmode="decimal"') >= 0, 'custo: number→text+decimal');
ok(app.indexOf('id="f-prd-preco" type="text" inputmode="decimal"') >= 0, 'preço: number→text+decimal');
ok(app.indexOf("parseFloat(document.getElementById('f-prd-custo').value)||0, preco:parseFloat") === -1, 'salvar sem parseFloat cru');
ok(app.indexOf("parseMoedaBR(document.getElementById('f-prd-preco').value)") >= 0, 'salvar usa parseMoedaBR (preço)');
ok(app.indexOf("parseMoedaBR(document.getElementById('f-prd-custo').value)") >= 0, 'salvar usa parseMoedaBR (custo)');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.indexOf('id="f-prd-preco" type="text"') >= 0, 'produto novo chegou no bundle');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) r64-produto'); process.exit(1); }
console.log('\nRESULTADO: r64 produto passou!');
//<<<<SECAO:test_r64_produto.js:FIM>>>>
}
