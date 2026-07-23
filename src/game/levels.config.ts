/**
 * 兽了个兽 - 30 关配置 + 6 章配置（全屏单大堆版）
 * 纯逻辑层，不依赖 vue / electron
 *
 * v4 改动：
 *  - 层数增量：8~12 → 11~15（层次更多，"以为没有了其实还有"）
 *  - 牌数增量：180~540 → 210~585（适配更多层数）
 *  - 网格保持 8列×10行=80格，pickCells 改为紧凑分布
 *  - 取消多区域，全部为单大堆
 */
import type { AnimalType, LevelConfig } from './types'

/** 章节配置 */
export interface Chapter {
  id: number
  name: string
  animals: AnimalType[]
  /** 主题色（浅色系） */
  theme: string
}

/**
 * 6 章配置（v4：20 种动物，每章 4 种，主色不撞色）
 * 章节按动物栖息地分类，综合章跨类精选
 */
export const CHAPTERS: Chapter[] = [
  { id: 1, name: '家畜', animals: ['sheep', 'pig', 'chicken', 'dog'], theme: '#FFF8DC' },           // 浅黄
  { id: 2, name: '野生', animals: ['tiger', 'lion', 'bear', 'fox'], theme: '#FFE8CC' },             // 浅橙
  { id: 3, name: '森林', animals: ['frog', 'crocodile', 'elephant', 'panda'], theme: '#E6F5E6' },   // 浅绿
  { id: 4, name: '鸟类', animals: ['flamingo', 'peacock', 'penguin', 'parrot'], theme: '#FFE4E1' }, // 浅粉
  { id: 5, name: '海洋', animals: ['fish', 'whale', 'octopus', 'jellyfish'], theme: '#E0F0FF' },     // 浅蓝
  { id: 6, name: '综合', animals: ['tiger', 'fox', 'fish', 'peacock'], theme: '#ECE0FF' }            // 浅紫
]

/** Boss 关时间限制（秒） */
export const BOSS_TIME_LIMIT = 240

/** 全屏单大堆网格配置 */
const GRID_ROWS = 10
const GRID_COLS = 8

/**
 * 把数值向上/就近对齐到 matchCount 的倍数
 */
function alignToMultiple(value: number, m: number): number {
  return Math.max(m, Math.round(value / m) * m)
}

/**
 * 关卡原始描述（便于批量生成）
 */
interface LevelSeed {
  /** 章节 1-6 */
  chapter: number
  /** 4 个普通关的图案数（第 5 关为 boss，由第 4 关 *1.3 推算） */
  normalTiles: [number, number, number, number]
  /** 5 个关的层数（最后一关为 boss） */
  layerList: [number, number, number, number, number]
}

/**
 * 30 关的原始数据：每章 5 关，第 5 关为 boss
 * 难度递增：tiles 210 → 585，layers 11 → 15
 * 所有普通关为 3 消（matchCount=3, maxSlots=7），Boss 关 maxSlots=6
 * 每章 4 种动物，牌数均为 3 的倍数
 *
 * 每层网格 8×10=80 格，11 层最多 880 张，15 层最多 1200 张
 * pickCells 紧凑分布（中心75%优先），避免画面空旷
 */
const LEVEL_SEEDS: LevelSeed[] = [
  // 第 1 章 家畜
  { chapter: 1, normalTiles: [210, 240, 270, 300], layerList: [11, 11, 12, 12, 12] },
  // 第 2 章 野生
  { chapter: 2, normalTiles: [240, 270, 300, 330], layerList: [11, 12, 12, 13, 13] },
  // 第 3 章 森林
  { chapter: 3, normalTiles: [270, 300, 330, 360], layerList: [12, 12, 13, 13, 13] },
  // 第 4 章 鸟类
  { chapter: 4, normalTiles: [300, 330, 360, 390], layerList: [12, 13, 13, 14, 14] },
  // 第 5 章 海洋
  { chapter: 5, normalTiles: [330, 360, 390, 420], layerList: [13, 13, 14, 14, 15] },
  // 第 6 章 综合
  { chapter: 6, normalTiles: [360, 390, 420, 450], layerList: [13, 14, 14, 15, 15] }
]

/**
 * 由 seed 生成一章的 5 个关卡配置
 */
function buildLevelsFromSeed(seed: LevelSeed): LevelConfig[] {
  const chapter = CHAPTERS.find((c) => c.id === seed.chapter)!
  const animals = chapter.animals
  const matchCount = 3
  const levels: LevelConfig[] = []

  for (let i = 0; i < 5; i++) {
    const isBoss = i === 4
    // 普通关 7 槽位，Boss 关 6 槽位增加难度
    const maxSlots = isBoss ? 6 : 7
    // boss 关图案数 = 第 4 关 * 1.3 后对齐到 matchCount 倍数
    const baseTiles = isBoss
      ? alignToMultiple(seed.normalTiles[3] * 1.3, matchCount)
      : seed.normalTiles[i]
    const tiles = alignToMultiple(baseTiles, matchCount)
    const layers = seed.layerList[i]

    levels.push({
      id: (seed.chapter - 1) * 5 + i + 1,
      chapter: seed.chapter,
      tiles,
      layers,
      rows: GRID_ROWS,
      cols: GRID_COLS,
      isBoss,
      matchCount,
      maxSlots,
      animals,
      ...(isBoss ? { timeLimit: BOSS_TIME_LIMIT } : {})
    })
  }
  return levels
}

/** 30 关配置 */
export const LEVELS: LevelConfig[] = LEVEL_SEEDS.flatMap(buildLevelsFromSeed)

/**
 * 根据关卡 id 获取配置
 */
export function getLevelById(id: number): LevelConfig | undefined {
  return LEVELS.find((l) => l.id === id)
}

/**
 * 根据章节 id 获取该章所有关卡
 */
export function getLevelsByChapter(chapterId: number): LevelConfig[] {
  return LEVELS.filter((l) => l.chapter === chapterId)
}
