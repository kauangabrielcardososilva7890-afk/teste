// ═══════════════════════════════════════════════════════════════════════════
// SEIS_SUBMENUS_VELHO_PATCH v6.0.10 — pedido dele 18/09 (foto do menu antigo):
// o menu fiscal tem que ficar IGUAL ao do sistema antigo, com EXATAMENTE os 6
// submenus do print e na mesma ordem:
//   1. Nota Fiscal        4. NCM
//   2. Perfil Tributário  5. Enviar XML
//   3. Manifestação       6. Configurações
// ...e dentro de cada um, TUDO que ele pediu em todas as fotos.
//
// O que este patch faz:
//  A) Os 3 atalhos soltos da v6.0.9 (Histórico de Notas / Status & Pacote /
//     Inutilizar Faixa) SAEM do menu — nada morre: viram botões dentro das
//     telas (a Central tem atalho pra Histórico e Inutilizar; o pacote do mês
//     vive em Enviar XML; o teste da SEFAZ vive em Configurações e em Enviar XML).
//  B) 4 telas NOVAS, tela cheia, padrão visual do próprio sistema:
//     - Perfil Tributário: regime (CRT), CNAE/IE/IM (mesmas chaves que a
//       Config. Fiscal já lê — uma verdade só), CFOP de dentro/fora do estado,
//       CSOSN/CST padrão e alíquotas (ICMS interno/interestadual, IPI, PIS,
//       COFINS, ISS) + IBS/CBS da reforma. O perfil cobre o que o item não
//       trouxer, via wrap em NFE_EMISSAO_PURE.fiscalPadrao (sem tocar nascimento).
//     - Manifestação do destinatário: cola a chave (44 dígitos, confere o DV),
//       escolhe Ciência/Confirmação/Desconhecimento/Não realizada, transmite
//       pro AMBIENTE NACIONAL (cOrgao 91 — é lá que evento de destinatário mora,
//       não na SEFAZ-MG) com assinatura na hora (senha não grava). Lista
//       local das manifestações com protocolo.
//     - NCM: favoritos (código+descrição) com "usar como padrão/tinta/locação"
//       gravando nas MESMAS chaves que a Config. Fiscal usa (nfNcmPadrao/
//       nfNcmTinta/nfNcmLocacao) — uma verdade só, sem duplicar cadastro.
//     - Enviar XML: gera o pacote .zip do mês (mesmo motor da 6.0.6), e-mail
//       do contador salvo + botão copiar, contagem de notas do mês em cima.
//       Texto honesto: o envio mesmo é você anexando o zip no e-mail/Zap.
//  C) Permissão: manifestar exige a caixa "emitir NF" — quem não tem, recebe o
//     popup de autorização (login+senha de quem pode), token 3s convergente
//     com o __p609AutorizadoAte da v6.0.9. Tudo auditado.
// Guard: __v60010sxv · PURE: SXV609_PURE (sem DOM, testável).
// NÃO mexer sem rodar: test_ajustes_v60010.js + suíte dupla.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__v60010sxv) return;
  window.__v60010sxv = true;

  // SXV_PURE_START
  function sxvEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sxvDigitos(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }
  function sxvValidaChave(chave) {
    const c = sxvDigitos(chave);
    if (!c) return { ok: false, motivo: 'Cole a chave de acesso da nota.' };
    if (c.length !== 44) return { ok: false, motivo: 'A chave tem que ter 44 números — você colou ' + c.length + '.' };
    // DV (posição 44) confere por módulo 11 — evita protocolo rejeitado na SEFAZ
    let soma = 0, peso = 2;
    for (let i = 42; i >= 0; i--) { soma += parseInt(c[i], 10) * peso; peso = peso === 9 ? 2 : peso + 1; }
    const resto = soma % 11;
    const dv = (resto === 0 || resto === 1) ? 0 : 11 - resto;
    if (dv !== parseInt(c[43], 10)) return { ok: false, motivo: 'Essa chave não confere (dígito verificador errado) — confira se copiou inteirinha.' };
    return { ok: true, chave: c };
  }
  function sxvMascaraChave(chave) { return sxvDigitos(chave).replace(/(\d{4})(?=\d)/g, '$1 ').trim(); }
  var SXV_EVENTOS = [
    { tp: '210210', rot: 'Ciência', desc: 'Ciencia da Operacao', ajuda: 'Só aviso que fiquei sabendo da nota (não confirma nem recusa)', just: false },
    { tp: '210200', rot: 'Confirmar operação', desc: 'Confirmacao da Operacao', ajuda: 'A mercadoria/serviço chegou e bate com a nota', just: false },
    { tp: '210220', rot: 'Desconhecer', desc: 'Desconhecimento da Operacao', ajuda: 'Essa nota tem meu CNPJ mas eu não sei do que se trata', just: false },
    { tp: '210240', rot: 'Não realizada', desc: 'Operacao nao Realizada', ajuda: 'Eu conheço a operação, mas ela NÃO aconteceu — justificativa obrigatória', just: true }
  ];
  function sxvEventoPorTipo(tp) { return SXV_EVENTOS.find(function (e) { return e.tp === tp; }) || null; }
  function sxvValidaJust(tpEvento, just) {
    const j = String(just || '').trim();
    const ev = sxvEventoPorTipo(tpEvento);
    if (!ev) return { ok: false, motivo: 'Tipo de evento desconhecido.' };
    if (ev.just && j.length < 15) return { ok: false, motivo: 'Pra "Não realizada" a justificativa é obrigatória (mínimo 15 letras).' };
    if (j.length > 255) return { ok: false, motivo: 'Justificativa passou de 255 letras — encurta.' };
    return { ok: true, just: j };
  }
  function sxvEventoManifestacao(o) {
    const ev = sxvEventoPorTipo(o.tpEvento);
    let det = '<descEvento>' + ev.desc + '</descEvento>';
    if (ev.tp === '210240') det += '<cOrgaoAutor>' + (o.cOrgaoAutor || '31') + '</cOrgaoAutor><tpAutor>1</tpAutor><verAplic>' + (o.verAplic || 'DIGICOPY 6.0.10') + '</verAplic><xJust>' + sxvEsc(String(o.xJust || '').trim()) + '</xJust>';
    return '<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00"><idLote>' + (o.idLote || '1') + '</idLote>' +
      '<evento versao="1.00"><infEvento Id="ID' + ev.tp + o.chave + '01">' +
      '<cOrgao>91</cOrgao><tpAmb>' + o.tpAmb + '</tpAmb><CNPJ>' + o.cnpj + '</CNPJ>' +
      '<chNFe>' + o.chave + '</chNFe><dhEvento>' + o.dhEvento + '</dhEvento>' +
      '<tpEvento>' + ev.tp + '</tpEvento><nSeqEvento>1</nSeqEvento><verEvento>1.00</verEvento>' +
      '<detEvento versao="1.00">' + det + '</detEvento></infEvento></evento></envEvento>';
  }
  function sxvUrlManifestacao(ambiente) {
    return ambiente === 'producao'
      ? { url: 'https://www.nfe.fazenda.gov.br/RecepcaoEvento4/RecepcaoEvento4.asmx', soapAction: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento' }
      : { url: 'https://hom.nfe.fazenda.gov.br/RecepcaoEvento4/RecepcaoEvento4.asmx', soapAction: 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento' };
  }
  function sxvValidaPerfil(p) {
    p = p || {};
    if (['1', '2', '3'].indexOf(String(p.crt || '')) < 0) return { ok: false, motivo: 'Escolhe o regime (Simples Nacional, SN excedente ou Normal).' };
    if (p.cnae && !/^\d{7}$/.test(sxvDigitos(p.cnae))) return { ok: false, motivo: 'CNAE tem que ter 7 números (ou deixe em branco).' };
    const cfopOk = function (v) { return /^\d{4}$/.test(String(v || '')); };
    if (!cfopOk(p.cfopDentro)) return { ok: false, motivo: 'CFOP de venda dentro do estado inválido (4 números).' };
    if (!cfopOk(p.cfopFora)) return { ok: false, motivo: 'CFOP de venda fora do estado inválido (4 números).' };
    if (String(p.cfopDentro)[0] !== '5') return { ok: false, motivo: 'CFOP dentro do estado começa com 5 (ex.: 5.102).' };
    if (String(p.cfopFora)[0] !== '6') return { ok: false, motivo: 'CFOP fora do estado começa com 6 (ex.: 6.102).' };
    if (!/^\d{3}$/.test(String(p.csosn || ''))) return { ok: false, motivo: 'CSOSN padrão tem 3 números (ex.: 102).' };
    if (!/^\d{2}$/.test(String(p.cstIcms || ''))) return { ok: false, motivo: 'CST de ICMS tem 2 números (ex.: 00).' };
    const aliqs = [['pIcmsInterna', 'ICMS interno'], ['pIcmsInterestadual', 'ICMS interestadual'], ['pIpi', 'IPI'], ['pPis', 'PIS'], ['pCofins', 'COFINS'], ['pIss', 'ISS'], ['pIbsUf', 'IBS UF'], ['pIbsMun', 'IBS município'], ['pCbs', 'CBS']];
    for (let i = 0; i < aliqs.length; i++) {
      const n = Number(p[aliqs[i][0]]);
      if (isNaN(n) || n < 0 || n > 100) return { ok: false, motivo: 'Alíquota de ' + aliqs[i][1] + ' tem que ficar entre 0 e 100.' };
    }
    return { ok: true };
  }
  function sxvValidaNcm(cod, desc) {
    if (!/^\d{8}$/.test(sxvDigitos(cod))) return { ok: false, motivo: 'NCM tem 8 números (ex.: 84439923).' };
    if (String(desc || '').trim().length < 3) return { ok: false, motivo: 'Escreve a descrição do NCM (mínimo 3 letras).' };
    return { ok: true };
  }
  function sxvMenuVelho() {
    return [
      { view: 'central-nf', rot: 'Nota Fiscal' },
      { view: 'fiscal-perfil', rot: 'Perfil Tributário' },
      { view: 'fiscal-manifestacao', rot: 'Manifestação' },
      { view: 'fiscal-ncm', rot: 'NCM' },
      { view: 'fiscal-enviar-xml', rot: 'Enviar XML' },
      { view: 'config-fiscal', rot: 'Configurações' }
    ];
  }
  function sxvAutorizacaoValida(usuarios, empresaId, login, senha) {
    const l = String(login || '').trim().toLowerCase();
    const s = String(senha || '');
    if (!l) return { ok: false, motivo: 'Informe o login de quem autoriza.' };
    if (!s) return { ok: false, motivo: 'Informe a senha de quem autoriza.' };
    const u = (usuarios || []).find(function (x) {
      return x && String(x.login || '').trim().toLowerCase() === l && (!empresaId || !x.empresaId || x.empresaId === empresaId);
    });
    if (!u) return { ok: false, motivo: 'Login não encontrado nesta empresa.' };
    if (String(u.senha || '') !== s) return { ok: false, motivo: 'Senha não confere pra ' + (u.nome || u.login) + '.' };
    const limpo = (u.perfil === 'Admin' || u.perfil === 'Dono');
    if (!limpo && u.podeEmitirNfe !== true) return { ok: false, motivo: (u.nome || u.login) + ' também NÃO tem permissão de emitir NF.' };
    return { ok: true, quem: { id: u.id, login: u.login, nome: u.nome || u.login, perfil: u.perfil } };
  }
  // SXV_PURE_END

  // ── Registro/auditoria no mesmo diário fiscal ─────────────────────────────
  function sxvDb() { if (typeof db === 'undefined') return null; db.config = db.config || {}; return db; }
  function sxvLog(acao, origem, detalhe) {
    try {
      const d = sxvDb(); if (!d) return;
      const s = (typeof getSession === 'function' ? getSession() : null) || {};
      d.logs = d.logs || [];
      d.logs.push({ tipo: 'nf-portao', acao: 'sxv:' + acao, origem: origem, detalhe: detalhe || '', usuarioId: s.usuarioId || null, usuarioLogin: s.login || s.usuarioLogin || null, at: new Date().toISOString() });
      if (d.logs.length > 400) d.logs.splice(0, d.logs.length - 400);
      if (typeof d.save === 'function') d.save();
    } catch (e) { }
  }
  function sxvToast(msg, tipo) { try { if (typeof toast === 'function') toast(msg, tipo || 'info'); } catch (e) { } }
  function sxvSalvar() { try { if (typeof db !== 'undefined' && db.save) db.save(); } catch (e) { } }
  var sxvCard = 'rounded-[16px] bg-white border shadow-sm p-5';
  var sxvBtn = 'h-10 px-4 rounded-xl bg-[#0a1e8a] text-white text-[12.5px] font-semibold';
  var sxvBtnSm = 'h-8 px-2.5 rounded-lg border text-[11.5px] font-semibold bg-white hover:bg-slate-50';
  var sxvLab = 'text-[11px] uppercase font-bold text-slate-500';
  var sxvInp = 'mt-1 w-full h-10 px-3 rounded-xl border text-[13px]';

  // ── A) Menu: só os 6 do print ─────────────────────────────────────────────
  var SXV_ESCONDIDOS = ['fiscal-historico', 'fiscal-ferramentas', 'fiscal-inutilizar'];
  function sxvEsconderERenomear() {
    SXV_ESCONDIDOS.forEach(function (v) {
      const nb = document.querySelector('[data-nav="' + v + '"]');
      if (nb) nb.style.display = 'none';
      const tm = document.getElementById('topmod-' + v);
      if (tm) tm.style.display = 'none';
    });
    const cfgNav = document.querySelector('[data-nav="config-fiscal"] span');
    if (cfgNav && cfgNav.textContent !== 'Configurações') cfgNav.textContent = 'Configurações';
    const cfgTb = document.querySelector('#topmod-config-fiscal button');
    if (cfgTb && cfgTb.textContent !== 'Configurações') cfgTb.innerHTML = '<i class="ph ph-gear"></i>Configurações';
  }
  var SXV_BOTAO_NOVO = [
    { view: 'fiscal-perfil', icon: 'ph-percent', rot: 'Perfil Tributário', header: ['Perfil Tributário', 'Regime, CFOP, códigos de tributo e alíquotas · cobre o que o item não trouxer'] },
    { view: 'fiscal-manifestacao', icon: 'ph-stamp', rot: 'Manifestação', header: ['Manifestação do Destinatário', 'Ciência · Confirmação · Desconhecimento · Não realizada (Ambiente Nacional)'] },
    { view: 'fiscal-ncm', icon: 'ph-barcode', rot: 'NCM', header: ['NCM — Nomenclatura Comum do Mercosul', 'Favoritos e padrões que a nota usa'] },
    { view: 'fiscal-enviar-xml', icon: 'ph-file-zip', rot: 'Enviar XML', header: ['Enviar XML', 'Pacote do mês em .zip pra contabilidade'] }
  ];
  function sxvInstalarMenus() {
    const nav = document.getElementById('nav-gest');
    if (nav) {
      let ref = nav.querySelector('[data-nav="central-nf"]');
      SXV_BOTAO_NOVO.forEach(function (m) {
        if (nav.querySelector('[data-nav="' + m.view + '"]')) { ref = nav.querySelector('[data-nav="' + m.view + '"]'); return; }
        const btn = document.createElement('button');
        btn.setAttribute('data-nav', m.view); if (btn.dataset) btn.dataset.nav = m.view;
        btn.className = 'w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white';
        btn.innerHTML = '<i class="ph ' + m.icon + ' text-[19px]"></i><span>' + m.rot + '</span>';
        btn.onclick = function () { window.navigateTo(m.view); };
        if (ref && ref.nextSibling) nav.insertBefore(btn, ref.nextSibling); else nav.appendChild(btn);
        ref = btn;
      });
    }
    const toolbar = document.querySelector('.classic-toolbar-scroll');
    if (toolbar) {
      let refTb = document.getElementById('topmod-central-nf');
      SXV_BOTAO_NOVO.forEach(function (m) {
        if (document.getElementById('topmod-' + m.view)) { refTb = document.getElementById('topmod-' + m.view); return; }
        const mod = document.createElement('div'); mod.className = 'module'; mod.id = 'topmod-' + m.view;
        mod.innerHTML = '<button onclick="navigateTo(\'' + m.view + '\')"><i class="ph ' + m.icon + '"></i>' + m.rot + '</button>';
        if (refTb && refTb.nextSibling) toolbar.insertBefore(mod, refTb.nextSibling); else toolbar.appendChild(mod);
        refTb = mod;
      });
    }
  }

  // ── B.1 Perfil Tributário ─────────────────────────────────────────────────
  function sxvPerfilLer() {
    const d = sxvDb() || { config: {} };
    return Object.assign({
      crt: '1', cfopDentro: '5102', cfopFora: '6102', csosn: '102', cstIcms: '00', codTributo: '',
      cstPis: '01', cstCofins: '01', cstIpi: '50', pIcmsInterna: 0, pIcmsInterestadual: 0, pIpi: 0,
      pPis: 0, pCofins: 0, pIss: 0, cstIbsCbs: '000', cclassTrib: '000001', pIbsUf: 0.1, pIbsMun: 0, pCbs: 0.9
    }, (d.config && d.config.perfilTributario) || {});
  }
  function sxvRenderPerfil() {
    const v = typeof ensureView === 'function' ? ensureView('fiscal-perfil') : null; if (!v) return;
    const p = sxvPerfilLer();
    const d = sxvDb() || { config: {} };
    const f = (d.config && d.config.fiscal) || {};
    const reg = '<div class="' + sxvCard + '"><h4 class="font-bold text-[14px]">🏛️ Regime e identificação</h4>' +
      '<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">' +
      '<div><label class="' + sxvLab + '">Regime tributário (CRT)</label><select id="sxv-pf-crt" class="' + sxvInp + '">' +
      '<option value="1"' + (String(p.crt) === '1' ? ' selected' : '') + '>1 — Simples Nacional</option>' +
      '<option value="2"' + (String(p.crt) === '2' ? ' selected' : '') + '>2 — Simples Nacional (excedeu o limite)</option>' +
      '<option value="3"' + (String(p.crt) === '3' ? ' selected' : '') + '>3 — Regime Normal</option></select></div>' +
      '<div><label class="' + sxvLab + '">CNAE fiscal (7 números)</label><input id="sxv-pf-cnae" class="' + sxvInp + '" value="' + sxvEsc(f.cnae || '') + '" placeholder="ex.: 4744099"></div>' +
      '<div><label class="' + sxvLab + '">Código do tributo (TP_CODIGO do antigo)</label><input id="sxv-pf-codtrib" class="' + sxvInp + '" value="' + sxvEsc(p.codTributo) + '" placeholder="opcional"></div></div>' +
      '<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">' +
      '<div><label class="' + sxvLab + '">Inscrição Estadual</label><input id="sxv-pf-ie" class="' + sxvInp + '" value="' + sxvEsc(f.ie || '') + '"></div>' +
      '<div><label class="' + sxvLab + '">Inscrição Municipal</label><input id="sxv-pf-im" class="' + sxvInp + '" value="' + sxvEsc(f.im || '') + '"></div></div>' +
      '<p class="text-[11px] text-slate-400 mt-2">IE/IM/CNAE gravam nas MESMAS chaves que a Config. Fiscal lê — o que você muda aqui já vale pra emissão.</p></div>';
    const trib = '<div class="' + sxvCard + '"><h4 class="font-bold text-[14px]">🧾 CFOPs e códigos de tributo</h4>' +
      '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">' +
      '<div><label class="' + sxvLab + '">CFOP dentro do estado</label><input id="sxv-pf-cfop-d" class="' + sxvInp + '" value="' + sxvEsc(p.cfopDentro) + '"></div>' +
      '<div><label class="' + sxvLab + '">CFOP fora do estado</label><input id="sxv-pf-cfop-f" class="' + sxvInp + '" value="' + sxvEsc(p.cfopFora) + '"></div>' +
      '<div><label class="' + sxvLab + '">CSOSN padrão (Simples)</label><input id="sxv-pf-csosn" class="' + sxvInp + '" value="' + sxvEsc(p.csosn) + '"></div>' +
      '<div><label class="' + sxvLab + '">CST ICMS (regime normal)</label><input id="sxv-pf-cst" class="' + sxvInp + '" value="' + sxvEsc(p.cstIcms) + '"></div>' +
      '<div><label class="' + sxvLab + '">CST PIS</label><input id="sxv-pf-cstpis" class="' + sxvInp + '" value="' + sxvEsc(p.cstPis) + '"></div>' +
      '<div><label class="' + sxvLab + '">CST COFINS</label><input id="sxv-pf-cstcof" class="' + sxvInp + '" value="' + sxvEsc(p.cstCofins) + '"></div>' +
      '<div><label class="' + sxvLab + '">CST IPI</label><input id="sxv-pf-cstipi" class="' + sxvInp + '" value="' + sxvEsc(p.cstIpi) + '"></div>' +
      '<div><label class="' + sxvLab + '">CST IBS/CBS (reforma)</label><input id="sxv-pf-cstibscbs" class="' + sxvInp + '" value="' + sxvEsc(p.cstIbsCbs) + '"></div></div></div>';
    const alq = '<div class="' + sxvCard + '"><h4 class="font-bold text-[14px]">📐 Alíquotas padrão (%)</h4>' +
      '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">' +
      ['pIcmsInterna|ICMS interno', 'pIcmsInterestadual|ICMS interestadual', 'pIpi|IPI', 'pPis|PIS', 'pCofins|COFINS', 'pIss|ISS', 'pIbsUf|IBS estado', 'pIbsMun|IBS município', 'pCbs|CBS', 'cclassTrib|cClassTrib (reforma)'].map(function (x) {
        const kv = x.split('|');
        return '<div><label class="' + sxvLab + '">' + kv[1] + '</label><input id="sxv-pf-' + kv[0].toLowerCase() + '" class="' + sxvInp + '" value="' + sxvEsc(p[kv[0]]) + '"></div>';
      }).join('') + '</div></div>';
    v.innerHTML = '<div class="flex items-start justify-between gap-3 flex-wrap">' + sxvAmbPlaca() +
      '<button id="sxv-pf-salvar" class="' + sxvBtn + '">Salvar perfil tributário</button></div>' +
      '<div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-2">' + reg + trib + alq + '</div>' +
      '<p class="text-[11.5px] text-slate-500 bg-slate-50 border rounded-xl p-3">💡 Como a nota usa isso: quando o produto/item já tem imposto próprio, ele vence; o que faltar o perfil cobre. Hoje a nota sai como <b>Simples Nacional (CRT 1)</b> — os demais regimes entram quando a contabilidade confirmar os números.</p>';
    v.querySelector('#sxv-pf-salvar').onclick = function () {
      const g = function (id) { const el = v.querySelector(id); return el ? el.value.trim() : ''; };
      const num = function (x) { const n = parseFloat(String(x).replace(',', '.')); return isNaN(n) ? 0 : n; };
      const novo = {
        crt: g('#sxv-pf-crt'), cfopDentro: sxvDigitos(g('#sxv-pf-cfop-d')), cfopFora: sxvDigitos(g('#sxv-pf-cfop-f')),
        csosn: sxvDigitos(g('#sxv-pf-csosn')), cstIcms: sxvDigitos(g('#sxv-pf-cst')), codTributo: g('#sxv-pf-codtrib'),
        cstPis: sxvDigitos(g('#sxv-pf-cstpis')), cstCofins: sxvDigitos(g('#sxv-pf-cstcof')), cstIpi: sxvDigitos(g('#sxv-pf-cstipi')),
        cstIbsCbs: sxvDigitos(g('#sxv-pf-cstibscbs')), cclassTrib: sxvDigitos(g('#sxv-pf-cclasstrib')),
        pIcmsInterna: num(g('#sxv-pf-picmsinterna')), pIcmsInterestadual: num(g('#sxv-pf-picmsinterestadual')), pIpi: num(g('#sxv-pf-pipi')),
        pPis: num(g('#sxv-pf-ppis')), pCofins: num(g('#sxv-pf-pcofins')), pIss: num(g('#sxv-pf-piss')),
        pIbsUf: num(g('#sxv-pf-pibsuf')), pIbsMun: num(g('#sxv-pf-pibsmun')), pCbs: num(g('#sxv-pf-pcbs'))
      };
      const r = sxvValidaPerfil(novo);
      if (!r.ok) { sxvToast(r.motivo, 'error'); return; }
      novo.at = new Date().toISOString();
      const dd = sxvDb(); if (!dd) return;
      dd.config.perfilTributario = novo;
      dd.config.fiscal = Object.assign({}, dd.config.fiscal || {}, { cnae: sxvDigitos(g('#sxv-pf-cnae')), ie: g('#sxv-pf-ie'), im: g('#sxv-pf-im') });
      sxvSalvar();
      sxvLog('perfil-salvo', 'fiscal-perfil', 'CRT ' + novo.crt + ' · CFOP ' + novo.cfopDentro + '/' + novo.cfopFora + ' · CSOSN ' + novo.csosn);
      sxvToast('✅ Perfil tributário salvo.', 'success');
    };
  }
  // Cobre imposto faltoso na emissão (o item continua vencendo quando trouxer o dele)
  (function sxvWrapFiscalPadrao() {
    try {
      if (window.NFE_EMISSAO_PURE && typeof window.NFE_EMISSAO_PURE.fiscalPadrao === 'function' && !window.NFE_EMISSAO_PURE.fiscalPadrao.__v60010) {
        const _fp = window.NFE_EMISSAO_PURE.fiscalPadrao;
        const f = function () {
          const base = _fp.apply(this, arguments) || {};
          const pf = (typeof db !== 'undefined' && db.config && db.config.perfilTributario) || null;
          if (pf) {
            const mapa = { csosn: pf.csosn, cstIcms: pf.cstIcms, cstPis: pf.cstPis, cstCofins: pf.cstCofins, cstIpi: pf.cstIpi, cfop: pf.cfopDentro };
            Object.keys(mapa).forEach(function (k) { if (base[k] === undefined || base[k] === null || base[k] === '') base[k] = mapa[k]; });
          }
          return base;
        };
        f.__v60010 = true;
        window.NFE_EMISSAO_PURE.fiscalPadrao = f;
      }
    } catch (e) { }
  })();

  // ── B.2 Manifestação do destinatário ──────────────────────────────────────
  function sxvManifestacoes() { const d = sxvDb() || { config: {} }; d.config.nfManifestacoes = d.config.nfManifestacoes || []; return d.config.nfManifestacoes; }
  function sxvRenderManifestacao() {
    const v = typeof ensureView === 'function' ? ensureView('fiscal-manifestacao') : null; if (!v) return;
    const d = sxvDb() || { config: {} };
    const cnpjCfg = ((d.config.fiscal && d.config.fiscal.cnpj) || '').trim();
    const lista = sxvManifestacoes().slice().sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
    v.innerHTML = sxvAmbPlaca() + '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">' +
      '<div class="' + sxvCard + '"><h4 class="font-bold text-[14px]">📥 Manifestar uma nota recebida</h4>' +
      '<p class="text-[12px] text-slate-500 mt-1">Cola a <b>chave de 44 números</b> da nota que chegou pro seu CNPJ, escolhe o evento e transmite. Vai pro <b>Ambiente Nacional</b> (é lá que destinatário fala, não na SEFAZ-MG). A senha do certificado é digitada na hora e não fica salva.</p>' +
      '<div class="mt-3"><label class="' + sxvLab + '">Chave de acesso (44 números)</label><input id="sxv-mf-chave" class="' + sxvInp + ' font-mono" placeholder="3124 0900 0000 0000 0000 5500 1000 0000 0001 2001 2345"></div>' +
      '<div class="mt-3"><label class="' + sxvLab + '">CNPJ da sua empresa (destinatário)</label><input id="sxv-mf-cnpj" class="' + sxvInp + '" value="' + sxvEsc(cnpjCfg) + '" placeholder="só números"></div>' +
      '<div class="mt-3 space-y-2" id="sxv-mf-ev">' + SXV_EVENTOS.map(function (ev, i) {
        return '<label class="flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer hover:bg-slate-50"><input type="radio" name="sxv-ev" value="' + ev.tp + '"' + (i === 1 ? ' checked' : '') + ' class="mt-0.5">' +
          '<span><b class="text-[13px]">' + ev.rot + '</b> <span class="text-[11px] text-slate-400">(' + ev.tp + ')</span><br><span class="text-[11.5px] text-slate-500">' + ev.ajuda + '</span></span></label>';
      }).join('') + '</div>' +
      '<div id="sxv-mf-just-box" class="mt-3" style="display:none"><label class="' + sxvLab + '">Justificativa (obrigatória pra "Não realizada", mínimo 15 letras)</label><textarea id="sxv-mf-just" rows="2" class="mt-1 w-full px-3 py-2 rounded-xl border text-[13px]"></textarea></div>' +
      '<div class="mt-4"><button id="sxv-mf-enviar" class="' + sxvBtn + '">Manifestar na SEFAZ (Ambiente Nacional)</button></div></div>' +
      '<div class="' + sxvCard + '"><h4 class="font-bold text-[14px]">🗂 Manifestações desta empresa</h4>' +
      '<p class="text-[12px] text-slate-500 mt-1">Protocolos registrados aqui ficam prova. O pacote do mês (menu Enviar XML) leva suas próprias notas; manifestação de terceiros confere pelo portal.</p>' +
      '<div id="sxv-mf-lista" class="mt-3 max-h-[420px] overflow-auto space-y-2">' +
      (lista.length ? lista.map(function (m) {
        const ev = sxvEventoPorTipo(m.tp) || { rot: m.tp };
        const cor = /registrad/i.test(m.xMotivo || '') || m.cStat === '135' || m.cStat === '136' ? '#16a34a' : '#dc2626';
        return '<div class="rounded-xl border p-3 text-[12px]"><div class="flex justify-between gap-2"><b>' + ev.rot + '</b><span style="color:' + cor + ';font-weight:700">' + sxvEsc(String(m.cStat || '')) + ' ' + sxvEsc(m.xMotivo || m.status || '') + '</span></div>' +
          '<div class="font-mono text-[11px] text-slate-500 mt-1">' + sxvEsc(sxvMascaraChave(m.chave || '')) + '</div>' +
          '<div class="text-[11px] text-slate-400 mt-0.5">' + (m.protocolo ? ('Protocolo ' + sxvEsc(m.protocolo) + ' · ') : '') + sxvEsc(String(m.at || '').slice(0, 16).replace('T', ' ')) + '</div></div>';
      }).join('') : '<div class="empty-state">Nenhuma manifestação ainda</div>') + '</div></div></div>';
    const justBox = v.querySelector('#sxv-mf-just-box');
    v.querySelectorAll('input[name="sxv-ev"]').forEach(function (r) {
      r.onchange = function () { justBox.style.display = r.value === '210240' && r.checked ? '' : 'none'; };
    });
    v.querySelector('#sxv-mf-enviar').onclick = function () {
      const chaveIn = v.querySelector('#sxv-mf-chave').value;
      const cnpj = sxvDigitos(v.querySelector('#sxv-mf-cnpj').value);
      const tp = (v.querySelector('input[name="sxv-ev"]:checked') || {}).value || '210210';
      const just = v.querySelector('#sxv-mf-just').value;
      const lancar = async function () {
        if (cnpj.length !== 14) { sxvToast('CNPJ da sua empresa tem que ter 14 números.', 'error'); return; }
        const dd = sxvDb(); if (dd) { dd.config.fiscal = Object.assign({}, dd.config.fiscal || {}, { cnpj: cnpj }); sxvSalvar(); }
        await window.nfManifestarEvento(chaveIn, tp, just, cnpj);
        sxvRenderManifestacao();
      };
      const pode = (window.__p609AutorizadoAte > Date.now()) || (typeof window.usuarioPodeEmitirNfe === 'function' && window.usuarioPodeEmitirNfe());
      if (pode) { lancar(); return; }
      sxvPopupAutorizacao('manifestar uma nota recebida', function (quem) {
        window.__p609AutorizadoAte = Date.now() + 3000;
        sxvLog('override-autorizado', 'fiscal-manifestacao', 'Manifestação autorizada por ' + quem.nome + ' (' + quem.login + ')');
        lancar();
      });
    };
  }
  window.nfManifestarEvento = async function (chaveIn, tpEvento, justIn, cnpjIn) {
    try {
      const vc = sxvValidaChave(chaveIn); if (!vc.ok) { sxvToast(vc.motivo, 'error'); return { ok: false, error: 'chave' }; }
      const vj = sxvValidaJust(tpEvento, justIn); if (!vj.ok) { sxvToast(vj.motivo, 'error'); return { ok: false, error: 'just' }; }
      const ponte = (window.nfeCertAPI && window.nfeCertAPI.isElectron) ? window.nfeCertAPI : null;
      if (!ponte) { sxvToast('A transmissão roda pelo aplicativo de desktop (.exe) com certificado — pelo navegador não assina.', 'error'); return { ok: false, error: 'sem-ponte' }; }
      const senha = (typeof window.nfxPedirTexto === 'function') ? await window.nfxPedirTexto('Senha do certificado A1', 'Usada AGORA pra assinar a manifestação e NÃO fica salva.', { mascara: true }) : null;
      if (!senha) return { ok: false, error: 'sem-senha' };
      if (!window.NFX_PURE) { sxvToast('Motor fiscal (NFX_PURE) não carregou.', 'error'); return { ok: false, error: 'sem-motor' }; }
      const amb = (window.NFG_PURE && window.NFG_PURE.nfgAmbiente(db)) || 'homologacao';
      const dd = sxvDb(); const cnpj = sxvDigitos(cnpjIn || (dd && dd.config.fiscal && dd.config.fiscal.cnpj) || '');
      const evt = sxvEventoManifestacao({ chave: vc.chave, cnpj: cnpj, tpEvento: tpEvento, tpAmb: amb === 'producao' ? '1' : '2', dhEvento: new Date().toISOString(), xJust: vj.just, cOrgaoAutor: '31', verAplic: 'DIGICOPY 6.0.10' });
      sxvLog('manifestar-inicio', 'fiscal-manifestacao', tpEvento + ' chave ' + vc.chave.slice(0, 12) + '…');
      const ass = await ponte.assinar(evt, senha, null);
      if (!ass || !ass.ok) { sxvToast('Falha ao assinar a manifestação: ' + ((ass && ass.error) || '?'), 'error'); return { ok: false, error: 'assinar' }; }
      const ws = sxvUrlManifestacao(amb);
      const envelope = window.NFX_PURE.nfxEnvelope(ass.xmlAssinado).replace('PLACEHOLDER', 'NFeRecepcaoEvento4');
      const trx = await ponte.transmitir({ url: ws.url, envelope: envelope, soapAction: ws.soapAction, senhaCert: senha });
      if (!trx || !trx.ok) { sxvToast('Transmissão falhou: ' + ((trx && trx.error) || '?'), 'error'); return { ok: false, error: 'transmitir' }; }
      const ret = window.NFX_PURE.nfxParseRetorno(trx.xml);
      const okEvento = ret.classe === 'evento-registrado' || ret.cStat === '135' || ret.cStat === '136';
      sxvManifestacoes().push({ tp: tpEvento, chave: vc.chave, cnpj: cnpj, cStat: ret.cStat, xMotivo: ret.xMotivo, protocolo: ret.nProt || ret.nProtEvento || '', status: okEvento ? 'registrada' : 'rejeitada', at: new Date().toISOString() });
      if (sxvManifestacoes().length > 200) sxvManifestacoes().splice(0, sxvManifestacoes().length - 200);
      sxvSalvar();
      sxvLog('manifestar-resposta', 'fiscal-manifestacao', ret.cStat + ' ' + ret.xMotivo);
      sxvToast((okEvento ? '✅ Manifestação registrada: ' : 'SEFAZ respondeu: ') + ret.cStat + ' — ' + ret.xMotivo, okEvento ? 'success' : 'error');
      return { ok: okEvento, retorno: ret };
    } catch (e) { sxvLog('manifestar-excecao', 'fiscal-manifestacao', e.message || String(e)); sxvToast('Erro: ' + (e.message || e), 'error'); return { ok: false }; }
  };

  // Popup de autorização (mesmo visual/comportamento da v6.0.9; escopo: manifestação)
  function sxvPopupAutorizacao(acaoRotulo, onOk) {
    const s = (typeof getSession === 'function' ? getSession() : null) || {};
    const usuarios = (typeof db !== 'undefined' && db.usuarios) || [];
    const empresaId = s.empresaId || (s.empresa && s.empresa.id) || '';
    const pedinte = (s.usuarioNome || s.login || s.usuarioLogin || '?');
    const old = document.getElementById('sxv-popup-aut'); if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'sxv-popup-aut';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147483200;background:rgba(2,6,23,.55);display:flex;align-items:center;justify-content:center;padding:16px';
    ov.innerHTML = '<div class="bg-white rounded-[18px] shadow-2xl p-6 w-full max-w-[420px]" role="dialog" aria-modal="true">' +
      '<div class="font-bold text-[15px]">🔐 Autorização necessária</div>' +
      '<p class="text-[12.5px] text-slate-500 mt-1">Pra <b>' + sxvEsc(acaoRotulo) + '</b> é preciso permissão. Peça a um usuário que TENHA pra digitar o login e a senha aqui embaixo (pedido por <b>' + sxvEsc(pedinte) + '</b>).</p>' +
      '<div class="mt-4"><label class="' + sxvLab + '">Login de quem autoriza</label><input id="sxv-aut-login" class="' + sxvInp + '" autocomplete="off"></div>' +
      '<div class="mt-3"><label class="' + sxvLab + '">Senha</label><input id="sxv-aut-senha" type="password" class="' + sxvInp + '"></div>' +
      '<p id="sxv-aut-erro" class="text-[12px] text-red-600 mt-2" style="display:none"></p>' +
      '<div class="flex gap-2 mt-4"><button id="sxv-aut-ok" class="' + sxvBtn + ' flex-1">Autorizar e realizar</button><button id="sxv-aut-cancelar" class="h-10 px-4 rounded-xl border text-[12.5px] font-semibold">Cancelar</button></div></div>';
    document.body.appendChild(ov);
    const erro = ov.querySelector('#sxv-aut-erro');
    const fechar = function (motivo) { if (motivo) sxvLog('override-cancelado', 'fiscal-manifestacao', motivo + ' (pedinte: ' + pedinte + ')'); ov.remove(); };
    const confirmar = function () {
      const r = sxvAutorizacaoValida(usuarios, empresaId, ov.querySelector('#sxv-aut-login').value, ov.querySelector('#sxv-aut-senha').value);
      if (!r.ok) { erro.textContent = r.motivo; erro.style.display = ''; return; }
      ov.remove();
      onOk(r.quem);
    };
    ov.querySelector('#sxv-aut-ok').onclick = confirmar;
    ov.querySelector('#sxv-aut-cancelar').onclick = function () { fechar('desistiu no popup'); };
    ov.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); confirmar(); } if (ev.key === 'Escape') { fechar('desistiu no popup'); } });
    setTimeout(function () { try { ov.querySelector('#sxv-aut-login').focus(); } catch (e) { } }, 40);
  }

  // ── B.3 NCM ───────────────────────────────────────────────────────────────
  function sxvNcmFavs() { const d = sxvDb() || { config: {} }; d.config.ncmFavoritos = d.config.ncmFavoritos || []; return d.config.ncmFavoritos; }
  function sxvRenderNcm() {
    const v = typeof ensureView === 'function' ? ensureView('fiscal-ncm') : null; if (!v) return;
    const d = sxvDb() || { config: {} };
    const favs = sxvNcmFavs();
    const linha = function (n, i) {
      return '<div class="flex items-center gap-2 rounded-xl border p-2.5 text-[12.5px]"><span class="font-mono font-bold">' + sxvEsc(n.cod) + '</span><span class="flex-1 truncate">' + sxvEsc(n.desc) + '</span>' +
        '<button class="' + sxvBtnSm + '" data-sxv-ncm="categoria" data-i="' + i + '" title="Usar como NCM padrão dos produtos">→ padrão</button>' +
        '<button class="' + sxvBtnSm + '" data-sxv-ncm="tinta" data-i="' + i + '" title="Usar como NCM de recarga/tinta">→ tinta</button>' +
        '<button class="' + sxvBtnSm + '" data-sxv-ncm="locacao" data-i="' + i + '" title="Usar como NCM de locação">→ locação</button>' +
        '<button class="h-8 w-8 grid place-items-center rounded-lg hover:bg-red-50 text-red-600" data-sxv-ncm="excluir" data-i="' + i + '" title="Tirar dos favoritos"><i class="ph ph-trash"></i></button></div>';
    };
    v.innerHTML = sxvAmbPlaca() + '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">' +
      '<div class="' + sxvCard + '"><h4 class="font-bold text-[14px]">🏷️ NCMs favoritos</h4>' +
      '<p class="text-[12px] text-slate-500 mt-1">Os códigos que sua empresa usa. Os produtos podem ter NCM próprio (o produto vence); estes aqui são o <b>plano B por tipo</b> e o padrão geral.</p>' +
      '<div class="grid grid-cols-[150px_1fr_auto] gap-2 mt-3 items-end">' +
      '<div><label class="' + sxvLab + '">Código (8 números)</label><input id="sxv-ncm-cod" class="' + sxvInp + '" placeholder="84439923" maxlength="8"></div>' +
      '<div><label class="' + sxvLab + '">Descrição</label><input id="sxv-ncm-desc" class="' + sxvInp + '" placeholder="ex.: Peças e acessórios p/ impressora"></div>' +
      '<button id="sxv-ncm-add" class="' + sxvBtn + '">Adicionar</button></div>' +
      '<div id="sxv-ncm-lista" class="mt-3 space-y-2">' + (favs.length ? favs.map(linha).join('') : '<div class="empty-state">Nenhum favorito ainda</div>') + '</div></div>' +
      '<div class="' + sxvCard + '"><h4 class="font-bold text-[14px]">🎯 Padrões que a nota usa</h4>' +
      '<div class="grid grid-cols-1 gap-3 mt-3 text-[13px]">' +
      '<div class="rounded-xl border p-3 flex items-center justify-between gap-2"><span><b>NCM padrão</b> (produto sem NCM)</span><code class="font-mono" id="sxv-ncm-padrao">' + sxvEsc(d.config.nfNcmPadrao || '—') + '</code></div>' +
      '<div class="rounded-xl border p-3 flex items-center justify-between gap-2"><span><b>Recarga/tinta</b></span><code class="font-mono" id="sxv-ncm-tinta">' + sxvEsc(d.config.nfNcmTinta || '—') + '</code></div>' +
      '<div class="rounded-xl border p-3 flex items-center justify-between gap-2"><span><b>Locação de máquinas</b></span><code class="font-mono" id="sxv-ncm-locacao">' + sxvEsc(d.config.nfNcmLocacao || '—') + '</code></div></div>' +
      '<p class="text-[11.5px] text-slate-500 bg-slate-50 border rounded-xl p-3 mt-3">Os 3 padrões acima são as MESMAS chaves da <b>Config. Fiscal</b> (uma verdade só). Nos produtos, a lupa de NCM continua valendo no cadastro. A tabela completa do sistema antigo (4.439 linhas) entra quando você mandar o arquivo — hoje já dá pra pesquisar pelo IBPT no cadastro do produto.</p></div></div>';
    v.querySelector('#sxv-ncm-add').onclick = function () {
      const cod = sxvDigitos(v.querySelector('#sxv-ncm-cod').value);
      const desc = v.querySelector('#sxv-ncm-desc').value;
      const r = sxvValidaNcm(cod, desc);
      if (!r.ok) { sxvToast(r.motivo, 'error'); return; }
      sxvNcmFavs().push({ cod: cod, desc: desc.trim(), criadoEm: new Date().toISOString() });
      sxvSalvar(); sxvLog('ncm-favorito', 'fiscal-ncm', cod + ' ' + desc.trim().slice(0, 40));
      sxvRenderNcm(); sxvToast('Favorito salvo.', 'success');
    };
    v.querySelectorAll('[data-sxv-ncm]').forEach(function (bt) {
      bt.onclick = function () {
        const acao = bt.getAttribute('data-sxv-ncm');
        const i = parseInt(bt.getAttribute('data-i'), 10) || 0;
        const n = sxvNcmFavs()[i];
        if (!n) return;
        const dd = sxvDb(); if (!dd) return;
        if (acao === 'excluir') { sxvNcmFavs().splice(i, 1); sxvLog('ncm-favorito-removido', 'fiscal-ncm', n.cod); }
        if (acao === 'categoria') { dd.config.nfNcmPadrao = n.cod; sxvLog('ncm-padrao', 'fiscal-ncm', n.cod); }
        if (acao === 'tinta') { dd.config.nfNcmTinta = n.cod; sxvLog('ncm-tinta', 'fiscal-ncm', n.cod); }
        if (acao === 'locacao') { dd.config.nfNcmLocacao = n.cod; sxvLog('ncm-locacao', 'fiscal-ncm', n.cod); }
        sxvSalvar(); sxvRenderNcm();
        sxvToast(acao === 'excluir' ? 'Favorito removido.' : 'NCM ' + n.cod + ' agora é o padrão de ' + (acao === 'categoria' ? 'produtos' : acao) + ' ✅', 'success');
      };
    });
  }

  // ── B.4 Enviar XML ────────────────────────────────────────────────────────
  function sxvNotasDoMes() {
    try {
      const d = sxvDb() || { config: {} };
      const alvo = new Date().toISOString().slice(0, 7);
      const reg = (d.config.nfRegistro || []);
      return reg.filter(function (n) { return String(n.dataAutorizacao || n.atualizadoEm || n.criadoEm || '').slice(0, 7) === alvo; });
    } catch (e) { return []; }
  }
  function sxvRenderXml() {
    const v = typeof ensureView === 'function' ? ensureView('fiscal-enviar-xml') : null; if (!v) return;
    const d = sxvDb() || { config: {} };
    const email = d.config.emailContador || '';
    const notas = sxvNotasDoMes();
    v.innerHTML = sxvAmbPlaca() + '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">' +
      '<div class="' + sxvCard + '"><h4 class="font-bold text-[14px]">🗂 Pacote de XMLs do mês</h4>' +
      '<p class="text-[12px] text-slate-500 mt-1">Gera o <b>.zip</b> com os XMLs das notas do mês que você escolher + eventos (cancelamento, CC-e) + índice. Este mês tem <b>' + notas.length + '</b> nota(s) registrada(s). O mês é perguntado na hora (MM/AAAA).</p>' +
      '<div class="mt-3"><button id="sxv-xml-pacote" class="' + sxvBtn + '">Gerar pacote (.zip)</button></div>' +
      '<div class="mt-4"><button id="sxv-xml-status" class="' + sxvBtnSm + '">📡 Testar SEFAZ agora</button> <span class="text-[11px] text-slate-400">o mesmo diagnóstico da Configurações</span></div></div>' +
      '<div class="' + sxvCard + '"><h4 class="font-bold text-[14px]">✉️ E-mail do contador</h4>' +
      '<p class="text-[12px] text-slate-500 mt-1">Salvo aqui pra você copiar na hora de mandar o pacote. <b>Sendo honesto:</b> o sistema baixa o zip no PC; o envio é você anexando no e-mail ou no Zap da contabilidade (envio automático de e-mail ainda não existe no sistema).</p>' +
      '<div class="mt-3 flex gap-2"><input id="sxv-xml-email" type="email" class="flex-1 h-10 px-3 rounded-xl border text-[13px]" value="' + sxvEsc(email) + '" placeholder="contador@escritorio.com.br"><button id="sxv-xml-email-salvar" class="' + sxvBtn + '">Salvar</button><button id="sxv-xml-email-copiar" class="' + sxvBtnSm + '">Copiar</button></div>' +
      '<p class="text-[11px] text-slate-400 mt-3">Dica: depois de gerar o pacote, o arquivo aparece na pasta de Downloads com o nome do mês (ex.: pacote-xml-2026-09.zip).</p></div></div>';
    v.querySelector('#sxv-xml-pacote').onclick = function () { try { window.nfPacoteContador(); } catch (e) { } };
    v.querySelector('#sxv-xml-status').onclick = function () { try { window.nfStatusServico(); } catch (e) { } };
    v.querySelector('#sxv-xml-email-salvar').onclick = function () {
      const e = v.querySelector('#sxv-xml-email').value.trim();
      if (e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { sxvToast('Esse e-mail tá estranho — confere?', 'error'); return; }
      const dd = sxvDb(); if (!dd) return;
      dd.config.emailContador = e; sxvSalvar();
      sxvLog('email-contador', 'fiscal-enviar-xml', e || '(limpo)');
      sxvToast('E-mail do contador salvo.', 'success');
    };
    v.querySelector('#sxv-xml-email-copiar').onclick = function () {
      const e = v.querySelector('#sxv-xml-email').value.trim();
      if (!e) { sxvToast('Nada pra copiar — salva o e-mail primeiro.', 'error'); return; }
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(e);
        sxvToast('E-mail copiado ✅', 'success');
      } catch (err) { sxvToast(e, 'info'); }
    };
  }

  // ── Placa de ambiente (mesma verdade da v6.0.9) ───────────────────────────
  function sxvAmbPlaca() {
    let amb = 'homologacao';
    try { amb = (window.NFG_PURE && window.NFG_PURE.nfgAmbiente(db)) || 'homologacao'; } catch (e) { }
    return amb === 'producao'
      ? '<div style="padding:9px 13px;border-radius:12px;font-weight:800;font-size:12.5px;color:#fff;background:#166534">✅ PRODUÇÃO — nota vale de verdade</div>'
      : '<div style="padding:9px 13px;border-radius:12px;font-weight:800;font-size:12.5px;color:#fff;background:#7f1d1d">🏛️ HOMOLOGAÇÃO — modo teste, sem valor fiscal</div>';
  }

  // Atalhos dentro da Central (os 3 atalhos que saíram do menu não se perdem)
  function sxvAtalhosCentral() {
    try {
      const v = document.getElementById('view-central-nf');
      if (!v || v.offsetParent === null || document.getElementById('sxv-atalhos')) return;
      const card = document.createElement('div');
      card.id = 'sxv-atalhos';
      card.className = sxvCard + ' mt-2';
      card.innerHTML = '<div class="flex flex-wrap gap-2 items-center"><span class="text-[12px] font-bold text-slate-500 mr-1">Atalhos:</span>' +
        '<button class="' + sxvBtnSm + '" data-sxv-go="fiscal-historico">📚 Histórico de Notas</button>' +
        '<button class="' + sxvBtnSm + '" data-sxv-go="fiscal-inutilizar">🧹 Inutilizar Faixa</button>' +
        '<button class="' + sxvBtnSm + '" data-sxv-go="fiscal-manifestacao">📥 Manifestação</button>' +
        '<button class="' + sxvBtnSm + '" data-sxv-go="fiscal-enviar-xml">🗂 Enviar XML</button></div>';
      v.insertBefore(card, v.firstChild);
      card.querySelectorAll('[data-sxv-go]').forEach(function (b) { b.onclick = function () { window.navigateTo(b.getAttribute('data-sxv-go')); }; });
    } catch (e) { }
  }
  // Configurações: diagnóstico SEFAZ + lembrete do pacote (vivem nela agora)
  function sxvExtrasConfig() {
    try {
      const v = document.getElementById('view-config-fiscal');
      if (!v || v.offsetParent === null || document.getElementById('sxv-cfg-extra')) return;
      const card = document.createElement('div');
      card.id = 'sxv-cfg-extra';
      card.className = sxvCard + ' mt-3';
      card.innerHTML = '<h4 class="font-bold text-[14px]">📡 Diagnóstico SEFAZ</h4>' +
        '<p class="text-[12px] text-slate-500 mt-1">Prova o certificado + internet antes de emitir: pergunta AGORA se a autorização de notas está no ar (107 = perfeito).</p>' +
        '<div class="mt-3 flex gap-2"><button id="sxv-cfg-status" class="' + sxvBtn + '">Testar SEFAZ agora</button><button class="' + sxvBtnSm + '" data-sxv-go="fiscal-enviar-xml">🗂 Enviar XML (pacote do mês)</button></div>';
      v.appendChild(card);
      card.querySelector('#sxv-cfg-status').onclick = function () { try { window.nfStatusServico(); } catch (e) { } };
      card.querySelector('[data-sxv-go]').onclick = function () { window.navigateTo('fiscal-enviar-xml'); };
    } catch (e) { }
  }

  // ── Navegação + sonda ─────────────────────────────────────────────────────
  var SXV_VIEW_RENDER = {
    'fiscal-perfil': ['Perfil Tributário', 'Regime, CFOP, códigos de tributo e alíquotas · cobre o que o item não trouxer', sxvRenderPerfil],
    'fiscal-manifestacao': ['Manifestação do Destinatário', 'Ciência · Confirmação · Desconhecimento · Não realizada (Ambiente Nacional)', sxvRenderManifestacao],
    'fiscal-ncm': ['NCM — Nomenclatura Comum do Mercosul', 'Favoritos e padrões que a nota usa', sxvRenderNcm],
    'fiscal-enviar-xml': ['Enviar XML', 'Pacote do mês em .zip pra contabilidade', sxvRenderXml]
  };
  if (typeof window.navigateTo === 'function' && !window.navigateTo.__sxv) {
    const _nav = window.navigateTo;
    const embr = function (view) {
      const r = _nav.apply(this, arguments);
      try {
        const m = SXV_VIEW_RENDER[view];
        if (m) { if (typeof setPageHeader === 'function') setPageHeader(m[0], m[1]); m[2](); }
        if (view === 'central-nf') setTimeout(sxvAtalhosCentral, 90);
        if (view === 'config-fiscal') setTimeout(sxvExtrasConfig, 90);
      } catch (e) { }
      return r;
    };
    embr.__sxv = true;
    window.navigateTo = embr;
  }
  sxvEsconderERenomear();
  sxvInstalarMenus();
  (function sxvSonda() {
    let tent = 0;
    const t = setInterval(function () {
      tent++;
      if (!document.hidden) {
        try { sxvEsconderERenomear(); sxvInstalarMenus(); sxvAtalhosCentral(); sxvExtrasConfig(); } catch (e) { }
      }
      if (tent > 300) clearInterval(t);
    }, 2000);
  })();

  console.log('%cSEIS_SUBMENUS_VELHO_PATCH v6.0.10 ativo — menu fiscal igual ao sistema antigo: Nota Fiscal · Perfil Tributário · Manifestação · NCM · Enviar XML · Configurações.', 'color:#7c3aed;font-weight:bold');
})();

// PURE export (testes + reuso)
if (typeof module !== 'undefined' && module.exports) {
  const _p = (function () {
    const src = require('fs').readFileSync(__filename, 'utf8');
    const m = src.match(/\/\/ SXV_PURE_START([\s\S]*?)\/\/ SXV_PURE_END/);
    const fn = new Function(m[1] + '; return { sxvEsc, sxvDigitos, sxvValidaChave, sxvMascaraChave, SXV_EVENTOS, sxvEventoPorTipo, sxvValidaJust, sxvEventoManifestacao, sxvUrlManifestacao, sxvValidaPerfil, sxvValidaNcm, sxvMenuVelho, sxvAutorizacaoValida };');
    return fn();
  })();
  module.exports = _p;
  if (typeof global !== 'undefined') global.SXV609_PURE = _p;
}
