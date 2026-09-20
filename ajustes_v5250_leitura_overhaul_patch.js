// ════════════════════════════════════════════════════════════════════════════
// v5.25.0 — REVISÃO COMPLETA DA ÁREA DE LEITURAS (relatório dele + decreto de
// versão: "nessa correção irá pro 5.25.xx; NF irá pro 6.xx.xx pois é
// praticamente um menu novo"). Conteúdo:
// 1) Avulso 1 — contador ANTERIOR visível de volta no novo lançamento (nunca
//    foi portado da coleta rápida antiga pro modal novo: restaurado como chip
//    somente-leitura que acompanha impressora+tipo escolhidos).
// 2) Avulso 2 — Faturar/Estornar com pop-up do SISTEMA (confirmSistema, z-index
//    máximo) e TAMBÉM na listagem (botões por leitura, sem precisar abrir).
// 3) Avulso 3 — visual da leitura: some "Voltar ao histórico" e "Conferir NF-e";
//    ficam só SALVAR (salva e volta pra listagem — escolha dele), o X (agora
//    pergunta "salvar antes de fechar?") e IMPRIMIR bonito, padrão vendas.
// 4) Avulso 4 — varredura de pop-ups nativos (confirm do navegador) na área de
//    leituras → todos viram confirmSistema.
// 5) Decreto — tela antiga "Leituras" do menu Locação (formato parque simples,
//    fora do contrato) APOSENTADA: menu escondido e a view vira um cartão
//    explicativo. DENSO DE RISCO checado: se existir leitura velha pendente de
//    faturar, o cartão oferece o botão de faturar (nada fica órfão).
// ════════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function n(v){ var x=Number(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:0; }
function txt(v){ return String(v==null?'':v).trim(); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function money(v){ try{ return n(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }catch(e){ return 'R$ '+n(v).toFixed(2); } }

function tituloEhLeitura(t){ return /^Leitura\b/.test(txt(t)); }
function leituraPorId(dbRef,id){ return ((dbRef&&dbRef.leituras)||[]).find(function(l){ return l&&l.id===id; })||null; }
function contratoDaLeitura(dbRef,l){
  if(!l) return null;
  return ((dbRef&&dbRef.contratos)||[]).find(function(c){ return c.id===l.contratoId; })
      || ((dbRef&&dbRef.contratos)||[]).find(function(c){ return c.id && c.clienteId===l.clienteId && c.status==='ativo'; })
      || null;
}
function valorLeitura(l){ return (l&&Array.isArray(l.itens)?l.itens:[]).reduce(function(s,x){ return s+n(x&&x.valorTotal); },0)||n(l&&l.valorTotal); }
function contadorAnteriorInfo(dbRef, p, key, itemEmEdicao){
  if(itemEmEdicao) return n(itemEmEdicao.anterior);
  if(!p||!key) return null;
  var cont = (p.contadores||{})[key];
  if(cont==null){
    var med = p.medidores && p.medidores[key];
    cont = med && med.contadorInicial;
  }
  return n(cont);
}
function execEstorno(dbRef, l){
  if(!l) return 0;
  l.status='estornada';
  var amarradas=0;
  ((dbRef&&dbRef.contasReceber)||[]).forEach(function(c){ if(c&&c.leituraId===l.id){ c.status='estornado'; c.pagamentoData=null; amarradas++; } });
  return amarradas;
}
function pendentesLegadas(dbRef, empresaId){
  return ((dbRef&&dbRef.leituras)||[]).filter(function(l){
    return l && !Array.isArray(l.itens) && l.status==='pendente' && (!empresaId || l.empresaId===empresaId);
  });
}

window.LEITURA_OVERHAUL_V5250_PURE = {
  tituloEhLeitura: tituloEhLeitura,
  leituraPorId: leituraPorId,
  valorLeitura: valorLeitura,
  contadorAnteriorInfo: contadorAnteriorInfo,
  execEstorno: execEstorno,
  pendentesLegadas: pendentesLegadas
};

if(typeof document==='undefined') return;

function salvarDB(){ try{ if(typeof saveDB==='function') saveDB(); }catch(e){} }
function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Leitura'); if(typeof toast==='function') toast(m,'info'); }
function okMsg(m){ if(typeof toastMsg==='function') toastMsg(m,'success'); else aviso(m); }
function sessEmp(){ try{ return (typeof getSession==='function'?(getSession()||{}).empresaId:null); }catch(e){ return null; } }

// ── (1) Avulso 1: chip "contador anterior" no novo lançamento ────────────────
function oferecerChipAnterior(){
  var body=document.getElementById('modal-body'); if(!body) return;
  var inp=document.getElementById('lan-cont'); if(!inp) return;
  if(document.getElementById('v5250-lan-ant')) return;
  var box=document.createElement('div');
  box.id='v5250-lan-ant';
  box.style.cssText='margin:2px 0 0;padding:9px 13px;border-radius:11px;background:#eef2ff;border:1px solid #c7d2fe;color:#1e3a8a;font-size:12.5px;font-weight:700;display:flex;justify-content:space-between;align-items:center;gap:10px';
  box.innerHTML='<span>Contador anterior registrado:</span><b id="v5250-lan-ant-num" style="font-family:monospace;font-size:15px">—</b>';
  var lbl=inp.closest('label');
  (lbl&&lbl.parentElement?lbl.parentElement:body).insertBefore(box, lbl||inp);
  atualizarChipAnterior();
}
function atualizarChipAnterior(){
  var numEl=document.getElementById('v5250-lan-ant-num'); if(!numEl||typeof db==='undefined') return;
  var prqId=(document.getElementById('lan-prq')||{}).value;
  var key=(document.getElementById('lan-med')||{}).value;
  var idxEl=document.getElementById('lan-edit-idx');
  var item=null;
  if(idxEl && txt(idxEl.value)!==''){
    var l=leituraPorId(db,(document.getElementById('lan-leitura-id')||{}).value);
    item=l&&l.itens?l.itens[Number(idxEl.value)]:null;
  }
  var p=prqId?((db.parque||[]).find(function(x){ return x&&x.id===prqId; })):null;
  var v=contadorAnteriorInfo(db,p,key||'',item);
  numEl.textContent=(v==null)?'—':v.toLocaleString('pt-BR');
  numEl.parentElement.style.opacity=(v==null)?'0.55':'1';
}
if(typeof window.abrirLancamentoContador==='function' && !window.abrirLancamentoContador.__v5250lo){
  var oldAbrirLanc=window.abrirLancamentoContador;
  window.abrirLancamentoContador=function(){
    var r=oldAbrirLanc.apply(this,arguments);
    setTimeout(oferecerChipAnterior,0); setTimeout(oferecerChipAnterior,100); setTimeout(atualizarChipAnterior,180);
    return r;
  };
  window.abrirLancamentoContador.__v5250lo=true;
}
if(typeof window.atualizarTiposLancamento==='function' && !window.atualizarTiposLancamento.__v5250lo){
  var oldTipos=window.atualizarTiposLancamento;
  window.atualizarTiposLancamento=function(){
    var r=oldTipos.apply(this,arguments);
    setTimeout(atualizarChipAnterior,0);
    return r;
  };
  window.atualizarTiposLancamento.__v5250lo=true;
}
document.addEventListener('change', function(e){
  var t=e&&e.target; if(!t) return;
  if(t.id==='lan-med'||t.id==='lan-prq') atualizarChipAnterior();
}, true);

// ── (2) Avulso 2/4: confirmação do SISTEMA em faturar/estornar/remover ──────
if(typeof window.faturarLeituraContrato==='function' && !window.faturarLeituraContrato.__v5250lo){
  var oldFat=window.faturarLeituraContrato;
  window.faturarLeituraContrato=function(leituraId){
    var l=(typeof db!=='undefined')?leituraPorId(db,leituraId):null;
    var valor=valorLeitura(l);
    function seguir(){
      var daLista=!!window.__v5250fatDaLista;
      window.__v5250fatDaLista=false;
      var r=oldFat.apply(window,[leituraId]);
      if(daLista){
        var c=contratoDaLeitura(db,l);
        if(c && typeof window.abrirLeiturasContrato==='function') setTimeout(function(){ window.abrirLeiturasContrato(c.id); },40);
      }
      return r;
    }
    if(typeof window.confirmSistema==='function'){
      window.confirmSistema('Faturar a leitura '+((l&&l.numero)||leituraId)+' no valor de '+money(valor)+'?','Faturar leitura').then(function(ok){ if(ok) seguir(); });
      return;
    }
    return seguir();
  };
  window.faturarLeituraContrato.__v5250lo=true;
}
function reimplementarEstorno(){
  window.estornarLeituraContrato=function(leituraId){
    if(typeof db==='undefined') return;
    var l=leituraPorId(db,leituraId); if(!l) return;
    var daLista=!!window.__v5250fatDaLista;
    function run(){
      execEstorno(db,l);
      salvarDB();
      okMsg('Leitura estornada — aberta para correção. A cobrança ficou estornada no financeiro.');
      window.__v5250fatDaLista=false;
      if(daLista){
        var c=contratoDaLeitura(db,l);
        if(c && typeof window.abrirLeiturasContrato==='function') return window.abrirLeiturasContrato(c.id);
      }
      if(typeof window.abrirLeituraContratoDetalhe==='function') window.abrirLeituraContratoDetalhe(leituraId);
    }
    if(typeof window.confirmSistema==='function'){
      window.confirmSistema('Estornar a leitura '+((l&&l.numero)||'')+'? Ela volta a ficar aberta para edição e a cobrança fica estornada.','Estornar leitura').then(function(ok){ if(ok) run(); });
      return;
    }
    run();
  };
  window.estornarLeituraContrato.__v5250lo=true;
}
if(typeof window.estornarLeituraContrato==='function' && !window.estornarLeituraContrato.__v5250lo) reimplementarEstorno();
window.__v5250reimpEstorno=reimplementarEstorno;

function reimplementarRemover(){
  window.removerLancamentoLeitura=function(leituraId, idx){
    if(typeof db==='undefined') return;
    var l=leituraPorId(db,leituraId); if(!l) return;
    if(typeof leituraBloqueada==='function' && leituraBloqueada(l)) return aviso('Leitura faturada. Estorne para alterar.','Leitura');
    var it=(l.itens||[])[idx];
    function run(){
      l.itens.splice(idx,1);
      l.valorTotal=(l.itens||[]).reduce(function(s,x){ return s+n(x&&x.valorTotal); },0);
      l.valorExcedente=l.valorTotal;
      salvarDB();
      okMsg('Lançamento removido — a impressora voltou para pendente.');
      if(typeof window.abrirLeituraContratoDetalhe==='function') window.abrirLeituraContratoDetalhe(leituraId);
    }
    var msg='Remover o lançamento de '+((it&&it.impressora)||'esta impressora')+'? Ela volta para pendente nesta leitura.';
    if(typeof window.confirmSistema==='function'){
      window.confirmSistema(msg,'Remover lançamento').then(function(ok){ if(ok) run(); });
      return;
    }
    run();
  };
  window.removerLancamentoLeitura.__v5250lo=true;
}
if(typeof window.removerLancamentoLeitura==='function' && !window.removerLancamentoLeitura.__v5250lo) reimplementarRemover();

// ── (2b) Avulso 2: ações por leitura na LISTAGEM (sem precisar abrir) ────────
function injetarAcoesListagem(contratoId){
  if(typeof db==='undefined') return;
  document.querySelectorAll('input[name="leitura-sel"]').forEach(function(radio){
    var leiId=radio.value;
    var tr=radio.closest('tr'); if(!tr||tr.getAttribute('data-v5250-acoes')==='1') return;
    tr.setAttribute('data-v5250-acoes','1');
    var l=leituraPorId(db,leiId); if(!l) return;
    var box=document.createElement('span');
    box.style.cssText='display:inline-flex;gap:5px;margin-left:8px;vertical-align:middle';
    var btn=document.createElement('button');
    btn.style.cssText='height:26px;padding:0 10px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;border:none;color:#fff';
    if(l.status==='faturado'){
      btn.textContent='Estornar';
      btn.style.background='#b91c1c';
      btn.onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); window.__v5250fatDaLista=true; window.estornarLeituraContrato(leiId); };
    }else{
      btn.textContent='Faturar';
      btn.style.background='#0a1e8a';
      btn.onclick=function(ev){ ev.preventDefault(); ev.stopPropagation(); window.__v5250fatDaLista=true; window.faturarLeituraContrato(leiId); };
    }
    box.appendChild(btn);
    var status=tr.querySelector('.neo-status');
    (status?status.parentElement:tr).appendChild(box);
  });
}
if(typeof window.abrirLeiturasContrato==='function' && !window.abrirLeiturasContrato.__v5250lo){
  var oldLista=window.abrirLeiturasContrato;
  window.abrirLeiturasContrato=function(contratoId){
    var r=oldLista.apply(this,arguments);
    setTimeout(function(){ injetarAcoesListagem(contratoId); },0);
    setTimeout(function(){ injetarAcoesListagem(contratoId); },140);
    setTimeout(function(){ injetarAcoesListagem(contratoId); },300);
    return r;
  };
  window.abrirLeiturasContrato.__v5250lo=true;
}

