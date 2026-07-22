import { app, ipcMain } from 'electron'
import path from 'path'

/**
 * 注册资源路径相关 IPC 处理器
 * 通道：
 *  - asset:resolve       将资源名拼接为完整路径
 *       - 打包环境：process.resourcesPath + name
 *       - 开发环境：app.getAppPath()/resources + name
 *  - asset:getDataPath   返回 app.getPath('userData')
 */
export function registerAssetIpc(): void {
  // 解析资源完整路径
  ipcMain.handle('asset:resolve', (_event, name: string) => {
    const base = app.isPackaged
      ? process.resourcesPath
      : path.join(app.getAppPath(), 'resources')
    if (!name) {
      return base
    }
    return path.join(base, name)
  })

  // 返回用户数据目录
  ipcMain.handle('asset:getDataPath', () => {
    return app.getPath('userData')
  })
}
