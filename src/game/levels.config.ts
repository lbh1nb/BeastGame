/**
 * 兽了个兽 - 30 关配置 + 6 章配置（v5：章节机制版）
 * 纯逻辑层，不依赖 vue / electron
 *
 * v5 改动：
 *  - 每章6种动物（+2种新动物）
 *  - L1: 4动物无机制 / L2: 6动物无机制 / L3-L4: 6动物+机制 / L5: Boss
 *  - 6章独特机制：闹脾气/藤蔓/贪睡/躲猫猫/气泡/混沌
 */
import type { AnimalType, LevelConfig } from './types'

/** 章节配置 */
export interface Chapter {
  id: number
  name: string
  animals: AnimalType[]
  theme: string
}

/**
 * 6 章配置（v5：每章6种动物）
 */
export const CHAPTERS: Chapter[] = [
  { id: 1, name: '家畜', animals: ['sheep', 'pig', 'chicken', 'dog', 'horse', 'cow'], theme: '#FFF8DC' },
  { id: 2, name: '野生', animals: ['tiger', 'lion', 'bear', 'fox', 'wolf', 'eagle'], theme: '#FFE8CC' },
  { id: 3, name: '森林', animals: ['frog', 'crocodile', 'elephant', 'panda', 'monkey', 'deer'], theme: '#E6F5E6' },
  { id: 4, name: '鸟类', animals: ['flamingo', 'peacock', 'penguin', 'parrot', 'owl', 'swan'], theme: '#FFE4E1' },
  { id: 5, name: '海洋', animals: ['fish', 'whale', 'octopus', 'jellyfish', 'dolphin', 'turtle'], theme: '#E0F0FF' },
  { id: 6, name: '综合', animals: ['tiger', 'fox', 'fish', 'peacock', 'panda', 'dolphin'], theme: '#ECE0FF' }
]

/** Boss 关时间限制（秒） */
export const BOSS_TIME_LIMIT = 240

/** 全屏单大堆网格配置 */
const GRID_ROWS = 10
const GRID_COLS = 8

function alignToMultiple(value: number, m: number): number {
  return Math.max(m, Math.round(value / m) * m)
}

interface LevelSeed {
  chapter: number
  normalTiles: [number, number, number, number]
  layerList: [number, number, number, number, number]
}

/**
 * 30关原始数据（v8：前五章统一配置，第六章难度增加）
 */
const LEVEL_SEEDS: LevelSeed[] = [
  { chapter: 1, normalTiles: [ 90, 150, 210, 240], layerList: [ 6,  7, 10, 10, 10] },
  { chapter: 2, normalTiles: [ 90, 150, 210, 240], layerList: [ 6,  7, 10, 10, 10] },
  { chapter: 3, normalTiles: [ 90, 150, 210, 240], layerList: [ 6,  7, 10, 10, 10] },
  { chapter: 4, normalTiles: [ 90, 150, 210, 240], layerList: [ 6,  7, 10, 10, 10] },
  { chapter: 5, normalTiles: [ 90, 150, 210, 240], layerList: [ 6,  7, 10, 10, 10] },
  { chapter: 6, normalTiles: [210, 270, 330, 360], layerList: [ 9, 10, 12, 13, 13] }
]