// ── (3) Avulso 3: rodapé da leitura — só SALVAR, X e IMPRIMIR bonito ────────
function reconstruirRodapeLeitura(leituraId){
  var foot=document.getElementById('modal-footer'); if(!foot) return;
  var tit=(document.getElementById('modal-title')||{}).innerText;
  if(!tituloEhLeitura(tit)) return;
  foot.querySelectorAll('button').forEach(function(b){
    var oc=String(b.getAttribute('onclick')||'');
    if(oc.indexOf('abrirLeiturasContrato')>=0 || b.getAttribute('data-nfe-emit')) b.remove();
  });
  foot.querySelectorAll('[data-nfe-emit]').forEach(function(b){ b.remove(); });
  if(document.getElementById('v5250-lei-salvar')) return;
  var imp=null;
  foot.querySelectorAll('button').forEach(function(b){
    if(/imprimirLeituraContrato/.test(String(b.getAttribute('onclick')||''))) imp=b;
  });
  if(imp){
    imp.className='mr-1 h-11 px-5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-[13px] inline-flex items-center gap-2 shadow-sm';
    imp.innerHTML='<i class="ph ph-printer text-[17px]"></i> Imprimir notinha';
    imp.style.marginLeft='auto';
  }
  var sal=document.createElement('button');
  sal.id='v5250-lei-salvar';
  sal.className='h-11 px-7 rounded-xl bg-[#0a1e8a] hover:bg-[#08176e] text-white font-bold text-[13px] inline-flex items-center gap-2 shadow-sm';
  sal.innerHTML='<i class="ph ph-check text-[16px]"></i> Salvar';
  sal.onclick=function(){ salvarEVoltarParaListagem(leituraId); };
  foot.appendChild(sal);
}
function salvarEVoltarParaListagem(leituraId){
  if(typeof db==='undefined') return;
  var l=leituraPorId(db,leituraId);
  salvarDB();
  okMsg('Leitura '+((l&&l.numero)||'')+' salva.');
  var c=contratoDaLeitura(db,l);
  if(c && typeof window.abrirLeiturasContrato==='function') window.abrirLeiturasContrato(c.id);
}
if(typeof window.abrirLeituraContratoDetalhe==='function' && !window.abrirLeituraContratoDetalhe.__v5250lo){
  var oldDet=window.abrirLeituraContratoDetalhe;
  window.abrirLeituraContratoDetalhe=function(leituraId){
    window.__v5250LeiAtual=leituraId;
    var r=oldDet.apply(this,arguments);
    setTimeout(function(){ reconstruirRodapeLeitura(leituraId); },0);
    setTimeout(function(){ reconstruirRodapeLeitura(leituraId); },110);
    setTimeout(function(){ reconstruirRodapeLeitura(leituraId); },290);
    return r;
  };
  window.abrirLeituraContratoDetalhe.__v5250lo=true;
}
// X da janela da leitura → pergunta "salvar antes de fechar?" (popup do sistema)
document.addEventListener('click', function(e){
  var btn=e&&e.target&&e.target.closest?e.target.closest('#modal-root button[onclick*="closeModal"]'):null;
  if(!btn) return;
  if(window.__v5250leituraXBypass){ window.__v5250leituraXBypass=false; return; }
  var tit=(document.getElementById('modal-title')||{}).innerText;
  if(!tituloEhLeitura(tit)) return;
  var liId=window.__v5250LeiAtual;
  var l=(typeof db!=='undefined')?leituraPorId(db,liId):null;
  if(!l) return;
  e.preventDefault(); e.stopPropagation();
  function fechar(){ window.__v5250leituraXBypass=true; if(typeof closeModal==='function') closeModal(); }
  if(typeof window.confirmSistema==='function'){
    window.confirmSistema('Salvar a leitura '+((l&&l.numero)||'')+' antes de fechar? (Confirmar salva e volta pra lista de leituras. Cancelar fecha sem salvar — os lançamentos já feitos NÃO se perdem.)','Fechar leitura').then(function(ok){
      if(ok){ salvarEVoltarParaListagem(liId); } else { fechar(); }
    });
    return;
  }
  fechar();
}, true);

