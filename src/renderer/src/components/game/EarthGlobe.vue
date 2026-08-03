<template>
  <div class="earth-wrap">
    <!-- Three.js 真3D地球容器 -->
    <div
      ref="containerRef"
      class="earth-container"
      :style="{ width: size + 'px', height: size + 'px' }"
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
    <div class="tip">拖动旋转 · 点击气球标记进入章节</div>
  </div>
</template>

<script setup lang="ts">
/**
 * 真3D球体地球（Three.js WebGL 版）
 * - 卡通等距圆柱贴图（Seedream 生成），边缘融合保证无缝旋转
 * - 真实 3D 球体：360° 无缝旋转、方向光+环境光、半透明云层、大气光晕、星空
 * - 6 章节标记：气球 emoji 精灵定位在地球表面，随地球一起旋转
 * - 交互：拖动旋转（经度+纬度）、点击标记选择章节、悬停标记播放动物叫声
 * - 平滑旋转到章节：切换章节时地球自动旋转到对应标记
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
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

const containerRef = ref<HTMLDivElement | null>(null)

/** 6 章节位置（经纬度）+ 名称 + 图标（与 levels.config 章节对应） */
const chapterLocations = [
  { chapter: 1, lon: 30, lat: 40, name: '家畜', emoji: '🏠' },
  { chapter: 2, lon: -90, lat: 35, name: '野兽', emoji: '🐾' },
  { chapter: 3, lon: 120, lat: -10, name: '森林', emoji: '🌳' },
  { chapter: 4, lon: 20, lat: -20, name: '小动物', emoji: '🌿' },
  { chapter: 5, lon: -150, lat: 0, name: '海洋', emoji: '🌊' },
  { chapter: 6, lon: 70, lat: 60, name: '综合', emoji: '⛰️' }
]

const currentChapterName = computed(() => {
  return chapterLocations.find((c) => c.chapter === props.activeChapter)?.name ?? ''
})
function chapterEmoji(id: number): string {
  return chapterLocations.find((c) => c.chapter === id)?.emoji ?? '📍'
}

// ===== Three.js 状态 =====
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let earthGroup: THREE.Group | null = null
let earthMesh: THREE.Mesh | null = null
let clouds: THREE.Mesh | null = null
let halo: THREE.Sprite | null = null
let markerSprites: THREE.Sprite[] = []
let activeRing: THREE.Sprite | null = null
let raycaster = new THREE.Raycaster()
let pointer = new THREE.Vector2()

/** 经度（左右旋转） / 纬度（上下旋转） */
let lon = 30
let lat = 20
/** 平滑旋转目标（null = 跟随自动旋转） */
let targetLon: number | null = null
let targetLat: number | null = null
/** 是否正在拖动 */
let dragging = false
let downX = 0
let downY = 0
let moved = false
let lastHoverChapter = -1
let animFrame = 0
let disposed = false

/** 经纬度 → 球面坐标（与 SphereGeometry 顶点公式一致，保证标记贴附正确位置） */
function latLonToWorld(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const phi = ((lonDeg + 180) * Math.PI) / 180
  const theta = ((90 - latDeg) * Math.PI) / 180
  return new THREE.Vector3(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

/** 贴图边缘融合：左右边缘交叉混色 + 极点融合，保证球体旋转无缝、极点自然 */
function makeSeamless(img: HTMLImageElement): HTMLCanvasElement {
  const w = img.width
  const h = img.height
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, w, h)
  const d = data.data
  // 1. 左右边缘交叉混色，消除水平接缝
  const band = Math.max(4, Math.floor(w * 0.03))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < band; x++) {
      const l = (y * w + x) * 4
      const r = (y * w + (w - 1 - x)) * 4
      for (let c = 0; c < 4; c++) {
        const avg = (d[l + c] + d[r + c]) >> 1
        d[l + c] = avg
        d[r + c] = avg
      }
    }
  }
  // 2. 极点融合：把顶部/底部若干行统一为整行平均色，消除极点（上下边缘）畸变
  const poleBand = Math.max(4, Math.floor(h * 0.03))
  for (let y = 0; y < poleBand; y++) {
    for (let c = 0; c < 3; c++) {
      let s = 0
      for (let x = 0; x < w; x++) s += d[(y * w + x) * 4 + c]
      const avg = s / w
      for (let x = 0; x < w; x++) d[(y * w + x) * 4 + c] = avg
    }
  }
  for (let y = 0; y < poleBand; y++) {
    const yy = h - 1 - y
    for (let c = 0; c < 3; c++) {
      let s = 0
      for (let x = 0; x < w; x++) s += d[(yy * w + x) * 4 + c]
      const avg = s / w
      for (let x = 0; x < w; x++) d[(yy * w + x) * 4 + c] = avg
    }
  }
  ctx.putImageData(data, 0, 0)
  return canvas
}

