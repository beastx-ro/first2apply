// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

const theme = process.argv[process.argv.length - 1];

contextBridge.exposeInMainWorld('electron', {
  invoke: ipcRenderer.invoke,
  on: (channel: string, callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  theme,
});
