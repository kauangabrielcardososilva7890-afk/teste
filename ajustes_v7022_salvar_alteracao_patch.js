// ═══════════════════════════════════════════════════════════════════════════
// PATCH v7.0.24 — FUNÇÃO ÚNICA DE GRAVAÇÃO, BLOCO 2 (ideia E): os pontos migram.
// Dor que ataca: "dado que some/volta" — o portão (bloco 1) já anota quando,
// tela e via de TODA gravação; faltava o QUÊ e o PORQUÊ de cada ponto. Esta
// função é o destino da migração: os 224 pontos trocam o `saveDB()` direto por
// ela, em blocos, cada bloco com teste comparando o ANTES e o DEPOIS.
//
// Contrato (curto e garantido por teste):
//   salvarAlteracao(lista, registro, motivo)
//   - registro com id que NÃO está em db[lista] → entra (push); se já está lá
//     (mutação in-place, o caso mais comum) → não duplica, segue adiante.
//   - registro null → mudança de lista sem registro único (filtro, correção em
//     massa): não mexe no db, só anota e grava.
//   - motivo (até 120 letras) vai para o diário do portão junto da gravação.
//   - NUNCA inventa forma no db (lista ausente/não-lista: só anota e grava).
//   - o diário nunca quebra a gravação; o retorno é o do saveDB de sempre.
// Padrão de migração (1 linha, com volta para o save direto):
//   if(typeof salvarAlteracao==='function')salvarAlteracao('L',reg,'motivo');else if(typeof saveDB==='function')saveDB();
// Bloco 2 (este): 3 sites — v52224 aplicarUmaVez + v5196 excluirUsuario/excluirTecnico.
// Custo: 1 varredura por id quando há registro (bloco 2 só usa registro null:
// custo zero além do save normal — regra 12: PC fraco).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  if(typeof window==='undefined')return;
  if(window.salvarAlteracao&&window.salvarAlteracao.__portaoE2)return; // já carregou
  function salvarAlteracao(lista, registro, motivo){
    var base=null;
    if(typeof window!=='undefined'&&window&&window.db) base=window.db;
    if(!base&&typeof db!=='undefined'&&db) base=db;
    // Coloca o registro na lista SOMENTE se ele ainda não está lá. Sem
    // try/catch DE PROPÓSITO: o comportamento de erro tem que ser idêntico ao
    // do `push` direto que esta linha substitui (o teste antes/depois garante).
    if(base&&lista&&registro&&registro.id!=null){
      var arr=base[lista];
      if(Array.isArray(arr)){
        var tem=false;
        for(var i=0;i<arr.length;i++){ if(arr[i]&&arr[i].id===registro.id){ tem=true; break; } }
        if(!tem) arr.push(registro);
      }
    }
    var mot='';
    try{ mot=String(motivo==null?'':motivo).slice(0,120); }catch(e){ mot=''; }
    var fnSave=null;
    if(typeof window!=='undefined'&&window&&typeof window.saveDB==='function') fnSave=window.saveDB;
    else if(typeof saveDB==='function') fnSave=saveDB;
    if(fnSave&&mot){
      try{
        if(window.DIGICOPY_PORTAO&&typeof window.DIGICOPY_PORTAO.anotarMotivo==='function')
          window.DIGICOPY_PORTAO.anotarMotivo(mot);
      }catch(e){/* o diário nunca quebra a gravação */}
    }
    if(fnSave) return fnSave();
    return undefined;
  }
  salvarAlteracao.__portaoE2=true;
  window.salvarAlteracao=salvarAlteracao;
})();