/** 程序化生成云层贴图（半透明白斑） */
function makeCloudTexture(): THREE.CanvasTexture {
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = 8 + Math.random() * 42
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,255,255,0.55)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 程序化生成大气光晕贴图（径向发光） */
function makeHaloTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(150, 210, 255, 0.9)')
  g.addColorStop(0.55, 'rgba(120, 190, 255, 0.35)')
  g.addColorStop(1, 'rgba(100, 170, 255, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

/** 生成 emoji 气球精灵 */
function makeEmojiSprite(emoji: string, scale: number): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.font = '96px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, 64, 66)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(scale, scale, 1)
  return sprite
}

/** 生成选中章节的脉冲光环精灵 */
function makeRingSprite(): THREE.Sprite {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.95)'
    ctx.lineWidth = 9
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(mat)
  return sprite
}

/** 程序化回退海洋贴图（贴图加载失败时用） */
function makeFallbackTexture(): THREE.CanvasTexture {
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#4dabf7')
    g.addColorStop(0.5, '#228be6')
    g.addColorStop(1, '#1c4e80')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    // 几块绿色大陆
    ctx.fillStyle = '#66bb6a'
    ctx.beginPath()
    ctx.ellipse(w * 0.3, h * 0.4, w * 0.12, h * 0.12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(w * 0.55, h * 0.55, w * 0.1, h * 0.1, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  return new THREE.CanvasTexture(canvas)
}

/** 初始化 Three.js 场景 */
function initScene(): void {
  const container = containerRef.value
  if (!container) return

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(props.size, props.size)
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
  camera.position.set(0, 0, 3.4)

  // 灯光
  const ambient = new THREE.AmbientLight(0xffffff, 0.55)
  const sun = new THREE.DirectionalLight(0xffffff, 1.1)
  sun.position.set(3, 2, 4)
  scene.add(ambient, sun)

  // 地球组（负责整体旋转）
  earthGroup = new THREE.Group()
  scene.add(earthGroup)

  // 地球球体（先用回退贴图，加载真实贴图后替换）
  const earthGeom = new THREE.SphereGeometry(1, 64, 64)
  const fallbackTex = makeFallbackTexture()
  const earthMat = new THREE.MeshPhongMaterial({ map: fallbackTex })
  earthMesh = new THREE.Mesh(earthGeom, earthMat)
  earthGroup.add(earthMesh)

  // 半透明云层
  const cloudTex = makeCloudTexture()
  clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.015, 64, 64),
    new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.55, depthWrite: false })
  )
  earthGroup.add(clouds)

  // 大气光晕（场景级，不随地球旋转）
  const haloTex = makeHaloTexture()
  halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  )
  halo.scale.set(2.9, 2.9, 1)
  scene.add(halo)

  // 星空
  addStars()

  // 章节标记
  buildMarkers()

  // 选中光环
  activeRing = makeRingSprite()
  scene.add(activeRing)

  // 事件
  bindEvents()

  // 初始朝向
  const loc = chapterLocations.find((c) => c.chapter === props.activeChapter)
  if (loc) {
    lon = loc.lon
    lat = loc.lat
  }
  applyRotation()
  updateActiveRing()

  // 加载真实贴图（异步）
  loadEarthTexture()

  // 动画循环
  animFrame = requestAnimationFrame(animLoop)
}

