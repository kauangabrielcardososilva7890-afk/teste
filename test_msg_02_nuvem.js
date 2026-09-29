// ═══════════════════════════════════════════════════════════════
// test_msg_02_nuvem.js — GERADO por migrar_testes_r57.js; 43 seções (42 geradas + 1 append r57).
// Novos testes do tema: APPEND no fim (copiar um bloco if(false){ + SEÇÃO).
// Seções: test_persist.js, test_nuvem_antiga_removida.js, test_sync_quota_guard.js, test_cloudflare_sync.js, test_cloudflare_data_sync.js, test_indexeddb_persistence.js, test_build_sync.js, test_ajustes_v5226.js, test_ajustes_v5227.js, test_ajustes_v52212.js, test_ajustes_v52228.js, test_ajustes_v52233.js, test_ajustes_v52246.js, test_ajustes_v52257.js, test_ajustes_v52269.js, test_ajustes_v52270.js, test_ajustes_v52271.js, test_ajustes_v52272.js, test_ajustes_v52274.js, test_ajustes_v52275.js, test_ajustes_v52276.js, test_ajustes_v52277.js, test_ajustes_v52278.js, test_ajustes_v52280.js, test_ajustes_v52292.js, test_ajustes_v6004.js, test_exe_so_nuvem.js, test_sync_tela_ao_vivo.js, test_recuperar_excluidos.js, test_tela_nao_seca.js, test_nuvem_rapida.js, test_exclusao_nao_volta.js, test_recuperacao_completa.js, test_recuperacao_nao_ressuscita.js, test_worker_publico.js, checar_cota_nuvem.js, test_ajustes_v5240.js, test_ajustes_v52415.js, test_ajustes_v52419.js, test_ajustes_v52420.js, test_zerar_deadlock_r50.js, test_r56_zerar_aparelhos.js, test_r57_wipe_local.js
// ═══════════════════════════════════════════════════════════════
// Runner do tema: extrai cada SEÇÃO, roda isolada em processo filho
// (comportamento idêntico ao arquivo solto) e agrega o resultado.
// Seções abaixo vão dentro de if (false){} = INERTES (só parse, nunca executa).
// Novo teste do tema: APPEND bloco no fim, copiando o formato (if + 2 marcadores).
const __fs = require('fs');
const __cp = require('child_process');
const __self = __fs.readFileSync(__filename, 'utf8');
const __partes = [];
const __re = /\/\/<<<<SECAO:([^:]+):INICIO>>>>\r?\n([\s\S]*?)\/\/<<<<SECAO:\1:FIM>>>>/g;
let __m;
while ((__m = __re.exec(__self))) __partes.push({ nome: __m[1], codigo: __m[2] });
if (!__partes.length) { console.error('Tema sem seções!'); process.exit(1); }
const __falhas = [];
__partes.forEach((__s, __i) => {
  console.log('\n── ' + __s.nome + ' ──');
  const __tmp = '.tmp_secao_' + process.pid + '_' + __i + '.js';
  try {
    __fs.writeFileSync(__tmp, __s.codigo);
    const __r = __cp.spawnSync(process.execPath, [__tmp], { stdio: 'inherit' });
    if (__r.status !== 0 || __r.error) __falhas.push(__s.nome);
  } finally { try { __fs.unlinkSync(__tmp); } catch (e) {} }
});
if (__falhas.length) { console.error('\nTEMA FALHOU (' + __falhas.length + ' seções): ' + __falhas.join(', ')); process.exit(1); }
console.log('\nTEMA OK: ' + __partes.length + ' seções.');

