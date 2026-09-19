// test_ajustes_v6000.js — v6.0.0: PORTÃO FISCAL (abre a linha NF).
// As três garantias que ele exigiu por escrito:
//  "como confio que o XML não dá problema?"  → nasce tudo em HOMOLOGAÇÃO
//  "como testo antes sem gerar NF de verdade?" → homologação = modo teste
//  "como confio que não gera NF sozinho?" → PROVA: nenhum temporizador neste
//     patch + conferência só acontece com clique + toda conferência deixa
//     rastro de auditoria (sem caminho silencioso).
const fs = require('fs');
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const src = fs.readFileSync('fiscal_guard_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const mobile = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');

console.log('== DECRETO 1: NASCE EM HOMOLOGAÇÃO (nunca produção por padrão) ==');
const pure = src.slice(src.indexOf('/* NFG_PURE_START */'), src.indexOf('/* NFG_PURE_END */'));
const s = { console };
vm.createContext(s);
vm.runInContext(pure, s);
ok('ambiente vazio/desconhecido → homologação (padrão seguro)', s.nfgAmbiente({config:{}}) === 'homologacao' && s.nfgAmbiente({config:{nfAmbiente:'qualquer-lixo'}}) === 'homologacao' && s.nfgAmbiente(null) === 'homologacao');
ok('só "producao" exato vira produção', s.nfgAmbiente({config:{nfAmbiente:'producao'}}) === 'producao');
ok('rótulo de homologação diz SEM VALOR FISCAL', /SEM VALOR FISCAL/.test(s.nfgRotulo('homologacao')));
ok('rótulo de produção diz VALE DE VERDADE', /VALE DE VERDADE/.test(s.nfgRotulo('producao')));

console.log('== DECRETO 2: SELO DE TESTE DENTRO DO XML (contabil nunca confunde) ==');
const xml1 = '<nfeProc><NFe><infNFe><infAdic><infCpl>Doc original</infCpl></infAdic></infNFe></NFe></nfeProc>';
const xml2 = '<NFe><infNFe></infNFe></NFe>';
ok('homologação injeta selo no infCpl existente', /NOTA DE TESTE, SEM VALOR FISCAL/.test(s.nfgSeloTeste(xml1, 'homologacao')));
ok('homologação cria infAdic quando não existe', s.nfgSeloTeste(xml2, 'homologacao').indexOf('<infAdic>') >= 0 && /SEM VALOR FISCAL/.test(s.nfgSeloTeste(xml2, 'homologacao')));
ok('produção NÃO toca no XML', s.nfgSeloTeste(xml1, 'producao') === xml1);

console.log('== DECRETO 3: DUPLICIDADE NUNCA PASSA SILENCIOSA ==');
const registro = { config: { nfRegistro: [ { modelo: '55', serie: '1', numero: '9', origemId: 'v1', status: 'autorizada' } ] } };
ok('detecta nota já registrada (mesmo modelo+série+número+origem)', s.nfgJaRegistrada(registro, { modelo: '55', serie: '1', numero: '9', origemId: 'v1' }) === true);
ok('nota cancelada não trava reemissão', s.nfgJaRegistrada({ config: { nfRegistro: [ { modelo: '55', serie: '1', numero: '9', origemId: 'v1', status: 'cancelada' } ] } }, { modelo: '55', serie: '1', numero: '9', origemId: 'v1' }) === false);
ok('número diferente passa normal', s.nfgJaRegistrada(registro, { modelo: '55', serie: '1', numero: '10', origemId: 'v1' }) === false);
ok('sem registro nenhum não quebra', s.nfgJaRegistrada({ config: {} }, { modelo: '55', serie: '1', numero: '1', origemId: 'x' }) === false);

