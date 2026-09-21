// ═══════════════════════════════════════════════════════════════════════════
// TESTE v6.1.4 — AS CORREÇÕES DO RELATÓRIO DO KAUAN (21/09/2026)
//
// O relatório respondido dele trouxe: 15 OK · 2 não resolveu · 8 não testei.
// Este teste trava cada correção feita em cima do que ele apontou, para nenhum
// destes casos voltar:
//   D1 — "que permissões são essas?"        → explicação + botão de ajuda
//   D2 — aviso "Refazendo a notinha"        → REMOVIDO (pedido expresso)
//   C5 — ação fiscal "no log, não na auditoria" → agora vai para a Auditoria
//   C6 — "pede data novamente" + "que gmail vai enviar isso?" → mês reaproveitado + aviso honesto
//   C7 — "Falha ao assinar: Envie o certificado A1" → confere ANTES e orienta em popup
//   B9/observações — diagnóstico "A CAUSA ESTÁ AQUI" com tudo visível (alarme falso)
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const { JSDOM } = require('jsdom');

let falhas = 0;
function ok(cond, msg){ if(cond) console.log('  ✔ ' + msg); else { falhas++; console.error('  ✘ ' + msg); } }

const perm  = fs.readFileSync('permissoes_estorno_venda_patch.js', 'utf8');
const diag  = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');
const guard = fs.readFileSync('fiscal_guard_patch.js', 'utf8');
const fmc   = fs.readFileSync('fiscal_menu_completo_patch.js', 'utf8');
const fx    = fs.readFileSync('fiscal_catalogo_completo_patch.js', 'utf8');
const aud   = fs.readFileSync('ajustes_v5197_patch.js', 'utf8');
const bundle= fs.readFileSync('app.bundle.js', 'utf8');
const escuro = fs.readFileSync('navegacao_fiscal_barra_escuro_patch.js', 'utf8');
const relHtml = fs.readFileSync('RELATORIO_DE_TESTE_NF.html', 'utf8');
const man   = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));

console.log('== D2 — o aviso que ele mandou tirar ==');
ok(perm.indexOf('p605-banner-refazer') < 0, 'o banner amarelo da notinha não é mais criado em nenhum caminho do código');
ok(perm.indexOf('Refazendo a notinha') < 0, 'o texto do aviso saiu de vez (nada de sobra para reaparecer)');
ok(perm.indexOf('PEDIDO DO DONO') >= 0 && perm.indexOf('REMOVIDO') >= 0, 'o motivo da remoção ficou registrado no arquivo');

console.log('== D1 — "que permissões são essas?" ==');
ok(perm.indexOf('PERMISSÕES DO USUÁRIO — em língua de gente') >= 0, 'explicação em língua de gente criada');
ok(perm.indexOf('As 3 caixas são EXTRAS') >= 0, 'deixa claro que as caixas são extras (não tiram o que o usuário já faz)');
ok(perm.indexOf('p605-ajuda-perm') >= 0 && perm.indexOf('permissoesAjuda') >= 0, 'botão de ajuda na tela Usuários (não depende de abrir o lápis do usuário)');
ok(perm.indexOf('Emitir NF (nota fiscal)') >= 0 && perm.indexOf('Apagar registros') >= 0 && perm.indexOf('Estornar registros') >= 0, 'as 3 permissões seguem existindo com nome claro');