if (false) { // ═══ test_persist.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_persist.js:INICIO>>>>
// Teste da persistência local incremental do app.js (v4.4.0)
// Simula window/localStorage e extrai o trecho de persistência do app.js.
// Uso: node test_persist.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/app.js', 'utf8');
const ini = src.indexOf("const APP_VERSION=");
const fim = src.indexOf("let db=loadDB();");
if(ini<0 || fim<0){ console.error('FALHOU: trecho de persistência não encontrado no app.js'); process.exit(1); }
const trecho = src.slice(ini, fim) + "let db=loadDB();";

// ── Ambiente simulado ──
function novoLocalStorage(){
  const map = new Map();
  return {
    _map: map,
    gravacoes: [],
    getItem(k){ return map.has(k) ? map.get(k) : null; },
    setItem(k,v){ this.gravacoes.push(String(k)); map.set(String(k), String(v)); },
    removeItem(k){ map.delete(String(k)); },
  };
}
let pass = 0, fail = 0;
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

function novaInstancia(){
  const ls = novoLocalStorage();
  const window = { __dbPersistidoOk:false };
  const toast = ()=>{};
  const document = { addEventListener(){}, visibilityState:'visible' };
  const fn = new Function('localStorage','window','toast','document',
    trecho + '\nreturn {db, saveDB:()=>{saveDB(); __saveDBDrainSync();}, loadDB, gravarSnapshotLegado, DB_KEY, DB_MANIFEST_KEY, DB_PART_PREFIX, storageEncode};');
  return Object.assign(fn(ls, window, toast, document), {ls, window});
}

console.log('== 1ª gravação: cria manifesto e partes ==');
{
  const A = novaInstancia();
  A.db.clientes.push({id:'c1', nome:'Padaria Central'});
  A.saveDB();
  ok('manifesto criado', !!A.ls.getItem(A.DB_MANIFEST_KEY));
  ok('parte de clientes criada', !!A.ls.getItem(A.DB_PART_PREFIX+'clientes__'+encodeURIComponent('#0')));
  const rec = A.loadDB();
  ok('relê o cliente gravado', rec.clientes.length===1 && rec.clientes[0].nome==='Padaria Central');
}

console.log('== Incremental: sem mudança não regrava partes ==');
{
  const A = novaInstancia();
  A.db.vendas.push({id:'v1', total:10});
  A.saveDB();
  A.ls.gravacoes.length = 0;
  A.saveDB(); // nenhuma mudança
  const partesRegravadas = A.ls.gravacoes.filter(k=>k.startsWith(A.DB_PART_PREFIX));
  ok('nenhuma parte regravada', partesRegravadas.length===0);
  ok('manifesto atualizado só', A.ls.gravacoes.includes(A.DB_MANIFEST_KEY));
}

console.log('== Incremental: mudança em 1 entidade só regrava ela ==');
{
  const A = novaInstancia();
  for(let i=0;i<1500;i++) A.db.leituras.push({id:'l'+i, valor:i});
  A.db.clientes.push({id:'c1'});
  A.saveDB();
  const partesLeiturasAnt = A.ls.gravacoes.filter(k=>k.includes('leituras'));
  ok('lista grande virou 3 pedaços (1500/600)', partesLeiturasAnt.length===3);
  A.ls.gravacoes.length = 0;
  A.db.clientes.push({id:'c2'});           // só clientes mudou
  A.saveDB();
  const partes = A.ls.gravacoes.filter(k=>k.startsWith(A.DB_PART_PREFIX));
  ok('só pedaço de clientes regravado', partes.length===1 && partes[0].includes('clientes'));
  ok('nada de leituras regravado', !partes.some(k=>k.includes('leituras')));
}

console.log('== Pedaço interno: editar 1 item só regrava 1 pedaço da lista ==');
{
  const A = novaInstancia();
  for(let i=0;i<1500;i++) A.db.leituras.push({id:'l'+i, valor:i});
  A.saveDB();
  A.ls.gravacoes.length = 0;
  A.db.leituras[1200].valor = 99999;        // item no pedaço #2
  A.saveDB();
  const partes = A.ls.gravacoes.filter(k=>k.startsWith(A.DB_PART_PREFIX));
  ok('apenas o pedaço #2 regravado', partes.length===1 && partes[0].includes('leituras__'+encodeURIComponent('#2')));
  const rec = A.loadDB();
  ok('relê todas as 1500 leituras montadas dos pedaços', rec.leituras.length===1500 && rec.leituras[1200].valor===99999);
}

console.log('== Lista encolhendo: pedaços órfãos são apagados ==');
{
  const A = novaInstancia();
  for(let i=0;i<1500;i++) A.db.leituras.push({id:'l'+i});
  A.saveDB();
  A.db.leituras = A.db.leituras.slice(0, 500);
  A.saveDB();
  const rec = A.loadDB();
  ok('relê somente 500', rec.leituras.length===500);
  const chaves = [...A.ls._map.keys()].filter(k=>k.includes('leituras'));
  ok('ficou apenas o pedaço #0', chaves.length===1 && chaves[0].includes(encodeURIComponent('#0')));
}

console.log('== Objetos grandes (modulosDinamicos): 1 pedaço por chave ==');
{
  const A = novaInstancia();
  for(let i=0;i<10;i++) A.db.modulosDinamicos['tabela_'+i] = {dados:[{a:i}]};
  A.saveDB();
  A.ls.gravacoes.length = 0;
  A.db.modulosDinamicos['tabela_5'] = {dados:[{a:'ALTERADO'}]};
  A.saveDB();
  const partes = A.ls.gravacoes.filter(k=>k.startsWith(A.DB_PART_PREFIX));
  ok('só a chave alterada regravada', partes.length===1 && partes[0].includes('tabela_5'));
  const rec = A.loadDB();
  ok('objeto remontado com as 10 tabelas', Object.keys(rec.modulosDinamicos).length===10 && rec.modulosDinamicos['tabela_5'].dados[0].a==='ALTERADO');
}

console.log('== Ciclo completo: simular reload (nova instância no MESMO storage) ==');
{
  const A = novaInstancia();
  A.db.vendas.push({id:'v99', total:321});
  A.saveDB();
  // nova instância compartilhando o mesmo Map = reabrir o programa
  const B = (function(ls){
    const window = { __dbPersistidoOk:false };
    const fn = new Function('localStorage','window','toast','document',
      trecho + '\nreturn {db, loadDB, DB_KEY, DB_MANIFEST_KEY, DB_PART_PREFIX};');
    return fn(ls, window, ()=>{}, {addEventListener(){}, visibilityState:'visible'});
  })(A.ls);
  ok('db carregado das partes ao reabrir', B.db.vendas.length===1 && B.db.vendas[0].id==='v99');
}

console.log('== Fallback: base antiga de chave única (pré v4.4.0) continua lendo ==');
{
  const A = novaInstancia();
  const antigo = Object.assign({}, A.db, {clientes:[{id:'cx', nome:'Legado'}]});
  A.ls.setItem(A.DB_KEY, JSON.stringify(antigo));     // só a chave única antiga, sem manifesto
  A.ls.removeItem(A.DB_MANIFEST_KEY);
  const rec = A.loadDB();
  ok('lê a chave antiga', rec.clientes.length===1 && rec.clientes[0].nome==='Legado');
}

console.log(`\nRESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
//<<<<SECAO:test_persist.js:FIM>>>>
}

if (false) { // ═══ test_nuvem_antiga_removida.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_nuvem_antiga_removida.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — a nuvem antiga (Google Firebase / Supabase) está REMOVIDA
//
// Histórico: o sistema já usou Supabase e depois Google Firebase. Hoje a nuvem
// é Cloudflare Worker + D1. Sobravam arquivos mortos do transporte antigo que
// não entravam no bundle nem no .exe, mas ficavam no repositório confundindo
// buscas e o scanner de segredos do GitHub.
//
// Na v5.22.63 esses arquivos foram APAGADOS. Este teste impede que voltem.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }

const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

console.log('== NUVEM ANTIGA REMOVIDA ==');

// ── 1. Os arquivos do transporte antigo não existem mais ────────────────────
const APAGADOS = [
  'sync_client.js',            // motor Supabase/Firebase legado
  'sync_realtime_patch.js',    // motor automático Firebase
  'limpar_nuvem_patch.js',     // compatibilidade do legado
  'ajustes_v52025_patch.js',   // diagnóstico de erros do Firebase
  'firebase_config.js',
  'firebase_client.js'
];
for (const f of APAGADOS) ok('apagado: ' + f, !fs.existsSync(f));

// ── 2. Nada no bundle referencia esses arquivos ─────────────────────────────
const noBundle = APAGADOS.filter(f => manifest.includes(f));
ok('nenhum deles está no bundle-manifest.json' + (noBundle.length ? ' → ' + noBundle.join(', ') : ''),
   noBundle.length === 0);

const fontes = manifest.filter(f => fs.existsSync(f));
const citando = [];
for (const arq of fontes) {
  const s = fs.readFileSync(arq, 'utf8');
  for (const morto of APAGADOS) {
    if (s.indexOf(morto) >= 0) citando.push(arq + ' cita ' + morto);
  }
}
ok('nenhum arquivo do bundle cita os apagados' + (citando.length ? ' → ' + citando.join('; ') : ''),
   citando.length === 0);

// ── 3. Nenhuma chave de API do Google no código ─────────────────────────────
// (a chave antiga ficou só no histórico do git; precisa ser revogada no
//  console do Google — o código atual não pode ter nenhuma.)
const reChave = /AIza[0-9A-Za-z_-]{30,}/;
const comChave = fontes.filter(f => reChave.test(fs.readFileSync(f, 'utf8')));
ok('nenhuma chave AIza... no código' + (comChave.length ? ' → ' + comChave.join(', ') : ''),
   comChave.length === 0);

// ── 4. Nenhum endpoint da nuvem antiga ──────────────────────────────────────
const reEndpoint = /firebaseio\.com|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|\.supabase\.co/;
const comEndpoint = fontes.filter(f => reEndpoint.test(fs.readFileSync(f, 'utf8')));
ok('nenhum endpoint Firebase/Supabase no código' + (comEndpoint.length ? ' → ' + comEndpoint.join(', ') : ''),
   comEndpoint.length === 0);

// ── 5. A nuvem atual continua no lugar ──────────────────────────────────────
ok('painel Cloudflare no bundle', manifest.includes('cloudflare_sync_patch.js'));
ok('motor de dados Cloudflare no bundle', manifest.includes('cloudflare_data_sync_patch.js'));
ok('persistência IndexedDB no bundle', manifest.includes('indexeddb_persistence_patch.js'));

// ── 6. Nenhum .zip volta para o repositório ─────────────────────────────────
const zips = fs.readdirSync('.').filter(f => f.endsWith('.zip'));
ok('nenhum .zip no repositório' + (zips.length ? ' → ' + zips.join(', ') : ''), zips.length === 0);
ok('.gitignore bloqueia .zip sem exceções', (() => {
  const g = fs.readFileSync('.gitignore', 'utf8');
  return g.indexOf('*.zip') >= 0 && !/^!.*\.zip$/m.test(g);
})());

console.log('\nRESULTADO: nuvem antiga removida!');
//<<<<SECAO:test_nuvem_antiga_removida.js:FIM>>>>
}

if (false) { // ═══ test_sync_quota_guard.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_sync_quota_guard.js:INICIO>>>>
const fs = require('fs');
function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exitCode = 1; }
  else console.log('  ✔ ' + name);
}
const cloud = fs.readFileSync('cloudflare_sync_patch.js','utf8');
const cloudData = fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
console.log('== PROTEÇÃO DE COTA DO SYNC ==');
// v5.22.63: o motor legado (sync_client.js) e sua camada de compatibilidade
// (limpar_nuvem_patch.js) foram APAGADOS — não há mais timer legado possível.
ok('motor legado apagado', !fs.existsSync('sync_client.js'));
ok('compatibilidade do legado apagada', !fs.existsSync('limpar_nuvem_patch.js'));
ok('painel Cloudflare não faz polling escondido', !/setInterval\s*\(/.test(cloud));
ok('motor Cloudflare não usa setInterval', !/setInterval\s*\(/.test(cloudData));
ok('repouso faz uma consulta incremental por ciclo', /if\(totalSent>0\)await pullAll\(\)/.test(cloudData));
ok('Cloudflare está carregada', manifest.includes('cloudflare_sync_patch.js') && manifest.includes('cloudflare_data_sync_patch.js'));
ok('Firebase automático apagado', !fs.existsSync('sync_realtime_patch.js') && !manifest.includes('sync_realtime_patch.js'));

// v6.1.11 — AUDITORIA: o freio preventivo de cota (Worker v5.24.5) devolve 429 com
// `quota:true` e o recado no campo `error`. O cliente lia o texto só de
// `message`/`aviso`, então o recado chegava como "Erro HTTP 429", o
// ehLimiteDiario NÃO reconhecia e o app ficava batendo na porta (4 tentativas por
// rodada) + inflando o contador de escrita da nuvem, em vez de dormir até a
// virada. Estes asserts prendem as TRÊS pontas do encanamento.
const worker = fs.readFileSync('cloudflare-worker/src/index.js','utf8');
console.log('== FREIO PREVENTIVO DE COTA (Worker -> cliente) ==');
ok('worker marca a pausa com quota:true', /quota:\s*true/.test(worker));
ok('worker devolve a pausa em 429', /quota:\s*true[^}]*\},\s*429\)/.test(worker));
ok('cliente preserva a marca quota no erro', /err\.quota\s*=\s*!!\(data\s*&&\s*data\.quota\)/.test(cloud));
ok('motor trata a marca como limite diário', /ehLimiteDiario\(lastError\)\s*\|\|\s*!!\(e\s*&&\s*e\.quota\)/.test(cloudData));
ok('reconhecer a pausa ainda agenda a volta na virada', /state\.limiteAte\s*=\s*viradaDoLimite\(\)/.test(cloudData));

// AUDITORIA 23/09/2026 (rodada 3) — a contagem do dia no Worker mudou de lugar:
// lote inválido (400) e lote recusado pelo freio (429) NÃO gravam nada e por isso
// não podem mais somar no contador — era esse detalhe que empurrava o freio para
// mais cedo em todos os PCs a cada recusa. A contagem continua ANTES das
// gravações (conservadora): o lote aceito é contado inteiro.
console.log('== CONTAGEM DO DIA SÓ CONTA LOTE ACEITO (Worker) ==');
{
  const iValida = worker.indexOf('INVALID_MUTATION_BATCH');
  // v5.27.0 (rodada 28) — o freio deixou de ter número solto e passou a ler o
  // PLANO (`PLANO.freioDia`): era justamente o número solto do plano grátis que
  // barrava a conta PAGA. A âncora acompanha a fonte da verdade nova.
  const iFreio = worker.indexOf('PLANO.freioDia');
  const iConta = worker.indexOf("somarUso(env, Math.max(1, mutations.length) * 2, 0, ctx)");
  ok('a contagem do dia existe no handlePush', iConta >= 0);
  ok('a contagem fala a MESMA unidade do freio (linhas: 2 por alteração)',
    /somarUso\(env, Math\.max\(1, mutations\.length\) \* 2, 0, ctx\)/.test(worker) &&
    /freioDeCota\(env, mutations\.length \* 2\)/.test(worker));
  ok('a contagem vem DEPOIS da validação do lote', iValida >= 0 && iConta > iValida);
  ok('a contagem vem DEPOIS do freio preventivo', iFreio >= 0 && iConta > iFreio);
  ok('o freio do dia lê o PLANO (uma fonte só: pago 1.000.000/dia, grátis 95.000 como recuo)',
    /freioDia:\s*1000000/.test(worker) && /freioDia:\s*95000/.test(worker) && /const PLANO = PLANO_PAGO/.test(worker));
  ok('o freio do MÊS existe no plano pago (50 milhões/mês, com 10% de folga)',
    /freioMes:\s*45000000/.test(worker) && /PLANO\.freioMes > 0/.test(worker));
  ok('o app reconhece os DOIS recados do freio (dia e mês), senão ficaria batendo na porta',
    /daily row \(write\|read\) limit\|monthly row write limit/.test(cloudData));
  ok('a contagem continua ANTES das gravações', iConta < worker.indexOf('const results = []', iConta));
  ok('não sobrou contagem antes da validação', worker.indexOf("somarUso(env, Array.isArray(mutations)") < 0);
}

if(process.exitCode) process.exit(process.exitCode);
console.log('\nRESULTADO: proteção de cota passou!');
//<<<<SECAO:test_sync_quota_guard.js:FIM>>>>
}

if (false) { // ═══ test_cloudflare_sync.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_cloudflare_sync.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== CLOUDFLARE SYNC UI ==');
ok("usa endpoint workers.dev correto (v5.24.34: ele confirmou QUER o gratis — subdominio digicopyonline definitivo; nome de vendas fica pra dominio proprio depois)",/digicopy-sync-api\.digicopyonline\.workers\.dev/.test(code));
ok('token individual fica em chave local própria',/digicopy_cloud_device_token_v1/.test(code));
ok('segredo não é salvo no localStorage',!/setItem\([^\n]*secret/i.test(code));
ok('possui primeiro setup e recuperação, sem conexão por código/link na interface',/\/v1\/setup/.test(code)&&/\/v1\/recover/.test(code)&&!/dc-tab-code/.test(code)&&!/Tenho um código/.test(code)&&!/Gerar código/.test(code)&&!/\/v1\/invites/.test(code)&&!/\/v1\/enroll/.test(code));
ok('botão Nuvem está na barra superior',/id="btn-nuvem"[^>]*abrirCloudflareNuvem/.test(html));
ok('Nuvem aparece para TODO PC (v6.0.6: o papel blinda o conteúdo, não o botão)',/if\(cloud\)cloud\.style\.display='';/.test(code));
ok('Backup fica sempre só para Admin',/backup\.style\.display=admin/.test(code));
ok('gastos e zona de admin trancados pelo PAPEL DO APARELHO (v6.0.6: PC comum só desconecta a si)',/d\.role==='admin'/.test(code)&&code.indexOf("(isAdmin?usoBloco:'')")>=0&&code.indexOf('Desconectar ESTE computador')>=0);
ok('token revogado libera nova autorização',/forgetAuth/.test(code)&&/refreshVisibility/.test(code));
ok('exportação também valida Admin',/Somente o administrador pode exportar/.test(code));
ok('painel compara clientes locais e nuvem',/CLIENTES NESTE PC/.test(code)&&/CLIENTES NA NUVEM/.test(code));
ok('admin mantém somente aparelhos e excluídos',/dc-list-deleted/.test(code)&&/dc-list-devices/.test(code));
ok('ferramentas temporárias saíram da interface',!/dc-dedupe-clients|dc-review-blocked|dc-clear-tests/.test(code));
ok('admin pode zerar a nuvem e depois escolher o que enviar',/dc-reset-cloud/.test(code)&&/resetCloudOnly/.test(code)&&/dc-enviar-locais/.test(code));
ok('aparelhos mostram registros, alterações e último acesso',/activeRecords/.test(code)&&/totalChanges/.test(code)&&/Último acesso/.test(code));
ok('escolha aparece quando a sincronização está parada',/const escolher=!!sync\.paused/.test(code));
ok('v6.1.4: escolha não é mais obrigatória (sincroniza sozinho)',/const escolher=!!sync\.paused/.test(code)&&/Sincronização automática ativa/.test(code));
ok('explica que nada duplica na nuvem',/não duplica|Enviando os dados para a nuvem/.test(code));
ok('restaura e bloqueia com confirmação',/\/v1\/restore/.test(code)&&/\/v1\/devices\/revoke/.test(code));
ok('novo painel está no bundle',manifest.includes('cloudflare_sync_patch.js'));
ok('Firebase automático apagado',!fs.existsSync('sync_realtime_patch.js'));
ok('gatilho antigo de carga automática é travado',/digicopy_auto_load_try_v4939/.test(code) && /syncCarregarDaNuvem=async function\(\)/.test(code));
ok('diagnóstico Firebase antigo apagado',!fs.existsSync('ajustes_v52025_patch.js'));
ok('arquivo entra no build Electron',pkg.build.files.includes('app.bundle.js') && manifest.includes('cloudflare_sync_patch.js'));
console.log('\nRESULTADO: interface Cloudflare passou!');
//<<<<SECAO:test_cloudflare_sync.js:FIM>>>>
}

if (false) { // ═══ test_cloudflare_data_sync.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_cloudflare_data_sync.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined);
const S=window.DIGICOPY_CLOUD_SYNC;
console.log('== CLOUDFLARE DATA SYNC ==');
ok('motor exportado',!!S&&typeof S.tick==='function');
ok('sincroniza todas as entidades principais',S.definitions.clientes==='array'&&S.definitions.vendas==='array'&&S.definitions.config==='root');
ok('limpa metadados antigos',!('_rt' in S.clean({id:'1',_rt:'x'})));
ok('hash é estável com ordem diferente',S.hash({b:2,a:1})===S.hash({a:1,b:2}));
ok('possui fila local durável',/digicopy_cf_sync_outbox_v1/.test(code));
ok('reset cria snapshot e pausa sem republicar',/antes_zerar_nuvem/.test(code)&&/resetCloudOnly/.test(code)&&/paused:true/.test(code));
ok('publicação após reset é ação separada',/publishLocalToCloud/.test(code)&&/publicacao-manual-completa/.test(code));
ok('lote conservador evita excesso de subrequisições',/PUSH_BATCH=10/.test(code));
ok('calcula total pendente além do lote atual',/function pendingEstimate/.test(code));
const dup=S.duplicateClientGroups([{id:'a',codigo:'001',documento:''},{id:'b',codigo:'1',documento:''},{id:'c',codigo:'2',documento:'12345678900'},{id:'d',codigo:'9',documento:'123.456.789-00'}]);
ok('detecta repetidos por código ou documento',dup.length===2&&dup.reduce((n,g)=>n+g.length-1,0)===2);
ok('novo aparelho não publica histórico local',/reconcileFirstAuthorizedDevice/.test(code)&&/antes_primeira_nuvem/.test(code));
// v6.1.4 — ORDEM DO DONO (22/09/2026): "retire essa trava de preferir enviar ou
// não, já envia logo; conectou com qualquer das duas senhas, sincroniza na hora".
ok('a guarda de reinstalação existe (compatibilidade) mas NÃO pausa mais',typeof S.decideReinstallGuard==='function');
const gEmpty=S.decideReinstallGuard({activation:'initial',cloudHasData:false,localCount:1919,extraCount:0});
ok('nuvem vazia + dados neste PC: sincroniza direto (sem escolha)',gEmpty.pause===false&&gEmpty.isolate===false&&gEmpty.reason==='sincroniza-direto');
const gHold=S.decideReinstallGuard({activation:'recovery',cloudHasData:true,localCount:2000,extraCount:57});
ok('sobra local sobe sozinha por id (atualiza, não duplica)',gHold.pause===false&&gHold.hold===false&&gHold.isolate===false);
const gOk=S.decideReinstallGuard({activation:'initial',cloudHasData:true,localCount:10,extraCount:0});
ok('sem sobra local: idem, direto',gOk.pause===false&&gOk.reason==='sincroniza-direto');
const gInvite=S.decideReinstallGuard({activation:'invite',cloudHasData:true,localCount:57,extraCount:57});
ok('PC convidado nunca perde dado nem fica parado',gInvite.isolate===false&&gInvite.pause===false);
const gInviteLimpo=S.decideReinstallGuard({activation:'invite',cloudHasData:true,localCount:57,extraCount:0});
ok('PC convidado sem sobra entra direto',gInviteLimpo.pause===false&&gInviteLimpo.reason==='sincroniza-direto');
ok('escolha tem as duas opções',typeof S.publishLocalToCloud==='function'&&typeof S.manterLocalSemEnviar==='function');
ok('sempre puxa antes de escanear e enviar',/await pullAll\(\);[\s\S]{0,2000}scanLocal\(\)/.test(code));
ok('exclusões não travam mais a tela',!/blockedDeletes/.test(code)&&!/approveMassDelete/.test(code));
ok('usa cursor incremental',/\/v1\/changes\?cursor=/.test(code));
ok('usa backoff e não setInterval',/Math\.pow/.test(code)&&!/setInterval\s*\(/.test(code));
ok('script carregado depois do painel',manifest.indexOf('cloudflare_data_sync_patch.js')>manifest.indexOf('cloudflare_sync_patch.js'));
ok('conectar já dispara a sincronização (sem botão)',/tick\('autorizado'\)/.test(fs.readFileSync('cloudflare_sync_patch.js','utf8')));
ok('a pausa de boot foi removida do motor',!/pauseReason='escolha-inicial'/.test(code)&&/state\.paused=false;\s*\n\s*state\.pauseReason='';/.test(code));

console.log('\nRESULTADO: motor Cloudflare passou!');
//<<<<SECAO:test_cloudflare_data_sync.js:FIM>>>>
}

if (false) { // ═══ test_indexeddb_persistence.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_indexeddb_persistence.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('indexeddb_persistence_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
console.log('== INDEXEDDB PERSISTENCE V2 ==');
ok('abre banco na versão 2',/indexedDB\.open\(IDB_NAME,2\)/.test(code));
ok('possui stores snapshots, entities e meta',/createObjectStore\(SNAPSHOTS/.test(code)&&/createObjectStore\(ENTITIES/.test(code)&&/createObjectStore\(META/.test(code));
ok('migra snapshot v1 automaticamente',/migracao-snapshot-v1/.test(code));
ok('restaura entidades incrementais mais novas',/incTs>localTs/.test(code));
ok('usa hashes do manifesto local',/function signature/.test(code)&&/info\.subs/.test(code));
ok('grava apenas entidades alteradas',/changed\.forEach\(campo=>store\.put/.test(code));
ok('remove somente entidades que sumiram',/removed\.forEach\(campo=>store\.delete/.test(code));
ok('envolve saveDB e saveDBAgora',/window\.saveDB=function/.test(code)&&/window\.saveDBAgora=function/.test(code));
ok('limpeza remove só chaves DIGICOPY',/deleteDatabase\(IDB_NAME\)/.test(code)&&/\^digicopy\/i.test\(k\)/.test(code));
ok('limpeza não regrava durante reload',/if\(clearing\|\|/.test(code));
ok('guarda snapshot antes de operações críticas',/writeRecoverySnapshot/.test(code)&&/recovery_/.test(code));
ok('sync aguarda restauração',/DIGICOPY_DB_READY/.test(fs.readFileSync('cloudflare_data_sync_patch.js','utf8')));
ok('aviso antigo só aparece se IndexedDB falhar',/!window\.__indexedDbPersistAtivo/.test(app));
ok('carrega antes do sync Cloudflare',manifest.indexOf('indexeddb_persistence_patch.js')<manifest.indexOf('cloudflare_data_sync_patch.js'));
ok('Backup está visível no topo',/id="btn-backup-top"[^>]*exportBackup/.test(html));
ok('arquivo entra no bundle Electron',pkg.build.files.includes('app.bundle.js')&&manifest.includes('indexeddb_persistence_patch.js'));
console.log('\nRESULTADO: persistência IndexedDB incremental passou!');
//<<<<SECAO:test_indexeddb_persistence.js:FIM>>>>
}

if (false) { // ═══ test_build_sync.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_build_sync.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — integridade do empacotamento (.exe)
// Garante que nunca mais saia um instalador sem as atualizações novas.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const cp = require('child_process');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }

const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html = fs.readFileSync('index.html','utf8');
const versao = pkg.version;

console.log('== EMPACOTAMENTO DO .EXE ==');

// ── Ferramentas existem ─────────────────────────────────────────────────────
ok('sync_build.js existe', fs.existsSync('sync_build.js'));
ok('verify_pack.js existe', fs.existsSync('verify_pack.js'));

// ── Scripts do npm encadeiam sync + bundle + verificação ────────────────────
const bw = pkg.scripts['build:win'] || '';
ok('build:win limpa o dist antes', bw.indexOf('clean_dist.js') >= 0);
ok('build:win sincroniza a configuração', bw.indexOf('sync_build.js') >= 0);
ok('build:win regenera o bundle', bw.indexOf('bundle') >= 0);
ok('build:win confere o pacote no final', bw.indexOf('verify_pack.js') >= 0);
ok('sync roda antes do electron-builder',
   bw.indexOf('sync_build.js') < bw.indexOf('electron-builder'));
ok('verify roda depois do electron-builder',
   bw.indexOf('electron-builder') < bw.indexOf('verify_pack.js'));
ok('atalhos npm run sync / verify:exe existem',
   !!pkg.scripts.sync && !!pkg.scripts['verify:exe'] && !!pkg.scripts['sync:check']);

// ── Configuração está de fato sincronizada ──────────────────────────────────
cp.execFileSync(process.execPath, ['sync_build.js','--check'], { stdio:'pipe' });
ok('index.html + build.files + check estão sincronizados', 'ok');

// ── Versão carimbada em todo lugar ──────────────────────────────────────────
ok('DIGICOPY_APP_VERSION bate com o package.json',
   html.indexOf("window.DIGICOPY_APP_VERSION = '"+versao+"'") >= 0);
ok('título da janela bate com a versão', html.indexOf('<title>Sistema Digicopy v'+versao+'</title>') >= 0);
ok('rodapé bate com a versão', new RegExp('id="footer-version"[^>]*>v'+versao.replace(/\./g,'\\.')+'<').test(html));

// ── Cache-busting: nenhum script do app com ?v= de versão antiga ────────────
const srcs = [...html.matchAll(/<script\s[^>]*src="\.\/([A-Za-z0-9_.\-/]+\.js)(\?v=([^"]*))?"/g)];
const desatualizados = srcs
  .filter(m => !m[1].startsWith('assets/vendor/'))
  .filter(m => m[3] !== versao && m[3] !== (versao + '-' + (m[1] === 'app.bundle.js' ? m[3].split('-')[1] : '')))
  .map(m => m[1]);
ok('todo script do app tem ?v='+versao, desatualizados.length === 0);

// ── Nada carregado pelo index.html pode ficar de fora do .exe ───────────────
const refs = [...html.matchAll(/(?:src|href)="\.\/([A-Za-z0-9_.\-/]+?)(?:\?[^"]*)?"/g)].map(m => m[1]);
ok('todos os recursos do index.html existem no disco', refs.every(f => fs.existsSync(f)));
const foraDoExe = refs.filter(f => !f.startsWith('assets/') && !pkg.build.files.includes(f));
ok('nenhum recurso do index.html ficou fora de build.files', foraDoExe.length === 0);

// ── Arquivos essenciais do Electron ─────────────────────────────────────────
['package.json','index.html','main.js','preload.js','app.bundle.js','assets/vendor/**/*']
  .forEach(f => ok('build.files inclui '+f, pkg.build.files.includes(f)));

// ── Bundle bate com as fontes ───────────────────────────────────────────────
cp.execFileSync(process.execPath, ['build_bundle.js','--check'], { stdio:'pipe' });
ok('app.bundle.js está atualizado com as '+manifest.length+' fontes', 'ok');

// ── Cache do Electron invalida por impressão digital do código ──────────────
const main = fs.readFileSync('main.js','utf8');
ok('main.js calcula a impressão digital do bundle', /APP_FINGERPRINT/.test(main));
ok('cache é limpo quando o CÓDIGO muda, não só a versão',
   /prev\s*!==\s*APP_FINGERPRINT/.test(main));
ok('impressão digital usa o sha256 do bundle', /sha256/.test(main));

console.log('\nRESULTADO: empacotamento do .exe íntegro!');
//<<<<SECAO:test_build_sync.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5226.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5226.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const ui=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined);
const S=window.DIGICOPY_CLOUD_SYNC;
console.log('== NUVEM NA REINSTALAÇÃO ==');
ok('guarda decideReinstallGuard',typeof S.decideReinstallGuard==='function');
const empty=S.decideReinstallGuard({activation:'initial',cloudHasData:false,localCount:1919,extraCount:0});
// v6.1.4 — ordem do dono (22/09/2026): sem trava de escolha; conectou, sincroniza.
ok('desinstalar/instalar com nuvem vazia sincroniza direto',!empty.pause&&!empty.isolate&&empty.reason==='sincroniza-direto');
const same=S.decideReinstallGuard({activation:'initial',cloudHasData:true,localCount:1919,extraCount:0});
ok('mesmo ID na nuvem segue sem pausar',!same.pause&&!same.hold&&/sincroniza-direto|ok/.test(same.reason));
const leftover=S.decideReinstallGuard({activation:'recovery',cloudHasData:true,localCount:1976,extraCount:57});
ok('57 sobras entram na fila por id (nada é apagado)',!leftover.pause&&!leftover.hold&&!leftover.isolate);
const invite=S.decideReinstallGuard({activation:'invite',cloudHasData:true,localCount:80,extraCount:57});
ok('PC convidado não apaga nada e não fica parado',!invite.isolate&&!invite.pause);
ok('scan pula chave retida',code.includes('held.has(k)'));
ok('enviar os dados atuais é escolha da pessoa',code.includes('async function publishLocalToCloud')&&code.includes('async function manterLocalSemEnviar'));
ok('painel avisa que a sincronização é automática',/Sincronização automática ativa/.test(ui)||/Sincronizando automaticamente/.test(ui));
ok('o botão manual de não enviar SAIU (r46: sincronização automática, sem botão)',!fs.readFileSync('ajustes_v52246_nuvem_nao_autorizar_patch.js','utf8').includes('dc-nao-autorizar-local'));
console.log('\nRESULTADO: reinstalação não duplica na nuvem!');
//<<<<SECAO:test_ajustes_v5226.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5227.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5227.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const patch=fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
console.log('== ACOMPANHAMENTO DOS PCS ==');
ok('botão só no painel admin',/Acompanhar dados dos PCs/.test(patch)&&/#dc-list-devices/.test(patch));
ok('consulta atividade da API',/\/v1\/admin\/activity/.test(patch));
ok('não mostra senha no rótulo',!/escolaAuth/.test(patch)&&!/\.senha/.test(patch)&&/entity==='config'/.test(patch));
ok('funciona mesmo sem a rota nova',/\/v1\/changes\?cursor=/.test(patch));
ok('API tem rota de atividade',/API_VERSION = '0.4.\d+'/.test(worker)&&/\/v1\/admin\/activity/.test(worker));
ok('rótulo não leva o JSON inteiro',/activityLabel/.test(worker)&&/slice\(0, 80\)/.test(worker));
ok('aparelhos trazem lastChange e byEntity',/lastChangeAt/.test(worker)&&/byEntity/.test(worker));
ok('patch entra depois do motor da nuvem',manifest.indexOf('ajustes_v5227_nuvem_acompanhamento_patch.js')>manifest.indexOf('cloudflare_data_sync_patch.js'));
console.log('\nRESULTADO: acompanhamento dos PCs passou!');
//<<<<SECAO:test_ajustes_v5227.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52212.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52212.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('ajustes_v52212_celular_nuvem_patch.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const ctx={window:{},document:undefined};
new Function('window','document',code)(ctx.window,ctx.document);
const P=ctx.window.CELULAR_NUVEM_PURE;
console.log('== CELULAR + NUVEM ==');
ok('detecta Android',P.ehCelular({ua:'Mozilla/5.0 (Linux; Android 14) Mobile'})===true);
ok('detecta iPhone',P.ehCelular({ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'})===true);
ok('PC não é celular',P.ehCelular({ua:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})===false);
ok('Capacitor conta como app',P.ehCelular({capacitor:true})===true);
ok('celular usa conexão por CNPJ, sem código/link',!/dc-tab-code/.test(code)&&/v5260-tab-cnpj/.test(code)&&/Celular/.test(code));
ok('NF-e bloqueada no celular',/só no computador da loja/.test(code));
ok('não grava senha A1',!/pfx|A1/.test(code)||/certificado A1/.test(code));
ok('não envia SEFAZ',!/NFeAutorizacao4|hnfe\.fazenda/.test(code));
ok('manifesto instalável',html.includes('manifest.webmanifest'));
ok('patch no bundle',manifest.includes('ajustes_v52212_celular_nuvem_patch.js'));
console.log('\nRESULTADO: celular + nuvem passou!');
//<<<<SECAO:test_ajustes_v52212.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52228.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52228.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52228_a1_nuvem_lupa_ncm_patch.js','utf8');
const ncm=fs.readFileSync('ajustes_v52227_ncm_origem_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const html=fs.readFileSync('index.html','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const A=ctx.window.A1_NUVEM_USO_PURE;

ok('A1 da nuvem conta', A.temA1Nuvem({fiscal:{a1Nuvem:{data:'data:app;base64,AAA'}}})===true);
ok('sem A1 não conta', A.temA1Nuvem({fiscal:{}})===false);
ok('lupa no hold da caixa', /data-ncm-hold/.test(src) && /translateY\(-50%\)/.test(src));
ok('não pede senha no patch', !/senhaA1|type=\"password\"/.test(src));
ok('ainda não SEFAZ', /não emite na SEFAZ|Ainda não/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52228_a1_nuvem_lupa_ncm_patch.js'));
ok('versão 5.22.28+', (/^\d+\.\d+\.\d+$/.test(pkg.version) && (parseInt(pkg.version.split('.')[0],10)>=6 || parseInt(pkg.version.split('.')[1],10)>=23 || parseInt(pkg.version.split('.')[2],10)>=28)) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(src+ncm));
console.log('\nRESULTADO: v5.22.28 passou!');
//<<<<SECAO:test_ajustes_v52228.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52233.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52233.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

const src=fs.readFileSync('ajustes_v52233_escuro_login_nuvem_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const ctx={window:{},document:undefined};
new Function('window','document',src)(ctx.window,ctx.document);
const P=ctx.window.ESCURO_LOGIN_NUVEM_PURE;
const css=P.cssLoginNuvem();

ok('CSS do login', /#login-screen/.test(css));
ok('CSS da Nuvem', /#digicopy-cloud-modal/.test(css));
ok('não refaz o tema inteiro', !/\.neo-shell/.test(css) && !/\.module-row/.test(css));
ok('não muda a chave', !/localStorage\.setItem/.test(src));
ok('patch no bundle', manifest.includes('ajustes_v52233_escuro_login_nuvem_patch.js'));
ok('versão 5.22.33+', /^\d+\.\d+\.\d+/.test(pkg.version) && html.includes('app.bundle.js?v='+pkg.version));
ok('APK quieto', !/mobile\//.test(src));
console.log('\nRESULTADO: v5.22.33 passou!');
//<<<<SECAO:test_ajustes_v52233.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52246.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52246.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

function load(src){
  const ctx={window:{},document:undefined};
  new Function('window','document',src)(ctx.window,ctx.document);
  return ctx.window;
}

const ui=fs.readFileSync('ajustes_v52246_nuvem_nao_autorizar_patch.js','utf8');
const motor=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

const P=load(ui).NUVEM_NAO_AUTORIZAR_V52246_PURE;
ok('nuvem não é apagada', P.nuvemIntocada===true);
ok('nuvem vazia recusa', P.recusaNuvemVazia(0)===true && P.recusaNuvemVazia(10)===false);
ok('só some o que a nuvem não tem', P.planNaoAutorizarLocal(['clientes|a','clientes|b','vendas|1'], {'clientes|a':true}).join(',')==='clientes|b,vendas|1');
ok('motor descarta local e puxa nuvem', /discardLocalKeepCloud/.test(motor) && /antes_nao_autorizar_local/.test(motor));
ok('sem botão, sem chamada (motor testado acima, intacto)', !/reset-cloud/.test(ui) && !/discardLocalKeepCloud/.test(ui));
ok('fila antiga não sobe', /outbox=\[\]/.test(motor) || /outbox = \[\]/.test(motor));
ok('motor despausa e sincroniza (botão saiu, motor ficou)', /paused=false/.test(motor));
ok('sem botão, sem avisos na tela', (ui.match(/confirmSistema/g)||[]).length===0);
ok('botão saiu do painel (r46)', !/dc-nao-autorizar-local/.test(ui));
ok('patch no bundle', manifest.includes('ajustes_v52246_nuvem_nao_autorizar_patch.js'));
ok('versão', /^\d+\.\d+\.\d+/.test(pkg.version) && /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && /v\d+\.\d+\.\d+/.test(html));
ok('APK quieto', !/mobile\//.test(ui));
ok('sem nome pessoal novo', !/kauan/i.test(ui.replace(/__KAUAN_REFINO_STATE__/g,'')));
console.log('\nRESULTADO: v5.22.46 passou!');
//<<<<SECAO:test_ajustes_v52246.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52257.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52257.js:INICIO>>>>
const fs = require('fs');
const { ORCAMENTO_APROVACAO_V52257_PURE: P } = require('./ajustes_v52257_orcamento_sync_total_patch.js');

function ok(n, c){ if(!c){ console.error('FAIL:', n); process.exit(1); } console.log('OK:', n); }

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');

ok('versão 5.22.57 no package.json e patch', P.VERSAO === '5.22.57' && /^\d+\.\d+\.\d+/.test(pkg.version));

// Mock do ambiente do ERP
global.db = {
  orcamentos: [
    {
      id: 'orc_teste_57_1',
      empresaId: 'emp_1',
      numero: '301',
      clienteId: 'cli_1',
      clienteNome: 'Carlos Almeida',
      total: 650.00,
      status: 'aberto',
      itens: [
        { produtoId: 'prod_1', descricao: 'Manutenção EPSON L3250', qtd: 1, preco: 650.00, subtotal: 650.00, tipo: 'Serviço' }
      ]
    },
    {
      id: 'orc_teste_57_2',
      empresaId: 'emp_1',
      numero: '302',
      token: 'tok_57_xyz',
      clienteId: 'cli_1',
      clienteNome: 'Carlos Almeida',
      total: 120.00,
      status: 'aberto',
      itens: [
        { produtoId: 'prod_2', descricao: 'Toner Amarelo', qtd: 1, preco: 120.00, subtotal: 120.00, tipo: 'Produto' }
      ]
    }
  ],
  vendas: [],
  produtos: [
    { id: 'prod_2', nome: 'Toner Amarelo', estoque: 8, preco: 120.00, categoria: 'Cartucho' }
  ],
  clientes: [
    { id: 'cli_1', nome: 'Carlos Almeida' }
  ],
  notificacoes: []
};

global.window = {
  db: global.db
};
global.getSession = function(){ return { usuarioId: 'usr_adm', usuarioNome: 'Denivaldo', empresaId: 'emp_1' }; };
global.saveDB = function(){};

// 1. Garante tokens em orçamentos sem token
P.garantirTokensOrcamentos();
const orcSemToken = global.db.orcamentos.find(o => o.id === 'orc_teste_57_1');
ok('orçamento ganhou token gerado automaticamente', orcSemToken && orcSemToken.token && orcSemToken.token.startsWith('orc_tok_'));

// 2. Teste de aprovação e geração de venda salva
const vendaGerada = P.gerarVendaSalvaDeOrcamento('orc_teste_57_1', 'cliente_web');
ok('venda salva foi gerada com sucesso', vendaGerada && vendaGerada.id.startsWith('vda_orc_'));
ok('venda gerada tem status aguardar', vendaGerada && vendaGerada.status === 'aguardar');
ok('venda gerada tem total 650.00', vendaGerada && vendaGerada.total === 650.00);

const orc1 = global.db.orcamentos.find(o => o.id === 'orc_teste_57_1');
ok('orçamento mudou status para aprovado', orc1 && orc1.status === 'aprovado');
ok('orçamento tem vendaId vinculada', orc1 && orc1.vendaId === vendaGerada.id);

// 3. Teste de recusa de orçamento
P.recusarOrcamento('orc_teste_57_2');
const orc2 = global.db.orcamentos.find(o => o.id === 'orc_teste_57_2');
ok('orçamento mudou status para recusado', orc2 && orc2.status === 'recusado');

// 4. Validações de integridade estrutural
ok('patch no manifesto do bundle', manifest.includes('ajustes_v52257_orcamento_sync_total_patch.js'));
ok('patch vai para o .exe dentro do app.bundle.js',
   pkg.build.files.indexOf('app.bundle.js')>=0 &&
   JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52257_orcamento_sync_total_patch.js'));
ok('index carrega scripts na versão 5.22.x', /app\.bundle\.js\?v=\d+\.\d+\.\d+/.test(html) && JSON.parse(fs.readFileSync('bundle-manifest.json','utf8')).includes('ajustes_v52257_orcamento_sync_total_patch.js'));
ok('rodapé v5.22.x', /footer-version/.test(html) && /v\d+\.\d+\.\d+/.test(html));
ok('título v5.22.x', /Sistema Digicopy v\d+\.\d+\.\d+/.test(html));

console.log('TODOS OS TESTES DE v5.22.57 PASSARAM COM SUCESSO!');
//<<<<SECAO:test_ajustes_v52257.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52269.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52269.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

// banco de mentira com listas que ANTES não sincronizavam
const db={
  clientes:[{id:'c1',nome:'Fulano'}],
  despesasLocacao:[{id:'d1',valor:10}],
  cartuchosMigrados:[{id:'ct1'}],
  semId:[{nome:'linha sem id'}],
  _seq:{venda:41,os:7},
  meta:{appVersion:'x'},
  modulosDinamicos:{a:1}
};
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,db);
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.69 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));

const mapa=S.definicoes();
ok('lista nova entra sozinha na sincronização',mapa.despesasLocacao==='array'&&mapa.cartuchosMigrados==='array');
ok('lista antiga continua igual',mapa.clientes==='array'&&mapa.config==='root'&&mapa.modulosDinamicos==='map');
ok('controle interno do arquivo não viaja',mapa.meta===undefined);
ok('contador de numeração tem tratamento próprio',mapa._seq==='contador');
ok('numeração fica com o maior número dos dois PCs',/const nuvem=Number\(change\.data\[nome\]\)\|\|0,aqui=Number\(alvo\[nome\]\)\|\|0;/.test(code)&&/if\(nuvem>aqui\)/.test(code));
ok('só sobe registro com id de verdade (v5.22.71)',/\.filter\(x=>x&&x\.id\)/.test(code));
ok('a marca do registro é sempre a mesma',S.hash(S.clean({nome:'x'}))===S.hash(S.clean({nome:'x'})));
ok('PC convidado nunca perde dado (v6.1.4: nada é isolado, tudo sincroniza)',/isolate:false/.test(code)&&!/isolate:true/.test(code));
// v6.1.4 (22/09/2026): a pergunta única acabou por ordem do dono — quem conecta
// já sincroniza. A marca de regras continua existindo para carimbar a versão.
ok('regra nova não pergunta mais nada (v6.1.7 conectou = sincroniza)',/const REGRAS='v6\.1\.7-conectou-sincroniza'/.test(code)&&/state\.regras/.test(code)&&/reason:'sincroniza-direto'/.test(code)&&!/pause:true/.test(code));
ok('nada abre sozinho cobrando escolha (v6.1.4: sincroniza direto)',/function cobrarEscolha/.test(painel)&&/não faz nada/.test(painel));
ok('escolha não abre por cima de outra janela da nuvem',/digicopy-cloud-modal/.test(painel));
console.log('\nRESULTADO: ajustes v5.22.69 passaram!');
//<<<<SECAO:test_ajustes_v52269.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52270.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52270.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.70 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));
ok('503 é tratado como "nuvem ocupada"',/st===429\|\|st===500\|\|st===502\|\|st===503\|\|st===504/.test(code));
ok('tenta de novo, com espera crescente',/const ESPERAS=\[900,2500,6000,12000\]/.test(code)&&/async function comPaciencia/.test(code));
ok('envio e leitura usam a espera',/comPaciencia\(\(\)=>call\('\/v1\/changes',\{method:'POST'/.test(code)&&/comPaciencia\(\(\)=>call\('\/v1\/changes\?cursor=/.test(code));
ok('lote encolhe quando a nuvem reclama',/lote=Math\.max\(1,Math\.floor\(lote\/2\)\)/.test(code));
ok('lote volta a crescer quando ela aceita',/if\(lote<PUSH_BATCH\)lote=Math\.min\(PUSH_BATCH,lote\+1\)/.test(code));
ok('tem respiro entre lotes para não afogar a nuvem',/await dormir\(180\)/.test(code));
ok('remessa grande continua sozinha em vez de pausar',/schedule\(4000\)/.test(code)&&!/A sincronização continua parada/.test(code));
ok('mostra quanto falta enviar',/faltam '\+outbox\.length\+' registros/.test(code));
ok('painel avisa que pode fechar a janela',/o envio segue sozinho e recomeça de onde parou/.test(painel));
ok('nada de susto com "Envio pendente"',!/Envio pendente/.test(painel));
ok('a fila não some no erro',/localStorage\.setItem\(OUTBOX_KEY/.test(code));
console.log('\nRESULTADO: ajustes v5.22.70 passaram!');
//<<<<SECAO:test_ajustes_v52270.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52271.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52271.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,
  {clientes:[],logs:[{id:'l1'}],notificacoes:[{id:'n1'}],despesasLocacao:[{id:'d1'}]});
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.71 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));
const mapa=S.definicoes();
ok('auditoria não viaja mais',mapa.logs===undefined);
ok('avisos não viajam mais',mapa.notificacoes===undefined);
ok('as listas de trabalho continuam viajando',mapa.clientes==='array'&&mapa.despesasLocacao==='array');
ok('só lista com botão de excluir manda exclusão',S.podeExcluir('clientes')===true&&S.podeExcluir('vendas')===true);
ok('lista que o módulo remonta nunca manda exclusão',S.podeExcluir('despesasLocacao')===false&&S.podeExcluir('escolaOrc')===false);
ok('só apaga na nuvem quando foi de propósito (regra nova da v5.22.75)',/houveIntencaoDeExcluir/.test(code)&&/JANELA_INTENCAO/.test(code));
// v7.0.7 — a mesma regra, agora com a marca durável: só entra na fila de
// exclusão o que ele apagou (intenção viva OU marca gravada do que saiu da
// lista). O resto continua só "deixando de ser acompanhado".
ok('sumiço sem ordem só faz o PC parar de acompanhar (regra nova da v5.22.75)',
  /if\(!missing\.some\(mandadoApagar\)\)\{/.test(code)&&/houveIntencaoDeExcluir\(\)\|\|temMarcaDeExclusao\(k\)/.test(code));
ok('item sem id não sobe (era cache, virava lixo)',/\.filter\(x=>x&&x\.id\)\.map\(x=>\(\{id:String\(x\.id\)/.test(code)&&!/h_'\+hash\(clean\(x\)\)/.test(code));
ok('limpa da nuvem o que não viaja mais',/function marcarLimpeza/.test(code)&&/state\.limpar/.test(code));
ok('limpeza vai aos poucos, sem rajada',/state\.limpar\.slice\(0,40\)/.test(code));
ok('painel mostra de onde vem cada número',/ver lista por lista/.test(painel)&&/porLista/.test(painel));
console.log('\nRESULTADO: ajustes v5.22.71 passaram!');
//<<<<SECAO:test_ajustes_v52271.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52272.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52272.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
const db={clientes:[{id:'a'},{id:'b'}],vendas:[{id:'v1'}]};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,db);
const S=window.DIGICOPY_CLOUD_SYNC;

// O espelho da v5.22.72 foi REMOVIDO na v5.22.76: era ele que apagava do PC o
// que a nuvem não tinha. O que este arquivo garante hoje é que ele não volte.
console.log('== AJUSTES v5.22.72 (revisto na v5.22.76) ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));
ok('o espelho que apagava dado do PC não existe mais',!/function espelharNuvem/.test(code)&&!/function planejarEspelho/.test(code));
ok('o interruptor do espelho saiu do painel',!/dc-espelho/.test(painel));
ok('nenhum resto do espelho na lista de funções',!S.espelhoLigado&&!S.planejarEspelho);
ok('auditoria e avisos continuam fora da nuvem',/NAO_SINCRONIZA=new Set\(\['meta','__proto__','logs','notificacoes'\]\)/.test(code));
ok('zerar a nuvem só existe no botão do administrador',/function resetCloudOnly/.test(code)&&code.split('reset-cloud').length===2);
console.log('\nRESULTADO: ajustes v5.22.72 passaram!');
//<<<<SECAO:test_ajustes_v52272.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52274.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52274.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const cham=fs.readFileSync('locacao_chamados_fix_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const window={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.74 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));

// O conserto automático que devolvia o que sumiu foi REMOVIDO na v5.22.76:
// ele trouxe de volta os nomes de demonstração. O que fica garantido é que
// nenhum botão de restaurar em massa existe e que aquele conserto saiu.
ok('não tem botão para o usuário apertar',!/dc-restore-all/.test(painel));
ok('o conserto que ressuscitava dado saiu',!/repararApagao/.test(code)&&!/agruparApagao/.test(code));
ok('a limpeza dos nomes velhos é de uma vez, não é regra',/if\(state\.faxina===FAXINA\)return 0;/.test(code));

// ── contador color pela modalidade ──
ok('contador color olha a modalidade',/function modalidadeAtiva/.test(cham)&&/modalidadeAtiva\(meds\.colorA4\) \|\| modalidadeAtiva\(meds\.colorA3\)/.test(cham));
ok('modalidade inativa não conta',/mod !== 'inativo' && mod !== 'off'/.test(cham));
ok('acabou o palpite pelo nome do tipo',!/\/color\/i\.test\(eq\.tipo/.test(cham));
console.log('\nRESULTADO: ajustes v5.22.74 passaram!');
//<<<<SECAO:test_ajustes_v52274.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52275.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52275.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const chamadas=[];
const window={DIGICOPY_CLOUD:{token:()=>''},
  deleteVenda:function(id){chamadas.push('deleteVenda:'+id);return 'feito';},
  confirmSistema:function(){return Promise.resolve(true);},
  confirm:function(){return false;}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
const S=window.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.75 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));

// ── nada de adivinhação ──
ok('acabou o teto de exclusões',!/MAX_EXCLUSOES/.test(code));
ok('acabou a regra dos 30%',!/missing\.length\/conhecidos>0\.30/.test(code));
ok('sumiço sem ordem não apaga nada na nuvem',/if\(!missing\.some\(mandadoApagar\)\)\{[\s\S]{0,400}delete state\.known\[k\]/.test(code));
ok('a marca do que ele apagou é durável (sobrevive a fechar o programa)',
  /excluidosDeProposito/.test(code)&&/MARCA_EXCLUSAO_VALE/.test(code)&&/alvo\[k\]=\{em:Date\.now\(\),v:Number\(state\.versions\[k\]\|\|0\)\}/.test(code));
ok('exclusão de propósito não tem limite de quantidade',!/missing\.length>/.test(code));

// ── o sinal de intenção ──
ok('parte fria: ninguém mandou apagar',S.houveIntencaoDeExcluir()===false);
window.deleteVenda('v1');
ok('função de excluir do sistema abre a janela',S.houveIntencaoDeExcluir()===true&&chamadas[0]==='deleteVenda:v1');

const codigo2=code;
const w2={DIGICOPY_CLOUD:{token:()=>''},confirmSistema:function(){return Promise.resolve(true);}};
new Function('window','localStorage','document','db',codigo2)(w2,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
const S2=w2.DIGICOPY_CLOUD_SYNC;
ok('sem confirmar, continua frio',S2.houveIntencaoDeExcluir()===false);
return_test();
function return_test(){
  w2.confirmSistema('apagar?').then(()=>{
    ok('confirmar SIM abre a janela',S2.houveIntencaoDeExcluir()===true);
    const w3={DIGICOPY_CLOUD:{token:()=>''},confirmSistema:function(){return Promise.resolve(false);}};
    new Function('window','localStorage','document','db',code)(w3,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
    w3.confirmSistema('apagar?').then(()=>{
      ok('confirmar NÃO mantém tudo travado',w3.DIGICOPY_CLOUD_SYNC.houveIntencaoDeExcluir()===false);
      // v5.22.76: o conserto que devolvia dado da nuvem saiu (trazia nome de
      // demonstração de volta). Fica só a devolução da cópia local, uma vez só.
      ok('a devolução do que sumiu roda uma vez e nunca mais',/if\(state\.devolucao===DEVOLUCAO\)return 0;/.test(code));
      ok('o vigia é religado depois que os módulos carregam',/setTimeout\(vigiarExclusoes,4000\)/.test(code)&&/setTimeout\(vigiarExclusoes,15000\)/.test(code));
      ok('confere duas vezes antes de apagar (base abrindo)',/const CONFIRMA_SUMICO=3000/.test(code)&&/if\(!state\.sumindo\[k\]\)\{ state\.sumindo\[k\]=agora; continue; \}/.test(code));
      ok('registro que reaparece cancela a exclusão',/if\(state\.sumindo\[k\]\)delete state\.sumindo\[k\];/.test(code));
      ok('a conferência não é limite de quantidade',/pode ser\n    \/\/ 1 ou 5\.000/.test(code));
      console.log('\nRESULTADO: ajustes v5.22.75 passaram!');
    });
  });
}
//<<<<SECAO:test_ajustes_v52275.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52276.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52276.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const idb=fs.readFileSync('indexeddb_persistence_patch.js','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.76 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));

// ── 1. nenhum PC apaga dado sozinho ──
ok('o espelho que apagava dado do PC foi removido',!/espelharNuvem|planejarEspelho/.test(code));
ok('o conserto que ressuscitava dado foi removido',!/repararApagao|agruparApagao/.test(code));

// ── 2. devolver o que o espelho levou ──
const cópia={usuarios:[{id:'u1',nome:'Kauan'},{id:'u2',nome:'Maria'}],
             recargas:[{id:'r1',nome:'Toner 105A'}],
             tecnicos:[{id:'t3',nome:'Rafael Lima',especialidade:'Grande formato'}],
             logs:[{id:'l1'}]};
const db={usuarios:[{id:'u1',nome:'Kauan'}],recargas:[],tecnicos:[],logs:[]};
const window={DIGICOPY_CLOUD:{token:()=>''},
  ehTecnicoDemo:t=>['t1','t2','t3'].indexOf(t&&t.id)>=0,
  DIGICOPY_INDEXED_DB:{readRecoverySnapshot:async n=>n==='antes_espelhar_nuvem'?cópia:null},
  saveDB:()=>{}};
new Function('window','localStorage','document','db',code)(window,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,db);
const S=window.DIGICOPY_CLOUD_SYNC;

S.devolverSumidos().then(n=>{
  ok('devolve o usuário de login que sumiu',db.usuarios.length===2&&db.usuarios.some(u=>u.id==='u2'));
  ok('devolve o produto de recarga que sumiu',db.recargas.length===1&&db.recargas[0].id==='r1');
  ok('NÃO devolve nome de demonstração',db.tecnicos.length===0);
  ok('NÃO devolve auditoria',db.logs.length===0);
  ok('conta certo quantos voltaram',n===2);
  return S.devolverSumidos();
}).then(n2=>{
  ok('roda uma vez só por computador',n2===0&&db.usuarios.length===2);

  // ── 3. nomes de teste nunca mais ──
  ok('o sistema sabe quem é nome de demonstração',/ehTecnicoDemo/.test(app)&&/Rafael Lima/.test(app)&&/TECNICOS_DEMO/.test(app));
  ok('nome de demonstração é varrido do PC e da nuvem',/function varrerDemonstracao/.test(code)&&/naFila\.add\(k\);/.test(code));
  ok('a limpeza é de uma vez só, sem regra permanente',/if\(state\.faxina===FAXINA\)return 0;/.test(code)&&!/ehLixoDeDemonstracao\(change\.entity/.test(code));
  const sujo={tecnicos:[{id:'t3',nome:'Rafael Lima'},{id:'x9',nome:'Técnico de verdade'}]};
  const w2={DIGICOPY_CLOUD:{token:()=>''},ehTecnicoDemo:t=>['t1','t2','t3'].indexOf(t&&t.id)>=0,saveDB:()=>{}};
  new Function('window','localStorage','document','db',code)(w2,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,sujo);
  const varridos=w2.DIGICOPY_CLOUD_SYNC.varrerDemonstracao();
  ok('Rafael Lima sai da lista',varridos===1&&sujo.tecnicos.length===1&&sujo.tecnicos[0].id==='x9');
  ok('técnico de verdade fica',sujo.tecnicos[0].nome==='Técnico de verdade');

  // ── 4. a tela da nuvem não quebra mais ──
  ok('a cópia de recuperação pode ser lida de volta',/readRecoverySnapshot/.test(idb)&&/DIGICOPY_INDEXED_DB=\{writeNow,writeRecoverySnapshot,readRecoverySnapshot/.test(idb));
  // v5.22.82: as contas viraram um resumo guardado, que gasta muito menos do banco.
  ok('a contagem não derruba mais a tela',/async function resumoDaNuvem/.test(worker)&&/DIGICOPY_RESUMO_AGRUPADO/.test(worker));
  ok('conta que falha não derruba a tela',/DIGICOPY_RESUMO_PARCIAL/.test(worker));
  ok('o erro da API agora diz o motivo',/detail: motivo/.test(worker)&&/' Motivo: ' \+ motivo/.test(worker));
  ok('as migrações do banco existem',fs.existsSync('cloudflare-worker/migrations/0003_indices_contagem.sql')&&fs.existsSync('cloudflare-worker/migrations/0004_menos_gravacoes.sql'));

  console.log('\nRESULTADO: ajustes v5.22.76 passaram!');
}).catch(e=>{console.error(e);process.exit(1);});
//<<<<SECAO:test_ajustes_v52276.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52277.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52277.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const app=fs.readFileSync('app.js','utf8');
const menus=fs.readFileSync('ajustes_v52213_menus_atalhos_patch.js','utf8');
const rec=fs.readFileSync('ajustes_v52214_recargas_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.77 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));

// ── 1. nome de demonstração: limpeza de uma vez, NÃO regra ──
ok('a nuvem não recusa mais nome nenhum',!/ehLixoDeDemonstracao\(change\.entity/.test(code));
ok('a faxina roda uma vez só e nunca mais',/if\(state\.faxina===FAXINA\)return 0;/.test(code)&&/state\.faxina=FAXINA;/.test(code));
const sujo={tecnicos:[{id:'t3',nome:'Rafael Lima'},{id:'x9',nome:'Técnico de verdade'}]};
const w={DIGICOPY_CLOUD:{token:()=>''},ehTecnicoDemo:t=>['t1','t2','t3'].indexOf(t&&t.id)>=0,saveDB:()=>{}};
new Function('window','localStorage','document','db',code)(w,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,sujo);
const S=w.DIGICOPY_CLOUD_SYNC;
ok('a limpeza tira os nomes velhos',S.varrerDemonstracao()===1&&sujo.tecnicos.length===1);
sujo.tecnicos.push({id:'t3',nome:'Rafael Lima'});
ok('depois de limpa, ninguém mais é barrado',S.varrerDemonstracao()===0&&sujo.tecnicos.length===2);

// ── 2. submenu Chamados dentro de Contratos: não existe ──
ok('Chamados saiu do menu de contratos',!/label:'Contratos de locação'\}[\s\S]{0,300}label:'Chamados'/.test(app));
ok('o resto do menu de contratos continua',/label:'Contratos de locação'/.test(app)&&/label:'Máquinas nos clientes'/.test(app)&&/label:'Leituras'/.test(app));
ok('a tela de chamados continua existindo',/function openQuickOS/.test(app));

// ── 3. submenu Recargas dentro de Cadastros: não existe ──
const cad=menus.slice(menus.indexOf("id:'cadastros'"),menus.indexOf("id:'financeiro'"));
ok('Recargas saiu de Cadastros',!/id:'recargas'/.test(cad));
ok('Cadastros continua com Clientes e Novo cliente',/label:'Clientes'/.test(cad)&&/label:'Novo cliente'/.test(cad));
ok('ninguém injeta mais o atalho de recargas',!/id:'recargas'/.test(rec));
ok('a tela de recargas continua existindo',/abrirAbaRecargas/.test(rec));
console.log('\nRESULTADO: ajustes v5.22.77 passaram!');
//<<<<SECAO:test_ajustes_v52277.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52278.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52278.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

console.log('== AJUSTES v5.22.78 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));
ok('a janela da nuvem abre mesmo se a contagem falhar',/contagemFalhou=e\.message/.test(painel)&&/status=\{device:salvo,totals:/.test(painel));
ok('sem autorização guardada ainda mostra o erro de sempre',/if\(!salvo\)\{/.test(painel));
ok('senha errada continua desconectando',/if\(e\.status===401\)\{forgetAuth\(\);return renderDisconnected\(body\);\}/.test(painel));
ok('a pessoa é avisada do motivo, sem susto',/Os números da nuvem não puderam ser contados agora/.test(painel)&&/NÃO atrapalha a sincronização/.test(painel));
ok('sincronizar-agora saiu da tela (r46: automático), ver-excluídos ficou',!/dc-sync-now/.test(painel)&&/dc-list-deleted/.test(painel));
ok('no servidor, a contagem virou resumo guardado',/async function resumoDaNuvem/.test(worker));
ok('o erro do servidor diz o motivo',/detail: motivo/.test(worker));
console.log('\nRESULTADO: ajustes v5.22.78 passaram!');
//<<<<SECAO:test_ajustes_v52278.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52280.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52280.js:INICIO>>>>
const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const painel=fs.readFileSync('cloudflare_sync_patch.js','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const w={DIGICOPY_CLOUD:{token:()=>''}};
new Function('window','localStorage','document','db',code)(w,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},undefined,{});
const S=w.DIGICOPY_CLOUD_SYNC;

console.log('== AJUSTES v5.22.80 ==');
ok('versão continua na família 5.22',/^\d+\.\d+\.\d+/.test(pkg.version));
const recado="D1_ERROR: Your account has exceeded D1's free tier daily row write limit. Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.";
ok('o sistema reconhece o limite diário do banco grátis',S.ehLimiteDiario(recado)===true);
ok('erro comum não é confundido com limite',S.ehLimiteDiario('Falha de rede')===false&&S.ehLimiteDiario('')===false);
// v5.24.34 — SUPERSESSÃO: o recado do limite parou de falar "de hoje/grátis"
// (era o mundo gratuito); no plano pago o limite é do PERÍODO (mensal).
// v7.0.17 (rodada 28) — o aviso passou a dizer DE ONDE vem a parada (o freio
// preventivo do motor, não o teto do plano): era essa confusão que fazia parecer
// que ele estava no plano grátis quando o freio disparava.
ok('o aviso é em português e diz que nada se perdeu',/Nada foi perdido/.test(S.recadoDoLimite())&&/freio preventivo de gravações/.test(S.recadoDoLimite()));
ok('e o aviso NÃO chama o dono de plano grátis (a conta dele é paga)',!/teto grátis|plano grátis/i.test(S.recadoDoLimite()));
ok('o app reconhece o recado do freio do MÊS também (plano pago tem teto mensal)',S.ehLimiteDiario('D1_ERROR: monthly row write limit reached')===true);
ok('o aviso diz a hora de Brasília',/21h, horário de Brasília/.test(S.recadoDoLimite()));
const virada=S.viradaDoLimite();
ok('a virada é depois de agora e dentro de 24h',virada>Date.now()&&virada-Date.now()<=24*3600000+200000);
ok('a virada é meia-noite no horário de Londres',new Date(virada).getUTCHours()===0);
ok('para de bater na porta à toa enquanto o limite não vira',/timer=setTimeout\(\(\)=>tick\('limite-conferido'\)/.test(code));
ok('a hora da virada fica guardada',/state\.limiteAte=viradaDoLimite\(\)/.test(code));
ok('o painel também mostra o recado em português',/motorLimite\(contagemFalhou\)\)contagemFalhou=window\.DIGICOPY_CLOUD_SYNC\.recadoDoLimite\(\)/.test(painel));
console.log('\nRESULTADO: ajustes v5.22.80 passaram!');
//<<<<SECAO:test_ajustes_v52280.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52292.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52292.js:INICIO>>>>
// Teste v5.22.92 — orçamento nunca some do banco por mandado da nuvem
const fs = require('fs');
let falhas = 0;
function ok(cond, msg){ if(cond){ console.log('  ok -', msg); } else { falhas++; console.log('  FALHOU -', msg); } }
console.log('== v5.22.92 — travas anti-sumidouro de orçamento ==');
const s = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');

ok(s.indexOf("change.entity==='orcamentos'") >= 0 && s.indexOf("arr[idx].status='excluido'") >= 0,
  'delete que VEM da nuvem para orçamento vira "excluído" (não some do banco)');
// v7.0.9 — a trava "nunca manda delete de orçamento" saiu: ela fazia o orçamento
// apagado PELA FICHA DO CLIENTE voltar (a ordem mais nova dele, v5.24.5, escrita
// no próprio módulo da ficha, diz "deletar é DE VEZ... a nuvem recebe o comando de
// apagar"). A proteção da v5.22.92 que importa — delete vindo DA NUVEM não remove o
// orçamento daqui — continua no lugar (conferida na linha acima), e o envio só
// acontece para o que ELE apagou (marca da v7.0.7), nunca por sumiço sozinho.
ok(s.indexOf("entity==='orcamentos')continue") < 0,
  'este PC PODE mandar delete de orçamento que ele mesmo apagou (v7.0.9)');
ok(s.indexOf("delete vindo DA NUVEM não remove o") >= 0,
  'a proteção contra sumiço por ordem da nuvem continua documentada');
ok(s.indexOf('ORÇAMENTO NUNCA SOME POR MANDADO DA NUVEM') >= 0,
  'a regra está comentada para o próximo leitor');

// regressões de orçamento continuam
const v237 = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
ok(v237.indexOf('__orc_render_ids') >= 0, 'snapshot da lista (v5.22.91) continua');
ok(v237.indexOf("o.status!=='excluido'") >= 0, 'lista de trabalho continua escondendo os excluídos');
const v261 = fs.readFileSync('ajustes_v52261_orcamento_nao_volta_patch.js', 'utf8');
ok(v261.indexOf('function orcamentoPodeFicar') >= 0, 'vassoura de ressuscitados continua (excluído não volta sozinho)');

if(falhas){ console.log('\n' + falhas + ' FALHA(S)'); process.exit(1); }
console.log('\nTudo certo v5.22.92!');
//<<<<SECAO:test_ajustes_v52292.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v6004.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v6004.js:INICIO>>>>
// test_ajustes_v6004.js — v6.0.4: CURA DEFINITIVA DA SESSÃO + PERFIS DA NUVEM
// A prova do diagnóstico DELE: sessão "(nenhuma?!)" com 1 empresa no banco.
// Causa: a cura 6.0.2 só tentava 30s depois de abrir o sistema e marcava "já
// fez" na 1ª passada — login depois disso = dia inteiro sem carimbo.
const fs = require('fs');
// v6.1.4 (22/09/2026) — a versão sai do package.json (subir versão não reescreve teste)
const VERSAO_APP = JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version;
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pnc = fs.readFileSync('perfis_nuvem_cura_sessao_patch.js', 'utf8');
const sync = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const vig = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');
const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 216; override v6.0.9 (214), 6 submenus v6.0.10 (215), hover NF-e/NFC-e v6.0.11 fecha a fila', man.length >= 225 && man[208] === 'perfis_nuvem_cura_sessao_patch.js' && man[209] === 'permissoes_estorno_venda_patch.js' && man[210] === 'fiscal_menu_completo_patch.js' && man[211] === 'dashboard_inicio_clicavel_patch.js' && man[212] === 'menus_fiscais_separados_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[205] === 'fiscal_guard_patch.js' && man[206] === 'nf_transmissao_patch.js' && man[207] === 'autocura_empresa_central_nf_tela_patch.js');
ok('bundle contém o patch da cura (PURE + banner)', bundle.indexOf('pncProximoPasso') >= 0 && bundle.indexOf('v6.0.4 — cura da sessão DEFINITIVA') >= 0);
ok('bundle NÃO contém mais o botão Reparar (r46)', bundle.indexOf('dc-reparar-sessao') < 0 && bundle.indexOf('Reparar sessão agora') < 0);

console.log('== CURA DA SESSÃO (patch novo) ==');
ok('patch tem PURE exportável e testável', pnc.indexOf('PNC604_PURE_START') >= 0 && pnc.indexOf("module.exports={pncProximoPasso") >= 0);
ok('sonda aguenta 10 MINUTOS (2s × 300), não 30s', pnc.indexOf('tent>300') >= 0 && /},2000\)/.test(pnc));
ok('rearmada a cada login (wrap do setSession)', pnc.indexOf("window.setSession") >= 0 && pnc.indexOf('__pnc604') >= 0);
ok('rearmada quando a nuvem grava (wrap do db.save, 4s de respiro)', pnc.indexOf('db.save') >= 0 && pnc.indexOf('agora-ultima>4000') >= 0);
ok('botão manual exportado: window.acForcarCura', pnc.indexOf('window.acForcarCura=acForcarCura') >= 0);
ok('regra segura MANTIDA: 2+ empresas não chuta (definitivo-multi)', pnc.indexOf("definitivo-multi") >= 0 && pnc.indexOf('não chuta') >= 0);
ok('auditoria própria da cura (autocura-604)', pnc.indexOf('autocura-604') >= 0);

// unidade PURA da decisão (sem DOM)
const P = require('./perfis_nuvem_cura_sessao_patch.js');
ok('PURE: sem login → esperar', P.pncProximoPasso({ temSessao: false, nEmpresas: 1 }) === 'esperar');
ok('PURE: sessão já tem empresa → resolvido', P.pncProximoPasso({ temSessao: true, sessTemEmpresa: true, nEmpresas: 1 }) === 'resolvido');
ok('PURE: sessão vazia + 1 empresa → carimbar-sessao (O CASO DELE)', P.pncProximoPasso({ temSessao: true, sessTemEmpresa: false, nEmpresas: 1 }) === 'carimbar-sessao');
ok('PURE: sessão vazia + 2 empresas → definitivo-multi (não chuta)', P.pncProximoPasso({ temSessao: true, sessTemEmpresa: false, nEmpresas: 2 }) === 'definitivo-multi');
ok('PURE: banco vazio (nuvem descendo) → esperar', P.pncProximoPasso({ temSessao: true, sessTemEmpresa: false, nEmpresas: 0 }) === 'esperar');
ok('PURE: estourou tentativas → fim-tentativas', P.pncProximoPasso({ temSessao: true, sessTemEmpresa: false, nEmpresas: 0, tentativas: 301, teto: 300 }) === 'fim-tentativas');

console.log('== DIAGNÓSTICO + BOTÃO (5227) ==');
ok('resposta do diagnóstico saiu com a faixa (r46)', vig.indexOf('semSessaoComUmaEmpresa') < 0 && vig.indexOf('A CAUSA ESTÁ AQUI EM CIMA') < 0);
ok('detalhe técnico saiu junto', vig.indexOf('30 segundos') < 0);
ok('botão verde Reparar saiu (cura automática continua no patch da cura)', vig.indexOf("rp.id='dc-reparar-sessao'") < 0 && vig.indexOf('dc-reparar-sessao') < 0);
ok('fallback do botão saiu junto', vig.indexOf('ainda não carregou nesta tela') < 0);

console.log('== PERFIS DA NUVEM (app) ==');
ok('gastos trancados: usoBloco só no admin', sync.indexOf("(isAdmin?usoBloco:'')+linhaVersaoNuvem") >= 0);
ok('botão Nuvem aparece pra todo PC', /if\(cloud\)cloud\.style\.display='';/.test(sync) && sync.indexOf('v6.0.4 — pedido dele: o botão Nuvem aparece em TODO PC') >= 0);
ok('tela Nuvem abre pra todo PC (trava antiga de usuário removida; papel é do APARELHO)', !/!systemAdmin\(\)&&token\(\)/.test(sync) && sync.indexOf('PAPEL DO APARELHO') >= 0);
ok('desconectar só a si (rótulo claro + explicação)', sync.indexOf('Desconectar ESTE computador') >= 0 && sync.indexOf('Tira só ESTE computador') >= 0);
ok('zona de admin segue trancada no papel do aparelho', sync.indexOf("d.role==='admin'") >= 0);

console.log('== PERFIS DA NUVEM (worker 5.28.2) ==');
ok('worker na 5.28.2', wk.indexOf("WORKER_VERSION = '5.28.2'") >= 0);
ok('enroll-cnpj aceita a senha do GERENTE → role admin', wk.indexOf("via = 'cnpj-gerente'") >= 0 && wk.indexOf("role = 'admin'") >= 0);
ok('senha errada (conexão OU gerente) cai no MESMO erro de sempre (anti-oráculo)', wk.indexOf("if (!gerOk) throw new ApiError(403, 'CNPJ_OU_SENHA_INVALIDOS', 'CNPJ ou senha de conexão incorretos.');") >= 0);
ok('admin só com senhas DIFERENTES (gerente ≠ conexão)', wk.indexOf('seg.gerente_hash !== seg.conn_hash') >= 0);
const segEnroll = wk.slice(wk.indexOf("/v1/enroll-cnpj"), wk.indexOf("/v1/enroll-cnpj") + 5000);
ok('gerente só com o CNPJ DA DONA', /cnpj === seg\.owner_cnpj[\s\S]{0,120}conferirSenha\(env, cnpj, senha, 'gerente_hash'\)/.test(segEnroll));
ok('role entra VÁRIAVEL no INSERT do device (nada fixo)', segEnroll.indexOf("VALUES ('device_enrolled', ?, ?, ?, ?)") >= 0 && segEnroll.indexOf("VALUES (?, ?, ?, 'device'") < 0);
ok('eclusa anti-trancamento: connect-pass aceita prova de GERENTE (v5.26.7)', wk.slice(wk.indexOf("/v1/connect-pass"), wk.indexOf("/v1/connect-pass") + 1200).indexOf('requireAdminOuGerente(request, env)') >= 0 && wk.indexOf('eclusa anti-trancamento') >= 0);

console.log('== CARIMBO 6.0.4 ==');
ok('package.json na 6.0.4', pkg.version === VERSAO_APP);
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && html.indexOf('>v' + VERSAO_APP + '<') >= 0 && html.indexOf('app.bundle.js?v=' + VERSAO_APP) >= 0);
ok('celular carimbado 6.0.4', mob.indexOf("DIGICOPY_APP_VERSION = '" + VERSAO_APP + "'") >= 0 && mob.indexOf('>v' + VERSAO_APP + '<') >= 0);

console.log('\n' + pass + ' passaram, ' + fail + ' falharam.');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.4: sessão nunca mais fica sem carimbo (sonda 10min + rearma no login e no db.save + botão Reparar); Nuvem com 2 papéis (gerente=admin com gastos; comum=sem gastos, só desconecta a si).');
//<<<<SECAO:test_ajustes_v6004.js:FIM>>>>
}

if (false) { // ═══ test_exe_so_nuvem.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_exe_so_nuvem.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// v6.1.6 (22/09/2026) — PEDIDO DO DONO: "esse da nuvem é possível fazer um .exe
// só pra isso? só pra conectar na nuvem no sistema".
//
// O sistema inteiro mora na nuvem: o PC não precisa do programa nem do banco
// (o .exe do sistema antigo tinha 100 MB porque levava o Firebird dentro). O
// que sobra para o PC é UM ícone: clicou, o sistema abre já ligado na nuvem.
//
// Este teste trava o que foi entregue para esse pedido:
//   • CRIAR_EXE_SO_NUVEM.cmd  — o dois-cliques que gera o .exe
//   • nuvem/criar_exe_so_nuvem.ps1 — compila o lancador (sem baixar nada)
//   • nuvem/abrir_digicopy.vbs — o atalho que abre o sistema
// E trava também o que NÃO pode acontecer: nada de modal nativo, nada de
// baixar programa da internet, nada de guardar dado no PC.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const fs = require('fs');
const path = require('path');

let ok = 0, falhas = 0;
function t(nome, cond, detalhe) {
  if (cond) { ok++; console.log('  ✔ ' + nome); }
  else { falhas++; console.log('  ✘ ' + nome + (detalhe ? ' — ' + detalhe : '')); }
}
function ler(p) { return fs.readFileSync(p, 'utf8'); }
function existe(p) { return fs.existsSync(p); }

console.log('\n== 1) O .exe que só conecta na nuvem (pedido dele) ==');

const CMD = 'CRIAR_EXE_SO_NUVEM.cmd';
const PS1 = path.join('nuvem', 'criar_exe_so_nuvem.ps1');
const VBS = path.join('nuvem', 'abrir_digicopy.vbs');

t('existe o dois-cliques CRIAR_EXE_SO_NUVEM.cmd', existe(CMD));
t('existe o script que compila o .exe (nuvem/criar_exe_so_nuvem.ps1)', existe(PS1));
t('existe o atalho que abre o sistema (nuvem/abrir_digicopy.vbs)', existe(VBS));

const cmd = existe(CMD) ? ler(CMD) : '';
const ps1 = existe(PS1) ? ler(PS1) : '';
const vbs = existe(VBS) ? ler(VBS) : '';

// A janela não pode fechar sozinha: se der erro, ele precisa LER a tela.
t('a janela do .cmd NÃO fecha sozinha (dá para ler o erro e tirar foto)',
  cmd.indexOf('cmd /k') >= 0 && /NUNCA FECHA SOZINHA/.test(cmd));
t('o .cmd abre em janela própria (dois-cliques, sem terminal escondido)',
  /^@echo off/.test(cmd.trim()) && cmd.indexOf('start "DIGICOPY') >= 0);
t('o .cmd chama o PowerShell no jeito que roda em qualquer Windows',
  cmd.indexOf('-NoProfile -ExecutionPolicy Bypass -File') >= 0 &&
  cmd.indexOf('nuvem\\criar_exe_so_nuvem.ps1') >= 0);
t('o .cmd avisa que não instala o sistema e não guarda dados neste PC',
  /NAO instala o sistema e NAO guarda dados neste PC/.test(cmd));
t('o .cmd dá o plano B quando o antivírus reclama do .exe',
  /antivirus/.test(cmd) && /abrir_digicopy\.vbs/.test(cmd));

console.log('\n== 2) O .exe é LEVE: compila no próprio Windows, não baixa nada ==');
t('compila o lancador com o Windows (Add-Type), sem baixar instalador',
  ps1.indexOf('Add-Type -TypeDefinition $codigo -OutputAssembly $destino -OutputType WindowsApplication') >= 0);
t('o .exe sai como programa de janela (não abre a telinha preta do prompt)',
  ps1.indexOf('-OutputType WindowsApplication') >= 0);
t('nada de baixar arquivo da internet (sem download de pacote)',
  !/Invoke-WebRequest|Start-BitsTransfer|iwr |curl |wget |npm install/i.test(ps1));
t('se não conseguir compilar, cai no atalho em vez de dar erro seco',
  /CreateShortcut/.test(ps1) && /wscript\.exe/.test(ps1));
t('o atalho nasce na Área de Trabalho com o nome DIGICOPY NUVEM',
  /DIGICOPY NUVEM\.lnk/.test(ps1) && /GetFolderPath\('Desktop'\)/.test(ps1));
t('o PowerShell novo (pwsh, sem compilador) é tratado, não ignora',
  ps1.indexOf('PSVersion.Major -ge 6') >= 0);

console.log('\n== 3) O que o .exe faz: abre o sistema ligado na nuvem ==');
t('o VBS abre o endereço oficial do sistema',
  vbs.indexOf('https://teste-60f.pages.dev') >= 0);
t('abre em janela limpa, sem barra de endereço (--app=, como o programa de antes)',
  vbs.indexOf('--app=') >= 0 && vbs.indexOf('--start-maximized') >= 0);
t('prefere o Edge (vem em todo Windows) e depois o Chrome',
  vbs.indexOf('Microsoft\\Edge\\Application\\msedge.exe') >= 0 &&
  vbs.indexOf('Google\\Chrome\\Application\\chrome.exe') >= 0 &&
  vbs.indexOf('msedge.exe') < vbs.indexOf('chrome.exe'));
t('procura o Chrome também na instalação por usuário (AppData)',
  vbs.indexOf('%LocalAppData%') >= 0);
t('sem Edge nem Chrome, abre no navegador padrão (nunca fica sem abrir)',
  vbs.indexOf('ShellExecute URL') >= 0);
t('nenhum aviso/modal nativo do Windows (regra 16: popup é do sistema)',
  !/MsgBox|WScript\.Echo|Popup\(/i.test(vbs));
t('o VBS não guarda nada e não escreve arquivo nenhum',
  !/CreateTextFile|WriteFile|SaveAs|localStorage/i.test(vbs));

console.log('\n== 4) O mesmo endereço em todo lugar (nada de link velho) ==');
const links = ler('links.js');
const SITE = (links.match(/const SITE = '([^']+)'/) || [])[1] || '';
t('links.js tem o endereço oficial do site', /^https:\/\//.test(SITE));
t('o .exe abre exatamente o mesmo endereço do links.js',
  vbs.indexOf(SITE) >= 0, 'no VBS: ' + SITE);
t('o compilador do .exe usa o mesmo endereço',
  ps1.indexOf(SITE) >= 0, 'no PS1: ' + SITE);

console.log('\n== 5) Arquivos de Windows: sem acento e com fim de linha certo ==');
const ascii = s => /^[\x00-\x7F]*$/.test(s);
t('o .cmd é só ASCII (acento quebra a janela preta do Windows)', ascii(cmd));
t('o .ps1 é só ASCII (PowerShell 5 lê sem acento sem erro)', ascii(ps1));
t('o .vbs é só ASCII (o Windows Script Host lê sem acento sem erro)', ascii(vbs));
t('o .cmd está em CRLF (fim de linha do Windows)', cmd.indexOf('\r\n') >= 0);
t('o .cmd não usa "pause" perdido: o fim é cmd /k (janela aberta)',
  cmd.indexOf('\npause') < 0);

console.log('\n== 6) O sistema continua sendo só nuvem (nada no PC) ==');
t('o .cmd/vbs/ps1 não copiam o sistema nem apontam para banco local',
  !/BANCO\.FDB|firebirdAPI|node-firebird|require\(.firebird/i.test(cmd + ps1 + vbs) &&
  !/copy .*app\.bundle|robocopy|xcopy/i.test(cmd + ps1 + vbs));
t('nenhum dos três grava dado do sistema no PC (é só o atalho de abrir)',
  !/localStorage|indexedDB|IndexedDB/i.test(cmd + ps1 + vbs));
t('a explicação do .exe vive no RELATORIO_SESSAO.md (novo chat entende)',
  ler('RELATORIO_SESSAO.md').indexOf('CRIAR_EXE_SO_NUVEM.cmd') >= 0);

console.log('\nRESULTADO: ' + (falhas === 0 ? 'o .exe que só conecta na nuvem está de pé!' : falhas + ' falha(s)'));
if (falhas) process.exitCode = 1;
//<<<<SECAO:test_exe_so_nuvem.js:FIM>>>>
}

if (false) { // ═══ test_sync_tela_ao_vivo.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_sync_tela_ao_vivo.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — SINCRONIZAÇÃO: ESPERA CURTA + TELA AO VIVO
//
// Relato do dono (23/09/2026): "o banco demora atualizar (sincronizar); o que
// faço em um computador não dá pra ver no outro". Duas causas:
//
//   1) ESPERA: o motor consultava a nuvem de 60 em 60 segundos e, com a janela
//      escondida (minimizada/atrás de outra), NÃO consultava mais nada — o PC
//      do balcão só se atualizava quando alguém clicava nele.
//   2) TELA: a novidade descia para o banco, mas a lista na tela continuava
//      mostrando o retrato antigo até a pessoa trocar de tela e voltar.
//
// Este teste trava os dois consertos, e principalmente as TRAVAS do redesenho:
// ele não pode acontecer com a pessoa digitando, com modal aberto, na janela
// escondida, em tela de documento ou em rajada.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++; console.log('  ✔ ' + nome);
}

const code = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const window = { DIGICOPY_CLOUD: { token: () => '' } };
new Function('window','localStorage','document', code)(
  window,
  { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  undefined
);
const S = window.DIGICOPY_CLOUD_SYNC;

console.log('== 1) A ESPERA ==');
ok('motor exportado', !!S && typeof S.tick === 'function');
ok('janela à vista: procura novidade a cada 3 segundos (quase instantâneo)', /HEARTBEAT_MS=3000/.test(code));
ok('com a janela escondida continua consultando (a cada 15s)',
   /HEARTBEAT_OCULTO_MS=15000/.test(code) && /const base=document\.hidden\?HEARTBEAT_OCULTO_MS:HEARTBEAT_MS/.test(code));
ok('ao clicar de volta na janela, procura NA HORA (tolerância de 1s)',
   /Date\.now\(\)-lastTick>1000/.test(code) && !/lastTick>10000/.test(code));
ok('continua sendo UMA consulta incremental por rodada (não baixa a base toda)',
   /\/v1\/changes\?cursor=/.test(code) && /if\(!data\.hasMore\)break;/.test(code));
ok('não existe mais o "reagenda sem consultar" que parava o PC escondido',
   !/if\(!document\.hidden\)tick\('heartbeat'\);else scheduleHeartbeat\(\)/.test(code));
ok('o carência do foco continua (não consulta em rajada ao alternar janelas)',
   /Date\.now\(\)-lastTick>1000/.test(code));

console.log('\n== 1b) A ABA ESQUECIDA NÃO SEGURA MAIS A ATUALIZAÇÃO ==');
ok('existe o caminho de leitura para aba visível', /async function tickSohLeitura\(reason\)/.test(code));
ok('aba escondida e não-líder não gasta consulta',
   /if\(!leader\(\)\)\{[\s\S]{0,200}document\.hidden\)return false;/.test(code));
ok('o caminho de leitura não envia remessa (quem envia é só a líder)',
   /tickSohLeitura[\s\S]{0,900}?pullAll\(\{silencioso:true\}\)/.test(code) &&
   !/tickSohLeitura[\s\S]{0,900}?pushOutbox\(/.test(code));
ok('a leitura de aba visível não faz trabalho de líder (não mexe em exclusões)',
   !/tickSohLeitura[\s\S]{0,900}?varrerDemonstracao/.test(code));

console.log('\n== 2) A TELA AO VIVO (regra pura) ==');
ok('regra exportada para teste', typeof S.podeRedesenharSync === 'function');
const base = { hidden:false, modalAberto:false, focoEmCampo:false, podeRenderizar:true, ultimo:0, agora:100000 };
ok('caso normal: pode redesenhar', S.podeRedesenharSync(base) === true);
ok('janela escondida: NÃO redesenha', S.podeRedesenharSync({ ...base, hidden:true }) === false);
ok('modal aberto: NÃO redesenha (pessoa pode estar cadastrando)', S.podeRedesenharSync({ ...base, modalAberto:true }) === false);
ok('cursor dentro de campo/botão: NÃO redesenha', S.podeRedesenharSync({ ...base, focoEmCampo:true }) === false);
ok('tela sem render conhecido (documento/importação): NÃO redesenha',
   S.podeRedesenharSync({ ...base, podeRenderizar:false }) === false);
ok('nunca em rajada: respeita os 4 segundos', S.podeRedesenharSync({ ...base, ultimo:99000, agora:100000 }) === false);
ok('v7.0.2 — durante a CARGA da nuvem não redesenha (nada aparece em pedaços)',
   S.podeRedesenharSync({ ...base, cargaAberta:true }) === false);
ok('passados os 4 segundos, libera', S.podeRedesenharSync({ ...base, ultimo:95000, agora:100000 }) === true);

console.log('\n== 2b) CARGA COMPLETA À VISTA (v7.0.2) ==');
ok('página maior por consulta (menos idas e voltas)', /const POR_PAGINA=1000/.test(code));
ok('o aviso de carga existe e cobre a tela', /id='digicopy-carga-nuvem'/.test(code) && /Baixando os dados da nuvem/.test(code));
ok('o aviso mostra a contagem do que já veio', /registros trazidos/.test(code));
ok('a carga completa é ligada na primeira sincronização', /pedirCarga\(!state\.initialPull\|\|reason==='baixar-tudo-da-nuvem'\)/.test(code));
// v7.0.3 — ordem do dono: "de mostrar dados quero NADA que envolva eu fazer
// alguma coisa, só quero que mostre normal". O aviso de carga só aparece quando
// este PC NÃO tem base (aí não há o que mostrar); com base, a leitura é silenciosa.
ok('o aviso de carga NÃO aparece quando já existe base neste PC',
   /const baseVazia=/.test(code) && /const comAviso=cargaCompleta&&baseVazia;/.test(code));
ok('com base aqui, a atualização chega sem tela nenhuma na frente',
   /tickSohLeitura[\s\S]{0,900}?silencioso:true/.test(code));
ok('o aviso some no fim e também se der erro (ninguém fica preso)',
   /mostrarCargaNuvem\(false\);\s*\/\/ nunca deixar/.test(code) && /finally\{if\(cargaAberta\)mostrarCargaNuvem\(false\)/.test(code));

console.log('\n== 3) QUEM FICA DE FORA (telas de documento) ==');
const telas = S.telasAoVivo || {};
ok('lista de telas ao vivo existe', Object.keys(telas).length >= 8);
// v7.0.19 — vendas e leituras VIRARAM ao vivo: os renders são só releitura da lista
// (o que se digita fica em modal/campo, protegido pela trava) e ficar de fora deixava
// a tela velha no outro PC ("não aparece"). Config continua de fora (o render escreve
// nos campos e apagaria o não-salvo); orcamento/importar nem são telas com view.
['vendas','leituras'].forEach(t => {
  ok('tela de lista "' + t + '" virou ao vivo (v7.0.19)', !!telas[t]);
});
['config','orcamento','importar'].forEach(t => {
  ok('tela de documento "' + t + '" NÃO está na lista', !telas[t]);
});
['clientes','produtos','contratos','parque','manutencao','financeiro','usuarios','dashboard'].forEach(t => {
  ok('tela de lista "' + t + '" está na lista', !!telas[t]);
});
ok('redesenha chamando o render da tela (não o navigateTo, que rola a página)',
   !/redesenharTelaAtual[\s\S]{0,900}navigateTo\(/.test(code));

console.log('\n== 4) O REDESENHO SÓ ACONTECE SE A LEITURA TROUXE MUDANÇA ==');
ok('o retorno do pullAll é considerado', /const mudouNaTela=await pullAll\(\)/.test(code) && /pedirCarga\(!state\.initialPull/.test(code));
ok('o redesenho é chamado no fim do ciclo, sob a decisão e sem se perder',
   /if\(mudouNaTela\)\{redesenhoPendente=true;tentarRedesenhoPendente\(\);\}/.test(code));

console.log('\n== 5) PUXAR AO ABRIR (v7.0.26, voto do dono) ==');
ok('leitura exposta para a navegação', typeof S.puxarAoAbrirTela === 'function');
ok('não fura ciclo em andamento', /async function puxarAoAbrirTela\(\)\{\s*if\(busy\) return false;/.test(code));
ok('carência anti-rajada ao pular de tela', /Date\.now\(\)-lastTick<2500/.test(code));
ok('delega para a leitura silenciosa', /return tickSohLeitura\('abrir-tela'\);/.test(code));
ok('devolve promessa (a troca de tela não espera)', typeof S.puxarAoAbrirTela().then === 'function');
const appjs = fs.readFileSync('app.js', 'utf8');
ok('navigateTo da raiz busca o novo ao abrir', /snc\.puxarAoAbrirTela\(\)/.test(appjs));
ok('a busca nunca quebra a navegação (try/catch)', /try\{[^}]{0,220}puxarAoAbrirTela\(\)/.test(appjs));

console.log('\nRESULTADO: ' + passou + ' verificações — sincronização quase em tempo real e tela que se atualiza sem atrapalhar!');
//<<<<SECAO:test_sync_tela_ao_vivo.js:FIM>>>>
}

if (false) { // ═══ test_recuperar_excluidos.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_recuperar_excluidos.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — TRAZER DE VOLTA O QUE FOI EXCLUÍDO (recuperação em massa)
//
// Contexto: a faxina da importação apagou contratos de verdade com as
// impressoras dentro (v7.0.1 corrigiu a causa). O dado não desapareceu da
// nuvem: ela marca a exclusão e GUARDA o conteúdo — então é possível trazer de
// volta. Este teste garante as regras que decidem O QUE volta:
//
//   • só as entidades de negócio (nunca usuarios/empresas/config/contadores);
//   • respeita o filtro de data (quando o dono quiser limitar);
//   • conta certo por entidade (o resumo que ele confirma na tela);
//   • registro quebrado/vazio não derruba o processo;
//   • nada é apagado ou sobrescrito — a operação só ADICIONA de volta.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++; console.log('  ✔ ' + nome);
}

// v7.0.2 — mora dentro do patch de backups (regra "um arquivo por módulo")
const arquivo = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
// o patch de backups tem as rotas de APAGAR backup dele (legítimas e antigas).
// Aqui interessa SÓ o bloco da recuperação — o que ele faz ou deixa de fazer.
const marca = '// TRAZER DE VOLTA O QUE FOI EXCLUÍDO';
const corte = arquivo.indexOf(marca);
if(corte < 0){ console.error('  ✘ bloco da recuperação não encontrado no patch de backups'); process.exit(1); }
const code = arquivo.slice(corte);
const window = {};
new Function('window','document','setInterval','console', code)(window, undefined, ()=>{}, { log: ()=>{} });
const R = window.DIGICOPY_RECUPERAR;

console.log('== 1) AS ENTIDADES QUE A FAXINA PODIA LEVAR ==');
ok('regras exportadas', !!R && typeof R.planejarRecuperacao === 'function');
['contratos','parque','leituras','os','contasReceber'].forEach(e=>{
  ok('entidade de negócio incluída: ' + e, R.ENTIDADES_PADRAO.indexOf(e) >= 0);
});
['usuarios','empresas','config','_seq','devices'].forEach(e=>{
  ok('NUNCA entra na recuperação: ' + e, R.ENTIDADES_PADRAO.indexOf(e) < 0);
});

console.log('\n== 2) O QUE VOLTA (regra pura) ==');
const lista = [
  { entity:'contratos',     recordId:'ctr1', data:{ numero:'CT-2021-0123', cliente:'CAIXA ESCOLAR GERALDO TELES DE MENEZES' }, deletedAt: 1700000000000 },
  { entity:'parque',        recordId:'prk1', data:{ modelo:'HP LaserJet' }, deletedAt: 1700000000000 },
  { entity:'parque',        recordId:'prk2', data:{ modelo:'Brother' },    deletedAt: 1700000000000 },
  { entity:'leituras',      recordId:'lei1', data:{ numero:'101' },        deletedAt: 1600000000000 },
  { entity:'usuarios',      recordId:'usr1', data:{ login:'admin' },       deletedAt: 1700000000000 },
  { entity:'config',        recordId:'cfg',  data:{ },                     deletedAt: 1700000000000 },
  null,
  { entity:'contratos' },
];
const plano = R.planejarRecuperacao(lista);
ok('traz contratos + parque + leituras', plano.total === 4);
ok('conta por entidade (é o que aparece na confirmação)',
   plano.porEntidade.contratos === 1 && plano.porEntidade.parque === 2 && plano.porEntidade.leituras === 1);
ok('usuarios NÃO volta', plano.escolhidos.every(r=>r.entity !== 'usuarios'));
ok('config NÃO volta', plano.escolhidos.every(r=>r.entity !== 'config'));
ok('registro quebrado/vazio é ignorado sem quebrar', plano.ignorados >= 2);
ok('período das exclusões calculado (para o resumo)',
   plano.primeiraExclusao === 1600000000000 && plano.ultimaExclusao === 1700000000000);

console.log('\n== 3) FILTRO DE DATA (trazer só uma faixa) ==');
const soRecentes = R.planejarRecuperacao(lista, { desde: 1650000000000 });
ok('filtra o que é mais antigo que a data', soRecentes.total === 3);
ok('mantém só o que é recente', soRecentes.escolhidos.every(r=>r.deletedAt >= 1650000000000));

console.log('\n== 4) O RESUMO EM LÍNGUA DE GENTE ==');
const texto = R.textoResumo(plano);
ok('diz o total', texto.indexOf('4 registro(s)') >= 0);
ok('fala "impressoras de contrato" em vez do nome técnico "parque"', texto.indexOf('impressoras de contrato') >= 0);
ok('mostra o período', /entre/i.test(texto));
ok('lista vazia avisa em vez de trazer nada', R.textoResumo(R.planejarRecuperacao([])) .indexOf('Nada para trazer') >= 0);
ok('rótulo reconhecível usa o nome que a pessoa conhece',
   R.rotuloExcluido({ entity:'contratos', recordId:'ctr1', data:{ numero:'CT-2021-0123' } }) === 'CT-2021-0123');
ok('rótulo cai para o id quando não tem nome',
   R.rotuloExcluido({ entity:'x', recordId:'abcdefghijklmno', data:{} }) === 'abcdefghijkl');

console.log('\n== 5) A OPERAÇÃO SÓ ADICIONA (nunca apaga) ==');
ok('usa a rota de restaurar do Worker', /\/v1\/restore/.test(code));
ok('lê a lista de excluídos do Worker (paginada, não só os últimos 200)',
   fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8').indexOf('/v1/deleted?limit=1000') >= 0);
ok('NÃO chama rota de apagar nada', !/\/v1\/backup'[\s\S]{0,80}DELETE/.test(code) && !/'DELETE'/.test(code));
ok('pede confirmação no modal do sistema (não no diálogo do navegador)',
   /confirmSistema/.test(code) && !/\bconfirm\(/.test(code) && !/\balert\(/.test(code) && !/\bprompt\(/.test(code));
ok('a recuperação automática continua de onde parou (levas antigas)',
   /continua de onde parou/.test(fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8')));
ok('explica que só ADMIN pode (o Worker exige)', /requireAdmin/.test(code));

console.log('\n== 6) RECUPERAÇÃO AUTOMÁTICA (v7.0.4 — sem clicar em nada) ==');
const motor = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const w2 = { DIGICOPY_CLOUD: { token: () => '' } };
new Function('window','localStorage','document', motor)(w2, { getItem: () => null, setItem: () => {}, removeItem: () => {} }, undefined);
const SYNC = w2.DIGICOPY_CLOUD_SYNC;
ok('a regra do dono humano existe no motor (só traz o que gente criou)', typeof SYNC.temDonoHumano === 'function');
ok('registro criado na tela é recuperável', SYNC.temDonoHumano({ data:{ criadoPor:'usr_kauan' } }) === true);
ok('registro de exemplo do sistema NÃO é recuperado', SYNC.temDonoHumano({ data:{ criadoPor:'sistema' } }) === false);
ok('registro sem autor NÃO é recuperado', SYNC.temDonoHumano({ data:{} }) === false);
ok('registro vindo da importação do sistema antigo É recuperado (é dado real)',
   SYNC.temDonoHumano({ data:{ criadoPor:'migracao' } }) === true);
ok('a recuperação não "gasta" a passada enquanto o motor da nuvem for antigo',
   /if\(!varreduraCompleta\)\{/.test(motor) && /enfileirarRecado\('motor-antigo:'\+MOTOR_MINIMO/.test(motor));
// v7.0.8 — "motor novo" passou a significar o motor que NÃO PULA registro: a
// prova é o par (entidade, id) do cursor composto, e não só o `temMais` (o 5.26.6
// tinha `temMais` e mesmo assim perdia registros — provado em
// test_recuperacao_completa.js). Sem isto, o carimbo na nuvem diria "já recuperei"
// e a varredura completa nunca aconteceria depois de publicar o motor certo.
ok('só marca a varredura completa quando o motor devolve o cursor composto',
   /if\(r&&r\.proximoEntity&&r\.proximoId\)varreduraCompleta=true;/.test(motor));
ok('a recuperação automática existe e é chamada sozinha', /async function recuperarAutomatico\(/.test(motor) && /setTimeout\(\(\)=>\{ try\{recuperarAutomatico\(\);\}catch\(e\)\{\} \},4000\)/.test(motor));
ok('roda uma vez por PC (não fica repetindo)',
   /state\.recuperacaoV1=true/.test(motor) && /if\(state\.recuperacaoV1\|\|recuperandoAgora\)return;/.test(motor));
ok('nunca traz duas vezes o mesmo registro (lista do que já trouxe)',
   /RECUP_LEDGER/.test(motor) && /function marcarRecuperado/.test(motor) && /!jaRecuperado\(jaVieram,r\.entity,r\.recordId\)/.test(motor));
// v7.0.8 — a lista do que já trouxe passou a ser por ENTIDADE+id: antes era só
// pelo id, e duas listas com o mesmo id (contrato 7 x parque 7) se confundiam —
// uma delas nunca era recuperada. A leitura aceita as chaves antigas.
ok('a lista do que já trouxe diz de QUEM é o id (e aceita as chaves antigas)',
   /function jaRecuperado\(memoria,entity,recordId\)/.test(motor) &&
   /m\[String\(entity\)\+'\|'\+String\(recordId\)\]\|\|m\[String\(recordId\)\]/.test(motor));
ok('só tenta de novo a cada 60s se falhar (não fica batendo na porta)', /recuperacaoTentativa/.test(motor) && /<60000\)return/.test(motor));
ok('avisa no sino o que voltou', /Recuperação automática: '/.test(motor));
ok('registra na Auditoria', /logAction\('recuperacao','automatica'/.test(motor));
ok('segunda fonte: fotos internas do PC', /async function recuperarDasFotosLocais\(/.test(motor));
ok('as fotos só devolvem contrato/parque/leitura/chamado',
   /const entidades=\['contratos','parque','leituras','os'\];/.test(motor));
ok('registro vindo de foto fica marcado (rastreável)', /recuperadoDe:'foto-local'/.test(motor));
ok('o IndexedDB sabe listar as fotos', /listSnapshots:getAllSnapshots/.test(fs.readFileSync('indexeddb_persistence_patch.js','utf8')));
ok('a varredura da nuvem é paginada (alcança o que foi apagado há meses)',
   /for\(let volta=0;volta<40;volta\+\+\)/.test(motor) && /url\+='&before='\+before/.test(motor));
// v7.0.8 — cursor COMPOSTO (deleted_at, entidade, id) e nada pedido duas vezes:
// sem ele, os registros excluídos no mesmo milissegundo que caíam no fim de uma
// página nunca eram alcançados (defeito provado em test_recuperacao_completa.js).
ok('a paginação usa o cursor composto e não repete registro',
   /beforeEntity=/.test(motor) && /beforeId=/.test(motor) &&
   /if\(vistos\.has\(chave\)\)continue;/.test(motor));

console.log('\n== 7) AVISO INSTANTÂNEO (a nuvem avisa o PC) ==');
const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
ok('o motor da nuvem tem o canal do aviso instantâneo', worker.indexOf("'/v1/changes/watch'") >= 0 && /async function handleChangesWatch/.test(worker));
ok('o canal NÃO grava nada (só confere se apareceu novidade)', /SELECT MAX\(seq\) AS maxSeq FROM changes/.test(worker) && !/INSERT|UPDATE|DELETE/.test(worker.slice(worker.indexOf('async function handleChangesWatch'), worker.indexOf('async function handleDeleted'))));
ok('o canal é curto de propósito (no máximo 25 s por consulta)', /Math\.min\(25, Math\.max\(3, pedido\)\)/.test(worker));
ok('PC com motor novo + motor de nuvem antigo volta sozinho para o ritmo normal',
   /if\(st===404\|\|st===400\)\{ canalInstantaneoParado=true; \}/.test(motor));
ok('o canal só abre com a janela à vista (não gasta à toa)',
   /if\(typeof document!=='undefined'&&document\.hidden\)return;/.test(motor));
ok('a nuvem carimba a versao nova do motor', /WORKER_VERSION = '5\.28\.2'/.test(worker));

console.log('\nRESULTADO: ' + passou + ' verificações — recuperação em massa segura e explicada!');
//<<<<SECAO:test_recuperar_excluidos.js:FIM>>>>
}

if (false) { // ═══ test_tela_nao_seca.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_tela_nao_seca.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE — A TELA NÃO PODE MAIS "SECAR" (v7.0.5)
//
// O dono publicou o motor da nuvem 5.26.6 e continuou vendo lentidão. A causa não
// era a nuvem: eram defeitos do PRÓPRIO PC, e o pior deles era este —
//
//   `podeRedesenharSync` recusava o redesenho quando o foco estava em um BUTTON.
//   Como clicar em qualquer MENU deixa o foco no botão, a tela passava a recusar
//   TODOS os redesenhos dali em diante. E como a mudança recebida já fica marcada
//   como "conhecida", ela nunca mais era considerada novidade: a lista ficava
//   velha PARA SEMPRE, sem erro e sem aviso.
//
// Consertos travados aqui:
//   1. botão não bloqueia mais (só campo de digitação / área editável);
//   2. redesenho RECUSADO vira PENDENTE e é aplicado na primeira brecha (o clique
//      no menu, a saída de um campo, o batimento de 3 s) — nada se perde;
//   3. o painel do contrato (onde ficam as impressoras) também se atualiza;
//   4. falha não empurra o relógio para 5 minutos (recuo curto: 30 s à vista);
//   5. leitura boa zera o recuo;
//   6. marca antiga de "limite do dia" não dorme horas: sonda de 60 em 60 s;
//   7. o canal instantâneo reagenda em vez de morrer.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++; console.log('  ✔ ' + nome);
}

const code = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const window = { DIGICOPY_CLOUD: { token: () => '' } };
new Function('window','localStorage','document', code)(
  window,
  { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  undefined
);
const S = window.DIGICOPY_CLOUD_SYNC;
const base = { hidden:false, cargaAberta:false, modalAberto:false, focoEmCampo:false, podeRenderizar:true, ultimo:0, agora:100000 };

console.log('== 1) O DEFEITO QUE TRAVAVA A TELA (botão) ==');
ok('foco em BOTÃO não bloqueia mais o redesenho',
   S.podeRedesenharSync({ ...base, focoEmCampo:false }) === true);
ok('o código não trata mais BUTTON como "digitando"',
   !/INPUT\|TEXTAREA\|SELECT\|BUTTON/.test(code));
ok('campo de digitação continua segurando (protege quem digita)',
   /INPUT\|TEXTAREA\|SELECT/.test(code));
ok('área editável (contenteditable) também segura', /isContentEditable/.test(code));

console.log('\n== 2) REDESENHO RECUSADO VIRA PENDENTE (nada se perde) ==');
ok('existe a marca de redesenho pendente', /let redesenhoPendente=false;/.test(code));
ok('existe a tentativa de aplicar depois', /function tentarRedesenhoPendente\(\)/.test(code));
ok('a mudança recebida marca o redesenho como pendente antes de tentar',
   /if\(mudouNaTela\)\{redesenhoPendente=true;tentarRedesenhoPendente\(\);\}/.test(code) &&
   /if\(mudou\)\{redesenhoPendente=true;tentarRedesenhoPendente\(\);\}/.test(code));
ok('o batimento de 3 s tenta aplicar a pendência', /try\{tentarRedesenhoPendente\(\);\}catch\(e\)\{\}/.test(code));
ok('clicar tenta aplicar', /addEventListener\('click'[\s\S]{0,120}tentarRedesenhoPendente/.test(code));
ok('sair de um campo tenta aplicar', /addEventListener\('focusout'[\s\S]{0,120}tentarRedesenhoPendente/.test(code));
ok('exportado para teste', typeof S.temRedesenhoPendente === 'function' && typeof S.redesenharTelaAtual === 'function');

console.log('\n== 3) O PAINEL DO CONTRATO (impressoras) TAMBÉM ATUALIZA ==');
ok('o redesenho reaproveita o contrato aberto',
   code.indexOf('contrato-detail') >= 0 && code.indexOf('window.openContratoDetail') >= 0 &&
   code.indexOf('openModal') >= 0);
ok('só mexe no painel se ele estiver aberto', /if\(box&&!box\.classList\.contains\('hidden'\)/.test(code));

console.log('\n== 4) FALHA NÃO DEIXA O PC QUASE PARADO ==');
ok('recuo curto com a janela à vista (para em 30 s)',
   /document\.hidden\?Math\.min\(300000[\s\S]{0,120}Math\.min\(30000,5000\*Math\.pow\(2,Math\.min\(failures,3\)\)\)/.test(code));
ok('janela escondida mantém o recuo longo (economia)', /Math\.min\(300000,5000\*Math\.pow\(2,Math\.min\(failures,6\)\)\)/.test(code));
ok('leitura boa zera o recuo', /failures=0;lastError='';state\.lastOk=Date\.now\(\);/.test(code));

console.log('\n== 5) LIMITE ANTIGO NÃO DORME O DIA INTEIRO ==');
ok('a espera do limite virou sonda de 60 s', /Math\.min\(60000,Math\.max\(30000,state\.limiteAte-Date\.now\(\)\)\)/.test(code));
ok('a sonda tem motivo escrito (o que evita a marca presa)', /SONDA DE 60 EM 60 s/.test(code));

console.log('\n== 6) CANAL INSTANTÂNEO NÃO MORRE ==');
ok('saída antecipada reagenda', /setTimeout\(\(\)=>\{try\{canalInstantaneo\(\);\}catch\(e\)\{\}\},5000\);/.test(code));
ok('motor da nuvem antigo desliga o canal (sem erro na tela)', /st===404\|\|st===400/.test(code));

console.log('\n== 7) O DIAGNÓSTICO (ver sem adivinhar) ==');
const cloud = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
ok('existe o diagnóstico no painel da Nuvem', /function instalarDiagnostico/.test(cloud) && /dc-diagnostico/.test(cloud));
ok('mostra a versão DESTE PC', /window\.DIGICOPY_APP_VERSION/.test(cloud));
ok('mostra a versão do motor da nuvem (lê /health)', /fetch\(base \+ '\/health'/.test(cloud));
ok('mostra o estado da sincronização pelos nomes REAIS do motor',
   /info\.pending/.test(cloud) && /info\.lastError/.test(cloud) && /info\.paused/.test(cloud));
ok('tem o botão "Conferir agora" que força e mede',
   /Conferir agora/.test(cloud) && /sync\.tick\('diagnostico-manual'\)/.test(cloud) && /ms<\/b>/.test(cloud));
const blocoDiag = cloud.slice(cloud.indexOf('function instalarDiagnostico'), cloud.indexOf('function instalarDiagnostico') + 2800);
ok('não mostra senha nem token', blocoDiag.indexOf('senha') < 0 && blocoDiag.indexOf('token') < 0 && blocoDiag.indexOf('localStorage') < 0);

console.log('\nRESULTADO: ' + passou + ' verificações — a tela não seca mais e dá para ver o estado do sistema!');
//<<<<SECAO:test_tela_nao_seca.js:FIM>>>>
}

if (false) { // ═══ test_nuvem_rapida.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_nuvem_rapida.js:INICIO>>>>
// test_nuvem_rapida.js — v7.0.6
// Trava os consertos de VELOCIDADE da sincronização (a queixa do dono:
// "fica voltando, o que foi feito depois demora e vai subindo aos poucos").
// Nada aqui é invenção: os números vêm do banco de prova com 76.550 registros e
// 91.862 mudanças — remontar a base caiu de 17.240 ms para ~1.100 ms e o ciclo
// em repouso de 767 ms para 4 ms.
const fs=require('fs');
let passou=0;
function ok(nome,cond){if(!cond){console.error('  \u2718 '+nome);process.exit(1);}console.log('  \u2714 '+nome);passou++;}
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');

console.log('== NUVEM RÁPIDA (v7.0.6) ==');
console.log('-- 1) procurar registro na lista não varre a lista inteira --');
ok('existe índice id → posição', /const INDICE_LISTA=\{\}/.test(code) && /function posicaoNaLista\(entity,id\)/.test(code));
ok('o índice cresce junto (acréscimo no fim), não é refeito a cada registro',
  /if\(c\.len<arr\.length\)/.test(code) && /for\(let j=c\.len;j<arr\.length;j\+\+\)/.test(code));
ok('índice velho é conferido antes de ser usado (nada de posição torta)',
  /String\(arr\[i\]\.id\)===alvo/.test(code));
ok('reordenação (unshift/ordenação) é detectada e o índice é refeito',
  /const mesmoLugar=/.test(code) && /montarIndice\(c,arr\)/.test(code));
ok('a procura antiga (findIndex registro por registro) saiu do applyRemote',
  !/arr\.findIndex\(x=>x&&String\(x\.id\)===String\(change\.recordId\)\)/.test(code));

console.log('-- 2) o estado de AGORA aparece antes de recontar a história --');
ok('existe o passe rápido', /const PASSE_RAPIDO=3000/.test(code) && /async function passeRapidoInicial\(call\)/.test(code));
ok('o passe rápido é chamado ANTES da leitura completa',
  /if\(await passeRapidoInicial\(call\)\)changed=true;[\s\S]{0,600}?do\{/.test(code));
ok('só roda quando este PC vai remontar a base (cursor 0) e uma vez por sessão',
  /if\(passeRapidoFeito\)return false;/.test(code) && /if\(Number\(state\.cursor\)>0\)return false;/.test(code));
ok('não mexe no cursor da leitura completa (o diário segue lido do começo)',
  /let cursor=Math\.max\(0,maxSeq-PASSE_RAPIDO\)/.test(code) && !/state\.cursor=Math\.max\(0,maxSeq/.test(code));

console.log('-- 3) gravar sem travar a remessa --');
ok('a fila (pequena) é gravada na hora, sempre', /function gravarFila\(\)/.test(code) && /const okFila=gravarFila\(\);/.test(code));
ok('o bloco grande (estado) é agrupado numa gravação só', /gravacaoAgendada=setTimeout\(function\(\)\{gravacaoAgendada=null;gravarEstado\(\);\},300\)/.test(code));
ok('o bloco grande só é reescrito quando mudou (com rede de 30 s)',
  /if\(!estadoMudou&&\(Date\.now\(\)-estadoGravadoEm\)<30000\)return okFila;/.test(code));
ok('gravação imediata existe para as decisões que não podem esperar', /function persistAgora\(\)/.test(code));
ok('zerar a nuvem / escolher publicar gravam na hora',
  (code.match(/persistAgora\(\)/g)||[]).length>=8);
ok('fechar ou esconder a janela grava na hora',
  /addEventListener\('pagehide',fechar\)/.test(code) && /addEventListener\('beforeunload',fechar\)/.test(code));

console.log('-- 4) a tela não para a cada 3 segundos --');
ok('a varredura é pulada quando nada mudou (com rede de 10 s)',
  /if\(!forcarVarredura&&!sujo&&!outbox\.length&&!filaCheia&&Date\.now\(\)-varreduraFeita<10000\)return 0;/.test(code));
// v7.0.12 — além de avisar, a gravação agora ENFILEIRA na hora: era a janela de
// 900 ms em que a mudança vivia só na memória (o "dado que some" quando fechava).
ok('o sistema avisa a varredura quando grava (saveDB) e quando apaga',
  /if\(!applying&&authorized\(\)\)\{sujo=true;enfileirarNaHora\(\);schedule\(900\);\}/.test(code) && /sujo=true;\n/.test(code));
ok('e a gravação entra na fila NA HORA (a varredura roda no próprio clique; base grande: no fim dele)',
  /function enfileirarNaHora\(\)\{/.test(code) && /window\.saveDB=function\(\)\{[\s\S]{0,700}?enfileirarNaHora\(\)/ .test(code)
  && /window\.saveDBAgora=function\(\)\{[\s\S]{0,400}?enfileirarNaHora\(\)/.test(code));
ok('ao fechar: varredura forçada com teto maior, fila gravada e entrega com keepalive',
  /function prepararParaFechar\(\)\{/.test(code) && /scanLocal\(\{teto:TETO_FECHANDO\}\)/.test(code)
  && /const fechar=\(\)=>\{[\s\S]{0,400}?prepararParaFechar\(\)/.test(code)
  && /keepalive:true/.test(code));
ok('remessa grande continua correndo até o fim (fila cheia não para em 100)',
  /filaCheia=outbox\.length>=MAX_OUTBOX;/.test(code));
ok('a cópia do registro não é mais feita duas vezes por varredura',
  /if\(mode==='array'\)return \(Array\.isArray\(value\)\?value:\[\]\)\.filter\(x=>x&&x\.id\)\.map\(x=>\(\{id:String\(x\.id\),data:x\}\)\)/.test(code));
ok('a limpeza (_rt/_cf) é feita na hora de montar a remessa',
  /data:clean\(dadoEnvio\)/.test(code) && /tirarSegredosDoEnvio\(entity,entry\.data\)/.test(code));

console.log('-- 5) menos peso na nuvem --');
ok('a conferência que solta a cópia local é no máximo 1× por minuto',
  /if\(agora-ultimaConferenciaNuvem<60000\)return false;/.test(code));

console.log('\nRESULTADO: '+passou+' verificações passaram — nuvem rápida OK!');
//<<<<SECAO:test_nuvem_rapida.js:FIM>>>>
}

if (false) { // ═══ test_exclusao_nao_volta.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_exclusao_nao_volta.js:INICIO>>>>
// test_exclusao_nao_volta.js — v7.0.7
// Trava o defeito PROVADO: "apaguei e o registro voltou".
// O motor de verdade é carregado com uma nuvem de mentira em memória e o mesmo
// caminho do sistema é usado (a função de apagar que o vigia embrulha).
// Três situações do dia a dia, e em todas o registro apagado tem de FICAR apagado
// e a exclusão tem de CHEGAR na nuvem:
//   A) apagar e fechar o programa antes de a exclusão subir;
//   B) a internet cair logo depois de apagar e o programa ser fechado;
//   C) apagar com o motor funcionando (caminho normal — não pode regredir).
const fs=require('fs'),path=require('path');
let passou=0;
function ok(nome,cond){if(!cond){console.error('  \u2718 '+nome);process.exit(1);}console.log('  \u2714 '+nome);passou++;}
const realSetTimeout=globalThis.setTimeout;
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const notif=fs.readFileSync('notificacoes_patch.js','utf8');

console.log('== EXCLUSÃO NÃO VOLTA (v7.0.7) ==');

// ── a nuvem de mentira (diário + registros, igual ao motor espera) ──────────
function nuvemDeMentira(entity,ids){
  entity=entity||'contratos';
  ids=ids||['C1','C2','C3'];
  const nuvem={records:{},diario:[],postados:[],foraDoAr:false};
  for(const id of ids){
    const dados=(entity==='contratos')?{id,numero:'CT-'+id}
      :(entity==='modulosDinamicos')?{value:{label:id,dados:[{id:'r1',nome:'linha 1'}]}}
      :{id,status:'aprovado'};
    nuvem.records[entity+'|'+id]={entity:entity,recordId:id,data:dados,version:1};
    nuvem.diario.push({seq:nuvem.diario.length+1,entity:entity,recordId:id,operation:'upsert',data:dados,version:1});
  }
  nuvem.api=async(p,o)=>{
    if(nuvem.foraDoAr)throw new Error('sem internet (teste)');
    if(p.indexOf('/v1/status')===0)return {ok:true,totals:{records:Object.keys(nuvem.records).length,cursor:nuvem.diario.length}};
    if(p.indexOf('/v1/changes')===0&&(!o||o.method==='GET')){
      const m=/cursor=(\d+)&limit=(\d+)/.exec(p),cursor=Number(m[1]),limite=Number(m[2]);
      const fatia=nuvem.diario.filter(x=>x.seq>cursor).slice(0,limite);
      const ultimo=fatia.length?fatia[fatia.length-1].seq:cursor;
      return {ok:true,nextCursor:ultimo,hasMore:nuvem.diario.some(x=>x.seq>ultimo),changes:fatia};
    }
    if(p.indexOf('/v1/changes')===0&&o&&o.method==='POST'){
      const env=JSON.parse(o.body||'{}');nuvem.postados=nuvem.postados.concat(env.mutations||[]);
      const results=(env.mutations||[]).map((mu,i)=>{
        const k=mu.entity+'|'+mu.recordId,atual=nuvem.records[k];
        if(mu.operation==='delete'){
          if(!atual)return {index:i,ok:false,error:'nao existe'};
          atual.deleted=true;atual.version++;
          nuvem.diario.push({seq:nuvem.diario.length+1,entity:mu.entity,recordId:mu.recordId,operation:'delete',data:null,version:atual.version});
          return {index:i,ok:true,version:atual.version};
        }
        nuvem.records[k]={entity:mu.entity,recordId:mu.recordId,data:Object.assign({},mu.data),version:(atual?atual.version:0)+1};
        nuvem.diario.push({seq:nuvem.diario.length+1,entity:mu.entity,recordId:mu.recordId,operation:'upsert',data:nuvem.records[k].data,version:nuvem.records[k].version});
        return {index:i,ok:true,version:nuvem.records[k].version};
      });
      return {ok:results.every(r=>r.ok),results};
    }
    throw new Error('rota não prevista no teste: '+p);
  };
  return nuvem;
}
function novoNavegador(){
  const store={},eventos={};
  const localStorage={getItem:k=>(k in store?store[k]:null),
    setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];},
    get length(){return Object.keys(store).length;},key:i=>Object.keys(store)[i]||null};
  const janela={
    DIGICOPY_CLOUD:{token:()=>'tok',api:null},
    addEventListener:(n,fn)=>{(eventos[n]=eventos[n]||[]).push(fn);},
    removeEventListener:()=>{},disparar:n=>{(eventos[n]||[]).forEach(fn=>{try{fn();}catch(e){}});},
    notificarEvento:()=>{},logAction:()=>{},navigateTo:()=>{},saveDB:()=>true
  };
  const documento={hidden:false,activeElement:null,body:{},addEventListener:()=>{},
    removeEventListener:()=>{},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null};
  return {janela,localStorage,store,documento};
}
function abrirSessao(amb,dados,api){
  amb.janela.DIGICOPY_CLOUD.api=api;
  globalThis.setTimeout=()=>0;   // o motor não dispara relógio dentro do teste
  try{new Function('window','localStorage','document','db',code)(amb.janela,amb.localStorage,amb.documento,dados);}
  finally{globalThis.setTimeout=realSetTimeout;}
  return amb.janela.DIGICOPY_CLOUD_SYNC;
}
const dormir=ms=>new Promise(r=>realSetTimeout(r,ms));

(async()=>{
  const cenarios={A:'apagar e fechar na hora',B:'internet cai depois de apagar',C:'apagar com o motor funcionando'};
  for(const cenario of Object.keys(cenarios)){
    const nuvem=nuvemDeMentira();

    // ── sessão 1: abre, carrega, e ele apaga o contrato C1 ──
    const amb1=novoNavegador();
    const db1={contratos:[],config:{},_seq:{}};
    amb1.janela.excluirContratoUnificado=function(id){
      const i=db1.contratos.findIndex(c=>c.id===id);if(i>=0)db1.contratos.splice(i,1);amb1.janela.saveDB();
    };
    const S1=abrirSessao(amb1,db1,nuvem.api);
    await S1.tick('abertura').catch(()=>{});
    ok(cenario+': a base abriu com os 3 contratos',db1.contratos.length===3);
    if(cenario==='B')nuvem.foraDoAr=true;
    amb1.janela.excluirContratoUnificado('C1');
    ok(cenario+': o motor registrou o que ele apagou',S1.temMarcaDeExclusao('contratos|C1')===true);
    if(cenario==='C'){await S1.tick('heartbeat').catch(()=>{});await dormir(30);await S1.tick('heartbeat').catch(()=>{});}
    amb1.janela.disparar('pagehide');

    // ── sessão 2: abre de novo (é o F5/abrir o programa no dia seguinte) ──
    nuvem.foraDoAr=false;
    const amb2=novoNavegador();
    Object.assign(amb2.store,amb1.store);
    const db2={contratos:[],config:{},_seq:{}};
    amb2.janela.excluirContratoUnificado=function(){};
    const S2=abrirSessao(amb2,db2,nuvem.api);
    await S2.tick('abertura').catch(()=>{});
    await dormir(30);
    await S2.tick('heartbeat').catch(()=>{});
    ok(cenario+': o contrato apagado NÃO volta',db2.contratos.some(c=>c.id==='C1')===false);
    ok(cenario+': a nuvem recebeu a exclusão',!!(nuvem.records['contratos|C1']&&nuvem.records['contratos|C1'].deleted));
    ok(cenario+': a marca é limpa depois de confirmada',S2.temMarcaDeExclusao('contratos|C1')===false);
  }

  // ── v7.0.9 — ORÇAMENTO APAGADO PELA FICHA DO CLIENTE ────────────────────────
  // Defeito provado: o motor tinha `||entity==='orcamentos'` na varredura e nunca
  // mandava apagar orçamento — então ele voltava (no modo SÓ NUVEM, a base é
  // remontada do diário da nuvem). A ordem dele (v5.24.5, escrita no módulo da
  // ficha) é "deletar é DE VEZ... a nuvem recebe o comando de apagar".
  console.log('-- orçamento apagado pela ficha do cliente --');
  {
    const nuvemO=nuvemDeMentira('orcamentos',['O1','O2']);
    const amb1=novoNavegador();
    const dados1={orcamentos:[],config:{},_seq:{}};
    amb1.janela.excluirOrcamentoDaFicha=function(id){
      dados1.orcamentos=(dados1.orcamentos||[]).filter(x=>x.id!==id);
      amb1.janela.saveDB();
    };
    const S1=abrirSessao(amb1,dados1,nuvemO.api);
    await S1.tick('abertura').catch(()=>{});
    ok('orçamento: a base abriu com os 2 orçamentos',dados1.orcamentos.length===2);
    S1.marcarIntencaoDeExcluir();                 // é o que o vigia faz no clique
    amb1.janela.excluirOrcamentoDaFicha('O1');
    S1.fecharIntencaoDeExclusao();
    ok('orçamento: o motor registrou o que ele apagou',S1.temMarcaDeExclusao('orcamentos|O1')===true);
    await S1.tick('heartbeat').catch(()=>{});
    await dormir(30);
    await S1.tick('heartbeat').catch(()=>{});
    amb1.janela.disparar('pagehide');

    const amb2=novoNavegador();
    Object.assign(amb2.store,amb1.store);
    const dados2={orcamentos:[],config:{},_seq:{}};
    amb2.janela.excluirOrcamentoDaFicha=function(){};
    const S2=abrirSessao(amb2,dados2,nuvemO.api);
    await S2.tick('abertura').catch(()=>{});
    await dormir(30);
    await S2.tick('heartbeat').catch(()=>{});
    // pode continuar no banco como `excluido` (proteção da v5.22.92), mas NÃO pode
    // aparecer nas listas de trabalho — era isso que ele via como "voltou"
    const visiveis=(dados2.orcamentos||[]).filter(o=>String(o.status||'')!=='excluido').map(o=>o.id);
    ok('orçamento: NÃO volta para a lista de trabalho',visiveis.indexOf('O1')<0);
    ok('orçamento: a nuvem recebeu a exclusão',!!(nuvemO.records['orcamentos|O1']&&nuvemO.records['orcamentos|O1'].deleted));
    ok('orçamento: o outro orçamento continua inteiro',visiveis.indexOf('O2')>=0);
    ok('a proteção antiga continua: delete vindo DA NUVEM vira "excluído" (não remove)',
      /change.operation==='delete'&&change.entity==='orcamentos'/.test(code) &&
      /arr\[idx\]\.status='excluido'/.test(code));
  }

  // ── v7.0.9 — MÓDULO DINÂMICO EXCLUÍDO PELA TELA ─────────────────────────────
  // app.js tem "Excluir módulo" (confirmarExcluirModulo): avisa que remove todos os
  // registros. A lista `modulosDinamicos` viaja para a nuvem como MAPA, e a
  // varredura só procurava registro sumido nas listas de array — então o módulo
  // excluído voltava inteiro (com os registros dele) na próxima abertura.
  console.log('-- módulo dinâmico excluído pela tela --');
  {
    const nuvemM=nuvemDeMentira('modulosDinamicos',['MOD1','MOD2']);
    const amb1=novoNavegador();
    const dados1={modulosDinamicos:{},config:{},_seq:{}};
    const excluir=function(nome){
      delete dados1.modulosDinamicos[nome];        // é o que confirmarExcluirModulo faz
      amb1.janela.saveDB();
    };
    amb1.janela.confirmarExcluirModulo=excluir;    // nome real da função (o vigia embrulha)
    const S1=abrirSessao(amb1,dados1,nuvemM.api);
    await S1.tick('abertura').catch(()=>{});
    ok('módulo: a base abriu com os 2 módulos',Object.keys(dados1.modulosDinamicos).length===2);
    amb1.janela.confirmarExcluirModulo('MOD1');
    ok('módulo: o motor registrou o que ele apagou',S1.temMarcaDeExclusao('modulosDinamicos|MOD1')===true);
    await S1.tick('heartbeat').catch(()=>{});
    await dormir(30);
    await S1.tick('heartbeat').catch(()=>{});
    amb1.janela.disparar('pagehide');

    const amb2=novoNavegador();
    Object.assign(amb2.store,amb1.store);
    const dados2={modulosDinamicos:{},config:{},_seq:{}};
    amb2.janela.confirmarExcluirModulo=function(){};
    const S2=abrirSessao(amb2,dados2,nuvemM.api);
    await S2.tick('abertura').catch(()=>{});
    await dormir(30);
    await S2.tick('heartbeat').catch(()=>{});
    ok('módulo: NÃO volta depois de reabrir',!dados2.modulosDinamicos['MOD1']);
    ok('módulo: a nuvem recebeu a exclusão',!!(nuvemM.records['modulosDinamicos|MOD1']&&nuvemM.records['modulosDinamicos|MOD1'].deleted));
    ok('módulo: o outro módulo continua inteiro',!!dados2.modulosDinamicos['MOD2']);
  }

  console.log('-- o que sustenta o conserto --');
  ok('a marca fica gravada no estado (sobrevive a fechar o programa)',
    /excluidosDeProposito/.test(code)&&/MARCA_EXCLUSAO_VALE/.test(code));
  ok('a marca é gravada na hora do clique, comparando antes/depois da função',
    /let intencaoAntes=null;/.test(code)&&/intencaoAntes=resumoDaBase\(\)/.test(code)&&
    /function fecharIntencaoDeExclusao\(\)/.test(code)&&/const antes=intencaoAntes;intencaoAntes=null;/.test(code));
  // v7.0.8 — o retrato é NUMÉRICO (o conjunto da base inteira custava 250 ms por
  // clique, medido; a versão leve custa ~35 ms) e continua exato: só lista cuja
  // contagem/soma de ids mudou durante o clique é investigada.
  ok('o retrato do clique é numérico e barato (sem montar a base inteira)',
    /function resumoDaBase\(\)/.test(code)&&!/intencaoAntes=localKeysSnapshot\(\)/.test(code));
  ok('a marca usa os registros que o PC conhece (só o que pode voltar da nuvem)',
    /for\(const k in state\.known\)/.test(code)&&/if\(mudaram\.indexOf\(ent\)<0/.test(code));
  ok('registro que VOLTOU da nuvem sai de novo e a ordem vai junto',
    /if\(pos<0\)continue;[\s\S]{0,600}?arr\.splice\(pos,1\)/.test(code));
  ok('se outro PC editou depois, a edição vale (não apaga por cima)',
    /if\(vAtual>vMarcada\)\{ delete alvo\[k\]; continue; \}/.test(code));
  ok('a nuvem recusando a exclusão, o motor para de insistir (sem laço)',
    /limparMarcaDeExclusao\(item\.key\)/.test(code)&&(code.match(/limparMarcaDeExclusao\(item\.key\)/g)||[]).length>=3);

  console.log('-- os caminhos que apagavam sem avisar a nuvem --');
  const lista=(/const FUNCOES_QUE_EXCLUEM=\[([\s\S]*?)\];/.exec(code)||[])[1]||'';
  ['removerRegistro','excluirChamadoV52422','estornarVenda','estornarOrcamentosMarcados'].forEach(n=>{
    ok('vigia alcança '+n,new RegExp("'"+n+"'").test(lista));
  });
  ok('ferramenta para o módulo embrulhar exclusão interna (fora do window)',
    /function exclusaoVigiada\(fn\)/.test(code)&&/exclusaoVigiada,registrarExclusaoDeProposito,devolverLideranca/.test(code));
  ok('ferramenta para o módulo avisar apagamento feito dentro de laço',
    /function registrarExclusaoDeProposito\(entity,id\)/.test(code));
  ok('a recuperação do que foi apagado acontece UMA VEZ para todos os PCs',
    /recuperacaoExcluidosEm/.test(code)&&/UMA VEZ PARA TODOS OS PCs/.test(code));
  ok('o botão Excluir do histórico de leituras usa a ferramenta',
    /exclusaoVigiada\(excluirLeiturasMarcadas\)/.test(fs.readFileSync('ajustes_v52210_historico_checkbox_nfe_patch.js','utf8')));
  ok('unir clientes repetidos avisa a nuvem dos duplicados',
    /A UNIÃO PRECISA VALER NA NUVEM/.test(code)&&/removeIds\.forEach\(id=>\{const k=key\('clientes',id\)/.test(code));
  ok('a liderança não segura o envio depois de reabrir',
    /const LEASE_MS=30000;/.test(code)&&/function devolverLideranca\(\)/.test(code)&&/devolverLideranca\(\);/.test(code));

  console.log('-- v7.0.9: os consertos desta rodada --');
  ok('a lista de presentes cobre MAPA também (o defeito que marcava todo módulo como apagado)',
    /else if\(v&&typeof v==='object'\)\{[\s\S]{0,700}?for\(const chave of Object\.keys\(v\)\)set\.add\(String\(chave\)\)/.test(code));
  ok('módulo dinâmico está entre as listas que podem ser apagadas na nuvem',
    /'tecnicos','modulosDinamicos'\]/.test(code));
  ok('o "Excluir módulo" da tela está vigiado',
    /'confirmarExcluirModulo'\]/.test(code));
  ok('apagar módulo avisa a intenção (para o outro módulo não ser tocado)',
    /temMarcaDeExclusao\(k\)/.test(code));
  ok('a poda da marca só acontece com o PC em dia (sem pendência e sem erro)',
    /emDia=!outbox\.length&&!lastError/.test(code));
  ok('a marca vale uma semana (era 1 dia: exclusão antes de ficar offline se perdia)',
    /MARCA_EXCLUSAO_VALE=7\*24\*60\*60\*1000/.test(code));
  ok('sem espaço no navegador: o derivado sai primeiro e ele é avisado',
    /state\.versions=\{\};[\s\S]{0,200}?avisarEspaco\(\)/.test(code) &&
    /enfileirarRecado\('sem-espaco',[\s\S]{0,200}?SEM ESPAÇO/.test(code));

  console.log('-- v7.0.9: o aviso do motor não se perde (o motor roda antes do login) --');
  ok('recado que não pôde ser entregue fica guardado e sai depois (e não fica marcado como avisado)',
    /function entregarRecados\(/.test(code) &&
    /guardado=sino\(item\.tipo\|\|'aviso'/.test(code) && /!==false; \}catch\(e\)\{ guardado=false; \}/.test(code) &&
    /if\(entregues&&entregues\[chave\]\)return false/.test(code));
  ok('a entrega dos recados acontece em todo ciclo (uma vez que haja sessão)',
    /try\{entregarRecados\(\);\}catch\(e\)\{\}/.test(code));
  ok('o sino devolve se guardou ou não (sem sessão = false, não engole o recado)',
    /if\(!sess\) return false;/.test(notif) && /return true;\s+\/\/ guardado de verdade/.test(notif));
  ok('o registro do sino não estoura depois de guardar (salvar/enfeite são opcionais)',
    /try\{ if\(typeof ntfAtualizarBadge==='function'\) ntfAtualizarBadge\(true\); \}catch\(e\)\{\}/.test(notif));
  ok('a recuperação não ressuscita o que este PC apagou de propósito',
    /import|ehExclusaoDele\(key\(r\.entity,r\.recordId\),r\.version\)/.test(code) &&
    /ehExclusaoDele\(key\(entidade,k\),null\)/.test(code));
  ok('a varredura grande continua de onde parou (não carimba \"acabei\" no meio)',
    /varreduraTerminou=false;/.test(code) && /else if\(!varreduraTerminou\)\{/.test(code) &&
    /state\.recuperacaoCursor=\{before:before,entity:beforeEnt,id:beforeId\}/.test(code) &&
    /const excluidos=await listarExcluidosDaNuvem\(call,0,true\)/.test(code));

  console.log('-- a lista de exclusões não pode voltar a ter buraco --');
  // Levanta TODO ponto do sistema que tira registro de lista sincronizada e
  // exige: ou está na lista do vigia, ou está na lista do que é automático
  // (e por isso NUNCA manda apagar na nuvem), ou foi embrulhado com exclusaoVigiada.
  const AUTOMATICAS=['seedData','varrerDemonstracao','parquePorItemLocacao','normalizarAdminPrincipal',
    'aplicarAutomacoesLeituras','sincronizar','vosConcluirFaturamento','vosRefaturar','executarRevalidacao',
    'checarEstoqueComPopup','salvarImpressoraContrato','mergeDuplicateClients','(sem nome)','alvos','venda',
    'destacarChamadoModal','renderContratos','oldSal','existing'];
  const LISTAS=['clientes','produtos','vendas','contratos','parque','leituras','os','orcamentos',
    'contasReceber','contasPagar','equipamentos','tecnicos','recargas','usuarios','empresas'];
  const re=new RegExp('(?:db|_db|banco)\\.('+LISTAS.join('|')+')\\s*=\\s*[^;]{0,90}?\\.filter\\(|(?:db|_db|banco)\\.('+LISTAS.join('|')+')\\.splice\\(');
  const arquivos=[];
  (function anda(dir){
    for(const nome of fs.readdirSync(dir)){
      if(/^(node_modules|\.git|vendor|mobile|dist|build|e2e|\.arena)$/.test(nome))continue;
      const p=path.join(dir,nome);
      if(fs.statSync(p).isDirectory()){anda(p);continue;}
      if(/\.js$/.test(nome)&&nome.indexOf('app.bundle')<0&&nome.indexOf('test_')!==0&&nome.indexOf('banco_de_prova')<0)arquivos.push(p);
    }
  })('.');
  const vigiadas=(lista.match(/'([A-Za-z0-9_]+)'/g)||[]).map(x=>x.replace(/'/g,''));
  const problemas=[];
  for(const f of arquivos){
    const linhas=fs.readFileSync(f,'utf8').split('\n');
    linhas.forEach((linha,i)=>{
      if(!re.test(linha))return;
      let nome='';
      for(let j=i;j>=0&&j>i-400;j--){
        const l=linhas[j].trim();
        const d=/^(?:async\s+)?function\s+([A-Za-z0-9_]+)/.exec(l)||
                /^(?:window\.)?([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?function/.exec(l)||
                /^(?:window\.)?([A-Za-z0-9_]+)\s*=\s*\(?[^)]*\)?\s*=>/.exec(l);
        if(d&&!/^(if|for|while|switch|return)$/.test(d[1])){nome=d[1];break;}
      }
      if(!nome)return;
      if(vigiadas.indexOf(nome)>=0||AUTOMATICAS.indexOf(nome)>=0)return;
      // embrulhada na mão pelo próprio módulo?
      const contexto=linhas.slice(Math.max(0,i-60),i).join('\n');
      if(new RegExp('exclusaoVigiada\\(\\s*'+nome+'\\s*\\)').test(contexto))return;
      problemas.push(nome+' ('+f+':'+(i+1)+')');
    });
  }
  ok('nenhum caminho de exclusão fora do vigia e fora do automático'+(problemas.length?': '+problemas.slice(0,4).join(', '):''),
    problemas.length===0);

  console.log('\nRESULTADO: '+passou+' verificações passaram — apagar (inclusive orçamento) não volta mais!');
  process.exit(0);
})().catch(e=>{console.error('  \u2718 erro no teste: '+(e&&e.stack||e));process.exit(1);});
//<<<<SECAO:test_exclusao_nao_volta.js:FIM>>>>
}

if (false) { // ═══ test_recuperacao_completa.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_recuperacao_completa.js:INICIO>>>>
// test_recuperacao_completa.js — v7.0.8
// Trava o defeito PROVADO do paginador da lista de excluídos: registros excluídos
// no MESMO milissegundo (o PC manda as exclusões de 10 em 10, e o lote inteiro
// leva o mesmo carimbo) ficavam fora para sempre quando a página terminava no meio
// do grupo. Era isso que fazia a recuperação "trazer só parte" do que foi apagado.
// Aqui a consulta do motor é reproduzida em memória, do jeito que ela é escrita.
const fs=require('fs');
let passou=0;
function ok(nome,cond){if(!cond){console.error('  \u2718 '+nome);process.exit(1);}console.log('  \u2714 '+nome);passou++;}
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const motor=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');

console.log('== RECUPERAÇÃO COMPLETA (v7.0.8) ==');

// ── banco de mentira: exclusões em grupos do mesmo milissegundo (é como nasce) ─
function banco(quantos){
  const registros=[];let t=1700000000000,i=0,lote=0;
  while(registros.length<quantos){
    const n=1+((lote*7)%10);                       // grupo de 1 a 10, variado
    for(let k=0;k<n&&registros.length<quantos;k++)registros.push({entity:'leituras',recordId:'L'+(i++),deletedAt:t});
    if(lote%9===0)t+=1;                            // às vezes o grupo cai no ms seguinte
    lote++;
  }
  return registros;
}
// tradução linha por linha de `WHERE deleted_at < ? ORDER BY deleted_at DESC LIMIT ?`
function paginarComoAntes(registros,limit){
  const vistos=new Set();let before=0,paginas=0;
  while(paginas++<60){
    const linhas=registros.filter(r=>r.deletedAt!==null&&(before?r.deletedAt<before:true))
      .sort((a,b)=>b.deletedAt-a.deletedAt).slice(0,limit);
    linhas.forEach(r=>vistos.add(r.entity+'|'+r.recordId));
    const ultimo=linhas.length?linhas[linhas.length-1].deletedAt:0;
    if(linhas.length<limit||!ultimo)break;
    before=ultimo;
  }
  return vistos;
}
// cursor COMPOSTO (deleted_at, entity, record_id) — o que passou a valer
function paginarComoAgora(registros,limit){
  const vistos=new Set();let before=0,ent='',id='',paginas=0;
  while(paginas++<60){
    const linhas=registros.filter(r=>{
      if(r.deletedAt===null)return false;
      if(!before)return true;
      if(r.deletedAt<before)return true;
      if(r.deletedAt>before)return false;
      if(r.entity<ent)return true;
      if(r.entity>ent)return false;
      return r.recordId<id;
    }).sort((a,b)=>b.deletedAt-a.deletedAt||(a.entity===b.entity?0:(a.entity<b.entity?1:-1))||(a.recordId<b.recordId?1:-1))
      .slice(0,limit);
    linhas.forEach(r=>vistos.add(r.entity+'|'+r.recordId));
    const ultimo=linhas.length?linhas[linhas.length-1]:null;
    if(linhas.length<limit||!ultimo)break;
    before=ultimo.deletedAt;ent=ultimo.entity;id=ultimo.recordId;
  }
  return vistos;
}

console.log('-- a prova (o defeito e o conserto) --');
const registros=banco(3000);
const antes=paginarComoAntes(registros,1000);
const antes200=paginarComoAntes(registros,200);
const agora=paginarComoAgora(registros,1000);
ok('a paginação antiga PERDIA registro (documentado: '+antes.size+' de 3000 com página 1000)',antes.size<registros.length);
ok('com página de 200 a perda era maior ainda ('+antes200.size+' de 3000)',antes200.size<antes.size);
ok('a paginação nova alcança TODOS ('+agora.size+' de '+registros.length+')',agora.size===registros.length);
ok('e nenhum registro é repetido',agora.size===new Set([...agora]).size);

console.log('-- o motor da nuvem (a consulta de verdade) --');
ok('a consulta usa o cursor composto (deleted_at, entity, record_id)',
  /deleted_at = \? AND \(entity < \? OR \(entity = \? AND record_id < \?\)\)/.test(worker));
ok('a ordenação é a mesma do cursor (sem "terra de ninguém")',
  /ORDER BY deleted_at DESC, entity DESC, record_id DESC LIMIT \?/.test(worker));
ok('continua aceitando o pedido antigo (só `before`) para não quebrar PC velho',
  /else if \(beforeBruto\) \{/.test(worker) && /AND deleted_at < \?\s*\n\s*\$\{ORDEM\}/.test(worker));
ok('devolve o par que fecha o cursor',
  /proximoEntity: ultimoReg \? ultimoReg\.entity : undefined/.test(worker) &&
  /proximoId: ultimoReg \? ultimoReg\.recordId : undefined/.test(worker));
ok('motor carimbado 5.28.2 (a versão nova tem de ser publicada para valer)',
  /WORKER_VERSION = '5\.28\.2'/.test(worker));

console.log('-- o PC que varre a lista --');
ok('o PC manda o cursor composto quando o motor devolve o par',
  /beforeEnt=String\(r\.proximoEntity\|\|''\);beforeId=String\(r\.proximoId\|\|''\)/.test(motor) &&
  /url\+='&beforeEntity='\+encodeURIComponent\(beforeEnt\)\+'&beforeId='\+encodeURIComponent\(beforeId\)/.test(motor));
ok('o PC SÓ considera a varredura completa quando o motor devolve o par do cursor (motor que pula não é "completo")',
  /if\(r&&r\.proximoEntity&&r\.proximoId\)varreduraCompleta=true;/.test(motor) &&
  /if\(volta===0&&!lote\.length\)\{varreduraCompleta=true;varreduraTerminou=true;\}/.test(motor) &&
  /const MOTOR_MINIMO='5\.26\.7';/.test(motor));
ok('o aviso ao dono reaparece quando a exigência de motor muda',
  /enfileirarRecado\('motor-antigo:'\+MOTOR_MINIMO/.test(motor));
ok('o PC não repete registro entre páginas (conjunto do que já viu)',
  /const vistos=new Set\(\)/.test(motor) && /if\(vistos\.has\(chave\)\)continue;/.test(motor));

console.log('-- a memória do que já foi recuperado --');
ok('a chave é entidade+id (duas listas com o mesmo id não se confundem)',
  /function marcarRecuperado\(entity,recordId\)/.test(motor) &&
  /m\[String\(entity\)\+'\|'\+String\(recordId\)\]=Date\.now\(\)/.test(motor));
ok('a leitura continua aceitando as chaves antigas (nada recuperado de novo)',
  /function jaRecuperado\(memoria,entity,recordId\)/.test(motor) &&
  /m\[String\(entity\)\+'\|'\+String\(recordId\)\]\|\|m\[String\(recordId\)\]/.test(motor));
ok('os dois usos (nuvem e fotos locais) passam a entidade',
  /!jaRecuperado\(jaVieram,r\.entity,r\.recordId\)/.test(motor) &&
  /jaRecuperado\(ja,entidade,k\)/.test(motor));

console.log('-- e o que a exclusão (v7.0.7) continua garantindo --');
ok('a marca do que ele apagou continua no lugar e barata',
  /excluidosDeProposito/.test(motor) && /function resumoDaBase\(\)/.test(motor));

console.log('\nRESULTADO: '+passou+' verificações — a recuperação alcança tudo o que foi apagado!');
//<<<<SECAO:test_recuperacao_completa.js:FIM>>>>
}

if (false) { // ═══ test_recuperacao_nao_ressuscita.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_recuperacao_nao_ressuscita.js:INICIO>>>>
// test_recuperacao_nao_ressuscita.js — v7.0.9
// Trava TRÊS defeitos provados nesta rodada, todos na recuperação do que foi
// apagado (motor de verdade + nuvem de mentira em memória):
//   1) a recuperação trazia de volta o que ELE apagou de propósito (a marca
//      `excluidosDeProposito` não era consultada) — e a nuvem, não só o painel;
//      a foto local deste PC (IndexedDB) tinha o mesmo buraco;
//   2) o aviso "falta publicar o motor novo" era DESCARTADO quando não havia
//      sessão aberta (o motor roda antes do login) e a marca de "já avisei"
//      ficava gravada — o dono nunca ficava sabendo;
//   3) com mais de 40.000 excluídos, a varredura batia o teto de 40 páginas e
//      a mesma passada era dada como COMPLETA: carimbava na nuvem que a
//      recuperação estava feita e o resto nunca mais era varrido.
const fs=require('fs');
let passou=0;
function ok(nome,cond){if(!cond){console.error('  \u2718 '+nome);process.exit(1);}console.log('  \u2714 '+nome);passou++;}
const realSetTimeout=globalThis.setTimeout;
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');
const notif=fs.readFileSync('notificacoes_patch.js','utf8');

console.log('== RECUPERAÇÃO NÃO RESSUSCITA O QUE ELE APAGOU (v7.0.9) ==');

// ── nuvem de mentira: diário, registros, excluídos, restauração ─────────────
function nuvemDeMentira(excluidos,opcoes){
  opcoes=opcoes||{};
  const nuvem={records:{},diario:[],restaurados:[],pedidos:[],foraDoAr:false};
  (excluidos||[]).forEach(e=>{
    nuvem.records[e.entity+'|'+e.recordId]={entity:e.entity,recordId:e.recordId,data:e.data,version:e.version||3,deletedAt:e.deletedAt||1700000000000};
  });
  nuvem.api=async(p,o)=>{
    if(nuvem.foraDoAr)throw new Error('sem internet (teste)');
    if(p.indexOf('/v1/status')===0)return {ok:true,totals:{records:Object.keys(nuvem.records).length,cursor:nuvem.diario.length}};
    if(p.indexOf('/v1/deleted')===0){
      nuvem.pedidos.push(p);
      if(opcoes.paginar){return opcoes.paginar(p);}
      const list=(excluidos||[]).filter(e=>e.entity!=='x-mais').map(e=>({entity:e.entity,recordId:e.recordId,data:e.data,version:e.version||3,deletedAt:e.deletedAt||1700000000000}));
      const r={ok:true,records:list,temMais:false,proximoBefore:list.length?1700000000000:undefined};
      if(!opcoes.motorAntigo){
        r.proximoEntity=list.length?list[list.length-1].entity:undefined;
        r.proximoId=list.length?list[list.length-1].recordId:undefined;
      }
      return r;
    }
    if(p.indexOf('/v1/changes')===0&&(!o||o.method==='GET')){
      const m=/cursor=(\d+)&limit=(\d+)/.exec(p),cursor=Number(m[1]),limite=Number(m[2]);
      const fatia=nuvem.diario.filter(x=>x.seq>cursor).slice(0,limite);
      const ultimo=fatia.length?fatia[fatia.length-1].seq:cursor;
      return {ok:true,nextCursor:ultimo,hasMore:nuvem.diario.some(x=>x.seq>ultimo),changes:fatia};
    }
    if(p.indexOf('/v1/changes')===0&&o&&o.method==='POST'){
      const env=JSON.parse(o.body||'{}');
      const results=(env.mutations||[]).map((mu,i)=>{
        const k=mu.entity+'|'+mu.recordId,atual=nuvem.records[k];
        nuvem.records[k]={entity:mu.entity,recordId:mu.recordId,data:Object.assign({},mu.data),version:(atual?atual.version:0)+1};
        nuvem.diario.push({seq:nuvem.diario.length+1,entity:mu.entity,recordId:mu.recordId,operation:'upsert',data:nuvem.records[k].data,version:nuvem.records[k].version});
        return {index:i,ok:true,version:nuvem.records[k].version};
      });
      return {ok:true,results};
    }
    if(p.indexOf('/v1/restore')===0&&o&&o.method==='POST'){
      const b=JSON.parse(o.body||'{}');
      const atual=nuvem.records[b.entity+'|'+b.recordId];
      nuvem.restaurados.push(b.entity+'|'+b.recordId);
      if(atual){atual.deletedAt=null;atual.version++;}
      nuvem.diario.push({seq:nuvem.diario.length+1,entity:b.entity,recordId:b.recordId,operation:'upsert',data:atual&&atual.data,version:atual?atual.version:1});
      return {ok:true,restored:true,version:atual?atual.version:1};
    }
    throw new Error('rota não prevista no teste: '+p);
  };
  return nuvem;
}
function novoNavegador(base){
  const store=Object.assign({},base||{}),eventos={};
  const localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},
    removeItem:k=>{delete store[k];},get length(){return Object.keys(store).length;},key:i=>Object.keys(store)[i]||null};
  const janela={DIGICOPY_CLOUD:{token:()=>'tok',api:null},addEventListener:(n,fn)=>{(eventos[n]=eventos[n]||[]).push(fn);},
    removeEventListener:()=>{},logAction:()=>{},navigateTo:()=>{},saveDB:()=>true};
  const documento={hidden:false,activeElement:null,body:{},addEventListener:()=>{},removeEventListener:()=>{},
    querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null};
  return {janela,localStorage,store,documento};
}
// abre o sistema: sino de verdade (notificacoes_patch) + motor de verdade
function abrir(amb,dados,nuvem,sessao,idb){
  amb.janela.DIGICOPY_CLOUD.api=nuvem.api;
  if(idb)amb.janela.DIGICOPY_INDEXED_DB=idb;
  globalThis.setTimeout=()=>0;   // o motor não dispara relógio dentro do teste
  try{
    new Function('window','localStorage','document','db','getSession','uid',notif)
      (amb.janela,amb.localStorage,amb.documento,dados,()=>sessao,()=>'id'+Math.random());
    new Function('window','localStorage','document','db',code)(amb.janela,amb.localStorage,amb.documento,dados);
  }finally{globalThis.setTimeout=realSetTimeout;}
  return amb.janela.DIGICOPY_CLOUD_SYNC;
}
const dormir=ms=>new Promise(r=>realSetTimeout(r,ms));
const estadoDe=amb=>JSON.parse(amb.store['digicopy_cf_sync_state_v1']||'{}');

(async()=>{
  // ═══ 1) o que ele apagou de propósito não volta ═══════════════════════════
  console.log('-- 1) apagado DE PROPÓSITO por este PC --');
  const apagadoDeProposito={entity:'contratos',recordId:'C1',data:{id:'C1',numero:'CT-1',criadoPor:'usr_1'}};
  const perdidoPeloBug={entity:'parque',recordId:'P9',data:{id:'P9',modelo:'HP',criadoPor:'usr_1'}};
  {
    const nuvem=nuvemDeMentira([apagadoDeProposito,perdidoPeloBug]);
    const dados={contratos:[],parque:[],config:{},_seq:{}};
    const primeiro=novoNavegador();
    abrir(primeiro,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    // este PC registrou que apagou o C1 de propósito (marca que já era usada no "voltou")
    const st=estadoDe(primeiro);st.excluidosDeProposito={'contratos|C1':{em:Date.now(),v:3}};
    primeiro.store['digicopy_cf_sync_state_v1']=JSON.stringify(st);
    const amb=novoNavegador(primeiro.store);       // reabre o programa com a marca gravada
    const S=abrir(amb,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    await S.recuperarAutomatico();
    ok('o que ele apagou de propósito NÃO voltou ('+JSON.stringify(nuvem.restaurados)+')',
      nuvem.restaurados.indexOf('contratos|C1')<0);
    ok('o que foi perdido pelo defeito antigo VOLTOU (parque|P9) — a recuperação continua funcionando',
      nuvem.restaurados.indexOf('parque|P9')>=0);
    ok('a marca continua guardada (nada de perder o que ele apagou de propósito)',
      !!estadoDe(amb).excluidosDeProposito['contratos|C1']);
  }
  {
    // mesmo buraco na FOTO deste PC (IndexedDB): registro apagado de propósito
    const nuvem=nuvemDeMentira([]);
    const dados={contratos:[],parque:[],config:{},_seq:{}};
    const primeiro=novoNavegador();
    abrir(primeiro,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    const st=estadoDe(primeiro);st.excluidosDeProposito={'contratos|C1':{em:Date.now(),v:3}};
    primeiro.store['digicopy_cf_sync_state_v1']=JSON.stringify(st);
    const idb={listSnapshots:async()=>[{nome:'foto',data:{contratos:[
      {id:'C1',numero:'CT-1',criadoPor:'usr_1'},          // este ele apagou de propósito
      {id:'C2',numero:'CT-2',criadoPor:'usr_1'}           // este foi perdido de verdade
    ]}}]};
    const amb=novoNavegador(primeiro.store);
    const S=abrir(amb,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'},idb);
    const voltaram=await S.recuperarDasFotosLocais();
    const ids=(dados.contratos||[]).map(c=>c.id).sort();
    ok('foto deste PC: o apagado de propósito NÃO voltou',ids.indexOf('C1')<0);
    ok('foto deste PC: o perdido de verdade voltou ('+ids.join(',')+')',ids.indexOf('C2')>=0&&voltaram===1);
  }

  // ═══ 2) o aviso não se perde quando não há sessão ═════════════════════════
  console.log('-- 2) aviso do motor antigo SEM sessão aberta --');
  {
    const nuvem=nuvemDeMentira([perdidoPeloBug],{motorAntigo:true});
    const dados={contratos:[],parque:[],config:{},_seq:{}};
    const semSessao=novoNavegador();
    const S=abrir(semSessao,dados,nuvem,null);      // ninguém logado (tela de login)
    await S.recuperarAutomatico();
    await dormir(400);
    const st=estadoDe(semSessao);
    ok('sem sessão nada aparece no sino (o sino é por empresa)',(dados.notificacoes||[]).length===0);
    ok('mas o recado fica GUARDADO para depois',!!(st.recadosPendentes&&st.recadosPendentes['motor-antigo:5.26.7']));
    ok('e NÃO fica marcado como "já avisei"',!st.recadosEntregues);
    // agora ele entra no sistema: a próxima chance entrega o recado
    const amb=novoNavegador(semSessao.store);
    const S2=abrir(amb,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    const entregues=S2.entregarRecados();
    const lista=dados.notificacoes||[];
    const textos=lista.map(n=>String(n.texto)).join(' | ');
    ok('depois do login o aviso aparece no sino ('+entregues+' recado(s), '+lista.length+' no sino)',
      entregues>=1&&textos.indexOf('motor novo da nuvem')>=0);
    await dormir(400);   // a gravação do estado é agrupada (300 ms)
    const st2=estadoDe(amb);
    ok('agora sim fica marcado como avisado (não repete)',
      !!(st2.recadosEntregues&&st2.recadosEntregues['motor-antigo:5.26.7']));
    ok('e o recado sai da fila',!st2.recadosPendentes||!st2.recadosPendentes['motor-antigo:5.26.7']);
    const quantoAntes=(dados.notificacoes||[]).length;
    ok('a entrega é única (segunda chamada não duplica)',S2.entregarRecados()===0&&(dados.notificacoes||[]).length===quantoAntes);
  }

  // ═══ 3) lista maior que o teto: continua de onde parou ════════════════════
  console.log('-- 3) mais de 40.000 excluídos: não pode dizer "acabei" --');
  {
    let pagina=0;const paginasVistas=[];
    const TETO=40;                                  // igual ao motor
    const nuvem=nuvemDeMentira([],{paginar:(url)=>{
      const m=/before=(\d+)/.exec(url);
      const antes=m?Number(m[1]):0;
      paginasVistas.push(antes);
      pagina++;
      const base=antes?antes-1:1700000000000;                     // sempre "mais antigo"
      if(pagina>45)return {ok:true,records:[],temMais:false};     // a lista acabou na 45ª página
      const list=[];for(let i=0;i<1000;i++)list.push({entity:'leituras',recordId:'L'+pagina+'_'+i,data:{id:'x',criadoPor:'sistema'},version:3,deletedAt:base});
      return {ok:true,records:list,temMais:true,proximoBefore:base,proximoEntity:'leituras',proximoId:'L'+pagina+'_999'};
    }});
    const dados={leituras:[],config:{},_seq:{}};
    const amb=novoNavegador();
    const S=abrir(amb,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    await S.recuperarAutomatico();
    await dormir(400);
    const st=estadoDe(amb);
    ok('o 1º ciclo para no teto de '+TETO+' páginas ('+pagina+')',pagina===TETO);
    ok('NÃO carimba "recuperação feita" na nuvem',!dados.config.recuperacaoExcluidosEm);
    ok('NÃO avisa "motor antigo" (o motor está certo, faltou terminar)',
      !(st.recadosPendentes&&st.recadosPendentes['motor-antigo:5.26.7']));
    ok('guarda o cursor de continuação',!!(st.recuperacaoCursor&&st.recuperacaoCursor.before>0));
    // 2º ciclo — em outra abertura do programa (o cursor tem de sobreviver).
    // A recuperação automática espera 60 s entre tentativas; aqui eu simplesmente
    // adianto esse relógio (é o que o tempo faria no computador dele).
    const guardado=JSON.parse(amb.store['digicopy_cf_sync_state_v1']);
    guardado.recuperacaoTentativa=Date.now()-61000;
    amb.store['digicopy_cf_sync_state_v1']=JSON.stringify(guardado);
    const amb2=novoNavegador(amb.store);
    const S2=abrir(amb2,dados,nuvem,{empresaId:'e1',usuarioNome:'dono'});
    await S2.recuperarAutomatico();
    await dormir(400);
    const st2=estadoDe(amb2);
    ok('o 2º ciclo continua de onde parou (páginas '+pagina+', sem repetir a 1ª)',
      paginasVistas.length===pagina&&paginasVistas[0]<1700000000000);
    ok('e aí sim termina e carimba "recuperação feita" ('+pagina+' páginas)',
      !!dados.config.recuperacaoExcluidosEm);
    ok('o cursor é limpo quando termina',!st2.recuperacaoCursor);
    ok('nenhuma página foi pedida duas vezes com o mesmo cursor',
      new Set(paginasVistas).size===paginasVistas.length);
  }

  console.log('\nRESULTADO: '+passou+' verificações passaram — a recuperação não ressuscita o que ele apagou, o aviso não se perde e a varredura grande termina.');
  process.exit(0);
})().catch(e=>{console.error('erro no teste:',e&&e.stack||e);process.exit(1);});
//<<<<SECAO:test_recuperacao_nao_ressuscita.js:FIM>>>>
}

if (false) { // ═══ test_worker_publico.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_worker_publico.js:INICIO>>>>
// test_worker_publico.js — v7.0.19 (motor da nuvem 5.28.2: + foto /v1/snapshot)
// Roda o MOTOR DA NUVEM DE VERDADE (cloudflare-worker/src/index.js) sobre um banco
// SQLite em memória, aplicando as migrations reais do projeto. É o mesmo código
// que o dono publica — só o banco é de mentira.
//
// Trava o que foi provado nesta rodada:
//   1) o aparelho público ("Aprovação Pública") NÃO pode ser apagado e recriado a
//      cada acesso — era `INSERT OR REPLACE`, que no SQLite apaga a linha e com ela
//      ia embora a revogação (`revoked_at`) e a exclusão (`excluido_em`);
//   2) a busca do orçamento pelo token não pode trazer a lista inteira de orçamentos
//      para o motor abrir o JSON de cada um (a cada acesso do cliente);
//   3) o caminho público passa pelo freio da cota do dia e conta no medidor;
//   4) a criação "sem cadastro" (venda montada a partir do próprio link) tem teto
//      diário — o link é público e não tem como provar quem mandou;
//   5) o fluxo normal do cliente (ver, autorizar, recusar) continua funcionando.
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let passou=0;
function ok(nome,cond){if(!cond){console.error('  \u2718 '+nome);process.exit(1);}console.log('  \u2714 '+nome);passou++;}

let sqlite=null;
try{ sqlite=require('node:sqlite'); }
catch(e){
  // Node antigo: tenta de novo com a flag (uma vez)
  if(process.env.__DIGICOPY_SQLITE!=='1'){
    const r=require('child_process').spawnSync(process.execPath,['--experimental-sqlite',__filename],
      {stdio:'inherit',env:Object.assign({},process.env,{__DIGICOPY_SQLITE:'1'})});
    process.exit(r.status||0);
  }
  console.log('== MOTOR DA NUVEM (banco de prova) ==');
  console.log('  (não rodou: este Node não tem node:sqlite)');
  process.exit(0);
}

console.log('== MOTOR DA NUVEM NO BANCO DE PROVA (v5.28.2) ==');

// ── banco de mentira, igual ao D1: prepare/bind/first/all/run/batch/exec ────
function abrirBanco(){
  const db=new sqlite.DatabaseSync(':memory:');
  // As tabelas que o MOTOR cria em execução (app_versao, app_releases, uso_diario…)
  // precisam existir antes das migrations: a 0006 altera app_releases. Extraio os
  // CREATE que o próprio motor escreve — nada inventado aqui.
  const fonteWorker=fs.readFileSync(process.env.DIGICOPY_WORKER||'cloudflare-worker/src/index.js','utf8');
  const cria=[...fonteWorker.matchAll(/DB\.exec\(`(CREATE TABLE IF NOT EXISTS[^`]*?)`\)/g)].map(m=>m[1]);
  for(const sql of cria) db.exec(sql);
  const migracoes=fs.readdirSync('cloudflare-worker/migrations').filter(f=>/\.sql$/.test(f)).sort();
  for(const m of migracoes) db.exec(fs.readFileSync(path.join('cloudflare-worker/migrations',m),'utf8'));
  const escritos=[];
  const norm=a=>a.map(x=>{
    if(x===undefined||x===null)return null;
    if(typeof x==='boolean')return x?1:0;
    if(typeof x==='number'&&!Number.isFinite(x))return null;
    return x;
  });
  function stmt(sql){
    const s={
      sql:sql,_args:[],
      bind(...a){ s._args=norm(a); return s; },
      async first(){ const r=db.prepare(sql).get(...s._args); return r===undefined?null:r; },
      async all(){ return {results:db.prepare(sql).all(...s._args)}; },
      async run(){ const i=db.prepare(sql).run(...s._args); return {success:true,meta:i}; }
    };
    return s;
  }
  const D1={
    prepare:sql=>{ escritos.push(String(sql).replace(/\s+/g,' ').trim()); return stmt(sql); },
    async exec(sql){ db.exec(sql); },
    async batch(lista){
      const saida=[];
      db.exec('BEGIN');
      try{
        for(const s of lista) saida.push(await s.run());
        db.exec('COMMIT');
      }catch(e){ try{db.exec('ROLLBACK');}catch(e2){} throw e; }
      return saida;
    }
  };
  return {db,D1,escritos};
}
// ── chama o worker de verdade: fetch(request, env, ctx) ────────────────────
async function abrirWorker(){
  // permite apontar para outra cópia do motor (usado para conferir que este teste
  // REPROVA o motor antigo — e passa no corrigido)
  const alvo=process.env.DIGICOPY_WORKER||'cloudflare-worker/src/index.js';
  const mod=await import(pathToFileURL(path.resolve(alvo)).href);
  return mod.default;
}
function chamar(worker,banco,url,opcoes){
  const pend=[];
  const ctx={waitUntil:p=>{pend.push(Promise.resolve(p));}};
  const env={DB:banco.D1,SETUP_SECRET:'segredo-de-teste'};
  const req=new Request(url,opcoes||{});
  return worker.fetch(req,env,ctx).then(async res=>{
    const corpo=await res.json().catch(()=>null);
    await Promise.all(pend);            // deixa o medidor do dia gravar
    return {status:res.status,corpo};
  });
}
const dia=()=>new Date().toISOString().slice(0,10);
// v5.27.0 — o aparelho autentica por sha256 do token (igual ao motor)
const hashToken=(t)=>require('crypto').createHash('sha256').update(t).digest('hex');
function semearOrcamento(banco,recordId,token,dados){
  // o aparelho precisa existir: o banco de prova tem as mesmas chaves estrangeiras
  banco.db.prepare(`INSERT OR IGNORE INTO devices(id,name,token_hash,role,created_at,last_seen_at)
    VALUES('pc-1','PC da loja','h','device',?,?)`).run(Date.now(),Date.now());
  banco.db.prepare(`INSERT INTO records(entity,record_id,data_json,version,updated_at,deleted_at,updated_by)
    VALUES('orcamentos',?,?,1,?,NULL,'pc-1')`).run(recordId,JSON.stringify(Object.assign({id:recordId,token:token,numero:'100',clienteNome:'Cliente Teste',itens:[{descricao:'Serviço',qtd:1,preco:50,subtotal:50}],total:50,status:'aberto'},dados||{})),Date.now());
}
function payloadLink(extra){
  const p=Object.assign({t:'olink',n:'100',c:'Cliente Teste',dt:'2026-01-01',tot:50,w:'38999999999',it:[{d:'Serviço',q:1,p:50,s:50}]},extra||{});
  return Buffer.from(JSON.stringify(p),'utf8').toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
const conta=(banco,sql,...args)=>banco.db.prepare(sql).get(...args).n;

(async()=>{
  const worker=await abrirWorker();

  // ═══ 1) fluxo normal do cliente ══════════════════════════════════════════
  console.log('-- 1) o fluxo do cliente continua funcionando --');
  {
    const banco=abrirBanco();
    semearOrcamento(banco,'orc_1','otoken123456');
    const ver=await chamar(worker,banco,'https://api.test/orcamento?c=otoken123456');
    ok('abrir o link do orçamento devolve a página do cliente ('+ver.status+')',
      ver.status===200&&ver.corpo&&ver.corpo.ok===true&&ver.corpo.numero==='100');
    const ap=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'otoken123456'})});
    ok('autorizar cria a venda salva ('+ap.corpo.vendaId+')',ap.status===200&&ap.corpo.status==='aprovado'&&!!ap.corpo.vendaId);
    ok('a venda existe no banco',conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='vendas'")===1);
    ok('a notificação para o dono existe',conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='notificacoes'")===1);
    ok('o orçamento ficou marcado como aprovado',
      String(JSON.parse(banco.db.prepare("SELECT data_json d FROM records WHERE entity='orcamentos' AND record_id='orc_1'").get().d).status)==='aprovado');
    ok('venda normal NÃO leva a marca de "sem cadastro"',
      !JSON.parse(banco.db.prepare("SELECT data_json d FROM records WHERE entity='vendas'").get().d).semCadastroNoSistema);
    const deNovo=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'otoken123456'})});
    ok('autorizar duas vezes não gera outra venda ('+deNovo.corpo.message+')',
      deNovo.status===200&&conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='vendas'")===1);
  }
  {
    const banco=abrirBanco();
    semearOrcamento(banco,'orc_2','otoken222222');
    const rec=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'recusar',c:'otoken222222'})});
    ok('recusar continua funcionando',rec.status===200&&rec.corpo.status==='recusado');
    ok('recusa não cria venda',conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='vendas'")===0);
  }
  {
    const banco=abrirBanco();
    const pedidoInvalido=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({c:'otoken222222'})});
    ok('pedido sem ação é recusado',pedidoInvalido.status===400);
    ok('pedido recusado não grava NADA (nem a linha do aparelho público)',
      conta(banco,"SELECT COUNT(*) n FROM devices")===0);
  }

  // ═══ 2) o aparelho público não pode ser apagado e recriado ═══════════════
  console.log('-- 2) a revogação do aparelho público tem de segurar --');
  {
    const banco=abrirBanco();
    semearOrcamento(banco,'orc_3','otoken333333');
    // o mecanismo ANTIGO, para o defeito ficar documentado no próprio teste:
    // `INSERT OR REPLACE` apaga a linha e cria outra (revogação vai embora)
    banco.db.exec(`INSERT OR REPLACE INTO devices(id,name,token_hash,role,created_at,last_seen_at)
      VALUES('public-orcamento','Aprovação Pública','hash-publico','device',111,111)`);
    banco.db.exec(`UPDATE devices SET revoked_at=222, excluido_em=333 WHERE id='public-orcamento'`);
    banco.db.exec(`INSERT OR REPLACE INTO devices(id,name,token_hash,role,created_at,last_seen_at)
      VALUES('public-orcamento','Aprovação Pública','hash-publico','device',444,444)`);
    // ATENÇÃO (achado do próprio teste): num "OR REPLACE" o conflito pode ser de
    // OUTRO índice — o token_hash é ÚNICO, então subir o mesmo valor apagava a
    // linha de outro aparelho (o banco recusou por chave estrangeira no fim do
    // comando). Com ON CONFLICT(id) DO UPDATE isso não existe: a linha do
    // aparelho público é a única que pode ser tocada. Fica valendo em dobro
    // para a correção.
    const linha=banco.db.prepare("SELECT * FROM devices WHERE id='public-orcamento'").get();
    ok('(documentado) o INSERT OR REPLACE antigo apagava a revogação: revoked_at='+linha.revoked_at+' excluido_em='+linha.excluido_em,
      linha.revoked_at===null&&linha.excluido_em===null&&linha.created_at===444);
    // agora o dono REVOGA o aparelho público no painel e o cliente decide o orçamento
    // (abrir a página é só leitura; quem grava o aparelho público é o POST)
    banco.db.exec(`UPDATE devices SET revoked_at=555, excluido_em=666 WHERE id='public-orcamento'`);
    const post=()=>chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'recusar',c:'otoken333333'})});
    await post();
    await post();
    const depois=banco.db.prepare("SELECT * FROM devices WHERE id='public-orcamento'").get();
    ok('o motor de agora manda a visita sem apagar a linha (revogado='+depois.revoked_at+', excluído='+depois.excluido_em+')',
      depois&&Number(depois.revoked_at)===555&&Number(depois.excluido_em)===666);
    ok('e sem reiniciar o "criado em" (created_at segue o primeiro)',
      depois.created_at===444);
    ok('mas a visita é atualizada (last_seen_at maior que antes)',Number(depois.last_seen_at)>444);
    ok('existe UMA só linha do aparelho público',conta(banco,"SELECT COUNT(*) n FROM devices WHERE id='public-orcamento'")===1);
  }

  // ═══ 3) achar o orçamento pelo token não pode varrer a lista inteira ═════
  console.log('-- 3) busca do token: uma linha, não a lista toda --');
  {
    const banco=abrirBanco();
    for(let i=0;i<300;i++)semearOrcamento(banco,'orc_v'+i,'otok'+String(i).padStart(6,'0'));
    banco.escritos.length=0;
    const achou=await chamar(worker,banco,'https://api.test/orcamento?c=otok000123');
    ok('acha o orçamento certo no meio de 300 ('+achou.status+' , numero='+(achou.corpo&&achou.corpo.numero)+')',
      achou.status===200&&achou.corpo&&achou.corpo.numero==='100');
    const varredura=banco.escritos.filter(q=>/SELECT \* FROM records WHERE entity = 'orcamentos' *$/.test(q.trim()));
    ok('NÃO pediu a lista inteira de orçamentos',varredura.length===0);
    ok('usou o filtro no banco (token dentro do JSON)',
      banco.escritos.some(q=>/LIKE \? ESCAPE/.test(q)&&/entity = 'orcamentos'/.test(q)));
    ok('não trouxe 300 registros (nenhuma consulta de lista completa)',
      !banco.escritos.some(q=>/FROM records WHERE entity = 'orcamentos'\s*$/.test(q.trim())));
    // e o caminho antigo (id do registro) continua valendo
    const porId=await chamar(worker,banco,'https://api.test/orcamento?c=orc_v5');
    ok('link antigo com o ID do registro continua abrindo',porId.status===200);
    const nada=await chamar(worker,banco,'https://api.test/orcamento?c=naoexiste123');
    ok('token que não existe devolve 404',nada.status===404);
    const curto=await chamar(worker,banco,'https://api.test/orcamento?c=abc');
    ok('token curto demais não acha nada',curto.status===404);
  }

  // ═══ 4) freio da cota + medidor do dia no caminho público ════════════════
  console.log('-- 4) o caminho público conta na cota e obedece o freio --');
  {
    const banco=abrirBanco();
    semearOrcamento(banco,'orc_4','otoken444444');
    await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'otoken444444'})});
    const uso=banco.db.prepare('SELECT escritas FROM uso_diario WHERE dia=?').get(dia());
    ok('as gravações do caminho público entram no medidor do dia ('+(uso?uso.escritas:0)+')',!!uso&&Number(uso.escritas)>=3);
  }
  {
    // v5.27.0 (rodada 28) — O FREIO FALA A LÍNGUA DO PLANO. A conta do dono é PAGA
    // (Workers Paid US$5) e o freio preventivo ainda usava o número do GRÁTIS
    // (95.000 linhas/dia): a nuvem parava no meio do dia e o que era digitado num PC
    // não aparecia no outro. Aqui ficam as três provas — inclusive a CONTRA-PROVA de
    // que 95.000 não pausa mais nada numa conta paga.
    const banco=abrirBanco();
    semearOrcamento(banco,'orc_5','otoken555555');
    banco.db.prepare("INSERT INTO uso_diario(dia,escritas,leituras) VALUES(?,95000,0)").run(dia());
    const naoCheio=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'otoken555555'})});
    ok('CONTA PAGA não é mais barrada no número do plano grátis (95.000) — era o bug da rodada 28',
      naoCheio.status===200);

    const banco2=abrirBanco();
    semearOrcamento(banco2,'orc_6','otoken666666');
    banco2.db.prepare("INSERT INTO uso_diario(dia,escritas,leituras) VALUES(?,?,0)").run(dia(),1000001);
    const cheio=await chamar(worker,banco2,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'otoken666666'})});
    ok('no teto REAL do plano pago (1 milhão/dia), a nuvem pausa o caminho público ('+cheio.status+')',
      cheio.status===429&&cheio.corpo&&cheio.corpo.quota===true&&/daily row write limit/.test(cheio.corpo.error));
    ok('e não grava nada (nenhuma venda criada)',conta(banco2,"SELECT COUNT(*) n FROM records WHERE entity='vendas'")===0);
    const registrou=banco2.db.prepare("SELECT value v FROM system_meta WHERE key='freio_ultimo'").get();
    ok('o disparo do freio fica REGISTRADO (é o que o /health mostra de fora)',
      !!registrou&&JSON.parse(registrou.v).motivo==='dia');
    // v5.27.0 — A CONFERÊNCIA DE FORA: o /health é público e passa a dizer se a
    // nuvem está recusando gravação hoje. É assim que a manutenção identifica o
    // problema sem depender de ninguém abrir o sistema (e sem expor dado nenhum).
    const saida=await chamar(worker,banco2,'https://api.test/health',{method:'GET'});
    const saud=(saida.corpo&&typeof saida.corpo==='object')?saida.corpo:JSON.parse(saida.corpo||'{}');
    ok('o /health publica o freio preventivo (plano, teto do dia e se disparou hoje) — sem dado nenhum de negócio',
      saida.status===200&&saud.freio&&saud.freio.plano==='pago'&&saud.freio.tetoDia===1000000&&saud.freio.disparouHoje===true&&saud.freio.motivo==='dia');
    const zerado=await chamar(worker,abrirBanco(),'https://api.test/health',{method:'GET'});
    const zeradoTxt=(zerado.corpo&&typeof zerado.corpo==='object')?JSON.stringify(zerado.corpo):String(zerado.corpo||'');
    ok('e, ANTES de qualquer disparo, o /health diz que não disparou (sem susto falso)',
      zeradoTxt.indexOf('"disparouHoje":false')>=0);
  }

  // ═══ 5) criação "sem cadastro": funciona, fica marcada e tem teto ════════
  console.log('-- 5) link antes do cadastro: teto por dia e marca na venda --');
  {
    const banco=abrirBanco();
    const d=payloadLink({t:'olinknovo'});
    const sem=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'olinknovo',numero:'777',clienteNome:'Cliente Novo',d:d})});
    ok('o caminho "sem cadastro" continua criando a venda ('+sem.corpo.vendaId+')',sem.status===200&&!!sem.corpo.vendaId);
    const venda=JSON.parse(banco.db.prepare("SELECT data_json d FROM records WHERE entity='vendas'").get().d);
    ok('a venda fica MARCADA para o dono saber de onde veio',venda.semCadastroNoSistema===true);
    ok('e o orçamento também',
      JSON.parse(banco.db.prepare("SELECT data_json d FROM records WHERE entity='orcamentos' LIMIT 1").get().d).semCadastroNoSistema===true);
    ok('contou no teto do dia',
      Number(banco.db.prepare("SELECT value v FROM system_meta WHERE key=?").get('orc_pub_sem_cadastro_'+dia()).v)===1);
  }
  {
    const banco=abrirBanco();
    // simula o teto já batido hoje (uso normal é raro; 40 é folga)
    banco.db.prepare("INSERT INTO system_meta(key,value,updated_at) VALUES(?,?,?)").run('orc_pub_sem_cadastro_'+dia(),'40',Date.now());
    const estourou=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'olinkforjado',numero:'999',clienteNome:'Forjado',d:payloadLink()})});
    ok('passando do teto, a criação sem cadastro é recusada ('+estourou.status+')',estourou.status===429);
    ok('e NADA é criado (nenhuma venda falsa entra na base)',
      conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='vendas'")===0&&
      conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='orcamentos'")===0);
  }

  // ═══ 7) RELATO DE SAÚDE DO APP (v5.27.0 — rodada 29) ═══════════════════════
  console.log('-- 7) relato de saúde: o app conta o que deu errado (técnico) --');
  {
    const banco=abrirBanco();
    const token='dtoken-relato-123';
    banco.db.prepare(`INSERT OR IGNORE INTO devices(id,name,token_hash,role,created_at,last_seen_at)
      VALUES('pc-rel','PC Escritorio',?, 'device',?,?)`).run(hashToken(token),Date.now(),Date.now());
    const cab={ 'content-type':'application/json', authorization:'Bearer '+token };
    const r1=await chamar(worker,banco,'https://api.test/v1/relato',{method:'POST',headers:cab,
      body:JSON.stringify({tipo:'freio',codigo:'daily row write limit próximo do teto',versao:'7.0.17'})});
    ok('o app consegue contar o que deu errado (freio da cota)',r1.status===200&&r1.corpo&&r1.corpo.ok===true);
    const r2=await chamar(worker,banco,'https://api.test/v1/relato',{method:'POST',headers:cab,
      body:JSON.stringify({tipo:'freio',codigo:'de novo'})});
    ok('relato repetido no mesmo minuto é ignorado (não gasta gravação à toa)',!!(r2.corpo&&r2.corpo.ignorado));
    const r3=await chamar(worker,banco,'https://api.test/v1/relato',{method:'POST',
      headers:{'content-type':'application/json'},body:JSON.stringify({tipo:'falha'})});
    ok('sem credencial o relato entra NÃO (o /health é público, escrever não é)',r3.status===401);
    const saida=await chamar(worker,banco,'https://api.test/health',{method:'GET'});
    const saud=(saida.corpo&&typeof saida.corpo==='object')?saida.corpo:JSON.parse(saida.corpo||'{}');
    ok('o /health publica a saúde: quantos relatos hoje e qual foi o último de cada tipo',
      saud.saude&&saud.saude.contagem&&saud.saude.contagem.freio===1&&saud.saude.ultimo&&saud.saude.ultimo.freio
      &&saud.saude.ultimo.freio.codigo.indexOf('daily row write limit')>=0);
    ok('e o aparelho aparece como apelido curto (não expõe id, nome nem token)',
      /^[0-9a-f]{8}$/.test(saud.saude.ultimo.freio.disp));
    const texto=JSON.stringify(saud);
    ok('nenhum dado de negócio no relato (só tipo, mensagem técnica, versão, hora e apelido)',
      !/Cliente Teste|CPF|telefone|valor|R\$/i.test(texto));
    const vazio=await chamar(worker,abrirBanco(),'https://api.test/health',{method:'GET'});
    const txtVazio=(vazio.corpo&&typeof vazio.corpo==='object')?JSON.stringify(vazio.corpo):String(vazio.corpo||'');
    ok('sem nenhum relato, o /health não inventa nada (contagem vazia)',txtVazio.indexOf('"saude"')>=0);
  }


  // ═══ 8) FOTO DA NUVEM (v5.28.2 — rodada 31) ═════════════════════════════
  console.log('-- 8) foto: o estado atual sem recontar a história --');
  {
    const banco=abrirBanco();
    const token='dtoken-foto-123';
    banco.db.prepare(`INSERT OR IGNORE INTO devices(id,name,token_hash,role,created_at,last_seen_at)
      VALUES('pc-foto','PC Balcao',?, 'device',?,?)`).run(hashToken(token),Date.now(),Date.now());
    const cab={ authorization:'Bearer '+token };
    let mutN=0;
    const M=(id,v,data,op)=>({ mutationId:'mut-foto-'+(mutN++), entity:'clientes', recordId:id,
      operation:op||'upsert', baseVersion:v, data:data });
    async function push(muts){
      return chamar(worker,banco,'https://api.test/v1/changes',{ method:'POST',
        headers:{ authorization:'Bearer '+token, 'content-type':'application/json' },
        body:JSON.stringify({ mutations:muts }) });
    }
    // 3 criados + 2 edições + 1 exclusão = 6 no diário, 2 vivos
    await push([M('c1',0,{id:'c1',nome:'Um'})]);
    await push([M('c2',0,{id:'c2',nome:'Dois'})]);
    await push([M('c3',0,{id:'c3',nome:'Três'})]);
    await push([M('c1',1,{id:'c1',nome:'Um v2'})]);
    await push([M('c1',2,{id:'c1',nome:'Um v3'})]);
    await push([M('c3',1,null,'delete')]);
    const foto1=await chamar(worker,banco,'https://api.test/v1/snapshot?limit=1',{headers:cab});
    ok('a foto responde (200) com seq + registros + hasMore',
      foto1.status===200&&foto1.corpo&&foto1.corpo.ok===true
      &&typeof foto1.corpo.snapshotSeq==='number'&&Array.isArray(foto1.corpo.records)
      &&foto1.corpo.hasMore===true);
    ok('página 1 traz o primeiro vivo (c1) na versão ATUAL (v3, sem repetir história)',
      foto1.corpo.records.length===1&&foto1.corpo.records[0].recordId==='c1'
      &&foto1.corpo.records[0].version===3&&foto1.corpo.records[0].data.nome==='Um v3');
    const seq=foto1.corpo.snapshotSeq;
    ok('o snapshotSeq é o MAX(seq) do diário (6)',seq===6,'seq='+seq);
    const foto2=await chamar(worker,banco,
      'https://api.test/v1/snapshot?limit=1&afterEntity=clientes&afterId=c1',{headers:cab});
    ok('página 2 traz c2 e acaba (o excluído c3 NÃO vem)',
      foto2.corpo.records.length===1&&foto2.corpo.records[0].recordId==='c2'
      &&foto2.corpo.records[0].version===1&&foto2.corpo.hasMore===false);
    // gravado DEPOIS da foto: seq maior → chega pelo incremental
    await push([M('c4',0,{id:'c4',nome:'Quatro'})]);
    const inc=await chamar(worker,banco,'https://api.test/v1/changes?cursor='+seq,{headers:cab});
    ok('o que foi gravado depois da foto chega pelo incremental (cursor=seq)',
      inc.corpo.changes.length===1&&inc.corpo.changes[0].recordId==='c4');
    const uniao={};
    foto1.corpo.records.concat(foto2.corpo.records).forEach(r=>{uniao[r.recordId]=r.version;});
    inc.corpo.changes.forEach(c=>{uniao[c.recordId]=c.version;});
    ok('foto + incremental cobrem os 3 vivos na versão atual (e o excluído não volta)',
      uniao.c1===3&&uniao.c2===1&&uniao.c4===1&&!('c3' in uniao),JSON.stringify(uniao));
    const semCred=await chamar(worker,banco,'https://api.test/v1/snapshot',{});
    ok('sem credencial a foto NÃO sai (401)',semCred.status===401);
  }

  console.log('\nRESULTADO: '+passou+' verificações passaram — o motor da nuvem no banco de prova (fluxo do cliente, aparelho público, busca do token, cota e teto).');
  process.exit(0);
})().catch(e=>{console.error('  \u2718 erro no teste: '+(e&&e.stack||e));process.exit(1);});
//<<<<SECAO:test_worker_publico.js:FIM>>>>
}

