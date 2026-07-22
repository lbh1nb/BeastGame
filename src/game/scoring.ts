/**
 * 兽了个兽 - 评分辅助
 * 纯逻辑层，不依赖 vue / electron
 */
import type { GameProps } from './types'

/** 每个图案的基础分 */
export const BASE_SCORE_PER_TILE = 10

/** 每次连击额外加的分（乘以 combo） */
export const COMBO_BONUS_PER_HIT = 5

/** 综合奖励阈值：总分 >= 800 奖励 1撤回 + 1洗牌 */
export const REWARD_TIER_1 = 800
/** 综合奖励阈值：总分 >= 1500 再加 1提示 */
export const REWARD_TIER_2 = 1500
/** 综合奖励阈值：总分 >= 2500 再加 1撤回 */
export const REWARD_TIER_3 = 2500

/**
 * 计算单次消除的得分
 * 每次消除得分 = matchCount * BASE_SCORE_PER_TILE + combo * COMBO_BONUS_PER_HIT
 * 注意：传入的 combo 是本次消除时的连击数（0 表示第一组无连击加成）
 */
export function calcMatchScore(matchCount: number, combo: number): number {
  return matchCount * BASE_SCORE_PER_TILE + combo * COMBO_BONUS_PER_HIT
}

/**
 * 根据 totalScore 返回额外道具奖励
 * 阈值规则：
 *  - >= 800  奖励 1撤回 + 1洗牌
 *  - >= 1500 再加 1提示
 *  - >= 2500 再加 1撤回
 */
export function calcPropReward(totalScore: number): Partial<GameProps> {
  const reward: Partial<GameProps> = {}
  if (totalScore >= REWARD_TIER_1) {
    reward.undo = 1
    reward.shuffle = 1
  }
  if (totalScore >= REWARD_TIER_2) {
    // 累加提示
    reward.hint = (reward.hint ?? 0) + 1
  }
  if (totalScore >= REWARD_TIER_3) {
    // 再加 1撤回
    reward.undo = (reward.undo ?? 0) + 1
  }
  return reward
}
