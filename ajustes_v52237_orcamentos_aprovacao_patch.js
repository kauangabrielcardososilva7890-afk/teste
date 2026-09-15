// ═══════════════════════════════════════════════════════════════════════════
// v5.22.37 — Impressão do orçamento (meia folha) + link público para o
//            cliente aprovar/recusar. Aprovar gera venda SALVA (não
//            faturada), WhatsApp da loja e aviso bem visível.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var AVISO_EPSON = (window.V52237_VENDAS_OS_PURE && window.V52237_VENDAS_OS_PURE.AVISO_EPSON) || [
  'Prezados clientes,',
  '',
  'Informamos que as manutenções em impressoras EPSON exigem um prazo maior para a conclusão. Para estes equipamentos, utilizamos produtos químicos específicos que demandam um tempo necessário de reação para garantir a eficácia do serviço. Por isso, solicitamos um prazo médio de 15 dias úteis para a entrega da manutenção.',
  '',
  'Vale ressaltar que o equipamento pode ficar pronto antes deste prazo, a depender da agilidade da reação dos produtos utilizados.',
  '',
  'Agradecemos a compreensão de todos e nos colocamos à disposição para eventuais dúvidas!'
].join('\n');

var PAGES = 'https://digicopy-pix.pages.dev/orcamento.html';
var API = 'https://digicopy-sync-api.kauangabrielcardososilva7890.workers.dev';

