// PATCH v5.18.4 — Correções: 1.2 peças nos chamados e 2.3 fechar leitura
(function(){
'use strict';

function low(v){ return String(v ?? '').toLowerCase().trim(); }
function txt(v){ return String(v ?? '').trim(); }
function n(v,fb=0){ const x=Number(String(v ?? '').replace(',','.')); return Number.isFinite(x)?x:fb; }
function money(v){ return typeof fmtMoney==='function' ? fmtMoney(n(v)) : ('R$ '+n(v).toFixed(2).replace('.',',')); }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function confirmar(msg,titulo){
  if(typeof confirmSistema==='function') return confirmSistema(msg,titulo||'Confirmar');
  if(typeof window.lfbAlert==='function') return window.lfbAlert(msg,titulo||'Confirmar');
  return Promise.resolve(window.confirm(msg));
}

// ── 1.2: Garantir peças nos chamados (contrato e avulso) ──

function normItem(it){
  const qtd=Math.max(1,n(it.qtd,1));
  const preco=n(it.preco,0);
  const desconto=Math.max(0,n(it.desconto,0));
  return Object.assign({},it,{qtd,preco,desconto,subtotal:Math.max(0,qtd*preco-desconto)});
}

window.__lcPecaSel=null;

function htmlPecas(prefix){
  return `<div class="rounded-xl border p-3 bg-[#f8f9ff]" id="${prefix}-pecas-box">
    <p class="font-bold text-slate-700 mb-2">Produtos / Peças usadas</p>
    <div class="grid grid-cols-12 gap-2 items-end">
      <label class="col-span-12 md:col-span-5 text-[11px] font-bold uppercase text-slate-500 relative">Descrição ou código
        <div class="flex gap-1 mt-1">
          <input id="${prefix}-prod-search" class="flex-1 h-10 px-3 rounded-xl border bg-white" placeholder="Nome, código, ref. — Enter ou lupa" autocomplete="off">
          <button type="button" id="${prefix}-prod-lupa" class="h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i></button>
        </div>
        <div id="${prefix}-prod-results" class="hidden absolute z-30 left-0 right-0 mt-1 max-h-[220px] overflow-auto rounded-xl border bg-white shadow-xl"></div>
      </label>
      <label class="col-span-3 md:col-span-1 text-[11px] font-bold uppercase text-slate-500">Qtd
        <input id="${prefix}-prod-qtd" type="number" min="1" value="1" oninput="lcPecaCalc('${prefix}')" class="mt-1 w-full h-10 px-2 rounded-xl border bg-white"></label>
      <label class="col-span-4 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Valor
        <input id="${prefix}-prod-preco" type="number" step="0.01" value="" oninput="lcPecaCalc('${prefix}')" class="mt-1 w-full h-10 px-2 rounded-xl border bg-white"></label>
      <label class="col-span-3 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Desc. R$
        <input id="${prefix}-prod-desc" type="number" step="0.01" value="0" oninput="lcPecaCalc('${prefix}')" class="mt-1 w-full h-10 px-2 rounded-xl border bg-white"></label>
      <label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Valor final
        <input id="${prefix}-prod-total" readonly class="mt-1 w-full h-10 px-2 rounded-xl border bg-slate-100 font-bold"></label>
    </div>
    <div class="flex justify-end mt-2">
      <button type="button" onclick="lcAddPecaManual('${prefix}')" class="h-10 px-5 rounded-xl bg-emerald-600 text-white font-bold">Adicionar item</button>
    </div>
    <div id="${prefix}-pecas-list" class="mt-3"></div>
  </div>`;
}

window.lcPecaCalc=function(prefix){
  const qtd=n(document.getElementById(prefix+'-prod-qtd')?.value,0);
  const vu=n(document.getElementById(prefix+'-prod-preco')?.value,0);
  const de=n(document.getElementById(prefix+'-prod-desc')?.value,0);
  const el=document.getElementById(prefix+'-prod-total');
  if(el) el.value=money(Math.max(0,qtd*vu-de));
};

window.lcBuscarPeca=function(prefix){
  if(arguments.length>1) return;
  const inp=document.getElementById(prefix+'-prod-search');
  const res=document.getElementById(prefix+'-prod-results');
  if(!res) return;
  const q=low(inp&&inp.value);
  if(!q){ res.classList.add('hidden'); res.innerHTML=''; return; }
  let lista=(db.produtos||[]).filter(p=>p.status!=='inativo'&&p.status!=='excluido');
  lista=lista.filter(p=>[p.nome,p.sku,p.codigo,p.categoria,p.fabricante].some(v=>low(v).includes(q))).slice(0,20);
  if(!lista.length){
    res.innerHTML='<p class="p-3 text-[12px] text-slate-400">Nenhum item — a descrição digitada pode ser usada no Adicionar</p>';
    res.classList.remove('hidden'); return;
  }
  const esc=function(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||'')); };
  res.innerHTML=lista.map(p=>`<div class="px-3 py-2 border-b hover:bg-blue-50 cursor-pointer" onmousedown="event.preventDefault();lcSelPeca('${prefix}','${p.id}');lcPecaCalc('${prefix}')"><b>${esc(p.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(p.sku||p.codigo||'')} • est ${n(p.estoque)} • <b>${money(p.preco)}</b></span></div>`).join('');
  res.classList.remove('hidden');
};