/** 添加星空 */
function addStars(): void {
  if (!scene) return
  const count = 900
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 12 + Math.random() * 8
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.85 })
  const stars = new THREE.Points(geom, mat)
  scene.add(stars)
}

/** 在地球表面构建章节标记精灵 */
function buildMarkers(): void {
  if (!earthGroup || !scene) return
  markerSprites = []
  for (const loc of chapterLocations) {
    const sprite = makeEmojiSprite(loc.emoji, 0.46)
    sprite.position.copy(latLonToWorld(loc.lat, loc.lon, 1.06))
    earthGroup.add(sprite)
    markerSprites.push(sprite)
  }
}

/** 加载真实卡通贴图并替换 */
async function loadEarthTexture(): Promise<void> {
  try {
    const path = await window.gameAPI.asset.resolve('earth_texture_cartoon_v9.jpg')
    const img = new Image()
    img.onload = () => {
      if (disposed || !earthMesh) return
      const tex = new THREE.CanvasTexture(makeSeamless(img))
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = renderer?.capabilities.getMaxAnisotropy() ?? 1
      ;(earthMesh.material as THREE.MeshPhongMaterial).map = tex
      ;(earthMesh.material as THREE.MeshPhongMaterial).needsUpdate = true
    }
    img.onerror = () => {
      console.warn('[EarthGlobe] 卡通贴图加载失败，使用回退贴图')
    }
    img.src = `file:///${path.replace(/\\/g, '/')}`
  } catch (e) {
    console.warn('[EarthGlobe] 贴图加载异常', e)
  }
}

/** 应用地球旋转 */
function applyRotation(): void {
  if (!earthGroup) return
  earthGroup.rotation.y = (-lon * Math.PI) / 180 - Math.PI / 2
  earthGroup.rotation.x = (-lat * Math.PI) / 180
}

/** 更新选中章节光环位置 */
function updateActiveRing(): void {
  if (!activeRing || !scene) return
  const loc = chapterLocations.find((c) => c.chapter === props.activeChapter)
  if (!loc) return
  const pos = latLonToWorld(loc.lat, loc.lon, 1.06)
  // 光环在场景级，需用地球组的旋转把本地坐标转为世界坐标（先强制更新矩阵，避免首帧滞后）
  earthGroup?.updateMatrixWorld(true)
  const world = pos.clone().applyMatrix4(earthGroup?.matrixWorld ?? new THREE.Matrix4())
  activeRing.position.copy(world)
  const sc = 0.62 + 0.1 * Math.sin((Date.now() % 1200) / 1200 * Math.PI * 2)
  activeRing.scale.set(sc, sc, 1)
}

/** 事件绑定 */
function bindEvents(): void {
  const el = renderer?.domElement
  if (!el) return
  el.addEventListener('mousedown', onMouseDown)
  el.addEventListener('mousemove', onMouseMove)
  el.addEventListener('mouseup', onMouseUp)
  el.addEventListener('mouseleave', onMouseLeave)
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: true })
  el.addEventListener('touchend', onTouchEnd, { passive: true })
}

/** 事件坐标 → NDC */
function toNDC(clientX: number, clientY: number): THREE.Vector2 {
  const el = renderer?.domElement
  const rect = el?.getBoundingClientRect()
  if (!el || !rect) return new THREE.Vector2(-2, -2)
  return new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  )
}

/** 射线检测命中的章节标记 */
function intersectMarker(clientX: number, clientY: number): THREE.Sprite | null {
  if (!camera || markerSprites.length === 0) return null
  pointer.copy(toNDC(clientX, clientY))
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(markerSprites, false)
  return hits.length > 0 ? (hits[0].object as THREE.Sprite) : null
}

function onMouseDown(e: MouseEvent): void {
  dragging = true
  moved = false
  downX = e.clientX
  downY = e.clientY
  lastX = e.clientX
  lastY = e.clientY
  targetLon = null
  targetLat = null
}