console.log('== C5 — ação fiscal tem que aparecer na AUDITORIA ==');
ok(guard.indexOf('nfAuditarFiscal') >= 0, 'gravador de auditoria fiscal criado no módulo fiscal');
ok(guard.indexOf("logAction('fiscal'") >= 0, 'usa o logAction do sistema (mesmo formato da Auditoria)');
ok(guard.indexOf('relatório dele, C5') >= 0 || guard.indexOf('RELATÓRIO DELE (21/09/2026, pergunta C5)') >= 0, 'o motivo (relato C5) ficou registrado');
ok(guard.indexOf('empresaId:s.empresaId') >= 0, 'o log técnico também ganha empresaId (sem isso a tabela não mostra)');
ok(fmc.indexOf('nfAuditarFiscal') >= 0, 'as ações do menu fiscal (CC-e, SEFAZ, pacote) também auditam');
ok(aud.indexOf('v5197SanearLogs') >= 0 && aud.indexOf('renderAuditoria') >= 0, 'tela de Auditoria saneia os logs antes de desenhar (log torto não quebra mais a tela)');
ok(aud.indexOf("emps.length===1") >= 0, 'sessão sem empresa só é carimbada com EXATAMENTE 1 empresa no banco (regra segura de sempre)');

console.log('== C6 — pacote do contador: mês reaproveitado + aviso honesto ==');
ok(fmc.indexOf('window.nfPacoteContador=async function(mesJaEscolhido, opcoes)') >= 0, 'o gerador aceita o mês já escolhido');
ok(fmc.indexOf('/^\\d{4}-\\d{2}$/.test(jaVem)') >= 0, 'aceita AAAA-MM (formato da matriz da tela) sem perguntar de novo');
ok(fmc.indexOf('Mês das notas (MM/AAAA)') >= 0, 'sem mês escolhido (botão da Central), continua perguntando como antes');
ok(fx.indexOf('G.nfPacoteContador(G.__fxXmlMes') >= 0, '"Enviar para Escritório" passa o mês da tela (não pergunta duas vezes)');
ok(fx.indexOf('não envia e-mail por você') >= 0 && fx.indexOf('envio automático de e-mail ainda não existe') >= 0, 'aviso honesto: o sistema NÃO manda e-mail (nem usa o Gmail dele)');
ok(fx.indexOf('mail.google.com/mail/?view=cm') >= 0, 'atalho opcional "Abrir meu Gmail para escrever" (quem quiser usa o próprio Gmail)');
ok(fx.indexOf('fxXmlCopiarEmail') >= 0, 'botão copiar o e-mail do contador dentro do popup');

console.log('== C7 / C3 / C4 — sem certificado A1, orientar em vez de "falha ao assinar" ==');
ok(fmc.indexOf('Falta o certificado A1') >= 0, 'popup de orientação criado');
ok(fmc.indexOf('sem-certificado') >= 0, 'a tentativa sem certificado entra na Auditoria como bloqueio (não como erro)');
ok(fmc.indexOf('ponte.status') >= 0, 'confere o certificado ANTES de pedir senha/assinar');
ok(fmc.indexOf('a senha do') >= 0 && fmc.indexOf('NÃO fica salva') >= 0, 'relembra que a senha é pedida na hora e não fica salva');

console.log('== B9 / observações — fim do alarme falso do diagnóstico ==');
ok(diag.indexOf('temDadoEscondido') >= 0, 'diagnóstico mede se existe dado escondido de verdade antes de acusar');
ok(diag.indexOf('NADA QUEBRADO AQUI') >= 0, 'quando está tudo visível, avisa que está tudo bem (sem drama)');
ok(diag.indexOf("alvoSess.empresaId||alvoSess.empresa") >= 0, 'lê a empresa da sessão nos dois nomes possíveis (empresaId e empresa)');
ok(diag.indexOf('A CAUSA ESTÁ AQUI EM CIMA') >= 0, 'o aviso dramático continua existindo — mas só quando há dado escondido');
ok(diag.indexOf('DIAGNÓSTICO (só lê, não muda nada)') >= 0, 'o diagnóstico continua SÓ LENDO (regra de sempre)');

