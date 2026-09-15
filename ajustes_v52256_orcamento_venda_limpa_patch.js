// PATCH v5.22.56 — Orçamento 100% via link do cliente, conversão em Venda Salva e Sincronização v5.22.56
(function(){
  'use strict';

  var VERSAO = '5.22.56';
  if(typeof window !== 'undefined'){
    window.DIGICOPY_APP_VERSION = window.DIGICOPY_APP_VERSION || VERSAO;
  }

  var API = 'https://digicopy-sync-api.kauangabrielcardososilva7890.workers.dev';

  function txt(v){ return String(v == null ? '' : v).trim(); }
  function n(v){ var x = Number(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : 0; }

  function getDb(){
    return window.db || (typeof db !== 'undefined' ? db : null) || {};
  }

  function getSess(){
    return typeof getSession === 'function' ? getSession() : null;
  }

  function proximaVendaNumero(empId){
    var _db = getDb();
    if(typeof window.proximoNumeroSimples === 'function'){
      return window.proximoNumeroSimples('venda', _db.vendas, empId);
    }
    var max = 0;
    (_db.vendas || []).forEach(function(v){
      if(!v) return;
      var num = parseInt(String(v.numero || '').replace(/\D/g, ''), 10) || 0;
      if(num > max) max = num;
    });
    return String(max + 1);
  }

  // Gera a venda salva a partir de um orçamento e atualiza os status
  function gerarVendaSalvaDeOrcamento(orcId, origem){
    var _db = getDb();
    if(!_db.orcamentos) _db.orcamentos = [];
    if(!_db.vendas) _db.vendas = [];
    if(!_db.notificacoes) _db.notificacoes = [];

    var o = _db.orcamentos.find(function(x){ return x && (x.id === orcId || x.token === orcId); });
    if(!o) return null;

    // Se já tem venda existente vinculada
    if(o.vendaId){
      var vendaExistente = _db.vendas.find(function(v){ return v && (v.id === o.vendaId || v.origemOrcamentoId === o.id); });
      if(vendaExistente){
        o.status = 'aprovado';
        o.vendaNumero = vendaExistente.numero || o.vendaNumero;
        return vendaExistente;
      }
      o.vendaExcluidaPeloUsuario = true;
      return null;
    }

    var s = getSess();
    var empId = o.empresaId || (s && s.empresaId) || 'emp_default';
    var vId = 'vda_orc_' + String(o.id || Date.now().toString(36));
    var vNum = o.vendaNumero || proximaVendaNumero(empId);

    var cli = (_db.clientes || []).find(function(c){ return c && c.id === o.clienteId; }) || {};
    var cliNome = (cli.nome || cli.fantasia || o.clienteNome || 'Cliente');

    var novaVenda = {
      id: vId,
      empresaId: empId,
      numero: vNum,
      clienteId: o.clienteId || null,
      clienteNome: cliNome,
      data: new Date().toISOString(),
      itens: (o.itens || []).map(function(it){
        return {
          produtoId: it.produtoId || null,
          descricao: it.descricao || '',
          sku: it.sku || '',
          qtd: n(it.qtd || 1),
          preco: n(it.preco || 0),
          desconto: n(it.desconto || 0),
          subtotal: n(it.subtotal || 0),
          tipo: it.tipo || 'Produto'
        };
      }),
      desconto: n(o.desconto || 0),
      total: n(o.total || 0),
      formaPagamento: 'A prazo',
      observacao: 'Gerada do orçamento ' + (o.numero || ''),
      status: 'aguardar', // Venda salva pronta para faturar
      origemOrcamentoId: o.id,
      criadoPor: s ? s.usuarioId : (o.criadoPor || 'sistema'),
      criadoPorNome: s ? s.usuarioNome : (o.criadoPorNome || 'Cliente (Aprovação)'),
      criadoEm: new Date().toISOString(),
      atendenteNome: s ? s.usuarioNome : (o.criadoPorNome || 'Sistema')
    };

    // Atualiza estoque de produtos físicos se houver
    (novaVenda.itens || []).forEach(function(it){
      if(it.produtoId && _db.produtos){
        var pr = _db.produtos.find(function(p){ return p && p.id === it.produtoId; });
        if(pr && !/servi[cç]o|recarga/i.test(String(pr.categoria || '') + ' ' + String(pr.tipo || ''))){
          pr.estoque = n(pr.estoque) - n(it.qtd);
        }
      }
    });

    _db.vendas.unshift(novaVenda);

    // Atualiza o orçamento
    o.status = 'aprovado';
    o.vendaId = novaVenda.id;
    o.vendaNumero = novaVenda.numero;
    o.aprovadoEm = new Date().toISOString();
    o.aprovadoOrigem = origem || 'cliente';
    o.vendaGeradaUmaVez = true;

    // Cria notificação
    var ntf = {
      id: 'ntf_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      empresaId: empId,
      tipo: 'orcamento_aprovado',
      titulo: 'Orçamento autorizado',
      texto: cliNome + ' autorizou o orçamento ' + (o.numero || '') + ' e gerou a venda salva ' + novaVenda.numero,
      orcamentoId: o.id,
      vendaId: novaVenda.id,
      lida: false,
      criadoEm: new Date().toISOString()
    };
    _db.notificacoes.unshift(ntf);

    if(typeof saveDB === 'function') saveDB();

    // Feedback visual
    if(typeof window.lfbAlert === 'function'){
      window.lfbAlert('O orçamento ' + (o.numero || '') + ' foi AUTORIZADO com sucesso e gerou a VENDA SALVA nº ' + novaVenda.numero + '!', 'Orçamento Autorizado');
    } else if(typeof toast === 'function'){
      toast('Orçamento ' + (o.numero || '') + ' autorizado! Venda salva ' + novaVenda.numero + ' gerada.', 'success');
    }

    if(typeof window.renderOrcamentos === 'function') window.renderOrcamentos();
    if(typeof window.renderVendas === 'function') window.renderVendas();

    return novaVenda;
  }

  // Recusa o orçamento e atualiza status
  function recusarOrcamento(orcId){
    var _db = getDb();
    if(!_db.orcamentos) return;
    var o = _db.orcamentos.find(function(x){ return x && (x.id === orcId || x.token === orcId); });
    if(!o) return;
    o.status = 'recusado';
    o.recusadoEm = new Date().toISOString();
    if(typeof saveDB === 'function') saveDB();
    if(typeof toast === 'function') toast('Orçamento ' + (o.numero || '') + ' marcado como Não autorizado', 'info');
    if(typeof window.renderOrcamentos === 'function') window.renderOrcamentos();
  }

  // Garante tokens em orçamentos sem token
  function garantirTokensOrcamentos(){
    var _db = getDb();
    if(!_db || !_db.orcamentos) return;
    var alterou = false;
    _db.orcamentos.forEach(function(o){
      if(!o) return;
      if(!o.token){
        o.token = 'orc_tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        alterou = true;
      }
    });
    if(alterou && typeof saveDB === 'function') saveDB();
  }

  // Consulta ativamente a API do Cloudflare Worker para buscar aprovações remotas
  function verificarAprovacoesNuvem(){
    var _db = getDb();
    if(!_db || !_db.orcamentos) return;
    garantirTokensOrcamentos();

    var pendentes = _db.orcamentos.filter(function(o){
      if(!o || !o.token) return false;
      if(o.status === 'recusado' || o.status === 'excluido' || o.status === 'estornado') return false;
      if(o.status === 'aprovado' && o.vendaId && (_db.vendas || []).some(function(v){ return v && v.id === o.vendaId; })) return false;
      return true;
    });

    if(!pendentes.length) return;

    pendentes.slice(0, 10).forEach(function(o){
      fetch(API + '/orcamento?c=' + encodeURIComponent(o.token))
        .then(function(r){ return r.json(); })
        .then(function(res){
          if(!res) return;
          var st = txt(res.status || (res.data && res.data.status)).toLowerCase();
          if(st === 'aprovado' || (res.ok && res.status === 'aprovado') || res.vendaId){
            if(o.status !== 'aprovado' || !o.vendaId || !(_db.vendas || []).some(function(v){ return v && v.id === o.vendaId; })){
              gerarVendaSalvaDeOrcamento(o.id, 'cliente_web');
            }
          } else if(st === 'recusado' || (res.ok && res.status === 'recusado')){
            if(o.status !== 'recusado'){
              recusarOrcamento(o.id);
            }
          }
        })
        .catch(function(){});
    });
  }

  var ORCAMENTO_APROVACAO_V52256_PURE = {
    VERSAO: VERSAO,
    gerarVendaSalvaDeOrcamento: gerarVendaSalvaDeOrcamento,
    recusarOrcamento: recusarOrcamento,
    verificarAprovacoesNuvem: verificarAprovacoesNuvem,
    garantirTokensOrcamentos: garantirTokensOrcamentos
  };

  if(typeof window !== 'undefined'){
    window.ORCAMENTO_APROVACAO_V52256_PURE = ORCAMENTO_APROVACAO_V52256_PURE;
    window.aprovarOrcamentoInterno = gerarVendaSalvaDeOrcamento;

    // Escuta em tempo real decisões locais e de abas
    try{
      if(typeof BroadcastChannel !== 'undefined'){
        var bc = new BroadcastChannel('digicopy_orcamentos');
        bc.onmessage = function(ev){
          var msg = ev && ev.data;
          if(!msg) return;
          var _db = getDb();
          var o = (_db.orcamentos || []).find(function(x){
            return x && ((msg.token && x.token === msg.token) || (msg.numero && String(x.numero) === String(msg.numero)));
          });
          if(!o) return;
          if(msg.acao === 'aprovar'){
            gerarVendaSalvaDeOrcamento(o.id, 'cliente_web');
          } else if(msg.acao === 'recusar'){
            recusarOrcamento(o.id);
          }
        };
      }
      window.addEventListener('storage', function(ev){
        if(ev && ev.key && ev.key.indexOf('digicopy_orc_decisao_') === 0){
          try{
            var data = JSON.parse(ev.newValue || '{}');
            var tok = ev.key.replace('digicopy_orc_decisao_', '');
            var _db = getDb();
            var o = (_db.orcamentos || []).find(function(x){
              return x && (x.token === tok || (data.numero && String(x.numero) === String(data.numero)));
            });
            if(!o) return;
            if(data.acao === 'aprovar'){
              gerarVendaSalvaDeOrcamento(o.id, 'cliente_web');
            } else if(data.acao === 'recusar'){
              recusarOrcamento(o.id);
            }
          }catch(e){}
        }
      });
    }catch(e){}

    // Ações manuais disponíveis
    window.aprovarOrcamentoManual = function(id){
      var _db = getDb();
      var o = (_db.orcamentos || []).find(function(x){ return x && x.id === id; });
      if(!o) return;
      if(typeof window.confirmSistema === 'function'){
        window.confirmSistema('Deseja autorizar o orçamento ' + (o.numero || '') + ' e gerar a venda salva no sistema?', 'Autorizar Orçamento').then(function(ok){
          if(!ok) return;
          gerarVendaSalvaDeOrcamento(id, 'atendente_manual');
          if(o.token){
            fetch(API + '/orcamento', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ c: o.token, acao: 'aprovar', numero: o.numero, clienteNome: o.clienteNome })
            }).catch(function(){});
          }
        });
      } else {
        gerarVendaSalvaDeOrcamento(id, 'atendente_manual');
      }
    };

    window.recusarOrcamentoManual = function(id){
      var _db = getDb();
      var o = (_db.orcamentos || []).find(function(x){ return x && x.id === id; });
      if(!o) return;
      if(typeof window.confirmSistema === 'function'){
        window.confirmSistema('Deseja marcar o orçamento ' + (o.numero || '') + ' como Não autorizado?', 'Recusar Orçamento').then(function(ok){
          if(!ok) return;
          recusarOrcamento(id);
          if(o.token){
            fetch(API + '/orcamento', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ c: o.token, acao: 'recusar', numero: o.numero, clienteNome: o.clienteNome })
            }).catch(function(){});
          }
        });
      } else {
        recusarOrcamento(id);
      }
    };

    // Atualiza status visual e botões no modal de orçamento
    if(typeof window.abrirTelaOrcamento === 'function' && !window.abrirTelaOrcamento.__v52256modal){
      var oldAbrir = window.abrirTelaOrcamento;
      window.abrirTelaOrcamento = function(existente){
        var res = oldAbrir.apply(this, arguments);
        try{
          if(existente && existente.id){
            var _db = getDb();
            var o = (_db.orcamentos || []).find(function(x){ return x && x.id === existente.id; }) || existente;
            var body = document.getElementById('modal-body');
            var footer = document.getElementById('modal-footer');
            if(body){
              var st = txt(o.status).toLowerCase();
              var banner = document.createElement('div');
              banner.className = 'mb-3 p-3 rounded-xl flex items-center justify-between border';
              
              if(st === 'aprovado' || o.vendaId){
                banner.className += ' bg-emerald-50 border-emerald-200 text-emerald-900';
                banner.innerHTML = '<div class="flex items-center gap-2"><i class="ph ph-check-circle-fill text-xl text-emerald-600"></i><div><p class="font-bold text-[13px]">Orçamento AUTORIZADO</p><p class="text-[11px] text-emerald-700">Venda salva nº ' + (o.vendaNumero || '') + ' gerada com sucesso</p></div></div>'
                  + '<button type="button" onclick="closeModal(); if(typeof navigateTo===\'function\') navigateTo(\'vendas\');" class="h-8 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700"><i class="ph ph-shopping-bag"></i> Abrir Venda</button>';
              } else if(st === 'recusado'){
                banner.className += ' bg-rose-50 border-rose-200 text-rose-900';
                banner.innerHTML = '<div class="flex items-center gap-2"><i class="ph ph-x-circle-fill text-xl text-rose-600"></i><div><p class="font-bold text-[13px]">Orçamento NÃO AUTORIZADO</p><p class="text-[11px] text-rose-700">O cliente recusou este orçamento</p></div></div>';
              } else {
                banner.className += ' bg-blue-50 border-blue-200 text-blue-900';
                banner.innerHTML = '<div class="flex items-center gap-2"><i class="ph ph-clock-bold text-xl text-blue-600"></i><div><p class="font-bold text-[13px]">Orçamento ABERTO</p><p class="text-[11px] text-blue-700">Aguardando decisão do cliente pelo link ou autorização direta</p></div></div>'
                  + '<div class="flex items-center gap-1.5">'
                  + '<button type="button" onclick="window.copiarLinkOrcamentoModal(\'' + o.id + '\')" class="h-8 px-2.5 rounded-lg bg-white border border-blue-300 text-blue-800 font-bold text-xs flex items-center gap-1 hover:bg-blue-100/50"><i class="ph ph-copy"></i> Copiar Link</button>'
                  + '<button type="button" onclick="window.aprovarOrcamentoManual(\'' + o.id + '\'); closeModal();" class="h-8 px-2.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700"><i class="ph ph-check-bold"></i> Autorizar</button>'
                  + '<button type="button" onclick="window.recusarOrcamentoManual(\'' + o.id + '\'); closeModal();" class="h-8 px-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 hover:bg-rose-100"><i class="ph ph-x-bold"></i> Recusar</button>'
                  + '</div>';
              }
              if(body.firstChild){
                body.insertBefore(banner, body.firstChild);
              } else {
                body.appendChild(banner);
              }
            }
          }
        }catch(e){}
        return res;
      };
      window.abrirTelaOrcamento.__v52256modal = true;
    }

    // Função para copiar o link oficial do orçamento
    window.copiarLinkOrcamentoModal = function(id){
      var _db = getDb();
      var o = (_db.orcamentos || []).find(function(x){ return x && x.id === id; });
      if(!o) return;
      var cli = (_db.clientes || []).find(function(c){ return c && c.id === o.clienteId; }) || {};
      var emp = (_db.config && _db.config.empresa) || {};
      var link = '';
      if(window.ORCAMENTOS_PAGES_V52254_PURE && typeof window.ORCAMENTOS_PAGES_V52254_PURE.linkOrcamento === 'function'){
        link = window.ORCAMENTOS_PAGES_V52254_PURE.linkOrcamento(o, cli, emp);
      } else {
        link = 'https://digicopy-orcamentos.pages.dev/?v=' + VERSAO + '&c=' + encodeURIComponent(o.token || '');
      }
      try{
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(link).then(function(){
            if(typeof toast === 'function') toast('Link do orçamento copiado com sucesso!', 'success');
          });
        } else {
          prompt('Copie o link do orçamento:', link);
        }
      }catch(e){
        prompt('Copie o link do orçamento:', link);
      }
    };

    // Sincronização central e infalível de versão em todo o sistema
    function sincronizarVersaoVisual(){
      try{
        if(typeof document === 'undefined') return;
        var fv = document.getElementById('footer-version');
        var _vUI = (typeof window!=='undefined' && window.DIGICOPY_APP_VERSION) || VERSAO;
        if(fv && fv.textContent !== 'v' + _vUI) fv.textContent = 'v' + _vUI;
        var tv = document.getElementById('app-title-version');
        if(tv && tv.textContent !== 'Sistema Digicopy v' + _vUI) tv.textContent = 'Sistema Digicopy v' + _vUI;
        if(document.title && !document.title.includes(_vUI)){
          document.title = 'Sistema Digicopy v' + _vUI;
        }
        var footSpan = document.querySelector('footer span:not(#footer-session):not(#footer-version)');
        if(footSpan && !footSpan.textContent.includes('Sistema Digicopy')){
          footSpan.textContent = 'Sistema Digicopy • Banco na Nuvem';
        }
      }catch(e){}
    }

    window.__digicopySincronizarVersao = sincronizarVersaoVisual;
    garantirTokensOrcamentos();
    sincronizarVersaoVisual();
    setTimeout(sincronizarVersaoVisual, 50);
    setTimeout(sincronizarVersaoVisual, 300);
    setTimeout(sincronizarVersaoVisual, 1000);

    // Polling contínuo para receber aprovações feitas pelo cliente no Pages / WhatsApp
    /* v5.22.62: sem polling 4s — gerava venda em loop */
    setTimeout(verificarAprovacoesNuvem, 1000);

    // Dispara checagem imediata e sincronização de versão ao navegar para qualquer menu
    if(typeof window.navigateTo === 'function' && !window.navigateTo.__v52256sync){
      var oldN = window.navigateTo;
      window.navigateTo = function(v){
        var res = oldN.apply(this, arguments);
        try{ sincronizarVersaoVisual(); }catch(e){}
        if(v === 'orcamentos' || v === 'vendas'){
          setTimeout(verificarAprovacoesNuvem, 100);
        }
        return res;
      };
      window.navigateTo.__v52256sync = true;
    }

    console.log('[DIGICOPY] v' + VERSAO + ': Versão ' + VERSAO + ' sincronizada + aprovação 100% via link do cliente ativada!');
  }

  if(typeof module !== 'undefined' && module.exports){
    module.exports = { ORCAMENTO_APROVACAO_V52256_PURE: ORCAMENTO_APROVACAO_V52256_PURE };
  }
})();
