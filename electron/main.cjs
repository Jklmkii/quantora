const { app, BrowserWindow, ipcMain, dialog, session, Tray, Menu, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Configuração do autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Otimizações de consumo de memória RAM do processo V8 e Chromium
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256 --optimize_for_size');
app.commandLine.appendSwitch('disable-site-isolation-trials');

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

// Security: enforce webContents navigation restrictions globally
app.on('web-contents-created', (event, contents) => {
  // Prevent navigation to external sites inside the app window
  contents.on('will-navigate', (event, url) => {
    // Allow OAuth navigations for Supabase and Google authentication
    if (contents._isOAuth) return;

    try {
      const parsedUrl = new URL(url);
      if (
        parsedUrl.hostname.endsWith('supabase.co') ||
        parsedUrl.hostname.endsWith('google.com') ||
        parsedUrl.hostname.endsWith('google.com.br') ||
        parsedUrl.hostname.endsWith('gstatic.com') ||
        parsedUrl.hostname.endsWith('accounts.google.com')
      ) {
        return;
      }
    } catch {
      // Malformed URL, fall through
    }

    if (isDev && url.startsWith('http://localhost:5173')) return;

    if (!isDev) {
      if (url.startsWith('blob:')) return;
      if (url.startsWith('file://')) {
        try {
          const { fileURLToPath } = require('url');
          const parsedPath = fileURLToPath(url);
          const expectedDist = path.resolve(__dirname, '../dist');
          const expectedDistWithSep = expectedDist + path.sep;
          if (parsedPath === expectedDist || parsedPath.startsWith(expectedDistWithSep)) return;
        } catch {
          // invalid file URL, deny
        }
      }
    }

    event.preventDefault();
  });

  // Open external links in default OS browser
  contents.setWindowOpenHandler(({ url }) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
        require('electron').shell.openExternal(parsedUrl.href);
      }
    } catch {
      // Malformed URL, do nothing
    }
    return { action: 'deny' };
  });
});

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


  // Native OAuth Window Handler for Google Login in Desktop
  ipcMain.handle('auth:openOAuth', async (event, { url }) => {
    return new Promise((resolve) => {
      const authWindow = new BrowserWindow({
        width: 500,
        height: 650,
        parent: mainWindow || undefined,
        modal: true,
        show: true,
        autoHideMenuBar: true,
        title: 'Login com Google — Quantora',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      authWindow.webContents._isOAuth = true;

      // Emulate standard Chrome User Agent to bypass Google's disallowed_useragent
      authWindow.webContents.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      );

      authWindow.loadURL(url);

      let handled = false;
      const checkUrl = (targetUrl) => {
        if (!targetUrl || handled) return;
        // Do not intercept the callback request heading to Supabase server
        if (targetUrl.includes('/auth/v1/callback')) return;

        if (
          targetUrl.includes('access_token=') ||
          targetUrl.includes('refresh_token=') ||
          targetUrl.includes('code=') ||
          targetUrl.includes('error=')
        ) {
          handled = true;
          setTimeout(() => {
            if (!authWindow.isDestroyed()) authWindow.destroy();
          }, 150);
          resolve({ success: true, url: targetUrl });
        }
      };

      authWindow.webContents.on('will-redirect', (e, targetUrl) => checkUrl(targetUrl));
      authWindow.webContents.on('will-navigate', (e, targetUrl) => checkUrl(targetUrl));
      authWindow.webContents.on('did-navigate', (e, targetUrl) => checkUrl(targetUrl));
      authWindow.on('closed', () => {
        if (!handled) resolve({ success: false, canceled: true });
      });
    });
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

      // Support both Full Profile Backup and History Item Arrays
      const isFullBackup = Boolean(
        parsed && typeof parsed === 'object' && (parsed.profile || (parsed.state && parsed.state.profile))
      );

      if (isFullBackup) {
        const stateObj = parsed.state || parsed;
        if (typeof stateObj.profile?.totalXp !== 'number') {
          return {
            success: false,
            error: 'Formato inválido: perfil de usuário corrompido ou sem XP válido.',
          };
        }
        return { success: true, isFullBackup: true, data: parsed, path: filePath };
      }

      if (!Array.isArray(parsed)) {
        return {
          success: false,
          error: 'Formato inválido: o arquivo deve ser um backup completo de perfil ou lista de histórico.',
        };
      }

      // Validate each item structure
      const validTypes = ['bhaskara', 'regra_simples', 'regra_composta', 'physics'];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (
          !item ||
          typeof item !== 'object' ||
          typeof item.id !== 'string' || item.id.length > 100 ||
          typeof item.timestamp !== 'number' ||
          !validTypes.includes(item.type) ||
          typeof item.title !== 'string' || item.title.length > 200 ||
          typeof item.summary !== 'string' || item.summary.length > 1000 ||
          typeof item.details !== 'string' || item.details.length > 10000
        ) {
          return {
            success: false,
            error: `O item #${i + 1} do arquivo não segue a estrutura esperada do histórico.`,
          };
        }
      }

      return { success: true, isFullBackup: false, data: parsed, path: filePath };
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

