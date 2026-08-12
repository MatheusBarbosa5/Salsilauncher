const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

function createWindow() {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

ipcMain.handle('selecionar-arquivo', async () => {
  const resultado = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Arquivos de texto', extensions: ['txt', 'json', 'csv'] },
      { name: 'Todos os arquivos', extensions: ['*'] }
    ]
  });

  if (resultado.canceled || resultado.filePaths.length === 0) {
    return null;
  }

  const caminho = resultado.filePaths[0];

  const conteudo = await fs.readFile(caminho, 'utf8');

  return {
    caminho,
    nome: path.basename(caminho),
    conteudo
  };
});

app.whenReady().then(createWindow);