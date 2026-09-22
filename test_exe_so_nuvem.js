// ═══════════════════════════════════════════════════════════════════════════
// v6.1.6 (22/09/2026) — PEDIDO DO DONO: "esse da nuvem é possível fazer um .exe
// só pra isso? só pra conectar na nuvem no sistema".
//
// O sistema inteiro mora na nuvem: o PC não precisa do programa nem do banco
// (o .exe do sistema antigo tinha 100 MB porque levava o Firebird dentro). O
// que sobra para o PC é UM ícone: clicou, o sistema abre já ligado na nuvem.
//
// Este teste trava o que foi entregue para esse pedido:
//   • CRIAR_EXE_SO_NUVEM.cmd  — o dois-cliques que gera o .exe
//   • nuvem/criar_exe_so_nuvem.ps1 — compila o lancador (sem baixar nada)
//   • nuvem/abrir_digicopy.vbs — o atalho que abre o sistema
// E trava também o que NÃO pode acontecer: nada de modal nativo, nada de
// baixar programa da internet, nada de guardar dado no PC.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

const fs = require('fs');
const path = require('path');

let ok = 0, falhas = 0;
function t(nome, cond, detalhe) {
  if (cond) { ok++; console.log('  ✔ ' + nome); }
  else { falhas++; console.log('  ✘ ' + nome + (detalhe ? ' — ' + detalhe : '')); }
}
function ler(p) { return fs.readFileSync(p, 'utf8'); }
function existe(p) { return fs.existsSync(p); }

console.log('\n== 1) O .exe que só conecta na nuvem (pedido dele) ==');

const CMD = 'CRIAR_EXE_SO_NUVEM.cmd';
const PS1 = path.join('nuvem', 'criar_exe_so_nuvem.ps1');
const VBS = path.join('nuvem', 'abrir_digicopy.vbs');

t('existe o dois-cliques CRIAR_EXE_SO_NUVEM.cmd', existe(CMD));
t('existe o script que compila o .exe (nuvem/criar_exe_so_nuvem.ps1)', existe(PS1));
t('existe o atalho que abre o sistema (nuvem/abrir_digicopy.vbs)', existe(VBS));

const cmd = existe(CMD) ? ler(CMD) : '';
const ps1 = existe(PS1) ? ler(PS1) : '';
const vbs = existe(VBS) ? ler(VBS) : '';

// A janela não pode fechar sozinha: se der erro, ele precisa LER a tela.
t('a janela do .cmd NÃO fecha sozinha (dá para ler o erro e tirar foto)',
  cmd.indexOf('cmd /k') >= 0 && /NUNCA FECHA SOZINHA/.test(cmd));
t('o .cmd abre em janela própria (dois-cliques, sem terminal escondido)',
  /^@echo off/.test(cmd.trim()) && cmd.indexOf('start "DIGICOPY') >= 0);
t('o .cmd chama o PowerShell no jeito que roda em qualquer Windows',
  cmd.indexOf('-NoProfile -ExecutionPolicy Bypass -File') >= 0 &&
  cmd.indexOf('nuvem\\criar_exe_so_nuvem.ps1') >= 0);
t('o .cmd avisa que não instala o sistema e não guarda dados neste PC',
  /NAO instala o sistema e NAO guarda dados neste PC/.test(cmd));
t('o .cmd dá o plano B quando o antivírus reclama do .exe',
  /antivirus/.test(cmd) && /abrir_digicopy\.vbs/.test(cmd));

console.log('\n== 2) O .exe é LEVE: compila no próprio Windows, não baixa nada ==');
t('compila o lancador com o Windows (Add-Type), sem baixar instalador',
  ps1.indexOf('Add-Type -TypeDefinition $codigo -OutputAssembly $destino -OutputType WindowsApplication') >= 0);
t('o .exe sai como programa de janela (não abre a telinha preta do prompt)',
  ps1.indexOf('-OutputType WindowsApplication') >= 0);
t('nada de baixar arquivo da internet (sem download de pacote)',
  !/Invoke-WebRequest|Start-BitsTransfer|iwr |curl |wget |npm install/i.test(ps1));
t('se não conseguir compilar, cai no atalho em vez de dar erro seco',
  /CreateShortcut/.test(ps1) && /wscript\.exe/.test(ps1));
