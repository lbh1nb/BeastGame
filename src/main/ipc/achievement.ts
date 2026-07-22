import { ipcMain } from 'electron'
import {
  getAllAchievements,
  unlockAchievement,
  updateAchievementProgress
} from '../db/repository'

/**
 * 注册成就相关 IPC 处理器
 * 通道：
 *  - achievement:getAll          获取全部成就
 *  - achievement:unlock          解锁成就，返回是否为新解锁
 *  - achievement:updateProgress  更新成就累计进度
 */
export function registerAchievementIpc(): void {
  // 获取全部成就
  ipcMain.handle('achievement:getAll', () => {
    return getAllAchievements()
  })

  // 解锁成就
  ipcMain.handle('achievement:unlock', (_event, id: string) => {
    return unlockAchievement(id)
  })

  // 更新成就进度
  ipcMain.handle(
    'achievement:updateProgress',
    (_event, id: string, progress: number) => {
      updateAchievementProgress(id, progress)
      return true
    }
  )
}