function txt(v){ return String(v==null?'':v).trim(); }
function n(v){ var x=Number(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(v):('R$ '+(n(v).toFixed(2))); }
function dataBR(v){ return typeof fmtDate==='function'?fmtDate(v):(v||'-'); }

function loja(){
  var emp=null;
  try{
    if(typeof db!=='undefined'){
      emp=(db.config&&db.config.empresa)||{};
      var s=typeof getSession==='function'?getSession():null;
      var e=s && (db.empresas||[]).find(function(x){ return x.id===s.empresaId; });
      if(e) emp=Object.assign({}, emp, e);
    }
  }catch(er){}
  return emp||{};
}
function soTel(v){ return String(v||'').replace(/\D/g,''); }

function linkPublico(token){
  return PAGES+'?c='+encodeURIComponent(token||'');
}

function mensagemWhats(o, venda, cli){
  var nome=txt(cli&&cli.nome)||'cliente';
  var cod=txt(o&&o.numero)||'—';
  var vd=txt(venda&&venda.numero)||'—';
  return 'Olá, sou '+nome+'. Foi autorizado o orçamento do COD '+cod+' e gerou a venda salva '+vd+'. Por favor, vá atualizando para mim sobre o andamento.';
}

function gerarVendaDoOrcamento(o, origem){
  if(typeof db==='undefined' || !o) return null;
  if(o.vendaId){
    var ja=(db.vendas||[]).find(function(v){ return v.id===o.vendaId; });
    if(ja) return ja;
  }
  var s=typeof getSession==='function'?getSession():null;
  var empId=o.empresaId || (s&&s.empresaId);
  var numero = typeof window.proximoNumeroSimples==='function'
    ? window.proximoNumeroSimples('venda', db.vendas, empId)
    : String(((db.vendas||[]).length)+1);
  var venda={
    id: typeof uid==='function'?uid('vda'):('vda_'+Date.now()),
    empresaId: empId,
    numero: numero,
    clienteId: o.clienteId,
    data: new Date().toISOString(),
    itens: (o.itens||[]).map(function(it){ return Object.assign({}, it); }),
    desconto: 0,
    total: n(o.total),
    observacao: 'Gerada do orçamento '+o.numero,
    status: 'aguardar',
    origemOrcamentoId: o.id,
    criadoPor: o.criadoPor,
    criadoPorNome: o.criadoPorNome,
    criadoEm: new Date().toISOString(),
    atendenteNome: o.criadoPorNome
  };
  (venda.itens||[]).forEach(function(it){
    var p=it.produtoId && (db.produtos||[]).find(function(x){ return x.id===it.produtoId; });
    if(p && !/servi[cç]o|recarga/i.test(String(p.categoria||'')) && !p.estoqueInfinito) p.estoque=n(p.estoque)-n(it.qtd);
  });
  db.vendas=db.vendas||[];
  db.vendas.push(venda);
  o.status='aprovado';
  o.vendaId=venda.id;
  o.vendaNumero=venda.numero;
  o.aprovadoEm=new Date().toISOString();
  o.aprovadoOrigem=origem||'sistema';
  return venda;
}

function avisarAprovacao(o, venda, cli){
  if(typeof db==='undefined') return;
  db.notificacoes=db.notificacoes||[];
  db.notificacoes.unshift({
    id: typeof uid==='function'?uid('ntf'):('ntf_'+Date.now()),
    empresaId: o.empresaId,
    tipo: 'orcamento_aprovado',
    titulo: 'Orçamento autorizado',
    texto: (cli&&cli.nome||'Cliente')+' autorizou o orçamento '+o.numero+' e gerou a venda salva '+(venda&&venda.numero||''),
    orcamentoId: o.id,
    vendaId: venda&&venda.id,
    lida: false,
    criadoEm: new Date().toISOString()
  });
  pintarBanner(o, venda, cli);
}

function pintarBanner(o, venda, cli){
  if(typeof document==='undefined') return;
  var old=document.getElementById('digi-orc-aviso');
  if(old) old.remove();
  var el=document.createElement('div');
  el.id='digi-orc-aviso';
  el.style.cssText='position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:99999;max-width:640px;width:calc(100% - 24px);background:#052e16;color:#ecfdf5;border:2px solid #4ade80;border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,.35);padding:16px 18px;font-family:inherit';
  el.innerHTML='<div style="display:flex;gap:12px;align-items:flex-start">'
    +'<div style="font-size:28px;line-height:1">✅</div>'
    +'<div style="flex:1"><p style="font-weight:800;font-size:16px;margin:0 0 4px">Cliente autorizou o orçamento</p>'
    +'<p style="margin:0;font-size:13.5px;line-height:1.4">'
    +esc(cli&&cli.nome||'Cliente')+' autorizou o orçamento <b>'+esc(o.numero||'')+'</b> e gerou a venda salva <b>'+esc(venda&&venda.numero||'')+'</b>.</p></div>'
    +'<button type="button" style="border:0;background:#14532d;color:#fff;border-radius:10px;height:34px;padding:0 12px;font-weight:700;cursor:pointer" onclick="this.parentElement.parentElement.remove()">OK</button>'
    +'</div>';
  document.body.appendChild(el);
  try{
    if(window.Notification && Notification.permission==='granted'){
      new Notification('Orçamento autorizado', { body: (cli&&cli.nome||'Cliente')+' autorizou o COD '+(o.numero||'') });
    } else if(window.Notification && Notification.permission!=='denied'){
      Notification.requestPermission();
    }
  }catch(e){}
}

window.ORCAMENTOS_APROVACAO_PURE = {
  linkPublico: linkPublico,
  mensagemWhats: mensagemWhats,
  AVISO_EPSON: AVISO_EPSON,
  PAGES: PAGES
};

window.aprovarOrcamentoInterno=function(id, origem){
  var o=(typeof db!=='undefined' && (db.orcamentos||[])).find(function(x){ return x.id===id; });
  if(!o) return null;
  if(o.status==='aprovado' && o.vendaId){
    return (db.vendas||[]).find(function(v){ return v.id===o.vendaId; })||null;
  }
  var venda=gerarVendaDoOrcamento(o, origem);
  var cli=(db.clientes||[]).find(function(c){ return c.id===o.clienteId; })||{};
  avisarAprovacao(o, venda, cli);
  if(typeof saveDB==='function') saveDB();
  return venda;
};

window.imprimirOrcamento=function(id){
  if(!id && window.__ORC_ST && window.__ORC_ST.form && window.__ORC_ST.form.id){
    if(typeof window.salvarOrcamentoTela==='function') window.salvarOrcamentoTela();
    id=window.__ORC_ST.form.id;
  }
  var o=(db.orcamentos||[]).find(function(x){ return x.id===id; });
  if(!o){ if(typeof toast==='function') toast('Salve o orçamento antes de imprimir','error'); return; }
  var html=window.gerarHtmlOrcamento(o.id);
  if(!html) return;
  var win=window.open('','_blank');
  if(!win){ if(typeof toast==='function') toast('Bloqueador de pop-up impediu a impressão','error'); return; }
  win.document.write(html); win.document.close();
};

window.gerarHtmlOrcamento=function(id){
  var o=(db.orcamentos||[]).find(function(x){ return x.id===id; });
  if(!o) return '';
  var cli=(db.clientes||[]).find(function(c){ return c.id===o.clienteId; })||{};
  var emp=loja();
  var link=linkPublico(o.token);
  var logo=window.DIGICOPY_LOGO?'<img src="'+window.DIGICOPY_LOGO+'" style="width:100%;height:100%;object-fit:contain">':'DC';
  var itens=(o.itens||[]).map(function(it,i){
    return '<tr><td class="c">'+esc(it.sku||String(i+1))+'</td><td>'+esc(it.descricao||'')+'</td>'
      +'<td class="c">'+it.qtd+'</td><td class="r">'+money(it.preco)+'</td><td class="r">'+money(it.desconto||0)+'</td><td class="r"><b>'+money(it.subtotal)+'</b></td></tr>';
  }).join('');
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Orçamento '+esc(o.numero)+'</title><style>'
    +'@page{size:A4 portrait;margin:0}*{box-sizing:border-box}'
    +'body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111}'
    +'.pagina{width:210mm;height:138mm;padding:8mm 12mm;overflow:hidden}'
    +'.cab{display:flex;justify-content:space-between;gap:6mm;border-bottom:1.5px solid #0a1e8a;padding-bottom:3mm}'
    +'.logo{width:16mm;height:16mm;border-radius:2.5mm;background:#0a1e8a;color:#fff;font-weight:800;display:grid;place-items:center}'
    +'.emp-nome{font-weight:800;font-size:14px;margin:0}.emp-info{margin:1px 0 0;font-size:9px;color:#555}'
    +'.titulo{margin:3mm 0;background:#0a1e8a;color:#fff;text-align:center;font-weight:800;padding:2mm;border-radius:2mm}'
    +'.cli{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:2mm;border:1px solid #ccc;border-radius:2mm;padding:2mm 3mm}'
    +'.lbl{display:block;font-size:8px;font-weight:700;text-transform:uppercase;color:#777}'
    +'table.tb{width:100%;border-collapse:collapse;margin-top:2.5mm;font-size:10px}'
    +'.tb th{background:#eef0f8;font-size:8px;text-transform:uppercase;padding:1.4mm 2mm;border:1px solid #d5d9e8;text-align:left}'
    +'.tb td{padding:1.4mm 2mm;border:1px solid #e2e5ee}.c{text-align:center}.r{text-align:right}'
    +'.tot{text-align:right;margin-top:2mm;font-size:14px;font-weight:800;color:#0a1e8a}'
    +'.link{margin-top:2mm;padding:2mm 3mm;border:1.5px dashed #0a1e8a;border-radius:2mm;font-size:10px}'
    +'.link a{color:#0a1e8a;font-weight:800;word-break:break-all}'
    +'.aviso{margin-top:2mm;padding:2mm 2.5mm;border:1.5px solid #0a1e8a;background:#eef2ff;border-radius:2mm;font-size:8.5px;line-height:1.3;color:#0a1e8a;white-space:pre-wrap;font-weight:600}'
    +'.no-print{margin:6mm;text-align:center}'
    +'.no-print button{padding:3mm 8mm;border:0;border-radius:2mm;background:#0a1e8a;color:#fff;font-weight:700;cursor:pointer}'
    +'@media print{.no-print{display:none!important}}'
    +'</style></head><body>'
    +'<div class="no-print"><button onclick="window.print()">Imprimir / PDF</button> <button onclick="window.close()" style="background:#fff;color:#333;border:1px solid #aaa">Fechar</button></div>'
    +'<div class="pagina">'
    +'<div class="cab"><div style="display:flex;gap:4mm"><div class="logo" style="'+(window.DIGICOPY_LOGO?'background:#fff;padding:0;overflow:hidden;border:1px solid #dfe3ee':'')+'">'+logo+'</div>'
    +'<div><p class="emp-nome">'+esc(emp.fantasia||emp.nome||'DIGICOPY')+'</p>'
    +'<p class="emp-info">'+esc([emp.nome, emp.cnpj, emp.telefone||emp.whatsapp].filter(Boolean).join(' • '))+'</p>'
    +'<p class="emp-info">'+esc([emp.logradouro||emp.rua||emp.endereco, emp.numero, emp.bairro, emp.municipio||emp.cidade, emp.uf].filter(Boolean).join(', '))+'</p></div></div>'
    +'<div style="text-align:right"><p class="emp-info">Código <b>'+esc(o.numero)+'</b></p><p class="emp-info">Emissão '+dataBR(o.data)+'</p></div></div>'
    +'<div class="titulo">Orçamento Realizado</div>'
    +'<div class="cli"><div><span class="lbl">Cliente</span><b>'+esc(cli.nome||'')+'</b></div>'
    +'<div><span class="lbl">E-mail</span>'+esc(cli.email||'-')+'</div>'
    +'<div><span class="lbl">Celular</span>'+esc(cli.telefone||cli.whatsapp||'-')+'</div></div>'
    +'<table class="tb"><thead><tr><th>Cód</th><th>Descrição</th><th class="c">Qtde</th><th class="r">Valor Unitário</th><th class="r">Desconto</th><th class="r">Valor Total</th></tr></thead><tbody>'+itens+'</tbody></table>'
    +'<div class="tot">Total: '+money(o.total)+'</div>'
    +'<div class="link">Cliente: <a href="'+esc(link)+'">aprovar ou recusar este orçamento</a><br><span style="font-size:8.5px;color:#555">'+esc(link)+'</span></div>'
    +'<div class="aviso">'+esc(AVISO_EPSON)+'</div>'
    +'</div></body></html>';
};

function aplicarAprovacaoRemota(rec){
  if(!rec || !rec.id || typeof db==='undefined') return;
  var o=(db.orcamentos||[]).find(function(x){ return x.id===rec.id || x.token===rec.token; });
  if(!o) return;
  if(rec.status==='aprovado' && !o.vendaId){
    var venda=gerarVendaDoOrcamento(o, 'cliente');
    var cli=(db.clientes||[]).find(function(c){ return c.id===o.clienteId; })||{};
    avisarAprovacao(o, venda, cli);
    if(typeof saveDB==='function') saveDB();
  } else if(rec.status==='recusado' && o.status!=='recusado'){
    o.status='recusado';
    if(typeof saveDB==='function') saveDB();
  }
}

function puxarAprovacoes(){
  if(!window.DIGICOPY_CLOUD || !window.DIGICOPY_CLOUD.api) return;
  (db.orcamentos||[]).filter(function(o){ return o && o.token && o.status==='aberto'; }).slice(0,20).forEach(function(o){
    fetch(API+'/orcamento?c='+encodeURIComponent(o.token)).then(function(r){ return r.json(); }).then(function(j){
      if(j && j.ok && (j.status==='aprovado'||j.status==='recusado')) aplicarAprovacaoRemota(Object.assign({id:o.id,token:o.token}, j));
    }).catch(function(){});
  });
}

if(typeof window.salvarOrcamentoTela==='function' && !window.salvarOrcamentoTela.__v52237nome){
  var oldSal=window.salvarOrcamentoTela;
  window.salvarOrcamentoTela=function(){
    var r=oldSal.apply(this, arguments);
    try{
      var f=window.__ORC_ST && window.__ORC_ST.form;
      if(f && f.id && typeof db!=='undefined'){
        var o=(db.orcamentos||[]).find(function(x){ return x.id===f.id; });
        if(o){
          var emp=loja();
          o.clienteNome=f.cliente&&f.cliente.nome||o.clienteNome||'';
          o.lojaWhatsapp=emp.whatsapp||emp.telefone||o.lojaWhatsapp||'';
          if(typeof saveDB==='function') saveDB();
        }
      }
    }catch(e){}
    return r;
  };
  window.salvarOrcamentoTela.__v52237nome=true;
}

if(typeof document==='undefined') return;

if(typeof window.DIGICOPY_CLOUD_SYNC==='object' && window.DIGICOPY_CLOUD_SYNC.tick && !window.DIGICOPY_CLOUD_SYNC.tick.__v52237orc){
  var oldT=window.DIGICOPY_CLOUD_SYNC.tick;
  window.DIGICOPY_CLOUD_SYNC.tick=function(){
    var p=oldT.apply(this, arguments);
    Promise.resolve(p).then(function(){ setTimeout(puxarAprovacoes, 400); }).catch(function(){});
    return p;
  };
  window.DIGICOPY_CLOUD_SYNC.tick.__v52237orc=true;
}

setTimeout(puxarAprovacoes, 4000);

console.log('[DIGICOPY] v5.22.37 orçamento impressão + aprovação pública');
})();
