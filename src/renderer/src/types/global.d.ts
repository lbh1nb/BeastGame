/**
 * 全局类型声明
 * - 声明 window.gameAPI 的类型，让渲染层可以获得类型提示
 * - 与 src/preload/index.ts 暴露的接口保持一致
 */

interface GameAPI {
  /** 分数与单局记录 */
  score: {
    save: (record: any) => Promise<number>
    getRecords: (mode?: string, limit?: number) => Promise<any[]>
    getBestScore: (mode: string) => Promise<number | null>
    getRanking: (limit?: number) => Promise<any[]>
  }
  /** 闯关进度 */
  progress: {
    getAll: () => Promise<any[]>
    get: (levelId: number) => Promise<any | null>
    update: (levelId: number, data: any) => Promise<void>
    unlock: (levelId: number) => Promise<void>
  }
  /** 成就 */
  achievement: {
    getAll: () => Promise<any[]>
    unlock: (id: string) => Promise<boolean>
    updateProgress: (id: string, progress: number) => Promise<void>
  }
  /** 设置（KV） */
  settings: {
    getAll: () => Promise<Record<string, any>>
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
    reset: () => Promise<void>
    clearAllData: () => Promise<boolean>
  }
  /** 资源路径解析 */
  asset: {
    resolve: (name: string) => Promise<string>
    getDataPath: () => Promise<string>
  }
}

interface Window {
  gameAPI: GameAPI
}
