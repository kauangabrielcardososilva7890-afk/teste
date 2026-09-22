// ═══════════════════════════════════════════════════════════════════════════
// AJUSTES_V6108_LEMBRAR_TELA_PATCH v6.1.8 — pedido dele (22/09/2026):
//   "Lembrar a última ordenação e o último filtro que eu usei — e vai atualizar
//    mesmo assim né?"  →  SIM: guarda sozinho, a cada uso.
//
// O que faz, em palavras simples:
//   • Toda vez que ele clica no título de uma coluna para ordenar (patch
//     historico_sort_patch) ou mexe num filtro/busca da tela, o sistema anota
//     "como ele deixou" AQUELE tela — por USUÁRIO (o dele é dele, o da recepção
//     é da recepção).
//   • Quando ele abre a tela de novo (em qualquer PC), a lista volta arrumada
//     do mesmo jeito: mesmos filtros e mesma ordenação.
//   • Nada de colunas: largura/ocultar coluna NÃO é mexido (foi o que ele
//     escolheu: "segunda opção, só o básico").
//
// Onde fica guardado: `db.config.lembraTela[login][tela]` → sobe para a NUVEM
// pelo saveDB (regra #44: nada de dado do sistema no PC/navegador).
//
// Cuidados de PC fraco (regras #12/#13):
//   • só grava quando o valor REALMENTE mudou e com espera de 800ms (digitar na
//     busca não gera uma gravação por letra);
//   • a reaplicação é uma vez por abertura de tela, com trava para não ficar em
//     laço (a própria reaplicação não é re-anotada).
//
// Guard: __v6108lembra. PURE exportado para os testes (sem DOM).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6108lembra) return;

/* LT6108_PURE_START */
// Nome do usuário (login) — a memória é POR PESSOA, não por PC.
function ltUsuario(sess){
  try{
    if(!sess) return '';
    return String(sess.login||sess.usuarioLogin||sess.usuario||'').trim().toLowerCase();
  }catch(e){ return ''; }
}

// Só campos que são FILTRO/BUSCA da tela entram na memória. Campo de formulário
// (nome do cliente, valor, CPF...) nunca é tocado — senão abriria a tela com
// campo já preenchido, o que seria perigoso.
function ltEhFiltro(id, tag){
  var i=String(id||'');
  if(!i) return false;
  var t=String(tag||'').toLowerCase();
  if(t && t!=='input' && t!=='select') return false;
  if(/^(filtro|filter|busca|search|inp-|sel-)/i.test(i)) return true;
  return /(^|[-_])(filtro|filter|busca|search|situacao|status|periodo|dataini|datafim)([-_]|$)/i.test(i);
}

// Quantos cliques no título da coluna para chegar do jeito que ele deixou?
// (o historico_sort_patch alterna: primeiro clique = ▲, segundo = ▼)
function ltProximoClique(dirAtual, dirQuerida){
  var a=String(dirAtual||''), q=String(dirQuerida||'');
  if(!q) return 0;
  if(a===q) return 0;
  if(!a) return q==='asc'?1:2;
  return 1;   // tem seta e é a outra: um clique troca
}

function ltVazio(){ return {v:1, telas:{}}; }

function ltRaiz(db){
  if(!db) return null;
  db.config=db.config||{};
  var m=db.config.lembraTela;
  if(!m||typeof m!=='object'||!m.telas) m=db.config.lembraTela=ltVazio();
  m.telas=m.telas||{};
  return m;
}

function ltLer(db, login, tela){
  var m=ltRaiz(db); if(!m||!login||!tela) return null;
  var u=m.telas[login]; if(!u) return null;
  return u[tela]||null;
}

// Grava (sem saveDB aqui: quem salva é o chamador, uma vez só)
function ltGravar(db, login, tela, dados){
  var m=ltRaiz(db); if(!m||!login||!tela||!dados) return null;
  m.telas[login]=m.telas[login]||{};
  m.telas[login][tela]=dados;
  return m.telas[login][tela];
}

