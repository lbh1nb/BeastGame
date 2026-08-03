<template>
  <div
    class="tile"
    :class="{
      'tile--covered': isCovered,
      'tile--hint': isHint,
      'tile--removed': tile.removed,
      'tile--hover': isHover,
      'tile--rejected': rejectedBump,
      'tile--revealing': animKind === 'revealing',
      'tile--animal-hidden': animKind !== 'revealing' && isHiddenStuck
    }"
    :style="{ background: bgColor }"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <PixelAnimal
      :class="{ 'pixel-animal--hidden-in': animKind === 'revealing' }"
      v-show="!isHiddenStuck || animKind === 'revealing'"
      :animal="tile.animal"
      :hover="isSelected"
      :size="animalSize"
    />
    <span
      v-if="isSelected"
      class="tile-pick-ripple"
    />

    <!-- 机制遮罩层 -->
    <div
      v-if="mechanicType && mechanicStuck && !isCovered && !tile.removed"
      class="mech-overlay"
      :class="[
        `mech--${mechanicType}`,
        animClass,
        { 'mech--hidden-out': animKind === 'revealing' }
      ]"
    >
      <!-- 主元素图 -->
      <img
        class="mech-main"
        :src="mainImg"
        :alt="mechanicType"
        draggable="false"
      />
      <!-- 闪电闪光层（仅 moody idle 时） -->
      <div v-if="mechanicType === 'moody'" class="mech-lightning" />
      <!-- 消失爆发特效层（resolving/breaking 时显示，强调是哪个机制被解除） -->
      <img
        v-if="showBurst && burstImg"
        class="mech-burst"
        :src="burstImg"
        :alt="`burst-${mechanicType}`"
        draggable="false"
      />
      <!-- 解除瞬间的白色闪光 -->
      <div v-if="showBurst" class="mech-flash" />
    </div>

    <!-- 解除/破除粒子（在 resolving/breaking 期间显示） -->
    <div
      v-if="showParticles"
      class="mech-particles"
    >
      <img
        v-for="p in particles"
        :key="p.id"
        class="mech-particle"
        :class="`mech-particle--${p.kind}`"
        :src="p.url"
        :style="{
          '--tx': p.tx + 'px',
          '--ty': p.ty + 'px',
          '--delay': p.delay + 'ms',
          '--rot': p.rot + 'deg',
          width: p.size + 'px',
          height: p.size + 'px'
        }"
        draggable="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 单个图案（麻将牌式方块）- 像素风 Q 萌版
 * v11: 用 Seedream 生成的像素风元素图 + CSS 动画替代 Canvas 静态遮罩：
 *   - idle 持续动画：漂浮/脉动/摇摆（moody 漂+闪电, vine 摇摆, sleepy 漂+呼吸, bubble 呼吸, hidden 发光）
 *   - resolving 解除动画（moody/sleepy）：主元素漂走 + 粒子飞出
 *   - breaking 破除动画（vine/bubble）：主元素破碎 + 粒子四散
 *   - revealing 翻牌（hidden）：CSS rotateY 翻转
 *   - rejected 点击被拒：本地 shake + 红闪（moody/sleepy 点不动时）
 */
import { ref, computed, watch, onMounted } from 'vue'
import type { Tile as TileType, MechanicType } from '@game/types'
import PixelAnimal from './PixelAnimal.vue'
import { getAnimalBgColor } from '@utils/pixel-animal'
import { getMechanicImageUrl, type MechanicAssetName } from '@utils/mechanic-image'
import { useGameStore } from '@stores/game'

interface Props {
  tile: TileType
  isHint?: boolean
  isCovered?: boolean
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isHint: false,
  isCovered: false,
  isSelected: false
})

const emit = defineEmits<{
  (e: 'pick', tileId: number): void
}>()

const gameStore = useGameStore()

/** 悬停状态 */
const isHover = ref(false)
/** 点击被拒（moody/sleepy 挡住）本地 shake 反馈 */
const rejectedBump = ref(false)
let rejectedTimer: number | null = null

/** 动物渲染尺寸（px） */
const animalSize = 48
/** 背景色 */
const bgColor = computed(() => getAnimalBgColor(props.tile.animal))

