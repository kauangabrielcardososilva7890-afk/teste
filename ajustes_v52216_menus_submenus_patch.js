// ═══════════════════════════════════════════════════════════════════════════
// v5.22.16 — Submenus móveis, menus ocultos só no Admin, atalhos na faixa azul
// • Setas sobem/descem submenu dentro do menu
// • Ocultar menu/submenu: quem não é Admin não vê
// • Atalhos ficam na faixa azul do Início (some a faixa branca duplicada)
// • Catálogo de atalhos usa os submenus, não só o menu pai
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var BLOQUEIO_OCULTAR = {sair:true};
var LIMITE_MENU = 18;
var LIMITE_SUB = 24;

function limitarNome(s, max){
  var t = String(s==null?'':s).replace(/\s+/g,' ').trim();
  max = max||LIMITE_MENU;
  if(t.length>max) t = t.slice(0,max).trim();
  return t;
}

function ehCargoAdmin(perfil, login){
  var p = String(perfil==null?'':perfil).trim();
  if(p==='Admin') return true;
  return String(login==null?'':login).trim().toLowerCase()==='kauan';
}

function clonarMenu(m){
  var copy = Object.assign({}, m);
  if(m.items) copy.items = m.items.map(function(it){ return Object.assign({}, it); });
  return copy;
}

function aplicarLayout(padrao, salvo){
  var lista = (padrao||[]).map(clonarMenu);
  if(!salvo || !Array.isArray(salvo.ordem)){
    lista.forEach(function(m){ m.oculto=false; (m.items||[]).forEach(function(it){ it.oculto=false; }); });
    return lista;
  }
  var mapa = {};
  lista.forEach(function(m){ mapa[m.id]=m; });
  var out=[];
  salvo.ordem.forEach(function(id){
    var base = mapa[id];
    if(!base) return;
    var copy = clonarMenu(base);
    var custom = (salvo.nomes||{})[id];
    if(custom) copy.label = limitarNome(custom, LIMITE_MENU);
    copy.oculto = !!(salvo.ocultos||{})[id];
    if(base.items){
      var subSalvo = (salvo.sub||{})[id]||{};
      var ocSub = (salvo.ocultosSub||{})[id]||{};
      var items = base.items.map(function(it){
        var c2 = Object.assign({}, it);
        if(subSalvo[it.id]) c2.label = limitarNome(subSalvo[it.id], LIMITE_SUB);
        c2.oculto = !!ocSub[it.id];
        return c2;
      });
      var subOrdem = (salvo.subOrdem||{})[id];
      if(Array.isArray(subOrdem) && subOrdem.length){
        var imap = {};
        items.forEach(function(it){ imap[it.id]=it; });
        var ordered=[];
        subOrdem.forEach(function(sid){ if(imap[sid]){ ordered.push(imap[sid]); delete imap[sid]; } });
        Object.keys(imap).forEach(function(sid){ ordered.push(imap[sid]); });
        copy.items = ordered;
      } else copy.items = items;
    }
    out.push(copy);
    delete mapa[id];
  });
  Object.keys(mapa).forEach(function(id){
    var rest = clonarMenu(mapa[id]);
    rest.oculto = !!(salvo.ocultos||{})[id];
    (rest.items||[]).forEach(function(it){
      it.oculto = !!((salvo.ocultosSub||{})[id]||{})[it.id];
    });
    out.push(rest);
  });
  return out;
}

function menusParaUsuario(menus, isAdmin){
  var out=[];
  (menus||[]).forEach(function(m){
    if(!isAdmin && (m.id==='backup' || m.id==='nuvem')) return;
    if(!isAdmin && m.oculto && !BLOQUEIO_OCULTAR[m.id]) return;
    var copy = clonarMenu(m);
    if(!isAdmin && copy.items){
      copy.items = copy.items.filter(function(it){ return !it.oculto; });
    }
    out.push(copy);
  });
  return out;
}

