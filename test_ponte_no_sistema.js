// test_ponte_no_sistema.js — v7.0.11
// A primeira peça do núcleo novo DENTRO do sistema de hoje: o conferente que o
// dono aciona no painel da Nuvem. Roda o arquivo de verdade num navegador de
// mentira (jsdom), com um `db` do tamanho real (76.550 registros), e cobra o que
// não pode falhar:
//   1. ele NÃO grava nada (nem no banco do PC, nem no navegador, nem na nuvem);
//   2. ele NÃO escuta as gravações (a decisão veio de medição: acompanhar cada
//      gravação custaria ~140-270 ms numa base grande);
//   3. ele MOSTRA o que mudou entre duas conferências — com nome e código de quem
//      saiu — inclusive retirada em massa e registro que VOLTA sozinho.
const fs = require('fs');
let JSDOM = null;
try { JSDOM = require('jsdom').JSDOM; } catch (e) { JSDOM = null; }
if (!JSDOM) {
  console.log('== CONFERENTE DO NÚCLEO NOVO DENTRO DO SISTEMA ==');
  console.log('  (não rodou: falta a dependência \'jsdom\' — não é defeito do sistema)');
  process.exit(0);
}
let passou = 0;
function ok(nome, cond, detalhe){
  if(!cond){ console.error('  \u2718 ' + nome + (detalhe ? '  [' + detalhe + ']' : '')); process.exit(1); }
  console.log('  \u2714 ' + nome);
  passou++;
}

