// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.1 — otimizações e correções de interferência
// • Reduz trabalho desnecessário dos observadores (não roda fora de chamados).
// • Reaplica a logo PADRÃO (logo.png) por segurança após o carregamento.
//
// AUDITORIA 23/09/2026 — o bloco do "sync manual" ("Enviar para nuvem" /
// "Carregar da nuvem") foi REMOVIDO a pedido do dono: "não quero algo manual
// que envia pra nuvem, quero automático". Ele era código morto — uma varredura
// ampla não achou nenhum botão chamando essas funções — e, pior, ajudava a
// mostrar "Pronto! Este PC enviou os dados ☁️" com a nuvem DESLIGADA (os stubs
// da Cloudflare devolvem ok:false sem lançar erro). A sincronização que vale é
// a automática (cloudflare_data_sync_patch.js).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

if(typeof window === 'undefined') return;


// ─────────────────────────────────────────────────────────────────────────
// Logo padrão garantida após tudo carregar (evita qualquer reaplicação)
// ─────────────────────────────────────────────────────────────────────────
var _logoPadrao = window.DIGICOPY_LOGO;
if(_logoPadrao){
  setTimeout(function(){ window.DIGICOPY_LOGO = _logoPadrao; }, 3200);
  setTimeout(function(){ window.DIGICOPY_LOGO = _logoPadrao; }, 6000);
}

// ─────────────────────────────────────────────────────────────────────────
// Guard dos observadores: só atuam se houver modal de chamado aberto
// (já coberto dentro dos patches, mas reforça sem custo)
// ─────────────────────────────────────────────────────────────────────────
// (nenhuma ação necessária aqui — os guards foram adicionados nos próprios
//  patches v5.18.5/v5.18.6)

console.log('[DIGICOPY] ajustes_v5191_patch.js');
})();
