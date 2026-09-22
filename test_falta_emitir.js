// ═══════════════════════════════════════════════════════════════════════════
// TESTE v6.1.8 — "FALTA POUCO PARA A NOTA VALER DE VERDADE"
//
// Ordem dele: "pode fazer tudo de uma vez" (terminar a NF-e). Este cartão da
// Central de NF-e diz, item por item e com o estado de AGORA, o que falta para
// a emissão real: CNPJ, IE, série/regime, perfil tributário, NCM, CSC do cupom
// e o certificado A1 (conferido NO PC). Este teste prova a conta e o estado.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');

let falhas = 0;
function ok(cond, msg) { if (cond) console.log('  ✔ ' + msg); else { falhas++; console.error('  ✘ ' + msg); } }
function ler(p) { return fs.readFileSync(p, 'utf8'); }

const arquivo = 'ajustes_v6108_falta_emitir_patch.js';
const code = ler(arquivo);
const P = (function () {
  const ctx = { window: {}, document: undefined, db: {} };
  new Function('window', 'document', 'db', code)(ctx.window, ctx.document, ctx.db);
  return ctx.window.FE6108_PURE;
})();

const vazio = P.feAnalisar({ config: {}, empresas: [], perfisNf: [], produtos: [] });
function porId(an, id) { return an.itens.filter(function (i) { return i.id === id; })[0]; }

console.log('\n== 1) Base vazia: tudo apontado como pendente (sem mentira) ==');
ok(Array.isArray(vazio.itens) && vazio.itens.length === 7, 'a conferência tem os 7 itens (incluindo o certificado)');
ok(porId(vazio, 'cnpj').ok === false, 'CNPJ em branco = pendente');
ok(porId(vazio, 'ie').ok === false, 'IE em branco = pendente');
ok(porId(vazio, 'perfil').ok === false, 'sem perfil tributário = pendente');
ok(porId(vazio, 'ncm').ok === false, 'sem produto com NCM = pendente');
ok(porId(vazio, 'csc').ok === false, 'sem CSC = pendente (só é exigido no cupom)');
ok(porId(vazio, 'cert').ok === null, 'o certificado é conferido no PC na hora (não é chute do navegador)');
ok(vazio.prontos === 0, 'nenhum item pronto na base vazia');
ok(/0 de 7 itens prontos/.test(P.feResumo(vazio)), 'o resumo fala a verdade: 0 de 7');

console.log('\n== 2) Base completa: tudo verde ==');
const cheio = P.feAnalisar({
  config: { fiscal: { ie: '0012345678901', crt: '1', serie: '1' }, nfCscId: '000001', nfCsc: 'ABC123', nfAmbiente: 'producao' },
  empresas: [{ cnpj: '08.385.589/0001-03' }],
  perfisNf: [{ id: 'p1', cfop: '5102' }],
  produtos: [{ ncm: '37079021' }, { ncm: '' }]
});
ok(porId(cheio, 'cnpj').ok === true, 'CNPJ com 14 dígitos = pronto');
ok(porId(cheio, 'ie').ok === true, 'IE preenchida = pronto');
ok(porId(cheio, 'serie').ok === true, 'série + regime informados = pronto');
ok(porId(cheio, 'perfil').ok === true, '1 perfil cadastrado = pronto');
ok(porId(cheio, 'ncm').ok === true && /1 de 2 produto/.test(porId(cheio, 'ncm').detalhe), 'conta os NCM certinho (1 de 2)');
ok(porId(cheio, 'csc').ok === true, 'CSC com ID e código = pronto');
ok(cheio.prontos === 6 && cheio.total === 7, 'seis prontos (o sétimo é o certificado, do PC)');
ok(cheio.producao === true, 'sabe dizer que está em PRODUÇÃO');
ok(/tudo pronto/i.test(P.feResumo(cheio)), 'o resumo avisa quando está tudo pronto');
ok(P.feAnalisar({ config: { nfAmbiente: 'homologacao' } }).producao === false, 'e sabe que homologação é teste');
ok(P.feSoDigitos('08.385.589/0001-03') === '08385589000103', 'lê CNPJ com pontuação');

console.log('\n== 3) Como está ligado no sistema ==');
ok(/view-central-nf/.test(code), 'o cartão vive na Central de NF-e (tela fiscal)');
ok(/fe6108-caixa/.test(code) && /setInterval/.test(code), 'redesenha sozinho quando a tela abre (sonda leve, id próprio)');
ok(/nfeCertAPI/.test(code) && /status\(\)/.test(code), 'confere o certificado A1 pela ponte do programa do PC');
ok(/nada aqui emite sozinho/i.test(code), 'deixa escrito na tela que a conferência é só leitura');
ok(/abrirPerfilTributario|navigateTo/.test(code), 'cada pendência tem botão que leva ao lugar certo');
ok(!/\balert\(|\bprompt\(|\bconfirm\(/.test(code), 'sem modal nativo do navegador (regra #16)');
ok(!/localStorage\s*\.\s*(get|set|remove)Item|window\.localStorage/.test(code), 'não guarda nada no navegador (regra #44)');
ok(code.indexOf('__v6108falta') >= 0, 'tem guarda de duplicação (__v6108falta)');
ok(ler('bundle-manifest.json').indexOf(arquivo) >= 0, 'está no bundle');
ok(ler('test_runner.js').indexOf('test_falta_emitir.js') >= 0, 'o próprio teste está na suíte');

console.log('\nRESULTADO: ' + (falhas === 0 ? 'a conferência da NF-e está de pé!' : falhas + ' falha(s)'));
if (falhas) process.exitCode = 1;
