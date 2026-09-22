// ═══════════════════════════════════════════════════════════════════════════
// v5.22.20 — Lupa no lugar certo (o filtro auxiliar não pode empurrar o botão)
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function alinhaLupaNoCampo(input){
  if(!input) return;
  var lupa = null;
  var id = input.id||'';
  if(id==='vos-cli-search') lupa = document.getElementById('vos-cli-lupa');
  if(id==='vos-prod-search') lupa = document.getElementById('vos-prod-lupa');
  if(id==='vos-item-cartucho') lupa = document.getElementById('vos-etq-lupa');
  if(!lupa){
    var p = input.parentNode;
    if(p) lupa = p.querySelector('button.absolute, [id$="-lupa"]');
  }
  if(!lupa) return;
  lupa.className = 'absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-2.5 rounded-lg bg-[#0a1e8a] text-white z-10 shrink-0';
  lupa.style.position = 'absolute';
  lupa.style.right = '6px';
  lupa.style.top = '50%';
  lupa.style.transform = 'translateY(-50%)';
  lupa.style.margin = '0';
  if(!/\bpr-/.test(input.className||'')) input.className = (input.className||'')+' pr-12';
}

function tiraFlexQuebrado(el){
  if(!el || !el.classList) return;
  el.classList.remove('flex','flex-wrap','items-center','gap-2');
}

function montaLinha(input, sel){
  if(!input || !sel) return;
  var rowExistente = input.closest && input.closest('[data-filtro-row]');
  if(rowExistente){
    if(sel.parentNode !== rowExistente){
      var hold = rowExistente.querySelector('.relative.flex-1') || rowExistente.lastChild;
      rowExistente.insertBefore(sel, hold);
    }
    alinhaLupaNoCampo(input);
    return;
  }
  if(sel.parentNode && sel.parentNode.getAttribute && sel.parentNode.getAttribute('data-filtro-row')==='1'){
    alinhaLupaNoCampo(input);
    return;
  }
  var pai = input.parentNode;
  if(!pai) return;

  var row = document.createElement('div');
  row.setAttribute('data-filtro-row','1');
  row.className = 'flex items-center gap-2 w-full min-w-0';

  var hold = document.createElement('div');
  hold.className = 'relative flex-1 min-w-0';

  var avo = pai.parentNode;
  if(!avo) return;

  // select + caixa do input (lupa fica DENTRO da caixa, absoluta)
  if(sel.parentNode) sel.parentNode.removeChild(sel);
  sel.className = 'h-10 px-2 rounded-xl border bg-white text-[12px] w-[168px] shrink-0';

  var lupa = null;
  if(input.id==='vos-cli-search') lupa = document.getElementById('vos-cli-lupa');
  if(input.id==='vos-prod-search') lupa = document.getElementById('vos-prod-lupa');
  if(input.id==='vos-item-cartucho') lupa = document.getElementById('vos-etq-lupa');
  if(!lupa && pai.querySelector){
    lupa = Array.prototype.find.call(pai.querySelectorAll('button'), function(b){
      return /lupa|magnifying/i.test(b.id||'') || (b.querySelector && b.querySelector('.ph-magnifying-glass'));
    });
  }

  var resultados = null;
  if(input.id==='vos-cli-search') resultados = document.getElementById('vos-cli-results');
  if(input.id==='vos-prod-search') resultados = document.getElementById('vos-prod-results');

  pai.insertBefore(row, input);
  row.appendChild(sel);
  row.appendChild(hold);
  hold.appendChild(input);
  if(lupa) hold.appendChild(lupa);
  if(resultados && resultados.parentNode){
    // resultados embaixo da linha, largura cheia
    if(row.parentNode) row.parentNode.insertBefore(resultados, row.nextSibling);
  }

  tiraFlexQuebrado(pai);
  if(pai.classList && !pai.classList.contains('relative') && pai.tagName==='LABEL'){
    /* label fica bloco; a linha flex é o row */
  }
  alinhaLupaNoCampo(input);
}

function consertarTudo(){
  [
    ['vos-cli-search','vos-cli-campo'],
    ['vos-prod-search','vos-prod-cat'],
    ['vos-prod-search','vos-rec-campo'],
    ['fin-cli-termo','fin-cli-campo'],
    ['ctr-cli-busca','ctr-cli-campo'],
    ['ctr-cli-busca-simples','ctr-cli-campo-simples'],
    ['ctrd-cli-busca','ctrd-cli-campo'],
    ['ca-busca-cliente','ca-cli-campo'],
    ['nv-cliente-search','nv-cli-campo'],
    ['cv-cliente-search','cv-cli-campo'],
    ['neo-cli-search','neo-cli-campo']
  ].forEach(function(par){
    var inp = document.getElementById(par[0]);
    var sel = document.getElementById(par[1]);
    if(inp && sel) montaLinha(inp, sel);
    else if(inp) alinhaLupaNoCampo(inp);
  });

  // lupas que ficaram soltas no meio da tela
  document.querySelectorAll('#vos-cli-lupa,#vos-prod-lupa,#vos-etq-lupa').forEach(function(b){
    var inp = b.id==='vos-cli-lupa' ? document.getElementById('vos-cli-search')
      : b.id==='vos-prod-lupa' ? document.getElementById('vos-prod-search')
      : document.getElementById('vos-item-cartucho');
    if(inp && b.parentNode !== inp.parentNode){
      inp.parentNode.appendChild(b);
    }
    alinhaLupaNoCampo(inp);
  });
}

if(typeof document==='undefined'){
  window.LUPA_ALINHA_PURE = { ok:true };
  return;
}

window.LUPA_ALINHA_PURE = { ok:true };

['novaVenda','renderModalContrato','openModal','renderFinanceiro'].forEach(function(nome){
  if(typeof window[nome]!=='function' || window[nome].__v52220lupa) return;
  var old = window[nome];
  var wrap = function(){
    var r = old.apply(this, arguments);
    setTimeout(consertarTudo, 80);
    setTimeout(consertarTudo, 220);
    return r;
  };
  wrap.__v52220lupa = true;
  window[nome] = wrap;
});

setTimeout(consertarTudo, 500);
setTimeout(consertarTudo, 1600);

console.log('[DIGICOPY] v5.22.20 lupa alinhada no campo');
})();
