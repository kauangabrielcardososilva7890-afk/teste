// ═══════════════════════════════════════════════════════════════════════════
// v5.22.23 — Letras P/S/I/C/E no select: some a opção letra, entra o nome
// • Chip, Original e o resto ficam.
// • Não vira regra de categoria. Conversão de dado fica na 5.22.24 (uma vez).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var LETRAS = {
  p: 'Produto',
  s: 'Serviço',
  i: 'Insumo',
  c: 'Cartucho',
  e: 'Equipamento'
};

function ehLetraFiltro(v){
  var t = String(v==null?'':v).trim();
  return t.length===1 && !!LETRAS[t.toLowerCase()];
}
function letraParaNome(v){
  var t = String(v==null?'':v).trim();
  if(t.length===1 && LETRAS[t.toLowerCase()]) return LETRAS[t.toLowerCase()];
  return t;
}

window.CAT_LETRA_PURE = {
  LETRAS: LETRAS,
  ehLetraFiltro: ehLetraFiltro,
  letraParaNome: letraParaNome
};

if(typeof document==='undefined') return;

function limparOpcoesLetra(){
  ['filter-prod-cat','vos-prod-cat','kp-prd-cat'].forEach(function(id){
    var sel = document.getElementById(id);
    if(!sel) return;
    var atual = String(sel.value||'');
    Array.from(sel.options).forEach(function(o){
      if(ehLetraFiltro(o.value) || ehLetraFiltro(o.textContent)) o.remove();
    });
    if(ehLetraFiltro(atual)){
      var nome = letraParaNome(atual);
      var tem = Array.from(sel.options).some(function(o){ return o.value===nome; });
      if(!tem){
        var opt = document.createElement('option');
        opt.value = nome; opt.textContent = nome;
        sel.appendChild(opt);
      }
      sel.value = nome;
    }
  });
}

function aplicar(){
  try{ limparOpcoesLetra(); }catch(e){}
}

['renderProdutos','novaVenda','openModal'].forEach(function(nome){
  if(typeof window[nome]!=='function' || window[nome].__v52223letra) return;
  var old = window[nome];
  window[nome] = function(){
    var r = old.apply(this, arguments);
    setTimeout(aplicar, 40);
    return r;
  };
  window[nome].__v52223letra = true;
});

setTimeout(aplicar, 500);
setTimeout(aplicar, 1600);
console.log('[DIGICOPY] v5.22.23 letras só no select (sem regra de categoria)');
})();
