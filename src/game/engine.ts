/**
 * 兽了个兽 - 游戏引擎
 * 纯逻辑层，不依赖 vue / electron
 *
 * 设计要点：
 *  - 所有 static 方法返回新的 GameState，不修改原 state（不可变更新）
 *  - pick 与 match 分别记录一条 history，撤回时按"最后一次 pick 或 match"逐条回滚
 *  - shuffle 不进入可撤回序列（spec：undo 只撤 pick/match），仅作审计记录
 *  - coveredBy 生成后不变，"是否被覆盖"通过检查覆盖者 removed 来体现
 */
import type {
  AnimalType,
  GameMode,
  GameProps,
  GameState,
  LevelConfig,
  Slot
} from './types'
import { generateTiles } from './generator'
import {
  canPick,
  findHint,
  findMatchInSlot
} from './matcher'
import {
  calcMatchScore,
  calcPropReward
} from './scoring'
import { getLevelById } from './levels.config'

/** 初始道具数量 */
const DEFAULT_PROPS: GameProps = { undo: 3, shuffle: 2, hint: 3 }

/** Fisher-Yates 洗牌 */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * 深拷贝 state（所有数据均为 JSON 可序列化）。
 * JSON 拷贝会让 slot.tile 与 tiles 数组中的对象变成两份独立引用，
 * 这里重新链接，使二者指向同一对象，保证修改一致。
 */
function cloneState(state: GameState): GameState {
  const next: GameState = JSON.parse(JSON.stringify(state))
  const idToTile = new Map<number, GameState['tiles'][number]>()
  for (const t of next.tiles) idToTile.set(t.id, t)
  for (const s of next.slots) {
    if (s.tile) s.tile = idToTile.get(s.tile.id) ?? null
  }
  return next
}

/** 拍摄当前槽位快照（每槽的 tileId 或 null） */
function snapshotSlots(state: GameState): (number | null)[] {
  return state.slots.map((s) => (s.tile ? s.tile.id : null))
}

/**
 * 用快照还原槽位，并同步更新所有 tile 的 inSlot / slotIndex。
 * 不改变 tile.removed（撤回 match 时由调用方单独处理 removed）。
 */
function applySlotsSnapshot(state: GameState, snapshot: (number | null)[]): void {
  const idToSlotIdx = new Map<number, number>()
  snapshot.forEach((id, i) => {
    if (id !== null) idToSlotIdx.set(id, i)
  })
  for (const t of state.tiles) {
    if (idToSlotIdx.has(t.id)) {
      t.inSlot = true
      t.slotIndex = idToSlotIdx.get(t.id)!
    } else {
      t.inSlot = false
      t.slotIndex = -1
    }
  }
  for (let i = 0; i < state.slots.length; i++) {
    const id = snapshot[i] ?? null
    state.slots[i].tile = id !== null ? state.tiles.find((t) => t.id === id) ?? null : null
  }
}

/** 经典模式默认关卡配置（全屏单大堆版：3消180张/4消240张，8层） */
function makeDefaultConfig(mode: GameMode): LevelConfig {
  const is4 = mode === 'classic4'
  const matchCount = is4 ? 4 : 3
  const maxSlots = is4 ? 8 : 7
  const tiles = is4 ? 240 : 180
  const layers = 8
  // 三消用 12 种动物，四消用 10 种动物增加难度
  const animals: AnimalType[] = is4
    ? ['sheep', 'pig', 'chicken', 'dog', 'tiger', 'lion', 'bear', 'fox', 'fish', 'whale']
    : ['sheep', 'pig', 'chicken', 'dog', 'tiger', 'lion', 'bear', 'fox', 'frog', 'elephant', 'fish', 'whale']
  return {
    id: 0,
    chapter: 0,
    tiles,
    layers,
    rows: 10,
    cols: 8,
    isBoss: false,
    matchCount,
    maxSlots,
    animals
  }
}

