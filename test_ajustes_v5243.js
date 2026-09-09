// Teste v5.24.3 — consertos do relatório pós-testes do dono:
//  1.x) Backup na nuvem dava "D1_EXEC_ERROR ... incomplete input": o D1 .exec()
//       QUEBRA os comandos por LINHA, então DDL multilinha nunca criou as
//       tabelas backups/backups_chunks/uso_diario (cron diário e medidor
//       também quebravam em silêncio). Agora tudo em UMA linha.
//  2.1) atalho "Nova venda" do PAINEL PRINCIPAL removido (o "+ Nova venda /
//       Orçamento" que fica DENTRO do módulo Vendas continua).
//  4.1) salvar cliente blindado nos DOIS formulários (id fantasma cai para
//       cadastro novo; erro inesperado mostra o motivo e NÃO fecha a tela).
//  5.2) cadastro do cliente com abas: Dados | Vendas | Financeiro |
//       Orçamentos | Chamados | Leituras (só quando o cliente já existe).
//  5.2.1) item da aba abre RESUMO com botão-atalho "Abrir no módulo".
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }

const worker  = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const appJs   = fs.readFileSync('app.js', 'utf8');
const patch   = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const bundle  = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const manifest= JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg       = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const P = require('./ajustes_v5243_cliente_abas_patch.js');

