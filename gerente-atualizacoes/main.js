// v5.26.0 — DIGICOPY GERENTE DE ATUALIZAÇÕES (3º sistema do produto).
// Programa SEPARADO que fica instalado SÓ no PC do dono. É ele quem "joga"
// a atualização pra nuvem: escolhe o .exe, escreve notas/tutorial, anexa as
// imagens do passo a passo e escolhe PRA QUEM a atualização aparece
// (todo mundo / só algumas empresas / só a loja dele pra testar antes).
// Quem baixa é sempre o CLIENTE: pelo sininho do sistema ou pelo site.
//
// Segurança: a tela (index.html) não fala direto com a internet — tudo passa
// por aqui (processo principal). Login = CNPJ da empresa dona + senha do
// gerente (credencial própria, diferente da senha de conexão dos PCs).
'use strict';
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const API = 'https://digicopy-sync-api.digicopyonline.workers.dev';

let win = null;

function criarJanela() {
  win = new BrowserWindow({
    width: 1180,
    height: 900,
    minWidth: 960,
    minHeight: 720,
    title: 'DIGICOPY Gerente de Atualizações',
    backgroundColor: '#0a1e8a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(criarJanela);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) criarJanela(); });

// ── chamada JSON com token do gerente (login, histórico, ações) ─────────────
ipcMain.handle('g:api', async (_ev, args) => {
  try {
    const opt = { method: (args && args.method) || 'GET', headers: { 'content-type': 'application/json' } };
    if (args && args.token) opt.headers['x-gerente-token'] = String(args.token);
    if (args && args.tokenAdmin) opt.headers['authorization'] = 'Bearer ' + String(args.tokenAdmin);
    if (args && args.body != null) opt.body = JSON.stringify(args.body);
    const r = await fetch(API + String((args && args.path) || ''), opt);
    let data = null;
    try { data = await r.json(); } catch (e) { data = null; }
    if (!r.ok) {
      const msg = (data && data.message) || ('Erro da nuvem (HTTP ' + r.status + ').');
      return { ok: false, erro: msg };
    }
    return { ok: true, dados: data };
  } catch (e) {
    return { ok: false, erro: 'Sem conexão com a nuvem. Verifique a internet deste PC.' };
  }
});

// ── escolher o .exe no PC ───────────────────────────────────────────────────
ipcMain.handle('g:pick-exe', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'Escolher o .exe da atualização',
    filters: [{ name: 'Instalador do sistema', extensions: ['exe'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths || !r.filePaths[0]) return { ok: false, cancelado: true };
  const p = r.filePaths[0];
  let tamanho = 0;
  try { tamanho = fs.statSync(p).size; } catch (e) {}
  return { ok: true, caminho: p, nome: path.basename(p), tamanho };
});

// ── escolher imagens do tutorial (várias de uma vez) ────────────────────────
ipcMain.handle('g:pick-imgs', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'Escolher imagens do passo a passo (prints)',
    filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
    properties: ['openFile', 'multiSelections']
  });
  if (r.canceled || !r.filePaths || !r.filePaths.length) return { ok: false, cancelado: true };
  return {
    ok: true,
    arquivos: r.filePaths.map((p) => {
      let tamanho = 0;
      try { tamanho = fs.statSync(p).size; } catch (e) {}
      return { caminho: p, nome: path.basename(p), tamanho };
    })
  };
});

// ── subir o .exe (corpo cru, como o motor espera) ───────────────────────────
ipcMain.handle('g:upload-exe', async (_ev, args) => {
  try {
    const v = String((args && args.versao) || '').replace(/^v/i, '');
    const buf = fs.readFileSync(String(args.caminho));
    if (!buf || buf.length < 1000) return { ok: false, erro: 'O .exe chegou vazio — escolha o arquivo de novo.' };
    const r = await fetch(API + '/v1/release-file?versao=' + encodeURIComponent(v), {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': String(buf.length),
        'x-gerente-token': String(args.token || '')
      },
      body: buf
    });
    let data = null;
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) return { ok: false, erro: (data && data.message) || ('Erro da nuvem (HTTP ' + r.status + ').') };
    return { ok: true, dados: data };
  } catch (e) {
    return { ok: false, erro: 'Sem conexão com a nuvem durante o envio do .exe.' };
  }
});

// ── subir UMA imagem do tutorial (corpo cru também) ─────────────────────────
ipcMain.handle('g:upload-img', async (_ev, args) => {
  try {
    const v = String((args && args.versao) || '').replace(/^v/i, '');
    const caminho = String(args.caminho || '');
    const ext = (path.extname(caminho).replace('.', '') || 'png').toLowerCase().replace('jpeg', 'jpg');
    const buf = fs.readFileSync(caminho);
    if (!buf || buf.length < 200) return { ok: false, erro: 'Imagem vazia: ' + path.basename(caminho) };
    if (buf.length > 4 * 1024 * 1024) return { ok: false, erro: 'Imagem maior que 4MB: ' + path.basename(caminho) + ' — exporte menor (JPG fica pequeno).' };
    const r = await fetch(API + '/v1/release-image?versao=' + encodeURIComponent(v), {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
        'content-length': String(buf.length),
        'x-imagem-tipo': ext,
        'x-gerente-token': String(args.token || '')
      },
      body: buf
    });
    let data = null;
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) return { ok: false, erro: (data && data.message) || ('Erro da nuvem (HTTP ' + r.status + ').') };
    return { ok: true, dados: data };
  } catch (e) {
    return { ok: false, erro: 'Sem conexão com a nuvem durante o envio da imagem.' };
  }
});

// ── ler um pedaço de imagem local como miniatura (só na prévia da tela) ─────
ipcMain.handle('g:thumb', async (_ev, args) => {
  try {
    const caminho = String(args.caminho || '');
    const ext = (path.extname(caminho).replace('.', '') || 'png').toLowerCase().replace('jpg', 'jpeg');
    const buf = fs.readFileSync(caminho);
    if (buf.length > 4 * 1024 * 1024) return { ok: false };
    return { ok: true, dataUrl: 'data:image/' + ext + ';base64,' + buf.toString('base64') };
  } catch (e) { return { ok: false }; }
});
