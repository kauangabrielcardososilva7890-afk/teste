/* ═══════════════════════════════════════════════════════════════════════════
 * submenu_fiscal_oficial_patch.js — v6.1.1
 *
 * "meu deus... dos menus fiscal e da aba fiscal, como vc não está entendendo?
 *  não está mudando nada, continua feio e não adicionou nos submenu do
 *  fiscal que vai virar novo. EU NÃO QUERO QUE APAREÇA QUANDO EU CLICAR
 *  EM NOTA FISCAL entendeu?"
 *
 * Leitura final (a certa):
 *  1) A FAIXA no topo das TELAS (a ribbon da 6.0.13/6.1.0) ESTÁ FORA.
 *     Clicou em Nota Fiscal → abre a tela e NADA aparece pendurado em cima.
 *     (.wxr-bar morre por CSS; os patches velhos seguem intactos no arquivo,
 *      só não mostram mais nada — padrão da casa.)
 *  2) O lugar oficial dos 6 é o SUBMENU do FISCAL: a aba/módulo da barra
 *     passa a se chamar **Fiscal** (não mais "NF-e/NFC-e") e o submenu com
 *     os 6 (Nota Fiscal · Perfil Tributário · Manifestação · NCM ·
 *     Enviar XML · Configurações) ABRE E FICA FIXADO ao clicar na aba —
 *     não é só no hover. Clicou fora ou num item → fecha. Na lateral idem:
 *     o pai "Fiscal" pin o flyout aberto no clique.
 *  3) Mapeador de CLIENTES alinhado AO BANCO REAL (amostra que ele mandou:
 *     COD_CLIENTE / NOME_RAZAOSOCIAL / NOME_FANTASIA / CPF_CNPJ / RG_IE /
 *     RUA-NUMERO-COMPLEMENTO-BAIRRO-CIDADE-UF-CEP / COBRANCA separada /
 *     TELEFONE-CELULAR-CLI_WHATSAPP / CONTATO / EMAIL / BLOQUEADO /
 *     CLI_LIMITE_CREDITO / DESCONTO / REFERENCIA / LATITUDE-LONGITUDE /
 *     campos fiscais NFE_INDIEDEST-NFE_INDFINAL-NFE_OBRIGATORIO-NFE_GOVERNAMENTAL
 *     / TIPO F-J / DT_CADASTRO / DEL=S pula). Ele NÃO quer importar ("vai
 *     dar b.o") — nada é importado sozinho: o mapeador só existe pro dia
 *     que ele decidir, e a página de envio usa exatamente estes campos.
 * ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;
  if (G.__v6101sfo && G.__v6101sfo.vivo) return;

  /* ── PURE — mapeador do cliente conforme o dump REAL (amostra dele) ── */
  function tx(v) { return String(v == null ? '' : v).trim(); }
  function soDig(v) { return tx(v).replace(/\D/g, ''); }
  function ehDelCli(row) { return tx(row && row.DEL).toUpperCase() === 'S'; }
  function mapearClienteOficial(row) {
    var doc = soDig(row.CPF_CNPJ);
    var c = {
      codigo: tx(row.COD_CLIENTE),
      nome: tx(row.NOME_RAZAOSOCIAL),
      fantasia: tx(row.NOME_FANTASIA),
      contato: tx(row.CONTATO),
      tipo: tx(row.TIPO).toUpperCase() === 'J' ? 'J' : (tx(row.TIPO).toUpperCase() === 'F' ? 'F' : ''),
      documento: doc,
      cnpj: doc.length > 11 ? doc : '',
      cpf: (doc && doc.length <= 11) ? doc : '',
      ie: tx(row.RG_IE),
      endereco: tx(row.RUA),
      numero: tx(row.NUMERO),
      complemento: tx(row.COMPLEMENTO),
      bairro: tx(row.BAIRRO),
      cidade: tx(row.CIDADE),
      uf: tx(row.UF).toUpperCase().slice(0, 2),
      cep: soDig(row.CEP).slice(0, 8),
      referencia: tx(row.REFERENCIA),
      fone: tx(row.TELEFONE),
      celular: tx(row.CELULAR),
      whatsapp: tx(row.CLI_WHATSAPP),
      email: tx(row.EMAIL),
      bloqueado: tx(row.BLOQUEADO).toUpperCase() === 'S',
      limiteCredito: Number(row.CLI_LIMITE_CREDITO) || 0,
      desconto: Number(row.DESCONTO) || 0,
      criadoEm: tx(row.DT_CADASTRO),
      latitude: tx(row.LATITUDE),
      longitude: tx(row.LONGITUDE),
      /* endereço de cobrança separado (só preenche quando veio de verdade) */
      cobranca: (tx(row.RUA_COBRANCA) || tx(row.CIDADE_COBRANCA)) ? {
        endereco: tx(row.RUA_COBRANCA), numero: tx(row.NUMERO_COBRANCA),
        complemento: tx(row.COMPLEMENTO_COBRANCA), bairro: tx(row.BAIRRO_COBRANCA),
        cidade: tx(row.CIDADE_COBRANCA), uf: tx(row.UF_COBRANCA).toUpperCase().slice(0, 2),
        cep: soDig(row.CEP_COBRANCA).slice(0, 8), referencia: tx(row.REFERENCIA_COBRANCA)
      } : null,
      /* fiscais do cliente (a nota lê daqui: isento de IE, consumidor final…) */
      nfe: {
        indIeDest: row.NFE_INDIEDEST != null ? Number(row.NFE_INDIEDEST) : 9,
        indFinal: row.NFE_INDFINAL != null ? Number(row.NFE_INDFINAL) : 1,
        obrigatorioNfe: Number(row.NFE_OBRIGATORIO) === 1,
        governamental: Number(row.NFE_GOVERNAMENTAL) === 1
      },
      status: 'ativo'
    };
    return c;
  }

  G.SFO611_PURE = { ehDelCli: ehDelCli, mapearCliente: mapearClienteOficial, rotuloPai: 'Fiscal' };
  if (typeof module !== 'undefined' && module.exports) { module.exports = G.SFO611_PURE; }
  if (typeof window === 'undefined' || !window.document) { G.__v6101sfo = { vivo: false }; return; }

  /* ── 1) A FAIXA DAS TELAS MORRE (não aparece mais ao clicar em Nota Fiscal) ── */
  function injetaCss() {
    if (document.getElementById('sfo611-css')) return;
    var st = document.createElement('style');
    st.id = 'sfo611-css';
    st.textContent =
      /* a ribbon que eu fiz (6.0.13/6.1.0) está desligada — o submenu do Fiscal é o oficial */
      '.wxr-bar{display:none !important;height:0 !important;margin:0 !important;overflow:hidden !important}' +
      /* nome oficial do flyout lateral: Fiscal */
      '#sxvm-flyout-nav::before{content:"Fiscal" !important}' +
      /* submenu FIXADO (clique na aba Fiscal abre e segura) — mesma cara do hover */
      '.module.sfo-pin .module-menu{opacity:1 !important;visibility:visible !important;transform:translateY(0) scale(1) !important}' +
      '.module.sfo-pin>button{background:linear-gradient(180deg,#1d4ed8,#1e3a8a);color:#fff !important;border-radius:10px;box-shadow:0 8px 18px rgba(30,58,138,.30)}' +
      '.module.sfo-pin>button i{color:#fff !important}' +
      '#menu-nfe.module-menu{min-width:250px}' +
      '#menu-nfe button{height:40px}' +
      '#sxvm-flyout-nav.sfo-pin{display:block !important}' +
      '#sxvm-nav-pai.sfo-pin{background:#f1f6ff;border-radius:9px}' +
      '#sxvm-nav-pai.sfo-pin .ph-caret-right{transform:rotate(90deg)}';
    document.head.appendChild(st);
  }

  /* ── 2) Aba/módulo "NF-e/NFC-e" vira oficialmente **Fiscal** ─────────── */
  function ehBotaoPaiFiscal(el) {
    if (!el || !el.closest) return false;
    var mod = el.closest('.module');
    if (mod && mod.querySelector('#menu-nfe') && mod.querySelector(':scope > button') === botaoDe(el)) return true;
    return false;
  }
  function botaoDe(el) { return el.tagName === 'BUTTON' || el.closest('button') ? (el.tagName === 'BUTTON' ? el : el.closest('button')) : null; }
  function renomeiaPai() {
    document.querySelectorAll('.module').forEach(function (mod) {
      if (!mod.querySelector('#menu-nfe')) return;
      var b = mod.querySelector(':scope > button');
      if (b && b.textContent.indexOf('NF-e/NFC-e') >= 0) {
        b.innerHTML = '<i class="ph ph-file-text"></i>Fiscal';
        b.title = 'Menu Fiscal — clica pra abrir os 6 do fiscal';
      }
    });
    /* lateral: o pai do flyout (criado pela 6.0.11) */
    var pai = document.getElementById('sxvm-nav-pai');
    if (pai && pai.textContent.indexOf('NF-e/NFC-e') >= 0) {
      var icone = pai.querySelector('i');
      var caret = pai.querySelector('.ph-caret-right');
      pai.innerHTML = '';
      if (icone) pai.appendChild(icone);
      pai.appendChild(document.createTextNode('Fiscal'));
      if (caret) pai.appendChild(caret);
    }
  }

  /* pin: abre o submenu da aba Fiscal e segura até clicar fora/num item */
  function despinTodos(excecao) {
    document.querySelectorAll('.module.sfo-pin, #sxvm-nav-pai.sfo-pin, #sxvm-flyout-nav.sfo-pin').forEach(function (el) {
      if (el !== excecao) el.classList.remove('sfo-pin');
    });
  }
  function onCliqueCaptura(ev) {
    var t = ev.target;
    if (!t || !t.closest) return;

    /* clique na ABA FISCAL da barra clássica: abre o submenu (pin), não navega */
    var mod = t.closest('.module');
    if (mod && mod.querySelector('#menu-nfe') && mod.querySelector(':scope > button') && mod.querySelector(':scope > button').contains(t)) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      var aberto = mod.classList.contains('sfo-pin');
      despinTodos();
      if (!aberto) mod.classList.add('sfo-pin');
      return;
    }
    /* clique num ITEM do submenu do Fiscal: fecha o pin e deixa navegar */
    if (t.closest('#menu-nfe') && t.closest('button')) { despinTodos(); return; }
    /* clique no PAI lateral: pin o flyout */
    var pai = t.closest('#sxvm-nav-pai');
    if (pai) {
      ev.preventDefault(); ev.stopImmediatePropagation();
      var fly = document.getElementById('sxvm-flyout-nav');
      if (fly && fly.style.display === 'none') { try { fly.style.display = 'block'; } catch (e) { } }
      var aberto2 = pai.classList.contains('sfo-pin');
      despinTodos();
      if (!aberto2) { pai.classList.add('sfo-pin'); if (fly) fly.classList.add('sfo-pin'); }
      return;
    }
    /* clique num item do flyout: fecha tudo (a navegação segue pelo handler dele) */
    if (t.closest('#sxvm-flyout-nav')) { despinTodos(); return; }
    /* qualquer outro clique: fecha pins */
    despinTodos();
  }

  function instala() {
    injetaCss(); renomeiaPai();
    if (!document.__sfo611Captura) {
      document.__sfo611Captura = true;
      document.addEventListener('click', onCliqueCaptura, true);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { instala(); });
  else instala();
  /* o pai da lateral é criado depois (runtime) — uma passada tardia cobre */
  setTimeout(renomeiaPai, 400);
  setTimeout(renomeiaPai, 1500);
  var ren = new MutationObserver(function () { renomeiaPai(); });
  try { ren.observe(document.body, { childList: true, subtree: true }); } catch (e) { }

  G.__v6101sfo = { vivo: true };
  console.log('[DIGICOPY] v6.1.1 Submenu Fiscal oficial: faixa das telas DESLIGADA; aba Fiscal abre e fixa os 6; mapeador CLIENTES alinhado ao banco real');
})();