let lastX = 0
let lastY = 0
function onMouseMove(e: MouseEvent): void {
  if (dragging) {
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 4) moved = true
    lon = (lon + dx * 0.5 + 360) % 360
    if (lon > 180) lon -= 360
    lat = Math.max(-85, Math.min(85, lat - dy * 0.5))
    lastX = e.clientX
    lastY = e.clientY
    return
  }
  // 悬停：命中标记则播放章节动物叫声
  const hit = intersectMarker(e.clientX, e.clientY)
  if (hit) {
    const idx = markerSprites.indexOf(hit)
    if (idx >= 0 && idx !== lastHoverChapter) {
      lastHoverChapter = idx
      const loc = chapterLocations[idx]
      emitHoverAnimal(loc.chapter)
    }
  } else {
    lastHoverChapter = -1
  }
}

function onMouseUp(e: MouseEvent): void {
  if (!dragging) return
  dragging = false
  if (!moved) {
    // 点击选中章节
    const hit = intersectMarker(e.clientX, e.clientY)
    if (hit) {
      const idx = markerSprites.indexOf(hit)
      if (idx >= 0) emit('select', chapterLocations[idx].chapter)
    }
  }
}

function onMouseLeave(): void {
  dragging = false
  lastHoverChapter = -1
}

function onTouchStart(e: TouchEvent): void {
  const t = e.touches[0]
  onMouseDown({ clientX: t.clientX, clientY: t.clientY } as MouseEvent)
}
function onTouchMove(e: TouchEvent): void {
  const t = e.touches[0]
  onMouseMove({ clientX: t.clientX, clientY: t.clientY } as MouseEvent)
}
function onTouchEnd(e: TouchEvent): void {
  const t = e.changedTouches[0]
  onMouseUp({ clientX: t.clientX, clientY: t.clientY } as MouseEvent)
}

/** 悬停某章节时，播放该章节第一种动物叫声 */
function emitHoverAnimal(chapter: number): void {
  const ch = props.chapters.find((c) => c.id === chapter)
  const animal = ch?.animals?.[0]
  if (animal) emit('hover-animal', animal)
}

/** 动画循环 */
function animLoop(): void {
  if (disposed) return

  // 平滑旋转到目标
  if (targetLon != null && targetLat != null) {
    const dLon = targetLon - lon
    const dLat = targetLat - lat
    if (Math.abs(dLon) < 0.3 && Math.abs(dLat) < 0.3) {
      lon = targetLon
      lat = targetLat
      targetLon = null
      targetLat = null
    } else {
      lon += dLon * 0.08
      lat += dLat * 0.08
    }
  } else if (!dragging) {
    // 空闲自动缓慢旋转
    lon += 0.08
    if (lon > 180) lon -= 360
  }

  // 云层缓慢漂移
  if (clouds) clouds.rotation.y += 0.0004

  applyRotation()
  updateActiveRing()

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
  animFrame = requestAnimationFrame(animLoop)
}

/** 平滑旋转到指定章节 */
function rotateToChapter(chapter: number): void {
  const loc = chapterLocations.find((c) => c.chapter === chapter)
  if (!loc) return
  let dLon = loc.lon - lon
  while (dLon > 180) dLon -= 360
  while (dLon < -180) dLon += 360
  targetLon = lon + dLon
  targetLat = loc.lat
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
  targetLon = null
  targetLat = null
  lon -= 30
  if (lon < -180) lon += 360
}

function rotateRight(): void {
  targetLon = null
  targetLat = null
  lon += 30
  if (lon > 180) lon -= 360
}

/** 清理 Three.js 资源 */
function dispose(): void {
  disposed = true
  cancelAnimationFrame(animFrame)
  scene?.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
    else if (mat) mat.dispose()
  })
  renderer?.dispose()
  if (renderer?.domElement && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement)
  }
  renderer = null
  scene = null
  camera = null
  earthGroup = null
  earthMesh = null
  clouds = null
  halo = null
  activeRing = null
  markerSprites = []
}

onMounted(() => {
  initScene()
})

onUnmounted(() => {
  dispose()
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

.earth-container {
  position: relative;
  cursor: grab;
  border-radius: 50%;
}

.earth-container:active {
  cursor: grabbing;
}

.earth-container canvas {
  display: block;
  border-radius: 50%;
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