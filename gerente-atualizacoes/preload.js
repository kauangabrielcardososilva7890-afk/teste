// v5.26.0 — ponte segura: a tela só enxerga ESTAS funções, nada de Node.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gerente', {
  api: (args) => ipcRenderer.invoke('g:api', args),
  pickExe: () => ipcRenderer.invoke('g:pick-exe'),
  pickImgs: () => ipcRenderer.invoke('g:pick-imgs'),
  uploadExe: (args) => ipcRenderer.invoke('g:upload-exe', args),
  uploadImg: (args) => ipcRenderer.invoke('g:upload-img', args),
  thumb: (args) => ipcRenderer.invoke('g:thumb', args),
  versao: () => ipcRenderer.invoke('g:versao')   // v5.26.3 — rodapé sempre na versão real
});
