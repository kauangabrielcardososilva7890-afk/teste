/* navegacao_sem_tela_branca_patch.js (v6.0.12) — MATA A TELA BRANCA DE VEZ.

Relato dele (18/09/2026): "quando eu clico no menu ele fica branco e não
carrega, só em algumas situações o botão fica visível e dá pra clicar de novo;
acontece a mesma coisa com o buscador escolar".

CAUSA RAIZ (lendo o código, não achismo):
  1) navigateTo (app.js) ESCONDE TODAS as .view ANTES de procurar o destino;
  2) Buscador Escola e TODAS as telas fiscais não existem no HTML — nascem sob
     demanda via ensureView(), que as cria COM a classe "hidden" (app.js:287);
  3) ordem fatal: clicou → tudo escondido → destino ainda não existe → o render
     CRIA a tela (escondida) → ninguém des-esconde → BRANCO TOTAL. Na 2ª
     navegação às vezes aparecia ("em algumas situações") porque a view já
     existia no DOM; a barra de cima nunca some (não é .view) — por isso o
     botão "continuava visível" nessas situações.

CORREÇÃO (sem tocar no miolo do app.js — padrão histórico do projeto):
  • wrap de window.navigateTo por cima da cadeia inteira (somos o último patch
    da fila):
      a) ANTES  → ensureView(view): o destino já EXISTE quando o núcleo for
         esconder/mostrar — o 'if(target) remove(hidden)' do núcleo acerta;
      b) DEPOIS → des-esconde de novo (se alguém recriou o container);
      c) se o destino ficou SEM CONTEÚDO (view sem render), em vez de branco
         mostra tela honesta com botão "Voltar ao Início" — nada de branco nunca.
  • Atalhos/flyouts/menus continuam chamando navigateTo normal (onclick inline
    resolve em runtime → cai neste wrap). */
(function () {
  var G = typeof window !== 'undefined' ? window : globalThis;
  if (G.__v60012nav) return;
  G.__v60012nav = true;

  // ── PURE (testável sem DOM) ─────────────────────────────────────────────
  function navAvisoVazio(view, titulo) {
    var v = String(view || '');
    var t = String(titulo || 'Tela sem conteúdo');
    return '<div class="neo-shell"><div class="neo-panel">' +
      '<div class="neo-head"><div><h3>' + t + '</h3><p>O botão funcionou — só faltou a tela carregar</p></div>' +
      '<div class="neo-actions"><button class="neo-btn primary" onclick="navigateTo(\'dashboard\')"><i class="ph ph-house"></i> Voltar ao Início</button></div></div>' +
      '<div style="padding:18px 22px;font-size:13px;color:#475569;line-height:1.6">' +
      '<p>A tela <b style="color:#0a1e8a">' + v + '</b> foi chamada mas não tinha conteúdo pronto para mostrar. ' +
      'Nada foi apagado: seus dados e as outras telas continuam intactos. ' +
      'Se isso aparecer de novo, anote o nome acima e avise.</p>' +
      '</div></div></div>';
  }
  G.NAV612_PURE = { avisoVazio: navAvisoVazio };

  // Views com criação sob demanda que sofriam a tela branca (documentação viva)
  var NAV_SOB_DEMANDA = ['buscador-escola', 'central-nf', 'config-fiscal', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'fiscal-historico', 'fiscal-inutilizar', 'fiscal-ferramentas'];

  // ── O WRAP ──────────────────────────────────────────────────────────────
  function instalar() {
    var anterior = G.navigateTo;
    if (typeof anterior !== 'function') return false;
    if (anterior.__nav612) return true; // já embrulhado
    var embrulhado = function (view) {
      // a) garante o destino ANTES do núcleo esconder tudo
      try { if (typeof G.ensureView === 'function') G.ensureView(view); } catch (e) { }
      var r = anterior.apply(G, arguments);
      // b) garante VISÍVEL depois — nunca mais tela branca
      try {
        var t = G.document ? G.document.getElementById('view-' + view) : null;
        if (t) {
          t.classList.remove('hidden');
          if (!t.innerHTML || !String(t.innerHTML).trim()) {
            t.innerHTML = G.NAV612_PURE.avisoVazio(view, 'Tela sem conteúdo');
          }
        }
      } catch (e) { }
      return r;
    };
    embrulhado.__nav612 = true;
    G.navigateTo = embrulhado;
    return true;
  }
  if (!instalar()) {
    // app.js ainda não subiu (ordem de scripts): espera o DOM pronto
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('DOMContentLoaded', function () { instalar(); });
    }
  }
  G.__v60012navLista = NAV_SOB_DEMANDA;
  if (typeof module !== 'undefined' && module.exports) module.exports = G.NAV612_PURE;
})();
