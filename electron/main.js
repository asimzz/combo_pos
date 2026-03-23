const { app, BrowserWindow, shell } = require('electron')
const { join } = require('path')
const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false,
    icon: join(__dirname, '../public/logo.png'),
    titleBarStyle: 'default'
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${join(__dirname, '../.next/standalone/server.js')}`

  if (isDev) {
    mainWindow.loadURL(startUrl)
  } else {
    const { spawn } = require('child_process')
    const serverPath = join(__dirname, '../.next/standalone/server.js')

    const server = spawn('node', [serverPath], {
      env: { ...process.env, PORT: '3000' },
      stdio: 'inherit'
    })

    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000')
    }, 2000)
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    app.quit()
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})