/* ═══════════════════════════════════════════════════════════════════════════
 * DIGICOPY — PONTE ENTRE AS TELAS DE HOJE E O CORAÇÃO NOVO (v1.0.0)
 *
 * O PEDIDO DO DONO (24/09/2026): *"recriar praticamente O MESMO sistema, só que
 * com núcleo diferente... acostumamos com o mesmo Index, as mesmas funções, tudo,
 * mas aí você muda o que precisa mudar completamente"*.
 *
 * COMO ESTA PONTE FAZ ISSO SEM TOCAR EM NENHUMA TELA:
 *   - as telas de hoje continuam mexendo nas listas do jeito delas
 *     (`db.clientes.push(...)`, `db.clientes = db.clientes.filter(...)`) e
 *     continuam chamando `saveDB()` — nada muda para elas;
 *   - a ponte observa o MOMENTO DA GRAVAÇÃO (`saveDB`) e conta para o coração o
 *     que mudou: quem é novo, quem foi editado e — o ponto que dava problema —
 *     **quem foi retirado, virando lápide** (com quem/quando/por quê), em vez de
 *     "sumiço" que ninguém sabia explicar depois;
 *   - o coração novo fica com a história (versão, origem, lápide, fila para a
 *     nuvem). As telas continuam vendo as mesmas listas de sempre.
 *
 * POR QUE ASSIM: é o único jeito de trocar o coração **sem parar a loja** e sem
 * reescrever 482 arquivos de uma vez. A cada lista que for migrada para a tela
 * nova, esta ponte fica menor — até sobrar só o coração.
 *
 * TRAVAS (para não repetir os defeitos das rodadas 12 a 16):
 *   1. MODO OBSERVAÇÃO: ligada assim, ela só RELATA o que faria — não grava
 *      lápide, não mexe na fila. Serve para conferir contra a base de verdade
 *      antes de valer.
 *   2. EXCLUSÃO EM MASSA PEDE CONFIRMAÇÃO: se um commit retirar muita coisa de
 *      uma lista de uma vez (mais de 20 registros ou mais da metade), isso não é
 *      lápide automática — é chamado o aviso (`aoPrecisarConfirmar`) e nada é
 *      marcado até alguém confirmar. Exclusão em massa é operação destrutiva
 *      (regra 27) e não pode acontecer por acidente de tela/importação.
 *   3. DUAS VEZES O MESMO NÃO VIRA DOIS: a comparação é por id; reimportar a
 *      mesma base não cria registro novo nem lápide.
 *   3-B. DADO ANTIGO NUNCA É RECUSADO: a importação manda `{importando:true}` para o
 *      coração, que casa os tipos quando dá ("80,00" → 80) e, quando não dá, guarda
 *      como veio e avisa — o aviso aparece no relatório (`camposForaDoPadrao`).
 *   4. O FORMATO DAS LISTAS NÃO MUDA: `db.clientes` continua uma lista normal de
 *      objetos com `id` — nenhuma tela precisa de adaptação.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var NUC = raiz.DIGICOPY_NUCLEO;

  // Campos que o CORAÇÃO cuida sozinho. Fora da assinatura de comparação, senão
  // toda gravação pareceria "mudança" só porque a data mudou.
  var CAMPOS_DO_CORACAO = ['lista', 'versao', 'atualizadoEm', 'origem', 'empresaId', 'criadoEm', 'apagadoEm', 'apagadoPor', 'motivo'];

  var LIMITE_MASSA_QTD = 20;      // acima disso, uma remoção num commit já é "muita coisa"
  var LIMITE_MASSA_FRACAO = 0.5;  // ou mais da metade da lista

  // Impressão digital RÁPIDA do registro (para detectar o que mudou sem custo).
  // Medido numa base de 76.550 registros: comparar o conteúdo inteiro com
  // JSON.stringify custava ~220 ms POR GRAVAÇÃO — era lentidão garantida no PC
  // fraco. Esta versão mistura campo+valor num número (sem montar texto grande),
  // é insensível à ORDEM dos campos (soma as partes) e cabe num inteiro.
  var IGNORAR = {};
  CAMPOS_DO_CORACAO.forEach(function (k) { IGNORAR[k] = 1; });

  function assinatura(item) {
    if (!item || typeof item !== 'object') return 0;
    var total = 0, campos = 0;
    for (var k in item) {
      if (IGNORAR[k]) continue;
      var v = item[k];
      var h = 0x811c9dc5;
      for (var i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 0x01000193); }
      h ^= 0; h = Math.imul(h, 0x01000193);            // separador nome|valor
      var s;
      if (v === null || v === undefined) s = '\u0000';
      else if (typeof v === 'string') s = v;
      else if (typeof v === 'number' || typeof v === 'boolean') s = '' + v;
      else { try { s = JSON.stringify(v); } catch (e) { s = '@'; } }   // objeto/lista: aqui é exato
      for (var j = 0; j < s.length; j++) { h ^= s.charCodeAt(j); h = Math.imul(h, 0x01000193); }
      total = (total + h) >>> 0;                        // soma: ordem dos campos não importa
      campos++;
    }
    return (total ^ (campos * 0x9e3779b9)) >>> 0;
  }

  function eListaDeRegistros(valor) {
    if (!Array.isArray(valor)) return false;
    if (!valor.length) return true;              // lista vazia: é lista
    return valor.some(function (x) { return x && typeof x === 'object' && !Array.isArray(x) && x.id !== undefined; });
  }

  function ligar(opcoes) {
    var o = opcoes || {};
    var banco = o.db;                             // o `db` global do sistema de hoje
    var nucleo = o.nucleo;                        // o coração novo
    if (!banco) throw new Error('ponte: informe o db do sistema');
    if (!nucleo) throw new Error('ponte: informe o núcleo');

    var modo = o.modo === 'observacao' ? 'observacao' : 'ligado';
    var origem = o.origem || 'pc';
    var avisarMassa = typeof o.aoPrecisarConfirmar === 'function' ? o.aoPrecisarConfirmar : function () { };
    var guardarExterno = typeof o.aoMudar === 'function' ? o.aoMudar : function () { };
    var listasFixas = Array.isArray(o.listas) && o.listas.length ? o.listas.slice() : null;

    var ficha = {};        // lista -> { vivo: {id: assinatura}, apagados: {id:true} }
    var pendentes = {};    // lista -> [ids] aguardando confirmação de exclusão em massa
    // `camposForaDoPadrao` = entrou, mas com campo fora do schema (o valor veio como estava).
    // `recusadosImpossiveis` = o coração recusou (não deve acontecer: importação não recusa).
    var relatorio = { listas: 0, novos: 0, editados: 0, apagados: 0, emObservacao: 0, massasSuspeitas: 0,
      camposForaDoPadrao: 0, recusadosImpossiveis: 0 };

    // O coração só trabalha com listas registradas. A ponte descobre as listas
    // sozinha (é ela que lê o `db` das telas de hoje) e registra cada uma — com o
    // schema declarado, quando quem chamou passou um (`schemas`).
    var schemas = (o.schemas && typeof o.schemas === 'object') ? o.schemas : {};
    function garantirListaNoCoracao(nome) {
      try { nucleo.registrarLista(nome, schemas[nome] || {}); } catch (e) { /* já registrada */ }
    }

    function listas() {
      if (listasFixas) return listasFixas;
      return Object.keys(banco).filter(function (k) { return eListaDeRegistros(banco[k]); });
    }

    function garantirFicha(nome) {
      garantirListaNoCoracao(nome);
      if (!ficha[nome]) ficha[nome] = { vivo: {}, apagados: {} };
      return ficha[nome];
    }

    // O coração conhece os itens que ESTA PONTE já viu. Itens apagados ficam na
    // ficha como apagados, para uma lista que "reaparece" com o mesmo id não ser
    // tratada como nova (e não ressuscitar).
    function importar(nome, itens, semFila) {
      var f = garantirFicha(nome);
      // O que vem por aqui é dado das TELAS DE HOJE → `importando: true` (o coração
      // nunca recusa: guarda como veio e devolve o aviso, que é contado no relatório).
      var opImportar = { importando: true };
      if (semFila) opImportar.semFila = true;
      var vistos = {};
      var novos = 0, editados = 0, iguais = 0, foraPadrao = 0, recusados = 0;
      (itens || []).forEach(function (item) {
        if (!item || typeof item !== 'object' || item.id === undefined || item.id === '') return;
        var id = String(item.id);
        vistos[id] = true;
        var assin = assinatura(item);
        if (f.apagados[id]) { iguais++; return; }          // apagado aqui: não volta sozinho
        if (f.vivo[id] === undefined) {
          f.vivo[id] = assin;
          var r = (modo === 'ligado') ? nucleo.salvar(nome, item, opImportar) : null;
          if (modo !== 'ligado' || (r && r.ok)) { novos++; if (r && r.avisos && r.avisos.length) foraPadrao++; }
          else recusados++;
          return;
        }
        if (f.vivo[id] !== assin) {
          f.vivo[id] = assin;
          var re = (modo === 'ligado') ? nucleo.salvar(nome, item, opImportar) : null;
          if (modo !== 'ligado' || (re && re.ok)) { editados++; if (re && re.avisos && re.avisos.length) foraPadrao++; }
          else recusados++;
          return;
        }
        iguais++;
      });

      // Quem estava vivo na ficha e não veio no commit = foi RETIRADO pela tela.
      var retirados = Object.keys(f.vivo).filter(function (id) { return !vistos[id]; });

      // Trava 2: retirada em massa não é lápide automática.
      var vivosAntes = Object.keys(f.vivo).length;
      var suspeito = retirados.length > LIMITE_MASSA_QTD ||
        (vivosAntes > 1 && retirados.length / vivosAntes > LIMITE_MASSA_FRACAO && retirados.length > 3);
      if (suspeito && retirados.length) {
        pendentes[nome] = retirados.slice();
        relatorio.massasSuspeitas++;
        avisarMassa(nome, retirados.slice());
        return { novos: novos, editados: editados, iguais: iguais, apagados: 0, retinhaMassa: retirados,
          camposForaDoPadrao: foraPadrao, recusadosImpossiveis: recusados };
      }

      var apagados = 0;
      retirados.forEach(function (id) {
        delete f.vivo[id];
        f.apagados[id] = true;
        if (modo === 'ligado') nucleo.apagar(nome, id, 'removido na tela (registrado pela ponte)');
        apagados++;
      });
      return { novos: novos, editados: editados, iguais: iguais, apagados: apagados,
        camposForaDoPadrao: foraPadrao, recusadosImpossiveis: recusados };
    }

    // ── O MOMENTO DA GRAVAÇÃO (é o `saveDB` das telas que chama isto) ──
    function sincronizar() {
      var resultado = { listas: 0, acoes: {} };
      var nomes = listas();
      resultado.listas = nomes.length;
      nomes.forEach(function (nome) {
        var r = importar(nome, banco[nome]);
        resultado.acoes[nome] = r;
        relatorio.novos += r.novos; relatorio.editados += r.editados; relatorio.apagados += r.apagados;
        relatorio.emObservacao += r.emObservacao || 0;
        relatorio.camposForaDoPadrao += r.camposForaDoPadrao || 0;
        relatorio.recusadosImpossiveis += r.recusadosImpossiveis || 0;
      });
      if (modo === 'ligado' && nucleo.mudancas().length) guardarExterno();
      return resultado;
    }

    // Descobre as listas na primeira vez (sem marcar nada como retirado: é só leitura).
    function primeiraVarredura() {
      // primeira varredura: conhece a base SEM sujar a fila da nuvem e SEM poder
      // marcar ninguém como apagado (ela só lê o que já existe)
      listas().forEach(function (nome) { garantirFicha(nome); importar(nome, banco[nome], true); });
      relatorio = { listas: listas().length, novos: 0, editados: 0, apagados: 0, emObservacao: 0, massasSuspeitas: 0,
        camposForaDoPadrao: 0, recusadosImpossiveis: 0 };
      return relatorio;
    }

    // ── Exclusão em massa: só depois de alguém confirmar ──
    function pendentesDeConfirmacao() { return JSON.parse(JSON.stringify(pendentes)); }

    function confirmarExclusaoEmMassa(nome) {
      var ids = pendentes[nome];
      if (!ids || !ids.length) return { ok: true, apagados: 0 };
      var f = garantirFicha(nome);
      ids.forEach(function (id) {
        delete f.vivo[id];
        f.apagados[id] = true;
        if (modo === 'ligado') nucleo.apagar(nome, id, 'exclusão em massa confirmada');
        // e o registro sai da lista que a tela vê (é uma exclusão de verdade, confirmada)
        banco[nome] = (banco[nome] || []).filter(function (x) { return !x || String(x.id) !== String(id); });
      });
      delete pendentes[nome];
      if (modo === 'ligado') guardarExterno();
      return { ok: true, apagados: ids.length };
    }

    function recusarExclusaoEmMassa(nome) {
      var ids = (pendentes[nome] || []).slice();
      delete pendentes[nome];
      return { ok: true, mantidos: ids.length };
    }

    // ── Trazer de volta: o coração decide, a ponte devolve para a lista da tela ──
    function restaurar(nome, id) {
      garantirListaNoCoracao(nome);
      var r = nucleo.restaurar(nome, id);
      if (!r.ok) return r;
      materializar(nome, r.item);
      var f = garantirFicha(nome);
      delete f.apagados[String(id)];
      f.vivo[String(id)] = assinatura(r.item);
      if (modo === 'ligado') guardarExterno();
      return r;
    }

    // Coloca o registro na lista que a tela vê (atualiza se já estiver lá).
    function materializar(nome, item) {
      if (!Array.isArray(banco[nome])) banco[nome] = [];
      var lista = banco[nome];
      var achou = false;
      for (var i = 0; i < lista.length; i++) {
        if (lista[i] && String(lista[i].id) === String(item.id)) { lista[i] = Object.assign({}, lista[i], item); achou = true; break; }
      }
      if (!achou) lista.push(Object.assign({}, item));
      return achou ? 'atualizado' : 'adicionado';
    }

    // ── O que chega da nuvem: o coração decide e a tela enxerga o resultado ──
    function aplicarDaNuvem(mudanca) {
      if (mudanca && mudanca.lista) garantirListaNoCoracao(mudanca.lista);
      var r = nucleo.aplicarDaNuvem(mudanca);
      if (!r.aplicado) return r;
      var nome = mudanca.lista;
      var item = r.item;
      var lista = Array.isArray(banco[nome]) ? banco[nome] : (banco[nome] = []);
      if (item.apagadoEm) {
        // apagado em outro PC: sai da visão das telas (a lápide fica no coração)
        var restou = lista.filter(function (x) { return !x || String(x.id) !== String(item.id); });
        lista.length = 0; Array.prototype.push.apply(lista, restou);
        var f2 = garantirFicha(nome);
        delete f2.vivo[String(item.id)];
        f2.apagados[String(item.id)] = true;
        return r;
      }
      materializar(nome, item);
      var f3 = garantirFicha(nome);
      f3.vivo[String(item.id)] = assinatura(item);
      delete f3.apagados[String(item.id)];
      return r;
    }

    function mudancas() { return nucleo.mudancas(); }
    function confirmarEnvio(ateSeq) { return nucleo.confirmarEnvio(ateSeq); }
    function relatar() { return JSON.parse(JSON.stringify(relatorio)); }
    function modoAtual() { return modo; }

    return {
      versao: '1.0.0',
      modo: modoAtual,
      modoAtual: modoAtual,
      sincronizar: sincronizar,
      primeiraVarredura: primeiraVarredura,
      listas: listas,
      restaurar: restaurar,
      materializar: materializar,
      aplicarDaNuvem: aplicarDaNuvem,
      mudancas: mudancas,
      confirmarEnvio: confirmarEnvio,
      pendentesDeConfirmacao: pendentesDeConfirmacao,
      confirmarExclusaoEmMassa: confirmarExclusaoEmMassa,
      recusarExclusaoEmMassa: recusarExclusaoEmMassa,
      relatar: relatar,
      assinatura: assinatura
    };
  }

  raiz.DIGICOPY_PONTE = { ligar: ligar, assinatura: assinatura, CAMPOS_DO_CORACAO: CAMPOS_DO_CORACAO };
})(typeof window !== 'undefined' ? window : globalThis);
