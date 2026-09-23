// ═══════════════════════════════════════════════════════════════════════════
// v6.1.6 — RODADA 22/09/2026 (nº4): o que o dono pediu, item por item.
//
//   1) "sabe a parte de nota fiscal e clica pra criar uma nova? ela não vai ser
//      em formato menu, e sim em formato aba, que nem o de vendas, e ta vendo
//      essa foto? é o que aparece quando eu clico no botão de fazer nova NF no
//      outro sistema antigo" → as 5 opções da foto, em ABA:
//        Gerar NF-e Avulsa · Gerar de NF-e Devolução para Cliente ·
//        Gerar de NF-e Devolução para Fornecedor · Gerar NFCe ·
//        Importar Declaração de Importação
//   2) "na hora de colocar a senha da nuvem aparece um olho a mais, resolva,
//      deixa somente um olho" → o olho do navegador (Edge/Chrome) é escondido.
//   3) "a nuvem não está sincronizando, um PC não mostra as informações a
//      outro PC" → bugs achados no teste de dois PCs contra o motor DE VERDADE
//      (estado perdido na troca, rodada antiga desfazendo a decisão nova,
//      contagem da nuvem de 10 minutos atrás).
//   4) "é possível que você não anotou elas o que foi resolvido?" → o relatório
//      de teste ganhou a PARTE H (o que é novo nesta rodada) e continua marcando
//      o que já foi resolvido, com o filtro para não repetir pergunta.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
function ok(nome, cond) {
  if (!cond) { console.error('  ✘ ' + nome); process.exit(1); }
  console.log('  ✔ ' + nome);
}
const ler = f => fs.readFileSync(f, 'utf8');

console.log('\n== 1) NOVA NOTA FISCAL EM ABA (as 5 opções da foto dele) ==');
const fx = ler('fiscal_catalogo_completo_patch.js');
const panel = ler('cloudflare_sync_patch.js');
const titulos = [
  'Gerar NF-e Avulsa',
  'Gerar de NF-e Devolução para Cliente',
  'Gerar de NF-e Devolução para Fornecedor',
  'Gerar NFCe',
  'Importar Declaração de Importação'
];
ok('as 5 opções do sistema antigo estão no arquivo, com o nome exato',
  titulos.every(t => fx.indexOf(t) >= 0));
ok('é ABA (cartões dentro da Central), não menu nem janelinha',
  fx.indexOf('fx-novo-grid') >= 0 && fx.indexOf('fx-novo-opt') >= 0 &&
  fx.indexOf("onclick=\"fxAcao(\\'nf-novo-menu\\')\"") >= 0);
ok('o botão da lista virou "Nova nota" e volta para a lista',
  fx.indexOf('>Nova nota<') >= 0 && fx.indexOf("'nf-novo-voltar'") >= 0);
ok('cada tipo nasce com modelo/finalidade certos (55 venda, 55 devolução, 65 NFCe)',
  /avulsa[\s\S]{0,220}?modelo:'55', finalidade:'1'/.test(fx) &&
  /dev-cli[\s\S]{0,220}?finalidade:'4'/.test(fx) &&
  /dev-forn[\s\S]{0,220}?finalidade:'4'/.test(fx) &&
  /nfce[\s\S]{0,220}?modelo:'65'/.test(fx));
ok('a devolução já avisa para referenciar a nota de origem (chave de 44)',
  /DEVOLUÇÃO — referenciar a chave da nota de origem/.test(fx));
ok('a importação abre com o texto da DI para preencher',
  /Declaração de Importação \(DI\) nº/.test(fx));
