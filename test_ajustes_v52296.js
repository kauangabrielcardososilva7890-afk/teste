// Teste v5.23.8 — aba Backup normal + menu sempre abre a aba (modelo do sistema de menus + captura ampliada) + painel Nuvem mostra o uso
// (diário 18:30 + a cada atualização + reforço manual), tabela só de backups,
// compactado; baixar-todos (zip com pastas) e excluir-backups só do admin.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.23.8 — menu Backup sempre abre a aba (modelo+captura) ==');

const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const wrangler = fs.readFileSync('cloudflare-worker/wrangler.jsonc', 'utf8');
const patch = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
const sync = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const readme = fs.readFileSync('cloudflare-worker/README.md', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

// 1) duas pastas separadas, nomes do desenho do dono
ok(worker.indexOf("const PASTA_DIARIO = 'Backup diario'") >= 0, 'pasta "Backup diario"');
ok(worker.indexOf("const PASTA_ATUALIZACOES = 'Backup atualizações'") >= 0, 'pasta "Backup atualizações"');
ok(worker.indexOf("const PASTA_MANUAL = 'Backup manual'") >= 0, 'pasta "Backup manual" (reforço)');
ok(worker.indexOf("PASTA_DIARIO + '/Backup '") >= 0 && worker.indexOf("PASTA_ATUALIZACOES + '/Backup sistema '") >= 0, 'cada ciclo grava na SUA pasta');

// 2) guarda dentro da nuvem que ele já usa (sem precisar habilitar R2)
ok(wrangler.indexOf('r2_buckets') < 0, 'R2 removido do deploy (nada de ativar plano/cartão)');
ok(wrangler.indexOf('"30 21 * * *"') >= 0, 'relógio 21:30 UTC = 18:30 São Paulo mantido');
ok(worker.indexOf('x-digicopy-versao, x-digicopy-usuario-login, x-digicopy-usuario-prova') >= 0, 'CORS autoriza versão + prova do usuário (senão o navegador bloqueava o preflight e a nuvem ficava "ocupada"/"sem conexão" eternamente)');
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
ok(patch.indexOf('📥 Baixar todos os backups (.zip)') >= 0 && patch.indexOf('🗑️ Excluir todos os backups da nuvem') >= 0, 'botões de baixar-todos e excluir-todos (rótulos novos do modelo do dono)');
ok(patch.indexOf('Backup diario') >= 0 && patch.indexOf('Backup atualizações') >= 0, 'card mostra as duas pastas');

// 8) instruções da nuvem sem armadilha de cartão
ok(readme.indexOf('## Backups automáticos (v5.22.97)') >= 0, 'README documenta os dois ciclos e as pastas');
ok(readme.indexOf('r2 bucket') < 0, 'README não manda mais criar balde (não precisa ativar R2)');
ok(readme.indexOf('npx wrangler deploy') >= 0, 'README: um comando só basta');

// 9) aba Backup NORMAL (igual às outras, nada de gaveta/dropdown voador)
ok(patch.indexOf('gavetaAbrirFechar') < 0 && patch.indexOf('bk-menu-gaveta') < 0, 'gaveta flutuante removida de vez');
ok(patch.indexOf('abrirTelaBackup') >= 0 && patch.indexOf("bkSetModal('Backup do sistema'") >= 0, 'menu Backup abre a aba normal "Backup do sistema" (v5.23.8: modal próprio bkSetModal)');
ok(patch.indexOf('3 jeitos') >= 0 && patch.indexOf('18:30') >= 0 && patch.indexOf('a cada atualização') >= 0, 'aba explica os 3 jeitos de backup');
ok(patch.indexOf('📸 Backup manual (nuvem + baixa no PC)') >= 0, 'botão 1: backup manual FAZ OS DOIS (nuvem + PC)');
ok(patch.indexOf('acaoBackupManual') >= 0 && patch.indexOf('baixarUmBackup(chave)') >= 0, 'manual: guarda na nuvem e baixa em seguida');
ok(patch.indexOf('📥 Baixar todo histórico de backup') >= 0 || patch.indexOf('📥 Baixar todos os backups') >= 0, 'botão 2: baixar histórico');
ok(patch.indexOf('🗑️ Excluir todos os backups da nuvem') >= 0 && patch.indexOf('Excluir <b>') >= 0 && patch.indexOf('Última confirmação') >= 0, 'botão 3: excluir backups com DUAS confirmações (uma já sugere baixar o .zip antes)');
ok(patch.indexOf('bk-pc-baixar') < 0 && patch.indexOf('Backup no PC') < 0 && patch.indexOf('bk-rest-arq') >= 0, 'v5.24.0: botão local duplicado ("Baixar backup para este PC") fora; restaurar por arquivo fica');
ok(patch.indexOf("__v52301bkClick") >= 0 && patch.indexOf("addEventListener('click'") >= 0 && patch.indexOf("closest('#btn-backup-top')") >= 0, 'menu Backup: clique interceptado por captura (sempre abre a aba)');
ok(patch.indexOf("button[onclick]") >= 0 && patch.indexOf('exportBackup') >= 0 && patch.indexOf('.module-menu') >= 0, 'captura cobre botões de menu sem id (onclick clássico)');
const menus = fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js', 'utf8');
ok(menus.indexOf("{id:'backup'") >= 0 && menus.indexOf("click:'window.abrirTelaBackup ? abrirTelaBackup() : exportBackup()'") >= 0, 'modelo do sistema de menus: Backup abre a aba (todas as pinturas)');
ok(index.indexOf('window.abrirTelaBackup ? abrirTelaBackup() : exportBackup()') >= 0, 'index.html: menu Backup chama a aba (fallback so se patch ausente)');
ok(sync.indexOf('dc-uso-nuvem') >= 0 && sync.indexOf('dc-uso-barra') >= 0 && sync.indexOf('dc-uso-css') >= 0, 'bloco de uso legível no modo escuro (css dedicado)');
ok(worker.indexOf('waitUntil') >= 0, 'worker: anota\u00e7\u00e3o de uso em segundo plano (waitUntil)');

// 10) painel Nuvem mostra quanto já usou (X de 100.000 / Y de 5.000.000)
ok(sync.indexOf('📊 Uso da nuvem hoje') >= 0 && sync.indexOf('usoHoje') >= 0, 'bloco "Uso da nuvem hoje" no painel Nuvem');
ok(sync.indexOf("'+fmtNum(uso.tetoEscritas)+'") >= 0 && sync.indexOf('uso.tetoLeituras') >= 0, 'mostra X de 100.000 e Y de 5.000.000');
ok(worker.indexOf('uso_diario') >= 0 && worker.indexOf('somarUso') >= 0, 'worker conta gravações/leituras por dia (tabela autocriada)');
ok(worker.indexOf('tetoEscritas: 100000') >= 0 && worker.indexOf('tetoLeituras: 5000000') >= 0, 'tetos do plano grátis D1 fixados (vira 21h SP)');
ok(worker.indexOf('usoHoje:') >= 0 && worker.indexOf('uso_real') >= 0 && worker.indexOf('fonte: \'estimada\'') >= 0, 'status da nuvem devolve o uso do dia (oficial > estimada)');

// 11) tranca inline no index.html (antes do bundle carregar — à prova de cache)
ok(index.indexOf('tranca do menu Backup') >= 0 && index.indexOf("document.addEventListener('click'") >= 0, 'index.html carrega a tranca de clique do Backup inline');
ok(index.indexOf('Carregando a aba Backup') >= 0, 'tranca avisa (nunca baixa) se a aba ainda não carregou');

// 12) v4 da captura: reconhece o Backup até por posição no topo e rótulo
ok(patch.indexOf('getBoundingClientRect') >= 0 && patch.indexOf('rc.top < 90') >= 0 || patch.indexOf('.top < 90') >= 0, 'captura v4: botão antigo no topo da tela é do menu');
ok(patch.indexOf('backup($|\\s|c[oó]pia)') >= 0, 'captura v4: também reconhece pelo rótulo/título "Backup"');
ok(index.indexOf('rc.top < 90') >= 0 && index.indexOf('backup($|\\s|c[oó]pia)') >= 0, 'tranca inline com a mesma lógica v4');

// 13) index separado do dono: mini-worker mede OFICIAL e grava na própria nuvem
ok(fs.existsSync('cloudflare-contador/src/index.js') && fs.existsSync('cloudflare-contador/wrangler.jsonc'), 'mini-worker contador-uso existe (index separado pra implantar)');
const contador = fs.readFileSync('cloudflare-contador/src/index.js', 'utf8');
ok(contador.indexOf('uso_real') >= 0 && contador.indexOf('d1AnalyticsAdaptiveGroups') >= 0, 'contador mede no GraphQL oficial e grava uso_real no D1');
ok(worker.indexOf('uso_real WHERE dia = ?') >= 0 && worker.indexOf("fonte: 'oficial'") >= 0, 'worker principal prefere o medidor oficial quando existe');
ok(sync.indexOf('medidor oficial da sua conta Cloudflare') >= 0, 'painel mostra quando o número é oficial');

// 14) v5.23.3 — ele não aguentava mais: exportBackup (e importBackup) agora abrem a aba
ok(patch.indexOf("window.exportarBackupJSON") >= 0 && patch.indexOf("window.exportBackup = function(){ abrirTelaBackup(); }") >= 0, 'QUALQUER chamada a exportBackup (menu/restaurados/telas) abre a aba; JSON cru em exportarBackupJSON');
ok(patch.indexOf("window.importBackup = function(){ abrirTelaBackup(); }") >= 0, 'botões antigos de restauro também abrem a aba');

// 15) Restaurar backup voltou — dentro da própria aba (substituir/somar, com prévia)
ok(patch.indexOf('bk-rest-arq') >= 0 && patch.indexOf('preencherBanco') >= 0, 'aba tem restaurar (arquivo → prévia → substituir/somar)');
ok(patch.indexOf('LISTAS_DB') >= 0 && patch.indexOf('ehFormatoBackup') >= 0, 'restauro valida formato do backup antes de restaurar');

// 16) v5.23.8 — nuvem responde qual código roda nela (/health e /v1/status)
ok(worker.indexOf("const WORKER_VERSION = '5.24.4'") >= 0 && worker.indexOf('versao: WORKER_VERSION') >= 0, '/health carimba a versão da nuvem');
ok(worker.indexOf('workerVersao: WORKER_VERSION') >= 0, '/v1/status também devolve a versão do worker');
ok(sync.indexOf('linhaVersaoNuvem') >= 0 && sync.indexOf('código da nuvem está ANTIGO') >= 0, 'painel avisa quando a nuvem está velha (falta deploy)');

// 17) v5.23.8 — medidor oficial SEM cronômetro: mede quando o dono abre a tela (pedido dele)
const contadorCfg = fs.readFileSync('cloudflare-contador/wrangler.jsonc', 'utf8');
ok(contadorCfg.indexOf('"crons": []') >= 0, 'contador sem agendamento (lista de crons vazia = deploy remove o cronômetro de 15min)');
ok(sync.indexOf('MEDIDOR_OFICIAL_URL') >= 0 && sync.indexOf('__dcUltPingMedidor') >= 0 && sync.indexOf('window.DC_chamarMedidorOficial') >= 0, 'app cutuca o medidor ao abrir a tela (sem token no sistema, trava de 3 min)');
ok(sync.indexOf('const medidoAgora = await chamarMedidorOficial()') >= 0 && sync.indexOf('medido agora, na abertura desta tela') >= 0, 'tela mede ANTES de pedir o status e avisa "medido agora, na abertura desta tela"');
ok(patch.indexOf('window.DC_chamarMedidorOficial') >= 0, 'menu Backup também dispara a medida ao abrir');

// regressão: bundle mantém o módulo por último
const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
ok(man[man.length - 3] === 'ajustes_v52296_backups_nuvem_patch.js' && man[man.length - 2] === 'ajustes_v5240_relatorio_grande_patch.js' && man[man.length - 1] === 'ajustes_v5243_cliente_abas_patch.js', 'patch de backups continua no fim do bundle (3º a partir do fim; v5.24.0 depois, v5.24.3 fecha a fila)');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.indexOf('DIGICOPY_BACKUPS') >= 0, 'card presente no app.bundle.js');

