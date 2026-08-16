// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.20.23 — excluir com MULTI-SELEÇÃO em Clientes e Financeiro
//                  + "contas a pagar" DELETADO do sistema
//
// • 1 — CLIENTES: caixinha por linha + "marcar todos" + botão único "Excluir"
//       (mesmo padrão de produtos / contratos / vendas). DELETA de verdade
//       (não inativa) e BLOQUEIA quem tem movimentação (contrato, notinha,
//       chamado, leitura, parque ou título no financeiro), dizendo o porquê.
//       Nada do que já existia na tela foi removido (busca por campo, Todos,
//       filtro de status, ordenação por coluna, importar, duplo clique, lápis).
//
// • 2 — FINANCEIRO: caixinha por linha + "marcar todos" + botão único
//       "Excluir". DELETA o título de verdade de db.contasReceber.
//
// • 3 — FINANCEIRO: a função de PAGAR foi DELETADA (não ocultada) direto no
//       código: botão "Pagar", modal (renderModalContaPagar/saveCP), baixarCP,
//       rota 'contaPagar' do openModal, card "A pagar", coluna "Tipo", as
//       linhas de contas a pagar e o filtro "Receber + Pagar / Só a receber /
//       Só a pagar" saíram de app.js e notinha_patch.js. Os cards agora são
//       A receber / Em aberto / Já recebido. Status e ordenação continuam.
//
// Este arquivo guarda a REGRA de exclusão (pura + testável) e as duas funções
// chamadas pelos botões. As tabelas/botões estão nos próprios templates.
// Regra do projeto: nada de confirm() nativo — usa confirmSistema / lfbAlert.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

// ─────────────────────────────────────────────────────────────────────────
// Núcleo puro (sem DOM) — usado pelos testes
// ─────────────────────────────────────────────────────────────────────────

// Lista os vínculos de um cliente. Array vazio = pode excluir.
function vinculosDoCliente(db, clienteId){
  var achados = [];
  var mapa = [
    { rotulo: 'contrato(s)',              lista: db.contratos,     ok: function(x){ return x.clienteId === clienteId && x.status !== 'excluido'; } },
    { rotulo: 'notinha(s)',               lista: db.vendas,        ok: function(x){ return x.clienteId === clienteId; } },
    { rotulo: 'chamado(s)',               lista: db.os,            ok: function(x){ return x.clienteId === clienteId; } },
    { rotulo: 'leitura(s)',               lista: db.leituras,      ok: function(x){ return x.clienteId === clienteId; } },
    { rotulo: 'impressora(s) no parque',  lista: db.parque,        ok: function(x){ return x.clienteId === clienteId; } },
    { rotulo: 'título(s) no financeiro',  lista: db.contasReceber, ok: function(x){ return x.clienteId === clienteId; } }
  ];
  for(var i = 0; i < mapa.length; i++){
    var lista = mapa[i].lista;
    if(!Array.isArray(lista)) continue;
    var n = 0;
    for(var j = 0; j < lista.length; j++){ if(mapa[i].ok(lista[j])) n++; }
    if(n > 0) achados.push(n + ' ' + mapa[i].rotulo);
  }
  return achados;
}

// Separa os ids marcados em "pode excluir" e "bloqueado (tem vínculo)".
function planejarExclusaoClientes(db, ids){
  var libera = [], bloqueia = [];
  var clientes = db.clientes || [];
  for(var i = 0; i < ids.length; i++){
    var c = null;
    for(var j = 0; j < clientes.length; j++){ if(clientes[j].id === ids[i]){ c = clientes[j]; break; } }
    if(!c) continue;
    var v = vinculosDoCliente(db, c.id);
    if(v.length) bloqueia.push({ cliente: c, vinculos: v });
    else libera.push(c);
  }
  return { libera: libera, bloqueia: bloqueia };
}

// Remove de fato do array (deleta, não inativa).
function removerClientes(db, ids){
  var antes = (db.clientes || []).length;
  db.clientes = (db.clientes || []).filter(function(c){ return ids.indexOf(c.id) === -1; });
  return antes - db.clientes.length;
}
function removerTitulos(db, ids){
  var antes = (db.contasReceber || []).length;
  db.contasReceber = (db.contasReceber || []).filter(function(c){ return ids.indexOf(c.id) === -1; });
  return antes - db.contasReceber.length;
}

function textoBloqueio(bloqueados){
  var linhas = bloqueados.slice(0, 8).map(function(b){
    return '• ' + (b.cliente.nome || b.cliente.id) + ' — ' + b.vinculos.join(', ');
  });
  var extra = bloqueados.length > 8 ? '\n(e mais ' + (bloqueados.length - 8) + ')' : '';
  return 'Estes clientes NÃO podem ser excluídos porque têm movimentação no sistema:\n\n' + linhas.join('\n') + extra;
}

var PURO = {
  vinculosDoCliente: vinculosDoCliente,
  planejarExclusaoClientes: planejarExclusaoClientes,
  removerClientes: removerClientes,
  removerTitulos: removerTitulos,
  textoBloqueio: textoBloqueio
};

if(typeof module !== 'undefined' && module.exports) module.exports = PURO;
if(typeof window === 'undefined' || typeof document === 'undefined') return;
window.AJUSTES_V52023_PURE = PURO;

