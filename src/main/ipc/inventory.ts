import { ipcMain } from 'electron'
import {
  getAllInventory,
  getInventory,
  addInventory
} from '../db/repository'

/**
 * 注册库存相关 IPC 处理器
 * 通道：
 *  - inventory:getAll    获取全部库存（Record<string, number>）
 *  - inventory:get       获取单个 key 数量
 *  - inventory:add       增减库存（delta 可为负），返回最新值
 */
export function registerInventoryIpc(): void {
  // 获取全部库存
  ipcMain.handle('inventory:getAll', () => {
    return getAllInventory()
  })

  // 获取单个 key 数量
  ipcMain.handle('inventory:get', (_event, key: string) => {
    return getInventory(key)
  })

  // 增减库存
  ipcMain.handle('inventory:add', (_event, key: string, delta: number) => {
    return addInventory(key, delta)
  })
}