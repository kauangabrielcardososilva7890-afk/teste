// ═══════════════════════════════════════════════════════════════════════════
// v5.22.34 — Reimportação: produto que já existe só ganha o NCM
// • Não duplica. Não mexe estoque/preço. DEL=S continua pulado.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function soNcm(v){ return String(v==null?'':v).replace(/\D/g,'').slice(0,8); }
function fundirNcm(existente, ncm){
  existente = existente && typeof existente==='object' ? existente : {};
  ncm = soNcm(ncm);
  if(ncm.length!==8) return { mudou:false, rec:existente };
  if(soNcm(existente.ncm)===ncm) return { mudou:false, rec:existente };
  var rec={};
  Object.keys(existente).forEach(function(k){ rec[k]=existente[k]; });
  rec.ncm=ncm;
  return { mudou:true, rec:rec };
}

window.NCM_PRODUTO_EXISTENTE_PURE = {
  soNcm: soNcm,
  fundirNcm: fundirNcm
};

console.log('[DIGICOPY] v5.22.34 NCM no produto que já existe');
})();