console.log('-- 1.x: DDL do backup/medidor em UMA linha (D1 exec quebra por linha) --');
ok(worker.indexOf('CREATE TABLE IF NOT EXISTS backups (id TEXT PRIMARY KEY, nome TEXT NOT NULL, pasta TEXT NOT NULL') >= 0, 'tabela backups: DDL de uma linha só');
ok(worker.indexOf('CREATE TABLE IF NOT EXISTS backups_chunks (id TEXT NOT NULL, seq INTEGER NOT NULL') >= 0, 'tabela backups_chunks: DDL de uma linha só');
ok(worker.indexOf('CREATE TABLE IF NOT EXISTS uso_diario (dia TEXT PRIMARY KEY') >= 0, 'tabela uso_diario (medidor): DDL de uma linha só');
ok(!/CREATE TABLE IF NOT EXISTS \w+ \(\s*\n/.test(worker), 'NENHUM CREATE TABLE multilinha restante no worker (recaída = backup morre de novo)');
ok(worker.indexOf("const WORKER_VERSION = '5.24.3'") >= 0, 'worker carimba v5.24.3');

console.log('-- 2.1: atalho "Nova venda" fora do painel, módulo Vendas preservado --');
ok(appJs.indexOf('ph-shopping-cart-simple text-[16px]"></i> Nova venda</button>') < 0, 'botão "Nova venda" do painel principal removido');
ok(appJs.indexOf('+ Nova venda / Orçamento') >= 0, 'botão de criar venda DENTRO do módulo Vendas continua');
ok(bundle.indexOf('ph-shopping-cart-simple text-[16px]"></i> Nova venda</button>') < 0 && bundleM.indexOf('ph-shopping-cart-simple text-[16px]"></i> Nova venda</button>') < 0, 'remoção refletida nos 2 bundles');

console.log('-- 4.1: salvar cliente não perde o digitado em nenhum formulário --');
ok(appJs.indexOf('const existingCli=id?db.clientes.find(c=>c.id===id && c.empresaId===sess.empresaId):null;') >= 0, 'formulário clássico: id fantasma cai para cadastro novo (sem TypeError)');
ok(patch.indexOf("window.saveCliente.__v5243") >= 0 && patch.indexOf('os dados continuam na tela') >= 0, 'qualquer erro no salvar mostra o motivo e MANTÉM a tela aberta');
ok(patch.indexOf("window.selectClienteVenda.__v5243") >= 0 && patch.indexOf("getElementById('vos-codigo')") >= 0 && patch.indexOf('window.vosVendaSelectCliente(id)') >= 0, 'ponte: seleção da tela antiga desvia para a venda VOS (cura-raiz do "pede o cliente de novo")');
ok(patch.indexOf("window.vosVendaSelectCliente.__v5243") >= 0 && patch.indexOf('window.__vosForm.cliente = c') >= 0, 'seleção VOS nunca sai sem amarrar o cliente no formulário');

console.log('-- 5.2: abas no cadastro do cliente --');
ok(patch.indexOf("['dados','Dados'") >= 0 && patch.indexOf("['vendas','Vendas'") >= 0 && patch.indexOf("['financeiro','Financeiro'") >= 0 && patch.indexOf("['orcamentos','Orçamentos'") >= 0 && patch.indexOf("['chamados','Chamados'") >= 0 && patch.indexOf("['leituras','Leituras'") >= 0, 'as 6 abas na ordem pedida');
ok(patch.indexOf("p.id='clitab-pane-'+a[0]") >= 0 && patch.indexOf("getElementById('clitab-pane-'+a[0])") >= 0, 'painel separado para cada aba');
ok(patch.indexOf("if(!id) return; // cadastro NOVO") >= 0, 'abas só aparecem para cliente já cadastrado');
ok(patch.indexOf("window.renderModalCliente.__v5243=true") >= 0, 'montagem embrulha o modal do cliente uma vez só');
ok(patch.indexOf("foot.style.display=(aba==='dados')?'':'none'") >= 0, 'botão Salvar some fora da aba Dados');
// núcleo puro
(function(){
  const db={vendas:[{id:'v1',clienteId:'X',empresaId:'E'},{id:'v2',clienteId:'Y',empresaId:'E'}],
    contasReceber:[{id:'r1',clienteId:'X',empresaId:'E'}],orcamentos:[{id:'o1',clienteId:'X',empresaId:'E',itens:[{qtd:3,preco:10}]}],
    os:[{id:'s1',clienteId:'X',empresaId:'E'}],leituras:[{id:'l1',clienteId:'X',empresaId:'E2'}]};
  const n=P.contagens(db,'X','E');
  ok(n.vendas===1 && n.financeiro===1 && n.orcamentos===1 && n.chamados===1 && n.leituras===0, 'PURE: contagens filtram por cliente E empresa');
  ok(P.totalOrc({itens:[{qtd:3,preco:10}]})===30, 'PURE: total do orçamento somado dos itens quando falta total');
})();

console.log('-- 5.2.1: resumo + botão-atalho para o módulo de origem --');
ok(patch.indexOf('clitabResumo') >= 0 && patch.indexOf("ov.id='clitab-resumo'") >= 0 && patch.indexOf('window.clitabResumo=function') >= 0, 'clique no item abre o resumo (overlay próprio)');
ok(patch.indexOf('Abrir no módulo') >= 0, 'resumo tem o botão-atalho');
ok(patch.indexOf("navigateTo('vendas')") >= 0 && patch.indexOf('window.showVenda(id)') >= 0, 'atalho de venda: tela Vendas + detalhe da venda');
ok(patch.indexOf("navigateTo('financeiro')") >= 0 && patch.indexOf("setFinTab('receber')") >= 0 && patch.indexOf("'search-cr'") >= 0, 'atalho de conta: Financeiro em Contas a receber já filtrado');
ok(patch.indexOf('window.abrirTelaOrcamento(o)') >= 0, 'atalho de orçamento abre a tela de orçamento pronta');
ok(patch.indexOf("navigateTo('manutencao')") >= 0 && patch.indexOf("openModal('os',id)") >= 0, 'atalho de chamado: Manutenção + a OS aberta');
ok(patch.indexOf("navigateTo('leituras')") >= 0 && patch.indexOf("openModal('leitura',id)") >= 0, 'atalho de leitura: Leituras + registro aberto');

console.log('-- integridade: manifest, bundles e versões --');
ok(manifest.length === 196 && manifest[manifest.length-1] === 'ajustes_v5243_cliente_abas_patch.js', 'manifest tem 196 scripts, último é o v5.24.3');
ok(bundle.indexOf('scripts: 196 | sha256:') >= 0, 'header do bundle com 196 scripts');
const miolo = patch.slice(patch.indexOf('const CLITAB_PURE'));
ok(bundle.indexOf(miolo.slice(0,200)) >= 0 && bundleM.indexOf(miolo.slice(0,200)) >= 0, 'patch presente nos 2 bundles');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '5.24.3'") >= 0 && indexHtml.indexOf('app.bundle.js?v=5.24.3') >= 0, 'index.html na v5.24.3');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '5.24.3'") >= 0, 'mobile/www/index.html na v5.24.3');
ok(pkg.version === '5.24.3', 'package.json v5.24.3');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v5.24.3'); process.exit(1); }
console.log('\nTudo certo v5.24.3!');