if (false) { // ═══ checar_cota_nuvem.js (inerte: só parse, nunca executa)
//<<<<SECAO:checar_cota_nuvem.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// checar_cota_nuvem.js — FAROL ANTI-ESTOURO (v5.24.5, ordem do dono:
// "nunca deixa estourar essa nuvem").
//
// Rodar antes de entregar QUALQUER versão:  node checar_cota_nuvem.js
// Este farol é obrigatório daqui em diante: ele lê o worker e o app e
// garante, sozinho, que nada novo consegue torrar a cota do plano grátis:
//   1) a nuvem NÃO regrava registro idêntico (dedupe ligado);
//   2) existe um FREIO DENTRO do worker que para de aceitar gravação ANTES
//      do teto de 100 mil escritas/dia (folga de segurança);
//   3) a pausa é reconhecida pelo app ("daily row write limit" no texto →
//      aviso amigável e reenvio automático depois da virada às 21h);
//   4) envios saem em lote com teto (MAX_OUTBOX), nunca em catarata solta;
//   5) DDL continua numa linha só (sem o fantasma do "incomplete input").
// E no final ele ainda faz a CONTA do dia típico, para número nenhum virar
// supresa: quantas escritas um dia de loja gasta do teto diário.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }

const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const sync   = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');

console.log('-- muralhas da cota (worker + app) --');
ok((worker.match(/noop: true, version: currentVersion/g) || []).length === 2,
   'dedupe: registro idêntico e delete repetido viram "noop" (zero gravação)');
ok(worker.indexOf('const PLANO = PLANO_PAGO;') >= 0,
   'plano pago ligado no ponto único (o freio segue o plano, sem número solto)');
ok(/freioDia:\s*1000000/.test(worker) && worker.indexOf('freioDecide') >= 0,
   'freio de DIA existe e decide antes do teto (1M/dia no pago)');
ok(/freioMes:\s*45000000/.test(worker) && /tetoEscritas:\s*50000000/.test(worker),
   'freio de MÊS 45M com folga de 10% sob o teto de 50M');
ok(worker.indexOf('daily row write limit próximo') >= 0 && worker.indexOf('429') >= 0,
   'freio devolve pausa amigável que o app reconhece e respeita');
ok(sync.indexOf('ehLimiteDiario') >= 0 && /daily row \(write\|read\) limit/.test(sync),
   'app reconhece a pausa da cota e guarda as mudanças até a virada');
ok(/MAX_OUTBOX\s*=\s*\d+/.test(sync), 'envio sai em lotes com teto (sem catarata)');
ok(!/CREATE TABLE IF NOT EXISTS \w+ \(\s*\n/.test(worker), 'DDL sempre numa linha só');
ok(worker.indexOf("catch (eUso)") >= 0, 'medidor nunca derruba o /v1/status');

console.log('-- conta do dia típico (quanto do teto a loja gasta) --');
// Cada mudança NOVA grava 2 linhas (o registro + o evento no diário).
// Registro regravado IGUAL = 0 linhas (dedupe medido acima).
// Teto do plano grátis: 100.000 linhas escritas/dia; freio interno: 95.000.
function estimativa(nome, mudancasPorDia, pcs){
  const linhas = mudancasPorDia * 2 * pcs;
  const pct = (linhas / 100000 * 100);
  console.log('  • ' + nome + ': ' + mudancasPorDia + ' mudança(s)/dia × ' + pcs + ' PC(s) = ' +
    linhas + ' linhas/dia = ' + pct.toFixed(2).replace('.', ',') + '% do teto' +
    (pct < 10 ? ' (folgadíssimo)' : pct < 50 ? ' (confortável)' : ' ⚠ PESADO'));
  return linhas;
}
const total = [
  estimativa('dia movimentado de 1 loja (vendas+clientes+produtos+financeiro)', 300, 1),
  estimativa('mesmo dia com 2 PCs ligados o dia todo', 300, 2),
  estimativa('dia recorde exagerado (mil mudanças reais)', 1000, 2)
].reduce((s, n) => s + n, 0);
ok(total < 95000, 'até o cenário exagerado somado fica abaixo do freio (95 mil)');
console.log('  TOTAL DOS 3 CENÁRIOS JUNTOS: ' + total + ' linhas/dia (' +
  (total / 100000 * 100).toFixed(2).replace('.', ',') + '% do teto).');
console.log('  Resumo: com dedupe + freio, estourar a cota exigiria MILHARES de');
console.log('  mudanças reais num único dia. Uma restauração/publicação de PC inteiro');
console.log('  grava de verdade só na 1ª vez — depois tudo vira "noop" (grátis).');

if (falhas) { console.error('\n' + falhas + ' FALHA(S) NO FAROL — NÃO ENTREGAR ASSIM'); process.exit(1); }
console.log('\nFarol verde: nada desta versão consegue estourar a nuvem.');
//<<<<SECAO:checar_cota_nuvem.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v5240.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v5240.js:INICIO>>>>
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
ok(patchBk.indexOf('bk-agora') >= 0 && patchBk.indexOf('bk-baixar-todos') >= 0 && patchBk.indexOf('bk-excluir-todos') < 0, 'manual + .zip ficam, ralador saiu (r46)');
ok(patchBk.indexOf('bk-rest-arq') >= 0 && patchBk.indexOf('Restaurar a partir de um arquivo de backup') >= 0, 'restauração por arquivo preservada');
ok(patchBk.indexOf('pcBtn') < 0, 'handler do botão removido junto');
ok(bundle.indexOf('bk-pc-baixar') < 0 && bundleMob.indexOf('bk-pc-baixar') < 0, 'botão duplicado fora dos 2 bundles');

// 2) item 1.3: manual numerado no worker
console.log('-- item 1.3: Backup manual 1, 2, 3... (worker) --');
ok(worker.indexOf("return PASTA_MANUAL + '/Backup manual ' + seq + '.json';") >= 0, 'nome do manual = "Backup manual N.json"');
ok(worker.indexOf('backup_seq_manual') >= 0 && worker.indexOf('ON CONFLICT(key) DO UPDATE SET value = CAST(value AS INTEGER) + 1') >= 0, 'contador persistente na nuvem (system_meta) com incremento atômico');
ok(worker.indexOf('chave = nomeBackupManual(await proximoSeqManual(env));') >= 0, 'backup manual usa o próximo número da nuvem');
const vW = (worker.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').indexOf('Worker ' + vW) >= 0, 'worker carimbado (v' + vW + ') e motor colado na mesma versão');

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
ok(manifest.includes('ajustes_v5240_relatorio_grande_patch.js') && manifest.indexOf('ajustes_v5240_relatorio_grande_patch.js') < manifest.indexOf('ajustes_v5243_cliente_abas_patch.js'), 'manifest tem o patch do relatório antes do patch das abas (ordem de carga)');
const nScripts = Number((bundle.match(/\* scripts: (\d+) \| sha256:/) || [])[1] || 0);
ok(nScripts === manifest.length && nScripts > 200, 'header do bundle bate com o manifest (' + nScripts + ' scripts)');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0 && indexHtml.indexOf('app.bundle.js?v=' + pkg.version) >= 0, 'index.html na v' + pkg.version);
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '" + pkg.version + "'") >= 0, 'mobile/www/index.html na v' + pkg.version);
ok(/^\d+\.\d+\.\d+$/.test(pkg.version), 'package.json com versão válida (v' + pkg.version + ')');


// 12) v5.24.2 — CORS da prova do usuário + menus Nuvem/Backup só para Admin
console.log('-- v5.24.2: CORS consertado + menus só Admin --');
ok(worker.indexOf("'access-control-allow-headers': 'authorization, content-type, x-setup-secret, x-digicopy-versao, x-digicopy-usuario-login, x-digicopy-usuario-prova, x-digicopy-usuario-prova2',") >= 0, 'CORS da nuvem aceita os cabeçalhos da prova do usuário, antiga e nova com salt (r54 P3)');
ok(patchBk.indexOf("if(cargo==='admin') return true;") >= 0 && patchBk.indexOf("||cargo==='dono'") < 0 && patchBk.indexOf("||cargo2==='dono'") < 0, 'trava do app: cargo Dono NÃO abre mais backup (só Admin)');
ok(patchBk.indexOf('function aplicarVisibilidadeMenusNuvemBackup') >= 0 && patchBk.indexOf("getElementById('btn-nuvem')") >= 0 && patchBk.indexOf("getElementById('btn-backup-top')") >= 0 && patchBk.indexOf('button[onclick="exportBackup()"]') >= 0, 'helper esconde os menus Nuvem, Backup e o ícone de download para não-Admin');
ok(patchBk.indexOf('__v5242') >= 0 && patchBk.indexOf('O menu Nuvem é só para usuário com cargo Admin') >= 0, 'tela da Nuvem travada por cargo (defesa em profundidade)');
ok(patchBk.indexOf('Entre no sistema com um usuário de cargo Admin (ex.: Kauan)') >= 0 && patchBk.indexOf('ou Denivaldo (Dono)') < 0, 'cadeado do Backup não cita mais o Dono');
seguroEmAmbos('aplicarVisibilidadeMenusNuvemBackup', 'visibilidade dos menus nos 2 bundles');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v' + pkg.version); process.exit(1); }
console.log('\nTudo certo v' + pkg.version + '!');
//<<<<SECAO:test_ajustes_v5240.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52415.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52415.js:INICIO>>>>
// test_ajustes_v52415.js — v5.24.34: relato dele "salvou na nuvem mas alguns
// dados não aparecem no PC (usuários, técnico, vendas, orçamentos...)".
// Suspeita número 1 provada em código: as listas filtram por empresaId da
// sessão (renderUsuarios: u.empresaId===s.empresaId) — dois PCs com duas
// empresaIds = dois mundos invisíveis. Em vez de chutar a correção, sobe um
// DIAGNÓSTICO na tela de acompanhamento (custo zero de nuvem; pergunta 5° e a
// regra da economia do medidor): mostra o que chegou x o que está invisível.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

// r46 — o diagnóstico "Por que dados não aparecem?" saiu da tela com a faixa
// de botões (pedido do dono). A cura automática continua sozinha no patch
// da cura; estes asserts travam a REMOÇÃO (fonte + 2 bundles).
const p = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');
ok(p.includes('v7.1.0 (r46)'), 'carimbo r46 da faixa no patch');
ok(!p.includes('window.dcDiagnosticoInvisiveis'), 'função de diagnóstico removida');
ok(!p.includes('dc-diag-invisiveis'), 'botão removido do painel (id dc-diag-invisiveis)');
ok(!p.includes('Por que dados não aparecem?'), 'título do diagnóstico removido');
ok(!p.includes("INVISÍVEIS (outra empresa)"), 'marca de invisíveis removida');
ok(!p.includes('semSessaoComUmaEmpresa'), 'caso semSessaoComUmaEmpresa removido');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(!bundle.includes('dcDiagnosticoInvisiveis'), 'bundle NÃO contém mais o diagnóstico');
ok(!fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('dcDiagnosticoInvisiveis'), 'bundle do CELULAR também não contém');

const idx = fs.readFileSync('index.html', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(idx.includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(idx.includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(idx.includes('app.bundle.js?v=' + pkg.version), 'index: cache-bust v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');
const wkR = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const vW = (wkR.match(/const WORKER_VERSION = '([^']+)'/) || [])[1] || '';
ok(vW !== '' && fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8').includes('Worker ' + vW), 'worker carimbado (v' + vW + ') e motor colado na mesma versão');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (r46: diagnóstico "por que dados não aparecem" removido com a faixa).');
//<<<<SECAO:test_ajustes_v52415.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52419.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52419.js:INICIO>>>>
// test_ajustes_v52419.js — v5.24.34: pedido dele "muda as informações da
// nuvem" — limpeza dos textos visíveis que ainda falavam do mundo GRÁTIS
// (teto diário, zera 21h, "não ser pego de surpresa"). Plano pago ativo:
// o painel passa a dizer a verdade nova ($5 fixos, teto por mês e gigante).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const sync = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const dsyn = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');

// Mundando o que ELE vê no painel:
ok(!sync.includes('o teto grátis zera às 21h'), 'painel: "teto grátis zera 21h" FORA (mundo velho)');
ok(sync.includes('plano pago ativo ($5 fixos): o teto virou por mês e gigantesco'), 'painel: diz a verdade do plano pago');
ok(sync.includes('isso vira só curiosidade de uso, sem nenhum risco de susto'), 'painel: o rabinho que falava em "surpresa pelo teto" virou curiosidade');
ok(!sync.includes('não ser pego de surpresa pelo teto'), 'painel: nenhum texto ainda promete susto');
ok(sync.includes('📊 Uso da nuvem hoje'), 'painel: cabeçalho do medidor preservado (teste v5.22.96 segue íntegro)');

// A ficha quando (quase nunca) bater no limite:
ok(!dsyn.includes('A nuvem grátis atingiu o limite de gravação de hoje'), 'ficha: "grátis / de hoje" FORA');
ok(dsyn.includes('A nuvem aplicou o freio preventivo de gravações (para não estourar o limite do plano — raro no plano pago). Nada foi perdido: o envio recomeça sozinho quando o limite virar, em '), 'ficha: diz "freio preventivo (raro no plano pago)"');
ok(dsyn.includes('Nada foi perdido: o envio recomeça sozinho'), 'ficha: a promessa de segurança segue intacta');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('por mês e gigantesco'), 'bundle: texto do plano pago presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('por mês e gigantesco'), 'bundle do CELULAR igual');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (informações da nuvem no idioma do plano pago).');
//<<<<SECAO:test_ajustes_v52419.js:FIM>>>>
}

if (false) { // ═══ test_ajustes_v52420.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_ajustes_v52420.js:INICIO>>>>
// test_ajustes_v52420.js — v5.24.34: pedido dele "muda a estrutura completa
// pro pago + deixa anotado que é teste de 1 mês". Fecho do idioma "grátis"
// (último texto visível: a ficha do backup diário) + PONTO DE RECUO escrito
// no próprio worker (trocar 2 números + npm run deploy = volta ao grátis em
// 5 minutos, sem risco).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const bu = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
const wk = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const sync = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
const dsyn = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');

// Ficha do backup diário — era o último que falava grátis/21h/diário:
ok(!bu.includes('plano grátis atingiu o LIMITE DIÁRIO'), 'backup: "plano grátis / LIMITE DIÁRIO" FORA');
ok(bu.includes('do período (bem raro no plano pago)'), 'backup: fala a verdade do plano pago');
ok(bu.includes('o backup diário das 18:30 tenta de novo sozinho'), 'backup: promessa do 18:30 intacta');
ok(bu.includes('Se isso aparecer de novo, me avise'), 'backup: linha direta com ele intacta');

// Varredura: nenhum texto VISÍVEL restante fala grátis/21h como regra:
ok(!sync.includes('teto grátis') && !dsyn.includes('nuvem grátis') && !bu.includes('plano grátis atingiu'),
   'varredura final: nenhuma string visível sobrevive do idioma-grátis');

// PONTO DE RECUO (exigência dele: anotado e fechável em 5 minutos):
ok(wk.includes('TESTE DE 1 MÊS') && wk.includes('PONTO DE RECUO'), 'worker: ponto de recuo escrito no código');
ok(wk.includes('(100000, 5000000)') && wk.includes('(50000000, 25000000000)'), 'worker: receita do recuo com os números exatos');
ok(wk.includes('npm run deploy'), 'worker: comando do recuo indicado na fonte');
ok(/tetoEscritas: 50000000/.test(wk) && /tetoLeituras: 25000000000/.test(wk), 'worker: tetos pagos seguem valendo');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('bem raro no plano pago'), 'bundle: ficha nova dentro');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('bem raro no plano pago'), 'bundle do CELULAR igual');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' (estrutura no idioma pago + ponto de recuo de 1 mês).');
//<<<<SECAO:test_ajustes_v52420.js:FIM>>>>
}

