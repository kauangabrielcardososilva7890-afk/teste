// ═════════════════════════════════════════════════════
// TESTE — CAMADAS PROTEGIDAS (o defeito mais caro do sistema em camadas)
//
// O QUE ELE PROVA:
// duas peças do sistema EMBRULHAM funções para proteger comportamento:
//   1. `popup_sistema_patch.js` — troca a janela nativa pela janela do sistema
//      (e o `confirm` nativo global passa pelo popup);
//   2. `permissoes_estorno_venda_patch.js` — `wrapGate`: só deixa apagar/estornar
//      quem tem a permissão.
//
// O embrulho vale enquanto ninguém REDEFINIR aquele nome depois. Se um patch
// novo redefine o nome sem levar o embrulho junto, a proteção some em silêncio:
// a janela volta a ser a do navegador ou a permissão deixa de ser cobrada.
// Este teste lê o MAPA DAS CAMADAS (`mapa_camadas.js`) e reprova quando isso
// acontece SEM que o patch novo (a) chame a função antiga (encadeie) ou
// (b) use a janela do sistema por conta própria (ou confira a permissão).
//
// Isto é guarda-corpo: NÃO muda o funcionamento. Ele só impede a volta do
// padrão "sobrescreveu e esqueceu o que existia".
// ═════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  \u2718 ' + nome + (extra ? '  [' + extra + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome); passou++;
}

const M = require('./mapa_camadas.js');
const r = M.escreverGlobais();
const posicao = {};
r.ordem.forEach((f, i) => { posicao[f] = i; });
const escritas = (nome) => (r.nomes.get(nome) || []).slice().sort((a, b) => a.pos - b.pos);

console.log('== CAMADAS PROTEGIDAS (nada muda no sistema: só confere) ==');
ok('o mapa das camadas foi lido com o parser (acorn), sem chute por texto', r.semParser === false);
ok('o mapa encontrou os nomes globais do sistema (mais de 900)', r.nomes.size > 900, String(r.nomes.size));
ok('e a leitura bate com a realidade: quem ganha o `saveDB` é a sincronização da nuvem',
  (() => { const d = escritas('saveDB').filter((x) => x.tempo === 'no carregamento'); return d.length && d[d.length - 1].arquivo === 'cloudflare_data_sync_patch.js'; })());