console.log('== Nada disso pesa na abertura do sistema ==');
ok(man.indexOf('.github') < 0 && man.indexOf('publicar-motor') < 0 && man.indexOf('deploy_github_actions') < 0, 'botão de deploy (arquivo do GitHub) não entra no bundle do sistema');
ok(bundle.indexOf('nfAuditarFiscal') >= 0 && bundle.indexOf('NADA QUEBRADO AQUI') >= 0, 'bundle já tem as correções (rodar npm run bundle antes de entregar)');

console.log('== O botão de deploy existe e é manual (sem susto na nuvem da loja) ==');
const wf = fs.readFileSync('deploy_github_actions/publicar-motor.yml', 'utf8');
ok(wf.indexOf('COMO INSTALAR ESTE BOTÃO') >= 0, 'o arquivo explica como colar no GitHub (Actions → New workflow)');
ok(wf.indexOf('workflow_dispatch') >= 0, 'deploy só roda quando o dono aperta o botão');
ok(wf.indexOf('on:') >= 0 && wf.indexOf('push:') < 0, 'NÃO publica sozinho em push (sem surpresa na nuvem real)');
ok(wf.indexOf('d1 migrations apply DB --remote') >= 0 && wf.indexOf('wrangler@4 deploy') >= 0, 'faz os mesmos 2 passos do atualizar_motor_nuvem.cmd');
ok(wf.indexOf('secrets.CLOUDFLARE_API_TOKEN') >= 0 && wf.indexOf('secrets.CLOUDFLARE_ACCOUNT_ID') >= 0, 'usa segredos do GitHub (nada de token no código)');

console.log('== A3 (foto dele) — tabela fiscal ilegível no modo escuro ==');
ok(escuro.indexOf('table.fx-tb{ background:#0b1337') >= 0, 'a TABELA inteira fica escura (antes só a moldura; o fundo branco do claro dominava)');
ok(escuro.indexOf('.fx-tb tbody tr{ background:#0e1a48') >= 0, 'TODA linha tem fundo escuro (era só nas pares: as ímpares ficavam brancas com texto claro)');
ok(escuro.indexOf('tr:nth-child(even){ background:#101f55') >= 0, 'as linhas pares seguem um tom acima (zebra continua visível)');
ok(escuro.indexOf('.fx-tb tbody tr:hover') >= 0 && escuro.indexOf('.fx-sel{ background:#1d3a9e') >= 0, 'hover e linha selecionada continuam marcando');
ok(escuro.indexOf('.fx-tb .fx-btn{ background:#22307a') >= 0, 'botão da linha (Alterar/Excluir) ganha contraste no escuro');
ok(escuro.indexOf('FOTO DO DONO (21/09/2026, item A3)') >= 0, 'o motivo (a foto dele) ficou registrado no arquivo');

console.log('== A causa do "(nenhuma?!)" em TODO computador ==');
ok(diag.indexOf("const getS=(typeof getSession==='function')?getSession()") >= 0, 'diagnóstico passa a usar getSession() direto (sess() não existe neste módulo)');
ok(diag.indexOf("const alvoSess=getS;") >= 0, 'a sessão real é a que o sistema tem de verdade (e não mais null fixo)');
ok(diag.indexOf('SEM EMPRESA — a cura carimba sozinha') >= 0, 'quando faltar carimbo, o texto explica em vez de gritar "(nenhuma?!)"');
ok(diag.indexOf('Sessão deste computador: ') >= 0 && diag.indexOf('Versão deste sistema: ') >= 0, 'o diagnóstico mostra quem está logado e a versão do sistema');
ok(diag.indexOf('Para comparar com outro computador') >= 0, 'ensina a comparar com outro PC (é assim que se acha diferença de dados)');

