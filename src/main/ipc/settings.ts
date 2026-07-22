import { ipcMain } from 'electron'
import {
  getAllSettings,
  getSetting,
  setSetting,
  resetSettings,
  clearAllData
} from '../db/repository'

/**
 * 注册设置相关 IPC 处理器
 * 通道：
 *  - settings:getAll    获取全部设置
 *  - settings:get       获取单个设置
 *  - settings:set       写入设置（value 自动序列化为 JSON）
 *  - settings:reset     重置为默认设置
 */
export function registerSettingsIpc(): void {
  // 获取全部设置
  ipcMain.handle('settings:getAll', () => {
    return getAllSettings()
  })

  // 获取单个设置
  ipcMain.handle('settings:get', (_event, key: string) => {
    return getSetting(key)
  })

  // 写入设置
  ipcMain.handle('settings:set', (_event, key: string, value: any) => {
    setSetting(key, value)
    return true
  })

  // 重置为默认设置
  ipcMain.handle('settings:reset', () => {
    resetSettings()
    return true
  })

  // 清空所有数据（记录 / 进度 / 成就 + 重置设置）
  ipcMain.handle('settings:clearAllData', () => {
    clearAllData()
    resetSettings()
    return true
  })
}
