// ═══════════════════════════════════════════════════════════════════════════
// novo/leituras.js — v1.0.0 (rodada 21: a conta da leitura de contador)
//
// O que é: a conta que o sistema de hoje faz quando o técnico digita os
// contadores da máquina que está no cliente. É a MESMA conta, copiada de
// `app.js:saveLeituraRapida` / `app.js:saveLeitura` (o sistema tem as duas, e
// as duas calculam igual):
//
//   anterior  = a ÚLTIMA leitura daquela máquina; se não existe nenhuma, o
//               contador INICIAL combinado no parque
//   consumo   = contador digitado - anterior        (PB e Cor, separado)
//   excedente = max(0, consumo - franquia) × valor do excedente   (do contrato)
//   status    = 'divergencia' quando o consumo de PB é NEGATIVO
//               (contador andou para trás = leitura errada) e 'pendente' quando não
//
// A conta é pura: não grava nada. Quem grava é a tela, pelo núcleo.
// ═══════════════════════════════════════════════════════════════════════════
(function (raiz) {
  'use strict';

  var VERSAO = '1.0.0';

  function texto(v) { return v == null ? '' : String(v); }
  function n(v, padrao) {
    if (typeof v === 'number' && isFinite(v)) return v;
    var x = Number(texto(v).replace(/\./g, '').replace(',', '.'));
    return isFinite(x) ? x : (padrao || 0);
  }
  function baixo(v) { return texto(v).trim().toLowerCase(); }

  // A última leitura daquela máquina (a mais nova manda). Sem data válida,
  // a ordem de gravação decide — é o que o `sort` de hoje faz na prática.
  function ultimaLeitura(leituras, parqueId) {
    var minhas = (leituras || []).filter(function (l) { return l && l.parqueId === parqueId; });
    if (!minhas.length) return null;
    return minhas.slice().sort(function (a, b) {
      var da = new Date(a.dataLeitura || 0).getTime() || 0;
      var db = new Date(b.dataLeitura || 0).getTime() || 0;
      return db - da;
    })[0];
  }

  // Quanto já saiu do contador até agora (o "anterior" da conta)
  function contadoresAnteriores(parque, ultima) {
    var p = parque || {};
    return {
      PB: ultima ? n(ultima.contadorPB, 0) : n(p.contadorInicialPB, 0),
      Cor: ultima ? n(ultima.contadorCor, 0) : n(p.contadorInicialCor, 0)
    };
  }

  function valorExcedente(consumoPB, consumoCor, contrato) {
    var c = contrato || {};
    var excPB = Math.max(0, n(consumoPB, 0) - n(c.franquiaPB, 0));
    var excCor = Math.max(0, n(consumoCor, 0) - n(c.franquiaCor, 0));
    // multiplica em CENTAVOS primeiro: 123 × R$ 0,15 não dá 18,449999999999996
    var valor = (Math.round(excPB * 100) * Math.round(n(c.valorExcedentePB, 0) * 100) +
      Math.round(excCor * 100) * Math.round(n(c.valorExcedenteCor, 0) * 100)) / 10000;
    return Math.round(valor * 100) / 100;
  }

  // Monta o registro da leitura do jeito que o sistema de hoje grava
  function leituraDaColeta(entrada) {
    var e = entrada || {};
    var parque = e.parque || {};
    var contrato = e.contrato || {};
    var antes = contadoresAnteriores(parque, e.ultima || null);
    var pb = n(e.contadorPB, 0);
    var cor = n(e.contadorCor, 0);
    var consPB = pb - antes.PB;
    var consCor = cor - antes.Cor;
    var valor = valorExcedente(consPB, consCor, contrato);
    return {
      parqueId: parque.id,
      equipamentoId: parque.equipamentoId,
      contratoId: parque.contratoId,
      clienteId: parque.clienteId,
      clienteNome: e.clienteNome || '',
      dataLeitura: texto(e.dataLeitura) || new Date().toISOString(),
      contadorPB: pb,
      contadorCor: cor,
      contadorPBAnterior: antes.PB,
      contadorCorAnterior: antes.Cor,
      consumoPB: consPB,
      consumoCor: consCor,
      valorExcedente: valor,
      faturar: valor > 0,
      // contador andou para trás = leitura errada (é a regra de hoje)
      status: consPB < 0 ? 'divergencia' : 'pendente'
    };
  }

  // O que a leitura assinala no contador da máquina (o `Math.max` de hoje:
  // o contador do cadastro nunca anda para trás por causa de uma leitura)
  function contadorDaMaquina(equipamento, leitura) {
    var eq = equipamento || {};
    return {
      contadorPB: Math.max(n(eq.contadorPB, 0), n((leitura || {}).contadorPB, 0)),
      contadorCor: Math.max(n(eq.contadorCor, 0), n((leitura || {}).contadorCor, 0))
    };
  }

  function ehDivergente(leitura) { return baixo((leitura || {}).status) === 'divergencia'; }

  raiz.DIGICOPY_LEITURAS = {
    VERSAO_LEITURAS: VERSAO,
    regras: {
      ultimaLeitura: ultimaLeitura,
      contadoresAnteriores: contadoresAnteriores,
      valorExcedente: valorExcedente,
      leituraDaColeta: leituraDaColeta,
      contadorDaMaquina: contadorDaMaquina,
      ehDivergente: ehDivergente
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
