const fs = require('fs');
const { JSDOM } = require('jsdom');
const idx = fs.readFileSync('./index.html','utf8');
let bodyInner = (idx.match(/<body[^>]*>([\s\S]*)<\/body>/i)||[,''])[1].replace(/<script[\s\S]*?<\/script>/gi,'');
const dom = new JSDOM(`<!DOCTYPE html><html><body>${bodyInner}</body></html>`, { url:'http://localhost/', runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
window.matchMedia = window.matchMedia || function(){ return { matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, onchange:null, dispatchEvent(){return false} }; };
window.scrollTo = function(){}; window.open = function(){ return null; }; window.print = function(){};
window.structuredClone = global.structuredClone;
window.requestAnimationFrame = window.requestAnimationFrame || function(cb){ return setTimeout(cb,0); };
window.fetch = function(){ return Promise.reject(new Error('offline')); };
window.localStorage.setItem('digicopy_session_v42_demo_apresentacao', JSON.stringify({ id:'u1', nome:'ADMIN', cargo:'admin', empresaId:'e1', usuarioNome:'ADMIN' }));
try { window.eval(fs.readFileSync('./app.bundle.js','utf8')); } catch(e){ console.log('eval err:', e.message); }
Object.assign(window.db, { empresaId:'e1', clientes:[{id:'cli1',nome:'Cliente A',documento:'11.111.111/0001-11',telefone:'3899999-0000',endereco:'Rua X, 10',cidade:'Montes Claros',estado:'MG'}], produtos:[{id:'pr1',nome:'Cartucho TN-660',sku:'TN660',preco:150,estoque:5}], vendas:[], os:[] });
try { window.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles:true })); } catch(e){}
const $ = id => window.document.getElementById(id);
window.novaVenda();
setTimeout(function(){
  window.vosVendaSelectCliente('cli1');
  window.__vosForm.itens.push({ tipo:'Produto', descricao:'Cartucho TN-660', sku:'TN660', qtd:1, preco:150, desconto:0, subtotal:150 });
  window.vosRenderItens();
  $('vos-obs').value = 'Deixar na portaria';
  $('vos-prod-search').value = 'papel a4';
  $('vos-item-qtd').value = '2';
  const codigoAntes = $('vos-codigo').textContent;
  console.log('1) venda montada: cliente =', !!window.__vosForm.cliente, '| itens =', window.__vosForm.itens.length, '| obs =', $('vos-obs').value);
  console.log('── abro o cadastro de produto a partir da venda ──');
  var _sel = window.vosVendaSelectCliente;
window.vosVendaSelectCliente = function(){ console.log('dbg sel chamado com:', arguments[0]); return _sel.apply(this, arguments); };
window.novaVenda = (function(nv){ return function(){ console.log('dbg novaVenda rodou'); return nv.apply(this, arguments); }; })(window.novaVenda);
window.openModal('produto');
  setTimeout(function(){
    const temFoto = !!window.__vosVendaPendente;
    console.log('2) foto da venda tirada?', temFoto ? 'SIM OK' : 'NÃO -> FALHA');
    console.log('dbg modal-root html len:', $('modal-root') ? $('modal-root').innerHTML.length : 'SEM ROOT');
    console.log('dbg html snippet:', $('modal-root').innerHTML.slice(0, 300).replace(/\n/g,' '));
    const mhtml = $('modal-root').innerHTML;
    const mi = mhtml.indexOf('f-prd-nome');
    console.log('dbg f-prd-nome no html?', mi >= 0, mhtml.indexOf('Salvar') >= 0 ? 'tem Salvar' : 'sem Salvar');
    console.log('dbg tem f-prd-nome?', !!$('f-prd-nome'), 'modal-title=[' + window.document.getElementById('modal-title').innerText + ']');
    if($('kp-prd-nome')){
      console.log('── SALVO produto (fluxo real do +) ──');
      $('kp-prd-sku').value = 'TT01';
      $('kp-prd-nome').value = 'Toner Compativel Teste';
      $('kp-prd-preco').value = '99.90';
      try { window.salvarProdutoOperacional(''); } catch(e) { console.log('dbg save erro:', String(e && e.message || e)); }
    } else {
    console.log('── CANCELO (closeModal) ──');
      window.closeModal();
    }
    setTimeout(function(){
      const voltouVenda = !!$('vos-codigo');
      console.log('4) voltou pra venda?', voltouVenda ? 'SIM OK' : 'NÃO -> FALHA');
      console.log('5) código da venda preservado?', voltouVenda && $('vos-codigo').textContent === codigoAntes ? 'SIM OK' : 'NÃO -> FALHA ('+(voltouVenda && $('vos-codigo').textContent)+' vs '+codigoAntes+')');
      try { window.vosVendaSelectCliente('cli1'); console.log('dbg após sel direto: nome.innerText=[' + $('vos-cli-nome').innerText + '] textContent=[' + $('vos-cli-nome').textContent + ']'); } catch(e){ console.log('dbg sel ERRO:', e.message); }
      const cliCard = $('vos-cli-selecionado');
      console.log('6) cliente de volta no card?', cliCard && !cliCard.classList.contains('hidden') && $('vos-cli-nome').innerText.indexOf('Cliente A') >= 0 ? 'SIM OK' : 'NÃO -> FALHA | className=[' + (cliCard ? cliCard.className : 'nulo') + '] nome=[' + $('vos-cli-nome').innerText + ']');
      console.log('7) item na lista de itens?', ($('vos-itens-body') && $('vos-itens-body').textContent.indexOf('Cartucho TN-660') >= 0) ? 'SIM OK' : 'NÃO -> FALHA');
      console.log('8) obs preservada?', $('vos-obs') && $('vos-obs').value === 'Deixar na portaria' ? 'SIM OK' : 'NÃO -> FALHA');
      console.log('9) item pela metade (busca)?', $('vos-prod-search') && $('vos-prod-search').value === 'papel a4' ? 'SIM OK' : 'NÃO -> FALHA ('+($('vos-prod-search')&&$('vos-prod-search').value)+')');
      console.log('10) item pela metade (qtd)?', $('vos-item-qtd') && $('vos-item-qtd').value === '2' ? 'SIM OK' : 'NÃO -> FALHA');
      process.exit(0);
    }, 300);
  }, 150);
}, 400);
