/**
 * 兽了个兽 - 消除判定
 * 纯逻辑层，不依赖 vue / electron
 *
 * 说明：coveredBy 在 generateTiles 中计算后不再变化，
 *       判定是否被覆盖时通过检查"覆盖者是否已 removed"来体现当前状态。
 */
import type { GameState, Tile } from './types'

/** 根据 id 取 tile */
function getTileById(state: GameState, tileId: number): Tile | undefined {
  return state.tiles.find((t) => t.id === tileId)
}

/**
 * 返回当前仍在阻挡该 tile 的上层 tile 列表（未 removed 的覆盖者）
 */
export function getCoveringTiles(state: GameState, tileId: number): Tile[] {
  const tile = getTileById(state, tileId)
  if (!tile) return []
  return tile.coveredBy
    .map((id) => getTileById(state, id))
    .filter((t): t is Tile => !!t && !t.removed && !t.inSlot)
}

/**
 * 判断该 tile 是否可点击
 * 条件：存在、未消除、不在槽位中、无未消除的覆盖者
 */
export function canPick(state: GameState, tileId: number): boolean {
  const tile = getTileById(state, tileId)
  if (!tile) return false
  if (tile.removed) return false
  if (tile.inSlot) return false
  return getCoveringTiles(state, tileId).length === 0
}

/**
 * 在槽位中查找可消除的组：
 * 找到 matchCount 个相同 animal 的 tile，返回其 id 数组；否则 null。
 * 命中后即返回第一组（消除按出现顺序）。
 */
export function findMatchInSlot(state: GameState): number[] | null {
  const { matchCount } = state
  // 按 animal 分组，保留槽位顺序
  const groups = new Map<string, Tile[]>()
  for (const slot of state.slots) {
    const t = slot.tile
    if (!t) continue
    const key = t.animal
    const arr = groups.get(key)
    if (arr) arr.push(t)
    else groups.set(key, [t])
  }
  for (const arr of groups.values()) {
    if (arr.length >= matchCount) {
      return arr.slice(0, matchCount).map((t) => t.id)
    }
  }
  return null
}

/**
 * 返回场上所有"可被收集完成"的 tile 组：
 * 即当前可点击且 animal 相同的 matchCount 个 tile。
 * 用于提示与洗牌判定。
 */
export function findAllMatchable(state: GameState): number[][] {
  const { matchCount } = state
  // 只考虑可点击的 tile
  const pickable = state.tiles.filter((t) => canPick(state, t.id))

  const groups = new Map<string, Tile[]>()
  for (const t of pickable) {
    const key = t.animal
    const arr = groups.get(key)
    if (arr) arr.push(t)
    else groups.set(key, [t])
  }

  const result: number[][] = []
  for (const arr of groups.values()) {
    // 同组若超过 matchCount，可拆成多组
    for (let i = 0; i + matchCount <= arr.length; i += matchCount) {
      result.push(arr.slice(i, i + matchCount).map((t) => t.id))
    }
  }
  return result
}

/**
 * 返回一对提示 tile id（场上可点击且动物相同的 2 个）。
 * 优先返回 animal 相同的对（可直接凑组）。
 * 找不到返回 null。
 */
export function findHint(state: GameState): number[] | null {
  const pickable = state.tiles.filter((t) => canPick(state, t.id))

  // 找相同动物的可点击对
  const sameAnimal = new Map<string, Tile[]>()
  for (const t of pickable) {
    const arr = sameAnimal.get(t.animal)
    if (arr) arr.push(t)
    else sameAnimal.set(t.animal, [t])
  }
  for (const arr of sameAnimal.values()) {
    if (arr.length >= 2) {
      return [arr[0].id, arr[1].id]
    }
  }

  return null
}

/**
 * 判断是否卡死：
 * 槽位中无可消除组 且 场上无可点击的同动物对（无法继续推进）。
 */
export function isStuck(state: GameState): boolean {
  if (findMatchInSlot(state) !== null) return false
  if (findHint(state) !== null) return false
  return true
}
