const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}
const code = fs.readFileSync('duplo_clique_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const P = ctx.window.DUPLO_CLIQUE_PURE;
console.log('== DUPLO_CLIQUE_PURE ==');
ok('exporta funções puras', !!P && typeof P.ehAcaoSegura === 'function' && typeof P.escolherBotao === 'function');
ok('abre cadastro (openModal)', P.ehAcaoSegura("openModal('cliente','123')") === true);
ok('abre contrato completo', P.ehAcaoSegura("openContratoCompleto('c1')") === true);
ok('abre venda e histórico', P.ehAcaoSegura("showVenda('v1')") === true && P.ehAcaoSegura("historicoVenda('v1')") === true);
ok('abre detalhe de migrado', P.ehAcaoSegura("visualizarRegistroDinamico('NCM',0)") === true);
ok('NUNCA excluir', P.ehAcaoSegura("excluirCliente('c1')") === false);
ok('NUNCA baixar/pagar/receber', P.ehAcaoSegura("baixarConta('1')") === false && P.ehAcaoSegura("pagarConta('1')") === false);
ok('NUNCA estornar/faturar', P.ehAcaoSegura("estornarVenda('1')") === false && P.ehAcaoSegura("faturarVenda('1')") === false);
ok('NUNCA salvar/confirmar', P.ehAcaoSegura("salvarCliente()") === false && P.ehAcaoSegura("confirmarExcluirModulo('X')") === false);
ok('escolhe o primeiro botão seguro', P.escolherBotao(["excluirCliente('1')", "openModal('cliente','1')"]) === 1);
ok('sem botão seguro devolve -1', P.escolherBotao(["excluirCliente('1')"]) === -1 && P.escolherBotao([]) === -1);
ok('respeita duplo clique próprio da linha', /hasAttribute\('ondblclick'\)/.test(code));
ok('não mexe em vendas nem modal', /view-vendas/.test(code) && /modal-root/.test(code));
console.log('\nRESULTADO: Testes do duplo clique passaram!');