// 19) v5.23.8 — menu Backup nunca mais mudo: no bundle, setModal dos outros patches fica preso no bloco try{} (não vira global) e o fallback antigo chamava exportBackup (= a própria aba) → recursão engolida
ok(patch.indexOf('function bkSetModal') >= 0 && patch.indexOf('window.bkFecharTelaBackup') >= 0, 'aba Backup tem modal próprio (bkSetModal) + fechamento próprio');
ok(patch.indexOf("try{ window.exportBackup(); }catch(e){} return;") < 0, 'fallback recursivo (exportBackup→abrirTelaBackup→exportBackup…) eliminado da aba');
ok(bundle.indexOf('function bkSetModal') >= 0 && bundle.indexOf('bkFecharTelaBackup()') >= 0, 'bundle hotpatch recebeu o modal próprio também');

// 20) v5.23.8 — tela Backup bonita no modo escuro (classes + CSS digi-escuro com !important sobre estilo inline)
ok(patch.indexOf('garantirCssBk') >= 0 && patch.indexOf('bk-aba-css') >= 0, 'CSS escuro da tela Backup injetado UMA vez');
ok(patch.indexOf('html.digi-escuro .bk-sec') >= 0 && patch.indexOf('bk-msg-erro') >= 0 && patch.indexOf('html.digi-escuro .bk-card') >= 0, 'regras escuras p/ seções, cartões e avisos');
ok(patch.indexOf('class="bk-aba"') >= 0 && patch.indexOf('class="bk-sec-head"') >= 0 && patch.indexOf('bk-dashed') >= 0, 'tela Backup classificada para o tema');
ok(bundle.indexOf('bk-aba-css') >= 0 && bundle.indexOf('digi-escuro .bk-card') >= 0, 'bundle carrega o modo escuro da tela Backup');

