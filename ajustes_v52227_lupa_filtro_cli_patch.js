// ═══════════════════════════════════════════════════════════════════════════
// v5.22.27 — Some a lupa enfeite em cima do filtro de cliente
// • A lupa de pesquisar (botão) fica. Some só o ícone absoluto que cobria o select.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function ehEnfeite(el){
  if(!el || el.tagName!=='I') return false;
  if(!/ph-magnifying-glass/.test(el.className||'')) return false;
  if(/absolute/.test(el.className||'') || (el.style && el.style.position==='absolute')) return true;
  return false;
}
function tiraLupaEnfeite(){
  var ids = ['vos-cli-campo','fin-cli-campo','ctr-cli-campo','ctr-cli-campo-simples','ctrd-cli-campo','ca-cli-campo','nv-cli-campo','cv-cli-campo','neo-cli-campo'];
  ids.forEach(function(id){
    var sel = document.getElementById(id);
    if(!sel) return;
    var row = sel.closest && sel.closest('[data-filtro-row]');
    var pai = (row && row.parentNode) || sel.parentNode;
    if(!pai || !pai.querySelectorAll) return;
    Array.prototype.slice.call(pai.querySelectorAll('i.ph-magnifying-glass, i.ph.ph-magnifying-glass')).forEach(function(ic){
      if(ehEnfeite(ic)) ic.remove();
    });
  });
  document.querySelectorAll('#vos-cli-search, #nv-cliente-search, #fin-cli-termo, #cv-cliente-search, #neo-cli-search, #ca-busca-cliente, #ctr-cli-busca, #ctr-cli-busca-simples, #ctrd-cli-busca').forEach(function(inp){
    var p = inp && inp.parentNode;
    if(!p || !p.querySelectorAll) return;
    var temFiltro = p.querySelector('select[data-filtro-aux], select[id$="-campo"], [data-filtro-row]')
      || (p.parentNode && p.parentNode.querySelector && p.parentNode.querySelector('select[data-filtro-aux], select[id$="-campo"]'));
    if(!temFiltro) return;
    Array.prototype.slice.call(p.querySelectorAll('i.ph-magnifying-glass, i.ph.ph-magnifying-glass')).forEach(function(ic){
      if(ehEnfeite(ic)) ic.remove();
    });
    if(p.parentNode && p.parentNode.querySelectorAll){
      Array.prototype.slice.call(p.parentNode.querySelectorAll(':scope > i.ph-magnifying-glass, :scope > i.ph.ph-magnifying-glass')).forEach(function(ic){
        if(ehEnfeite(ic)) ic.remove();
      });
    }
  });
}

window.LUPA_FILTRO_CLI_PURE = { ehEnfeite: ehEnfeite };

if(typeof document==='undefined') return;

['novaVenda','openModal','renderFinanceiro','renderModalContrato'].forEach(function(nome){
  if(typeof window[nome]!=='function' || window[nome].__v52227lupa) return;
  var old = window[nome];
  window[nome] = function(){
    var r = old.apply(this, arguments);
    setTimeout(tiraLupaEnfeite, 90);
    setTimeout(tiraLupaEnfeite, 280);
    return r;
  };
  window[nome].__v52227lupa = true;
});

setTimeout(tiraLupaEnfeite, 600);
setTimeout(tiraLupaEnfeite, 1800);
console.log('[DIGICOPY] v5.22.27 lupa enfeite do filtro de cliente removida');
})();
