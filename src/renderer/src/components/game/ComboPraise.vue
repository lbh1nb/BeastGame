<template>
  <Transition name="praise">
    <div
      v-if="visible"
      class="combo-praise"
      :class="`praise--${tier}`"
      :key="praiseKey"
    >
      <div class="praise-text">{{ praiseText }}</div>
      <div class="praise-sub">x{{ combo }} COMBO!</div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * 连击夸赞弹幕
 * - 由父组件控制 visible + tier + combo
 * - 不同等级有不同颜色、字号、动画
 * - 显示 ~1.2s 后自动隐藏
 */
import { ref, watch, computed } from 'vue'
import type { ComboTier } from '@audio/manager'

interface Props {
  visible: boolean
  tier: ComboTier
  combo: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'hide'): void
}>()

/** 用于强制重新触发动画 */
const praiseKey = ref(0)

/** 夸赞文案 */
const PRAISE_TEXT: Record<ComboTier, string> = {
  good: 'GOOD!',
  nice: 'NICE!',
  great: 'GREAT!',
  amazing: 'AMAZING!',
  unbelievable: 'UNBELIEVABLE!',
  godlike: 'GOD LIKE!'
}

const praiseText = computed(() => PRAISE_TEXT[props.tier])

let hideTimer: number | null = null

watch(
  () => props.visible,
  (v) => {
    if (v) {
      praiseKey.value++
      if (hideTimer) clearTimeout(hideTimer)
      hideTimer = window.setTimeout(() => {
        emit('hide')
      }, 1200)
    }
  }
)
</script>

<style scoped>
.combo-praise {
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  pointer-events: none;
  text-align: center;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.praise-text {
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 4px;
  font-style: italic;
}

.praise-sub {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
}

/* 等级配色 */
.praise--good .praise-text {
  color: #ffd54f;
}
.praise--nice .praise-text {
  color: #ffa726;
}
.praise--great .praise-text {
  color: #ff7043;
}
.praise--amazing .praise-text {
  color: #ab47bc;
  font-size: 56px;
}
.praise--unbelievable .praise-text {
  color: #ffd700;
  font-size: 60px;
  text-shadow: 0 0 16px #ffd700, 0 4px 8px rgba(0, 0, 0, 0.4);
}
.praise--godlike .praise-text {
  background: linear-gradient(
    90deg,
    #ff1744,
    #ff9100,
    #ffea00,
    #00e676,
    #00b0ff,
    #d500f9,
    #ff1744
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 64px;
  animation: rainbow 1s linear infinite;
}

@keyframes rainbow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

/* 弹出动画 */
.praise-enter-active {
  animation: praise-pop 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.praise-leave-active {
  transition: opacity 0.2s ease;
}

@keyframes praise-pop {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 1;
  }
  40% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  80% {
    transform: translate(-50%, -50%) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -70%) scale(1);
    opacity: 0;
  }
}
</style>
