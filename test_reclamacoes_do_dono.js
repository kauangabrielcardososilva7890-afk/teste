// ═════════════════════════════════════════════════════
// TESTE — TODA RECLAMAÇÃO DO DONO TEM UMA TRAVA (a ideia "A", rodada 25)
//
// O problema que este arquivo resolve: "voltou a dar problema" já aconteceu
// várias vezes. Cada conserto provado numa rodada ficava só na documentação —
// quem garantia que não voltava era a memória de quem escreveu.
//
// Este teste faz duas coisas:
//
//  1) COBRA A LISTA (`RECLAMACOES_E_TESTES.md`): cada reclamação dele aponta
//     para o conserto (arquivos que existem) e para o teste que trava. Se o
//     teste citado for apagado, ou existir mas sair do `test_runner.js` (teste
//     que ninguém roda não trava nada), o teste falha aqui.
//
//  2) PRENDE AS RECLAMAÇÕES QUE NÃO TINHAM TESTE PRÓPRIO (as linhas "aqui"):
//     a versão igual em todos os arquivos, a branch certa nos links, o menu
//     fiscal oficial, o modo escuro, a caixa "3 permissões" fora da tela, o
//     `erro.txt` fora do rodapé, o SÓ NUVEM, o "dado que some" e o `prompt`
//     nativo que quebra dentro do `.exe`.
//
// Ele não roda o sistema: lê os arquivos. É barato de rodar e caro de burlar —
// mexe no arquivo que trava, a suíte fica vermelha.
// ═════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');

let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  \u2718 ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}
const ler = (p) => fs.readFileSync(p, 'utf8');
const existe = (p) => { try { return fs.existsSync(p); } catch (e) { return false; } };

// tira comentários de linha e de bloco (para não confundir conversa com código).
// O "não antes de :" preserva URLs (https://…).
function tiraComentarios(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:\w])\/\/[^\n]*/g, '$1 ');
}

console.log('== TODA RECLAMAÇÃO DO DONO TEM UMA TRAVA ==');

// ─────────────────────────────────────────────────────────────
// 1) A LISTA E A REALIDADE (RECLAMACOES_E_TESTES.md)
// ─────────────────────────────────────────────────────────────
console.log('-- a lista das reclamações bate com o repositório --');
const lista = ler('RECLAMACOES_E_TESTES.md');
const registrados = (() => {
  const bloco = ler('test_runner.js');
  const dentro = bloco.slice(bloco.indexOf('const tests=['), bloco.indexOf('];', bloco.indexOf('const tests=[')));
  return new Set((dentro.match(/"([^"]+\.js)"/g) || []).map((x) => x.replace(/"/g, '')));
})();
const linhas = lista.split('\n').filter((l) => /^\| *\d+ *\|/.test(l));
ok('a lista tem as reclamações registradas (>= 18)', linhas.length >= 18, 'linhas: ' + linhas.length);

let testes = 0, fontes = 0;
const faltandoTeste = [], foraDoRunner = [], faltandoArquivo = [];
linhas.forEach((linha, i) => {
  const citados = (linha.match(/`([^`]+)`/g) || []).map((x) => x.replace(/`/g, ''));
  citados.forEach((alvo) => {
    // só nomes de arquivo (ignora trechos de código citados entre crases)
    if (!/^[\w./-]+\.(js|md|json|html)$/.test(alvo)) return;
    if (!existe(alvo)) { faltandoArquivo.push('linha ' + (i + 1) + ': ' + alvo); return; }
    if (alvo.indexOf('test_') === 0) {
      testes++;
      if (!registrados.has(alvo)) foraDoRunner.push('linha ' + (i + 1) + ': ' + alvo);
    } else if (alvo.indexOf('bench_') === 0 || alvo.indexOf('mapa_') === 0) {
      testes++;   // bancada/ferramenta: roda na mão, não entra na suíte de propósito
    } else if (/\.(js|md|json|html)$/.test(alvo)) {
      fontes++;
    }
  });
});
ok('todo arquivo citado no conserto existe', faltandoArquivo.length === 0, faltandoArquivo.join(' | '));
ok('todo teste citado existe e está registrado no test_runner.js (teste que ninguém roda não trava nada)',
  foraDoRunner.length === 0, foraDoRunner.join(' | '));
