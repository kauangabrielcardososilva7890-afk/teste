// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.22.58 — Orçamentos com Ordem de Serviço (OS), Revalidação de Link,
//                  Sincronização Perfeita com Vendas Salvas e Versão v5.22.58
// ═══════════════════════════════════════════════════════════════════════════
(function(){
  'use strict';

  var VERSAO = '5.22.58';
  if(typeof window !== 'undefined'){
    window.DIGICOPY_APP_VERSION = VERSAO;
  }

  var API = 'https://digicopy-sync-api.kauangabrielcardososilva7890.workers.dev';
  var PAGINA_CLIENTE = 'https://digicopy-orcamentos.pages.dev/';

  function txt(v){ return String(v == null ? '' : v).trim(); }
  function n(v){ var x = Number(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : 0; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function money(v){ return (n(v)).toLocaleString('pt-BR', { style:'currency', currency:'BRL' }); }

  function getDb(){
    if(typeof window !== 'undefined' && window.db) return window.db;
    if(typeof db !== 'undefined') return db;
    if(typeof global !== 'undefined' && global.db) return global.db;
    return {};
  }

  function getSess(){
    if(typeof getSession === 'function') return getSession();
    if(typeof window !== 'undefined' && typeof window.getSession === 'function') return window.getSession();
    if(typeof global !== 'undefined' && typeof global.getSession === 'function') return global.getSession();
    return null;
  }

  function tokenNovo(){
    var b = new Uint8Array(18);
    if(typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
    else for(var i = 0; i < 18; i++) b[i] = Math.floor(Math.random() * 256);
    var s = ''; for(var j = 0; j < b.length; j++) s += ('0' + b[j].toString(16)).slice(-2);
    return 'orc_' + s;
  }

  function b64url(obj){
    try{
      var j = JSON.stringify(obj);
      var b = btoa(unescape(encodeURIComponent(j)));
      return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }catch(e){ return ''; }
  }

  function payloadLink(o, cli, emp){
    var res = {
      t: o && o.token || '',
      n: o && o.numero || '',
      c: (cli && (cli.nome || cli.fantasia)) || o && o.clienteNome || '',
      dt: String(o && (o.data || o.criadoEm) || '').slice(0, 10),
      tot: n(o && o.total),
      w: (emp && (emp.whatsapp || emp.telefone)) || o && o.lojaWhatsapp || '',
      it: ((o && o.itens) || []).map(function(it){
        return { d: it.descricao || '', q: it.qtd, p: it.preco, s: it.subtotal };
      })
    };
    if(o && o.os && typeof o.os === 'object'){
      var os = o.os;
      var temOS = Object.keys(os).some(function(k){ return txt(os[k]); });
      if(temOS){
        res.os = {
          m: os.modelo || '',
          s: os.numeroSerie || os.serie || '',
          p: os.patrimonio || '',
          c: os.contador || '',
          t: os.tipoOS || '',
          tec: os.tecnico || '',
          ent: os.responsavelEntrega || '',
          g: os.garantia || '',
          sit: os.situacao || '',
          def: os.defeito || '',
          srv: os.servicos || '',
          pec: os.pecas || '',
          ac: os.acessorios || ''
        };
      }
    }
    return res;
  }

  function linkPublicoOrcamento(o, cli, emp){
    if(!o) return PAGINA_CLIENTE;
    var _db = getDb();
    var c = cli || (_db.clientes || []).find(function(x){ return x && x.id === o.clienteId; }) || {};
    var s = getSess();
    var e = emp || (s && (_db.empresas || []).find(function(x){ return x && x.id === s.empresaId; })) || (_db.config && _db.config.empresa) || {};
    var p = payloadLink(o, c, e);
    var dStr = b64url(p);
    var tok = o.token || '';
    return PAGINA_CLIENTE + '?c=' + encodeURIComponent(tok) + '&d=' + encodeURIComponent(dStr) + '&v=' + VERSAO;
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

  // Gera Venda Salva (status 'aguardar') no ERP e atualiza orçamento
  function gerarVendaSalvaDeOrcamento(orcId, origem){
    var _db = getDb();
    if(!_db.orcamentos) _db.orcamentos = [];
    if(!_db.vendas) _db.vendas = [];
    if(!_db.notificacoes) _db.notificacoes = [];

    var o = _db.orcamentos.find(function(x){ return x && (x.id === orcId || x.token === orcId); });
    if(!o) return null;

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
      os: o.os ? Object.assign({}, o.os) : null,
      criadoPor: s ? s.usuarioId : (o.criadoPor || 'sistema'),
      criadoPorNome: s ? s.usuarioNome : (o.criadoPorNome || 'Cliente (Aprovação)'),
      criadoEm: new Date().toISOString(),
      atendenteNome: s ? s.usuarioNome : (o.criadoPorNome || 'Sistema')
    };

    // Se tiver dados de OS, espelha em db.os
    if(o.os && _db.os){
      var numeroOS = window.proximoNumeroSimples ? window.proximoNumeroSimples('os', _db.os, empId) : ('OS' + vNum);
      var regOS = {
        id: 'os_' + vId,
        empresaId: empId,
        numero: numeroOS,
        vendaId: vId,
        abertura: new Date().toISOString(),
        criadoEm: new Date().toISOString(),
        criadoPor: s ? s.usuarioId : 'sistema',
        criadoPorNome: s ? s.usuarioNome : 'Sistema',
        clienteId: o.clienteId,
        problema: o.os.defeito || o.os.tipoOS || 'OS via orçamento',
        descricao: o.os.servicos || '',
        serie: o.os.numeroSerie || o.os.serie || '',
        numeroSerie: o.os.numeroSerie || o.os.serie || '',
        modelo: o.os.modelo || '',
        equipamentoModelo: o.os.modelo || '',
        patrimonio: o.os.patrimonio || '',
        contador: o.os.contador || '',
        tipoOS: o.os.tipoOS || '',
        tecnico: o.os.tecnico || '',
        tecnicoNome: o.os.tecnico || '',
        responsavelEntrega: o.os.responsavelEntrega || '',
        garantia: o.os.garantia || '',
        pecasTexto: o.os.pecas || '',
        situacaoOS: o.os.situacao || 'Aberta',
        acessorios: o.os.acessorios || '',
        status: 'aberto',
        prioridade: 'normal'
      };
      _db.os.push(regOS);
    }

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

    if(typeof window.lfbAlert === 'function'){
      window.lfbAlert('O orçamento ' + (o.numero || '') + ' foi AUTORIZADO com sucesso e gerou a VENDA SALVA nº ' + novaVenda.numero + '!', 'Orçamento Autorizado');
    } else if(typeof toast === 'function'){
      toast('Orçamento ' + (o.numero || '') + ' autorizado! Venda salva ' + novaVenda.numero + ' gerada.', 'success');
    }

    if(typeof window.renderOrcamentos === 'function') window.renderOrcamentos();
    if(typeof window.renderVendas === 'function') window.renderVendas();

    return novaVenda;
  }

  // Recusa o orçamento mantendo-o visível na lista como "Não autorizado"
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

  // Revalida o link do orçamento, estornando a venda salva se tiver sido criada
  function revalidarLinkOrcamento(orcId, semConfirmacao){
    var _db = getDb();
    if(!_db.orcamentos) return false;
    var o = _db.orcamentos.find(function(x){ return x && (x.id === orcId || x.token === orcId); });
    if(!o) return false;

    // Se já havia gerado venda
    if(o.vendaId){
      var v = (_db.vendas || []).find(function(x){ return x && (x.id === o.vendaId || x.origemOrcamentoId === o.id); });
      if(v && /faturad|finaliz|pago/i.test(v.status || '')){
        if(typeof window !== 'undefined' && typeof window.lfbAlert === 'function'){
          window.lfbAlert('A venda gerada por este orçamento já foi faturada (Venda ' + v.numero + '). Para revalidar o link, primeiro estorne a venda no menu Vendas.', 'Venda Faturada');
        } else if(typeof alert === 'function'){
          alert('A venda já foi faturada. Estorne a venda primeiro.');
        }
        return false;
      }
    }

    function executarRevalidacao(){
      // Remove venda vinculada não faturada
      if(o.vendaId){
        _db.vendas = (_db.vendas || []).filter(function(x){ return x && x.id !== o.vendaId && x.origemOrcamentoId !== o.id; });
        if(_db.os){
          _db.os = (_db.os || []).filter(function(x){ return x && x.vendaId !== o.vendaId; });
        }
      }

      // Gera novo token único
      var tokAntigo = o.token;
      o.token = 'orc_tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      o.status = 'aberto';
      o.vendaId = null;
      o.vendaNumero = null;
      o.aprovadoEm = null;
      o.recusadoEm = null;
      o.aprovadoOrigem = null;

      // Limpa chaves de localStorage locais
      try{
        if(typeof localStorage !== 'undefined'){
          if(tokAntigo){
            localStorage.removeItem('digicopy_orc_usado_' + tokAntigo);
            localStorage.removeItem('digicopy_orc_decisao_' + tokAntigo);
          }
          localStorage.removeItem('digicopy_orc_usado_' + o.token);
          localStorage.removeItem('digicopy_orc_decisao_' + o.token);
        }
      }catch(e){}

      if(typeof saveDB === 'function') saveDB();

      if(typeof window !== 'undefined' && typeof window.lfbAlert === 'function'){
        window.lfbAlert('Link revalidado com sucesso! O orçamento ' + (o.numero || '') + ' voltou para o status ABERTO e está pronto para novo envio ao cliente.', 'Link Revalidado');
      } else if(typeof toast === 'function'){
        toast('Link revalidado! Orçamento voltou para Aberto.', 'success');
      }

      if(typeof window !== 'undefined' && typeof window.renderOrcamentos === 'function') window.renderOrcamentos();
      if(typeof window !== 'undefined' && typeof window.renderVendas === 'function') window.renderVendas();

      // Se a tela do orçamento estiver aberta, recarrega
      if(typeof window !== 'undefined' && window.__ORC_ST && window.__ORC_ST.form && window.__ORC_ST.form.id === o.id){
        window.abrirOrcamento(o.id);
      }
      return true;
    }

    if(semConfirmacao){
      return executarRevalidacao();
    }

    var pergunta = 'Deseja revalidar o link do orçamento ' + (o.numero || '') + '?\n\n'
      + '• O link voltará a ficar ativo (status Aberto);\n'
      + '• Qualquer venda salva gerada por ele será cancelada e removida do sistema;\n'
      + '• O cliente poderá abrir novamente o link e autorizar/recusar.';

    if(typeof window !== 'undefined' && typeof window.confirmSistema === 'function'){
      window.confirmSistema(pergunta, 'Revalidar Link do Orçamento').then(function(ok){
        if(ok) executarRevalidacao();
      });
    } else if(typeof confirm === 'function'){
      if(confirm(pergunta)) executarRevalidacao();
    } else {
      executarRevalidacao();
    }
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

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERFACE — Modal do Orçamento com Aba Itens + Aba Ordem de Serviço
  // ═══════════════════════════════════════════════════════════════════════════

  function setAbaOrcamento(aba){
    var ai = document.getElementById('orc-aba-itens');
    var ao = document.getElementById('orc-aba-os');
    var bi = document.getElementById('orc-tab-itens');
    var bo = document.getElementById('orc-tab-os');
    if(ai) ai.classList.toggle('hidden', aba !== 'itens');
    if(ao) ao.classList.toggle('hidden', aba !== 'os');
    if(bi){
      bi.classList.toggle('border-[#0a1e8a]', aba === 'itens');
      bi.classList.toggle('text-[#0a1e8a]', aba === 'itens');
      bi.classList.toggle('border-transparent', aba !== 'itens');
      bi.classList.toggle('text-slate-500', aba !== 'itens');
    }
    if(bo){
      bo.classList.toggle('border-[#0a1e8a]', aba === 'os');
      bo.classList.toggle('text-[#0a1e8a]', aba === 'os');
      bo.classList.toggle('border-transparent', aba !== 'os');
      bo.classList.toggle('text-slate-500', aba !== 'os');
    }
  }

  function coletarOSOrcamento(){
    var g = function(id){ return txt(document.getElementById(id) && document.getElementById(id).value); };
    return {
      numeroSerie: g('orc-os-serie'),
      modelo: g('orc-os-modelo'),
      tipoOS: g('orc-os-tipo'),
      patrimonio: g('orc-os-patri'),
      contador: g('orc-os-contador'),
      acessorios: g('orc-os-acess'),
      tecnico: g('orc-os-tec'),
      responsavelEntrega: g('orc-os-entrega'),
      garantia: g('orc-os-garantia'),
      situacao: g('orc-os-situacao'),
      defeito: g('orc-os-defeito'),
      servicos: g('orc-os-servicos'),
      pecas: g('orc-os-pecas')
    };
  }

  // Override da abertura do modal de orçamento para injetar abas e suporte a OS
  if(typeof window !== 'undefined'){
    window.setAbaOrcamento = setAbaOrcamento;
    window.revalidarLinkOrcamento = revalidarLinkOrcamento;
    window.aprovarOrcamentoInterno = gerarVendaSalvaDeOrcamento;
    window.recusarOrcamentoInterno = recusarOrcamento;

    // Garante que o link de orçamento use a função atualizada
    if(window.ORCAMENTOS_V52240_PURE){
      window.ORCAMENTOS_V52240_PURE.linkDe = linkPublicoOrcamento;
      window.ORCAMENTOS_V52240_PURE.PAGINA = PAGINA_CLIENTE;
    }
    if(window.ORCAMENTOS_V52238_PURE){
      window.ORCAMENTOS_V52238_PURE.linkOrcamento = linkPublicoOrcamento;
      window.ORCAMENTOS_V52238_PURE.payloadLink = payloadLink;
    }

    // Modal de Orçamento com Abas Itens / Ordem de Serviço
    window.abrirTelaOrcamento = function(existente){
      var s = getSess(); if(!s) return;
      var _db = getDb();
      var agora = new Date();
      var f = {
        id: existente ? existente.id : null,
        codigo: existente ? existente.numero : (window.proximoNumero ? window.proximoNumero(s.empresaId) : String(Date.now().toString(36))),
        data: existente ? (existente.data || '').slice(0, 10) : agora.toISOString().slice(0, 10),
        hora: agora.toTimeString().slice(0, 5),
        cliente: existente && existente.clienteId ? (_db.clientes || []).find(function(c){ return c.id === existente.clienteId; }) : null,
        itens: existente ? (existente.itens || []).map(function(it){ return Object.assign({}, it); }) : [],
        produtoSel: null,
        token: existente && existente.token ? existente.token : tokenNovo(),
        obs: existente ? (existente.observacao || '') : '',
        os: existente && existente.os ? Object.assign({}, existente.os) : {},
        status: existente ? (existente.status || 'aberto') : 'aberto',
        vendaNumero: existente ? (existente.vendaNumero || '') : ''
      };

      if(!window.__ORC_ST) window.__ORC_ST = {};
      window.__ORC_ST.form = f;

      var box = document.getElementById('modal-box');
      if(box) box.className = 'w-full max-w-[1180px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';

      var statusRotulo = f.status === 'aprovado' ? 'Autorizado' : (f.status === 'recusado' ? 'Não autorizado' : 'Aberto');
      var statusBadgeCls = f.status === 'aprovado' ? 'neo-status ok' : (f.status === 'recusado' ? 'neo-status wait' : 'neo-status info');

      document.getElementById('modal-title').innerText = existente ? ('Orçamento ' + f.codigo) : 'Novo orçamento';

      var osData = f.os || {};

      document.getElementById('modal-body').innerHTML =
        '<div class="space-y-3">'
        // Cabeçalho
        +'<div class="grid grid-cols-2 md:grid-cols-5 gap-2">'
        +'<div class="rounded-xl bg-[#0a1e8a] text-white p-3"><p class="text-[10px] uppercase font-bold text-white/70">Código</p><p class="font-bold text-[15px]" id="orc-codigo">'+esc(f.codigo)+'</p></div>'
        +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Data</p><p class="font-bold">'+esc(f.data.split('-').reverse().join('/'))+'</p></div>'
        +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Hora</p><p class="font-bold">'+esc(f.hora)+'</p></div>'
        +'<div class="rounded-xl border p-3"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Vendedor</p><p class="font-bold">'+esc(s.usuarioNome)+'</p></div>'
        +'<div class="rounded-xl border p-3 flex flex-col justify-center"><p class="text-[10px] uppercase font-bold text-[#0a1e8a]">Status</p><p><span class="'+statusBadgeCls+'">'+esc(statusRotulo)+'</span></p></div>'
        +'</div>'

        // Linha de busca de cliente
        +'<div class="rounded-[14px] border-2 border-[#0a1e8a]/20 bg-[#f8f9ff] p-3">'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Cliente *</label>'
        +'<div class="flex flex-wrap items-center gap-2 mt-1">'
        +'<select id="orc-cli-campo" class="h-[44px] px-2 rounded-xl border bg-white text-[12px] min-w-[155px] shrink-0">'
        +'<option value="todos">Pesquisar em tudo</option>'
        +'<option value="nome">Nome</option>'
        +'<option value="fantasia">Fantasia</option>'
        +'<option value="codigo">Código</option>'
        +'<option value="documento">CPF/CNPJ</option>'
        +'<option value="rgIE">RG/IE</option>'
        +'<option value="endereco">Endereço</option>'
        +'<option value="telefone">Telefone</option>'
        +'<option value="whatsapp">WhatsApp</option>'
        +'<option value="cidade">Cidade</option>'
        +'<option value="bairro">Bairro</option>'
        +'<option value="contato">Contato</option>'
        +'<option value="email">E-mail</option>'
        +'<option value="observacao">Observação</option>'
        +'<option value="cep">CEP</option>'
        +'<option value="estado">UF</option>'
        +'</select>'
        +'<input id="orc-cli-search" placeholder="Busque o cliente (Enter ou lupa)" class="flex-1 min-w-[200px] h-[44px] px-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white text-[13px]">'
        +'<button type="button" onclick="window.orcBuscarCliente()" class="h-[44px] px-4 rounded-xl bg-[#0a1e8a] text-white shrink-0"><i class="ph ph-magnifying-glass"></i></button>'
        +'</div>'
        +'<div id="orc-cli-results" class="hidden mt-1 max-h-[220px] overflow-auto rounded-xl border bg-white shadow-xl text-[12.5px]"></div>'
        +'<div id="orc-cli-sel" class="'+(f.cliente ? '' : 'hidden')+' mt-2 rounded-xl bg-white border p-3 flex justify-between">'
        +'<div><p class="font-bold" id="orc-cli-nome">'+(f.cliente ? esc((f.cliente.codigo ? '#' + f.cliente.codigo + ' — ' : '') + (f.cliente.nome || '')) : '')+'</p></div>'
        +'<button type="button" onclick="window.orcLimparCliente()" class="w-8 h-8 rounded-lg bg-red-50 text-red-600"><i class="ph ph-x"></i></button></div>'
        +'</div>'

        // Barra de Abas (Itens / Ordem de Serviço)
        +'<div class="flex border-b border-slate-200">'
        +'<button id="orc-tab-itens" type="button" onclick="window.setAbaOrcamento(\'itens\')" class="px-5 py-2 text-[13px] font-bold border-b-2 border-[#0a1e8a] text-[#0a1e8a]"><i class="ph ph-shopping-cart"></i> Itens</button>'
        +'<button id="orc-tab-os" type="button" onclick="window.setAbaOrcamento(\'os\')" class="px-5 py-2 text-[13px] font-bold border-b-2 border-transparent text-slate-500"><i class="ph ph-wrench"></i> Ordem de Serviço (Opcional)</button>'
        +'</div>'

        // ABA 1: ITENS
        +'<div id="orc-aba-itens" class="space-y-3">'
        +'<div class="rounded-[14px] border bg-[#f8f9ff] p-3 space-y-2">'
        +'<div class="grid grid-cols-12 gap-2 items-end">'
        +'<label class="col-span-12 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">Tipo<select id="orc-item-tipo" onchange="window.orcOnTipoItem && window.orcOnTipoItem()" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12px]"><option value="Produto">Produto</option><option value="Recarga de toner">Recarga de toner</option></select></label>'
        +'<div class="col-span-12 md:col-span-5 relative">'
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Filtro e Descrição</label>'
        +'<div class="flex items-center gap-1 mt-1">'
        +'<select id="orc-prod-cat" class="h-[40px] px-2 rounded-xl border bg-white text-[12px] min-w-[145px] shrink-0">'
        +'<option value="">Todas categorias</option>'
        +'<option value="Produto">Produto</option>'
        +'<option value="Serviço">Serviço</option>'
        +'<option value="Cartucho">Cartucho</option>'
        +'<option value="Cartucho Vazio">Cartucho Vazio</option>'
        +'<option value="Insumo">Insumo</option>'
        +'<option value="Equipamento">Equipamento</option>'
        +'<option value="Impressoras">Impressoras</option>'
        +'<option value="Chip">Chip</option>'
        +'<option value="Compatível">Compatível</option>'
        +'<option value="Informática">Informática</option>'
        +'<option value="Original">Original</option>'
        +'<option value="Outros">Outros</option>'
        +'</select>'
        +'<select id="orc-rec-campo" class="hidden h-[40px] px-2 rounded-xl border bg-white text-[12px] min-w-[145px] shrink-0">'
        +'<option value="todos">Pesquisar recarga</option>'
        +'<option value="codigo">Código</option>'
        +'<option value="nome">Descrição</option>'
        +'<option value="marca">Marca</option>'
        +'</select>'
        +'<input id="orc-prod-search" placeholder="Digite para buscar ou escreva a descrição..." class="flex-1 min-w-[160px] h-[40px] px-3 rounded-xl border bg-white text-[12.5px]">'
        +'<button id="orc-prod-lupa" type="button" onclick="window.orcBuscarProd()" class="h-[40px] px-3.5 rounded-xl bg-[#0a1e8a] text-white shrink-0" title="Buscar"><i class="ph ph-magnifying-glass"></i></button>'
        +'</div>'
        +'<div id="orc-prod-results" class="hidden absolute z-30 left-0 right-0 top-full mt-1 max-h-[200px] overflow-auto rounded-xl border bg-white shadow-xl text-[12px]"></div>'
        +'</div>'
        +'<label class="col-span-4 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">QTD<input id="orc-item-qtd" type="number" min="1" value="1" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-center"></label>'
        +'<label class="col-span-4 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">V. UNIT<input id="orc-item-vunit" type="number" step="0.01" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white"></label>'
        +'<label class="col-span-4 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">DESC R$<input id="orc-item-desc" type="number" step="0.01" value="0" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-center"></label>'
        +'<label class="col-span-12 md:col-span-1 text-[11px] font-bold uppercase text-[#0a1e8a]">TOTAL<input id="orc-item-total" readonly class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-slate-100 font-bold text-center"></label>'
        +'</div>'
        +'<div id="orc-item-extra" class="hidden border-t border-[#0a1e8a]/10 pt-2 grid grid-cols-12 gap-2 items-end">'
        +'<label class="col-span-12 md:col-span-5 text-[11px] font-bold uppercase text-[#0a1e8a]">Etiqueta da recarga'
        +'<div class="flex gap-1 mt-1">'
        +'<input id="orc-item-cartucho" placeholder="Nº da etiqueta — se não achar, escreve e segue" class="flex-1 h-[38px] px-3 rounded-xl border bg-white text-[12px]">'
        +'<button id="orc-etq-lupa" type="button" onclick="window.orcBuscarEtiqueta && window.orcBuscarEtiqueta()" class="h-[38px] px-3 rounded-xl bg-[#0a1e8a] text-white shrink-0" title="Buscar etiqueta"><i class="ph ph-magnifying-glass"></i></button>'
        +'</div></label>'
        +'</div>'
        +'<div class="flex justify-end pt-1"><button type="button" onclick="window.orcAddItem()" class="h-[40px] px-5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-1.5"><i class="ph ph-plus-circle"></i> Adicionar item</button></div>'
        +'</div>'
        +'<div class="rounded-[14px] border overflow-hidden bg-white"><table class="w-full text-left text-[12px]">'
        +'<thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-[#0a1e8a]"><tr><th class="px-3 py-2">Tipo</th><th class="px-3 py-2">Descrição</th><th class="px-3 py-2">Qtd</th><th class="px-3 py-2">V.Unit</th><th class="px-3 py-2">Desc</th><th class="px-3 py-2">Total</th><th></th></tr></thead>'
        +'<tbody id="orc-itens-body" class="divide-y"></tbody></table></div>'
        +'</div>'

        // ABA 2: ORDEM DE SERVIÇO (OS) - Inicia vazia, sem nada obrigatório, sem busca inteligente
        +'<div id="orc-aba-os" class="hidden space-y-3">'
        +'<div class="rounded-[14px] border bg-[#f8f9ff] p-3 grid grid-cols-12 gap-2">'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Número de série'
        +'<input id="orc-os-serie" value="'+esc(osData.numeroSerie || osData.serie || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-4 text-[11px] font-bold uppercase text-[#0a1e8a]">Modelo do equipamento'
        +'<input id="orc-os-modelo" value="'+esc(osData.modelo || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Tipo da OS'
        +'<input id="orc-os-tipo" value="'+esc(osData.tipoOS || '')+'" placeholder="Ex: Manutenção, Instalação..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">Patrimônio'
        +'<input id="orc-os-patri" value="'+esc(osData.patrimonio || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-[#0a1e8a]">Contador / cópias'
        +'<input id="orc-os-contador" value="'+esc(osData.contador || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-12 md:col-span-4 text-[11px] font-bold uppercase text-[#0a1e8a]">Acessórios'
        +'<input id="orc-os-acess" value="'+esc(osData.acessorios || '')+'" placeholder="cabos, bandeja, etc..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Técnico responsável'
        +'<input id="orc-os-tec" value="'+esc(osData.tecnico || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Responsável entrega'
        +'<input id="orc-os-entrega" value="'+esc(osData.responsavelEntrega || '')+'" placeholder="Opcional..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Garantia'
        +'<input id="orc-os-garantia" value="'+esc(osData.garantia || '')+'" placeholder="Ex: 30 dias, 90 dias..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-[#0a1e8a]">Situação da OS'
        +'<input id="orc-os-situacao" value="'+esc(osData.situacao || '')+'" placeholder="Ex: Aberta, Em orçamento..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>'
        +'<label class="col-span-12 text-[11px] font-bold uppercase text-[#0a1e8a]">Defeito apresentado'
        +'<textarea id="orc-os-defeito" placeholder="O que o cliente relatou..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.defeito || '')+'</textarea></label>'
        +'<label class="col-span-12 md:col-span-6 text-[11px] font-bold uppercase text-[#0a1e8a]">Serviços executados / previstos'
        +'<textarea id="orc-os-servicos" placeholder="Serviços a executar..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.servicos || '')+'</textarea></label>'
        +'<label class="col-span-12 md:col-span-6 text-[11px] font-bold uppercase text-[#0a1e8a]">Peças utilizadas / orçadas'
        +'<textarea id="orc-os-pecas" placeholder="Peças necessárias..." class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]">'+esc(osData.pecas || '')+'</textarea></label>'
        +'</div>'
        +'</div>'

        // Observações e Total
        +'<label class="text-[11px] font-bold uppercase text-[#0a1e8a] block">Observações do Orçamento<textarea id="orc-obs" class="mt-1 w-full h-[52px] p-2 rounded-xl border">'+esc(f.obs)+'</textarea></label>'
        +'<div class="rounded-[14px] bg-[#0a1e8a] text-white p-3 flex justify-between items-center"><span class="font-bold">TOTAL DO ORÇAMENTO</span><b id="orc-total" class="text-[18px]">R$ 0,00</b></div>'
        +'</div>';

      var linkCliente = existente ? linkPublicoOrcamento(existente, f.cliente) : '';

      document.getElementById('modal-footer').innerHTML =
        '<button onclick="closeModal()" class="h-[46px] px-5 rounded-xl bg-white border text-red-600 font-bold">Sair</button>'
        +(existente ? '<button type="button" onclick="window.revalidarLinkOrcamento(\''+existente.id+'\')" class="h-[46px] px-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold flex items-center gap-1.5" title="Reativa o link e cancela a venda se já tiver sido gerada"><i class="ph ph-arrows-counter-clockwise"></i> Revalidar link</button>' : '')
        +(existente ? '<button type="button" onclick="window.imprimirOrcamento(\''+existente.id+'\')" class="h-[46px] px-5 rounded-xl bg-white border font-bold"><i class="ph ph-printer"></i> Imprimir</button>' : '')
        +'<button type="button" onclick="window.salvarOrcamentoTela()" class="h-[46px] px-6 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-floppy-disk"></i> Salvar</button>';

      document.getElementById('modal-root').classList.remove('hidden');
      window.modalContext = { type: 'orcamento' };
      if(typeof window.orcRenderItens === 'function') window.orcRenderItens();

      var cli = document.getElementById('orc-cli-search');
      if(cli) cli.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.orcBuscarCliente(); } };
      var pr = document.getElementById('orc-prod-search');
      if(pr) pr.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.orcBuscarProd(); } };
      ['orc-item-qtd', 'orc-item-vunit', 'orc-item-desc'].forEach(function(id){
        var el = document.getElementById(id); if(el) el.oninput = window.orcCalcItem;
      });
    };

    // Override do salvar orçamento para incluir os dados da OS
    window.salvarOrcamentoTela = function(){
      var s = getSess();
      var f = window.__ORC_ST && window.__ORC_ST.form;
      if(!s || !f) return;
      if(!f.cliente){
        if(window.lfbAlert) window.lfbAlert('Escolha o cliente para o orçamento.', 'Orçamento');
        else toast('Escolha o cliente', 'error');
        return;
      }
      var _db = getDb();
      if(!_db.orcamentos) _db.orcamentos = [];
      var tot = (f.itens || []).reduce(function(sum, it){ return sum + (it.subtotal || 0); }, 0);
      var o = f.id ? _db.orcamentos.find(function(x){ return x && x.id === f.id; }) : null;
      var isNovo = !o;

      if(!o){
        o = {
          id: 'orc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
          empresaId: s.empresaId,
          numero: f.codigo,
          token: f.token || tokenNovo(),
          criadoEm: new Date().toISOString(),
          criadoPor: s.usuarioId,
          criadoPorNome: s.usuarioNome,
          status: 'aberto'
        };
        _db.orcamentos.push(o);
        f.id = o.id;
      }

      var osColetada = coletarOSOrcamento();

      Object.assign(o, {
        clienteId: f.cliente.id,
        clienteNome: f.cliente.nome || f.cliente.fantasia || '',
        data: f.data,
        itens: (f.itens || []).map(function(it){ return Object.assign({}, it); }),
        total: tot,
        observacao: txt(document.getElementById('orc-obs') && document.getElementById('orc-obs').value),
        token: o.token || f.token || tokenNovo(),
        os: osColetada,
        status: o.status || 'aberto',
        atualizadoEm: new Date().toISOString()
      });

      if(typeof saveDB === 'function') saveDB();
      if(typeof toast === 'function') toast('Orçamento ' + o.numero + ' salvo!', 'success');
      if(typeof window.lfbAlert === 'function') window.lfbAlert('Orçamento ' + o.numero + ' salvo com sucesso.', 'Salvo');

      window.__ORC_ST.form.id = o.id;
      if(typeof window.renderOrcamentos === 'function') window.renderOrcamentos();
      window.abrirOrcamento(o.id);
    };

    // Renderizador de listagem de Orçamentos garantindo que NUNCA suma e exiba o status correto
    window.renderOrcamentos = function(){
      var s = getSess(); if(!s) return;
      var _db = getDb();
      garantirTokensOrcamentos();
      var view = typeof ensureView === 'function' ? ensureView('orcamentos') : document.getElementById('view-orcamentos');
      if(!view) return;

      var campo = (document.getElementById('orc-filtro-campo') || {}).value || (window.__ORC_ST && window.__ORC_ST.campo) || 'todos';
      var q = (document.getElementById('orc-busca') || {}).value || (window.__ORC_ST && window.__ORC_ST.q) || '';
      if(!window.__ORC_ST) window.__ORC_ST = {};
      window.__ORC_ST.campo = campo;
      window.__ORC_ST.q = q;

      var base = (_db.orcamentos || []).filter(function(o){
        return o && (!s.empresaId || o.empresaId === s.empresaId) && o.status !== 'excluido';
      });

      var termo = txt(q).toLowerCase();
      var list = base.filter(function(o){
        var cl = (_db.clientes || []).find(function(c){ return c && c.id === o.clienteId; }) || {};
        var st = txt(o.status).toLowerCase();
        if(campo === 'fechados') return st === 'aprovado' || o.vendaId;
        if(campo === 'nao_fechados') return st !== 'aprovado' && !o.vendaId && st !== 'estornado';
        if(campo === 'cod_orc') return !termo || String(o.numero || '').toLowerCase().includes(termo);
        if(campo === 'cliente') return !termo || String(cl.nome || '').toLowerCase().includes(termo) || String(cl.fantasia || '').toLowerCase().includes(termo);
        if(!termo) return true;
        return String(o.numero || '').toLowerCase().includes(termo)
          || String(cl.nome || '').toLowerCase().includes(termo)
          || String(o.criadoPorNome || '').toLowerCase().includes(termo);
      }).sort(function(a, b){
        var na = parseInt(String(a.numero || '').replace(/\D/g, ''), 10) || 0;
        var nb = parseInt(String(b.numero || '').replace(/\D/g, ''), 10) || 0;
        return nb - na;
      });

      view.innerHTML = '<div class="neo-shell"><div class="neo-panel neo-float-in">'
        +'<div class="neo-head"><div><h3>Orçamentos</h3><p>Propostas ao cliente com aprovação online e ordem de serviço</p></div>'
        +'<div class="neo-actions">'
        +'<button onclick="window.novoOrcamento()" class="neo-btn primary"><i class="ph ph-plus"></i>Novo</button>'
        +'<button onclick="window.estornarOrcamentosMarcados()" class="neo-btn"><i class="ph ph-arrow-counter-clockwise"></i>Estornar</button>'
        +'<button onclick="window.excluirOrcamentosMarcados()" class="neo-btn danger"><i class="ph ph-trash"></i>Excluir</button>'
        +'</div></div>'
        +'<div class="p-4 border-b bg-white flex flex-wrap items-center gap-2">'
        +'<button type="button" onclick="window.orcMostrarTodos()" class="neo-btn '+(campo === 'todos' ? 'primary' : '')+'">Todos</button>'
        +'<select id="orc-filtro-campo" class="h-10 px-3 rounded-xl border bg-white text-[13px] min-w-[180px]">'
        +'<option value="todos"'+(campo === 'todos' ? ' selected' : '')+'>Todos</option>'
        +'<option value="nao_fechados"'+(campo === 'nao_fechados' ? ' selected' : '')+'>Abertos (Não fechados)</option>'
        +'<option value="fechados"'+(campo === 'fechados' ? ' selected' : '')+'>Autorizados (Fechados)</option>'
        +'<option value="cod_orc"'+(campo === 'cod_orc' ? ' selected' : '')+'>Cód. Orçamento</option>'
        +'<option value="cliente"'+(campo === 'cliente' ? ' selected' : '')+'>Cliente</option>'
        +'</select>'
        +'<input id="orc-busca" value="'+esc(q)+'" placeholder="Buscar… (Enter ou lupa)" class="neo-input flex-1 min-w-[200px]">'
        +'<button type="button" onclick="window.orcBuscar()" class="h-10 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i></button>'
        +'<span class="text-[12px] text-slate-500">'+list.length+' registro(s)</span>'
        +'</div>'
        +'<div class="overflow-auto max-h-[calc(100vh-320px)]"><table class="neo-table"><thead><tr>'
        +'<th class="w-8"><input type="checkbox" onclick="document.querySelectorAll(\'input[name=orc-check]\').forEach(function(c){c.checked=this.checked}.bind(this))"></th>'
        +'<th>Código</th><th>Data</th><th>Cliente</th><th>Valor total</th><th>Status</th><th>Ações</th></tr></thead><tbody>'
        +(list.map(function(o){
          var cl = (_db.clientes || []).find(function(c){ return c && c.id === o.clienteId; }) || {};
          var st = txt(o.status).toLowerCase();
          var rotulo = (st === 'aprovado' || o.vendaId) ? 'Autorizado' : (st === 'recusado' ? 'Não autorizado' : (st === 'estornado' ? 'Estornado' : 'Aberto'));
          var badgeCls = (st === 'aprovado' || o.vendaId) ? 'neo-status ok' : (st === 'recusado' ? 'neo-status wait' : (st === 'estornado' ? 'neo-status info' : 'neo-status info'));
          var temOS = o.os && Object.keys(o.os).some(function(k){ return txt(o.os[k]); });

          return '<tr onclick="window.neoOrcSel=\''+o.id+'\';window.abrirOrcamento(\''+o.id+'\')" class="cursor-pointer">'
            +'<td class="px-2"><input type="checkbox" name="orc-check" value="'+o.id+'" onclick="event.stopPropagation()"></td>'
            +'<td><b class="text-[#0a1e8a]">'+esc(o.numero || '')+'</b>'+(temOS ? ' <span class="text-[10px]" title="Contém Ordem de Serviço">🔧 OS</span>' : '')+'</td>'
            +'<td>'+(o.data ? o.data.slice(0, 10).split('-').reverse().join('/') : '-')+'</td>'
            +'<td><b>'+esc(cl.nome || o.clienteNome || '(sem cliente)')+'</b></td>'
            +'<td><b>'+money(o.total)+'</b></td>'
            +'<td><span class="'+badgeCls+'">'+esc(rotulo)+'</span></td>'
            +'<td><div class="flex items-center gap-1.5" onclick="event.stopPropagation()">'
            +'<button onclick="window.abrirOrcamento(\''+o.id+'\')" class="neo-btn !px-2" title="Abrir Orçamento"><i class="ph ph-eye"></i></button>'
            +'<button onclick="window.revalidarLinkOrcamento(\''+o.id+'\')" class="neo-btn !px-2 text-amber-700" title="Revalidar Link"><i class="ph ph-arrows-counter-clockwise"></i></button>'
            +'</div></td>'
            +'</tr>';
        }).join('') || '<tr><td colspan="7" class="text-center text-slate-400 py-12">Nenhum orçamento encontrado</td></tr>')
        +'</tbody></table></div></div></div>';

      var inp = document.getElementById('orc-busca');
      if(inp) inp.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.orcBuscar(); } };
      var sel = document.getElementById('orc-filtro-campo');
      if(sel) sel.onchange = function(){
        window.__ORC_ST.campo = sel.value;
        window.renderOrcamentos();
      };
    };

    window.orcMostrarTodos = function(){
      if(!window.__ORC_ST) window.__ORC_ST = {};
      window.__ORC_ST.campo = 'todos';
      window.__ORC_ST.q = '';
      window.renderOrcamentos();
    };

    // Sincronização central e infalível de versão em toda a interface
    function sincronizarVersaoVisual(){
      try{
        if(typeof document === 'undefined') return;
        var fv = document.getElementById('footer-version');
        if(fv && fv.textContent !== 'v' + VERSAO) fv.textContent = 'v' + VERSAO;
        var tv = document.getElementById('app-title-version');
        if(tv && tv.textContent !== 'Sistema Digicopy v' + VERSAO) tv.textContent = 'Sistema Digicopy v' + VERSAO;
        if(document.title && !document.title.includes(VERSAO)){
          document.title = 'Sistema Digicopy v' + VERSAO;
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
    setInterval(verificarAprovacoesNuvem, 3000);
    setTimeout(verificarAprovacoesNuvem, 1000);

    // Dispara checagem imediata e sincronização de versão ao navegar para qualquer menu
    if(typeof window.navigateTo === 'function' && !window.navigateTo.__v52258sync){
      var oldN = window.navigateTo;
      window.navigateTo = function(v){
        var res = oldN.apply(this, arguments);
        try{ sincronizarVersaoVisual(); }catch(e){}
        if(v === 'orcamentos' || v === 'vendas'){
          setTimeout(verificarAprovacoesNuvem, 100);
        }
        return res;
      };
      window.navigateTo.__v52258sync = true;
    }

    console.log('[DIGICOPY] v' + VERSAO + ': Orçamentos com OS, Revalidação de Link e Venda Salva ativados!');
  }

  var PURE_V52258 = {
    VERSAO: VERSAO,
    payloadLink: payloadLink,
    linkPublicoOrcamento: linkPublicoOrcamento,
    gerarVendaSalvaDeOrcamento: gerarVendaSalvaDeOrcamento,
    recusarOrcamento: recusarOrcamento,
    revalidarLinkOrcamento: revalidarLinkOrcamento,
    b64url: b64url
  };

  if(typeof module !== 'undefined' && module.exports){
    module.exports = { PURE_V52258: PURE_V52258 };
  }
})();
