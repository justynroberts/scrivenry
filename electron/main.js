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

// Window state persistence
const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json')

const DEFAULT_STATE = {
  width: 1400,
  height: 900,
  x: undefined,
  y: undefined,
  zoomFactor: 1.0
}

function loadWindowState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8')
      const state = JSON.parse(data)
      // Validate the loaded state
      if (state.width > 0 && state.height > 0) {
        return { ...DEFAULT_STATE, ...state }
      }
    }
  } catch (error) {
    console.log('Could not load window state:', error.message)
  }
  return DEFAULT_STATE
}

function saveWindowState() {
  if (!mainWindow) return

  try {
    const bounds = mainWindow.getBounds()
    const zoomFactor = mainWindow.webContents.getZoomFactor()

    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      zoomFactor: zoomFactor
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
  } catch (error) {
    console.log('Could not save window state:', error.message)
  }
}

// Get paths for bundled resources
function getResourcesPath() {
  if (app.isPackaged) {
    return process.resourcesPath
  }
  return path.join(__dirname, '..')
}

function getNodePath() {
  if (!app.isPackaged) {
    // In dev mode, use system node
    return process.platform === 'win32' ? 'node.exe' : 'node'
  }
  // In production, use bundled node
  const nodePath = path.join(process.resourcesPath, 'node')
  console.log('Looking for node at:', nodePath)
  if (fs.existsSync(nodePath)) {
    console.log('Found bundled node')
    return nodePath
  }
  console.log('Bundled node not found, using system node')
  // Fallback to system node
  return process.platform === 'win32' ? 'node.exe' : 'node'
}

function getAppPath() {
  if (app.isPackaged) {
    // In packaged app without asar, files are in resources/app
    return path.join(process.resourcesPath, 'app')
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
  const dataPath = app.isPackaged
    ? path.join(process.resourcesPath, 'data', 'scrivenry.db')
    : path.join(appPath, 'data', 'scrivenry.db')

  console.log(`Database path: ${dataPath}`)

  const serverEnv = {
    ...process.env,
    PORT: PORT.toString(),
    NODE_ENV: 'production',
    DATABASE_URL: `file:${dataPath}`
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
  const savedState = loadWindowState()

  const windowOptions = {
    width: savedState.width,
    height: savedState.height,
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
  }

  // Restore position if saved
  if (savedState.x !== undefined && savedState.y !== undefined) {
    windowOptions.x = savedState.x
    windowOptions.y = savedState.y
  }

  mainWindow = new BrowserWindow(windowOptions)

  mainWindow.once('ready-to-show', () => {
    // Restore zoom level
    if (savedState.zoomFactor && savedState.zoomFactor !== 1.0) {
      mainWindow.webContents.setZoomFactor(savedState.zoomFactor)
    }
    mainWindow.show()
  })

  // Save state on resize and move (debounced)
  let saveStateTimeout = null
  const debouncedSave = () => {
    if (saveStateTimeout) clearTimeout(saveStateTimeout)
    saveStateTimeout = setTimeout(saveWindowState, 500)
  }

  mainWindow.on('resize', debouncedSave)
  mainWindow.on('move', debouncedSave)

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

  // Save state before window closes
  mainWindow.on('close', () => {
    saveWindowState()
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
