// ═══════════════════════════════════════════════════════════════════════════
// PATCH v7.0.22 — PORTÃO DE ESCRITA, BLOCO 1 (ideia E): o portão existe e REGISTRA.
// Dor que ataca: "dado que some/volta" — hoje 254 pontos em 109 arquivos gravam
// direto e, quando um dado some, não há registro de quem gravou, quando e por
// qual tela. Este bloco NÃO muda nenhum comportamento: ele embrulha o saveDB e
// o saveDBAgora (os vencedores, do patch da nuvem) e ANOTA cada gravação
// (quando + tela + por onde, e o motivo quando a gravação passa pela função
// única) numa lista curta (50) na memória. A migração dos 254 pontos para a
// função única vem nos próximos blocos, com teste antes/depois.
// O botão "mandar o que quebrou" (v7020) lê este diário e manda junto no pacote.
// Custo por gravação: 1 relógio + 1 olhar nas telas (microssegundos, sem timer,
// sem rede, sem gravar nada em disco — regra 12: PC fraco).
// (Os marcadores SUBSTITUICAO DE PROPOSITO moram junto de cada embrulho, abaixo.)
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  if(typeof window==='undefined')return;
  if(window.DIGICOPY_PORTAO&&window.DIGICOPY_PORTAO.__portaoE)return; // já carregou: mantém o diário
  var MAX=50, LOG=[], TOTAL=0, MOTIVO=''; // MOTIVO: r38 — a função única avisa o porquê antes de gravar; vale para a gravação seguinte
  // Mesma detecção de tela do "mandar o que quebrou" (v7020), copiada de
  // propósito: este patch carrega DEPOIS e não pode depender dele (e ele não
  // pode depender daqui — funciona sem o portão). Lógica testada lá e aqui.
  function tela(){
    try{
      var raiz=document.getElementById('modal-root');
      if(raiz&&!raiz.classList.contains('hidden')&&window.modalContext&&window.modalContext.type)
        return 'janela: '+window.modalContext.type;
      var lista=document.querySelectorAll('section.view, div.view');
      for(var i=0;i<lista.length;i++){
        if(!lista[i].classList.contains('hidden')&&lista[i].id) return String(lista[i].id).replace(/^view-/,'');
      }
      var at=document.querySelector('[data-nav].bg-blue-50, [data-nav].active');
      if(at&&at.getAttribute('data-nav')) return String(at.getAttribute('data-nav'));
    }catch(e){}
    return 'não sei';
  }
  function anotar(via){
    try{
      TOTAL++;
      var ent={q:Date.now(),tela:tela(),via:via};
      if(MOTIVO){ ent.motivo=MOTIVO; MOTIVO=''; }
      LOG.push(ent);
      if(LOG.length>MAX)LOG.splice(0,LOG.length-MAX);
    }catch(e){/* o portão nunca quebra a gravação */}
  }
  window.DIGICOPY_PORTAO={
    __portaoE:true,
    ultimas:function(n){ try{ return LOG.slice(-(Math.max(1,n||20))).map(function(r){ return {q:r.q,tela:r.tela,via:r.via,motivo:r.motivo||''}; }); }catch(e){ return []; } },
    total:function(){ return TOTAL; },
    anotarMotivo:function(m){ try{ MOTIVO=String(m==null?'':m).slice(0,120); }catch(e){ MOTIVO=''; } },
  };
  // SUBSTITUICAO DE PROPOSITO: saveDB — embrulha (encadeia a anterior) para ANOTAR a gravação; delega tudo, muda nada.
  // (escrito aberto, sem volta por nome, DE PROPÓSITO: o mapa das camadas só enxerga
  // atribuição estática — `window[nome]` esconderia o portão da trava D. Duplicação
  // consciente de 8 linhas para a trava continuar vendo quem ganha o saveDB.)
  try{
    var antesDB=window.saveDB;
    if(typeof antesDB==='function'&&!antesDB.__portaoE){
      var previoDB=antesDB;
      window.saveDB=function(){ anotar('saveDB'); return previoDB.apply(this,arguments); };
      window.saveDB.__portaoE=true;
    }
  }catch(e){}
  // SUBSTITUICAO DE PROPOSITO: saveDBAgora — idem, via urgente.
  try{
    var antesAgora=window.saveDBAgora;
    if(typeof antesAgora==='function'&&!antesAgora.__portaoE){
      var previoAgora=antesAgora;
      window.saveDBAgora=function(){ anotar('saveDBAgora'); return previoAgora.apply(this,arguments); };
      window.saveDBAgora.__portaoE=true;
    }
  }catch(e){}
})();
