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
  request: (req) => ipcRenderer.invoke('escola:request', req)
});

// Assistente IA Gemini opcional — usa chave local do usuário
contextBridge.exposeInMainWorld('digicopyAI', {
  chat: (req) => ipcRenderer.invoke('ai:chat', req)
});
