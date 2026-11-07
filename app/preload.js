const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("junkes", {
  ia: {
    status: () => ipcRenderer.invoke("ia:status"),
    salvarChave: chave => ipcRenderer.invoke("ia:salvar-chave", chave),
    removerChave: () => ipcRenderer.invoke("ia:remover-chave"),
    aconselhar: resumo => ipcRenderer.invoke("ia:aconselhar", resumo)
  }
});
