<template>
  <transition name="dialog-fade">
    <div v-if="visible" class="dialog-mask" @click.self="handleMaskClick">
      <div class="dialog-box">
        <div class="dialog-header">
          <span class="dialog-title">{{ title }}</span>
        </div>
        <div class="dialog-body">
          <slot />
        </div>
        <div class="dialog-footer">
          <button v-if="cancelText" class="dialog-btn dialog-btn--cancel" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button v-if="confirmText" class="dialog-btn dialog-btn--confirm" @click="handleConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
/**
 * 通用对话框
 * - visible 双向绑定（v-model:visible）
 * - 点击遮罩默认不关闭，避免误触；可通过 cancel 关闭
 */
interface Props {
  visible: boolean
  title?: string
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  confirmText: '确定',
  cancelText: '取消'
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:visible', v: boolean): void
}>()

function close(): void {
  emit('update:visible', false)
}

function handleConfirm(): void {
  emit('confirm')
  close()
}

function handleCancel(): void {
  emit('cancel')
  close()
}

function handleMaskClick(): void {
  // 点击遮罩不直接关闭，仅在存在取消按钮时触发取消
  if (props.cancelText) {
    handleCancel()
  }
}
</script>

<style scoped>
.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(74, 60, 46, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.dialog-box {
  width: 70%;
  max-width: 520px;
  min-width: 280px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  border: 4px solid var(--color-primary);
}

.dialog-header {
  padding: 16px 20px 8px;
  text-align: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);
}

.dialog-body {
  padding: 8px 20px 20px;
  font-size: 14px;
  color: var(--color-text-light);
  line-height: 1.6;
  text-align: center;
}

.dialog-footer {
  display: flex;
  border-top: 2px solid var(--color-border);
}

.dialog-btn {
  flex: 1;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  background: none;
  border: none;
  transition: background 0.15s ease;
}

.dialog-btn--cancel {
  color: var(--color-text-light);
  border-right: 2px solid var(--color-border);
}
.dialog-btn--cancel:hover {
  background: var(--color-bg);
}

.dialog-btn--confirm {
  color: var(--color-primary-dark);
}
.dialog-btn--confirm:hover {
  background: #fff7eb;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-fade-enter-active .dialog-box,
.dialog-fade-leave-active .dialog-box {
  transition: transform 0.2s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
.dialog-fade-enter-from .dialog-box,
.dialog-fade-leave-to .dialog-box {
  transform: scale(0.9);
}
</style>