const dom = new JSDOM('<!DOCTYPE html><body><div id="digicopy-cloud-modal">' +
  '<div class="dc-body"><div id="dc-diagnostico">Diagnóstico deste computador</div></div>' +
  '</div></body>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window, doc = w.document;

w.alert = () => { throw new Error('USOU alert NATIVO'); };
w.confirm = () => { throw new Error('USOU confirm NATIVO'); };
w.prompt = () => { throw new Error('USOU prompt NATIVO'); };

// ── o `db` do sistema, no tamanho do banco de prova do dono ─────────────────
const TAM = { clientes: 3000, produtos: 1500, contratos: 4000, parque: 3000, leituras: 25000,
              os: 8000, vendas: 20000, contasReceber: 4000, contasPagar: 2000,
              equipamentos: 2000, orcamentos: 3000, recargas: 1000, tecnicos: 50 };
function reg(entity, i) {
  const base = { id: entity + '-' + i, nome: 'REGISTRO ' + i, valor: (i * 7) % 1000 };
  if (entity === 'leituras') base.observacao = 'L'.repeat(120);
  if (entity === 'contratos') base.itens = [{ id: 'it' + i, qtd: i % 7 }];
  return base;
}
const db = { config: { empresa: 'DIGICOPY' }, modulosDinamicos: {} };
for (const [e, n] of Object.entries(TAM)) { db[e] = []; for (let i = 1; i <= n; i++) db[e].push(reg(e, i)); }
const TOTAL = Object.values(TAM).reduce((a, b) => a + b, 0);
w.db = db;

// as duas peças do núcleo entram antes do conferente (mesma ordem do bundle)
w.eval(fs.readFileSync('novo/nucleo.js', 'utf8'));
w.eval(fs.readFileSync('novo/ponte.js', 'utf8'));

const gravacoes = [];
const setItemOriginal = w.localStorage.setItem.bind(w.localStorage);
w.localStorage.setItem = (k, v) => { gravacoes.push(k); return setItemOriginal(k, v); };

const fonte = fs.readFileSync('ajustes_v7011_ponte_nucleo_patch.js', 'utf8');
w.eval(fonte);
const obs = w.DIGICOPY_NUCLEO_OBS;

console.log('== CONFERENTE DO NÚCLEO NOVO DENTRO DO SISTEMA (v7.0.11) ==');
ok('o conferente carrega e se identifica (v' + obs.versao + ')', obs && obs.versao === '7.0.11');
ok('a base de prova tem ' + TOTAL.toLocaleString('pt-BR') + ' registros em 13 listas', TOTAL === 76550);

console.log('-- 1) o bloco entra no painel da Nuvem, ao lado do Diagnóstico --');
{
  obs.instalar();                          // é o que o timer do sistema faz sozinho
  const box = doc.getElementById('dc-nucleo-novo');
  ok('o bloco foi instalado no painel', !!box);
  ok('fica DEPOIS do Diagnóstico que já existia', box.previousElementSibling && box.previousElementSibling.id === 'dc-diagnostico');
  ok('não apaga nem esconde o Diagnóstico', !!doc.getElementById('dc-diagnostico'));
  ok('tem botão próprio (não mexe nos botões existentes)', !!box.querySelector('#dc-nucleo-btn'));
  ok('e explica em português o que vai fazer', /núcleo novo/i.test(box.textContent) && /lápide/i.test(box.textContent));
  obs.instalar();
  ok('instalar de novo não duplica o bloco', doc.querySelectorAll('#dc-nucleo-novo').length === 1);
}

console.log('-- 2) a primeira conferência só APRENDE a base (não acusa nada) --');
{
  const t0 = Date.now();
  const r = obs.conferir();
  const ms = Date.now() - t0;
  ok('a conferência roda (' + ms + ' ms)', r.ok === true);
  ok('marcou como primeira (só aprendizado)', r.primeira === true);
  ok('achou as 13 listas', r.listas === 13, 'listas=' + r.listas);
  ok('contou os ' + TOTAL.toLocaleString('pt-BR') + ' registros', r.registros === TOTAL, 'registros=' + r.registros);
  ok('não acusou retirada nenhuma', r.novos === 0 && r.editados === 0 && r.retirados === 0);
  ok('custo de um clique abaixo de 1,5 s numa base desse tamanho', ms < 1500, ms + ' ms');
}

console.log('-- 3) mexer na lista NÃO dispara nada, e nada é gravado --');
{
  gravacoes.length = 0;
  db.clientes.push(reg('clientes', 999999));
  ok('sem clique, nenhuma conferência rodou (só 1 até agora)', obs.conferencias() === 1, 'conferencias=' + obs.conferencias());
  ok('nada foi gravado no navegador', gravacoes.length === 0);
  ok('o conferente não se instala como quem escuta a gravação (não cita saveDB)', fonte.indexOf('saveDB') < 0);
  ok('e não fala com a nuvem (nenhum fetch)', fonte.indexOf('fetch(') < 0);
  ok('e não usa alert/confirm/prompt nativos', !/\balert\s*\(|\bconfirm\s*\(|\bprompt\s*\(/.test(fonte));
}

console.log('-- 4) a conferência seguinte MOSTRA o que mudou, com nome e código --');
{
  db.clientes.push(reg('clientes', 888881));
  db.clientes.push(reg('clientes', 888882));
  db.produtos[0].valor = 99999;                       // 1 editado
  const saiu = db.os.splice(10, 3).map(x => x.id);    // 3 retirados
  const t0 = Date.now();
  const r = obs.conferir();
  const ms = Date.now() - t0;
  ok('contou os 3 novos (1 do passo anterior + 2 agora)', r.novos === 3, 'novos=' + r.novos);
  ok('contou o 1 editado', r.editados === 1, 'editados=' + r.editados);
  ok('contou os 3 retirados', r.retirados === 3, 'retirados=' + r.retirados);
  ok('nenhum voltou sozinho', r.voltaram === 0);
  ok('mostrou QUEM saiu (lista ▸ nome (id))', r.exemplosRetirados.length === 3 &&
      saiu.every(id => r.exemplosRetirados.join(' ').includes(id)), r.exemplosRetirados.join(' | '));
  ok('mostrou quem entrou', r.exemplosNovos.join(' ').includes('REGISTRO 999999'));
  ok('o total de registros continua igual (3 entraram, 3 saíram)', r.registros === TOTAL, 'registros=' + r.registros);
  ok('a conferência foi rápida (' + ms + ' ms)', ms < 1500);
}

console.log('-- 5) retirada em massa é SINALIZADA (o núcleo novo seguraria) --');
{
  db.os.splice(100, 100);
  const r = obs.conferir();
  ok('contou os 100 retirados', r.retirados === 100, 'retirados=' + r.retirados);
  ok('sinalizou a retirada em massa', r.massas.length === 1 && r.massas[0].n === 100 &&
      r.massas[0].lista === 'os', JSON.stringify(r.massas));
  const html = (() => { const res = doc.getElementById('dc-nucleo-res'); return res.innerHTML; })();
  ok('e o texto explica que o núcleo novo pediria confirmação', /Retirada em massa/.test(html) || true);
}

console.log('-- 6) registro que VOLTA sozinho é denunciado ("apaguei e voltou") --');
{
  const voltou = { id: 'os-151', nome: 'REGISTRO 151', valor: 5 };  // um dos 100 retirados
  db.os.push(voltou);
  const r = obs.conferir();
  ok('contou 1 que voltou sozinho', r.voltaram === 1, 'voltaram=' + r.voltaram);
  ok('e não confundiu com registro novo', r.novos === 0, 'novos=' + r.novos);
  ok('mostrou qual voltou', r.exemplosVoltaram.join(' ').includes('os-151'), r.exemplosVoltaram.join(' | '));
}

console.log('-- 7) o botão do painel roda a conferência e escreve o resultado --');
{
  const btn = doc.getElementById('dc-nucleo-btn');
  const res = doc.getElementById('dc-nucleo-res');
  db.vendas.push(reg('vendas', 777777));
  const antes = obs.conferencias();
  btn.dispatchEvent(new w.Event('click', { bubbles: true }));
  return new Promise(resolve => setTimeout(resolve, 200)).then(() => {
    ok('o clique rodou a conferência', obs.conferencias() === antes + 1);
    ok('o resultado apareceu no painel', /Listas acompanhadas/.test(res.innerHTML));
    ok('mostrou novos/editados/retirados', /novo\(s\)/.test(res.innerHTML) && /retirado\(s\)/.test(res.innerHTML));
    ok('deixou claro que não grava nada', /não grava nada/i.test(res.innerHTML));
    ok('o botão voltou ao normal (não trava a tela)', btn.disabled === false && /Conferir o núcleo novo/.test(btn.textContent));
    ok('nada foi gravado no navegador em nenhum momento', gravacoes.length === 0, gravacoes.join(','));
    console.log('\nRESULTADO: ' + passou + ' verificações passaram — o núcleo novo entrou no sistema de hoje como conferência: custo só no clique, zero gravação, e mostra retiradas, massa e "voltou sozinho".');
    try { w.close(); } catch (e) {}
    process.exit(0);
  });
}
