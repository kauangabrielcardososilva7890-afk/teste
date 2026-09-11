// Teste v5.24.8 — segunda rodada do relatório pós-testes do dono:
//  1.x) backup com "D1_ERROR daily row write limit": a cota grátis de 100 mil
//       escritas/dia estourou (sync regravava registros idênticos). Cura:
//       push NÃO regrava registro idêntico (dedupe) + /v1/status imune ao
//       medidor + aviso "código ANTIGO" deixa de aparecer por tabela (checa
//       o /health de verdade) + mensagem amigável da cota no Backup.
//  2.1) o "Nova venda" alvo era o botão DENTRO da tela de Vendas — removido
//       (criação continua pelo atalho do menu Atendimento).
//  4.1) cliente existente "não segurava" na venda: seleção agora é à prova de
//       falha E a tela confirma "Cliente vinculado".
//  5.2.1/5.2.2) novo desenho do dono: abas Dados | Histórico do sistema;
//       dentro do Histórico, sub-menus (padrão Vendas); listagem com caixas
//       de múltipla escolha + botões Excluir/Extornar/Abrir lista de origem;
//       registro específico = botão DIREITO. Resumo antigo morreu.
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }

const worker  = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const appJs   = fs.readFileSync('app.js', 'utf8');
const syncPat = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const bkPat   = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
const patch   = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const bundle  = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const manifest= JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg       = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const P = require('./ajustes_v5243_cliente_abas_patch.js');

