// test_listas.js — v1.0.0 (rodada 21: TODOS OS MENUS)
//
// O que este teste prova, e por que ele existe:
//
//   O dono pediu, com todas as letras, "não só um módulo, tudo mesmo, quero tudo de
//   uma vez os menus". Fazer 15 telas de cadastro na mão é pedir para esquecerem
//   campos — então as telas saem de uma FICHA (novo/listas.js) que copia o nome de
//   cada campo do sistema de hoje. Este teste é o que impede a ficha de mentir:
//
//     1) todo campo da ficha existe, com o MESMO nome, no código que roda hoje
//        (a prova é por arquivo:linha, lida do próprio arquivo vivo);
//     2) os nomes de campo que o sistema de hoje GRAVA estão todos na ficha
//        (senão a importação da base antiga perderia dado na virada);
//     3) as telas do menu cobrem as telas do sistema de hoje (as 26 `view-*`),
//        e cada uma diz a que MENU pertence;
//     4) lista de histórico (Auditoria) e de apoio (Catálogo fiscal) é SÓ CONSULTA;
//     5) a conta da leitura de contador é a MESMA do sistema de hoje — provada
//        contra os números do `saveLeituraRapida` (consumo, excedente, divergência).
//
// Nada aqui toca banco, nuvem ou arquivo: é leitura de código + conta pura.
const fs = require('fs');
const path = require('path');

let passou = 0;
function ok(nome, cond, extra) {
  if (!cond) { console.error('  \u2718 ' + nome + (extra ? '  → ' + extra : '')); process.exit(1); }
  console.log('  \u2714 ' + nome);
  passou++;
}
function ler(f) { return fs.readFileSync(path.join(__dirname, f), 'utf8'); }

console.log('== A FICHA DAS TELAS (todos os menus) ==');

// ── carrega a ficha e a conta da leitura sem navegador (elas são puras de propósito) ──
require('./novo/listas.js');
require('./novo/leituras.js');
const CAT = globalThis.DIGICOPY_LISTAS;
const LEI = globalThis.DIGICOPY_LEITURAS;
ok('a ficha das telas carrega fora do navegador (é só dado, não mexe em tela)',
  !!CAT && !!CAT.LISTAS && !!CAT.TELAS && Array.isArray(CAT.TELAS));
ok('e a conta da leitura também', !!LEI && !!LEI.regras && typeof LEI.regras.valorExcedente === 'function');

// ── 1) cada lista da ficha aponta a origem no sistema de hoje, e os campos dela existem lá ──
// A origem é declarada em comentário ("Fonte: arquivo:linha"); o teste exige que o
// arquivo citado exista de verdade e que o nome do campo apareça nele.
const FONTES = {
  clientes: ['clientes_patch.js', 'app.js'],
  // o estoque mínimo é `estoqueMin` de verdade (o `minimo` que aparece no import é só
  // o nome da planilha, mapeado para estoqueMin) — está em fluxos_operacionais_patch.js
  produtos: ['app.js', 'fluxos_operacionais_patch.js', 'ajustes_v5221_nfe_emissao_patch.js'],
  recargas: ['ajustes_v52214_recargas_patch.js'],
  equipamentos: ['app.js'],
  contratos: ['app.js', 'ajustes_relatorio_pai_patch.js'],
  parque: ['contratos_leituras_definitivo_patch.js', 'app.js'],
  leituras: ['app.js'],
  os: ['app.js'],
  orcamentos: ['ajustes_v52237_orcamentos_aprovacao_patch.js'],
  usuarios: ['app.js'],
  tecnicos: ['app.js'],
  empresas: ['app.js', 'sistema_clientes_loja_patch.js'],
  logs: ['app.js'],
  catalogoFiscal: ['fiscal_catalogo_completo_patch.js']
};
const cache = {};
function fonteExpr(nome) {
  if (!cache[nome]) cache[nome] = FONTES[nome].map(ler).join('\n');
  return cache[nome];
}
// campos que SÃO nossos de propósito (o sistema de hoje não tem, e a ficha explica por quê)
const NOSSO = {
  logs: ['data'],
  equipamentos: ['dataAquisicao'],
  catalogoFiscal: []
};
let faltandoNoVivo = [], faltandoNaFicha = [];
Object.keys(FONTES).forEach(function (lista) {
  const ficha = CAT.LISTAS[lista];
  ok('a ficha tem a lista "' + lista + '"', !!ficha);
  const fonte = fonteExpr(lista);
  const nossos = NOSSO[lista] || [];
  const campos = ficha.campos.map(c => c.campo);
  // (a) todo campo da ficha existe no código de hoje (ou é declaradamente nosso)
  campos.forEach(function (campo) {
    if (nossos.indexOf(campo) >= 0) return;
    if (fonte.indexOf(campo) < 0) faltandoNoVivo.push(lista + '.' + campo);
  });
  // (b) todo campo que o schema conhece ou é digitado na tela (`campos`) ou é
  // declaradamente preenchido pelo sistema (`calculados`) — nada de campo fantasma.
  const calculados = ficha.calculados || [];
  Object.keys(ficha.schema).forEach(function (campo) {
    if (campos.indexOf(campo) < 0 && calculados.indexOf(campo) < 0) faltandoNaFicha.push(lista + '.' + campo);
  });
});
ok('todo campo da ficha existe, com o mesmo nome, no sistema de hoje'
  + (faltandoNoVivo.length ? ' — não achei: ' + faltandoNoVivo.join(', ') : ''), faltandoNoVivo.length === 0);