function catalogoDeSubmenus(padrao){
  var out=[];
  var visto={};
  function add(item){
    if(!item || !item.id || visto[item.id]) return;
    visto[item.id]=true;
    out.push(item);
  }
  (padrao||[]).forEach(function(m){
    if(m.items && m.items.length){
      m.items.forEach(function(it){
        add({id:it.id, icon:it.icon, label:it.label, click:it.click, menuId:m.id, menuLabel:m.label});
      });
    } else if(!BLOQUEIO_OCULTAR[m.id] && m.id!=='inicio' && m.id!=='backup' && m.id!=='nuvem'){
      add({id:m.id, icon:m.icon, label:m.label, click:m.click, menuId:m.id, menuLabel:m.label});
    }
  });
  add({id:'nova-notinha', icon:'ph-plus', label:'Nova notinha', click:'if(typeof novaVenda===\'function\') novaVenda(); else navigateTo(\'vendas\')', menuId:'atendimento', menuLabel:'Atendimento'});
  add({id:'chamados', icon:'ph-wrench', label:'Chamados', click:'openQuickOS()', menuId:'atendimento', menuLabel:'Atendimento'});
  add({id:'estoque', icon:'ph-package', label:'Estoque', click:'navigateTo(\'produtos\')', menuId:'cadastros', menuLabel:'Cadastros'});
  return out;
}

function atalhoOcultoPara(a, salvo, isAdmin){
  if(isAdmin || !a) return false;
  var ocultos = (salvo&&salvo.ocultos)||{};
  var ocultosSub = (salvo&&salvo.ocultosSub)||{};
  var menuId = a.menuId;
  if(menuId && ocultos[menuId]) return true;
  if(menuId && a.id && ocultosSub[menuId] && ocultosSub[menuId][a.id]) return true;
  if(a.id==='nova-notinha' && (ocultos.atendimento || (ocultosSub.atendimento||{})['nova-venda'])) return true;
  if(a.id==='chamados' && (ocultos.atendimento || (ocultosSub.atendimento||{})['abrir-chamado'])) return true;
  return false;
}

function moverNoPai(lista, de, para){
  var arr = (lista||[]).slice();
  if(de<0||para<0||de>=arr.length||para>=arr.length||de===para) return arr;
  var item = arr.splice(de,1)[0];
  arr.splice(para,0,item);
  return arr;
}

window.MENUS_SUBMENUS_PURE = {
  LIMITE_MENU: LIMITE_MENU,
  LIMITE_SUB: LIMITE_SUB,
  BLOQUEIO_OCULTAR: BLOQUEIO_OCULTAR,
  ehCargoAdmin: ehCargoAdmin,
  aplicarLayout: aplicarLayout,
  menusParaUsuario: menusParaUsuario,
  catalogoDeSubmenus: catalogoDeSubmenus,
  atalhoOcultoPara: atalhoOcultoPara,
  moverNoPai: moverNoPai,
  limitarNome: limitarNome
};

if(typeof document==='undefined') return;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function cfg(){ if(typeof db==='undefined') return {}; db.config = db.config||{}; return db.config; }
function gravar(){ if(typeof saveDB==='function') saveDB(); }
function base(){ return window.MENUS_ATALHOS_PURE||{}; }
function padraoMenus(){ return typeof base().menusPadrao==='function' ? base().menusPadrao() : []; }

function sessAdmin(){
  try{
    var s = typeof getSession==='function' ? getSession() : null;
    return ehCargoAdmin(s&&s.perfil, s&&s.login);
  }catch(e){ return false; }
}

function menusAtivos(){
  return aplicarLayout(padraoMenus(), cfg().uiMenus||null);
}

function catalogoAtalhos(){
  var cat = catalogoDeSubmenus(padraoMenus());
  var nomes = ((cfg().uiMenus||{}).sub)||{};
  cat.forEach(function(a){
    var sub = nomes[a.menuId]||{};
    if(sub[a.id]) a.label = limitarNome(sub[a.id], LIMITE_SUB);
  });
  return cat;
}

function atalhosAtivos(){
  var salvoA = cfg().uiAtalhos;
  var cat = {};
  catalogoAtalhos().forEach(function(a){ cat[a.id]=a; });
  var admin = sessAdmin();
  var uiMenus = cfg().uiMenus||null;
  var list;
  if(!salvoA || !Array.isArray(salvoA) || !salvoA.length){
    list = (typeof base().atalhosPadrao==='function' ? base().atalhosPadrao() : []).map(function(a){ return Object.assign({}, cat[a.id]||a); });
  } else {
    list = salvoA.map(function(a){
      var found = cat[a.id];
      if(!found) return null;
      return { id: found.id, icon: found.icon, label: limitarNome(a.label||found.label, LIMITE_SUB), click: found.click, menuId: found.menuId, menuLabel: found.menuLabel };
    }).filter(Boolean);
  }
  return list.filter(function(a){ return !atalhoOcultoPara(a, uiMenus, admin); });
}

