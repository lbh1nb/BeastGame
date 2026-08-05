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
  MechanicEvent,
  MechanicType,
  Slot
} from './types'
import { generateTiles } from './generator'
import {
  canPick,
  findHint,
  findMatchInSlot,
  getCoveringTiles
} from './matcher'
import {
  calcMatchScore,
  calcPropReward
} from './scoring'
import { getLevelById } from './levels.config'

/** 初始道具数量 */
const DEFAULT_PROPS: GameProps = { undo: 3, shuffle: 2, hint: 3, chisel: 0, clearProp: 0, pair: 0, slot: 0 }

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
export function makeDefaultConfig(mode: GameMode): LevelConfig {
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

/**
 * 尝试解析场上 1 个闹脾气牌 + 1 个贪睡牌。
 * 每次消除成功后调用，优先选未被覆盖的牌（用户可见），确保视觉反馈明确。
 * @returns 被解析的机制事件列表（含 tileId，供视图层播动画 + 音效）
 */
function resolveMechanics(state: GameState): MechanicEvent[] {
  const resolved: MechanicEvent[] = []

  function resolveOne(type: 'moody' | 'sleepy'): boolean {
    const candidates: number[] = []
    const coveredCandidates: number[] = []

    for (let i = 0; i < state.tiles.length; i++) {
      const t = state.tiles[i]
      if (t.removed || t.inSlot) continue
      const ms = t.mechanicState
      if (!ms || ms.type !== type || ms.stuck <= 0) continue
      if (getCoveringTiles(state, t.id).length > 0) {
        coveredCandidates.push(i)
      } else {
        candidates.push(i)
      }
    }

    const targetIdx = candidates.length > 0 ? candidates[0] : coveredCandidates[0]
    if (targetIdx === undefined) return false

    const t = state.tiles[targetIdx]
    t.mechanicState = { type, stuck: 0, matchedCount: 0 }
    resolved.push({ kind: 'resolved', tileId: t.id, type })
    return true
  }

  resolveOne('moody')
  resolveOne('sleepy')

  return resolved
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
      timeLeft: config.timeLimit,
      props: { ...DEFAULT_PROPS },
      propsUsed: { undo: 0, shuffle: 0, hint: 0 },
      history: [],
      status: 'playing',
      hintTileIds: [],
      lastMatchedTileIds: [],
      clickRemaining: config.mechanic?.clickLimit ?? -1,
      lastResolvedMechanics: [],
      lastMechanicEvents: []
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

    // 点击限制：0=不可点击，-1=无限制
    if (state.clickRemaining === 0) return { state, matched: false, picked: false }

    // 机制前置判定
    const tile = state.tiles.find((t) => t.id === tileId)
    if (tile?.mechanicState) {
      const ms = tile.mechanicState
      if (ms.type === 'moody') {
        // 闹脾气：stuck 未清除则不能点
        if (ms.stuck > 0) return { state, matched: false, picked: false }
      } else if (ms.type === 'sleepy') {
        // 贪睡：stuck 未清除则不能点
        if (ms.stuck > 0) return { state, matched: false, picked: false }
      } else if ((ms.type === 'vine' || ms.type === 'bubble') && ms.stuck > 0) {
        // 藤蔓/气泡：解除 stuck，消耗一次点击，记录 broken 事件
        const next = cloneState(state)
        const vt = next.tiles.find((t) => t.id === tileId)!
        vt.mechanicState!.stuck = 0
        if (next.clickRemaining > 0) next.clickRemaining -= 1
        // 解除后若点击次数耗尽且未全部消除 → 判定失败
        if (next.clickRemaining === 0 && !next.tiles.every((t) => t.removed)) {
          next.status = 'lost'
          next.endTime = Date.now()
        }
        next.lastMechanicEvents = [{ kind: 'broken', tileId, type: ms.type as MechanicType }]
        next.lastResolvedMechanics = []
        return { state: next, matched: false, picked: false }
      }
      // hidden: 点击翻开即可，不阻止后续逻辑
    }

    if (!canPick(state, tileId)) return { state, matched: false, picked: false }

    const next = cloneState(state)
    next.lastMechanicEvents = []
    next.lastResolvedMechanics = []

    // 消耗点击次数
    if (next.clickRemaining > 0) next.clickRemaining -= 1

    const prevSlots = snapshotSlots(next)
    const prevScore = next.score
    const prevCombo = next.combo

    // 放入第一个空槽位
    const slotIdx = next.slots.findIndex((s) => s.tile === null)
    if (slotIdx === -1) {
      return { state, matched: false, picked: false }
    }
    const pt = next.tiles.find((t) => t.id === tileId)!
    // hidden: 翻开后清除机制状态，记录 revealed 事件
    if (pt.mechanicState?.type === 'hidden') {
      delete pt.mechanicState
      next.lastMechanicEvents.push({ kind: 'revealed', tileId, type: 'hidden' })
    }
    pt.inSlot = true
    pt.slotIndex = slotIdx
    next.slots[slotIdx].tile = pt

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
          // 清除已消除 tile 的机制状态
          delete t.mechanicState
        }
      }
      // 清空对应槽位
      for (const s of next.slots) {
        if (s.tile && matchIds.includes(s.tile.id)) s.tile = null
      }

      next.matchCount_total += 1
      next.tilesRemoved += next.matchCount
      next.lastMatchedTileIds = matchIds

      // 消除后尝试解析场上机制牌
      const resolvedEvents = resolveMechanics(next)
      next.lastMechanicEvents.push(...resolvedEvents)
      next.lastResolvedMechanics = resolvedEvents
        .filter((e): e is Extract<MechanicEvent, { type: MechanicType }> => 'type' in e)
        .map(e => e.type)

      // 返还点击次数
      const refund = state.config.mechanic?.clickRefund ?? 0
      if (refund > 0 && next.clickRemaining >= 0) {
        next.clickRemaining += refund
      }

      next.history.push({
        action: 'match',
        tileIds: matchIds,
        prevSlots: matchPrevSlots,
        prevScore: matchPrevScore,
        prevCombo: matchPrevCombo
      })
    }

    // 胜负判定
    if (next.tiles.every((t) => t.removed)) {
      next.status = 'won'
      next.endTime = Date.now()
    } else if (next.slots.every((s) => s.tile !== null)) {
      next.status = 'lost'
      next.endTime = Date.now()
    } else if (next.clickRemaining === 0) {
      // 点击次数耗尽且未全部消除 → 判定失败
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
   * 拆牌锤：直接移除场上指定牌（含藤蔓/气泡等机制牌），不记 history。
   */
  static useChisel(state: GameState, tileId: number): GameState {
    if (state.props.chisel <= 0) return state
    const tile = state.tiles.find((t) => t.id === tileId)
    if (!tile || tile.removed || tile.inSlot) return state
    const next = cloneState(state)
    const t = next.tiles.find((x) => x.id === tileId)!
    t.removed = true
    t.inSlot = false
    t.slotIndex = -1
    delete t.mechanicState
    next.props.chisel -= 1
    next.lastMechanicEvents = []
    next.hintTileIds = []
    return next
  }

  /**
   * 槽位清空：把槽位所有牌放回牌堆（inSlot=false），不 demo 消除。
   */
  static useClearProp(state: GameState): GameState {
    if (state.props.clearProp <= 0) return state
    const next = cloneState(state)
    for (const s of next.slots) {
      if (s.tile) {
        s.tile.inSlot = false
        s.tile.slotIndex = -1
        s.tile = null
      }
    }
    next.props.clearProp -= 1
    next.lastMechanicEvents = []
    next.hintTileIds = []
    return next
  }

  /**
   * 一键配对：找一对可点击且同动物的牌直接移除（消除），不记 history。
   * 复用 matcher 的 findHint（返回一对可点击同动物 tile id）。
   */
  static usePair(state: GameState): GameState {
    if (state.props.pair <= 0) return state
    const pair = findHint(state)
    if (!pair || pair.length < 2) return state
    const next = cloneState(state)
    for (const id of pair.slice(0, 2)) {
      const t = next.tiles.find((x) => x.id === id)
      if (t) {
        t.removed = true
        t.inSlot = false
        t.slotIndex = -1
        delete t.mechanicState
      }
    }
    next.props.pair -= 1
    next.lastMechanicEvents = []
    next.hintTileIds = []
    return next
  }

  /**
   * 临时扩容：卡槽 +1。
   */
  static useSlot(state: GameState): GameState {
    if (state.props.slot <= 0) return state
    const next = cloneState(state)
    next.maxSlots += 1
    next.slots.push({ index: next.slots.length, tile: null })
    next.props.slot -= 1
    next.lastMechanicEvents = []
    next.hintTileIds = []
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

  /**
   * 限时超时判定：若 config.timeLimit 存在且游戏仍在进行中，则判负。
   * 调用方：外层定时器递减 timeLeft，当 timeLeft===0 时调用此方法。
   * 返回克隆 state；已通关(won/lost)则保持不变。
   */
  static timeout(state: GameState): GameState {
    if (!state.config.timeLimit) return state
    if (state.status !== 'playing') return state
    const next = cloneState(state)
    next.timeLeft = 0
    next.status = 'lost'
    next.endTime = Date.now()
    return next
  }
}
