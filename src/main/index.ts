import { app, BrowserWindow } from 'electron'
import path from 'path'
import { initDB } from './db'
import { registerScoreIpc } from './ipc/score'
import { registerProgressIpc } from './ipc/progress'
import { registerAchievementIpc } from './ipc/achievement'
import { registerSettingsIpc } from './ipc/settings'
import { registerAssetIpc } from './ipc/asset'

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
