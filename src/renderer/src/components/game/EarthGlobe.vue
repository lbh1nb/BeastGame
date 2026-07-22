<template>
  <div class="earth-wrap">
    <!-- Canvas 绘制的真实地球 -->
    <canvas
      ref="canvasRef"
      :width="size"
      :height="size"
      class="earth-canvas"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
    />

    <!-- 当前章节信息浮层 -->
    <div class="chapter-info">
      <span class="chapter-emoji">{{ chapterEmoji(activeChapter) }}</span>
      <span class="chapter-name">{{ currentChapterName }}</span>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <button class="ctrl-btn" @click="prevChapter" title="上一章">◀</button>
      <button class="ctrl-btn" @click="nextChapter" title="下一章">▶</button>
      <button class="ctrl-btn" @click="rotateLeft" title="向左转">↺</button>
      <button class="ctrl-btn" @click="rotateRight" title="向右转">↻</button>
    </div>

    <!-- 提示 -->
    <div class="tip">拖动旋转地球 · 点击标记进入章节</div>
  </div>
</template>

<script setup lang="ts">
/**
 * 真实地球组件（Canvas + 真实贴图）
 * - 底图：NASA Blue Marble 真实地球贴图（equirectangular 投影）
 * - 球面投影：经纬度 → 球面正交投影坐标
 * - 360° 旋转：鼠标拖动（经度+纬度）
 * - 6 章节场景：在地球对应位置绘制特色场景（含 2 只小动物+装饰）
 * - 真实感：大气层光晕、边缘暗化、左上高光
 */
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { drawAnimal, PIXEL_SIZE } from '@utils/pixel-animal'
import type { Chapter } from '@game/levels.config'
import type { AnimalType } from '@game/types'

interface Props {
  activeChapter: number
  size?: number
  chapters: Chapter[]
}

const props = withDefaults(defineProps<Props>(), {
  size: 400
})