window.lcSelPeca=function(prefix,prodId){
  const p=(db.produtos||[]).find(x=>x.id===prodId); if(!p) return;
  window.__lcPecaSel=p;
  const inp=document.getElementById(prefix+'-prod-search'); if(inp) inp.value=p.nome||'';
  const pr=document.getElementById(prefix+'-prod-preco'); if(pr) pr.value=p.preco||0;
  const res=document.getElementById(prefix+'-prod-results'); if(res){ res.classList.add('hidden'); res.innerHTML=''; }
  window.lcPecaCalc(prefix);
};

window.lcAddPecaManual=function(prefix){
  const esc=function(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||'')); };
  const desc=String(document.getElementById(prefix+'-prod-search')?.value||'').trim();
  const p=window.__lcPecaSel;
  if(!p && !desc){ toastMsg('Selecione um produto ou escreva a descrição','error'); return; }
  const qtd=Math.max(1,n(document.getElementById(prefix+'-prod-qtd')?.value,1));
  const preco=n(document.getElementById(prefix+'-prod-preco')?.value, p?n(p.preco):0);
  const desconto=Math.max(0,n(document.getElementById(prefix+'-prod-desc')?.value,0));
  window.__chamadoPecasTemp=window.__chamadoPecasTemp||[];
  window.__chamadoPecasTemp.push(normItem({
    produtoId:p?p.id:null,
    descricao:p?(p.nome||''):desc,
    qtd,preco,desconto
  }));
  window.__lcPecaSel=null;
  const inp=document.getElementById(prefix+'-prod-search'); if(inp) inp.value='';
  const q=document.getElementById(prefix+'-prod-qtd'); if(q) q.value=1;
  const pr=document.getElementById(prefix+'-prod-preco'); if(pr) pr.value='';
  const d=document.getElementById(prefix+'-prod-desc'); if(d) d.value=0;
  window.lcPecaCalc(prefix);
  window.lcRenderPecas(prefix);
};

window.lcRenderPecas=function(prefix){
  const esc=function(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||'')); };
  const cont=document.getElementById(prefix+'-pecas-list'); if(!cont) return;
  const itens=window.__chamadoPecasTemp||[];
  if(!itens.length){ cont.innerHTML='<p class="text-[12px] text-slate-400 text-center py-2">Nenhum produto lançado</p>'; return; }
  cont.innerHTML=`<div class="overflow-auto rounded-xl border bg-white"><table class="w-full text-[11px]"><thead class="bg-slate-50"><tr>
    <th class="text-left px-2 py-1">Descrição</th><th>Qtd</th><th>Valor</th><th>Desc.</th><th>Final</th><th></th>
  </tr></thead><tbody>${itens.map((raw,i)=>{
    const it=normItem(raw);
    return `<tr class="border-t">
      <td class="px-2 py-1"><b>${esc(it.descricao||'')}</b></td>
      <td class="text-center">${it.qtd}</td>
      <td class="text-right">${money(it.preco)}</td>
      <td class="text-right">${money(it.desconto)}</td>
      <td class="text-right font-bold">${money(it.subtotal)}</td>
      <td><button type="button" data-lc-del="${prefix}:${i}" class="lc-peca-del h-7 px-2 rounded-lg bg-red-50 text-red-600 font-bold">Tirar</button></td>
    </tr>`;
  }).join('')}</tbody></table></div>
  <p class="text-right font-bold text-[#0a1e8a] mt-2">Total: ${money(itens.reduce((s,it)=>s+n(normItem(it).subtotal),0))}</p>`;
  
  // Adicionar eventos de remover
  cont.querySelectorAll('.lc-peca-del').forEach(btn=>{
    btn.onclick=function(){
      const idx=parseInt(this.dataset.lcDel?.split(':')[1]);
      if(isNaN(idx)) return;
      window.__chamadoPecasTemp.splice(idx,1);
      window.lcRenderPecas(prefix);
    };
  });
}

