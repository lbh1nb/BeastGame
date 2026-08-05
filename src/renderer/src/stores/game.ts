import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GameEngine, makeDefaultConfig } from '@game/engine'
import { getLevelById, CHAPTERS } from '@game/levels.config'
import { calcStars as calcStarsMulti } from '@game/stars'
import { rollCollection, RARITY_GOLD, type Rarity } from '@game/collection'
import type { GameMode, GameState, LevelConfig, AnimalType, MechanicType } from '@game/types'
import { preloadAnimalImages } from '@utils/animal-image'
import { preloadMechanicImages } from '@utils/mechanic-image'
import { preloadMechanicVideos } from '@utils/mechanic-video'
import audioManager, {
  getComboTierCrossed,
  type ComboTier
} from '@audio/manager'
import { useUserStore } from './user'

/** 机制动画状态（播放中的一次性动画） */
export interface MechanicAnimState {
  kind: 'resolving' | 'breaking' | 'revealing'
  type?: MechanicType
  startTime: number
}

/** 动画时长（ms） */
const MECHANIC_ANIM_DURATION = {
  // 与机制解除视频时长对齐：4 秒源视频以 4 倍速播放，约 1 秒，故动画时长设为 1000ms
  resolving: 1000,
  breaking: 1000,
  revealing: 1000
} as const

/** 待选目标道具（如拆牌锤需选择一张牌作为目标） */
type PendingProp = 'chisel' | null

/**
 * 当前局游戏状态 Store
 * - 持有引擎返回的 GameState
 * - 转发引擎操作（点击 / 撤回 / 洗牌 / 提示）
 * - 局终结算：保存记录、更新进度与成就、发放综合评分道具奖励
 *
 * 注意：引擎方法约定返回新的 GameState（不可变模式）；
 * 若引擎原地修改并返回 void，则浅拷贝顶层对象以触发 Vue 响应式。
 */
