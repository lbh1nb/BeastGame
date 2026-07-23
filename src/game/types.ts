/**
 * 兽了个兽 - 游戏核心类型定义
 * 纯逻辑层，不依赖 vue / electron
 */

/**
 * 20 种动物类型（v4：扁平方块像素图版）
 * 主色均匀分布色环，每种动物唯一模型无变种
 * 按章节分组：
 *  第1章 家畜：sheep / pig / chicken / dog
 *  第2章 野生：tiger / lion / bear / fox
 *  第3章 森林：frog / crocodile / elephant / panda
 *  第4章 鸟类：flamingo / peacock / penguin / parrot
 *  第5章 海洋：fish / whale / octopus / jellyfish
 */
export type AnimalType =
  | 'sheep' | 'pig' | 'chicken' | 'dog'        // 第1章 家畜
  | 'tiger' | 'lion' | 'bear' | 'fox'          // 第2章 野生
  | 'frog' | 'crocodile' | 'elephant' | 'panda' // 第3章 森林
  | 'flamingo' | 'peacock' | 'penguin' | 'parrot' // 第4章 鸟类
  | 'fish' | 'whale' | 'octopus' | 'jellyfish' // 第5章 海洋

/** 游戏模式：3消 / 4消 / 闯关 */
export type GameMode = 'classic3' | 'classic4' | 'level'

/** 游戏状态 */
export type GameStatus = 'playing' | 'won' | 'lost'

/** 道具类型：撤回 / 洗牌 / 提示 */
export type PropType = 'undo' | 'shuffle' | 'hint'

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
}
