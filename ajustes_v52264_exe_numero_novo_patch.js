// ═══════════════════════════════════════════════════════════════════════════
// v5.22.64 — Cada entrega tem um número novo + diagnóstico do .exe
//
// Problema relatado: "gerei o .exe e continua tudo igual; só o rodapé da
// versão aparece atualizado".
//
// Duas causas de PROCESSO, não de código:
//
// 1. O NÚMERO DA VERSÃO NÃO MUDAVA. Todas as correções da v5.22.63 saíram com
//    o mesmo número. O instalador se chama Sistema-Digicopy-Setup-5.22.63.exe
//    sempre — o mesmo nome do instalador antigo, que ainda está na pasta de
//    downloads. É muito fácil instalar o arquivo errado sem perceber, e o
//    Windows/NSIS não tem como distinguir uma versão da outra.
//    A partir daqui: toda entrega sobe o número. Sempre.
//
// 2. NÃO HAVIA COMO OLHAR DENTRO DO QUE ESTÁ INSTALADO. Agora existe
//    `npm run diag` (diagnostico_exe.js): ele compara o código-fonte da pasta
//    com o que está de fato dentro do dist\win-unpacked e da instalação, e
//    diz qual arquivo está velho. O sintoma "só o rodapé atualiza" significa
//    index.html novo + app.bundle.js antigo, e o diagnóstico aponta isso.
//
// Nada da lógica do sistema muda nesta versão.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var VERSAO = '5.22.64';

window.EXE_NUMERO_NOVO_V52264_PURE = {
  VERSAO: VERSAO,
  numeroSempreNovo: true,   // toda entrega sobe a versão
  temDiagnostico: true,     // npm run diag inspeciona o que está instalado
  // Confere se o que está rodando é mesmo o código que se espera.
  versaoBate: function(esperada, rodando){
    return String(esperada || '').trim() === String(rodando || '').trim();
  },
  // Nome do instalador desta versão — serve para o usuário conferir o arquivo.
  nomeInstalador: function(v){
    return 'Sistema-Digicopy-Setup-' + String(v || VERSAO) + '.exe';
  }
};

if (typeof window !== 'undefined') {
  window.DIGICOPY_APP_VERSION = window.DIGICOPY_APP_VERSION || VERSAO;
}

// Rodapé, título da aba e cabeçalho seguem SEMPRE a versão real do index.html.
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

if (typeof console !== 'undefined' && console.log) {
  console.log('[DIGICOPY] v' + VERSAO + ' — instalador: Sistema-Digicopy-Setup-' + VERSAO + '.exe');
}
})();
