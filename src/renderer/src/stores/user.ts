import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GameMode } from '@game/types'

/**
 * 玩家进度与成就 Store
 * - progress: 30 关进度列表（level_progress 表）
 * - achievements: 成就列表（achievements 表）
 * - bestScores: 各模式最高分
 */
export const useUserStore = defineStore('user', () => {
  /** 闯关进度列表 */
  const progress = ref<any[]>([])
  /** 成就列表 */
  const achievements = ref<any[]>([])
  /** 各模式最高分 */
  const bestScores = ref<Record<GameMode, number>>({
    classic3: 0,
    classic4: 0,
    level: 0
  })

  /** 加载所有关卡进度 */
  async function loadProgress(): Promise<void> {
    try {
      progress.value = await window.gameAPI.progress.getAll()
    } catch (e) {
      console.warn('[user] 加载进度失败', e)
      progress.value = []
    }
  }

  /** 加载所有成就 */
  async function loadAchievements(): Promise<void> {
    try {
      achievements.value = await window.gameAPI.achievement.getAll()
    } catch (e) {
      console.warn('[user] 加载成就失败', e)
      achievements.value = []
    }
  }

  /** 加载各模式最高分 */
  async function loadBestScores(): Promise<void> {
    const modes: GameMode[] = ['classic3', 'classic4', 'level']
    const results = await Promise.all(
      modes.map(async (m) => {
        try {
          const best = await window.gameAPI.score.getBestScore(m)
          return [m, best ?? 0] as const
        } catch {
          return [m, 0] as const
        }
      })
    )
    const map: Record<GameMode, number> = { classic3: 0, classic4: 0, level: 0 }
    for (const [m, v] of results) {
      map[m] = v
    }
    bestScores.value = map
  }

  /** 刷新全部用户数据 */
  async function refreshAll(): Promise<void> {
    await Promise.all([loadProgress(), loadAchievements(), loadBestScores()])
  }

  /** 根据 levelId 获取单关进度 */
  function getProgress(levelId: number): any | null {
    return progress.value.find((p) => p.level_id === levelId) ?? null
  }

  /** 判断关卡是否已解锁 */
  function isLevelUnlocked(levelId: number): boolean {
    const p = getProgress(levelId)
    if (!p) return false
    return p.status === 'unlocked' || p.status === 'done'
  }

  /** 判断关卡是否已通关 */
  function isLevelCleared(levelId: number): boolean {
    const p = getProgress(levelId)
    return !!p && p.status === 'done'
  }

  return {
    progress,
    achievements,
    bestScores,
    loadProgress,
    loadAchievements,
    loadBestScores,
    refreshAll,
    getProgress,
    isLevelUnlocked,
    isLevelCleared
  }
})
