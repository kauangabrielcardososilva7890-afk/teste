// ═══════════════════════════════════════════════════════════════════════════
// VENDA SALVA TAMBÉM APARECE NO FINANCEIRO (v5.22.67)
//
// Até aqui só a venda FATURADA virava título em contas a receber. A venda
// apenas salva (aguardando faturamento) não gerava nada, então sumia do
// financeiro — era o "algumas vendas não estão indo pro financeiro".
//
// Agora toda venda em aberto ganha um título de acompanhamento, marcado como
// `aguardandoFaturamento`. Quando a venda é faturada de verdade, o próprio
// faturamento apaga os títulos abertos dela e cria os definitivos (à vista ou
// as parcelas), então não existe risco de contar duas vezes.
//
// Venda cancelada, excluída ou já faturada NÃO entra aqui.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var MARCA = 'aguardandoFaturamento';

  function texto(v) { return String(v == null ? '' : v).trim(); }

  function vendaEmAberto(v) {
    if (!v || !v.id) return false;
    var st = texto(v.status).toLowerCase();
    if (!st) return true;                       // sem status = ainda em aberto
    if (st.indexOf('fatur') === 0) return false; // faturado / faturada
    if (/cancel|exclu|estorn|devolv/.test(st)) return false;
    return true;
  }

  // Quais vendas em aberto ainda não têm NENHUM título no financeiro.
  function vendasSemTitulo(vendas, contasReceber) {
    var comTitulo = Object.create(null);
    (contasReceber || []).forEach(function (c) {
      if (c && c.vendaId) comTitulo[c.vendaId] = true;
    });
    return (vendas || []).filter(function (v) {
      return vendaEmAberto(v) && !comTitulo[v.id];
    });
  }

  // Títulos de acompanhamento que perderam a venda (apagada ou já faturada).
  function titulosOrfaos(contasReceber, vendas) {
    var porId = Object.create(null);
    (vendas || []).forEach(function (v) { if (v && v.id) porId[v.id] = v; });
    return (contasReceber || []).filter(function (c) {
      if (!c || !c[MARCA] || !c.vendaId) return false;
      var v = porId[c.vendaId];
      return !v || !vendaEmAberto(v);
    });
  }

  function tituloDaVenda(v, sess, novoId) {
    return {
      id: novoId,
      empresaId: (v && v.empresaId) || (sess && sess.empresaId) || '',
      origem: 'venda',
      clienteId: v && v.clienteId,
      descricao: 'Venda ' + texto(v && v.numero) + ' • aguardando faturamento',
      valor: Number((v && v.total) || 0),
      vencimento: (v && (v.data || v.criadoEm)) || new Date().toISOString(),
      pagamentoData: null,
      status: 'aberto',
      contratoId: null,
      leituraId: null,
      vendaId: v && v.id,
      aguardandoFaturamento: true,
      criadoPor: (v && v.criadoPor) || (sess && sess.usuarioId) || '',
      criadoPorNome: (v && v.criadoPorNome) || (sess && sess.usuarioNome) || ''
    };
  }

  window.VENDAS_FINANCEIRO_PENDENTE_PURE = {
    vendaEmAberto: vendaEmAberto,
    vendasSemTitulo: vendasSemTitulo,
    titulosOrfaos: titulosOrfaos,
    tituloDaVenda: tituloDaVenda,
    MARCA: MARCA,
    VERSAO: '5.22.67'
  };

  if (typeof document === 'undefined') return;

  function novoId() {
    return typeof uid === 'function' ? uid('cr') : 'cr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  // Assinatura barata: só refaz a conta quando algo realmente mudou.
  // Os PCs da loja são fracos, isto roda a cada abertura do financeiro.
  var ultimaAssinatura = '';

  function sincronizar() {
    if (typeof db === 'undefined' || !db) return 0;
    var sess = typeof getSession === 'function' ? getSession() : null;
    if (!sess) return 0;

    var vendas = db.vendas || [];
    var crs = db.contasReceber || (db.contasReceber = []);
    var assinatura = vendas.length + ':' + crs.length;
    if (assinatura === ultimaAssinatura) return 0;

    var faltando = vendasSemTitulo(vendas, crs);
    var orfaos = titulosOrfaos(crs, vendas);
    if (!faltando.length && !orfaos.length) { ultimaAssinatura = assinatura; return 0; }

    if (orfaos.length) {
      var fora = Object.create(null);
      orfaos.forEach(function (c) { fora[c.id] = true; });
      db.contasReceber = crs.filter(function (c) { return !fora[c.id]; });
      crs = db.contasReceber;
    }
    faltando.forEach(function (v) { crs.push(tituloDaVenda(v, sess, novoId())); });

    ultimaAssinatura = vendas.length + ':' + crs.length;
    try { if (typeof saveDB === 'function') saveDB(); } catch (e) {}
    return faltando.length + orfaos.length;
  }

  window.sincronizarVendasNoFinanceiro = sincronizar;

  function envelopar(nome, marca) {
    var velho = window[nome];
    if (typeof velho !== 'function' || velho[marca]) return;
    var novo = function () {
      try { sincronizar(); } catch (e) {}
      return velho.apply(this, arguments);
    };
    novo[marca] = true;
    window[nome] = novo;
  }

  envelopar('renderFinanceiro', '__v52267vendaPend');
  envelopar('renderVendas', '__v52267vendaPend');

  setTimeout(function () { try { sincronizar(); } catch (e) {} }, 1500);

  console.log('[DIGICOPY] venda salva também aparece no financeiro');
})();
