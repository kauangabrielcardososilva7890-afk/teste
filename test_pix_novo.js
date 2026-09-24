// test_pix_novo.js — v1.0.0 (rodada 20: o PIX do núcleo novo)
//
// ATENÇÃO AO NOME: o `test_pix.js` do repositório é o teste do PIX de HOJE (o vetor oficial
// do Banco Central contra o `PIX_PURE` do `pix_patch.js`) — ele continua rodando e não pode
// ser tocado. ESTE arquivo é o teste do PIX do SISTEMA NOVO (`novo/pix.js`), e o que ele faz
// a mais é comparar as duas pontas: o código que o núcleo novo gera TEM de ser igual, byte a
// byte, ao que roda hoje (senão o cliente escaneia e o banco recusa).
//
//   • `novo/pix.js` — o do núcleo novo;
//   • `pix_patch.js` — o `PIX_PURE` que roda hoje (bloco entre PIX_PURE_START/END);
//   • `ajustes_v52219_pix_link_publico_patch.js` — o link da página de pagamento;
//   • `pix_comprovante_manual_patch.js` — a regra do comprovante (Pix não dá baixa sozinho).
const fs = require('fs');
require('./novo/pix.js');
const P = globalThis.DIGICOPY_PIX;
const R = P.regras;

let passou = 0;
function ok(nome, cond, detalhe) {
  if (!cond) { console.error('  \u2718 ' + nome + (detalhe ? '  [' + detalhe + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}

console.log('== PIX DO NÚCLEO NOVO (diferencial contra o que roda hoje) ==');

console.log('-- 1) HIGIENE --');
{
  const codigo = fs.readFileSync('novo/pix.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('não chama alert/confirm/prompt nativos', !/\b(alert|confirm|prompt)\s*\(/.test(codigo));
  ok('não grava no PC e não fala com a nuvem por conta própria (sem localStorage/fetch)',
    !/localStorage|sessionStorage|fetch\(|XMLHttpRequest/.test(codigo));
  ok('não embute senha, token nem chave de terceiro no arquivo (a chave do dono é dado, não código)',
    !/\bsenha\b|\btoken\b|password/i.test(codigo));
}

console.log('-- 2) O PIX_PURE É O MESMO DO SISTEMA DE HOJE (cópia fiel) --');
{
  // o bloco puro de hoje, do arquivo de verdade (é o mesmo pedaço que o test_pix.js usa)
  const src = fs.readFileSync('pix_patch.js', 'utf8');
  const m = src.match(/\/\* PIX_PURE_START \*\/([\s\S]*?)\/\* PIX_PURE_END \*\//);
  ok('o bloco PIX_PURE de hoje foi localizado no pix_patch.js', !!m);
  const dele = eval(m[1] + '\n; PIX_PURE;');
  ok('o PIX_PURE de hoje foi carregado para a comparação',
    !!dele && typeof dele.montar === 'function' && typeof dele.crc16 === 'function');

  // 2.1 — CRC16 (é o que o banco confere para aceitar o código)
  const crcs = ['', 'A', '123456789', 'br.gov.bcb.pix', '00020126', 'X'.repeat(200), 'çãé'];
  const difCrc = crcs.filter((t) => R.PIX_PURE.crc16(t) !== dele.crc16(t));
  ok('o CRC16 dá o mesmo resultado dos ' + crcs.length + ' casos (inclusive com acento)'
    + (difCrc.length ? ' — DIFERENTE em ' + JSON.stringify(difCrc) : ''), difCrc.length === 0);

  // 2.2 — limpeza de nome/cidade e txid
  const limpezas = [
    ['José Ávila', 25], ['DIGICOPY INFORMÁTICA LTDA', 25], ['  espaços  ', 25], ['açaí & cia', 15], ['', 25]
  ];
  const difLim = limpezas.filter(([t, mx]) => R.PIX_PURE.limpar(t, mx) !== dele.limpar(t, mx));
  ok('a limpeza de nome/cidade é igual em ' + limpezas.length + ' casos (tira acento e símbolo)'
    + (difLim.length ? ' — DIFERENTE' : ''), difLim.length === 0);
  const txids = ['VD16001', 'venda 12/2026', '***', '', 'x'.repeat(40), 'AÇAÍ'];
  const difTx = txids.filter((t) => R.PIX_PURE.txidLimpo(t) !== dele.txidLimpo(t));
  ok('o txid é igual em ' + txids.length + ' casos (só letra/número, até 25)'
    + (difTx.length ? ' — DIFERENTE' : ''), difTx.length === 0);

  // 2.3 — o tipo da chave (o que a tela de configuração mostra)
  const chaves = ['', '12345678901', '12345678000199', '+5538999990000', 'loja@digicopy.com.br',
    '123e4567-e89b-12d3-a456-426614174000', 'chave-personalizada', '12.345.678/0001-99'];
  const difTipo = chaves.filter((c) => R.PIX_PURE.tipoChave(c) !== dele.tipoChave(c));
  ok('o tipo da chave é igual em ' + chaves.length + ' casos'
    + (difTipo.length ? ' — DIFERENTE em ' + JSON.stringify(difTipo) : ''), difTipo.length === 0);

  // 2.4 — O PAYLOAD: é isso que o banco do cliente lê. Byte a byte.
  const casos = [
    { chave: '12345678000199', nome: 'DIGICOPY', cidade: 'MONTES CLAROS', valor: 80, txid: 'VD16001' },
    { chave: 'loja@digicopy.com.br', nome: 'DIGICOPY INFORMÁTICA', cidade: 'Montes Claros', valor: 1234.56, txid: 'VD999999' },
    { chave: '+5538999990000', nome: '', cidade: '', valor: 0, txid: '' },
    { chave: '12345678901', nome: 'José Ávila', cidade: 'São Paulo', valor: 0.01, txid: '***' },
    { chave: 'chave-com-hifen', nome: 'Loja do Zé & Cia', cidade: 'Belo Horizonte', valor: 10.5, txid: 'x'.repeat(30) },
    { chave: '123e4567-e89b-12d3-a456-426614174000', nome: 'Ç', cidade: 'Á', valor: 99999.99, txid: 'A'.repeat(25) }
  ];
  const difPayload = [];
  casos.forEach((c, i) => {
    const meu = R.PIX_PURE.montar(c);
    const deleStr = dele.montar(c);
    if (meu !== deleStr) difPayload.push({ i, meu, dele: deleStr });
  });
  ok('o código copia e cola é IDÊNTICO ao de hoje nos ' + casos.length + ' casos (inclusive valor com centavo)'
    + (difPayload.length ? ' — DIFERENTE: ' + JSON.stringify(difPayload[0]) : ''), difPayload.length === 0);
  ok('e ele termina com 4 dígitos de CRC e começa com o padrão do Banco Central (000201)',
    /^000201/.test(R.PIX_PURE.montar(casos[0])) && /6304[0-9A-F]{4}$/.test(R.PIX_PURE.montar(casos[0])));
  ok('chave vazia é recusada (não gera código torto)', (() => {
    try { R.PIX_PURE.montar({ chave: '' }); return false; } catch (e) { return true; }
  })());

  // 2.5 — a imagem do QR
  const difQr = [200, 120, 540, 900].filter((sz) => R.PIX_PURE.qrUrl('abc', sz) !== dele.qrUrl('abc', sz));
  ok('o endereço da imagem do QR é o mesmo (com o teto e o piso de tamanho de hoje)'
    + (difQr.length ? ' — DIFERENTE' : ''), difQr.length === 0);
}

console.log('-- 3) O TXID DA VENDA (acha o pagamento no extrato) --');
{
  ok('venda "16001" vira "VD16001" (o prefixo VD entra quando o número é só dígito)',
    R.txidDaVenda({ numero: '16001' }) === 'VD16001', R.txidDaVenda({ numero: '16001' }));
  ok('número que já tem letra é mantido (VD-2026-0042 → VD20260042)',
    R.txidDaVenda({ numero: 'VD-2026-0042' }) === 'VD20260042', R.txidDaVenda({ numero: 'VD-2026-0042' }));
  ok('venda sem número não quebra e continua com o prefixo VD',
    /^VD/.test(R.txidDaVenda({})), R.txidDaVenda({}));
  ok('número gigante é cortado em 25 caracteres (o padrão do banco não aceita mais)',
    R.txidDaVenda({ numero: '9'.repeat(60) }).length === 25);
  const payload = R.payloadDaVenda({ numero: '16001', total: 80 }, { chave: '12345678000199', nome: 'DIGICOPY', cidade: 'MONTES CLAROS' });
  ok('o payload da venda sai com o valor exato dela (R$ 80,00 dentro do código)',
    payload.indexOf('540580.00') >= 0, payload.slice(0, 80));
}

console.log('-- 4) O LINK DA PÁGINA DE PAGAMENTO (o do PDF/celular) --');
{
  const fonte = fs.readFileSync('ajustes_v52219_pix_link_publico_patch.js', 'utf8');
  // roda o ARQUIVO INTEIRO com um window de mentira: o `return` de dentro do
  // `if(typeof document==='undefined')` é o que impede ele de encostar na tela
  const w = {};
  new Function('window', 'document', 'console', fonte)(w, undefined, { log: function () { } });
  const dele = w.PIX_LINK_PUBLICO_PURE;
  ok('a página pública do sistema de hoje continua sendo a da nuvem (não o GitHack)',
    !!dele && /workers\.dev\/pix$/.test(dele.PIX_PUBLICO), dele ? dele.PIX_PUBLICO : 'não carregou');
  ok('o link é igual ao de hoje, inclusive escapando o código',
    R.urlPagamento('000201abc+/=') === dele.pixUrlPublico('000201abc+/=') &&
    R.urlPagamento('x') === R.PIX_PUBLICO + '?c=x');
}

console.log('-- 5) O COMPROVANTE É MANUAL: Pix não dá baixa sozinho (v4.9.15) --');
{
  // roda a regra de hoje de verdade, com um db de mentira, e compara com a do núcleo novo
  const fonte = fs.readFileSync('pix_comprovante_manual_patch.js', 'utf8');
  const db = {
    vendas: [{ id: 'v1', formaPagamento: 'Pix' }],
    contasReceber: [{ id: 'cr1', vendaId: 'v1', status: 'pago', pagamentoData: '2026-09-24T10:00:00.000Z', autoBaixa: true, valor: 80 }]
  };
  const w = { db: db, console: { log: function () { } }, setTimeout: function () { } };
  new Function('window', 'db', 'document', 'console', 'setTimeout', 'saveDB', 'renderFinanceiro', 'renderAuditoria', 'toast',
    fonte)(w, db, undefined, w.console, w.setTimeout, function () { }, function () { }, function () { }, function () { });
  const pure = w.PIX_MANUAL_PURE;
  ok('a regra de hoje foi carregada (reabrirTituloPix)', !!pure && typeof pure.reabrirTituloPix === 'function');
  const quantos = pure.reabrirTituloPix('v1');
  const depoisDeHoje = db.contasReceber[0];
  const meu = R.comprovanteManual({ id: 'cr1', vendaId: 'v1', status: 'pago', pagamentoData: '2026-09-24T10:00:00.000Z', autoBaixa: true, valor: 80 });
  ok('o título de hoje volta para ABERTO (1 título alterado)', quantos === 1 && depoisDeHoje.status === 'aberto');
  ok('os 4 campos que o sistema de hoje mexe são exatamente os que o núcleo novo mexe',
    meu.status === depoisDeHoje.status && meu.pagamentoData === depoisDeHoje.pagamentoData &&
    meu.autoBaixa === depoisDeHoje.autoBaixa && meu.observacao === depoisDeHoje.observacao,
    JSON.stringify({ meu: meu, hoje: depoisDeHoje }));
  ok('e o aviso escrito é o mesmo texto de hoje, letra por letra',
    R.textoComprovante() === pure.textoAviso() && /comprovante no WhatsApp/.test(meu.observacao),
    R.textoComprovante());
  ok('o valor e o vínculo com a venda não se perdem (o financeiro continua sabendo de quem é)',
    meu.valor === 80 && meu.vendaId === 'v1' && meu.id === 'cr1');
  ok('título sem nada não quebra (devolve o que veio)', R.comprovanteManual(null) === null);
}

console.log('-- 6) A TELA: painel do QR e o pedaço que vai impresso na notinha --');
{
  const cfg = { chave: '12345678000199', nome: 'DIGICOPY', cidade: 'MONTES CLAROS' };
  const venda = { numero: '16001', total: 80, formaPagamento: 'Pix' };

  const painel = R.painelHtml(venda, cfg);
  ok('o painel do faturamento mostra o QR, o valor e o copia e cola',
    painel.indexOf('api.qrserver.com') > 0 && painel.indexOf('80,00') > 0 &&
    painel.indexOf('data-pix-codigo') > 0 && painel.indexOf('data-pix-copiar') > 0);
  ok('e o painel avisa, na tela, que o comprovante é manual',
    /comprovante/i.test(painel) && /WhatsApp/.test(painel));
  const payload = R.payloadDaVenda(venda, cfg);
  ok('o código dentro do campo é o mesmo que vai no QR (nada de código diferente do QR)',
    painel.indexOf(payload) > 0);
  ok('sem chave configurada o painel explica onde cadastrar (não fica em branco)',
    /não configurada/i.test(R.painelHtml(venda, { chave: '' })) && /Configurações/.test(R.painelHtml(venda, { chave: '' })));

  const bloco = R.blocoNotinha(venda, cfg);
  ok('na notinha o bloco do Pix sai com o valor, a chave e o link da página de pagamento',
    /PAGUE COM PIX/.test(bloco) && /80,00/.test(bloco) && bloco.indexOf(cfg.chave) > 0 &&
    bloco.indexOf(R.PIX_PUBLICO) > 0 && bloco.indexOf(payload) > 0);
  ok('venda que NÃO é Pix não leva bloco nenhum (o papel continua igual)',
    R.blocoNotinha({ numero: '2', total: 10, formaPagamento: 'Dinheiro' }, cfg) === '');
  ok('e sem chave configurada não inventa QR na notinha',
    R.blocoNotinha(venda, { chave: '' }) === '');
}

console.log('-- 7) A CONFIGURAÇÃO É REGISTRO DO NÚCLEO (viaja pela nuvem, como hoje) --');
{
  require('./novo/nucleo.js');
  const N = globalThis.DIGICOPY_NUCLEO;
  const nucleo = N.criar({ empresaId: 'e1', origem: 'teste', guardar: function () { } });
  ok('começa sem chave (não inventa chave do dono)', R.lerConfig(nucleo).chave === '' && R.pronto(R.lerConfig(nucleo)) === false);
  // GRAVAR PRIMEIRO (sem ler antes): era um defeito real — "lista desconhecida: config"
  const nucleo2 = N.criar({ empresaId: 'e2', origem: 'teste', guardar: function () { } });
  ok('gravar a chave SEM ter lido antes funciona (a lista se registra sozinha)',
    R.gravarConfig(nucleo2, { chave: '12345678000199', nome: 'DIGICOPY', cidade: 'MONTES CLAROS' }) === true &&
    R.lerConfig(nucleo2).chave === '12345678000199');
  const gravou = R.gravarConfig(nucleo, { chave: ' 12345678000199 ', nome: ' DIGICOPY ', cidade: ' MONTES CLAROS ' });
  ok('grava a configuração (e tira os espaços das pontas)', gravou && R.lerConfig(nucleo).chave === '12345678000199' &&
    R.lerConfig(nucleo).nome === 'DIGICOPY', JSON.stringify(R.lerConfig(nucleo)));
  ok('com chave, o Pix fica pronto', R.pronto(R.lerConfig(nucleo)) === true);
  ok('a configuração entra na fila da nuvem (é registro do núcleo, não rascunho do PC)',
    nucleo.mudancas().length === 1 && nucleo.mudancas()[0].lista === R.LISTA_CONFIG);
  ok('e é um só registro (gravar de novo não cria um segundo)',
    (R.gravarConfig(nucleo, { chave: 'abc', nome: 'X', cidade: 'Y' }), nucleo.listar(R.LISTA_CONFIG).length === 1));
  // sobrevive a guardar e abrir (backup/restauração)
  const outro = N.criar({ empresaId: 'e1', origem: 'teste', guardar: function () { } });
  outro.carregarDeJSON(JSON.parse(JSON.stringify(nucleo.paraJSON())));
  ok('a chave sobrevive a fechar e abrir o sistema (backup/restauração)',
    R.lerConfig(outro).chave === 'abc', R.lerConfig(outro).chave);
}

console.log('-- 8) A TELA DA CONFIGURAÇÃO (o cartão onde ele cadastra a chave) --');
{
  const html = R.cartaoConfigHtml({ chave: '12345678000199', nome: 'DIGICOPY', cidade: 'MONTES CLAROS' });
  ok('o cartão tem os mesmos campos de hoje (chave, beneficiário, cidade) e os limites',
    html.indexOf('cfg-pix-chave') > 0 && html.indexOf('cfg-pix-nome') > 0 && html.indexOf('cfg-pix-cidade') > 0 &&
    html.indexOf('maxlength="25"') > 0 && html.indexOf('maxlength="15"') > 0);
  ok('e já mostra o TIPO da chave detectado (é o que a tela de hoje mostra)',
    /Tipo detectado: CNPJ/.test(html), (html.match(/Tipo detectado: [^<]*/) || [])[0]);
  ok('com o botão de salvar e o de testar o QR',
    html.indexOf('data-cfg-pix-salvar') > 0 && html.indexOf('data-cfg-pix-testar') > 0);
  ok('a chave que ele cadastrou aparece no campo (não some ao abrir a tela)',
    html.indexOf('value="12345678000199"') > 0);
  ok('o cartão é escapado (chave com aspas não quebra a tela)',
    R.cartaoConfigHtml({ chave: '"><script>alert(1)</script>' }).indexOf('&quot;&gt;&lt;script&gt;') > 0);
  ok('o tipo detectado segue a regra de hoje em 4 chaves diferentes',
    ['12345678901', '12345678000199', '+5538999990000', 'loja@digicopy.com.br']
      .every((c) => R.cartaoConfigHtml({ chave: c }).indexOf('Tipo detectado: ' + R.PIX_PURE.tipoChave(c)) > 0));
  ok('a caixa da configuração é montável (função exposta na API pública)',
    typeof P.montarConfig === 'function' && typeof P.cartaoConfigHtml === 'function');
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — o Pix do núcleo novo gera o MESMO código do sistema de hoje e o comprovante continua manual.');
process.exit(0);
