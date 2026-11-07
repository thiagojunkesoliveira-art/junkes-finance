const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const ia = require("./ia");
const email = require("./email");

if (!app.requestSingleInstanceLock()) app.quit();
app.setAppUserModelId("com.junkes.finance");

let win;
function criarJanela() {
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, minHeight: 500,
    title: "Junkes Finance",
    backgroundColor: "#FFFFFF",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, "preload.js") }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "index.html"), { query: { v: app.getVersion() } });
  win.once("ready-to-show", () => { win.maximize(); win.show(); });
  // Links externos abrem no navegador
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
}

/* Atualização automática pelas versões publicadas no GitHub */
function configurarAtualizacao() {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-downloaded", async info => {
    const { response } = await dialog.showMessageBox(win, {
      type: "info",
      title: "Atualização disponível",
      message: `A versão ${info.version} da Junkes Finance está pronta.`,
      detail: "Reinicie para atualizar agora. Seus lançamentos continuam salvos.",
      buttons: ["Reiniciar agora", "Depois"],
      defaultId: 0, cancelId: 1
    });
    if (response === 0) autoUpdater.quitAndInstall();
  });
  autoUpdater.on("error", () => {}); // sem internet: tenta de novo mais tarde
  const verificar = () => autoUpdater.checkForUpdates().catch(() => {});
  verificar();
  setInterval(verificar, 4 * 60 * 60 * 1000);
}

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
ipcMain.handle("ia:status", () => ia.status());
ipcMain.handle("ia:salvar-chave", (_e, chave) => ia.salvarChave(chave));
ipcMain.handle("ia:remover-chave", () => ia.removerChave());
ipcMain.handle("ia:aconselhar", (_e, resumo) => ia.aconselhar(resumo));
ipcMain.handle("email:status", () => email.status());
ipcMain.handle("email:salvar", (_e, d) => email.salvar(d && d.email, d && d.senha));
ipcMain.handle("email:remover", () => email.remover());
ipcMain.handle("email:verificar", () => email.verificar());
ipcMain.handle("email:marcar", (_e, ids) => email.marcar(ids));

app.whenReady().then(() => { criarJanela(); configurarAtualizacao(); });
app.on("window-all-closed", () => app.quit());