function ltEsquecer(db, login, tela){
  var m=ltRaiz(db); if(!m||!login) return false;
  if(!m.telas[login]) return false;
  if(tela) delete m.telas[login][tela]; else delete m.telas[login];
  try{ if(typeof saveDB==='function') saveDB(); }catch(e){}
  return true;
}

if(typeof window!=='undefined'){
  window.LT6108_PURE={ ltUsuario:ltUsuario, ltEhFiltro:ltEhFiltro, ltProximoClique:ltProximoClique,
    ltRaiz:ltRaiz, ltLer:ltLer, ltGravar:ltGravar, ltEsquecer:ltEsquecer };
}
/* LT6108_PURE_END */

if(typeof document==='undefined') return;   // testes em Node: só a parte pura

var LT_APLICANDO=false;    // trava: enquanto reaplica, não anota de novo
var LT_TIMER=null;

function ltBanco(){ try{ return (typeof db!=='undefined')?db:null; }catch(e){ return null; } }
function ltSessao(){ try{ return (typeof getSession==='function')?getSession():null; }catch(e){ return null; } }

// Descobre a tela (view) de um elemento — só telas de lista têm memória
function ltTelaDe(el){
  try{
    var v=el&&el.closest?el.closest('section.view,section[id^="view-"]'):null;
    if(!v) return '';
    return String(v.id||'').replace(/^view-/,'') || '';
  }catch(e){ return ''; }
}

function ltSalvarTela(tela, dados){
  if(!tela||!dados) return;
  var login=ltUsuario(ltSessao()); if(!login) return;
  var b=ltBanco(); if(!b) return;
  var antes=ltLer(b,login,tela);
  // compara antes de gravar (PC fraco: não sobe a base à toa)
  if(antes && JSON.stringify(antes)===JSON.stringify(dados)) return;
  ltGravar(b,login,tela,dados);
  try{ if(typeof saveDB==='function') saveDB(); }catch(e){}
}

// ── anotar ordenação (o historico_sort_patch alterna ▲/▼ no clique) ────────
try{
  document.addEventListener('click', function(ev){
    if(LT_APLICANDO) return;
    var th=ev.target&&ev.target.closest?ev.target.closest('th'):null;
    if(!th) return;
    var tabela=th.closest?th.closest('table'):null;
    if(!tabela) return;
    var tela=ltTelaDe(tabela); if(!tela) return;
    setTimeout(function(){
      try{
        var views=tabela.closest('section.view,section[id^="view-"]'); if(!views) return;
        var tabelas=Array.prototype.slice.call(views.querySelectorAll('table'));
        var iTab=tabelas.indexOf(tabela); if(iTab<0) return;
        var ths=Array.prototype.slice.call((tabela.tHead||tabela.querySelector('thead')).querySelectorAll('th'));
        var iCol=ths.indexOf(th); if(iCol<0) return;
        var dir=th.dataset?String(th.dataset.hsDir||''):'';
        if(!dir) return;   // tabela que já ordena sozinha (não é do patch): não anota
        var atual=ltLer(ltBanco(), ltUsuario(ltSessao()), tela) || {};
        atual.tabela={i:iTab, coluna:iCol, dir:dir};
        atual.filtros=atual.filtros||{};
        ltSalvarTela(tela, atual);
      }catch(e){}
    },30);
  }, true);
}catch(e){}

