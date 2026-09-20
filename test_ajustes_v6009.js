// test_ajustes_v6009.js — v6.0.9: PERMISSÃO SÓ NO EDITAR (coluna solta morta)
// + AUTORIZAÇÃO NA HORA (override login+senha de quem tem permissão)
// + MENUS FISCAIS DE VERDADE (Histórico, Status & Pacote, Inutilizar Faixa)
const fs = require('fs');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const src = fs.readFileSync('permissoes_override_menus_fiscais_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');
const P = require('./permissoes_override_menus_fiscais_patch.js');

const usuarios = [
  { id: '1', login: 'kauan', senha: '123', perfil: 'Admin', empresaId: 'e1', nome: 'Kauan' },
  { id: '2', login: 'katia', senha: '456', perfil: 'Comercial', empresaId: 'e1', nome: 'Katia', podeApagar: false, podeEstornar: false },
  { id: '3', login: 'recepcao', senha: '789', perfil: 'Comercial', empresaId: 'e1', nome: 'Recepção', podeApagar: true, podeEstornar: false, podeEmitirNfe: true },
  { id: '4', login: 'outro', senha: '789', perfil: 'Comercial', empresaId: 'e2', nome: 'Outra Empresa' }
];
const pode = (u, a) => { if (u.perfil === 'Admin' || u.perfil === 'Dono') return true; if (a === 'apagar') return u.podeApagar === undefined ? true : !!u.podeApagar; if (a === 'estornar') return u.podeEstornar === undefined ? true : !!u.podeEstornar; if (a === 'emitirNfe') return !!u.podeEmitirNfe; return false; };

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 214; override+menus fecha a fila',
  man.length === 222 && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[212] === 'menus_fiscais_separados_patch.js' && man[211] === 'dashboard_inicio_clicavel_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (PURE + banner)',
  bundle.indexOf('POM609_PURE_START') >= 0 && bundle.indexOf('v6.0.9 — PERMISSÃO SÓ NO EDITAR + AUTORIZAÇÃO NA HORA') >= 0);

console.log('== COLUNA SOLTA MORTA (ordem 1: permitir só no editar) ==');
ok('caça e REMOVE data-nfe-col / data-nfe-cell (o injetor velho da v5.22.21)',
  src.indexOf("querySelectorAll('[data-nfe-col],[data-nfe-cell]')") >= 0 && src.indexOf('el.remove()') >= 0);
ok('só atua com a tela Usuários visível + re-roda num wrap do renderUsuarios',
  src.indexOf("getElementById('view-usuarios')") >= 0 && src.indexOf('offsetParent===null') >= 0 && src.indexOf('window.renderUsuarios=embrRu') >= 0);
ok('caça também na sonda (menu redesenha depois do login)',
  src.indexOf('pomLimparColunaPermissao();') >= 0);

console.log('== AUTORIZAÇÃO NA HORA (ordem 2) ==');
ok('popup do SISTEMA com Login+Senha (mesmo padrão visual dos avisos)',
  src.indexOf('pom-aut-login') >= 0 && src.indexOf('pom-aut-senha') >= 0 && src.indexOf('Peça a um usuário que') >= 0 && src.indexOf('z-index:2147483200') >= 0);
ok('texto pedido por ele: login e senha pra realizar essa ação',
  src.indexOf('login e a senha') >= 0 && src.indexOf('realizar esta ação') >= 0);
ok('re-embrulho cobre os MESMOS 11 executores do gate da v6.0.5',
  src.indexOf("'excluirVendaUnificado'") >= 0 && src.indexOf("'excluirOrcamentosMarcados'") >= 0 && src.indexOf("'removerLancamentoLeitura'") >= 0 && src.indexOf("'estornarNotinha'") >= 0 && src.indexOf("'estornarLeituraContrato'") >= 0);
ok('token de 3 segundos converge os dois gates (novo + velho)',
  src.indexOf('__p609AutorizadoAte=Date.now()+3000') >= 0 && src.indexOf('window.usuarioPodeApagar=function(){ return (window.__p609AutorizadoAte>Date.now())') >= 0);
ok('auditoria dos DOIS lados: override-autorizado e override-cancelado',
  src.indexOf("'override-autorizado'") >= 0 && src.indexOf("'override-cancelado'") >= 0 && src.indexOf('AUTORIZADO por') >= 0);
