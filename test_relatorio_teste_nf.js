// ═══════════════════════════════════════════════════════════════════════════
// TESTE — RELATORIO_DE_TESTE_NF.html (relatório de teste do dono em HTML)
//
// Pedido dele (21/09/2026): "nessa do .txt que está em branco, não consegue
// fazer em html igual o de cima? cada pergunta tem 3 caixas (ok, não resolveu,
// não testei/não identifiquei), todas com uma caixa de texto opcional, e uma
// caixa de texto separada; no final clico em salvar e gera um .txt já escrito".
//
// Este teste abre o arquivo de verdade (jsdom), preenche como o dono faria e
// confere o texto que sairia no .txt — inclusive a contagem do resumo.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const { JSDOM } = require('jsdom');

function ok(name, cond){ if (!cond){ console.error('  ✘ ' + name); process.exit(1); } console.log('  ✔ ' + name); }

const ARQ = 'RELATORIO_DE_TESTE_NF.html';
const html = fs.readFileSync(ARQ, 'utf8');

console.log('== RELATÓRIO DE TESTE (HTML) ==');

// ── 1. Nada de popup nativo e nada de dependência externa ──────────────────
ok('sem alert/confirm/prompt nativos (regra do projeto)',
   !/[\s(]alert\s*\(|[\s(]confirm\s*\(|[\s(]prompt\s*\(/.test(html));
ok('arquivo é sozinho: nenhum script/css de fora',
   !/<script[^>]+src=|<link[^>]+rel="stylesheet"/i.test(html));
ok('não pede senha/token: aviso de segredo impresso na tela',
   /Nunca escreva senha, token, certificado, CSC/.test(html));

// ── 2. Abre de verdade e confere a estrutura decidida com o dono ───────────
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://teste-60f.pages.dev/' + ARQ });
const w = dom.window, d = w.document;

const perguntas = [...d.querySelectorAll('.item.pergunta')];
ok('uma caixa por pergunta: 55 perguntas na tela (46 + 5 da PARTE I + 4 da PARTE J: memória da tela e conferência da NF-e)', perguntas.length === 55);
ok('cada pergunta tem EXATAMENTE 3 caixas',
   perguntas.every(p => p.querySelectorAll('input[type=radio]').length === 3));
ok('cada pergunta tem a caixa de texto opcional (observação)',
   perguntas.every(p => p.querySelector('textarea')));
ok('as 3 caixas são: OK, não resolveu, não testei',
   perguntas.every(p => {
     const vals = [...p.querySelectorAll('input[type=radio]')].map(i => i.value).sort().join(',');
     return vals === 'nao,nt,ok';
   }));

// numeração das partes (A1..A6 · B1..B9 · C1..C8 · D1..D2 · E1..E6 · F1..F4 · G1..G3 · H1..H7 · I1..I5), sem buraco
const esperados = [];
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, 10).forEach((letra, i) => {
  const quantos = [6, 9, 8, 2, 6, 4, 4, 7, 5, 4][i];
  for (let n = 1; n <= quantos; n++) esperados.push(letra + n);
});
ok('numeração completa e na ordem (A1..J4)',
   esperados.length === 55 && esperados.every(n => d.querySelector('input[name="r_' + n + '"]')));
// As 3 partes novas (22/09/2026): nuvem automática, contratos e rodapé
ok('PARTE E pergunta a sincronização automática (conectou = sincroniza)',
   html.indexOf('PARTE E — SINCRONIZAÇÃO AUTOMÁTICA') >= 0 &&
   html.indexOf('sincronizou SOZINHO') >= 0 && html.indexOf('Check-up da nuvem') >= 0);
ok('PARTE F pergunta contrato sem vínculo e o botão de vincular na mão',
   html.indexOf('PARTE F — CONTRATOS E CLIENTES') >= 0 &&
   html.indexOf('Cliente sem vínculo') >= 0 && html.indexOf('🔗 Vincular cliente') >= 0);
ok('PARTE H lista o que esta rodada mudou (NF em aba, um olho, PC↔PC)',
   html.indexOf('PARTE H — NOVO DE 22/09 (nº4)') >= 0 &&
   html.indexOf('Nova nota fiscal em ABA') >= 0 &&
   html.indexOf('um olho só') >= 0 &&
   html.indexOf('Um PC criou algo e o OUTRO PC mostrou') >= 0);
ok('PARTE G pergunta a versão e o carimbo do rodapé',
   html.indexOf('PARTE G — VERSÃO NO RODAPÉ') >= 0 && html.indexOf('carimbo') >= 0);
// 22/09/2026 — ele reclamou: "tem algumas das mesmas perguntas, você não anotou
// o que foi resolvido?" → cada pergunta traz o selo e existe o filtro.
ok('pergunta já resolvida vem marcada (✅ resolvido antes)',
   d.querySelectorAll('.item.pergunta[data-estado="ok"]').length === 3 &&
   html.indexOf('✅ resolvido antes') >= 0);
ok('pergunta nova de 22/09 vem marcada (🆕 novo de 22/09)',
   d.querySelectorAll('.item.pergunta[data-estado="novo"]').length === 30);
ok('existe o filtro "só o que falta testar"',
   !!d.getElementById('so_faltando') && html.indexOf('só o que falta testar') >= 0);

// filtro na prática: marcado esconde as "ok" e mostra a contagem
(function(){
  const chk = d.getElementById('so_faltando');
  const total = d.querySelectorAll('.item.pergunta').length;
  chk.checked = true; chk.dispatchEvent(new w.Event('change', { bubbles: true }));
  const visiveis = [...d.querySelectorAll('.item.pergunta')].filter(el => !el.classList.contains('item-escondido')).length;
  ok('filtro esconde só as 3 já resolvidas (' + visiveis + ' de ' + total + ')', visiveis === total - 3);
  ok('o contador do filtro mostra quantas faltam', /perguntas em aberto/.test(d.getElementById('contagem-filtro').textContent));
  chk.checked = false; chk.dispatchEvent(new w.Event('change', { bubbles: true }));
})();

// ── 3. Campos do dono: onde testou, correções, adições, caixa separada ─────
ok('"onde você testou" com 3 caixas (navegador / .exe / os dois)',
   d.querySelectorAll('input[name="r_ONDE"]').length === 3);
ok('veredicto com 3 caixas (aprovado / com ressalvas / reprovado)',
   d.querySelectorAll('input[name="r_VEREDITO"]').length === 3);
ok('5 linhas livres de CORREÇÕES', [1,2,3,4,5].every(i => d.getElementById('corr_' + i)));
ok('5 linhas livres de ADIÇÕES', [1,2,3,4,5].every(i => d.getElementById('ad_' + i)));
ok('caixa de texto separada (observações gerais)', !!d.getElementById('geral'));
ok('botão de salvar o .txt', /Salvar relatório \(\.txt\)/.test(d.getElementById('btn-salvar').textContent));
ok('botões de prévia e copiar (plano B se o download não rolar)',
   !!d.getElementById('btn-previa') && !!d.getElementById('btn-copiar'));
ok('contador "respondidas de total" na barra', /Respondidas/.test(d.getElementById('contador').innerHTML));

// ── 4. Preenche como o dono preencheria e confere o .txt gerado ────────────
function marcar(nome, valor){
  const el = d.querySelector('input[name="r_' + nome + '"][value="' + valor + '"]');
  el.checked = true;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
}
function escrever(id, texto){
  const el = d.getElementById(id);
  el.value = texto;
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
}

d.getElementById('d_nome').value = 'Dono';
d.getElementById('d_rodape').value = 'v6.1.10 + a5f67dad';
d.getElementById('d_nuvem').value = '5.26.5';
marcar('ONDE', 'exe');
marcar('A1', 'ok');  escrever('t_A1', 'abriu normal, sem undefined');
marcar('B2', 'nao'); escrever('t_B2', 'mostrou erro de internet em vez de senha');
marcar('C4', 'nt');
marcar('D2', 'ok');
marcar('E1', 'ok');   escrever('t_E1', 'conectou e sincronizou sozinho, sem perguntar nada');
marcar('E2', 'ok');
marcar('F1', 'ok');   escrever('t_F1', 'o contrato 40 agora mostra o cliente certo');
marcar('G1', 'ok');
escrever('corr_1', 'Financeiro: filtro de data veio vazio');
escrever('ad_1', 'Queria um atalho para imprimir em 2 vias');
escrever('geral', 'Testei só no exe do escritório.');
marcar('VEREDITO', 'ressalvas');

ok('contador acompanha o preenchimento (8 respondidas de 52 EM ABERTO)',
   /Respondidas: <b>8<\/b> de <b>52<\/b> em aberto/.test(d.getElementById('contador').innerHTML));
ok('o contador separa o que já foi resolvido antes (não repete pergunta resolvida)',
   /3 já resolvidas antes/.test(d.getElementById('contador').innerHTML));

const r = w.montarTexto();
const txt = r.texto;

ok('tipo salvarArquivo existe (o clique gera e baixa o .txt)', typeof w.salvarArquivo === 'function');
ok('cabeçalho do relatório com data/hora', /RELATÓRIO DE TESTE — SISTEMA DIGICOPY/.test(txt) && /Gerado em \d\d\/\d\d\/\d\d\d\d às \d\dh\d\d/.test(txt));
ok('identificação do teste sai escrita', /Nome\.+: Dono/.test(txt) && /Programa \.exe/.test(txt) && /v6\.1\.10/.test(txt) && /5\.26\.5/.test(txt) && /a5f67dad/.test(txt));
ok('pergunta respondida sai com a marca OK + observação',
   /\[OK \] A1 — .+\n\s+abriu normal, sem undefined/.test(txt));
ok('pergunta não resolvida sai com a marca NAO + observação',
   /\[NAO\] B2 — .+\n\s+mostrou erro de internet em vez de senha/.test(txt));
ok('pergunta não testada sai com a marca NT', /\[NT \] C4 — /.test(txt));
ok('pergunta em branco sai como sem resposta no resumo', /45 sem resposta/.test(txt));
ok('resumo conta certo (5 OK · 1 não resolveu · 1 não testei · 45 sem resposta)',
   /RESUMO: 5 OK · 1 não resolveu · 1 não testei · 45 sem resposta/.test(txt));
ok('o .txt separa as 3 que já estavam resolvidas antes (fora da conta de sem resposta)',
   /3 já resolvida\(s\) antes/.test(txt) && /\[JA OK\] C5/.test(txt));
ok('pergunta em branco sai marcada como "---" no corpo do relatório',
   /\[---\] B1 — /.test(txt));
ok('CORREÇÕES e ADIÇÕES saem escritas', /C1: Financeiro: filtro de data veio vazio/.test(txt) && /A1: Queria um atalho para imprimir em 2 vias/.test(txt));
ok('observações gerais saem escritas', /Testei só no exe do escritório\./.test(txt));
ok('veredicto sai escrito', /APROVADO COM RESSALVAS/.test(txt));
ok('rodapé do .txt lembra que não pode ter segredo no arquivo',
   /Nenhuma senha, token,/.test(txt) && /certificado ou CSC deve estar neste arquivo/.test(txt));
ok('nome do arquivo sai com data e hora', /^relatorio-teste-digicopy-\d{4}-\d\d-\d\d-\d{4}\.txt$/.test(r.nomeArquivo || w.nomeArquivo()));

// ── 5. Rascunho guardado (não perder o que ele escreveu) ───────────────────
ok('rascunho é salvo no navegador (localStorage)',
   /localStorage\.setItem\(CHAVE/.test(html) && /digicopy_relatorio_teste_v1/.test(html));

// ── 6. O guia aponta para o relatório novo e o .txt fica como plano B ──────
const guia = fs.readFileSync('GUIA_DE_TESTE_NF.html', 'utf8');
ok('GUIA_DE_TESTE_NF.html aponta para o relatório em HTML',
   guia.indexOf('RELATORIO_DE_TESTE_NF.html') >= 0);
// v6.1.5 — ele mandou apagar o .txt em branco (22/09/2026)
ok('o RELATORIO_DE_TESTE_NF.txt foi apagado (ordem dele)', !fs.existsSync('RELATORIO_DE_TESTE_NF.txt'));
ok('o guia não manda mais usar o .txt apagado', guia.indexOf('RELATORIO_DE_TESTE_NF.txt</b> continua valendo') < 0);

// ── 7. O rancho do PC não perde peso: o relatório NÃO entra no bundle/.exe ─
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok('relatório fora do bundle (não pesa na abertura do sistema)', !manifest.includes(ARQ));
ok('relatório fora do build.files (.exe não leva arquivo de teste)', !pkg.build.files.includes(ARQ));

// ── 8. O passo de publicar o motor é o REAL (ordem dele, 22/09/2026: "esquece
// o assunto do worker, só ensina o passo real") ─────────────────────────────
console.log('\n== PASSO REAL DE PUBLICAR O MOTOR ==');
ok('a seção ensina o atualizar_motor_nuvem.cmd (o arquivo que existe)',
   html.indexOf('atualizar_motor_nuvem.cmd') >= 0);
ok('a seção não pede token, painel nem GitHub',
   html.indexOf('CLOUDFLARE_API_TOKEN') < 0 && html.indexOf('New workflow') < 0 &&
   html.indexOf('sem painel, sem token, sem GitHub') >= 0);
ok('explica os 4 passos que a janela mostra (listar, migrar, publicar, health)',
   html.indexOf('Proceed? (y/n)') >= 0 && html.indexOf('wrangler deploy') >= 0 && html.indexOf('"versao":"5.26.9"') >= 0);
ok('diz que a janela fica aberta e que é para mandar foto',
   /tire uma foto|Foto e me manda|foto dela/i.test(html));
ok('o arquivo do .cmd existe de verdade no repositório (o passo não é invenção)',
   fs.existsSync('atualizar_motor_nuvem.cmd'));

console.log('\nRESULTADO: relatório de teste (HTML) passou!');
