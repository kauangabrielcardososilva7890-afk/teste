// test_ajustes_v6004.js — v6.0.4: CURA DEFINITIVA DA SESSÃO + PERFIS DA NUVEM
// A prova do diagnóstico DELE: sessão "(nenhuma?!)" com 1 empresa no banco.
// Causa: a cura 6.0.2 só tentava 30s depois de abrir o sistema e marcava "já
// fez" na 1ª passada — login depois disso = dia inteiro sem carimbo.
const fs = require('fs');
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
ok('manifesto sobe pra 209; v6.0.4 fecha a fila', man.length === 209 && man[208] === 'perfis_nuvem_cura_sessao_patch.js' && man[205] === 'fiscal_guard_patch.js' && man[206] === 'nf_transmissao_patch.js' && man[207] === 'autocura_empresa_central_nf_tela_patch.js');
ok('bundle contém o patch da cura (PURE + banner)', bundle.indexOf('pncProximoPasso') >= 0 && bundle.indexOf('v6.0.4 — cura da sessão DEFINITIVA') >= 0);
ok('bundle contém o botão Reparar (5227)', bundle.indexOf('dc-reparar-sessao') >= 0 && bundle.indexOf('Reparar sessão agora') >= 0);

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
ok('caso dele vira resposta clara (semSessaoComUmaEmpresa)', vig.indexOf('semSessaoComUmaEmpresa') >= 0 && vig.indexOf('A CAUSA ESTÁ AQUI EM CIMA') >= 0 && vig.indexOf('empresas[0].id') >= 0);
ok('explica o detalhe técnico (sonda morria em 30s)', vig.indexOf('30 segundos') >= 0 && vig.indexOf('10 minutos') >= 0);
ok('botão verde Reparar sessão agora instalado', vig.indexOf("rp.id='dc-reparar-sessao'") >= 0 && vig.indexOf('acForcarCura') >= 0);
ok('fallback honesto se a cura não carregou (F5)', vig.indexOf('ainda não carregou nesta tela') >= 0);

console.log('== PERFIS DA NUVEM (app) ==');
ok('gastos trancados: usoBloco só no admin', sync.indexOf("(isAdmin?usoBloco:'')+linhaVersaoNuvem") >= 0);
ok('botão Nuvem aparece pra todo PC', /if\(cloud\)cloud\.style\.display='';/.test(sync) && sync.indexOf('v6.0.4 — pedido dele: o botão Nuvem aparece em TODO PC') >= 0);
ok('tela Nuvem abre pra todo PC (trava antiga de usuário removida; papel é do APARELHO)', !/!systemAdmin\(\)&&token\(\)/.test(sync) && sync.indexOf('PAPEL DO APARELHO') >= 0);
ok('desconectar só a si (rótulo claro + explicação)', sync.indexOf('Desconectar ESTE computador') >= 0 && sync.indexOf('Tira só ESTE computador') >= 0);
ok('zona de admin segue trancada no papel do aparelho', sync.indexOf("d.role==='admin'") >= 0);

console.log('== PERFIS DA NUVEM (worker 5.26.3) ==');
ok('worker na 5.26.3', wk.indexOf("WORKER_VERSION = '5.26.3'") >= 0);
ok('enroll-cnpj aceita a senha do GERENTE → role admin', wk.indexOf("via = 'cnpj-gerente'") >= 0 && wk.indexOf("role = 'admin'") >= 0);
ok('senha errada (conexão OU gerente) cai no MESMO erro de sempre (anti-oráculo)', wk.indexOf("if (!gerOk) throw new ApiError(403, 'CNPJ_OU_SENHA_INVALIDOS', 'CNPJ ou senha de conexão incorretos.');") >= 0);
ok('admin só com senhas DIFERENTES (gerente ≠ conexão)', wk.indexOf('seg.gerente_hash !== seg.conn_hash') >= 0);
const segEnroll = wk.slice(wk.indexOf("/v1/enroll-cnpj"), wk.indexOf("/v1/enroll-cnpj") + 5000);
ok('gerente só com o CNPJ DA DONA', /cnpj === seg\.owner_cnpj[\s\S]{0,120}conferirSenha\(env, cnpj, senha, 'gerente_hash'\)/.test(segEnroll));
ok('role entra VÁRIAVEL no INSERT do device (nada fixo)', segEnroll.indexOf("VALUES ('device_enrolled', ?, ?, ?, ?)") >= 0 && segEnroll.indexOf("VALUES (?, ?, ?, 'device'") < 0);
ok('eclusa anti-trancamento: connect-pass aceita prova de GERENTE (v5.26.3)', wk.slice(wk.indexOf("/v1/connect-pass"), wk.indexOf("/v1/connect-pass") + 1200).indexOf('requireAdminOuGerente(request, env)') >= 0 && wk.indexOf('eclusa anti-trancamento') >= 0);

console.log('== CARIMBO 6.0.4 ==');
ok('package.json na 6.0.4', pkg.version === '6.0.4');
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '6.0.4'") >= 0 && html.indexOf('>v6.0.4<') >= 0 && html.indexOf('app.bundle.js?v=6.0.4') >= 0);
ok('celular carimbado 6.0.4', mob.indexOf("DIGICOPY_APP_VERSION = '6.0.4'") >= 0 && mob.indexOf('>v6.0.4<') >= 0);

console.log('\n' + pass + ' passaram, ' + fail + ' falharam.');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.4: sessão nunca mais fica sem carimbo (sonda 10min + rearma no login e no db.save + botão Reparar); Nuvem com 2 papéis (gerente=admin com gastos; comum=sem gastos, só desconecta a si).');
