// test_ajustes_v6005.js — v6.0.5: PERMISSÕES (NF/apagar/estornar) + NOTINHA
// ESTORNADA ABRE NA ABA + FINANCEIRO MOSTRA EXTORNADO
const fs = require('fs');
let pass = 0, fail = 0;
function ok(nome, cond) { if (cond) { pass++; console.log('  ok -', nome); } else { fail++; console.log('  FALHOU -', nome); } }

const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const p605 = fs.readFileSync('permissoes_estorno_venda_patch.js', 'utf8');
const v5240 = fs.readFileSync('ajustes_v5240_relatorio_grande_patch.js', 'utf8');
const appjs = fs.readFileSync('app.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const mob = fs.readFileSync('mobile/www/index.html', 'utf8');

console.log('== FILA / BUNDLE ==');
ok('manifesto sobe pra 210+4; permissões/estorno na 210, menu fiscal 211; Início clicável 212; menus separados v6.0.8 (212); override v6.0.9 (214); 6 submenus (215); hover NF-e/NFC-e v6.0.11 fecha a fila', man.length === 216 && man[210] === 'fiscal_menu_completo_patch.js' && man[209] === 'permissoes_estorno_venda_patch.js' && man[211] === 'dashboard_inicio_clicavel_patch.js' && man[212] === 'menus_fiscais_separados_patch.js' && man[213] === 'permissoes_override_menus_fiscais_patch.js' && man[214] === 'seis_submenus_velho_patch.js' && man[215] === 'submenu_hover_nfe_patch.js' && man[208] === 'perfis_nuvem_cura_sessao_patch.js' && man[205] === 'fiscal_guard_patch.js');
ok('bundle contém o patch (PURE + banner)', bundle.indexOf('P605_PURE_START') >= 0 && bundle.indexOf('v6.0.5 — permissões no editor') >= 0);

console.log('== PERMISSÕES (editor do usuário) ==');
ok('PURE exportada e testável', p605.indexOf("module.exports={p605Perfil") >= 0);
ok('bloco fica DENTRO do editor (ações → editar), não só na coluna', p605.indexOf("p605-permissoes") >= 0 && p605.indexOf("corpo.querySelector('#u-nome')") >= 0);
ok('bloco invisível para funcionário (só Admin/Dono mexe)', p605.indexOf("if(p605Perfil(eu)==='Funcionário') return;") >= 0);
ok('3 caixas: NF + apagar + estornar', p605.indexOf("'u-perm-nfe'") >= 0 && p605.indexOf("'u-perm-apagar'") >= 0 && p605.indexOf("'u-perm-estornar'") >= 0);
ok('saveUsuario aplica as caixas + audita mudança', p605.indexOf("embrS.__p605=true") >= 0 && p605.indexOf("logAction('usuario','permissoes'") >= 0);

const P = require('./permissoes_estorno_venda_patch.js');
ok('PURE: Admin/Dono sempre podem (anti-trancamento)', P.p605Pode({ perfil: 'Admin' }, 'apagar') && P.p605Pode({ perfil: 'Dono' }, 'estornar'));
ok('PURE: funcionário existe → apagar/estornar PERMITIDOS por padrão (não trava ninguém do nada)', P.p605Pode({ perfil: 'Comercial' }, 'apagar') && P.p605Pode({ perfil: 'Técnico' }, 'estornar'));
ok('PURE: funcionário NF fica DESMARCADA por padrão', !P.p605Pode({ perfil: 'Comercial' }, 'emitirNfe') && !P.p605ValorCaixa({ perfil: 'Comercial' }, 'emitirNfe'));
ok('PURE: desmarcado BLOQUEIA de verdade', !P.p605Pode({ perfil: 'Comercial', podeApagar: false }, 'apagar') && !P.p605Pode({ perfil: 'Comercial', podeEstornar: false }, 'estornar'));

console.log('== BLOQUEIO REAL (gates nos executores) ==');
['excluirVendaUnificado','deleteVenda','excluirChamadosSelecionados','excluirChamadoV52422','excluirOrcamento','excluirOrcamentosMarcados','removerLancamentoLeitura','estornarVenda','estornarVendasSelecionadas','estornarLeituraContrato','estornarNotinha'].forEach(function(fn){
  ok('gate: ' + fn, p605.indexOf("wrapGate('" + fn + "'") >= 0);
});
ok('tentativa negada vira aviso do sistema + trilha na Auditoria', p605.indexOf("logAction('seguranca','negado'") >= 0 && p605.indexOf('NÃO tem permissão') >= 0);

console.log('== ESTORNADA ABRE NA ABA DA VENDA ==');
ok('historicoVenda redireciona estornada (sem modal que não devia existir)', p605.indexOf("embrH.__p605=true") >= 0 && p605.indexOf("abrirVendaEstornadaEdicao") >= 0);
ok('aba vem carregada: cliente + itens + desconto', p605.indexOf('selectClienteVenda(v.clienteId)') >= 0 && p605.indexOf('window.itensTemp=(v.itens||[])') >= 0 && p605.indexOf('nvDesc.value=Number(v.desconto)||0') >= 0);
ok('salvar ATUALIZA a mesma notinha (número mantido)', p605.indexOf('__editandoVendaEstornadaId') >= 0 && p605.indexOf("logAction('venda','refazer-pos-estorno'") >= 0);
ok('estoque nunca em dobro: devolve antigos, baixa novos', p605.indexOf('mexeEstoque(it,+1)') >= 0 && p605.indexOf('mexeEstoque(it,-1)') >= 0);
ok('status padrão seguro no refazer (orçamento, sem título novo sem escolha)', p605.indexOf("nvSt.value='orcamento'") >= 0);

console.log('== ESTORNO MARCA (não apaga) + FINANCEIRO MOSTRA ==');
ok('títulos da venda extornada ficam MARCADOS (status estornado)', v5240.indexOf("c.status = 'estornado';") >= 0 && v5240.indexOf('c.estornadoPor') >= 0);
ok('a deleção antiga MORREU (título não some mais do Financeiro)', v5240.indexOf('DB().contasReceber = arr.filter(function(c){ return !(c && c.vendaId === v.id); })') < 0);
ok('financeiro: extornado fora do "vencido" e com estilo próprio', appjs.indexOf("cr.status!=='estornado'; const status=isVenc") >= 0 && appjs.indexOf("estornado:'bg-slate-100 text-slate-500 border-slate-200'") >= 0);
ok('financeiro: tarja EXTORNADO no lugar do checkbox de baixa', appjs.indexOf('>EXTORNADO</span>') >= 0 && appjs.indexOf("cr.status==='estornado'?") >= 0);
// unidade REAL do estorno (marca títulos, mantém registro)
// (o patch 5240 foi feito pro navegador: damos um window FALSO pro require)
global.window = {};
global.db = { contasReceber: [
  { id: 'cr1', vendaId: 'v1', status: 'aberto', valor: 10 },
  { id: 'cr2', vendaId: 'v1', status: 'pago', valor: 5 },
  { id: 'cr3', vendaId: 'v2', status: 'aberto', valor: 7 }
] };
const V5240 = require('./ajustes_v5240_relatorio_grande_patch.js');
const vFake = { id: 'v1', numero: '26', status: 'faturado' };
V5240.estornarUmaVenda(vFake);
ok('estorno marca a venda como estornada', vFake.status === 'estornada' && !!vFake.estornadoEm && !!vFake.estornadoPor);
ok('estorno MARCA os 2 títulos como extornado e NÃO remove nada', global.db.contasReceber.length === 3 && global.db.contasReceber[0].status === 'estornado' && global.db.contasReceber[1].status === 'estornado' && global.db.contasReceber[1].estornoDe === 'pago' && global.db.contasReceber[2].status === 'aberto');
delete global.db;
delete global.window;

console.log('== CARIMBO 6.0.5 ==');
ok('package.json na 6.0.5', pkg.version === '6.0.11');
ok('index.html carimbado (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '6.0.11'") >= 0 && html.indexOf('>v6.0.11<') >= 0 && html.indexOf('app.bundle.js?v=6.0.11') >= 0);
ok('celular carimbado 6.0.5', mob.indexOf("DIGICOPY_APP_VERSION = '6.0.11'") >= 0 && mob.indexOf('>v6.0.11<') >= 0);

console.log('\n' + pass + ' passaram, ' + fail + ' falharam.');
if (fail > 0) process.exit(1);
console.log('Tudo OK — v6.0.5: caixas de permissão no editor (só Admin/Dono) com bloqueio real nos executores; notinha extornada abre na aba carregada e salvar mantém o número; financeiro mostra EXTORNADO visível e fora das somas.');
