/**
 * Web Audio API 程序化音效生成器（v3）
 *
 * 不依赖任何外部音频文件，用 OscillatorNode + GainNode 实时合成音效。
 *
 * v3 改进：
 *  - 20种动物音效按真实特征模拟（频率+波形+包络+颤音）
 *  - 新增 BGM 循环生成（C-G-Am-F 进行）
 *  - 新增按钮 hover/click 音效
 *  - 支持噪声生成（用于老虎/狮子/鳄鱼/章鱼等）
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
    const seq = ANIMAL_SOUND_SEQUENCES[animal]
    if (!seq) return
    // 特殊处理：带噪声的动物
    if (animal === 'tiger') {
      this.playSequence(seq)
      this.playNoiseSound(500, 400, 0.08)
      return
    }
    if (animal === 'lion') {
      this.playSequence(seq)
      this.playNoiseSound(700, 300, 0.1)
      return
    }
    if (animal === 'crocodile') {
      this.playSequence(seq)
      this.playNoiseSound(400, 600, 0.06)
      return
    }
    if (animal === 'fish') {
      this.playSequence(seq)
      this.playNoiseSound(200, 2000, 0.05)
      return
    }
    if (animal === 'whale') {
      this.playSequence(seq)
      this.playNoiseSound(700, 300, 0.04)
      return
    }
    if (animal === 'octopus') {
      this.playSequence(seq)
      this.playNoiseSound(300, 1500, 0.05)
      return
    }
    this.playSequence(seq)
  }

  /**
   * 播放统一安静动物音效（温和模式）
   * 所有动物点击时播放同一个温暖木琴音色
   */
  playGentleAnimalSound(): void {
    this.playSequence(GENTLE_ANIMAL_SOUND, 0.8)
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
    { freq: 880, duration: 50, type: 'sine', volume: 0.18 },
    { freq: 1100, duration: 50, type: 'sine', volume: 0.18 },
    { freq: 1320, duration: 60, type: 'sine', volume: 0.2 }
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
  // 连击夸赞（v6：每级音符数量/波形/音高递增，确保听觉差异明显）
  // 3连击：2音 正弦波 C5-E5，轻柔
  combo_good: [
    { freq: 523, duration: 70, type: 'sine', volume: 0.16 },
    { freq: 659, duration: 90, type: 'sine', volume: 0.16 }
  ],
  // 5连击：3音 正弦波 C5-E5-G5，愉悦上扬
  combo_nice: [
    { freq: 523, duration: 60, type: 'sine', volume: 0.17 },
    { freq: 659, duration: 60, type: 'sine', volume: 0.17 },
    { freq: 784, duration: 90, type: 'sine', volume: 0.18 }
  ],
  // 7连击：3音 三角波 E5-G5-C6，有力度
  combo_great: [
    { freq: 659, duration: 55, type: 'triangle', volume: 0.18 },
    { freq: 784, duration: 55, type: 'triangle', volume: 0.18 },
    { freq: 1047, duration: 90, type: 'triangle', volume: 0.2 }
  ],
  // 10连击：4音 三角波 C5-E5-G5-C6，琶音上行
  combo_amazing: [
    { freq: 523, duration: 50, type: 'triangle', volume: 0.18 },
    { freq: 659, duration: 50, type: 'triangle', volume: 0.18 },
    { freq: 784, duration: 50, type: 'triangle', volume: 0.18 },
    { freq: 1047, duration: 90, type: 'triangle', volume: 0.22 }
  ],
  // 15连击：4音 方波 G5-C6-E6-G6，明亮高亢
  combo_unbelievable: [
    { freq: 784, duration: 45, type: 'square', volume: 0.19 },
    { freq: 1047, duration: 45, type: 'square', volume: 0.19 },
    { freq: 1319, duration: 45, type: 'square', volume: 0.19 },
    { freq: 1568, duration: 90, type: 'square', volume: 0.22 }
  ],
  // 20连击：5音 方波 C5-E5-G5-C6-E6，史诗级全音阶
  combo_godlike: [
    { freq: 523, duration: 40, type: 'square', volume: 0.2 },
    { freq: 659, duration: 40, type: 'square', volume: 0.2 },
    { freq: 784, duration: 40, type: 'square', volume: 0.2 },
    { freq: 1047, duration: 40, type: 'square', volume: 0.2 },
    { freq: 1319, duration: 100, type: 'square', volume: 0.25 }
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
 * 统一安静音效（动物音效模式为 'gentle' 时使用）
 * 设计：风铃音色，多音符正弦波交替，清脆空灵
 * 所有动物统一使用，柔和安静又不单调
 */
const GENTLE_ANIMAL_SOUND: NoteSequence = [
  { freq: 880, duration: 80, type: 'sine', volume: 0.1 },
  { freq: 1100, duration: 80, type: 'sine', volume: 0.1 },
  { freq: 1320, duration: 80, type: 'sine', volume: 0.1 },
  { freq: 1100, duration: 100, type: 'sine', volume: 0.08 }
]

/**
 * 20种动物特征音效（v4：贴近真实叫声）
 * - 绵羊：低频颤音咩叫（Baa，220→180Hz 滑降）
 * - 小猪：中频呼噜哼哼（Oink，300→250Hz 下行）
 * - 小鸡：高频断续叽叽（Peep，1200-1400Hz 三短音）
 * - 小狗：中频短促汪（Woof，500→400Hz 下行）
 * - 老虎：低频长吼+噪声（Roar，咆哮感）
 * - 狮子：超低频长吼+噪声（Roar，更深沉）
 * - 棕熊：中频低沉嗷（Growl，250→200Hz）
 * - 狐狸：真实狐狸叫（Yip-yip，高频短促尖叫，多音符交替）
 * - 青蛙：中频断续呱呱（Ribbit，500→400Hz 颤音）
 * - 鳄鱼：低频嘶嘶+噪声（Hiss，嘶嘶声）
 * - 大象：超低频长鸣+颤音（Trumpet，80→60Hz）
 * - 熊猫：真实熊猫叫（Bleat，类似羊叫，400→300Hz 颤音）
 * - 火烈鸟：真实鹅式鸣叫（Honk，中频响亮，700→900Hz）
 * - 孔雀：真实孔雀叫（May-aw，像猫叫，700→900→700Hz 响亮）
 * - 企鹅：真实企鹅叫（Honk-bray，驴叫式，中频有节奏群鸣）
 * - 鹦鹉：真实鹦鹉叫（Squawk，高频刺耳多变，锯齿波）
 * - 小鱼：水泡高频+噪声（Bubble，空灵高频）
 * - 鲸鱼：低频悠长嗡+回声（Song，180→220Hz 慢升）
 * - 章鱼：水声咕噜+噪声（Gurgle，400→300Hz 颤音）
 * - 水母：空灵高频长尾（Ethereal，800→1000Hz）
 */
const ANIMAL_SOUND_SEQUENCES: Record<AnimalType, NoteSequence> = {
  // 绵羊：低频颤音，220→180Hz 滑降，5Hz 颤音
  sheep: [
    { freq: 220, duration: 400, type: 'sawtooth', volume: 0.15, slideTo: 180, vibrato: 5, vibratoDepth: 8 }
  ],
  // 小猪：300→250Hz 下行呼噜，锯齿波
  pig: [
    { freq: 300, duration: 120, type: 'sawtooth', volume: 0.15, slideTo: 250 },
    { freq: 250, duration: 150, type: 'sawtooth', volume: 0.15, vibrato: 6, vibratoDepth: 5 }
  ],
  // 小鸡：1200-1400Hz 三短音
  chicken: [
    { freq: 1200, duration: 50, type: 'square', volume: 0.12 },
    { freq: 1400, duration: 50, type: 'square', volume: 0.12 },
    { freq: 1200, duration: 80, type: 'square', volume: 0.12 }
  ],
  // 小狗：500→400Hz 下行，方波
  dog: [
    { freq: 500, duration: 100, type: 'square', volume: 0.15, slideTo: 400 },
    { freq: 400, duration: 150, type: 'square', volume: 0.15 }
  ],
  // 老虎：150→120Hz 长音，锯齿波（+噪声由 playAnimalSound 添加）
  tiger: [
    { freq: 150, duration: 500, type: 'sawtooth', volume: 0.2, slideTo: 120, vibrato: 4, vibratoDepth: 5 }
  ],
  // 狮子：110→90Hz 超低频长吼，锯齿波（+噪声由 playAnimalSound 添加）
  lion: [
    { freq: 110, duration: 600, type: 'sawtooth', volume: 0.22, slideTo: 90, vibrato: 3, vibratoDepth: 4 }
  ],
  // 棕熊：250→200Hz 下行，三角波
  bear: [
    { freq: 250, duration: 200, type: 'triangle', volume: 0.18, slideTo: 200 },
    { freq: 200, duration: 250, type: 'triangle', volume: 0.18 }
  ],
  // 狐狸：真实狐狸叫，高频短促尖叫 yip-yip-yip，800→1500Hz 交替，方波
  fox: [
    { freq: 900, duration: 60, type: 'square', volume: 0.14 },
    { freq: 1200, duration: 60, type: 'square', volume: 0.14 },
    { freq: 1050, duration: 70, type: 'square', volume: 0.14 },
    { freq: 1400, duration: 70, type: 'square', volume: 0.14 },
    { freq: 1100, duration: 80, type: 'square', volume: 0.13, slideTo: 900 }
  ],
  // 青蛙：500→400Hz 断续呱呱，正弦+颤音
  frog: [
    { freq: 500, duration: 80, type: 'sine', volume: 0.15, slideTo: 400, vibrato: 10, vibratoDepth: 12 },
    { freq: 400, duration: 80, type: 'sine', volume: 0.15, slideTo: 500, vibrato: 10, vibratoDepth: 12 },
    { freq: 500, duration: 100, type: 'sine', volume: 0.15, slideTo: 400 }
  ],
  // 鳄鱼：150→120Hz 低沉嘶嘶，锯齿波（+噪声由 playAnimalSound 添加）
  crocodile: [
    { freq: 150, duration: 300, type: 'sawtooth', volume: 0.18, slideTo: 120, vibrato: 5, vibratoDepth: 6 }
  ],
  // 大象：80→60Hz 超低频长鸣，锯齿+颤音
  elephant: [
    { freq: 80, duration: 800, type: 'sawtooth', volume: 0.25, slideTo: 60, vibrato: 2, vibratoDepth: 3 }
  ],
  // 熊猫：真实熊猫叫 Bleat，类似羊叫，400→300Hz 颤音三角波，温柔但有特点
  panda: [
    { freq: 400, duration: 180, type: 'triangle', volume: 0.16, slideTo: 320, vibrato: 8, vibratoDepth: 10 },
    { freq: 320, duration: 220, type: 'triangle', volume: 0.15, vibrato: 6, vibratoDepth: 8 }
  ],
  // 火烈鸟：真实鹅式鸣叫 Honk，中频响亮，700→800→900Hz 方波，有力度
  flamingo: [
    { freq: 700, duration: 100, type: 'square', volume: 0.14 },
    { freq: 800, duration: 100, type: 'square', volume: 0.14 },
    { freq: 900, duration: 150, type: 'square', volume: 0.14, slideTo: 750, vibrato: 4, vibratoDepth: 5 }
  ],
  // 孔雀：真实孔雀叫 May-aw，像猫叫，响亮有力，700→1000→700Hz 方波+颤音
  peacock: [
    { freq: 700, duration: 100, type: 'square', volume: 0.16, slideTo: 1000, vibrato: 4, vibratoDepth: 6 },
    { freq: 1000, duration: 120, type: 'square', volume: 0.16, slideTo: 700, vibrato: 4, vibratoDepth: 6 },
    { freq: 700, duration: 150, type: 'square', volume: 0.15, vibrato: 3, vibratoDepth: 5 }
  ],
  // 企鹅：真实企鹅叫 Honk-bray，类似驴叫，中频有节奏群鸣，600→800Hz 颤音
  penguin: [
    { freq: 650, duration: 100, type: 'square', volume: 0.15, vibrato: 6, vibratoDepth: 8 },
    { freq: 750, duration: 100, type: 'square', volume: 0.15, vibrato: 6, vibratoDepth: 8 },
    { freq: 700, duration: 120, type: 'square', volume: 0.15, slideTo: 600, vibrato: 5, vibratoDepth: 7 }
  ],
  // 鹦鹉：真实鹦鹉叫 Squawk，高频刺耳多变，锯齿波，1200→1600→1000Hz 交替
  parrot: [
    { freq: 1200, duration: 50, type: 'sawtooth', volume: 0.13, slideTo: 1600 },
    { freq: 1100, duration: 55, type: 'sawtooth', volume: 0.13, slideTo: 1400 },
    { freq: 1400, duration: 55, type: 'sawtooth', volume: 0.13, slideTo: 1000 },
    { freq: 1000, duration: 70, type: 'sawtooth', volume: 0.13, vibrato: 8, vibratoDepth: 6 }
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
  // 章鱼：400→300Hz 水声咕噜，正弦+颤音（+噪声由 playAnimalSound 添加）
  octopus: [
    { freq: 400, duration: 150, type: 'sine', volume: 0.12, slideTo: 300, vibrato: 6, vibratoDepth: 10 },
    { freq: 300, duration: 200, type: 'sine', volume: 0.12, vibrato: 6, vibratoDepth: 10 }
  ],
  // 水母：800→1000Hz 空灵高频，正弦+长尾
  jellyfish: [
    { freq: 800, duration: 300, type: 'sine', volume: 0.1, slideTo: 1000, vibrato: 3, vibratoDepth: 8 },
    { freq: 1000, duration: 400, type: 'sine', volume: 0.1, vibrato: 3, vibratoDepth: 8 }
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