const emit = defineEmits<{
  (e: 'select', chapter: number): void
  (e: 'hover-animal', animal: AnimalType): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

/** 地球贴图 Image 对象 */
const earthTexture = ref<HTMLImageElement | null>(null)
/** 贴图是否加载完成 */
const textureLoaded = ref(false)

/** 经度（左右旋转） */
const lon = ref(20)
/** 纬度（上下旋转） */
const lat = ref(20)
/** 是否正在拖动 */
const dragging = ref(false)
let lastX = 0
let lastY = 0

/** 6 章节在地球上的经纬度位置 + 场景主题 */
const chapterLocations = [
  { chapter: 1, lon: 30, lat: 40, name: '家畜', emoji: '🏠', theme: 'farm' },
  { chapter: 2, lon: -90, lat: 35, name: '宠物', emoji: '🐾', theme: 'pet' },
  { chapter: 3, lon: 120, lat: -10, name: '小动物', emoji: '🌳', theme: 'small' },
  { chapter: 4, lon: 20, lat: -20, name: '野生', emoji: '🌿', theme: 'wild' },
  { chapter: 5, lon: -150, lat: 0, name: '海洋', emoji: '🌊', theme: 'ocean' },
  { chapter: 6, lon: 70, lat: 60, name: '综合', emoji: '⛰️', theme: 'mix' }
]

const currentChapterName = computed(() => {
  return chapterLocations.find((c) => c.chapter === props.activeChapter)?.name ?? ''
})

function chapterEmoji(id: number): string {
  return chapterLocations.find((c) => c.chapter === id)?.emoji ?? '📍'
}

/** 加载真实地球贴图 */
async function loadEarthTexture(): Promise<void> {
  try {
    const path = await window.gameAPI.asset.resolve('earth_texture.jpg')
    const img = new Image()
    img.onload = () => {
      earthTexture.value = img
      textureLoaded.value = true
      render()
    }
    img.onerror = () => {
      console.warn('[EarthGlobe] 地球贴图加载失败，使用程序绘制')
      textureLoaded.value = false
      render()
    }
    img.src = `file:///${path.replace(/\\/g, '/')}`
  } catch (e) {
    console.warn('[EarthGlobe] 贴图加载异常', e)
    render()
  }
}

/** 经纬度 → 球面正交投影坐标 */
function project(lonDeg: number, latDeg: number, cx: number, cy: number, r: number): { x: number; y: number; visible: boolean } {
  // 相对经度
  let relLon = lonDeg - lon.value
  // 归一化到 [-180, 180]
  while (relLon > 180) relLon -= 360
  while (relLon < -180) relLon += 360

  // 超过 90° 的在球体背面
  if (Math.abs(relLon) > 90) return { x: 0, y: 0, visible: false }

  const relLat = latDeg - lat.value
  if (Math.abs(relLat) > 90) return { x: 0, y: 0, visible: false }

  const lonRad = (relLon * Math.PI) / 180
  const latRad = (relLat * Math.PI) / 180

  const x = cx + r * Math.cos(latRad) * Math.sin(lonRad)
  const y = cy - r * Math.sin(latRad)
  const visible = Math.cos(latRad) * Math.cos(lonRad) > 0

  return { x, y, visible }
}

/** 绘制地球 */
function render(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) / 2 - 10

  ctx.clearRect(0, 0, w, h)

  // 大气层光晕
  const atmGrad = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.15)
  atmGrad.addColorStop(0, 'rgba(125, 211, 252, 0.6)')
  atmGrad.addColorStop(1, 'rgba(125, 211, 252, 0)')
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2)
  ctx.fillStyle = atmGrad
  ctx.fill()

  // 球体裁剪区域
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  // 绘制地球贴图（像素级采样映射到球面）
  if (textureLoaded.value && earthTexture.value) {
    drawEarthTexture(ctx, cx, cy, r)
  } else {
    // 回退：程序绘制海洋底色
    drawFallbackOcean(ctx, cx, cy, r)
  }

  // 绘制 6 章节场景（含小动物）
  drawChapterScenes(ctx, cx, cy, r)

  ctx.restore()

  // 球体边缘暗化
  const rimGrad = ctx.createRadialGradient(
    cx - r * 0.3, cy - r * 0.3, r * 0.5,
    cx, cy, r
  )
  rimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)')
  rimGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)')
  rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)')
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = rimGrad
  ctx.fill()

  // 左上高光
  const hlGrad = ctx.createRadialGradient(
    cx - r * 0.35, cy - r * 0.35, 0,
    cx - r * 0.35, cy - r * 0.35, r * 0.5
  )
  hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)')
  hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = hlGrad
  ctx.fill()

  // 章节标记点
  drawChapterMarkers(ctx, cx, cy, r)

  // 选中指示器
  drawSelectionIndicator(ctx, cx, cy, r)
}

/** 贴图像素数据缓存（避免每帧 getImageData） */
let textureImageData: ImageData | null = null
let textureImgW = 0
let textureImgH = 0

/** 从 Image 对象读取全部像素数据（仅一次） */
function cacheTexturePixels(img: HTMLImageElement): void {
  if (textureImgW === img.width && textureImgH === img.height && textureImageData) return
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(img, 0, 0)
  textureImageData = ctx.getImageData(0, 0, img.width, img.height)
  textureImgW = img.width
  textureImgH = img.height
}