export const useGameStore = defineStore('game', () => {
  /** 引擎当前状态 */
  const engineState = ref<GameState | null>(null)
  /** 当前待选目标道具（如拆牌锤需选牌），选中后执行并清空 */
  const pendingProp = ref<PendingProp>(null)
  /** 本局资源（动物/机制图片）是否已就绪：就绪后才关闭"加载中"界面渲染牌堆，避免牌面空白与卡顿 */
  const resourcesReady = ref(false)
  /** 闯关模式选中的关卡 ID */
  const selectedLevelId = ref<number | null>(null)
  /** 音效开关 */
  const soundEnabled = ref(true)
  /** 本局最终分数（局终弹窗用） */
  const finalScore = ref(0)
  /** 本局是否已结算，防止 endGame 重复执行 */
  const hasEnded = ref(false)
  /** 本局获得的收藏品（通关/挑战掉落，局终弹窗展示用） */
  const lastCollection = ref<{ id: string; rarity: Rarity; isNew: boolean } | null>(null)
  /** 倒计时定时器（闯关限时用） */
  let countdownTimer: number | undefined

  /** 连击夸赞弹幕状态 */
  const comboPraise = ref<{ visible: boolean; tier: ComboTier; combo: number }>({
    visible: false,
    tier: 'good',
    combo: 0
  })

  /** 最近被点击的牌 id 集合：点击后短暂停留在牌堆显示动态图，再入槽/消除 */
  const pickedFlash = ref<Set<number>>(new Set())
  const flashTimers = new Map<number, number>()
  const FLASH_DURATION = 400
  /** 暴露给视图的闪烁牌 id 数组 */
  const pickedFlashIds = computed(() => Array.from(pickedFlash.value))

  /**
   * 正在播放机制动画的牌 id → 动画状态
   * Tile 组件根据这个 map 判断是否播解除/破除/翻牌动画
   */
  const mechanicAnims = ref<Map<number, MechanicAnimState>>(new Map())
  const mechanicAnimTimers = new Map<number, number>()

  /** 当前游戏模式 */
  const currentMode = computed<GameMode | null>(() => engineState.value?.mode ?? null)

  /** 是否进行中 */
  const isPlaying = computed(() => engineState.value?.status === 'playing')

  const isWon = computed(() => engineState.value?.status === 'won')
  const isLost = computed(() => engineState.value?.status === 'lost')

  /** 是否可撤回：有道具且有历史且进行中 */
  const canUndo = computed(() => {
    const s = engineState.value
    return !!s && s.status === 'playing' && s.props.undo > 0 && s.history.length > 0
  })

  /** 是否可洗牌 */
  const canShuffle = computed(() => {
    const s = engineState.value
    return !!s && s.status === 'playing' && s.props.shuffle > 0
  })

  /** 是否可提示 */
  const canHint = computed(() => {
    const s = engineState.value
    return !!s && s.status === 'playing' && s.props.hint > 0
  })

  /**
   * 开始一局游戏
   * @param mode 游戏模式
   * @param levelId 闯关模式关卡 ID
   */
  async function startGame(mode: GameMode, levelId?: number): Promise<void> {
    clearPickedFlash()
    clearMechanicAnims()
    clearCountdown()
    hasEnded.value = false
    finalScore.value = 0
    lastCollection.value = null
    selectedLevelId.value = levelId ?? null
    resourcesReady.value = false
    pendingProp.value = null

    try {
      let levelConfig: LevelConfig | undefined
      if (mode === 'level' && levelId != null) {
        const cfg = getLevelById(levelId)
        if (!cfg) {
          console.warn(`[game] 找不到关卡配置 levelId=${levelId}`)
        } else {
          levelConfig = cfg
        }
      }

      // 立即初始化引擎（布局/绘图计算不依赖图片），但牌堆渲染由 resourcesReady 控制
      engineState.value = GameEngine.init(mode, levelConfig)

      // 预加载本局用到的动物与机制图片（Promise 缓存去重后很快），就绪后再关闭"加载中"界面，
      // 确保牌面图片已就绪、无空白、无逐张补绘卡顿。
      // 优先取引擎实际生成的 config.animals（挑战模式为引擎内部随机的 6~8 种动物），
      // 与场上牌面保持一致；init 失败时回退到关卡通配或默认配置。
      const animals: AnimalType[] =
        engineState.value?.config.animals ?? levelConfig?.animals ?? makeDefaultConfig(mode).animals
      try {
        await Promise.all([
          preloadAnimalImages(animals),
          preloadMechanicImages()
        ])
      } catch (e) {
        console.warn('[game] 预加载资源失败（不影响游戏运行）', e)
      }
      resourcesReady.value = true

      // 机制解除视频单独后台预加载 + 预热解码（不阻塞图片加载，避免影响启动）
      preloadMechanicVideos().catch((e) => {
        console.warn('[game] 预加载机制视频失败（不影响游戏运行）', e)
      })

      // 闯关限时：启动倒计时驱动
      startCountdown()
    } catch (e) {
      console.error('[game] 初始化游戏失败', e)
      engineState.value = null
      resourcesReady.value = false
    }
  }

  /**
   * 点击一个图案
   * - 调用引擎 pickTile
   * - 根据消除/连击/胜负播放音效
   */
  async function pickTile(tileId: number): Promise<void> {
    const s = engineState.value
    if (!s || s.status !== 'playing') return

    const prevMatchTotal = s.matchCount_total
    const prevCombo = s.combo

    let picked = false
    try {
      const result = GameEngine.pickTile(s, tileId)
      // 状态变化时始终应用（包括 pick / vine-bubble 解除等）
      if (result.state !== s) {
        applyState(result.state)
      }
      picked = result.picked
    } catch (e) {
      console.error('[game] pickTile 失败', e)
      return
    }

    // 若引擎已判定结束（含点击次数耗尽），无论是否入槽都直接结算
    if (engineState.value && (engineState.value.status === 'won' || engineState.value.status === 'lost')) {
      await endGame()
      return
    }

    // 非 pick 操作（如藤蔓/气泡解除、被挡住不可点击等）不继续处理音效/胜负
    if (!picked) return

    // 点击成功：让该牌短暂停留在牌堆显示动态图，再入槽/消除
    flashTile(tileId)

    const cur = engineState.value
    if (!cur) return

    // 机制解析音效（从 state 中读取，避免 result 跨作用域问题）
    if (cur.lastResolvedMechanics.length > 0 && soundEnabled.value) {
      audioManager.playSfx('match')
    }

    // 音效反馈 + 连击夸赞触发
    if (cur.matchCount_total > prevMatchTotal) {
      // 发生了消除
      const crossedTier = getComboTierCrossed(prevCombo, cur.combo)
      if (crossedTier) {
        comboPraise.value = {
          visible: true,
          tier: crossedTier,
          combo: cur.combo
        }
        if (soundEnabled.value) {
          audioManager.playComboPraise(crossedTier)
        }
      }

      if (soundEnabled.value) {
        audioManager.playGentleClickSound()
      }
    } else if (soundEnabled.value) {
      audioManager.playSfx('click')
    }

    // 胜负判定
    if (cur.status === 'won' || cur.status === 'lost') {
      await endGame()
    }
  }

  /** 隐藏夸赞弹幕 */
  function hideComboPraise(): void {
    comboPraise.value = { ...comboPraise.value, visible: false }
  }

  /** 使用撤回道具 */
  async function useUndo(): Promise<void> {
    cancelPendingProp()
    const s = engineState.value
    if (!s || !canUndo.value) return
    try {
      const next = GameEngine.undo(s)
      applyState(next)
      if (soundEnabled.value) audioManager.playSfx('prop_undo')
    } catch (e) {
      console.error('[game] 撤回失败', e)
    }
  }

  /** 使用洗牌道具 */
  async function useShuffle(): Promise<void> {
    cancelPendingProp()
    const s = engineState.value
    if (!s || !canShuffle.value) return
    try {
      const next = GameEngine.shuffle(s)
      applyState(next)
      if (soundEnabled.value) audioManager.playSfx('prop_shuffle')
    } catch (e) {
      console.error('[game] 洗牌失败', e)
    }
  }

  /** 使用提示道具 */
  async function useHint(): Promise<void> {
    cancelPendingProp()
    const s = engineState.value
    if (!s || !canHint.value) return
    try {
      const next = GameEngine.showHint(s)
      applyState(next)
      if (soundEnabled.value) audioManager.playSfx('prop_hint')
    } catch (e) {
      console.error('[game] 提示失败', e)
    }
  }

  /**
   * 使用拆牌锤
   * - 未传 tileId：进入选择态，等待玩家选择要拆除的牌
   * - 已传 tileId：对指定牌执行拆除
   */
  async function useChisel(tileId?: number): Promise<void> {
    const s = engineState.value
    if (!s || s.status !== 'playing' || s.props.chisel <= 0) return
    // 未指定目标：进入选择态
    if (tileId == null) {
      pendingProp.value = 'chisel'
      return
    }
    try {
      const next = GameEngine.useChisel(s, tileId)
      // 无效牌（已移除/槽内）时引擎返回原 state 引用，保持选择态让玩家重选
      if (next === s) return
      pendingProp.value = null
      applyState(next)
      // 拆掉场上最后一张牌时触发胜利结算（引擎只置 removed，不重算 status）
      if (next.tiles.every((t) => t.removed)) {
        await endGame()
        return
      }
      if (soundEnabled.value) audioManager.playSfx('prop_shuffle')
    } catch (e) {
      console.error('[game] 拆牌锤失败', e)
    }
  }

  /** 使用槽位清空道具 */
  async function useClearProp(): Promise<void> {
    cancelPendingProp()
    const s = engineState.value
    if (!s || s.status !== 'playing' || s.props.clearProp <= 0) return
    try {
      const next = GameEngine.useClearProp(s)
      applyState(next)
      if (soundEnabled.value) audioManager.playSfx('prop_shuffle')
    } catch (e) {
      console.error('[game] 槽位清空失败', e)
    }
  }

  /** 使用一键配对道具 */
  async function usePair(): Promise<void> {
    cancelPendingProp()
    const s = engineState.value
    if (!s || s.status !== 'playing' || s.props.pair <= 0) return
    try {
      const next = GameEngine.usePair(s)
      applyState(next)
      // 一键配对消除最后两张牌时触发胜利结算（引擎只置 removed，不重算 status）
      if (next.tiles.every((t) => t.removed)) {
        await endGame()
        return
      }
      if (soundEnabled.value) audioManager.playSfx('prop_shuffle')
    } catch (e) {
      console.error('[game] 一键配对失败', e)
    }
  }

  /** 使用临时扩容道具 */
  async function useSlot(): Promise<void> {
    cancelPendingProp()
    const s = engineState.value
    if (!s || s.status !== 'playing' || s.props.slot <= 0) return
    try {
      const next = GameEngine.useSlot(s)
      applyState(next)
      if (soundEnabled.value) audioManager.playSfx('prop_shuffle')
    } catch (e) {
      console.error('[game] 临时扩容失败', e)
    }
  }

  /** 取消当前待选目标道具的选择态 */
  function cancelPendingProp(): void {
    pendingProp.value = null
  }

  /**
   * 局终结算
   * - 计算最终分数
   * - 保存单局记录到 SQLite
   * - 闯关模式：更新关卡进度、解锁下一关
   * - 解锁成就
   * - 发放综合评分道具奖励（持久化到 settings）
   */
  async function endGame(): Promise<void> {
    const s = engineState.value
    if (!s || hasEnded.value) return
    hasEnded.value = true

    // 计算最终分数（引擎返回对象，取 totalScore 作为最终分数，propReward 作为道具奖励）
    let score = s.score
    let propReward: Partial<{ undo: number; shuffle: number; hint: number }> = {}
    try {
      const final = GameEngine.calculateFinalScore(s)
      score = Math.round(final.totalScore)
      finalScore.value = score
      propReward = final.propReward || {}
    } catch {
      finalScore.value = s.score
    }

    const duration = getElapsedSeconds(s)
    const result: 'win' | 'lose' = s.status === 'won' ? 'win' : 'lose'

    // 保存单局记录
    try {
      await window.gameAPI.score.save({
        mode: s.mode,
        level_id: s.levelId ?? null,
        score,
        duration,
        max_combo: s.maxCombo,
        props_used: JSON.stringify(s.propsUsed),
        result,
        created_at: Math.floor(Date.now() / 1000)
      })
    } catch (e) {
      console.warn('[game] 保存记录失败', e)
    }

    // 闯关进度与成就
    if (s.mode === 'level' && s.levelId != null && result === 'win') {
      await updateLevelProgress(s.levelId, score, duration)
    }
    await unlockAchievements(s, score, result)

    // 综合评分道具奖励（直接使用引擎返回的 propReward，避免重复计算）
    try {
      if (propReward && Object.keys(propReward).length > 0) {
        await persistPropReward(propReward)
      }
    } catch (e) {
      console.warn('[game] 道具奖励发放失败', e)
    }

    // 收藏品掉落（仅闯关/挑战通关）：按星际概率掉收藏品，重复则转金币
    if (result === 'win' && (s.mode === 'level' || s.mode === 'challenge')) {
      await handleCollectionDrop(s, score)
    }

    // 刷新用户数据（最高分/进度/成就）
    const userStore = useUserStore()
    await userStore.refreshAll()
  }

  /** 重开本局 */
  async function restart(): Promise<void> {
    const s = engineState.value
    if (!s) return
    await startGame(s.mode, s.levelId ?? undefined)
  }

  /** 退出：清空当前局状态 */
  function exitToHome(): void {
    clearCountdown()
    clearPickedFlash()
    clearMechanicAnims()
    engineState.value = null
    resourcesReady.value = false
    selectedLevelId.value = null
    hasEnded.value = false
    finalScore.value = 0
    lastCollection.value = null
    pendingProp.value = null
  }

  /** 清理倒计时定时器 */
  function clearCountdown(): void {
    if (countdownTimer) {
      window.clearInterval(countdownTimer)
      countdownTimer = undefined
    }
  }

  /**
   * 启动限时倒计时：每秒递减 engineState.timeLeft。
   * 归零时调用 GameEngine.timeout 判负，并 endGame 结算。
   */
  function startCountdown(): void {
    clearCountdown()
    const s = engineState.value
    if (!s || s.config.timeLimit == null) return
    countdownTimer = window.setInterval(() => {
      const cur = engineState.value
      if (!cur || cur.status !== 'playing') {
        clearCountdown()
        return
      }
      const limit = cur.config.timeLimit ?? 0
      const nextLeft = Math.max(0, (cur.timeLeft ?? limit) - 1)
      if (nextLeft <= 0) {
        clearCountdown()
        const timedOut = GameEngine.timeout(cur)
        applyState(timedOut)
        endGame().catch((e) => {
          console.warn('[game] 超时结算失败', e)
        })
      } else {
        // 仅更新 timeLeft，浅拷贝触发响应式
        engineState.value = { ...cur, timeLeft: nextLeft }
      }
    }, 1000)
  }

  // ===== 内部方法 =====

  /**
   * 为某张牌触发一次性机制动画（resolving/breaking/revealing）
   * 动画结束后自动从 mechanicAnims 中移除
   */
  function triggerMechanicAnim(
    tileId: number,
    kind: MechanicAnimState['kind'],
    type?: MechanicType
  ): void {
    const existing = mechanicAnimTimers.get(tileId)
    if (existing) window.clearTimeout(existing)
    const state: MechanicAnimState = { kind, type, startTime: Date.now() }
    const nextMap = new Map(mechanicAnims.value)
    nextMap.set(tileId, state)
    mechanicAnims.value = nextMap
    // 机制解除/破除/翻开时播放对应的专属短音效，增强反馈
    if (type && soundEnabled.value) {
      audioManager.playMechanicSound(type)
    }
    const duration = MECHANIC_ANIM_DURATION[kind]
    const timer = window.setTimeout(() => {
      const m = new Map(mechanicAnims.value)
      m.delete(tileId)
      mechanicAnims.value = m
      mechanicAnimTimers.delete(tileId)
    }, duration)
    mechanicAnimTimers.set(tileId, timer)
  }

  /** 清空所有机制动画（重开/退出时调用） */
  function clearMechanicAnims(): void {
    for (const t of mechanicAnimTimers.values()) window.clearTimeout(t)
    mechanicAnimTimers.clear()
    mechanicAnims.value = new Map()
  }

  /** 让某张牌短暂停留在牌堆并显示动态图，随后入槽/消除 */
  function flashTile(tileId: number): void {
    const set = new Set(pickedFlash.value)
    set.add(tileId)
    pickedFlash.value = set
    const existing = flashTimers.get(tileId)
    if (existing) window.clearTimeout(existing)
    const timer = window.setTimeout(() => {
      const ns = new Set(pickedFlash.value)
      ns.delete(tileId)
      pickedFlash.value = ns
      flashTimers.delete(tileId)
    }, FLASH_DURATION)
    flashTimers.set(tileId, timer)
  }

  /** 清空点击闪烁（重开/退出时调用，避免残留定时器） */
  function clearPickedFlash(): void {
    for (const t of flashTimers.values()) window.clearTimeout(t)
    flashTimers.clear()
    pickedFlash.value = new Set()
  }

  /** 应用引擎返回的状态，兼容不可变/可变两种实现 */
  function applyState(next: GameState | void | undefined): void {
    if (next) {
      // 扫描机制事件，触发对应一次性动画
      if (next.lastMechanicEvents && next.lastMechanicEvents.length > 0) {
        for (const ev of next.lastMechanicEvents) {
          if (ev.kind === 'resolved') {
            triggerMechanicAnim(ev.tileId, 'resolving', ev.type)
          } else if (ev.kind === 'broken') {
            triggerMechanicAnim(ev.tileId, 'breaking', ev.type)
          } else if (ev.kind === 'revealed') {
            triggerMechanicAnim(ev.tileId, 'revealing', ev.type)
          }
        }
      }
      engineState.value = next
    } else if (engineState.value) {
      engineState.value = { ...engineState.value }
    }
  }

  /** 计算已用秒数（兼容引擎方法缺失） */
  function getElapsedSeconds(s: GameState): number {
    try {
      const n = (GameEngine as any).getElapsedSeconds?.(s)
      if (typeof n === 'number') return n
    } catch {
      // 忽略
    }
    const end = s.endTime ?? Date.now()
    return Math.max(0, Math.floor((end - s.startTime) / 1000))
  }

  /** 更新关卡进度并解锁下一关 */
  async function updateLevelProgress(levelId: number, score: number, duration: number): Promise<void> {
    const stars = calcStars(score)
    try {
      const prev = await window.gameAPI.progress.get(levelId)
      const prevScore = prev?.best_score ?? 0
      const prevStars = prev?.stars ?? 0
      const prevDuration = prev?.best_duration ?? 0
      await window.gameAPI.progress.update(levelId, {
        status: 'done',
        stars: Math.max(prevStars, stars),
        best_score: Math.max(prevScore, score),
        best_duration: prevDuration ? Math.min(prevDuration, duration) : duration,
        updated_at: Math.floor(Date.now() / 1000)
      })
      // 解锁下一关
      await window.gameAPI.progress.unlock(levelId + 1).catch(() => {})
    } catch (e) {
      console.warn('[game] 更新关卡进度失败', e)
    }
  }

  /** 解锁成就 */
  async function unlockAchievements(s: GameState, score: number, result: 'win' | 'lose'): Promise<void> {
    const tryUnlock = (id: string) => {
      window.gameAPI.achievement.unlock(id).catch(() => {})
    }

    // 分数类
    if (score >= 500) tryUnlock('score_500')
    if (score >= 1000) tryUnlock('score_1000')
    if (score >= 2000) tryUnlock('score_2000')
    // 连击类
    if (s.maxCombo >= 5) tryUnlock('combo_5')
    if (s.maxCombo >= 10) tryUnlock('combo_10')

    if (result === 'win') {
      // 无道具通关
      if (s.propsUsed.undo === 0 && s.propsUsed.shuffle === 0 && s.propsUsed.hint === 0) {
        tryUnlock('no_prop_clear')
      }
      // 闯关类
      if (s.mode === 'level' && s.levelId != null) {
        tryUnlock('first_clear')
        try {
          const cfg = getLevelById(s.levelId)
          if (cfg) {
            tryUnlock(`chapter${cfg.chapter}_clear`)
            // 全关通关检测
            const all = await window.gameAPI.progress.getAll()
            const totalLevels = 30
            const doneCount = all.filter((p) => p.status === 'done').length
            if (doneCount >= totalLevels) tryUnlock('all_clear')
          }
        } catch {
          // 忽略 levels.config 缺失
        }
      }
    }
  }

  /** 持久化道具奖励到 settings，供下一局使用 */
  async function persistPropReward(reward: Partial<{ undo: number; shuffle: number; hint: number }>): Promise<void> {
    try {
      const raw = await window.gameAPI.settings.get('propRewards')
      const cur = raw ?? { undo: 0, shuffle: 0, hint: 0 }
      const merged = {
        undo: (cur.undo ?? 0) + (reward.undo ?? 0),
        shuffle: (cur.shuffle ?? 0) + (reward.shuffle ?? 0),
        hint: (cur.hint ?? 0) + (reward.hint ?? 0)
      }
      await window.gameAPI.settings.set('propRewards', merged)
    } catch {
      // 忽略
    }
  }

  /** 根据分数估算星级（1-3） */
  function calcStars(score: number): number {
    if (score >= 1200) return 3
    if (score >= 600) return 2
    return 1
  }

  /**
   * 收藏品掉落结算
   * 多维星级 → rollCollection 抽稀有度+动物 → record 收藏 → 重复则转金币。
   * 结果写入 lastCollection 供局终弹窗展示；任何异常仅告警，不影响通关结算。
   */
  async function handleCollectionDrop(s: GameState, score: number): Promise<void> {
    lastCollection.value = null
    try {
      const stars = calcStarsMulti({
        score,
        timeLeft: s.timeLeft ?? 0,
        propsUsed: s.propsUsed.undo + s.propsUsed.shuffle + s.propsUsed.hint,
        clickLeft: s.clickRemaining,
        timeLimit: s.config.timeLimit ?? 0,
        tileCount: s.config.tiles,
        maxSlots: s.config.maxSlots
      })
      const chapter = CHAPTERS.find((c) => c.id === s.config.chapter)
      const chapterAnimals = chapter?.animals ?? []
      const { id, rarity } = rollCollection(chapterAnimals, stars)
      const isNew = (await window.gameAPI.collection.record(id, rarity)) === 'new'
      if (!isNew) {
        await window.gameAPI.inventory.add('coin', RARITY_GOLD[rarity])
      }
      lastCollection.value = { id, rarity, isNew }
    } catch (e) {
      console.warn('[game] 收藏品掉落失败', e)
      lastCollection.value = null
    }
  }

  return {
    engineState,
    pendingProp,
    resourcesReady,
    selectedLevelId,
    soundEnabled,
    finalScore,
    hasEnded,
    lastCollection,
    comboPraise,
    pickedFlashIds,
    mechanicAnims,
    currentMode,
    isPlaying,
    isWon,
    isLost,
    canUndo,
    canShuffle,
    canHint,
    startGame,
    pickTile,
    useUndo,
    useShuffle,
    useHint,
    useChisel,
    useClearProp,
    usePair,
    useSlot,
    cancelPendingProp,
    endGame,
    restart,
    exitToHome,
    hideComboPraise
  }
})
