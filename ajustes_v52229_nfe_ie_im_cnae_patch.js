// ═══════════════════════════════════════════════════════════════════════════
// v5.22.29 — Dados fiscais da loja: IE, Inscrição Municipal e CNAE
// • Grava em db.config.fiscal. Ainda não emite na SEFAZ.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function soDigitos(v){ return String(v==null?'':v).replace(/\D/g,''); }
function soCnae(v){ return soDigitos(v).slice(0,7); }

function lerFiscal(f){
  f = f || {};
  return {
    ie: txt(f.ie),
    im: txt(f.im || f.inscricaoMunicipal),
    cnae: soCnae(f.cnae || f.cnaeFiscal)
  };
}
function faltaDados(f){
  var d = lerFiscal(f);
  var e = [];
  if(!soDigitos(d.ie)) e.push('Inscrição Estadual da loja');
  if(!txt(d.im)) e.push('Inscrição Municipal da loja');
  if(soCnae(d.cnae).length!==7) e.push('CNAE fiscal da loja (7 números)');
  return e;
}

window.NFE_IE_IM_CNAE_PURE = {
  lerFiscal: lerFiscal,
  faltaDados: faltaDados,
  soCnae: soCnae
};

if(typeof document==='undefined') return;

function fiscalDb(){
  if(typeof db==='undefined') return {};
  db.config = db.config || {};
  db.config.fiscal = db.config.fiscal || {};
  return db.config.fiscal;
}
function esc(v){
  if(typeof escapeHtml==='function') return escapeHtml(v);
  return txt(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
}

function injetarCampos(){
  var ie = document.getElementById('nfe-ie');
  if(!ie || document.getElementById('nfe-im')) return;
  var f = lerFiscal(fiscalDb());
  var labIM = document.createElement('label');
  labIM.className = 'text-[11px] font-bold uppercase text-slate-500';
  labIM.innerHTML = 'Inscrição Municipal<input id="nfe-im" value="'+esc(f.im)+'" class="mt-1 w-full h-10 px-3 rounded-xl border">';
  var labCnae = document.createElement('label');
  labCnae.className = 'text-[11px] font-bold uppercase text-slate-500';
  labCnae.innerHTML = 'CNAE fiscal<input id="nfe-cnae" value="'+esc(f.cnae)+'" class="mt-1 w-full h-10 px-3 rounded-xl border" placeholder="0000000" maxlength="9">';
  var pai = ie.parentNode && ie.parentNode.parentNode;
  if(pai){
    pai.appendChild(labIM);
    pai.appendChild(labCnae);
  }else{
    ie.parentNode.insertAdjacentElement('afterend', labIM);
    labIM.insertAdjacentElement('afterend', labCnae);
  }
}

function wrapSalvar(){
  var btn = document.getElementById('nfe-salvar');
  if(!btn || btn.__v52229) return;
  var old = btn.onclick;
  btn.onclick = function(ev){
    var im = document.getElementById('nfe-im');
    var cnae = document.getElementById('nfe-cnae');
    var ie = document.getElementById('nfe-ie');
    var f = fiscalDb();
    f.ie = txt(ie && ie.value);
    f.im = txt(im && im.value);
    f.cnae = soCnae(cnae && cnae.value);
    f.atualizadoEm = new Date().toISOString();
    if(typeof saveDB==='function') saveDB();
    if(typeof old==='function') return old.call(this, ev);
    if(typeof toast==='function') toast('Dados fiscais salvos. Emissão ainda não está ligada.','success');
  };
  btn.__v52229 = true;
}

if(window.NFE_CONFIG_PURE && typeof window.NFE_CONFIG_PURE.fiscalAtual==='function' && !window.NFE_CONFIG_PURE.fiscalAtual.__v52229){
  var oldF = window.NFE_CONFIG_PURE.fiscalAtual;
  window.NFE_CONFIG_PURE.fiscalAtual = function(){
    var base = oldF.apply(this, arguments) || {};
    var extra = lerFiscal(typeof db!=='undefined' && db.config && db.config.fiscal);
    return Object.assign({}, base, extra);
  };
  window.NFE_CONFIG_PURE.fiscalAtual.__v52229 = true;
}

if(window.NFE_EMISSAO_PURE && typeof window.NFE_EMISSAO_PURE.fiscalPadrao==='function' && !window.NFE_EMISSAO_PURE.fiscalPadrao.__v52229){
  var oldPad = window.NFE_EMISSAO_PURE.fiscalPadrao;
  window.NFE_EMISSAO_PURE.fiscalPadrao = function(f){
    var base = oldPad.apply(this, arguments) || {};
    var extra = lerFiscal(f);
    return Object.assign({}, base, extra);
  };
  window.NFE_EMISSAO_PURE.fiscalPadrao.__v52229 = true;
}

if(window.NFE_EMISSAO_PURE && typeof window.NFE_EMISSAO_PURE.emitenteDe==='function' && !window.NFE_EMISSAO_PURE.emitenteDe.__v52229){
  var oldEm = window.NFE_EMISSAO_PURE.emitenteDe;
  window.NFE_EMISSAO_PURE.emitenteDe = function(loja, fiscal){
    var em = oldEm.apply(this, arguments) || {};
    var extra = lerFiscal(fiscal);
    em.ie = soDigitos(extra.ie || em.ie);
    em.im = txt(extra.im);
    em.cnae = soCnae(extra.cnae);
    return em;
  };
  window.NFE_EMISSAO_PURE.emitenteDe.__v52229 = true;
}

if(window.NFE_EMISSAO_PURE && typeof window.NFE_EMISSAO_PURE.montarDocumento==='function' && !window.NFE_EMISSAO_PURE.montarDocumento.__v52229){
  var oldDoc = window.NFE_EMISSAO_PURE.montarDocumento;
  window.NFE_EMISSAO_PURE.montarDocumento = function(opts){
    var doc = oldDoc.apply(this, arguments);
    var extra = faltaDados((opts&&opts.fiscal) || (typeof db!=='undefined' && db.config && db.config.fiscal) || {});
    if(doc && Array.isArray(doc.erros)){
      extra.forEach(function(m){
        if(doc.erros.indexOf(m)<0) doc.erros.push(m);
      });
      doc.ok = doc.erros.length===0;
    }
    if(doc && doc.emit){
      var f = lerFiscal((opts&&opts.fiscal)||{});
      doc.emit.im = f.im;
      doc.emit.cnae = f.cnae;
    }
    return doc;
  };
  window.NFE_EMISSAO_PURE.montarDocumento.__v52229 = true;
}

if(window.NFE_EMISSAO_PURE && typeof window.NFE_EMISSAO_PURE.montarXml==='function' && !window.NFE_EMISSAO_PURE.montarXml.__v52229){
  var oldXml = window.NFE_EMISSAO_PURE.montarXml;
  window.NFE_EMISSAO_PURE.montarXml = function(doc){
    var xml = oldXml.apply(this, arguments);
    var em = doc && doc.emit || {};
    var extra = '';
    if(txt(em.im)) extra += '<IM>'+txt(em.im).replace(/[<>&]/g,'')+'</IM>';
    if(soCnae(em.cnae).length===7) extra += '<CNAE>'+soCnae(em.cnae)+'</CNAE>';
    if(extra && /<\/IE><CRT>/.test(xml)) xml = xml.replace('</IE><CRT>', '</IE>'+extra+'<CRT>');
    return xml;
  };
  window.NFE_EMISSAO_PURE.montarXml.__v52229 = true;
}

function aplicar(){
  try{
    injetarCampos();
    wrapSalvar();
  }catch(e){}
}

if(typeof window.renderConfig==='function' && !window.renderConfig.__v52229){
  var oldCfg = window.renderConfig;
  window.renderConfig = function(){
    var r = oldCfg.apply(this, arguments);
    setTimeout(aplicar, 240);
    setTimeout(aplicar, 700);
    return r;
  };
  window.renderConfig.__v52229 = true;
}

setTimeout(aplicar, 900);
console.log('[DIGICOPY] v5.22.29 IE, Inscrição Municipal e CNAE');
})();