/** 机制相关 */
const mechanicType = computed<MechanicType | null>(() => props.tile.mechanicState?.type ?? null)
const mechanicStuck = computed(() => (props.tile.mechanicState?.stuck ?? 0) > 0)
const isHiddenStuck = computed(() => mechanicType.value === 'hidden' && mechanicStuck.value)

/** 主元素图（懒加载） */
const mainImg = ref<string | undefined>(undefined)
const burstImg = ref<string | undefined>(undefined)
const assetMap: Record<MechanicType, MechanicAssetName> = {
  moody: 'moody_cloud',
  vine: 'vine',
  sleepy: 'sleepy_zzz',
  bubble: 'bubble',
  hidden: 'hidden_q'
}
const burstAssetMap: Record<MechanicType, MechanicAssetName> = {
  moody: 'burst_moody',
  vine: 'burst_vine',
  sleepy: 'burst_sleepy',
  bubble: 'burst_bubble',
  hidden: 'burst_hidden'
}

async function loadMainImg() {
  if (!mechanicType.value || !mechanicStuck.value) {
    mainImg.value = undefined
    burstImg.value = undefined
    return
  }
  const url = await getMechanicImageUrl(assetMap[mechanicType.value])
  const burstUrl = await getMechanicImageUrl(burstAssetMap[mechanicType.value])
  // 仅在仍需要时赋值
  if (mechanicType.value && mechanicStuck.value) {
    mainImg.value = url
    burstImg.value = burstUrl
  }
}
watch([mechanicType, mechanicStuck], loadMainImg, { immediate: true })

/** 当前动画阶段（来自 store） */
const animState = computed(() => gameStore.mechanicAnims.get(props.tile.id) ?? null)
const animKind = computed(() => animState.value?.kind ?? null)

/** overlay 动画类 */
const animClass = computed(() => {
  const k = animKind.value
  if (k === 'resolving') return 'mech-resolving'
  if (k === 'breaking') return 'mech-breaking'
  return 'mech-idle'
})

/** 是否显示粒子（resolving/breaking 期间） */
const showParticles = computed(() => {
  const k = animKind.value
  return k === 'resolving' || k === 'breaking'
})

/** 是否显示爆发特效层（resolving/breaking 期间） */
const showBurst = computed(() => {
  const k = animKind.value
  return k === 'resolving' || k === 'breaking'
})

interface Particle {
  id: number
  kind: MechanicAssetName
  url: string
  tx: number
  ty: number
  delay: number
  rot: number
  size: number
}

/** 粒子配置（按需生成，粒子 url 异步加载） */
const particles = ref<Particle[]>([])

function buildParticles(kind: 'resolving' | 'breaking', type: MechanicType | undefined) {
  const list: Particle[] = []
  let id = 0
  const rand = (min: number, max: number) => min + Math.random() * (max - min)
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const addBatch = (kindName: MechanicAssetName, count: number, sizeRange: [number, number], distRange: [number, number]) => {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, 360)
      const dist = rand(distRange[0], distRange[1])
      list.push({
        id: id++,
        kind: kindName,
        url: '',
        tx: Math.cos(toRad(angle)) * dist,
        ty: Math.sin(toRad(angle)) * dist + 8,
        delay: rand(0, 120),
        rot: rand(-180, 180),
        size: rand(sizeRange[0], sizeRange[1])
      })
    }
  }

  if (kind === 'resolving' && type === 'moody') {
    addBatch('cloud_piece', 5, [10, 18], [22, 38])
    addBatch('star', 5, [8, 14], [26, 40])
  } else if (kind === 'breaking' && type === 'vine') {
    addBatch('leaf_particle', 6, [10, 18], [24, 40])
  } else if (kind === 'breaking' && type === 'bubble') {
    addBatch('droplet', 7, [7, 14], [20, 36])
  } else if (kind === 'resolving' && type === 'sleepy') {
    addBatch('star', 5, [8, 14], [22, 36])
  }
  // 异步填充 url
  for (const p of list) {
    getMechanicImageUrl(p.kind).then((url) => {
      p.url = url ?? ''
    })
  }
  particles.value = list
}