console.log('== Certificado A1 instalado DENTRO do sistema (pedido dele) ==');
ok(fmc.indexOf('window.nfInstalarCertificado') >= 0, 'função de instalar o A1 criada no módulo fiscal');
ok(fmc.indexOf('📎 Instalar certificado A1 (neste PC)') >= 0, 'botão na Central de Nota Fiscal');
ok(fmc.indexOf('ponte.importar()') >= 0, 'usa a janelinha do Windows (mesmo caminho do sistema antigo)');
ok(fmc.indexOf('certificado-instalado') >= 0, 'instalação entra na Auditoria');
ok(fmc.indexOf('NÃO fica salva') >= 0, 'relembra que a senha não fica salva');
ok(fmc.indexOf('Clique no botão «📎 Instalar certificado A1 (neste PC)»') >= 0, 'o aviso do Testar SEFAZ aponta o botão novo (sem obrigar a página de arquivos)');
ok(fs.readFileSync('main.js','utf8').indexOf("ipcMain.handle('nfe:cert-import'") >= 0, 'o programa (.exe) já sabia receber o .pfx — agora tem botão na tela');

console.log('== O código do deploy dentro do relatório (copiar) ==');
ok(relHtml.indexOf('btn-copiar-deploy') >= 0 && relHtml.indexOf('codigo-deploy') >= 0, 'seção com o código e o botão de copiar');
ok(relHtml.indexOf('d1 migrations apply DB --remote') >= 0 && relHtml.indexOf('Run workflow') >= 0, 'o código e o passo a passo estão na página');

// ═══════════════════════════════════════════════════════════════════════════
// A BARRA DE MENUS — reprodução do bug dele em jsdom (foto de 21/09/2026):
// "estou num menu e mostra outro menu selecionado na barra azul".
// ═══════════════════════════════════════════════════════════════════════════
async function testarBarraDeMenus(){
  console.log('\n== BARRA DE MENUS: o marcado é o módulo da TELA (bug dele) ==');
  const patch = fs.readFileSync('navegacao_fiscal_barra_escuro_patch.js', 'utf8');
  const html =
    '<div class="module-row">' +
      '<div class="module" id="m-prod"><button onclick="navigateTo(\'produtos\')">Produtos</button></div>' +
      '<div class="module" id="m-loc"><button onclick="navigateTo(\'contratos\')">Locação</button>' +
        '<div class="module-menu"><button onclick="navigateTo(\'contratos\')">Contratos</button>' +
        '<button onclick="navigateTo(\'impressoras\')">Impressoras</button></div></div>' +
      '<div class="module" id="m-fis"><button onclick="navigateTo(\'central-nf\')">Fiscal</button></div>' +
    '</div>' +
    '<section id="view-produtos" class="view"></section>' +
    '<section id="view-contratos" class="view hidden"></section>' +
    '<section id="view-impressoras" class="view hidden"></section>' +
    '<section id="view-central-nf" class="view hidden"></section>';
  const dom = new JSDOM(
    html +
    '<script>window.navigateTo=function(v){document.querySelectorAll(".view").forEach(function(s){s.classList.add("hidden");});' +
    'var el=document.getElementById("view-"+v); if(el) el.classList.remove("hidden");};</script>' +
    '<script>' + patch + '</script>',
    { runScripts: 'dangerously', url: 'https://teste-60f.pages.dev/' });
  const d = dom.window.document;
  const espera = ms => new Promise(r => setTimeout(r, ms));
  await espera(120);
  await espera(300);

  const ativo = () => { const el = d.querySelector('.module.sfo-ativo'); return el ? el.id : ''; };
  const pinados = () => d.querySelectorAll('.module.sfo-pin, .module-menu.sfo-pin').length;

  ok(ativo() === 'm-prod', 'abriu em Produtos -> quem fica marcado e PRODUTOS');
  ok(pinados() === 0, 'nenhum menu comeca preso');

  d.getElementById('m-loc').classList.add('sfo-pin');
  ok(d.querySelector('.module.sfo-pin') !== null, 'menu da Locacao aberto fica azul (esperado enquanto o menu esta aberto)');
  dom.window.navigateTo('contratos');
  await espera(80);
  ok(pinados() === 0, 'ao NAVEGAR, o menu aberto se solta (era isso que ficava preso - o bug da foto)');
  ok(ativo() === 'm-loc', 'na tela de Contratos, quem fica marcado e LOCACAO');
  ok(!d.getElementById('m-prod').classList.contains('sfo-ativo'), 'o modulo da tela anterior nao fica marcado junto');

  d.getElementById('m-loc').classList.add('sfo-pin');
  dom.window.navigateTo('produtos');
  await espera(80);
  ok(pinados() === 0 && ativo() === 'm-prod', 'Locacao -> Produtos: nenhum menu preso e PRODUTOS marcado (caso da foto, corrigido)');

  dom.window.navigateTo('impressoras');
  await espera(80);
  ok(ativo() === 'm-loc', 'tela de Impressoras (item de dentro do menu) marca LOCACAO');

  dom.window.navigateTo('central-nf');
  await espera(80);
  ok(ativo() === 'm-fis', 'Central de NF marca FISCAL');

  d.getElementById('m-loc').classList.add('sfo-pin');
  d.body.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
  ok(pinados() === 0, 'clicar fora solta o menu aberto (via pointerdown, sem depender do clique)');
}