function injetarPecas(prefix){
  // Procura o container onde injetar as peças
  const modalBody=document.getElementById('modal-body');
  const existing=document.getElementById(prefix+'-pecas-box');
  if(existing) return; // Já existe
  
  if(!modalBody) return;
  
  // Injeta o HTML de peças antes do footer do modal
  const footer=document.getElementById('modal-footer');
  const pecasDiv=document.createElement('div');
  pecasDiv.innerHTML=htmlPecas(prefix);
  
  if(footer && footer.parentNode){
    footer.parentNode.insertBefore(pecasDiv.firstChild, footer);
  } else {
    modalBody.appendChild(pecasDiv.firstChild);
  }
  
  // Configura eventos
  const inp=document.getElementById(prefix+'-prod-search');
  const lupa=document.getElementById(prefix+'-prod-lupa');
  if(inp){
    inp.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); window.lcBuscarPeca(prefix); } };
  }
  if(lupa) lupa.onclick=function(ev){ ev.preventDefault(); window.lcBuscarPeca(prefix); };
  
  // Calcula inicial
  window.lcPecaCalc(prefix);
  window.lcRenderPecas(prefix);
}

// Observer para detectar quando o modal de chamado é aberto
function observarModais(){
  const observer=new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      if(m.type==='childList' || m.type==='attributes'){
        // Verifica se estamos em um modal de chamado
        const body=document.getElementById('modal-body');
        if(!body) return;
        
        const title=low(document.getElementById('modal-title')?.textContent||'');
        const isChamado=title.includes('chamado') || title.includes('os ') || title.includes('ordem');
        
        if(isChamado){
          // Tenta injetar peças para chamado de contrato (ko) e avulso (ca)
          setTimeout(()=>injetarPecas('ko'),50);
          setTimeout(()=>injetarPecas('ca'),100);
        }
      }
    });
  });
  
  const modalRoot=document.getElementById('modal-root');
  if(modalRoot){
    observer.observe(modalRoot, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
  }
}

// Hook nas funções de abertura de chamado
function hooksChamados(){
  // Hook para openModalChamadoCompleto
  const origOpen=window.openModalChamadoCompleto;
  if(typeof origOpen==='function' && !origOpen.__v5184pecas){
    window.openModalChamadoCompleto=function(){
      const r=origOpen.apply(this,arguments);
      setTimeout(()=>injetarPecas('ko'),100);
      setTimeout(()=>injetarPecas('ko'),250);
      return r;
    };
    window.openModalChamadoCompleto.__v5184pecas=true;
  }
  
  // Hook para abrirChamadoAvulsoForm
  const origAv=window.abrirChamadoAvulsoForm;
  if(typeof origAv==='function' && !origAv.__v5184pecas){
    window.abrirChamadoAvulsoForm=function(){
      const r=origAv.apply(this,arguments);
      setTimeout(()=>injetarPecas('ca'),100);
      setTimeout(()=>injetarPecas('ca'),250);
      return r;
    };
    window.abrirChamadoAvulsoForm.__v5184pecas=true;
  }
}

