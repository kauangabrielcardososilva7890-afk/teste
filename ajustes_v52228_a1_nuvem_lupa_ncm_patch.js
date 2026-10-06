// ═══════════════════════════════════════════════════════════════════════════
// v5.22.28 — A1 da nuvem vale na conferência/assinatura + lupa NCM no meio da caixa
// • Senha só na hora. Ainda não envia à SEFAZ.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function a1DaConfig(){
  if(typeof db==='undefined' || !db.config || !db.config.fiscal) return null;
  var a = db.config.fiscal.a1Nuvem;
  return (a && a.data) ? a : null;
}
function temA1Nuvem(){ return !!a1DaConfig(); }

window.A1_NUVEM_USO_PURE = {
  temA1Nuvem: function(cfg){
    var a = cfg && cfg.fiscal && cfg.fiscal.a1Nuvem;
    return !!(a && a.data);
  }
};

if(typeof document==='undefined') return;

function fiscal(){
  if(typeof db==='undefined') return {};
  db.config = db.config || {};
  db.config.fiscal = db.config.fiscal || {};
  return db.config.fiscal;
}

function pintarStatus(){
  var st = document.getElementById('nfe-cert-status');
  var a1 = a1DaConfig();
  if(st){
    if(a1){
      var quando = a1.enviadoEm ? new Date(a1.enviadoEm).toLocaleString('pt-BR') : '';
      st.textContent = 'Usando A1 da nuvem'+(a1.nome?' • '+a1.nome:'')+(quando?' • '+quando:'')+'. Senha só na hora de assinar. Ainda não emite na SEFAZ.';
    }else{
      st.textContent = 'Nenhum A1 na nuvem neste aparelho. Envie o .pfx na página de envio e sincronize (Nuvem).';
    }
  }
  ['nfe-cert-import','nfe-cert-remove'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.style.display = 'none';
  });
}

function centralizaLupaNcm(inputId, boxId){
  var inp = document.getElementById(inputId);
  if(!inp) return;
  var lupa = document.getElementById(inputId+'-lupa');
  var box = document.getElementById(boxId);
  var hold = inp.closest && inp.closest('[data-ncm-hold]');
  if(!hold){
    hold = document.createElement('div');
    hold.setAttribute('data-ncm-hold','1');
    hold.className = 'relative';
    hold.style.position = 'relative';
    hold.style.display = 'block';
    var pai = inp.parentNode;
    if(!pai) return;
    pai.insertBefore(hold, inp);
    hold.appendChild(inp);
  }
  if(lupa && lupa.parentNode !== hold) hold.appendChild(lupa);
  if(box && box.parentNode !== hold) hold.appendChild(box);
  if(lupa){
    lupa.style.position = 'absolute';
    lupa.style.right = '6px';
    lupa.style.top = '50%';
    lupa.style.transform = 'translateY(-50%)';
    lupa.style.height = '32px';
    lupa.style.width = '32px';
    lupa.style.padding = '0';
    lupa.style.margin = '0';
    lupa.style.display = 'inline-flex';
    lupa.style.alignItems = 'center';
    lupa.style.justifyContent = 'center';
    lupa.style.border = '0';
    lupa.style.borderRadius = '8px';
    lupa.style.background = '#0a1e8a';
    lupa.style.color = '#fff';
    lupa.style.zIndex = '2';
  }
  if(inp.className && !/\bpr-12\b/.test(inp.className)) inp.className += ' pr-12';
}

function aplicarLupa(){
  try{
    centralizaLupaNcm('kp-prd-ncm','kp-prd-ncm-res');
    centralizaLupaNcm('p-ncm','p-ncm-res');
  }catch(e){}
}

if(window.NFE_EMISSAO_PURE && typeof window.NFE_EMISSAO_PURE.montarDocumento==='function' && !window.NFE_EMISSAO_PURE.montarDocumento.__v52228a1){
  var oldDoc = window.NFE_EMISSAO_PURE.montarDocumento;
  window.NFE_EMISSAO_PURE.montarDocumento = function(opts){
    opts = Object.assign({}, opts||{});
    if(temA1Nuvem()) opts.certificadoLocal = true;
    var doc = oldDoc.call(this, opts);
    if(doc && Array.isArray(doc.erros)){
      doc.erros = doc.erros.filter(function(e){
        return !/Certificado A1 só neste computador/i.test(String(e||''));
      });
      if(!temA1Nuvem() && !opts.certificadoLocal){
        doc.erros.unshift('Falta o A1 na nuvem. Envie o .pfx na página de envio e sincronize.');
      }
      doc.ok = doc.erros.length===0;
    }
    return doc;
  };
  window.NFE_EMISSAO_PURE.montarDocumento.__v52228a1 = true;
}

function wrapAssinar(){
  var api = window.nfeCertAPI;
  if(!api || typeof api.assinar!=='function' || api.__v52228a1) return;
  var old = api.assinar;
  api.assinar = function(xml, senha, pfx){
    var a1 = a1DaConfig();
    return old.call(this, xml, senha, pfx || (a1 && a1.data) || '');
  };
  api.__v52228a1 = true;
}

if(typeof window.conferirNfe==='function' && !window.conferirNfe.__v52228a1){
  var oldConf = window.conferirNfe;
  window.conferirNfe = async function(){
    wrapAssinar();
    if(!temA1Nuvem() && window.DIGICOPY_CLOUD_SYNC && typeof window.DIGICOPY_CLOUD_SYNC.tick==='function'){
      try{ await window.DIGICOPY_CLOUD_SYNC.tick('a1-nuvem'); }catch(e){}
    }
    return oldConf.apply(this, arguments);
  };
  window.conferirNfe.__v52228a1 = true;
}

if(typeof window.renderConfig==='function' && !window.renderConfig.__v52228a1){
  var oldCfg = window.renderConfig;
  window.renderConfig = function(){
    var r = oldCfg.apply(this, arguments);
    setTimeout(pintarStatus, 260);
    setTimeout(pintarStatus, 700);
    return r;
  };
  window.renderConfig.__v52228a1 = true;
}

if(typeof window.renderModalProduto==='function' && !window.renderModalProduto.__v52228ncm){
  var oldMod = window.renderModalProduto;
  window.renderModalProduto = function(){
    var r = oldMod.apply(this, arguments);
    setTimeout(aplicarLupa, 70);
    setTimeout(aplicarLupa, 240);
    return r;
  };
  window.renderModalProduto.__v52228ncm = true;
}
if(typeof window.openModal==='function' && !window.openModal.__v52228ncm){
  var oldOpen = window.openModal;
  window.openModal = function(type){
    var r = oldOpen.apply(this, arguments);
    if(type==='produto'){ setTimeout(aplicarLupa, 90); setTimeout(aplicarLupa, 260); }
    return r;
  };
  window.openModal.__v52228ncm = true;
}

wrapAssinar();
setTimeout(wrapAssinar, 800);
setTimeout(pintarStatus, 900);
setTimeout(aplicarLupa, 900);
console.log('[DIGICOPY] v5.22.28 A1 da nuvem + lupa NCM no centro da caixa');
})();
