<template>
  <div class="prop-bar" :class="{ 'prop-bar--disabled': disabled }">
    <button
      class="prop-btn"
      :disabled="disabled || props.undo <= 0"
      @click="emit('undo')"
    >
      <span class="prop-icon">↩</span>
      <span class="prop-badge" v-if="props.undo > 0">{{ props.undo }}</span>
      <span class="prop-label">撤回</span>
    </button>

    <button
      class="prop-btn"
      :disabled="disabled || props.shuffle <= 0"
      @click="emit('shuffle')"
    >
      <span class="prop-icon">🔀</span>
      <span class="prop-badge" v-if="props.shuffle > 0">{{ props.shuffle }}</span>
      <span class="prop-label">洗牌</span>
    </button>

    <button
      class="prop-btn"
      :disabled="disabled || props.hint <= 0"
      @click="emit('hint')"
    >
      <span class="prop-icon">💡</span>
      <span class="prop-badge" v-if="props.hint > 0">{{ props.hint }}</span>
      <span class="prop-label">提示</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 道具栏（右下角浮动）
 * - 撤回 / 洗牌 / 提示 三个圆形按钮
 * - 显示剩余数量徽章；数量为 0 时禁用
 */
import type { GameProps } from '@game/types'

interface Props {
  props: GameProps
  disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'undo'): void
  (e: 'shuffle'): void
  (e: 'hint'): void
}>()
</script>

<style scoped>
.prop-bar {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  background: var(--color-bg-card);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-card);
}

.prop-bar--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.prop-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;
}

.prop-btn:hover:not(:disabled) {
  background: var(--color-primary);
  transform: translateY(-2px);
}

.prop-btn:active:not(:disabled) {
  transform: translateY(0);
}

.prop-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.prop-icon {
  font-size: 20px;
  line-height: 1;
}

.prop-label {
  font-size: 10px;
  color: var(--color-text-light);
  margin-top: 2px;
}

.prop-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--color-accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>