t('o atalho nasce na Área de Trabalho com o nome DIGICOPY NUVEM',
  /DIGICOPY NUVEM\.lnk/.test(ps1) && /GetFolderPath\('Desktop'\)/.test(ps1));
t('o PowerShell novo (pwsh, sem compilador) é tratado, não ignora',
  ps1.indexOf('PSVersion.Major -ge 6') >= 0);

console.log('\n== 3) O que o .exe faz: abre o sistema ligado na nuvem ==');
t('o VBS abre o endereço oficial do sistema',
  vbs.indexOf('https://teste-60f.pages.dev') >= 0);
t('abre em janela limpa, sem barra de endereço (--app=, como o programa de antes)',
  vbs.indexOf('--app=') >= 0 && vbs.indexOf('--start-maximized') >= 0);
t('prefere o Edge (vem em todo Windows) e depois o Chrome',
  vbs.indexOf('Microsoft\\Edge\\Application\\msedge.exe') >= 0 &&
  vbs.indexOf('Google\\Chrome\\Application\\chrome.exe') >= 0 &&
  vbs.indexOf('msedge.exe') < vbs.indexOf('chrome.exe'));
t('procura o Chrome também na instalação por usuário (AppData)',
  vbs.indexOf('%LocalAppData%') >= 0);
t('sem Edge nem Chrome, abre no navegador padrão (nunca fica sem abrir)',
  vbs.indexOf('ShellExecute URL') >= 0);
t('nenhum aviso/modal nativo do Windows (regra 16: popup é do sistema)',
  !/MsgBox|WScript\.Echo|Popup\(/i.test(vbs));
t('o VBS não guarda nada e não escreve arquivo nenhum',
  !/CreateTextFile|WriteFile|SaveAs|localStorage/i.test(vbs));

console.log('\n== 4) O mesmo endereço em todo lugar (nada de link velho) ==');
const links = ler('links.js');
const SITE = (links.match(/const SITE = '([^']+)'/) || [])[1] || '';
t('links.js tem o endereço oficial do site', /^https:\/\//.test(SITE));
t('o .exe abre exatamente o mesmo endereço do links.js',
  vbs.indexOf(SITE) >= 0, 'no VBS: ' + SITE);
t('o compilador do .exe usa o mesmo endereço',
  ps1.indexOf(SITE) >= 0, 'no PS1: ' + SITE);

console.log('\n== 5) Arquivos de Windows: sem acento e com fim de linha certo ==');
const ascii = s => /^[\x00-\x7F]*$/.test(s);
t('o .cmd é só ASCII (acento quebra a janela preta do Windows)', ascii(cmd));
t('o .ps1 é só ASCII (PowerShell 5 lê sem acento sem erro)', ascii(ps1));
t('o .vbs é só ASCII (o Windows Script Host lê sem acento sem erro)', ascii(vbs));
t('o .cmd está em CRLF (fim de linha do Windows)', cmd.indexOf('\r\n') >= 0);
t('o .cmd não usa "pause" perdido: o fim é cmd /k (janela aberta)',
  cmd.indexOf('\npause') < 0);

console.log('\n== 6) O sistema continua sendo só nuvem (nada no PC) ==');
t('o .cmd/vbs/ps1 não copiam o sistema nem apontam para banco local',
  !/BANCO\.FDB|firebirdAPI|node-firebird|require\(.firebird/i.test(cmd + ps1 + vbs) &&
  !/copy .*app\.bundle|robocopy|xcopy/i.test(cmd + ps1 + vbs));
t('nenhum dos três grava dado do sistema no PC (é só o atalho de abrir)',
  !/localStorage|indexedDB|IndexedDB/i.test(cmd + ps1 + vbs));
t('a explicação do .exe vive no RELATORIO_SESSAO.md (novo chat entende)',
  ler('RELATORIO_SESSAO.md').indexOf('CRIAR_EXE_SO_NUVEM.cmd') >= 0);

console.log('\nRESULTADO: ' + (falhas === 0 ? 'o .exe que só conecta na nuvem está de pé!' : falhas + ' falha(s)'));
if (falhas) process.exitCode = 1;