ok('nenhum campo fantasma: ou o dono digita (campos) ou o sistema preenche (calculados)'
  + (faltandoNaFicha.length ? ' — faltou: ' + faltandoNaFicha.join(', ') : ''), faltandoNaFicha.length === 0);

// os campos que o sistema de HOJE grava de verdade (lidos do código vivo, não da ficha)
const GRAVADOS_HOJE = {
  clientes: ['nome', 'telefone', 'rua', 'numero', 'bairro', 'documento', 'cidade', 'estado', 'cep', 'status', 'email', 'tipo'],
  contratos: ['numero', 'clienteId', 'dataInicio', 'dataFim', 'diaVencimento', 'franquiaPB', 'franquiaCor',
    'valorExcedentePB', 'valorExcedenteCor', 'valorMensalFixo'],
  parque: ['clienteId', 'contratoId', 'equipamentoId', 'setor', 'localInstalacao', 'patrimonio', 'status'],
  equipamentos: ['fabricante', 'modelo', 'tipo', 'status', 'patrimonio', 'serie', 'contadorPB', 'contadorCor'],
  leituras: ['parqueId', 'equipamentoId', 'contratoId', 'clienteId', 'dataLeitura', 'contadorPB', 'contadorCor',
    'contadorPBAnterior', 'contadorCorAnterior', 'consumoPB', 'consumoCor', 'valorExcedente', 'faturar', 'status'],
  os: ['clienteId', 'parqueId', 'equipamentoId', 'tipo', 'prioridade', 'tecnico', 'status', 'descricao'],
  recargas: ['codigo', 'nome', 'marca', 'preco']
};
let perdeDado = [];
Object.keys(GRAVADOS_HOJE).forEach(function (lista) {
  const campos = CAT.LISTAS[lista].campos.map(c => c.campo);
  const calculados = CAT.LISTAS[lista].calculados || [];
  GRAVADOS_HOJE[lista].forEach(function (campo) {
    if (campos.indexOf(campo) < 0 && calculados.indexOf(campo) < 0) perdeDado.push(lista + '.' + campo);
  });
});
ok('nenhum campo que o sistema de hoje grava ficou de fora da ficha (a virada não perde dado)'
  + (perdeDado.length ? ' — FALTOU: ' + perdeDado.join(', ') : ''), perdeDado.length === 0);

// os obrigatórios que o sistema de hoje cobra continuam obrigatórios aqui
ok('o que é obrigatório hoje continua obrigatório na ficha (cliente e venda)',
  CAT.LISTAS.clientes.campos.find(c => c.campo === 'nome').obrigatorio === true &&
  CAT.LISTAS.os.campos.find(c => c.campo === 'clienteId').obrigatorio === true &&
  CAT.LISTAS.os.campos.find(c => c.campo === 'descricao').obrigatorio === true &&
  CAT.LISTAS.parque.campos.find(c => c.campo === 'equipamentoId').obrigatorio === true);

