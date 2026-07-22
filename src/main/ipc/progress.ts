import { ipcMain } from 'electron'
import {
  getAllProgress,
  getProgress,
  updateProgress,
  unlockLevel
} from '../db/repository'

/**
 * 注册闯关进度相关 IPC 处理器
 * 通道：
 *  - progress:getAll    获取所有关卡进度
 *  - progress:get       获取指定关卡进度
 *  - progress:update    更新关卡进度（status/stars/best_score/best_duration）
 *  - progress:unlock    解锁指定关卡
 */
export function registerProgressIpc(): void {
  // 获取全部进度
  ipcMain.handle('progress:getAll', () => {
    return getAllProgress()
  })

  // 获取指定关卡进度
  ipcMain.handle('progress:get', (_event, levelId: number) => {
    return getProgress(levelId)
  })

  // 更新关卡进度
  ipcMain.handle(
    'progress:update',
    (_event, levelId: number, data: any) => {
      updateProgress(levelId, data)
      return true
    }
  )

  // 解锁关卡
  ipcMain.handle('progress:unlock', (_event, levelId: number) => {
    unlockLevel(levelId)
    return true
  })
}
