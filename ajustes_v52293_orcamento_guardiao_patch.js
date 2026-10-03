// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.22.93 — guardião do banco de orçamentos
//
// Três dias de diagnóstico mostraram: o orçamento ESTÁ na lista e, na hora do
// clique, já NÃO está no banco. Alguém tira ele do array entre uma coisa e a
// outra — e os nomes conhecidos não confessaram. Então agora ninguém precisa
// confessar: este guardião anota TODA SAÍDA de registro do array db.orcamentos
// com horário e trilha (quem chamou), num anel no próprio PC (__orc_saiu).
// O aviso de "não achei" (v5.22.91/92) passa a mostrar a última baixa — o
// usuário manda o texto e a causa aparece escrita.
//
// Também corrige onde o retrato da lista é guardado: a listagem que o usuário
// VÊ é a definição mais nova de renderOrcamentos; este arquivo roda por último
// e amarra o retrato nela (antes o retrato ficava na listagem velha e dizia
// sempre "NÃO estava", mesmo quando estava).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var CHAVE_LOG = '__orc_saiu';
var MAX_LOG = 12;

function anotarSaida(tinham, ficaram, origem){
  try{
    var log = JSON.parse(localStorage.getItem(CHAVE_LOG) || '[]');
    var foram = tinham.filter(function(x){ return ficaram.indexOf(x) < 0; });
    log.push({
      quando: new Date().toISOString(),
      saiu: foram.join(',').slice(0, 120),
      origem: String(origem || '').slice(0, 140)
    });
    if(log.length > MAX_LOG) log = log.slice(-MAX_LOG);
    localStorage.setItem(CHAVE_LOG, JSON.stringify(log));
  }catch(e){}
}

function idsOrc(){
  try{
    if(typeof db === 'undefined' || !Array.isArray(db.orcamentos)) return null;
    return db.orcamentos.map(function(x){ return String(x && x.id); });
  }catch(e){ return null; }
}

// Cão de guarda leve: a cada 400 ms compara os ids. Se alguém tirou registro
// (splice, filter, replace do array), anota com a pilha da chamada seguinte.
var ultimoRetrato = null;
function vigia(){
  if(typeof document === 'undefined') return;
  ultimoRetrato = idsOrc();
  setInterval(function(){
    var agora = idsOrc();
    if(!agora) return;
    if(ultimoRetrato && agora.length < ultimoRetrato.length){
      anotarSaida(ultimoRetrato, agora, (new Error('vigia')).stack);
    }
    ultimoRetrato = agora;
  }, 400);
}

// Retrato da listagem VISÍVEL (a última versão de renderOrcamentos que existir)
function amarrarRetratoDaLista(){
  if(typeof window.renderOrcamentos !== 'function' || window.renderOrcamentos.__v52293) return;
  var antiga = window.renderOrcamentos;
  var embrulhada = function(){
    var r = antiga.apply(this, arguments);
    try{
      var base = idsOrc() || [];
      localStorage.setItem('__orc_render_ids', JSON.stringify(base.slice(0, 80)));
      ultimoRetrato = base;
    }catch(e){}
    return r;
  };
  embrulhada.__v52293 = true;
  embrulhada.__v52243status = antiga.__v52243status;
  embrulhada.__v52244orc = antiga.__v52244orc;
  window.renderOrcamentos = embrulhada;
}

// A trilha da última baixa entra no aviso "não achei"
function resumoUltimaBaixa(){
  try{
    var log = JSON.parse(localStorage.getItem(CHAVE_LOG) || '[]');
    var u = log[log.length - 1];
    if(!u) return 'nenhuma baixa anotada ainda';
    return 'última baixa: saiu [' + (u.saiu || '?') + '] às ' + String(u.quando || '').slice(11, 19);
  }catch(e){ return '?'; }
}
window.__orcResumoUltimaBaixa = resumoUltimaBaixa;

if(typeof document !== 'undefined'){
  vigia();
  amarrarRetratoDaLista();
  // Se a listagem for trocada depois por outro módulo carregando tarde, reamarra
  setTimeout(amarrarRetratoDaLista, 1500);
  setTimeout(amarrarRetratoDaLista, 5000);
}

})();