// ── 1) o gate de permissão (permissoes_estorno_venda_patch.js) ──────────────
console.log('-- 1) quem apaga/estorna só com permissão: o embrulho continua valendo? --');
{
  const fonte = fs.readFileSync('permissoes_estorno_venda_patch.js', 'utf8');
  const embrulhados = [...fonte.matchAll(/wrapGate\(\s*'([A-Za-z_$][\w$]*)'/g)].map((m) => m[1]);
  ok('li os ' + embrulhados.length + ' nomes embrulhados pelo gate de permissão', embrulhados.length >= 10, embrulhados.join(', '));
  const posGate = posicao['permissoes_estorno_venda_patch.js'];
  const perdidos = [];
  embrulhados.forEach((nome) => {
    const antes = escritas(nome).filter((x) => x.pos < posGate);
    const depois = escritas(nome).filter((x) => x.pos > posGate);
    // Se a função ainda não existia quando o gate rodou, o próprio gate tenta de novo
    // (é o `setTimeout` de 1,2 s): ele pega a versão final. O que NÃO pode é a função
    // já existir, ser embrulhada e depois ser trocada em silêncio.
    if (antes.length && depois.length) perdidos.push(nome + ' → ' + depois[depois.length - 1].arquivo);
  });
  ok('nenhuma função embrulhada pelo gate de permissão foi trocada depois (perdeu o embrulho)'
    + (perdidos.length ? ' — PERDERAM: ' + perdidos.join(' | ') : ''), perdidos.length === 0);
}

// ── 2) o popup do sistema (popup_sistema_patch.js) ────────────────────────
console.log('-- 2) janela do sistema no lugar da janela do navegador --');
{
  const fonte = fs.readFileSync('popup_sistema_patch.js', 'utf8');
  const nomes = new Set();
  // (a) os que o popup troca direto (alert/confirm/lfbAlert/confirmSistema…)
  [...fonte.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)].forEach((m) => nomes.add(m[1]));
  // (b) os que ele embrulha por nome, no mapa de exclusões e nos estornos
  [...fonte.matchAll(/'(delete[A-Za-z]*|estornar[A-Za-z]*|doLogout|excluir[A-Za-z]*)'\s*:/g)].forEach((m) => nomes.add(m[1]));
  [...fonte.matchAll(/window\[?['"]?([A-Za-z_$][\w$]*)['"]?\]?/g)].forEach((m) => nomes.add(m[1]));
  const protegidos = [...nomes].filter((n) => n !== 'confirm' && n !== 'alert' && n !== 'confirmSistema'
    && n !== 'lfbAlert' && n !== 'avisoSistema' && escritas(n).length);
  ok('li os ' + protegidos.length + ' nomes que o popup protege (janela do sistema/exclusões/estornos)',
    protegidos.length >= 5, protegidos.join(', '));

  // A regra: quem redefine depois tem de (a) encadear a versão anterior, (b) usar a
  // janela do sistema, ou (c) conferir a permissão — senão a proteção se perdeu.
  const posPopup = posicao['popup_sistema_patch.js'];
  const semProtecao = [];
  protegidos.forEach((nome) => {
    const depois = escritas(nome).filter((x) => x.pos > posPopup);
    if (!depois.length) return;
    const ult = depois[depois.length - 1];
    const trecho = fs.readFileSync(ult.arquivo, 'utf8');
    const linhas = trecho.split('\n');
    const janela = linhas.slice(Math.max(0, ult.linha - 8), ult.linha + 70).join('\n');
    const encadeia = /old[A-Za-z]*\.apply\s*\(|\borig\.apply\s*\(|\b_f\.apply\s*\(|window\[['"][A-Za-z]+['"]\]\s*\.apply/.test(janela);
    // a janela do sistema entra por vários nomes: `confirmSistema(...)`, o apelido local
    // `confirma(...)` (v5.24.0), `confirmar(...)`, `nfxConfirmar(...)`, `showModal(...)`
    const usaJanelaDoSistema = /confirmSistema|nfxConfirmar|\bconfirmar\s*\(|\bconfirma\s*\(|lfbAlert\s*\(|avisoSistema\s*\(|showModal\s*\(/.test(janela);
    const checaPermissao = /usuarioPode[A-Za-z]*\s*\(|p605Pode\s*\(|usuarioLogado\s*\(/.test(janela);
    if (!(encadeia || usaJanelaDoSistema || checaPermissao)) {
      semProtecao.push(nome + ' → ' + ult.arquivo + ':' + ult.linha);
    }
  });
  ok('toda função que o popup protege e depois foi trocada leva a proteção junto (encadeia, usa a janela do sistema ou confere a permissão)'
    + (semProtecao.length ? ' — SEM PROTEÇÃO: ' + semProtecao.join(' | ') : ''), semProtecao.length === 0);
}

// ── 3) o arquivo do mapa está no repositório e é o mesmo que o teste leu ──
console.log('-- 3) o mapa publicado bate com o que o teste acabou de ler --');
{
  const md = fs.readFileSync('MAPA_CAMADAS.md', 'utf8');
  const total = [...r.nomes.values()].reduce((s, d) => s + d.length, 0);
  const repetidos = [...r.nomes.values()].filter((d) => d.length > 1).length;
  ok('o MAPA_CAMADAS.md está no repositório e diz os mesmos números (' + r.nomes.size + ' nomes, ' + repetidos + ' repetidos)',
    md.indexOf('Nomes globais escritos: **' + r.nomes.size + '**') >= 0 &&
    md.indexOf('Nomes escritos em **2 ou mais** arquivos: **' + repetidos + '**') >= 0 &&
    md.indexOf('Escritas totais (contando as repetições): **' + total + '**') >= 0);
  ok('e o nome mais disputado do sistema aparece nele (o mesmo que o mapa achou)',
    md.indexOf('`' + [...r.nomes.entries()].sort((a, b) => b[1].length - a[1].length)[0][0] + '`') >= 0);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — as funções protegidas (permissão e janela do sistema) continuam protegidas depois de todas as camadas.');
