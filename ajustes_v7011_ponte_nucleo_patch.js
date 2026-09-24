// ajustes_v7011_ponte_nucleo_patch.js — o NÚCLEO NOVO dentro do sistema de HOJE (só conferência)
//
// PEDIDO DO DONO (24/09/2026): "recriar praticamente O MESMO sistema, só que com
// núcleo diferente... o mesmo Index, as mesmas funções, tudo". A troca do coração
// é por PARTES; esta é a primeira peça dentro do sistema de hoje — e ela NÃO muda
// comportamento nenhum:
//
//   • NÃO escuta as gravações. Medido numa base de 76.550 registros: acompanhar
//     cada gravação custaria ~140-270 ms POR GRAVAÇÃO (o conteúdo inteiro teria de
//     ser comparado). Isso é exatamente a lentidão que o dono reclamou — então
//     ficou de fora POR MEDIÇÃO, não por opinião.
//   • NÃO grava nada: nem no banco do PC, nem na nuvem, nem no navegador. É
//     conferência: compara as listas com a conferência anterior e mostra o que
//     ACONTECEU no meio (novos, editados e retirados) — os retirados são os que,
//     no núcleo novo, viram LÁPIDE (com quem apagou, quando e por quê), e os que
//     reaparecem depois são justamente o "apaguei e voltou".
//   • Roda quando o dono pede, no painel da Nuvem, e mostra o resultado ali mesmo.
//
// POR QUE ISSO IMPORTA: é a prova que falta para trocar de vez. Depois de um dia
// de uso ele vê, na base real dele, quantas retiradas aconteceram e se alguma
// voltou sozinha.
(function(){
  if(typeof window === 'undefined' || typeof document === 'undefined') return;
  var VERSAO = '7.0.11';
  var LIMITE_ROTULO = 200000;   // acima disso só guarda os ids (economia de memória)

  var ponte = null, aprendido = false, ultimaEm = null, conferencias = 0;
  var anterior = {};            // lista -> Map(id -> rótulo) na última conferência
  var retiradosVistos = {};     // lista -> {id:true} do que já saiu (para pegar "voltou")
  var massasVistas = {};        // lista -> assinatura da retirada em massa já avisada

  function disponivel(){
    return !!(window.DIGICOPY_PONTE && typeof window.DIGICOPY_PONTE.ligar === 'function'
              && window.DIGICOPY_NUCLEO && typeof window.DIGICOPY_NUCLEO.criar === 'function'
              && window.db);
  }

  // Cria (uma vez) o conferente. O coração é criado SÓ NA MEMÓRIA desta página: em
  // modo observação ele não recebe função de gravar, então nada sai daqui.
  function preparar(){
    if(ponte) return ponte;
    if(!disponivel()) return null;
    try{
      var bd = window.db;
      var nucleo = window.DIGICOPY_NUCLEO.criar({ empresaId: (bd.config && bd.config.empresa) || '', origem: 'conferencia' });
      ponte = window.DIGICOPY_PONTE.ligar({ db: bd, nucleo: nucleo, modo: 'observacao' });
      return ponte;
    }catch(e){
      if(window.console && console.warn) console.warn('[DIGICOPY] conferente do núcleo novo indisponível:', (e && e.message) || e);
      return null;
    }
  }

  function esc(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  // Como chamar cada registro na hora de avisar "isto saiu"
  function rotuloDe(item){
    var campos = ['nome','cliente','descricao','titulo','numero','placa','razaoSocial','aparelho'];
    for(var i=0;i<campos.length;i++){
      var v = item[campos[i]];
      if(v !== undefined && v !== null && String(v).trim() !== '') return String(v).slice(0,60);
    }
    return '';
  }

  // Uma cópia por conferência: além dos códigos, guarda o NOME de cada registro
  // (o dono precisa saber QUEM saiu, não só o código). Base gigante = só códigos.
  function copiarListas(p, comRotulo){
    var mapa = {}, total = 0, listas = p.listas();
    listas.forEach(function(nome){
      var arr = window.db[nome] || [], m = new Map();
      for(var i=0;i<arr.length;i++){
        var it = arr[i];
        if(!it || typeof it !== 'object' || it.id === undefined || it.id === '') continue;
        m.set(String(it.id), comRotulo ? rotuloDe(it) : '');
      }
      mapa[nome] = m; total += m.size;
    });
    return { mapa: mapa, total: total, listas: listas };
  }

  function contarRegistros(listas){
    var n = 0;
    listas.forEach(function(nome){
      var arr = window.db[nome] || [];
      for(var i=0;i<arr.length;i++){
        var it = arr[i];
        if(it && typeof it === 'object' && it.id !== undefined && it.id !== '') n++;
      }
    });
    return n;
  }

  function diferenca(antes, agora){
    var novos = [], retirados = [], voltaram = [];
    Object.keys(agora.mapa).forEach(function(nome){
      var a = antes.mapa[nome] || new Map(), b = agora.mapa[nome];
      b.forEach(function(rot, id){
        if(!a.has(id)){
          if(retiradosVistos[nome] && retiradosVistos[nome][id]) voltaram.push({ lista: nome, id: id, rotulo: rot });
          else novos.push({ lista: nome, id: id, rotulo: rot });
        }
      });
      a.forEach(function(rot, id){ if(!b.has(id)) retirados.push({ lista: nome, id: id, rotulo: rot }); });
    });
    return { novos: novos, retirados: retirados, voltaram: voltaram };
  }

  function marcarRetirados(lista){
    lista.forEach(function(r){
      if(!retiradosVistos[r.lista]) retiradosVistos[r.lista] = {};
      retiradosVistos[r.lista][r.id] = true;
    });
  }
  function limparRetirados(lista){
    lista.forEach(function(r){ if(retiradosVistos[r.lista]) delete retiradosVistos[r.lista][r.id]; });
  }

  function exemplos(lista, max){
    return lista.slice(0, max).map(function(r){
      return esc(r.lista) + ' ▸ ' + esc(r.rotulo || r.id) + (r.rotulo ? ' <span style="color:#94a3b8">(' + esc(r.id) + ')</span>' : '');
    });
  }

  // ── A CONFERÊNCIA ─────────────────────────────────────────────────────────
  function conferir(){
    var p = preparar();
    if(!p) return { ok: false, erro: 'O sistema ainda não terminou de carregar (ou este é um navegador de teste). Abra o painel da Nuvem de novo em alguns segundos.' };
    var t0 = Date.now();
    var listas = p.listas();
    var comRotulo = ultimaEm === null || contarRegistros(listas) <= LIMITE_ROTULO;
    var agora = copiarListas(p, comRotulo);              // quantos e QUEM existe agora
    var antes = anterior;

    // ── primeira vez: só APRENDE a base (não acusa retirada nenhuma) ──
    if(!aprendido){
      p.primeiraVarredura();
      aprendido = true; conferencias++; ultimaEm = Date.now();
      anterior = agora.mapa;
      return { ok: true, primeira: true, ms: Date.now() - t0, listas: agora.listas.length,
               registros: agora.total, novos: 0, editados: 0, retirados: 0, voltaram: 0, massas: [], comRotulo: comRotulo };
    }

    // ── da segunda em diante: passa pelo coração de verdade e compara ──
    var r = p.sincronizar();                             // modo observação: não grava nada
    var d = diferenca({ mapa: antes }, agora);
    var editados = 0, massas = [];
    agora.listas.forEach(function(nome){
      var a = r.acoes[nome] || {};
      editados += a.editados || 0;
      if(a.retinhaMassa && a.retinhaMassa.length){
        var assin = a.retinhaMassa.slice().sort().join('|');
        if(massasVistas[nome] !== assin){ massas.push({ lista: nome, n: a.retinhaMassa.length }); massasVistas[nome] = assin; }
      }
    });
    marcarRetirados(d.retirados);
    limparRetirados(d.voltaram);
    anterior = agora.mapa;
    conferencias++; ultimaEm = Date.now();
    return { ok: true, primeira: false, ms: Date.now() - t0, listas: agora.listas.length, registros: agora.total,
             novos: d.novos.length, editados: editados, retirados: d.retirados.length, voltaram: d.voltaram.length,
             exemplosNovos: exemplos(d.novos, 4), exemplosRetirados: exemplos(d.retirados, 5),
             exemplosVoltaram: exemplos(d.voltaram, 3), massas: massas, comRotulo: comRotulo };
  }

  function nBR(n){ return Number(n || 0).toLocaleString('pt-BR'); }

  function textoDoResultado(r){
    if(!r.ok) return '⚠️ ' + esc(r.erro);
    var L = [];
    L.push('Listas acompanhadas: <b>' + r.listas + '</b> • registros: <b>' + nBR(r.registros) + '</b> (conferido em ' + r.ms + ' ms)');
    if(r.primeira){
      L.push('<b>Base aprendida.</b> Da próxima vez este botão mostra o que mudou desde agora — inclusive o que foi retirado.');
    } else {
      L.push('Desde a conferência anterior: <b>' + r.novos + '</b> novo(s), <b>' + r.editados + '</b> editado(s), <b>' + r.retirados + '</b> retirado(s)');
      if(r.exemplosRetirados && r.exemplosRetirados.length){
        L.push('<div style="margin-top:4px"><span style="color:#b45309"><b>Saiu da lista:</b></span><br>' + r.exemplosRetirados.join('<br>') +
               (r.retirados > r.exemplosRetirados.length ? '<br><span style="color:#94a3b8">… e mais ' + (r.retirados - r.exemplosRetirados.length) + '</span>' : '') + '</div>');
      }
      if(r.exemplosNovos && r.exemplosNovos.length) L.push('<span style="color:#166534"><b>Entrou:</b></span> ' + r.exemplosNovos.join(' • '));
      if(r.voltaram) L.push('<span style="color:#b91c1c"><b>⚠️ Voltaram sozinhos:</b> ' + r.exemplosVoltaram.join(' • ') + '</span>');
      if(r.retirados > 0) L.push('<span style="color:#64748b">Cada retirado é o que, no núcleo novo, vira <b>lápide</b> (com quem apagou, quando e por quê) — é o fim do “apaguei e voltou”.</span>');
    }
    if(r.massas && r.massas.length){
      L.push('<span style="color:#b91c1c"><b>⚠️ Retirada em massa:</b> ' + r.massas.map(function(m){ return esc(m.lista) + ' (' + nBR(m.n) + ')'; }).join(' • ') +
             ' — o núcleo novo <b>seguraria</b> isso e pediria a sua confirmação em vez de apagar.</span>');
    }
    if(!r.comRotulo) L.push('<span style="color:#94a3b8">Base grande: mostrando só os códigos dos registros.</span>');
    L.push('<span style="color:#64748b">Conferência: não grava nada — nem no PC, nem na nuvem.</span>');
    return L.join('<br>');
  }

  // ── o bloco no painel da Nuvem (ao lado do Diagnóstico que já existe) ──────
  function instalar(){
    var modal = document.getElementById('digicopy-cloud-modal');
    if(!modal || modal.classList.contains('hidden')) return;
    if(document.getElementById('dc-nucleo-novo')) return;
    var alvo = modal.querySelector('#dc-diagnostico') || modal.querySelector('.dc-body') || modal.querySelector('#dc-list-deleted');
    if(!alvo || !alvo.parentNode) return;

    var box = document.createElement('div');
    box.id = 'dc-nucleo-novo';
    box.style.cssText = 'margin-top:10px;border:1px solid #c7d2fe;background:#f8f9ff;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#334155;line-height:1.6';
    box.innerHTML = '<div style="font-weight:800;color:#0a1e8a">Núcleo novo (em construção)</div>'
      + '<div style="margin-top:4px">O sistema de hoje continua igual. Este botão só <b>confere</b> as listas e mostra o que mudou desde a última conferência — inclusive as retiradas que, no núcleo novo, viram <b>lápide</b> (com quem apagou, quando e por quê).</div>'
      + '<div style="margin-top:8px"><button type="button" id="dc-nucleo-btn" style="height:36px;padding:0 14px;border:0;border-radius:9px;background:#0a1e8a;color:#fff;font-weight:800;cursor:pointer">🔎 Conferir o núcleo novo</button></div>'
      + '<div id="dc-nucleo-res" style="margin-top:8px"></div>';
    alvo.parentNode.insertBefore(box, alvo.nextSibling);

    var btn = box.querySelector('#dc-nucleo-btn');
    var res = box.querySelector('#dc-nucleo-res');
    btn.onclick = function(){
      btn.disabled = true;
      var textoAntes = btn.textContent;
      btn.textContent = 'Conferindo…';
      res.textContent = '';
      setTimeout(function(){
        try{
          var r = conferir();
          res.innerHTML = textoDoResultado(r);
        }catch(e){
          res.innerHTML = '⚠️ ' + esc((e && e.message) || e);
        }
        btn.disabled = false;
        btn.textContent = textoAntes;
      }, 30);
    };
  }

  // O painel é redesenhado por vários caminhos (mesma ideia do Diagnóstico que já
  // existe): o bloco é reinstalado quando ele aparece, sem mexer em nada.
  setInterval(function(){ try{ instalar(); }catch(e){} }, 2500);
  document.addEventListener('click', function(){ setTimeout(function(){ try{ instalar(); }catch(e){} }, 600); }, true);

  // exposto para os testes (e para conferir por fora)
  window.DIGICOPY_NUCLEO_OBS = {
    versao: VERSAO,
    conferir: conferir,
    preparar: preparar,
    instalar: instalar,
    ultimaConferenciaEm: function(){ return ultimaEm; },
    conferencias: function(){ return conferencias; }
  };
  console.log('[DIGICOPY] núcleo novo: conferência sob demanda carregada (v' + VERSAO + ')');
})();
