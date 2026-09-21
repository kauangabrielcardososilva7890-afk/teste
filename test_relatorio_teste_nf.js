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
ok('uma caixa por pergunta: 25 perguntas na tela', perguntas.length === 25);
ok('cada pergunta tem EXATAMENTE 3 caixas',
   perguntas.every(p => p.querySelectorAll('input[type=radio]').length === 3));
ok('cada pergunta tem a caixa de texto opcional (observação)',
   perguntas.every(p => p.querySelector('textarea')));
ok('as 3 caixas são: OK, não resolveu, não testei',
   perguntas.every(p => {
     const vals = [...p.querySelectorAll('input[type=radio]')].map(i => i.value).sort().join(',');
     return vals === 'nao,nt,ok';
   }));

// numeração das partes (A1..A6 · B1..B9 · C1..C8 · D1..D2), sem buraco
const esperados = [];
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, 4).forEach((letra, i) => {
  const quantos = [6, 9, 8, 2][i];
  for (let n = 1; n <= quantos; n++) esperados.push(letra + n);
});
ok('numeração completa e na ordem (A1..D2)',
   esperados.length === 25 && esperados.every(n => d.querySelector('input[name="r_' + n + '"]')));

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
d.getElementById('d_rodape').value = 'v6.1.3';
d.getElementById('d_nuvem').value = '5.26.4';
marcar('ONDE', 'exe');
marcar('A1', 'ok');  escrever('t_A1', 'abriu normal, sem undefined');
marcar('B2', 'nao'); escrever('t_B2', 'mostrou erro de internet em vez de senha');
marcar('C4', 'nt');
marcar('D2', 'ok');
escrever('corr_1', 'Financeiro: filtro de data veio vazio');
escrever('ad_1', 'Queria um atalho para imprimir em 2 vias');
escrever('geral', 'Testei só no exe do escritório.');
marcar('VEREDITO', 'ressalvas');

ok('contador acompanha o preenchimento (4 respondidas de 25)',
   /Respondidas: <b>4<\/b> de <b>25<\/b>/.test(d.getElementById('contador').innerHTML));

const r = w.montarTexto();
const txt = r.texto;

ok('tipo salvarArquivo existe (o clique gera e baixa o .txt)', typeof w.salvarArquivo === 'function');
ok('cabeçalho do relatório com data/hora', /RELATÓRIO DE TESTE — SISTEMA DIGICOPY/.test(txt) && /Gerado em \d\d\/\d\d\/\d\d\d\d às \d\dh\d\d/.test(txt));
ok('identificação do teste sai escrita', /Nome\.+: Dono/.test(txt) && /Programa \.exe/.test(txt) && /v6\.1\.3/.test(txt) && /5\.26\.4/.test(txt));
ok('pergunta respondida sai com a marca OK + observação',
   /\[OK \] A1 — .+\n\s+abriu normal, sem undefined/.test(txt));
ok('pergunta não resolvida sai com a marca NAO + observação',
   /\[NAO\] B2 — .+\n\s+mostrou erro de internet em vez de senha/.test(txt));
ok('pergunta não testada sai com a marca NT', /\[NT \] C4 — /.test(txt));
ok('pergunta em branco sai como sem resposta no resumo', /21 sem resposta/.test(txt));
ok('resumo conta certo (2 OK · 1 não resolveu · 1 não testei · 21 sem resposta)',
   /RESUMO: 2 OK · 1 não resolveu · 1 não testei · 21 sem resposta/.test(txt));
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
const txtAntigo = fs.readFileSync('RELATORIO_DE_TESTE_NF.txt', 'utf8');
ok('o .txt antigo avisa que a versão recomendada é o HTML',
   txtAntigo.indexOf('RELATORIO_DE_TESTE_NF.html') >= 0);

// ── 7. O rancho do PC não perde peso: o relatório NÃO entra no bundle/.exe ─
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok('relatório fora do bundle (não pesa na abertura do sistema)', !manifest.includes(ARQ));
ok('relatório fora do build.files (.exe não leva arquivo de teste)', !pkg.build.files.includes(ARQ));

// ── 8. O código do deploy mora no relatório, prontinho para copiar ────────
// Pedido dele (21/09/2026): "o código é meio grande, você pode deixar um botão
// de copiar o código no html do relatório". Aqui a prova é que o texto que
// está na tela é IGUALZINHO ao arquivo do repositório (sem cópia que envelhece).
console.log('\n== CÓDIGO DO DEPLOY (copiar) ==');
ok('seção do plano B existe com o botão de copiar', !!d.getElementById('btn-copiar-deploy') && !!d.getElementById('codigo-deploy'));
const bruto = html.slice(html.indexOf('<pre id="codigo-deploy"'), html.indexOf('</pre>', html.indexOf('<pre id="codigo-deploy"')));
const noPre = bruto.slice(bruto.indexOf('>') + 1);
const desesc = t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const yamlArquivo = fs.readFileSync('deploy_github_actions/publicar-motor.yml', 'utf8');
const norm = t => desesc(t).replace(/\r\n/g, '\n').replace(/\s+$/,'');
ok('o código do relatório é IGUAL ao arquivo do repositório (nada de cópia velha)', norm(noPre) === norm(yamlArquivo));
ok('o código traz os 2 passos do .cmd e os segredos do GitHub',
   noPre.indexOf('d1 migrations apply DB --remote') >= 0 && noPre.indexOf('secrets.CLOUDFLARE_API_TOKEN') >= 0);
ok('o código não roda sozinho (só no botão workflow_dispatch)', noPre.indexOf('workflow_dispatch') >= 0 && noPre.indexOf('push:') < 0);
ok('a página explica o caminho (Actions → New workflow → colar → segredos → Run workflow)',
   html.indexOf('New workflow') >= 0 && html.indexOf('Run workflow') >= 0 && html.indexOf('CLOUDFLARE_ACCOUNT_ID') >= 0);
ok('copiar usa a área de transferência e tem plano B (nunca falha calado)',
   html.indexOf('navigator.clipboard.writeText(texto)') >= 0 && html.indexOf('execCommand') >= 0);

console.log('\nRESULTADO: relatório de teste (HTML) passou!');