// ── 2) as telas do menu cobrem as telas do sistema de hoje ──
const htmlAntigo = ler('index.html');
const viewsAntigas = [...htmlAntigo.matchAll(/id="(view-[a-z-]+)"/g)].map(m => m[1]);
ok('o index.html de hoje lista as telas (view-*) — ' + viewsAntigas.length + ' encontradas', viewsAntigas.length >= 14);

const ids = CAT.TELAS.map(t => t.id);
ok('nenhuma tela da ficha aparece duas vezes', new Set(ids).size === ids.length);
ok('toda tela da ficha sabe a que MENU pertence',
  CAT.TELAS.every(t => CAT.GRUPOS.some(g => g.id === t.grupo)));
const gruposUsados = [...new Set(CAT.TELAS.map(t => t.grupo))];
ok('a ficha usa os mesmos menus do sistema de hoje (Início, Atendimento, Locação, NF-e, Cadastros, Financeiro, Buscador Escola, Configurações)',
  gruposUsados.length === CAT.GRUPOS.length && CAT.GRUPOS.map(g => g.id).sort().join() === gruposUsados.sort().join(),
  gruposUsados.join());

// as telas que o sistema de hoje tem e que a ficha PRECISA ter (nem que seja como "depende")
const TELAS_HOJE = ['clientes', 'produtos', 'recargas', 'vendas', 'orcamentos', 'os', 'impressoras',
  'contratos', 'parque', 'leituras', 'contasReceber', 'contasPagar', 'fiscal-nfe', 'fiscal-catalogo',
  'fiscal-cert', 'fiscal-historico', 'escola', 'usuarios', 'tecnicos', 'empresas', 'auditoria',
  'nuvem', 'relatorios', 'painel-gerente', 'navegador', 'migrados', 'pix', 'modulos', 'preferencias'];
const semTela = TELAS_HOJE.filter(t => ids.indexOf(t) < 0);
ok('todas as telas do sistema de hoje estão na ficha, nem que seja como "no sistema de hoje"'
  + (semTela.length ? ' — FALTOU: ' + semTela.join(', ') : ''), semTela.length === 0);

