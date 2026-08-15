// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.1 — otimizações e correções de interferência
// • Corrige a sincronização manual ("Enviar para nuvem" / "Carregar da nuvem"):
//   o window.confirm foi desativado pelo sistema de popups (retorna false),
//   então os botões cancelavam sem fazer nada. Agora usam confirmSistema.
// • Reduz trabalho desnecessário dos observadores (não roda fora de chamados).
// • Reaplica a logo PADRÃO (logo.png) por segurança após o carregamento.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

if(typeof window === 'undefined') return;

function confirmar(m, t){
  if(typeof window.confirmSistema === 'function') return window.confirmSistema(m, t || 'Confirmar');
  // fallback: sem confirmSistema, usa Promise nativa (resolve false = não faz nada)
  return Promise.resolve(false);
}

// ─────────────────────────────────────────────────────────────────────────
// Sync manual: usa confirmSistema (assíncrono) em vez de confirm() quebrado
// ─────────────────────────────────────────────────────────────────────────
const _envNuvem = window.enviarDadosLocaisParaNuvem;
if(typeof _envNuvem === 'function'){
  window.enviarDadosLocaisParaNuvem = function(){
    confirmar('Enviar TODOS os dados deste PC para a nuvem?\n\nOs outros computadores poderão carregar estes dados em "Carregar da nuvem".', 'Enviar para nuvem').then(function(ok){
      if(!ok) return;
      try{ window.syncEnviarParaNuvem({ confirmar:false }); }catch(e){}
    });
    return undefined;
  };
}

const _carNuvem = window.carregarDadosDaNuvem;
if(typeof _carNuvem === 'function'){
  window.carregarDadosDaNuvem = function(){
    confirmar('Carregar os dados da nuvem neste PC?\n\n⚠️ OS DADOS LOCAIS ATUAIS SERÃO SUBSTITUÍDOS pelos dados da nuvem.', 'Carregar da nuvem').then(function(ok){
      if(!ok) return;
      try{ window.syncCarregarDaNuvem({ confirmar:false }); }catch(e){}
    });
    return undefined;
  };
}

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
