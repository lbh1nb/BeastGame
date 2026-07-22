/**
 * Web Audio API 程序化音效生成器（v2）
 *
 * 不依赖任何外部音频文件，用 OscillatorNode + GainNode 实时合成音效。
 *
 * v2 改进：
 *  - 12种动物音效按真实特征模拟（频率+波形+包络+颤音）
 *  - 新增 BGM 循环生成（C-G-Am-F 进行）
 *  - 新增按钮 hover/click 音效
 *  - 支持噪声生成（用于老虎吼声等）
 */
import type { AnimalType } from '@game/types'
import type { SfxName, ComboTier, BgmName } from './manager'

/** 单个音符定义 */
interface Note {
  freq: number
  duration: number
  type: OscillatorType
  volume: number
  /** 滑音目标频率（可选） */
  slideTo?: number
  /** 颤音频率 Hz（可选） */
  vibrato?: number
  /** 颤音深度 Hz（可选） */
  vibratoDepth?: number
}

type NoteSequence = Note[]

class ToneGenerator {
  private static instance: ToneGenerator | null = null

  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private volume = 80

  /** BGM 循环定时器 */
  private bgmTimer: number | null = null
  /** BGM 当前播放名 */
  private currentBgm: BgmName | null = null

  private constructor() {}

  static getInstance(): ToneGenerator {
    if (!ToneGenerator.instance) {
      ToneGenerator.instance = new ToneGenerator()
    }
    return ToneGenerator.instance
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(100, v))
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume / 100
    }
  }

  /** 懒加载 AudioContext */
  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    try {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.volume / 100
      this.masterGain.connect(this.ctx.destination)
      return this.ctx
    } catch {
      return null
    }
  }

  /**
   * 播放一段音符序列
   */
  private playSequence(seq: NoteSequence, volumeScale = 1): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.masterGain) return
    if (this.volume <= 0) return

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    let startTime = ctx.currentTime
    for (const note of seq) {
      this.scheduleNote(ctx, this.masterGain, note, startTime, volumeScale)
      startTime += note.duration / 1000
    }
  }

  /**
   * 调度单个音符
   */
  private scheduleNote(
    ctx: AudioContext,
    destination: GainNode,
    note: Note,
    startTime: number,
    volumeScale: number
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = note.type
    osc.frequency.setValueAtTime(note.freq, startTime)

    // 滑音
    if (note.slideTo) {
      osc.frequency.linearRampToValueAtTime(note.slideTo, startTime + note.duration / 1000)
    }

    // 颤音
    if (note.vibrato && note.vibratoDepth) {
      const vibratoOsc = ctx.createOscillator()
      const vibratoGain = ctx.createGain()
      vibratoOsc.frequency.value = note.vibrato
      vibratoGain.gain.value = note.vibratoDepth
      vibratoOsc.connect(vibratoGain)
      vibratoGain.connect(osc.frequency)
      vibratoOsc.start(startTime)
      vibratoOsc.stop(startTime + note.duration / 1000 + 0.01)
    }

    // ADSR 包络
    const dur = note.duration / 1000
    const attack = Math.min(0.02, dur * 0.15)
    const release = Math.min(0.08, dur * 0.3)
    const vol = note.volume * volumeScale
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(vol, startTime + attack)
    gain.gain.setValueAtTime(vol, startTime + dur - release)
    gain.gain.linearRampToValueAtTime(0, startTime + dur)

    osc.connect(gain)
    gain.connect(destination)
    osc.start(startTime)
    osc.stop(startTime + dur + 0.01)
  }

  /**
   * 生成白噪声（用于老虎吼声、水声等）
   */
  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const sampleRate = ctx.sampleRate
    const length = Math.floor(sampleRate * duration / 1000)
    const buffer = ctx.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1
    }
    return buffer
  }

  /**
   * 播放带噪声的音效（用于老虎/鱼等）
   */
  private playNoiseSound(
    noiseDuration: number,
    filterFreq: number,
    volume: number
  ): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.masterGain) return
    if (this.volume <= 0) return

    const buffer = this.createNoiseBuffer(ctx, noiseDuration)
    const source = ctx.createBufferSource()
    source.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = filterFreq

    const gain = ctx.createGain()
    const dur = noiseDuration / 1000
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    source.start()
    source.stop(ctx.currentTime + dur + 0.01)
  }

  playSfx(name: SfxName): void {
    // 按钮音效
    if (name === 'click') {
      this.playSequence([{ freq: 800, duration: 50, type: 'sine', volume: 0.15 }])
      return
    }
    const seq = SFX_SEQUENCES[name]
    if (seq) this.playSequence(seq)
  }

  /**
   * 播放按钮 hover 音效
   */
  playHover(): void {
    this.playSequence([{ freq: 1200, duration: 30, type: 'sine', volume: 0.1 }])
  }

  playComboPraise(tier: ComboTier): void {
    const seq = COMBO_PRAISE_SEQUENCES[tier]
    if (seq) this.playSequence(seq)
  }

  playAnimalSound(animal: AnimalType): void {
    // 特殊处理：带噪声的动物
    if (animal === 'tiger') {
      // 老虎：低频锯齿 + 噪声
      this.playSequence(ANIMAL_SOUND_SEQUENCES.tiger)
      this.playNoiseSound(500, 400, 0.08)
      return
    }
    if (animal === 'fish') {
      // 小鱼：水泡声（噪声 + 高频正弦）
      this.playSequence(ANIMAL_SOUND_SEQUENCES.fish)
      this.playNoiseSound(200, 2000, 0.05)
      return
    }
    if (animal === 'whale') {
      // 鲸鱼：低频悠长 + 噪声回声
      this.playSequence(ANIMAL_SOUND_SEQUENCES.whale)
      this.playNoiseSound(700, 300, 0.04)
      return
    }
    const seq = ANIMAL_SOUND_SEQUENCES[animal]
    if (seq) this.playSequence(seq)
  }

  // ============ BGM 循环生成 ============

  /**
   * 开始播放 BGM 循环
   * - home: C-G-Am-F 进行，轻快
   * - game: Am-F-C-G 进行，紧张
   * - level: Dm-Am-Bb-F 进行，神秘
   */
  startBgmLoop(name: BgmName): void {
    if (this.currentBgm === name) return
    this.stopBgmLoop()
    this.currentBgm = name

    const melody = BGM_MELODIES[name]
    if (!melody) return

    const playOnce = () => {
      this.playBgmSequence(melody)
    }
    playOnce()
    // 循环
    const totalDuration = melody.reduce((sum, n) => sum + n.duration, 0)
    this.bgmTimer = window.setInterval(() => {
      playOnce()
    }, totalDuration)
  }

  /** 停止 BGM 循环 */
  stopBgmLoop(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer)
      this.bgmTimer = null
    }
    this.currentBgm = null
  }

  /** 播放 BGM 旋律（音量较低） */
  private playBgmSequence(seq: NoteSequence): void {
    const ctx = this.ensureContext()
    if (!ctx || !this.masterGain) return
    if (this.volume <= 0) return

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    // BGM 用独立的 gain 节点，音量为主音量的 30%
    const bgmGain = ctx.createGain()
    bgmGain.gain.value = 0.3
    bgmGain.connect(this.masterGain)

    let startTime = ctx.currentTime
    for (const note of seq) {
      this.scheduleNote(ctx, bgmGain, note, startTime, 1)
      startTime += note.duration / 1000
    }
  }
}

