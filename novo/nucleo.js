/* ═══════════════════════════════════════════════════════════════════════════
 * DIGICOPY — NÚCLEO (v1.0.0) — o coração do sistema novo
 *
 * O que é: dados + regras. NÃO tem tela, NÃO fala com a nuvem, NÃO guarda senha.
 * As telas novas usam este arquivo; a nuvem nova (fase 2) fala com ele por
 * `mudancas()` / `confirmarEnvio()` / `aplicarDaNuvem()`.
 *
 * POR QUE ELE EXISTE (a causa dos problemas das rodadas 12 a 16):
 *   - a mesma regra estava escrita em vários lugares (a exclusão, em 82 pontos);
 *   - apagar era `splice` da lista: o registro "sumia" e a sincronização não tinha
 *     como saber se sumiu por exclusão, por falha ou por outro computador — foi daí
 *     que saíram o "apaguei e voltou" e a "recuperação" que ressuscitava coisa;
 *   - a mesma lista era varrida inteira para achar um registro (lentidão).
 *
 * AS 5 REGRAS DO CORAÇÃO (cada uma mora AQUI, em um lugar só):
 *   1. APAGAR É MARCAR. O registro nunca sai da lista: ganha `apagadoEm`,
 *      `apagadoPor` e `motivo` (lápide). Quem some da vista é a lápide, não o dado.
 *   2. QUEM DECIDE CONFLITO É UMA FUNÇÃO (`#decisao`), não cada tela.
 *      Versão maior vence; empate decide por lápide, depois por data, depois por
 *      origem. Determinístico: dois computadores chegam sempre ao mesmo resultado.
 *   3. NADA VOLTA SOZINHO. Registro apagado aqui só volta por `restaurar()`
 *      (ação explícita de alguém) — a não ser que a nuvem traga uma EDIÇÃO mais
 *      nova que a lápide (regra da rodada 15: quem editou depois manda).
 *   4. TODA GRAVAÇÃO VIRA UMA MUDANÇA na fila (`outbox`), na ordem em que
 *      aconteceu. A nuvem manda essa fila; nada se perde e nada se duplica.
 *   5. ACHAR UM REGISTRO É PELO ÍNDICE (Map id → item), nunca varrendo a lista.
 *   6. NÚMERO DE SÉRIE NUNCA VOLTA: quem numera (venda, OS, código de cliente) pede
 *      aqui (`proximoNumero`) e o contador fica guardado — apagar não devolve número.
 *   7. IMPORTAÇÃO NÃO RECUSA (`salvar(..., {importando:true})`): dado que vem da base
 *      antiga entra sempre; o que ficou fora do schema volta em `avisos`.
 *
 * NÃO FAZ: `alert`, `confirm`, `prompt`, `localStorage`, `fetch`, senha, token.
 * Quem quiser guardar/puxar pluga por fora (`guardar`, e o cliente da nuvem).
 * ═══════════════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var VERSAO_NUCLEO = '1.0.0';

  // Tipos aceitos no schema de cada lista (o que a tela declara sobre os campos).
  var TIPOS = {
    texto:  function (v) { return v == null || typeof v === 'string'; },
    numero: function (v) { return v == null || (typeof v === 'number' && isFinite(v)); },
    lista:  function (v) { return v == null || Array.isArray(v); },
    objeto: function (v) { return v == null || (typeof v === 'object' && !Array.isArray(v)); },
    boleano: function (v) { return v == null || typeof v === 'boolean'; }
  };

  function texto(v) { return v == null ? '' : String(v); }
  function inteiro(v) { var n = Number(v); return isFinite(n) ? Math.floor(n) : 0; }

  // A REGRA DO CONFLITO — existe UMA vez, aqui.
  // Devolve 'remoto' quando a mudança da nuvem deve ser aplicada, 'local' quando
  // o que está aqui deve ser mantido. Nunca devolve "apaga e não deixa rastro".
  function decisao(local, remoto) {
    if (!local) return 'remoto';
    if (!remoto) return 'local';
    var lApag = inteiro(local.apagadoEm), rApag = inteiro(remoto.apagadoEm);
    var lVer = inteiro(local.versao), rVer = inteiro(remoto.versao);

    // Um lado apagou e o outro não:
    if (lApag && !rApag) {
      // apagado aqui; a nuvem tem uma edição MAIS NOVA que a lápide? então ela manda
      return rVer > lVer ? 'remoto' : 'local';
    }
    if (rApag && !lApag) {
      // apagado na nuvem; editei aqui DEPOIS? então a minha edição manda
      return lVer > rVer ? 'local' : 'remoto';
    }
    // os dois apagados ou os dois vivos: versão maior vence
    if (rVer !== lVer) return rVer > lVer ? 'remoto' : 'local';
    // empate de versão: lápide mais nova vence numa exclusão mais recente
    if (rApag !== lApag) return rApag > lApag ? 'remoto' : 'local';
    // depois a data, e por fim a origem (para os dois computadores decidirem igual)
    var lAt = inteiro(local.atualizadoEm), rAt = inteiro(remoto.atualizadoEm);
    if (rAt !== lAt) return rAt > lAt ? 'remoto' : 'local';
    return texto(remoto.origem) > texto(local.origem) ? 'remoto' : 'local';
  }

  function criar(opcoes) {
    var op = opcoes || {};
    var empresaId = texto(op.empresaId);
    var origem = texto(op.origem) || 'pc';
    var agora = typeof op.relogio === 'function' ? op.relogio : function () { return Date.now(); };
    var avisar = typeof op.avisar === 'function' ? op.avisar : function () {};
    var guardar = typeof op.guardar === 'function' ? op.guardar : function () { };

    var listas = Object.create(null);   // nome -> { nome, schema, itens, indice }
    var outbox = [];                    // mudanças ainda não confirmadas na nuvem
    var seq = 0;

    function exigirLista(nome) {
      var l = listas[nome];
      if (!l) throw new Error('lista desconhecida: ' + nome + ' (registre com registrarLista antes de usar)');
      return l;
    }

    // ── registro das listas (o schema é a única descrição de cada tipo de dado) ──
    function registrarLista(nome, schema) {
      var n = texto(nome);
      if (!n) throw new Error('registrarLista: informe o nome da lista');
      if (listas[n]) return listas[n];
      listas[n] = {
        nome: n,
        schema: schema && typeof schema === 'object' ? schema : {},
        itens: [],
        indice: new Map()
      };
      return listas[n];
    }

    // ── validação: só os campos declarados no schema; campo extra é PRESERVADO ──
    function validar(nome, dados) {
      var l = exigirLista(nome);
      var erros = [];
      var d = dados || {};
      Object.keys(l.schema).forEach(function (campo) {
        var regra = l.schema[campo] || {};
        var v = d[campo];
        if (regra.obrigatorio && (v === undefined || v === null || texto(v).trim() === '')) {
          erros.push('campo obrigatório: ' + campo);
          return;
        }
        var tipo = regra.tipo && TIPOS[regra.tipo];
        if (tipo && !tipo(v)) erros.push('campo ' + campo + ' devia ser ' + regra.tipo);
      });
      return erros;
    }

    // ── IMPORTAÇÃO DA BASE ANTIGA (a ponte) ──────────────────────────────────
    // As telas de hoje gravam do jeito delas. Esse dado é do DONO: não pode ser
    // recusado por causa de tipo ou de campo obrigatório — se for, ele desaparece na
    // virada da chave e ninguém fica sabendo. Então:
    //   • o que dá para casar com o schema, casa (ex.: "80,00" → 80);
    //   • o que não dá, entra COMO VEIO e volta em `avisos` para quem importou
    //     reportar. Recusar, nunca.
    // Exemplo real da base de hoje: `parcela: '1/1'` (texto) numa conta a pagar
    // criada pelo `automacoes_caixa_chat_auxiliares_patch.js`.
    // Lê número de texto SEM INVENTAR: só aceita o que é número de verdade escrito
    // em brasileiro ('80', '80,00', '1.234,56') ou no formato simples ('80.00').
    // '1/1', 'R$ 80' e 'abc' NÃO viram número — quem chama guarda como veio e avisa.
    function numeroDoTexto(v) {
      var t = texto(v).trim();
      if (!t) return null;
      if (/^-?\d+$/.test(t)) return Number(t);                                // 80
      if (/^-?\d+,\d+$/.test(t)) return Number(t.replace(',', '.'));          // 80,00
      if (/^-?\d+\.\d+$/.test(t)) return Number(t);                          // 80.00
      if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) return Number(t.replace(/\./g, '').replace(',', '.')); // 1.234,56
      return null;
    }
    function coagirAoTipo(nome, item) {
      var l = exigirLista(nome);
      Object.keys(l.schema || {}).forEach(function (campo) {
        var t = (l.schema[campo] || {}).tipo;
        var v = item[campo];
        if (t === 'numero' && typeof v === 'string') {
          var num = numeroDoTexto(v);
          if (num !== null) item[campo] = num;
        }
        if (t === 'texto' && typeof v === 'number') item[campo] = String(v);
      });
      return item;
    }

    function proximoId(nome) {
      var l = exigirLista(nome);
      var base = nome.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toLowerCase() || 'reg';
      var id;
      do {
        id = base + '_' + (++seq).toString(36) + Math.random().toString(36).slice(2, 6);
      } while (l.indice.has(id));
      return id;
    }

    // ── O NÚMERO DE SÉRIE (é o `seqObter` do sistema de hoje) ────────────────
    // Regra do dono, escrita no código de hoje: "excluir um registro NUNCA devolve
    // o número dele". O contador mora na lista interna `series` (é o `db.config.seq`
    // de hoje) e anda sempre para a frente: vale o MAIOR entre o contador guardado e
    // o maior número já usado na lista — se o contador se perder (restauração, base
    // importada), o maior número existente puxa ele de volta.
    var LISTA_SERIES = 'series';
    var SCHEMA_SERIES = { serie: { obrigatorio: true, tipo: 'texto' }, seq: { tipo: 'numero' } };

    // Igual ao `vosNumeroInt` de hoje: o ÚLTIMO grupo de dígitos do número.
    function numeroInteiro(v) {
      var m = texto(v).match(/(\d+)(?!.*\d)/);
      return m ? parseInt(m[1], 10) : 0;
    }
    function contadorDaSerie(nomeSerie) {
      registrarLista(LISTA_SERIES, SCHEMA_SERIES);
      var atual = itemPorId(listas[LISTA_SERIES], texto(nomeSerie));
      return atual ? inteiro(atual.seq) : 0;
    }
    // Só LÊ (não gasta número): devolve o próximo e o contador que ele deixaria.
    function proximoNumeroDaSerie(nomeSerie, itens, extrator) {
      var maior = 0;
      (itens || []).forEach(function (it) {
        var n = numeroInteiro(extrator ? extrator(it) : it);
        if (n > maior) maior = n;
      });
      var base = Math.max(contadorDaSerie(nomeSerie), maior);
      return { numero: String(base + 1), seq: base + 1 };
    }
    // O mesmo, mas GRAVANDO o contador (vira uma mudança na fila, como qualquer gravação).
    function proximoNumero(nomeSerie, itens, extrator) {
      var p = proximoNumeroDaSerie(nomeSerie, itens, extrator);
      var r = salvar(LISTA_SERIES, { id: texto(nomeSerie), serie: texto(nomeSerie), seq: p.seq });
      if (!r || !r.ok) return null;
      return p.numero;
    }

    function anotarMudanca(item) {
      outbox.push({
        seq: outbox.length + 1,
        lista: item.lista,
        id: item.id,
        versao: item.versao,
        apagadoEm: inteiro(item.apagadoEm),
        atualizadoEm: inteiro(item.atualizadoEm),
        origem: item.origem,
        dados: JSON.parse(JSON.stringify(item))
      });
    }

    // O índice guarda a POSIÇÃO na lista (número). Atenção: a posição 0 é
    // válida — toda leitura tem de comparar com `undefined`, nunca com
    // "verdadeiro/falso" (foi exatamente o defeito que o teste pegou).
    function itemPorId(l, id) {
      var pos = l.indice.get(texto(id));
      return pos === undefined ? null : (l.itens[pos] || null);
    }

    function posicionarNoIndice(l, item) {
      var pos = l.indice.get(item.id);
      if (pos === undefined) { l.itens.push(item); l.indice.set(item.id, l.itens.length - 1); }
      else { l.itens[pos] = item; }
    }

    // ── GRAVAR (criar ou editar) — o caminho único ──
    function salvar(nome, dados, opcoes) {
      var l = exigirLista(nome);
      var op2 = opcoes || {};
      var d = Object.assign({}, dados || {});

      // atenção: a posição 0 do índice é um número VÁLIDO — comparar com
      // `undefined`, nunca com "verdadeiro/falso" (era o defeito antes do teste)
      var existente = d.id ? itemPorId(l, d.id) : null;
      // REGRA 3 (nada volta sozinho): editar um registro APAGADO é recusado com
      // motivo. Quem quiser mexer nele primeiro restaura (ação explícita) — assim
      // nenhuma tela consegue "ressuscitar" um cadastro sem alguém mandar.
      if (existente && inteiro(existente.apagadoEm)) {
        return { ok: false, erros: ['este registro está apagado — restaure antes de editar'], apagado: true };
      }
      // A validação olha o registro COMPLETO (o que já estava + o que chegou),
      // para editar um campo só não ser acusado de "faltou o nome".
      var item = Object.assign({}, existente || {}, d);
      var avisos = [];
      if (op2.importando) coagirAoTipo(nome, item);
      var erros = validar(nome, item);
      if (erros.length) {
        if (!op2.importando) return { ok: false, erros: erros };
        // importação da base antiga: entra assim mesmo; quem importou recebe o aviso
        avisos = erros.slice();
      }
      var agoraMs = agora();
      item.lista = nome;
      item.id = texto(item.id) || proximoId(nome);
      item.versao = (existente ? inteiro(existente.versao) : 0) + 1;
      item.atualizadoEm = agoraMs;
      item.origem = origem;
      item.empresaId = empresaId;
      if (!existente) { item.criadoEm = agoraMs; item.apagadoEm = 0; item.apagadoPor = ''; item.motivo = ''; }

      posicionarNoIndice(l, item);
      // IMPORTAR BASE EXISTENTE (op2.semFila): o coração passa a conhecer o
      // registro, mas isso NÃO é novidade para a nuvem — é o que já está lá.
      if (!op2.semFila) {
        anotarMudanca(item);
        avisar(existente ? 'editou' : 'criou', { lista: nome, id: item.id, versao: item.versao });
      }
      guardar();
      return { ok: true, item: item, avisos: avisos };
    }

    // ── APAGAR = MARCAR (lápide). Nunca sai da lista; nunca `splice`. ──
    function apagar(nome, id, motivo) {
      var l = exigirLista(nome);
      var item = itemPorId(l, id);
      if (!item) return { ok: false, erros: ['registro não encontrado'] };
      if (inteiro(item.apagadoEm)) return { ok: true, item: item, jaEstava: true };
      item.apagadoEm = agora();
      item.apagadoPor = origem;
      item.motivo = texto(motivo) || 'excluído pela tela';
      item.versao = inteiro(item.versao) + 1;
      item.atualizadoEm = item.apagadoEm;
      item.origem = origem;
      anotarMudanca(item);
      avisar('apagou', { lista: nome, id: item.id, versao: item.versao, motivo: item.motivo });
      guardar();
      return { ok: true, item: item };
    }

    // ── VOLTAR ATRÁS É AÇÃO EXPLÍCITA (nunca automática) ──
    function restaurar(nome, id) {
      var l = exigirLista(nome);
      var item = itemPorId(l, id);
      if (!item) return { ok: false, erros: ['registro não encontrado'] };
      if (!inteiro(item.apagadoEm)) return { ok: true, item: item, jaEstava: true };
      item.apagadoEm = 0;
      item.apagadoPor = '';
      item.motivo = '';
      item.versao = inteiro(item.versao) + 1;
      item.atualizadoEm = agora();
      item.origem = origem;
      anotarMudanca(item);
      avisar('restaurou', { lista: nome, id: item.id, versao: item.versao });
      guardar();
      return { ok: true, item: item };
    }

    function obter(nome, id) {
      return itemPorId(exigirLista(nome), id);
    }

    function listar(nome, opcoes) {
      var l = exigirLista(nome);
      var o = opcoes || {};
      var saida = [];
      for (var i = 0; i < l.itens.length; i++) {
        var it = l.itens[i];
        if (!it) continue;
        var apagado = !!inteiro(it.apagadoEm);
        if (o.somenteApagados) { if (!apagado) continue; }          // só a lixeira
        else if (apagado && !o.incluirApagados) continue;           // fora os apagados
        saida.push(it);
      }
      if (o.ordenarPor) {
        var campo = o.ordenarPor;
        saida.sort(function (a, b) {
          var x = a[campo], y = b[campo];
          if (typeof x === 'number' || typeof y === 'number') return Number(x || 0) - Number(y || 0);
          return texto(x).localeCompare(texto(y), 'pt-BR');
        });
      }
      return saida;
    }

    function contar(nome, opcoes) { return listar(nome, opcoes).length; }

    // ── A NUVEM (fase 2 usa isto; o núcleo não conhece fetch) ──
    // Aplica o que chegou de outro computador pela MESMA regra de conflito.
    // Nunca remove nada: se não vence, é ignorado (e o motivo volta para quem chamou).
    function aplicarDaNuvem(mudanca) {
      var m = mudanca || {};
      var nome = texto(m.lista);
      var l = listas[nome];
      if (!l) return { aplicado: false, motivo: 'lista desconhecida' };
      var remoto = Object.assign({}, m.dados || {});
      remoto.id = texto(m.id || remoto.id);
      remoto.lista = nome;
      remoto.versao = inteiro(m.versao !== undefined ? m.versao : remoto.versao);
      remoto.apagadoEm = inteiro(m.apagadoEm !== undefined ? m.apagadoEm : remoto.apagadoEm);
      remoto.atualizadoEm = inteiro(m.atualizadoEm !== undefined ? m.atualizadoEm : remoto.atualizadoEm);
      remoto.origem = texto(m.origem || remoto.origem);
      if (!remoto.id) return { aplicado: false, motivo: 'mudança sem id' };

      var local = itemPorId(l, remoto.id);
      var quem = decisao(local, remoto);
      if (quem === 'local' && local) {
        return { aplicado: false, motivo: 'a versão daqui venceu', item: local };
      }
      var pos = l.indice.get(remoto.id);
      if (pos === undefined) { l.itens.push(remoto); l.indice.set(remoto.id, l.itens.length - 1); }
      else { l.itens[pos] = remoto; }
      avisar('chegouDaNuvem', { lista: nome, id: remoto.id, versao: remoto.versao });
      return { aplicado: true, item: remoto };
    }

    function mudancas() { return outbox.slice(); }

    function confirmarEnvio(ateSeq) {
      var limite = inteiro(ateSeq);
      var antes = outbox.length;
      if (!limite) { outbox = []; } else { outbox = outbox.filter(function (m) { return m.seq > limite; }); }
      return { confirmadas: antes - outbox.length, restantes: outbox.length };
    }

    function resumo() {
      var r = { empresaId: empresaId, origem: origem, listas: {}, mudancasPendentes: outbox.length, versao: VERSAO_NUCLEO };
      Object.keys(listas).forEach(function (nome) {
        var l = listas[nome];
        var vivos = 0, apagados = 0;
        for (var i = 0; i < l.itens.length; i++) {
          if (!l.itens[i]) continue;
          if (inteiro(l.itens[i].apagadoEm)) apagados++; else vivos++;
        }
        r.listas[nome] = { vivos: vivos, apagados: apagados };
      });
      return r;
    }

    // ── guardar/abrir (a mesma forma na tela e no arquivo; lápide e versão preservadas) ──
    function paraJSON() {
      var saida = { versaoNucleo: VERSAO_NUCLEO, empresaId: empresaId, listas: {} };
      Object.keys(listas).forEach(function (nome) {
        saida.listas[nome] = { schema: listas[nome].schema, itens: listas[nome].itens.filter(Boolean) };
      });
      return saida;
    }

    function carregarDeJSON(obj) {
      var o = obj || {};
      var l = o.listas || {};
      Object.keys(l).forEach(function (nome) {
        registrarLista(nome, l[nome].schema || {});
        var alvo = listas[nome];
        alvo.itens = []; alvo.indice = new Map();
        (l[nome].itens || []).forEach(function (item) {
          if (!item || !item.id) return;
          item.lista = nome;
          alvo.itens.push(item);
          alvo.indice.set(item.id, alvo.itens.length - 1);
          var maior = inteiro(item.versao);
          if (maior > seq) seq = maior;
        });
      });
      return resumo();
    }

    return {
      versao: VERSAO_NUCLEO,
      registrarLista: registrarLista,
      validar: validar,
      salvar: salvar,
      apagar: apagar,
      restaurar: restaurar,
      obter: obter,
      listar: listar,
      contar: contar,
      aplicarDaNuvem: aplicarDaNuvem,
      mudancas: mudancas,
      confirmarEnvio: confirmarEnvio,
      resumo: resumo,
      paraJSON: paraJSON,
      carregarDeJSON: carregarDeJSON,
      proximoId: proximoId,
      numeroInteiro: numeroInteiro,
      contadorDaSerie: contadorDaSerie,
      proximoNumeroDaSerie: proximoNumeroDaSerie,
      proximoNumero: proximoNumero,
      LISTA_SERIES: LISTA_SERIES,
      SCHEMA_SERIES: SCHEMA_SERIES,
      numeroDoTexto: numeroDoTexto
    };
  }

  var api = { VERSAO_NUCLEO: VERSAO_NUCLEO, TIPOS: TIPOS, decisao: decisao, criar: criar };
  raiz.DIGICOPY_NUCLEO = api;
})(typeof window !== 'undefined' ? window : globalThis);
