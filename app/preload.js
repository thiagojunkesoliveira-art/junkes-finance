const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("junkes", {
  ia: {
    status: () => ipcRenderer.invoke("ia:status"),
    salvarChave: chave => ipcRenderer.invoke("ia:salvar-chave", chave),
    removerChave: () => ipcRenderer.invoke("ia:remover-chave"),
    aconselhar: resumo => ipcRenderer.invoke("ia:aconselhar", resumo)
  },
  email: {
    status: () => ipcRenderer.invoke("email:status"),
    salvar: (email, senha) => ipcRenderer.invoke("email:salvar", { email, senha }),
    remover: () => ipcRenderer.invoke("email:remover"),
    verificar: () => ipcRenderer.invoke("email:verificar"),
    marcar: ids => ipcRenderer.invoke("email:marcar", ids)
  }
});
