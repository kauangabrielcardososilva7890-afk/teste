// test_ajustes_v52421.js — v5.24.21: RELATORIO GRANDE dele (pacote 1 de 2).
// P1 orçamento fantasma: render vivo guarda os OBJETOS das linhas; o abrir
// resgata em silêncio se o banco sumiu com o id (e anota pro diagnóstico).
// P2 plaquinha neutra da aba OS some (estados verde/âmbar ficam).
// P3 "Pré-visualizar NF-e" não mora mais na tela de consultar notinhas.
// P4 "Mostrando 300 de N" só aparece quando a lista está visível.
// P9 "DE DE / ATÉ ATÉ": o v5.22.45 confere o rótulo já existente antes de
//    enfiar outro.
// P10 financeiro: datas/tipo/ordem NÃO aplicam sozinhos — botões Filtrar e
//    Remover filtro assumem a aplicação.
// P11 clientes: mesma régua — Enter ou Filtrar aplicam; Remover filtro limpa
//    a tela; a lista só aparece depois do primeiro filtro da visita.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const orc58 = fs.readFileSync('ajustes_v52258_orcamento_os_revalidar_patch.js', 'utf8');
const orc37 = fs.readFileSync('ajustes_v52237_orcamentos_menu_patch.js', 'utf8');
const vos = fs.readFileSync('vendas_os_patch.js', 'utf8');
const fluxos = fs.readFileSync('fluxos_operacionais_patch.js', 'utf8');
const nfe10 = fs.readFileSync('ajustes_v52210_historico_checkbox_nfe_patch.js', 'utf8');
const nfe9 = fs.readFileSync('ajustes_v5229_nfe_atalho_historico_patch.js', 'utf8');
const fin45 = fs.readFileSync('ajustes_v52245_financeiro_hist_datas_patch.js', 'utf8');
const fin43 = fs.readFileSync('ajustes_v52243_financeiro_filtros_patch.js', 'utf8');
const noti = fs.readFileSync('notinha_patch.js', 'utf8');

// P1 — orçamento
ok(orc58.includes('window.__orcUltimaLista = mapa'), 'P1: render vivo memoriza os objetos da tela');
ok(orc58.includes("__orc_render_ids"), 'P1: render vivo também atualiza o retrato dos ids');
ok(orc37.includes('RESGATE SILENCIOSO'), 'P1: abrirOrcamento tem o resgate');
ok(orc37.includes('window.__orcResgates'), 'P1: resgate anotado em __orcResgates');
ok(orc37.includes('store().push(achado)'), 'P1: o banco ganha a linha de volta antes de abrir');
ok(orc37.includes('Resgates feitos pela autocura'), 'P1: diagnóstico conta os resgates se o aviso ainda aparecer');
ok(!orc37.includes('Não achei esse orçamento neste PC agora. (Vazio'), 'P1: aviso velho não perdeu o gás do diagnóstico');

// P2 — plaquinha OS
ok(!vos.includes('Aba OS opcional. Se ficar vazia, a venda sai como'), 'P2: plaquinha neutra SOME da aba OS');
ok(vos.includes("el.style.display='none'"), 'P2: ela apaga de verdade (sem moldura)');
ok(vos.includes('OS completa!'), 'P2: estados verde (completa) seguem vivos');
ok(vos.includes('OS incompleta.'), 'P2: âmbar (incompleta) segue vivo');

// P3 — notinha sem NF-e prévia
ok(nfe10.includes('injeção desligada nesta tela'), 'P3: v52210 desliga o botão na consulta de notinha');
ok(!/b=botao\('btn-nfe-venda-lista','neo-btn'/.test(nfe10), 'P3: o botão venda não é mais fabricado');
ok(nfe9.includes('nada de "Pré-visualizar NF-e" na tela de consultar notinha') || nfe9.includes('morto.remove()'), 'P3: v5229 também blinda a tela');
ok(nfe10.includes("botao('btn-nfe-leitura-hist'"), 'P3: botão das leituras CONTINUA (ele não pediu pra tirar)');

// P4 — hint de produtos
ok(fluxos.includes('list.length > vis.length && vis.length > 0'), 'P4: "Mostrando 300 de N" só com lista visível');
ok(fluxos.includes('Use a busca para refinar'), 'P4: o hint continua existindo quando a busca renderiza');

// P9 — DE DE
ok(fin45.includes('jaTemDe'), 'P9: v52245 confere rótulo De existente');
ok(fin45.includes('jaTemAte'), 'P9: v52245 confere rótulo Até existente');
ok(fin45.includes('previousElementSibling'), 'P9: a conferência olha o irmão do campo');

// P10 — financeiro
ok(fin43.includes('finAplicarFiltroV52421'), 'P10: botão Filtrar existe');
ok(fin43.includes('finRemoverFiltroV52421'), 'P10: botão Remover filtro existe');
ok(!fin43.includes("if(el) el.onchange=function(){ window.finBuscarV52243(); };"), 'P10: datas/tipo/ordem NÃO aplicam mais sozinhos');
ok(fin43.includes("ST.de=''; ST.ate=''; ST.tipo='todos'; ST.ordem='venc-asc'"), 'P10: Remover filtro zera data, tipo e ordenação');
ok(fin43.includes('bg-amber-500'), 'P10: Filtrar avisa quando há escolha pendente (laranja)');

// P11 — clientes
ok(noti.includes("if(!window.__cliFoiFiltrado) list=[]"), 'P11: a lista só aparece depois de filtrar');
ok(noti.includes('cli-btn-filtrar'), 'P11: botão Filtrar existe');
ok(noti.includes('cli-btn-remover-filtro'), 'P11: botão Remover filtro existe');
const cliPatch = fs.readFileSync('clientes_patch.js', 'utf8');
ok(!noti.includes('oninput="renderClientes()"') && !cliPatch.includes('oninput="renderClientes()"'), 'P11: a caixa NÃO aplica mais sozinha (neo + clássico)');
ok(noti.includes("e.key==='Enter'"), 'P11: Enter aplica');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('__orcUltimaLista'), 'bundle: resgate presente');
ok(bundle.includes('finAplicarFiltroV52421'), 'bundle: financeiro novo presente');
ok(bundle.includes('cli-btn-remover-filtro'), 'bundle: clientes novo presente');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('__orcUltimaLista'), 'bundle do CELULAR igual');
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '5.24.21'"), 'index: versão 5.24.21');
ok(fs.readFileSync('index.html', 'utf8').includes('>v5.24.21<'), 'index: rodapé v5.24.21');
ok(fs.readFileSync('package.json', 'utf8').includes('"version": "5.24.21"'), 'package.json 5.24.21');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v5.24.21 pacote 1 (P1 resgate orçamento, P2, P3, P4, P9, P10, P11).');
