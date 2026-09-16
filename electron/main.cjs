const { app, BrowserWindow, ipcMain, dialog, session, Tray, Menu, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Configuração do autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;
let quickPracticeWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 420,
    minHeight: 580,
    title: 'Quantora',
    icon: path.join(__dirname, '../build/icon.ico'),
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Remove standard default menu bar for clean native feel
  win.setMenuBarVisibility(false);

  // Apply CSP only in production via session headers to keep Vite HMR intact during dev
  if (!isDev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';",
          ],
        },
      });
    });
  }

  // Load app
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  // Open external links in default OS browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsedUrl = new URL(url);
      // Security: Only allow http and https protocols to prevent local file execution or NTLM relay attacks
      if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
        require('electron').shell.openExternal(parsedUrl.href);
      }
    } catch {
      // Malformed URL, do nothing
    }
    return { action: 'deny' };
  });

  // Prevent navigation to external sites inside the app window
  win.webContents.on('will-navigate', (event, url) => {
    // Only allow local app navigation
    if (isDev && url.startsWith('http://localhost:5173')) return;
    if (!isDev && (url.startsWith('file://') || url.startsWith('blob:'))) return;

    event.preventDefault();
  });

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  return win;
}

function createQuickPracticeWindow() {
  const win = new BrowserWindow({
    width: 360,
    height: 480,
    minWidth: 320,
    minHeight: 420,
    maxWidth: 420,
    maxHeight: 560,
    show: false,
    frame: false,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#020617',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.setMenuBarVisibility(false);

  if (isDev) {
    win.loadURL('http://localhost:5173#tray-practice');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'tray-practice' });
  }

  win.on('blur', () => {
    if (!win.webContents.isDevToolsOpened()) {
      win.hide();
    }
  });

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  return win;
}

function toggleQuickPracticeWindow() {
  if (!quickPracticeWindow || quickPracticeWindow.isDestroyed()) {
    quickPracticeWindow = createQuickPracticeWindow();
  }

  if (quickPracticeWindow.isVisible()) {
    quickPracticeWindow.hide();
    return;
  }

  try {
    if (tray) {
      const trayBounds = tray.getBounds();
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      const winWidth = 360;
      const winHeight = 480;

      let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (winWidth / 2));
      let y = Math.round(trayBounds.y - winHeight - 8);

      if (x + winWidth > screenWidth) x = screenWidth - winWidth - 12;
      if (x < 12) x = 12;
      if (y < 12) y = 12;
      if (y + winHeight > screenHeight) y = trayBounds.y + trayBounds.height + 8;

      quickPracticeWindow.setPosition(x, y, false);
    }
  } catch {
    // fallback se não conseguir calcular bounds
  }

  quickPracticeWindow.show();
  quickPracticeWindow.focus();
}

function setupTray() {
  const iconPath = path.join(__dirname, '../build/icon.ico');
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Quantora - Prática Rápida');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Nova conta rápida',
      click: () => {
        toggleQuickPracticeWindow();
        if (quickPracticeWindow && !quickPracticeWindow.isDestroyed()) {
          quickPracticeWindow.webContents.send('tray:new-question');
        }
      },
    },
    {
      label: 'Abrir Quantora',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        } else {
          mainWindow = createWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    toggleQuickPracticeWindow();
  });
}

// IPC Handlers
app.whenReady().then(() => {
  mainWindow = createWindow();
  setupTray();

  // Tray window IPC events
  ipcMain.on('tray:close', () => {
    if (quickPracticeWindow && !quickPracticeWindow.isDestroyed()) {
      quickPracticeWindow.hide();
    }
  });

  ipcMain.on('tray:open-main', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else {
      mainWindow = createWindow();
    }
  });


  // Save File Dialog
  ipcMain.handle('dialog:saveFile', async (event, { defaultName, content, filters }) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: filters || [
          { name: 'Arquivos JSON', extensions: ['json'] },
          { name: 'Arquivos CSV', extensions: ['csv'] },
          { name: 'Todos os Arquivos', extensions: ['*'] },
        ],
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      await fs.promises.writeFile(filePath, content, 'utf8');
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Open File Dialog with strict JSON schema validation
  ipcMain.handle('dialog:openFile', async (event, { filters }) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: filters || [{ name: 'Arquivos JSON', extensions: ['json'] }],
      });

      if (canceled || !filePaths || filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const filePath = filePaths[0];

      // File size check (5MB limit) to prevent memory exhaustion DoS
      const stats = await fs.promises.stat(filePath);
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (stats.size > MAX_FILE_SIZE) {
        return {
          success: false,
          error: 'O arquivo é muito grande (limite de 5MB).',
        };
      }

      const rawContent = await fs.promises.readFile(filePath, 'utf8');

      // Strict Schema Validation
      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        return {
          success: false,
          error: 'O arquivo selecionado não é um JSON válido ou está corrompido.',
        };
      }

      if (!Array.isArray(parsed)) {
        return {
          success: false,
          error: 'Formato inválido: o arquivo de backup deve conter uma lista (array) de itens.',
        };
      }

      // Validate each item structure
      const validTypes = ['bhaskara', 'regra_simples', 'regra_composta', 'physics'];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (
          !item ||
          typeof item !== 'object' ||
          typeof item.id !== 'string' ||
          typeof item.timestamp !== 'number' ||
          !validTypes.includes(item.type) ||
          typeof item.title !== 'string' ||
          typeof item.summary !== 'string' ||
          typeof item.details !== 'string'
        ) {
          return {
            success: false,
            error: `O item #${i + 1} do arquivo não segue a estrutura esperada do histórico.`,
          };
        }
      }

      return { success: true, data: parsed, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Auto-Updater status helper
  function sendUpdateStatus(data) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:status', data);
    }
  }

  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus({ status: 'checking', message: 'Buscando atualizações no GitHub...' });
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus({
      status: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
      message: `Nova versão ${info.version} disponível! Baixando atualização...`,
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus({
      status: 'not-available',
      message: 'O Quantora já está atualizado com a versão mais recente.',
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus({
      status: 'downloading',
      percent: Math.floor(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
      message: `Baixando atualização: ${Math.floor(progress.percent)}%`,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus({
      status: 'downloaded',
      version: info.version,
      message: `Versão ${info.version} pronta! Reinicie para atualizar.`,
    });
  });

  autoUpdater.on('error', (err) => {
    sendUpdateStatus({
      status: 'error',
      message: err.message || 'Não foi possível verificar atualizações no momento.',
    });
  });

  ipcMain.handle('updater:check', async () => {
    if (isDev) {
      return { success: true, message: 'Atualizações desativadas em ambiente de desenvolvimento.' };
    }
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, updateInfo: result?.updateInfo };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  });

  // Check for updates silently on startup after 3 seconds
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (isQuitting || process.platform === 'darwin') {
    app.quit();
  }
});