// ============ 音符序列定义 ============

const SFX_SEQUENCES: Record<SfxName, NoteSequence> = {
  click: [{ freq: 800, duration: 50, type: 'sine', volume: 0.15 }],
  match: [
    { freq: 523, duration: 80, type: 'sine', volume: 0.2 },
    { freq: 659, duration: 80, type: 'sine', volume: 0.2 },
    { freq: 784, duration: 100, type: 'sine', volume: 0.25 }
  ],
  combo: [
    { freq: 659, duration: 60, type: 'sine', volume: 0.2 },
    { freq: 784, duration: 60, type: 'sine', volume: 0.2 },
    { freq: 988, duration: 100, type: 'sine', volume: 0.25 }
  ],
  fail: [
    { freq: 400, duration: 150, type: 'sawtooth', volume: 0.2 },
    { freq: 300, duration: 150, type: 'sawtooth', volume: 0.2 },
    { freq: 200, duration: 300, type: 'sawtooth', volume: 0.25 }
  ],
  win: [
    { freq: 523, duration: 100, type: 'sine', volume: 0.2 },
    { freq: 659, duration: 100, type: 'sine', volume: 0.2 },
    { freq: 784, duration: 100, type: 'sine', volume: 0.2 },
    { freq: 1047, duration: 250, type: 'sine', volume: 0.3 }
  ],
  prop_undo: [{ freq: 300, duration: 80, type: 'triangle', volume: 0.2 }],
  prop_shuffle: [
    { freq: 200, duration: 60, type: 'triangle', volume: 0.15 },
    { freq: 400, duration: 60, type: 'triangle', volume: 0.15 },
    { freq: 600, duration: 60, type: 'triangle', volume: 0.15 },
    { freq: 400, duration: 60, type: 'triangle', volume: 0.15 },
    { freq: 200, duration: 80, type: 'triangle', volume: 0.2 }
  ],
  prop_hint: [
    { freq: 800, duration: 60, type: 'sine', volume: 0.2 },
    { freq: 1000, duration: 100, type: 'sine', volume: 0.25 }
  ],
  // 连击夸赞
  combo_good: [
    { freq: 523, duration: 80, type: 'sine', volume: 0.25 },
    { freq: 659, duration: 80, type: 'sine', volume: 0.25 },
    { freq: 784, duration: 150, type: 'sine', volume: 0.3 }
  ],
  combo_nice: [
    { freq: 523, duration: 70, type: 'sine', volume: 0.25 },
    { freq: 659, duration: 70, type: 'sine', volume: 0.25 },
    { freq: 784, duration: 70, type: 'sine', volume: 0.25 },
    { freq: 1047, duration: 150, type: 'sine', volume: 0.3 }
  ],
  combo_great: [
    { freq: 523, duration: 60, type: 'sine', volume: 0.25 },
    { freq: 659, duration: 60, type: 'sine', volume: 0.25 },
    { freq: 784, duration: 60, type: 'sine', volume: 0.25 },
    { freq: 1047, duration: 60, type: 'sine', volume: 0.25 },
    { freq: 1319, duration: 180, type: 'sine', volume: 0.3 }
  ],
  combo_amazing: [
    { freq: 523, duration: 55, type: 'sine', volume: 0.25 },
    { freq: 659, duration: 55, type: 'sine', volume: 0.25 },
    { freq: 784, duration: 55, type: 'sine', volume: 0.25 },
    { freq: 1047, duration: 55, type: 'sine', volume: 0.25 },
    { freq: 1319, duration: 55, type: 'sine', volume: 0.25 },
    { freq: 1568, duration: 200, type: 'sine', volume: 0.35 }
  ],
  combo_unbelievable: [
    { freq: 523, duration: 50, type: 'sine', volume: 0.25 },
    { freq: 659, duration: 50, type: 'sine', volume: 0.25 },
    { freq: 784, duration: 50, type: 'sine', volume: 0.25 },
    { freq: 1047, duration: 50, type: 'sine', volume: 0.25 },
    { freq: 1319, duration: 50, type: 'sine', volume: 0.25 },
    { freq: 1568, duration: 50, type: 'sine', volume: 0.25 },
    { freq: 2093, duration: 250, type: 'sine', volume: 0.4 }
  ],
  combo_godlike: [
    { freq: 523, duration: 45, type: 'sine', volume: 0.3 },
    { freq: 659, duration: 45, type: 'sine', volume: 0.3 },
    { freq: 784, duration: 45, type: 'sine', volume: 0.3 },
    { freq: 1047, duration: 45, type: 'sine', volume: 0.3 },
    { freq: 1319, duration: 45, type: 'sine', volume: 0.3 },
    { freq: 1568, duration: 45, type: 'sine', volume: 0.3 },
    { freq: 2093, duration: 45, type: 'sine', volume: 0.35 },
    { freq: 2637, duration: 300, type: 'sine', volume: 0.45 }
  ]
}

