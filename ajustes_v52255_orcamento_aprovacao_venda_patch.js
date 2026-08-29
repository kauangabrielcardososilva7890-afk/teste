// PATCH v5.22.55 — Conversão garantida de Orçamento em Venda Salva e Sincronização de Status
(function(){
  'use strict';

  var VERSAO = '5.22.55';
  if(typeof window !== 'undefined'){
    window.DIGICOPY_APP_VERSION = VERSAO;
  }

  var API = 'https://digicopy-sync-api.kauangabrielcardososilva7890.workers.dev';

  function txt(v){ return String(v == null ? '' : v).trim(); }
  function n(v){ var x = Number(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : 0; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

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
        if(typeof saveDB === 'function') saveDB();
        return vendaExistente;
      }
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

  // Consulta ativamente a API do Cloudflare Worker para buscar aprovações remotas
  function verificarAprovacoesNuvem(){
    var _db = getDb();
    if(!_db || !_db.orcamentos) return;

    var pendentes = _db.orcamentos.filter(function(o){
      if(!o || !o.token) return false;
      if(o.status === 'recusado' || o.status === 'excluido' || o.status === 'estornado') return false;
      // Se já está aprovado e tem venda, não precisa consultar
      if(o.status === 'aprovado' && o.vendaId && (_db.vendas || []).some(function(v){ return v && v.id === o.vendaId; })) return false;
      return true;
    });

    if(!pendentes.length) return;

    pendentes.slice(0, 10).forEach(function(o){
      fetch(API + '/orcamento?c=' + encodeURIComponent(o.token))
        .then(function(r){ return r.json(); })
        .then(function(res){
          if(!res) return;
          var st = txt(res.status).toLowerCase();
          if(st === 'aprovado' || (res.ok && res.status === 'aprovado')){
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

  var ORCAMENTO_APROVACAO_V52255_PURE = {
    VERSAO: VERSAO,
    gerarVendaSalvaDeOrcamento: gerarVendaSalvaDeOrcamento,
    recusarOrcamento: recusarOrcamento,
    verificarAprovacoesNuvem: verificarAprovacoesNuvem
  };

  if(typeof window !== 'undefined'){
    window.ORCAMENTO_APROVACAO_V52255_PURE = ORCAMENTO_APROVACAO_V52255_PURE;
    window.aprovarOrcamentoInterno = gerarVendaSalvaDeOrcamento;

    // Ações Manuais no ERP
    window.aprovarOrcamentoManual = function(id){
      var _db = getDb();
      var o = (_db.orcamentos || []).find(function(x){ return x && x.id === id; });
      if(!o) return;
      if(typeof window.confirmSistema === 'function'){
        window.confirmSistema('Deseja autorizar o orçamento ' + (o.numero || '') + ' e gerar a venda salva no sistema?', 'Autorizar Orçamento').then(function(ok){
          if(!ok) return;
          gerarVendaSalvaDeOrcamento(id, 'atendente_manual');
          // Notifica a API também
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

    // Injeta botões de ação e status na listagem de orçamentos
    if(typeof window.renderOrcamentos === 'function' && !window.renderOrcamentos.__v52255btn){
      var oldR = window.renderOrcamentos;
      window.renderOrcamentos = function(){
        var r = oldR.apply(this, arguments);
        try{
          var view = document.getElementById('view-orcamentos');
          if(view){
            var _db = getDb();
            var list = _db.orcamentos || [];
            view.querySelectorAll('tbody tr').forEach(function(tr){
              var oc = tr.getAttribute('onclick') || '';
              var m = oc.match(/abrirOrcamento\('([^']+)'\)/) || (tr.innerHTML.match(/abrirOrcamento\('([^']+)'\)/));
              var id = m ? m[1] : '';
              if(!id) return;
              var o = list.find(function(x){ return x && x.id === id; });
              if(!o) return;

              var tdAcoes = tr.lastElementChild;
              if(tdAcoes && !tdAcoes.querySelector('.btn-orc-autorizar')){
                var st = txt(o.status).toLowerCase();
                var wrap = document.createElement('div');
                wrap.className = 'flex items-center gap-1 justify-end';

                if(st !== 'aprovado' && st !== 'recusado' && !o.vendaId){
                  var bOk = document.createElement('button');
                  bOk.className = 'btn-orc-autorizar h-7 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm';
                  bOk.title = 'Autorizar Orçamento';
                  bOk.innerHTML = '<i class="ph ph-check-bold"></i> Autorizar';
                  bOk.onclick = function(e){ e.stopPropagation(); window.aprovarOrcamentoManual(o.id); };
                  wrap.appendChild(bOk);

                  var bNo = document.createElement('button');
                  bNo.className = 'btn-orc-recusar h-7 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center gap-1';
                  bNo.title = 'Recusar Orçamento';
                  bNo.innerHTML = '<i class="ph ph-x-bold"></i> Recusar';
                  bNo.onclick = function(e){ e.stopPropagation(); window.recusarOrcamentoManual(o.id); };
                  wrap.appendChild(bNo);
                } else if(st === 'aprovado' || o.vendaId){
                  var bVda = document.createElement('button');
                  bVda.className = 'h-7 px-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px] flex items-center gap-1';
                  bVda.innerHTML = '<i class="ph ph-shopping-bag"></i> Venda ' + (o.vendaNumero || '');
                  bVda.onclick = function(e){
                    e.stopPropagation();
                    if(typeof navigateTo === 'function') navigateTo('vendas');
                  };
                  wrap.appendChild(bVda);
                }

                if(tdAcoes.firstChild){
                  tdAcoes.insertBefore(wrap, tdAcoes.firstChild);
                } else {
                  tdAcoes.appendChild(wrap);
                }
              }
            });
          }
        }catch(e){}
        return r;
      };
      window.renderOrcamentos.__v52255btn = true;
    }

    // Polling contínuo para receber aprovações feitas pelo cliente no Pages / WhatsApp
    setInterval(verificarAprovacoesNuvem, 4000);
    setTimeout(verificarAprovacoesNuvem, 1000);

    // Dispara checagem imediata ao navegar para Orçamentos ou Vendas
    if(typeof window.navigateTo === 'function' && !window.navigateTo.__v52255sync){
      var oldN = window.navigateTo;
      window.navigateTo = function(v){
        var res = oldN.apply(this, arguments);
        if(v === 'orcamentos' || v === 'vendas'){
          setTimeout(verificarAprovacoesNuvem, 100);
        }
        return res;
      };
      window.navigateTo.__v52255sync = true;
    }

    console.log('[DIGICOPY] v' + VERSAO + ': Aprovação de orçamentos com conversão para Venda Salva ativada!');
  }

  if(typeof module !== 'undefined' && module.exports){
    module.exports = { ORCAMENTO_APROVACAO_V52255_PURE: ORCAMENTO_APROVACAO_V52255_PURE };
  }
})();
