// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.22.95 — a venda em andamento sempre te espera
//
// Pedido do usuário: dentro da venda, se ele abrir QUALQUER COISA (cadastrar
// produto no "+", cliente, impressora...), ao fechar aquilo — salvando OU
// cancelando — a tela tem que voltar PRA VENDA que ele estava montando, com
// TUDO intacto: cliente, itens, descontos, observação, data/hora e até o
// item que ele estava digitando pela metade.
//
// Como funciona (simples e à prova de ordem de carregamento — este arquivo
// fica por último no bundle):
// 1) No openModal: se a venda nova está na tela (o código vos-codigo está
//    visível no modal), o sistema tira uma FOTO da venda antes da outra
//    tela tomar o lugar (guarda em window.__vosVendaPendente).
// 2) No closeModal: se tem foto pendente, remonta a venda com a foto e
//    devolve ela pro lugar. Salvar e cancelar passam por closeModal, então
//    os dois voltam igual.
// 3) Finalizar a venda não toma foto (nenhuma outra tela foi aberta), então
//    fechar a venda continua fechando normal.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function vendaNaTela(){
  var b = document.getElementById('vos-codigo');
  if(!b) return false;
  var root = document.getElementById('modal-root');
  return !!(root && !root.classList.contains('hidden'));
}

function val(id){ var el = document.getElementById(id); return el ? el.value : null; }
function porVal(id, v){ if(v == null) return; var el = document.getElementById(id); if(el) el.value = v; }

function tirarFoto(){
  var campos = {};
  ['vos-cli-search','vos-destino','vos-data-saida','vos-prazo-entrega',
   'vos-obs','vos-desc-venda','vos-os-valor','vos-os-desc',
   'vos-item-tipo','vos-prod-search','vos-item-qtd','vos-item-vunit','vos-item-desc','vos-item-total',
   'vos-item-cartucho','vos-item-identificacao','vos-item-tecnico'
  ].forEach(function(id){ campos[id] = val(id); });
  var abaOs = document.getElementById('vos-aba-os');
  var extra = document.getElementById('vos-item-extra');
  return {
    form: (window.__vosForm ? JSON.parse(JSON.stringify(window.__vosForm)) : null),
    codigoTexto: (document.getElementById('vos-codigo')||{}).textContent || '',
    titulo: (document.getElementById('modal-title')||{}).textContent || 'Nova venda / Notinha',
    abaOs: !!(abaOs && !abaOs.classList.contains('hidden')),
    extraAberto: !!(extra && !extra.classList.contains('hidden')),
    campos: campos
  };
}

function devolverVenda(){
  var foto = window.__vosVendaPendente;
  if(!foto) return;
  window.__vosVendaPendente = null;
  if(typeof window.novaVenda !== 'function' || !foto.form) return;
  window.novaVenda(); // reconstrói a tela e todas as amarrações
  window.__vosForm = foto.form; // tudo que estava no formulário volta
  var cod = document.getElementById('vos-codigo');
  if(cod && foto.codigoTexto) cod.textContent = foto.codigoTexto;
  var tit = document.getElementById('modal-title');
  if(tit && foto.titulo) tit.textContent = foto.titulo;
  if(foto.form.cliente && foto.form.cliente.id && typeof window.vosVendaSelectCliente === 'function'){
    window.vosVendaSelectCliente(foto.form.cliente.id);
  }
  Object.keys(foto.campos || {}).forEach(function(id){ porVal(id, foto.campos[id]); });
  if(typeof window.vosRenderItens === 'function') window.vosRenderItens();
  if(typeof window.vosItemCalcTotal === 'function') window.vosItemCalcTotal();
  if(typeof window.vosResumoVenda === 'function') window.vosResumoVenda();
  if(typeof window.vosOsRuleHint === 'function') { try{ window.vosOsRuleHint(); }catch(e){} }
  if(foto.abaOs && typeof window.vosSetAba === 'function') { try{ window.vosSetAba('os'); }catch(e){} }
  var ps = document.getElementById('vos-prod-search');
  if(ps) ps.focus();
}

// 1) Fotografa a venda quando QUALQUER outro modal abre a partir dela
if(typeof window.openModal === 'function' && !window.openModal.__v52295){
  var _open = window.openModal;
  window.openModal = function(){
    try{
      if(vendaNaTela() && !window.__vosVendaPendente){
        window.__vosVendaPendente = tirarFoto();
      }
    }catch(e){}
    return _open.apply(this, arguments);
  };
  window.openModal.__v52295 = true;
}

// 2) Devolve a venda quando qualquer modal fecha (salvar OU cancelar)
if(typeof window.closeModal === 'function' && !window.closeModal.__v52295){
  var _close = window.closeModal;
  window.closeModal = function(){
    var r = _close.apply(this, arguments);
    if(window.__vosVendaPendente){ try{ setTimeout(devolverVenda, 40); }catch(e){} }
    return r;
  };
  window.closeModal.__v52295 = true;
}

// Telas que fecham SEM passar por closeModal (caso exista alguma): um olho
// leve percebe o modal sumido com a venda pendente e devolve mesmo assim.
if(typeof document !== 'undefined'){
  setInterval(function(){
    if(!window.__vosVendaPendente) return;
    var root = document.getElementById('modal-root');
    if(root && root.classList.contains('hidden')) devolverVenda();
  }, 900);
}

window.__V52295_PURE = { tirarFoto: tirarFoto, devolverVenda: devolverVenda };
})();