console.log('-- 1.x: cota da nuvem — dedupe de escritas + status à prova de cota --');
ok(worker.indexOf('CREATE TABLE IF NOT EXISTS backups (id TEXT PRIMARY KEY') >= 0, 'DDL backups continua numa linha só');
ok(!/CREATE TABLE IF NOT EXISTS \w+ \(\s*\n/.test(worker), 'nenhum CREATE TABLE multilinha');
ok((worker.match(/noop: true, version: currentVersion/g) || []).length === 2, 'push NÃO regrava registro idêntico nem delete repetido (economia da cota)');
ok(worker.indexOf("catch (eUso)") >= 0 && worker.indexOf("medidor pausado (cota)") >= 0, '/v1/status não cai mais quando o medidor não consegue gravar');
ok(worker.indexOf("const WORKER_VERSION = '5.24.8'") >= 0, 'worker carimba v5.24.8');
ok(syncPat.indexOf("api('/health'") >= 0 && syncPat.indexOf('status.workerVersao=h.versao') >= 0, 'aviso "código ANTIGO" só aparece se o /health de verdade falhar');
ok(bkPat.indexOf('daily row write limit') >= 0 && bkPat.indexOf('LIMITE DIÁRIO') >= 0, 'Backup traduz a cota estourada para português amigável');

console.log('-- 2.1: "Nova venda" fora da TELA DE VENDAS também --');
ok(appJs.indexOf('+ Nova venda / Orçamento</button>') < 0, 'botão "+ Nova venda / Orçamento" removido da tela de Vendas');
ok(appJs.indexOf('ph-shopping-cart-simple text-[16px]"></i> Nova venda</button>') < 0, 'hero do painel continua sem atalho');
ok(bundle.indexOf('+ Nova venda / Orçamento</button>') < 0 && bundleM.indexOf('+ Nova venda / Orçamento</button>') < 0, 'remoção refletida nos 2 bundles');

console.log('-- 4.1: cliente existente segura na venda, com confirmação visível --');
ok(patch.indexOf("window.selectClienteVenda.__v5243") >= 0 && patch.indexOf("getElementById('vos-codigo')") >= 0, 'ponte da tela antiga continua desviando para a VOS');
ok(patch.indexOf('window.__vosForm.cliente = c') >= 0, 'reamarca o vínculo se a pintura falhar');
ok(patch.indexOf('Cliente vinculado à venda') >= 0, 'tela CONFIRMA a amarração do cliente (feedback que faltava)');
ok(patch.indexOf('ainda não chegou neste PC') >= 0, 'cliente ainda não sincronizado vira aviso claro + cutucão na nuvem');

console.log('-- 5.2.1/5.2.2: novo desenho das abas do cliente --');
ok(patch.indexOf("['dados','Dados'") >= 0 && patch.indexOf("['historico','Histórico do sistema'") >= 0 && patch.indexOf("['vendas','Vendas'") < 0 === false, '2 abas principais: Dados | Histórico do sistema');
ok(patch.indexOf("['vendas','Vendas'") >= 0 && patch.indexOf("['financeiro','Financeiro'") >= 0 && patch.indexOf("['orcamentos','Orçamentos'") >= 0 && patch.indexOf("['chamados','Chamados'") >= 0 && patch.indexOf("['leituras','Leituras'") >= 0, '5 sub-menus dentro do Histórico');
ok(patch.indexOf("window.clitabSub(st.sub||'vendas')") >= 0, 'Histórico abre por padrão em VENDAS');
ok(patch.indexOf("foot.style.display=(aba==='dados')?'':'none'") >= 0, 'botão Salvar some fora da aba Dados');
ok(patch.indexOf('class="clitab-sel') >= 0 && patch.indexOf('clitabToggleSel') >= 0, 'linhas com caixa de múltipla escolha');
ok(patch.indexOf('clitab-btn-excluir') >= 0 && patch.indexOf('clitab-btn-extornar') >= 0 && patch.indexOf('clitab-btn-lista') >= 0, 'botões Excluir / Extornar / Abrir lista de origem');
ok(patch.indexOf("btnExt.style.display=(sub==='vendas')?'':'none'") >= 0, 'Extornar só aparece na listagem de vendas');
ok(patch.indexOf('faturad|finalizad|conclu|pago') >= 0, 'excluir venda pula faturadas (regra: estornar antes)');
ok(patch.indexOf("db.orcamentos=(banco.orcamentos||[]).filter(function(x){return x.id!==id;})") >= 0, 'orçamento excluído DE VEZ (v5.24.8: sem marca-fantasma)');
ok(patch.indexOf('oncontextmenu') >= 0 && patch.indexOf('clitabAbrirRegistro') >= 0, 'botão DIREITO abre o registro no módulo de origem');
ok(patch.indexOf('clitab-resumo') < 0, 'resumo antigo removido de vez');
ok(patch.indexOf("getElementById('search-vendas')") >= 0 && patch.indexOf("getElementById('search-cr')") >= 0, 'abrir lista joga o nome do cliente na busca do módulo');
// núcleo puro continua sadio
(function(){
  const db={vendas:[{id:'v1',clienteId:'X',empresaId:'E'}],contasReceber:[],orcamentos:[{id:'o1',clienteId:'X',empresaId:'E',itens:[{qtd:2,preco:5}]}],os:[],leituras:[]};
  const n=P.contagens(db,'X','E');
  ok(n.vendas===1 && n.orcamentos===1 && n.financeiro===0, 'PURE: contagens seguem certas');
  ok(P.totalOrc({itens:[{qtd:2,preco:5}]})===10, 'PURE: total do orçamento');
})();

console.log('-- integridade: manifest, bundles e versões --');
ok(manifest.length === 196 && manifest[manifest.length-1] === 'ajustes_v5243_cliente_abas_patch.js', 'manifest tem 196 scripts, último é o das abas');
ok(bundle.indexOf('scripts: 196 | sha256:') >= 0, 'header do bundle com 196 scripts');
ok(bundle.indexOf('clitab-btn-extornar') >= 0 && bundleM.indexOf('clitab-btn-extornar') >= 0, 'novo desenho presente nos 2 bundles');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '5.24.8'") >= 0 && indexHtml.indexOf('app.bundle.js?v=5.24.8') >= 0, 'index.html na v5.24.8');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '5.24.8'") >= 0, 'mobile/www/index.html na v5.24.8');
ok(pkg.version === '5.24.8', 'package.json v5.24.8');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v5.24.8'); process.exit(1); }
console.log('\nTudo certo v5.24.8!');
