// ═══════════════════════════════════════════════════════════════════════════
// v5.22.17 — Imprimir recibo no financeiro (ao lado de Receber/Excluir)
// • Só títulos do mesmo cliente
// • Recibo normal lista parcelas/vendas
// • Recibo com descrição mostra os selecionados E o texto
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function idsCliente(titulos){
  var ids=[];
  (titulos||[]).forEach(function(t){
    var id=String((t&&t.clienteId)||'');
    if(id && ids.indexOf(id)<0) ids.push(id);
  });
  return ids;
}
function podeImprimirMesmoCliente(titulos){
  if(!titulos || !titulos.length) return {ok:false, motivo:'vazio'};
  var ids=idsCliente(titulos);
  if(ids.length!==1) return {ok:false, motivo:'varios-clientes'};
  return {ok:true, clienteId:ids[0]};
}
function codigoParcela(cr){
  if(!cr) return '';
  var c=cr.legadoCodigo||cr.codigoAntigo||cr.codParcela||cr.codigo||'';
  c=String(c).trim();
  if(c) return c;
  var n=String(cr.numero||'').replace(/\D/g,'');
  return n;
}
function codigoVendaDe(cr, vendas){
  if(!cr || !cr.vendaId) return '';
  var v=(vendas||[]).find(function(x){ return x && x.id===cr.vendaId; });
  if(!v) return String(cr.numeroVenda||'').replace(/^VD-/,'');
  return String(v.numero||'').replace(/^VD-/,'');
}
function textoCorrespondente(titulos, descricaoLivre, vendas){
  var parc=[], vend=[];
  (titulos||[]).forEach(function(cr){
    var p=codigoParcela(cr);
    if(p && parc.indexOf(p)<0) parc.push(p);
    var n=codigoVendaDe(cr, vendas);
    if(n && vend.indexOf(n)<0) vend.push(n);
  });
  var partes=[];
  if(parc.length) partes.push('PARCELAS: '+parc.join(','));
  if(vend.length) partes.push('VENDAS '+vend.join(','));
  var base=partes.join(', ');
  var extra=String(descricaoLivre||'').replace(/\s+/g,' ').trim();
  if(extra && base) return base+'\n'+extra;
  if(extra) return extra;
  return base;
}

window.FINANCEIRO_RECIBO_PURE = {
  idsCliente: idsCliente,
  podeImprimirMesmoCliente: podeImprimirMesmoCliente,
  codigoParcela: codigoParcela,
  codigoVendaDe: codigoVendaDe,
  textoCorrespondente: textoCorrespondente
};

if(typeof document==='undefined') return;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Aviso'); if(typeof toast==='function') toast(m,'info'); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(Number(v)||0):(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

function titulosMarcados(){
  var ids=Array.from(document.querySelectorAll('.fin-del-check:checked')).map(function(c){
    return { tipo:c.dataset.tipo||'cr', id:c.value };
  }).filter(function(a){ return a.id && a.tipo==='cr'; });
  var out=[];
  ids.forEach(function(a){
    var cr=(db.contasReceber||[]).find(function(x){ return x && x.id===a.id; });
    if(cr) out.push(cr);
  });
  return out;
}

function proximoNumeroRecibo(){
  db.config=db.config||{}; db.config.seq=db.config.seq||{};
  var n=parseInt(db.config.seq.recibo,10)||0;
  n=n+1;
  db.config.seq.recibo=n;
  return n;
}

function dadosLoja(){
  var s=sess();
  var emp=(db.empresas||[]).find(function(e){ return s&&e.id===s.empresaId; })||(db.empresas||[])[0]||{};
  var l=(db.config&&db.config.loja)||{};
  var d=Object.assign({}, emp, l);
  return {
    fantasia:d.fantasia||'DIGICOPY',
    razao:d.razaoSocial||d.nome||'',
    cnpj:d.cnpj||'',
    tel:d.telefone||d.fone||'',
    whats:d.whatsapp||'(38) 9109-8698',
    email:d.email||'',
    end:[d.rua||d.logradouro, d.numero, d.bairro, d.cidade||d.municipio, d.uf||d.estado, d.cep].filter(Boolean).join(' • ')
  };
}