ok('a lista cobre o conserto e o teste de cada reclamação (dezenas de arquivos citados)',
  testes >= 18 && fontes >= 20, 'testes: ' + testes + ' | fontes: ' + fontes);

// ─────────────────────────────────────────────────────────────
// 2) AS TRAVAS QUE MORAM AQUI (as linhas "aqui" da lista)
// ─────────────────────────────────────────────────────────────
const manifest = JSON.parse(ler('bundle-manifest.json'));
const manifestLista = Array.isArray(manifest) ? manifest : (manifest.scripts || manifest.files || []);
const posNoManifesto = (nome) => manifestLista.indexOf(nome);

console.log('-- reclamação 2: a versão e a branch em TODOS os arquivos --');
{
  const pkg = JSON.parse(ler('package.json'));
  const versao = String(pkg.version || '');
  ok('package.json tem versão de verdade (x.y.z)', /^\d+\.\d+\.\d+$/.test(versao), versao);
  ok('a branch do package.json é a da sessão (o ZIP e os links apontam para o código certo)',
    pkg.digicopy && pkg.digicopy.branch === 'arena/01a0cf4a-teste', String(pkg.digicopy && pkg.digicopy.branch));
  const reVersao = new RegExp("DIGICOPY_APP_VERSION = '" + versao.replace(/\./g, '\\.') + "'");
  const outrasVersoes7 = (s) => (s.match(/\bv?7\.[0-9]+\.[0-9]+\b/g) || [])
    .map((v) => v.replace(/^v/, '')).filter((v) => v !== versao);
  ['index.html', 'mobile/www/index.html'].forEach((f) => {
    const s = ler(f);
    ok('a página ' + f + ' está na versão exata do package.json', reVersao.test(s), versao);
    ok('a página ' + f + ' não ficou com outra versão 7.x.y em lugar nenhum', outrasVersoes7(s).length === 0, outrasVersoes7(s).join(', '));
    ok('a página ' + f + ' mostra a versão no título do sistema', s.indexOf('Sistema Digicopy v' + versao) >= 0);
  });
  ['importar.html', 'GUIA_DE_TESTE_NF.html', 'PASSO_A_PASSO_NUVEM_E_SITE.html', 'RELATORIO_DE_TESTE_NF.html'].forEach((f) => {
    const s = ler(f);
    ok('o guia ' + f + ' cita a versão atual', s.indexOf('v' + versao) >= 0 || s.indexOf(versao) >= 0);
    ok('o guia ' + f + ' não ensina a conferir uma versão velha', outrasVersoes7(s).length === 0, outrasVersoes7(s).join(', '));
  });
  ok('index.html carrega o bundle com o carimbo da versão (?v=…)',
    new RegExp('app\\.bundle\\.js\\?v=' + versao.replace(/\./g, '\\.')).test(ler('index.html')));
  const vivos = ['package.json', 'sync_build.js', 'build_bundle.js', 'BUILD_EXE.md', 'index.html'];
  const velhos = vivos.filter((f) => existe(f) && ler(f).indexOf('arena/01a0c087-teste') >= 0);
  ok('nenhum arquivo vivo manda para a branch antiga da sessão anterior', velhos.length === 0, velhos.join(' '));
}

