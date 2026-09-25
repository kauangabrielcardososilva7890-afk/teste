// ═══════════════════════════════════════════════════════════════════════════
// TESTE — A TELA NÃO PODE MAIS "SECAR" (v7.0.5)
//
// O dono publicou o motor da nuvem 5.26.6 e continuou vendo lentidão. A causa não
// era a nuvem: eram defeitos do PRÓPRIO PC, e o pior deles era este —
//
//   `podeRedesenharSync` recusava o redesenho quando o foco estava em um BUTTON.
//   Como clicar em qualquer MENU deixa o foco no botão, a tela passava a recusar
//   TODOS os redesenhos dali em diante. E como a mudança recebida já fica marcada
//   como "conhecida", ela nunca mais era considerada novidade: a lista ficava
//   velha PARA SEMPRE, sem erro e sem aviso.
//
// Consertos travados aqui:
//   1. botão não bloqueia mais (só campo de digitação / área editável);
//   2. redesenho RECUSADO vira PENDENTE e é aplicado na primeira brecha (o clique
//      no menu, a saída de um campo, o batimento de 3 s) — nada se perde;
//   3. o painel do contrato (onde ficam as impressoras) também se atualiza;
//   4. falha não empurra o relógio para 5 minutos (recuo curto: 30 s à vista);
//   5. leitura boa zera o recuo;
//   6. marca antiga de "limite do dia" não dorme horas: sonda de 60 em 60 s;
//   7. o canal instantâneo reagenda em vez de morrer.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++; console.log('  ✔ ' + nome);
}

const code = fs.readFileSync('cloudflare_data_sync_patch.js', 'utf8');
const window = { DIGICOPY_CLOUD: { token: () => '' } };
new Function('window','localStorage','document', code)(
  window,
  { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  undefined
);
const S = window.DIGICOPY_CLOUD_SYNC;
const base = { hidden:false, cargaAberta:false, modalAberto:false, focoEmCampo:false, podeRenderizar:true, ultimo:0, agora:100000 };

console.log('== 1) O DEFEITO QUE TRAVAVA A TELA (botão) ==');
ok('foco em BOTÃO não bloqueia mais o redesenho',
   S.podeRedesenharSync({ ...base, focoEmCampo:false }) === true);
ok('o código não trata mais BUTTON como "digitando"',
   !/INPUT\|TEXTAREA\|SELECT\|BUTTON/.test(code));
ok('campo de digitação continua segurando (protege quem digita)',
   /INPUT\|TEXTAREA\|SELECT/.test(code));
ok('área editável (contenteditable) também segura', /isContentEditable/.test(code));

console.log('\n== 2) REDESENHO RECUSADO VIRA PENDENTE (nada se perde) ==');
ok('existe a marca de redesenho pendente', /let redesenhoPendente=false;/.test(code));
ok('existe a tentativa de aplicar depois', /function tentarRedesenhoPendente\(\)/.test(code));
ok('a mudança recebida marca o redesenho como pendente antes de tentar',
   /if\(mudouNaTela\)\{redesenhoPendente=true;tentarRedesenhoPendente\(\);\}/.test(code) &&
   /if\(mudou\)\{redesenhoPendente=true;tentarRedesenhoPendente\(\);\}/.test(code));
ok('o batimento de 3 s tenta aplicar a pendência', /try\{tentarRedesenhoPendente\(\);\}catch\(e\)\{\}/.test(code));
ok('clicar tenta aplicar', /addEventListener\('click'[\s\S]{0,120}tentarRedesenhoPendente/.test(code));
ok('sair de um campo tenta aplicar', /addEventListener\('focusout'[\s\S]{0,120}tentarRedesenhoPendente/.test(code));
ok('exportado para teste', typeof S.temRedesenhoPendente === 'function' && typeof S.redesenharTelaAtual === 'function');

console.log('\n== 3) O PAINEL DO CONTRATO (impressoras) TAMBÉM ATUALIZA ==');
ok('o redesenho reaproveita o contrato aberto',
   code.indexOf('contrato-detail') >= 0 && code.indexOf('window.openContratoDetail') >= 0 &&
   code.indexOf('openModal') >= 0);
ok('só mexe no painel se ele estiver aberto', /if\(box&&!box\.classList\.contains\('hidden'\)/.test(code));

console.log('\n== 4) FALHA NÃO DEIXA O PC QUASE PARADO ==');
ok('recuo curto com a janela à vista (para em 30 s)',
   /document\.hidden\?Math\.min\(300000[\s\S]{0,120}Math\.min\(30000,5000\*Math\.pow\(2,Math\.min\(failures,3\)\)\)/.test(code));
ok('janela escondida mantém o recuo longo (economia)', /Math\.min\(300000,5000\*Math\.pow\(2,Math\.min\(failures,6\)\)\)/.test(code));
ok('leitura boa zera o recuo', /failures=0;lastError='';state\.lastOk=Date\.now\(\);/.test(code));

console.log('\n== 5) LIMITE ANTIGO NÃO DORME O DIA INTEIRO ==');
ok('a espera do limite virou sonda de 60 s', /Math\.min\(60000,Math\.max\(30000,state\.limiteAte-Date\.now\(\)\)\)/.test(code));
ok('a sonda tem motivo escrito (o que evita a marca presa)', /SONDA DE 60 EM 60 s/.test(code));

console.log('\n== 6) CANAL INSTANTÂNEO NÃO MORRE ==');
ok('saída antecipada reagenda', /setTimeout\(\(\)=>\{try\{canalInstantaneo\(\);\}catch\(e\)\{\}\},5000\);/.test(code));
ok('motor da nuvem antigo desliga o canal (sem erro na tela)', /st===404\|\|st===400/.test(code));

console.log('\n== 7) O DIAGNÓSTICO (ver sem adivinhar) ==');
const cloud = fs.readFileSync('ajustes_v52296_backups_nuvem_patch.js', 'utf8');
ok('existe o diagnóstico no painel da Nuvem', /function instalarDiagnostico/.test(cloud) && /dc-diagnostico/.test(cloud));
ok('mostra a versão DESTE PC', /window\.DIGICOPY_APP_VERSION/.test(cloud));
ok('mostra a versão do motor da nuvem (lê /health)', /fetch\(base \+ '\/health'/.test(cloud));
ok('mostra o estado da sincronização pelos nomes REAIS do motor',
   /info\.pending/.test(cloud) && /info\.lastError/.test(cloud) && /info\.paused/.test(cloud));
ok('tem o botão "Conferir agora" que força e mede',
   /Conferir agora/.test(cloud) && /sync\.tick\('diagnostico-manual'\)/.test(cloud) && /ms<\/b>/.test(cloud));
const blocoDiag = cloud.slice(cloud.indexOf('function instalarDiagnostico'), cloud.indexOf('function instalarDiagnostico') + 2800);
ok('não mostra senha nem token', blocoDiag.indexOf('senha') < 0 && blocoDiag.indexOf('token') < 0 && blocoDiag.indexOf('localStorage') < 0);

console.log('\nRESULTADO: ' + passou + ' verificações — a tela não seca mais e dá para ver o estado do sistema!');
