// ═══════════════════════════════════════════════════════════════════════════
// v5.22.13 — Ordem/nome dos menus + atalhos do Início
// • Só ordem e nome (menu e submenu). Limite de caracteres.
// • Chamados some da Locação; fica só em Atendimento
// • Atalhos do Início editáveis (ordem, nome, quais botões)
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var LIMITE_MENU = 18;
var LIMITE_SUB = 24;

function limitarNome(s, max){
  var t = String(s==null?'':s).replace(/\s+/g,' ').trim();
  max = max||LIMITE_MENU;
  if(t.length>max) t = t.slice(0,max).trim();
  return t;
}

function menusPadrao(){
  return [
    {id:'inicio', icon:'ph-house', label:'Início', click:'navigateTo(\'dashboard\')'},
    {id:'atendimento', icon:'ph-cash-register', label:'Atendimento', click:'navigateTo(\'vendas\')', items:[
      {id:'nova-venda', icon:'ph-shopping-cart-simple', label:'Nova venda', click:'if(typeof novaVenda===\'function\') novaVenda(); else navigateTo(\'vendas\')'},
      {id:'notinhas', icon:'ph-list-magnifying-glass', label:'Consultar notinhas', click:'navigateTo(\'vendas\')'},
      {id:'abrir-chamado', icon:'ph-wrench', label:'Abrir chamado', click:'openQuickOS()'}
    ]},
    {id:'locacao', icon:'ph-printer', label:'Locação', click:'navigateTo(\'contratos\')', menuId:'menu-outsourcing', items:[
      {id:'contratos', icon:'ph-file-text', label:'Contratos', click:'navigateTo(\'contratos\')'},
      {id:'impressoras', icon:'ph-printer', label:'Impressoras', click:'navigateTo(\'impressoras\')'}
    ]},
    {id:'nfe', icon:'ph-file-text', label:'NF-e/NFC-e', click:'toast(\'Módulo fiscal em preparação\',\'info\')', items:[
      {id:'nota-fiscal', icon:'ph-file-plus', label:'Nota fiscal', click:'toast(\'Em breve: emissão de nota fiscal\',\'info\')'},
      {id:'perfil-trib', icon:'ph-scales', label:'Perfil tributário', click:'toast(\'Em breve: perfil tributário\',\'info\')'},
      {id:'ncm', icon:'ph-list-checks', label:'NCM e fiscal', click:'toast(\'Em breve: NCM e configurações fiscais\',\'info\')'}
    ]},
    {id:'cadastros', icon:'ph-users', label:'Cadastros', click:'navigateTo(\'clientes\')', menuId:'menu-cadastros', items:[
      {id:'clientes', icon:'ph-users-three', label:'Clientes', click:'navigateTo(\'clientes\')'},
      {id:'novo-cliente', icon:'ph-user-plus', label:'Novo cliente', click:'openModal(\'cliente\')'}
    ]},
    {id:'financeiro', icon:'ph-bank', label:'Financeiro', click:'navigateTo(\'financeiro\')', menuId:'menu-financeiro', items:[
      {id:'contas-caixas', icon:'ph-bank', label:'Contas e caixas', click:'navigateTo(\'financeiro\')'}
    ]},
    {id:'buscador', icon:'ph-magnifying-glass', label:'Buscador Escola', click:'navigateTo(\'buscador-escola\')', wrapId:'topmod-buscador-escola-fixo'},
    {id:'config', icon:'ph-gear', label:'Configurações', click:'navigateTo(\'config\')', menuId:'menu-config', items:[
      {id:'prefs', icon:'ph-sliders', label:'Preferências', click:'navigateTo(\'config\')'},
      {id:'usuarios', icon:'ph-user-gear', label:'Usuários e permissões', click:'navigateTo(\'usuarios\')'},
      {id:'auditoria', icon:'ph-clipboard-text', label:'Auditoria', click:'navigateTo(\'auditoria\')'}
    ]},
    {id:'backup', icon:'ph-download-simple', label:'Backup', click:'exportBackup()', btnId:'btn-backup-top', title:'Baixar uma cópia de segurança de todos os dados'},
    {id:'nuvem', icon:'ph-cloud-check', label:'Nuvem', click:'abrirCloudflareNuvem()', btnId:'btn-nuvem', title:'Configurar e verificar a nuvem DIGICOPY'},
    {id:'sair', icon:'ph-sign-out', label:'Sair', click:'doLogout()', title:'Sair do sistema'}
  ];
}

