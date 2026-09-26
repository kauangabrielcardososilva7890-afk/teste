// ═══════════════════════════════════════════════════════════════════════════
// MANDAR O QUE QUEBROU — v7.0.20 (rodada 32, ideia L)
// A DOR (dele): "tem vários problemas, eu não consigo identificar".
// 1 clique monta o pacote (versão + tela + últimos erros, SEM segredo) e abre
// o popup de copiar do sistema — ele cola no chat e a manutenção recebe a prova.
// NÃO é botão de rodapé (o do rodapé não volta, por ordem dele): mora no aviso
// de erro (na hora que quebra) e no check-up da nuvem (quando está estranho mas
// não quebrou nada). Não envia nada sozinho, não toca na nuvem, não pede senha.
// Lê a mesma lista do erro.txt (v52239) — zero mudança no que já existe.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  if(typeof window==='undefined')return;
  var CHAVE_ERROS='digicopy_erros_txt';   // mesma chave do erro.txt (v52239)
  var QTD_LINHAS=15;
  // segredo nunca viaja: chave=valor vira chave=***
  var RE_BEARER_SOOLTO=/\bBearer\s+[A-Za-z0-9\-._~+/=]{4,}/g;
  var RE_CHAVE_VALOR=/(senha|password|passwd|token|authorization|bearer|api[_-]?key|secret|client[_-]?secret)(\s*[:=]\s*)([^\s&;"']+)/gi;
  function redigir(s){
    return String(s==null?'':s).replace(RE_BEARER_SOOLTO,'Bearer ***').replace(RE_CHAVE_VALOR,'$1$2***');
  }
  function telaAtual(){
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
  function ultimosErros(){
    try{
      var bruto=JSON.parse((typeof localStorage!=='undefined'?localStorage.getItem(CHAVE_ERROS):null)||'[]');
      if(!Array.isArray(bruto))return [];
      return bruto.slice(-QTD_LINHAS);
    }catch(e){return [];}
  }
  function montarPacote(){
    var versao=(typeof window.DIGICOPY_APP_VERSION==='string')?window.DIGICOPY_APP_VERSION:'?';
    var quando=''; try{ quando=new Date().toLocaleString('pt-BR'); }catch(e){ quando=new Date().toISOString(); }
    var erros=ultimosErros();
    var linhas=['DIGICOPY — o que quebrou (para mandar à manutenção)',
      'app: v'+versao+' | tela: '+telaAtual()+' | quando: '+quando,
      erros.length?('erros (últimos '+erros.length+'):'):'(nenhum erro registrado — está estranho mas não quebrou nada)'];
    for(var i=0;i<erros.length;i++) linhas.push(redigir(erros[i]));
    // v7.0.22 (ideia E, bloco 1): o diário do portão de escrita vai junto — quando um
    // dado some, o pacote mostra as últimas gravações (quando | onde | por onde).
    // Sem o portão (ou sem gravação ainda): zero linhas novas, pacote idêntico.
    try{
      if(window.DIGICOPY_PORTAO&&typeof window.DIGICOPY_PORTAO.ultimas==='function'){
        var grs=window.DIGICOPY_PORTAO.ultimas(20)||[];
        if(grs.length){
          linhas.push('gravações (últimas '+grs.length+' — quando | onde | por onde):');
          for(var j=0;j<grs.length;j++){
            var h='?'; try{ h=new Date(grs[j].q).toLocaleTimeString('pt-BR'); }catch(e2){ h='?'; }
            linhas.push('  '+h+' | '+(grs[j].tela||'?')+' | '+(grs[j].via||'?'));
          }
        }
      }
    }catch(e3){}
    return linhas.join('\n');
  }
  window.digicopyMandarErro=function(){
    var pacote=montarPacote();
    try{
      if(typeof window.mostrarTextoCopiar==='function') return window.mostrarTextoCopiar('Mandar o que quebrou — cole no chat da manutenção', pacote);
    }catch(e){}
    try{ if(typeof window.toast==='function') window.toast('Não deu para abrir o pacote. Tente de novo.','error'); }catch(e2){}
    return null;
  };
})();
