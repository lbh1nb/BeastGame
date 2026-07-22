<template>
  <div class="stack-wrapper">
    <!-- 全屏单大堆 -->
    <div class="stack-area" :style="areaStyle">
      <TransitionGroup name="tile">
        <TileComp
          v-for="t in renderTiles"
          :key="t.id"
          :tile="t"
          :is-hint="hintSet.has(t.id) && !coveredSet.has(t.id)"
          :is-covered="coveredSet.has(t.id)"
          :style="posStyle(t)"
          class="stack-tile"
          @pick="onPick"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 牌堆区（全屏单大堆版）
 * - 所有 tile 在一个大网格中堆叠（8列×10行 + 8-12层）
 * - 按 layer 分层、同层按 z 排序
 * - 被 coveredBy 中仍未消除的 tile 覆盖时，半透明且不可点击
 * - 区域可滚动（牌多时垂直滚动）
 */
import { computed } from 'vue'
import type { Tile } from '@game/types'
import TileComp from './Tile.vue'

interface Props {
  tiles: Tile[]
  hintTileIds: number[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'pick', tileId: number): void
}>()

/** 单元格尺寸与层偏移（适配 64×68 牌面） */
const CELL_W = 70
const CELL_H = 74
const LAYER_OFFSET_X = 10
const LAYER_OFFSET_Y = 10
const TILE_W = 64
const TILE_H = 68

/** 待渲染的 tile：未消除 & 不在槽位，按 layer→z 排序 */
const renderTiles = computed(() => {
  return props.tiles
    .filter((t) => !t.removed && !t.inSlot)
    .sort((a, b) => a.layer - b.layer || a.z - b.z)
})

/** 当前仍在牌堆上的 tile id 集合（用于判断覆盖关系） */
const stackIds = computed(() => {
  const set = new Set<number>()
  for (const t of props.tiles) {
    if (!t.removed && !t.inSlot) set.add(t.id)
  }
  return set
})

/** 被覆盖的 tile id 集合 */
const coveredSet = computed(() => {
  const set = new Set<number>()
  for (const t of renderTiles.value) {
    if (t.coveredBy.some((id) => stackIds.value.has(id))) {
      set.add(t.id)
    }
  }
  return set
})

const hintSet = computed(() => new Set(props.hintTileIds))

/** 计算整个牌堆区域的尺寸（含所有层偏移） */
const areaStyle = computed(() => {
  let maxCol = 0
  let maxRow = 0
  let maxLayer = 0
  for (const t of renderTiles.value) {
    if (t.x > maxCol) maxCol = t.x
    if (t.y > maxRow) maxRow = t.y
    if (t.layer > maxLayer) maxLayer = t.layer
  }
  const width = (maxCol + 1) * CELL_W + maxLayer * LAYER_OFFSET_X + TILE_W
  const height = (maxRow + 1) * CELL_H + maxLayer * LAYER_OFFSET_Y + TILE_H
  return {
    width: `${width}px`,
    height: `${height}px`
  }
})

/** 单个 tile 的绝对定位 */
function posStyle(t: Tile): Record<string, string> {
  const left = t.x * CELL_W + t.layer * LAYER_OFFSET_X
  const top = t.y * CELL_H + t.layer * LAYER_OFFSET_Y
  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: String(t.layer)
  }
}

function onPick(tileId: number): void {
  emit('pick', tileId)
}
</script>

<style scoped>
.stack-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 8px;
  /* 棋盘背景纹理 */
  background:
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.02) 0px,
      rgba(255, 255, 255, 0.02) 2px,
      transparent 2px,
      transparent 4px
    ),
    var(--color-bg);
}

.stack-area {
  position: relative;
  margin: auto;
}

.stack-tile {
  /* 位置由内联 style 控制 */
}
</style>
