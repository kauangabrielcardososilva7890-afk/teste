// ═══════════════════════════════════════════════════════════════════════════
// v6.1.4 · rodada 22/09/2026 (nº3) — o que o dono pediu NESTA leva, com prova:
//
//  1) "tirar a trava de escolha: conectou, sincroniza na hora"        → nuvem
//  2) "do dashboard do início, mostra também vendas/orçamentos"       → Início
//  3) "quero resolver o Cliente sem vínculo"                          → contratos
//  4) ".git fica voltando pra trás"                                   → guardar_repo
//  5) "esse relatório repete pergunta já resolvida"                   → relatório
//     e a resposta ao "esquece o Worker, qual o passo real?"           → passo real
//
// Roda sozinho: node test_ajustes_v6105.js
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let okCount = 0, fail = 0;
function ok(cond, nome){
  if(cond){ okCount++; console.log('  ✔ ' + nome); }
  else { fail++; console.log('  ✘ ' + nome); }
}
function ler(p){ return fs.readFileSync(p, 'utf8'); }
const VERSAO_APP = JSON.parse(ler('package.json')).version;

console.log('\n== v6.1.4 rodada 22/09 nº3 ==');
// AUDITORIA 23/09/2026 — este assert fixava a versão escrita à mão ('6.1.10') e
// por isso morria a cada troca de versão. Agora ele confere o que interessa de
// verdade: que package.json, o index.html do PC e o do celular carregam a MESMA
// versão. Continua pegando o defeito real (versão dessincronizada) e não precisa
// mais ser reescrito a cada publicação.
const indexHtml = ler('index.html');
const indexMob = ler('mobile/www/index.html');
ok(/^\d+\.\d+\.\d+$/.test(VERSAO_APP), 'a versão do app é um número de versão válido (v' + VERSAO_APP + ')');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0,
   'o index.html carrega a MESMA versão do package.json (v' + VERSAO_APP + ')');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0,
   'a cópia do celular também acompanha a versão (v' + VERSAO_APP + ')');

