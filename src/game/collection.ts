/**
 * 兽了个兽 - 收藏品掉落
 * 纯逻辑层，不依赖 vue / electron
 *
 * 通关（闯关/挑战）后按星际概率抽取稀有度，再从本章动物中随机选一只作为收藏品 id。
 */
import type { AnimalType } from './types'

/** 收藏品稀有度 */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

/** 稀有度 → 重复掉落时转化的金币 */
export const RARITY_GOLD: Record<Rarity, number> = {
  common: 80,
  rare: 200,
  epic: 400,
  legendary: 800
}

/** 稀有度中文名 */
export const RARITY_NAME: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

/** 各星级稀有度概率表（stars → [稀有度, 概率]） */
const RARITY_TABLE: Record<number, Array<[Rarity, number]>> = {
  1: [
    ['common', 0.9],
    ['rare', 0.09],
    ['epic', 0.01],
    ['legendary', 0]
  ],
  2: [
    ['common', 0.6],
    ['rare', 0.3],
    ['epic', 0.09],
    ['legendary', 0.01]
  ],
  3: [
    ['common', 0.3],
    ['rare', 0.4],
    ['epic', 0.25],
    ['legendary', 0.05]
  ]
}

/** 空动物列表时的兜底 id（防御） */
const FALLBACK_ANIMAL = 'sheep'

/**
 * 按星级(Loop)抽取稀有度，并从 chapterAnimals 中均匀随机选一只动物作为收藏品 id。
 * - stars 不在 1~3 范围内（<=0 或 >=4）时按 1 星处理（防御）。
 * - chapterAnimals 为空时兜底返回 'sheep'（防御）。
 */
export function rollCollection(
  chapterAnimals: AnimalType[],
  stars: number
): { id: string; rarity: Rarity } {
  const table = RARITY_TABLE[stars] ?? RARITY_TABLE[1]

  let r = Math.random()
  let rarity: Rarity = 'common'
  for (const [name, prob] of table) {
    r -= prob
    if (r <= 0) {
      rarity = name
      break
    }
  }

  const pool = chapterAnimals.length > 0 ? chapterAnimals : [FALLBACK_ANIMAL as AnimalType]
  const id = pool[Math.floor(Math.random() * pool.length)]

  return { id, rarity }
}