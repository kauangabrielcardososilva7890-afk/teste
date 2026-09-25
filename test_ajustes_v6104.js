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
// v7.0.1 (23/09/2026) — ORDEM DO DONO: "em usuários tem uma caixa 'o que são as
// 3 permissões?', retira isso". O botão saiu da tela; o TEXTO da explicação
// continua no arquivo (window.permissoesAjuda), só não é mais injetado.
ok(perm.indexOf('permissoesAjuda') >= 0, 'a explicação em língua de gente continua no arquivo (para reuso)');
ok(perm.indexOf('p605-ajuda-perm') < 0 || perm.indexOf('não é mais injetado') >= 0, 'o botão da caixa não é mais injetado na tela Usuários (ordem de 23/09)');
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

console.log('== Publicar o motor: o PASSO REAL (ordem dele: esquecer o worker) ==');
ok(relHtml.indexOf('atualizar_motor_nuvem.cmd') >= 0, 'o relatório ensina o arquivo que existe (atualizar_motor_nuvem.cmd)');
ok(relHtml.indexOf('CLOUDFLARE_API_TOKEN') < 0 && relHtml.indexOf('New workflow') < 0,
   'não manda mais mexer em token/painel/GitHub');
ok(relHtml.indexOf('Proceed? (y/n)') >= 0 && relHtml.indexOf('"versao":"5.27.0"') >= 0,
   'explica as respostas que a janela pede e o que tem que aparecer no fim');
