// ═══════════════════════════════════════════════════════════════════════════
// v5.22.18 — PIX baixa na hora; comprovante só no A prazo; imprimir só depois de faturar
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function ehFaturada(v){
  var st=String((v&&v.status)||'').toLowerCase();
  return st==='faturado'||st==='finalizada'||st==='concluido'||st==='pago';
}

window.VENDA_PRINT_PIX_PURE = { ehFaturada: ehFaturada };

if(typeof document==='undefined') return;

function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Aviso'); if(typeof toast==='function') toast(m,'info'); }

if(window.PIX_MANUAL_PURE){
  window.PIX_MANUAL_PURE.reabrirTituloPix=function(){ return 0; };
}

if(typeof window.vosEscolherForma==='function' && !window.vosEscolherForma.__v52218){
  var oldForma=window.vosEscolherForma;
  window.vosEscolherForma=function(fx){
    var r=oldForma.apply(this, arguments);
    var vista=document.getElementById('vos-vista-box');
    if(fx==='Pix' && vista){
      vista.className='rounded-[14px] border p-4 bg-emerald-50/50 border-emerald-200';
      vista.innerHTML='<p class="text-[13px] text-emerald-900" id="vos-vista-msg"><i class="ph ph-check-circle"></i> Venda à vista em <b>Pix</b>: será faturada e <b>baixada no financeiro</b> na hora, igual Dinheiro.</p>';
    }
    var extra=document.getElementById('vos-pix-prazo');
    if(extra) extra.remove();
    if(fx==='Prazo'){
      var prazo=document.getElementById('vos-prazo-box');
      if(prazo && typeof window.pixRenderPainelFaturamento==='function'){
        var hold=document.createElement('div');
        hold.id='vos-pix-prazo';
        hold.className='mt-3';
        prazo.appendChild(hold);
        var fake=document.createElement('div');
        fake.id='vos-vista-box-tmp';
        var oldId=vista&&vista.id;
        if(vista) vista.id='vos-vista-box-hidden';
        hold.id='vos-vista-box';
        try{ window.pixRenderPainelFaturamento(); }catch(e){}
        hold.id='vos-pix-prazo';
        if(vista) vista.id=oldId||'vos-vista-box';
      }
    }
    return r;
  };
  window.vosEscolherForma.__v52218=true;
}

function esconderImprimirAntesDeFaturar(){
  var footer=document.getElementById('modal-footer');
  if(footer && document.getElementById('vos-itens-body')){
    var f=window.__vosForm;
    var v=f&&f.vendaId&&(db.vendas||[]).find(function(x){ return x.id===f.vendaId; });
    var ok=ehFaturada(v);
    footer.querySelectorAll('button').forEach(function(b){
      var t=(b.textContent||'').toLowerCase();
      var oc=(b.getAttribute('onclick')||'').toLowerCase();
      if(/imprimir/.test(t) || /imprimirnotinha|vosimprimir/.test(oc)){
        b.style.display=ok?'':'none';
        if(ok) b.onclick=function(){ if(typeof imprimirNotinha==='function') imprimirNotinha(f.vendaId); };
      }
    });
  }
  var view=document.getElementById('view-vendas');
  if(view){
    view.querySelectorAll('.neo-actions button').forEach(function(b){
      var t=(b.textContent||'').toLowerCase();
      if(!/imprimir/.test(t)) return;
      b.onclick=function(){
        var id=window.neoVendaSelecionada;
        if(!id){ aviso('Selecione uma notinha faturada.','Imprimir'); return; }
        var v=(db.vendas||[]).find(function(x){ return x.id===id; });
        if(!ehFaturada(v)){ aviso('Só imprime depois de faturar a venda.','Imprimir'); return; }
        if(typeof imprimirNotinha==='function') imprimirNotinha(id);
      };
    });
  }
}

if(typeof window.imprimirNotinha==='function' && !window.imprimirNotinha.__v52218){
  var oldImp=window.imprimirNotinha;
  window.imprimirNotinha=function(vendaId){
    var v=(db.vendas||[]).find(function(x){ return x.id===vendaId; });
    if(v && !ehFaturada(v)){
      aviso('Só imprime depois de faturar a venda.','Imprimir');
      return;
    }
    return oldImp.apply(this, arguments);
  };
  window.imprimirNotinha.__v52218=true;
}

if(typeof window.novaVenda==='function' && !window.novaVenda.__v52218print){
  var oldNV=window.novaVenda;
  window.novaVenda=function(){
    var r=oldNV.apply(this, arguments);
    setTimeout(esconderImprimirAntesDeFaturar, 80);
    return r;
  };
  window.novaVenda.__v52218print=true;
}
if(typeof window.lockVendaFaturadaUI==='function' && !window.lockVendaFaturadaUI.__v52218){
  var oldLock=window.lockVendaFaturadaUI;
  window.lockVendaFaturadaUI=function(id){
    var r=oldLock.apply(this, arguments);
    setTimeout(function(){
      var footer=document.getElementById('modal-footer'); if(!footer) return;
      if(footer.querySelector('[data-print-fat]')) return;
      var b=document.createElement('button');
      b.setAttribute('data-print-fat','1');
      b.className='h-[44px] px-5 rounded-xl bg-white border font-bold flex items-center gap-2';
      b.innerHTML='<i class="ph ph-printer"></i> Imprimir/PDF';
      b.onclick=function(){ if(typeof imprimirNotinha==='function') imprimirNotinha(id); };
      footer.appendChild(b);
    }, 40);
    return r;
  };
  window.lockVendaFaturadaUI.__v52218=true;
}
if(typeof window.renderVendas==='function' && !window.renderVendas.__v52218print){
  var oldRV=window.renderVendas;
  window.renderVendas=function(){
    var r=oldRV.apply(this, arguments);
    setTimeout(esconderImprimirAntesDeFaturar, 40);
    return r;
  };
  window.renderVendas.__v52218print=true;
}
setTimeout(esconderImprimirAntesDeFaturar, 600);

console.log('[DIGICOPY] v5.22.18 PIX baixa na hora; comprovante no A prazo; imprimir só faturada');
})();
