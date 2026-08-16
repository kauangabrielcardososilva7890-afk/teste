// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.19.3 — cliente: aviso "salvar ou não" ao sair, só se modificou algo
// • Ao ALTERAR um cliente, se você mudou qualquer informação e tentar sair
//   (Cancelar, X, clicar fora ou ESC), aparece o aviso "Deseja salvar as
//   alterações antes de sair?". Se não mudou nada, fecha direto (sem aviso).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

if(typeof window === 'undefined' || typeof document === 'undefined') return;

// Todos os campos do formulário de cliente (valor editável).
const CLI_CAMPOS = [
  'f-cli-doc','f-cli-nome','f-cli-tipo','f-cli-tel','f-cli-whatsapp','f-cli-contato',
  'f-cli-email','f-cli-email2','f-cli-fantasia','f-cli-cep','f-cli-rua','f-cli-num',
  'f-cli-compl','f-cli-bairro','f-cli-ref','f-cli-cidade','f-cli-estado','f-cli-rgie',
  'f-cli-indie','f-cli-consumidor','f-cli-govern','f-cli-site','f-cli-status','f-cli-obs'
];

function cliTirarFoto(){
  const snap = {};
  CLI_CAMPOS.forEach(function(id){
    const el = document.getElementById(id);
    if(el) snap[id] = el.value;
  });
  return snap;
}

function cliModificou(){
  if(!window.__cliEditId || !window.__cliEditSnapshot) return false;
  const snap = window.__cliEditSnapshot;
  for(let i = 0; i < CLI_CAMPOS.length; i++){
    const id = CLI_CAMPOS[i];
    const el = document.getElementById(id);
    if(!el) continue;
    if(String(el.value) !== String(snap[id] !== undefined ? snap[id] : '')) return true;
  }
  return false;
}

// Ao abrir a edição de cliente, tira uma "foto" dos valores atuais.
const _renderCliente = window.renderModalCliente;
if(typeof _renderCliente === 'function'){
  window.renderModalCliente = function(id){
    window.__cliEditId = id || null;
    window.__cliEditSnapshot = null;
    const r = _renderCliente.apply(this, arguments);
    if(id){
      setTimeout(function(){ window.__cliEditSnapshot = cliTirarFoto(); }, 60);
      setTimeout(function(){ if(!window.__cliEditSnapshot) window.__cliEditSnapshot = cliTirarFoto(); }, 250);
    }
    return r;
  };
}

// Ao salvar, limpa o estado de edição.
const _saveCliente = window.saveCliente;
if(typeof _saveCliente === 'function'){
  window.saveCliente = function(){
    const r = _saveCliente.apply(this, arguments);
    window.__cliEditId = null;
    window.__cliEditSnapshot = null;
    return r;
  };
}

// Ao fechar, pergunta se modificou (e não está forçando nem já confirmado).
const _closeModalCli = window.closeModal;
if(typeof _closeModalCli === 'function'){
  window.closeModal = function(force){
    if(window.__cliEditId && cliModificou() && !force && !window.__cliEditConfirmado){
      const confirmar = typeof window.confirmSistema === 'function' ? window.confirmSistema : null;
      if(confirmar){
        confirmar('Deseja salvar as alterações do cliente antes de sair?', 'Cliente').then(function(ok){
          if(ok){
            window.__cliEditConfirmado = true;
            if(typeof window.saveCliente === 'function') window.saveCliente();
            else { window.__cliEditId = null; _closeModalCli.call(window, true); }
            setTimeout(function(){ window.__cliEditConfirmado = false; }, 400);
          } else {
            window.__cliEditConfirmado = true;
            window.__cliEditId = null;
            window.__cliEditSnapshot = null;
            _closeModalCli.call(window, true);
            setTimeout(function(){ window.__cliEditConfirmado = false; }, 400);
          }
        });
        return;
      }
    }
    // fecha de verdade
    window.__cliEditId = null;
    window.__cliEditSnapshot = null;
    return _closeModalCli.apply(this, arguments);
  };
}

console.log('[DIGICOPY] ajustes_v5193_patch.js');
})();
