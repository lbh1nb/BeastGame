import { app, BrowserWindow, protocol, net } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { initDB } from './db'
import { registerScoreIpc } from './ipc/score'
import { registerProgressIpc } from './ipc/progress'
import { registerAchievementIpc } from './ipc/achievement'
import { registerSettingsIpc } from './ipc/settings'
import { registerAssetIpc } from './ipc/asset'

// 注册自定义协议，使渲染进程可通过 fetch / <video> / <audio> 加载本地资源
// 需在 app ready 之前调用 registerSchemesAsPrivileged
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'assets',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true
    }
  }
])

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 1200,
    minWidth: 600,
    minHeight: 900,
    show: false,
    autoHideMenuBar: true,
    title: '兽了个兽',
    backgroundColor: '#fff5e1',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  // 处理 assets 协议：将 assets://<subpath> 映射到 resources 目录下的文件
  protocol.handle('assets', (request) => {
    const url = new URL(request.url)
    // assets://animals/static/duck.jpg -> host=animals, pathname=/static/duck.jpg
    const rel = decodeURIComponent(url.hostname + url.pathname)
    const base = app.isPackaged
      ? process.resourcesPath
      : path.join(app.getAppPath(), 'resources')
    const filePath = path.resolve(base, rel)
    // 防目录穿越：确保解析结果仍在 resources 目录内
    if (filePath !== base && !filePath.startsWith(base + path.sep)) {
      return new Response('Not Found', { status: 404 })
    }
    return net.fetch(pathToFileURL(filePath).toString())
  })

  // 初始化数据库（异步）
  await initDB()

  // 注册所有 IPC 处理器
  registerScoreIpc()
  registerProgressIpc()
  registerAchievementIpc()
  registerSettingsIpc()
  registerAssetIpc()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
