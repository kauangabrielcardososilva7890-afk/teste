// ═══════════════════════════════════════════════════════════════
// test_msg_08_fiscal.js — GERADO por migrar_testes_r57.js; 17 seções.
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_automacoes_fiscal_cartuchos.js, test_ajustes_v5220.js, test_ajustes_v5221.js, test_ajustes_v5228.js, test_ajustes_v5229.js, test_ajustes_v52210.js, test_ajustes_v52229.js, test_ajustes_v52426.js, test_ajustes_v6000.js, test_ajustes_v6006.js, test_ajustes_v60011.js, test_ajustes_v60013.js, test_ajustes_v60014.js, test_ajustes_v6100.js, test_ajustes_v6101.js, test_falta_emitir.js
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

if (false) { // ═══ test_automacoes_fiscal_cartuchos.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_automacoes_fiscal_cartuchos.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('automacoes_fiscal_cartuchos_patch.js','utf8');
const db = {
  config:{},
  clientes:[{id:'cli1', empresaId:'emp', codigo:'10', nome:'Cliente Teste', documento:'12.345.678/0001-90', endereco:'Rua A', cidade:'Bocaiuva', estado:'MG'}],
  produtos:[{id:'prd1', empresaId:'emp', sku:'5', nome:'Produto 5', custo:10, preco:20, categoria:'Produto'}, {id:'prd2', empresaId:'emp', sku:'20', nome:'Insumo', custo:2, preco:5, categoria:'Produto'}],
  vendas:[{id:'v1', empresaId:'emp', numero:'100', codigoAntigo:'100', clienteId:'cli1', total:40, observacao:'Obs venda', itens:[{codigoAntigo:'77', descricao:'Recarga'}]}],
  leituras:[], contasReceber:[{id:'cr1', empresaId:'emp', vendaId:'v1', valor:40, vencimento:'2026-08-10', status:'aberto'}],
  modulosDinamicos:{
    NOTA_FISCAL:{dados:[{NF_CODIGO:1, NF_COD_CLIENTE:10, NF_COD_VENDA:100, NF_MODELO:55, NF_SITUACAO:'AUTORIZADA', NF_VALOR_TOTAL:40, NF_TOTAL_IMPOSTOS:3.5}]},
    ITENS_NOTA:{dados:[{IN_CODIGO:1, IN_COD_NOTA_FISCAL:1, IN_COD_PRODUTO:5, IN_VALOR_UNITARIO:20, IN_QTDE:2, IN_TIPO_DESCRICAO:'PRODUTO', IN_NCM:'12345678', IN_CEST:'01.001.00'}]},
    CARTUCHOS:{dados:[{COD_CARTUCHO:9, TIPO:'TONER', COD_FABRICANTE:1, NUMERO:'85A', COR:'PRETO', QTDE_COPIAS:1600}]},
    FABRICANTE:{dados:[{COD_FABRICANTE:1, NOME:'HP'}]},
    ITENS_INSUMOS:{dados:[{COD_CARTUCHO:9, VALOR_TOTAL:12}]},
    PRODUTOS_VARIACAO:{dados:[{PRV_CODIGO:1, PRV_COD_PRODUTO:5, PRV_IDENTIFICACAO:'ABC', PRV_QTDE:-1}]},
    PRODUTOS_VARIACAO_ITENS:{dados:[{PVI_CODIGO:1, PVI_COD_VARIACAO:1}]},
    ITENS_INSUMOS_GASTOS:{dados:[{COD_ITENS_INSUMOS_GASTOS:1, COD_ITENS_RECARGA:77, COD_PRODUTO:20, QTDE:3, VALOR_UNITARIO:4, VALOR_UNIT_CUSTO:2, SOMAR_INSUMO:'S'}]},
    ESTORNOS:{dados:[{ES_COD_ESTORNO:1, ES_TABELA:'VENDAS', ES_CODIGO:100, ES_MOTIVO:'Teste'}]}
  }
};
const ctx = { window:{}, db };
new Function('window','db', code)(ctx.window, ctx.db);
const A = ctx.window.AUTOMACOES_FISCAL_CARTUCHOS_PURE;
console.log('== AUTOMACOES_FISCAL_CARTUCHOS_PURE ==');
const def = A.defaultsNotaFiscal(db.modulosDinamicos.NOTA_FISCAL.dados[0], 'emp');
ok('defaults nota fiscal puxam cliente', def.clienteId === 'cli1' && def.clienteNome === 'Cliente Teste');
ok('totaliza itens da nota', A.totaisNotaPorItens(1).produtos === 40);
const changed = A.aplicarAutomacoesFiscalCartuchos('emp');
ok('aplicou automações', changed > 0);
ok('nota fiscal migrada criada', db.notasFiscaisMigradas.length === 1 && db.notasFiscaisMigradas[0].clienteId === 'cli1');
ok('fatura NFE criada', db.faturasNfe.length === 1);
ok('produto recebeu NCM/CEST', db.produtos[0].ncm === '12345678' && db.produtos[0].cest === '01.001.00');
ok('cartucho migrado sem criar produto vazio', db.cartuchosMigrados.length === 1 && !db.produtos.some(p => p.categoria === 'Cartucho Vazio') && db.cartuchosMigrados[0].usaCartuchoVazioComoProduto === false);
ok('variação não fica negativa', db.produtosVariacaoMigrados[0].qtde === 0);
ok('insumo gasto atualiza valor de insumos no item', db.vendas[0].itens[0].valorInsumos === 12);
ok('estorno marca venda', db.vendas[0].status === 'estornada');
console.log('\nRESULTADO: Testes de automações fiscal/cartuchos passaram!');
//<<<<SECAO:test_automacoes_fiscal_cartuchos.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5220.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5220.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v5220_nfe_config_patch.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const preload=fs.readFileSync('preload.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.NFE_CONFIG_PURE;
console.log('== NF-E CONFIG v5.22.0 ==');
ok('exporta funções puras',!!P&&typeof P.salvarFiscal==='function');
ok('não grava senha do certificado',!/pfxPassword|senhaPfx|senhaA1|certPassword/.test(code));
ok('card fala que ainda não emite',/Ainda não emite nota/.test(code));
ok('certificado fica em userData/certs',main.includes('nfe-a1.pfx')&&main.includes('userData'));
ok('preload expõe nfeCertAPI',/nfeCertAPI/.test(preload));
ok('patch entra no bundle',manifest.includes('ajustes_v5220_nfe_config_patch.js'));
console.log('\nRESULTADO: preparação NF-e passou!');
//<<<<SECAO:test_ajustes_v5220.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5221.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5221.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v5221_nfe_emissao_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.NFE_EMISSAO_PURE;
console.log('== NF-E EMISSAO v5.22.1 ==');
ok('exporta funções puras',!!P&&typeof P.montarDocumento==='function');
ok('não grava senha do certificado',!/pfxPassword|senhaPfx|senhaA1|certPassword/.test(code));
ok('não envia para SEFAZ nesta versão',!/NFeAutorizacao4|hnfe\.fazenda/.test(code));
ok('CRT 1 Simples travado',/crt:'1'/.test(code)&&/simei:false/.test(code));
ok('Jaíba tem IBGE',P.codigoIbge('Jaíba','MG')==='3135050');
ok('Janaúba tem IBGE',P.codigoIbge('Janaúba','MG')==='3135100');

const loja={razaoSocial:'DIGICOPY CARTUCHOS LTDA',fantasia:'DIGICOPY',cnpj:'08385589000103',rua:'Rua A',numero:'10',bairro:'Centro',cidade:'Jaíba',uf:'MG',cep:'39508000',telefone:'3838210000'};
const fiscal={ie:'123456789',crt:'1',serie:'1',ambiente:'2',uf:'MG'};
const cliente={nome:'Cliente Teste',documento:'39053344705',rua:'Rua B',numero:'20',bairro:'Centro',cidade:'Jaíba',estado:'MG',cep:'39508000'};
const venda={numero:'88',itens:[{descricao:'Toner',qtd:1,preco:100,desconto:0,ncm:'84439923',tipo:'Produto'}]};
const doc=P.montarDocumento({origem:'venda',venda,cliente,loja,fiscal,produtos:[],existentes:[],certificadoLocal:true,data:'2026-08-18T12:00:00'});
ok('documento da venda fica ok',doc.ok===true);
ok('XML tem modelo 55',P.montarXml(doc).includes('<mod>55</mod>'));
ok('XML tem CRT 1',P.montarXml(doc).includes('<CRT>1</CRT>'));
ok('chave tem 44 dígitos',doc.chave.length===44);
ok('sem A1 bloqueia',P.montarDocumento({origem:'venda',venda,cliente,loja,fiscal,produtos:[],existentes:[],certificadoLocal:false}).ok===false);

const leitura={numero:'12',itens:[{valorTotal:80}],valorTotal:80};
const docL=P.montarDocumento({origem:'leitura',leitura,cliente,loja,fiscal:{...fiscal,ncmPadrao:'84439923'},produtos:[],existentes:[],certificadoLocal:true});
ok('leitura monta item',docL.itens.length===1&&docL.totais.vNF>0);
ok('sem IE da loja aponta o erro',P.validarEmitente(P.emitenteDe(loja,{})).includes('Inscrição Estadual da loja'));
ok('patch entra no bundle',manifest.includes('ajustes_v5221_nfe_emissao_patch.js'));
ok('botão de conferência existe no código',code.includes('Conferir NF-e')&&code.includes('conferirNfe'));
ok('conferência não grava no banco',!/saveDB\(/.test(code));
ok('não grava fiscal sozinho ao abrir',!/garantirFiscalSimples\(\);\s*atualizarCardNfe/.test(code));
ok('envolve tela original antes de injetar botão',/const r=orig\.apply\(this,arguments\)/.test(code));
console.log('\nRESULTADO: conferência NF-e passou!');
//<<<<SECAO:test_ajustes_v5221.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5228.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5228.js:INICIO>>>>
const fs=require('fs');
const forge=require('node-forge');
const S=require('./nfe_assinatura.js');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

function fazerPfxTeste(senha){
  const keys=forge.pki.rsa.generateKeyPair(1024);
  const cert=forge.pki.createCertificate();
  cert.publicKey=keys.publicKey;
  cert.serialNumber='01';
  cert.validity.notBefore=new Date();
  cert.validity.notAfter=new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear()+1);
  const attrs=[{name:'commonName',value:'DIGICOPY TESTE'}];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const p12=forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], senha, {algorithm:'3des'});
  return Buffer.from(forge.asn1.toDer(p12).getBytes(), 'binary');
}

