// ═══════════════════════════════════════════════════════════════════════════
// v5.22.45 — Versão sozinha no meio do rodapé.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var VERSAO = '5.22.45';

window.RODAPE_VERSAO_V52245_PURE = { VERSAO: VERSAO };

if(typeof document==='undefined') return;

// v6.1.4 (22/09/2026) — DONO: "por que o rodapé de versões parou de atualizar?".
// Resposta curta: o número só muda quando a VERSÃO muda (bump), e várias
// correções saíram dentro da mesma 6.1.3. Agora o rodapé mostra duas coisas:
// a versão do sistema E o CARIMBO do arquivo que o navegador está rodando
// agora (o mesmo hash que vai na URL do app.bundle.js). Mudou uma linha do
// sistema e publicou? O carimbo muda na hora — dá para conferir se o arquivo
// novo chegou neste PC sem depender de número de versão.
function seloDoBuild(){
  try{
    var s = document.querySelector('script[src*="app.bundle.js"]');
    if(!s) return '';
    var m = String(s.getAttribute('src')||'').match(/-([0-9a-f]{6,})/i);
    return m ? m[1].slice(0,8) : '';
  }catch(e){ return ''; }
}
function pintarRodape(){
  var curV = (typeof window !== 'undefined' && window.DIGICOPY_APP_VERSION) || VERSAO;
  var foot = document.querySelector('footer');
  if(!foot) return;
  foot.className = 'h-12 px-8 grid grid-cols-3 items-center text-[11px] text-slate-400 border-t bg-white/60';
  var left = foot.querySelector('span:not(#footer-session):not(#footer-version)');
  var sess = document.getElementById('footer-session');
  var ver = document.getElementById('footer-version');
  if(!ver){
    ver = document.createElement('span');
    ver.id = 'footer-version';
    ver.className = 'text-center font-bold text-slate-500';
    if(sess) foot.insertBefore(ver, sess);
    else foot.appendChild(ver);
  }
  var selo = seloDoBuild();
  ver.textContent = 'v'+curV + (selo ? ' • '+selo : '');
  ver.setAttribute('data-versao', curV);
  ver.setAttribute('data-build', selo || 'sem-carimbo');
  ver.title = 'Versão do sistema v'+curV + (selo ? ' • carimbo do arquivo que está rodando agora: '+selo : '') +
    ' — o carimbo muda a cada correção publicada (é o mesmo pedaço que vai na URL do app.bundle.js).';
  if(left){
    // v6.1.4 — o texto da esquerda era fixo ("Banco na Nuvem") mesmo quando a
    // nuvem não estava conectada. Agora diz onde o banco está de verdade.
    var online = false;
    try{ online = !!(window.DIGICOPY_CLOUD && typeof window.DIGICOPY_CLOUD.token === 'function' && window.DIGICOPY_CLOUD.token()); }catch(e){}
    // v7.0.7 — aqui havia um `querySelector('button')` para "não perder o botão
    // erro.txt" ao reescrever o rodapé. O botão foi removido a pedido do dono
    // (23/09/2026) e não existe em nenhuma tela; a linha só reintroduzia o texto
    // morto. Se algum dia voltar um botão aqui, ele precisa ser re-appendado
    // neste ponto. (Conferido: o rodapé atual não tem nenhum botão.)
    // v6.1.5 — MODO SÓ NUVEM (ordem do dono): quando está ligado, este PC não
    // guarda a base; o rodapé diz isso com todas as letras.
    var soNuvem = false;
    try{ soNuvem = !!(window.DIGICOPY_SO_NUVEM && online); }catch(e){}
    left.textContent = soNuvem
      ? 'Sistema Digicopy • dados só na nuvem (este PC não guarda cópia)'
      : (online ? 'Sistema Digicopy • banco neste PC + nuvem conectada' : 'Sistema Digicopy • banco só neste PC');
    left.title = soNuvem
      ? 'Tudo o que você cria vai para a nuvem na hora. Este computador não guarda cópia dos dados — ao abrir, ele lê tudo da nuvem de novo.'
      : (online
        ? 'O sistema guarda aqui e também na nuvem; o que um PC tem aparece no outro.'
        : 'Ainda não conectou na nuvem: o que existe aqui é só deste computador.');
    left.classList.add('text-left');
  }
  if(sess){
    sess.classList.add('text-right');
    // v6.1.4 (22/09/2026) — o canto direito era texto fixo "Empresa - Usuário".
    // Enquanto ninguém entrou, o honesto é dizer onde o sistema está rodando.
    if(/Empresa\s*-\s*Usu/i.test(sess.textContent || '')){
      var naNuvem = false;
      try{ naNuvem = !!(window.DIGICOPY_CLOUD && typeof window.DIGICOPY_CLOUD.token === 'function' && window.DIGICOPY_CLOUD.token()); }catch(e){}
      sess.textContent = naNuvem ? 'Nuvem conectada • aguardando login' : 'Local • sem nuvem conectada';
      sess.title = naNuvem
        ? 'Este computador está autorizado na nuvem; o nome da empresa e do usuário aparece depois do login.'
        : 'Este computador está usando só o banco local (a nuvem não está conectada aqui).';
    }
  }
}

if(typeof window.navigateTo==='function' && !window.navigateTo.__v52245ver){
  var oldN = window.navigateTo;
  window.navigateTo = function(){
    var r = oldN.apply(this, arguments);
    try{ pintarRodape(); }catch(e){}
    return r;
  };
  window.navigateTo.__v52245ver = true;
}
setTimeout(pintarRodape, 200);
setTimeout(pintarRodape, 800);

console.log('[DIGICOPY] v5.22.45 rodapé: versão no meio');
})();
