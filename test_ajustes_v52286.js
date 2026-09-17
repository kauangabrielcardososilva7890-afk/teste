// ═══════════════════════════════════════════════════════════════════════════
// v5.22.86 — Orçamentos: conserta "window.orcDelItem is not a function".
// A lixeira dos itens do orçamento (tela da v5.22.60) chamava uma função que
// nunca tinha sido criada. Agora existe: remove o item, bloqueia em
// orçamento autorizado e redesenha a lista com o total atualizado.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ ' + name); process.exit(1); } console.log('  ✔ ' + name); }
const ler = f => fs.readFileSync(f, 'utf8');

const o60 = ler('ajustes_v52260_orcamento_trava_venda_atalho_patch.js');
const o37 = ler('ajustes_v52237_orcamentos_menu_patch.js');
const manifest = JSON.parse(ler('bundle-manifest.json'));
const pkg = JSON.parse(ler('package.json'));
const delIni = o60.indexOf('window.orcDelItem = function(');
const del = o60.slice(delIni, delIni + 900);

console.log('== CONSERTO orcDelItem ==');
ok('window.orcDelItem existe de verdade', delIni >= 0);
ok('remove o item da lista do orçamento', /f\.itens\.splice\(idx, 1\)/.test(del));
ok('orçamento autorizado (fechado) não deixa remover', /f\.status === 'aprovado' \|\| f\.vendaId/.test(del) && /Orçamento autorizado não pode ser editado/.test(del));
ok('redesenha a lista depois de remover', /window\.orcRenderItens\(\)/.test(del));
ok('tabela chama a função que agora existe', /onclick="window\.orcDelItem\(' \+ idx \+ '\)"/.test(o60));

console.log('== SIMULAÇÃO DE RUNTIME ==');
// Simula a cadeia: sem a função definida, o clique na lixeira estourava erro.
{
  let chamouRender = 0;
  const form = { itens: [{ descricao: 'A', qtd: 1 }, { descricao: 'B', qtd: 2 }, { descricao: 'C', qtd: 3 }], status: 'aberto' };
  const n = v => { const x = Number(String(v == null ? '' : v).replace(',', '.')); return isFinite(x) ? x : 0; };
  const windowFake = { __ORC_ST: { form }, orcRenderItens: () => chamouRender++ };
  // mesma lógica do patch
  const orcDelItem = function(idx){
    var f = windowFake.__ORC_ST && windowFake.__ORC_ST.form;
    if(!f || !f.itens) return;
    idx = n(idx);
    if(idx < 0 || idx >= f.itens.length) return;
    if(f.status === 'aprovado' || f.vendaId) return;
    f.itens.splice(idx, 1);
    windowFake.orcRenderItens();
  };
  orcDelItem(1);
  ok('remove o item certo e redesenha', form.itens.length === 2 && form.itens[1].descricao === 'C' && chamouRender === 1);
  orcDelItem(9);
  ok('índice inválido é ignorado sem erro', form.itens.length === 2 && chamouRender === 1);
}

console.log('== ESTOQUE (cadeia viva confirmada) ==');
ok('a função de adicionar que VALE hoje (v5.22.37) tem a trava de estoque', /n\(p\.estoque\)<=0 \|\| qtd>n\(p\.estoque\)/.test(o37));

console.log('== CONSISTÊNCIA ==');
ok('nenhum arquivo novo no bundle (um arquivo por módulo; v5.22.93 soma o guardião; v5.22.95 soma o volta-venda; v5.22.96 soma backups; v5.24.0 soma o relatório grande; v5.24.3 soma as abas do cliente; v5.24.25 soma a Central de Nota Fiscal; v5.24.34 soma o monitor+hub do Parque; v5.24.35 soma o remanejo final; v5.24.36 soma a guarda de leitura; v5.25.0 soma a revisão de leituras; v5.26.0 soma o CNPJ+gerente; v5.26.2 soma o login da nuvem primeiro; v5.26.4 soma a data grande do chamado; v6.0.1 soma o Painel do Gerente)', manifest.length === 207);
ok('versão app 5.x-6.x', /^[56]\.\d+\./.test(pkg.version));

console.log('\nRESULTADO: ajustes v5.22.86 passaram!');