function catalogoAtalhos(){
  return [
    {id:'nova-notinha', icon:'ph-plus', label:'Nova notinha', click:'if(typeof novaVenda===\'function\') novaVenda(); else navigateTo(\'vendas\')'},
    {id:'notinhas', icon:'ph-list-magnifying-glass', label:'Notinhas', click:'navigateTo(\'vendas\')'},
    {id:'clientes', icon:'ph-users', label:'Clientes', click:'navigateTo(\'clientes\')'},
    {id:'contratos', icon:'ph-file-text', label:'Contratos', click:'navigateTo(\'contratos\')'},
    {id:'chamados', icon:'ph-wrench', label:'Chamados', click:'openQuickOS()'},
    {id:'impressoras', icon:'ph-printer', label:'Impressoras', click:'navigateTo(\'impressoras\')'},
    {id:'financeiro', icon:'ph-bank', label:'Financeiro', click:'navigateTo(\'financeiro\')'},
    {id:'estoque', icon:'ph-package', label:'Estoque', click:'navigateTo(\'produtos\')'},
    {id:'config', icon:'ph-gear', label:'Configurações', click:'navigateTo(\'config\')'}
  ];
}

function atalhosPadrao(){
  return [
    {id:'nova-notinha', icon:'ph-plus', label:'Nova notinha'},
    {id:'clientes', icon:'ph-users', label:'Clientes'},
    {id:'contratos', icon:'ph-file-text', label:'Contratos'},
    {id:'chamados', icon:'ph-wrench', label:'Chamados'}
  ];
}

function moverItem(lista, de, para){
  var arr = (lista||[]).slice();
  if(de<0||para<0||de>=arr.length||para>=arr.length||de===para) return arr;
  var item = arr.splice(de,1)[0];
  arr.splice(para,0,item);
  return arr;
}

function aplicarNomesSalvos(padrao, salvo){
  if(!salvo || !Array.isArray(salvo.ordem)) return padrao;
  var mapa = {};
  padrao.forEach(function(m){ mapa[m.id]=m; });
  var out=[];
  salvo.ordem.forEach(function(id){
    var base = mapa[id];
    if(!base) return;
    var copy = Object.assign({}, base);
    var custom = (salvo.nomes||{})[id];
    if(custom) copy.label = limitarNome(custom, LIMITE_MENU);
    if(base.items){
      var subSalvo = (salvo.sub||{})[id]||{};
      copy.items = base.items.map(function(it){
        var c2 = Object.assign({}, it);
        if(subSalvo[it.id]) c2.label = limitarNome(subSalvo[it.id], LIMITE_SUB);
        return c2;
      });
    }
    out.push(copy);
    delete mapa[id];
  });
  Object.keys(mapa).forEach(function(id){ out.push(mapa[id]); });
  return out;
}

window.MENUS_ATALHOS_PURE = {
  LIMITE_MENU: LIMITE_MENU,
  LIMITE_SUB: LIMITE_SUB,
  limitarNome: limitarNome,
  menusPadrao: menusPadrao,
  catalogoAtalhos: catalogoAtalhos,
  atalhosPadrao: atalhosPadrao,
  moverItem: moverItem,
  aplicarNomesSalvos: aplicarNomesSalvos
};

if(typeof document==='undefined') return;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function cfg(){ if(typeof db==='undefined') return {}; db.config = db.config||{}; return db.config; }
function gravar(){ if(typeof saveDB==='function') saveDB(); }

function menusAtivos(){
  return aplicarNomesSalvos(menusPadrao(), cfg().uiMenus||null);
}

function atalhosAtivos(){
  var salvo = cfg().uiAtalhos;
  var cat = {};
  catalogoAtalhos().forEach(function(a){ cat[a.id]=a; });
  if(!salvo || !Array.isArray(salvo) || !salvo.length) return atalhosPadrao().map(function(a){ return Object.assign({}, cat[a.id]||a); });
  return salvo.map(function(a){
    var base = cat[a.id];
    if(!base) return null;
    return { id: base.id, icon: base.icon, label: limitarNome(a.label||base.label, LIMITE_SUB), click: base.click };
  }).filter(Boolean);
}

function htmlModulo(m){
  var btnId = m.btnId ? ' id="'+m.btnId+'"' : '';
  var wrapId = m.wrapId ? ' id="'+m.wrapId+'"' : '';
  var title = m.title ? ' title="'+esc(m.title)+'"' : '';
  var type = (m.btnId==='btn-backup-top'||m.btnId==='btn-nuvem') ? ' type="button"' : '';
  var menuId = m.menuId ? ' id="'+m.menuId+'"' : '';
  var sub = '';
  if(m.items && m.items.length){
    sub = '<div'+menuId+' class="module-menu">'+m.items.map(function(it){
      return '<button onclick="'+it.click+'"><i class="ph '+it.icon+'"></i>'+esc(it.label)+'</button>';
    }).join('')+'</div>';
  }
  return '<div class="module"'+wrapId+'><button'+btnId+type+title+' onclick="'+m.click+'"><i class="ph '+m.icon+'"></i>'+esc(itLabel(m.label))+'</button>'+sub+'</div>';
}
function itLabel(s){ return limitarNome(s, LIMITE_MENU); }

