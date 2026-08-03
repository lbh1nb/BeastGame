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
 * 动物图片组件（图片素材版）
 * - 从 resources/animals/static 加载静态图，active 加载悬停动态图
 * - 自动抠透明背景 + 裁剪主体 + 等比缩放居中
 * - 父组件通过 hover prop 控制是否显示悬停动态图
 */
import { ref, watch, onMounted, computed } from 'vue'
import { getAnimalImage } from '@utils/animal-image'
import type { AnimalType } from '@game/types'

interface Props {
  animal: AnimalType
  hover?: boolean
  /** 渲染尺寸（px），动物会等比缩放居中 */
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  hover: false,
  size: 64
})

const canvasRef = ref<HTMLCanvasElement | null>(null)

/** Canvas 实际尺寸 = size */
const canvasSize = computed(() => props.size)

/** 渲染图片到 canvas */
async function render(): Promise<void> {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const img = await getAnimalImage(props.animal, props.hover)
  if (!img) return

  // 等比缩放居中，填满卡片
  // 先按 contain 计算（完整显示），再放大填充：
  //  - 宽高比接近的动物：放大到填满卡片，主体更饱满
  //  - 长条形动物：放大到一边填满，但限制不超过 contain 的 1.5 倍，避免过度裁切关键特征
  const cw = img.width
  const ch = img.height
  const containScale = Math.min(canvas.width / cw, canvas.height / ch)
  const fillScale = Math.max(canvas.width / cw, canvas.height / ch)
  const scale = Math.min(fillScale, containScale * 1.5)
  const dw = cw * scale
  const dh = ch * scale
  const dx = (canvas.width - dw) / 2
  const dy = (canvas.height - dh) / 2

  ctx.imageSmoothingEnabled = true
  ctx.drawImage(img, dx, dy, dw, dh)
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
  pointer-events: none;
}
</style>