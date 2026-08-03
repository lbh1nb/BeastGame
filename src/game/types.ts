/**
 * 兽了个兽 - 游戏核心类型定义
 * 纯逻辑层，不依赖 vue / electron
 */

/**
 * 48 种动物类型（v9：图片素材版）
 * 使用 shoulege-shou-animals-assets 素材库中的图片（static 静态 / active 悬停动态）
 * 按章节分组，每章 8 种：
 *  第1章 家畜：sheep / pig / chicken / cow / horse / goat / duck / rooster
 *  第2章 野兽：tiger / lion / bear / wolf / fox / zebra / camel / giraffe
 *  第3章 森林：monkey / panda / deer / moose / kangaroo / koala / squirrel / raccoon
 *  第4章 小动物：rabbit / cat / dog / otter / badger / beaver / hedgehog / skunk
 *  第5章 海洋：fish / whale / dolphin / octopus / jellyfish / turtle / crab / seahorse
 *  第6章 综合：hippo / rhino / elephant / frog / seal / owl / goose / penguin
 */
export type AnimalType =
  // 第1章 家畜
  | 'sheep' | 'pig' | 'chicken' | 'cow' | 'horse' | 'goat' | 'duck' | 'rooster'
  // 第2章 野兽
  | 'tiger' | 'lion' | 'bear' | 'wolf' | 'fox' | 'zebra' | 'camel' | 'giraffe'
  // 第3章 森林
  | 'monkey' | 'panda' | 'deer' | 'moose' | 'kangaroo' | 'koala' | 'squirrel' | 'raccoon'
  // 第4章 小动物
  | 'rabbit' | 'cat' | 'dog' | 'otter' | 'badger' | 'beaver' | 'hedgehog' | 'skunk'
  // 第5章 海洋
  | 'fish' | 'whale' | 'dolphin' | 'octopus' | 'jellyfish' | 'turtle' | 'crab' | 'seahorse'
  // 第6章 综合
  | 'hippo' | 'rhino' | 'elephant' | 'frog' | 'seal' | 'owl' | 'goose' | 'penguin'

/** 游戏模式：3消 / 4消 / 闯关 */
export type GameMode = 'classic3' | 'classic4' | 'level'

/** 游戏状态 */
export type GameStatus = 'playing' | 'won' | 'lost'

/** 道具类型：撤回 / 洗牌 / 提示 */
export type PropType = 'undo' | 'shuffle' | 'hint'

/** 章节机制类型 */
export type MechanicType = 'moody' | 'vine' | 'sleepy' | 'hidden' | 'bubble'

/** 机制变更事件类型（通知视图层播动画） */
export type MechanicEvent =
  /** moody/sleepy 通过消除而解除（乌云散/醒来） */
  | { kind: 'resolved'; tileId: number; type: MechanicType }
  /** vine/bubble 被点击破除（藤断裂/气泡破） */
  | { kind: 'broken'; tileId: number; type: MechanicType }
  /** hidden 翻开（问号消失露出动物） */
  | { kind: 'revealed'; tileId: number }

/** 牌面机制状态 */
export interface MechanicState {
  type: MechanicType
  /** 闹脾气/贪睡：剩余等待次数(2=需要2次消除才能解除)；藤蔓/气泡：1=需要点击解除 */
  stuck: number
  /** 已消除计数（闹脾气/贪睡机制用） */
  matchedCount: number
}

/** 图案（麻将牌式的方块） */
export interface Tile {
  id: number
  animal: AnimalType
  region: number            // 所属区域索引（0=第一个区域），多区域布局用
  layer: number             // 层级，0=最底层
  x: number                 // 网格x坐标（区域内坐标）
  y: number                 // 网格y坐标（区域内坐标）
  z: number                 // 同层内的z序
  coveredBy: number[]       // 被哪些 tile id 覆盖（生成时确定，不再变化）
  removed: boolean          // 是否已消除
  inSlot: boolean           // 是否在槽位中
  slotIndex: number         // 槽位索引，-1=不在槽位
  /** 章节机制状态（闯关模式专用），无机制时为 undefined */
  mechanicState?: MechanicState
}

/** 槽位（底部最多 7/8 个，满了即输） */
export interface Slot {
  index: number
  tile: Tile | null
}

/** 历史记录条目，用于撤回 */
export interface HistoryEntry {
  action: 'pick' | 'match' | 'undo' | 'shuffle'
  tileIds: number[]
  prevSlots: (number | null)[]   // 操作前的槽位 tileId 快照
  prevScore: number
  prevCombo: number
}

/** 道具数量 */
export interface GameProps {
  undo: number
  shuffle: number
  hint: number
}

/** 单个区域的布局配置 */
export interface RegionConfig {
  rows: number            // 该区域每层行数
  cols: number            // 该区域每层列数
  layers: number          // 该区域层数
  /** 该区域占总牌数的比例（所有区域比例之和应=1），不填则均分 */
  ratio?: number
}

/** 关卡配置 */
export interface LevelConfig {
  id: number
  chapter: number
  tiles: number           // 总图案数（必须为 matchCount 的倍数）
  layers: number          // 层数（兼容旧逻辑，多区域时取最大层数）
  rows: number            // 每层行数（兼容旧逻辑，多区域时取第一个区域的）
  cols: number            // 每层列数（兼容旧逻辑，多区域时取第一个区域的）
  isBoss: boolean
  matchCount: number      // 3 或 4
  maxSlots: number       // 槽位数 7 或 8
  animals: AnimalType[]   // 本章可用动物
  timeLimit?: number      // Boss关可能有时间限制（秒）
  /** 多区域布局配置，不填时按旧逻辑单区域生成 */
  regions?: RegionConfig[]
  /** 章节机制配置 */
  mechanic?: {
    type: MechanicType
    /** 受机制影响的牌比例 (0~1) */
    ratio: number
    /** 点击限制的初始点击数（vine/bubble 用），消除返还数 */
    clickLimit?: number
    /** 每次消除返还点击数 */
    clickRefund?: number
  }
}

/** 游戏运行时状态 */
export interface GameState {
  mode: GameMode
  levelId?: number
  config: LevelConfig
  tiles: Tile[]
  slots: Slot[]
  maxSlots: number
  matchCount: number
  combo: number
  maxCombo: number
  score: number
  matchCount_total: number    // 累计消除组数
  tilesRemoved: number        // 累计消除图案数
  startTime: number
  endTime?: number
  props: GameProps
  propsUsed: { undo: number; shuffle: number; hint: number }
  history: HistoryEntry[]
  status: GameStatus
  hintTileIds: number[]       // 提示高亮的 tile id
  lastMatchedTileIds: number[] // 最近消除的 tile id（用于动画）
  /** 点击限制计数器（vine/bubble 机制用，-1 = 无限制） */
  clickRemaining: number
  /** 最近一次消除解析的机制列表（供音效使用） */
  lastResolvedMechanics: string[]
  /** 最近一次操作产生的机制变更事件（供视图层播动画），每次 pickTile 后重置 */
  lastMechanicEvents: MechanicEvent[]
}