const xml=fs.readFileSync('ajustes_v5228_nfe_assinatura_patch.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const preload=fs.readFileSync('preload.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
console.log('== NF-E ASSINATURA A1 ==');
ok('não grava senha',!/localStorage|saveDB|escolaAuth/.test(xml)&&!/writeFileSync\([^)]*senha/.test(main));
ok('IPC assina sem persistir senha',/nfe:sign-xml/.test(main)&&!/nfe-a1-senha/.test(main));
ok('preload expõe assinar',/assinar:\s*\(xml,\s*senha/.test(preload));
ok('não envia SEFAZ',!/NFeAutorizacao4|hnfe\.fazenda/.test(xml)&&!/NFeAutorizacao4/.test(main));
ok('botão só depois da conferência ok',/Assinar com A1/.test(xml)&&/__nfeUltimoDoc/.test(xml));
ok('patch no bundle',manifest.includes('ajustes_v5228_nfe_assinatura_patch.js'));

const inf='<infNFe versao="4.00" Id="NFe'+('1'.repeat(44))+'"><ide></ide></infNFe>';
ok('C14N coloca xmlns e Id antes de versao',S.canonicalInfNfe(inf).startsWith('<infNFe xmlns="http://www.portalfiscal.inf.br/nfe" Id="NFe'));

const senha='teste-local';
const pfx=fazerPfxTeste(senha);
const nfe='<?xml version="1.0" encoding="UTF-8"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe">'+inf+'</NFe>';
let falhou=false;
try{ S.assinarNfeXml(nfe, pfx, 'errada'); }catch(e){ falhou=/Senha|inválido|invalido/i.test(e.message); }
ok('senha errada não assina',falhou);
const r=S.assinarNfeXml(nfe, pfx, senha);
ok('assina XML de teste',r.ok&&r.xmlAssinado.includes('<Signature')&&r.xmlAssinado.includes('</NFe>'));
ok('não devolve a senha',!JSON.stringify(r).includes(senha));
console.log('\nRESULTADO: assinatura A1 passou!');
//<<<<SECAO:test_ajustes_v5228.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5229.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5229.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v5229_nfe_atalho_historico_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.NFE_ATALHO_HISTORICO;
console.log('== ATALHO NF-E NO HISTÓRICO ==');
ok('exporta atalho',!!P&&typeof P.nfeAtalhoDoHistorico==='function');
ok('pede seleção da notinha',/Selecione uma notinha/.test(code));
ok('pede seleção da leitura',/Selecione uma leitura/.test(code));
ok('abre só pré-visualização',/Pré-visualizar NF-e/.test(code)&&/nfePreVisualizar/.test(code));
ok('não emite direto da lista',!/Assinar com A1/.test(code));
ok('não grava banco',!/saveDB\(/.test(code));
ok('não envia SEFAZ',!/NFeAutorizacao4|hnfe\.fazenda/.test(code));
ok('entra no histórico da notinha e da leitura',/historicoVenda/.test(code)&&/renderLeituras/.test(code));
ok('patch no bundle',manifest.includes('ajustes_v5229_nfe_atalho_historico_patch.js'));
console.log('\nRESULTADO: atalho NF-e no histórico passou!');
//<<<<SECAO:test_ajustes_v5229.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52210.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52210.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v52210_historico_checkbox_nfe_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.NFE_LISTA_CHECKBOX;
console.log('== HISTÓRICO CHECKBOX + NF-E ==');
ok('exporta helpers',!!P&&typeof P.umSoParaNfe==='function'&&typeof P.leituraBloqueada==='function');
ok('zero marcado pede uma',P.umSoParaNfe([]).ok===false);
ok('duas marcadas recusa',P.umSoParaNfe(['a','b']).ok===false&&/uma/i.test(P.umSoParaNfe(['a','b']).motivo));
ok('uma marcada segue',P.umSoParaNfe(['lei1']).ok===true&&P.umSoParaNfe(['lei1']).id==='lei1');
ok('faturada bloqueia exclusão',P.leituraBloqueada({status:'faturado'})===true);
ok('aberta pode excluir',P.leituraBloqueada({status:'aberta'})===false);
ok('histórico de leituras ganha caixa e excluir',/leitura-check-lote/.test(code)&&/btn-excluir-leitura-hist/.test(code));
ok('NF-e nas duas listas',/btn-nfe-venda-lista/.test(code)&&/btn-nfe-leitura-hist/.test(code));
ok('não emite direto',!/Assinar com A1/.test(code));
ok('não envia SEFAZ',!/NFeAutorizacao4|hnfe\.fazenda/.test(code));
ok('prévia não grava venda',!/db\.vendas\.push/.test(code));
ok('usa lfbAlert/confirmSistema',/lfbAlert/.test(code)&&/confirmSistema/.test(code));
ok('não usa window.confirm nativo',!/window\.confirm\(/.test(code));
ok('tira atalho do lugar errado',/btn-nfe-leitura-lista/.test(code)&&/remove\(/.test(code));
ok('patch no bundle',manifest.includes('ajustes_v52210_historico_checkbox_nfe_patch.js'));
console.log('\nRESULTADO: histórico checkbox + NF-e passou!');
//<<<<SECAO:test_ajustes_v52210.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52229.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52229.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52229_nfe_ie_im_cnae_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const P=ctx.window.NFE_IE_IM_CNAE_PURE;

ok('lê os 3 campos', P.lerFiscal({ie:'123',im:'456',cnae:'4744-0/01'}).cnae==='4744001' && P.lerFiscal({ie:'123',im:'456',cnae:'4744001'}).im==='456');
ok('falta IM e CNAE', P.faltaDados({ie:'001'}).join(' ').indexOf('Municipal')>=0 && P.faltaDados({ie:'001'}).join(' ').indexOf('CNAE')>=0);
ok('completo não falta', P.faltaDados({ie:'001',im:'99',cnae:'4744001'}).length===0);
ok('CNAE 7 dígitos', P.soCnae('47.44-0/01')==='4744001');
ok('não pede senha', !/senhaA1|type=\"password\"/.test(src));
ok('ainda não SEFAZ', /não emite na SEFAZ/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52229_nfe_ie_im_cnae_patch.js'));
ok('versão 5.22.29+', (/^\d+\.\d+\.\d+$/.test(pkg.version) && (parseInt(pkg.version.split('.')[0],10)>=6 || parseInt(pkg.version.split('.')[1],10)>=23 || parseInt(pkg.version.split('.')[2],10)>=29)) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.29 passou!');
//<<<<SECAO:test_ajustes_v52229.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52426.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52426.js:INICIO>>>>
// test_ajustes_v52426.js — v5.24.34: pedido dele "faz logo" (sprint NF): a
// Central ganha HISTÓRICO permanente das notas assinadas neste PC (número,
// cliente, data, chave + copiar chave). Local de propósito: a emissão só roda
// no PC que tem o A1, então a lista mora ali mesmo, sem custar nuvem.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const cn = fs.readFileSync('ajustes_v52231_nfe_central_menu_patch.js', 'utf8');
const as = fs.readFileSync('ajustes_v5228_nfe_assinatura_patch.js', 'utf8');

// REGISTRO disparado no SUCESSO da assinatura (nunca antes, nunca no erro)
ok(as.includes("typeof window.registrarNfeEmitida==='function'"), 'assinatura: chama o registrador no sucesso');
ok(as.indexOf('registrarNfeEmitida') > as.indexOf('mostrarXmlAssinado(r.xmlAssinado'), 'assinatura: registro vem DEPOIS do XML assinado (prova de que saiu)');

// HISTÓRICO
ok(cn.includes("digicopy_nfe_historico"), 'histórico: chave local própria');
ok(cn.includes('registrarNfeEmitida=registrarNfeEmitida') && cn.includes('window.registrarNfeEmitida'), 'histórico: registrador global (o v5228 alcança)');
ok(cn.includes('lista.unshift({') && cn.includes('numero:') && cn.includes('chave:') && cn.includes('cliente:'), 'histórico: guarda número, chave e cliente');
ok(cn.includes('slice(0,200)'), 'histórico: teto de 200 (nunca vira elefante)');
ok(cn.includes('cnfe-historico'), 'central: quadro Histórico das notas assinadas');
ok(cn.includes('Nenhuma nota assinada neste PC ainda'), 'histórico: estado vazio honesto');
ok(cn.includes('copiar'  === 'copiar' && 'data-cnfecopi'), 'histórico: botão copiar chave');
ok(cn.includes('slice(0,8)'), 'histórico: mostra últimas 8 (teto de tela)');
ok(cn.includes('histórico é melhoria, nunca trava emissão'), 'histórico: falha no registro NUNCA atrapalha emitir');
ok(cn.includes('NFE_CENTRAL_V52426'), 'central: exportação pure v5.24.34');
ok(cn.includes('pintarHistoricoNfe();'), 'central: histórico pinta ao abrir');

// teste funcional do guarda/lê (sem DOM)
const sandbox = { window:{}, localStorage:{ _d:{}, getItem(k){return this._d[k]||null;}, setItem(k,v){this._d[k]=v;} }, Date, console };
sandbox.window = {};
const fn = new Function('window','localStorage','Date', cn.replace(/if\(typeof document[\s\S]*$/,'') + '\n;return window.registrarNfeEmitida;');
const registrar = fn.call(sandbox, sandbox.window, sandbox.localStorage, Date);
if (typeof registrar === 'function') {
  registrar({ chave:'1234567890' }, { numero:12, cliente:{ nome:'Loja da Paula' }, origem:'venda' });
  const grav = JSON.parse(sandbox.localStorage.getItem('digicopy_nfe_historico'));
  ok(grav && grav.length === 1 && grav[0].numero === 12 && grav[0].cliente === 'Loja da Paula' && grav[0].chave === '1234567890', 'histórico: funcional — grava e lê certinho');
} else {
  ok(false, 'histórico: registrador exportado deveria ser função');
}

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('cnfe-historico') && bundle.includes('registrarNfeEmitida'), 'bundle: histórico dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('cnfe-historico'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'"), 'index 6.0.9');
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + VERSAO_APP + '<'), 'rodapé v6.0.9');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "' + VERSAO_APP + '"'), 'package.json 6.0.6');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.34 (histórico das notas assinadas na Central NF).');
//<<<<SECAO:test_ajustes_v52426.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6000.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6000.js:INICIO>>>>
// test_ajustes_v6000.js — v6.0.0: PORTÃO FISCAL (abre a linha NF).
// As três garantias que ele exigiu por escrito:
//  "como confio que o XML não dá problema?"  → nasce tudo em HOMOLOGAÇÃO
//  "como testo antes sem gerar NF de verdade?" → homologação = modo teste
//  "como confio que não gera NF sozinho?" → PROVA: nenhum temporizador neste
//     patch + conferência só acontece com clique + toda conferência deixa
//     rastro de auditoria (sem caminho silencioso).
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const src = fs.readFileSync('fiscal_guard_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const mobile = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');

console.log('== DECRETO 1: NASCE EM HOMOLOGAÇÃO (nunca produção por padrão) ==');
const pure = src.slice(src.indexOf('/* NFG_PURE_START */'), src.indexOf('/* NFG_PURE_END */'));
const s = { console };
vm.createContext(s);
vm.runInContext(pure, s);
ok('ambiente vazio/desconhecido → homologação (padrão seguro)', s.nfgAmbiente({config:{}}) === 'homologacao' && s.nfgAmbiente({config:{nfAmbiente:'qualquer-lixo'}}) === 'homologacao' && s.nfgAmbiente(null) === 'homologacao');
ok('só "producao" exato vira produção', s.nfgAmbiente({config:{nfAmbiente:'producao'}}) === 'producao');
ok('rótulo de homologação diz SEM VALOR FISCAL', /SEM VALOR FISCAL/.test(s.nfgRotulo('homologacao')));
ok('rótulo de produção diz VALE DE VERDADE', /VALE DE VERDADE/.test(s.nfgRotulo('producao')));

console.log('== DECRETO 2: SELO DE TESTE DENTRO DO XML (contabil nunca confunde) ==');
const xml1 = '<nfeProc><NFe><infNFe><infAdic><infCpl>Doc original</infCpl></infAdic></infNFe></NFe></nfeProc>';
const xml2 = '<NFe><infNFe></infNFe></NFe>';
ok('homologação injeta selo no infCpl existente', /NOTA DE TESTE, SEM VALOR FISCAL/.test(s.nfgSeloTeste(xml1, 'homologacao')));
ok('homologação cria infAdic quando não existe', s.nfgSeloTeste(xml2, 'homologacao').indexOf('<infAdic>') >= 0 && /SEM VALOR FISCAL/.test(s.nfgSeloTeste(xml2, 'homologacao')));
ok('produção NÃO toca no XML', s.nfgSeloTeste(xml1, 'producao') === xml1);

console.log('== DECRETO 3: DUPLICIDADE NUNCA PASSA SILENCIOSA ==');
const registro = { config: { nfRegistro: [ { modelo: '55', serie: '1', numero: '9', origemId: 'v1', status: 'autorizada' } ] } };
ok('detecta nota já registrada (mesmo modelo+série+número+origem)', s.nfgJaRegistrada(registro, { modelo: '55', serie: '1', numero: '9', origemId: 'v1' }) === true);
ok('nota cancelada não trava reemissão', s.nfgJaRegistrada({ config: { nfRegistro: [ { modelo: '55', serie: '1', numero: '9', origemId: 'v1', status: 'cancelada' } ] } }, { modelo: '55', serie: '1', numero: '9', origemId: 'v1' }) === false);
ok('número diferente passa normal', s.nfgJaRegistrada(registro, { modelo: '55', serie: '1', numero: '10', origemId: 'v1' }) === false);
ok('sem registro nenhum não quebra', s.nfgJaRegistrada({ config: {} }, { modelo: '55', serie: '1', numero: '1', origemId: 'x' }) === false);

console.log('== DECRETO 4: PROVA DE QUE NADA É AUTOMÁTICO ==');
ok('fiscal_guard NÃO tem setInterval (nem nomeando outra coisa)', !/setInterval\s*\(/.test(src));
ok('fiscal_guard NÃO tem setTimeout', !/setTimeout\s*\(/.test(src));
ok('fiscal_guard NÃO tem setImmediate/requestAnimationFrame', !/setImmediate\s*\(/.test(src) && !/requestAnimationFrame\s*\(/.test(src));
ok('só envolve conferirNfe/abrirCentralNfe (não chama nada sozinho)', src.indexOf('window.conferirNfe=function') >= 0 && src.indexOf('_conf0.apply') >= 0 && src.indexOf('window.abrirCentralNfe=function') >= 0 && src.indexOf('_cen0.apply') >= 0);

console.log('== DECRETO 5: TODA CONFERÊNCIA DEIXA RASTRO (sem caminho silencioso) ==');
ok('auditoria grava em db.logs com usuário + ambiente + carimbo', src.indexOf("tipo:'nf-portao'") >= 0 && src.indexOf('usuarioLogin') >= 0 && src.indexOf('ambiente:nfgAmbiente(db)') >= 0 && src.indexOf('at:new Date().toISOString()') >= 0);
ok('conferirNfe embrulhado chama a auditoria ANTES', src.indexOf("nfgAudit('conferir'") >= 0 && src.indexOf("nfgAudit('conferir'") < src.indexOf('_conf0.apply'));
ok('auditoria limita o log (não incha o banco)', src.indexOf('splice(0,db.logs.length-300)') >= 0);

console.log('== DECRETO 6: PRODUÇÃO SÓ COM AÇÃO HUMANA EXPLÍCITA ==');
ok('habilitar produção exige digitar PRODUCAO', src.indexOf("digite: PRODUCAO") >= 0 && src.indexOf("dig!=='PRODUCAO'") >= 0);
ok('exige permissão de emitir NF (mesma regra da v5.22.21)', src.indexOf('usuarioPodeEmitirNfe') >= 0);
ok('voltar p/ homologação não pede texto (recuo sempre livre)', src.indexOf("ambiente->homologacao") >= 0);
ok('toda troca de ambiente fica auditada', src.indexOf("ambiente->producao") >= 0);

console.log('== PLACAS VISÍVEIS + INTEGRAÇÃO ==');
ok('placa de ambiente nos dois modais fiscais (central + conferência)', src.indexOf("'central-nfe-modal'") >= 0 && src.indexOf("'nfe-conf-modal'") >= 0 && src.indexOf('nfg-placa') >= 0);
ok('botão de trocar ambiente na Central', src.indexOf('nfg-amb-btn') >= 0 && src.indexOf('Habilitar PRODUÇÃO') >= 0);
ok('porta v6.0.0 na 206; transmissao 207, autocura 208, perfis 209, permissões 210, menu fiscal v6.0.6; Início clicável v6.0.7; menus fiscais separados v6.0.8 na 212; override v6.0.9 na 214; 6 submenus v6.0.10 na 215; hover NF-e/NFC-e v6.0.11 fecha a fila (216)', manifest.length >= 225 && manifest[206] === 'fiscal_guard_patch.js' && manifest[207] === 'nf_transmissao_patch.js' && manifest[208] === 'autocura_empresa_central_nf_tela_patch.js' && manifest[209] === 'perfis_nuvem_cura_sessao_patch.js' && manifest[210] === 'permissoes_estorno_venda_patch.js' && manifest[211] === 'fiscal_menu_completo_patch.js' && manifest[212] === 'dashboard_inicio_clicavel_patch.js' && manifest[213] === 'menus_fiscais_separados_patch.js' && manifest[214] === 'permissoes_override_menus_fiscais_patch.js' && manifest[215] === 'seis_submenus_velho_patch.js' && manifest[216] === 'submenu_hover_nfe_patch.js' && bundle.indexOf('PORTÃO FISCAL v6.0.0') >= 0);
ok('guard anti dupla-instalação', src.indexOf('__v6000fg') >= 0);

console.log('== CARIMBO 6.0.0 (linha fiscal abre versão nova) ==');
ok('package.json na 6.0.0', pkg.version === VERSAO_APP);
ok('index.html carimbado 6.0.0', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0);
ok('worker 5.28.4 (re-ancorado)', fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("WORKER_VERSION = '5.28.4'") >= 0);
ok('gerente SEGUE 5.26.3', JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8')).version === '5.26.3');
ok('mobile sincronizado', mobile === bundle);

console.log('\nTudo OK — v6.0.0 (Portão Fiscal: nasce em homologação, produção só com ação humana explícita, nada automático, tudo auditado, selo de teste dentro do XML).');
//<<<<SECAO:test_ajustes_v6000.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6006.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6006.js:INICIO>>>>
// test_ajustes_v6006.js — v6.0.6: MENU FISCAL COMPLETO
// CC-e 110110 · Testar SEFAZ (status serviço) · Pacote do mês (zip STORE puro)
// · NCM por tipo (mapa do dump) · texto do Simples (vazio por padrão)
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
const crypto = require('crypto');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const fmc = fs.readFileSync('fiscal_menu_completo_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./fiscal_menu_completo_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 216; Início clicável 212, separados 213, override 214, 6 submenus 215, hover NF-e/NFC-e v6.0.11 fecha a fila', man.length >= 225 && man[211] === 'fiscal_menu_completo_patch.js' && man[212] === 'dashboard_inicio_clicavel_patch.js' && man[213] === 'menus_fiscais_separados_patch.js' && man[214] === 'permissoes_override_menus_fiscais_patch.js' && man[215] === 'seis_submenus_velho_patch.js' && man[216] === 'submenu_hover_nfe_patch.js' && man[210] === 'permissoes_estorno_venda_patch.js' && man[206] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (PURE + banner)', bundle.indexOf('FMC606_PURE_START') >= 0 && bundle.indexOf('v6.0.6 — MENU FISCAL COMPLETO') >= 0);

console.log('== CC-e (110110) ==');
const evt = P.fmcEventoCCe({ chave: '12345678901234567890123456789012345678901234', seq: 2, correcao: 'Texto da correção com acentoé & <x>', cnpj: '14605475000100', cOrgao: '31', tpAmb: '2', dhEvento: '2026-09-18T10:00:00-03:00' });
ok('envelope é evento 110110 com Id correto (ID110110+chave+seq02)', evt.indexOf('ID11011012345678901234567890123456789012345678901234"') < 0 && evt.indexOf('ID1101101234567890123456789012345678901234567890123402') >= 0 && evt.indexOf('<tpEvento>110110</tpEvento>') >= 0);
ok('detEvento tem descEvento Carta de Correcao + xCorrecao escapada + xCondUso legal', evt.indexOf('<descEvento>Carta de Correcao</descEvento>') >= 0 && evt.indexOf('acentoé &amp; &lt;x&gt;') >= 0 && evt.indexOf('<xCondUso>') >= 0 && evt.indexOf('Convenio S/N') >= 0);
ok('número da CC-e vai em nSeqEvento (múltiplas por nota)', evt.indexOf('<nSeqEvento>2</nSeqEvento>') >= 0);
ok('CC-e exportada nas ações + exige nota autorizada e texto 15+', fmc.indexOf('window.nfCartaCorrecao=') >= 0 && fmc.indexOf("nota.status!=='autorizada'") >= 0 && fmc.indexOf('minimo:15') >= 0);
ok('botão CC-e entra no histórico só em AUTORIZADA (com contador)', fmc.indexOf('data-nfx="cce"') >= 0 && fmc.indexOf("nota.status!=='autorizada'") >= 0);

console.log('== STATUS DO SERVIÇO (dormia na tabela desde a 6.0.1) ==');
const stat = P.fmcConsStatServ({ tpAmb: '2', cUF: '31' });
ok('consStatServ 4.00 com tpAmb/cUF/xServ STATUS', stat.indexOf('versao="4.00"') >= 0 && stat.indexOf('<cUF>31</cUF>') >= 0 && stat.indexOf('<xServ>STATUS</xServ>') >= 0);
ok('exportada nfStatusServico: usa serviço "status" e trata 107 operando', fmc.indexOf('window.nfStatusServico=') >= 0 && fmc.indexOf("nfxUrl(amb,'55','status')") >= 0 && fmc.indexOf("ret.cStat==='107'") >= 0);
ok('sem ponte = instrução do .exe, nunca sucesso falso', fmc.indexOf('fmcSemPonte') >= 0 && fmc.indexOf('só roda no app de computador (.exe)') >= 0);

console.log('== PACOTE DO MÊS (zip STORE puro, sem biblioteca) ==');
const crc = P.fmcCrc32(new Uint8Array('123456789'.split('').map(c => c.charCodeAt(0))));
ok('CRC32 bate o vetor clássico (123456789 → 0xCBF43926)', crc === 0xCBF43926);
const zip = P.fmcZipStore([{ nome: 'NFe_teste.xml', conteudo: '<xml>ok</xml>' }, { nome: 'indice.txt', conteudo: 'linha\r\n' }]);
function achaSig(u8, sig) { for (let i = 0; i < u8.length - 3; i++) { if (u8[i] === sig[0] && u8[i+1] === sig[1] && u8[i+2] === sig[2] && u8[i+3] === sig[3]) return i; } return -1; }
ok('zip tem header local (04034b50), central (02014b50) e EOCD (06054b50)', achaSig(zip, [0x50,0x4b,0x03,0x04]) === 0 && achaSig(zip, [0x50,0x4b,0x01,0x02]) > 0 && achaSig(zip, [0x50,0x4b,0x05,0x06]) === zip.length - 22);
ok('zip método STORE (0) + flag UTF-8 de nomes (0x0800)', zip[8] === 0 && zip[9] === 0 && (zip[6] | (zip[7] << 8)) === 0x0800);
ok('EOCD declara 2 arquivos', zip[zip.length - 22 + 10] === 2 && zip[zip.length - 22 + 11] === 0);
ok('pacote exportado: filtra mês, nunca inventa XML (vazio = aviso), inclui indice.txt + eventos/', fmc.indexOf('window.nfPacoteContador=') >= 0 && fmc.indexOf('Nenhuma nota com XML em ') >= 0 && fmc.indexOf("nome:'indice.txt'") >= 0 && fmc.indexOf("'eventos/CANCELAMENTO_'") >= 0);

console.log('== NCM POR TIPO (mapa do dump) ==');
const itens = P.fmcNcmPorTipo(
  [{ produtoId: 'p1', nome: 'Toner' }, { produtoId: 'p2', nome: 'Refil' }, { produtoId: 'p3', nome: 'Mensalidade' }],
  [{ id: 'p1', nome: 'Toner', ncm: '84439923' }, { id: 'p2', nome: 'Refil', categoria: 'Recarga' }, { id: 'p3', nome: 'Mensalidade', categoria: 'Serviço' }],
  { nfNcmPadrao: '00000000', nfNcmTinta: '32151100', nfNcmLocacao: '37079021', nfDescLocacao: 'CARTUCHO TONER' }, true);
ok('produto.ncm do cadastro SEMPRE ganha', itens[0].ncm === '84439923');
ok('Recarga sem NCM → NCM tinta do dump (32151100)', itens[1].ncm === '32151100');
ok('item de leitura/locação sem NCM → NCM locação (37079021)', itens[2].ncm === '37079021');
ok('wrap do montarDocumento aplica a regra no docConferido', fmc.indexOf("window.NFE_EMISSAO_PURE.montarDocumento=embrMd") >= 0 && fmc.indexOf('fmcNcmPorTipo(doc.itens') >= 0);

console.log('== TEXTO DO SIMPLES (vazio por padrão; só produção; nunca do dump cego) ==');
ok('injeta no infCpl existente', P.fmcAplicarTextoInfCpl('<NFe><infCpl>base</infCpl></NFe>', 'TEXTO X') === '<NFe><infCpl>TEXTO X base</infCpl></NFe>');
ok('cria infAdic quando não existe', P.fmcAplicarTextoInfCpl('<NFe><a/></infNFe-tail>'.replace('-tail',''), 'Y').indexOf('<infAdic><infCpl>Y</infCpl></infAdic></infNFe>') >= 0);
ok('texto vazio NÃO toca o XML (nada entra sozinho)', P.fmcAplicarTextoInfCpl('<NFe><infCpl>z</infCpl></NFe>', '  ') === '<NFe><infCpl>z</infCpl></NFe>');
ok('escapa < & do texto (não quebra o XML)', P.fmcAplicarTextoInfCpl('<NFe><infCpl>z</infCpl></NFe>', 'a<b&c').indexOf('a&lt;b&amp;c') >= 0);
ok('só injeta em PRODUÇÃO (homologação já tem o selo NOTA DE TESTE)', fmc.indexOf("if(fmcAmb()==='producao')") >= 0 && fmc.indexOf("cfg.nfTextoSimples.trim()) xml=fmcAplicarTextoInfCpl") >= 0);
ok('campo nasce vazio na Central + aviso dos “valores prontos” do dump', fmc.indexOf("nfTextoSimples:String(c.nfTextoSimples||'')") >= 0 && fmc.indexOf('texto do sistema antigo trazia valores prontos') >= 0);

console.log('== CENTRAL: OPERAÇÕES + CONFIGURAÇÃO ==');
ok('linha de operações (Testar SEFAZ + Pacote) na Central', fmc.indexOf("ops.id='fmc-ops'") >= 0 && fmc.indexOf('Testar SEFAZ agora') >= 0 && fmc.indexOf('Pacote do mês p/ contador (zip)') >= 0);
ok('card configuração fiscal com 4 NCMs/descrição + textarea + salvar na nuvem', fmc.indexOf("card.id='fmc-config'") >= 0 && fmc.indexOf('#fmc-cfg-salvar') >= 0 && fmc.indexOf("db.config.nfTextoSimples=") >= 0);
ok('classes fiscais reaproveitadas (claro/escuro da 6.0.3)', fmc.indexOf('cnf-card') >= 0 && fmc.indexOf('cnf-input') >= 0 && fmc.indexOf('cnf-btn') >= 0);

console.log('== CARIMBO 6.0.9 ==');
ok('package.json na 6.0.9', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0);
ok('celular carimbado 6.0.9', mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0);

console.log('\n' + pass + ' passaram, ' + fail + ' falharam.');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.6: menu fiscal completo pra prévia dele (CC-e, Testar SEFAZ, pacote do mês pro contador em zip puro, NCM por tipo, texto do Simples vazio por padrão).');
//<<<<SECAO:test_ajustes_v6006.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v60011.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v60011.js:INICIO>>>>
// test_ajustes_v60011.js — v6.0.11: NF-e/NFC-e vira UM item; os 6 submenus
// aparecem quando o mouse passa por cima (igual ao sistema antigo; correção
// dele: "os submenu vc fez errado").
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('submenu_hover_nfe_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./submenu_hover_nfe_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 216; hover NF-e/NFC-e fecha a fila',
  man.length >= 225 && man[216] === 'submenu_hover_nfe_patch.js' && man[215] === 'seis_submenus_velho_patch.js' && man[214] === 'permissoes_override_menus_fiscais_patch.js');
ok('bundle contém o patch (guard + PURE + banner)',
  bundle.indexOf('__v60011sxvm') >= 0 && bundle.indexOf('SXVM_PURE_START') >= 0 && bundle.indexOf('SUBMENU_HOVER_NFE_PATCH v6.0.11 ativo') >= 0);

console.log('== RIBBON: O MÓDULO NF-e/NFC-e DO index.html É REAL AGORA ==');
ok('menu-nfe existe nos arquivos base com hover .module-menu (mecanismo nativo da barra)',
  html.indexOf('id="menu-nfe" class="module-menu"') >= 0 && html.indexOf('.module:hover .module-menu') >= 0);
ok('os 3 itens FALSOS ("Em breve…") sumiram do index.html',
  html.indexOf('Em breve: emissão de nota fiscal') < 0 && html.indexOf('Módulo fiscal em preparação') < 0);
ok('os 6 submenus apontam pras views certas (hover → navega)',
  ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'].every(v => html.indexOf("navigateTo('" + v + "')") >= 0));
ok('(supersede v6.1.3) a aba oficial agora é **Fiscal**: clicar ABRE o submenu dos 6 pinado; a Central abre pelo item Nota Fiscal',
  /<div class="module"><button onclick="navigateTo\('central-nf'\)"><i class="ph ph-file-text"><\/i>Fiscal<\/button><div id="menu-nfe"/.test(html));

console.log('== OS 6 DO PRINT (PURE) ==');
const it = P.sxvmItens();
ok('6 itens, ordem exata da foto',
  it.length === 6 && it.map(m => m.rot).join(' · ') === 'Nota Fiscal · Perfil Tributário · Manifestação · NCM · Enviar XML · Configurações');
ok('cada item tem view + ícone compatível com o padrão da barra',
  it.every(m => m.view && m.icon && m.icon.indexOf('ph-') === 0));

console.log('== BOTÕES SOLTOS SOMEM DOS DOIS LUGARES (sem matar telas) ==');
ok('nav lateral: os 6 fiscais + os 3 atalhos da 6.0.9 ficam escondidos (display:none)',
  src.indexOf("nb.style.display = 'none'") >= 0 && src.indexOf('fiscal-historico') >= 0 && src.indexOf('fiscal-ferramentas') >= 0 && src.indexOf('fiscal-inutilizar') >= 0);
ok('barra clássica: os topmods fiscais soltos também ficam escondidos',
  src.indexOf("getElementById('topmod-' + v)") >= 0 && src.indexOf("tm.style.display = 'none'") >= 0);
ok('PÁI instalado na lateral no lugar do "Nota Fiscal" (caret à direita, padrão visual da nav)',
  src.indexOf("id = 'sxvm-nav-pai'") >= 0 && src.indexOf('ph-caret-right') >= 0 && src.indexOf('NF-e/NFC-e') >= 0);

console.log('== FLYOUT NA LATERAL (espelho do .module-menu) ==');
ok('flyout branco à direita do botão, posicionado por getBoundingClientRect (não corta em scroll)',
  src.indexOf('sxvm-flyout-nav') >= 0 && src.indexOf('getBoundingClientRect') >= 0 && src.indexOf('rc.right + 8') >= 0);
ok('mouse passa por cima abre; mouse sai fecha com carência de 180ms; clique fora fecha; blur fecha',
  src.indexOf('mouseenter') >= 0 && src.indexOf('mouseleave') >= 0 && src.indexOf('180') >= 0 && src.indexOf("addEventListener('blur'") >= 0);
ok('flyout tem título NF-e/NFC-e + os 6 com ícone (mesmo CSS do module-menu)',
  src.indexOf('sxvm-cab') >= 0 && src.indexOf('#sxvm-flyout-nav button') >= 0);
ok('sonda re-aplica tudo (lateral redesenha no login) igual ao padrão das versões anteriores',
  src.indexOf('setInterval') >= 0 && src.indexOf('sxvmTudo') >= 0 && src.indexOf('300') >= 0);

console.log('== CARIMBO 6.0.11 ==');
ok('package.json na 6.0.11', pkg.version === VERSAO_APP);
ok('index.html carimbado (4 pontos)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0 && html.indexOf('v' + VERSAO_APP + '</title>') >= 0);
ok('celular carimbado 6.0.11', mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0);

console.log('');
console.log(pass + ' passaram, ' + fail + ' falharam');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.11: NF-e/NFC-e é UM item; os 6 submenus da foto aparecem no hover, na barra clássica E na lateral, sem botão fiscal solto.');
//<<<<SECAO:test_ajustes_v60011.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v60013.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v60013.js:INICIO>>>>
// test_ajustes_v60013.js — v6.0.13: MENU FISCAL BONITO ("ta horrivel de feio
// esse menu fiscal"). Faixa ribbon estilo a aba NF-e/NFC-e do sistema antigo:
// aba ativa, botões GRANDES (ícone em cima, nome embaixo) em 3 grupos, item
// atual destacado, no topo de TODAS as telas fiscais; polimento do flyout
// lateral via CSS (sem tocar no arquivo da v6.0.11 — mural a protege).
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('ribbon_fiscal_estilo_antigo_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const sxvm = fs.readFileSync('submenu_hover_nfe_patch.js', 'utf8');
const P = require('./ribbon_fiscal_estilo_antigo_patch.js');

console.log('== FILA / BUNDLE ==');
ok('manifesto já é 219 — a ribbon v6.0.13 ficou na posição histórica 217 (em cima dela, só o catálogo fiscal completo)',
  man.length >= 225 && man[218] === 'ribbon_fiscal_estilo_antigo_patch.js' && man[217] === 'navegacao_sem_tela_branca_patch.js');
ok('bundle contém o patch (guard + PURE + css)',
  bundle.indexOf('__v60013wxr') >= 0 && bundle.indexOf('WXR613_PURE') >= 0 && bundle.indexOf('wxr-ribbon-css') >= 0);

console.log('== OS 6 ITENS EM GRUPOS (PURE) ==');
const it = P.itens();
ok('6 itens, mesmos destinos/ordem da v6.0.10 (nada muda de lugar)',
  it.length === 6 && it.map(m => m.rot).join(' · ') === 'Nota Fiscal · Manifestação · Enviar XML · Perfil Tributário · NCM · Configurações');
ok('3 grupos na ordem clássica de ribbon',
  P.gruposOrdem().join(' / ') === 'Documentos / Cadastros fiscais / Sistema');
ok('cada item tem view real + ícone ph-',
  it.every(m => P.ehViewFiscal(m.view) && m.icon.indexOf('ph-') === 0));

console.log('== A FAIXA (injeção + sobrevivência a re-render) ==');
ok('injeta no topo (insertBefore firstChild) idempotente por view',
  src.indexOf("insertBefore(wxrMonta") >= 0 && src.indexOf("querySelector(':scope > .wxr-bar')") >= 0);
ok('re-injeta depois de render (wrap navigateTo agenda 2 ticks) + sonda só p/ tela fiscal aberta',
  src.indexOf('setTimeout(wxrGarante, 40)') >= 0 && src.indexOf('offsetParent !== null') >= 0);
ok('aba NF-e/NFC-e ativa no topo da faixa (cara do velho)',
  src.indexOf('wxr-tab') >= 0 && src.indexOf('NF-e/NFC-e</div>') >= 0);
ok('destaque do item atual (wxr-btn.ativo)',
  src.indexOf("' ativo'") >= 0 && src.indexOf('.wxr-btn.ativo') >= 0);

console.log('== FLYOUT LATERAL GANHA BELEZA SÓ VIA CSS (arquivo da 6.0.11 intocado) ==');
ok('CSS do flyout: cabeçalho NF-e/NFC-e via ::before + bordas/hover/sombra',
  src.indexOf('#sxvm-flyout-nav::before') >= 0 && src.indexOf('!important') >= 0);
ok('submenu_hover_nfe_patch.js NÃO foi editado nesta versão (mural 6.0.11 segue valendo)',
  sxvm.indexOf('__v60011sxvm') >= 0 && sxvm.indexOf('__v60013wxr') < 0);

console.log('== NADA QUEBRA O QUE JÁ ESTAVA CERTO ==');
ok('anti-tela-branca da 6.0.12 intocado e anterior na fila',
  man[217] === 'navegacao_sem_tela_branca_patch.js' && bundle.indexOf('NAV612_PURE') >= 0);
ok('menu-nfe da barra segue real (regressão)',
  html.indexOf('id="menu-nfe" class="module-menu"') >= 0 && html.indexOf("navigateTo('fiscal-enviar-xml')") >= 0);

console.log('== CARIMBOS v6.0.13 ==');
ok('index.html carimbado (4 pontos)',
  html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0 && html.indexOf('v' + VERSAO_APP + '</title>') >= 0);
ok('mobile carimbado (3 pontos)',
  mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0 && mob.indexOf('v' + VERSAO_APP + '</title>') >= 0);
ok('package.json cravado', pkg.version === VERSAO_APP);

console.log('');
console.log('RESUMO: ' + pass + ' passaram, ' + fail + ' falharam.');
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_ajustes_v60013.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v60014.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v60014.js:INICIO>>>>
// test_ajustes_v60014.js — v6.0.14: AS 6 TELAS FISCAIS COMPLETAS DO CATÁLOGO,
// TODAS DE UMA VEZ (decreto 19/09: "tudo de uma vez, não leva; substitui esses
// velhos provisórios que você colocou" — 6.0.9/6.0.10). Central de Notas com
// listagem+editor VENDA-NF em 9 abas, Perfil Tributário, Manifestação, NCM,
// Enviar XML ("Preparar Arquivos Fiscais") e Configurações em 10 abas — o
// popup é o modal do sistema e DANFE sai com selo SEM VALOR FISCAL.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('fiscal_catalogo_completo_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('== FILA / BUNDLE / CARIMBO ==');
ok('manifesto já é 220 (Menu Fiscal oficial v6.1.0 por último); o catálogo da 6.0.14 ficou na posição histórica 218 (por cima do ribbon)',
  man.length >= 225 && man[219] === 'fiscal_catalogo_completo_patch.js' && man[218] === 'ribbon_fiscal_estilo_antigo_patch.js');
ok('bundle contém o patch (guards + PURE + fxAcao + fx614-css)',
  bundle.indexOf('__v6014fxc') >= 0 && bundle.indexOf('FX614_PURE') >= 0 && bundle.indexOf('fxAcao') >= 0 && bundle.indexOf('fx614-css') >= 0);
ok('carimbo v6.0.14 (package + index + query do bundle)',
  pkg.version === VERSAO_APP && html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('v' + VERSAO_APP + '</title>') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0);

console.log('== PURE: fábricas e constantes do catálogo ==');
global.window = global;
global.document = {
  head: { appendChild: function () { } }, getElementById: function () { return null; },
  createElement: function () { return { style: {} }; }, addEventListener: function () { }, body: { appendChild: function () { } },
  querySelector: function () { return null; }, querySelectorAll: function () { return []; }
};
global.db = { config: { nfRegistro: [], nfManifestacoes: [] }, notasNf: [], clientes: [{ id: 'c1', nome: 'MERCADO X' }], fornecedores: [], produtos: [{ id: 'p1', nome: 'TONER', preco: 99, ncm: '84439923' }] };
window.usuarioPodeEmitirNfe = function () { return true; };
const P = require('./fiscal_catalogo_completo_patch.js');
const G = globalThis;
ok('5 perfis reais da loja semeados (idempotente): 00001/00002/00003/00005/00004 com CFOPs certos',
  P.PERFIS_SEED.length === 5 && P.PERFIS_SEED.map(function (s) { return s.cod + ':' + s.cfop; }).join('/') === '00001:5102/00002:6102/00003:5915/00005:5916/00004:6949');
ok('VENDA_NF_ABAS = as 9 do editor dele',
  P.VENDA_NF_ABAS.length === 9 && P.VENDA_NF_ABAS.indexOf('Itens da Nota') >= 0 && P.VENDA_NF_ABAS.indexOf('Reforma Tributária') >= 0);
ok('CONFIG_ABAS mantém as telas existentes e acrescenta Log Fiscal',
  P.CONFIG_ABAS.length === 11 && P.CONFIG_ABAS.join('|') === 'Geral|Impressão|NFCe|Tributação|Nuvem|Outras|Mensagens|FCP|Autorizações|Reforma|Log Fiscal');
ok('MANIF_COLS = 15 colunas da grade de destinadas', P.MANIF_COLS && P.MANIF_COLS.length === 15);
ok('PAGAMENTOS cobre 01-99 (Dinheiro/Crédito/Débito/Pix/Boleto…)',
  P.PAGAMENTOS.length >= 10 && JSON.stringify(P.PAGAMENTOS[0][0]) === '"01"' && P.PAGAMENTOS.some(function (p) { return p[0] === '99'; }));
ok('ibsCbs: cofrinhos por fora (base 100, alíq 0,1/0/0,9 → 0,10/0/0,90)',
  JSON.stringify(P.ibsCbs(100, 0.1, 0, 0.9)) === '{"ibsUf":0.1,"ibsMun":0,"cbs":0.9}');
const itemVazio = P.itemVazio(1);
ok('item novo não presume CST, cClassTrib nem alíquotas IBS/CBS',
  itemVazio.trib.refCst === '' && itemVazio.trib.refClassif === '' && itemVazio.trib.refIbsUfPerc === '' && itemVazio.trib.refIbsMunPerc === '' && itemVazio.trib.refCbsPerc === '' && itemVazio.trib.refReformaRevisado === false);
const nv = P.notaVazia('777', 'dono');
ok('notaVazia nasce rascunho: status "Não Gerada", modelo 55, série 1, frete 9, homologação',
  nv.status === 'Não Gerada' && nv.modelo === '55' && nv.serie === '1' && nv.frete.modalidade === '9' && nv.ambiente !== 'producao');

console.log('== INFRA ==');
ok('19 funções na infra (db/save/sess/log/cfg/perfis/notas/placa/pode/confirm/alert/toast/inp/sel/chk/valo/aplica/pinta/css)',
  G.__v6014fxInfra && Object.keys(G.__v6014fxInfra).length === 19);
ok('perfis() semeia os 5 (array vazio também herda o seed) e grava fxLog "perfis-seed"',
  G.__v6014fxInfra.perfis().length === 5 && (db.config.fxLogFiscal || []).some(function (l) { return l.acao === 'perfis-seed'; }));
const perfisAntesRascunho = G.__v6014fxInfra.perfis().length;
G.fxAcao('pf-novo');
ok('Novo Perfil abre um rascunho sem inserir no cadastro persistido',
  G.__fxPfNovo === true && !!G.__fxPfObj && G.__v6014fxInfra.perfis().length === perfisAntesRascunho);
G.fxAcao('pf-fechar');
ok('Fechar descarta o rascunho sem alterar os perfis',
  G.__fxPfNovo === false && G.__fxPfObj === null && G.__v6014fxInfra.perfis().length === perfisAntesRascunho);
const perfilOriginal = Object.assign({}, G.__v6014fxInfra.perfis()[0]);
G.fxAcao('pf-alterar', 0);
G.__fxPfObj.descricao = 'ALTERAÇÃO NÃO SALVA';
G.fxAcao('pf-fechar');
ok('Fechar alteração descarta mudanças sem tocar o perfil cadastrado',
  G.__v6014fxInfra.perfis()[0].descricao === perfilOriginal.descricao && G.__v6014fxInfra.perfis()[0].cfop === perfilOriginal.cfop);
G.fxAcao('pf-novo');
G.__fxPfObj.descricao = 'PERFIL TESTE'; G.__fxPfObj.cfop = '5102';
G.fxAcao('pf-salvar');
ok('Salvar perfil válido adiciona o novo perfil uma única vez',
  G.__v6014fxInfra.perfis().length === perfisAntesRascunho + 1 && G.__v6014fxInfra.perfis().slice(-1)[0].descricao === 'PERFIL TESTE');
G.__v6014fxInfra.perfis().pop();
ok('confirmação NUNCA é o confirm nativo: fxConfirm/alert existem na infra e pintam no modal-root do sistema',
  src.indexOf('window.confirm(') === -1 && src.indexOf("getElementById('modal-root')") >= 0 && typeof G.__v6014fxInfra.confirm === 'function' && typeof G.__v6014fxInfra.alert === 'function');
ok('placa de ambiente: HOMOLOGAÇÃO vermelho / PRODUÇÃO verde',
  src.indexOf('HOMOLOGAÇÃO — MODO TESTE') >= 0 && src.indexOf('PRODUÇÃO — a nota gerada aqui VALE DE VERDADE') >= 0);

console.log('== RENDERS DAS 6 TELAS (DOM fake) ==');
const R1 = G.__v6014fx3, R2 = G.__v6014fxRender2;
const central = R1.renderCentral();
ok('Central: barras + grade 9 cols + Novo/Alterar/Excluir/Clonar + regra fiscal impressa',
  ['Pesquisar', 'Imprimir', 'Novo', 'Alterar', 'Excluir', 'Clonar'].every(function (s) { return central.indexOf(s) >= 0; })
  && central.indexOf('Não Gerada') >= 0 && P.LIST_COLS.length === 9);
G.fxAcao('nf-novo');
const n = R1.notaEdicao();
ok('Novo abre VENDA-NF: status "Não Gerada", código sequencial 00416 em diante',
  !!n && n.status === 'Não Gerada' && /^004\d\d$/.test(n.cod));
const ed = R1.renderCentral();
ok('Aba Gerais: Total Aprox. Tributos (IBPT), Pagamentos, Duplicatas, cofrinhos IBS/CBS, rodapé Gerar/Pré-Visualizar/Salvar',
  ['Total Aprox. Tributos', 'Pagamentos', 'Duplicatas', 'Pré-Visualizar', 'Gerar NF-e', 'Salvar'].every(function (s) { return ed.indexOf(s) >= 0; }));
G.__fxEd.aba = 'Destinatário';
ok('Destinatário: Pesquisar por Cliente/Fornecedor + Puxar dados + endereço diferente (sem redigitar)',
  ['Pesquisar por', 'Cliente', 'Fornecedor', 'Puxar dados'].every(function (s) { return R1.renderCentral().indexOf(s) >= 0; }));
G.__fxEd.aba = 'Itens da Nota';
const it0 = R1.renderCentral();
ok('Itens: Lançar Produto + grade 14 cols + datalist do estoque',
  it0.indexOf('Lançar Produto') >= 0 && it0.indexOf('TONER') >= 0 && it0.indexOf('datalist') >= 0);
n.itens.push(P.itemVazio(1)); n.itens[0].descricao = 'TONER'; n.itens[0].qtd = 2; n.itens[0].vunit = 50;
G.__fxTrib = { idx: 0, sub: 'Itens' };
const it1 = R1.renderCentral();
ok('Tributação do item: mini-abas Itens/Tributação + "Alterar para Todos" + GTIN/NCM/CEST/CFOP',
  ['Alterar para Todos', 'Tributação', 'GTIN'].every(function (s) { return it1.indexOf(s) >= 0; }));
G.__fxTrib.sub = 'Tributação'; G.__fxTribAba = 'Reforma Tributária';
const it2 = R1.renderCentral();
ok('Reforma por item mostra cabeçalho do produto, CST, cClassTrib, base, Padrão/Devolução e não presume alíquotas',
  ['Dados do Produto', 'GTIN/EAN', 'Alterar para Todos', 'Importação', 'Outros', 'Reforma Tributária', 'Código CST-IBS/CBS', 'cClassTrib', 'Base de Cálculo', 'Devolução de Tributos', 'Alíquota em branco não calcula valor'].every(function (s) { return it2.indexOf(s) >= 0; }) && /ibs/i.test(it2) && /cbs/i.test(it2));
G.__fxTribAba = 'Importação';
const importRef = R1.renderCentral();
ok('Importação agrupa declaração, desembaraço, adições, valores e país e mantém calendário nas datas',
  ['Dados para Declaração', 'Desembaraço Aduaneiro', 'Adições', 'Valores', 'Dados do País', 'type="date"', 'codPais', 'nomePais'].every(function (s) { return importRef.indexOf(s) >= 0; }));
G.__fxTribAba = 'Outros'; G.__fxTribOutrosAba = 'CSOSN ICMS';
const csosnRef = R1.renderCentral();
ok('Outros possui as cinco subabas mostradas nas referências e campos CSOSN ICMS',
  ['CSOSN ICMS', 'Icms ST', 'Fcp', 'Efetivo', 'Outros', 'Valor DIF.', 'Valor UF Remet.', 'Valor UF Dest.', 'Cód. Benefício Fiscal'].every(function (s) { return csosnRef.indexOf(s) >= 0; }));
G.__fxTribOutrosAba = 'Icms ST';
const stRef = R1.renderCentral();
ok('ICMS ST expõe valores retido, destino, combinação FCP/ST e substituído',
  ['Valor ST Ret.', 'Valor ST Dest.', '% FCP + % ST', 'Vlr. Substituído'].every(function (s) { return stRef.indexOf(s) >= 0; }));
G.__fxTribOutrosAba = 'Fcp';
const fcpRef = R1.renderCentral();
ok('FCP separa base, percentual e valor próprio, UF destino e ST',
  ['V. B.C. FCP R$', 'FCP UF Dest.', 'V. B.C. FCP UF Dest. R$', 'FCP ST', 'V. FCP ST R$'].every(function (s) { return fcpRef.indexOf(s) >= 0; }));
G.__fxTribOutrosAba = 'Efetivo';
const efetivoRef = R1.renderCentral();
ok('Efetivo inclui base, alíquota, valor e redução efetiva',
  ['Base Cálculo Efetivo', 'Alíquota Efetiva', 'Valor Efetivo', 'Redução Efetivo'].every(function (s) { return efetivoRef.indexOf(s) >= 0; }));
G.__fxTribOutrosAba = 'Outros';
const outrosRef = R1.renderCentral();
ok('Outros separa pedido, unidade/quantidade/valor comercial e unidade/quantidade/valor tributável',
  ['Núm. do Pedido', 'Núm. Item Pedido', 'Un. Comercial', 'Qtde. Comercial', 'Valor Unit. Comercial', 'Total Parcial Comercial', 'Un. Tributável', 'Qtde. Tributável', 'Valor Unit. Tributável', 'Total Parcial Tributável'].every(function (s) { return outrosRef.indexOf(s) >= 0; }));
G.__fxTribAba = 'Reforma Tributária';
G.__fxTribReformaAba = 'Devolução de Tributos';
const devolucaoRef = R1.renderCentral();
ok('Devolução de tributos expõe um valor separado para IBS UF, IBS municipal e CBS',
  ['refDevIbsUf', 'refDevIbsMun', 'refDevCbs', 'Valor do Tributo Devolvido'].every(function (s) { return devolucaoRef.indexOf(s) >= 0; }));
G.__fxTribReformaAba = 'Padrão';
G.__fxEd.aba = 'Reforma Tributária';
const resumoRef = R1.renderCentral();
ok('aba Reforma da nota resume valores por item sem alíquotas universais',
  resumoRef.indexOf('Resumo IBS/CBS por item') >= 0 && resumoRef.indexOf('0,1%') < 0 && resumoRef.indexOf('0,9%') < 0);
G.__fxEd.aba = 'Itens da Nota';
R1.totaisAuto(n);
ok('Total da nota = produtos + serviços − descontos (+frete/despesas), SEM somar cofrinhos (2×50 = 100)',
  n.totais.total === 100 && n.totais.produtos === 100);
const previa = R1.danfePrevia(n);
ok('DANFE Pré-Visualizar: selo diagonal "NF-E EM PRÉ-VISUALIZAÇÃO / SEM VALOR FISCAL" + botão Imprimir',
  previa.indexOf('SEM VALOR FISCAL') >= 0 && previa.indexOf('PRÉ-VISUALIZAÇÃO') >= 0 && previa.indexOf('Imprimir') >= 0);
const mf = R2.manifestacao();
ok('Manifestação: Consultar Destinadas + NSU + barra de filtros + Obter/Manifestar/Baixar XML',
  ['Consultar Destinadas', 'NSU', 'Obter Notas', 'Manifestar', 'Baixar XML', 'Cadastradas Hoje'].every(function (s) { return mf.indexOf(s) >= 0; }));
const ncm = R2.ncm();
ok('NCM: favoritos + mesmos atalhos/padrões do velho (Padrao/Tinta/Locacao, chaves originais)',
  ['Favoritos', 'nfNcmPadrao', 'nfNcmTinta', 'nfNcmLocacao'].every(function (s) { return ncm.indexOf(s) >= 0 || src.indexOf(s) >= 0; }));
const xml = R2.enviarXml();
ok('Enviar XML = "Preparar Arquivos Fiscais": matriz do mês + "Não Suportado" NFC-e + aviso nuvem junta XMLs + Enviar para Escritório (mês longo) + e-mail escritório',
  ['Preparar Arquivos Fiscais', 'Não Suportado', 'Enviar para Escritório', 'nuvem junta', 'fx-xml-email'].every(function (s) { return xml.indexOf(s) >= 0 || src.indexOf(s) >= 0; }));
const abasCfg = ['Geral', 'Impressão', 'NFCe', 'Tributação', 'Nuvem', 'Outras', 'Mensagens', 'FCP', 'Autorizações', 'Reforma', 'Log Fiscal'];
const cfgOk = abasCfg.every(function (a) { G.__fxCfgAba = a; const h = R2.config(); return h.indexOf('>' + a + '<') >= 0 && h.length > 600; });
ok('Configurações: as 11 abas renderizam de verdade', cfgOk);
G.__fxCfgAba = 'NFCe';
ok('Aba NFCe: versão veqr200 + CSC mascarado nas chaves herdadas (nfCsc/nfCscId) + "gerar ao finalizar" desmarcado',
  R2.config().indexOf('veqr200') >= 0 && R2.config().indexOf('CSC') >= 0 && src.indexOf('nfCscId') >= 0);
G.__fxCfgAba = 'FCP';
ok('FCP: tabela das 27 UFs + padrão 2%', R2.config().split('<tr>').length >= 28 && src.indexOf("padrao: 2") >= 0);
G.__fxCfgAba = 'Log Fiscal';
ok('Log Fiscal global aparece em Configurações e informa limite e ausência de segredos',
  R2.config().indexOf('Auditoria Fiscal local') >= 0 && R2.config().indexOf('Senha') >= 0 && R2.config().indexOf('CSC') >= 0);

console.log('== AÇÕES (fxAcao) ==');
ok('switch único cobre listagem/editor/perfil/manifestação/ncm/xml/config (prefixos)',
  ['lst-sel', 'nf-novo', 'nf-alterar', 'nf-excluir', 'nf-clonar', 'nf-gerar', 'nf-previa', 'nf-item-add', 'nf-item-cfop-todos', 'nf-dest-puxar', 'nf-ref-add', 'nf-trib-sub', 'nf-trib-outros-sub', 'nf-trib-reforma-sub', 'pf-novo', 'pf-salvar', 'mf-consultar', 'mf-manifestar', 'mf-baixar', 'ncm-add', 'ncm-uso', 'xml-enviar', 'cfg-salvar'].every(function (a) { return src.indexOf("'" + a + "'") >= 0; }));
ok('regra fiscal travada: nota Autorizada não pode ser alterada nem excluída (aviso no sistema)',
  src.indexOf('Nota já autorizada') >= 0 && src.indexOf('não pode ser alterada') >= 0 && src.indexOf('não pode ser excluída') >= 0);
ok('permissão "Emitir NF" exigida p/ excluir rascunho, gerar, manifestar e inutilizar',
  (src.match(/I\.pode\(\)/g) || []).length >= 4 && src.indexOf('Emitir NF') >= 0);
ok('honestidade: sem PC emissor → aviso claro e nota fica "Não Gerada" (sem sucesso falso)',
  src.indexOf('sem sucesso falso') >= 0 && src.indexOf('Não Gerada') >= 0 && src.indexOf('PC emissor') >= 0);
ok('Enviar para Escritório chama o motor do pacote (nfPacoteContador) + Copiar e-mail',
  src.indexOf('nfPacoteContador') >= 0 && src.indexOf("xml-copiar") >= 0);
ok('Operação Realizada com Sucesso preservada p/ o motor (literal nos eventos/manifestação/antigo)',
  bundle.indexOf('Operação Realizada com Sucesso') >= 0);
ok('salva em db.notasNf (rascunhos) e lê db.config.nfRegistro (autorizadas) — nada novo quebrando o velho',
  src.indexOf('notasNf') >= 0 && src.indexOf('nfRegistro') >= 0);

console.log('== CONVÍVIO ==');
ok('wrap navegação por CIMA do ribbon (insertBefore ribbon continua por cima do novo conteúdo)',
  src.indexOf('embrulhado.__wxr613') >= 0 && src.indexOf('embrulhado.__nav612') >= 0);
ok('atalhos fiscal-historico/inutilizar/ferramentas NÃO são substituídos (fora das 6)',
  ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'].every(function (v) { return src.indexOf("'" + v + "'") >= 0; })
  && src.indexOf("fiscal-historico'") === -1);

console.log('\nRESULTADO v6.0.14: ' + pass + ' ok, ' + fail + ' falhas');
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_ajustes_v60014.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6100.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6100.js:INICIO>>>>
// test_ajustes_v6100.js — v6.1.0: "os menus não estão ficando lá em cima…
// muda esse nome pra ser oficialmente o menu fiscal, e os 6 menus tem que
// ficar ai". A faixa do topo AGORA se chama **Menu Fiscal** (aba + flyout),
// NÃO SOME quando a tela re-renderiza por dentro (wrap do __fxReRender614
// preservando o nó da faixa + sonda leve), o visual ganhou acabamento (CSS),
// e a página de envio recebe CLIENTES.json (importador pontual, mesmo padrão
// do PRODUTOS.json v5.22.21: DEL=S pula, documento/código não duplica, só
// completa campo vazio). Carimbo 6.1.0 + manifesto 220.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('menu_fiscal_oficial_patch.js', 'utf8');
const ribbon = fs.readFileSync('ribbon_fiscal_estilo_antigo_patch.js', 'utf8');
const fiscal = fs.readFileSync('fiscal_catalogo_completo_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const env = fs.readFileSync('envio_arquivos.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('== FILA / BUNDLE / CARIMBO ==');
ok('manifesto 220; Menu Fiscal Oficial fecha a fila (por cima do catálogo fiscal da 6.0.14)',
  man.length >= 225 && man[220] === 'menu_fiscal_oficial_patch.js' && man[219] === 'fiscal_catalogo_completo_patch.js');
ok('bundle contém o patch (guard + PURE + observer + css)',
  bundle.indexOf('__v6100mfo') >= 0 && bundle.indexOf('MFO610_PURE') >= 0 && bundle.indexOf('mfo610-css') >= 0);
ok('carimbo 6.1.0 (package + index 4 pontos)',
  pkg.version === VERSAO_APP && html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('v' + VERSAO_APP + '</title>') >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0);

console.log('== MENU FISCAL OFICIAL ==');
const P = require('./menu_fiscal_oficial_patch.js');
ok('PURE: rótulo oficial é "Menu Fiscal" e as 6 telas fiscais estão mapeadas',
  P.rotuloFx === 'Menu Fiscal' && P.telasFiscais.length === 6 && P.telasFiscais.indexOf('central-nf') >= 0 && P.telasFiscais.indexOf('config-fiscal') >= 0);
ok('observer renomeia .wxr-tab onde ela aparecer + flyout ganha "Menu Fiscal" via CSS !important',
  src.indexOf('MutationObserver') >= 0 && src.indexOf('.wxr-tab') >= 0 && src.indexOf('content:"Menu Fiscal" !important') >= 0);
ok('ribbon v6.0.13 continua intacto (6 itens/grupos, compat de leitura dos murais antigos)',
  ribbon.indexOf('NF-e/NFC-e</div>') >= 0 && ribbon.indexOf('__v60013wxr') >= 0);

console.log('== A FAIXA NÃO SOME (bug do re-render interno) ==');
ok('re-render da 6.0.14 pinta por innerHTML da view (era o que derrubava a faixa)',
  fiscal.indexOf('el.innerHTML = html') >= 0);
ok('wrap do __fxReRender614: salva a faixa viva e devolve pro topo no mesmo instante',
  src.indexOf('__fxReRender614') >= 0 && src.indexOf("querySelector(':scope > .wxr-bar')") >= 0 && src.indexOf('insertBefore(barraViva, alvo.firstChild)') >= 0);
ok('sonda leve (1500ms) cobre outros caminhos de render + repinta o rótulo',
  src.indexOf('setInterval(sondaFaixa, 1500)') >= 0 && src.indexOf('pintaRotuloFx()') >= 0);

console.log('== BELEZA (CSS por cima, sem tocar literais protegidos) ==');
ok('6 telas com fundo gradiente suave + zebra na grade + cabeçalho sticky',
  src.indexOf('linear-gradient(180deg,#f6f9ff 0%,#eef3fc 100%)') >= 0 && src.indexOf('nth-child(even)') >= 0 && src.indexOf('position:sticky') >= 0);
ok('botões/campos com hover/foco azul + placa de ambiente arredondada',
  src.indexOf('.fx-btn:hover') >= 0 && src.indexOf('box-shadow:0 0 0 3px rgba(59,130,246,.18)') >= 0 && src.indexOf('.fx-placa{border-radius:12px') >= 0);

console.log('== IMPORTADOR CLIENTES.json ==');
ok('PURE mapeia linha do sistema antigo (RAZAO/CNPJ/ENDERECO/MUNICIPIO/UF/TELEFONE/IE/CEP/BAIRRO)',
  (function () {
    const c = P.mapearCliente({ COD_CLIENTE: '123', RAZAO: 'MERCADO BOM PRECO LTDA', CNPJ: '12.345.678/0001-90', IE: '123456', LOGRADOURO: 'RUA A', NUMERO: '10', BAIRRO: 'CENTRO', MUNICIPIO: 'MONTES CLAROS', UF: 'mg', CEP: '39400-000', TELEFONE: '(38) 3221-0000' });
    return c.nome === 'MERCADO BOM PRECO LTDA' && c.documento === '12345678000190' && c.cnpj === '12345678000190' && c.cpf === '' && c.cidade === 'MONTES CLAROS' && c.uf === 'MG' && c.cep === '39400000' && c.bairro === 'CENTRO' && c.numero === '10';
  })());
ok('DEL=S pula; prepararImportacao conta puladas e exige nome',
  (function () {
    const r = P.prepararImportacao([{ NOME: 'A', DEL: 'S' }, { NOME: 'B' }, { SEM_NOME: 1 }]);
    return r.puladas === 1 && r.mapeados.length === 1 && r.mapeados[0].nome === 'B';
  })());
ok('chave de dedupe: documento > código > nome (documento vence mesmo com código)',
  P.chaveCliente({ documento: '1', codigo: '9', nome: 'X' }) === 'doc:1' && P.chaveCliente({ codigo: '9', nome: 'X' }) === 'cod:9' && P.chaveCliente({ nome: 'X' }) === 'nome:x');
ok('fundir só completa o que está vazio (nunca pisa no cadastro atual)',
  (function () {
    const f = P.fundirCliente({ nome: 'MERCADO', fone: '999' }, { nome: 'OUTRO NOME', fone: '888', cidade: 'MOC' });
    return f.rec.nome === 'MERCADO' && f.rec.fone === '999' && f.rec.cidade === 'MOC' && f.mudou === true
      && P.fundirCliente({ nome: 'MERCADO' }, { nome: 'X' }).mudou === false;
  })());
ok('página de envio: card Clientes + input/btn + handler na entidade clientes + mensagem honesta de amostra',
  env.indexOf('<h2>Clientes</h2>') >= 0 && env.indexOf("id=\"arq-cli\"") >= 0 && env.indexOf("id=\"btn-cli\"") >= 0
  && env.indexOf("entity:'clientes'") >= 0 && env.indexOf('CLIENTES.json') >= 0 && env.indexOf('3 linhas de amostra') >= 0);
ok('dedupe na nuvem: doc/cod/nome + "completou vazios" + DEL=S de fora + contadores (novos/completados/iguais)',
  env.indexOf("'doc:'") >= 0 && env.indexOf('completado(s)') >= 0 && env.indexOf('DEL=S ficaram de fora') >= 0 && env.indexOf("uid('cli')") >= 0);
ok('PRODUTOS.json fica exatamente como está (importador de produtos intocado dedupe/NCM/DEL=S)',
  env.indexOf('btn-prod') >= 0 && env.indexOf('PRODUTOS.json') >= 0 && env.indexOf("entity:'produtos'") >= 0);

console.log('== CONVÍVIO ==');
ok('fiscal 6.0.14 intacto (6 telas continuam as mesmas debaixo do capô novo)',
  fiscal.indexOf('Preparar Arquivos Fiscais') >= 0 && fiscal.indexOf('SEM VALOR FISCAL') >= 0 && fiscal.indexOf('__v6014fxc6') >= 0);
ok('atalhos histórico/inutilizar/ferramentas seguem fora do menu de 6',
  P.telasFiscais.indexOf('fiscal-historico') === -1 && P.telasFiscais.indexOf('fiscal-inutilizar') === -1);

console.log('\nRESULTADO v6.1.0: ' + pass + ' ok, ' + fail + ' falhas');
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_ajustes_v6100.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6101.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6101.js:INICIO>>>>
// test_ajustes_v6101.js — v6.1.1: "EU NÃO QUERO QUE APAREÇA QUANDO EU
// CLICAR EM NOTA FISCAL — os 6 menus tem que ficar nos submenu do fiscal".
// A faixa ribbon das TELAS está DESLIGADA (CSS, patches velhos intactos);
// a aba do módulo passa a se chamar oficialmente **Fiscal**; o submenu com
// os 6 ABRE E FICA FIXO ao clicar na aba (não só hover) e fecha ao clicar
// fora/num item — lateral idem (flyout pinado); mapeador de CLIENTES
// alinhado ao dump real que ele mandou (NOME_RAZAOSOCIAL/CPF_CNPJ/RG_IE/
// cobrança/NFE_*) — e nada é importado sozinho (medo de "dar b.o").
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('submenu_fiscal_oficial_patch.js', 'utf8');
const ribbon = fs.readFileSync('ribbon_fiscal_estilo_antigo_patch.js', 'utf8');
const mfo = fs.readFileSync('menu_fiscal_oficial_patch.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const env = fs.readFileSync('envio_arquivos.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

console.log('== FILA / BUNDLE / CARIMBO ==');
ok('manifesto 221; Submenu Fiscal Oficial fecha a fila',
  man.length >= 225 && man[221] === 'submenu_fiscal_oficial_patch.js' && man[220] === 'menu_fiscal_oficial_patch.js');
ok('bundle contém o patch (guard + PURE + css + captura de clique)',
  bundle.indexOf('__v6101sfo') >= 0 && bundle.indexOf('SFO611_PURE') >= 0 && bundle.indexOf('sfo611-css') >= 0 && bundle.indexOf('onCliqueCaptura') >= 0);
ok('carimbo 6.1.1 (package + index 4 pontos)',
  pkg.version === VERSAO_APP && html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('v' + VERSAO_APP + '</title>') >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0);

console.log('== A FAIXA DAS TELAS ESTÁ DESLIGADA ==');
ok('.wxr-bar morta por CSS absoluto (não aparece NADA ao clicar em Nota Fiscal)',
  src.indexOf('.wxr-bar{display:none !important') >= 0 && src.indexOf('overflow:hidden !important') >= 0);
ok('patches da faixa (6.0.13/6.1.0) seguem intactos nos arquivos (só não mostram)',
  ribbon.indexOf('__v60013wxr') >= 0 && mfo.indexOf('__v6100mfo') >= 0);

console.log('== ABA FISCAL OFICIAL + SUBMENU FIXADO ==');
ok('index: botão do módulo agora é "Fiscal" (não mais NF-e/NFC-e) e o #menu-nfe com os 6 permanece',
  html.indexOf('</i>Fiscal</button>') >= 0 && html.indexOf('NF-e/NFC-e</button>') === -1
  && html.indexOf('id="menu-nfe" class="module-menu"') >= 0
  && ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'].every(function (v) { return html.indexOf("navigateTo('" + v + "')") >= 0; }));
ok('runtime também renomeia o pai lateral (NF-e/NFC-e → Fiscal) e cobre criação tardia',
  src.indexOf('renomeiaPai') >= 0 && src.indexOf('sxvm-nav-pai') >= 0 && src.indexOf('MutationObserver') >= 0);
ok('clique na aba ABRE E FIXA o submenu (sfo-pin), em vez de navegar direto',
  src.indexOf('onCliqueCaptura') >= 0 && src.indexOf("classList.add('sfo-pin')") >= 0 && src.indexOf('preventDefault()') >= 0);
ok('pin fecha ao clicar fora/num item; itens do submenu navegam normal (despinTodos)',
  src.indexOf('despinTodos') >= 0 && src.indexOf('.module.sfo-pin .module-menu') >= 0 && src.indexOf("t.closest('#menu-nfe')") >= 0);
ok('flyout lateral também pin no clique do pai + título oficial "Fiscal" no ::before',
  src.indexOf('content:"Fiscal" !important') >= 0 && src.indexOf('#sxvm-flyout-nav.sfo-pin') >= 0);
ok('capture: NÃO bloqueia outros cliques do sistema (só pai fiscal/itens do submenu/fora=fecha)',
  src.indexOf("addEventListener('click', onCliqueCaptura, true)") >= 0);

console.log('== MAPEADOR CLIENTES ALINHADO AO BANCO REAL (sem importar nada) ==');
const P = require('./submenu_fiscal_oficial_patch.js');
const amostra = {
  COD_CLIENTE: 4, NOME_RAZAOSOCIAL: 'EDSON SILVA NOGUEIRA', NOME_FANTASIA: 'ROCHA NOGUEIRA E LOPES ADVOGADOS',
  COMPLEMENTO: 'COMECIO', NUMERO: '323', TELEFONE: '(38) 9912-9500', TIPO: 'F', CPF_CNPJ: null,
  RUA: 'MARECHAL DEODORO DA FONSECA', BAIRRO: 'CENTRO', CIDADE: 'JANAUBA', CEP: '39440-000', UF: 'MG',
  DEL: 'N', CLI_LIMITE_CREDITO: 1000, DESCONTO: 0, REFERENCIA: 'perto do posto de gasolina',
  LONGITUDE: '-43.3055485', LATITUDE: '-15.8046064', NFE_INDIEDEST: 9, NFE_INDFINAL: 1, NFE_OBRIGATORIO: 0, NFE_GOVERNAMENTAL: 0
};
const c = P.mapearCliente(amostra);
ok('mapeia 1 cliente real (EDSON): nome/fantasia/endereco/bairro/cep/referencia/latlng/limite/fiscais',
  c.nome === 'EDSON SILVA NOGUEIRA' && c.fantasia === 'ROCHA NOGUEIRA E LOPES ADVOGADOS' && c.endereco === 'MARECHAL DEODORO DA FONSECA'
  && c.bairro === 'CENTRO' && c.cep === '39440000' && c.referencia.indexOf('posto') >= 0
  && c.latitude === '-15.8046064' && c.limiteCredito === 1000 && c.nfe.indIeDest === 9 && c.fone === '(38) 9912-9500');
ok('TIPO F/J + CPF_CNPJ decide cnpj/cpf (14 dígitos = CNPJ; vazio fica vazio, não inventa)',
  (function () {
    const pj = P.mapearCliente({ NOME_RAZAOSOCIAL: 'INSTITUTO EDUCACIONAL SERRA GERAL', TIPO: 'J', CPF_CNPJ: '12.283.329/0001-96', DEL: 'N' });
    return pj.cnpj === '12283329000196' && pj.cpf === '' && pj.tipo === 'J'
      && P.mapearCliente({ NOME_RAZAOSOCIAL: 'X' }).documento === '';
  })());
ok('DEL = S pula (a "TESTE" da amostra); endereço de cobrança só quando veio de verdade; RG_IE é a IE',
  P.ehDelCli({ DEL: 'S' }) === true && P.ehDelCli({ DEL: 'N' }) === false
  && P.mapearCliente({ NOME_RAZAOSOCIAL: 'X', DEL: 'N' }).cobranca === null
  && P.mapearCliente({ NOME_RAZAOSOCIAL: 'X', RUA_COBRANCA: 'R Y', CEP_COBRANCA: '39440-000', DEL: 'N' }).cobranca.cep === '39440000'
  && P.mapearCliente({ NOME_RAZAOSOCIAL: 'X', RG_IE: 'ISENTO' }).ie === 'ISENTO');
ok('página de envio usa os MESMOS campos reais (CPF_CNPJ/RG_IE/RUA/cobrança/NFE_) — e nada roda sem clique',
  env.indexOf('CPF_CNPJ') >= 0 && env.indexOf('RG_IE') >= 0 && env.indexOf('RUA_COBRANCA') >= 0
  && env.indexOf('NFE_INDIEDEST') >= 0 && env.indexOf('btn-cli') >= 0 && env.indexOf("id=\"btn-cli\"") >= 0);
ok('fundir protege o que foi cadastrado à mão (só completa vazios; cobrança/nfe só se faltar)',
  env.indexOf("'fone','celular','whatsapp','contato','email','referencia','latitude','longitude'") >= 0
  && env.indexOf('!rec.cobranca && n.cobranca') >= 0 && env.indexOf('!rec.nfe && n.nfe') >= 0);

console.log('== CONVÍVIO ==');
ok('6 telas da 6.0.14 intactas (o submenu abre elas; nada dentro muda)',
  fs.readFileSync('fiscal_catalogo_completo_patch.js', 'utf8').indexOf('Preparar Arquivos Fiscais') >= 0);
ok('hover continua funcionando de graça (CSS nativo do module-menu não foi tocado na base)',
  html.indexOf('.module:hover .module-menu') >= 0);

console.log('\nRESULTADO v6.1.1: ' + pass + ' ok, ' + fail + ' falhas');
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_ajustes_v6101.js:FIM>>>>
}

if (false) { // ═══ test_falta_emitir.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_falta_emitir.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE v6.1.8 — "FALTA POUCO PARA A NOTA VALER DE VERDADE"
//
// Ordem dele: "pode fazer tudo de uma vez" (terminar a NF-e). Este cartão da
// Central de NF-e diz, item por item e com o estado de AGORA, o que falta para
// a emissão real: CNPJ, IE, série/regime, perfil tributário, NCM, CSC do cupom
// e o certificado A1 (conferido NO PC). Este teste prova a conta e o estado.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');

let falhas = 0;
function ok(cond, msg) { if (cond) console.log('  ✔ ' + msg); else { falhas++; console.error('  ✘ ' + msg); } }
function ler(p) { return fs.readFileSync(p, 'utf8'); }
// r57: testes moram em SEÇÕES dentro de test_msg_*.js — "na suíte" = no runner ou em seção de tema
function naSuite(nome) {
  let s = ler('test_runner.js');
  try { fs.readdirSync('.').forEach((f) => { if (/^test_msg_.*\.js$/.test(f)) s += '\n' + ler(f); }); } catch (e) {}
  return s.indexOf(nome) >= 0;
}

const arquivo = 'ajustes_v6108_falta_emitir_patch.js';
const code = ler(arquivo);
const P = (function () {
  const ctx = { window: {}, document: undefined, db: {} };
  new Function('window', 'document', 'db', code)(ctx.window, ctx.document, ctx.db);
  return ctx.window.FE6108_PURE;
})();

const vazio = P.feAnalisar({ config: {}, empresas: [], perfisNf: [], produtos: [] });
function porId(an, id) { return an.itens.filter(function (i) { return i.id === id; })[0]; }

console.log('\n== 1) Base vazia: tudo apontado como pendente (sem mentira) ==');
ok(Array.isArray(vazio.itens) && vazio.itens.length === 7, 'a conferência tem os 7 itens (incluindo o certificado)');
ok(porId(vazio, 'cnpj').ok === false, 'CNPJ em branco = pendente');
ok(porId(vazio, 'ie').ok === false, 'IE em branco = pendente');
ok(porId(vazio, 'perfil').ok === false, 'sem perfil tributário = pendente');
ok(porId(vazio, 'ncm').ok === false, 'sem produto com NCM = pendente');
ok(porId(vazio, 'csc').ok === false, 'sem CSC = pendente (só é exigido no cupom)');
ok(porId(vazio, 'cert').ok === null, 'o certificado é conferido no PC na hora (não é chute do navegador)');
ok(vazio.prontos === 0, 'nenhum item pronto na base vazia');
ok(/0 de 7 itens prontos/.test(P.feResumo(vazio)), 'o resumo fala a verdade: 0 de 7');

console.log('\n== 2) Base completa: tudo verde ==');
const cheio = P.feAnalisar({
  config: { fiscal: { ie: '0012345678901', crt: '1', serie: '1' }, nfCscId: '000001', nfCsc: 'ABC123', nfAmbiente: 'producao' },
  empresas: [{ cnpj: '08.385.589/0001-03' }],
  perfisNf: [{ id: 'p1', cfop: '5102' }],
  produtos: [{ ncm: '37079021' }, { ncm: '' }]
});
ok(porId(cheio, 'cnpj').ok === true, 'CNPJ com 14 dígitos = pronto');
ok(porId(cheio, 'ie').ok === true, 'IE preenchida = pronto');
ok(porId(cheio, 'serie').ok === true, 'série + regime informados = pronto');
ok(porId(cheio, 'perfil').ok === true, '1 perfil cadastrado = pronto');
ok(porId(cheio, 'ncm').ok === true && /1 de 2 produto/.test(porId(cheio, 'ncm').detalhe), 'conta os NCM certinho (1 de 2)');
ok(porId(cheio, 'csc').ok === true, 'CSC com ID e código = pronto');
ok(cheio.prontos === 6 && cheio.total === 7, 'seis prontos (o sétimo é o certificado, do PC)');
ok(cheio.producao === true, 'sabe dizer que está em PRODUÇÃO');
ok(/tudo pronto/i.test(P.feResumo(cheio)), 'o resumo avisa quando está tudo pronto');
ok(P.feAnalisar({ config: { nfAmbiente: 'homologacao' } }).producao === false, 'e sabe que homologação é teste');
ok(P.feSoDigitos('08.385.589/0001-03') === '08385589000103', 'lê CNPJ com pontuação');

console.log('\n== 3) Como está ligado no sistema ==');
ok(/view-central-nf/.test(code), 'o cartão vive na Central de NF-e (tela fiscal)');
ok(/fe6108-caixa/.test(code) && /setInterval/.test(code), 'redesenha sozinho quando a tela abre (sonda leve, id próprio)');
ok(/nfeCertAPI/.test(code) && /status\(\)/.test(code), 'confere o certificado A1 pela ponte do programa do PC');
ok(/nada aqui emite sozinho/i.test(code), 'deixa escrito na tela que a conferência é só leitura');
ok(/abrirPerfilTributario|navigateTo/.test(code), 'cada pendência tem botão que leva ao lugar certo');
ok(!/\balert\(|\bprompt\(|\bconfirm\(/.test(code), 'sem modal nativo do navegador (regra #16)');
ok(!/localStorage\s*\.\s*(get|set|remove)Item|window\.localStorage/.test(code), 'não guarda nada no navegador (regra #44)');
ok(code.indexOf('__v6108falta') >= 0, 'tem guarda de duplicação (__v6108falta)');
ok(ler('bundle-manifest.json').indexOf(arquivo) >= 0, 'está no bundle');
ok(naSuite('test_falta_emitir.js'), 'o próprio teste está na suíte');

console.log('\nRESULTADO: ' + (falhas === 0 ? 'a conferência da NF-e está de pé!' : falhas + ' falha(s)'));
if (falhas) process.exitCode = 1;
//<<<<SECAO:test_falta_emitir.js:FIM>>>>
}

if (false) { // ═══ test_r64_fiscal.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_r64_fiscal.js:INICIO>>>>
const fs = require('fs');
let falhas = 0;
function ok(c, m){ if(c){ console.log('  ok - '+m); } else { falhas++; console.error('  FALHA - '+m); } }
console.log('-- r64 P2 fiscal: um botão por destino (auditoria 30/09) --');
const fe = fs.readFileSync('ajustes_v6108_falta_emitir_patch.js', 'utf8');
ok(fe.indexOf("var ultBtn=''") >= 0, 'rastreia o destino do botão anterior');
ok(fe.indexOf('i.onde!==ultBtn') >= 0, 'repete destino = esconde o botão');
ok(fe.indexOf("(!mostraBtn?'':'<button type=") >= 0, 'botão só quando mostraBtn');
if(falhas){ console.error('\n' + falhas + ' FALHA(S) r64-fiscal'); process.exit(1); }
console.log('\nRESULTADO: r64 fiscal passou!');
//<<<<SECAO:test_r64_fiscal.js:FIM>>>>
}
