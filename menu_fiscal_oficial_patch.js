/* ═══════════════════════════════════════════════════════════════════════════
 * menu_fiscal_oficial_patch.js — v6.1.0
 *
 * "po, mas continua feio d+, os menus não estão ficando lá em cima no
 *  NF-e/NFC-e, lá que tem que ficar, e muda esse nome pra ser oficialmente
 *  o MENU FISCAL, e os 6 menus tem que ficar ai" — resposta:
 *
 *  1) A faixa do topo agora se chama oficialmente **Menu Fiscal** (não mais
 *     "NF-e/NFC-e") — aba, flyout lateral e onde mais aparecer.
 *  2) A faixa NÃO SOME quando a tela fiscal re-renderiza por dentro: o
 *     re-render da v6.0.14 (fxReRender) derrubava o innerHTML da view e a
 *     faixa só voltava na sonda do ribbon (atraso visual). Agora um wrap por
 *     cima do __fxReRender614 PRESERVA o nó da faixa (re-insere no mesmo
 *     instante) — e uma sonda leve cobre qualquer outro caminho.
 *  3) Beleza: CSS de acabamento por cima das 6 telas e da faixa (gradiente
 *     suave, grade zebrada, chips de situação coloridos, botões com hover,
 *     campos com foco azul, cards com sombra macia) — só CSS, sem mudar
 *     nenhum texto/literal que os murais protegem.
 *  4) Importador **CLIENTES.json** (mesma pegada do PRODUTOS.json v5.22.21):
 *     mapeamento tolerante aos nomes de campo do sistema antigo, DEL=S pula,
 *     dedupe por documento/código — grava na entidade `clientes` da nuvem.
 *     A página envio_arquivos.html ganha o card de clientes que usa isto.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  if (G.__v6100mfo && G.__v6100mfo.vivo) return;

  /* ── PURE (testável, sem DOM) ─────────────────────────────────────────── */
  var ROTULO_FISCAL = 'Menu Fiscal';
  var TELAS_FISCAIS = ['central-nf', 'fiscal-perfil', 'fiscal-manifestacao', 'fiscal-ncm', 'fiscal-enviar-xml', 'config-fiscal'];

  function txt(v) { return String(v == null ? '' : v).trim(); }
  function linhasDeJson(raw) {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== 'object') return [];
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.dados)) return raw.dados;
    if (Array.isArray(raw.clientes)) return raw.clientes;
    var keys = Object.keys(raw);
    for (var i = 0; i < keys.length; i++) {
      var v = raw[keys[i]];
      if (Array.isArray(v) && v.length && typeof v[0] === 'object') return v;
      if (v && typeof v === 'object' && Array.isArray(v.data)) return v.data;
    }
    return [];
  }
  function primeiro(row, nomes) {
    for (var i = 0; i < nomes.length; i++) {
      if (row[nomes[i]] !== undefined && row[nomes[i]] !== null && txt(row[nomes[i]]) !== '') return row[nomes[i]];
    }
    return '';
  }
  function ehDel(row) { return txt(primeiro(row, ['DEL', 'del', 'EXCLUIDO', 'excluido'])).toUpperCase() === 'S'; }
  function docDe(row) { return txt(primeiro(row, ['CNPJ', 'CPF', 'DOCUMENTO', 'DOC', 'cnpj', 'cpf', 'documento'])).replace(/\D/g, ''); }
  function codDe(row) { return txt(primeiro(row, ['CODIGO', 'COD_CLI', 'COD_CLIENTE', 'CLI_CODIGO', 'ID', 'codigo', 'id'])); }
  function mapearCliente(row) {
    var nome = txt(primeiro(row, ['NOME', 'RAZAO', 'RAZAO_SOCIAL', 'CLIENTE', 'nome', 'razao']));
    var fantasia = txt(primeiro(row, ['FANTASIA', 'NOME_FANTASIA', 'fantasia']));
    var doc = docDe(row);
    return {
      codigo: codDe(row),
      nome: nome,
      fantasia: fantasia,
      cnpj: doc.length > 11 ? doc : '',
      cpf: doc && doc.length <= 11 ? doc : '',
      documento: doc,
      ie: txt(primeiro(row, ['IE', 'INSCRICAO', 'INSC_ESTADUAL', 'ie', 'inscricaoEstadual'])),
      endereco: txt(primeiro(row, ['ENDERECO', 'LOGRADOURO', 'endereco', 'logradouro'])),
      numero: txt(primeiro(row, ['NUMERO', 'NUM', 'numero'])),
      complemento: txt(primeiro(row, ['COMPLEMENTO', 'complemento'])),
      bairro: txt(primeiro(row, ['BAIRRO', 'bairro'])),
      cidade: txt(primeiro(row, ['CIDADE', 'MUNICIPIO', 'cidade', 'municipio'])),
      uf: txt(primeiro(row, ['UF', 'ESTADO', 'uf', 'estado'])).toUpperCase().slice(0, 2),
      cep: txt(primeiro(row, ['CEP', 'cep'])).replace(/\D/g, '').slice(0, 8),
      fone: txt(primeiro(row, ['FONE', 'TELEFONE', 'CELULAR', 'fone', 'telefone', 'celular'])),
      email: txt(primeiro(row, ['EMAIL', 'E_MAIL', 'email'])),
      status: 'ativo'
    };
  }
  function chaveCliente(c) {
    if (c.documento) return 'doc:' + c.documento;
    if (c.codigo) return 'cod:' + c.codigo;
    return 'nome:' + c.nome.toLowerCase();
  }
  /* funde: só preenche campo vazio do cadastro atual (nunca pisa no que já tem) */
  function fundirCliente(atual, novo) {
    var rec = Object.assign({}, atual), mudou = false;
    ['nome', 'fantasia', 'documento', 'cnpj', 'cpf', 'ie', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'fone', 'email'].forEach(function (campo) {
      if (!txt(rec[campo]) && txt(novo[campo])) { rec[campo] = novo[campo]; mudou = true; }
    });
    return { rec: rec, mudou: mudou };
  }
  function prepararImportacao(linhas) {
    var ativas = (linhas || []).filter(function (r) { return r && !ehDel(r); });
    var puladas = (linhas || []).length - ativas.length;
    var mapeados = ativas.map(mapearCliente).filter(function (c) { return c.nome; });
    return { mapeados: mapeados, puladas: puladas };
  }

  G.MFO610_PURE = {
    rotuloFx: ROTULO_FISCAL,
    telasFiscais: TELAS_FISCAIS.slice(),
    linhasDeJson: linhasDeJson, ehDel: ehDel, docDe: docDe, codDe: codDe,
    mapearCliente: mapearCliente, chaveCliente: chaveCliente,
    fundirCliente: fundirCliente, prepararImportacao: prepararImportacao
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = G.MFO610_PURE; }
  if (typeof window === 'undefined' || !window.document) { G.__v6100mfo = { vivo: false }; return; }

  /* ── 1) Nome oficial: a faixa do topo é o MENU FISCAL ─────────────────── */
  function pintaRotuloFx() {
    var trocou = false;
    document.querySelectorAll('.wxr-tab').forEach(function (el) {
      if (el.textContent.indexOf('NF-e/NFC-e') >= 0) {
        el.innerHTML = '<i class="ph ph-file-text" style="font-size:15px"></i>' + ROTULO_FISCAL;
        el.title = 'Menu Fiscal — as 6 telas do fiscal, sempre aqui em cima';
        trocou = true;
      }
    });
    return trocou;
  }
  /* flyout lateral: o ::before ganha o nome oficial via CSS (vem depois → vence) */
  function injetaCss() {
    if (document.getElementById('mfo610-css')) return;
    var st = document.createElement('style');
    st.id = 'mfo610-css';
    st.textContent =
      /* nome oficial no flyout */
      '#sxvm-flyout-nav::before{content:"Menu Fiscal" !important}' +
      /* ── faixa: acabamento (sem mexer em layout/medidas do ribbon) ── */
      '.wxr-bar{border:1px solid #c8d7f2;border-radius:16px;background:linear-gradient(180deg,#ffffff 0%,#eef4ff 55%,#e3eeff 100%);box-shadow:0 12px 30px rgba(10,30,138,.14)}' +
      '.wxr-tab{background:linear-gradient(180deg,#1d4ed8,#1e3a8a);color:#fff !important;border-radius:10px 10px 0 0;box-shadow:0 8px 18px rgba(30,58,138,.35);letter-spacing:.02em}' +
      '.wxr-btn{transition:transform .08s ease, box-shadow .12s ease, border-color .12s ease}' +
      '.wxr-btn:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(15,23,42,.14);border-color:#93c5fd}' +
      '.wxr-btn:active{transform:translateY(0)}' +
      /* ── 6 telas fiscais: beleza por cima do fx614 ── */
      '#view-central-nf,#view-fiscal-perfil,#view-fiscal-manifestacao,#view-fiscal-ncm,#view-fiscal-enviar-xml,#view-config-fiscal{background:linear-gradient(180deg,#f6f9ff 0%,#eef3fc 100%);border-radius:18px;padding:12px}' +
      '.fx-card{box-shadow:0 6px 18px rgba(15,23,42,.06);border:1px solid #e4ebf8 !important}' +
      '.fx-tb thead th{position:sticky;top:0;background:linear-gradient(180deg,#f1f5fb,#e8eef9);z-index:2;box-shadow:0 1px 0 #dbe4f3}' +
      '.fx-tb tbody tr:nth-child(even){background:#f8fbff}' +
      '.fx-tb tbody tr:hover{background:#eef5ff}' +
      '.fx-tab.on{background:#fff;border-color:#1d4ed8;color:#0a1e8a;box-shadow:0 -2px 0 #1d4ed8 inset}' +
      '.fx-btn{transition:transform .08s ease, box-shadow .12s ease}' +
      '.fx-btn:hover:not([disabled]){transform:translateY(-1px);box-shadow:0 6px 14px rgba(15,23,42,.12)}' +
      '.fx-btn.pri{background:linear-gradient(180deg,#2563eb,#1d4ed8);border-color:#1d4ed8}' +
      '.fx-in:focus,.fx-tb input:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.18)}' +
      '.fx-placa{border-radius:12px;letter-spacing:.03em;box-shadow:0 6px 16px rgba(127,29,29,.18)}';
    document.head.appendChild(st);
  }
  /* MutationObserver: renomeia a aba onde quer que a faixa reapareça */
  var obs = null;
  function sobeObserver() {
    if (obs || !document.body) return;
    pintaRotuloFx(); injetaCss();
    obs = new MutationObserver(function () { pintaRotuloFx(); injetaCss(); });
    try { obs.observe(document.body, { childList: true, subtree: true }); } catch (e) { }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sobeObserver);
  } else { sobeObserver(); }

  /* ── 2) A faixa NÃO SOME nas re-renderizações internas das telas fiscais ── */
  function garanteFaixaNaView() {
    try {
      for (var i = 0; i < TELAS_FISCAIS.length; i++) {
        var v = document.getElementById('view-' + TELAS_FISCAIS[i]);
        if (v && v.offsetParent !== null && !v.querySelector(':scope > .wxr-bar') && typeof G.wxrGarante === 'function') { G.wxrGarante(); }
      }
      pintaRotuloFx();
    } catch (e) { }
  }
  function embrulhaReRender() {
    var anterior = G.__fxReRender614;
    if (typeof anterior !== 'function' || anterior.__mfo610) return false;
    var embr = function (view) {
      var alvo = document.getElementById('view-' + (view || ''));
      var barraViva = alvo ? alvo.querySelector(':scope > .wxr-bar') : null;
      var r = anterior.apply(G, arguments);
      try {
        if (alvo) {
          var tinha = alvo.querySelector(':scope > .wxr-bar');
          if (!tinha) {
            if (barraViva) alvo.insertBefore(barraViva, alvo.firstChild);   /* devolve a MESMA faixa, no instante */
            else garanteFaixaNaView();                                    /* se ele tinha removido de vez, reconstrói pela sonda */
          }
        }
        pintaRotuloFx();
      } catch (e) { }
      return r;
    };
    embr.__mfo610 = true;
    G.__fxReRender614 = embr;
    return true;
  }
  /* sonda leve só enquanto uma tela fiscal estiver aberta:
     cobre qualquer caminho de render que não passe pelos wraps */
  var agendada = false;
  function sondaFaixa() {
    if (agendada) return; agendada = true;
    var bateuAlgo = false;
    try {
      for (var i = 0; i < TELAS_FISCAIS.length; i++) {
        var v = document.getElementById('view-' + TELAS_FISCAIS[i]);
        if (v && v.offsetParent !== null) { bateuAlgo = true; break; }
      }
      if (bateuAlgo) { pintaRotuloFx(); garanteFaixaNaView(); injetaCss(); }
    } catch (e) { }
    agendada = false;
  }
  try { setInterval(sondaFaixa, 1500); } catch (e) { }
  embrulhaReRender();
  setTimeout(embrulhaReRender, 0);
  setTimeout(embrulhaReRender, 120);

  /* expõe p/ outros patches e p/ o mural */
  G.mfoGaranteFaixa = garanteFaixaNaView;
  G.__v6100mfo = { vivo: true };
  console.log('[DIGICOPY] v6.1.0 Menu Fiscal oficial (faixa sempre no topo) + importador CLIENTES.json + beleza nas 6 telas');
})();