ok('valida Admin/Dono sempre; funcionário só com a caixa marcada; empresa da sessão; senha',
  P.pomValidaAutorizacao(usuarios, 'e1', 'kauan', '123', 'apagar', pode).ok === true &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'katia', '456', 'estornar', pode).ok === false &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'recepcao', '789', 'apagar', pode).ok === true &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'outro', '789', 'apagar', pode).motivo.indexOf('não encontrado') >= 0 &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'kauan', '999', 'apagar', pode).motivo.indexOf('Senha não confere') >= 0);
ok('login maiúsculo/minúsculo tanto faz; vazio/aviso amigável em todos os casos',
  P.pomValidaAutorizacao(usuarios, 'e1', 'KAUAN', '123', 'apagar', pode).ok === true &&
  P.pomValidaAutorizacao(usuarios, 'e1', '', 'x', 'apagar', pode).motivo.indexOf('Informe o login') >= 0 &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'kauan', '', 'apagar', pode).motivo.indexOf('Informe a senha') >= 0);
ok('emitirNfe também passa pela autorização (inutilizar faixa)',
  P.pomValidaAutorizacao(usuarios, 'e1', 'recepcao', '789', 'emitirNfe', pode).ok === true &&
  P.pomValidaAutorizacao(usuarios, 'e1', 'katia', '456', 'emitirNfe', pode).ok === false &&
  src.indexOf("'emitirNfe'") >= 0);

console.log('== MENUS FISCAIS DE VERDADE (ordem 3: "urgente") ==');
ok('5 entradas fiscais: Nota Fiscal + Histórico + Status & Pacote + Inutilizar + Config',
  src.indexOf("view:'central-nf'") >= 0 && src.indexOf("view:'fiscal-historico'") >= 0 && src.indexOf("view:'fiscal-ferramentas'") >= 0 && src.indexOf("view:'fiscal-inutilizar'") >= 0 && src.indexOf("view:'config-fiscal'") >= 0);
ok('cada uma vira botão na nav lateral E módulo na barra clássica',
  src.indexOf('btn.setAttribute(\'data-nav\',m.view)') >= 0 && src.indexOf("'{view:'fiscal-historico'".slice(1)) >= 0 && src.indexOf("topmod-'+m.view") >= 0 && src.indexOf("classic-toolbar-scroll") >= 0);
ok('histórico em TELA PRÓPRIA: mesmo motor (nfxRenderHistorico) + CC-e incluso via window.nfCartaCorrecao',
  src.indexOf('__nfxHistAlvo') >= 0 && src.indexOf('nfxRenderHistorico') >= 0 && src.indexOf('nfCartaCorrecao') >= 0 && src.indexOf('pom-hist') >= 0);
ok('Status & Pacote: chama nfStatusServico/nfPacoteContador globais (sem duplicar motor)',
  src.indexOf('window.nfStatusServico()') >= 0 && src.indexOf('window.nfPacoteContador()') >= 0);
ok('Inutilizar: formulário modelo/série/inicial/final + guard de emitir NF + override',
  src.indexOf('pom-in-modelo') >= 0 && src.indexOf('nfInutilizarFaixa') >= 0 && src.indexOf('pomPodeEmitir') >= 0 && src.indexOf('usuarioPodeEmitirNfe') >= 0);
ok('placa de ambiente no topo das 3 telas novas (HOMOLOGAÇÃO vermelha/PRODUÇÃO verde)',
  (src.split('pomAmbTxt()').length - 1) >= 4 && src.indexOf('HOMOLOGAÇÃO — modo teste') >= 0);

console.log('== CARIMBO 6.0.9 ==');
ok('package.json na 6.0.9', pkg.version === '6.1.3');
ok('index.html carimbado', html.indexOf("DIGICOPY_APP_VERSION = '6.1.3'") >= 0 && html.indexOf('>v6.1.3<') >= 0 && html.indexOf('app.bundle.js?v=6.1.3') >= 0);
ok('celular carimbado 6.0.9', mob.indexOf("DIGICOPY_APP_VERSION = '6.1.3'") >= 0 && mob.indexOf('>v6.1.3<') >= 0);

console.log('');
console.log(pass + ' passaram, ' + fail + ' falharam');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.9: checkbox de permissão só existe dentro do editor; quem não pode, recebe o popup pedindo login+senha de quem pode (auditado); fiscal com menu pra cada coisa.');
