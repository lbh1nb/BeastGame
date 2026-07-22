import { ipcMain } from 'electron'
import {
  saveGameRecord,
  getGameRecords,
  getBestScore,
  getRanking
} from '../db/repository'

/**
 * 注册分数相关 IPC 处理器
 * 通道：
 *  - score:save          保存单局记录
 *  - score:getRecords    查询记录（可按 mode 过滤，可限制条数）
 *  - score:getBest       获取指定模式最高分
 *  - score:getRanking    获取全局排行榜
 */
export function registerScoreIpc(): void {
  // 保存单局记录
  ipcMain.handle('score:save', (_event, record) => {
    const id = saveGameRecord(record)
    return id
  })

  // 查询记录
  ipcMain.handle('score:getRecords', (_event, mode?: string, limit?: number) => {
    return getGameRecords(mode, limit)
  })

  // 获取最高分
  ipcMain.handle('score:getBest', (_event, mode: string) => {
    return getBestScore(mode)
  })

  // 获取排行榜
  ipcMain.handle('score:getRanking', (_event, limit?: number) => {
    return getRanking(limit)
  })
}