function htmlRecibo(titulos, descricaoLivre){
  var s=sess();
  var loja=dadosLoja();
  var cli=(db.clientes||[]).find(function(c){ return c && c.id===titulos[0].clienteId; })||{};
  var total=titulos.reduce(function(acc,t){ return acc+(Number(t.valor)||0); },0);
  var num=proximoNumeroRecibo();
  var corr=textoCorrespondente(titulos, descricaoLivre, db.vendas||[]);
  var corrHtml=esc(corr).replace(/\n/g,'<br>');
  var hoje=new Date().toLocaleDateString('pt-BR');
  var logo=window.DIGICOPY_LOGO?'<img src="'+window.DIGICOPY_LOGO+'" style="width:100%;height:100%;object-fit:contain">':'DIGICOPY';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Recibo '+num+'</title><style>'+
    '@page{size:A4 portrait;margin:10mm}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;font-size:12px}'+
    '.pag{padding:8mm 10mm}.cab{display:flex;gap:10px;align-items:flex-start;border-bottom:2px solid #0a1e8a;padding-bottom:8px}'+
    '.logo{width:28mm;height:18mm;background:#0a1e8a;color:#fff;display:grid;place-items:center;font-weight:800}'+
    '.emp{flex:1}.emp h1{margin:0;font-size:18px;letter-spacing:.04em}.emp p{margin:2px 0 0;font-size:11px}'+
    '.lado{text-align:right;font-size:10px;line-height:1.35}.faixa{display:flex;align-items:center;gap:8px;margin:10px 0}'+
    '.faixa b.t{font-size:22px;border:2px solid #111;padding:4px 10px}.faixa span{border:1px solid #111;padding:4px 8px;font-size:13px}'+
    '.corpo{border:2px solid #111;padding:10px 12px;line-height:1.7}.linha{border-bottom:1px dotted #333;min-height:18px;display:inline-block;min-width:46%}'+
    '.no-print{margin:8px;text-align:center}.no-print button{padding:8px 16px;background:#0a1e8a;color:#fff;border:0;border-radius:8px;font-weight:700}'+
    '@media print{.no-print{display:none!important}}'+
    '</style></head><body><div class="no-print"><button onclick="window.print()">Imprimir</button></div><div class="pag">'+
    '<div class="cab"><div class="logo">'+logo+'</div><div class="emp"><h1>'+esc(loja.fantasia)+'</h1>'+
    '<p>'+esc(loja.razao)+'</p>'+
    '<p>'+(loja.tel?'☎ '+esc(loja.tel)+' ':'')+(loja.whats?'WhatsApp '+esc(loja.whats):'')+'</p></div>'+
    '<div class="lado">'+esc(loja.cnpj)+'<br>'+esc(loja.end)+'<br>'+esc(loja.email)+'</div></div>'+
    '<div class="faixa"><b class="t">RECIBO</b><span>Nº <b>'+num+'</b></span><span>Valor: <b>'+esc(money(total))+'</b></span></div>'+
    '<div class="corpo">Recebi (emos) de <b>'+esc(cli.nome||'-')+'</b>, Pago em: ____________<br>'+
    'Correspondente a <b>'+corrHtml+'</b><br><br>'+
    'e para clareza firmo (amos) o presente. &nbsp;&nbsp; Este recibo foi entregue em <b>'+hoje+'</b></div>'+
    '</div><script>window.onload=function(){setTimeout(function(){window.print()},300)};<\/script></body></html>';
}

