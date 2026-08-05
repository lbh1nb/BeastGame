import { defineStore } from 'pinia'
import { ref } from 'vue'
import { NEW_PROP_PRICES } from '@game/props.config'

/** 商店可购买的新道具 key */
type ShopProp = 'chisel' | 'clearProp' | 'pair' | 'slot'

/**
 * 库存 Store（金币 + 商店新道具）
 * - coin: 金币余额
 * - props: 4 种新道具数量（chisel/clearProp/pair/slot）
 * - load(): 从持久层加载全部库存
 * - buy(prop): 校验金币并扣金币加道具，成功返回 true
 * - spendCoin(n): 扣除 n 金币（校验非负）
 */
export const useInventoryStore = defineStore('inventory', () => {
  /** 金币余额 */
  const coin = ref(0)
  /** 4 种新道具数量 */
  const props = ref<Record<ShopProp, number>>({
    chisel: 0,
    clearProp: 0,
    pair: 0,
    slot: 0
  })

  /** 从持久层加载全部库存 */
  async function load(): Promise<void> {
    try {
      const all = await window.gameAPI.inventory.getAll()
      coin.value = all.coin ?? 0
      props.value = {
        chisel: all.chisel ?? 0,
        clearProp: all.clearProp ?? 0,
        pair: all.pair ?? 0,
        slot: all.slot ?? 0
      }
    } catch (e) {
      console.warn('[inventory] 加载库存失败', e)
      coin.value = 0
    }
  }

  /**
   * 购买一个道具
   * - 金币不足返回 false
   * - 成功：扣金币、加道具、更新本地 state，返回 true
   */
  async function buy(prop: ShopProp): Promise<boolean> {
    const price = NEW_PROP_PRICES[prop]
    if (coin.value < price) return false
    try {
      await window.gameAPI.inventory.add('coin', -price)
      await window.gameAPI.inventory.add(prop, 1)
      coin.value -= price
      props.value = { ...props.value, [prop]: props.value[prop] + 1 }
      return true
    } catch (e) {
      console.warn('[inventory] 购买失败', e)
      return false
    }
  }

  /** 扣除 n 金币（校验非负，不足则不扣并返回 false） */
  async function spendCoin(n: number): Promise<boolean> {
    if (n <= 0 || coin.value < n) return false
    try {
      await window.gameAPI.inventory.add('coin', -n)
      coin.value -= n
      return true
    } catch (e) {
      console.warn('[inventory] 扣除金币失败', e)
      return false
    }
  }

  return {
    coin,
    props,
    load,
    buy,
    spendCoin
  }
})