// ═══════════════════════════════════════════════════════════════════════════
// MOTOR DA NUVEM para colar no painel (pedido dele: "o código é grande,
// deixa um botão de copiar"). Aqui a prova é que o código entregue é o MESMO
// que o wrangler publica, que ele RODA (fetch + scheduled), que a página
// mostra ele inteiro e que ele não envelhece quando a versão do worker sobe.
// ═══════════════════════════════════════════════════════════════════════════
async function testarMotorDaNuvem(){
  const crypto = require('crypto');
  console.log('\n== MOTOR DA NUVEM: código para colar e publicar ==');
  const motor = fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8');
  const src = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
  const pagina = fs.readFileSync('MOTOR_NUVEM_PARA_COLAR.html', 'utf8');
  const rel = fs.readFileSync('RELATORIO_DE_TESTE_NF.html', 'utf8');

  ok(motor.indexOf('var __defProp = Object.defineProperty;') >= 0 && /as default\s*\n?\};/.test(motor),
     'o arquivo é o bundle do worker (mesmo formato esbuild que o painel da Cloudflare mostra)');
  const apiSrc = /const API_VERSION\s*=\s*'([^']+)'/.exec(src) || /API_VERSION\s*=\s*'([^']+)'/.exec(src);
  const wvSrc = /WORKER_VERSION\s*=\s*'([^']+)'/.exec(src);
  const apiMotor = /var API_VERSION = "([^"]+)"/.exec(motor);
  const wvMotor = /var WORKER_VERSION = "([^"]+)"/.exec(motor);
  ok(!!apiSrc && !!apiMotor && apiSrc[1] === apiMotor[1], 'a API do arquivo é a mesma do src (' + (apiMotor && apiMotor[1]) + ')');
  ok(!!wvSrc && !!wvMotor && wvSrc[1] === wvMotor[1],
     'a versão do worker bate com o src (' + (wvMotor && wvMotor[1]) + ') — se alguém subir a versão e esquecer de regerar, este teste acusa');

  const mod = await import('file://' + process.cwd() + '/cloudflare-worker/motor_para_colar.js');
  ok(typeof mod.default.fetch === 'function', 'o código RODA: exporta o fetch (o que responde /health, /v1/...)');
  ok(typeof mod.default.scheduled === 'function', 'o código RODA: exporta o scheduled (backup diário das 18:30)');

  // o corpo (sem o cabeçalho) tem o sha256 publicado ao lado — confere a integridade
  const corpo = motor.slice(motor.indexOf('*/') + 3).replace(/^\r?\n/, '');
  const shaCalculado = crypto.createHash('sha256').update(corpo, 'utf8').digest('hex');
  const shaArquivo = fs.readFileSync('cloudflare-worker/motor_para_colar.sha256', 'utf8').trim();
  ok(shaCalculado === shaArquivo, 'o sha256 do código bate com o arquivo .sha256 (' + shaArquivo.slice(0, 12) + '...)');
  ok(motor.indexOf(shaArquivo) >= 0, 'o sha256 também está escrito no cabeçalho do próprio código');

  // a página mostra o código INTEIRO e igual ao arquivo (nada de cópia velha)
  const i = pagina.indexOf('<pre id="codigo">'), f = pagina.indexOf('</pre>', i);
  const naPagina = pagina.slice(pagina.indexOf('>', i) + 1, f)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  ok(naPagina.replace(/\r\n/g, '\n') === motor.replace(/\r\n/g, '\n'), 'a página traz o código IGUALZINHO ao arquivo do repositório');
  ok(pagina.indexOf('btn-copiar') >= 0 && pagina.indexOf('navigator.clipboard.writeText(codigo)') >= 0,
     'botão de copiar o código inteiro, com plano B (execCommand) se o navegador negar');
  ok(pagina.indexOf('btn-baixar') >= 0, 'botão de baixar o arquivo .js (quem preferir abrir e copiar de lá)');
  ok(pagina.indexOf('Edit code') >= 0 && pagina.indexOf('Deploy') >= 0, 'a página ensina o caminho: Edit code → colar → Deploy');
  ok(pagina.indexOf('não contém</b> senha') >= 0 && pagina.indexOf('Nunca cole segredos') >= 0, 'deixa claro que não há segredo nenhum no código');
  ok(pagina.indexOf('não aplica migração do banco') >= 0, 'avisa que colar não aplica migração (quem aplica é o .cmd)');
  ok(rel.indexOf('MOTOR_NUVEM_PARA_COLAR.html') >= 0, 'o relatório de teste aponta para a página do motor');
  ok(fs.readFileSync(".gitignore", "utf8").indexOf("motor_compilado") >= 0, "a pasta do wrangler (motor_compilado) fica fora do git");

}

