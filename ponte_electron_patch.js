// ============================================================
// PONTE ELECTRON — primeiro script do bundle
// ============================================================
// O `preload.js` entrega tudo dentro de `window.__digicopyPontes`.
// O contextBridge CONGELA o que expõe: quem tentasse fazer
//   window.nfeCertAPI.assinar = ...
// levava "Cannot assign to read only property" e o patch inteiro
// morria. No navegador isso nunca aparecia (lá não existe preload,
// os objetos são normais); só quebrava no .exe.
//
// Aqui a ponte vira uma CÓPIA normal, gravável, com os nomes de
// sempre (firebirdAPI, fileAPI, caixaEscolarAPI, printAPI,
// backupAPI, nfeCertAPI). Assim os patches podem envelopar os
// métodos como sempre fizeram, e o .exe se comporta igual ao site.
//
// Este arquivo precisa ser o PRIMEIRO do bundle-manifest.json.
(function () {
  'use strict';

  var API = (window.PONTE_ELECTRON_PURE = window.PONTE_ELECTRON_PURE || {});

  // Cópia rasa e gravável de um objeto congelado pelo contextBridge.
  API.copiaGravavel = function (origem) {
    if (!origem || typeof origem !== 'object') return origem;
    var copia = {};
    for (var chave in origem) {
      try { copia[chave] = origem[chave]; } catch (e) {}
    }
    return copia;
  };

  // Grava no window mesmo que o nome já exista como somente-leitura.
  API.gravarGlobal = function (alvo, nome, valor) {
    try {
      alvo[nome] = valor;
      if (alvo[nome] === valor) return true;
    } catch (e) {}
    try {
      Object.defineProperty(alvo, nome, {
        value: valor, writable: true, configurable: true, enumerable: true
      });
      return alvo[nome] === valor;
    } catch (e) { return false; }
  };

  // Abre a ponte: devolve a lista de nomes publicados.
  API.abrir = function (alvo, pontes) {
    alvo = alvo || window;
    pontes = pontes || alvo.__digicopyPontes;
    var nomes = [];
    if (!pontes || typeof pontes !== 'object') return nomes;
    for (var nome in pontes) {
      var copia = API.copiaGravavel(pontes[nome]);
      if (API.gravarGlobal(alvo, nome, copia)) nomes.push(nome);
    }
    return nomes;
  };

  API.VERSAO = '5.22.66';

  var publicados = API.abrir(window);
  window.__DIGICOPY_PONTES_ABERTAS = publicados;

  if (publicados.length) {
    console.log('[DIGICOPY] ponte Electron aberta: ' + publicados.join(', '));
  }
})();
