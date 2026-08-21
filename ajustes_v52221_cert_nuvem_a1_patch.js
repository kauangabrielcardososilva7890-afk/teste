// ═══════════════════════════════════════════════════════════════════════════
// v5.22.21 — A1 .pfx na nuvem (sem senha) + some o carregamento local
// • Senha continua só na hora de assinar. Ainda não envia à SEFAZ.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var MAX_BYTES = 400 * 1024;
var TIPOS_A1 = ['pfx','p12'];

function extDe(nome){
  var m = String(nome||'').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}
function podeEnviarA1(nome, bytes){
  var ext = extDe(nome);
  if(TIPOS_A1.indexOf(ext) < 0) return { ok:false, motivo:'tipo' };
  if(bytes > MAX_BYTES) return { ok:false, motivo:'tamanho' };
  if(!(bytes > 0)) return { ok:false, motivo:'vazio' };
  return { ok:true, ext:ext };
}
function a1DaConfig(cfg){
  var f = cfg && cfg.fiscal;
  var a = f && f.a1Nuvem;
  if(!a || !a.data) return null;
  return a;
}
function pfxB64De(a1){
  if(!a1 || !a1.data) return '';
  return String(a1.data).replace(/^data:[^;]+;base64,/, '');
}

window.CERT_A1_NUVEM_PURE = {
  MAX_BYTES: MAX_BYTES,
  TIPOS_A1: TIPOS_A1.slice(),
  extDe: extDe,
  podeEnviarA1: podeEnviarA1,
  a1DaConfig: a1DaConfig,
  pfxB64De: pfxB64De
};

if(typeof document === 'undefined') return;

function toastMsg(m,t){ if(typeof toast === 'function') toast(m, t||'info'); }
function fiscal(){
  if(typeof db === 'undefined') return {};
  db.config = db.config || {};
  db.config.fiscal = db.config.fiscal || {};
  return db.config.fiscal;
}
function temA1Nuvem(){ return !!a1DaConfig({ fiscal: fiscal() }); }

function esconderCarregarLocal(){
  ['nfe-cert-import','nfe-cert-remove'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.style.display = 'none';
  });
  var st = document.getElementById('nfe-cert-status');
  if(!st) return;
  var a1 = a1DaConfig({ fiscal: fiscal() });
  if(a1){
    var quando = a1.enviadoEm ? new Date(a1.enviadoEm).toLocaleString('pt-BR') : '';
    st.textContent = 'A1 na nuvem'+(a1.nome?' • '+a1.nome:'')+(quando?' • '+quando:'')+'. Senha só na hora de assinar. Ainda não emite na SEFAZ.';
  }else{
    st.textContent = 'Nenhum A1 na nuvem. Envie o .pfx pela página de envio de arquivos.';
  }
}

async function apagarA1LocalSeHouver(){
  var api = window.nfeCertAPI;
  if(!api || typeof api.remover !== 'function') return;
  if(!temA1Nuvem()) return;
  try{ await api.remover(); }catch(e){}
}

function ajustarCard(){
  esconderCarregarLocal();
  var p = document.querySelector('#nfe-config-card p');
  if(p && !p.dataset.v52221a1){
    p.dataset.v52221a1 = '1';
    p.textContent = 'Ainda não emite nota na SEFAZ. O A1 sobe pela página de envio. Senha só na hora de assinar.';
  }
  var pub = document.getElementById('nfe-certs-nuvem');
  if(pub) pub.style.display = 'none';
}

if(typeof window.renderConfig === 'function' && !window.renderConfig.__v52221a1){
  var old = window.renderConfig;
  window.renderConfig = function(){
    var r = old.apply(this, arguments);
    setTimeout(ajustarCard, 240);
    setTimeout(ajustarCard, 700);
    setTimeout(apagarA1LocalSeHouver, 800);
    return r;
  };
  window.renderConfig.__v52221a1 = true;
}

if(window.NFE_EMISSAO_PURE && typeof window.NFE_EMISSAO_PURE.montarDocumento === 'function' && !window.NFE_EMISSAO_PURE.montarDocumento.__v52221a1){
  var oldDoc = window.NFE_EMISSAO_PURE.montarDocumento;
  window.NFE_EMISSAO_PURE.montarDocumento = function(opts){
    opts = Object.assign({}, opts||{});
    if(temA1Nuvem()) opts.certificadoLocal = true;
    return oldDoc.call(this, opts);
  };
  window.NFE_EMISSAO_PURE.montarDocumento.__v52221a1 = true;
}

if(window.nfeCertAPI && typeof window.nfeCertAPI.assinar === 'function' && !window.nfeCertAPI.__v52221a1){
  var oldAssinar = window.nfeCertAPI.assinar;
  window.nfeCertAPI.assinar = function(xml, senha){
    var a1 = a1DaConfig({ fiscal: fiscal() });
    return oldAssinar(xml, senha, a1 ? a1.data : '');
  };
  window.nfeCertAPI.__v52221a1 = true;
}

setTimeout(ajustarCard, 900);
setTimeout(apagarA1LocalSeHouver, 1200);
console.log('[DIGICOPY] v5.22.21 A1 na nuvem, sem senha gravada');
})();
