// ═══════════════════════════════════════════════════════════════════════════
// v5.22.39 — Imprimir venda: escolhe Vendas ou OS, depois 1 ou 2 vias
// • Venda: sem aviso EPSON. 2 vias = duas meias folhas (uma folha se couber)
// • OS: aviso EPSON sempre. 2 vias = duas folhas separadas
// • v5.22.67: o aviso não pode empurrar a OS para uma segunda folha. Antes de
//   imprimir, se a folha passou do tamanho do A4, a página inteira encolhe o
//   necessário para caber em UMA folha só.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }

function fatiarPagina(html){
  var s=String(html||'');
  var start=s.search(/<div class="pagina\b/);
  if(start<0) return null;
  var rest=s.slice(start);
  var m=rest.match(/<\/div>\s*(?=<div class="corte|<script|<\/body>)/);
  if(!m) return null;
  var end=start+m.index+6;
  return {antes:s.slice(0,start), pagina:s.slice(start,end), depois:s.slice(end)};
}

function avisoEpsonHtml(){
  var t=(window.V52237_VENDAS_OS_PURE && window.V52237_VENDAS_OS_PURE.AVISO_EPSON) ||
    'Prezados clientes,\n\nInformamos que as manutenções em impressoras EPSON exigem um prazo maior para a conclusão. Para estes equipamentos, utilizamos produtos químicos específicos que demandam um tempo necessário de reação para garantir a eficácia do serviço. Por isso, solicitamos um prazo médio de 15 dias úteis para a entrega da manutenção.\n\nVale ressaltar que o equipamento pode ficar pronto antes deste prazo, a depender da agilidade da reação dos produtos utilizados.\n\nAgradecemos a compreensão de todos e nos colocamos à disposição para eventuais dúvidas!';
  return '<div class="aviso-epson" style="margin:2.5mm 0 0;padding:2mm 2.5mm;page-break-inside:avoid;break-inside:avoid;border:1.6px solid #0a1e8a;background:#eef2ff;border-radius:2mm;font-size:8.8px;line-height:1.3;color:#0a1e8a;white-space:pre-wrap;font-weight:600">'+
    String(t).replace(/</g,'&lt;')+'</div>';
}

// Encolhe a folha só quando ela passa do A4. Se já cabe, não mexe em nada.
function fatorParaCaber(alturaConteudo, alturaFolha, minimo){
  var min = minimo == null ? 0.7 : minimo;
  if (!alturaConteudo || !alturaFolha || alturaConteudo <= alturaFolha) return 1;
  var k = alturaFolha / alturaConteudo;
  return k < min ? min : Math.floor(k * 100) / 100;
}

var SCRIPT_UMA_FOLHA =
  '<script>(function(){try{' +
  'var régua=document.createElement("div");régua.style.cssText="position:absolute;visibility:hidden;height:297mm";' +
  'document.body.appendChild(régua);var folha=régua.offsetHeight;régua.remove();' +
  'if(!folha)return;' +
  'var pgs=document.querySelectorAll(".pagina.inteira");' +
  'for(var i=0;i<pgs.length;i++){var pg=pgs[i];' +
  'var alt=pg.getBoundingClientRect().height;' +
  'if(alt<=folha)continue;' +
  'var k=folha/alt;if(k<0.7)k=0.7;k=Math.floor(k*100)/100;' +
  'pg.style.zoom=k;' +
  'for(var t=0;t<8&&pg.getBoundingClientRect().height>folha&&k>0.7;t++){k=Math.round((k-0.01)*100)/100;pg.style.zoom=k;}' +
  '}}catch(e){}})();<\/script>';

function injetarUmaFolha(html){
  var s=String(html||'');
  if(s.indexOf('régua')>=0) return s;   // já tem o ajuste, não repete
  if(s.indexOf('</body>')>=0) return s.replace('</body>', SCRIPT_UMA_FOLHA+'</body>');
  return s+SCRIPT_UMA_FOLHA;
}

function aplicarTipo(html, tipo){
  var s=String(html||'');
  if(tipo==='venda'){
    s=s.replace(/<div class="os-div"[\s\S]*?<\/div>/,'');
    s=s.replace(/<div class="aviso-epson"[\s\S]*?<\/div>/g,'');
    s=s.replace(/class="pagina inteira"/g,'class="pagina meia"');
    return s;
  }
  s=s.replace(/class="pagina meia"/g,'class="pagina inteira"');
  if(s.indexOf('aviso-epson')<0){
    if(s.indexOf('<p class="audit">')>=0) s=s.replace('<p class="audit">', avisoEpsonHtml()+'<p class="audit">');
    else s=s.replace('</div>\n  <div class="corte', avisoEpsonHtml()+'</div>\n  <div class="corte');
  }
  return injetarUmaFolha(s);
}

function montarVias(html, tipo, vias){
  var s=aplicarTipo(html, tipo);
  var n=parseInt(vias,10)||1;
  if(n<2) return s;
  var fat=fatiarPagina(s);
  if(!fat) return s;
  var a=fat.pagina, b=fat.pagina;
  if(tipo==='os'){
    a=a.replace(/class="pagina inteira"/,'class="pagina inteira via-os" style="page-break-after:always"');
    b=b.replace(/class="pagina inteira"/,'class="pagina inteira via-os"');
    if(s.indexOf('.via-os')<0){
      s=s.replace('</style>','@media print{.via-os{page-break-after:always}.via-os:last-of-type{page-break-after:auto}}</style>');
    }
    return fat.antes+a+b+fat.depois;
  }
  a=a.replace(/class="pagina meia"/,'class="pagina meia via-venda"');
  b=b.replace(/class="pagina meia"/,'class="pagina meia via-venda"');
  return fat.antes+a+b+fat.depois;
}

window.V52239_PRINT_PURE = {
  fatiarPagina: fatiarPagina,
  aplicarTipo: aplicarTipo,
  montarVias: montarVias,
  fatorParaCaber: fatorParaCaber,
  injetarUmaFolha: injetarUmaFolha
};

if(typeof document==='undefined') return;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

function escolherDois(titulo, aLabel, aVal, bLabel, bVal){
  return new Promise(function(resolve){
    var tid='print-escolha-'+Date.now();
    var div=document.createElement('div');
    div.id=tid;
    div.style.cssText='position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)';
    div.innerHTML='<div style="background:#fff;border-radius:18px;padding:26px 28px;max-width:440px;width:92%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35)">'+
      '<p style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 16px">'+esc(titulo)+'</p>'+
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'+
      '<button type="button" data-v="'+esc(aVal)+'" style="flex:1;min-width:140px;height:48px;border-radius:12px;background:#0a1e8a;color:#fff;border:0;font-weight:800;cursor:pointer">'+esc(aLabel)+'</button>'+
      '<button type="button" data-v="'+esc(bVal)+'" style="flex:1;min-width:140px;height:48px;border-radius:12px;background:#fff;color:#0a1e8a;border:1.5px solid #0a1e8a;font-weight:800;cursor:pointer">'+esc(bLabel)+'</button>'+
      '</div>'+
      '<button type="button" data-v="" style="margin-top:14px;height:40px;padding:0 18px;border-radius:11px;background:#fff;border:1px solid #cbd5e1;color:#334155;font-weight:700;cursor:pointer">Cancelar</button>'+
      '</div>';
    function close(val){ div.remove(); resolve(val||''); }
    div.addEventListener('click', function(e){
      var b=e.target.closest('button');
      if(!b) return;
      close(b.getAttribute('data-v')||'');
    });
    document.body.appendChild(div);
  });
}

if(typeof window.vosOsCompleta==='function' && !window.vosOsCompleta.__v52239print){
  var oldComp=window.vosOsCompleta;
  window.vosOsCompleta=function(os){
    if(window.__vosForcarOS) return true;
    if(window.__vosForcarVenda) return false;
    return oldComp.apply(this, arguments);
  };
  window.vosOsCompleta.__v52239print=true;
}

if(typeof window.vosGerarHtmlNotinha==='function' && !window.vosGerarHtmlNotinha.__v52239print){
  var oldHtml=window.vosGerarHtmlNotinha;
  window.vosGerarHtmlNotinha=function(vendaId, opts){
    var p=window.__vosPrintOpts||{};
    window.__vosForcarOS = p.tipo==='os';
    window.__vosForcarVenda = p.tipo==='venda';
    window.__vosPrintando = true;
    var criado=false, venda=null;
    try{
      if(p.tipo==='os' && typeof db!=='undefined' && vendaId){
        venda=(db.vendas||[]).find(function(x){ return x && x.id===vendaId; });
        if(venda && !venda.os){ venda.os={numero:'',modelo:'',numeroSerie:'',patrimonio:'',contador:'',tecnico:''}; criado=true; }
      }
    }catch(e){}
    var html;
    try{ html=oldHtml.apply(this, arguments); }
    finally{
      if(criado && venda) delete venda.os;
      window.__vosForcarOS=false;
      window.__vosForcarVenda=false;
      window.__vosPrintando=false;
    }
    if(!html) return html;
    if(p.tipo) html=montarVias(html, p.tipo, p.vias||1);
    return html;
  };
  window.vosGerarHtmlNotinha.__v52239print=true;
}

window.vosAbrirImpressaoESalvar=function(){
  var f=window.__vosForm;
  if(!f || !f.cliente) return toast('Selecione o cliente','error');
  escolherDois('Como deseja imprimir?', 'Vendas', 'venda', 'Ordem de serviço', 'os').then(function(tipo){
    if(!tipo) return;
    escolherDois('Quantas vias?', '1 via', '1', '2 vias', '2').then(function(vias){
      if(!vias) return;
      var anterior=f.osSelecionada;
      var opcoes={tipo:tipo,vias:vias};
      f.osSelecionada=tipo==='os';
      window.__vosPermitirVendaVazia=true;
      var venda;
      var itensOriginais=f.itens||[];
      // A impressão pode preparar uma venda sem itens; o item temporário só evita
      // validações antigas e nunca é persistido no documento final.
      if(!itensOriginais.length) f.itens=[{descricao:'',qtd:0,preco:0,subtotal:0,tipo:'Produto',_impressaoVazia:true}];
      try{ venda=typeof window.vosGravarVenda==='function' ? window.vosGravarVenda(true) : null; }
      catch(err){ console.error('[impressao] falha ao salvar antes de imprimir',err); if(typeof toast==='function') toast('Não foi possível preparar a impressão','error'); venda=null; }
      finally{
        f.itens=itensOriginais;
        if(venda && venda.itens) venda.itens=venda.itens.filter(function(it){return !it._impressaoVazia && (it.qtd||it.descricao);});
        window.__vosPermitirVendaVazia=false; f.osSelecionada=anterior;
      }
      if(!venda) return;
      // A impressão salva a venda, mas mantém esta aba aberta.
      window.__vosPrintOpts=opcoes;
      try{ window.imprimirNotinha(venda.id,opcoes); }
      finally{ window.__vosPrintOpts=null; }
    });
  });
};

if(typeof window.imprimirNotinha==='function' && !window.imprimirNotinha.__v52239escolha){
  var oldImp=window.imprimirNotinha;
  window.imprimirNotinha=function(vendaId, ja){
    if(ja && ja.tipo && ja.vias){
      window.__vosPrintOpts=ja;
      try{ return oldImp.call(this, vendaId); }
      finally{ window.__vosPrintOpts=null; }
    }
    escolherDois('Como deseja imprimir?', 'Vendas', 'venda', 'Ordem de serviço', 'os').then(function(tipo){
      if(!tipo) return;
      escolherDois('Quantas vias?', '1 via', '1', '2 vias', '2').then(function(vias){
        if(!vias) return;
        window.imprimirNotinha(vendaId, {tipo:tipo, vias:vias});
      });
    });
  };
  window.imprimirNotinha.__v52239escolha=true;
}

console.log('[DIGICOPY] v5.22.39 impressão: escolhe venda/OS e 1 ou 2 vias');
})();
