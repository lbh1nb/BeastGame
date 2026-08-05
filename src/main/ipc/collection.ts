import { ipcMain } from 'electron'
import {
  getAllCollection,
  recordCollection,
  getCollectionCount
} from '../db/repository'

/**
 * 注册收藏品相关 IPC 处理器
 * 通道：
 *  - collection:getAll    获取全部收藏品
 *  - collection:record    记录一次获得，返回 'new' | 'duplicate'
 *  - collection:count     已收集数量
 */
export function registerCollectionIpc(): void {
  // 获取全部收藏品
  ipcMain.handle('collection:getAll', () => {
    return getAllCollection()
  })

  // 记录一次获得
  ipcMain.handle('collection:record', (_event, id: string, rarity: string) => {
    return recordCollection(id, rarity)
  })

  // 已收集数量
  ipcMain.handle('collection:count', () => {
    return getCollectionCount()
  })
}