const COMBO_PRAISE_SEQUENCES: Record<ComboTier, NoteSequence> = {
  good: SFX_SEQUENCES.combo_good,
  nice: SFX_SEQUENCES.combo_nice,
  great: SFX_SEQUENCES.combo_great,
  amazing: SFX_SEQUENCES.combo_amazing,
  unbelievable: SFX_SEQUENCES.combo_unbelievable,
  godlike: SFX_SEQUENCES.combo_godlike
}

/**
 * 12种动物特征音效
 * - 绵羊：低频颤音咩叫
 * - 小鸡：高频断续叽叽
 * - 小猫：滑频颤音喵
 * - 小狗：中频短促汪
 * - 兔子：高频轻柔咕
 * - 仓鼠：超高频尖鸣吱
 * - 老虎：低频长吼+噪声
 * - 小熊：中频低沉嗷
 * - 小鱼：水泡高频+噪声
 * - 鲸鱼：低频悠长嗡+回声
 * - 小鸭：中频喉音嘎嘎
 * - 白鹅：高频高昂吭吭
 */
const ANIMAL_SOUND_SEQUENCES: Record<AnimalType, NoteSequence> = {
  // 绵羊：低频颤音，220→180Hz 滑降，5Hz 颤音
  sheep: [
    { freq: 220, duration: 400, type: 'sawtooth', volume: 0.15, slideTo: 180, vibrato: 5, vibratoDepth: 8 }
  ],
  // 小鸡：1200-1400Hz 三短音
  chicken: [
    { freq: 1200, duration: 50, type: 'square', volume: 0.12 },
    { freq: 1400, duration: 50, type: 'square', volume: 0.12 },
    { freq: 1200, duration: 80, type: 'square', volume: 0.12 }
  ],
  // 小猫：600→700→600Hz 来回滑频，三角波
  cat: [
    { freq: 600, duration: 150, type: 'triangle', volume: 0.15, slideTo: 700 },
    { freq: 700, duration: 150, type: 'triangle', volume: 0.15, slideTo: 600 },
    { freq: 600, duration: 150, type: 'triangle', volume: 0.15 }
  ],
  // 小狗：500→400Hz 下行，方波
  dog: [
    { freq: 500, duration: 100, type: 'square', volume: 0.15, slideTo: 400 },
    { freq: 400, duration: 150, type: 'square', volume: 0.15 }
  ],
  // 兔子：900→1100Hz 上升，正弦波轻柔
  rabbit: [
    { freq: 900, duration: 100, type: 'sine', volume: 0.1, slideTo: 1100 },
    { freq: 1100, duration: 100, type: 'sine', volume: 0.1 }
  ],
  // 仓鼠：1500-1800Hz 三短音，方波
  hamster: [
    { freq: 1500, duration: 40, type: 'square', volume: 0.1 },
    { freq: 1800, duration: 40, type: 'square', volume: 0.1 },
    { freq: 1500, duration: 70, type: 'square', volume: 0.1 }
  ],
  // 老虎：150→120Hz 长音，锯齿波（+噪声由 playAnimalSound 添加）
  tiger: [
    { freq: 150, duration: 500, type: 'sawtooth', volume: 0.2, slideTo: 120, vibrato: 4, vibratoDepth: 5 }
  ],
  // 小熊：250→200Hz 下行，三角波
  bear: [
    { freq: 250, duration: 200, type: 'triangle', volume: 0.18, slideTo: 200 },
    { freq: 200, duration: 250, type: 'triangle', volume: 0.18 }
  ],
  // 小鱼：1000→1200→800Hz 滑音+颤音（+噪声由 playAnimalSound 添加）
  fish: [
    { freq: 1000, duration: 100, type: 'sine', volume: 0.1, slideTo: 1200, vibrato: 8, vibratoDepth: 15 },
    { freq: 1200, duration: 100, type: 'sine', volume: 0.1, slideTo: 800 },
    { freq: 800, duration: 100, type: 'sine', volume: 0.1 }
  ],
  // 鲸鱼：180→220Hz 慢上升，正弦波悠长（+噪声由 playAnimalSound 添加）
  whale: [
    { freq: 180, duration: 700, type: 'sine', volume: 0.18, slideTo: 220, vibrato: 2, vibratoDepth: 4 }
  ],
  // 小鸭：400-450Hz 三短音，锯齿波
  duck: [
    { freq: 400, duration: 80, type: 'sawtooth', volume: 0.15 },
    { freq: 450, duration: 80, type: 'sawtooth', volume: 0.15 },
    { freq: 400, duration: 100, type: 'sawtooth', volume: 0.15 }
  ],
  // 白鹅：500-700Hz 上升三音，锯齿波
  goose: [
    { freq: 500, duration: 100, type: 'sawtooth', volume: 0.15 },
    { freq: 600, duration: 100, type: 'sawtooth', volume: 0.15 },
    { freq: 700, duration: 150, type: 'sawtooth', volume: 0.15 }
  ]
}

