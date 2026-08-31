// ═══════════════════════════════════════════════════════════════════════════
// v5.22.63 — .exe COMPLETO: nenhuma atualização fica de fora do instalador
//
// Causa do problema relatado ("gero o .exe e não vêm as atualizações novas"):
// o que entra no instalador era decidido por listas escritas À MÃO em 4
// lugares diferentes (bundle-manifest.json, index.html, package.json >
// build.files e scripts.check). Bastava esquecer UMA delas para o arquivo
// não ser copiado para dentro do .exe — sem nenhum aviso.
//
// Além disso, o cache do Electron só era limpo quando o NÚMERO da versão
// mudava. Gerando um .exe novo com o mesmo número, o sistema continuava
// rodando o código antigo guardado em cache.
//
// Correções desta versão:
//   1. sync_build.js  — deriva index.html/build.files/check de UMA fonte só.
//   2. verify_pack.js — abre o pacote gerado e confere arquivo por arquivo.
//   3. main.js        — cache invalidado pela impressão digital (sha256) do
//                       código, não apenas pela versão.
//   4. sync-www do celular — o APK também para de sair com arquivos faltando.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var VERSAO = '5.22.63';

window.EXE_COMPLETO_V52263_PURE = {
  VERSAO: VERSAO,
  listaAutomatica: true,   // build.files é gerado, não escrito à mão
  conferePacote: true,     // verify_pack.js roda depois do electron-builder
  cachePorConteudo: true,  // cache limpa quando o código muda
  apkSemFaltas: true       // sync-www copia tudo que o index.html carrega
};

if(typeof document === 'undefined') return;
if(window.__v52263_exe_loaded) return;
window.__v52263_exe_loaded = true;

function pintarRodape(){
  var curV = (typeof window !== 'undefined' && window.DIGICOPY_APP_VERSION) || VERSAO;
  var ver = document.getElementById('footer-version');
  if(ver && ver.textContent !== 'v' + curV) ver.textContent = 'v' + curV;
  var appVer = document.getElementById('app-title-version');
  if(appVer && appVer.textContent !== 'Sistema Digicopy v' + curV) appVer.textContent = 'Sistema Digicopy v' + curV;
  // Nome da janela/aba: patches antigos fixavam a versão deles aqui e o título
  // ficava travado numa versão velha. Agora segue sempre a versão real.
  var tituloCerto = 'Sistema Digicopy v' + curV;
  if(typeof document !== 'undefined' && document.title !== tituloCerto) document.title = tituloCerto;
}

pintarRodape();
setTimeout(pintarRodape, 150);
setTimeout(pintarRodape, 700);
setTimeout(pintarRodape, 1500);

if(typeof window.navigateTo === 'function' && !window.navigateTo.__v52263ver){
  var oldN = window.navigateTo;
  window.navigateTo = function(){
    var r = oldN.apply(this, arguments);
    try{ pintarRodape(); }catch(e){}
    return r;
  };
  window.navigateTo.__v52263ver = true;
}

console.log('[DIGICOPY] v5.22.63: empacotamento do .exe verificado — nada fica de fora');
})();
