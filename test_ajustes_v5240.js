// Teste v5.24.0 — relatório grande do dono:
//  1.2 tela Backup sem o botão local duplicado; 1.3 manual numerado no worker;
//  2.1 atalho "Nova venda" fora do menu; 2.2 Extornar (individual + lote);
//  3.x anti-perda (varredura off, conflito com reenvio, reconciliação segura,
//      reset só com backup); 4.1 cliente sem id vira cadastro novo;
//  4.2 orçamento com retry de nuvem; 5.1 "Importar clientes" removido.
'use strict';
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){
  if(cond){ console.log('  ✔ ' + msg); }
  else { console.error('  ✘ FALHOU: ' + msg); falhas++; }
}

const patchBk = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
const patch61 = fs.readFileSync('ajustes_v52261_orcamento_nao_volta_patch.js', 'utf8');
const patchFin = fs.readFileSync('finalizacao_sistema_patch.js', 'utf8');
const patchSync = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const patchCli = fs.readFileSync('clientes_patch.js', 'utf8');
const patch5240 = fs.readFileSync('ajustes_v5240_relatorio_grande_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const bundleMob = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob = fs.readFileSync('mobile/www/index.html', 'utf8');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

function mioloNoBundle(b, arquivo){
  // garante que a FONTE está byte-idêntica dentro do bundle (sem drift)
  return b.indexOf(arquivo) >= 0;
}
function seguroEmAmbos(trecho, msg){
  ok(bundle.indexOf(trecho) >= 0 && bundleMob.indexOf(trecho) >= 0, msg + ' (nos 2 bundles)');
}

console.log('== v5.24.0 — relatório grande ==');

// 1) item 1.2: tela Backup sem manual local duplicado, restauração preservada
console.log('-- item 1.2: só os 3 botões da nuvem + restaurar --');
ok(patchBk.indexOf('id="bk-pc-baixar"') < 0 && patchBk.indexOf('pcBtn') < 0, 'botão local duplicado "💾 Baixar backup para este PC" removido da fonte (comentário histórico fica)');
ok(patchBk.indexOf('bk-agora') >= 0 && patchBk.indexOf('bk-baixar-todos') >= 0 && patchBk.indexOf('bk-excluir-todos') >= 0, 'os 3 botões da nuvem (manual/.zip/excluir) seguem na fonte');
ok(patchBk.indexOf('bk-rest-arq') >= 0 && patchBk.indexOf('Restaurar a partir de um arquivo de backup') >= 0, 'restauração por arquivo preservada');
ok(patchBk.indexOf('pcBtn') < 0, 'handler do botão removido junto');
ok(bundle.indexOf('bk-pc-baixar') < 0 && bundleMob.indexOf('bk-pc-baixar') < 0, 'botão duplicado fora dos 2 bundles');

// 2) item 1.3: manual numerado no worker
console.log('-- item 1.3: Backup manual 1, 2, 3... (worker) --');
ok(worker.indexOf("return PASTA_MANUAL + '/Backup manual ' + seq + '.json';") >= 0, 'nome do manual = "Backup manual N.json"');
ok(worker.indexOf('backup_seq_manual') >= 0 && worker.indexOf('ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1') >= 0, 'contador persistente na nuvem (system_meta) com incremento atômico');
ok(worker.indexOf('chave = nomeBackupManual(await proximoSeqManual(env));') >= 0, 'backup manual usa o próximo número da nuvem');
ok(worker.indexOf("const WORKER_VERSION = '5.24.2'") >= 0, 'worker carimba v5.24.2');

// 11) v5.24.1: backups dependem do USUÁRIO (cargo Admin/Dono), não do aparelho
console.log('-- v5.24.1: backup por usuário admin, qualquer PC --');
const patchSyncAux = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
ok(worker.indexOf('async function requireUsuarioAdmin') >= 0, 'worker tem requireUsuarioAdmin');
ok((worker.match(/await requireUsuarioAdmin\(request, env\);/g) || []).length === 5, 'as 5 rotas de backup trocaram para requireUsuarioAdmin');
['handleBackupListar','handleBackupBaixar','handleBackupApagarUm','handleBackupApagarTodos','handleBackupAgora'].forEach(function(nome){
  const i = worker.indexOf('async function ' + nome + '(request, env)');
  const prox = worker.indexOf('async function ', i + 10);
  const trecho = worker.slice(i, prox > 0 ? prox : undefined);
  ok(trecho.indexOf('await requireUsuarioAdmin(request, env);') >= 0 && trecho.indexOf('await requireAdmin(request, env);') < 0, nome + ' usa prova do usuário');
});
ok(worker.indexOf("x-digicopy-usuario-login") >= 0 && worker.indexOf("x-digicopy-usuario-prova") >= 0 && worker.indexOf("cargo !== 'admin'") >= 0 && worker.indexOf("cargo !== 'dono'") < 0, 'worker confere login + prova sha256 + cargo SOMENTE Admin (v5.24.2)');
ok(patchSyncAux.indexOf("x-digicopy-usuario-prova") >= 0 && patchSyncAux.indexOf('async function provaUsuario') >= 0, 'app anexa a prova do usuário nas chamadas da nuvem');
ok(patchBk.indexOf('usuarioAtualEhAdminBackup') >= 0 && patchBk.indexOf('🔒 Backups da nuvem: só usuário com cargo Admin') >= 0, 'tela Backup trava com cadeado quando o usuário não é Admin');
ok(patchBk.indexOf('UPDATE devices SET role') < 0, 'cura por SQL de aparelho saiu do app (modelo novo não depende de aparelho)');
seguroEmAmbos('usuarioAtualEhAdminBackup', 'trava de usuário-admin no app');

// 3) item 3.2 extra worker: reset só depois de backup
console.log('-- item 3.2: zerar a nuvem só com foto antes --');
const iSnap = worker.indexOf('Backup antes de zerar a nuvem');
const iDel = worker.indexOf("'DELETE FROM records'");
ok(iSnap >= 0 && iDel >= 0 && iSnap < iDel, 'gerarBackup("Backup seguranca/...") roda ANTES do DELETE FROM records no reset');

// 4) item 2.1: atalho Nova venda fora do menu
console.log('-- item 2.1: atalho "Nova venda" removido --');
ok(indexHtml.indexOf("if(typeof novaVenda==='function') novaVenda(); else navigateTo('vendas')") < 0, 'index.html sem o atalho');
ok(indexMob.indexOf("if(typeof novaVenda==='function') novaVenda(); else navigateTo('vendas')") < 0, 'mobile/www/index.html sem o atalho');

// 5) item 2.2: Extornar individual + lote
console.log('-- item 2.2: botão Extornar (lote) + estornarVenda (individual) --');
ok(patch5240.indexOf('window.estornarVenda = function') >= 0, 'estornarVenda individual existe de verdade (botão do detalhe era morto)');
ok(patch5240.indexOf('window.estornarVendasSelecionadas = function') >= 0, 'estorno em lote existe');
ok(patch5240.indexOf('btn-estornar-venda') >= 0 && patch5240.indexOf('btn-excluir-venda-unificado') >= 0, 'botão Extornar entra na mesma barra do Excluir');
ok(patch5240.indexOf('venda-check-lote') >= 0, 'usa a mesma caixa de seleção do Excluir');
ok(patch5240.indexOf("v.status = 'estornada';") >= 0 && patch5240.indexOf('v.formaPagamento = ') >= 0 && patch5240.indexOf('v.parcelas = [];') >= 0, 'marca "Extornada" no histórico e limpa o faturamento');
ok(patch5240.indexOf('c.vendaId === v.id') >= 0 && patch5240.indexOf('contasReceber') >= 0, 'desfaz as contas a receber da venda (financeiro)');
ok(patch5240.indexOf('p.estoque') < 0, 'NÃO mexe no estoque (faturar também não mexia)');
seguroEmAmbos('window.estornarVendasSelecionadas = function', 'estorno em lote presente');
seguroEmAmbos('btn-estornar-venda', 'botão Extornar presente');

// 6) item 3.1: anti-perda de dados
console.log('-- item 3.1/3.2: travas anti-perda de dados --');
ok(patch61.indexOf('DESATIVADO DE VEZ') >= 0 && patch61.indexOf('setTimeout(varrerRessuscitadas') < 0, 'varredura local que removia vendas/orçamentos está DESLIGADA (causa do "dado some")');
ok(patchSync.indexOf('retryV5240') >= 0 && patchSync.indexOf('baseVersion:Number(result.current.version)||0') >= 0, 'conflito de push: reenvia a edição local 1x em vez de descartar em silêncio');
ok(patchSync.indexOf('if(!state.initialPull)return 0;') >= 0, 'reconciliação só remove sobras com pull completo (menos risco de apagar dado legítimo)');
seguroEmAmbos('retryV5240', 'reenvio de conflito presente');
seguroEmAmbos('DESATIVADO DE VEZ', 'varredura desligada presente');

// 7) item 4.1: cliente com id velho vira cadastro novo
console.log('-- item 4.1: cliente "não encontrado" não trava mais o salvamento --');
ok(patchCli.indexOf('id velho/fantasma') >= 0 && patchCli.indexOf("if(!alvo) return toast('Cliente não encontrado','error');") < 0, 'salvar cliente com id velho cai para cadastro novo (sem perder o digitado)');
seguroEmAmbos('id velho/fantasma', 'fallback de cliente presente');

// 8) item 4.2: orçamento não encontrado → busca na nuvem e tenta de novo
console.log('-- item 4.2: orçamento some? busca na nuvem antes de desistir --');
ok(patch5240.indexOf('window.abrirTelaOrcamento.__v5240') >= 0 && patch5240.indexOf('DIGICOPY_CLOUD_SYNC.tick') >= 0 && patch5240.indexOf('Buscando o orçamento na nuvem') >= 0, 'wrap do abrir-orçamento com 2 tentativas via nuvem');
seguroEmAmbos('Buscando o orçamento na nuvem', 'retry de orçamento presente');

// 9) item 5.1: Importar clientes fora
console.log('-- item 5.1: "Importar clientes" removido --');
ok(patchFin.indexOf('window.importarClientesJsonFinal=') < 0 && patchFin.indexOf("id=\"clientes-json-input\"") < 0 && patchFin.indexOf('>Importar clientes</button>') < 0, 'botão, input e função de importação fora da fonte (comentários explicativos ficam)');
ok(bundle.indexOf('window.importarClientesJsonFinal=') < 0 && bundle.indexOf('>Importar clientes</button>') < 0 && bundleMob.indexOf('>Importar clientes</button>') < 0, 'botão e função fora dos 2 bundles');

// 10) integridade: fontes byte-idênticas dentro dos bundles + manifest + versões
console.log('-- integridade: fonte ⇄ bundle byte-a-byte, manifest e versões --');
const fontes = ['ajustes_v52296_backups_nuvem_patch.js','ajustes_v52261_orcamento_nao_volta_patch.js','finalizacao_sistema_patch.js','cloudflare_data_sync_patch.js','clientes_patch.js','ajustes_v5240_relatorio_grande_patch.js'];
fontes.forEach(function(f){
  const src = fs.readFileSync(f, 'utf8');
  ok(mioloNoBundle(bundle, src) && mioloNoBundle(bundleMob, src), 'fonte ' + f + ' byte-idêntica nos 2 bundles');
});
ok(manifest[manifest.length - 1] === 'ajustes_v5240_relatorio_grande_patch.js' && manifest.length === 195, 'manifest tem 195 scripts, último é o v5.24.0');
ok(bundle.indexOf('scripts: 195 | sha256:') >= 0, 'header do bundle com 195 scripts + sha256 novo');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '5.24.2'") >= 0 && indexHtml.indexOf('app.bundle.js?v=5.24.2') >= 0, 'index.html na v5.24.2');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '5.24.2'") >= 0, 'mobile/www/index.html na v5.24.2');
ok(pkg.version === '5.24.2', 'package.json v5.24.2');