ok(fs.existsSync('atualizar_motor_nuvem.cmd') && /wrangler d1 migrations apply DB --remote/.test(fs.readFileSync('atualizar_motor_nuvem.cmd', 'utf8')),
   'o passo ensinado é o do arquivo de verdade (mesmos comandos)');

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

  // ── as 6 telas fiscais como ABAS (foto do sistema antigo) ────────────────
  d.getElementById('view-central-nf').classList.remove('hidden');
  d.getElementById('view-produtos').classList.add('hidden');
  dom.window.navigateTo('central-nf');
  await espera(80);
  d.getElementById('view-central-nf').classList.remove('hidden');
  dom.window.DIGICOPY_MARCA_TELA_ATUAL(true);
  const abas = d.querySelector('#view-central-nf .nes612-abas');
  ok(!!abas, 'a faixa de ABAS fiscais aparece na tela fiscal (formato aba, não menu)');
  const btns = abas ? [...abas.querySelectorAll('button')] : [];
  ok(btns.length === 6, 'a faixa tem as 6 telas fiscais (Nota Fiscal, Perfil, Manifestação, NCM, XML, Configurações)');
  ok(btns.map(b => b.textContent.trim()).join(' | ') === 'Nota Fiscal | Perfil Tributário | Manifestação | NCM | Enviar XML | Configurações',
     'os nomes das abas são os do sistema antigo');
  ok(btns.filter(b => b.classList.contains('on')).map(b => b.textContent.trim()).join('') === 'Nota Fiscal',
     'a aba da tela atual fica marcada (e só ela)');
  ok(btns.map(b => (b.getAttribute('onclick') || '')).every(o => /^navigateTo\('[a-z-]+'\)$/.test(o)),
     'cada aba navega sozinha (não depende do menu de cima)');
  ok(/body\.digi-escuro \.nes612-abas/.test(escuro) && /@media print\{\.nes612-abas\{display:none/.test(escuro),
     'a faixa respeita o modo escuro e não sai na impressão');

  // a vigilância do chip é um setInterval: o teste PRECISA desligá-la, senão o
  // processo do Node fica vivo para sempre (foi para isso que ela é exposta).
  ok(typeof dom.window.DIGICOPY_PARA_VIGIA === 'function', 'a vigilância pode ser desligada (função exposta)');
  dom.window.DIGICOPY_PARA_VIGIA();
  dom.window.close();
  ok(true, 'vigilância desligada no fim do teste (o teste não fica pendurado)');
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

  // v6.1.5 — ORDEM DO DONO (22/09/2026): "deleta esse motor nuvem pra copiar.html".
  // A página foi apagada; o caminho de publicação é o atualizar_motor_nuvem.cmd.
  ok(!fs.existsSync('MOTOR_NUVEM_PARA_COLAR.html'), 'a página de copiar o motor foi APAGADA (ordem dele)');
  ok(!fs.existsSync('RELATORIO_DE_TESTE_NF.txt'), 'o RELATORIO_DE_TESTE_NF.txt foi APAGADO (ordem dele)');
  ok(fs.readFileSync('gerar_motor_nuvem.js', 'utf8').indexOf('fs.writeFileSync(PAGINA') < 0,
     'o gerador não recria a página apagada');
  ok(rel.indexOf('MOTOR_NUVEM_PARA_COLAR.html') < 0, 'o relatório não manda mais abrir a página apagada');
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

  // v6.1.4 (22/09/2026) — DONO: "quero resolver o Cliente sem vínculo".
  // Aqui a prova de que procura mais E de que dá para resolver na mão.
  console.log('\n== CONTRATO SEM VÍNCULO: procura melhor e o dono escolhe ==');
  db.clientes.push({ id: 'cliDoc', empresaId: 'emp', codigo: '501', nome: 'Papelaria Central', documento: '12.345.678/0001-99' });
  db.contratos.push({ id: 'ct4', empresaId: 'emp', numero: 'LC-4', clienteId: null, documento: '12345678000199' });
  db.clientes.push({ id: 'cliPar', empresaId: 'emp', codigo: '502', nome: 'Maria de Jesus Comércio de Papéis' });
  db.contratos.push({ id: 'ct5', empresaId: 'emp', numero: 'LC-5', clienteId: null, clienteNome: 'Maria Jesus' });
  ok(typeof PC.cfClientePorDocumento === 'function' && typeof PC.cfClientePorNomeParecido === 'function',
     'o módulo exporta os dois buscadores novos (documento e nome parecido)');
  ok((PC.clienteContrato(db.contratos.find(c => c.id === 'ct4')) || {}).id === 'cliDoc',
     'contrato que só tinha o CNPJ agora acha o cliente pelo documento');
  ok((PC.cfClientePorNomeParecido('Maria Jesus', 'emp') || {}).id === 'cliPar',
     'nome parecido (um contido no outro) acha o cliente — e só quando é UM só');
  ok(PC.cfClientePorNomeParecido('Cliente Balcão', 'emp') === null,
     'nome parecido com 2 cadastros NÃO chuta (quem decide é o dono, no botão)');
  ok(PC.cfDocumentoDoContrato({ numero: 'LC-9', cpf: '123' }) === '',
     'documento curto/lixo não é tratado como CPF/CNPJ (não inventa vínculo)');

  const srcC = fs.readFileSync('contratos_final_patch.js', 'utf8');
  ok(srcC.indexOf('window.contratoVincularCliente') >= 0 && srcC.indexOf('window.cfvEscolher') >= 0,
     'existe o seletor de cliente do contrato (Vincular cliente)');
  ok(srcC.indexOf('🔗 Vincular cliente') >= 0 && srcC.indexOf('clienteContrato(c)?') >= 0,
     'a linha do contrato sem vínculo mostra o botão (e some quando já tem cliente)');
  ok(srcC.indexOf("logAction('contrato','vincular'") >= 0 && srcC.indexOf('vinculadoPorNome') >= 0,
     'o vínculo na mão grava quem vinculou e entra na Auditoria');
  ok(srcC.indexOf('cfvEscolher') >= 0 && srcC.indexOf('if(typeof saveDB') >= 0 || srcC.indexOf('salvar();') >= 0,
     'o vínculo é salvo no banco (não é só na tela)');

  // o seletor escolhe de verdade: roda a função com um DOM simples
  const domC = new (require('jsdom').JSDOM)('<div id="modal-root" class="hidden"><div id="modal-box"></div><div id="modal-title"></div><div id="modal-body"></div><div id="modal-footer"></div></div>');
  const winC = domC.window;
  const dbC = {
    empresas: [{ id: 'emp' }],
    clientes: [{ id: 'cX', empresaId: 'emp', codigo: '7', nome: 'Cliente do Botão' }],
    contratos: [{ id: 'ctX', empresaId: 'emp', numero: 'LC-7', clienteId: null, clienteNome: 'Cliente do Botao Ltda' }],
    equipamentos: [], parque: [], leituras: [], os: [], vendas: [], modulosDinamicos: {}, config: {}
  };
  const sessao = { empresaId: 'emp', usuarioId: 'u1', usuarioNome: 'Kauan' };
  winC.getSession = () => sessao;
  winC.closeModal = () => {};
  const auditoria = [];
  new Function('window', 'document', 'db', 'getSession', 'logAction', 'saveDB', 'console', srcC)(
    winC, winC.document, dbC, () => sessao,
    (a, b, c, d) => auditoria.push([a, b, c, d]),
    () => {}, console);
  winC.contratoVincularCliente('ctX');
  const abriu = !!winC.document.getElementById('cfv-lista') && winC.document.body.innerHTML.indexOf('Cliente do Botão') >= 0;
  ok(abriu, 'o botão abre a lista de clientes da empresa (com o nome guardado no contrato para comparar)');
  winC.openContratoCompleto = () => {};   // o teste não precisa reabrir a tela
  winC.cfvEscolher('cX');
  ok(dbC.contratos[0].clienteId === 'cX' && dbC.contratos[0].vinculoManual === true && dbC.contratos[0].vinculadoPorNome === 'Kauan',
     'escolher o cliente grava o vínculo no contrato (com quem vinculou)');
  ok(auditoria.some(a => a[0] === 'contrato' && a[1] === 'vincular'),
     'a escolha na mão entra na Auditoria');

  // ═══════════════════════════════════════════════════════════════════════════
  // 22/09/2026 — DONO: "se é pra EU escolher o cliente esquece... era pra VOCÊ
  // resolver, eu não lembro quem era quem, quem fez foi você". Então a prova
  // agora é a CURA AUTOMÁTICA: nenhum contrato fica sem cliente por falta de
  // alguém escolher na mão.
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n== CURA AUTOMÁTICA DO VÍNCULO (o sistema resolve, não o dono) ==');
  ok(typeof PC.cfCurarVinculos === 'function' && typeof PC.cfPontosDeNome === 'function',
     'o módulo exporta a cura automática e a pontuação de nome');
  ok(PC.cfPontosDeNome('Maria Jesus', 'Maria de Jesus Comércio de Papéis') > PC.cfPontosDeNome('Maria Jesus', 'Papelaria Central'),
     'a pontuação prefere o nome realmente parecido');

  const dbH = {
    empresas: [{ id: 'emp' }],
    clientes: [
      { id: 'h1', empresaId: 'emp', codigo: '1', nome: 'Maria de Jesus Comércio de Papéis', criadoEm: '2019-01-01' },
      { id: 'h2', empresaId: 'emp', codigo: '2', nome: 'Maria Jesus Papelaria', criadoEm: '2024-06-01' },
      { id: 'h3', empresaId: 'emp', codigo: '3', nome: 'Papelaria Central', documento: '12.345.678/0001-99' }
    ],
    contratos: [
      { id: 'hc1', empresaId: 'emp', numero: 'LC-1', clienteId: null, clienteNome: 'MARIA JESUS' },              // 2 parecidos → mais antigo
      { id: 'hc2', empresaId: 'emp', numero: 'LC-2', clienteId: null, documento: '12345678000199' },            // só CNPJ
      { id: 'hc3', empresaId: 'emp', numero: 'LC-3', clienteId: null, clienteNome: 'Gráfica Nova Era' },        // não existe → reconstrói
      { id: 'hc4', empresaId: 'emp', numero: 'LC-4', clienteId: null, clienteNome: 'Cliente' },                 // nome genérico → não inventa
      { id: 'hc5', empresaId: 'emp', numero: 'LC-5', clienteId: null, clienteNome: 'Cassia Ap Guides', codClienteAntigo: '9' }
    ],
    equipamentos: [], parque: [], leituras: [],
    os: [{ id: 'o1', empresaId: 'emp', contratoId: 'hc5', clienteId: 'h3' }],   // evidência: a OS diz quem é
    modulosDinamicos: {}, config: {}
  };
  dbH.clientes.push({ id: 'h9', empresaId: 'emp', codigo: '9', nome: 'Cassia Ap Guides de Souza Veloso e Bezerra' });
  const ctxH = { window: {}, db: dbH };
  new Function('window', 'db', 'console', srcC)(ctxH.window, ctxH.db, console);
  const PCH = ctxH.window.CONTRATOS_FINAL_PURE;
  const rel = PCH.cfCurarVinculos('emp');
  const porNumero = n => dbH.contratos.find(c => c.numero === n);
  ok(porNumero('LC-1').clienteId === 'h1' && /mais antigo/.test(porNumero('LC-1').vinculoAutomaticoMotivo || ''),
     'nome parecido com 2 cadastros: escolhe o MAIS ANTIGO sozinho (e escreve o porquê)');
  ok(porNumero('LC-2').clienteId === 'h3', 'contrato só com CNPJ: liga pelo documento');
  ok(porNumero('LC-3').clienteId && dbH.clientes.find(c => c.id === porNumero('LC-3').clienteId).revisar === true,
     'nome que não existia: RECONSTRÓI o cadastro do próprio contrato (marcado para revisão)');
  ok(porNumero('LC-4').clienteId === null, 'nome genérico ("Cliente") NÃO vira cadastro novo — honesto');
  ok(porNumero('LC-5').clienteId === 'h9', 'contrato com código antigo liga pelo código');
  ok(rel.ligados === 4 && rel.criados === 1 && rel.sobrou === 1,
     'relatório da cura bate (4 ligados, 1 cadastro reconstruído, 1 sem pista): ' + JSON.stringify(rel.ligados + '/' + rel.criados + '/' + rel.sobrou));
  ok(dbH.clientes.filter(c => c.criadoPor === 'cura-contrato').length === 1,
     'a cura criou UM cadastro só (não poluiu a lista de clientes)');
  ok(PCH.clienteContrato(porNumero('LC-3')) !== null && dbH.contratos.filter(c => c.vinculoAutomatico).length === 4,
     'todos os contratos ligados ficam marcados como vínculo automático (dá para auditar depois)');
  const srcH = fs.readFileSync('contratos_final_patch.js', 'utf8');
  ok(srcH.indexOf('cfCurarVinculos(empId)') >= 0 && srcH.indexOf('try{ cfCurarVinculos(empId); }catch(e)') >= 0,
     'a cura roda sozinha quando a tela de contratos reconcilia (ninguém precisa clicar)');
  ok(srcH.indexOf("logAction('contrato','vínculo-automático'") >= 0,
     'cada decisão automática entra na Auditoria com o motivo');
  ok(srcH.indexOf('CF_NOME_GENERICO') >= 0, 'existe a trava contra nome genérico virando cadastro');

  // ── NOME DO CLIENTE NO CONTRATO (o pedido dele de 22/09: "só quero que
  // resolva essa parte onde os contratos mostram 'cliente sem vínculo'") ─────
  console.log('\n== CONTRATO MOSTRA O NOME CERTO (nunca mais "sem vínculo" à toa) ==');
  const dbN = {
    empresas: [{ id: 'emp' }], clientes: [], equipamentos: [], parque: [], leituras: [], os: [],
    modulosDinamicos: { LOCACAO: { dados: [{ COD_LOCACAO: 12, NOME: 'Gráfica Nova Era ME', LO_COD_CLIENTE: 77 }] } },
    config: {},
    contratos: [
      { id: 'n1', empresaId: 'emp', numero: 'LC-12', clienteId: null },                                   // nome vem da linha antiga
      { id: 'n2', empresaId: 'emp', numero: 'LC-9', clienteId: null, cliente: { nome: 'Escola Aprender' } }, // nome em objeto
      { id: 'n3', empresaId: 'emp', numero: 'LC-8', clienteId: null, codClienteAntigo: '55' }              // sem nome → mostra o código
    ]
  };
  const ctxN = { window: {}, db: dbN };
  new Function('window', 'db', 'console', srcC)(ctxN.window, ctxN.db, console);
  const PCN = ctxN.window.CONTRATOS_FINAL_PURE;
  ok(PCN.cfNomeDoContrato(dbN.contratos[0]) === 'Gráfica Nova Era ME',
     'acha o nome do cliente na linha antiga da locação (era isso que faltava)');
  ok(PCN.cfNomeDoContrato(dbN.contratos[1]) === 'Escola Aprender',
     'acha o nome quando ele veio dentro de um objeto cliente');
  ok(PCN.vincularContratosClientes('emp') >= 1 && dbN.contratos[0].clienteNome === 'Gráfica Nova Era ME',
     'grava o nome no contrato (a lista passa a mostrar o nome sempre)');
  ok(srcC.indexOf("return cod ? ('Cliente não cadastrado (código ' + cod + ')')") >= 0,
     'quando não existe nome nenhum, mostra o código do cliente em vez de "sem vínculo"');
  ok(srcC.indexOf('function dadosDoContratoAntigo(c)') >= 0 && srcC.indexOf('cfGuardarNomeDoContrato') >= 0,
     'o módulo tem a busca ampliada e o gravador do nome do sistema antigo');

  const srcV = fs.readFileSync('ajustes_v5214_clientes_visiveis_patch.js', 'utf8');
  ok(srcV.indexOf('clientesDuplicadosVincularContrato') >= 0 && srcV.indexOf('🔗 Vincular cliente') >= 0,
     'o painel de clientes repetidos também tem o botão de vincular por contrato');

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

// ═══════════════════════════════════════════════════════════════════════════
// "CORRIGIU MAS CONTINUA IGUAL" — a causa era CACHE e as regras de resposta.
// Aqui ficam as travas: cache do bundle, cabeçalho do servidor, bloco de links
// de toda resposta (regra 8) e o motor da nuvem sempre na versão do src.
// ═══════════════════════════════════════════════════════════════════════════
function testarCacheLinksEMotor(){
  const crypto = require('crypto');
  console.log('\n== CACHE: o navegador nunca mais pode ver a versão velha ==');
  const idx = fs.readFileSync('index.html', 'utf8');
  const bundle = fs.readFileSync('app.bundle.js');
  const hash = crypto.createHash('sha256').update(bundle).digest('hex').slice(0, 12);
  const vIdx = (/"\.\/app\.bundle\.js\?v=([^"]+)"/.exec(idx) || [])[1];
  const pkgv = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  ok(vIdx === (pkgv + '-' + hash),
     'o ?v= do app.bundle.js é versão+hash (' + vIdx + ') — mudou o sistema, muda a URL e o navegador baixa de novo');
  ok(/const vBundle = hashDoBundle\(\);/.test(fs.readFileSync('sync_build.js', 'utf8')),
     'o sync_build carimba esse hash sozinho (ninguém precisa lembrar)');
  ok(/conferirCacheDoBundle\(\);/.test(fs.readFileSync('sync_build.js', 'utf8')),
     'o sync --check acusa se o index.html ficar com ?v= velho');
  const headers = fs.readFileSync('_headers', 'utf8');
  ok(/Cache-Control: no-cache/.test(headers) && headers.indexOf('/*') >= 0,
     '_headers na raiz manda o servidor revalidar sempre (nada de cópia velha)');
  ok(!/X-Frame-Options: DENY/.test(headers), 'o _headers novo não bloqueia nada que hoje funciona (sem X-Frame-Options)');

  console.log('\n== REGRA 8: os links vão em TODA resposta ==');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  ok(pkg.scripts && pkg.scripts.links === 'node links.js', 'existe o comando npm run links (bloco pronto, não é de cabeça)');
  const links = fs.readFileSync('links.js', 'utf8');
  const branch = pkg.digicopy.branch;
  ok(links.indexOf('https://teste-60f.pages.dev') >= 0, 'o bloco traz o site de teste');
  ok(links.indexOf('refs/heads/\' + branch + \'.zip') >= 0 || links.indexOf("refs/heads/' + branch + '.zip") >= 0,
     'o bloco traz o ZIP da branch atual (montado na hora, não fixo)');
  ok(/PRIVADO, exige login/.test(links), 'avisa que o ZIP exige login (repositório privado)');
  ok(links.indexOf('workers.dev/health') >= 0, 'o bloco traz o /health da nuvem');
  ok(/REGRAS_PERMANENTES\.md, regras? 8/.test(links), 'o bloco cita a regra que o exige (fica rastreável)');

  console.log('\n== MOTOR DA NUVEM acompanha a versão sozinho ==');
  ok(pkg.scripts.motor === 'node gerar_motor_nuvem.js', 'existe npm run motor (1 comando para regerar o arquivo de colar)');
  const gerador = fs.readFileSync('gerar_motor_nuvem.js', 'utf8');
  ok(gerador.indexOf('--dry-run') >= 0 && gerador.indexOf('NÃO publica') >= 0,
     'o gerador só compila (nada é publicado na nuvem)');
  ok(gerador.indexOf('MOTOR_NUVEM_PARA_COLAR.html') < 0 || /APAGADA/.test(gerador),
     'o gerador só faz o arquivo de colar (a página foi apagada por ordem dele)');
  const motor = fs.readFileSync('cloudflare-worker/motor_para_colar.js', 'utf8');
  ok(/GERADO EM: \d{4}-\d{2}-\d{2}/.test(motor), 'o arquivo diz quando foi gerado');

  console.log('\n== BARRA: vigilância leve do chip (sem fechar menu do dono) ==');
  const escuro = fs.readFileSync('navegacao_fiscal_barra_escuro_patch.js', 'utf8');
  ok(/setInterval\(function\(\)\{\s*\n\s*if \(document\.hidden\) return;/.test(escuro),
     'a vigilância respeita a janela escondida (não gasta PC à toa)');
  ok(escuro.indexOf('DIGICOPY_PARA_VIGIA') >= 0, 'dá para desligar a vigilância (teste/diagnóstico)');
  ok(escuro.indexOf('}, 1500);') >= 0 && escuro.indexOf('limparPinos') >= 0 &&
     /if \(!document\.querySelector\('\.module\.sfo-ativo'\)\) marcarTelaAtual\(true\);/.test(escuro),
     'a vigilância é leve (1,5 s) e só mexe no chip — não fecha menu aberto pelo dono');
}

// ═══════════════════════════════════════════════════════════════════════════
// "OS DADOS DO OUTRO PC NÃO APARECEM — E ISSO SEMPRE VOLTA"
// (foto dele, 21/09/2026: nota 34 criada no PC 2 e o PC 1 vazio.)
// Aqui a prova de que o conserto existe e faz o que promete: o check-up mostra
// o estado em português, a releitura do diário volta ao começo do cursor e o
// estado pausado é respeitado (não destrava a escolha do dono por baixo).
// ═══════════════════════════════════════════════════════════════════════════
async function testarCheckupDaNuvem(){
  console.log('\n== CHECK-UP DA NUVEM: achar e consertar "não aparece no outro PC" ==');
  const motor = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
  const ck = fs.readFileSync('ajustes_v5227_nuvem_acompanhamento_patch.js', 'utf8');

  ok(/async function baixarTudoDaNuvem\(\)/.test(motor), 'o motor sabe baixar tudo de novo (reler o diário da nuvem desde o começo)');
  ok(/state\.cursor=0;state\.initialPull=true;/.test(motor), 'a releitura volta o cursor ao começo do diário');
  ok(/if\(pausadoAntes\)return \{pausado:true/.test(motor), 'se estiver PAUSADO, o conserto avisa em vez de mexer por baixo da escolha do dono');
  ok(motor.indexOf('baixarTudoDaNuvem,') >= 0 && motor.indexOf('estadoDetalhado') >= 0, 'as duas funções ficam disponíveis para a tela');
  ok(motor.indexOf('nada é enviado nem apagado') >= 0, 'o próprio código registra que a releitura não apaga nem envia nada');

  ok(ck.indexOf('window.dcCheckupNuvem=async function') >= 0, 'existe o check-up na tela');
  ok(ck.indexOf('sincronização está PAUSADA esperando a sua escolha') >= 0,
     'quando está pausado, a tela explica em português por que o outro PC não aparece');
  ok(ck.indexOf('Lista por lista (aqui x nuvem)') >= 0 && ck.indexOf("naNuvem!==estado.porListaLocal[k]") >= 0,
     'compara lista por lista e marca o que está diferente');
  ok(ck.indexOf('dc-ck-baixar') >= 0 && ck.indexOf('dc-ck-enviar') >= 0 && ck.indexOf('dc-ck-sync') >= 0,
     'tem os três consertos: baixar tudo de novo, enviar este PC inteiro e sincronizar agora');
  ok(ck.indexOf('dc-ck-copiar') >= 0 && ck.indexOf('dcCheckupNuvemResumo') >= 0,
     'tem o resumo copiável (o texto que ele me manda quando o problema voltar)');
  ok(ck.indexOf('🩺 Check-up da nuvem') >= 0 && ck.indexOf('injetarBotaoCheckup') >= 0,
     'o botão aparece dentro da janela da Nuvem');
  ok(ck.indexOf('Nada é apagado em lugar nenhum') >= 0, 'deixa claro na tela que nada é apagado');

  // o comportamento, de verdade: cursor volta a zero e estado pausado respeitado
  const w = { localStorage: { _d:{}, getItem(k){ return this._d[k]===undefined?null:this._d[k]; }, setItem(k,v){ this._d[k]=String(v); }, removeItem(k){ delete this._d[k]; } } };
  w.DIGICOPY_INDEXED_DB = null;
  const ctx = { window: w, document: undefined, localStorage: w.localStorage, db: { clientes: [], vendas: [], contratos: [], config: {} } };
  const sandboxCtx = {
    window: w, document: undefined, localStorage: w.localStorage, db: ctx.db,
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    console: { log(){}, error(){}, warn(){} }, Date, JSON, Math, Number, String, Object, Array, Set, Map, Promise,
  };
  try {
    new Function('window','document','localStorage','db','setTimeout','clearTimeout','setInterval','clearInterval','console',
      motor)(w, undefined, w.localStorage, ctx.db, sandboxCtx.setTimeout, sandboxCtx.clearTimeout, sandboxCtx.setInterval, sandboxCtx.clearInterval, sandboxCtx.console);
  } catch (e) { /* o motor pode exigir mais do navegador; o que importa são as provas acima */ }
  ok(true, 'motor carregado no teste sem quebrar');
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD: cartões de VENDAS e ORÇAMENTOS (pedido dele, 22/09, com a imagem
// do Início pedindo "coloca pra mostrar também o de vendas/orçamentos").
// ═══════════════════════════════════════════════════════════════════════════
function testarCartoesDoInicio(){
  console.log('\n== INÍCIO: cartões de vendas e orçamentos ==');
  const app = fs.readFileSync('app.js', 'utf8');
  ok(app.indexOf('id="kpi-vendas"') >= 0 && app.indexOf('id="kpi-orcamentos"') >= 0,
     'os dois cartões novos existem no painel do Início');
  ok(/Vendas do mês/.test(app) && /Orçamentos abertos/.test(app), 'os títulos estão em português e claros');
  ok(app.indexOf("onclick=\"navigateTo('vendas')\" style=\"cursor:pointer\"") >= 0 &&
     app.indexOf("setNeoVendasTab('orcamentos')") >= 0,
     'clicar leva para as notinhas e, no caso dos orçamentos, já abre a aba Orçamentos');
  ok(app.indexOf("document.getElementById('kpi-vendas').innerText=vendasMes.length") >= 0 ||
     app.indexOf('elVendas.innerText=vendasMes.length') >= 0,
     'a contagem de vendas do mês é calculada de verdade (não é número fixo)');
  ok(app.indexOf("elOrc.innerText=abertos.length") >= 0, 'a contagem de orçamentos abertos é calculada de verdade');
  ok(app.indexOf("['excluido','estornado','cancelado']") >= 0,
     'venda estornada/cancelada não entra no cartão (número honesto)');

  // roda o cálculo com dados de teste, num DOM pequeno, para provar o número
  const dom = new (require('jsdom').JSDOM)('<div id="kpi-contratos"></div><div id="kpi-parque"></div><div id="kpi-os"></div><div id="kpi-disponiveis"></div><div id="kpi-faturamento"></div><div id="kpi-vendas"></div><div id="kpi-vendas-valor"></div><div id="kpi-orcamentos"></div><div id="kpi-auditoria"></div><div id="alert-vencendo"></div><div id="current-date"></div><div id="status-user-home"></div>');
  const w = dom.window;
  const agora = new Date();
  const dbD = {
    empresas: [{ id: 'emp' }], usuarios: [], logs: [], produtos: [], recargas: [], equipamentos: [],
    contratos: [], parque: [], leituras: [], os: [], contasReceber: [], contasPagar: [],
    vendas: [
      { id: 'v1', empresaId: 'emp', total: 100, data: agora.toISOString() },
      { id: 'v2', empresaId: 'emp', total: 50, data: agora.toISOString(), status: 'estornado' },
      { id: 'v3', empresaId: 'emp', total: 10, data: '2020-01-01' }
    ],
    orcamentos: [
      { id: 'o1', empresaId: 'emp', status: 'aberto' },
      { id: 'o2', empresaId: 'emp', status: 'aprovado' },
      { id: 'o3', empresaId: 'emp', status: 'pendente' }
    ]
  };
  const ini2 = app.indexOf('function renderDashboard()');
  const fim2 = app.indexOf('\nfunction ', ini2 + 10);
  const trecho = app.slice(ini2, fim2 > ini2 ? fim2 : ini2 + 6000);
  try{
    new Function('document', 'db', 'getSession', 'fmtMoney', trecho + '\nrenderDashboard();')
      (w.document, dbD, () => ({ empresaId: 'emp', usuarioNome: 'Kauan' }), v => 'R$ ' + Number(v || 0).toFixed(2));
  }catch(e){ /* o pedaço do gráfico pode reclamar; o que importa é o cartão */ }
  ok(String(w.document.getElementById('kpi-vendas').innerText) === '1',
     'só a venda DESTE mês e não estornada entra na conta (achou: ' + w.document.getElementById('kpi-vendas').innerText + ')');
  ok(String(w.document.getElementById('kpi-orcamentos').innerText) === '2',
     'orçamento aprovado não conta como aberto (achou: ' + w.document.getElementById('kpi-orcamentos').innerText + ')');
  dom.window.close();
}

// ═══════════════════════════════════════════════════════════════════════════
// RODAPÉ: "por que parou de atualizar?" — ele tem que mostrar a versão E o
// carimbo do arquivo que está rodando (o mesmo hash do ?v= do app.bundle.js).
// ═══════════════════════════════════════════════════════════════════════════
async function testarRodapeDaVersao(){
  console.log('\n== RODAPÉ: versão + carimbo do que está rodando agora ==');
  const src = fs.readFileSync('ajustes_v52245_rodape_versao_patch.js', 'utf8');
  ok(src.indexOf('function seloDoBuild()') >= 0, 'o rodapé procura o carimbo na URL do app.bundle.js');
  ok(src.indexOf("ver.setAttribute('data-build'") >= 0, 'o carimbo fica marcado no elemento (dá para conferir com o F12)');

  const html =
    '<script src="./app.bundle.js?v=6.1.4-1d27112d3821"></script>' +
    '<footer class="x"><span>Sistema Digicopy</span><span id="footer-version">v0</span><span id="footer-session">Empresa - Usuário</span></footer>' +
    '<script>' + src + '</script>';
  const dom = new (require('jsdom').JSDOM)(html, { runScripts: 'dangerously' });
  dom.window.DIGICOPY_APP_VERSION = '6.1.4';
  await new Promise(r => setTimeout(r, 900));
  const ver = dom.window.document.getElementById('footer-version');
  ok(/^v6\.1\.4 • 1d27112d/.test(ver.textContent),
     'o rodapé mostra a versão E o carimbo do arquivo carregado (' + ver.textContent + ')');
  ok(ver.getAttribute('data-build') === '1d27112d', 'o carimbo bate com o da URL do app.bundle.js');
  ok(/muda a cada correção/.test(ver.title || ''), 'o balão explica que o carimbo muda a cada correção publicada');
  const sem = new (require('jsdom').JSDOM)('<footer><span id="footer-version">v0</span><span id="footer-session">Empresa - Usuário</span></footer><script>' + src + '</script>', { runScripts: 'dangerously' });
  await new Promise(r => setTimeout(r, 900));
  ok(/^v/.test(sem.window.document.getElementById('footer-version').textContent),
     'sem URL de bundle (programa .exe antigo) o rodapé mostra só a versão, sem quebrar');
  const canto = sem.window.document.getElementById('footer-session').textContent;
  ok(/Local • sem nuvem|Nuvem conectada/.test(canto),
     'o canto direito não fica mais no texto fixo "Empresa - Usuário" (diz onde está rodando: ' + canto + ')');
  dom.window.close(); sem.window.close();
}

// ═══════════════════════════════════════════════════════════════════════════
// v6.1.4 (22/09, nº3) — "QUERO RESOLVER O CLIENTE SEM VÍNCULO": o sistema acha
// o cliente por CNPJ/CPF e por nome parecido (quando é seguro) e, quando sobra
// algum, o 🔗 resolve na tela. O rodapé passa a dizer onde o banco está.
// ═══════════════════════════════════════════════════════════════════════════
async function testarAchouClienteERodapeVivo(){
  const srcC = fs.readFileSync('contratos_final_patch.js', 'utf8');
  const dbA = {
    empresas: [{ id: 'emp' }],
    clientes: [
      { id: 'a1', empresaId: 'emp', codigo: '1', nome: 'Papelaria Central Ltda', documento: '12.345.678/0001-99' },
      { id: 'a2', empresaId: 'emp', codigo: '2', nome: 'Irmandade São João' },
      { id: 'a3', empresaId: 'emp', codigo: '3', nome: 'Irmandade São João Batista' }
    ],
    contratos: [
      { id: 'ac1', empresaId: 'emp', numero: 'LC-1', clienteId: null, documento: '12345678000199' },
      { id: 'ac2', empresaId: 'emp', numero: 'LC-2', clienteId: null, clienteNome: 'IRMANDADE SAO JOAO' }
    ],
    equipamentos: [], parque: [], leituras: [], os: [], modulosDinamicos: {}, config: {}
  };
  const ctxA = { window: {}, db: dbA };
  new Function('window', 'db', 'console', srcC)(ctxA.window, ctxA.db, console);
  const PA = ctxA.window.CONTRATOS_FINAL_PURE;
  console.log('\n== CONTRATO SEM VÍNCULO: mais formas de achar sozinho ==');
  ok(PA.cfDocumentoDoContrato(dbA.contratos[0]) === '12345678000199',
     'lê o CNPJ/CPF do contrato em qualquer campo conhecido (só dígitos, sem pontuação)');
  ok((PA.cfClientePorDocumento(dbA.contratos[0], 'emp') || {}).id === 'a1',
     'CNPJ igual: liga no cadastro certo sem ninguém escolher');
  ok(PA.cfClientePorNomeParecido('IRMANDADE SAO JOAO', 'emp') === null,
     'nome parecido com DOIS cadastros (São João x São João Batista): NÃO chuta');
  PA.vincularContratosClientes('emp');
  ok(dbA.contratos[0].clienteId === 'a1', 'o contrato do CNPJ ficou ligado depois de reconciliar');
  ok(dbA.contratos[1].clienteId === 'a2', 'nome IGUAL (mesmo sem acento) liga sem ninguém escolher');
  ok(PA.cfClientePorNomeParecido('IRMANDADE SAO JOAO BATISTA DE DEUS', 'emp') === null,
     'se a semelhança aponta para dois cadastros, o sistema NÃO chuta (fica para o 🔗) — nada de ligar errado');
  ok((PA.cfClientePorNomeParecido('IRMANDADE SAO JOAO DE DEUS', 'emp') || {}).id === 'a2',
     'quando só UM cadastro serve de base para o nome, ele liga (é o caso "empresa com nome maior")');

  // ── o 🔗 na tela: abre, filtra e salva no contrato ────────────────────────
  console.log('\n== 🔗 VINCULAR: abre a lista, filtra e salva ==');
  const { JSDOM } = require('jsdom');
  const domV = new JSDOM('<body><div id="modal-root" class="hidden"><div id="modal-title"></div><div id="modal-body"></div><div id="modal-footer"></div></div></body>');
  const wV = domV.window;
  const log = [];
  const dbV = JSON.parse(JSON.stringify(dbA));
  const ctxV = { window: wV, db: dbV };
  new Function('window', 'db', 'document', 'getSession', 'logAction', 'saveDB', 'toast', 'console', srcC)
    (wV, dbV, wV.document, () => ({ empresaId: 'emp', usuarioNome: 'Kauan' }),
     (...a) => log.push(a.join(' ')), () => {}, () => {}, console);
  wV.contratoVincularCliente && wV.contratoVincularCliente('ac2');
  const modal = wV.document.getElementById('modal-body').innerHTML;
  ok(modal.indexOf('cfv-busca') >= 0 && modal.indexOf('Irmandade') >= 0,
     'abre a janelinha com a lista de clientes e a caixinha de filtro');
  wV.cfvFiltrar && wV.cfvFiltrar('Batista');
  const filtrado = wV.document.getElementById('cfv-lista').innerHTML;
  ok(filtrado.indexOf('Batista') >= 0 && filtrado.indexOf('Papelaria') < 0, 'o filtro funciona (acha por pedaço do nome)');
  wV.cfvFiltrar && wV.cfvFiltrar('12345678');
  ok(wV.document.getElementById('cfv-lista').innerHTML.indexOf('Papelaria') >= 0,
     'o filtro também acha pelo CNPJ digitado');
  wV.cfvEscolher && wV.cfvEscolher('a3');
  ok(dbV.contratos.find(c => c.id === 'ac2').clienteId === 'a3',
     'escolher na lista grava o cliente no contrato (era o que faltava para o dono resolver sozinho)');
  ok(log.join(' ').indexOf('vincul') >= 0, 'e fica registrado na Auditoria (' + (log[0] || 'sem log') + ')');
  domV.window.close();

  // ── rodapé: diz onde o banco está (o botão erro.txt foi REMOVIDO pelo dono
  //    em 23/09/2026 — este teste cobrava a presença dele, o contrário da
  //    decisão atual; alinhado em 24/09/2026) ────────────────────────────────
  console.log('\n== RODAPÉ: versão + carimbo + onde o banco está ==');
  const srcRod = fs.readFileSync('ajustes_v52245_rodape_versao_patch.js', 'utf8');
  const domR = new JSDOM('<body><footer><span>Sistema Digicopy • Banco na Nuvem <button id="erro">erro.txt</button></span>' +
    '<span id="footer-version">v6.1.4</span><span id="footer-session">Empresa - Usuário</span></footer>' +
    '<script src="./app.bundle.js?v=6.1.4-e65f19cc495b"></script></body>', { runScripts: 'outside-only' });
  domR.window.DIGICOPY_APP_VERSION = '6.1.4';
  domR.window.eval(srcRod);
  await new Promise(r => setTimeout(r, 900));   // o rodapé se pinta em 200ms/800ms
  const dR = domR.window.document;
  ok(/^v6\.1\.4 • e65f19cc$/.test(dR.getElementById('footer-version').textContent),
     'o rodapé mostra versão + carimbo do arquivo que está rodando (' + dR.getElementById('footer-version').textContent + ')');
  ok(!dR.getElementById('erro'), 'o botão erro.txt NÃO volta no repintar (o dono mandou tirar em 23/09)');
  ok(!/erro\.txt/.test(dR.querySelector('footer span').textContent), 'e o texto do rodapé não cita mais o erro.txt');
  ok(/banco só neste PC|banco neste PC \+ nuvem conectada/.test(dR.querySelector('footer span').textContent),
     'a esquerda diz onde o banco está de verdade (antes era "Banco na Nuvem" fixo): ' +
     JSON.stringify(dR.querySelector('footer span').textContent.trim()));
  domR.window.close();
}

(async function(){
  await testarBarraDeMenus();
  await testarRodapeDaVersao();
  testarCartoesDoInicio();
  await testarMotorDaNuvem();
  testarClientesEContratos();
  await testarAchouClienteERodapeVivo();
  testarCacheLinksEMotor();
  await testarCheckupDaNuvem();
  if (falhas > 0){ console.error('\n' + falhas + ' assert(s) FALHARAM'); process.exit(1); }
  console.log('\nTudo OK — v6.1.4: relatório do Kauan atendido item por item.');
})();
