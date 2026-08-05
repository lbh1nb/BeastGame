<template>
  <div class="home">
    <!-- 装饰性气泡 / 云朵 -->
    <div class="bubble bubble--1" />
    <div class="bubble bubble--2" />
    <div class="bubble bubble--3" />
    <div class="cloud cloud--1" />
    <div class="cloud cloud--2" />

    <!-- 装饰小动物（散布在空旷区域，浮动+悬停弹跳+点击动物音效） -->
    <div
      v-for="(a, i) in decorAnimals"
      :key="i"
      class="decor-animal"
      :style="{
        top: a.top,
        left: a.left,
        right: a.right,
        bottom: a.bottom,
        animationDelay: a.delay,
        animationDuration: a.dur
      }"
      @mouseenter="a.hover = true"
      @mouseleave="a.hover = false"
      @click="handleDecorClick(a)"
    >
      <PixelAnimal :animal="a.animal" :hover="a.hover" :size="a.size" />
    </div>

    <!-- 顶部覆盖层：左上金币胶囊 + 右上设置/记录圆图标 -->
    <div class="top-bar">
      <button
        class="coin-pill"
        @mouseenter="audioManager.playHover()"
        @click="go('/shop')"
      >
        <img class="coin-pill__icon" :src="assetUrl('ui/coin.png')" alt="金币" />
        <span class="coin-pill__num">{{ inventory.coin }}</span>
      </button>
      <div class="corner-buttons">
        <button class="round-btn" title="设置" @mouseenter="audioManager.playHover()" @click="go('/settings')">
          ⚙️
        </button>
        <button class="round-btn" title="对战记录" @mouseenter="audioManager.playHover()" @click="go('/records')">
          🏆
        </button>
      </div>
    </div>

    <!-- 标题区 -->
    <div class="title-wrap">
      <h1 class="title">兽了个兽</h1>
      <p class="subtitle">Q萌消除 · 多模式闯关</p>
    </div>

    <!-- 中部显眼区：3 张宝石卡片（挑战 / 商店 / 收藏册） -->
    <div class="economy">
      <div
        v-for="c in econCards"
        :key="c.key"
        class="econ-card"
        :class="[`econ-card--${c.cls}`, { 'is-lack': lackOf(c) }]"
        @mouseenter="audioManager.playHover()"
        @click="go(c.path)"
      >
        <div class="econ-icon">
          <img :src="assetUrl(`ui/${c.icon}.png`)" :alt="c.name" />
        </div>
        <div class="econ-name">{{ c.name }}</div>
        <div class="econ-desc">{{ c.desc }}</div>
        <div class="econ-badge">{{ badgeOf(c) }}</div>
      </div>
    </div>

    <!-- 主按钮区 -->
    <div class="menu">
      <BaseButton size="lg" type="primary" @click="go('/game/classic3')">
        <span class="menu-emoji">🐾</span> 经典3消
      </BaseButton>
      <BaseButton size="lg" type="secondary" @click="go('/game/classic4')">
        <span class="menu-emoji">✨</span> 四消模式
      </BaseButton>
      <BaseButton size="lg" type="ghost" @click="go('/levels')">
        <span class="menu-emoji">🗺️</span> 闯关模式
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 主菜单（v11 经济中心版）
 * - 顶部覆盖层：左上金币胶囊（点进商店）、右上设置/记录圆形图标
 * - 中部显眼区：3 张宝石卡片 —— 挑战 / 商店 / 收藏册（带渐变底色、3D 阴影、数据角标）
 * - 下方：经典3消 / 四消模式 / 闯关模式 3 个主按钮
 * - 四周散布装饰小动物，浮动+悬停弹跳+点击动物音效
 * - 进入页面播放主菜单 BGM，离开时停止
 */
import { reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@components/common/BaseButton.vue'
import PixelAnimal from '@components/game/PixelAnimal.vue'
import audioManager from '@audio/manager'
import { useInventoryStore } from '@stores/inventory'
import { useCollectionStore } from '@stores/collection'
import { assetUrl } from '@utils/asset-url'
import type { AnimalType } from '@game/types'

const router = useRouter()
const inventory = useInventoryStore()
const collection = useCollectionStore()

/** 收藏册总量（与 types.ts 的 56 种动物保持一致） */
const TOTAL_COLLECTION = 56

/** 中部宝石卡片配置 */
interface EconCard {
  key: string
  name: string
  desc: string
  icon: string
  path: string
  cls: string
}

const econCards: EconCard[] = [
  { key: 'challenge', name: '挑战模式', desc: '随机谜局 · 限时冲榜', icon: 'challenge', path: '/challenge', cls: 'challenge' },
  { key: 'shop', name: '商店', desc: '金币换道具', icon: 'shop', path: '/shop', cls: 'shop' },
  { key: 'collection', name: '收藏册', desc: '收集小动物', icon: 'collection', path: '/collection', cls: 'collection' }
]

/** 挑战门票成本（与 Challenge.vue 保持一致） */
const TICKET_COST = 100

/** 各卡片右下角徽章文案 */
function badgeOf(c: EconCard): string {
  if (c.key === 'shop') return `🪙 ${inventory.coin}`
  if (c.key === 'collection') return `${collection.count} / ${TOTAL_COLLECTION}`
  if (c.key === 'challenge') return inventory.coin < TICKET_COST ? '🎫 金币不足' : '▶ 开始'
  return '▶ 开始'
}

/** 金币不足时是否置灰（仅挑战卡，门票不足） */
function lackOf(c: EconCard): boolean {
  return c.key === 'challenge' && inventory.coin < TICKET_COST
}

/** 装饰小动物配置（8只色相分散的动物，散布在空旷区域） */
interface DecorAnimal {
  animal: AnimalType
  size: number
  top?: string
  left?: string
  right?: string
  bottom?: string
  delay: string
  dur: string
  hover: boolean
}

const decorAnimals = reactive<DecorAnimal[]>([
  // 标题两侧
  { animal: 'sheep', size: 56, top: '11%', left: '7%', delay: '0s', dur: '5s', hover: false },
  { animal: 'pig', size: 52, top: '12%', right: '7%', delay: '1s', dur: '5.5s', hover: false },
  // 中部卡片左右
  { animal: 'chicken', size: 48, top: '38%', left: '4%', delay: '0.5s', dur: '4.5s', hover: false },
  { animal: 'fox', size: 50, top: '40%', right: '4%', delay: '1.5s', dur: '5s', hover: false },
  // 主按钮左右
  { animal: 'dog', size: 54, top: '62%', left: '8%', delay: '2s', dur: '6s', hover: false },
  { animal: 'frog', size: 46, top: '64%', right: '8%', delay: '0.8s', dur: '4.8s', hover: false },
  // 底部按钮上方
  { animal: 'tiger', size: 58, bottom: '10%', left: '12%', delay: '1.2s', dur: '5.2s', hover: false },
  { animal: 'penguin', size: 56, bottom: '12%', right: '12%', delay: '2.5s', dur: '5.8s', hover: false }
])

onMounted(() => {
  audioManager.playBgm('home').catch(() => {
    // 音频加载失败不影响游戏运行
  })
  inventory.load()
  collection.load()
})

onUnmounted(() => {
  audioManager.stopBgm()
})

/** 装饰动物点击：播放真实动物音效（不受温和模式影响），悬停弹跳眨眼由 mouseenter 驱动 */
function handleDecorClick(a: DecorAnimal): void {
  audioManager.playDecorAnimalSound(a.animal)
}

function playHover(): void {
  audioManager.playHover()
}

function go(path: string): void {
  router.push(path)
}
</script>

<style scoped>
.home {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 26px;
  padding: 92px 28px 40px;
  overflow: hidden;
  background: linear-gradient(180deg, #fff5e1 0%, #ffe9c4 100%);
}

/* ===== 顶部覆盖层 ===== */
.top-bar {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 28px;
  z-index: 5;
}

.coin-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, #ffd76e 0%, #ffb84d 100%);
  color: #7a4a00;
  font-weight: 800;
  font-size: 16px;
  box-shadow: 0 4px 0 #e09a2e, 0 6px 14px rgba(255, 165, 0, 0.35);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.coin-pill:hover {
  filter: brightness(1.05);
}

.coin-pill:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #e09a2e, 0 3px 10px rgba(255, 165, 0, 0.3);
}

.coin-pill__icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.corner-buttons {
  display: flex;
  gap: 12px;
}

.round-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  font-size: 20px;
  box-shadow: 0 3px 0 var(--color-border);
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
}

