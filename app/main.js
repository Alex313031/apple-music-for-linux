const fs = require('fs');
const path = require('path');
const contextMenu = require('electron-context-menu');
const electronLog = require('electron-log');
const { app, BrowserWindow, Menu, shell, nativeTheme } = require('electron');

const appName = 'Apple Music';
var appVersion = app.getVersion();
const electronVer = process.versions.electron;
const chromeVer = process.versions.chrome;
const nodeVer = process.versions.node;
const v8Ver = process.versions.v8;

if (process.env.SNAP_USER_COMMON) {
  localeFile = process.env.SNAP_USER_COMMON + '/locale';
  if (!fs.existsSync(localeFile)) {
    fs.writeFileSync(localeFile, app.getLocaleCountryCode());
  }
  locale = fs.readFileSync(localeFile).toString().substring(0, 2).toUpperCase();

  themeFile = process.env.SNAP_USER_COMMON + '/theme';
  if (!fs.existsSync(themeFile)) {
    fs.writeFileSync(themeFile, 'dark');
  }
  nativeTheme.themeSource = fs.readFileSync(themeFile).toString().toLowerCase();
}
else {
  locale = app.getLocaleCountryCode();
  themeFile = null;
  nativeTheme.themeSource = 'dark';
}

const appUrl = 'https://music.apple.com/'

const customCss =
  '.web-navigation__native-upsell {display: none !important;}'

function createWindow() {
  // Menu.setApplicationMenu(null)

  const mainWindow = new BrowserWindow({
    title: appName,
    width: 1000,
    height: 600,
    resizable: true,
    maximizable: true,
    icon: path.join(__dirname, 'icon64.png'),
    autoHideMenuBar: false,
    darkTheme: true,
    vibrancy: 'ultra-dark',
    toolbar: true,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      contextIsolation: false,
      sandbox: false,
      experimentalFeatures: true,
      webviewTag: true,
      devTools: true,
      javascript: true,
      plugins: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })
  mainWindow.loadURL(appUrl + locale.toLowerCase() + '/browse')

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyUp' && input.control && input.key.toLowerCase() === 'r') {
      mainWindow.reload();
    }
    else if (input.type === 'keyUp' && input.control && input.key.toLowerCase() === 'd') {
      if (nativeTheme.themeSource === 'light') {
        nativeTheme.themeSource = 'dark'
      }
      else {
        nativeTheme.themeSource = 'light'
      }
      if (themeFile) {
        fs.writeFileSync(themeFile, nativeTheme.themeSource);
      }
    }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(appUrl)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  });

  mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
    event.preventDefault()
    shell.openExternal(url)
  });

  mainWindow.webContents.on('did-navigate', () => {
    mainWindow.webContents.insertCSS(customCss)
  });

  mainWindow.webContents.on('page-title-updated', () => {
    mainWindow.webContents.insertCSS(customCss)
    mainWindow.setTitle(appName);
  });

  contextMenu({
    // Chromium context menu defaults
    showSelectAll: true,
    showCopyImage: true,
    showCopyImageAddress: true,
    showSaveImageAs: true,
    showCopyVideoAddress: true,
    showSaveVideoAs: true,
    showCopyLink: true,
    showSaveLinkAs: true,
    showInspectElement: true,
    showLookUpSelection: true,
    showSearchWithGoogle: true,
    prepend: (defaultActions, parameters, browserWindow) => [
    { label: 'Open Video in New Window',
      // Only show it when right-clicking video
      visible: parameters.mediaType === 'video',
      click: (linkURL) => {
        const newWin = new BrowserWindow({
        title: 'New Window',
        width: 1024,
        height: 768,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          contextIsolation: false,
          sandbox: false,
          experimentalFeatures: true,
          webviewTag: true,
          devTools: true,
          javascript: true,
          plugins: true,
          enableRemoteModule: true,
        },
        darkTheme: true,
        vibrancy: 'ultra-dark'
        });
        const vidURL = parameters.srcURL;
        newWin.loadURL(vidURL);
      }
    }]
  });

  mainWindow.on("close", () => {
    app.exit(0);
 });
}

app.on('widevine-ready', () => {
  createWindow()
  electronLog.info('Welcome to Apple Music for Linux!')
  electronLog.info('App Version: ' + appVersion)
  electronLog.info('Electron Version: ' + electronVer)
  electronLog.info('Chromium Version: ' + chromeVer)
  electronLog.info('NodeJS Version: ' + nodeVer)
  electronLog.info('V8 Version: ' + v8Ver)
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
