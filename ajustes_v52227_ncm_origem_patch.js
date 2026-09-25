// ═══════════════════════════════════════════════════════════════════════════
// v5.22.27 — NCM pesquisável (Enter/lupa) + origem ICMS 0 a 8
// • Origem oficial da NF-e. Não inventa origem a partir do NCM.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var ORIGENS = [
  '0 - Nacional, exceto as indicadas nos códigos 3, 4, 5 e 8',
  '1 - Estrangeira - Importação direta, exceto a indicada no código 6',
  '2 - Estrangeira - Adquirida no mercado interno, exceto a indicada no código 7',
  '3 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 40% e inferior ou igual a 70%',
  '4 - Nacional, cuja produção tenha sido feita em conformidade com os processos produtivos básicos',
  '5 - Nacional, mercadoria ou bem com Conteúdo de Importação inferior ou igual a 40%',
  '6 - Estrangeira - Importação direta, sem similar nacional, constante em lista da CAMEX e gás natural',
  '7 - Estrangeira - Adquirida no mercado interno, sem similar nacional, constante em lista da CAMEX e gás natural',
  '8 - Nacional, mercadoria ou bem com Conteúdo de Importação superior a 70%'
];

function soNcm(v){ return String(v==null?'':v).replace(/\D/g,'').slice(0,8); }
function fold(t){
  return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function codigoOrigem(v){
  var d = String(v==null?'':v).replace(/\D/g,'');
  return d.charAt(0)||'0';
}
function origemPorCodigo(cod){
  var n = String(cod==null?'':cod).replace(/\D/g,'').charAt(0);
  if(n==='' || n<'0' || n>'8') n = '0';
  return ORIGENS[parseInt(n,10)] || ORIGENS[0];
}
function htmlOptsOrigem(sel){
  var n = codigoOrigem(sel);
  return ORIGENS.map(function(o){
    var k = o.charAt(0);
    return '<option value="'+o.replace(/"/g,'&quot;')+'"'+(k===n?' selected':'')+'>'+o+'</option>';
  }).join('');
}
function catalogoNcm(){
  var out = [];
  var seen = {};
  var cfg = (typeof db!=='undefined' && db.config && db.config.ncmCatalogo) || [];
  (cfg||[]).forEach(function(r){
    var c = soNcm(r && (r.ncm||r.NC_NCM||r.NCM));
    if(c.length!==8 || seen[c]) return;
    seen[c] = true;
    out.push({ ncm:c, desc:String((r&& (r.desc||r.NC_DESCRICAO||r.DESCRICAO))||'') });
  });
  if(typeof db!=='undefined' && Array.isArray(db.produtos)){
    db.produtos.forEach(function(p){
      var c = soNcm(p && p.ncm);
      if(c.length!==8 || seen[c]) return;
      seen[c] = true;
      out.push({ ncm:c, desc:String((p&&p.nome)||'') });
    });
  }
  return out;
}
function buscaNcm(q){
  var termo = fold(q).trim();
  var num = soNcm(q);
  var list = catalogoNcm();
  if(!termo && !num) return list.slice(0,20);
  return list.filter(function(r){
    if(num && r.ncm.indexOf(num)>=0) return true;
    return termo && fold(r.desc).indexOf(termo)>=0;
  }).slice(0,20);
}

window.NCM_ORIGEM_PURE = {
  ORIGENS: ORIGENS.slice(),
  soNcm: soNcm,
  codigoOrigem: codigoOrigem,
  origemPorCodigo: origemPorCodigo,
  htmlOptsOrigem: htmlOptsOrigem,
  buscaNcm: buscaNcm
};

if(typeof document==='undefined') return;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

function pintarOrigem(selId, valor){
  var sel = document.getElementById(selId);
  if(!sel) return;
  sel.innerHTML = htmlOptsOrigem(valor || sel.value);
}

function garantirBuscaNcm(inputId, boxId){
  var inp = document.getElementById(inputId);
  if(!inp || document.getElementById(boxId)) return;
  var wrap = inp.parentNode;
  if(!wrap) return;
  if(wrap.classList) wrap.classList.add('relative');
  inp.setAttribute('autocomplete','off');
  inp.onkeydown = function(e){
    if(e.key==='Enter'){ e.preventDefault(); window.buscarNcmProduto(inputId, boxId); }
  };
  if(!document.getElementById(inputId+'-lupa')){
    inp.insertAdjacentHTML('afterend',
      '<button id="'+inputId+'-lupa" type="button" onclick="window.buscarNcmProduto(\''+inputId+'\',\''+boxId+'\')" class="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-2.5 rounded-lg bg-[#0a1e8a] text-white" title="Pesquisar NCM"><i class="ph ph-magnifying-glass"></i></button>'+
      '<div id="'+boxId+'" class="hidden absolute z-30 left-0 right-0 top-full mt-1 max-h-[220px] overflow-auto rounded-xl border bg-white shadow-xl text-[12px]"></div>');
    if(!/\bpr-/.test(inp.className||'')) inp.className = (inp.className||'')+' pr-12';
  }
}

window.buscarNcmProduto = function(inputId, boxId){
  var inp = document.getElementById(inputId);
  var box = document.getElementById(boxId);
  if(!inp || !box) return;
  var q = inp.value||'';
  var list = buscaNcm(q);
  box.classList.remove('hidden');
  box.innerHTML = list.map(function(r){
    return '<button type="button" onclick="window.escolherNcmProduto(\''+esc(inputId)+'\',\''+esc(boxId)+'\',\''+esc(r.ncm)+'\')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0"><b class="font-mono">'+esc(r.ncm)+'</b> <span class="text-slate-500">'+esc(r.desc||'')+'</span></button>';
  }).join('') || '<p class="px-3 py-3 text-slate-400">Nenhum NCM. Digite o código ou a descrição e Enter.</p>';
};

window.escolherNcmProduto = function(inputId, boxId, ncm){
  var inp = document.getElementById(inputId);
  var box = document.getElementById(boxId);
  if(inp) inp.value = ncm;
  if(box){ box.classList.add('hidden'); box.innerHTML=''; }
  if(typeof window.normalizarNCMProdutoOperacional==='function') window.normalizarNCMProdutoOperacional();
};

function aplicar(){
  try{
    pintarOrigem('kp-prd-origem');
    pintarOrigem('p-origem');
    garantirBuscaNcm('kp-prd-ncm','kp-prd-ncm-res');
    garantirBuscaNcm('p-ncm','p-ncm-res');
  }catch(e){}
}

if(typeof window.renderModalProduto==='function' && !window.renderModalProduto.__v52227ncm){
  var old = window.renderModalProduto;
  window.renderModalProduto = function(){
    var r = old.apply(this, arguments);
    setTimeout(aplicar, 50);
    setTimeout(aplicar, 200);
    return r;
  };
  window.renderModalProduto.__v52227ncm = true;
}
if(typeof window.openModal==='function' && !window.openModal.__v52227ncm){
  var oldOpen = window.openModal;
  window.openModal = function(type){
    var r = oldOpen.apply(this, arguments);
    if(type==='produto') setTimeout(aplicar, 80);
    return r;
  };
  window.openModal.__v52227ncm = true;
}

console.log('[DIGICOPY] v5.22.27 NCM pesquisável e origem 0-8');
})();