ok('a criação fica registrada (log da nota + auditoria)',
  /nota-criada', detalhe: 'rascunho aberto pela aba Nova nota/.test(fx) &&
  /I\.log\('nf-nova'/.test(fx));

console.log('\n== 2) UM OLHO SÓ NA SENHA DA NUVEM ==');
const login = ler('ajustes_v5262_login_nuvem_primeiro_patch.js');
ok('o olho do navegador (Edge/Chrome) é escondido por CSS',
  /::-ms-reveal/.test(login) && /::-ms-clear/.test(login) &&
  /::-webkit-credentials-auto-fill-button/.test(login));
ok('isso roda quando o arquivo carrega (vale no painel da nuvem também)',
  /\n  esconderOlhoNativo\(\);\n/.test(login) &&
  /document\.addEventListener\('DOMContentLoaded', esconderOlhoNativo\)/.test(login));
ok('o único olho é o botão do sistema (mostrar/ocultar)',
  login.indexOf('v5262-mostrar-senha') >= 0 &&
  login.indexOf("campo.type = mostrar ? 'text' : 'password'") >= 0);

console.log('\n== 3) SINCRONIZAÇÃO ENTRE PCS (bugs achados no teste de verdade) ==');
const sync = ler('cloudflare_data_sync_patch.js');
ok('estado não fica mais sem os campos extras ao ser trocado inteiro',
  /function normalizarEstado\(novo\)\{/.test(sync) && /state\.sumindo=\(state\.sumindo&&/.test(sync));
ok('toda troca de estado passa pelo carimbo de geração',
  /function trocarEstado\(novo\)\{state=novo;estadoGeracao\+\+;return state;\}/.test(sync) &&
  (sync.match(/trocarEstado\(normalizarEstado\(/g) || []).length === 2);
ok('rodada antiga para de escrever quando a decisão muda no meio',
  /const geracao=estadoGeracao;/.test(sync) && /if\(trocou\(\)\)return false;/.test(sync));
ok('a varredura não estoura mais quando o campo extra não existe',
  /if\(!state\.sumindo\|\|typeof state\.sumindo!=='object'\)state\.sumindo=\{\};/.test(sync));
ok('a nuvem agora diz a versão nova (0.4.9 / 5.26.6)',
  fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("API_VERSION = '0.4.9'") >= 0);
ok('o motor para colar foi regerado junto (não fica para trás)',
  ler('cloudflare-worker/motor_para_colar.js').indexOf('API_VERSION = "0.4.9"') >= 0);

console.log('\n== 4) SÓ NUVEM: NADA GUARDADO NO PC (ordem dele em maiúsculas) ==');
ok('o modo existe e vem LIGADO por padrão',
  /function modoSoNuvem\(\)\{ try\{ const v=localStorage\.getItem\(SO_NUVEM_KEY\); return v===null\?true:v==='1'; \}/.test(sync));
ok('em SÓ NUVEM a base não é gravada no computador (saveDB não persiste)',
  /const soNuvem=!!window\.DIGICOPY_SO_NUVEM&&authorized\(\)/.test(sync) &&
  /const r=soNuvem\?true:original\.apply\(this,arguments\)/.test(sync));
ok('a cópia só é solta quando a nuvem confirma que tem TUDO o que este PC tem',
  /async function nuvemTemTudo\(\)\{/.test(sync) &&
  /if\(modoSoNuvem\(\)&&!outbox\.length&&await nuvemTemTudo\(\)\)\{/.test(sync) &&
  /return naNuvem>=localBusinessCount\(\);/.test(sync));
ok('sem resposta da nuvem a cópia NÃO é solta (nada se perde)',
  /function nuvemTemTudo\(\)\{[\s\S]{0,400}?catch\(e\)\{ return false; \}/.test(sync));
ok('a base é remontada lendo o diário da nuvem desde o começo',
  /state\.cursor=0; state\.versions=\{\}; state\.initialPull=true;/.test(sync));
ok('a tela se redesenha sozinha quando os dados chegam da nuvem',
  /function hidratarTela\(\)/.test(sync) && /window\.navigateTo\(tela\)/.test(sync));
ok('o painel da Nuvem mostra onde os dados ficam (com ligar/desligar e limpar)',
  panel.indexOf('dc-sonuvem-toggle') >= 0 && panel.indexOf('dc-sonuvem-limpar') >= 0 &&
  panel.indexOf('SÓ NUVEM') >= 0);
ok('o rodapé diz, em português, que os dados estão só na nuvem',
  ler('ajustes_v52245_rodape_versao_patch.js').indexOf('dados só na nuvem') >= 0);

// prova de verdade: o motor roda e a limpeza preserva a credencial do PC
(function testarSoNuvemDeVerdade(){
  const codigo = ler('cloudflare_data_sync_patch.js');
  const mapa = new Map();
  const storage = {
    getItem: k => (mapa.has(k) ? mapa.get(k) : null),
    setItem: (k, v) => { mapa.set(k, String(v)); },
    removeItem: k => { mapa.delete(k); },
    get length(){ return mapa.size; },
    key: i => [...mapa.keys()][i] || null
  };
  storage.setItem('digicopy_erp_v42_demo_apresentacao', 'LZ1:base');
  storage.setItem('digicopy_erp_v42_demo_apresentacao_part__clientes__#0', '[]');
  storage.setItem('digicopy_cloud_device_token', 'token-do-pc');   // credencial
  storage.setItem('digicopy_cf_sync_outbox_v1', '[]');             // fila de envio
  const win = { DIGICOPY_CLOUD: { token: () => 'token-do-pc' } };
  new Function('window', 'localStorage', 'document', codigo)(win, storage, undefined);
  const S = win.DIGICOPY_CLOUD_SYNC;
  ok('o motor expõe o modo só nuvem', S && typeof S.modoSoNuvem === 'function' && typeof S.soltarCopiaLocal === 'function');
  ok('modo só nuvem ligado por padrão (sem escolha antiga guardada)', S.modoSoNuvem() === true);
  const apagadas = S.soltarCopiaLocal();
  ok('solta a base guardada e NÃO toca na credencial nem na fila',
    apagadas === 2 &&
    storage.getItem('digicopy_erp_v42_demo_apresentacao') === null &&
    storage.getItem('digicopy_erp_v42_demo_apresentacao_part__clientes__#0') === null &&
    storage.getItem('digicopy_cloud_device_token') === 'token-do-pc' &&
    storage.getItem('digicopy_cf_sync_outbox_v1') === '[]');
  ok('dá para desligar (guardar cópia) e a escolha fica guardada',
    S.definirSoNuvem(false) === false && storage.getItem('digicopy_cf_so_nuvem_v1') === '0' &&
    S.modoSoNuvem() === false);
  ok('e dá para ligar de novo', S.definirSoNuvem(true) === true && S.modoSoNuvem() === true);
})();

console.log('\n== 5) VERSÃO ACOMPANHA A PUBLICAÇÃO (ordem dele: "vai atualizando") ==');
const mvp = JSON.parse(ler('package.json'));
ok('existe o comando npm run versao (um passo, sem esquecer nada)',
  mvp.scripts && mvp.scripts.versao === 'node mudar_versao.js' && fs.existsSync('mudar_versao.js'));
ok('a versão do app é a que está no package.json e é a que aparece no relatório',
  /^\d+\.\d+\.\d+$/.test(mvp.version) && ler('RELATORIO_DE_TESTE_NF.html').indexOf('v' + mvp.version) >= 0);
ok('o guia também é da versão publicada agora',
  ler('GUIA_DE_TESTE_NF.html').indexOf('v' + mvp.version) >= 0);

console.log('\n== 6) RELATÓRIO DE TESTE: NÃO REPETIR O QUE JÁ FOI RESOLVIDO ==');
const rel = ler('RELATORIO_DE_TESTE_NF.html');
ok('tem a PARTE H com o que é novo nesta rodada',
  rel.indexOf('PARTE H') >= 0 && rel.indexOf('Nova nota fiscal em ABA') >= 0 &&
  rel.indexOf('um olho só') >= 0);
ok('tem a PARTE I com o navegador embutido (novo de 22/09 nº5; só no programa do PC)',
  rel.indexOf('NAVEGADOR DENTRO DO SISTEMA') >= 0 && rel.indexOf('NFS-e Nacional') >= 0 &&
  rel.indexOf('WhatsApp Web') >= 0 && rel.indexOf('Abrir numa janela nova') >= 0);
// AUDITORIA 23/09/2026 — antes fixava 'v6.1.10' escrito à mão. Agora usa a versão
// que está no package.json (mvp.version), que é justamente o que este teste quer
// garantir: relatório e guia falando da MESMA versão que o sistema publica.
ok('o relatório é da versão publicada agora (v' + mvp.version + ')',
  rel.indexOf('v' + mvp.version) >= 0 && rel.indexOf('5.26.6') >= 0);
ok('continua marcando o que já foi resolvido e esconde com o filtro',
  rel.indexOf('resolvido antes') >= 0 && rel.indexOf('só o que falta testar') >= 0);

console.log('\nRESULTADO: v' + mvp.version + ' (rodada 22/09) passou!');