// ── anotar filtros/buscas (só os campos de filtro da tela) ─────────────────
function ltAnotarFiltros(){
  if(LT_APLICANDO) return;
  try{
    var sess=ltSessao(); var login=ltUsuario(sess); if(!login) return;
    var b=ltBanco(); if(!b) return;
    var vistos={};
    document.querySelectorAll('section.view,section[id^="view-"]').forEach(function(v){
      if(v.classList && v.classList.contains('hidden')) return;
      var tela=String(v.id||'').replace(/^view-/,''); if(!tela) return;
      var campos=v.querySelectorAll('input,select');
      var filtros={};
      Array.prototype.forEach.call(campos, function(c){
        if(!ltEhFiltro(c.id, c.tagName)) return;
        if(c.type==='password'||c.type==='file'||c.type==='checkbox'||c.type==='radio') return;
        filtros[c.id]=String(c.value==null?'':c.value);
      });
      if(!Object.keys(filtros).length) return;
      vistos[tela]=filtros;
      var atual=ltLer(b,login,tela)||{};
      var antes=atual.filtros||{};
      if(JSON.stringify(antes)===JSON.stringify(filtros) && atual.tabela) return;
      atual.filtros=filtros;
      ltSalvarTela(tela, atual);
    });
  }catch(e){}
}
try{
  document.addEventListener('change', function(ev){
    if(LT_APLICANDO) return;
    var alvo=ev.target; if(!alvo||!ltEhFiltro(alvo.id, alvo.tagName)) return;
    if(LT_TIMER) clearTimeout(LT_TIMER);
    LT_TIMER=setTimeout(ltAnotarFiltros, 800);      // espera ele parar de mexer
  }, true);
}catch(e){}

// ── reaplicar quando a tela abre ───────────────────────────────────────────
function ltAplicar(tela){
  if(!tela) return;
  var b=ltBanco(); var login=ltUsuario(ltSessao()); if(!b||!login) return;
  var memoria=ltLer(b,login,tela); if(!memoria) return;
  var v=document.getElementById('view-'+tela); if(!v) return;

  LT_APLICANDO=true;
  try{
    // 1) filtros primeiro (o próprio sistema re-renderiza a lista com eles)
    var filtros=memoria.filtros||{};
    var mexeu=false;
    Object.keys(filtros).forEach(function(id){
      var c=document.getElementById(id);
      if(!c) return;
      if(String(c.value||'')===String(filtros[id]||'')) return;
      c.value=filtros[id]; mexeu=true;
      try{ c.dispatchEvent(new Event('input',{bubbles:true})); }catch(e){}
      try{ c.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){}
    });
    // 2) ordenação depois (a lista pode ter sido redesenhada pelos filtros)
    var espera=mexeu?320:120;
    setTimeout(function(){
      try{
        var t=memoria.tabela;
        if(t&&typeof t.i==='number'){
          var tabelas=Array.prototype.slice.call(v.querySelectorAll('table'));
          var tabela=tabelas[t.i];
          if(tabela){
            var th=((tabela.tHead||tabela.querySelector('thead')).querySelectorAll('th'))[t.coluna];
            if(th){
              var cliques=ltProximoClique(th.dataset?th.dataset.hsDir:'', t.dir);
              for(var k=0;k<cliques;k++) th.click();
            }
          }
        }
      }catch(e){}
      setTimeout(function(){ LT_APLICANDO=false; }, 260);
    }, espera);
  }catch(e){ LT_APLICANDO=false; }
}

// navigateTo aprende: depois de pintar a tela, devolve o jeito dele
try{
  if(typeof window.navigateTo==='function' && !window.navigateTo.__v6108lembra){
    var _nav=window.navigateTo;
    window.navigateTo=function(view){
      var r=_nav.apply(this,arguments);
      if(typeof view==='string' && view!=='navegador'){
        setTimeout(function(){ try{ ltAplicar(view); }catch(e){} }, 260);
      }
      return r;
    };
    window.navigateTo.__v6108lembra=true;
  }
}catch(e){}

window.lt6108Esquecer=function(tela){
  var login=ltUsuario(ltSessao()); if(!login) return false;
  return ltEsquecer(ltBanco(), login, tela||'');
};

window.__v6108lembra={vivo:true,versao:'6.1.8'};
console.log('[DIGICOPY] v6.1.8 Lembrar a tela (última ordenação e último filtro, por usuário, na nuvem)');
})();
