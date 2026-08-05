/**
 * 兽了个兽 - 挑战模式随机配置生成
 * 纯逻辑层，不依赖 vue / electron
 *
 * 设计要点：
 *  - 随机选一章动物子集（6~8 种），保证 ≥ matchCount 可配对
 *  - 随机选 1 种机制（前 5 章机制），ratio 0.25~0.35
 *  - 限时 240s（比闯关短），id=0、isBoss=false
 */
import type { AnimalType, LevelConfig, MechanicType } from './types'
import { CHAPTERS } from './levels.config'

/** 前 5 章机制池（挑战模式只混合单机制，不引入混沌） */
const MECHANIC_POOL: MechanicType[] = ['moody', 'vine', 'sleepy', 'hidden', 'bubble']

/** Fisher-Yates 洗牌（原地） */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 随机整数 [min, max]（含两端） */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 生成随机挑战配置。
 *  - 随机选一章，取其动物子集 6~8 种
 *  - 随机 1 种机制，ratio 0.25~0.35；vine/bubble 附带点击限制
 *  - timeLimit=240、id=0、isBoss=false、matchCount=3、maxSlots=7
 */
export function generateChallengeConfig(): LevelConfig {
  const chapter = CHAPTERS[Math.floor(Math.random() * CHAPTERS.length)]

  // 随机取 6~8 种动物（保证 ≥ matchCount=3 可配对）
  const animalCount = randInt(6, 8)
  const animals: AnimalType[] = shuffle([...chapter.animals]).slice(0, animalCount)

  // 随机 1 种机制
  const mechanicType = MECHANIC_POOL[Math.floor(Math.random() * MECHANIC_POOL.length)]
  const ratio = 0.25 + Math.random() * 0.1 // 0.25 ~ 0.35
  const isClickLimited = mechanicType === 'vine' || mechanicType === 'bubble'

  // 牌数选 150 / 180（均为 matchCount=3 的倍数）
  const tiles = Math.random() < 0.5 ? 150 : 180

  return {
    id: 0,
    chapter: chapter.id,
    tiles,
    layers: 8,
    rows: 10,
    cols: 8,
    isBoss: false,
    matchCount: 3,
    maxSlots: 7,
    animals,
    timeLimit: 240,
    mechanic: {
      type: mechanicType,
      ratio,
      ...(isClickLimited
        ? { clickLimit: randInt(100, 150), clickRefund: Math.random() < 0.5 ? 3 : 4 }
        : {})
    }
  }
}