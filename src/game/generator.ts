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
import type { AnimalType, LevelConfig, MechanicState, MechanicType, Tile } from './types'

/**
 * 布局常量（generator 与 TileStack 共享，保证逻辑覆盖判断与视觉一致）
 * 半整数网格坐标实现 2×2 中心堆叠：
 *  - 偶数层：整数坐标 (0, 1, 2, ...)
 *  - 奇数层：半整数坐标 (0.5, 1.5, 2.5, ...)
 *  - 覆盖判断：|x1-x2| < 1 且 |y1-y2| < 1（网格距离小于1格）
 *  - 渲染直接用 x * CELL_W, y * CELL_H，不需要像素偏移
 *  - 视觉与逻辑 100% 一致
 */
export const CELL_W = 56
export const CELL_H = 60
export const TILE_W = 52
export const TILE_H = 56

/** animal 组合（v4：去掉 variant，每种动物唯一模型） */
interface Combo {
  animal: AnimalType
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
 * 把总图案数分配到各层（平缓金字塔，层次饱满）
 * 下层略多、上层略少，但差距不大，保证每层都有足够牌数
 * 权重公式 (layers-i)*0.5+1：第0层权重最高，最后一层也有基础权重1.5
 * 例如11层：旧权重[11,10,...,1]→新权重[6.5,6.0,...,1.5]，上层牌数翻倍
 */
function distributeTilesAcrossLayers(total: number, layers: number): number[] {
  const weights: number[] = []
  for (let i = 0; i < layers; i++) {
    // 平缓金字塔：下层权重略高，上层不会太少
    weights.push((layers - i) * 0.5 + 1)
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
 * 在一层内选取 count 个网格坐标（紧凑分布版）。
 * - 优先选择靠近中心的格子（前75%区域），让牌集中不空旷
 * - count <= rows*cols 时尽量不重复（每格最多 1 个）
 * - 超过则允许同格叠加
 */
function pickCells(count: number, rows: number, cols: number): { x: number; y: number }[] {
  const total = rows * cols
  if (count <= total) {
    // 计算每个格子到网格中心的距离
    const cx = (cols - 1) / 2
    const cy = (rows - 1) / 2
    const all: { x: number; y: number; d: number }[] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        all.push({ x, y, d: Math.hypot(x - cx, y - cy) })
      }
    }
    // 按到中心距离排序，近的优先
    all.sort((a, b) => a.d - b.d)
    // 在前 75% 的候选中随机选择（既紧凑又有变化）
    const cutoff = Math.max(count, Math.floor(all.length * 0.75))
    const candidates = all.slice(0, cutoff).map(({ x, y }) => ({ x, y }))
    shuffle(candidates)
    return candidates.slice(0, count)
  }
  // 超过网格容量则允许同格叠加
  const result: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    result.push({ x: randInt(cols), y: randInt(rows) })
  }
  return result
}

/**
 * 构造 animal 列表，保证每种动物数量为 matchCount 的倍数。
 * 总数恰等于 totalTiles。
 */
function buildAnimalList(
  animals: AnimalType[],
  totalTiles: number,
  matchCount: number
): Combo[] {
  const totalGroups = totalTiles / matchCount

  const allCombos: Combo[] = animals.map((animal) => ({ animal }))

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
 *  1. 构造 animal 列表，每种动物数量为 matchCount 的倍数，总和 = config.tiles
 *  2. 按 config.layers 层分配牌数（下层多上层少）
 *  3. 每层在 rows×cols 大网格中随机放置
 *  4. 计算 coveredBy：上层 tile 与本 tile 的 (x,y) 距离 ≤ 0.5 即视为覆盖
 *  5. id 从 1 递增；最后打乱数组顺序，隐藏层序
 *
 * 注：config.regions 字段忽略（v3 不再使用多区域），region 恒为 0
 */
export function generateTiles(config: LevelConfig): Tile[] {
  const { tiles, matchCount, animals, layers, rows, cols } = config

  // 1. 动物列表（保证可消完）
  const comboList = shuffle(buildAnimalList(animals, tiles, matchCount))

  const tilesArr: Tile[] = []
  const comboCursor = { idx: 0 }
  const nextId = { val: 1 }

  // 2. 按层分配牌数
  const countsPerLayer = distributeTilesAcrossLayers(tiles, layers)

  // 3. 每层独立紧凑选位
  // 偶数层：整数坐标 (0, 1, 2, ...)
  // 奇数层：半整数坐标 (0.5, 1.5, 2.5, ...) 实现 2×2 中心堆叠
  for (let layer = 0; layer < layers; layer++) {
    const count = countsPerLayer[layer]
    const cells = pickCells(count, rows, cols)
    const isOddLayer = layer % 2 === 1
    for (let z = 0; z < cells.length; z++) {
      let { x, y } = cells[z]
      if (isOddLayer) {
        x += 0.5
        y += 0.5
      }
      const combo = comboList[comboCursor.idx++]
      tilesArr.push({
        id: nextId.val++,
        animal: combo.animal,
        region: 0,
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

  // 4. 计算 coveredBy：网格距离 < 1 即覆盖
  // |x1-x2| < 1 且 |y1-y2| < 1  → 同格或相邻半格
  // 无需像素计算，视觉与逻辑 100% 一致
  for (const t of tilesArr) {
    t.coveredBy = tilesArr
      .filter((u) => u.layer > t.layer && Math.abs(u.x - t.x) < 1 && Math.abs(u.y - t.y) < 1)
      .map((u) => u.id)
  }

  // 5. 章节机制：给场上牌附加机制状态
  if (config.mechanic) {
    const { type, ratio } = config.mechanic
    const count = Math.ceil(tiles * ratio)
    const ALL_MECHANIC_TYPES: MechanicType[] = ['moody', 'vine', 'sleepy', 'hidden', 'bubble']
    const isSingleType = ALL_MECHANIC_TYPES.includes(type as MechanicType)

    // 随机选取 count 张牌（生成时所有牌都在场上）
    const indices = Array.from({ length: tilesArr.length }, (_, i) => i)
    shuffle(indices)
    const selected = new Set(indices.slice(0, count))

    for (let i = 0; i < tilesArr.length; i++) {
      if (!selected.has(i)) continue
      const mechanicType: MechanicType = isSingleType
        ? (type as MechanicType)
        : ALL_MECHANIC_TYPES[Math.floor(Math.random() * ALL_MECHANIC_TYPES.length)]
      const stuck = mechanicType === 'moody' ? 1 : 1
      tilesArr[i].mechanicState = { type: mechanicType, stuck, matchedCount: 0 }
    }
  }

  // 6. 打乱数组顺序（隐藏层序）
  shuffle(tilesArr)

  return tilesArr
}