/** 监听动画阶段变化，rebuild 粒子 */
watch(animKind, (k, prevK) => {
  if (k && k !== prevK && (k === 'resolving' || k === 'breaking')) {
    buildParticles(k, animState.value?.type)
  }
  if (!k) {
    particles.value = []
  }
})

function handleClick(): void {
  if (props.isCovered) return
  if (props.tile.removed) return
  if (props.tile.inSlot) return

  // moody/sleepy 点击被拒：本地 shake 反馈
  const ms = props.tile.mechanicState
  if (ms && (ms.type === 'moody' || ms.type === 'sleepy') && ms.stuck > 0) {
    triggerRejected()
  }
  emit('pick', props.tile.id)
}

function triggerRejected() {
  rejectedBump.value = false
  // 下一帧再加 class，确保动画重放
  requestAnimationFrame(() => {
    rejectedBump.value = true
    if (rejectedTimer) window.clearTimeout(rejectedTimer)
    rejectedTimer = window.setTimeout(() => {
      rejectedBump.value = false
    }, 250)
  })
}

function handleMouseEnter(): void {
  if (props.isCovered || props.tile.removed) return
  isHover.value = true
}
function handleMouseLeave(): void {
  isHover.value = false
}

onMounted(() => {
  // 预加载常用粒子图，避免首次触发时空白
  getMechanicImageUrl('star')
  getMechanicImageUrl('cloud_piece')
  getMechanicImageUrl('leaf_particle')
  getMechanicImageUrl('droplet')
})
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
  transform-style: preserve-3d;
  perspective: 300px;
  overflow: visible;
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

/* 被覆盖 */
.tile--covered {
  opacity: 0.25;
  filter: grayscale(0.8) brightness(0.7);
  cursor: not-allowed;
  pointer-events: none;
}

.tile:not(.tile--covered):not(.tile--removed) {
  box-shadow:
    0 3px 0 rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    inset 0 0 0 2px rgba(255, 255, 255, 0.6),
    0 0 8px rgba(255, 220, 100, 0.2);
}

