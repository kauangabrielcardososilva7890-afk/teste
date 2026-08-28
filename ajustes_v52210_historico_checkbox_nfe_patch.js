// ═══════════════════════════════════════════════════════════════════════════
// v5.22.10 — caixa + excluir no histórico de leituras; NF-e nas duas listas
// • Histórico de leituras ganha caixa e Excluir (faturada não sai)
// • Pré-visualizar NF-e fica na lista de notinhas e no histórico de leituras
// • A caixa serve para os dois. NF-e só com UMA marcada
// • Não emite, não grava venda/leitura na prévia, não manda SEFAZ
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function low(v){ return txt(v).toLowerCase(); }
function leituraBloqueada(l){
  const st=low(l&&l.status);
  return ['faturado','finalizada','fechada','pago','concluido'].includes(st);
}
function umSoParaNfe(ids){
  const lista=(ids||[]).filter(Boolean);
  if(!lista.length) return {ok:false, motivo:'Marque uma para pré-visualizar a NF-e.'};
  if(lista.length>1) return {ok:false, motivo:'Só pode escolher uma. Desmarque as outras.'};
  return {ok:true, id:lista[0]};
}
function alerta(msg, tit){
  if(typeof window.lfbAlert==='function') window.lfbAlert(msg, tit||'Aviso');
  else if(typeof toast==='function') toast(msg,'info');
}
function idsMarcados(name){
  if(typeof document==='undefined') return [];
  return Array.from(document.querySelectorAll('input[name="'+name+'"]:checked')).map(function(el){ return el.value; }).filter(Boolean);
}
function idDaLinhaLeitura(tr){
  const raw=String(tr.getAttribute('ondblclick')||'');
  const m=raw.match(/abrirLeitura(?:ContratoDetalhe|Definitiva)\('([^']+)'\)/);
  return m?m[1]:'';
}
function contratoDoHistorico(){
  if(window.__lcLeiCtr) return window.__lcLeiCtr;
  const footer=document.getElementById('modal-footer');
  const btn=footer&&footer.querySelector('button[onclick*="openContratoCompleto"]');
  const m=btn&&String(btn.getAttribute('onclick')||'').match(/openContratoCompleto\('([^']+)'\)/);
  return m?m[1]:'';
}
function ehHistoricoLeituras(){
  const t=txt(document.getElementById('modal-title')&&document.getElementById('modal-title').innerText);
  return /Hist[oó]rico de leituras/i.test(t);
}
function botao(id, cls, html, fn){
  const b=document.createElement('button');
  b.id=id; b.type='button'; b.className=cls; b.innerHTML=html; b.onclick=fn;
  return b;
}

function nfeDaSelecao(tipo){
  const name=tipo==='leitura'?'leitura-check-lote':'venda-check-lote';
  let ids=idsMarcados(name);
  if(!ids.length && tipo==='venda'){
    const um=window.neoVendaSelecionada||window.vendaSelecionadaId;
    if(um) ids=[um];
  }
  const r=umSoParaNfe(ids);
  if(!r.ok){ alerta(r.motivo, 'NF-e'); return; }
  if(typeof window.conferirNfe!=='function'){
    alerta('Módulo de NF-e ainda não carregou.','NF-e');
    return;
  }
  window.conferirNfe(tipo, r.id);
}

function excluirLeiturasMarcadas(){
  const ids=idsMarcados('leitura-check-lote');
  if(!ids.length){ alerta('Marque uma leitura para excluir.','Excluir leitura'); return; }
  const alvos=ids.map(function(id){ return ((typeof db!=='undefined'&&db.leituras)||[]).find(function(l){ return l.id===id; }); }).filter(Boolean);
  if(!alvos.length){ alerta('Leitura não encontrada.','Excluir leitura'); return; }
  if(alvos.some(leituraBloqueada)){
    alerta('Não é possível excluir leitura faturada. Estorne primeiro.','Excluir leitura');
    return;
  }
  const cid=contratoDoHistorico();
  const okExcluir=function(){
    const set={};
    alvos.forEach(function(l){ set[l.id]=true; });
    if(typeof db==='undefined') return;
    db.leituras=(db.leituras||[]).filter(function(l){ return !set[l.id]; });
    db.contasReceber=(db.contasReceber||[]).filter(function(cr){ return !set[cr.leituraId]; });
    if(typeof saveDB==='function') saveDB();
    if(typeof abrirLeiturasContrato==='function' && cid) abrirLeiturasContrato(cid);
    if(typeof toast==='function') toast(alvos.length+' leitura(s) excluída(s).','success');
  };
  const msg='Deseja excluir '+alvos.length+' leitura(s)?';
  if(typeof window.confirmSistema==='function'){
    window.confirmSistema(msg,'Excluir leitura').then(function(ok){ if(ok) okExcluir(); });
  } else okExcluir();
}

