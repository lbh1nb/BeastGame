import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GameEngine, makeDefaultConfig } from '@game/engine'
import { getLevelById } from '@game/levels.config'
import type { GameMode, GameState, LevelConfig, AnimalType, MechanicType } from '@game/types'
import { preloadAnimalImages } from '@utils/animal-image'
import { preloadMechanicImages } from '@utils/mechanic-image'
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
  resolving: 650,
  breaking: 600,
  revealing: 500
} as const

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
  /** 闯关模式选中的关卡 ID */
  const selectedLevelId = ref<number | null>(null)
  /** 音效开关 */
  const soundEnabled = ref(true)
  /** 本局最终分数（局终弹窗用） */
  const finalScore = ref(0)
  /** 本局是否已结算，防止 endGame 重复执行 */
  const hasEnded = ref(false)

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
    hasEnded.value = false
    finalScore.value = 0
    selectedLevelId.value = levelId ?? null

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

      // 立即初始化引擎，让"加载中"界面尽快关闭（布局/绘图计算不依赖图片）
      engineState.value = GameEngine.init(mode, levelConfig)

      // 后台预加载本关用到的动物与机制图片（不阻塞游戏启动，带超时兜底）
      const animals: AnimalType[] = levelConfig?.animals ?? makeDefaultConfig(mode).animals
      const withTimeout = (p: Promise<unknown>, ms: number): Promise<void> =>
        Promise.race([p, new Promise<void>((r) => setTimeout(r, ms))]).then(() => undefined)
      withTimeout(
        Promise.all([preloadAnimalImages(animals), preloadMechanicImages()]),
        1500
      ).catch((e) => {
        console.warn('[game] 预加载图片失败（不影响游戏运行）', e)
      })
    } catch (e) {
      console.error('[game] 初始化游戏失败', e)
      engineState.value = null
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
    clearPickedFlash()
    clearMechanicAnims()
    engineState.value = null
    selectedLevelId.value = null
    hasEnded.value = false
    finalScore.value = 0
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
            triggerMechanicAnim(ev.tileId, 'revealing')
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

  return {
    engineState,
    selectedLevelId,
    soundEnabled,
    finalScore,
    hasEnded,
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
    endGame,
    restart,
    exitToHome,
    hideComboPraise
  }
})