// ── (5) Decreto: tela antiga "Leituras" do menu APOSENTADA ──────────────────
function cartaoAposentada(){
  var view=document.getElementById('view-leituras'); if(!view) return;
  var pend=pendentesLegadas((typeof db!=='undefined')?db:{}, sessEmp());
  view.innerHTML='<div class="max-w-[760px] mx-auto mt-10"><div class="rounded-2xl border bg-white shadow-sm p-8 text-center">'
    +'<div class="w-14 h-14 mx-auto rounded-2xl bg-[#eef2ff] grid place-items-center"><i class="ph ph-speedometer text-[28px] text-[#0a1e8a]"></i></div>'
    +'<h3 class="mt-4 font-bold text-[17px] text-slate-800">Leituras agora vivem dentro do contrato</h3>'
    +'<p class="mt-2 text-[13px] text-slate-500">Esta tela antiga (lançamento direto por impressora, sem contrato) foi aposentada. Abra o contrato do cliente → aba Leituras — lá tem uma leitura aberta por vez, lançamento por departamento, faturar/estornar com confirmação e notinha.</p>'
    +'<button onclick="navigateTo(\'contratos\')" class="mt-5 h-11 px-6 rounded-xl bg-[#0a1e8a] hover:bg-[#08176e] text-white font-bold text-[13px]"><i class="ph ph-file-text mr-1"></i> Abrir contratos</button>'
    +(pend.length?'<div class="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left"><p class="text-[12.5px] font-bold text-amber-900">Ainda existem '+pend.length+' leitura(s) no formato antigo pendentes de faturar.</p><p class="text-[12px] text-amber-800 mt-1">Nada foi apagado. Você pode faturar essas pendências daqui (uma vez, pra quitar o legado):</p><button onclick="gerarFaturasPendentes()" class="mt-2 h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[12px]">Faturar pendências antigas ('+pend.length+')</button></div>':'')
    +'</div></div>';
}
if(typeof window.renderLeituras==='function' && !window.renderLeituras.__v5250lo){
  var oldRL=window.renderLeituras;
  window.renderLeituras=function(){ var r; try{ r=oldRL.apply(this,arguments); }catch(e){} cartaoAposentada(); return r; };
  window.renderLeituras.__v5250lo=true;
}
if(typeof window.openModal==='function' && !window.openModal.__v5250lo){
  var oldOM=window.openModal;
  window.openModal=function(tipo){
    if(tipo==='leitura'){ aviso('Lançamento de leitura direto por impressora foi aposentado. Use o contrato do cliente → aba Leituras.','Leituras'); if(typeof navigateTo==='function') navigateTo('leituras'); return; }
    return oldOM.apply(this,arguments);
  };
  window.openModal.__v5250lo=true;
}
function esconderMenuLeiturasAntigas(){
  document.querySelectorAll('[data-nav="leituras"], button[onclick="navigateTo(\'leituras\')"]').forEach(function(b){
    // Esconde só itens de MENU (sidebar). O "Ver todas →" do painel continua
    // visível e cai no cartão explicativo.
    if(b.getAttribute('data-nav')==='leituras') b.style.display='none';
  });
}
if(typeof window.buildNav==='function' && !window.buildNav.__v5250lo){
  var oldBN=window.buildNav;
  window.buildNav=function(){ var r=oldBN.apply(this,arguments); setTimeout(esconderMenuLeiturasAntigas,0); setTimeout(esconderMenuLeiturasAntigas,200); return r; };
  window.buildNav.__v5250lo=true;
}
setTimeout(esconderMenuLeiturasAntigas,600);

console.log('[DIGICOPY] ajustes_v5250_leitura_overhaul_patch.js v5.25.0 carregado — revisão completa de leituras (anterior visível, confirmações do sistema, ações na listagem, rodapé novo, tela antiga aposentada)');
})();
