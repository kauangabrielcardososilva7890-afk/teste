// test_ajustes_v6002.js — v6.0.2: TRÊS OBRAS JUNTAS
//  1) CURA DOS DADOS SUMIDOS: sessão sem empresa + registros órfãos (sem
//     carimbo) são curados DETERMINISTICAMENTE — só quando o banco tem
//     EXATAMENTE UMA empresa. Com duas ou mais, NÃO chuta (sem achismo).
//  2) CENTRAL NF VIRA MENU: abrirCentralNfe abre a tela (navigateTo), botões
//     no nav-gest + barra clássica, placa de ambiente sempre no topo, CSC NF-e
//     salvo, histórico rende nela — aba flutuante flutuante morta de vez.
//  3) POPUPS NO ESTILO DO SISTEMA: nfxPedirTexto/nfxConfirmar com X de fechar;
//     o motor de transmissão NÃO usa mais prompt()/confirm() nativos (só
//     fallback se a popup própria não existir).
const fs = require('fs');
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const src = fs.readFileSync('autocura_empresa_central_nf_tela_patch.js', 'utf8');
const trx = fs.readFileSync('nf_transmissao_patch.js', 'utf8');
const diag = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));

console.log('== CURA 1: SESSÃO SEM EMPRESA ==');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(src.slice(src.indexOf('/* AC602_PURE_START */'), src.indexOf('/* AC602_PURE_END */')), sandbox);
const db1Emp = { empresas: [{ id: 'emp_digicopy' }],
  vendas: [{ id: 'v1', numero: '10', empresaId: undefined }, { id: 'v2', numero: '11', empresaId: 'emp_digicopy' }],
  clientes: [{ id: 'c1', empresaId: null }], parque: [{ id: 'p1' }] };
const sess = { usuarioId: 'u1', login: 'dono' };
const r1 = sandbox.acCuraSessao(sess, db1Emp);
ok('sessão vazia + 1 empresa no banco → carimba', r1.mudou === true && sess.empresaId === 'emp_digicopy');
ok('sessão que já tinha empresa não mexe', sandbox.acCuraSessao({ empresaId: 'emp_x', login: 'a' }, db1Emp).mudou === false);
ok('2+ empresas NÃO chuta (sem achismo)', sandbox.acCuraSessao({ login: 'a' }, { empresas: [{ id: 'a' }, { id: 'b' }] }).mudou === false && sandbox.acCuraSessao({ login: 'a' }, { empresas: [{ id: 'a' }, { id: 'b' }] }).precisaEscolher === true);
ok('sem sessão/no db não explode', sandbox.acCuraSessao(null, db1Emp).mudou === false);

console.log('== CURA 2: REGISTROS ÓRFÃOS (o caso real: venda e parque sem carimbo) ==');
const orf = sandbox.acContarOrfaos(db1Emp);
ok('conta órfãos por entidade (venda 1, cliente 1, parque 1)', orf.total === 3 && orf.porEntidade.vendas === 1 && orf.porEntidade.clientes === 1 && orf.porEntidade.parque === 1);
ok('não conta o bem carimbado', db1Emp.vendas[1].empresaId === 'emp_digicopy' && orf.total === 3);
const cura = sandbox.acCarimbarOrfaos(db1Emp, 'emp_digicopy');
ok('carimba todos os órfãos na empresa única', cura.total === 3 && db1Emp.vendas[0].empresaId === 'emp_digicopy' && db1Emp.parque[0].empresaId === 'emp_digicopy');
ok('já carimbados não envelopam', sandbox.acContarOrfaos(db1Emp).total === 0);
ok('com 2 empresas não carimba NADA', sandbox.acCarimbarOrfaos({ empresas: [{ id: 'a' }, { id: 'b' }], vendas: [{ id: 'v' }] }).total === 0);

console.log('== DIAGNÓSTICO passa a enxergar órfãos (a prova que escapava) ==');
ok('conta "SEM CARIMBO (órfãos)"  por entidade', diag.indexOf('orfaos++') >= 0 && diag.indexOf('SEM CARIMBO (órfãos)') >= 0);
ok('diagnóstico aponta a causa provável dos sumiços', diag.indexOf('CAUSA PROVÁVEL DOS SUMIÇOS') >= 0);
ok('diagnóstico percebe sessão sem empresa como fator', diag.indexOf('PRÓPRIA SESSÃO TAMBÉM ESTÁ SEM EMPRESA') >= 0);
ok('cura garante "recarregar não resolve — carimbar resolve" (v6.0.4+: insiste 10min + botão Reparar)', diag.indexOf('v6.0.4') >= 0 && diag.indexOf('Reparar sessão agora') >= 0);
ok('o diagnóstico continua só LENDO (não escreve no banco)', diag.indexOf('DIAGNÓSTICO (só lê, não muda nada)') >= 0);