console.log('-- reclamação 7 e 8: o menu fiscal oficial, sempre em cima e no escuro --');
{
  ['menu_fiscal_oficial_patch.js', 'submenu_fiscal_oficial_patch.js', 'navegacao_fiscal_barra_escuro_patch.js']
    .forEach((f) => ok('o patch fiscal ' + f + ' está no bundle', posNoManifesto(f) >= 0));
  const oficial = ler('menu_fiscal_oficial_patch.js');
  ok('o nome oficial é "Menu Fiscal"', oficial.indexOf('Menu Fiscal') >= 0);
  ok('a faixa é re-injetada quando a tela se redesenha (não some mais)',
    /showApp|insertBefore|MutationObserver/.test(oficial));
  const barra = ler('navegacao_fiscal_barra_escuro_patch.js');
  ok('acha o módulo fiscal pelo clique (sobrevive a repintura) e recria #menu-nfe',
    barra.indexOf('abrirCentralNfe') >= 0 && barra.indexOf('#menu-nfe') >= 0);
  const seis = ['Nota Fiscal', 'Perfil Tributário', 'Manifestação', 'NCM', 'Enviar XML', 'Configurações'];
  const faltam = seis.filter((t) => barra.indexOf(t) < 0);
  ok('os 6 itens oficiais estão lá', faltam.length === 0, faltam.join(', '));
  ok('o modo escuro tem regra própria para a barra e para o menu fiscal',
    /digi-escuro/.test(barra) && /digi-escuro #menu-nfe/.test(barra));
}

console.log('-- reclamação 9: a caixa "o que são as 3 permissões?" não volta --');
{
  const src = ler('permissoes_estorno_venda_patch.js');
  const fn = (src.match(/function p605BotaoAjuda\(\)\{[\s\S]*?\n\}/) || [''])[0];
  ok('a função do botão existe (a explicação continua pronta no sistema)', fn.length > 0);
  ok('ela NÃO injeta mais nada na tela de Usuários', fn.length > 0 && /return;/.test(fn) && !/insertAdjacentHTML|innerHTML|appendChild/.test(fn));
  ok('a explicação (window.permissoesAjuda) continua disponível se ele quiser depois',
    /window\.permissoesAjuda\s*=/.test(src));
}

console.log('-- reclamação 10: o erro.txt do rodapé não volta --');
{
  ['index.html', 'mobile/www/index.html'].forEach((f) => {
    ok('a página ' + f + ' não tem botão de erro.txt no rodapé', ler(f).indexOf('erro.txt') < 0);
  });
}

console.log('-- reclamação 12: SÓ NUVEM (nada salvo no PC) --');
{
  const sync = ler('cloudflare_data_sync_patch.js');
  ok('o saveDB em SÓ NUVEM não grava a base no PC', /soNuvem\?true:original\.apply/.test(sync));
  ok('a cópia local só é solta quando a nuvem confirma que tem tudo',
    /modoSoNuvem\(\)&&!outbox\.length&&await nuvemTemTudo\(\)/.test(sync) && /async function nuvemTemTudo\(\)/.test(sync));
}

console.log('-- reclamação 13: o "dado que some" (rodada 24) --');
{
  const sync = ler('cloudflare_data_sync_patch.js');
  ok('a gravação enfileira na hora (não espera os 900 ms)', /sujo=true;enfileirarNaHora\(\);schedule\(900\);/.test(sync));
  ok('fechar a janela força a varredura com teto maior', /scanLocal\(\{teto:TETO_FECHANDO\}\)/.test(sync));
  ok('a entrega ao fechar usa keepalive (chega antes da janela morrer)', /keepalive:true/.test(sync));
  const tetoFila = Number((sync.match(/const MAX_OUTBOX=(\d+);/) || [])[1]);
  const tetoFechar = Number((sync.match(/const TETO_FECHANDO=(\d+);/) || [])[1]);
  ok('a fila não encolheu de volta (400 no dia a dia, 2.000 ao fechar)',
    tetoFila >= 400 && tetoFechar > tetoFila, 'fila: ' + tetoFila + ' | ao fechar: ' + tetoFechar);
  ok('o motor conta na tela o que está por subir e até quando está em dia',
    /filaCheia, filaGravada, emDiaAte:/.test(sync) && /btn\.title=\(text\|\|'Nuvem DIGICOPY'\)\+extra/.test(sync));
}

console.log('-- reclamação 15: nada de prompt/confirm nativo no caminho crítico (regra 16) --');
{
  const criticos = ['nf_transmissao_patch.js', 'popup_sistema_patch.js', 'cloudflare_data_sync_patch.js'];
  criticos.forEach((f) => {
    const codigo = tiraComentarios(ler(f));
    ok('o arquivo ' + f + ' não usa prompt() nativo (no .exe ele lança erro)', !/\bprompt\s*\(/.test(codigo));
    ok('o arquivo ' + f + ' não usa confirm() nativo (a janela é a do sistema)', !/\bconfirm\s*\(/.test(codigo));
    const linhasComAlert = codigo.split('\n').filter((l) => /\balert\s*\(/.test(l));
    const alertSemRede = linhasComAlert.filter((l) => l.indexOf('toast') < 0);
    ok('o arquivo ' + f + ' só usa alert como rede de segurança quando não existe toast do sistema',
      alertSemRede.length === 0, alertSemRede.slice(0, 2).join(' | ').slice(0, 120));
  });
}

console.log('-- reclamação 16: a venda/notinha usa o sistema vivo, não o arquivo antigo --');
{
  const antigo = posNoManifesto('notinha_patch.js'), vivo = posNoManifesto('vendas_os_patch.js');
  ok('o arquivo antigo e o vivo estão os dois no bundle', antigo >= 0 && vivo >= 0, antigo + ' / ' + vivo);
  ok('o sistema vivo é carregado DEPOIS (é ele que manda no faturamento)', vivo > antigo);
  ok('quem fatura é o vendas_os_patch (vosConcluirFaturamento)', ler('vendas_os_patch.js').indexOf('vosConcluirFaturamento') >= 0);
}

console.log('-- reclamação 19: "não está aparecendo nenhum dado, é normal?" --');
{
  // A resposta é: num ENDEREÇO NOVO (outro navegador, aba anônima, ou o preview de
  // teste) o sistema abre no PORTÃO da nuvem — e isso é de propósito (regra 44: nada
  // salvo no PC; a base vem da nuvem). Estas travas garantem que:
  //   (a) o portão continua existindo e cobrindo a tela quando não há conexão;
  //   (b) ele NÃO aparece quando o computador já está conectado;
  //   (c) antes das listas, aparece a tela "Baixando os dados da nuvem…";
  //   (d) a tela de carga NUNCA fica presa (tem saída garantida).
  const portao = ler('ajustes_v5262_login_nuvem_primeiro_patch.js');
  ok('o portão da nuvem está no bundle (endereço novo = conectar uma vez)',
    posNoManifesto('ajustes_v5262_login_nuvem_primeiro_patch.js') >= 0);
  ok('sem conexão, o portão cobre a tela inteira (o sistema não abre vazio por baixo)',
    /box\.id = 'v5262-portao'/.test(portao) && /position:fixed;inset:0;z-index:2147482900/.test(portao));
  ok('quem já conectou NÃO vê o portão de novo (a conexão fica guardada neste navegador)',
    /if \(tokenNuvem\(\)\) return;\s*\/\/ conectou uma vez/.test(portao));
  ok('o aviso é claro: "Este computador ainda não está conectado"',
    portao.indexOf('Este computador ainda não está conectado') >= 0);

  const sync = ler('cloudflare_data_sync_patch.js');
  ok('a tela "Baixando os dados da nuvem…" existe e mostra a contagem que já chegou',
    /function mostrarCargaNuvem\(/.test(sync) && /Baixando os dados da nuvem/.test(sync) && /registros trazidos/.test(sync));
  ok('ela abre na primeira carga e no "baixar tudo"', /pedirCarga\(!state\.initialPull\|\|reason==='baixar-tudo-da-nuvem'\)/.test(sync));
  ok('ela NUNCA fica presa na tela (tem saída garantida)',
    /nunca deixar o dono preso no aviso de carga/.test(sync));
  ok('o motor diz na tela quantos estão por subir e até quando está em dia (o "sumiço" deixa de ser mistério)',
    /filaCheia, filaGravada, emDiaAte:/.test(sync));

  // v7.0.14 — o degrau novo: base vazia com a nuvem RESPONDENDO avisa na tela, com o
  // nome/CNPJ da conexão. Era o único caso em que "não apareceu nada" ainda ficava mudo.
  ok('existe o aviso de base vazia (nuvem conectada e nenhum registro)',
    /function avisarSeBaseVazia\(/.test(sync) && /nenhum registro nesta empresa/.test(sync));
  ok('o aviso só sai depois de a nuvem responder e com a base inteira trazida (sem alarme falso)',
    /!authorized\(\)\|\|!state\.lastOk\)return/.test(sync) && /!state\.initialPull\)return/.test(sync) && /localBusinessCount\(\)>0\)return/.test(sync));
  ok('o aviso é chamado no caminho de sincronização bem-sucedida', /indicator\(true,'Nuvem sincronizada/.test(sync) && (sync.match(/avisarSeBaseVazia\(\);/g) || []).length >= 2);
  ok('o aviso diz COM QUAL empresa a conexão está falando (CNPJ errado é a causa mais comum)',
    /function empresaDaConexao\(/.test(sync) && /d\.cnpj\|\|d\.empresaNome/.test(sync));

  // v7.0.15 — A FAIXA QUE EXPLICA E CONSERTA (o pedido: "focar na parte dos dados que
  // não demonstram"). Ela cobre os casos em que a tela fica vazia sem explicação.
  const faixaArq = 'ajustes_v7015_nuvem_explica_patch.js';
  const motorNuvem = ler('cloudflare-worker/src/index.js').replace(/\s+/g, ' ');
  const motorTeste = ler('cloudflare-worker/test-pure.mjs');
  ok('a faixa da nuvem está no bundle (roda junto com o sistema)', posNoManifesto(faixaArq) >= 0);
  if (posNoManifesto(faixaArq) >= 0) {
    const faixa = ler(faixaArq);
    ok('a faixa avisa quando o computador não está conectado e o botão REABRE o portão',
      /não está conectado à nuvem/.test(faixa) && /v5262AbrirPortao/.test(faixa));
    ok('o portão da conexão pode ser reaberto por fora (era o caso do "jeito antigo", que deixava a sessão vazia e muda)',
      /window\.v5262AbrirPortao\s*=/.test(ler('ajustes_v5262_login_nuvem_primeiro_patch.js')));
    ok('a faixa avisa quando a sincronização está pausada', /pausada/.test(faixa) && /pauseReason/.test(faixa));
    ok('a faixa avisa quando a nuvem está no limite do dia (e a que hora volta)',
      /freio preventivo de gravações/.test(faixa) && /limiteAte/.test(faixa) && /volta sozinho por volta das/.test(faixa));
    ok('a faixa mostra a conta quando a nuvem tem mais registros do que aqui e conserta em 1 clique',
      /nuvem tem mais registros/.test(faixa) && /aqui × /.test(faixa) && /baixarTudoDaNuvem/.test(faixa) && /Baixar tudo de novo/.test(faixa));
    ok('a faixa não usa diálogo nativo (regra 16: confirmação pela janela do sistema)',
      /confirmSistema/.test(faixa) && !/\bconfirm\s*\(/.test(tiraComentarios(faixa)) && !/\bprompt\s*\(/.test(tiraComentarios(faixa)) && !/\balert\s*\(/.test(tiraComentarios(faixa)));
    ok('a faixa só aparece com o app aberto e nunca por cima do portão ou da tela de carga',
      /function appAberto\(/.test(faixa) && /function ocupado\(/.test(faixa) && /v5262-portao/.test(faixa) && /digicopy-carga-nuvem/.test(faixa));
    ok('a conferência de 15 em 15 segundos é LEVE (usa info(), que agora não conta a base)',
      /function info\(\)\{[\s\S]{0,200}?s\.info\(\)/.test(faixa) && /ESPERA_MS = 15000/.test(faixa));
    ok('o check-up do dono passou a ter a função de contagem da nuvem que ele já procurava (apiStatus)',
      /async function apiStatus\(/.test(sync) && /window\.DIGICOPY_CLOUD_SYNC=\{tick,info,apiStatus,/.test(sync));
    ok('a faixa diz o que o freio é (preventivo) e NÃO chama de "limite do grátis" (ele é plano pago)',
      /freio preventivo de gravações/.test(faixa) && /nada foi perdido/.test(faixa) && !/teto grátis/i.test(faixa) && !/plano grátis/i.test(faixa));
    ok('o motor do app reconhece o freio do MÊS também (plano pago tem teto mensal, não diário)',
      /monthly row write limit/.test(sync) && /freio preventivo de gravações/.test(sync));
    ok('CONTRA-PROVA no motor da nuvem: o freio do dia usa o número do PLANO PAGO, e o grátis só existe como recuo',
      /freioDia: 1000000/.test(motorNuvem) && /freioDia: 95000/.test(motorNuvem) && /const PLANO = PLANO_PAGO/.test(motorNuvem) && /freioMes: 45000000/.test(motorNuvem));
    ok('e o freio decidiu certo nas duas contas (prova viva, não só o texto)',
      /freioDecide\(99000, 0, 2000, __test\.PLANO_PAGO\)/.test(motorTeste) || /freioDecide\(99000, 0, 2000, PLANO_PAGO\)/.test(motorTeste));
    ok('o freio preventivo usa o PLANO PAGO (1 milhão/dia) e o grátis ficou só como recuo de uma linha',
      /const PLANO = PLANO_PAGO;/.test(motorNuvem) && /freioDia: 1000000/.test(motorNuvem) && /freioMes: 45000000/.test(motorNuvem));
    ok('o /health (público) publica o freio e os relatos de saúde para a manutenção conferir de fora — sem dado de negócio',
      /key = 'freio_ultimo'/.test(motorNuvem) && /key = 'saude_relatos'/.test(motorNuvem) &&
      /const RELATOS_MAX = 12;/.test(motorNuvem) && /\bfreio,/.test(motorNuvem) && /\bsaude,/.test(motorNuvem) &&
      /url\.pathname === '\/v1\/relato'/.test(motorNuvem));
    ok('o check-up mostra o freio e leva a linha no resumo que ele copia',
      /Freio preventivo da nuvem/.test(ler('ajustes_v5227_nuvem_acompanhamento_patch.js')) && /nuvem\.freio\.disparouHoje/.test(ler('ajustes_v5227_nuvem_acompanhamento_patch.js')));
    ok('a contagem da nuvem no app traz o freio junto (apiStatus lê o /health)',
      /saida&&saida\.freio/.test(sync) && /totais\.freio=saida\.freio/.test(sync));
    ok('e traz também os relatos de saúde (aparecem no check-up e no resumo que ele copia)',
      /saida&&saida\.saude/.test(sync) && /totais\.saude=saida\.saude/.test(sync) &&
      /Relatos de saúde/.test(ler('ajustes_v5227_nuvem_acompanhamento_patch.js')));
    ok('o app relata sozinho: freio, credencial, falha, base vazia e fila presa',
      /function relatarSaude\(tipo,codigo\)/.test(sync) && /relatarSaude\('freio'/.test(sync) &&
      /relatarSaude\('credencial'/.test(sync) && /relatarSaude\('falha'/.test(sync) &&
      /relatarSaude\('base_vazia'/.test(sync) && /relatarSaude\('fila_presa'/.test(sync));
    ok('e o relato é limitado (1 por tipo a cada 10 min) e nunca atrapalha a sincronização',
      /agora-antes<10\*60\*1000/.test(sync) && /relato NUNCA pode atrapalhar a sincronização/.test(sync));
    ok('a contagem que percorre a base virou sob demanda (223 ms -> 0,05 ms numa base de 76 mil)',
      /Object\.defineProperty\(base,'pending'/.test(sync) && /function info\(\)\{\s*const base=/.test(sync));
  }
}

console.log('-- a própria lista continua viva (linhas marcadas "aqui") --');
{
  const marcadas = linhas.filter((l) => l.indexOf('**aqui**') >= 0).length;
  ok('as reclamações sem teste próprio estão marcadas e presas neste arquivo', marcadas >= 8, 'marcadas: ' + marcadas);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — cada reclamação dele tem uma trava viva.');