if (false) { // ═══ test_zerar_deadlock_r50.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_zerar_deadlock_r50.js:INICIO>>>>
// test_zerar_deadlock_r50.js — r50 (Q3): Zerar NUNCA passava com a fila presa.
// "Não foi possível zerar / Aguarde a sincronização atual terminar" — o busy
// quase nunca apagava (push falhando há dias + tick novo a cada 3 s).
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const ler = a => fs.readFileSync(a, 'utf8');
const code = ler('cloudflare_data_sync_patch.js');
const fatia = (ini, fim) => code.slice(code.indexOf(ini), code.indexOf(fim));

console.log('== r50: o Zerar passa mesmo com sync rodando ==');
const reset = fatia('async function resetCloudOnly(){', 'async function baixarTudoDaNuvem');
ok('resetCloudOnly sem if(busy)throw (fim do deadlock)', !reset.includes('if(busy)throw'));
ok('resetCloudOnly ainda troca a geração (aborta o tick)', reset.includes('trocarEstado('));

console.log('== r50: resposta velha não polui o estado novo ==');
const pull = fatia('async function pullAll(opcoes){', 'const ESPERAS=');
ok('pull captura a geração na entrada', pull.includes('geracaoPull=estadoGeracao'));
ok('pull aborta em 2 pontos (leitura rápida + página)', (pull.match(/geracaoPull!==estadoGeracao/g) || []).length >= 2);
const push = fatia('async function pushOutbox(){', 'function leader(){');
ok('push captura a geração e aborta antes de marcar', push.includes('geracaoPush=estadoGeracao') && push.includes('geracaoPush!==estadoGeracao'));
ok('tick não anuncia sucesso após o zero', code.includes('zerou no fim da rodada'));

console.log('== r50: escolha Não-enviar não vaza fila ==');
const naoEnvia = fatia('async function manterLocalSemEnviar(){', 'async function planNaoAutorizarLocal');
ok('manterLocalSemEnviar limpa a outbox', naoEnvia.includes('outbox=[];'));

console.log('== r50: o que FICA travado de propósito ==');
ok('baixarTudo mantém a trava (não troca geração)', fatia('async function baixarTudoDaNuvem(){', 'async function publishLocalToCloud').includes('Aguarde a sincronização atual terminar'));
ok('discardLocal existe e sobraram 2 travas no motor (baixarTudo + discard)', code.includes('async function discardLocalKeepCloud(){') && (code.match(/Aguarde a sincronização atual terminar/g) || []).length === 2);

console.log('== r50: bundles (rodar npm run bundle antes de entregar) ==');
const b1 = ler('app.bundle.js'), b2 = ler('mobile/www/app.bundle.js');
ok('bundles com o aborto por geração', b1.includes('geracaoPull') && b2.includes('geracaoPull') && b1.includes('geracaoPush'));

console.log('\nRESULTADO: zerar deadlock r50 passou!');
//<<<<SECAO:test_zerar_deadlock_r50.js:FIM>>>>
}