.round-btn:hover {
  filter: brightness(1.03);
}

.round-btn:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--color-border);
}

/* ===== 标题 ===== */
.title-wrap {
  text-align: center;
  z-index: 2;
}

.title {
  font-size: 50px;
  font-weight: 900;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #ffb84d 0%, #ff6b9d 60%, #ffb84d 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 0 rgba(255, 165, 0, 0.15);
  animation: title-bounce 2.5s ease-in-out infinite;
}

@keyframes title-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.subtitle {
  margin-top: 8px;
  font-size: 15px;
  color: var(--color-text-light);
  letter-spacing: 2px;
}

/* ===== 中部经济卡片 ===== */
.economy {
  display: flex;
  gap: 18px;
  width: 100%;
  max-width: 720px;
  z-index: 2;
}

.econ-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 12px 16px;
  border-radius: var(--radius-lg);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.18), 0 10px 20px rgba(0, 0, 0, 0.12);
  transition: transform 0.14s ease, box-shadow 0.14s ease, filter 0.14s ease;
  user-select: none;
}

.econ-card:hover {
  transform: translateY(-4px) scale(1.03);
  filter: brightness(1.06);
  box-shadow: 0 10px 0 rgba(0, 0, 0, 0.18), 0 16px 26px rgba(0, 0, 0, 0.16);
}

.econ-card:active {
  transform: translateY(2px) scale(0.98);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.18);
}

/* 金币不足：卡片降饱和置灰，角标用警示色 */
.econ-card.is-lack {
  filter: grayscale(0.55) brightness(0.92);
}

.econ-card.is-lack .econ-badge {
  background: rgba(0, 0, 0, 0.28);
  color: #ffe9c4;
}

/* 三张卡片各自的渐变主题 */
.econ-card--challenge {
  background: linear-gradient(160deg, #a855f7 0%, #6366f1 100%);
}

.econ-card--shop {
  background: linear-gradient(160deg, #ffb84d 0%, #ff8a3d 100%);
}

.econ-card--collection {
  background: linear-gradient(160deg, #ff6b9d 0%, #ec4899 100%);
}

.econ-icon {
  width: 62px;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.15);
}

.econ-icon img {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.econ-name {
  margin-top: 2px;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.econ-desc {
  font-size: 12px;
  opacity: 0.92;
  line-height: 1.3;
  text-align: center;
}

.econ-badge {
  margin-top: 4px;
  padding: 3px 12px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.28);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

/* ===== 主菜单按钮 ===== */
.menu {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 82%;
  max-width: 360px;
  z-index: 2;
}

.menu :deep(.base-btn) {
  width: 100%;
}

.menu-emoji {
  font-size: 22px;
}

/* 装饰气泡 */
.bubble {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.5;
  z-index: 1;
  animation: float 6s ease-in-out infinite;
}

.bubble--1 {
  width: 120px;
  height: 120px;
  background: var(--color-secondary);
  top: 14%;
  left: -30px;
}

.bubble--2 {
  width: 80px;
  height: 80px;
  background: var(--color-accent);
  top: 46%;
  right: -20px;
  animation-delay: 1.5s;
}

.bubble--3 {
  width: 60px;
  height: 60px;
  background: var(--color-primary);
  bottom: 18%;
  left: 10%;
  animation-delay: 3s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

/* 云朵 */
.cloud {
  position: absolute;
  background: #fff;
  border-radius: 50px;
  opacity: 0.7;
  z-index: 1;
}

.cloud--1 {
  width: 100px;
  height: 36px;
  top: 9%;
  right: 12%;
  box-shadow: 30px 8px 0 -4px #fff, -28px 6px 0 -2px #fff;
}

.cloud--2 {
  width: 80px;
  height: 28px;
  bottom: 26%;
  right: 18%;
  box-shadow: 24px 6px 0 -3px #fff, -22px 5px 0 -2px #fff;
}

/* 装饰小动物 */
.decor-animal {
  position: absolute;
  z-index: 1;
  cursor: pointer;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  animation: decor-float 5s ease-in-out infinite;
  transition: transform 0.2s ease;
}

.decor-animal:hover {
  animation-play-state: paused;
  transform: scale(1.15) translateY(-4px);
  z-index: 3;
}

@keyframes decor-float {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }
  50% {
    transform: translateY(-12px) rotate(2deg);
  }
}
</style>