export class GameEngine {
  /** 初始化新局 */
  static init(mode: GameMode, levelConfig?: LevelConfig): GameState {
    let config: LevelConfig
    if (mode === 'level') {
      config = levelConfig ?? getLevelById(1) ?? makeDefaultConfig('classic3')
    } else {
      config = levelConfig ?? makeDefaultConfig(mode)
    }

    const tiles = generateTiles(config)
    const slots: Slot[] = Array.from({ length: config.maxSlots }, (_, i) => ({
      index: i,
      tile: null
    }))

    return {
      mode,
      levelId: mode === 'level' ? config.id : undefined,
      config,
      tiles,
      slots,
      maxSlots: config.maxSlots,
      matchCount: config.matchCount,
      combo: 0,
      maxCombo: 0,
      score: 0,
      matchCount_total: 0,
      tilesRemoved: 0,
      startTime: Date.now(),
      props: { ...DEFAULT_PROPS },
      propsUsed: { undo: 0, shuffle: 0, hint: 0 },
      history: [],
      status: 'playing',
      hintTileIds: [],
      lastMatchedTileIds: []
    }
  }

  /**
   * 点击图案：可点击则放入槽位，并检测是否触发消除。
   * pick 与 match 各记一条 history，便于细粒度撤回。
   */
  static pickTile(
    state: GameState,
    tileId: number
  ): { state: GameState; matched: boolean; picked: boolean } {
    if (state.status !== 'playing') return { state, matched: false, picked: false }
    if (!canPick(state, tileId)) return { state, matched: false, picked: false }

    const next = cloneState(state)
    const prevSlots = snapshotSlots(next)
    const prevScore = next.score
    const prevCombo = next.combo

    // 放入第一个空槽位
    const slotIdx = next.slots.findIndex((s) => s.tile === null)
    if (slotIdx === -1) {
      // 无空槽位（理论上不会到这里，因为未满才会进入；防御性返回）
      return { state, matched: false, picked: false }
    }
    const tile = next.tiles.find((t) => t.id === tileId)!
    tile.inSlot = true
    tile.slotIndex = slotIdx
    next.slots[slotIdx].tile = tile

    // 清掉提示与上次消除高亮
    next.hintTileIds = []
    next.lastMatchedTileIds = []

    // 记录 pick
    next.history.push({ action: 'pick', tileIds: [tileId], prevSlots, prevScore, prevCombo })

    // 检测消除
    const matchIds = findMatchInSlot(next)
    let matched = false
    if (matchIds) {
      matched = true
      const matchPrevSlots = snapshotSlots(next)
      const matchPrevScore = next.score
      const matchPrevCombo = next.combo

      // 连击 +1 后计分
      next.combo += 1
      next.maxCombo = Math.max(next.maxCombo, next.combo)
      next.score += calcMatchScore(next.matchCount, next.combo)

      // 消除匹配的 tile
      for (const id of matchIds) {
        const t = next.tiles.find((x) => x.id === id)
        if (t) {
          t.removed = true
          t.inSlot = false
          t.slotIndex = -1
        }
      }
      // 清空对应槽位
      for (const s of next.slots) {
        if (s.tile && matchIds.includes(s.tile.id)) s.tile = null
      }

      next.matchCount_total += 1
      next.tilesRemoved += next.matchCount
      next.lastMatchedTileIds = matchIds

      next.history.push({
        action: 'match',
        tileIds: matchIds,
        prevSlots: matchPrevSlots,
        prevScore: matchPrevScore,
        prevCombo: matchPrevCombo
      })
    }
    // 未命中（攒牌过程）：combo 保持不清零
    // 连击仅在以下情况清零：洗牌 / 失败 / 重开

    // 胜负判定
    if (next.tiles.every((t) => t.removed)) {
      next.status = 'won'
      next.endTime = Date.now()
    } else if (next.slots.every((s) => s.tile !== null)) {
      // 槽位已满且无消除（有消除上面已处理）→ 失败
      next.status = 'lost'
      next.endTime = Date.now()
    }

    return { state: next, matched, picked: true }
  }

