// DIGICOPY ERP - Preload (contextBridge)
// Expõe APIs seguras do main process ao renderer.
//
// IMPORTANTE (v5.22.66): tudo é entregue dentro de UMA ponte só,
// `__digicopyPontes`. O contextBridge CONGELA o que ele expõe, e o
// sistema tem patches que precisam envelopar esses métodos (por
// exemplo trocar `nfeCertAPI.assinar` para injetar o A1 da nuvem).
// Mexer no objeto congelado dá "Cannot assign to read only property"
// e derruba o patch — acontecia só no .exe, nunca no navegador.
//
// Quem transforma a ponte nos globais de sempre (firebirdAPI, fileAPI,
// nfeCertAPI, ...) é o `ponte_electron_patch.js`, o PRIMEIRO script do
// bundle. Ele faz uma cópia normal, que pode ser envelopada à vontade.
// Não volte a usar exposeInMainWorld com esses nomes.
const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('DIGICOPY ERP carregado');
});

const pontes = {
  // API Firebird — conexão direta ao banco .FDB
  firebirdAPI: {
    test:    (config)              => ipcRenderer.invoke('firebird:test', config),
    tables:  (config)              => ipcRenderer.invoke('firebird:tables', config),
    columns: (config, tableName)   => ipcRenderer.invoke('firebird:columns', config, tableName),
    extract: (config, table, lim)  => ipcRenderer.invoke('firebird:extract', config, table, lim),
    extractAll: (config, tables)   => ipcRenderer.invoke('firebird:extract-all', config, tables),
    // Detectar se está rodando em Electron com node-firebird disponível
    isElectron: () => true
  },

  // API de arquivos — seleção e exportação
  fileAPI: {
    selectFdb: ()  => ipcRenderer.invoke('file:select-fdb'),
    saveJson: (data, name) => ipcRenderer.invoke('file:save-json', data, name)
  },

  // API Buscador Escola — evita bloqueio de CORS no Electron
  caixaEscolarAPI: {
    request: (req) => ipcRenderer.invoke('escola:request', req),
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
    loginStatus: () => ipcRenderer.invoke('escola:login-status'),
    loginSave: (dados) => ipcRenderer.invoke('escola:login-save', dados),
    loginClear: () => ipcRenderer.invoke('escola:login-clear')
  },

  // API de impressão limpa — imprime sem cabeçalho/rodapé do navegador
  // (sem contador de páginas nem URL "about:blank")
  printAPI: {
    cleanPrint: () => ipcRenderer.invoke('print:clean'),
    cleanPrintSilent: () => ipcRenderer.invoke('print:clean-silent'),
    isElectron: true
  },

  // API de backup automático — salva 1x ao dia em %APPDATA%\digicopy-erp\backups
  backupAPI: {
    saveDaily: (filename, content) => ipcRenderer.invoke('backup:save-daily', { filename, content }),
    isElectron: true
  },

  nfeCertAPI: {
    status: () => ipcRenderer.invoke('nfe:cert-status'),
    importar: () => ipcRenderer.invoke('nfe:cert-import'),
    remover: () => ipcRenderer.invoke('nfe:cert-remove'),
    assinar: (xml, senha, pfxB64) => ipcRenderer.invoke('nfe:sign-xml', { xml, senha, pfxB64 }),
    isElectron: true
  }
};

contextBridge.exposeInMainWorld('__digicopyPontes', pontes);