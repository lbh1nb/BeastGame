import { Howl } from 'howler'
import type { AnimalType } from '@game/types'
import toneGenerator from './tone-generator'

/**
 * 音效管理器（单例）
 * - BGM 循环播放，SFX 一次性播放
 * - 动物叫声：悬停时播放，每种动物一个音频文件
 * - 音频文件可能不存在，所有加载/播放均 try-catch 静默失败
 * - 资源路径通过 window.gameAPI.asset.resolve('audio/xxx.mp3') 获取
 */

/** 支持的音效名 */
export type SfxName =
  | 'click'
  | 'match'
  | 'combo'
  | 'fail'
  | 'win'
  | 'prop_undo'
  | 'prop_shuffle'
  | 'prop_hint'
  | 'combo_good'        // 连击 3
  | 'combo_nice'        // 连击 5
  | 'combo_great'       // 连击 7
  | 'combo_amazing'     // 连击 10
  | 'combo_unbelievable' // 连击 15
  | 'combo_godlike'     // 连击 20+

/** 连击等级（与阈值对应） */
export type ComboTier =
  | 'good'
  | 'nice'
  | 'great'
  | 'amazing'
  | 'unbelievable'
  | 'godlike'

/** 连击阈值 → 等级映射 */
const COMBO_THRESHOLDS: { tier: ComboTier; threshold: number }[] = [
  { tier: 'good', threshold: 3 },
  { tier: 'nice', threshold: 5 },
  { tier: 'great', threshold: 7 },
  { tier: 'amazing', threshold: 10 },
  { tier: 'unbelievable', threshold: 15 },
  { tier: 'godlike', threshold: 20 }
]

/**
 * 根据连击数获取对应等级（取小于等于 combo 的最大阈值）
 * combo=3 → 'good'；combo=4 仍为 'good'；combo=5 → 'nice'
 */
export function getComboTier(combo: number): ComboTier | null {
  let result: ComboTier | null = null
  for (const { tier, threshold } of COMBO_THRESHOLDS) {
    if (combo >= threshold) result = tier
  }
  return result
}

/**
 * 判断 combo 是否跨越了某个阈值（即"首次达到"）
 * @param prevCombo 上一次 combo
 * @param curCombo 本次 combo
 * @returns 跨越的等级，未跨越返回 null
 */
export function getComboTierCrossed(prevCombo: number, curCombo: number): ComboTier | null {
  let crossed: ComboTier | null = null
  for (const { tier, threshold } of COMBO_THRESHOLDS) {
    if (prevCombo < threshold && curCombo >= threshold) {
      crossed = tier
    }
  }
  return crossed
}

/** 等级 → 音效名 */
const TIER_SFX_MAP: Record<ComboTier, SfxName> = {
  good: 'combo_good',
  nice: 'combo_nice',
  great: 'combo_great',
  amazing: 'combo_amazing',
  unbelievable: 'combo_unbelievable',
  godlike: 'combo_godlike'
}

/** 动物叫声文件名映射 */
const ANIMAL_SFX_MAP: Record<AnimalType, string> = {
  sheep: 'animal_sheep.mp3',
  chicken: 'animal_chicken.mp3',
  cat: 'animal_cat.mp3',
  dog: 'animal_dog.mp3',
  rabbit: 'animal_rabbit.mp3',
  hamster: 'animal_hamster.mp3',
  tiger: 'animal_tiger.mp3',
  bear: 'animal_bear.mp3',
  fish: 'animal_fish.mp3',
  whale: 'animal_whale.mp3',
  duck: 'animal_duck.mp3',
  goose: 'animal_goose.mp3'
}

/** 支持的 BGM 名（可扩展） */
export type BgmName = 'home' | 'game' | 'level'

class AudioManager {
  private static instance: AudioManager | null = null

  /** 已加载的 Howl 缓存：key = 音频名 */
  private sfxCache: Map<string, Howl> = new Map()
  /** 当前 BGM Howl */
  private bgmHowl: Howl | null = null
  private currentBgmName: string | null = null

  /** 音量（0-100） */
  private bgmVolume = 60
  private sfxVolume = 80

  /** 正在加载中的资源，避免重复请求 */
  private loading: Map<string, Promise<Howl | null>> = new Map()

  private constructor() {}

  /** 获取单例 */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /** 设置 BGM 音量（0-100），仅作用于 BGM Howl，不影响音效 */
  setBgmVolume(v: number): void {
    this.bgmVolume = Math.max(0, Math.min(100, v))
    const vol = this.bgmVolume / 100
    if (this.bgmHowl) {
      this.bgmHowl.volume(vol)
    }
  }