function htmlModulo(m){
  var btnId = m.btnId ? ' id="'+m.btnId+'"' : '';
  var wrapId = m.wrapId ? ' id="'+m.wrapId+'"' : '';
  var title = m.title ? ' title="'+esc(m.title)+'"' : '';
  var type = (m.btnId==='btn-backup-top'||m.btnId==='btn-nuvem') ? ' type="button"' : '';
  var menuId = m.menuId ? ' id="'+m.menuId+'"' : '';
  var fade = m.oculto ? ' style="opacity:.55"' : '';
  var sub = '';
  if(m.items && m.items.length){
    sub = '<div'+menuId+' class="module-menu">'+m.items.map(function(it){
      var f2 = it.oculto ? ' style="opacity:.55"' : '';
      return '<button onclick="'+it.click+'"'+f2+'><i class="ph '+it.icon+'"></i>'+esc(it.label)+'</button>';
    }).join('')+'</div>';
  }
  return '<div class="module"'+wrapId+fade+'><button'+btnId+type+title+' onclick="'+m.click+'"><i class="ph '+m.icon+'"></i>'+esc(limitarNome(m.label, LIMITE_MENU))+'</button>'+sub+'</div>';
}

window.pintarMenus = function(){
  var row = document.querySelector('.module-row');
  if(!row) return;
  var status = row.querySelector('.ml-auto');
  var admin = sessAdmin();
  var vis = menusParaUsuario(menusAtivos(), admin);
  var html = vis.map(htmlModulo).join('');
  html += '<div class="module"><button type="button" title="Editar ordem, nome e visibilidade dos menus" onclick="window.abrirEditorMenus()"><i class="ph ph-arrows-out-cardinal"></i>Menus</button></div>';
  if(status) html += status.outerHTML;
  row.innerHTML = html;
  try{ if(window.DIGICOPY_CLOUD && typeof window.DIGICOPY_CLOUD.refreshVisibility==='function') window.DIGICOPY_CLOUD.refreshVisibility(); }catch(e){}
};

window.uiMenuMover = function(btn, dir){
  var row = btn && btn.closest ? btn.closest('[data-mid]') : null;
  if(!row) return;
  var parent = row.parentElement;
  var cards = Array.from(parent.children);
  var i = cards.indexOf(row);
  var j = i+dir;
  if(j<0||j>=cards.length) return;
  if(dir<0) parent.insertBefore(row, cards[j]);
  else parent.insertBefore(cards[j], row);
};

window.uiSubMenuMover = function(btn, dir){
  var row = btn && btn.closest ? btn.closest('[data-sid]') : null;
  if(!row) return;
  var parent = row.parentElement;
  var cards = Array.from(parent.children);
  var i = cards.indexOf(row);
  var j = i+dir;
  if(j<0||j>=cards.length) return;
  if(dir<0) parent.insertBefore(row, cards[j]);
  else parent.insertBefore(cards[j], row);
};

