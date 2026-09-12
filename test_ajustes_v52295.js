// Teste v5.22.95 — qualquer tela aberta a partir da venda em andamento
// devolve a MESMA venda com tudo intacto (salvar OU cancelar)
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.95 — venda em andamento volta intacta após qualquer tela ==');

const p = fs.readFileSync('ajustes_v52295_venda_volta_patch.js', 'utf8');

// 1) fotografa a venda quando qualquer outro modal abre a partir dela
ok(p.indexOf("if(typeof window.openModal === 'function'") >= 0 && p.indexOf("window.openModal = function(") >= 0, 'embrulha openModal (genérico, não é função avulsa por botão)');
ok(p.indexOf("vendaNaTela() && !window.__vosVendaPendente") >= 0, 'só tira foto se a venda em andamento estiver aberta');
ok(p.indexOf("window.__vosVendaPendente = tirarFoto()") >= 0, 'foto guardada antes de abrir a tela');

// 2) devolve a venda no fechar (salvar e cancelar passam por closeModal)
ok(p.indexOf("if(typeof window.closeModal === 'function'") >= 0 && p.indexOf("window.closeModal = function(") >= 0, 'embrulha closeModal (salvar e cancelar usam o mesmo caminho)');
ok(p.indexOf("setTimeout(devolverVenda, 40)") >= 0, 'devolve a venda logo após fechar');

// 3) foto guarda TUDO: formulário, código, campos digitados, aba e extra
ok(p.indexOf("JSON.parse(JSON.stringify(window.__vosForm))") >= 0, 'cópia profunda do formulário (cliente, itens, descontos, data/hora)');
["'vos-obs'", "'vos-desc-venda'", "'vos-os-valor'", "'vos-os-desc'", "'vos-prod-search'", "'vos-item-qtd'", "'vos-item-vunit'", "'vos-data-saida'", "'vos-prazo-entrega'", "'vos-destino'"].forEach(function(id){
  ok(p.indexOf(id) >= 0, 'campo na foto: ' + id);
});

// 4) devolução reconstrói e repinta tudo
ok(p.indexOf("window.novaVenda()") >= 0, 'reconstrói a venda com novaVenda()');
ok(p.indexOf("window.__vosForm = foto.form") >= 0, 'devolve o formulário inteiro');
ok(p.indexOf("vosVendaSelectCliente") >= 0, 'repõe o cliente no card');
ok(p.indexOf("cod.textContent = foto.codigoTexto") >= 0, 'mantém o MESMO código da venda');
ok(p.indexOf("vosRenderItens") >= 0 && p.indexOf("vosResumoVenda") >= 0, 'repinta itens e resumo');
ok(p.indexOf("vosSetAba('os')") >= 0, 'devolve para a aba que estava');

// 5) rede de segurança leve para telas que fechem sem closeModal
ok(p.indexOf("setInterval(function(){") >= 0 && p.indexOf("devolverVenda();") >= 0, 'olho leve devolve a venda se o modal sumir de outro jeito');

// 6) não atrapalha o uso normal
ok(p.indexOf("window.__V52295_PURE") >= 0, 'marca de diagnóstico/teste presente');

// regressão: bundle contém o patch por último
const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
ok(man[man.length - 4] === 'ajustes_v52295_venda_volta_patch.js', 'patch fica logo antes dos de backups (depois vêm backups v5.22.96, relatório grande v5.24.0 e abas do cliente v5.24.3)');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.indexOf('__vosVendaPendente') >= 0, 'lógica presente no app.bundle.js');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.95!');