function limparAtalhoErrado(){
  const viewLei=document.getElementById('view-leituras');
  if(viewLei){
    const b=viewLei.querySelector('#btn-nfe-leitura-lista');
    if(b) b.remove();
  }
  const modalBtn=document.getElementById('btn-nfe-previa-modal');
  if(modalBtn) modalBtn.remove();
}

function injetarVendas(){
  const view=document.getElementById('view-vendas');
  if(!view||view.classList.contains('hidden')) return;
  const actions=view.querySelector('.neo-actions');
  if(!actions) return;
  let b=actions.querySelector('#btn-nfe-venda-lista');
  if(!b){
    b=botao('btn-nfe-venda-lista','neo-btn','<i class="ph ph-file-text"></i>Pré-visualizar NF-e',function(){ nfeDaSelecao('venda'); });
    const excluir=actions.querySelector('#btn-excluir-venda-unificado')||Array.from(actions.querySelectorAll('button')).find(function(x){ return /excluir/i.test(x.textContent||''); });
    if(excluir) actions.insertBefore(b, excluir);
    else actions.appendChild(b);
  } else {
    b.onclick=function(){ nfeDaSelecao('venda'); };
  }
}

function injetarHistoricoLeituras(){
  if(!ehHistoricoLeituras()) return;
  const body=document.getElementById('modal-body');
  const footer=document.getElementById('modal-footer');
  if(!body) return;
  const tabela=body.querySelector('table');
  if(tabela){
    const theadTr=tabela.querySelector('thead tr');
    if(theadTr && !theadTr.querySelector('.th-leitura-lote')){
      const th=document.createElement('th');
      th.className='th-leitura-lote px-2 w-8';
      th.innerHTML='<input type="checkbox" title="Marcar visíveis" onclick="document.querySelectorAll(\'#modal-body input[name=\\\'leitura-check-lote\\\']\').forEach(function(c){ if(c.closest(\'tr\')&&c.closest(\'tr\').style.display===\'none\')return; c.checked=this.checked; }.bind(this))">';
      theadTr.insertBefore(th, theadTr.firstChild);
    }
    tabela.querySelectorAll('tbody tr').forEach(function(tr){
      if(tr.querySelector('.td-leitura-lote')) return;
      const id=idDaLinhaLeitura(tr);
      const td=document.createElement('td');
      td.className='td-leitura-lote px-2 w-8';
      td.innerHTML=id?'<input type="checkbox" name="leitura-check-lote" value="'+id+'" onclick="event.stopPropagation()">':'';
      tr.insertBefore(td, tr.firstChild);
    });
  }
  if(footer){
    if(!footer.querySelector('#btn-excluir-leitura-hist')){
      footer.insertBefore(
        botao('btn-excluir-leitura-hist','neo-btn danger','<i class="ph ph-trash"></i>Excluir',excluirLeiturasMarcadas),
        footer.firstChild
      );
    }
    if(!footer.querySelector('#btn-nfe-leitura-hist')){
      const excluir=footer.querySelector('#btn-excluir-leitura-hist');
      const nfe=botao('btn-nfe-leitura-hist','neo-btn','<i class="ph ph-file-text"></i>Pré-visualizar NF-e',function(){ nfeDaSelecao('leitura'); });
      if(excluir&&excluir.nextSibling) footer.insertBefore(nfe, excluir.nextSibling);
      else footer.appendChild(nfe);
    }
  }
}

function wrap(nome, depois){
  const orig=window[nome];
  if(typeof orig!=='function'||orig.__v52210) return;
  window[nome]=function(){
    const r=orig.apply(this,arguments);
    setTimeout(function(){ try{ depois(); }catch(e){} },90);
    setTimeout(function(){ try{ depois(); }catch(e){} },260);
    return r;
  };
  window[nome].__v52210=true;
}

if(typeof document!=='undefined'){
  wrap('renderVendas', function(){ limparAtalhoErrado(); injetarVendas(); });
  wrap('abrirLeiturasContrato', function(){ limparAtalhoErrado(); injetarHistoricoLeituras(); });
  setTimeout(function(){ try{ limparAtalhoErrado(); injetarVendas(); injetarHistoricoLeituras(); }catch(e){} },900);
}

window.NFE_LISTA_CHECKBOX={
  leituraBloqueada, umSoParaNfe, idsMarcados, nfeDaSelecao, excluirLeiturasMarcadas
};
console.log('[DIGICOPY] v5.22.10 caixa no histórico + NF-e com uma só');
})();