window.abrirEditorMenus = function(){
  var atuais = menusAtivos();
  if(!sessAdmin()){
    atuais = atuais.filter(function(m){ return m.id!=='backup' && m.id!=='nuvem'; });
  }
  var box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[760px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Ordem, nomes e visibilidade';
  document.getElementById('modal-body').innerHTML =
    '<p class="text-[12px] text-slate-500 mb-3">Mova menu e submenu. Marque <b>Oculto</b> para esconder de quem não é Admin. Limite: '+LIMITE_MENU+' letras no menu, '+LIMITE_SUB+' no submenu.</p>'+
    '<div id="ui-menus-ed" class="space-y-2">'+atuais.map(function(m){
      var trava = !!BLOQUEIO_OCULTAR[m.id];
      var subs = (m.items||[]).map(function(it){
        return '<div class="flex items-center gap-2 pl-6 mt-1" data-sid="'+esc(it.id)+'">'+
          '<button type="button" class="neo-btn !px-2 !h-8" onclick="window.uiSubMenuMover(this,-1)">↑</button>'+
          '<button type="button" class="neo-btn !px-2 !h-8" onclick="window.uiSubMenuMover(this,1)">↓</button>'+
          '<i class="ph '+it.icon+' text-[#0a1e8a]"></i>'+
          '<input data-sub="'+esc(m.id)+'" data-sid="'+esc(it.id)+'" maxlength="'+LIMITE_SUB+'" value="'+esc(it.label)+'" class="neo-input flex-1 !h-9">'+
          '<label class="text-[11px] font-bold text-slate-500 flex items-center gap-1 whitespace-nowrap"><input type="checkbox" data-oc-sub '+(it.oculto?'checked':'')+'> Oculto</label>'+
          '</div>';
      }).join('');
      return '<div class="rounded-xl border p-2" data-mid="'+esc(m.id)+'">'+
        '<div class="flex items-center gap-2">'+
        '<button type="button" class="neo-btn !px-2 !h-8" onclick="window.uiMenuMover(this,-1)">↑</button>'+
        '<button type="button" class="neo-btn !px-2 !h-8" onclick="window.uiMenuMover(this,1)">↓</button>'+
        '<i class="ph '+m.icon+' text-[#0a1e8a]"></i>'+
        '<input data-menu="'+esc(m.id)+'" maxlength="'+LIMITE_MENU+'" value="'+esc(m.label)+'" class="neo-input flex-1 !h-9">'+
        (trava?'<span class="text-[11px] text-slate-400">sempre visível</span>':
          '<label class="text-[11px] font-bold text-slate-500 flex items-center gap-1 whitespace-nowrap"><input type="checkbox" data-oc-menu '+(m.oculto?'checked':'')+'> Oculto</label>')+
        '</div>'+(subs?'<div data-subs>'+subs+'</div>':'')+'</div>';
    }).join('')+'</div>';
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border font-bold">Cancelar</button>'+
    '<button onclick="window.salvarEditorMenus()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>';
  document.getElementById('modal-root').classList.remove('hidden');
};

window.salvarEditorMenus = function(){
  var body = document.getElementById('ui-menus-ed'); if(!body) return;
  var ordem=[], nomes={}, sub={}, subOrdem={}, ocultos={}, ocultosSub={};
  Array.from(body.children).forEach(function(card){
    var id = card.getAttribute('data-mid');
    if(!id) return;
    ordem.push(id);
    var inp = card.querySelector('input[data-menu]');
    nomes[id] = limitarNome(inp&&inp.value, LIMITE_MENU) || id;
    var ck = card.querySelector('input[data-oc-menu]');
    if(ck && ck.checked && !BLOQUEIO_OCULTAR[id]) ocultos[id]=true;
    sub[id] = {};
    subOrdem[id] = [];
    ocultosSub[id] = {};
    var box = card.querySelector('[data-subs]');
    Array.from((box?box.children:[])).forEach(function(row){
      if(!row.getAttribute || !row.getAttribute('data-sid')) return;
      var sid = row.getAttribute('data-sid');
      if(!sid) return;
      subOrdem[id].push(sid);
      var s = row.querySelector('input[data-sub]');
      sub[id][sid] = limitarNome(s&&s.value, LIMITE_SUB);
      var cks = row.querySelector('input[data-oc-sub]');
      if(cks && cks.checked) ocultosSub[id][sid]=true;
    });
  });
  cfg().uiMenus = { ordem:ordem, nomes:nomes, sub:sub, subOrdem:subOrdem, ocultos:ocultos, ocultosSub:ocultosSub };
  gravar();
  if(typeof closeModal==='function') closeModal();
  window.pintarMenus();
  window.pintarAtalhos();
  if(typeof toast==='function') toast('Menus atualizados','success');
};

function acharFaixaAzul(view){
  var els = view.querySelectorAll('div');
  for(var i=0;i<els.length;i++){
    var c = String(els[i].className||'');
    if(c.indexOf('from-[#0a1e8a]')>=0 && c.indexOf('to-[#142ecc]')>=0) return els[i];
  }
  return null;
}

window.pintarAtalhos = function(){
  var view = document.getElementById('view-dashboard'); if(!view) return;
  var branco = document.getElementById('ui-atalhos-inicio');
  if(branco) branco.remove();
  var host = document.getElementById('ui-atalhos-azul');
  if(!host){
    var banner = acharFaixaAzul(view);
    if(!banner) return;
    var wraps = banner.querySelectorAll('.flex.flex-wrap');
    host = wraps.length ? wraps[wraps.length-1] : null;
    if(!host){
      host = document.createElement('div');
      host.className = 'flex flex-wrap gap-2';
      banner.appendChild(host);
    }
    host.id = 'ui-atalhos-azul';
  }
  var list = atalhosAtivos();
  var admin = sessAdmin();
  var html = list.map(function(a, idx){
    var label = esc(limitarNome(a.label, LIMITE_SUB));
    if(idx===0){
      return '<button onclick="'+a.click+'" class="h-10 px-4 rounded-xl bg-white text-[#0a1e8a] font-bold text-[12.5px] hover:bg-white/90 transition flex items-center gap-2 shadow-sm"><i class="ph '+a.icon+' text-[16px]"></i> '+label+'</button>';
    }
    return '<button onclick="'+a.click+'" class="h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-[12.5px] hover:bg-white/20 transition flex items-center gap-2"><i class="ph '+a.icon+' text-[16px]"></i> '+label+'</button>';
  }).join('');
  html += '<button type="button" onclick="window.abrirEditorAtalhos()" class="h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-[12px] hover:bg-white/20 transition flex items-center gap-2"><i class="ph ph-pencil-simple"></i> Atalhos</button>';
  host.innerHTML = html;
};

window.abrirEditorAtalhos = function(){
  var cat = catalogoAtalhos();
  var atuais = atalhosAtivos();
  var ids = {};
  atuais.forEach(function(a){ ids[a.id]=a; });
  var grupos = [];
  var mapaG = {};
  cat.forEach(function(a){
    var g = a.menuLabel || 'Outros';
    if(!mapaG[g]){ mapaG[g]=[]; grupos.push(g); }
    mapaG[g].push(a);
  });
  var box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[680px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[92vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Atalhos do Início';
  var corpo = '<p class="text-[12px] text-slate-500 mb-3">Escolha os <b>submenus</b> que aparecem na faixa azul. Ordem, nome e quais botões. Limite: '+LIMITE_SUB+' letras.</p><div id="ui-atalhos-ed" class="space-y-3">';
  grupos.forEach(function(g){
    corpo += '<p class="text-[11px] font-bold uppercase tracking-wide text-slate-400 mt-2">'+esc(g)+'</p>';
    mapaG[g].forEach(function(a){
      var on = !!ids[a.id];
      var nome = on ? ids[a.id].label : a.label;
      corpo += '<div class="flex items-center gap-2 rounded-xl border p-2" data-aid="'+esc(a.id)+'">'+
        '<button type="button" class="neo-btn !px-2 !h-8" onclick="window.uiAtalhoMover(this,-1)">↑</button>'+
        '<button type="button" class="neo-btn !px-2 !h-8" onclick="window.uiAtalhoMover(this,1)">↓</button>'+
        '<input type="checkbox" '+(on?'checked':'')+' class="w-4 h-4">'+
        '<i class="ph '+a.icon+' text-[#0a1e8a]"></i>'+
        '<input maxlength="'+LIMITE_SUB+'" value="'+esc(nome)+'" class="neo-input flex-1 !h-9">'+
        '</div>';
    });
  });
  corpo += '</div>';
  document.getElementById('modal-body').innerHTML = corpo;
  document.getElementById('modal-footer').innerHTML =
    '<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border font-bold">Cancelar</button>'+
    '<button onclick="window.salvarEditorAtalhos()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar</button>';
  document.getElementById('modal-root').classList.remove('hidden');
};

window.uiAtalhoMover = function(btn, dir){
  var row = btn && btn.closest ? btn.closest('[data-aid]') : null; if(!row) return;
  var parent = document.getElementById('ui-atalhos-ed'); if(!parent) return;
  var cards = Array.from(parent.querySelectorAll('[data-aid]'));
  var i = cards.indexOf(row);
  var j = i+dir;
  if(j<0||j>=cards.length) return;
  var alvo = cards[j];
  if(dir<0) alvo.parentElement.insertBefore(row, alvo);
  else {
    if(alvo.nextSibling) alvo.parentElement.insertBefore(row, alvo.nextSibling);
    else alvo.parentElement.appendChild(row);
  }
};

window.salvarEditorAtalhos = function(){
  var body = document.getElementById('ui-atalhos-ed'); if(!body) return;
  var out=[];
  Array.from(body.querySelectorAll('[data-aid]')).forEach(function(row){
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
  window.pintarAtalhos();
  if(typeof toast==='function') toast('Atalhos atualizados','success');
};

setTimeout(function(){ if(typeof window.pintarMenus==='function') window.pintarMenus(); }, 500);
setTimeout(function(){ if(typeof window.pintarMenus==='function') window.pintarMenus(); }, 1600);
setTimeout(function(){ if(typeof window.pintarAtalhos==='function') window.pintarAtalhos(); }, 80);
setTimeout(function(){ if(typeof window.pintarAtalhos==='function') window.pintarAtalhos(); }, 600);

console.log('[DIGICOPY] v5.22.16 submenus móveis + ocultos só Admin + atalhos na faixa azul');
})();
