// ════════════════════════════════════════════════════════════════════════════
// v5.24.36 — Leitura: UMA ABERTA POR VEZ (decreto dele) + contador "anterior"
// certo na edição pós-estorno.
//
// Relato dele (caminho exato): contrato → leituras → novo → novo lançamento →
// salvar → faturar → extornar → lápis → muda o contador → salvar → a lista
// mostra o ANTERIOR como o contador que foi faturado (não o anterior de
// verdade). Causa raiz (cadeia factual, sem achismo):
//   salvarLancamentoContador calcula anterior = p.contadores[key] VIVO; após o
//   1º lançamento o parque já segura o atual; editar recalcula o anterior pelo
//   parque — e não pelo congelado do item. Decisão DELE: só cria nova leitura
//   quando a aberta estiver fechada (faturada) — estornada continua aberta e
//   BLOQUEIA também (fature ou apague pra liberar).
// ════════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function n(v){ var x=Number(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:0; }
function txt(v){ return String(v==null?'':v).trim(); }

// Leitura "aberta" do contrato = formato novo (itens) e NÃO faturada.
// ('aberta', 'estornada' ou sem status contam como abertas — formato antigo de
// parqueId simples fica fora, é outro fluxo legado.)
function leituraAbertaDoContrato(dbRef, contratoId){
  if(!contratoId) return null;
  return ((dbRef&&dbRef.leituras)||[]).find(function(l){
    return l && l.contratoId===contratoId && Array.isArray(l.itens) && l.status!=='faturado';
  })||null;
}
function rotuloStatus(l){
  var s=(l&&l.status)||'aberta';
  return s==='estornada'?'estornada':'aberta';
}
function msgBloqueioNovaLeitura(l){
  return 'Já existe a leitura '+((l&&l.numero)||'?')+' '+rotuloStatus(l)+' neste contrato. '
    +'Fature (feche) ela antes de criar outra'
    +(rotuloStatus(l)==='estornada'?' — ou apague a leitura, se não for usar.':'.')
    +' Abri ela pra você.';
}

window.LEITURA_UMA_ABERTA_V52436_PURE = {
  leituraAbertaDoContrato: leituraAbertaDoContrato,
  rotuloStatus: rotuloStatus,
  msgBloqueioNovaLeitura: msgBloqueioNovaLeitura
};

if(typeof document==='undefined') return;

function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Leitura'); if(typeof toast==='function') toast(m,'info'); }
function abrirAberta(l, preferida){
  var abridores = [preferida, 'abrirLeituraContratoDetalhe', 'abrirLeituraDetalhada', 'abrirLeituraDefinitiva'];
  for(var i=0;i<abridores.length;i++){
    var f = abridores[i] && window[abridores[i]];
    if(typeof f==='function'){ try{ f(l.id); }catch(e){} return; }
  }
}

// (1) Os 3 caminhos que criam leitura do formato novo — guarda do decreto.
function guarda(nomeFn, abridor){
  if(typeof window[nomeFn]!=='function' || window[nomeFn].__v52436lei) return;
  var old = window[nomeFn];
  window[nomeFn] = function(contratoId){
    if(typeof db!=='undefined'){
      var aberta = leituraAbertaDoContrato(db, contratoId);
      if(aberta){
        aviso(msgBloqueioNovaLeitura(aberta));
        abrirAberta(aberta, abridor);
        return;
      }
    }
    return old.apply(this, arguments);
  };
  window[nomeFn].__v52436lei = true;
}
guarda('novaLeituraContrato', 'abrirLeituraContratoDetalhe');
guarda('criarLeituraDetalhada', 'abrirLeituraDetalhada');
guarda('criarLeituraDefinitiva', 'abrirLeituraDefinitiva');

// (2) Edição pós-estorno: o "anterior" volta a ser o do LANÇAMENTO, não o do
// parque vivo. Antes do salvar original rodar, alinhamos o contador vivo do
// medidor editado ao anterior congelado do item — o original recalcula certo e
// devolve o parque ao novo "atual". Sem duplicar template.
if(typeof window.salvarLancamentoContador==='function' && !window.salvarLancamentoContador.__v52436lei){
  var oldSalvar = window.salvarLancamentoContador;
  window.salvarLancamentoContador = function(leituraId){
    try{
      var idxEl = document.getElementById('lan-edit-idx');
      if(idxEl && txt(idxEl.value)!=='' && typeof db!=='undefined'){
        var l = (db.leituras||[]).find(function(x){ return x.id===leituraId; });
        var item = l && l.itens && l.itens[Number(idxEl.value)];
        if(item){
          var p = (db.parque||[]).find(function(x){ return x.id===item.parqueId; });
          if(p){ p.contadores = p.contadores||{}; p.contadores[item.medidor] = n(item.anterior); }
        }
      }
    }catch(e){}
    return oldSalvar.apply(this, arguments);
  };
  window.salvarLancamentoContador.__v52436lei = true;
}

console.log('[DIGICOPY] ajustes_v52436_leitura_uma_aberta_patch.js v5.24.36 carregado — uma leitura aberta por vez + anterior certo na edição');
})();
