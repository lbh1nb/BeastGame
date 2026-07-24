<template>
  <transition name="mec-fade">
    <div v-if="visible" class="mec-mask" @click.self="dismiss">
      <div class="mec-box">
        <!-- 代表动物 -->
        <div class="mec-animal">
          <PixelAnimal :animal="animal" :hover="false" :size="64" />
        </div>
        <!-- 标题 -->
        <div class="mec-title">{{ title }}</div>
        <!-- 说明文字 -->
        <div class="mec-body">{{ body }}</div>
        <!-- 按钮 -->
        <button class="mec-btn" @click="dismiss">知道了！</button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AnimalType } from '@game/types'
import PixelAnimal from './PixelAnimal.vue'

interface Props {
  animal: AnimalType
  title: string
  body: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()

const visible = ref(true)

function dismiss(): void {
  visible.value = false
  emit('dismiss')
}
</script>

<style scoped>
.mec-mask {
  position: fixed;
  inset: 0;
  background: rgba(30, 30, 30, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.mec-box {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 30px 28px 24px;
  text-align: center;
  max-width: 320px;
  width: 75%;
  box-shadow: 0 16px 40px rgba(0,0,0,0.3);
  border: 3px solid var(--color-primary);
}

.mec-animal {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
}

.mec-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 10px;
}

.mec-body {
  font-size: 14px;
  color: var(--color-text-light);
  line-height: 1.7;
  margin-bottom: 22px;
}

.mec-btn {
  padding: 10px 40px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.mec-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 184, 77, 0.4);
}

.mec-btn:active {
  transform: translateY(1px);
}

.mec-fade-enter-active,
.mec-fade-leave-active {
  transition: opacity 0.25s ease;
}
.mec-fade-enter-from,
.mec-fade-leave-to {
  opacity: 0;
}
</style>