// Hook para salvar chamado (salvar peças)
function hooksSalvarChamado(){
  const origSalvar=window.salvarChamadoCompleto;
  if(typeof origSalvar==='function' && !origSalvar.__v5184pecas){
    window.salvarChamadoCompleto=function(){
      const pecas=(window.__chamadoPecasTemp||[]).map(normItem);
      const r=origSalvar.apply(this,arguments);
      const cid=arguments[1]||(window.modalContext&&window.modalContext.contratoId);
      let o=arguments[0]&&(db.os||[]).find(x=>x.id===arguments[0]);
      if(!o) o=(db.os||[]).slice().reverse().find(x=>x.contratoId===cid);
      if(o){ o.pecas=pecas; salvar(); }
      return r;
    };
    window.salvarChamadoCompleto.__v5184pecas=true;
  }
  
  const origSalvarAv=window.salvarChamadoAvulso;
  if(typeof origSalvarAv==='function' && !origSalvarAv.__v5184pecas){
    window.salvarChamadoAvulso=function(){
      const pecas=(window.__chamadoPecasTemp||[]).map(normItem);
      const r=origSalvarAv.apply(this,arguments);
      let o=arguments[0]&&(db.os||[]).find(x=>x.id===arguments[0]);
      if(!o) o=(db.os||[]).slice(-1)[0];
      if(o){ o.pecas=pecas; salvar(); }
      return r;
    };
    window.salvarChamadoAvulso.__v5184pecas=true;
  }
}

// ── 2.3: Fechar leitura pede confirmação (X, ESC, Voltar) ──

let bypassClose=false;

function ehModalLeituraAberta(){
  // Verifica se estamos em um modal de leitura que NÃO é o histórico
  const title=low(document.getElementById('modal-title')?.textContent||'');
  // É leitura se o título contém "leitura" mas NÃO contém "histórico" nem "contrato" sozinho
  const ehLeitura=title.includes('leitura ');
  const ehHistorico=title.includes('histórico') || title.includes('historico');
  return ehLeitura && !ehHistorico;
}

function fecharComConfirmacao(){
  if(bypassClose) return;
  if(!ehModalLeituraAberta()) return false;
  
  bypassClose=true;
  return confirmar('Deseja salvar a leitura antes de fechar?','Fechar leitura').then(ok=>{
    if(ok) salvar();
    bypassClose=false;
    return ok;
  });
}

// Hook em closeModal
const origClose=window.closeModal;
if(typeof origClose==='function' && !origClose.__v5184fechar){
  window.closeModal=function(){
    if(ehModalLeituraAberta()){
      return fecharComConfirmacao().then(ok=>{
        if(ok) origClose.apply(this,arguments);
      });
    }
    return origClose.apply(this,arguments);
  };
  window.closeModal.__v5184fechar=true;
}

// Hook em fecharOuVoltar
const origVoltar=window.fecharOuVoltar;
if(typeof origVoltar==='function' && !origVoltar.__v5184fechar){
  window.fecharOuVoltar=function(){
    if(ehModalLeituraAberta()){
      return fecharComConfirmacao().then(ok=>{
        if(ok) origVoltar.apply(this,arguments);
      });
    }
    return origVoltar.apply(this,arguments);
  };
  window.fecharOuVoltar.__v5184fechar=true;
}

// Captura ESC via keydown
document.addEventListener('keydown',function(ev){
  if(ev.key==='Escape' && ehModalLeituraAberta()){
    ev.preventDefault();
    ev.stopPropagation();
    fecharComConfirmacao().then(ok=>{
      if(ok && typeof window.closeModal==='function') window.closeModal();
    });
  }
},true);

// Captura click no X do modal
document.addEventListener('click',function(ev){
  const target=ev.target;
  // Verifica se clicou no X (botão de fechar do modal)
  if(target && (target.classList?.contains('modal-x') || target.closest('.modal-x') || 
      target.textContent?.includes('×') || target.title?.toLowerCase().includes('fechar'))){
    if(ehModalLeituraAberta()){
      ev.preventDefault();
      ev.stopPropagation();
      fecharComConfirmacao();
    }
  }
},true);

// ── Inicialização ──

function init(){
  hooksChamados();
  hooksSalvarChamado();
  setTimeout(observarModais,500);
  setTimeout(hooksChamados,1000);
  setTimeout(hooksChamados,2000);
}

// Executa após DOM carregado
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
} else {
  setTimeout(init,100);
}

console.log('[DIGICOPY] ajustes_v5184_correcoes_patch.js carregado');
})();
