<template>
  <div class="challenge">
    <!-- 顶部：返回 + 金币余额 -->
    <div class="challenge__header">
      <BaseButton size="md" type="ghost" @click="goHome">⬅ 返回</BaseButton>
      <div class="coin-balance">
        <span class="coin-balance__icon">🪙</span>
        <span class="coin-balance__num">{{ inventory.coin }}</span>
      </div>
    </div>

    <h1 class="challenge__title">⚡ 挑战模式</h1>
    <p class="challenge__subtitle">限时随机谜局，赢取门票与稀有收藏</p>

    <!-- 挑战规则 -->
    <div class="challenge__card rules">
      <div class="rules__row"><span class="rules__icon">🎫</span>门票 <b>100 金币</b>，通关返还</div>
      <div class="rules__row"><span class="rules__icon">🎲</span>随机动物组合与随机机制</div>
      <div class="rules__row"><span class="rules__icon">⏱️</span>限时 <b>240 秒</b>，超时失败</div>
      <div class="rules__row"><span class="rules__icon">🎁</span>通关掉落收藏品 + 额外道具</div>
      <div class="rules__row"><span class="rules__icon">💔</span>挑战失败，门票不返还</div>
    </div>

    <!-- 门票状态 -->
    <div class="challenge__card ticket" :class="{ 'ticket--lack': !canAfford }">
      <div class="ticket__label">当前门票</div>
      <div class="ticket__value">
        🪙 {{ inventory.coin }} / 100
      </div>
    </div>

    <!-- 开始挑战 -->
    <BaseButton
      class="challenge__start"
      size="lg"
      type="primary"
      :disabled="!canAfford"
      @click="startChallenge"
    >
      ⚡ 开始挑战
    </BaseButton>

    <!-- 轻提示 -->
    <div v-if="toast" class="toast" :class="`toast--${toastType}`">{{ toast }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * 挑战模式入口
 * - 展示挑战规则与金币门票余额
 * - 点击「开始挑战」扣 100 金币门票，成功进入 Game.vue 挑战局
 * - 金币不足按钮置灰并轻提示
 * - 通关返票与额外道具由 game.ts endGame 结算处理
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@components/common/BaseButton.vue'
import { useInventoryStore } from '@stores/inventory'

const TICKET_COST = 100

const router = useRouter()
const inventory = useInventoryStore()

/** 金币是否足够支付门票 */
const canAfford = computed(() => inventory.coin >= TICKET_COST)

/** 轻提示 */
const toast = ref('')
const toastType = ref<'success' | 'error'>('success')
let toastTimer: number | undefined

onMounted(() => {
  inventory.load()
})

function goHome(): void {
  clearToast()
  router.push('/')
}

async function startChallenge(): Promise<void> {
  clearToast()
  if (!canAfford.value) {
    toastType.value = 'error'
    toast.value = '金币不足，无法购买门票'
    toastTimer = window.setTimeout(clearToast, 2000)
    return
  }
  const ok = await inventory.spendCoin(TICKET_COST)
  if (!ok) {
    toastType.value = 'error'
    toast.value = '金币不足，无法购买门票'
    toastTimer = window.setTimeout(clearToast, 2000)
    return
  }
  router.push('/game/challenge')
}

function clearToast(): void {
  if (toastTimer) {
    window.clearTimeout(toastTimer)
    toastTimer = undefined
  }
  toast.value = ''
}
</script>

<style scoped>
.challenge {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 40px 40px;
  overflow-y: auto;
  background: linear-gradient(180deg, #fff5e1 0%, #ffe9c4 100%);
}

.challenge__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 560px;
}

.challenge__header :deep(.base-btn) {
  width: auto;
}

.coin-balance {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-card);
}

.coin-balance__icon {
  font-size: 20px;
}

.coin-balance__num {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-warning);
}

.challenge__title {
  margin-top: 24px;
  font-size: 34px;
  font-weight: 900;
  color: var(--color-text);
}

.challenge__subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: var(--color-text-light);
}

.challenge__card {
  width: 100%;
  max-width: 560px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

/* 规则卡 */
.rules {
  margin-top: 28px;
  padding: 20px 24px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rules__row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: var(--color-text);
}

.rules__row b {
  color: var(--color-primary-dark);
}

.rules__icon {
  font-size: 18px;
}

/* 门票卡 */
.ticket {
  margin-top: 20px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #fff8e6, #fff0d0);
  border: 2px solid #f0d59a;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ticket--lack {
  filter: grayscale(0.4);
  opacity: 0.75;
}

.ticket__label {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
}

.ticket__value {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-warning);
}

/* 开始按钮 */
.challenge__start {
  margin-top: 28px;
  width: 100%;
  max-width: 560px;
}

/* 轻提示 */
.toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: var(--radius-pill);
  font-weight: 700;
  color: #fff;
  box-shadow: var(--shadow-card);
  z-index: 10;
}

.toast--success {
  background: var(--color-secondary);
}

.toast--error {
  background: var(--color-danger);
}
</style>