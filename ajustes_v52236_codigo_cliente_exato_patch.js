// ═══════════════════════════════════════════════════════════════════════════
// v5.22.36 — Filtro Código do cliente é exato
// • 48 acha só 48. Não pega 480, 481, 1048.
// • 048 e 48 são o mesmo código.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function soDigitos(v){ return String(v==null?'':v).replace(/\D/g,''); }
function codigoNorm(v){
  var d=soDigitos(v);
  if(!d) return '';
  return d.replace(/^0+/,'') || '0';
}
function codigoIgual(cadastro, busca){
  var alvo=codigoNorm(busca);
  if(!alvo) return false;
  return codigoNorm(cadastro)===alvo;
}
function filtraCodigoExato(list, q, campo){
  if(String(campo||'')!=='codigo') return null;
  var alvo=codigoNorm(q);
  if(!alvo) return list||[];
  return (list||[]).filter(function(c){
    if(!c) return false;
    return codigoIgual(c.codigo, q) || codigoIgual(c.codigoAntigo, q);
  });
}

window.CODIGO_CLIENTE_EXATO_PURE = {
  codigoNorm: codigoNorm,
  codigoIgual: codigoIgual,
  filtraCodigoExato: filtraCodigoExato
};

if(typeof document==='undefined') return;

function wrap(obj, nome){
  if(!obj || typeof obj[nome]!=='function' || obj[nome].__v52236) return;
  var old=obj[nome];
  obj[nome]=function(list, q, campo){
    var exato=filtraCodigoExato(list, q, campo);
    if(exato) return exato;
    return old.apply(this, arguments);
  };
  obj[nome].__v52236=true;
}

wrap(window.CLI_PURE, 'filtraClientes');
wrap(window.FILTROS_BUSCA_PURE, 'filtraClientes');
setTimeout(function(){
  wrap(window.CLI_PURE, 'filtraClientes');
  wrap(window.FILTROS_BUSCA_PURE, 'filtraClientes');
}, 400);

console.log('[DIGICOPY] v5.22.36 código do cliente é exato');
})();
