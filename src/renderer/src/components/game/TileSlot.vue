<template>
  <div class="slot-area">
    <TransitionGroup name="tile" tag="div" class="slot-row">
      <div
        v-for="(cell, i) in displayCells"
        :key="cell.key"
        class="slot-cell"
        :class="{ 'slot-cell--match': isMatching(cell) }"
      >
        <div v-if="!cell.tile" class="slot-empty" />
        <Tile
          v-else
          :tile="cell.tile"
          class="slot-tile"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
/**
 * 槽位区
 * - 横向排列 maxSlots 个槽位
 * - 空 slot 显示虚线边框
 * - 占用 slot 显示 Tile（不可点击）
 * - 同种 animal 自动聚拢：按 animal 排序展示，便于观察
 * - 即将消除（lastMatchedIds）的 slot 高亮闪烁
 */
import { computed } from 'vue'
import type { Slot } from '@game/types'
import Tile from './Tile.vue'

interface Props {
  slots: Slot[]
  maxSlots: number
  lastMatchedIds: number[]
}

const props = defineProps<Props>()

/** 单元格（含空槽）用于渲染，已按 animal 聚拢 */
interface Cell {
  key: string
  tile: Slot['tile']
}

const displayCells = computed<Cell[]>(() => {
  // 占用的 slot，按 animal 排序聚拢
  const occupied = props.slots
    .filter((s) => s.tile)
    .sort((a, b) => (a.tile!.animal < b.tile!.animal ? -1 : a.tile!.animal > b.tile!.animal ? 1 : 0))

  const cells: Cell[] = occupied.map((s, i) => ({
    key: `occ-${s.tile!.id}`,
    tile: s.tile
  }))

  // 补足空槽位
  const emptyCount = Math.max(0, props.maxSlots - cells.length)
  for (let i = 0; i < emptyCount; i++) {
    cells.push({ key: `empty-${i}`, tile: null })
  }
  return cells
})

function isMatching(cell: Cell): boolean {
  return !!cell.tile && props.lastMatchedIds.includes(cell.tile.id)
}
</script>

<style scoped>
.slot-area {
  width: 100%;
  padding: 10px 12px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.slot-row {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.slot-cell {
  width: 48px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-empty {
  width: 100%;
  height: 100%;
  border: 2px dashed var(--color-border);
  border-radius: 10px;
  background: #fff8ec;
}

/* 槽位中的 tile 不可点击 */
.slot-tile {
  pointer-events: none;
}

/* 即将消除：闪烁高亮 */
.slot-cell--match {
  animation: slot-match 0.3s ease-in-out;
}

@keyframes slot-match {
  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 var(--color-warning));
  }
  50% {
    transform: scale(1.15);
    filter: drop-shadow(0 0 8px var(--color-warning));
  }
}
</style>
