// ═══════════════════════════════════════════════════════════════════════════
// TESTE — importar.html (a área de importação das referências do sistema antigo)
//
// Pedido dele (22/09/2026): "eu n pensei em um que você faz uma area de
// importação dos dois tipos de arquivos, ai vai ler e me dar um texto pra
// copiar ai so colo aq".
//
// Este teste garante: ferramenta sozinha (sem CDN), sem modal nativo, sem
// guardar nada (nem no PC nem na nuvem), sem mandar nada para fora, com teto de
// tamanho (PC fraco), lendo acento de arquivo antigo (Windows-1252) e sabendo
// avisar quando o arquivo é binário (aí vai em base64).
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');

let falhas = 0;
function ok(cond, msg){ if(cond) console.log('  ✔ ' + msg); else { falhas++; console.error('  ✘ ' + msg); } }

const ARQ = 'importar.html';
const html = fs.readFileSync(ARQ, 'utf8');

console.log('\n== 1) Ferramenta sozinha e sem popup nativo (regras do projeto) ==');
ok(!/<script[^>]+src=|<link[^>]+rel="stylesheet"/i.test(html), 'arquivo é sozinho: nenhum script/css de fora');
ok(!/[\s(]alert\s*\(|[\s(]confirm\s*\(|[\s(]prompt\s*\(/.test(html), 'sem modal nativo (regra #16)');
ok(html.indexOf('nada sai do seu computador') >= 0, 'avisa na tela que nada sai do PC');
ok(!/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(html), 'não manda nada para a internet');
ok(!/localStorage\s*\.\s*(get|set|remove)Item|window\.localStorage|indexedDB|document\.cookie/.test(html),
   'não guarda nada no navegador (regra #44)');
ok(html.indexOf('BANCO.FDB') >= 0, 'avisa para não mandar o BANCO.FDB (binário enorme)');
ok(html.indexOf('webkitdirectory') >= 0, 'dá para escolher a PASTA inteira de uma vez');
ok(/Arraste a pasta <b>Grids<\/b>/.test(html), 'o texto ensina a mandar a pasta Grids');

console.log('\n== 2) Parte pura: binário, acento antigo, base64 e junção ==');
const bloco = html.slice(html.indexOf('/* IR_PURE_START */'), html.indexOf('/* IR_PURE_END */'));
const P = (function(){
  const ctx = { window:{}, document:undefined, TextDecoder:TextDecoder, Uint8Array:Uint8Array, btoa:btoa };
  new Function('window', 'document', 'TextDecoder', 'Uint8Array', 'btoa', bloco)(
    ctx.window, ctx.document, TextDecoder, Uint8Array, btoa);
  return ctx.window.IR_PURE;
})();
ok(!!P, 'a parte pura está exportada (IR_PURE)');

const soTexto = new TextEncoder().encode('DBGrid1.ColCount=7\nCol1=Cliente;120\n');
ok(P.irEhBinario(soTexto) === false, 'arquivo de texto normal NÃO é binário');
ok(P.irEhBinario(new Uint8Array([0x00,0x01,0x02,0xff,0x00])) === true, 'arquivo com bytes zero é binário');
const cp1252 = new Uint8Array([0x53,0x61,0xED,0x64,0x61]);   // "Saída" em Windows-1252 (0xED = í)
const dec = P.irDecodificar(cp1252);
ok(dec.codificacao === 'Windows-1252' && dec.texto.indexOf('\u00ed') >= 0,
   'acento de arquivo antigo sai certo (UTF-8 falhou → Windows-1252, sem "�")');
ok(P.irDecodificar(soTexto).texto.indexOf('ColCount') >= 0, 'texto UTF-8 sai igual ao original');
ok(P.irBase64(new Uint8Array([65,66,67])) === 'QUJD', 'binário vai em base64 (dá para eu ler do meu lado)');
ok(P.irTamanho(1536) === '1.5 KB' && P.irTamanho(300) === '300 B', 'tamanho legível (B/KB/MB)');

const junto = P.irJuntar([
  { nome:'FormLocacaoDBGrid1.grd', bytes:900,  tamanho:'900 B', status:'texto',   texto:'ColCount=3' },
  { nome:'e110111_v1.00.xsd',      bytes:4096, tamanho:'4.0 KB', status:'texto',  texto:'<xs:schema/>' },
  { nome:'something.bin',          bytes:2048, tamanho:'2.0 KB', status:'binario',base64:'AAEC' }
]);
ok(junto.indexOf('===== ARQUIVO: FormLocacaoDBGrid1.grd (900 B) =====') >= 0, 'cada arquivo vem com cabeçalho (nome e tamanho)');
ok(junto.indexOf('ColCount=3') >= 0 && junto.indexOf('<xs:schema/>') >= 0, 'o conteúdo dos dois arquivos de texto entra inteiro');
ok(junto.indexOf('BINARIO') >= 0 && junto.indexOf('AAEC') >= 0, 'o binário entra marcado e em base64');

console.log('\n== 3) A tela faz o que ele pediu (ler → mostrar → copiar) ==');
ok(html.indexOf('id="saida"') >= 0, 'tem a caixa com o texto para copiar');
ok(html.indexOf('id="b-copiar"') >= 0 && /Copiar tudo/.test(html), 'tem o botão "Copiar tudo"');
ok(/navigator\.clipboard\.writeText/.test(html) && /execCommand\('copy'\)/.test(html),
   'copia sozinho e, se o navegador não deixar, ensina Ctrl+A / Ctrl+C');
ok(html.indexOf('id="b-salvar"') >= 0, 'e ainda dá para salvar um .txt, se ele preferir');
ok(html.indexOf('Ctrl+A') >= 0 && html.indexOf('Ctrl+C') >= 0, 'o plano B da cópia está escrito na tela');
ok(/MAX_ARQ\s*=\s*900\s*\*\s*1024/.test(html) && /MAX_TOTAL\s*=\s*3\s*\*\s*1024\s*\*\s*1024/.test(html),
   'o teto sobe para 900 KB por arquivo e 3 MB no total (cabe o leiauteNFe de 337 KB)');
ok(/grande demais \(pulei\)/.test(html) && /status === 'grande'/.test(html), 'acima do teto o arquivo é pulado com aviso (nada de travar o PC — regra #12)');

console.log('\n== 3b) Arquivo grande: resumo e partes para colar ==');
const xsd = '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.portalfiscal.inf.br/nfe" version="4.00">' +
  '<xs:element name="NFe" type="TNFe"/><xs:element name="enviNFe" type="TEnviNFe"/>' +
  '<xs:complexType name="TNFe"><xs:sequence><xs:element name="infNFe" type="TInfNFe"/></xs:sequence></xs:complexType>' +
  '<xs:attribute name="versao" type="xs:string"/></xs:schema>';
const resumo = P.irResumoXsd(xsd);
ok(resumo.indexOf('http://www.portalfiscal.inf.br/nfe') >= 0, 'o resumo mostra o namespace do esquema');
ok(resumo.indexOf('Versao.........: 4.00') >= 0, 'o resumo mostra a versão (4.00)');
ok(/Elementos \(3\)/.test(resumo) && resumo.indexOf('NFe, enviNFe, infNFe') >= 0, 'o resumo lista os elementos, sem repetir');
ok(/Tipos \(1\)/.test(resumo) && resumo.indexOf('TNFe') >= 0, 'o resumo lista os tipos (complexType)');
ok(/Atributos \(1\)/.test(resumo) && resumo.indexOf('versao') >= 0, 'o resumo lista os atributos');
ok(resumo.length < xsd.length * 2, 'o resumo é curto (dá para colar numa mensagem)');

const grande = new Array(5000).join('linha de exemplo do arquivo grande\n');
const partes = P.irPartes(grande, 40000);
ok(partes.length > 1, 'texto grande é dividido em partes');
ok(partes.every(p => p.length <= 40000), 'nenhuma parte passa do tamanho combinado (~40 KB para colar)');
ok(partes.join('') === grande, 'juntando as partes volta o texto inteiro (nada é perdido)');
ok(P.irPartes('curto', 40000).length === 1, 'texto pequeno continua em UMA parte (nada de complicar)');
ok(html.indexOf('id="parte"') >= 0 && /Parte ' \+ \(i \+ 1\) \+ ' de '/.test(html), 'a tela tem a listinha de partes, numerada');
ok(html.indexOf('select') >= 0 && /listinha ao lado/.test(html), 'o aviso explica a listinha de partes');
ok(/reader\.readAsArrayBuffer/.test(html), 'lê os bytes (para poder detectar binário de verdade)');
ok(html.indexOf('Escolher a pasta inteira') >= 0, 'o botão da pasta está na tela, com o nome claro');

console.log('\n== 4) Está publicado junto do sistema ==');
ok(fs.existsSync('importar.html'), 'o arquivo existe na raiz (sai no site e no ZIP)');
ok(fs.readFileSync('test_runner.js', 'utf8').indexOf('test_importar_referencias.js') >= 0, 'o próprio teste está na suíte');

console.log('\nRESULTADO: ' + (falhas === 0 ? 'a área de importação está de pé!' : falhas + ' falha(s)'));
if (falhas) process.exitCode = 1;
