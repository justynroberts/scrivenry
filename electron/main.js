const { app, BrowserWindow, shell, Menu, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const net = require('net')
const fs = require('fs')

// Configuration
const DEV_MODE = process.env.NODE_ENV !== 'production'
const PORT = 3847
const APP_URL = `http://localhost:${PORT}`

let mainWindow = null
let serverProcess = null

// Get paths for bundled resources
function getResourcesPath() {
  if (app.isPackaged) {
    return process.resourcesPath
  }
  return path.join(__dirname, '..')
}

function getNodePath() {
  if (DEV_MODE) {
    // In dev mode, use system node
    return process.platform === 'win32' ? 'node.exe' : 'node'
  }
  // In production, use bundled node
  const nodePath = path.join(process.resourcesPath, 'node')
  if (fs.existsSync(nodePath)) {
    return nodePath
  }
  // Fallback to system node
  return process.platform === 'win32' ? 'node.exe' : 'node'
}

function getAppPath() {
  if (app.isPackaged) {
    // In packaged app, the app files are in app.asar
    return path.join(process.resourcesPath, 'app.asar.unpacked')
  }
  return path.join(__dirname, '..')
}

// Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close()
      resolve(true)
    })
    server.listen(port)
  })
}

// Wait for server to be ready
function waitForServer(url, maxAttempts = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0

    const check = () => {
      const http = require('http')
      const req = http.get(url, (res) => {
        resolve(true)
      })

      req.on('error', () => {
        attempts++
        if (attempts >= maxAttempts) {
          reject(new Error('Server failed to start'))
        } else {
          setTimeout(check, 1000)
        }
      })

      req.setTimeout(2000, () => {
        req.destroy()
        attempts++
        if (attempts >= maxAttempts) {
          reject(new Error('Server timeout'))
        } else {
          setTimeout(check, 1000)
        }
      })
    }

    check()
  })
}

// Start Next.js server
async function startServer() {
  const portAvailable = await isPortAvailable(PORT)

  if (!portAvailable) {
    console.log(`Port ${PORT} already in use, assuming server is running...`)
    return
  }

  console.log('Starting Next.js server...')

  const nodePath = getNodePath()
  const appPath = getAppPath()
  const nextBin = path.join(appPath, 'node_modules', 'next', 'dist', 'bin', 'next')

  console.log(`Node path: ${nodePath}`)
  console.log(`App path: ${appPath}`)
  console.log(`Next bin: ${nextBin}`)

  // Set up environment for the server
  const serverEnv = {
    ...process.env,
    PORT: PORT.toString(),
    NODE_ENV: 'production'
  }

  // Use the bundled node to run next start
  serverProcess = spawn(nodePath, [nextBin, 'start', '-p', PORT.toString()], {
    cwd: appPath,
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Next.js] ${data.toString().trim()}`)
  })

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Next.js Error] ${data.toString().trim()}`)
  })

  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error)
    dialog.showErrorBox('Server Error', `Failed to start the application server: ${error.message}`)
    app.quit()
  })

  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Server exited with code ${code}`)
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Scrivenry',
    backgroundColor: '#0a0a0a',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      spellcheck: true
    },
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (DEV_MODE) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost') || url.startsWith(APP_URL)) {
      return { action: 'allow' }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL) && !url.startsWith('http://localhost')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

function createMenu() {
  const isMac = process.platform === 'darwin'

  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Page',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                window.dispatchEvent(new CustomEvent('scrivenry:new-page'))
              `)
            }
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(DEV_MODE ? [
          { type: 'separator' },
          { role: 'toggleDevTools' }
        ] : [])
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                window.dispatchEvent(new CustomEvent('scrivenry:shortcuts'))
              `)
            }
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

async function initialize() {
  console.log(`Scrivenry starting in ${DEV_MODE ? 'development' : 'production'} mode...`)
  console.log(`Resources path: ${getResourcesPath()}`)

  try {
    await startServer()

    console.log('Waiting for server to be ready...')
    await waitForServer(APP_URL)
    console.log('Server is ready!')

    createWindow()
    createMenu()

    mainWindow.loadURL(APP_URL)

  } catch (error) {
    console.error('Failed to initialize:', error)
    dialog.showErrorBox('Startup Error', `Failed to start Scrivenry: ${error.message}`)
    app.quit()
  }
}

app.whenReady().then(initialize)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initialize()
  }
})

app.on('before-quit', () => {
  if (serverProcess) {
    console.log('Shutting down server...')
    serverProcess.kill()
    serverProcess = null
  }
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
})
