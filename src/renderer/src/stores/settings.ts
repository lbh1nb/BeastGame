import { defineStore } from 'pinia'
import { ref } from 'vue'
import audioManager from '@audio/manager'

/**
 * 设置 Store
 * - 管理背景音乐 / 音效音量（0-100）
 * - 持久化到 SQLite（通过 window.gameAPI.settings）
 * - 修改音量时同步到 AudioManager
 * - 注意：动物音效已统一为温和风铃音效，不再提供切换选项
 */
export const useSettingsStore = defineStore('settings', () => {
  /** BGM 音量 0-100 */
  const bgmVolume = ref(80)
  /** 音效音量 0-100 */
  const sfxVolume = ref(80)

  /** 默认值，重置时使用（与 DB 层 DEFAULT_SETTINGS 保持一致） */
  const DEFAULT_BGM = 60
  const DEFAULT_SFX = 80

  /**
   * 从 SQLite 读取设置
   * 容错：读取失败时保持默认值
   */
  async function load(): Promise<void> {
    try {
      const all = await window.gameAPI.settings.getAll()
      if (typeof all.bgmVolume === 'number') {
        bgmVolume.value = clamp(all.bgmVolume)
      }
      if (typeof all.sfxVolume === 'number') {
        sfxVolume.value = clamp(all.sfxVolume)
      }
      syncAudio()
    } catch (e) {
      console.warn('[settings] 读取设置失败，使用默认值', e)
    }
  }

  /** 设置 BGM 音量并持久化 */
  async function setBgmVolume(v: number): Promise<void> {
    bgmVolume.value = clamp(v)
    audioManager.setBgmVolume(bgmVolume.value)
    try {
      await window.gameAPI.settings.set('bgmVolume', bgmVolume.value)
    } catch (e) {
      console.warn('[settings] 保存 BGM 音量失败', e)
    }
  }

  /** 设置音效音量并持久化 */
  async function setSfxVolume(v: number): Promise<void> {
    sfxVolume.value = clamp(v)
    audioManager.setSfxVolume(sfxVolume.value)
    try {
      await window.gameAPI.settings.set('sfxVolume', sfxVolume.value)
    } catch (e) {
      console.warn('[settings] 保存音效音量失败', e)
    }
  }

  /** 重置所有设置为默认值 */
  async function reset(): Promise<void> {
    try {
      await window.gameAPI.settings.reset()
    } catch (e) {
      console.warn('[settings] 重置设置失败', e)
    }
    bgmVolume.value = DEFAULT_BGM
    sfxVolume.value = DEFAULT_SFX
    syncAudio()
  }

  /** 同步当前音量到 AudioManager */
  function syncAudio(): void {
    audioManager.setBgmVolume(bgmVolume.value)
    audioManager.setSfxVolume(sfxVolume.value)
  }

  function clamp(v: number): number {
    return Math.max(0, Math.min(100, Math.round(v)))
  }

  return {
    bgmVolume,
    sfxVolume,
    load,
    setBgmVolume,
    setSfxVolume,
    reset
  }
})
