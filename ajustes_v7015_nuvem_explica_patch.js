// ═════════════════════════════════════════════════════════════════════════
// ajustes_v7015_nuvem_explica_patch.js — v7.0.15 (24/09/2026)
//
// A QUEIXA QUE ORIGINOU ESTE ARQUIVO (dono, 24/09):
//   "agora não está aparecendo nenhum dado, é normal?"
//
// O que a investigação da rodada 26 mostrou: o sistema tem DUAS trancas de
// propósito (conexão da nuvem, guardada por navegador/endereço, e o login do
// usuário) e, pela regra 44, a base vem DA NUVEM (nada salvo no PC). Então
// qualquer um destes três casos deixa as listas VAZIAS — e os três eram MUDA-
// DOS na tela:
//
//   1. SEM CONEXÃO: o portão (ajustes_v5262) não está na frente. Isso acontece
//      de verdade porque existe o link "jeito antigo": quem entra por ele deixa
//      a sessão inteira sem conexão (`FECHOU_KEY` no sessionStorage) e o portão
//      não volta até fechar a aba — listas vazias, nenhuma explicação.
//   2. PAUSADA: a sincronização pausada (escolha inicial / limite do dia) não
//      baixa nada. O check-up avisa, mas só quem abre o check-up vê.
//   3. CURSOR ADIANTADO: o PC guarda "até onde leu" o diário da nuvem; se esse
//      número ficou na frente (nuvem zerada/recuperada), o que foi criado em
//      outro PC fica invisível AQUI. O conserto existe desde a v6.1.4 ("Baixar
//      tudo de novo"), mas só dentro do check-up.
//
// ESTE ARQUIVO FAZ O SISTEMA SE EXPLICAR SOZINHO (e consertar em 1 clique):
// uma faixa discreta na tela, que só aparece quando há algo a dizer:
//   • "este computador não está conectado à nuvem" ....... [Conectar agora]
//   • "a sincronização está pausada (motivo)" ........... [Resolver agora]
//   • "a nuvem tem mais registros do que aqui" .......... [Baixar tudo de novo]
//   • "a nuvem atingiu o limite de hoje (volta ~21h)" .... [Ver check-up]
//   • "a última conversa com a nuvem falhou: <erro>" .... [Ver check-up]
// Com tudo certo, ela NÃO aparece. Nada é apagado em nenhum caminho: o
// "Baixar tudo de novo" só relê o diário da nuvem desde o começo (o que já está
// mais novo aqui não volta atrás) e a nuvem não é tocada.
//
// Regra da casa: nada de alert/confirm/prompt nativos (regra 16) — a
// confirmação é a janela do sistema (confirmSistema) e os recados vão por toast.
// ═════════════════════════════════════════════════════════════════════════
(function(){
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__v7015nuvem) return;
  window.__v7015nuvem = true;

  const ESPERA_MS = 15000;        // intervalo entre as conferências
  const ESPERA_NUVEM_MS = 60000;  // no máximo 1 consulta à nuvem por minuto
  const Z = 40;                   // acima da tela do app, abaixo das janelas (modal-root = 50) e do login (100)

  let fechadoAte = 0;             // o X da faixa vale por 10 minutos
  let ultimaNuvem = 0, nuvemCache = null;

  function S(){ return window.DIGICOPY_CLOUD_SYNC || null; }
  // `info()` é barato (não percorre a base) — é ele que sustenta a conferência de 15 em
  // 15 segundos. O retrato completo (`estadoDetalhado`, que conta registro por registro)
  // só é montado quando precisa de verdade: no máximo 1× por minuto.
  function info(){
    const s = S();
    if (!s || typeof s.info !== 'function') return null;
    try { return s.info(); } catch (e) { return null; }
  }
  function estado(){
    const s = S();
    if (!s || typeof s.estadoDetalhado !== 'function') return null;
    try { return s.estadoDetalhado(); } catch (e) { return null; }
  }
  function soNuvem(){
    const s = S();
    try { return !!(s && typeof s.modoSoNuvem === 'function' && s.modoSoNuvem()); } catch (e) { return !!(window.DIGICOPY_SO_NUVEM); }
  }
  function appAberto(){
    const login = document.getElementById('login-screen');
    if (!login) return true;                                   // sem tela de login, o app é a tela
    return login.classList.contains('hidden');
  }
  function ocupado(){
    return !!(document.getElementById('v5262-portao') || document.getElementById('digicopy-carga-nuvem'));
  }
  function recado(txt, tipo){
    try { if (typeof window.toast === 'function') window.toast(txt, tipo || 'info'); } catch (e) {}
  }
  function confirmar(pergunta, titulo){
    if (typeof window.confirmSistema === 'function') return window.confirmSistema(pergunta, titulo || 'Confirmar');
    return Promise.resolve(false);   // sem a janela do sistema, não faz nada (regra 16: nunca diálogo nativo)
  }

  // ── a faixa ──────────────────────────────────────────────────────────────
  function esconder(){
    const el = document.getElementById('v7015-faixa');
    if (el) el.remove();
  }
  function mostrar(msg, botoes, cor){
    let el = document.getElementById('v7015-faixa');
    if (!el){
      el = document.createElement('div');
      el.id = 'v7015-faixa';
      document.body.appendChild(el);
    }
    el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:' + Z +
      ';max-width:min(760px,94vw);background:' + (cor || '#0a1e8a') + ';color:#fff;border-radius:14px;' +
      'box-shadow:0 14px 40px rgba(2,10,40,.35);padding:11px 12px 11px 14px;display:flex;gap:10px;' +
      'align-items:center;font-size:12.5px;line-height:1.45;font-weight:600;font-family:inherit';
    el.innerHTML = '<span style="flex:1">' + msg + '</span>';
    (botoes || []).forEach(function(b){
      const bt = document.createElement('button');
      bt.type = 'button';
      bt.textContent = b.rotulo;
      bt.id = b.id || '';
      bt.style.cssText = 'height:34px;padding:0 12px;border-radius:9px;border:0;cursor:pointer;font-weight:900;' +
        'font-size:12px;white-space:nowrap;' + (b.transparente
          ? 'background:rgba(255,255,255,.16);color:#fff'
          : 'background:#fff;color:' + (cor || '#0a1e8a'));
      bt.onclick = function(ev){ ev.preventDefault(); try { b.acao(); } catch (e) {} };
      el.appendChild(bt);
    });
    const x = document.createElement('button');
    x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'Esconder aviso');
    x.style.cssText = 'height:34px;width:34px;border-radius:9px;border:0;cursor:pointer;background:transparent;color:#fff;opacity:.75;font-weight:900';
    x.onclick = function(ev){ ev.preventDefault(); fechadoAte = Date.now() + 10 * 60000; esconder(); };
    el.appendChild(x);
    return el;
  }
  function irConectar(){
    if (typeof window.v5262AbrirPortao === 'function') { window.v5262AbrirPortao(true); return; }
    if (typeof window.abrirCloudflareNuvem === 'function') window.abrirCloudflareNuvem();
  }
  function irResolver(){
    if (typeof window.abrirCloudflareNuvem === 'function') window.abrirCloudflareNuvem();
    else if (typeof window.dcCheckupNuvem === 'function') window.dcCheckupNuvem();
  }
  function irCheckup(){
    if (typeof window.dcCheckupNuvem === 'function') window.dcCheckupNuvem();
  }
  async function baixarTudo(){
    const s = S();
    if (!s || typeof s.baixarTudoDaNuvem !== 'function') return;
    const ok = await confirmar('Reler a nuvem desde o começo? Nada é apagado: o que já está mais novo neste computador não volta atrás e a nuvem não é tocada.', 'Baixar tudo de novo');
    if (!ok) return;
    recado('Lendo a nuvem desde o começo…', 'info');
    try {
      const r = await s.baixarTudoDaNuvem();
      if (r && r.pausado) { recado('A sincronização está pausada — resolva isso antes de baixar.', 'error'); return; }
      ultimoRetrato = 0; retratoCache = null;    // o retrato mudou agora: refaz na próxima
      const e = estado() || {};
      recado('Pronto: reli a nuvem desde o começo. Agora este computador mostra ' + (e.totalLocal || 0) + ' registro(s).', 'info');
      esconder();
      setTimeout(conferir, 1500);
    } catch (err) {
      recado('Não deu para reler a nuvem: ' + ((err && err.message) || err), 'error');
    }
  }

  // ── contar a nuvem (no máximo 1×/minuto) ─────────────────────────────────
  async function contarNuvem(){
    const s = S();
    if (!s || typeof s.apiStatus !== 'function') return null;
    if (Date.now() - ultimaNuvem < ESPERA_NUVEM_MS && nuvemCache) return nuvemCache;
    ultimaNuvem = Date.now();
    try { nuvemCache = await s.apiStatus(); } catch (e) { nuvemCache = null; }
    return nuvemCache;
  }
  // listas em que a nuvem tem MAIS do que este computador (a pista do cursor adiantado)
  function listasFaltando(e, nuvem){
    const faltando = [];
    const aqui = e.porListaLocal || {};
    const la = (nuvem && nuvem.byEntity) || {};
    Object.keys(la).forEach(function(k){
      const naNuvem = Number((la[k] && la[k].active) || 0);
      const aquiN = Number(aqui[k] || 0);
      if (naNuvem > aquiN) faltando.push({ lista: k, aqui: aquiN, nuvem: naNuvem });
    });
    faltando.sort(function(a, b){ return (b.nuvem - b.aqui) - (a.nuvem - a.aqui); });
    return faltando;
  }

  // ── a conferência ────────────────────────────────────────────────────────
  let conferindo = false, ultimoRetrato = 0, retratoCache = null;
  function retrato(){
    if (Date.now() - ultimoRetrato < ESPERA_NUVEM_MS && retratoCache) return retratoCache;
    ultimoRetrato = Date.now();
    retratoCache = estado();
    return retratoCache;
  }
  async function conferir(){
    if (conferindo) return;
    conferindo = true;
    try {
      if (Date.now() < fechadoAte || !appAberto() || ocupado()) { esconder(); return; }
      const inf = info();
      if (!inf) { esconder(); return; }

      // 1) SEM CONEXÃO — a base é só nuvem, então sem conexão a tela fica vazia.
      //    (No SÓ NUVEM nem precisa contar a base: sem token não entra nada.)
      if (!inf.authorized && soNuvem()) {
        mostrar('Este computador <b>não está conectado à nuvem</b> — por isso as listas aparecem vazias. É só conectar uma vez.',
          [{ rotulo: 'Conectar agora', id: 'v7015-bt-conectar', acao: irConectar },
           { rotulo: 'Ver check-up', id: 'v7015-bt-ck1', transparente: true, acao: irCheckup }], '#9a3412');
        return;
      }

      // 2) PAUSADA — enquanto estiver pausada este PC não baixa nada.
      if (inf.paused) {
        mostrar('A sincronização está <b>pausada</b>' + (inf.pauseReason ? ' (' + String(inf.pauseReason) + ')' : '') + ' — este computador não está baixando os dados da nuvem.',
          [{ rotulo: 'Resolver agora', id: 'v7015-bt-pausa', acao: irResolver },
           { rotulo: 'Ver check-up', id: 'v7015-bt-ck2', transparente: true, acao: irCheckup }], '#9a3412');
        return;
      }

      // 3) A NUVEM NO LIMITE DO DIA — nada se perdeu; ela volta às 21h (Londres).
      const limiteAte = Number(inf.limiteAte) || 0;
      if (limiteAte > Date.now()) {
        const hora = new Date(limiteAte).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        mostrar('A nuvem aplicou o <b>freio preventivo de gravações</b> para não estourar o limite do plano — <b>nada foi perdido</b>. O envio volta sozinho por volta das <b>' + hora + '</b>.',
          [{ rotulo: 'Ver check-up', id: 'v7015-bt-limite', acao: irCheckup }], '#92400e');
        return;
      }

      // 4) A ÚLTIMA CONVERSA FALHOU — só quando o erro impede mesmo (autorização,
      //    cota, nuvem fora do ar). Internet que piscou não vira alarme.
      const erro = String(inf.lastError || '');
      const erroGrave = /401|403|revog|token|autoriz|quota|cota|limite|429|503|indispon|sem espa/i.test(erro);
      if (erro && erroGrave) {
        mostrar('A última conversa com a nuvem falhou: <b>' + erro.slice(0, 120) + '</b>',
          [{ rotulo: 'Ver check-up', id: 'v7015-bt-ck4', acao: irCheckup }], '#9a3412');
        return;
      }

      // 5) A NUVEM TEM MAIS DO QUE AQUI — o "não está aparecendo" clássico (a leitura
      //    falhou no meio ou o PC ficou para trás). Aqui vale o retrato completo
      //    (contar registro por registro), no máximo 1× por minuto. Sem alarme falso:
      //    precisa estar conectado, sem fila presa (senão o que "falta" é coisa deste
      //    PC que ainda vai subir) e sem nada segurado aqui.
      if (inf.authorized && !(inf.outbox > 0) && !((inf.heldLocalOnly || []).length)) {
        const nuvem = await contarNuvem();
        const faltando = listasFaltando(retrato() || {}, nuvem);
        if (faltando.length) {
          const trecho = faltando.slice(0, 3).map(function(f){ return f.lista + ': ' + f.aqui + ' aqui × ' + f.nuvem + ' na nuvem'; }).join(' · ');
          const mais = faltando.length > 3 ? ' (+' + (faltando.length - 3) + ' outra(s) lista(s))' : '';
          mostrar('A <b>nuvem tem mais registros</b> do que este computador — ' + trecho + mais + '.',
            [{ rotulo: 'Baixar tudo de novo', id: 'v7015-bt-baixar', acao: baixarTudo },
             { rotulo: 'Ver check-up', id: 'v7015-bt-ck3', transparente: true, acao: irCheckup }], '#92400e');
          return;
        }
      }

      esconder();
    } finally {
      conferindo = false;
    }
  }

  // A faixa se atualiza sozinha, sem ninguém clicar em nada.
  try { window.v7015ConferirNuvem = conferir; } catch (e) {}
  setTimeout(conferir, 2500);
  setTimeout(conferir, 8000);
  setInterval(function(){ try { conferir(); } catch (e) {} }, ESPERA_MS);
  // quando uma sincronização termina, a faixa confere na hora (o que estava
  // faltando pode ter acabado de chegar — ou ter aparecido um erro novo)
  const s0 = S();
  if (s0 && typeof s0.tick === 'function' && !s0.tick.__v7015) {
    const antigo = s0.tick;
    s0.tick = async function(){
      const r = await antigo.apply(this, arguments);
      setTimeout(function(){ try { conferir(); } catch (e) {} }, 1200);
      return r;
    };
    s0.tick.__v7015 = true;
  }
  console.log('v7.0.15 — a nuvem explica: faixa que avisa (e conserta) quando os dados não aparecem');
})();