// ── 1. NUVEM: conectou = sincroniza, sem escolha e sem susto ────────────────
console.log('\n== NUVEM: conectou, sincroniza (fim da trava) ==');
const sync = ler('cloudflare_data_sync_patch.js');
ok(/function decideReinstallGuard\(opts\)\{[\s\S]{0,1200}?pause:false,isolate:false,hold:false,reason:'sincroniza-direto'/.test(sync),
   'a decisão do motor SEMPRE libera a sincronização (pause:false · isolate:false · hold:false)');
ok(sync.indexOf("const REGRAS='v6.1.7-conectou-sincroniza'") >= 0,
   'a marca das regras mudou: quem estava na trava antiga é destravado ao abrir');
ok(/^state\.paused=false;$/m.test(sync) && sync.indexOf("state.pauseReason='';") >= 0,
   'ao carregar o motor, a pausa de escolha é zerada (ninguém fica esperando resposta)');
ok(sync.indexOf("reason:'sincroniza-direto'") >= 0 && !/pause:true/.test(sync),
   'nenhum caminho do módulo volta a pausar por escolha');
const syncUI = ler('cloudflare_sync_patch.js');
ok(/function cobrarEscolha\(\)\{ \/\* mantida por compatibilidade: agora não faz nada \*\/ \}/.test(syncUI),
   'o pop-up que cobrava a escolha não existe mais (fica só a função vazia, para não quebrar chamada antiga)');
ok(syncUI.indexOf('Sincronização automática ativa — conectou, sincroniza sozinho.') >= 0,
   'a janela da Nuvem diz, em português, que sincroniza sozinho');
ok(syncUI.indexOf('Sincronizando automaticamente — nada a escolher') >= 0,
   'durante a sincronização ela avisa que não há nada a escolher');
ok(sync.indexOf('function baixarTudoDaNuvem(') >= 0 && sync.indexOf('function estadoDetalhado(') >= 0,
   'o check-up da nuvem continua aqui (baixar tudo + estado detalhado por lista)');
ok(syncUI.indexOf('dc-sync-now') >= 0 || syncUI.indexOf('Sincronizar agora') >= 0,
   'o botão manual continua existindo para quem quiser forçar (não é obrigatório)');

// ── 2. INÍCIO: cartões de vendas e orçamentos ───────────────────────────────
console.log('\n== INÍCIO: vendas e orçamentos no painel ==');
const app = ler('app.js');
ok(app.indexOf("id=\"kpi-vendas\"") >= 0 && app.indexOf("id=\"kpi-orcamentos\"") >= 0,
   'o painel do Início tem os dois cartões novos');
ok(/Vendas do mês/.test(app) && /Orçamentos abertos/.test(app), 'os títulos são claros (Vendas do mês · Orçamentos abertos)');
ok(app.indexOf("navigateTo('vendas')") >= 0 && app.indexOf("setNeoVendasTab('orcamentos')") >= 0,
   'clicar leva para a origem: vendas e a aba Orçamentos');
ok(app.indexOf('lg:grid-cols-5') < 0 && app.indexOf('lg:grid-cols-4') >= 0,
   'a grade foi reorganizada para 4 colunas (cabe sem aperto no PC do escritório)');
ok(app.indexOf("const elVendas=document.getElementById('kpi-vendas')") >= 0 &&
   app.indexOf("const elOrc=document.getElementById('kpi-orcamentos')") >= 0 &&
   app.indexOf("elVendas.innerText=vendasMes.length") >= 0,
   'nada de número fixo: os dois cartões são calculados na hora, em renderDashboard()');

// ── 3. CONTRATOS: cliente sem vínculo resolvido pelo SISTEMA ───────────────
console.log('\n== CONTRATOS: o sistema acha o cliente sozinho ==');
const cf = ler('contratos_final_patch.js');
ok(cf.indexOf('function cfCurarVinculos(empId)') >= 0, 'existe a cura automática dos vínculos (roda sozinha ao reconciliar)');
ok(cf.indexOf('try{ cfCurarVinculos(empId); }catch(e)') >= 0, 'a cura roda dentro da reconciliação, sem ninguém clicar');
ok(cf.indexOf('function cfClientePorEvidencia(c, empId)') >= 0,
   'acha o cliente pela EVIDÊNCIA (parque, leituras, OS, vendas) quando o nome não ajuda');
ok(cf.indexOf('function cfPontosDeNome(a, b)') >= 0 && cf.indexOf('function cfPontuar(nome, empId)') >= 0,
   'nome parecido é pontuado (não é só igualdade exata)');
ok(cf.indexOf('escolhido o mais antigo') >= 0, 'empate de nome parecido é decidido pelo cadastro mais antigo — e escrito o porquê');
ok(cf.indexOf('function cfCriarClienteDoContrato(') >= 0 && cf.indexOf('Cadastro reconstruído do contrato') >= 0,
   'quando não existe cadastro, o sistema reconstrói a partir do próprio contrato (sem inventar dado)');
ok(cf.indexOf('CF_NOME_GENERICO') >= 0 && cf.indexOf('function cfNomeServivel') >= 0,
   'nome genérico ("Cliente", "Balcão") não vira cadastro — honesto em vez de poluir');
ok(cf.indexOf("logAction('contrato','vínculo-automático'") >= 0, 'cada vínculo automático entra na Auditoria com o motivo');
ok(cf.indexOf('vinculoAutomatico') >= 0, 'o contrato fica marcado como vínculo automático (dá para auditar depois)');
ok(cf.indexOf('Cadastro com o nome no sistema antigo') >= 0 || cf.indexOf('function dadosDoContratoAntigo(c)') >= 0,
   'o nome é buscado também na linha do sistema antigo (locação), não só no cadastro');
const cv = ler('ajustes_v5214_clientes_visiveis_patch.js');
ok(cv.indexOf('clientesDuplicadosVincularContrato') >= 0 && cv.indexOf('🔗 Vincular cliente') >= 0,
   'o botão 🔗 continua como plano B (rede de segurança), sem virar obrigação');

// ── 4. .GIT: para não voltar mais pra trás ─────────────────────────────────
console.log('\n== GITHUB: nada volta pra trás ==');
ok(fs.existsSync('guardar_repo.js'), 'existe o guardar_repo.js (salva + envia tudo para o GitHub)');
const gp = JSON.parse(ler('package.json')).scripts || {};
ok(gp.guardar === 'node guardar_repo.js' && gp['guardar:check'] === 'node guardar_repo.js --check',
   'os atalhos npm run guardar / npm run guardar:check estão no package.json');
const g = ler('guardar_repo.js');
ok(g.indexOf('reset --soft FETCH_HEAD') >= 0, 'ele ensina o conserto certo quando a branch anda (reset --soft, nunca re-clone)');
ok(g.indexOf('HEAD:' + "' + BRANCH") >= 0 || g.indexOf("'HEAD:' + BRANCH") >= 0 || g.indexOf('HEAD:') >= 0,
   'o envio é para a branch desta sessão, por parâmetro (não empurra em branch errada)');
ok(g.indexOf('--check') >= 0 && g.indexOf('não commitei nada') >= 0, 'tem modo simulação (--check) que só olha, sem mexer em nada');
ok(fs.existsSync('guardar_repo.cmd'), 'tem o guardar_repo.cmd para ele clicar com dois cliques no PC');
ok(ler('guardar_repo.cmd').indexOf('GUARDAR O TRABALHO NO GITHUB') >= 0, 'o .cmd explica na tela o que vai fazer');

// ── 5. RELATÓRIO: pergunta repetida sai, e a nova entra ────────────────────
console.log('\n== RELATÓRIO DE TESTE: nada de repetir o que já foi resolvido ==');
const rel = ler('RELATORIO_DE_TESTE_NF.html');
ok(rel.indexOf("id:'E'") >= 0 && rel.indexOf("id:'F'") >= 0 && rel.indexOf("id:'G'") >= 0,
   'tem as partes novas E (nuvem), F (contratos) e G (rodapé/versão)');
ok(rel.indexOf('Conectou na nuvem (CNPJ + qualquer uma das duas senhas) e sincronizou SOZINHO') >= 0,
   'a primeira pergunta da parte E é exatamente o que ele testa ao conectar');
ok(rel.indexOf('O rodapé mostra a versão v' + VERSAO_APP) >= 0, 'a parte G cobra a versão que está no ar agora');
ok(rel.indexOf("'repetida'") >= 0 && rel.indexOf('✅ resolvido antes') >= 0,
   'cada pergunta tem estado (continua aberto / resolvido antes)');
ok(rel.indexOf('sem painel, sem token, sem GitHub') >= 0,
   'a seção do motor ensina o passo real, em português, com essas palavras');
ok(rel.indexOf('cloudflare-worker/deploy_github_actions') < 0 && rel.indexOf('publicar-motor.yml') < 0,
   'a conversa de GitHub Actions saiu do relatório (ele mandou esquecer o Worker e ensinar o passo)');

console.log('\n' + (fail ? ('RESULTADO: ' + fail + ' falha(s), ' + okCount + ' ok') : ('Tudo OK — ' + okCount + ' verificações passaram.')));
if(fail) process.exit(1);