/* 提示高亮 */
.tile--hint {
  animation: hint-pulse 0.8s ease-in-out infinite;
  box-shadow: 0 0 0 3px var(--color-warning), 0 2px 0 rgba(0, 0, 0, 0.12);
  z-index: 5;
}
@keyframes hint-pulse {
  0%, 100% { box-shadow: 0 0 0 3px var(--color-warning), 0 2px 0 rgba(0,0,0,0.12); }
  50% { box-shadow: 0 0 0 5px #ffd54f, 0 2px 0 rgba(0,0,0,0.12); }
}

/* 进入/离场 */
.tile-enter-active { transition: all 0.25s ease; }
.tile-leave-active { transition: all 0.25s ease; }
.tile-enter-from { opacity: 0; transform: scale(0.6); }
.tile-leave-to { opacity: 0; transform: scale(0.4) rotate(15deg); }

/* 点击光圈 */
.tile-pick-ripple {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  pointer-events: none;
  z-index: 3;
  box-shadow: 0 0 0 2px var(--color-primary);
  animation: pick-ripple 0.4s ease-out forwards;
}
@keyframes pick-ripple {
  0% { box-shadow: 0 0 0 2px var(--color-primary), 0 0 0 0 rgba(255,200,60,0.6); }
  100% { box-shadow: 0 0 0 2px var(--color-primary), 0 0 0 10px rgba(255,200,60,0); }
}

/* 点击被拒 shake（Q弹版：带轻微缩放和红闪提示） */
.tile--rejected {
  animation: rejected-shake 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
@keyframes rejected-shake {
  0%, 100% { transform: translateX(0) scale(1); }
  15% { transform: translateX(-5px) scale(0.96); }
  30% { transform: translateX(5px) scale(1.02); filter: brightness(1.15) sepia(0.4) hue-rotate(-25deg); }
  45% { transform: translateX(-4px) scale(0.98); }
  60% { transform: translateX(4px) scale(1.01); }
  75% { transform: translateX(-2px); }
}

/* hidden 翻牌 */
.tile--revealing {
  animation: reveal-flip 0.5s ease forwards;
}
@keyframes reveal-flip {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(90deg); }
  100% { transform: rotateY(0deg); }
}
/* hidden 状态下动物隐藏（问号覆盖时） */
.tile--animal-hidden :deep(.pixel-animal) {
  opacity: 0;
}
/* 翻牌时动物淡入（50% 后出现） */
:deep(.pixel-animal--hidden-in) {
  animation: animal-reveal-in 0.5s ease forwards;
}
@keyframes animal-reveal-in {
  0%, 49% { opacity: 0; }
  50%, 100% { opacity: 1; }
}
/* 翻牌时问号淡出（50% 前消失） */
.mech--hidden-out {
  animation: overlay-reveal-out 0.5s ease forwards;
}
@keyframes overlay-reveal-out {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

/* ========== 机制遮罩通用 ========== */
.mech-overlay {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  pointer-events: none;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}
.mech-main {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
  image-rendering: pixelated;
  transform-origin: center center;
}

/* ---- idle 持续动画（各类型差异，Q萌像素风优化） ---- */
.mech-idle.mech--moody .mech-main {
  animation: mech-idle-float 2s ease-in-out infinite;
}
.mech-idle.mech--vine .mech-main {
  animation: mech-idle-sway 2.4s ease-in-out infinite;
  transform-origin: center top;
}
.mech-idle.mech--sleepy .mech-main {
  animation: mech-idle-drift 2.6s ease-in-out infinite;
}
.mech-idle.mech--bubble .mech-main {
  animation: mech-idle-breathe 1.6s ease-in-out infinite;
}
.mech-idle.mech--hidden .mech-main {
  animation: mech-idle-glow 1.4s ease-in-out infinite;
}

@keyframes mech-idle-float {
  0%, 100% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-2px) scale(1.01, 0.99); }
  50% { transform: translateY(-5px) scale(1.03); }
  75% { transform: translateY(-2px) scale(0.99, 1.01); }
}
@keyframes mech-idle-sway {
  0%, 100% { transform: rotate(-8deg) translateY(0); }
  50% { transform: rotate(8deg) translateY(-3px); }
}
@keyframes mech-idle-drift {
  0%, 100% { transform: translateY(2px) scale(0.98); opacity: 0.85; }
  50% { transform: translateY(-4px) scale(1.05); opacity: 1; }
}
@keyframes mech-idle-breathe {
  0%, 100% { transform: scale(0.92); }
  50% { transform: scale(1.06); }
}
@keyframes mech-idle-glow {
  0%, 100% {
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4)) drop-shadow(0 0 3px rgba(255,215,0,0.4));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4)) drop-shadow(0 0 10px rgba(255,215,0,0.9)) drop-shadow(0 0 18px rgba(255,180,0,0.5));
    transform: scale(1.05);
  }
}

/* moody 闪电闪光（Q萌风格：带淡紫色闪电氛围） */
.mech-lightning {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0);
  animation: mech-lightning-flash 2.8s ease-in-out infinite;
  pointer-events: none;
}
@keyframes mech-lightning-flash {
  0%, 88%, 100% { background: rgba(180, 160, 255, 0); box-shadow: inset 0 0 0 rgba(255,255,100,0); }
  89% { background: rgba(255, 255, 255, 0); box-shadow: inset 0 0 0 rgba(255,255,100,0); }
  90% { background: rgba(255, 255, 220, 0.75); box-shadow: inset 0 0 20px rgba(255,255,100,0.8); }
  91% { background: rgba(255, 255, 255, 0); box-shadow: inset 0 0 0 rgba(255,255,100,0); }
  93% { background: rgba(255, 240, 255, 0.5); box-shadow: inset 0 0 12px rgba(200,180,255,0.6); }
  94% { background: rgba(255, 255, 255, 0); }
}