// 21) v5.23.8 — tela Backup no modelo do dono: 3 botões (manual → zip → excluir) + cura do 403 escrita no aviso + auto-backup de atualização é do worker
ok(patch.indexOf('id="bk-atualizar"') < 0 && bundle.indexOf('id="bk-atualizar"') < 0, 'sem botão Atualizar (a lista recarrega sozinha ao abrir/após ações)');
ok(patch.indexOf('📸 Backup manual (nuvem + baixa no PC)') >= 0 && patch.indexOf('📸 Backup manual (nuvem + baixa no PC)') < patch.indexOf('📥 Baixar todos os backups (.zip)') && patch.indexOf('📥 Baixar todos os backups (.zip)') < patch.indexOf('🗑️ Excluir todos os backups da nuvem'), 'exatamente 3 botões na ordem do dono: manual → zip → excluir');
ok(patch.indexOf('UPDATE devices SET role') < 0 && patch.indexOf('Seu USUÁRIO não tem cargo Admin') >= 0, 'v5.24.1: aviso de 403 agora diz que vale o USUÁRIO (não o aparelho)');
ok(worker.indexOf('checarTrocaDeVersao') >= 0 && worker.indexOf('nomeBackupSistema') >= 0, 'backup a-cada-atualização roda sozinho no worker (foto da versão anterior)');
ok(patch.indexOf('Só o aparelho administrador pode mexer nos backups') < 0 || patch.indexOf('Pra liberar, rode UMA vez') >= 0, 'mensagem velha substituída pela orientação');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.23.8!');
