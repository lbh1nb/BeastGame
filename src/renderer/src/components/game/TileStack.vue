<template>
  <div class="stack-wrapper">
    <!-- 全屏单大堆 -->
    <div class="stack-area" :style="areaStyle">
      <!-- 四角小动物装饰 -->
      <div class="corner-deco corner-tl">🐾</div>
      <div class="corner-deco corner-tr">🐾</div>
      <div class="corner-deco corner-bl">🐾</div>
      <div class="corner-deco corner-br">🐾</div>
      <TransitionGroup name="tile">
        <TileComp
          v-for="t in renderTiles"
          :key="t.id"
          :tile="t"
          :is-hint="hintSet.has(t.id) && !coveredSet.has(t.id)"
          :is-covered="coveredSet.has(t.id)"
          :is-selected="pickedFlashSet.has(t.id)"
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
import { CELL_W, CELL_H, TILE_W, TILE_H } from '@game/generator'
import TileComp from './Tile.vue'

interface Props {
  tiles: Tile[]
  hintTileIds: number[]
  /** 点击后短暂停留在牌堆的牌 id（用于显示动态图后入槽） */
  pickedFlashIds?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  pickedFlashIds: () => []
})

const emit = defineEmits<{
  (e: 'pick', tileId: number): void
}>()

/** 点击后短暂停留的牌 id 集合 */
const pickedFlashSet = computed(() => new Set(props.pickedFlashIds))

/** 待渲染的 tile：未消除 & 不在槽位，或处于点击闪烁期（保留显示动态图），按 layer→z 排序 */
const renderTiles = computed(() => {
  return props.tiles
    .filter((t) => (!t.removed && !t.inSlot) || pickedFlashSet.value.has(t.id))
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

/** 被上层覆盖的 tile id 集合 */
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

/** 计算整个牌堆区域的尺寸（按实际像素位置计算，适配半整数坐标） */
const areaStyle = computed(() => {
  let minCol = Infinity
  let maxCol = -Infinity
  let minRow = Infinity
  let maxRow = -Infinity
  for (const t of renderTiles.value) {
    if (t.x < minCol) minCol = t.x
    if (t.x > maxCol) maxCol = t.x
    if (t.y < minRow) minRow = t.y
    if (t.y > maxRow) maxRow = t.y
  }
  if (minCol === Infinity) return { width: '0px', height: '0px' }
  // 直接用网格坐标计算像素范围（适配半整数坐标）
  const width = maxCol * CELL_W + TILE_W - minCol * CELL_W
  const height = maxRow * CELL_H + TILE_H - minRow * CELL_H
  return {
    width: `${width}px`,
    height: `${height}px`
  }
})

/** 计算实际有牌的最小列/行（用于 posStyle 偏移修正） */
const minColRow = computed(() => {
  let minCol = Infinity
  let minRow = Infinity
  for (const t of renderTiles.value) {
    if (t.x < minCol) minCol = t.x
    if (t.y < minRow) minRow = t.y
  }
  if (minCol === Infinity) return { minCol: 0, minRow: 0 }
  return { minCol, minRow }
})

/** 单个 tile 的绝对定位（纯网格坐标，无像素偏移） */
function posStyle(t: Tile): Record<string, string> {
  const PAD = 10
  const left = (t.x - minColRow.value.minCol) * CELL_W + PAD
  const top = (t.y - minColRow.value.minRow) * CELL_H + PAD
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
  align-items: center;
  justify-content: center;
  padding: 12px;
  /* 背景透明，避免牌堆外空旷感 */
  background: transparent;
}

.stack-area {
  position: relative;
  margin: auto;
  /* 渐变背景：径向渐变营造立体感 */
  background:
    radial-gradient(ellipse at center, rgba(255, 252, 240, 0.92) 0%, rgba(255, 245, 220, 0.85) 60%, rgba(255, 235, 200, 0.75) 100%);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(139, 87, 42, 0.18),
    inset 0 0 0 2px rgba(255, 255, 255, 0.7),
    inset 0 -3px 12px rgba(139, 87, 42, 0.08);
  border: 2px dashed rgba(180, 130, 80, 0.35);
  box-sizing: content-box;
  padding: 10px;
}

/* 四角小动物装饰 */
.corner-deco {
  position: absolute;
  font-size: 18px;
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
  filter: grayscale(0.3);
}
.corner-tl { top: 6px; left: 6px; transform: rotate(-15deg); }
.corner-tr { top: 6px; right: 6px; transform: rotate(15deg); }
.corner-bl { bottom: 6px; left: 6px; transform: rotate(-195deg); }
.corner-br { bottom: 6px; right: 6px; transform: rotate(195deg); }

.stack-tile {
  /* 位置由内联 style 控制 */
}
</style>