if (false) { // ═══ test_r56_zerar_aparelhos.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_r56_zerar_aparelhos.js:INICIO>>>>
// ═══════════════════════════════════════════════════════════════════════════
// TESTE r56 — Zerar sem exigir bloqueio + aparelhos velhos saem sozinhos
//
// Pedido dele 29/09/2026: os trastes de logins repetidos travavam o Zerar
// (409 exigindo bloquear os outros antes). Agora o Zerar desconecta os outros
// sozinho; o aparelho que pediu continua; a senha da nuvem NUNCA é tocada.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');

let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++;
  console.log('  ✔ ' + nome);
}

const worker = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const tela = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');

console.log('== r56: Zerar sem bloqueio prévio, aparelhos saem sozinhos ==');
ok('gate de aparelho único removido', worker.indexOf('RESET_REQUIRES_SINGLE_DEVICE') < 0);
ok('Zerar conta os outros aparelhos (menos o que pediu)', worker.indexOf('WHERE id != ? AND revoked_at IS NULL AND excluido_em IS NULL') >= 0);
ok('Zerar revoga + tira os outros da lista', worker.indexOf('UPDATE devices SET revoked_at = ?, excluido_em = ?') >= 0);
ok('auditoria registra quantos saíram', worker.indexOf('aparelhosDesconectados') >= 0);
ok('backup de segurança antes do wipe continua', worker.indexOf('Backup antes de zerar a nuvem') >= 0);
ok('segredos (senhas) fora do wipe', worker.indexOf("DELETE FROM system_meta WHERE key = 'resumo_json'") >= 0 && !/DELETE FROM (segredos|secrets)/.test(worker));
ok('botão não manda mais bloquear antes', tela.indexOf('Bloqueie os outros aparelhos antes') < 0);
ok('botão avisa que os outros saem sozinhos e a senha não muda', tela.indexOf('DESCONECTADOS sozinhos') >= 0 && tela.indexOf('A senha da nuvem NÃO muda') >= 0);
ok('worker carimbado 5.28.2', worker.indexOf("const WORKER_VERSION = '5.28.2'") >= 0);
const motor = fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8');
ok('motor regenerado com a 5.28.2', motor.indexOf('5.28.2') >= 0 && motor.indexOf('aparelhosDesconectados') >= 0);

