import type { PropType } from './types'

/** 新道具商店价格（金币） */
export const NEW_PROP_PRICES: Record<'chisel' | 'clearProp' | 'pair' | 'slot', number> = {
  chisel: 120,
  clearProp: 100,
  pair: 180,
  slot: 150
}

/** 全部道具的中文名 */
export const PROP_NAMES: Record<PropType, string> = {
  undo: '撤回',
  shuffle: '洗牌',
  hint: '提示',
  chisel: '拆牌锤',
  clearProp: '槽位清空',
  pair: '一键配对',
  slot: '临时扩容'
}