/* ---- resolving 解除动画（moody 云散 / sleepy 醒） ---- */
/* 主元素先放大强调（让玩家看清是哪个机制），再缩小淡出 */
.mech-resolving .mech-main {
  animation: mech-resolve-main 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
.mech-resolving.mech--moody .mech-main {
  animation-name: mech-resolve-cloud;
}
.mech-resolving.mech--sleepy .mech-main {
  animation-name: mech-resolve-floatup;
}
@keyframes mech-resolve-cloud {
  0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
  20% { transform: translateY(-2px) scale(1.35) rotate(-4deg); opacity: 1; }
  45% { transform: translateY(-10px) scale(1.2) rotate(6deg); opacity: 1; }
  100% { transform: translateY(-46px) scale(0.15) rotate(-14deg); opacity: 0; }
}
@keyframes mech-resolve-floatup {
  0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
  20% { transform: translateY(-4px) scale(1.35) rotate(8deg); opacity: 1; }
  45% { transform: translateY(-14px) scale(1.15) rotate(14deg); opacity: 1; }
  100% { transform: translateY(-52px) scale(0.15) rotate(30deg); opacity: 0; }
}
@keyframes mech-resolve-main {
  0% { opacity: 1; }
  20% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---- breaking 破除动画（vine 断裂 / bubble 破碎） ---- */
/* 主元素先放大强调，再碎裂消失 */
.mech-breaking .mech-main {
  animation: mech-break-main 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
.mech-breaking.mech--vine .mech-main {
  animation-name: mech-break-vine;
  transform-origin: left center;
}
.mech-breaking.mech--bubble .mech-main {
  animation-name: mech-break-bubble;
}
@keyframes mech-break-vine {
  0% { transform: rotate(0) scale(1); opacity: 1; }
  20% { transform: rotate(-12deg) scale(1.35); opacity: 1; }
  40% { transform: rotate(20deg) scale(1.1); }
  100% { transform: rotate(55deg) scale(0.15) translateY(18px); opacity: 0; }
}
@keyframes mech-break-bubble {
  0% { transform: scale(1); opacity: 1; }
  20% { transform: scale(1.4); opacity: 1; }
  45% { transform: scale(1.55); opacity: 0.9; }
  65% { transform: scale(1.6); opacity: 0.5; filter: blur(1px); }
  100% { transform: scale(0.1); opacity: 0; }
}
@keyframes mech-break-main {
  0% { opacity: 1; }
  20% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---- 消失爆发特效层（强调是哪个机制被解除） ---- */
.mech-burst {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  pointer-events: none;
  z-index: 3;
  transform-origin: center center;
  animation: mech-burst-pop 0.6s cubic-bezier(0.16, 0.84, 0.44, 1) forwards;
}
@keyframes mech-burst-pop {
  0% { transform: scale(0.2) rotate(0deg); opacity: 0; }
  18% { transform: scale(1.25) rotate(0deg); opacity: 1; }
  45% { transform: scale(1.45) rotate(8deg); opacity: 1; }
  100% { transform: scale(1.9) rotate(-12deg); opacity: 0; }
}

/* ---- 解除瞬间的白色闪光 ---- */
.mech-flash {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  pointer-events: none;
  z-index: 4;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 70%);
  animation: mech-flash-out 0.45s ease-out forwards;
}
@keyframes mech-flash-out {
  0% { opacity: 0; transform: scale(0.4); }
  25% { opacity: 1; transform: scale(1.15); }
  100% { opacity: 0; transform: scale(1.6); }
}

/* ========== 粒子（JS 预计算 tx/ty，CSS 直接使用，无 cos/sin 兼容性问题） ========== */
.mech-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
  overflow: visible;
}
.mech-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-left: calc(var(--size, 10px) * -0.5);
  margin-top: calc(var(--size, 10px) * -0.5);
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));
  animation: mech-particle-fly 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: var(--delay, 0ms);
  opacity: 0;
  will-change: transform, opacity;
}
@keyframes mech-particle-fly {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(0.2);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translate(calc(var(--tx) * 0.25px), calc(var(--ty) * 0.25px)) rotate(calc(var(--rot) * 0.2deg)) scale(1.1);
  }
  50% {
    opacity: 1;
    transform: translate(calc(var(--tx) * 0.7px), calc(var(--ty) * 0.6px)) rotate(calc(var(--rot) * 0.6deg)) scale(1);
  }
  100% {
    transform: translate(calc(var(--tx) * 1px), calc(var(--ty) * 1px)) rotate(var(--rot)) scale(0.4);
    opacity: 0;
  }
}
</style>