/** 每章的机制配置（{ type, ratio, clickLimit?, clickRefund? } 或 null） */
const CHAPTER_MECHANICS: Record<number, {
  introAnimal: AnimalType
  introTitle: string
  introBody: string
  /** L3 配置 */
  l3: NonNullable<LevelConfig['mechanic']> | null
  /** L4 配置 */
  l4: NonNullable<LevelConfig['mechanic']> | null
  /** L5 配置 */
  l5: NonNullable<LevelConfig['mechanic']> | null
}> = {
  1: {
    introAnimal: 'sheep',
    introTitle: '小动物闹脾气啦！',
    introBody: '有些小动物耍别扭了（😠乌云遮罩），点击无效。消除任意一组后它们就会变开心（😊），然后才能点哦~',
    l3: { type: 'moody', ratio: 0.30 },
    l4: { type: 'moody', ratio: 0.40 },
    l5: { type: 'moody', ratio: 0.40 }
  },
  2: {
    introAnimal: 'fox',
    introTitle: '藤蔓缠绕！小心点击次数',
    introBody: '部分牌被藤蔓缠绕（🌿），点击会消耗次数。藤蔓需多点一次解除。每消除一组返还3次点击，点数用完就不能点了！',
    l3: { type: 'vine', ratio: 0.30, clickLimit: 95, clickRefund: 3 },
    l4: { type: 'vine', ratio: 0.40, clickLimit: 100, clickRefund: 3 },
    l5: { type: 'vine', ratio: 0.40, clickLimit: 100, clickRefund: 3 }
  },
  3: {
    introAnimal: 'panda',
    introTitle: '小动物在睡觉呢~',
    introBody: '部分动物睡得正香（💤气泡+闭眼），消除一次后会被唤醒，然后才能点击入槽哦~',
    l3: { type: 'sleepy', ratio: 0.30 },
    l4: { type: 'sleepy', ratio: 0.40 },
    l5: { type: 'sleepy', ratio: 0.40 }
  },
  4: {
    introAnimal: 'parrot',
    introTitle: '躲猫猫！看不清是谁',
    introBody: '部分牌是"？"问号牌，点击翻开才能看到真面目，翻开后即可入槽。猜猜看是什么动物？',
    l3: { type: 'hidden', ratio: 0.25 },
    l4: { type: 'hidden', ratio: 0.35 },
    l5: { type: 'hidden', ratio: 0.35 }
  },
  5: {
    introAnimal: 'fish',
    introTitle: '气泡牢笼！小心点击次数',
    introBody: '部分动物被气泡包裹（🫧），点击戳破才可入槽，每次点击消耗次数。每消除一组返还3次，点数用完就不能点了！',
    l3: { type: 'bubble', ratio: 0.30, clickLimit: 95, clickRefund: 3 },
    l4: { type: 'bubble', ratio: 0.40, clickLimit: 100, clickRefund: 3 },
    l5: { type: 'bubble', ratio: 0.40, clickLimit: 100, clickRefund: 3 }
  },
  6: {
    introAnimal: 'tiger',
    introTitle: '混沌模式！多种机制混合',
    introBody: '综合考验来了！本关随机混合前五章的机制，每种机制都可能出现。祝你好运！',
    l3: null, // 随机选1种前5章机制
    l4: null, // 随机选2种
    l5: null  // 随机选3种
  }
}

/** 第6章随机机制池 */
const CHAOS_POOL: NonNullable<LevelConfig['mechanic']>[] = [
  { type: 'moody', ratio: 0.20 },
  { type: 'vine', ratio: 0.20, clickLimit: 95, clickRefund: 3 },
  { type: 'sleepy', ratio: 0.20 },
  { type: 'hidden', ratio: 0.20 },
  { type: 'bubble', ratio: 0.20, clickLimit: 95, clickRefund: 3 }
]

function buildLevelsFromSeed(seed: LevelSeed): LevelConfig[] {
  const chapter = CHAPTERS.find((c) => c.id === seed.chapter)!
  const allAnimals = chapter.animals
  const baseAnimals = allAnimals.slice(0, 4) // L1用4种
  const mecCfg = CHAPTER_MECHANICS[seed.chapter]
  const matchCount = 3
  const levels: LevelConfig[] = []

  for (let i = 0; i < 5; i++) {
    const isBoss = i === 4
    const maxSlots = isBoss ? 6 : 7
    const baseTiles = isBoss
      ? alignToMultiple(seed.normalTiles[3] * 1.3, matchCount)
      : seed.normalTiles[i]
    const tiles = alignToMultiple(baseTiles, matchCount)
    const layers = seed.layerList[i]

    // 动物列表 & 机制
    const animals = i === 0 ? baseAnimals : allAnimals

    let mechanic: LevelConfig['mechanic'] | undefined
    if (i === 2 && mecCfg) {
      mechanic = mecCfg.l3 ?? undefined
    } else if (i === 3 && mecCfg) {
      mechanic = mecCfg.l4 ?? undefined
    } else if (i === 4 && mecCfg) {
      if (seed.chapter === 6) {
        // 第6章Boss：随机3种机制，各15%
        mechanic = {
          type: 'vine' as any, // 覆盖type用，实际引擎层按chaos处理
          ratio: 0.40
        }
      } else {
        mechanic = mecCfg.l5 ?? undefined
      }
    }
    // 第6章 普通关：L3=1种(20%), L4=2种(各15%)
    if (seed.chapter === 6 && i >= 2 && i < 4) {
      mechanic = i === 2
        ? { ...CHAOS_POOL[0], ratio: 0.20 }
        : { ...CHAOS_POOL[0], ratio: 0.25 }
    }

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
      ...(isBoss ? { timeLimit: BOSS_TIME_LIMIT } : {}),
      ...(mechanic ? { mechanic } : {})
    })
  }
  return levels
}

/** 30 关配置 */
export const LEVELS: LevelConfig[] = LEVEL_SEEDS.flatMap(buildLevelsFromSeed)

/** 根据关卡 id 获取配置 */
export function getLevelById(id: number): LevelConfig | undefined {
  return LEVELS.find((l) => l.id === id)
}

/** 根据章节 id 获取该章所有关卡 */
export function getLevelsByChapter(chapterId: number): LevelConfig[] {
  return LEVELS.filter((l) => l.chapter === chapterId)
}

/** 获取章节机制配置 */
export function getChapterMechanic(chapterId: number) {
  return CHAPTER_MECHANICS[chapterId] ?? null
}
