// ═══════════════════════════════════════════════════════════════════════════
// novo/impressao.js — v1.0.0 (fase 3 do redesenho: PAPEL)
//
// Copiado do que sai da impressora HOJE (`vendas_os_patch.js:982+`), sem inventar
// layout: a notinha comum é MEIA FOLHA (com a linha de ✂), e a venda que tem OS
// sai em FOLHA INTEIRA com o bloco da Ordem de Serviço e as duas assinaturas.
// O carnê é o mesmo `vosImprimirCarne` (`vendas_os_patch.js:917`).
//
// Regras que vieram junto (e que o teste cobra):
//   • folha inteira = a venda TEM OS com algum dado (é o `v.os` que o
//     `vosGravarVenda` grava); sem OS = meia folha;
//   • OS "completa" (`vosOsCompleta`, vendas_os_patch.js:27) = modelo + nº de
//     série + (patrimônio OU contador) — a mesma conta de hoje;
//   • Pix: o bloco do QR entra ANTES da linha de auditoria, com o valor exato;
//   • venda zerada, Grátis, desconto da OS — tudo igual ao papel de hoje.
//
// Nada aqui grava, nada fala com a nuvem, nada usa alert/confirm/prompt nativo.
// ═══════════════════════════════════════════════════════════════════════════
(function (raiz) {
  'use strict';

  var VERSAO = '1.0.0';

  function texto(v) { return v == null ? '' : String(v); }
  function n(v, padrao) {
    if (typeof v === 'number' && isFinite(v)) return v;
    var x = Number(texto(v).replace(/\./g, '').replace(',', '.'));
    return isFinite(x) ? x : (padrao || 0);
  }
  function moeda(v) {
    return n(v, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapar(t) {
    return texto(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Data e hora no papel (o mesmo formato brasileiro do sistema de hoje)
  function dataBR(v) {
    var s = texto(v).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return texto(v) ? texto(v) : '';
    var p = s.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function horaBR(v) {
    var d = v instanceof Date ? v : new Date(v || Date.now());
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // ── A REGRA DA OS (cópia do `vosOsCompleta`, vendas_os_patch.js:27) ───────
  function osCompleta(os) {
    if (!os) return false;
    var modelo = texto(os.modelo).trim();
    var serie = texto(os.numeroSerie).trim();
    var patr = texto(os.patrimonio).trim();
    var cont = texto(os.contador == null ? '' : os.contador).trim();
    return !!(modelo && serie && (patr || cont));
  }
  // Cópia EXATA de `vosOsTemAlgumDado` (vendas_os_patch.js:534): o desconto da OS não
  // conta como "tem dado" e o zero é tratado como vazio.
  function osTemAlgumDado(os) {
    if (!os) return false;
    return ['numeroSerie', 'modelo', 'patrimonio', 'contador', 'defeito', 'servicos', 'pecas', 'acessorios', 'tecnico']
      .some(function (k) { return texto(os[k] || '').trim() !== ''; }) || n(os.valorServico, 0) > 0;
  }
  // Folha inteira = a venda tem OS com algum dado (é o que o papel de hoje faz)
  function folhaInteira(venda) { return !!((venda || {}).os) && osTemAlgumDado((venda || {}).os); }
  function tipoDePapel(venda) { return folhaInteira(venda) ? 'folha inteira' : 'meia folha'; }

  var CSS_NOTINHA = [
    '@page{size:A4 portrait; margin:0}',
    '*{box-sizing:border-box}',
    'body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111}',
    '.pagina{width:210mm;padding:9mm 12mm}',
    '.meia{height:138mm}',
    '.inteira{min-height:278mm}',
    '.cab{display:flex;justify-content:space-between;gap:6mm;border-bottom:1.5px solid #0a1e8a;padding-bottom:3mm}',
    '.cab-esq{display:flex;gap:4mm;align-items:flex-start}',
    '.logo{width:12mm;height:12mm;border-radius:2.5mm;background:#0a1e8a;color:#fff;font-weight:800;display:grid;place-items:center;font-size:14px}',
    '.emp-nome{font-weight:800;font-size:14px;margin:0}',
    '.emp-info{margin:1px 0 0;font-size:9px;color:#555}',
    '.cab-dir{text-align:right}',
    '.nota-t{margin:0;font-size:10px;font-weight:700;color:#0a1e8a;letter-spacing:.05em}',
    '.nota-n{margin:0;font-size:17px;font-weight:800}',
    '.cli-box{display:flex;justify-content:space-between;gap:6mm;border:1px solid #ccc;border-radius:2mm;padding:2.5mm 3.5mm;margin-top:3mm}',
    '.cli-dir{text-align:right}',
    '.lbl{display:block;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#777;margin-bottom:1mm}',
    '.sec-t{margin:3.5mm 0 1.5mm;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#0a1e8a}',
    'table.tb{width:100%;border-collapse:collapse;font-size:10.5px}',
    '.tb th{background:#eef0f8;font-size:8.5px;text-transform:uppercase;letter-spacing:.05em;color:#444;padding:1.6mm 2mm;border:1px solid #d5d9e8;text-align:left}',
    '.tb td{padding:1.6mm 2mm;border:1px solid #e2e5ee;vertical-align:top}',
    '.c{text-align:center}.r{text-align:right}',
    '.mini{font-size:8.5px;color:#777}',
    '.tots{display:flex;justify-content:flex-end;gap:8mm;margin-top:2.5mm;font-size:11px;align-items:baseline}',
    '.tot-grande{font-size:14px;font-weight:800;color:#0a1e8a}',
    '.obs{margin:2.5mm 0 0;font-size:10px;border:1px dashed #bbb;border-radius:2mm;padding:2mm 3mm}',
    '.ass{margin-top:14mm;border-top:1px solid #333;width:62mm;text-align:center;padding-top:1.5mm;font-size:9.5px}',
    '.ass-unica{display:flex}',
    '.ass-dupla{display:flex;justify-content:space-between;margin-top:2mm}',
    '.os-div{margin:4mm 0 2.5mm;background:#0a1e8a;color:#fff;font-weight:800;font-size:11px;letter-spacing:.06em;text-align:center;padding:2mm;border-radius:1.5mm}',
    '.os-tb td{width:25%}',
    '.audit{margin-top:3mm;font-size:8.5px;color:#888;border-top:1px solid #eee;padding-top:1.5mm}',
    '.no-print{margin:6mm;text-align:center;font-family:Arial}',
    '.no-print button{padding:3mm 8mm;border:0;border-radius:2mm;background:#0a1e8a;color:#fff;font-weight:700;cursor:pointer;font-size:12px}',
    '.no-print button.sec{background:#fff;color:#333;border:1px solid #aaa}',
    '.corte{margin:0;color:#999;font-size:9px;white-space:nowrap;overflow:hidden;width:210mm;padding:0 12mm}',
    '@media print{.no-print{display:none!important}.corte{color:#ccc}}'
  ].join('\n');

  var CSS_CARNE = [
    '@page{size:A4 portrait; margin:0}',
    '*{box-sizing:border-box}',
    'body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:#111}',
    '.pagina{width:210mm;padding:10mm 14mm}',
    '.canhoto{border:1.5px solid #111;border-radius:4mm;padding:5mm 6mm;margin-bottom:2mm;page-break-inside:avoid}',
    '.linha.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px dashed #888;padding-bottom:2.5mm;margin-bottom:3mm}',
    '.emp{font-size:14px}',
    '.linha.top span{font-size:9.5px;color:#444}',
    '.num{text-align:right;font-weight:800;font-size:12px;line-height:1.35}',
    '.grid2{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm 6mm}',
    '.grid2 span{display:block;font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:#555}',
    '.grid2 b{font-size:12px}',
    '.grid2 b.big{font-size:14px}',
    '.grid2 b.valor{font-size:16px}',
    '.rod{margin:3.5mm 0 0;font-size:10px;border-top:1px solid #ccc;padding-top:2.5mm}',
    '.corte{color:#999;font-size:10px;margin:1mm 0 4mm;white-space:nowrap;overflow:hidden}',
    '.no-print{margin:8mm;text-align:center}',
    '.no-print button{padding:3mm 7mm;border:0;border-radius:2mm;background:#0a1e8a;color:#fff;font-weight:700;cursor:pointer}',
    '.no-print button.sec{background:#fff;color:#333;border:1px solid #aaa}',
    '@media print{.no-print{display:none!important}.corte{color:#bbb}}'
  ].join('\n');

  var CORTE = '✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -';

  // ── A NOTINHA ────────────────────────────────────────────────────────────
  // opcoes: { venda, cliente, empresa, os (opcional, sai do venda.os), pix (bloco pronto), paraArquivo }
  function notinhaHtml(opcoes) {
    var o = opcoes || {};
    var v = o.venda;
    if (!v) return null;
    var cli = o.cliente || {};
    var empresa = o.empresa || {};
    var sess = o.sessao || {};
    var os = v.os || null;
    var temOS = folhaInteira(v);
    var codNum = texto(v.numero).replace(/^VD-/, '');
    var nomeAtendente = v.atendenteNome || v.criadoPorNome || sess.usuarioNome || '';

    var itens = (v.itens && v.itens.length) ? v.itens : [{ descricao: v.observacao ? ('Item • ' + v.observacao) : 'Item / Serviço (migrado)', qtd: 1, preco: v.total, subtotal: v.total }];
    var itensRows = itens.map(function (it, i) {
      var p = it.produto && typeof it.produto === 'object' ? it.produto : null;
      var desc = (p && p.nome) || it.descricao || 'Item';
      var ident = [it.identificacao, it.numCartucho ? ('cart. ' + it.numCartucho) : ''].filter(Boolean).join(' • ');
      return '<tr>' +
        '<td class="c">' + (i + 1) + '</td>' +
        '<td><b>' + escapar(desc) + '</b>' + (ident ? ('<br><span class="mini">' + escapar(ident) + '</span>') : '') +
          (it.tecnico ? ('<br><span class="mini">Téc: ' + escapar(it.tecnico) + '</span>') : '') + '</td>' +
        '<td class="c">' + escapar(it.tipo || '') + '</td>' +
        '<td class="c">' + escapar(it.qtd) + '</td>' +
        '<td class="r">' + moeda(it.preco) + '</td>' +
        '<td class="r">' + moeda(it.desconto || 0) + '</td>' +
        '<td class="r"><b>' + moeda(it.subtotal) + '</b></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="7" class="c">Sem itens</td></tr>';

    var parcelasRows = (v.parcelas && v.parcelas.length > 1) ?
      '<p class="sec-t">Parcelas (' + escapar(v.formaPagamento || 'Prazo') + ')</p>' +
      '<table class="tb"><thead><tr><th></th><th>Vencimento</th><th></th><th></th><th></th><th></th><th class="r">Valor</th></tr></thead><tbody>' +
      v.parcelas.map(function (p) {
        return '<tr><td class="c">' + escapar(p.n) + '/' + escapar(p.total || v.parcelas.length) + '</td><td>' + dataBR(p.vencimento) + '</td>' +
          '<td></td><td></td><td></td><td></td><td class="r"><b>' + moeda(p.valor) + '</b></td></tr>';
      }).join('') +
      '</tbody></table>' : '';

    var subItens = (v.itens || []).reduce(function (s, i) { return s + n(i.subtotal, 0); }, 0);
    var valOS = n(os && os.valorServico, 0);
    var descV = n(v.desconto, 0) + n(os && os.desconto, 0);

    var cabecalho =
      '<div class="cab">' +
        '<div class="cab-esq">' +
          '<div class="logo">' + escapar((empresa.fantasia || empresa.nome || 'DIGICOPY').slice(0, 2).toUpperCase()) + '</div>' +
          '<div>' +
            '<p class="emp-nome">' + escapar(empresa.fantasia || empresa.nome || 'DIGICOPY') + '</p>' +
            '<p class="emp-info">' + escapar([empresa.nome, empresa.cnpj || sess.cnpj, empresa.telefone].filter(Boolean).join(' • ')) + '</p>' +
            '<p class="emp-info">' + escapar([empresa.logradouro, empresa.numero, empresa.bairro, empresa.municipio, empresa.uf].filter(Boolean).join(', ')) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="cab-dir">' +
          '<p class="nota-t">' + (texto(v.status) === 'orcamento' ? 'ORÇAMENTO' : 'VENDA / NOTINHA') + '</p>' +
          '<p class="nota-n">Nº ' + escapar(codNum) + '</p>' +
          '<p class="emp-info">' + dataBR(v.data) + (horaBR(v.data) ? (' às ' + horaBR(v.data)) : '') + '</p>' +
          '<p class="emp-info">Atendente: <b>' + escapar(nomeAtendente) + '</b></p>' +
        '</div>' +
      '</div>' +
      '<div class="cli-box">' +
        '<div>' +
          '<span class="lbl">Cliente</span>' +
          '<b>' + (cli.codigo ? ('#' + escapar(cli.codigo) + ' — ') : '') + escapar(cli.nome || '') + '</b>' +
          (cli.fantasia ? (' (' + escapar(cli.fantasia) + ')') : '') +
          '<p class="emp-info">' + escapar([cli.documento, cli.telefone].filter(Boolean).join(' • ')) + '</p>' +
          '<p class="emp-info">' + escapar([cli.endereco, cli.cidade && (cli.cidade + '/' + (cli.estado || '')), cli.cep].filter(Boolean).join(' — ')) + '</p>' +
        '</div>' +
        '<div class="cli-dir">' +
          '<span class="lbl">Entrega</span>' +
          '<p class="emp-info">Destino: <b>' + escapar(v.destino || '') + '</b></p>' +
          '<p class="emp-info">Pagamento: <b>' + escapar(v.formaPagamento || '—') + '</b> • Situação: <b>' + escapar(texto(v.status).toUpperCase()) + '</b></p>' +
        '</div>' +
      '</div>';

    var corpoVenda =
      '<p class="sec-t">Itens da venda</p>' +
      '<table class="tb">' +
        '<thead><tr><th class="c">#</th><th>Descrição</th><th class="c">Tipo</th><th class="c">Qtd</th>' +
        '<th class="r">Unitário</th><th class="r">Desconto</th><th class="r">Subtotal</th></tr></thead>' +
        '<tbody>' + itensRows + '</tbody>' +
      '</table>' +
      (temOS && valOS > 0 ?
        '<table class="tb" style="margin-top:2mm"><tbody><tr><td>Serviço da OS ' + escapar(os.numero || '') +
        (n(os.desconto, 0) ? (' (desc. ' + moeda(os.desconto) + ')') : '') + '</td>' +
        '<td class="r"><b>' + moeda(valOS - n(os.desconto, 0)) + '</b></td></tr></tbody></table>' : '') +
      '<div class="tots">' +
        '<span>Subtotal: <b>' + moeda(subItens + (temOS ? valOS : 0)) + '</b></span>' +
        '<span>Descontos: <b>' + moeda(descV) + '</b></span>' +
        '<span class="tot-grande">TOTAL: ' + moeda(v.total || 0) + '</span>' +
      '</div>' +
      parcelasRows +
      (v.observacao ? ('<p class="obs"><b>Observações:</b> ' + escapar(v.observacao) + '</p>') : '');

    var corpoOS = '';
    if (temOS) {
      corpoOS =
        '<div class="os-div"><span>ORDEM DE SERVIÇO ' + escapar(os.numero || '') + '</span></div>' +
        '<table class="tb os-tb"><tbody>' +
          '<tr>' +
            '<td><span class="lbl">Equipamento / modelo</span><b>' + escapar(os.modelo || '') + '</b></td>' +
            '<td><span class="lbl">Nº de série</span><b>' + escapar(os.numeroSerie || '') + '</b></td>' +
            '<td><span class="lbl">Patrimônio</span><b>' + escapar(os.patrimonio || '') + '</b></td>' +
            '<td><span class="lbl">Contador (cópias)</span><b>' + escapar(os.contador == null ? '' : os.contador) + '</b></td>' +
          '</tr>' +
          '<tr>' +
            '<td><span class="lbl">Tipo da OS</span><b>' + escapar(os.tipoOS || '') + '</b></td>' +
            '<td><span class="lbl">Acessórios</span><b>' + escapar(os.acessorios || '') + '</b></td>' +
            '<td><span class="lbl">Técnico responsável</span><b>' + escapar(os.tecnico || '') + '</b></td>' +
            '<td><span class="lbl">Resp. entrega / garantia</span><b>' + escapar(os.responsavelEntrega || '') + ' • ' + escapar(os.garantia || '') + '</b></td>' +
          '</tr>' +
        '</tbody></table>' +
        '<table class="tb" style="margin-top:2mm"><tbody>' +
          '<tr><td><span class="lbl">Defeito apresentado</span><p>' + escapar(os.defeito || '') + '</p></td></tr>' +
          '<tr><td><span class="lbl">Serviços executados</span><p>' + escapar(os.servicos || '') + '</p></td></tr>' +
          '<tr><td><span class="lbl">Peças</span><p>' + escapar(os.pecas || '') + '</p></td></tr>' +
          '<tr><td><span class="lbl">Situação da OS</span><b>' + escapar(os.situacao || '') + '</b></td></tr>' +
        '</tbody></table>' +
        '<div class="ass-dupla">' +
          '<div class="ass">Assinatura do cliente</div>' +
          '<div class="ass">Assinatura do técnico</div>' +
        '</div>';
    }

    var assinaturaVenda = temOS ? '' :
      '<div class="ass-unica"><div class="ass">Assinatura do cliente<br>' +
      '<span class="mini">Recebi em ___/___/____ às ___:___</span></div></div>';

    var audit = '<p class="audit">Emitido por ' + escapar(nomeAtendente) + ' • CNPJ ' + escapar(sess.cnpj || '') +
      ' • Cód. cliente ' + escapar(cli.codigo || '-') + '</p>';

    var blocoPix = o.pix || '';
    // v4.9.15 — quando a venda é Pix, o papel também avisa que a baixa é manual
    // (é o bloco que o `pix_comprovante_manual_patch.js:70` injeta antes do `</body>`)
    var avisoPix = texto(v.formaPagamento).toLowerCase() === 'pix'
      ? '<div style="margin:8px 0;padding:8px;border:1px solid #f59e0b;background:#fffbeb;border-radius:8px;font-size:11px;color:#92400e"><b>Pix:</b> valor exato da notinha. Envie o comprovante no WhatsApp da DIGICOPY para baixa manual.</div>'
      : '';
    var botoesHtml = o.paraArquivo ? '' :
      '<div class="no-print"><button onclick="window.print()">🖨 Imprimir / Salvar PDF</button> ' +
      '<button class="sec" onclick="window.close()">Fechar</button></div>';
    var corteHtml = temOS ? '' : ('<div class="corte no-print">' + CORTE + '</div>');
    var scriptHtml = o.paraArquivo ? '' : '<' + 'script>window.onload=function(){setTimeout(function(){window.print()},350)};<' + '/script>';

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Notinha ' + escapar(v.numero) + '</title><style>' + CSS_NOTINHA + '</style></head><body>\n' +
      botoesHtml + '\n' +
      '<div class="pagina ' + (temOS ? 'inteira' : 'meia') + '">\n' +
      cabecalho + '\n' + corpoVenda + '\n' + corpoOS + '\n' +
      (blocoPix ? (blocoPix + '\n') : '') +
      assinaturaVenda + '\n' + audit + '\n' +
      '</div>\n' + corteHtml + '\n' + scriptHtml + '\n' +
      avisoPix +
      '</body></html>';
  }

  // ── O CARNÊ ──────────────────────────────────────────────────────────────
  // opcoes: { venda, cliente, empresa, parcelas: [{n,total,vencimento,valor}], sessao }
  function carneHtml(opcoes) {
    var o = opcoes || {};
    var v = o.venda;
    if (!v) return null;
    var parcelas = o.parcelas || v.parcelas || [];
    if (!parcelas.length) return null;
    var cli = o.cliente || {};
    var empresa = o.empresa || {};
    var sess = o.sessao || {};
    var folhas = parcelas.map(function (p) {
      return '<div class="canhoto">' +
        '<div class="linha top"><div><b class="emp">' + escapar(empresa.fantasia || empresa.nome || 'DIGICOPY') + '</b><br>' +
          '<span>' + escapar(empresa.cnpj || sess.cnpj || '') + (empresa.telefone ? (' • ' + escapar(empresa.telefone)) : '') + '</span></div>' +
          '<div class="num">CARNÊ<br>VENDA ' + escapar(v.numero) + '</div></div>' +
        '<div class="grid2">' +
          '<div><span>Cliente</span><b>' + escapar(cli.nome || '') + '</b></div>' +
          '<div><span>Cód. cliente</span><b>' + escapar(cli.codigo || '-') + '</b></div>' +
          '<div><span>Parcela</span><b class="big">' + escapar(p.n) + '/' + escapar(p.total || parcelas.length) + '</b></div>' +
          '<div><span>Vencimento</span><b class="big">' + dataBR(p.vencimento) + '</b></div>' +
          '<div><span>Valor</span><b class="big valor">' + moeda(p.valor) + '</b></div>' +
          '<div><span>Pagamento</span><b>____/____/______</b></div>' +
        '</div>' +
        '<p class="rod">Recebemos de <b>' + escapar(cli.nome || '') + '</b> a importância referente à parcela indicada. &nbsp;&nbsp; ' +
        'Assinatura: _______________________________</p>' +
        '</div>' +
        '<div class="corte">' + CORTE + '</div>';
    }).join('');

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Carnê — ' + escapar(v.numero) + '</title><style>' + CSS_CARNE + '</style></head><body>\n' +
      '<div class="no-print"><button onclick="window.print()">Imprimir carnê</button> <button class="sec" onclick="window.close()">Fechar</button></div>\n' +
      '<div class="pagina">' + folhas + '</div>\n' +
      '<' + 'script>window.onload=function(){setTimeout(function(){window.print()},350)};<' + '/script>\n' +
      '</body></html>';
  }

  // ── MANDAR PARA A IMPRESSORA ─────────────────────────────────────────────
  // Igual ao sistema de hoje: abre a janela, escreve e manda imprimir (o próprio
  // HTML tem o `window.print()` e os botões). Devolve false quando o navegador
  // bloqueia a janela — quem chamou avisa o dono na tela (nada de alert nativo).
  // ── A NOTINHA EM ARQUIVO WORD (.doc) ─────────────────────────────────────
  // É o botão "Word" do sistema de hoje (`vosExportarNotinhaWord`, vendas_os_patch.js:1178):
  // o MESMO papel da notinha (sem auto-print, senão o arquivo abriria imprimindo), com o
  // BOM na frente para o Word ler os acentos, salvo como `notinha_<número>.doc`.
  function arquivoWord(opcoes) {
    var o = opcoes || {};
    var venda = o.venda || {};
    var html = notinhaHtml(Object.assign({}, o, { paraArquivo: true }));
    var numero = texto(venda.numero || venda.id || 'notinha').replace(/[^\w-]+/g, '_');
    return { html: '\ufeff' + html, nome: 'notinha_' + numero + '.doc', tipo: 'application/msword' };
  }

  function imprimir(html, opcoes) {
    var o = opcoes || {};
    if (!html) return false;
    var win = null;
    try { win = raiz.open('', '_blank'); } catch (e) { win = null; }
    if (!win) return false;
    try {
      win.document.write(html);
      win.document.close();
      if (o.focar !== false && win.focus) win.focus();
      return true;
    } catch (e) {
      return false;
    }
  }

  var regras = {
    osCompleta: osCompleta,
    osTemAlgumDado: osTemAlgumDado,
    folhaInteira: folhaInteira,
    tipoDePapel: tipoDePapel,
    notinhaHtml: notinhaHtml,
    carneHtml: carneHtml,
    imprimir: imprimir,
    dataBR: dataBR,
    horaBR: horaBR,
    moeda: moeda,
    escapar: escapar,
    arquivoWord: arquivoWord
  };

  raiz.DIGICOPY_IMPRESSAO = { VERSAO_IMPRESSAO: VERSAO, regras: regras, imprimir: imprimir };
})(typeof window !== 'undefined' ? window : globalThis);