/** 用真实贴图绘制地球表面（putImageData 批量绘制，性能优化） */
function drawEarthTexture(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  const img = earthTexture.value
  if (!img) return

  // 缓存贴图像素数据
  cacheTexturePixels(img)
  if (!textureImageData) return

  const data = textureImageData.data
  const imgW = textureImgW
  const imgH = textureImgH

  // 创建输出 ImageData
  const outSize = Math.ceil(r * 2) + 4
  const outX = Math.floor(cx - r - 2)
  const outY = Math.floor(cy - r - 2)
  const out = ctx.createImageData(outSize, outSize)
  const outData = out.data

  // 逐像素采样
  for (let py = -r; py <= r; py++) {
    for (let px = -r; px <= r; px++) {
      const distSq = px * px + py * py
      if (distSq > r * r) continue

      // 球面正交投影反推
      const nx = px / r
      const ny = py / r
      const nz = Math.sqrt(1 - nx * nx - ny * ny)

      // 球面坐标 → 经纬度
      const latRad = Math.asin(-ny)
      const lonRad = Math.atan2(nx, nz)

      const worldLat = (latRad * 180) / Math.PI + lat.value
      let worldLon = (lonRad * 180) / Math.PI + lon.value
      while (worldLon > 180) worldLon -= 360
      while (worldLon < -180) worldLon += 360

      // 经纬度 → 贴图坐标
      const tx = Math.floor(((worldLon + 180) / 360) * imgW)
      const ty = Math.floor(((90 - worldLat) / 180) * imgH)

      // 边界保护
      if (tx < 0 || tx >= imgW || ty < 0 || ty >= imgH) continue

      // 从缓存数组读色
      const srcIdx = (ty * imgW + tx) * 4
      const dstX = Math.floor(px + r + 2)
      const dstY = Math.floor(py + r + 2)
      const dstIdx = (dstY * outSize + dstX) * 4
      outData[dstIdx] = data[srcIdx]
      outData[dstIdx + 1] = data[srcIdx + 1]
      outData[dstIdx + 2] = data[srcIdx + 2]
      outData[dstIdx + 3] = 255
    }
  }

  // 一次性绘制
  ctx.putImageData(out, outX, outY)
}

/** 回退：程序绘制海洋 */
function drawFallbackOcean(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r)
  grad.addColorStop(0, '#4dabf7')
  grad.addColorStop(0.4, '#228be6')
  grad.addColorStop(0.8, '#1c4e80')
  grad.addColorStop(1, '#0d2440')
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
}

/** 绘制 6 章节场景（含小动物+装饰） */
function drawChapterScenes(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  for (const loc of chapterLocations) {
    const center = project(loc.lon, loc.lat, cx, cy, r)
    if (!center.visible) continue

    const sceneR = r * 0.3
    const isActive = loc.chapter === props.activeChapter

    // 获取该章节的动物配置
    const chapter = props.chapters.find((c) => c.id === loc.chapter)
    const animals = chapter?.animals ?? []

    drawSceneWithAnimals(ctx, center.x, center.y, sceneR, loc.theme, isActive, animals)
  }
}

/** 绘制场景+小动物
 * 绘制顺序：选中光晕 → 圆形裁剪 → 半透明底色(让地球贴图透出来) → 精致装饰 → 大尺寸小动物
 */
