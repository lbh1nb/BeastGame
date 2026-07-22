/**
 * 兽了个兽 - 关卡布局生成器（全屏单大堆版）
 * 纯逻辑层，不依赖 vue / electron
 *
 * v3 改动：
 *  - 取消多区域，改为单区域大网格（8列×10行）+ 多层堆叠（8-12层）
 *  - 全屏铺满，像原版"羊了个羊"那样
 *  - Tile.region 字段保留但恒为 0（向后兼容类型定义）
 *  - 牌数大幅增量：180-540 张
 */
import type { AnimalType, LevelConfig, Tile } from './types'

/** animal × variant 组合 */
interface Combo {
  animal: AnimalType
  variant: 0 | 1
}

/** Fisher-Yates 洗牌（原地） */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 随机整数 [0, max) */
function randInt(max: number): number {
  return Math.floor(Math.random() * max)
}

/**
 * 把总图案数分配到各层（下层多、上层少，呈金字塔）
 * 下层约占 1/n * 1.2，上层递减，保证下层可消牌多
 */
function distributeTilesAcrossLayers(total: number, layers: number): number[] {
  // 权重：下层权重高，上层权重低
  const weights: number[] = []
  for (let i = 0; i < layers; i++) {
    // 下层权重 = layers - i（第0层最高）
    weights.push(layers - i)
  }
  const weightSum = weights.reduce((a, b) => a + b, 0)

  const counts: number[] = []
  let assigned = 0
  for (let i = 0; i < layers; i++) {
    const c = Math.floor((total * weights[i]) / weightSum)
    counts.push(c)
    assigned += c
  }
  // 余数加到第 0 层
  const diff = total - assigned
  if (diff > 0) counts[0] += diff
  return counts
}

/**
 * 在一层内选取 count 个网格坐标。
 * - count <= rows*cols 时尽量不重复（每格最多 1 个）
 * - 超过则允许同格叠加
 */
function pickCells(count: number, rows: number, cols: number): { x: number; y: number }[] {
  const total = rows * cols
  if (count <= total) {
    const all: { x: number; y: number }[] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        all.push({ x, y })
      }
    }
    shuffle(all)
    return all.slice(0, count)
  }
  const result: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    result.push({ x: randInt(cols), y: randInt(rows) })
  }
  return result
}

/**
 * 构造 animal×variant 组合列表，保证每个组合数量为 matchCount 的倍数。
 * 总数恰等于 totalTiles。
 */
function buildAnimalVariantList(
  animals: AnimalType[],
  totalTiles: number,
  matchCount: number
): Combo[] {
  const totalGroups = totalTiles / matchCount

  const allCombos: Combo[] = animals.flatMap((animal) =>
    ([0, 1] as const).map<Combo>((variant) => ({ animal, variant }))
  )

  let usedCombos: Combo[]
  if (totalGroups <= allCombos.length) {
    usedCombos = shuffle([...allCombos]).slice(0, totalGroups)
  } else {
    usedCombos = shuffle([...allCombos])
  }

  const base = Math.floor(totalGroups / usedCombos.length)
  const extra = totalGroups % usedCombos.length

  const list: Combo[] = []
  usedCombos.forEach((combo, i) => {
    const groups = base + (i < extra ? 1 : 0)
    const count = groups * matchCount
    for (let k = 0; k < count; k++) list.push(combo)
  })
  return list
}

/**
 * 关卡布局生成器：根据 config 生成 tile 数组。
 *
 * 全屏单大堆算法：
 *  1. 构造 animal×variant 列表，每种组合数量为 matchCount 的倍数，总和 = config.tiles
 *  2. 按 config.layers 层分配牌数（下层多上层少）
 *  3. 每层在 rows×cols 大网格中随机放置
 *  4. 计算 coveredBy：上层 tile 与本 tile 的 (x,y) 距离 ≤ 0.5 即视为覆盖
 *  5. id 从 1 递增；最后打乱数组顺序，隐藏层序
 *
 * 注：config.regions 字段忽略（v3 不再使用多区域），region 恒为 0
 */
export function generateTiles(config: LevelConfig): Tile[] {
  const { tiles, matchCount, animals, layers, rows, cols } = config

  // 1. 动物+变体列表（保证可消完）
  const comboList = shuffle(buildAnimalVariantList(animals, tiles, matchCount))

  const tilesArr: Tile[] = []
  const comboCursor = { idx: 0 }
  const nextId = { val: 1 }

  // 2. 按层分配牌数
  const countsPerLayer = distributeTilesAcrossLayers(tiles, layers)

  // 3. 每层在大网格中随机放置
  for (let layer = 0; layer < layers; layer++) {
    const count = countsPerLayer[layer]
    const cells = pickCells(count, rows, cols)
    for (let z = 0; z < cells.length; z++) {
      const { x, y } = cells[z]
      const combo = comboList[comboCursor.idx++]
      tilesArr.push({
        id: nextId.val++,
        animal: combo.animal,
        variant: combo.variant,
        region: 0,  // v3 全部为单区域
        layer,
        x,
        y,
        z,
        coveredBy: [],
        removed: false,
        inSlot: false,
        slotIndex: -1
      })
    }
  }

  // 4. 计算 coveredBy：上层覆盖下层（距离 ≤ 0.5）
  for (const t of tilesArr) {
    t.coveredBy = tilesArr
      .filter(
        (u) =>
          u.layer > t.layer &&
          Math.hypot(u.x - t.x, u.y - t.y) <= 0.5
      )
      .map((u) => u.id)
  }

  // 5. 打乱数组顺序（隐藏层序）
  shuffle(tilesArr)

  return tilesArr
}
