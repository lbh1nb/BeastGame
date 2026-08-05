import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 单件收藏品（来自 collection:getAll 返回的数据库行） */
export interface CollectionItem {
  id: string
  rarity: string
  count: number
  obtained: number
}

/**
 * 收藏册 Store
 * - items: 全部收藏品记录（[{ id, rarity, count, obtained }, ...]）
 * - count: 已收集数量（obtained >= 1）
 * - load(): 并行加载 items 与 count
 */
export const useCollectionStore = defineStore('collection', () => {
  /** 全部收藏品记录 */
  const items = ref<CollectionItem[]>([])
  /** 已收集数量 */
  const count = ref(0)

  /** 从持久层加载收藏品数据 */
  async function load(): Promise<void> {
    try {
      const [all, cnt] = await Promise.all([
        window.gameAPI.collection.getAll(),
        window.gameAPI.collection.count()
      ])
      items.value = (all as CollectionItem[]) ?? []
      count.value = cnt ?? 0
    } catch (e) {
      console.warn('[collection] 加载收藏册失败', e)
      items.value = []
      count.value = 0
    }
  }

  return {
    items,
    count,
    load
  }
})