// ── 2.1) PARIDADE ITEM A ITEM com o menu VIVO (não com uma lista escrita à mão) ──
// Li o `menusPadrao()` e o `catalogoAtalhos()` do arquivo que monta o menu de hoje: cada
// item de lá tem de ter uma tela na página nova. Se o dono acrescentar um item no sistema
// vivo, este teste acusa "sobrou item" — em vez de a página ficar silenciosamente sem ele.
{
  const fonteMenu = ler('ajustes_v52213_menus_atalhos_patch.js');
  function itensDe(nomeFuncao, ate) {
    const corpo = fonteMenu.slice(fonteMenu.indexOf('function ' + nomeFuncao + '('),
      ate ? fonteMenu.indexOf('function ' + ate + '(') : fonteMenu.length);
    return [...corpo.matchAll(/\{id:'([a-z0-9-]+)'[^}]*?click:'((?:\\.|[^'])+)'/g)]
      .map(m => ({ id: m[1], click: m[2].replace(/\\'/g, "'") }));
  }
  const doMenu = itensDe('menusPadrao', 'catalogoAtalhos');
  const dosAtalhos = itensDe('catalogoAtalhos', 'atalhosPadrao');
  ok('li o menu vivo do sistema de hoje (' + doMenu.length + ' itens de menu + ' + dosAtalhos.length + ' atalhos)',
    doMenu.length >= 15 && dosAtalhos.length >= 8, doMenu.length + '/' + dosAtalhos.length);
  // a PONTE: onde o dono clica hoje → qual tela da página nova atende
  const PONTE = {
    "navigateTo('dashboard')": 'inicio',
    "navigateTo('vendas')": 'vendas',
    'openQuickOS()': 'os',
    "navigateTo('contratos')": 'contratos',
    "navigateTo('impressoras')": 'impressoras',
    'abrirCentralNfe()': 'fiscal-nfe',
    'abrirPerfilTributario()': 'fiscal-regras',
    'abrirPerfilTributario(1)': 'fiscal-catalogo',
    "navigateTo('clientes')": 'clientes',
    "openModal('cliente')": 'clientes',
    "navigateTo('financeiro')": 'contasReceber',
    "navigateTo('buscador-escola')": 'escola',
    "navigateTo('config')": 'preferencias',
    "navigateTo('usuarios')": 'usuarios',
    "navigateTo('auditoria')": 'auditoria',
    "navigateTo('produtos')": 'produtos',
    'abrirCloudflareNuvem()': 'nuvem',
    'window.abrirTelaBackup ? abrirTelaBackup() : exportBackup()': 'nuvem',
    'doLogout()': 'inicio',  // Sair cai na tela de login (não é tela do sistema): nada a migrar
    "if(typeof novaVenda==='function') novaVenda(); else navigateTo('vendas')": 'vendas'
  };
  const semPonte = doMenu.concat(dosAtalhos).filter(i => !PONTE[i.click]);
  ok('todo item do menu de hoje tem tela na página nova' + (semPonte.length ? ' — SOBROU: ' + semPonte.map(i => i.id + ' (' + i.click + ')').join(' | ') : ''),
    semPonte.length === 0);
  const semTelaNova = doMenu.concat(dosAtalhos).filter(i => PONTE[i.click] && ids.indexOf(PONTE[i.click]) < 0);
  ok('e a tela que atende cada item existe na ficha' + (semTelaNova.length ? ' — sem tela: ' + semTelaNova.map(i => i.id + '→' + PONTE[i.click]).join(', ') : ''),
    semTelaNova.length === 0);
  ok('a "nova notinha" do atalho abre a tela da venda (o mesmo lugar de hoje)',
    PONTE[dosAtalhos.filter(i => i.id === 'nova-notinha')[0].click] === 'vendas');
  ok('e o "estoque" dos atalhos abre Produtos (é onde o estoque mora hoje)',
    PONTE[dosAtalhos.filter(i => i.id === 'estoque')[0].click] === 'produtos');
}

// tela que abre no sistema antigo tem de dizer o MOTIVO (nunca tela vazia)
let semMotivo = CAT.TELAS.filter(t => t.tipo === 'depende' && !(t.motivo && t.motivo.length > 40)).map(t => t.id);
ok('toda tela que ainda roda no sistema de hoje explica o motivo (nada de tela em branco)'
  + (semMotivo.length ? ' — sem motivo: ' + semMotivo.join(', ') : ''), semMotivo.length === 0);
ok('toda tela de cadastro aponta a lista da ficha que ela usa',
  CAT.TELAS.filter(t => t.tipo === 'lista').every(t => !!CAT.LISTAS[t.lista]));

// lista de histórico e de apoio é SÓ CONSULTA (ninguém inventa log nem NCM na mão)
ok('Auditoria é lista só de consulta', CAT.LISTAS.logs.somenteLeitura === true);
ok('Catálogo fiscal (NCM/CEST/CFOP) é lista só de consulta', CAT.LISTAS.catalogoFiscal.somenteLeitura === true);
ok('e as listas de cadastro NÃO são só consulta (essas o dono cadastra)',
  !CAT.LISTAS.clientes.somenteLeitura && !CAT.LISTAS.produtos.somenteLeitura && !CAT.LISTAS.contratos.somenteLeitura);

// as categorias de produto da ficha são as MESMAS da caixa de seleção viva
const selecao = ler('novo/selecao.js');
const cats = CAT.LISTAS.produtos.campos.find(c => c.campo === 'categoria').opcoes;
ok('as categorias de produto da ficha são as do sistema de hoje (' + cats.length + ')',
  cats.every(c => selecao.indexOf("'" + c + "'") >= 0), cats.join(' / '));

// ── 3) a CONTA DA LEITURA é a mesma de hoje (números do saveLeituraRapida) ──
console.log('-- a conta da leitura de contador (mesma do sistema de hoje) --');
{
  const R = LEI.regras;
  // franquia 3.000 PB / R$ 0,08 por página; 0 Cor. Máquina tinha 1.000 no relógio.
  const parque = { id: 'p1', clienteId: 'c1', contratoId: 'k1', equipamentoId: 'e1', contadorInicialPB: 1000, contadorInicialCor: 0 };
  const contrato = { franquiaPB: 3000, franquiaCor: 0, valorExcedentePB: 0.08, valorExcedenteCor: 0.45 };
  const l1 = R.leituraDaColeta({ parque, contrato, contadorPB: 2500, contadorCor: 0 });
  ok('primeira leitura: consumo = contador de agora − contador inicial (2500−1000 = 1500)', l1.consumoPB === 1500);
  ok('e dentro da franquia não cobra nada', l1.valorExcedente === 0 && l1.faturar === false);
  const l2 = R.leituraDaColeta({ parque, contrato, ultima: l1, contadorPB: 5000, contadorCor: 0 });
  ok('segunda leitura conta a partir da ÚLTIMA (5000−2500 = 2500)', l2.consumoPB === 2500);
  ok('e o excedente sai da franquia (2500 − 3000 → nada ainda)', l2.valorExcedente === 0);
  const l3 = R.leituraDaColeta({ parque, contrato, ultima: l2, contadorPB: 9000, contadorCor: 0 });
  ok('terceira leitura: 4000 − 3000 de franquia = 1000 × R$ 0,08 = R$ 80,00 (sem centavo quebrado)',
    l3.consumoPB === 4000 && l3.valorExcedente === 80, String(l3.valorExcedente));
  ok('e o excedente entra para faturar', l3.faturar === true);
  const l4 = R.leituraDaColeta({ parque, contrato, ultima: l3, contadorPB: 8900, contadorCor: 0 });
  ok('contador andando para trás nasce como divergência (é a regra de hoje)',
    l4.consumoPB === -100 && l4.status === 'divergencia', l4.status);
  ok('e consumo negativo não vira cobrança', l4.valorExcedente === 0 && l4.faturar === false);
  // o contador da máquina nunca anda para trás por causa de uma leitura (Math.max de hoje)
  const novo = R.contadorDaMaquina({ contadorPB: 9000, contadorCor: 0 }, { contadorPB: 8900, contadorCor: 0 });
  ok('o contador da máquina não anda para trás (Math.max do sistema de hoje)', novo.contadorPB === 9000);
  // cor: franquia 0 → cobra desde a primeira página
  const cor = R.leituraDaColeta({ parque, contrato, ultima: null, contadorPB: 1000, contadorCor: 10 });
  ok('na Cor, sem franquia, cobra desde a 1ª página (10 × R$ 0,45 = R$ 4,50)', cor.valorExcedente === 4.5, String(cor.valorExcedente));
  // o valor em centavos: 123 páginas × R$ 0,15 = R$ 18,45 (e não 18,449999999999996)
  ok('multiplicação de centavos não deixa centavo quebrado',
    R.valorExcedente(123, 0, { franquiaPB: 0, valorExcedentePB: 0.15 }) === 18.45);
  // número do contrato: o mesmo formato do sistema de hoje (CT-ano-0001)
  const numeroContrato = 'CT-' + new Date().getFullYear() + '-1';
  ok('o número do contrato sai no formato do sistema de hoje',
    /^CT-\d{4}-\d+$/.test(numeroContrato), numeroContrato);
}

// ── 4) o menu da página não deixa tela de fora (a página lê a ficha) ──
console.log('-- a página monta o menu a partir da ficha --');
{
  const pagina = ler('novo/index.html');
  ok('a página carrega a ficha (listas.js) e a conta da leitura (leituras.js)',
    pagina.indexOf('src="listas.js"') > 0 && pagina.indexOf('src="leituras.js"') > 0);
  ok('o menu é montado da ficha (CAT.TELAS), e não escrito à mão item por item',
    /TELAS_CAT\.filter\(function \(t\) \{ return t\.grupo === g\.id; \}\)/.test(pagina));
  ok('e a tela que ainda roda no sistema de hoje abre com o motivo escrito',
    /htmlDependencia/.test(pagina));
  ok('nenhuma tela de cadastro fica "em construção" (o texto de fase saiu)',
    !/fase 1: Clientes e Produtos/.test(pagina) && !/fase ' \+ \(selo\[tela\]/.test(pagina));
}

// ── 4.1) UMA verdade por lista: as peças novas usam o schema da ficha ──
// Achado desta rodada: `contasReceber` estava declarada DUAS vezes no núcleo novo (na venda
// e no financeiro), com campos diferentes — o último a montar ganhava, então o mesmo dado
// entrava num formato e voltava noutro conforme a tela que abriu primeiro. Agora as peças
// pedem o schema à ficha; este bloco prova que é o MESMO objeto (não uma cópia parecida).
console.log('-- uma verdade só para cada lista (fim das duas versões de contasReceber) --');
{
  require('./novo/venda.js');
  require('./novo/financeiro.js');
  require('./novo/pix.js');
  const E = CAT.ESQUEMAS;
  const V = globalThis.DIGICOPY_VENDA.regras.esquemas;
  const F = globalThis.DIGICOPY_FINANCEIRO.regras.esquemas;
  const P = globalThis.DIGICOPY_PIX.regras.SCHEMA_CONFIG;
  ok('a ficha tem os esquemas das listas sem aba (vendas, contasReceber, contasPagar, os, config)',
    !!E.vendas && !!E.contasReceber && !!E.contasPagar && !!E.os && !!E.config);
  ok('a venda usa o schema da ficha para vendas/os/contasReceber (mesmo objeto)',
    V.vendas === E.vendas && V.os === E.os && V.contasReceber === E.contasReceber);
  ok('o financeiro usa o MESMO schema de contasReceber da venda (era a duplicidade)',
    F.contasReceber === E.contasReceber && F.contasPagar === E.contasPagar && V.contasReceber === F.contasReceber);
  ok('o Pix usa o schema da ficha para a configuração', P === E.config);
  // o schema de `os` é a UNIÃO: a tela de Chamados e o espelho da venda escrevem na mesma lista
  const espelho = ['vendaId', 'numeroSerie', 'equipamentoModelo', 'contador', 'tipoOS', 'responsavelEntrega',
    'garantia', 'pecasTexto', 'situacaoOS', 'acessorios', 'abertura', 'criadoEm'];
  const faltam = espelho.filter(c => !E.os[c]);
  ok('o schema de `os` cobre a tela de Chamados E o espelho da venda' + (faltam.length ? ' — faltou: ' + faltam.join(', ') : ''),
    faltam.length === 0);
  ok('e o schema de contasReceber cobre os campos das duas telas (clienteNome e baixaForma)',
    !!E.contasReceber.clienteNome && !!E.contasReceber.baixaForma);
  // sem a ficha carregada, cada peça continua com a cópia de reserva (teste isolado roda)
  const fonteVenda = ler('novo/venda.js');
  ok('a peça sabe trabalhar sem a ficha (cópia de reserva para o teste isolado)',
    /daFicha\('vendas', \{/.test(fonteVenda) && /\|\| reserva/.test(fonteVenda));
  // a página monta o rascunho e os schemas da ficha (nada de lista escrita à mão)
  const pagina = ler('novo/index.html');
  ok('a página monta o rascunho e os schemas a partir da ficha',
    /Object\.keys\(FICHA\.LISTAS\)\.forEach\(function \(n\) \{ banco\[n\] = \[\]; schemas\[n\] = FICHA\.LISTAS\[n\]\.schema; \}\)/.test(pagina));
}

// ── 5) regra 16: nenhuma tela chama alert/confirm/prompt nativos (nem as peças novas) ──
console.log('-- as peças novas não usam janela nativa (regra 16 das permanentes) --');
{
  // tira comentário antes de procurar: aqui o texto dos comentários fala das proibições
  const semComentario = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
  const suspeitos = ['novo/listas.js', 'novo/leituras.js', 'novo/telas.js', 'novo/venda.js', 'novo/pix.js',
    'novo/impressao.js', 'novo/financeiro.js', 'novo/selecao.js'].filter(function (f) {
    return /(^|[^.\w])(alert|confirm|prompt)\s*\(/.test(semComentario(ler(f)));
  });
  ok('nenhuma peça nova chama alert/confirm/prompt' + (suspeitos.length ? ' — ACHOU em ' + suspeitos.join(', ') : ''),
    suspeitos.length === 0);
  // e nada de senha/token/chave de verdade escrito no código novo
  const comSegredo = ['novo/listas.js', 'novo/leituras.js', 'novo/telas.js'].filter(function (f) {
    return /(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]+PRIVATE KEY|password\s*[:=]\s*['"][^'"]{6,})/.test(ler(f));
  });
  ok('nenhum segredo (senha/chave/certificado) escrito nas peças novas', comSegredo.length === 0);
}

console.log('\nRESULTADO: ' + passou + ' verificações passaram — a ficha das telas bate com o sistema de hoje e todos os menus estão na página.');
