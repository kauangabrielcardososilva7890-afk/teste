// DIGICOPY ERP v3.8 - Main process (Electron)
// Responsável por: janela principal, IPC com Firebird e sistema de arquivos
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow () {
  try{ Menu.setApplicationMenu(null); }catch(e){}
  try{ app.setAppUserModelId('br.com.digicopy.erp.demo'); }catch(e){}
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'logo.png'),
    show: false,
    title: 'Sistema Digicopy'
  });

  win.loadFile('index.html');
  try{
    win.webContents.on('will-navigate', (event, url) => {
      if(String(url||'').startsWith('file://')) return;
      event.preventDefault();
      if(isAllowedExternalUrl(url)) shell.openExternal(url).catch(()=>{});
    });
  }catch(e){}
  try{ win.webContents.on('devtools-opened', () => win.webContents.closeDevTools()); }catch(e){}
  try{ win.webContents.on('before-input-event', (event, input) => {
    const k=String(input.key||'').toLowerCase();
    if((input.control||input.meta) && input.shift && ['i','j','c'].includes(k)) event.preventDefault();
    if(k==='f12') event.preventDefault();
  }); }catch(e){}
  win.webContents.on('context-menu', e => e.preventDefault());
  win.once('ready-to-show', () => win.show());
  return win;
}

app.whenReady().then(() => {
  mainWindow = createWindow();
  registerFirebirdIPC();
  registerFileIPC();
  registerEscolaIPC();
  registerPrintIPC();
  registerBackupIPC();
  registerOpenExternalIPC();
  registerNfeCertIPC();
  registerEscolaLoginIPC();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });
});

// Imprime sem cabeçalho/rodapé do navegador (sem contador de páginas nem URL)
function registerPrintIPC(){
  ipcMain.handle('print:clean', (evt) => {
    return new Promise((resolve) => {
      try{
        evt.sender.print({ printBackground: true, header: '', footer: '' }, (success) => resolve(!!success));
      }catch(e){ resolve(false); }
    });
  });
  ipcMain.handle('print:clean-silent', (evt) => {
    return new Promise((resolve) => {
      try{
        evt.sender.print({ silent: true, printBackground: true, header: '', footer: '' }, (success) => resolve(!!success));
      }catch(e){ resolve(false); }
    });
  });
}