  /** 设置 SFX 音量（0-100），同步到 ToneGenerator */
  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(100, v))
    toneGenerator.setVolume(this.sfxVolume)
  }

  /**
   * 播放 BGM（循环）
   * - 优先用 Howler 播放音频文件（若存在）
   * - 文件缺失时回退到 ToneGenerator 程序化生成循环
   * - 任何异常都静默处理，防止影响 UI
   */
  async playBgm(name: BgmName): Promise<void> {
    if (this.currentBgmName === name) return
    this.stopBgm()
    this.currentBgmName = name

    try {
      const howl = await this.loadHowl(`audio/bgm_${name}.mp3`, true)
      if (howl) {
        this.bgmHowl = howl
        howl.volume(this.bgmVolume / 100)
        howl.play()
      } else {
        // 回退：程序化生成循环 BGM
        toneGenerator.startBgmLoop(name)
      }
    } catch {
      // 任何异常都回退到程序化生成
      try {
        toneGenerator.startBgmLoop(name)
      } catch {
        // 最终兜底：静默失败
      }
    }
  }

  /** 停止 BGM */
  stopBgm(): void {
    if (this.bgmHowl) {
      try {
        this.bgmHowl.stop()
        this.bgmHowl.unload()
      } catch {
        // 忽略
      }
      this.bgmHowl = null
    }
    // 同步停止 ToneGenerator 的 BGM 循环
    toneGenerator.stopBgmLoop()
    this.currentBgmName = null
  }

  /**
   * 播放按钮 hover 音效
   */
  playHover(): void {
    if (this.sfxVolume <= 0) return
    try {
      toneGenerator.playHover()
    } catch {
      // 静默失败
    }
  }

  /**
   * 播放一次性音效
   * - 优先用 Howler 播放音频文件（若存在）
   * - 文件缺失时回退到 ToneGenerator 程序化生成
   * - 任何异常都静默处理，防止影响 UI
   */
  async playSfx(name: SfxName): Promise<void> {
    if (this.sfxVolume <= 0) return
    try {
      const howl = await this.loadHowl(`audio/sfx_${name}.mp3`, false)
      if (howl) {
        howl.volume(this.sfxVolume / 100)
        try {
          howl.play()
          return
        } catch {
          // 播放失败，回退
        }
      }
      // 回退：程序化生成
      toneGenerator.playSfx(name)
    } catch {
      try {
        toneGenerator.playSfx(name)
      } catch {
        // 静默失败
      }
    }
  }

  /**
   * 播放动物叫声（悬停时触发）
   * - 优先用 Howler 播放音频文件（若存在）
   * - 文件缺失时回退到 ToneGenerator 程序化生成
   * - 任何异常都静默处理，防止影响 UI
   */
  async playAnimalSound(animal: AnimalType): Promise<void> {
    if (this.sfxVolume <= 0) return
    try {
      const fileName = ANIMAL_SFX_MAP[animal]
      if (!fileName) return
      const howl = await this.loadHowl(`audio/${fileName}`, false)
      if (howl) {
        howl.volume(this.sfxVolume / 100)
        try {
          howl.play()
          return
        } catch {
          // 播放失败，回退
        }
      }
      // 回退：程序化生成
      toneGenerator.playAnimalSound(animal)
    } catch {
      try {
        toneGenerator.playAnimalSound(animal)
      } catch {
        // 静默失败
      }
    }
  }

  /**
   * 播放连击夸赞音效
   * - 优先用 Howler 播放音频文件（若存在）
   * - 文件缺失时回退到 ToneGenerator 程序化生成
   * - 任何异常都静默处理，防止影响 UI
   */
  async playComboPraise(tier: ComboTier): Promise<void> {
    if (this.sfxVolume <= 0) return
    try {
      const sfxName = TIER_SFX_MAP[tier]
      const howl = await this.loadHowl(`audio/sfx_${sfxName}.mp3`, false)
      if (howl) {
        howl.volume(this.sfxVolume / 100)
        try {
          howl.play()
          return
        } catch {
          // 播放失败，回退
        }
      }
      // 回退：程序化生成
      toneGenerator.playComboPraise(tier)
    } catch {
      try {
        toneGenerator.playComboPraise(tier)
      } catch {
        // 静默失败
      }
    }
  }

  /**
   * 加载音频文件并构造 Howl
   * - 通过 window.gameAPI.asset.resolve 解析真实路径
   * - 正确等待 onload / onloaderror 事件，加载失败时返回 null
   * - 同名资源只加载一次（缓存）
   */
  private async loadHowl(assetName: string, loop: boolean): Promise<Howl | null> {
    // 命中缓存（且状态正常）
    if (this.sfxCache.has(assetName)) {
      const cached = this.sfxCache.get(assetName)
      if (cached && cached.state() === 'loaded') return cached
      // 缓存的是坏 howl，清掉重载
      this.sfxCache.delete(assetName)
    }
    // 正在加载
    if (this.loading.has(assetName)) {
      return this.loading.get(assetName) ?? null
    }

    const promise = (async (): Promise<Howl | null> => {
      try {
        const src = await window.gameAPI.asset.resolve(assetName)
        if (!src) return null

        // Howler 加载本地文件需要 file:// URL
        let fileUrl = src
        if (!src.startsWith('file://') && !src.startsWith('http')) {
          fileUrl = 'file:///' + src.replace(/\\/g, '/')
        }

        // 用 Promise 包裹 Howl 的 onload / onloaderror 事件
        return await new Promise<Howl | null>((resolve) => {
          let settled = false
          const howl = new Howl({
            src: [fileUrl],
            loop,
            preload: true,
            // 使用 HTML5 Audio 元素而非 Web Audio API
            // HTML5 Audio 可直接播放 file:// URL，不受 XHR/CORS 限制
            html5: true,
            onload: () => {
              if (settled) return
              settled = true
              this.sfxCache.set(assetName, howl)
              resolve(howl)
            },
            onloaderror: () => {
              if (settled) return
              settled = true
              // 不缓存坏 howl
              resolve(null)
            }
          })
          // 兜底：若 3 秒内既没 onload 也没 onloaderror，视为失败
          setTimeout(() => {
            if (settled) return
            settled = true
            resolve(null)
          }, 3000)
        })
      } catch {
        return null
      }
    })()

    this.loading.set(assetName, promise)
    const result = await promise
    this.loading.delete(assetName)
    return result
  }
}

/** 导出单例 */
export const audioManager = AudioManager.getInstance()

export default audioManager
