// ═══════════════════════════════════════════════════════════════════════════
// v5.22.65 — Um script quebrado não derruba mais o sistema inteiro
//
// CAUSA REAL do "no GitHack funciona, no .exe falta muita coisa".
//
// O app.bundle.js junta ~186 scripts num arquivo só. Como é UM arquivo, um
// erro de execução em qualquer um deles aborta o restante: os scripts
// seguintes simplesmente nunca rodam. Não aparece erro na tela, o sistema abre
// normalmente — só que pela metade.
//
// Por que só no .exe: o GitHack serve por https, um endereço normal. O .exe
// abre por file://, que o Chromium trata como "origem opaca" e onde várias
// APIs são bloqueadas (IndexedDB, por exemplo). Um patch que funciona no site
// falha no .exe — e leva junto TUDO que vem depois dele na fila.
//
// Batia com o relato: o que sumia (modo escuro, menu de orçamentos, ajustes do
// financeiro) está nas posições 136, 145 e seguintes. O que continuava
// funcionando está antes. E o rodapé da versão atualizava porque vem escrito
// no index.html, não do bundle.
//
// Correção: cada script entra no bundle dentro do seu próprio try/catch, então
// uma falha isolada não contamina os outros 185. Os arquivos que declaram
// coisas no escopo global (app.js e evolucao_patch.js) continuam sem
// envolvimento, porque envolvê-los mudaria o escopo — isso é detectado lendo o
// código de verdade, não por lista escrita à mão.
//
// E o que falhar fica REGISTRADO: window.__DIGICOPY_ERROS na tela, arquivo
// log-erros.txt no disco, e `npm run diag` mostra tudo.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var VERSAO = '5.22.65';

window.EXE_SCRIPT_ISOLADO_V52265_PURE = {
  VERSAO: VERSAO,
  isolaCadaScript: true,
  registraFalhas: true,

  // Um script só pode ser isolado se não declarar nada no escopo global.
  podeIsolar: function(temDeclaracaoGlobal){ return temDeclaracaoGlobal !== true; },

  // Resumo legível do que falhou, para mostrar a quem usa o sistema.
  resumoFalhas: function(lista){
    var n = (lista && lista.length) || 0;
    if (!n) return 'Todos os scripts carregaram.';
    return n + (n === 1 ? ' script não carregou' : ' scripts não carregaram');
  },

  // O bundle chegou ao fim? É a prova de que nada abortou a execução.
  carregouTudo: function(w){
    return !!(w && w.__DIGICOPY_BUNDLE_COMPLETO === true);
  }
};

if (typeof window !== 'undefined') {
  window.DIGICOPY_APP_VERSION = window.DIGICOPY_APP_VERSION || VERSAO;
}

// Rodapé, cabeçalho e nome da janela seguem a versão real do index.html.
function pintarVersao(){
  if (typeof document === 'undefined') return;
  var v = (typeof window !== 'undefined' && window.DIGICOPY_APP_VERSION) || VERSAO;
  var rodape = document.getElementById('footer-version');
  if (rodape && rodape.textContent !== 'v' + v) rodape.textContent = 'v' + v;
  var titulo = document.getElementById('app-title-version');
  if (titulo && titulo.textContent !== 'Sistema Digicopy v' + v) titulo.textContent = 'Sistema Digicopy v' + v;
  var certo = 'Sistema Digicopy v' + v;
  if (document.title !== certo) document.title = certo;
}
pintarVersao();
if (typeof setTimeout === 'function') {
  setTimeout(pintarVersao, 200);
  setTimeout(pintarVersao, 900);
  setTimeout(pintarVersao, 1800);
}

// Se algum script falhou, avisa uma vez — em vez de faltar coisa em silêncio.
if (typeof setTimeout === 'function') {
  setTimeout(function(){
    try{
      var erros = (typeof window !== 'undefined' && window.__DIGICOPY_ERROS) || [];
      if (!erros.length) return;
      var msg = window.EXE_SCRIPT_ISOLADO_V52265_PURE.resumoFalhas(erros)
              + '. Rode "npm run diag" para ver quais.';
      if (typeof toast === 'function') toast(msg, 'error');
      if (typeof console !== 'undefined' && console.error) console.error('[DIGICOPY] ' + msg, erros);
    }catch(e){}
  }, 2500);
}

if (typeof console !== 'undefined' && console.log) {
  console.log('[DIGICOPY] v' + VERSAO + ' — scripts isolados: uma falha não derruba as outras');
}
})();