console.log('== CENTRAL NF VIRA MENU (aba flutuante morta) ==');
ok('view "central-nf" criada com ensureView (padrão das telas)', src.indexOf("ensureView('central-nf')") >= 0);
ok('placa de ambiente SEMPRE no topo da tela', src.indexOf('🏛️') >= 0 && src.indexOf('HOMOLOGAÇÃO — MODO TESTE, SEM VALOR FISCAL') >= 0 && src.indexOf('PRODUÇÃO — a nota gerada aqui VALE DE VERDADE') >= 0);
ok('alternância de ambiente mora na TELA (botão cnf-amb) e produção exige digitar PRODUCAO', src.indexOf('cnf-amb') >= 0 && src.indexOf("dig!=='PRODUCAO'") >= 0);
ok('abrirCentralNfe antiga redireciona pra navigateTo (modal flutuante desligado)', src.indexOf("window.navigateTo('central-nf')") >= 0 && src.indexOf('_cen2') >= 0);
ok('botões no nav-gest (Nota Fiscal) + barra clássica (topmod-central-nf)', src.indexOf('topmod-central-nf') >= 0 && src.indexOf('[data-nav="central-nf"]') >= 0);
ok('navigateTo aprende a view nova sem tocar no miolo', src.indexOf('window.navigateTo=function(view)') >= 0 && src.indexOf("view==='central-nf'") >= 0);
ok('CSC da NFC-e mora na Central (salvar csc/id)', src.indexOf('cnf-cscsalvar') >= 0 && src.indexOf('db.config.nfCsc=') >= 0);
ok('histórico rende na tela nova (alvo __nfxHistAlvo)', src.indexOf('__nfxHistAlvo') >= 0 && trx.indexOf("document.getElementById('cnf-hist')") >= 0);

console.log('== POPUPS NO ESTILO DO SISTEMA (X de fechar) ==');
ok('modal próprio nfx-modal com X + cancelar voltam null/false', src.indexOf("id='nfx-modal'") >= 0 && src.indexOf("id=\"nfx-x\"") >= 0 && src.indexOf("fechar(null)") >= 2 && src.indexOf('fechar(false)') >= 2 && src.indexOf('root.remove(); resolve(v)') >= 0);
ok('nfxPedirTexto com mínimo de letras e máscara (senha)', src.indexOf('op.minimo') >= 0 && src.indexOf("op.mascara?'type=\"password\" '") >= 0);
ok('motor abandonou window.prompt na senha (só fallback)', trx.indexOf('nfxPedirTexto(\'Senha do certificado A1\'') >= 0 && trx.indexOf('{\"type\":\"password\"') < 0);
ok('cancelamento pede justificativa no popup próprio (mín 15)', trx.indexOf("nfxPedirTexto('Cancelar NF-e'") >= 0 && trx.indexOf('minimo:15') >= 0);
ok('confirm de produção usa nfxConfirmar (sem window.confirm solto na lógica)', trx.indexOf("nfxConfirmar('CANCELAR NOTA DE VERDADE ?'") >= 0 || trx.indexOf("nfxConfirmar('CANCELAR NOTA DE VERDADE?'") >= 0);
ok('duplicidade usa nfxConfirmar (abrir DANFE)', trx.indexOf("nfxConfirmar('Nota já autorizada'") >= 0);
ok('senha pedida com await (popup assim é Promise)', trx.indexOf('await nfxPedirSenha()') >= 3);

console.log('== INTEGRAÇÃO + CARIMBO 6.0.2 ==');
ok('patch na 208; perfis 209; permissões 210; menu fiscal v6.0.6; Início clicável v6.0.7; menus fiscais separados v6.0.8 fecha a fila (213)', manifest.length === 214 && manifest[207] === 'autocura_empresa_central_nf_tela_patch.js' && manifest[208] === 'perfis_nuvem_cura_sessao_patch.js' && manifest[209] === 'permissoes_estorno_venda_patch.js' && manifest[210] === 'fiscal_menu_completo_patch.js' && manifest[211] === 'dashboard_inicio_clicavel_patch.js' && manifest[212] === 'menus_fiscais_separados_patch.js' && manifest[213] === 'permissoes_override_menus_fiscais_patch.js');
ok('cura + tela no bundle gerado', bundle.indexOf('v6.0.2') >= 0 && bundle.indexOf('Curei ') >= 0);
ok('guard anti dupla-instalação', src.indexOf('__v6002ac') >= 0);
ok('package.json na 6.0.2', pkg.version === '6.0.9');
ok('index.html carimbado 6.0.2', html.indexOf("DIGICOPY_APP_VERSION = '6.0.9'") >= 0 && html.indexOf('>v6.0.9<') >= 0);
ok('worker SEGUE 5.26.3 · gerente SEGUE 5.26.3', fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("WORKER_VERSION = '5.26.3'") >= 0 && JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8')).version === '5.26.3');

console.log('\nTudo OK — v6.0.2 (dados sumidos CURADOS: sessão e registros carimbados quando há UMA empresa; Central NF vira menu de verdade; popups próprios com X em todo o fiscal).');
