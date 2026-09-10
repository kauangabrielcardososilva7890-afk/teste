// Teste v5.24.6 — rodada dele:
//  cota) farol anti-estouro: freio dentro do worker + dedupe + app que respeita
//  planos) (respondido em texto — não há o que testar no código)
//  2.1) o "Nova venda" que restava era o da tela VIVA (vendas_os): removido
//  4.1) 1ª tentativa falhava: busca com índice congelado + base trocada pela
//       nuvem. Cura: índice se refaz sozinho + clique se cura com o dado da
//       busca. E o Salvar que sumia: a ficha voltava aberta no Histórico
//       (que esconde o Salvar) — agora SEMPRE abre em Dados.
//  4.2) clicar num registro que a nuvem já trocou: valida ANTES de abrir,
//       atualiza a lista e avisa.
//  5.x) histórico: linhas com STATUS igual ao módulo; excluído de vez some;
//       orçamento também sai por remoção real (sem marca-fantasma).
const fs = require('fs');
let falhas = 0;
function ok(cond, nome){ if(cond){ console.log('  ✔ ' + nome); } else { falhas++; console.error('  ✘ FALHOU: ' + nome); } }

const worker  = fs.readFileSync('cloudflare-worker/src/index.js', 'utf8');
const appJs   = fs.readFileSync('app.js', 'utf8');
const vos     = fs.readFileSync('vendas_os_patch.js', 'utf8');
const patch   = fs.readFileSync('ajustes_v5243_cliente_abas_patch.js', 'utf8');
const bundle  = fs.readFileSync('app.bundle.js', 'utf8');
const bundleM = fs.readFileSync('mobile/www/app.bundle.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const indexMob  = fs.readFileSync('mobile/www/index.html', 'utf8');
const pkg       = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const P = require('./ajustes_v5243_cliente_abas_patch.js');

console.log('-- cota: farol anti-estouro --');
ok(worker.indexOf("const WORKER_VERSION = '5.24.6'") >= 0, 'worker carimba v5.24.6');
ok(worker.indexOf('LIMITE_ESCRITA_DIA = 95000') >= 0, 'freio preventivo: para de gravar antes do teto');
ok(worker.indexOf('daily row write limit próximo') >= 0, 'pausa do freio usa a frase que o app reconhece');
ok(fs.existsSync('checar_cota_nuvem.js'), 'farol checar_cota_nuvem.js existe (rodar antes de toda versão)');

console.log('-- 2.1: botão da tela VIVA removido --');
ok(vos.indexOf('<button onclick="novaVenda()" class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button>') < 0, '"Nova venda" fora da tela Vendas e Notinhas (vendas_os)');
ok(appJs.indexOf('class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button>') < 0 && fs.readFileSync('notinha_patch.js','utf8').indexOf('class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button>') < 0, 'nenhuma cópia morta do botão restou nas fontes');
ok(bundle.indexOf('class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button>') < 0 && bundleM.indexOf('class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button>') < 0, 'remoção refletida nos 2 bundles');
ok(vos.indexOf("getElementById('modal-title').innerText = 'Nova venda / Notinha'") >= 0, 'atalho Nova notinha continua abrindo o formulário de venda');

console.log('-- 4.1: busca sempre fresca + clique que se cura --');
ok(patch.indexOf('window.__vosCliIdxBase !== base') >= 0, 'índice de clientes se refaz quando a base troca');
ok(patch.indexOf('window.__vosUltBusca[c.id]=c') >= 0, 'busca guarda o que mostrou (fonte da cura)');
ok(patch.indexOf("tick('cura-cliente')") >= 0, 'clique se cura: devolve o cliente à base e marca para subir');
ok(patch.indexOf('(recuperado da busca)') >= 0, 'tela confirma a cura junto com o vínculo');

console.log('-- Salvar garantido: ficha SEMPRE abre em Dados --');
ok(patch.indexOf("aba:'dados', sub:(anterior&&anterior.sub)||'vendas'") >= 0, 'estado novo sempre começa na aba Dados');
ok(patch.indexOf("anterior.aba==='historico'") < 0, 'não reabre mais no Histórico (era o que escondia o Salvar)');

console.log('-- 4.2: clique validado contra a base atual --');
ok(patch.indexOf('já não existe mais neste PC — a lista foi atualizada') >= 0, 'registro trocado pela nuvem: lista atualiza e avisa antes de abrir');

console.log('-- 5.x: status visível + excluído de vez some --');
ok(typeof P.chipStatus === 'function' && P.chipStatus('faturado')[0] === 'Faturada' && P.chipStatus('')[0] === 'Salva', 'PURE: rótulos de status (Faturada/Salva)');
ok(P.chipStatus('vencido')[1].indexOf('red') >= 0 && P.chipStatus('estornada')[1].indexOf('amber') >= 0, 'PURE: cores seguem o módulo (vencido vermelho, estornada âmbar)');
ok((patch.match(/chipStatusHtml\(/g) || []).length >= 6, 'chip aparece nas 5 listagens + definição');
ok(patch.indexOf("String(x.status||'').toLowerCase()==='excluido'") >= 0 && patch.indexOf('x.deletedAt || x.excluido===true') >= 0, 'lista esconde tudo que foi excluído');
ok(patch.indexOf("'Orçamento excluído de vez pela ficha do cliente'") >= 0, 'orçamento excluído de vez (remoção real)');
ok(patch.indexOf("o.status='excluido'") < 0, 'marca-fantasma de orçamento aposentada');
ok(patch.indexOf("' excluído(s) de vez") >= 0, 'aviso da exclusão diz "de vez"');
(function(){
  const db={vendas:[{id:'v1',clienteId:'X',empresaId:'E'},{id:'v2',clienteId:'X',empresaId:'E',deletedAt:1},{id:'v3',clienteId:'X',empresaId:'E',status:'excluido'}],
            contasReceber:[],orcamentos:[{id:'o1',clienteId:'X',empresaId:'F',itens:[]},{id:'o2',clienteId:'X',empresaId:'E',status:'excluido',itens:[]}],os:[],leituras:[]};
  const n=P.contagens(db,'X','E');
  ok(n.vendas===1 && n.orcamentos===0, 'PURE: contagens pulam excluídos e fantasmas');
  ok(P.filtra(db,'vendas','X','E').length===1 && P.filtra(db,'vendas','X','E')[0].id==='v1', 'PURE: filtra limpa + só da empresa');
})();

console.log('-- integridade: bundles e versões --');
ok(bundle.indexOf('__vosUltBusca[c.id]=c') >= 0 && bundleM.indexOf('__vosUltBusca[c.id]=c') >= 0, 'cura 4.1 presente nos 2 bundles');
ok(bundle === bundleM, 'bundles raiz e mobile idênticos');
ok(indexHtml.indexOf("DIGICOPY_APP_VERSION = '5.24.6'") >= 0 && indexHtml.indexOf('app.bundle.js?v=5.24.6') >= 0, 'index.html na v5.24.6');
ok(indexMob.indexOf("DIGICOPY_APP_VERSION = '5.24.6'") >= 0, 'mobile/www/index.html na v5.24.6');
ok(pkg.version === '5.24.6', 'package.json v5.24.6');

if(falhas){ console.error('\n' + falhas + ' FALHA(S) v5.24.6'); process.exit(1); }
console.log('\nTudo certo v5.24.6!');
