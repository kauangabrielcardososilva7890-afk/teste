// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.21.3 — Duplo clique abre o registro em todas as grades
// • Pedido do usuário: duplo clique numa linha abre o cadastro/detalhe dela.
// • Funciona em qualquer tabela do sistema: o duplo clique aciona o mesmo
//   botão de abrir/editar que já existe na linha (lápis, olho, histórico).
// • Segurança: NUNCA aciona botão de excluir, baixar, pagar, estornar ou
//   faturar. Linhas que já têm duplo clique próprio continuam iguais.
// • Telas com lógica própria de duplo clique (Vendas) não são alteradas.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

/* ---------------- LÓGICA PURA (testável em node) ---------------- */

// onclick permitidos (abrir/editar/ver — nunca apagam nem mexem em dinheiro)
const ACAO_OK = [
  'openmodal(', 'opencontratocompleto(', 'openmodalchamadocompleto(',
  'showvenda(', 'historicovenda(', 'visualizarregistrodinamico(',
  'historicolancamento(', 'abrirchamadoscontrato(', 'abrirleituracontrato(',
  'visualizaros(', 'veros(', 'abriros('
];
// onclick proibidos (destruir, pagar, baixar, faturar, confirmar)
const ACAO_NAO = [
  'excluir', 'delet', 'apagar', 'remover', 'baixar', 'pagar', 'receber',
  'estornar', 'faturar', 'confirmar', 'salvar', 'gravar', 'enviar', 'imprimir',
  'print', 'export'
];
function normalizar(fn){ return String(fn || '').toLowerCase().replace(/\s+/g, ''); }
function ehAcaoSegura(onclick){
  const fn = normalizar(onclick);
  if(!fn) return false;
  for(const ruim of ACAO_NAO){ if(fn.indexOf(ruim) >= 0) return false; }
  for(const boa of ACAO_OK){ if(fn.indexOf(boa) >= 0) return true; }
  return false;
}
// Recebe a lista de onclick dos botões da linha e devolve o índice do botão
// que o duplo clique deve acionar (-1 = nenhum).
function escolherBotao(onclicks){
  const lista = Array.isArray(onclicks) ? onclicks : [];
  for(let i = 0; i < lista.length; i++){
    if(ehAcaoSegura(lista[i])) return i;
  }
  return -1;
}

window.DUPLO_CLIQUE_PURE = { ehAcaoSegura, escolherBotao, ACAO_OK: ACAO_OK.slice(), ACAO_NAO: ACAO_NAO.slice() };

if(typeof document === 'undefined') return; // modo teste (node)

/* ---------------- Duplo clique global (navegador) ---------------- */

function deveIgnorar(e, tr){
  if(!tr) return true;
  if(tr.hasAttribute('ondblclick')) return true; // já tem duplo clique próprio
  const alvo = e.target && e.target.closest ? e.target.closest('button,a,input,select,textarea') : null;
  if(alvo) return true; // clique em cima de botão/campo: deixa o nativo agir
  if(tr.closest('#modal-root')) return true; // dentro de janela: não mexe
  if(tr.closest('#view-vendas')) return true; // vendas tem lógica própria
  if(tr.closest('.neo-suggest')) return true; // lista de sugestão: não mexe
  if(!tr.closest('#app-shell')) return true; // fora do sistema: não mexe
  return false;
}
document.addEventListener('dblclick', function(e){
  try{
    if(e.defaultPrevented) return;
    const tr = e.target && e.target.closest ? e.target.closest('tr') : null;
    if(deveIgnorar(e, tr)) return;
    const botoes = Array.prototype.slice.call(tr.querySelectorAll('button[onclick]'));
    const idx = escolherBotao(botoes.map(b => b.getAttribute('onclick') || ''));
    if(idx >= 0 && botoes[idx] && typeof botoes[idx].click === 'function'){
      e.preventDefault();
      botoes[idx].click();
    }
  }catch(err){}
}, true);

console.log('[DIGICOPY] duplo_clique_patch.js v5.21.3 carregado — duplo clique abre registros');
})();