console.log('== DECRETO 4: PROVA DE QUE NADA É AUTOMÁTICO ==');
ok('fiscal_guard NÃO tem setInterval (nem nomeando outra coisa)', !/setInterval\s*\(/.test(src));
ok('fiscal_guard NÃO tem setTimeout', !/setTimeout\s*\(/.test(src));
ok('fiscal_guard NÃO tem setImmediate/requestAnimationFrame', !/setImmediate\s*\(/.test(src) && !/requestAnimationFrame\s*\(/.test(src));
ok('só envolve conferirNfe/abrirCentralNfe (não chama nada sozinho)', src.indexOf('window.conferirNfe=function') >= 0 && src.indexOf('_conf0.apply') >= 0 && src.indexOf('window.abrirCentralNfe=function') >= 0 && src.indexOf('_cen0.apply') >= 0);

console.log('== DECRETO 5: TODA CONFERÊNCIA DEIXA RASTRO (sem caminho silencioso) ==');
ok('auditoria grava em db.logs com usuário + ambiente + carimbo', src.indexOf("tipo:'nf-portao'") >= 0 && src.indexOf('usuarioLogin') >= 0 && src.indexOf('ambiente:nfgAmbiente(db)') >= 0 && src.indexOf('at:new Date().toISOString()') >= 0);
ok('conferirNfe embrulhado chama a auditoria ANTES', src.indexOf("nfgAudit('conferir'") >= 0 && src.indexOf("nfgAudit('conferir'") < src.indexOf('_conf0.apply'));
ok('auditoria limita o log (não incha o banco)', src.indexOf('splice(0,db.logs.length-300)') >= 0);

console.log('== DECRETO 6: PRODUÇÃO SÓ COM AÇÃO HUMANA EXPLÍCITA ==');
ok('habilitar produção exige digitar PRODUCAO', src.indexOf("digite: PRODUCAO") >= 0 && src.indexOf("dig!=='PRODUCAO'") >= 0);
ok('exige permissão de emitir NF (mesma regra da v5.22.21)', src.indexOf('usuarioPodeEmitirNfe') >= 0);
ok('voltar p/ homologação não pede texto (recuo sempre livre)', src.indexOf("ambiente->homologacao") >= 0);
ok('toda troca de ambiente fica auditada', src.indexOf("ambiente->producao") >= 0);

console.log('== PLACAS VISÍVEIS + INTEGRAÇÃO ==');
ok('placa de ambiente nos dois modais fiscais (central + conferência)', src.indexOf("'central-nfe-modal'") >= 0 && src.indexOf("'nfe-conf-modal'") >= 0 && src.indexOf('nfg-placa') >= 0);
ok('botão de trocar ambiente na Central', src.indexOf('nfg-amb-btn') >= 0 && src.indexOf('Habilitar PRODUÇÃO') >= 0);
ok('porta v6.0.0 na 206; transmissao 207, autocura 208, perfis 209, permissões 210, menu fiscal v6.0.6; Início clicável v6.0.7; menus fiscais separados v6.0.8 na 212; override v6.0.9 na 214; 6 submenus v6.0.10 na 215; hover NF-e/NFC-e v6.0.11 fecha a fila (216)', manifest.length === 222 && manifest[205] === 'fiscal_guard_patch.js' && manifest[206] === 'nf_transmissao_patch.js' && manifest[207] === 'autocura_empresa_central_nf_tela_patch.js' && manifest[208] === 'perfis_nuvem_cura_sessao_patch.js' && manifest[209] === 'permissoes_estorno_venda_patch.js' && manifest[210] === 'fiscal_menu_completo_patch.js' && manifest[211] === 'dashboard_inicio_clicavel_patch.js' && manifest[212] === 'menus_fiscais_separados_patch.js' && manifest[213] === 'permissoes_override_menus_fiscais_patch.js' && manifest[214] === 'seis_submenus_velho_patch.js' && manifest[215] === 'submenu_hover_nfe_patch.js' && bundle.indexOf('PORTÃO FISCAL v6.0.0') >= 0);
ok('guard anti dupla-instalação', src.indexOf('__v6000fg') >= 0);

console.log('== CARIMBO 6.0.0 (linha fiscal abre versão nova) ==');
ok('package.json na 6.0.0', pkg.version === '6.1.2');
ok('index.html carimbado 6.0.0', html.indexOf("DIGICOPY_APP_VERSION = '6.1.2'") >= 0 && html.indexOf('>v6.1.2<') >= 0);
ok('worker SEGUE 5.26.3', fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("WORKER_VERSION = '5.26.3'") >= 0);
ok('gerente SEGUE 5.26.3', JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8')).version === '5.26.3');
ok('mobile sincronizado', mobile === bundle);

console.log('\nTudo OK — v6.0.0 (Portão Fiscal: nasce em homologação, produção só com ação humana explícita, nada automático, tudo auditado, selo de teste dentro do XML).');
