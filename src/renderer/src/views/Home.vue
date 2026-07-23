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

    <!-- 标题区 -->
    <div class="title-wrap">
      <h1 class="title">兽了个兽</h1>
      <p class="subtitle">Q萌消除 · 多模式闯关</p>
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

    <!-- 底部小按钮 -->
    <div class="footer">
      <BaseButton size="md" type="ghost" @click="go('/settings')">⚙️ 设置</BaseButton>
      <BaseButton size="md" type="ghost" @click="go('/records')">🏆 记录</BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 主菜单
 * - 顶部标题 + 副标题（渐变色）
 * - 中间 3 个大按钮：经典3消 / 四消模式 / 闯关模式
 * - 底部 2 个小按钮：设置 / 记录
 * - 四周散布 8 只装饰小动物，浮动+悬停弹跳眨眼
 * - 进入页面播放主菜单 BGM，离开时停止
 */
import { reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@components/common/BaseButton.vue'
import PixelAnimal from '@components/game/PixelAnimal.vue'
import audioManager from '@audio/manager'
import type { AnimalType } from '@game/types'

const router = useRouter()

/** 装饰小动物配置（散布在空旷区域，8只色相分散的动物） */
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
  { animal: 'sheep', size: 56, top: '10%', left: '8%', delay: '0s', dur: '5s', hover: false },
  { animal: 'pig', size: 52, top: '12%', right: '8%', delay: '1s', dur: '5.5s', hover: false },
  // 中部按钮左右
  { animal: 'chicken', size: 48, top: '38%', left: '6%', delay: '0.5s', dur: '4.5s', hover: false },
  { animal: 'fox', size: 50, top: '40%', right: '6%', delay: '1.5s', dur: '5s', hover: false },
  // 中下按钮左右
  { animal: 'dog', size: 54, top: '55%', left: '10%', delay: '2s', dur: '6s', hover: false },
  { animal: 'frog', size: 46, top: '57%', right: '10%', delay: '0.8s', dur: '4.8s', hover: false },
  // 底部按钮上方
  { animal: 'tiger', size: 58, bottom: '24%', left: '14%', delay: '1.2s', dur: '5.2s', hover: false },
  { animal: 'penguin', size: 56, bottom: '26%', right: '14%', delay: '2.5s', dur: '5.8s', hover: false }
])

onMounted(() => {
  audioManager.playBgm('home').catch(() => {
    // 音频加载失败不影响游戏运行
  })
})

onUnmounted(() => {
  audioManager.stopBgm()
})

/** 装饰动物点击：播放真实动物音效（不受温和模式影响），悬停弹跳眨眼由 mouseenter 驱动 */
function handleDecorClick(a: DecorAnimal): void {
  audioManager.playDecorAnimalSound(a.animal)
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
  justify-content: space-between;
  padding: 80px 40px 50px;
  overflow: hidden;
  background: linear-gradient(180deg, #fff5e1 0%, #ffe9c4 100%);
}

/* 标题 */
.title-wrap {
  text-align: center;
  z-index: 2;
}

.title {
  font-size: 56px;
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
  font-size: 16px;
  color: var(--color-text-light);
  letter-spacing: 2px;
}

/* 主菜单按钮 */
.menu {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 80%;
  max-width: 360px;
  z-index: 2;
}

.menu :deep(.base-btn) {
  width: 100%;
}

.menu-emoji {
  font-size: 22px;
}

/* 底部按钮 */
.footer {
  display: flex;
  gap: 16px;
  width: 80%;
  max-width: 360px;
  z-index: 2;
}

.footer :deep(.base-btn) {
  flex: 1;
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
  top: 12%;
  left: -30px;
}

.bubble--2 {
  width: 80px;
  height: 80px;
  background: var(--color-accent);
  top: 40%;
  right: -20px;
  animation-delay: 1.5s;
}

.bubble--3 {
  width: 60px;
  height: 60px;
  background: var(--color-primary);
  bottom: 22%;
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
  top: 8%;
  right: 12%;
  box-shadow: 30px 8px 0 -4px #fff, -28px 6px 0 -2px #fff;
}

.cloud--2 {
  width: 80px;
  height: 28px;
  bottom: 30%;
  right: 18%;
  box-shadow: 24px 6px 0 -3px #fff, -22px 5px 0 -2px #fff;
}

/* 装饰小动物 */
.decor-animal {
  position: absolute;
  z-index: 1;
  cursor: pointer;
  /* 柔和光晕背景 */
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  animation: decor-float 5s ease-in-out infinite;
  transition: transform 0.2s ease;
}

.decor-animal:hover {
  /* 暂停浮动动画，让 scale 变换生效 */
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
