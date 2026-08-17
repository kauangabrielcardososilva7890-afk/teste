// ═══════════════════════════════════════════════════════════════════════════
// COMPATIBILIDADE v5.20.27 — não reativar o sincronizador legado
// O motor automático oficial é sync_realtime_patch.js. O antigo sync_client.js
// usava app_state e consultava a nuvem a cada 75s, concorrendo e gastando cota.
// Este arquivo permanece listado por compatibilidade com builds antigos.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
try { localStorage.setItem('digicopy_erp_autosync', '0'); } catch(e) {}
console.log('[DIGICOPY] sync legado automático desativado; sync incremental ativo');
})();
