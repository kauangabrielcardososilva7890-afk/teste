// ═══════════════════════════════════════════════════════════════════════════
// v5.22.9 — atalho NF-e no histórico da notinha e da leitura
// • Usa o que estiver selecionado
// • Abre só a pré-visualização. Assinar/emitir continua no passo seguinte
// • Não grava venda, leitura, estoque nem nuvem
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }

function idVendaSel(){
  return window.neoVendaSelecionada || window.vendaSelecionadaId || '';
}
function idLeituraSel(){
  const radio=typeof document!=='undefined'?document.querySelector('input[name="leitura-sel"]:checked'):null;
  return (radio&&radio.value) || window.nfeLeituraSelecionada || '';
}

function nfePreVisualizar(tipo,id){
  if(typeof window.conferirNfe!=='function'){
    toastMsg('Módulo de NF-e ainda não carregou.','error');
    return;
  }
  window.conferirNfe(tipo,id);
}

function nfeAtalhoDoHistorico(tipo){
  const id=tipo==='leitura'?idLeituraSel():idVendaSel();
  if(!id){
    toastMsg(tipo==='leitura'?'Selecione uma leitura no histórico.':'Selecione uma notinha no histórico.','info');
    return;
  }
  nfePreVisualizar(tipo,id);
}

function botao(id,texto,onclick){
  const b=document.createElement('button');
  b.id=id;
  b.type='button';
  b.className='neo-btn';
  b.innerHTML='<i class="ph ph-file-text"></i>'+texto;
  b.onclick=onclick;
  return b;
}

function injetarNaBarra(root,id,texto,fn){
  if(!root||root.querySelector('#'+id)) return;
  const bar=root.querySelector('.neo-actions')||root.querySelector('.classic-toolbar')||root;
  bar.appendChild(botao(id,texto,fn));
}

function injetarVendas(){
  const view=document.getElementById('view-vendas');
  if(!view) return;
  injetarNaBarra(view,'btn-nfe-venda-lista','Pré-visualizar NF-e',function(){ nfeAtalhoDoHistorico('venda'); });
}

function marcarLeituras(){
  const view=document.getElementById('view-leituras');
  if(!view) return;
  view.querySelectorAll('tbody tr').forEach(function(tr){
    const raw=String(tr.getAttribute('ondblclick')||'');
    const m=raw.match(/abrirLeitura(?:Definitiva|ContratoDetalhe)\('([^']+)'\)/);
    if(!m) return;
    tr.onclick=function(){
      window.nfeLeituraSelecionada=m[1];
      view.querySelectorAll('tbody tr').forEach(function(x){ x.classList.remove('neo-selected'); });
      tr.classList.add('neo-selected');
    };
    if(window.nfeLeituraSelecionada===m[1]) tr.classList.add('neo-selected');
  });
}

function injetarLeituras(){
  const view=document.getElementById('view-leituras');
  if(!view) return;
  injetarNaBarra(view,'btn-nfe-leitura-lista','Pré-visualizar NF-e',function(){ nfeAtalhoDoHistorico('leitura'); });
  marcarLeituras();
}

// v5.22.68 — o modal não recebe mais o "Pré-visualizar NF-e": ele fazia a
// mesma coisa que o "Conferir NF-e", que já fica no mesmo rodapé.
function injetarNoModalHistorico(){ /* botão repetido removido */ }

function wrapRender(nome,depois){
  const orig=window[nome];
  if(typeof orig!=='function'||orig.__v5229) return;
  window[nome]=function(){
    const r=orig.apply(this,arguments);
    setTimeout(function(){ try{ depois(); }catch(e){} },60);
    setTimeout(function(){ try{ depois(); }catch(e){} },220);
    return r;
  };
  window[nome].__v5229=true;
}

function wrapModal(nome,tipo){
  const orig=window[nome];
  if(typeof orig!=='function'||orig.__v5229hist) return;
  window[nome]=function(){
    const id=arguments[0];
    const r=orig.apply(this,arguments);
    setTimeout(function(){ try{ injetarNoModalHistorico(tipo,id); }catch(e){} },80);
    setTimeout(function(){ try{ injetarNoModalHistorico(tipo,id); }catch(e){} },240);
    return r;
  };
  window[nome].__v5229hist=true;
}

function rotuloPrevia(){
  const modal=document.getElementById('nfe-conf-modal');
  if(!modal) return;
  const tit=modal.querySelector('b');
  if(tit&&tit.textContent.indexOf('Pré-visualização')<0) tit.textContent='NF-e — pré-visualização';
}

if(typeof document!=='undefined'){
  wrapRender('renderVendas',injetarVendas);
  wrapRender('renderLeituras',injetarLeituras);
  wrapModal('historicoVenda','venda');
  wrapModal('showVenda','venda');
  wrapModal('abrirLeituraDefinitiva','leitura');
  wrapModal('abrirLeituraContratoDetalhe','leitura');
  const origConf=window.conferirNfe;
  if(typeof origConf==='function'&&!origConf.__v5229){
    window.conferirNfe=async function(){
      const r=await origConf.apply(this,arguments);
      setTimeout(function(){ try{ rotuloPrevia(); }catch(e){} },50);
      return r;
    };
    window.conferirNfe.__v5229=true;
  }
  setTimeout(function(){ try{ injetarVendas(); injetarLeituras(); }catch(e){} },800);
}

window.NFE_ATALHO_HISTORICO={
  idVendaSel,idLeituraSel,nfeAtalhoDoHistorico,nfePreVisualizar
};
console.log('[DIGICOPY] v5.22.9 atalho NF-e no histórico');
})();
