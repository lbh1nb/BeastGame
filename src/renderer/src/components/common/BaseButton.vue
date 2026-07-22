<template>
  <button
    class="base-btn"
    :class="[`base-btn--${type}`, `base-btn--${size}`, { 'is-disabled': disabled }]"
    :disabled="disabled"
    @click="handleClick"
    @mouseenter="handleHover"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
/**
 * 通用按钮
 * - type:  primary 主色 / secondary 次色 / ghost 幽灵 / danger 危险
 * - size:  sm 小 / md 中 / lg 大
 * - 圆润 Q 萌风格，hover/active 有反馈
 * - hover 播放清脆叮声，click 播放点击音效
 */
import audioManager from '@audio/manager'

interface Props {
  type?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'md',
  disabled: false
})

const emit = defineEmits<{
  (e: 'click', evt: MouseEvent): void
}>()

function handleHover(): void {
  if (props.disabled) return
  audioManager.playHover()
}

function handleClick(evt: MouseEvent): void {
  if (props.disabled) return
  audioManager.playSfx('click')
  emit('click', evt)
}
</script>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  border: none;
  border-radius: var(--radius-pill);
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
  user-select: none;
  white-space: nowrap;
}

/* 尺寸 */
.base-btn--sm {
  padding: 6px 14px;
  font-size: 13px;
}
.base-btn--md {
  padding: 10px 22px;
  font-size: 15px;
}
.base-btn--lg {
  padding: 16px 28px;
  font-size: 18px;
}

/* 类型 */
.base-btn--primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 4px 0 var(--color-primary-dark);
}
.base-btn--primary:hover {
  filter: brightness(1.05);
}
.base-btn--primary:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--color-primary-dark);
}

.base-btn--secondary {
  background: var(--color-secondary);
  color: #fff;
  box-shadow: 0 4px 0 #4cb390;
}
.base-btn--secondary:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #4cb390;
}

.base-btn--ghost {
  background: var(--color-bg-card);
  color: var(--color-text);
  border: 2px solid var(--color-border);
  box-shadow: 0 3px 0 var(--color-border);
}
.base-btn--ghost:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--color-border);
}

.base-btn--danger {
  background: var(--color-danger);
  color: #fff;
  box-shadow: 0 4px 0 #b91c1c;
}
.base-btn--danger:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #b91c1c;
}

/* 禁用 */
.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  box-shadow: none;
  transform: none;
}
</style>
