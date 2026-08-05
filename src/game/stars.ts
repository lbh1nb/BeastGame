/**
 * 兽了个兽 - 多维星级判定
 * 纯逻辑层，不依赖 vue / electron
 *
 * 星级由分数、剩余时间、道具使用、剩余点击四个维度加权综合得出，
 * 仅做数值计算，是否通关由调用方保证。
 */
/** 分数归一化基准：满分 = 总牌数 * 每牌基准 12 分 */
export const SCORE_PER_TILE = 12
/** 点击归一化基准：满值为 20 次剩余点击，-1 视为无机制 */
export const CLICK_FULL = 20
/** 道具归一化基准：使用 >= 3 次即贡献趋近 0 */
export const PROPS_SATURATION = 3

/** 星级映射阈值：>= 0.85 三星，>= 0.6 两星，>= 0.3 一星 */
export const STAR_3_THRESHOLD = 0.85
export const STAR_2_THRESHOLD = 0.6
export const STAR_1_THRESHOLD = 0.3

/**
 * 分数主导乘数式常量：
 * starScore = fScore * (BASE + WEIGHT_TIME*fTime + WEIGHT_PROPS*fProps + WEIGHT_CLICK*fClick)
 * 因 BASE + WEIGHT_TIME + WEIGHT_PROPS + WEIGHT_CLICK = 1.0，故 starScore ≤ fScore 恒成立，
 * 即分数不满时最高只能 2 星（分数完全主导星级上限）。
 */
export const BASE = 0.4
export const WEIGHT_TIME = 0.2
export const WEIGHT_PROPS = 0.2
export const WEIGHT_CLICK = 0.2

/** 星级判定输入 */
export interface StarInput {
  /** 本局分数 */
  score: number
  /** 剩余时间（秒），无 timeLimit 时为该关基准 */
  timeLeft: number
  /** 使用道具总次数 */
  propsUsed: number
  /** 剩余点击数，-1 视为无机制满值 */
  clickLeft: number
  /** 关卡限时（秒） */
  timeLimit: number
  /** 总牌数 */
  tileCount: number
  /** 卡槽上限 */
  maxSlots: number
}

/**
 * 计算本局星级（0 ~ 3）
 * 归一化规则：
 *  - fScore = min(1, score / (tileCount * 12))
 *  - fTime  = min(1, timeLeft / timeLimit)
 *  - fProps = max(0, 1 - propsUsed / 3)
 *  - fClick = clickLeft < 0 ? 1 : min(1, clickLeft / 20)
 * 分数主导乘数式：
 *  - starScore = fScore * (BASE + WEIGHT_TIME*fTime + WEIGHT_PROPS*fProps + WEIGHT_CLICK*fClick)
 * 映射：>= 0.85 → 3星，>= 0.6 → 2星，>= 0.3 → 1星，否则 0。
 * 输入明显不可能（tileCount <= 0 或 timeLimit <= 0）时返回 0。
 */
export function calcStars(input: StarInput): number {
  const { score, timeLeft, propsUsed, clickLeft, timeLimit, tileCount } = input

  if (tileCount <= 0 || timeLimit <= 0) return 0

  const fScore = Math.min(1, Math.max(0, score / (tileCount * SCORE_PER_TILE)))
  const fTime = Math.min(1, timeLeft / timeLimit)
  const fProps = Math.min(1, Math.max(0, 1 - propsUsed / PROPS_SATURATION))
  const fClick = clickLeft < 0 ? 1 : Math.min(1, clickLeft / CLICK_FULL)

  const starScore =
    fScore *
    (BASE + WEIGHT_TIME * fTime + WEIGHT_PROPS * fProps + WEIGHT_CLICK * fClick)

  if (starScore >= STAR_3_THRESHOLD) return 3
  if (starScore >= STAR_2_THRESHOLD) return 2
  if (starScore >= STAR_1_THRESHOLD) return 1
  return 0
}