// Dá preload às janelas de impressão (window.open) + intercepta Ctrl+P em todas
app.on('web-contents-created', (_event, contents) => {
  try{
    contents.setWindowOpenHandler((details) => {
      const url = String((details && details.url) || '');
      // Janelas internas de impressão usam about:blank. URLs externas não
      // recebem preload nem acesso às pontes IPC do sistema.
      if(url !== 'about:blank' && !url.startsWith('file://')) return { action:'deny' };
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            preload: path.join(__dirname, 'preload.js')
          }
        }
      };
    });
  }catch(e){}
  // Ctrl+P em qualquer janela (inclusive a janela de impressão aberta):
  // imprime LIMPO, sem cabeçalho/rodapé (sem URL nem contador de páginas).
  try{
    contents.on('before-input-event', (event, input) => {
      const k = String(input.key || '').toLowerCase();
      if((input.control || input.meta) && k === 'p'){
        event.preventDefault();
        try{ contents.print({ printBackground: true, header: '', footer: '' }, () => {}); }catch(e){}
      }
    });
  }catch(e){}
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ──────────────────────────────────────────────
// FIREBIRD IPC — conexão direta ao banco .FDB
// ──────────────────────────────────────────────
function registerFirebirdIPC(){
  // Lazy-load para não quebrar se node-firebird não estiver instalado
  let Firebird = null;
  function getFirebird(){
    if(!Firebird){
      try { Firebird = require('node-firebird'); }
      catch(e){
        console.error('node-firebird não instalado:', e.message);
        return null;
      }
    }
    return Firebird;
  }

  // Testar conexão
  ipcMain.handle('firebird:test', async (_evt, config) => {
    const fb = getFirebird();
    if(!fb) return { ok:false, error:'node-firebird não instalado. Rode: npm install node-firebird' };
    const opts = {
      host: config.host || 'localhost',
      port: config.port || 3050,
      database: config.database || '',
      user: config.user || 'SYSDBA',
      password: config.password || 'masterkey',
      lowercase_keys: true,
      role: undefined,
      blobAsText: true
    };
    return new Promise((resolve) => {
      fb.attach(opts, (err, db) => {
        if(err) return resolve({ ok:false, error: err.message || String(err) });
        // Testar query simples
        db.query('SELECT 1 as teste FROM RDB$DATABASE', (qErr, result) => {
          db.detach();
          if(qErr) return resolve({ ok:false, error: qErr.message });
          resolve({ ok:true, message:'Conexão OK com Firebird' });
        });
      });
    });
  });

  // Listar tabelas do banco
  ipcMain.handle('firebird:tables', async (_evt, config) => {
    const fb = getFirebird();
    if(!fb) return { ok:false, error:'node-firebird não instalado' };
    const opts = buildFbOpts(config);
    return new Promise((resolve) => {
      fb.attach(opts, (err, db) => {
        if(err) return resolve({ ok:false, error: err.message });
        const sql = `SELECT RDB$RELATION_NAME as nome, RDB$SYSTEM_FLAG as sistema
                     FROM RDB$RELATIONS
                     WHERE RDB$VIEW_BLR IS NULL
                       AND (RDB$SYSTEM_FLAG IS NULL OR RDB$SYSTEM_FLAG = 0)
                     ORDER BY RDB$RELATION_NAME`;
        db.query(sql, (qErr, rows) => {
          if(qErr){ db.detach(); return resolve({ ok:false, error: qErr.message }); }
          const tables = (rows||[]).map(r => {
            const nome = (r.nome||'').trim();
            return nome;
          }).filter(Boolean);
          // Para cada tabela, contar registros
          let pendentes = tables.length;
          const resultado = {};
          if(pendentes === 0){ db.detach(); return resolve({ ok:true, tables:[] }); }
          tables.forEach(t => {
            db.query(`SELECT COUNT(*) as total FROM "${t}"`, (cErr, cRows) => {
              resultado[t] = { nome: t, total: cErr ? -1 : (cRows && cRows[0] ? Number(cRows[0].total) : 0) };
              pendentes--;
              if(pendentes <= 0){
                db.detach();
                const lista = Object.values(resultado).sort((a,b)=>a.nome.localeCompare(b.nome));
                resolve({ ok:true, tables: lista });
              }
            });
          });
        });
      });
    });
  });

  // Extrair colunas de uma tabela
  ipcMain.handle('firebird:columns', async (_evt, config, tableName) => {
    const fb = getFirebird();
    if(!fb) return { ok:false, error:'node-firebird não instalado' };
    const opts = buildFbOpts(config);
    return new Promise((resolve) => {
      fb.attach(opts, (err, db) => {
        if(err) return resolve({ ok:false, error: err.message });
        const sql = `SELECT r.RDB$FIELD_NAME as campo, f.RDB$FIELD_TYPE as tipo, f.RDB$FIELD_LENGTH as tamanho
                     FROM RDB$RELATION_FIELDS r
                     LEFT JOIN RDB$FIELDS f ON r.RDB$FIELD_SOURCE = f.RDB$FIELD_NAME
                     WHERE r.RDB$RELATION_NAME = ?
                     ORDER BY r.RDB$FIELD_POSITION`;
        db.query(sql, [tableName], (qErr, rows) => {
          db.detach();
          if(qErr) return resolve({ ok:false, error: qErr.message });
          const cols = (rows||[]).map(r => ({
            campo: (r.campo||'').trim(),
            tipo: mapFbType(r.tipo),
            tamanho: r.tamanho || null
          }));
          resolve({ ok:true, columns: cols });
        });
      });
    });
  });

  // Extrair dados de uma tabela (com limite)
  ipcMain.handle('firebird:extract', async (_evt, config, tableName, limit) => {
    const fb = getFirebird();
    if(!fb) return { ok:false, error:'node-firebird não instalado' };
    const opts = buildFbOpts(config);
    const lim = Math.min(limit || 50000, 200000);
    return new Promise((resolve) => {
      fb.attach(opts, (err, db) => {
        if(err) return resolve({ ok:false, error: err.message });
        const sql = `SELECT FIRST ${lim} * FROM "${tableName}"`;
        db.query(sql, (qErr, rows) => {
          db.detach();
          if(qErr) return resolve({ ok:false, error: qErr.message });
          // Normalizar chaves e valores
          const data = (rows||[]).map(row => {
            const obj = {};
            for(const [k,v] of Object.entries(row)){
              const key = k.trim();
              if(v instanceof Date) obj[key] = v.toISOString();
              else if(Buffer.isBuffer(v)) obj[key] = v.toString('utf8');
              else obj[key] = v;
            }
            return obj;
          });
          resolve({ ok:true, total: data.length, data });
        });
      });
    });
  });

  // Extrair múltiplas tabelas de uma vez (para migração completa)
  ipcMain.handle('firebird:extract-all', async (_evt, config, tableList) => {
    const fb = getFirebird();
    if(!fb) return { ok:false, error:'node-firebird não instalado' };
    const opts = buildFbOpts(config);
    const tables = tableList || ['CLIENTES','PRODUTOS','VENDAS','ITENS_VENDA','EQUIPAMENTOS','LOCACAO','CONTAS_RECEBER','CONTAS_PAGAR'];
    return new Promise((resolve) => {
      fb.attach(opts, (err, db) => {
        if(err) return resolve({ ok:false, error: err.message });
        const resultado = {};
        let pendentes = tables.length;
        if(pendentes === 0){ db.detach(); return resolve({ ok:true, data:{} }); }
        tables.forEach(t => {
          const sql = `SELECT FIRST 100000 * FROM "${t}"`;
          db.query(sql, (qErr, rows) => {
            if(qErr){
              resultado[t] = { error: qErr.message, data: [] };
            } else {
              const data = (rows||[]).map(row => {
                const obj = {};
                for(const [k,v] of Object.entries(row)){
                  const key = k.trim();
                  if(v instanceof Date) obj[key] = v.toISOString();
                  else if(Buffer.isBuffer(v)) obj[key] = v.toString('utf8');
                  else obj[key] = v;
                }
                return obj;
              });
              resultado[t] = { error: null, data };
            }
            pendentes--;
            if(pendentes <= 0){
              db.detach();
              resolve({ ok:true, data: resultado });
            }
          });
        });
      });
    });
  });
}

