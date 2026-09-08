// Teste v5.22.100 — backups: menu Backup com gaveta de 3 botões diretos + fix CORS do header de versão
// (diário 18:30 + a cada atualização + reforço manual), tabela só de backups,
// compactado; baixar-todos (zip com pastas) e excluir-backups só do admin.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.100 — gaveta Backup: manual, baixar-histórico, excluir ==');

const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const wrangler = fs.readFileSync('cloudflare-worker/wrangler.jsonc', 'utf8');
const patch = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
const sync = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const readme = fs.readFileSync('cloudflare-worker/README.md', 'utf8');

// 1) duas pastas separadas, nomes do desenho do dono
ok(worker.indexOf("const PASTA_DIARIO = 'Backup diario'") >= 0, 'pasta "Backup diario"');
ok(worker.indexOf("const PASTA_ATUALIZACOES = 'Backup atualizações'") >= 0, 'pasta "Backup atualizações"');
ok(worker.indexOf("const PASTA_MANUAL = 'Backup manual'") >= 0, 'pasta "Backup manual" (reforço)');
ok(worker.indexOf("PASTA_DIARIO + '/Backup '") >= 0 && worker.indexOf("PASTA_ATUALIZACOES + '/Backup sistema '") >= 0, 'cada ciclo grava na SUA pasta');

// 2) guarda dentro da nuvem que ele já usa (sem precisar habilitar R2)
ok(wrangler.indexOf('r2_buckets') < 0, 'R2 removido do deploy (nada de ativar plano/cartão)');
ok(wrangler.indexOf('"30 21 * * *"') >= 0, 'relógio 21:30 UTC = 18:30 São Paulo mantido');
ok(worker.indexOf("x-digicopy-versao',") >= 0, 'CORS autoriza o header de versão (senão o navegador bloqueava o preflight e a nuvem ficava "ocupada" eternamente)');
ok(worker.indexOf("'GET, POST, DELETE, OPTIONS'") >= 0, 'CORS permite DELETE (botões de apagar backup)');
ok(worker.indexOf('CREATE TABLE IF NOT EXISTS backups') >= 0 && worker.indexOf('garantirTabelaBackups') >= 0, 'tabela só de backups se autocria — não mistura com dados do sistema');
ok(worker.indexOf('gzipTexto') >= 0 && worker.indexOf('gunzipBytes') >= 0, 'backup grava compactado e baixa idêntico');
ok(worker.indexOf('DELETE FROM backups') >= 0 && worker.indexOf("SELECT entity, record_id") >= 0, 'excluir apaga só as tabelas de backup');

// 3) os dois ciclos seguem automáticos
ok(worker.indexOf('async scheduled(event, env, ctx)') >= 0 && worker.indexOf("nomeBackupDiario(new Date())") >= 0, 'diário 18:30 sozinho');
ok(worker.indexOf('checarTrocaDeVersao') >= 0 && worker.indexOf('nomeBackupSistema(ultima)') >= 0, 'atualização: foto com o nome da versão anterior');
ok(worker.indexOf('compararVersao(versaoApp, ultima) <= 0) return') >= 0, 'PC velho não dispara backup de tabela invertida');

// 4) reforço "antes de mexer na atualização"
ok(worker.indexOf("'/v1/backup/agora'") >= 0 && worker.indexOf('handleBackupAgora') >= 0, 'rota "backup agora" existe');
ok(worker.indexOf('nomeBackupManual') >= 0, 'backup manual tem data e hora');
ok(patch.indexOf('📸 Backup agora') >= 0 && patch.indexOf('backupAgora') >= 0, 'botão "Backup agora" no card');

// 5) segurança: só administrador
ok((worker.match(/requireAdmin\(request, env\)/g) || []).length >= 5, 'rotas de backup exigem admin');
ok(sync.indexOf('dc-backups') < 0, 'painel Nuvem ficou sem o card (o menu Backup é o dono)');

// 6) app informa versão para o ciclo de atualização funcionar
ok(sync.indexOf("x-digicopy-versao") >= 0 && sync.indexOf('DIGICOPY_APP_VERSION') >= 0, 'app manda a versão em toda chamada');

// 7) zip baixado mantém as pastas
ok(patch.indexOf(".replace(/\\\\/g, '/')") >= 0 && patch.indexOf('montarZip') >= 0, 'zip montado com pastas dentro');
ok(patch.indexOf('📥 Baixar todos os backups') >= 0 && patch.indexOf('🗑️ Excluir backups') >= 0, 'dois botões grandes intactos');
ok(patch.indexOf('Backup diario') >= 0 && patch.indexOf('Backup atualizações') >= 0, 'card mostra as duas pastas');

// 8) instruções da nuvem sem armadilha de cartão
ok(readme.indexOf('## Backups automáticos (v5.22.97)') >= 0, 'README documenta os dois ciclos e as pastas');
ok(readme.indexOf('r2 bucket') < 0, 'README não manda mais criar balde (não precisa ativar R2)');
ok(readme.indexOf('npx wrangler deploy') >= 0, 'README: um comando só basta');

// 9) menu Backup desce UMA GAVETA com 3 botões diretos (sem telinha)
ok(patch.indexOf('gavetaAbrirFechar') >= 0 && patch.indexOf('bk-menu-gaveta') >= 0, 'botão Backup abre/recolhe a gaveta');
ok(patch.indexOf('📸 Backup manual (nuvem + baixa no PC)') >= 0, 'botão 1: backup manual FAZ OS DOIS (cria na nuvem e baixa no PC)');
ok(patch.indexOf('backupAgora') >= 0 && patch.indexOf('baixarUmBackup(chave)') >= 0, 'manual: nuvem primeiro, download em seguida');
ok(patch.indexOf('📥 Baixar todo histórico de backup') >= 0, 'botão 2: baixar todo o histórico');
ok(patch.indexOf('🗑️ Excluir o histórico de backups') >= 0 && patch.indexOf('excluirTodos') >= 0, 'botão 3: excluir histórico (só backups, confirmação dupla)');
ok(patch.indexOf('bk-mini-resumo') >= 0 && patch.indexOf('Próximo diário') >= 0, 'mini-resumo congelado dentro da gaveta');
ok(patch.indexOf('abrirTelaBackup') < 0, 'a telinha intermediária foi removida (o dono quer botões diretos)');
ok(patch.indexOf('pintarMenus') >= 0 && patch.indexOf('btn-backup-top') >= 0, 'wrap aponta o menu Backup pra gaveta');

// regressão: bundle mantém o módulo por último
const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
ok(man[man.length - 1] === 'ajustes_v52296_backups_nuvem_patch.js', 'patch de backups continua último no bundle');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.indexOf('DIGICOPY_BACKUPS') >= 0, 'card presente no app.bundle.js');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.100!');