  /** 撤回：回滚最后一次 pick 或 match（跳过 shuffle 记录） */
  static undo(state: GameState): GameState {
    if (state.props.undo <= 0) return state
    const next = cloneState(state)

    // 从末尾往前找第一条 pick/match
    let idx = next.history.length - 1
    while (idx >= 0 && next.history[idx].action === 'shuffle') idx--
    if (idx < 0) return state // 没有可撤回的操作

    const entry = next.history[idx]
    if (entry.action === 'pick') {
      // 回滚 pick：还原槽位（被 pick 的 tile 自然回到场上）
      applySlotsSnapshot(next, entry.prevSlots)
      next.score = entry.prevScore
      next.combo = entry.prevCombo
    } else if (entry.action === 'match') {
      // 回滚 match：先取消消除，再还原槽位
      for (const id of entry.tileIds) {
        const t = next.tiles.find((x) => x.id === id)
        if (t) {
          t.removed = false
          t.inSlot = false
          t.slotIndex = -1
        }
      }
      applySlotsSnapshot(next, entry.prevSlots)
      next.score = entry.prevScore
      next.combo = entry.prevCombo
    } else {
      return state
    }

    next.history.splice(idx, 1)
    next.props.undo -= 1
    next.propsUsed.undo += 1
    next.lastMatchedTileIds = []
    next.hintTileIds = []
    // 撤回后恢复进行中
    next.status = 'playing'
    next.endTime = undefined
    return next
  }

  /**
   * 洗牌：打乱场上（未消除且不在槽位）tile 的 animal，
   * 保持位置、层级不变。仅作排列置换，保证多集不变故仍可解。
   */
  static shuffle(state: GameState): GameState {
    if (state.props.shuffle <= 0) return state
    const next = cloneState(state)

    const prevSlots = snapshotSlots(next)
    const prevScore = next.score
    const prevCombo = next.combo

    const boardTiles = next.tiles.filter((t) => !t.removed && !t.inSlot)
    const animals = boardTiles.map((t) => t.animal)
    shuffleArray(animals)
    boardTiles.forEach((t, i) => {
      t.animal = animals[i]
    })

    next.history.push({
      action: 'shuffle',
      tileIds: boardTiles.map((t) => t.id),
      prevSlots,
      prevScore,
      prevCombo
    })
    next.props.shuffle -= 1
    next.propsUsed.shuffle += 1
    next.combo = 0
    next.hintTileIds = []
    return next
  }

  /** 提示：高亮一对可点击且同动物的 tile。找不到则不消耗道具。 */
  static showHint(state: GameState): GameState {
    if (state.props.hint <= 0) return state
    const hint = findHint(state)
    if (!hint) return state
    const next = cloneState(state)
    next.hintTileIds = hint
    next.props.hint -= 1
    next.propsUsed.hint += 1
    return next
  }

  /**
   * 综合评分（游戏结束时计算）
   *  - 基础分 = state.score（游戏中累计）
   *  - 连击奖励 = maxCombo * 30
   *  - 时间奖励 = max(0, 300 - 时长) * 0.3
   *  - 总分 = 基础分*0.5 + 连击奖励 + 时间奖励
   *  - 道具奖励按总分阈值发放
   */
  static calculateFinalScore(state: GameState): {
    baseScore: number
    comboBonus: number
    timeBonus: number
    totalScore: number
    propReward: Partial<GameProps>
  } {
    const baseScore = state.score
    const comboBonus = state.maxCombo * 30
    const elapsed = GameEngine.getElapsedSeconds(state)
    const timeBonus = Math.max(0, 300 - elapsed) * 0.3
    const totalScore = baseScore * 0.5 + comboBonus + timeBonus
    const propReward = calcPropReward(totalScore)
    return { baseScore, comboBonus, timeBonus, totalScore, propReward }
  }

  /** 是否胜利：所有 tile 已消除 */
  static isWin(state: GameState): boolean {
    return state.tiles.length > 0 && state.tiles.every((t) => t.removed)
  }

  /** 是否失败：槽位已满、无消除、且未胜利 */
  static isLose(state: GameState): boolean {
    if (GameEngine.isWin(state)) return false
    const full = state.slots.every((s) => s.tile !== null)
    if (!full) return false
    return findMatchInSlot(state) === null
  }

  /** 已用时（秒） */
  static getElapsedSeconds(state: GameState): number {
    const end = state.endTime ?? Date.now()
    return Math.max(0, Math.floor((end - state.startTime) / 1000))
  }
}
