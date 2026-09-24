// ═══════════════════════════════════════════════════════════════════════════
// novo/pix.js — v1.0.0 (fase 3 do redesenho: PIX)
//
// Copiado do que roda HOJE no sistema do dono, sem inventar:
//   • o código "copia e cola" (BR Code/EMV do Banco Central + CRC16) é o
//     `PIX_PURE` de `pix_patch.js:9` — o teste diferencial roda os dois lado a
//     lado e compara byte a byte;
//   • o txid que aparece no extrato é o `pixTxidDaVenda` (`pix_patch.js:113`):
//     venda "16001" → "VD16001";
//   • o link da página de pagamento é o do `ajustes_v52219_pix_link_publico_patch.js`
//     (a página da nuvem, não o GitHack);
//   • a CONFIGURAÇÃO (chave/nome/cidade) mora no `db.config.pix` de hoje, que
//     sincroniza pela nuvem — aqui ela é um registro da lista interna `config`,
//     com a mesma ideia: viaja entre os computadores;
//   • o COMPROVANTE é manual (`pix_comprovante_manual_patch.js`, v4.9.15): Pix
//     NÃO dá baixa automática — o título fica ABERTO com o aviso escrito, e quem
//     dá a baixa é o dono depois de ver o comprovante.
//
// Nada aqui fala com a nuvem, nada é gravado no PC e não existe alert/confirm/
// prompt nativo.
// ═══════════════════════════════════════════════════════════════════════════
(function (raiz) {
  'use strict';

  var VERSAO = '1.0.0';

  // ── 1. O PADRÃO DO BANCO CENTRAL (cópia fiel do PIX_PURE de hoje) ─────────
  var PIX_PURE = (function () {
    // Campo TLV do padrão EMV: ID (2 dígitos) + tamanho (2 dígitos) + valor
    function emv(id, valor) {
      var v = String(valor);
      return id + String(v.length).padStart(2, '0') + v;
    }
    // CRC16-CCITT (variante FALSE: polinômio 0x1021, início 0xFFFF, sem reflexão)
    // — a única variante aceita pelo Banco Central no final do payload Pix.
    function crc16(str) {
      var crc = 0xFFFF;
      for (var i = 0; i < str.length; i++) {
        crc ^= (str.charCodeAt(i) & 0xFF) << 8;
        for (var j = 0; j < 8; j++) {
          crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
          crc &= 0xFFFF;
        }
      }
      return crc.toString(16).toUpperCase().padStart(4, '0');
    }
    // Nome/cidade: o padrão aceita letras, números e espaço. Remove acentos e símbolos.
    function limpar(txt, max) {
      return String(txt || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^0-9A-Za-z ]/g, ' ')
        .replace(/ {2,}/g, ' ')
        .trim()
        .slice(0, max);
    }
    // txid (referência que aparece no extrato para achar o pagamento): só letras/números, até 25.
    function txidLimpo(txt) {
      var t = String(txt || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 25);
      return t || '***';
    }
    // Monta o payload Pix completo (copia e cola). valor>0 inclui o valor exato no QR.
    function montar(o) {
      o = o || {};
      var chave = String(o.chave || '').trim();
      if (!chave) throw new Error('Chave Pix não informada');
      var nome = limpar(o.nome, 25) || 'RECEBEDOR';
      var cidade = limpar(o.cidade, 15) || 'BRASIL';
      var valor = Number(o.valor) || 0;
      var txid = txidLimpo(o.txid);
      var gui = emv('00', 'br.gov.bcb.pix') + emv('01', chave);
      var p = emv('00', '01')
        + emv('26', gui)
        + emv('52', '0000')   // categoria não informada
        + emv('53', '986');   // moeda: Real
      if (valor > 0) p += emv('54', valor.toFixed(2));
      p += emv('58', 'BR')
        + emv('59', nome)
        + emv('60', cidade)
        + emv('62', emv('05', txid))
        + '6304';
      return p + crc16(p);
    }
    // Detecta o tipo da chave só para mostrar na tela de configuração
    function tipoChave(chave) {
      var c = String(chave || '').trim();
      if (!c) return '—';
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)) return 'Chave aleatória';
      if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) return 'E-mail';
      if (/^\+55\d{10,11}$/.test(c)) return 'Telefone (+55 DDD número)';
      var d = c.replace(/\D/g, '');
      if (/^\d{11}$/.test(c) && d.length === 11) return 'CPF';
      if (/^\d{14}$/.test(c) && d.length === 14) return 'CNPJ';
      return 'Personalizada (verifique se está igual à do banco)';
    }
    // URL da imagem do QR (serviço público de geração de imagem; recebe só o próprio
    // código Pix — o mesmo texto que vai impresso na notinha). Sem internet a imagem
    // some, mas o código copia e cola continua funcionando.
    function qrUrl(payload, size) {
      var s = Math.max(120, Math.min(540, size || 220));
      return 'https://api.qrserver.com/v1/create-qr-code/?size=' + s + 'x' + s + '&margin=6&data=' + encodeURIComponent(payload);
    }
    return { emv: emv, crc16: crc16, limpar: limpar, txidLimpo: txidLimpo, montar: montar, tipoChave: tipoChave, qrUrl: qrUrl };
  })();

  // ── 2. A PÁGINA DE PAGAMENTO (o link do PDF / do celular) ────────────────
  var PIX_PUBLICO = 'https://digicopy-sync-api.digicopyonline.workers.dev/pix';
  function urlPagamento(payload) {
    return PIX_PUBLICO + '?c=' + encodeURIComponent(String(payload || ''));
  }

  // ── 3. AS REGRAS (puras) ─────────────────────────────────────────────────
  function texto(v) { return v == null ? '' : String(v); }
  function low(v) { return texto(v).trim().toLowerCase(); }
  function n(v, padrao) {
    if (typeof v === 'number' && isFinite(v)) return v;
    var x = Number(texto(v).replace(/\./g, '').replace(',', '.'));
    return isFinite(x) ? x : (padrao || 0);
  }

  // A lista interna da configuração — é um registro do núcleo como qualquer outro,
  // por isso sobe para a nuvem (é o `db.config.pix` de hoje).
  var LISTA_CONFIG = 'config';
  // o schema desta lista mora na FICHA (novo/listas.js) — uma verdade só; a cópia local
  // vale apenas quando a ficha não está carregada (teste isolado desta peça)
  var FICHA = raiz.DIGICOPY_LISTAS;
  var SCHEMA_CONFIG = (FICHA && FICHA.ESQUEMAS && FICHA.ESQUEMAS.config) ||
    { chave: { tipo: 'texto' }, nome: { tipo: 'texto' }, cidade: { tipo: 'texto' } };
  var ID_CONFIG_PIX = 'pix';

  function lerConfig(nucleo) {
    try {
      nucleo.registrarLista(LISTA_CONFIG, SCHEMA_CONFIG);
      var r = nucleo.obter(LISTA_CONFIG, ID_CONFIG_PIX);
      return { chave: texto(r && r.chave), nome: texto(r && r.nome), cidade: texto(r && r.cidade) };
    } catch (e) {
      return { chave: '', nome: '', cidade: '' };
    }
  }
  function gravarConfig(nucleo, cfg) {
    var c = cfg || {};
    // a lista é registrada aqui também: gravar a chave NÃO pode depender de alguém
    // ter lido antes (era um erro real: "lista desconhecida: config" ao salvar primeiro)
    if (nucleo && nucleo.registrarLista) nucleo.registrarLista(LISTA_CONFIG, SCHEMA_CONFIG);
    var r = nucleo.salvar(LISTA_CONFIG, {
      id: ID_CONFIG_PIX, chave: texto(c.chave).trim(), nome: texto(c.nome).trim(), cidade: texto(c.cidade).trim()
    });
    return !!(r && r.ok);
  }
  function pronto(cfg) { return !!texto(cfg && cfg.chave).trim(); }

  // venda "16001" → "VD16001" (é o que aparece no extrato do banco)
  function txidDaVenda(venda) {
    var base = texto(venda && venda.numero).replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    var comLetra = /[A-Z]/.test(base) ? base : ('VD' + base);
    return (comLetra || 'VENDA').slice(0, 25);
  }

  function payloadDaVenda(venda, cfg) {
    var c = cfg || {};
    return PIX_PURE.montar({
      chave: c.chave,
      nome: c.nome,
      cidade: c.cidade,
      valor: n(venda && venda.total, 0),
      txid: txidDaVenda(venda)
    });
  }

  // ── 4. O COMPROVANTE É MANUAL (v4.9.15) ─────────────────────────────────
  // O texto é o mesmo que roda hoje, letra por letra.
  function textoComprovante() {
    return 'Pix gerado com valor exato. Peça para o cliente mandar o comprovante no WhatsApp da DIGICOPY antes de dar baixa.';
  }
  // O que o sistema de hoje faz DEPOIS de faturar em Pix (`reabrirTituloPix`,
  // pix_comprovante_manual_patch.js:16): o título volta para ABERTO, sem data de
  // pagamento, sem baixa automática e com o aviso escrito na observação.
  function comprovanteManual(titulo) {
    if (!titulo) return titulo;
    var t = Object.assign({}, titulo);
    t.status = 'aberto';
    t.pagamentoData = null;
    t.autoBaixa = false;
    t.observacao = textoComprovante();
    return t;
  }

  // ── 5. O PEDAÇO QUE VAI IMPRESSO NA NOTINHA ─────────────────────────────
  function escaparHtml(t) {
    return texto(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function moeda(v) {
    return n(v, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
  function blocoNotinha(venda, cfg) {
    var v = venda || {};
    if (texto(v.formaPagamento) !== 'Pix' || !pronto(cfg)) return '';
    var payload = '';
    try { payload = payloadDaVenda(v, cfg); } catch (e) { return ''; }
    var link = urlPagamento(payload);
    return '\n  <div style="margin-top:3mm;border:1px solid #9db3e8;border-radius:2mm;padding:2.5mm 3mm;display:flex;gap:4mm;align-items:center;page-break-inside:avoid">\n' +
      '    <a href="' + link + '" target="_blank" rel="noopener"><img src="' + PIX_PURE.qrUrl(payload, 200) + '" width="82" height="82" style="width:26mm;height:26mm" alt="QR Pix"></a>\n' +
      '    <div style="flex:1;min-width:0">\n' +
      '      <p style="margin:0;font-size:11.5px;font-weight:800;color:#0a1e8a">PAGUE COM PIX — ' + moeda(v.total || 0) + '</p>\n' +
      '      <p style="margin:1mm 0 0;font-size:9px">Chave: <b>' + escaparHtml(cfg.chave) + '</b>' + (cfg.nome ? (' • ' + escaparHtml(cfg.nome)) : '') + ' • Aponte a câmera do celular</p>\n' +
      '      <p style="margin:1mm 0 0;font-size:8.5px"><b>Recebeu este documento em PDF?</b> <a href="' + link + '" target="_blank" rel="noopener" style="color:#0a1e8a;text-decoration:underline">toque aqui para abrir a página de pagamento</a></p>\n' +
      '      <p style="margin:1mm 0 0;font-size:7.5px;color:#555">Pix copia e cola:</p>\n' +
      '      <p style="margin:0;font-size:6.5px;color:#555;word-break:break-all;line-height:1.35">' + payload + '</p>\n' +
      '    </div>\n' +
      '  </div>';
  }

  // O painel do faturamento (o QR na tela, com o copia e cola) — texto de hoje.
  function painelHtml(venda, cfg) {
    var c = cfg || {};
    if (!pronto(c)) {
      return '<div class="px-aviso"><b>⚠️ Chave Pix ainda não configurada</b><br>' +
        'Cadastre a chave em <b>Configurações → Pix</b> e o QR aparece aqui sozinho.</div>';
    }
    var payload = '';
    try { payload = payloadDaVenda(venda, c); } catch (e) { return ''; }
    return '<div class="px-painel">' +
      '<div class="px-qr"><img src="' + PIX_PURE.qrUrl(payload, 220) + '" alt="QR Code Pix" width="150" height="150">' +
        '<span class="px-sem-net">Sem internet para gerar a imagem — o código copia e cola continua valendo.</span></div>' +
      '<div class="px-lado">' +
        '<p class="px-titulo">Pague com Pix — <b>' + moeda(venda && venda.total) + '</b></p>' +
        '<p class="px-sub">O cliente escaneia com o app do banco e o valor já vem preenchido. Chave: <b>' + escaparHtml(c.chave) + '</b></p>' +
        '<div class="px-copia"><input data-pix-codigo readonly value="' + escaparHtml(payload) + '">' +
          '<button type="button" class="vnd-btn vnd-btn-forte" data-pix-copiar>📋 Copiar</button></div>' +
        '<p class="px-aviso-manual"><b>⚠️ Comprovante manual:</b> ' + escaparHtml(textoComprovante()) + '</p>' +
      '</div>' +
    '</div>';
  }

  // Copiar sem quebrar quando não existe área de transferência (jsdom, Electron antigo)
  function copiarPayload(payload, avisar) {
    var texto = String(payload || '');
    if (!texto) return false;
    try {
      if (raiz.navigator && raiz.navigator.clipboard && raiz.navigator.clipboard.writeText) {
        raiz.navigator.clipboard.writeText(texto);
        if (avisar) avisar('Código Pix copiado! Cole no app do banco.');
        return true;
      }
    } catch (e) { /* sem clipboard: cai no aviso */ }
    if (avisar) avisar('Código Pix: selecione o campo e copie (Ctrl+C).');
    return false;
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // A TELA DA CONFIGURAÇÃO — o cartão "Pix — QR Code de cobrança"
  // (é o `pixRenderCartaoConfig` que roda hoje, em `#view-config .grid`)
  // Grava como registro do núcleo (lista `config`), então sobe para a nuvem.
  // ═══════════════════════════════════════════════════════════════════════════
  function cartaoConfigHtml(cfg) {
    var c = cfg || {};
    var chave = texto(c.chave);
    return '<div class="px-cfg" id="pix-cfg-card">' +
      '<h4 class="px-cfg-titulo">💠 Pix — QR Code de cobrança</h4>' +
      '<p class="px-cfg-sub">Aparece no faturamento e na notinha quando a forma é <b>Pix</b>. ' +
        'O código já sai com o <b>valor exato</b> da venda.</p>' +
      '<label class="vnd-campo"><span>Chave Pix</span>' +
        '<input id="cfg-pix-chave" data-cfg-pix-chave value="' + escaparHtml(chave) + '" ' +
        'placeholder="CNPJ, CPF, +55DDDtelefone, e-mail ou aleatória"></label>' +
      '<p class="px-cfg-tipo" data-cfg-pix-tipo>Tipo detectado: ' + escaparHtml(PIX_PURE.tipoChave(chave)) + '</p>' +
      '<div class="px-cfg-linha">' +
        '<label class="vnd-campo"><span>Beneficiário (máx 25)</span>' +
          '<input id="cfg-pix-nome" data-cfg-pix-nome maxlength="25" value="' + escaparHtml(c.nome) + '" placeholder="Ex.: DIGICOPY"></label>' +
        '<label class="vnd-campo"><span>Cidade (máx 15)</span>' +
          '<input id="cfg-pix-cidade" data-cfg-pix-cidade maxlength="15" value="' + escaparHtml(c.cidade) + '" placeholder="Ex.: JANAUBA"></label>' +
      '</div>' +
      '<div class="px-cfg-botoes">' +
        '<button type="button" class="vnd-btn vnd-btn-forte" data-cfg-pix-salvar>Salvar Pix</button>' +
        '<button type="button" class="vnd-btn" data-cfg-pix-testar>Testar QR</button>' +
      '</div>' +
      '<div class="px-cfg-preview" data-cfg-pix-preview hidden></div>' +
      '<p class="px-cfg-nota">A imagem do QR é gerada pela internet a partir do próprio código Pix; ' +
        'sem internet, o código "copia e cola" continua valendo normalmente.</p>' +
    '</div>';
  }
  // Monta o cartão numa caixa e liga os botões. Devolve { elemento, desenhar }.
  function montarConfig(opcoes) {
    var o = opcoes || {};
    var nucleo = o.nucleo;
    var alvo = o.elemento;
    if (!nucleo) throw new Error('pix: informe o núcleo');
    if (!alvo || !alvo.ownerDocument) throw new Error('pix: informe onde desenhar a configuração');
    var doc = alvo.ownerDocument;
    var avisar = typeof o.aoAvisar === 'function' ? o.aoAvisar : function () { };
    // desenhar e LIGAR os botões andam juntos: quem redesenha tem de religar (senão os
    // botões ficam mortos depois de sair e voltar para a tela)
    function montar() {
      alvo.innerHTML = cartaoConfigHtml(lerConfig(nucleo));
      var chave = alvo.querySelector('[data-cfg-pix-chave]');
      var tipo = alvo.querySelector('[data-cfg-pix-tipo]');
      if (chave && tipo) {
        chave.addEventListener('input', function () {
          tipo.textContent = 'Tipo detectado: ' + PIX_PURE.tipoChave(chave.value);
        });
      }
      var botaoSalvar = alvo.querySelector('[data-cfg-pix-salvar]');
      if (botaoSalvar) botaoSalvar.addEventListener('click', function () {
        var ok = gravarConfig(nucleo, {
          chave: chave ? chave.value : '',
          nome: (alvo.querySelector('[data-cfg-pix-nome]') || {}).value,
          cidade: (alvo.querySelector('[data-cfg-pix-cidade]') || {}).value
        });
        avisar(ok ? 'Chave Pix salva. Ela já vale para as próximas vendas em Pix.' :
          'Não deu para salvar a chave Pix.', ok);
      });
      var botaoTestar = alvo.querySelector('[data-cfg-pix-testar]');
      if (botaoTestar) botaoTestar.addEventListener('click', function () {
        var caixa = alvo.querySelector('[data-cfg-pix-preview]');
        if (!caixa) return;
        var cfgAtual = {
          chave: chave ? chave.value : '',
          nome: (alvo.querySelector('[data-cfg-pix-nome]') || {}).value,
          cidade: (alvo.querySelector('[data-cfg-pix-cidade]') || {}).value
        };
        if (!texto(cfgAtual.chave).trim()) {
          caixa.hidden = false;
          caixa.innerHTML = '<p class="px-aviso">Informe a chave para testar o QR.</p>';
          return;
        }
        // o teste usa um valor de exemplo — nada é gravado e nada é cobrado
        var payload = PIX_PURE.montar({ chave: cfgAtual.chave, nome: cfgAtual.nome, cidade: cfgAtual.cidade, valor: 1, txid: 'TESTE' });
        caixa.hidden = false;
        caixa.innerHTML = '<div class="px-qr"><img src="' + PIX_PURE.qrUrl(payload, 200) + '" alt="QR de teste" width="120" height="120"></div>' +
          '<p class="px-cfg-nota">Teste com R$ 1,00 e txid TESTE — é só para ver o QR. Nada foi gravado.</p>' +
          '<input class="px-cfg-codigo" readonly value="' + escaparHtml(payload) + '">';
      });
    }
    montar();
    return { elemento: alvo, desenhar: montar };
  }

  var regras = {
    PIX_PURE: PIX_PURE,
    PIX_PUBLICO: PIX_PUBLICO,
    LISTA_CONFIG: LISTA_CONFIG, SCHEMA_CONFIG: SCHEMA_CONFIG,
    ID_CONFIG_PIX: ID_CONFIG_PIX,
    urlPagamento: urlPagamento,
    lerConfig: lerConfig,
    gravarConfig: gravarConfig,
    pronto: pronto,
    txidDaVenda: txidDaVenda,
    payloadDaVenda: payloadDaVenda,
    textoComprovante: textoComprovante,
    comprovanteManual: comprovanteManual,
    blocoNotinha: blocoNotinha,
    painelHtml: painelHtml, cartaoConfigHtml: cartaoConfigHtml, montarConfig: montarConfig,
    tipoChave: PIX_PURE.tipoChave
  };

  raiz.DIGICOPY_PIX = { VERSAO_PIX: VERSAO, regras: regras, PIX_PURE: PIX_PURE,
    montarConfig: montarConfig, cartaoConfigHtml: cartaoConfigHtml, copiarPayload: copiarPayload };
})(typeof window !== 'undefined' ? window : globalThis);