console.log('\nRESULTADO: ' + passou + ' verificações r56 — Zerar destravado!');
//<<<<SECAO:test_r56_zerar_aparelhos.js:FIM>>>>
}

if (false) { // ═══ test_r57_wipe_local.js (inerte: só parse, nunca executa)
//<<<<SECAO:test_r57_wipe_local.js:INICIO>>>>
// TESTE r57 — botão "Apagar dados DESTE PC" (pedido dele: zerou a nuvem, e o PC?)
// Prova: botão existe p/ admin, dupla confirmação, chama clearLocalData + recarrega,
// NUVEM intacta (nenhuma chamada /v1/*), motor ausente avisa em vez de quebrar.
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }
const code = fs.readFileSync('cloudflare_sync_patch.js', 'utf8');
console.log('== APAGAR DADOS DESTE PC (r57) ==');
ok('botão existe na administração', code.indexOf("button('Apagar dados DESTE PC','dc-wipe-local',false)") >= 0);
const ini = code.indexOf("querySelector('#dc-wipe-local').onclick");
ok('handler do botão existe', ini >= 0);
const fim = code.indexOf('// v5.22.74', ini);
const h = fim > ini ? code.slice(ini, fim) : '';
ok('dupla confirmação antes de apagar', (h.match(/confirmSistema/g) || []).length >= 2);
ok('apaga via clearLocalData do motor local', h.indexOf('DIGICOPY_INDEXED_DB.clearLocalData') >= 0);
ok('recarrega o sistema depois de apagar', h.indexOf('location.reload()') >= 0);
ok('NUVEM intacta (nenhuma chamada /v1/* no handler)', h.indexOf('/v1/') < 0 && h.indexOf('resetCloudOnly') < 0);
ok('motor ausente avisa em vez de quebrar', h.indexOf('Motor de dados locais não carregado') >= 0);
ok('só admin vê (dentro de bloco isAdmin)', code.lastIndexOf('if(isAdmin){', ini) >= 0);
console.log('\nRESULTADO: botão deste-PC provado!');
//<<<<SECAO:test_r57_wipe_local.js:FIM>>>>
}
