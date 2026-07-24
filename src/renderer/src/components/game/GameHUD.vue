<template>
  <div class="hud">
    <button class="hud-btn" title="返回" @click="emit('back')">←</button>

    <div class="hud-stats">
      <div class="stat">
        <span class="stat-label">分数</span>
        <span class="stat-value">{{ score }}</span>
      </div>
      <!-- 点击数：居中显眼位置，颜色分级 -->
      <div v-if="clickRemaining >= 0" class="stat stat--clicks" :class="clicksClass">
        <span class="stat-label">🖱️ 点击数</span>
        <span class="stat-value clicks-value">{{ clickRemaining }}</span>
      </div>
      <div class="stat" :class="comboClass">
        <span class="stat-label">连击</span>
        <span class="stat-value combo-value">x{{ combo }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">时长</span>
        <span class="stat-value">{{ timeText }}</span>
      </div>
    </div>

    <div class="hud-actions">
      <button class="hud-btn" title="暂停" @click="emit('pause')">‖</button>
      <button class="hud-btn" title="重开" @click="emit('restart')">↻</button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 游戏顶栏 HUD
 * - 左：返回按钮
 * - 中：分数 / 连击 / 时长
 * - 右：暂停 / 重开
 * - 连击分级配色：0-2 默认 / 3-4 黄 / 5-6 橙 / 7-9 红 / 10-14 紫 / 15-19 金 / 20+ 彩虹
 */
import { computed } from 'vue'
import type { GameMode } from '@game/types'

interface Props {
  score: number
  combo: number
  elapsed: number
  mode: GameMode
  clickRemaining?: number
}

const props = withDefaults(defineProps<Props>(), {
  clickRemaining: -1
})

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'restart'): void
  (e: 'pause'): void
}>()

const timeText = computed(() => {
  const m = Math.floor(props.elapsed / 60)
    .toString()
    .padStart(2, '0')
  const s = (props.elapsed % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

/** 连击分级 class */
const comboClass = computed(() => {
  const c = props.combo
  if (c >= 20) return 'stat--godlike'
  if (c >= 15) return 'stat--unbelievable'
  if (c >= 10) return 'stat--amazing'
  if (c >= 7) return 'stat--great'
  if (c >= 5) return 'stat--nice'
  if (c >= 3) return 'stat--good'
  if (c >= 2) return 'stat--hot'
  return ''
})

/** 点击数颜色分级 */
const clicksClass = computed(() => {
  const c = props.clickRemaining
  if (c < 0) return ''
  if (c === 0) return 'clicks--empty'
  if (c <= 5) return 'clicks--danger'
  if (c <= 15) return 'clicks--warn'
  if (c <= 30) return 'clicks--normal'
  return 'clicks--safe'
})
</script>

<style scoped>
.hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.hud-stats {
  display: flex;
  gap: 18px;
  flex: 1;
  justify-content: center;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 56px;
  transition: transform 0.2s ease;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-light);
}

.stat-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
}

/* 连击分级配色 + 动画 */
.stat--hot .combo-value {
  color: #ffd54f;
  animation: combo-pop 0.3s ease;
}

.stat--good .combo-value {
  color: #ffa726;
  font-size: 20px;
  animation: combo-pop 0.3s ease;
  text-shadow: 0 0 8px rgba(255, 167, 38, 0.5);
}

.stat--nice .combo-value {
  color: #ff7043;
  font-size: 22px;
  animation: combo-pop 0.4s ease;
  text-shadow: 0 0 10px rgba(255, 112, 67, 0.6);
}

.stat--great .combo-value {
  color: #ef5350;
  font-size: 24px;
  animation: combo-pop 0.4s ease;
  text-shadow: 0 0 12px rgba(239, 83, 80, 0.7);
}

.stat--amazing .combo-value {
  color: #ab47bc;
  font-size: 26px;
  font-weight: 900;
  animation: combo-pop 0.5s ease;
  text-shadow: 0 0 14px rgba(171, 71, 188, 0.8);
}

.stat--unbelievable .combo-value {
  color: #ffd700;
  font-size: 28px;
  font-weight: 900;
  animation: combo-pop 0.5s ease, glow-gold 1.5s ease-in-out infinite;
  text-shadow: 0 0 16px rgba(255, 215, 0, 0.9);
}

.stat--godlike .combo-value {
  background: linear-gradient(90deg, #ff1744, #ff9100, #ffea00, #00e676, #00b0ff, #d500f9);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 30px;
  font-weight: 900;
  animation: combo-pop 0.5s ease, rainbow 1s linear infinite;
}

@keyframes combo-pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes glow-gold {
  0%, 100% {
    filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(255, 215, 0, 1));
  }
}

@keyframes rainbow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

.hud-actions {
  display: flex;
  gap: 6px;
}

.hud-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid var(--color-border);
  transition: transform 0.12s ease, background 0.12s ease;
}

.hud-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

.hud-btn:active {
  transform: scale(0.92);
}

/* ===== 点击数颜色分级 ===== */
.stat--clicks {
  min-width: 72px;
}

.clicks-value {
  font-size: 22px;
  font-weight: 900;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

/* 充裕（>= 30）：翠绿 */
.clicks--safe .clicks-value {
  color: #43a047;
  text-shadow: 0 0 10px rgba(67, 160, 71, 0.4);
}

/* 正常（16-30）：蓝青 */
.clicks--normal .clicks-value {
  color: #00acc1;
  text-shadow: 0 0 8px rgba(0, 172, 193, 0.35);
}

/* 紧张（6-15）：橙黄 */
.clicks--warn .clicks-value {
  color: #fb8c00;
  font-size: 24px;
  text-shadow: 0 0 10px rgba(251, 140, 0, 0.5);
}

/* 告急（1-5）：红色 + 脉冲闪烁 */
.clicks--danger .clicks-value {
  color: #f44336;
  font-size: 26px;
  text-shadow: 0 0 14px rgba(244, 67, 54, 0.7);
  animation: clicks-pulse 0.6s ease-in-out infinite;
}

/* 耗尽（0）：灰色 */
.clicks--empty .clicks-value {
  color: #9e9e9e;
  font-size: 26px;
}

@keyframes clicks-pulse {
  0%, 100% {
    transform: scale(1);
    text-shadow: 0 0 14px rgba(244, 67, 54, 0.7);
  }
  50% {
    transform: scale(1.2);
    text-shadow: 0 0 24px rgba(244, 67, 54, 1);
  }
}
</style>