function abrirOpcoesImpressao(titulos){
  var box=document.getElementById('modal-box');
  if(box) box.className='w-full max-w-[640px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  document.getElementById('modal-title').innerText='Imprimir recibo';
  var prev=textoCorrespondente(titulos,'', db.vendas||[]);
  document.getElementById('modal-body').innerHTML=
    '<p class="text-[13px] text-slate-600 mb-3">'+titulos.length+' título(s) do mesmo cliente. Total <b>'+esc(money(titulos.reduce(function(s,t){return s+(Number(t.valor)||0);},0)))+'</b></p>'+
    '<p class="text-[12px] text-slate-500 mb-2">Selecionados: <b>'+esc(prev||'-')+'</b></p>'+
    '<div class="flex flex-col gap-2">'+
    '<button type="button" onclick="window.finImprimirRecibo(false)" class="h-11 rounded-xl bg-[#0a1e8a] text-white font-bold">Imprimir recibo</button>'+
    '<button type="button" onclick="document.getElementById(\'fin-rec-desc-box\').classList.remove(\'hidden\')" class="h-11 rounded-xl bg-white border font-bold">Recibo com descrição</button>'+
    '</div>'+
    '<div id="fin-rec-desc-box" class="hidden mt-3">'+
    '<label class="text-[11px] font-bold uppercase text-slate-500">Descrição do recibo</label>'+
    '<textarea id="fin-rec-desc" class="mt-1 w-full h-24 p-3 rounded-xl border text-[13px]" placeholder="Ex.: teste de descrição"></textarea>'+
    '<p class="text-[11px] text-slate-500 mt-1">O recibo mostra os códigos selecionados e esta descrição.</p>'+
    '<button type="button" onclick="window.finImprimirRecibo(true)" class="mt-2 h-11 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold">Imprimir com descrição</button>'+
    '</div>';
  document.getElementById('modal-footer').innerHTML='<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border font-bold">Cancelar</button>';
  document.getElementById('modal-root').classList.remove('hidden');
  window.__finReciboTitulos=titulos;
}

window.finAcaoImprimir=function(){
  var titulos=titulosMarcados();
  if(!titulos.length){ aviso('Marque pelo menos um título do mesmo cliente.','Imprimir recibo'); return; }
  var chk=podeImprimirMesmoCliente(titulos);
  if(!chk.ok){
    aviso('Não dá para imprimir títulos de clientes diferentes. Marque só um cliente (todas as parcelas dele).','Imprimir recibo');
    return;
  }
  abrirOpcoesImpressao(titulos);
};

window.finImprimirRecibo=function(comDesc){
  var titulos=window.__finReciboTitulos||[];
  if(!titulos.length) return;
  var desc='';
  if(comDesc) desc=String((document.getElementById('fin-rec-desc')||{}).value||'');
  var html=htmlRecibo(titulos, desc);
  if(typeof saveDB==='function') saveDB();
  if(typeof closeModal==='function') closeModal();
  var w=window.open('','_blank');
  if(!w){ aviso('O bloqueador de pop-up impediu a impressão.','Imprimir'); return; }
  w.document.write(html); w.document.close();
};

function ajustarBotaoImprimir(){
  var view=document.getElementById('view-financeiro'); if(!view) return;
  var actions=view.querySelector('.neo-head .neo-actions'); if(!actions) return;
  if(actions.querySelector('[data-fin-imprimir]')) return;
  var btn=document.createElement('button');
  btn.className='neo-btn';
  btn.dataset.finImprimir='1';
  btn.innerHTML='<i class="ph ph-printer"></i>Imprimir';
  btn.onclick=function(){ window.finAcaoImprimir(); };
  var rec=actions.querySelector('[data-fin-receber]');
  var excluir=actions.querySelector('.btn-del-lote');
  if(rec&&rec.nextSibling) actions.insertBefore(btn, rec.nextSibling);
  else if(excluir) actions.insertBefore(btn, excluir);
  else actions.appendChild(btn);
}

if(typeof window.renderFinanceiro==='function' && !window.renderFinanceiro.__v52217recibo){
  var oldF=window.renderFinanceiro;
  window.renderFinanceiro=function(){
    var r=oldF.apply(this, arguments);
    try{ ajustarBotaoImprimir(); }catch(e){}
    return r;
  };
  window.renderFinanceiro.__v52217recibo=true;
}
setTimeout(ajustarBotaoImprimir, 400);
setTimeout(ajustarBotaoImprimir, 1400);

console.log('[DIGICOPY] v5.22.17 recibo no financeiro');
})();