// ═══════════════════════════════════════════════════════════════════════════
// "CLIENTE SEM VÍNCULO" e "CLIENTE DUPLICADO" (relato dele com foto, 21/09)
// Roda os DOIS módulos de verdade (contratos_final e clientes visíveis) num
// ambiente igual ao do sistema, com os casos da foto dele.
// ═══════════════════════════════════════════════════════════════════════════
function testarClientesEContratos(){
  console.log('\n== CONTRATO SEM VÍNCULO: o nome salvo agora vale (só quando é único) ==');
  const codeC = fs.readFileSync('contratos_final_patch.js', 'utf8');
  const db = {
    empresas: [{ id: 'emp' }],
    clientes: [
      { id: 'cli1', empresaId: 'emp', codigo: '1', nome: 'Cliente Balcão' },
      { id: 'cli77', empresaId: 'emp', codigo: '77', nome: 'Cliente Balcão Ltda' },
      { id: 'cli9', empresaId: 'emp', codigo: '9', nome: 'Cassia Ap Guides de Souza Veloso e Bezerra' }
    ],
    contratos: [
      { id: 'ct1', empresaId: 'emp', numero: 'LC-1', clienteId: null, clienteNome: 'Cassia Ap Guides de Souza Veloso e Bezerra' },
      { id: 'ct2', empresaId: 'emp', numero: 'LC-2', clienteId: null, clienteNome: 'Cliente Balcão' },
      { id: 'ct3', empresaId: 'emp', numero: 'LC-3', clienteId: null }
    ],
    equipamentos: [], parque: [], leituras: [], os: [], modulosDinamicos: {}
  };
  const ctx = { window: {}, db };
  new Function('window', 'db', codeC)(ctx.window, ctx.db);
  const PC = ctx.window.CONTRATOS_FINAL_PURE;

  ok(typeof PC.cfNormNome === 'function' && typeof PC.cfClientePorNomeUnico === 'function',
     'módulo dos contratos exporta os helpers de nome');
  ok(PC.cfNormNome('Cliente Balcão Ltda') === PC.cfNormNome('CLIENTE BALCAO') && PC.cfNormNome('Cliente Balcão Ltda') === 'CLIENTE BALCAO',
     'nome comparável ignora acento, maiúscula e sufixo Ltda/ME/EIRELI');
  ok((PC.cfClientePorNomeUnico('Cassia Ap Guides de Souza Veloso e Bezerra', 'emp') || {}).id === 'cli9',
     'nome único acha o cliente CERTO');
  ok(PC.cfClientePorNomeUnico('Cliente Balcão', 'emp') === null && PC.cfClientePorNomeUnico('Cliente Balcão Ltda', 'emp') === null,
     'nome que casa com 2 cadastros NÃO chuta (devolve nulo) — regra de sempre');
  ok((PC.clienteContrato(db.contratos[0]) || {}).nome === 'Cassia Ap Guides de Souza Veloso e Bezerra',
     'contrato com o nome guardado agora aparece COM cliente (era "Cliente sem vínculo")');
  ok(PC.clienteContrato(db.contratos[1]) === null,
     'contrato com nome ambíguo continua sem vínculo — honesto, e o dono resolve unindo');
  ok(PC.clienteContrato(db.contratos[2]) === null,
     'contrato sem nenhuma pista de cliente continua sem vínculo');

  console.log('\n== CLIENTES DUPLICADOS: detector + união que NÃO apaga nada ==');
  const codeV = fs.readFileSync('ajustes_v5214_clientes_visiveis_patch.js', 'utf8');
  const db2 = {
    empresas: [{ id: 'emp_digicopy' }],
    clientes: [
      { id: 'c1', empresaId: 'emp_digicopy', codigo: '1', nome: 'Cliente Balcão', criadoEm: '2025-01-01' },
      { id: 'c77', empresaId: 'emp_digicopy', codigo: '77', nome: 'CLIENTE BALCAO LTDA', criadoEm: '2026-08-01' },
      { id: 'c9', empresaId: 'emp_digicopy', codigo: '9', nome: 'Cassia Ap Guides de Souza Veloso e Bezerra', criadoEm: '2025-05-05' }
    ],
    contratos: [{ id: 'ct1', clienteId: 'c1' }, { id: 'ct2', clienteId: 'c77' }],
    vendas: [{ id: 'v1', clienteId: 'c77' }, { id: 'v2', clienteId: 'c9' }],
    os: [{ id: 'o1', clienteId: 'c1' }], leituras: [], orcamentos: [], contasReceber: [{ id: 'cr1', clienteId: 'c77' }],
    contasPagar: [], parque: [{ id: 'p1', clienteId: 'c1' }], notificacoes: [], recargas: [], equipamentos: [], produtos: []
  };
  const ctx2 = { window: {}, document: undefined, db: db2 };
  new Function('window', 'document', codeV)(ctx2.window, ctx2.document);
  const PV = ctx2.window.CLIENTES_VISIVEIS_PURE;
  ok(typeof PV.cliGruposDuplicados === 'function' && typeof PV.cliUnir === 'function',
     'módulo dos clientes exporta o detector e a união');
  const grupos = PV.cliGruposDuplicados(db2.clientes, 'emp_digicopy', db2);
  ok(grupos.length === 1 && grupos[0].itens.length === 2,
     'acha exatamente 1 grupo repetido (Balcão x2) e não inventa outro');
  const refs1 = PV.cliRefsDe(db2, 'c1'), refs77 = PV.cliRefsDe(db2, 'c77');
  ok(refs1.total === 3 && refs77.total === 3,
     'conta as referências de cada cadastro por entidade (os dois com 3: contrato/OS/parque e contrato/venda/título)');
  ok(refs1.parque === 1 && refs77.vendas === 1 && refs77.contasReceber === 1,
     'a contagem sai separada por tipo (venda, título, parque...) — é o que o dono vê no painel');
  // empate: a regra manda ficar com o de código menor (o cadastro mais antigo)
  const principalEmpate = PV.cliEscolherPrincipal(grupos[0].itens);
  ok(principalEmpate.cliente.id === 'c1',
     'empate de referências: fica o de código MENOR (o cadastro mais antigo) — regra determinística');
  // com um uso a mais no outro cadastro, ele passa a ser o principal
  db2.vendas.push({ id: 'v3', clienteId: 'c77' });
  const gruposDepois = PV.cliGruposDuplicados(db2.clientes, 'emp_digicopy', db2);
  const principal = PV.cliEscolherPrincipal(gruposDepois[0].itens);
  ok(principal.cliente.id === 'c77' && principal.refs.total === 4,
     'com mais referências, o principal passa a ser o mais USADO (4 contra 3)');
  const r = PV.cliUnir(db2, ['c1', 'c77'], 'c77', 'Cliente Balcão');
  ok(db2.contratos[0].clienteId === 'c77' && db2.os[0].clienteId === 'c77' && db2.parque[0].clienteId === 'c77',
     'todas as referências passaram para o principal (contrato, OS e parque)');
  ok(db2.clientes.length === 3 && !!db2.clientes.find(c => c.id === 'c1'),
     'NADA foi apagado: os dois cadastros continuam no banco');
  ok(db2.clientes[0].status === 'unificado' && db2.clientes[0].unificadoPara === 'c77',
     'o repetido ficou marcado como UNIFICADO apontando o principal');
  ok(r.total === 3 && r.contratos === 1 && r.os === 1 && r.parque === 1,
     'o total de referências movidas bate (3: contrato, OS e parque) e sai separado por entidade');
  ok(db2.vendas.filter(v => v.clienteId === 'c77').length === 2,
     'as vendas que já eram do principal continuam nele (nada foi embaralhado)');
  ok(PV.cliGruposDuplicados(db2.clientes, 'emp_digicopy', db2).length === 0,
     'depois de unir, o grupo não aparece mais como pendente');
  ok((db2.clientes.find(c => c.id === 'c9') || {}).status === undefined && db2.vendas[1].clienteId === 'c9',
     'o cliente que não é duplicado (Cassia) ficou intacto');

  const src = fs.readFileSync('ajustes_v5214_clientes_visiveis_patch.js', 'utf8');
  ok(src.indexOf('confirmSistema') >= 0, 'a união exige confirmação em popup do sistema');
  ok(src.indexOf('podeUnirClientes') >= 0 && src.indexOf('usuarioPodeApagar') >= 0,
     'a união exige permissão (apagar/estornar, ou Admin/Dono)');
  ok(src.indexOf("logAction('cliente','unificar'") >= 0, 'a união entra na Auditoria');
  ok(src.indexOf('🔎 Duplicados') >= 0 && src.indexOf('clientesDuplicadosContar') >= 0,
     'tem botão na tela de Clientes já com a contagem de grupos');
  ok(src.indexOf('contratoSemVinculo') >= 0, 'o mesmo painel lista os contratos sem vínculo (para saber onde olhar)');
  const bundle = fs.readFileSync('app.bundle.js', 'utf8');
  ok(bundle.indexOf('cfClientePorNomeUnico') >= 0 && bundle.indexOf('cliGruposDuplicados') >= 0,
     'o bundle leva as duas correções');
}

(async function(){
  await testarBarraDeMenus();
  await testarMotorDaNuvem();
  testarClientesEContratos();
  if (falhas > 0){ console.error('\n' + falhas + ' assert(s) FALHARAM'); process.exit(1); }
  console.log('\nTudo OK — v6.1.4: relatório do Kauan atendido item por item.');
})();
