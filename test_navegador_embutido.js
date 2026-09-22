// ═══════════════════════════════════════════════════════════════════════════
// TESTE v6.1.7 (22/09/2026) — O NAVEGADOR EMBUTIDO
//
// Pedido dele, palavra por palavra: "queria somente um navegador embutido no
// sistema onde ele vai abrir o site da prefeitura e vou poder mexer por la no
// sistema, sem eu usar algum navegador, tudo dentro do sistema, aproveitando a
// mesma base de um navegador dentro do sistema, queria adicionar o whatsapp web
// tambem, é possivel?"
//
// Este teste trava:
//   1) o módulo novo existir, com a parte pura (endereço, lista de sites) certa;
//   2) os sites que nascem prontos (prefeitura/NFS-e, NFS-e Nacional, WhatsApp);
//   3) a lista ficar na NUVEM (db.config.navSites) — nunca em localStorage;
//   4) o programa do PC abrir navegador de VERDADE (webview travada em main.js);
//   5) fora do programa do PC nunca ficar tela branca (aviso + abrir em janela);
//   6) sem modal nativo (alert/prompt/confirm) — regra #16 do projeto.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const fs = require('fs');
const path = require('path');

let falhas = 0;
function ok(cond, msg) { if (cond) console.log('  ✔ ' + msg); else { falhas++; console.error('  ✘ ' + msg); } }
function ler(p) { return fs.readFileSync(p, 'utf8'); }
function existe(p) { return fs.existsSync(p); }

// ── carrega só a parte pura do módulo (sem DOM) ─────────────────────────────
const P = (function () {
  const code = ler('navegador_embutido_patch.js');
  const ctx = { window: {}, document: undefined, db: {} };
  new Function('window', 'document', 'db', code)(ctx.window, ctx.document, ctx.db);
  return ctx.window.NAV6107_PURE;
})();

console.log('\n== 1) O módulo e o que ele promete ==');
ok(!!P, 'o navegador embutido exporta a parte pura (NAV6107_PURE)');
ok(existe('navegador_embutido_patch.js'), 'o módulo existe como arquivo próprio (1 arquivo = 1 módulo, regra #10)');
ok(ler('navegador_embutido_patch.js').indexOf('__v6107nav') >= 0, 'tem guarda de duplicação (__v6107nav)');
ok(ler('bundle-manifest.json').indexOf('navegador_embutido_patch.js') >= 0, 'está no bundle (senão o site não teria a aba)');

console.log('\n== 2) Endereço digitado nunca vira buraco ==');
ok(P.navNormalizarUrl('https://web.whatsapp.com') === 'https://web.whatsapp.com', 'endereço completo passa igual');
ok(P.navNormalizarUrl('  web.whatsapp.com  ') === 'https://web.whatsapp.com', 'sem http:// ele completa e tira os espaços');
ok(P.navNormalizarUrl('janauba.mg.gov.br') === 'https://janauba.mg.gov.br', 'domínio da prefeitura vira https://');
ok(P.navNormalizarUrl('localhost:3000') === 'http://localhost:3000', 'localhost continua local (sem https à força)');
ok(P.navNormalizarUrl('nota fiscal de serviço').indexOf('https://www.google.com/search?q=') === 0, 'texto solto vira busca, não erro');
ok(P.navNormalizarUrl('file:///C:/Windows/system32') .indexOf('https://www.google.com/search?q=') === 0, 'protocolo perigoso (file:) é desviado para busca');
ok(P.navNormalizarUrl('') === '', 'vazio continua vazio (a tela avisa, não abre nada)');