function drawSceneWithAnimals(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
  theme: string, active: boolean,
  animals: AnimalType[]
): void {
  ctx.save()

  // 选中高亮（外圈光晕）
  if (active) {
    ctx.beginPath()
    ctx.arc(x, y, radius * 1.3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 215, 0, 0.25)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.95)'
    ctx.lineWidth = 2.5
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(x, y, radius * 1.04, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // 圆形裁剪
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.clip()

  // 半透明场景底色（让地球贴图透出来，又有场景氛围）
  drawSceneBackground(ctx, x, y, radius, theme)

  // 精致装饰元素（农舍/树木/岩石/波纹等）
  drawSceneDecor(ctx, x, y, radius, theme)

  // 绘制 2 只小动物（取该章节前 2 种动物）—— 更大更清晰
  const animalSize = Math.floor(radius * 0.7)
  const scale = Math.max(1, Math.floor(animalSize / PIXEL_SIZE))
  const drawSize = scale * PIXEL_SIZE

  for (let i = 0; i < Math.min(2, animals.length); i++) {
    const ax = x - radius * 0.42 + i * radius * 0.84 - drawSize / 2
    const ay = y + radius * 0.2 - drawSize / 2
    drawAnimal(ctx, animals[i], (i % 2) as 0 | 1, 'idle', scale, ax, ay)
  }

  ctx.restore()
}

/** 按主题绘制半透明场景底色（不盖死地球贴图） */
function drawSceneBackground(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
  theme: string
): void {
  const themeColors: Record<string, string> = {
    farm: 'rgba(124, 179, 66, 0.35)',
    pet: 'rgba(255, 182, 193, 0.4)',
    small: 'rgba(85, 139, 47, 0.35)',
    wild: 'rgba(109, 76, 65, 0.4)',
    ocean: 'rgba(25, 118, 210, 0.25)',
    mix: 'rgba(94, 53, 177, 0.35)'
  }
  ctx.fillStyle = themeColors[theme] ?? 'rgba(255, 255, 255, 0.2)'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

/** 按主题绘制场景装饰（精致版，不填满背景，装饰在场景上半部） */
function drawSceneDecor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
  theme: string
): void {
  switch (theme) {
    case 'farm': {
      // 农舍：墙体 + 红屋顶 + 门 + 窗 + 烟囱
      const hx = x - radius * 0.32
      const hy = y - radius * 0.35
      const hw = radius * 0.5
      const hh = radius * 0.4
      // 墙体
      ctx.fillStyle = '#f5e6c8'
      ctx.fillRect(hx, hy + hh * 0.35, hw, hh * 0.65)
      // 屋顶
      ctx.fillStyle = '#c62828'
      ctx.beginPath()
      ctx.moveTo(hx - hw * 0.1, hy + hh * 0.4)
      ctx.lineTo(hx + hw / 2, hy)
      ctx.lineTo(hx + hw + hw * 0.1, hy + hh * 0.4)
      ctx.closePath()
      ctx.fill()
      // 烟囱
      ctx.fillStyle = '#8d6e63'
      ctx.fillRect(hx + hw * 0.7, hy - hh * 0.05, hw * 0.12, hh * 0.25)
      // 门
      ctx.fillStyle = '#5d4037'
      ctx.fillRect(hx + hw * 0.35, hy + hh * 0.55, hw * 0.3, hh * 0.45)
      // 窗
      ctx.fillStyle = '#81d4fa'
      ctx.fillRect(hx + hw * 0.05, hy + hh * 0.5, hw * 0.22, hh * 0.22)
      ctx.strokeStyle = '#5d4037'
      ctx.lineWidth = 1
      ctx.strokeRect(hx + hw * 0.05, hy + hh * 0.5, hw * 0.22, hh * 0.22)
      // 栅栏（右侧）
      ctx.fillStyle = '#fff8e1'
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + radius * 0.3 + i * radius * 0.12, y - radius * 0.2, radius * 0.04, radius * 0.3)
      }
      ctx.fillRect(x + radius * 0.3, y - radius * 0.1, radius * 0.32, radius * 0.04)
      break
    }
    case 'pet': {
      // 宠物窝：圆顶小屋 + 玩具球 + 骨头
      const bx = x - radius * 0.35
      const by = y - radius * 0.25
      // 窝顶（半圆）
      ctx.fillStyle = '#ad1457'
      ctx.beginPath()
      ctx.arc(bx, by, radius * 0.28, Math.PI, 0)
      ctx.fill()
      // 窝身
      ctx.fillStyle = '#ec407a'
      ctx.fillRect(bx - radius * 0.28, by, radius * 0.56, radius * 0.2)
      // 窝门
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(bx, by + radius * 0.1, radius * 0.1, 0, Math.PI * 2)
      ctx.fill()
      // 玩具球（右上）
      ctx.fillStyle = '#ff7043'
      ctx.beginPath()
      ctx.arc(x + radius * 0.4, y - radius * 0.35, radius * 0.12, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#bf360c'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x + radius * 0.4, y - radius * 0.35, radius * 0.12, 0, Math.PI * 2)
      ctx.stroke()
      // 骨头（右下小）
      ctx.fillStyle = '#fffde7'
      ctx.fillRect(x + radius * 0.25, y - radius * 0.05, radius * 0.2, radius * 0.05)
      ctx.beginPath()
      ctx.arc(x + radius * 0.23, y - radius * 0.03, radius * 0.05, 0, Math.PI * 2)
      ctx.arc(x + radius * 0.23, y + radius * 0.02, radius * 0.05, 0, Math.PI * 2)
      ctx.arc(x + radius * 0.47, y - radius * 0.03, radius * 0.05, 0, Math.PI * 2)
      ctx.arc(x + radius * 0.47, y + radius * 0.02, radius * 0.05, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'small': {
      // 森林：两棵多层树 + 草丛
      // 左树
      drawTree(ctx, x - radius * 0.38, y - radius * 0.15, radius * 0.22)
      // 右树
      drawTree(ctx, x + radius * 0.38, y - radius * 0.15, radius * 0.2)
      // 草丛
      ctx.fillStyle = '#33691e'
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(x - radius * 0.15 + i * radius * 0.15, y - radius * 0.05, radius * 0.06, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'wild': {
      // 野生丛林：多边形岩石 + 灌木
      // 大岩石
      ctx.fillStyle = '#616161'
      ctx.beginPath()
      ctx.moveTo(x - radius * 0.45, y - radius * 0.05)
      ctx.lineTo(x - radius * 0.3, y - radius * 0.35)
      ctx.lineTo(x - radius * 0.05, y - radius * 0.3)
      ctx.lineTo(x + radius * 0.1, y - radius * 0.1)
      ctx.lineTo(x - radius * 0.1, y + radius * 0.05)
      ctx.closePath()
      ctx.fill()
      // 岩石高光
      ctx.fillStyle = '#9e9e9e'
      ctx.beginPath()
      ctx.moveTo(x - radius * 0.3, y - radius * 0.35)
      ctx.lineTo(x - radius * 0.1, y - radius * 0.3)
      ctx.lineTo(x - radius * 0.2, y - radius * 0.18)
      ctx.closePath()
      ctx.fill()
      // 小岩石
      ctx.fillStyle = '#424242'
      ctx.beginPath()
      ctx.moveTo(x + radius * 0.2, y - radius * 0.1)
      ctx.lineTo(x + radius * 0.4, y - radius * 0.25)
      ctx.lineTo(x + radius * 0.5, y - radius * 0.05)
      ctx.lineTo(x + radius * 0.3, y + radius * 0.02)
      ctx.closePath()
      ctx.fill()
      // 灌木
      ctx.fillStyle = '#33691e'
      ctx.beginPath()
      ctx.arc(x + radius * 0.35, y - radius * 0.3, radius * 0.1, 0, Math.PI * 2)
      ctx.arc(x + radius * 0.45, y - radius * 0.32, radius * 0.09, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'ocean': {
      // 海洋：波纹 + 气泡（不画背景，直接在地球海洋上）
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 1.8
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        const wy = y - radius * 0.35 + i * radius * 0.12
        ctx.moveTo(x - radius * 0.45, wy)
        ctx.quadraticCurveTo(x - radius * 0.2, wy - radius * 0.05, x, wy)
        ctx.quadraticCurveTo(x + radius * 0.2, wy + radius * 0.05, x + radius * 0.45, wy)
        ctx.stroke()
      }
      // 气泡
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      const bubbles = [
        { bx: x - radius * 0.3, by: y - radius * 0.05, s: 0.06 },
        { bx: x + radius * 0.35, by: y - radius * 0.1, s: 0.05 },
        { bx: x - radius * 0.1, by: y + radius * 0.05, s: 0.04 },
        { bx: x + radius * 0.15, by: y + radius * 0.02, s: 0.05 }
      ]
      for (const b of bubbles) {
        ctx.beginPath()
        ctx.arc(b.bx, b.by, radius * b.s, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'mix': {
      // 综合：双峰雪山 + 松树
      // 后山（大）
      ctx.fillStyle = '#eceff1'
      ctx.beginPath()
      ctx.moveTo(x - radius * 0.5, y - radius * 0.02)
      ctx.lineTo(x - radius * 0.1, y - radius * 0.45)
      ctx.lineTo(x + radius * 0.3, y - radius * 0.02)
      ctx.closePath()
      ctx.fill()
      // 山影
      ctx.fillStyle = '#b0bec5'
      ctx.beginPath()
      ctx.moveTo(x - radius * 0.1, y - radius * 0.45)
      ctx.lineTo(x + radius * 0.1, y - radius * 0.02)
      ctx.lineTo(x - radius * 0.1, y - radius * 0.02)
      ctx.closePath()
      ctx.fill()
      // 雪顶
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.moveTo(x - radius * 0.2, y - radius * 0.28)
      ctx.lineTo(x - radius * 0.1, y - radius * 0.45)
      ctx.lineTo(x, y - radius * 0.28)
      ctx.lineTo(x - radius * 0.13, y - radius * 0.22)
      ctx.closePath()
      ctx.fill()
      // 前山（小）
      ctx.fillStyle = '#cfd8dc'
      ctx.beginPath()
      ctx.moveTo(x + radius * 0.1, y - radius * 0.02)
      ctx.lineTo(x + radius * 0.4, y - radius * 0.3)
      ctx.lineTo(x + radius * 0.55, y - radius * 0.02)
      ctx.closePath()
      ctx.fill()
      // 松树
      ctx.fillStyle = '#1b5e20'
      ctx.beginPath()
      ctx.moveTo(x - radius * 0.35, y - radius * 0.05)
      ctx.lineTo(x - radius * 0.28, y - radius * 0.3)
      ctx.lineTo(x - radius * 0.21, y - radius * 0.05)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#5d4037'
      ctx.fillRect(x - radius * 0.295, y - radius * 0.05, radius * 0.03, radius * 0.08)
      break
    }
  }
}

/** 绘制一棵多层树 */
function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // 树干
  ctx.fillStyle = '#5d4037'
  ctx.fillRect(x - size * 0.08, y, size * 0.16, size * 0.4)
  // 树冠（三层三角）
  ctx.fillStyle = '#2e7d32'
  for (let i = 0; i < 3; i++) {
    const ty = y - i * size * 0.3
    const tw = size * (0.7 - i * 0.12)
    ctx.beginPath()
    ctx.moveTo(x - tw, ty)
    ctx.lineTo(x, ty - size * 0.5)
    ctx.lineTo(x + tw, ty)
    ctx.closePath()
    ctx.fill()
  }
  // 高光
  ctx.fillStyle = '#43a047'
  ctx.beginPath()
  ctx.moveTo(x - size * 0.1, y - size * 0.2)
  ctx.lineTo(x, y - size * 0.5)
  ctx.lineTo(x + size * 0.05, y - size * 0.2)
  ctx.closePath()
  ctx.fill()
}

/** 绘制章节标记点 */
function drawChapterMarkers(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  for (const loc of chapterLocations) {
    const p = project(loc.lon, loc.lat, cx, cy, r)
    if (!p.visible) continue

    const isActive = loc.chapter === props.activeChapter
    const markerR = isActive ? 14 : 10

    // 标记位于场景上方
    const mx = p.x
    const my = p.y - r * 0.3

    // 背景圆
    ctx.beginPath()
    ctx.arc(mx, my, markerR, 0, Math.PI * 2)
    ctx.fillStyle = isActive ? '#ffd700' : 'rgba(255, 255, 255, 0.95)'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // emoji
    ctx.font = `${markerR}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(loc.emoji, mx, my)
  }
}

/** 选中章节脉冲指示器 */
function drawSelectionIndicator(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  const loc = chapterLocations.find((c) => c.chapter === props.activeChapter)
  if (!loc) return
  const p = project(loc.lon, loc.lat, cx, cy, r)
  if (!p.visible) return

  const t = (Date.now() % 1500) / 1500
  const pulseR = r * 0.22 + t * r * 0.08
  ctx.beginPath()
  ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 - t * 0.8})`
  ctx.lineWidth = 3
  ctx.stroke()
}

/** 拖动旋转 */
function startDrag(e: MouseEvent): void {
  dragging.value = true
  lastX = e.clientX
  lastY = e.clientY
}

function onDrag(e: MouseEvent): void {
  if (!dragging.value) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  lon.value = (lon.value + dx * 0.5 + 360) % 360
  if (lon.value > 180) lon.value -= 360
  lat.value = Math.max(-85, Math.min(85, lat.value - dy * 0.5))
  lastX = e.clientX
  lastY = e.clientY
}

function endDrag(): void {
  dragging.value = false
}

/** 旋转到指定章节（平滑动画） */
function rotateToChapter(chapter: number): void {
  const loc = chapterLocations.find((c) => c.chapter === chapter)
  if (!loc) return
  animateRotate(loc.lon, loc.lat)
}

function animateRotate(targetLon: number, targetLat: number): void {
  const startLon = lon.value
  const startLat = lat.value
  // 选择最短旋转路径
  let dLon = targetLon - startLon
  while (dLon > 180) dLon -= 360
  while (dLon < -180) dLon += 360

  const duration = 800
  const startTime = Date.now()

  function step() {
    const elapsed = Date.now() - startTime
    const t = Math.min(1, elapsed / duration)
    const ease = 1 - Math.pow(1 - t, 3)
    lon.value = startLon + dLon * ease
    lat.value = startLat + (targetLat - startLat) * ease
    if (t < 1) {
      requestAnimationFrame(step)
    }
  }
  step()
}

function prevChapter(): void {
  const cur = props.activeChapter
  const next = cur <= 1 ? props.chapters.length : cur - 1
  emit('select', next)
}

function nextChapter(): void {
  const cur = props.activeChapter
  const next = cur >= props.chapters.length ? 1 : cur + 1
  emit('select', next)
}

function rotateLeft(): void {
  lon.value -= 30
  if (lon.value < -180) lon.value += 360
}

function rotateRight(): void {
  lon.value += 30
  if (lon.value > 180) lon.value -= 360
}

/** 动画循环（脉冲指示器） */
let animFrame = 0
function animLoop() {
  render()
  animFrame = requestAnimationFrame(animLoop)
}

onMounted(async () => {
  await loadEarthTexture()
  animLoop()
})

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
})

watch(
  () => props.activeChapter,
  (ch) => {
    rotateToChapter(ch)
  }
)
</script>

<style scoped>
.earth-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.earth-canvas {
  display: block;
  cursor: grab;
  border-radius: 50%;
}

.earth-canvas:active {
  cursor: grabbing;
}

.chapter-info {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 5;
}

.chapter-emoji {
  font-size: 20px;
}

.chapter-name {
  font-size: 16px;
  font-weight: 800;
  color: #1565c0;
}

.controls {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.ctrl-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.7);
  background: rgba(255, 255, 255, 0.95);
  color: #1565c0;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.ctrl-btn:hover {
  background: #ffd700;
  color: #fff;
  border-color: #fff;
  transform: scale(1.1);
}

.tip {
  font-size: 12px;
  color: #5c6bc0;
  background: rgba(255, 255, 255, 0.7);
  padding: 4px 12px;
  border-radius: 12px;
}
</style>