function pintarMenus(){
  var row = document.querySelector('.module-row');
  if(!row) return;
  var status = row.querySelector('.ml-auto');
  var html = menusAtivos().map(htmlModulo).join('');
  html += '<div class="module"><button type="button" title="Editar ordem e nome dos menus" onclick="window.abrirEditorMenus()"><i class="ph ph-arrows-out-cardinal"></i>Menus</button></div>';
  if(status) html += status.outerHTML;
  row.innerHTML = html;
  try{ if(window.DIGICOPY_CLOUD && typeof window.DIGICOPY_CLOUD.refreshVisibility==='function') window.DIGICOPY_CLOUD.refreshVisibility(); }catch(e){}
  tirarChamadosLocacao();
}

function tirarChamadosLocacao(){
  var menu = document.getElementById('menu-outsourcing');
  if(!menu) return;
  var loc = menusAtivos().find(function(m){ return m.id==='locacao'; });
  if(!loc) return;
  var html = (loc.items||[]).map(function(it){
    return '<button onclick="'+it.click+'"><i class="ph '+it.icon+'"></i>'+esc(it.label)+'</button>';
  }).join('');
  if(/chamado/i.test(menu.textContent||'') || menu.querySelectorAll('button').length !== (loc.items||[]).length){
    menu.innerHTML = html;
  }
}