// 12) v5.24.2 — CORS da prova do usuário + menus Nuvem/Backup só para Admin
console.log('-- v5.24.2: CORS consertado + menus só Admin --');
ok(worker.indexOf("'access-control-allow-headers': 'authorization, content-type, x-setup-secret, x-digicopy-versao, x-digicopy-usuario-login, x-digicopy-usuario-prova',") >= 0, 'CORS da nuvem aceita os cabeçalhos da prova do usuário (fim do "Sem conexão"/"ANTIGO")');
ok(patchBk.indexOf("if(cargo==='admin') return true;") >= 0 && patchBk.indexOf("||cargo==='dono'") < 0 && patchBk.indexOf("||cargo2==='dono'") < 0, 'trava do app: cargo Dono NÃO abre mais backup (só Admin)');
ok(patchBk.indexOf('function aplicarVisibilidadeMenusNuvemBackup') >= 0 && patchBk.indexOf("getElementById('btn-nuvem')") >= 0 && patchBk.indexOf("getElementById('btn-backup-top')") >= 0 && patchBk.indexOf('button[onclick="exportBackup()"]') >= 0, 'helper esconde os menus Nuvem, Backup e o ícone de download para não-Admin');
ok(patchBk.indexOf('__v5242') >= 0 && patchBk.indexOf('O menu Nuvem é só para usuário com cargo Admin') >= 0, 'tela da Nuvem travada por cargo (defesa em profundidade)');
ok(patchBk.indexOf('Entre no sistema com um usuário de cargo Admin (ex.: Kauan)') >= 0 && patchBk.indexOf('ou Denivaldo (Dono)') < 0, 'cadeado do Backup não cita mais o Dono');
seguroEmAmbos('aplicarVisibilidadeMenusNuvemBackup', 'visibilidade dos menus nos 2 bundles');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v5.24.0'); process.exit(1); }
console.log('\nTudo certo v5.24.0!');
