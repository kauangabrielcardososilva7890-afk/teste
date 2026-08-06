// DIGICOPY ERP v3.8 - Main process (Electron)
// Responsável por: janela principal, IPC com Firebird e sistema de arquivos
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
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
      devTools: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'logo.png'),
    show: false,
    title: 'Sistema Digicopy'
  });

  win.loadFile('index.html');
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
  registerAIIPC();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });
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

// ──────────────────────────────────────────────
// ASSISTENTE IA IPC — ChatGPT opcional com chave local do usuário
// ──────────────────────────────────────────────
function registerAIIPC(){
  ipcMain.handle('ai:chat', async (_evt, req) => {
    try{
      const apiKey=String((req&&req.apiKey)||'').trim();
      const prompt=String((req&&req.prompt)||'').trim();
      const model=String((req&&req.model)||'gpt-4o-mini').trim()||'gpt-4o-mini';
      if(!apiKey) return {ok:false,error:'Chave da IA não informada'};
      if(!prompt) return {ok:false,error:'Mensagem vazia'};
      const system='Você é o assistente do Sistema Digicopy. Responda em português brasileiro, direto, prático e focado nas funções do sistema: clientes, vendas, notinhas, chamados, contratos, leituras, etiquetas, Buscador Escola, Pix e financeiro. Não invente dados privados.';
      const resp=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify({model,messages:[{role:'system',content:system},{role:'user',content:prompt}],temperature:0.2,max_tokens:500})});
      const data=await resp.json().catch(()=>null);
      if(!resp.ok) return {ok:false,status:resp.status,error:(data&&data.error&&data.error.message)||resp.statusText};
      return {ok:true,text:(((data||{}).choices||[])[0]||{}).message?.content||''};
    }catch(e){ return {ok:false,error:e.message||String(e)}; }
  });
}

// ──────────────────────────────────────────────
// BUSCADOR ESCOLA IPC — chamada HTTP sem CORS no Electron
// ──────────────────────────────────────────────
function registerEscolaIPC(){
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
        if(req && req.cookie) headers.Cookie = String(req.cookie);
        const resp = await fetch(url, { method, headers, body: req && req.body ? JSON.stringify(req.body) : undefined });
        const text = await resp.text();
        let data = null;
        try{ data = text ? JSON.parse(text) : null; }catch(e){ data = text; }
        const cookies = typeof resp.headers.getSetCookie === 'function' ? resp.headers.getSetCookie() : (resp.headers.get('set-cookie') ? [resp.headers.get('set-cookie')] : []);
        if(resp.ok) return { ok:true, status:resp.status, data, cookies };
        lastErr = (data && data.message) || text || resp.statusText;
        if(![429,500,502,503,504].includes(resp.status)) return { ok:false, status:resp.status, error:lastErr, data, cookies };
      }catch(e){ lastErr = e.message || String(e); }
      await new Promise(r => setTimeout(r, 700 * (tent + 1)));
    }
    return { ok:false, error:lastErr || 'Falha na comunicação com a API' };
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