console.log('\n== 3) Os sites que nascem prontos ==');
const padrao = P.navSitesPadrao();
ok(padrao.length === 3, 'nascem 3 sites: prefeitura, NFS-e Nacional e WhatsApp');
ok(!!P.navSiteAchar(padrao, 'nfse-prefeitura'), 'tem o atalho da NFS-e da prefeitura');
ok(!!P.navSiteAchar(padrao, 'nfse-nacional'), 'tem o Emissor Nacional (Simples Nacional é obrigado desde 01/09/2026)');
ok(!!P.navSiteAchar(padrao, 'whatsapp'), 'tem o WhatsApp Web');
ok(/^https:\/\//.test(P.navSiteAchar(padrao, 'whatsapp').url), 'o WhatsApp abre em endereço seguro (https)');
ok(P.navSiteAchar(padrao, 'nfse-nacional').url.indexOf('nfse.gov.br') >= 0, 'o endereço do Emissor Nacional é o do gov.br');
ok(P.navSiteAchar(padrao, 'nfse-prefeitura').url.indexOf('sintesetecnologia.com.br') >= 0, 'a NFS-e da prefeitura abre no emissor que ELE usa (Sintese/Janaúba)');
ok(P.navSiteAchar(padrao, 'nfse-prefeitura').url.indexOf('Param=Janauba') >= 0, 'e já com o parâmetro da cidade (Param=Janauba)');
ok(P.navNormalizarUrl(P.navSiteAchar(padrao, 'nfse-prefeitura').url) === P.navSiteAchar(padrao, 'nfse-prefeitura').url, 'o endereço http do emissor é aceito como está (não vira busca)');

console.log('\n== 3b) Passo a passo dentro da tela ==');
ok(typeof P.navPassos === 'function', 'existe o passo a passo por endereço');
ok(P.navPassos('http://sistema.sintesetecnologia.com.br/NFEWeb/indexNFe.xhtml?Param=Janauba').length >= 3, 'a NFS-e da prefeitura tem passo a passo');
ok(/Ctrl\+P/.test(P.navPassos('http://sistema.sintesetecnologia.com.br/NFEWeb/indexNFe.xhtml').join(' ')), 'o passo a passo ensina a imprimir/salvar o PDF');
ok(P.navPassos('https://web.whatsapp.com').length >= 1, 'o WhatsApp tem o passo do QR Code');
ok(P.navPassos('https://exemplo.com').length === 0, 'site qualquer não ganha passo a passo inventado');

console.log('\n== 4) A lista mora na NUVEM (nada no PC) ==');
const dbTeste = { config: {} };
const lista = P.navSitesSalvar(dbTeste, padrao.concat([{ id: '', nome: 'Site do contador', url: 'contador.com.br' }]));
ok(Array.isArray(dbTeste.config.navSites) && dbTeste.config.navSites.length === 4, 'salvar grava em db.config.navSites (é isso que sobe para a nuvem)');
ok(lista[3].url === 'https://contador.com.br', 'site novo já sai com endereço normalizado (https)');
ok(P.navSites(dbTeste).length === 4, 'ler de volta devolve os 4 (a lista do dono manda)');
ok(P.navSites({ config: {} }).length === 3, 'sem lista salva, voltam os 3 padrões');
ok(P.navNormalizarUrl('') === '' && P.navIdNovo('', {}) === 'site', 'nome/id vazio não gera site fantasma');
const idA = P.navIdNovo('NFS-e da Prefeitura', {});
ok(idA === 'nfs-e-da-prefeitura', 'id do site vira texto limpo (sem acento nem espaço)');
ok(P.navIdNovo('NFS-e da Prefeitura', { 'nfs-e-da-prefeitura': 1 }) === 'nfs-e-da-prefeitura-2', 'id repetido ganha número em vez de sobrescrever');

const modulo = ler('navegador_embutido_patch.js');
ok(!/localStorage\s*\.\s*(get|set|remove)Item|window\.localStorage/.test(modulo), 'o módulo não guarda nada no navegador (nada de localStorage)');
ok(/navSitesSalvar\(banco\(\),/.test(modulo), 'as mudanças de lista são salvas pela mesma função (nuvem)');

console.log('\n== 5) No PROGRAMA do PC abre navegador de verdade ==');
const main = ler('main.js');
ok(/webviewTag:\s*true/.test(main), 'main.js liga a tag de navegador embutido (webviewTag)');
ok(/will-attach-webview/.test(main), 'a página de fora passa pela trava do main.js (will-attach-webview)');
ok(/NAV_HTTP_PREFEITURA/.test(main) && /sistema\.sintesetecnologia\.com\.br/.test(main), 'o http do emissor da prefeitura é a ÚNICA exceção liberada');
ok(main.indexOf("!NAV_HTTP_PREFEITURA.test(url)") >= 0 && main.indexOf("/^https:") >= 0, 'fora essa exceção, continua exigindo https');
ok(/delete webPreferences\.preload/.test(main), 'a página de fora entra sem preload (sem acesso ao sistema)');
ok(/nodeIntegration\s*=\s*false/.test(main), 'a página de fora entra sem node (segurança)');
ok(/persist:digicopy-navegador/.test(main), 'os logins dos sites ficam em área separada e identificada');
ok(/nav:limpar-logins/.test(main), 'existe o comando de esquecer os logins guardados dos sites');
ok(/setWindowOpenHandler/.test(main), 'link que abre janela nova dentro do site fica dentro do sistema');
ok(/setPermissionRequestHandler/.test(main), 'permissão (microfone do WhatsApp) é concedida só para os sites dele');
ok(/navegador_embutido|NAVEGADOR/.test(main), 'tudo isso está comentado no main.js (próximo chat entende o porquê)');

const preload = ler('preload.js');
ok(/navAPI\s*:/.test(preload) && /nav:limpar-logins/.test(preload), 'preload.js expõe a ponte navAPI (limparLogins)');

console.log('\n== 6) Fora do programa do PC não fica tela branca ==');
ok(/só abre no programa do PC/.test(modulo), 'a tela explica, em português, que ali só funciona no programa do PC');
ok(/Abrir numa janela nova/.test(modulo), 'e dá o botão de abrir numa janela nova (saída na hora)');
ok(/X-Frame-Options|proíbem/.test(modulo), 'a explicação fala do motivo real (os sites proíbem ser embutidos)');
ok(/nav-passo/.test(modulo) && /Como usar aqui dentro/.test(modulo), 'a tela mostra o "como usar aqui dentro" (passo a passo)');
ok(!/\balert\(|\bprompt\(|\bconfirm\(/.test(modulo), 'nenhum modal nativo do navegador (regra #16)');
ok(/did-fail-load/.test(modulo), 'se o site não abrir, aparece recado claro em vez de página vazia');

console.log('\n== 7) Ligado ao resto do sistema ==');
ok(/ensureView\('navegador'\)/.test(modulo), 'a tela entra no mesmo lugar das outras (ensureView)');
ok(/navigateTo\.__v6107nav|navigateTo=function/.test(modulo), 'navigateTo aprende a tela nova (sem quebrar as antigas)');
ok(/navegadorAbrirSite\('nfse-prefeitura'\)/.test(modulo), 'o menu abre direto na NFS-e da prefeitura');
ok(/ph-whatsapp-logo/.test(modulo), 'o menu tem o ícone do WhatsApp');
ok(/navAuditoria\('site-adicionado'/.test(modulo), 'adicionar site fica registrado na Auditoria (como o fiscal)');
ok(/nav-gest/.test(modulo) && /module-row|classic-toolbar-scroll/.test(modulo), 'o item de menu entra na barra de cima e no menu lateral');

console.log('\nRESULTADO: ' + (falhas === 0 ? 'o navegador dentro do sistema está de pé!' : falhas + ' falha(s)'));
if (falhas) process.exitCode = 1;