/**
 * BGM 旋律定义
 * - home：C-G-Am-F 进行，轻快（C4-E4-G4-A4-G4-E4-C4-D4）
 * - game：Am-F-C-G 进行，紧张
 * - level：Dm-Am-Bb-F 进行，神秘
 */
const BGM_MELODIES: Record<BgmName, NoteSequence> = {
  // 主菜单：C-G-Am-F，轻快明亮
  home: [
    // C 和弦
    { freq: 523, duration: 500, type: 'sine', volume: 0.15 },
    { freq: 659, duration: 500, type: 'sine', volume: 0.15 },
    { freq: 784, duration: 500, type: 'sine', volume: 0.15 },
    // G 和弦
    { freq: 784, duration: 500, type: 'sine', volume: 0.15 },
    { freq: 988, duration: 500, type: 'sine', volume: 0.15 },
    // Am 和弦
    { freq: 440, duration: 500, type: 'sine', volume: 0.15 },
    { freq: 659, duration: 500, type: 'sine', volume: 0.15 },
    // F 和弦
    { freq: 349, duration: 500, type: 'sine', volume: 0.15 },
    { freq: 523, duration: 500, type: 'sine', volume: 0.15 }
  ],
  // 游戏中：Am-F-C-G，稍紧张
  game: [
    { freq: 440, duration: 400, type: 'triangle', volume: 0.12 },
    { freq: 523, duration: 400, type: 'triangle', volume: 0.12 },
    { freq: 349, duration: 400, type: 'triangle', volume: 0.12 },
    { freq: 440, duration: 400, type: 'triangle', volume: 0.12 },
    { freq: 523, duration: 400, type: 'triangle', volume: 0.12 },
    { freq: 659, duration: 400, type: 'triangle', volume: 0.12 },
    { freq: 392, duration: 400, type: 'triangle', volume: 0.12 },
    { freq: 494, duration: 400, type: 'triangle', volume: 0.12 }
  ],
  // 闯关：Dm-Am-Bb-F，神秘
  level: [
    { freq: 294, duration: 600, type: 'triangle', volume: 0.12 },
    { freq: 440, duration: 600, type: 'triangle', volume: 0.12 },
    { freq: 220, duration: 600, type: 'triangle', volume: 0.12 },
    { freq: 330, duration: 600, type: 'triangle', volume: 0.12 },
    { freq: 233, duration: 600, type: 'triangle', volume: 0.12 },
    { freq: 349, duration: 600, type: 'triangle', volume: 0.12 },
    { freq: 175, duration: 600, type: 'triangle', volume: 0.12 },
    { freq: 262, duration: 600, type: 'triangle', volume: 0.12 }
  ]
}

export const toneGenerator = ToneGenerator.getInstance()
export default toneGenerator