// ─────────────────────────────────────────────────────────────────────────
// Ligação com a tela (padrão do sistema)
// ─────────────────────────────────────────────────────────────────────────
function avisar(m, t){
  if(typeof window.lfbAlert === 'function') return window.lfbAlert(m, t || 'Aviso');
  if(typeof toast === 'function') return toast(m, 'info');
}
function confirmar(m, t){
  if(typeof window.confirmSistema === 'function') return window.confirmSistema(m, t || 'Confirmar');
  return Promise.resolve(false);
}
function marcados(nome){
  return Array.prototype.slice.call(document.querySelectorAll('input[name="' + nome + '"]:checked'))
    .map(function(ch){ return ch.value; })
    .filter(Boolean);
}
function logar(entidade, acao, id, detalhe){
  if(typeof logAction === 'function'){ try{ logAction(entidade, acao, id, detalhe); }catch(e){} }
}

// ═════════════════════════════════════════════════════════════════════════
// 1) CLIENTES — excluir os marcados
// ═════════════════════════════════════════════════════════════════════════
window.excluirClientesUnificado = function(){
  if(typeof db === 'undefined') return;
  var ids = marcados('cliente-check-lote');
  if(!ids.length){ avisar('Marque os clientes na tabela para excluir.', 'Excluir Clientes'); return; }

  var plano = planejarExclusaoClientes(db, ids);

  if(!plano.libera.length){ avisar(textoBloqueio(plano.bloqueia), 'Excluir Clientes'); return; }

  var msg = 'Deseja EXCLUIR ' + plano.libera.length + ' cliente(s)? Apaga de vez (não é ocultar).';
  if(plano.bloqueia.length){
    msg += '\n\nObs.: ' + plano.bloqueia.length + ' cliente(s) serão IGNORADOS por terem movimentação (contrato, notinha, chamado, leitura ou financeiro).';
  }

  confirmar(msg, 'Excluir Clientes').then(function(ok){
    if(!ok) return;
    var alvos = plano.libera;
    var ids2 = alvos.map(function(c){ return c.id; });
    var nomes = alvos.map(function(c){ return c.nome || c.id; });
    var qtd = removerClientes(db, ids2);
    ids2.forEach(function(id, i){ logar('cliente', 'excluir', id, 'Excluído cliente ' + nomes[i]); });
    if(typeof saveDB === 'function') saveDB();      // salva + propaga no sync
    if(typeof renderClientes === 'function') renderClientes();
    if(typeof renderAuditoria === 'function') renderAuditoria();
    if(typeof toast === 'function') toast(qtd + ' cliente(s) excluído(s)', 'success');
    if(plano.bloqueia.length){
      setTimeout(function(){ avisar(textoBloqueio(plano.bloqueia), 'Clientes não excluídos'); }, 350);
    }
  });
};

// ═════════════════════════════════════════════════════════════════════════
// 2) FINANCEIRO — excluir os títulos marcados
// ═════════════════════════════════════════════════════════════════════════
window.excluirTitulosUnificado = function(){
  if(typeof db === 'undefined') return;
  var ids = marcados('fin-check-lote');
  if(!ids.length){ avisar('Marque os lançamentos na tabela para excluir.', 'Excluir Lançamentos'); return; }

  var alvos = (db.contasReceber || []).filter(function(c){ return ids.indexOf(c.id) !== -1; });
  if(!alvos.length){ avisar('Nenhum lançamento válido selecionado.', 'Excluir Lançamentos'); return; }

  confirmar('Deseja EXCLUIR ' + alvos.length + ' lançamento(s) do financeiro? Apaga de vez.', 'Excluir Lançamentos').then(function(ok){
    if(!ok) return;
    var ids2 = alvos.map(function(c){ return c.id; });
    var descr = alvos.map(function(c){ return c.descricao || c.id; });
    var qtd = removerTitulos(db, ids2);
    ids2.forEach(function(id, i){ logar('financeiro', 'excluir_receber', id, 'Excluído título ' + descr[i]); });
    if(typeof saveDB === 'function') saveDB();
    if(typeof renderFinanceiro === 'function') renderFinanceiro();
    if(typeof renderAuditoria === 'function') renderAuditoria();
    if(typeof toast === 'function') toast(qtd + ' lançamento(s) excluído(s)', 'success');
  });
};

// ═════════════════════════════════════════════════════════════════════════
// 3) Rede de segurança do "contas a pagar" removido
//    O código foi apagado dos arquivos; isto só evita erro caso algum patch
//    antigo (ou uma tela em cache) ainda tente chamar o que não existe mais.
// ═════════════════════════════════════════════════════════════════════════
function removido(){
  avisar('Contas a pagar foi removido do sistema. O Financeiro trabalha só com contas a receber.', 'Recurso removido');
  if(typeof closeModal === 'function') closeModal();
}
if(typeof window.renderModalContaPagar !== 'function') window.renderModalContaPagar = removido;
if(typeof window.saveCP !== 'function') window.saveCP = removido;
if(typeof window.baixarCP !== 'function') window.baixarCP = function(){ removido(); };

var _openModalAntigo = window.openModal;
if(typeof _openModalAntigo === 'function' && !_openModalAntigo.__semContaPagar){
  var novoOpenModal = function(type){
    if(type === 'contaPagar'){ removido(); return; }
    return _openModalAntigo.apply(this, arguments);
  };
  novoOpenModal.__semContaPagar = true;
  window.openModal = novoOpenModal;
}

console.log('[DIGICOPY] ajustes_v52023_patch.js v5.20.23 carregado');
})();