window.abrirEditorMenus = function(){
  var atuais = menusAtivos();
  var box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[760px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Ordem e nomes dos menus';
  document.getElementById('modal-body').innerHTML =
    '<p class="text-[12px] text-slate-500 mb-3">Só ordem e nome. Limite: '+LIMITE_MENU+' letras no menu, '+LIMITE_SUB+' no submenu.</p>'+
    '<div id="ui-menus-ed" class="space-y-2">'+atuais.map(function(m,i){
      var subs = (m.items||[]).map(function(it){
        return '<div class="flex items-center gap-2 pl-8 mt-1"><i class="ph '+it.icon+' text-[#0a1e8a]"></i>'+
          '<input data-sub="'+esc(m.id)+'" data-sid="'+esc(it.id)+'" maxlength="'+LIMITE_SUB+'" value="'+esc(it.label)+'" class="neo-input flex-1 !h-9"></div>';
      }).join('');
      return '<div class="rounded-xl border p-2" data-mid="'+esc(m.id)+'">'+
        '<div class="flex items-center gap-2">'+
        '<button type="button" class="neo-btn !px-2 !h-8" onclick="window.uiMenuMover(this,-1)">↑</button>'+
        '<button type="button" class="neo-btn !px-2 !h-8" onclick="window.uiMenuMover(this,1)">↓</button>'+
        '<i class="ph '+m.icon+' text-[#0a1e8a]"></i>'+
        '<input data-menu="'+esc(m.id)+'" maxlength="'+LIMITE_MENU+'" value="'+esc(m.label)+'" class="neo-input flex-1 !h-9">'+
        '</div>'+subs+'</div>';
    }).join('')+'</div>';
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border font-bold">Cancelar</button>'+
    '<button onclick="window.salvarEditorMenus()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>';
  document.getElementById('modal-root').classList.remove('hidden');
  window.__uiMenusRascunho = atuais.map(function(m){ return m.id; });
};

window.uiMenuMover = function(i, dir){
  var body = document.getElementById('ui-menus-ed'); if(!body) return;
  var cards = Array.from(body.children);
  var j = i+dir;
  if(j<0||j>=cards.length) return;
  if(dir<0) body.insertBefore(cards[i], cards[j]);
  else body.insertBefore(cards[j], cards[i]);
  window.abrirEditorMenus = window.abrirEditorMenus;
};

window.salvarEditorMenus = function(){
  var body = document.getElementById('ui-menus-ed'); if(!body) return;
  var ordem=[], nomes={}, sub={};
  Array.from(body.children).forEach(function(card){
    var id = card.getAttribute('data-mid');
    if(!id) return;
    ordem.push(id);
    var inp = card.querySelector('input[data-menu]');
    nomes[id] = limitarNome(inp&&inp.value, LIMITE_MENU) || id;
    sub[id] = {};
    card.querySelectorAll('input[data-sub]').forEach(function(s){
      sub[id][s.getAttribute('data-sid')] = limitarNome(s.value, LIMITE_SUB);
    });
  });
  cfg().uiMenus = { ordem:ordem, nomes:nomes, sub:sub };
  gravar();
  if(typeof closeModal==='function') closeModal();
  pintarMenus();
  if(typeof toast==='function') toast('Menus atualizados','success');
};

function pintarAtalhos(){
  var view = document.getElementById('view-dashboard'); if(!view) return;
  var host = document.getElementById('ui-atalhos-inicio');
  if(!host){
    host = document.createElement('div');
    host.id = 'ui-atalhos-inicio';
    host.className = 'px-1 pb-3';
    view.insertBefore(host, view.firstChild);
  }
  var list = atalhosAtivos();
  host.innerHTML = '<div class="flex flex-wrap gap-2 items-center">'+
    list.map(function(a){
      return '<button onclick="'+a.click+'" class="h-10 px-4 rounded-xl bg-white border text-[12.5px] font-bold text-slate-700 hover:bg-[#0a1e8a] hover:text-white flex items-center gap-2"><i class="ph '+a.icon+'"></i>'+esc(limitarNome(a.label,LIMITE_SUB))+'</button>';
    }).join('')+
    '<button type="button" onclick="window.abrirEditorAtalhos()" class="h-10 px-3 rounded-xl bg-white border text-[12px] font-bold text-[#0a1e8a]"><i class="ph ph-pencil-simple"></i> Atalhos</button>'+
    '</div>';
}

window.abrirEditorAtalhos = function(){
  var cat = catalogoAtalhos();
  var atuais = atalhosAtivos();
  var ids = {};
  atuais.forEach(function(a){ ids[a.id]=a; });
  var box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[680px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Atalhos do Início';
  document.getElementById('modal-body').innerHTML =
    '<p class="text-[12px] text-slate-500 mb-3">Marque os botões, mude o nome e a ordem. Limite: '+LIMITE_SUB+' letras.</p>'+
    '<div id="ui-atalhos-ed" class="space-y-2">'+cat.map(function(a,i){
      var on = !!ids[a.id];
      var nome = on ? ids[a.id].label : a.label;
      return '<div class="flex items-center gap-2 rounded-xl border p-2" data-aid="'+esc(a.id)+'">'+
        '<button type="button" class="neo-btn !px-2 !h-8" onclick="window.uiAtalhoMover(this,-1)">↑</button>'+
        '<button type="button" class="neo-btn !px-2 !h-8" onclick="window.uiAtalhoMover(this,1)">↓</button>'+
        '<input type="checkbox" '+(on?'checked':'')+' class="w-4 h-4">'+
        '<i class="ph '+a.icon+' text-[#0a1e8a]"></i>'+
        '<input maxlength="'+LIMITE_SUB+'" value="'+esc(nome)+'" class="neo-input flex-1 !h-9">'+
        '</div>';
    }).join('')+'</div>';
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border font-bold">Cancelar</button>'+
    '<button onclick="window.salvarEditorAtalhos()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>';
  document.getElementById('modal-root').classList.remove('hidden');
};

window.uiAtalhoMover = function(btn, dir){
  var row = btn.closest('[data-aid]'); if(!row) return;
  var parent = row.parentElement;
  var cards = Array.from(parent.children);
  var i = cards.indexOf(row);
  var j = i+dir;
  if(j<0||j>=cards.length) return;
  if(dir<0) parent.insertBefore(row, cards[j]);
  else parent.insertBefore(cards[j], row);
};

window.salvarEditorAtalhos = function(){
  var body = document.getElementById('ui-atalhos-ed'); if(!body) return;
  var out=[];
  Array.from(body.children).forEach(function(row){
    var ck = row.querySelector('input[type="checkbox"]');
    if(!ck || !ck.checked) return;
    var id = row.getAttribute('data-aid');
    var nome = limitarNome((row.querySelector('input[maxlength]')||{}).value, LIMITE_SUB);
    out.push({ id:id, label:nome });
  });
  if(!out.length){
    if(typeof window.lfbAlert==='function') window.lfbAlert('Deixe pelo menos um atalho.','Atalhos');
    return;
  }
  cfg().uiAtalhos = out;
  gravar();
  if(typeof closeModal==='function') closeModal();
  pintarAtalhos();
  if(typeof toast==='function') toast('Atalhos atualizados','success');
};

if(typeof window.renderDashboard==='function' && !window.renderDashboard.__v52213atalhos){
  var oldD = window.renderDashboard;
  window.renderDashboard = function(){
    var r = oldD.apply(this, arguments);
    setTimeout(pintarAtalhos, 40);
    return r;
  };
  window.renderDashboard.__v52213atalhos = true;
}

setTimeout(pintarMenus, 400);
setTimeout(pintarMenus, 1400);
setTimeout(tirarChamadosLocacao, 900);
setTimeout(tirarChamadosLocacao, 1800);
try{
  new MutationObserver(function(){ tirarChamadosLocacao(); }).observe(document.body, { childList:true, subtree:true });
}catch(e){}

console.log('[DIGICOPY] v5.22.13 menus editáveis + atalhos do Início');
})();
