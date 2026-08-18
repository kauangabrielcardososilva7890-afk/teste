// DIGICOPY ERP v3.8 - Preload (contextBridge)
// Expõe APIs seguras do main process ao renderer
const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('DIGICOPY ERP carregado');
});

// API Firebird — conexão direta ao banco .FDB
contextBridge.exposeInMainWorld('firebirdAPI', {
  test:    (config)              => ipcRenderer.invoke('firebird:test', config),
  tables:  (config)              => ipcRenderer.invoke('firebird:tables', config),
  columns: (config, tableName)   => ipcRenderer.invoke('firebird:columns', config, tableName),
  extract: (config, table, lim)  => ipcRenderer.invoke('firebird:extract', config, table, lim),
  extractAll: (config, tables)   => ipcRenderer.invoke('firebird:extract-all', config, tables),
  // Detectar se está rodando em Electron com node-firebird disponível
  isElectron: () => true
});

// API de arquivos — seleção e exportação
contextBridge.exposeInMainWorld('fileAPI', {
  selectFdb: ()  => ipcRenderer.invoke('file:select-fdb'),
  saveJson: (data, name) => ipcRenderer.invoke('file:save-json', data, name)
});

// API Buscador Escola — evita bloqueio de CORS no Electron
contextBridge.exposeInMainWorld('caixaEscolarAPI', {
  request: (req) => ipcRenderer.invoke('escola:request', req),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  loginStatus: () => ipcRenderer.invoke('escola:login-status'),
  loginSave: (dados) => ipcRenderer.invoke('escola:login-save', dados),
  loginClear: () => ipcRenderer.invoke('escola:login-clear')
});

// API de impressão limpa — imprime sem cabeçalho/rodapé do navegador
// (sem contador de páginas nem URL "about:blank")
contextBridge.exposeInMainWorld('printAPI', {
  cleanPrint: () => ipcRenderer.invoke('print:clean'),
  cleanPrintSilent: () => ipcRenderer.invoke('print:clean-silent'),
  isElectron: true
});

// API de backup automático — salva 1x ao dia em %APPDATA%\digicopy-erp\backups
contextBridge.exposeInMainWorld('backupAPI', {
  saveDaily: (filename, content) => ipcRenderer.invoke('backup:save-daily', { filename, content }),
  isElectron: true
});

contextBridge.exposeInMainWorld('nfeCertAPI', {
  status: () => ipcRenderer.invoke('nfe:cert-status'),
  importar: () => ipcRenderer.invoke('nfe:cert-import'),
  remover: () => ipcRenderer.invoke('nfe:cert-remove'),
  isElectron: true
});