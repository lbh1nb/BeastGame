<template>
  <div
    class="tile"
    :class="{
      'tile--covered': isCovered,
      'tile--hint': isHint,
      'tile--removed': tile.removed,
      'tile--hover': isHover
    }"
    :style="{ background: bgColor }"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <PixelAnimal
      :animal="tile.animal"
      :hover="isHover"
      :size="animalSize"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 单个图案（麻将牌式方块）- 像素风 Q 萌版
 * - 用 PixelAnimal Canvas 组件绘制动物
 * - 悬停时切换到动画帧（弹跳+眨眼）
 * - 点击音效统一由 game.ts 管理（消除/连击/温和）
 * - 被覆盖时半透明且不可点击；提示时金色边框闪烁
 */
import { ref, computed } from 'vue'
import type { Tile as TileType } from '@game/types'
import PixelAnimal from './PixelAnimal.vue'
import { getAnimalBgColor } from '@utils/pixel-animal'

interface Props {
  tile: TileType
  isHint?: boolean
  isCovered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isHint: false,
  isCovered: false
})

const emit = defineEmits<{
  (e: 'pick', tileId: number): void
}>()

/** 悬停状态 */
const isHover = ref(false)

/** 动物渲染尺寸（px） */
const animalSize = 46

/** 背景色 */
const bgColor = computed(() => getAnimalBgColor(props.tile.animal))

function handleClick(): void {
  if (props.isCovered) return
  if (props.tile.removed) return
  emit('pick', props.tile.id)
}

/** 悬停进入：切换到动画帧（弹跳+眨眼） */
function handleMouseEnter(): void {
  if (props.isCovered || props.tile.removed) return
  isHover.value = true
}

/** 悬停离开 */
function handleMouseLeave(): void {
  isHover.value = false
}
</script>

<style scoped>
.tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 56px;
  border-radius: 10px;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15), inset 0 0 0 2px rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: transform 0.12s ease, filter 0.12s ease;
  user-select: none;
}

.tile:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.tile:active {
  transform: translateY(1px);
}

.tile--hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 8px rgba(0, 0, 0, 0.2), inset 0 0 0 2px rgba(255, 255, 255, 0.8);
}

/* 被覆盖：强对比，明显不可点击 */
.tile--covered {
  opacity: 0.25;
  filter: grayscale(0.8) brightness(0.7);
  cursor: not-allowed;
  pointer-events: none;
}

/* 可点击 tile：增强阴影+发光，补偿小层偏移的层次感 */
.tile:not(.tile--covered):not(.tile--removed) {
  box-shadow:
    0 3px 0 rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    inset 0 0 0 2px rgba(255, 255, 255, 0.6),
    0 0 8px rgba(255, 220, 100, 0.2);
}

/* 提示高亮：金色边框闪烁 */
.tile--hint {
  animation: hint-pulse 0.8s ease-in-out infinite;
  box-shadow: 0 0 0 3px var(--color-warning), 0 2px 0 rgba(0, 0, 0, 0.12);
  z-index: 5;
}

@keyframes hint-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px var(--color-warning), 0 2px 0 rgba(0, 0, 0, 0.12);
  }
  50% {
    box-shadow: 0 0 0 5px #ffd54f, 0 2px 0 rgba(0, 0, 0, 0.12);
  }
}

/* 消除/进入动画（由父级 TransitionGroup name="tile" 驱动） */
.tile-enter-active {
  transition: all 0.25s ease;
}
.tile-leave-active {
  transition: all 0.25s ease;
}
.tile-enter-from {
  opacity: 0;
  transform: scale(0.6);
}
.tile-leave-to {
  opacity: 0;
  transform: scale(0.4) rotate(15deg);
}
</style>
