<template>
  <canvas
    ref="canvasRef"
    :width="canvasSize"
    :height="canvasSize"
    class="pixel-animal"
  />
</template>

<script setup lang="ts">
/**
 * 像素动物 Canvas 组件（32×32 版）
 * - 根据 animal / hover 状态绘制 Q 萌像素动物
 * - hover 时切换到动画帧（弹跳+眨眼）
 * - 父组件通过 hover prop 控制悬停状态
 * - v4：去掉 variant 变体，每种动物唯一模型
 */
import { ref, watch, onMounted, computed } from 'vue'
import { drawAnimal, PIXEL_SIZE } from '@utils/pixel-animal'
import type { AnimalType } from '@game/types'

interface Props {
  animal: AnimalType
  hover?: boolean
  /** 渲染尺寸（px），动物会居中绘制 */
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  hover: false,
  size: 64
})

const canvasRef = ref<HTMLCanvasElement | null>(null)

/** Canvas 实际尺寸 = size */
const canvasSize = computed(() => props.size)

/** 缩放倍数：size / 32 */
const scale = computed(() => Math.floor(props.size / PIXEL_SIZE))

/** 居中偏移 */
const offset = computed(() => {
  const drawn = scale.value * PIXEL_SIZE
  return Math.floor((props.size - drawn) / 2)
})

/** 绘制 */
function render(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = false

  drawAnimal(
    ctx,
    props.animal,
    props.hover ? 'hover' : 'idle',
    scale.value,
    offset.value,
    offset.value
  )
}

onMounted(() => {
  render()
})

watch(
  () => [props.animal, props.hover, props.size],
  () => render(),
  { flush: 'post' }
)
</script>

<style scoped>
.pixel-animal {
  display: block;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  pointer-events: none;
}
</style>
