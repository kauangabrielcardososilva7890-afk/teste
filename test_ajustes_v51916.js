const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v51916_patch.js', 'utf8');

// Globais (como no navegador, via function declaration no app.js)
let confirmMsg = null;
globalThis.logAction = () => {};
globalThis.saveDB = () => { globalThis.__saved = true; };
globalThis.renderProdutos = () => { globalThis.__renderProd = true; };
globalThis.renderContratos = () => { globalThis.__renderCtr = true; };
globalThis.renderAuditoria = () => {};
globalThis.toast = () => {};
globalThis.getSession = () => ({ empresaId: 'e1' });

// window.X (definidos como window.X no sistema)
const win = {
  confirmSistema: (m) => { confirmMsg = m; return Promise.resolve(true); },
  lfbAlert: () => {},
  historicoVenda: function(){ globalThis.__histChamado = true; },
  vosCarregarVendaNaTela: function(){ globalThis.__telaPrincipal = true; }
};
const db = {
  produtos: [{ id: 'p1', nome: 'Toner' }],
  contratos: [{ id: 'c1', numero: 'CT-1', status: 'ativo' }],
  parque: [],
  vendas: [{ id: 'v1', status: 'faturado' }]
};

new Function('window', 'db', code)(win, db);

console.log('== AJUSTES_V51916: excluir produto ==');
win.deleteProduto('p1');
setTimeout(() => {
  ok('confirma antes de excluir', confirmMsg && /Excluir produto/.test(confirmMsg));
  ok('produto foi removido', db.produtos.length === 0);
  ok('salvou + re-renderizou', globalThis.__saved === true && globalThis.__renderProd === true);

  console.log('== AJUSTES_V51916: excluir contrato ==');
  win.excluirContratoOperacional('c1');
  setTimeout(() => {
    ok('contrato marcado excluido', db.contratos[0].status === 'excluido');
    ok('re-renderizou contratos', globalThis.__renderCtr === true);

    console.log('== AJUSTES_V51916: venda faturada abre na principal ==');
    win.historicoVenda('v1');
    ok('faturada abriu na tela principal (não histórico)', globalThis.__telaPrincipal === true && globalThis.__histChamado !== true);

    console.log('\nRESULTADO: Testes do ajustes_v51916 passaram!');
    process.exit(0);
  }, 30);
}, 30);
