// v5.26.4 — Relatório do chamado: DATA DE ATENDIMENTO EM CAIXA GRANDE
// (pedido dele com print: "a parte onde escreve a data de atendimento é
// pequena pra escrever, aumenta um pouco a largura e o tamanho").
//
// Como funciona (sem encostar no patch v5.18.6 que monta o relatório):
// • embrulha window.imprimirChamadoPDF e, SÓ durante a chamada dela,
//   intercepta o document.write da janela de impressão;
// • no HTML do relatório, a linha "Cadastro: … • Atendimento: __/__/____"
//   vira uma CAIXA com linha de assinatura grande (170px, letra 15px bold):
//   dá pra escrever a data com caneta em cima — e quando já vem preenchida,
//   fica bonita do mesmo jeito;
// • o texto miúdo da linha (muted 11px) sobe pra 12.5px, como ele pediu
//   ("aumenta o tamanho");
// • se o relatório mudar e o padrão sumir, o wrap NÃO quebra nada: devolve o
//   HTML original intacto.
// Guard: __v5264cd. Função pura exportada pra teste (V5264_CH_DATA_PURE).
(function(){
  'use strict';
  if (window.__v5264cd) return;
  window.__v5264cd = true;

  var CX = 'display:inline-block;border-bottom:1.5px solid #111;min-width:170px;min-height:22px;padding:1px 10px;text-align:center;font-size:15px;font-weight:700;letter-spacing:1px;vertical-align:bottom';
  function melhorar(html){
    try{
      if(!html || html.indexOf('Atendimento:') < 0 || !/contador/i.test(html)) return html;
      // 1) linha Cadastro • Atendimento → data dentro de caixa pra escrever
      var out = String(html).replace(
        /(<div class="muted">Cadastro: [^<]*?)\s*•\s*Atendimento:\s*([^<]*)(<\/div>)/,
        '$1 &nbsp;•&nbsp; <span style="font-weight:800;color:#0f172a;font-size:13px">Atendimento:</span> <span style="' + CX + '">$2</span>$3'
      );
      // 2) texto miúdo do relatório sobe um clique (11px → 12.5px)
      out = out.replace('.muted{color:#64748b;font-size:11px}', '.muted{color:#64748b;font-size:12.5px}');
      return out;
    }catch(e){ return html; }
  }
  window.V5264_CH_DATA_PURE = { melhorar: melhorar };

  function embrulhar(){
    if (typeof window.imprimirChamadoPDF !== 'function') return false;
    if (window.imprimirChamadoPDF.__v5264cdWrapped) return true;
    var _orig = window.imprimirChamadoPDF;
    var f = function(osId){
      var _open = window.open;
      window.open = function(){
        var w = _open.apply(window, arguments);
        try{
          if (w && w.document && typeof w.document.write === 'function'){
            var _write = w.document.write.bind(w.document);
            w.document.write = function(html){ return _write(melhorar(html)); };
          }
        }catch(e){}
        return w;
      };
      try{ return _orig.apply(this, arguments); }
      finally{ window.open = _open; }
    };
    f.__v5264cdWrapped = true;
    window.imprimirChamadoPDF = f;
    return true;
  }

  // a função do relatório vem do patch v5.18.6; se ainda não existir, tenta de novo
  if (!embrulhar()){
    var tent = 0;
    var iv = setInterval(function(){
      if (embrulhar() || ++tent > 40){ clearInterval(iv); }
    }, 250);
  }
})();