function buildFbOpts(config){
  return {
    host: config.host || 'localhost',
    port: config.port || 3050,
    database: config.database || '',
    user: config.user || 'SYSDBA',
    password: config.password || 'masterkey',
    lowercase_keys: true,
    blobAsText: true
  };
}

function mapFbType(typeNum){
  // Firebird field types
  const map = {
    7:'SMALLINT', 8:'INTEGER', 9:'QUAD', 10:'FLOAT',
    12:'DATE', 13:'TIME', 14:'CHAR', 16:'BIGINT',
    23:'BOOLEAN', 27:'DOUBLE', 35:'TIMESTAMP',
    37:'VARCHAR', 40:'CSTRING', 45:'BLOB_ID',
    261:'BLOB'
  };
  return map[typeNum] || `TYPE_${typeNum}`;
}

function isAllowedExternalUrl(raw){
  try{
    const u = new URL(String(raw||''));
    if(u.protocol !== 'https:') return false;
    const host = String(u.hostname||'').toLowerCase();
    return host === 'caixaescolar.educacao.mg.gov.br' || host === 'www.caixaescolar.educacao.mg.gov.br';
  }catch(e){ return false; }
}

function nfeCertDir(){
  return path.join(app.getPath('userData'), 'certs');
}
function nfeCertPath(){
  return path.join(nfeCertDir(), 'nfe-a1.pfx');
}
function registerNfeCertIPC(){
  ipcMain.handle('nfe:cert-status', async () => {
    try{
      const p = nfeCertPath();
      if(!fs.existsSync(p)) return { ok:true, installed:false };
      const st = fs.statSync(p);
      return { ok:true, installed:true, bytes:st.size, updatedAt:st.mtimeMs, path:p };
    }catch(e){ return { ok:false, error:e.message||String(e) }; }
  });
  ipcMain.handle('nfe:cert-import', async () => {
    try{
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Selecionar certificado A1 (.pfx)',
        filters: [
          { name: 'Certificado A1', extensions: ['pfx', 'p12'] },
          { name: 'Todos os arquivos', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      if(result.canceled || !result.filePaths.length) return { ok:false, canceled:true };
      const src = result.filePaths[0];
      const ext = path.extname(src).toLowerCase();
      if(ext !== '.pfx' && ext !== '.p12') return { ok:false, error:'Selecione um arquivo .pfx ou .p12.' };
      fs.mkdirSync(nfeCertDir(), { recursive: true });
      fs.copyFileSync(src, nfeCertPath());
      const st = fs.statSync(nfeCertPath());
      return { ok:true, installed:true, bytes:st.size, updatedAt:st.mtimeMs };
    }catch(e){ return { ok:false, error:e.message||String(e) }; }
  });
  ipcMain.handle('nfe:cert-remove', async () => {
    try{
      const p = nfeCertPath();
      if(fs.existsSync(p)) fs.unlinkSync(p);
      return { ok:true, installed:false };
    }catch(e){ return { ok:false, error:e.message||String(e) }; }
  });
}

function registerOpenExternalIPC(){
  ipcMain.handle('shell:open-external', async (_evt, raw) => {
    const url = String(raw||'');
    if(!isAllowedExternalUrl(url)) return { ok:false, error:'URL não permitida.' };
    try{
      await shell.openExternal(url);
      return { ok:true };
    }catch(e){
      return { ok:false, error:e.message||String(e) };
    }
  });
}

// ──────────────────────────────────────────────
// BUSCADOR ESCOLA IPC — chamada HTTP sem CORS no Electron
// Mantém cookies/sessão entre requisições (como requests.Session do Python)
// ──────────────────────────────────────────────
function registerEscolaIPC(){
  const escolaCookies = new Map(); // cookie store for session persistence
  
  ipcMain.handle('escola:request', async (_evt, req) => {
    const method = String((req && req.method) || 'GET').toUpperCase();
    const url = String((req && req.url) || '');
    if(!/^https:\/\/api\.caixaescolar\.(educacao\.)?mg\.gov\.br\//.test(url)){
      return { ok:false, error:'URL inválida para o Buscador Escola' };
    }
    let lastErr = '';
    for(let tent=0; tent<3; tent++){
      try{
        const headers = { 'Content-Type':'application/json', 'Accept':'application/json' };
        if(req && req.token) headers.Authorization = 'Bearer ' + String(req.token);
        // Build cookie header from stored cookies
        const cookieParts = [];
        for(const [k,v] of escolaCookies) cookieParts.push(k+'='+v);
        if(req && req.cookie) cookieParts.push(String(req.cookie));
        if(cookieParts.length) headers.Cookie = cookieParts.join('; ');
        const resp = await fetch(url, { method, headers, body: req && req.body ? JSON.stringify(req.body) : undefined });
        // Store any Set-Cookie headers
        const setCookies = typeof resp.headers.getSetCookie === 'function' ? resp.headers.getSetCookie() : [];
        for(const sc of setCookies){
          const m = String(sc).match(/^([^=]+)=([^;]*)/);
          if(m) escolaCookies.set(m[1], m[2]);
        }
        // Also check single set-cookie
        const singleCookie = resp.headers.get('set-cookie');
        if(singleCookie && !setCookies.length){
          const m = String(singleCookie).match(/^([^=]+)=([^;]*)/);
          if(m) escolaCookies.set(m[1], m[2]);
        }
        const text = await resp.text();
        let data = null;
        try{ data = text ? JSON.parse(text) : null; }catch(e){ data = text; }
        if(resp.ok) return { ok:true, status:resp.status, data, cookies: setCookies };
        lastErr = (data && data.message) || text || resp.statusText;
        if(![429,500,502,503,504].includes(resp.status)) return { ok:false, status:resp.status, error:lastErr, data, cookies: setCookies };
      }catch(e){ lastErr = e.message || String(e); }
      await new Promise(r => setTimeout(r, 700 * (tent + 1)));
    }
    return { ok:false, error:lastErr || 'Falha na comunicação com a API' };
  });
  
  // Clear cookies on app quit
  ipcMain.handle('escola:clear-cookies', () => { escolaCookies.clear(); return {ok:true}; });
}

function escolaLoginPath(){
  return path.join(app.getPath('userData'), 'escola-login.json');
}
function registerEscolaLoginIPC(){
  ipcMain.handle('escola:login-status', async () => {
    try{
      const p = escolaLoginPath();
      if(!fs.existsSync(p)) return { ok:true, saved:false };
      const raw = JSON.parse(fs.readFileSync(p, 'utf8')||'{}');
      const usuario = String(raw.usuario||'').trim();
      const senha = String(raw.senha||'');
      return { ok:true, saved:!!(usuario&&senha), usuario, senha };
    }catch(e){ return { ok:false, saved:false, error:e.message||String(e) }; }
  });
  ipcMain.handle('escola:login-save', async (_evt, dados) => {
    try{
      const usuario = String((dados&&dados.usuario)||'').trim();
      const senha = String((dados&&dados.senha)||'');
      if(!usuario || !senha) return { ok:false, error:'Informe usuário e senha.' };
      fs.writeFileSync(escolaLoginPath(), JSON.stringify({ usuario, senha, atualizadoEm:new Date().toISOString() }), 'utf8');
      return { ok:true, saved:true, usuario };
    }catch(e){ return { ok:false, error:e.message||String(e) }; }
  });
  ipcMain.handle('escola:login-clear', async () => {
    try{
      const p = escolaLoginPath();
      if(fs.existsSync(p)) fs.unlinkSync(p);
      return { ok:true, saved:false };
    }catch(e){ return { ok:false, error:e.message||String(e) }; }
  });
}

// ──────────────────────────────────────────────
// BACKUP IPC — backup automático diário em pasta do %APPDATA%
// (salva direto, sem janela e sem clique; 1 arquivo por dia)
// ──────────────────────────────────────────────
function registerBackupIPC(){
  ipcMain.handle('backup:save-daily', async (_evt, payload) => {
    try{
      const dir = path.join(app.getPath('userData'), 'backups');
      fs.mkdirSync(dir, { recursive: true });
      const fname = String((payload && payload.filename) || ('digicopy-backup.json')).replace(/[^\w.\-]+/g,'_');
      const content = typeof (payload && payload.content) === 'string' ? payload.content : JSON.stringify((payload && payload.content) || {}, null, 2);
      const fpath = path.join(dir, fname);
      fs.writeFileSync(fpath, content, 'utf8');
      return { ok:true, path: fpath, dir };
    }catch(e){ return { ok:false, error: e.message || String(e) }; }
  });
}

// ──────────────────────────────────────────────
// FILE IPC — seleção de arquivos e exportação
// ──────────────────────────────────────────────
function registerFileIPC(){
  ipcMain.handle('file:select-fdb', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Selecionar banco Firebird (.FDB)',
      filters: [
        { name: 'Firebird Database', extensions: ['fdb','FDB'] },
        { name: 'Todos os arquivos', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    if(result.canceled || !result.filePaths.length) return { ok:false };
    return { ok:true, path: result.filePaths[0] };
  });

  ipcMain.handle('file:save-json', async (_evt, data, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar dados extraídos',
      defaultPath: defaultName || 'migração_digicopy.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if(result.canceled || !result.filePath) return { ok:false };
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8');
    return { ok:true, path: result.filePath };
  });
}
