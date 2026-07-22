import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的游戏 API
const gameAPI = {
  // 分数与记录
  score: {
    save: (record: any) => ipcRenderer.invoke('score:save', record),
    getRecords: (mode?: string, limit?: number) =>
      ipcRenderer.invoke('score:getRecords', mode, limit),
    getBestScore: (mode: string) => ipcRenderer.invoke('score:getBest', mode),
    getRanking: (limit?: number) => ipcRenderer.invoke('score:getRanking', limit)
  },

  // 闯关进度
  progress: {
    getAll: () => ipcRenderer.invoke('progress:getAll'),
    get: (levelId: number) => ipcRenderer.invoke('progress:get', levelId),
    update: (levelId: number, data: any) =>
      ipcRenderer.invoke('progress:update', levelId, data),
    unlock: (levelId: number) => ipcRenderer.invoke('progress:unlock', levelId)
  },

  // 成就
  achievement: {
    getAll: () => ipcRenderer.invoke('achievement:getAll'),
    unlock: (id: string) => ipcRenderer.invoke('achievement:unlock', id),
    updateProgress: (id: string, progress: number) =>
      ipcRenderer.invoke('achievement:updateProgress', id, progress)
  },

  // 设置
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    reset: () => ipcRenderer.invoke('settings:reset'),
    clearAllData: () => ipcRenderer.invoke('settings:clearAllData')
  },

  // 资源路径解析
  asset: {
    resolve: (name: string) => ipcRenderer.invoke('asset:resolve', name),
    getDataPath: () => ipcRenderer.invoke('asset:getDataPath')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('gameAPI', gameAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.gameAPI = gameAPI
}

export type GameAPI = typeof gameAPI
